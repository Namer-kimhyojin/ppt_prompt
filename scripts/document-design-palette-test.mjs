#!/usr/bin/env node
import assert from "node:assert/strict";
import { createReadStream, existsSync, readFileSync, writeFileSync } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const sandbox = { window: {} };
for (const file of ["document-design-bundles", "document-design-palettes", "document-design-resolver"]) vm.runInNewContext(readFileSync(path.join(root, "src", `${file}.js`), "utf8"), sandbox);
const { PromptDeckDocumentPalettes: catalog, PromptDeckDocumentResolver: resolver } = sandbox.window;
assert.equal(catalog.presets.length, 24);
assert.equal(new Set(catalog.presets.map((p) => p.id)).size, 24);
for (const preset of catalog.presets) {
  const state = resolver.normalize({ colorPresetId: preset.id });
  const before = JSON.stringify(state);
  const output = resolver.resolve(state);
  assert.equal(JSON.stringify(state), before, "Resolving colors must not mutate saved inputs");
  assert.equal(JSON.stringify(output.design.palette), JSON.stringify(preset.colors), "Neutral feelings preserve the curated colors exactly");
  assert.equal(output.issues.length, 0, `Preset must pass text contrast checks: ${preset.id}`);
  for (const role of ["primary", "accent"]) assert.ok(catalog.contrast(preset.colors[role], catalog.inkOn(preset.colors[role])) >= 4.5);
  for (const field of catalog.fields) {
    const variants = [field.options[0][0], field.options[2][0]].map((value) => resolver.resolve({ ...state, colorFeel: { [field.key]: value } }));
    assert.notEqual(JSON.stringify(variants[0].design.palette), JSON.stringify(variants[1].design.palette), `${field.key} must visibly affect colors`);
    for (const variant of variants) assert.ok(Object.values(variant.design.palette).every((value) => /^#[0-9a-f]{6}$/.test(value)));
  }
}
const custom = resolver.normalize({ colorPresetId: "proposal-plum", colorFeel: { temperature: "warm" }, overrides: { colors: { primary: "#ffeedd" }, typographyScope: { heading: "Noto Serif KR" } }, sourcePrompt: "  원문\n유지  ", physicalSpec: { sizeId: "A3", orientation: "landscape" } });
assert.equal(resolver.resolve(custom).design.palette.primary, "#ffeedd", "Direct colors override feeling transforms");
assert.ok(resolver.resolve(custom).issues.length, "Unsafe direct colors require a visible warning");
const switched = resolver.changeBundle(custom, "proposal-strategy");
assert.equal(switched.colorPresetId, "proposal-plum");
assert.equal(switched.overrides.colors.primary, "#ffeedd");
assert.equal(switched.sourcePrompt, custom.sourcePrompt);
assert.equal(switched.physicalSpec.widthMm, 420);
assert.equal(resolver.changeBundle({ ...custom, keepPaletteOnBundleChange: false }, "proposal-strategy").colorPresetId, "");
assert.equal(resolver.restore(custom).colorPresetId, "");
assert.equal(resolver.normalize({ overrides: { colors: { accent: "#aabbcc" } } }).overrides.colors.accent, "#aabbcc", "Old v3 direct colors must survive normalization");
assert.equal(resolver.normalize({ colorPresetId: "missing", colorFeel: { temperature: "invalid" } }).colorFeel.temperature, "neutral");
const inherited = resolver.normalize({ bundleId: "report-public-calm", colorFeel: { temperature: "warm" }, overrides: { colors: { accent: "#123456" } } });
assert.equal(JSON.stringify(resolver.resolve(resolver.changeBundle(inherited, "proposal-strategy")).design.palette), JSON.stringify(resolver.resolve(inherited).design.palette), "Unnamed custom combinations retain their full base palette when switching layouts");
console.log("Palette contracts: 24 presets, qualitative changes, direct overrides, bundle persistence, legacy compatibility passed.");

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
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const errors = []; page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/app?tab=documentDesign`, { waitUntil: "networkidle" });
  await page.locator('[data-action="resume"]').click();
  const getState = () => page.evaluate(() => PromptDeckDocumentDesign.getState());
  const stored = () => page.evaluate(() => localStorage.getItem(PromptDeckDocumentMigration.KEY));
  const open = async () => { await page.locator('#dwDesktopControls [data-action="open-palette"]').click(); await page.waitForFunction(() => document.querySelectorAll('#dwPalettePages .dw-paper-frame').length === 3 && document.querySelector('#dwPalettePages').getAttribute('aria-busy') === 'false'); };
  const ready = () => page.waitForFunction(() => document.querySelector('#dwPalettePages').getAttribute('aria-busy') === 'false');
  await open();
  const initial = await getState(), saved = await stored();
  await page.locator('[data-pal-preset="report-data-teal"]').click(); await ready();
  assert.deepEqual(await getState(), initial, "Trying a palette must not change the applied state");
  assert.equal(await stored(), saved, "Draft changes must not be persisted");
  const previewColors = await page.locator('#dwPalettePages .dd-page').evaluateAll((nodes) => nodes.map((n) => n.style.getPropertyValue("--dd-primary")));
  assert.ok(previewColors.every((color) => color === "#175e68"), "Cover, body and chart must share the selected palette");
  await page.locator('[data-pal-action="original"]').click(); await ready();
  assert.equal(await page.locator('#dwPalettePages .dd-page').first().evaluate((n) => n.style.getPropertyValue("--dd-primary")), initial.overrides.colors.primary || "#193d58");
  await page.keyboard.press("Escape");
  assert.deepEqual(await getState(), initial, "Escape must discard the draft");
  assert.equal(await page.locator('#dwDesktopControls [data-action="open-palette"]').evaluate((n) => n === document.activeElement), true);
  await open();
  await page.locator('[data-pal-filter="proposal"]').click();
  await page.locator('[data-pal-preset="proposal-plum"]').click(); await ready();
  await page.locator('#dwPaletteAdjustments summary').first().click();
  await page.locator('[data-pal-feel="temperature"][value="warm"]').check(); await ready();
  await page.locator('[data-pal-presence][value="high"]').check(); await ready();
  await page.locator('[data-pal-table]').click(); await ready();
  assert.equal(await page.locator('#dwPalettePages .dd-document-table').count(), 1);
  await page.locator('[data-pal-action="set-view"]').click(); await ready();
  await page.locator('#dwPaletteAdjustments summary').first().click();
  await page.waitForFunction(() => document.querySelector('#dwPaletteGrid [data-ready="true"]'));
  await page.screenshot({ path: path.join(os.tmpdir(), "promptdeck-palette-desktop.png") });
  await page.locator('[data-pal-action="apply"]').click();
  const selected = await getState();
  assert.equal(selected.colorPresetId, "proposal-plum"); assert.equal(selected.colorFeel.temperature, "warm"); assert.equal(selected.feel.colorPresence, "high");
  const generated = await page.evaluate(() => PromptDeckDocumentDesign.build());
  assert.equal(generated.spec.colorScheme.presetId, "proposal-plum");
  for (const color of Object.values(generated.spec.palette)) assert.ok(generated.designPrompt.includes(color));
  assert.ok(generated.designPrompt.includes("따뜻하게"));
  await page.reload({ waitUntil: "networkidle" }); await page.locator('[data-action="resume"]').click();
  assert.deepEqual(await getState(), selected, "Applied palette and feelings must survive reload");
  await page.evaluate(() => PromptDeckDocumentDesign.applyBundle("proposal-investment-case"));
  assert.equal((await getState()).colorPresetId, "proposal-plum");
  await page.waitForFunction(() => document.querySelector('#documentDesignLivePreview .dd-page[data-palette-custom="true"]'));
  const customCover = await page.locator('#documentDesignLivePreview .dd-page').evaluate((n) => ({ background: getComputedStyle(n).backgroundColor, primary: n.style.getPropertyValue("--dd-primary") }));
  assert.notEqual(customCover.background, "rgb(18, 36, 61)", "Investment cover must follow the palette instead of a hardcoded background");
  const beforeUndo = await getState();
  await open(); await page.locator('[data-pal-action="reset"]').click(); await page.locator('[data-pal-action="apply"]').click();
  assert.equal((await getState()).colorPresetId, "");
  await page.locator('#documentDesignApp [data-action="undo"]').click(); assert.deepEqual(await getState(), beforeUndo);

  for (const viewport of [{ width: 375, height: 667 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    if (viewport.width <= 800) { await page.locator('[data-action="mobile-next"]').click(); await page.locator('#dwMobileControls [data-action="open-palette"]').click(); }
    else await open();
    await ready();
    assert.equal(await page.locator('dialog[open]').count(), 1, "Palette sheet must replace the controls sheet, never stack modal dialogs");
    const layout = await page.locator('#dwPaletteDialog').evaluate((n) => {
      const footer = n.querySelector('.dw-dialog-footer').getBoundingClientRect();
      const scroll = n.querySelector('.dw-palette-scroll');
      return { overflow: Math.max(n.scrollWidth - n.clientWidth, scroll.scrollWidth - scroll.clientWidth), footerBottom: footer.bottom, viewport: innerHeight, width: n.getBoundingClientRect().width, viewportWidth: innerWidth };
    });
    assert.ok(layout.overflow <= 2 && layout.footerBottom <= layout.viewport + 1 && layout.width <= layout.viewportWidth, JSON.stringify(layout));
    await page.locator('#dwPaletteDialog [data-pal-filter="all"]').click(); assert.equal(await page.locator('#dwPaletteDialog [data-pal-preset]').count(), 24);
    if (viewport.width === 390) {
      await page.locator('[data-pal-preset="report-data-teal"]').click(); await ready();
      await page.screenshot({ path: path.join(os.tmpdir(), "promptdeck-palette-mobile.png") });
      await page.evaluate(() => document.documentElement.dataset.theme = "dark");
      const beforeDark = await page.locator('#dwPalettePages .dd-page').first().evaluate((n) => getComputedStyle(n).backgroundColor);
      await page.screenshot({ path: path.join(os.tmpdir(), "promptdeck-palette-mobile-dark.png") });
      await page.evaluate(() => document.documentElement.dataset.theme = "light");
      assert.equal(await page.locator('#dwPalettePages .dd-page').first().evaluate((n) => getComputedStyle(n).backgroundColor), beforeDark);
    }
    const previous = await getState(); await page.locator('[data-pal-action="cancel"]').last().click(); assert.deepEqual(await getState(), previous);
    if (viewport.width <= 800) { await page.locator('#dwControlDialog[open]').waitFor(); assert.equal(await page.locator('dialog[open]').count(), 1); await page.locator('[aria-label="느낌 조정 닫기"]').click(); }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open();
  await page.locator('#dwPaletteAdjustments summary').nth(1).click();
  await page.locator('[data-pal-color="text"]').fill("#ffffff"); await ready();
  assert.ok(await page.locator('#dwPaletteStatus').evaluate((n) => n.classList.contains('has-warning')));
  await page.locator('[data-pal-action="cancel"]').last().click();
  const files = await page.evaluate(async () => {
    const state = PromptDeckDocumentDesign.getState();
    const files = await PromptDeckDocumentExport.createFiles(state, { kind: "zip", pageIds: ["cover"] });
    const decoder = new TextDecoder();
    return { spec: JSON.parse(decoder.decode(files.find((f) => f.name === "design-spec.json").data)), prompt: decoder.decode(files.find((f) => f.name === "design-prompt.txt").data), png: [...files.find((f) => f.name.endsWith('.png')).data] };
  });
  assert.equal(files.spec.colorScheme.presetId, "proposal-plum");
  assert.ok(files.prompt.includes(files.spec.palette.primary)); assert.deepEqual(files.png.slice(0, 8), [137, 80, 78, 71, 13, 10, 26, 10]);
  writeFileSync(path.join(os.tmpdir(), "promptdeck-palette-export.png"), Buffer.from(files.png));
  assert.deepEqual(errors, []);
  console.log(`Palette UI passed: draft/apply/cancel, cover/body/chart/table, compare, restore, undo, three responsive sizes, dark mode, contrast warnings and ZIP/PNG. Screenshots: ${os.tmpdir()}/promptdeck-palette-*.png`);
} finally { await browser?.close(); await new Promise((resolve) => server.close(resolve)); }
