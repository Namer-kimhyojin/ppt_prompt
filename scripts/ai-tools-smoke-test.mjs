import assert from "node:assert/strict";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const repoRoot = path.resolve(import.meta.dirname, "..");
const options = { url: process.env.AI_TOOLS_BASE_URL || "", dist: path.join(repoRoot, "dist-static") };
for (const argument of process.argv.slice(2)) {
  if (argument === "--help") {
    console.log("Usage: node scripts/ai-tools-smoke-test.mjs [--url=https://promptdeck.kr] [--dist=<directory>]");
    process.exit(0);
  }
  if (argument.startsWith("--url=")) options.url = argument.slice(6);
  else if (argument.startsWith("--dist=")) options.dist = path.resolve(argument.slice(7));
  else throw new Error(`Unknown argument: ${argument}`);
}
if (options.url) {
  const parsed = new URL(options.url);
  assert(["http:", "https:"].includes(parsed.protocol), "--url must use HTTP or HTTPS");
  assert(["", "/"].includes(parsed.pathname), "--url must be a site origin");
  options.url = parsed.origin;
}

const manifest = JSON.parse(await fs.readFile(path.join(repoRoot, "content/ai-tools/_catalog.json"), "utf8"));
const records = await Promise.all(Object.entries(manifest.groups).flatMap(([type, entries]) => entries.map(async (entry) => {
  const record = JSON.parse(await fs.readFile(path.join(repoRoot, "content/ai-tools", entry.file), "utf8"));
  assert.equal(record.type, type, `${entry.id}: catalog type differs`);
  return record;
})));
const expectedCounts = Object.fromEntries(["skill", "plugin", "mcp"].map((type) => [type, records.filter((record) => record.type === type).length]));
assert.equal(records.length, manifest.stats.itemCount, "Manifest item count differs from its records");
assert.deepEqual(expectedCounts, manifest.stats.byType, "Manifest type counts differ from its records");
assert(Object.values(expectedCounts).every((count) => count > 0), "All three tool types must be represented");

const mime = new Map([
  [".html", "text/html; charset=utf-8"], [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"], [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"], [".png", "image/png"], [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"], [".webp", "image/webp"], [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"], [".txt", "text/plain; charset=utf-8"],
]);
const localServer = options.url ? null : http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const relative = pathname.replace(/^\/+/, "");
    const requested = path.resolve(options.dist, relative || "index.html");
    if (!requested.startsWith(`${options.dist}${path.sep}`) && requested !== options.dist) {
      response.writeHead(403).end();
      return;
    }
    const candidates = pathname === "/"
      ? [requested]
      : pathname.endsWith("/")
        ? [path.join(requested, "index.html")]
      : path.extname(requested)
        ? [requested]
        : [requested, `${requested}.html`, path.join(requested, "index.html")];
    let filename;
    for (const candidate of candidates) {
      const stat = await fs.stat(candidate).catch(() => null);
      if (stat?.isFile()) { filename = candidate; break; }
    }
    if (!filename) { response.writeHead(404).end("Not found"); return; }
    response.writeHead(200, {
      "content-type": mime.get(path.extname(filename)) || "application/octet-stream",
      "cache-control": "no-store",
    });
    if (request.method === "HEAD") response.end();
    else createReadStream(filename).pipe(response);
  } catch {
    response.writeHead(400).end("Bad request");
  }
});

let browser;
let origin;
const failures = [];
const checks = [];
const browserIssues = new Set();
const visibleCards = (page) => page.locator("[data-ai-tool]:visible");

async function runCheck(label, operation) {
  try {
    await operation();
    checks.push(label);
    console.log(`[ai-tools] PASS ${label}`);
  } catch (error) {
    failures.push(`${label}: ${error.stack || error.message}`);
    console.error(`[ai-tools] FAIL ${label}: ${error.message}`);
  }
}

