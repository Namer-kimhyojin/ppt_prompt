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

record(catalog.version === 1, "Document design catalog version is not 1");
record(catalog.themes.length === 12, `Expected 12 themes, found ${catalog.themes.length}`);
record(new Set(catalog.themes.map((item) => item.id)).size === 12, "Theme ids are not unique");
record(catalog.themes.every((item) => slideCatalog.get(item.sourceVisualStyleId)), "A document theme references a missing slide visual style");
record(catalog.themes.every((item) => ["cover", "content", "data"].every((view) => item.previews[view])), "A document theme is missing a preview view");

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
record(built.spec.schema === "promptdeck-document-design/1.0", "DocumentDesignSpec schema is incorrect");
record(Boolean(built.spec.tableRules?.repeatHeader) && built.spec.chartRules?.threeD === false && built.spec.hierarchy?.levels >= 3, "Structured table, chart, or hierarchy rules are incomplete");

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
  record((await page.locator("#documentDesignMarginTop").count()) === 1 && (await page.locator("#documentDesignTableStyle").count()) === 1 && (await page.locator("#documentDesignChartType").count()) === 1 && (await page.locator("#documentDesignHierarchyLevels").count()) === 1, "Detailed margin, table, chart, or hierarchy controls are missing");
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
  await page.evaluate(() => document.querySelectorAll(".doc-design-adjust-group").forEach((details) => { details.open = true; }));
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
  record((await page.locator("#documentDesignResultState").textContent()).trim() === "최신 상태", "Generated result was not marked current");

  await page.evaluate(() => document.getElementById("documentDesignSendCommonBtn").click());
  await page.waitForSelector("#paneCommonPrompt.active");
  record(await page.locator("#cpdDocumentDesignTransfer").isVisible(), "Transferred prompt is not visible in the common prompt pane");
  record((await page.locator("#cpdDocumentDesignTransfer textarea").inputValue()).startsWith(sampleSource), "Transferred prompt changed the source request");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.PromptDeckTabs.switchTab("documentDesign"));
  await page.waitForSelector("#paneDocumentDesign.active");
  const mobile = await page.evaluate(() => {
    const pane = document.getElementById("paneDocumentDesign");
    const grid = document.querySelector(".doc-design-theme-grid");
    return {
      overflow: pane.scrollWidth - pane.clientWidth,
      columns: getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length,
      mobileCopy: Boolean(document.querySelector('#mobileTabActions [data-proxy-target="documentDesignCopyBtn"]')),
    };
  });
  record(mobile.overflow <= 1, `Mobile pane overflows horizontally by ${mobile.overflow}px`);
  record(mobile.columns === 2, `Mobile theme gallery does not use two columns (${mobile.columns})`);
  record(mobile.mobileCopy, "Mobile primary action is not connected to full prompt copy");
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
console.log("Document design smoke test passed: 12 themes, 36 previews, source preservation, live controls, transfer, and mobile layout.");
