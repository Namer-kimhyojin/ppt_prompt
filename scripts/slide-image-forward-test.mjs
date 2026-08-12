import fs from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const projectRoot = process.cwd();
const outputRoot = path.resolve(projectRoot, process.argv[2] || "artifacts/promptdeck-forward-test");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const testSpecification = `---
promptdeck_contract: 3.6
skill_preset_contract: 1.0
---

# 발표 맥락 〔화면 비표시·모든 슬라이드 전달〕

- 발표 대상: 경상북도 지자체 관계자
- 청중 수준: 정책 의사결정자
- 발표 목적: 경상북도 이차전지 산업의 차별적 기반과 집적 성과 보고
- 발표 시간: 15분
- 발표 후 원하는 판단 또는 행동: 소재·순환 공급망 연결을 다음 정책 우선순위로 판단
- 청중의 현재 인식: 생산시설과 투자 규모 중심으로 산업 경쟁력을 이해
- 발표 후 목표 인식: 소재·수출·순환 연결성이 지역 경쟁력의 핵심이라고 판단
- 핵심 인식 장벽: 개별 지표와 공급망 구조가 하나의 경쟁력으로 연결되어 보이지 않음
- Governing Thought: 경북의 경쟁력은 생산량보다 소재·수출·순환 공급망의 연결성에서 강화

# 세션 설계 〔화면 비표시·모든 슬라이드 전달〕

## 세션 1. 집적 기반 · 슬라이드 01–02
- 세션 역할: 공급망 구조와 집적 성과 증명
- 청중의 핵심 질문: 경북 이차전지 산업의 차별점은 무엇인가?
- 세션 결론: 소재·순환 연결성과 수출 집적이 경북의 차별적 기반
- 다음 세션 연결: 집적 기반 확인 → 정책 우선순위 검토

## 슬라이드 01. 소재·순환 경쟁력

### 양식 〔화면 비표시·전체 캔버스〕

- 프레임 방식: 반복 헤더·푸터 슬롯 없이 전체 캔버스를 콘텐츠와 키 비주얼에 사용

### 핵심 주제·목적 〔화면 비표시〕

- 핵심 주제: 공급망 연결성
- 한눈 논지: 이 장은 생산시설 나열이 아니라 소재에서 순환으로 이어지는 연결 구조가 경북의 차별점임을 예고한다.
- 슬라이드 목적: 새 세션의 판단 기준 제시
- 청중 질문: 어떤 구조가 개별 투자를 지역 경쟁력으로 연결하는가?
- 인식 변화: 개별 생산시설 → 연결된 소재·순환 구조
- 핵심 장벽: 저밀도 페이지가 작은 제목과 빈 배경으로 약하게 보일 위험
- 목표 판단 또는 행동: 다음 데이터 장을 공급망 연결성의 증거로 해석
- 핵심 근거의 역할: 단일 순환 모티프가 새 세션의 분석 관점을 예고
- 세션 연결: 생산 규모 중심 인식 → 연결성 질문 → 집적 성과 확인

### 콘텐츠 〔화면 표시〕

- 파트명: 소재·순환 경쟁력
- 전환 문구: 광물에서 재활용까지 이어지는 연결 구조

### 표현 방식 〔화면 비표시〕

- 페이지 유형: 간지
- 정보 밀도: C1
- 데이터 시각화 강도: V0
- 비주얼 존재감: 강한 주도형
- 구성 위임 수준: 의미만 고정
- 잠금 항목: 표시 문구·사실·의미 관계
- 가이드 항목: 핵심 강조 대상·읽기 우선순위
- 자유 항목: 레이아웃 계열·매체·표면·이미지 처리
- 구성 잠금 이유: 해당 없음 — 의미와 사실만 고정
- 프리셋 적용 범위: 레이아웃 계열·매체·타이포 행동·표면
- 설정 반영: 표시 문구는 두 줄 이내로 제한하고 비데이터 비주얼을 주 언어로 사용
- 비주얼 논증: 원료에서 재활용으로 되돌아오는 연결과 순환
- 큰 레이아웃: 단일 순환 모티프가 화면의 주 영역을 차지하고 파트명과 전환 문구는 하나의 보호 영역에서 긴장 관계 형성
- 구도와 시선 흐름: 단일 모티프 → 파트명 → 전환 문구
- 정보 위계: 1순위 파트명 → 2순위 순환 모티프 → 3순위 전환 문구
- 핵심 강조 대상: 파트명
- 강조 설계: 큰 스케일·국부 대비·집중 여백으로 새 세션의 첫인상 형성
- 시각 언어와 레이어: 산업 소재의 질감과 순환 궤적을 결합한 다중 레이어 비주얼
- 여백과 리듬: 넓은 여백으로 단일 초점을 보호하고 작은 장식 요소는 추가하지 않음
- AI 조정 범위: 큰 레이아웃·시선 흐름·위계는 유지하고 정확한 크기·좌표·간격·크롭·중첩·화풍은 최적화

### 품질 조건 〔화면 비표시〕

- 사실 고정: 양식과 콘텐츠에 정의된 문자열만 사용
- 허용 해석: 일반적인 이차전지 소재와 재활용의 연결 개념
- 해석 경계: 특정 기업·시설·성과·생산량을 사실처럼 추가하지 않음
- 맥락 이미지의 지위: 설명용 개념 자원
- 품질 취약점: 한글 철자·임의 문자·작은 장식의 과잉
- 출력 품질: 제작 표식을 숨기고 글자와 형태를 전면 블러 없이 선명하게 마감
- 논지 선명도: 파트명과 단일 순환 모티프만으로 새 세션의 관점이 즉시 이해되게 구성
- 화면 어조: 표시 문구는 서술형 종결 없이 개조식으로 표현

## 슬라이드 02. 해솔 수출 이차전지 비중, 1%에서 38.5%로 확대

### 양식 〔화면 표시·헤더/푸터〕

- 헤더 1단계 파트: II. 경북의 기반
- 헤더 2단계 제목: 2. 집적 성과
- 헤더 3단계 부제: 가. 수출·투자·고용의 동시 확대
- 푸터 출처: 경상북도·해솔시 제공자료 재구성
- 푸터 주석: 투자·고용은 예정 포함

### 핵심 주제·목적 〔화면 비표시〕

- 핵심 주제: 이차전지 산업 집적 성과
- 한눈 논지: 해솔 수출에서 이차전지 비중이 크게 확대됐고 생산·투자·고용 지표가 산업 집적을 함께 뒷받침한다.
- 슬라이드 목적: 수출 비중 변화와 보조 지표로 집적 성과 증명
- 청중 질문: 공급망 연결이 실제 산업 집적으로 이어졌는가?
- 인식 변화: 개별 기업 투자 → 수출·생산·투자·고용의 동시 집적
- 핵심 장벽: 여러 지표가 같은 강도로 나열되어 결론이 흐려질 위험
- 목표 판단 또는 행동: 수출 비중 변화를 대표 증거로, 나머지 지표를 집적 기반의 보조 증거로 판단
- 핵심 근거의 역할: 전후 비교가 변화의 크기를, 세 보조 지표가 산업 기반을 설명
- 세션 연결: 연결 구조 제시 → 집적 성과 증명 → 정책 우선순위 검토

### 콘텐츠 〔화면 표시〕

- 주장 헤드라인: 해솔 수출 이차전지 비중, 1%에서 38.5%로 확대
- 비교 기준 1: 2015년 1%
- 비교 기준 2: 2023년 38.5%
- 보조 근거 1: 2025년 양극재 생산체계 연 27만 톤
- 보조 근거 2: 해솔 투자·예정 4.9조 원
- 보조 근거 3: 고용 예정 포함 3,700명

### 표현 방식 〔화면 비표시〕

- 페이지 유형: 본문
- 정보 밀도: C3
- 데이터 시각화 강도: V2
- 비주얼 존재감: 구조 중심형
- 구성 위임 수준: 의미만 고정
- 잠금 항목: 표시 문구·수치·사실·증거 지위·의미 관계
- 가이드 항목: 핵심 강조 대상·읽기 우선순위·정보 위계
- 자유 항목: 레이아웃 계열·매체·시각 은유·크롭·레이어
- 구성 잠금 이유: 해당 없음 — 의미와 데이터 정직성만 고정
- 프리셋 적용 범위: 레이아웃 계열·공간 실루엣·매체·타이포 행동·이미지 처리
- 설정 반영: 전후 비교를 주 증거로 두고 세 보조 지표는 한 단계 낮은 위계로 유지
- 비주얼 논증: 2015년과 2023년의 직접 비교를 중심으로 생산·투자·고용 지표 연결
- 큰 레이아웃: 전후 비교가 주 영역을 차지하고 세 보조 지표가 하나의 근거군으로 받치는 비대칭 주–보조 구성
- 구도와 시선 흐름: 주장 헤드라인 → 전후 비교 → 보조 지표군 → 출처
- 정보 위계: 1순위 38.5% → 2순위 1%에서 38.5% 변화 → 3순위 생산·투자·고용 지표
- 핵심 강조 대상: 38.5%
- 강조 설계: 가장 큰 스케일과 역할색 대비로 변화의 종착값을 즉시 인지
- 시각 언어와 레이어: 데이터 타이포그래피와 간단 비교를 주 언어로, 산업 맥락 레이어를 보조로 사용
- 여백과 리듬: 주 비교 주변은 넓게 비우고 보조 지표는 가까운 한 그룹으로 정리
- AI 조정 범위: 큰 레이아웃·시선 흐름·위계는 유지하고 정확한 크기·좌표·간격·크롭·중첩·화풍은 최적화

### 품질 조건 〔화면 비표시〕

- 사실 고정: 양식과 콘텐츠에 정의된 문자열·수치·단위·연도만 사용
- 허용 해석: 수출 비중 확대와 보조 지표가 산업 집적을 함께 설명
- 해석 경계: 예정 수치를 달성 실적으로 표현하지 않고 인과관계를 추가하지 않음
- 데이터 정직성: 2015년과 2023년을 같은 기준으로 비교하고 1%와 38.5%의 비율을 왜곡하지 않음
- 맥락 이미지의 지위: 일반 산업 맥락 보조
- 품질 취약점: 38.5% 소수점·27만 톤·4.9조 원·3,700명·연도·한글 철자
- 출력 품질: 같은 문구를 중복하지 않고 제작 표식을 숨기며 글자·수치·도형을 전면 블러 없이 선명하게 마감
- 논지 선명도: 주장 헤드라인과 전후 비교만으로 발표자 설명 없이 같은 결론에 도달하도록 구성
- 화면 어조: 표시 문구는 서술형 종결 없이 병렬 개조식으로 표현
`;

