#!/usr/bin/env node

import { createReadStream, existsSync, readFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import vm from "node:vm";
import { pathToFileURL } from "node:url";

async function loadPlaywright() {
  try { return await import("playwright"); }
  catch (error) {
    const moduleRoot = process.env.PROMPTDECK_NODE_MODULES;
    if (!moduleRoot) throw error;
    return import(pathToFileURL(path.join(moduleRoot, "playwright", "index.mjs")).href);
  }
}

const { chromium } = await loadPlaywright();
const repoRoot = path.resolve(import.meta.dirname, "..");
const failures = [];
const record = (condition, message) => { if (!condition) failures.push(message); };

function loadBrowserScript(filename, context) {
  vm.runInNewContext(readFileSync(path.join(repoRoot, filename), "utf8"), context, { filename });
}

const context = { window: {} };
loadBrowserScript("src/document-design-catalog.js", context);
loadBrowserScript("src/document-design-contract.js", context);
const catalog = context.window.PromptDeckDocumentDesignCatalog;
const contract = context.window.PromptDeckDocumentDesignContract;
const slideContext = { window: {} };
loadBrowserScript("src/slide-style-catalog.js", slideContext);
const slideCatalog = slideContext.window.PromptDeckSlideStyleCatalog;

record(catalog.version === 2, "Document design catalog version is not 2");
record(catalog.themes.length === 12, `Expected 12 themes, found ${catalog.themes.length}`);
record(new Set(catalog.themes.map((item) => item.id)).size === 12, "Theme ids are not unique");
record(catalog.themes.every((item) => slideCatalog.get(item.sourceVisualStyleId)), "A document theme references a missing slide visual style");
record(catalog.themes.every((item) => ["cover", "content", "data"].every((view) => item.previews[view])), "A document theme is missing a preview view");
record(catalog.themes.every((item) => ["backgroundUsage", "backgroundStyle", "iconUsage", "iconStyle", "pictogramUsage", "pictogramStyle", "typographyScope"].every((key) => String(item.visualAssets?.[key] || "").trim())), "A document theme is missing a complete visual-asset profile");
record(catalog.themes.every((item) => ["marginTopMm", "marginRightMm", "marginBottomMm", "marginLeftMm"].every((key) => item.layout[key] === item.layout.marginMm)), "A theme margin preset is not applied to all four sides");

for (const theme of catalog.themes) {
  for (const view of ["cover", "content", "data"]) {
    const relative = theme.previews[view].split("?")[0];
    const filename = path.join(repoRoot, relative);
    record(existsSync(filename), `Missing preview: ${relative}`);
    if (!existsSync(filename)) continue;
    const buffer = readFileSync(filename);
    record(buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `Preview is not PNG: ${relative}`);
    record(buffer.readUInt32BE(16) === 960 && buffer.readUInt32BE(20) === 540, `Preview dimensions are not 960x540: ${relative}`);
  }
}

const sourcePrompt = "  첫 줄은 유지합니다.\n\n- 수치 12.5%\n- 고유명사 PromptDeck  ";
const built = contract.build({ sourcePrompt, documentKind: "policy-research", formats: ["HWPX", "PDF"], themeId: "research-policy" });
record(built.issues.length === 0, `Contract reported unexpected issues: ${JSON.stringify(built.issues)}`);
record(built.fullPrompt.startsWith(sourcePrompt), "The source prompt was changed before composition");
record(built.fullPrompt.slice(0, sourcePrompt.length) === sourcePrompt, "The exact source prompt prefix was not preserved");
record(built.designPrompt.includes("HWPX 규칙:") && built.designPrompt.includes("PDF 규칙:"), "Format-specific rules are missing");
record(built.designPrompt.includes("표 규칙:") && built.designPrompt.includes("그래프 규칙:") && built.designPrompt.includes("정보 위계:"), "Detailed document-element rules are missing");
record(built.spec.schema === "promptdeck-document-design/1.1", "DocumentDesignSpec schema is incorrect");
record(Boolean(built.spec.tableRules?.repeatHeader) && built.spec.chartRules?.threeD === false && built.spec.hierarchy?.levels >= 3, "Structured table, chart, or hierarchy rules are incomplete");
record(Boolean(built.spec.visualAssets?.backgroundStyle && built.spec.visualAssets?.iconStyle && built.spec.visualAssets?.pictogramStyle && built.spec.visualAssets?.typographyScope), "Structured background, icon, pictogram, or typography-scope rules are incomplete");
record(["배경 이미지:", "아이콘:", "픽토그램:", "타이포그래피 적용 범위:"].every((label) => built.designPrompt.includes(label)), "Visual-asset rules are missing from the design prompt");

const mime = new Map([[".html", "text/html; charset=utf-8"], [".js", "text/javascript; charset=utf-8"], [".css", "text/css; charset=utf-8"], [".png", "image/png"], [".jpg", "image/jpeg"]]);
const server = http.createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url || "/", "http://127.0.0.1").pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const filename = path.resolve(repoRoot, relative);
    if (!filename.startsWith(`${repoRoot}${path.sep}`) || !existsSync(filename)) throw new Error("not found");
    response.writeHead(200, { "content-type": mime.get(path.extname(filename)) || "application/octet-stream" });
    createReadStream(filename).pipe(response);
  } catch (_) { response.writeHead(404); response.end("Not found"); }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}`;
let browser;
try { browser = await chromium.launch({ channel: "msedge", headless: true }); }
catch (_) { browser = await chromium.launch({ headless: true }); }

try {
  const browserContext = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  await browserContext.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseUrl });
  const page = await browserContext.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${baseUrl}/index.html`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.click("#tabBtnDocumentDesign");
  await page.waitForSelector("#paneDocumentDesign.active");
  record(await page.locator("#documentDesignApp .document-design-shell").isVisible(), "Document design shell is not visible");
  record((await page.locator(".doc-design-theme-card").count()) === 12, "The gallery does not show 12 themes");
  record((await page.locator(".doc-design-theme-card").first().locator("img").count()) === 3, "A theme card does not show cover, body, and chart previews together");
  record((await page.locator(".doc-design-theme-card").first().locator(".doc-design-theme-set").textContent()).replace(/\s+/g, " ").includes("표지 본문 표·차트"), "A theme card does not label the three-page set clearly");
  record((await page.locator("#docDesignStep2 [data-gallery-view]").count()) === 0, "The theme gallery still splits cover, body, and chart into separate views");
  record((await page.locator("#documentDesignMarginTop").count()) === 1 && (await page.locator("#documentDesignTableStyle").count()) === 1 && (await page.locator("#documentDesignChartType").count()) === 1 && (await page.locator("#documentDesignHierarchyLevels").count()) === 1, "Detailed margin, table, chart, or hierarchy controls are missing");
  record((await page.locator("#documentDesignBackgroundUsage").count()) === 1 && (await page.locator("#documentDesignIconStyle").count()) === 1 && (await page.locator("#documentDesignPictogramStyle").count()) === 1 && (await page.locator("#documentDesignTypographyScope").count()) === 1, "Background, icon, pictogram, or typography-scope controls are missing");
  record((await page.locator("#paneDocumentDesign .doc-design-result-stack > #tabActions").count()) === 1, "Quick actions are not mounted in the result column");
  record((await page.locator("#tabActions [data-proxy-target]").count()) === 6, "Document design quick action count is incorrect");
  const dockLayout = await page.evaluate(() => {
    const dock = document.getElementById("tabActions");
    const direct = dock?.querySelector(".tab-action-direct");
    const dockRect = dock?.getBoundingClientRect();
    return {
      overflow: direct ? direct.scrollWidth - direct.clientWidth : 999,
      outside: [...(direct?.querySelectorAll("button") || [])].filter((button) => {
        const rect = button.getBoundingClientRect();
        return rect.left < dockRect.left - 1 || rect.right > dockRect.right + 1;
      }).map((button) => button.textContent.trim()),
    };
  });
  record(dockLayout.overflow <= 1 && dockLayout.outside.length === 0, `Quick actions overflow the result dock: ${JSON.stringify(dockLayout)}`);

  await page.evaluate(() => document.getElementById("documentDesignSampleBtn").click());
  const sampleSource = await page.locator("#documentDesignSource").inputValue();
  record(sampleSource.includes("지역기업 지원사업 결과보고서"), "Sample request was not populated");
  await page.click('[data-theme-id="dark-innovation"]');
  await page.click('[data-live-view="data"]');
  record((await page.locator("#documentDesignThemeProfileGrid").textContent()).includes("네트워크·신호·입자") && (await page.locator("#documentDesignThemeProfileGrid").textContent()).includes("노드 기반 기술 픽토그램"), "Selected theme does not expose its complete visual profile");
  await page.evaluate(() => document.querySelectorAll(".doc-design-adjust-group").forEach((details) => { details.open = true; }));
  await page.locator("#documentDesignIconStyle").fill("2색 선형 아이콘, 핵심 기능에만 적용");
  await page.locator("#documentDesignTypographyScope").fill("제목·본문·표·차트·캡션 전체에 적용");
  await page.locator("#documentDesignTableStyle").selectOption({ label: "비교 매트릭스" });
  await page.locator("#documentDesignChartType").selectOption({ label: "막대·선 복합" });
  await page.locator("#documentDesignMarginLeft").fill("24");
  await page.locator('[data-adjust-group="colors"][data-adjust-key="accent"]').evaluate((input) => {
    input.value = "#ff3355";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  record((await page.locator("#documentDesignLivePreview").getAttribute("style")).toLowerCase().includes("#ff3355"), "Color adjustment did not update the live preview");
  await page.evaluate(() => document.getElementById("documentDesignGenerateBtn").click());
  const output = await page.locator("#documentDesignOutput").inputValue();
  record(output.startsWith(sampleSource), "Generated browser output does not preserve the source prompt prefix");
  record(output.includes("## 문서 디자인 및 출력 지침") && output.includes("다크 이노베이션") && output.includes("비교 매트릭스형") && output.includes("막대·선 복합 차트") && output.includes("좌 24mm"), "Generated browser output is missing detailed design instructions");
  record(output.includes("2색 선형 아이콘, 핵심 기능에만 적용") && output.includes("제목·본문·표·차트·캡션 전체에 적용"), "Generated browser output is missing customized visual-asset instructions");
  record((await page.locator("#documentDesignResultState").textContent()).trim() === "최신 상태", "Generated result was not marked current");

  await page.evaluate(() => document.getElementById("documentDesignSendCommonBtn").click());
  await page.waitForSelector("#paneCommonPrompt.active");
  record(await page.locator("#cpdDocumentDesignTransfer").isVisible(), "Transferred prompt is not visible in the common prompt pane");
  record((await page.locator("#cpdDocumentDesignTransfer textarea").inputValue()).startsWith(sampleSource), "Transferred prompt changed the source request");

  await page.setViewportSize({ width: 820, height: 1000 });
  await page.evaluate(() => window.PromptDeckTabs.switchTab("documentDesign"));
  await page.waitForSelector("#paneDocumentDesign.active");
  await page.evaluate(() => document.querySelector('[data-theme-id="public-brief"]')?.click());
  const compactGallery = await page.evaluate(() => {
    const grid = document.getElementById("documentDesignThemeGrid");
    const card = grid?.querySelector(".doc-design-theme-card");
    const image = card?.querySelector("img");
    const cardRect = card?.getBoundingClientRect();
    const imageRect = image?.getBoundingClientRect();
    const navigator = document.querySelector(".doc-design-theme-navigator");
    return {
      layout: getComputedStyle(grid).display,
      gridWidth: grid?.getBoundingClientRect().width || 0,
      cardWidth: cardRect?.width || 0,
      imageRatio: imageRect?.height ? imageRect.width / imageRect.height : 0,
      objectFit: image ? getComputedStyle(image).objectFit : "",
      previewCount: card?.querySelectorAll(".doc-design-theme-set img").length || 0,
      setLabels: card?.querySelector(".doc-design-theme-set")?.textContent || "",
      navigatorVisible: Boolean(navigator && getComputedStyle(navigator).display !== "none"),
      position: document.getElementById("documentDesignThemePosition")?.textContent || "",
      profileText: document.getElementById("documentDesignThemeProfileGrid")?.textContent || "",
      touchTargets: [...document.querySelectorAll(".doc-design-theme-navigator button")].map((button) => button.getBoundingClientRect().height),
    };
  });
  record(compactGallery.layout === "flex" && compactGallery.cardWidth >= compactGallery.gridWidth * .8, `Compact theme gallery still uses narrow multi-column cards: ${JSON.stringify(compactGallery)}`);
  record(Math.abs(compactGallery.imageRatio - (16 / 9)) < .03 && compactGallery.objectFit === "contain", `Compact theme preview is cropped or distorted: ${JSON.stringify(compactGallery)}`);
  record(compactGallery.previewCount === 3 && ["표지", "본문", "표·차트"].every((label) => compactGallery.setLabels.includes(label)), `Compact theme card does not present one complete three-page set: ${JSON.stringify(compactGallery)}`);
  record(compactGallery.navigatorVisible && compactGallery.position.trim() === "1 / 12" && compactGallery.touchTargets.every((height) => height >= 44), `Compact theme navigator is not usable: ${JSON.stringify(compactGallery)}`);
  await page.click('[data-theme-nav="next"]');
  record(await page.locator('[data-theme-id="executive-summary"]').getAttribute("aria-pressed") === "true", "Next-theme control did not select the next theme");
  await page.click('[data-theme-nav="previous"]');
  record(await page.locator('[data-theme-id="public-brief"]').getAttribute("aria-pressed") === "true", "Previous-theme control did not return to the prior theme");
  await page.evaluate(() => document.querySelector('[data-theme-id="dark-innovation"]')?.click());
  await page.evaluate(() => document.getElementById("documentDesignGenerateBtn")?.click());

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.PromptDeckTabs.switchTab("documentDesign"));
  await page.waitForSelector("#paneDocumentDesign.active");
  const mobileStart = await page.evaluate(() => {
    const pane = document.getElementById("paneDocumentDesign");
    return {
      overflow: pane.scrollWidth - pane.clientWidth,
      step: document.getElementById("documentDesignApp")?.dataset.mobileStep,
      stepOneVisible: document.getElementById("docDesignStep1")?.offsetParent !== null,
      stepTwoVisible: document.getElementById("docDesignStep2")?.offsetParent !== null,
      journeyBarVisible: (() => {
        const bar = document.querySelector(".doc-design-mobile-bar");
        return Boolean(bar && getComputedStyle(bar).display !== "none" && bar.getBoundingClientRect().height > 0);
      })(),
      globalActionHidden: document.getElementById("mobileTabActions")?.hidden,
      touchTargets: [...document.querySelectorAll(".doc-design-mobile-steps button, .doc-design-mobile-bar button")].map((button) => button.getBoundingClientRect().height),
    };
  });
  record(mobileStart.overflow <= 1, `Mobile pane overflows horizontally by ${mobileStart.overflow}px`);
  record(mobileStart.step === "1" && mobileStart.stepOneVisible && !mobileStart.stepTwoVisible, `Mobile journey did not start with only step 1 visible: ${JSON.stringify(mobileStart)}`);
  record(mobileStart.journeyBarVisible && mobileStart.globalActionHidden, `Dedicated mobile journey bar conflicts with the global mobile action bar: ${JSON.stringify(mobileStart)}`);
  record(mobileStart.touchTargets.every((height) => height >= 44), `Mobile journey controls are smaller than 44px: ${JSON.stringify(mobileStart.touchTargets)}`);

  await page.click('[data-mobile-action="next"]');
  const mobileTheme = await page.evaluate(() => {
    const pane = document.getElementById("paneDocumentDesign");
    const grid = document.querySelector(".doc-design-theme-grid");
    const card = grid?.querySelector(".doc-design-theme-card");
    const selectedCard = grid?.querySelector('.doc-design-theme-card[aria-pressed="true"]');
    const selectedRect = selectedCard?.getBoundingClientRect();
    const gridRect = grid?.getBoundingClientRect();
    return {
      step: document.getElementById("documentDesignApp")?.dataset.mobileStep,
      overflow: pane.scrollWidth - pane.clientWidth,
      layout: getComputedStyle(grid).display,
      cardWidth: card?.getBoundingClientRect().width || 0,
      gridWidth: grid?.getBoundingClientRect().width || 0,
      imageRatio: (() => { const rect = card?.querySelector("img")?.getBoundingClientRect(); return rect?.height ? rect.width / rect.height : 0; })(),
      previewCount: card?.querySelectorAll(".doc-design-theme-set img").length || 0,
      setLabels: card?.querySelector(".doc-design-theme-set")?.textContent || "",
      selectedVisible: Boolean(selectedRect && gridRect && selectedRect.left >= gridRect.left - 2 && selectedRect.right <= gridRect.right + 2),
      selection: document.getElementById("documentDesignMobileTheme")?.textContent || "",
      position: document.getElementById("documentDesignThemePosition")?.textContent || "",
      profileText: document.getElementById("documentDesignThemeProfileGrid")?.textContent || "",
    };
  });
  record(mobileTheme.step === "2" && mobileTheme.layout === "flex", `Mobile theme step or swipe gallery is incorrect: ${JSON.stringify(mobileTheme)}`);
  record(mobileTheme.overflow <= 1 && mobileTheme.cardWidth < mobileTheme.gridWidth && mobileTheme.cardWidth >= mobileTheme.gridWidth * .88, `Mobile theme carousel does not keep one theme large with a usable next-card cue: ${JSON.stringify(mobileTheme)}`);
  record(Math.abs(mobileTheme.imageRatio - (16 / 9)) < .03, `Mobile theme preview ratio is incorrect: ${JSON.stringify(mobileTheme)}`);
  record(mobileTheme.previewCount === 3 && ["표지", "본문", "표·차트"].every((label) => mobileTheme.setLabels.includes(label)), `Mobile theme card does not show the complete document theme set: ${JSON.stringify(mobileTheme)}`);
  record(mobileTheme.selectedVisible, `Mobile theme step did not bring the selected theme set into view: ${JSON.stringify(mobileTheme)}`);
  record(mobileTheme.selection.includes("다크 이노베이션"), "Mobile selected-theme summary is missing");
  record(mobileTheme.profileText.includes("배경 이미지") && mobileTheme.profileText.includes("픽토그램") && mobileTheme.profileText.includes("타이포그래피"), "Mobile theme step does not explain the complete theme profile");

  await page.click('[data-mobile-step="3"]');
  await page.click(".doc-design-adjust-group:nth-child(3) summary");
  const mobileAdjust = await page.evaluate(() => ({
    step: document.getElementById("documentDesignApp")?.dataset.mobileStep,
    openGroups: document.querySelectorAll(".doc-design-adjust-group[open]").length,
    previewVisible: document.querySelector(".doc-design-preview-panel")?.offsetParent !== null,
    outputVisible: document.querySelector(".doc-design-output-card")?.offsetParent !== null,
  }));
  record(mobileAdjust.step === "3" && mobileAdjust.openGroups === 1, `Mobile detail accordion did not keep one group open: ${JSON.stringify(mobileAdjust)}`);
  record(mobileAdjust.previewVisible && !mobileAdjust.outputVisible, "Mobile detail step did not expose the preview without the final output card");

  await page.click('[data-mobile-action="next"]');
  const mobileResult = await page.evaluate(() => ({
    step: document.getElementById("documentDesignApp")?.dataset.mobileStep,
    inputVisible: document.querySelector(".doc-design-input-stack")?.getBoundingClientRect().height > 1,
    resultVisible: document.getElementById("docDesignStep4")?.offsetParent !== null,
    outputVisible: document.querySelector(".doc-design-output-card")?.offsetParent !== null,
    primaryLabel: document.querySelector('[data-mobile-action="next"]')?.textContent.trim(),
  }));
  record(mobileResult.step === "4" && !mobileResult.inputVisible && mobileResult.resultVisible && mobileResult.outputVisible, `Mobile result step visibility is incorrect: ${JSON.stringify(mobileResult)}`);
  record(mobileResult.primaryLabel === "전체 복사", `Mobile result action did not reflect the generated state: ${mobileResult.primaryLabel}`);
  record(pageErrors.length === 0, `Browser page errors: ${pageErrors.join(" | ")}`);
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}

if (failures.length) {
  console.error(`Document design smoke test failed (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log("Document design smoke test passed: 12 cover-body-chart theme sets, 36 previews, visual assets, source preservation, live controls, transfer, and four-step mobile journey.");
