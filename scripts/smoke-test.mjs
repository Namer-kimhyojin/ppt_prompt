import fs from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const projectRoot = process.cwd();

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function log(message) {
  console.log(message);
}

function record(condition, message, failures) {
  if (!condition) failures.push(message);
}

async function hasLocator(page, selector) {
  return (await page.locator(selector).count()) > 0;
}

async function verifyQuickToggleBehavior(page, { quickFor, inputSelector, label, failures }) {
  const buttonSelector = `[data-quick-for='${quickFor}'] .btn-quick`;
  const hasButtons = await hasLocator(page, buttonSelector);
  record(hasButtons, `${label} quick preset buttons were missing`, failures);
  if (!hasButtons) return;

  const input = page.locator(inputSelector);
  await input.fill("");

  const button = page.locator(buttonSelector).first();
  const buttonText = ((await button.textContent()) || "").trim();

  await button.click();
  const afterFirstClick = (await input.inputValue()).trim();
  record(afterFirstClick.length > 0, `${label} quick button did not add a preset on first click`, failures);
  record((await button.getAttribute("aria-pressed")) === "true", `${label} quick button did not reflect the active toggle state`, failures);
  if (buttonText) {
    record(afterFirstClick.includes(buttonText), `${label} quick button did not add its preset text`, failures);
  }

  await button.click();
  const afterSecondClick = (await input.inputValue()).trim();
  record(afterSecondClick === "", `${label} quick button did not remove the preset on second click`, failures);
  record((await button.getAttribute("aria-pressed")) === "false", `${label} quick button did not clear the active toggle state`, failures);

  await button.click();
  const afterThirdClick = (await input.inputValue()).trim();
  record(afterThirdClick === afterFirstClick, `${label} quick button re-added the preset with duplicates or altered text`, failures);

  await button.click();
  const afterFourthClick = (await input.inputValue()).trim();
  record(afterFourthClick === "", `${label} quick button did not clear the preset after repeated toggles`, failures);
}

async function startStaticServer(rootDir) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const filePath = path.join(rootDir, pathname);

    if (!existsSync(filePath)) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }

    res.setHeader("Content-Type", MIME_TYPES[path.extname(filePath)] || "application/octet-stream");
    createReadStream(filePath).pipe(res);
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}

async function launchBrowser() {
  try {
    const browser = await chromium.launch({ channel: "msedge", headless: true });
    return { browser, channel: "msedge" };
  } catch (error) {
    const browser = await chromium.launch({ headless: true });
    return { browser, channel: "chromium" };
  }
}