function monitor(page) {
  page.on("pageerror", (error) => browserIssues.add(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") browserIssues.add(`console: ${message.text()}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && new URL(response.url()).origin === origin) {
      browserIssues.add(`HTTP ${response.status()}: ${response.url()}`);
    }
  });
  page.on("requestfailed", (request) => {
    if (new URL(request.url()).origin === origin && request.failure()?.errorText !== "net::ERR_ABORTED") {
      browserIssues.add(`request failed: ${request.url()} ${request.failure()?.errorText}`);
    }
  });
}

async function openPage(page, pathname) {
  const response = await page.goto(`${origin}${pathname}`, { waitUntil: "load", timeout: 30_000 });
  assert(response?.ok(), `${pathname}: HTTP ${response?.status()}`);
  await page.locator("h1").first().waitFor({ state: "visible" });
}

async function expectVisibleCount(page, count) {
  await page.waitForFunction((expected) => [...document.querySelectorAll("[data-ai-tool]")]
    .filter((element) => element.getClientRects().length && getComputedStyle(element).visibility !== "hidden").length === expected,
  count, { timeout: 7_000 });
  assert.equal(await visibleCards(page).count(), count);
  assert.match(await page.locator("#aiToolsCount").innerText(), new RegExp(String(count)), "Visible result count is not announced");
}

async function expectNoOverflow(page, label) {
  const layout = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
    offenders: [...document.querySelectorAll("main *, header *, footer *")]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.right > innerWidth + 1 || rect.left < -1);
      })
      .slice(0, 8)
      .map((element) => `${element.tagName.toLowerCase()}#${element.id}.${String(element.className).slice(0, 80)}`),
  }));
  assert(layout.scroll <= layout.viewport + 1, `${label}: horizontal overflow ${JSON.stringify(layout)}`);
}

async function expectNavEntry(page) {
  const entry = page.locator('.public-nav a[href="/ai-tools/"]').first();
  assert.equal(await entry.count(), 1, "Public navigation omits AI 업무 도구");
  const toggle = page.locator(".public-nav-toggle");
  let opened = false;
  if (!(await entry.isVisible())) {
    assert(await toggle.isVisible(), "Hidden AI tools link has no mobile menu control");
    await toggle.click();
    opened = true;
  }
  await entry.waitFor({ state: "visible" });
  assert.match(await entry.innerText(), /AI 업무 도구/);
  if (opened) {
    await page.keyboard.press("Escape");
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  }
}

