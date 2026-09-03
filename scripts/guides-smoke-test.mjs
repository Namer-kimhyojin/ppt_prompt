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

try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewportSize: viewport });
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
    if (errors.length) throw new Error(`browser errors at ${viewport.width}px: ${errors.join(" | ")}`);
    await page.close();
  }
  console.log("Guide smoke test passed: 5 pages at desktop and mobile widths, no overflow or browser errors");
} finally {
  await browser.close();
  server.closeIdleConnections?.();
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
}
