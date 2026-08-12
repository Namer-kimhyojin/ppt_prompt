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
    await page.waitForSelector("#tabBtnCommonPrompt", { state: "visible", timeout: 30_000 });
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
  const bodyText = await page.locator("body").innerText();
  if (bodyText.includes("공개 정적 버전 · 작업 내용과 로컬 이미지는 이 브라우저에만 저장됩니다.")) {
    failures.push(`${label}: 삭제된 정적 버전 안내 문구가 노출됩니다.`);
  }
  if (!(await visible("#tabBtnCommonPrompt"))) failures.push(`${label}: 기본 탭이 보이지 않습니다.`);
  if (await visible("#tabBtnSlideImage")) failures.push(`${label}: 서버 이미지 생성 탭이 노출됩니다.`);
  if (await visible("#userBar")) failures.push(`${label}: 계정 UI가 노출됩니다.`);

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
    if (!(await page.locator("#diagramDownloadSvgBtn").isEnabled())) failures.push(`${label}: 데이터 다이어그램 SVG 저장이 비활성화되었습니다.`);
    if (!(await page.locator("#diagramDownloadPngBtn").isEnabled())) failures.push(`${label}: 데이터 다이어그램 PNG 저장이 비활성화되었습니다.`);
    if (!(await page.locator("#diagramDownloadSpecBtn").isEnabled())) failures.push(`${label}: 데이터 다이어그램 JSON 저장이 비활성화되었습니다.`);
    if (await page.locator("#diagramSendSlideImageBtn").isEnabled()) failures.push(`${label}: 정적판에서 이미지 생성 연결이 활성화되었습니다.`);
    const diagramHint = await page.locator("#diagramProductionHint").textContent();
    if (!diagramHint.includes("로컬 서버판")) failures.push(`${label}: 이미지 생성 연결 비활성 사유가 노출되지 않습니다. (${diagramHint.trim()})`);
    if (viewport.width <= 720 && (await page.locator("#paneDataDiagram .diagram-step.is-open").count()) !== 1) failures.push(`${label}: 모바일 데이터 다이어그램 단계가 하나만 열리지 않았습니다.`);
  }
  const labelTabVisible = await visible("#tabBtnLabelSheet");
  if (!labelTabVisible) failures.push(`${label}: 라벨·티켓 제작 탭이 보이지 않습니다.`);
  if (labelTabVisible) {
    await page.locator("#tabBtnLabelSheet").click();
    if ((await page.locator("#labelSheetIntentPanel > .label-sheet-progress-row").count()) !== 1) failures.push(`${label}: 제작 단계가 목표 패널 상단에 배치되지 않았습니다.`);
    if ((await page.locator("#labelSheetIntentPanel > .label-sheet-progress-row").evaluate((element) => getComputedStyle(element).position)) === "sticky") failures.push(`${label}: 제작 단계가 앱 메뉴 위에 고정됩니다.`);
    await page.locator("#labelSheetOutputGoalPrompt").check();
    await page.locator('input[name="labelSheetIntentDocumentType"][value="meal-ticket"]').check();
    await page.locator("#labelSheetModeDuplex").check();
    await page.locator("#labelSheetIntentSampleBtn").click();
    await page.waitForFunction(() => document.querySelectorAll("#labelSheetRecordTableBody tr[data-record-id]").length === 8);
    await page.waitForFunction(() => document.querySelectorAll("#labelSheetPreviewSurface canvas").length === 1);
    await page.locator("#labelSheetToggleAllStepsBtn").click();
    await page.waitForFunction(() => document.querySelector("#paneLabelSheet")?.dataset.flowView === "all"
      && [...document.querySelectorAll("#paneLabelSheet details.label-sheet-step")].every((details) => details.open));
    await page.locator("#labelSheetQrAdvanced").evaluate((details) => { details.open = true; });
    await page.waitForFunction(() => window.PromptDeckLabelSheet.assetStore.list().filter((asset) => asset.filename.startsWith("기본-")).length >= 6, null, { timeout: 60_000 });
    if (!(await page.evaluate(() => Boolean(window.PromptDeckLabelSheetPackage && window.PromptDeckTabularData && window.QRGeneratorCore)))) failures.push(`${label}: 라벨 패키지·표 데이터·QR 공용 모듈이 누락되었습니다.`);
    if (!(await page.evaluate(() => typeof window.QRGeneratorCore?.getCurrentValue === "function"))) failures.push(`${label}: QR 생성기의 현재 값을 라벨에 전달하는 연결이 누락되었습니다.`);
    if ((await page.locator("#labelSheetRecordTable thead th").count()) !== 18 || !(await visible("#labelSheetRecordTable"))) failures.push(`${label}: 프롬프트 모드의 원본 데이터 검토·직접 편집 표가 누락되었습니다.`);
    if (await visible("#labelSheetQrAssignBtn") || await visible("#labelSheetQrUseCurrentBtn")) failures.push(`${label}: 프롬프트 설계에 실제 QR 값 배정 기능이 노출됩니다.`);
    if (!(await visible("#labelSheetQrResolvedPreview"))) failures.push(`${label}: 프롬프트 설계의 QR 예약 상태 확인이 숨겨졌습니다.`);
    if (await visible("#labelSheetGenerateMissingBtn")) failures.push(`${label}: 프롬프트 설계에서 라벨 AI 배경 생성이 노출됩니다.`);
    if (await visible("#labelSheetAssetRegisterBtn")) failures.push(`${label}: 프롬프트 설계에 실제 이미지 등록 절차가 노출됩니다.`);
    if (await visible("#labelSheetRestoreDefaultsBtn")) failures.push(`${label}: 프롬프트 설계에 실제 배경 복구 기능이 노출됩니다.`);
    if ((await page.locator("#labelSheetAssetList .label-sheet-asset-card").count()) < 6) failures.push(`${label}: 정적판 기본 배경 6종이 보관함에 등록되지 않았습니다.`);
    if (await visible("#labelSheetPageImageRegisterBtn")) failures.push(`${label}: 프롬프트 설계에 A4 배경 합성 절차가 노출됩니다.`);
    if (await visible("#labelSheetSavePackageBtn") || await visible("#labelSheetExportLayersBtn")) failures.push(`${label}: 프롬프트 설계에 완성물 패키지 기능이 노출됩니다.`);
    if (!(await visible("#labelSheetGeneratePromptBtn"))) failures.push(`${label}: 프롬프트 설계 핵심 생성 버튼이 숨겨졌습니다.`);
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
  if (!(await visible("#tabBtnQrGenerator")) && await specialGroupFilter.isVisible()) {
    await specialGroupFilter.click();
  }
  const qrTabVisible = await visible("#tabBtnQrGenerator");
  if (!qrTabVisible) failures.push(`${label}: QR 탭이 보이지 않습니다.`);
  if (qrTabVisible) {
    await page.locator("#tabBtnQrGenerator").click();
    if (!(await visible("#paneQrGenerator"))) failures.push(`${label}: QR 탭 전환에 실패했습니다.`);
  }
  if (pageErrors.length) failures.push(`${label}: 페이지 오류: ${pageErrors.join(" | ")}`);
  if (failedScripts.length) failures.push(`${label}: 스크립트 로드 실패: ${failedScripts.join(" | ")}`);
  if (failedResponses.length) failures.push(`${label}: 리소스 응답 실패: ${failedResponses.join(" | ")}`);
  await page.close();
}

try {
  await verifyViewport("desktop", { width: 1440, height: 1000 });
  await verifyViewport("mobile", { width: 390, height: 844 });

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
  console.log(`static smoke test passed (${origin}): desktop, mobile, script integrity, legal pages, mixer assets, private-file exclusions`);
}