try {
  if (localServer) {
    await fs.access(path.join(options.dist, "ai-tools/index.html"));
    await new Promise((resolve, reject) => {
      localServer.once("error", reject);
      localServer.listen(0, "127.0.0.1", resolve);
    });
  }
  origin = options.url || `http://127.0.0.1:${localServer.address().port}`;
  const explicitChannel = process.env.AI_TOOLS_BROWSER_CHANNEL || "";
  try {
    browser = await chromium.launch({ channel: explicitChannel || "msedge", headless: true });
  } catch (error) {
    if (explicitChannel) throw error;
    browser = await chromium.launch({ headless: true });
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin });
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  monitor(page);

  await runCheck("catalog cards and filters", async () => {
    await openPage(page, "/ai-tools/");
    assert.match(await page.locator("h1").innerText(), /AI 업무 도구/);
    assert.equal(await page.locator("[data-ai-tool]").count(), records.length);
    await expectVisibleCount(page, records.length);
    for (const [type, count] of Object.entries(expectedCounts)) {
      await page.locator(`[data-type-filter="${type}"]`).click();
      await expectVisibleCount(page, count);
      assert.equal(await page.locator(`[data-type-filter="${type}"]`).getAttribute("aria-pressed"), "true");
      assert.equal(new URL(page.url()).searchParams.get("type"), type);
      assert.deepEqual(await visibleCards(page).evaluateAll((cards) => [...new Set(cards.map((card) => card.dataset.type))]), [type]);
    }
    await page.locator('[data-type-filter="all"]').click();
    await expectVisibleCount(page, records.length);
  });

  await runCheck("search, empty result, category", async () => {
    await openPage(page, "/ai-tools/");
    await page.locator("#aiToolsSearch").fill("Notion");
    await expectVisibleCount(page, 1);
    assert.match(await visibleCards(page).innerText(), /Notion/);
    await page.waitForURL((url) => url.searchParams.get("q") === "Notion");
    assert.equal(new URL(page.url()).searchParams.get("q"), "Notion");
    await page.locator("#aiToolsSearch").fill("no-such-tool-84729");
    await expectVisibleCount(page, 0);
    assert(await page.locator("#aiToolsEmpty").isVisible(), "No-results guidance is missing");
    await page.locator("#aiToolsSearch").fill("");
    await expectVisibleCount(page, records.length);
    assert(!(await page.locator("#aiToolsEmpty").isVisible()), "No-results guidance persists after clearing search");
    const category = records.find((record) => record.id === "notion-mcp").categories[0];
    await page.locator("#aiToolsCategory").selectOption(category);
    const expected = records.filter((record) => record.categories.includes(category)).length;
    await expectVisibleCount(page, expected);
    assert.equal(new URL(page.url()).searchParams.get("category"), category);
  });

  await runCheck("query reload and history restoration", async () => {
    await openPage(page, "/ai-tools/?type=mcp&q=Notion");
    await expectVisibleCount(page, 1);
    assert.equal(await page.locator("#aiToolsSearch").inputValue(), "Notion");
    assert.equal(await page.locator('[data-type-filter="mcp"]').getAttribute("aria-pressed"), "true");
    await page.reload({ waitUntil: "load" });
    await expectVisibleCount(page, 1);
    await openPage(page, "/ai-tools/");
    await page.locator('[data-type-filter="skill"]').click();
    await expectVisibleCount(page, expectedCounts.skill);
    await page.locator('[data-type-filter="plugin"]').click();
    await expectVisibleCount(page, expectedCounts.plugin);
    await page.goBack({ waitUntil: "load" });
    await expectVisibleCount(page, expectedCounts.skill);
    assert.equal(new URL(page.url()).searchParams.get("type"), "skill");
    assert.equal(await page.locator('[data-type-filter="skill"]').getAttribute("aria-pressed"), "true");
  });

  await runCheck("all detail links, titles, official sources and evidence", async () => {
    await openPage(page, "/ai-tools/");
    const hrefs = await page.locator("[data-ai-tool] a[href]").evaluateAll((links) => links.map((link) => new URL(link.href).pathname));
    for (const record of records) {
      const pathname = `/ai-tools/${record.slug}/`;
      assert(hrefs.includes(pathname), `${record.id}: catalog detail link is missing`);
      await openPage(page, pathname);
      const heading = (await page.locator("h1").innerText()).replace(/\s+/g, " ");
      assert(heading.includes(record.name) || heading.includes(record.outcome.replace(/\s+/g, " ")), `${record.id}: unexpected detail heading ${heading}`);
      const links = await page.locator("main a[href]").evaluateAll((elements) => elements.map((element) => element.href));
      assert(links.includes(new URL(record.officialUrl).href), `${record.id}: official source link missing`);
      const videoIds = new Set(links.flatMap((href) => {
        const url = new URL(href);
        return /(^|\.)youtube\.com$/.test(url.hostname) && url.searchParams.get("v") ? [url.searchParams.get("v")] : [];
      }));
      assert(videoIds.size >= 2, `${record.id}: fewer than two source videos displayed`);
      assert.match(await page.locator("main").innerText(), /미검증|실행.*확인.*않|실행.*확인 전|실행.*시험.*않|실행.*미확인/, `${record.id}: execution status is missing`);
    }
  });

  await runCheck("first request clipboard copy", async () => {
    await openPage(page, "/ai-tools/notion-mcp/");
    const button = page.locator("[data-copy-target]").first();
    const target = await button.getAttribute("data-copy-target");
    assert(target, "Copy target is missing");
    const expected = await page.evaluate((value) => document.getElementById(value.replace(/^#/, ""))?.textContent?.trim(), target);
    assert(expected?.length > 10, "Copy target does not contain the starter prompt");
    await button.click();
    await page.waitForFunction(async (value) => (await navigator.clipboard.readText()).trim() === value, expected);
    assert.equal((await page.evaluate(() => navigator.clipboard.readText())).trim(), expected);
  });

  await runCheck("starter, updates, workflows and original guide", async () => {
    for (const pathname of ["/ai-tools/start/", "/ai-tools/updates/", "/ai-tools/workflows/", "/guides/ppt-slide-planner-skill"]) {
      await openPage(page, pathname);
      assert((await page.locator("h1").innerText()).trim().length > 0, `${pathname}: heading missing`);
      await expectNavEntry(page);
    }
    const downloads = await page.locator('a[download], a[href*="ppt-slide-planner"][href*="zip"]').evaluateAll((links) => [...new Set(links.map((link) => link.href))]);
    assert(downloads.length >= 2, "Existing Codex/Claude download links disappeared");
    for (const url of downloads) {
      const response = await context.request.get(url);
      assert(response.ok(), `Existing download failed: ${response.status()} ${url}`);
      await response.dispose();
    }
  });

  await runCheck("home navigation reaches catalog", async () => {
    await openPage(page, "/");
    await expectNavEntry(page);
    await page.locator('.public-nav a[href="/ai-tools/"]').first().click();
    await page.locator("#aiToolsSearch").waitFor({ state: "visible" });
    assert.equal(new URL(page.url()).pathname.replace(/\/$/, ""), "/ai-tools");
    await expectVisibleCount(page, records.length);
  });

  for (const [width, height] of [[1440, 1000], [390, 844], [375, 667], [844, 390]]) {
    await runCheck(`responsive navigation and content ${width}x${height}`, async () => {
      await page.setViewportSize({ width, height });
      for (const pathname of ["/ai-tools/", "/ai-tools/notion-mcp/", "/ai-tools/anthropic-pptx/", "/ai-tools/start/", "/ai-tools/updates/", "/ai-tools/workflows/"]) {
        await openPage(page, pathname);
        await expectNavEntry(page);
        await expectNoOverflow(page, `${pathname} ${width}x${height}`);
      }
      await openPage(page, "/ai-tools/");
      await page.locator('[data-type-filter="plugin"]').click();
      await expectVisibleCount(page, expectedCounts.plugin);
      await expectNoOverflow(page, `plugin filter ${width}x${height}`);
    });
  }

  await runCheck("sitemap and feed preserve guide and include catalog", async () => {
    const sitemapResponse = await context.request.get(`${origin}/sitemap.xml`);
    assert(sitemapResponse.ok(), "Sitemap request failed");
    const sitemap = await sitemapResponse.text();
    assert(sitemap.includes("/guides/ppt-slide-planner-skill"), "Sitemap lost existing skill guide");
    assert(sitemap.includes("/ai-tools/"), "Sitemap omits catalog");
    for (const record of records) assert(sitemap.includes(`/ai-tools/${record.slug}/`), `Sitemap omits ${record.id}`);
    const feedResponse = await context.request.get(`${origin}/feed.xml`);
    assert(feedResponse.ok(), "Feed request failed");
    const feed = await feedResponse.text();
    assert(feed.includes("/guides/"), "Feed lost existing guides");
    assert(feed.includes("/ai-tools/"), "Feed omits AI tools update");
  });

  if (browserIssues.size) failures.push(`Browser errors: ${[...browserIssues].join("\n")}`);
  console.log(JSON.stringify({ origin, passedChecks: checks.length, failures: failures.length, items: records.length, typeCounts: expectedCounts }, null, 2));
  if (failures.length) throw new Error(failures.join("\n\n"));
} finally {
  if (browser) await browser.close();
  if (localServer?.listening) {
    localServer.closeAllConnections();
    await new Promise((resolve) => localServer.close(resolve));
  }
}
