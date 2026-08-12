import assert from "node:assert/strict";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => server.listen(0, "127.0.0.1", resolve).once("error", reject));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "promptdeck-security-"));
const port = await freePort();
const origin = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ["server/local-server.js"], {
  cwd: path.resolve(import.meta.dirname, ".."),
  env: {
    ...process.env,
    NODE_ENV: "test",
    PROMPTDECK_HOST: "127.0.0.1",
    PROMPTDECK_PORT: String(port),
    PROMPTDECK_OUTPUT_DIR: outputDir,
    PROMPTDECK_AUTH_ENABLED: "true",
    PROMPTDECK_ALLOW_SIGNUPS: "false",
    PROMPTDECK_BOOTSTRAP_ADMIN_USERNAME: "security-admin",
    PROMPTDECK_BOOTSTRAP_ADMIN_PASSWORD: "Security-Smoke-Credential-2026!",
    PROMPTDECK_ADMIN_ACCESS_KEY: "",
    IMAGE_PROVIDER: "mock",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let serverOutput = "";
child.stdout.on("data", (chunk) => { serverOutput += chunk; });
child.stderr.on("data", (chunk) => { serverOutput += chunk; });

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`서버가 조기 종료되었습니다.\n${serverOutput}`);
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`서버 시작 시간 초과\n${serverOutput}`);
}