function startStaticServer(rootDir) {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const filePath = path.join(rootDir, pathname);
    if (!existsSync(filePath)) {
      response.statusCode = 404;
      response.end("Not found");
      return;
    }
    response.setHeader("Content-Type", MIME_TYPES[path.extname(filePath)] || "application/octet-stream");
    createReadStream(filePath).pipe(response);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((done, reject) => server.close((error) => (error ? reject(error) : done()))),
      });
    });
  });
}

async function launchBrowser() {
  try {
    return { browser: await chromium.launch({ channel: "msedge", headless: true }), channel: "msedge" };
  } catch (_) {
    return { browser: await chromium.launch({ headless: true }), channel: "chromium" };
  }
}

const server = await startStaticServer(projectRoot);
const { browser, channel } = await launchBrowser();

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await page.goto(server.baseUrl, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.PromptDeckCommonPrompt && window.PromptDeckSlidePromptGenerator);
  await page.click('.cpd-journey-header [data-action="open-quick-setup-modal"]');
  await page.waitForSelector("#cpdQuickSetupDialog", { state: "visible" });
  await page.click('[data-journey-profile="inform"]');
  await page.click('#cpdQuickSetupDialog .cpd-dialog-close[data-action="close-quick-setup-modal"]');
  await page.waitForSelector("#cpdQuickSetupDialog", { state: "hidden" });
  const selectedProfile = await page.evaluate(() => window.PromptDeckCommonPrompt.getState().journey?.profileId);
  if (selectedProfile !== "inform") throw new Error(`Common-prompt quick profile was not applied: ${selectedProfile || "none"}`);
  await page.evaluate(() => window.PromptDeckCommonPrompt.sendToGenerator());
  await page.click("#tabBtnGenerator");
  await page.waitForSelector("#paneGenerator.active");
  await page.waitForFunction(() => window.PromptDeckSlidePromptGenerator.getCommonPromptPackage().source === "common-prompt-builder");
  await page.locator("#genMdInput").fill(testSpecification);
  await page.click("#genGenerateBtn");
  await page.waitForFunction(() => window.PromptDeckSlidePromptGenerator.getRecords().length === 2);

  const result = await page.evaluate(() => ({
    commonPrompt: window.PromptDeckSlidePromptGenerator.getCommonPromptPackage(),
    records: window.PromptDeckSlidePromptGenerator.getRecords(),
  }));

  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(path.join(outputRoot, "test-specification.md"), testSpecification, "utf8");
  await fs.writeFile(path.join(outputRoot, "prompt-package.json"), JSON.stringify(result, null, 2), "utf8");
  for (const record of result.records) {
    const filename = `slide-${record.slideNo}-${record.pageType}.md`;
    await fs.writeFile(path.join(outputRoot, filename), record.prompt, "utf8");
  }

  console.log(JSON.stringify({
    browser: channel,
    outputRoot,
    commonPromptSource: result.commonPrompt.source,
    contractVersion: result.commonPrompt.contractVersion,
    designPackageSchema: result.commonPrompt.designPackage?.schemaVersion,
    commonPromptLength: result.commonPrompt.text.length,
    records: result.records.map((record) => ({
      slideNo: record.slideNo,
      pageType: record.pageType,
      generationPath: record.generationPath,
      generationReason: record.generationPlan?.reasonKo,
      visualPresence: record.visualPresence?.key,
      commonPromptApplied: record.commonPromptApplied,
      promptLength: record.prompt.length,
    })),
  }, null, 2));
} finally {
  await browser.close();
  await server.close();
}
