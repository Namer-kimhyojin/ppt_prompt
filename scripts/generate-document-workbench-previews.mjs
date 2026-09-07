#!/usr/bin/env node

import fs from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const outputRelative = "assets/document-design-workbench-previews";
const outputDir = path.join(root, outputRelative);
const guideDir = path.join(root, "assets/guides");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2" };
const rendererSources = ["src/document-design-bundles.js", "src/document-design-samples.js", "src/document-design-resolver.js", "src/document-design-renderer.js", "styles/document-design-pages.css", "styles/document-design-fonts.css"];
const uiSources = ["index.html", "src/document-design-workbench.js", "styles/document-design-workbench.css"];
const shell = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><link rel="stylesheet" href="/styles/document-design-fonts.css"><link rel="stylesheet" href="/styles/document-design-pages.css"><style>body{margin:0;background:#e9eef0}#sheet{display:flex;gap:18px;padding:24px;width:1200px;box-sizing:border-box;align-items:flex-start;background:#e9eef0}.sample{width:372px;margin:0;flex:none}.sample-label{font-family:'Noto Sans KR',sans-serif;font-size:13px;line-height:20px;color:#38505b;padding:12px 2px 0}.page-slot{position:relative;background:#fff}.page-slot>.dd-page{transform-origin:top left;position:absolute;left:0;top:0}</style></head><body><div id="sheet"></div>${rendererSources.filter((file) => file.endsWith(".js")).map((file) => `<script src="/${file}"></script>`).join("")}</body></html>`;
const server = http.createServer((request, response) => {
  const requested = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  if (requested === "/__document-preview") { response.writeHead(200, { "Content-Type": mime[".html"] }).end(shell); return; }
  const filename = path.resolve(root, requested === "/" || requested === "/app" ? "index.html" : `.${requested}`);
  if (!filename.startsWith(`${root}${path.sep}`) || !existsSync(filename)) { response.writeHead(404).end("Not found"); return; }
  response.writeHead(200, { "Content-Type": mime[path.extname(filename)] || "application/octet-stream" });
  createReadStream(filename).pipe(response);
});

async function loadPlaywright() {
  try { return await import("playwright"); }
  catch (error) {
    if (!process.env.PROMPTDECK_NODE_MODULES) throw error;
    return import(pathToFileURL(path.join(process.env.PROMPTDECK_NODE_MODULES, "playwright/index.mjs")).href);
  }
}

async function asWebp(page, png) {
  const base64 = await page.evaluate(async (data) => {
    const image = new Image(); image.src = `data:image/png;base64,${data}`; await image.decode();
    const canvas = document.createElement("canvas"); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    canvas.getContext("2d").drawImage(image, 0, 0);
    return canvas.toDataURL("image/webp", .9).split(",")[1];
  }, png.toString("base64"));
  const value = Buffer.from(base64, "base64");
  if (value.toString("ascii", 0, 4) !== "RIFF" || value.toString("ascii", 8, 12) !== "WEBP") throw new Error("Browser did not produce a WebP image");
  return value;
}

async function writeImage(page, locator, filename) {
  const png = locator ? await locator.screenshot({ type: "png", animations: "disabled" }) : await page.screenshot({ type: "png", animations: "disabled" });
  const bytes = await asWebp(page, png);
  await fs.writeFile(filename, bytes);
  return { bytes: bytes.length, sha256: sha256(bytes) };
}

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(guideDir, { recursive: true });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  const { chromium } = await loadPlaywright();
  try { browser = await chromium.launch({ channel: "msedge", headless: true }); }
  catch (_) { browser = await chromium.launch({ headless: true }); }
  const page = await browser.newPage({ viewport: { width: 1200, height: 720 }, deviceScaleFactor: 1 });
  await page.goto(`${origin}/__document-preview`, { waitUntil: "networkidle" });
  const definitions = await page.evaluate(() => PromptDeckDocumentBundles.bundles.map((bundle) => ({ id: bundle.id, familyId: bundle.familyId, image: bundle.image })));
  const iconFiles = (await fs.readdir(path.join(root, "assets/document-design-icons"))).map((name) => `assets/document-design-icons/${name}`);
  const inputs = [...new Set([...rendererSources, ...uiSources, ...iconFiles, "scripts/generate-document-workbench-previews.mjs", ...definitions.map((bundle) => bundle.image), "assets/fonts/document-design/NotoSansKR.woff2", "assets/fonts/document-design/NotoSerifKR.woff2"])];
  const sourceHashes = Object.fromEntries(await Promise.all(inputs.map(async (filename) => [filename, sha256(await fs.readFile(path.join(root, filename)))])));
  const rendererHash = sha256(JSON.stringify(Object.fromEntries(rendererSources.map((filename) => [filename, sourceHashes[filename]]))));
  const previews = [];
  for (const bundle of definitions) {
    const detail = await page.evaluate(async (bundleId) => {
      const bundle = PromptDeckDocumentBundles.get(bundleId);
      const resolved = PromptDeckDocumentResolver.resolve({ bundleId });
      const preferred = { report: ["cover", "body", "table"], proposal: ["cover", "message", "diagram"], learning: ["cover", "body", "diagram"], exam: ["cover", "body", "question"], prose: ["cover", "body", "quote"], story: ["cover", "body", "dialogue"] };
      const pageIds = preferred[bundle.familyId];
      const sheet = document.getElementById("sheet"); sheet.replaceChildren();
      const continuationCounts = {};
      for (const pageId of pageIds) {
        const figure = document.createElement("figure"); figure.className = "sample";
        const slot = document.createElement("div"); slot.className = "page-slot";
        const scale = 372 / resolved.previewTokens.widthPx;
        slot.style.height = `${resolved.previewTokens.heightPx * scale}px`;
        const node = PromptDeckDocumentRenderer.renderPage(resolved.design, resolved.previewTokens, pageId);
        slot.append(node); figure.append(slot); sheet.append(figure);
        await PromptDeckDocumentRenderer.ready(node);
        const nodes = PromptDeckDocumentRenderer.paginate(node);
        continuationCounts[pageId] = nodes.length;
        if (nodes.some((entry) => entry.dataset.overflow === "true")) throw new Error(`Unresolved overflow in ${bundleId}/${pageId}`);
        nodes.slice(1).forEach((entry) => entry.remove());
        node.style.transform = `scale(${scale})`;
        const label = document.createElement("figcaption"); label.className = "sample-label";
        label.textContent = bundle.pages.find((entry) => entry.id === pageId).label;
        figure.append(label);
      }
      return { bundleId, familyId: bundle.familyId, label: bundle.label, pageIds, continuationCounts, settings: resolved.state, design: resolved.design, previewTokens: resolved.previewTokens, width: sheet.offsetWidth, height: sheet.offsetHeight };
    }, bundle.id);
    const relative = `${outputRelative}/${bundle.id}.webp`;
    const image = await writeImage(page, page.locator("#sheet"), path.join(root, relative));
    previews.push({ bundleId: detail.bundleId, familyId: detail.familyId, label: detail.label, file: relative, pageIds: detail.pageIds, continuationCounts: detail.continuationCounts, settings: detail.settings, settingsHash: sha256(JSON.stringify(detail.settings)), designHash: sha256(JSON.stringify(detail.design)), previewTokensHash: sha256(JSON.stringify(detail.previewTokens)), width: detail.width, height: detail.height, ...image });
  }

  const guidePage = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await guidePage.goto(`${origin}/app?tab=documentDesign`, { waitUntil: "networkidle" });
  await guidePage.waitForSelector('.dw-bundle-card .dd-page');
  await guidePage.locator('[data-use-bundle="report-public-calm"]').click();
  await guidePage.waitForFunction(() => document.querySelector('#documentDesignLivePreview[aria-busy="false"] .dd-page'));
  await guidePage.locator('[data-stage="2"]').scrollIntoViewIfNeeded();
  const guides = [];
  const saveGuide = async (name, description) => {
    const relative = `assets/guides/document-design-workbench-${name}.webp`;
    guides.push({ file: relative, description, viewport: guidePage.viewportSize(), ...await writeImage(guidePage, null, path.join(root, relative)) });
  };
  await saveGuide("desktop", "1440px desktop editor, default public report, live page and adjustment controls");
  await guidePage.setViewportSize({ width: 390, height: 844 });
  await guidePage.locator('.dw-steps [data-step="1"]').click();
  await guidePage.waitForSelector('.dw-bundle-card .dd-page');
  await guidePage.locator('.dw-section-heading').first().scrollIntoViewIfNeeded();
  await saveGuide("mobile", "390px mobile gallery showing the two report bundles");
  await guidePage.locator('[data-use-bundle="report-public-calm"]').click();
  await guidePage.waitForFunction(() => document.querySelector('#documentDesignLivePreview[aria-busy="false"] .dd-page'));
  await guidePage.locator('.dw-mobile-bar [data-action="mobile-next"]').click();
  await guidePage.waitForSelector('#dwControlDialog[open]');
  await saveGuide("controls", "390px mobile bottom sheet showing live degree controls over the selected document");
  const manifest = { schema: "PromptDeckDocumentWorkbenchPreviewManifest/1.0", designSchema: "DocumentDesignSpec/3.0", bundleVersion: 1, rendererVersion: 1, generatedAt: new Date().toISOString(), generator: "scripts/generate-document-workbench-previews.mjs", captureEngine: "Chromium browser screenshots, converted to WebP", rendererHash, sourceHashes, settingsPolicy: "Default resolved bundle settings, exact A4 portrait. Contact sheets show the first physical page of each representative role; continuation counts are recorded.", previews, guides };
  await fs.writeFile(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`Generated ${previews.length} renderer-derived WebP previews and ${guides.length} actual UI guide screenshots.`);
  console.log(`Manifest: ${outputRelative}/manifest.json`);
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
