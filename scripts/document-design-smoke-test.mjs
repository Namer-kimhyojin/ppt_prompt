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

record(catalog.version === 4, "Document design catalog version is not 4");
record(catalog.themes.length === 12, `Expected 12 themes, found ${catalog.themes.length}`);
record(new Set(catalog.themes.map((item) => item.id)).size === 12, "Theme ids are not unique");
record(catalog.visualGrammars.length === 7, `Expected 7 visual grammars, found ${catalog.visualGrammars.length}`);
record(catalog.publicationTypes.length >= 35, `Expected at least 35 publication types, found ${catalog.publicationTypes.length}`);
record(catalog.pageArchetypes.length === 6, `Expected 6 page archetypes, found ${catalog.pageArchetypes.length}`);
record(["cover", "chapter", "body", "image", "data", "special"].every((id) => catalog.pageArchetypes.some((item) => item.id === id)), "The six-page visual set is incomplete");
record(["report-analysis", "professional-explanation", "textbook-learning", "exam-practice", "literary-reading", "illustrated-narrative", "editorial"].every((id) => catalog.getVisualGrammar(id)), "A required publication visual grammar is missing");
record(["business-report", "business-plan", "textbook", "study-guide", "certification-book", "essay-collection", "prose-collection", "fairy-tale", "picture-book"].every((id) => catalog.getPublicationType(id)), "A required report, learning, literary, or story publication type is missing");
record(catalog.resolveVisualGrammar("fairy-tale")?.id === "illustrated-narrative", "Publication type does not resolve to its visual grammar");
record(catalog.listByGrammar("textbook-learning").length >= 3, "Visual grammar does not provide useful theme recommendations");
record(catalog.themes.every((item) => slideCatalog.get(item.sourceVisualStyleId)), "A document theme references a missing slide visual style");
record(catalog.themes.every((item) => ["cover", "content", "data"].every((view) => item.previews[view])), "A document theme is missing a preview view");
record(catalog.themes.every((item) => ["cover", "chapter", "body", "image", "data", "special"].every((view) => item.pagePreviews[view])), "A document theme is missing one of the six page previews");
record(catalog.themes.every((item) => Array.isArray(item.recommendedGrammarIds) && item.recommendedGrammarIds.length), "A document theme is missing visual-grammar recommendations");
record(catalog.themes.every((item) => ["backgroundUsage", "backgroundStyle", "iconUsage", "iconStyle", "pictogramUsage", "pictogramStyle", "typographyScope"].every((key) => String(item.visualAssets?.[key] || "").trim())), "A document theme is missing a complete visual-asset profile");
record(catalog.themes.every((item) => ["colorIntensity", "contrast", "titlePresence", "bodyScale", "notePresence", "lineSpacing", "headingEmphasis", "hierarchyDepth", "pageWhitespace", "marginBalance", "paragraphRhythm", "sectionSeparation", "headerFooterBreathing", "tableInformationAmount", "cellBreathing"].every((key) => String(item.creativeDegrees?.[key] || "").trim())), "A document theme is missing a complete qualitative degree profile");
record(catalog.pageSizes.some((item) => item.id === "A4" && item.widthMm === 210 && item.heightMm === 297), "A4 210x297mm page specification is missing");
record(catalog.pageOrientations.some((item) => item.id === "portrait") && catalog.pageOrientations.some((item) => item.id === "landscape"), "Portrait or landscape orientation is missing");
record(["mediums", "bindings", "duplexModes", "spreadModes", "bleeds"].every((key) => catalog.productionOptions[key]?.length >= 2), "A production specification option group is incomplete");
record(catalog.themes.every((item) => ["marginTopMm", "marginRightMm", "marginBottomMm", "marginLeftMm"].every((key) => item.layout[key] === item.layout.marginMm)), "A theme margin preset is not applied to all four sides");

for (const theme of catalog.themes) {
  for (const view of ["cover", "chapter", "body", "image", "data", "special"]) {
    const relative = theme.pagePreviews[view].split("?")[0];
    const filename = path.join(repoRoot, relative);
    record(existsSync(filename), `Missing preview: ${relative}`);
    if (!existsSync(filename)) continue;
    const buffer = readFileSync(filename);
    record(buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `Preview is not PNG: ${relative}`);
    record(buffer.readUInt32BE(16) === 960 && buffer.readUInt32BE(20) === 540, `Preview dimensions are not 960x540: ${relative}`);
  }
}

