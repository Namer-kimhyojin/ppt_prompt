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
console.log("PASS: all 9 sheet layouts, shared style snapshot, per-sheet isolation, transparency, concise plain text");

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
  for (const [width, height] of [[1440, 1000], [390, 844], [375, 667], [844, 390]]) {
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
    console.log(`PASS: ${width}x${height} inputs, 3 sheets, shared style, copy/TXT, undo/reload, mixer import, layout`);
    await context.close();
  }
  console.log(`Evidence: ${evidence}`);
} finally { await browser?.close(); await new Promise((resolve) => server.close(resolve)); }
