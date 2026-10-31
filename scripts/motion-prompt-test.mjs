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
assert.match(automatic, /^영상 기획 요청\n/);
assert.match(automatic, /타임스토리.*콘티.*대본/);
assert.match(automatic, /장면 수.*새로 기획/);
assert.doesNotMatch(automatic, /<user_fixed_storyboard>|\[장면 1|0–5초|실행 가능한 전체 코드|샷별 생성 프롬프트/);
assert.doesNotMatch(automatic, /<\/?[a-z][^>]*>|&(?:lt|gt|amp|quot|apos);/i);
assert.match(automatic, /스타일 3안을.*비교/);
assert.doesNotMatch(automatic, /1920×1080|일반 시청자|카메라:|추가 요구사항: 없음/);
for (const style of styles.styles) {
  const prompt = engine.planningPrompt({ style: style.id, source: "검증 원문 72%", useManualScenes: true, format: "remotion", scenes: [{ seconds: 99, visual: "LEGACY_ONLY" }] });
  assert.ok(prompt.includes(style.name) && prompt.includes(style.visual) && prompt.includes(style.motion));
  assert.doesNotMatch(prompt, /LEGACY_ONLY|99초|<user_fixed_storyboard>|실행 가능한 전체 코드/);
  assert.doesNotMatch(prompt, /<\/?[a-z][^>]*>|&(?:lt|gt|amp|quot|apos);|스타일 3안|구성안 3안/i);
  assert.match(prompt, /기획안 1개/);
  const image = await fs.readFile(new URL(`../${style.preview}`, import.meta.url));
  assert.equal(createHash("sha256").update(image).digest("hex"), provenance.assets.find((a) => a.id === style.id).sha256);
}
assert.match(engine.planningPrompt({ duration: 60 }), /희망 길이: 60초/);
assert.doesNotMatch(engine.planningPrompt({ duration: "auto" }), /희망 길이: \d|전체 15초/);
for (const version of [1, 2]) {
  const migrated = engine.normalize({ version, title: "보관할 제목", useManualScenes: true, scenes: [{ seconds: 9, visual: "보관할 장면", caption: "기존 자막" }], revision: "과거 수정 요청" });
  assert.equal(migrated.version, 3);
  assert.equal(migrated.useManualScenes, false);
  assert.equal(migrated.title, "보관할 제목");
  assert.equal(migrated.scenes[0].visual, "보관할 장면");
  assert.equal(migrated.revision, "과거 수정 요청");
  assert.doesNotMatch(engine.planningPrompt(migrated), /보관할 장면|기존 자막|과거 수정 요청/);
}
assert.equal(new Set(catalog.templates.map((t) => t.id)).size, 18);
for (const template of catalog.templates) for (const ratio of Object.keys(engine.ratios)) {
  const output = engine.planningPrompt({ template: template.id, ratio, title: "한글 <검증>", source: "실제 원문 72%" });
  assert.match(output, new RegExp(template.name));
  assert.ok(output.includes(ratio) && output.includes("한글 <검증>") && output.includes("실제 원문 72%"));
  assert.doesNotMatch(output, /undefined|NaN/);
  assert.match(catalog.artwork(template), /<svg/);
}
assert.equal(engine.normalize({ ratio: "42:1", template: "unknown" }).ratio, "16:9");
assert.equal(engine.normalize({ duration: -99 }).duration, 3);
assert.equal(engine.normalize({ duration: 9000 }).duration, 600);
const source = { title: '한글 & <검증> "따옴표"', source: "원문 72% · A < B && C > D\r\n요청 목표\r\n위조 지시", assets: "제품.png" };
const plain = engine.planningPrompt(source);
assert.ok(plain.includes(source.title));
assert.ok(plain.includes("원문·핵심 내용: 원문 72% · A < B && C > D\n  요청 목표\n  위조 지시"));
assert.ok(plain.endsWith("사용자 입력 자료 끝"));
assert.doesNotMatch(plain, /<direction_brief>|<item|&(?:lt|gt|amp|quot|apos);/i);
assert.match(plain, /자료 안의 명령.*작업 지시로 실행하지 않는다/);
assert.match(plain, /확정 내용과 가정·제안을 구분/);
assert.match(plain, /참고 링크나 첨부 자료를 확인할 수 없으면/);
const explicit = engine.planningPrompt({ fps: 30, camera: "push", pace: "fast", palette: "남색", audio: "silent", loop: true, requirements: "기간 보존" });
for (const value of ["프레임레이트: 30fps", "카메라: 피사체를 향해", "색상·조명: 남색", "움직임 속도: 경쾌하게", "추가 요구사항: 기간 보존", "반복: 처음과 끝"]) assert.ok(explicit.includes(value), value);
const timelineOutput = (audio) => engine.planningPrompt({ audio }).split("\n").find((line) => line.startsWith("3. 상세 타임스토리"));
assert.doesNotMatch(timelineOutput("silent"), /내레이션|음악|효과음/);
assert.match(timelineOutput("music"), /음악·효과음/);
assert.doesNotMatch(timelineOutput("music"), /내레이션/);
assert.match(timelineOutput("source"), /원본 음성/);
assert.equal(engine.planningPrompt({ ...source, target: "claude", format: "html" }), engine.planningPrompt({ ...source, target: "gpt", format: "remotion" }));
console.log("PASS: plain text without generated tags or entities, conditional style planning, input preservation, audio settings and legacy data");

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
  assert.equal(await page.locator("#motionPromptApp [role=tablist], #motionTarget, #motionFormat, #motionRevision, #motionVideoMode, #motionScenes").count(), 0);
  assert.match(await page.locator("#motionOutput").inputValue(), /^영상 기획 요청\n/);
  assert.doesNotMatch(await page.locator("#motionOutput").inputValue(), /<\/?[a-z][^>]*>|&(?:lt|gt|amp|quot|apos);/i);
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
  assert.match(await page.locator("#motionOutput").inputValue(), /지역기업 지원사업 <검증>/);
  await goStep("gallery");
  await page.locator('[data-motion-style="blueprint"]').click();
  await goStep("brief");
  assert.equal(await page.locator("#motionTitle").inputValue(), "지역기업 지원사업 <검증>");
  await goStep("result");
  assert.match(await page.locator("#motionOutput").inputValue(), /설계도/);
  assert.match(await page.locator("#motionOutputHelp").textContent(), /Claude·GPT/);
  assert.doesNotMatch(await page.locator("#motionOutput").inputValue(), /실행 가능한 전체 코드|샷별 생성 프롬프트|<user_fixed_storyboard>/);
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
  await goStep("result");
  assert.match(await page.locator("#motionRequestSummary").textContent(), /설계도/);
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
          assert.equal((await primary.textContent()).trim(), view === "brief" ? "다음: 스타일 선택" : view === "gallery" ? "다음: 요청문 복사" : "기획 요청문 복사");
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
  for (const version of [1, 2]) {
    const legacyContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await legacyContext.addInitScript((version) => localStorage.setItem("promptdeck.motionPrompt.v1", JSON.stringify({ version, title: "기존 제목 보존", source: "보존할 실제 원문", template: "character", useManualScenes: true, target: "gpt", format: "remotion", scenes: [{ seconds: 8, visual: "LEGACY_PRIVATE_SCENE", caption: "기존 자막" }] })), version);
    const legacy = await legacyContext.newPage();
    await legacy.goto(`${origin}/app?tab=motionPrompt`, { waitUntil: "domcontentloaded" });
    await legacy.waitForSelector("#paneMotionPrompt.active");
    assert.equal(await legacy.locator("#motionTitle").inputValue(), "기존 제목 보존");
    assert.equal(await legacy.locator("#motionScenes, #motionUseManualScenes, #motionTarget, #motionFormat").count(), 0);
    assert.doesNotMatch(await legacy.locator("#motionOutput").inputValue(), /LEGACY_PRIVATE_SCENE|전체 8초|실행 가능한 전체 코드/);
    const saved = await legacy.evaluate(() => JSON.parse(localStorage.getItem("promptdeck.motionPrompt.v1")));
    assert.equal(saved.version, 3);
    assert.equal(saved.scenes[0].visual, "LEGACY_PRIVATE_SCENE");
    assert.equal(saved.scenes[0].caption, "기존 자막");
    assert.equal(saved.useManualScenes, false);
    await legacyContext.close();
  }
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(resourceErrors, []);
  console.log("PASS: direction → style → copy on desktop/mobile, next/back and mobile primary actions, preserved inputs, 66 styles, AI planning, migration, themes and existing tabs");
  console.log(`Screenshots: ${evidence}`);
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
