import { createReadStream, existsSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const mime = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);
const failures = [];
const pageErrors = [];

function record(condition, message) {
  if (!condition) failures.push(message);
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url || "/", "http://127.0.0.1");
  if (url.pathname === "/api/health") {
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true, provider: "openai", authEnabled: false }));
    return;
  }
  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filename = path.join(root, pathname);
  if (!existsSync(filename)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  response.setHeader("content-type", mime.get(path.extname(filename)) || "application/octet-stream");
  createReadStream(filename).pipe(response);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;

try {
  try {
    browser = await chromium.launch({ channel: "msedge", headless: true });
  } catch {
    browser = await chromium.launch({ headless: true });
  }
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => pageErrors.push(error.stack || error.message));
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.PromptDeckDataDiagram && window.PromptDeckTabs));
  await page.waitForFunction(() => document.querySelector("#slideImageServerBadge")?.textContent.includes("OpenAI"));
  record(!(await page.locator("#slideImageUseMockBtn").isVisible()), "Public access exposed a provider-management mock switch");
  await page.evaluate(() => window.PromptDeckTabs.switchTab("dataDiagram"));
  await page.waitForSelector("#paneDataDiagram.active");

  await page.click("#diagramSampleBtn");
  await page.waitForTimeout(180);
  const desktopResultFrame = await page.locator(".diagram-result-stack").evaluate((stack) => {
    const section = stack.querySelector(".diagram-result-section");
    const content = section?.querySelector(".gen-content");
    const stackStyle = getComputedStyle(stack);
    const sectionStyle = getComputedStyle(section);
    const sectionRect = section.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    return {
      stackScrolls: stack.scrollHeight > stack.clientHeight + 1,
      stackOverflowY: stackStyle.overflowY,
      sectionFlexShrink: sectionStyle.flexShrink,
      sectionClipsContent: contentRect.bottom > sectionRect.bottom + 1 || section.scrollHeight > section.clientHeight + 1,
    };
  });
  record(
    desktopResultFrame.stackScrolls &&
      desktopResultFrame.stackOverflowY === "auto" &&
      desktopResultFrame.sectionFlexShrink === "0" &&
      !desktopResultFrame.sectionClipsContent,
    "Desktop result frame clipped content instead of exposing the complete result through scrolling",
  );
  const contract = await page.evaluate(() => {
    const api = window.PromptDeckDataDiagram;
    const spec = api.getSpec();
    const collision = api.parseData("항목\nA+B\nA B");
    return {
      schema: spec.schema,
      hash: spec.source.hash,
      knownHash: api.hashText("abc"),
      generation: spec.generation,
      uniqueIds: new Set(collision.nodes.map((node) => node.id)).size === collision.nodes.length,
      svg: api.renderExportSvg().slice(0, 220),
      registry: window.PromptDeckPromptSources.get("dataDiagram")?.key,
      styleContractVersion: window.PromptDeckVisualStyleContract?.version,
      fullStyleCount: window.PromptDeckVisualStyleContract?.listDiagramStyles({ mode: "all" }).length,
      styleCounts: window.PromptDeckVisualStyleContract?.counts,
    };
  });
  record(contract.schema === "promptdeck-data-diagram/2.0", "DiagramSpec v2 schema is missing");
  record(/^sha256:[0-9a-f]{64}$/.test(contract.hash), "Source fingerprint is not SHA-256");
  record(contract.knownHash === "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", "SHA-256 implementation failed the known-vector check");
  record(contract.generation?.contractVersion === "diagram-2.0", "Generation contract metadata is missing");
  record(contract.uniqueIds, "Normalized source labels produced colliding node IDs");
  record(contract.svg.includes('width="1920"') && contract.svg.includes('height="1080"'), "16:9 SVG export size is incorrect");
  record(contract.registry === "dataDiagram", "Data Diagram prompt source was not registered");
  record(contract.styleContractVersion === "1.1", "Shared VisualStyleContract v1.1 was not loaded");
  record(contract.fullStyleCount === 180 && contract.styleCounts?.total === 180, "Data Diagram did not expose the complete 180-style slide gallery");
  record(contract.styleCounts?.compatible > 10, "Diagram-compatible style count was still limited to the 10-card preview");
  record((await page.locator("#diagramBestMatch svg").textContent()).includes("참여기업 모집"), "Expected match did not use source labels");

  record((await page.locator("#diagramSlideStyleCount").textContent()).includes("전체 갤러리 180개"), "Compact DNA gallery did not disclose the full catalog size");
  await page.click("#diagramOpenSlideStyleGalleryBtn");
  record(await page.locator("#diagramSlideStyleDialog").isVisible(), "Full slide-style gallery dialog did not open");
  const desktopGalleryGeometry = await page.locator("#diagramSlideStyleDialog").evaluate((backdrop) => {
    const dialog = backdrop.querySelector(".diagram-style-dialog");
    const heading = backdrop.querySelector(".diagram-style-dialog-head");
    const dialogRect = dialog?.getBoundingClientRect();
    const headingRect = heading?.getBoundingClientRect();
    return {
      mountedAtBody: backdrop.parentElement === document.body,
      dialogTop: dialogRect?.top ?? -1,
      headingTop: headingRect?.top ?? -1,
      headingBottom: headingRect?.bottom ?? window.innerHeight + 1,
      viewportHeight: window.innerHeight,
    };
  });
  record(
    desktopGalleryGeometry.mountedAtBody &&
      desktopGalleryGeometry.dialogTop >= 0 &&
      desktopGalleryGeometry.headingTop >= 0 &&
      desktopGalleryGeometry.headingBottom <= desktopGalleryGeometry.viewportHeight,
    "Full gallery heading or close control was clipped above the desktop viewport",
  );
  record((await page.locator("#diagramSlideStyleAllGrid .diagram-style-browser-card").count()) === 24, "Full gallery did not render its first 24-style batch");
  record((await page.locator("#diagramSlideStyleCategories [role=tab]").count()) === 14, "Full gallery category navigation is incomplete");
  const desktopCategoryLayout = await page.locator("#diagramSlideStyleCategories").evaluate((categoryHost) => {
    const hostRect = categoryHost.getBoundingClientRect();
    const categories = [...categoryHost.querySelectorAll("[role=tab]")];
    return {
      overflowsHorizontally: categoryHost.scrollWidth > categoryHost.clientWidth + 1,
      clippedCategories: categories.filter((category) => {
        const rect = category.getBoundingClientRect();
        return rect.left < hostRect.left - 1 || rect.right > hostRect.right + 1;
      }).length,
    };
  });
  record(
    !desktopCategoryLayout.overflowsHorizontally && desktopCategoryLayout.clippedCategories === 0,
    "Full gallery categories were clipped or hidden behind horizontal scrolling on desktop",
  );
  await page.click("#diagramSlideStyleLoadMoreBtn");
  record((await page.locator("#diagramSlideStyleAllGrid .diagram-style-browser-card").count()) === 48, "Full gallery did not reveal the next style batch");
  const nonDiagramStyle = await page.evaluate(() => {
    const bridge = window.PromptDeckVisualStyleContract;
    const style = window.PromptDeckSlideStyleCatalog.styles.find((candidate) => !bridge.isDiagramCompatible(candidate));
    return style ? { id: style.id, nameKo: style.nameKo } : null;
  });
  record(Boolean(nonDiagramStyle), "Could not find a non-diagram style to validate full-catalog access");
  if (nonDiagramStyle) {
    await page.locator("#diagramSlideStyleSearch").fill(nonDiagramStyle.nameKo);
    await page.waitForTimeout(180);
    record((await page.locator(`#diagramSlideStyleAllGrid [data-slide-style-id="${nonDiagramStyle.id}"]`).count()) === 1, "Full gallery search omitted a style outside the recommended subset");
    await page.locator(`#diagramSlideStyleAllGrid [data-slide-style-id="${nonDiagramStyle.id}"]`).click();
    record((await page.evaluate(() => window.PromptDeckDataDiagram.getState().slideStyleId)) === nonDiagramStyle.id, "Full gallery selection did not update the Data Diagram style contract");
  }
  await page.keyboard.press("Escape");
  record(!(await page.locator("#diagramSlideStyleDialog").isVisible()), "Escape did not close the full style gallery");
  record(await page.locator("#diagramOpenSlideStyleGalleryBtn").evaluate((button) => document.activeElement === button), "Closing the full style gallery did not restore focus");

  for (const [selector, extension] of [
    ["#diagramDownloadSvgBtn", ".svg"],
    ["#diagramDownloadPngBtn", ".png"],
    ["#diagramDownloadSpecBtn", ".json"],
  ]) {
    const pending = page.waitForEvent("download");
    await page.click(selector);
    const download = await pending;
    record(download.suggestedFilename().endsWith(extension), `${extension} export did not start a matching download`);
  }

  await page.locator("#diagramDataInput").fill([
    "항목\t상위항목",
    "총괄 전략\t",
    "사업 기획\t총괄 전략",
    "사업 실행\t총괄 전략",
    "성과 검증\t사업 실행",
  ].join("\n"));
  await page.locator('[data-option-id="hierarchy"]').click();
  await page.waitForTimeout(220);
  record((await page.locator("#diagramSourceBadge").textContent()).includes("원본 변경"), "Source change after export was not detected");
  const hierarchy = await page.evaluate(() => {
    const spec = window.PromptDeckDataDiagram.getSpec();
    return {
      edges: spec.data.edges,
      previewText: document.querySelector("#diagramLivePreview")?.textContent || "",
    };
  });
  record(hierarchy.edges.length === 3 && hierarchy.edges.every((edge) => edge.id && edge.fromId && edge.toId), "Hierarchy edges were not normalized to stable IDs");
  record(["총괄 전략", "사업 기획", "사업 실행", "성과 검증"].every((label) => hierarchy.previewText.includes(label)), `Hierarchy preview did not render the source labels: ${JSON.stringify(hierarchy)}`);

  await page.click("#diagramResetBtn");
  await page.locator("#diagramTitle").fill("사업 우선순위 매트릭스");
  await page.locator("#diagramDataInput").fill([
    "항목\t그룹",
    "규제 실증 패스트트랙\t고효과·저난이도",
    "공동 인프라 구축\t고효과·고난이도",
    "상담 양식 표준화\t저효과·저난이도",
    "해외 거점 상설화\t저효과·고난이도",
  ].join("\n"));
  await page.waitForTimeout(220);
  record((await page.evaluate(() => window.PromptDeckDataDiagram.getState().type)) === "matrix", "Semantic quadrant groups did not auto-recommend a matrix");
  record(await page.locator("#diagramMatrixSettings").isVisible(), "Matrix axis settings were not exposed for the matrix type");
  await page.locator("#diagramMatrixXAxis").fill("실행 난이도");
  await page.locator("#diagramMatrixYAxis").fill("사업 효과");
  await page.locator('[data-slide-style-id="consulting-strategy"]').click();
  await page.waitForTimeout(160);
  const matrixContract = await page.evaluate(() => {
    const api = window.PromptDeckDataDiagram;
    const spec = api.getSpec();
    return {
      type: spec.diagram.type,
      axes: spec.diagram.matrix?.axes,
      placements: spec.diagram.matrix?.placements,
      styleId: spec.visual.styleContract?.id,
      prompt: api.buildPrompt(),
      svg: api.renderDiagramSvg(),
    };
  });
  record(matrixContract.type === "matrix" && matrixContract.axes?.x.label === "실행 난이도" && matrixContract.axes?.y.label === "사업 효과", "Matrix axes were not preserved in DiagramSpec");
  record(matrixContract.placements?.every((placement) => placement.source === "group"), "Matrix placements did not preserve semantic group values");
  record(matrixContract.placements?.[0]?.quadrantId === "high-impact-low-effort" && matrixContract.placements?.[3]?.quadrantId === "low-impact-high-effort", "Matrix quadrant mapping is incorrect");
  record(matrixContract.styleId === "consulting-strategy", "Slide gallery DNA was not attached to DiagramSpec");
  record(matrixContract.prompt.includes("Shared slide-gallery design DNA") && matrixContract.prompt.includes("X-axis: 실행 난이도"), "Prompt omitted the shared style or explicit matrix axis contract");
  record(matrixContract.svg.includes("사업 효과") && matrixContract.svg.includes("고효과·저난이도") && matrixContract.svg.includes("#12315B"), "SVG preview omitted matrix semantics or shared gallery colors");

  await page.locator("#diagramTitle").fill("복합 지표 추진 흐름");
  await page.locator("#diagramDataInput").fill([
    "항목\t값\t단위\t순서",
    "기업 모집\t120\t개사\t1",
    "상담 운영\t34\t건\t2",
    "투자 연계\t18\t억원\t3",
  ].join("\n"));
  await page.locator('[data-option-id="flow"]').click();
  await page.waitForTimeout(160);
  const flowDiagnostics = await page.evaluate(() => window.PromptDeckDataDiagram.getDiagnostics());
  record(flowDiagnostics.some((item) => item.code === "mixed-units" && item.severity === "warning"), "Mixed units were not a non-blocking warning for a flow");
  record(await page.locator("#diagramSendSlideImageBtn").isEnabled(), "A non-comparative mixed-unit flow was incorrectly blocked");
  await page.locator('[data-option-id="comparison"]').click();
  await page.waitForTimeout(100);
  const comparisonDiagnostics = await page.evaluate(() => window.PromptDeckDataDiagram.getDiagnostics());
  record(comparisonDiagnostics.some((item) => item.code === "mixed-units" && item.severity === "error"), "Mixed units were not upgraded to a comparison error");
  record(!(await page.locator("#diagramSendSlideImageBtn").isEnabled()), "A mixed-unit direct comparison was not blocked");

  await page.click("#diagramSampleBtn");
  await page.waitForTimeout(120);
  record(await page.locator("#diagramSendSlideImageBtn").isEnabled(), "Ready diagram could not be sent to image generation");
  await page.click("#diagramSendSlideImageBtn");
  await page.waitForSelector("#paneSlideImage.active");
  const transfer = await page.evaluate(() => window.PromptDeckSlideImageGeneration.getActivePayload());
  record(transfer.contractVersion === "diagram-2.0" && transfer.sourceHash === contract.hash, "Generation bridge changed the source contract");
  record((await page.locator("#slideImagePrompt").inputValue()).includes("Workflow source fingerprint"), "Generation bridge omitted the traceable prompt");

  await page.evaluate(() => window.PromptDeckTabs.switchTab("dataDiagram"));
  await page.setViewportSize({ width: 390, height: 844 });
  record((await page.locator("#paneDataDiagram .diagram-step.is-open").count()) === 1, "Mobile workflow opened more than one step");
  await page.locator('[data-diagram-step="structure"] .diagram-step-toggle').click();
  record((await page.locator('[data-diagram-step="structure"].is-open').count()) === 1, "Mobile workflow did not open the selected step");
  await page.locator('[data-diagram-step="visual"] .diagram-step-toggle').click();
  await page.locator("#diagramOpenSlideStyleGalleryBtn").click();
  const mobileGallery = await page.locator("#diagramSlideStyleDialog .diagram-style-dialog").evaluate((dialog) => {
    const body = dialog.querySelector(".diagram-style-dialog-body");
    const categories = dialog.querySelector(".diagram-style-categories");
    const categoryRows = categories
      ? new Set([...categories.querySelectorAll("[role=tab]")].map((category) => Math.round(category.getBoundingClientRect().top))).size
      : 0;
    return {
      width: dialog.getBoundingClientRect().width,
      viewport: window.innerWidth,
      bodyOverflow: body.scrollWidth > body.clientWidth + 1,
      visibleCards: dialog.querySelectorAll(".diagram-style-browser-card").length,
      categoryRows,
      categoryOverflow: categories ? categories.scrollWidth > categories.clientWidth + 1 : false,
      categoryScrollbar: categories ? getComputedStyle(categories).scrollbarWidth : "none",
    };
  });
  record(mobileGallery.width <= mobileGallery.viewport + 1 && !mobileGallery.bodyOverflow, "Full gallery overflowed the mobile viewport");
  record(mobileGallery.visibleCards > 0, "Full gallery cards disappeared on mobile");
  record(
    mobileGallery.categoryRows === 2 && mobileGallery.categoryOverflow && mobileGallery.categoryScrollbar !== "none",
    "Mobile gallery categories did not provide a compact, scrollable two-row list",
  );
  await page.locator("#diagramSlideStyleDialog [data-diagram-style-dialog-close]").last().click();
  const overflow = await page.locator("#paneDataDiagram").evaluate((pane) => pane.scrollWidth > pane.clientWidth + 1);
  record(!overflow, "Data Diagram overflowed the mobile viewport");
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}

if (pageErrors.length) failures.push(`Page errors: ${pageErrors.join(" | ")}`);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("data diagram smoke test passed: v2 contract, topology, exports, bridge, mobile flow");
}
