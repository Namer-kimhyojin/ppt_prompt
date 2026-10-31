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
assert.equal(catalog.samples.length, 10);
assert.equal(new Set(catalog.samples.map((sample) => sample.id)).size, 10);
assert.equal(new Set(catalog.samples.map((sample) => sample.brief.title)).size, 10);
for (const sample of catalog.samples) {
  assert.ok(sample.templates.length >= 2 && sample.styles.length >= 2);
  for (const id of sample.templates) assert.ok(catalog.templates.some((entry) => entry.id === id), id);
  for (const id of sample.styles) assert.ok(styles.get(id), id);
  for (const field of ["title", "audience", "goal", "source", "assets", "requirements", "channel", "voice", "bgm", "sfx", "assetMode"]) assert.ok(sample.brief[field]?.trim(), sample.id + ": " + field);
}
for (const random of [() => 0, () => 0.999999, Math.random]) {
  const draw = catalog.createSamplePicker(random);
  let current = engine.defaults(), previousId = "";
  for (let cycle = 0; cycle < 3; cycle += 1) {
    const seen = new Set();
    for (let index = 0; index < 10; index += 1) {
      const { sample, values } = draw(current);
      assert.notEqual(sample.id, previousId);
      assert.equal(seen.has(sample.id), false);
      seen.add(sample.id); previousId = sample.id;
      assert.ok(sample.templates.includes(values.template) && sample.styles.includes(values.style));
      assert.notEqual(values.template, current.template);
      assert.notEqual(values.style, current.style);
      const normalized = engine.normalize(values);
      assert.equal(normalized.template, values.template);
      assert.equal(normalized.style, values.style);
      assert.equal(normalized.ratio, values.ratio);
      assert.equal(normalized.duration, values.duration);
      assert.equal(normalized.source, sample.brief.source);
      assert.doesNotMatch(JSON.stringify(sample.brief), /가상/);
      const prompt = engine.planningPrompt(normalized);
      assert.ok(prompt.includes(sample.brief.title) && prompt.includes(styles.get(values.style).name));
      assert.doesNotMatch(prompt, /<\/?[a-z][^>]*>|&(?:lt|gt|amp|quot|apos);/i);
      current = normalized;
    }
    assert.equal(seen.size, 10);
  }
}
const automatic = engine.planningPrompt(engine.defaults());
assert.match(automatic, /^영상 기획 제안\n/);
assert.ok(automatic.length < 500, "default request should stay concise");
for (const word of ["콘셉트", "핵심 메시지", "전체 길이", "타임스토리", "콘티", "시작–종료", "화면/배경", "동작", "자막", "음성", "배경음악", "효과음", "에셋"]) assert.ok(automatic.includes(word), word);
assert.doesNotMatch(automatic, /<\/?[a-z][^>]*>|&(?:lt|gt|amp|quot|apos);|기획 원칙|사용자 입력 자료 시작|가상 데이터/i);
assert.match(automatic, /3안 비교 후 1안/);
for (const style of styles.styles) {
  const prompt = engine.planningPrompt({ style: style.id, source: "검증 원문 72%", useManualScenes: true, format: "remotion", scenes: [{ seconds: 99, visual: "LEGACY_ONLY" }] });
  assert.ok(prompt.includes(style.name) && prompt.includes(style.visual) && prompt.includes(style.motion));
  assert.doesNotMatch(prompt, /LEGACY_ONLY|99초|<user_fixed_storyboard>|https:\/\/(?:github|raw\.github)|실행 가능한 전체 코드|스타일 3안|구성안 3안/);
  assert.match(prompt, /기획안 1개/);
  const bytes = await fs.readFile(new URL(`../${style.preview}`, import.meta.url));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), provenance.assets.find((a) => a.id === style.id).sha256);
}
assert.match(engine.planningPrompt({ duration: 60 }), /규격: 16:9 \/ 60초/);
assert.match(engine.planningPrompt({ duration: "auto" }), /길이 AI 추천/);
const audioMigration = { auto: ["auto", "auto", "auto"], silent: ["none", "none", "none"], music: ["none", "suggest", "essential"], narration: ["narration", "suggest", "auto"], source: ["source", "auto", "auto"] };
for (const version of [1, 2, 3]) for (const [audio, expected] of Object.entries(audioMigration)) {
  const migrated = engine.normalize({ version, audio, title: "보관할 제목", useManualScenes: true, scenes: [{ seconds: 9, visual: "보관할 장면" }], revision: "과거 수정 요청" });
  assert.equal(migrated.version, 4);
  assert.deepEqual([migrated.voice, migrated.bgm, migrated.sfx], expected);
  assert.equal(migrated.title, "보관할 제목");
  assert.equal(migrated.scenes[0].visual, "보관할 장면");
  assert.equal(migrated.revision, "과거 수정 요청");
  assert.doesNotMatch(engine.planningPrompt(migrated), /보관할 장면|과거 수정 요청/);
}
const oldSample = engine.normalize({ source: "연습용 가상 데이터입니다. 기관·제품·행사·수치는 예시이며 실제 홍보 전에 확정 자료로 교체하세요.\n\n가상 제품: 컵\n가격: 23,000원", assets: "미첨부 예시 자료: 가상 경로 도식" });
assert.equal(oldSample.source, "제품: 컵\n가격: 23,000원");
assert.doesNotMatch(engine.planningPrompt(oldSample), /가상/);
assert.equal(engine.normalize({ source: "가상현실 교육에 관한 원문" }).source, "가상현실 교육에 관한 원문");
for (const template of catalog.templates) for (const ratio of Object.keys(engine.ratios)) {
  const output = engine.planningPrompt({ template: template.id, ratio, title: "한글 <검증>", source: "실제 원문 72%" });
  assert.ok(output.includes(template.name) && output.includes(ratio) && output.includes("한글 <검증>") && output.includes("실제 원문 72%"));
  assert.doesNotMatch(output, /undefined|NaN/);
  assert.match(catalog.artwork(template), /<svg/);
}
const source = { title: '한글 & <검증> "따옴표"', source: "원문 72% · A < B && C > D\r\n요청 목표", channel: "전시장 화면", background: "실제 행사장", assets: "제품.png, voice.wav, music.mp3", voiceDirection: "한국어 중저음" };
const plain = engine.planningPrompt(source);
assert.ok(plain.includes(source.title) && plain.includes("- 내용: 원문 72% · A < B && C > D\n  - 요청 목표"));
assert.ok(plain.includes("- 게시·상영: 전시장 화면") && plain.includes("- 장소·배경: 실제 행사장"));
assert.doesNotMatch(plain, /<direction_brief>|<item|&(?:lt|gt|amp|quot|apos);/i);
const muted = engine.planningPrompt({ voice: "none", bgm: "none", sfx: "none", voiceDirection: "HIDDEN_VOICE" });
assert.match(muted, /소리: 무음/);
assert.doesNotMatch(muted, /내레이션 원고|HIDDEN_VOICE|배경음악 분위기|효과음 종류/);
for (const voice of Object.keys(engine.voices)) for (const bgm of Object.keys(engine.musicModes)) for (const sfx of Object.keys(engine.effectModes)) {
  const p = engine.planningPrompt({ voice, bgm, sfx, voiceDirection: "VOICE_TONE" });
  assert.doesNotMatch(p, /undefined|NaN/);
  if (voice === "none") assert.doesNotMatch(p, /내레이션 원고|등장인물별 대사|VOICE_TONE/);
  if (voice === "source") { assert.match(p, /원본 음성 활용 구간·발언 보존/); assert.doesNotMatch(p, /VOICE_TONE/); }
  if (voice === "narration") assert.match(p, /내레이션 원고·목소리/);
  if (voice === "dialogue") assert.match(p, /등장인물별 대사·목소리/);
  if (bgm === "none") assert.doesNotMatch(p, /배경음악 분위기·진입/);
  if (bgm === "source") assert.match(p, /제공 음원 사용 구간/);
  if (sfx === "none") assert.doesNotMatch(p, /효과음 종류·타이밍/);
}
for (const assetMode of Object.keys(engine.assetModes)) {
  const p = engine.planningPrompt({ assetMode, assets: "logo.svg, clip.mp4" });
  assert.ok(p.includes("logo.svg, clip.mp4"));
  if (assetMode !== "auto") assert.ok(p.includes(engine.assetModes[assetMode]));
}
assert.equal(engine.normalize({ voice: "__proto__", bgm: "unknown" }).voice, "auto");
const legacyVisual = { renderStyle: "collage", pace: "calm", camera: "push", transition: "match", palette: "LEGACY_COLOR_ONLY", fps: 30 };
for (const [key, value] of Object.entries(legacyVisual)) assert.equal(engine.normalize(legacyVisual)[key], value);
assert.doesNotMatch(engine.planningPrompt(legacyVisual), /LEGACY_COLOR_ONLY|사진·타이포 콜라주|카메라:|장면 전환:|fps/);
assert.equal(engine.planningPrompt({ ...source, target: "claude", format: "html" }), engine.planningPrompt({ ...source, target: "gpt", format: "remotion" }));
console.log("PASS: concise bullets, clean samples, essentials, independent voice/music/effects/assets and migration");

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
  assert.equal(await page.locator('#motionPromptApp [data-motion-field="renderStyle"], #motionPromptApp [data-motion-field="pace"], #motionPromptApp [data-motion-field="camera"], #motionPromptApp [data-motion-field="transition"], #motionPromptApp [data-motion-field="palette"]').count(), 0);
  assert.equal(await page.locator('#motionAudio, #motionPromptApp [data-motion-field="fps"]').count(), 0);
  assert.equal(await page.locator("#motionVoice, #motionBgm, #motionSfx, #motionAssetMode").count(), 4);
  assert.match(await page.locator("#motionOutput").inputValue(), /^영상 기획 제안\n/);
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
  await goStep("gallery");
  await page.locator('[data-motion-category="painting"]').click();
  await page.locator("#motionSearch").fill("수채화");
  await goStep("brief");
  const sampleIds = new Set();
  let beforeSample;
  for (let index = 0; index < 10; index += 1) {
    beforeSample = await page.evaluate(() => JSON.parse(localStorage.getItem("promptdeck.motionPrompt.v1")));
    await page.locator("#motionSampleBtn").click();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("promptdeck.motionPrompt.v1")));
    const sample = catalog.samples.find((entry) => entry.brief.title === saved.title);
    assert.ok(sample && !sampleIds.has(sample.id)); sampleIds.add(sample.id);
    assert.ok(sample.templates.includes(saved.template) && sample.styles.includes(saved.style));
    assert.notEqual(saved.template, beforeSample.template);
    assert.notEqual(saved.style, beforeSample.style);
    assert.equal(await page.locator("#motionPurpose").inputValue(), saved.template);
    for (const [selector, key] of [["#motionVoice", "voice"], ["#motionBgm", "bgm"], ["#motionSfx", "sfx"], ["#motionAssetMode", "assetMode"]]) assert.equal(await page.locator(selector).inputValue(), saved[key]);
    assert.equal(await page.locator("#motionTitle").inputValue(), saved.title);
    assert.equal(await page.locator("#motionSource").inputValue(), sample.brief.source);
    assert.doesNotMatch(await page.locator("#motionOutput").inputValue(), /가상 데이터|가상 샘플/);
    assert.match(await page.locator("#motionSampleInfo").textContent(), new RegExp(sample.name));
    assert.equal(await page.locator("#motionSearch").inputValue(), "");
    assert.equal(await page.locator("[data-motion-style]").count(), 66);
    assert.equal(await page.locator(".motion-template.is-selected").getAttribute("data-motion-style"), saved.style);
    assert.ok((await page.locator("#motionOutput").inputValue()).includes(saved.title));
  }
  assert.equal(sampleIds.size, 10);
  assert.equal(await page.locator("#motionUndoBtn").textContent(), "샘플 적용 되돌리기");
  await page.locator("#motionUndoBtn").click();
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("promptdeck.motionPrompt.v1"))), beforeSample);
  await page.locator("#motionPurpose").selectOption("ui");
  await page.locator("#motionSampleBtn").click();
  await page.locator("#motionTitle").fill("지역기업 지원사업 <검증>");
  await page.locator("#motionSource").fill("기간 2026-11-01 ~ 2026-11-10 / 접수: 공식 홈페이지");
  await page.locator("#motionDurationChoice").selectOption("custom");
  await page.locator("#motionDuration").fill("31");
  await page.locator("#motionDuration").press("Tab");
  assert.match(await page.locator("#motionSpecs").textContent(), /31초/);
  assert.match(await page.locator("#motionOutput").inputValue(), /지역기업 지원사업 <검증>/);
  await page.locator(".motion-editor details > summary").click();
  await page.locator("#motionChannel").fill("유튜브 소개 영상");
  await page.locator("#motionBackground").fill("행사장 로비");
  await page.locator("#motionAssets").fill("logo.svg, 제품.png, voice.wav, music.mp3, click.wav");
  await page.locator("#motionVoice").selectOption("narration");
  await page.locator("#motionVoiceDirection").fill("한국어, 차분한 중저음");
  await page.locator("#motionBgm").selectOption("suggest");
  await page.locator("#motionSfx").selectOption("essential");
  await page.locator("#motionAssetMode").selectOption("mixed");
  assert.match(await page.locator("#motionOutput").inputValue(), /내레이션 원고·목소리/);
  assert.match(await page.locator("#motionOutput").inputValue(), /한국어, 차분한 중저음/);
  assert.match(await page.locator("#motionOutput").inputValue(), /원본\/AI 생성 구분·배치/);
  await page.locator("#motionVoice").selectOption("none");
  await page.locator("#motionBgm").selectOption("none");
  await page.locator("#motionSfx").selectOption("none");
  assert.equal(await page.locator("#motionVoiceDirectionField").isVisible(), false);
  assert.match(await page.locator("#motionOutput").inputValue(), /소리: 무음/);
  assert.doesNotMatch(await page.locator("#motionOutput").inputValue(), /내레이션 원고|한국어, 차분한 중저음/);
  for (const selector of ["#motionVoice", "#motionBgm", "#motionSfx"]) await page.locator(selector).selectOption("source");
  assert.match(await page.locator("#motionOutput").inputValue(), /원본 음성 활용 구간·발언 보존/);
  assert.match(await page.locator("#motionOutput").inputValue(), /제공 음원 사용 구간/);
  assert.match(await page.locator("#motionOutput").inputValue(), /제공 효과음 배치/);
  await page.locator("#motionVoice").selectOption("dialogue");
  assert.equal(await page.locator("#motionVoiceDirectionField").isVisible(), true);
  assert.match(await page.locator("#motionOutput").inputValue(), /등장인물별 대사·목소리/);
  for (const [value, text] of [["provided", "제공 에셋의 편집"], ["generate", "AI 생성 에셋 목록"], ["mixed", "원본/AI 생성 구분"]]) {
    await page.locator("#motionAssetMode").selectOption(value);
    assert.ok((await page.locator("#motionOutput").inputValue()).includes(text));
  }
  await page.locator("#motionVoice").selectOption("narration");
  await page.locator("#motionBgm").selectOption("suggest");
  await page.locator("#motionSfx").selectOption("essential");
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
  assert.equal(await page.locator("#motionVoice").inputValue(), "narration");
  assert.equal(await page.locator("#motionBgm").inputValue(), "suggest");
  assert.equal(await page.locator("#motionSfx").inputValue(), "essential");
  assert.equal(await page.locator("#motionAssetMode").inputValue(), "mixed");
  assert.equal(await page.locator("#motionChannel").inputValue(), "유튜브 소개 영상");
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
  await page.setViewportSize({ width: 390, height: 844 });
  await goStep("brief");
  const beforeMobileSample = await page.locator("#motionTitle").inputValue();
  await page.locator("#motionSampleBtn").click();
  assert.notEqual(await page.locator("#motionTitle").inputValue(), beforeMobileSample);
  await page.locator('#mobileTabActions [data-proxy-target="motionPrimaryBtn"]').click();
  await page.locator("#motionStage img").evaluate((img) => img.decode());
  assert.ok(await page.locator(".motion-template.is-selected").evaluate((card) => {
    const rect = card.getBoundingClientRect(), gallery = card.closest(".motion-gallery").getBoundingClientRect();
    return rect.bottom > gallery.top && rect.top < gallery.bottom;
  }));
  await page.locator('#mobileTabActions [data-proxy-target="motionPrimaryBtn"]').click();
  await page.locator('#mobileTabActions [data-proxy-target="motionPrimaryBtn"]').click();
  assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n"), await page.locator("#motionOutput").inputValue());
  await goStep("brief");
  await page.locator("#motionPurpose").selectOption("kinetic");
  await goStep("gallery");
  await page.locator("#motionAutoStyleBtn").click();
  await page.locator("#motionPlayBtn").click();
  assert.equal(await page.locator("#motionStage .motion-art-rise").evaluate((el) => getComputedStyle(el).animationName), "none");
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${origin}/features`, { waitUntil: "domcontentloaded" });
    assert.equal(await page.locator(".landing-tool").count(), 15);
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
  for (const version of [1, 2, 3]) {
    const legacyContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await legacyContext.addInitScript((version) => localStorage.setItem("promptdeck.motionPrompt.v1", JSON.stringify({ version, title: "기존 제목 보존", source: "보존할 실제 원문", template: "character", useManualScenes: true, target: "gpt", format: "remotion", renderStyle: "collage", camera: "push", transition: "match", palette: "LEGACY_COLOR_ONLY", scenes: [{ seconds: 8, visual: "LEGACY_PRIVATE_SCENE", caption: "기존 자막" }] })), version);
    const legacy = await legacyContext.newPage();
    await legacy.goto(`${origin}/app?tab=motionPrompt`, { waitUntil: "domcontentloaded" });
    await legacy.waitForSelector("#paneMotionPrompt.active");
    assert.equal(await legacy.locator("#motionTitle").inputValue(), "기존 제목 보존");
    assert.equal(await legacy.locator("#motionScenes, #motionUseManualScenes, #motionTarget, #motionFormat").count(), 0);
    assert.doesNotMatch(await legacy.locator("#motionOutput").inputValue(), /LEGACY_PRIVATE_SCENE|LEGACY_COLOR_ONLY|사진·타이포 콜라주|전체 8초|실행 가능한 전체 코드/);
    const saved = await legacy.evaluate(() => JSON.parse(localStorage.getItem("promptdeck.motionPrompt.v1")));
    assert.equal(saved.version, 4);
    assert.equal(saved.scenes[0].visual, "LEGACY_PRIVATE_SCENE");
    assert.equal(saved.scenes[0].caption, "기존 자막");
    assert.equal(saved.useManualScenes, false);
    await legacy.locator("#motionSampleBtn").click();
    const afterSample = await legacy.evaluate(() => JSON.parse(localStorage.getItem("promptdeck.motionPrompt.v1")));
    assert.deepEqual(afterSample.scenes, saved.scenes);
    assert.equal(afterSample.palette, saved.palette);
    assert.equal(afterSample.camera, saved.camera);
    assert.doesNotMatch(await legacy.locator("#motionOutput").inputValue(), /LEGACY_PRIVATE_SCENE|LEGACY_COLOR_ONLY|사진·타이포 콜라주/);
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
