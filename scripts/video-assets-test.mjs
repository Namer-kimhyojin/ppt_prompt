import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { chromium } from "playwright";
import "../src/video-asset-engine.js";

const engine = globalThis.PromptDeckVideoAssetEngine;
const state = engine.defaults();
state.style = engine.styleSnapshot({ id: "custom-test", nameKo: "공통 수채화", desc: "종이 질감과 번짐", suffix: "watercolor, delicate edges" });
Object.assign(state, { video: "에셋 일관성 검증", reference: "style.png", palette: "청록·아이보리", lighting: "왼쪽 확산광", consistency: "선 굵기 고정" });
for (const type of Object.keys(engine.types)) {
  state.sheets[type].name = `${type} 고유 이름`;
  state.sheets[type].details = `${type} 고유 특징\n원본 형태 보존`;
  state.sheets[type].reference = `${type}.png`;
}
for (const type of Object.keys(engine.types)) for (const layout of Object.keys(engine.layouts[type])) for (const backdrop of Object.keys(engine.backdrops)) {
  state.sheets[type].layout = layout; state.sheets[type].backdrop = backdrop;
  const prompt = engine.prompt(state, type);
  assert.ok(prompt.includes(engine.commonBlock(state)));
  for (const field of ["style.png", `${type}.png`, `${type} 고유 이름`, "이미지 1장", "화면비: 3:2"]) assert.ok(prompt.includes(field), field);
  for (const other of Object.keys(engine.types).filter((key) => key !== type)) assert.ok(!prompt.includes(`${other} 고유 이름`));
  assert.doesNotMatch(prompt, /undefined|NaN|가상 데이터|<\/?[a-z][^>]*>/i);
  if (type === "background") assert.doesNotMatch(prompt, /투명 배경|흰색 단색|알파 투명도/);
  else if (backdrop === "transparent") assert.match(prompt, /실제 알파 투명도/);
}
const all = engine.allPrompts(state);
assert.equal(all.split(engine.commonBlock(state)).length, 4);
assert.equal(engine.normalize({ type: "__proto__", sheets: { character: { layout: "bad", ratio: "bad" } } }).type, "character");
assert.equal(engine.normalize({}).sheets.character.ratio, "3:2");
assert.equal(engine.normalize(state).style.technique, state.style.technique);
assert.ok(engine.prompt(engine.defaults()).length < 1000);
assert.match(engine.prompt({ ...state, world: '한글 & <검증> "A"\n두번째 줄' }), /한글 & <검증> "A"\n  - 두번째 줄/);
// Without listed reference images the prompt must not claim that any image is attached.
const unreferenced = engine.prompt(engine.defaults());
assert.doesNotMatch(unreferenced, /첨부한|화풍 참조의/);
assert.match(unreferenced, /기준 이미지 없음/);
const referenced = engine.prompt({ ...engine.defaults(), reference: "approved-style.png", sheets: { character: { reference: "person.png" } } });
assert.match(referenced, /첨부한 화풍 기준 이미지/); assert.match(referenced, /화풍 참조의 인물·사물·구도는 복제하지 않음/); assert.match(referenced, /첨부한 대상 원본의 정체성 유지/);
assert.doesNotMatch(engine.prompt({ ...engine.defaults(), style: state.style }), /첨부한/);
console.log("PASS: all 9 sheet layouts, shared style snapshot, per-sheet isolation, transparency, concise plain text, no phantom attachments");