function cookieFrom(response) {
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

async function json(pathname, options = {}) {
  const response = await fetch(`${origin}${pathname}`, options);
  const body = await response.json().catch(() => null);
  return { response, body };
}

try {
  await waitForServer();

  for (const pathname of ["/privacy.html", "/terms.html", "/ai-policy.html", "/copyright-policy.html", "/third-party-notices.html"]) {
    const page = await fetch(`${origin}${pathname}`);
    assert.equal(page.status, 200, `${pathname} 공개 문서를 제공해야 함`);
    assert.match(String(page.headers.get("content-security-policy")), /default-src 'self'/);
    assert.doesNotMatch(String(page.headers.get("content-security-policy")), /images\.unsplash\.com/);
  }

  let result = await json("/api/config");
  assert.equal(result.response.status, 401, "설정 조회는 인증이 필요해야 함");

  const dotEnv = await fetch(`${origin}/.env`);
  assert.equal(dotEnv.status, 403, "dotfile 정적 제공을 차단해야 함");

  result = await json("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "security-admin", password: "Security-Smoke-Credential-2026!" }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal("token" in result.body, false, "세션 토큰이 JSON에 노출되면 안 됨");
  const cookie = cookieFrom(result.response);
  assert.match(cookie, /^promptdeck_session=/);
  assert.match(String(result.response.headers.get("set-cookie")), /HttpOnly/i);
  assert.match(String(result.response.headers.get("set-cookie")), /SameSite=Strict/i);

  result = await json("/api/config", { headers: { cookie } });
  assert.equal(result.response.status, 200);
  assert.equal("googleApiKey" in result.body, false, "API 키 일부도 응답에 노출되면 안 됨");

  result = await json("/api/admin-settings", {
    method: "POST",
    headers: { cookie, "content-type": "application/json", origin },
    body: JSON.stringify({ programName: "Security Test", unsplashKey: "test-unsplash-secret" }),
  });
  assert.equal(result.response.status, 200);
  result = await json("/api/admin-settings", { headers: { cookie } });
  assert.equal("unsplashKey" in result.body, false, "Unsplash 키가 관리자에게도 다시 노출되면 안 됨");
  assert.equal(result.body.hasUnsplashKey, true);

  result = await json("/api/auth/users", {
    method: "POST",
    headers: { cookie, "content-type": "application/json", origin },
    body: JSON.stringify({ username: "security-user", password: "Member-Strong-Credential-2026!", role: "user", adultConfirmed: true }),
  });
  assert.equal(result.response.status, 200);

  let userLogin = await json("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "security-user", password: "Member-Strong-Credential-2026!" }),
  });
  const userCookie = cookieFrom(userLogin.response);
  result = await json("/api/config", {
    method: "POST",
    headers: { cookie: userCookie, "content-type": "application/json", origin },
    body: JSON.stringify({ provider: "mock" }),
  });
  assert.equal(result.response.status, 403, "일반 사용자가 공급자·API 키 설정을 변경하면 안 됨");
  result = await json("/api/save-mixer-sample", {
    method: "POST",
    headers: { cookie: userCookie, "content-type": "application/json", origin },
    body: JSON.stringify({ medId: "test", idx: 0, image: "data:image/png;base64,AA==" }),
  });
  assert.equal(result.response.status, 403, "일반 사용자가 공용 믹서 샘플을 덮어쓰면 안 됨");
  result = await json("/api/unsplash/search?query=test&medId=test&idx=0", {
    headers: { cookie: userCookie },
  });
  assert.equal(result.response.status, 403, "일반 사용자가 Unsplash 결과를 공용 샘플로 가져오면 안 됨");

  const onePixelPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
  result = await json("/api/save-mixer-sample", {
    method: "POST",
    headers: { cookie, "content-type": "application/json", origin },
    body: JSON.stringify({ medId: "security-local", idx: 0, image: `data:image/png;base64,${onePixelPng}` }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.url, "/outputs/mixer_samples/security-local_0.png");
  const localSample = await fetch(`${origin}${result.body.url}`, { headers: { cookie } });
  assert.equal(localSample.status, 200, "저장된 믹서 샘플은 로컬 출력 경로에서 제공되어야 함");
  const mixerManifest = JSON.parse(await fs.readFile(path.join(outputDir, "mixer_samples", "manifest.json"), "utf8"));
  assert.equal(mixerManifest["security-local"][0], result.body.url);
  result = await json("/api/reset-mixer-sample", {
    method: "POST",
    headers: { cookie, "content-type": "application/json", origin },
    body: JSON.stringify({ medId: "security-local", idx: 0 }),
  });
  assert.equal(result.response.status, 200);
  const removedSample = await fetch(`${origin}/outputs/mixer_samples/security-local_0.png`, { headers: { cookie } });
  assert.equal(removedSample.status, 404, "기본값 복원 시 로컬 샘플 파일도 삭제되어야 함");
  const resetManifest = JSON.parse(await fs.readFile(path.join(outputDir, "mixer_samples", "manifest.json"), "utf8"));
  assert.equal("security-local" in resetManifest, false);

  result = await json("/api/shorten-url", {
    method: "POST",
    headers: { cookie: userCookie, "content-type": "application/json", origin },
    body: JSON.stringify({ url: "https://example.com/public-page" }),
  });
  assert.equal(result.response.status, 200);
  assert.match(result.body.shortUrl, new RegExp(`^${origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/s/[A-Za-z0-9_-]{12}$`));
  const shortUrl = result.body.shortUrl;
  const redirect = await fetch(shortUrl, { redirect: "manual" });
  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.get("location"), "https://example.com/public-page");
  result = await json("/api/shorten-url", {
    method: "POST",
    headers: { cookie: userCookie, "content-type": "application/json", origin },
    body: JSON.stringify({ url: "https://example.com/private?token=secret" }),
  });
  assert.equal(result.response.status, 400, "토큰이 포함된 URL은 단축하면 안 됨");

  result = await json("/api/generate-image", {
    method: "POST",
    headers: { cookie, "content-type": "application/json", origin },
    body: JSON.stringify({ slideId: "test", title: "test", prompt: "clean prompt" }),
  });
  assert.equal(result.response.status, 400, "AI 전송 안내 확인이 없으면 거부해야 함");

  result = await json("/api/generate-image", {
    method: "POST",
    headers: { cookie, "content-type": "application/json", origin },
    body: JSON.stringify({ slideId: "test", title: "test", prompt: "clean prompt", privacyConfirmed: true }),
  });
  assert.equal(result.response.status, 200);
  assert.match(result.body.url, /^\/outputs\/users\/[a-f0-9]{16}\//);

  result = await json("/api/config", {
    method: "POST",
    headers: { cookie, "content-type": "application/json", origin: "https://attacker.example" },
    body: JSON.stringify({ provider: "mock" }),
  });
  assert.equal(result.response.status, 403, "교차 출처 상태변경 요청을 차단해야 함");

  const authFile = JSON.parse(await fs.readFile(path.join(outputDir, "_private", "auth.json"), "utf8"));
  assert.match(authFile.users[0].passwordHash, /^scrypt\$/);
  assert.equal("token" in authFile.sessions[0], false, "서버에도 원문 세션 토큰을 저장하면 안 됨");
  assert.match(authFile.sessions[0].tokenHash, /^[a-f0-9]{64}$/);

  const privateResponse = await fetch(`${origin}/outputs/_private/auth.json`, { headers: { cookie } });
  assert.equal(privateResponse.status, 403, "비공개 저장소는 관리자에게도 HTTP 제공하면 안 됨");

  const nestedServer = await fetch(`${origin}/${encodeURIComponent("비주얼 믹스 가이드")}/server/local-server.js`);
  assert.equal(nestedServer.status, 403, "중첩된 소스·백업 디렉터리도 정적으로 제공하면 안 됨");

  for (const blockedPath of [
    "/docs/nas-deployment.md",
    "/scripts/smoke-test.mjs",
    "/src/concept-mixer-presets/mediums.js.bak",
    "/index.template.html",
    "/tmp/common-prompt-audit-20260717/summary.md",
  ]) {
    const blockedResponse = await fetch(`${origin}${blockedPath}`);
    assert.equal(blockedResponse.status, 403, `${blockedPath} 개발·백업·임시 파일을 공개하면 안 됨`);
  }

  result = await json("/api/auth/me/delete", {
    method: "POST",
    headers: { cookie: userCookie, "content-type": "application/json", origin },
    body: JSON.stringify({ currentPassword: "Member-Strong-Credential-2026!", confirmation: "회원탈퇴" }),
  });
  assert.equal(result.response.status, 200);
  result = await json("/api/auth/me", { headers: { cookie: userCookie } });
  assert.equal(result.response.status, 401, "탈퇴 즉시 세션이 무효화되어야 함");
  const deletedShortLink = await fetch(shortUrl, { redirect: "manual" });
  assert.equal(deletedShortLink.status, 404, "탈퇴 시 단축주소도 삭제되어야 함");

} finally {
  child.kill("SIGTERM");
  await new Promise((resolve) => child.once("exit", resolve).once("error", resolve));
  await fs.rm(outputDir, { recursive: true, force: true });
}

const productionOutputDir = await fs.mkdtemp(path.join(os.tmpdir(), "promptdeck-production-guard-"));
try {
  const guardChild = spawn(process.execPath, ["server/local-server.js"], {
    cwd: path.resolve(import.meta.dirname, ".."),
    env: {
      ...process.env,
      NODE_ENV: "production",
      PROMPTDECK_OUTPUT_DIR: productionOutputDir,
      PROMPTDECK_BOOTSTRAP_ADMIN_USERNAME: "production-guard-admin",
      PROMPTDECK_BOOTSTRAP_ADMIN_PASSWORD: "Production-Guard-Credential-2026!",
      PROMPTDECK_PUBLIC_BASE_URL: "",
      PROMPTDECK_OPERATOR_NAME: "",
      PROMPTDECK_OPERATOR_ADDRESS: "",
      PROMPTDECK_PRIVACY_OFFICER: "",
      PROMPTDECK_PRIVACY_EMAIL: "",
      IMAGE_PROVIDER: "mock",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let guardOutput = "";
  guardChild.stdout.on("data", (chunk) => { guardOutput += chunk; });
  guardChild.stderr.on("data", (chunk) => { guardOutput += chunk; });
  const guardExitCode = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      guardChild.kill("SIGTERM");
      reject(new Error("운영 배포 가드가 미설정 상태에서 서버 시작을 차단하지 못했습니다."));
    }, 5000);
    guardChild.once("exit", (code) => {
      clearTimeout(timeout);
      resolve(code);
    });
    guardChild.once("error", reject);
  });
  assert.notEqual(guardExitCode, 0, "필수 법적 정보가 없으면 운영 서버 시작이 실패해야 함");
  assert.match(guardOutput, /운영 배포 필수 설정|PROMPTDECK_PUBLIC_BASE_URL/);
} finally {
  await fs.rm(productionOutputDir, { recursive: true, force: true });
}

console.log("security smoke test passed");
