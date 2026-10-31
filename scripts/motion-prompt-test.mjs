import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import "../src/motion-prompt-catalog.js";
import "../src/motion-prompt-engine.js";

const engine = globalThis.PromptDeckMotionEngine;
const catalog = globalThis.PromptDeckMotionCatalog;
assert.equal(new Set(catalog.templates.map((t) => t.id)).size, 18);
for (const template of catalog.templates) {
  const state = engine.normalize({ template: template.id });
  assert.equal(state.scenes.length, 3);
  assert.equal(engine.totalSeconds(state), 15);
  assert.match(engine.productionPrompt(state), new RegExp(template.name));
  assert.match(catalog.artwork(template), /<svg/);
  assert.doesNotMatch(catalog.artwork(template), /(?:href|src)="https?:/);
  for (const target of ["claude", "gpt"]) for (const format of ["html", "remotion", "brief"]) {
    const output = engine.productionPrompt({ ...state, target, format });
    assert.match(output, new RegExp(engine.formats[format]));
    assert.doesNotMatch(output, /undefined|NaN/);
    if (format === "remotion") assert.match(output, /중첩 프레임/);
  }
}
const malformed = engine.normalize({ template: "unknown", target: "__proto__", ratio: "42:1", scenes: [null, { seconds: -99 }, { seconds: "oops" }, { seconds: 9999 }] });
assert.equal(malformed.template, "kinetic");
assert.equal(malformed.target, "claude");
assert.deepEqual(malformed.scenes.map((s) => s.seconds), [5, 1, 5, 120]);
assert.equal(engine.normalize({ scenes: Array(20).fill({}) }).scenes.length, 12);
for (const length of [1, 3, 7, 12]) for (const requested of [-9, 1, 15, 91, 359, 9000]) {
  const state = engine.normalize({ scenes: Array.from({ length }, (_, i) => ({ seconds: 1 + i * 8 })) });
  engine.resizeDuration(state, requested);
  assert.equal(engine.totalSeconds(state), Math.min(length * 120, Math.max(length, requested)));
  assert.ok(state.scenes.every((s) => Number.isInteger(s.seconds) && s.seconds >= 1 && s.seconds <= 120));
  assert.equal(engine.timeline(state).at(-1).end, engine.totalSeconds(state));
}
const source = engine.normalize({ title: "한글 & <검증>", source: "원문 72% · 2026-11-01", assets: "제품.png", scenes: [{ seconds: 7, visual: "테스트 화면", motion: "피사체가 천천히 한 번 고개를 끄덕인다.", caption: "정확한 한글", voice: "안녕하세요", reference: "shot-01.png" }], audio: "narration" });
assert.match(engine.productionPrompt(source), /한글 &amp; &lt;검증&gt;/);
assert.match(engine.videoPrompt(source), /원문 72%/);
const i2v = engine.videoPrompt({ ...source, videoMode: "i2v" }, 0);
assert.match(i2v, /shot-01.png/);
assert.match(i2v, /끄덕인다/);
assert.doesNotMatch(i2v, /테스트 화면|원문 72%|내용 근거/);
assert.match(engine.revisionPrompt({ ...source, revision: "두 번째 자막만 수정" }), /두 번째 자막만 수정/);
assert.match(engine.revisionPrompt(source), /수동 편집은 보존/);
assert.doesNotMatch(engine.videoPrompt({ ...source, audio: "silent" }), /안녕하세요/);
assert.match(engine.storyboard(source), /0–7초/);
console.log("PASS: catalog, all target/output combinations, normalization, timing, i2v/t2v separation, revision prompts");

const projectRoot = path.resolve(import.meta.dirname, "..");
const evidence = await fs.mkdtemp(path.join(os.tmpdir(), "promptdeck-motion-"));
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp" };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const routedPath = { "/": "/static-pages/home.html", "/features": "/static-pages/features.html", "/app": "/index.html" }[pathname] || pathname;
    const filename = path.resolve(projectRoot, `.${routedPath}`);
    if (!filename.startsWith(`${projectRoot}${path.sep}`)) { res.writeHead(403).end(); return; }
    const body = await fs.readFile(filename);
    res.writeHead(200, { "Content-Type": `${mime[path.extname(filename)] || "application/octet-stream"}; charset=utf-8` }).end(body);
  } catch (_) { res.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  try { browser = await chromium.launch({ channel: "msedge", headless: true }); }
  catch (_) { browser = await chromium.launch({ headless: true }); }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin });
  const page = await context.newPage(), pageErrors = [], resourceErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  page.on("response", (r) => { if (r.status() >= 400 && /motion-prompt/.test(r.url())) resourceErrors.push(r.url()); });
  await page.goto(`${origin}/index.html?tab=motionPrompt`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#paneMotionPrompt.active");
  assert.equal(await page.locator("[data-motion-template]").count(), 18);
  assert.ok(await page.locator("#motionGallery img").evaluateAll((imgs) => imgs.every((img) => img.complete && img.naturalWidth > 0)));
  assert.ok(await page.locator("#tabActions").evaluate((el) => el.parentElement.matches(".motion-result-stack") && el === el.parentElement.firstElementChild));
  assert.equal(await page.locator(".app-tabs-bar #tabActions").count(), 0);
  for (const template of catalog.templates) {
    await page.locator(`[data-motion-template="${template.id}"]`).click();
    assert.equal(await page.locator("#motionSelectedName").textContent(), template.name);
    assert.equal(await page.locator("#motionStage svg").count(), 1);
    await page.locator("#motionPlayBtn").click();
    assert.equal(await page.locator("#motionPlayBtn").getAttribute("aria-pressed"), "true");
  }
  await page.locator('[data-motion-category="product"]').click();
  assert.equal(await page.locator("[data-motion-template]").count(), 3);
  await page.locator("#motionSearch").fill("없는-유형");
  assert.equal(await page.locator("[data-motion-template]").count(), 0);
  await page.locator("#motionSearch").fill("");
  await page.locator('[data-motion-category="all"]').click();
  await page.locator('[data-motion-template="ui"]').click();
  await page.locator("#motionSampleBtn").click();
  await page.locator("#motionTitle").fill("지역기업 지원사업 <검증>");
  await page.locator("#motionSource").fill("기간 2026-11-01 ~ 2026-11-10 / 접수: 공식 홈페이지");
  await page.locator("#motionDuration").fill("31");
  await page.locator("#motionDuration").press("Tab");
  assert.match(await page.locator("#motionSpecs").textContent(), /31초/);
  assert.match(await page.locator("#motionOutput").inputValue(), /&lt;검증&gt;/);
  await page.locator('[data-motion-scene="0"] [data-scene-field="caption"]').fill("정확한 한글 안내");
  await page.locator('[data-motion-template="logo"]').click();
  assert.equal(await page.locator('[data-motion-scene="0"] [data-scene-field="caption"]').inputValue(), "정확한 한글 안내");
  await page.locator("#motionAddSceneBtn").click();
  assert.equal(await page.locator("[data-motion-scene]").count(), 4);
  await page.locator('[data-motion-scene="3"] [data-scene-field="visual"]').fill("추가한 끝 장면");
  await page.locator('[data-motion-scene="3"] [data-scene-action="up"]').click();
  assert.equal(await page.locator('[data-motion-scene="2"] summary strong').textContent(), "추가한 끝 장면");
  await page.locator('[data-motion-scene="2"] summary').click();
  await page.locator('[data-motion-scene="2"] [data-scene-action="delete"]').click();
  assert.equal(await page.locator("[data-motion-scene]").count(), 3);
  await page.locator("#motionVideoMode").selectOption("i2v");
  await page.locator('[data-motion-scene="0"] [data-scene-field="reference"]').fill("원본-01.png");
  await page.locator("#motionTarget").selectOption("gpt");
  await page.locator("#motionFormat").selectOption("remotion");
  assert.match(await page.locator("#motionOutput").inputValue(), /^# 역할/);
  assert.match(await page.locator("#motionOutput").inputValue(), /중첩 프레임/);
  await page.locator("#motionOutputVideo").click();
  await page.locator("#motionShotSelect").selectOption("0");
  assert.match(await page.locator("#motionOutput").inputValue(), /원본-01.png/);
  assert.doesNotMatch(await page.locator("#motionOutput").inputValue(), /장면 2 ·|기간 2026/);
  await page.locator("#motionOutputRevision").click();
  await page.locator("#motionRevision").fill("1번 자막만 1초 더 유지");
  assert.match(await page.locator("#motionOutput").inputValue(), /1번 자막만 1초 더 유지/);
  await page.locator("#motionCopyBtn").click();
  assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n"), await page.locator("#motionOutput").inputValue());
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#motionDownloadBtn").click();
  const download = await downloadPromise;
  const savedFile = await download.path();
  assert.equal(await fs.readFile(savedFile, "utf8"), await page.locator("#motionOutput").inputValue());
  await page.locator("#motionResetBtn").click();
  assert.equal(await page.locator("#motionTitle").inputValue(), "");
  await page.locator("#motionUndoBtn").click();
  assert.equal(await page.locator("#motionTitle").inputValue(), "지역기업 지원사업 <검증>");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("#paneMotionPrompt.active");
  assert.equal(await page.locator("#motionTitle").inputValue(), "지역기업 지원사업 <검증>");
  assert.equal(await page.locator("#motionVideoMode").inputValue(), "i2v");
  assert.equal(await page.locator('[data-motion-scene="0"] [data-scene-field="reference"]').inputValue(), "원본-01.png");
  await page.locator('[data-tab-group-filter="visualAsset"]').click();
  await page.locator("#tabBtnMapPrompt").click();
  assert.ok(await page.locator("#paneMapPrompt").evaluate((el) => el.classList.contains("active")));
  await page.locator('[data-tab-group-filter="deckImage"]').click();
  // This existing legacy tab is intentionally hidden until activated.
  await page.locator("#tabBtnSlideDocument").evaluate((element) => element.click());
  assert.equal(await page.locator("#paneSlideDocument .slide-sub-tab-btn").count(), 4);
  for (const button of await page.locator("#paneSlideDocument .slide-sub-tab-btn").all()) await button.click();
  await page.locator('[data-tab-group-filter="motionVideo"]').click();
  await page.locator("#motionResetBtn").click();
  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => { document.documentElement.dataset.theme = value; }, theme);
    for (const width of [1440, 1024, 810, 720, 390, 360]) {
      await page.setViewportSize({ width, height: 1000 });
      const views = width <= 720 ? ["gallery", "brief", "result"] : ["desktop"];
      for (const view of views) {
        if (view !== "desktop") await page.locator(`.motion-mobile-nav [data-motion-view="${view}"]`).click();
        const metrics = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth, paneOverflow: document.getElementById("motionPromptApp").scrollWidth - document.getElementById("motionPromptApp").clientWidth, tabScroll: [...document.querySelectorAll(".app-tabs,.app-tabs-bar")].some((el) => ["auto", "scroll"].includes(getComputedStyle(el).overflowY)) }));
        assert.ok(metrics.overflow <= 1 && metrics.paneOverflow <= 1, `${theme} ${width} ${view}: horizontal overflow ${JSON.stringify(metrics)}`);
        assert.equal(metrics.tabScroll, false);
        if (width <= 720) {
          assert.equal(await page.locator("#tabActions").isVisible(), false);
          assert.ok(await page.locator('#mobileTabActions [data-proxy-target="motionCopyBtn"]').isVisible());
        }
        if ((width === 1440 || width === 390) && (view === "desktop" || view === "gallery" || view === "result")) {
          await page.evaluate(() => scrollTo(0, 0));
          await page.screenshot({ path: path.join(evidence, `${theme}-${width}-${view}.png`) });
        }
      }
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("#motionPlayBtn").click();
  assert.equal(await page.locator("#motionStage .motion-art-rise").evaluate((el) => getComputedStyle(el).animationName), "none");
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${origin}/features`, { waitUntil: "domcontentloaded" });
    assert.equal(await page.locator(".landing-tool").count(), 14);
    assert.equal(await page.locator('#tool-motionPrompt ol > li').count(), 3);
    assert.equal(await page.locator('.public-nav a[href="/features#tool-motionPrompt"]').count(), 1);
    await page.locator("#tool-motionPrompt summary").click();
    await page.locator('[data-tool-link="motionPrompt"]').click();
    await page.waitForSelector("#paneMotionPrompt.active");
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    assert.equal(await page.locator("[data-start-tool]").count(), 9);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.locator('[data-start-tool="motionPrompt"]').click();
    await page.waitForSelector("#paneMotionPrompt.active");
  }
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(resourceErrors, []);
  console.log("PASS: 18 sample images/previews, filters, scenes, output modes, copy/download, restore/reset, existing tabs, desktop/mobile, light/dark, reduced motion, homepage/feature navigation");
  console.log(`Screenshots: ${evidence}`);
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
