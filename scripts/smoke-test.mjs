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
  const fieldMap = {
    "promotionBigIdea": "bigIdea",
    "promotionVisualMetaphor": "visualMetaphor"
  };
  const field = fieldMap[quickFor];
  if (field) {
    const toggleSelector = `[data-toggle-mode='${field}'][data-mode='manual']`;
    if (await hasLocator(page, toggleSelector)) {
      await page.click(toggleSelector);
      await page.waitForTimeout(50);
    }
  }

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
        const text = msg.text();
        if (!text.includes("favicon.ico") && !text.includes("/api/health") && !text.includes("Failed to load resource: the server responded with a status of 404")) {
          consoleErrors.push(`[console.${msg.type()}] ${text}`);
        }
      }
    });
    page.on("pageerror", (error) => {
      consoleErrors.push(`[pageerror] ${error.message}`);
    });
    page.on("response", (response) => {
      if (response.status() >= 400) {
        const url = response.url();
        if (!url.endsWith("/favicon.ico") && !url.includes("/api/health")) {
          consoleErrors.push(`[404/Error] ${url} returned status ${response.status()}`);
        }
      }
    });

    await page.goto(`${server.baseUrl}/index.html`, { waitUntil: "domcontentloaded", timeout: 30000 });
    record(await hasLocator(page, "#tabBtnConceptMixer"), "Concept Mixer top-level tab button is missing", failures);
    record(await hasLocator(page, "#paneConceptMixer"), "Concept Mixer top-level pane is missing", failures);
    record(!(await hasLocator(page, "#btnToggleMixer")), "Legacy Concept Mixer toggle still exists inside Concept Suggestion", failures);
    await page.click("#tabBtnConceptMixer");
    await page.waitForSelector("#paneConceptMixer.active");
    record(await hasLocator(page, "#paneConceptMixer #conceptMixerContainer .mixer-workspace"), "Concept Mixer did not initialize in its top-level pane", failures);
    record((await page.locator("#tabBtnConceptMixer").getAttribute("aria-selected")) === "true", "Concept Mixer tab was not marked selected", failures);

    await page.waitForSelector("#tabBtnPromotion");
    await page.click("#tabBtnPromotion");
    await page.waitForSelector("#panePromotion.active");

    // 상세 모드 제거에 따라 기본 모드 전용 필드들만 검증하도록 테스트 수정
    record((await page.locator("#promotionAssetBadge").textContent()) === "홍보 이미지", "Promotion tab did not initialize with the unified promotion image mode", failures);

    await page.locator("#promotionSizeMode").selectOption("direct");
    await page.locator("#promotionDirectSizeW").fill("1080");
    await page.locator("#promotionDirectSizeH").fill("1920");
    await page.locator("#promotionHeadline").fill("주말 설명회 사전 신청");
    await page.locator("#promotionGoal").fill("이벤트 참여 유도");
    await page.locator("#promotionAudience").fill("취업 준비생");
    await page.waitForTimeout(150);
    const directSizePreview = await page.locator("#promotionPromptPreview").inputValue();
    record(directSizePreview.includes("주말 설명회 사전 신청"), "Promotion prompt preview did not reflect the headline", failures);
    record(directSizePreview.includes("Output specifications: 1080×1920 px"), "Promotion prompt preview did not reflect the direct size input", failures);
    record((directSizePreview.match(/컨텐츠 유형:/g) || []).length <= 1, "Promotion prompt preview repeated the content type line", failures);

    if (await hasLocator(page, "#promotionRandomPresetBtn")) {
      await page.click("#promotionRandomPresetBtn");
      await page.waitForTimeout(200);
      record((await page.locator("#promotionHeadline").inputValue()) === "주말 설명회 사전 신청", "Random preset button changed the headline", failures);
      record((await page.locator("#promotionSizeMode").inputValue()) === "direct", "Random preset button changed the size mode", failures);
      record((await page.locator("#promotionDirectSizeW").inputValue()) === "1080", "Random preset button changed the direct width", failures);
      record((await page.locator("#promotionDirectSizeH").inputValue()) === "1920", "Random preset button changed the direct height", failures);
    }

    const enableManualMode = async (field) => {
      const selector = `[data-toggle-mode='${field}'][data-mode='manual']`;
      if (await hasLocator(page, selector)) {
        await page.click(selector);
        await page.waitForTimeout(50);
      }
    };
    await enableManualMode("cta");
    await enableManualMode("posterOffer");
    await enableManualMode("snsHook");
    await enableManualMode("snsHashtags");

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

    await page.locator("#promotionGoal").fill("Drive event registration");
    await page.locator("#promotionAudience").fill("Young professionals");

    await page.waitForTimeout(200);
    const basicPreview = await page.locator("#promotionPromptPreview").inputValue();
    console.log("=== DEBUG BASIC PREVIEW ===\n" + basicPreview + "\n===============================");
    record(basicPreview.includes("[Role Directive]"), "Basic English prompt did not render role header", failures);
    record(basicPreview.includes("[Output Format]"), "Basic English prompt did not render format header", failures);
    record(basicPreview.includes("[Copy Content]"), "Basic English prompt did not include the copy content section", failures);

    await page.click("#promotionViewerToggleBtn");
    await page.waitForTimeout(150);
    await page.locator("#promotionPromptPreview").fill(`${basicPreview}\n\n## 메모\n직접 편집 테스트`);
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

    // ----------------------------------------------------
    // Slide Document Consolidated Tab Test
    // ----------------------------------------------------
    await page.click("#tabBtnSlideDocument");
    await page.waitForSelector("#paneSlideDocument.active");

    // Sub-tab 1: Cover
    await page.evaluate(() => {
      document.querySelectorAll("#paneSlideCover .promo-step-disclosure").forEach((details) => {
        details.open = true;
      });
    });
    await page.waitForTimeout(150);
    // Click sample data button
    await page.click("#slideCoverSampleBtn");
    await page.waitForTimeout(150);
    let coverHeadline = await page.locator("#slideCoverHeadline").inputValue();
    record(coverHeadline.includes("Strategy") || coverHeadline.includes("전략") || coverHeadline.length > 0, "Slide Cover headline was not populated by sample data", failures);
    // Click reset button
    await page.click("#slideCoverResetBtn");
    await page.waitForTimeout(150);
    let coverHeadlineReset = await page.locator("#slideCoverHeadline").inputValue();
    record(coverHeadlineReset === "", "Slide Cover headline was not reset", failures);

    // Sub-tab 2: Divider
    await page.click('.slide-sub-tab-btn[data-target="paneSlideDivider"]');
    await page.waitForSelector("#paneSlideDivider.active");
    await page.evaluate(() => {
      document.querySelectorAll("#paneSlideDivider .promo-step-disclosure").forEach((details) => {
        details.open = true;
      });
    });
    await page.waitForTimeout(150);
    await page.click("#slideDividerSampleBtn");
    await page.waitForTimeout(150);
    let dividerHeadline = await page.locator("#slideDividerHeadline").inputValue();
    record(dividerHeadline.includes("혁신") || dividerHeadline.includes("기술") || dividerHeadline.length > 0, "Slide Divider headline was not populated by sample data", failures);
    await page.click("#slideDividerResetBtn");
    await page.waitForTimeout(150);
    let dividerHeadlineReset = await page.locator("#slideDividerHeadline").inputValue();
    record(dividerHeadlineReset === "", "Slide Divider headline was not reset", failures);

    // Sub-tab 3: Background
    await page.click('.slide-sub-tab-btn[data-target="paneSlideBackground"]');
    await page.waitForSelector("#paneSlideBackground.active");
    await page.evaluate(() => {
      document.querySelectorAll("#paneSlideBackground .promo-step-disclosure").forEach((details) => {
        details.open = true;
      });
    });
    await page.waitForTimeout(150);
    await page.click("#slideBackgroundSampleBtn");
    await page.waitForTimeout(150);
    let bgBrandTone = await page.locator("#slideBackgroundBrandTone").inputValue();
    let bgHeaderStyle = await page.locator("#slideBackgroundHeaderStyle").inputValue();
    record(bgBrandTone.includes("가독성") || bgBrandTone.length > 0, "Slide Background brand tone was not populated by sample data", failures);
    record(bgHeaderStyle === "thin_line", "Slide Background header style was not populated by sample data", failures);
    await page.click("#slideBackgroundResetBtn");
    await page.waitForTimeout(150);
    let bgBrandToneReset = await page.locator("#slideBackgroundBrandTone").inputValue();
    let bgHeaderStyleReset = await page.locator("#slideBackgroundHeaderStyle").inputValue();
    record(bgBrandToneReset === "", "Slide Background brand tone was not reset", failures);
    record(bgHeaderStyleReset === "none", "Slide Background header style was not reset", failures);

    if (consoleErrors.length) {
      failures.push(`Console errors were reported:\n${consoleErrors.join("\n")}`);
    }

    if (failures.length) {
      throw new Error(`Smoke test failed.\n- ${failures.join("\n- ")}`);
    }

    log("Smoke test passed.");
  } finally {
    if (consoleErrors.length) {
      console.error("=== CONSOLE ERRORS DURING RUN ===");
      console.error(consoleErrors.join("\n"));
      console.error("=================================");
    }
    await browser.close();
    await server.close();
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

runSmokeTest().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
