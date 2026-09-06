#!/usr/bin/env node

import { createServer } from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..", "dist-static");
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"], [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"], [".png", "image/png"], [".svg", "image/svg+xml"],
  [".zip", "application/zip"],
]);

const skillDownloads = [
  "ppt-slide-planner-codex-20260903.zip.download",
  "ppt-slide-planner-claude-20260903.zip.download",
];

for (const filename of skillDownloads) {
  const stat = await fs.stat(path.join(root, "guides", "downloads", filename));
  if (!stat.isFile() || stat.size < 1024) throw new Error(`${filename} download asset is missing or empty`);
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://127.0.0.1");
    let pathname = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    if (!pathname || pathname.endsWith("/")) pathname += "index.html";
    else if (!path.extname(pathname)) pathname += ".html";
    const filePath = path.resolve(root, pathname);
    if (!filePath.startsWith(`${root}${path.sep}`)) throw new Error("invalid path");
    const body = await fs.readFile(filePath);
    response.writeHead(200, { "content-type": contentTypes.get(path.extname(filePath)) || "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch({ channel: "msedge", headless: true });
const expectedNavLabels = ["실무 가이드", "스킬 다운로드", "소개", "작업 도구 열기"];
const toolGuides = new Map([
  ["common-prompt", "commonPrompt"], ["slide-splitter", "generator"], ["form-image", "formImage"],
  ["map-image", "mapPrompt"], ["promotion-image", "promotion"], ["qr-code", "qrGenerator"],
  ["data-diagram", "dataDiagram"], ["label-ticket", "labelSheet"], ["concept-suggest", "promotionPlanner"],
  ["visual-mixer", "conceptMixer"], ["photo-transform", "photoTransform"],
]);

async function readPublicNav(page) {
  return page.evaluate(() => {
    const links = Array.from(document.querySelectorAll(".public-nav-links > a"));
    return {
      labels: links.map((link) => link.textContent.trim()),
      brandPath: new URL(document.querySelector(".public-brand")?.href || "", location.href).pathname,
      ctaPath: new URL(document.querySelector(".public-nav-cta")?.href || "", location.href).pathname,
      visibleLinkCount: links.filter((link) => link.getClientRects().length > 0).length,
      headerHeight: document.querySelector(".public-header")?.getBoundingClientRect().height || 0,
      featureDropdown: (document.querySelector(".public-nav-dd-toggle")?.textContent || "").trim(),
    };
  });
}

function matchesPublicNavContract(publicNav, expectedVisibleLinkCount) {
  return publicNav.labels.length === expectedNavLabels.length
    && publicNav.labels.every((label, index) => label === expectedNavLabels[index])
    && publicNav.brandPath === "/"
    && publicNav.ctaPath === "/app"
    && publicNav.featureDropdown === "기능"
    && publicNav.visibleLinkCount === expectedVisibleLinkCount;
}

try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));

    for (const route of [
      "/guides/",
      "/guides/ppt-slide-planner-skill",
      "/guides/ai-presentation-prompt",
      "/guides/data-diagram-prompt",
      "/guides/promotion-image-prompt",
    ]) {
      const response = await page.goto(`${origin}${route}`, { waitUntil: "networkidle" });
      if (!response?.ok()) throw new Error(`${route} returned HTTP ${response?.status()}`);
      const publicNav = await readPublicNav(page);
      const expectedVisibleLinkCount = viewport.width <= 820 ? 0 : 4;
      if (!matchesPublicNavContract(publicNav, expectedVisibleLinkCount)) {
        throw new Error(`${route} failed unified public navigation contract: ${JSON.stringify({ publicNav, viewport, expectedVisibleLinkCount })}`);
      }
      const metrics = await page.evaluate(() => ({
        h1Count: document.querySelectorAll("h1").length,
        hasCta: Boolean(document.querySelector(".guide-cta")),
        hasShare: Boolean(document.querySelector("[data-share-page]")),
        downloadCount: document.querySelectorAll('a[download$=".zip"][href$=".zip.download"]').length,
        uniqueDownloadCount: new Set(Array.from(document.querySelectorAll('a[download$=".zip"][href$=".zip.download"]'), (link) => link.href)).size,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      }));
      if (metrics.h1Count !== 1 || !metrics.hasCta || !metrics.hasShare || metrics.overflow) {
        throw new Error(`${route} failed responsive contract: ${JSON.stringify(metrics)}`);
      }
      if (["/guides/", "/guides/ppt-slide-planner-skill"].includes(route) && metrics.uniqueDownloadCount !== 2) {
        throw new Error(`${route} must expose two skill ZIP downloads: ${JSON.stringify(metrics)}`);
      }
      if (route === "/guides/ppt-slide-planner-skill") {
        for (const id of ["install", "codex-check", "claude-install", "claude-code-install", "install-help"]) {
          if (await page.locator(`#${id}`).count() !== 1) throw new Error(`Missing skill registration section: ${id}`);
        }
        const registrationText = await page.locator('.guide-content').textContent();
        for (const required of ['.agents', 'Upload a skill', '/ppt-slide-planner', 'SKILL.md.txt']) {
          if (!registrationText.includes(required)) throw new Error(`Missing skill registration instruction: ${required}`);
        }
        await page.evaluate(() => {
          window.__guideShareCopiedUrl = "";
          Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText: async (value) => { window.__guideShareCopiedUrl = value; } },
          });
        });
        await page.click("[data-share-page]");
        const opened = await page.locator("[data-share-panel]").isVisible();
        if (!opened) throw new Error("guide share panel did not open");
        await page.click("[data-share-copy]");
        await page.waitForFunction(() => document.querySelector(".guide-share-status")?.textContent === "주소 복사 완료");
        const copiedUrl = await page.evaluate(() => window.__guideShareCopiedUrl);
        if (copiedUrl !== page.url().split("#")[0]) throw new Error(`guide share copied an unexpected URL: ${copiedUrl}`);
        await page.keyboard.press("Escape");
        if (await page.locator("[data-share-panel]").isVisible()) throw new Error("guide share panel did not close with Escape");
      }
    }
    const toolHubResponse = await page.goto(`${origin}/guides/tools/`, { waitUntil: "networkidle" });
    if (!toolHubResponse?.ok()) throw new Error(`/guides/tools/ returned HTTP ${toolHubResponse?.status()}`);
    const toolHubMetrics = await page.evaluate(() => ({
      h1Count: document.querySelectorAll("h1").length,
      cardCount: document.querySelectorAll('a.guide-card[href^="/guides/tools/"]').length,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    }));
    if (toolHubMetrics.h1Count !== 1 || toolHubMetrics.cardCount !== toolGuides.size || toolHubMetrics.overflow) {
      throw new Error(`tool guide hub failed contract: ${JSON.stringify(toolHubMetrics)}`);
    }
    for (const [slug, tab] of toolGuides) {
      const route = `/guides/tools/${slug}`;
      const response = await page.goto(`${origin}${route}`, { waitUntil: "networkidle" });
      if (!response?.ok()) throw new Error(`${route} returned HTTP ${response?.status()}`);
      await page.locator(".tool-guide-visuals").scrollIntoViewIfNeeded();
      await page.waitForFunction(() => Array.from(document.querySelectorAll(".tool-screen-figure img")).every((image) => image.complete && image.naturalWidth > 300));
      const metrics = await page.evaluate((expectedTab) => ({
        h1Count: document.querySelectorAll("h1").length,
        stepCount: document.querySelectorAll(".guide-process > li").length,
        hasChecklist: Boolean(document.querySelector(".guide-checklist")),
        hasResult: Boolean(document.querySelector(".guide-result-band")),
        screenCount: document.querySelectorAll(".tool-screen-figure img[alt]").length,
        diagramNodeCount: document.querySelectorAll(".tool-concept-node").length,
        visualTocCount: document.querySelectorAll('.guide-toc a[href="#screen"], .guide-toc a[href="#concept"]').length,
        hasExactCta: Array.from(document.querySelectorAll("a.guide-cta")).some((link) => new URL(link.href).searchParams.get("tab") === expectedTab),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      }), tab);
      if (metrics.h1Count !== 1 || metrics.stepCount < 4 || !metrics.hasChecklist || !metrics.hasResult || metrics.screenCount !== 2 || metrics.diagramNodeCount !== 4 || metrics.visualTocCount !== 2 || !metrics.hasExactCta || metrics.overflow) {
        throw new Error(`${route} failed practical guide contract: ${JSON.stringify(metrics)}`);
      }
      const publicNav = await readPublicNav(page);
      const expectedVisibleLinkCount = viewport.width <= 820 ? 0 : 4;
      if (publicNav.brandPath !== "/" || publicNav.featureDropdown !== "기능" || publicNav.visibleLinkCount !== expectedVisibleLinkCount) {
        throw new Error(`${route} failed tool guide navigation contract: ${JSON.stringify(publicNav)}`);
      }
    }
    for (const route of ["/", "/features", "/about"]) {
      const response = await page.goto(`${origin}${route}`, { waitUntil: "networkidle" });
      if (!response?.ok()) throw new Error(`${route} returned HTTP ${response?.status()}`);
      if (route === '/features') {
        if (await page.locator('#skill-install .landing-install-card').count() !== 2) throw new Error('Features page must explain both skill registration methods');
        for (const target of ['install', 'claude-install', 'install-help']) {
          await page.locator(`#skill-install a[href$="#${target}"]`).click();
          await page.locator(`#${target}`).waitFor({ state: 'visible' });
          await page.goto(`${origin}/features`, { waitUntil: 'networkidle' });
        }
        if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)) throw new Error('Features skill registration section overflowed');
      }
      const publicNav = await readPublicNav(page);
      const expectedVisibleLinkCount = viewport.width <= 820 ? 0 : 4;
      if (!matchesPublicNavContract(publicNav, expectedVisibleLinkCount)) {
        throw new Error(`${route} failed unified public navigation contract: ${JSON.stringify({ publicNav, viewport, expectedVisibleLinkCount })}`);
      }
    }
    if (errors.length) throw new Error(`browser errors at ${viewport.width}px: ${errors.join(" | ")}`);
    await page.close();
  }
  console.log("Guide smoke test passed: public pages and 11 practical tool guides have valid navigation, actions, and responsive layouts");
} finally {
  await browser.close();
  server.closeIdleConnections?.();
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
}
