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

const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "promptdeck-admin-mode-"));
const port = await freePort();
const origin = `http://127.0.0.1:${port}`;
const accessKey = "Admin-Mode-Smoke-Key-2026!";
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
    PROMPTDECK_ADMIN_ACCESS_KEY: accessKey,
    IMAGE_PROVIDER: "mock",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let serverOutput = "";
child.stdout.on("data", (chunk) => { serverOutput += chunk; });
child.stderr.on("data", (chunk) => { serverOutput += chunk; });

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`server exited early\n${serverOutput}`);
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`server startup timeout\n${serverOutput}`);
}

async function json(pathname, options = {}) {
  const response = await fetch(`${origin}${pathname}`, options);
  const body = await response.json().catch(() => null);
  return { response, body };
}

function cookieFrom(response) {
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

try {
  await waitForServer();

  let result = await json("/api/admin/access");
  assert.equal(result.response.status, 200);
  assert.equal(result.body.enabled, true);
  assert.equal(result.body.authenticated, false);

  const lockedPage = await fetch(`${origin}/admin.html`, { redirect: "manual" });
  assert.equal(lockedPage.status, 302);
  assert.equal(lockedPage.headers.get("location"), "/?admin=locked");

  result = await json("/api/admin-settings", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ programName: "blocked" }),
  });
  assert.equal(result.response.status, 403);

  for (let index = 0; index < 5; index += 1) {
    result = await json("/api/admin/access", {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ accessKey: "wrong-key-value" }),
    });
    assert.equal(result.response.status, 401);
  }
  result = await json("/api/admin/access", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ accessKey: "wrong-key-value" }),
  });
  assert.equal(result.response.status, 429);

  result = await json("/api/admin/access", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ accessKey }),
  });
  assert.equal(result.response.status, 200);
  const cookie = cookieFrom(result.response);
  assert.match(cookie, /^promptdeck_admin_session=/);
  assert.match(String(result.response.headers.get("set-cookie")), /HttpOnly/i);
  assert.match(String(result.response.headers.get("set-cookie")), /SameSite=Strict/i);

  result = await json("/api/admin/access", { headers: { cookie } });
  assert.equal(result.body.authenticated, true);

  const adminPage = await fetch(`${origin}/admin.html`, { headers: { cookie } });
  assert.equal(adminPage.status, 200);

  result = await json("/api/admin-settings", {
    method: "POST",
    headers: { cookie, "content-type": "application/json", origin },
    body: JSON.stringify({ programName: "Admin Mode Test" }),
  });
  assert.equal(result.response.status, 200);

  result = await json("/api/admin/logout", {
    method: "POST",
    headers: { cookie, "content-type": "application/json", origin },
  });
  assert.equal(result.response.status, 200);
  result = await json("/api/admin/access", { headers: { cookie } });
  assert.equal(result.body.authenticated, false);

  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    await page.locator(".brand-mark").evaluate((element) => {
      for (let index = 0; index < 7; index += 1) element.click();
    });
    await page.locator("#adminAccessDialog").waitFor({ state: "visible" });
    await page.fill("#adminAccessKey", accessKey);
    await Promise.all([
      page.waitForURL(/\/admin\.html$/),
      page.click(".admin-access-submit"),
    ]);
    await page.waitForSelector("#admin-auth-guard", { state: "detached" });
    assert.equal(await page.locator("#adminSaveBtn").isVisible(), true);
    assert.equal(await page.locator("#adminUserManagement").isVisible(), false);
    assert.match((await page.locator("#adminSessionName").textContent()) || "", /\uAD00\uB9AC\uC790/);

    await Promise.all([
      page.waitForURL((url) => ["/", "/index.html"].includes(url.pathname)),
      page.click("#adminModeExitBtn"),
    ]);
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
  child.kill("SIGTERM");
  await new Promise((resolve) => child.once("exit", resolve).once("error", resolve));
  await fs.rm(outputDir, { recursive: true, force: true });
}

console.log("admin mode smoke test passed");
