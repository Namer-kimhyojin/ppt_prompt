(function () {
  "use strict";

  const root = document.getElementById("commonPromptApp");
  if (!root) return;

  const PALETTE_CATALOG = window.PromptDeckPaletteCatalog;
  const MEDIUM_CATALOG = window.PromptDeckMediumCatalog;
  const TYPOGRAPHY_CATALOG = window.PromptDeckTypographyCatalog;
  const SLIDE_STYLE_CATALOG = window.PromptDeckSlideStyleCatalog;
  const SKILL_PRESET_CONTRACT = window.PromptDeckSkillPresetContract || null;
  const COLOR_ROLE_META = {
    primary: ["Primary", "주요 구조"], secondary: ["Secondary", "보조 정보"], accent: ["Accent", "핵심 강조"],
    background: ["Background", "기본 배경"], surface: ["Surface", "카드 표면"], textPrimary: ["Text Primary", "주요 텍스트"],
    textSecondary: ["Text Secondary", "보조 텍스트"], border: ["Border", "테두리·구분선"],
  };
  const CORE_COLOR_ROLE_KEYS = ["primary", "secondary", "accent", "background", "textPrimary"];

  const STORAGE_KEY = "promptdeck.commonPromptBuilder.v1";
  const USER_PRESET_STORAGE_KEY = "promptdeck.commonPromptBuilder.userPresets.v1";
  const USER_PRESET_SCHEMA_VERSION = 2;
  const USER_PRESET_LIMIT = 16;
  const USER_PRESET_DESIGN_KEYS = ["canvas", "frame", "visualStyle", "colors", "typography", "resources", "quality"];
  const USER_PRESET_OUTPUT_KEYS = ["documentType", "targetModel", "promptLanguage", "outputMode", "maxChars"];
  const SCHEMA_VERSION = SKILL_PRESET_CONTRACT?.versions?.designCurrent || "4.0";
  const PLANNER_CONTRACT_VERSION = SKILL_PRESET_CONTRACT?.versions?.plannerCurrent || "3.6";
  const SKILL_PRESET_CONTRACT_VERSION = SKILL_PRESET_CONTRACT?.versions?.skillPresetCurrent || "1.0";
  const REQUIRED_SCOPE = "This common prompt defines only the finished deck-wide design guide. Audience, purpose, persuasion context, actual titles, body copy, facts, figures, chart content, image subjects, labels, captions, sources, semantic relationships, and page-specific composition instructions are supplied separately. Preserve what the slide must communicate; let the image model choose how to compose it unless an individual slide explicitly declares a composition lock.";
  const MODEL_PROFILES = {
    gpt_image: { label: "GPT Image", badge: "직접 생성", help: "짧고 명확한 실행 명령으로 바로 렌더링", note: "문구 정확성 → 가독성 → 시각 실행", recommendedMode: "standard" },
    gemini: { label: "Gemini", badge: "구조 해석", help: "핵심 섹션과 역할 우선순위를 순서대로 해석", note: "짧은 구조 · 최종 정확성 확인", recommendedMode: "standard" },
    common: { label: "공통형", badge: "범용 호환", help: "공급자 전용 문법 없이 재사용하는 중립형", note: "의미 보존 · 모델 간 이식", recommendedMode: "standard" },
  };
  const OUTPUT_MODE_PROFILES = {
    standard: { label: "실전형", badge: "추천", help: "이미지 생성에 필요한 공통 시각 조건만 전달", length: "약 1,500~2,400자" },
    compact: { label: "초압축형", badge: "짧게", help: "짧은 입력창용 핵심 조건", length: "최대 1,600자" },
    style_lock: { label: "반복 적용형", badge: "재사용", help: "여러 장에 반복 적용할 공통 시각 조건", length: "최대 2,200자" },
    detailed: { label: "검토형", badge: "검토", help: "선택 내용을 확인하기 위한 확장 표현", length: "최대 2,800자" },
  };
  const PROMPT_LENGTH_BUDGETS = { standard: 2400, compact: 1600, style_lock: 2200, detailed: 2800 };
  const QUICK_START_PROFILES = {
    public: { label: "공공·정책", help: "정부·기관·정책·지원사업", purpose: "policy", composition: "controlled", color: "publicBlue", background: "report", header: "report", footer: "source", typography: "public", photoMode: "conditional", photoRole: "context" },
    evaluation: { label: "평가·공고", help: "공모·선정·심사·제안", purpose: "evaluation", composition: "dataFocus", color: "corporateNavy", background: "report", header: "presentation", footer: "source", typography: "public", photoMode: "off", photoRole: "evidence" },
    technology: { label: "기술·연구", help: "R&D·개발·실증·공정", purpose: "external", composition: "dynamic", color: "futureTech", background: "technology", header: "simple", footer: "minimal", typography: "technical", photoMode: "off", photoRole: "context" },
    education: { label: "교육·안내", help: "교육·훈련·매뉴얼·워크숍", purpose: "external", composition: "controlled", color: "futureTech", background: "report", header: "presentation", footer: "minimal", typography: "education", photoMode: "off", photoRole: "context" },
    investment: { label: "투자·IR", help: "투자유치·시장·성장전략", purpose: "investment", composition: "editorial", color: "premium", background: "premium", header: "minimal", footer: "minimal", typography: "premium", photoMode: "conditional", photoRole: "hero" },
    strategy: { label: "전략·성과", help: "사업계획·실적·성과보고", purpose: "internal", composition: "dataFocus", color: "corporateNavy", background: "data", header: "simple", footer: "divider", typography: "data", photoMode: "conditional", photoRole: "evidence" },
  };

  const INSTITUTION_RANDOM_PROFILES = [
    { id: "policy", label: "정책·행정 브리핑", help: "정책 방향과 추진 체계를 신뢰감 있게 전달", directionPreset: "public_policy", mediumIds: ["med-institutional-report-style", "med-public-minimal-brand", "med-infographic-data-visual"], compositions: ["controlled", "dataFocus"], colors: ["publicBlue", "corporateNavy"], backgrounds: ["report", "data"], headers: ["report", "simple"], footers: ["source", "institution"], typographies: ["public", "data"], photos: [{ mode: "conditional", role: "context", primary: "hero" }, { mode: "off", role: "context", primary: "hero" }] },
    { id: "performance", label: "사업계획·성과보고", help: "사업 구조와 핵심 성과를 데이터 중심으로 정리", directionPreset: "public_plan", mediumIds: ["med-pub-performance-report-card", "med-minimal-grid-system", "med-public-geometric-modern"], compositions: ["dataFocus", "controlled"], colors: ["publicBlue", "corporateNavy", "mono"], backgrounds: ["data", "report"], headers: ["simple", "report"], footers: ["source", "divider"], typographies: ["data", "public"], photos: [{ mode: "off", role: "evidence", primary: "accent" }, { mode: "conditional", role: "evidence", primary: "hero" }] },
    { id: "evaluation", label: "공모·선정평가", help: "평가 기준과 비교 근거를 빠르게 파악하도록 구성", directionPreset: "evaluation", mediumIds: ["med-pub-grant-announce", "med-pub-grant-recruit-card", "med-pub-benefit-comparison"], compositions: ["dataFocus", "controlled"], colors: ["corporateNavy", "publicBlue"], backgrounds: ["report", "data"], headers: ["presentation", "report"], footers: ["source", "minimal"], typographies: ["public", "data"], photos: [{ mode: "off", role: "evidence", primary: "accent" }] },
    { id: "citizen", label: "시민 안내·공공서비스", help: "절차와 혜택을 친근하고 명료하게 안내", directionPreset: "education", mediumIds: ["med-public-soft-color", "med-public-modern-line", "med-pub-application-step-guide", "med-pub-service-launch-guide"], compositions: ["controlled", "stable"], colors: ["publicBlue", "futureTech"], backgrounds: ["report", "conditional"], headers: ["presentation", "simple"], footers: ["minimal", "institution"], typographies: ["education", "public"], photos: [{ mode: "off", role: "context", primary: "accent" }, { mode: "conditional", role: "context", primary: "hero" }] },
    { id: "technology", label: "기술·R&D 보고", help: "기술 구조와 실증 결과를 전문적으로 시각화", directionPreset: "technology", mediumIds: ["med-pub-tech-node", "med-pub-hex-pattern", "med-infographic-data-visual"], compositions: ["dynamic", "dataFocus"], colors: ["futureTech", "corporateNavy"], backgrounds: ["technology", "data"], headers: ["simple", "presentation"], footers: ["source", "minimal"], typographies: ["technical", "data"], photos: [{ mode: "conditional", role: "evidence", primary: "hero" }, { mode: "off", role: "context", primary: "accent" }] },
    { id: "field", label: "현장사업·사례보고", help: "현장성과 실제 사례를 실사와 함께 설득력 있게 제시", directionPreset: "public_plan", mediumIds: ["med-official-photo", "med-pub-photo-clean", "med-pub-photo-cool"], compositions: ["controlled", "editorial"], colors: ["publicBlue", "corporateNavy", "mono"], backgrounds: ["report", "conditional"], headers: ["report", "minimal"], footers: ["source", "institution"], typographies: ["public", "editorial"], photos: [{ mode: "preferred", role: "evidence", primary: "hero" }, { mode: "conditional", role: "context", primary: "accent" }] },
  ];

  const QUICK_RANDOM_RECIPES = [
    { id: "clear-report", label: "정돈된 신뢰형", help: "공식성과 가독성을 우선하는 안정적 보고", axes: [[1, 2, 2, 1], [2, 2, 2, 1]], compositions: ["stable", "controlled"], paletteFilters: [{ usage: "corporate" }, { category: "official" }], backgrounds: ["report", "data"], headers: ["report", "simple"], footers: ["source", "minimal"], typographies: ["public", "data"], photoLevels: ["off", "conditional"], photoRoles: ["evidence", "explanation"], keywords: ["신뢰감", "명료함", "정돈", "근거 중심"] },
    { id: "data-focus", label: "데이터 판단형", help: "핵심 수치와 비교 근거가 먼저 읽히는 구성", axes: [[1, 3, 3, 1], [2, 3, 3, 1]], compositions: ["dataFocus", "controlled"], paletteFilters: [{ usage: "corporate", contrast: "bold" }, { category: "official", saturation: "controlled" }], backgrounds: ["data", "report"], headers: ["simple", "presentation"], footers: ["source", "divider"], typographies: ["data", "public"], photoLevels: ["off", "conditional"], photoRoles: ["evidence"], keywords: ["비교 가능성", "정확성", "결론 중심", "명료함"] },
    { id: "technical-flow", label: "기술 구조형", help: "구조와 흐름을 정밀하고 미래지향적으로 설명", axes: [[2, 3, 3, 1], [2, 4, 3, 2]], compositions: ["dynamic", "dataFocus"], paletteFilters: [{ category: "modern", temperature: "cool" }, { usage: "technology" }], backgrounds: ["technology", "data"], headers: ["simple", "presentation"], footers: ["source", "minimal"], typographies: ["technical", "data"], photoLevels: ["conditional"], photoRoles: ["explanation", "evidence"], keywords: ["정밀함", "기술적", "연결", "미래지향"] },
    { id: "friendly-guide", label: "친근한 안내형", help: "처음 보는 사람도 순서와 의미를 쉽게 이해", axes: [[4, 3, 3, 3], [4, 2, 2, 3]], compositions: ["controlled", "stable"], paletteFilters: [{ saturation: "balanced", contrast: "clear" }, { temperature: "warm", contrast: "clear" }], backgrounds: ["report", "conditional"], headers: ["presentation", "simple"], footers: ["minimal"], typographies: ["education", "public"], photoLevels: ["conditional", "preferred"], photoRoles: ["explanation", "context"], keywords: ["친근함", "단계성", "명료함", "안정감"] },
    { id: "editorial-impact", label: "에디토리얼 강조형", help: "여백과 큰 위계로 메시지를 기억하게 하는 구성", axes: [[3, 4, 4, 4], [2, 4, 4, 3]], compositions: ["editorial", "dynamic"], paletteFilters: [{ category: "modern", contrast: "bold" }, { usage: "brand" }], backgrounds: ["premium", "conditional"], headers: ["minimal", "simple"], footers: ["minimal"], typographies: ["premium", "editorial"], photoLevels: ["preferred", "conditional"], photoRoles: ["atmosphere", "context"], keywords: ["고유함", "기억성", "대담함", "여백"] },
  ];

  const STEP_META = [
    ["project", "발표 맥락", "각 슬라이드에 별도로 전달할 청중·목적·인식 변화 맥락을 정합니다."],
    ["direction", "디자인 DNA", "정답형 스타일 대신 인상·에너지·형태·깊이를 순서대로 조율해 고유한 디자인 방향을 만듭니다."],
    ["composition", "시각 문법과 레이아웃", "형태·선·표면·공간 리듬과 일관성·변주 원칙을 하나의 문법으로 정의합니다."],
    ["colors", "색상 팔레트", "색온도·채도·대비로 팔레트를 찾고 실제 슬라이드 미리보기에서 최종 색상을 선택합니다."],
    ["typography", "타이포그래피 언어", "제목과 본문의 목소리, 위계와 리듬을 정합니다."],
    ["photoComposite", "이미지·그래픽 언어", "사진·데이터·다이어그램·레이어를 어떤 역할과 관계로 결합할지 정합니다."],
    ["background", "배경과 표면", "배경이 만드는 분위기와 정보 보호 방식, 표면의 깊이를 정합니다."],
    ["header", "헤더 시스템", "덱 전체에서 반복되는 상단 정보의 성격과 표시 원칙을 설정합니다."],
    ["footer", "푸터 시스템", "출처·기관정보·페이지 번호의 표시 원칙을 설정합니다."],
    ["canvas", "슬라이드 규격", "화면비, 해상도와 안전영역을 정의합니다."],
    ["quality", "출력 완성도", "사실·문구·가독성과 픽셀 단위의 선명도를 지키는 기준을 확인합니다."],
    ["constraints", "고급 품질 보호", "꼭 필요한 경우에만 추가 품질 조건을 더합니다."],
  ];
  const CORE_GUIDE_SECTIONS = new Set(["project", "direction", "composition", "colors", "typography", "background", "canvas", "quality"]);
  const PRIMARY_JOURNEY_SECTIONS = new Set(["project", "direction", "composition", "colors", "typography"]);
  const JOURNEY_STAGES = [
    { id: "format", group: "규격", title: "출력 규격과 예약 영역", shortTitle: "규격", description: "이미지 크기와 본문이 침범하지 않을 헤더·푸터·안전 여백만 정합니다.", scope: "캔버스 · 헤더/푸터 면적 · 정보 항목 · 본문 여백", boundary: "색상·정렬·장식 방식과 실제 문구는 지정하지 않음", sections: ["canvas", "header", "footer"] },
    { id: "style", group: "인상", title: "전체 시각 인상", shortTitle: "인상", description: "갤러리에서 시작점을 고르고 발표 전체가 유지할 시각적 태도를 조정합니다.", scope: "스타일 출발점 · 공식성 · 에너지 · 표현 강도", boundary: "개별 페이지의 콘텐츠와 구도를 고정하지 않음", sections: ["direction"] },
    { id: "palette", group: "색상", title: "팔레트와 기본 배경", shortTitle: "색상", description: "필터와 실제 미리보기로 팔레트를 고르고 기본 캔버스만 정합니다.", scope: "역할 색상 · 팔레트 배경 또는 흰색 기본 배경", boundary: "색온도·채도·대비는 결과 팔레트를 찾는 필터로만 사용", sections: ["colors"] },
    { id: "type", group: "가독성", title: "글자와 정보 강조", shortTitle: "강조", description: "긴 설명의 읽기와 핵심 문장·수치의 존재감 사이에서 우선순위를 정합니다.", scope: "본문 가독성 · 제목/핵심 수치 강조", boundary: "정확한 글꼴명·폰트 크기·본문 분량은 지정하지 않음", sections: ["typography"] },
    { id: "resources", group: "표현", title: "활용 가능한 이미지와 그래픽", shortTitle: "자원", description: "AI가 내용에 맞춰 선택할 수 있는 시각 자원의 범위를 정합니다.", scope: "사진 · 합성 · 아이콘 · 그라데이션 · 3D · 일러스트 · 데이터 · 다이어그램 · 타이포", boundary: "선택한 자원을 매 슬라이드에 의무적으로 사용하지 않음", sections: ["photoComposite", "background", "composition", "quality"] },
  ];
  const JOURNEY_PROFILE_META = {
    inform: { dimension: "지식", label: "알리기", help: "무엇이 사실이고 달라졌는지 정확히 알게 합니다.", outcome: "청중이 핵심 사실과 현황을 정확히 파악한다.", grammar: "stable", project: { purpose: "핵심 정보와 현황을 명확히 공유", action: "핵심 사실과 의미를 정확히 파악", level: "general" }, settings: { intensity: "restrained", keywords: ["명료함", "신뢰감", "정돈", "접근성"], color: "corporateNavy", background: "report", header: "simple", footer: "source", typography: "public", photoLevel: "conditional", photoScope: "content", visualRole: "evidence", pageNumberLocation: "footer" } },
    explain: { dimension: "이해", label: "설명하기", help: "왜 그런지, 어떻게 연결되는지 이해시킵니다.", outcome: "청중이 원인·구조·작동 방식을 설명할 수 있다.", grammar: "controlled", project: { purpose: "원인과 구조, 작동 방식을 논리적으로 설명", action: "핵심 관계와 작동 원리를 이해", level: "practitioner" }, settings: { intensity: "balanced", keywords: ["명료함", "구조적", "논리적", "접근성"], color: "futureTech", background: "report", header: "simple", footer: "source", typography: "technical", photoLevel: "conditional", photoScope: "content", visualRole: "explanation", pageNumberLocation: "footer" } },
    decide: { dimension: "판단", label: "결정받기", help: "대안과 근거를 비교해 하나를 판단하게 합니다.", outcome: "청중이 근거를 바탕으로 선택하거나 승인한다.", grammar: "dataFocus", project: { purpose: "대안과 근거를 비교해 의사결정을 지원", action: "최적 대안을 선택하거나 계획을 승인", level: "practitioner" }, settings: { intensity: "emphasis", keywords: ["신뢰감", "비교 가능성", "명료함", "결론 중심"], color: "corporateNavy", background: "data", header: "presentation", footer: "source", typography: "data", photoLevel: "off", photoScope: "content", visualRole: "evidence", pageNumberLocation: "footer" } },
    act: { dimension: "행동", label: "행동시키기", help: "정해진 다음 행동을 바로 시작하게 합니다.", outcome: "청중이 우선순위에 맞춰 구체적인 후속 행동을 시작한다.", grammar: "dynamic", project: { purpose: "실행 방향과 우선순위를 정렬", action: "구체적인 후속 행동에 착수", level: "practitioner" }, settings: { intensity: "emphasis", keywords: ["역동성", "우선순위", "명료함", "실행력"], color: "corporateNavy", background: "conditional", header: "presentation", footer: "divider", typography: "data", photoLevel: "conditional", photoScope: "content", visualRole: "context", pageNumberLocation: "footer" } },
    teach: { dimension: "역량", label: "가르치기", help: "방법과 절차를 익혀 스스로 수행하게 합니다.", outcome: "청중이 배운 방법이나 절차를 스스로 수행한다.", grammar: "controlled", project: { purpose: "방법과 절차를 단계적으로 교육", action: "배운 방법을 스스로 적용", level: "general" }, settings: { intensity: "balanced", keywords: ["친근함", "단계성", "명료함", "안정감"], color: "futureTech", background: "report", header: "presentation", footer: "minimal", typography: "education", photoLevel: "conditional", photoScope: "content", visualRole: "explanation", pageNumberLocation: "footer" } },
    inspire: { dimension: "태도", label: "공감 열기", help: "새로운 관점과 가능성에 마음을 열게 합니다.", outcome: "청중이 새로운 관점을 받아들이고 핵심 메시지를 기억한다.", grammar: "editorial", project: { purpose: "새로운 관점과 가능성에 대한 공감을 형성", action: "핵심 메시지를 기억하고 주변에 확산", level: "general" }, settings: { intensity: "emphasis", keywords: ["고유함", "감성", "미래지향", "기억성"], color: "premium", background: "premium", header: "minimal", footer: "minimal", typography: "premium", photoLevel: "preferred", photoScope: "content", visualRole: "atmosphere", pageNumberLocation: "none" } },
  };
  const PROFILE_GRAMMAR_VALUES = {
    stable: { formLanguage: "preciseGeometric", lineLanguage: "minimalDivider", surfaceLanguage: "flat", spatialRhythm: "ordered", hierarchyBehavior: "scalePosition" },
    controlled: { formLanguage: "preciseGeometric", lineLanguage: "fineStructural", surfaceLanguage: "controlledLayer", spatialRhythm: "asymmetricEditorial", hierarchyBehavior: "scalePosition" },
    dataFocus: { formLanguage: "preciseGeometric", lineLanguage: "fineStructural", surfaceLanguage: "mattePanels", spatialRhythm: "modular", hierarchyBehavior: "colorScale" },
    dynamic: { formLanguage: "mixed", lineLanguage: "boldDirectional", surfaceLanguage: "controlledLayer", spatialRhythm: "flowing", hierarchyBehavior: "layerPosition" },
    editorial: { formLanguage: "mixed", lineLanguage: "minimalDivider", surfaceLanguage: "controlledLayer", spatialRhythm: "asymmetricEditorial", hierarchyBehavior: "whitespaceScale" },
  };

  const COLOR_PRESETS = {
    publicBlue: ["공공기관 블루", { primary: "#005BAC", secondary: "#56718F", accent: "#D63B32", background: "#FFFFFF", surface: "#F3F6FA", textPrimary: "#111827", textSecondary: "#667085", border: "#CBD5E1" }],
    corporateNavy: ["기업 네이비", { primary: "#12315B", secondary: "#52708F", accent: "#18A0A8", background: "#F8FAFC", surface: "#FFFFFF", textPrimary: "#111827", textSecondary: "#667085", border: "#D0D5DD" }],
    futureTech: ["미래기술", { primary: "#0A2E6D", secondary: "#165D8F", accent: "#00A8C6", background: "#F5FAFF", surface: "#FFFFFF", textPrimary: "#0F172A", textSecondary: "#52647A", border: "#B8CCDE" }],
    mono: ["모노톤", { primary: "#252A31", secondary: "#6B7280", accent: "#111827", background: "#FFFFFF", surface: "#F5F5F5", textPrimary: "#111111", textSecondary: "#666666", border: "#D4D4D4" }],
    premium: ["프리미엄", { primary: "#1D2738", secondary: "#6A655C", accent: "#B08D57", background: "#F8F6F1", surface: "#FFFFFF", textPrimary: "#171717", textSecondary: "#68625B", border: "#D8D0C4" }],
  };

  const DESIGN_PRESETS = {
    public_policy: ["공공기관 정책보고", { intensity: "restrained", keywords: ["신뢰감", "전문성", "명료함", "데이터 중심"], colorPreset: "publicBlue", background: "lightNeutral", header: "leftRule", footer: "source", headline: "authoritative" }],
    public_plan: ["공공기관 사업계획", { intensity: "balanced", keywords: ["신뢰감", "전문성", "미래지향", "명료함"], colorPreset: "publicBlue", background: "lightNeutral", header: "thinBar", footer: "source", headline: "modern" }],
    technology: ["기술개발 발표", { intensity: "balanced", keywords: ["미래지향", "기술적", "전문성", "데이터 중심"], colorPreset: "futureTech", background: "gradient", header: "plain", footer: "minimal", headline: "modern" }],
    evaluation: ["선정평가 발표", { intensity: "emphasis", keywords: ["신뢰감", "권위감", "명료함", "데이터 중심"], colorPreset: "corporateNavy", background: "lightNeutral", header: "numberTitle", footer: "minimal", headline: "authoritative" }],
    strategy: ["기업 전략보고", { intensity: "balanced", keywords: ["전문성", "명료함", "역동성", "데이터 중심"], colorPreset: "corporateNavy", background: "solid", header: "thinBar", footer: "minimal", headline: "modern" }],
    ir: ["투자유치 IR", { intensity: "emphasis", keywords: ["전문성", "미래지향", "역동성", "고급스러움"], colorPreset: "premium", background: "gradient", header: "plain", footer: "minimal", headline: "modern" }],
    education: ["교육·강의자료", { intensity: "balanced", keywords: ["친근함", "명료함", "전문성"], colorPreset: "futureTech", background: "lightNeutral", header: "thinBar", footer: "minimal", headline: "friendly" }],
    minimal: ["미니멀 보고서", { intensity: "restrained", keywords: ["명료함", "전문성", "고급스러움"], colorPreset: "mono", background: "solid", header: "plain", footer: "source", headline: "restrained" }],
  };

  const DESIGN_PRESET_EN = {
    public_policy: "public-sector policy report",
    public_plan: "public-sector business plan",
    technology: "technology development presentation",
    evaluation: "evaluation presentation",
    strategy: "corporate strategy report",
    ir: "investor relations presentation",
    education: "educational presentation",
    minimal: "minimal editorial report",
  };
  const DESIGN_PRESET_META = {
    public_policy: ["정책·공공 보고", "신뢰와 데이터 전달을 우선"],
    public_plan: ["사업계획·제안", "미래 방향과 실행계획을 균형 있게"],
    technology: ["기술·연구 발표", "기술 구조와 혁신성을 명확하게"],
    evaluation: ["평가·심사자료", "근거와 핵심 성과를 강하게"],
    strategy: ["전략·성과보고", "논리와 실행력을 선명하게"],
    ir: ["IR·투자제안", "성장성과 고급감을 강조"],
    education: ["교육·안내자료", "친근하고 이해하기 쉽게"],
    minimal: ["미니멀 프레젠테이션", "장식을 줄이고 내용에 집중"],
  };
  const DESIGN_COMPOSITION_MAP = { public_policy: "controlled", public_plan: "controlled", technology: "dynamic", evaluation: "dataFocus", strategy: "dataFocus", ir: "editorial", education: "controlled", minimal: "stable" };

  const COMPOSITION_PROFILES = {
    stable: { label: "안정적 보고형", help: "정돈된 정렬과 명확한 읽기 순서", values: { energy: "stable", grid: "symmetric", scaleContrast: "medium", depth: "flat", overlap: "none", flow: "linear", repetition: "uniform", density: "balanced", container: "mixed", whitespacePercent: 22, majorGapPercent: 3, relatedGapPercent: 1, panelPaddingPercent: 2, focalAreaPercent: 36, focalScaleRatio: "1.5", semanticZones: 4, layerCount: 3, mediumPairing: "single", meaningfulGraphics: true, layoutDiversity: false, maxConsecutiveLayout: 3, iconEnabled: true } },
    controlled: { label: "통제된 역동성", help: "신뢰감을 유지하며 초점과 변주를 강화", values: { energy: "balanced", grid: "asymmetricModular", scaleContrast: "strong", depth: "shallow", overlap: "selective", flow: "adaptive", repetition: "focal", density: "balanced", container: "mixed", whitespacePercent: 24, majorGapPercent: 3, relatedGapPercent: 1, panelPaddingPercent: 2, focalAreaPercent: 40, focalScaleRatio: "1.7", semanticZones: 4, layerCount: 4, mediumPairing: "contextAnnotation", meaningfulGraphics: true, layoutDiversity: true, maxConsecutiveLayout: 2, iconEnabled: true } },
    dataFocus: { label: "데이터 포커스", help: "정보 관계와 핵심 데이터를 우선", values: { energy: "balanced", grid: "modular", scaleContrast: "strong", depth: "shallow", overlap: "selective", flow: "adaptive", repetition: "focal", density: "dense", container: "borderless", whitespacePercent: 18, majorGapPercent: 3, relatedGapPercent: 1, panelPaddingPercent: 2, focalAreaPercent: 42, focalScaleRatio: "1.7", semanticZones: 4, layerCount: 3, mediumPairing: "dataDiagram", meaningfulGraphics: true, layoutDiversity: true, maxConsecutiveLayout: 2, iconEnabled: false } },
    dynamic: { label: "다이내믹 테크", help: "방향성 있는 흐름과 레이어를 적극 활용", values: { energy: "dynamic", grid: "asymmetricModular", scaleContrast: "strong", depth: "layered", overlap: "active", flow: "diagonal", repetition: "varied", density: "balanced", container: "mixed", whitespacePercent: 18, majorGapPercent: 3, relatedGapPercent: 1, panelPaddingPercent: 2, focalAreaPercent: 42, focalScaleRatio: "1.9", semanticZones: 4, layerCount: 5, mediumPairing: "technicalHybrid", meaningfulGraphics: true, layoutDiversity: true, maxConsecutiveLayout: 2, iconEnabled: true } },
    editorial: { label: "에디토리얼 프리미엄", help: "강한 타이포 위계와 여백, 선택적 중첩", values: { energy: "dynamic", grid: "editorial", scaleContrast: "strong", depth: "shallow", overlap: "selective", flow: "adaptive", repetition: "varied", density: "airy", container: "borderless", whitespacePercent: 30, majorGapPercent: 4, relatedGapPercent: 2, panelPaddingPercent: 2, focalAreaPercent: 44, focalScaleRatio: "1.9", semanticZones: 3, layerCount: 4, mediumPairing: "editorialHybrid", meaningfulGraphics: true, layoutDiversity: true, maxConsecutiveLayout: 2, iconEnabled: false } },
  };

  const TYPOGRAPHY_PRESETS = {
    public: { label: "공공 보고서 기본", help: "정책·기관 발표", note: "신뢰와 한글 가독성", values: { family: "sans", fontName: "Pretendard", fallback: "clean Korean sans-serif", headlineCharacter: "authoritative", bodyCharacter: "legible", headlineScale: "large", bodyScale: "standard", lineHeight: "standard", letterSpacing: "standard", emphasizeNumbers: true } },
    data: { label: "데이터·성과 강조", help: "실적·지표·분석", note: "큰 수치와 선명한 라벨", values: { family: "sans", fontName: "SUIT", fallback: "clear Korean sans-serif", headlineCharacter: "modern", bodyCharacter: "legible", headlineScale: "xlarge", bodyScale: "standard", lineHeight: "standard", letterSpacing: "standard", emphasizeNumbers: true } },
    technical: { label: "기술·연구 발표", help: "R&D·기술 설명", note: "정밀하고 구조적인 인상", values: { family: "sans", fontName: "Noto Sans KR", fallback: "technical Korean sans-serif", headlineCharacter: "modern", bodyCharacter: "technical", headlineScale: "large", bodyScale: "compact", lineHeight: "standard", letterSpacing: "standard", emphasizeNumbers: true } },
    education: { label: "교육·안내형", help: "교육자료·매뉴얼", note: "친근하고 여유 있게", values: { family: "sans", fontName: "Pretendard", fallback: "friendly Korean sans-serif", headlineCharacter: "friendly", bodyCharacter: "legible", headlineScale: "large", bodyScale: "large", lineHeight: "wide", letterSpacing: "standard", emphasizeNumbers: true } },
    premium: { label: "고급 제안·IR", help: "제안서·투자 발표", note: "절제된 제목 대비", values: { family: "mixed", fontName: "Pretendard", fallback: "refined Korean sans-serif with restrained serif accents", headlineCharacter: "restrained", bodyCharacter: "neutral", headlineScale: "xlarge", bodyScale: "standard", lineHeight: "wide", letterSpacing: "wide", emphasizeNumbers: true } },
    editorial: { label: "미니멀 에디토리얼", help: "브랜드·트렌드", note: "여백과 간결한 위계", values: { family: "mixed", fontName: "Noto Serif KR", fallback: "clean Korean editorial serif", headlineCharacter: "restrained", bodyCharacter: "legible", headlineScale: "large", bodyScale: "standard", lineHeight: "wide", letterSpacing: "standard", emphasizeNumbers: false } },
  };

  const IMAGERY_PROFILES = {
    report: { label: "보고서 기본", help: "기관·정책·사업 발표", note: "필요할 때만 이미지 사용", values: { iconEnabled: true, imageEnabled: true, iconStyle: "line", iconPurpose: "structure", imageStyle: "conditional", imagePurpose: "whenNeeded", allowMixedStyles: false, photoCompositeMode: "conditional", photoCompositePrimary: "card", photoCompositeSecondary: "none", photoCompositeCardPlacement: "side", photoCompositeMaxZones: 1, photoCompositeMaxAreaPercent: 30 } },
    data: { label: "데이터 중심", help: "실적·분석·성과", note: "그래프와 수치에 집중", values: { iconEnabled: true, imageEnabled: false, iconStyle: "geometric", iconPurpose: "highlight", imageStyle: "none", imagePurpose: "none", allowMixedStyles: false, photoCompositeMode: "off", photoCompositePrimary: "accent", photoCompositeSecondary: "none", photoCompositeCardPlacement: "side", photoCompositeMaxZones: 1, photoCompositeMaxAreaPercent: 20 } },
    technology: { label: "기술·연구 설명", help: "R&D·공정·구조", note: "개념과 구조 시각화", values: { iconEnabled: true, imageEnabled: true, iconStyle: "geometric", iconPurpose: "process", imageStyle: "3d", imagePurpose: "concept", allowMixedStyles: false, photoCompositeMode: "off", photoCompositePrimary: "card", photoCompositeSecondary: "none", photoCompositeCardPlacement: "side", photoCompositeMaxZones: 1, photoCompositeMaxAreaPercent: 25 } },
    education: { label: "교육·안내형", help: "교육자료·매뉴얼", note: "단계와 이해를 보조", values: { iconEnabled: true, imageEnabled: true, iconStyle: "solid", iconPurpose: "process", imageStyle: "vector", imagePurpose: "explain", allowMixedStyles: false, photoCompositeMode: "off", photoCompositePrimary: "card", photoCompositeSecondary: "none", photoCompositeCardPlacement: "side", photoCompositeMaxZones: 1, photoCompositeMaxAreaPercent: 25 } },
    field: { label: "현장·사례 중심", help: "사업 현장·제품·사례", note: "실제 장면을 우선", values: { iconEnabled: true, imageEnabled: true, iconStyle: "line", iconPurpose: "structure", imageStyle: "photo", imagePurpose: "evidence", allowMixedStyles: false, photoCompositeMode: "conditional", photoCompositePrimary: "card", photoCompositeSecondary: "background", photoCompositeCardPlacement: "side", photoCompositeMaxZones: 2, photoCompositeMaxAreaPercent: 35 } },
    minimal: { label: "시각자료 최소화", help: "문서형·텍스트 중심", note: "이미지와 아이콘 미사용", values: { iconEnabled: false, imageEnabled: false, iconStyle: "none", iconPurpose: "none", imageStyle: "none", imagePurpose: "none", allowMixedStyles: false, photoCompositeMode: "off", photoCompositePrimary: "card", photoCompositeSecondary: "none", photoCompositeCardPlacement: "side", photoCompositeMaxZones: 1, photoCompositeMaxAreaPercent: 20 } },
  };

  const BACKGROUND_PROFILES = {
    report: { label: "깨끗한 보고서", help: "기관·정책·사업 발표", note: "내용을 가장 또렷하게", values: { purpose: "focus", type: "lightNeutral", zoneSeparation: 4, opacity: 75, blur: "none", avoidBusyBackground: true } },
    data: { label: "데이터 가독성", help: "실적·분석·성과", note: "정보 관계에 집중", values: { purpose: "data", type: "solid", zoneSeparation: 3, opacity: 85, blur: "none", avoidBusyBackground: true } },
    technology: { label: "기술·미래형", help: "R&D·기술 설명", note: "절제된 분위기 추가", values: { purpose: "atmosphere", type: "gradient", zoneSeparation: 4, opacity: 70, blur: "none", avoidBusyBackground: true } },
    premium: { label: "프리미엄 제안", help: "IR·브랜드 제안", note: "은은한 깊이와 여백", values: { purpose: "premium", type: "gradient", zoneSeparation: 4, opacity: 70, blur: "none", avoidBusyBackground: true } },
    conditional: { label: "슬라이드별 판단", help: "구성이 다양한 자료", note: "공통 배경을 최소 지정", values: { purpose: "conditional", type: "conditional", zoneSeparation: 3, opacity: 75, blur: "none", avoidBusyBackground: true } },
  };

  const HEADER_PROFILES = {
    report: { label: "보고서 기본", help: "정책·기관·사업 보고", note: "섹션 흐름을 또렷하게", values: { type: "leftRule", surfaceRole: "primaryTint", heightPercent: 12, align: "left", showSectionLabel: true, showSubtitle: false, divider: true } },
    presentation: { label: "발표 흐름 강조", help: "발표·평가·제안", note: "번호와 제목을 함께", values: { type: "numberTitle", surfaceRole: "primarySolid", heightPercent: 14, align: "left", showSectionLabel: true, showSubtitle: true, divider: false } },
    simple: { label: "간결한 상단", help: "데이터·전략 보고", note: "얇은 선으로만 구분", values: { type: "thinBar", surfaceRole: "primaryTint", heightPercent: 9, align: "left", showSectionLabel: true, showSubtitle: false, divider: false } },
    minimal: { label: "최소 표현", help: "미니멀·브랜드 발표", note: "제목 영역만 확보", values: { type: "plain", surfaceRole: "transparent", heightPercent: 8, align: "left", showSectionLabel: false, showSubtitle: false, divider: false } },
    none: { label: "헤더 사용 안 함", help: "표지형·자유 구성", note: "공통 헤더 비설정", values: { type: "none", surfaceRole: "transparent", heightPercent: 8, align: "left", showSectionLabel: false, showSubtitle: false, divider: false } },
  };

  const FOOTER_PROFILES = {
    source: { label: "출처 중심", help: "보고서·정책자료", note: "출처 영역을 안정적으로 확보", values: { type: "source", surfaceRole: "lightNeutral", heightPercent: 7, align: "left", divider: true } },
    institution: { label: "기관정보 중심", help: "대외 발표·제안서", note: "기관정보 영역을 반복", values: { type: "institution", surfaceRole: "secondaryTint", heightPercent: 7, align: "left", divider: true } },
    divider: { label: "얇은 구분선", help: "데이터·전략 보고", note: "정보 없이 영역만 분리", values: { type: "divider", surfaceRole: "lightNeutral", heightPercent: 4, align: "left", divider: true } },
    minimal: { label: "최소 하단", help: "일반 발표·교육자료", note: "투명한 최소 정보 영역", values: { type: "minimal", surfaceRole: "transparent", heightPercent: 4, align: "right", divider: false } },
    none: { label: "푸터 사용 안 함", help: "표지형·자유 구성", note: "공통 푸터 비설정", values: { type: "none", surfaceRole: "transparent", heightPercent: 4, align: "left", divider: false } },
  };

  const COMPONENT_PROFILES = {
    report: { label: "보고서 기본", help: "읽기 쉬운 카드·표·차트", cardPreset: "clean", tablePreset: "readable", chartPreset: "presentation", enabled: [true, true, true] },
    minimal: { label: "최소 구성", help: "선과 장식을 최대한 줄임", cardPreset: "minimal", tablePreset: "minimal", chartPreset: "minimal", enabled: [true, true, true] },
    data: { label: "데이터 강조", help: "핵심 수치와 비교를 선명하게", cardPreset: "emphasis", tablePreset: "data", chartPreset: "data", enabled: [true, true, true] },
    none: { label: "모두 비설정", help: "개별 슬라이드 판단에 맡김", cardPreset: "clean", tablePreset: "readable", chartPreset: "presentation", enabled: [false, false, false] },
  };
  const CARD_PRESETS = {
    clean: { label: "깔끔한 카드", help: "밝은 배경과 얇은 선", values: { cardBackground: "surface", cardBorder: "subtle", cardCorner: "medium", cardShadow: "subtle", cardPadding: "standard" } },
    outline: { label: "테두리 카드", help: "그림자 없이 경계를 명확하게", values: { cardBackground: "surface", cardBorder: "strong", cardCorner: "small", cardShadow: "none", cardPadding: "standard" } },
    emphasis: { label: "강조 카드", help: "대표색을 옅게 사용", values: { cardBackground: "tint", cardBorder: "subtle", cardCorner: "medium", cardShadow: "subtle", cardPadding: "wide" } },
    minimal: { label: "최소 표현", help: "배경·테두리·그림자 없음", values: { cardBackground: "none", cardBorder: "none", cardCorner: "square", cardShadow: "none", cardPadding: "compact" } },
  };
  const TABLE_PRESETS = {
    readable: { label: "읽기 편한 표", help: "옅은 헤더와 행 구분", values: { tableHeader: "primaryTint", tableDensity: "standard", tableVerticalLines: false, tableRowDividers: true } },
    minimal: { label: "간결한 표", help: "색을 줄이고 여백 확보", values: { tableHeader: "plain", tableDensity: "airy", tableVerticalLines: false, tableRowDividers: true } },
    data: { label: "데이터 강조 표", help: "헤더와 수치 구분을 선명하게", values: { tableHeader: "primary", tableDensity: "standard", tableVerticalLines: false, tableRowDividers: true } },
    compact: { label: "정보 밀집 표", help: "많은 행을 촘촘하게", values: { tableHeader: "primaryTint", tableDensity: "compact", tableVerticalLines: false, tableRowDividers: true } },
  };
  const CHART_PRESETS = {
    presentation: { label: "발표용 간결형", help: "핵심값과 필요한 축만", values: { chartAxes: "minimal", chartGrid: "minimal", chartLegend: "whenNeeded", chartLabels: "keyOnly" } },
    minimal: { label: "최소 표현", help: "축·격자·범례를 최소화", values: { chartAxes: "none", chartGrid: "none", chartLegend: "none", chartLabels: "keyOnly" } },
    data: { label: "수치 강조형", help: "축과 데이터 값을 명확하게", values: { chartAxes: "clear", chartGrid: "minimal", chartLegend: "whenNeeded", chartLabels: "all" } },
    clean: { label: "비교 중심형", help: "격자 없이 항목 비교에 집중", values: { chartAxes: "minimal", chartGrid: "none", chartLegend: "whenNeeded", chartLabels: "keyOnly" } },
  };

  const CANVAS_PRESETS = {
    fhd: { label: "16:9 · FHD", help: "일반 발표·온라인 공유", aspectRatio: "16:9", width: 1920, height: 1080, orientation: "landscape", outputTarget: "screen" },
    qhd: { label: "16:9 · QHD", help: "고해상도 발표·대형 화면", aspectRatio: "16:9", width: 2560, height: 1440, orientation: "landscape", outputTarget: "screen" },
    uhd: { label: "16:9 · 4K", help: "초대형 화면·고품질 출력", aspectRatio: "16:9", width: 3840, height: 2160, orientation: "landscape", outputTarget: "screen" },
    standard: { label: "4:3 · 표준", help: "구형 프로젝터·문서형", aspectRatio: "4:3", width: 1600, height: 1200, orientation: "landscape", outputTarget: "screen" },
    a4Landscape: { label: "A4 · 가로", help: "인쇄용 보고서", aspectRatio: "a4-landscape", width: 3508, height: 2480, orientation: "landscape", outputTarget: "print" },
    a4Portrait: { label: "A4 · 세로", help: "세로형 인쇄 문서", aspectRatio: "a4-portrait", width: 2480, height: 3508, orientation: "portrait", outputTarget: "print" },
  };

  const KEYWORD_EN = {
    "신뢰감": "trustworthy",
    "전문성": "professional",
    "미래지향": "future-facing",
    "기술적": "technical",
    "친근함": "approachable",
    "권위감": "authoritative",
    "역동성": "dynamic",
    "고급스러움": "premium",
    "명료함": "clear",
    "데이터 중심": "data-led",
  };

  const DEFAULT_STATE = {
    schemaVersion: SCHEMA_VERSION,
    activeStep: 0,
    journey: { profileId: "", profileDirty: false, activeStage: 0, reviewedStages: [] },
    sectionEnabled: { project: true, canvas: true, direction: true, composition: true, colors: true, background: true, header: true, footer: true, typography: true, photoComposite: true, quality: true, constraints: false },
    project: { name: "새 공통 디자인", includeName: false, documentType: "presentation", purpose: "external", audienceRole: "", audience: "", audienceLevel: "general", audienceStance: "neutral", readingMode: "live", presentationPurpose: "", desiredAction: "", currentPerception: "", targetPerception: "", keyBarrier: "", governingThought: "", targetModel: "gpt_image", promptLanguage: "ko", outputMode: "standard", maxChars: 2400 },
    canvas: { aspectRatio: "16:9", width: 1920, height: 1080, orientation: "landscape", outputTarget: "screen", lockAspectRatio: true, safeAreaMode: "auto", safeAreaLinked: true, safeArea: { top: 6, right: 6, bottom: 6, left: 6, unit: "percent" } },
    frame: { headerHeightPercent: 9, footerHeightPercent: 6, bodySafeMarginPercent: 6, headerElements: "파트명, 제목, 부제", footerElements: "출처, 기관명, 날짜, 페이지 번호" },
    visualStyle: { formality: 2, energy: 3, expression: 3, presetId: "", presetVersion: 0, presetNameKo: "", presetNameEn: "", applyScope: "", presetFingerprint: "" },
    visualDirection: {
      source: "none",
      authority: 2,
      energy: 3,
      expression: 2,
      rationality: 2,
      geometry: 2,
      depth: 3,
      conceptKeywords: "신뢰, 명료, 연결",
      signatureMotif: "",
      designStatement: "",
      mediumId: "",
      mediumSource: "",
      mediumVersion: 1,
      mediumNameKo: "",
      mediumNameEn: "",
      mediumCategory: "",
      mediumGroup: "",
      mediumTexture: "",
      mediumUsage: "",
      mediumDescription: "",
      mediumPromptSummaryKo: "",
      mediumPromptSummaryEn: "",
    },
    composition: { profile: "controlled", formLanguage: "preciseGeometric", lineLanguage: "fineStructural", surfaceLanguage: "controlledLayer", spatialRhythm: "asymmetricEditorial", hierarchyBehavior: "scalePosition", consistencyAnchor: "타이포 위계, 역할 색상, 헤더·푸터 슬롯과 정렬 기준은 덱 전체에서 일관되게 유지", variationRule: "슬라이드의 주장과 증거 관계에 따라 레이아웃과 비주얼 형식은 달라지되 디자인 DNA는 유지", primaryVisualLanguage: "adaptive", secondaryVisualLanguage: "none", combinationPrinciple: "핵심 주장과 증거 관계를 가장 빨리 이해시키는 1~2개의 시각 언어를 선택해 하나의 장면으로 결합", resourceRange: "flexible", allowPhotography: true, allowDataVisualization: true, allowDiagram: true, allowPictogram: true, allowInfographic: true, allowMap: true, allowIllustration: true, allowTechnical3d: true, allowLayeredComposition: true, allowTypographicFocus: true, allowMixedMedia: true, allowOmission: true, energy: "balanced", grid: "asymmetricModular", scaleContrast: "strong", depth: "shallow", overlap: "selective", flow: "adaptive", repetition: "focal", density: "balanced", container: "mixed", layoutFreedom: "high", whitespacePercent: 24, majorGapPercent: 3, relatedGapPercent: 1, panelPaddingPercent: 2, focalAreaPercent: 40, focalScaleRatio: "1.7", semanticZones: 4, layerCount: 4, mediumPairing: "contextAnnotation", meaningfulGraphics: true, layoutDiversity: true, maxConsecutiveLayout: 2, iconEnabled: true },
    colors: { temperature: "neutralCool", saturationMood: "controlled", contrastMood: "clear", accentBehavior: "semantic", paletteIntent: "신뢰를 기본 인상으로 유지하고 핵심 지표·전환점·행동 요청에만 강조색을 집중", identityPattern: "currentDecision", deckColorRhythm: "sectionArc", photoHarmony: "frameNotTint", baseCanvas: "white", preset: "publicBlue", source: "common", presetId: "publicBlue", presetVersion: 1, paletteNameKo: "공공기관 블루", paletteNameEn: "Public Institution Blue", mode: "light", category: "official", usage: "corporate", originalColors: ["#005BAC", "#56718F", "#D63B32", "#FFFFFF", "#111827"], names: {}, primary: "#005BAC", secondary: "#56718F", accent: "#D63B32", background: "#FFFFFF", surface: "#F3F6FA", textPrimary: "#111827", textSecondary: "#667085", border: "#CBD5E1", usageFreedom: "adaptive", allowDerivedTones: true, allowAccentOmission: true, neutralAreaMinPercent: 55, neutralAreaMaxPercent: 72, primaryAreaMaxPercent: 22, secondaryAreaMaxPercent: 14, accentMaxAreaPercent: 10, requireDistinctSecondary: true, preservePhotoLocalColor: true, forbidGlobalHueWash: true },
    background: { source: "common", profile: "report", purpose: "focus", type: "lightNeutral", intensity: "restrained", zoneSeparation: 4, opacity: 75, blur: "none", avoidBusyBackground: true, photoMode: "off", photoSaturation: "natural", photoOverlay: "medium", photoLayerMode: "single", photoLayerLayout: "adaptive", photoLayerMaxImages: 3, photoLayerDepth: "subtle", photoLayerAvoidDuplication: true, photoAllowContextScene: true, photoProtectText: true, photoRealism: true },
    header: { source: "common", profile: "report", type: "leftRule", surfaceRole: "primaryTint", heightPercent: 12, align: "left", showSectionLabel: true, showSubtitle: false, showPageNumber: false, divider: true },
    footer: { source: "common", profile: "source", type: "source", surfaceRole: "lightNeutral", heightPercent: 7, align: "left", showPageNumber: true, divider: true },
    typography: { emphasis: "balanced", voice: "authoritativeModern", hierarchyStyle: "scaleWeight", rhythm: "balanced", emphasisPolicy: "핵심 문장·핵심 지표·성과 중 한 대상에만 크기와 굵기 대비를 집중", source: "common", presetId: "public", family: "sans", fontName: "Pretendard", fallback: "clean Korean sans-serif", headlineCharacter: "authoritative", bodyCharacter: "legible", headlineScale: "large", bodyScale: "standard", lineHeight: "standard", letterSpacing: "standard", emphasizeNumbers: true, avoidVerticalText: true, avoidLongTextInShapes: true, forbidMalformedKorean: true, minimizeSmallText: true, projectorMode: true, visualTypographyId: "", visualTypographyNameKo: "", visualTypographyNameEn: "", visualTypographyCategory: "", visualTypographyDescription: "", visualTypographyPromptSummary: "", visualTypographyScope: "headline", visualTypographyHighRisk: false },
    resources: { photo: "auto", layeredComposite: "auto", icons: "auto", gradients: "auto", threeD: "auto", illustration: "auto", dataVisualization: "auto", diagramInfographic: "auto", typographicFocal: "auto" },
    photoComposite: { visualRole: "evidence", layerLogic: "contextEvidenceAnnotation", styleBlend: "controlledHybrid", mode: "conditional", style: "adaptive", allowContextScene: true, primary: "accent", secondary: "none", dropWhenDense: true, protectText: true, protectData: true, realism: true },
    quality: { wcagLevel: "AA", projectorContrast: true, preserveExactText: true, preserveNumbers: true, readableAtDistance: true, renderKoreanAccurately: true },
    constraints: { forbidLogos: true, forbidWatermarks: true, forbidMockupFrames: true, forbidDeviceBezels: true, forbidFakeUI: true, forbidMeaninglessDecorations: true, forbidInventedContent: true, forbidDuplicateText: true, forbidMalformedKorean: true, forbidExcessiveEffects: true, paletteOnlyGraphics: false, customRule: "" },
    recommendationMeta: null,
    output: { text: "", generatedAt: null },
  };

  let state = loadDraft();
  let history = [];
  let future = [];
  let saveTimer = 0;
  let expandedSteps = new Set();
  let colorDraft = null;
  let colorHoverDraft = null;
  let colorUi = { query: "", intent: "all", temperature: "all", saturation: "all", contrast: "all", category: "all", mode: "all", usage: "all", visible: 12 };
  let directionDraft = null;
  const initialSlideStyleVisible = (category = "recommended") => category === "recommended"
    ? Math.max(24, SLIDE_STYLE_CATALOG?.list?.({ category: "recommended" })?.length || 0)
    : 24;
  const createSlideStyleUi = () => ({
    category: "recommended",
    query: "",
    draftId: "",
    visible: initialSlideStyleVisible("recommended"),
    useCase: "all",
    workStage: "all",
    documentType: "all",
    audience: "all",
    supportInstrument: "all",
    media: "all",
    promptPaletteMode: "preset",
    promptPaletteStyleId: "",
    promptColors: {},
  });
  let slideStyleUi = createSlideStyleUi();
  const SLIDE_STYLE_FACET_FILTERS = [
    {
      key: "useCase",
      label: "문서목적",
      options: [["all", "전체 목적"], ["proposal", "제안"], ["planning", "기획·계획"], ["strategy", "전략"], ["execution", "실행"], ["sales", "영업"], ["service", "서비스"], ["product", "제품"], ["partnership", "협업·제휴"], ["research", "연구"], ["public", "공공"]],
    },
    {
      key: "workStage",
      label: "업무단계",
      options: [["all", "전체 단계"], ["opportunity", "기회·문제 탐색"], ["proposal", "제안 설계"], ["planning", "실행계획"], ["strategy", "전략 수립"], ["execution", "수행·전환"], ["partnership", "협업·제휴"], ["research-planning", "연구기획"], ["monitoring", "모니터링"], ["discover", "기술 발굴"], ["diagnose", "진단"], ["evaluate", "평가·선정"], ["transfer", "기술이전·매칭"], ["poc", "PoC·실증"], ["market-entry", "시장진입"], ["performance", "성과관리"], ["risk", "리스크 대응"], ["event-promotion", "행사 모집·홍보"], ["event-agenda", "프로그램 구성"], ["event-delivery", "행사 진행"], ["event-followup", "결과·후속"]],
    },
    {
      key: "documentType",
      label: "문서유형",
      options: [["all", "전체 문서"], ["business-plan", "사업·전략계획"], ["bid-proposal", "입찰·수주제안"], ["execution-plan", "수행·실행계획"], ["service-plan", "서비스·제품기획"], ["commercial-proposal", "영업·협업제안"], ["public-research-plan", "공공·연구기획"], ["diagnostic-report", "종합진단"], ["evaluation-board", "선정평가"], ["roadmap", "전략 로드맵"], ["tech-brief", "Tech Brief"], ["matching-board", "기술 매칭"], ["poc-plan", "PoC 기획"], ["poc-result", "PoC 결과"], ["portfolio-dashboard", "포트폴리오 관제"], ["case-study", "우수사례"], ["bm-plan", "BM 설계"], ["terms-comparison", "이전조건 비교"], ["gtm-plan", "GTM 전략"], ["investment-linkage", "투자·금융"], ["market-linkage", "조달·수출"], ["performance-report", "성과관리"], ["risk-register", "리스크 대응"], ["event-overview", "행사 개요"], ["registration-call", "참가 모집"], ["workshop-agenda", "워크숍 일정"], ["speaker-profile", "연사 소개"], ["multi-track-program", "멀티트랙"], ["hands-on-workshop", "실습 안내"], ["roundtable-guide", "라운드테이블"], ["venue-guide", "현장 동선"], ["webinar-guide", "웨비나"], ["academic-symposium", "학술 프로그램"], ["demo-showcase", "데모데이"], ["post-event-followup", "행사 후속"]],
    },
    {
      key: "audience",
      label: "대상",
      options: [["all", "전체 대상"], ["institution", "지원기관"], ["company", "지원기업"], ["manager", "사업 책임자"], ["executive", "경영진"], ["evaluator", "평가위원"], ["buyer", "수요기업"], ["provider", "기술공급자"], ["partner", "협력기관"], ["investor", "투자자"], ["public", "대외 공개"], ["attendee", "참가자"], ["facilitator", "진행자"], ["speaker", "연사"], ["researcher", "연구자"], ["online-attendee", "온라인 참가자"]],
    },
    {
      key: "supportInstrument",
      label: "지원·진행수단",
      options: [["all", "전체 수단"], ["diagnostics", "진단"], ["consulting", "컨설팅"], ["rnbd", "R&BD"], ["matching", "기술 매칭"], ["transfer", "기술이전"], ["poc", "PoC·실증"], ["scale-up", "스케일업"], ["market-access", "시장진입"], ["investment", "투자"], ["guarantee", "보증"], ["loan", "융자"], ["procurement", "공공조달"], ["export", "수출"], ["portfolio-management", "포트폴리오"], ["performance-management", "성과관리"], ["risk-management", "리스크 관리"], ["in-person", "오프라인"], ["online", "온라인"], ["hybrid", "하이브리드"], ["networking", "네트워킹"]],
    },
    {
      key: "media",
      label: "표현방식",
      options: [["all", "전체 표현"], ["data", "데이터"], ["diagram", "다이어그램"], ["table", "표·비교"], ["photo", "사진"], ["typography", "타이포그래피"]],
    },
  ];
  const SLIDE_STYLE_FACET_LABELS = Object.fromEntries(SLIDE_STYLE_FACET_FILTERS.flatMap((filter) => filter.options.map(([value, labelText]) => [`${filter.key}:${value}`, labelText])));
  const SLIDE_STYLE_PROMPT_COLOR_ROLES = [
    ["background", "배경", "background"],
    ["primary", "주색", "primary"],
    ["secondary", "보조색", "secondary"],
    ["accent", "강조색", "accent"],
    ["textPrimary", "본문", "body text"],
  ];
  const SLIDE_STYLE_PROMPT_COMPOSITION_LABELS = {
    formLanguage: {
      preciseGeometric: "precise geometric forms",
      softGeometric: "soft geometric forms",
      organic: "organic curved forms",
      mixed: "a restrained blend of geometric and organic forms",
    },
    lineLanguage: {
      fineStructural: "fine structural lines",
      boldDirectional: "bold directional lines",
      minimalDivider: "minimal dividers",
      shapeLed: "color-field-led separation",
      softConnector: "soft connector lines",
    },
    surfaceLanguage: {
      flat: "flat surfaces",
      mattePanels: "matte panels",
      controlledLayer: "controlled layered surfaces",
      material: "selective material texture",
      glass: "restrained glass surfaces",
    },
    spatialRhythm: {
      ordered: "an ordered spatial rhythm",
      asymmetricEditorial: "an asymmetric editorial rhythm",
      modular: "a modular spatial rhythm",
      flowing: "a continuous flowing rhythm",
      causal: "a cause-and-effect flow",
      diagonal: "a diagonal directional rhythm",
      evidenceToDecision: "a flow from evidence to decision",
      exceptionDriven: "an exception-first flow",
      mirrored: "a mirrored comparison rhythm",
      narrative: "a narrative progression",
      parallel: "a parallel comparison rhythm",
      progressive: "a progressive sequence",
      radial: "a radial progression",
      sequential: "a sequential progression",
      spatial: "a spatial-relational progression",
      stacked: "a stacked progression",
      tabular: "a table-aligned rhythm",
    },
    primaryVisualLanguage: {
      adaptive: "a content-adaptive primary visual language",
      data: "data-visualization-led visuals",
      diagram: "diagram-led visuals",
      illustration: "illustration-led visuals",
      photo: "photography-led visuals",
      table: "table and comparison-led visuals",
      technical3d: "technical 3D-led visuals",
      threeD: "3D-object-led visuals",
      typography: "typography-led visuals",
    },
  };
  const SLIDE_STYLE_PROMPT_TYPOGRAPHY_LABELS = {
    public: "a practical presentation sans serif",
    data: "a data-optimized sans serif",
    editorial: "editorial contrast typography",
    premium: "premium editorial typography",
    technical: "technical-document typography",
  };
  let directionUi = {
    source: state.visualDirection.source === "visual-mixer" ? "mixer" : state.visualDirection.source === "custom" ? "custom" : "common",
    applyRelated: false,
    query: "",
    category: "recommended",
    group: "all",
    texture: "all",
    usage: "all",
    visible: 12,
  };
  let typographyDraft = null;
  let outputSettingsSnapshot = null;
  let quickStartDraft = createQuickStartDraft();
  let quickStartReturnFocus = null;
  let quickApplyNotice = null;
  let quickSetupUi = { mode: "quick", open: false };
  let quickSetupReturnFocus = null;
  let slideStyleGalleryOpen = false;
  let slideStyleGalleryReturnFocus = null;
  let slideStyleGalleryScrollTop = 0;
  let slideStyleGalleryObserver = null;
  let slideStyleGalleryLoading = false;
  let quickRandomState = null;
  let userPresets = loadUserPresets();
  let photoCompositeAdvancedOpen = false;
  let designAdvancedOpen = new Set();
  let inspirationStarterOpen = false;
  let institutionRandomState = null;
  let typographyUi = {
    source: state.typography.source === "visual-mixer" ? "mixer" : state.typography.source === "custom" ? "custom" : "common",
    category: "recommended",
    visible: 12,
    scope: state.typography.visualTypographyScope || "headline",
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function createQuickStartDraft(overrides = {}) {
    return {
      source: "", profile: "", secondaryProfiles: [], confidence: "review", confidenceLabel: "검토 필요",
      scores: {}, signals: [], factors: { dense: false, field: false, brandColors: [] },
      recommendations: [], selected: [], preserveDisabled: true, sourceLength: 0, ...overrides,
    };
  }
  function merge(base, incoming) {
    if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) return clone(base);
    const result = clone(base);
    Object.keys(incoming).forEach((key) => {
      if (incoming[key] && typeof incoming[key] === "object" && !Array.isArray(incoming[key]) && base[key] && typeof base[key] === "object" && !Array.isArray(base[key])) {
        result[key] = merge(base[key], incoming[key]);
      } else if (incoming[key] !== undefined) {
        result[key] = clone(incoming[key]);
      }
    });
    return result;
  }

  function slideStyleFingerprint(value = state) {
    const directionKeys = ["authority", "energy", "expression", "rationality", "geometry", "depth", "conceptKeywords", "signatureMotif", "designStatement", "mediumId", "mediumPromptSummaryKo", "mediumPromptSummaryEn"];
    const colorKeys = ["baseCanvas", "primary", "secondary", "accent", "background", "surface", "textPrimary", "textSecondary", "border"];
    const payload = {
      visualStyle: {
        formality: value.visualStyle?.formality,
        energy: value.visualStyle?.energy,
        expression: value.visualStyle?.expression,
      },
      visualDirection: Object.fromEntries(directionKeys.map((key) => [key, value.visualDirection?.[key]])),
      composition: value.composition,
      colors: Object.fromEntries(colorKeys.map((key) => [key, value.colors?.[key]])),
      typography: value.typography,
      resources: value.resources,
      background: value.background,
      header: value.header,
      footer: value.footer,
      photoComposite: value.photoComposite,
    };
    const input = JSON.stringify(payload);
    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function selectedSlideStyle() {
    return SLIDE_STYLE_CATALOG?.get?.(get("visualStyle.presetId")) || null;
  }

  function isSlideStyleCustomized() {
    const style = selectedSlideStyle();
    const fingerprint = get("visualStyle.presetFingerprint");
    return Boolean(style && fingerprint && fingerprint !== slideStyleFingerprint());
  }

  function buildSkillPresetContract(style = selectedSlideStyle()) {
    const settings = style?.settings || {};
    const composition = settings.composition || {};
    const explicitDistinctiveRules = Array.isArray(style?.distinctiveRules) ? style.distinctiveRules.filter(Boolean).slice(0, 6) : [];
    const direction = settings.visualDirection || {};
    const derivedDistinctiveRules = [
      direction.signatureMotif || state.visualDirection.signatureMotif ? `대표 모티프: ${direction.signatureMotif || state.visualDirection.signatureMotif}` : "",
      composition.primaryVisualLanguage || state.composition.primaryVisualLanguage ? `주 시각 언어: ${composition.primaryVisualLanguage || state.composition.primaryVisualLanguage}` : "",
      composition.formLanguage || state.composition.formLanguage ? `형태 문법: ${composition.formLanguage || state.composition.formLanguage}` : "",
      composition.surfaceLanguage || state.composition.surfaceLanguage ? `표면 문법: ${composition.surfaceLanguage || state.composition.surfaceLanguage}` : "",
      composition.spatialRhythm || state.composition.spatialRhythm ? `공간 리듬: ${composition.spatialRhythm || state.composition.spatialRhythm}` : "",
    ].filter(Boolean);
    const distinctiveRules = (explicitDistinctiveRules.length ? explicitDistinctiveRules : derivedDistinctiveRules).slice(0, 6);
    const avoidRules = Array.isArray(style?.avoidRules) ? style.avoidRules.filter(Boolean).slice(0, 6) : [];
    const roleVariants = {
      cover: {
        motifPhase: "introduce",
        presetRole: "덱의 시각 DNA를 하나의 히어로 장면과 제목 행동으로 선언",
        requiredBehaviors: ["대표 모티프 제시", "제목과 하나의 키 비주얼을 주도 요소로 사용"],
      },
      agenda: {
        motifPhase: "organize",
        presetRole: "같은 시각 DNA를 세션 관계와 탐색 체계로 변환",
        requiredBehaviors: ["실제 세션 관계에 맞는 내비게이션 구조", "번호·타이포·모티프의 일관된 탐색 리듬"],
      },
      divider: {
        motifPhase: "transform",
        presetRole: "대표 모티프를 하나의 전환 제스처로 변형",
        requiredBehaviors: ["전환 메시지 중심의 단일 공간 제스처", "본문보다 넓은 여백과 강한 장면 전환"],
      },
      closing: {
        motifPhase: "resolve",
        presetRole: "표지 모티프를 단순화해 최종 판단과 다음 행동으로 수렴",
        requiredBehaviors: ["표지 모티프의 완결된 회수", "하나의 결론 또는 요청으로 시각적 수렴"],
      },
      ...(style?.roleVariants || {}),
    };
    const currentPreset = {
      id: style?.id || state.visualStyle.presetId || "current-design-guide",
      nameKo: style?.nameKo || state.visualStyle.presetNameKo || "현재 디자인 가이드",
      nameEn: style?.nameEn || state.visualStyle.presetNameEn || "Current Design Guide",
      promptKo: style?.prompt?.ko || state.visualDirection.designStatement || "",
      promptEn: style?.prompt?.en || "",
      requiredTraits: distinctiveRules,
      forbiddenTraits: avoidRules,
      minimumRequiredTraits: distinctiveRules.length >= 2 ? 2 : distinctiveRules.length,
      compositionGrammar: {
        formLanguage: composition.formLanguage || state.composition.formLanguage,
        lineLanguage: composition.lineLanguage || state.composition.lineLanguage,
        surfaceLanguage: composition.surfaceLanguage || state.composition.surfaceLanguage,
        spatialRhythm: composition.spatialRhythm || state.composition.spatialRhythm,
        hierarchyBehavior: composition.hierarchyBehavior || state.composition.hierarchyBehavior,
        primaryVisualLanguage: composition.primaryVisualLanguage || state.composition.primaryVisualLanguage,
        secondaryVisualLanguage: composition.secondaryVisualLanguage || state.composition.secondaryVisualLanguage,
      },
      roleVariants,
    };
    return {
      version: SKILL_PRESET_CONTRACT_VERSION,
      precedence: [
        "user-source",
        "skill-content-semantics",
        "skill-composition-lock",
        "readability-data-integrity",
        "preset-required-visual-dna",
        "preset-preferred-treatment",
        "image-model-local-optimization",
      ],
      ownership: {
        skill: ["content", "facts", "figures", "evidenceStatus", "semanticGroups", "relationships", "readingPriority", "focalRole", "formatValues", "compositionAuthority"],
        preset: ["visualDNA", "layoutFamilies", "medium", "imageTreatment", "surfaceMaterial", "typographyBehavior", "objectGrammar", "signatureMotif"],
        imageModel: ["exactPosition", "exactScale", "spacing", "crop", "localContrast", "layerFinish"],
      },
      compositionAuthority: {
        open: "스킬의 의미·문구·수치·관계만 보존하고 프리셋의 구도·매체·그림체·이미지 처리를 강하게 적용",
        guided: "스킬의 의미 그룹·인접성·주 읽기 방향을 보존하고 호환되는 프리셋 레이아웃과 시각 처리를 적용",
        locked: "스킬의 큰 구도와 관계 토폴로지를 보존하고 프리셋의 타이포·형태·재질·선·이미지 처리와 마감을 적용",
      },
      preset: currentPreset,
      specialPageInheritance: {
        required: ["palette", "typographyDNA", "formLanguage", "surfaceLanguage", "spatialRhythm"],
        adaptive: ["imageTreatment", "materialTreatment", "signatureMotif"],
        skillOwned: ["content", "informationStructure", "macroComposition", "formatValues"],
        pageRoleControlled: ["headerFooter", "sourceBand", "pageNumber"],
      },
    };
  }

  function slideStylePromptLine(ko) {
    const style = selectedSlideStyle();
    if (!style) return "";
    const adjusted = isSlideStyleCustomized();
    const description = ko ? style.prompt?.ko : style.prompt?.en;
    if (!description) return "";
    const contractTraits = buildSkillPresetContract(style).preset?.requiredTraits || [];
    const signature = ko && contractTraits.length
      ? ` 대표 시그니처 ${contractTraits.slice(0, 3).join("·")} 중 ${Math.min(2, contractTraits.length)}개 이상을 색상 외의 형태·구도·매체·마감에서 분명히 표현한다.`
      : "";
    const avoid = ko && Array.isArray(style.avoidRules) && style.avoidRules.length
      ? ` ${style.avoidRules.slice(0, 3).join("·")}은 피한다.`
      : "";
    return ko
      ? `갤러리 출발점은 ${style.nameKo}(${style.nameEn})이다. ${description}${signature}${avoid}${adjusted ? " 갤러리 적용 후 조정된 현재 색상·강조·자원 설정을 더 높은 우선순위로 따른다." : ""}`
      : `Use ${style.nameEn} as the gallery starting point. ${description}${adjusted ? " Give the currently adjusted color, emphasis, and resource settings higher priority than the starting preset." : ""}`;
  }

  function normalizeSlideStylePromptColor(value, fallback = "#111827") {
    const normalized = String(value || "").trim().toUpperCase();
    if (/^#[0-9A-F]{6}$/.test(normalized)) return normalized;
    const normalizedFallback = String(fallback || "").trim().toUpperCase();
    return /^#[0-9A-F]{6}$/.test(normalizedFallback) ? normalizedFallback : "#111827";
  }

  function slideStylePromptColors(style, mode = slideStyleUi.promptPaletteMode) {
    const preset = style?.settings?.colors || {};
    const source = mode === "custom" ? (slideStyleUi.promptColors || {}) : preset;
    return Object.fromEntries(SLIDE_STYLE_PROMPT_COLOR_ROLES.map(([role]) => [
      role,
      normalizeSlideStylePromptColor(source[role], preset[role] || state.colors?.[role]),
    ]));
  }

  function resetSlideStylePromptPalette(style) {
    if (!style) return;
    slideStyleUi.promptPaletteStyleId = style.id;
    slideStyleUi.promptPaletteMode = "preset";
    slideStyleUi.promptColors = slideStylePromptColors(style, "preset");
  }

  function ensureSlideStylePromptPalette(style) {
    if (style && slideStyleUi.promptPaletteStyleId !== style.id) resetSlideStylePromptPalette(style);
  }

  function slideStylePromptPaletteName(style, mode = slideStyleUi.promptPaletteMode) {
    if (mode === "custom") return "Custom Palette";
    return style?.settings?.colors?.paletteNameEn || `${style?.nameEn || "Selected Style"} Default Palette`;
  }

  function slideStylePromptFragment(value) {
    return String(value || "").replace(/\s+/g, " ").trim().replace(/[.!?。]+$/u, "");
  }

  function buildSlideStyleCopyPrompt(style, palette = slideStylePromptColors(style), paletteName = slideStylePromptPaletteName(style)) {
    if (!style) return "";
    const composition = style.settings?.composition || {};
    const compositionTraits = ["formLanguage", "lineLanguage", "surfaceLanguage", "spatialRhythm", "primaryVisualLanguage"]
      .map((key) => SLIDE_STYLE_PROMPT_COMPOSITION_LABELS[key]?.[composition[key]])
      .filter(Boolean);
    const typography = style.settings?.typography || {};
    const typographyTraits = [
      SLIDE_STYLE_PROMPT_TYPOGRAPHY_LABELS[style.settings?.typographyPreset],
      { restrained: "restrained headlines", modern: "modern headlines", classic: "classic headlines" }[typography.headlineCharacter],
      { reading: "reading-first hierarchy", balanced: "balanced emphasis", strong: "strong focal emphasis" }[typography.emphasis],
      { airy: "an airy rhythm", balanced: "a balanced rhythm", compact: "a compact information rhythm", dramatic: "dramatic scale contrast" }[typography.rhythm],
    ].filter(Boolean);
    const styleDirection = slideStylePromptFragment(style.prompt?.en);
    const resolvedPalette = Object.fromEntries(SLIDE_STYLE_PROMPT_COLOR_ROLES.map(([role]) => [role, normalizeSlideStylePromptColor(palette?.[role], style.settings?.colors?.[role])]));
    const colorRoles = SLIDE_STYLE_PROMPT_COLOR_ROLES.map(([role, , labelTextEn]) => `${labelTextEn} ${resolvedPalette[role]}`).join("; ");
    const clauses = [
      `Design directive: Apply the visual DNA of “${style.nameEn || style.nameKo}” across the entire presentation instead of using a default PowerPoint theme or a generic template.`,
      styleDirection ? `${styleDirection}.` : "",
      `Maintain the functional roles of the “${paletteName}” palette: ${colorRoles}. Reserve the accent color for key figures, conclusions, and calls to action. Do not introduce additional colors except tonal variants required for legibility.`,
      compositionTraits.length ? `Keep these visual and compositional traits consistent: ${[...new Set(compositionTraits)].join("; ")}.` : "",
      typographyTraits.length ? `Establish a clear hierarchy among titles, body text, and figures using ${[...new Set(typographyTraits)].join("; ")}.` : "",
      "Vary the layouts for the cover, agenda, section dividers, content slides, and closing according to their purpose while retaining the same palette, typography, and visual motifs.",
      "Avoid mechanically repeating the same card grid, meaningless decoration, fake logos or watermarks, and illegibly small text.",
      "Preserve all provided Korean text, numbers, dates, and proper nouns exactly as written. Do not translate, paraphrase, summarize, omit, or invent any content.",
    ];
    return clauses.filter(Boolean).join(" ");
  }

  function renderSlideStylePromptTool(style) {
    ensureSlideStylePromptPalette(style);
    const mode = ["preset", "custom"].includes(slideStyleUi.promptPaletteMode) ? slideStyleUi.promptPaletteMode : "preset";
    const palette = slideStylePromptColors(style, mode);
    const paletteModes = [
      ["preset", "스타일 기본색"],
      ["custom", "색상 직접 지정"],
    ].map(([value, labelText]) => `<button type="button" class="${mode === value ? "active" : ""}" data-slide-style-prompt-palette-mode="${value}" aria-pressed="${mode === value}">${labelText}</button>`).join("");
    const colorFields = SLIDE_STYLE_PROMPT_COLOR_ROLES.map(([role, labelText]) => `<label><span>${labelText}</span><div><input type="color" value="${palette[role]}" data-slide-style-prompt-color="${role}" aria-label="${escapeHtml(`${style.nameKo} ${labelText} 직접 선택`)}"><code data-slide-style-prompt-color-value="${role}">${palette[role]}</code></div></label>`).join("");
    const prompt = buildSlideStyleCopyPrompt(style, palette, slideStylePromptPaletteName(style, mode));
    return `<section class="cpd-slide-style-prompt-tool" aria-labelledby="cpdSlideStylePromptTitle"><header><span>COPY &amp; USE</span><strong id="cpdSlideStylePromptTitle">발표자료 제작용 문구</strong><small>“발표자료 만들어줘.” 다음에 붙여넣을 디자인 지시문만 복사합니다.</small></header><div class="cpd-slide-style-prompt-palette-modes" role="group" aria-label="복사용 문구 색상 선택">${paletteModes}</div><div class="cpd-slide-style-prompt-colors"${mode === "custom" ? "" : " hidden"}>${colorFields}</div><textarea class="cpd-slide-style-prompt-output" data-slide-style-prompt-output rows="9" readonly spellcheck="false" aria-label="복사할 발표자료 디자인 지시문">${escapeHtml(prompt)}</textarea><footer><span>스타일·색상·레이아웃·타이포그래피·금지 조건 포함</span><button type="button" class="cpd-btn primary" data-action="copy-slide-style-prompt">문구만 복사</button></footer></section>`;
  }

  function syncSlideStylePromptTool() {
    const style = SLIDE_STYLE_CATALOG?.get?.(slideStyleUi.draftId);
    const tool = document.querySelector("#cpdSlideStyleDialog .cpd-slide-style-prompt-tool");
    if (!style || !tool) return;
    tool.outerHTML = renderSlideStylePromptTool(style);
  }

  function syncSlideStylePromptOutput() {
    const style = SLIDE_STYLE_CATALOG?.get?.(slideStyleUi.draftId);
    const dialog = document.getElementById("cpdSlideStyleDialog");
    if (!style || !dialog) return;
    const palette = slideStylePromptColors(style, slideStyleUi.promptPaletteMode);
    const output = dialog.querySelector("[data-slide-style-prompt-output]");
    if (output) output.value = buildSlideStyleCopyPrompt(style, palette, slideStylePromptPaletteName(style));
    SLIDE_STYLE_PROMPT_COLOR_ROLES.forEach(([role]) => {
      const color = palette[role];
      const input = dialog.querySelector(`[data-slide-style-prompt-color="${role}"]`);
      const value = dialog.querySelector(`[data-slide-style-prompt-color-value="${role}"]`);
      if (input && input.value.toUpperCase() !== color) input.value = color;
      if (value) value.textContent = color;
    });
  }

  function loadUserPresets() {
    try {
      const parsed = JSON.parse(localStorage.getItem(USER_PRESET_STORAGE_KEY) || "null");
      const items = Array.isArray(parsed?.items) ? parsed.items : [];
      return items
        .filter((item) => item && typeof item === "object" && item.id && item.name && item.settings)
        .slice(0, USER_PRESET_LIMIT);
    } catch (_) {
      return [];
    }
  }

  function persistUserPresets() {
    try {
      localStorage.setItem(USER_PRESET_STORAGE_KEY, JSON.stringify({ schemaVersion: USER_PRESET_SCHEMA_VERSION, items: userPresets }));
      return true;
    } catch (_) {
      toast("브라우저 저장 공간을 사용할 수 없습니다.");
      return false;
    }
  }
  function migrateLegacySettings(value) {
    const previousSchema = value?.schemaVersion;
    const previousSchemaNumber = Number.parseFloat(String(previousSchema || "0"));
    const usesLegacyStepOrder = !Number.isFinite(previousSchemaNumber) || previousSchemaNumber < 3.2;
    if (value && previousSchema !== SCHEMA_VERSION && usesLegacyStepOrder && Number.isFinite(Number(value.activeStep))) {
      const legacyStepIds = ["project", "canvas", "composition", "colors", "background", "header", "footer", "typography", "photoComposite", "quality", "direction", "constraints"];
      const activeId = legacyStepIds[Math.max(0, Math.min(legacyStepIds.length - 1, Number(value.activeStep)))] || "project";
      value.activeStep = Math.max(0, STEP_META.findIndex(([id]) => id === activeId));
    }
    if (value?.canvas) {
      delete value.canvas.marginPreset;
      delete value.canvas.marginValue;
    }
    if (!value || typeof value !== "object") return value;
    if (!value.project) value.project = {};
    delete value.project.secondsPerSlide;
    if (!value.frame) {
      value.frame = {
        headerHeightPercent: value.header?.type === "none" ? 0 : Number(value.header?.heightPercent) || 9,
        footerHeightPercent: value.footer?.type === "none" ? 0 : Number(value.footer?.heightPercent) || 6,
        bodySafeMarginPercent: Number(value.canvas?.safeArea?.top) || 6,
        headerElements: [value.header?.showSectionLabel !== false ? "파트명" : "", "제목", value.header?.showSubtitle ? "부제" : "", value.header?.showPageNumber ? "페이지 번호" : ""].filter(Boolean).join(", "),
        footerElements: [value.footer?.type === "source" ? "출처" : "", value.footer?.type === "institution" ? "기관명" : "", value.footer?.showPageNumber !== false ? "페이지 번호" : ""].filter(Boolean).join(", "),
      };
    }
    if (!value.visualStyle) value.visualStyle = { formality: Number(value.visualDirection?.authority) || 2, energy: Number(value.visualDirection?.energy) || 3, expression: Number(value.visualDirection?.expression) || 3 };
    if (value.colors && !value.colors.baseCanvas) value.colors.baseCanvas = String(value.colors.background || "").toUpperCase() === "#FFFFFF" ? "white" : "palette";
    if (value.typography && !value.typography.emphasis) value.typography.emphasis = value.typography.headlineScale === "hero" ? "strong" : value.typography.bodyScale === "compact" ? "reading" : "balanced";
    if (!value.resources) {
      const policy = (enabled) => enabled === false ? "exclude" : "auto";
      value.resources = {
        photo: value.photoComposite?.mode === "off" ? "auto" : value.photoComposite?.mode === "preferred" ? "allow" : "auto",
        layeredComposite: policy(value.composition?.allowLayeredComposition),
        icons: policy(value.composition?.allowPictogram),
        gradients: "auto",
        threeD: policy(value.composition?.allowTechnical3d),
        illustration: policy(value.composition?.allowIllustration),
        dataVisualization: policy(value.composition?.allowDataVisualization),
        diagramInfographic: value.composition?.allowDiagram === false && value.composition?.allowInfographic === false ? "exclude" : "auto",
        typographicFocal: policy(value.composition?.allowTypographicFocus),
      };
    }
    if (value.project.audienceRole === undefined) {
      const audienceRoleMap = {
        "의사결정자": "승인권자", "실무자": "실행 담당자", "고객·일반 대중": "이용자·대중",
        "전문가·연구자": "전문가·자문자", "내부 구성원": "실행 담당자", "학생·교육 대상": "학습자",
        "승인권자": "승인권자", "검토·평가자": "검토·평가자", "실행 담당자": "실행 담당자",
        "전문가·자문자": "전문가·자문자", "학습자": "학습자", "이용자·대중": "이용자·대중",
      };
      const migratedAudienceRole = audienceRoleMap[value.project.audience] || "";
      value.project.audienceRole = migratedAudienceRole;
      if (migratedAudienceRole) value.project.audience = "";
    }
    if (value.project.audienceStance === undefined) value.project.audienceStance = "neutral";
    if (value.project.readingMode === undefined) value.project.readingMode = "live";
    if (value.project.audienceLevel === "child") value.project.audienceLevel = "newcomer";
    if (value.project.audienceLevel === "decision") value.project.audienceLevel = "practitioner";
    delete value.project.durationMinutes;
    if (value.colors) delete value.colors.photoColorPolicy;
    const legacyImagery = value.imagery || {};
    const legacyBackground = value.background || {};
    if (!value.photoComposite) {
      const legacyMode = legacyImagery.photoCompositeMode || "conditional";
      value.photoComposite = {
        mode: legacyMode === "enabled" ? "required" : legacyMode,
        role: legacyImagery.imagePurpose === "evidence" ? "evidence" : "context",
        primary: legacyImagery.photoCompositePrimary === "card" ? "hero" : (legacyImagery.photoCompositePrimary || "hero"),
        secondary: legacyImagery.photoCompositeSecondary === "card" ? "accent" : (legacyImagery.photoCompositeSecondary || "none"),
        saturation: legacyBackground.saturation || "low",
        overlay: legacyBackground.overlay || "medium",
        allowContextScene: true,
        dropWhenDense: legacyImagery.photoCompositeDropWhenDense !== false,
        protectText: legacyImagery.forbidImportantTextOnImages !== false,
        protectData: legacyImagery.photoCompositeProtectData !== false,
        realism: legacyImagery.photoCompositeRealism !== false,
      };
    }
    if (value.photoComposite) delete value.photoComposite.maxAreaPercent;
    if (value.photoComposite?.mode === "required") value.photoComposite.mode = "preferred";
    if (value.photoComposite && value.photoComposite.style === undefined) value.photoComposite.style = "adaptive";
    if (value.photoComposite && value.photoComposite.allowContextScene === undefined) value.photoComposite.allowContextScene = true;
    if (!value.background) value.background = {};
    const oldPrimary = value.photoComposite?.primary;
    const oldSecondary = value.photoComposite?.secondary;
    const oldUsedBackground = oldPrimary === "background" || oldSecondary === "background";
    if (value.background.photoMode === undefined) value.background.photoMode = oldUsedBackground ? (value.photoComposite?.mode || "conditional") : "off";
    if (value.background.photoSaturation === undefined) value.background.photoSaturation = value.photoComposite?.saturation || legacyBackground.saturation || "low";
    if (value.background.photoOverlay === undefined) value.background.photoOverlay = value.photoComposite?.overlay || legacyBackground.overlay || "medium";
    if (value.background.photoLayerMode === undefined) value.background.photoLayerMode = "single";
    if (value.background.photoLayerLayout === undefined) value.background.photoLayerLayout = "adaptive";
    if (value.background.photoLayerMaxImages === undefined) value.background.photoLayerMaxImages = 3;
    if (value.background.photoLayerDepth === undefined) value.background.photoLayerDepth = "subtle";
    if (value.background.photoLayerAvoidDuplication === undefined) value.background.photoLayerAvoidDuplication = true;
    if (value.background.photoAllowContextScene === undefined) value.background.photoAllowContextScene = value.photoComposite?.allowContextScene !== false;
    if (value.background.photoProtectText === undefined) value.background.photoProtectText = value.photoComposite?.protectText !== false;
    if (value.background.photoRealism === undefined) value.background.photoRealism = value.photoComposite?.realism !== false;
    if (value.photoComposite) {
      if (value.photoComposite.primary === "background") value.photoComposite.primary = "hero";
      if (value.photoComposite.secondary === "background") value.photoComposite.secondary = "none";
      if (!['accent', 'card', 'hero'].includes(value.photoComposite.primary)) value.photoComposite.primary = "accent";
      if (!['none', 'accent', 'card', 'hero'].includes(value.photoComposite.secondary)) value.photoComposite.secondary = "none";
      if (!value.photoComposite.visualRole) value.photoComposite.visualRole = ({ evidence: "evidence", context: "context", hero: "atmosphere", background: "context" })[value.photoComposite.role] || "evidence";
      if (value.photoComposite.visualRole === "evidenceExplanation") value.photoComposite.visualRole = "evidence";
      delete value.photoComposite.role;
      delete value.photoComposite.saturation;
      delete value.photoComposite.overlay;
      delete value.photoComposite.allowContextScene;
    }
    if (!value.composition) value.composition = {};
    if (value.composition.secondaryVisualLanguage === value.composition.primaryVisualLanguage) value.composition.secondaryVisualLanguage = "none";
    if (value.imagery && value.composition.iconEnabled === undefined) value.composition.iconEnabled = value.imagery.iconEnabled !== false;
    delete value.components;
    delete value.imagery;
    if (value.sectionEnabled) {
      const legacyPhotoEnabled = value.sectionEnabled.imagery;
      delete value.sectionEnabled.components;
      delete value.sectionEnabled.imagery;
      if (value.sectionEnabled.photoComposite === undefined) value.sectionEnabled.photoComposite = legacyPhotoEnabled !== false;
    }
    if (value.photoComposite) delete value.photoComposite.maxZones;
    if (value.background) {
      ["photoRange", "photoMaxAreaPercent", "saturation", "overlay", "protectTextAreas", "protectChartAreas"].forEach((key) => delete value.background[key]);
      if (["photo", "photoMix"].includes(value.background.type)) value.background.type = "lightNeutral";
    }
    if (value.header?.profile === "page") value.header.profile = "custom";
    if (value.footer?.type === "page") value.footer.type = "minimal";
    if (value.footer?.profile === "page") value.footer.profile = "minimal";
    const legacyProfileMap = { public: "inform", evaluation: "decide", technology: "explain", education: "teach", investment: "inspire", strategy: "act" };
    if (!value.journey || typeof value.journey !== "object") {
      const legacyIndex = Math.max(0, Math.min(STEP_META.length - 1, Number(value.activeStep) || 0));
      const activeSection = STEP_META[legacyIndex]?.[0] || "project";
      const activeStage = Math.max(0, JOURNEY_STAGES.findIndex((stage) => stage.sections.includes(activeSection)));
      value.journey = { profileId: "custom", profileDirty: false, activeStage, reviewedStages: [] };
    } else {
      if (previousSchema !== SCHEMA_VERSION && previousSchemaNumber < 4) {
        const oldStages = previousSchemaNumber < 3.4
          ? ["context", "direction", "style", "imagery", "frame", "output"]
          : ["context", "identity", "structure", "style", "imagery", "frame", "output"];
        const oldActiveId = oldStages[Math.max(0, Math.min(oldStages.length - 1, Number(value.journey.activeStage) || 0))] || "context";
        const stageIdMap = { context: "format", direction: "style", identity: "style", structure: "style", style: "palette", imagery: "resources", frame: "format", output: "resources" };
        value.journey.activeStage = Math.max(0, JOURNEY_STAGES.findIndex((stage) => stage.id === (stageIdMap[oldActiveId] || "format")));
        const reviewed = Array.isArray(value.journey.reviewedStages) ? value.journey.reviewedStages : [];
        value.journey.reviewedStages = [...new Set(reviewed.map((id) => stageIdMap[id] || id))];
      }
      value.journey.activeStage = Math.max(0, Math.min(JOURNEY_STAGES.length - 1, Number(value.journey.activeStage) || 0));
      value.journey.reviewedStages = Array.isArray(value.journey.reviewedStages) ? value.journey.reviewedStages.filter((id) => JOURNEY_STAGES.some((stage) => stage.id === id)) : [];
      if (!value.journey.profileId) value.journey.profileId = "custom";
      if (legacyProfileMap[value.journey.profileId]) value.journey.profileId = legacyProfileMap[value.journey.profileId];
      if (value.journey.profileDirty === undefined) value.journey.profileDirty = false;
    }
    return value;
  }
  function loadDraft() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      const loaded = parsed ? merge(DEFAULT_STATE, migrateLegacySettings(parsed)) : clone(DEFAULT_STATE);
      loaded.schemaVersion = SCHEMA_VERSION;
      return loaded;
    } catch (_) { return clone(DEFAULT_STATE); }
  }
  function saveDraft() {
    clearTimeout(saveTimer);
    const status = document.getElementById("cpdSaveState");
    if (status) status.textContent = "저장 중…";
    saveTimer = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (status) status.textContent = "브라우저에 자동 저장됨";
    }, 180);
  }
  function get(path) { return path.split(".").reduce((value, key) => value == null ? value : value[key], state); }
  function isSectionEnabled(id) { return CORE_GUIDE_SECTIONS.has(id) || get(`sectionEnabled.${id}`) !== false; }
  function set(path, value) {
    const parts = path.split(".");
    const last = parts.pop();
    const target = parts.reduce((value, key) => value[key], state);
    target[last] = value;
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char]));
  }
  function colorDescription(hex) {
    return PALETTE_CATALOG?.describeColor?.(hex) || { hex: String(hex || "").toUpperCase(), nameKo: "사용자 지정 색상", nameEn: "custom color" };
  }
  function colorRole(key) {
    const auto = colorDescription(get(`colors.${key}`));
    return { ...auto, ...(get(`colors.names.${key}`) || {}), hex: get(`colors.${key}`) };
  }
  function colorToken(key, ko) {
    const role = colorRole(key);
    return ko ? `${role.nameKo}(${role.nameEn}, ${role.hex})` : `${role.nameEn} (${role.hex})`;
  }
  function paletteTitle() {
    return get("colors.paletteNameKo") || COLOR_PRESETS[get("colors.preset")]?.[0] || "사용자 정의";
  }
  function renderSummaryColorSwatches(candidate = null) {
    const roleLabel = CORE_COLOR_ROLE_KEYS.map((key) => COLOR_ROLE_META[key][0]).join(", ");
    const swatches = CORE_COLOR_ROLE_KEYS.map((key) => {
      const hex = candidate?.roles?.[key]?.hex || get(`colors.${key}`);
      return `<i data-color-summary-role="${key}" style="background:${escapeHtml(hex)}" title="${escapeHtml(`${COLOR_ROLE_META[key][0]} · ${hex}`)}" aria-hidden="true"></i>`;
    }).join("");
    return `<span class="cpd-color-dots" role="img" aria-label="설정 색상 5종: ${escapeHtml(roleLabel)}">${swatches}</span>`;
  }
  function setCommonColorPreset(key) {
    const item = COLOR_PRESETS[key];
    if (!item) return false;
    const values = clone(item[1]);
    state.colors.preset = key;
    state.colors.source = "common";
    state.colors.presetId = key;
    state.colors.presetVersion = 1;
    state.colors.paletteNameKo = item[0];
    state.colors.paletteNameEn = ({ publicBlue: "Public Institution Blue", corporateNavy: "Corporate Navy", futureTech: "Future Technology", mono: "Monochrome", premium: "Premium" })[key] || item[0];
    state.colors.mode = PALETTE_CATALOG?.contrast?.(values.textPrimary, values.background) >= 4.5 && ["#FFFFFF", "#F8FAFC", "#F5FAFF", "#F8F6F1"].includes(values.background) ? "light" : "dark";
    state.colors.category = key === "mono" ? "modern" : "official";
    state.colors.usage = "corporate";
    state.colors.originalColors = [values.primary, values.secondary, values.accent, values.background, values.textPrimary];
    state.colors.names = {};
    Object.entries(values).forEach(([role, hex]) => {
      state.colors[role] = hex;
      state.colors.names[role] = { ...colorDescription(hex), nameSource: "auto" };
    });
    colorUi.source = "common";
    colorDraft = null;
    return true;
  }

  function setSlideStyleColors(style) {
    const values = clone(style?.settings?.colors || {});
    const required = ["primary", "secondary", "accent", "background", "surface", "textPrimary", "textSecondary", "border"];
    if (!required.every((key) => /^#[0-9a-f]{6}$/i.test(values[key] || ""))) return false;
    Object.assign(state.colors, {
      preset: `slide-style:${style.id}`,
      source: "slide-style",
      presetId: `slide-style:${style.id}`,
      presetVersion: Number(SLIDE_STYLE_CATALOG?.version) || 1,
      paletteNameKo: values.paletteNameKo || style.nameKo,
      paletteNameEn: values.paletteNameEn || style.nameEn,
      mode: values.mode || "light",
      category: values.category || "modern",
      usage: values.usage || "corporate",
      baseCanvas: values.baseCanvas || "white",
      originalColors: [values.primary, values.secondary, values.accent, values.background, values.textPrimary],
      names: {},
    });
    required.forEach((role) => {
      const hex = values[role].toUpperCase();
      state.colors[role] = hex;
      state.colors.names[role] = { ...colorDescription(hex), nameSource: "auto" };
    });
    colorUi.source = "common";
    colorDraft = null;
    colorHoverDraft = null;
    return true;
  }

  function randomItem(items, current = "") {
    const values = (items || []).filter(Boolean);
    if (!values.length) return null;
    const alternatives = values.filter((value) => String(value?.id || value) !== String(current));
    const pool = alternatives.length ? alternatives : values;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function institutionProfile(id) {
    return INSTITUTION_RANDOM_PROFILES.find((profile) => profile.id === id) || null;
  }

  function institutionMedium(currentId = "") {
    return randomItem(MEDIUM_CATALOG?.list?.({ recommended: true }) || [], currentId);
  }

  function institutionPalette(currentId = "") {
    return randomItem(PALETTE_CATALOG?.list?.({ category: "official" }) || [], currentId);
  }

  function assignInstitutionPalette(palette) {
    const candidate = PALETTE_CATALOG?.toSlidePalette?.(palette);
    return candidate ? applySlidePalette(candidate) : false;
  }

  function assignMediumToState(medium, source = "visual-mixer") {
    if (!medium) return false;
    Object.assign(state.visualDirection, {
      source: "visual-mixer",
      mediumId: medium.id || "",
      mediumSource: source,
      mediumVersion: medium.version || 1,
      mediumNameKo: medium.nameKo || "",
      mediumNameEn: medium.nameEn || "",
      mediumCategory: medium.category || "",
      mediumGroup: medium.group || "",
      mediumTexture: medium.texture || "",
      mediumUsage: medium.usage || "",
      mediumDescription: medium.description || "",
      mediumPromptSummaryKo: medium.promptSummaryKo || "",
      mediumPromptSummaryEn: medium.promptSummaryEn || "",
    });
    directionUi.source = "mixer";
    directionDraft = null;
    return true;
  }

  function institutionRandomSnapshot(profile = institutionProfile(institutionRandomState?.profileId)) {
    return {
      profileId: profile?.id || institutionRandomState?.profileId || "",
      profileLabel: profile?.label || institutionRandomState?.profileLabel || "부분 랜덤 설정",
      profileHelp: profile?.help || institutionRandomState?.profileHelp || "선택한 항목만 새 조합으로 변경했습니다.",
      values: {
        medium: get("visualDirection.mediumNameKo") || "기본 표현",
        composition: COMPOSITION_PROFILES[get("composition.profile")]?.label || "직접 설정",
        colors: paletteTitle(),
        background: BACKGROUND_PROFILES[get("background.profile")]?.label || backgroundSummary(),
        header: HEADER_PROFILES[get("header.profile")]?.label || headerSummary(),
        footer: FOOTER_PROFILES[get("footer.profile")]?.label || footerSummary(),
        typography: TYPOGRAPHY_PRESETS[get("typography.presetId")]?.label || typographySummary(),
        photo: photoCompositeStateSummary(),
      },
    };
  }

  function renderInstitutionRandom() {
    const container = document.getElementById("cpdInstitutionRandom");
    if (!container) return;
    const snapshot = institutionRandomState ? institutionRandomSnapshot() : null;
    const entries = snapshot ? [
      ["리터칭", snapshot.values.medium], ["시각 구성", snapshot.values.composition], ["색상", snapshot.values.colors], ["배경", snapshot.values.background],
      ["헤더", snapshot.values.header], ["푸터", snapshot.values.footer], ["타이포", snapshot.values.typography], ["실사", snapshot.values.photo],
    ] : [];
    container.innerHTML = `<details class="cpd-inspiration-starter"${snapshot || inspirationStarterOpen ? " open" : ""}><summary><span><strong>영감용 시작점</strong><small>막힐 때만 기관용 조합을 불러오고, 디자인 DNA 질문에서 자유롭게 바꿉니다.</small></span><em>${snapshot ? "조합 적용됨" : "선택 사항"}</em></summary><div class="cpd-institution-random" aria-labelledby="cpdInstitutionRandomTitle">
      <div class="cpd-institution-random-copy"><span>고정 템플릿이 아닌 시작 재료</span><h3 id="cpdInstitutionRandomTitle">기관 발표용 무작위 조합</h3><p>리터칭 기법과 팔레트를 임시 시작점으로 연결합니다. 이 선택은 디자인 유형을 확정하지 않으며 이후 질문의 조합이 최종 디자인 DNA를 만듭니다.</p></div>
      <div class="cpd-institution-random-actions" aria-label="기관용 조합 변경"><button type="button" class="cpd-btn primary" data-action="institution-random">시작 조합 만들기</button><button type="button" class="cpd-btn" data-action="institution-random-medium">표현 기법만 변경</button><button type="button" class="cpd-btn" data-action="institution-random-color">팔레트만 변경</button></div>
      <div class="cpd-institution-random-result" aria-live="polite"><div><small>${snapshot ? "현재 적용 조합" : "사용 방법"}</small><strong>${escapeHtml(snapshot?.profileLabel || "필요할 때만 시작 조합을 만들어보세요")}</strong><span>${escapeHtml(snapshot?.profileHelp || "적용한 뒤 여섯 개 디자인 DNA 질문과 세부 문장을 자유롭게 수정할 수 있습니다.")}</span></div>${entries.length ? `<dl>${entries.map(([labelText, value]) => `<div><dt>${labelText}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>` : ""}</div>
    </div></details>`;
  }

  function applyInstitutionRandom() {
    const profile = randomItem(INSTITUTION_RANDOM_PROFILES, institutionRandomState?.profileId);
    if (!profile) return;
    const medium = institutionMedium(get("visualDirection.mediumId"));
    const palette = institutionPalette(get("colors.presetId") || get("colors.preset"));
    const directionPreset = DESIGN_PRESETS[profile.directionPreset]?.[1];
    const compositionKey = randomItem(profile.compositions, get("composition.profile"));
    const backgroundKey = randomItem(profile.backgrounds, get("background.profile"));
    const headerKey = randomItem(profile.headers, get("header.profile"));
    const footerKey = randomItem(profile.footers, get("footer.profile"));
    const typographyKey = randomItem(profile.typographies, get("typography.presetId"));
    const photo = clone(randomItem(profile.photos) || {});
    recordHistory();
    ["direction", "composition", "colors", "background", "header", "footer", "typography", "photoComposite"].forEach((id) => { state.sectionEnabled[id] = true; });
    if (directionPreset) Object.assign(state.visualDirection, { preset: profile.directionPreset, intensity: directionPreset.intensity, keywords: clone(directionPreset.keywords) });
    assignMediumToState(medium, "institution-random");
    if (COMPOSITION_PROFILES[compositionKey]) Object.assign(state.composition, clone(COMPOSITION_PROFILES[compositionKey].values), { profile: compositionKey });
    assignInstitutionPalette(palette);
    if (BACKGROUND_PROFILES[backgroundKey]) Object.assign(state.background, clone(BACKGROUND_PROFILES[backgroundKey].values), { source: "common", profile: backgroundKey });
    if (HEADER_PROFILES[headerKey]) Object.assign(state.header, clone(HEADER_PROFILES[headerKey].values), { source: "common", profile: headerKey });
    if (FOOTER_PROFILES[footerKey]) Object.assign(state.footer, clone(FOOTER_PROFILES[footerKey].values), { source: "common", profile: footerKey });
    if (state.header.showPageNumber && state.footer.showPageNumber) state.header.showPageNumber = false;
    if (TYPOGRAPHY_PRESETS[typographyKey]) Object.assign(state.typography, clone(TYPOGRAPHY_PRESETS[typographyKey].values), { source: "common", presetId: typographyKey, visualTypographyId: "", visualTypographyNameKo: "", visualTypographyNameEn: "", visualTypographyPromptSummary: "", visualTypographyHighRisk: false });
    Object.assign(state.photoComposite, { secondary: "none", dropWhenDense: true, protectText: true, protectData: true, realism: true }, photo);
    state.recommendationMeta = { source: "institution-random", profile: profile.id, label: profile.label, appliedAt: new Date().toISOString() };
    institutionRandomState = institutionRandomSnapshot(profile);
    photoCompositeAdvancedOpen = false;
    refresh({ full: true });
    toast(`${profile.label} 조합을 적용했습니다.`);
  }

  function randomizeInstitutionColor() {
    const profile = institutionProfile(institutionRandomState?.profileId);
    const palette = institutionPalette(get("colors.presetId") || get("colors.preset"));
    if (!palette) { toast("비주얼 믹서의 공공/기관 색상 팔레트가 없습니다."); return; }
    recordHistory();
    state.sectionEnabled.colors = true;
    assignInstitutionPalette(palette);
    institutionRandomState = institutionRandomSnapshot(profile);
    refresh({ full: true });
    toast(`${paletteTitle()} 팔레트로 바꿨습니다.`);
  }

  function randomizeInstitutionMedium() {
    const profile = institutionProfile(institutionRandomState?.profileId);
    const medium = institutionMedium(get("visualDirection.mediumId"));
    if (!medium) { toast("비주얼 믹서의 공공기관 리터칭 기법이 없습니다."); return; }
    recordHistory();
    state.sectionEnabled.direction = true;
    assignMediumToState(medium, "institution-random");
    institutionRandomState = institutionRandomSnapshot(profile);
    refresh({ full: true });
    toast(`${medium.nameKo} 리터칭으로 바꿨습니다.`);
  }

  function captureUserPresetSettings() {
    const settings = {};
    USER_PRESET_DESIGN_KEYS.forEach((key) => { settings[key] = clone(state[key]); });
    settings.projectOutput = Object.fromEntries(USER_PRESET_OUTPUT_KEYS.map((key) => [key, clone(state.project[key])]));
    return settings;
  }

  function currentPresetSummary() {
    const slideStyle = selectedSlideStyle();
    return {
      palette: paletteTitle(),
      composition: `${slideStyle ? `${slideStyle.nameKo}${isSlideStyleCustomized() ? "·조정" : ""} · ` : ""}인상 ${get("visualStyle.formality")}/${get("visualStyle.energy")}/${get("visualStyle.expression")} · ${label("typography.emphasis", { reading: "읽기 우선", balanced: "균형 강조", strong: "강한 강조" })}`,
      canvas: `${get("canvas.aspectRatio")} · ${get("canvas.width")}×${get("canvas.height")}`,
      model: MODEL_PROFILES[get("project.targetModel")]?.label || get("project.targetModel"),
    };
  }

  function createUserPresetId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function saveCurrentUserPreset() {
    const input = document.getElementById("cpdUserPresetName");
    const name = String(input?.value || "").trim().replace(/\s+/g, " ").slice(0, 40);
    if (name.length < 2) { toast("프리셋 이름을 두 글자 이상 입력해주세요."); input?.focus(); return; }
    const now = new Date().toISOString();
    const duplicateIndex = userPresets.findIndex((item) => item.name.toLocaleLowerCase("ko-KR") === name.toLocaleLowerCase("ko-KR"));
    const previous = duplicateIndex >= 0 ? userPresets[duplicateIndex] : null;
    const item = {
      id: previous?.id || createUserPresetId(),
      name,
      createdAt: previous?.createdAt || now,
      updatedAt: now,
      summary: currentPresetSummary(),
      settings: captureUserPresetSettings(),
    };
    if (duplicateIndex >= 0) userPresets.splice(duplicateIndex, 1);
    userPresets.unshift(item);
    userPresets = userPresets.slice(0, USER_PRESET_LIMIT);
    if (!persistUserPresets()) return;
    quickSetupUi.mode = "presets";
    refresh({ full: true });
    toast(previous ? `‘${name}’ 프리셋을 현재 설정으로 갱신했습니다.` : `‘${name}’ 프리셋을 저장했습니다.`);
  }

  function overwriteUserPreset(id) {
    const preset = userPresets.find((item) => item.id === id);
    if (!preset) return;
    preset.updatedAt = new Date().toISOString();
    preset.summary = currentPresetSummary();
    preset.settings = captureUserPresetSettings();
    userPresets = [preset, ...userPresets.filter((item) => item.id !== id)];
    if (!persistUserPresets()) return;
    refresh({ full: true });
    toast(`‘${preset.name}’ 프리셋을 현재 설정으로 갱신했습니다.`);
  }

  function deleteUserPreset(id) {
    const preset = userPresets.find((item) => item.id === id);
    if (!preset || !window.confirm(`‘${preset.name}’ 프리셋을 삭제할까요?`)) return;
    userPresets = userPresets.filter((item) => item.id !== id);
    if (!persistUserPresets()) return;
    refresh({ full: true });
    toast(`‘${preset.name}’ 프리셋을 삭제했습니다.`);
  }

  function applyUserPreset(id) {
    const preset = userPresets.find((item) => item.id === id);
    if (!preset) { toast("저장된 프리셋을 찾을 수 없습니다."); return; }
    recordHistory();
    USER_PRESET_DESIGN_KEYS.forEach((key) => {
      if (!preset.settings?.[key] || !DEFAULT_STATE[key]) return;
      state[key] = merge(DEFAULT_STATE[key], preset.settings[key]);
    });
    if (preset.settings?.projectOutput) {
      USER_PRESET_OUTPUT_KEYS.forEach((key) => {
        if (preset.settings.projectOutput[key] !== undefined) state.project[key] = clone(preset.settings.projectOutput[key]);
      });
    }
    if (JOURNEY_PROFILE_META[state.journey.profileId]) state.journey.profileDirty = true;
    state.journey.reviewedStages = [];
    state.recommendationMeta = { source: "user-preset", presetId: preset.id, label: preset.name, appliedAt: new Date().toISOString() };
    quickRandomState = null;
    refresh({ full: true });
    toast(`‘${preset.name}’ 디자인 설정을 적용했습니다. 발표 내용은 유지됩니다.`);
  }

  function safeRandomPalette(filters = {}, currentId = "") {
    const getCandidates = (options) => (PALETTE_CATALOG?.list?.(options) || []).filter((palette) => {
      const candidate = PALETTE_CATALOG?.toSlidePalette?.(palette);
      return candidate?.validation?.textContrast >= 4.5 && candidate?.validation?.secondaryTextContrast >= 3;
    });
    let candidates = getCandidates(filters);
    if (!candidates.length) candidates = getCandidates({ contrast: "clear" });
    if (!candidates.length) candidates = getCandidates({});
    return randomItem(candidates, currentId);
  }

  function quickRandomSnapshot(scope, recipe = null) {
    const labels = { all: "전체 시각 조합", palette: "색상 팔레트", resources: "시각 자원" };
    const allowedResources = RESOURCE_META.filter(([key]) => get(`resources.${key}`) === "allow").map(([, title]) => title);
    return {
      scope,
      label: recipe?.label || labels[scope] || "랜덤 조합",
      help: recipe?.help || `${labels[scope] || "선택 영역"}만 새 조합으로 바꿨습니다.`,
      values: {
        direction: `${get("visualStyle.formality")}/5 · ${get("visualStyle.energy")}/5 · ${get("visualStyle.expression")}/5`,
        palette: paletteTitle(),
        emphasis: label("typography.emphasis", { reading: "읽기 우선", balanced: "균형", strong: "핵심 강조" }),
        resources: allowedResources.join(" · ") || "AI가 내용에 맞춰 판단",
      },
    };
  }

  function applyQuickRandom(scope = "all") {
    const allowed = new Set(["all", "palette", "resources"]);
    const targetScope = allowed.has(scope) ? scope : "all";
    const recipe = randomItem(QUICK_RANDOM_RECIPES, quickRandomState?.recipeId);
    if (!recipe) return;
    recordHistory();

    if (targetScope === "all") {
      const axes = clone(randomItem(recipe.axes) || [2, 3, 2, 2]);
      [state.visualStyle.formality, state.visualStyle.energy, state.visualStyle.expression] = axes;
      state.typography.emphasis = axes[2] >= 4 ? "strong" : axes[2] <= 2 ? "reading" : "balanced";
    }

    if (["all", "palette"].includes(targetScope)) {
      const paletteFilters = clone(randomItem(recipe.paletteFilters) || {});
      const palette = safeRandomPalette(paletteFilters, get("colors.presetId") || get("colors.preset"));
      if (palette) assignInstitutionPalette(palette);
      else setCommonColorPreset(randomItem(Object.keys(COLOR_PRESETS), get("colors.preset")) || "publicBlue");
      state.colors.baseCanvas = Math.random() < .72 ? "white" : "palette";
    }

    if (["all", "resources"].includes(targetScope)) {
      const protectedExclusions = new Set(RESOURCE_META.filter(([key]) => get(`resources.${key}`) === "exclude").map(([key]) => key));
      RESOURCE_META.forEach(([key]) => { if (!protectedExclusions.has(key)) state.resources[key] = "auto"; });
      const candidates = RESOURCE_META.map(([key]) => key).filter((key) => !protectedExclusions.has(key));
      const count = Math.min(candidates.length, Math.random() < .55 ? 1 : 2);
      for (let index = 0; index < count; index += 1) {
        const key = randomItem(candidates.filter((item) => get(`resources.${item}`) !== "allow"));
        if (key) state.resources[key] = "allow";
      }
    }

    if (JOURNEY_PROFILE_META[state.journey.profileId]) state.journey.profileDirty = true;
    state.journey.reviewedStages = [];
    state.recommendationMeta = { source: "quick-random", scope: targetScope, recipe: recipe.id, label: recipe.label, appliedAt: new Date().toISOString() };
    quickRandomState = { ...quickRandomSnapshot(targetScope, recipe), recipeId: recipe.id };
    refresh({ full: true });
    toast(`${targetScope === "all" ? recipe.label : quickRandomState.help} 설정을 적용했습니다.`);
  }

  function applySlidePalette(candidate) {
    if (!candidate?.roles) return false;
    state.colors.source = candidate.source || "visual-mixer";
    state.colors.preset = candidate.presetId || "custom";
    state.colors.presetId = candidate.presetId || "";
    state.colors.presetVersion = candidate.presetVersion || 1;
    state.colors.paletteNameKo = candidate.paletteNameKo || "사용자 정의";
    state.colors.paletteNameEn = candidate.paletteNameEn || "Custom palette";
    state.colors.mode = candidate.mode || "light";
    state.colors.category = candidate.category || "all";
    state.colors.usage = candidate.usage || "";
    state.colors.originalColors = clone(candidate.originalColors || []);
    state.colors.names = {};
    Object.keys(COLOR_ROLE_META).forEach((key) => {
      const role = candidate.roles[key];
      if (!role) return;
      state.colors[key] = role.hex;
      state.colors.names[key] = { nameKo: role.nameKo, nameEn: role.nameEn, nameSource: role.nameSource || "auto" };
    });
    return true;
  }
  function mixHex(baseHex, overlayHex, overlayRatio) {
    const base = hexToRgb(baseHex);
    const overlay = hexToRgb(overlayHex);
    if (!base || !overlay) return baseHex;
    const ratio = Math.min(1, Math.max(0, Number(overlayRatio) || 0));
    return `#${base.map((channel, index) => Math.round(channel * (1 - ratio) + overlay[index] * ratio).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
  }
  function syncDerivedColors(changedRole) {
    if (!CORE_COLOR_ROLE_KEYS.includes(changedRole)) return;
    const primary = get("colors.primary");
    const background = get("colors.background");
    const textPrimary = get("colors.textPrimary");
    if (![primary, background, textPrimary].every((hex) => /^#[0-9A-F]{6}$/i.test(hex || ""))) return;
    const derived = {
      surface: mixHex(background, primary, .06),
      textSecondary: mixHex(textPrimary, background, .35),
      border: mixHex(textPrimary, background, .78),
    };
    Object.entries(derived).forEach(([role, hex]) => {
      state.colors[role] = hex;
      state.colors.names[role] = { ...colorDescription(hex), nameSource: "derived" };
    });
    state.colors.mode = luminance(background) > .45 ? "light" : "dark";
  }
  function markCustomColor(role) {
    const value = get(`colors.${role}`);
    if (!/^#[0-9A-F]{6}$/i.test(value || "")) return;
    const desc = colorDescription(value);
    state.colors.source = "custom";
    state.colors.preset = "custom";
    state.colors.presetId = "";
    state.colors.paletteNameKo = "사용자 정의";
    state.colors.paletteNameEn = "Custom palette";
    state.colors.names[role] = { nameKo: desc.nameKo, nameEn: desc.nameEn, nameSource: "auto" };
    syncDerivedColors(role);
    colorUi.source = "custom";
  }
  function option(value, label, selected) { return `<option value="${escapeHtml(value)}"${String(value) === String(selected) ? " selected" : ""}>${escapeHtml(label)}</option>`; }
  function selectField(label, path, options, cls = "") {
    return `<label class="cpd-field ${cls}"><span>${label}</span><select class="cpd-select" data-path="${path}">${options.map(([value, text]) => option(value, text, get(path))).join("")}</select></label>`;
  }
  function textField(label, path, type = "text", attrs = "") {
    return `<label class="cpd-field"><span>${label}</span><input class="cpd-input" type="${type}" data-path="${path}" value="${escapeHtml(get(path))}" ${attrs}></label>`;
  }
  function check(label, path, help = "") {
    return `<label class="cpd-check${help ? " has-help" : ""}"><input type="checkbox" data-path="${path}"${get(path) ? " checked" : ""}><span><strong>${label}</strong>${help ? `<small>${help}</small>` : ""}</span></label>`;
  }
  function radioChoices(label, path, options, columns = "") {
    return `<div class="cpd-span-all"><div class="cpd-group-label">${label}</div><div class="cpd-choice-grid ${columns}">${options.map(([value, title, help]) => `<label class="cpd-choice"><input type="radio" name="${path}" data-path="${path}" value="${value}"${get(path) === value ? " checked" : ""}><strong>${title}</strong><small>${help}</small></label>`).join("")}</div></div>`;
  }
  function clickChoiceGroup(labelText, path, options, className = "") {
    const current = String(get(path) ?? "");
    return `<fieldset class="cpd-click-question ${className}"><legend>${labelText}</legend><div class="cpd-click-options">${options.map(([value, title, help = ""]) => `<label class="cpd-click-option"><input type="radio" name="${path}" data-path="${path}"${typeof value === "number" ? ' data-number-radio="true"' : ""} value="${escapeHtml(value)}"${String(value) === current ? " checked" : ""}><span><strong>${escapeHtml(title)}</strong>${help ? `<small>${escapeHtml(help)}</small>` : ""}</span></label>`).join("")}</div></fieldset>`;
  }
  function advancedGroup(title, help, body, key) {
    return `<details class="cpd-design-advanced cpd-journey-advanced" data-design-advanced="${key}"${designAdvancedOpen.has(key) ? " open" : ""}><summary><span>${title}</span><small>${help}</small></summary><div class="cpd-design-advanced-body">${body}</div></details>`;
  }
  function panel(title, help, body) { return `<section class="cpd-panel"><h3>${title}</h3><p class="cpd-help">${help}</p>${body}</section>`; }
  function rangeField(label, path, min, max, suffix = "%") {
    return `<label class="cpd-range cpd-span-all"><span class="cpd-range-head"><span>${label}</span><strong data-range-value="${escapeHtml(path)}">${escapeHtml(get(path))}${escapeHtml(suffix)}</strong></span><input type="range" min="${min}" max="${max}" data-path="${path}" data-range-suffix="${escapeHtml(suffix)}" value="${escapeHtml(get(path))}"></label>`;
  }
  function multiChecks(path, values, max = 99) {
    const selected = get(path) || [];
    return `<div class="cpd-checks">${values.map((value) => `<label class="cpd-check"><input type="checkbox" data-multi-path="${path}" data-max="${max}" value="${escapeHtml(value)}"${selected.includes(value) ? " checked" : ""}><span>${escapeHtml(value)}</span></label>`).join("")}</div>`;
  }

  function renderShell() {
    root.innerHTML = `
      <div class="cpd-app">
        <div class="cpd-workspace">
          <main class="cpd-main-column">
            <div class="cpd-hidden-tools" aria-hidden="true"><span id="cpdSaveState">브라우저에 자동 저장됨</span><button type="button" data-action="undo">실행 취소</button><button type="button" data-action="redo">다시 실행</button></div>
            <div class="cpd-accordion cpd-journey" id="cpdAccordion" aria-label="공통 프롬프트 5단계"></div>
          </main>
          <aside class="cpd-summary" aria-label="현재 설정 요약"><div class="cpd-summary-inner tab-action-column"><section class="cpd-summary-card" id="cpdResults"></section></div></aside>
        </div>
        <div class="cpd-mobile-bar" id="cpdMobileJourneyBar"></div>
        <div class="cpd-dialog-backdrop" id="cpdQuickSetupDialog" hidden></div>
        <div class="cpd-dialog-backdrop" id="cpdSlideStyleDialog" hidden></div>
        <div class="cpd-dialog-backdrop" id="cpdOutputSettingsDialog" hidden></div>
        <div class="cpd-dialog-backdrop" id="cpdPromptDialog" hidden></div>
        <input id="commonPromptImportInput" class="cpd-hidden" type="file" accept="application/json,.json">
        <button id="commonPromptGenerateBtn" class="cpd-hidden" type="button" data-action="generate"></button>
        <button id="commonPromptSendGeneratorBtn" class="cpd-hidden" type="button" data-action="send-generator"></button>
        <button id="commonPromptCopyBtn" class="cpd-hidden" type="button" data-action="copy"></button>
        <button id="commonPromptResetBtn" class="cpd-hidden" type="button" data-action="reset"></button>
      </div>`;
  }

  function renderNavigation(issues) {
    const errorsByStep = issues.reduce((map, issue) => {
      if (issue.level === "error") map[issue.step] = (map[issue.step] || 0) + 1;
      return map;
    }, {});
    const enabledCount = JOURNEY_STAGES.length;
    const errorCount = issues.filter((issue) => issue.level === "error").length;
    const warningCount = issues.filter((issue) => issue.level === "warning").length;
    const readinessLabel = errorCount ? `${errorCount}개 충돌 확인 필요` : warningCount ? `생성 가능 · ${warningCount}개 권장 확인` : "프롬프트 생성 준비";
    const progress = document.getElementById("cpdProgress");
    if (progress) progress.innerHTML = `<div class="cpd-progress-head"><strong>${enabledCount}단계 공통 설정 반영</strong><span class="cpd-progress-status${errorCount ? " error" : ""}">${readinessLabel}</span></div><p>실제 내용·데이터·논지와 페이지별 구성은 개별 슬라이드 명세에서 전달합니다.</p>`;
    root.querySelector('[data-action="undo"]').disabled = !history.length;
    root.querySelector('[data-action="redo"]').disabled = !future.length;
    renderMobileJourneyBar();
    return errorsByStep;
  }

  function currentJourneyStage() {
    return Math.max(0, Math.min(JOURNEY_STAGES.length - 1, Number(get("journey.activeStage")) || 0));
  }

  function journeyStageForSection(sectionId) {
    const index = JOURNEY_STAGES.findIndex((stage) => stage.sections.includes(sectionId));
    return index >= 0 ? index : 0;
  }

  function renderMobileJourneyBar() {
    const host = document.getElementById("cpdMobileJourneyBar");
    if (!host) return;
    const active = currentJourneyStage();
    host.innerHTML = active < JOURNEY_STAGES.length - 1
      ? `<button class="cpd-btn soft" type="button" data-action="journey-prev"${active === 0 ? " disabled" : ""}>이전</button><span>${active + 1} / ${JOURNEY_STAGES.length}</span><button class="cpd-btn primary" type="button" data-action="journey-next">다음</button>`
      : '<button class="cpd-btn soft" type="button" data-action="journey-prev">이전</button><button class="cpd-btn primary" type="button" data-action="generate">공통 프롬프트 생성</button><button class="cpd-btn" type="button" data-action="send-generator">분리기로 보내기</button>';
  }

  function renderJourneyProfilePicker() {
    const selected = get("journey.profileId") || "";
    const adjusted = Boolean(get("journey.profileDirty"));
    const selectedProfile = JOURNEY_PROFILE_META[selected];
    const profileCards = Object.entries(JOURNEY_PROFILE_META).map(([id, profile], index) => `<button type="button" role="radio" class="cpd-profile-card${selected === id ? " selected" : ""}" data-journey-profile="${id}" aria-checked="${selected === id}"><span class="cpd-profile-card-meta"><b>${escapeHtml(profile.dimension)}</b><em>${String(index + 1).padStart(2, "0")}</em></span><strong>${escapeHtml(profile.label)}</strong><small>${escapeHtml(profile.help)}</small><i>${selected === id ? adjusted ? "이 기준에서 수정됨" : "현재 기준" : "이 변화로 시작"}</i></button>`).join("");
    const result = selectedProfile ? `<div class="cpd-profile-result" aria-live="polite"><span>선택한 1차 변화</span><div><strong>${escapeHtml(selectedProfile.dimension)} · ${escapeHtml(selectedProfile.label)}</strong><small>${escapeHtml(selectedProfile.outcome)}</small></div><em>나머지 변화는 보조 결과로 다룹니다.</em></div>` : "";
    return `<section class="cpd-profile-start" aria-labelledby="cpdProfileStartTitle"><div class="cpd-profile-start-head"><div><span>QUICK SETTING · COMMUNICATION GOAL</span><h3 id="cpdProfileStartTitle">청중에게 가장 먼저 일으킬 변화는 무엇인가요?</h3><p>하나를 고르면 규격과 예약 영역은 유지한 채 5단계 중 인상·색상·강조·시각 자원의 권장 시작값만 채웁니다.</p></div><em>${selectedProfile ? `${escapeHtml(selectedProfile.dimension)} 기준${adjusted ? " · 수정됨" : " 적용"}` : selected === "custom" ? "직접 구성한 설정" : "1개 선택 필요"}</em></div><div class="cpd-mece-rule"><div><strong>선택 기준</strong><span>발표 직후 가장 먼저 달라져야 할 상태 하나를 선택하세요.</span></div><em>단일 선택</em><button type="button" class="cpd-btn" data-action="journey-custom-start">권장값 없이 직접 시작</button></div><div class="cpd-profile-grid" role="radiogroup" aria-label="청중의 1차 변화 선택">${profileCards}</div>${result}</section>`;
  }

  function formatPresetDate(value) {
    try {
      return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
    } catch (_) {
      return "최근 저장";
    }
  }

  function renderUserPresetPanel() {
    const cards = userPresets.length
      ? `<div class="cpd-user-preset-list">${userPresets.map((preset) => `<article class="cpd-user-preset-card" data-user-preset-card="${escapeHtml(preset.id)}"><div><span>내 프리셋</span><strong>${escapeHtml(preset.name)}</strong><small>${escapeHtml(preset.summary?.composition || "디자인 설정")} · ${escapeHtml(preset.summary?.palette || "색상 설정")}</small></div><dl><div><dt>규격</dt><dd>${escapeHtml(preset.summary?.canvas || "저장된 규격")}</dd></div><div><dt>출력</dt><dd>${escapeHtml(preset.summary?.model || "저장된 모델")}</dd></div></dl><footer><small>${escapeHtml(formatPresetDate(preset.updatedAt || preset.createdAt))}</small><div><button type="button" class="cpd-btn soft" data-user-preset-apply="${escapeHtml(preset.id)}">적용</button><button type="button" class="cpd-btn" data-user-preset-overwrite="${escapeHtml(preset.id)}">현재값으로 갱신</button><button type="button" class="cpd-btn danger" data-user-preset-delete="${escapeHtml(preset.id)}">삭제</button></div></footer></article>`).join("")}</div>`
      : `<div class="cpd-user-preset-empty"><strong>아직 저장한 프리셋이 없습니다.</strong><span>자주 쓰는 디자인을 한 번 저장하면 다음 자료에서 질문을 건너뛸 수 있습니다.</span></div>`;
    return `<section class="cpd-user-presets" aria-labelledby="cpdUserPresetTitle"><div class="cpd-user-preset-save"><div><span>현재 디자인 저장</span><h3 id="cpdUserPresetTitle">나만의 시작점 만들기</h3><p>디자인·규격·출력 설정만 저장합니다. 발표 대상, 목적과 슬라이드 내용은 현재 프로젝트 값을 유지합니다.</p></div><label><span>프리셋 이름</span><input id="cpdUserPresetName" class="cpd-input" maxlength="40" placeholder="예: 지자체 정책보고 기본형"><button type="button" class="cpd-btn primary" data-action="save-user-preset">현재 설정 저장</button></label></div>${cards}</section>`;
  }

  function renderQuickRandomPanel() {
    const options = [
      ["all", "전체 시각 조합", "인상·팔레트·기본 배경·정보 강조·시각 자원을 함께 변경"],
      ["palette", "팔레트만", "규격과 다른 설정은 유지하고 검증된 팔레트와 기본 배경만 변경"],
      ["resources", "시각 자원만", "기존 제외 항목은 유지하고 1~2개 자원만 활용 가능으로 제안"],
    ];
    const result = quickRandomState ? `<div class="cpd-random-result" aria-live="polite"><div><span>방금 적용한 조합</span><strong>${escapeHtml(quickRandomState.label)}</strong><small>${escapeHtml(quickRandomState.help)}</small></div><dl><div><dt>인상</dt><dd>${escapeHtml(quickRandomState.values.direction)}</dd></div><div><dt>색상</dt><dd>${escapeHtml(quickRandomState.values.palette)}</dd></div><div><dt>강조</dt><dd>${escapeHtml(quickRandomState.values.emphasis)}</dd></div><div><dt>시각 자원</dt><dd>${escapeHtml(quickRandomState.values.resources)}</dd></div></dl><button type="button" class="cpd-btn soft" data-action="undo">되돌리기</button></div>` : "";
    return `<section class="cpd-random-setup" aria-labelledby="cpdRandomSetupTitle"><header><div><span>SAFE RANDOM</span><h3 id="cpdRandomSetupTitle">규격은 그대로 두고 시각 조합만 바꾸기</h3><p>이미지 크기, 헤더·푸터, 본문 여백과 명시적으로 제외한 자원은 바꾸지 않습니다.</p></div><em>대비 검사 · 즉시 되돌리기</em></header><div class="cpd-random-scope-grid">${options.map(([scope, title, help]) => `<button type="button" class="cpd-random-scope" data-quick-random="${scope}"><span aria-hidden="true">${scope === "all" ? "✦" : scope === "palette" ? "◐" : "◇"}</span><strong>${title}</strong><small>${help}</small><b>랜덤 적용</b></button>`).join("")}</div>${result}<p class="cpd-random-note">랜덤 조합은 레이아웃을 고정하지 않으며, 마음에 들지 않으면 다시 누르거나 바로 되돌릴 수 있습니다.</p></section>`;
  }

  function quickSetupSourceLabel() {
    if (state.recommendationMeta?.source === "user-preset") return `내 프리셋 · ${state.recommendationMeta.label}`;
    if (state.recommendationMeta?.source === "quick-random") return `랜덤 · ${state.recommendationMeta.label}`;
    const profile = JOURNEY_PROFILE_META[get("journey.profileId")];
    if (profile) return `퀵설정 · ${profile.dimension} ${profile.label}`;
    return "직접 설정 중";
  }

  function renderQuickSetupDialog() {
    const dialog = document.getElementById("cpdQuickSetupDialog");
    if (!dialog) return;
    if (!quickSetupUi.open) {
      dialog.hidden = true;
      dialog.innerHTML = "";
      if (![...root.querySelectorAll(".cpd-dialog-backdrop")].some((item) => item !== dialog && !item.hidden)) document.body.classList.remove("cpd-dialog-open");
      return;
    }
    const modes = [
      ["quick", "퀵설정", "목표별 권장 시작값"],
      ["presets", "내 프리셋", `${userPresets.length}개 저장`],
      ["random", "랜덤 조합", "범위별 변경"],
    ];
    const body = quickSetupUi.mode === "presets" ? renderUserPresetPanel() : quickSetupUi.mode === "random" ? renderQuickRandomPanel() : renderJourneyProfilePicker();
    dialog.innerHTML = `<section class="cpd-dialog wide cpd-quick-setup-dialog" role="dialog" aria-modal="true" aria-labelledby="cpdQuickSetupTitle" aria-describedby="cpdQuickSetupDesc"><div class="cpd-dialog-head cpd-quick-setup-modal-head"><div><span>QUICK START</span><h3 id="cpdQuickSetupTitle">질문을 줄이는 빠른 시작</h3><p id="cpdQuickSetupDesc">한 번에 적용한 뒤 필요한 단계만 열어 세부 값을 바꿀 수 있습니다.</p></div><div class="cpd-quick-setup-modal-status"><small>현재 시작점</small><strong>${escapeHtml(quickSetupSourceLabel())}</strong></div><button type="button" class="cpd-dialog-close" data-action="close-quick-setup-modal" aria-label="빠른 시작 닫기">×</button></div><nav class="cpd-quick-setup-tabs" role="tablist" aria-label="빠른 시작 방식">${modes.map(([mode, title, help]) => `<button type="button" role="tab" class="${quickSetupUi.mode === mode ? "selected" : ""}" data-quick-setup-mode="${mode}" aria-selected="${quickSetupUi.mode === mode}"><strong>${title}</strong><small>${help}</small></button>`).join("")}</nav><div class="cpd-quick-setup-body" id="cpdQuickSetupBody" role="tabpanel">${body}</div><div class="cpd-dialog-actions cpd-quick-setup-modal-actions"><span>선택한 설정은 즉시 반영되고 브라우저에 자동 저장됩니다.</span><button type="button" class="cpd-btn primary" data-action="close-quick-setup-modal">설정 마치기</button></div></section>`;
    dialog.hidden = false;
    document.body.classList.add("cpd-dialog-open");
  }

  function resetSlideStyleGalleryScroll() {
    slideStyleGalleryScrollTop = 0;
    const body = document.querySelector("#cpdSlideStyleDialog .cpd-slide-style-dialog-body");
    if (body) body.scrollTop = 0;
  }

  function disconnectSlideStyleAutoLoad() {
    slideStyleGalleryObserver?.disconnect();
    slideStyleGalleryObserver = null;
    slideStyleGalleryLoading = false;
  }

  function setupSlideStyleAutoLoad(dialog) {
    disconnectSlideStyleAutoLoad();
    const body = dialog?.querySelector(".cpd-slide-style-dialog-body");
    const sentinel = dialog?.querySelector("[data-slide-style-auto-load]");
    if (!body || !sentinel || typeof IntersectionObserver !== "function") return;
    slideStyleGalleryObserver = new IntersectionObserver((entries) => {
      if (slideStyleGalleryLoading || !entries.some((entry) => entry.isIntersecting)) return;
      slideStyleGalleryLoading = true;
      window.requestAnimationFrame(() => appendSlideStyleCards());
    }, { root: body, rootMargin: "0px 0px 420px 0px", threshold: 0.01 });
    slideStyleGalleryObserver.observe(sentinel);
  }

  function renderSlideStyleDialog() {
    const dialog = document.getElementById("cpdSlideStyleDialog");
    if (!dialog) return;
    if (!slideStyleGalleryOpen) {
      disconnectSlideStyleAutoLoad();
      dialog.hidden = true;
      dialog.innerHTML = "";
      if (![...root.querySelectorAll(".cpd-dialog-backdrop")].some((item) => item !== dialog && !item.hidden)) document.body.classList.remove("cpd-dialog-open");
      return;
    }
    const previousBody = dialog.querySelector(".cpd-slide-style-dialog-body");
    if (previousBody) slideStyleGalleryScrollTop = previousBody.scrollTop;
    disconnectSlideStyleAutoLoad();
    dialog.innerHTML = `<section class="cpd-dialog cpd-slide-style-dialog" role="dialog" aria-modal="true" aria-labelledby="cpdSlideStyleTitle" aria-describedby="cpdSlideStyleDesc"><div class="cpd-dialog-head"><div><span>STYLE GALLERY</span><h3 id="cpdSlideStyleTitle">슬라이드 디자인 스타일 갤러리</h3><p id="cpdSlideStyleDesc">스타일을 고른 뒤 색상을 맞춰 발표자료 제작 문구로 복사하거나 PromptDeck 공통 디자인에 적용하세요.</p></div><button type="button" class="cpd-dialog-close" data-action="close-slide-style-gallery" aria-label="스타일 갤러리 닫기">×</button></div><div class="cpd-slide-style-dialog-body">${renderSlideStyleGallery()}</div><div class="cpd-dialog-actions cpd-slide-style-dialog-actions">${renderSlideStyleCurrent()}<button type="button" class="cpd-btn primary" data-action="close-slide-style-gallery">설정 마치기</button></div></section>`;
    dialog.hidden = false;
    document.body.classList.add("cpd-dialog-open");
    setupSlideStyleAutoLoad(dialog);
    window.setTimeout(() => {
      const body = dialog.querySelector(".cpd-slide-style-dialog-body");
      if (body) body.scrollTop = slideStyleGalleryScrollTop;
    }, 0);
  }

  function renderDirectionJourney() {
    const identity = ["visualDirection.authority", "visualDirection.energy", "visualDirection.expression", "visualDirection.rationality"].map((path) => {
      const meta = DESIGN_AXIS_META[path];
      return clickChoiceGroup(meta.question, path, meta.values.map((title, index) => [index + 1, title]), "cpd-five-options");
    }).join("");
    const currentMedium = get("visualDirection.mediumNameKo") ? `<div class="cpd-direction-current"><div><small>현재 보조 표현 기법</small><strong>${escapeHtml(get("visualDirection.mediumNameKo"))}</strong></div><button type="button" class="cpd-btn" data-action="remove-medium">화풍 해제</button></div>` : '<div class="cpd-inline-note"><strong>보조 표현 기법 없음</strong> 기본 디자인 방향만 사용합니다.</div>';
    const advanced = `<div class="cpd-design-statement"><span>현재 디자인 방향</span><strong>${escapeHtml(effectiveDesignStatement())}</strong><small>네 가지 인상 선택을 자동으로 한 문장에 합칩니다.</small></div><div class="cpd-form-grid"><label class="cpd-field"><span>이 디자인을 떠올리게 할 단어</span><input class="cpd-input" data-path="visualDirection.conceptKeywords" maxlength="50" value="${escapeHtml(get("visualDirection.conceptKeywords"))}"></label><label class="cpd-field"><span>반복 모티프</span><input class="cpd-input" data-path="visualDirection.signatureMotif" maxlength="60" value="${escapeHtml(get("visualDirection.signatureMotif"))}"></label></div>${currentMedium}<div class="cpd-button-row"><button type="button" class="cpd-btn soft" data-action="import-mixer-medium">현재 화풍 가져오기</button><button type="button" class="cpd-btn" data-action="open-mixer-medium">비주얼 믹서에서 찾기</button></div><div id="cpdInstitutionRandom"></div>`;
    return `${panel("인상 좌표", "공식성·에너지·표현 강도·전달 태도는 서로 다른 축입니다. 각 질문에서 한 지점만 고르세요.", `<div class="cpd-click-question-list">${identity}</div>${renderIdentityOutcome()}`)}${advancedGroup("정체성 고급 편집", "키워드·반복 모티프·보조 화풍", advanced, "journeyDirection")}`;
  }

  function renderCompositionJourney() {
    const grammar = [
      ["오브젝트의 형태는 무엇으로 통일할까요?", "composition.formLanguage", [["preciseGeometric", "정밀 기하", "직선과 정렬로 구조를 선명하게"], ["softGeometric", "부드러운 기하", "둥근 형태로 친근한 질서를 형성"], ["organic", "유기적 곡선", "곡선과 비정형 흐름을 활용"], ["mixed", "혼합형", "기하 구조에 선택적 곡선을 결합"]]],
      ["선은 어떤 한 가지 역할을 맡을까요?", "composition.lineLanguage", [["fineStructural", "가는 구조선", "정렬과 관계를 섬세하게 연결"], ["boldDirectional", "굵은 방향선", "진행과 전환을 강하게 강조"], ["minimalDivider", "최소 구분선", "선을 줄이고 여백으로 분리"], ["shapeLed", "면 중심", "선 대신 색면과 블록이 주도"]]],
      ["카드·도형의 표면은 어떻게 보일까요?", "composition.surfaceLanguage", [["flat", "평면형", "그림자 없이 직접적으로 표현"], ["mattePanels", "매트 패널", "은은한 패널로 정보군을 구분"], ["controlledLayer", "절제된 다층", "얕은 전후 관계로 초점을 형성"], ["material", "선택적 재질", "핵심 오브젝트에만 물성을 부여"]]],
      ["정보는 어떤 리듬으로 흐를까요?", "composition.spatialRhythm", [["ordered", "질서형", "안정된 정렬과 순차 읽기"], ["asymmetricEditorial", "비대칭 편집형", "초점과 여백의 대비"], ["modular", "모듈형", "반복 단위로 관계를 체계화"], ["flowing", "흐름형", "방향성과 과정을 연속적으로 연결"]]],
      ["핵심을 먼저 보이게 할 주된 수단은?", "composition.hierarchyBehavior", [["scalePosition", "크기·위치", "크기와 배치 차이로 강조"], ["colorScale", "색상·크기", "역할색과 큰 수치로 강조"], ["layerPosition", "레이어·위치", "전후 관계와 위치로 시선 유도"], ["whitespaceScale", "여백·크기", "넓은 호흡과 큰 제목으로 집중"]]],
    ].map(([labelText, path, options]) => clickChoiceGroup(labelText, path, options)).join("");
    const layout = ["composition.container", "composition.layoutFreedom", "composition.density"].map((path) => {
      const meta = CHOICE_AXIS_META[path];
      return clickChoiceGroup(meta.question, path, meta.values.map(([value, title]) => [value, title]));
    }).join("");
    const rules = `<div class="cpd-form-grid"><label class="cpd-field"><span>모든 슬라이드에서 같게 유지할 것</span><textarea class="cpd-textarea" data-path="composition.consistencyAnchor" maxlength="120">${escapeHtml(get("composition.consistencyAnchor"))}</textarea><small class="cpd-field-note">정체성을 묶는 기준만 적습니다.</small></label><label class="cpd-field"><span>페이지 목적에 따라 달라질 것</span><textarea class="cpd-textarea" data-path="composition.variationRule" maxlength="120">${escapeHtml(get("composition.variationRule"))}</textarea><small class="cpd-field-note">변주를 허용할 범위만 적습니다.</small></label>${selectField("기본 그리드", "composition.grid", [["symmetric", "대칭"], ["modular", "모듈"], ["asymmetricModular", "비대칭 모듈"], ["editorial", "에디토리얼"]])}${rangeField("기본 여백 비율", "composition.whitespacePercent", 10, 40)}${rangeField("핵심 초점 영역", "composition.focalAreaPercent", 25, 55)}${rangeField("오브젝트 레이어 수", "composition.layerCount", 2, 7, "")}<div class="cpd-span-all cpd-checks">${check("슬라이드 목적에 따라 레이아웃 변주", "composition.layoutDiversity", "공통 DNA는 유지하면서 페이지별 큰 구도를 달리할 수 있습니다.")}</div></div>`;
    return `${panel("오브젝트 문법", "형태·선·표면·리듬·위계는 겹치지 않는 다섯 결정입니다. 배경 표면은 매체·배경 단계에서 따로 정합니다.", `<div class="cpd-click-question-list">${grammar}</div>`)}${panel("레이아웃 운용", "카드 경계·페이지 변주·정보 밀도를 각각 한 번씩 정합니다.", `<div class="cpd-click-question-list">${layout}</div>`)}${advancedGroup("시스템 규칙 고급 편집", "일관성·변주·그리드·여백", rules, "journeyStructure")}`;
  }

  function renderOutputJourney() {
    const model = clickChoiceGroup("이미지 제작 모델", "project.targetModel", Object.entries(MODEL_PROFILES).map(([value, item]) => [value, item.label, item.help]));
    const mode = clickChoiceGroup("출력 형식", "project.outputMode", Object.entries(OUTPUT_MODE_PROFILES).map(([value, item]) => [value, item.label, `${item.help} · ${item.length}`]));
    const language = clickChoiceGroup("프롬프트 언어", "project.promptLanguage", [["ko", "한국어"], ["en", "English"]]);
    const constraintsEnabled = isSectionEnabled("constraints");
    const constraintBody = `<div class="cpd-section-inline-toggle"><div><strong>추가 품질 보호</strong><small>기본 보호 조건 외에 상세 금지 규칙을 프롬프트에 포함합니다.</small></div><button type="button" class="cpd-section-toggle${constraintsEnabled ? " active" : ""}" data-section-toggle="constraints" aria-pressed="${constraintsEnabled}"><span aria-hidden="true"></span>${constraintsEnabled ? "사용 중" : "선택 안 함"}</button></div>${constraintsEnabled ? renderConstraints() : ""}`;
    return `${panel("출력 설정", "모델과 용도에 맞는 길이로 디자인 가이드를 구성합니다.", `<div class="cpd-click-question-list">${model}${mode}${language}</div>`)}${renderQuality()}${advancedGroup("고급 품질 보호", "필요한 경우에만 추가 금지 조건 사용", constraintBody, "journeyQuality")}`;
  }

  function commaItems(value) {
    return [...new Set(String(value || "").split(",").map((item) => item.trim()).filter(Boolean))];
  }

  function commaField(labelText, path, placeholder, suggestions = []) {
    const items = commaItems(get(path));
    const inputId = `cpd-${path.replace(/[^a-z0-9]+/gi, "-")}`;
    const suggestionButtons = suggestions.length
      ? `<span class="cpd-frame-token-list" aria-label="${escapeHtml(labelText)} 빠른 선택">${suggestions.map((item) => `<button type="button" class="cpd-frame-token${items.includes(item) ? " selected" : ""}" data-frame-token-path="${path}" data-frame-token="${escapeHtml(item)}" aria-pressed="${items.includes(item)}">${escapeHtml(item)}</button>`).join("")}</span>`
      : "";
    return `<div class="cpd-field cpd-comma-field"><label for="${inputId}">${escapeHtml(labelText)}</label><input class="cpd-input" id="${inputId}" data-path="${path}" data-comma-input="${path}" maxlength="120" value="${escapeHtml(get(path))}" placeholder="${escapeHtml(placeholder)}"><small class="cpd-field-note">필요한 항목을 누르거나 쉼표로 직접 입력하세요. 입력 순서가 표시 순서가 됩니다.</small>${suggestionButtons}<span class="cpd-comma-chips" data-comma-chips="${path}">${items.length ? items.map((item) => `<i>${escapeHtml(item)}</i>`).join("") : "<em>표시할 정보 없음</em>"}</span></div>`;
  }

  function updateCommaChips(path, value) {
    const host = root.querySelector(`[data-comma-chips="${path}"]`);
    if (!host) return;
    const items = commaItems(value);
    host.innerHTML = items.length ? items.map((item) => `<i>${escapeHtml(item)}</i>`).join("") : "<em>표시할 정보 없음</em>";
  }

  function frameSpaceStatus() {
    const occupied = Number(get("frame.headerHeightPercent")) + Number(get("frame.footerHeightPercent")) + (Number(get("frame.bodySafeMarginPercent")) * 2);
    if (occupied > 42) return ["본문 공간 좁음", "warning"];
    if (occupied > 34) return ["본문 공간 보통", "balanced"];
    return ["본문 공간 넉넉함", "comfortable"];
  }

  function updateFramePreviewInline() {
    const preview = root.querySelector("[data-frame-preview]");
    if (!preview) return;
    const header = Math.max(0, Number(get("frame.headerHeightPercent")) || 0);
    const footer = Math.max(0, Number(get("frame.footerHeightPercent")) || 0);
    const safe = Math.max(0, Number(get("frame.bodySafeMarginPercent")) || 0);
    preview.style.setProperty("--cpd-frame-header", `${header * 1.7}px`);
    preview.style.setProperty("--cpd-frame-footer", `${footer * 1.7}px`);
    preview.style.setProperty("--cpd-frame-safe", `${safe * 1.25}px`);
    preview.setAttribute("aria-label", `헤더 ${header}퍼센트, 푸터 ${footer}퍼센트, 본문 바깥 여백 ${safe}퍼센트`);
    const values = { header, footer, safe, body: Math.max(0, 100 - header - footer) };
    Object.entries(values).forEach(([key, value]) => {
      root.querySelectorAll(`[data-frame-preview-value="${key}"]`).forEach((element) => { element.textContent = `${value}%`; });
    });
    const [status, tone] = frameSpaceStatus();
    const statusElement = root.querySelector("[data-frame-space-status]");
    if (statusElement) {
      statusElement.textContent = status;
      statusElement.dataset.tone = tone;
    }
  }

  function renderFormatJourney() {
    const activePreset = Object.entries(CANVAS_PRESETS).find(([, preset]) => preset.aspectRatio === get("canvas.aspectRatio") && preset.width === Number(get("canvas.width")) && preset.height === Number(get("canvas.height")))?.[0] || "";
    const presets = `<div class="cpd-canvas-presets">${Object.entries(CANVAS_PRESETS).map(([key, preset]) => `<button type="button" class="cpd-canvas-preset${activePreset === key ? " active" : ""}" data-canvas-preset="${key}" aria-pressed="${activePreset === key}"><strong>${escapeHtml(preset.label)}</strong><small>${escapeHtml(preset.help)}</small></button>`).join("")}</div>`;
    const header = Number(get("frame.headerHeightPercent")) || 0;
    const footer = Number(get("frame.footerHeightPercent")) || 0;
    const safe = Number(get("frame.bodySafeMarginPercent")) || 0;
    const [spaceStatus, spaceTone] = frameSpaceStatus();
    const overview = `<div class="cpd-frame-overview"><div class="cpd-frame-preview" data-frame-preview style="--cpd-frame-header:${header * 1.7}px;--cpd-frame-footer:${footer * 1.7}px;--cpd-frame-safe:${safe * 1.25}px" role="img" aria-label="헤더 ${header}퍼센트, 푸터 ${footer}퍼센트, 본문 바깥 여백 ${safe}퍼센트"><div class="cpd-frame-preview-header"><span>헤더</span><b data-frame-preview-value="header">${header}%</b></div><div class="cpd-frame-preview-body"><i aria-hidden="true"></i><span>본문 영역</span><b data-frame-preview-value="body">${Math.max(0, 100 - header - footer)}%</b><small>바깥 여백 <em data-frame-preview-value="safe">${safe}%</em></small></div><div class="cpd-frame-preview-footer"><span>푸터</span><b data-frame-preview-value="footer">${footer}%</b></div></div><div class="cpd-frame-overview-copy"><span>AREA PREVIEW</span><h4>슬라이드에서 사용할 공간을 확인하세요</h4><p>슬라이더를 움직이면 왼쪽 예상도가 바로 바뀝니다. 실제 색상과 표현 방식은 다음 단계의 시각 인상과 팔레트에 맞춰 AI가 구성합니다.</p><strong data-frame-space-status data-tone="${spaceTone}">${spaceStatus}</strong></div></div>`;
    const frame = `<div class="cpd-frame-setting-rows"><section class="cpd-frame-setting-row"><header><span>1</span><div><h4>헤더</h4><p>슬라이드 위쪽에 반복할 영역</p></div></header><div class="cpd-frame-setting-cell cpd-frame-ratio-cell">${rangeField("헤더 비율", "frame.headerHeightPercent", 0, 16)}</div><div class="cpd-frame-setting-cell">${commaField("헤더 정보 항목", "frame.headerElements", "파트명, 제목, 부제", ["파트명", "제목", "부제", "기관명"])}</div></section><section class="cpd-frame-setting-row"><header><span>2</span><div><h4>푸터</h4><p>슬라이드 아래쪽에 반복할 영역</p></div></header><div class="cpd-frame-setting-cell cpd-frame-ratio-cell">${rangeField("푸터 비율", "frame.footerHeightPercent", 0, 12)}</div><div class="cpd-frame-setting-cell">${commaField("푸터 정보 항목", "frame.footerElements", "출처, 기관명, 날짜, 페이지 번호", ["출처", "기관명", "날짜", "페이지 번호"])}</div></section><section class="cpd-frame-setting-row cpd-frame-setting-row-body"><header><span>3</span><div><h4>본문</h4><p>내용이 가장자리와 겹치지 않게 보호</p></div></header><div class="cpd-frame-setting-cell cpd-frame-ratio-cell">${rangeField("본문 안전 여백", "frame.bodySafeMarginPercent", 3, 12)}</div><div class="cpd-frame-region-help"><strong>상·하·좌·우에 동일하게 적용</strong><span>본문 내부 구성과 개체 간격은 슬라이드 내용에 맞춰 AI가 결정합니다.</span></div></section></div>`;
    return `${panel("이미지 규격", "먼저 최종 이미지 크기를 고릅니다. 이 값은 모든 슬라이드에 동일하게 적용됩니다.", presets)}${panel("반복 영역과 본문 여백", "위에서 아래 순서로 공간과 표시 정보를 함께 설정하세요.", `${overview}${frame}<div class="cpd-inline-note cpd-frame-special-note"><strong>표지·목차·간지·맺음말은 전체 화면 사용</strong><span>이 네 가지 페이지에는 헤더와 푸터를 표시하지 않습니다.</span></div>`)}`;
  }

  function slideStylePreviewSource(style) {
    return String(style?.previewImage || `assets/slide-style-previews/${style?.id || ""}.jpg`).trim();
  }

  function renderSlideStylePreview(style, labelText = "") {
    const imageSource = slideStylePreviewSource(style);
    const accessibleLabel = labelText || `${style.nameKo} 스타일로 실제 생성한 슬라이드 미리보기`;
    return `<span class="cpd-slide-style-preview"><img class="cpd-slide-style-preview-image" src="${escapeHtml(imageSource)}" alt="${escapeHtml(accessibleLabel)}" width="960" height="540" loading="lazy" decoding="async"></span>`;
  }

  function renderSlideStyleDraft() {
    const style = SLIDE_STYLE_CATALOG?.get?.(slideStyleUi.draftId);
    if (!style) return "";
    ensureSlideStylePromptPalette(style);
    const palette = style.settings.colors;
    const swatches = [palette.primary, palette.secondary, palette.accent, palette.background, palette.textPrimary]
      .map((color) => `<i style="background:${escapeHtml(color)}" aria-hidden="true"></i>`).join("");
    const facetBadges = [
      ...(style.facets?.workStages || []).slice(0, 2).map((value) => SLIDE_STYLE_FACET_LABELS[`workStage:${value}`] || value),
      ...(style.facets?.documentTypes || []).slice(0, 1).map((value) => SLIDE_STYLE_FACET_LABELS[`documentType:${value}`] || value),
      ...(style.facets?.audiences || []).slice(0, 2).map((value) => SLIDE_STYLE_FACET_LABELS[`audience:${value}`] || value),
    ];
    const facetMarkup = facetBadges.length ? `<div class="cpd-slide-style-draft-facets">${[...new Set(facetBadges)].map((labelText) => `<span>${escapeHtml(labelText)}</span>`).join("")}</div>` : "";
    return `<section class="cpd-slide-style-draft" aria-labelledby="cpdSlideStyleDraftTitle">
      <div class="cpd-slide-style-draft-preview">${renderSlideStylePreview(style, `${style.nameKo} 적용 전 미리보기`)}</div>
      <div class="cpd-slide-style-draft-copy"><span>${escapeHtml(SLIDE_STYLE_CATALOG.categoryLabel(style.category))}</span><h4 id="cpdSlideStyleDraftTitle">${escapeHtml(style.nameKo)} <small>${escapeHtml(style.nameEn)}</small></h4><p>${escapeHtml(style.description)}</p>${facetMarkup}<div class="cpd-slide-style-draft-meta"><span class="cpd-slide-style-swatches" role="img" aria-label="${escapeHtml(`${style.nameKo} 대표 색상 5종`)}">${swatches}</span><strong>${escapeHtml(style.bestFor)}</strong></div>${renderSlideStylePromptTool(style)}<div class="cpd-slide-style-scope-note"><strong>PromptDeck 공통 디자인에도 적용하기</strong><span>인상만 적용하면 현재 팔레트와 타이포그래피를 유지합니다. 전체 적용은 시각 문법·색상·글자·배경·활용 자원을 함께 맞춥니다.</span></div><div class="cpd-button-row cpd-slide-style-draft-actions"><button type="button" class="cpd-btn" data-action="apply-slide-style-character">디자인 인상만 적용</button><button type="button" class="cpd-btn primary" data-action="apply-slide-style-full">전체 디자인 적용</button><button type="button" class="cpd-btn" data-action="cancel-slide-style-draft">취소</button></div></div>
    </section>`;
  }

  function renderSlideStyleInspector() {
    const draft = renderSlideStyleDraft();
    if (draft) return `<aside class="cpd-slide-style-inspector has-selection" aria-label="선택한 스타일 상세 설정">${draft}</aside>`;
    return '<aside class="cpd-slide-style-inspector" aria-label="선택한 스타일 상세 설정"><div class="cpd-slide-style-inspector-empty"><span>STYLE PRESET</span><strong>스타일을 선택하세요</strong><p>목록의 카드를 누르면 큰 미리보기, 색상 선택, 복사용 제작 문구를 바로 확인할 수 있습니다.</p></div></aside>';
  }

  function syncSlideStyleSelectionUi() {
    const dialog = document.getElementById("cpdSlideStyleDialog");
    if (!dialog || dialog.hidden) return;
    dialog.querySelectorAll("[data-slide-style-id]").forEach((card) => {
      const selected = card.dataset.slideStyleId === slideStyleUi.draftId;
      card.classList.toggle("selected", selected);
      card.setAttribute("aria-pressed", String(selected));
    });

    const inspector = dialog.querySelector(".cpd-slide-style-inspector");
    if (!inspector) return;
    const style = SLIDE_STYLE_CATALOG?.get?.(slideStyleUi.draftId);
    if (!style) {
      inspector.classList.remove("has-selection");
      inspector.innerHTML = '<div class="cpd-slide-style-inspector-empty"><span>STYLE PRESET</span><strong>스타일을 선택하세요</strong><p>목록의 카드를 누르면 큰 미리보기, 색상 선택, 복사용 제작 문구를 바로 확인할 수 있습니다.</p></div>';
      inspector.scrollTop = 0;
      return;
    }

    const draft = inspector.querySelector(".cpd-slide-style-draft");
    if (!draft) {
      inspector.classList.add("has-selection");
      inspector.innerHTML = renderSlideStyleDraft();
      inspector.scrollTop = 0;
      return;
    }

    inspector.classList.add("has-selection");
    const image = draft.querySelector(".cpd-slide-style-preview-image");
    const nextImageSource = slideStylePreviewSource(style);
    const nextImageAlt = `${style.nameKo} 적용 전 미리보기`;
    if (image && image.getAttribute("src") !== nextImageSource) {
      const preload = new Image();
      const applyImage = () => {
        if (!image.isConnected || slideStyleUi.draftId !== style.id) return;
        image.src = nextImageSource;
        image.alt = nextImageAlt;
      };
      preload.decoding = "async";
      preload.addEventListener("load", applyImage, { once: true });
      preload.addEventListener("error", applyImage, { once: true });
      preload.src = nextImageSource;
      if (preload.complete) applyImage();
    } else if (image) {
      image.alt = nextImageAlt;
    }

    const category = draft.querySelector(".cpd-slide-style-draft-copy > span");
    const title = draft.querySelector(".cpd-slide-style-draft-copy h4");
    const description = draft.querySelector(".cpd-slide-style-draft-copy > p");
    const facets = draft.querySelector(".cpd-slide-style-draft-facets");
    const nextFacetLabels = [
      ...(style.facets?.workStages || []).slice(0, 2).map((value) => SLIDE_STYLE_FACET_LABELS[`workStage:${value}`] || value),
      ...(style.facets?.documentTypes || []).slice(0, 1).map((value) => SLIDE_STYLE_FACET_LABELS[`documentType:${value}`] || value),
      ...(style.facets?.audiences || []).slice(0, 2).map((value) => SLIDE_STYLE_FACET_LABELS[`audience:${value}`] || value),
    ];
    if (!facets && nextFacetLabels.length) {
      inspector.innerHTML = renderSlideStyleDraft();
      inspector.scrollTop = 0;
      return;
    }
    const swatches = draft.querySelector(".cpd-slide-style-swatches");
    const bestFor = draft.querySelector(".cpd-slide-style-draft-meta > strong");
    if (category) category.textContent = SLIDE_STYLE_CATALOG.categoryLabel(style.category);
    if (title) title.innerHTML = `${escapeHtml(style.nameKo)} <small>${escapeHtml(style.nameEn)}</small>`;
    if (description) description.textContent = style.description;
    if (facets) {
      facets.innerHTML = [...new Set(nextFacetLabels)].map((labelText) => `<span>${escapeHtml(labelText)}</span>`).join("");
    }
    if (bestFor) bestFor.textContent = style.bestFor;
    if (swatches) {
      const palette = style.settings.colors;
      const colors = [palette.primary, palette.secondary, palette.accent, palette.background, palette.textPrimary];
      swatches.setAttribute("aria-label", `${style.nameKo} 대표 색상 5종`);
      swatches.querySelectorAll("i").forEach((swatch, index) => { swatch.style.background = colors[index] || ""; });
    }
    const promptTool = draft.querySelector(".cpd-slide-style-prompt-tool");
    if (promptTool) promptTool.outerHTML = renderSlideStylePromptTool(style);
    inspector.scrollTop = 0;
  }

  function renderSlideStyleCurrent() {
    const applied = selectedSlideStyle();
    if (!applied) return '<span class="cpd-slide-style-save-note">선택한 스타일은 즉시 반영되고 브라우저에 자동 저장됩니다.</span>';
    const customized = isSlideStyleCustomized();
    return `<div class="cpd-slide-style-current" role="status" aria-live="polite"><div><span>현재 갤러리 스타일</span><strong>${escapeHtml(applied.nameKo)} <small>${escapeHtml(applied.nameEn)}</small></strong><em>${get("visualStyle.applyScope") === "character" ? "디자인 인상 적용" : "전체 디자인 적용"}${customized ? " · 사용자 조정됨" : ""}</em></div><button type="button" class="cpd-btn" data-action="clear-slide-style">연결만 해제</button></div>`;
  }

  function filteredSlideStyles() {
    return SLIDE_STYLE_CATALOG?.list?.({
      category: slideStyleUi.category,
      query: slideStyleUi.query,
      useCase: slideStyleUi.useCase,
      workStage: slideStyleUi.workStage,
      documentType: slideStyleUi.documentType,
      audience: slideStyleUi.audience,
      supportInstrument: slideStyleUi.supportInstrument,
      media: slideStyleUi.media,
    }) || [];
  }

  function renderSlideStyleFacetFilters() {
    const activeCount = SLIDE_STYLE_FACET_FILTERS.filter((filter) => slideStyleUi[filter.key] !== "all").length;
    const fields = SLIDE_STYLE_FACET_FILTERS.map((filter) => `<label><span>${escapeHtml(filter.label)}</span><select class="cpd-input" data-slide-style-filter="${filter.key}">${filter.options.map(([value, labelText]) => `<option value="${escapeHtml(value)}"${slideStyleUi[filter.key] === value ? " selected" : ""}>${escapeHtml(labelText)}</option>`).join("")}</select></label>`).join("");
    return `<div class="cpd-slide-style-facet-panel"><div class="cpd-slide-style-facet-head"><div><strong>업무·문서 조건으로 좁히기</strong><span>제안·기획부터 기술사업화와 행사·교육까지 목적·단계·문서·대상·표현방식을 함께 검색할 수 있습니다.</span></div>${activeCount ? `<button type="button" class="cpd-btn" data-action="clear-slide-style-filters">필터 ${activeCount}개 해제</button>` : ""}</div><div class="cpd-slide-style-facet-grid">${fields}</div></div>`;
  }

  function renderSlideStyleCard(style, applied = selectedSlideStyle(), customized = isSlideStyleCustomized()) {
    const isDraft = slideStyleUi.draftId === style.id;
    const isApplied = applied?.id === style.id;
    const stateLabel = isApplied ? customized ? "적용 후 조정됨" : "현재 적용" : style.recommended ? "추천" : Number(style.introducedIn) === Number(SLIDE_STYLE_CATALOG.version) ? "신규" : "";
    return `<button type="button" class="cpd-slide-style-card${isDraft ? " selected" : ""}${isApplied ? " applied" : ""}" data-slide-style-id="${escapeHtml(style.id)}" aria-pressed="${isDraft}" aria-label="${escapeHtml(`${style.nameKo} 스타일 상세 보기${isApplied ? `, ${stateLabel}` : ""}`)}">${renderSlideStylePreview(style)}<span class="cpd-slide-style-card-copy"><span><strong>${escapeHtml(style.nameKo)}</strong>${stateLabel ? `<em class="${isApplied ? "applied" : ""}">${escapeHtml(stateLabel)}</em>` : ""}</span><b>${escapeHtml(style.nameEn)}</b><small>${escapeHtml(style.description)}</small><i>${escapeHtml(style.bestFor)}</i></span></button>`;
  }

  function renderSlideStyleAutoLoad(visibleCount, totalCount) {
    if (visibleCount >= totalCount) return "";
    return `<div class="cpd-slide-style-auto-load" data-slide-style-auto-load role="status" aria-live="polite"><i aria-hidden="true"></i><span>${visibleCount} / ${totalCount}개 표시 · 아래로 스크롤하면 자동으로 더 불러옵니다.</span></div>`;
  }

  function appendSlideStyleCards() {
    const dialog = document.getElementById("cpdSlideStyleDialog");
    const grid = dialog?.querySelector(".cpd-slide-style-grid");
    const sentinel = dialog?.querySelector("[data-slide-style-auto-load]");
    if (!slideStyleGalleryOpen || !grid || !sentinel) {
      disconnectSlideStyleAutoLoad();
      return;
    }
    const allStyles = filteredSlideStyles();
    const start = grid.querySelectorAll("[data-slide-style-id]").length;
    const nextStyles = allStyles.slice(start, start + 24);
    if (nextStyles.length) {
      const applied = selectedSlideStyle();
      const customized = isSlideStyleCustomized();
      grid.insertAdjacentHTML("beforeend", nextStyles.map((style) => renderSlideStyleCard(style, applied, customized)).join(""));
      slideStyleUi.visible = start + nextStyles.length;
    }
    const visibleCount = Math.min(start + nextStyles.length, allStyles.length);
    const status = sentinel.querySelector("span");
    if (visibleCount >= allStyles.length) {
      if (status) status.textContent = `전체 ${allStyles.length}개 스타일을 표시했습니다.`;
      sentinel.dataset.complete = "true";
      disconnectSlideStyleAutoLoad();
    } else {
      if (status) status.textContent = `${visibleCount} / ${allStyles.length}개 표시 · 아래로 스크롤하면 자동으로 더 불러옵니다.`;
      slideStyleGalleryLoading = false;
    }
  }

  function renderSlideStyleGallery() {
    if (!SLIDE_STYLE_CATALOG) return '<div class="cpd-inline-note"><strong>스타일 카탈로그를 불러오지 못했습니다.</strong> 페이지를 새로고침한 뒤 다시 시도해주세요.</div>';
    const applied = selectedSlideStyle();
    const customized = isSlideStyleCustomized();
    const categories = [["recommended", "추천"], ["all", "전체"], ...SLIDE_STYLE_CATALOG.categories.map((item) => [item.id, item.label])];
    const allStyles = filteredSlideStyles();
    const styles = allStyles.slice(0, slideStyleUi.visible);
    const cards = styles.length ? styles.map((style) => renderSlideStyleCard(style, applied, customized)).join("") : '<div class="cpd-slide-style-empty"><strong>조건에 맞는 스타일이 없습니다.</strong><span>검색어를 줄이거나 다른 카테고리를 선택해주세요.</span></div>';
    const autoLoad = renderSlideStyleAutoLoad(styles.length, allStyles.length);
    return `<div class="cpd-slide-style-gallery"><div class="cpd-slide-style-toolbar"><label class="cpd-slide-style-search"><span>스타일 검색</span><div><input class="cpd-input" data-slide-style-query value="${escapeHtml(slideStyleUi.query)}" placeholder="예: 사업계획, RFP, 서비스 블루프린트, PoC"><button type="button" class="cpd-btn" data-action="slide-style-search">검색</button>${slideStyleUi.query ? '<button type="button" class="cpd-btn" data-action="clear-slide-style-search">지우기</button>' : ""}</div></label><div class="cpd-slide-style-count"><strong>${allStyles.length}</strong><span>개 스타일</span></div></div><div class="cpd-slide-style-filters" role="tablist" aria-label="슬라이드 디자인 스타일 카테고리">${categories.map(([id, labelText]) => `<button type="button" role="tab" class="${slideStyleUi.category === id ? "active" : ""}" data-slide-style-category="${id}" aria-selected="${slideStyleUi.category === id}">${escapeHtml(labelText)}</button>`).join("")}</div>${renderSlideStyleFacetFilters()}<div class="cpd-slide-style-workspace"><div class="cpd-slide-style-browser"><div class="cpd-slide-style-grid">${cards}</div>${autoLoad}<p class="cpd-slide-style-footnote">각 미리보기는 해당 스타일의 시각 문법을 반영해 실제 생성한 샘플 슬라이드입니다. 실제 콘텐츠·수치·산업 대상은 개별 슬라이드 명세가 결정합니다.</p></div>${renderSlideStyleInspector()}</div></div>`;
  }

  function renderVisualStyleJourney() {
    return panel("세 개의 슬라이더로 전체 인상을 조정하세요", "상단 스타일 갤러리에서 고른 프리셋을 그대로 쓰거나, 상반되는 성격 사이의 좌표를 움직여 이 발표에 맞게 다듬을 수 있습니다.", `<div class="cpd-design-axis-grid cpd-five-stage-axes">${choiceAxis("visualStyle.formality")}${choiceAxis("visualStyle.energy")}${choiceAxis("visualStyle.expression")}</div><div class="cpd-inline-note"><strong>레이아웃 자동 결정</strong> 각 슬라이드의 주장, 증거 관계, 정보량에 따라 읽기 순서·공간 위계·개체 크기·매체를 AI가 별도로 선택합니다.</div>`);
  }

  function renderPaletteJourney() {
    const base = clickChoiceGroup("기본 캔버스 배경", "colors.baseCanvas", [["white", "흰색 기본 배경", "팔레트는 글자·도형·강조·표면에 사용"], ["palette", "팔레트 배경", "선택한 Background 색상을 기본 캔버스로 사용"]]);
    return `${panel("기본 배경", "실사 배경이나 이미지 합성은 5단계의 활용 가능 자원으로 별도 설정됩니다.", `<div class="cpd-click-question-list cpd-base-canvas-choice">${base}</div>`)}${renderColors()}`;
  }

  function renderTypographyEmphasisJourney() {
    return panel("정보 강조의 중심", "정확한 글꼴명이나 크기를 고정하지 않습니다. AI가 한글 가독성을 지키면서 콘텐츠의 위계에 맞는 크기·굵기·간격을 결정합니다.", `<div class="cpd-design-axis-grid cpd-five-stage-axes single">${choiceAxis("typography.emphasis")}</div><div class="cpd-inline-note"><strong>항상 유지</strong> 제목·본문·수치의 한글 글리프와 제공된 문구를 정확히 보존하고, 작은 글자에 의존하지 않으며, 핵심 지표와 성과는 정보 위계상 먼저 보이게 합니다.</div>`);
  }

  const RESOURCE_META = [
    ["photo", "실사 이미지", "현장·시설·제품·사람의 실제 맥락이 설득에 도움이 될 때", { titleEn: "photography", guidanceKo: "실사는 명세와 직접 연결된 자연색 맥락 장면으로 사용하고 실제 사례·성과처럼 꾸미지 않는다", guidanceEn: "use natural-color photography directly tied to the brief and never present a fabricated scene as factual evidence" }],
    ["layeredComposite", "다중 레이어 이미지 합성", "사진·데이터·주석을 하나의 장면으로 결합할 때", { titleEn: "multi-layer image composition", guidanceKo: "다중 레이어는 배경 맥락·핵심 증거·정밀 주석에 서로 다른 의미 역할을 부여한다", guidanceEn: "assign distinct semantic roles to contextual background, key evidence, and precise annotation layers" }],
    ["icons", "아이콘·픽토그램", "범주·절차·수량을 빠르게 식별하게 할 때", { titleEn: "icons and pictograms", guidanceKo: "아이콘·픽토그램은 한 계열의 단순한 형태로 범주·단계·상태만 구분하고 문구·수치를 대체하지 않는다", guidanceEn: "use one consistent, simple icon family only to distinguish categories, steps, or states, never to replace wording or figures" }],
    ["gradients", "그라데이션 효과", "공간 깊이·방향·영역 전환을 분명하게 할 때", { titleEn: "gradient effects", guidanceKo: "그라데이션은 방향·깊이·영역 전환을 설명하는 국부 범위에만 사용하고 화면 전체를 흐리거나 물들이지 않는다", guidanceEn: "use gradients locally to explain direction, depth, or zone transitions without tinting or softening the full canvas" }],
    ["threeD", "3D 개체", "제품·설비·소재의 구조와 작동을 보여줄 때", { titleEn: "3D objects", guidanceKo: "3D는 실제 구조·재질·작동을 설명하는 절제된 주 대상에만 사용하고 장난감·게임맵처럼 과장하지 않는다", guidanceEn: "reserve restrained 3D for a primary subject whose real structure, material, or operation must be explained; avoid toy-like exaggeration" }],
    ["illustration", "일러스트레이션", "추상 개념이나 미래 상태를 직관적으로 설명할 때", { titleEn: "illustration", guidanceKo: "일러스트는 추상 개념을 설명하는 일관된 시각 은유로 사용하고 사실 사진이나 증거처럼 보이게 하지 않는다", guidanceEn: "use illustration as a consistent visual metaphor for abstract concepts, never as documentary photography or factual evidence" }],
    ["dataVisualization", "데이터 시각화", "비교·추이·비중·분포를 정확히 전달할 때", { titleEn: "data visualization", guidanceKo: "데이터 시각화는 값·축·단위·비례·범례와 데이터 귀속을 정확히 보존한다", guidanceEn: "preserve values, axes, units, proportions, legends, and data ownership exactly in every data visualization" }],
    ["diagramInfographic", "다이어그램·인포그래픽", "과정·인과·구조·관계를 의미 중심으로 설명할 때", { titleEn: "diagrams and infographics", guidanceKo: "다이어그램·인포그래픽은 노드·연결·방향·그룹의 의미 구조를 보존하고 장식 화살표나 동일 상자 반복으로 축소하지 않는다", guidanceEn: "preserve semantic nodes, connections, direction, and grouping instead of reducing diagrams to decorative arrows or repeated equal boxes" }],
    ["typographicFocal", "타이포그래피 중심 표현", "핵심 문장이나 주요 수치 자체를 시각적 초점으로 만들 때", { titleEn: "typographic focal expression", guidanceKo: "타이포그래피 중심 표현은 정확한 핵심 문장·수치 하나를 지배적 초점으로 만들고 작은 글자나 중복 문구에 의존하지 않는다", guidanceEn: "make one exact key statement or figure the dominant focal anchor without relying on tiny type or duplicated wording" }],
  ];

  const RESOURCE_PRESETS = [
    ["photoEditorial", "실사 + 정보 레이어", "자연스러운 실사를 주 장면으로 두고 데이터·주석을 편집 레이어로 결합", { photo: "allow", layeredComposite: "allow" }],
    ["dataNarrative", "데이터 + 다이어그램", "정확한 수치와 관계 구조를 한 논증 안에서 연결", { dataVisualization: "allow", diagramInfographic: "allow" }],
    ["pictogramExplanation", "아이콘 + 설명 그래픽", "일관된 픽토그램과 다이어그램·일러스트로 개념과 절차를 설명", { icons: "allow", diagramInfographic: "allow", illustration: "allow" }],
    ["automatic", "전체 AI 판단", "개별 제외도 해제하고 모든 자원의 사용 여부를 내용에 맞춰 다시 판단", null],
  ];

  function currentResourcePolicy() {
    const allowed = [];
    const excluded = [];
    const automatic = [];
    RESOURCE_META.forEach(([key, title, , meta = {}]) => {
      const mode = get(`resources.${key}`);
      const item = { key, title, titleEn: meta.titleEn || title, guidanceKo: meta.guidanceKo || "", guidanceEn: meta.guidanceEn || "", mode };
      if (mode === "allow") allowed.push(item);
      else if (mode === "exclude") excluded.push(item);
      else automatic.push(item);
    });
    return {
      allowed,
      excluded,
      automatic,
      usable: [...allowed, ...automatic],
      excludes(key) { return excluded.some((item) => item.key === key); },
    };
  }

  function currentResourceCombinationContracts(resourcePolicy = currentResourcePolicy()) {
    const preferred = new Set(resourcePolicy.allowed.map((item) => item.key));
    const excluded = new Set(resourcePolicy.excluded.map((item) => item.key));
    const contracts = [];
    const add = (id, ko, en) => contracts.push({ id, ko, en });
    if (preferred.has("photo") && preferred.has("layeredComposite")) add(
      "photoEditorialLayering",
      "실사 한 장을 주 맥락 레이어로 두고 데이터·다이어그램·주석을 정밀한 2D 편집 레이어로 연결한다. 피사체 간 원근·스케일·조명·그림자·색온도를 자연스럽게 맞추고 떠다니는 유리 패널·홀로그램·무관한 사진 콜라주를 피한다",
      "Use one believable photograph as the primary context layer and connect data, diagrams, and annotations as precise 2D editorial layers. Match perspective, scale, lighting, shadows, and color temperature; avoid floating glass panels, holograms, and unrelated photo collage",
    );
    if (preferred.has("layeredComposite") && excluded.has("photo")) add(
      "nonPhotoLayering",
      "실사를 제외한 다중 레이어는 데이터·다이어그램·타이포그래피·주석과 색면만으로 구성하고 사진처럼 보이는 허위 장면을 만들지 않는다",
      "When photography is excluded, build multi-layer compositions only from data, diagrams, typography, annotations, and color fields; do not fabricate photo-like scenes",
    );
    if (preferred.has("dataVisualization") && preferred.has("diagramInfographic")) add(
      "dataDiagram",
      "데이터 마크는 정확한 수치와 귀속을 담당하고 다이어그램 연결은 과정·인과·구조만 설명하도록 역할을 분리한다",
      "Keep data marks responsible for exact values and ownership while diagram connections explain only process, causality, or structure",
    );
    if (preferred.has("icons") && preferred.has("diagramInfographic")) add(
      "iconDiagram",
      "픽토그램은 다이어그램의 노드·단계 식별을 돕는 보조 표식으로만 사용하고 연결 의미나 텍스트 라벨을 대신하지 않는다",
      "Use pictograms only as supporting identifiers for diagram nodes or steps; never let them replace connection meaning or text labels",
    );
    if (preferred.has("threeD") && preferred.has("layeredComposite")) add(
      "technical3dLayering",
      "3D 주 대상은 하나로 제한하고 구조선·수치·라벨은 원근에 맞는 정밀한 2D 주석 레이어로 결합한다",
      "Limit the composition to one primary 3D subject and combine structural lines, figures, and labels as precise 2D annotation layers aligned to its perspective",
    );
    if (preferred.has("photo") && preferred.has("illustration")) add(
      "photoIllustration",
      "사진과 일러스트를 함께 쓸 때는 하나를 주 매체로 정하고 다른 하나는 설명 보조로 제한해 사람·제품의 표현 방식이 뒤섞이지 않게 한다",
      "When photography and illustration coexist, choose one primary medium and keep the other explanatory so people and products do not mix incompatible rendering styles",
    );
    if (preferred.has("typographicFocal") && (preferred.has("photo") || preferred.has("layeredComposite"))) add(
      "visualTypography",
      "핵심 문장·수치는 복잡한 이미지 위에 얹지 말고 여백·크롭·국부 보호면으로 독립된 읽기 영역을 확보한다",
      "Keep focal wording and figures off visually busy imagery; secure an independent reading zone through negative space, crop, or a localized protective surface",
    );
    return contracts;
  }

  function resourcePolicyPromptLines(ko, resourcePolicy = currentResourcePolicy(), { compact = false } = {}) {
    const names = (items) => items.map((item) => ko ? item.title : item.titleEn).join(ko ? " · " : ", ");
    const lines = [];
    if (resourcePolicy.allowed.length) lines.push(ko
      ? `우선 활용 자원: ${names(resourcePolicy.allowed)}. 모든 페이지에 반복하지 말고 핵심 주장과 증거 관계에 도움이 되는 페이지에서 먼저 검토한다.`
      : `Priority resources: ${names(resourcePolicy.allowed)}. Do not repeat them on every page; consider them first only where they strengthen the key claim and evidence relationship.`);
    else lines.push(ko ? "공통으로 우선할 시각 자원은 없다." : "No visual resource is prioritized deck-wide.");
    if (resourcePolicy.automatic.length) lines.push(ko
      ? `AI 판단 자원: ${names(resourcePolicy.automatic)}. 개별 명세가 실제로 필요로 할 때만 선택한다.`
      : `Automatic resources: ${names(resourcePolicy.automatic)}. Select them only when the individual specification genuinely requires them.`);
    if (resourcePolicy.excluded.length) lines.push(ko
      ? `사용 금지 자원: ${names(resourcePolicy.excluded)}. 이후의 자동 구성 지시도 이 제외 정책을 덮어쓰지 않는다.`
      : `Excluded resources: ${names(resourcePolicy.excluded)}. No later automatic-composition instruction may override this exclusion.`);
    const guidedResources = compact ? resourcePolicy.allowed : resourcePolicy.usable;
    if (guidedResources.length) {
      const guidance = guidedResources.map((item) => ko ? item.guidanceKo : item.guidanceEn).filter(Boolean);
      if (guidance.length) lines.push(ko ? `자원별 실행 원칙: ${guidance.join("; ")}.` : `Resource execution rules: ${guidance.join("; ")}.`);
    }
    currentResourceCombinationContracts(resourcePolicy).forEach((contract) => lines.push(ko ? `조합 원칙: ${contract.ko}.` : `Combination rule: ${contract.en}.`));
    return lines;
  }

  function resourcePolicyControl([key, title, help]) {
    const path = `resources.${key}`;
    const current = get(path) || "auto";
    const choices = [["auto", "AI 판단"], ["allow", "우선 활용"], ["exclude", "사용 안 함"]];
    return `<fieldset class="cpd-resource-policy-card"><legend><strong>${escapeHtml(title)}</strong><small>${escapeHtml(help)}</small></legend><div>${choices.map(([value, labelText]) => `<label><input type="radio" name="${path}" data-path="${path}" value="${value}"${current === value ? " checked" : ""}><span>${labelText}</span></label>`).join("")}</div></fieldset>`;
  }

  function renderResourcePresets() {
    return `<div class="cpd-resource-preset-wrap"><div class="cpd-resource-preset-head"><strong>추천 조합</strong><small>추천 조합은 필요한 자원만 우선 활용으로 바꾸고, 전체 AI 판단은 모든 선택을 초기화합니다.</small></div><div class="cpd-resource-preset-grid" aria-label="시각 자원 추천 조합">${RESOURCE_PRESETS.map(([id, title, help]) => `<button type="button" data-resource-preset="${id}"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(help)}</small></button>`).join("")}</div></div>`;
  }

  function applyResourcePreset(id) {
    const preset = RESOURCE_PRESETS.find(([presetId]) => presetId === id);
    if (!preset) return;
    recordHistory();
    const [, title, , values] = preset;
    if (!values) RESOURCE_META.forEach(([key]) => { state.resources[key] = "auto"; });
    else Object.entries(values).forEach(([key, value]) => { state.resources[key] = value; });
    state.journey.reviewedStages = [...new Set([...(get("journey.reviewedStages") || []), "resources"])];
    refresh({ full: true });
    toast(`‘${title}’ 조합을 적용했습니다.`);
  }

  function renderResourcesJourney() {
    return `${panel("시각 자원의 활용 범위", "‘AI 판단’은 사용 여부를 내용에 맡기고, ‘우선 활용’은 적합한 페이지의 첫 후보로 검토하며, ‘사용 안 함’은 최종 프롬프트까지 유지되는 금지 조건입니다.", `${renderResourcePresets()}<div class="cpd-resource-grid">${RESOURCE_META.map(resourcePolicyControl).join("")}</div><div class="cpd-inline-note"><strong>사용 여부와 품질 원칙은 별개입니다.</strong> AI 판단 자원도 실제로 선택되면 아래 자원별 정확성·일관성 규칙을 따릅니다. 선, 면, 카드, 섹션, 블록과 여백은 정보 전달에 필요한 만큼 사용할 수 있습니다.</div>`)}${panel("필수 출력 품질", "선택 수와 관계없이 모든 이미지에 적용됩니다.", `<div class="cpd-quality-summary"><span>정확한 문구·수치·단위</span><span>선명한 한글 글리프</span><span>발표 거리 가독성</span><span>픽셀 단위의 깨끗한 가장자리</span><span>전면 블러 없이 국부 효과만 사용</span></div>`)}`;
  }

  function renderJourneyStage(index) {
    const stage = JOURNEY_STAGES[index];
    const renderers = {
      format: renderFormatJourney,
      style: renderVisualStyleJourney,
      palette: renderPaletteJourney,
      type: renderTypographyEmphasisJourney,
      resources: renderResourcesJourney,
    };
    return renderers[stage.id]();
  }

  function renderStep(index) {
    const id = STEP_META[index][0];
    const renderers = { project: renderProject, canvas: renderCanvas, direction: renderDirection, composition: renderComposition, colors: renderColors, background: renderBackground, header: renderHeader, footer: renderFooter, typography: renderTypography, photoComposite: renderPhotoCompositeSettings, quality: renderQuality, constraints: renderConstraints };
    return renderers[id]();
  }

  function stepSummary(id) {
    if (!isSectionEnabled(id)) return "프롬프트에서 제외됨";
    const summaries = {
      project: `${JOURNEY_PROFILE_META[get("journey.profileId")]?.label || "직접 목표"} · ${get("project.audienceRole") || get("project.audience") || "대상 입력 전"}`,
      canvas: `${get("canvas.aspectRatio")} · ${get("canvas.width")}×${get("canvas.height")}px · 안전영역 ${get("canvas.safeArea.top")}%`,
      direction: directionSummary(),
      composition: compositionSummary(),
      colors: `${paletteTitle()} · ${colorRole("primary").nameKo} ${get("colors.primary")} / ${colorRole("accent").nameKo} ${get("colors.accent")}`,
      background: backgroundSummary(),
      header: headerSummary(),
      footer: footerSummary(),
      typography: typographySummary(),
      photoComposite: photoCompositeStateSummary(),
      quality: `WCAG ${get("quality.wcagLevel")} · 원문/수치 보존`,
      constraints: `${Object.entries(get("constraints")).filter(([key, value]) => key.startsWith("forbid") && value).length}개 품질 보호 조건`,
    };
    return summaries[id] || "설정됨";
  }

  function compositionSummary() {
    const form = label("composition.formLanguage", { preciseGeometric: "정밀 기하", softGeometric: "부드러운 기하", organic: "유기적 형태", mixed: "혼합 형태" });
    const rhythm = label("composition.spatialRhythm", { ordered: "질서형", asymmetricEditorial: "비대칭 에디토리얼", modular: "모듈형", flowing: "흐름형" });
    const surface = label("composition.surfaceLanguage", { flat: "평면", mattePanels: "매트 패널", controlledLayer: "절제된 다층", material: "재질형" });
    return `${form} · ${rhythm} · ${surface}`;
  }

  function renderJourneyStepNavigation(issues, extraClass = "") {
    const active = currentJourneyStage();
    const reviewed = new Set(get("journey.reviewedStages") || []);
    const activeProfile = JOURNEY_PROFILE_META[get("journey.profileId")];
    const classes = ["cpd-journey-steps", extraClass].filter(Boolean).join(" ");
    const steps = JOURNEY_STAGES.map((stage, index) => {
      const errorCount = issues.filter((issue) => stage.sections.includes(issue.step) && issue.level === "error").length;
      const status = errorCount ? `${errorCount} 오류` : reviewed.has(stage.id) ? "확인됨" : activeProfile ? "권장값" : index === 0 ? "시작" : "대기";
      return `<button type="button" class="cpd-journey-step${index === active ? " active" : ""}${errorCount ? " error" : ""}" data-journey-stage="${index}" data-stage-group="${stage.group}" aria-current="${index === active ? "step" : "false"}" aria-label="${index + 1}단계 ${stage.title}, ${status}"><span>${index + 1}</span><strong>${stage.shortTitle}</strong><small>${status}</small></button>`;
    }).join("");
    return `<nav class="${classes}" aria-label="공통 프롬프트 5단계">${steps}</nav>`;
  }

  function renderAccordion(issues) {
    renderNavigation(issues);
    const active = currentJourneyStage();
    const profileId = get("journey.profileId");
    const activeProfile = JOURNEY_PROFILE_META[profileId];
    const activeSlideStyle = selectedSlideStyle();
    const stage = JOURNEY_STAGES[active];
    const profileBadge = activeSlideStyle ? `스타일 · ${activeSlideStyle.nameKo}${isSlideStyleCustomized() ? " · 조정됨" : ""}` : activeProfile ? `퀵설정 · ${activeProfile.label}${get("journey.profileDirty") ? " · 수정됨" : ""}` : profileId === "custom" ? "직접 구성" : "기본값 사용 중";
    const stageActions = `<nav class="cpd-stage-actions" aria-label="현재 단계 이동"><button type="button" class="cpd-btn soft" data-action="journey-prev"${active === 0 ? " disabled" : ""}>이전</button>${active < JOURNEY_STAGES.length - 1 ? '<button type="button" class="cpd-btn primary" data-action="journey-next">다음 단계</button>' : '<button type="button" class="cpd-btn primary" data-action="generate">공통 프롬프트 생성</button>'}</nav>`;
    document.getElementById("cpdAccordion").innerHTML = `<div class="cpd-journey-header"><div><span>SLIDE IMAGE VISUAL SPECIFICATION</span><h2>이미지 생성에 직접 필요한 5가지 결정</h2><p>공통 설정은 규격과 시각 방향만 정합니다. 실제 내용·데이터·논지와 페이지별 구성은 개별 슬라이드 명세가 전달합니다.</p></div><div class="cpd-journey-header-actions"><em>${escapeHtml(profileBadge)}</em><div class="cpd-journey-header-buttons"><button type="button" class="cpd-btn" data-action="open-slide-style-gallery">스타일 갤러리</button><button type="button" class="cpd-btn primary" data-action="open-quick-setup-modal">빠른 시작</button></div></div></div><section class="cpd-journey-panel" id="cpdJourneyPanel" aria-labelledby="cpdJourneyTitle" tabindex="-1"><header class="cpd-journey-panel-head"><span>${active + 1} / ${JOURNEY_STAGES.length}</span><div><small>${stage.group} 설정</small><h2 id="cpdJourneyTitle">${stage.title}</h2><p>${stage.description}</p></div>${stageActions}<div class="cpd-stage-contract"><div><span>이 단계에서 정함</span><strong>${stage.scope}</strong></div><i aria-hidden="true">↔</i><div><span>이 단계에서 정하지 않음</span><small>${stage.boundary}</small></div></div></header><div class="cpd-journey-panel-body">${renderJourneyStage(active)}</div></section>`;
    renderSlideStyleDialog();
    renderQuickSetupDialog();
  }

  function renderProject() {
    const quickChoice = (title, path, options, className = "") => {
      const current = String(get(path) ?? "");
      const matched = options.some(([value]) => String(value) === current);
      return `<div class="cpd-brief-choice ${className}" role="group" aria-label="${title}"><div class="cpd-brief-choice-title"><span>${title}</span>${current && !matched ? "<em>직접 입력값 사용 중</em>" : ""}</div><div class="cpd-brief-chips">${options.map(([value, text]) => `<button type="button" class="cpd-brief-chip${String(value) === current ? " selected" : ""}" data-brief-path="${path}" data-brief-value="${escapeHtml(value)}" aria-pressed="${String(value) === current}">${text}</button>`).join("")}</div></div>`;
    };
    const audienceChoices = [["승인권자", "승인권자"], ["검토·평가자", "검토·평가자"], ["실행 담당자", "실행 담당자"], ["전문가·자문자", "전문가·자문자"], ["학습자", "학습자"], ["이용자·대중", "이용자·대중"]];
    const levelChoices = [["newcomer", "처음 접함"], ["general", "기본 이해"], ["practitioner", "실무 경험"], ["expert", "전문 검토"]];
    const stanceChoices = [["supportive", "우호적"], ["neutral", "중립적"], ["skeptical", "회의적"], ["mixed", "입장 혼재"]];
    const readingChoices = [["live", "발표자와 함께"], ["self", "혼자 읽기"], ["hybrid", "발표 후 다시 읽기"]];
    const audience = `<label class="cpd-field"><span>누가 듣나요?</span><input class="cpd-input" data-path="project.audience" maxlength="60" value="${escapeHtml(get("project.audience"))}" placeholder="예: 경상북도 지자체 관계자"><small class="cpd-field-note">직책·관심사를 60자 안에서 적어주세요.</small></label>`;
    const purpose = `<label class="cpd-field"><span>왜 발표하나요?</span><input class="cpd-input" data-path="project.presentationPurpose" maxlength="80" value="${escapeHtml(get("project.presentationPurpose"))}" placeholder="예: 지역 이차전지 산업의 강점과 정책 과제 보고"><small class="cpd-field-note">발표가 해결할 일을 한 문장으로 적어주세요.</small></label>`;
    const action = `<label class="cpd-field"><span>듣고 나서 무엇을 하길 바라나요?</span><input class="cpd-input" data-path="project.desiredAction" maxlength="80" value="${escapeHtml(get("project.desiredAction"))}" placeholder="예: 핵심 지원과제의 우선순위에 합의"><small class="cpd-field-note">원하는 판단이나 행동 하나만 적습니다.</small></label>`;
    const strategyFields = `<div class="cpd-form-grid">
      <label class="cpd-field"><span>지금 청중은 어떻게 생각하나요?</span><input class="cpd-input" data-path="project.currentPerception" maxlength="100" value="${escapeHtml(get("project.currentPerception"))}" placeholder="예: 경북의 강점은 양극재 생산 규모라고 생각"><small class="cpd-field-note">발표 전 생각 하나만 적습니다.</small></label>
      <label class="cpd-field"><span>발표 후 어떻게 생각하게 만들까요?</span><input class="cpd-input" data-path="project.targetPerception" maxlength="100" value="${escapeHtml(get("project.targetPerception"))}" placeholder="예: 소재와 순환의 연결성이 핵심 경쟁력이라고 판단"><small class="cpd-field-note">바뀌어야 할 판단 하나만 적습니다.</small></label>
      <label class="cpd-field"><span>생각을 바꾸기 어려운 이유는 무엇인가요?</span><input class="cpd-input" data-path="project.keyBarrier" maxlength="100" value="${escapeHtml(get("project.keyBarrier"))}" placeholder="예: 투자 규모와 기업 수만 성과로 보는 관점"><small class="cpd-field-note">가장 큰 의문·반론·혼동 하나만 고릅니다.</small></label>
      <label class="cpd-field"><span>발표 전체를 한 문장으로 말하면?</span><input class="cpd-input" data-path="project.governingThought" maxlength="120" value="${escapeHtml(get("project.governingThought"))}" placeholder="예: 경북은 생산과 순환을 연결하는 소재 허브로 전환해야 한다"><small class="cpd-field-note">모든 슬라이드가 함께 증명할 결론 한 문장입니다.</small></label>
    </div>`;
    const quickChoices = `<div class="cpd-brief-quick-grid">
      ${quickChoice("청중의 주된 역할", "project.audienceRole", audienceChoices)}
      ${quickChoice("사전 지식", "project.audienceLevel", levelChoices, "compact")}
      ${quickChoice("현재 태도", "project.audienceStance", stanceChoices, "compact")}
      ${quickChoice("열람 방식", "project.readingMode", readingChoices, "compact")}
    </div>`;
    const customFields = `<details class="cpd-brief-details"><summary><span><strong>구체적인 맥락과 결론 직접 입력</strong><small>선택한 역할·목표를 실제 대상과 문장으로 구체화할 때만 사용합니다.</small></span><em>선택 사항</em></summary><div class="cpd-brief-details-body"><div class="cpd-form-grid">${audience}${purpose}${action}</div><details class="cpd-brief-strategy"><summary><span><strong>인식 변화까지 직접 설정</strong><small>태도나 판단을 바꿔야 하는 발표에서만 사용합니다.</small></span></summary><div class="cpd-brief-strategy-body">${strategyFields}</div></details></div></details>`;
    const axisGuide = `<div class="cpd-mece-axis-guide"><strong>질문마다 다른 축입니다.</strong><span>역할 · 지식 · 태도 · 열람 방식 · 속도를 각각 하나씩 선택하세요.</span></div>`;
    return panel("청중과 사용 환경", "이 값은 공통 디자인 문장에 섞이지 않습니다. 각 슬라이드에 별도 화면 비표시 맥락으로 전달되어 설명 난이도·근거 선택·강조 순서를 조정합니다.", `${axisGuide}${quickChoices}${customFields}`);
  }

  function updateBriefChoiceInline(path, value) {
    const buttons = [...root.querySelectorAll(`[data-brief-path="${path}"]`)];
    if (!buttons.length) return;
    const current = String(value ?? "");
    const matched = buttons.some((button) => button.dataset.briefValue === current);
    buttons.forEach((button) => {
      const selected = button.dataset.briefValue === current;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    const title = buttons[0].closest(".cpd-brief-choice")?.querySelector(".cpd-brief-choice-title");
    if (!title) return;
    const badge = title.querySelector("em");
    if (current && !matched && !badge) title.insertAdjacentHTML("beforeend", "<em>직접 입력값 사용 중</em>");
    if ((!current || matched) && badge) badge.remove();
  }

  function perSlideTimeLabel(value, ko) {
    const seconds = Math.max(0, Number(value) || 0);
    if (!seconds) return "";
    if (seconds >= 120) return ko ? `${Math.round(seconds / 60)}분 이상` : `${Math.round(seconds / 60)} minutes or more`;
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainder = seconds % 60;
      if (!remainder) return ko ? `${minutes}분` : `${minutes} minute${minutes === 1 ? "" : "s"}`;
      return ko ? `${minutes}분 ${remainder}초` : `${minutes} minute${minutes === 1 ? "" : "s"} ${remainder} seconds`;
    }
    return ko ? `${seconds}초` : `${seconds} seconds`;
  }

  function audienceLevelLabel(ko) {
    return label("project.audienceLevel", {
      newcomer: ko ? "처음 접하는 수준" : "new to the topic",
      general: ko ? "기본 이해 수준" : "general familiarity",
      practitioner: ko ? "실무 경험 수준" : "practitioner familiarity",
      expert: ko ? "전문 검토 수준" : "expert familiarity",
    });
  }

  function audienceRoleLabel(ko) {
    return label("project.audienceRole", {
      "승인권자": ko ? "승인권자" : "approver",
      "검토·평가자": ko ? "검토·평가자" : "reviewer or evaluator",
      "실행 담당자": ko ? "실행 담당자" : "implementation owner",
      "전문가·자문자": ko ? "전문가·자문자" : "expert or advisor",
      "학습자": ko ? "학습자" : "learner",
      "이용자·대중": ko ? "이용자·대중" : "user or general public",
    });
  }

  function audienceStanceLabel(ko) {
    return label("project.audienceStance", {
      supportive: ko ? "우호적" : "supportive",
      neutral: ko ? "중립적" : "neutral",
      skeptical: ko ? "회의적" : "skeptical",
      mixed: ko ? "입장이 혼재" : "mixed viewpoints",
    });
  }

  function readingModeLabel(ko) {
    return label("project.readingMode", {
      live: ko ? "발표자와 함께 보는 방식" : "guided live presentation",
      self: ko ? "혼자 읽는 방식" : "self-paced reading",
      hybrid: ko ? "발표 후 다시 읽는 방식" : "live presentation with later self-reading",
    });
  }

  function renderCanvas() {
    const custom = get("canvas.aspectRatio") === "custom";
    const manualSafe = get("canvas.safeAreaMode") === "manual";
    const linkedSafe = get("canvas.safeAreaLinked");
    const ratio = getAspectRatio();
    const actualRatio = Number(get("canvas.width")) / Math.max(1, Number(get("canvas.height")));
    const expectedRatio = ratio.width / ratio.height;
    const ratioMatches = Number.isFinite(actualRatio) && Math.abs(actualRatio - expectedRatio) / expectedRatio <= .015;
    const activePreset = Object.entries(CANVAS_PRESETS).find(([, preset]) => preset.aspectRatio === get("canvas.aspectRatio") && preset.width === Number(get("canvas.width")) && preset.height === Number(get("canvas.height")))?.[0] || "";
    const safeValues = get("canvas.safeArea");
    const uniformSafe = [safeValues.top, safeValues.right, safeValues.bottom, safeValues.left].every((value) => Number(value) === Number(safeValues.top));
    return `${panel("빠른 규격 선택", "자주 사용하는 규격을 선택하면 화면비, 해상도, 방향과 출력 기준을 한 번에 적용합니다.", `<div class="cpd-canvas-presets">${Object.entries(CANVAS_PRESETS).map(([key, preset]) => `<button type="button" class="cpd-canvas-preset${activePreset === key ? " active" : ""}" data-canvas-preset="${key}" aria-pressed="${activePreset === key}"><strong>${preset.label}</strong><small>${preset.help}</small></button>`).join("")}</div>`)}
    ${panel("화면비와 해상도", "직접 입력할 때는 화면비 연동을 켜두면 한쪽 값만 바꿔도 다른 값이 자동 계산됩니다.", `<div class="cpd-form-grid three cpd-canvas-grid">
      <label class="cpd-field"><span>화면비</span><select class="cpd-select" data-path="canvas.aspectRatio">${[["16:9", "16:9 와이드"], ["4:3", "4:3 표준"], ["a4-landscape", "A4 가로"], ["a4-portrait", "A4 세로"], ["custom", "사용자 지정"]].map(([value, text]) => option(value, text, get("canvas.aspectRatio"))).join("")}</select><small class="cpd-field-note">슬라이드가 표시될 기본 가로·세로 비율입니다.</small></label>
      <label class="cpd-field"><span>너비(px)</span><input class="cpd-input" type="number" inputmode="numeric" data-path="canvas.width" value="${escapeHtml(get("canvas.width"))}" min="320" max="12000"><small class="cpd-field-note">화면 발표는 1920px 이상을 권장합니다.</small></label>
      <label class="cpd-field"><span>높이(px)</span><input class="cpd-input" type="number" inputmode="numeric" data-path="canvas.height" value="${escapeHtml(get("canvas.height"))}" min="320" max="12000"><small class="cpd-field-note">연동 시 너비에 맞춰 자동 계산됩니다.</small></label>
      ${custom ? `<label class="cpd-field"><span>사용자 비율 너비</span><input class="cpd-input" type="number" data-path="canvas.customWidth" value="${escapeHtml(get("canvas.customWidth") || 16)}" min="1" max="100"><small class="cpd-field-note">예: 3:2에서 3</small></label><label class="cpd-field"><span>사용자 비율 높이</span><input class="cpd-input" type="number" data-path="canvas.customHeight" value="${escapeHtml(get("canvas.customHeight") || 2)}" min="1" max="100"><small class="cpd-field-note">예: 3:2에서 2</small></label>` : ""}
      <label class="cpd-field"><span>방향</span><select class="cpd-select" data-path="canvas.orientation">${[["landscape", "가로"], ["portrait", "세로"]].map(([value, text]) => option(value, text, get("canvas.orientation"))).join("")}</select><small class="cpd-field-note">변경하면 너비와 높이도 함께 전환됩니다.</small></label>
      <div class="cpd-span-all cpd-canvas-assist">
        ${check("화면비에 맞춰 해상도 자동 계산", "canvas.lockAspectRatio", "너비 또는 높이 하나만 입력하면 다른 값을 자동으로 맞춰 중복 입력과 비율 오류를 방지합니다.")}
        <div class="cpd-ratio-status ${ratioMatches ? "ok" : "error"}"><strong>${ratioMatches ? "규격 일치" : "규격 불일치"}</strong><span>${ratioMatches ? `현재 ${get("canvas.width")}×${get("canvas.height")}px이 선택한 화면비와 일치합니다.` : "입력한 해상도가 선택한 화면비와 다릅니다."}</span>${ratioMatches ? "" : '<button type="button" class="cpd-btn soft" data-action="fix-canvas-ratio">자동 보정</button>'}</div>
      </div>
    </div>`)}
    ${panel("출력과 안전영역", "출력 환경을 선택하고, 잘림을 방지할 안전영역을 정합니다.", `<div class="cpd-form-grid three cpd-canvas-grid">
      <label class="cpd-field"><span>출력 기준</span><select class="cpd-select" data-path="canvas.outputTarget">${[["screen", "화면 발표"], ["print", "인쇄"], ["screen_and_print", "화면 및 인쇄"]].map(([value, text]) => option(value, text, get("canvas.outputTarget"))).join("")}</select><small class="cpd-field-note">화면은 가독성, 인쇄는 고해상도를 우선합니다.</small></label>
      <label class="cpd-field"><span>안전영역 방식</span><select class="cpd-select" data-path="canvas.safeAreaMode">${[["auto", "자동 권장값"], ["manual", "직접 입력"]].map(([value, text]) => option(value, text, get("canvas.safeAreaMode"))).join("")}</select><small class="cpd-field-note">잘림과 화면 밖 배치를 막는 내부 보호 영역입니다.</small></label>
      <div class="cpd-span-all"><div class="cpd-group-label">안전영역 빠른 입력</div><div class="cpd-safe-presets"><button type="button" class="cpd-btn${get("canvas.safeAreaMode") === "auto" ? " soft" : ""}" data-safe-preset="auto">자동 6%</button>${[4, 6, 8, 10].map((value) => `<button type="button" class="cpd-btn${manualSafe && uniformSafe && Number(safeValues.top) === value ? " soft" : ""}" data-safe-preset="${value}">${value}%</button>`).join("")}</div></div>
      ${manualSafe ? `<div class="cpd-span-all cpd-checks">${check("상·하·좌·우 같은 값 사용", "canvas.safeAreaLinked", "켜면 한 번만 입력해 네 방향에 동일하게 적용합니다.")}</div>${linkedSafe ? `<label class="cpd-field"><span>전체 안전영역(%)</span><input class="cpd-input" type="number" data-path="canvas.safeArea.top" value="${escapeHtml(safeValues.top)}" min="0" max="20"><small class="cpd-field-note">네 방향에 동시에 적용됩니다.</small></label>` : ["top", "right", "bottom", "left"].map((key) => `<label class="cpd-field"><span>${{ top: "위", right: "오른쪽", bottom: "아래", left: "왼쪽" }[key]} 안전영역(%)</span><input class="cpd-input" type="number" data-path="canvas.safeArea.${key}" value="${escapeHtml(safeValues[key])}" min="0" max="20"></label>`).join("")}` : ""}
    </div>`)}`;
  }

  function directionSummary() {
    const medium = get("visualDirection.mediumNameKo");
    return `${designAxisValue("visualDirection.authority")} · ${designAxisValue("visualDirection.energy")} · ${designAxisValue("visualDirection.expression")} · ${designAxisValue("visualDirection.rationality")}${medium ? ` · ${medium}` : ""}`;
  }

  const DESIGN_AXIS_META = {
    "visualDirection.authority": { group: "인상", question: "이 자료는 얼마나 공식적이거나 친근해야 하나요?", left: "공식적", right: "친근한", values: ["공식적·제도적", "전문적·신뢰형", "중립적·균형형", "친근한 협업형", "개방적·인간적"] },
    "visualDirection.energy": { group: "리듬", question: "화면의 움직임과 추진감은 어느 정도가 좋나요?", left: "고요한", right: "역동적", values: ["고요한 정적 리듬", "차분한 안정감", "절제된 추진감", "활기찬 방향성", "강한 속도와 에너지"] },
    "visualDirection.expression": { group: "표현", question: "표현의 개성은 얼마나 드러나야 하나요?", left: "절제된", right: "대담한", values: ["극도로 절제된", "정제된 포인트형", "균형 잡힌 표현형", "선명한 개성형", "대담한 시각 선언형"] },
    "visualDirection.rationality": { group: "전달", question: "정보는 분석적으로 보일까요, 서사적으로 느껴질까요?", left: "분석적", right: "서사적", values: ["분석·증거 중심", "논리 우선", "논리와 서사의 균형", "맥락·이야기 중심", "감성·서사 중심"] },
    "visualDirection.geometry": { group: "형태", question: "형태는 정밀한 기하학과 유기적 흐름 중 어디에 가깝나요?", left: "기하학", right: "유기적", values: ["정밀한 기하 형태", "부드러운 기하 형태", "기하와 곡선의 혼합", "유연한 곡선 흐름", "유기적 자유 형태"] },
    "visualDirection.depth": { group: "공간", question: "공간감은 평면과 다층 레이어 중 어느 정도가 좋나요?", left: "평면", right: "다층", values: ["완전한 평면 구성", "얕은 면 분리", "절제된 레이어", "분명한 전·중·후경", "깊은 다층 공간"] },
  };

  const IDENTITY_GRAMMAR_KEYS = ["formLanguage", "lineLanguage", "surfaceLanguage", "spatialRhythm", "hierarchyBehavior"];
  const IDENTITY_PROFILE_AXES = {
    inform: [1, 2, 2, 1],
    explain: [2, 3, 2, 1],
    decide: [1, 3, 3, 1],
    act: [2, 4, 3, 2],
    teach: [4, 3, 3, 3],
    inspire: [3, 4, 4, 4],
  };
  const GRAMMAR_TECHNIQUE_META = {
    formLanguage: {
      label: "형태",
      values: {
        preciseGeometric: ["정밀 기하", "직선·정렬로 구조를 선명하게"],
        softGeometric: ["부드러운 기하", "둥근 모서리로 친근한 질서를 형성"],
        organic: ["유기적 곡선", "곡선과 비정형 흐름으로 인간적인 인상"],
        mixed: ["혼합형", "기하 구조에 선택적 곡선을 결합"],
      },
    },
    lineLanguage: {
      label: "선",
      values: {
        fineStructural: ["가는 구조선", "정렬과 정보 관계를 섬세하게 연결"],
        boldDirectional: ["굵은 방향선", "진행 방향과 전환을 강하게 강조"],
        minimalDivider: ["최소 구분선", "선을 줄이고 여백으로 정보군을 분리"],
        shapeLed: ["면 중심", "선보다 색면과 블록이 화면을 주도"],
      },
    },
    surfaceLanguage: {
      label: "표면",
      values: {
        flat: ["평면형", "그림자 없이 직접적이고 명료하게 표현"],
        mattePanels: ["매트 패널", "은은한 패널로 근거 묶음을 구분"],
        controlledLayer: ["절제된 다층", "얕은 전후 레이어로 초점을 형성"],
        material: ["선택적 재질", "핵심 장면에만 질감과 물성을 부여"],
      },
    },
    spatialRhythm: {
      label: "리듬",
      values: {
        ordered: ["질서형", "안정된 정렬과 순차적인 읽기 흐름"],
        asymmetricEditorial: ["비대칭 편집형", "초점과 여백의 대비로 추진감 형성"],
        modular: ["모듈형", "반복 단위로 정보 관계를 체계화"],
        flowing: ["흐름형", "사선과 연결 흐름으로 방향성을 강화"],
      },
    },
    hierarchyBehavior: {
      label: "위계",
      values: {
        scalePosition: ["크기·위치", "크기와 배치 차이로 핵심을 먼저 인지"],
        colorScale: ["색상·크기", "역할색과 큰 수치로 중요한 근거를 강조"],
        layerPosition: ["레이어·위치", "전후 관계와 위치 변화로 시선을 유도"],
        whitespaceScale: ["여백·크기", "넓은 호흡과 큰 제목 대비로 집중"],
      },
    },
  };

  function identityAxisValues() {
    return {
      authority: Math.max(1, Math.min(5, Number(get("visualDirection.authority")) || 3)),
      energy: Math.max(1, Math.min(5, Number(get("visualDirection.energy")) || 3)),
      expression: Math.max(1, Math.min(5, Number(get("visualDirection.expression")) || 3)),
      rationality: Math.max(1, Math.min(5, Number(get("visualDirection.rationality")) || 3)),
    };
  }

  function identityGrammarRecommendation() {
    const axes = identityAxisValues();
    const profileId = get("journey.profileId");
    const profileAxes = IDENTITY_PROFILE_AXES[profileId];
    const currentAxes = [axes.authority, axes.energy, axes.expression, axes.rationality];
    const profileGrammar = JOURNEY_PROFILE_META[profileId]?.grammar;
    if (profileAxes?.every((value, index) => value === currentAxes[index]) && PROFILE_GRAMMAR_VALUES[profileGrammar]) {
      return { axes, grammar: clone(PROFILE_GRAMMAR_VALUES[profileGrammar]) };
    }

    const formLanguage = axes.authority >= 4 && axes.rationality >= 4
      ? (axes.authority === 5 && axes.rationality === 5 ? "organic" : "softGeometric")
      : axes.authority >= 4
        ? "softGeometric"
        : axes.rationality >= 4 || axes.expression >= 4
          ? "mixed"
          : "preciseGeometric";
    const lineLanguage = axes.energy >= 4
      ? "boldDirectional"
      : axes.expression >= 4
        ? "shapeLed"
        : axes.expression === 1 || (axes.rationality >= 4 && axes.energy <= 2)
          ? "minimalDivider"
          : "fineStructural";
    const surfaceLanguage = axes.expression === 1
      ? "flat"
      : axes.expression === 5 && axes.rationality >= 4
        ? "material"
        : axes.rationality === 1 && axes.energy <= 2
          ? "mattePanels"
          : "controlledLayer";
    const spatialRhythm = axes.energy >= 4 ? "flowing" : axes.energy <= 2 ? "ordered" : axes.rationality === 1 ? "modular" : "asymmetricEditorial";
    const hierarchyBehavior = axes.expression >= 4 && axes.energy >= 3
      ? "layerPosition"
      : axes.rationality === 1 && axes.expression >= 3
        ? "colorScale"
        : axes.authority >= 4 || axes.rationality >= 4
          ? "whitespaceScale"
          : "scalePosition";
    return { axes, grammar: { formLanguage, lineLanguage, surfaceLanguage, spatialRhythm, hierarchyBehavior } };
  }

  function identityDesignType(axes, grammar) {
    const profileMatch = Object.entries(PROFILE_GRAMMAR_VALUES).find(([, values]) => IDENTITY_GRAMMAR_KEYS.every((key) => values[key] === grammar[key]));
    if (profileMatch) return COMPOSITION_PROFILES[profileMatch[0]]?.label || "균형형 디자인 시스템";
    if (axes.energy >= 4 && axes.expression >= 3) return "다이내믹 방향형";
    if (axes.rationality === 1 && axes.authority <= 2) return "정밀 데이터 보고형";
    if (axes.authority >= 4 && axes.rationality >= 4) return "휴먼 스토리텔링형";
    if (axes.expression >= 4 && axes.rationality >= 3) return "에디토리얼 강조형";
    if (axes.energy <= 2 && axes.expression <= 2) return "정돈된 보고형";
    return "균형형 커뮤니케이션";
  }

  function safePreviewColor(path, fallback) {
    const value = String(get(path) || "").trim();
    return /^#[0-9a-f]{6}$/i.test(value) ? value.toUpperCase() : fallback;
  }

  function renderIdentityOutcome() {
    const recommendation = identityGrammarRecommendation();
    const currentGrammar = Object.fromEntries(IDENTITY_GRAMMAR_KEYS.map((key) => [key, get(`composition.${key}`)]));
    const matches = IDENTITY_GRAMMAR_KEYS.filter((key) => currentGrammar[key] === recommendation.grammar[key]).length;
    const techniqueRows = IDENTITY_GRAMMAR_KEYS.map((key) => {
      const meta = GRAMMAR_TECHNIQUE_META[key];
      const current = meta.values[currentGrammar[key]] || ["사용자 설정", "구조 단계에서 직접 지정한 기법"];
      const suggested = meta.values[recommendation.grammar[key]] || ["추천 기법", "인상 선택에서 계산한 기법"];
      const matched = currentGrammar[key] === recommendation.grammar[key];
      return `<div class="cpd-outcome-technique${matched ? " matched" : " different"}" data-technique-key="${key}" data-current="${escapeHtml(currentGrammar[key])}" data-recommended="${escapeHtml(recommendation.grammar[key])}"><dt>${meta.label}</dt><dd>${escapeHtml(current[0])}</dd><small>${escapeHtml(current[1])}</small><em>${matched ? "인상 추천과 일치" : `인상 추천 · ${escapeHtml(suggested[0])}`}</em></div>`;
    }).join("");
    const formClass = { preciseGeometric: "precise", softGeometric: "soft", organic: "organic", mixed: "mixed" }[currentGrammar.formLanguage] || "precise";
    const lineClass = { fineStructural: "fine", boldDirectional: "bold", minimalDivider: "minimal", shapeLed: "shape" }[currentGrammar.lineLanguage] || "fine";
    const surfaceClass = { flat: "flat", mattePanels: "matte", controlledLayer: "layered", material: "material" }[currentGrammar.surfaceLanguage] || "flat";
    const rhythmClass = { ordered: "ordered", asymmetricEditorial: "asymmetric", modular: "modular", flowing: "flowing" }[currentGrammar.spatialRhythm] || "ordered";
    const hierarchyClass = { scalePosition: "scale", colorScale: "color", layerPosition: "layer", whitespaceScale: "whitespace" }[currentGrammar.hierarchyBehavior] || "scale";
    const previewStyle = `--cpd-preview-primary:${safePreviewColor("colors.primary", "#2563EB")};--cpd-preview-accent:${safePreviewColor("colors.accent", "#D63B32")};--cpd-preview-bg:${safePreviewColor("colors.background", "#FFFFFF")};--cpd-preview-surface:${safePreviewColor("colors.surface", "#F3F6FA")};--cpd-preview-text:${safePreviewColor("colors.textPrimary", "#172033")}`;
    const axes = recommendation.axes;
    const designType = identityDesignType(axes, recommendation.grammar);
    const outcomeSummary = `${designAxisValue("visualDirection.authority")} 인상을 ${designAxisValue("visualDirection.energy")} 리듬과 ${designAxisValue("visualDirection.expression")} 표현 강도로 구현하고, 정보는 ${designAxisValue("visualDirection.rationality")}으로 읽히게 합니다.`;
    return `<section class="cpd-direction-outcome" aria-labelledby="cpdDirectionOutcomeTitle">
      <header class="cpd-direction-outcome-head"><div><span>선택 결과 실시간 해석</span><h4 id="cpdDirectionOutcomeTitle">예상 디자인 유형 · ${escapeHtml(designType)}</h4><p>${escapeHtml(outcomeSummary)}</p></div><em class="${matches === IDENTITY_GRAMMAR_KEYS.length ? "aligned" : ""}">추천 기법 ${matches}/5 반영</em></header>
      <div class="cpd-direction-outcome-layout">
        <div class="cpd-outcome-translation"><div class="cpd-outcome-translation-head"><strong>슬라이드에 반영되는 현재 기법</strong><small>다음 구조 단계에서 최종 확정</small></div><dl class="cpd-outcome-techniques">${techniqueRows}</dl>${matches < IDENTITY_GRAMMAR_KEYS.length ? '<button type="button" class="cpd-btn soft cpd-outcome-apply" data-action="apply-identity-grammar">인상에 맞는 구조 권장값 적용</button>' : '<p class="cpd-outcome-aligned">현재 구조 문법이 선택한 인상과 모두 연결되어 있습니다.</p>'}</div>
        <figure class="cpd-outcome-preview"><div class="cpd-mini-slide cpd-preview-form-${formClass} cpd-preview-line-${lineClass} cpd-preview-surface-${surfaceClass} cpd-preview-rhythm-${rhythmClass} cpd-preview-hierarchy-${hierarchyClass} cpd-preview-energy-${axes.energy} cpd-preview-expression-${axes.expression}" style="${previewStyle}" role="img" aria-label="현재 선택을 반영한 추상 슬라이드 구조 미리보기"><i class="cpd-mini-motion" aria-hidden="true"></i><div class="cpd-mini-header"><span></span><b></b></div><div class="cpd-mini-title"><strong></strong><span></span></div><div class="cpd-mini-body"><div class="cpd-mini-copy"><span></span><span></span><span></span><i></i></div><div class="cpd-mini-visual"><div class="cpd-mini-metric"><strong>72</strong><small>%</small></div><div class="cpd-mini-chart"><i></i><i></i><i></i><i></i></div></div></div><div class="cpd-mini-footer"><span></span><i></i></div></div><figcaption>현재 색상과 실제 시각 문법으로 본 구조 예시입니다. 콘텐츠와 정확한 배치는 슬라이드 목적에 따라 달라집니다.</figcaption></figure>
      </div>
      <p class="cpd-direction-outcome-note"><strong>단계 경계</strong> 현재 단계는 인상을 정하고, 다음 구조 단계는 실제 생성에 사용할 기법을 확정합니다. 미리보기는 최종 결과를 보장하는 시안이 아니라 형태·리듬·깊이의 예상 범위를 보여줍니다.</p>
    </section>`;
  }

  function designAxisValue(path, inputValue = get(path)) {
    const meta = DESIGN_AXIS_META[path];
    const value = Math.max(1, Math.min(5, Number(inputValue) || 3));
    return meta?.values?.[value - 1] || "균형형";
  }

  function renderAxisTicks(count, activeIndex) {
    const safeCount = Math.max(1, Number(count) || 1);
    return Array.from({ length: safeCount }, (_, index) => {
      const position = safeCount > 1 ? (index / (safeCount - 1)) * 100 : 50;
      return `<i${index === activeIndex ? ' class="active"' : ""} style="--cpd-tick-position:${position}%"><b></b><small>${index + 1}</small></i>`;
    }).join("");
  }

  function designAxis(path, sequence) {
    const meta = DESIGN_AXIS_META[path];
    const value = Math.max(1, Math.min(5, Number(get(path)) || 3));
    const position = ((value - 1) / 4) * 100;
    const titleId = `cpdDesignAxisTitle${sequence}`;
    const current = designAxisValue(path, value);
    const balance = value === 3 ? "가운데도 의도적인 균형입니다" : value < 3 ? `${meta.left} 방향 ${3 - value}단계` : `${meta.right} 방향 ${value - 3}단계`;
    return `<fieldset class="cpd-design-axis" data-design-axis="${path}" style="--cpd-axis-position:${position}%" aria-labelledby="${titleId}">
      <div class="cpd-design-axis-head"><div><span class="cpd-design-axis-sequence">${String(sequence).padStart(2, "0")} · ${escapeHtml(meta.group)}</span><strong id="${titleId}">${escapeHtml(meta.question)}</strong></div><output data-axis-output="${path}" for="cpdDesignAxis${sequence}"><small>${value}/5</small><strong>${escapeHtml(current)}</strong></output></div>
      <div class="cpd-design-axis-control">
        <button type="button" class="cpd-axis-endpoint left" data-axis-set="${path}" data-axis-value="1" aria-label="${escapeHtml(meta.left)} 방향 끝값 선택"><span>${escapeHtml(meta.left)}</span><small>${escapeHtml(meta.values[0])}</small></button>
        <div class="cpd-axis-range"><input id="cpdDesignAxis${sequence}" type="range" min="1" max="5" step="1" data-path="${path}" data-axis-range value="${value}" aria-labelledby="${titleId}" aria-valuetext="${escapeHtml(current)}"><span class="cpd-axis-ticks" aria-hidden="true">${renderAxisTicks(5, value - 1)}</span></div>
        <button type="button" class="cpd-axis-endpoint right" data-axis-set="${path}" data-axis-value="5" aria-label="${escapeHtml(meta.right)} 방향 끝값 선택"><span>${escapeHtml(meta.right)}</span><small>${escapeHtml(meta.values[4])}</small></button>
      </div>
      <div class="cpd-design-axis-foot"><span data-axis-balance="${path}">${escapeHtml(balance)}</span><button type="button" data-axis-set="${path}" data-axis-value="3">가운데로</button></div>
    </fieldset>`;
  }

  function updateDesignAxisInline(path, inputValue) {
    const meta = DESIGN_AXIS_META[path];
    if (!meta) return;
    const value = Math.max(1, Math.min(5, Number(inputValue) || 3));
    const current = designAxisValue(path, value);
    const axis = root.querySelector(`[data-design-axis="${path}"]`);
    if (axis) {
      axis.style.setProperty("--cpd-axis-position", `${((value - 1) / 4) * 100}%`);
      axis.querySelectorAll(".cpd-axis-ticks i").forEach((tick, index) => tick.classList.toggle("active", index + 1 === value));
    }
    const range = root.querySelector(`[data-axis-range][data-path="${path}"]`);
    if (range) range.setAttribute("aria-valuetext", current);
    const output = root.querySelector(`[data-axis-output="${path}"]`);
    if (output) {
      const step = output.querySelector("small");
      const labelText = output.querySelector("strong");
      if (step) step.textContent = `${value}/5`;
      if (labelText) labelText.textContent = current;
    }
    const balance = root.querySelector(`[data-axis-balance="${path}"]`);
    if (balance) balance.textContent = value === 3 ? "가운데도 의도적인 균형입니다" : value < 3 ? `${meta.left} 방향 ${3 - value}단계` : `${meta.right} 방향 ${value - 3}단계`;
  }

  const CHOICE_AXIS_META = {
    "visualStyle.formality": { group: "공식성", question: "공식적 신뢰감과 친근한 개방감 중 어디에 가까울까요?", left: "공식적·신뢰", right: "친근한·개방", defaultValue: 2, values: [[1, "엄정하고 제도적인 인상"], [2, "공식적이되 현대적인 인상"], [3, "신뢰와 친근함의 균형"], [4, "친근하고 열린 인상"], [5, "매우 인간적이고 편안한 인상"]] },
    "visualStyle.energy": { group: "에너지", question: "차분한 안정감과 역동적인 추진력 중 어디에 가까울까요?", left: "차분한·안정", right: "역동적·전진", defaultValue: 3, values: [[1, "매우 차분하고 안정적"], [2, "절제된 움직임"], [3, "안정과 활력의 균형"], [4, "분명한 속도와 추진력"], [5, "강한 에너지와 전진감"]] },
    "visualStyle.expression": { group: "표현 강도", question: "절제된 정돈과 대담한 기억성 중 어디에 가까울까요?", left: "절제된·정돈", right: "대담한·기억", defaultValue: 3, values: [[1, "최소 표현과 엄격한 정돈"], [2, "절제된 시각적 존재감"], [3, "정돈과 강조의 균형"], [4, "큰 대비와 분명한 초점"], [5, "대담하고 강한 기억점"]] },
    "typography.emphasis": { group: "정보 강조", question: "긴 설명의 읽기와 핵심 문장·수치의 존재감 중 어디에 무게를 둘까요?", left: "읽기 우선", right: "핵심 강조", defaultValue: "balanced", values: [["reading", "본문과 설명을 편안하게 읽는 구성"], ["balanced", "본문 가독성과 핵심 강조의 균형"], ["strong", "제목·핵심 문장·주요 수치를 강하게 강조"]] },
    "composition.container": { group: "정보 묶음", question: "카드·섹션·블록의 경계를 얼마나 드러낼까요?", left: "열린 구성", right: "카드 중심", defaultValue: "mixed", values: [["borderless", "여백·정렬 중심"], ["mixed", "경계 없는 그룹과 카드의 혼합"], ["cards", "독립 정보는 카드로 명확히"]] },
    "composition.layoutFreedom": { group: "AI 구성 위임", question: "무엇을 말할지는 지키고, 보여주는 방식은 AI에게 어디까지 맡길까요?", left: "구성 고정", right: "의미만 고정", defaultValue: "high", values: [["low", "명시한 구성까지 고정"], ["medium", "읽기 방향만 안내"], ["high", "의미·데이터만 고정"]] },
    "composition.density": { group: "정보 호흡", question: "화면의 정보와 여백은 어느 정도로 운용할까요?", left: "여유", right: "고밀도", defaultValue: "balanced", values: [["airy", "넓은 여백과 단일 초점"], ["balanced", "근거와 여백의 균형"], ["dense", "다수 근거를 정돈해 집약"]] },
    "background.intensity": { group: "배경 존재감", question: "배경이 내용 뒤에서 얼마나 적극적으로 분위기를 만들까요?", left: "내용 중심", right: "분위기 적극", defaultValue: "restrained", values: [["restrained", "내용이 먼저 보이는 절제형"], ["balanced", "내용과 배경의 균형형"], ["expressive", "분위기 자원도 활용하는 표현형"]] },
    "background.blur": { group: "국부 흐림", question: "작은 배경 영역에 어느 정도의 흐림을 허용할까요?", left: "선명하게", right: "분명한 흐림", defaultValue: "none", values: [["none", "흐림 관련 안내 생략"], ["subtle", "작은 영역에 은은하게"], ["medium", "작은 영역에 분명하게"]] },
    "background.photoMode": { group: "실사 배경", question: "실사 장면을 배경 자원으로 어느 정도 검토할까요?", left: "언급 생략", right: "적극 활용", defaultValue: "off", values: [["off", "관련 문장을 추가하지 않음"], ["conditional", "명세 근거가 있을 때 활용"], ["preferred", "맥락에 도움이 되면 우선 검토"]] },
    "background.photoSaturation": { group: "사진 색감", question: "배경 사진의 고유색은 어느 정도 보존할까요?", left: "자연색", right: "무채색", defaultValue: "natural", values: [["natural", "장면의 자연색 보존"], ["low", "절제된 저채도"], ["mono", "명암 중심의 흑백"]] },
    "background.photoOverlay": { group: "읽기 보호", question: "텍스트 주변의 국부 보호 처리는 어느 정도가 좋을까요?", left: "장면 자체", right: "강한 보호", defaultValue: "medium", values: [["none", "크롭과 여백으로 대비 확보"], ["light", "약한 국부 보호"], ["medium", "분명한 국부 보호"], ["strong", "강한 국부 보호도 허용"]] },
    "photoComposite.mode": { group: "콘텐츠 이미지", question: "실사 이미지를 설명 자원으로 어느 정도 검토할까요?", left: "언급 생략", right: "적극 활용", defaultValue: "conditional", values: [["off", "관련 문장을 추가하지 않음"], ["conditional", "근거가 있을 때 선택 자원"], ["preferred", "설득력이 높아지면 우선 검토"]] },
  };

  function choiceAxisIndex(path, inputValue = get(path)) {
    const meta = CHOICE_AXIS_META[path];
    if (!meta) return 0;
    const index = meta.values.findIndex(([value]) => String(value) === String(inputValue));
    const fallback = meta.values.findIndex(([value]) => value === meta.defaultValue);
    return index >= 0 ? index : Math.max(0, fallback);
  }

  function choiceAxis(path) {
    const meta = CHOICE_AXIS_META[path];
    if (!meta) return "";
    const index = choiceAxisIndex(path);
    const count = meta.values.length;
    const current = meta.values[index]?.[1] || meta.values[0][1];
    const defaultIndex = choiceAxisIndex(path, meta.defaultValue);
    const position = count > 1 ? (index / (count - 1)) * 100 : 0;
    const id = `cpdChoiceAxis${path.replace(/[^a-z0-9]+/gi, "_")}`;
    const status = index === defaultIndex ? "추천 시작값입니다" : index < defaultIndex ? `${meta.left} 방향으로 조정됨` : `${meta.right} 방향으로 조정됨`;
    return `<fieldset class="cpd-design-axis cpd-choice-axis" data-choice-axis="${path}" style="--cpd-axis-position:${position}%;--cpd-axis-steps:${count}" aria-labelledby="${id}Title">
      <div class="cpd-design-axis-head"><div><span class="cpd-design-axis-sequence">${escapeHtml(meta.group)}</span><strong id="${id}Title">${escapeHtml(meta.question)}</strong></div><output data-choice-axis-output="${path}" for="${id}"><small>${index + 1}/${count}</small><strong>${escapeHtml(current)}</strong></output></div>
      <div class="cpd-design-axis-control">
        <button type="button" class="cpd-axis-endpoint left" data-choice-axis-set="${path}" data-choice-axis-index="0"><span>${escapeHtml(meta.left)}</span><small>${escapeHtml(meta.values[0][1])}</small></button>
        <div class="cpd-axis-range"><input id="${id}" type="range" min="0" max="${count - 1}" step="1" data-choice-axis-range data-choice-path="${path}" value="${index}" aria-labelledby="${id}Title" aria-valuetext="${escapeHtml(current)}"><span class="cpd-axis-ticks" aria-hidden="true">${renderAxisTicks(count, index)}</span></div>
        <button type="button" class="cpd-axis-endpoint right" data-choice-axis-set="${path}" data-choice-axis-index="${count - 1}"><span>${escapeHtml(meta.right)}</span><small>${escapeHtml(meta.values[count - 1][1])}</small></button>
      </div>
      <div class="cpd-design-axis-foot"><span data-choice-axis-status="${path}">${escapeHtml(status)}</span><button type="button" data-choice-axis-set="${path}" data-choice-axis-index="${defaultIndex}">추천값으로</button></div>
    </fieldset>`;
  }

  function markChoiceAxisCustom(path) {
    if (path.startsWith("composition.")) state.composition.profile = "custom";
    if (path.startsWith("background.")) { state.background.source = "custom"; state.background.profile = "custom"; }
    if (path.startsWith("typography.")) { state.typography.source = "custom"; state.typography.presetId = "custom"; }
  }

  function setChoiceAxisIndex(path, inputIndex) {
    const meta = CHOICE_AXIS_META[path];
    if (!meta) return null;
    const index = Math.max(0, Math.min(meta.values.length - 1, Number(inputIndex) || 0));
    const [value, labelText] = meta.values[index];
    set(path, value);
    markChoiceAxisCustom(path);
    return { index, value, labelText, meta };
  }

  function updateChoiceAxisInline(path, inputIndex) {
    const result = setChoiceAxisIndex(path, inputIndex);
    if (!result) return;
    const { index, labelText, meta } = result;
    const count = meta.values.length;
    const defaultIndex = choiceAxisIndex(path, meta.defaultValue);
    const axis = root.querySelector(`[data-choice-axis="${path}"]`);
    if (axis) {
      axis.style.setProperty("--cpd-axis-position", `${count > 1 ? (index / (count - 1)) * 100 : 0}%`);
      axis.style.setProperty("--cpd-axis-steps", count);
      axis.querySelectorAll(".cpd-axis-ticks i").forEach((tick, tickIndex) => tick.classList.toggle("active", tickIndex === index));
    }
    const range = root.querySelector(`[data-choice-axis-range][data-choice-path="${path}"]`);
    if (range) range.setAttribute("aria-valuetext", labelText);
    const output = root.querySelector(`[data-choice-axis-output="${path}"]`);
    if (output) {
      const step = output.querySelector("small");
      const labelNode = output.querySelector("strong");
      if (step) step.textContent = `${index + 1}/${count}`;
      if (labelNode) labelNode.textContent = labelText;
    }
    const status = root.querySelector(`[data-choice-axis-status="${path}"]`);
    if (status) status.textContent = index === defaultIndex ? "추천 시작값입니다" : index < defaultIndex ? `${meta.left} 방향으로 조정됨` : `${meta.right} 방향으로 조정됨`;
  }

  function generatedDesignStatement() {
    const keywords = String(get("visualDirection.conceptKeywords") || "").trim();
    const motif = String(get("visualDirection.signatureMotif") || "").trim();
    return `${designAxisValue("visualDirection.authority")} 인상과 ${designAxisValue("visualDirection.energy")} 리듬을 바탕으로, ${designAxisValue("visualDirection.expression")} 표현 강도와 ${designAxisValue("visualDirection.rationality")} 정보 태도를 결합한다.${keywords ? ` 핵심 감각은 ${keywords}이다.` : ""}${motif ? ` 덱을 기억시키는 반복 모티프는 ${motif}이다.` : ""}`;
  }

  function effectiveDesignStatement() {
    return String(get("visualDirection.designStatement") || "").trim() || generatedDesignStatement();
  }

  function renderDirectionDraft() {
    if (!directionDraft?.medium) return "";
    const medium = directionDraft.medium;
    if (!medium) return "";
    return `<div class="cpd-direction-draft"><div class="cpd-direction-draft-head"><div><small>표현 기법 적용 전 확인</small><h4>${escapeHtml(medium.nameKo)} <span>${escapeHtml(medium.nameEn)}</span></h4></div><span class="cpd-badge ok">${escapeHtml(medium.groupLabel || "표현 기법")}</span></div><p>${escapeHtml(medium.description || medium.promptSummaryKo || "")}</p><div class="cpd-medium-token-row">${[medium.categoryLabel, medium.textureLabel, medium.usageLabel].filter(Boolean).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div><div class="cpd-inline-note"><strong>적용 범위:</strong> 선택한 화풍은 공통 성격으로 제공하되 사진·데이터·다이어그램·타이포그래피의 고유 질감과 색을 같은 방식으로 덮지 않습니다. 적용 강도와 결합 방식은 이미지 AI가 의미에 맞춰 조절합니다.</div><div class="cpd-button-row"><button type="button" class="cpd-btn primary" data-action="apply-medium-draft">이 표현 기법 사용</button><button type="button" class="cpd-btn" data-action="cancel-direction-draft">취소</button></div></div>`;
  }

  function labelValue(value, map) { return map[value] || value || "미지정"; }

  function renderDirection() {
    const filters = { query: directionUi.query, category: directionUi.category === "recommended" ? "all" : directionUi.category, group: directionUi.group, texture: directionUi.texture, usage: directionUi.usage, recommended: directionUi.category === "recommended" };
    const mediums = MEDIUM_CATALOG?.list?.(filters) || [];
    const categoryOptions = [["recommended", "발표자료 추천"], ["all", "전체 카테고리"], ...(MEDIUM_CATALOG?.categories || []).map((item) => [item.id, item.label])];
    const toolbar = `<div class="cpd-medium-toolbar"><label class="cpd-field cpd-medium-search"><span>화풍 검색</span><div class="cpd-search-row"><input class="cpd-input" data-medium-query value="${escapeHtml(directionUi.query)}" placeholder="화풍명·질감·용도"><button type="button" class="cpd-btn" data-action="medium-search">검색</button></div></label><label class="cpd-field"><span>추천 범위</span><select class="cpd-select" data-medium-filter="category">${categoryOptions.map(([value, text]) => option(value, text, directionUi.category)).join("")}</select></label><label class="cpd-field"><span>표현 방식</span><select class="cpd-select" data-medium-filter="group">${[["all", "전체"], ...Object.entries(MEDIUM_CATALOG?.groupLabels || {})].map(([value, text]) => option(value, text, directionUi.group)).join("")}</select></label><label class="cpd-field"><span>질감</span><select class="cpd-select" data-medium-filter="texture">${[["all", "전체"], ...Object.entries(MEDIUM_CATALOG?.textureLabels || {})].map(([value, text]) => option(value, text, directionUi.texture)).join("")}</select></label><label class="cpd-field"><span>용도</span><select class="cpd-select" data-medium-filter="usage">${[["all", "전체"], ...Object.entries(MEDIUM_CATALOG?.usageLabels || {})].map(([value, text]) => option(value, text, directionUi.usage)).join("")}</select></label></div>`;
    const hasMedium = Boolean(get("visualDirection.mediumNameKo"));
    const current = `<div class="cpd-direction-summary cpd-direction-current"><div class="cpd-direction-current-copy"><small>${hasMedium ? "보조 표현 기법" : "보조 표현 기법은 선택 사항"}</small><strong>${escapeHtml(get("visualDirection.mediumNameKo") || "디자인 DNA를 우선 적용")}${get("visualDirection.mediumNameEn") ? ` <span>${escapeHtml(get("visualDirection.mediumNameEn"))}</span>` : ""}</strong></div><div class="cpd-direction-current-actions"><span class="cpd-direction-state${hasMedium ? " connected" : ""}">${hasMedium ? "DNA에 맞춰 적응형 활용" : "기본 가이드만 사용"}</span>${hasMedium ? '<button type="button" class="cpd-btn" data-action="remove-medium">화풍 해제</button>' : ""}</div></div>`;
    const grid = mediums.length ? `<div class="cpd-medium-grid">${mediums.slice(0, directionUi.visible).map((medium) => `<button type="button" class="cpd-medium-card${directionDraft?.medium?.id === medium.id ? " selected" : get("visualDirection.mediumId") === medium.id ? " applied" : ""}" data-medium-id="${escapeHtml(medium.id)}"><span class="cpd-medium-card-head"><strong>${escapeHtml(medium.nameKo)}</strong>${medium.recommended ? "<em>추천</em>" : ""}</span><small>${escapeHtml(medium.description)}</small><span>${escapeHtml(medium.groupLabel)} · ${escapeHtml(medium.textureLabel || "기본 질감")}</span></button>`).join("")}</div>${mediums.length > directionUi.visible ? '<div class="cpd-button-row cpd-load-more"><button type="button" class="cpd-btn" data-action="medium-load-more">12개 더 보기</button></div>' : ""}` : '<div class="cpd-palette-empty">조건에 맞는 화풍이 없습니다.</div>';
    const axes = `<div class="cpd-axis-board"><div class="cpd-axis-board-head"><div><span>DESIGN COORDINATES</span><strong>양끝 사이에서 이 발표만의 좌표를 만드세요</strong><small>각 축은 5단계로 조절됩니다. 가운데 값도 ‘미정’이 아니라 두 성격을 의도적으로 균형 잡는 선택입니다.</small></div><button type="button" class="cpd-btn" data-action="reset-design-axes">전체 균형으로</button></div><div class="cpd-design-axis-grid">${designAxis("visualDirection.authority", 1)}${designAxis("visualDirection.energy", 2)}${designAxis("visualDirection.expression", 3)}${designAxis("visualDirection.rationality", 4)}${designAxis("visualDirection.geometry", 5)}${designAxis("visualDirection.depth", 6)}</div></div>`;
    const statement = `<div class="cpd-design-statement"><span>현재 디자인 DNA</span><strong>${escapeHtml(effectiveDesignStatement())}</strong><small>여섯 질문의 답을 자동으로 한 문장에 합칩니다. 필요한 경우에만 짧게 수정하세요.</small></div><div class="cpd-form-grid"><label class="cpd-field"><span>이 디자인을 떠올리게 할 단어</span><input class="cpd-input" data-path="visualDirection.conceptKeywords" maxlength="50" value="${escapeHtml(get("visualDirection.conceptKeywords"))}" placeholder="예: 신뢰, 연결, 정밀, 성장"><small class="cpd-field-note">핵심 감각 3~5개만 적습니다.</small></label><label class="cpd-field"><span>반복해서 기억시킬 모티프</span><input class="cpd-input" data-path="visualDirection.signatureMotif" maxlength="60" value="${escapeHtml(get("visualDirection.signatureMotif"))}" placeholder="예: 연결되는 궤적, 절단면, 확장되는 그리드"><small class="cpd-field-note">선택 항목이며 한 가지 모티프만 권장합니다.</small></label><label class="cpd-field cpd-span-all"><span>디자인 선언 직접 수정</span><textarea class="cpd-textarea" data-path="visualDirection.designStatement" maxlength="180" placeholder="자동 조합을 사용하려면 비워두세요.">${escapeHtml(get("visualDirection.designStatement"))}</textarea><small class="cpd-field-note">한 문장·180자 이내로 작성합니다.</small></label></div>`;
    const advanced = `<details class="cpd-design-advanced" data-design-advanced="direction"${designAdvancedOpen.has("direction") ? " open" : ""}><summary><span>고급 편집</span><small>특정 화풍을 디자인 DNA의 보조 재료로 연결</small></summary><div class="cpd-design-advanced-body">${current}${toolbar}<div class="cpd-button-row cpd-mixer-link-row"><button type="button" class="cpd-btn soft" data-action="import-mixer-medium">현재 화풍 가져오기</button><button type="button" class="cpd-btn" data-action="open-mixer-medium">비주얼 믹서에서 찾아보기</button><span>${mediums.length}개 화풍</span></div>${grid}${renderDirectionDraft()}</div></details>`;
    return `${panel("슬라이더로 디자인 감각을 조율하세요", "상반되는 성격 사이에서 여섯 개의 좌표를 만들면 고정된 템플릿이 아닌 이 발표만의 디자인 DNA로 합성됩니다.", axes)}${panel("한 문장의 디자인 선언", "AI가 모든 슬라이드에서 유지할 인상과 고유한 기억점을 자연어로 정리합니다.", statement)}${advanced}`;
  }

  function renderComposition() {
    const resources = [
      ["allowPhotography", "PH", "실사·현장 사진", "사례·시설·제품·공간이 실제 맥락을 제공할 때"],
      ["allowDataVisualization", "DT", "데이터 시각화", "비교·추이·비중·분포를 빠르게 이해시킬 때"],
      ["allowDiagram", "DG", "다이어그램", "과정·인과·구조·관계를 설명할 때"],
      ["allowPictogram", "PC", "픽토그램", "사람·시설·단위처럼 반복되는 범주와 수량을 빠르게 셀 때"],
      ["allowInfographic", "IF", "인포그래픽", "여러 근거를 하나의 설명 흐름으로 통합할 때"],
      ["allowMap", "MP", "지도·공간 정보", "입지·권역·거점·이동 관계가 중요할 때"],
      ["allowIllustration", "IL", "일러스트레이션", "추상 개념이나 미래 상태를 직관적으로 보여줄 때"],
      ["allowTechnical3d", "3D", "기술 3D 비주얼", "제품·설비·소재의 구조와 작동 원리를 보여줄 때"],
      ["allowLayeredComposition", "LY", "다중 레이어 합성", "실사·데이터·주석을 깊이감 있는 한 장면으로 연결할 때"],
      ["allowTypographicFocus", "TY", "타이포 중심 표현", "결론 한 문장이나 핵심 수치 자체가 가장 강한 증거일 때"],
    ];
    const resourceGrid = `<div class="cpd-resource-grid">${resources.map(([key, code, title, help]) => `<label class="cpd-resource-card${get(`composition.${key}`) ? " active" : ""}"><input type="checkbox" data-path="composition.${key}"${get(`composition.${key}`) ? " checked" : ""}><span class="cpd-resource-code">${code}</span><span><strong>${title}</strong><small>${help}</small></span><em>${get(`composition.${key}`) ? "활용 범위에 포함" : "언급하지 않음"}</em></label>`).join("")}</div>`;
    const roleMap = `<div class="cpd-responsibility-map" aria-label="PromptDeck 역할 분담"><div><span>1</span><strong>발표 맥락</strong><small>웹에서 정한 청중·목적·인식 변화 · 화면 비표시로 별도 전달</small></div><i aria-hidden="true">→</i><div><span>2</span><strong>스킬 의미 브리프</strong><small>페이지 논지·표시 콘텐츠·수치·관계·증거 위계·읽기 우선순위</small></div><i aria-hidden="true">→</i><div class="current"><span>3</span><strong>공통 디자인 가이드</strong><small>덱 전체의 디자인 DNA·시각 문법·팔레트·타입·표면·프레임</small></div><i aria-hidden="true">→</i><div><span>4</span><strong>이미지 AI</strong><small>의미를 지키며 구도·매체 후보를 비교하고 설득력 높은 한 장면 선택</small></div></div>`;
    const visualLanguages = [["adaptive", "내용에 맞춰 AI가 선택"], ["data", "데이터 시각화"], ["diagram", "다이어그램·관계도"], ["photo", "실사·현장 이미지"], ["typography", "타이포그래피 중심"], ["illustration", "일러스트레이션"], ["technical3d", "기술 3D"], ["map", "지도·공간 정보"]];
    const grammar = `<div class="cpd-form-grid">${selectField("형태 언어", "composition.formLanguage", [["preciseGeometric", "정밀 기하 · 구조가 분명한 형태"], ["softGeometric", "부드러운 기하 · 친근한 구조"], ["organic", "유기적 곡선 · 자연스러운 흐름"], ["mixed", "혼합형 · 의미에 따라 기하와 유기 결합"]])}${selectField("선의 역할", "composition.lineLanguage", [["fineStructural", "가는 구조선 · 정렬과 관계 설명"], ["boldDirectional", "굵은 방향선 · 흐름과 전환 강조"], ["minimalDivider", "최소 구분선 · 여백 중심"], ["shapeLed", "면과 형태가 주도 · 선은 보조"]])}${selectField("표면과 깊이", "composition.surfaceLanguage", [["flat", "평면형 · 직접적이고 명료하게"], ["mattePanels", "매트 패널 · 정보군을 은은하게 분리"], ["controlledLayer", "절제된 다층 · 전경·증거·설명을 연결"], ["material", "재질형 · 필요한 장면에 물성 부여"]])}${selectField("공간 리듬", "composition.spatialRhythm", [["ordered", "질서형 · 안정된 읽기 순서"], ["asymmetricEditorial", "비대칭 에디토리얼 · 초점과 여백의 대비"], ["modular", "모듈형 · 정보 관계를 체계적으로"], ["flowing", "흐름형 · 과정과 방향을 연속적으로"]])}${selectField("위계의 주된 수단", "composition.hierarchyBehavior", [["scalePosition", "크기와 위치"], ["colorScale", "색상과 크기"], ["layerPosition", "레이어와 위치"], ["whitespaceScale", "여백과 크기"]])}</div>`;
    const consistency = `<div class="cpd-form-grid"><label class="cpd-field"><span>모든 슬라이드에서 무엇을 같게 유지할까요?</span><textarea class="cpd-textarea" data-path="composition.consistencyAnchor" maxlength="120">${escapeHtml(get("composition.consistencyAnchor"))}</textarea><small class="cpd-field-note">정체성을 묶을 기준을 한 문장으로 적습니다.</small></label><label class="cpd-field"><span>무엇은 슬라이드 목적에 따라 달라질 수 있나요?</span><textarea class="cpd-textarea" data-path="composition.variationRule" maxlength="120">${escapeHtml(get("composition.variationRule"))}</textarea><small class="cpd-field-note">페이지별로 달라질 범위를 한 문장으로 적습니다.</small></label></div>`;
    const spatialAxes = `<div class="cpd-design-axis-grid cpd-choice-axis-grid">${choiceAxis("composition.container")}${choiceAxis("composition.layoutFreedom")}${choiceAxis("composition.density")}</div><p class="cpd-composition-autonomy-note"><strong>페이지별 자동 조정</strong><span>기본은 의미·수치·관계만 고정합니다. 정밀 데이터·복합 다이어그램은 읽기 방향을 함께 안내하고, 참조 동일성이 필요한 페이지만 구성을 고정합니다.</span></p>`;
    const languageMix = `<div class="cpd-form-grid">${selectField("주 시각 언어", "composition.primaryVisualLanguage", visualLanguages)}${selectField("보조 시각 언어", "composition.secondaryVisualLanguage", visualLanguages)}<label class="cpd-field cpd-span-all"><span>두 언어를 결합하는 원칙</span><textarea class="cpd-textarea" data-path="composition.combinationPrinciple" maxlength="140">${escapeHtml(get("composition.combinationPrinciple"))}</textarea><small class="cpd-field-note">필요한 1~2개 언어만 결합하도록 한 문장으로 적습니다.</small></label></div>`;
    const technical = `<details class="cpd-design-advanced" data-design-advanced="composition"${designAdvancedOpen.has("composition") ? " open" : ""}><summary><span>고급 편집</span><small>자원 가용성·그리드·여백·레이어 수를 직접 조정</small></summary><div class="cpd-design-advanced-body"><h4>활용 가능한 시각 자원</h4><p>선택하지 않은 자원은 금지하지 않고 공통 프롬프트에서 언급만 생략합니다.</p>${resourceGrid}<div class="cpd-form-grid cpd-advanced-grid">${selectField("자원 활용 폭", "composition.resourceRange", [["focused", "선별 활용"], ["flexible", "유연한 활용"], ["expansive", "복합 표현 적극 검토"]])}${selectField("그리드", "composition.grid", [["symmetric", "대칭"], ["modular", "모듈"], ["asymmetricModular", "비대칭 모듈"], ["editorial", "에디토리얼"]])}${rangeField("여백 비율", "composition.whitespacePercent", 10, 40)}${rangeField("핵심 초점 영역", "composition.focalAreaPercent", 25, 55)}${rangeField("레이어 수", "composition.layerCount", 2, 7, "")}<div class="cpd-span-all cpd-checks">${check("서로 다른 자원을 함께 활용", "composition.allowMixedMedia", "실사+데이터, 지도+주석처럼 하나의 의미를 강화하는 결합을 사용할 수 있습니다.")}${check("슬라이드 목적에 따라 레이아웃 변주", "composition.layoutDiversity", "덱의 공통 DNA를 유지하면서 페이지마다 다른 구성을 사용할 수 있습니다.")}</div></div></div></details>`;
    return `${panel("역할 경계", "발표 맥락과 의미·데이터는 무엇을 말할지 정하고, 공통 가이드는 어떤 디자인 언어를 쓸지 정합니다. 실제 구도는 필요한 잠금만 지킨 채 이미지 AI가 선택합니다.", roleMap)}${panel("형태·선·표면·공간의 문법", "개별 도형을 고르는 대신 AI가 여러 개체를 하나의 시각 언어로 조직할 원리를 정합니다.", grammar)}${panel("공간과 AI 구성 위임", "카드·섹션·블록의 경계, AI에게 맡길 구성 범위와 정보 호흡을 양끝 사이에서 바로 조정합니다.", spatialAxes)}${panel("일관성과 변주의 규칙", "모든 페이지를 같은 템플릿으로 만들지 않고도 하나의 덱으로 보이게 합니다.", consistency)}${panel("비주얼 결합 원칙", "주장과 증거에 따라 데이터·사진·다이어그램·타이포그래피 등이 적극적으로 결합될 수 있습니다.", languageMix)}${technical}`;
  }

  const PALETTE_INTENT_META = {
    trust: { title: "신뢰감 있는", help: "공공·기업 발표", colors: ["#123B6D", "#2F6EA5", "#EAF2F8"], categories: ["official"], usages: ["corporate"], temperatures: ["cool", "neutralCool"], saturations: ["controlled", "balanced"], contrasts: ["clear", "bold"] },
    warm: { title: "따뜻하고 친근한", help: "사람·지역·소통", colors: ["#C96B3B", "#E7B36A", "#FFF4E6"], categories: ["warm_earth", "soft"], temperatures: ["neutralWarm", "warm"], saturations: ["controlled", "balanced"], contrasts: ["soft", "clear"] },
    calm: { title: "차분하고 안정적인", help: "분석·정책·보고", colors: ["#40566D", "#8FA3B7", "#F1F5F7"], categories: ["nordic", "official"], temperatures: ["neutral", "neutralCool"], saturations: ["muted", "controlled"], contrasts: ["soft", "clear"] },
    vivid: { title: "생동감 있는", help: "성과·캠페인·행사", colors: ["#F04E3E", "#FFB21A", "#2563EB"], categories: ["energy", "candy", "multicolor"], usages: ["event"], saturations: ["vivid"], contrasts: ["bold", "dramatic"] },
    premium: { title: "고급스럽고 절제된", help: "제안·브랜드·임원 보고", colors: ["#171717", "#8A6A3B", "#E9E2D5"], categories: ["soft", "modern"], saturations: ["muted", "controlled"], contrasts: ["bold", "dramatic"] },
    future: { title: "기술적이고 미래적인", help: "기술·혁신·비전", colors: ["#111B3B", "#2055C7", "#20D4D8"], categories: ["tech"], temperatures: ["cool", "neutralCool"], saturations: ["balanced", "vivid"], contrasts: ["bold", "dramatic"] },
  };

  const PALETTE_FILTER_META = {
    temperature: { label: "온도", question: "차갑거나 따뜻한 느낌", values: [["all", "상관없음"], ["cool", "차가운 쪽"], ["balanced", "중간"], ["warm", "따뜻한 쪽"]] },
    saturation: { label: "선명함", question: "색이 눈에 띄는 정도", values: [["all", "상관없음"], ["calm", "차분하게"], ["balanced", "적당하게"], ["vivid", "선명하게"]] },
    contrast: { label: "대비", question: "밝고 어두운 차이", values: [["all", "상관없음"], ["soft", "부드럽게"], ["clear", "또렷하게"], ["strong", "강하게"]] },
  };

  function paletteFilterLabel(key, value) {
    return PALETTE_FILTER_META[key]?.values.find(([item]) => item === value)?.[1] || value;
  }

  function paletteMatchesEasyFilter(palette, key, value) {
    if (!value || value === "all") return true;
    const actual = palette.analysis?.[key];
    const groups = {
      temperature: { cool: ["cool", "neutralCool"], balanced: ["neutral"], warm: ["neutralWarm", "warm"] },
      saturation: { calm: ["muted", "controlled"], balanced: ["balanced"], vivid: ["vivid"] },
      contrast: { soft: ["soft"], clear: ["clear"], strong: ["bold", "dramatic"] },
    };
    return (groups[key]?.[value] || []).includes(actual);
  }

  function paletteSearchCorpus(palette) {
    const colorNames = (palette.colors || []).flatMap((hex) => {
      const named = PALETTE_CATALOG?.describeColor?.(hex) || {};
      return [named.nameKo, named.nameEn];
    });
    return [palette.name, palette.nameEn, palette.category, palette.mode, palette.usage, palette.mood, palette.colorMapping, palette.analysis?.labels?.temperature, palette.analysis?.labels?.saturation, palette.analysis?.labels?.contrast, ...colorNames].filter(Boolean).join(" ").toLowerCase();
  }

  function paletteIntentScore(palette, intentKey) {
    const intent = PALETTE_INTENT_META[intentKey];
    if (!intent) return 0;
    let score = 0;
    if (intent.categories?.includes(palette.category)) score += 5;
    if (intent.usages?.includes(palette.usage)) score += 3;
    if (intent.temperatures?.includes(palette.analysis?.temperature)) score += 2;
    if (intent.saturations?.includes(palette.analysis?.saturation)) score += 2;
    if (intent.contrasts?.includes(palette.analysis?.contrast)) score += 1;
    if (intentKey === "premium" && palette.mode === "dark") score += 2;
    return score;
  }

  function paletteQueryScore(palette, query) {
    const normalized = String(query || "").trim().toLowerCase();
    if (!normalized) return 0;
    const corpus = paletteSearchCorpus(palette);
    let score = 0;
    const concepts = [
      { pattern: /신뢰|공공|기관|공식|기업/, intent: "trust", terms: ["official", "corporate"] },
      { pattern: /따뜻|친근|온화|사람/, intent: "warm", terms: ["warm", "soft"] },
      { pattern: /차분|안정|정책|보고|절제/, intent: "calm", terms: ["muted", "controlled", "official"] },
      { pattern: /생동|활기|에너지|행사|선명/, intent: "vivid", terms: ["vivid", "event", "energy"] },
      { pattern: /고급|프리미엄|임원|럭셔리/, intent: "premium", terms: ["premium", "dark", "classic"] },
      { pattern: /미래|기술|디지털|혁신|테크/, intent: "future", terms: ["tech", "future", "digital"] },
      { pattern: /파랑|파란|블루|blue/, terms: ["블루", "blue", "인디고", "indigo", "시안", "cyan"], weight: 14 },
      { pattern: /초록|녹색|그린|green/, terms: ["그린", "green", "민트", "mint", "nature"], weight: 14 },
      { pattern: /주황|오렌지|orange/, terms: ["오렌지", "orange", "앰버", "amber"], weight: 14 },
      { pattern: /빨강|빨간|레드|red/, terms: ["레드", "red", "코랄", "coral"], weight: 14 },
      { pattern: /보라|퍼플|바이올렛|purple|violet/, terms: ["바이올렛", "violet", "퍼플", "purple", "마젠타"], weight: 14 },
      { pattern: /어두|다크|dark/, terms: ["dark"] },
      { pattern: /밝은|화이트|하얀|light|white/, terms: ["light", "화이트", "white"] },
    ];
    concepts.forEach((concept) => {
      if (!concept.pattern.test(normalized)) return;
      if (concept.intent) score += paletteIntentScore(palette, concept.intent) * 1.5;
      if (concept.terms?.some((term) => corpus.includes(term))) score += concept.weight || 4;
    });
    if (/차갑지\s*않|너무\s*차갑지/.test(normalized) && ["neutral", "neutralWarm"].includes(palette.analysis?.temperature)) score += 4;
    const stopWords = new Set(["있는", "없는", "같은", "느낌", "팔레트", "색상", "색", "너무", "조금", "않게", "정도", "사용", "발표"]);
    normalized.split(/[^0-9a-z가-힣]+/).filter((token) => token.length >= 2 && !stopWords.has(token)).forEach((token) => {
      if (corpus.includes(token)) score += 2;
    });
    return score;
  }

  function paletteRequiredColorTerms(query) {
    const normalized = String(query || "").toLowerCase();
    const families = [
      [/파랑|파란|블루|blue/, ["블루", "blue", "인디고", "indigo", "시안", "cyan", "네이비", "navy", "마린"]],
      [/초록|녹색|그린|green/, ["그린", "green", "민트", "mint", "틸", "teal"]],
      [/주황|오렌지|orange/, ["오렌지", "orange", "앰버", "amber"]],
      [/빨강|빨간|레드|red/, ["레드", "red", "코랄", "coral"]],
      [/보라|퍼플|바이올렛|purple|violet/, ["바이올렛", "violet", "퍼플", "purple", "마젠타", "인디고"]],
    ];
    return families.find(([pattern]) => pattern.test(normalized))?.[1] || [];
  }

  function paletteResults() {
    const base = PALETTE_CATALOG?.list?.({ category: colorUi.category, mode: colorUi.mode, usage: colorUi.usage }) || [];
    const requiredColorTerms = paletteRequiredColorTerms(colorUi.query);
    return base
      .filter((palette) => ["temperature", "saturation", "contrast"].every((key) => paletteMatchesEasyFilter(palette, key, colorUi[key])))
      .filter((palette) => !requiredColorTerms.length || requiredColorTerms.some((term) => paletteSearchCorpus(palette).includes(term)))
      .map((palette, index) => ({ palette, index, queryScore: paletteQueryScore(palette, colorUi.query), intentScore: paletteIntentScore(palette, colorUi.intent) }))
      .filter((item) => !colorUi.query || item.queryScore > 0)
      .sort((a, b) => (b.queryScore + b.intentScore) - (a.queryScore + a.intentScore) || a.index - b.index)
      .map((item) => item.palette);
  }

  function renderPaletteIntentCards() {
    return `<section class="cpd-palette-intent-section"><div class="cpd-palette-section-head"><div><strong>어떤 인상을 주고 싶나요?</strong><small>가장 가까운 느낌을 고르면 어울리는 팔레트부터 보여드립니다.</small></div>${colorUi.intent !== "all" ? '<button type="button" class="cpd-text-btn" data-palette-intent="all">전체 보기</button>' : ""}</div><div class="cpd-palette-intent-grid">${Object.entries(PALETTE_INTENT_META).map(([key, meta]) => `<button type="button" class="cpd-palette-intent${colorUi.intent === key ? " selected" : ""}" data-palette-intent="${key}" aria-pressed="${colorUi.intent === key ? "true" : "false"}"><span class="cpd-intent-swatches">${meta.colors.map((color) => `<i style="background:${color}"></i>`).join("")}</span><strong>${meta.title}</strong><small>${meta.help}</small></button>`).join("")}</div></section>`;
  }

  function renderPaletteEasyFilter(key) {
    const meta = PALETTE_FILTER_META[key];
    return `<fieldset class="cpd-palette-easy-filter"><legend><strong>${meta.label}</strong><span>${meta.question}</span></legend><div>${meta.values.map(([value, labelText]) => `<button type="button" class="${colorUi[key] === value ? "selected" : ""}" data-palette-easy-filter="${key}" data-palette-easy-value="${value}" aria-pressed="${colorUi[key] === value ? "true" : "false"}">${labelText}</button>`).join("")}</div></fieldset>`;
  }

  function renderColors() {
    const palettes = paletteResults();
    const categoryOptions = [["all", "전체 카테고리"], ...(PALETTE_CATALOG?.categories || []).map((item) => [item.id, item.label])];
    const activeFilters = ["temperature", "saturation", "contrast"].filter((key) => colorUi[key] !== "all");
    const filterChips = activeFilters.length
      ? activeFilters.map((key) => `<button type="button" data-palette-filter-clear="${key}" aria-label="${PALETTE_FILTER_META[key].label} 조건 해제">${PALETTE_FILTER_META[key].label}: ${escapeHtml(paletteFilterLabel(key, colorUi[key]))}<i aria-hidden="true">×</i></button>`).join("")
      : "<span>세부 조건 없이 다양한 결과를 보여드립니다.</span>";
    const paletteCards = palettes.slice(0, colorUi.visible).map((palette) => {
      const selected = colorDraft?.presetId === palette.id;
      const applied = get("colors.presetId") === palette.id;
      const analysis = palette.analysis || {};
      const candidate = PALETTE_CATALOG?.toSlidePalette?.(palette);
      const roles = candidate?.roles || {};
      const reason = colorUi.intent !== "all" ? `${PALETTE_INTENT_META[colorUi.intent]?.title || "선택한 인상"} 추천` : `${analysis.labels?.temperature || "중성"} · ${analysis.labels?.saturation || "균형 채도"}`;
      return `<button type="button" class="cpd-palette-card${selected ? " selected" : ""}${applied ? " applied" : ""}" data-mixer-palette-id="${escapeHtml(palette.id)}" aria-pressed="${selected ? "true" : "false"}" style="--palette-bg:${escapeHtml(roles.background?.hex || "#FFFFFF")};--palette-surface:${escapeHtml(roles.surface?.hex || "#F5F7FA")};--palette-text:${escapeHtml(roles.textPrimary?.hex || "#111827")};--palette-primary:${escapeHtml(roles.primary?.hex || "#2563EB")};--palette-accent:${escapeHtml(roles.accent?.hex || "#F97316")}">
        <span class="cpd-palette-card-preview" aria-hidden="true"><i class="preview-head"></i><i class="preview-title"></i><i class="preview-copy"></i><i class="preview-chart"></i><i class="preview-metric">KEY</i><i class="preview-foot"></i></span>
        <span class="cpd-palette-strip">${(palette.colors || []).map((hex) => `<i style="background:${escapeHtml(hex)}"></i>`).join("")}</span>
        <span class="cpd-palette-card-title"><strong>${escapeHtml(palette.name || palette.id)}</strong>${selected ? "<em>선택 중</em>" : applied ? "<em>현재 적용</em>" : ""}</span>
        <small>${escapeHtml(reason)} · ${escapeHtml(analysis.labels?.contrast || "명확한 대비")}</small>
      </button>`;
    }).join("");
    const appliedContrast = contrast(get("colors.textPrimary"), get("colors.background"));
    const readability = appliedContrast >= 7 ? "매우 읽기 편함" : appliedContrast >= 4.5 ? "읽기 편함" : "대비 조정 필요";
    const current = `<div class="cpd-applied-palette"><div><span>현재 슬라이드 색상</span><strong>${escapeHtml(paletteTitle())}</strong><small>${readability} · 본문 대비 ${appliedContrast.toFixed(1)}:1 · ${get("colors.baseCanvas") === "white" ? "흰색 기본 배경" : "팔레트 기본 배경"}</small></div>${renderSummaryColorSwatches()}</div>`;
    const search = `<div class="cpd-palette-search-block"><label class="cpd-field"><span>말로 찾아보기</span><div class="cpd-search-row"><input class="cpd-input" data-color-query value="${escapeHtml(colorUi.query)}" placeholder="예: 신뢰감 있는 파란색, 너무 차갑지 않게"><button type="button" class="cpd-btn primary" data-action="color-search">찾기</button></div><small class="cpd-palette-search-guide">색 이름뿐 아니라 분위기·대상·용도를 함께 적어도 됩니다.</small></label><button type="button" class="cpd-btn" data-action="reset-palette-filters">처음부터</button></div>`;
    const moreFilters = `<details class="cpd-palette-more-filters"><summary><span><strong>결과를 더 좁히고 싶나요?</strong><small>온도·선명함·대비와 용도를 간단히 조정</small></span><em>${activeFilters.length ? `${activeFilters.length}개 적용 중` : "선택 사항"}</em></summary><div><div class="cpd-palette-easy-filter-grid">${renderPaletteEasyFilter("temperature")}${renderPaletteEasyFilter("saturation")}${renderPaletteEasyFilter("contrast")}</div><div class="cpd-form-grid three cpd-palette-select-filters"><label class="cpd-field"><span>분야</span><select class="cpd-select" data-color-filter="category">${categoryOptions.map(([value, text]) => option(value, text, colorUi.category)).join("")}</select></label><label class="cpd-field"><span>화면 밝기</span><select class="cpd-select" data-color-filter="mode">${[["all", "상관없음"], ["light", "밝은 화면"], ["dark", "어두운 화면"]].map(([value, text]) => option(value, text, colorUi.mode)).join("")}</select></label><label class="cpd-field"><span>주요 용도</span><select class="cpd-select" data-color-filter="usage">${[["all", "상관없음"], ["corporate", "기업·기관"], ["brand", "브랜드"], ["event", "행사"], ["content", "콘텐츠"]].map(([value, text]) => option(value, text, colorUi.usage)).join("")}</select></label></div></div></details>`;
    const intentLabel = colorUi.intent !== "all" ? ` · ${PALETTE_INTENT_META[colorUi.intent]?.title || "선택한 인상"} 우선` : "";
    const results = `<div class="cpd-palette-results-head"><div><strong>팔레트 미리보기</strong><small>카드를 가리키면 오른쪽 슬라이드가 바뀌고, 클릭하면 적용 전 확인이 열립니다.</small></div><span>${palettes.length.toLocaleString("ko-KR")}개${escapeHtml(intentLabel)}</span></div><div class="cpd-active-palette-filters">${filterChips}</div>${colorDraft ? renderColorDraft() : ""}${palettes.length ? `<div class="cpd-palette-grid" role="listbox" aria-label="팔레트 검색 결과">${paletteCards}</div>${palettes.length > colorUi.visible ? '<div class="cpd-button-row cpd-load-more"><button type="button" class="cpd-btn" data-action="color-load-more">팔레트 12개 더 보기</button></div>' : ""}` : '<div class="cpd-palette-empty"><strong>딱 맞는 결과를 찾지 못했습니다.</strong><span>검색어를 짧게 쓰거나 세부 조건을 하나만 풀어보세요.</span><button type="button" class="cpd-btn" data-action="reset-palette-filters">전체 팔레트 보기</button></div>'}`;
    const roleEditor = `<div class="cpd-inline-note">HEX를 바꾸면 색상명이 자동 제안됩니다. 직접 편집한 색상은 현재 팔레트의 역할 색상으로 저장됩니다.</div><div class="cpd-color-role-editor">${CORE_COLOR_ROLE_KEYS.map((key) => { const meta = COLOR_ROLE_META[key]; const role = colorRole(key); return `<div class="cpd-color-role-card"><div class="cpd-color-role-head"><input type="color" data-color-path="colors.${key}" data-color-role="${key}" value="${escapeHtml(get(`colors.${key}`))}"><span><strong>${meta[0]}</strong><small>${meta[1]}</small></span></div><input class="cpd-input" data-path="colors.${key}" data-color-role="${key}" value="${escapeHtml(get(`colors.${key}`))}" maxlength="7" aria-label="${meta[0]} HEX"><div class="cpd-color-names"><input class="cpd-input" data-path="colors.names.${key}.nameKo" value="${escapeHtml(role.nameKo)}" aria-label="${meta[0]} 한글 색상명"><input class="cpd-input" data-path="colors.names.${key}.nameEn" value="${escapeHtml(role.nameEn)}" aria-label="${meta[0]} 영문 색상명"></div></div>`; }).join("")}</div>`;
    const usageControls = `<div class="cpd-form-grid" style="margin-top:16px">${selectField("팔레트 아이덴티티", "colors.identityPattern", [["currentDecision", "연결 흐름 + 결정점"], ["fieldMarker", "증거 색면 + 핵심 표식"], ["sectionBand", "섹션 밴드 + 전환 노치"], ["roleOnly", "역할색만 사용"]])}${selectField("덱 색채 리듬", "colors.deckColorRhythm", [["sectionArc", "분석→증거→실행→통합"], ["alternating", "차가움↔자연색 교차"], ["steady", "안정된 동일 온도"]])}${selectField("실사 조화 방식", "colors.photoHarmony", [["frameNotTint", "프레임만 팔레트·사진은 자연색"], ["selectiveEcho", "사진 속 한 색을 주석에 반향"], ["neutralMat", "중성 매트로 사진 분리"]], "cpd-span-all")}<div class="cpd-span-all cpd-checks">${check("파생 중성색·명도 단계 활용", "colors.allowDerivedTones", "카드·구분선·보조 텍스트에 팔레트의 밝고 어두운 파생색을 사용할 수 있습니다.")}${check("강조색 생략 가능", "colors.allowAccentOmission", "강조색이 메시지에 도움이 되지 않으면 언급을 생략합니다.")}${check("사진의 고유색 보존", "colors.preservePhotoLocalColor", "실사 이미지를 팔레트 한 색으로 물들이지 않습니다.")}${check("오버레이는 국부 영역에만 활용", "colors.forbidGlobalHueWash", "읽기 보호가 필요한 영역에만 선택적으로 적용합니다.")}</div></div>`;
    const advanced = `<details class="cpd-design-advanced" data-design-advanced="colors"${designAdvancedOpen.has("colors") ? " open" : ""}><summary><span>직접 편집</span><small>HEX·색상명·덱 아이덴티티·실사 조화 방식을 조정</small></summary><div class="cpd-design-advanced-body">${panel("역할 색상과 반복 문법", "색을 고르는 데서 끝내지 않고, 덱 전체에서 반복될 사용 패턴을 함께 정의합니다.", `${roleEditor}${usageControls}`)}</div></details>`;
    return `${panel("느낌을 고르고 결과로 결정하세요", "전문 색상 용어를 몰라도 원하는 인상이나 문장으로 찾을 수 있습니다. 선택한 팔레트만 최종 이미지 생성 프롬프트에 반영됩니다.", `<div class="cpd-palette-finder">${current}${renderPaletteIntentCards()}${search}${moreFilters}${results}</div>`)}${advanced}`;
  }

  function renderColorDraft() {
    if (!colorDraft) return "";
    const roles = CORE_COLOR_ROLE_KEYS.map((key) => { const meta = COLOR_ROLE_META[key]; const role = colorDraft.roles[key]; return `<div class="cpd-draft-role"><span><i style="background:${role.hex}"></i><strong>${meta[0]}</strong></span><span>${escapeHtml(role.nameKo)} <small>${escapeHtml(role.nameEn)} · ${role.hex}</small></span></div>`; }).join("");
    const contrastValue = Number(colorDraft.validation?.textContrast || 0);
    return `<div class="cpd-color-draft"><div class="cpd-color-draft-head"><div><small>적용 전 미리보기</small><h4>${escapeHtml(colorDraft.paletteNameKo)} <span>${escapeHtml(colorDraft.paletteNameEn)}</span></h4></div><span class="cpd-contrast-badge ${contrastValue >= 4.5 ? "pass" : "fail"}">본문 대비 ${contrastValue.toFixed(1)}:1 · ${contrastValue >= 4.5 ? "AA 통과" : "조정 필요"}</span></div><div class="cpd-draft-roles">${roles}</div><div class="cpd-button-row"><button type="button" class="cpd-btn primary" data-action="apply-color-draft">이 팔레트 적용</button><button type="button" class="cpd-btn" data-action="cancel-color-draft">취소</button></div></div>`;
  }

  function isBackgroundPhotoActive() {
    return get("background.photoMode") !== "off";
  }

  function backgroundPhotoSummary() {
    if (!isBackgroundPhotoActive()) return "실사 배경 사용 안 함";
    const mode = label("background.photoMode", { conditional: "개별 명세에 있을 때", preferred: "필요하면 자동 추가" });
    const saturation = label("background.photoSaturation", { natural: "자연색", low: "저채도", mono: "흑백" });
    return `${mode} · ${saturation} · 배치·레이어 AI 판단`;
  }

  function renderBackgroundPhotoSettings() {
    const active = isBackgroundPhotoActive();
    return `<div class="cpd-background-photo"><div class="cpd-background-photo-head"><div><strong>캔버스 배경 사진 표현</strong><small>사진 사용 여부와 범위는 이 단계 상단의 사진 정책을 따릅니다. 여기서는 배경 사진의 색감과 텍스트 보호만 정합니다.</small></div><span>${escapeHtml(backgroundPhotoSummary())}</span></div>
      ${active ? `<div class="cpd-design-axis-grid cpd-choice-axis-grid cpd-background-photo-axes">${choiceAxis("background.photoSaturation")}${choiceAxis("background.photoOverlay")}</div><div class="cpd-checks">${check("사진 대상이 없으면 일반 맥락 장면 활용", "background.photoAllowContextScene", "체크하면 제목과 의미에서 직접 도출되는 일반 장면 활용 문장이 추가됩니다.")}${check("제목·수치의 읽기 영역 보호", "background.photoProtectText", "체크하면 크롭·여백·국부 대비 활용 문장이 추가됩니다.")}${check("현실적인 원근·조명 유지", "background.photoRealism", "체크하면 장면의 물리적 일관성 안내가 추가됩니다.")}</div>` : '<div class="cpd-photo-disabled-note"><strong>실사 배경 문장을 추가하지 않습니다.</strong><span>이 선택은 사진을 금지하는 문장을 만들지 않고, 실사 배경 관련 안내만 프롬프트에서 생략합니다.</span></div>'}</div>`;
  }

  function backgroundSummary() {
    const purpose = label("background.purpose", { focus: "내용 집중", data: "데이터 보호", atmosphere: "분위기 보조", premium: "프리미엄", conditional: "슬라이드별 판단" });
    const type = label("background.type", { solid: "단색", lightNeutral: "밝은 중성", gradient: "절제된 그라데이션", geometric: "낮은 대비 도형", conditional: "개별 판단" });
    return `${type} · ${purpose} · ${zoneSeparationLabel()}${get("background.avoidBusyBackground") ? " · 낮은 배경 밀도" : ""}${isBackgroundPhotoActive() ? ` · ${backgroundPhotoSummary()}` : ""}`;
  }

  const SURFACE_ROLE_OPTIONS = [
    ["adaptiveDistinct", "AI 조화색 · 본문과 구분되는 표면"],
    ["primarySolid", "Primary 선명면 · 강한 프레임"],
    ["primaryTint", "Primary 옅은면 · 절제된 구분"],
    ["secondaryTint", "Secondary 옅은면 · 보조 프레임"],
    ["accentTint", "Accent 옅은면 · 짧은 강조 영역"],
    ["lightNeutral", "밝은 중성면 · 차분한 분리"],
    ["darkNeutral", "어두운 중성면 · 높은 대비"],
    ["transparent", "본문 배경과 연결 · 색면 생략"],
  ];

  function surfaceRoleLabel(value = "adaptiveDistinct", ko = true) {
    const labels = {
      adaptiveDistinct: ["본문과 구분되는 조화색", "a coordinated surface distinct from the body"],
      primarySolid: ["Primary 선명면", "a solid Primary surface"],
      primaryTint: ["Primary 옅은면", "a light Primary tint"],
      secondaryTint: ["Secondary 옅은면", "a light Secondary tint"],
      accentTint: ["Accent 옅은면", "a light Accent tint"],
      lightNeutral: ["밝은 중성면", "a light neutral surface"],
      darkNeutral: ["어두운 중성면", "a dark neutral surface"],
      transparent: ["본문 배경과 연결", "a surface connected to the body background"],
    };
    return labels[value]?.[ko ? 0 : 1] || labels.adaptiveDistinct[ko ? 0 : 1];
  }

  function zoneSeparationLabel(inputValue = get("background.zoneSeparation"), ko = true) {
    const labels = ko
      ? ["연속 배경", "미세한 톤 구분", "절제된 구역 구분", "분명한 구역별 표면", "강한 영역 대비"]
      : ["a continuous background", "subtle tonal separation", "restrained sectional separation", "clearly distinct zoned surfaces", "strong sectional contrast"];
    return labels[Math.max(1, Math.min(5, Number(inputValue) || 4)) - 1];
  }

  function surfacePreviewStyle(role) {
    const base = escapeHtml(get("colors.background"));
    const surface = escapeHtml(get("colors.surface"));
    const primary = escapeHtml(get("colors.primary"));
    const secondary = escapeHtml(get("colors.secondary"));
    const accent = escapeHtml(get("colors.accent"));
    const text = escapeHtml(get("colors.textPrimary"));
    const styles = {
      adaptiveDistinct: `background:linear-gradient(120deg,color-mix(in srgb,${primary} 18%,${base}),color-mix(in srgb,${secondary} 12%,${surface}));color:${text}`,
      primarySolid: `background:${primary};color:${base}`,
      primaryTint: `background:color-mix(in srgb,${primary} 14%,${base});color:${text}`,
      secondaryTint: `background:color-mix(in srgb,${secondary} 16%,${base});color:${text}`,
      accentTint: `background:color-mix(in srgb,${accent} 15%,${base});color:${text}`,
      lightNeutral: `background:${surface};color:${text}`,
      darkNeutral: `background:${text};color:${base}`,
      transparent: `background:${base};color:${text}`,
    };
    return styles[role] || styles.adaptiveDistinct;
  }

  function renderSurfaceZonePreview() {
    const headerRole = get("header.type") === "none" ? "transparent" : get("header.surfaceRole");
    const footerRole = get("footer.type") === "none" ? "transparent" : get("footer.surfaceRole");
    return `<div class="cpd-zone-preview" aria-label="헤더·본문·푸터 배경 영역 미리보기">
      <div class="cpd-zone-preview-header" style="${surfacePreviewStyle(headerRole)}"><span>HEADER</span><strong>${escapeHtml(surfaceRoleLabel(headerRole))}</strong></div>
      <div class="cpd-zone-preview-body" style="background:${escapeHtml(get("colors.background"))};color:${escapeHtml(get("colors.textPrimary"))}"><span>BODY</span><strong>본문 기본 배경</strong><i style="background:${escapeHtml(get("colors.surface"))}">핵심 정보면</i></div>
      <div class="cpd-zone-preview-footer" style="${surfacePreviewStyle(footerRole)}"><span>FOOTER</span><strong>${escapeHtml(surfaceRoleLabel(footerRole))}</strong></div>
    </div>`;
  }

  function renderZoneSeparationControl() {
    const value = Math.max(1, Math.min(5, Number(get("background.zoneSeparation")) || 4));
    return `<fieldset class="cpd-zone-separation" data-zone-control style="--cpd-axis-position:${((value - 1) / 4) * 100}%"><div class="cpd-zone-separation-head"><div><span>영역별 배경 분리감</span><strong>헤더·본문·푸터가 얼마나 다른 표면으로 보일까요?</strong></div><output data-zone-output><small>${value}/5</small><strong>${escapeHtml(zoneSeparationLabel(value))}</strong></output></div><div class="cpd-design-axis-control"><button type="button" class="cpd-axis-endpoint left" data-zone-set="1"><span>연속된</span><small>한 배경의 흐름</small></button><div class="cpd-axis-range"><input type="range" min="1" max="5" step="1" data-path="background.zoneSeparation" data-zone-range value="${value}" aria-label="영역별 배경 분리감" aria-valuetext="${escapeHtml(zoneSeparationLabel(value))}"><span class="cpd-axis-ticks" aria-hidden="true">${renderAxisTicks(5, value - 1)}</span></div><button type="button" class="cpd-axis-endpoint right" data-zone-set="5"><span>구역별</span><small>서로 다른 조화면</small></button></div><div class="cpd-design-axis-foot"><span>기본값은 헤더·본문·푸터를 서로 다른 조화면으로 구성합니다.</span><button type="button" data-zone-set="3">중간으로</button></div></fieldset>`;
  }

  function updateZoneSeparationInline(inputValue) {
    const value = Math.max(1, Math.min(5, Number(inputValue) || 4));
    const control = root.querySelector("[data-zone-control]");
    if (control) {
      control.style.setProperty("--cpd-axis-position", `${((value - 1) / 4) * 100}%`);
      control.querySelectorAll(".cpd-axis-ticks i").forEach((tick, index) => tick.classList.toggle("active", index + 1 === value));
    }
    const range = root.querySelector("[data-zone-range]");
    if (range) range.setAttribute("aria-valuetext", zoneSeparationLabel(value));
    const output = root.querySelector("[data-zone-output]");
    if (output) {
      const step = output.querySelector("small");
      const labelText = output.querySelector("strong");
      if (step) step.textContent = `${value}/5`;
      if (labelText) labelText.textContent = zoneSeparationLabel(value);
    }
  }

  function renderBackground() {
    const activeProfile = get("background.profile") || "custom";
    const rules = [get("background.avoidBusyBackground") ? "복잡한 무늬 방지" : "배경 밀도 직접 판단", isBackgroundPhotoActive() ? backgroundPhotoSummary() : "비실사 배경"];
    const intent = `<div class="cpd-background-summary"><div><small>현재 캔버스 배경</small><strong>${escapeHtml(backgroundSummary())}</strong><span>${escapeHtml(BACKGROUND_PROFILES[activeProfile]?.label || "직접 설정")}</span></div><div class="cpd-background-summary-rules">${rules.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div></div>${renderSurfaceZonePreview()}${renderZoneSeparationControl()}<div class="cpd-form-grid cpd-background-intent">
      ${selectField("캔버스 배경의 역할", "background.purpose", [["focus", "내용을 또렷하게"], ["data", "정보 관계에 집중"], ["atmosphere", "분위기를 은은하게 보조"], ["premium", "고급스러운 깊이 추가"], ["conditional", "슬라이드별로 판단"]])}
      ${selectField("캔버스 배경 처리", "background.type", [["solid", "단색 — 가장 안정적"], ["lightNeutral", "밝은 중성 — 보고서 기본"], ["gradient", "절제된 그라데이션 — 분위기 보조"], ["geometric", "낮은 대비 도형 — 구조감 추가"], ["conditional", "개별 슬라이드 판단"]])}
    </div>${choiceAxis("background.intensity")}`;
    const advanced = `<details class="cpd-design-advanced" data-design-advanced="background"${designAdvancedOpen.has("background") ? " open" : ""}><summary><span>고급 편집</span><small>추천 배경·국부 흐림·실사 배경 표현을 직접 조정</small></summary><div class="cpd-design-advanced-body">${panel("빠른 추천", "발표자료의 성격에 맞는 배경 시작점을 적용합니다.", `<div class="cpd-background-profile-grid">${Object.entries(BACKGROUND_PROFILES).map(([key, profile]) => `<button type="button" class="cpd-background-profile${activeProfile === key && get("background.source") !== "custom" ? " selected" : ""}" data-background-profile="${key}" aria-pressed="${activeProfile === key}"><span><strong>${profile.label}</strong><small>${profile.help}</small></span><em>${profile.note}</em><b>${labelValue(profile.values.type, { solid: "단색", lightNeutral: "밝은 중성", gradient: "절제된 그라데이션", conditional: "개별 판단" })}</b></button>`).join("")}</div>`)}${panel("표면 세부", "필요한 경우에만 국부 효과와 배경 밀도를 조정합니다.", `${choiceAxis("background.blur")}<div class="cpd-checks cpd-choice-axis-followup">${check("낮은 배경 밀도 유지", "background.avoidBusyBackground", "그라데이션과 도형이 콘텐츠보다 앞서지 않도록 밀도를 낮춥니다.")}</div>`)}${panel("실사 배경", "저채도·흑백 등 배경 사진의 표현만 담당합니다.", renderBackgroundPhotoSettings())}</div></details>`;
    return `${panel("캔버스 배경", "구조 단계의 카드·도형 표면과 구분되는, 슬라이드 전체 뒤쪽의 영역·분위기만 정합니다.", intent)}${advanced}`;
  }

  function headerSummary() {
    if (get("header.type") === "none") return "공통 헤더 사용 안 함";
    const type = label("header.type", { plain: "간결한 제목 영역", thinBar: "상단 얇은 바", fullBar: "상단 컬러 바", leftRule: "좌측 세로선", numberTitle: "번호·제목 조합" });
    const items = [get("header.showSectionLabel") ? "섹션명" : "", get("header.showSubtitle") ? "부제" : "", get("header.showPageNumber") ? "페이지 번호" : ""].filter(Boolean);
    return `${type} · ${surfaceRoleLabel(get("header.surfaceRole"))}${items.length ? ` · ${items.join("·")}` : " · 반복 정보 최소화"}`;
  }

  function footerSummary() {
    if (get("footer.type") === "none") return "공통 푸터 사용 안 함";
    const type = label("footer.type", { divider: "얇은 구분선", source: "출처 영역", institution: "기관정보 영역", minimal: "최소 하단 영역" });
    return `${type} · ${surfaceRoleLabel(get("footer.surfaceRole"))}${get("footer.showPageNumber") ? " · 페이지 번호" : " · 페이지 번호 없음"}`;
  }

  function profileCards(profiles, selected, attribute, typeMap) {
    return `<div class="cpd-frame-profile-grid">${Object.entries(profiles).map(([key, item]) => `<button type="button" class="cpd-frame-profile${selected === key ? " selected" : ""}" ${attribute}="${key}" aria-pressed="${selected === key}"><span><strong>${item.label}</strong><small>${item.help}</small></span><em>${item.note}</em><b>${labelValue(item.values.type, typeMap)}</b></button>`).join("")}</div>`;
  }

  function matchingProfileKey(profiles, scope) {
    return Object.entries(profiles).find(([, item]) => Object.entries(item.values).every(([key, value]) => get(`${scope}.${key}`) === value))?.[0] || "custom";
  }

  function pageNumberLocation() {
    if (get("header.showPageNumber")) return "header";
    if (get("footer.showPageNumber")) return "footer";
    return "none";
  }

  function renderPageNumberLocation() {
    const current = pageNumberLocation();
    const options = [
      ["none", "표시 안 함", "표지형·자유 구성 또는 번호가 필요 없는 자료"],
      ["header", "헤더", "하단을 출처·기관정보에 온전히 사용"],
      ["footer", "푸터 · 추천", "일반 발표에서 가장 익숙하고 안정적인 위치"],
    ];
    return panel("페이지 번호 위치", "헤더와 푸터에서 중복 설정하지 않고 전체 덱의 위치를 한 번만 선택합니다.", `<div class="cpd-page-number-choices" role="radiogroup" aria-label="페이지 번호 위치">${options.map(([value, title, help]) => `<button type="button" role="radio" class="cpd-page-number-choice${current === value ? " selected" : ""}" data-page-number-location="${value}" aria-checked="${current === value}"><strong>${title}</strong><small>${help}</small></button>`).join("")}</div>`);
  }

  function renderHeader() {
    const enabled = get("header.type") !== "none";
    const selected = matchingProfileKey(HEADER_PROFILES, "header");
    const rules = [enabled ? "헤더 사용" : "헤더 미사용", enabled ? surfaceRoleLabel(get("header.surfaceRole")) : "배경면 없음", get("header.showSectionLabel") ? "섹션명 표시" : "섹션명 미표시", get("header.showPageNumber") ? "페이지 번호는 상단" : "페이지 번호는 하단 또는 미표시"];
    return `${panel("현재 헤더 사용 방식", "반복해서 보여줄 정보와 차지하는 공간을 먼저 확인합니다.", `<div class="cpd-frame-summary"><div><small>현재 설정</small><strong>${escapeHtml(headerSummary())}</strong><span>${escapeHtml(HEADER_PROFILES[selected]?.label || "직접 설정")}</span></div><div class="cpd-frame-summary-rules">${rules.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div></div>`)}
    ${panel("빠른 추천", "발표자료 성격을 고르면 헤더 형태, 반복 정보와 권장 높이를 함께 적용합니다.", profileCards(HEADER_PROFILES, selected, "data-header-profile", { none: "사용 안 함", plain: "간결한 제목 영역", thinBar: "상단 얇은 바", fullBar: "상단 컬러 바", leftRule: "좌측 세로선", numberTitle: "번호·제목 조합" }))}
    ${panel("헤더 개별 설정", "설정한 높이는 배경·텍스트·내부 여백을 모두 포함한 헤더 전체 경계입니다. 페이지 번호 위치는 위의 전역 선택을 따릅니다.", `<div class="cpd-form-grid">${selectField("헤더 표현 방식", "header.type", [["none", "사용하지 않음"], ["plain", "간결한 제목 영역"], ["thinBar", "상단 얇은 바"], ["fullBar", "상단 컬러 바"], ["leftRule", "좌측 세로선"], ["numberTitle", "번호와 제목 조합"]])}${enabled ? `${selectField("헤더 배경면", "header.surfaceRole", SURFACE_ROLE_OPTIONS)}${rangeField("전체 헤더 영역 높이", "header.heightPercent", 5, 22)}${selectField("정보 정렬", "header.align", [["left", "왼쪽 — 발표자료 기본"], ["center", "가운데"], ["right", "오른쪽"]])}<div class="cpd-span-all cpd-checks">${check("섹션명 표시", "header.showSectionLabel", "현재 장이나 구간을 짧게 안내합니다.")}${check("부제 표시", "header.showSubtitle", "제목을 보충하는 짧은 설명이 있을 때 사용합니다.")}${check("제목 영역 아래 구분선", "header.divider", "본문과 헤더를 가볍게 구분합니다.")}</div>` : `<div class="cpd-span-all cpd-inline-note"><strong>헤더 상세 설정을 숨겼습니다.</strong> 헤더를 사용하지 않으면 높이·정렬·반복 정보는 프롬프트에서 자동 제외됩니다.</div>`}</div>`)}`;
  }

  function renderFooter() {
    const enabled = get("footer.type") !== "none";
    const selected = matchingProfileKey(FOOTER_PROFILES, "footer");
    const rules = [enabled ? "푸터 사용" : "푸터 미사용", enabled ? surfaceRoleLabel(get("footer.surfaceRole")) : "배경면 없음", ["source", "institution"].includes(get("footer.type")) ? "보조 정보 영역" : "최소 정보 영역", get("footer.showPageNumber") ? "페이지 번호는 하단" : "페이지 번호는 상단 또는 미표시"];
    return `${panel("현재 푸터 사용 방식", "출처·기관정보·페이지 번호 중 반복해서 필요한 정보만 확인합니다.", `<div class="cpd-frame-summary"><div><small>현재 설정</small><strong>${escapeHtml(footerSummary())}</strong><span>${escapeHtml(FOOTER_PROFILES[selected]?.label || "직접 설정")}</span></div><div class="cpd-frame-summary-rules">${rules.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div></div>`)}
    ${panel("빠른 추천", "자료 성격을 고르면 푸터의 정보 역할, 표면과 권장 높이를 함께 적용합니다. 페이지 번호 위치는 위의 전역 선택을 유지합니다.", profileCards(FOOTER_PROFILES, selected, "data-footer-profile", { none: "사용 안 함", divider: "얇은 구분선", source: "출처 영역", institution: "기관정보 영역", minimal: "최소 하단" }))}
    ${panel("푸터 개별 설정", "푸터 배경면은 헤더·본문과 독립적으로 정하고 실제 출처·기관 문구는 개별 명세에서 받습니다. 페이지 번호 위치는 위의 전역 선택을 따릅니다.", `<div class="cpd-form-grid">${selectField("푸터에 표시할 정보", "footer.type", [["none", "사용하지 않음"], ["source", "출처 영역"], ["institution", "기관정보 영역"], ["minimal", "최소 하단 영역"], ["divider", "정보 없이 얇은 구분선"]])}${enabled ? `${selectField("푸터 배경면", "footer.surfaceRole", SURFACE_ROLE_OPTIONS)}${rangeField("푸터 최대 높이", "footer.heightPercent", 3, 15)}${selectField("정보 정렬", "footer.align", [["left", "왼쪽 — 출처·기관정보 기본"], ["center", "가운데"], ["right", "오른쪽 — 페이지 번호 기본"]])}<div class="cpd-span-all cpd-checks">${check("푸터 위 구분선", "footer.divider", "본문과 보조 정보를 가볍게 구분합니다.")}</div>` : `<div class="cpd-span-all cpd-inline-note"><strong>푸터 상세 설정을 숨겼습니다.</strong> 푸터를 사용하지 않으면 높이·정렬·반복 정보는 프롬프트에서 자동 제외됩니다.</div>`}</div>`)}`;
  }

  function typographySummary() {
    const headline = label("typography.headlineCharacter", { authoritative: "신뢰감 있는 제목", modern: "현대적인 제목", restrained: "절제된 제목", friendly: "친근한 제목" });
    const body = label("typography.bodyCharacter", { neutral: "중립적인 본문", legible: "읽기 편한 본문", technical: "기술 문서형 본문" });
    const visual = get("typography.visualTypographyNameKo");
    return `${get("typography.fontName") || "글꼴 특성 중심"} · ${headline} · ${body}${get("typography.emphasizeNumbers") ? " · 숫자 강조" : ""}${visual ? ` · ${visual}` : ""}`;
  }

  function typographySpecimen() {
    const headlineClass = `headline-${get("typography.headlineCharacter")} scale-${get("typography.headlineScale")}`;
    const bodyClass = `body-${get("typography.bodyCharacter")} scale-${get("typography.bodyScale")} line-${get("typography.lineHeight")} tracking-${get("typography.letterSpacing")}`;
    const scope = label("typography.visualTypographyScope", { headline: "제목만", cover_section: "표지·구분 슬라이드", all: "전체 텍스트" });
    return `<div class="cpd-type-specimen" aria-label="현재 타이포그래피 미리보기"><div class="cpd-type-slide"><small>2026 BUSINESS REVIEW</small><strong class="${headlineClass}">지역산업 성장전략</strong><p class="${bodyClass}">핵심 성과와 다음 단계가 한눈에 읽히도록 제목과 본문의 위계를 구성합니다.</p><div><b class="${get("typography.emphasizeNumbers") ? "emphasized" : ""}">37.5%</b><span>전년 대비 성장률</span></div></div><div class="cpd-type-specimen-meta"><span>프로젝터 가독성 ${get("typography.projectorMode") ? "확인" : "일반"}</span>${get("typography.visualTypographyNameKo") ? `<span>${escapeHtml(scope)} 적용</span>` : ""}</div></div>`;
  }

  function renderTypographyDraft() {
    if (!typographyDraft) return "";
    const scopeOptions = [["headline", "제목에만 적용"], ["cover_section", "표지·구분 슬라이드에만"], ["all", "전체 텍스트에 적용"]];
    const warning = typographyDraft.highRisk ? "장식성이 강한 스타일입니다. 본문 전체 적용 시 가독성이 크게 낮아질 수 있습니다." : "표현 기법만 가져오며 글꼴명, 색상, 구도와 콘텐츠는 변경하지 않습니다.";
    return `<div class="cpd-type-draft"><div class="cpd-direction-draft-head"><div><small>적용 전 확인</small><h4>${escapeHtml(typographyDraft.nameKo)} <span>${escapeHtml(typographyDraft.nameEn)}</span></h4></div><span class="cpd-badge${typographyDraft.highRisk ? " warning" : " ok"}">${escapeHtml(typographyDraft.categoryLabel)}</span></div><p>${escapeHtml(typographyDraft.description)}</p><label class="cpd-field"><span>적용 범위</span><select class="cpd-select" data-typography-scope-draft>${scopeOptions.map(([value, text]) => option(value, text, typographyUi.scope)).join("")}</select><small class="cpd-field-note">장식적 스타일은 제목에만 적용하는 것을 권장합니다.</small></label><div class="cpd-inline-note">${escapeHtml(warning)}</div><div class="cpd-button-row"><button type="button" class="cpd-btn primary" data-action="apply-typography-draft">이 스타일 적용</button><button type="button" class="cpd-btn" data-action="cancel-typography-draft">취소</button></div></div>`;
  }

  function renderTypography() {
    const sources = [["common", "빠른 추천", "용도별 조합"], ["mixer", "비주얼 믹서", "표현 스타일 연결"], ["custom", "직접 설정", "세부 값 조정"]];
    const sourceNav = `<div class="cpd-color-source" role="tablist" aria-label="타이포그래피 선택 방식">${sources.map(([key, title, sub]) => `<button type="button" class="cpd-color-source-btn${typographyUi.source === key ? " active" : ""}" data-typography-source="${key}" role="tab" aria-selected="${typographyUi.source === key}"><strong>${title}</strong><small>${sub}</small></button>`).join("")}</div>`;
    let sourceBody = "";
    if (typographyUi.source === "common") {
      sourceBody = `<div class="cpd-type-preset-grid">${Object.entries(TYPOGRAPHY_PRESETS).map(([key, preset]) => `<button type="button" class="cpd-type-preset${get("typography.presetId") === key && !typographyDraft ? " selected" : ""}" data-typography-preset="${key}" aria-pressed="${get("typography.presetId") === key}"><span><strong>${preset.label}</strong><small>${preset.help}</small></span><em>${preset.note}</em><b>${preset.values.fontName}</b></button>`).join("")}</div><div class="cpd-inline-note cpd-type-help"><strong>추천 조합은 시작점입니다.</strong> 적용 후 직접 설정에서 글꼴이나 간격만 바꿀 수 있습니다.</div>`;
    } else if (typographyUi.source === "mixer") {
      const recommended = typographyUi.category === "recommended";
      const styles = TYPOGRAPHY_CATALOG?.list?.({ recommended, category: recommended ? "all" : typographyUi.category }) || [];
      const categories = [["recommended", "발표자료 추천"], ["all", "전체 스타일"], ...(TYPOGRAPHY_CATALOG?.categories || []).map((item) => [item.id, item.label.replace(/^\S+\s*/, "")])];
      sourceBody = `<div class="cpd-type-mixer-toolbar"><label class="cpd-field"><span>표현 스타일 범위</span><select class="cpd-select" data-typography-filter="category">${categories.map(([value, text]) => option(value, text, typographyUi.category)).join("")}</select><small class="cpd-field-note">본문 가독성을 지키기 위해 안전한 스타일을 먼저 보여줍니다.</small></label><div class="cpd-button-row cpd-mixer-link-row"><button type="button" class="cpd-btn soft" data-action="import-mixer-typography">현재 선택 가져오기</button><button type="button" class="cpd-btn" data-action="open-mixer-typography">비주얼 믹서에서 찾아보기</button><span>${styles.length}개 스타일</span></div></div>${get("typography.visualTypographyNameKo") ? `<div class="cpd-applied-medium"><div><small>현재 적용 스타일</small><strong>${escapeHtml(get("typography.visualTypographyNameKo"))} <span>${escapeHtml(get("typography.visualTypographyNameEn"))}</span></strong></div><button type="button" class="cpd-btn" data-action="remove-typography">스타일 해제</button></div>` : ""}<div class="cpd-type-style-grid">${styles.slice(0, typographyUi.visible).map((item) => `<button type="button" class="cpd-type-style-card${typographyDraft?.id === item.id ? " selected" : get("typography.visualTypographyId") === item.id ? " applied" : ""}" data-typography-id="${escapeHtml(item.id)}"><span><strong>${escapeHtml(item.nameKo)}</strong>${item.recommended ? "<em>추천</em>" : item.highRisk ? "<em class=\"risk\">제목용</em>" : ""}</span><small>${escapeHtml(item.description)}</small><b>${escapeHtml(item.categoryLabel)}</b></button>`).join("")}</div>${styles.length > typographyUi.visible ? '<div class="cpd-button-row cpd-load-more"><button type="button" class="cpd-btn" data-action="typography-load-more">12개 더 보기</button></div>' : ""}${renderTypographyDraft()}`;
    } else {
      sourceBody = `<div class="cpd-form-grid three cpd-type-basic">${selectField("글꼴 계열", "typography.family", [["sans", "산세리프 · 깔끔하고 현대적"], ["serif", "세리프 · 전통적이고 차분함"], ["mixed", "혼합 · 제목과 본문 대비"]])}${textField("선호 글꼴명", "typography.fontName")}${selectField("제목을 어떻게 보이게 할까요?", "typography.headlineCharacter", [["authoritative", "신뢰감 있게"], ["modern", "현대적으로"], ["restrained", "차분하게"], ["friendly", "친근하게"]])}${selectField("본문 읽기 방식", "typography.bodyCharacter", [["neutral", "중립적으로"], ["legible", "읽기 편하게"], ["technical", "기술 문서처럼"]])}${selectField("제목 강조 정도", "typography.headlineScale", [["standard", "보통"], ["large", "크게"], ["xlarge", "매우 크게"]])}${selectField("한 화면의 정보량", "typography.bodyScale", [["compact", "많이 담기"], ["standard", "균형"], ["large", "여유롭게"]])}<label class="cpd-field cpd-span-all"><span>글꼴을 재현하지 못할 때의 대체 특성</span><input class="cpd-input" data-path="typography.fallback" value="${escapeHtml(get("typography.fallback"))}" placeholder="예: clean Korean sans-serif"><small class="cpd-field-note">글꼴명과 함께 시각적 특성을 전달해 생성 모델 호환성을 높입니다.</small></label></div><details class="cpd-type-advanced"><summary>세부 조정 <small>간격과 안전 규칙이 필요할 때만 펼치기</small></summary><div class="cpd-type-advanced-body"><div class="cpd-form-grid three">${selectField("줄 사이 여백", "typography.lineHeight", [["tight", "좁게"], ["standard", "보통"], ["wide", "넓게"]])}${selectField("글자 사이 간격", "typography.letterSpacing", [["tight", "좁게"], ["standard", "보통"], ["wide", "넓게"]])}<div class="cpd-span-all cpd-checks">${check("숫자·단위 강조", "typography.emphasizeNumbers")}${check("프로젝터 거리 가독성 확인", "typography.projectorMode")}${check("세로쓰기 제한", "typography.avoidVerticalText")}${check("도형 내부 장문 금지", "typography.avoidLongTextInShapes")}${check("작은 글자 최소화", "typography.minimizeSmallText")}${check("깨진 한글 금지", "typography.forbidMalformedKorean")}</div></div></div></details>`;
    }
    const voice = `<div class="cpd-form-grid">${selectField("말하는 목소리", "typography.voice", [["institutional", "제도적 · 공식 문서처럼"], ["authoritativeModern", "권위 있는 현대성 · 신뢰와 선명함"], ["editorial", "에디토리얼 · 여백과 대비"], ["technical", "기술적 · 정밀하고 구조적"], ["human", "인간적 · 친근하고 부드럽게"]])}${selectField("위계를 만드는 방식", "typography.hierarchyStyle", [["scaleWeight", "크기와 굵기 대비"], ["scaleSpace", "크기와 여백 대비"], ["weightColor", "굵기와 역할색 대비"], ["editorialContrast", "서체 성격과 크기의 편집적 대비"]])}${selectField("문장 리듬", "typography.rhythm", [["compact", "압축된 정보 리듬"], ["balanced", "균형 잡힌 발표 리듬"], ["airy", "넓은 호흡과 여백"], ["dramatic", "짧고 강한 대비"]])}<label class="cpd-field cpd-span-all"><span>강조 원칙</span><textarea class="cpd-textarea" data-path="typography.emphasisPolicy" maxlength="100">${escapeHtml(get("typography.emphasisPolicy"))}</textarea><small class="cpd-field-note">가장 중요한 대상 한 가지와 강조 방법만 적습니다.</small></label></div>`;
    const advanced = `<details class="cpd-design-advanced" data-design-advanced="typography"${designAdvancedOpen.has("typography") ? " open" : ""}><summary><span>고급 편집</span><small>추천 조합·글꼴·표현 스타일·자간과 행간을 직접 조정</small></summary><div class="cpd-design-advanced-body">${panel("타이포그래피 선택", "빠른 추천, 비주얼 믹서, 직접 설정 중 편한 방법으로 시작하세요.", `${sourceNav}${sourceBody}`)}</div></details>`;
    return `${panel("타이포그래피의 목소리", "글꼴명보다 발표가 어떤 태도로 말하고 무엇을 크게 읽히게 할지를 먼저 정합니다.", voice)}${panel("현재 위계 미리보기", "제목·본문·숫자의 관계가 디자인 의도와 맞는지 확인합니다.", `<div class="cpd-type-overview"><div class="cpd-type-summary"><strong>${escapeHtml(typographySummary())}</strong><span>${get("typography.source") === "visual-mixer" ? "비주얼 믹서 연결" : get("typography.source") === "custom" ? "직접 조정" : "추천 조합"}</span></div>${typographySpecimen()}</div>`)}${advanced}`;
  }

  function componentPresetChoices(kind, presets) {
    const path = `components.${kind}Preset`;
    return `<div class="cpd-component-choices">${Object.entries(presets).map(([key, item]) => `<label class="cpd-component-choice"><input type="radio" name="${path}" data-path="${path}" value="${key}"${get(path) === key ? " checked" : ""}><strong>${item.label}</strong><small>${item.help}</small></label>`).join("")}<label class="cpd-component-choice"><input type="radio" name="${path}" data-path="${path}" value="custom"${get(path) === "custom" ? " checked" : ""}><strong>직접 설정</strong><small>세부 항목을 하나씩 조정</small></label></div>`;
  }

  function componentPreview(kind) {
    if (kind === "card") return `<div class="cpd-component-preview card-preview preset-${get("components.cardPreset")}" aria-label="현재 카드 표현 미리보기"><div><strong>핵심 내용</strong><span></span><span class="short"></span></div><div><strong>주요 수치</strong><b>72%</b></div></div>`;
    if (kind === "table") return `<div class="cpd-component-preview table-preview preset-${get("components.tablePreset")}" aria-label="현재 표 표현 미리보기"><div class="head"><b>항목</b><b>결과</b></div><div><span>계획</span><strong>82</strong></div><div><span>실적</span><strong>76</strong></div></div>`;
    return `<div class="cpd-component-preview chart-preview preset-${get("components.chartPreset")}" aria-label="현재 차트 표현 미리보기"><div><span style="height:42%"></span><span style="height:68%"></span><span style="height:88%"></span><span style="height:58%"></span></div><small>핵심값 중심 비교</small></div>`;
  }

  function componentBlock(kind, title, help, presets, advancedBody) {
    const enabledPath = `components.${kind}Enabled`;
    const enabled = get(enabledPath) !== false;
    const preset = get(`components.${kind}Preset`);
    return `<section class="cpd-component-block${enabled ? " active" : " disabled"}"><div class="cpd-component-head"><div><h4>${title}</h4><p>${help}</p></div><label class="cpd-component-switch"><input type="checkbox" data-path="${enabledPath}" aria-label="${title} 설정 사용"${enabled ? " checked" : ""}><span>${enabled ? "설정" : "비설정"}</span></label></div>${enabled ? `<div class="cpd-component-main"><div><div class="cpd-group-label">표현 방식</div>${componentPresetChoices(kind, presets)}</div>${componentPreview(kind)}</div><details class="cpd-component-advanced"${preset === "custom" ? " open" : ""}><summary>세부 조정 <small>필요한 경우에만 펼치기</small></summary><div class="cpd-component-advanced-body">${advancedBody}</div></details>` : `<div class="cpd-component-off-note">이 항목은 프롬프트에 포함하지 않습니다. 기존 세부 값은 보존됩니다.</div>`}</section>`;
  }

  function renderComponents() {
    const summary = componentSummary();
    const profiles = `<div class="cpd-component-profiles">${Object.entries(COMPONENT_PROFILES).map(([key, item]) => `<button type="button" class="cpd-component-profile${get("components.profile") === key ? " active" : ""}" data-component-profile="${key}"><strong>${item.label}${key === "report" ? " · 추천" : ""}</strong><small>${item.help}</small></button>`).join("")}</div>`;
    const cardAdvanced = `<div class="cpd-form-grid three">${selectField("카드 배경", "components.cardBackground", [["none", "배경 없음"], ["surface", "밝은 카드 배경"], ["tint", "대표색을 옅게 사용"]])}${selectField("테두리", "components.cardBorder", [["none", "없음"], ["subtle", "가느다란 선"], ["strong", "뚜렷한 선"]])}${selectField("모서리", "components.cardCorner", [["square", "각지게"], ["small", "조금 둥글게"], ["medium", "적당히 둥글게"], ["round", "많이 둥글게"]])}${selectField("그림자", "components.cardShadow", [["none", "없음"], ["subtle", "은은하게"], ["medium", "보통"]])}${selectField("카드 안쪽 여백", "components.cardPadding", [["compact", "촘촘하게"], ["standard", "보통"], ["wide", "여유 있게"]])}</div>`;
    const tableAdvanced = `<div class="cpd-form-grid">${selectField("표 제목행", "components.tableHeader", [["plain", "색상 없이"], ["primaryTint", "대표색을 옅게"], ["primary", "대표색으로 선명하게"]])}${selectField("행 간격", "components.tableDensity", [["compact", "촘촘하게"], ["standard", "보통"], ["airy", "여유 있게"]])}<div class="cpd-span-all cpd-checks">${check("행 구분선 표시", "components.tableRowDividers", "각 행을 쉽게 구분합니다.")}${check("세로선도 표시", "components.tableVerticalLines", "열 구분이 꼭 필요한 표에만 권장합니다.")}</div></div>`;
    const chartAdvanced = `<div class="cpd-form-grid">${selectField("차트 기준선", "components.chartAxes", [["none", "보이지 않게"], ["minimal", "필요한 선만"], ["clear", "명확하게"]])}${selectField("배경 격자선", "components.chartGrid", [["none", "없음"], ["minimal", "최소한만"], ["regular", "표준"]])}${selectField("항목 설명", "components.chartLegend", [["none", "사용 안 함"], ["whenNeeded", "필요할 때만"], ["always", "항상 표시"]])}${selectField("수치 표시", "components.chartLabels", [["none", "사용 안 함"], ["keyOnly", "핵심값만"], ["all", "모든 값"]])}<div class="cpd-span-all cpd-checks">${check("3D 차트 사용 금지", "components.forbid3dCharts")}${check("불필요한 항목 설명 금지", "components.forbidUnneededLegends")}${check("사진과 차트 겹침 금지", "components.forbidPhotoChartOverlap")}</div></div>`;
    return `${panel("빠른 추천", "먼저 전체 방향을 고르세요. 이후 카드·표·차트를 각각 끄거나 세부 조정할 수 있습니다.", `${profiles}<div class="cpd-component-summary"><strong>현재 설정</strong><span>${escapeHtml(summary)}</span></div>`)}<div class="cpd-component-blocks">${componentBlock("card", "카드", "내용을 묶어 보여주는 정보 상자입니다. 개수와 배치는 개별 슬라이드가 결정합니다.", CARD_PRESETS, cardAdvanced)}${componentBlock("table", "표", "행과 열로 수치나 항목을 비교할 때의 공통 표현만 정합니다.", TABLE_PRESETS, tableAdvanced)}${componentBlock("chart", "차트", "차트 종류와 실제 데이터는 지정하지 않고 읽기 방식만 정합니다.", CHART_PRESETS, chartAdvanced)}</div>`;
  }

  function imagerySummary() {
    const icon = get("imagery.iconEnabled") !== false
      ? label("imagery.iconStyle", { line: "라인 아이콘", solid: "채움 아이콘", geometric: "기하학 아이콘", "3d": "3D 아이콘", none: "아이콘 미사용" })
      : "아이콘 미사용";
    const image = get("imagery.imageEnabled") !== false
      ? label("imagery.imageStyle", { photo: "실사 이미지", "3d": "3D 렌더", vector: "벡터 일러스트", isometric: "아이소메트릭", none: "이미지 미사용", conditional: "필요할 때만 이미지" })
      : "이미지 미사용";
    const composite = photoCompositeActive() ? ` · ${photoCompositeSummary()}` : "";
    return `${icon} · ${image}${composite}`;
  }

  function photoCompositeActive() {
    return get("imagery.photoCompositeMode") !== "off";
  }

  function photoCompositeTargetLabel(value) {
    return ({ background: "저채도 배경", card: "정보 카드 주변", accent: "포인트 보조 컷", hero: "대형 히어로 영역", none: "보조 위치 없음" })[value] || "위치 미지정";
  }

  function photoCompositeSummary() {
    if (!photoCompositeActive()) return "실사 합성 미사용";
    const mode = label("imagery.photoCompositeMode", { conditional: "필요할 때만", preferred: "우선 적용", enabled: "필수 적용" });
    const primary = photoCompositeTargetLabel(get("imagery.photoCompositePrimary"));
    const secondary = get("imagery.photoCompositeSecondary") !== "none" ? ` + ${photoCompositeTargetLabel(get("imagery.photoCompositeSecondary"))}` : "";
    return `실사 ${mode} · ${primary}${secondary}`;
  }

  function renderPhotoComposite() {
    const active = photoCompositeActive();
    const primary = get("imagery.photoCompositePrimary");
    const secondary = get("imagery.photoCompositeSecondary");
    const usesCard = primary === "card" || secondary === "card";
    const modeChoices = radioChoices("실사 사진을 어떻게 사용할까요?", "imagery.photoCompositeMode", [
      ["off", "사용 안 함", "그래픽·아이콘 중심으로 구성합니다."],
      ["conditional", "필요할 때만 · 추천", "개별 명세에 사진 대상이 있을 때만 적용합니다."],
      ["preferred", "우선 적용", "피사체가 없으면 내용에서 안전한 맥락 장면을 찾아 우선 사용합니다."],
      ["enabled", "필수 적용", "특별히 제외한 슬라이드가 아니면 관련 실사를 최소 1개 반드시 사용합니다."],
    ], "four");
    if (!active) return `<section class="cpd-photo-composite disabled">${modeChoices}<div class="cpd-component-off-note">실사 합성 위치와 관련 지시는 프롬프트에서 제외합니다.</div></section>`;
    const targetOptions = [["background", "저채도 배경"], ["card", "정보 카드 주변"], ["accent", "포인트 보조 컷"], ["hero", "대형 히어로 영역"]];
    const secondaryOptions = [["none", "사용하지 않음"], ...targetOptions];
    return `<section class="cpd-photo-composite active">
      ${modeChoices}
      <div class="cpd-photo-composite-current"><div><small>현재 적용 계획</small><strong>${escapeHtml(photoCompositeSummary())}</strong></div><span>최대 ${get("imagery.photoCompositeMaxZones")}개 영역 · ${get("imagery.photoCompositeMaxAreaPercent")}% 이내</span></div>
      <div class="cpd-form-grid cpd-photo-target-grid">
        ${selectField("주 적용 위치", "imagery.photoCompositePrimary", targetOptions)}
        ${selectField("보조 적용 위치", "imagery.photoCompositeSecondary", secondaryOptions)}
        ${selectField("한 슬라이드 최대 적용 영역", "imagery.photoCompositeMaxZones", [[1, "1개 · 가장 안전"], [2, "2개 · 주 위치 + 보조 위치"]])}
        ${usesCard ? selectField("카드 주변 세부 위치", "imagery.photoCompositeCardPlacement", [["inside", "카드 내부"], ["side", "카드 옆"], ["corner", "카드 코너"]]) : ""}
        ${rangeField("실사 최대 점유율", "imagery.photoCompositeMaxAreaPercent", 15, 45)}
      </div>
      <div class="cpd-photo-composite-rules"><strong>자동 가독성 보호</strong><div class="cpd-checks">${check("정보가 많으면 보조 실사 생략", "imagery.photoCompositeDropWhenDense", "텍스트·수치가 많으면 사진보다 정보 전달을 우선합니다.")}${check("표·차트와 겹침 금지", "imagery.photoCompositeProtectData", "데이터 영역은 단순한 배경으로 보호합니다.")}${check("원근·조명·그림자 일관성 유지", "imagery.photoCompositeRealism", "합성 티가 나지 않도록 사진과 화면의 시각 조건을 맞춥니다.")}</div></div>
    </section>`;
  }

  function imageryPurposeSummary(kind) {
    if (kind === "icon") return label("imagery.iconPurpose", { structure: "항목 구분", process: "절차 안내", highlight: "핵심 포인트", none: "미사용" });
    return label("imagery.imagePurpose", { whenNeeded: "명세에 필요할 때만", explain: "이해를 돕는 설명", concept: "개념·구조 시각화", evidence: "현장·사례 근거", none: "미사용" });
  }

  function imageryPolicyBlock(kind) {
    const icon = kind === "icon";
    const enabledPath = `imagery.${kind}Enabled`;
    const enabled = get(enabledPath) !== false;
    const title = icon ? "아이콘" : "이미지";
    const help = icon ? "정보를 대신하지 않고 항목과 흐름을 빠르게 구분합니다." : "개별 슬라이드 명세에 주제나 필요성이 있을 때만 사용합니다.";
    const controls = icon
      ? `${selectField("아이콘을 어디에 사용할까요?", "imagery.iconPurpose", [["structure", "항목 구분"], ["process", "절차·단계 안내"], ["highlight", "핵심 포인트 강조"], ["none", "사용하지 않음"]])}${selectField("아이콘 표현 방식", "imagery.iconStyle", [["line", "가벼운 라인형"], ["solid", "선명한 채움형"], ["geometric", "정돈된 기하학형"], ["3d", "입체적인 3D형"], ["none", "사용하지 않음"]])}`
      : `${selectField("이미지를 왜 사용할까요?", "imagery.imagePurpose", [["whenNeeded", "명세에 필요할 때만"], ["explain", "내용 이해를 돕기 위해"], ["concept", "개념·구조를 설명하기 위해"], ["evidence", "현장·제품·사례를 보여주기 위해"], ["none", "사용하지 않음"]])}${selectField("이미지 표현 방식", "imagery.imageStyle", [["conditional", "내용에 맞춰 판단"], ["photo", "실사 사진"], ["vector", "벡터 일러스트"], ["3d", "3D 렌더"], ["isometric", "아이소메트릭"], ["none", "사용하지 않음"]])}`;
    return `<section class="cpd-imagery-block${enabled ? " active" : " disabled"}"><div class="cpd-imagery-block-head"><div><h4>${title}</h4><p>${help}</p></div><label class="cpd-component-switch"><input type="checkbox" data-path="${enabledPath}" aria-label="${title} 설정 사용"${enabled ? " checked" : ""}><span>${enabled ? "사용" : "미사용"}</span></label></div>${enabled ? `<div class="cpd-imagery-block-body"><div class="cpd-form-grid">${controls}</div><div class="cpd-imagery-policy"><small>현재 역할</small><strong>${escapeHtml(imageryPurposeSummary(kind))}</strong><span>${icon ? "한 가지 아이콘 계열로 통일" : "주제·장면은 개별 명세에서만 결정"}</span></div></div>` : `<div class="cpd-component-off-note">${title} 관련 지시는 프롬프트에서 제외하고, 사용하지 않는다는 원칙만 전달합니다.</div>`}</section>`;
  }

  function renderImagery() {
    const activeProfile = get("imagery.profile");
    const medium = get("visualDirection.mediumNameKo");
    return `${panel("현재 이미지·아이콘 사용 방식", "시각자료를 얼마나, 어떤 역할로 사용할지 먼저 확인합니다.", `<div class="cpd-imagery-summary"><div><small>현재 설정</small><strong>${escapeHtml(imagerySummary())}</strong><span>${get("imagery.source") === "custom" ? "직접 조정" : `${IMAGERY_PROFILES[activeProfile]?.label || "사용자 설정"} 조합`}</span></div><div class="cpd-imagery-summary-rules"><span>주제 임의 생성 금지</span>${get("imagery.forbidImportantTextOnImages") ? "<span>중요 텍스트 보호</span>" : ""}${get("imagery.avoidRepeatedVisuals") ? "<span>중복 시각자료 방지</span>" : ""}${get("imagery.requireContentPurpose") ? "<span>설명 목적 필수</span>" : ""}</div></div>`)}
    ${panel("빠른 추천", "발표자료 성격을 고르면 이미지와 아이콘의 사용 여부, 역할과 표현 방식을 함께 맞춥니다.", `<div class="cpd-imagery-profile-grid">${Object.entries(IMAGERY_PROFILES).map(([key, profile]) => `<button type="button" class="cpd-imagery-profile${activeProfile === key && get("imagery.source") !== "custom" ? " selected" : ""}" data-imagery-profile="${key}" aria-pressed="${activeProfile === key}"><span><strong>${profile.label}</strong><small>${profile.help}</small></span><em>${profile.note}</em><b>${profile.values.iconEnabled ? labelValue(profile.values.iconStyle, { line: "라인", solid: "채움", geometric: "기하학", "3d": "3D" }) + " 아이콘" : "아이콘 없음"} · ${profile.values.imageEnabled ? labelValue(profile.values.imageStyle, { conditional: "선택적 이미지", photo: "실사", vector: "벡터", "3d": "3D", isometric: "아이소메트릭" }) : "이미지 없음"}</b></button>`).join("")}</div>`)}
    ${panel("이미지와 아이콘 개별 설정", "둘 중 하나만 사용하거나 각각 다른 역할을 줄 수 있습니다.", `<div class="cpd-imagery-blocks">${imageryPolicyBlock("icon")}${imageryPolicyBlock("image")}</div>${medium && get("imagery.imageEnabled") !== false ? `<label class="cpd-scope-option cpd-imagery-medium"><input type="checkbox" data-path="imagery.followVisualDirection"${get("imagery.followVisualDirection") ? " checked" : ""}><span><strong>디자인 방향의 ‘${escapeHtml(medium)}’ 화풍을 이미지에 연결</strong><small>주제·색상·구도는 가져오지 않고 표현 기법만 이미지에 반영합니다.</small></span></label>` : ""}`)}
    ${panel("실사 합성", "실사를 쓸지와 허용 위치만 정합니다. 실제 사진 주제와 최종 배치는 개별 슬라이드 명세가 결정합니다.", renderPhotoComposite())}
    ${panel("이미지 안전 규칙", "중복·장식·텍스트 가림을 방지합니다.", `<div class="cpd-checks">${check("모든 시각자료에 설명 목적 요구", "imagery.requireContentPurpose", "내용 이해에 기여하지 않는 이미지는 만들지 않습니다.")}${check("비슷한 이미지·아이콘 반복 금지", "imagery.avoidRepeatedVisuals", "같은 의미의 시각자료가 중복되는 것을 방지합니다.")}${check("한 슬라이드의 복수 이미지 스타일 허용", "imagery.allowMixedStyles", "특별한 이유가 없다면 끄는 것을 권장합니다.")}${check("장식 목적 이미지 금지", "imagery.forbidDecorativeOnlyImages")}${check("이미지 위 중요 텍스트 금지", "imagery.forbidImportantTextOnImages")}${check("실제 로고·상표 임의 생성 금지", "imagery.forbidGeneratedLogos")}</div>`)}`;
  }

  function isPhotoCompositeActive() {
    return get("photoComposite.mode") !== "off";
  }

  function isAnyPhotographyActive() {
    return (isSectionEnabled("background") && isBackgroundPhotoActive())
      || (isSectionEnabled("photoComposite") && isPhotoCompositeActive());
  }

  function photoPolicyLevel() {
    const modes = [get("photoComposite.mode"), get("background.photoMode")];
    if (modes.includes("preferred")) return "preferred";
    if (modes.includes("conditional")) return "conditional";
    return "off";
  }

  function photoPolicyScope() {
    const content = isPhotoCompositeActive();
    const background = isBackgroundPhotoActive();
    if (content && background) return "both";
    if (background) return "background";
    if (content) return "content";
    return "none";
  }

  function syncPhotographyState() {
    const contentActive = get("photoComposite.mode") !== "off";
    const backgroundActive = get("background.photoMode") !== "off";
    const activeModes = [get("photoComposite.mode"), get("background.photoMode")].filter((mode) => mode !== "off");
    const unifiedLevel = activeModes.some((mode) => ["preferred", "required"].includes(mode)) ? "preferred" : "conditional";
    if (contentActive) state.photoComposite.mode = unifiedLevel;
    if (backgroundActive) state.background.photoMode = unifiedLevel;
    const photographyActive = contentActive || backgroundActive;
    state.composition.allowPhotography = photographyActive;
    if (!photographyActive) {
      if (state.composition.primaryVisualLanguage === "photo") state.composition.primaryVisualLanguage = "adaptive";
      if (state.composition.secondaryVisualLanguage === "photo") state.composition.secondaryVisualLanguage = "none";
    }
  }

  function setPhotoPolicyState(level, scope) {
    const normalizedLevel = ["conditional", "preferred"].includes(level) ? level : "off";
    const normalizedScope = ["content", "background", "both"].includes(scope) ? scope : "content";
    state.photoComposite.mode = normalizedLevel === "off" || normalizedScope === "background" ? "off" : normalizedLevel;
    state.background.photoMode = normalizedLevel === "off" || normalizedScope === "content" ? "off" : normalizedLevel;
    syncPhotographyState();
  }

  function renderPhotoPolicy() {
    const level = photoPolicyLevel();
    const scope = photoPolicyScope();
    const levels = [["off", "언급 안 함", "사진 관련 공통 지시를 넣지 않음"], ["conditional", "근거가 있을 때", "개별 명세에 사진 대상이 있을 때만 검토"], ["preferred", "적극 검토", "사진이 설득력을 높이면 우선 후보로 검토"]];
    const scopes = [["content", "콘텐츠 영역", "본문·히어로·보조 컷"], ["background", "캔버스 배경", "텍스트 뒤의 장면·표면"], ["both", "둘 다", "콘텐츠와 배경을 각각 필요할 때 검토"]];
    return panel("사진 정책", "가용성과 적용 범위를 두 축으로 한 번씩 정하면 콘텐츠 사진과 배경 사진에 일관되게 반영됩니다.", `<div class="cpd-photo-policy"><fieldset><legend>사진을 어느 수준으로 검토할까요?</legend><div role="radiogroup">${levels.map(([value, title, help]) => `<button type="button" role="radio" class="cpd-photo-policy-choice${level === value ? " selected" : ""}" data-photo-policy-level="${value}" aria-checked="${level === value}"><strong>${title}</strong><small>${help}</small></button>`).join("")}</div></fieldset><fieldset${level === "off" ? " disabled" : ""}><legend>사진을 어디에 적용할까요?</legend><div role="radiogroup">${scopes.map(([value, title, help]) => `<button type="button" role="radio" class="cpd-photo-policy-choice${scope === value ? " selected" : ""}" data-photo-policy-scope="${value}" aria-checked="${scope === value}"${level === "off" ? " disabled" : ""}><strong>${title}</strong><small>${help}</small></button>`).join("")}</div></fieldset></div>`);
  }

  function photoCompositeLabel(value) {
    return ({ accent: "포인트 보조 컷", card: "카드·섹션 보조 영역", hero: "대형 히어로 영역", none: "보조 위치 없음" })[value] || "위치 미지정";
  }

  function photoCompositeModeGuide() {
    const guides = {
      off: ["관련 문장 생략", "콘텐츠 사진에 대한 안내를 프롬프트에 추가하지 않습니다."],
      conditional: ["선택 자원", "슬라이드 MD에 사진 대상이나 시각 증거가 있을 때 AI가 필요성을 판단합니다."],
      preferred: ["적극 활용 가능", "사진이 설득력과 맥락 이해를 높인다고 판단되면 AI가 우선 후보로 검토합니다."],
    };
    return guides[get("photoComposite.mode")] || guides.conditional;
  }

  function renderPhotoCompositeModeChoices() {
    return choiceAxis("photoComposite.mode");
  }

  function photoCompositeStateSummary() {
    if (!isPhotoCompositeActive()) return "콘텐츠 사진 활용 범위에서 제외";
    const mode = label("photoComposite.mode", { conditional: "선택 자원", preferred: "적극 활용 가능" });
    const style = label("photoComposite.style", { adaptive: "내용별 최적 표현", natural: "자연스러운 실사", editorial: "에디토리얼", technical: "기술·산업" });
    return `${mode} · ${style} · 최종 배치는 AI 판단`;
  }

  function renderPhotoCompositeSettings() {
    const active = isPhotoCompositeActive();
    const [modeTitle, modeHelp] = photoCompositeModeGuide();
    const modeGuide = `<div class="cpd-photo-mode-guide"><span>현재 동작</span><div><strong>${escapeHtml(modeTitle)}</strong><small>${escapeHtml(modeHelp)}</small></div></div>`;
    const role = clickChoiceGroup("시각자료가 맡을 가장 중요한 임무는 무엇인가요?", "photoComposite.visualRole", [["evidence", "증거", "사실·제품·성과가 실제임을 보여줌"], ["explanation", "설명", "과정·구조·관계를 이해시킴"], ["context", "맥락", "장소·산업·사용 장면을 알려줌"], ["concept", "개념", "추상 아이디어를 시각 은유로 번역"], ["atmosphere", "분위기", "감정과 첫인상을 형성"]], "cpd-five-options");
    const layer = clickChoiceGroup("여러 매체는 어떤 관계로 연결할까요?", "photoComposite.layerLogic", [["contextEvidenceAnnotation", "맥락 → 증거 → 주석", "장면 위에 근거와 설명을 순서대로 연결"], ["heroData", "히어로 → 데이터", "대표 이미지 위에 지표를 결합"], ["diagramObject", "구조 → 대상", "다이어그램과 실사·3D 대상을 연결"], ["editorialCollage", "의미 단위 콜라주", "관련 근거를 편집적으로 병치"], ["adaptive", "목적별 최적 관계", "슬라이드 목적을 읽고 AI가 한 방식을 선택"]], "cpd-five-options");
    const blend = clickChoiceGroup("서로 다른 화풍은 어떻게 조율할까요?", "photoComposite.styleBlend", [["controlledHybrid", "고유성 보존", "매체별 질감을 살리며 절제해 결합"], ["unifiedMaterial", "공통 재질", "하나의 표면감으로 느슨하게 통일"], ["contrastMedia", "의도적 대비", "실사와 그래픽의 차이를 강조"], ["adaptive", "내용별 강도", "내용에 맞춰 결합 강도를 선택"]]);
    const language = `<div class="cpd-click-question-list">${role}${layer}${blend}</div><div class="cpd-inline-note"><strong>한 질문에 하나의 기준만 선택합니다.</strong> 실제 이미지 주제와 페이지별 배치는 개별 슬라이드 명세가 담당하고, 여기서는 덱 전체에서 반복할 관계만 정합니다.</div>`;
    const resourceItems = [
      ["allowDataVisualization", "데이터 시각화"], ["allowDiagram", "다이어그램"], ["allowPictogram", "픽토그램"], ["allowInfographic", "인포그래픽"], ["allowMap", "지도·공간 정보"], ["allowIllustration", "일러스트레이션"], ["allowTechnical3d", "기술 3D"], ["allowLayeredComposition", "다중 레이어"], ["allowTypographicFocus", "타이포 중심"],
    ];
    const visualLanguages = [["adaptive", "슬라이드 목적에 따라 선택"], ["data", "데이터 시각화"], ["diagram", "다이어그램·관계도"], ["photo", "실사·현장 이미지"], ["typography", "타이포그래피 중심"], ["illustration", "일러스트레이션"], ["technical3d", "기술 3D"], ["map", "지도·공간 정보"]].filter(([value]) => value !== "photo" || photoPolicyLevel() !== "off");
    const resourceScope = `<div class="cpd-form-grid">${selectField("주 시각 언어", "composition.primaryVisualLanguage", visualLanguages)}${selectField("보조 시각 언어", "composition.secondaryVisualLanguage", [["none", "지정하지 않음"], ["adaptive", "필요할 때 AI가 선택"], ...visualLanguages.slice(1)])}<label class="cpd-field cpd-span-all"><span>두 언어를 결합하는 원칙</span><textarea class="cpd-textarea" data-path="composition.combinationPrinciple" maxlength="140">${escapeHtml(get("composition.combinationPrinciple"))}</textarea><small class="cpd-field-note">주 언어와 다른 보조 언어가 실제로 필요할 때만 결합합니다.</small></label></div><div class="cpd-inline-note"><strong>실사·현장 사진의 가용성은 위 사진 정책이 관리합니다.</strong> 여기서는 그 밖의 시각 자원만 추가로 검토합니다.</div><div class="cpd-group-label">공통 프롬프트에서 검토할 자원</div><div class="cpd-checks cpd-resource-checks">${resourceItems.map(([key, title]) => check(title, `composition.${key}`, "선택하지 않으면 금지하지 않고 공통 가이드에서만 언급을 생략합니다.")).join("")}</div>`;
    const controls = `<div class="cpd-form-grid">${selectField("허용 표현 성격", "photoComposite.style", [["adaptive", "내용에 맞춰 최적 표현 선택"], ["natural", "자연스러운 현장 실사"], ["editorial", "에디토리얼 사진"], ["technical", "기술·산업 이미지"]])}<div class="cpd-span-all cpd-checks">${check("구체적 대상이 없으면 일반 맥락 장면 활용", "photoComposite.allowContextScene", "스킬이 전달한 의미에서 직접 도출되는 일반 장면을 활용할 수 있습니다.")}${check("도움이 없으면 사진 생략", "photoComposite.dropWhenDense", "정보량이 많거나 다른 표현이 더 효과적이면 사진을 사용하지 않습니다.")}${check("사실적인 원근·조명 유지", "photoComposite.realism", "AI가 배치 방식을 정하되 합성의 물리적 일관성은 유지합니다.")}</div></div>`;
    const advancedBody = `${panel("시각 자원 범위", "가능한 자원만 고릅니다. 실제 사용 여부는 슬라이드 목적과 증거에 따라 결정됩니다.", resourceScope)}${panel("콘텐츠 사진 상태", "사진 정책에서 정한 가용성과 적용 범위가 본문·히어로 사진에 반영된 결과입니다.", modeGuide)}${active ? panel("콘텐츠 사진 표현", "실제 피사체와 의미는 스킬 명세가 제공하고, 크롭·배치·크기·레이어는 AI가 결정합니다.", controls) : '<div class="cpd-photo-disabled-note"><strong>콘텐츠 사진 문장을 추가하지 않습니다.</strong><span>사진 정책이 배경 전용이거나 언급 안 함으로 설정되어 있습니다.</span></div>'}`;
    return `<div class="cpd-photo-composite${active ? " active" : " disabled"}">${panel("시각자료의 역할과 관계", "역할·레이어 관계·화풍 조율을 서로 다른 축으로 한 번씩 정합니다.", language)}<details class="cpd-design-advanced" data-design-advanced="photoComposite"${designAdvancedOpen.has("photoComposite") ? " open" : ""}><summary><span>매체 고급 편집</span><small>자원 범위와 콘텐츠 사진 가용성 조정</small></summary><div class="cpd-design-advanced-body">${advancedBody}</div></details></div>`;
  }

  function renderQuality() {
    return panel("가독성과 품질 기준", "개별 슬라이드 콘텐츠를 정확히 보존하고 완성 화면을 선명하게 마감합니다.", `<div class="cpd-form-grid">${selectField("대비 기준", "quality.wcagLevel", [["AA", "WCAG AA"], ["AAA", "WCAG AAA"]])}<div class="cpd-span-all cpd-checks">${check("프로젝터 환경 대비 확보", "quality.projectorContrast")}${check("사용자 제공 문구 정확히 보존", "quality.preserveExactText")}${check("수치·단위·날짜 정확히 보존", "quality.preserveNumbers")}${check("발표 거리에서 읽기 쉽게", "quality.readableAtDistance")}${check("한글 글리프 정확히 렌더링", "quality.renderKoreanAccurately")}</div><div class="cpd-span-all cpd-inline-note"><strong>기본 마감</strong> 글자·수치·도형의 가장자리는 선명하게 유지하고, 흐림 효과는 선택한 경우에도 작은 배경 영역에만 적용합니다.</div></div>`);
  }

  function renderConstraints() {
    const items = [["로고는 제공된 실제 자산만 사용", "forbidLogos"], ["완성 화면은 워터마크 없이 출력", "forbidWatermarks"], ["슬라이드 캔버스만 출력", "forbidMockupFrames"], ["슬라이드 외부 기기 프레임 생략", "forbidDeviceBezels"], ["실제 발표 콘텐츠만 화면에 사용", "forbidFakeUI"], ["장식은 의미가 있을 때만 사용", "forbidMeaninglessDecorations"], ["개별 명세의 사실·문구만 사용", "forbidInventedContent"], ["같은 문구는 한 번만 표시", "forbidDuplicateText"], ["정확한 한글 문자 사용", "forbidMalformedKorean"], ["효과보다 선명도와 가독성 우선", "forbidExcessiveEffects"], ["그래픽 요소에 지정 팔레트 사용", "paletteOnlyGraphics"]];
    return panel("추가 품질 보호", "기본 품질 기준 외에 꼭 필요한 조건만 선택합니다. 체크하지 않은 항목은 프롬프트에 언급되지 않습니다.", `<div class="cpd-checks">${items.map(([label, key]) => check(label, `constraints.${key}`, "체크하면 이 긍정형 품질 문장이 프롬프트에 추가됩니다.")).join("")}</div><label class="cpd-field" style="margin-top:14px"><span>직접 추가할 품질 조건</span><textarea class="cpd-textarea" data-path="constraints.customRule" placeholder="예) 실제 기업 로고는 제공된 파일과 동일하게 사용한다.">${escapeHtml(get("constraints.customRule"))}</textarea></label>`);
  }

  function renderIssueItems(issues) {
    if (!issues.length) return '<div class="cpd-issue recommendation">✓ 직접 충돌이 없습니다. 공통 프롬프트를 생성할 수 있습니다.</div>';
    return issues.map((item) => `<div class="cpd-issue ${item.level}"><strong>${item.level === "error" ? "오류" : item.level === "warning" ? "경고" : "권장"}</strong> · ${escapeHtml(item.message)}</div>`).join("");
  }

  function renderPreviewHeader() {
    const height = Math.min(22, Math.max(0, Number(get("frame.headerHeightPercent")) || 0));
    if (!height) return "";
    const density = height <= 7 ? "tight" : height <= 11 ? "compact" : "comfortable";
    const items = commaItems(get("frame.headerElements"));
    const hasPart = items.some((item) => /파트|섹션|section|part/i.test(item));
    const hasSubtitle = items.some((item) => /부제|subtitle/i.test(item));
    const hasPage = items.some((item) => /페이지|page/i.test(item));
    return `<header class="cpd-preview-header type-leftRule align-left density-${density}${hasPart ? " has-section" : ""}${hasSubtitle ? " has-subtitle" : ""}" style="--preview-header-height:${height}%">
      <span class="cpd-preview-header-copy">${hasPart ? '<span class="cpd-preview-kicker">SECTION 01 · 추진 전략</span>' : ""}<strong>사업 추진 전략</strong>${hasSubtitle ? '<em>핵심 목표와 실행 방향</em>' : ""}</span>
      ${hasPage ? '<b class="cpd-preview-page">07</b>' : ""}
      <i class="cpd-preview-header-divider" aria-hidden="true"></i>
    </header>`;
  }

  function renderPreviewFooter() {
    const height = Math.min(15, Math.max(0, Number(get("frame.footerHeightPercent")) || 0));
    if (!height) return "";
    const density = height <= 4 ? "tight" : height <= 7 ? "compact" : "comfortable";
    const items = commaItems(get("frame.footerElements"));
    const hasPage = items.some((item) => /페이지|page/i.test(item));
    const info = items.filter((item) => !/페이지|page/i.test(item)).slice(0, 3).join(" · ");
    return `<footer class="cpd-preview-footer type-source align-left density-${density} with-divider" style="--preview-footer-height:${height}%">
      ${info ? `<span>${escapeHtml(info)}</span>` : ""}${hasPage ? '<b class="cpd-preview-page">07</b>' : ""}
    </footer>`;
  }

  function renderPhotoCompositePreviewZones() {
    if (get("resources.photo") !== "allow") return "";
    return `<span class="cpd-preview-photo-zone target-hero"><b>실사 활용 가능</b><small>${get("resources.layeredComposite") === "allow" ? "사진·데이터 다중 레이어" : "내용에 맞는 맥락 이미지"}</small></span>`;
  }

  function renderPreviewBody() {
    const ko = get("project.promptLanguage") === "ko";
    const cardsEnabled = false;
    const copy = ko ? {
      eyebrow: "STRATEGY OVERVIEW",
      title: "실행 체계와 단계별 추진 방향",
      description: "핵심 목표를 실행 가능한 과제로 구체화합니다.",
      goal: "핵심 목표",
      goalValue: "3대 전략",
      goalNote: "추진 과제 9개",
      target: "완료 목표",
      targetValue: "2027",
      targetNote: "단계별 확산",
      roadmap: "추진 로드맵",
      stages: [["01", "기반 구축", "표준 체계 수립"], ["02", "현장 확산", "핵심 과제 실행"], ["03", "성과 고도화", "지속 운영 전환"]],
    } : {
      eyebrow: "STRATEGY OVERVIEW",
      title: "Execution framework and phased roadmap",
      description: "Translate core goals into actionable workstreams.",
      goal: "Core goal",
      goalValue: "3 strategies",
      goalNote: "9 initiatives",
      target: "Target year",
      targetValue: "2027",
      targetNote: "Phased rollout",
      roadmap: "Roadmap",
      stages: [["01", "Foundation", "Set standards"], ["02", "Expansion", "Execute priorities"], ["03", "Optimization", "Scale outcomes"]],
    };
    return `<div class="cpd-preview-body${cardsEnabled ? " with-cards" : " without-cards"}" aria-hidden="true">
      ${renderPhotoCompositePreviewZones()}
      <section class="cpd-preview-story"><span>${copy.eyebrow}</span><strong>${copy.title}</strong><p>${copy.description}</p><div class="cpd-preview-story-rule"></div></section>
      <section class="cpd-preview-dashboard">
        <article class="cpd-preview-metric featured"><span>${copy.goal}</span><strong>${copy.goalValue}</strong><small>${copy.goalNote}</small></article>
        <article class="cpd-preview-metric"><span>${copy.target}</span><strong>${copy.targetValue}</strong><small>${copy.targetNote}</small></article>
        <article class="cpd-preview-roadmap"><span>${copy.roadmap}</span><ol>${copy.stages.map(([number, title, note]) => `<li><i>${number}</i><b>${title}</b><em>${note}</em></li>`).join("")}</ol></article>
      </section>
    </div>`;
  }

  function activeColorPreview() {
    return colorHoverDraft || colorDraft || null;
  }

  function previewRoleHex(key) {
    if (key === "background" && get("colors.baseCanvas") === "white") return "#FFFFFF";
    return activeColorPreview()?.roles?.[key]?.hex || get(`colors.${key}`);
  }

  function renderResults(issues) {
    const errors = issues.filter((item) => item.level === "error");
    const warnings = issues.filter((item) => item.level === "warning");
    const ratio = getAspectRatio();
    const displayRatio = Math.min(2.4, Math.max(.62, ratio.width / Math.max(1, ratio.height)));
    const previewShape = displayRatio < .9 ? "portrait" : displayRatio > 1.9 ? "panorama" : "landscape";
    const safeArea = get("canvas.safeArea") || {};
    const safeTop = Math.min(20, Math.max(0, Number(safeArea.top) || 0));
    const safeRight = Math.min(20, Math.max(0, Number(safeArea.right) || 0));
    const safeBottom = Math.min(20, Math.max(0, Number(safeArea.bottom) || 0));
    const safeLeft = Math.min(20, Math.max(0, Number(safeArea.left) || 0));
    const headerHeight = Math.min(22, Math.max(0, Number(get("frame.headerHeightPercent")) || 0));
    const footerHeight = Math.min(15, Math.max(0, Number(get("frame.footerHeightPercent")) || 0));
    const bodySafe = Math.min(20, Math.max(0, Number(get("frame.bodySafeMarginPercent")) || 0));
    const radius = "7px";
    const shadow = "none";
    const palettePreview = activeColorPreview();
    const previewStyle = `--cpd-ratio:${displayRatio};--safe-top:${safeTop}%;--safe-right:${safeRight}%;--safe-bottom:${safeBottom}%;--safe-left:${safeLeft}%;--preview-header-height:${headerHeight}%;--preview-footer-height:${footerHeight}%;--body-safe:${bodySafe}%;--preview-primary:${previewRoleHex("primary")};--preview-secondary:${previewRoleHex("secondary")};--preview-accent:${previewRoleHex("accent")};--preview-bg:${previewRoleHex("background")};--preview-surface:${previewRoleHex("surface")};--preview-text:${previewRoleHex("textPrimary")};--preview-border:${previewRoleHex("border")};--card-radius:${radius};--card-shadow:${shadow}`;
    const badgeClass = errors.length ? "error" : warnings.length ? "warning" : "ok";
    const badgeText = errors.length ? `${errors.length} 오류` : warnings.length ? `${warnings.length} 경고` : "정상";
    const promptLength = buildPrompt().length;
    const promptBudget = promptLengthBudget();
    const promptRatio = Math.min(100, Math.round((promptLength / Math.max(1, promptBudget)) * 100));
    const primaryChange = JOURNEY_PROFILE_META[get("journey.profileId")];
    document.getElementById("cpdResults").innerHTML = `
        <div class="cpd-summary-head"><div><span>${palettePreview ? "PALETTE PREVIEW" : "LIVE PREVIEW"}</span><h3>${palettePreview ? escapeHtml(palettePreview.paletteNameKo) : "미리보기"}</h3></div><button type="button" class="cpd-btn" data-action="output-settings">출력 설정</button></div>
        ${renderJourneyStepNavigation(issues, "cpd-summary-journey-steps")}
        <div class="cpd-preview-wrap"><div class="cpd-preview safe shape-${previewShape}" style="${previewStyle}" role="img" aria-label="${escapeHtml(`헤더 ${stepSummary("header")}, 푸터 ${stepSummary("footer")}가 반영된 슬라이드 미리보기`)}">${renderPreviewHeader()}${renderPreviewBody()}${renderPreviewFooter()}</div><p class="cpd-preview-caption">${palettePreview ? `${renderSummaryColorSwatches(palettePreview)}<strong>${escapeHtml(palettePreview.paletteNameKo)}</strong> 적용 전 미리보기입니다. 왼쪽에서 팔레트를 확정할 수 있습니다.` : "헤더·본문·푸터 예약 영역과 본문 안전 여백을 반영한 축소 미리보기입니다. 실제 문구와 페이지별 구성은 개별 슬라이드 명세가 결정합니다."}</p></div>
        <dl class="cpd-summary-list">
          <div class="priority-wide"><dt>1. 규격·예약 영역</dt><dd>${escapeHtml(`${get("canvas.aspectRatio")} · ${get("canvas.width")}×${get("canvas.height")} · 헤더 ${get("frame.headerHeightPercent")}% · 푸터 ${get("frame.footerHeightPercent")}% · 여백 ${get("frame.bodySafeMarginPercent")}%`)}</dd></div>
          <div class="priority-wide"><dt>2. 전체 시각 인상</dt><dd>${escapeHtml(`${selectedSlideStyle() ? `${selectedSlideStyle().nameKo}${isSlideStyleCustomized() ? " · 조정됨" : ""} · ` : ""}공식성 ${get("visualStyle.formality")}/5 · 에너지 ${get("visualStyle.energy")}/5 · 표현 강도 ${get("visualStyle.expression")}/5`)}</dd></div>
          <div class="priority-wide"><dt>3. 팔레트·기본 배경</dt><dd>${renderSummaryColorSwatches(palettePreview)}${escapeHtml(palettePreview?.paletteNameKo || paletteTitle())}${palettePreview ? " · 적용 전 미리보기" : ""} · ${get("colors.baseCanvas") === "white" ? "흰색 기본 배경" : "팔레트 배경"}</dd></div>
          <div class="priority-wide"><dt>4. 글자·정보 강조</dt><dd>${escapeHtml(label("typography.emphasis", { reading: "읽기 우선", balanced: "가독성과 강조의 균형", strong: "제목·핵심 수치 강조" }))}</dd></div>
          <div class="priority-wide"><dt>5. 이미지·그래픽</dt><dd>${escapeHtml(RESOURCE_META.filter(([key]) => get(`resources.${key}`) === "allow").map(([, title]) => title).join(" · ") || "AI가 내용에 맞춰 판단")}</dd></div>
          <div><dt>언어 / 형식</dt><dd>${get("project.promptLanguage") === "ko" ? "국문" : "English"} · ${outputModeLabel(get("project.outputMode"))}</dd></div>
          <div><dt>제작 모델</dt><dd>${MODEL_PROFILES[get("project.targetModel")]?.label || get("project.targetModel")}</dd></div>
        </dl>
        <div class="cpd-prompt-budget-card"><div><small>이미지 생성 프롬프트</small><strong>${promptLength.toLocaleString("ko-KR")}자</strong><span>${promptBudget.toLocaleString("ko-KR")}자 이내로 핵심 디자인 결정만 전달</span></div><em>${promptLength <= promptBudget ? "효율 범위" : "압축 필요"}</em><i style="--cpd-budget:${promptRatio}%"><b></b></i></div>
        <div class="cpd-validation"><div class="cpd-validation-head"><strong>충돌 및 가독성 검사</strong><span class="cpd-badge ${badgeClass}">${badgeText}</span></div><div class="cpd-issues">${renderIssueItems(issues)}</div>${issues.some((item) => item.fix) ? '<button type="button" class="cpd-btn soft" data-action="auto-fix">권장안 적용</button>' : ""}</div>
        <div class="cpd-summary-actions"><button type="button" class="cpd-btn primary" data-action="generate"${errors.length ? " disabled" : ""}>공통 프롬프트 생성</button><button type="button" class="cpd-btn" data-action="send-generator"${errors.length ? " disabled" : ""}>분리기로 바로 보내기</button></div>
        <div class="cpd-summary-reuse"><div><strong>설정 재사용</strong><small>슬라이드 콘텐츠 없이 디자인 설정만 저장하거나 불러옵니다.</small></div><div><button type="button" class="cpd-btn" data-action="export">JSON 저장</button><button type="button" class="cpd-btn" data-action="import">JSON 불러오기</button><button type="button" class="cpd-btn danger" data-action="reset">초기화</button></div></div>`;
  }

  function outputModeLabel(value) {
    return OUTPUT_MODE_PROFILES[value]?.label || value;
  }

  function renderOutputChoiceCards(path, profiles, selected, className, recommendedValue = "") {
    return `<div class="${className}">${Object.entries(profiles).map(([value, item]) => {
      const recommended = value === recommendedValue;
      const actualLength = path === "project.outputMode" ? buildFiveStagePrompt({ outputMode: value }).length : 0;
      const lengthText = actualLength ? `현재 설정 기준 ${actualLength.toLocaleString("ko-KR")}자 · ${item.length}` : item.length;
      return `<label class="cpd-output-choice${selected === value ? " selected" : ""}${recommended ? " recommended" : ""}"><input type="radio" name="${path}" data-path="${path}" value="${value}"${selected === value ? " checked" : ""}><span class="cpd-output-choice-title"><strong>${escapeHtml(item.label)}</strong><span class="cpd-output-choice-badges"><em>${escapeHtml(item.badge)}</em>${recommended ? "<i>권장</i>" : ""}</span></span><small>${escapeHtml(item.help)}</small>${item.note ? `<b>${escapeHtml(item.note)}</b>` : ""}${lengthText ? `<b class="cpd-output-choice-length">${escapeHtml(lengthText)}</b>` : ""}</label>`;
    }).join("")}</div>`;
  }

  const QUICK_SIGNAL_RULES = {
    public: [
      [/공공|공기관|정부|지자체|부처/, 2, "공공·정부 주체"],
      [/정책|행정|지원사업|공익/, 2, "정책·지원사업"],
      [/기관|협회|재단/, 1, "기관 문서"],
    ],
    evaluation: [
      [/공고|모집|접수|신청/, 2, "공고·모집 절차"],
      [/선정|평가|심사|배점/, 2, "선정·평가"],
      [/제안요청|제안서|\bRFP\b/i, 2, "제안 요청"],
    ],
    technology: [
      [/기술|연구|R\s*&\s*D|연구개발/i, 2, "기술·연구개발"],
      [/실증|공정|특허|시제품/, 2, "실증·개발 과정"],
      [/\bAI\b|데이터|플랫폼|시스템/i, 1, "기술 시스템"],
    ],
    education: [
      [/교육|강의|훈련|연수/, 2, "교육·훈련"],
      [/과정|수강|학습|워크숍/, 2, "학습 과정"],
      [/매뉴얼|안내서|가이드/, 1, "안내 자료"],
    ],
    investment: [
      [/투자|투자유치|\bIR\b/i, 2, "투자·IR"],
      [/시장규모|매출|수익|성장률/, 2, "시장·성장 지표"],
      [/기업가치|사업모델|비즈니스 모델/, 2, "사업 가치"],
    ],
    strategy: [
      [/전략|사업계획|추진계획/, 2, "전략·계획"],
      [/성과|실적|목표|지표/, 2, "성과·지표"],
      [/로드맵|단계별|중장기/, 2, "단계·로드맵"],
    ],
  };
  const QUICK_GROUP_META = {
    core: ["핵심 구성", "읽기 방식과 시각적 초점을 결정합니다."],
    frame: ["화면 프레임", "배경과 공통 헤더·푸터를 조정합니다."],
    visual: ["실사 합성", "실사 사용 여부와 안전한 합성 범위를 정합니다."],
  };
  const QUICK_CORE_IDS = ["composition", "colors", "typography"];

  function quickPatternResult(text, pattern, weight, reason) {
    const expression = new RegExp(pattern.source, pattern.flags.replace("g", "") + (pattern.flags.includes("i") ? "" : "i"));
    const match = expression.exec(text);
    if (!match) return null;
    const start = Math.max(0, match.index - 14);
    const end = Math.min(text.length, match.index + match[0].length + 14);
    const context = text.slice(start, end);
    const negated = /(금지|제외|미사용|사용하지|않음|아님|불필요|배제)/.test(context);
    return negated ? null : { weight, reason, match: match[0] };
  }

  function scoreQuickProfiles(text) {
    const details = {};
    Object.entries(QUICK_SIGNAL_RULES).forEach(([key, rules]) => {
      const hits = rules.map(([pattern, weight, reason]) => quickPatternResult(text, pattern, weight, reason)).filter(Boolean);
      details[key] = { score: hits.reduce((sum, hit) => sum + hit.weight, 0), hits };
    });
    return details;
  }

  function quickConfidence(topScore, margin, forcedProfile) {
    if (forcedProfile) return { key: "selected", label: "직접 선택", help: "사용자가 목적 템플릿을 직접 선택했습니다." };
    if (topScore >= 5 && margin >= 2) return { key: "high", label: "높음", help: "주요 신호가 충분하고 다른 유형과 차이가 큽니다." };
    if (topScore >= 4 && margin >= 2) return { key: "medium", label: "중간", help: "유력한 유형이지만 일부 설정은 확인이 필요합니다." };
    return { key: "review", label: "검토 필요", help: "유형 간 점수 차이가 작아 사용자의 판단이 필요합니다." };
  }

  function analyzeQuickStartSource(source, forcedProfile = "") {
    const text = String(source || "").replace(/\s+/g, " ").trim();
    const scoreDetails = scoreQuickProfiles(text);
    const ranked = Object.entries(scoreDetails).sort((a, b) => b[1].score - a[1].score);
    const profileKey = QUICK_START_PROFILES[forcedProfile] ? forcedProfile : (ranked[0]?.[1].score ? ranked[0][0] : "public");
    const topScore = forcedProfile ? 99 : (scoreDetails[profileKey]?.score || 0);
    const runnerUpScore = forcedProfile ? 0 : (ranked.find(([key]) => key !== profileKey)?.[1].score || 0);
    const confidence = quickConfidence(topScore, topScore - runnerUpScore, forcedProfile);
    const profile = QUICK_START_PROFILES[profileKey];
    const secondaryProfiles = ranked
      .filter(([key, detail]) => key !== profileKey && detail.score > 0 && topScore - detail.score <= 2)
      .slice(0, 2)
      .map(([key]) => key);
    const denseHits = text.match(/표|차트|그래프|통계|지표|성과|실적|예산|매출|비율|%|\d[\d,.]*\s*(억|만|천|%|건|명|개)/g) || [];
    const fieldHits = text.match(/현장|사례|제품|시설|장비|공간|행사|인터뷰|방문|사진|실사/g) || [];
    const dense = denseHits.length > 0;
    const field = fieldHits.length > 0 && !/(사진|실사).{0,10}(금지|제외|미사용|사용하지)/.test(text);
    const colorCodes = [...new Set(text.match(/#[0-9a-f]{6}\b/ig) || [])].slice(0, 4);
    const adjusted = { ...profile };
    if (dense) {
      adjusted.composition = "dataFocus";
      if (["public", "evaluation", "strategy"].includes(profileKey)) adjusted.background = "data";
    }
    if (field) {
      adjusted.photoMode = "conditional";
      adjusted.photoRole = "evidence";
    } else if (dense) adjusted.photoMode = "off";
    if (colorCodes.length) adjusted.color = get("colors.preset");
    const profileReasons = scoreDetails[profileKey]?.hits.map((hit) => `${hit.reason}(${hit.match})`) || [];
    const signals = [`주 유형 · ${profile.label}`];
    secondaryProfiles.forEach((key) => signals.push(`보조 성격 · ${QUICK_START_PROFILES[key].label}`));
    if (dense) signals.push(`데이터 신호 ${denseHits.length}개`);
    if (field) signals.push(`현장·실사 신호 ${fieldHits.length}개`);
    if (colorCodes.length) signals.push(`브랜드 색상 ${colorCodes.join(", ")} · 자동 변경 안 함`);
    if (!text && forcedProfile) signals.push("목적 템플릿에서 시작");
    const purposeLabels = { internal: "내부보고", external: "대외발표", evaluation: "선정평가", policy: "정책보고", investment: "투자설명" };
    const commonReason = forcedProfile ? "선택한 목적 템플릿을 기준으로 구성" : (profileReasons.join(" · ") || "뚜렷한 유형 신호가 부족하여 기본값 제안");
    const recommendationDefs = [
      ["project", "프로젝트 용도", "core", get("project.purpose"), adjusted.purpose, purposeLabels[get("project.purpose")], purposeLabels[adjusted.purpose], commonReason, "프롬프트의 발표 목적과 우선순위를 맞춥니다."],
      ["composition", "시각 구성", "core", get("composition.profile"), adjusted.composition, COMPOSITION_PROFILES[get("composition.profile")]?.label || compositionSummary(), COMPOSITION_PROFILES[adjusted.composition]?.label, dense ? "수치·정보 관계 신호 감지" : commonReason, "초점, 크기 대비와 레이아웃 변주 방식을 정렬합니다."],
      ["colors", "색상 시스템", "core", get("colors.preset"), adjusted.color, paletteTitle(), colorCodes.length ? `${paletteTitle()} 유지 · 색상 직접 검토` : COLOR_PRESETS[adjusted.color]?.[0], colorCodes.length ? `원문에서 ${colorCodes.join(", ")} 감지` : commonReason, colorCodes.length ? "브랜드 색상을 자동 덮어쓰지 않습니다." : "주제에 맞는 역할 색상 체계를 적용합니다."],
      ["typography", "타이포그래피", "core", get("typography.presetId"), adjusted.typography, TYPOGRAPHY_PRESETS[get("typography.presetId")]?.label || typographySummary(), TYPOGRAPHY_PRESETS[adjusted.typography]?.label, commonReason, "제목과 본문의 읽기 성격을 맞춥니다."],
      ["background", "배경 시스템", "frame", get("background.profile"), adjusted.background, BACKGROUND_PROFILES[get("background.profile")]?.label || backgroundSummary(), BACKGROUND_PROFILES[adjusted.background]?.label, dense ? "수치·정보 관계 신호 감지" : commonReason, "콘텐츠 가독성과 분위기 강도를 조정합니다."],
      ["header", "헤더 시스템", "frame", get("header.profile"), adjusted.header, HEADER_PROFILES[get("header.profile")]?.label || headerSummary(), HEADER_PROFILES[adjusted.header]?.label, commonReason, "섹션 정보의 반복 위치를 통일합니다."],
      ["footer", "푸터 시스템", "frame", get("footer.profile"), adjusted.footer, FOOTER_PROFILES[get("footer.profile")]?.label || footerSummary(), FOOTER_PROFILES[adjusted.footer]?.label, commonReason, "출처와 페이지 번호의 우선순위를 정합니다."],
      ["photoComposite", "실사 합성", "visual", get("photoComposite.mode"), adjusted.photoMode, photoCompositeStateSummary(), labelValue(adjusted.photoMode, { off: "사용 안 함", conditional: "필요할 때만", preferred: "우선 적용", required: "필수 적용" }), field ? `현장·실사 신호 ${fieldHits.length}개 감지` : dense ? "데이터 중심 자료로 판단" : commonReason, field && dense ? "데이터 영역과 경쟁하지 않는 실사 합성으로 제한합니다." : "실사 사용 여부와 역할만 설정합니다."],
    ];
    const recommendations = recommendationDefs.map(([id, labelText, group, currentValue, nextValue, currentLabel, nextLabel, reason, effect]) => {
      const changed = String(currentValue) !== String(nextValue);
      const factorHigh = (id === "composition" && denseHits.length >= 2) || (id === "photoComposite" && fieldHits.length >= 2);
      const itemConfidence = colorCodes.length && id === "colors" ? "review" : factorHigh ? "high" : confidence.key;
      return {
        id, label: labelText, group, currentValue, nextValue, currentLabel: currentLabel || "직접 설정", nextLabel: nextLabel || "권장 설정",
        reason, effect, changed, confidence: itemConfidence, sectionDisabled: !isSectionEnabled(id),
      };
    });
    const selected = recommendations
      .filter((item) => item.changed && !item.sectionDisabled && ["high", "selected"].includes(item.confidence))
      .map((item) => item.id);
    quickStartDraft = createQuickStartDraft({
      source: text, sourceLength: text.length, profile: profileKey, secondaryProfiles, confidence: confidence.key,
      confidenceLabel: confidence.label, confidenceHelp: confidence.help,
      scores: Object.fromEntries(Object.entries(scoreDetails).map(([key, detail]) => [key, detail.score])),
      signals, factors: { dense, field, brandColors: colorCodes }, recommendations, selected, preserveDisabled: true,
    });
    return quickStartDraft;
  }

  function quickSelectionStats() {
    const currentLength = buildPrompt().length;
    const selectedItems = quickStartDraft.recommendations.filter((item) => quickStartDraft.selected.includes(item.id));
    const delta = selectedItems.reduce((sum, item) => sum + (String(item.nextLabel).length - String(item.currentLabel).length) * 4, 0);
    return { selectedCount: selectedItems.length, currentLength, estimatedLength: Math.max(0, currentLength + delta) };
  }

  function renderQuickComparison() {
    const recommendationMap = Object.fromEntries(quickStartDraft.recommendations.map((item) => [item.id, item]));
    const recommendedPaletteKey = recommendationMap.colors?.nextValue || get("colors.preset");
    const recommendedPalette = COLOR_PRESETS[recommendedPaletteKey]?.[1] || { primary: get("colors.primary"), accent: get("colors.accent"), background: get("colors.background"), surface: get("colors.surface") };
    const preview = (labelText, primary, accent, background, surface, headerText) => `<div class="cpd-quick-preview-card"><span>${labelText}</span><div class="cpd-quick-mini-slide" style="--q-primary:${primary};--q-accent:${accent};--q-bg:${background};--q-surface:${surface}"><i></i><strong>${escapeHtml(headerText)}</strong><b></b><b></b><em></em></div></div>`;
    return `<section class="cpd-quick-comparison"><div class="cpd-quick-comparison-head"><div><h4>적용 전후 미리보기</h4><p>실제 콘텐츠가 아닌 디자인 구조 변화만 보여줍니다.</p></div><span id="cpdQuickLengthEstimate"></span></div><div class="cpd-quick-preview-grid">${preview("현재", get("colors.primary"), get("colors.accent"), get("colors.background"), get("colors.surface"), headerSummary())}${preview("추천", recommendedPalette.primary, recommendedPalette.accent, recommendedPalette.background, recommendedPalette.surface, recommendationMap.header?.nextLabel || headerSummary())}</div></section>`;
  }

  function renderQuickStartDialog() {
    const dialog = document.getElementById("cpdQuickStartDialog");
    if (!dialog) return;
    const hasRecommendations = quickStartDraft.recommendations.length > 0;
    const selectedCount = quickStartDraft.selected.length;
    const profile = QUICK_START_PROFILES[quickStartDraft.profile];
    dialog.innerHTML = `<section class="cpd-dialog wide cpd-quick-dialog" role="dialog" aria-modal="true" aria-labelledby="cpdQuickTitle" aria-describedby="cpdQuickDesc">
      <div class="cpd-dialog-head"><div><span>QUICK START</span><h3 id="cpdQuickTitle">간소화 입력 · 디자인 설정 추천</h3><p id="cpdQuickDesc">자료에서 디자인 판단에 필요한 신호만 찾고, 실제 문구·수치·사실은 공통 프롬프트에 넣지 않습니다.</p></div><button type="button" class="cpd-dialog-close" data-action="cancel-quick-start" aria-label="빠른 시작 닫기">×</button></div>
      <div class="cpd-dialog-body cpd-quick-dialog-body">
        ${hasRecommendations ? `<section class="cpd-quick-result-head"><div><small>분석 결과</small><h4>${escapeHtml(profile?.label || "추천 설정")}${quickStartDraft.secondaryProfiles.length ? `<span> + ${escapeHtml(quickStartDraft.secondaryProfiles.map((key) => QUICK_START_PROFILES[key].label).join(", "))}</span>` : ""}</h4><p>${escapeHtml(profile?.help || "자료 성격에 맞춘 설정입니다.")}</p></div><div class="cpd-quick-confidence ${escapeHtml(quickStartDraft.confidence)}"><small>판단 수준</small><strong>${escapeHtml(quickStartDraft.confidenceLabel)}</strong><span>${escapeHtml(quickStartDraft.confidenceHelp || "")}</span></div><div class="cpd-quick-signal-list">${quickStartDraft.signals.map((signal) => `<span>${escapeHtml(signal)}</span>`).join("")}</div></section>
          <div class="cpd-quick-select-toolbar" aria-label="추천 선택 도구"><div><button type="button" class="cpd-btn soft" data-quick-select="high">높은 확신만</button><button type="button" class="cpd-btn" data-quick-select="core">핵심 디자인만</button><button type="button" class="cpd-btn" data-quick-select="all">전체 선택</button><button type="button" class="cpd-btn" data-quick-select="none">전체 해제</button></div><label><input type="checkbox" data-quick-preserve-disabled${quickStartDraft.preserveDisabled ? " checked" : ""}><span><strong>비설정 항목 유지</strong><small>꺼진 설정을 추천이 자동으로 켜지 않게 합니다.</small></span></label></div>
          <div class="cpd-inline-note"><strong>적용 전 확인:</strong> 이유와 효과를 검토한 뒤 필요한 변경만 선택하세요. 판단 수준이 낮은 추천은 기본 선택하지 않습니다.</div>
          ${renderQuickComparison()}
          <div class="cpd-quick-recommendation-groups">${Object.entries(QUICK_GROUP_META).map(([group, meta]) => { const items = quickStartDraft.recommendations.filter((item) => item.group === group); return `<section class="cpd-quick-recommendation-group"><div><h4>${meta[0]}</h4><p>${meta[1]}</p></div><div class="cpd-quick-recommendations">${items.map((item) => { const blocked = item.sectionDisabled && quickStartDraft.preserveDisabled; const disabled = !item.changed || blocked; return `<label class="cpd-quick-recommendation${item.changed ? "" : " unchanged"}${blocked ? " blocked" : ""}"><input type="checkbox" data-quick-recommendation="${item.id}"${quickStartDraft.selected.includes(item.id) ? " checked" : ""}${disabled ? " disabled" : ""}><span><span class="cpd-quick-rec-title"><strong>${escapeHtml(item.label)}</strong><em class="${escapeHtml(item.confidence)}">${item.confidence === "high" ? "확신 높음" : item.confidence === "selected" ? "직접 선택" : item.confidence === "medium" ? "확신 중간" : "검토 필요"}</em></span><small class="cpd-quick-rec-change">${item.changed ? `${escapeHtml(item.currentLabel)} → ${escapeHtml(item.nextLabel)}` : `${escapeHtml(item.currentLabel)} · 현재 설정과 같음`}</small><small><b>이유</b> ${escapeHtml(item.reason)}</small><small><b>효과</b> ${escapeHtml(item.effect)}</small>${blocked ? '<small class="cpd-quick-rec-blocked">현재 비설정 · 위 보호 옵션을 끄면 선택할 수 있습니다.</small>' : ""}</span></label>`; }).join("")}</div></section>`; }).join("")}</div>` : `<section class="cpd-quick-input"><div class="cpd-quick-input-head"><div><strong>공고문·기획서 내용</strong><small>브라우저 안에서만 분석하며 서버나 설정 파일로 보내지 않습니다.</small></div><button type="button" class="cpd-btn" data-action="clear-quick-source">내용 지우기</button></div><label class="cpd-field"><textarea id="cpdQuickSource" class="cpd-textarea" maxlength="30000" aria-label="공고문·기획서 내용" placeholder="공고문, 사업계획서, 제안요청서 등의 텍스트를 붙여넣으세요.&#10;&#10;예: 공공기관 기술개발 지원사업 선정평가 발표자료…">${escapeHtml(quickStartDraft.source)}</textarea><span class="cpd-quick-source-meta"><small>적용하거나 닫으면 원문을 폐기합니다.</small><b id="cpdQuickSourceCount">${quickStartDraft.source.length.toLocaleString("ko-KR")} / 30,000자</b></span></label><div class="cpd-inline-note"><strong>추출 범위:</strong> 발표 목적, 자료 성격, 정보 밀도, 현장·실사 필요 가능성만 분석합니다. 사업명·금액·날짜·자격조건은 공통 프롬프트에 반영하지 않습니다.</div></section>
          <section class="cpd-quick-template-section"><div><h4>텍스트 없이 목적만 선택</h4><p>자료 유형이 명확하다면 템플릿으로 바로 추천받을 수 있습니다.</p></div><div class="cpd-quick-template-grid">${Object.entries(QUICK_START_PROFILES).map(([key, item]) => `<button type="button" class="cpd-quick-template" data-quick-template="${key}"><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.help)}</small></button>`).join("")}</div></section>`}
      </div>
      <div class="cpd-dialog-actions cpd-quick-dialog-actions">${hasRecommendations ? `<button type="button" class="cpd-btn" data-action="quick-start-back">다시 분석</button><span id="cpdQuickSelectedCount" aria-live="polite">${selectedCount}개 항목 선택</span><button type="button" class="cpd-btn primary" data-action="apply-quick-start"${selectedCount ? "" : " disabled"}>선택한 추천 적용</button>` : `<button type="button" class="cpd-btn" data-action="cancel-quick-start">취소</button><button type="button" class="cpd-btn primary" data-action="analyze-quick-start">디자인 설정 분석</button>`}</div>
    </section>`;
    if (hasRecommendations) syncQuickSelectionControls();
  }

  function applyQuickStartRecommendations() {
    const selected = new Set(quickStartDraft.selected);
    if (!selected.size) { toast("적용할 추천 항목을 선택해주세요."); return; }
    const values = Object.fromEntries(quickStartDraft.recommendations.map((item) => [item.id, item.nextValue]));
    recordHistory();
    if (selected.has("project")) state.project.purpose = values.project;
    if (selected.has("composition") && COMPOSITION_PROFILES[values.composition]) Object.assign(state.composition, clone(COMPOSITION_PROFILES[values.composition].values), { profile: values.composition });
    if (selected.has("colors")) setCommonColorPreset(values.colors);
    if (selected.has("background") && BACKGROUND_PROFILES[values.background]) Object.assign(state.background, clone(BACKGROUND_PROFILES[values.background].values), { source: "common", profile: values.background });
    if (selected.has("header") && HEADER_PROFILES[values.header]) Object.assign(state.header, clone(HEADER_PROFILES[values.header].values), { source: "common", profile: values.header });
    if (selected.has("footer") && FOOTER_PROFILES[values.footer]) Object.assign(state.footer, clone(FOOTER_PROFILES[values.footer].values), { source: "common", profile: values.footer });
    if (selected.has("typography") && TYPOGRAPHY_PRESETS[values.typography]) Object.assign(state.typography, clone(TYPOGRAPHY_PRESETS[values.typography].values), { source: "common", presetId: values.typography, visualTypographyId: "", visualTypographyNameKo: "", visualTypographyNameEn: "", visualTypographyCategory: "", visualTypographyDescription: "", visualTypographyPromptSummary: "", visualTypographyHighRisk: false });
    if (selected.has("photoComposite")) {
      setPhotoPolicyState(values.photoComposite, "content");
      const recommendedRole = quickStartDraft.factors.field ? "evidence" : (QUICK_START_PROFILES[quickStartDraft.profile]?.photoRole || "context");
      state.photoComposite.visualRole = ({ evidence: "evidence", context: "context", hero: "atmosphere" })[recommendedRole] || "context";
    }
    selected.forEach((id) => { if (!quickStartDraft.preserveDisabled && Object.prototype.hasOwnProperty.call(state.sectionEnabled, id)) state.sectionEnabled[id] = true; });
    if (state.header.showPageNumber && state.footer.showPageNumber) state.header.showPageNumber = false;
    state.recommendationMeta = {
      version: 3,
      profile: quickStartDraft.profile,
      secondaryProfiles: clone(quickStartDraft.secondaryProfiles),
      confidence: quickStartDraft.confidence,
      factors: clone(quickStartDraft.factors),
      selected: [...selected],
      appliedAt: new Date().toISOString(),
    };
    quickApplyNotice = { count: selected.size, profile: QUICK_START_PROFILES[quickStartDraft.profile]?.label || "추천 설정" };
    quickStartDraft = createQuickStartDraft();
    quickStartReturnFocus = null;
    closeDialogs();
    expandedSteps.clear();
    refresh({ full: true });
    window.setTimeout(() => document.querySelector("#cpdQuickApplyNotice [data-action=\"undo-quick-apply\"]")?.focus(), 0);
    toast(`${selected.size}개 추천 설정을 적용했습니다.`);
  }

  function renderOutputSettingsDialog() {
    const dialog = document.getElementById("cpdOutputSettingsDialog");
    const model = MODEL_PROFILES[get("project.targetModel")] || MODEL_PROFILES.common;
    const recommendedMode = model.recommendedMode;
    const modeMatches = get("project.outputMode") === recommendedMode;
    const promptLength = buildPrompt().length;
    const maxChars = promptLengthBudget("compact");
    const lengthBudget = promptLengthBudget();
    const lengthRatio = Math.min(100, Math.round((promptLength / Math.max(1, lengthBudget)) * 100));
    const lengthLabel = promptLength <= lengthBudget ? "이미지 생성 적정" : "자동 압축 필요";
    dialog.innerHTML = `<section class="cpd-dialog wide cpd-output-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="cpdOutputSettingsTitle" aria-describedby="cpdOutputSettingsDesc">
      <div class="cpd-dialog-head"><div><span>OUTPUT SETTINGS</span><h3 id="cpdOutputSettingsTitle">출력 설정</h3><p id="cpdOutputSettingsDesc">이미지 생성에는 실전형을 권장합니다. 세부 설정은 저장하되 프롬프트에는 핵심 결정만 전달합니다.</p></div><button type="button" class="cpd-dialog-close" data-action="cancel-output-settings" aria-label="출력 설정 취소하고 닫기">×</button></div>
      <div class="cpd-dialog-body cpd-output-settings-body">
        <section class="cpd-output-section"><div class="cpd-output-section-head"><div><h4>1. 제작 모델</h4><p>같은 설정도 모델에 맞는 실행 계약과 우선순위 문장으로 변환됩니다.</p></div></div>${renderOutputChoiceCards("project.targetModel", MODEL_PROFILES, get("project.targetModel"), "cpd-output-model-grid")}</section>
        <section class="cpd-output-section"><div class="cpd-output-section-head"><div><h4>2. 출력 형식</h4><p>${escapeHtml(model.label)} 이미지 생성에는 <strong>${escapeHtml(outputModeLabel(recommendedMode))}</strong>이 가장 효율적입니다.</p></div>${modeMatches ? '<span class="cpd-output-match ok">현재 권장 설정</span>' : `<button type="button" class="cpd-btn soft cpd-output-recommend-btn" data-action="apply-output-recommendation">${escapeHtml(outputModeLabel(recommendedMode))}으로 변경</button>`}</div>${renderOutputChoiceCards("project.outputMode", OUTPUT_MODE_PROFILES, get("project.outputMode"), "cpd-output-mode-grid", recommendedMode)}${get("project.outputMode") === "detailed" ? '<div class="cpd-inline-note cpd-output-detail-warning"><strong>검토용 출력</strong> 직접 이미지 생성보다 설정 누락을 확인할 때 사용하세요. 생성 시에는 실전형으로 다시 바꾸는 것을 권장합니다.</div>' : ""}</section>
        <section class="cpd-output-section cpd-output-options"><div class="cpd-output-section-head"><div><h4>3. 언어와 길이</h4><p>언어는 프롬프트 명령문의 언어이며, 실제 슬라이드 문구는 개별 명세를 따릅니다.</p></div></div><div class="cpd-form-grid">
          ${selectField("출력 언어", "project.promptLanguage", [["ko", "국문 프롬프트"], ["en", "영문 프롬프트"]])}
          ${get("project.outputMode") === "compact" ? `<label class="cpd-field"><span>최대 글자 수</span><input class="cpd-input" type="number" data-path="project.maxChars" value="${escapeHtml(maxChars)}" min="900" max="1600" step="100"><small class="cpd-field-note">900~1,600자 안에서 우선순위가 낮은 설명을 자동 통합합니다.</small></label><div class="cpd-span-all cpd-output-length-presets">${[1000, 1200, 1400, 1600].map((value) => `<button type="button" class="cpd-btn${maxChars === value ? " soft" : ""}" data-output-max="${value}">${value.toLocaleString("ko-KR")}자</button>`).join("")}</div>` : ""}
          <div class="cpd-span-all cpd-output-budget"><div><small>현재 프롬프트</small><strong>${promptLength.toLocaleString("ko-KR")}자 / ${lengthBudget.toLocaleString("ko-KR")}자</strong><span>${lengthLabel} · 입력한 세부 설정은 JSON에 그대로 보존됩니다.</span></div><em>${lengthRatio}%</em><i style="--cpd-budget:${lengthRatio}%"><b></b></i></div>
        </div></section>
      </div>
      <div class="cpd-dialog-actions cpd-output-dialog-actions"><div class="cpd-output-footer-summary"><small>현재 선택</small><strong>${escapeHtml(model.label)} · ${escapeHtml(outputModeLabel(get("project.outputMode")))} · ${get("project.promptLanguage") === "ko" ? "국문" : "English"}</strong><span>${promptLength.toLocaleString("ko-KR")}자 · ${lengthLabel}</span></div><div class="cpd-output-footer-buttons"><button type="button" class="cpd-btn" data-action="cancel-output-settings">취소</button><button type="button" class="cpd-btn primary" data-action="apply-output-settings">${escapeHtml(model.label)} 설정 적용</button></div></div>
    </section>`;
  }

  function renderPromptDialog() {
    const dialog = document.getElementById("cpdPromptDialog");
    const promptText = state.output.text || buildPrompt();
    const budget = promptLengthBudget();
    dialog.innerHTML = `<section class="cpd-dialog wide" role="dialog" aria-modal="true" aria-labelledby="cpdPromptTitle">
      <div class="cpd-dialog-head"><div><span>SLIDE IMAGE VISUAL SPECIFICATION</span><h3 id="cpdPromptTitle">이미지 생성용 공통 프롬프트가 준비되었습니다</h3><p>5단계 설정을 이미지 모델이 실행할 수 있는 일반 용어로 정리했습니다.</p></div><button type="button" class="cpd-dialog-close" data-action="close-dialog" aria-label="공통 프롬프트 닫기">×</button></div>
      <div class="cpd-dialog-body"><textarea class="cpd-output" id="commonPromptOutput" readonly>${escapeHtml(promptText)}</textarea><div class="cpd-output-meta">${promptText.length.toLocaleString("ko-KR")}자 / ${budget.toLocaleString("ko-KR")}자 · ${outputModeLabel(get("project.outputMode"))} · 실제 콘텐츠는 개별 슬라이드 명세에서만 제공</div></div>
      <div class="cpd-dialog-actions"><button type="button" class="cpd-btn" data-action="close-dialog">닫기</button><button type="button" class="cpd-btn soft" data-action="copy">프롬프트 복사</button><button type="button" class="cpd-btn primary" data-action="send-generator">분리기로 보내기</button></div>
    </section>`;
  }

  function openDialog(id) {
    const dialog = document.getElementById(id);
    if (!dialog) return;
    if (id === "cpdQuickSetupDialog") {
      quickSetupUi.open = true;
      renderQuickSetupDialog();
    }
    if (id === "cpdSlideStyleDialog") {
      slideStyleGalleryOpen = true;
      renderSlideStyleDialog();
    }
    if (id === "cpdOutputSettingsDialog") {
      if (!outputSettingsSnapshot) outputSettingsSnapshot = clone(state.project);
      renderOutputSettingsDialog();
    }
    if (id === "cpdPromptDialog") renderPromptDialog();
    if (id === "cpdQuickStartDialog") renderQuickStartDialog();
    dialog.hidden = false;
    document.body.classList.add("cpd-dialog-open");
    window.setTimeout(() => {
      const preferred = id === "cpdQuickStartDialog"
        ? dialog.querySelector("#cpdQuickSource, [data-quick-template]")
        : id === "cpdQuickSetupDialog"
          ? dialog.querySelector("[data-quick-setup-mode].selected, button")
          : id === "cpdSlideStyleDialog"
            ? dialog.querySelector("[data-slide-style-query], button")
          : dialog.querySelector("button, select, input, textarea");
      preferred?.focus();
    }, 0);
  }

  function closeDialogs() {
    quickSetupUi.open = false;
    slideStyleGalleryOpen = false;
    disconnectSlideStyleAutoLoad();
    root.querySelectorAll(".cpd-dialog-backdrop").forEach((dialog) => { dialog.hidden = true; });
    document.body.classList.remove("cpd-dialog-open");
  }

  function closeQuickSetupModal() {
    const returnFocus = quickSetupReturnFocus;
    quickSetupReturnFocus = null;
    quickSetupUi.open = false;
    const dialog = document.getElementById("cpdQuickSetupDialog");
    if (dialog) {
      dialog.hidden = true;
      dialog.innerHTML = "";
    }
    if (![...root.querySelectorAll(".cpd-dialog-backdrop")].some((item) => !item.hidden)) document.body.classList.remove("cpd-dialog-open");
    window.setTimeout(() => {
      const focusTarget = returnFocus?.isConnected ? returnFocus : root.querySelector('[data-action="open-quick-setup-modal"]');
      focusTarget?.focus({ preventScroll: true });
    }, 0);
  }

  function closeSlideStyleGallery() {
    const returnFocus = slideStyleGalleryReturnFocus;
    slideStyleGalleryReturnFocus = null;
    slideStyleGalleryOpen = false;
    slideStyleGalleryScrollTop = 0;
    disconnectSlideStyleAutoLoad();
    const dialog = document.getElementById("cpdSlideStyleDialog");
    if (dialog) {
      dialog.hidden = true;
      dialog.innerHTML = "";
    }
    if (![...root.querySelectorAll(".cpd-dialog-backdrop")].some((item) => !item.hidden)) document.body.classList.remove("cpd-dialog-open");
    window.setTimeout(() => {
      const focusTarget = returnFocus?.isConnected ? returnFocus : root.querySelector('[data-action="open-slide-style-gallery"]');
      focusTarget?.focus({ preventScroll: true });
    }, 0);
  }

  function cancelQuickStart() {
    const returnFocus = quickStartReturnFocus;
    quickStartDraft = createQuickStartDraft();
    quickStartReturnFocus = null;
    closeDialogs();
    window.setTimeout(() => returnFocus?.isConnected && returnFocus.focus(), 0);
  }

  function syncQuickSelectionControls() {
    const dialog = document.getElementById("cpdQuickStartDialog");
    if (!dialog || dialog.hidden) return;
    const allowed = new Set();
    quickStartDraft.recommendations.forEach((item) => {
      const input = dialog.querySelector(`[data-quick-recommendation="${item.id}"]`);
      if (!input) return;
      const blocked = item.sectionDisabled && quickStartDraft.preserveDisabled;
      input.disabled = !item.changed || blocked;
      if (blocked) quickStartDraft.selected = quickStartDraft.selected.filter((id) => id !== item.id);
      input.checked = quickStartDraft.selected.includes(item.id);
      if (input.checked) allowed.add(item.id);
      input.closest(".cpd-quick-recommendation")?.classList.toggle("blocked", blocked);
    });
    quickStartDraft.selected = [...allowed];
    const stats = quickSelectionStats();
    const count = dialog.querySelector("#cpdQuickSelectedCount");
    const apply = dialog.querySelector('[data-action="apply-quick-start"]');
    const length = dialog.querySelector("#cpdQuickLengthEstimate");
    if (count) count.textContent = `${stats.selectedCount}개 항목 선택`;
    if (apply) apply.disabled = stats.selectedCount === 0;
    if (length) length.textContent = `현재 ${stats.currentLength.toLocaleString("ko-KR")}자 · 적용 후 약 ${stats.estimatedLength.toLocaleString("ko-KR")}자`;
  }

  function selectQuickRecommendations(mode) {
    const available = quickStartDraft.recommendations.filter((item) => item.changed && !(item.sectionDisabled && quickStartDraft.preserveDisabled));
    if (mode === "none") quickStartDraft.selected = [];
    else if (mode === "all") quickStartDraft.selected = available.map((item) => item.id);
    else if (mode === "core") quickStartDraft.selected = available.filter((item) => QUICK_CORE_IDS.includes(item.id)).map((item) => item.id);
    else quickStartDraft.selected = available.filter((item) => ["high", "selected"].includes(item.confidence)).map((item) => item.id);
    syncQuickSelectionControls();
  }

  function renderQuickApplyNotice() {
    const host = document.getElementById("cpdQuickApplyNotice");
    if (!host) return;
    host.innerHTML = quickApplyNotice
      ? `<div class="cpd-quick-apply-notice" role="status"><span><strong>${escapeHtml(quickApplyNotice.profile)}</strong> 추천 ${quickApplyNotice.count}개를 적용했습니다.</span><button type="button" class="cpd-btn soft" data-action="undo-quick-apply">되돌리기</button><button type="button" class="cpd-dialog-close" data-action="dismiss-quick-notice" aria-label="추천 적용 알림 닫기">×</button></div>`
      : "";
  }

  function cancelOutputSettings(showToast = true) {
    if (outputSettingsSnapshot) state.project = clone(outputSettingsSnapshot);
    outputSettingsSnapshot = null;
    closeDialogs();
    refresh({ full: true });
    if (showToast) toast("출력 설정 변경을 취소했습니다.");
  }

  function applyOutputSettings() {
    outputSettingsSnapshot = null;
    closeDialogs();
    refresh({ full: true });
    toast("제작 모델과 출력 형식을 적용했습니다.");
  }

  function hexToRgb(hex) {
    const normalized = String(hex || "").trim().replace("#", "");
    if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
    return [0, 2, 4].map((start) => parseInt(normalized.slice(start, start + 2), 16));
  }
  function luminance(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;
    const values = rgb.map((value) => { const c = value / 255; return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); });
    return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
  }
  function contrast(a, b) {
    const x = luminance(a); const y = luminance(b);
    if (x == null || y == null) return 0;
    return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
  }
  function getAspectRatio() {
    const key = get("canvas.aspectRatio");
    const portrait = get("canvas.orientation") === "portrait";
    if (key === "4:3") return portrait ? { width: 3, height: 4 } : { width: 4, height: 3 };
    if (key === "a4-landscape") return { width: 297, height: 210 };
    if (key === "a4-portrait") return { width: 210, height: 297 };
    if (key === "custom") {
      const width = Number(get("canvas.customWidth")) || 16;
      const height = Number(get("canvas.customHeight")) || 9;
      if (portrait && width > height) return { width: height, height: width };
      if (!portrait && height > width) return { width: height, height: width };
      return { width, height };
    }
    return portrait ? { width: 9, height: 16 } : { width: 16, height: 9 };
  }

  function syncCanvasResolution(source = "width") {
    const ratio = getAspectRatio();
    if (source === "height") {
      state.canvas.width = Math.max(320, Math.round(Number(state.canvas.height || 1080) * ratio.width / ratio.height));
    } else {
      state.canvas.height = Math.max(320, Math.round(Number(state.canvas.width || 1920) * ratio.height / ratio.width));
    }
  }

  function updateCanvasInlineFeedback() {
    const ratio = getAspectRatio();
    const actual = Number(get("canvas.width")) / Math.max(1, Number(get("canvas.height")));
    const expected = ratio.width / ratio.height;
    const matches = Number.isFinite(actual) && Math.abs(actual - expected) / expected <= .015;
    const status = root.querySelector(".cpd-ratio-status");
    if (status) {
      status.classList.toggle("ok", matches);
      status.classList.toggle("error", !matches);
      status.innerHTML = `<strong>${matches ? "규격 일치" : "규격 불일치"}</strong><span>${matches ? `현재 ${get("canvas.width")}×${get("canvas.height")}px이 선택한 화면비와 일치합니다.` : "입력한 해상도가 선택한 화면비와 다릅니다."}</span>${matches ? "" : '<button type="button" class="cpd-btn soft" data-action="fix-canvas-ratio">자동 보정</button>'}`;
    }
    root.querySelectorAll("[data-canvas-preset]").forEach((button) => {
      const preset = CANVAS_PRESETS[button.dataset.canvasPreset];
      const active = preset && preset.aspectRatio === get("canvas.aspectRatio") && preset.width === Number(get("canvas.width")) && preset.height === Number(get("canvas.height"));
      button.classList.toggle("active", Boolean(active));
      button.setAttribute("aria-pressed", String(Boolean(active)));
    });
  }

  function applyCanvasPreset(key) {
    const preset = CANVAS_PRESETS[key];
    if (!preset) return;
    const duplicate = preset.aspectRatio === get("canvas.aspectRatio") && preset.width === Number(get("canvas.width")) && preset.height === Number(get("canvas.height"));
    if (duplicate) { toast("이미 적용된 슬라이드 규격입니다."); return; }
    recordHistory();
    state.canvas.aspectRatio = preset.aspectRatio;
    state.canvas.width = preset.width;
    state.canvas.height = preset.height;
    state.canvas.orientation = preset.orientation;
    state.canvas.outputTarget = preset.outputTarget;
    state.canvas.lockAspectRatio = true;
    refresh({ full: true });
    toast(`${preset.label} 규격을 적용했습니다.`);
  }

  function applySafeAreaPreset(value) {
    const next = value === "auto" ? 6 : Number(value);
    const duplicate = value === "auto"
      ? get("canvas.safeAreaMode") === "auto"
      : get("canvas.safeAreaMode") === "manual" && get("canvas.safeAreaLinked") && ["top", "right", "bottom", "left"].every((key) => Number(get(`canvas.safeArea.${key}`)) === next);
    if (duplicate) { toast("이미 적용된 안전영역 값입니다."); return; }
    recordHistory();
    state.canvas.safeAreaMode = value === "auto" ? "auto" : "manual";
    state.canvas.safeAreaLinked = true;
    ["top", "right", "bottom", "left"].forEach((key) => { state.canvas.safeArea[key] = next; });
    refresh({ full: true });
    toast(value === "auto" ? "안전영역 권장값 6%를 적용했습니다." : `안전영역 ${next}%를 네 방향에 적용했습니다.`);
  }

  function validateState() {
    const issues = [];
    const push = (level, step, message, fix) => issues.push({ level, step, message, fix });
    const ratio = getAspectRatio();
    const actual = Number(get("canvas.width")) / Math.max(1, Number(get("canvas.height")));
    const expected = ratio.width / ratio.height;
    if (isSectionEnabled("canvas") && (!Number.isFinite(actual) || Math.abs(actual - expected) / expected > .015)) push("error", "canvas", "선택한 화면비와 해상도의 비율이 일치하지 않습니다.", "resolution");
    if (isSectionEnabled("colors") && contrast(get("colors.textPrimary"), get("colors.background")) < 4.5) push("error", "colors", "본문 텍스트와 배경의 대비가 WCAG AA 4.5:1에 미달합니다.", "contrast");
    if (isSectionEnabled("colors") && contrast(get("colors.textSecondary"), get("colors.background")) < 3) push("warning", "colors", "보조 텍스트 대비가 낮아 프로젝터 환경에서 흐리게 보일 수 있습니다.", "secondaryContrast");
    if (isSectionEnabled("header") && isSectionEnabled("footer") && get("header.showPageNumber") && get("footer.showPageNumber")) push("error", "footer", "페이지 번호가 헤더와 푸터에 동시에 설정되어 있습니다.", "pageNumber");
    if (isSectionEnabled("header") && get("header.type") === "none" && (get("header.showPageNumber") || get("header.showSectionLabel") || get("header.showSubtitle"))) push("error", "header", "헤더 없음 상태에서 헤더 상세 표시가 활성화되어 있습니다.", "headerNone");
    if (isSectionEnabled("footer") && get("footer.type") === "none" && get("footer.showPageNumber")) push("error", "footer", "푸터 없음 상태에서 페이지 번호가 활성화되어 있습니다.", "footerNone");
    if (isSectionEnabled("background") && isSectionEnabled("imagery") && get("background.type") === "photo" && get("background.photoRange") === "full" && get("imagery.forbidImportantTextOnImages")) push("warning", "background", "전체 사진 배경과 이미지 위 중요 텍스트 금지가 함께 설정되었습니다. 보호 오버레이 또는 사진 범위 축소가 필요합니다.", "photoRange");
    if (isSectionEnabled("background") && ["photo", "photoMix"].includes(get("background.type")) && Number(get("background.photoMaxAreaPercent")) > 40) push("warning", "background", "사진 배경 점유율이 40%를 넘어 텍스트와 데이터 공간이 부족해질 수 있습니다.", "backgroundArea");
    if (isSectionEnabled("background") && ["photo", "photoMix"].includes(get("background.type")) && get("background.overlay") === "none" && get("background.protectTextAreas")) push("warning", "background", "텍스트 영역 보호가 켜져 있지만 사진 보호 오버레이가 없습니다.", "backgroundOverlay");
    if (isSectionEnabled("background") && get("background.type") === "geometric" && !get("background.avoidBusyBackground")) push("recommendation", "background", "기하학 배경은 도형 밀도를 낮춰야 제목과 데이터가 먼저 보입니다.", "backgroundDensity");
    if (isSectionEnabled("colors") && Number(get("colors.accentMaxAreaPercent")) > 20) push("warning", "colors", "강조색 면적이 20%를 넘어 시각적 위계가 약해질 수 있습니다.", "accentArea");
    const keywords = get("visualDirection.keywords") || [];
    if (isSectionEnabled("direction") && keywords.includes("친근함") && keywords.includes("권위감")) push("warning", "direction", "친근함과 권위감이 동시에 선택되었습니다. 사용 목적에 맞게 한쪽을 우선하세요.");
    if (isSectionEnabled("composition") && get("composition.energy") === "dynamic" && get("composition.grid") === "symmetric" && get("composition.repetition") === "uniform") push("warning", "composition", "역동적 구도와 대칭·균일 반복이 함께 설정되어 실제 결과가 정적으로 보일 수 있습니다.");
    if (isSectionEnabled("composition") && get("composition.container") === "cards" && get("composition.repetition") === "uniform") push("recommendation", "composition", "카드 중심 구성과 균일 반복은 동일 크기 박스 나열로 수렴하기 쉽습니다. 핵심 요소 변주 또는 혼합 컨테이너를 권장합니다.");
    if (isSectionEnabled("composition") && get("composition.overlap") === "active" && get("composition.density") === "dense") push("warning", "composition", "고밀도 화면에서 적극적 중첩을 사용하면 텍스트와 데이터 가독성이 낮아질 수 있습니다.");
    if (isSectionEnabled("composition") && get("composition.layoutDiversity") && Number(get("composition.maxConsecutiveLayout")) > 2) push("recommendation", "composition", "스타일 변화를 체감하려면 같은 레이아웃 계열을 최대 2장까지만 연속 사용하는 것이 좋습니다.");
    const mediumGroup = get("visualDirection.mediumGroup");
    const imageStyle = get("imagery.imageStyle");
    const compositeActive = isSectionEnabled("imagery") && photoCompositeActive();
    const compositePrimary = get("imagery.photoCompositePrimary");
    const compositeSecondary = get("imagery.photoCompositeSecondary");
    if (isSectionEnabled("direction") && isSectionEnabled("imagery") && ["render3d", "photo3d"].includes(mediumGroup) && !["3d", "isometric", "conditional"].includes(imageStyle)) push("warning", "direction", "선택한 화풍은 3D 표현을 사용하지만 이미지 스타일은 3D 계열이 아닙니다. 현재 설정을 유지할지 확인하세요.");
    if (isSectionEnabled("direction") && isSectionEnabled("imagery") && mediumGroup === "photo" && !["photo", "conditional"].includes(imageStyle)) push("warning", "direction", "선택한 화풍은 사진 기반이지만 이미지 스타일은 실사 계열이 아닙니다. 표현 방식이 충돌할 수 있습니다.");
    if (isSectionEnabled("imagery") && get("imagery.imageEnabled") !== false && get("imagery.imagePurpose") === "evidence" && !["photo", "conditional"].includes(imageStyle)) push("warning", "imagery", "현장·제품·사례 근거는 실사 이미지가 가장 명확합니다. 현재 표현 방식이 사실성을 약화할 수 있습니다.", "imageryEvidence");
    if (isSectionEnabled("imagery") && get("imagery.imageEnabled") !== false && get("imagery.imagePurpose") === "concept" && imageStyle === "photo") push("recommendation", "imagery", "개념·구조 설명에는 벡터 또는 3D 표현이 더 이해하기 쉬울 수 있습니다.", "imageryConcept");
    if (isSectionEnabled("imagery") && get("imagery.iconEnabled") !== false && get("imagery.iconStyle") === "3d" && get("visualDirection.intensity") === "restrained") push("warning", "imagery", "절제된 디자인 방향과 3D 아이콘의 입체감이 충돌할 수 있습니다.", "imageryIcon");
    if (isSectionEnabled("imagery") && get("imagery.allowMixedStyles")) push("recommendation", "imagery", "복수 이미지 스타일은 일관성을 낮출 수 있습니다. 특별한 이유가 없다면 한 가지 표현 방식을 권장합니다.", "imageryMixed");
    if (compositeActive && (get("imagery.imageEnabled") === false || imageStyle === "none")) push("warning", "imagery", "실사 합성이 켜져 있지만 이미지 사용이 꺼져 있습니다.", "photoCompositeImage");
    if (compositeActive && !["photo", "conditional"].includes(imageStyle)) push("warning", "imagery", "실사 합성은 ‘실사 사진’ 또는 ‘내용에 맞춰 판단’ 이미지 방식과 함께 사용해야 자연스럽습니다.", "photoCompositeStyle");
    if (compositeActive && compositeSecondary !== "none" && compositePrimary === compositeSecondary) push("error", "imagery", "실사 합성의 주 적용 위치와 보조 적용 위치가 같습니다.", "photoCompositeDuplicate");
    if (compositeActive && compositeSecondary !== "none" && Number(get("imagery.photoCompositeMaxZones")) < 2) push("warning", "imagery", "보조 적용 위치가 있지만 최대 적용 영역이 1개로 제한되어 있습니다.", "photoCompositeZones");
    if (compositeActive && [compositePrimary, compositeSecondary].includes("card") && (!isSectionEnabled("components") || get("components.cardEnabled") === false)) push("warning", "imagery", "카드 주변 실사 합성이 선택됐지만 카드 설정은 비설정 상태입니다.", "photoCompositeCard");
    if (compositeActive && Number(get("imagery.photoCompositeMaxAreaPercent")) > 40) push("warning", "imagery", "실사 합성 점유율이 40%를 넘어 텍스트와 데이터 공간이 부족해질 수 있습니다.", "photoCompositeArea");
    if (compositeActive && !get("imagery.photoCompositeProtectData") && isSectionEnabled("components") && (get("components.tableEnabled") !== false || get("components.chartEnabled") !== false)) push("warning", "imagery", "표·차트가 사용되므로 실사와 데이터 영역의 겹침 방지를 켜는 것을 권장합니다.", "photoCompositeData");
    if (isSectionEnabled("typography") && get("typography.visualTypographyHighRisk") && get("typography.visualTypographyScope") === "all") push("warning", "typography", "장식성이 강한 비주얼 믹서 스타일이 전체 텍스트에 적용되어 본문과 표·차트 라벨의 가독성이 낮아질 수 있습니다.", "typographyScope");
    if (isSectionEnabled("typography") && ["script", "experimental"].includes(get("typography.visualTypographyCategory")) && get("typography.visualTypographyScope") !== "headline") push("warning", "typography", "캘리그라피·실험적 타이포그래피는 제목에만 적용하는 것을 권장합니다.", "typographyScope");
    if (isSectionEnabled("typography") && get("typography.bodyScale") === "compact" && get("typography.lineHeight") === "tight") push("warning", "typography", "정보 밀집형 본문과 좁은 줄 간격이 함께 설정되어 발표 거리에서 읽기 어려울 수 있습니다.", "typographySpacing");
    if (isSectionEnabled("typography") && get("typography.projectorMode") && get("typography.bodyScale") === "compact") push("recommendation", "typography", "프로젝터 발표에서는 본문 정보량을 ‘균형’ 이상으로 설정하는 것이 안전합니다.", "typographyBody");
    if (isSectionEnabled("quality") && (!get("quality.preserveExactText") || !get("quality.preserveNumbers"))) push("recommendation", "quality", "슬라이드 분리기 연계 시 문구와 수치 보존을 모두 켜는 것을 권장합니다.", "preserve");
    return issues;
  }

  function validateStateV2() {
    const issues = [];
    const push = (level, step, message, fix) => issues.push({ level, step, message, fix });
    const ratio = getAspectRatio();
    const actual = Number(get("canvas.width")) / Math.max(1, Number(get("canvas.height")));
    const expected = ratio.width / ratio.height;
    if (!String(get("project.audienceRole") || get("project.audience") || "").trim()) push("warning", "project", "청중의 역할이나 구체 대상을 입력하면 모든 슬라이드의 용어 난이도와 정보 밀도를 더 정확히 맞출 수 있습니다.");
    if (!String(get("project.presentationPurpose") || "").trim()) push("warning", "project", "발표 목적을 입력하면 슬라이드별 강조 순서와 증거 선택이 더 정확해집니다.");
    if (!String(get("project.desiredAction") || "").trim()) push("recommendation", "project", "발표 후 원하는 판단이나 행동을 적으면 결론과 요청이 더 선명해집니다.");
    if (!String(get("project.currentPerception") || "").trim()) push("recommendation", "project", "청중의 현재 생각을 적으면 각 장이 바꿔야 할 인식을 더 정확히 설계할 수 있습니다.");
    if (!String(get("project.targetPerception") || "").trim()) push("recommendation", "project", "발표 후 바꿀 생각을 적으면 증거의 강조 순서와 비주얼 논증이 선명해집니다.");
    if (!String(get("project.keyBarrier") || "").trim()) push("recommendation", "project", "가장 큰 의문이나 반론을 적으면 슬라이드별 설득 과업이 더 구체적이 됩니다.");
    if (!String(get("project.governingThought") || "").trim()) push("warning", "project", "발표 전체의 한 문장 결론을 적으면 슬라이드 전략이 한 방향으로 정렬됩니다.");
    if (isSectionEnabled("canvas") && (!Number.isFinite(actual) || Math.abs(actual - expected) / expected > .015)) push("error", "canvas", "선택한 화면비와 해상도의 비율이 일치하지 않습니다.", "resolution");
    if (isSectionEnabled("colors") && contrast(get("colors.textPrimary"), get("colors.background")) < 4.5) push("error", "colors", "본문 텍스트와 배경의 대비가 WCAG AA 4.5:1에 미달합니다.", "contrast");
    if (isSectionEnabled("colors") && contrast(get("colors.textSecondary"), get("colors.background")) < 3) push("warning", "colors", "보조 텍스트 대비가 낮아 프로젝터 환경에서 흐리게 보일 수 있습니다.", "secondaryContrast");
    if (isSectionEnabled("header") && isSectionEnabled("footer") && get("header.showPageNumber") && get("footer.showPageNumber")) push("error", "footer", "페이지 번호가 헤더와 푸터에 동시에 설정되어 있습니다.", "pageNumber");
    if (isSectionEnabled("header") && get("header.type") === "none" && (get("header.showPageNumber") || get("header.showSectionLabel") || get("header.showSubtitle"))) push("error", "header", "헤더 없음 상태에서 헤더 상세 표시가 활성화되어 있습니다.", "headerNone");
    if (isSectionEnabled("footer") && get("footer.type") === "none" && get("footer.showPageNumber")) push("error", "footer", "푸터 없음 상태에서 페이지 번호가 활성화되어 있습니다.", "footerNone");
    if (isSectionEnabled("background") && get("background.type") === "geometric" && !get("background.avoidBusyBackground")) push("recommendation", "background", "기하학 배경은 도형 밀도를 낮춰야 제목과 데이터가 먼저 보입니다.", "backgroundDensity");
    if (isSectionEnabled("background") && isBackgroundPhotoActive() && get("background.photoOverlay") === "none" && get("background.photoProtectText")) push("recommendation", "background", "실사 배경을 사용할 때는 크롭·여백·국부 대비 중 한 방식으로 제목과 수치의 읽기 영역을 보호하세요.", "backgroundPhotoOverlay");
    if (isSectionEnabled("typography") && get("typography.visualTypographyHighRisk") && get("typography.visualTypographyScope") === "all") push("warning", "typography", "장식성이 강한 비주얼 믹서 스타일이 전체 텍스트에 적용되어 본문과 표·차트 라벨의 가독성이 낮아질 수 있습니다.", "typographyScope");
    if (isSectionEnabled("typography") && get("typography.bodyScale") === "compact" && get("typography.lineHeight") === "tight") push("warning", "typography", "정보 밀집형 본문과 좁은 줄 간격이 함께 설정되어 발표 거리에서 읽기 어려울 수 있습니다.", "typographySpacing");
    if (isSectionEnabled("quality") && (!get("quality.preserveExactText") || !get("quality.preserveNumbers"))) push("recommendation", "quality", "슬라이드 분리기 연계 시 문구와 수치 보존을 모두 켜는 것을 권장합니다.", "preserve");
    return issues;
  }

  function validateFiveStageState() {
    const issues = [];
    const push = (level, step, message, fix) => issues.push({ level, step, message, fix });
    const ratio = getAspectRatio();
    const actual = Number(get("canvas.width")) / Math.max(1, Number(get("canvas.height")));
    const expected = ratio.width / ratio.height;
    if (!Number.isFinite(actual) || Math.abs(actual - expected) / expected > .015) push("error", "canvas", "선택한 화면비와 이미지 크기의 비율이 일치하지 않습니다.", "resolution");
    const base = get("colors.baseCanvas") === "white" ? "#FFFFFF" : get("colors.background");
    if (contrast(get("colors.textPrimary"), base) < 4.5) push("error", "colors", "주요 텍스트와 기본 배경의 대비가 WCAG AA 4.5:1에 미달합니다.", "contrast");
    if (contrast(get("colors.textSecondary"), base) < 3) push("warning", "colors", "보조 텍스트 대비가 낮아 프로젝터 환경에서 흐리게 보일 수 있습니다.", "secondaryContrast");
    const occupied = Number(get("frame.headerHeightPercent")) + Number(get("frame.footerHeightPercent")) + (Number(get("frame.bodySafeMarginPercent")) * 2);
    if (occupied > 42) push("warning", "canvas", "헤더·푸터와 본문 여백이 커서 실제 콘텐츠 영역이 좁아질 수 있습니다.");
    return issues;
  }

  function label(path, map) { return map[get(path)] || get(path); }
  function boolLine(condition, ko, en, lang) { return condition ? (lang === "ko" ? ko : en) : ""; }
  function lines(items) { return items.filter(Boolean).map((item) => `- ${item}`).join("\n"); }
  function efficientColorDefinition(ko, detailed) {
    const title = ko
      ? `${paletteTitle()} (${get("colors.paletteNameEn") || "Custom palette"})`
      : `${get("colors.paletteNameEn") || "Custom palette"} (${paletteTitle()})`;
    const conciseRoles = [
      ["P", "primary"],
      ["S", "secondary"],
      ["A", "accent"],
      ["BG", "background"],
      ["Surface", "surface"],
      ["Text", "textPrimary"],
    ];
    const conciseTokens = conciseRoles
      .map(([role, key]) => `${role}=${get(`colors.${key}`)}`).join("; ");
    const detailedTokens = CORE_COLOR_ROLE_KEYS
      .map((key) => `${COLOR_ROLE_META[key][0]}=${colorToken(key, ko)}`).join("; ");
    const tokens = detailed ? detailedTokens : conciseTokens;
    const base = ko ? `팔레트 ${title}: ${tokens}.` : `Palette ${title}: ${tokens}.`;
    if (!detailed) return [base];
    return [base, ko
      ? "사용 가능한 역할: Primary=제목·주요 구조, Secondary=보조 구조·정보 구분, Accent=선택적 강조, Background=기본 배경, Text Primary=본문 텍스트. 슬라이드 목적에 도움이 되는 역할만 선택하고 표면·보조 텍스트·구분선에는 자연스러운 파생 명도를 사용할 수 있다."
      : "Available roles: Primary=headings and structure; Secondary=supporting structure and information grouping; Accent=selective emphasis; Background=base canvas; Text Primary=body copy. Select only roles that support the slide and use natural tonal derivatives for surfaces, secondary copy, and dividers when helpful."];
  }
  function colorIdentityPromptLines(ko, compact = false) {
    const primary = colorToken("primary", ko);
    const secondary = colorToken("secondary", ko);
    const accent = colorToken("accent", ko);
    const identity = get("colors.identityPattern") || "currentDecision";
    const identityLine = {
      currentDecision: ko
        ? `팔레트 서명은 '연결 흐름 + 결정점'이다. Primary ${primary}는 페이지를 관통하거나 핵심 노드를 잇는 하나의 연속 흐름선·호·방향축으로 반복하고, Secondary ${secondary}는 근거가 놓이는 증거면·보조 밴드·연결 영역으로 사용한다. Accent ${accent}는 페이지당 최대 한 곳의 결정·병목·전환점에만 작은 노치·점·화살표로 사용한다.`
        : `The palette signature is "current plus decision point." Repeat Primary ${primary} as one continuous spine, arc, or directional current that crosses the page or links key nodes; use Secondary ${secondary} for evidence fields, supporting bands, and connection zones. Use Accent ${accent} as one small notch, dot, or arrow for at most one decision, bottleneck, or transition per slide.`,
      fieldMarker: ko
        ? `팔레트 서명은 '증거 색면 + 핵심 표식'이다. Secondary ${secondary}의 옅은 파생면을 근거 영역 뒤에 반복하고 Primary ${primary}로 핵심 정보의 경계를 고정한다. Accent ${accent}는 페이지당 하나의 핵심 표식에만 사용한다.`
        : `The palette signature is "evidence field plus focal marker." Repeat pale Secondary ${secondary} derivatives behind evidence, lock focal boundaries with Primary ${primary}, and reserve Accent ${accent} for one focal marker per slide.`,
      sectionBand: ko
        ? `팔레트 서명은 '섹션 밴드 + 전환 노치'다. Primary ${primary}의 얇은 섹션 밴드와 Secondary ${secondary}의 보조 구획을 반복하고, Accent ${accent}의 작은 전환 노치 하나로 논점 변화를 표시한다.`
        : `The palette signature is "section band plus transition notch." Repeat a thin Primary ${primary} section band and Secondary ${secondary} supporting fields, with one small Accent ${accent} notch marking the argument shift.`,
      roleOnly: ko
        ? `팔레트는 고정 모티프 없이 역할로만 통일한다. Primary ${primary}=주요 구조, Secondary ${secondary}=보조 구조, Accent ${accent}=단일 의미 강조의 경계를 지킨다.`
        : `Unify the palette by role without a fixed motif: Primary ${primary}=main structure, Secondary ${secondary}=supporting structure, Accent ${accent}=one semantic emphasis.`,
    }[identity];
    const rhythmLine = {
      sectionArc: ko
        ? "덱 색채 호흡은 전환 필요성의 차가운 분석 → 자산·병목의 소프트 시안 증거면 → 발전전략의 자연색 현장 증거 → 실행 요청의 Primary 집중과 Accent 결정점 순으로 전개한다. 개별 페이지가 이 순서를 화면에 쓰지는 않으며 해당 섹션의 색상 무게만 반영한다."
        : "Use a deck color arc: cool analysis for the need for change, soft-cyan evidence fields for assets and bottlenecks, natural-color field evidence for strategy, then concentrated Primary with one Accent decision point for the action request. Do not render these stage labels; only reflect the section's color weight.",
      alternating: ko
        ? "인접 페이지는 내용이 허용할 때 차가운 분석색과 자연색 증거를 교차해 같은 색온도가 세 장 이상 이어지지 않게 한다."
        : "When content permits, alternate cooler analytical color with natural-color evidence so the same color temperature does not continue for three slides.",
      steady: ko
        ? "덱 전체는 안정된 뉴트럴 쿨 온도를 유지하되 초점 면적과 Accent 위치만 페이지별로 바꾼다."
        : "Maintain a stable neutral-cool temperature across the deck while varying focal area and Accent position by slide.",
    }[get("colors.deckColorRhythm") || "sectionArc"];
    const photoLine = {
      frameNotTint: ko
        ? "실사에는 팔레트색 프레임·캡션·연결선만 적용하고 사진 자체는 재착색하지 않는다. 자연색 사진이 팔레트 구조 안에서 증거로 보이게 한다."
        : "Apply palette color only to photographic frames, captions, and connectors; never recolor the photograph itself. Let natural-color imagery read as evidence inside the palette structure.",
      selectiveEcho: ko
        ? "실사의 고유색을 보존하고 사진 속 의미 있는 색 하나를 작은 주석·데이터 표식에서만 반향해 그래픽과 사진을 연결한다."
        : "Preserve photographic local color and echo one meaningful scene color only in a small annotation or data marker to connect imagery and graphics.",
      neutralMat: ko
        ? "실사는 중성 매트와 얇은 Primary 프레임으로 분리하고 사진 고유색과 그래픽 역할색이 섞이지 않게 한다."
        : "Separate photography with a neutral mat and thin Primary frame so local photographic color and graphic role color remain distinct.",
    }[get("colors.photoHarmony") || "frameNotTint"];
    return compact ? [identityLine, photoLine] : [identityLine, rhythmLine, photoLine];
  }
  function modelColorExecutionLines(ko, model, compact = false) {
    const lines = [ko
      ? "Primary는 제목·주요 구조, Secondary는 보조 구조·정보 구분, Accent는 핵심 수치와 전환점에 선택적으로 활용한다."
      : "Use Primary for headings and main structure, Secondary for supporting structure and grouping, and Accent selectively for key figures and transitions.",
    ko
      ? "개별 슬라이드의 설득 목적과 선택한 표현 방식에 도움이 되는 색상만 사용한다. 모든 색을 한 화면에 억지로 배분하거나 모든 패널을 브랜드색으로 채우지 않는다."
      : "Use only the colors that support the slide's persuasion goal and chosen visual treatment. Do not force every color onto every slide or tint every panel with brand colors."];
    if (get("colors.allowDerivedTones")) lines.push(ko ? "표면·구분선·보조 정보에는 역할 색상에서 도출한 자연스러운 명도 단계와 중성색을 사용할 수 있다." : "Natural tonal steps and neutrals derived from the role colors are available for surfaces, dividers, and supporting information.");
    if (get("colors.allowAccentOmission")) lines.push(ko ? "Accent가 초점이나 의미 구분에 기여하지 않으면 생략할 수 있다." : "Accent may be omitted when it does not improve focus or semantic distinction.");
    if (get("colors.preservePhotoLocalColor")) lines.push(ko ? "사진·지도·재료·피부·식생·하늘의 고유색은 보존하고 팔레트는 주석·정보 구조·프레이밍에 선택적으로 적용한다." : "Preserve the local colors of photography, maps, materials, skin, vegetation, and sky; apply the palette selectively to annotation, information structure, and framing.");
    if (get("colors.forbidGlobalHueWash")) lines.push(ko ? "전체 화면을 한 가지 팔레트 색으로 물들이지 않는다. 색상 오버레이는 의미 또는 읽기 보호가 필요한 국부 영역에만 선택적으로 사용할 수 있다." : "Do not wash the full canvas in a single palette hue. Color overlays are available only for local semantic emphasis or reading protection.");
    lines.push(ko
      ? "한 페이지에는 실제 장면·재료·데이터 의미에서 직접 나온 색온도 대비점 하나만 허용한다. 차가운 구조색과 따뜻한 현장·인물·재료색의 대비로 긴장과 궁금증을 만들되, 장식용 임의 색상이나 새로운 사실은 만들지 않는다."
      : "Allow only one chromatic counterpoint per slide, derived directly from the real scene, material, or data meaning. Create tension and curiosity through cool structural color versus warmer field, people, or material color without inventing decorative colors or new facts.");
    lines.push(ko
      ? "사진이 없는 데이터 페이지는 Primary 단일색을 반복하지 말고 Secondary 파생 명도·중성색·의미 기반 대비색 하나로 계열을 구분한다. 인접 페이지는 내용이 허용할 때 분석의 차가운 리듬과 현장·실행의 자연색 리듬을 교차시킨다."
      : "On data-only pages, do not repeat Primary for every series; separate them with Secondary tonal derivatives, neutrals, and one meaning-led counterpoint. Across adjacent slides, alternate cooler analytical rhythm with natural-color field or action rhythm when the content supports it.");
    lines.push(...colorIdentityPromptLines(ko, compact));
    if (!compact) return lines;
    return [
      lines[0],
      lines[1],
      lines.find((line) => /Accent|강조색/.test(line)),
      lines.find((line) => /고유색|local colors/.test(line)),
      lines.find((line) => /전체 화면|full canvas/.test(line)),
      lines.find((line) => /색온도 대비점|chromatic counterpoint/.test(line)),
      lines.find((line) => /팔레트 서명|palette signature/i.test(line)),
      lines.find((line) => /실사에는|photographic frames|photography with/i.test(line)),
    ].filter(Boolean);
  }
  function compositionPromptLines(ko, compact = false) {
    const energy = label("composition.energy", { stable: ko ? "안정적" : "stable", balanced: ko ? "통제된 역동성" : "controlled dynamism", dynamic: ko ? "역동적" : "dynamic" });
    const grid = label("composition.grid", { symmetric: ko ? "대칭 그리드" : "a symmetric grid", modular: ko ? "모듈형 그리드" : "a modular grid", asymmetricModular: ko ? "비대칭 모듈 그리드" : "an asymmetric modular grid", editorial: ko ? "에디토리얼 그리드" : "an editorial grid" });
    const scale = label("composition.scaleContrast", { low: ko ? "절제된" : "restrained", medium: ko ? "중간" : "moderate", strong: ko ? "강한" : "strong" });
    const result = [ko
      ? `${energy} 구성 에너지와 ${grid}, ${scale} 크기 대비를 덱 전체의 기본 구도 문법으로 사용한다.`
      : `Use ${energy}, ${grid}, and ${scale} scale contrast as the deck-wide composition grammar.`];
    if (get("composition.scaleContrast") === "strong") result.push(ko
      ? "슬라이드마다 제목, 핵심 수치, 대표 이미지 또는 핵심 단계 중 하나만 시각적 초점으로 정하고 일반 요소보다 약 1.3~1.7배 크게 표현한다."
      : "Choose exactly one focal anchor per slide—headline, key figure, hero image, or pivotal step—and render it about 1.3–1.7× larger than ordinary elements.");
    if (get("composition.container") === "mixed") result.push(ko
      ? "모든 정보를 동일 크기 사각형 카드에 넣지 말고 카드, 경계 없는 정보 그룹, 색상 밴드와 여백을 혼합한다."
      : "Do not place all information in equal rectangular cards; mix cards with borderless information groups, color bands, and whitespace.");
    else if (get("composition.container") === "borderless") result.push(ko
      ? "컨테이너 테두리를 최소화하고 타이포그래피, 정렬, 여백과 색상 면으로 정보 그룹을 구분한다."
      : "Minimize container borders and group information through typography, alignment, whitespace, and color fields.");
    if (get("composition.repetition") !== "uniform") result.push(ko
      ? `반복 요소는 ${get("composition.repetition") === "focal" ? "핵심 항목 하나의 크기·위치·면을 변주해" : "크기와 위치의 리듬을 적극적으로 달리해"} 기계적인 동일 카드 나열을 피한다.`
      : `Avoid mechanical equal-card repetition by ${get("composition.repetition") === "focal" ? "varying the scale, position, or surface of one focal item" : "actively varying scale and positional rhythm"}.`);
    const overlap = get("composition.overlap");
    const depth = get("composition.depth");
    if (overlap !== "none" || depth !== "flat") result.push(ko
      ? `${depth === "layered" ? "두세 단계의 레이어 깊이" : "얕은 레이어 깊이"}와 ${overlap === "active" ? "적극적이되 통제된" : "제한적인"} 중첩을 사용하되 텍스트·수치·표·차트의 읽기 영역은 침범하지 않는다.`
      : `Use ${depth === "layered" ? "two or three depth layers" : "shallow depth"} with ${overlap === "active" ? "active but controlled" : "selective"} overlap without intruding on readable text, figures, tables, or charts.`);
    if (get("composition.flow") !== "linear") result.push(ko
      ? `프로세스와 관계도는 ${label("composition.flow", { curved: "곡선 흐름", diagonal: "방향성 있는 대각 흐름", adaptive: "내용에 맞는 직선·곡선·대각 흐름" })}을 활용하고, 동일 카드와 단순 화살표만 일렬로 반복하지 않는다.`
      : `For processes and relationship diagrams, use ${label("composition.flow", { curved: "curved flow", diagonal: "directional diagonal flow", adaptive: "content-appropriate linear, curved, or diagonal flow" })} rather than repeating equal cards connected only by simple arrows.`);
    if (get("composition.meaningfulGraphics")) result.push(ko
      ? "내용과 무관한 장식은 금지하되 정보 관계와 시선 유도를 설명하는 선, 면, 밴드, 궤적과 프레임 분할은 허용한다."
      : "Forbid unrelated decoration, but allow lines, fields, bands, trajectories, and frame divisions that explain information relationships or guide attention.");
    if (!compact && get("composition.layoutDiversity")) result.push(ko
      ? `같은 레이아웃 계열을 ${Math.max(1, Number(get("composition.maxConsecutiveLayout")) || 2)}장보다 길게 연속 반복하지 않고, 콘텐츠 유형에 따라 초점 구도를 변주한다.`
      : `Do not repeat the same layout family for more than ${Math.max(1, Number(get("composition.maxConsecutiveLayout")) || 2)} consecutive slides; vary the focal composition by content type.`);
    if (!compact && get("composition.container") !== "cards") result.push(ko
      ? "표와 비교 화면은 불필요한 셀 테두리를 줄이고 핵심 열·행·수치를 포커스 밴드, 직접 레이블 또는 크기 대비로 강조하되 데이터 값을 왜곡하지 않는다."
      : "In tables and comparisons, reduce unnecessary cell borders and emphasize the key column, row, or figure with a focus band, direct labels, or scale contrast without distorting data." );
    return result;
  }
  function componentPromptLines(ko, compact) {
    const result = [];
    const cardPreset = get("components.cardPreset");
    const tablePreset = get("components.tablePreset");
    const chartPreset = get("components.chartPreset");
    if (get("components.cardEnabled") !== false) {
      const presetLines = {
        clean: ["카드는 밝은 표면, 얇은 테두리, 적당히 둥근 모서리와 은은한 그림자로 통일한다.", "Use clean cards with light surfaces, thin borders, moderately rounded corners, and subtle shadows."],
        outline: ["카드는 그림자 없이 얇고 명확한 테두리로 구분한다.", "Separate cards with clear thin borders and no shadows."],
        emphasis: ["카드는 대표색을 옅게 적용하고 핵심 정보에 충분한 안쪽 여백을 둔다.", "Use a pale primary-color tint and generous inner spacing for emphasis cards."],
        minimal: ["카드는 배경·테두리·그림자를 사용하지 않고 정보 묶음만 간결하게 구분한다.", "Use minimal card groupings without backgrounds, borders, or shadows."],
      };
      result.push(presetLines[cardPreset]?.[ko ? 0 : 1] || (ko ? `카드는 배경 ${get("components.cardBackground")}, 테두리 ${get("components.cardBorder")}, 모서리 ${get("components.cardCorner")}, 그림자 ${get("components.cardShadow")}, 안쪽 여백 ${get("components.cardPadding")}로 표현한다.` : `Cards use ${get("components.cardBackground")} backgrounds, ${get("components.cardBorder")} borders, ${get("components.cardCorner")} corners, ${get("components.cardShadow")} shadows, and ${get("components.cardPadding")} padding.`));
    }
    if (get("components.tableEnabled") !== false) {
      const presetLines = {
        readable: ["표는 옅은 대표색 제목행과 행 구분선을 사용해 멀리서도 읽기 쉽게 만든다.", "Use pale primary-color table headers and row dividers for presentation-distance readability."],
        minimal: ["표는 색을 최소화하고 여유 있는 행 간격과 가로 구분선만 사용한다.", "Keep tables minimal with generous row spacing and horizontal dividers only."],
        data: ["표는 대표색 제목행과 명확한 수치 정렬로 핵심 데이터를 강조한다.", "Emphasize table data with primary-color headers and clear numeric alignment."],
        compact: ["표는 많은 행을 담을 수 있도록 촘촘하게 구성하되 행 구분은 유지한다.", "Use compact table rows while preserving clear row separation."],
      };
      result.push(presetLines[tablePreset]?.[ko ? 0 : 1] || (ko ? `표는 제목행 ${get("components.tableHeader")}, 행 간격 ${get("components.tableDensity")}, 행 구분선 ${get("components.tableRowDividers") ? "표시" : "미표시"}, 세로선 ${get("components.tableVerticalLines") ? "표시" : "미표시"}로 표현한다.` : `Tables use ${get("components.tableHeader")} headers, ${get("components.tableDensity")} density, ${get("components.tableRowDividers") ? "visible" : "no"} row dividers, and ${get("components.tableVerticalLines") ? "visible" : "no"} vertical lines.`));
    }
    if (get("components.chartEnabled") !== false) {
      const presetLines = {
        presentation: ["차트는 필요한 축과 최소 격자만 남기고 핵심값에만 라벨을 표시한다.", "Keep only necessary axes and minimal grids, labeling key values only."],
        minimal: ["차트는 축·격자·범례를 최소화하고 핵심값 비교에 집중한다.", "Minimize chart axes, grids, and legends; focus on key-value comparison."],
        data: ["차트는 축과 모든 주요 수치를 명확하게 표시해 정밀 비교가 가능하게 한다.", "Show clear axes and all major values for precise chart comparison."],
        clean: ["차트는 격자를 제거하고 필요한 축·범례와 핵심값만 표시한다.", "Remove chart grids and retain only necessary axes, legends, and key values."],
      };
      result.push(presetLines[chartPreset]?.[ko ? 0 : 1] || (ko ? `차트는 기준선 ${get("components.chartAxes")}, 격자선 ${get("components.chartGrid")}, 항목 설명 ${get("components.chartLegend")}, 수치 표시 ${get("components.chartLabels")}로 표현한다.` : `Charts use ${get("components.chartAxes")} axes, ${get("components.chartGrid")} grids, ${get("components.chartLegend")} legends, and ${get("components.chartLabels")} value labels.`));
      if (!compact && get("components.forbid3dCharts")) result.push(ko ? "3D 차트를 사용하지 않는다." : "Do not use 3D charts.");
      if (!compact && get("components.forbidUnneededLegends")) result.push(ko ? "항목 구분에 필요하지 않은 범례는 표시하지 않는다." : "Do not show legends unless they are necessary to distinguish series.");
      if (!compact && get("components.forbidPhotoChartOverlap")) result.push(ko ? "사진과 차트 영역을 겹치지 않는다." : "Do not overlap photos with chart areas.");
    }
    if (result.length && !compact) result.push(ko ? "종류, 실제 데이터, 개수와 배치는 개별 슬라이드 명세에서만 결정한다." : "Types, actual data, count, and placement come only from the individual slide specification.");
    return result;
  }

  function typographyPromptLines(ko, compact = false) {
    const family = label("typography.family", { sans: ko ? "산세리프" : "sans-serif", serif: ko ? "세리프" : "serif", mixed: ko ? "산세리프·세리프 혼합" : "mixed sans-serif and serif" });
    const headline = label("typography.headlineCharacter", { authoritative: ko ? "신뢰감 있고 굵은" : "confident and authoritative", modern: ko ? "현대적이고 명료한" : "modern and clear", restrained: ko ? "절제되고 차분한" : "restrained and calm", friendly: ko ? "친근하고 부드러운" : "friendly and approachable" });
    const body = label("typography.bodyCharacter", { neutral: ko ? "중립적인" : "neutral", legible: ko ? "읽기 편한" : "highly legible", technical: ko ? "정밀한 기술 문서형" : "precise technical-document" });
    const headlineScale = label("typography.headlineScale", { standard: ko ? "표준" : "standard", large: ko ? "큰" : "large", xlarge: ko ? "매우 큰" : "extra-large" });
    const bodyScale = label("typography.bodyScale", { compact: ko ? "정보 밀집형" : "compact", standard: ko ? "표준" : "standard", large: ko ? "여유 있는" : "large and airy" });
    const lineHeight = label("typography.lineHeight", { tight: ko ? "좁은" : "tight", standard: ko ? "표준" : "standard", wide: ko ? "넓은" : "wide" });
    const letterSpacing = label("typography.letterSpacing", { tight: ko ? "좁은" : "tight", standard: ko ? "표준" : "standard", wide: ko ? "넓은" : "wide" });
    const font = get("typography.fontName") || (ko ? "특정 글꼴 미지정" : "no exact font specified");
    const fallback = get("typography.fallback") || (ko ? "한글 가독성이 높은 대체 글꼴" : "a highly legible Korean-compatible fallback");
    const visualName = get("typography.visualTypographyNameKo");
    const visualEn = get("typography.visualTypographyNameEn");
    const scope = get("typography.visualTypographyScope");
    const scopeKo = scope === "all" ? "전체 텍스트" : scope === "cover_section" ? "표지·구분 슬라이드의 제목" : "제목";
    const scopeEn = scope === "all" ? "all text" : scope === "cover_section" ? "cover and section-divider headlines" : "headlines only";
    const voice = label("typography.voice", { institutional: ko ? "제도적이고 공식적인" : "institutional and formal", authoritativeModern: ko ? "권위 있는 현대적" : "authoritative and modern", editorial: ko ? "에디토리얼" : "editorial", technical: ko ? "정밀한 기술적" : "precise and technical", human: ko ? "인간적이고 친근한" : "human and approachable" });
    const hierarchy = label("typography.hierarchyStyle", { scaleWeight: ko ? "크기와 굵기" : "scale and weight", scaleSpace: ko ? "크기와 여백" : "scale and whitespace", weightColor: ko ? "굵기와 역할색" : "weight and role color", editorialContrast: ko ? "서체 성격과 크기의 편집적 대비" : "editorial contrast in type character and scale" });
    const rhythm = label("typography.rhythm", { compact: ko ? "압축된" : "compact", balanced: ko ? "균형 잡힌" : "balanced", airy: ko ? "넓은 호흡의" : "airy", dramatic: ko ? "짧고 강한" : "dramatic" });
    const lines = [
      ko ? `타이포그래피의 목소리는 ${voice}이며, ${hierarchy}로 위계를 만들고 ${rhythm} 문장 리듬을 유지한다.` : `Use a ${voice} typographic voice, create hierarchy through ${hierarchy}, and maintain a ${rhythm} reading rhythm.`,
      ko ? `강조 원칙: ${get("typography.emphasisPolicy")}.` : `Emphasis principle: ${get("typography.emphasisPolicy")}.`,
      ko ? `선호 글꼴은 ${font}이며 ${family} 계열을 사용한다. 정확한 재현이 어려우면 ${fallback} 특성으로 대체한다.` : `Prefer ${font} in the ${family} family; if unavailable, reproduce the visual characteristics as ${fallback}.`,
      ko ? `제목은 ${headline} 인상과 ${headlineScale} 크기로, 본문은 ${body} 인상과 ${bodyScale} 크기로 구성한다.` : `Use ${headlineScale} ${headline} headlines with ${bodyScale} ${body} body copy.`,
    ];
    if (!compact) lines.push(ko ? `줄 사이 여백은 ${lineHeight} 수준, 글자 사이 간격은 ${letterSpacing} 수준으로 유지한다.` : `Keep ${lineHeight} line spacing and ${letterSpacing} letter spacing.`);
    if (visualName) lines.push(ko ? `${visualName} (${visualEn || "typographic treatment"}) 타이포그래피 표현은 ${scopeKo}에만 적용하고 본문·표·차트 라벨·출처의 가독성을 우선한다.` : `Apply the ${visualEn || visualName} (${visualName}) typographic treatment to ${scopeEn}; keep body copy, tables, chart labels, and sources plain and legible.`);
    if (get("typography.emphasizeNumbers")) lines.push(ko ? "중요 숫자와 단위는 본문보다 한 단계 강하게 강조하되 원문 값을 바꾸지 않는다." : "Emphasize key figures and units one level above body text without changing their exact values.");
    return lines;
  }

  function imageryPromptLines(ko, compact = false) {
    const iconEnabled = get("imagery.iconEnabled") !== false && get("imagery.iconStyle") !== "none" && get("imagery.iconPurpose") !== "none";
    const imageEnabled = get("imagery.imageEnabled") !== false && get("imagery.imageStyle") !== "none" && get("imagery.imagePurpose") !== "none";
    const iconStyle = label("imagery.iconStyle", { line: ko ? "가벼운 라인형" : "light line", solid: ko ? "선명한 채움형" : "clear solid", geometric: ko ? "정돈된 기하학형" : "structured geometric", "3d": ko ? "입체적인 3D형" : "three-dimensional" });
    const iconPurpose = label("imagery.iconPurpose", { structure: ko ? "항목 구분" : "section and item distinction", process: ko ? "절차·단계 안내" : "process and step guidance", highlight: ko ? "핵심 포인트 강조" : "key-point emphasis" });
    const imageStyle = label("imagery.imageStyle", { conditional: ko ? "내용에 맞는 표현 방식" : "a content-appropriate treatment", photo: ko ? "자연스러운 실사 사진" : "natural photography", vector: ko ? "간결한 벡터 일러스트" : "clean vector illustration", "3d": ko ? "절제된 3D 렌더" : "restrained 3D rendering", isometric: ko ? "정돈된 아이소메트릭" : "structured isometric illustration" });
    const imagePurpose = label("imagery.imagePurpose", { whenNeeded: ko ? "개별 명세가 요구할 때" : "only when required by the individual specification", explain: ko ? "내용 이해를 도울 때" : "when it improves comprehension", concept: ko ? "개념·구조를 설명할 때" : "when explaining a concept or structure", evidence: ko ? "현장·제품·사례를 근거로 보여줄 때" : "when showing supplied field, product, or case evidence" });
    const photoMode = get("imagery.photoCompositeMode");
    const proactivePhoto = photoMode === "preferred" || photoMode === "enabled";
    const result = [];
    result.push(iconEnabled
      ? (ko ? `아이콘은 ${iconPurpose}에만 ${iconStyle}으로 사용하고 한 가지 아이콘 계열로 통일한다.` : `Use one consistent ${iconStyle} icon family only for ${iconPurpose}.`)
      : (ko ? "아이콘을 사용하지 않는다." : "Do not use icons."));
    result.push(imageEnabled
      ? (ko ? `이미지는 ${proactivePhoto ? "슬라이드 내용과 직접 연결되는 설명·맥락 제공에" : imagePurpose + "만"} 사용하며 ${proactivePhoto ? "자연스러운 실사 사진" : imageStyle}으로 표현한다.` : `Use ${proactivePhoto ? "natural photography to explain or contextualize the supplied slide content" : imageStyle + " only " + imagePurpose}.`)
      : (ko ? "이미지를 사용하지 않는다." : "Do not use images."));
    if (imageEnabled && get("imagery.followVisualDirection") && get("visualDirection.mediumNameKo")) result.push(ko
      ? `이미지에는 디자인 방향의 ${get("visualDirection.mediumNameKo")} (${get("visualDirection.mediumNameEn") || "visual technique"}) 표현 기법만 연결하고 주제·색상·구도·텍스트는 가져오지 않는다.`
      : `Apply only the ${get("visualDirection.mediumNameEn") || "visual technique"} (${get("visualDirection.mediumNameKo")}) treatment to images; do not import its subject, palette, composition, or text.`);
    result.push(proactivePhoto
      ? (ko ? "명세에 구체적인 사진 피사체가 없으면 슬라이드 제목과 본문에서 직접 연결되는 일반적이고 현실적인 맥락 장면을 도출한다. 특정 인물·기관·제품·시설·사건을 실제 사실이나 증거처럼 꾸며내지 않는다." : "If no specific photo subject is supplied, derive a general realistic context scene directly from the slide title and body. Do not fabricate a specific person, organization, product, facility, or event as factual evidence.")
      : (ko ? "이미지 주제와 장면은 개별 슬라이드 명세에 명시된 경우에만 사용하며 공통 설정에서 추론하지 않는다." : "Use image subjects and scenes only when explicitly supplied by the individual slide specification; never infer them from the common settings."));
    if (!compact) {
      if (get("imagery.requireContentPurpose")) result.push(ko ? "모든 이미지와 아이콘은 내용 이해에 기여하는 명확한 역할이 있어야 한다." : "Every image and icon must have a clear content-supporting purpose.");
      if (get("imagery.avoidRepeatedVisuals")) result.push(ko ? "같은 의미의 이미지나 아이콘을 반복하거나 중복 배치하지 않는다." : "Do not repeat or duplicate images or icons that communicate the same meaning.");
      if (imageEnabled && !get("imagery.allowMixedStyles")) result.push(ko ? "한 슬라이드 안에서 서로 다른 이미지 표현 방식을 혼합하지 않는다." : "Do not mix different image treatments within one slide.");
      if (imageEnabled && get("imagery.forbidImportantTextOnImages")) result.push(ko ? "중요 제목·수치·출처는 이미지 위에 겹치지 않고 독립된 읽기 영역에 둔다." : "Keep important titles, figures, and sources in an independent readable area rather than over images.");
      if (get("imagery.forbidDecorativeOnlyImages") && !(isSectionEnabled("constraints") && get("constraints.forbidMeaninglessDecorations"))) result.push(ko ? "내용과 무관한 장식 목적 이미지를 사용하지 않는다." : "Do not use decorative imagery unrelated to the content.");
      if (get("imagery.forbidGeneratedLogos") && !(isSectionEnabled("constraints") && get("constraints.forbidLogos"))) result.push(ko ? "실제 기관·기업의 로고나 상표를 임의로 만들지 않는다." : "Do not invent real institutional or corporate logos or trademarks.");
    }
    result.push(...photoCompositePromptLines(ko, compact || get("project.outputMode") !== "detailed", imageEnabled));
    return result;
  }

  function photoCompositePromptLines(ko, compact, imageEnabled) {
    if (!photoCompositeActive() || !imageEnabled) return [];
    const targetKo = { background: "저채도 배경 영역", card: "정보 카드 주변", accent: "핵심 수치·키워드 주변의 작은 포인트 컷", hero: "한쪽의 대형 히어로 영역" };
    const targetEn = { background: "a low-saturation background region", card: "the information-card area", accent: "small accent cuts near key figures or keywords", hero: "one large hero region" };
    const primary = get("imagery.photoCompositePrimary");
    const secondary = get("imagery.photoCompositeSecondary");
    const maxZones = Math.max(1, Math.min(2, Number(get("imagery.photoCompositeMaxZones")) || 1));
    const maxArea = Math.max(15, Math.min(45, Number(get("imagery.photoCompositeMaxAreaPercent")) || 30));
    const mode = get("imagery.photoCompositeMode");
    const conditional = mode === "conditional";
    const required = mode === "enabled";
    const result = [];
    const cardKo = [primary, secondary].includes("card") ? ` 카드 실사는 카드 ${label("imagery.photoCompositeCardPlacement", { inside: "내부", side: "옆", corner: "코너" })}의 독립된 읽기 영역을 침범하지 않는다.` : "";
    const cardEn = [primary, secondary].includes("card") ? ` Card photography may sit ${label("imagery.photoCompositeCardPlacement", { inside: "inside cards", side: "beside cards", corner: "at card corners" })} without intruding on the independent reading area.` : "";
    const modeKo = conditional
      ? "개별 명세에 관련 사진 대상이 있을 때만 사용한다"
      : required
        ? "사용자가 실사 제외를 명시한 슬라이드를 제외한 모든 콘텐츠 슬라이드에 최소 1개 반드시 사용한다. 추상적 정책·전략 개념이나 구체적 피사체 미제공은 생략 사유가 아니다"
        : "각 콘텐츠 슬라이드에 우선 적용한다. 피사체가 없으면 제목과 본문에서 안전한 일반 맥락 장면을 도출하고, 순수 표·법정 서식처럼 사진이 정보 전달을 해치는 경우에만 생략한다";
    const modeEn = conditional
      ? "only when the individual specification supplies a relevant photo subject"
      : required
        ? "in at least one region on every content slide unless the user explicitly marks that slide as photo-free; an abstract policy or strategy topic and the absence of a supplied subject are not reasons to omit photography"
        : "as the preferred treatment on each content slide; when no subject is supplied, derive a safe general context scene from the title and body, omitting it only when photography would harm a pure table or legally fixed document";
    if (compact) return [ko
      ? `실사 합성은 ${modeKo}. 주 영역은 ${targetKo[primary]}${secondary !== "none" ? `, 보조 영역은 ${targetKo[secondary]}` : ""}이며 최대 ${maxZones}개 영역·전체 ${maxArea}% 이내로 제한한다.${cardKo} 요소들이 경쟁하거나 정보가 많으면 보조 실사만 생략하고 주 실사 영역은 축소해 유지한다. 텍스트·수치·표·차트의 가독성을 보호하고 합성 사진의 원근·조명·그림자를 일관되게 맞춘다.`
      : `Use photorealistic compositing ${modeEn}. Use ${targetEn[primary]} as the primary region${secondary !== "none" ? ` and ${targetEn[secondary]} as the optional secondary region` : ""}, limited to ${maxZones} region${maxZones > 1 ? "s" : ""} and ${maxArea}% of the slide.${cardEn} When elements compete or content is dense, omit only secondary photography and retain a smaller primary photo region. Protect readable text, data, tables, and charts, and keep perspective, lighting, and shadows consistent.`];
    result.push(ko
      ? `실사 합성은 ${modeKo}. 주 적용 영역은 ${targetKo[primary]}${secondary !== "none" ? `, 보조 허용 영역은 ${targetKo[secondary]}` : ""}이며 한 슬라이드에서 최대 ${maxZones}개 영역, 전체 면적의 ${maxArea}% 이내로 제한한다.`
      : `Use photorealistic compositing ${modeEn}. Use ${targetEn[primary]} as the primary region${secondary !== "none" ? ` and ${targetEn[secondary]} as an optional secondary region` : ""}, limited to ${maxZones} region${maxZones > 1 ? "s" : ""} and ${maxArea}% of the slide area.`);
    if ([primary, secondary].includes("card")) result.push(ko ? cardKo.trim() : cardEn.trim());
    if (get("imagery.photoCompositeDropWhenDense")) result.push(ko ? `선택한 실사 요소들이 서로 경쟁하거나 정보 밀도가 높으면 보조 실사만 생략하고${required ? " 필수 주 실사는 작은 영역으로 축소해 유지하며" : " 주 실사는 필요하면 축소해"} 텍스트·수치의 가독성을 우선한다.` : `If selected photo regions compete or content density is high, omit only secondary photography${required ? " and retain the required primary photo at a smaller size" : " and reduce the primary photo if needed"}, prioritizing text and data legibility.`);
    if (!compact && get("imagery.photoCompositeProtectData")) result.push(ko ? "실사 사진을 표·차트와 겹치지 않고 데이터 영역을 단순한 표면으로 보호한다." : "Keep photography away from tables and charts, preserving simple surfaces behind data.");
    if (!compact && get("imagery.photoCompositeRealism")) result.push(ko ? "합성 사진의 원근·스케일·조명·그림자·색온도를 주변 디자인과 일관되게 맞춘다." : "Match perspective, scale, lighting, shadows, and color temperature across the composited photography and surrounding design.");
    return result;
  }

  function backgroundPromptLines(ko, compact = false) {
    const type = label("background.type", {
      solid: ko ? "단색" : "solid color",
      lightNeutral: ko ? "밝은 중성" : "light neutral",
      gradient: ko ? "제한적인 저대비 그라데이션" : "a restrained low-contrast gradient",
      geometric: ko ? "낮은 대비의 기하학 패턴" : "low-contrast geometric forms",
      photo: ko ? "사진" : "photography",
      photoMix: ko ? "사진과 단색 표면의 혼합" : "a mix of photography and solid surfaces",
      conditional: ko ? "개별 슬라이드 내용에 맞는 배경" : "a background chosen for each individual slide",
    });
    const purpose = label("background.purpose", {
      focus: ko ? "내용을 가장 먼저 읽히게" : "keep the content visually primary",
      data: ko ? "표와 차트의 가독성을 우선하도록" : "prioritize table and chart legibility",
      atmosphere: ko ? "내용을 방해하지 않는 범위에서 분위기를 보조하도록" : "support atmosphere without competing with content",
      story: ko ? "제공된 현장·제품·사례를 전달하도록" : "support supplied field, product, or case evidence",
      premium: ko ? "여백과 절제된 깊이를 더하도록" : "add restrained depth and generous whitespace",
      conditional: ko ? "개별 슬라이드 명세에 따라 판단하도록" : "follow the individual slide specification",
    });
    const photo = ["photo", "photoMix"].includes(get("background.type"));
    const result = [ko ? `${type} 배경을 사용해 ${purpose} 구성한다.` : `Use ${type} to ${purpose}.`];
    if (photo) result.push(ko
      ? `사진은 ${label("background.photoRange", { full: "전체", side: "한쪽", top: "상단", bottom: "하단", edge: "가장자리" })} 영역에만 배치하고 전체 면적의 최대 ${get("background.photoMaxAreaPercent")}%로 제한한다. 사진 색감은 ${label("background.saturation", { natural: "자연색", low: "낮은 채도", mono: "흑백" })}, 텍스트 보호는 ${label("background.overlay", { none: "오버레이 없음", light: "약한 오버레이", medium: "중간 오버레이", strong: "강한 오버레이" })}으로 설정한다.`
      : `Place photography only in the ${get("background.photoRange")} region, limit it to ${get("background.photoMaxAreaPercent")}% of the canvas, and use ${get("background.saturation")} saturation with a ${get("background.overlay")} protective overlay.`);
    if (get("background.protectTextAreas")) result.push(ko ? "제목·핵심 수치·출처 등 중요 텍스트 뒤에는 사진이나 복잡한 무늬를 배치하지 않는다." : "Do not place photography or busy patterns behind important titles, key figures, or sources.");
    if (get("background.protectChartAreas")) result.push(ko ? "차트와 표의 배경은 단순한 표면으로 유지하고 사진이나 장식 그래픽을 겹치지 않는다." : "Keep chart and table surfaces simple and free of photos or decorative graphics.");
    if (!compact && get("background.avoidBusyBackground")) result.push(ko ? "그라데이션·도형·사진의 대비와 밀도를 낮춰 배경이 콘텐츠보다 먼저 보이지 않게 한다." : "Keep gradients, shapes, and photos low in contrast and density so the background never overpowers content.");
    return result;
  }

  function headerPromptLines(ko) {
    if (get("header.type") === "none") return [];
    const type = label("header.type", { plain: ko ? "박스 없는 간결한 제목 영역" : "a plain unboxed title area", thinBar: ko ? "상단의 얇은 색상 바" : "a thin top color bar", fullBar: ko ? "상단 전체 색상 바" : "a full-width top color bar", leftRule: ko ? "제목 왼쪽의 세로선" : "a vertical rule beside the title", numberTitle: ko ? "번호와 제목의 조합" : "a number-and-title combination" });
    const align = label("header.align", { left: ko ? "왼쪽" : "left", center: ko ? "가운데" : "center", right: ko ? "오른쪽" : "right" });
    const items = [get("header.showSectionLabel") ? (ko ? "섹션명" : "section label") : "", get("header.showSubtitle") ? (ko ? "짧은 부제" : "short subtitle") : "", get("header.showPageNumber") ? (ko ? "페이지 번호" : "page number") : ""].filter(Boolean);
    const surfaceRole = surfaceRoleLabel(get("header.surfaceRole"), ko);
    const heightPercent = get("header.heightPercent");
    return [
      ko
        ? `슬라이드 상단 ${heightPercent}%를 헤더의 고정 전체 경계로 사용한다. 배경면·모든 텍스트·구분선·상하 안쪽 여백·요소 간격을 이 범위 안에서 비례 조정한다. 전역 제목 크기보다 이 경계를 우선하며 본문 침범이나 헤더 높이 확장은 금지한다.`
        : `Fit the complete header—surface, text, divider, padding, and gaps—inside the fixed top ${heightPercent}%. Scale type and line height to fit; this boundary overrides global headline scale. Never overflow into the body or expand the header.`,
      ko
        ? `헤더는 ${type}, ${surfaceRole} 배경면과 ${align} 정렬로 구성하고 팔레트 조화를 유지한다. ${items.length ? `${items.join("·")}만 표시한다.` : "반복 정보를 추가하지 않고 제목 영역만 확보한다."}`
        : `Use ${type} on ${surfaceRole} with ${align} alignment and palette harmony. ${items.length ? `Show only ${items.join(", ")}.` : "Reserve only the title area without repeated metadata."}`,
      get("header.divider") ? (ko ? "헤더와 본문 사이에는 헤더 경계 안쪽에 얇은 구분선을 사용한다." : "Place a thin divider inside the header boundary between the header and body.") : "",
    ].filter(Boolean);
  }

  function footerPromptLines(ko) {
    if (get("footer.type") === "none") return [];
    const type = label("footer.type", { divider: ko ? "정보 없이 얇은 구분선" : "a thin divider without metadata", source: ko ? "출처 영역" : "a source area", institution: ko ? "기관정보 영역" : "an organization-information area", minimal: ko ? "최소 하단 영역" : "a minimal footer area" });
    const align = label("footer.align", { left: ko ? "왼쪽" : "left", center: ko ? "가운데" : "center", right: ko ? "오른쪽" : "right" });
    const surfaceRole = surfaceRoleLabel(get("footer.surfaceRole"), ko);
    return [ko ? `푸터는 ${type}, ${surfaceRole} 배경면으로 구성하고 높이는 전체의 최대 ${get("footer.heightPercent")}%, 정보는 ${align} 정렬한다. 푸터 표면은 헤더·본문과 독립적으로 운용하되 팔레트 안에서 조화를 유지한다.` : `Use ${type} on ${surfaceRole}, limited to ${get("footer.heightPercent")}% of the slide height, with ${align}-aligned information. Treat the footer as a surface independent from the header and body while keeping palette harmony.`, get("footer.showPageNumber") ? (ko ? "페이지 번호는 푸터에 한 번만 표시한다." : "Show the page number once in the footer.") : "", get("footer.divider") && get("footer.type") !== "divider" ? (ko ? "본문과 푸터 사이에는 얇은 구분선을 사용한다." : "Use a thin divider between the body and footer.") : "", ["source", "institution"].includes(get("footer.type")) ? (ko ? "실제 출처·기관 문구는 개별 슬라이드 명세에 제공된 내용만 사용한다." : "Use only source or organization text supplied by the individual slide specification.") : ""].filter(Boolean);
  }

  function visualResourcePromptLinesV3(ko, compact = false) {
    const resources = [
      ["allowPhotography", ko ? "실사·현장 사진" : "photography and field imagery"],
      ["allowDataVisualization", ko ? "데이터 시각화" : "data visualization"],
      ["allowDiagram", ko ? "과정·관계 다이어그램" : "process and relationship diagrams"],
      ["allowPictogram", ko ? "픽토그램" : "pictograms"],
      ["allowInfographic", ko ? "통합 인포그래픽" : "integrated infographics"],
      ["allowMap", ko ? "지도·공간 정보" : "maps and spatial information"],
      ["allowIllustration", ko ? "일러스트레이션" : "illustration"],
      ["allowTechnical3d", ko ? "기술 3D 비주얼" : "technical 3D visuals"],
      ["allowLayeredComposition", ko ? "다중 레이어 합성" : "multi-layer composition"],
      ["allowTypographicFocus", ko ? "타이포·핵심 수치 중심 표현" : "typographic or key-figure-led expression"],
    ].filter(([key]) => get(`composition.${key}`)).map(([, title]) => title);
    const range = label("composition.resourceRange", { focused: ko ? "선별 활용" : "focused", flexible: ko ? "유연한 활용" : "flexible", expansive: ko ? "폭넓은 활용" : "expansive" });
    const result = resources.length ? [ko
      ? `다음 선택 자원을 ${range} 범위에서 의미 전달에 도움이 되는 슬라이드에 적극 활용할 수 있다: ${resources.join("·")}.`
      : `The following selected resources can be actively used where they strengthen meaning, within a ${range} range: ${resources.join(", ")}.`,
    ko
      ? "개별 슬라이드 명세의 목적·의미 그룹·관계·읽기 우선순위·핵심 강조 이유를 먼저 해석한 뒤, 선택 자원 중 메시지를 가장 강하게 만드는 조합을 사용한다."
      : "Interpret the individual slide's purpose, semantic groups, relationships, reading priority, and reason for emphasis first, then use the selected-resource combination that communicates them most strongly.",
    ko
      ? "개별 명세가 구성 고정을 선언하지 않았다면 의미·수치·관계만 보존하고, 구도·매체·정확한 크기·간격·크롭·중첩·레이어는 이미지 AI가 후보를 비교해 최적화한다."
      : "Unless the individual specification declares a composition lock, preserve only meaning, figures, and relationships; let the image model compare and optimize composition, medium, exact scale, spacing, crop, overlap, and layers."] : [ko
        ? "개별 명세의 의미·관계·정보 위계를 따르며, 이 섹션에서는 별도의 시각 자원 문장을 추가하지 않는다."
        : "Follow the individual specification's meaning, relationships, and information hierarchy; this section adds no separate visual-resource directive."];
    if (get("composition.allowMixedMedia")) result.push(ko ? "서로 다른 자원의 결합은 한 자원만으로 의미가 충분히 전달되지 않을 때 선택할 수 있다." : "Different resources may be combined when one resource alone cannot communicate the meaning clearly enough.");
    if (resources.length) result.push(ko ? "선택 자원을 기계적으로 모두 나열하지 않고 핵심 강조 대상과 증거 관계를 가장 선명하게 만드는 부분집합을 사용한다." : "Use the subset of selected resources that makes the focal emphasis and evidence relationship clearest, instead of mechanically using every resource.");
    return compact ? result.slice(0, 4) : result;
  }

  function designDnaPromptLines(ko, compact = false) {
    const axes = [
      ["authority", designAxisValue("visualDirection.authority")],
      ["energy", designAxisValue("visualDirection.energy")],
      ["expression", designAxisValue("visualDirection.expression")],
      ["rationality", designAxisValue("visualDirection.rationality")],
    ];
    const statement = effectiveDesignStatement();
    const keyword = String(get("visualDirection.conceptKeywords") || "").trim();
    const motif = String(get("visualDirection.signatureMotif") || "").trim();
    const result = [ko
      ? `덱 디자인 선언: ${statement}`
      : `Deck design declaration: ${statement}`,
      ko
        ? `디자인 좌표는 ${axes.map(([, value]) => value).join(" · ")}의 조합이다. 이 조합을 몇 가지 고정 스타일 중 하나로 단순화하지 말고 하나의 고유한 아트 디렉션으로 해석한다.`
        : `Interpret the combined design coordinates—${axes.map(([, value]) => value).join(", ")}—as one distinctive art direction rather than collapsing them into a named preset.`,
      keyword ? (ko ? `핵심 감각 키워드: ${keyword}.` : `Core sensory keywords: ${keyword}.`) : "",
      motif ? (ko ? `반복 모티프: ${motif}. 동일 도형을 복제하기보다 선·면·크롭·레이어·여백의 변주로 기억점을 만든다.` : `Signature motif: ${motif}. Build recognition through variations in line, field, crop, layer, and whitespace rather than duplicating one shape.`) : "",
      get("visualDirection.mediumNameKo") ? (ko ? `보조 표현 기법으로 ${get("visualDirection.mediumNameKo")} (${get("visualDirection.mediumNameEn") || "visual treatment"})를 활용할 수 있다. 디자인 DNA에 맞춰 매체별 적용 강도를 조절하고 모든 요소를 같은 질감으로 덮지 않는다.` : `${get("visualDirection.mediumNameEn") || get("visualDirection.mediumNameKo")} may be used as a supporting treatment. Adapt its intensity by medium under the design DNA rather than coating every element with one texture.`) : "",
    ].filter(Boolean);
    if (!compact) result.push(ko ? "이 디자인 DNA는 덱 전체의 인상과 판단 기준을 통일한다. 표지·목차·간지·본문의 구체적 비주얼 컨셉과 큰 레이아웃은 개별 슬라이드 명세가 페이지 목적에 맞춰 정의한다." : "Use this design DNA to unify the deck-wide impression and decision criteria. The individual slide specification defines the page-specific visual concept and macro layout for covers, agendas, dividers, and body slides.");
    return result;
  }

  function compositionGrammarPromptLines(ko, compact = false) {
    const form = label("composition.formLanguage", { preciseGeometric: ko ? "정밀한 기하 형태" : "precise geometry", softGeometric: ko ? "부드러운 기하 형태" : "soft geometry", organic: ko ? "유기적 형태" : "organic forms", mixed: ko ? "기하와 유기의 혼합" : "a geometric-organic mix" });
    const line = label("composition.lineLanguage", { fineStructural: ko ? "가는 구조선" : "fine structural lines", boldDirectional: ko ? "굵은 방향선" : "bold directional lines", minimalDivider: ko ? "최소 구분선" : "minimal dividers", shapeLed: ko ? "면과 형태 중심" : "shape-led composition" });
    const surface = label("composition.surfaceLanguage", { flat: ko ? "평면 구성" : "flat surfaces", mattePanels: ko ? "매트 패널" : "matte panels", controlledLayer: ko ? "절제된 다층" : "controlled layering", material: ko ? "선택적 재질감" : "selective materiality" });
    const rhythm = label("composition.spatialRhythm", { ordered: ko ? "질서형 리듬" : "ordered rhythm", asymmetricEditorial: ko ? "비대칭 에디토리얼 리듬" : "asymmetric editorial rhythm", modular: ko ? "모듈형 리듬" : "modular rhythm", flowing: ko ? "연속 흐름형 리듬" : "flowing rhythm" });
    const hierarchy = label("composition.hierarchyBehavior", { scalePosition: ko ? "크기와 위치" : "scale and position", colorScale: ko ? "색상과 크기" : "color and scale", layerPosition: ko ? "레이어와 위치" : "layer and position", whitespaceScale: ko ? "여백과 크기" : "whitespace and scale" });
    const primary = label("composition.primaryVisualLanguage", { adaptive: ko ? "페이지 의미에 따른 선택" : "meaning-led selection", data: ko ? "데이터 시각화" : "data visualization", diagram: ko ? "다이어그램" : "diagrams", photo: ko ? "실사" : "photography", typography: ko ? "타이포그래피" : "typography", illustration: ko ? "일러스트레이션" : "illustration", technical3d: ko ? "기술 3D" : "technical 3D", map: ko ? "지도" : "maps" });
    const secondaryValue = get("composition.secondaryVisualLanguage");
    const secondary = label("composition.secondaryVisualLanguage", { none: ko ? "지정하지 않음" : "not specified", adaptive: ko ? "필요할 때 의미에 따라 선택" : "meaning-led selection only when needed", data: ko ? "데이터 시각화" : "data visualization", diagram: ko ? "다이어그램" : "diagrams", photo: ko ? "실사" : "photography", typography: ko ? "타이포그래피" : "typography", illustration: ko ? "일러스트레이션" : "illustration", technical3d: ko ? "기술 3D" : "technical 3D", map: ko ? "지도" : "maps" });
    const freedom = label("composition.layoutFreedom", { low: ko ? "개별 명세가 구성 고정을 선언한 경우 그 구조까지 보존" : "preserve the declared composition when an individual slide explicitly locks it", medium: ko ? "의미 그룹과 읽기 방향만 안내하고 실제 구도는 위임" : "treat semantic groups and reading direction as guidance while delegating the actual composition", high: ko ? "의미·수치·관계만 고정하고 서로 다른 구도 후보를 비교해 위임" : "lock only meaning, figures, and relationships while comparing materially different composition candidates" });
    const density = label("composition.density", { airy: ko ? "넓은 여백과 단일 초점" : "broad whitespace with one focal anchor", balanced: ko ? "근거와 여백의 균형" : "balanced evidence and whitespace", dense: ko ? "다수 근거를 정돈한 고밀도" : "organized high-density evidence" });
    const container = get("composition.container");
    const objectGrammar = container === "cards"
      ? (ko ? "독립 정보 단위는 카드로 명확히 묶되 핵심 카드의 면적과 깊이를 키우고, 보조 근거는 경계 없는 그룹이나 색면으로 연결해 동일 카드의 기계적 반복을 피한다." : "Group independent information units as clear cards, enlarge the focal card, and connect supporting evidence through borderless groups or color fields instead of repeating equal cards.")
      : container === "borderless"
        ? (ko ? "정보 그룹은 카드 외곽선보다 정렬·여백·타이포그래피·색상 밴드·이미지 크롭으로 구분하고, 필요한 핵심 정보면에만 국부 표면을 사용한다." : "Separate information groups through alignment, whitespace, typography, color bands, and image crops rather than card outlines; reserve local surfaces for focal information only.")
        : (ko ? "카드·경계 없는 그룹·색상 밴드·크롭 이미지·여백을 역할에 따라 혼합하고 핵심 블록·근거 블록·보조 블록의 면적과 깊이를 위계에 맞게 달리한다." : "Mix cards, borderless groups, color bands, cropped imagery, and whitespace by role; vary the area and depth of focal, evidence, and supporting blocks by hierarchy.");
    const result = [ko
      ? `시각 문법은 ${form}, ${line}, ${surface}, ${rhythm}을 결합하고 ${hierarchy}로 정보 위계를 만든다.`
      : `Combine ${form}, ${line}, ${surface}, and ${rhythm}; create hierarchy primarily through ${hierarchy}.`,
      ko ? `일관성 앵커: ${get("composition.consistencyAnchor")}.` : `Consistency anchors: ${get("composition.consistencyAnchor")}.`,
      ko ? `AI 구성 위임 원칙: ${get("composition.variationRule")}. 위임 범위는 ${freedom}, 정보 호흡은 ${density}. 표시 콘텐츠가 적을수록 개체 수를 늘리지 않고 하나의 핵심 비주얼·타이포그래피·공간 제스처의 스케일·깊이·대비를 강화한다.` : `AI composition delegation: ${get("composition.variationRule")}. Use ${freedom} with ${density}. As display content decreases, strengthen the scale, depth, and contrast of one focal visual, typographic statement, or spatial gesture without adding more objects.`,
      objectGrammar,
      secondaryValue === "none"
        ? (ko ? `주 시각 언어는 ${primary}이며 보조 언어를 고정하지 않는다. 필요한 경우에만 다음 원칙으로 다른 매체를 결합한다: ${get("composition.combinationPrinciple")}.` : `The primary visual language is ${primary}; do not lock a secondary language. Add another medium only when needed under this principle: ${get("composition.combinationPrinciple")}.`)
        : (ko ? `주·보조 시각 언어는 ${primary}와 ${secondary}이며, 결합 원칙은 다음과 같다: ${get("composition.combinationPrinciple")}.` : `Primary and secondary visual languages are ${primary} and ${secondary}. Combination principle: ${get("composition.combinationPrinciple")}.`),
    ];
    return compact ? result.slice(0, 4) : result;
  }

  function imageGraphicLanguagePromptLines(ko) {
    const role = label("photoComposite.visualRole", { evidence: ko ? "증거" : "evidence", explanation: ko ? "설명" : "explanation", context: ko ? "맥락 형성" : "context building", concept: ko ? "개념 은유" : "conceptual metaphor", atmosphere: ko ? "분위기 조성" : "atmosphere" });
    const layer = label("photoComposite.layerLogic", { contextEvidenceAnnotation: ko ? "배경 맥락 → 핵심 증거 → 설명 주석" : "background context → key evidence → explanatory annotation", heroData: ko ? "히어로 이미지 → 데이터 오버레이" : "hero image → data overlay", diagramObject: ko ? "설명 구조 → 실사·3D 대상" : "explanatory structure → photo or 3D subject", editorialCollage: ko ? "의미 단위의 에디토리얼 콜라주" : "meaning-led editorial collage", adaptive: ko ? "페이지 목적에 따른 적응형" : "page-adaptive layering" });
    const blend = label("photoComposite.styleBlend", { controlledHybrid: ko ? "매체별 고유성을 보존하는 절제된 혼합" : "a controlled hybrid that preserves each medium", unifiedMaterial: ko ? "공통 재질감의 느슨한 통일" : "loose unification through shared materiality", contrastMedia: ko ? "매체 대비의 적극 활용" : "deliberate contrast between media", adaptive: ko ? "내용에 따른 결합 강도" : "content-adaptive blending" });
    return [ko ? `이미지와 그래픽의 공통 역할은 ${role}이며, 기본 레이어 논리는 ${layer}, 화풍 결합은 ${blend}이다.` : `The deck-wide role of imagery and graphics is ${role}; use ${layer} as the base layer logic and ${blend} for style blending.`, ko ? "페이지별 피사체·데이터·다이어그램 유형·레이어 역할은 개별 슬라이드 명세에서만 결정한다. 사진·데이터·지도·3D·타이포그래피를 같은 질감이나 단일 색조로 덮지 않는다." : "Page-specific subjects, data, diagram types, and layer roles come only from the individual slide specification. Do not wash photography, data, maps, 3D, and typography into one texture or hue."];
  }

  function backgroundCapabilityPromptLinesV3(ko, compact = false) {
    const type = label("background.type", { solid: ko ? "단색" : "solid color", lightNeutral: ko ? "밝은 중성" : "light neutral", gradient: ko ? "절제된 그라데이션" : "restrained gradient", geometric: ko ? "낮은 대비 기하학" : "low-contrast geometric", conditional: ko ? "슬라이드별 선택" : "slide-adaptive" });
    const purpose = label("background.purpose", { focus: ko ? "내용 집중" : "content focus", data: ko ? "정보 관계 보호" : "information legibility", atmosphere: ko ? "분위기 보조" : "atmospheric support", premium: ko ? "절제된 깊이" : "restrained depth", conditional: ko ? "의미별 판단" : "meaning-led choice" });
    const intensity = label("background.intensity", { restrained: ko ? "절제형" : "restrained", balanced: ko ? "균형형" : "balanced", expressive: ko ? "표현형" : "expressive" });
    const separation = Math.max(1, Math.min(5, Number(get("background.zoneSeparation")) || 4));
    const densityGuide = get("background.avoidBusyBackground") ? (ko ? " 배경 장식 밀도는 낮게 유지한다." : " Keep background decoration low-density.") : "";
    const result = [ko
      ? `${type}을 기본 배경 성격으로 활용할 수 있으며 목적은 ${purpose}, 표현 범위는 ${intensity}이다. 이는 슬라이드별 선택 기준이다.${densityGuide}`
      : `${type} is available as the default background character for ${purpose}, with a ${intensity} expressive range. This is a slide-level repertoire.${densityGuide}`];
    result.push(separation >= 4
      ? (ko ? `배경은 ${zoneSeparationLabel(separation)}으로 운용한다. 헤더·본문·푸터와 핵심 정보면에 서로 다른 조화 표면을 배정하고 Primary·Secondary 틴트, 중성면, 필요한 국부 명암면을 함께 사용해 영역별 리듬을 만든다.` : `Use ${zoneSeparationLabel(separation, false)}. Assign coordinated but distinct surfaces to the header, body, footer, and focal information zones; combine Primary and Secondary tints, neutrals, and local light or dark fields to create sectional rhythm.`)
      : (ko ? `배경은 ${zoneSeparationLabel(separation)}으로 운용하되 핵심 정보면과 프레임 영역에는 읽기와 위계에 도움이 되는 국부 톤 차이를 사용할 수 있다.` : `Use ${zoneSeparationLabel(separation, false)}, with local tonal shifts available for focal information and framing zones when they improve hierarchy and readability.`));
    if (get("background.blur") !== "none") {
      const blur = get("background.blur") === "medium" ? (ko ? "분명한 국부 흐림" : "clear localized blur") : (ko ? "은은한 국부 흐림" : "subtle localized blur");
      result.push(ko ? `${blur}은 사진·재질·깊이 배경의 작은 영역에만 적용할 수 있으며 헤더·본문·푸터 전체나 텍스트·수치·도형에는 적용하지 않는다.` : `${blur} may be applied only to small photographic, material, or depth-background regions, never across full header, body, or footer surfaces or over text, figures, and shapes.`);
    }
    if (isBackgroundPhotoActive()) {
      const photoMode = get("background.photoMode") === "preferred" ? (ko ? "맥락 전달에 도움이 되면 우선 검토하는 자원" : "a preferred resource when it improves context") : (ko ? "개별 명세에 관련 근거가 있을 때 선택하는 자원" : "an optional resource when supported by the individual specification");
      const saturation = label("background.photoSaturation", { natural: ko ? "자연색" : "natural color", low: ko ? "절제된 저채도" : "restrained low saturation", mono: ko ? "흑백" : "monochrome" });
      const overlay = label("background.photoOverlay", { none: ko ? "장면의 크롭과 여백" : "scene crop and negative space", light: ko ? "약한 국부 보호" : "light localized protection", medium: ko ? "분명한 국부 보호" : "clear localized protection", strong: ko ? "강한 국부 보호" : "strong localized protection" });
      result.push(ko ? `실사 배경은 ${photoMode}이며 ${saturation}으로 활용할 수 있다. 이미지 AI가 설득 목적에 맞춰 장면·크롭·깊이·레이어를 선택하고 텍스트 영역은 ${overlay} 방식으로 보호한다.` : `Photographic backgrounds are ${photoMode} with ${saturation} treatment. The image model chooses scene, crop, depth, and layering according to the persuasion goal and protects text zones through ${overlay}.`);
      if (get("background.photoAllowContextScene")) result.push(ko ? "구체적 사진 대상이 없으면 개별 명세의 의미에서 직접 도출되는 일반 맥락 장면만 사용할 수 있으며 특정 시설·기관·사건을 실제 증거처럼 만들지 않는다." : "When no specific photo subject is supplied, only a general context scene directly derived from the semantic brief is available; never fabricate a specific facility, organization, or event as evidence.");
      if (get("background.photoProtectText")) result.push(ko ? "텍스트 가독성은 크롭·여백·국부 대비·보호 처리 중 장면에 가장 자연스러운 방법으로 확보한다." : "Protect text readability through whichever method best suits the scene: crop, negative space, local contrast, or localized protective treatment.");
      if (get("background.photoRealism")) result.push(ko ? "합성 장면의 원근·스케일·조명·색온도는 주변 디자인과 자연스럽게 맞춘다." : "Match perspective, scale, lighting, and color temperature naturally across the composited scene and surrounding design.");
    }
    return compact ? result.slice(0, 5) : result;
  }

  function photoCapabilityPromptLinesV3(ko, compact = false) {
    if (!isPhotoCompositeActive()) return [];
    const style = label("photoComposite.style", { adaptive: ko ? "내용별 최적 표현" : "content-adaptive treatment", natural: ko ? "자연스러운 실사" : "natural photography", editorial: ko ? "에디토리얼 사진" : "editorial photography", technical: ko ? "기술·산업 이미지" : "technical or industrial imagery" });
    const mode = get("photoComposite.mode") === "preferred" ? (ko ? "설득력이 높아지면 우선 검토하는 자원" : "a preferred resource when it improves persuasion") : (ko ? "관련 피사체나 근거가 있을 때 선택하는 자원" : "an optional resource when a relevant subject or evidence is supplied");
    const result = [ko
      ? `콘텐츠 이미지는 ${style}의 ${mode}이며 의무가 아니다. 실제 피사체·사실·증거 역할은 개별 슬라이드의 의미 명세를 따른다.`
      : `Content imagery uses ${style} as ${mode} and is not mandatory. Its subject, factual status, and evidence role come from the individual slide's semantic brief.`,
    ko
      ? "이미지 AI가 설득 목적에 따라 사진의 사용 여부, 히어로·배경·보조 증거 역할, 크롭, 크기, 위치와 다른 시각 자원과의 결합을 결정한다."
      : "The image model decides whether to use photography and chooses its hero, background, or supporting-evidence role, crop, scale, position, and combination with other visual resources according to the persuasion goal."];
    if (get("photoComposite.allowContextScene")) result.push(ko ? "구체적 대상이 없을 때는 명세의 의미에서 직접 도출되는 일반 맥락 장면만 사용할 수 있으며 이를 실제 사례나 성과 증거처럼 표현하지 않는다." : "When no specific subject is supplied, only a general context scene directly derived from the brief is available; never present it as an actual case or performance evidence.");
    if (get("photoComposite.dropWhenDense")) result.push(ko ? "다른 표현이 의미를 더 빠르고 정확하게 전달하면 사진을 생략할 수 있다." : "Photography may be omitted when another form communicates the meaning faster and more accurately.");
    if (get("photoComposite.realism")) result.push(ko ? "이미지 합성은 피사체 간 원근·스케일·조명·그림자와 색온도를 자연스럽게 일치시킨다." : "Match perspective, scale, lighting, shadows, and color temperature naturally across composited imagery.");
    return compact ? result.slice(0, 3) : result;
  }

  function visualCompositionPromptLinesV2(ko, compact = false) {
    const energy = label("composition.energy", { stable: ko ? "안정적" : "stable", balanced: ko ? "통제된 역동성" : "controlled dynamism", dynamic: ko ? "역동적" : "dynamic" });
    const grid = label("composition.grid", { symmetric: ko ? "대칭 그리드" : "a symmetric grid", modular: ko ? "모듈형 그리드" : "a modular grid", asymmetricModular: ko ? "비대칭 모듈 그리드" : "an asymmetric modular grid", editorial: ko ? "에디토리얼 그리드" : "an editorial grid" });
    const whitespace = Math.max(12, Number(get("composition.whitespacePercent")) || 24);
    const focalArea = Math.max(25, Number(get("composition.focalAreaPercent")) || 40);
    const majorGap = Math.max(2, Number(get("composition.majorGapPercent")) || 3);
    const relatedGap = Math.max(1, Number(get("composition.relatedGapPercent")) || 1);
    const padding = Math.max(1, Number(get("composition.panelPaddingPercent")) || 2);
    const zones = Math.min(5, Math.max(2, Number(get("composition.semanticZones")) || 4));
    const focalRatio = Number(get("composition.focalScaleRatio")) || 1.7;
    const layerCount = Math.min(5, Math.max(3, Number(get("composition.layerCount")) || 4));
    const result = [
      ko ? `${energy} 에너지와 ${grid}를 사용해 제목 → 핵심 결론 → 근거 → 출처의 읽기 순서를 분명하게 만든다.` : `Use ${energy} energy and ${grid}, with a clear reading order of title → key conclusion → evidence → source.`,
      ko ? `렌더링 전에 캔버스를 최대 ${zones}개의 의미 영역으로 나누고, 전체의 약 ${whitespace}%는 보호 여백으로 남긴다. 주영역은 약 ${focalArea}%를 차지하게 하며, 일반 요소보다 약 ${focalRatio}배 크게 보여 초점 하나를 만든다.` : `Before rendering, partition the canvas into at most ${zones} semantic zones and reserve about ${whitespace}% as protected negative space. Give the primary zone about ${focalArea}% of the canvas and make one focal anchor roughly ${focalRatio}× larger than ordinary elements.`,
      ko ? `서로 다른 의미 영역 사이는 캔버스의 약 ${majorGap}%, 같은 그룹 안의 연관 요소 사이는 약 ${relatedGap}%, 패널 내부 여백은 약 ${padding}%를 기준으로 한다. 연관 요소 간격은 영역 간격보다 항상 작게 유지한다.` : `Use about ${majorGap}% of the canvas between distinct semantic zones, about ${relatedGap}% between related elements within a group, and about ${padding}% internal panel padding. Related-element spacing must remain visibly smaller than inter-zone spacing.`,
    ];
    const container = get("composition.container");
    if (container === "cards") result.push(ko ? "카드는 독립된 정보 단위에만 사용하고, 모든 내용을 같은 크기의 카드로 만들지 않는다. 핵심 카드 하나와 경계 없는 보조 그룹을 함께 사용한다." : "Use cards only for truly independent information units; never put every item into equal cards. Pair one focal card with borderless supporting groups.");
    else if (container === "borderless") result.push(ko ? "외곽선 카드보다 타이포그래피, 정렬, 여백, 색면과 이미지 크롭으로 정보 그룹을 구분한다." : "Separate information primarily through typography, alignment, whitespace, color fields, and image crops rather than outlined cards.");
    else result.push(ko ? "카드, 경계 없는 정보 그룹, 색상 밴드, 크롭된 이미지와 여백을 혼합하되 각 컨테이너는 서로 다른 의미 역할을 맡긴다." : "Mix cards, borderless information groups, color bands, cropped imagery, and whitespace, assigning a distinct semantic role to each container type.");
    if (get("composition.repetition") !== "uniform") result.push(ko ? "반복 요소는 핵심 항목의 크기·위치·면적을 변주해 기계적인 나열을 피한다." : "Vary the scale, position, or area of focal repeated elements to avoid mechanical repetition.");
    const layerRoles = layerCount === 3
      ? (ko ? "기반 배경 → 근거·맥락 → 초점·주석" : "substrate background → evidence/context → focal anchor/annotation")
      : layerCount === 4
        ? (ko ? "기반 배경 → 맥락 장면·데이터 지형 → 근거 구조 → 초점·정밀 주석" : "substrate background → context scene/data terrain → evidence structure → focal anchor/precise annotation")
        : (ko ? "기반 배경 → 저대비 깊이 → 맥락 장면·데이터 지형 → 근거 구조 → 초점·정밀 주석" : "substrate background → low-contrast depth → context scene/data terrain → evidence structure → focal anchor/precise annotation");
    result.push(ko ? `${layerCount}개 의미 레이어를 ${layerRoles} 순서로 사용한다. 레이어마다 정보 역할을 부여하고 단순 도형을 장식 목적으로 쌓지 않는다.` : `Use ${layerCount} semantic layers in this order: ${layerRoles}. Give every layer an information role; do not stack simple shapes merely as decoration.`);
    if (get("composition.depth") !== "flat" || get("composition.overlap") !== "none") result.push(ko ? "중첩은 레이어 관계와 시선 유도에만 제한적으로 사용하며, 텍스트·수치·표·차트의 읽기 영역을 침범하지 않는다." : "Use overlap only to clarify layer relationships and guide attention; never intrude on readable text, figures, tables, or charts.");
    if (get("composition.flow") !== "linear") result.push(ko ? "프로세스와 관계도는 내용에 맞는 곡선·대각·적응형 흐름을 사용하고, 단순 화살표와 동일 상자의 일렬 반복으로 축소하지 않는다." : "For processes and relationship diagrams, use content-appropriate curved, diagonal, or adaptive flow instead of simple arrows between repeated equal boxes.");
    const pairing = {
      single: ko ? "하나의 주 매체만 사용하고 그래픽 문법을 통일한다." : "Use one primary medium and keep its graphic grammar consistent.",
      contextAnnotation: ko ? "자연색 실사·지도·현장 맥락을 한 개의 주 레이어로 사용하고 정밀한 2D 벡터·데이터 주석을 결합한다." : "Use natural-color photography, mapping, or field context as one primary layer and combine it with precise 2D vector or data annotation.",
      dataDiagram: ko ? "데이터 시각화를 주 매체로 두고 설명 다이어그램·궤적·주석 중 한 종류만 보조 매체로 결합한다." : "Use data visualization as the primary medium and pair it with only one supporting medium: explanatory diagrams, trajectories, or annotation.",
      technicalHybrid: ko ? "절제된 3D 기술 오브젝트·재질 표현을 한 개의 주 피사체로 두고 2D 도식·데이터 오버레이를 결합한다." : "Use one restrained 3D technical object or material study as the primary subject and combine it with 2D schematic or data overlays.",
      editorialHybrid: ko ? "사진 크롭·종이 질감·에디토리얼 일러스트 중 하나를 주 매체로 두고 강한 타이포 위계와 소형 데이터 주석을 결합한다." : "Use one of photographic crops, paper texture, or editorial illustration as the primary medium, paired with strong typographic hierarchy and small data annotations.",
    }[get("composition.mediumPairing")];
    if (pairing) result.push(pairing);
    const freedom = get("composition.layoutFreedom");
    if (freedom === "low") result.push(ko ? "개별 명세가 ‘구성 고정’을 명시한 페이지에서는 의미 그룹과 큰 구도를 보존하고 국부 간격·크롭·표면·마감만 최적화한다." : "When an individual slide explicitly declares a composition lock, preserve its semantic groups and macro composition while optimizing only local spacing, crop, surfaces, and finish.");
    else if (freedom === "high") result.push(ko ? "개별 명세의 의미·수치·관계·강조 우선순위만 고정한다. 렌더링 전에 매체와 공간 구조가 실질적으로 다른 구도 후보 2~3개를 비교해 설득력이 가장 높은 하나를 선택한다." : "Lock only the individual slide's meaning, figures, relationships, and emphasis priority. Before rendering, compare two or three materially different medium and spatial-composition candidates and choose the most persuasive one.");
    else result.push(ko ? "개별 명세의 의미 그룹·주 읽기 방향·핵심 강조 순서를 가이드로 사용한다. 정확한 분할, 위치, 크기, 매체와 시각 은유는 이미지 AI가 비교해 결정한다." : "Use the individual slide's semantic groups, primary reading direction, and emphasis order as guidance. Let the image model compare and decide the exact partition, position, scale, medium, and visual metaphor.");
    result.push(get("composition.iconEnabled") ? (ko ? "아이콘은 항목·단계·관계를 빠르게 구분할 때만 간결하게 사용하며, 텍스트나 수치를 대체하지 않는다." : "Use concise icons only to distinguish items, steps, or relationships; never use them as substitutes for text or figures.") : (ko ? "아이콘을 사용하지 않는다." : "Do not use icons."));
    if (get("composition.meaningfulGraphics")) result.push(ko ? "정보 관계와 시선 유도를 설명하는 선, 면, 밴드, 궤적은 허용하되 내용과 무관한 장식은 사용하지 않는다." : "Allow lines, fields, bands, and trajectories that explain relationships or guide attention, but do not add unrelated decoration.");
    if (!compact && get("composition.layoutDiversity")) result.push(ko ? `같은 레이아웃 계열을 ${Math.max(1, Number(get("composition.maxConsecutiveLayout")) || 2)}장보다 길게 반복하지 않고 콘텐츠 유형에 맞춰 초점 구도를 변주한다.` : `Do not repeat the same layout family for more than ${Math.max(1, Number(get("composition.maxConsecutiveLayout")) || 2)} consecutive slides; vary focal composition by content type.`);
    return result;
  }

  function backgroundPromptLinesV2(ko, compact = false) {
    const type = label("background.type", { solid: ko ? "단색" : "solid color", lightNeutral: ko ? "밝은 중성" : "light neutral", gradient: ko ? "절제된 저대비 그라데이션" : "a restrained low-contrast gradient", geometric: ko ? "낮은 대비의 기하학 형태" : "low-contrast geometric forms", conditional: ko ? "개별 슬라이드에 맞는 배경" : "a background chosen for each individual slide" });
    const purpose = label("background.purpose", { focus: ko ? "내용을 가장 먼저 읽히게" : "keep content visually primary", data: ko ? "정보 관계의 가독성을 우선하도록" : "prioritize information legibility", atmosphere: ko ? "분위기를 은은하게 보조하도록" : "support atmosphere without competing with content", premium: ko ? "여백과 절제된 깊이를 더하도록" : "add restrained depth and whitespace", conditional: ko ? "개별 슬라이드 명세에 따라 판단하도록" : "follow the individual slide specification" });
    const result = [ko ? `${type} 배경을 사용해 ${purpose} 구성한다. 표현 강도는 ${get("background.opacity")}%를 넘지 않게 유지한다.` : `Use ${type} to ${purpose}, keeping the treatment at no more than ${get("background.opacity")}% intensity.`];
    if (get("background.blur") !== "none") result.push(ko ? "배경 요소는 은은하게 흐려 콘텐츠와 경쟁하지 않게 한다." : "Blur background elements subtly so they never compete with content.");
    if (isBackgroundPhotoActive()) {
      const mode = get("background.photoMode") === "preferred"
        ? (ko ? "내용 이해나 분위기 형성에 도움이 될 때 일반 맥락의 실사 배경을 자동으로 추가한다" : "automatically add a general-context photographic background when it improves comprehension or atmosphere")
        : (ko ? "개별 슬라이드 명세에 배경 사진 대상이나 지시가 있을 때만 실사 배경을 사용한다" : "use a photographic background only when the individual slide specification supplies a background subject or instruction");
      const saturation = label("background.photoSaturation", { low: ko ? "저채도" : "low-saturation", mono: ko ? "흑백" : "monochrome", natural: ko ? "자연색" : "natural-color" });
      const overlay = label("background.photoOverlay", { none: ko ? "오버레이 없이" : "without an overlay", light: ko ? "약한 보호 오버레이" : "with a light protective overlay", medium: ko ? "중간 보호 오버레이" : "with a medium protective overlay", strong: ko ? "강한 보호 오버레이" : "with a strong protective overlay" });
      result.push(ko ? `실사 배경은 ${mode}. 사진은 ${saturation}으로 처리하고 ${overlay}를 적용한다.` : `For photographic backgrounds, ${mode}. Treat the image as ${saturation} and ${overlay}.`);
      if (get("colors.preservePhotoLocalColor") && get("background.photoSaturation") === "natural") result.push(ko ? "자연색 사진은 하늘·식생·피부·금속·건축 재료의 국부 색상 차이를 보존한다. 브랜드 팔레트는 사진 위의 프레임·주석·데이터 요소에 적용하고 사진 자체를 단일 색조로 바꾸지 않는다." : "For natural-color photography, preserve local color differences in sky, vegetation, skin, metal, and architectural materials. Apply the brand palette to frames, annotations, and data elements over the image; do not recolor the photograph into one hue.");
      if (get("colors.forbidGlobalHueWash")) result.push(ko ? "보호 오버레이는 제목·본문이 놓이는 국부 영역에 그라데이션 마스크로 제한하고 사진 전체에 동일 색조 워시를 적용하지 않는다." : "Limit protective overlays to local title and copy zones with gradient masks; never apply a uniform hue wash across the entire photograph.");
      const layerMode = get("background.photoLayerMode");
      if (layerMode !== "single") {
        const maxImages = Math.min(4, Math.max(2, Number(get("background.photoLayerMaxImages")) || 3));
        const layout = label("background.photoLayerLayout", {
          adaptive: ko ? "내용에 맞는 레이어 구성" : "a content-adaptive layered composition",
          diagonalRibbon: ko ? "대각 리본 프레임" : "diagonal ribbon frames",
          edgeCollage: ko ? "가장자리 콜라주" : "an edge collage",
          splitFrames: ko ? "분할 프레임" : "split frames",
          topRibbon: ko ? "상단 이미지 리본" : "a top image ribbon",
        });
        const depth = label("background.photoLayerDepth", { flat: ko ? "평면 정렬" : "flat alignment", subtle: ko ? "은은한 깊이" : "subtle depth", layered: ko ? "절제된 프레임 중첩" : "restrained frame overlap" });
        const trigger = layerMode === "multi"
          ? (ko ? `서로 다른 실사 이미지를 최대 ${maxImages}장 사용한다` : `use up to ${maxImages} distinct photographic images`)
          : (ko ? `개별 명세에 서로 다른 장면·행사·단계가 두 개 이상 있을 때만 최대 ${maxImages}장의 다중 레이어를 사용하고, 그렇지 않으면 한 장으로 유지한다` : `use up to ${maxImages} photographic layers only when the individual specification contains at least two distinct scenes, events, or stages; otherwise keep a single image`);
        result.push(ko ? `다중 실사 배경은 ${trigger}. 대표 장면 한 장을 주 레이어로 두고 나머지는 보조 레이어로 배치하며, ${layout}과 ${depth}로 하나의 배경처럼 통합한다.` : `For a multi-image photographic background, ${trigger}. Use one dominant scene as the primary layer and the remaining images as supporting layers, integrating them as one background through ${layout} and ${depth}.`);
        result.push(ko ? "각 레이어는 개별 명세의 서로 다른 내용·단계·현장 맥락과 직접 연결하고, 사진 벽처럼 균등 나열하거나 카드형 내부 콘텐츠로 오인되게 만들지 않는다." : "Tie each layer directly to a distinct supplied topic, stage, or field context; do not arrange them as an equal photo wall or make them resemble content cards.");
        if (get("background.photoLayerAvoidDuplication")) result.push(ko ? "같은 사진이나 유사 장면을 여러 레이어에 반복하지 않고, 레이어 사이의 경계·마스크·투명도를 정교하게 정리한다." : "Do not repeat the same or near-identical scene across layers; refine boundaries, masks, and opacity transitions precisely.");
      }
      if (get("background.photoAllowContextScene")) result.push(ko ? "구체적 배경 피사체가 없으면 제공된 제목과 본문에 직접 연결되는 일반 장면만 도출하고, 특정 인물·기관·시설·제품·사건을 실제 증거처럼 만들지 않는다." : "When no background subject is supplied, derive only a general scene directly tied to the supplied title and body; never fabricate a specific person, organization, facility, product, or event as evidence.");
      if (get("background.photoProtectText")) result.push(ko ? "제목·핵심 수치·출처가 놓이는 영역은 단순하고 대비가 안정적인 여백으로 보호한다." : "Protect title, key-figure, and source zones with simple, reliably contrasted negative space.");
      if (!compact && get("background.photoRealism")) result.push(ko ? "사진의 원근·스케일·조명·색온도를 슬라이드 디자인과 일관되게 맞춘다." : "Match the photograph's perspective, scale, lighting, and color temperature to the slide design.");
    } else {
      result.push(ko ? "배경에는 실사 사진을 사용하지 않는다." : "Do not use photography in the background.");
    }
    if (!compact && get("background.avoidBusyBackground")) result.push(ko ? "복잡한 무늬, 과도한 대비와 고밀도 장식으로 배경이 콘텐츠보다 먼저 보이지 않게 한다." : "Prevent busy patterns, excessive contrast, or dense decoration from making the background more prominent than the content.");
    return result;
  }

  function photoCompositePromptLinesV2(ko, compact = false) {
    if (!isPhotoCompositeActive()) return [ko ? "콘텐츠 내부에는 실사 사진을 사용하지 않는다. 배경 사진은 배경 시스템 규칙을 따른다." : "Do not use photography inside the content area. Background photography follows the background-system rules."];
    const primary = get("photoComposite.primary");
    const secondary = get("photoComposite.secondary");
    const mode = get("photoComposite.mode");
    const role = label("photoComposite.visualRole", { evidence: ko ? "증거" : "evidence", explanation: ko ? "설명" : "explanation", context: ko ? "맥락 제공" : "context", concept: ko ? "개념 은유" : "conceptual metaphor", atmosphere: ko ? "분위기" : "atmosphere" });
    const modeText = mode === "required" ? (ko ? "사진 사용 안 함을 명시한 슬라이드를 제외하고 관련 실사를 반드시 사용한다" : "require related photography except on slides explicitly marked photo-free") : mode === "preferred" ? (ko ? "내용 이해나 메시지 전달에 도움이 필요할 경우 관련 실사 이미지를 자동으로 추가해 사용한다" : "automatically add related photography whenever it helps content comprehension or message delivery") : (ko ? "개별 명세에 사진 대상이나 실사 정책이 있을 때만 사용한다" : "use photography only when the individual specification provides a subject or photo policy");
    const target = { accent: ko ? "포인트 보조 컷" : "an accent supporting cut", card: ko ? "카드·섹션 보조 영역" : "a card or section-support region", hero: ko ? "대형 히어로 영역" : "a large hero region" };
    const result = [ko ? `콘텐츠 내부 실사 합성은 ${modeText}. 역할은 ${role}이며, 주 적용 영역은 ${target[primary]}${secondary !== "none" ? `, 보조 영역은 ${target[secondary]}` : ""}으로 제한한다. 배경 사진에는 이 규칙을 적용하지 않는다.` : `For photography inside the content area, ${modeText}. Its role is ${role}; use ${target[primary]} as the primary region${secondary !== "none" ? ` and ${target[secondary]} as an optional secondary region` : ""}. Do not apply these rules to background photography.`];
    if (get("photoComposite.dropWhenDense")) result.push(ko ? "정보가 많거나 요소가 경쟁하면 보조 실사를 먼저 생략하고 텍스트·수치·관계의 가독성을 우선한다." : "When information is dense or elements compete, omit secondary photography first and prioritize readable text, figures, and relationships.");
    if (get("photoComposite.protectText")) result.push(ko ? "중요 제목·수치·출처는 사진 위가 아닌 독립된 읽기 영역에 둔다." : "Keep important titles, figures, and sources in independent readable areas rather than over photography.");
    if (get("photoComposite.protectData")) result.push(ko ? "데이터가 필요한 표·차트 영역에는 사진을 겹치지 않고 단순한 표면을 유지한다." : "Keep photography away from data tables and charts, preserving simple readable surfaces.");
    if (!compact && get("photoComposite.realism")) result.push(ko ? "콘텐츠 내부 사진의 원근·스케일·조명·그림자·색온도를 주변 디자인과 일관되게 맞춘다." : "Match the perspective, scale, lighting, shadows, and color temperature of content-area photography to the surrounding design.");
    return result;
  }

  function scopeText(ko) {
    const proactivePhoto = ["preferred", "required"].includes(get("photoComposite.mode")) || get("background.photoMode") === "preferred";
    if (proactivePhoto) return ko
      ? "이 공통 프롬프트는 발표자료 전체의 디자인 가이드만 정의한다. 발표 맥락은 별도 계층으로, 실제 제목·본문·사실·수치·차트 내용·라벨·출처·관계 의미·페이지별 설득 전략은 개별 슬라이드 명세로 전달한다. 의미·사실·수치·관계는 보존하되, 명시적 구성 잠금이 없으면 구도와 매체는 이미지 AI가 결정한다. 실사 피사체가 없을 때에는 명세의 의미와 직접 연결되는 일반 맥락 장면만 도출할 수 있으며 이를 새로운 사실이나 증거로 표현하지 않는다."
      : "This common prompt defines only the deck-wide design guide. Presentation context is supplied as a separate layer; actual titles, body copy, facts, figures, chart content, labels, captions, sources, semantic relationships, and page-specific persuasion strategy come from the individual slide specification. Preserve meaning, facts, figures, and relationships, but let the image model decide composition and medium unless an explicit composition lock is present. When no photo subject is supplied, only a general context scene directly tied to the supplied meaning may be derived; never present it as new evidence.";
    return ko
      ? "이 공통 프롬프트는 발표자료 전체의 디자인 가이드만 정의한다. 발표 맥락은 별도 계층으로, 실제 제목·본문·사실·수치·차트 내용·이미지 주제·라벨·출처·관계 의미·페이지별 설득 전략은 개별 슬라이드 명세로 전달한다. 의미·사실·수치·관계는 보존하되, 명시적 구성 잠금이 없으면 구도와 매체는 이미지 AI가 결정한다."
      : REQUIRED_SCOPE;
  }

  function modelPromptLines(ko, model) {
    if (model === "gpt_image") return ko ? [
      "GPT Image용 직접 렌더링 명령으로 실행하고 결과 설명 없이 완성된 슬라이드 이미지 한 장만 생성한다.",
      "우선순위는 개별 명세의 정확한 문구·수치 보존, 가독성, 디자인 스타일 순으로 적용한다.",
      "색상·배경·이미지 자원은 사용 가능한 범위로 해석하고, 설득에 도움이 되는 것만 선택한다. 구도와 레이아웃은 개별 명세의 의미를 먼저 해석해 결정한다.",
    ] : [
      "Execute as direct GPT Image rendering instructions and generate one finished slide image without explanatory output.",
      "Apply priorities in this order: exact supplied wording and figures, legibility, then design style.",
      "Treat color, background, and image resources as available affordances. Select only those that support persuasion, and decide composition after interpreting the individual semantic brief.",
    ];
    if (model === "gemini") return ko ? [
      "Gemini 이미지 생성이 섹션 구조를 순서대로 해석하도록 출력 계약과 콘텐츠 보존 규칙을 먼저 적용한다.",
      "각 섹션의 조건을 결합해 완성된 슬라이드 이미지 한 장만 생성하고 별도의 설명문을 출력하지 않는다.",
      "각 섹션을 계획 단계로 처리한 뒤 렌더링하며, 색상 역할·강조 요소·가독성 보호처럼 뒤에서 누락되기 쉬운 제약은 최종 점검에서 다시 확인한다.",
    ] : [
      "For Gemini image generation, interpret the sections in order and apply the output contract and content-preservation rules first.",
      "Combine all section constraints into one finished slide image without separate explanatory text.",
      "Treat each section as a planning stage before rendering, then re-check easily omitted constraints such as color roles, focal emphasis, and legibility protection.",
    ];
    return ko ? [
      "특정 모델 문법에 의존하지 않는 보편적인 이미지 생성 명령으로 실행한다.",
      "개별 명세 보존과 가독성을 디자인 효과보다 우선하고 완성된 슬라이드 이미지 한 장만 생성한다.",
      "색상·구도·타이포그래피의 역할 의미를 공급자별 문법으로 바꾸지 않고 그대로 유지한다.",
    ] : [
      "Use model-neutral image-generation instructions without provider-specific syntax.",
      "Prioritize preservation of the individual specification and legibility over visual effects, and generate one finished slide image.",
      "Preserve the semantic roles of color, composition, and typography without translating them into provider-specific syntax.",
    ];
  }

  function buildStrictCompactPrompt(ko, model, forbidden) {
    const modelShort = model === "gpt_image" ? (ko ? "GPT Image 직접 렌더링" : "direct GPT Image rendering") : model === "gemini" ? (ko ? "Gemini 섹션 우선 해석" : "Gemini section-first interpretation") : (ko ? "모델 중립 실행" : "model-neutral execution");
    const header = isSectionEnabled("header") ? headerSummary() : (ko ? "비설정" : "unset");
    const footer = isSectionEnabled("footer") ? footerSummary() : (ko ? "비설정" : "unset");
    const items = [
      ko ? `범위=${scopeText(true)}` : `Scope=${scopeText(false)}`,
      ko ? `실행=${modelShort}; 완성 슬라이드 이미지 1장; 설명문 없음.` : `Execution=${modelShort}; one finished slide image; no explanation.`,
      isSectionEnabled("canvas") ? (ko ? `규격=${get("canvas.aspectRatio")}, ${get("canvas.width")}×${get("canvas.height")}px, 안전영역 ${get("canvas.safeArea.top")}/${get("canvas.safeArea.right")}/${get("canvas.safeArea.bottom")}/${get("canvas.safeArea.left")}%` : `Canvas=${get("canvas.aspectRatio")}, ${get("canvas.width")}×${get("canvas.height")} px, safe ${get("canvas.safeArea.top")}/${get("canvas.safeArea.right")}/${get("canvas.safeArea.bottom")}/${get("canvas.safeArea.left")}%`) : "",
      isSectionEnabled("direction") ? (ko ? `디자인 DNA=${effectiveDesignStatement()}` : `Design DNA=${effectiveDesignStatement()}`) : "",
      isSectionEnabled("composition") ? (ko ? `시각 문법=${compositionSummary()}; ${get("composition.variationRule")}; 설득 목적에 기여하는 자원만 AI가 선택` : `Visual grammar=${compositionSummary()}; ${get("composition.variationRule")}; the image model selects only resources that support persuasion`) : "",
      isSectionEnabled("colors") ? `${ko ? `사용 가능한 색상 앵커=P ${get("colors.primary")}; S ${get("colors.secondary")}; A ${get("colors.accent")}; BG ${get("colors.background")}; Text ${get("colors.textPrimary")}` : `Available color anchors=P ${get("colors.primary")}; S ${get("colors.secondary")}; A ${get("colors.accent")}; BG ${get("colors.background")}; Text ${get("colors.textPrimary")}`}; ${modelColorExecutionLines(ko, model, true).join(" ")}` : "",
      isSectionEnabled("background") ? (ko ? `배경=${backgroundSummary()}${isBackgroundPhotoActive() ? "; 실사 배경은 이미지 AI가 설득 목적에 맞춰 장면·크롭·깊이·레이어를 선택" : ""}` : `Background=${get("background.type")}; protect text/data${isBackgroundPhotoActive() ? "; the image model selects photographic scene, crop, depth, and layers according to the persuasion goal" : ""}`) : "",
      isSectionEnabled("typography") ? (ko ? `서체=${get("typography.fontName")}; 제목 ${get("typography.headlineScale")}; 본문 ${get("typography.bodyScale")}` : `Type=${get("typography.fontName")}; headline ${get("typography.headlineScale")}; body ${get("typography.bodyScale")}`) : "",
      (isSectionEnabled("header") || isSectionEnabled("footer")) ? (ko ? `프레임=헤더 ${header}; 푸터 ${footer}` : `Frame=header ${header}; footer ${footer}`) : "",
      isSectionEnabled("background") && Number(get("background.zoneSeparation")) >= 3
        ? (ko ? `구역별 표면=헤더 ${surfaceRoleLabel(get("header.surfaceRole"))}; 본문 ${label("background.type", { solid: "단색 기본면", lightNeutral: "밝은 중성 기본면", gradient: "절제된 그라데이션 기본면", geometric: "낮은 대비 기하학 기본면", conditional: "슬라이드별 기본면" })}; 푸터 ${surfaceRoleLabel(get("footer.surfaceRole"))}. 헤더·본문·푸터를 서로 다른 조화 표면으로 독립적으로 운용한다.` : `Zoned surfaces=header ${surfaceRoleLabel(get("header.surfaceRole"), false)}; body ${get("background.type")}; footer ${surfaceRoleLabel(get("footer.surfaceRole"), false)}. Treat header, body, and footer as independent but coordinated surfaces.`)
        : "",
      isSectionEnabled("photoComposite") && isPhotoCompositeActive() ? (ko ? `콘텐츠 이미지는 ${photoCompositeStateSummary()} 자원이며 의무가 아니다. 구체적 대상이 없으면 일반 맥락 장면만 사용할 수 있고 새로운 사실이나 증거로 표현하지 않는다.` : `Content imagery is ${photoCompositeStateSummary()} and is not mandatory. Without a specific subject, use only a general context scene and never present it as a new fact or evidence.`) : "",
      ko ? `품질=문구·수치·한글 정확성, WCAG ${get("quality.wcagLevel")}, 목업·워터마크·허위내용 금지${forbidden.length ? `, ${forbidden.slice(0, 4).join("/")}` : ""}` : `Quality=exact text/figures/Korean, WCAG ${get("quality.wcagLevel")}, no mockup/watermark/invention${forbidden.length ? `; ${forbidden.slice(0, 4).join("/")}` : ""}`,
      isSectionEnabled("direction") && get("visualDirection.mediumNameKo") ? (ko ? `보조 화풍=${get("visualDirection.mediumNameKo")}; 디자인 DNA에 맞춰 매체별 강도를 조절하고 단일 색조 워시는 피함` : `Supporting treatment=${get("visualDirection.mediumNameEn") || get("visualDirection.mediumNameKo")}; adapt intensity by medium under the design DNA and avoid a single-hue wash`) : "",
      ko ? "최우선=개별 명세의 양식·콘텐츠·핵심 주제와 목적·표현 방식·품질 조건을 보존하고 활용 가능한 자원 중 필요한 것만 선택해 AI가 구성." : "Top priority=preserve format values, content, purpose, expression method, and quality conditions; let the image model compose using only helpful available resources.",
    ].filter(Boolean);
    return `${ko ? "## 압축 공통 디자인 시스템" : "## COMPACT COMMON DESIGN SYSTEM"}\n${items.map((item) => `- ${item}`).join("\n")}`;
  }

  function fitPromptToLimit(text, limit, ko, model, forbidden) {
    if (text.length <= limit) return text;
    const compact = buildStrictCompactPrompt(ko, model, forbidden);
    if (compact.length <= limit) return compact;
    const proactivePhoto = ["preferred", "required"].includes(get("photoComposite.mode"));
    const closing = proactivePhoto
      ? (ko ? "\n- 최우선=개별 명세의 사실·문구·수치·의미 보존; 실사 피사체만 명세에 연결된 일반 맥락 장면으로 도출 가능." : "\n- Top priority=preserve supplied facts, wording, figures, and meaning; only a photo subject may be derived as a general context scene tied to the specification.")
      : (ko ? "\n- 최우선=개별 명세의 사실·문구·수치·의미 보존; 누락 내용 추론 금지." : "\n- Top priority=preserve supplied facts, wording, figures, and meaning; never infer missing content.");
    const available = Math.max(200, limit - closing.length);
    const slice = compact.slice(0, available);
    const boundary = Math.max(slice.lastIndexOf("\n- "), slice.lastIndexOf(". "), slice.lastIndexOf("; "));
    return `${slice.slice(0, boundary > 200 ? boundary : available).trimEnd()}${closing}`.slice(0, limit);
  }

  function promptLengthBudget(mode = get("project.outputMode")) {
    if (mode === "compact") return Math.max(900, Math.min(1600, Number(get("project.maxChars")) || PROMPT_LENGTH_BUDGETS.compact));
    return PROMPT_LENGTH_BUDGETS[mode] || PROMPT_LENGTH_BUDGETS.standard;
  }

  function fitFiveStagePromptToLimit(text, limit, ko, model, resourcePolicy = currentResourcePolicy(), outputMode = "standard") {
    if (text.length <= limit) return text;
    const resourceLines = resourcePolicyPromptLines(ko, resourcePolicy, { compact: true });
    const modelLabel = model === "gpt_image" ? "GPT Image" : model === "gemini" ? "Gemini" : (ko ? "공통 이미지 모델" : "model-neutral image generation");
    const styleLabel = (path, labels) => labels[Math.max(1, Math.min(5, Number(get(path)) || 3)) - 1];
    const style = ko
      ? [
        styleLabel("visualStyle.formality", ["엄정·제도적", "공식·현대적", "신뢰·친근 균형", "친근·개방적", "인간적·편안함"]),
        styleLabel("visualStyle.energy", ["매우 차분", "절제된 움직임", "안정·활력 균형", "분명한 추진력", "강한 전진감"]),
        styleLabel("visualStyle.expression", ["최소 표현", "절제된 존재감", "정돈·강조 균형", "큰 대비·초점", "대담한 기억점"]),
      ]
      : [
        styleLabel("visualStyle.formality", ["strictly institutional", "formal and modern", "balanced trust and warmth", "friendly and open", "human and relaxed"]),
        styleLabel("visualStyle.energy", ["very calm", "restrained motion", "balanced stability and vitality", "clear momentum", "strong forward energy"]),
        styleLabel("visualStyle.expression", ["minimal expression", "restrained presence", "balanced order and emphasis", "strong contrast and focus", "bold focal impact"]),
      ];
    const emphasis = ko
      ? label("typography.emphasis", { reading: "읽기 우선", balanced: "읽기와 핵심 강조의 균형", strong: "제목·핵심 수치 강한 강조" })
      : ({ reading: "reading first", balanced: "balanced reading and focal emphasis", strong: "strong headline and key-figure emphasis" })[get("typography.emphasis")];
    const modeProfile = ({
      standard: {
        title: ko ? "## 슬라이드 이미지 공통 시각 사양" : "## COMMON SLIDE IMAGE VISUAL SPECIFICATION",
        contracts: [
          ko ? "균형 잡힌 실전 제작 사양으로 실행한다. 핵심 시각 체계와 실행 제약을 유지하되 검토용 설명은 추가하지 않는다." : "Use the balanced production form: keep the essential visual system and execution constraints without review commentary.",
        ],
        optionalIndexes: [0, 1, 2, 3, 4, 5],
      },
      compact: {
        title: ko ? "## 압축 슬라이드 이미지 공통 시각 사양" : "## COMPACT SLIDE IMAGE VISUAL SPECIFICATION",
        contracts: [
          ko ? "짧은 입력창용 압축 사양이다. 핵심 시각 결정만 유지하고 중복 설명은 생략한다." : "Use this compact form for short input fields. Keep only essential visual decisions and omit repeated explanation.",
        ],
        optionalIndexes: [0, 1, 2, 4],
      },
      style_lock: {
        title: "## DECK-WIDE VISUAL STYLE LOCK",
        contracts: [
          ko ? "이 블록을 개별 슬라이드 명세에 동일하게 결합하는 덱 전체의 반복 기준으로 사용한다." : "Use this block as the reusable deck-wide visual baseline. Append it unchanged to each individual slide specification.",
          ko ? "규격·시각 인상·팔레트·강조는 일관되게 유지하고 실제 구도는 각 슬라이드 내용에 맞춰 변주한다." : "Keep format, visual character, palette, and emphasis consistent while varying composition from each slide's content.",
        ],
        optionalIndexes: [1, 2, 3, 4, 5],
      },
      detailed: {
        title: ko ? "## 슬라이드 이미지 공통 시각 사양 — 검토판" : "## SLIDE IMAGE VISUAL SPECIFICATION — REVIEW EDITION",
        contracts: [
          ko ? "이미지 생성 전에 선택한 시각 결정을 빠짐없이 확인하는 검토판으로 사용한다." : "Use this review edition to expose every selected visual decision before image generation.",
          ko ? "완성 직전 예약 영역·안전 여백·정확한 문구와 수치·대비·잘림·불필요한 반복을 점검하고 수정 결과만 출력한다." : "Before finalizing, check reserved areas, safe margins, exact wording and figures, contrast, clipping, and unnecessary repetition; output only the corrected result.",
        ],
        optionalIndexes: [0, 1, 2, 3, 4, 5],
      },
    })[outputMode] || {
      title: ko ? "## 슬라이드 이미지 공통 시각 사양" : "## COMMON SLIDE IMAGE VISUAL SPECIFICATION",
      contracts: [],
      optionalIndexes: [0, 1, 2, 3, 4, 5],
    };
    const title = modeProfile.title;
    const mandatory = [
      ...modeProfile.contracts,
      ...resourceLines,
      ko
        ? "개별 명세의 문구·사실·수치·단위·관계를 정확히 보존하고 없는 내용을 만들지 않는다. 설명문·외부 목업·워터마크 없이 완성 슬라이드 이미지 한 장만 출력한다."
        : "Preserve supplied wording, facts, figures, units, and relationships exactly; invent nothing. Output one finished slide image without prose, mockups, or watermarks.",
    ];
    const optionalCandidates = [
      ko ? `실행=${modelLabel}; 규격=${get("canvas.aspectRatio")} ${get("canvas.width")}×${get("canvas.height")}px.` : `Execution=${modelLabel}; canvas=${get("canvas.aspectRatio")} ${get("canvas.width")}×${get("canvas.height")} px.`,
      ko ? `예약 영역=헤더 ${Math.max(0, Number(get("frame.headerHeightPercent")) || 0)}%, 푸터 ${Math.max(0, Number(get("frame.footerHeightPercent")) || 0)}%, 본문 바깥 여백 ${Math.max(0, Number(get("frame.bodySafeMarginPercent")) || 0)}%.` : `Reserved areas=header ${Math.max(0, Number(get("frame.headerHeightPercent")) || 0)}%, footer ${Math.max(0, Number(get("frame.footerHeightPercent")) || 0)}%, body outer margin ${Math.max(0, Number(get("frame.bodySafeMarginPercent")) || 0)}%.`,
      ko ? `시각 인상=${style.join(" · ")}.` : `Visual character=${style.join("; ")}.`,
      slideStylePromptLine(ko),
      ko ? `팔레트=${get("colors.primary")}/${get("colors.secondary")}/${get("colors.accent")}; 기본 배경=${get("colors.baseCanvas") === "white" ? "흰색" : get("colors.background")}; 텍스트=${get("colors.textPrimary")}.` : `Palette=${get("colors.primary")}/${get("colors.secondary")}/${get("colors.accent")}; base=${get("colors.baseCanvas") === "white" ? "white" : get("colors.background")}; text=${get("colors.textPrimary")}.`,
      ko ? `정보 강조=${emphasis}. 각 페이지의 내용과 정보량에 따라 구도·읽기 순서·여백을 결정한다.` : `Information emphasis=${emphasis}. Choose composition, reading order, and whitespace from each page's content and density.`,
    ];
    const optional = modeProfile.optionalIndexes.map((index) => optionalCandidates[index]).filter(Boolean);
    const render = (items) => `${title}\n${items.map((item) => `- ${item}`).join("\n")}`;
    let selected = [...optional, ...mandatory];
    while (selected.length > mandatory.length && render(selected).length > limit) selected.splice(selected.length - mandatory.length - 1, 1);
    const compact = render(selected);
    if (compact.length <= limit) return compact;
    const required = render(mandatory);
    if (required.length <= limit) return required;
    const closing = modeProfile.contracts.map((item) => `\n- ${item}`).join("") + `\n- ${mandatory[mandatory.length - 1]}`;
    const availableLength = Math.max(120, limit - closing.length);
    return `${title}\n- ${resourceLines.join(" ").slice(0, Math.max(80, availableLength - title.length - 4)).trim()}${closing}`.slice(0, limit);
  }

  function compactPromptValue(value, max = 180) {
    const normalized = String(value || "").replace(/\s+/g, " ").trim();
    if (normalized.length <= max) return normalized;
    const slice = normalized.slice(0, max + 1);
    const boundary = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("; "), slice.lastIndexOf(", "), slice.lastIndexOf(" "));
    return `${slice.slice(0, boundary > max * .55 ? boundary : max).trim()}…`;
  }

  function efficientResourceNames(ko, maxItems) {
    const candidates = [
      ["allowDataVisualization", ko ? "데이터 시각화" : "data visualization"],
      ["allowDiagram", ko ? "관계·과정 다이어그램" : "relationship and process diagrams"],
      ["allowPhotography", ko ? "실사·현장 맥락" : "photography and field context"],
      ["allowInfographic", ko ? "통합 인포그래픽" : "integrated infographics"],
      ["allowLayeredComposition", ko ? "다중 레이어" : "multi-layer composition"],
      ["allowTypographicFocus", ko ? "타이포·핵심 수치" : "typographic and key-figure focus"],
      ["allowTechnical3d", ko ? "기술 3D" : "technical 3D"],
      ["allowMap", ko ? "지도·공간 정보" : "maps and spatial information"],
      ["allowIllustration", ko ? "일러스트레이션" : "illustration"],
      ["allowPictogram", ko ? "픽토그램" : "pictograms"],
    ];
    return candidates.filter(([key]) => get(`composition.${key}`)).slice(0, maxItems).map(([, labelText]) => labelText);
  }

  function buildEfficientDesignGuide(ko, model, mode) {
    const detailed = mode === "detailed";
    const styleLock = mode === "style_lock";
    const heading = (title) => `### ${title}`;
    const section = (title, items) => `${heading(title)}\n${lines(items.map((item) => compactPromptValue(item, detailed ? 300 : 230)))}`;
    const sections = [];
    const audienceRole = audienceRoleLabel(ko);
    const audienceLevel = audienceLevelLabel(ko);
    const audienceStance = audienceStanceLabel(ko);
    const readingMode = readingModeLabel(ko);
    const modelLines = modelPromptLines(ko, model);

    sections.push(section(ko ? "출력 계약과 우선순위" : "OUTPUT CONTRACT AND PRIORITIES", [
      styleLock
        ? (ko ? "이 디자인 잠금 규칙을 개별 슬라이드 명세와 결합해 같은 덱의 시각적 일관성을 유지한다." : "Combine this style lock with each individual slide specification to maintain deck-wide visual consistency.")
        : (ko ? "개별 슬라이드 명세와 이 디자인 가이드를 결합해 완성된 전체 슬라이드 이미지 한 장을 생성한다." : "Combine the individual slide specification with this design guide to generate one complete full-slide image."),
      modelLines[0],
      modelLines[2],
      detailed ? (ko ? "우선순위는 개별 명세의 정확한 문구·수치·의미 → 3초 이해도와 가독성 → 디자인 가이드 순이다." : "Priority order: exact supplied wording, figures, and meaning → three-second comprehension and legibility → design guide.") : "",
    ]));

    sections.push(section(ko ? "역할 분리" : "RESPONSIBILITY SPLIT", [
      ko ? "이 가이드는 덱 전체의 디자인 성격과 활용 가능한 시각 문법만 정의한다. 발표 맥락·실제 콘텐츠·수치·이미지 대상·관계 의미·페이지별 설득 과업은 별도 맥락과 개별 슬라이드 명세만 사용한다." : "This guide defines only deck-wide design character and the available visual grammar. Audience context, actual content, figures, image subjects, relationship meaning, and page-specific persuasion tasks come only from the separate context layer and individual slide specification.",
      ko ? "헤더·푸터 값은 스킬 명세를 따른다. 개별 명세가 ‘구성 고정’을 선언하지 않았다면 의미와 데이터만 보존하고 실제 구도·매체·크기·간격·여백·크롭·중첩·레이어는 이미지 AI가 선택한다." : "Follow the skill specification for header/footer values. Unless an individual slide explicitly declares a composition lock, preserve meaning and data while letting the image model choose the composition, medium, scale, spacing, whitespace, crop, overlap, and layers.",
    ]));

    if (isSectionEnabled("direction")) {
      const dna = designDnaPromptLines(ko, true);
      const selected = [dna[0], dna[1], ...dna.slice(2).filter((line) => /모티프|motif|보조 표현 기법|supporting treatment/.test(line))];
      sections.push(section(ko ? "덱 디자인 선언과 디자인 DNA" : "DECK DESIGN DECLARATION AND DNA", selected));
    }

    if (isSectionEnabled("composition")) {
      const grammar = compositionGrammarPromptLines(ko, true);
      const resources = efficientResourceNames(ko, detailed ? 8 : 6);
      sections.push(section(ko ? "시각 문법·일관성·레이아웃 변주" : "VISUAL GRAMMAR, CONSISTENCY, AND LAYOUT VARIATION", [
        grammar[0], grammar[1], grammar[2], grammar[3],
        resources.length ? (ko ? `선택 자원을 적극 활용할 수 있다: ${resources.join("·")}. 매 페이지에서 모두 쓰지 말고 핵심 주장과 증거 관계에 도움이 되는 1~2개만 선택한다.` : `Available resources: ${resources.join(", ")}. Do not use them all on every page; select only one or two that support the key claim and evidence relationship.`) : "",
        ko ? "개별 명세의 의미 그룹·읽기 우선순위·핵심 강조 이유를 입력으로 삼되 이를 고정 좌표나 정형 레이아웃으로 해석하지 않는다. 구성 고정 페이지가 아니면 이미지 AI가 서로 다른 구도 후보를 비교해 최적안을 선택한다." : "Use the individual slide's semantic groups, reading priority, and reason for emphasis as inputs rather than fixed coordinates or a preset layout. Unless the page is composition-locked, let the image model compare materially different candidates and choose the best solution.",
      ]));
    }

    if (isSectionEnabled("colors")) {
      sections.push(section(ko ? "색상 팔레트" : "COLOR PALETTE", [
        efficientColorDefinition(ko, false)[0],
        ko ? "Primary·Secondary·Accent는 선택 역할색이며 Accent가 불필요하면 생략할 수 있다. 사진·지도·재료의 고유색을 보존해 전체 화면이 한 색조로 수렴하지 않게 한다." : "Primary, Secondary, and Accent are optional role colors; omit Accent when unnecessary and preserve local colors in photography, maps, and materials so the canvas does not collapse into one hue.",
      ]));
    }

    if (isSectionEnabled("typography")) {
      const typeLines = typographyPromptLines(ko, true);
      sections.push(section(ko ? "타이포그래피 언어" : "TYPOGRAPHIC LANGUAGE", [typeLines[0], typeLines[2], typeLines[3], detailed ? typeLines[1] : "", typeLines.find((line) => /중요 숫자|key figures/.test(line))]));
    }

    if (isSectionEnabled("photoComposite")) {
      sections.push(section(ko ? "이미지·그래픽·레이어 언어" : "IMAGERY, GRAPHICS, AND LAYER LANGUAGE", [
        imageGraphicLanguagePromptLines(ko)[0],
        ...photoCapabilityPromptLinesV3(ko, true).slice(0, detailed ? 3 : 2),
        ko ? "구체적 대상이 없으면 일반 맥락 장면만 사용할 수 있으며 이를 새로운 사실이나 증거로 표현하지 않는다." : "When no specific subject is supplied, only a general context scene may be used; never present it as a new fact or evidence.",
      ]));
    }

    if (isSectionEnabled("background")) sections.push(section(ko ? "배경과 표면" : "BACKGROUND AND SURFACES", backgroundCapabilityPromptLinesV3(ko, true)));

    const frame = [];
    if (isSectionEnabled("header") && get("header.type") !== "none") frame.push(...headerPromptLines(ko).slice(0, 2));
    if (isSectionEnabled("footer") && get("footer.type") !== "none") frame.push(footerPromptLines(ko)[0]);
    if (frame.length) frame.push(ko ? "실제 헤더·푸터 문구는 개별 명세의 ‘양식’ 값만 표시한다." : "Render only header/footer values supplied in the individual specification's Format section.");
    if (frame.length) sections.push(section(ko ? "헤더 및 푸터" : "HEADER AND FOOTER", frame));

    if (isSectionEnabled("canvas")) sections.push(section(ko ? "캔버스 및 페이지 설정" : "CANVAS AND PAGE SETUP", [
      ko ? `${get("canvas.aspectRatio")} · ${get("canvas.width")}×${get("canvas.height")}px · ${get("canvas.orientation") === "landscape" ? "가로" : "세로"} · ${label("canvas.outputTarget", { screen: "화면 발표", print: "인쇄", screen_and_print: "화면·인쇄" })}` : `${get("canvas.aspectRatio")} · ${get("canvas.width")}×${get("canvas.height")} px · ${get("canvas.orientation")} · ${get("canvas.outputTarget").replaceAll("_", " ")}`,
      detailed ? (ko ? `안전영역 상·우·하·좌 ${get("canvas.safeArea.top")}/${get("canvas.safeArea.right")}/${get("canvas.safeArea.bottom")}/${get("canvas.safeArea.left")}%` : `Safe areas top/right/bottom/left ${get("canvas.safeArea.top")}/${get("canvas.safeArea.right")}/${get("canvas.safeArea.bottom")}/${get("canvas.safeArea.left")}%`) : "",
    ]));

    if (isSectionEnabled("quality")) sections.push(section(ko ? "가독성 및 품질" : "READABILITY AND QUALITY", [
      ko ? `개별 명세의 문구·수치·날짜·단위·한글을 정확히 보존하고 WCAG ${get("quality.wcagLevel")} 대비와 발표 거리 가독성을 유지한다.` : `Preserve supplied wording, figures, dates, units, and Korean exactly; maintain WCAG ${get("quality.wcagLevel")} contrast and presentation-distance legibility.`,
      ko ? "글자·수치·도형은 픽셀 단위로 선명하게 마감하고 전면 블러·워터마크·외부 목업 프레임을 사용하지 않는다." : "Keep text, figures, and shape edges pixel-crisp; use no full-canvas blur, watermark, or external mockup frame.",
    ]));

    if (isSectionEnabled("constraints") && String(get("constraints.customRule") || "").trim()) sections.push(section(ko ? "추가 품질 조건" : "ADDITIONAL QUALITY CONDITION", [get("constraints.customRule")]));

    sections.push(section(ko ? "개별 슬라이드 명세 우선" : "INDIVIDUAL SPECIFICATION PRIORITY", [
      ko ? "개별 명세의 양식·목적·콘텐츠·표현·품질을 보존하고 필요한 공통 자원만 선택한다. 없는 문구·사실·수치·라벨은 만들지 않는다." : "Preserve the individual format, purpose, content, expression, and quality; use only helpful common resources and never invent wording, facts, figures, or labels.",
    ]));

    if (model === "gemini" && detailed) sections.push(section(ko ? "Gemini 최종 준수 점검" : "GEMINI FINAL COMPLIANCE CHECK", [
      ko ? "완성 직전 문구·수치·정보 관계와 가독성을 확인하고, Accent가 불필요하면 생략하며 사진 고유색을 보존해 한 색조로 수렴하지 않게 한다." : "Before finalizing, verify wording, figures, information relationships, and legibility; omit Accent when unnecessary and preserve local photographic colors to avoid a single-hue result.",
      ko ? "점검 과정은 설명하지 말고 수정된 완성 이미지에만 반영한다." : "Do not describe the review; apply it only to the corrected finished image.",
    ]));

    const title = styleLock ? (ko ? "## Deck Style Lock" : "## DECK STYLE LOCK") : (ko ? "## 공통 디자인 시스템" : "## COMMON DESIGN SYSTEM");
    const result = `${title}\n\n${sections.join("\n\n")}`.trim();
    return fitPromptToLimit(result, promptLengthBudget(mode), ko, model, []);
  }

  function buildFiveStagePrompt(overrides = {}) {
    const ko = (overrides.promptLanguage || get("project.promptLanguage")) === "ko";
    const model = overrides.targetModel || get("project.targetModel");
    const outputMode = overrides.outputMode || get("project.outputMode");
    const headerItems = commaItems(get("frame.headerElements"));
    const footerItems = commaItems(get("frame.footerElements"));
    const headerHeight = Math.max(0, Number(get("frame.headerHeightPercent")) || 0);
    const footerHeight = Math.max(0, Number(get("frame.footerHeightPercent")) || 0);
    const safeMargin = Math.max(0, Number(get("frame.bodySafeMarginPercent")) || 0);
    const styleValue = (path, labels) => labels[Math.max(1, Math.min(5, Number(get(path)) || 3)) - 1];
    const style = ko
      ? [
        styleValue("visualStyle.formality", ["엄정하고 제도적", "공식적이고 현대적", "신뢰와 친근함의 균형", "친근하고 개방적", "인간적이고 편안함"]),
        styleValue("visualStyle.energy", ["매우 차분하고 안정적", "절제된 움직임", "안정과 활력의 균형", "분명한 추진력", "강한 에너지와 전진감"]),
        styleValue("visualStyle.expression", ["최소 표현과 엄격한 정돈", "절제된 시각적 존재감", "정돈과 강조의 균형", "큰 대비와 분명한 초점", "대담하고 강한 기억점"]),
      ]
      : [
        styleValue("visualStyle.formality", ["strictly institutional", "formal and contemporary", "balanced trust and approachability", "friendly and open", "human and relaxed"]),
        styleValue("visualStyle.energy", ["very calm and stable", "restrained motion", "balanced stability and vitality", "clear momentum", "strong energy and forward motion"]),
        styleValue("visualStyle.expression", ["minimal and rigorously ordered", "restrained visual presence", "balanced order and emphasis", "clear focal contrast", "bold and memorable"]),
      ];
    const resourcePolicy = currentResourcePolicy();
    const resourceLines = resourcePolicyPromptLines(ko, resourcePolicy);
    const baseBackground = get("colors.baseCanvas") === "white" ? (ko ? "흰색" : "white") : get("colors.background");
    const emphasis = ko
      ? label("typography.emphasis", { reading: "본문과 설명의 편안한 읽기 우선", balanced: "본문 가독성과 핵심 강조의 균형", strong: "제목·핵심 문장·주요 수치의 강한 존재감" })
      : ({ reading: "prioritize comfortable reading of body copy and explanations", balanced: "balance body legibility with focal emphasis", strong: "give strong presence to headlines, key statements, and major figures" })[get("typography.emphasis")];
    const modelExecution = ko
      ? ({
        gpt_image: "GPT Image용 직접 렌더링 지시로 해석하고 문구 정확성, 가독성, 시각 실행 순서로 처리한다.",
        gemini: "Gemini가 섹션 순서와 역할 우선순위를 먼저 해석한 뒤 완성 이미지에 반영한다.",
        common: "특정 모델 문법에 의존하지 않는 범용 이미지 생성 지시로 해석한다.",
      })[model] || "이미지 생성 모델이 명확한 제작 지시로 해석한다."
      : ({
        gpt_image: "Treat this as direct rendering guidance for GPT Image, prioritizing wording accuracy, legibility, then visual execution.",
        gemini: "For Gemini, interpret section order and role priority before rendering the finished image.",
        common: "Interpret this as vendor-neutral image-generation guidance without model-specific syntax.",
      })[model] || "Interpret this as clear production guidance for the image model.";
    const sections = ko ? [
      ["OUTPUT CONTRACT", [
        "개별 슬라이드 명세와 이 공통 시각 사양을 결합해 완성된 전체 슬라이드 이미지 한 장을 생성한다.",
        `${modelExecution} 설명문·편집기 UI·외부 목업 없이 캔버스를 가득 채운다.`,
      ]],
      ["OUTPUT SIZE AND RESERVED AREAS", [
        `${get("canvas.aspectRatio")} 비율, ${get("canvas.width")}×${get("canvas.height")}px, ${get("canvas.orientation") === "portrait" ? "세로" : "가로"} 이미지.`,
        `${headerHeight ? `상단 ${headerHeight}%는 헤더 예약 영역이며 정보 항목은 ${headerItems.join(", ") || "없음"}` : "헤더 예약 영역 없음"}. ${footerHeight ? `하단 ${footerHeight}%는 푸터 예약 영역이며 정보 항목은 ${footerItems.join(", ") || "없음"}` : "푸터 예약 영역 없음"}. 실제 값은 개별 명세에서만 가져온다.`,
        `본문은 바깥쪽 ${safeMargin}% 안전 여백과 헤더·푸터 예약 영역을 침범하지 않는다. 헤더·푸터의 색상·정렬·표면·장식은 아래 시각 조건과 조화되게 구성한다.`,
        "표지·목차·간지·맺음말 유형에서는 헤더와 푸터를 표시하지 않는다.",
      ]],
      ["OVERALL VISUAL STYLE", [`전체 인상: ${style.join(" · ")}. 이 세 성격을 하나의 일관된 시각 언어로 결합한다.`, slideStylePromptLine(true)]],
      ["COLOR PALETTE AND BACKGROUND", [
        `팔레트 ${paletteTitle()}: Primary ${get("colors.primary")}, Secondary ${get("colors.secondary")}, Accent ${get("colors.accent")}, Background ${get("colors.background")}, Surface ${get("colors.surface")}, Text ${get("colors.textPrimary")}.`,
        `기본 캔버스는 ${baseBackground}으로 사용한다.${get("colors.baseCanvas") === "white" ? " 팔레트 색상은 제목·도형·주석·강조·구역별 표면에 계속 활용한다." : " 필요한 구역은 파생 중성색과 명도 차이로 분리한다."}${resourcePolicy.excludes("photo") ? "" : " 사진이 쓰이면 고유색을 보존해 화면 전체가 한 색조로 수렴하지 않게 한다."}`,
      ]],
      ["TYPOGRAPHY AND INFORMATION EMPHASIS", [
        `${emphasis}. 한글 가독성을 우선하고, 제공된 문구·수치·단위·날짜를 정확히 보존한다. 핵심 지표와 성과는 정보 위계상 먼저 인지되게 한다.`,
      ]],
      ["AVAILABLE IMAGE AND GRAPHIC ELEMENTS", [
        ...resourceLines,
        "선·면·카드·섹션·블록과 여백은 정보 관계와 읽기 흐름을 명확하게 하는 범위에서 자유롭게 사용할 수 있다.",
      ]],
      ["CONTENT-BASED COMPOSITION", [
        "개별 슬라이드가 제공하는 핵심 주제와 목적, 정확한 콘텐츠와 데이터, 증거 관계, 정보 위계와 강조 대상을 먼저 해석한다.",
        "각 슬라이드의 내용과 정보 밀도에 따라 레이아웃, 읽기 순서, 공간 위계, 개체 크기, 간격, 여백과 시각 매체를 별도로 선택한다. 내용이 적을수록 핵심 장면·수치·문장의 시각적 존재감을 높인다.",
      ]],
      ["ESSENTIAL OUTPUT REQUIREMENTS", [
        "명세에 없는 사실·수치·문구·라벨을 만들지 않는다. 같은 문구를 불필요하게 반복하지 않는다.",
        "최종 크기에서 텍스트·수치·도형의 가장자리를 픽셀 단위로 선명하게 유지하고, 전면 블러 없이 필요한 작은 배경 영역에만 국부 효과를 적용한다.",
      ]],
    ] : [
      ["OUTPUT CONTRACT", ["Combine the individual slide specification with this common visual specification to create one complete full-slide image.", `${modelExecution} Fill the canvas without explanatory prose, editor UI, or presentation mockups.`]],
      ["OUTPUT SIZE AND RESERVED AREAS", [`${get("canvas.aspectRatio")}, ${get("canvas.width")}×${get("canvas.height")} px, ${get("canvas.orientation")}.`, `${headerHeight ? `Reserve the top ${headerHeight}% for header items: ${headerItems.join(", ") || "none"}` : "No header area"}. ${footerHeight ? `Reserve the bottom ${footerHeight}% for footer items: ${footerItems.join(", ") || "none"}` : "No footer area"}. Use exact values only from the individual specification.`, `Protect an outer body safe margin of ${safeMargin}% and keep content outside reserved header/footer areas. Let their color, alignment, surface, and styling follow the visual specification below.`, "Omit header and footer on cover, agenda, section-divider, and closing slides."]],
      ["OVERALL VISUAL STYLE", [`Overall character: ${style.join("; ")}. Combine these qualities into one coherent visual language.`, slideStylePromptLine(false)]],
      ["COLOR PALETTE AND BACKGROUND", [`Palette ${paletteTitle()}: Primary ${get("colors.primary")}, Secondary ${get("colors.secondary")}, Accent ${get("colors.accent")}, Background ${get("colors.background")}, Surface ${get("colors.surface")}, Text ${get("colors.textPrimary")}.`, `Use ${baseBackground} as the base canvas.${get("colors.baseCanvas") === "white" ? " Continue using palette colors for headings, shapes, annotations, emphasis, and zoned surfaces." : " Use tonal derivatives to distinguish zones."}${resourcePolicy.excludes("photo") ? "" : " Preserve local photographic color and avoid a single-hue wash."}`]],
      ["TYPOGRAPHY AND INFORMATION EMPHASIS", [`${emphasis}. Preserve supplied wording, figures, units, and dates exactly, render Korean legibly, and make key metrics and outcomes visible first in the hierarchy.`]],
      ["AVAILABLE IMAGE AND GRAPHIC ELEMENTS", [...resourceLines, "Lines, planes, cards, sections, blocks, and whitespace may be used whenever they clarify information relationships and reading flow."]],
      ["CONTENT-BASED COMPOSITION", ["First interpret the supplied topic, purpose, exact content and data, evidence relationships, information hierarchy, and focal priority.", "Choose the layout, reading order, spatial hierarchy, object scale, spacing, whitespace, and visual medium separately for each slide based on its content and information density. Increase focal visual presence when content is sparse."]],
      ["ESSENTIAL OUTPUT REQUIREMENTS", ["Do not invent facts, figures, wording, or labels, and avoid unnecessary text duplication.", "Keep text, figures, and shape edges pixel-crisp at final size. Avoid full-canvas blur; use local effects only in small background areas when useful."]],
    ];
    const compactSections = [
      ["EXECUTION", [sections[0][1][0], sections[0][1][1], sections[1][1][0], sections[1][1][1], sections[1][1][2]]],
      ["VISUAL SYSTEM", [...sections[2][1].filter(Boolean), sections[3][1][0], sections[4][1][0]]],
      ["COMPOSITION", [...sections[5][1].filter(Boolean), sections[6][1][1]]],
      ["ACCURACY AND FINISH", [sections[1][1][3], sections[7][1][0], sections[7][1][1]]],
    ];
    const styleLockSections = [
      sections[1], sections[2], sections[3], sections[4], sections[5],
      ["CONSISTENCY AND VARIATION", [
        ko ? "이 규격·시각 인상·팔레트·강조 원칙을 덱 전체의 반복 기준으로 유지한다." : "Keep these format, visual character, palette, and emphasis decisions as the recurring deck-wide baseline.",
        sections[6][1][1],
      ]],
      sections[7],
    ];
    const detailedSections = [
      ...sections,
      ["MODEL EXECUTION PRIORITY", [
        ko ? "우선순위는 ① 개별 명세의 사실·문구·수치 보존 ② 핵심 메시지와 증거 관계의 즉시 인지 ③ 공통 시각 일관성 ④ 장식 완성도 순서다." : "Priority order: 1) preserve supplied facts, wording, and figures; 2) make the key message and evidence relationship immediately clear; 3) maintain the shared visual system; 4) refine decoration.",
        ko ? "시각 자원은 허용 목록을 기계적으로 나열하지 말고, 설득에 도움이 되는 것만 선택해 하나의 통합 장면으로 구성한다." : "Do not mechanically enumerate allowed resources; select only those that improve persuasion and integrate them into one coherent composition.",
      ]],
      ["FINAL REVIEW", [
        ko ? "완성 직전 헤더·푸터 예약 영역, 본문 안전 여백, 한글 글리프, 수치·단위, 대비, 잘림과 불필요한 반복을 점검하고 수정 결과만 출력한다." : "Before finalizing, check reserved header/footer areas, body safe margin, Korean glyphs, figures and units, contrast, clipping, and unnecessary repetition; output only the corrected result.",
        model === "gemini" ? (ko ? "Gemini 최종 준수 점검은 설명하지 말고 완성 이미지에만 반영한다." : "Apply the Gemini final compliance check silently to the finished image.") : "",
      ]],
    ];
    const modeSections = ({ compact: compactSections, style_lock: styleLockSections, detailed: detailedSections })[outputMode] || sections;
    const title = ({
      compact: "SLIDE IMAGE COMPACT SPECIFICATION",
      style_lock: "DECK-WIDE VISUAL STYLE LOCK",
      detailed: "SLIDE IMAGE VISUAL SPECIFICATION — REVIEW EDITION",
    })[outputMode] || "SLIDE IMAGE VISUAL SPECIFICATION";
    const text = `## ${title}\n\n${modeSections.map(([headingText, items]) => `### ${headingText}\n${items.filter(Boolean).map((item) => `- ${item}`).join("\n")}`).join("\n\n")}`;
    return fitFiveStagePromptToLimit(text, promptLengthBudget(outputMode), ko, model, resourcePolicy, outputMode);
  }

  function buildPrompt() {
    return buildFiveStagePrompt();
    /* Legacy compiler retained below for imported pre-4.0 settings. */
    const lang = get("project.promptLanguage");
    const ko = lang === "ko";
    const outputMode = get("project.outputMode");
    const model = get("project.targetModel");
    const ratio = getAspectRatio();
    const headerSectionEnabled = isSectionEnabled("header");
    const footerSectionEnabled = isSectionEnabled("footer");
    const headerEnabled = headerSectionEnabled && get("header.type") !== "none";
    const footerEnabled = footerSectionEnabled && get("footer.type") !== "none";
    const sections = [];
    const heading = (title) => `### ${title}`;
    const addSection = (id, text) => { if (isSectionEnabled(id)) sections.push(text); };
    const detailed = outputMode === "detailed";
    const modelLines = modelPromptLines(ko, model);
    const modelLine = modelLines[0];
    const audienceRole = audienceRoleLabel(ko);
    const audienceLevel = audienceLevelLabel(ko);
    const audienceStance = audienceStanceLabel(ko);
    const readingMode = readingModeLabel(ko);

    addSection("project", `${heading(ko ? "출력 계약" : "OUTPUT CONTRACT")}\n${lines([
      ko ? "개별 슬라이드 명세와 이 공통 디자인 시스템을 결합해 완성된 전체 슬라이드 이미지 한 장을 생성한다." : "Combine the individual slide specification with this common design system to generate one complete full-slide image.",
      ...modelLines,
      ko ? "프레젠테이션 목업, 외부 프레임, 편집기 UI 없이 캔버스를 가득 채운다." : "Fill the canvas edge to edge without presentation mockups, outer frames, or editor UI.",
      get("project.includeName") ? (ko ? `프로젝트 디자인 식별명: ${get("project.name")}.` : `Project design identifier: ${get("project.name")}.`) : "",
    ])}`);
    sections.push(`${heading(ko ? "범위 및 콘텐츠 분리" : "SCOPE AND CONTENT SEPARATION")}\n${scopeText(ko)}\n${lines([
      ko ? "이 공통 프롬프트의 역할은 발표자료 전체에 적용할 완성된 디자인 가이드를 정의하는 것이다. 디자인 DNA, 시각 문법, 일관성·변주 원칙, 색채·타이포그래피·이미지·표면·헤더·푸터·규격을 하나의 아트 디렉션으로 제공한다." : "This common prompt defines the finished deck-wide design guide: one art direction covering design DNA, visual grammar, consistency and variation, color, typography, imagery, surfaces, header, footer, and format.",
      ko ? "헤더·푸터의 정보 계층과 실제 값은 스킬의 ‘양식’이 정한다. 이 공통 가이드는 그 값을 담는 형태·슬롯·정렬·서체 인상만 정한다." : "The skill's Format section defines the header/footer information hierarchy and exact values. This common guide defines only their visual form, slots, alignment, and typographic character.",
      ko ? "웹의 디자인 가이드는 발표 맥락이나 표지·목차·간지·본문의 개별 구성을 선결정하지 않는다. 스킬은 각 페이지의 목적·핵심 메시지·증거 위계·의미 그룹·읽기 우선순위와 필요한 구성 잠금만 정의한다." : "The web design guide does not predetermine audience context or page-specific compositions for covers, agendas, dividers, or body slides. The skill defines each page's purpose, key message, evidence hierarchy, semantic groups, reading priority, and only the composition locks that are genuinely required.",
      ko ? "사용 가능한 표현은 금지 조항보다 긍정적인 활용 범위로 전달한다. 선택하지 않은 기능은 별도 금지문을 만들지 않고 언급하지 않는다." : "Express the design system as positive affordances rather than prohibitions. Omitted optional features simply receive no directive.",
      ko ? "이미지 AI는 별도 발표 맥락·스킬의 개별 의미 명세·웹의 공통 디자인 가이드를 함께 해석한다. 의미·사실·수치·관계를 보존하면서 설득 효과가 가장 높은 구도와 매체를 비교하고, 정확한 크기·간격·여백·크롭·중첩·레이어를 자율적으로 완성한다." : "The image model combines the separate presentation context, the skill's semantic slide brief, and the web design guide. It preserves meaning, facts, figures, and relationships while comparing persuasive compositions and media, then autonomously resolves exact scale, spacing, whitespace, crop, overlap, and layers.",
    ])}`);
    addSection("direction", `${heading(ko ? "덱 디자인 선언과 디자인 DNA" : "DECK DESIGN DECLARATION AND DNA")}\n${lines(designDnaPromptLines(ko, !detailed))}`);
    addSection("composition", `${heading(ko ? "시각 문법·일관성·레이아웃 변주" : "VISUAL GRAMMAR, CONSISTENCY, AND LAYOUT VARIATION")}\n${lines([...compositionGrammarPromptLines(ko, !detailed), ...visualResourcePromptLinesV3(ko, !detailed)])}`);
    addSection("colors", `${heading(ko ? "색상 팔레트" : "COLOR PALETTE")}\n${lines([
      ...efficientColorDefinition(ko, outputMode === "detailed"),
      ...modelColorExecutionLines(ko, model, !detailed),
    ])}`);
    addSection("typography", `${heading(ko ? "타이포그래피 언어" : "TYPOGRAPHIC LANGUAGE")}\n${lines(typographyPromptLines(ko, !detailed))}`);
    const photoLines = photoCapabilityPromptLinesV3(ko, !detailed);
    if (isSectionEnabled("photoComposite")) sections.push(`${heading(ko ? "이미지·그래픽·레이어 언어" : "IMAGERY, GRAPHICS, AND LAYER LANGUAGE")}\n${lines([...imageGraphicLanguagePromptLines(ko), ...photoLines])}`);
    addSection("background", `${heading(ko ? "배경과 표면" : "BACKGROUND AND SURFACES")}\n${lines(backgroundCapabilityPromptLinesV3(ko, !detailed))}`);
    const frameLines = [...(headerSectionEnabled ? headerPromptLines(ko) : []), ...(footerSectionEnabled ? footerPromptLines(ko) : [])];
    if (frameLines.length) sections.push(`${heading(ko ? "헤더 및 푸터" : "HEADER AND FOOTER")}\n${lines(frameLines)}`);
    addSection("canvas", `${heading(ko ? "캔버스 및 페이지 설정" : "CANVAS AND PAGE SETUP")}\n${lines([
      ko ? `${get("canvas.aspectRatio")} 비율, ${get("canvas.width")}×${get("canvas.height")}px, ${get("canvas.orientation") === "landscape" ? "가로" : "세로"} 방향.` : `${get("canvas.aspectRatio")} aspect ratio, ${get("canvas.width")}×${get("canvas.height")} px, ${get("canvas.orientation")} orientation.`,
      ko ? `안전영역은 상·우·하·좌 ${get("canvas.safeArea.top")}%·${get("canvas.safeArea.right")}%·${get("canvas.safeArea.bottom")}%·${get("canvas.safeArea.left")}%를 보호한다.` : `Protect safe areas of ${get("canvas.safeArea.top")}% top, ${get("canvas.safeArea.right")}% right, ${get("canvas.safeArea.bottom")}% bottom, and ${get("canvas.safeArea.left")}% left.`,
      ko ? `출력 기준은 ${label("canvas.outputTarget", { screen: "화면 발표", print: "인쇄", screen_and_print: "화면과 인쇄" })}.` : `Optimize for ${get("canvas.outputTarget").replaceAll("_", " ")}.`,
    ])}`);
    addSection("quality", `${heading(ko ? "가독성 및 품질" : "READABILITY AND QUALITY")}\n${lines([
      ko ? `텍스트 대비는 WCAG ${get("quality.wcagLevel")} 이상을 유지한다.` : `Maintain at least WCAG ${get("quality.wcagLevel")} text contrast.`,
      boolLine(get("quality.projectorContrast"), "프로젝터 환경에서도 핵심 텍스트와 데이터가 선명하게 구분되어야 한다.", "Keep key text and data clearly distinguishable in projector conditions.", lang),
      boolLine(get("quality.preserveExactText"), "개별 명세의 제목, 본문, 라벨과 출처를 정확히 보존한다.", "Preserve every supplied title, body line, label, caption, and source exactly.", lang),
      boolLine(get("quality.preserveNumbers"), "모든 수치, 날짜, 단위와 기호를 정확히 보존한다.", "Preserve all figures, dates, units, and symbols exactly.", lang),
      boolLine(get("quality.renderKoreanAccurately"), "한글 글리프를 정확히 렌더링하고 깨진 문자나 유사 문자를 만들지 않는다.", "Render Korean glyphs accurately without malformed or look-alike characters.", lang),
      ko ? "최종 출력 크기에서 글자·수치·도형의 가장자리를 픽셀 단위로 선명하게 유지한다. 흐림은 선택한 경우에도 작은 배경 영역에만 국부 적용하고 전체 화면에는 적용하지 않는다." : "Keep text, figures, and shape edges pixel-crisp at final output size. Apply blur only to a small local background region when selected, never across the full canvas.",
    ])}`);
    const forbidden = [];
    const protect = (path, koText, enText) => { if (get(path)) forbidden.push(ko ? koText : enText); };
    protect("constraints.forbidLogos", "로고와 등록상표는 개별 명세가 제공한 실제 자산만 사용한다.", "Use logos and registered trademarks only when supplied as actual assets by the individual specification.");
    protect("constraints.forbidWatermarks", "완성 슬라이드 이미지는 워터마크 없이 출력한다.", "Output the finished slide image without a watermark.");
    protect("constraints.forbidMockupFrames", "완성 슬라이드 캔버스만 출력한다.", "Output only the finished slide canvas.");
    protect("constraints.forbidDeviceBezels", "슬라이드 외부의 노트북·모니터 프레임은 생략한다.", "Keep laptop and monitor frames outside the slide output.");
    protect("constraints.forbidFakeUI", "화면은 실제 발표 콘텐츠로만 구성한다.", "Compose the canvas only from actual presentation content.");
    protect("constraints.forbidMeaninglessDecorations", "장식 요소는 정보 관계나 시선 흐름을 설명할 때만 사용한다.", "Use decorative elements only when they explain information relationships or reading flow.");
    protect("constraints.forbidInventedContent", "개별 명세가 제공한 사실·수치·문구만 사용한다.", "Use only facts, figures, and wording supplied by the individual specification.");
    protect("constraints.forbidDuplicateText", "같은 문구는 의도된 한 위치에 한 번만 표시한다.", "Show each supplied phrase once in its intended location.");
    protect("constraints.forbidMalformedKorean", "한글과 기호를 정확한 문자로 렌더링한다.", "Render Korean and symbols with the exact intended characters.");
    protect("constraints.forbidExcessiveEffects", "그라데이션·그림자·광택은 정보 전달과 선명도를 유지하는 범위에서 절제한다.", "Keep gradients, shadows, and gloss restrained so information remains crisp.");
    if (get("constraints.customRule").trim()) forbidden.push(get("constraints.customRule").trim());
    if (isSectionEnabled("constraints") && forbidden.length) sections.push(`${heading(ko ? "추가 품질 보호" : "ADDITIONAL QUALITY PROTECTION")}\n${lines(forbidden)}`);
    if (model === "gemini" && isSectionEnabled("colors")) sections.push(`${heading(ko ? "Gemini 최종 준수 점검" : "GEMINI FINAL COMPLIANCE CHECK")}\n${lines([
      ko ? "완성 직전 개별 명세의 문구·수치·정보 관계가 정확한지, 텍스트와 데이터가 선명한지 순서대로 확인한다." : "Before finalizing, verify exact supplied wording, figures, and information relationships, then verify text and data legibility.",
      ko ? `색상 앵커를 다시 확인한다: Primary=${get("colors.primary")}, Secondary=${get("colors.secondary")}, Accent=${get("colors.accent")}, Background=${get("colors.background")}, Text Primary=${get("colors.textPrimary")}는 활용 가능한 역할 색상이다. 의미에 필요한 역할만 선택하고 Accent가 불필요하면 생략한다. 사진의 고유색과 파생 중성색을 보존해 전체 화면이 한 색조로 수렴하지 않게 한다.` : `Re-check the available color anchors: Primary ${get("colors.primary")}, Secondary ${get("colors.secondary")}, Accent ${get("colors.accent")}, Background ${get("colors.background")}, and Text Primary ${get("colors.textPrimary")}. Select only roles needed by the slide; omit Accent when it adds no meaning. Preserve local photographic color and derived neutrals so the whole slide does not collapse into one hue.`,
      ko ? "점검 결과를 설명문으로 출력하지 말고 수정된 완성 슬라이드 이미지에만 반영한다." : "Do not output the compliance review as prose; apply corrections only to the finished slide image.",
    ])}`);
    sections.push(`${heading(ko ? "개별 슬라이드 명세와의 관계" : "RELATIONSHIP TO THE INDIVIDUAL SLIDE SPECIFICATION")}\n${lines([
      ko ? "개별 슬라이드 명세를 실제 콘텐츠, 사실, 수치, 정보 관계와 시각적 초점의 유일한 출처로 사용한다." : "Treat the individual slide specification as the sole source of actual content, facts, figures, information relationships, and focal priority.",
      ko ? "별도 발표 맥락과 스킬이 제공한 핵심 주제·목적, 콘텐츠, 비주얼 논증, 의미 그룹·관계·읽기 우선순위를 먼저 해석한다. 명시적 구성 잠금이 없으면 이 공통 디자인 가이드 안에서 구도와 매체 후보를 비교해 가장 효과적인 비주얼을 자율적으로 완성한다." : "First interpret the separate presentation context and the skill-supplied core topic and purpose, content, visual argument, semantic groups, relationships, and reading priority. Unless an explicit composition lock is present, compare composition and medium candidates and autonomously complete the most effective visual solution within this common design guide.",
      ko ? "공통 디자인 규칙과 개별 명세가 충돌하면 사실·문구·수치·의미와 관계는 개별 명세를 보존하고 디자인 표현만 조정한다." : "If a design rule conflicts with supplied facts, wording, figures, meaning, or relationships, preserve the individual specification and adapt only the visual treatment.",
      ["preferred", "required"].includes(get("photoComposite.mode"))
        ? (ko ? "명세에 없는 문구·사실·수치·라벨을 추론하거나 빈 영역을 임의 콘텐츠로 채우지 않는다. 실사 피사체는 명세 내용과 직접 연결되는 일반 맥락 장면만 허용한다." : "Do not infer missing wording, facts, figures, or labels, or fill empty areas with invented content. A photo subject may only be a general context scene directly tied to the supplied specification.")
        : (ko ? "명세에 없는 내용을 추론하거나 빈 영역을 임의 콘텐츠로 채우지 않는다." : "Do not infer missing content or fill empty areas with invented material."),
    ])}`);

    if (outputMode !== "compact") return buildEfficientDesignGuide(ko, model, outputMode);

    let chosen = sections;
    if (outputMode === "style_lock") chosen = [
      `${heading(ko ? "Deck Style Lock 사용법" : "DECK STYLE LOCK USAGE")}\n${lines([
        ko ? "이 블록을 각 개별 슬라이드 명세 뒤에 동일하게 결합해 시각적 일관성을 잠근다." : "Append this block unchanged to each individual slide specification to lock visual consistency.",
        ko ? "이 블록 자체는 이미지 생성을 실행하거나 슬라이드 콘텐츠를 추가하지 않는다." : "This block does not execute image generation or add slide content by itself.",
        model === "gpt_image" ? (ko ? "GPT Image가 반복 적용할 디자인 제약으로 해석하도록 간결한 명령형을 유지한다." : "Keep concise imperative wording so GPT Image treats this as reusable design constraints.") : model === "gemini" ? (ko ? "Gemini가 반복 적용할 디자인 제약으로 해석하도록 섹션 구조를 유지한다." : "Keep the section structure so Gemini treats this as reusable design constraints.") : (ko ? "어떤 이미지 생성 모델에서도 재사용할 수 있는 중립적인 디자인 제약으로 작성한다." : "Keep model-neutral wording for reuse with any image-generation model."),
      ])}`,
      ...sections.filter((section) => !section.startsWith(heading(ko ? "출력 계약" : "OUTPUT CONTRACT"))),
    ];
    if (outputMode === "compact") {
      const compactSections = [];
      compactSections.push(`${heading(ko ? "출력 및 범위" : "OUTPUT AND SCOPE")}\n${isSectionEnabled("project") ? `${modelLine}\n` : ""}${scopeText(ko)}`);
      if (isSectionEnabled("direction")) compactSections.push(`${heading(ko ? "디자인 DNA" : "DESIGN DNA")}\n${designDnaPromptLines(ko, true).join(" ")}`);
      if (isSectionEnabled("composition")) compactSections.push(`${heading(ko ? "시각 문법" : "VISUAL GRAMMAR")}\n${[...compositionGrammarPromptLines(ko, true), ...visualResourcePromptLinesV3(ko, true)].join(" ")}`);
      if (isSectionEnabled("colors")) compactSections.push(`${heading(ko ? "색상 팔레트" : "COLOR PALETTE")}\n${efficientColorDefinition(ko, false)[0]} ${modelColorExecutionLines(ko, model, true).join(" ")}`);
      if (isSectionEnabled("typography")) compactSections.push(`${heading(ko ? "타이포그래피 언어" : "TYPOGRAPHIC LANGUAGE")}\n${typographyPromptLines(ko, true).join(" ")}`);
      const compactPhotoLines = photoCapabilityPromptLinesV3(ko, true);
      if (isSectionEnabled("photoComposite")) compactSections.push(`${heading(ko ? "이미지·그래픽 언어" : "IMAGERY AND GRAPHICS")}\n${[...imageGraphicLanguagePromptLines(ko), ...compactPhotoLines].join(" ")}`);
      if (isSectionEnabled("background")) compactSections.push(`${heading(ko ? "배경과 표면" : "BACKGROUND AND SURFACES")}\n${backgroundCapabilityPromptLinesV3(ko, true).join(" ")}`);
      const compactFrameLines = [...(headerSectionEnabled ? headerPromptLines(ko).slice(0, 2) : []), ...(footerSectionEnabled ? footerPromptLines(ko).slice(0, 2) : [])];
      if (compactFrameLines.length) compactSections.push(`${heading(ko ? "헤더 및 푸터" : "HEADER AND FOOTER")}\n${compactFrameLines.join(" ")}`);
      if (isSectionEnabled("canvas")) compactSections.push(`${heading(ko ? "캔버스" : "CANVAS")}\n${ko ? `${get("canvas.aspectRatio")}, ${get("canvas.width")}×${get("canvas.height")}px, 안전영역 ${get("canvas.safeArea.top")}/${get("canvas.safeArea.right")}/${get("canvas.safeArea.bottom")}/${get("canvas.safeArea.left")}%.` : `${get("canvas.aspectRatio")}, ${get("canvas.width")}×${get("canvas.height")} px; safe areas ${get("canvas.safeArea.top")}/${get("canvas.safeArea.right")}/${get("canvas.safeArea.bottom")}/${get("canvas.safeArea.left")}%.`}`);
      if (isSectionEnabled("quality")) compactSections.push(`${heading(ko ? "가독성 및 품질" : "READABILITY AND QUALITY")}\n${ko ? `WCAG ${get("quality.wcagLevel")} 대비, 정확한 한글, 발표 거리 가독성과 픽셀 단위의 선명한 가장자리를 유지한다. 전면 블러는 사용하지 않는다.` : `Maintain WCAG ${get("quality.wcagLevel")} contrast, accurate Korean glyphs, presentation-distance legibility, and pixel-crisp edges without full-canvas blur.`}`);
      if (isSectionEnabled("constraints") && forbidden.length) compactSections.push(`${heading(ko ? "추가 품질 보호" : "ADDITIONAL QUALITY PROTECTION")}\n${lines(forbidden)}`);
      compactSections.push(`${heading(ko ? "개별 명세 우선" : "INDIVIDUAL SPECIFICATION PRIORITY")}\n${["preferred", "required"].includes(get("photoComposite.mode"))
        ? (ko ? "개별 명세의 양식·콘텐츠·목적·표현 방식·품질 조건을 정확히 보존한다. 공통 자원은 의무가 아니며 도움이 되는 것만 선택한다. 실사 피사체만 콘텐츠와 직접 연결되는 일반 맥락 장면으로 도출할 수 있다." : "Preserve format values, content, purpose, expression method, and quality conditions from the individual specification. Common resources are optional; select only helpful ones. Only a photo subject may be derived as a directly related general context scene.")
        : (ko ? "개별 명세의 양식·콘텐츠·목적·표현 방식·품질 조건을 보존한다. 활용 가능한 자원 중 필요한 것만 선택해 자율 구성하고 명세에 없는 내용을 만들지 않는다." : "Preserve format values, content, purpose, expression method, and quality conditions. Compose autonomously using only helpful available resources, and never invent missing material.")}`);
      chosen = compactSections;
    }
    let result = `${outputMode === "style_lock" ? (ko ? "## Deck Style Lock" : "## DECK STYLE LOCK") : (ko ? "## 공통 디자인 시스템" : "## COMMON DESIGN SYSTEM")}\n\n${chosen.join("\n\n")}`;
    if (outputMode === "compact") result = fitPromptToLimit(result, promptLengthBudget("compact"), ko, model, forbidden);
    return result.trim();
  }

  function recordHistory(snapshot) {
    const value = snapshot ? JSON.parse(snapshot) : clone(state);
    history.push(value);
    if (history.length > 50) history.shift();
    future = [];
    if (JOURNEY_PROFILE_META[state.journey?.profileId]) state.journey.profileDirty = true;
  }

  function captureRefreshFocus() {
    const element = document.activeElement;
    if (!element || !root.contains(element)) return null;
    const supportedKeys = [
      "path", "briefPath", "briefValue", "journeyProfile", "journeyStage",
      "pageNumberLocation", "photoPolicyLevel", "photoPolicyScope", "action",
      "headerProfile", "footerProfile", "canvasPreset", "typographyPreset",
      "quickSetupMode", "quickRandom", "userPresetApply", "userPresetOverwrite", "userPresetDelete",
      "slideStyleCategory", "slideStyleId", "slideStyleQuery", "slideStyleFilter",
    ];
    const data = supportedKeys.reduce((result, key) => {
      if (element.dataset?.[key] !== undefined) result[key] = element.dataset[key];
      return result;
    }, {});
    if (!Object.keys(data).length && !element.id) return null;
    return {
      id: element.id || "",
      data,
      value: "value" in element ? String(element.value) : "",
    };
  }

  function restoreRefreshFocus(descriptor) {
    if (!descriptor) return;
    window.setTimeout(() => {
      let candidates = descriptor.id ? [document.getElementById(descriptor.id)].filter(Boolean) : [];
      const entries = Object.entries(descriptor.data);
      if (!candidates.length && entries.length) {
        const [firstKey] = entries[0];
        const attribute = firstKey.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
        candidates = [...root.querySelectorAll(`[data-${attribute}]`)].filter((element) => entries.every(([key, value]) => element.dataset?.[key] === value));
      }
      const exactValue = candidates.find((element) => "value" in element && String(element.value) === descriptor.value);
      const target = exactValue || candidates[0];
      if (target && !target.disabled) target.focus({ preventScroll: true });
    }, 0);
  }

  function refresh(options = {}) {
    const focusDescriptor = options.full ? captureRefreshFocus() : null;
    syncPhotographyState();
    const issues = validateFiveStageState();
    if (!issues.some((item) => item.level === "error")) state.output.text = buildPrompt();
    if (options.full) {
      renderAccordion(issues);
    } else {
      renderNavigation(issues);
    }
    renderInstitutionRandom();
    renderResults(issues);
    saveDraft();
    window.PromptDeckTabs?.syncHeaderActionStates?.();
    restoreRefreshFocus(focusDescriptor);
  }
  function toast(message) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    window.setTimeout(() => el.classList.remove("show"), 2200);
  }

  function applySlideStyle(styleId, scope = "full") {
    const style = SLIDE_STYLE_CATALOG?.get?.(styleId || slideStyleUi.draftId);
    if (!style) {
      toast("적용할 슬라이드 스타일을 먼저 선택해주세요.");
      return;
    }
    const settings = clone(style.settings || {});
    recordHistory();
    Object.assign(state.visualStyle, settings.visualStyle || {}, {
      presetId: style.id,
      presetVersion: Number(SLIDE_STYLE_CATALOG?.version) || 1,
      presetNameKo: style.nameKo,
      presetNameEn: style.nameEn,
      applyScope: scope,
      presetFingerprint: "",
    });
    Object.assign(state.visualDirection, settings.visualDirection || {}, { source: "slide-style" });

    if (scope === "full") {
      const compositionProfile = COMPOSITION_PROFILES[settings.compositionProfile] || COMPOSITION_PROFILES.controlled;
      Object.assign(state.composition, clone(DEFAULT_STATE.composition), clone(compositionProfile.values), settings.composition || {}, { profile: `slide-style:${style.id}` });
      setSlideStyleColors(style);

      const typographyPreset = TYPOGRAPHY_PRESETS[settings.typographyPreset] || TYPOGRAPHY_PRESETS.public;
      Object.assign(state.typography, clone(DEFAULT_STATE.typography), clone(typographyPreset.values), settings.typography || {}, {
        source: "slide-style",
        presetId: `slide-style:${style.id}`,
        visualTypographyId: "",
        visualTypographyNameKo: "",
        visualTypographyNameEn: "",
        visualTypographyCategory: "",
        visualTypographyDescription: "",
        visualTypographyPromptSummary: "",
        visualTypographyHighRisk: false,
      });
      typographyDraft = null;
      typographyUi.source = "common";

      const backgroundProfile = BACKGROUND_PROFILES[settings.backgroundProfile] || BACKGROUND_PROFILES.report;
      Object.assign(state.background, clone(DEFAULT_STATE.background), clone(backgroundProfile.values), settings.background || {}, { source: "slide-style", profile: `slide-style:${style.id}` });

      const headerProfile = HEADER_PROFILES[settings.headerProfile] || HEADER_PROFILES.minimal;
      Object.assign(state.header, clone(DEFAULT_STATE.header), clone(headerProfile.values), { source: "slide-style", profile: `slide-style:${style.id}` });
      const footerProfile = FOOTER_PROFILES[settings.footerProfile] || FOOTER_PROFILES.minimal;
      Object.assign(state.footer, clone(DEFAULT_STATE.footer), clone(footerProfile.values), { source: "slide-style", profile: `slide-style:${style.id}` });
      if (state.header.type === "none") {
        state.header.showPageNumber = false;
        state.header.showSectionLabel = false;
        state.header.showSubtitle = false;
        state.header.divider = false;
      }
      if (state.footer.type === "none") {
        state.footer.showPageNumber = false;
        state.footer.divider = false;
      }
      if (state.header.showPageNumber && state.footer.showPageNumber) state.header.showPageNumber = false;

      state.resources = { ...clone(DEFAULT_STATE.resources), ...(settings.resources || {}) };
      const resourceCompositionMap = {
        photo: "allowPhotography",
        layeredComposite: "allowLayeredComposition",
        icons: "allowPictogram",
        threeD: "allowTechnical3d",
        illustration: "allowIllustration",
        dataVisualization: "allowDataVisualization",
        diagramInfographic: "allowDiagram",
        typographicFocal: "allowTypographicFocus",
      };
      Object.entries(resourceCompositionMap).forEach(([resourceKey, compositionKey]) => {
        state.composition[compositionKey] = state.resources[resourceKey] !== "exclude";
      });
      state.composition.allowInfographic = state.resources.diagramInfographic !== "exclude";
      state.photoComposite = { ...clone(DEFAULT_STATE.photoComposite), ...(settings.photoComposite || {}) };
      Object.assign(state.visualDirection, {
        mediumId: "",
        mediumSource: "",
        mediumVersion: 1,
        mediumNameKo: "",
        mediumNameEn: "",
        mediumCategory: "",
        mediumGroup: "",
        mediumTexture: "",
        mediumUsage: "",
        mediumDescription: "",
        mediumPromptSummaryKo: "",
        mediumPromptSummaryEn: "",
      });
      directionDraft = null;
      directionUi.source = "common";
    }

    syncPhotographyState();
    state.visualStyle.presetFingerprint = slideStyleFingerprint();
    if (!get("journey.profileId")) {
      state.journey.profileId = "custom";
      state.journey.profileDirty = false;
    }
    state.journey.reviewedStages = [...new Set([...(get("journey.reviewedStages") || []), "style"])];
    if (JOURNEY_PROFILE_META[state.journey?.profileId]) state.journey.profileDirty = true;
    state.recommendationMeta = { source: "slide-style", styleId: style.id, label: style.nameKo, scope, appliedAt: new Date().toISOString() };
    quickRandomState = null;
    slideStyleUi.draftId = "";
    refresh({ full: true });
    toast(`${style.nameKo}를 ${scope === "character" ? "디자인 인상에" : "전체 디자인에"} 적용했습니다.`);
  }

  function clearSlideStyleSelection() {
    const style = selectedSlideStyle();
    if (!style) return;
    recordHistory();
    Object.assign(state.visualStyle, { presetId: "", presetVersion: 0, presetNameKo: "", presetNameEn: "", applyScope: "", presetFingerprint: "" });
    if (state.visualDirection.source === "slide-style") state.visualDirection.source = "custom";
    if (state.colors.source === "slide-style") Object.assign(state.colors, { source: "custom", preset: "custom", presetId: "" });
    if (state.typography.source === "slide-style") Object.assign(state.typography, { source: "custom", presetId: "custom" });
    if (state.background.source === "slide-style") Object.assign(state.background, { source: "custom", profile: "custom" });
    if (state.header.source === "slide-style") Object.assign(state.header, { source: "custom", profile: "custom" });
    if (state.footer.source === "slide-style") Object.assign(state.footer, { source: "custom", profile: "custom" });
    if (state.recommendationMeta?.source === "slide-style") state.recommendationMeta = null;
    slideStyleUi.draftId = "";
    refresh({ full: true });
    toast(`${style.nameKo} 연결을 해제하고 현재 설정값은 유지했습니다.`);
  }

  function applyDesignPreset(presetId, includeRelated) {
    const key = presetId || directionDraft?.presetId || get("visualDirection.preset");
    const preset = DESIGN_PRESETS[key]?.[1];
    if (!preset) return;
    const shouldApplyRelated = includeRelated ?? directionUi.applyRelated;
    recordHistory();
    state.visualDirection.preset = key;
    state.visualDirection.source = "common";
    state.visualDirection.intensity = preset.intensity;
    state.visualDirection.keywords = clone(preset.keywords);
    if (shouldApplyRelated) {
      const compositionKey = DESIGN_COMPOSITION_MAP[key] || "controlled";
      Object.assign(state.composition, clone(COMPOSITION_PROFILES[compositionKey].values), { profile: compositionKey });
      setCommonColorPreset(preset.colorPreset);
      state.background.type = preset.background;
      state.background.source = "custom";
      state.background.profile = "custom";
      state.background.purpose = preset.background === "gradient" ? "atmosphere" : "focus";
      state.header.type = preset.header;
      state.footer.type = preset.footer;
      state.header.source = "custom";
      state.header.profile = "custom";
      state.footer.source = "custom";
      state.footer.profile = "custom";
      state.typography.headlineCharacter = preset.headline;
    }
    directionDraft = null;
    directionUi.applyRelated = false;
    refresh({ full: true });
    toast(shouldApplyRelated ? "디자인 방향과 관련 설정을 함께 적용했습니다." : "디자인 방향만 적용했습니다.");
  }

  function applyJourneyProfile(profileId) {
    const meta = JOURNEY_PROFILE_META[profileId];
    const settings = meta?.settings;
    if (!meta || !settings) return;
    const identityAxes = IDENTITY_PROFILE_AXES[profileId] || [2, 3, 2, 2];
    recordHistory();
    state.journey.profileId = profileId;
    state.journey.profileDirty = false;
    state.journey.reviewedStages = [];
    [state.visualStyle.formality, state.visualStyle.energy, state.visualStyle.expression] = identityAxes;
    setCommonColorPreset(settings.color);
    state.colors.baseCanvas = ["inspire", "act"].includes(profileId) ? "palette" : "white";
    state.typography.emphasis = ["decide", "act", "inspire"].includes(profileId) ? "strong" : profileId === "inform" ? "reading" : "balanced";
    RESOURCE_META.forEach(([key]) => { if (state.resources[key] !== "exclude") state.resources[key] = "auto"; });
    const preferredResources = {
      inform: ["dataVisualization"],
      explain: ["diagramInfographic"],
      decide: ["dataVisualization", "typographicFocal"],
      act: ["icons", "typographicFocal"],
      teach: ["illustration", "diagramInfographic"],
      inspire: ["photo", "layeredComposite"],
    }[profileId] || [];
    preferredResources.forEach((key) => { if (state.resources[key] !== "exclude") state.resources[key] = "allow"; });
    state.recommendationMeta = { source: "quick-profile", profile: profileId, label: `${meta.dimension} · ${meta.label}`, appliedAt: new Date().toISOString() };
    quickRandomState = null;
    refresh({ full: true });
    toast(`${meta.dimension} 변화 · ${meta.label} 권장 시작값을 적용했습니다.`);
  }

  function applyIdentityGrammarRecommendation() {
    const { grammar } = identityGrammarRecommendation();
    recordHistory();
    Object.assign(state.composition, grammar, { profile: "custom" });
    state.journey.reviewedStages = [...new Set([...(get("journey.reviewedStages") || []), "identity"])];
    refresh({ full: true });
    toast("인상 선택을 구조 단계의 형태·선·표면·리듬·위계에 연결했습니다.");
  }

  function moveJourneyStage(nextIndex) {
    const current = currentJourneyStage();
    const currentId = JOURNEY_STAGES[current].id;
    state.journey.reviewedStages = [...new Set([...(get("journey.reviewedStages") || []), currentId])];
    state.journey.activeStage = Math.max(0, Math.min(JOURNEY_STAGES.length - 1, Number(nextIndex) || 0));
    if (state.journey.activeStage > 0) quickSetupUi.open = false;
    const firstSection = JOURNEY_STAGES[state.journey.activeStage].sections[0];
    state.activeStep = Math.max(0, STEP_META.findIndex(([id]) => id === firstSection));
    refresh({ full: true });
    window.setTimeout(() => document.getElementById("cpdJourneyPanel")?.focus({ preventScroll: true }), 0);
  }
  function applyCompositionProfile(profileKey) {
    const profile = COMPOSITION_PROFILES[profileKey];
    if (!profile) return;
    recordHistory();
    Object.assign(state.composition, clone(profile.values), { profile: profileKey });
    refresh({ full: true });
    toast(`${profile.label} 구도 문법을 적용했습니다.`);
  }
  function recommendPurpose() {
    const purposeMap = { internal: "strategy", external: "public", evaluation: "evaluation", policy: "public", investment: "investment" };
    analyzeQuickStartSource("", purposeMap[get("project.purpose")] || "public");
    openDialog("cpdQuickStartDialog");
    toast("프로젝트 용도에 맞는 시각 구성 추천을 준비했습니다.");
  }

  function applyTypographyPreset(key) {
    const preset = TYPOGRAPHY_PRESETS[key];
    if (!preset) return;
    recordHistory();
    Object.assign(state.typography, clone(preset.values), {
      source: "common",
      presetId: key,
      visualTypographyId: "",
      visualTypographyNameKo: "",
      visualTypographyNameEn: "",
      visualTypographyCategory: "",
      visualTypographyDescription: "",
      visualTypographyPromptSummary: "",
      visualTypographyHighRisk: false,
    });
    typographyDraft = null;
    refresh({ full: true });
    toast(`${preset.label} 조합을 적용했습니다.`);
  }

  function applyTypographyStyle(item) {
    const style = TYPOGRAPHY_CATALOG?.toSlideTypography?.(item, typographyUi.scope);
    if (!style) return;
    recordHistory();
    Object.assign(state.typography, {
      source: "visual-mixer",
      visualTypographyId: style.id,
      visualTypographyNameKo: style.nameKo,
      visualTypographyNameEn: style.nameEn,
      visualTypographyCategory: style.category,
      visualTypographyDescription: style.description,
      visualTypographyPromptSummary: style.promptSummary,
      visualTypographyScope: style.scope,
      visualTypographyHighRisk: style.highRisk,
    });
    typographyDraft = null;
    refresh({ full: true });
    toast(`${style.nameKo} 스타일을 ${style.scope === "headline" ? "제목에" : style.scope === "cover_section" ? "표지·구분 슬라이드에" : "전체 텍스트에"} 적용했습니다.`);
  }

  function removeTypographyStyle() {
    if (!get("typography.visualTypographyId")) return;
    recordHistory();
    Object.assign(state.typography, { source: "common", visualTypographyId: "", visualTypographyNameKo: "", visualTypographyNameEn: "", visualTypographyCategory: "", visualTypographyDescription: "", visualTypographyPromptSummary: "", visualTypographyHighRisk: false });
    typographyDraft = null;
    refresh({ full: true });
    toast("비주얼 믹서 타이포그래피 연결을 해제했습니다.");
  }

  function applyMedium(medium) {
    if (!medium) return;
    recordHistory();
    assignMediumToState(medium, medium.source || "visual-mixer");
    refresh({ full: true });
    toast("선택한 화풍을 전체 이미지 리터칭에 적용했습니다.");
  }

  function removeMedium() {
    if (!get("visualDirection.mediumId") && !get("visualDirection.mediumNameKo")) return;
    recordHistory();
    Object.assign(state.visualDirection, {
      mediumId: "", mediumSource: "", mediumVersion: 1, mediumNameKo: "", mediumNameEn: "",
      mediumCategory: "", mediumGroup: "", mediumTexture: "", mediumUsage: "", mediumDescription: "",
      mediumPromptSummaryKo: "", mediumPromptSummaryEn: "",
    });
    if (state.visualDirection.source === "visual-mixer") state.visualDirection.source = "common";
    directionDraft = null;
    refresh({ full: true });
    toast("이미지 리터칭에서 화풍을 해제했습니다.");
  }
  function applyColorPreset() {
    const key = get("colors.preset");
    if (!COLOR_PRESETS[key]) return;
    recordHistory();
    setCommonColorPreset(key);
    refresh({ full: true });
    toast("선택한 색상 팔레트를 적용했습니다.");
  }
  function applyComponentPreset(kind, presetKey) {
    const collections = { card: CARD_PRESETS, table: TABLE_PRESETS, chart: CHART_PRESETS };
    const preset = collections[kind]?.[presetKey];
    if (!preset) return false;
    Object.assign(state.components, clone(preset.values));
    state.components[`${kind}Preset`] = presetKey;
    return true;
  }
  function applyComponentProfile(profileKey) {
    const profile = COMPONENT_PROFILES[profileKey];
    if (!profile) return;
    recordHistory();
    state.components.profile = profileKey;
    [state.components.cardEnabled, state.components.tableEnabled, state.components.chartEnabled] = profile.enabled;
    applyComponentPreset("card", profile.cardPreset);
    applyComponentPreset("table", profile.tablePreset);
    applyComponentPreset("chart", profile.chartPreset);
    refresh({ full: true });
    toast(`${profile.label} 설정을 적용했습니다.`);
  }
  function applyImageryProfile(profileKey) {
    const profile = IMAGERY_PROFILES[profileKey];
    if (!profile) return;
    recordHistory();
    Object.assign(state.imagery, clone(profile.values), { source: "common", profile: profileKey });
    refresh({ full: true });
    toast(`${profile.label} 이미지·아이콘 조합을 적용했습니다.`);
  }
  function applyBackgroundProfile(profileKey) {
    const profile = BACKGROUND_PROFILES[profileKey];
    if (!profile) return;
    recordHistory();
    Object.assign(state.background, clone(profile.values), { source: "common", profile: profileKey });
    refresh({ full: true });
    toast(`${profile.label} 배경 설정을 적용했습니다.`);
  }
  function applyHeaderProfile(profileKey) {
    const profile = HEADER_PROFILES[profileKey];
    if (!profile) return;
    recordHistory();
    Object.assign(state.header, clone(profile.values), { source: "common", profile: profileKey });
    if (state.header.showPageNumber && state.footer.showPageNumber) {
      state.footer.showPageNumber = false;
      state.footer.source = "custom";
      state.footer.profile = "custom";
    }
    refresh({ full: true });
    toast(`${profile.label} 헤더 설정을 적용했습니다.`);
  }
  function applyFooterProfile(profileKey) {
    const profile = FOOTER_PROFILES[profileKey];
    if (!profile) return;
    recordHistory();
    Object.assign(state.footer, clone(profile.values), { source: "common", profile: profileKey });
    if (state.footer.showPageNumber && state.header.showPageNumber) {
      state.header.showPageNumber = false;
      state.header.source = "custom";
      state.header.profile = "custom";
    }
    refresh({ full: true });
    toast(`${profile.label} 푸터 설정을 적용했습니다.`);
  }
  function applyFixes() {
    const issues = validateStateV2().filter((item) => item.fix);
    if (!issues.length) return;
    const changes = issues.map((item) => `• ${item.message}`).join("\n");
    if (!window.confirm(`다음 권장 변경을 적용할까요?\n\n${changes}`)) return;
    recordHistory();
    issues.forEach((issue) => {
      if (issue.fix === "resolution") {
        const ratio = getAspectRatio();
        const width = Math.max(320, Number(get("canvas.width")) || 1920);
        state.canvas.height = Math.round(width * ratio.height / ratio.width);
      }
      if (issue.fix === "contrast") state.colors.textPrimary = luminance(get("colors.background")) > .45 ? "#111827" : "#FFFFFF";
      if (issue.fix === "secondaryContrast") state.colors.textSecondary = luminance(get("colors.background")) > .45 ? "#475467" : "#E5E7EB";
      if (issue.fix === "pageNumber") state.footer.showPageNumber = false;
      if (issue.fix === "headerNone") { state.header.showPageNumber = false; state.header.showSectionLabel = false; state.header.showSubtitle = false; state.header.divider = false; }
      if (issue.fix === "footerNone") state.footer.showPageNumber = false;
      if (issue.fix === "backgroundDensity") state.background.avoidBusyBackground = true;
      if (issue.fix === "backgroundPhotoOverlay") state.background.photoOverlay = "medium";
      if (issue.fix === "accentArea") state.colors.accentMaxAreaPercent = 15;
      if (issue.fix === "typographyScope") state.typography.visualTypographyScope = "headline";
      if (issue.fix === "typographySpacing") state.typography.lineHeight = "standard";
      if (issue.fix === "typographyBody") state.typography.bodyScale = "standard";
      if (issue.fix === "photoCompositeDuplicate") state.photoComposite.secondary = "none";
      if (issue.fix === "photoCompositeText") state.photoComposite.protectText = true;
      if (issue.fix === "photoCompositeData") state.photoComposite.protectData = true;
      if (issue.fix === "preserve") { state.quality.preserveExactText = true; state.quality.preserveNumbers = true; }
    });
    refresh({ full: true });
    toast("권장 변경을 적용했습니다.");
  }

  function generate(showDialog = true) {
    const errors = validateFiveStageState().filter((item) => item.level === "error");
    if (errors.length) {
      const targetIndex = STEP_META.findIndex(([id]) => id === errors[0]?.step);
      if (targetIndex >= 0) {
        state.activeStep = targetIndex;
        state.journey.activeStage = journeyStageForSection(errors[0].step);
        refresh({ full: true });
        document.getElementById("cpdJourneyPanel")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      toast("직접 충돌이 있는 설정을 먼저 확인해주세요.");
      return null;
    }
    state.output.text = buildPrompt();
    state.output.generatedAt = new Date().toISOString();
    refresh();
    if (showDialog) openDialog("cpdPromptDialog");
    toast("슬라이드 이미지 공통 프롬프트를 생성했습니다.");
    return state.output.text;
  }
  async function copyPrompt() {
    const text = generate(false);
    if (!text) return;
    try { await navigator.clipboard.writeText(text); toast("공통 프롬프트를 복사했습니다."); }
    catch (_) { document.getElementById("commonPromptOutput")?.select(); toast("직접 선택해 복사해주세요."); }
  }
  async function copySlideStylePrompt() {
    const style = SLIDE_STYLE_CATALOG?.get?.(slideStyleUi.draftId);
    if (!style) {
      toast("복사할 슬라이드 스타일을 먼저 선택해주세요.");
      return;
    }
    const output = document.querySelector("#cpdSlideStyleDialog [data-slide-style-prompt-output]");
    const text = output?.value || buildSlideStyleCopyPrompt(style, slideStylePromptColors(style), slideStylePromptPaletteName(style));
    try {
      await navigator.clipboard.writeText(text);
      toast(`${style.nameKo} 발표자료 제작 문구를 복사했습니다.`);
    } catch (_) {
      output?.focus();
      output?.select();
      toast("문구를 선택했습니다. Ctrl+C로 복사해주세요.");
    }
  }
  function sendToGenerator() {
    const text = generate(false);
    if (!text) return;
    const api = window.PromptDeckSlidePromptGenerator;
    if (api?.setCommonPrompt) api.setCommonPrompt(buildPromptPackage(text));
    else {
      const input = document.getElementById("genCommonPrompt");
      if (input) { input.value = text; input.dataset.promptLang = get("project.promptLanguage"); }
    }
    closeDialogs();
    document.getElementById("tabBtnGenerator")?.click();
    toast("공통 프롬프트를 슬라이드 분리기에 연결했습니다.");
  }

  function buildPromptPackage(text = state.output.text || buildPrompt()) {
    const designPackage = buildDesignPackage(text);
    const headerItems = designPackage.settings?.frame?.header?.elements || [];
    const footerItems = designPackage.settings?.frame?.footer?.elements || [];
    const headerEnabled = Number(designPackage.settings?.frame?.header?.heightPercent) > 0;
    const footerEnabled = Number(designPackage.settings?.frame?.footer?.heightPercent) > 0;
    return {
      schemaVersion: 1,
      contractVersion: SCHEMA_VERSION,
      designContractVersion: SCHEMA_VERSION,
      plannerContractVersion: PLANNER_CONTRACT_VERSION,
      skillPresetContractVersion: SKILL_PRESET_CONTRACT_VERSION,
      source: "common-prompt-builder",
      text,
      lang: get("project.promptLanguage"),
      designPackage,
      targetModel: state.project.targetModel,
      outputMode: state.project.outputMode,
      enabledSlots: {
        contractVersion: window.PromptDeckHeaderFooterContract?.version || "legacy",
        header: {
          enabled: headerEnabled,
          dynamicCategories: true,
          sectionLabel: headerEnabled && headerItems.some((item) => /파트|섹션|section|part/i.test(item)),
          subtitle: headerEnabled && headerItems.some((item) => /부제|subtitle/i.test(item)),
          pageNumber: headerEnabled && headerItems.some((item) => /페이지|page/i.test(item)),
        },
        footer: {
          enabled: footerEnabled,
          dynamicCategories: true,
          pageNumber: footerEnabled && footerItems.some((item) => /페이지|page/i.test(item)),
        },
      },
    };
  }

  function buildFiveStageDesignPackage(text) {
    const resourcePolicy = currentResourcePolicy();
    const galleryStyle = selectedSlideStyle();
    const skillPresetContract = buildSkillPresetContract(galleryStyle);
    const enabledSections = { format: true, visualStyle: true, colors: true, typography: true, visualResources: true, quality: true };
    return {
      schemaVersion: 11,
      source: "common-prompt-builder",
      createdAt: new Date().toISOString(),
      contracts: {
        design: SCHEMA_VERSION,
        planner: PLANNER_CONTRACT_VERSION,
        skillPreset: SKILL_PRESET_CONTRACT_VERSION,
      },
      enabledSections,
      project: {
        documentType: state.project.documentType,
        targetModel: state.project.targetModel,
        promptLanguage: state.project.promptLanguage,
        outputMode: state.project.outputMode,
      },
      recommendationMeta: state.recommendationMeta ? clone(state.recommendationMeta) : null,
      settings: {
        canvas: clone(state.canvas),
        frame: {
          header: { heightPercent: Number(state.frame.headerHeightPercent) || 0, elements: commaItems(state.frame.headerElements) },
          footer: { heightPercent: Number(state.frame.footerHeightPercent) || 0, elements: commaItems(state.frame.footerElements) },
          bodySafeMarginPercent: Number(state.frame.bodySafeMarginPercent) || 0,
          omitOnSlideTypes: ["cover", "agenda", "section-divider", "closing"],
        },
        visualStyle: clone(state.visualStyle),
        galleryStyle: galleryStyle ? {
          id: galleryStyle.id,
          version: Number(SLIDE_STYLE_CATALOG?.version) || 1,
          nameKo: galleryStyle.nameKo,
          nameEn: galleryStyle.nameEn,
          category: galleryStyle.category,
          applyScope: state.visualStyle.applyScope,
          customized: isSlideStyleCustomized(),
          promptKo: galleryStyle.prompt?.ko || "",
          promptEn: galleryStyle.prompt?.en || "",
          distinctiveRules: clone(galleryStyle.distinctiveRules || []),
          avoidRules: clone(galleryStyle.avoidRules || []),
          roleVariants: clone(galleryStyle.roleVariants || {}),
        } : null,
        colors: {
          paletteId: state.colors.presetId,
          paletteNameKo: state.colors.paletteNameKo,
          paletteNameEn: state.colors.paletteNameEn,
          baseCanvas: state.colors.baseCanvas,
          primary: state.colors.primary,
          secondary: state.colors.secondary,
          accent: state.colors.accent,
          background: state.colors.background,
          surface: state.colors.surface,
          textPrimary: state.colors.textPrimary,
          textSecondary: state.colors.textSecondary,
          border: state.colors.border,
          preservePhotoLocalColor: true,
        },
        typography: {
          family: state.typography.family,
          fallback: state.typography.fallback,
          emphasis: state.typography.emphasis,
          voice: state.typography.voice,
          hierarchyStyle: state.typography.hierarchyStyle,
          rhythm: state.typography.rhythm,
          headlineCharacter: state.typography.headlineCharacter,
          headlineScale: state.typography.headlineScale,
          bodyScale: state.typography.bodyScale,
          letterSpacing: state.typography.letterSpacing,
          renderKoreanAccurately: true,
          preserveExactText: true,
        },
        compositionGrammar: {
          formLanguage: state.composition.formLanguage,
          lineLanguage: state.composition.lineLanguage,
          surfaceLanguage: state.composition.surfaceLanguage,
          spatialRhythm: state.composition.spatialRhythm,
          hierarchyBehavior: state.composition.hierarchyBehavior,
          consistencyAnchor: state.composition.consistencyAnchor,
          variationRule: state.composition.variationRule,
          layoutFreedom: state.composition.layoutFreedom,
          container: state.composition.container,
          primaryVisualLanguage: state.composition.primaryVisualLanguage,
          secondaryVisualLanguage: state.composition.secondaryVisualLanguage,
        },
        skillPresetContract,
        visualResources: {
          policyVersion: "2.0",
          ...clone(state.resources),
          allowed: resourcePolicy.allowed.map((item) => item.key),
          excluded: resourcePolicy.excluded.map((item) => item.key),
          automatic: resourcePolicy.automatic.map((item) => item.key),
          entries: RESOURCE_META.map(([key, title, , meta = {}]) => ({
            key,
            mode: state.resources[key],
            titleKo: title,
            titleEn: meta.titleEn || title,
            guidanceKo: meta.guidanceKo || "",
            guidanceEn: meta.guidanceEn || "",
          })),
          combinationContracts: currentResourceCombinationContracts(resourcePolicy),
        },
        contentBasedComposition: true,
        lowContentFocalPresence: true,
        quality: {
          preserveExactText: true,
          preserveNumbers: true,
          renderKoreanAccurately: true,
          readableAtDistance: true,
          pixelCrispEdges: true,
          forbidFullCanvasBlur: true,
          forbidInventedContent: true,
        },
      },
      promptStats: { characters: String(text || "").length, activeSections: Object.keys(enabledSections).length },
    };
  }

  function buildDesignPackage(text = state.output.text || buildPrompt()) {
    return buildFiveStageDesignPackage(text);
    /* Legacy package builder retained below for imported pre-4.0 settings. */
    const settings = {};
    const stateKeys = { direction: "visualDirection" };
    STEP_META.forEach(([id]) => {
      const stateKey = stateKeys[id] || id;
      if (["project", "review"].includes(id) || !isSectionEnabled(id) || !Object.prototype.hasOwnProperty.call(state, stateKey)) return;
      if (id === "composition") {
        settings.compositionGrammar = {
          formLanguage: state.composition.formLanguage,
          lineLanguage: state.composition.lineLanguage,
          surfaceLanguage: state.composition.surfaceLanguage,
          spatialRhythm: state.composition.spatialRhythm,
          hierarchyBehavior: state.composition.hierarchyBehavior,
          consistencyAnchor: state.composition.consistencyAnchor,
          variationRule: state.composition.variationRule,
          layoutFreedom: state.composition.layoutFreedom,
          densityResponse: "lowContentFocalPresence",
          primaryVisualLanguage: state.composition.primaryVisualLanguage,
          secondaryVisualLanguage: state.composition.secondaryVisualLanguage,
          combinationPrinciple: state.composition.combinationPrinciple,
        };
        settings.visualResources = {
          resourceRange: state.composition.resourceRange,
          allowPhotography: state.composition.allowPhotography,
          allowDataVisualization: state.composition.allowDataVisualization,
          allowDiagram: state.composition.allowDiagram,
          allowPictogram: state.composition.allowPictogram,
          allowInfographic: state.composition.allowInfographic,
          allowMap: state.composition.allowMap,
          allowIllustration: state.composition.allowIllustration,
          allowTechnical3d: state.composition.allowTechnical3d,
          allowLayeredComposition: state.composition.allowLayeredComposition,
          allowTypographicFocus: state.composition.allowTypographicFocus,
          allowMixedMedia: state.composition.allowMixedMedia,
          allowOmission: state.composition.allowOmission,
        };
        return;
      }
      if (id === "colors") {
        settings.colors = {
          source: state.colors.source,
          paletteId: state.colors.presetId,
          paletteNameKo: state.colors.paletteNameKo,
          paletteNameEn: state.colors.paletteNameEn,
          mode: state.colors.mode,
          primary: state.colors.primary,
          secondary: state.colors.secondary,
          accent: state.colors.accent,
          background: state.colors.background,
          surface: state.colors.surface,
          textPrimary: state.colors.textPrimary,
          textSecondary: state.colors.textSecondary,
          border: state.colors.border,
          allowDerivedTones: state.colors.allowDerivedTones,
          allowAccentOmission: state.colors.allowAccentOmission,
          identityPattern: state.colors.identityPattern,
          deckColorRhythm: state.colors.deckColorRhythm,
          photoHarmony: state.colors.photoHarmony,
          preservePhotoLocalColor: state.colors.preservePhotoLocalColor,
          forbidGlobalHueWash: state.colors.forbidGlobalHueWash,
        };
        return;
      }
      if (id === "background") {
        settings.background = {
          purpose: state.background.purpose,
          type: state.background.type,
          intensity: state.background.intensity,
          zoneSeparation: state.background.zoneSeparation,
          avoidBusyBackground: state.background.avoidBusyBackground,
          photoMode: state.background.photoMode,
          photoSaturation: state.background.photoSaturation,
          photoOverlay: state.background.photoOverlay,
          photoAllowContextScene: state.background.photoAllowContextScene,
          photoProtectText: state.background.photoProtectText,
          photoRealism: state.background.photoRealism,
        };
        return;
      }
      if (id === "photoComposite") {
        settings.photoComposite = {
          visualRole: state.photoComposite.visualRole,
          layerLogic: state.photoComposite.layerLogic,
          styleBlend: state.photoComposite.styleBlend,
          mode: state.photoComposite.mode,
          style: state.photoComposite.style,
          allowContextScene: state.photoComposite.allowContextScene,
          dropWhenDense: state.photoComposite.dropWhenDense,
          realism: state.photoComposite.realism,
        };
        return;
      }
      settings[id] = clone(state[stateKey]);
    });
    return {
      schemaVersion: 10,
      source: "common-prompt-builder",
      createdAt: new Date().toISOString(),
      enabledSections: Object.fromEntries(STEP_META.map(([id]) => [id, isSectionEnabled(id)])),
      project: {
        purpose: state.project.purpose,
        primaryChange: JOURNEY_PROFILE_META[state.journey.profileId] ? {
          id: state.journey.profileId,
          dimension: JOURNEY_PROFILE_META[state.journey.profileId].dimension,
          label: JOURNEY_PROFILE_META[state.journey.profileId].label,
        } : null,
        audienceRole: state.project.audienceRole,
        audience: state.project.audience,
        audienceLevel: state.project.audienceLevel,
        audienceStance: state.project.audienceStance,
        readingMode: state.project.readingMode,
        presentationPurpose: state.project.presentationPurpose,
        desiredAction: state.project.desiredAction,
        currentPerception: state.project.currentPerception,
        targetPerception: state.project.targetPerception,
        keyBarrier: state.project.keyBarrier,
        governingThought: state.project.governingThought,
        documentType: state.project.documentType,
        targetModel: state.project.targetModel,
        promptLanguage: state.project.promptLanguage,
        outputMode: state.project.outputMode,
      },
      recommendationMeta: state.recommendationMeta ? clone(state.recommendationMeta) : null,
      settings,
      promptStats: { characters: String(text || "").length, activeSections: Object.keys(settings).length },
    };
  }
  function exportJson() {
    const data = clone(state);
    data.output = { text: "", generatedAt: null };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(state.project.name || "common-prompt").replace(/[\\/:*?\"<>|]/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("설정 JSON을 저장했습니다.");
  }
  function resetProject() {
    if (!window.confirm("현재 공통 프롬프트 설정을 초기화할까요?")) return;
    recordHistory();
    state = clone(DEFAULT_STATE);
    expandedSteps = new Set();
    directionDraft = null;
    slideStyleUi = createSlideStyleUi();
    directionUi = { source: "common", applyRelated: false, query: "", category: "recommended", group: "all", texture: "all", usage: "all", visible: 12 };
    designAdvancedOpen = new Set();
    inspirationStarterOpen = false;
    typographyDraft = null;
    typographyUi = { source: "common", category: "recommended", visible: 12, scope: "headline" };
    quickStartDraft = createQuickStartDraft();
    quickApplyNotice = null;
    quickSetupUi = { mode: "quick", open: false };
    quickSetupReturnFocus = null;
    slideStyleGalleryOpen = false;
    slideStyleGalleryReturnFocus = null;
    slideStyleGalleryScrollTop = 0;
    quickRandomState = null;
    institutionRandomState = null;
    refresh({ full: true });
    toast("공통 디자인 설정을 초기화했습니다.");
  }

  function handleAction(action) {
    if (action === "undo" && history.length) { future.push(clone(state)); state = history.pop(); quickApplyNotice = null; quickRandomState = null; refresh({ full: true }); return; }
    if (action === "redo" && future.length) { history.push(clone(state)); state = future.pop(); quickRandomState = null; refresh({ full: true }); return; }
    if (action === "undo-quick-apply" && history.length) { future.push(clone(state)); state = history.pop(); quickApplyNotice = null; refresh({ full: true }); toast("추천 적용을 되돌렸습니다."); return; }
    if (action === "dismiss-quick-notice") { quickApplyNotice = null; renderQuickApplyNotice(); return; }
    if (action === "open-quick-setup-modal" || action === "toggle-quick-setup") {
      quickSetupReturnFocus = document.activeElement;
      openDialog("cpdQuickSetupDialog");
      return;
    }
    if (action === "close-quick-setup-modal") {
      closeQuickSetupModal();
      return;
    }
    if (action === "open-slide-style-gallery") {
      slideStyleGalleryReturnFocus = document.activeElement;
      resetSlideStyleGalleryScroll();
      openDialog("cpdSlideStyleDialog");
      return;
    }
    if (action === "close-slide-style-gallery") {
      closeSlideStyleGallery();
      return;
    }
    if (action === "save-user-preset") return saveCurrentUserPreset();
    if (action === "collapse-all") { expandedSteps.clear(); refresh({ full: true }); return; }
    if (action === "journey-custom-start") {
      recordHistory();
      state.journey.profileId = "custom";
      state.journey.profileDirty = false;
      state.journey.reviewedStages = [];
      state.recommendationMeta = null;
      quickRandomState = null;
      refresh({ full: true });
      toast("현재 기본값에서 직접 구성을 시작합니다.");
      return;
    }
    if (action === "journey-prev") { moveJourneyStage(currentJourneyStage() - 1); return; }
    if (action === "journey-next") {
      if (!get("journey.profileId")) { toast("먼저 청중의 1차 변화를 선택하거나 직접 시작해주세요."); return; }
      moveJourneyStage(currentJourneyStage() + 1);
      return;
    }
    if (action === "slide-style-search") {
      slideStyleUi.query = root.querySelector("[data-slide-style-query]")?.value.trim() || "";
      slideStyleUi.draftId = "";
      slideStyleUi.visible = initialSlideStyleVisible(slideStyleUi.category);
      resetSlideStyleGalleryScroll();
      refresh({ full: true });
      return;
    }
    if (action === "clear-slide-style-search") {
      slideStyleUi.query = "";
      slideStyleUi.draftId = "";
      slideStyleUi.visible = initialSlideStyleVisible(slideStyleUi.category);
      resetSlideStyleGalleryScroll();
      refresh({ full: true });
      return;
    }
    if (action === "clear-slide-style-filters") {
      SLIDE_STYLE_FACET_FILTERS.forEach((filter) => { slideStyleUi[filter.key] = "all"; });
      slideStyleUi.draftId = "";
      slideStyleUi.visible = initialSlideStyleVisible(slideStyleUi.category);
      resetSlideStyleGalleryScroll();
      refresh({ full: true });
      return;
    }
    if (action === "copy-slide-style-prompt") return copySlideStylePrompt();
    if (action === "apply-slide-style-character") return applySlideStyle(slideStyleUi.draftId, "character");
    if (action === "apply-slide-style-full") return applySlideStyle(slideStyleUi.draftId, "full");
    if (action === "cancel-slide-style-draft") {
      slideStyleUi.draftId = "";
      syncSlideStyleSelectionUi();
      return;
    }
    if (action === "clear-slide-style") return clearSlideStyleSelection();
    if (action === "institution-random") return applyInstitutionRandom();
    if (action === "institution-random-color") return randomizeInstitutionColor();
    if (action === "institution-random-medium") return randomizeInstitutionMedium();
    if (action === "output-settings") { openDialog("cpdOutputSettingsDialog"); return; }
    if (action === "open-quick-start" || action === "open-quick-templates") {
      quickStartReturnFocus = document.activeElement;
      quickStartDraft = createQuickStartDraft();
      openDialog("cpdQuickStartDialog");
      if (action === "open-quick-templates") window.setTimeout(() => document.querySelector("#cpdQuickStartDialog [data-quick-template]")?.focus(), 0);
      return;
    }
    if (action === "cancel-quick-start") { cancelQuickStart(); return; }
    if (action === "analyze-quick-start") {
      const source = document.getElementById("cpdQuickSource")?.value.trim() || "";
      if (source.length < 20) { toast("분석할 내용을 20자 이상 붙여넣거나 목적 템플릿을 선택해주세요."); return; }
      analyzeQuickStartSource(source);
      renderQuickStartDialog();
      window.setTimeout(() => document.querySelector("#cpdQuickStartDialog [data-quick-recommendation]:not(:disabled)")?.focus(), 0);
      return;
    }
    if (action === "quick-start-back") {
      quickStartDraft = createQuickStartDraft({ source: quickStartDraft.source, sourceLength: quickStartDraft.source.length });
      renderQuickStartDialog();
      window.setTimeout(() => document.getElementById("cpdQuickSource")?.focus(), 0);
      return;
    }
    if (action === "clear-quick-source") {
      quickStartDraft.source = "";
      const input = document.getElementById("cpdQuickSource");
      if (input) input.value = "";
      const count = document.getElementById("cpdQuickSourceCount");
      if (count) count.textContent = "0 / 30,000자";
      input?.focus();
      return;
    }
    if (action === "apply-quick-start") return applyQuickStartRecommendations();
    if (action === "close-dialog") { closeDialogs(); return; }
    if (action === "cancel-output-settings") { cancelOutputSettings(); return; }
    if (action === "apply-output-settings") { applyOutputSettings(); return; }
    if (action === "apply-output-recommendation") {
      recordHistory();
      state.project.outputMode = MODEL_PROFILES[get("project.targetModel")]?.recommendedMode || "standard";
      renderOutputSettingsDialog();
      refresh({ full: true });
      toast("선택한 제작 모델의 권장 출력 형식을 적용했습니다.");
      return;
    }
    if (action === "generate") return generate();
    if (action === "copy") return copyPrompt();
    if (action === "send-generator") return sendToGenerator();
    if (action === "export") return exportJson();
    if (action === "import") return document.getElementById("commonPromptImportInput").click();
    if (action === "reset") return resetProject();
    if (action === "reset-design-axes") {
      recordHistory();
      ["visualDirection.authority", "visualDirection.energy", "visualDirection.expression", "visualDirection.rationality"].forEach((path) => set(path, 3));
      state.visualDirection.source = "custom";
      directionUi.source = "custom";
      refresh({ full: true });
      toast("네 가지 정체성 축을 균형값으로 맞췄습니다.");
      return;
    }
    if (action === "apply-identity-grammar") return applyIdentityGrammarRecommendation();
    if (action === "apply-design-preset") return applyDesignPreset();
    if (action === "cancel-direction-draft") { directionDraft = null; directionUi.applyRelated = false; refresh({ full: true }); return; }
    if (action === "apply-medium-draft" && directionDraft?.medium) return applyMedium(directionDraft.medium);
    if (action === "remove-medium") return removeMedium();
    if (action === "medium-search") { directionUi.query = root.querySelector("[data-medium-query]")?.value || ""; directionUi.visible = 12; refresh({ full: true }); return; }
    if (action === "medium-load-more") { directionUi.visible += 12; refresh({ full: true }); return; }
    if (action === "import-mixer-medium") {
      const medium = window.PromptDeckConceptMixer?.getSelectedMedium?.();
      directionDraft = MEDIUM_CATALOG?.normalize?.(medium, medium?.source || "visual-mixer") || null;
      if (directionDraft) directionDraft = { type: "medium", medium: directionDraft };
      if (!directionDraft) { toast("비주얼 믹서에서 먼저 화풍을 선택해주세요."); return; }
      refresh({ full: true });
      toast("현재 비주얼 믹서 화풍을 적용 후보로 불러왔습니다.");
      return;
    }
    if (action === "open-mixer-medium") {
      document.getElementById("tabBtnConceptMixer")?.click();
      window.setTimeout(() => {
        const step = [...document.querySelectorAll("#conceptMixerContainer button")].find((button) => button.textContent.includes("화풍/기법 선택"));
        step?.click();
      }, 0);
      toast("비주얼 믹서에서 화풍을 고른 뒤 공통 프롬프트로 돌아와 가져오기를 눌러주세요.");
      return;
    }
    if (action === "apply-color-preset") return applyColorPreset();
    if (action === "color-search") {
      colorUi.query = root.querySelector("[data-color-query]")?.value || "";
      if (colorUi.query.trim()) colorUi.intent = "all";
      colorUi.visible = 12;
      colorDraft = null;
      colorHoverDraft = null;
      refresh({ full: true });
      return;
    }
    if (action === "color-load-more") { colorUi.visible += 12; refresh({ full: true }); return; }
    if (action === "reset-palette-filters") {
      Object.assign(colorUi, { query: "", intent: "all", temperature: "all", saturation: "all", contrast: "all", category: "all", mode: "all", usage: "all", visible: 12 });
      colorDraft = null;
      colorHoverDraft = null;
      refresh({ full: true });
      return;
    }
    if (action === "cancel-color-draft") { colorDraft = null; colorHoverDraft = null; refresh({ full: true }); return; }
    if (action === "apply-color-draft" && colorDraft) {
      recordHistory();
      applySlidePalette(colorDraft);
      colorDraft = null;
      colorHoverDraft = null;
      refresh({ full: true });
      toast("선택한 팔레트를 슬라이드 역할 색상으로 적용했습니다.");
      return;
    }
    if (action === "import-mixer-palette") {
      const palette = window.PromptDeckConceptMixer?.getSelectedPalette?.();
      colorDraft = PALETTE_CATALOG?.toSlidePalette?.(palette) || null;
      if (!colorDraft) { toast("비주얼 믹서에서 먼저 색상 팔레트를 선택해주세요."); return; }
      refresh({ full: true });
      toast("현재 비주얼 믹서 팔레트를 미리보기에 불러왔습니다.");
      return;
    }
    if (action === "open-mixer-palette") { document.getElementById("tabBtnConceptMixer")?.click(); toast("비주얼 믹서에서 팔레트를 고른 뒤 돌아와 가져오기를 눌러주세요."); return; }
    if (action === "apply-typography-draft" && typographyDraft) return applyTypographyStyle(typographyDraft);
    if (action === "cancel-typography-draft") { typographyDraft = null; typographyUi.scope = get("typography.visualTypographyScope") || "headline"; refresh({ full: true }); return; }
    if (action === "remove-typography") return removeTypographyStyle();
    if (action === "typography-load-more") { typographyUi.visible += 12; refresh({ full: true }); return; }
    if (action === "import-mixer-typography") {
      const selected = window.PromptDeckConceptMixer?.getSelectedTypography?.();
      typographyDraft = TYPOGRAPHY_CATALOG?.normalize?.(selected) || null;
      if (!typographyDraft) { toast("비주얼 믹서에서 먼저 타이포그래피를 선택해주세요."); return; }
      typographyUi.scope = typographyDraft.highRisk ? "headline" : (get("typography.visualTypographyScope") || "headline");
      refresh({ full: true });
      toast("현재 비주얼 믹서 타이포그래피를 적용 후보로 불러왔습니다.");
      return;
    }
    if (action === "open-mixer-typography") {
      document.getElementById("tabBtnConceptMixer")?.click();
      window.setTimeout(() => {
        const step = [...document.querySelectorAll("#conceptMixerContainer button")].find((button) => button.textContent.includes("타이포그래피"));
        step?.click();
      }, 0);
      toast("비주얼 믹서에서 타이포그래피를 고른 뒤 공통 프롬프트로 돌아와 가져오기를 눌러주세요.");
      return;
    }
    if (action === "recommend-purpose") return recommendPurpose();
    if (action === "auto-fix") return applyFixes();
    if (action === "fix-canvas-ratio") {
      recordHistory();
      syncCanvasResolution("width");
      refresh({ full: true });
      toast("선택한 화면비에 맞춰 높이를 자동 보정했습니다.");
    }
  }

  function previewPaletteCard(card) {
    if (!card) return;
    const palette = PALETTE_CATALOG?.get?.(card.dataset.mixerPaletteId);
    const candidate = PALETTE_CATALOG?.toSlidePalette?.(palette) || null;
    if (!candidate || colorHoverDraft?.presetId === candidate.presetId) return;
    colorHoverDraft = candidate;
    renderResults(validateStateV2());
  }

  function clearPaletteCardPreview() {
    if (!colorHoverDraft) return;
    colorHoverDraft = null;
    renderResults(validateStateV2());
  }

  root.addEventListener("mouseover", (event) => {
    const card = event.target.closest?.("[data-mixer-palette-id]");
    if (!card || card.contains(event.relatedTarget)) return;
    previewPaletteCard(card);
  });

  root.addEventListener("mouseout", (event) => {
    const card = event.target.closest?.("[data-mixer-palette-id]");
    if (!card || card.contains(event.relatedTarget)) return;
    clearPaletteCardPreview();
  });

  root.addEventListener("focusin", (event) => {
    if (event.target.matches("[data-path], [data-multi-path], [data-color-path], [data-choice-path]")) event.target.dataset.startState = JSON.stringify(state);
    previewPaletteCard(event.target.closest?.("[data-mixer-palette-id]"));
  });

  root.addEventListener("focusout", (event) => {
    const card = event.target.closest?.("[data-mixer-palette-id]");
    if (!card || card.contains(event.relatedTarget)) return;
    clearPaletteCardPreview();
  });
  root.addEventListener("toggle", (event) => {
    if (event.target.matches?.(".cpd-photo-advanced")) photoCompositeAdvancedOpen = event.target.open;
    if (event.target.matches?.(".cpd-inspiration-starter")) inspirationStarterOpen = event.target.open;
    if (event.target.matches?.(".cpd-design-advanced")) {
      const key = event.target.dataset.designAdvanced;
      if (key) {
        if (event.target.open) designAdvancedOpen.add(key);
        else designAdvancedOpen.delete(key);
      }
    }
  }, true);
  root.addEventListener("click", (event) => {
    const quickSetupMode = event.target.closest("[data-quick-setup-mode]");
    if (quickSetupMode) {
      quickSetupUi.mode = quickSetupMode.dataset.quickSetupMode;
      quickSetupUi.open = true;
      refresh({ full: true });
      window.setTimeout(() => document.querySelector(`[data-quick-setup-mode="${quickSetupUi.mode}"]`)?.focus({ preventScroll: true }), 0);
      return;
    }
    const quickRandom = event.target.closest("[data-quick-random]");
    if (quickRandom) { applyQuickRandom(quickRandom.dataset.quickRandom); return; }
    const resourcePreset = event.target.closest("[data-resource-preset]");
    if (resourcePreset) { applyResourcePreset(resourcePreset.dataset.resourcePreset); return; }
    const userPresetApply = event.target.closest("[data-user-preset-apply]");
    if (userPresetApply) { applyUserPreset(userPresetApply.dataset.userPresetApply); return; }
    const userPresetOverwrite = event.target.closest("[data-user-preset-overwrite]");
    if (userPresetOverwrite) { overwriteUserPreset(userPresetOverwrite.dataset.userPresetOverwrite); return; }
    const userPresetDelete = event.target.closest("[data-user-preset-delete]");
    if (userPresetDelete) { deleteUserPreset(userPresetDelete.dataset.userPresetDelete); return; }
    const slideStylePromptPaletteMode = event.target.closest("[data-slide-style-prompt-palette-mode]");
    if (slideStylePromptPaletteMode) {
      const style = SLIDE_STYLE_CATALOG?.get?.(slideStyleUi.draftId);
      const nextMode = slideStylePromptPaletteMode.dataset.slideStylePromptPaletteMode;
      if (!style || !["preset", "custom"].includes(nextMode)) return;
      ensureSlideStylePromptPalette(style);
      if (nextMode === "custom" && slideStyleUi.promptPaletteMode !== "custom") {
        slideStyleUi.promptColors = slideStylePromptColors(style, slideStyleUi.promptPaletteMode);
      }
      slideStyleUi.promptPaletteMode = nextMode;
      syncSlideStylePromptTool();
      return;
    }
    const slideStyleCategory = event.target.closest("[data-slide-style-category]");
    if (slideStyleCategory) {
      slideStyleUi.category = slideStyleCategory.dataset.slideStyleCategory || "recommended";
      slideStyleUi.draftId = "";
      slideStyleUi.visible = initialSlideStyleVisible(slideStyleUi.category);
      resetSlideStyleGalleryScroll();
      refresh({ full: true });
      return;
    }
    const slideStyleCard = event.target.closest("[data-slide-style-id]");
    if (slideStyleCard) {
      const styleId = slideStyleCard.dataset.slideStyleId;
      const shouldSelect = slideStyleUi.draftId !== styleId;
      slideStyleUi.draftId = shouldSelect ? styleId : "";
      if (shouldSelect) resetSlideStylePromptPalette(SLIDE_STYLE_CATALOG?.get?.(styleId));
      syncSlideStyleSelectionUi();
      return;
    }
    const journeyProfile = event.target.closest("[data-journey-profile]");
    if (journeyProfile) { applyJourneyProfile(journeyProfile.dataset.journeyProfile); return; }
    const frameToken = event.target.closest("[data-frame-token]");
    if (frameToken) {
      const path = frameToken.dataset.frameTokenPath;
      const token = frameToken.dataset.frameToken;
      if (!path || !token) return;
      recordHistory();
      const items = commaItems(get(path));
      const nextItems = items.includes(token) ? items.filter((item) => item !== token) : [...items, token];
      set(path, nextItems.join(", "));
      frameToken.classList.toggle("selected", nextItems.includes(token));
      frameToken.setAttribute("aria-pressed", String(nextItems.includes(token)));
      const input = root.querySelector(`[data-comma-input="${path}"]`);
      if (input) input.value = get(path);
      updateCommaChips(path, get(path));
      refresh();
      return;
    }
    const journeyStage = event.target.closest("[data-journey-stage]");
    if (journeyStage) { moveJourneyStage(Number(journeyStage.dataset.journeyStage)); return; }
    const pageNumberChoice = event.target.closest("[data-page-number-location]");
    if (pageNumberChoice) {
      const location = pageNumberChoice.dataset.pageNumberLocation;
      recordHistory();
      state.header.showPageNumber = location === "header";
      state.footer.showPageNumber = location === "footer";
      if (location === "header" && state.header.type === "none") state.header.type = "plain";
      if (location === "footer" && state.footer.type === "none") state.footer.type = "minimal";
      state.header.source = "custom";
      state.header.profile = "custom";
      state.footer.source = "custom";
      state.footer.profile = "custom";
      state.journey.reviewedStages = [...new Set([...(get("journey.reviewedStages") || []), "frame"])];
      refresh({ full: true });
      toast(location === "none" ? "페이지 번호를 표시하지 않습니다." : `페이지 번호 위치를 ${location === "header" ? "헤더" : "푸터"}로 정했습니다.`);
      return;
    }
    const photoPolicyLevelChoice = event.target.closest("[data-photo-policy-level]");
    if (photoPolicyLevelChoice) {
      const level = photoPolicyLevelChoice.dataset.photoPolicyLevel;
      const currentScope = photoPolicyScope() === "none" ? "content" : photoPolicyScope();
      recordHistory();
      setPhotoPolicyState(level, currentScope);
      state.background.source = "custom";
      state.background.profile = "custom";
      state.journey.reviewedStages = [...new Set([...(get("journey.reviewedStages") || []), "imagery"])];
      refresh({ full: true });
      toast(level === "off" ? "사진 관련 공통 안내를 생략합니다." : `사진을 ‘${level === "preferred" ? "적극 검토" : "근거가 있을 때"}’로 설정했습니다.`);
      return;
    }
    const photoPolicyScopeChoice = event.target.closest("[data-photo-policy-scope]");
    if (photoPolicyScopeChoice) {
      const scope = photoPolicyScopeChoice.dataset.photoPolicyScope;
      const level = photoPolicyLevel() === "off" ? "conditional" : photoPolicyLevel();
      recordHistory();
      setPhotoPolicyState(level, scope);
      state.background.source = "custom";
      state.background.profile = "custom";
      state.journey.reviewedStages = [...new Set([...(get("journey.reviewedStages") || []), "imagery"])];
      refresh({ full: true });
      toast(`사진 적용 범위를 ${scope === "content" ? "콘텐츠 영역" : scope === "background" ? "캔버스 배경" : "콘텐츠와 배경"}으로 정했습니다.`);
      return;
    }
    const briefChoice = event.target.closest("[data-brief-path]");
    if (briefChoice) {
      recordHistory();
      const path = briefChoice.dataset.briefPath;
      const rawValue = briefChoice.dataset.briefValue;
      set(path, rawValue);
      refresh({ full: true });
      return;
    }
    const choiceAxisSet = event.target.closest("[data-choice-axis-set]");
    if (choiceAxisSet && CHOICE_AXIS_META[choiceAxisSet.dataset.choiceAxisSet]) {
      const path = choiceAxisSet.dataset.choiceAxisSet;
      recordHistory();
      const result = setChoiceAxisIndex(path, choiceAxisSet.dataset.choiceAxisIndex);
      refresh({ full: true });
      if (result) toast(`${result.meta.group}을 ‘${result.labelText}’으로 조정했습니다.`);
      return;
    }
    const zoneSet = event.target.closest("[data-zone-set]");
    if (zoneSet) {
      const value = Math.max(1, Math.min(5, Number(zoneSet.dataset.zoneSet) || 4));
      recordHistory();
      state.background.zoneSeparation = value;
      state.background.source = "custom";
      state.background.profile = "custom";
      refresh({ full: true });
      toast(`배경 영역을 ‘${zoneSeparationLabel(value)}’으로 조정했습니다.`);
      return;
    }
    const axisSet = event.target.closest("[data-axis-set]");
    if (axisSet && DESIGN_AXIS_META[axisSet.dataset.axisSet]) {
      const path = axisSet.dataset.axisSet;
      const value = Math.max(1, Math.min(5, Number(axisSet.dataset.axisValue) || 3));
      recordHistory();
      set(path, value);
      state.visualDirection.source = "custom";
      directionUi.source = "custom";
      refresh({ full: true });
      toast(`${DESIGN_AXIS_META[path].group} 축을 ‘${designAxisValue(path, value)}’으로 조정했습니다.`);
      return;
    }
    const quickSelect = event.target.closest("[data-quick-select]");
    if (quickSelect) { selectQuickRecommendations(quickSelect.dataset.quickSelect); return; }
    const quickTemplate = event.target.closest("[data-quick-template]");
    if (quickTemplate) {
      analyzeQuickStartSource("", quickTemplate.dataset.quickTemplate);
      renderQuickStartDialog();
      window.setTimeout(() => document.querySelector("#cpdQuickStartDialog [data-quick-recommendation]:not(:disabled)")?.focus(), 0);
      return;
    }
    const headerProfile = event.target.closest("[data-header-profile]");
    if (headerProfile) { applyHeaderProfile(headerProfile.dataset.headerProfile); return; }
    const footerProfile = event.target.closest("[data-footer-profile]");
    if (footerProfile) { applyFooterProfile(footerProfile.dataset.footerProfile); return; }
    const backgroundProfile = event.target.closest("[data-background-profile]");
    if (backgroundProfile) { applyBackgroundProfile(backgroundProfile.dataset.backgroundProfile); return; }
    const imageryProfile = event.target.closest("[data-imagery-profile]");
    if (imageryProfile) { applyImageryProfile(imageryProfile.dataset.imageryProfile); return; }
    const typographySource = event.target.closest("[data-typography-source]");
    if (typographySource) { typographyUi.source = typographySource.dataset.typographySource; typographyDraft = null; refresh({ full: true }); return; }
    const typographyPreset = event.target.closest("[data-typography-preset]");
    if (typographyPreset) { applyTypographyPreset(typographyPreset.dataset.typographyPreset); return; }
    const typographyCard = event.target.closest("[data-typography-id]");
    if (typographyCard) {
      typographyDraft = TYPOGRAPHY_CATALOG?.get?.(typographyCard.dataset.typographyId) || null;
      typographyUi.scope = typographyDraft?.highRisk ? "headline" : (get("typography.visualTypographyScope") || "headline");
      refresh({ full: true });
      return;
    }
    const directionSource = event.target.closest("[data-direction-source]");
    if (directionSource) { directionUi.source = directionSource.dataset.directionSource; directionDraft = null; refresh({ full: true }); return; }
    const directionPreset = event.target.closest("[data-direction-preset]");
    if (directionPreset) { directionDraft = { type: "preset", presetId: directionPreset.dataset.directionPreset }; directionUi.applyRelated = false; refresh({ full: true }); return; }
    const compositionProfile = event.target.closest("[data-composition-profile]");
    if (compositionProfile) { applyCompositionProfile(compositionProfile.dataset.compositionProfile); return; }
    const mediumCard = event.target.closest("[data-medium-id]");
    if (mediumCard) {
      const medium = MEDIUM_CATALOG?.get?.(mediumCard.dataset.mediumId);
      directionDraft = medium ? { type: "medium", medium } : null;
      refresh({ full: true });
      return;
    }
    const colorSource = event.target.closest("[data-color-source]");
    if (colorSource) { colorUi.source = colorSource.dataset.colorSource; colorDraft = null; refresh({ full: true }); return; }
    const paletteFilterClear = event.target.closest("[data-palette-filter-clear]");
    if (paletteFilterClear) {
      colorUi[paletteFilterClear.dataset.paletteFilterClear] = "all";
      colorUi.visible = 12;
      colorDraft = null;
      colorHoverDraft = null;
      refresh({ full: true });
      return;
    }
    const paletteIntent = event.target.closest("[data-palette-intent]");
    if (paletteIntent) {
      colorUi.intent = paletteIntent.dataset.paletteIntent || "all";
      colorUi.query = "";
      colorUi.visible = 12;
      colorDraft = null;
      colorHoverDraft = null;
      refresh({ full: true });
      return;
    }
    const paletteEasyFilter = event.target.closest("[data-palette-easy-filter]");
    if (paletteEasyFilter) {
      colorUi[paletteEasyFilter.dataset.paletteEasyFilter] = paletteEasyFilter.dataset.paletteEasyValue || "all";
      colorUi.visible = 12;
      colorDraft = null;
      colorHoverDraft = null;
      refresh({ full: true });
      return;
    }
    const mixerPalette = event.target.closest("[data-mixer-palette-id]");
    if (mixerPalette) {
      colorDraft = PALETTE_CATALOG?.toSlidePalette?.(PALETTE_CATALOG.get(mixerPalette.dataset.mixerPaletteId)) || null;
      colorHoverDraft = null;
      refresh({ full: true });
      return;
    }
    const componentProfile = event.target.closest("[data-component-profile]");
    if (componentProfile) { applyComponentProfile(componentProfile.dataset.componentProfile); return; }
    const sectionToggle = event.target.closest("[data-section-toggle]");
    if (sectionToggle) {
      const id = sectionToggle.dataset.sectionToggle;
      if (!Object.prototype.hasOwnProperty.call(state.sectionEnabled, id)) return;
      recordHistory();
      state.sectionEnabled[id] = !isSectionEnabled(id);
      refresh({ full: true });
      toast(state.sectionEnabled[id] ? `${STEP_META.find(([key]) => key === id)?.[1] || "항목"}을 사용 중으로 바꿨습니다.` : `${STEP_META.find(([key]) => key === id)?.[1] || "항목"}을 사용 안 함으로 바꿨습니다.`);
      return;
    }
    const canvasPreset = event.target.closest("[data-canvas-preset]");
    if (canvasPreset) { applyCanvasPreset(canvasPreset.dataset.canvasPreset); return; }
    const safePreset = event.target.closest("[data-safe-preset]");
    if (safePreset) { applySafeAreaPreset(safePreset.dataset.safePreset); return; }
    const step = event.target.closest("[data-step]");
    if (step) {
      const index = Number(step.dataset.step);
      state.activeStep = index;
      state.journey.activeStage = journeyStageForSection(STEP_META[index]?.[0]);
      refresh({ full: true });
      return;
    }
    if (event.target.classList.contains("cpd-dialog-backdrop")) {
      if (event.target.id === "cpdOutputSettingsDialog") cancelOutputSettings(false);
      else if (event.target.id === "cpdQuickSetupDialog") closeQuickSetupModal();
      else if (event.target.id === "cpdSlideStyleDialog") closeSlideStyleGallery();
      else if (event.target.id === "cpdQuickStartDialog") cancelQuickStart();
      else closeDialogs();
      return;
    }
    const outputMax = event.target.closest("[data-output-max]");
    if (outputMax) {
      recordHistory();
      state.project.maxChars = Number(outputMax.dataset.outputMax);
      renderOutputSettingsDialog();
      refresh({ full: true });
      return;
    }
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action) handleAction(action);
  });

  root.addEventListener("keydown", (event) => {
    const quickDialog = document.getElementById("cpdQuickStartDialog");
    const quickSetupDialog = document.getElementById("cpdQuickSetupDialog");
    const slideStyleDialog = document.getElementById("cpdSlideStyleDialog");
    const activeModal = slideStyleDialog && !slideStyleDialog.hidden ? slideStyleDialog : quickSetupDialog && !quickSetupDialog.hidden ? quickSetupDialog : quickDialog && !quickDialog.hidden ? quickDialog : null;
    if (event.key === "Tab" && activeModal) {
      const focusable = [...activeModal.querySelectorAll('button:not(:disabled), textarea:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])')].filter((element) => element.offsetParent !== null);
      if (focusable.length) {
        const first = focusable[0]; const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    if (event.key === "Escape") {
      if (colorHoverDraft) { colorHoverDraft = null; refresh(); return; }
      const outputDialog = document.getElementById("cpdOutputSettingsDialog");
      if (outputDialog && !outputDialog.hidden) cancelOutputSettings(false);
      else if (slideStyleDialog && !slideStyleDialog.hidden) closeSlideStyleGallery();
      else if (quickSetupDialog && !quickSetupDialog.hidden) closeQuickSetupModal();
      else if (quickDialog && !quickDialog.hidden) cancelQuickStart();
      else closeDialogs();
    }
    if (event.key === "Enter" && event.target.matches("[data-color-query]")) { event.preventDefault(); handleAction("color-search"); }
    if (event.key === "Enter" && event.target.matches("[data-medium-query]")) { event.preventDefault(); handleAction("medium-search"); }
    if (event.key === "Enter" && event.target.matches("[data-slide-style-query]")) { event.preventDefault(); handleAction("slide-style-search"); }
    if (event.key === "Enter" && event.target.matches("#cpdUserPresetName")) { event.preventDefault(); saveCurrentUserPreset(); }
  });
  root.addEventListener("input", (event) => {
    const target = event.target;
    if (target.id === "cpdQuickSource") {
      quickStartDraft.source = target.value;
      quickStartDraft.sourceLength = target.value.length;
      const count = document.getElementById("cpdQuickSourceCount");
      if (count) count.textContent = `${target.value.length.toLocaleString("ko-KR")} / 30,000자`;
      return;
    }
    if (target.dataset.slideStylePromptColor) {
      const style = SLIDE_STYLE_CATALOG?.get?.(slideStyleUi.draftId);
      const role = target.dataset.slideStylePromptColor;
      if (!style || !SLIDE_STYLE_PROMPT_COLOR_ROLES.some(([key]) => key === role)) return;
      slideStyleUi.promptPaletteMode = "custom";
      slideStyleUi.promptColors = {
        ...slideStylePromptColors(style, "custom"),
        [role]: normalizeSlideStylePromptColor(target.value, style.settings?.colors?.[role]),
      };
      syncSlideStylePromptOutput();
      return;
    }
    if (target.matches("[data-slide-style-query]")) { slideStyleUi.query = target.value; return; }
    if (target.matches("[data-color-query]")) { colorUi.query = target.value; return; }
    if (target.matches("[data-medium-query]")) { directionUi.query = target.value; return; }
    if (target.matches("[data-palette-filter-range]")) {
      const key = target.dataset.paletteFilterRange;
      const meta = PALETTE_FILTER_META[key];
      const index = Math.max(0, Math.min(meta.values.length - 1, Number(target.value) || 0));
      colorUi[key] = meta.values[index][0];
      const filter = target.closest("[data-palette-filter]");
      filter?.classList.add("active");
      const allButton = filter?.querySelector("[data-palette-filter-clear]");
      allButton?.classList.remove("active");
      allButton?.setAttribute("aria-pressed", "false");
      filter?.style.setProperty("--cpd-axis-position", `${(index / Math.max(1, meta.values.length - 1)) * 100}%`);
      filter?.querySelectorAll(".cpd-axis-ticks i").forEach((tick, tickIndex) => tick.classList.toggle("active", tickIndex === index));
      const output = filter?.querySelector(`[data-palette-filter-output="${key}"]`);
      if (output) output.textContent = meta.values[index][1];
      target.setAttribute("aria-valuetext", meta.values[index][1]);
      return;
    }
    if (target.matches("[data-choice-axis-range]")) {
      updateChoiceAxisInline(target.dataset.choicePath, target.value);
      refresh();
      return;
    }
    if (target.dataset.colorPath) {
      set(target.dataset.colorPath, target.value.toUpperCase());
      if (target.dataset.colorRole) markCustomColor(target.dataset.colorRole);
      const textInput = target.parentElement.querySelector('[data-path]');
      if (textInput) textInput.value = target.value.toUpperCase();
      refresh();
      return;
    }
    if (!target.dataset.path || target.type === "radio" || target.type === "checkbox") return;
    let value = target.type === "number" || target.type === "range" ? Number(target.value) : target.value;
    if (/^colors\./.test(target.dataset.path) && /^#[0-9a-f]{6}$/i.test(value)) value = value.toUpperCase();
    set(target.dataset.path, value);
    if (target.dataset.commaInput) updateCommaChips(target.dataset.commaInput, value);
    if (target.dataset.path === "frame.bodySafeMarginPercent") {
      ["top", "right", "bottom", "left"].forEach((key) => { state.canvas.safeArea[key] = value; });
    }
    if (JOURNEY_PROFILE_META[state.journey?.profileId]) state.journey.profileDirty = true;
    if (target.type === "range") {
      const output = target.closest(".cpd-range")?.querySelector("[data-range-value]");
      if (output) output.textContent = `${value}${target.dataset.rangeSuffix || ""}`;
    }
    if (target.dataset.path.startsWith("project.")) updateBriefChoiceInline(target.dataset.path, value);
    if (target.matches("[data-zone-range]")) updateZoneSeparationInline(value);
    if (target.dataset.path.startsWith("visualDirection.")) {
      if (target.matches("[data-axis-range]")) updateDesignAxisInline(target.dataset.path, value);
      const statement = root.querySelector(".cpd-design-statement > strong");
      if (statement) statement.textContent = effectiveDesignStatement();
      state.visualDirection.source = "custom";
      directionUi.source = "custom";
    }
    if (target.dataset.path.startsWith("composition.")) {
      state.composition.profile = "custom";
      if (target.dataset.path === "composition.primaryVisualLanguage" && value === state.composition.secondaryVisualLanguage) {
        state.composition.secondaryVisualLanguage = "none";
        toast("보조 시각 언어의 중복 선택을 자동으로 해제했습니다.");
      }
      if (target.dataset.path === "composition.secondaryVisualLanguage" && value !== "none" && value === state.composition.primaryVisualLanguage) {
        state.composition.secondaryVisualLanguage = "none";
        toast("주 시각 언어와 다른 보조 언어를 선택해주세요.");
      }
    }
    if (target.dataset.path.startsWith("background.")) { state.background.source = "custom"; state.background.profile = "custom"; }
    if (target.dataset.path.startsWith("header.")) { state.header.source = "custom"; state.header.profile = "custom"; }
    if (target.dataset.path.startsWith("footer.")) { state.footer.source = "custom"; state.footer.profile = "custom"; }
    if (target.dataset.path.startsWith("typography.")) { state.typography.source = "custom"; state.typography.presetId = "custom"; }
    if (target.dataset.colorRole && /^#[0-9a-f]{6}$/i.test(value)) markCustomColor(target.dataset.colorRole);
    if (get("canvas.lockAspectRatio") && target.dataset.path === "canvas.width") syncCanvasResolution("width");
    if (get("canvas.lockAspectRatio") && target.dataset.path === "canvas.height") syncCanvasResolution("height");
    if (get("canvas.lockAspectRatio") && ["canvas.customWidth", "canvas.customHeight"].includes(target.dataset.path)) syncCanvasResolution("width");
    if (get("canvas.safeAreaLinked") && target.dataset.path === "canvas.safeArea.top") {
      ["right", "bottom", "left"].forEach((key) => { state.canvas.safeArea[key] = value; });
    }
    ["canvas.width", "canvas.height"].forEach((path) => {
      const input = root.querySelector(`[data-path="${path}"]`);
      if (input && document.activeElement !== input) input.value = get(path);
    });
    if (target.dataset.path.startsWith("canvas.")) updateCanvasInlineFeedback();
    if (target.dataset.path.startsWith("frame.")) updateFramePreviewInline();
    refresh();
  });
  root.addEventListener("change", (event) => {
    const target = event.target;
    if (target.dataset.slideStyleFilter) {
      slideStyleUi[target.dataset.slideStyleFilter] = target.value;
      if (target.value !== "all" && slideStyleUi.category === "recommended") slideStyleUi.category = "all";
      slideStyleUi.visible = initialSlideStyleVisible(slideStyleUi.category);
      slideStyleUi.draftId = "";
      resetSlideStyleGalleryScroll();
      refresh({ full: true });
      return;
    }
    if (target.matches("[data-quick-preserve-disabled]")) {
      quickStartDraft.preserveDisabled = target.checked;
      syncQuickSelectionControls();
      return;
    }
    if (target.dataset.quickRecommendation) {
      const id = target.dataset.quickRecommendation;
      quickStartDraft.selected = target.checked
        ? [...new Set([...quickStartDraft.selected, id])]
        : quickStartDraft.selected.filter((item) => item !== id);
      syncQuickSelectionControls();
      return;
    }
    if (target.matches("[data-typography-scope-draft]")) { typographyUi.scope = target.value; refresh({ full: true }); return; }
    if (target.dataset.typographyFilter) {
      typographyUi[target.dataset.typographyFilter] = target.value;
      typographyUi.visible = 12;
      typographyDraft = null;
      refresh({ full: true });
      return;
    }
    if (target.matches("[data-direction-related]")) { directionUi.applyRelated = target.checked; refresh({ full: true }); return; }
    if (target.matches("[data-choice-axis-range]")) {
      recordHistory(target.dataset.startState);
      setChoiceAxisIndex(target.dataset.choicePath, target.value);
      refresh({ full: true });
      return;
    }
    if (target.matches("[data-palette-filter-range]")) {
      colorUi.visible = 12;
      colorDraft = null;
      colorHoverDraft = null;
      refresh({ full: true });
      return;
    }
    if (target.dataset.mediumFilter) {
      directionUi[target.dataset.mediumFilter] = target.value;
      directionUi.visible = 12;
      directionDraft = null;
      refresh({ full: true });
      return;
    }
    if (target.dataset.colorFilter) {
      colorUi[target.dataset.colorFilter] = target.value;
      colorUi.visible = 12;
      colorDraft = null;
      colorHoverDraft = null;
      refresh({ full: true });
      return;
    }
    if (target.dataset.multiPath) {
      const values = clone(get(target.dataset.multiPath) || []);
      if (target.checked && values.length >= Number(target.dataset.max || 99)) { target.checked = false; toast(`최대 ${target.dataset.max}개까지 선택할 수 있습니다.`); return; }
      recordHistory(target.dataset.startState);
      if (target.checked) values.push(target.value); else values.splice(values.indexOf(target.value), 1);
      set(target.dataset.multiPath, values);
      if (target.dataset.multiPath === "visualDirection.keywords") state.visualDirection.source = "custom";
      refresh({ full: true });
      return;
    }
    if (!target.dataset.path) return;
    if (["text", "number", "range"].includes(target.type) || target.tagName === "TEXTAREA") {
      if (target.dataset.commaInput) {
        const normalized = commaItems(target.value).join(", ");
        set(target.dataset.path, normalized);
        target.value = normalized;
        updateCommaChips(target.dataset.commaInput, normalized);
      }
      recordHistory(target.dataset.startState);
      saveDraft();
      if (target.matches("[data-zone-range]")) refresh({ full: true });
      return;
    }
    recordHistory(target.dataset.startState);
    const value = target.type === "checkbox" ? target.checked : target.type === "number" || target.type === "range" || target.dataset.numberRadio === "true" ? Number(target.value) : target.value;
    set(target.dataset.path, value);
    const activeStageId = JOURNEY_STAGES[currentJourneyStage()]?.id;
    if (activeStageId) state.journey.reviewedStages = [...new Set([...(get("journey.reviewedStages") || []), activeStageId])];
    if (target.dataset.path.startsWith("visualDirection.")) { state.visualDirection.source = "custom"; directionUi.source = "custom"; }
    if (target.dataset.path.startsWith("composition.")) {
      state.composition.profile = "custom";
      if (target.dataset.path === "composition.primaryVisualLanguage" && value === state.composition.secondaryVisualLanguage) {
        state.composition.secondaryVisualLanguage = "none";
        toast("보조 시각 언어의 중복 선택을 자동으로 해제했습니다.");
      }
      if (target.dataset.path === "composition.secondaryVisualLanguage" && value !== "none" && value === state.composition.primaryVisualLanguage) {
        state.composition.secondaryVisualLanguage = "none";
        toast("주 시각 언어와 다른 보조 언어를 선택해주세요.");
      }
    }
    if (target.dataset.path.startsWith("background.")) { state.background.source = "custom"; state.background.profile = "custom"; }
    if (target.dataset.path.startsWith("header.")) { state.header.source = "custom"; state.header.profile = "custom"; }
    if (target.dataset.path.startsWith("footer.")) { state.footer.source = "custom"; state.footer.profile = "custom"; }
    if (target.dataset.path.startsWith("typography.")) { state.typography.source = "custom"; state.typography.presetId = "custom"; typographyUi.source = "custom"; }
    if (target.dataset.path.startsWith("photoComposite.")) {
      if (target.dataset.path === "photoComposite.secondary") {
        if (value === state.photoComposite.primary) {
          state.photoComposite.secondary = "none";
          toast("주 적용 위치와 보조 위치는 다르게 선택해주세요.");
        }
      }
      if (target.dataset.path === "photoComposite.primary" && value === state.photoComposite.secondary) {
        state.photoComposite.secondary = "none";
        toast("중복된 보조 위치를 자동으로 해제했습니다.");
      }
    }
    if (target.dataset.path.startsWith("imagery.")) {
      state.imagery.source = "custom";
      state.imagery.profile = "custom";
      if (target.dataset.path === "imagery.iconEnabled") {
        if (value) { if (state.imagery.iconStyle === "none") state.imagery.iconStyle = "line"; if (state.imagery.iconPurpose === "none") state.imagery.iconPurpose = "structure"; }
        else { state.imagery.iconStyle = "none"; state.imagery.iconPurpose = "none"; }
      }
      if (target.dataset.path === "imagery.imageEnabled") {
        if (value) { if (state.imagery.imageStyle === "none") state.imagery.imageStyle = "conditional"; if (state.imagery.imagePurpose === "none") state.imagery.imagePurpose = "whenNeeded"; }
        else { state.imagery.imageStyle = "none"; state.imagery.imagePurpose = "none"; state.imagery.photoCompositeMode = "off"; }
      }
      if (["imagery.iconStyle", "imagery.iconPurpose"].includes(target.dataset.path)) state.imagery.iconEnabled = value !== "none";
      if (["imagery.imageStyle", "imagery.imagePurpose"].includes(target.dataset.path)) state.imagery.imageEnabled = value !== "none";
      if (target.dataset.path === "imagery.photoCompositeMode" && value !== "off") {
        state.imagery.imageEnabled = true;
        if (value === "preferred" || value === "enabled") {
          state.imagery.imageStyle = "photo";
          state.imagery.imagePurpose = "explain";
        } else {
          if (state.imagery.imageStyle === "none") state.imagery.imageStyle = "conditional";
          if (state.imagery.imagePurpose === "none") state.imagery.imagePurpose = "whenNeeded";
        }
      }
      if (target.dataset.path === "imagery.photoCompositeSecondary") {
        if (value === state.imagery.photoCompositePrimary) {
          state.imagery.photoCompositeSecondary = "none";
          state.imagery.photoCompositeMaxZones = "1";
          toast("주 적용 위치와 보조 위치는 다르게 선택해주세요.");
        } else if (value !== "none") {
          state.imagery.photoCompositeMaxZones = "2";
        } else {
          state.imagery.photoCompositeMaxZones = "1";
        }
      }
      if (target.dataset.path === "imagery.photoCompositePrimary" && value === state.imagery.photoCompositeSecondary) {
        state.imagery.photoCompositeSecondary = "none";
        state.imagery.photoCompositeMaxZones = "1";
        toast("중복된 보조 위치를 자동으로 해제했습니다.");
      }
      if (target.dataset.path === "imagery.photoCompositeMaxZones" && Number(value) === 1) state.imagery.photoCompositeSecondary = "none";
    }
    if (target.dataset.path === "visualDirection.intensity") state.visualDirection.source = "custom";
    const componentPresetMatch = target.dataset.path.match(/^components\.(card|table|chart)Preset$/);
    if (componentPresetMatch) {
      if (value !== "custom") applyComponentPreset(componentPresetMatch[1], value);
      state.components.profile = "custom";
    }
    const componentDetailGroups = {
      cardBackground: "card", cardBorder: "card", cardCorner: "card", cardShadow: "card", cardPadding: "card",
      tableHeader: "table", tableDensity: "table", tableVerticalLines: "table", tableRowDividers: "table",
      chartAxes: "chart", chartGrid: "chart", chartLegend: "chart", chartLabels: "chart",
    };
    const componentKey = target.dataset.path.match(/^components\.([^.]+)$/)?.[1];
    if (componentDetailGroups[componentKey]) {
      state.components[`${componentDetailGroups[componentKey]}Preset`] = "custom";
      state.components.profile = "custom";
    }
    if (/^components\.(card|table|chart)Enabled$/.test(target.dataset.path)) state.components.profile = "custom";
    if (target.dataset.path === "canvas.aspectRatio") {
      const sizes = { "16:9": [1920, 1080, "landscape"], "4:3": [1600, 1200, "landscape"], "a4-landscape": [3508, 2480, "landscape"], "a4-portrait": [2480, 3508, "portrait"] };
      if (sizes[value]) [state.canvas.width, state.canvas.height, state.canvas.orientation] = sizes[value];
      if (value === "custom" && get("canvas.lockAspectRatio")) syncCanvasResolution("width");
    }
    if (target.dataset.path === "canvas.orientation") {
      if (get("canvas.aspectRatio") === "a4-landscape" && value === "portrait") state.canvas.aspectRatio = "a4-portrait";
      if (get("canvas.aspectRatio") === "a4-portrait" && value === "landscape") state.canvas.aspectRatio = "a4-landscape";
      const width = Number(state.canvas.width);
      const height = Number(state.canvas.height);
      if ((value === "portrait" && width > height) || (value === "landscape" && height > width)) [state.canvas.width, state.canvas.height] = [height, width];
      if (get("canvas.lockAspectRatio")) syncCanvasResolution("width");
    }
    if (target.dataset.path === "canvas.lockAspectRatio" && value) syncCanvasResolution("width");
    if (target.dataset.path === "canvas.safeAreaMode" && value === "auto") {
      ["top", "right", "bottom", "left"].forEach((key) => { state.canvas.safeArea[key] = 6; });
      state.canvas.safeAreaLinked = true;
    }
    if (target.dataset.path === "canvas.safeAreaLinked" && value) {
      ["right", "bottom", "left"].forEach((key) => { state.canvas.safeArea[key] = state.canvas.safeArea.top; });
    }
    if (target.dataset.path === "header.type" && value === "none") { state.header.showPageNumber = false; state.header.showSectionLabel = false; state.header.showSubtitle = false; state.header.divider = false; }
    if (target.dataset.path === "footer.type" && value === "none") { state.footer.showPageNumber = false; state.footer.divider = false; }
    if (target.dataset.path === "header.showPageNumber" && value) { state.footer.showPageNumber = false; state.footer.source = "custom"; state.footer.profile = "custom"; toast("페이지 번호를 헤더로 이동했습니다. 푸터의 페이지 번호는 자동으로 껐습니다."); }
    if (target.dataset.path === "footer.showPageNumber" && value) { state.header.showPageNumber = false; state.header.source = "custom"; state.header.profile = "custom"; toast("페이지 번호를 푸터로 이동했습니다. 헤더의 페이지 번호는 자동으로 껐습니다."); }
    refresh({ full: true });
    if (target.dataset.path.startsWith("project.") && document.getElementById("cpdOutputSettingsDialog")?.hidden === false) renderOutputSettingsDialog();
  });

  document.getElementById("commonPromptImportInput")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object") throw new Error("invalid");
      recordHistory();
      state = merge(DEFAULT_STATE, migrateLegacySettings(parsed));
      state.schemaVersion = SCHEMA_VERSION;
      expandedSteps = new Set();
      directionDraft = null;
      slideStyleUi = createSlideStyleUi();
      directionUi.source = state.visualDirection.source === "visual-mixer" ? "mixer" : state.visualDirection.source === "custom" ? "custom" : "common";
      typographyDraft = null;
      typographyUi = { source: state.typography.source === "visual-mixer" ? "mixer" : state.typography.source === "custom" ? "custom" : "common", category: "recommended", visible: 12, scope: state.typography.visualTypographyScope || "headline" };
      refresh({ full: true });
      toast("설정 JSON을 불러왔습니다.");
    } catch (_) { toast("올바른 공통 프롬프트 설정 JSON이 아닙니다."); }
    event.target.value = "";
  });

  renderShell();
  window.PromptDeckCommonPrompt = {
    getState: () => clone(state),
    validate: () => clone(validateFiveStageState()),
    buildPrompt,
    buildSlideStyleCopyPrompt: (styleId, palette) => {
      const style = SLIDE_STYLE_CATALOG?.get?.(styleId);
      return style ? buildSlideStyleCopyPrompt(style, palette || slideStylePromptColors(style, "preset"), style.settings?.colors?.paletteNameKo) : "";
    },
    sendToGenerator,
  };
  refresh({ full: true });
})();
