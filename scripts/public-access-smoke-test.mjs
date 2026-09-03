import assert from "node:assert/strict";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => server.listen(0, "127.0.0.1", resolve).once("error", reject));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "promptdeck-public-"));
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
    PROMPTDECK_AUTH_ENABLED: "false",
    PROMPTDECK_ALLOW_SIGNUPS: "false",
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

async function json(pathname, options = {}) {
  const response = await fetch(`${origin}${pathname}`, options);
  const body = await response.json().catch(() => null);
  return { response, body };
}

try {
  await waitForServer();

  const app = await fetch(origin);
  assert.equal(app.status, 200, "공개 방문자가 앱 첫 화면에 바로 접근해야 함");
  assert.match(await app.text(), /PromptDeck/);

  let result = await json("/api/auth/has-users");
  assert.equal(result.response.status, 200);
  assert.equal(result.body.authEnabled, false);
  assert.equal(result.body.hasUsers, false);

  result = await json("/api/public-info");
  assert.equal(result.body.authEnabled, false);
  assert.equal(result.body.allowSignups, false);

  for (const pathname of ["/login.html", "/signup.html", "/admin.html"]) {
    const page = await fetch(`${origin}${pathname}`, { redirect: "manual" });
    assert.equal(page.status, 302, `${pathname}은 공개 앱으로 돌려보내야 함`);
    assert.equal(page.headers.get("location"), "/app");
  }

  result = await json("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ username: "admin", password: "unused" }),
  });
  assert.equal(result.response.status, 404, "로그인 API가 비활성화되어야 함");

  result = await json("/api/admin-settings", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ programName: "blocked" }),
  });
  assert.equal(result.response.status, 404, "관리 설정 변경 API가 비활성화되어야 함");

  result = await json("/api/config");
  assert.equal(result.response.status, 200, "공개 방문자가 이미지 생성 설정을 조회할 수 있어야 함");
  assert.equal("googleApiKey" in result.body, false, "공개 설정에 비밀 키가 노출되면 안 됨");

  result = await json("/api/generate-image", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ title: "public test", prompt: "clean abstract presentation background", privacyConfirmed: true }),
  });
  assert.equal(result.response.status, 200, "공개 방문자의 일반 이미지 생성 API가 동작해야 함");
  assert.match(result.body.url, /^\/outputs\/users\/0000000000000000\//);

  const generated = await fetch(`${origin}${result.body.url}`);
  assert.equal(generated.status, 200, "공개 모드에서 생성 결과 이미지를 읽을 수 있어야 함");

  const privateData = await fetch(`${origin}/outputs/_private/auth.json`);
  assert.equal(privateData.status, 403, "공개 모드에서도 비공개 저장소는 차단해야 함");

  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${origin}/app`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.documentElement.style.visibility !== "hidden");
    assert.equal(new URL(page.url()).pathname, "/index.html", "브라우저가 작업 앱 대신 로그인 화면으로 이동하면 안 됨");
    assert.equal(await page.locator("#tabBtnCommonPrompt").isVisible(), true, "첫 작업 탭이 바로 보여야 함");
    assert.equal(await page.locator("#userBar").isVisible(), false, "계정·관리 사용자 바가 숨겨져야 함");
    assert.equal(await page.locator("#photoTransformPreviewAdminBtn").isVisible(), false, "미리보기 관리 버튼이 숨겨져야 함");

    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobilePage.goto(`${origin}/app`, { waitUntil: "domcontentloaded" });
    await mobilePage.waitForFunction(() => document.documentElement.style.visibility !== "hidden");
    assert.equal(await mobilePage.locator("[data-tab-group-filter]").count(), 3, "모바일 목적 탭은 3개여야 함");
    assert.equal(await mobilePage.locator(".app-header").evaluate((element) => getComputedStyle(element).position), "sticky", "모바일 브랜드 헤더가 고정 앱 셸로 유지되어야 함");
    await mobilePage.click("#appToolMenuBtn");
    await mobilePage.click('[data-tab-group-filter="visual"]');
    await mobilePage.click("#tabBtnPhotoTransform");
    await mobilePage.waitForSelector("#panePhotoTransform.active");
    await mobilePage.waitForFunction(() => document.querySelectorAll("#photoTransformGallery .pt-style-card").length === 18);
    assert.equal(await mobilePage.locator("#photoTransformGallery .pt-style-card").count(), 18, "모바일 사진 스타일은 18개만 우선 렌더링해야 함");
    assert.equal(await mobilePage.locator("#photoTransformGalleryMore").isVisible(), true, "모바일 사진 스타일 더 보기 버튼이 보여야 함");
    await mobilePage.close();
  } finally {
    await browser.close();
  }
} finally {
  child.kill("SIGTERM");
  await new Promise((resolve) => child.once("exit", resolve).once("error", resolve));
  await fs.rm(outputDir, { recursive: true, force: true });
}

console.log("public access smoke test passed");
