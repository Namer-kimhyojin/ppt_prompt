#!/usr/bin/env node
import assert from "node:assert/strict";
import { createReadStream, existsSync, readFileSync, writeFileSync } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2" };
const csp = readFileSync(path.join(root, "static-pages/_headers"), "utf8").match(/Content-Security-Policy: (.+)/)?.[1]?.trim();
const server = http.createServer((request, response) => {
  const url = new URL(request.url, "http://localhost");
  const file = path.resolve(root, ["/app", "/"].includes(url.pathname) ? "index.html" : `.${decodeURIComponent(url.pathname)}`);
  if (!file.startsWith(`${root}${path.sep}`) || !existsSync(file)) { response.writeHead(404).end(); return; }
  response.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream", ...(csp ? { "Content-Security-Policy": csp } : {}) }); createReadStream(file).pipe(response);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  try { browser = await chromium.launch({ channel: "msedge", headless: true }); } catch { browser = await chromium.launch({ headless: true }); }
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = []; page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/app?tab=documentDesign`, { waitUntil: "networkidle" });
  const contracts = await page.evaluate(() => {
    const r = PromptDeckDocumentResolver, l = PromptDeckDocumentLayouts;
    const input = { bundleId: "report-public-calm", pageLayouts: { body: "body-columns", table: "table-rail", chart: "not-a-layout", unknown: "body-columns" }, colorPresetId: "proposal-plum", sourcePrompt: "  원문\n수치 123 그대로  ", physicalSpec: { sizeId: "A3", orientation: "landscape" } };
    const before = JSON.stringify(input), normalized = r.normalize(input), built = PromptDeckDocumentDesignContract.build(normalized);
    return {
      supported: l.supportedBundles.length, choices: l.supportedBundles.flatMap((id) => PromptDeckDocumentBundles.get(id).pages.map((p) => l.options(id, p.id))).filter((a) => a.length).map((a) => a.length),
      layouts: normalized.pageLayouts, unchanged: JSON.stringify(input) === before,
      restored: r.restore(normalized).pageLayouts, switched: r.changeBundle(normalized, "proposal-strategy"),
      unsupported: r.normalize({ bundleId: "story-watercolor", pageLayouts: { body: "body-columns" } }).pageLayouts,
      legacy: r.normalize({ bundleId: "report-public-calm" }).pageLayouts,
      built, source: input.sourcePrompt,
    };
  });
  assert.equal(contracts.supported, 4);
  assert.deepEqual(contracts.choices, Array(12).fill(3));
  assert.deepEqual(contracts.layouts, { body: "body-columns", table: "table-rail" });
  assert.deepEqual(contracts.restored, {}); assert.deepEqual(contracts.switched.pageLayouts, {});
  assert.deepEqual(contracts.unsupported, {}); assert.deepEqual(contracts.legacy, {}); assert.ok(contracts.unchanged);
  assert.equal(contracts.switched.physicalSpec.widthMm, 420); assert.equal(contracts.switched.colorPresetId, "proposal-plum");
  assert.equal(contracts.switched.sourcePrompt, contracts.source);
  assert.ok(contracts.built.fullPrompt.startsWith(contracts.source));
  assert.equal(contracts.built.spec.pages.find((p) => p.id === "body").layout.id, "body-columns");
  assert.ok(contracts.built.designPrompt.includes("두 단 편집"));
  assert.ok(!/marginPx|fontPx|lineHeight/.test(JSON.stringify(contracts.built.spec)));
  console.log("Layout contracts passed: 4 themes / 12 page roles / 36 choices, source/format/palette preservation and invalid/legacy state handling.");

  const rendered = await page.evaluate(async () => {
    const r = PromptDeckDocumentResolver, l = PromptDeckDocumentLayouts, renderer = PromptDeckDocumentRenderer;
    const stage = document.createElement("div"); stage.style.cssText = "position:fixed;left:-20000px;top:0"; document.body.append(stage);
    const failures = []; let count = 0;
    const leaves = (node) => [...node.querySelectorAll("[data-dd-content] *")].filter((n) => !n.children.length && n.textContent.trim()).map((n) => n.textContent).sort();
    const signature = (node) => JSON.stringify([...node.querySelectorAll("[data-dd-content], [data-dd-content] *")].map((n) => { const b = n.getBoundingClientRect(), p = node.getBoundingClientRect(); return [n.tagName, ...[b.x-p.x,b.y-p.y,b.width,b.height].map(Math.round)]; }));
    try {
      for (const bundleId of l.supportedBundles) {
        for (const page of PromptDeckDocumentBundles.get(bundleId).pages) {
          const options = l.options(bundleId, page.id); if (!options.length) continue;
          let original; const signatures = [];
          for (const option of options) {
            for (const physicalSpec of [{ sizeId: "A4", orientation: "portrait" }, { sizeId: "A5", orientation: "portrait" }, { sizeId: "A4", orientation: "landscape" }]) {
              const resolved = r.resolve({ bundleId, pageLayouts: { [page.id]: option.id }, physicalSpec });
              const node = renderer.renderPage(resolved.design, resolved.previewTokens, page.id); stage.replaceChildren(node); await renderer.ready(node);
              if (option.id === "chart-focus" && getComputedStyle(node.querySelector('.dd-stats')).flexDirection !== 'row') failures.push(`${bundleId}: chart-focus metrics should share a horizontal strip`);
              if (physicalSpec.sizeId === "A4" && physicalSpec.orientation === "portrait") {
                if (!original) original = leaves(node);
                if (JSON.stringify(leaves(node)) !== JSON.stringify(original)) failures.push(`${bundleId}/${page.id}/${option.id}: altered example content`);
                signatures.push(signature(node));
              }
              const pages = renderer.paginate(node); count++;
              const meaningful = { body: '.dd-paragraph', table: 'tbody tr', chart: '.dd-chart,.dd-stat', message: '.dd-message', diagram: '.dd-diagram-node', roadmap: '.dd-roadmap-row' }[page.kind];
              if (!pages[0].querySelector(meaningful)) failures.push(`${bundleId}/${page.id}/${option.id}/${physicalSpec.sizeId}-${physicalSpec.orientation}: heading-only preview`);
              for (const p of pages) {
                const c = p.querySelector("[data-dd-content]");
                if (p.dataset.overflow === "true" || c.scrollHeight > c.clientHeight + 2 || c.scrollWidth > c.clientWidth + 2) failures.push(`${bundleId}/${page.id}/${option.id}/${physicalSpec.sizeId}-${physicalSpec.orientation}: overflow ${c.scrollWidth}/${c.clientWidth}, ${c.scrollHeight}/${c.clientHeight}`);
              }
            }
          }
          if (new Set(signatures).size !== 3) failures.push(`${bundleId}/${page.id}: arrangements not visually distinct`);
        }
      }
      for (const pageId of ["body", "table"]) {
        for (const option of l.options("report-public-calm", pageId)) {
          const sample = PromptDeckDocumentSamples.get("report", true);
          const resolved = r.resolve({ bundleId: "report-public-calm", pageLayouts: { [pageId]: option.id }, physicalSpec: { sizeId: "A5" }, feel: { breathing: "airy" } });
          const node = renderer.renderPage(resolved.design, resolved.previewTokens, pageId, sample); stage.replaceChildren(node); await renderer.ready(node);
          const pages = renderer.paginate(node), text = pages.map((p) => p.querySelector("[data-dd-content]").textContent).join("").replace(/\s/g, "");
          const content = pageId === "body" ? sample.paragraphs : sample.table.rows.flat();
          if (!content.every((value) => text.includes(value.replace(/\s/g, "")))) failures.push(`${pageId}/${option.id}: missing long content`);
          if (pages.some((p) => p.dataset.overflow === "true")) failures.push(`${pageId}/${option.id}: long overflow`);
        }
      }
      return { count, failures };
    } finally { stage.remove(); }
  });
  assert.deepEqual(rendered.failures, []);
  assert.equal(rendered.count, 108);
  console.log("Layout render passed: 108 theme/arrangement/paper combinations, same content, distinct geometry, A5 long text/table pagination.");

  await page.locator('[data-action="resume"]').click();
  await page.locator('#dwPageList [data-page="body"]').click();
  const state = () => page.evaluate(() => PromptDeckDocumentDesign.getState());
  const ready = () => page.locator('#dwLayoutGrid[aria-busy="false"].is-ready').waitFor();
  const open = async () => { await page.locator('[data-action="open-layout"]').click(); await ready(); assert.equal(await page.locator('[data-layout-action="apply"]').isEnabled(), true); };
  const initial = await state();
  const savedBefore = await page.evaluate(() => localStorage.getItem(PromptDeckDocumentMigration.KEY));
  await open();
  await page.locator('#dwLayoutTabs [data-layout-choice="body-columns"]').click();
  assert.deepEqual(await state(), initial);
  assert.equal(await page.evaluate(() => localStorage.getItem(PromptDeckDocumentMigration.KEY)), savedBefore);
  await page.locator('[data-layout-action="compare"]').click();
  assert.equal(await page.locator('#dwLayoutDialog').evaluate((n) => n.classList.contains("is-comparing")), true);
  await page.keyboard.press("Escape"); assert.deepEqual(await state(), initial);
  assert.ok(await page.locator('[data-action="open-layout"]').evaluate((n) => n === document.activeElement));
  await open(); await page.locator('#dwLayoutTabs [data-layout-choice="body-columns"]').click();
  await page.screenshot({ path: path.join(os.tmpdir(), "promptdeck-layout-desktop.png") });
  await page.locator('[data-layout-action="apply"]').click();
  assert.equal((await state()).pageLayouts.body, "body-columns");
  await page.waitForFunction(() => document.querySelector('#documentDesignLivePreview .dd-page')?.dataset.pageLayout === 'body-columns');
  assert.ok((await page.evaluate(() => PromptDeckDocumentDesign.build())).designPrompt.includes("배치 선택: 두 단 편집"));
  await page.reload({ waitUntil: "networkidle" }); await page.locator('[data-action="resume"]').click();
  assert.equal((await state()).pageLayouts.body, "body-columns");
  await page.locator('[data-action="open-overview"]').click();
  await page.locator('#dwOverviewGrid[aria-busy="false"]').waitFor();
  assert.equal(await page.locator('#dwOverviewGrid .dw-overview-card').count(), 6);
  assert.equal(await page.locator('[data-overview-card="body"] .dd-page').getAttribute("data-page-layout"), "body-columns");
  await page.screenshot({ path: path.join(os.tmpdir(), "promptdeck-layout-overview.png") });
  await page.locator('[data-overview-page="chart"]').last().click();
  assert.equal((await state()).activePageId, "chart");
  for (const viewport of [{ width: 375, height: 667 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport); await open();
    const old = await state();
    await page.locator('#dwLayoutTabs [data-layout-choice="chart-sidebar"]').click();
    const chartColors = await page.locator('[data-layout-id="chart-sidebar"] .dd-chart').evaluate((node) => ({ plot: getComputedStyle(node).backgroundColor, bar: getComputedStyle(node.querySelector('.dd-chart-bar')).backgroundColor }));
    assert.notEqual(chartColors.plot, chartColors.bar, "Chart bars must remain distinct from their plot background");
    const layout = await page.locator('#dwLayoutDialog').evaluate((n) => ({ width: n.scrollWidth - n.clientWidth, footer: n.querySelector('.dw-dialog-footer').getBoundingClientRect().bottom, height: innerHeight, screen: document.documentElement.scrollWidth - innerWidth }));
    assert.ok(layout.width <= 2 && layout.footer <= layout.height + 1 && layout.screen <= 1, JSON.stringify(layout));
    assert.equal(await page.locator('dialog[open]').count(), 1);
    if (viewport.width <= 800) assert.equal(await page.locator('#dwLayoutGrid .dw-layout-card:visible').count(), 1);
    if (viewport.width === 390) {
      await page.screenshot({ path: path.join(os.tmpdir(), "promptdeck-layout-mobile.png") });
      const paper = await page.locator('[data-layout-id="chart-sidebar"] .dd-page').evaluate((n) => getComputedStyle(n).backgroundColor);
      await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
      assert.equal(await page.locator('[data-layout-id="chart-sidebar"] .dd-page').evaluate((n) => getComputedStyle(n).backgroundColor), paper);
      await page.screenshot({ path: path.join(os.tmpdir(), "promptdeck-layout-mobile-dark.png") });
      await page.evaluate(() => document.documentElement.dataset.theme = 'light');
    }
    await page.locator('#dwLayoutDialog [data-layout-close]').last().click(); assert.deepEqual(await state(), old);
    await page.locator('[data-action="open-overview"]').click(); await page.locator('#dwOverviewGrid[aria-busy="false"]').waitFor();
    assert.ok(await page.locator('#dwOverviewDialog').evaluate((n) => n.scrollWidth <= n.clientWidth + 1 && n.querySelector('.dw-dialog-footer').getBoundingClientRect().bottom <= innerHeight + 1));
    await page.locator('#dwOverviewDialog [data-layout-close]').last().click();
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(); await page.locator('#dwLayoutTabs [data-layout-choice="chart-sidebar"]').click(); await page.locator('[data-layout-action="apply"]').click();
  await page.locator('#documentDesignApp [data-action="undo"]').click();
  assert.equal((await state()).pageLayouts.chart, undefined); assert.equal((await state()).pageLayouts.body, "body-columns");
  const exportResult = await page.evaluate(async () => {
    const files = await PromptDeckDocumentExport.createFiles(PromptDeckDocumentDesign.getState(), { kind: "zip", pageIds: ["body"] });
    const decode = new TextDecoder();
    return { spec: JSON.parse(decode.decode(files.find((f) => f.name === 'design-spec.json').data)), png: [...files.find((f) => f.name.endsWith('.png')).data], prompt: decode.decode(files.find((f) => f.name === 'design-prompt.txt').data) };
  });
  assert.equal(exportResult.spec.pages.find((p) => p.id === 'body').layout.id, 'body-columns');
  assert.ok(exportResult.prompt.includes('두 단 편집')); assert.deepEqual(exportResult.png.slice(0,8), [137,80,78,71,13,10,26,10]);
  writeFileSync(path.join(os.tmpdir(), "promptdeck-layout-export.png"), Buffer.from(exportResult.png));
  for (const [bundleId, pageId] of [['report-data-clear', 'table'], ['proposal-strategy', 'diagram'], ['proposal-visual', 'roadmap']]) {
    await page.evaluate((id) => PromptDeckDocumentDesign.applyBundle(id), bundleId);
    await page.locator(`#dwPageList [data-page="${pageId}"]`).click(); await open();
    await page.screenshot({ path: path.join(os.tmpdir(), `promptdeck-layout-${pageId}.png`) });
    await page.locator('#dwLayoutDialog [data-layout-close]').last().click();
  }
  assert.deepEqual(errors, []);
  console.log("Layout UI passed: compare, apply/cancel/Escape, undo, reload, six-page overview, desktop/mobile/landscape, dark mode and PNG/ZIP.");
} finally { await browser?.close(); await new Promise((resolve) => server.close(resolve)); }