// Older saved sheets remain usable; editing presets keep identity and style intact.
const migrated = engine.normalize({ version: 1, sheets: { character: { name: "기존 인물", details: "청록 재킷", reference: "approved.png" } } });
assert.equal(migrated.sheets.character.mode, "sheet");
const cutout = engine.applyPreset(migrated, "cutout");
assert.equal(migrated.sheets.character.mode, "sheet");
assert.equal(cutout.sheets.character.reference, "approved.png");
assert.match(engine.prompt(cutout), /기존 인물|청록 재킷/);
assert.match(engine.prompt(cutout), /1080 × 1920 px/);
assert.match(engine.prompt(cutout), /단일 에셋.*1장/);
assert.match(engine.prompt(cutout), /실제 알파 투명도/);
assert.match(engine.prompt(cutout), /하단 20%/);
assert.doesNotMatch(engine.prompt(cutout), /나란히 배치|별도 칸에 배치/);
cutout.sheets.character.size = "uhd";
cutout.sheets.character.shot = "오른손으로 안내하는 전신";
assert.match(engine.prompt(cutout), /2160 × 3840 px/);
assert.match(engine.prompt(cutout), /오른손으로 안내하는 전신/);
cutout.sheets.character.mode = "separate";
cutout.sheets.character.layout = "expression";
const expressions = engine.requests(cutout);
assert.equal(expressions.length, 7);
assert.equal(new Set(expressions.map((item) => item.filename)).size, 7);
assert.match(expressions[1].prompt, /기쁜 표정/);
assert.doesNotMatch(expressions[1].prompt, /슬픈 표정|표정 6종|기본 얼굴과/);
assert.equal(engine.prompt(cutout).split("파일명 제안:").length - 1, 7);
assert.equal(engine.allPrompts(cutout).split("파일명 제안:").length - 1, 9);
const parallax = engine.applyPreset(state, "parallax"), layers = engine.requests(parallax);
assert.equal(layers.length, 4);
for (const item of layers) assert.match(item.prompt, /동일 캔버스·카메라·소실점·수평선·원점/);
assert.match(layers[0].prompt, /기준이 될 전체 전경을 먼저 확정/);
assert.doesNotMatch(layers[1].prompt, /프레임 중심축 기준|가장자리 15% 여유/);
for (const index of [1, 2]) assert.match(layers[index].prompt, /실제 알파 투명도/);
for (const index of [0, 3]) assert.doesNotMatch(layers[index].prompt, /실제 알파 투명도/);
assert.match(layers[3].prompt, /빈 영역도 자연스럽게 채운 불투명 배경/);
parallax.sheets.background.negative = "모션 블러와 인물";
assert.match(engine.prompt(parallax), /제외 요소: 모션 블러와 인물/);
const portrait = engine.applyPreset(state, "portrait");
assert.match(engine.prompt(portrait), /중앙 타이틀 영역을 비우고/);
assert.doesNotMatch(engine.prompt(portrait), /프레임 중심축 기준/);
const invalid = engine.normalize({ sheets: { character: { mode: "__proto__", safeArea: "oops", size: "oops" } } });
assert.equal(invalid.sheets.character.mode, "sheet");
assert.equal(invalid.sheets.character.safeArea, "none");
for (const type of Object.keys(engine.types)) for (const mode of Object.keys(engine.modes)) for (const layout of Object.keys(engine.layouts[type])) {
  const input = engine.normalize(state); Object.assign(input.sheets[type], { mode, layout, ratio: "9:16" });
  for (const item of engine.requests(input, type)) {
    assert.ok(item.prompt.includes(engine.commonBlock(input)));
    assert.doesNotMatch(item.prompt, /undefined|NaN/);
    assert.match(item.prompt, /1080 × 1920 px/);
  }
}
console.log("PASS: legacy migration, presets, single PNG, 7 independent expressions, 4 aligned parallax layers, all mode/layout combinations");

