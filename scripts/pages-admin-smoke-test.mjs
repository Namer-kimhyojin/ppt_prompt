import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { chromium } from "playwright";

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => server.listen(0, "127.0.0.1", resolve).once("error", reject));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

const repoRoot = path.resolve(import.meta.dirname, "..");
const persistenceDir = await fs.mkdtemp(path.join(os.tmpdir(), "promptdeck-pages-admin-"));
const port = await freePort();
const origin = `http://127.0.0.1:${port}`;
const initialAccessKey = "CloudflareAdminSmoke2026";
const changedAccessKey = "CloudflareAdminSmokeChanged2026";
const sessionSecret = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const windowsNpxCliCandidates = [
  process.env.npm_execpath ? path.join(path.dirname(process.env.npm_execpath), "npx-cli.js") : "",
  path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js"),
].filter(Boolean);
const windowsNpxCli = windowsNpxCliCandidates.find((candidate) => existsSync(candidate));
if (process.platform === "win32" && !windowsNpxCli) throw new Error("Windows npx-cli.js path was not found");
const runner = process.platform === "win32" ? process.execPath : "npx";
const wranglerArgs = [
  "--yes",
  "wrangler@latest",
  "pages",
  "dev",
  "dist-static",
  "--ip",
  "127.0.0.1",
  "--port",
  String(port),
  "--persist-to",
  persistenceDir,
  "--kv",
  "PROMPTDECK_ADMIN_KV",
  "--binding",
  `PROMPTDECK_ADMIN_ACCESS_KEY=${initialAccessKey}`,
  "--binding",
  `PROMPTDECK_ADMIN_SESSION_SECRET=${sessionSecret}`,
  "--log-level",
  "error",
];
const runnerArgs = process.platform === "win32" ? [windowsNpxCli, ...wranglerArgs] : wranglerArgs;
const child = spawn(runner, runnerArgs, {
  cwd: repoRoot,
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});

let serverOutput = "";
child.stdout.on("data", (chunk) => { serverOutput += chunk; });
child.stderr.on("data", (chunk) => { serverOutput += chunk; });

