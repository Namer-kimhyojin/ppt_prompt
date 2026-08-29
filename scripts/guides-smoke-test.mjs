#!/usr/bin/env node

import { createServer } from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..", "dist-static");
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"], [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"], [".png", "image/png"], [".svg", "image/svg+xml"],
]);

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://127.0.0.1");
    let pathname = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    if (!pathname || pathname.endsWith("/")) pathname += "index.html";
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
      "/guides/ai-presentation-prompt.html",
      "/guides/data-diagram-prompt.html",
      "/guides/promotion-image-prompt.html",
    ]) {
      const response = await page.goto(`${origin}${route}`, { waitUntil: "networkidle" });
      if (!response?.ok()) throw new Error(`${route} returned HTTP ${response?.status()}`);
      const metrics = await page.evaluate(() => ({
        h1Count: document.querySelectorAll("h1").length,
        hasCta: Boolean(document.querySelector(".guide-cta")),
        hasShare: Boolean(document.querySelector("[data-share-page]")),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      }));
      if (metrics.h1Count !== 1 || !metrics.hasCta || !metrics.hasShare || metrics.overflow) {
        throw new Error(`${route} failed responsive contract: ${JSON.stringify(metrics)}`);
      }
    }
    if (errors.length) throw new Error(`browser errors at ${viewport.width}px: ${errors.join(" | ")}`);
    await page.close();
  }
  console.log("Guide smoke test passed: 4 pages at desktop and mobile widths, no overflow or browser errors");
} finally {
  await browser.close();
  server.closeIdleConnections?.();
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
}