const sourcePrompt = "  첫 줄은 유지합니다.\n\n- 수치 12.5%\n- 고유명사 PromptDeck  ";
const built = contract.build({
  sourcePrompt,
  documentKind: "certification-book",
  publicationTypeId: "certification-book",
  visualGrammarId: "exam-practice",
  formats: ["HWPX", "PDF"],
  themeId: "education-guide",
  productionSpec: { mediumId: "print", bindingId: "perfect", duplex: "duplex-long", spreadMode: "facing-pages", bleedMm: 3 },
  previewView: "special",
  adjustments: { creativeDegrees: { colorPresence: "풍부하게", accentFrequency: "주요 요소마다", pageRhythm: "장마다 변화를 주게" } },
});
record(built.issues.length === 0, `Contract reported unexpected issues: ${JSON.stringify(built.issues)}`);
record(built.fullPrompt.startsWith(sourcePrompt), "The source prompt was changed before composition");
record(built.fullPrompt.slice(0, sourcePrompt.length) === sourcePrompt, "The exact source prompt prefix was not preserved");
record(built.designPrompt.includes("HWPX 규칙:") && built.designPrompt.includes("PDF 규칙:"), "Format-specific rules are missing");
record(built.designPrompt.includes("표 규칙:") && built.designPrompt.includes("그래프 규칙:") && built.designPrompt.includes("정보 위계:"), "Detailed document-element rules are missing");
record(built.spec.schema === "promptdeck-document-design/2.0", "DocumentDesignSpec schema is incorrect");
record(built.spec.document.page.sizeId === "A4" && built.spec.document.page.orientation === "portrait" && built.spec.document.page.widthMm === 210 && built.spec.document.page.heightMm === 297, "Default page specification is not A4 portrait 210x297mm");
record(built.spec.document.production.bindingId === "perfect" && built.spec.document.production.duplex === "duplex-long" && built.spec.document.production.spreadMode === "facing-pages" && built.spec.document.production.bleedMm === 3, "Exact production specification is incomplete");
record(built.spec.publication.typeId === "certification-book" && built.spec.publication.visualGrammarId === "exam-practice", "Publication type or visual grammar is missing from the structured spec");
record(built.spec.document.kind === "certification-book" && built.spec.document.kindLabel === "자격증 도서", "The structured document kind fell back to a legacy report type");
record(Object.keys(built.spec.pageRules).length === 6 && built.spec.pageRules.special.label.includes("문제"), "The six-page visual rules or type-specific special page are incomplete");
record(Boolean(built.spec.colorPlacement?.primary && built.spec.typography?.scope?.questionAnswer && built.spec.longDocumentConsistency?.themeContinuity), "Color placement, typography scope, or long-document consistency is incomplete");
record(Boolean(built.spec.tableRules?.repeatHeader) && built.spec.chartRules?.threeD === false && String(built.spec.hierarchy?.depth || "").length > 0, "Structured table, chart, or hierarchy rules are incomplete");
record(["headingSizePt", "bodySizePt", "noteSizePt", "lineHeightPercent"].every((key) => !(key in built.spec.typography)), "Numeric typography values leaked into the AI specification");
record(["marginTopMm", "marginRightMm", "marginBottomMm", "marginLeftMm", "paragraphGapPt", "sectionGapPt"].every((key) => !(key in built.spec.layout)), "Numeric spacing values leaked into the AI specification");
record(!("levels" in built.spec.hierarchy) && !("maxColumns" in built.spec.tableRules) && !("cellPaddingMm" in built.spec.tableRules), "Numeric hierarchy or table values leaked into the AI specification");
record(built.designPrompt.includes("PromptDeck DocumentDesignSpec 2.0") && built.designPrompt.includes("제작 규격: A4 · 세로형 · 완성 크기 210×297mm") && built.designPrompt.includes("pt·mm·% 값을 기계적으로 고정하지 않는다"), "Qualitative AI guidance or exact page-size rule is missing");
record(built.designPrompt.includes("입력된 원문의 내용·목차·문장·사실·수치·고유명사를 수정·요약·보완하지 않는다") && built.designPrompt.includes("이 사양은 시각 편집과 제작 방식에만 적용한다"), "The visual-only immutable-content rule is missing");
record(!built.designPrompt.includes("권장 내용 흐름"), "Content-authoring guidance leaked into the visual-only prompt");
record(["6종 페이지 세트:", "색상 역할과 배치:", "타이포그래피 적용 범위:", "다이어그램:", "장문 일관성:"].every((label) => built.designPrompt.includes(label)), "Publication visual-system instructions are incomplete");
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
  record((await page.locator("[data-visual-grammar]").count()) === 7, "The visual-grammar picker does not show 7 choices");
  record((await page.locator("[data-publication-type]").count()) === 8, "The default report-analysis type list is not focused");
  record((await page.locator(".doc-design-theme-card").count()) === 7, "The gallery does not start with type-recommended themes");
  record((await page.locator(".doc-design-theme-card").first().locator("img").count()) === 6, "A theme card does not show the six-page visual set together");
  const firstThemeSetLabels = await page.locator(".doc-design-theme-card").first().locator(".doc-design-theme-set").textContent();
  record(["표지", "장 시작", "본문", "이미지", "표·차트"].every((label) => firstThemeSetLabels.includes(label)), "A theme card does not label the six-page set clearly");
  record((await page.locator("#docDesignStep2 [data-gallery-view]").count()) === 0, "The theme gallery still splits cover, body, and chart into separate views");
  record((await page.locator('#documentDesignApp input[type="number"], #documentDesignApp input[type="range"]').count()) === 0, "Numeric detail controls are still exposed");
  record((await page.locator("select[data-degree-key]").count()) === 22 && (await page.locator("#documentDesignTableStyle").count()) === 1 && (await page.locator("#documentDesignChartType").count()) === 1, "Qualitative degree, table, or chart controls are missing");
  record((await page.locator("#documentDesignPageSize").inputValue()) === "A4" && (await page.locator('[name="documentDesignOrientation"]:checked').inputValue()) === "portrait", "Default browser page specification is not A4 portrait");
  record((await page.locator("#documentDesignPaperSummary").textContent()).includes("A4 · 세로형 · 210×297mm · 도련 0mm"), "Default page-size summary is unclear");
  record((await page.locator("#documentDesignMedium").inputValue()) === "print" && (await page.locator("#documentDesignBinding").inputValue()) === "none" && (await page.locator("#documentDesignDuplex").inputValue()) === "single" && (await page.locator("#documentDesignSpread").inputValue()) === "single-pages", "Default production specification is unclear");
  record((await page.locator("#documentDesignBackgroundUsage").count()) === 1 && (await page.locator("#documentDesignIconStyle").count()) === 1 && (await page.locator("#documentDesignPictogramStyle").count()) === 1 && (await page.locator("#documentDesignDiagramStyle").count()) === 1 && (await page.locator("[data-typography-scope]").count()) === 10, "Background, icon, pictogram, diagram, or typography-scope controls are missing");
  record((await page.locator("[data-quality-key]").count()) === 10, "The visual production QA checklist is incomplete");
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

  await page.click('[data-visual-grammar="illustrated-narrative"]');
  record((await page.locator("[data-publication-type]").count()) === 4 && (await page.locator('[data-publication-type="fairy-tale"]').getAttribute("aria-pressed")) === "true", "Illustrated narrative types were not filtered or selected");
  record((await page.locator(".doc-design-theme-card").count()) === 3 && (await page.locator("#documentDesignRecommendation").textContent()).includes("동화책"), "Theme recommendations did not follow the selected publication type");
  record((await page.locator("#documentDesignViewTabs [data-live-view]").count()) === 6 && (await page.locator("#documentDesignViewTabs").textContent()).includes("장면 펼침면"), "The six live-preview roles or type-specific special page are missing");
  await page.click('[data-publication-type="picture-book"]');
  record((await page.locator("#documentDesignKind").inputValue()) === "picture-book", "Publication-type card did not synchronize the select control");
  await page.evaluate(() => document.getElementById("documentDesignSampleBtn").click());
  const sampleSource = await page.locator("#documentDesignSource").inputValue();
  record(sampleSource.includes("지역기업 지원사업 결과보고서"), "Sample request was not populated");
  await page.click('[data-theme-category="all"]');
  await page.click('[data-theme-id="dark-innovation"]');
  await page.click('[data-live-view="data"]');
  record((await page.locator("#documentDesignThemeProfileGrid").textContent()).includes("네트워크·신호·입자") && (await page.locator("#documentDesignThemeProfileGrid").textContent()).includes("노드 기반 기술 픽토그램"), "Selected theme does not expose its complete visual profile");
  await page.evaluate(() => document.querySelectorAll(".doc-design-adjust-group").forEach((details) => { details.open = true; }));
  await page.locator("#documentDesignIconStyle").fill("2색 선형 아이콘, 핵심 기능에만 적용");
  await page.locator("#documentDesignDiagramStyle").fill("개념 관계를 단계와 방향선으로 명확히 표현");
  await page.locator("#documentDesignTableStyle").selectOption({ label: "비교 매트릭스" });
  await page.locator("#documentDesignChartType").selectOption({ label: "막대·선 복합" });
  await page.locator('input[type="radio"][data-degree-key="titlePresence"][value="매우 강하게"]').check({ force: true });
  await page.locator('input[type="radio"][data-degree-key="pageWhitespace"][value="매우 여유롭게"]').check({ force: true });
  await page.locator('input[type="radio"][data-degree-key="tableInformationAmount"][value="핵심만 간결하게"]').check({ force: true });
  await page.locator('input[type="radio"][data-degree-key="colorPresence"][value="풍부하게"]').check({ force: true });
  await page.locator("#documentDesignPageSize").selectOption("A3");
  await page.locator('[name="documentDesignOrientation"][value="landscape"]').check();
  await page.locator("#documentDesignMedium").selectOption("hybrid");
  await page.locator("#documentDesignBinding").selectOption("perfect");
  await page.locator("#documentDesignDuplex").selectOption("duplex-long");
  await page.locator("#documentDesignSpread").selectOption("facing-pages");
  await page.locator("#documentDesignBleed").selectOption("3mm");
  await page.locator('[data-adjust-group="colors"][data-adjust-key="accent"]').evaluate((input) => {
    input.value = "#ff3355";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  record((await page.locator("#documentDesignLivePreview").getAttribute("style")).toLowerCase().includes("#ff3355"), "Color adjustment did not update the live preview");
  await page.evaluate(() => document.getElementById("documentDesignGenerateBtn").click());
  const output = await page.locator("#documentDesignOutput").inputValue();
  record(output.startsWith(sampleSource), "Generated browser output does not preserve the source prompt prefix");
  record(output.includes("## 문서 비주얼 편집 및 출력 지침") && output.includes("다크 이노베이션") && output.includes("비교 매트릭스형") && output.includes("막대·선 복합 차트") && output.includes("제작 규격: A3 · 가로형 · 완성 크기 420×297mm") && output.includes("인쇄+화면") && output.includes("무선 제본") && output.includes("양면·긴쪽 넘김") && output.includes("맞쪽 보기") && output.includes("사방 도련 3mm") && output.includes("제목 존재감 매우 강하게") && output.includes("페이지 여백 매우 여유롭게") && output.includes("정보량 핵심만 간결하게"), "Generated browser output is missing exact production or qualitative design instructions");
  record(!/제목 \d+(?:\.\d+)?pt|여백 (?:상|우|하|좌)|최대 \d+열|셀 안쪽 여백 \d+(?:\.\d+)?mm/.test(output), "Generated browser output still contains fixed numeric design values");
  record(output.includes("2색 선형 아이콘, 핵심 기능에만 적용") && output.includes("개념 관계를 단계와 방향선으로 명확히 표현") && output.includes("입력된 원문의 내용·목차·문장·사실·수치·고유명사를 수정·요약·보완하지 않는다") && !output.includes("권장 내용 흐름"), "Generated browser output is missing visual-only or customized asset instructions");
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
  record(compactGallery.previewCount === 6 && ["표지", "장 시작", "본문", "이미지", "표·차트"].every((label) => compactGallery.setLabels.includes(label)), `Compact theme card does not present one complete six-page set: ${JSON.stringify(compactGallery)}`);
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
      pageSpec: `${document.getElementById("documentDesignPageSize")?.value}/${document.querySelector('[name="documentDesignOrientation"]:checked')?.value}`,
      pageControlHeights: [document.getElementById("documentDesignPageSize"), ...document.querySelectorAll('[name="documentDesignOrientation"]')].map((control) => control.closest("label")?.getBoundingClientRect().height || control.getBoundingClientRect().height),
    };
  });
  record(mobileStart.overflow <= 1, `Mobile pane overflows horizontally by ${mobileStart.overflow}px`);
  record(mobileStart.step === "1" && mobileStart.stepOneVisible && !mobileStart.stepTwoVisible, `Mobile journey did not start with only step 1 visible: ${JSON.stringify(mobileStart)}`);
  record(mobileStart.journeyBarVisible && mobileStart.globalActionHidden, `Dedicated mobile journey bar conflicts with the global mobile action bar: ${JSON.stringify(mobileStart)}`);
  record(mobileStart.touchTargets.every((height) => height >= 44), `Mobile journey controls are smaller than 44px: ${JSON.stringify(mobileStart.touchTargets)}`);
  record(mobileStart.pageSpec === "A3/landscape" && mobileStart.pageControlHeights.every((height) => height >= 44), `Mobile page-size controls are unclear or too small: ${JSON.stringify(mobileStart)}`);

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
  record(mobileTheme.previewCount === 6 && ["표지", "장 시작", "본문", "이미지", "표·차트"].every((label) => mobileTheme.setLabels.includes(label)), `Mobile theme card does not show the complete six-page document theme set: ${JSON.stringify(mobileTheme)}`);
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
console.log("Document design smoke test passed: 35 publication types, 7 visual grammars, 12 six-page theme sets, qualitative controls, exact production specs, source preservation, transfer, and four-step mobile journey.");
