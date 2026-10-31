import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { chromium } from "playwright";
import "../src/motion-prompt-catalog.js";
import "../src/motion-style-catalog.js";
import "../src/motion-prompt-engine.js";

const engine = globalThis.PromptDeckMotionEngine;
const catalog = globalThis.PromptDeckMotionCatalog;
const styles = globalThis.PromptDeckMotionStyles;
const provenance = JSON.parse(await fs.readFile(new URL("../assets/motion-style-previews/manifest.json", import.meta.url), "utf8"));
assert.equal(provenance.assets.length, 66); assert.equal(provenance.author, "LemoLab"); assert.equal(provenance.imageLicense, "CC BY 4.0");
assert.equal(styles.styles.length, 66);
assert.equal(Object.keys(styles.categories).length, 12);
assert.equal(new Set(styles.styles.map((s) => s.id)).size, 66);
const automatic = engine.planningPrompt(engine.defaults());
assert.match(automatic, /타임스토리|콘티/);
assert.match(automatic, /장면 수.*직접 설계|장면 수.*새로 기획/);
assert.doesNotMatch(automatic, /<user_fixed_storyboard>|\[장면 1|전체 15초|0–5초/);
assert.doesNotMatch(engine.storyboard(engine.defaults()), /\[장면 1|0–5초/);
for (const style of styles.styles) {
  const prompt = engine.planningPrompt({ style: style.id, source: "검증 원문 72%", scenes: [{ seconds: 99, visual: "LEGACY_ONLY" }] });
  assert.ok(prompt.includes(style.name) && prompt.includes(style.visual) && prompt.includes(style.motion));
  assert.doesNotMatch(prompt, /LEGACY_ONLY|99초|<user_fixed_storyboard>/);
  assert.match(engine.videoPrompt({ style: style.id }), /샷별 생성 프롬프트/);
  const image = await fs.readFile(new URL(`../${style.preview}`, import.meta.url));
  assert.equal(image[0], 255);
  assert.equal(createHash("sha256").update(image).digest("hex"), provenance.assets.find((a) => a.id === style.id).sha256);
}
assert.match(engine.planningPrompt({ duration: 60 }), /희망 전체 길이 60초/);
assert.doesNotMatch(engine.planningPrompt({ duration: "auto" }), /희망 전체 길이 \d|전체 15초/);
const migrated = engine.normalize({ version: 1, title: "보관할 제목", scenes: [{ seconds: 9, visual: "보관할 장면" }] });
assert.equal(migrated.version, 2); assert.equal(migrated.useManualScenes, false);
assert.equal(migrated.title, "보관할 제목"); assert.equal(migrated.scenes[0].visual, "보관할 장면");
assert.equal(new Set(catalog.templates.map((t) => t.id)).size, 18);
for (const template of catalog.templates) {
  const state = engine.normalize({ template: template.id, useManualScenes: true, fps: 30 });
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
assert.equal(malformed.template, "auto");
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
const source = engine.normalize({ useManualScenes: true, title: "한글 & <검증>", source: "원문 72% · 2026-11-01", assets: "제품.png", scenes: [{ seconds: 7, visual: "테스트 화면", motion: "피사체가 천천히 한 번 고개를 끄덕인다.", caption: "정확한 한글", voice: "안녕하세요", reference: "shot-01.png" }], audio: "narration" });
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
  const goStep = (step) => page.locator(`.motion-step-nav [data-motion-view="${step}"]`).click();
  page.on("pageerror", (e) => pageErrors.push(e.message));
  page.on("response", (r) => { if (r.status() >= 400 && /motion-prompt/.test(r.url())) resourceErrors.push(r.url()); });
  await page.goto(`${origin}/index.html?tab=motionPrompt`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#paneMotionPrompt.active");
  assert.equal(await page.locator("#motionPromptApp").getAttribute("data-mobile-view"), "brief");
  assert.deepEqual(await page.locator(".motion-step-nav [data-motion-view]").evaluateAll((buttons) => buttons.map((b) => b.dataset.motionView)), ["brief", "gallery", "result"]);
  assert.equal(await page.locator(".motion-editor").isVisible(), true);
  assert.equal(await page.locator(".motion-library").isVisible(), false);
  assert.equal(await page.locator(".motion-result-stack").isVisible(), false);
  assert.equal(await page.locator("#motionCopyBtn").isVisible(), false);
  assert.equal(await page.locator("[data-motion-style]").count(), 66);
  assert.equal(await page.locator(".motion-scenes-section").isVisible(), false);
  assert.equal(await page.locator("#motionFormat").isVisible(), false);
  assert.equal(await page.locator("#motionDurationChoice").inputValue(), "auto");
  assert.doesNotMatch(await page.locator("#motionOutput").inputValue(), /\[장면 1|0–5초/);
  assert.ok(await page.locator("#tabActions").evaluate((el) => el.parentElement.matches(".motion-result-stack") && el === el.parentElement.firstElementChild));
  assert.equal(await page.locator(".app-tabs-bar #tabActions").count(), 0);
  await page.locator("#motionTitle").fill("순서 확인용 구성 방향");
  await page.locator("#motionPrimaryBtn").click();
  assert.equal(await page.locator("#motionPromptApp").getAttribute("data-mobile-view"), "gallery");
  assert.equal(await page.locator(".motion-editor").isVisible(), false);
  assert.equal(await page.locator(".motion-library").isVisible(), true);
  assert.equal(await page.locator(".motion-request-block").isVisible(), false);
  for (const style of styles.styles) {
    await page.locator(`[data-motion-style="${style.id}"]`).click();
    assert.equal(await page.locator("#motionSelectedName").textContent(), style.name);
    await page.locator("#motionStage img").evaluate((img) => img.decode());
    assert.match(await page.locator("#motionOutput").inputValue(), new RegExp(style.name));
    assert.match(await page.locator("#motionReferenceLinks").textContent(), /원본 참고영상/);
  }
  await page.locator('[data-motion-category="painting"]').click();
  assert.equal(await page.locator("[data-motion-style]").count(), 8);
  await page.locator("#motionSearch").fill("없는-유형");
  assert.equal(await page.locator("[data-motion-style]").count(), 0);
  await page.locator("#motionSearch").fill("");
  await page.locator('[data-motion-category="all"]').click();
  await page.locator('[data-motion-style="watercolor"]').click();
  await page.locator("#motionPrimaryBtn").click();
  assert.equal(await page.locator("#motionPromptApp").getAttribute("data-mobile-view"), "result");
  assert.equal(await page.locator(".motion-preview-block").isVisible(), false);
  assert.equal(await page.locator("#motionCopyBtn").isVisible(), true);
  assert.match(await page.locator("#motionRequestSummary").textContent(), /순서 확인용 구성 방향.*수채화/);
  await goStep("gallery");
  await page.locator("#motionBackBtn").click();
  assert.equal(await page.locator("#motionTitle").inputValue(), "순서 확인용 구성 방향");
  assert.equal(await page.locator('#motionAutoStyleBtn').getAttribute("aria-pressed"), "false");
  await page.locator("#motionPurpose").selectOption("ui");
  await page.locator("#motionSampleBtn").click();
  await page.locator("#motionTitle").fill("지역기업 지원사업 <검증>");
  await page.locator("#motionSource").fill("기간 2026-11-01 ~ 2026-11-10 / 접수: 공식 홈페이지");
  await page.locator("#motionDurationChoice").selectOption("custom");
  await page.locator("#motionDuration").fill("31");
  await page.locator("#motionDuration").press("Tab");
  assert.match(await page.locator("#motionSpecs").textContent(), /31초/);
  assert.match(await page.locator("#motionOutput").inputValue(), /&lt;검증&gt;/);
  await page.locator(".motion-legacy-scenes > summary").click();
  await page.locator('[data-motion-scene="0"] [data-scene-field="caption"]').fill("정확한 한글 안내");
  assert.doesNotMatch(await page.locator("#motionOutput").inputValue(), /정확한 한글 안내/);
  await page.locator("#motionUseManualScenes").check();
  assert.match(await page.locator("#motionOutput").inputValue(), /정확한 한글 안내/);
  await goStep("gallery");
  await page.locator('[data-motion-style="blueprint"]').click();
  await goStep("brief");
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
  await goStep("result");
  await page.locator("#motionTarget").selectOption("gpt");
  await page.locator("#motionOutputBoard").click();
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
  await goStep("result");
  await page.locator("#motionResetBtn").click();
  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => { document.documentElement.dataset.theme = value; }, theme);
    for (const width of [1440, 1024, 810, 720, 390, 360]) {
      await page.setViewportSize({ width, height: 1000 });
      const views = ["brief", "gallery", "result"];
      for (const view of views) {
        await goStep(view);
        assert.equal(await page.locator(".motion-editor").isVisible(), view === "brief");
        assert.equal(await page.locator(".motion-library").isVisible(), view === "gallery");
        assert.equal(await page.locator(".motion-request-block").isVisible(), view === "result");
        const metrics = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth, paneOverflow: document.getElementById("motionPromptApp").scrollWidth - document.getElementById("motionPromptApp").clientWidth, tabScroll: [...document.querySelectorAll(".app-tabs,.app-tabs-bar")].some((el) => ["auto", "scroll"].includes(getComputedStyle(el).overflowY)) }));
        assert.ok(metrics.overflow <= 1 && metrics.paneOverflow <= 1, `${theme} ${width} ${view}: horizontal overflow ${JSON.stringify(metrics)}`);
        assert.equal(metrics.tabScroll, false);
        if (width <= 720) {
          assert.equal(await page.locator("#tabActions").isVisible(), false);
          const primary = page.locator('#mobileTabActions [data-proxy-target="motionPrimaryBtn"]');
          assert.ok(await primary.isVisible());
          assert.equal((await primary.textContent()).trim(), view === "brief" ? "다음: 스타일 선택" : view === "gallery" ? "다음: 요청문 복사" : "프롬프트 복사");
          if (view !== "result") {
            await primary.click();
            assert.equal(await page.locator("#motionPromptApp").getAttribute("data-mobile-view"), view === "brief" ? "gallery" : "result");
            await goStep(view);
          }
        }
        if (width === 1440 || width === 390) {
          await page.evaluate(() => scrollTo(0, 0));
          await page.screenshot({ path: path.join(evidence, `${theme}-${width}-${view}.png`) });
        }
      }
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await goStep("gallery");
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
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => localStorage.setItem("promptdeck.motionPrompt.v1", JSON.stringify({ version: 1, title: "기존 제목 보존", source: "보존할 실제 원문", template: "character", scenes: [{ seconds: 8, visual: "LEGACY_PRIVATE_SCENE", caption: "기존 자막" }] })));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("#paneMotionPrompt.active");
  assert.equal(await page.locator("#motionTitle").inputValue(), "기존 제목 보존");
  assert.equal(await page.locator("#motionUseManualScenes").isChecked(), false);
  assert.equal(await page.locator(".motion-scenes-section").isVisible(), false);
  assert.doesNotMatch(await page.locator("#motionOutput").inputValue(), /LEGACY_PRIVATE_SCENE|전체 8초/);
  assert.equal(await page.locator('[data-scene-field="visual"]').first().inputValue(), "LEGACY_PRIVATE_SCENE");
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("promptdeck.motionPrompt.v1")).version), 2);
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(resourceErrors, []);
  console.log("PASS: direction → style → copy on desktop/mobile, next/back and mobile primary actions, preserved inputs, 66 styles, AI planning, migration, themes and existing tabs");
  console.log(`Screenshots: ${evidence}`);
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
