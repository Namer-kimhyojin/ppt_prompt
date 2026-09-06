(function () {
  "use strict";

  const PREVIEW_ROOT = "assets/document-design-previews";
  const BASE_FONTS = Object.freeze({
    public: { label: "공공 문서", heading: "Noto Sans KR", body: "Noto Sans KR", fallback: "Arial, sans-serif" },
    corporate: { label: "기업 보고", heading: "Pretendard", body: "Pretendard", fallback: "Arial, sans-serif" },
    editorial: { label: "에디토리얼", heading: "Noto Serif KR", body: "Pretendard", fallback: "Georgia, serif" },
    technical: { label: "기술 문서", heading: "IBM Plex Sans KR", body: "Pretendard", fallback: "Arial, sans-serif" },
    warm: { label: "친근한 안내", heading: "Noto Sans KR", body: "Noto Sans KR", fallback: "Arial, sans-serif" },
  });

  const base = {
    typography: { fontPreset: "corporate", headingSizePt: 25, bodySizePt: 11, footnoteSizePt: 8.5, headingWeight: 700, bodyWeight: 400, lineHeightPercent: 155, letterSpacingEm: -0.015 },
    layout: { density: "balanced", grid: "12열 모듈 그리드", marginMm: 18, marginTopMm: 18, marginRightMm: 18, marginBottomMm: 18, marginLeftMm: 18, paragraphGapPt: 7, sectionGapPt: 18, headerDistanceMm: 10, footerDistanceMm: 10, header: true, footer: true },
    hierarchy: { levels: 4, method: "크기·굵기·여백을 함께 사용", headlineStyle: "결론형 문장", numbering: "1. / 1.1 / 1.1.1", emphasis: "강조색과 굵기", alignment: "왼쪽 정렬" },
    tableRules: { style: "얇은 가로선 중심", headerStyle: "주색 배경과 반전 글자", borderStyle: "바깥선 없음·내부 가로선", stripeRows: false, repeatHeader: true, numericAlignment: "오른쪽 정렬", cellPaddingMm: 2.5, maxColumns: 8, showUnits: true, showSource: true },
    chartRules: { preferredType: "막대 차트", colorMode: "주색 계열 + 강조색 1개", dataLabels: "핵심 값만 직접 표시", legend: "상단", gridlines: "주요 가로선만", sortOrder: "의미 있는 순서 또는 내림차순", zeroBaseline: true, threeD: false, showUnits: true, showSource: true },
    components: { cover: true, toc: true, sectionDividers: true, pageNumber: true, table: true, chart: true, images: "필요할 때만 근거 이미지 사용" },
  };

  const CATEGORY_PROFILES = Object.freeze({
    public: {
      hierarchy: { levels: 4, method: "크기·굵기·여백을 함께 사용", headlineStyle: "명사형 주제", numbering: "□ / ○ / -", emphasis: "옅은 색상 면과 왼쪽 선" },
      tableRules: { style: "머리행 색상 띠와 최소 선", headerStyle: "옅은 주색 면과 진한 글자", borderStyle: "세로선 없이 행 그룹 구분", repeatHeader: true },
      chartRules: { preferredType: "막대 차트", colorMode: "주색 계열 + 강조색 1개", dataLabels: "핵심 값만 직접 표시", gridlines: "주요 가로선만" },
    },
    business: {
      hierarchy: { levels: 4, method: "크기와 번호 체계를 중심으로 구분", headlineStyle: "결론형 문장", numbering: "1. / 1.1 / 1.1.1", emphasis: "강조색과 굵기" },
      tableRules: { style: "얇은 가로선 중심", headerStyle: "주색 배경과 반전 글자", borderStyle: "머리행·합계행만 선 사용", stripeRows: false },
      chartRules: { preferredType: "막대·선 복합 차트", colorMode: "주색 계열 + 강조색 1개", dataLabels: "핵심 값만 직접 표시", legend: "상단" },
    },
    technical: {
      hierarchy: { levels: 5, method: "크기와 번호 체계를 중심으로 구분", headlineStyle: "결론형 문장", numbering: "1 / 1.1 / 1.1.1 / (1)", emphasis: "굵기와 크기만 사용" },
      tableRules: { style: "재무표형 숫자 중심", headerStyle: "배경 없이 굵은 글자와 아래선", borderStyle: "얇은 전체 격자", numericAlignment: "소수점 기준 정렬", maxColumns: 10 },
      chartRules: { preferredType: "막대·선 복합 차트", colorMode: "증감이 드러나는 발산 색상", dataLabels: "최댓값·최솟값만 표시", legend: "그래프 안 직접 표기" },
    },
    simple: {
      hierarchy: { levels: 3, method: "최소한의 굵기와 여백만 사용", headlineStyle: "단계 번호와 행동형 제목", numbering: "01 / 02 / 03", emphasis: "밑줄과 번호 표식" },
      tableRules: { style: "행 줄무늬와 옅은 외곽선", headerStyle: "옅은 주색 면과 진한 글자", borderStyle: "바깥선 없음·내부 가로선", stripeRows: true, maxColumns: 6 },
      chartRules: { preferredType: "막대 차트", colorMode: "단색 명도 단계", dataLabels: "모든 값 직접 표시", legend: "범례 사용 안 함", gridlines: "눈금선 사용 안 함" },
    },
    creative: {
      hierarchy: { levels: 3, method: "색상 블록과 위치를 중심으로 구분", headlineStyle: "질문형 제목과 답변형 부제", numbering: "PART / 01 / 02", emphasis: "옅은 색상 면과 왼쪽 선" },
      tableRules: { style: "얇은 가로선 중심", headerStyle: "강조색 위쪽 선과 흰 배경", borderStyle: "머리행·합계행만 선 사용", maxColumns: 6 },
      chartRules: { preferredType: "선 차트", colorMode: "범주마다 구분되는 색상", dataLabels: "핵심 값만 직접 표시", legend: "그래프 안 직접 표기", gridlines: "기준선 하나만" },
    },
  });

  function theme(definition) {
    const categoryProfile = CATEGORY_PROFILES[definition.category] || {};
    const typography = { ...base.typography, ...definition.typography };
    const preset = BASE_FONTS[typography.fontPreset] || BASE_FONTS.corporate;
    typography.headingFamily = definition.typography?.headingFamily || preset.heading;
    typography.bodyFamily = definition.typography?.bodyFamily || preset.body;
    typography.fallback = definition.typography?.fallback || preset.fallback;
    return Object.freeze({
      ...definition,
      typography: Object.freeze(typography),
      layout: Object.freeze({ ...base.layout, ...definition.layout }),
      hierarchy: Object.freeze({ ...base.hierarchy, ...(categoryProfile.hierarchy || {}), ...definition.hierarchy }),
      tableRules: Object.freeze({ ...base.tableRules, ...(categoryProfile.tableRules || {}), ...definition.tableRules }),
      chartRules: Object.freeze({ ...base.chartRules, ...(categoryProfile.chartRules || {}), ...definition.chartRules }),
      components: Object.freeze({ ...base.components, ...definition.components }),
      previews: Object.freeze({
        cover: `${PREVIEW_ROOT}/${definition.id}-cover.png?v=1`,
        content: `${PREVIEW_ROOT}/${definition.id}-content.png?v=1`,
        data: `${PREVIEW_ROOT}/${definition.id}-data.png?v=1`,
      }),
    });
  }

  const themes = Object.freeze([
    theme({
      id: "public-brief", nameKo: "공공 정책 브리프", category: "public", categoryLabel: "공공·정책", sourceVisualStyleId: "government-policy",
      description: "공식성과 가독성을 갖춘 정책·행정 보고 문법", bestFor: "정책보고 · 기관 계획 · 결과보고",
      palette: { primary: "#17375E", secondary: "#486581", accent: "#C78A2C", background: "#F7F9FC", surface: "#FFFFFF", text: "#172033", muted: "#5F6B7A", border: "#CBD5E1" },
      typography: { fontPreset: "public", headingSizePt: 23, bodySizePt: 10.5 },
      layout: { density: "balanced", grid: "단일 본문 + 근거 열", marginMm: 20 },
      signatureRules: ["□·○·※ 위계를 일관되게 사용", "결론과 확인 근거를 분리"], avoidRules: ["근거 없는 장식 아이콘", "과도한 그라데이션"],
    }),
    theme({
      id: "executive-summary", nameKo: "경영진 요약", category: "business", categoryLabel: "기업·전략", sourceVisualStyleId: "korea-enterprise-report",
      description: "결론과 의사결정 항목을 첫 화면에 집중", bestFor: "CEO 보고 · 경영회의 · 사업 검토",
      palette: { primary: "#102A43", secondary: "#486581", accent: "#E09F3E", background: "#F5F7FA", surface: "#FFFFFF", text: "#102A43", muted: "#627D98", border: "#BCCCDC" },
      typography: { fontPreset: "corporate", headingSizePt: 27, bodySizePt: 11 },
      layout: { density: "compact", grid: "결론 1 + 근거 3열", marginMm: 17 },
      signatureRules: ["페이지 상단에 결론형 헤드라인", "조치·담당·기한을 한 묶음으로 표시"], avoidRules: ["긴 서론", "의미 없는 수식어"],
    }),
    theme({
      id: "consulting-strategy", nameKo: "컨설팅 전략", category: "business", categoryLabel: "기업·전략", sourceVisualStyleId: "consulting-strategy",
      description: "핵심 메시지에서 근거와 시사점으로 이어지는 구조", bestFor: "전략보고 · 변화관리 · 실행계획",
      palette: { primary: "#12315B", secondary: "#4F6F8F", accent: "#00A0A8", background: "#F8FAFC", surface: "#FFFFFF", text: "#111827", muted: "#5F6B7A", border: "#D0D7E2" },
      typography: { fontPreset: "corporate", headingSizePt: 25, bodySizePt: 10.5 },
      layout: { density: "compact", grid: "논점·근거 MECE 그리드", marginMm: 17 },
      signatureRules: ["한 페이지에 하나의 주장", "중복 없는 근거 그룹"], avoidRules: ["결론 없는 차트", "균등 강조"],
    }),
    theme({
      id: "proposal-win", nameKo: "수주 제안", category: "business", categoryLabel: "기업·전략", sourceVisualStyleId: "korea-bid-proposal",
      description: "요구사항, 해결안, 수행체계를 평가 관점으로 연결", bestFor: "입찰 제안 · 용역 계획 · 수행계획",
      palette: { primary: "#153E75", secondary: "#2B6CB0", accent: "#F6AD55", background: "#F7FAFC", surface: "#FFFFFF", text: "#1A202C", muted: "#5A6778", border: "#CBD5E0" },
      typography: { fontPreset: "corporate", headingSizePt: 25, bodySizePt: 10.5, headingWeight: 800 },
      layout: { density: "balanced", grid: "평가항목 대응 2열", marginMm: 17 },
      signatureRules: ["요구사항과 대응 방안을 같은 화면에서 연결", "차별성과 증빙을 인접 배치"], avoidRules: ["검증 불가능한 최상급 표현", "장식용 프로세스"],
    }),
    theme({
      id: "research-policy", nameKo: "연구·정책 보고", category: "public", categoryLabel: "공공·정책", sourceVisualStyleId: "korea-education-research",
      description: "연구 방법, 근거, 분석 결과와 출처를 안정적으로 표현", bestFor: "연구보고 · 실태조사 · 정책 제언",
      palette: { primary: "#234E52", secondary: "#4A6F73", accent: "#D69E2E", background: "#FAFAF7", surface: "#FFFFFF", text: "#1F2933", muted: "#66737F", border: "#CED7D3" },
      typography: { fontPreset: "editorial", headingSizePt: 22, bodySizePt: 10.5, lineHeightPercent: 165 },
      layout: { density: "airy", grid: "본문 + 주석·출처 열", marginMm: 22 },
      signatureRules: ["방법·결과·해석을 구분", "표와 그림에 번호·제목·출처 표시"], avoidRules: ["출처 없는 수치", "본문을 대신하는 장식 이미지"],
    }),
    theme({
      id: "technology-industry", nameKo: "기술·산업 분석", category: "technical", categoryLabel: "기술·데이터", sourceVisualStyleId: "scientific-infographic",
      description: "기술 구조와 산업 흐름을 정밀한 도식으로 설명", bestFor: "R&D 보고 · 산업분석 · 기술 로드맵",
      palette: { primary: "#0B5CAD", secondary: "#397A89", accent: "#E67E22", background: "#F8FBFD", surface: "#FFFFFF", text: "#102A43", muted: "#5B7083", border: "#C9D9E5" },
      typography: { fontPreset: "technical", headingSizePt: 24, bodySizePt: 10.5 },
      layout: { density: "balanced", grid: "구조도 + 설명 패널", marginMm: 18 },
      signatureRules: ["구성요소와 관계 동사를 함께 표시", "현재·목표 기술수준을 구분"], avoidRules: ["임의의 기술 수치", "과장된 3D 효과"],
    }),
    theme({
      id: "data-evidence", nameKo: "데이터·근거 중심", category: "technical", categoryLabel: "기술·데이터", sourceVisualStyleId: "data-storytelling",
      description: "핵심 수치와 비교 기준을 먼저 읽히게 구성", bestFor: "성과보고 · KPI · 시장·재무 분석",
      palette: { primary: "#1E3A5F", secondary: "#3B82A0", accent: "#F59E0B", background: "#F7FAFC", surface: "#FFFFFF", text: "#172033", muted: "#667085", border: "#D4DCE6" },
      typography: { fontPreset: "corporate", headingSizePt: 24, bodySizePt: 10, headingWeight: 750 },
      layout: { density: "compact", grid: "KPI 4열 + 차트 8열", marginMm: 16 },
      signatureRules: ["수치 옆에 기준·기간·단위를 표시", "차트 제목을 결론형 문장으로 작성"], avoidRules: ["3D 차트", "축을 왜곡한 비교"],
    }),
    theme({
      id: "minimal-office", nameKo: "미니멀 오피스", category: "simple", categoryLabel: "간결·안내", sourceVisualStyleId: "minimal-report",
      description: "넓은 여백과 얇은 구분선으로 내용에 집중", bestFor: "내부 문서 · 회의자료 · 짧은 보고",
      palette: { primary: "#172033", secondary: "#667085", accent: "#2563EB", background: "#FFFFFF", surface: "#F5F7FA", text: "#111827", muted: "#667085", border: "#D8DEE8" },
      typography: { fontPreset: "corporate", headingSizePt: 24, bodySizePt: 11 },
      layout: { density: "airy", grid: "단일 열 + 넓은 여백", marginMm: 23 },
      signatureRules: ["핵심 제목·본문·주석의 3단 위계", "색상 강조는 한 페이지 두 곳 이내"], avoidRules: ["카드 과다 중첩", "두꺼운 테두리"],
    }),
    theme({
      id: "editorial-premium", nameKo: "프리미엄 에디토리얼", category: "creative", categoryLabel: "브랜드·콘텐츠", sourceVisualStyleId: "modern-editorial",
      description: "대형 제목과 비대칭 여백으로 읽는 리듬을 형성", bestFor: "브랜드북 · 트렌드 리포트 · 기획서",
      palette: { primary: "#1F2933", secondary: "#52606D", accent: "#C05640", background: "#F8F3EA", surface: "#FFFDFC", text: "#202124", muted: "#6B625B", border: "#D9CFC3" },
      typography: { fontPreset: "editorial", headingSizePt: 29, bodySizePt: 10.5, lineHeightPercent: 170 },
      layout: { density: "airy", grid: "비대칭 5:7 에디토리얼", marginMm: 21 },
      signatureRules: ["대형 제목과 짧은 캡션 대비", "이미지는 맥락을 전달하는 한 장만 크게 사용"], avoidRules: ["여러 이미지의 무작위 콜라주", "본문 가독성을 해치는 장식 글꼴"],
    }),
    theme({
      id: "education-guide", nameKo: "교육·매뉴얼", category: "simple", categoryLabel: "간결·안내", sourceVisualStyleId: "flat-design",
      description: "순서, 화면, 주의사항을 단계별로 쉽게 안내", bestFor: "이용안내 · 교육자료 · 업무 매뉴얼",
      palette: { primary: "#275DAD", secondary: "#3F7CAC", accent: "#F2A65A", background: "#F5F8FC", surface: "#FFFFFF", text: "#18324A", muted: "#5C7080", border: "#C8D6E5" },
      typography: { fontPreset: "warm", headingSizePt: 25, bodySizePt: 11.5, lineHeightPercent: 165 },
      layout: { density: "balanced", grid: "단계 카드 + 화면 예시", marginMm: 19 },
      signatureRules: ["한 단계에 하나의 행동", "주의사항을 실행 단계 바로 옆에 배치"], avoidRules: ["설명 없는 아이콘", "한 화면에 과도한 단계"],
    }),
    theme({
      id: "warm-human", nameKo: "사람 중심 스토리", category: "creative", categoryLabel: "브랜드·콘텐츠", sourceVisualStyleId: "paper-cut",
      description: "따뜻한 색과 사례 중심 구성으로 공감과 이해를 도움", bestFor: "사례집 · 사회가치 · 조직문화 안내",
      palette: { primary: "#5B4B3A", secondary: "#8A6F50", accent: "#E67E5F", background: "#FCF7EF", surface: "#FFFFFF", text: "#352F2A", muted: "#766B61", border: "#E3D3C1" },
      typography: { fontPreset: "warm", headingSizePt: 25, bodySizePt: 11.5, lineHeightPercent: 170 },
      layout: { density: "airy", grid: "사례 이미지 + 이야기 열", marginMm: 21 },
      signatureRules: ["사례와 실제 인용을 맥락과 함께 제시", "둥근 표면과 충분한 호흡 사용"], avoidRules: ["대상을 희화화한 일러스트", "근거 없는 감성 문구"],
    }),
    theme({
      id: "dark-innovation", nameKo: "다크 이노베이션", category: "technical", categoryLabel: "기술·데이터", sourceVisualStyleId: "dark-tech",
      description: "어두운 바탕과 선명한 강조색으로 미래 기술을 구조화", bestFor: "AI 전략 · 신기술 제안 · 디지털 비전",
      palette: { primary: "#38BDF8", secondary: "#7C8FA6", accent: "#00E5C3", background: "#07111F", surface: "#0F2033", text: "#F2F7FC", muted: "#A7B5C5", border: "#28405A" },
      typography: { fontPreset: "technical", headingSizePt: 27, bodySizePt: 10.5, headingWeight: 750 },
      layout: { density: "balanced", grid: "기술 스택 + 신호 패널", marginMm: 18 },
      signatureRules: ["발광색은 핵심 경로와 수치에만 사용", "다크 배경에서도 인쇄 대체안을 명시"], avoidRules: ["네온 효과 남용", "낮은 대비의 회색 본문"],
    }),
  ]);

  const documentKinds = Object.freeze([
    { id: "business-report", label: "업무보고서", flow: "요약 → 현황 → 핵심 이슈 → 근거 → 조치사항" },
    { id: "business-plan", label: "사업계획서", flow: "배경 → 목표 → 전략 → 일정·예산 → 성과지표" },
    { id: "proposal", label: "제안서", flow: "문제 → 해결안 → 차별성 → 수행계획 → 기대효과" },
    { id: "policy-research", label: "정책·연구보고서", flow: "요약 → 방법 → 분석 → 시사점 → 출처" },
    { id: "presentation", label: "발표자료", flow: "맥락 → 핵심 메시지 → 근거 → 실행 → 결론" },
    { id: "manual", label: "매뉴얼·가이드", flow: "준비 → 단계별 행동 → 화면 예시 → 주의 → 점검" },
    { id: "meeting-results", label: "회의·결과자료", flow: "안건 → 논의 → 결정 → 담당 → 기한" },
  ]);

  const outputFormats = Object.freeze([
    { id: "PPTX", label: "PPTX", rule: "16:9, 제목 28pt 이상, 본문 16pt 이상, 슬라이드당 핵심 메시지 하나" },
    { id: "DOCX", label: "DOCX", rule: "A4 세로, 인쇄 여백, 문단 간격, 표 반복 머리행, 페이지 나눔 제어" },
    { id: "HWPX", label: "HWPX", rule: "A4 세로, 한글 문단·표 구조, 공공기관 출력 안정성" },
    { id: "PDF", label: "PDF", rule: "문서 종류의 판형 상속, 글꼴 포함, 링크와 페이지 잘림 검수" },
    { id: "HTML", label: "화면용 HTML", rule: "반응형 재배치, 접근성 대비, 키보드 사용, 별도 인쇄 스타일" },
  ]);

  const categories = Object.freeze([
    { id: "all", label: "전체" },
    { id: "public", label: "공공·정책" },
    { id: "business", label: "기업·전략" },
    { id: "technical", label: "기술·데이터" },
    { id: "simple", label: "간결·안내" },
    { id: "creative", label: "브랜드·콘텐츠" },
  ]);

  window.PromptDeckDocumentDesignCatalog = Object.freeze({
    version: 1,
    themes,
    categories,
    documentKinds,
    outputFormats,
    fontPresets: BASE_FONTS,
    get(id) { return themes.find((item) => item.id === id) || null; },
    list(category = "all") { return category === "all" ? themes.slice() : themes.filter((item) => item.category === category); },
  });
})();