const root = path.resolve(import.meta.dirname, ".."), evidence = await fs.mkdtemp(path.join(os.tmpdir(), "promptdeck-video-assets-"));
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp" };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (pathname === "/api/mixer-images") { res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ ok: true, images: JSON.parse(await fs.readFile(path.join(root, "outputs/mixer_samples/manifest.json"), "utf8")) })); return; }
    const filename = path.resolve(root, `.${({ "/app": "/index.html", "/features": "/static-pages/features.html" })[pathname] || pathname}`);
    if (!filename.startsWith(`${root}${path.sep}`)) { res.writeHead(403).end(); return; }
    const body = await fs.readFile(filename); res.writeHead(200, { "Content-Type": `${mime[path.extname(filename)] || "application/octet-stream"}; charset=utf-8` }).end(body);
  } catch (_) { res.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = process.env.VIDEO_ASSETS_ORIGIN || `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  try { browser = await chromium.launch({ channel: "msedge", headless: true }); } catch (_) { browser = await chromium.launch({ headless: true }); }
  for (const [width, height] of [[1440, 1000], [1280, 720], [390, 844], [375, 667], [844, 390]]) {
    const context = await browser.newContext({ viewport: { width, height }, acceptDownloads: true });
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin });
    const page = await context.newPage(), errors = [], badResources = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => { if (response.status() >= 400 && /(?:video-asset|tabs\.js|medium-catalog)/.test(response.url())) badResources.push(response.url()); });
    await page.goto(`${origin}/app?tab=videoAssets`, { waitUntil: "domcontentloaded" });
    await page.locator("#vaOutput").waitFor();
    assert.equal(await page.locator(".tab-pane.active").count(), 1);
    assert.equal(await page.locator("#paneVideoAssets").isVisible(), true);
    assert.ok(await page.locator("#tabActions").evaluate((el) => el.parentElement.matches(".va-result-stack") && el === el.parentElement.firstElementChild));
    assert.equal(await page.locator("#tabActions").isVisible(), width > 720);
    await page.locator("#vaSampleBtn").click();
    const commonStyle = await page.locator("#vaStyleName").textContent();
    await page.locator("#vaName").fill("고정 인물 유나");
    await page.locator("#vaSubjectReference").fill("yuna.png");
    await page.locator("#vaReference").fill("approved.png");
    await page.locator("#vaBackdrop").selectOption("transparent");
    await page.locator("#vaLayout").selectOption("expression");
    assert.match(await page.locator("#vaOutput").inputValue(), /표정 6종|알파 투명도/);
    await page.locator('[data-va-type="background"]').click();
    assert.equal(await page.locator("#vaBackdropField").isVisible(), false);
    assert.doesNotMatch(await page.locator("#vaOutput").inputValue(), /고정 인물 유나|알파 투명도/);
    await page.locator("#vaName").fill("고정 연구소");
    await page.locator('[data-va-type="prop"]').click();
    await page.locator("#vaName").fill("고정 측정기");
    assert.equal(await page.locator("#vaStyleName").textContent(), commonStyle);
    await page.locator('[data-va-type="character"]').click();
    assert.equal(await page.locator("#vaName").inputValue(), "고정 인물 유나");
    assert.equal(await page.locator("#vaLayout").inputValue(), "expression");
    await page.locator(".va-style-browser summary").click();
    await page.locator("#vaStyleSearch").fill("水彩_no_results");
    assert.equal(await page.locator("[data-va-style]").count(), 0);
    await page.locator("#vaStyleSearch").fill("수채");
    const selection = page.locator("[data-va-style]").first();
    const styleId = await selection.getAttribute("data-va-style"); assert.ok(styleId);
    await selection.click();
    const selectedStyle = await page.locator("#vaStyleName").textContent();
    await page.locator('[data-va-type="prop"]').click();
    assert.equal(await page.locator("#vaStyleName").textContent(), selectedStyle);
    assert.equal(await page.locator("#vaName").inputValue(), "고정 측정기");
    await page.locator("#vaCopyBtn").click();
    assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n"), await page.locator("#vaOutput").inputValue());
    await page.locator("#vaCopyAllBtn").click();
    const copied = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n");
    for (const name of ["고정 인물 유나", "고정 연구소", "고정 측정기"]) assert.ok(copied.includes(name));
    assert.equal(copied.split("공통 화풍 · 모든 시트에 동일 적용").length, 4);
    const download = page.waitForEvent("download"); await page.locator("#vaDownloadBtn").click();
    const file = await download; assert.equal(await fs.readFile(await file.path(), "utf8"), copied);
    await page.locator("#vaResetBtn").click(); await page.locator("#vaUndoBtn").click();
    assert.equal(await page.locator("#vaName").inputValue(), "고정 측정기");
    await page.reload({ waitUntil: "domcontentloaded" }); await page.locator("#vaOutput").waitFor();
    assert.equal(await page.locator("#vaName").inputValue(), "고정 측정기");
    assert.equal(await page.locator("#vaStyleName").textContent(), selectedStyle);
    await page.waitForFunction(() => !!window.PromptDeckConceptMixer?.getSelectedMedium);
    await page.evaluate(() => window.PromptDeckConceptMixer.selectMedium("med-clay"));
    await page.locator("#vaImportStyleBtn").click();
    assert.match(await page.locator("#vaOutput").inputValue(), /클레이|clay/);
    assert.equal(await page.locator("#vaName").inputValue(), "고정 측정기");
    await page.locator("#vaOpenMixerBtn").click();
    assert.equal(await page.locator("#paneConceptMixer").isVisible(), true);
    await page.evaluate(() => window.PromptDeckTabs.switchTab("videoAssets"));
    const productionStyle = await page.locator("#vaStyleName").textContent();
    await page.locator('[data-va-preset="cutout"]').click();
    assert.equal(await page.locator("#vaName").inputValue(), "고정 인물 유나");
    assert.equal(await page.locator("#vaMode").inputValue(), "single");
    assert.equal(await page.locator("#vaShotField").isVisible(), true);
    assert.equal(await page.locator("#vaLayoutField").isVisible(), false);
    assert.match(await page.locator("#vaOutput").inputValue(), /1080 × 1920 px/);
    await page.locator("#vaShot").fill("한 손으로 인사하는 전신");
    await page.locator("#vaSize").selectOption("uhd");
    await page.locator("#vaComposition summary").click();
    await page.locator("#vaPlacement").selectOption("right");
    await page.locator("#vaMovement").selectOption("zoom");
    assert.match(await page.locator("#vaOutput").inputValue(), /2160 × 3840 px/);
    assert.match(await page.locator("#vaOutput").inputValue(), /오른쪽 · 왼쪽 여백/);
    await page.locator("#vaMode").selectOption("separate");
    await page.locator("#vaLayout").selectOption("expression");
    assert.match(await page.locator("#vaOutputSummary").textContent(), /현재 7장/);
    await page.locator("#vaAssetList summary").click();
    await page.locator('[data-va-copy-asset="1"]').click();
    const oneExpression = await page.evaluate(() => navigator.clipboard.readText());
    assert.match(oneExpression, /기쁜 표정/); assert.doesNotMatch(oneExpression, /슬픈 표정|기본 얼굴과/);
    await page.reload({ waitUntil: "domcontentloaded" }); await page.locator("#vaOutput").waitFor();
    assert.equal(await page.locator("#vaMode").inputValue(), "separate");
    assert.equal(await page.locator("#vaShot").inputValue(), "한 손으로 인사하는 전신");
    await page.locator('[data-va-preset="parallax"]').click();
    assert.equal(await page.locator("#vaName").inputValue(), "고정 연구소");
    assert.match(await page.locator("#vaOutputSummary").textContent(), /현재 4장.*3종 전체 12장/);
    await page.locator("#vaAssetList summary").click();
    await page.locator('[data-va-copy-asset="3"]').click();
    const farLayer = await page.evaluate(() => navigator.clipboard.readText());
    assert.match(farLayer, /후경만 출력/); assert.doesNotMatch(farLayer, /실제 알파 투명도/);
    await page.locator("#vaCopyAllBtn").click();
    const productionPackage = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n");
    assert.equal(productionPackage.split("파일명 제안:").length - 1, 12);
    const packageDownload = page.waitForEvent("download"); await page.locator("#vaDownloadBtn").click();
    assert.equal(await fs.readFile(await (await packageDownload).path(), "utf8"), productionPackage);
    await page.locator("#vaUndoBtn").click();
    assert.equal(await page.locator("#vaMode").inputValue(), "separate");
    assert.equal(await page.locator("#vaLayout").inputValue(), "expression");
    await page.locator('[data-va-preset="portrait"]').click();
    assert.equal(await page.locator("#vaRatio").inputValue(), "9:16");
    assert.match(await page.locator("#vaOutput").inputValue(), /중앙 타이틀 영역을 비우고/);
    await page.locator('[data-va-preset="product"]').click();
    assert.equal(await page.locator("#vaName").inputValue(), "고정 측정기");
    assert.equal(await page.locator("#vaStyleName").textContent(), productionStyle);
    await page.locator('[data-va-type="character"]').click();
    assert.equal(await page.locator("#vaMode").inputValue(), "separate");
    assert.equal(await page.locator("#vaSize").inputValue(), "uhd");
    await page.locator("#vaComposition summary").click();
    assert.equal(await page.locator("#vaMovement").inputValue(), "zoom");
    await page.locator("#vaMode").scrollIntoViewIfNeeded();
    if (width > 1000) {
      const dock = await page.locator("#tabActions").boundingBox();
      assert.ok(dock.y >= 0 && dock.y + dock.height <= height, "action dock remains in the viewport while editing");
    }
    await page.screenshot({ path: path.join(evidence, `${width}-production.png`) });
    await page.locator("#vaWorld").fill('<img src=x onerror="window.vaInjected=1">');
    assert.equal(await page.evaluate(() => window.vaInjected), undefined);
    assert.ok((await page.locator("#vaOutput").inputValue()).includes('<img src=x onerror="window.vaInjected=1">'));
    await page.locator("#vaWorld").fill("세계관 유지 확인");
    for (const theme of ["light", "dark"]) {
      await page.evaluate((theme) => document.documentElement.setAttribute("data-theme", theme), theme);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      assert.ok(await page.locator(".app-tabs-bar").evaluate((el) => !["auto", "scroll"].includes(getComputedStyle(el).overflowY)));
    }
    await page.locator(".va-result-stack").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(evidence, `${width}-result.png`) });
    assert.deepEqual(errors, []); assert.deepEqual(badResources, []);
    // Existing recently restored panes and action hosts remain accessible.
    for (const [buttonId, group, id] of [["tabBtnMapPrompt", "visualAsset", "paneMapPrompt"], ["tabBtnSlideDocument", "deckImage", "paneSlideDocument"], ["tabBtnVideoAssets", "motionVideo", "paneVideoAssets"]]) {
      // Legacy tools are intentionally hidden until opened through a saved/deep link.
      if (buttonId === "tabBtnSlideDocument") await page.evaluate(() => window.PromptDeckTabs.switchTab("slideDocument"));
      if (width <= 720) await page.locator("#appToolMenuBtn").click();
      await page.locator(`[data-tab-group-filter="${group}"]`).click();
      await page.locator(`#${buttonId}`).click();
      assert.equal(await page.locator(`#${id}`).isVisible(), true);
    }
    console.log(`PASS: ${width}x${height} sheets/single/separate, presets, 12-file package, per-file copy, undo/reload, shared style, layout`);
    await context.close();
  }
  console.log(`Evidence: ${evidence}`);
} finally { await browser?.close(); await new Promise((resolve) => server.close(resolve)); }