async function waitForServer() {
  for (let attempt = 0; attempt < 480; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Pages dev server exited early\n${serverOutput}`);
    try {
      const response = await fetch(`${origin}/api/admin/access`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 125));
  }
  throw new Error(`Pages dev server startup timeout\n${serverOutput}`);
}

async function json(pathname, options = {}) {
  const response = await fetch(`${origin}${pathname}`, options);
  const body = await response.json().catch(() => null);
  return { response, body };
}

function postOptions(body, cookie = "") {
  const headers = { "content-type": "application/json", origin };
  if (cookie) headers.cookie = cookie;
  return { method: "POST", headers, body: JSON.stringify(body) };
}

function cookieFrom(response) {
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

try {
  await waitForServer();

  const publicAppResponse = await fetch(`${origin}/`, { cache: "no-store" });
  assert.equal(publicAppResponse.status, 200);
  const publicAppCsp = publicAppResponse.headers.get("content-security-policy") || "";
  const publicAppNonce = publicAppCsp.match(/'nonce-([^']+)'/u)?.[1] || "";
  assert.match(publicAppCsp, /'strict-dynamic'/u);
  assert.match(publicAppNonce, /^[a-f0-9]{32}$/u);
  const publicAppHtml = await publicAppResponse.text();
  const publicScriptTags = Array.from(publicAppHtml.matchAll(/<script\b([^>]*)>/gimu));
  assert.ok(publicScriptTags.length > 0);
  publicScriptTags.forEach((match) => {
    assert.match(match[1], new RegExp(`\\bnonce=["']${publicAppNonce}["']`, "iu"));
  });
  const secondPublicAppResponse = await fetch(`${origin}/`, { cache: "no-store" });
  const secondPublicAppNonce = (secondPublicAppResponse.headers.get("content-security-policy") || "")
    .match(/'nonce-([^']+)'/u)?.[1] || "";
  assert.match(secondPublicAppNonce, /^[a-f0-9]{32}$/u);
  assert.notEqual(secondPublicAppNonce, publicAppNonce);

  let result = await json("/api/admin/access");
  assert.equal(result.response.status, 200);
  assert.equal(result.body.enabled, true);
  assert.equal(result.body.authenticated, false);

  const lockedPage = await fetch(`${origin}/admin.html`, { redirect: "manual" });
  assert.equal(lockedPage.status, 302);
  assert.match(lockedPage.headers.get("location") || "", /admin=locked/u);
  const lockedCleanUrl = await fetch(`${origin}/admin`, { redirect: "manual" });
  assert.equal(lockedCleanUrl.status, 302);
  assert.match(lockedCleanUrl.headers.get("location") || "", /admin=locked/u);

  result = await json("/api/admin-settings", postOptions({ programName: "blocked" }));
  assert.equal(result.response.status, 403);

  for (let index = 0; index < 5; index += 1) {
    result = await json("/api/admin/access", postOptions({ accessKey: "wrong-key-value" }));
    assert.equal(result.response.status, 401);
  }
  result = await json("/api/admin/access", postOptions({ accessKey: "wrong-key-value" }));
  assert.equal(result.response.status, 429);

  result = await json("/api/admin/access", postOptions({ accessKey: initialAccessKey }));
  assert.equal(result.response.status, 200);
  let cookie = cookieFrom(result.response);
  assert.match(cookie, /^promptdeck_admin_session=/u);
  assert.match(result.response.headers.get("set-cookie") || "", /HttpOnly/iu);
  assert.match(result.response.headers.get("set-cookie") || "", /SameSite=Strict/iu);

  result = await json("/api/admin/access", { headers: { cookie } });
  assert.equal(result.body.authenticated, true);

  const adminPage = await fetch(`${origin}/admin.html`, { headers: { cookie } });
  assert.equal(adminPage.status, 200);
  assert.match(await adminPage.text(), /window\.PROMPTDECK_STATIC_MODE = true/u);

  result = await json("/api/admin-settings", postOptions({
    programName: "PromptDeck Pages Admin Test",
    programSubtitle: "Cloudflare Functions",
    adsEnabled: false,
  }, cookie));
  assert.equal(result.response.status, 200);

  result = await json("/api/admin-settings");
  assert.equal(result.response.status, 200);
  assert.equal(result.body.programName, "PromptDeck Pages Admin Test");

  result = await json("/api/admin/access", postOptions({
    currentAccessKey: initialAccessKey,
    newAccessKey: changedAccessKey,
    confirmAccessKey: changedAccessKey,
  }, cookie));
  assert.equal(result.response.status, 200);
  cookie = cookieFrom(result.response);

  result = await json("/api/admin/logout", postOptions({}, cookie));
  assert.equal(result.response.status, 200);
  result = await json("/api/admin/access", postOptions({ accessKey: initialAccessKey }));
  assert.equal(result.response.status, 401);
  result = await json("/api/admin/access", postOptions({ accessKey: changedAccessKey }));
  assert.equal(result.response.status, 200);

  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.route(/\.(?:avif|gif|jpe?g|png|webp)(?:\?.*)?$/iu, (route) => route.abort());
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    await page.locator(".brand-mark").evaluate((element) => {
      for (let index = 0; index < 7; index += 1) element.click();
    });
    await page.locator("#adminAccessDialog").waitFor({ state: "visible" });
    await page.fill("#adminAccessKey", changedAccessKey);
    await Promise.all([
      page.waitForURL(/\/admin(?:\.html)?$/u),
      page.click(".admin-access-submit"),
    ]);
    await page.waitForSelector("#admin-auth-guard", { state: "detached" });
    await page.waitForLoadState("load");
    await page.waitForFunction(() => document.getElementById("adminSessionName")?.textContent.trim());
    assert.equal(await page.locator("#adminSaveBtn").isVisible(), true);
    assert.equal(await page.locator("#adminApiIntegrationSection").isVisible(), false);
    assert.equal(await page.locator("#adminUserManagement").isVisible(), false);

    const logoutResponsePromise = page.waitForResponse((response) => (
      response.url() === `${origin}/api/admin/logout`
      && response.request().method() === "POST"
    ));
    await page.click("#adminModeExitBtn");
    const logoutResponse = await logoutResponsePromise;
    assert.equal(logoutResponse.status(), 200);
    await page.waitForURL((url) => !url.pathname.startsWith("/admin"));
    const relocked = await page.goto(`${origin}/admin.html`, { waitUntil: "domcontentloaded" });
    assert.equal(new URL(relocked.url()).searchParams.get("admin"), "locked");

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(origin, { waitUntil: "domcontentloaded" });
    await mobile.locator(".brand-mark").evaluate((element) => {
      for (let index = 0; index < 7; index += 1) element.click();
    });
    await mobile.locator("#adminAccessDialog").waitFor({ state: "visible" });
    const bounds = await mobile.locator("#adminAccessDialog").boundingBox();
    assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 390);
    await mobile.close();
  } finally {
    await browser.close();
  }
} finally {
  if (child.exitCode === null) {
    if (process.platform === "win32" && child.pid) {
      spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore", windowsHide: true });
    } else {
      child.kill("SIGTERM");
    }
    await new Promise((resolve) => {
      if (child.exitCode !== null) return resolve();
      const timeout = setTimeout(resolve, 5_000);
      child.once("exit", () => { clearTimeout(timeout); resolve(); });
      child.once("error", () => { clearTimeout(timeout); resolve(); });
    });
  }
  await fs.rm(persistenceDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}

console.log("Cloudflare Pages admin smoke test passed");
