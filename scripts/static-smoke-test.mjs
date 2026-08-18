import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(process.cwd(), "dist-static");
const remoteOrigin = String(process.env.STATIC_BASE_URL || "").replace(/\/$/, "");
const excludedStaticScripts = [
  "src/account-settings.js",
  "src/image-generation-client.js",
  "src/generation-queue.js",
  "src/slide-image-generation.js",
];
const localPagesFunctionPaths = new Set(["/api/admin-settings", "/api/admin/access"]);
const mime = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
]);

const server = remoteOrigin ? null : http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const filename = path.resolve(root, relative);
    if (filename !== root && !filename.startsWith(`${root}${path.sep}`)) throw new Error("bad path");
    const stat = await fs.stat(filename);
    if (!stat.isFile()) throw new Error("not a file");
    response.writeHead(200, { "content-type": mime.get(path.extname(filename)) || "application/octet-stream" });
    createReadStream(filename).pipe(response);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

if (server) await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = remoteOrigin || `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: "msedge", headless: true });
const failures = [];

async function verifyViewport(label, viewport) {
  const page = await browser.newPage({ viewport });
  await page.route(/\.(?:avif|gif|jpe?g|png|webp)(?:\?.*)?$/i, (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.startsWith("/assets/label-sheet/default-backgrounds/")) return route.continue();
    return route.abort();
  });
  const pageErrors = [];
  const failedScripts = [];
  const failedResponses = [];
  page.on("pageerror", (error) => pageErrors.push(error.stack || error.message));
  page.on("response", (response) => {
    if (response.request().resourceType() === "script" && !response.ok()) {
      failedScripts.push(`${response.status()} ${response.url()}`);
    }
    if (response.status() >= 400) {
      const pathname = new URL(response.url()).pathname;
      if (remoteOrigin || !localPagesFunctionPaths.has(pathname)) {
        failedResponses.push(`${response.status()} ${response.url()}`);
      }
    }
  });
  await page.goto(origin, { waitUntil: "commit" });
  await page.waitForLoadState("load");
  try {
    await page.waitForSelector("#tabBtnCommonPrompt", { state: viewport.width <= 720 ? "attached" : "visible", timeout: 30_000 });
    await page.waitForSelector("#paneCommonPrompt.active", { state: "visible", timeout: 30_000 });
    await page.waitForSelector("#tabBtnSlideImage", { state: "hidden", timeout: 30_000 });
    await page.waitForSelector("#userBar", { state: "hidden", timeout: 30_000 });
  } catch (error) {
    const diagnostics = await page.evaluate(() => ({
      readyState: document.readyState,
      bodyChildren: document.body?.children.length || 0,
      loadedScripts: performance.getEntriesByType("resource")
        .filter((entry) => entry.name.includes(".js"))
        .map((entry) => entry.name.split("/").pop()),
    })).catch(() => ({ readyState: "unavailable" }));
    throw new Error(`${label}: 정적 UI 초기화 시간 초과 ${JSON.stringify(diagnostics)}`, { cause: error });
  }
  await page.waitForFunction(() => (
    window.CONCEPT_MIXER_PRESETS?.getCustomSamplesForMed?.("mix-steel-hot-rolling")?.[0]
      === "/outputs/mixer_samples/mix-steel-hot-rolling_0.jpg"
  ), null, { timeout: 30_000 });

  const visible = async (selector) => page.locator(selector).isVisible().catch(() => false);
  const openAppToolNavigation = async () => {
    if (viewport.width > 720 || await page.evaluate(() => document.body.classList.contains("app-tool-nav-open"))) return;
    await page.locator("#appToolMenuBtn").click();
    await page.waitForFunction(() => document.body.classList.contains("app-tool-nav-open"));
  };
  const expectOnlyPane = async (expectedId, phase) => {
    const paneIds = await page.locator(".tab-pane").evaluateAll((panes) => panes
      .filter((pane) => {
        const style = getComputedStyle(pane);
        return style.display !== "none" && style.visibility !== "hidden" && pane.getClientRects().length > 0;
      })
      .map((pane) => pane.id));
    if (paneIds.length !== 1 || paneIds[0] !== expectedId) {
      failures.push(`${label}: ${phase}에서 표시 pane이 하나가 아닙니다. expected=${expectedId}, actual=${paneIds.join(",")}`);
    }
  };
  const bodyText = await page.locator("body").innerText();
  if (bodyText.includes("공개 정적 버전 · 작업 내용과 로컬 이미지는 이 브라우저에만 저장됩니다.")) {
    failures.push(`${label}: 삭제된 정적 버전 안내 문구가 노출됩니다.`);
  }
  if (viewport.width <= 720) await openAppToolNavigation();
  if (!(await visible("#tabBtnCommonPrompt"))) failures.push(`${label}: 도구 서랍에서 기본 탭이 보이지 않습니다.`);
  if (await visible("#tabBtnSlideImage")) failures.push(`${label}: 서버 이미지 생성 탭이 노출됩니다.`);
  if (await visible("#userBar")) failures.push(`${label}: 계정 UI가 노출됩니다.`);
  await expectOnlyPane("paneCommonPrompt", "기본 진입");

  const specialGroupFilter = page.locator('[data-tab-group-filter="special"]');
  if (!(await visible("#tabBtnDataDiagram")) && await specialGroupFilter.isVisible()) {
    await specialGroupFilter.click();
  }
  const diagramTabVisible = await visible("#tabBtnDataDiagram");
  if (!diagramTabVisible) failures.push(`${label}: 데이터 다이어그램 탭이 보이지 않습니다.`);
  if (diagramTabVisible) {
    await page.locator("#tabBtnDataDiagram").click();
    await page.locator("#diagramSampleBtn").click();
    await page.waitForTimeout(150);
    await expectOnlyPane("paneDataDiagram", "데이터 다이어그램 전환");
    if (!(await page.locator("#diagramDownloadSvgBtn").isEnabled())) failures.push(`${label}: 데이터 다이어그램 SVG 저장이 비활성화되었습니다.`);
    if (!(await page.locator("#diagramDownloadPngBtn").isEnabled())) failures.push(`${label}: 데이터 다이어그램 PNG 저장이 비활성화되었습니다.`);
    if (!(await page.locator("#diagramDownloadSpecBtn").isEnabled())) failures.push(`${label}: 데이터 다이어그램 JSON 저장이 비활성화되었습니다.`);
    if (await page.locator("#diagramSendSlideImageBtn").isEnabled()) failures.push(`${label}: 정적판에서 이미지 생성 연결이 활성화되었습니다.`);
    const diagramHint = await page.locator("#diagramProductionHint").textContent();
    if (!diagramHint.includes("로컬 서버판")) failures.push(`${label}: 이미지 생성 연결 비활성 사유가 노출되지 않습니다. (${diagramHint.trim()})`);
    if (viewport.width <= 720 && (await page.locator("#paneDataDiagram .diagram-step.is-open").count()) !== 1) failures.push(`${label}: 모바일 데이터 다이어그램 단계가 하나만 열리지 않았습니다.`);
  }
  if (viewport.width <= 720) await openAppToolNavigation();
  const labelTabVisible = await visible("#tabBtnLabelSheet");
  if (!labelTabVisible) failures.push(`${label}: 라벨·티켓 제작 탭이 보이지 않습니다.`);
  if (labelTabVisible) {
    await page.locator("#tabBtnLabelSheet").click();
    await expectOnlyPane("paneLabelSheet", "라벨·티켓 전환");
    if ((await page.locator("#paneLabelSheet.label-sheet-workspace-v11[data-label-workspace-layout-ready='true'] .label-sheet-workspace-frame").count()) !== 1) failures.push(`${label}: 라벨·티켓 V11 작업공간이 초기화되지 않았습니다.`);
    if (
      (await page.locator("#paneLabelSheet .label-sheet-workspace-topbar + .label-sheet-workspace-flowbar + .label-sheet-workspace-entry + .label-sheet-workspace-frame").count()) !== 1
      || (await page.locator("#labelSheetWorkspaceDataDrawer .label-sheet-workspace-bottom").count()) !== 1
    ) failures.push(`${label}: 프로젝트 진입점·캔버스·데이터 작업 화면 구조가 깨졌습니다.`);
    if ((await page.locator("#paneLabelSheet [data-label-workspace-menu-trigger]").count()) !== 4 || (await page.locator("#labelSheetWorkspaceDetailDrawer").count()) !== 1) failures.push(`${label}: 맞춤형 메뉴 또는 세부 편집 모달이 누락되었습니다.`);
    if (
      (await page.locator("[data-label-workspace-history-command]").count()) !== 4
      || (await page.locator("#labelSheetWorkspaceToolsBtn").count()) !== 1
      || (await page.locator(".label-sheet-workspace-mode-button").count()) !== 2
    ) failures.push(`${label}: 편집 기록, 작업 메뉴 또는 레이아웃·데이터 모드가 누락되었습니다.`);
    if ((await page.locator(".label-sheet-workspace-context-toolbar [data-label-sheet-nudge]").count()) !== 0 || (await page.locator("#labelSheetWorkspaceDetailDrawer .label-sheet-workspace-precision-tools [data-label-sheet-nudge]").count()) !== 4) failures.push(`${label}: 저빈도 정밀 도구가 핵심 캔버스에서 상세 편집으로 이동하지 않았습니다.`);
    if ((await page.locator("#labelSheetWorkspaceContextTargetPicker").count()) !== 1 || (await page.locator(".label-sheet-workspace-context-actions > button").count()) !== 3) failures.push(`${label}: 선택 항목 맞춤형 빠른 도구가 단순화되지 않았습니다.`);
    if (await page.locator("#labelSheetWorkspaceContextTargetPicker > summary").isVisible()) {
      await page.locator("#labelSheetWorkspaceContextTargetPicker > summary").click();
      if (!(await page.locator('#labelSheetWorkspaceContextTargetPicker [data-label-sheet-focus-target="body"]').isVisible())) failures.push(`${label}: 편집 항목 선택 메뉴가 열리지 않았습니다.`);
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.querySelector("#labelSheetWorkspaceContextTargetPicker")?.open);
    }
    if ((await page.locator("#labelSheetWorkspaceRecoveryMenu").count()) !== 1 || (await page.locator("#labelSheetWorkspaceUndoToast").count()) !== 1) failures.push(`${label}: 자동 저장 복구 또는 실행 취소 안내가 누락되었습니다.`);
    await page.keyboard.press("Control+K");
    await page.waitForSelector("#labelSheetWorkspaceCommandPalette:not([hidden])");
    await page.locator("#labelSheetWorkspaceCommandSearch").fill("프로젝트 설정");
    if ((await page.locator(".label-sheet-workspace-command-item").count()) !== 1 || !(await page.locator(".label-sheet-workspace-command-item").innerText()).includes("프로젝트 설정 열기")) failures.push(`${label}: 명령 팔레트가 작업 목적을 검색하지 못했습니다.`);
    await page.keyboard.press("Escape");
    await page.waitForSelector("#labelSheetWorkspaceCommandPalette", { state: "hidden" });
    await page.keyboard.press("Alt+1");
    await page.waitForFunction(() => document.querySelector("#paneLabelSheet")?.dataset.workMode === "layout");
    if (viewport.width > 860) {
      await page.emulateMedia({ media: "print" });
      await page.waitForTimeout(60);
      await page.emulateMedia({ media: "screen" });
      await page.waitForTimeout(180);
      const workspaceAfterPrint = await page.locator("#paneLabelSheet").evaluate((pane) => ({
        bottom: pane.getBoundingClientRect().bottom,
        viewportHeight: window.innerHeight,
        availableHeight: getComputedStyle(pane).getPropertyValue("--label-workspace-available-height").trim(),
      }));
      if (workspaceAfterPrint.bottom > workspaceAfterPrint.viewportHeight + 1) failures.push(`${label}: 인쇄 미디어 전환 후 라벨 작업공간 높이가 뷰포트를 벗어났습니다. ${JSON.stringify(workspaceAfterPrint)}`);
    }
    await page.evaluate(() => {
      const goal = document.querySelector("#labelSheetOutputGoalPrompt");
      const type = document.querySelector('input[name="labelSheetIntentDocumentType"][value="meal-ticket"]');
      const duplex = document.querySelector("#labelSheetModeDuplex");
      goal.checked = true;
      goal.dispatchEvent(new Event("change", { bubbles: true }));
      type.checked = true;
      type.dispatchEvent(new Event("change", { bubbles: true }));
      duplex.checked = true;
      duplex.dispatchEvent(new Event("change", { bubbles: true }));
      document.querySelector("#labelSheetIntentSampleBtn")?.click();
    });
    await page.waitForFunction(() => document.querySelectorAll("#labelSheetRecordTableBody tr[data-record-id]").length === 8);
    await page.waitForFunction(() => document.querySelectorAll("#labelSheetPreviewSurface canvas").length === 1);
    await page.waitForTimeout(850);
    await page.keyboard.press("Control+K");
    await page.locator("#labelSheetWorkspaceCommandSearch").fill("직접 제작 모드");
    await page.locator(".label-sheet-workspace-command-item:not([disabled])").click();
    await page.waitForFunction(() => document.querySelector("#paneLabelSheet")?.dataset.outputGoal === "print");
    if (viewport.width >= 1600) {
      const wideDesktopGeometry = await page.locator("#paneLabelSheet").evaluate((pane) => {
        const box = (selector) => pane.querySelector(selector)?.getBoundingClientRect();
        const topbar = box(".label-sheet-workspace-topbar");
        const flowbar = box(".label-sheet-workspace-flowbar");
        const canvas = box(".label-sheet-workspace-canvas-column");
        const canvasHeader = box(".label-sheet-workspace-canvas-header");
        const contextToolbar = box(".label-sheet-workspace-context-toolbar");
        const inspector = box(".label-sheet-workspace-inspector");
        const statusbar = box(".label-sheet-workspace-statusbar");
        return {
          topbarHeight: topbar?.height || 0,
          flowbarHeight: flowbar?.height || 0,
          canvasWidth: canvas?.width || 0,
          inspectorWidth: inspector?.width || 0,
          canvasBottom: canvas?.bottom || 0,
          flowbarTop: flowbar?.top || 0,
          flowbarBottom: flowbar?.bottom || 0,
          statusbarTop: statusbar?.top || 0,
          toolbarTopDelta: canvasHeader && contextToolbar ? Math.abs(canvasHeader.top - contextToolbar.top) : 999,
          toolbarBottomDelta: canvasHeader && contextToolbar ? Math.abs(canvasHeader.bottom - contextToolbar.bottom) : 999,
          viewportWidth: window.innerWidth,
        };
      });
      if (
        wideDesktopGeometry.topbarHeight > 60
        || wideDesktopGeometry.flowbarHeight > 48
        || wideDesktopGeometry.canvasWidth < wideDesktopGeometry.viewportWidth * 0.72
        || wideDesktopGeometry.inspectorWidth < 338
        || wideDesktopGeometry.inspectorWidth > 374
        || wideDesktopGeometry.flowbarTop < wideDesktopGeometry.canvasBottom - 1
        || wideDesktopGeometry.statusbarTop < wideDesktopGeometry.flowbarBottom - 1
        || wideDesktopGeometry.toolbarTopDelta > 1
        || wideDesktopGeometry.toolbarBottomDelta > 1
      ) failures.push(`${label}: 넓은 데스크톱 캔버스 중심 배치가 유지되지 않습니다. ${JSON.stringify(wideDesktopGeometry)}`);
    }
    await page.locator("#labelSheetWorkspaceContextTargetPicker > summary").click();
    await page.locator('#labelSheetWorkspaceContextTargetPicker [data-label-sheet-focus-target="body"]').click();
    await page.waitForFunction(() => document.querySelector("#labelSheetWorkspaceContextTargetLabel")?.textContent?.trim() === "본문" && !document.querySelector("#labelSheetWorkspaceContextTargetPicker")?.open);
    await page.waitForFunction(() => !document.querySelector("#labelSheetWorkspaceUndoBtn")?.disabled);
    await page.keyboard.press("Control+Z");
    await page.waitForFunction(() => document.querySelector("#paneLabelSheet")?.dataset.outputGoal === "prompt");
    await page.waitForFunction(() => !document.querySelector("#labelSheetWorkspaceRedoBtn")?.disabled);
    await page.keyboard.press("Control+Shift+Z");
    await page.waitForFunction(() => document.querySelector("#paneLabelSheet")?.dataset.outputGoal === "print");
    await page.keyboard.press("Control+Z");
    await page.waitForFunction(() => document.querySelector("#paneLabelSheet")?.dataset.outputGoal === "prompt");
    if ((await page.locator("#labelSheetWorkspaceRecordList .label-sheet-workspace-record").count()) !== 8) failures.push(`${label}: 레코드 탐색기가 데이터 8건을 반영하지 못했습니다.`);
    if (viewport.width > 860) {
      await page.locator("#labelSheetWorkspaceDataModeBtn").click();
      await page.waitForSelector("#labelSheetWorkspaceDataDrawer:not([hidden])");
      await page.locator('[data-label-bottom-tab="data"]').click();
      await page.waitForFunction(() => {
        const pane = document.querySelector("#paneLabelSheet");
        const panel = document.querySelector('[data-label-bottom-panel="data"]');
        return !pane?.classList.contains("is-bottom-collapsed") && panel && !panel.hidden;
      });
      await page.locator("#labelSheetWorkspaceDataDrawer [data-label-workspace-drawer-close]").first().click();
      await page.waitForSelector("#labelSheetWorkspaceDataDrawer", { state: "hidden" });
    }
    if (viewport.width <= 720) await page.locator("#labelSheetWorkspaceInspectorBtn").click();
    await page.locator("#labelSheetWorkspaceDetailBtn").click();
    await page.waitForSelector("#labelSheetWorkspaceDetailDrawer:not([hidden])");
    await page.locator("#labelSheetQrAdvanced").evaluate((details) => { details.open = true; });
    await page.waitForFunction(() => window.PromptDeckLabelSheet.assetStore.list().filter((asset) => asset.filename.startsWith("기본-")).length >= 6, null, { timeout: 60_000 });
    if (!(await page.evaluate(() => Boolean(window.PromptDeckLabelSheetPackage && window.PromptDeckTabularData && window.QRGeneratorCore)))) failures.push(`${label}: 라벨 패키지·표 데이터·QR 공용 모듈이 누락되었습니다.`);
    if (!(await page.evaluate(() => typeof window.QRGeneratorCore?.getCurrentValue === "function"))) failures.push(`${label}: QR 생성기의 현재 값을 라벨에 전달하는 연결이 누락되었습니다.`);
    if (
      (await page.locator("#labelSheetRecordTable thead th").count()) !== 18
      || !(await visible('[data-label-workspace-flow-step="data"]'))
    ) failures.push(`${label}: 프롬프트 모드의 원본 데이터 검토·직접 편집 표가 누락되었습니다.`);
    if (await visible("#labelSheetQrAssignBtn") || await visible("#labelSheetQrUseCurrentBtn")) failures.push(`${label}: 프롬프트 설계에 실제 QR 값 배정 기능이 노출됩니다.`);
    if (!(await visible("#labelSheetQrResolvedPreview"))) failures.push(`${label}: 프롬프트 설계의 QR 예약 상태 확인이 숨겨졌습니다.`);
    if (await visible("#labelSheetGenerateMissingBtn")) failures.push(`${label}: 프롬프트 설계에서 라벨 AI 배경 생성이 노출됩니다.`);
    if (await visible("#labelSheetAssetRegisterBtn")) failures.push(`${label}: 프롬프트 설계에 실제 이미지 등록 절차가 노출됩니다.`);
    if (await visible("#labelSheetRestoreDefaultsBtn")) failures.push(`${label}: 프롬프트 설계에 실제 배경 복구 기능이 노출됩니다.`);
    if ((await page.locator("#labelSheetAssetList .label-sheet-asset-card").count()) < 6) failures.push(`${label}: 정적판 기본 배경 6종이 보관함에 등록되지 않았습니다.`);
    if (await visible("#labelSheetPageImageRegisterBtn")) failures.push(`${label}: 프롬프트 설계에 A4 배경 합성 절차가 노출됩니다.`);
    if (await visible("#labelSheetSavePackageBtn") || await visible("#labelSheetExportLayersBtn")) failures.push(`${label}: 프롬프트 설계에 완성물 패키지 기능이 노출됩니다.`);
    await page.locator("#labelSheetWorkspaceDetailDrawer [data-label-workspace-drawer-close]").first().click();
    await page.waitForSelector("#labelSheetWorkspaceDetailDrawer", { state: "hidden" });
    const outputStep = '[data-label-workspace-flow-step="output"]';
    if (!(await visible(outputStep))) failures.push(`${label}: 하단 출력 단계가 숨겨졌습니다.`);
    await page.locator(outputStep).click();
    await page.waitForSelector("#labelSheetWorkspaceReviewDrawer:not([hidden])");
    if (!(await visible("#labelSheetGeneratePromptBtn"))) failures.push(`${label}: 출력 화면의 프롬프트 생성 버튼이 숨겨졌습니다.`);
    await page.locator("#labelSheetGeneratePromptBtn").click();
    await page.waitForFunction(() => document.querySelector("#labelSheetPromptPreview")?.value.includes("DEMO-MEAL-001"));
    const prompt = await page.locator("#labelSheetPromptPreview").inputValue();
    if (!prompt.includes("A4 FULL IMAGE PAGE") || !prompt.includes("샘플교육센터 교육생 식권") || !prompt.includes("DEMO-MEAL-001")) failures.push(`${label}: 정적판 실제 문구 포함 전체 이미지 프롬프트가 생성되지 않았습니다.`);
    if (!prompt.includes("reserve-blank-space") || prompt.includes("https://example.kr/sample-meal/DEMO-MEAL-001")) failures.push(`${label}: 정적판 QR 합성 공간 예약 계약이 지켜지지 않았습니다. (reserve=${prompt.includes("reserve-blank-space")}, actualUrl=${prompt.includes("https://example.kr/sample-meal/DEMO-MEAL-001")})`);
    if ((await page.locator("#labelSheetPromptPageSelect option").count()) !== 2) failures.push(`${label}: 정적판 양면 프롬프트가 앞·뒷면 페이지로 분리되지 않았습니다.`);
    if ((await page.locator("#labelSheetPromptPageSelectBottom option").count()) !== 2 || !(await visible("#labelSheetCopyPromptBottomBtn")) || !(await visible("#labelSheetCopyPromptNextBtn"))) failures.push(`${label}: 정적판 상·하단 페이지 선택·연속 복사 도구가 누락되었습니다.`);
    await page.locator("#labelSheetPromptPageSelectBottom").selectOption("1");
    await page.waitForFunction(() => document.querySelector("#labelSheetPromptPageSelect")?.value === "1");
    await page.locator("#labelSheetPromptPrevBtn").click();
    await page.waitForFunction(() => document.querySelector("#labelSheetPromptPageSelectBottom")?.value === "0");
    if ((await page.locator("#labelSheetSamplePreset option").count()) !== 3 || (await page.locator("#labelSheetSamplePreset").inputValue()) !== "training-lunch") failures.push(`${label}: 정적판 식권 유형별 샘플 선택이 기본 교육생 식권을 포함하지 않습니다.`);
    await page.locator("#labelSheetPromptItemViewTab").click();
    if ((await page.locator("#labelSheetPromptItemSelect option").count()) !== 8) failures.push(`${label}: 정적판 첫 페이지의 개별 라벨 프롬프트가 분리되지 않았습니다.`);
    if (!(await visible("#labelSheetCopyAllPromptsBtn")) || !(await visible("#labelSheetCopyItemPromptBtn"))) failures.push(`${label}: 정적판 전체 페이지·개별 프롬프트 복사 기능이 숨겨졌습니다.`);
  }
  if (await page.locator("#paneLabelSheet .label-sheet-workspace-drawer:not([hidden])").count()) {
    await page.locator("#paneLabelSheet .label-sheet-workspace-drawer:not([hidden]) [data-label-workspace-drawer-close]").first().click();
    await page.waitForFunction(() => !document.querySelector("#paneLabelSheet .label-sheet-workspace-drawer:not([hidden])"));
  }
  if (viewport.width <= 860 && await page.locator("#labelSheetWorkspaceAppNavBtn").isVisible()) {
    await page.locator("#labelSheetWorkspaceAppNavBtn").click();
  }
  if (!(await visible("#tabBtnQrGenerator")) && await specialGroupFilter.isVisible()) {
    await specialGroupFilter.click();
  }
  const qrTabVisible = await visible("#tabBtnQrGenerator");
  if (!qrTabVisible) failures.push(`${label}: QR 탭이 보이지 않습니다.`);
  if (qrTabVisible) {
    await page.locator("#tabBtnQrGenerator").click();
    if (!(await visible("#paneQrGenerator"))) failures.push(`${label}: QR 탭 전환에 실패했습니다.`);
    await expectOnlyPane("paneQrGenerator", "QR 전환");
  }
  if (pageErrors.length) failures.push(`${label}: 페이지 오류: ${pageErrors.join(" | ")}`);
  if (failedScripts.length) failures.push(`${label}: 스크립트 로드 실패: ${failedScripts.join(" | ")}`);
  if (failedResponses.length) failures.push(`${label}: 리소스 응답 실패: ${failedResponses.join(" | ")}`);
  await page.close();
}

async function verifyCompactLabelViewport(label, viewport) {
  const page = await browser.newPage({ viewport });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.stack || error.message));
  await page.goto(origin, { waitUntil: "load" });
  await page.waitForFunction(() => Boolean(window.PromptDeckTabs));
  await page.evaluate(() => window.PromptDeckTabs.switchTab("labelSheet"));
  await page.waitForSelector("#paneLabelSheet[data-label-workspace-controller-ready='true']");
  await page.waitForTimeout(250);
  const layout = await page.evaluate(() => {
    const pane = document.querySelector("#paneLabelSheet");
    const paneBox = pane?.getBoundingClientRect();
    const canvasBox = document.querySelector(".label-sheet-workspace-canvas-column")?.getBoundingClientRect();
    const entry = document.querySelector("#labelSheetWorkspaceEntry");
    const entryBox = entry?.getBoundingClientRect();
    const mobileAction = document.querySelector("#mobileTabActions");
    const mobileActionStyle = mobileAction ? getComputedStyle(mobileAction) : null;
    const workflowBox = document.querySelector(".label-sheet-workspace-flowbar")?.getBoundingClientRect();
    const statusbarBox = document.querySelector(".label-sheet-workspace-statusbar")?.getBoundingClientRect();
    return {
      documentHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      headerDisplay: getComputedStyle(document.querySelector(".app-header")).display,
      paneBottom: paneBox?.bottom || 0,
      mobileActionHidden: Boolean(mobileAction?.hidden) && mobileActionStyle?.display === "none",
      workflowTop: workflowBox?.top || 0,
      workflowBottom: workflowBox?.bottom || 0,
      statusbarTop: statusbarBox?.top || 0,
      statusbarBottom: statusbarBox?.bottom || 0,
      canvasBottom: canvasBox?.bottom || 0,
      canvasWidth: canvasBox?.width || 0,
      entryVisible: Boolean(entry && !entry.hidden && entryBox?.width),
      entryWidth: entryBox?.width || 0,
      setupButtonHeight: document.querySelector("#labelSheetWorkspaceSetupStartBtn")?.getBoundingClientRect().height || 0,
      sampleButtonHeight: document.querySelector("#labelSheetWorkspaceSampleBtn")?.getBoundingClientRect().height || 0,
      bottomCollapsed: pane?.classList.contains("is-bottom-collapsed"),
      toolbarDisplay: getComputedStyle(document.querySelector("#labelSheetPreviewToolbar")).display,
      toolPanelVisibility: getComputedStyle(document.querySelector("#labelSheetWorkspaceToolPanel")).visibility,
      toolPanelAriaHidden: document.querySelector("#labelSheetWorkspaceToolPanel")?.getAttribute("aria-hidden"),
      toolPanelInert: document.querySelector("#labelSheetWorkspaceToolPanel")?.inert,
      inspectorAccess: getComputedStyle(document.querySelector("#labelSheetWorkspaceInspectorBtn")).display,
      inspectorAriaHidden: document.querySelector("#labelSheetWorkspaceInspector")?.getAttribute("aria-hidden"),
      inspectorInert: document.querySelector("#labelSheetWorkspaceInspector")?.inert,
      inspectorButtonHeight: document.querySelector("#labelSheetWorkspaceInspectorBtn")?.getBoundingClientRect().height || 0,
      toolsButtonHeight: document.querySelector("#labelSheetWorkspaceToolsBtn")?.getBoundingClientRect().height || 0,
      tabsBarDisplay: getComputedStyle(document.querySelector(".app-tabs-bar")).display,
    };
  });
  if (
    layout.documentHeight > layout.viewportHeight + 1
      || layout.headerDisplay !== "none"
      || layout.paneBottom > layout.viewportHeight + 1
      || !layout.mobileActionHidden
      || layout.statusbarTop < layout.canvasBottom - 1
      || layout.workflowTop < layout.statusbarBottom - 1
      || layout.workflowBottom > layout.paneBottom + 1
    || (layout.entryVisible
      ? layout.entryWidth < viewport.width - 32 || layout.setupButtonHeight < 44 || layout.sampleButtonHeight < 44
      : layout.canvasWidth < viewport.width - 75 || layout.inspectorButtonHeight < 44)
    || !layout.bottomCollapsed
    || layout.toolbarDisplay !== "none"
    || layout.toolPanelVisibility !== "hidden"
    || layout.toolPanelAriaHidden !== "true"
    || !layout.toolPanelInert
    || layout.inspectorAccess === "none"
    || layout.inspectorAriaHidden !== "true"
    || !layout.inspectorInert
    || layout.toolsButtonHeight < 44
    || layout.tabsBarDisplay !== "none"
  ) {
    failures.push(`${label}: 라벨·티켓 컴팩트 작업공간 배치가 깨졌습니다. ${JSON.stringify(layout)}`);
  }
  await page.locator("#labelSheetWorkspaceToolsBtn").click();
  await page.locator('[data-label-workspace-mobile-tool="project"]').click();
  await page.waitForFunction(() => {
    const panel = document.querySelector("#labelSheetWorkspaceToolPanel");
    const box = panel?.getBoundingClientRect();
    return document.querySelector("#paneLabelSheet")?.classList.contains("is-mobile-tool-panel-open")
      && getComputedStyle(panel).visibility === "visible"
      && box.left >= 0
      && box.right <= window.innerWidth + 1;
  });
  const openToolState = await page.evaluate(() => ({
    ariaHidden: document.querySelector("#labelSheetWorkspaceToolPanel")?.getAttribute("aria-hidden"),
    inert: document.querySelector("#labelSheetWorkspaceToolPanel")?.inert,
  }));
  if (openToolState.ariaHidden !== "false" || openToolState.inert) failures.push(`${label}: 열린 도구 패널이 탐색 대상에서 제외되었습니다.`);
  await page.evaluate(() => {
    const panel = document.querySelector("#labelSheetWorkspaceToolPanel");
    const controls = [...panel.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")]
      .filter((element) => !element.closest("[hidden], [aria-hidden='true'], [inert]") && element.getClientRects().length > 0);
    controls.at(-1)?.focus();
  });
  await page.keyboard.press("Tab");
  if (!(await page.evaluate(() => document.querySelector("#labelSheetWorkspaceToolPanel")?.contains(document.activeElement)))) {
    failures.push(`${label}: 도구 패널의 키보드 초점이 화면 뒤로 이탈했습니다.`);
  }
  await page.locator("#labelSheetWorkspaceSampleBtnMobile").click();
  await page.waitForFunction(() => document.querySelectorAll("#labelSheetRecordTableBody tr[data-record-id]").length >= 1);
  await page.waitForFunction(() => document.querySelector("#labelSheetWorkspaceEntry")?.hidden === true);
  await page.locator("#labelSheetWorkspaceToolPanelClose").click();
  await page.waitForFunction(() => {
    const panel = document.querySelector("#labelSheetWorkspaceToolPanel");
    return getComputedStyle(panel).visibility === "hidden" && panel.inert && panel.getAttribute("aria-hidden") === "true";
  });
  await page.locator("#labelSheetWorkspaceInspectorBtn").click();
  await page.waitForFunction(() => {
    const inspector = document.querySelector("#labelSheetWorkspaceInspector");
    const box = inspector?.getBoundingClientRect();
    return document.querySelector("#paneLabelSheet")?.classList.contains("is-mobile-inspector-open")
      && getComputedStyle(inspector).visibility === "visible"
      && !inspector.inert
      && inspector.getAttribute("aria-hidden") === "false"
      && box.left >= 0
      && box.right <= window.innerWidth + 1;
  });
  await page.evaluate(() => {
    const panel = document.querySelector("#labelSheetWorkspaceInspector");
    const controls = [...panel.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")]
      .filter((element) => !element.closest("[hidden], [aria-hidden='true'], [inert]") && element.getClientRects().length > 0);
    controls.at(-1)?.focus();
  });
  await page.keyboard.press("Tab");
  if (!(await page.evaluate(() => document.querySelector("#labelSheetWorkspaceInspector")?.contains(document.activeElement)))) {
    failures.push(`${label}: 속성 패널의 키보드 초점이 화면 뒤로 이탈했습니다.`);
  }
  await page.locator("#labelSheetWorkspaceToolsBtn").click();
  await page.locator('[data-label-workspace-mobile-tool="records"]').click();
  await page.waitForFunction(() => {
    const pane = document.querySelector("#paneLabelSheet");
    const drawer = document.querySelector("#labelSheetWorkspaceDataDrawer");
    return drawer?.dataset.open === "true"
      && !pane?.classList.contains("is-mobile-tool-panel-open")
      && !pane.classList.contains("is-mobile-inspector-open")
      && document.querySelector("#labelSheetWorkspaceInspector")?.inert;
  });
  await page.locator("#labelSheetWorkspaceDataDrawer [data-label-workspace-drawer-close]").first().click();
  await page.waitForSelector("#labelSheetWorkspaceDataDrawer", { state: "hidden" });
  await page.locator("#labelSheetWorkspaceInspectorBtn").click();
  await page.waitForFunction(() => document.querySelector("#paneLabelSheet")?.classList.contains("is-mobile-inspector-open"));
  await page.locator("#labelSheetWorkspaceInspector .label-sheet-workspace-mobile-inspector-close").click();
  await page.waitForFunction(() => {
    const inspector = document.querySelector("#labelSheetWorkspaceInspector");
    return getComputedStyle(inspector).visibility === "hidden" && inspector.inert && inspector.getAttribute("aria-hidden") === "true";
  });
  if (pageErrors.length) failures.push(`${label}: 페이지 오류: ${pageErrors.join(" | ")}`);
  await page.close();
}

try {
  await verifyViewport("wide desktop", { width: 1920, height: 800 });
  await verifyViewport("desktop", { width: 1440, height: 1000 });
  await verifyViewport("mobile", { width: 390, height: 844 });
  await verifyCompactLabelViewport("compact phone", { width: 375, height: 667 });
  await verifyCompactLabelViewport("compact landscape", { width: 844, height: 390 });

  const indexResponse = await fetch(`${origin}/`);
  const indexHtml = await indexResponse.text();
  for (const script of excludedStaticScripts) {
    if (indexHtml.includes(script)) failures.push(`index.html: 제외된 스크립트가 참조됩니다: ${script}`);
  }

  for (const pageName of [
    "privacy.html",
    "terms.html",
    "ai-policy.html",
    "copyright-policy.html",
    "third-party-notices.html",
  ]) {
    const response = await fetch(`${origin}/${pageName}`);
    const body = await response.text();
    if (!response.ok || body.includes("__OPERATOR_") || body.includes("__PRIVACY_")) {
      failures.push(`${pageName}: 공개 정보 치환에 실패했습니다.`);
    }
  }

  const adsTextResponse = await fetch(`${origin}/ads.txt`);
  const adsText = (await adsTextResponse.text()).trim();
  const expectedAdsText = "google.com, pub-4750696695053294, DIRECT, f08c47fec0942fa0";
  if (!adsTextResponse.ok || adsText !== expectedAdsText) {
    failures.push("ads.txt: AdSense 판매자 인증 레코드가 정확히 배포되지 않았습니다.");
  }

  const mixerSampleResponse = await fetch(`${origin}/outputs/mixer_samples/med-3d_0.jpg`);
  if (!mixerSampleResponse.ok || !String(mixerSampleResponse.headers.get("content-type") || "").includes("image/jpeg")) {
    failures.push("outputs/mixer_samples: 비주얼 믹서 샘플 이미지가 배포본에 포함되지 않았습니다.");
  }

  const adminResponse = await fetch(`${origin}/admin.html`, { redirect: "manual" });
  if (remoteOrigin) {
    if (adminResponse.status !== 302 || !String(adminResponse.headers.get("location") || "").includes("admin=locked")) {
      failures.push("admin.html: 인증되지 않은 운영 접근이 차단되지 않았습니다.");
    }
  } else if (adminResponse.status !== 200) {
    failures.push("admin.html: 정적 관리자 파일이 빌드되지 않았습니다.");
  }

  for (const privatePath of ["/.env", "/server/local-server.js", "/scripts/build-static.mjs"]) {
    const response = await fetch(`${origin}${privatePath}`);
    if (response.status !== 404) failures.push(`${privatePath}: 배포본에 포함되었습니다.`);
  }
} finally {
  await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`static smoke test passed (${origin}): wide desktop, desktop, mobile, script integrity, legal pages, mixer assets, private-file exclusions`);
}
