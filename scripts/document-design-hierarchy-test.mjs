#!/usr/bin/env node
import assert from "node:assert/strict";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
const root = path.resolve(import.meta.dirname, "..");
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2", ".png": "image/png" };
const csp = readFileSync(path.join(root, "static-pages/_headers"), "utf8").match(/Content-Security-Policy: (.+)/)?.[1]?.trim().replace("base-uri 'self'", "base-uri 'none'");
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost"), file = path.resolve(root, ["/", "/app"].includes(url.pathname) ? "index.html" : `.${decodeURIComponent(url.pathname)}`);
  if (!file.startsWith(root + path.sep) || !existsSync(file)) { res.writeHead(404).end(); return; }
  res.setHeader("Content-Type", mime[path.extname(file)] || "application/octet-stream");
  if (csp) res.setHeader("Content-Security-Policy", csp);
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  try { browser = await chromium.launch({ channel: "msedge", headless: true }); } catch { browser = await chromium.launch({ headless: true }); }
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }), errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && /Content Security Policy|base-uri|Refused to/.test(m.text())) errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:${server.address().port}/app?tab=documentDesign`, { waitUntil: "networkidle" });
  const model = await page.evaluate(() => {
    const h = PromptDeckDocumentHierarchy, r = PromptDeckDocumentResolver, c = PromptDeckDocumentDesignContract;
    const source = "  원문 1. 가.\n참조: 제3조 / 123.45%\n  ";
    const state = r.normalize({ bundleId: "report-public-calm", sourcePrompt: source, hierarchy: { presetId: "korean" } });
    const built = c.build(state), packed = PromptDeckDocumentLibrary.pack(state, "내 위계"), imported = PromptDeckDocumentLibrary.parse(JSON.stringify(packed));
    return { off: r.normalize({}).hierarchy.presetId, offSpec: c.build(r.defaults()).spec.hierarchy, offPrompt: c.build(r.defaults()).designPrompt.includes("선택한 번호·기호 위계"), source: built.state.sourcePrompt, full: built.fullPrompt, prompt: built.designPrompt, spec: built.spec.hierarchy,
      sequence: h.sequence(state.hierarchy), decimal: h.marker("decimal", 2, [1, 2]), second: h.marker("hangul-paren", 2),
      invalid: h.normalize({ presetId: "bad", levels: ["<script>"] }), invalidDepth: h.normalize({ presetId: "korean", depth: 999, scope: "bad", levels: ["<svg>"] }),
      roundtrip: imported.state.hierarchy, privateSource: imported.state.sourcePrompt, nextTheme: r.changeBundle(state, "proposal-strategy").hierarchy,
      partial: c.build({ ...state, hierarchy: { ...state.hierarchy, depth: 2, scope: "lists" } }).designPrompt,
      known: h.defaults() };
  });
  assert.equal(model.off, "none"); assert.equal(model.offSpec, undefined); assert.equal(model.offPrompt, false);
  assert.equal(model.sequence, "1. → 가. → 1) → 가)"); assert.equal(model.decimal, "1.2."); assert.equal(model.second, "나)");
  assert.deepEqual(model.invalid, model.known); assert.equal(model.invalidDepth.depth, 4); assert.equal(model.invalidDepth.scope, "headings"); assert.equal(model.invalidDepth.levels[0], "number-dot");
  assert.deepEqual(model.spec, model.roundtrip); assert.deepEqual(model.spec, model.nextTheme); assert.equal(model.privateSource, "");
  assert.ok(model.full.startsWith(model.source)); assert.match(model.prompt, /참조하는 항목 번호/); assert.match(model.prompt, /편집 가능한 문서/);
  assert.match(model.partial, /적용 범위: 항목 목록만/); assert.ok(!model.partial.includes("3단계 표식") && !model.partial.includes("제목 단계의 강조는"));
  console.log("Optional defaults, invalid imports, exact markers, scope/depth and source-preserving settings roundtrip passed.");

  const rendering = await page.evaluate(async () => {
    const r = PromptDeckDocumentResolver, renderer = PromptDeckDocumentRenderer, failures = [], stage = document.createElement("div");
    stage.style.cssText = "position:absolute;left:-100000px;top:0"; document.body.append(stage);
    const texts = (node) => [...node.querySelectorAll(".dd-paragraph, .dd-question-number, .dd-option, .dd-page-number, td, th")].map((p) => p.textContent).join("|");
    let count = 0;
    try {
      for (const bundle of PromptDeckDocumentBundles.bundles) {
        const off = r.resolve({ bundleId: bundle.id });
        for (const role of bundle.pages) {
          const a = renderer.renderPage(off.design, off.previewTokens, role.id), b = renderer.renderPage({ ...off.design, hierarchy: { presetId: "none" } }, off.previewTokens, role.id);
          if (a.outerHTML !== b.outerHTML) failures.push(`${bundle.id}/${role.id}: disabled changed preview`);
        }
      }
      for (const bundleId of ["report-public-calm", "proposal-strategy", "learning-step", "exam-theory", "prose-quiet", "story-watercolor"]) {
        for (const scope of ["headings", "lists", "both"]) {
          const settings = { bundleId, hierarchy: { presetId: "symbols", scope, color: "text" }, overrides: { components: { iconStyle: "solid" } }, physicalSpec: { sizeId: "A5", orientation: "portrait" } };
          const value = r.resolve(settings);
          for (const role of value.design.pages) {
            const off = renderer.renderPage({ ...value.design, hierarchy: undefined }, value.previewTokens, role.id), node = renderer.renderPage(value.design, value.previewTokens, role.id);
            if (texts(off) !== texts(node)) failures.push(`${bundleId}/${role.id}/${scope}: source/identifier change`);
            if (role.kind === "cover" && off.outerHTML !== node.outerHTML) failures.push(`${bundleId}: cover changed`);
            if (scope === "lists" && node.querySelector(".dd-hierarchy-heading")) failures.push("list-only touched heading");
            stage.replaceChildren(node); await renderer.ready(node);
            const title = node.querySelector(".dd-hierarchy-text"), originalTitle = title?.textContent;
            const pages = renderer.paginate(node);
            if (originalTitle && !pages.some((p) => p.textContent.includes(originalTitle))) failures.push(`${bundleId}: title lost during pagination`);
            const mark = node.querySelector(".dd-hierarchy-list-marker");
            if (mark && getComputedStyle(mark).color !== getComputedStyle(node).color) failures.push(`${bundleId}: marker color lost to solid icon`);
            count++;
          }
        }
      }
    } finally { stage.remove(); }
    return { failures, count };
  });
  assert.deepEqual(rendering.failures, []); console.log(`All 192 disabled pages unchanged; ${rendering.count} enabled page/scope cases preserve narrative and identifiers.`);

  await page.locator('[data-use-bundle="report-public-calm"]').click();
  const state = () => page.evaluate(() => PromptDeckDocumentDesign.getState());
  const open = async (mobile = false) => {
    if (mobile) await page.locator('[data-action="mobile-next"]').click();
    await page.locator(`${mobile ? '#dwMobileControls' : '#dwDesktopControls'} [data-action="open-hierarchy"]`).click();
    await page.locator('#dwHierarchyDialog[open]').waitFor();
  };
  await open(); const initial = await state();
  assert.ok(await page.locator('#dwDesktopControls .dw-hierarchy-summary strong span').evaluate((n) => parseFloat(getComputedStyle(n).fontSize) >= 12), "Optional setting label must meet the 12px UI minimum");
  const smallLabels = await page.locator('#dwHierarchyDialog').evaluate((d) => [...d.querySelectorAll('.dw-hierarchy-card-example, small, .dw-outline-caption')].filter((n) => parseFloat(getComputedStyle(n).fontSize) < 12).map((n) => n.className || n.tagName));
  assert.deepEqual(smallLabels, [], "Hierarchy controls must remain readable");
  await page.locator('[data-hierarchy-preset="korean"]').click();
  assert.deepEqual(await state(), initial, "Draft must not mutate live state");
  await page.keyboard.press("Escape"); assert.deepEqual(await state(), initial);
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.action), "open-hierarchy");
  await open(); await page.locator('[data-hierarchy-preset="korean"]').click();
  await page.locator('#dwHierarchyDialog summary').filter({ hasText: "단계별" }).click();
  await page.locator('[data-hierarchy-level="2"]').selectOption("circled");
  await page.locator('[data-hierarchy-field="scope"][value="both"]').check();
  assert.equal(await page.locator('#dwHierarchySelection').textContent(), "직접 조정");
  await page.screenshot({ path: path.join(os.tmpdir(), "promptdeck-hierarchy-desktop.png") });
  await page.locator('[data-hierarchy-apply]').click();
  const custom = await state(); assert.equal(custom.hierarchy.levels[2], "circled");
  await page.waitForSelector('#documentDesignLivePreview .dd-hierarchy-heading');
  await page.locator('#documentDesignApp [data-action="undo"]').click(); assert.deepEqual((await state()).hierarchy, initial.hierarchy);
  await open(); await page.locator('[data-hierarchy-preset="symbols"]').click(); await page.locator('[data-hierarchy-apply]').click();
  await page.reload({ waitUntil: "networkidle" }); assert.equal((await state()).hierarchy.presetId, "symbols");
  await page.locator('[data-action="resume"]').click();
  for (const viewport of [{ width: 375, height: 812 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport); const mobile = viewport.width <= 800;
    await open(mobile); await page.locator('[data-hierarchy-preset="decimal"]').click();
    const bounds = await page.locator('#dwHierarchyDialog').evaluate((d) => ({ width: d.clientWidth, scroll: d.scrollWidth, height: d.getBoundingClientRect().height, viewport: innerHeight }));
    assert.ok(bounds.scroll <= bounds.width + 1 && bounds.height <= bounds.viewport, JSON.stringify(bounds));
    const apply = await page.locator('[data-hierarchy-apply]').boundingBox(); assert.ok(apply.y >= 0 && apply.y + apply.height <= viewport.height + 1);
    if (mobile) {
      await page.locator('[data-hierarchy-preview]').click();
      await page.locator('#dwHierarchyPreview').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(os.tmpdir(), `promptdeck-hierarchy-mobile-${viewport.width}.png`) });
      const preview = await page.locator('#dwHierarchyPreview').evaluate((n) => ({ w: n.clientWidth, sw: n.scrollWidth })); assert.ok(preview.sw <= preview.w + 1);
    }
    await page.keyboard.press("Escape"); assert.equal((await state()).hierarchy.presetId, "symbols");
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.action), "open-hierarchy");
    if (mobile) await page.keyboard.press("Escape");
  }
  await page.setViewportSize({ width: 390, height: 844 }); await open(true);
  await page.evaluate(() => document.documentElement.dataset.theme = "dark");
  await page.locator('[data-hierarchy-preset="korean"]').click();
  const palette = await page.evaluate(() => PromptDeckDocumentResolver.resolve(PromptDeckDocumentDesign.getState()).design.palette.background);
  assert.equal((await page.locator('#dwHierarchyPreview').evaluate((n) => getComputedStyle(n).getPropertyValue('--outline-paper'))).trim(), palette);
  await page.screenshot({ path: path.join(os.tmpdir(), "promptdeck-hierarchy-mobile-dark.png") });
  await page.locator('[data-hierarchy-apply]').click(); await page.keyboard.press("Escape");
  const exported = await page.evaluate(async () => {
    const files = await PromptDeckDocumentExport.createFiles(PromptDeckDocumentDesign.getState(), { kind: "zip", pageIds: ["body"] });
    const json = (name) => JSON.parse(new TextDecoder().decode(files.find((f) => f.name === name).data));
    return { settings: json("design-settings.json").state.hierarchy, spec: json("design-spec.json").hierarchy, png: files.some((f) => f.name.endsWith(".png") && f.data.length > 1000) };
  });
  assert.equal(exported.spec.presetId, "korean"); assert.deepEqual(exported.settings, exported.spec); assert.ok(exported.png);
  await open(true); await page.locator('[data-hierarchy-preset="none"]').click(); await page.locator('[data-hierarchy-apply]').click();
  assert.equal((await state()).hierarchy.presetId, "none"); assert.ok(!(await page.locator('#documentDesignOutput').inputValue()).includes("선택한 번호·기호 위계"));
  assert.deepEqual(errors, []);
  console.log("Draft/cancel/apply/undo/reload, custom levels, mobile & dark layouts/focus, disabled reset and CSP-safe ZIP/PNG passed.");
} finally { if (browser) await browser.close(); await new Promise((resolve) => server.close(resolve)); }
