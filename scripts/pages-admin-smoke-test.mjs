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

  const publicAppResponse = await fetch(`${origin}/app`, { cache: "no-store" });
  assert.equal(publicAppResponse.status, 200);
  assert.match(publicAppResponse.headers.get("cache-control") || "", /\bno-store\b/iu);
  const publicAppEtag = publicAppResponse.headers.get("etag") || "";
  assert.ok(publicAppEtag);
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
  const conditionalPublicAppResponse = await fetch(`${origin}/app`, {
    headers: { "if-none-match": publicAppEtag },
  });
  assert.equal(conditionalPublicAppResponse.status, 200);
  assert.match(conditionalPublicAppResponse.headers.get("cache-control") || "", /\bno-store\b/iu);
  const conditionalPublicAppCsp = conditionalPublicAppResponse.headers.get("content-security-policy") || "";
  const conditionalPublicAppNonce = conditionalPublicAppCsp.match(/'nonce-([^']+)'/u)?.[1] || "";
  assert.match(conditionalPublicAppNonce, /^[a-f0-9]{32}$/u);
  assert.notEqual(conditionalPublicAppNonce, publicAppNonce);
  const conditionalPublicAppHtml = await conditionalPublicAppResponse.text();
  const conditionalScriptTags = Array.from(conditionalPublicAppHtml.matchAll(/<script\b([^>]*)>/gimu));
  assert.equal(conditionalScriptTags.length, publicScriptTags.length);
  conditionalScriptTags.forEach((match) => {
    assert.match(match[1], new RegExp(`\\bnonce=["']${conditionalPublicAppNonce}["']`, "iu"));
  });
  const secondPublicAppResponse = await fetch(`${origin}/app`, { cache: "no-store" });
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
  assert.equal(new URL(lockedPage.headers.get("location") || "", origin).pathname, "/app");
  assert.equal(new URL(lockedPage.headers.get("location") || "", origin).search, "");
  const lockedCleanUrl = await fetch(`${origin}/admin`, { redirect: "manual" });
  assert.equal(lockedCleanUrl.status, 302);
  assert.equal(new URL(lockedCleanUrl.headers.get("location") || "", origin).pathname, "/app");
  assert.equal(new URL(lockedCleanUrl.headers.get("location") || "", origin).search, "");

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

  result = await json("/api/admin-settings", postOptions({ pollinationsPublicKey: "pk_pages_fixture" }));
  assert.equal(result.response.status, 403);
  result = await json("/api/admin-settings", postOptions({ pollinationsPublicKey: "pk_pages_fixture" }, cookie));
  assert.equal(result.response.status, 200);
  result = await json("/api/admin-settings", postOptions({ pollinationsPublicKey: "sk_must_not_be_stored" }, cookie));
  assert.equal(result.response.status, 400);
  result = await json("/api/admin-settings", postOptions({ programSubtitle: "Keep saved key" }, cookie));
  assert.equal(result.response.status, 200);
  result = await json("/api/admin-settings");
  assert.equal(result.body.pollinationsPublicKey, "pk_pages_fixture");
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
    const browserSecurityErrors = [];
    const browserPageErrors = [];
    const adminResponses = [];
    page.on('response', async response => {
      if (!response.url().includes('/api/admin')) return;
      const data = await response.json().catch(() => ({}));
      adminResponses.push({ path: new URL(response.url()).pathname, method: response.request().method(), status: response.status(), authenticated: data.authenticated, hasKey: !!data.pollinationsPublicKey, expectedKey: data.pollinationsPublicKey === 'pk_saved_from_admin_ui' });
    });
    const waitForAdminKey = async expected => {
      await page.waitForFunction(value => document.getElementById('adminPollinationsKey')?.value === value, expected).catch(async error => {
        console.error('Admin key diagnostics', await page.evaluate(() => ({ path: location.pathname, ready: document.readyState, status: document.getElementById('adminPollinationsStatus')?.textContent, keyInputPresent: !!document.getElementById('adminPollinationsKey'), cachedKey: !!JSON.parse(localStorage.getItem('promptdeck_admin') || '{}').pollinationsPublicKey, resources: performance.getEntriesByType('resource').map(entry => ({path:new URL(entry.name).pathname, duration:entry.duration})).filter(entry => /admin|index/.test(entry.path)) })), adminResponses, browserPageErrors, browserSecurityErrors);
        throw error;
      });
    };
    page.on("console", (message) => {
      if (message.type() === "error" && /content security policy|violates.+script-src/iu.test(message.text())) {
        browserSecurityErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => browserPageErrors.push(error.stack || error.message));
    await page.route(/\.(?:avif|gif|jpe?g|png|webp)(?:\?.*)?$/iu, (route) => route.abort());
    let delayTabCatalog = true;
    await page.route('**/app.html', async route => {
      if (delayTabCatalog) {
        delayTabCatalog = false;
        await new Promise(resolve => setTimeout(resolve, 6000));
      }
      await route.continue().catch(() => {});
    });
    await page.goto(`${origin}/app`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.PromptDeckTabs));
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.PromptDeckTabs));
    const visiblePaneIds = await page.locator(".tab-pane").evaluateAll((panes) => panes
      .filter((pane) => getComputedStyle(pane).display !== "none" && pane.getClientRects().length > 0)
      .map((pane) => pane.id));
    assert.deepEqual(visiblePaneIds, ["paneCommonPrompt"]);
    assert.deepEqual(browserSecurityErrors, []);
    assert.deepEqual(browserPageErrors, []);
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
    assert.equal(await page.locator("#adminApiIntegrationSection").isVisible(), true);
    assert.equal(await page.locator("#adminUnsplashIntegration").isVisible(), false);
    await waitForAdminKey('pk_pages_fixture');
    await page.locator("#adminPollinationsKey").fill("sk_rejected_fixture");
    await page.locator("#adminPollinationsSaveBtn").click();
    await page.locator("#adminPollinationsStatus").getByText("비밀 키(sk_)는 저장할 수 없습니다.", { exact: false }).waitFor();
    await page.locator("#adminPollinationsKey").fill("pk_saved_from_admin_ui");
    await page.locator("#adminPollinationsSaveBtn").click();
    await page.waitForFunction(() => document.getElementById("adminPollinationsStatus")?.textContent.includes("키를 서버에 저장했습니다"));
    await page.reload();
    await waitForAdminKey('pk_saved_from_admin_ui');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#adminPollinationsKey").scrollIntoViewIfNeeded();
    const keyBounds = await page.locator("#adminPollinationsKey").boundingBox();
    assert.ok(keyBounds && keyBounds.x >= 0 && keyBounds.x + keyBounds.width <= 390);
    await page.goto(`${origin}/app`);
    await page.waitForFunction(() => window.PROMPTDECK_POLLINATIONS_PUBLIC_KEY === "pk_saved_from_admin_ui");
    await page.goto(`${origin}/admin.html`);
    await waitForAdminKey('pk_saved_from_admin_ui');
    await page.locator("#adminPollinationsClearBtn").click();
    await page.waitForFunction(() => document.getElementById("adminPollinationsStatus")?.textContent.includes("연동을 해제했습니다"));
    result = await json("/api/admin-settings");
    assert.equal(result.body.pollinationsPublicKey, "");
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
    assert.equal(new URL(relocked.url()).pathname, "/app");
    assert.equal(new URL(relocked.url()).search, "");

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(`${origin}/app`, { waitUntil: "domcontentloaded" });
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
