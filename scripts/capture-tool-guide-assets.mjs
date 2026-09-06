#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const repoRoot = path.resolve(import.meta.dirname, "..");
const outputDir = path.join(repoRoot, "assets", "guides", "tools");
const origin = String(process.argv[2] || "https://promptdeck.kr").replace(/\/+$/u, "");
const tools = [
  { slug: "common-prompt", tab: "commonPrompt", pane: "#paneCommonPrompt", focus: ".cpd-main-column" },
  { slug: "slide-splitter", tab: "generator", pane: "#paneGenerator", focus: "#genInputSection" },
  { slug: "form-image", tab: "formImage", pane: "#paneFormImage", focus: ".form-image-work-panel" },
  { slug: "map-image", tab: "mapPrompt", pane: "#paneMapPrompt", focus: ".map-builder-section" },
  { slug: "promotion-image", tab: "promotion", pane: "#panePromotion", focus: ".promo-builder-section" },
  { slug: "qr-code", tab: "qrGenerator", pane: "#paneQrGenerator", focus: ".qr-gen-builder-section" },
  { slug: "data-diagram", tab: "dataDiagram", pane: "#paneDataDiagram", focus: ".diagram-builder-section" },
  { slug: "label-ticket", tab: "labelSheet", pane: "#paneLabelSheet", focus: ".label-sheet-workspace-canvas-column", sampleProject: true },
  { slug: "concept-suggest", tab: "promotionPlanner", pane: "#panePromotionPlanner", focus: "#conceptGrid" },
  { slug: "visual-mixer", tab: "conceptMixer", pane: "#paneConceptMixer", focus: ".mixer-left" },
  { slug: "photo-transform", tab: "photoTransform", pane: "#panePhotoTransform", focus: ".pt-control-column" },
];

const requestedSlugs = new Set(process.argv.slice(3));
const captureTargets = requestedSlugs.size ? tools.filter((tool) => requestedSlugs.has(tool.slug)) : tools;
if (!captureTargets.length) throw new Error("No matching tool slugs were provided");

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });

try {
  for (const tool of captureTargets) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      colorScheme: "light",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(`${origin}/app?tab=${tool.tab}&guide-capture=${Date.now()}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForSelector(tool.pane, { state: "visible", timeout: 30_000 });
    await page.evaluate((tab) => window.PromptDeckTabs?.switchTab?.(tab), tool.tab);
    await page.waitForTimeout(1_200);
    if (tool.sampleProject) {
      await page.locator("#labelSheetWorkspaceEntry button").filter({ hasText: "샘플 프로젝트 열기" }).first().click();
      await page.waitForSelector(".label-sheet-workspace-canvas-column", { state: "visible", timeout: 30_000 });
      await page.waitForTimeout(600);
    }
    await page.evaluate(async () => {
      await document.fonts?.ready;
      window.scrollTo(0, 0);
      document.documentElement.dataset.guideCapture = "true";
    });
    await page.addStyleTag({ content: `
      *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
      .toast, .loading-overlay, .cpd-dialog-backdrop:not([hidden]) { display: none !important; }
    ` });
    await page.screenshot({
      path: path.join(outputDir, `${tool.slug}-overview.jpg`),
      type: "jpeg",
      quality: 88,
      fullPage: false,
    });

    const target = page.locator(`${tool.pane} ${tool.focus}`).first();
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    if (!box) throw new Error(`${tool.slug}: focus area is not visible (${tool.focus})`);
    const clip = {
      x: Math.max(0, Math.floor(box.x - 10)),
      y: Math.max(0, Math.floor(box.y - 10)),
      width: Math.min(1420, Math.ceil(box.width + 20)),
      height: Math.min(720, Math.ceil(box.height + 20)),
    };
    await page.screenshot({
      path: path.join(outputDir, `${tool.slug}-detail.jpg`),
      type: "jpeg",
      quality: 90,
      clip,
      captureBeyondViewport: true,
    });
    console.log(`${tool.slug}: overview + detail captured from ${origin}`);
    await context.close();
  }
} finally {
  await browser.close();
}

const manifest = {
  capturedAt: new Date().toISOString(),
  sourceOrigin: origin,
  viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  state: "Public default data; label-ticket uses the built-in sample project.",
  tools: [],
};
for (const tool of tools) {
  const files = {};
  for (const kind of ["overview", "detail"]) {
    const filename = `${tool.slug}-${kind}.jpg`;
    const stat = await fs.stat(path.join(outputDir, filename));
    files[kind] = { path: filename, bytes: stat.size };
  }
  manifest.tools.push({ slug: tool.slug, tab: tool.tab, files });
}
await fs.writeFile(path.join(outputDir, "capture-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`capture manifest updated: ${manifest.tools.length} tools`);
