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
  const PAGE_SIZES = Object.freeze([
    Object.freeze({ id: "A4", label: "A4", widthMm: 210, heightMm: 297 }),
    Object.freeze({ id: "A3", label: "A3", widthMm: 297, heightMm: 420 }),
    Object.freeze({ id: "B5", label: "B5", widthMm: 182, heightMm: 257 }),
    Object.freeze({ id: "LETTER", label: "Letter", widthMm: 215.9, heightMm: 279.4 }),
  ]);
  const PAGE_ORIENTATIONS = Object.freeze([
    Object.freeze({ id: "portrait", label: "세로형" }),
    Object.freeze({ id: "landscape", label: "가로형" }),
  ]);

  const PAGE_ARCHETYPES = Object.freeze([
    Object.freeze({ id: "cover", label: "표지", shortLabel: "표지", previewKey: "cover", visualScope: "대표 색상·이미지·서체의 첫인상과 제목 영역의 위치를 정의" }),
    Object.freeze({ id: "chapter", label: "장 시작", shortLabel: "장 시작", previewKey: "cover", visualScope: "장 번호·장 제목·전환 배경의 반복 규칙을 정의" }),
    Object.freeze({ id: "body", label: "본문", shortLabel: "본문", previewKey: "content", visualScope: "본문 열·문단·제목·캡션·쪽번호의 읽기 리듬을 정의" }),
    Object.freeze({ id: "image", label: "이미지", shortLabel: "이미지", previewKey: "content", visualScope: "사진·일러스트·도식과 캡션의 크기·비율·배치를 정의" }),
    Object.freeze({ id: "data", label: "표·차트", shortLabel: "표·차트", previewKey: "data", visualScope: "표·그래프·범례·단위·출처의 공통 조형 규칙을 정의" }),
    Object.freeze({ id: "special", label: "특수 페이지", shortLabel: "특수", previewKey: "data", visualScope: "문서 유형별 문제·해설·인용·펼침면 등 별도 화면의 시각 규칙을 정의" }),
  ]);

  const VISUAL_GRAMMARS = Object.freeze([
    Object.freeze({
      id: "report-analysis", label: "보고·분석형", description: "결론, 근거, 수치가 빠르게 구분되는 정돈된 업무 문법",
      visualTone: "신뢰감 있고 절제된 정보 중심", layoutSystem: "결론 영역과 근거 영역을 분리한 모듈 그리드", typeSystem: "제목은 단단하게, 본문과 주석은 중립적으로",
      imageSystem: "근거 사진과 구조 도식만 제한적으로 사용", tableChartSystem: "비교 기준·단위·출처가 먼저 보이는 데이터 표현", colorPlacement: "주색은 제목·머리행, 강조색은 결론·핵심 수치, 중립색은 본문·보조선에 배치",
      pageRhythm: "짧은 요약 화면과 근거 화면을 규칙적으로 교차", specialPageLabel: "요약·의사결정", recommendedThemeIds: Object.freeze(["public-brief", "executive-summary", "consulting-strategy", "proposal-win", "data-evidence", "minimal-office"]),
    }),
    Object.freeze({
      id: "professional-explanation", label: "전문·해설형", description: "복잡한 전문 정보를 장·절·도식 위계로 안정적으로 안내하는 문법",
      visualTone: "정밀하고 차분한 해설 중심", layoutSystem: "본문과 주석·용어·도식을 함께 읽는 다층 그리드", typeSystem: "장·절·항목과 캡션·각주를 명확히 분리",
      imageSystem: "실사·구조도·주석 이미지를 동일한 프레임 체계로 관리", tableChartSystem: "세부 비교와 기술 수치를 촘촘하지만 읽기 쉽게 정렬", colorPlacement: "주색은 장·절 표식, 보조색은 해설 면, 강조색은 핵심 용어와 참조 연결에 배치",
      pageRhythm: "해설 본문과 도식 중심 화면을 번갈아 구성", specialPageLabel: "용어·사례 해설", recommendedThemeIds: Object.freeze(["research-policy", "technology-industry", "data-evidence", "education-guide"]),
    }),
    Object.freeze({
      id: "textbook-learning", label: "교과·학습형", description: "학습 요소와 도움말이 단계적으로 구분되는 교육 출판 문법",
      visualTone: "친절하고 체계적인 학습 안내", layoutSystem: "본문·예시·활동·도움말을 반복 가능한 학습 블록으로 배치", typeSystem: "학습 제목·본문·핵심 용어·참고 상자의 역할을 서체와 굵기로 구분",
      imageSystem: "설명 그림·화면 캡처·개념 도식을 본문 인접 위치에 배치", tableChartSystem: "과정·비교·정리 목적에 맞춘 단순한 표와 그래프", colorPlacement: "주색은 단원 표식, 보조색은 학습 상자, 강조색은 핵심 개념과 행동 신호에 배치",
      pageRhythm: "개념·예시·활동·정리 화면의 시각 밀도를 단계적으로 조절", specialPageLabel: "활동·핵심 정리", recommendedThemeIds: Object.freeze(["education-guide", "research-policy", "warm-human", "minimal-office"]),
    }),
    Object.freeze({
      id: "exam-practice", label: "수험·문제형", description: "문제, 선택지, 해설, 정답을 즉시 구별하는 반복 학습 문법",
      visualTone: "집중감 있고 명확한 훈련 중심", layoutSystem: "문제 번호·본문·선택지·해설·정답 영역을 고정 위치에 반복", typeSystem: "문제 번호와 정답 신호는 강하게, 긴 해설은 편안하게",
      imageSystem: "문제 해결에 필요한 도식과 자료 이미지만 번호·캡션과 함께 사용", tableChartSystem: "문제 자료와 해설 근거를 구분하는 얇은 선 중심", colorPlacement: "주색은 문제 번호, 보조색은 해설 면, 강조색은 정답·주의·빈출 표식에 배치",
      pageRhythm: "문제 화면과 해설 화면의 규칙을 고정해 탐색 부담을 줄임", specialPageLabel: "문제·정답·해설", recommendedThemeIds: Object.freeze(["education-guide", "data-evidence", "minimal-office", "technology-industry"]),
    }),
    Object.freeze({
      id: "literary-reading", label: "문학·읽기형", description: "긴 글의 호흡과 문장 감상을 여백·행간·장 전환으로 살리는 문법",
      visualTone: "차분하고 몰입감 있는 읽기 중심", layoutSystem: "안정된 판면과 넉넉한 바깥 여백, 절제된 장식", typeSystem: "본문 가독성과 인용·장 제목의 감정적 대비를 함께 유지",
      imageSystem: "작품 분위기를 돕는 사진·삽화를 장 도입부와 간지에 제한 사용", tableChartSystem: "필요한 경우에도 본문 리듬을 해치지 않는 최소 선과 낮은 대비", colorPlacement: "종이색 계열 배경과 짙은 본문색을 기본으로 하고 강조색은 장 표식·인용에만 배치",
      pageRhythm: "긴 읽기 화면 사이에 장 시작·인용·여백 화면을 배치", specialPageLabel: "인용·작가 노트", recommendedThemeIds: Object.freeze(["editorial-premium", "warm-human", "minimal-office", "research-policy"]),
    }),
    Object.freeze({
      id: "illustrated-narrative", label: "그림·서사형", description: "글과 그림이 장면 단위로 함께 흐르는 이야기 출판 문법",
      visualTone: "감정과 장면 전환이 분명한 서사 중심", layoutSystem: "단면·펼침면을 오가며 텍스트 안전 영역과 시선 흐름을 고정", typeSystem: "이야기 본문·대화·효과음·캡션을 서로 다른 역할로 표현",
      imageSystem: "캐릭터·배경·색감·광원의 일관성을 전 페이지에서 유지", tableChartSystem: "정보 요소가 필요할 때는 이야기 그림과 충돌하지 않는 단순 픽토그램으로 대체", colorPlacement: "장면의 감정색을 넓은 면에 사용하고 읽기 영역은 충분한 대비를 확보",
      pageRhythm: "전면 그림·부분 그림·여백 중심 화면을 서사 속도에 맞춰 교차", specialPageLabel: "장면 펼침면", recommendedThemeIds: Object.freeze(["warm-human", "editorial-premium", "education-guide"]),
    }),
    Object.freeze({
      id: "editorial", label: "에디토리얼형", description: "사진, 대형 제목, 비대칭 여백으로 편집 의도를 선명하게 드러내는 문법",
      visualTone: "세련되고 개성 있는 편집 중심", layoutSystem: "유연한 다단 그리드와 의도적인 비대칭·크롭", typeSystem: "대형 제목·짧은 부제·본문·캡션의 크기 대비를 적극 활용",
      imageSystem: "대표 이미지의 크롭과 여백을 핵심 구성 요소로 사용", tableChartSystem: "편집 색상과 조화를 이루되 수치 판독성과 범례 규칙은 유지", colorPlacement: "주색은 넓은 면과 장 표식, 강조색은 인용·숫자·탐색 신호에 선택적으로 배치",
      pageRhythm: "강한 비주얼 화면과 조용한 읽기 화면을 교차", specialPageLabel: "포토 에세이·인포그래픽", recommendedThemeIds: Object.freeze(["editorial-premium", "consulting-strategy", "warm-human", "dark-innovation"]),
    }),
  ]);

  const PUBLICATION_TYPES = Object.freeze([
    Object.freeze({ id: "business-report", label: "일반 보고서", grammarId: "report-analysis", bestFor: "업무 현황·성과·결과 보고" }),
    Object.freeze({ id: "business-plan", label: "기획서·사업계획서", grammarId: "report-analysis", bestFor: "사업 기획·실행 계획·예산 설명" }),
    Object.freeze({ id: "proposal", label: "제안서", grammarId: "report-analysis", bestFor: "입찰·협업·서비스 제안" }),
    Object.freeze({ id: "policy-research", label: "정책·연구보고서", grammarId: "report-analysis", bestFor: "정책 분석·실태 조사·연구 결과" }),
    Object.freeze({ id: "annual-report", label: "연차·성과보고서", grammarId: "report-analysis", bestFor: "기관·기업의 연간 활동과 성과" }),
    Object.freeze({ id: "market-report", label: "시장·산업분석서", grammarId: "report-analysis", bestFor: "시장 규모·경쟁·산업 동향" }),
    Object.freeze({ id: "presentation", label: "발표자료", grammarId: "report-analysis", bestFor: "회의·브리핑·설명 발표" }),
    Object.freeze({ id: "meeting-results", label: "회의·결과자료", grammarId: "report-analysis", bestFor: "안건·결정·후속 조치 기록" }),
    Object.freeze({ id: "whitepaper", label: "전문 백서", grammarId: "professional-explanation", bestFor: "전문 분야의 구조적 해설" }),
    Object.freeze({ id: "technical-report", label: "기술 보고서", grammarId: "professional-explanation", bestFor: "기술 구조·시험·개발 결과" }),
    Object.freeze({ id: "professional-guide", label: "전문 실무서", grammarId: "professional-explanation", bestFor: "직무 지식·실무 방법 해설" }),
    Object.freeze({ id: "manual", label: "매뉴얼·가이드", grammarId: "professional-explanation", bestFor: "절차·화면·주의사항 안내" }),
    Object.freeze({ id: "handbook", label: "핸드북·편람", grammarId: "professional-explanation", bestFor: "빠른 참조용 전문 정보" }),
    Object.freeze({ id: "reference-book", label: "참고서·사전형 도서", grammarId: "professional-explanation", bestFor: "용어·개념·사례 참조" }),
    Object.freeze({ id: "textbook", label: "교과서", grammarId: "textbook-learning", bestFor: "정규 학습 과정과 단원 구성" }),
    Object.freeze({ id: "study-guide", label: "자습서", grammarId: "textbook-learning", bestFor: "개념·예시·활동·정리 학습" }),
    Object.freeze({ id: "learning-workbook", label: "학습 워크북", grammarId: "textbook-learning", bestFor: "쓰기·활동·점검 중심 학습" }),
    Object.freeze({ id: "lecture-notes", label: "강의 교재", grammarId: "textbook-learning", bestFor: "강의 흐름과 필기·참고 영역" }),
    Object.freeze({ id: "teacher-guide", label: "교사용 지도서", grammarId: "textbook-learning", bestFor: "수업 운영·지도 포인트·자료" }),
    Object.freeze({ id: "certification-book", label: "자격증 도서", grammarId: "exam-practice", bestFor: "핵심 이론·문제·해설 반복" }),
    Object.freeze({ id: "exam-prep", label: "수험서", grammarId: "exam-practice", bestFor: "시험 범위·빈출 개념·실전 훈련" }),
    Object.freeze({ id: "question-bank", label: "문제집", grammarId: "exam-practice", bestFor: "문제·선택지·정답 체계" }),
    Object.freeze({ id: "solution-book", label: "해설집", grammarId: "exam-practice", bestFor: "풀이 단계·정답 근거·오답 안내" }),
    Object.freeze({ id: "essay-collection", label: "수필집", grammarId: "literary-reading", bestFor: "긴 글과 짧은 장의 감상" }),
    Object.freeze({ id: "prose-collection", label: "산문집", grammarId: "literary-reading", bestFor: "문장 중심의 연속 읽기" }),
    Object.freeze({ id: "memoir", label: "회고록·자서전", grammarId: "literary-reading", bestFor: "시간 흐름·사진·기록 결합" }),
    Object.freeze({ id: "poetry-collection", label: "시집", grammarId: "literary-reading", bestFor: "짧은 텍스트와 넓은 여백" }),
    Object.freeze({ id: "fairy-tale", label: "동화책", grammarId: "illustrated-narrative", bestFor: "글과 삽화가 함께 흐르는 이야기" }),
    Object.freeze({ id: "picture-book", label: "그림책", grammarId: "illustrated-narrative", bestFor: "펼침면 중심의 시각 서사" }),
    Object.freeze({ id: "storybook", label: "스토리북", grammarId: "illustrated-narrative", bestFor: "장면·대화·서술의 반복" }),
    Object.freeze({ id: "children-learning", label: "어린이 학습책", grammarId: "illustrated-narrative", bestFor: "그림·활동·짧은 설명 결합" }),
    Object.freeze({ id: "magazine", label: "매거진", grammarId: "editorial", bestFor: "기사·사진·인포그래픽 편집" }),
    Object.freeze({ id: "brand-book", label: "브랜드북", grammarId: "editorial", bestFor: "브랜드 원칙·사례·이미지 체계" }),
    Object.freeze({ id: "catalogue", label: "카탈로그", grammarId: "editorial", bestFor: "제품·작품·서비스 이미지 편집" }),
    Object.freeze({ id: "brochure", label: "브로슈어", grammarId: "editorial", bestFor: "짧은 소개와 강한 대표 이미지" }),
  ]);

  const PRODUCTION_OPTIONS = Object.freeze({
    mediums: Object.freeze([
      Object.freeze({ id: "print", label: "인쇄물", rule: "실물 출력 기준으로 색상·선·여백·재단 안전 영역을 관리" }),
      Object.freeze({ id: "screen", label: "화면 열람", rule: "RGB 화면 대비와 확대·축소 시 가독성을 우선" }),
      Object.freeze({ id: "hybrid", label: "인쇄+화면", rule: "인쇄 안정성과 화면 가독성을 함께 충족" }),
    ]),
    bindings: Object.freeze([
      Object.freeze({ id: "none", label: "제본 없음", gutterMm: 0 }),
      Object.freeze({ id: "perfect", label: "무선 제본", gutterMm: 6 }),
      Object.freeze({ id: "saddle", label: "중철 제본", gutterMm: 3 }),
      Object.freeze({ id: "hardcover", label: "양장 제본", gutterMm: 8 }),
      Object.freeze({ id: "spiral", label: "스프링 제본", gutterMm: 10 }),
    ]),
    duplexModes: Object.freeze([
      Object.freeze({ id: "single", label: "단면", rule: "모든 페이지의 안쪽·바깥쪽 여백을 동일하게 적용" }),
      Object.freeze({ id: "duplex-long", label: "양면·긴쪽 넘김", rule: "홀수·짝수 페이지의 안쪽 여백과 페이지 요소를 좌우 대칭" }),
      Object.freeze({ id: "duplex-short", label: "양면·짧은쪽 넘김", rule: "상하 넘김 방향에 맞춰 뒷면의 읽기 방향을 유지" }),
    ]),
    spreadModes: Object.freeze([
      Object.freeze({ id: "single-pages", label: "낱장 보기", rule: "각 페이지를 독립된 판면으로 구성" }),
      Object.freeze({ id: "facing-pages", label: "맞쪽 보기", rule: "좌우 페이지의 기준선·여백·시각 무게를 한 펼침면으로 조정" }),
      Object.freeze({ id: "cover-spread", label: "표지 펼침면", rule: "뒤표지·책등·앞표지를 하나의 연속된 인쇄면으로 구성" }),
    ]),
    bleeds: Object.freeze([
      Object.freeze({ id: "none", label: "도련 없음", bleedMm: 0 }),
      Object.freeze({ id: "3mm", label: "도련 3mm", bleedMm: 3 }),
    ]),
  });

  const THEME_GRAMMAR_MAP = Object.freeze({
    "public-brief": Object.freeze(["report-analysis", "professional-explanation"]),
    "executive-summary": Object.freeze(["report-analysis"]),
    "consulting-strategy": Object.freeze(["report-analysis", "editorial"]),
    "proposal-win": Object.freeze(["report-analysis"]),
    "research-policy": Object.freeze(["report-analysis", "professional-explanation", "textbook-learning", "literary-reading"]),
    "technology-industry": Object.freeze(["professional-explanation", "exam-practice"]),
    "data-evidence": Object.freeze(["report-analysis", "professional-explanation", "exam-practice"]),
    "minimal-office": Object.freeze(["report-analysis", "exam-practice", "literary-reading"]),
    "editorial-premium": Object.freeze(["literary-reading", "illustrated-narrative", "editorial"]),
    "education-guide": Object.freeze(["professional-explanation", "textbook-learning", "exam-practice", "illustrated-narrative"]),
    "warm-human": Object.freeze(["textbook-learning", "literary-reading", "illustrated-narrative", "editorial"]),
    "dark-innovation": Object.freeze(["professional-explanation", "editorial"]),
  });

  const base = {
    typography: { fontPreset: "corporate", headingSizePt: 25, bodySizePt: 11, footnoteSizePt: 8.5, headingWeight: 700, bodyWeight: 400, lineHeightPercent: 155, letterSpacingEm: -0.015 },
    layout: { density: "balanced", grid: "12열 모듈 그리드", marginMm: 18, marginTopMm: 18, marginRightMm: 18, marginBottomMm: 18, marginLeftMm: 18, paragraphGapPt: 7, sectionGapPt: 18, headerDistanceMm: 10, footerDistanceMm: 10, header: true, footer: true },
    hierarchy: { levels: 4, method: "크기·굵기·여백을 함께 사용", headlineStyle: "결론형 문장", numbering: "1. / 1.1 / 1.1.1", emphasis: "강조색과 굵기", alignment: "왼쪽 정렬" },
    tableRules: { style: "얇은 가로선 중심", headerStyle: "주색 배경과 반전 글자", borderStyle: "바깥선 없음·내부 가로선", stripeRows: false, repeatHeader: true, numericAlignment: "오른쪽 정렬", cellPaddingMm: 2.5, maxColumns: 8, showUnits: true, showSource: true },
    chartRules: { preferredType: "막대 차트", colorMode: "주색 계열 + 강조색 1개", dataLabels: "핵심 값만 직접 표시", legend: "상단", gridlines: "주요 가로선만", sortOrder: "의미 있는 순서 또는 내림차순", zeroBaseline: true, threeD: false, showUnits: true, showSource: true },
    components: { cover: true, toc: true, sectionDividers: true, pageNumber: true, table: true, chart: true, images: "필요할 때만 근거 이미지 사용" },
    visualAssets: {
      backgroundUsage: "표지·간지에만 제한적으로 사용",
      backgroundStyle: "주제와 직접 관련된 실제 이미지를 낮은 대비로 사용",
      iconUsage: "핵심 정보의 빠른 탐색에만 사용",
      iconStyle: "단색 선형 아이콘, 동일한 선 굵기",
      pictogramUsage: "절차·대상·분류를 설명할 때 사용",
      pictogramStyle: "단순한 정면형 픽토그램, 한 세트의 조형 언어 유지",
      typographyScope: "제목·본문·표·차트·캡션·각주 전체에 같은 서체 체계 적용",
    },
    creativeDegrees: {
      colorIntensity: "균형 있게",
      contrast: "명확하게",
      titlePresence: "강하게",
      bodyScale: "편안하게",
      notePresence: "은은하게",
      lineSpacing: "여유롭게",
      headingEmphasis: "강하게",
      hierarchyDepth: "균형 있게",
      pageWhitespace: "균형 있게",
      marginBalance: "사방 균형 있게",
      paragraphRhythm: "균형 있게",
      sectionSeparation: "분명하게",
      headerFooterBreathing: "균형 있게",
      tableInformationAmount: "균형 있게",
      cellBreathing: "균형 있게",
    },
  };

  const VISUAL_PROFILES = Object.freeze({
    "public-brief": Object.freeze({
      backgroundUsage: "표지·간지에만 제한적으로 사용", backgroundStyle: "기관·사업 현장 실사에 주색 오버레이를 옅게 적용",
      iconUsage: "일정·담당·확인 항목 표식에만 사용", iconStyle: "단색 1.5pt 선형 아이콘, 직선 중심의 공식적 형태",
      pictogramUsage: "정책 대상·지원 절차·성과 분류에 사용", pictogramStyle: "공공 안내체계형 정면 픽토그램, 동일한 선 굵기",
      typographyScope: "제목·본문·표·차트·캡션·각주 전체에 공공 문서 서체 체계 적용",
    }),
    "executive-summary": Object.freeze({
      backgroundUsage: "표지와 장 전환 화면에 사용", backgroundStyle: "기업 현장 사진을 짙은 네이비 톤으로 정돈하고 결론 영역은 비움",
      iconUsage: "의사결정·담당·기한·위험 신호에 사용", iconStyle: "작은 면형 아이콘과 숫자 배지, 각진 모서리",
      pictogramUsage: "사업부·이해관계자·KPI 묶음에 사용", pictogramStyle: "기하학적 비즈니스 픽토그램, 2색 이내",
      typographyScope: "결론형 제목·KPI 숫자·조치 항목은 강하게, 본문·주석은 중립적으로 적용",
    }),
    "consulting-strategy": Object.freeze({
      backgroundUsage: "표지에만 추상 구조 이미지 사용", backgroundStyle: "전략 축과 흐름을 암시하는 얇은 선·그리드 배경",
      iconUsage: "논점·가설·시사점 구분에 제한 사용", iconStyle: "정밀한 단색 선형 아이콘, 정사각 모듈에 정렬",
      pictogramUsage: "프로세스·조직·시장 구조 설명에 사용", pictogramStyle: "MECE 블록형 픽토그램, 선과 면 비율을 통일",
      typographyScope: "페이지 결론·논점 제목·도표 주석까지 동일한 컨설팅 위계로 적용",
    }),
    "proposal-win": Object.freeze({
      backgroundUsage: "표지·수행 단계 간지에 사용", backgroundStyle: "과업 현장 또는 서비스 장면을 사선 마스크와 주색으로 결합",
      iconUsage: "요구사항·해결안·차별성 표식에 사용", iconStyle: "굵은 선형 아이콘과 강조색 포인트, 평가항목별 동일 규격",
      pictogramUsage: "수행체계·인력·일정·산출물 설명에 사용", pictogramStyle: "역할이 명확한 제안서형 픽토그램, 연결선을 함께 사용",
      typographyScope: "평가항목 제목·핵심 약속·증빙 캡션에 강한 위계, 본문은 읽기 중심으로 적용",
    }),
    "research-policy": Object.freeze({
      backgroundUsage: "표지에만 연구 대상 이미지를 사용", backgroundStyle: "현장·자료 이미지를 저채도 처리하고 넓은 여백과 결합",
      iconUsage: "방법·결과·한계 구분에만 사용", iconStyle: "가는 선형 아이콘, 장식 없이 학술적 형태",
      pictogramUsage: "조사 대상·연구 절차·정책 대안을 설명할 때 사용", pictogramStyle: "도식형 픽토그램과 짧은 명사 레이블을 함께 사용",
      typographyScope: "장·절·본문·표 제목·그림 캡션·출처·각주까지 연구보고서 위계 적용",
    }),
    "technology-industry": Object.freeze({
      backgroundUsage: "표지·기술 구조 간지에 사용", backgroundStyle: "연구장비·산업 현장 실사에 청색 기술 그리드를 낮은 밀도로 중첩",
      iconUsage: "기술 요소·기능·성숙도 표식에 사용", iconStyle: "정밀한 모노라인 아이콘, 직각 연결부와 기술 도면 비례",
      pictogramUsage: "기술 스택·공급망·로드맵 단계에 사용", pictogramStyle: "모듈형 산업 픽토그램, 관계선과 방향 동사를 함께 표시",
      typographyScope: "기술명·수치·도식 레이블은 기술 서체, 긴 본문·출처는 읽기 서체로 분리 적용",
    }),
    "data-evidence": Object.freeze({
      backgroundUsage: "사진 대신 데이터 패턴을 제한 사용", backgroundStyle: "옅은 좌표선·점 패턴을 표지와 데이터 장에만 적용",
      iconUsage: "KPI 범주와 증감 상태에 사용", iconStyle: "작은 채움형 데이터 아이콘, 숫자보다 시각 우선순위를 낮게 유지",
      pictogramUsage: "지표 정의·비교 집단·데이터 흐름에 사용", pictogramStyle: "범례와 직접 연결되는 단색 데이터 픽토그램",
      typographyScope: "KPI 숫자·차트 제목·축·범례·표 숫자·단위에 숫자 가독성 중심 체계 적용",
    }),
    "minimal-office": Object.freeze({
      backgroundUsage: "배경 이미지를 사용하지 않음", backgroundStyle: "흰 배경과 옅은 회색 면, 얇은 구분선만 사용",
      iconUsage: "탐색이 필요한 항목에만 최소 사용", iconStyle: "작은 단색 선형 아이콘, 텍스트 기준선에 맞춤",
      pictogramUsage: "복잡한 절차가 있을 때만 사용", pictogramStyle: "원형·사각형 기본 도형 기반의 단순 픽토그램",
      typographyScope: "제목·본문·표·주석의 3단 위계만 유지하고 장식적 서체 변형은 사용하지 않음",
    }),
    "editorial-premium": Object.freeze({
      backgroundUsage: "표지와 장 도입부에 대표 이미지 한 장을 크게 사용", backgroundStyle: "고품질 사진을 과감하게 크롭하고 종이 질감과 따뜻한 여백을 결합",
      iconUsage: "페이지 안내와 인용 출처에만 사용", iconStyle: "가는 에디토리얼 선형 아이콘, 본문보다 낮은 대비",
      pictogramUsage: "브랜드 원칙·콘텐츠 범주를 설명할 때 사용", pictogramStyle: "기하학과 유기 곡선을 섞은 편집형 픽토그램",
      typographyScope: "대형 제목·짧은 부제·인용·캡션은 에디토리얼 서체, 긴 본문과 데이터는 중립 서체 적용",
    }),
    "education-guide": Object.freeze({
      backgroundUsage: "화면 예시 주변과 단계 시작 화면에 사용", backgroundStyle: "실제 화면 캡처를 흐리지 않고 옅은 색상 면과 충분한 여백으로 받침",
      iconUsage: "행동·주의·완료 상태를 항상 함께 표시", iconStyle: "둥근 모서리의 2색 면형 아이콘, 44px 이상 식별 크기",
      pictogramUsage: "사용자 역할·준비물·단계 흐름에 사용", pictogramStyle: "친근한 평면 픽토그램, 한 단계에 한 의미만 표현",
      typographyScope: "행동형 제목·단계 번호·버튼명·주의문·화면 캡션까지 교육용 위계 적용",
    }),
    "warm-human": Object.freeze({
      backgroundUsage: "표지·사례 도입부에 인물과 현장 이미지를 사용", backgroundStyle: "자연광의 다큐멘터리 사진을 따뜻한 종이색과 부드럽게 결합",
      iconUsage: "인용·관계·활동 유형 표식에 사용", iconStyle: "부드러운 곡선의 선형 아이콘, 낮은 채도의 강조색",
      pictogramUsage: "사람·지역·지원 관계를 설명할 때 사용", pictogramStyle: "다양성을 존중하는 단순 인물 픽토그램, 과장된 표정 금지",
      typographyScope: "사례 제목·인용문·본문·사진 캡션에 따뜻한 서체 체계, 수치와 출처는 중립 서체 적용",
    }),
    "dark-innovation": Object.freeze({
      backgroundUsage: "표지·간지·기술 개념 페이지에 사용", backgroundStyle: "어두운 공간감 위에 네트워크·신호·입자 이미지를 낮은 밝기로 사용",
      iconUsage: "기술 기능·상태·핵심 경로에 사용", iconStyle: "청록 발광 포인트가 있는 정밀 선형 아이콘, 외곽 광선 최소화",
      pictogramUsage: "AI 구성요소·데이터 흐름·미래 시나리오에 사용", pictogramStyle: "노드 기반 기술 픽토그램, 연결 방향과 계층을 명확히 표시",
      typographyScope: "대형 기술 제목·핵심 수치·도식 레이블에 고대비 서체, 긴 본문은 인쇄 가능한 밝은 중립색 적용",
    }),
  });

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

  function degreeProfile(typography, layout, hierarchy, tableRules, overrides = {}) {
    const titleSize = Number(typography.headingSizePt) || 25;
    const bodySize = Number(typography.bodySizePt) || 11;
    const noteSize = Number(typography.footnoteSizePt) || 8.5;
    const lineHeight = Number(typography.lineHeightPercent) || 155;
    const headingWeight = Number(typography.headingWeight) || 700;
    const margin = Number(layout.marginMm) || 18;
    const paragraphGap = Number(layout.paragraphGapPt) || 7;
    const sectionGap = Number(layout.sectionGapPt) || 18;
    const headerDistance = Math.max(Number(layout.headerDistanceMm) || 10, Number(layout.footerDistanceMm) || 10);
    const hierarchyLevels = Number(hierarchy.levels) || 4;
    const maxColumns = Number(tableRules.maxColumns) || 8;
    const cellPadding = Number(tableRules.cellPaddingMm) || 2.5;
    return Object.freeze({
      ...base.creativeDegrees,
      titlePresence: titleSize >= 31 ? "매우 강하게" : titleSize >= 25 ? "강하게" : titleSize >= 22 ? "균형 있게" : "절제되게",
      bodyScale: bodySize >= 12 ? "넉넉하게" : bodySize >= 10.5 ? "편안하게" : bodySize >= 9.5 ? "균형 있게" : "작고 치밀하게",
      notePresence: noteSize >= 10 ? "또렷하게" : noteSize >= 9 ? "균형 있게" : noteSize >= 8 ? "절제되게" : "은은하게",
      lineSpacing: lineHeight >= 175 ? "매우 여유롭게" : lineHeight >= 155 ? "여유롭게" : lineHeight >= 140 ? "균형 있게" : "촘촘하게",
      headingEmphasis: headingWeight >= 850 ? "매우 강하게" : headingWeight >= 700 ? "강하게" : headingWeight >= 600 ? "균형 있게" : "부드럽게",
      hierarchyDepth: hierarchyLevels >= 5 ? "깊게" : hierarchyLevels >= 4 ? "균형 있게" : "단순하게",
      pageWhitespace: margin >= 24 ? "매우 여유롭게" : margin >= 20 ? "여유롭게" : margin >= 16 ? "균형 있게" : "조밀하게",
      paragraphRhythm: paragraphGap >= 11 ? "여유롭게" : paragraphGap >= 7 ? "균형 있게" : "촘촘하게",
      sectionSeparation: sectionGap >= 26 ? "매우 분명하게" : sectionGap >= 18 ? "분명하게" : "부드럽게",
      headerFooterBreathing: headerDistance >= 15 ? "여유롭게" : headerDistance >= 10 ? "균형 있게" : "가깝게",
      tableInformationAmount: maxColumns >= 10 ? "풍부하게" : maxColumns >= 7 ? "균형 있게" : "핵심만 간결하게",
      cellBreathing: cellPadding >= 4 ? "매우 여유롭게" : cellPadding >= 3 ? "여유롭게" : cellPadding >= 2 ? "균형 있게" : "조밀하게",
      ...overrides,
    });
  }

  function theme(definition) {
    const categoryProfile = CATEGORY_PROFILES[definition.category] || {};
    const typography = { ...base.typography, ...definition.typography };
    const layout = { ...base.layout, ...definition.layout };
    if (definition.layout?.marginMm !== undefined) {
      layout.marginTopMm = definition.layout.marginTopMm ?? definition.layout.marginMm;
      layout.marginRightMm = definition.layout.marginRightMm ?? definition.layout.marginMm;
      layout.marginBottomMm = definition.layout.marginBottomMm ?? definition.layout.marginMm;
      layout.marginLeftMm = definition.layout.marginLeftMm ?? definition.layout.marginMm;
    }
    const preset = BASE_FONTS[typography.fontPreset] || BASE_FONTS.corporate;
    typography.headingFamily = definition.typography?.headingFamily || preset.heading;
    typography.bodyFamily = definition.typography?.bodyFamily || preset.body;
    typography.fallback = definition.typography?.fallback || preset.fallback;
    const hierarchy = { ...base.hierarchy, ...(categoryProfile.hierarchy || {}), ...definition.hierarchy };
    const tableRules = { ...base.tableRules, ...(categoryProfile.tableRules || {}), ...definition.tableRules };
    const previews = Object.freeze({
      cover: `${PREVIEW_ROOT}/${definition.id}-cover.png?v=1`,
      content: `${PREVIEW_ROOT}/${definition.id}-content.png?v=1`,
      data: `${PREVIEW_ROOT}/${definition.id}-data.png?v=1`,
    });
    const pagePreviews = Object.freeze(PAGE_ARCHETYPES.reduce((result, page) => {
      result[page.id] = previews[page.previewKey];
      return result;
    }, {}));
    return Object.freeze({
      ...definition,
      recommendedGrammarIds: THEME_GRAMMAR_MAP[definition.id] || Object.freeze(["report-analysis"]),
      typography: Object.freeze(typography),
      layout: Object.freeze(layout),
      hierarchy: Object.freeze(hierarchy),
      tableRules: Object.freeze(tableRules),
      chartRules: Object.freeze({ ...base.chartRules, ...(categoryProfile.chartRules || {}), ...definition.chartRules }),
      components: Object.freeze({ ...base.components, ...definition.components }),
      visualAssets: Object.freeze({ ...base.visualAssets, ...(VISUAL_PROFILES[definition.id] || {}), ...definition.visualAssets }),
      creativeDegrees: degreeProfile(typography, layout, hierarchy, tableRules, definition.creativeDegrees),
      previews,
      pagePreviews,
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
    { id: "PPTX", label: "PPTX", rule: "지정한 완성 크기와 방향을 슬라이드 크기에 적용하고 화면·인쇄에서 요소 잘림을 검수" },
    { id: "DOCX", label: "DOCX", rule: "지정한 판형·방향·제본 여백을 적용하고 문단 간격, 표 반복 머리행, 페이지 나눔을 제어" },
    { id: "HWPX", label: "HWPX", rule: "지정한 판형·방향·제본 여백을 적용하고 한글 문단·표 구조와 출력 안정성을 검수" },
    { id: "PDF", label: "PDF", rule: "지정한 판형·방향·도련을 유지하고 글꼴 포함, 링크와 페이지 잘림을 검수" },
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
    version: 4,
    themes,
    categories,
    documentKinds,
    publicationTypes: PUBLICATION_TYPES,
    visualGrammars: VISUAL_GRAMMARS,
    pageArchetypes: PAGE_ARCHETYPES,
    productionOptions: PRODUCTION_OPTIONS,
    outputFormats,
    fontPresets: BASE_FONTS,
    pageSizes: PAGE_SIZES,
    pageOrientations: PAGE_ORIENTATIONS,
    get(id) { return themes.find((item) => item.id === id) || null; },
    list(category = "all") { return category === "all" ? themes.slice() : themes.filter((item) => item.category === category); },
    getPublicationType(id) { return PUBLICATION_TYPES.find((item) => item.id === id) || null; },
    getVisualGrammar(id) { return VISUAL_GRAMMARS.find((item) => item.id === id) || null; },
    resolveVisualGrammar(publicationTypeId) {
      const publicationType = PUBLICATION_TYPES.find((item) => item.id === publicationTypeId);
      return publicationType ? VISUAL_GRAMMARS.find((item) => item.id === publicationType.grammarId) || null : null;
    },
    listByGrammar(grammarId) { return themes.filter((item) => item.recommendedGrammarIds.includes(grammarId)); },
  });
})();
