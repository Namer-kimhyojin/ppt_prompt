import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { existsSync, createReadStream } from "node:fs";
import http from "node:http";
import path from "node:path";
import os from "node:os";
import { chromium } from "playwright";

const projectRoot = path.resolve(import.meta.dirname, "..");
const externalUrl = process.env.PROMOTION_TEST_URL;
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "promotion-workspace-test-"));
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp" };
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname.startsWith("/api/")) { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ ok: true, status: "ok", hasUsers: false, images: [], settings: {} })); return; }
  const filename = path.resolve(projectRoot, "." + decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname));
  if (!filename.startsWith(projectRoot + path.sep)) { res.writeHead(403).end(); return; }
  try {
    if (!(await fs.stat(filename)).isFile()) throw new Error("Not a file");
    res.writeHead(200, { "content-type": mime[path.extname(filename)] || "application/octet-stream" });
    createReadStream(filename).pipe(res);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const url = externalUrl || `http://127.0.0.1:${server.address().port}/`;
let browser;
try { browser = await chromium.launch({ channel: "msedge", headless: true }); }
catch {
  const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
  browser = await chromium.launch(existsSync(edge) ? { executablePath: edge, headless: true } : { headless: true });
}
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await context.newPage();
page.setDefaultTimeout(10000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
await context.addInitScript(() => {
  window.__promotionCopied = "";
  Object.defineProperty(navigator.clipboard, "writeText", { configurable: true, value: async text => { window.__promotionCopied = text; } });
});
const marker = "PROMOTION_USER_EDIT_20260909";
const snapshot = () => page.evaluate(() => JSON.parse(localStorage.getItem("promptdeck-promotion-draft-v1")));
const prompt = () => page.evaluate(() => window.getCurrentPromotionPrompt());
async function copy() {
  await page.locator('#tabActions [data-proxy-target="promotionCopyPromptBtn"]').click();
  return page.evaluate(() => window.__promotionCopied);
}
async function openDetails(selector) {
  if (!(await page.locator(selector).getAttribute("open")) && !(await page.locator(selector).evaluate(el => el.open))) await page.locator(`${selector} > summary`).click();
}
try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator("#tabBtnPromotion").click();
  await page.locator("#panePromotion.promo-workspace").waitFor();
  assert.equal(await page.locator("#tabActions").getAttribute("aria-label"), "완성 프롬프트 주요 작업");
  assert.equal(await page.locator('#tabActions [data-proxy-target="promotionCopyPromptBtn"]').innerText(), "전체 프롬프트 복사");
  assert.equal(await page.locator('#tabActions [data-proxy-target="promotionSendImageBtn"]').innerText(), "이미지 생성으로 이동");
  assert(await page.locator(".promo-result-actions").evaluate(el => el.scrollWidth <= el.clientWidth + 1), "The primary action area must not overflow horizontally");
  await page.setViewportSize({ width: 1180, height: 900 });
  assert(await page.locator('#tabActions [data-proxy-target="promotionCopyPromptBtn"]').isVisible());
  assert(await page.locator('#tabActions [data-proxy-target="promotionSendImageBtn"]').isVisible());
  assert(await page.locator("#tabActions > .tab-action-more").isVisible());
  assert(await page.locator(".promo-result-actions").evaluate(el => el.scrollWidth <= el.clientWidth + 1), "The 1180px action area must not overflow horizontally");
  await page.setViewportSize({ width: 1440, height: 1000 });
  assert((await page.locator("#promotionHeadline").boundingBox()).y < 800, "The first desktop viewport must expose the headline");
  assert(await page.locator("#promotionOutputSummary").isVisible());
  assert(await page.locator("#promotionPromptViewer").isHidden());
  await page.locator("#promotionHeadline").fill("실무자를 위한 AI 교육");
  await page.locator("#promotionBodyCopy").fill("9월 30일까지 신청\n실습 중심 교육 제공");
  await page.locator("#promotionGoal").fill("교육 참가자 모집");
  assert((await page.locator("#promotionOutputSummary").innerText()).includes("실무자를 위한 AI 교육"));
  const beforeSample = (await snapshot()).promotionState;
  await page.locator("#promotionSampleBtn").click();
  await page.locator("#promotionUndoBtn").click();
  assert.deepEqual((await snapshot()).promotionState, beforeSample, "Undo must restore the entire work before loading an example");
  await page.locator("#promotionPromptViewBtn").click();
  await page.locator("#promotionViewerToggleBtn").click();
  const edited = (await prompt()) + "\n" + marker;
  await page.locator("#promotionPromptPreview").fill(edited);
  assert.equal(await copy(), edited, "Copy while editing must use the current draft");
  await page.locator("#promotionViewerToggleBtn").click();
  assert((await page.locator("#promotionPromptViewer").innerText()).includes(marker));
  assert.equal(await copy(), edited, "Viewing must not change the copied draft");
  await page.locator("#promotionGoal").fill("새 설정으로 변경");
  assert.equal(await prompt(), edited, "Changing settings must preserve the edited draft");
  assert(await page.locator("#promotionEditedNotice").isVisible());
  await page.locator("#promotionResetPromptBtn").click();
  assert(!(await prompt()).includes(marker));
  await page.locator("#promotionUndoBtn").click();
  assert.equal(await prompt(), edited, "Undo regeneration must restore the edited draft");

  const downloadPending = page.waitForEvent("download");
  await page.locator("#promotionSaveBtn").click();
  const download = await downloadPending;
  const filePath = path.join(tempDir, "promotion-settings.json");
  await download.saveAs(filePath);
  assert.equal(JSON.parse(await fs.readFile(filePath, "utf8")).promptDraft, edited);
  await page.locator("#promotionResetBtn").click();
  assert(!(await prompt()).includes(marker));
  await page.locator("#promotionLoadInput").setInputFiles(filePath);
  await page.waitForFunction(value => window.getCurrentPromotionPrompt().includes(value), marker);
  assert.equal(await prompt(), edited, "File load must retain the exact manual prompt");
  await page.reload();
  await page.locator("#panePromotion.active").waitFor();
  assert.equal(await prompt(), edited, "Reload must retain the exact manual prompt");
  assert((await page.locator("#promotionPromptViewer").innerText()).includes(marker));

  await page.locator("#promotionViewerToggleBtn").click();
  await page.locator("#promotionPromptPreview").fill("");
  await page.reload();
  assert.equal(await prompt(), "", "An intentionally emptied draft must survive reload");
  await page.locator("#promotionLoadInput").setInputFiles(filePath);
  await page.waitForFunction(value => window.getCurrentPromotionPrompt().includes(value), marker);

  const firstSection = page.locator(".promo-viewer-section").first();
  assert.equal(await firstSection.locator(".promo-section-edit-btn").innerText(), "내용 편집");
  assert.equal(await firstSection.locator(".promo-section-copy-btn").innerText(), "섹션 복사");
  await firstSection.locator(".promo-section-edit-btn").click();
  const inline = firstSection.locator(".promo-section-inline-textarea");
  assert.equal(await firstSection.locator(".promo-section-edit-btn").innerText(), "변경 저장");
  assert(await firstSection.locator(".promo-section-cancel-btn").isVisible());
  assert(await firstSection.locator(".promo-section-copy-btn").isHidden());
  const sectionActions = await firstSection.locator(".promo-section-actions").boundingBox();
  const inlineBox = await inline.boundingBox();
  assert(sectionActions.y + sectionActions.height <= inlineBox.y, "Section controls must not overlap the editor");
  await inline.press("Escape");
  assert(await inline.isHidden());
  await firstSection.locator(".promo-section-edit-btn").click();
  const reopenedInline = firstSection.locator(".promo-section-inline-textarea");
  await reopenedInline.fill((await reopenedInline.inputValue()) + "\nSECTION_EDIT_MARKER");
  await reopenedInline.press("Control+Enter");
  assert((await copy()).includes("SECTION_EDIT_MARKER"));
  assert(!(await prompt()).includes("프롬프트 섹션"), "UI section labels must not enter the saved prompt");
  assert((await snapshot()).promptDraft.includes("SECTION_EDIT_MARKER"));
  await page.reload();
  assert((await prompt()).includes("SECTION_EDIT_MARKER"));

  if (!externalUrl) {
    const effective = await prompt();
    await page.locator('#tabActions [data-proxy-target="promotionSendImageBtn"]').click();
    await page.locator("#paneSlideImage.active").waitFor();
    assert.equal(await page.locator("#slideImagePrompt").inputValue(), effective, "Generation handoff must match copy");
    await page.locator("#tabBtnPromotion").click();
  } else {
    await page.locator('#tabActions [data-proxy-target="promotionSendImageBtn"]').click();
    assert(await page.locator(".promo-send-help").isVisible());
    assert.equal(await page.evaluate(() => window.__promotionCopied), await prompt());
  }
  await page.locator("#promotionResetPromptBtn").click();
  await openDetails("#promotionStepStart");
  await page.locator("#promotionRatio").selectOption("custom");
  await page.locator("#promotionCustomRatioW").fill("21");
  await page.locator("#promotionCustomRatioH").fill("29.7");
  await page.locator("#promotionSizePresetSaveBtn").click();
  await page.locator("#promotionSizePresetNameInput").fill("정확한 세로 규격");
  await page.locator("#promotionSizePresetConfirmBtn").click();
  await page.locator("#promotionCustomRatioW").fill("2");
  await page.locator("#promotionCustomRatioH").fill("5");
  await page.locator(".promo-size-preset-apply-btn").first().click();
  assert.equal(await page.locator("#promotionCustomRatioW").inputValue(), "21");
  assert.equal(await page.locator("#promotionCustomRatioH").inputValue(), "29.7");
  await page.reload();
  assert.equal((await snapshot()).promotionState.customRatioH, "29.7");

  await openDetails(".promo-workspace-templates");
  await page.locator("#promotionTemplateName").fill("교육 안내 재사용");
  await page.locator("#promotionTemplateSaveBtn").click();
  const savedTitle = await page.locator("#promotionHeadline").inputValue();
  await page.locator("#promotionHeadline").fill("임시 변경");
  await page.locator("#promotionTemplateList").getByRole("button", { name: "교육 안내 재사용", exact: true }).click();
  assert.equal(await page.locator("#promotionHeadline").inputValue(), savedTitle);
  await page.reload();
  await openDetails(".promo-workspace-templates");
  assert.equal(await page.locator(".promo-template-row").count(), 1);

  await openDetails(".promo-optional-copy");
  await page.getByLabel("참여 유도 문구 작성 방식", { exact: true }).selectOption("off");
  await page.locator("#promotionQuickFillBtn").click();
  assert(await page.locator("#promotionQuickFillStepPaste").isVisible());
  assert(await page.locator("#promotionQuickFillStepPreview").isHidden(), "Analysis results must be hidden before analysis");
  await page.keyboard.press("Escape");
  assert(await page.locator("#promotionQuickFillModal").isHidden());
  assert.equal(await page.evaluate(() => document.activeElement.id), "promotionQuickFillBtn");
  await page.locator("#promotionQuickFillBtn").click();
  await page.locator("#promotionQuickFillTextarea").fill("2026년 기업 AI 교육 참가자 모집\n사업목적: 기업 실무자의 AI 역량 강화\n지원대상: 지역 중소기업 재직자\n접수기간: 2026. 9. 1. ~ 9. 30.\n지원내용: 실무 교육 및 전문가 멘토링\n신청방법: 온라인 사전 신청\n신청링크: https://example.org/apply\n문의처: 교육팀 054-123-4567");
  await page.locator("#promotionQuickFillParseBtn").click();
  assert(await page.locator("#promotionQuickFillStepPaste").isHidden());
  await page.locator('[data-quickfill-key="cta"]').check();
  await page.locator('[data-quickfill-key="qrUrl"]').check();
  await page.locator("#promotionQuickFillApplyBtn").focus();
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement.id), "promotionQuickFillModalCloseBtn", "Dialog focus must wrap");
  await page.locator("#promotionQuickFillApplyBtn").click();
  assert.equal((await snapshot()).promotionState.ctaEnabled, "true");
  assert.equal((await snapshot()).promotionState.ctaMode, "manual");
  assert.equal((await snapshot()).promotionState.qrEnabled, "true");
  assert((await prompt()).includes("https://example.org/apply"));

  await page.locator(".promo-recommend-option").first().waitFor();
  const beforeStyle = (await snapshot()).promotionState;
  await page.locator(".promo-recommend-option").first().click();
  const afterStyle = (await snapshot()).promotionState;
  for (const key of ["headline", "bodyCopy", "ratio", "customRatioW", "customRatioH", "qrUrl"]) assert.equal(afterStyle[key], beforeStyle[key], `Style selection changed ${key}`);
  assert(afterStyle.appliedConceptMediumId);
  await page.reload();
  assert.equal((await snapshot()).promotionState.appliedConceptMediumId, afterStyle.appliedConceptMediumId);

  for (const width of [390, 360]) {
    await page.setViewportSize({ width, height: 844 });
    await page.locator("#promotionInputViewBtn").click();
    await page.evaluate(() => scrollTo(0, 0));
    assert((await page.locator("#promotionHeadline").boundingBox()).y < 600);
    assert(await page.locator(".promo-result-stack").isHidden());
    await page.locator('#mobileTabActions [data-proxy-target="promotionMobilePrimaryBtn"]').click();
    assert(await page.locator("#promotionOutputSummary").isVisible());
    assert(await page.locator(".promo-builder-section").isHidden());
    assert(await page.locator("#tabActions").isHidden());
    assert((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1);
    assert((await page.locator("#promotionSendImageBtn").boundingBox()).height <= 60, "The next-step action must remain a compact button");
    assert(await page.locator("#promotionSummaryViewBtn").evaluate(el => {
      const range = document.createRange(); range.selectNodeContents(el);
      return range.getClientRects().length === 1;
    }), "Result-mode labels must fit on one line");
    await page.screenshot({ path: path.join(tempDir, `result-${width}.png`) });
  }
  assert.deepEqual(errors, [], "Promotion flow emitted JavaScript errors");
  console.log(`Promotion workspace passed: edited copy/file/reload/sections/undo/handoff, exact sizes, templates, summary dialog, recommendations, mobile 360/390. Screenshots: ${tempDir}`);
} finally {
  await context.close();
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