async function runSmokeTest() {
  const failures = [];
  const consoleErrors = [];
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "promptdeck-smoke-"));
  const server = await startStaticServer(projectRoot);
  const { browser, channel } = await launchBrowser();

  log(`Smoke test browser: ${channel}`);
  log(`Smoke test server: ${server.baseUrl}`);

  try {
    const context = await browser.newContext({
      acceptDownloads: true,
      viewport: { width: 1440, height: 1200 },
    });
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: server.baseUrl });
    const page = await context.newPage();

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(`[console.${msg.type()}] ${msg.text()}`);
      }
    });
    page.on("pageerror", (error) => {
      consoleErrors.push(`[pageerror] ${error.message}`);
    });

    await page.goto(`${server.baseUrl}/index.html`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector("#tabBtnPromotion");
    await page.click("#tabBtnPromotion");
    await page.waitForSelector("#panePromotion.active");

    record((await page.locator("#promotionAssetBadge").textContent()) === "홍보 이미지", "Promotion tab did not initialize with the unified promotion image mode", failures);
    record((await page.locator("#promotionForbiddenElements").inputValue()).includes("이모지 사용 금지"), "Promotion forbidden elements did not include the default emoji restriction", failures);

    if (await hasLocator(page, "[data-quick-for='promotionTone'] .btn-quick")) {
      const toneQuickButton = page.locator("[data-quick-for='promotionTone'] .btn-quick").first();
      const toneQuickText = ((await toneQuickButton.textContent()) || "").trim();
      await toneQuickButton.click();
      const toneValue = await page.locator("#promotionTone").inputValue();
      record(toneValue.split(toneQuickText).length - 1 === 1, "Promotion tone quick button did not add the preset on first click", failures);
      record((await toneQuickButton.getAttribute("aria-pressed")) === "true", "Promotion tone quick button did not reflect the active toggle state", failures);
      await toneQuickButton.click();
      record((await page.locator("#promotionTone").inputValue()) === "", "Promotion tone quick button did not remove the preset on second click", failures);
      record((await toneQuickButton.getAttribute("aria-pressed")) === "false", "Promotion tone quick button did not clear the active toggle state", failures);
      await toneQuickButton.click();
      const toneValueAfterThirdClick = await page.locator("#promotionTone").inputValue();
      record(toneValueAfterThirdClick.split(toneQuickText).length - 1 === 1, "Promotion tone quick button re-added the preset with duplicates", failures);
    }

    if (await hasLocator(page, "[data-quick-for='promotionPosterKeyVisual'] .btn-quick")) {
      const posterQuickButton = page.locator("[data-quick-for='promotionPosterKeyVisual'] .btn-quick").first();
      const posterQuickText = ((await posterQuickButton.textContent()) || "").trim();
      await posterQuickButton.click();
      const posterQuickValue = await page.locator("#promotionPosterKeyVisual").inputValue();
      record(posterQuickValue.split(posterQuickText).length - 1 === 1, "Promotion asset-specific quick button did not add the preset on first click", failures);
      record((await posterQuickButton.getAttribute("aria-pressed")) === "true", "Promotion asset-specific quick button did not reflect the active toggle state", failures);
      await posterQuickButton.click();
      record((await page.locator("#promotionPosterKeyVisual").inputValue()) === "", "Promotion asset-specific quick button did not remove the preset on second click", failures);
      record((await posterQuickButton.getAttribute("aria-pressed")) === "false", "Promotion asset-specific quick button did not clear the active toggle state", failures);
      await posterQuickButton.click();
      const posterQuickValueAfterThirdClick = await page.locator("#promotionPosterKeyVisual").inputValue();
      record(posterQuickValueAfterThirdClick.split(posterQuickText).length - 1 === 1, "Promotion asset-specific quick button re-added the preset with duplicates", failures);
    }

    await page.locator("#promotionPrimaryColor").fill("#112233");
    await page.locator("#promotionSecondaryColorPicker").fill("#ddeeff");
    await page.locator("#promotionAccentColor").fill("#ff6600");
    await page.locator("#promotionBackgroundColorPicker").fill("#f4f4f4");
    await page.waitForTimeout(150);
    const posterPreview = await page.locator("#promotionPromptPreview").inputValue();
    record(posterPreview.includes("#112233"), "Promotion prompt preview did not reflect the primary color", failures);
    record(posterPreview.includes("#ddeeff"), "Promotion prompt preview did not reflect the secondary color picker", failures);
    record(posterPreview.includes("광고 이미지급 고해상도 품질"), "Promotion prompt preview did not include the default Korean quality tags", failures);

    if (await hasLocator(page, "[data-color-clear-target='promotionPrimaryColor']")) {
      await page.click("[data-color-clear-target='promotionPrimaryColor']");
      await page.waitForTimeout(100);
      const clearedPrimaryPreview = await page.locator("#promotionPromptPreview").inputValue();
      record((await page.locator("#promotionPrimaryColor").inputValue()) === "", "Promotion primary color clear button did not empty the input", failures);
      record(!clearedPrimaryPreview.includes("#112233"), "Promotion prompt preview still included the cleared primary color", failures);
      await page.locator("#promotionPrimaryColor").fill("#112233");
      await page.waitForTimeout(100);
    }

    await page.locator("#promotionPalettePresetName").fill("Smoke Palette");
    await page.click("#promotionPaletteSaveBtn");
    await page.waitForTimeout(150);
    record(((await page.locator("#promotionStatus").textContent()) || "").includes("팔레트"), "Promotion palette save status did not appear", failures);

    await page.locator("#promotionPrimaryColor").fill("#445566");
    await page.locator("#promotionPalettePresetSelect").selectOption({ label: "Smoke Palette" });
    await page.click("#promotionPaletteApplyBtn");
    await page.waitForTimeout(150);
    record((await page.locator("#promotionPrimaryColor").inputValue()) === "#112233", "Promotion palette apply did not restore the saved primary color", failures);

    await page.locator("#promotionPalettePresetSelect").selectOption({ label: "Smoke Palette" });
    await page.click("#promotionPaletteDeleteBtn");
    await page.waitForTimeout(150);
    const paletteOptions = await page.locator("#promotionPalettePresetSelect option").allTextContents();
    record(!paletteOptions.includes("Smoke Palette"), "Promotion palette delete did not remove the saved preset", failures);

    record(await hasLocator(page, "#promotionColorStrategy"), "Promotion color strategy control was missing", failures);
    if (await hasLocator(page, "#promotionColorStrategy")) {
      await page.locator("#promotionColorStrategy").selectOption("ai");
      await page.waitForTimeout(150);
      const aiColorPreview = await page.locator("#promotionPromptPreview").inputValue();
      record(aiColorPreview.includes("색상/배경 전략: 색상과 배경 모두 AI에게 맡기기"), "Promotion prompt preview did not reflect the AI color/background strategy", failures);
      record(!aiColorPreview.includes("#112233"), "Promotion prompt preview still included manual primary colors while AI color mode was enabled", failures);
      record(!aiColorPreview.includes("배경 색상: #f4f4f4"), "Promotion prompt preview still included a manual background color while AI color mode was enabled", failures);
      record(await page.locator("#promotionPrimaryColor").isDisabled(), "Promotion manual color input was not disabled in AI color mode", failures);
      record(await page.locator("#promotionPaletteSaveBtn").isDisabled(), "Promotion palette save button was not disabled in AI color mode", failures);
      record(await page.locator("#promotionBackgroundMode").isDisabled(), "Promotion background mode was not disabled in AI color mode", failures);
      record(await page.locator("#promotionBackgroundDetails").isDisabled(), "Promotion background detail input was not disabled in AI color mode", failures);
      await page.locator("#promotionColorStrategy").selectOption("manual");
      await page.waitForTimeout(100);
      record(!(await page.locator("#promotionPrimaryColor").isDisabled()), "Promotion manual color input did not re-enable after leaving AI color mode", failures);
      record(!(await page.locator("#promotionBackgroundMode").isDisabled()), "Promotion background mode did not re-enable after leaving AI color mode", failures);
    }

    if (await hasLocator(page, "#promotionTemplateGrid [data-promo-content-type='event']")) {
      await page.click("#promotionTemplateGrid [data-promo-content-type='event']");
      await page.waitForTimeout(150);
      record((await page.locator("#promotionContentType").inputValue()) === "event", "Template card did not sync the content type select", failures);
      record((await page.locator("#promotionHeadline").inputValue()).includes("NEXT HORIZON"), "Event template card did not auto-apply the event sample", failures);
    }
    record(await hasLocator(page, "#promotionTemplateGrid [data-promo-content-type='demand-survey']"), "Demand survey template card was missing", failures);
    record(await hasLocator(page, "#promotionTemplateGrid [data-promo-content-type='survey']"), "Survey template card was missing", failures);

    record(!(await hasLocator(page, "#promotionTypePoster")), "Promotion asset tabs should have been removed", failures);
    record(await hasLocator(page, "#promotionPosterKeyVisual"), "Unified promotion fields did not include the main visual field", failures);
    record(await hasLocator(page, "#promotionSnsPlacementNotes"), "Unified promotion fields did not include the placement notes field", failures);
    record(!(await hasLocator(page, "#promotionCardFlow")), "Cardnews-only fields should have been removed", failures);
    record(await hasLocator(page, "#promotionCommercialBaseline"), "Promotion commercial baseline control was missing", failures);
    record(await hasLocator(page, "#promotionCreativityLevel"), "Promotion creativity level control was missing", failures);
    record(await hasLocator(page, "#promotionBigIdea"), "Promotion big idea field was missing", failures);
    record(await hasLocator(page, "#promotionVisualMetaphor"), "Promotion visual metaphor field was missing", failures);

    if (await hasLocator(page, "#promotionCommercialPanel")) {
      await page.locator("#promotionCommercialPanel").evaluate((node) => {
        node.open = true;
      });
      await page.waitForTimeout(100);
    }

    if (await hasLocator(page, "#promotionBigIdea")) {
      await verifyQuickToggleBehavior(page, {
        quickFor: "promotionBigIdea",
        inputSelector: "#promotionBigIdea",
        label: "Promotion big idea",
        failures,
      });
    }

    if (await hasLocator(page, "#promotionVisualMetaphor")) {
      await verifyQuickToggleBehavior(page, {
        quickFor: "promotionVisualMetaphor",
        inputSelector: "#promotionVisualMetaphor",
        label: "Promotion visual metaphor",
        failures,
      });
    }

    await page.locator("#promotionSizeMode").selectOption("direct");
    await page.locator("#promotionDirectSizeW").fill("1080");
    await page.locator("#promotionDirectSizeH").fill("1920");
    await page.locator("#promotionHeadline").fill("주말 설명회 사전 신청");
    await page.locator("#promotionGoal").fill("이벤트 참여 유도");
    await page.locator("#promotionAudience").fill("취업 준비생");
    await page.waitForTimeout(150);
    const directSizePreview = await page.locator("#promotionPromptPreview").inputValue();
    record(directSizePreview.includes("주말 설명회 사전 신청"), "Promotion prompt preview did not reflect the headline", failures);
    record(directSizePreview.includes("직접 입력 크기: 1080×1920 px"), "Promotion prompt preview did not reflect the direct size input", failures);
    record((directSizePreview.match(/컨텐츠 유형:/g) || []).length <= 1, "Promotion prompt preview repeated the content type line", failures);
    record((directSizePreview.match(/메인 색상:/g) || []).length <= 1, "Promotion prompt preview repeated the primary color line", failures);

    await page.locator("#promotionContentType").selectOption("contest");
    await page.waitForTimeout(200);
    record((await page.locator("#promotionHeadline").inputValue()).includes("오픈이노베이션 챌린지"), "Contest template selection did not auto-apply the contest sample", failures);

    await page.locator("#promotionContentType").selectOption("demand-survey");
    await page.waitForTimeout(200);
    record((await page.locator("#promotionHeadline").inputValue()).includes("수요조사"), "Demand survey template selection did not auto-apply the demand survey sample", failures);

    await page.locator("#promotionContentType").selectOption("survey");
    await page.waitForTimeout(200);
    record((await page.locator("#promotionHeadline").inputValue()).includes("설문 참여 이벤트"), "Survey template selection did not auto-apply the survey sample", failures);

    await page.locator("#promotionSizeMode").selectOption("direct");
    await page.locator("#promotionDirectSizeW").fill("1080");
    await page.locator("#promotionDirectSizeH").fill("1920");
    await page.locator("#promotionHeadline").fill("주말 설명회 사전 신청");

    if (await hasLocator(page, "#promotionRandomPresetBtn")) {
      await page.click("#promotionRandomPresetBtn");
      await page.waitForTimeout(200);
      record((await page.locator("#promotionHeadline").inputValue()) === "주말 설명회 사전 신청", "Random preset button changed the headline", failures);
      record((await page.locator("#promotionSizeMode").inputValue()) === "direct", "Random preset button changed the size mode", failures);
      record((await page.locator("#promotionDirectSizeW").inputValue()) === "1080", "Random preset button changed the direct width", failures);
      record((await page.locator("#promotionDirectSizeH").inputValue()) === "1920", "Random preset button changed the direct height", failures);
      record((await page.locator("#promotionTone").inputValue()).length > 0, "Random preset button did not apply random preset values", failures);
    }

    const visibleTextFieldValues = [
      ["#promotionHeadline", "Weekend session signup"],
      ["#promotionSubheadline", "Secure your place before seats run out"],
      ["#promotionBodyCopy", "One-page event overview with speakers and benefits"],
      ["#promotionCta", "Register now"],
    ];
    const visibleTextExpectations = [];
    for (const [selector, value] of visibleTextFieldValues) {
      if (await hasLocator(page, selector)) {
        await page.locator(selector).fill(value);
        visibleTextExpectations.push([selector, value]);
      }
    }
    if (await hasLocator(page, "#promotionPosterOffer")) {
      await page.locator("#promotionPosterOffer").fill("Early registrants receive a networking pass and summary report");
      visibleTextExpectations.push(["#promotionPosterOffer", "Early registrants receive a networking pass and summary report"]);
    }
    if (await hasLocator(page, "#promotionSnsHook")) {
      await page.locator("#promotionSnsHook").fill("Register before seats run out");
      visibleTextExpectations.push(["#promotionSnsHook", "Register before seats run out"]);
    }
    if (await hasLocator(page, "#promotionSnsHashtags")) {
      await page.locator("#promotionSnsHashtags").fill("#event #signup #career");
      visibleTextExpectations.push(["#promotionSnsHashtags", "#event #signup #career"]);
    }

    if (await hasLocator(page, "#promotionResetStyleBtn")) {
      await page.click("#promotionResetStyleBtn");
      await page.waitForTimeout(150);
      for (const [selector, value] of visibleTextExpectations) {
        record((await page.locator(selector).inputValue()) === value, `Style reset unexpectedly changed ${selector}`, failures);
      }
    }
    if (await hasLocator(page, "#promotionResetColorsBtn")) {
      await page.click("#promotionResetColorsBtn");
      await page.waitForTimeout(150);
    }

    await page.locator("#promotionGoal").fill("Drive event registration");
    await page.locator("#promotionAudience").fill("Young professionals");
    if (await hasLocator(page, "#promotionCommercialBaseline")) {
      await page.locator("#promotionCommercialBaseline").selectOption("luxury");
    }
    if (await hasLocator(page, "#promotionCreativityLevel")) {
      await page.locator("#promotionCreativityLevel").selectOption("experimental");
    }
    if (await hasLocator(page, "#promotionBigIdea")) {
      await page.locator("#promotionBigIdea").fill("kinetic future bridge");
    }
    if (await hasLocator(page, "#promotionVisualMetaphor")) {
      await page.locator("#promotionVisualMetaphor").fill("refracted glass runway with converging light beams");
    }
    await page.locator("#promotionOutputLanguage").selectOption("en");
    await page.locator("#promotionPromptMode").selectOption("optimized");
    await page.waitForTimeout(200);
    const optimizedPreview = await page.locator("#promotionPromptPreview").inputValue();
    record(optimizedPreview.includes("Generate a premium"), "Optimized English prompt did not render", failures);
    record(optimizedPreview.includes("advertising-grade high-resolution quality"), "Optimized English prompt did not include the default English quality tags", failures);
    record(optimizedPreview.includes("Asset type:"), "Optimized English prompt did not include the English asset-type label", failures);
    record(optimizedPreview.includes("Content template:"), "Optimized English prompt did not include the English content-template label", failures);
    record(optimizedPreview.includes("Sizing mode:"), "Optimized English prompt did not include the English sizing label", failures);
    record(optimizedPreview.includes("Avoid:"), "Optimized English prompt did not include the English hard-constraint label", failures);
    record(optimizedPreview.includes("promotion goal:"), "Optimized English prompt did not include the English promotion-goal label", failures);
    record(optimizedPreview.includes("target audience:"), "Optimized English prompt did not include the English target-audience label", failures);
    record(optimizedPreview.includes("Background treatment:"), "Optimized English prompt did not include the English background label", failures);
    record(/luxury/i.test(optimizedPreview), "Optimized English prompt did not reflect the selected commercial baseline", failures);
    record(/experimental/i.test(optimizedPreview), "Optimized English prompt did not reflect the selected creativity direction", failures);
    record(optimizedPreview.includes("kinetic future bridge"), "Optimized English prompt did not include the selected big idea", failures);
    record(
      optimizedPreview.includes("refracted glass runway with converging light beams"),
      "Optimized English prompt did not include the selected visual metaphor",
      failures
    );
    record(
      !/[\u3131-\u318E\uAC00-\uD7A3]/.test(optimizedPreview),
      "Optimized English prompt still included Korean text",
      failures
    );
    record(await page.locator("#promotionLintPanel").isVisible(), "Promotion lint panel was not visible", failures);
    record(((await page.locator("#promotionOptimizationState").textContent()) || "").includes("영문"), "Optimization state badge did not reflect the language mode", failures);

    await page.locator("#promotionPromptPreview").fill(`${optimizedPreview}\n\n## 메모\n직접 편집 테스트`);
    await page.click("#promotionCopyPromptBtn");
    await page.waitForTimeout(250);
    const copiedPrompt = await page.evaluate(() => navigator.clipboard.readText());
    record(copiedPrompt.includes("직접 편집 테스트"), "Promotion copy did not include the edited prompt draft", failures);

    await page.click("#promotionResetPromptBtn");
    await page.waitForTimeout(150);
    const resetPrompt = await page.locator("#promotionPromptPreview").inputValue();
    record(!resetPrompt.includes("직접 편집 테스트"), "Promotion prompt reset did not restore the auto-generated draft", failures);

    const download = page.waitForEvent("download");
    await page.click("#promotionSaveBtn");
    const promotionDownload = await download;
    const promotionPath = path.join(tempDir, promotionDownload.suggestedFilename());
    await promotionDownload.saveAs(promotionPath);
    const promotionData = JSON.parse(await fs.readFile(promotionPath, "utf8"));
    record(promotionData.mode === "promotion", `Unexpected promotion mode: ${promotionData.mode}`, failures);
    record(promotionData.promotionState?.assetType === "image", "Promotion settings did not capture the unified asset type", failures);

    await page.click("#promotionResetBtn");
    await page.waitForTimeout(150);
    await page.locator("#promotionLoadInput").setInputFiles(promotionPath);
    await page.waitForSelector("#promotionSnsHashtags");
    await page.waitForFunction(
      (expectedGoal) => {
        const input = document.querySelector("#promotionGoal");
        return input && input.value === expectedGoal;
      },
      promotionData.promotionState?.goal
    );
    record((await page.locator("#promotionHeadline").inputValue()) === promotionData.promotionState?.headline, "Promotion load did not restore the headline", failures);
    record((await page.locator("#promotionGoal").inputValue()) === promotionData.promotionState?.goal, "Promotion load did not restore the goal", failures);

    if (await hasLocator(page, "#promotionOmitEmptyFields")) {
      await page.locator("#promotionOmitEmptyFields").setChecked(true);
      await page.waitForTimeout(150);
      record(!(await page.locator("#promotionPromptPreview").inputValue()).includes("미입력"), "Promotion prompt preview still showed placeholders after omit-empty-fields", failures);
    }

    if (consoleErrors.length) {
      failures.push(`Console errors were reported:\n${consoleErrors.join("\n")}`);
    }

    if (failures.length) {
      throw new Error(`Smoke test failed.\n- ${failures.join("\n- ")}`);
    }

    log("Smoke test passed.");
  } finally {
    await browser.close();
    await server.close();
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

runSmokeTest().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
