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
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = []; page.on("pageerror", (e) => errors.push(e.message));
  // This asset-only server omits application APIs; enforce CSP regressions here.
  page.on("console", (message) => { if (message.type() === "error" && /Content Security Policy|base-uri|Refused to/.test(message.text())) errors.push(message.text()); });
  await page.goto(`http://127.0.0.1:${server.address().port}/app?tab=documentDesign`, { waitUntil: "networkidle" });
  const model = await page.evaluate(() => {
    const r = PromptDeckDocumentResolver, l = PromptDeckDocumentLibrary, s = PromptDeckDocumentStudio;
    const source = "  PRIVATE SOURCE\n원문 123 그대로  ";
    const state = r.normalize({ bundleId: "report-public-calm", sourcePrompt: source, pageLayouts: { body: "body-columns" }, interpretation: "creative", colorPresetId: "proposal-plum", physicalSpec: { sizeId: "A5", orientation: "landscape" }, overrides: { typographyScope: { caption: "Noto Serif KR" }, components: { backgroundStyle: "grid", backgroundScope: "all", iconStyle: "square" } } });
    const packed = l.pack(state, "  나의 테스트  "), roundtrip = l.parse(JSON.stringify(packed));
    const font = s.choiceState(state, "fonts", "serif", ["heading"]);
    let invalid = 0; for (const value of ['{', '{}', JSON.stringify({ ...packed, state: { ...state, bundleId: "missing" } }), 'x'.repeat(250001)]) { try { l.parse(value); } catch (_) { invalid++; } }
    const item = l.add(state, "<script>표지</script>"), saved = l.read(); l.remove(item.id); l.restore(item);
    const restored = l.read();
    for (let i = restored.length; i < l.limit; i++) l.add(state, `보관 ${i}`);
    let full = false; try { l.add(state, "초과"); } catch (_) { full = true; }
    localStorage.setItem(l.key, "broken"); let corrupt = false; try { l.add(state, "덮어쓰기 방지"); } catch (_) { corrupt = localStorage.getItem(l.key) === "broken"; }
    localStorage.removeItem(l.key);
    const originalSet = Storage.prototype.setItem;
    let quota = false; Storage.prototype.setItem = () => { throw new DOMException("Full", "QuotaExceededError"); };
    try { l.add(state, "용량 초과"); } catch (e) { quota = e.name === "QuotaExceededError"; } finally { Storage.prototype.setItem = originalSet; }
    return { state, packed, roundtrip, font, invalid, saved, restored, full, corrupt, quota,
      prompts: ["faithful", "balanced", "creative"].map((interpretation) => PromptDeckDocumentDesignContract.build({ ...state, interpretation })),
      legacy: r.normalize({ bundleId: "report-public-calm" }).interpretation };
  });
  assert.deepEqual(model.roundtrip.state, { ...model.state, sourcePrompt: "" });
  assert.equal(model.packed.name, "나의 테스트"); assert.ok(!JSON.stringify(model.packed).includes("PRIVATE SOURCE"));
  assert.equal(model.font.overrides.typographyScope.heading, "Noto Serif KR");
  assert.equal(model.font.overrides.typographyScope.body, undefined);
  assert.equal(model.font.overrides.typographyScope.caption, "Noto Serif KR");
  assert.equal(model.invalid, 4); assert.ok(model.full && model.corrupt && model.quota);
  assert.deepEqual(model.saved, model.restored); assert.equal(model.legacy, "balanced");
  assert.equal(new Set(model.prompts.map((p) => p.designPrompt)).size, 3);
  for (const p of model.prompts) { assert.ok(p.fullPrompt.startsWith(model.state.sourcePrompt)); assert.ok(p.designPrompt.includes("210×148mm")); assert.ok(p.designPrompt.includes("최종 색상값과 서체 적용 범위는 지킨다")); }
  console.log("Settings roundtrip, source isolation, scoped fonts, interpretation constraints, invalid imports and storage failure handling passed.");

  const geometry = await page.evaluate(async () => {
    const stage = document.createElement("div"); stage.style.cssText = "position:fixed;left:-20000px;top:0"; document.body.append(stage);
    const failures = [], warnings = [], background = [], icons = []; let count = 0;
    try {
      for (const bundleId of ["report-public-calm", "report-data-clear", "proposal-strategy", "proposal-visual"]) {
        for (const mode of ["short", "long", "title", "table"]) {
          for (const physicalSpec of [{ sizeId: "A4", orientation: "portrait" }, { sizeId: "A5", orientation: "portrait" }, { sizeId: "A4", orientation: "landscape" }]) {
            const r = PromptDeckDocumentResolver.resolve({ bundleId, physicalSpec });
            const role = mode === "title" ? "cover" : mode === "table" ? "table" : r.design.familyId === "report" ? "body" : "message";
            const node = PromptDeckDocumentRenderer.renderPage(r.design, r.previewTokens, role, PromptDeckDocumentSamples.get(r.design.familyId, mode));
            stage.replaceChildren(node); await PromptDeckDocumentRenderer.ready(node);
            const before = [...node.querySelectorAll(".dd-paragraph, .dd-document-table tbody td")].map((n) => n.textContent).join("");
            const pages = PromptDeckDocumentRenderer.paginate(node);
            const after = pages.flatMap((p) => [...p.querySelectorAll(".dd-paragraph, .dd-document-table tbody td")]).map((n) => n.textContent).join("");
            if (before !== after) failures.push(`${bundleId}/${mode}/${physicalSpec.sizeId}: content loss`);
            if (pages.some((p) => p.dataset.overflow === "true")) (mode === "title" ? warnings : failures).push(`${bundleId}/${mode}/${physicalSpec.sizeId}/${physicalSpec.orientation}: overflow`);
            if (mode === "table" && pages.length < 2) failures.push(`${bundleId}: table must paginate`);
            count++;
          }
        }
      }
      for (const backgroundStyle of ["wash", "band", "frame", "grid"]) {
        const r = PromptDeckDocumentResolver.resolve({ overrides: { components: { backgroundStyle, backgroundScope: "all" } } });
        const node = PromptDeckDocumentRenderer.renderPage(r.design, r.previewTokens, "cover"); stage.replaceChildren(node); await PromptDeckDocumentRenderer.ready(node);
        const s = getComputedStyle(node, "::before"); background.push([s.backgroundImage, s.borderLeftWidth, s.borderTopWidth, s.margin].join("|"));
      }
      for (const iconStyle of ["line", "solid", "square"]) {
        const r = PromptDeckDocumentResolver.resolve({ bundleId: "proposal-strategy", overrides: { components: { iconStyle } } });
        const node = PromptDeckDocumentRenderer.renderPage(r.design, r.previewTokens, "diagram"); stage.replaceChildren(node); await PromptDeckDocumentRenderer.ready(node);
        const s = getComputedStyle(node.querySelector(".dd-symbol")); icons.push([s.backgroundColor, s.borderRadius, s.borderWidth].join("|"));
      }
    } finally { stage.remove(); }
    return { count, failures, warnings, background, icons };
  });
  assert.deepEqual(geometry.failures, []); assert.equal(new Set(geometry.background).size, 4); assert.equal(new Set(geometry.icons).size, 3);
  console.log(`Density preview preserves all rendered content over ${geometry.count} cases (${geometry.warnings.length} long-title overflow warnings); background and icon geometry are distinct.`);

  await page.locator('[data-use-bundle="report-public-calm"]').click();
  const ready = async () => { await page.waitForFunction(() => document.querySelector('#dwStudioPreview[aria-busy="false"] .dd-page')); };
  await page.locator('#dwDesktopControls [data-action="open-studio"]').click(); await ready();
  await page.locator('[data-studio-choice="serif"]').click(); await ready();
  assert.equal(await page.locator('.dw-font-specimen div').count(), 6);
  const before = await page.evaluate(() => PromptDeckDocumentDesign.getState());
  await page.keyboard.press("Escape");
  assert.deepEqual(await page.evaluate(() => PromptDeckDocumentDesign.getState()), before);
  await page.locator('#dwDesktopControls [data-action="open-studio"]').click(); await ready();
  await page.locator('[data-studio-group="backgroundStyle"]').click(); await ready();
  await page.locator('[data-studio-background]').selectOption("all"); await ready();
  await page.locator('[data-studio-choice="grid"]').click(); await ready();
  await page.screenshot({ path: path.join(os.tmpdir(), "promptdeck-studio-desktop.png") });
  await page.locator('[data-studio-apply]').click();
  assert.equal(await page.evaluate(() => PromptDeckDocumentDesign.getState().overrides.components.backgroundStyle), "grid");
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.evaluate(() => PromptDeckDocumentDesign.getState().overrides.components.backgroundStyle), "grid");
  await page.locator('[data-action="resume"]').click();
  const designBefore = await page.evaluate(() => PromptDeckDocumentDesign.build().designPrompt);
  await page.locator('[data-action="open-density"]').click(); await ready();
  await page.locator('[data-studio-choice="table"]').click(); await ready();
  assert.match(await page.locator('#dwStudioCount').innerText(), /1 \/ [2-9]/);
  await page.locator('[data-studio-turn="1"]').click();
  assert.match(await page.locator('#dwStudioCount').innerText(), /^2/);
  await page.keyboard.press("Escape");
  assert.equal(await page.evaluate(() => PromptDeckDocumentDesign.build().designPrompt), designBefore);
  await page.locator('.dw-header [data-action="open-library"]').click();
  await page.locator('#dwLibraryName').fill("나의 청록 보고서"); await page.locator('#dwLibrarySave button').click();
  await page.locator('[data-library-apply]:not([disabled])').waitFor();
  await page.locator('[data-library-delete]').click(); await page.locator('[data-library-undo]').click();
  assert.equal(await page.locator('[data-library-select]').count(), 1);
  await page.keyboard.press("Escape");
  await page.locator('.dw-steps [data-step="3"]').click(); await page.locator('.dw-source-details summary').click();
  await page.locator('#documentDesignSource').fill("절대 유지할 작성 요청 123");
  await page.locator('.dw-header [data-action="open-library"]').click();
  const payload = await page.evaluate(() => PromptDeckDocumentLibrary.pack({ bundleId: "proposal-strategy", interpretation: "faithful", sourcePrompt: "discard imported source", physicalSpec: { sizeId: "A3", orientation: "landscape" } }, "가져온 제안서"));
  await page.locator('#dwLibraryFile').setInputFiles({ name: "settings.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(payload)) });
  await page.locator('[data-library-apply]:not([disabled])').waitFor();
  await page.locator('[data-library-apply]').click();
  const imported = await page.evaluate(() => PromptDeckDocumentDesign.getState());
  assert.equal(imported.bundleId, "proposal-strategy"); assert.equal(imported.sourcePrompt, "절대 유지할 작성 요청 123"); assert.equal(imported.physicalSpec.widthMm, 420);
  await page.locator('#documentDesignApp [data-action="undo"]').click();
  assert.equal(await page.evaluate(() => PromptDeckDocumentDesign.getState().bundleId), "report-public-calm");

  for (const viewport of [{ width: 375, height: 812 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    if (viewport.width <= 800) await page.locator('[data-action="mobile-next"]').click();
    await page.locator(`${viewport.width <= 800 ? '#dwMobileControls' : '#dwDesktopControls'} [data-action="open-studio"]`).click(); await ready();
    await page.locator('[data-studio-group="tableStyle"]').click(); await ready();
    await page.locator('[data-studio-choice="striped"]').click(); await ready();
    await page.locator('[data-studio-zoom]').click();
    const bounds = await page.locator('#dwStudioDialog').evaluate((d) => ({ width: d.clientWidth, scroll: d.scrollWidth, height: d.getBoundingClientRect().height, viewport: innerHeight }));
    assert.ok(bounds.scroll <= bounds.width + 1 && bounds.height <= bounds.viewport);
    const apply = await page.locator('[data-studio-apply]').boundingBox(); assert.ok(apply.y >= 0 && apply.y + apply.height <= viewport.height + 1);
    if (viewport.width === 375) await page.screenshot({ path: path.join(os.tmpdir(), "promptdeck-studio-mobile.png") });
    const frameBox = await page.locator('#dwStudioPreview .dw-paper-frame').boundingBox();
    if (viewport.height > 500) assert.ok(frameBox.y > 0 && frameBox.y + frameBox.height < viewport.height - 80, "The whole sample page must fit in focused mobile view");
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.action), "open-studio");
    if (viewport.width <= 800) await page.keyboard.press("Escape");
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => document.documentElement.dataset.theme = "dark");
  await page.locator('[data-action="mobile-next"]').click();
  await page.locator('#dwMobileControls [data-action="open-studio"]').click(); await ready();
  await page.locator('[data-studio-group="backgroundStyle"]').click(); await ready();
  await page.locator('[data-studio-zoom]').click();
  const darkPaper = await page.locator('#dwStudioPreview .dd-page').evaluate((n) => getComputedStyle(n).getPropertyValue('--dd-paper'));
  const specifiedPaper = await page.evaluate(() => PromptDeckDocumentResolver.resolve(PromptDeckDocumentDesign.getState()).design.palette.background);
  assert.equal(darkPaper.trim(), specifiedPaper);
  await page.screenshot({ path: path.join(os.tmpdir(), "promptdeck-studio-mobile-dark.png") });
  await page.keyboard.press("Escape"); await page.keyboard.press("Escape");
  await page.evaluate(() => document.documentElement.dataset.theme = "light");
  await page.locator('.dw-header [data-action="open-library"]').click();
  await page.locator('[data-library-select]').click(); await page.locator('[data-library-apply]:not([disabled])').waitFor();
  await page.screenshot({ path: path.join(os.tmpdir(), "promptdeck-library-mobile.png") });
  await page.keyboard.press("Escape");
  const files = await page.evaluate(async () => {
    const state = PromptDeckDocumentDesign.getState();
    const files = await PromptDeckDocumentExport.createFiles(state, { kind: "zip", pageIds: ["cover"] });
    const item = files.find((f) => f.name === "design-settings.json");
    const roundtrip = PromptDeckDocumentLibrary.parse(new TextDecoder().decode(item.data));
    return { source: roundtrip.state.sourcePrompt, state: roundtrip.state, current: { ...state, sourcePrompt: "" } };
  });
  assert.deepEqual(files.state, files.current); assert.equal(files.source, ""); assert.deepEqual(errors, []);
  console.log("Studio apply/cancel/reload, density isolation, library import/source preservation/undo, mobile modal focus and reusable ZIP settings passed.");
} finally { if (browser) await browser.close(); await new Promise((resolve) => server.close(resolve)); }
