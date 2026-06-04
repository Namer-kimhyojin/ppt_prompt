(function () {
  const root = document.getElementById("panePromotion");
  if (!root) return;

  const $ = (id) => document.getElementById(id);

  const PROMOTION_SCHEMA_VERSION = 1;
  const PROMOTION_DRAFT_STORAGE_KEY = "promptdeck-promotion-draft-v1";
  const PROMOTION_COLOR_PRESETS_KEY = "promptdeck-promotion-color-presets-v1";
  const PROMOTION_SIZE_PRESETS_KEY = "promptdeck-promotion-size-presets-v1";
  const ASSET_TYPES = ["image"];
  const CONTENT_TYPE_VALUES = ["none", "campaign", "result-promo", "event-info", "survey-request", "training-info", "biz-promo"];
  const COLOR_STRATEGY_VALUES = ["manual", "ai"];

  const ASSET_DEFAULTS = {
    image: {
      contentType: "event-info",
      sizeMode: "ratio",
      ratio: "4:5",
      orientation: "vertical",
      directSizeUnit: "px",
      directSizeW: "",
      directSizeH: "",
      customRatioW: "",
      customRatioH: "",
    },
  };

  const DEFAULT_STATE = {
    assetType: "image",
    contentType: "none",
    outputLanguage: "ko",
    promptMode: "review",
    omitEmptyFields: "true",
    dedupePromptLines: "true",
    autoResolveConflicts: "true",
    commercialBaseline: "premium",
    creativityLevel: "balanced",
    sizeMode: "ratio",
    ratio: "4:5",
    orientation: "vertical",
    customRatioW: "",
    customRatioH: "",
    directSizeUnit: "px",
    directSizeW: "",
    directSizeH: "",
    goal: "",
    audience: "",
    headline: "",
    subheadline: "",
    bodyCopy: "",
    cta: "",
    tone: "",
    toneEnabled: "true",
    toneMode: "manual",
    visualStyle: "",
    visualStyleEnabled: "true",
    visualStyleMode: "manual",
    antiAiStyle: "general",
    qualityNotes: "",
    colorStrategy: "manual",
    primaryColor: "",
    secondaryColor: "",
    accentColor: "",
    backgroundMode: "solid",
    backgroundColor: "",
    backgroundDetails: "",
    mandatoryElements: "",
    forbiddenElements: "이모지 사용 금지",
    posterKeyVisual: "",
    posterKeyVisualEnabled: "false",
    posterInfoLayout: "",
    posterInfoLayoutEnabled: "false",
    posterOffer: "",
    posterOfferEnabled: "true",
    posterOfferMode: "ai",
    snsHook: "",
    snsHookEnabled: "true",
    snsHookMode: "ai",
    snsHashtags: "",
    snsHashtagsEnabled: "true",
    snsHashtagsMode: "ai",
    snsVisualFocus: "",
    snsVisualFocusEnabled: "false",
    snsPlacementNotes: "",
    snsPlacementNotesEnabled: "false",
    ctaEnabled: "true",
    ctaMode: "ai",
    qrEnabled: "false",
    qrUrl: "",
    bigIdea: "",
    bigIdeaEnabled: "true",
    bigIdeaMode: "manual",
    visualMetaphor: "",
    visualMetaphorEnabled: "true",
    visualMetaphorMode: "manual",
    variationMode: "none",
    layoutComposition: "centered",
    layoutCompositionEnabled: "true",
    layoutCompositionMode: "manual",
    appliedConceptStyle: "",
  };

  const ASSET_LABELS = {
    image: "홍보 이미지",
  };

  const ASSET_LABELS_EN = {
    image: "promotion image",
  };

  const ASSET_PROMPT_TARGET_EN = {
    image: "promotion image",
  };

  const KIND_META = {
    visible: { label: "이미지 텍스트", className: "visible" },
    instruction: { label: "설계 지시", className: "instruction" },
    constraint: { label: "구성 조건", className: "constraint" },
  };

  const STATIC_FIELD_KINDS = {
    promotionContentType: "constraint",
    promotionOutputLanguage: "constraint",
    promotionPromptMode: "constraint",
    promotionOmitEmptyFields: "constraint",
    promotionDedupePromptLines: "constraint",
    promotionAutoResolveConflicts: "constraint",
    promotionCommercialBaseline: "constraint",
    promotionCreativityLevel: "constraint",
    promotionVariationModeToggle: "constraint",
    promotionSizeMode: "constraint",
    promotionRatio: "constraint",
    promotionOrientation: "constraint",
    promotionCustomRatioW: "constraint",
    promotionCustomRatioH: "constraint",
    promotionDirectSizeUnit: "constraint",
    promotionDirectSizeW: "constraint",
    promotionDirectSizeH: "constraint",
    promotionGoal: "instruction",
    promotionAudience: "instruction",
    promotionHeadline: "visible",
    promotionSubheadline: "visible",
    promotionBodyCopy: "visible",
    promotionCta: "visible",
    promotionQrEnabled: "constraint",
    promotionQrUrl: "instruction",
    promotionTone: "instruction",
    promotionVisualStyle: "instruction",
    promotionQualityNotes: "instruction",
    promotionBigIdea: "instruction",
    promotionVisualMetaphor: "instruction",
    promotionColorStrategy: "constraint",
    promotionPrimaryColor: "constraint",
    promotionSecondaryColor: "constraint",
    promotionAccentColor: "constraint",
    promotionBackgroundMode: "constraint",
    promotionBackgroundColor: "constraint",
    promotionBackgroundDetails: "instruction",
    promotionMandatoryElements: "visible",
    promotionForbiddenElements: "instruction",
  };

  const FIELD_LABELS = {
    contentType: "컨텐츠 유형",
    outputLanguage: "프롬프트 언어",
    promptMode: "출력 모드",
    omitEmptyFields: "빈 항목 자동 제거",
    dedupePromptLines: "중복 문구 제거",
    autoResolveConflicts: "상충 규칙 자동 정리",
    commercialBaseline: "상업 완성도 기준",
    creativityLevel: "구성 실험 강도",
    variationMode: "다양성 변형 지시",
    sizeMode: "규격 입력 방식",
    ratio: "비율",
    orientation: "방향",
    customRatioW: "사용자 비율(W)",
    customRatioH: "사용자 비율(H)",
    directSize: "직접 입력 크기",
    directSizeUnit: "직접 입력 단위",
    directSizeW: "너비",
    directSizeH: "높이",
    goal: "홍보 목적",
    audience: "핵심 타깃",
    headline: "헤드라인",
    subheadline: "서브 카피",
    bodyCopy: "본문 포인트",
    cta: "엑션버튼(CTA)",
    qrEnabled: "QR코드 사용 여부",
    qrUrl: "QR코드 연결 주소",
    tone: "브랜드 톤",
    visualStyle: "비주얼 스타일",
    antiAiStyle: "AI 느낌 억제",
    qualityNotes: "결과물 결함 방지",
    colorStrategy: "색상 전략",
    bigIdea: "Big Idea",
    visualMetaphor: "비주얼 은유",
    primaryColor: "메인 색상",
    secondaryColor: "보조 색상",
    accentColor: "포인트 색상",
    backgroundMode: "배경 처리 방식",
    backgroundColor: "배경 색상",
    backgroundDetails: "배경 패턴/이미지 지시",
    mandatoryElements: "반드시 포함할 요소",
    forbiddenElements: "피해야 할 요소",
    posterKeyVisual: "메인 비주얼 포인트",
    posterInfoLayout: "정보 배치 방식",
    posterOffer: "한 줄 오퍼",
    snsHook: "첫 줄 훅",
    snsHashtags: "해시태그/태그",
    snsVisualFocus: "SNS 비주얼 중심 포인트",
    snsPlacementNotes: "배치 메모",
  };

  const FIELD_LABELS_EN = {
    contentType: "content template",
    outputLanguage: "prompt language",
    promptMode: "output mode",
    omitEmptyFields: "auto-remove empty fields",
    dedupePromptLines: "remove duplicate prompt lines",
    autoResolveConflicts: "auto-resolve conflicting rules",
    commercialBaseline: "commercial baseline",
    creativityLevel: "creativity level",
    variationMode: "variation directive",
    sizeMode: "sizing mode",
    ratio: "aspect ratio",
    orientation: "orientation",
    customRatioW: "custom ratio width",
    customRatioH: "custom ratio height",
    directSize: "exact size",
    directSizeUnit: "size unit",
    directSizeW: "width",
    directSizeH: "height",
    goal: "promotion goal",
    audience: "target audience",
    headline: "headline",
    subheadline: "sub copy",
    bodyCopy: "body points",
    cta: "action button (CTA)",
    qrEnabled: "QR code usage",
    qrUrl: "QR code target URL",
    tone: "brand tone",
    visualStyle: "visual style",
    antiAiStyle: "anti-AI style preset",
    qualityNotes: "quality refinements",
    colorStrategy: "color strategy",
    bigIdea: "big idea",
    visualMetaphor: "visual metaphor",
    primaryColor: "primary color",
    secondaryColor: "secondary color",
    accentColor: "accent color",
    backgroundMode: "background treatment",
    backgroundColor: "background color",
    backgroundDetails: "background pattern/image guidance",
    mandatoryElements: "must-include elements",
    forbiddenElements: "elements to avoid",
    posterKeyVisual: "main visual focal point",
    posterInfoLayout: "information layout",
    posterOffer: "single-line offer",
    snsHook: "opening hook",
    snsHashtags: "hashtags/tags",
    snsVisualFocus: "SNS visual focal point",
    snsPlacementNotes: "placement notes",
  };

  const QUICK_BTNS = {
    tone: [
      "신뢰감 있는",
      "대담한",
      "임팩트 있는",
      "전문적인",
      "세련된",
      "친근한",
      "역동적인",
      "모던한",
      "미니멀한",
      "따뜻한",
      "스마트한",
      "브랜드 광고 같은",
    ],
    visualStyle: [
      "실사 위주",
      "3D 그래픽",
      "대담한 타이포그래피",
      "네온 무드",
      "파스텔 톤",
      "플랫 디자인",
      "글래스모피즘",
      "매거진 편집형",
      "브랜드 포스터형",
      "인포그래픽형",
      "미니멀 그리드형",
      "하이엔드 제품광고형",
      "캠페인 광고형",
      "데이터 중심 레이아웃",
      "에디토리얼 광고형",
    ],
    qualityNotes: [
      "광고 이미지급 디테일",
      "텍스트와 배경 대비 선명",
      "모바일 썸네일 가독성 우선",
      "노이즈 없는 깨끗한 표면",
      "타이포 가장자리 또렷하게",
      "브랜드 색상 정확도 유지",
      "텍스트 외곽선 없이 선명하게",
      "CTA 버튼 한눈에 읽히게",
      "인물과 배경 경계 또렷하게",
      "저해상도 스톡 느낌 금지",
    ],
    backgroundDetails: [
      "은은한 그리드 패턴",
      "기하학 라인 패턴",
      "제품 질감 배경 이미지",
      "도시 야경 블러 배경",
      "메탈 텍스처 배경",
      "그라데이션 배경 위 미세 노이즈",
      "딥 네이비 그라데이션 배경",
      "텍스트 영역만 어둡게 오버레이",
      "현장 사진 흐림 처리 배경",
      "추상 광원 오버레이",
    ],
    visualPoint: [
      "중앙 히어로 제품",
      "금속 질감 배경",
      "기하학적 패턴",
      "인물 클로즈업",
      "자연 풍경",
      "데이터 시각화",
      "추상적 그래픽",
      "오른쪽 인물, 왼쪽 헤드라인",
      "대형 헤드라인과 단일 오브젝트",
      "상단 타이포, 하단 정보 카드",
    ],
    infoLayout: [
      "좌측 텍스트 강조, 우측 비주얼 배치",
      "상단 헤드라인 고정",
      "중앙 집중형",
      "그리드 분할",
      "하단 정보 박스 일체형",
      "상단 훅, 중단 핵심, 하단 CTA",
      "Z자 흐름",
      "여백 강조",
      "좌측 정렬축 통일",
      "정보 카드 1개로 묶기",
    ],
    cardnewsFlow: [
      "문제 인식 → 핵심 데이터 → 해결안 → CTA",
      "질문 → 오해 바로잡기 → 사례 → CTA",
      "혜택 요약 → 세부 포인트 → 일정 → CTA",
      "후킹 문장 → 핵심 사실 3개 → 신청 안내",
      "공감 문제 제시 → 전환 포인트 → 행동 유도",
    ],
    snsVisualFocus: [
      "제품 중심",
      "인물 중심",
      "타이포 중심",
      "정보카드 중심",
      "배경 무드 중심",
      "CTA 버튼 중심",
      "헤드라인과 CTA 이중 강조",
      "인물 반신과 큰 제목 중심",
    ],
    snsPlacement: [
      "상단 25% 훅 카피",
      "중앙 비주얼 중심",
      "하단 CTA 버튼 영역 분리",
      "안전영역 침범 금지",
      "좌측 상단 로고 고정",
      "우측 하단 CTA 배지",
      "텍스트 블록 2개 이하 유지",
      "스티커/링크 영역과 12% 이상 간격",
      "헤드라인과 배경 대비 강하게",
      "썸네일 축소 시도 가독성 유지",
      "상하단 UI 영역 피해 배치",
      "왼쪽 정렬축 유지",
    ],
    bigIdea: [
      "참여",
      "성장",
      "신뢰",
      "변화",
      "연결",
      "혁신",
      "소통",
    ],
    visualMetaphor: [
      "상승 곡선",
      "빛의 경로",
      "확산하는 물결",
      "맞물린 기어",
      "정렬된 큐브",
      "열린 프레임",
      "겹치는 레이어",
    ],
  };

  const DEFAULT_QUALITY_TAGS = {
    ko: [
      "광고 이미지급 고해상도 품질",
      "텍스트와 배경 대비 선명",
      "텍스트 가장자리 또렷함",
      "픽셀 깨짐 없음",
      "썸네일 축소 시에도 핵심 문구 가독성 유지",
      "작은 글자 번짐 방지",
      "노이즈 없는 깨끗한 표면",
      "인물 얼굴 왜곡 방지",
      "손가락 및 로고 형태 왜곡 방지",
      "제품 윤곽선 선명",
      "과한 합성 광택 방지",
      "스톡 이미지 같은 질감 방지",
      "과한 광원·네온 번짐·렌즈 플레어 방지",
      "장난감 같은 3D 오브젝트와 가짜 홀로그램 금지",
      "실사 합성의 원근·스케일·그림자·색온도 일관성 유지",
      "외부 프레임 없는 단일 완성 이미지",
    ],
    en: [
      "advertising-grade high-resolution quality",
      "strong text-to-background contrast",
      "crisp text edges",
      "no pixelation",
      "headline legible at thumbnail size",
      "prevent small text blurring",
      "clean noise-free surfaces",
      "prevent face distortion",
      "prevent hand and logo distortion",
      "sharp product contours",
      "avoid over-rendered synthetic gloss",
      "avoid cheap stock photo appearance",
      "avoid excessive lighting effects, neon bloom, and lens flare",
      "no toy-like 3D objects or fake holograms",
      "keep photorealistic compositing consistent in perspective, scale, shadows, and color temperature",
      "single finished image with no outer frame",
    ],
  };

  const COMMERCIAL_BASELINE_PROFILES = {
    off: {
      labelKo: "없음",
      labelEn: "Off",
      linesKo: [],
      linesEn: [],
    },
    standard: {
      labelKo: "스탠다드",
      labelEn: "Standard",
      linesKo: [
        "상업용 홍보 이미지 수준의 정돈감과 명확한 시선 흐름을 유지한다",
        "메시지는 하나의 핵심 포인트로 압축하고, CTA는 즉시 읽히게 정리한다",
        "과장된 효과보다 안정적인 광고 제작물 완성도를 우선한다",
      ],
      linesEn: [
        "Maintain the polish and clarity expected from a commercial promotion image",
        "Compress the message around one primary point and keep the CTA instantly readable",
        "Prioritize dependable advertising-grade finish over exaggerated effects",
      ],
    },
    premium: {
      labelKo: "프리미엄",
      labelEn: "Premium",
      linesKo: [
        "프리미엄 브랜드 캠페인 시안처럼 정교한 위계와 고급스러운 마감을 만든다",
        "하나의 강한 포컬 포인트를 중심으로 비범하지만 과하지 않은 편집형 구도를 만든다",
        "흔한 SNS 썸네일 느낌을 피하고, 광고 아트디렉션이 느껴지는 완성도를 우선한다",
      ],
      linesEn: [
        "Deliver the hierarchy and polish of a premium brand-campaign key visual",
        "Build the composition around one strong focal point with an editorial layout that feels distinctive but controlled",
        "Avoid generic social-thumbnail aesthetics and favor clear advertising art direction",
      ],
    },
    luxury: {
      labelKo: "럭셔리",
      labelEn: "Luxury",
      linesKo: [
        "하이엔드 글로벌 캠페인 시안 수준의 절제된 고급감과 상업적 완성도를 만든다",
        "여백, 재질, 광원, 색상 절제를 통해 럭셔리 브랜드 광고처럼 보이게 만든다",
        "모든 요소가 값비싸고 정밀하게 보이도록 표면 질감과 디테일을 고급스럽게 통제한다",
      ],
      linesEn: [
        "Aim for the restraint and polish of a high-end global campaign visual",
        "Use whitespace, material treatment, lighting, and restrained color to evoke luxury-brand advertising",
        "Control surface detail and finishing so every element feels expensive and precisely crafted",
      ],
    },
  };

  const CREATIVITY_LEVEL_PROFILES = {
    stable: {
      labelKo: "안정형",
      labelEn: "Stable",
      linesKo: [
        "정보 전달과 가독성을 최우선으로 두고 무리한 구도 실험은 줄인다",
        "익숙한 광고 문법 안에서 정교함과 완성도를 높이는 방향으로 설계한다",
      ],
      linesEn: [
        "Prioritize clarity and readability over aggressive compositional experimentation",
        "Stay within familiar advertising grammar while raising precision and finish",
      ],
    },
    balanced: {
      labelKo: "균형형",
      labelEn: "Balanced",
      linesKo: [
        "가독성과 창의성의 균형을 맞추고, 과하지 않은 긴장감 있는 레이아웃을 허용한다",
        "브랜드 광고처럼 안정적이되 한두 개의 신선한 조형 포인트를 넣는다",
      ],
      linesEn: [
        "Balance readability with creativity and allow controlled layout tension",
        "Keep the composition brand-safe while introducing one or two fresh formal ideas",
      ],
    },
    experimental: {
      labelKo: "실험형",
      labelEn: "Experimental",
      linesKo: [
        "비대칭, 오버랩, 프레임 돌출, 색면 분할 같은 공격적인 구도 실험을 허용한다",
        "단, 헤드라인과 CTA 가독성은 유지한 채 예측 가능한 레이아웃을 피한다",
      ],
      linesEn: [
        "Allow assertive experiments such as asymmetry, overlap, frame-breaking, and color-field splits",
        "Preserve headline and CTA readability while avoiding predictable layouts",
      ],
    },
  };

  const VARIATION_SEEDS = [
    {
      id: "typo",
      labelKo: "타이포그래피 중심",
      labelEn: "Typography-driven",
      linesKo: [
        "타이포그래피를 주인공으로, 비주얼 오브젝트는 보조 역할로 제한한다",
        "여백을 적극적으로 활용해 텍스트 위계를 단순하고 강하게 잡는다",
        "서체 크기 대비를 과감하게 벌려 시선 흐름을 타이포 중심으로 유도한다",
        "색상 수는 최대 3가지로 제한하고, 포인트색은 CTA 요소에만 사용한다",
      ],
      linesEn: [
        "Typography is the hero; limit visual objects to supporting roles only",
        "Use generous white space to keep the text hierarchy simple and powerful",
        "Exaggerate the scale contrast between type sizes to guide the eye through copy first",
        "Restrict the palette to 3 colors maximum; reserve the accent color for the CTA element only",
      ],
    },
    {
      id: "visual",
      labelKo: "비주얼 오브젝트 중심",
      labelEn: "Visual-object-driven",
      linesKo: [
        "강렬한 단일 비주얼 오브젝트를 화면 중심에 배치해 시선을 즉시 집중시킨다",
        "텍스트는 오브젝트 주변에 최소화하고, 헤드라인과 CTA만 전면에 노출한다",
        "배경과 오브젝트 사이의 명도·채도 대비를 극대화해 입체감을 강조한다",
        "오브젝트의 질감·조명·그림자를 세밀하게 묘사해 광고 시안 수준의 완성도를 낸다",
      ],
      linesEn: [
        "Place one dominant visual object at the focal center to capture attention instantly",
        "Minimize on-image text to headline and CTA only; let the object carry the message",
        "Maximize the brightness and saturation contrast between background and object for depth",
        "Describe texture, lighting, and shadow on the object in detail to achieve advertising-grade polish",
      ],
    },
    {
      id: "experimental",
      labelKo: "실험적 레이아웃",
      labelEn: "Experimental layout",
      linesKo: [
        "대칭을 의도적으로 깨고 비대칭 구성으로 긴장감과 역동성을 연출한다",
        "텍스트 블록을 사선 또는 불규칙 각도로 배치해 시선에 에너지를 준다",
        "그리드 경계를 벗어나는 블리드(bleed) 요소를 활용해 화면 밖으로 확장되는 느낌을 준다",
        "색면 분할이나 중첩 레이어로 공간에 깊이감을 더하고 단조로운 레이아웃을 탈피한다",
      ],
      linesEn: [
        "Intentionally break symmetry with an asymmetric composition to create tension and energy",
        "Angle or tilt text blocks to inject kinetic momentum into the eye path",
        "Use bleed elements that appear to extend beyond the frame edge for a dynamic, expansive feel",
        "Add depth with color-field splits or overlapping layers to escape a flat, predictable layout",
      ],
    },
  ];

  const CONTENT_PROMOTION_STRATEGIES = {
    none: {
      linesKo: [
        "목적이 직접 입력형이므로 헤드라인과 핵심 혜택을 먼저 읽히게 하고, 나머지 정보는 보조 레이어로 낮춘다",
        "브랜드 광고처럼 하나의 강한 장면을 만들되, 임의 정보나 장식 텍스트를 추가하지 않는다",
      ],
      linesEn: [
        "Because this is a custom brief, make the headline and core benefit read first, while pushing secondary information into supporting layers",
        "Create one strong brand-advertising scene, but do not invent extra information or decorative text",
      ],
    },
    campaign: {
      linesKo: [
        "감정적 공감과 참여 동기를 먼저 만들고, 캠페인 슬로건을 강한 첫 인상으로 고정한다",
        "상징 오브젝트나 은유 장면을 활용해 메시지를 설명하지 않고 직관적으로 느끼게 만든다",
        "행동 유도는 참여 선언, 서약, 공유, 신청 중 하나로 명확하게 좁힌다",
      ],
      linesEn: [
        "Build emotional empathy and participation motive first, then lock the campaign slogan as the strongest first impression",
        "Use a symbolic object or metaphorical scene so the message is felt intuitively rather than explained literally",
        "Narrow the action prompt to one clear behavior such as pledge, share, register, or join",
      ],
    },
    "result-promo": {
      linesKo: [
        "핵심 수치와 성과 타이틀을 가장 먼저 보이게 하고, 신뢰감을 주는 정보 카드 구조로 정돈한다",
        "성과 데이터는 장식이 아니라 증거처럼 보여야 하며, 숫자·출처·라벨의 가독성을 최우선으로 둔다",
        "비주얼 은유는 상승, 확장, 누적, 신뢰 같은 방향으로 제한해 과장된 축제 분위기를 피한다",
      ],
      linesEn: [
        "Make the key metric and outcome title read first, then organize supporting information into trustworthy information cards",
        "Performance data must read like evidence rather than decoration; prioritize legibility of numbers, sources, and labels",
        "Limit visual metaphors to growth, expansion, accumulation, or trust; avoid exaggerated celebratory styling",
      ],
    },
    "event-info": {
      linesKo: [
        "행사명과 날짜·장소·신청 행동을 빠르게 읽히게 하고, 분위기는 참여하고 싶은 장면으로 연출한다",
        "메인 비주얼은 행사 경험을 상상하게 만드는 인물, 공간, 조명, 움직임 중 하나로 잡는다",
        "정보 박스는 하단 또는 한쪽 축에 묶어 포스터처럼 즉시 스캔 가능하게 만든다",
      ],
      linesEn: [
        "Make the event title, date, location, and registration action readable quickly, while staging the mood as an experience people want to join",
        "Use one main visual cue such as people, venue, light, or motion to make the event experience imaginable",
        "Group event details into a bottom or side information zone so the image scans like a poster",
      ],
    },
    "survey-request": {
      linesKo: [
        "참여 부담을 낮추는 친근한 첫 인상과 짧은 소요 시간·혜택·의미를 명확히 보여준다",
        "딱딱한 조사 문서처럼 보이지 않게 라운드 카드, 부드러운 색면, 간단한 아이콘을 활용한다",
        "CTA는 선물·의견·참여 의미 중 하나를 중심으로 가볍고 즉각적인 행동으로 만든다",
      ],
      linesEn: [
        "Create a friendly first impression that lowers participation friction, while clearly showing duration, reward, and purpose",
        "Avoid a rigid survey-document look by using rounded cards, soft color fields, and simple icons",
        "Shape the CTA around reward, opinion, or contribution so the action feels light and immediate",
      ],
    },
    "training-info": {
      linesKo: [
        "교육 혜택, 성장 가능성, 마감일을 한눈에 보이게 하고 신청 동기를 분명히 만든다",
        "학습·성장 은유는 계단, 빛, 경로, 열린 문, 상승 그래프처럼 긍정적이고 전문적인 상징을 사용한다",
        "커리큘럼 정보는 길게 설명하지 말고 핵심 혜택 2~3개로 압축해 카드화한다",
      ],
      linesEn: [
        "Make training benefits, growth potential, and deadline visible at a glance, with a clear reason to apply",
        "Use positive professional learning metaphors such as stairs, light, paths, open doors, or rising graphs",
        "Do not explain curriculum at length; compress it into 2 to 3 benefit cards",
      ],
    },
    "biz-promo": {
      linesKo: [
        "지원 혜택과 신청 자격을 명확히 보여주되, 스타트업·비즈니스 광고처럼 에너지 있는 장면을 만든다",
        "비주얼은 기회, 연결, 확장, 투자, 파트너십을 상징하는 오브젝트나 공간 구조로 잡는다",
        "과도한 네온이나 장난감 같은 3D를 피하고, 전문성과 성장감을 동시에 준다",
      ],
      linesEn: [
        "Show program benefits and eligibility clearly while creating an energetic startup or business-advertising scene",
        "Build the visual around objects or spatial structures symbolizing opportunity, connection, expansion, investment, or partnership",
        "Avoid excessive neon or toy-like 3D; balance professionalism with growth energy",
      ],
    },
  };

  const CREATIVE_DIVERSITY_PROFILES = {
    stable: {
      linesKo: [
        "동일한 정보라도 흔한 공지형 템플릿을 피하고, 색면·여백·타이포 스케일 중 하나에 차별점을 둔다",
        "결과물은 안정적이어야 하지만 스톡 이미지처럼 평범하거나 무난한 안내문처럼 보이면 안 된다",
      ],
      linesEn: [
        "Even with the same information, avoid a generic notice-template look by differentiating one element: color fields, whitespace, or type scale",
        "The result should remain stable, but must not look like a generic stock image or plain announcement",
      ],
    },
    balanced: {
      linesKo: [
        "서로 다른 결과가 나오도록 타이포 중심, 오브젝트 중심, 공간 분할 중 하나를 과감하게 선택한다",
        "하나의 신선한 시각 아이디어를 반드시 포함하되, 헤드라인과 CTA의 가독성은 절대 희생하지 않는다",
        "뻔한 중앙 정렬 포스터 대신 비대칭 축, 오버랩 레이어, 대담한 크롭 중 하나를 활용한다",
      ],
      linesEn: [
        "Choose one decisive direction among typography-led, object-led, or spatially split composition so outputs vary meaningfully",
        "Include one fresh visual idea, but never sacrifice headline or CTA readability",
        "Avoid a predictable centered poster by using one of: asymmetric axis, overlapping layers, or bold cropping",
      ],
    },
    experimental: {
      linesKo: [
        "예측 가능한 템플릿 구성을 피하고, 비대칭·블리드·색면 분할·초현실적 은유 중 하나를 명확히 사용한다",
        "장면은 광고 아트디렉션처럼 의도적으로 낯설고 기억에 남아야 하며, 단순 정보 나열로 끝나면 안 된다",
        "단, 문구 왜곡·정보 누락·CTA 가독성 저하는 허용하지 않는다",
      ],
      linesEn: [
        "Avoid predictable templates and clearly use one of: asymmetry, bleed, color-field split, or surreal metaphor",
        "The scene should feel intentionally distinctive and memorable like advertising art direction, not just a list of information",
        "However, do not allow text distortion, missing information, or reduced CTA readability",
      ],
    },
  };

  const LAYOUT_COMPOSITION_PROFILES = {
    centered: {
      labelKo: "중앙 대칭형",
      labelEn: "Centered symmetrical",
      linesKo: [
        "전형적인 중앙 집중 대칭 구도를 사용한다.",
        "헤드라인과 메인 비주얼, 행동버튼이 캔버스 세로 중앙 축을 기준으로 차례대로 정렬되며, 시선 흐름이 위에서 아래로 정직하게 흐른다.",
        "좌우 여백을 균등하게 배분하여 안정감을 극대화한다."
      ],
      linesEn: [
        "Apply a classic centered symmetrical composition.",
        "Align the headline, key visual, and action button sequentially along the vertical center axis of the canvas, ensuring a straightforward top-to-bottom eye flow.",
        "Distribute margins evenly on both sides to maximize formal stability."
      ]
    },
    "left-heavy": {
      labelKo: "비대칭 좌측 집중",
      labelEn: "Asymmetric left-heavy",
      linesKo: [
        "캔버스를 4:6 비율의 비대칭 수직 열로 나누어 배치한다.",
        "모든 텍스트 요소와 행동버튼(CTA)은 좌측 40% 영역(어두운 배경 영역) 내에 왼쪽 정렬하여 밀도 높게 몰아넣는다.",
        "우측 60% 영역은 텍스트 없이 메인 비주얼 오브젝트의 과감하게 크롭된 모습만을 보여주고, 텍스트가 비주얼 위로 절대 침범하지 않게 한다."
      ],
      linesEn: [
        "Split the canvas into a 4:6 asymmetric vertical columns.",
        "Place all text elements and the action button neatly left-aligned inside the left 40% column (with a dark overlay/background).",
        "Reserve the right 60% column solely for the bold cropped visual object, ensuring zero text overlaps onto the key visual."
      ]
    },
    "typo-first": {
      labelKo: "거대 타이포 분할",
      labelEn: "Typography-first split",
      linesKo: [
        "타이포그래피 중심의 분할 레이아웃을 사용한다.",
        "거대하게 렌더링된 헤드라인 텍스트가 화면 상단 60%를 가득 채우며 시선을 즉각적으로 사로잡는다.",
        "메인 비주얼 오브젝트와 콤팩트한 행동버튼(CTA)은 하단 40% 영역에 넓은 빈 여백을 확보한 상태로 작게 배치하여 텍스트의 임팩트를 극대화한다."
      ],
      linesEn: [
        "Employ a typography-driven split composition.",
        "A gigantic rendered headline text must dominate and occupy the top 60% of the screen area to grab immediate focus.",
        "Position the main visual object and a compact action button inside the bottom 40% area with generous negative space, maximizing the typographic impact."
      ]
    },
    "clean-split": {
      labelKo: "사선 공간 분할",
      labelEn: "Clean diagonal split",
      linesKo: [
        "사선 또는 면 대비를 통해 시각 영역을 선명하게 분할한다.",
        "텍스트가 올라가는 배경 레이어는 아무런 노이즈가 없는 완전한 단색 어두운 면으로 분리하여 가독성을 100% 확보한다.",
        "반대편 대비되는 밝고 강렬한 색상 필드 영역에 추상적인 기하학 오브젝트를 배치하여, 글씨가 없는 예술 영역과 글씨 영역을 물리적으로 격리한다."
      ],
      linesEn: [
        "Apply a clean diagonal or high-contrast split composition.",
        "Isolate the text background layer as a pure solid dark surface with zero visual noise behind the letters to guarantee 100% readability.",
        "Position the abstract geometric object in a contrasting bright color field on the opposite side, physically separating the text zone from the purely artistic visual zone."
      ]
    }
  };

  const AI_TOGGLE_FIELDS = new Set(["posterOffer", "snsHook", "snsHashtags", "cta"]);
  const FIELD_ENABLE_TOGGLE_FIELDS = new Set(["posterKeyVisual", "posterInfoLayout", "snsVisualFocus", "snsPlacementNotes"]);

  const STEP5_QUALITY_OPTIONS = [
    "텍스트 가장자리 선명",
    "작은 글자 번짐 방지",
    "저해상도 픽셀 깨짐 방지",
    "노이즈 없는 깨끗한 표면",
    "인물 얼굴 왜곡 방지",
    "손가락·로고 형태 왜곡 방지",
    "제품 윤곽선 선명",
    "과한 합성 광택 방지",
    "스톡 이미지 같은 질감 방지",
  ];

  const STEP3_VISUAL_OPTION_GROUPS = {
    tone: ["신뢰감", "전문적", "따뜻함", "활기", "프리미엄", "차분함"],
    bigIdea: ["연결", "성장", "참여", "전환", "기회", "신뢰"],
    visualMetaphor: ["빛의 경로", "열린 문", "상승 곡선", "연결된 카드", "투명한 큐브", "중심으로 모이는 흐름"],
    visualStyle: [
      "실사 중심",
      "에디토리얼 광고형",
      "미니멀 정보형",
      "인포그래픽형",
      "3D 오브젝트",
      "대담한 타이포그래피",
      "플랫 일러스트",
      "아이소메트릭",
      "데이터 시각화형",
      "콜라주형",
      "제품 광고형",
      "공공 안내형",
      "매거진 커버형",
      "모션 그래픽 느낌",
      "따뜻한 캐릭터형",
      "하이엔드 캠페인형",
      "테크 UI형",
      "포토그래픽 포스터형",
      "유리 카드형",
      "입체 레이어형",
      "페이퍼 콜라주형",
    ],
  };

  const STEP3_IDEA_PRESETS = [
    {
      id: "trust",
      label: "신뢰형",
      desc: "공공성, 기관 신뢰, 안정적인 안내",
      fields: {
        tone: "신뢰감, 전문적, 차분함",
        bigIdea: "신뢰",
        visualMetaphor: "안정적인 중심축과 정돈된 정보 카드",
        visualStyle: "미니멀 정보형, 에디토리얼 광고형",
      },
    },
    {
      id: "growth",
      label: "성장형",
      desc: "기회, 확장, 참여 동기",
      fields: {
        tone: "활기, 긍정적, 미래지향",
        bigIdea: "성장",
        visualMetaphor: "상승 곡선과 빛의 경로",
        visualStyle: "캠페인 광고형, 대담한 타이포그래피",
      },
    },
    {
      id: "connection",
      label: "연결형",
      desc: "네트워크, 협력, 커뮤니티",
      fields: {
        tone: "따뜻함, 신뢰감, 현대적",
        bigIdea: "연결",
        visualMetaphor: "여러 카드와 경로가 하나의 중심으로 연결되는 장면",
        visualStyle: "인포그래픽형, 미니멀 정보형",
      },
    },
    {
      id: "premium",
      label: "프리미엄형",
      desc: "고급 캠페인, 선명한 키비주얼",
      fields: {
        tone: "프리미엄, 세련된, 절제된",
        bigIdea: "전환",
        visualMetaphor: "빛이 통과하는 투명한 큐브와 넓은 여백",
        visualStyle: "에디토리얼 광고형, 실사 중심, 대담한 타이포그래피",
      },
    },
  ];

  const ANTI_AI_PRESETS = [
    {
      id: "general",
      labelKo: "일반/범용",
      labelEn: "General / Universal",
      descKo: "스타일 왜곡 없는 AI 결함 억제 · 형태/화질 보정",
      descEn: "Style-agnostic suppression · general quality corrections",
      visualHintKo: "왜곡 없는 자연스러운 비주얼 구조, 형태적 안정성과 균형",
      visualHintEn: "natural visual structure without distortion, formal stability and balance",
      forbiddenKo: "이모지 사용 금지, 광택 CTA 버튼, 저해상도 스톡 느낌, 비정상적 형태 왜곡, 뭉개진 손가락, 붕괴된 외곽선, 부자연스럽고 조악한 인공 광택, 엉성한 AI 스톡 느낌",
      forbiddenEn: "no emoji usage, glossy action buttons, low-resolution stock appearance, deformed shapes, mutated fingers, collapsed outlines, unnatural cheap synthetic gloss, poorly crafted AI stock aesthetic",
    },
    {
      id: "flat_vector",
      labelKo: "플랫/벡터",
      labelEn: "Flat / Vector",
      descKo: "기어·회로 콜라주 금지 · 단순 아이콘·선형 일러스트",
      descEn: "No gear/circuit collage · flat icons, line illustration",
      visualHintKo: "플랫 벡터 스타일, 단순한 아이콘 조합, 선형 일러스트",
      visualHintEn: "flat vector style, simple icon composition, line illustration",
      forbiddenKo: "기어 콜라주, 회로판 오버레이, 부품 합성, 과도한 3D 렌더링, 기계 파편 콜라주, AI 스톡 일러스트 무드",
      forbiddenEn: "gear collage, circuit board overlay, mechanical parts composition, over-rendered 3D, AI stock illustration aesthetic",
    },
    {
      id: "photo_real",
      labelKo: "실사/사진",
      labelEn: "Photo / Real",
      descKo: "AI 합성 이미지 금지 · 실제 촬영 사진 느낌",
      descEn: "No AI-generated composites · real photo mood",
      visualHintKo: "실사 사진 무드, 촬영 기반 이미지, 자연스러운 조명",
      visualHintEn: "photo-realistic mood, camera-based imagery, natural lighting",
      forbiddenKo: "AI 합성 느낌, 가상 오브젝트 조합, 투명 레이어 부유 효과, 인공적인 렌더링 광택, 비현실적 구조물",
      forbiddenEn: "AI composite feel, floating virtual objects, translucent layer stacking, artificial render gloss, unrealistic structures",
    },
    {
      id: "minimal_typo",
      labelKo: "미니멀/타이포",
      labelEn: "Minimal / Typo",
      descKo: "복잡한 오브젝트 금지 · 타이포 + 여백 중심",
      descEn: "No complex objects · typography and whitespace only",
      visualHintKo: "타이포그래피 중심, 최소한의 오브젝트, 넓은 여백, 강한 서체 대비",
      visualHintEn: "typography-driven, minimal objects, generous whitespace, strong typeface contrast",
      forbiddenKo: "복잡한 배경 오브젝트, 장식적 파티클, AI 생성 텍스처, 과도한 그래픽 요소, 어지러운 콜라주",
      forbiddenEn: "complex background objects, decorative particles, AI-generated textures, excessive graphic elements, cluttered collage",
    },
  ];

  Object.assign(COMMERCIAL_BASELINE_PROFILES, {
    off: {
      labelKo: "기본",
      labelEn: "Basic",
      linesKo: [],
      linesEn: [],
    },
    standard: {
      labelKo: "실무형",
      labelEn: "Production-ready",
      linesKo: [
        "기본적인 상업 홍보물 수준의 선명도와 정돈된 마감을 유지한다",
        "정보가 과장되지 않게 보이도록 안정적인 밀도와 균형을 유지한다",
      ],
      linesEn: [
        "Maintain production-ready clarity and a clean commercial finish",
        "Keep density and balance stable so the information does not feel exaggerated",
      ],
    },
    premium: {
      labelKo: "프리미엄",
      labelEn: "Premium",
      linesKo: [
        "캠페인 키비주얼 수준의 정교한 마감, 선명한 초점, 고급스러운 표면 품질을 만든다",
        "장식보다 완성도를 우선해 모든 요소가 의도적으로 정돈된 광고 시안처럼 보이게 한다",
      ],
      linesEn: [
        "Deliver campaign-key-visual polish with refined finishing, clear focal control, and premium surface quality",
        "Prioritize finish over decoration so every element feels intentionally controlled",
      ],
    },
    luxury: {
      labelKo: "하이엔드",
      labelEn: "High-end luxury",
      linesKo: [
        "하이엔드 브랜드 캠페인처럼 절제된 밀도, 정밀한 질감, 값비싸 보이는 마감을 구현한다",
        "과장된 효과보다 여백, 표면, 조명, 디테일의 정교함으로 완성도를 높인다",
      ],
      linesEn: [
        "Create a high-end campaign finish with restrained density, precise material detail, and expensive-looking polish",
        "Use whitespace, surface, lighting, and detail refinement rather than exaggerated effects",
      ],
    },
  });

  Object.assign(CREATIVITY_LEVEL_PROFILES, {
    stable: {
      labelKo: "안정형",
      labelEn: "Stable",
      linesKo: [
        "검증된 정보형 구성을 사용하고 시선 흐름을 예측 가능하게 유지한다",
        "구성 실험보다 정보 전달 안정성과 오독 방지를 우선한다",
      ],
      linesEn: [
        "Use a proven informational composition with a predictable eye path",
        "Prioritize communication stability and misread prevention over layout experimentation",
      ],
    },
    balanced: {
      labelKo: "균형형",
      labelEn: "Balanced",
      linesKo: [
        "기본 정보 구조는 유지하되 하나의 신선한 구성 포인트만 허용한다",
        "시선 흐름이 깨지지 않는 범위에서 비대칭, 크기 대비, 여백 변화를 제한적으로 사용한다",
      ],
      linesEn: [
        "Keep the core information structure while allowing one fresh composition idea",
        "Use asymmetry, scale contrast, or whitespace variation only where the eye path remains clear",
      ],
    },
    experimental: {
      labelKo: "실험형",
      labelEn: "Experimental",
      linesKo: [
        "비대칭, 겹침, 프레임 절단, 과감한 스케일 대비 같은 구성 실험을 허용한다",
        "단, 핵심 문구와 주요 정보의 판독성은 반드시 유지한다",
      ],
      linesEn: [
        "Allow composition experiments such as asymmetry, overlap, frame cuts, and bold scale contrast",
        "Keep the main copy and key information readable at all times",
      ],
    },
  });

  const DEFAULT_COLOR_PRESETS = [
    {
      id: "preset_corporate_blue",
      name: "신뢰감 있는 기업 블루",
      primaryColor: "#0F3D8A",
      secondaryColor: "#D9E4F5",
      accentColor: "#FF7A00",
      backgroundMode: "solid",
      backgroundColor: "#F5F7FB",
      backgroundDetails: "은은한 그리드 패턴",
      isDefault: true,
    },
    {
      id: "preset_modern_dark",
      name: "프리미엄 테크 다크",
      primaryColor: "#101828",
      secondaryColor: "#344054",
      accentColor: "#7F56D9",
      backgroundMode: "image",
      backgroundColor: "#0B1220",
      backgroundDetails: "도시 야경 블러 배경",
      isDefault: true,
    },
    {
      id: "preset_vibrant_energy",
      name: "역동적인 스타트업 그린",
      primaryColor: "#1FA971",
      secondaryColor: "#ECFDF3",
      accentColor: "#FF6B2C",
      backgroundMode: "pattern",
      backgroundColor: "#FFFFFF",
      backgroundDetails: "기하학 라인 패턴",
      isDefault: true,
    },
    {
      id: "preset_elegant_gold",
      name: "우아한 골드 & 화이트",
      primaryColor: "#996515",
      secondaryColor: "#F3E5AB",
      accentColor: "#333333",
      backgroundMode: "solid",
      backgroundColor: "#FFFFFF",
      backgroundDetails: "고급스러운 질감 배경",
      isDefault: true,
    },
    {
      id: "preset_soft_creative",
      name: "부드러운 크리에이티브 퍼플",
      primaryColor: "#6941C6",
      secondaryColor: "#F9F5FF",
      accentColor: "#FBBC05",
      backgroundMode: "mixed",
      backgroundColor: "#FFFFFF",
      backgroundDetails: "파스텔 톤 그라데이션",
      isDefault: true,
    },
    {
      id: "preset_high_contrast",
      name: "강렬한 고대비 레드",
      primaryColor: "#D92D20",
      secondaryColor: "#FEE4E2",
      accentColor: "#101828",
      backgroundMode: "solid",
      backgroundColor: "#FFFFFF",
      backgroundDetails: "대담한 타이포 그래픽 배경",
      isDefault: true,
    },
    {
      id: "preset_nature_eco",
      name: "친근한 자연 에코",
      primaryColor: "#027A48",
      secondaryColor: "#D1FADF",
      accentColor: "#F79009",
      backgroundMode: "solid",
      backgroundColor: "#F9FAFB",
      backgroundDetails: "자연적인 질감 패턴",
      isDefault: true,
    },
    {
      id: "preset_minimal_mono",
      name: "미니멀 모노",
      primaryColor: "#111111",
      secondaryColor: "#E5E5E5",
      accentColor: "#555555",
      backgroundMode: "solid",
      backgroundColor: "#FFFFFF",
      backgroundDetails: "극도로 절제된 여백 배경",
      isDefault: true,
    },
    {
      id: "preset_warm_sunset",
      name: "따뜻한 선셋",
      primaryColor: "#E65100",
      secondaryColor: "#FFF3E0",
      accentColor: "#FB8C00",
      backgroundMode: "mixed",
      backgroundColor: "#FFF8F0",
      backgroundDetails: "부드러운 오렌지 빛 그라데이션",
      isDefault: true,
    },
    {
      id: "preset_cyberpunk",
      name: "사이버펑크 네온",
      primaryColor: "#00F2FF",
      secondaryColor: "#FF00E5",
      accentColor: "#FFFF00",
      backgroundMode: "image",
      backgroundColor: "#050505",
      backgroundDetails: "화려한 네온 사인 광원 효과",
      isDefault: true,
    },
    {
      id: "preset_luxury_orange",
      name: "럭셔리 오렌지 (에르메스 테마)",
      primaryColor: "#F37021",
      secondaryColor: "#4A3C31",
      accentColor: "#D4AF37",
      backgroundMode: "solid",
      backgroundColor: "#F9F6F0",
      backgroundDetails: "고급스러운 크림 질감 배경",
      isDefault: true,
    },
    {
      id: "preset_luxury_mint",
      name: "럭셔리 민트 (티파니 테마)",
      primaryColor: "#0ABAB5",
      secondaryColor: "#8A8D8F",
      accentColor: "#1C2833",
      backgroundMode: "solid",
      backgroundColor: "#F4F7F6",
      backgroundDetails: "깨끗하고 매끄러운 쿨그레이 배경",
      isDefault: true,
    }
  ];

  const TYPE_FIELD_DEFS = {
    image: [
      {
        key: "posterKeyVisual",
        domId: "promotionPosterKeyVisual",
        kind: "instruction",
        tag: "textarea",
        rows: 4,
        label: "메인 비주얼 포인트",
        guide: "가장 크게 보일 이미지 소재나 상징 오브젝트를 적습니다.",
        placeholder: "예: 중앙 히어로 오브젝트, 인물 반신, 추상 유리 큐브, 대형 타이포",
        quickBtns: QUICK_BTNS.visualPoint,
      },
      {
        key: "posterInfoLayout",
        domId: "promotionPosterInfoLayout",
        kind: "instruction",
        tag: "textarea",
        rows: 4,
        label: "정보 배치 방식",
        guide: "헤드라인, 정보 블록, CTA가 어떤 흐름으로 배치되는지 적습니다.",
        placeholder: "예: 상단 헤드라인 고정, 하단 정보 카드 1개, 좌측 텍스트 강조",
        quickBtns: QUICK_BTNS.infoLayout,
      },
      {
        key: "snsVisualFocus",
        domId: "promotionSnsVisualFocus",
        kind: "instruction",
        tag: "textarea",
        rows: 3,
        label: "비주얼 중심 포인트",
        guide: "화면에서 가장 먼저 시선이 가야 하는 축을 적습니다.",
        placeholder: "예: 인물 반신과 큰 헤드라인 중심, CTA보다 제목이 먼저 보이게",
        quickBtns: QUICK_BTNS.snsVisualFocus,
      },
      {
        key: "snsPlacementNotes",
        domId: "promotionSnsPlacementNotes",
        kind: "instruction",
        tag: "textarea",
        rows: 5,
        label: "배치 메모",
        guide: "안전영역, CTA 위치, 텍스트 블록 수 같은 배치 메모를 적습니다.",
        placeholder: "예: 상단 25% 훅 카피, 하단 CTA 영역 분리, 좌측 정렬축 유지",
        quickBtns: QUICK_BTNS.snsPlacement,
        wide: true,
      },
    ],
    poster: [
      {
        key: "posterKeyVisual",
        domId: "promotionPosterKeyVisual",
        kind: "instruction",
        tag: "textarea",
        rows: 4,
        label: "메인 비주얼 포인트",
        guide: "가장 크게 보여줄 이미지 소재나 상징 오브젝트를 적습니다.",
        placeholder: "예: 중앙 히어로 제품 컷, 금속 질감 위 대형 타이포",
        quickBtns: QUICK_BTNS.visualPoint,
      },
      {
        key: "posterInfoLayout",
        domId: "promotionPosterInfoLayout",
        kind: "instruction",
        tag: "textarea",
        rows: 4,
        label: "정보 배치 방식",
        guide: "일정, 장소, 가격 같은 정보를 어느 위치에 묶을지 적습니다.",
        placeholder: "예: 우측 하단 정보 박스, 상단 헤드라인 고정",
        quickBtns: QUICK_BTNS.infoLayout,
      },
    ],
    cardnews: [
      {
        key: "cardnewsFlow",
        domId: "promotionCardFlow",
        kind: "instruction",
        tag: "textarea",
        rows: 5,
        label: "카드 흐름",
        guide: "첫 장부터 마지막 장까지 어떤 순서로 메시지를 전개할지 적습니다.",
        placeholder: "예: 문제 인식 → 핵심 데이터 → 해결안 → 참가 혜택 → CTA",
        quickBtns: QUICK_BTNS.cardnewsFlow,
        wide: true,
      },
      {
        key: "cardnewsCardCount",
        domId: "promotionCardCount",
        kind: "constraint",
        tag: "select",
        label: "카드 수",
        guide: "시리즈 전체 컷 수를 정합니다.",
        options: [
          { value: "3", label: "3장" },
          { value: "4", label: "4장" },
          { value: "5", label: "5장" },
          { value: "6", label: "6장" },
          { value: "7", label: "7장" },
        ],
      },
      {
        key: "cardnewsCoverHook",
        domId: "promotionCardCoverHook",
        kind: "visible",
        tag: "input",
        label: "커버 카드 훅",
        guide: "첫 카드에 크게 보여줄 도입 문장입니다.",
        placeholder: "예: 3분 안에 이해하는 공급망 리스크 핵심",
      },
      {
        key: "cardnewsEndingCta",
        domId: "promotionCardEndingCta",
        kind: "visible",
        tag: "input",
        label: "마지막 카드 CTA",
        guide: "마지막 카드에서 행동을 유도할 문구입니다.",
        placeholder: "예: 저장하고 팀에 공유하세요",
      },
    ],
    sns: [
      {
        key: "snsVisualFocus",
        domId: "promotionSnsVisualFocus",
        kind: "instruction",
        tag: "textarea",
        rows: 3,
        label: "SNS 비주얼 중심 포인트",
        guide: "화면에서 가장 먼저 시선을 잡아야 하는 피사체나 강조 축을 적습니다.",
        placeholder: "예: CTA 버튼보다 먼저 보이는 인물 상반신과 큰 헤드라인",
        quickBtns: QUICK_BTNS.snsVisualFocus,
      },
      {
        key: "snsPlacementNotes",
        domId: "promotionSnsPlacementNotes",
        kind: "instruction",
        tag: "textarea",
        rows: 5,
        label: "배치 메모",
        guide: "스토리 안전영역, CTA 버튼 위치 같은 연출 지시입니다.",
        placeholder: "예: 상단 25% 훅 카피, 하단 20% CTA, 스티커 영역과 겹치지 않게",
        quickBtns: QUICK_BTNS.snsPlacement,
        wide: true,
      },
    ],
  };

  const CONTENT_TYPE_TEMPLATES = {
    campaign: {
      name: "캠페인",
      goal: "캠페인 동참 및 대중 인식 확산",
      audience: "일반 대중, 잠재 참여자",
      tone: "임팩트 있는, 대담한, 세련된, 브랜드 광고 같은",
      visualStyle: "대담한 타이포그래픽, 하이엔드 제품광고형, 캠페인 광고형, 강렬한 대비",
      qualityNotes: "광고 이미지급 디테일, 텍스트와 배경 대비 선명, 타이포 가장자리 또렷하게",
      mandatoryElements: "캠페인 슬로건, 로고, 참여 태그",
      forbiddenElements: "이모지 사용 금지, 장문 문단, 정보 과밀 배치",
      posterKeyVisual: "대형 헤드라인과 단일 오브젝트, 추상적 그래픽",
      posterInfoLayout: "여백 강조, 상단 헤드라인 고정",
      cardnewsFlow: "문제 제시(공감) → 캠페인 핵심 가치 → 대안/비전 → 참여 안내(CTA)",
      snsVisualFocus: "헤드라인과 핵심 문구 중심",
    },
    "result-promo": {
      name: "성과홍보",
      goal: "주요 성과 발표 및 신뢰도 확보",
      audience: "파트너사, 일반 시민, 주요 이해관계자",
      tone: "신뢰감 있는, 전문적인, 차분한, 명확한",
      visualStyle: "데이터 중심 레이아웃, 인포그래픽형, 미니멀 그리드형",
      qualityNotes: "텍스트와 배경 대비 선명, 노이즈 없는 깨끗한 표면, 브랜드 색상 정확도 유지",
      mandatoryElements: "성과 타이틀, 주요 수치 데이터, 로고, 출처",
      forbiddenElements: "과한 네온 효과, 흐릿한 배경 이미지, 불명확한 수치 표기",
      posterKeyVisual: "데이터 시각화, 기하학적 패턴",
      posterInfoLayout: "그리드 분할, 좌측 정렬축 통일",
      cardnewsFlow: "성과 요약 → 핵심 지표 3개 → 향후 비전 → 문의/피드백",
      snsVisualFocus: "정보카드 중심 (수치 및 인포그래픽)",
    },
    "event-info": {
      name: "행사안내 (참여요청)",
      goal: "행사 개최 안내 및 참가 신청 유도",
      audience: "신청 대상자, 유관 기관 실무자, 참여 희망자",
      tone: "역동적인, 세련된, 모던한, 친근한",
      visualStyle: "매거진 편집형, 실사 위주, 에디토리얼 광고형",
      qualityNotes: "행사 핵심 정보(일시/장소) 시각적 위계 강조, 모바일 썸네일 가독성 우선, CTA 버튼 한눈에 읽히게",
      mandatoryElements: "행사명, 일시, 장소, 신청 방법(QR/링크), 주최/주관 로고",
      forbiddenElements: "장황한 본문, 흐릿한 인물 사진, 가독성 낮은 폰트",
      posterKeyVisual: "인물 클로즈업, 대형 헤드라인과 단일 오브젝트",
      posterInfoLayout: "상단 헤드라인 고정, 하단 정보 박스 일체형",
      cardnewsFlow: "행사 취지 → 프로그램 핵심 → 참가 혜택 → 신청 안내(CTA)",
      snsVisualFocus: "헤드라인과 CTA 이중 강조",
    },
    "survey-request": {
      name: "설문조사 (참여요청)",
      goal: "설문 참여율 향상 및 의견 수집",
      audience: "서비스 이용자, 설문 조사 대상 고객층",
      tone: "친근한, 따뜻한, 심플한, 차분한",
      visualStyle: "파스텔 톤, 미니멀 그리드형, 라운드 형태의 요소",
      qualityNotes: "모바일 썸네일 가독성 우선, 텍스트와 배경 대비 선명, CTA 버튼 한눈에 읽히게",
      mandatoryElements: "설문 주제, 소요 시간, 경품 혜택, 참여 링크(QR)",
      forbiddenElements: "딱딱한 관공서 느낌, 정보 과밀 배치, 장문 문단",
      posterKeyVisual: "친근한 상징 아이콘, 심플한 그래픽",
      posterInfoLayout: "중앙 집중형, 정보 카드 1개로 묶기",
      cardnewsFlow: "참여 유도 훅 → 설문 목적 → 경품 혜택 → 참여 방법(CTA)",
      snsVisualFocus: "CTA 버튼 중심 (선물 쿠폰 등)",
    },
    "training-info": {
      name: "교육안내 (참여요청)",
      goal: "교육생 모집 및 신청 등록 유도",
      audience: "취업 준비생, 역량 강화 희망 실무자",
      tone: "스마트한, 전문적인, 신뢰감 있는, 성장을 돕는",
      visualStyle: "인포그래픽형, 미니멀 그리드형, 정돈된 에디토리얼 레이아웃",
      qualityNotes: "커리큘럼 및 혜택 가독성 최우선, 모집 마감일 임팩트 강조, 타이포 가장자리 또렷하게",
      mandatoryElements: "교육 과정명, 교육 기간, 신청 자격, 접수 마감일, 교육 혜택(수강료 등)",
      forbiddenElements: "복잡한 도표, 두꺼운 텍스트 외곽선, 어두운 무드",
      posterKeyVisual: "성장/배움을 상징하는 오브젝트, 단일 기하학 오브젝트",
      posterInfoLayout: "좌측 텍스트 강조, 우측 비주얼 배치, 상하단 레이아웃 분리",
      cardnewsFlow: "실무 고민 제기 → 교육 해결책 → 상세 혜택/일정 → 지원 양식(CTA)",
      snsVisualFocus: "인물 반신과 큰 제목 중심",
    },
    "biz-promo": {
      name: "사업홍보 (참여요청)",
      goal: "지원사업 모집 접수 및 파트너 발굴",
      audience: "기업 실무자, 예비 창업자, 스타트업 임직원",
      tone: "전문적인, 신뢰감 있는, 세련된, 임팩트 있는",
      visualStyle: "3D 그래픽, 글래스모피즘, 브랜드 포스터형",
      qualityNotes: "광고 이미지급 디테일, 브랜드 색상 정확도 유지, CTA 버튼 한눈에 읽히게",
      mandatoryElements: "사업명, 지원 내용, 접수 기간, 신청 자격 및 방법, 주관 기관 로고",
      forbiddenElements: "촌스러운 원색 배색, 저해상도 스톡 이미지, 정보 과밀 배치",
      posterKeyVisual: "기하학적 3D 오브젝트, 추상적 그래픽",
      posterInfoLayout: "Z자 흐름, 정보 카드 1개로 묶기",
      cardnewsFlow: "사업 추진 목적 → 핵심 지원 혜택 → 신청 자격 및 일정 → 온라인 접수(CTA)",
      snsVisualFocus: "헤드라인과 CTA 이중 강조",
    },
  };

  const CONTENT_TYPE_TEMPLATES_EN = {
    campaign: {
      name: "Campaign",
      goal: "Drive campaign participation and raise public awareness",
      audience: "general public, potential participants",
      tone: "impactful, bold, refined, brand advertisement style",
      visualStyle: "bold typography, high-end product advertisement layout, campaign advertisement layout, high-contrast palette",
      qualityNotes: "advertising-grade detail, strong text-to-background contrast, crisp typography edges",
      mandatoryElements: "campaign slogan, logo, participation hashtags",
      forbiddenElements: "emojis, long paragraphs, cluttered layout",
      posterKeyVisual: "large headline with a single hero object, abstract graphics",
      posterInfoLayout: "whitespace-focused, headline locked at top",
      cardnewsFlow: "problem empathy → core campaign values → vision/alternative → participation CTA",
      snsVisualFocus: "headline and core message centered",
    },
    "result-promo": {
      name: "Result Promotion",
      goal: "Announce key performance outcomes and establish trust",
      audience: "partners, citizens, key stakeholders",
      tone: "trustworthy, professional, calm, clear",
      visualStyle: "data-led layout, infographic style, minimal grid layout",
      qualityNotes: "strong text-to-background contrast, clean noise-free surfaces, brand color accuracy",
      mandatoryElements: "performance title, key numeric data, logo, data source",
      forbiddenElements: "excessive neon effects, blurry backgrounds, unclear numbers",
      posterKeyVisual: "data visualization, geometric pattern",
      posterInfoLayout: "grid split, unified left alignment",
      cardnewsFlow: "result summary → 3 key metrics → future vision → contact/feedback",
      snsVisualFocus: "information card focus (numbers and infographics)",
    },
    "event-info": {
      name: "Event Announcement",
      goal: "Announce event schedule and drive registration",
      audience: "target applicants, partner agency practitioners, prospective attendees",
      tone: "dynamic, refined, modern, friendly",
      visualStyle: "editorial magazine layout, photo-real direction, editorial advertising style",
      qualityNotes: "visual hierarchy for event details (date/location), mobile thumbnail legibility, prominent CTA button",
      mandatoryElements: "event title, date and time, location, application method (QR/link), organizer logo",
      forbiddenElements: "wordy body copy, blurry portrait photos, low-readability font choice",
      posterKeyVisual: "portrait close-up, large headline with a single hero object",
      posterInfoLayout: "headline locked at top, integrated bottom information box",
      cardnewsFlow: "event purpose → key program highlights → participation benefits → registration CTA",
      snsVisualFocus: "dual emphasis on headline and CTA",
    },
    "survey-request": {
      name: "Survey Request",
      goal: "Drive survey response rates and collect feedback",
      audience: "service users, survey target audience segments",
      tone: "friendly, warm, simple, calm",
      visualStyle: "pastel tone, minimal grid layout, rounded elements",
      qualityNotes: "mobile thumbnail legibility, strong text-to-background contrast, prominent CTA button",
      mandatoryElements: "survey topic, estimated duration, reward details, participation link (QR)",
      forbiddenElements: "rigid bureaucratic look, cluttered layout, long paragraphs",
      posterKeyVisual: "friendly symbolic icon, simple graphic",
      posterInfoLayout: "centered layout, single information card group",
      cardnewsFlow: "hook copy → survey purpose → reward details → participation method CTA",
      snsVisualFocus: "CTA button focus (gift coupon etc.)",
    },
    "training-info": {
      name: "Training Recruitment",
      goal: "Recruit trainees and drive course applications",
      audience: "job seekers, professionals seeking upskilling",
      tone: "smart, professional, trustworthy, growth-oriented",
      visualStyle: "infographic style, minimal grid layout, organized editorial layout",
      qualityNotes: "curriculum and benefit readability, recruitment deadline emphasis, crisp typography edges",
      mandatoryElements: "course title, training period, eligibility, application deadline, program benefits (tuition details)",
      forbiddenElements: "complex tables, thick text outlines, dark background colors",
      posterKeyVisual: "growth/learning symbolic object, single geometric object",
      posterInfoLayout: "text-first on left and visual on right, top-bottom layout split",
      cardnewsFlow: "practical dilemma → training solution → key benefits/dates → application form CTA",
      snsVisualFocus: "subject portrait and bold title focus",
    },
    "biz-promo": {
      name: "Business Promotion",
      goal: "Drive public project applications and recruit business partners",
      audience: "business practitioners, aspiring founders, startup employees",
      tone: "professional, trustworthy, refined, impactful",
      visualStyle: "3D graphics, glassmorphism, brand poster layout",
      qualityNotes: "advertising-grade detail, brand color accuracy, prominent CTA button",
      mandatoryElements: "program title, support details, application period, eligibility and method, host agency logo",
      forbiddenElements: "cheap primary colors, low-resolution stock images, cluttered layout",
      posterKeyVisual: "geometric 3D object, abstract graphics",
      posterInfoLayout: "Z-flow layout, single information card group",
      cardnewsFlow: "project goal → key program benefits → eligibility and dates → online application CTA",
      snsVisualFocus: "dual emphasis on headline and CTA",
    },
  };

  const state = deepClone(DEFAULT_STATE);
  let visitedAssetTypes = new Set([DEFAULT_STATE.assetType]);
  let latestValidation = validateState();
  let latestLint = { conflicts: [], duplicates: [], notes: [], summary: [] };
  let promptDraft = "";
  let promptDirty = false;
  let colorPresets = [];
  let sizePresets = [];

  const CONTENT_TYPE_SAMPLE_PROFILES = {
    none: {
      paletteId: "preset_modern_dark",
      state: {
        contentType: "none",
        sizeMode: "ratio",
        ratio: "4:5",
        orientation: "vertical",
        directSizeUnit: "px",
        directSizeW: "",
        directSizeH: "",
        headline: "WORK FASTER, THINK DEEPER",
        subheadline: "팀의 기획, 문서, 리서치 흐름을 하나로 묶는 AI 협업 워크스페이스",
        bodyCopy: "- 실무 문서 초안과 피드백 정리 자동화\n- 조사, 요약, 정리 작업을 한 화면에서 연결\n- 팀 단위 도입 데모와 맞춤형 파일럿 지원",
        cta: "도입 데모 요청하기",
        posterOffer: "상담 신청 시 14일 파일럿 체험과 운영 가이드 제공",
        snsHook: "팀 생산성, 이번 분기에 바꿔보세요",
        snsHashtags: "#AI협업 #업무자동화 #생산성도구",
      },
      quickFields: {
        promotionGoal: ["브랜드 인지도 제고"],
        promotionAudience: ["브랜드 관심 고객"],
        promotionTone: ["프리미엄", "세련된", "브랜드 광고 같은"],
        promotionVisualStyle: ["하이엔드 제품광고형", "에디토리얼 광고형", "대담한 타이포그래피"],
        promotionQualityNotes: ["광고 이미지급 디테일", "텍스트와 배경 대비 선명", "타이포 가장자리 또렷하게"],
        promotionBackgroundDetails: ["딥 네이비 그라데이션 배경", "추상 광원 오버레이", "텍스트 영역만 어둡게 오버레이"],
        promotionMandatoryElements: ["브랜드명", "CTA 버튼", "로고"],
        promotionForbiddenElements: ["이모지 사용 금지", "장문 문단", "저해상도 스톡 느낌"],
        promotionPosterKeyVisual: ["중앙 히어로 제품", "대형 헤드라인과 단일 오브젝트"],
        promotionPosterInfoLayout: ["상단 헤드라인 고정", "정보 카드 1개로 묶기"],
        promotionSnsVisualFocus: ["타이포 중심"],
        promotionSnsPlacementNotes: ["상단 25% 훅 카피", "하단 CTA 버튼 영역 분리", "좌측 정렬축 유지"],
      },
    },
    campaign: {
      paletteId: "preset_vibrant_energy",
      state: {
        contentType: "campaign",
        sizeMode: "ratio",
        ratio: "4:5",
        orientation: "vertical",
        directSizeUnit: "px",
        directSizeW: "",
        directSizeH: "",
        headline: "지구를 구하는 작은 약속: ZERO PLASTIC 2026",
        subheadline: "일상의 플라스틱 소비를 50% 줄이는 탄소 중립 참여 캠페인",
        bodyCopy: "- 하루 한 번 텀블러 사용 인증\n- 에코백 사용 및 다회용기 장보기 동참\n- 누적 참여자 1만 명 달성 시 친환경 숲 조성\n- 캠페인 웹사이트에서 실시간 서약 진행",
        cta: "탄소중립 서약 참여하기",
        posterOffer: "서약 참여 선착순 1,000명에게 친환경 스타터 키트 무료 증정",
        snsHook: "플라스틱 없는 하루, 당신의 작은 실천으로 시작됩니다",
        snsHashtags: "#제로플라스틱 #탄소중립 #에코캠페인",
      },
      quickFields: {
        promotionGoal: ["캠페인 동참 및 대중 인식 확산"],
        promotionAudience: ["일반 대중", "잠재 참여자"],
        promotionTone: ["임팩트 있는", "대담한", "세련된", "브랜드 광고 같은"],
        promotionVisualStyle: ["대담한 타이포그래픽", "하이엔드 제품광고형", "캠페인 광고형"],
        promotionQualityNotes: ["광고 이미지급 디테일", "텍스트와 배경 대비 선명", "타이포 가장자리 또렷하게"],
        promotionBackgroundDetails: ["고급스러운 질감 배경", "추상 광원 오버레이", "텍스트 영역만 어둡게 오버레이"],
        promotionMandatoryElements: ["캠페인 슬로건", "로고", "참여 태그"],
        promotionForbiddenElements: ["이모지 사용 금지", "장문 문단", "정보 과밀 배치"],
        promotionPosterKeyVisual: ["대형 헤드라인과 단일 오브젝트", "추상적 그래픽"],
        promotionPosterInfoLayout: ["여백 강조", "상단 헤드라인 고정"],
        promotionSnsVisualFocus: ["헤드라인과 핵심 문구 중심"],
        promotionSnsPlacementNotes: ["상단 25% 훅 카피", "하단 CTA 버튼 영역 분리", "텍스트 블록 2개 이하 유지"],
      },
    },
    "result-promo": {
      paletteId: "preset_corporate_blue",
      state: {
        contentType: "result-promo",
        sizeMode: "ratio",
        ratio: "4:5",
        orientation: "vertical",
        directSizeUnit: "px",
        directSizeW: "",
        directSizeH: "",
        headline: "2025 스마트 청년 창업 지원 사업 성과 보고",
        subheadline: "도전하는 청년 기업들과 함께 만든 혁신적 성장 지표를 공유합니다",
        bodyCopy: "- 청년 스타트업 누적 150개사 육성 완료\n- 신규 고용 창출 450명 및 후속 투자 유치 210억 원 달성\n- 글로벌 시장 진출 지원 및 수출 계약 50억 원 계약 완료\n- 2026년도 예산 대폭 확대로 청년 기업 동반성장 강화",
        cta: "상세 성과 인포그래픽 보기",
        posterOffer: "보고서 PDF 다운로드 시 우수 스타트업 디렉토리 북 동시 제공",
        snsHook: "청년 스타트업과 함께 만든 기적 같은 혁신 성과를 공개합니다",
        snsHashtags: "#스타트업지원 #사업성과 #청년창업",
      },
      quickFields: {
        promotionGoal: ["주요 성과 발표 및 신뢰도 확보"],
        promotionAudience: ["파트너사", "일반 시민", "주요 이해관계자"],
        promotionTone: ["신뢰감 있는", "전문적인", "차분한", "명확한"],
        promotionVisualStyle: ["데이터 중심 레이아웃", "인포그래픽형", "미니멀 그리드형"],
        promotionQualityNotes: ["텍스트와 배경 대비 선명", "노이즈 없는 깨끗한 표면", "브랜드 색상 정확도 유지"],
        promotionBackgroundDetails: ["은은한 그리드 패턴", "텍스트 영역만 어둡게 오버레이"],
        promotionMandatoryElements: ["성과 타이틀", "주요 수치 데이터", "로고", "출처"],
        promotionForbiddenElements: ["과한 네온 효과", "흐릿한 배경 이미지", "불명확한 수치 표기"],
        promotionPosterKeyVisual: ["데이터 시각화", "기하학적 패턴"],
        promotionPosterInfoLayout: ["그리드 분할", "좌측 정렬축 통일"],
        promotionSnsVisualFocus: ["정보카드 중심 (수치 및 인포그래픽)"],
        promotionSnsPlacementNotes: ["텍스트 블록 2개 이하 유지", "안전영역 침범 금지", "왼쪽 정렬축 유지"],
      },
    },
    "event-info": {
      paletteId: "preset_modern_dark",
      state: {
        contentType: "event-info",
        sizeMode: "ratio",
        ratio: "4:5",
        orientation: "vertical",
        directSizeUnit: "px",
        directSizeW: "",
        directSizeH: "",
        headline: "NEXT HORIZON: 2026 글로벌 기술 포럼",
        subheadline: "디지털 전환과 AI 생태계의 내일을 조망하는 국내 최대 오프라인 세미나",
        bodyCopy: "- 일시: 2026. 09. 15 (화) 10:00 ~ 17:00\n- 장소: 서울 크리에이티브 파크 그랜드볼룸\n- 연사: AI 및 로보틱스 산업 분야 최고 권위자 5인 기조강연\n- 비용: 무료 (사전 등록 마감: 09. 08)",
        cta: "선착순 사전 등록 신청",
        posterOffer: "사전 등록자 전원 강연 핵심 요약 자료집 및 네트워킹 초청장 발송",
        snsHook: "디지털 혁신의 미래, 현장에서 직접 경험하세요",
        snsHashtags: "#테크포럼 #인공지능 #사전등록",
      },
      quickFields: {
        promotionGoal: ["행사 개최 안내 및 참가 신청 유도"],
        promotionAudience: ["신청 대상자", "유관 기관 실무자", "참여 희망자"],
        promotionTone: ["역동적인", "세련된", "모던한", "친근한"],
        promotionVisualStyle: ["매거진 편집형", "실사 위주", "에디토리얼 광고형"],
        promotionQualityNotes: ["행사 핵심 정보(일시/장소) 시각적 위계 강조", "모바일 썸네일 가독성 우선", "CTA 버튼 한눈에 읽히게"],
        promotionBackgroundDetails: ["딥 네이비 그라데이션 배경", "추상 광원 오버레이", "텍스트 영역만 어둡게 오버레이"],
        promotionMandatoryElements: ["행사명", "일시", "장소", "신청 방법(QR/링크)", "주최/주관 로고"],
        promotionForbiddenElements: ["장황한 본문", "흐릿한 인물 사진", "가독성 낮은 폰트"],
        promotionPosterKeyVisual: ["인물 클로즈업", "대형 헤드라인과 단일 오브젝트"],
        promotionPosterInfoLayout: ["상단 헤드라인 고정", "하단 정보 박스 일체형"],
        promotionSnsVisualFocus: ["헤드라인과 CTA 이중 강조"],
        promotionSnsPlacementNotes: ["상단 25% 훅 카피", "하단 CTA 버튼 영역 분리", "모바일 썸네일 축소 시 가독성 유지"],
      },
    },
    "survey-request": {
      paletteId: "preset_soft_creative",
      state: {
        contentType: "survey-request",
        sizeMode: "ratio",
        ratio: "4:5",
        orientation: "vertical",
        directSizeUnit: "px",
        directSizeW: "",
        directSizeH: "",
        headline: "2026 시민 참여형 정책 혁신 설문조사",
        subheadline: "더 편리한 공공 서비스를 만들기 위해 여러분의 소중한 의견을 들려주세요",
        bodyCopy: "- 참여 기간: 2026. 06. 10 ~ 06. 30\n- 참여 대상: 공공 서비스를 이용하는 누구나\n- 설문 시간: 약 3분 (총 10개 문항)\n- 모바일 링크 및 QR코드로 참여",
        cta: "3분 설문 참여하기",
        posterOffer: "참여 완료자 전원 커피 쿠폰 지급 및 추첨 100명 3만원 상당 경품 제공",
        snsHook: "여러분의 한마디가 내일의 정책을 바꿉니다",
        snsHashtags: "#시민소통 #정책설문 #의견제출",
      },
      quickFields: {
        promotionGoal: ["설문 참여율 향상 및 의견 수집"],
        promotionAudience: ["서비스 이용자", "설문 조사 대상 고객층"],
        promotionTone: ["친근한", "따뜻한", "심플한", "차분한"],
        promotionVisualStyle: ["파스텔 톤", "미니멀 그리드형", "라운드 형태의 요소"],
        promotionQualityNotes: ["모바일 썸네일 가독성 우선", "텍스트와 배경 대비 선명", "CTA 버튼 한눈에 읽히게"],
        promotionBackgroundDetails: ["부드러운 질감 배경", "텍스트 영역만 어둡게 오버레이"],
        promotionMandatoryElements: ["설문 주제", "소요 시간", "경품 혜택", "참여 링크(QR)"],
        promotionForbiddenElements: ["딱딱한 관공서 느낌", "정보 과밀 배치", "장문 문단"],
        promotionPosterKeyVisual: ["친근한 상징 아이콘", "심플한 그래픽"],
        promotionPosterInfoLayout: ["중앙 집중형", "정보 카드 1개로 묶기"],
        promotionSnsVisualFocus: ["CTA 버튼 중심 (선물 쿠폰 등)"],
        promotionSnsPlacementNotes: ["텍스트 블록 2개 이하 유지", "안전영역 침범 금지"],
      },
    },
    "training-info": {
      paletteId: "preset_corporate_blue",
      state: {
        contentType: "training-info",
        sizeMode: "ratio",
        ratio: "4:5",
        orientation: "vertical",
        directSizeUnit: "px",
        directSizeW: "",
        directSizeH: "",
        headline: "2026 미래 인재 스킬업: 데이터 분석 전문가 과정",
        subheadline: "실제 비즈니스 프로젝트로 배우는 전액 국비 지원 부트캠프 교육생 모집",
        bodyCopy: "- 교육 일정: 2026. 10. 12 ~ 12. 18 (10주)\n- 지원 자격: 미취업 청년 및 데이터 실무 스킬업 희망자\n- 혜택: 전액 무료 교육 + 매월 학습 장려금 30만원 지원\n- 접수 기한: 2026. 09. 25 까지",
        cta: "부트캠프 즉시 지원하기",
        posterOffer: "지원자 전원 기초 SQL 온라인 VOD 강의 및 커리큘럼 로드맵 무료 배포",
        snsHook: "비전공자도 가능합니다. 데이터 분석 실무형 인재로 도약하세요",
        snsHashtags: "#국비부트캠프 #데이터전문가 #무료교육",
      },
      quickFields: {
        promotionGoal: ["교육생 모집 및 신청 등록 유도"],
        promotionAudience: ["취업 준비생", "역량 강화 희망 실무자"],
        promotionTone: ["스마트한", "전문적인", "신뢰감 있는", "성장을 돕는"],
        promotionVisualStyle: ["인포그래픽형", "미니멀 그리드형", "정돈된 에디토리얼 레이아웃"],
        qualityNotes: ["커리큘럼 및 혜택 가독성 최우선", "모집 마감일 임팩트 강조", "타이포 가장자리 또렷하게"],
        promotionBackgroundDetails: ["은은한 그리드 패턴", "텍스트 영역만 어둡게 오버레이"],
        promotionMandatoryElements: ["교육 과정명", "교육 기간", "신청 자격", "접수 마감일", "교육 혜택(수강료 등)"],
        promotionForbiddenElements: ["복잡한 도표", "두꺼운 텍스트 외곽선", "어두운 무드"],
        promotionPosterKeyVisual: ["성장/배움을 상징하는 오브젝트", "단일 기하학 오브젝트"],
        promotionPosterInfoLayout: ["좌측 텍스트 강조, 우측 비주얼 배치", "상하단 레이아웃 분리"],
        promotionSnsVisualFocus: ["인물 반신과 큰 제목 중심"],
        promotionSnsPlacementNotes: ["상단 25% 훅 카피", "하단 CTA 버튼 영역 분리", "왼쪽 정렬축 유지"],
      },
    },
    "biz-promo": {
      paletteId: "preset_vibrant_energy",
      state: {
        contentType: "biz-promo",
        sizeMode: "ratio",
        ratio: "4:5",
        orientation: "vertical",
        directSizeUnit: "px",
        directSizeW: "",
        directSizeH: "",
        headline: "2026 유망 벤처기업 도약 패키지 지원사업",
        subheadline: "기술 상용화와 판로 개척을 위한 스케일업 자금 및 비즈니스 멘토링 연계",
        bodyCopy: "- 지원 대상: 창업 3년 이상 7년 미만의 혁신 성장 벤처기업\n- 지원 금액: 기업당 최대 1억 원 (사업화 자금)\n- 접수 기간: 2026. 08. 01 ~ 08. 25 18:00\n- 접수 방법: 정부 창업지원 포털 온라인 신청",
        cta: "사업 공고 및 제안서 접수",
        posterOffer: "온라인 설명회 영상 및 FAQ 가이드북 실시간 무료 다운로드 제공",
        snsHook: "혁신 벤처의 스케일업 파트너, 최대 1억원의 사업화 지원을 신청하세요",
        snsHashtags: "#지원사업 #스케일업 #창업지원",
      },
      quickFields: {
        promotionGoal: ["지원사업 모집 접수 및 파트너 발굴"],
        promotionAudience: ["기업 실무자", "예비 창업자", "스타트업 임직원"],
        promotionTone: ["전문적인", "신뢰감 있는", "세련된", "임팩트 있는"],
        promotionVisualStyle: ["3D 그래픽", "글래스모피즘", "브랜드 포스터형"],
        promotionQualityNotes: ["광고 이미지급 디테일", "브랜드 색상 정확도 유지", "CTA 버튼 한눈에 읽히게"],
        promotionBackgroundDetails: ["기하학적 3D 오브젝트", "추상적 그래픽"],
        promotionMandatoryElements: ["사업명", "지원 내용", "접수 기간", "신청 자격 및 방법", "주관 기관 로고"],
        promotionForbiddenElements: ["촌스러운 원색 배색", "저해상도 스톡 이미지", "정보 과밀 배치"],
        promotionPosterKeyVisual: ["기하학적 3D 오브젝트", "추상적 그래픽"],
        promotionPosterInfoLayout: ["Z자 흐름", "정보 카드 1개로 묶기"],
        promotionSnsVisualFocus: ["헤드라인과 CTA 이중 강조"],
        promotionSnsPlacementNotes: ["상단 25% 훅 카피", "하단 CTA 버튼 영역 분리", "헤드라인과 배경 대비 강하게"],
      },
    },
  };

  const UNIFIED_RANDOMIZABLE_PRESET_FIELDS = [
    "promotionGoal",
    "promotionAudience",
    "promotionTone",
    "promotionVisualStyle",
    "promotionQualityNotes",
    "promotionBackgroundDetails",
    "promotionForbiddenElements",
    "promotionPosterKeyVisual",
    "promotionPosterInfoLayout",
    "promotionSnsVisualFocus",
    "promotionSnsPlacementNotes",
  ];

  const COLOR_FIELD_IDS = [
    { stateKey: "primaryColor", inputId: "promotionPrimaryColor", pickerId: "promotionPrimaryColorPicker", swatchId: "promotionPrimaryColorSwatch" },
    { stateKey: "secondaryColor", inputId: "promotionSecondaryColor", pickerId: "promotionSecondaryColorPicker", swatchId: "promotionSecondaryColorSwatch" },
    { stateKey: "accentColor", inputId: "promotionAccentColor", pickerId: "promotionAccentColorPicker", swatchId: "promotionAccentColorSwatch" },
    { stateKey: "backgroundColor", inputId: "promotionBackgroundColor", pickerId: "promotionBackgroundColorPicker", swatchId: "promotionBackgroundColorSwatch" },
  ];

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isEnabled(value) {
    return String(value) === "true";
  }

  function trimValue(value) {
    return String(value || "").trim();
  }

  function uniqueValues(items) {
    const seen = new Set();
    return items.filter((item) => {
      const normalized = trimValue(item).toLowerCase();
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }

  function splitKeywordValues(value) {
    return uniqueValues(
      String(value || "")
        .split(/[\n,\/]/)
        .map((item) => item.trim())
        .filter(Boolean)
    );
  }

  function splitKeywordValuesRaw(value) {
    return String(value || "")
      .split(/[\n,\/]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function normalizePromptLineForDedupe(value) {
    return String(value || "")
      .replace(/^[-*]\s+/, "")
      .replace(/^\d+\.\s+/, "")
      .trim()
      .toLowerCase();
  }

  function normalizeQuickToken(value) {
    return trimValue(value).replace(/\s+/g, " ").toLowerCase();
  }

  function isQuickButtonMultiline(targetInput, currentValue = "", nextValue = "") {
    return (
      targetInput.tagName === "TEXTAREA" &&
      (String(currentValue || "").includes("\n") ||
        String(currentValue || "").includes("→") ||
        String(nextValue || "").includes("→"))
    );
  }

  function splitQuickButtonValues(value, targetInput, nextValue = "") {
    const raw = String(value || "").trim();
    if (!raw) return [];

    if (isQuickButtonMultiline(targetInput, raw, nextValue)) {
      return raw
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    // 퀵버튼 목록을 가져와 콤마 포함 토큰을 longest-match로 먼저 인식
    const knownTokens = targetInput
      ? getQuickButtonOptions(targetInput.id)
          .map((t) => trimValue(t))
          .filter((t) => t.includes(","))
          .sort((a, b) => b.length - a.length) // 긴 것부터 매칭
      : [];

    if (!knownTokens.length) {
      return raw.split(",").map((item) => item.trim()).filter(Boolean);
    }

    // 알려진 콤마 포함 토큰을 플레이스홀더로 치환 후 split
    const PLACEHOLDER_PREFIX = "\x00QTOK\x00";
    const placeholders = [];
    let working = raw;
    for (const token of knownTokens) {
      const idx = working.indexOf(token);
      if (idx === -1) continue;
      const ph = `${PLACEHOLDER_PREFIX}${placeholders.length}`;
      placeholders.push(token);
      working = working.slice(0, idx) + ph + working.slice(idx + token.length);
    }

    return working
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const m = item.match(new RegExp(`^${PLACEHOLDER_PREFIX}(\\d+)$`));
        return m ? placeholders[Number(m[1])] : item;
      });
  }

  function formatQuickButtonValues(values, targetInput, nextValue = "") {
    if (!values.length) return "";
    return isQuickButtonMultiline(targetInput, values.join("\n"), nextValue)
      ? values.join("\n")
      : values.join(", ");
  }

  function getFieldStateKeyFromInput(input) {
    if (!input) return "";
    if (input.dataset?.promoField) return input.dataset.promoField;
    const fallbackMap = {
      promotionBigIdea: "bigIdea",
      promotionVisualMetaphor: "visualMetaphor",
    };
    return fallbackMap[input.id] || "";
  }

  function hasQuickButtonValue(currentValue, nextValue, targetInput) {
    const normalizedNext = normalizeQuickToken(nextValue);
    if (!normalizedNext) return false;
    return splitQuickButtonValues(currentValue, targetInput, nextValue)
      .some((item) => normalizeQuickToken(item) === normalizedNext);
  }

  function toggleQuickButtonValue(currentValue, nextValue, targetInput) {
    const normalizedNext = normalizeQuickToken(nextValue);
    const values = splitQuickButtonValues(currentValue, targetInput, nextValue);
    const filtered = values.filter((item) => normalizeQuickToken(item) !== normalizedNext);

    if (filtered.length !== values.length) {
      return formatQuickButtonValues(filtered, targetInput, nextValue);
    }

    const maxCount = targetInput?.id === "promotionVisualStyle" ? 3 : Infinity;
    const nextValues = [...values, trimValue(nextValue)].slice(-maxCount);
    return formatQuickButtonValues(nextValues, targetInput, nextValue);
  }

  function syncQuickButtonStates(scope = root) {
    scope.querySelectorAll(".promo-quick-btns").forEach((container) => {
      const targetId = container.dataset.quickFor;
      const targetInput = $(targetId);
      if (!targetInput) return;

      container.querySelectorAll(".btn-quick").forEach((btn) => {
        const active = hasQuickButtonValue(targetInput.value, btn.textContent || "", targetInput);
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
    });
  }

  function getQuickButtonOptions(fieldId) {
    const container = root.querySelector(`.promo-quick-btns[data-quick-for="${fieldId}"]`);
    if (!container) return [];
    return Array.from(container.querySelectorAll(".btn-quick"))
      .map((btn) => trimValue(btn.textContent))
      .filter(Boolean);
  }

  function applyPaletteSnapshot(palette) {
    if (!palette) return;
    Object.entries(getCurrentPaletteSnapshot()).forEach(([key]) => {
      state[key] = String(palette[key] || "");
    });
    state.backgroundMode = String(palette.backgroundMode || "solid");
  }

  function findPaletteById(paletteId) {
    return colorPresets.find((preset) => preset.id === paletteId) || null;
  }

  function setPresetFieldValues(fieldId, requestedValues = []) {
    const input = $(fieldId);
    const stateKey = getFieldStateKeyFromInput(input);
    if (!input || !stateKey) return false;

    const options = getQuickButtonOptions(fieldId);
    if (!options.length) return false;

    const selectedValues = uniqueValues(
      requestedValues.length
        ? requestedValues.filter((value) => options.includes(value))
        : []
    );

    const fallbackValues = selectedValues.length ? selectedValues : [options[0]];
    let nextValue = "";
    fallbackValues.forEach((value) => {
      nextValue = toggleQuickButtonValue(nextValue, value, input);
    });

    input.value = nextValue;
    state[stateKey] = nextValue;
    return true;
  }

  function pickRandomSubset(options, minCount = 1, maxCount = 1) {
    if (!options.length) return [];
    const shuffled = [...options];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    const safeMin = Math.max(1, Math.min(minCount, shuffled.length));
    const safeMax = Math.max(safeMin, Math.min(maxCount, shuffled.length));
    const count = safeMin + Math.floor(Math.random() * (safeMax - safeMin + 1));
    return shuffled.slice(0, count);
  }

  function randomFieldSelectionCount(fieldId) {
    if (["promotionGoal", "promotionAudience"].includes(fieldId)) {
      return { min: 1, max: 1 };
    }
    if (fieldId === "promotionVisualStyle") {
      return { min: 1, max: 2 };
    }
    if (["promotionPosterKeyVisual", "promotionPosterInfoLayout", "promotionSnsVisualFocus"].includes(fieldId)) {
      return { min: 1, max: 2 };
    }
    if (fieldId === "promotionSnsPlacementNotes") {
      return { min: 2, max: 3 };
    }
    return { min: 2, max: 3 };
  }

  function normalizeBooleanSetting(value, fallback = "true") {
    if (String(value) === "true") return "true";
    if (String(value) === "false") return "false";
    return fallback;
  }

  function normalizeColorStrategy(value) {
    return value === "ai" ? "ai" : "manual";
  }

  function isAiColorStrategy() {
    return normalizeColorStrategy(state.colorStrategy) === "ai";
  }

  function normalizeOutputLanguage(value) {
    if (value === "en") return "en";
    if (value === "bi" || value === "bilingual") return "bilingual";
    return "ko";
  }

  function normalizeHexColor(value) {
    const raw = String(value || "").trim();
    const match = raw.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
    if (!match) return "";
    const hex = match[1].toLowerCase();
    if (hex.length === 3) {
      return `#${hex.split("").map((char) => char + char).join("")}`;
    }
    return `#${hex}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeLines(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function kindBadgeHtml(kind) {
    const meta = KIND_META[kind] || KIND_META.instruction;
    return `<span class="promo-field-badge ${meta.className}">${meta.label}</span>`;
  }

  function status(message, type = "info") {
    const node = $("promotionStatus");
    if (!node) return;
    node.textContent = message || "";
    node.className = `promo-status ${message ? `is-${type}` : ""}`.trim();
  }

  function attachStaticFieldBadges() {
    Object.entries(STATIC_FIELD_KINDS).forEach(([id, kind]) => {
      const label = root.querySelector(`label[for="${id}"]`);
      if (!label || label.querySelector(".promo-field-badge")) return;
      label.insertAdjacentHTML("beforeend", kindBadgeHtml(kind));
    });
  }

  function normalizePromotionState(rawState) {
    const next = deepClone(DEFAULT_STATE);
    const incoming = rawState && typeof rawState === "object" ? deepClone(rawState) : {};

    if (incoming.platform) {
      next.contentType = "none";
    }
    next.contentType = CONTENT_TYPE_VALUES.includes(incoming.contentType) ? incoming.contentType : DEFAULT_STATE.contentType;

    Object.keys(DEFAULT_STATE).forEach((key) => {
      if (incoming[key] !== undefined && incoming[key] !== null) {
        next[key] = String(incoming[key]);
      }
    });

    const legacyPxSizeProvided = String(incoming.sizePxW || "").trim() || String(incoming.sizePxH || "").trim();
    const legacyCmSizeProvided = String(incoming.sizeCmW || "").trim() || String(incoming.sizeCmH || "").trim();
    if (legacyPxSizeProvided || legacyCmSizeProvided) {
      next.sizeMode = "direct";
      if (legacyPxSizeProvided) {
        next.directSizeUnit = "px";
        next.directSizeW = String(incoming.sizePxW || "");
        next.directSizeH = String(incoming.sizePxH || "");
      } else {
        next.directSizeUnit = "cm";
        next.directSizeW = String(incoming.sizeCmW || "");
        next.directSizeH = String(incoming.sizeCmH || "");
      }
    }

    if (String(incoming.directSizeW || "").trim() || String(incoming.directSizeH || "").trim()) {
      next.sizeMode = "direct";
    }

    next.assetType = ASSET_TYPES.includes(incoming.assetType) ? incoming.assetType : DEFAULT_STATE.assetType;
    next.contentType = CONTENT_TYPE_VALUES.includes(next.contentType) ? next.contentType : DEFAULT_STATE.contentType;
    next.outputLanguage = normalizeOutputLanguage(incoming.outputLanguage || next.outputLanguage);
    next.promptMode = incoming.promptMode === "optimized" ? "optimized" : DEFAULT_STATE.promptMode;
    next.omitEmptyFields = normalizeBooleanSetting(incoming.omitEmptyFields, DEFAULT_STATE.omitEmptyFields);
    next.dedupePromptLines = normalizeBooleanSetting(incoming.dedupePromptLines, DEFAULT_STATE.dedupePromptLines);
    next.autoResolveConflicts = normalizeBooleanSetting(incoming.autoResolveConflicts, DEFAULT_STATE.autoResolveConflicts);
    next.commercialBaseline = ["off", "standard", "premium", "luxury"].includes(incoming.commercialBaseline)
      ? incoming.commercialBaseline
      : DEFAULT_STATE.commercialBaseline;
    next.creativityLevel = ["stable", "balanced", "experimental"].includes(incoming.creativityLevel)
      ? incoming.creativityLevel
      : DEFAULT_STATE.creativityLevel;
    next.colorStrategy = COLOR_STRATEGY_VALUES.includes(incoming.colorStrategy)
      ? incoming.colorStrategy
      : DEFAULT_STATE.colorStrategy;
    next.variationMode = ["none", "typo", "visual", "experimental"].includes(incoming.variationMode)
      ? incoming.variationMode
      : DEFAULT_STATE.variationMode;

    ["posterOffer", "snsHook", "snsHashtags", "cta"].forEach((field) => {
      const enabledKey = `${field}Enabled`;
      const modeKey = `${field}Mode`;
      next[enabledKey] = normalizeBooleanSetting(incoming[enabledKey], DEFAULT_STATE[enabledKey]);
      next[modeKey] = incoming[modeKey] === "manual" ? "manual" : DEFAULT_STATE[modeKey];
    });

    const validAntiAiIds = ANTI_AI_PRESETS.map((p) => p.id);
    next.antiAiStyle = validAntiAiIds.includes(incoming.antiAiStyle) ? incoming.antiAiStyle : "";

    next.sizeMode = incoming.sizeMode === "direct" ? "direct" : next.sizeMode;
    next.orientation = incoming.orientation === "horizontal" ? "horizontal" : DEFAULT_STATE.orientation;
    next.ratio = String(incoming.ratio || DEFAULT_STATE.ratio);
    next.directSizeUnit = incoming.directSizeUnit === "cm" ? "cm" : next.directSizeUnit;

    return next;
  }

  function assignState(nextState) {
    const normalized = normalizePromotionState(nextState);
    Object.keys(DEFAULT_STATE).forEach((key) => {
      state[key] = normalized[key];
    });
  }

  function applyAssetDefaults(assetType) {
    if (!ASSET_DEFAULTS[assetType]) return;
    Object.entries(ASSET_DEFAULTS[assetType]).forEach(([key, value]) => {
      state[key] = String(value);
    });
  }

  function getCurrentPaletteSnapshot() {
    return {
      primaryColor: state.primaryColor,
      secondaryColor: state.secondaryColor,
      accentColor: state.accentColor,
      backgroundMode: state.backgroundMode,
      backgroundColor: state.backgroundColor,
      backgroundDetails: state.backgroundDetails,
    };
  }

  function loadColorPresets() {
    try {
      const raw = localStorage.getItem(PROMOTION_COLOR_PRESETS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const savedPresets = Array.isArray(parsed) ? parsed.filter((item) => item && typeof item === "object" && !item.isDefault) : [];
      colorPresets = [...DEFAULT_COLOR_PRESETS, ...savedPresets];
    } catch (error) {
      colorPresets = [...DEFAULT_COLOR_PRESETS];
    }
  }

  function loadSizePresets() {
    try {
      const raw = localStorage.getItem(PROMOTION_SIZE_PRESETS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      sizePresets = Array.isArray(parsed) ? parsed.filter((p) => p && typeof p === "object") : [];
    } catch {
      sizePresets = [];
    }
  }

  function persistSizePresets() {
    try {
      localStorage.setItem(PROMOTION_SIZE_PRESETS_KEY, JSON.stringify(sizePresets));
    } catch { /* ignore */ }
  }

  function currentSizeSnapshot() {
    if (state.sizeMode === "direct") {
      return {
        sizeMode: "direct",
        directSizeUnit: state.directSizeUnit,
        directSizeW: state.directSizeW,
        directSizeH: state.directSizeH,
      };
    }
    return {
      sizeMode: "ratio",
      ratio: state.ratio,
      orientation: state.orientation,
    };
  }

  function sizeSnapshotLabel(snap) {
    if (snap.sizeMode === "direct") {
      return `${snap.directSizeW || "?"}×${snap.directSizeH || "?"} ${snap.directSizeUnit || "px"}`;
    }
    const orient = snap.orientation === "horizontal" ? "가로" : "세로";
    return `${snap.ratio} ${orient}`;
  }

  function applySizePreset(snap) {
    state.sizeMode = snap.sizeMode;
    if (snap.sizeMode === "direct") {
      state.directSizeUnit = snap.directSizeUnit || "px";
      state.directSizeW = snap.directSizeW || "";
      state.directSizeH = snap.directSizeH || "";
    } else {
      state.ratio = snap.ratio || "4:5";
      state.orientation = snap.orientation || "vertical";
    }
    syncStaticFields();
    renderPreview();
  }

  function renderSizePresetList() {
    const list = $("promotionSizePresetList");
    if (!list) return;
    if (sizePresets.length === 0) {
      list.innerHTML = `<span class="promo-size-preset-empty">저장된 규격 없음</span>`;
      return;
    }
    list.innerHTML = sizePresets.map((p, i) => `
      <div class="promo-size-preset-item">
        <button type="button" class="promo-size-preset-apply-btn" data-size-preset-index="${i}" title="${escapeHtml(sizeSnapshotLabel(p))}">
          <span class="promo-size-preset-item-name">${escapeHtml(p.name)}</span>
          <span class="promo-size-preset-item-desc">${escapeHtml(sizeSnapshotLabel(p))}</span>
        </button>
        <button type="button" class="promo-size-preset-delete-btn" data-size-preset-index="${i}" title="삭제">×</button>
      </div>
    `).join("");

    list.querySelectorAll(".promo-size-preset-apply-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.sizePresetIndex);
        if (sizePresets[idx]) applySizePreset(sizePresets[idx]);
      });
    });
    list.querySelectorAll(".promo-size-preset-delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.sizePresetIndex);
        sizePresets.splice(idx, 1);
        persistSizePresets();
        renderSizePresetList();
      });
    });
  }

  function bindSizePresetControls() {
    const saveBtn = $("promotionSizePresetSaveBtn");
    const saveRow = $("promotionSizePresetSaveRow");
    const nameInput = $("promotionSizePresetNameInput");
    const confirmBtn = $("promotionSizePresetConfirmBtn");
    const cancelBtn = $("promotionSizePresetCancelBtn");

    if (!saveBtn) return;

    saveBtn.addEventListener("click", () => {
      if (saveRow) saveRow.style.display = saveRow.style.display === "none" ? "" : "none";
      if (nameInput) {
        nameInput.value = sizeSnapshotLabel(currentSizeSnapshot());
        nameInput.focus();
        nameInput.select();
      }
    });

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        if (saveRow) saveRow.style.display = "none";
      });
    }

    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        const name = nameInput ? nameInput.value.trim() : "";
        if (!name) { if (nameInput) nameInput.focus(); return; }
        const snap = currentSizeSnapshot();
        sizePresets.push({ name, ...snap });
        persistSizePresets();
        renderSizePresetList();
        if (saveRow) saveRow.style.display = "none";
        status(`규격 "${name}" 저장됨`, "success");
      });
    }

    if (nameInput) {
      nameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") confirmBtn && confirmBtn.click();
        if (e.key === "Escape") cancelBtn && cancelBtn.click();
      });
    }
  }

  function persistColorPresets() {
    try {
      const savedPresets = colorPresets.filter(p => !p.isDefault);
      localStorage.setItem(PROMOTION_COLOR_PRESETS_KEY, JSON.stringify(savedPresets));
    } catch (error) {
      // Ignore storage failures and keep palette editing available.
    }
  }

  function renderColorPresetOptions() {
    const select = $("promotionPalettePresetSelect");
    if (!select) return;

    const currentValue = select.value;
    const defaults = colorPresets.filter(p => p.isDefault);
    const saved = colorPresets.filter(p => !p.isDefault);

    let html = '<option value="">팔레트 선택</option>';
    if (defaults.length) {
      html += `<optgroup label="기본 프리셋">
        ${defaults.map((preset) => `<option value="${escapeHtml(preset.id)}">${escapeHtml(preset.name)}</option>`).join("")}
      </optgroup>`;
    }
    if (saved.length) {
      html += `<optgroup label="저장된 팔레트">
        ${saved.map((preset) => `<option value="${escapeHtml(preset.id)}">${escapeHtml(preset.name || "이름 없는 팔레트")}</option>`).join("")}
      </optgroup>`;
    }
    select.innerHTML = html;

    if (currentValue && colorPresets.some((preset) => preset.id === currentValue)) {
      select.value = currentValue;
    }
  }

  function syncColorFieldUI() {
    const aiColorMode = isAiColorStrategy();
    const manualColorArea = $("promotionManualColorArea");
    const backgroundSection = $("promotionBackgroundSection");
    const backgroundColorRow = $("promotionBackgroundColorRow");

    if (manualColorArea) {
      manualColorArea.classList.toggle("is-disabled", aiColorMode);
      manualColorArea.setAttribute("aria-disabled", aiColorMode ? "true" : "false");
      manualColorArea.querySelectorAll("input, select, button").forEach((control) => {
        control.disabled = aiColorMode;
      });
    }

    if (backgroundSection) {
      backgroundSection.classList.toggle("is-disabled", aiColorMode);
      backgroundSection.setAttribute("aria-disabled", aiColorMode ? "true" : "false");
      backgroundSection.querySelectorAll("input, select, button, textarea").forEach((control) => {
        control.disabled = aiColorMode;
      });
    }

    if (backgroundColorRow) {
      backgroundColorRow.classList.toggle("is-disabled", aiColorMode);
      backgroundColorRow.setAttribute("aria-disabled", aiColorMode ? "true" : "false");
      backgroundColorRow.querySelectorAll("input").forEach((control) => {
        control.disabled = aiColorMode;
      });
    }

    COLOR_FIELD_IDS.forEach(({ inputId, pickerId, swatchId }) => {
      const input = $(inputId);
      const picker = $(pickerId);
      const swatch = $(swatchId);
      const normalizedHex = normalizeHexColor(input?.value);

      if (picker && normalizedHex && picker.value !== normalizedHex) {
        picker.value = normalizedHex;
      }
      if (swatch) {
        swatch.style.background = normalizedHex || "";
      }
    });
  }

  function persistDraft() {
    try {
      localStorage.setItem(
        PROMOTION_DRAFT_STORAGE_KEY,
        JSON.stringify({
          schemaVersion: PROMOTION_SCHEMA_VERSION,
          savedAt: new Date().toISOString(),
          promotionState: deepClone(state),
          promptDraft,
          promptDirty,
        })
      );
    } catch (error) {
      // Ignore storage failures and keep the tab usable.
    }
  }

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(PROMOTION_DRAFT_STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      assignState(parsed.promotionState || parsed);
      promptDraft = typeof parsed.promptDraft === "string" ? parsed.promptDraft : "";
      promptDirty = Boolean(parsed.promptDirty && promptDraft);
      return true;
    } catch (error) {
      return false;
    }
  }

  function isPositiveNumberText(value) {
    return /^\d+(\.\d+)?$/.test(String(value || "").trim()) && Number(value) > 0;
  }

  function validateDimensionPair(widthValue, heightValue, label, errors) {
    const width = String(widthValue || "").trim();
    const height = String(heightValue || "").trim();

    if (!width && !height) return;
    if (!width || !height) {
      errors.push(`${label}는 너비와 높이를 함께 입력해야 합니다.`);
      return;
    }
    if (!isPositiveNumberText(width) || !isPositiveNumberText(height)) {
      errors.push(`${label}는 0보다 큰 숫자로 입력해야 합니다.`);
    }
  }

  function formatRatio(width, height) {
    return `${width}:${height}`;
  }

  function getResolvedRatioLabel() {
    const orientation = getEffectiveOrientation();

    if (state.ratio === "custom") {
      const width = String(state.customRatioW || "").trim();
      const height = String(state.customRatioH || "").trim();
      if (!width || !height) return "사용자 정의 ?:?";
      return orientation === "horizontal"
        ? formatRatio(height, width)
        : formatRatio(width, height);
    }

    const raw = String(state.ratio || "").trim();
    if (!raw || !raw.includes(":")) return raw || "비율 미정";

    const [left, right] = raw.split(":").map((value) => value.trim());
    if (!left || !right) return raw;

    return orientation === "horizontal"
      ? formatRatio(right, left)
      : formatRatio(left, right);
  }

  function backgroundModeLabel(mode) {
    if (mode === "pattern") return "패턴 중심";
    if (mode === "image") return "배경 이미지 중심";
    if (mode === "mixed") return "혼합";
    return "배경색 중심";
  }

  function outputLanguageLabel() {
    if (state.outputLanguage === "en") return "영문";
    if (state.outputLanguage === "bilingual") return "병기";
    return "한글";
  }

  function promptModeLabel() {
    return state.promptMode === "optimized" ? "모델 최적화용" : "검토용";
  }

  const EN_TOKEN_MAP = {
    "포스터": "poster",
    "카드뉴스": "card news",
    "SNS 홍보이미지": "SNS promotion image",
    "행사 개최 안내": "event announcement",
    "공모사업 홍보": "contest promotion",
    "교육생 모집": "training recruitment",
    "수요조사 안내": "demand survey announcement",
    "설문조사 참여": "survey participation",
    "캠페인": "campaign",
    "성과홍보": "result promotion",
    "행사안내(참여요청)": "event announcement",
    "설문조사(참여요청)": "survey request",
    "교육안내(참여요청)": "training recruitment",
    "사업홍보(참여요청)": "business promotion",
    "직접 입력": "custom input",
    "크기 직접 입력": "exact size input",
    "비율 설정": "aspect ratio preset",
    "세로형": "vertical",
    "가로형": "horizontal",
    "컨텐츠 유형": "content template",
    "홍보 목적": "promotion goal",
    "핵심 타깃": "target audience",
    "헤드라인": "headline",
    "서브 카피": "sub copy",
    "본문 포인트": "body points",
    "브랜드 톤": "brand tone",
    "비주얼 스타일": "visual style",
    "품질 보정 지시": "quality refinements",
    "색상 전략": "color strategy",
    "색상/배경 전략": "color and background strategy",
    "상업 품질 기준": "commercial baseline",
    "창의성 강도": "creativity level",
    "Big Idea": "Big idea",
    "비주얼 은유": "visual metaphor",
    "메인 색상": "primary color",
    "보조 색상": "secondary color",
    "포인트 색상": "accent color",
    "배경 처리 방식": "background treatment",
    "배경 색상": "background color",
    "배경 패턴/이미지 지시": "background pattern/image guidance",
    "반드시 포함할 요소": "must-include elements",
    "피해야 할 요소": "elements to avoid",
    "없음": "Off",
    "스탠다드": "Standard",
    "프리미엄": "Premium",
    "럭셔리": "Luxury",
    "직접 지정": "Manual palette",
    "AI에게 맡기기": "AI-directed palette",
    "색상과 배경 모두 AI에게 맡기기": "Let AI direct both the color palette and the background",
    "안정형": "Stable",
    "균형형": "Balanced",
    "실험형": "Experimental",
    "연결": "connection",
    "돌파": "breakthrough",
    "신뢰": "trust",
    "전환": "conversion",
    "미래": "future",
    "참여": "participation",
    "속도": "speed",
    "성장": "growth",
    "변화": "change",
    "혁신": "innovation",
    "소통": "communication",
    "유리 큐브": "glass cube",
    "빛의 축": "light axis",
    "데이터 흐름": "data flow",
    "프레임 돌출": "frame breakout",
    "구조물 교차": "intersecting structures",
    "레이어 겹침": "layer overlap",
    "상승 곡선": "upward curve",
    "빛의 경로": "light path",
    "확산하는 물결": "expanding ripple",
    "맞물린 기어": "interlocking gears",
    "정렬된 큐브": "aligned cubes",
    "열린 프레임": "open frame",
    "겹치는 레이어": "overlapping layers",
    "행사 참가 신청 전환": "drive event sign-ups",
    "사전 등록 유도": "drive pre-registration",
    "브랜드 인지도 제고": "increase brand awareness",
    "이벤트 참여 유도": "drive event participation",
    "신규 서비스 관심 유도": "generate interest in a new service",
    "상담 문의 전환": "convert viewers into consultation inquiries",
    "캠페인 동참 및 대중 인식 확산": "drive campaign participation and public awareness",
    "주요 성과 발표 및 신뢰도 확보": "announce key outcomes and establish trust",
    "행사 개최 안내 및 참가 신청 유도": "announce event details and drive registrations",
    "설문 참여율 향상 및 의견 수집": "improve survey response rate and gather feedback",
    "교육생 모집 및 신청 등록 유도": "recruit trainees and drive course registrations",
    "지원사업 모집 접수 및 파트너 발굴": "recruit business partners and solicit project applications",
    "일반 대중": "general public",
    "잠재 참여자": "potential participants",
    "파트너사": "partner agencies",
    "일반 시민": "citizens",
    "주요 이해관계자": "key stakeholders",
    "신청 대상자": "target applicants",
    "유관 기관 실무자": "partner agency practitioners",
    "참여 희망자": "prospective attendees",
    "서비스 이용자": "service users",
    "설문 조사 대상 고객층": "survey target audience segments",
    "취업 준비생": "job seekers",
    "역량 강화 희망 실무자": "professionals seeking upskilling",
    "기업 실무자": "business practitioners",
    "예비 창업자": "aspiring founders",
    "스타트업 임직원": "startup employees",
    "20~30대 취업 준비생": "job seekers in their 20s and 30s",
    "MZ 직장인": "millennial and Gen Z professionals",
    "대학생 구직자": "university student job seekers",
    "중소기업 실무자": "SME practitioners",
    "국내외 기업 의사결정자": "domestic and global business decision-makers",
    "브랜드 관심 고객": "brand-interested customers",
    "브랜드명": "brand name",
    "행사명": "event title",
    "일정": "schedule",
    "장소": "location",
    "신청 링크": "registration link",
    "CTA 버튼": "CTA button",
    "로고": "logo",
    "QR코드 영역": "QR code area",
    "캠페인 슬로건": "campaign slogan",
    "참여 태그": "participation hashtags",
    "성과 타이틀": "performance title",
    "주요 수치 데이터": "key numeric data",
    "출처": "data source",
    "일시": "date and time",
    "신청 방법(QR/링크)": "application method (QR/link)",
    "주최/주관 로고": "organizer logo",
    "설문 주제": "survey topic",
    "소요 시간": "estimated duration",
    "경품 혜택": "reward details",
    "참여 링크(QR)": "participation link (QR)",
    "교육 과정명": "course title",
    "교육 기간": "training period",
    "신청 자격": "eligibility",
    "접수 마감일": "application deadline",
    "교육 혜택(수강료 등)": "program benefits (tuition details)",
    "사업명": "program title",
    "지원 내용": "support details",
    "접수 기간": "application period",
    "신청 자격 및 방법": "eligibility and method",
    "주관 기관 로고": "host agency logo",
    "20~30대 취업 준비생": "job seekers in their 20s and 30s",
    "MZ 직장인": "millennial and Gen Z professionals",
    "대학생 구직자": "university student job seekers",
    "중소기업 실무자": "SME practitioners",
    "국내외 기업 의사결정자": "domestic and global business decision-makers",
    "브랜드 관심 고객": "brand-interested customers",
    "브랜드명": "brand name",
    "행사명": "event title",
    "일정": "schedule",
    "장소": "location",
    "신청 링크": "registration link",
    "CTA 버튼": "CTA button",
    "로고": "logo",
    "QR코드 영역": "QR code area",
    "이모지 사용 금지": "no emoji usage",
    "과한 네온 효과": "avoid excessive neon effects",
    "두꺼운 텍스트 외곽선": "avoid thick text outlines",
    "장문 문단": "avoid long paragraphs",
    "저해상도 스톡 느낌": "avoid low-resolution stock-image look",
    "광택 CTA 버튼": "avoid glossy CTA buttons",
    "정보 과밀 배치": "avoid overcrowded information layout",
    "과한 색상 남용": "avoid excessive color usage",
    "장황한 텍스트": "wordy text",
    "흐릿한 배경 이미지": "blurry background imagery",
    "불명확한 CTA": "unclear CTA",
    "촌스러운 원색 그라데이션": "cheap primary-color gradients",
    "작은 수치 표기": "tiny numerical details",
    "올드한 스톡 이미지": "dated stock imagery",
    "복잡한 도표": "complex charts",
    "어두운 인물 사진": "dark portraits",
    "가독성 낮은 명조체 본문": "low-readability serif body text",
    "화려한 장식": "flashy decoration",
    "산만한 배경 패턴": "distracting background patterns",
    "이모지 과다 사용": "excessive emoji usage",
    "딱딱한 관공서 느낌": "rigid bureaucratic mood",
    "작은 본문 텍스트": "tiny body text",
    "복잡한 레이아웃": "cluttered layout",
    "고대비 가독성": "high-contrast readability",
    "행사 핵심 정보(일시/장소) 시각적 위계 강조": "strong visual hierarchy for key event information such as date and venue",
    "공모 주제의 상징성 부각": "emphasize the symbolic nature of the contest theme",
    "상금/혜택 수치를 큰 폰트로 강조": "highlight prize or benefit figures in large type",
    "커리큘럼 가독성 최우선": "curriculum readability comes first",
    "모집 마감일 임팩트 있게 처리": "make the recruitment deadline feel impactful",
    "인물 피부톤 자연스럽게": "keep skin tones natural",
    "조사 참여의 가치 강조": "emphasize the value of participating",
    "답변 소요 시간 명확히 표기": "clearly show the expected response time",
    "노이즈 없는 깨끗한 화면": "clean noise-free surface",
    "참여 버튼(CTA)을 버튼 형태로 강조": "present the CTA as a strong button",
    "모바일 환경 최적화 가독성": "optimize readability for mobile",
    "부드러운 조명 효과": "soft lighting effect",
    "메인 비주얼 포인트": "main visual focal point",
    "정보 배치 방식": "information layout",
    "한 줄 오퍼": "single-line offer",
    "카드 흐름": "card flow",
    "카드 수": "card count",
    "커버 카드 훅": "cover-card hook",
    "마지막 카드 CTA": "final-card CTA",
    "첫 줄 훅": "opening hook",
    "해시태그/태그": "hashtags/tags",
    "SNS 비주얼 중심 포인트": "SNS visual focal point",
    "배치 메모": "placement notes",
    "신뢰감": "trustworthy",
    "신뢰감 있는": "trustworthy",
    "모던함": "modern",
    "모던한": "modern",
    "역동적": "dynamic",
    "역동적인": "dynamic",
    "친근한": "friendly",
    "미니멀": "minimal",
    "미니멀한": "minimal",
    "전문적인": "professional",
    "고급스러운": "premium",
    "심플한": "clean and simple",
    "프리미엄": "premium",
    "스마트한": "smart",
    "따뜻한": "warm",
    "임팩트 있는": "impactful",
    "차분한": "calm",
    "세련된": "refined",
    "브랜드 광고 같은": "brand-advertising-like",
    "젊은 감각": "youthful",
    "실사 위주": "photo-real",
    "3D 그래픽": "3D graphics",
    "대담한 타이포": "bold typography",
    "대담한 타이포그래피": "bold typography",
    "네온 무드": "neon mood",
    "파스텔 톤": "pastel palette",
    "플랫 디자인": "flat design",
    "매거진 편집형": "editorial magazine layout",
    "브랜드 포스터형": "brand poster style",
    "인포그래픽형": "infographic style",
    "미니멀 그리드형": "minimal grid layout",
    "하이엔드 제품광고형": "high-end campaign advertising look",
    "캠페인 광고형": "campaign advertising look",
    "에디토리얼 광고형": "editorial advertising look",
    "데이터 중심 레이아웃": "data-led composition",
    "유리 카드형": "frosted glass card overlay, realistic blur and refraction in the glass layers, soft drop shadows below the card, crisp typography rendered on the glass",
    "입체 레이어형": "Z-depth layered composition, bold headline text partially wrapped behind foreground 3D elements, clean text separation, dramatic 3D pop-out effect",
    "페이퍼 콜라주형": "layered paper collage, overlapping physical card frames with subtle drop shadows, rich paper textures and edges, editorial layout",
    "광고 이미지급 디테일": "advertising-grade detail",
    "텍스트와 배경 대비 선명": "clear text-to-background contrast",
    "모바일 썸네일 가독성 우선": "mobile thumbnail readability first",
    "노이즈 없는 깨끗한 표면": "clean surfaces without noise",
    "타이포 가장자리 또렷하게": "crisp typography edges",
    "브랜드 색상 정확도 유지": "accurate brand color reproduction",
    "텍스트 외곽선 없이 선명하게": "clear typography without heavy outlines",
    "CTA 버튼 한눈에 읽히게": "make the CTA button readable at a glance",
    "인물과 배경 경계 또렷하게": "keep the subject-to-background edge crisp",
    "저해상도 스톡 느낌 금지": "avoid any low-resolution stock-image look",
    "배경색 중심": "solid color background",
    "패턴 중심": "pattern-led background",
    "배경 이미지 중심": "background-image-led composition",
    "혼합": "mixed background treatment",
    "딥 네이비 그라데이션 배경": "deep navy gradient background",
    "텍스트 영역만 어둡게 오버레이": "dark overlay only behind text areas",
    "현장 사진 흐림 처리 배경": "blurred on-site photo background",
    "추상 광원 오버레이": "abstract light-source overlay",
    "은은한 그리드 패턴": "subtle grid pattern",
    "기하학 라인 패턴": "geometric line pattern",
    "제품 질감 배경 이미지": "product-texture background image",
    "도시 야경 블러 배경": "blurred city-night background",
    "메탈 텍스처 배경": "metal-texture background",
    "그라데이션 배경 위 미세 노이즈": "micro-noise over a gradient background",
    "중앙 히어로 제품": "central hero product",
    "금속 질감 배경": "metallic-texture background",
    "기하학적 패턴": "geometric pattern",
    "인물 클로즈업": "portrait close-up",
    "자연 풍경": "natural landscape",
    "데이터 시각화": "data visualization",
    "추상적 그래픽": "abstract graphic",
    "오른쪽 인물, 왼쪽 헤드라인": "right-side subject with left-side headline",
    "오른쪽 인물": "right-side subject",
    "왼쪽 헤드라인": "left-side headline",
    "대형 헤드라인과 단일 오브젝트": "large headline with a single object",
    "상단 타이포, 하단 정보 카드": "top typography with a bottom information card",
    "상단 타이포": "top typography",
    "하단 정보 카드": "bottom information card",
    "좌측 텍스트 강조, 우측 비주얼 배치": "text-heavy left side with visuals on the right",
    "좌측 텍스트 강조": "text-heavy left side",
    "우측 비주얼 배치": "visuals on the right",
    "상단 헤드라인 고정": "headline locked at the top",
    "중앙 집중형": "center-weighted layout",
    "그리드 분할": "grid-based split layout",
    "하단 정보 박스 일체형": "single bottom information box",
    "상단 훅, 중단 핵심, 하단 CTA": "top hook, middle key message, bottom CTA",
    "상단 훅": "top hook",
    "중단 핵심": "middle key message",
    "하단 CTA": "bottom CTA",
    "Z자 흐름": "Z-flow layout",
    "여백 강조": "whitespace-emphasis layout",
    "좌측 정렬축 통일": "unified left alignment axis",
    "정보 카드 1개로 묶기": "group the details into one information card",
    "문제 인식 → 핵심 데이터 → 해결안 → CTA": "problem awareness → key data → solution → CTA",
    "질문 → 오해 바로잡기 → 사례 → CTA": "question → myth-busting → case study → CTA",
    "혜택 요약 → 세부 포인트 → 일정 → CTA": "benefit summary → detail points → schedule → CTA",
    "후킹 문장 → 핵심 사실 3개 → 신청 안내": "hook line → three key facts → registration guide",
    "공감 문제 제시 → 전환 포인트 → 행동 유도": "pain-point empathy → turning point → action prompt",
    "제품 중심": "product-centered",
    "인물 중심": "people-centered",
    "타이포 중심": "typography-centered",
    "정보카드 중심": "information-card-centered",
    "배경 무드 중심": "background-mood-centered",
    "CTA 버튼 중심": "CTA-button-centered",
    "헤드라인과 CTA 이중 강조": "dual emphasis on headline and CTA",
    "인물 반신과 큰 제목 중심": "half-body subject with a large headline",
    "상단 25% 훅 카피": "hook copy in the top 25%",
    "중앙 비주얼 중심": "visuals centered in the middle",
    "하단 CTA 버튼 영역 분리": "separate bottom CTA-button area",
    "안전영역 침범 금지": "do not intrude into the safe area",
    "좌측 상단 로고 고정": "logo fixed at the top left",
    "우측 하단 CTA 배지": "CTA badge at the bottom right",
    "텍스트 블록 2개 이하 유지": "keep text blocks to two or fewer",
    "스티커/링크 영역과 12% 이상 간격": "keep at least 12% spacing from sticker/link areas",
    "스티커": "sticker",
    "링크 영역과 12% 이상 간격": "keep at least 12% spacing from link areas",
    "헤드라인과 배경 대비 강하게": "keep strong contrast between headline and background",
    "썸네일 축소 시도 가독성 유지": "maintain readability even at thumbnail size",
    "상하단 UI 영역 피해 배치": "avoid top and bottom UI areas",
    "왼쪽 정렬축 유지": "maintain a left alignment axis",
    "미니멀 톤과 본문 포인트 과다 설정이 함께 있어 레이아웃이 복잡해질 수 있습니다.": "The minimal tone and the high number of body points may make the layout feel cluttered.",
    "플랫 디자인과 광택/글로시 지시가 함께 들어가 있습니다.": "Flat-design direction and glossy instructions are being used together.",
    "해시태그 제외 규칙과 해시태그 직접 입력이 동시에 존재합니다.": "A hashtag exclusion rule and direct hashtag input are both present.",
    "동일하거나 유사한 스타일 지시가 반복되어 있습니다.": "Identical or overlapping style instructions are repeated.",
    "직접 노출 텍스트가 많습니다. 핵심 문구만 남기면 이미지 품질이 더 좋아집니다.": "There is a lot of on-image text. Reducing it to only the essential copy will improve image quality.",
    "금지 규칙에 `이모지 사용 금지`를 유지하는 것을 권장합니다.": "Keep `no emoji usage` in the forbidden rules.",
    "빈 항목 자동 제거가 켜져 있어 미입력 문구는 최종 프롬프트에서 제외됩니다.": "Empty-field removal is enabled, so unfilled items are excluded from the final prompt.",
    "설계 지시가 많아 모델 집중도가 떨어질 수 있습니다. 우선순위가 낮은 항목은 줄이는 것이 좋습니다.": "There are many design instructions, which may reduce model focus. Consider trimming lower-priority items.",
    "헤드라인을 입력해야 프롬프트를 복사할 수 있습니다.": "Add a headline before copying the prompt.",
    "홍보 목적을 입력해야 메시지 방향이 분명해집니다.": "Add a promotion goal to make the message direction clearer.",
    "직접 입력 비율을 사용할 때는 너비와 높이를 모두 숫자로 입력해야 합니다.": "When using a custom ratio, both width and height must be numeric values.",
    "크기 직접 입력 방식을 선택했다면 실제 너비와 높이를 입력해야 합니다.": "If exact-size input is selected, enter the actual width and height.",
    "포스터는 메인 비주얼 포인트를 적어두면 결과 품질이 더 안정적입니다.": "Poster prompts are more stable when the main visual focal point is specified.",
    "포스터는 정보 배치 방식을 적어두면 위계가 덜 흔들립니다.": "Poster hierarchy is more stable when the information layout is specified.",
    "카드뉴스 카드 수는 3장 이상 10장 이하로 설정하세요.": "Set the card-news card count between 3 and 10.",
    "카드뉴스는 카드 흐름을 적어두면 장별 메시지 연결이 좋아집니다.": "Card-news prompts work better when the card flow is defined.",
    "SNS 이미지는 첫 줄 훅이 있으면 시선 유도가 훨씬 쉬워집니다.": "SNS images guide attention more effectively when an opening hook is present.",
    "SNS는 안전영역이나 CTA 위치 메모를 남기면 플랫폼별 잘림 위험을 줄일 수 있습니다.": "For SNS formats, adding safe-area or CTA placement notes reduces platform-specific cropping risk.",

    // Step 3 Visual Option Groups & Idea Presets translations
    "전문적": "professional",
    "따뜻함": "warm",
    "활기": "vibrant",
    "차분함": "calm",
    "긍정적": "positive",
    "미래지향": "future-oriented",
    "절제된": "restrained",
    "연결": "connectivity",
    "성장": "growth",
    "참여": "engagement",
    "전환": "conversion",
    "기회": "opportunity",
    "신뢰": "trust",
    "빛의 경로": "path of light",
    "열린 문": "open door",
    "상승 곡선": "ascending curve",
    "연결된 카드": "connected cards",
    "투명한 큐브": "transparent cube",
    "중심으로 모이는 흐름": "converging flow to the center",
    "안정적인 중심축과 정돈된 정보 카드": "stable central axis and structured information cards",
    "상승 곡선과 빛의 경로": "ascending curve and path of light",
    "여러 카드와 경로가 하나의 중심으로 연결되는 장면": "multiple cards and paths connecting to a single center",
    "빛이 통과하는 투명한 큐브와 넓은 여백": "transparent cube with light passing through and ample whitespace",
    "실사 중심": "photo-real focus",
    "미니멀 정보형": "minimal information layout",
    "3D 오브젝트": "3D objects",
    "플랫 일러스트": "flat illustration",
    "아이소메트릭": "isometric",
    "데이터 시각화형": "data visualization",
    "콜라주형": "collage style",
    "제품 광고형": "product advertising style",
    "공공 안내형": "public announcement style",
    "매거진 커버형": "magazine cover style",
    "모션 그래픽 느낌": "motion graphics feel",
    "따뜻한 캐릭터형": "warm character-led style",
    "하이엔드 캠페인형": "high-end campaign look",
    "포토그래픽 포스터형": "photographic poster style",

    // Additional Template Presets translations
    "고급스러운 질감 배경": "premium textured background",
    "헤드라인과 핵심 문구 중심": "focus on headline and key copy",
    "불명확한 수치 표기": "unclear numeric representation",
    "정보카드 중심 (수치 및 인포그래픽)": "focus on information card (metrics and infographics)",
    "장황한 본문": "wordy body copy",
    "흐릿한 인물 사진": "blurry human photographs",
    "가독성 낮은 폰트": "low-readability fonts",
    "모바일 썸네일 축소 시 가독성 유지": "maintain readability when scaled down to mobile thumbnail",
    "라운드 형태의 요소": "rounded design elements",
    "부드러운 질감 배경": "soft textured background",
    "친근한 상징 아이콘": "friendly symbolic icon",
    "심플한 그래픽": "simple graphics",
    "CTA 버튼 중심 (선물 쿠폰 등)": "focus on CTA button (gift coupons, etc.)",
    "정돈된 에디토리얼 레이아웃": "structured editorial layout",
    "커리큘럼 및 혜택 가독성 최우선": "highest priority on curriculum and benefit readability",
    "모집 마감일 임팩트 강조": "emphasize recruitment deadline with high impact",
    "성장/배움을 상징하는 오브젝트": "object symbolizing growth and learning",
    "단일 기하학 오브젝트": "single geometric object",
    "상하단 레이아웃 분리": "separated top and bottom layout",
    "글래스모피즘": "glassmorphism",
    "기하학적 3D 오브젝트": "geometric 3D object",
    "촌스러운 원색 배색": "cheap primary-color schemes",
    "좌측 정렬축 유지": "maintain left alignment axis",
    "QR코드를 사용하려면 연결 주소를 입력하는 편이 좋습니다. 주소가 없으면 프롬프트에는 QR 자리만 배정됩니다.": "To use a QR code, it is recommended to enter a target URL. Without one, only a placeholder area will be reserved in the prompt.",
    "QR코드 연결 주소는 http:// 또는 https://로 시작하는 전체 URL을 권장합니다.": "QR code target URL should ideally be a full URL starting with http:// or https://.",
  };

  function translateFragment(value) {
    const raw = trimValue(value);
    if (!raw) return "";
    if (EN_TOKEN_MAP[raw]) return EN_TOKEN_MAP[raw];

    const cardCountMatch = raw.match(/^(\d+)장$/);
    if (cardCountMatch) {
      return `${cardCountMatch[1]} cards`;
    }

    const pairedDimensionMessage = raw.match(/^(.*)는 너비와 높이를 함께 입력해야 합니다\.$/);
    if (pairedDimensionMessage) {
      return `${translateFragment(pairedDimensionMessage[1])} requires both width and height.`;
    }

    const positiveNumberMessage = raw.match(/^(.*)는 0보다 큰 숫자로 입력해야 합니다\.$/);
    if (positiveNumberMessage) {
      return `${translateFragment(positiveNumberMessage[1])} must use numbers greater than 0.`;
    }

    const assetEntry = Object.entries(ASSET_LABELS).find(([, label]) => label === raw);
    if (assetEntry) return ASSET_LABELS_EN[assetEntry[0]] || raw;

    const fieldEntry = Object.entries(FIELD_LABELS).find(([, label]) => label === raw);
    if (fieldEntry) return FIELD_LABELS_EN[fieldEntry[0]] || raw;

    for (const typeKey of Object.keys(CONTENT_TYPE_TEMPLATES)) {
      const template = CONTENT_TYPE_TEMPLATES[typeKey];
      const templateEn = CONTENT_TYPE_TEMPLATES_EN[typeKey] || {};
      for (const fieldKey of Object.keys(template)) {
        if (template[fieldKey] === raw && templateEn[fieldKey]) {
          return templateEn[fieldKey];
        }
      }
    }

    const parts = raw.split(/(\s*\/\s*|,\s*|\n+)/);
    if (parts.length > 1) {
      return parts
        .map((part) => {
          if (!part.trim()) return part;
          if (/^\s*\/\s*$|,\s*|\n+/.test(part)) return part;
          return translateFragment(part.trim());
        })
        .join("");
    }

    return raw;
  }

  function localizeValue(value) {
    const raw = trimValue(value);
    if (!raw) return "";
    if (state.outputLanguage === "ko") return raw;
    const translated = translateFragment(raw);
    if (state.outputLanguage === "en") return translated;
    if (translated === raw) return raw;
    return `${raw} (${translated})`;
  }

  function localizeHeading(ko, en) {
    if (state.outputLanguage === "en") return en;
    if (state.outputLanguage === "bilingual") return `${ko} / ${en}`;
    return ko;
  }

  function localizeSentence(ko, en) {
    if (state.outputLanguage === "en") return en;
    if (state.outputLanguage === "bilingual") return `${ko} / ${en}`;
    return ko;
  }

  function getDefaultQualityTagLines() {
    const ko = DEFAULT_QUALITY_TAGS.ko;
    const en = DEFAULT_QUALITY_TAGS.en;
    if (state.outputLanguage === "en") return [...en];
    if (state.outputLanguage === "bilingual") {
      return ko.map((item, i) => `${item} / ${en[i] || item}`);
    }
    return [...ko];
  }

  const SYSTEM_QUALITY_PHRASES = new Set([
    "텍스트 가장자리 선명",
    "텍스트 가장자리 또렷함",
    "타이포 가장자리 또렷하게",
    "작은 글자 번짐 방지",
    "저해상도 픽셀 깨짐 방지",
    "픽셀 깨짐 없음",
    "노이즈 없는 깨끗한 표면",
    "인물 얼굴 왜곡 방지",
    "손가락·로고 형태 왜곡 방지",
    "손가락 및 로고 형태 왜곡 방지",
    "제품 윤곽선 선명",
    "과한 합성 광택 방지",
    "스톡 이미지 같은 질감 방지",
    "과한 광원·네온 번짐·렌즈 플레어 방지",
    "장난감 같은 3D 오브젝트와 가짜 홀로그램 금지",
    "실사 합성의 원근·스케일·그림자·색온도 일관성 유지",
    "외부 프레임 없는 단일 완성 이미지",
    "광고 이미지급 디테일",
    "광고 이미지급 고해상도 품질",
    "텍스트와 배경 대비 선명",
    "썸네일 축소 시에도 핵심 문구 가독성 유지",
    "모바일 썸네일 가독성 우선",
    "저해상도 스톡 느낌 금지",
    "이모지 사용 금지",
    "광택 CTA 버튼 금지",
    "광택 CTA 버튼",
    "crisp typography edges",
    "crisp text edges",
    "prevent small text blurring",
    "no pixelation",
    "clean noise-free surfaces",
    "prevent face distortion",
    "prevent hand and logo distortion",
    "sharp product contours",
    "avoid over-rendered synthetic gloss",
    "avoid cheap stock photo appearance",
    "avoid excessive lighting effects, neon bloom, and lens flare",
    "no toy-like 3D objects or fake holograms",
    "keep photorealistic compositing consistent in perspective, scale, shadows, and color temperature",
    "single finished image with no outer frame",
    "advertising-grade detail",
    "advertising-grade high-resolution quality",
    "strong text-to-background contrast",
    "headline legible at thumbnail size",
    "no emoji usage",
    "glossy action buttons",
    "low-resolution stock appearance"
  ]);

  function isSystemQualityPhrase(phrase) {
    const normalized = phrase.toLowerCase().replace(/[\s·.,]/g, "");
    for (const sys of SYSTEM_QUALITY_PHRASES) {
      const sysNormalized = sys.toLowerCase().replace(/[\s·.,]/g, "");
      if (normalized === sysNormalized || normalized.includes(sysNormalized) || sysNormalized.includes(normalized)) {
        return true;
      }
    }
    return false;
  }

  function splitQualityNoteLines(value) {
    return uniqueValues(
      String(value || "")
        .split(/[\r\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean)
        .filter((item) => !isSystemQualityPhrase(item))
    );
  }

  function sanitizeStateValues() {
    Object.keys(state).forEach((key) => {
      if (typeof state[key] === "string") {
        if (key === "bodyCopy" || key === "subheadline" || key === "mandatoryElements" || key === "forbiddenElements" || key.endsWith("Notes") || key.endsWith("Flow") || key === "snsHashtags") {
          state[key] = normalizeLines(state[key]).join("\n");
        } else {
          state[key] = trimValue(state[key]);
        }
      }
    });
  }

  function detectPromptLint(validation, textEntries, instructionItems) {
    const conflicts = [];
    const duplicates = [];
    const notes = [];

    const toneTokens = splitKeywordValues(state.tone);
    const styleTokens = splitKeywordValues(state.visualStyle);
    const forbiddenTokens = splitKeywordValues(state.forbiddenElements);
    const bodyLines = normalizeLines(state.bodyCopy);

    if (toneTokens.includes("미니멀") && bodyLines.length > 3) {
      conflicts.push("미니멀 톤과 본문 포인트 과다 설정이 함께 있어 레이아웃이 복잡해질 수 있습니다.");
    }
    if (styleTokens.includes("플랫 디자인") && /광택|glossy/i.test(state.qualityNotes)) {
      conflicts.push("플랫 디자인과 광택/글로시 지시가 함께 들어가 있습니다.");
    }
    if (/해시태그/.test(state.forbiddenElements) && trimValue(state.snsHashtags)) {
      conflicts.push("해시태그 제외 규칙과 해시태그 직접 입력이 동시에 존재합니다.");
    }

    const duplicateCandidateValues = [
      state.tone,
      state.visualStyle,
      state.qualityNotes,
      state.backgroundDetails,
      state.snsPlacementNotes,
    ];
    duplicateCandidateValues.forEach((value) => {
      const tokens = splitKeywordValuesRaw(value);
      if (tokens.length !== uniqueValues(tokens).length) {
        duplicates.push("동일하거나 유사한 스타일 지시가 반복되어 있습니다.");
      }
    });

    if (textEntries.length > 7) {
      notes.push("직접 노출 텍스트가 많습니다. 핵심 문구만 남기면 이미지 품질이 더 좋아집니다.");
    }
    if (!forbiddenTokens.includes("이모지 사용 금지")) {
      notes.push("금지 규칙에 `이모지 사용 금지`를 유지하는 것을 권장합니다.");
    }
    if (state.commercialBaseline === "off") {
      notes.push("상업 품질 기준이 꺼져 있어 결과물이 무난한 안내 이미지처럼 보일 수 있습니다.");
    }
    if (!trimValue(state.bigIdea) && !trimValue(state.visualMetaphor) && state.creativityLevel !== "stable") {
      notes.push("창의성 강도를 높였지만 Big Idea 또는 비주얼 은유가 없어 결과 방향이 평범해질 수 있습니다.");
    }
    if (state.variationMode === "none" && state.creativityLevel !== "stable") {
      notes.push("다양성 변형 지시가 꺼져 있어 결과가 기본 템플릿형으로 반복될 수 있습니다. 타이포/비주얼/실험적 중 하나를 선택하면 결과 폭이 넓어집니다.");
    }
    if (trimValue(state.visualStyle) && !trimValue(state.bigIdea) && !trimValue(state.visualMetaphor)) {
      notes.push("스타일 지시는 충분하지만 상징 개념이 비어 있어 결과가 템플릿형으로 흐를 수 있습니다.");
    }
    if (validation.errors.length === 0 && isEnabled(state.omitEmptyFields)) {
      notes.push("빈 항목 자동 제거가 켜져 있어 미입력 문구는 최종 프롬프트에서 제외됩니다.");
    }
    if (instructionItems.length > 12) {
      notes.push("설계 지시가 많아 모델 집중도가 떨어질 수 있습니다. 우선순위가 낮은 항목은 줄이는 것이 좋습니다.");
    }

    return {
      conflicts: uniqueValues(conflicts),
      duplicates: uniqueValues(duplicates),
      notes: uniqueValues(notes),
      summary: [
        `언어: ${outputLanguageLabel()}`,
        `출력 모드: ${promptModeLabel()}`,
        `상업 품질 기준: ${COMMERCIAL_BASELINE_PROFILES[state.commercialBaseline]?.labelKo || state.commercialBaseline}`,
        `창의성 강도: ${CREATIVITY_LEVEL_PROFILES[state.creativityLevel]?.labelKo || state.creativityLevel}`,
        isEnabled(state.omitEmptyFields) ? "빈 항목 제거 사용" : "빈 항목 유지",
        isEnabled(state.dedupePromptLines) ? "중복 제거 사용" : "중복 제거 미사용",
        isEnabled(state.autoResolveConflicts) ? "충돌 자동 정리 사용" : "충돌 자동 정리 미사용",
      ],
    };
  }

  function renderLintPanel(lint) {
    const node = $("promotionLintPanel");
    if (!node) return;
    const metricsNode = $("promotionLintMetrics");
    const badgeNode = $("promotionLintBadge");
    const listNode = $("promotionLintList");
    const summaryNode = $("promotionOptimizationSummary");
    const optimizationStateNode = $("promotionOptimizationState");

    if (optimizationStateNode) {
      optimizationStateNode.textContent = `${promptModeLabel()} · ${outputLanguageLabel()}`;
    }

    if (metricsNode) {
      metricsNode.innerHTML = [
        `<span class="promo-lint-chip is-neutral">${escapeHtml(ASSET_LABELS[state.assetType])}</span>`,
        `<span class="promo-lint-chip is-info">언어: ${escapeHtml(outputLanguageLabel())}</span>`,
        `<span class="promo-lint-chip is-info">모드: ${escapeHtml(promptModeLabel())}</span>`,
      ].join("");
    }

    if (badgeNode) {
      const badgeText = lint.conflicts.length
        ? "검토 필요"
        : lint.duplicates.length
          ? "중복 정리"
          : lint.notes.length
            ? "최적화 힌트"
            : "Lint clean";
      badgeNode.textContent = badgeText;
    }

    if (listNode) {
      const reviewItems = [
        ...lint.conflicts.map((item) => ({ text: item, className: "is-warning" })),
        ...lint.duplicates.map((item) => ({ text: item, className: "is-warning" })),
        ...lint.notes.map((item) => ({ text: item, className: "is-info" })),
      ];

      listNode.innerHTML = reviewItems.length
        ? reviewItems
            .map((item) => `<div class="promo-lint-item ${item.className}">${escapeHtml(item.text)}</div>`)
            .join("")
        : `<div class="promo-lint-item is-neutral">현재 추가 lint 항목이 없습니다.</div>`;
    }

    if (summaryNode) {
      const summaryItems = [
        ...lint.summary.map((item) => ({ text: item, className: "is-info" })),
        ...(lint.conflicts.length
          ? [{ text: "상충 항목은 하드 제약 또는 스타일 지시를 우선순위에 따라 다시 정리하세요.", className: "is-warning" }]
          : []),
        ...(!lint.conflicts.length && !lint.duplicates.length && !lint.notes.length
          ? [{ text: "현재 프롬프트 초안은 중복과 충돌 없이 비교적 정리된 상태입니다.", className: "is-neutral" }]
          : []),
      ];

      summaryNode.innerHTML = summaryItems
        .map((item) => `<div class="promo-lint-item ${item.className}">${escapeHtml(item.text)}</div>`)
        .join("");
    }
  }

  function validateState() {
    const errors = [];
    const warnings = [];
    const fieldErrors = {};
    const fieldWarnings = {};

    function addError(fieldKey, message) {
      errors.push(message);
      if (!fieldErrors[fieldKey]) fieldErrors[fieldKey] = [];
      fieldErrors[fieldKey].push(message);
    }

    function addWarning(fieldKey, message) {
      warnings.push(message);
      if (!fieldWarnings[fieldKey]) fieldWarnings[fieldKey] = [];
      fieldWarnings[fieldKey].push(message);
    }

    if (!String(state.headline || "").trim()) {
      addError("headline", "헤드라인을 입력해야 프롬프트를 복사할 수 있습니다.");
    }
    if (!String(state.goal || "").trim()) {
      addError("goal", "홍보 목적을 입력해야 메시지 방향이 분명해집니다.");
    }

    if (state.sizeMode === "ratio") {
      if (state.ratio === "custom") {
        if (!isPositiveNumberText(state.customRatioW) || !isPositiveNumberText(state.customRatioH)) {
          addError("customRatio", "직접 입력 비율을 사용할 때는 너비와 높이를 모두 숫자로 입력해야 합니다.");
        }
      }
    } else {
      const sizeErrors = [];
      validateDimensionPair(
        state.directSizeW,
        state.directSizeH,
        `직접 입력 크기(${state.directSizeUnit})`,
        sizeErrors
      );
      if (sizeErrors.length) {
        sizeErrors.forEach(err => addError("directSize", err));
      }
      if (!String(state.directSizeW || "").trim() && !String(state.directSizeH || "").trim()) {
        addError("directSize", "크기 직접 입력 방식을 선택했다면 실제 너비와 높이를 입력해야 합니다.");
      }
    }

    if (state.assetType === "poster" || state.assetType === "image") {
      if (isEnabled(state.posterKeyVisualEnabled) && !String(state.posterKeyVisual || "").trim()) {
        addWarning("posterKeyVisual", "포스터는 메인 비주얼 포인트를 적어두면 결과 품질이 더 안정적입니다.");
      }
      if (isEnabled(state.posterInfoLayoutEnabled) && !String(state.posterInfoLayout || "").trim()) {
        addWarning("posterInfoLayout", "포스터는 정보 배치 방식을 적어두면 위계가 덜 흔들립니다.");
      }
    }

    if (state.assetType === "cardnews") {
      const cardCount = Number(state.cardnewsCardCount);
      if (!Number.isInteger(cardCount) || cardCount < 3 || cardCount > 10) {
        addError("cardnewsCardCount", "카드뉴스 카드 수는 3장 이상 10장 이하로 설정하세요.");
      }
      if (!String(state.cardnewsFlow || "").trim()) {
        addWarning("cardnewsFlow", "카드뉴스는 카드 흐름을 적어두면 장별 메시지 연결이 좋아집니다.");
      }
    }

    if (state.assetType === "sns") {
      if (!String(state.snsHook || "").trim()) {
        addWarning("snsHook", "SNS 이미지는 첫 줄 훅이 있으면 시선 유도가 훨씬 쉬워집니다.");
      }
      if (isEnabled(state.snsPlacementNotesEnabled) && !String(state.snsPlacementNotes || "").trim()) {
        addWarning("snsPlacementNotes", "SNS는 안전영역이나 CTA 위치 메모를 남기면 플랫폼별 잘림 위험을 줄일 수 있습니다.");
      }
    }

    if (isEnabled(state.qrEnabled)) {
      const qrUrl = String(state.qrUrl || "").trim();
      if (!qrUrl) {
        addWarning("qrUrl", "QR코드를 사용하려면 연결 주소를 입력하는 편이 좋습니다. 주소가 없으면 프롬프트에는 QR 자리만 배정됩니다.");
      } else if (!/^https?:\/\//i.test(qrUrl)) {
        addWarning("qrUrl", "QR코드 연결 주소는 http:// 또는 https://로 시작하는 전체 URL을 권장합니다.");
      }
    }

    // 텍스트 과부하로 인한 AI 보수적 레이아웃 회귀 방지 경보
    const headlineLen = String(state.headline || "").trim().length;
    if (headlineLen > 25) {
      addWarning("headline", `헤드라인이 깁니다(${headlineLen}자). 텍스트가 너무 길면 이미지 생성 AI가 가독성을 위해 단조롭고 뻔한 레이아웃을 선택합니다. 20자 이하로 압축하시는 것을 권장합니다.`);
    }

    const bodyCopyLen = String(state.bodyCopy || "").trim().length;
    if (bodyCopyLen > 80) {
      addWarning("bodyCopy", `본문 텍스트가 깁니다(${bodyCopyLen}자). 정보량이 너무 많으면 이미지 구도가 답답한 카드 뉴스 형태로 고정됩니다. 핵심 혜택 위주로 80자 이내 요약 작성을 권장합니다.`);
    }

    return { errors, warnings, fieldErrors, fieldWarnings };
  }

  function renderValidation(validation) {
    const node = $("promotionValidation");
    if (!node) return;

    if (!validation.errors.length && !validation.warnings.length) {
      node.innerHTML = `
        <div class="promo-validation-item is-ok">
          <strong>${localizeSentence("입력 상태 양호", "All Inputs Valid")}</strong>
          <span>${localizeSentence("현재 입력으로 프롬프트를 복사하거나 설정을 저장할 수 있습니다.", "You can now copy the prompt or save your configuration with the current inputs.")}</span>
        </div>
      `;
      updateFieldWarningsUI(validation);
      return;
    }

    const blocks = [];
    if (validation.errors.length) {
      blocks.push(`
        <div class="promo-validation-item is-error">
          <strong>${localizeSentence("보완이 필요한 항목", "Required Fixes")}</strong>
          <span>${validation.errors.map((item) => escapeHtml(localizeValue(item))).join("<br />")}</span>
        </div>
      `);
    }
    if (validation.warnings.length) {
      blocks.push(`
        <div class="promo-validation-item is-warning">
          <strong>${localizeSentence("품질 개선 힌트", "Quality Improvement Hints")}</strong>
          <span>${validation.warnings.map((item) => escapeHtml(localizeValue(item))).join("<br />")}</span>
        </div>
      `);
    }

    node.innerHTML = blocks.join("");
    updateFieldWarningsUI(validation);
  }

  // ⚠️ 경고 아이콘 표시 및 모달 품질 개선 안내 가이드 핵심 제어기
  const FIELD_DOM_INFO = {
    headline: { id: "promotionHeadline" },
    goal: { id: "promotionGoal" },
    audience: { id: "promotionAudience" },
    subheadline: { id: "promotionSubheadline" },
    bodyCopy: { id: "promotionBodyCopy" },
    cta: { id: "promotionCta" },
    qrUrl: { id: "promotionQrUrl" },
    customRatio: { id: "promotionCustomRatioW" },
    directSize: { id: "promotionDirectSizeW" },
    posterKeyVisual: { id: "promotionPosterKeyVisual" },
    posterInfoLayout: { id: "promotionPosterInfoLayout" },
    cardnewsFlow: { id: "promotionCardFlow" },
    cardnewsCardCount: { id: "promotionCardCount" },
    snsHook: { id: "promotionSnsHook" },
    snsPlacementNotes: { id: "promotionSnsPlacementNotes" }
  };

  function updateFieldWarningsUI(validation) {
    const { fieldErrors = {}, fieldWarnings = {} } = validation;

    // 1. 기존의 경고 트리거들을 전부 지웁니다.
    root.querySelectorAll(".promo-warning-trigger").forEach(el => el.remove());

    // 2. 에러와 경고를 필드 키별로 통합합니다.
    const mergedWarnings = {};
    for (const [key, msgs] of Object.entries(fieldErrors)) {
      if (!mergedWarnings[key]) mergedWarnings[key] = [];
      mergedWarnings[key].push(...msgs);
    }
    for (const [key, msgs] of Object.entries(fieldWarnings)) {
      if (!mergedWarnings[key]) mergedWarnings[key] = [];
      mergedWarnings[key].push(...msgs);
    }

    // 3. 대상 필드별로 경고 아이콘을 라벨 우측에 삽입합니다.
    for (const [fieldKey, messages] of Object.entries(mergedWarnings)) {
      const info = FIELD_DOM_INFO[fieldKey];
      if (!info) continue;

      const inputNode = $(info.id);
      if (!inputNode) continue;

      const groupNode = inputNode.closest(".gen-config-group, .promo-action-choice-card, .promo-qr-url-wrap");
      if (!groupNode) continue;

      const labelNode = groupNode.querySelector(".gen-config-label");
      if (!labelNode) continue;

      // 이미 추가되어 있는 지 확인하고 없으면 신규 삽입
      if (!labelNode.querySelector(`.promo-warning-trigger[data-warning-field="${fieldKey}"]`)) {
        const trigger = document.createElement("span");
        trigger.className = "promo-warning-trigger";
        trigger.dataset.warningField = fieldKey;
        trigger.innerHTML = "⚠️";
        trigger.title = "품질 개선 가이드 확인";

        // 클릭 시 모달 노출 및 전파 방지
        trigger.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          showWarningModal(fieldKey, messages);
        });

        labelNode.appendChild(trigger);
      }
    }
  }

  function showWarningModal(fieldKey, messages) {
    const modal = $("promotionWarningModal");
    const body = $("promotionWarningModalBody");
    const title = $("promotionWarningModalTitle");
    if (!modal || !body || !title) return;

    const labels = {
      headline: "헤드라인 설계 피드백",
      goal: "홍보 목적 설정 피드백",
      customRatio: "직접 비율 설정 피드백",
      directSize: "직접 크기 설정 피드백",
      posterKeyVisual: "메인 비주얼 포인트 피드백",
      posterInfoLayout: "정보 배치 방식 피드백",
      cardnewsFlow: "카드 흐름 설계 피드백",
      cardnewsCardCount: "카드 수 설정 피드백",
      snsHook: "SNS 첫 줄 훅 피드백",
      snsPlacementNotes: "SNS 배치 메모 피드백",
      qrUrl: "QR 연결 주소 피드백",
      bodyCopy: "본문 텍스트 품질 피드백"
    };
    title.textContent = labels[fieldKey] || "품질 개선 가이드";

    let html = `<div style="margin-bottom: 12px; font-weight: 700; color: #d35400;">⚠️ 발견된 보완 권장사항:</div>`;
    html += `<ul style="margin: 0 0 16px 20px; padding: 0; list-style-type: disc;">`;
    messages.forEach(msg => {
      html += `<li style="margin-bottom: 8px; color: var(--ink);">${escapeHtml(msg)}</li>`;
    });
    html += `</ul>`;

    const tips = {
      headline: `<strong>💡 레이아웃 품질 향상 팁:</strong>헤드라인 글자수가 20자를 넘어가면 이미지 생성 AI가 가독성 확보를 위해 글자를 아주 크게 깔고 배경을 밋밋하게 미는 단조로운 템플릿 레이아웃으로 회귀합니다.<br/>글자수를 최대한 <strong>20자 이하</strong>로 줄이면, AI가 남는 공간에 훨씬 깊이감 있고 세련된 비주얼을 배치할 여유를 가지게 됩니다.`,

      bodyCopy: `<strong>💡 레이아웃 품질 향상 팁:</strong>본문 텍스트 줄수가 많고 길어지면(80자 이상) 화면 전체가 글자로 꽉 차서 밋밋한 카드뉴스 레이아웃에 갇힙니다.<br/>정보들을 최대한 <strong>핵심 혜택 위주로 요약</strong>하여 입력하면 여백이 넓어지고, AI가 다채로운 이미지 레이어와 텍스트를 유기적으로 합성하여 완성도 높은 광고 컷을 생성합니다.`,

      posterKeyVisual: `<strong>💡 비주얼 은유 팁:</strong>단순한 계단이나 화살표 같은 상투적이고 투박한 오브젝트 대신, '구체적인 공간과 빛의 무드(예: Cinematic dramatic light casting through a modern digital terminal)'를 명시하면 AI가 훨씬 사실적이고 상업 화보급으로 고급스럽게 그려냅니다.`,

      posterInfoLayout: `<strong>💡 배치 합성 팁:</strong>정보가 카드 박스 안에 갇혀서 단편화되지 않도록 하려면 'seamless background blending' 혹은 'non-isolated multi-layered split layout'처럼 이미지가 배경 텍스트와 하나의 레이어로 자연스럽게 오버랩되도록 서술해 보세요.`
    };

    if (tips[fieldKey]) {
      html += `
        <div class="promo-warning-modal-tip">
          ${tips[fieldKey]}
        </div>
      `;
    }

    body.innerHTML = html;
    modal.removeAttribute("hidden");
    document.body.classList.add("modal-open");
  }

  function hideWarningModal() {
    const modal = $("promotionWarningModal");
    if (modal) {
      modal.setAttribute("hidden", "");
    }
    document.body.classList.remove("modal-open");
  }

  function bindWarningModalEvents() {
    $("promotionWarningModalCloseBtn")?.addEventListener("click", hideWarningModal);
    $("promotionWarningModalConfirmBtn")?.addEventListener("click", hideWarningModal);
    $("promotionWarningModalBackdrop")?.addEventListener("click", hideWarningModal);
  }


  function renderControl(field) {
    const fieldId = field.domId || `promotionField_${field.key}`;
    const value = state[field.key] ?? "";
    let html = "";

    if (field.quickBtns && field.quickBtns.length) {
      html += `
        <div class="promo-quick-btns" data-quick-for="${fieldId}">
          ${field.quickBtns.map((btn) => `<button type="button" class="btn-quick">${escapeHtml(btn)}</button>`).join("")}
        </div>
      `;
    }

    if (field.tag === "textarea") {
      html += `
        <textarea
          id="${fieldId}"
          class="gen-textarea"
          rows="${field.rows || 4}"
          data-promo-field="${field.key}"
          placeholder="${escapeHtml(field.placeholder || "")}"
        >${escapeHtml(value)}</textarea>
      `;
    } else if (field.tag === "select") {
      const options = (field.options || [])
        .map((option) => {
          const selected = option.value === value ? " selected" : "";
          return `<option value="${escapeHtml(option.value)}"${selected}>${escapeHtml(option.label)}</option>`;
        })
        .join("");
      html += `<select id="${fieldId}" class="gen-select" data-promo-field="${field.key}">${options}</select>`;
    } else {
      html += `
        <input
          id="${fieldId}"
          class="gen-input-text"
          type="text"
          data-promo-field="${field.key}"
          value="${escapeHtml(value)}"
          placeholder="${escapeHtml(field.placeholder || "")}"
        />
      `;
    }

    return html;
  }

  function renderAiToggleHeader(fieldKey) {
    const enabledKey = `${fieldKey}Enabled`;
    const modeKey = `${fieldKey}Mode`;
    const enabled = isEnabled(state[enabledKey]);
    const isAi = state[modeKey] !== "manual";
    return `
      <div class="promo-ai-toggle-header">
        <label class="promo-ai-toggle-switch" title="사용 여부">
          <input type="checkbox" class="promo-ai-toggle-enabled" data-toggle-field="${fieldKey}"${enabled ? " checked" : ""} />
          <span class="promo-ai-toggle-track"></span>
        </label>
        <div class="promo-ai-mode-btns${enabled ? "" : " disabled"}">
          <button type="button" class="promo-ai-mode-btn${isAi ? " active" : ""}" data-toggle-mode="${fieldKey}" data-mode="ai"${enabled ? "" : " disabled"}>AI 자동</button>
          <button type="button" class="promo-ai-mode-btn${!isAi ? " active" : ""}" data-toggle-mode="${fieldKey}" data-mode="manual"${enabled ? "" : " disabled"}>직접 입력</button>
        </div>
      </div>
    `;
  }

  function renderFieldEnableHeader(fieldKey) {
    const enabled = isEnabled(state[`${fieldKey}Enabled`]);
    return `
      <div class="promo-ai-toggle-header">
        <label class="promo-ai-toggle-switch" title="사용 여부">
          <input type="checkbox" class="promo-field-toggle-enabled" data-field-toggle="${fieldKey}"${enabled ? " checked" : ""} />
          <span class="promo-ai-toggle-track"></span>
        </label>
      </div>
    `;
  }

  function renderTypeFields() {
    const host = $("promotionTypeFields");
    if (!host) return;

    const fields = TYPE_FIELD_DEFS[state.assetType] || [];
    host.innerHTML = `
      <div class="gen-config-fields">
        ${fields
          .map((field) => {
            const wideClass = field.wide ? " gen-config-group-wide" : "";
            const fieldId = field.domId || `promotionField_${field.key}`;
            const hasToggle = AI_TOGGLE_FIELDS.has(field.key);
            const hasEnableToggle = FIELD_ENABLE_TOGGLE_FIELDS.has(field.key);
            const enabled = (hasToggle || hasEnableToggle) ? isEnabled(state[`${field.key}Enabled`]) : true;
            const isAiMode = hasToggle && state[`${field.key}Mode`] !== "manual";
            const inputDisabled = (hasToggle && (!enabled || isAiMode)) || (hasEnableToggle && !enabled);
            return `
              <section class="gen-config-group${wideClass}${(hasToggle || hasEnableToggle) && !enabled ? " promo-field-disabled" : ""}">
                <div class="gen-config-label-row">
                  <label class="gen-config-label" for="${fieldId}">
                    ${escapeHtml(field.label)}
                    ${kindBadgeHtml(field.kind)}
                  </label>
                  ${hasToggle ? renderAiToggleHeader(field.key) : hasEnableToggle ? renderFieldEnableHeader(field.key) : ""}
                </div>
                <p class="gen-config-guide">${escapeHtml(field.guide || "")}</p>
                ${inputDisabled ? `<div class="promo-ai-placeholder">${isAiMode ? "AI가 자동으로 생성합니다" : "사용 안 함"}</div>` : renderControl(field)}
              </section>
            `;
          })
          .join("")}
      </div>
    `;

    bindFieldInputs(host);
    bindQuickButtons(host);
    syncQuickButtonStates(host);
    bindAiToggleControls(host);
    bindFieldEnableControls(host);
  }

  const STATIC_TOGGLE_SYNC = {
    cta: () => syncCtaToggleUI(),
    posterOffer: () => syncPosterOfferToggleUI(),
    snsHook: () => syncSnsHookToggleUI(),
    snsHashtags: () => syncSnsHashtagsToggleUI(),
    tone: () => syncToggleFieldUI("tone"),
    bigIdea: () => syncToggleFieldUI("bigIdea"),
    visualMetaphor: () => syncToggleFieldUI("visualMetaphor"),
    visualStyle: () => syncToggleFieldUI("visualStyle"),
    layoutComposition: () => syncToggleFieldUI("layoutComposition"),
  };

  function bindAiToggleControls(scope) {
    scope.querySelectorAll(".promo-ai-toggle-enabled").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const field = checkbox.dataset.toggleField;
        state[`${field}Enabled`] = String(checkbox.checked);
        if (STATIC_TOGGLE_SYNC[field]) {
          STATIC_TOGGLE_SYNC[field]();
        } else {
          renderTypeFields();
        }
        renderPreview();
      });
    });

    scope.querySelectorAll("[data-toggle-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const field = btn.dataset.toggleMode;
        state[`${field}Mode`] = btn.dataset.mode;
        if (STATIC_TOGGLE_SYNC[field]) {
          STATIC_TOGGLE_SYNC[field]();
        } else {
          renderTypeFields();
        }
        renderPreview();
      });
    });
  }

  function bindFieldEnableControls(scope) {
    scope.querySelectorAll("[data-field-toggle]").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const field = checkbox.dataset.fieldToggle;
        state[`${field}Enabled`] = String(checkbox.checked);
        renderTypeFields();
        renderPreview();
      });
    });
  }

  function bindFieldInputs(scope) {
    scope.querySelectorAll("[data-promo-field]").forEach((input) => {
      const handler = () => {
        state[input.dataset.promoField] = input.type === "checkbox" ? String(input.checked) : input.value;
        if (input.id === "promotionContentType") {
          applyContentTypeTemplate(input.value);
        }
        if (
          input.id === "promotionRatio" ||
          input.id === "promotionSizeMode" ||
          input.id === "promotionDirectSizeUnit" ||
          input.id === "promotionDirectSizeW" ||
          input.id === "promotionDirectSizeH" ||
          input.id === "promotionCustomRatioW" ||
          input.id === "promotionCustomRatioH" ||
          input.id === "promotionOrientation"
        ) {
          syncSizeModeUI();
        }
        if (input.id === "promotionQrEnabled" || input.id === "promotionQrUrl") {
          syncQrCodeUI();
        }
        if (
          input.id === "promotionColorStrategy" ||
          input.id === "promotionPrimaryColor" ||
          input.id === "promotionSecondaryColor" ||
          input.id === "promotionAccentColor" ||
          input.id === "promotionBackgroundColor"
        ) {
          syncColorFieldUI();
        }
        renderPreview();
      };
      input.addEventListener("input", handler);
      input.addEventListener("change", handler);
    });
  }

  function bindColorPickers() {
    COLOR_FIELD_IDS.forEach(({ stateKey, inputId, pickerId }) => {
      const input = $(inputId);
      const picker = $(pickerId);
      if (!input || !picker) return;

      picker.addEventListener("change", () => {
        input.value = picker.value;
        state[stateKey] = picker.value;
        syncColorFieldUI();
        renderPreview();
      });
    });
  }

  function bindColorClearButtons() {
    root.querySelectorAll("[data-color-clear-target]").forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.dataset.colorClearTarget;
        const input = $(targetId);
        if (!input) return;

        input.value = "";
        const stateKey = input.dataset?.promoField;
        if (stateKey) {
          state[stateKey] = "";
        }

        syncColorFieldUI();
        renderPreview();
      });
    });
  }

  function applyContentTypeTemplate(type) {
    if (!CONTENT_TYPE_VALUES.includes(type)) return;
    state.contentType = type;
    const profile = CONTENT_TYPE_SAMPLE_PROFILES[type] || CONTENT_TYPE_SAMPLE_PROFILES.none;
    const template = CONTENT_TYPE_TEMPLATES[type];

    applySampleProfile(profile);

    if (!template) {
      status("직접 입력 템플릿 예시를 자동으로 적용했습니다.", "info");
      return;
    }

    status(`'${template.name}' 템플릿 예시를 자동으로 적용했습니다.`, "success");
  }

  function bindTemplateCards() {
    root.querySelectorAll("[data-promo-content-type]").forEach((button) => {
      button.addEventListener("click", () => {
        applyContentTypeTemplate(button.dataset.promoContentType);
      });
    });
  }

  function bindOptimizationControls() {
    const selectBindings = [
      { id: "promotionOutputLanguage", stateKey: "outputLanguage", normalize: normalizeOutputLanguage },
      { id: "promotionPromptMode", stateKey: "promptMode", normalize: (value) => value === "optimized" ? "optimized" : "review" },
      { id: "promotionCommercialBaseline", stateKey: "commercialBaseline", normalize: (value) => ["off", "standard", "premium", "luxury"].includes(value) ? value : DEFAULT_STATE.commercialBaseline },
      { id: "promotionCreativityLevel", stateKey: "creativityLevel", normalize: (value) => ["stable", "balanced", "experimental"].includes(value) ? value : DEFAULT_STATE.creativityLevel },
    ];

    selectBindings.forEach(({ id, stateKey, normalize }) => {
      const input = $(id);
      if (!input) return;
      input.addEventListener("change", () => {
        state[stateKey] = normalize(input.value);
        syncStaticFields();
        renderPreview();
      });
    });

    [
      { id: "promotionOmitEmptyFields", stateKey: "omitEmptyFields" },
      { id: "promotionDedupePromptLines", stateKey: "dedupePromptLines" },
      { id: "promotionAutoResolveConflicts", stateKey: "autoResolveConflicts" },
    ].forEach(({ id, stateKey }) => {
      const input = $(id);
      if (!input) return;
      input.addEventListener("change", () => {
        state[stateKey] = String(input.checked);
        renderPreview();
      });
    });

    document.querySelectorAll("[data-promo-variation]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.variationMode = btn.dataset.promoVariation;
        document.querySelectorAll("[data-promo-variation]").forEach((b) => {
          const active = b.dataset.promoVariation === state.variationMode;
          b.classList.toggle("active", active);
          b.setAttribute("aria-pressed", String(active));
        });
        renderPreview();
      });
    });

    root.querySelectorAll("[data-promo-commercial-baseline]").forEach((button) => {
      if (button.tagName !== "BUTTON") return;
      button.addEventListener("click", () => {
        state.commercialBaseline = ["off", "standard", "premium", "luxury"].includes(button.dataset.promoCommercialBaseline)
          ? button.dataset.promoCommercialBaseline
          : DEFAULT_STATE.commercialBaseline;
        syncStaticFields();
        renderPreview();
      });
    });

    root.querySelectorAll("[data-promo-creativity-level]").forEach((button) => {
      if (button.tagName !== "BUTTON") return;
      button.addEventListener("click", () => {
        state.creativityLevel = ["stable", "balanced", "experimental"].includes(button.dataset.promoCreativityLevel)
          ? button.dataset.promoCreativityLevel
          : DEFAULT_STATE.creativityLevel;
        syncStaticFields();
        renderPreview();
      });
    });

    [
      { id: "promotionBigIdea", stateKey: "bigIdea" },
      { id: "promotionVisualMetaphor", stateKey: "visualMetaphor" },
    ].forEach(({ id, stateKey }) => {
      const input = $(id);
      if (!input) return;
      const handler = () => {
        state[stateKey] = input.value;
        renderPreview();
      };
      input.addEventListener("input", handler);
      input.addEventListener("change", handler);
    });

    root.querySelectorAll("[data-promo-output-language]").forEach((button) => {
      if (button.tagName !== "BUTTON") return;
      button.addEventListener("click", () => {
        state.outputLanguage = normalizeOutputLanguage(button.dataset.promoOutputLanguage);
        syncStaticFields();
        renderPreview();
      });
    });

    root.querySelectorAll("[data-promo-prompt-mode]").forEach((button) => {
      if (button.tagName !== "BUTTON") return;
      button.addEventListener("click", () => {
        state.promptMode = button.dataset.promoPromptMode === "optimized" ? "optimized" : "review";
        syncStaticFields();
        renderPreview();
      });
    });
    bindAiToggleControls(root);
  }

  function syncAntiAiPresetUI() {
    const container = root.querySelector(".anti-ai-preset-btns");
    if (!container) return;
    container.querySelectorAll(".anti-ai-preset-btn").forEach((button) => {
      const isSelected = button.dataset.antiAiPreset === state.antiAiStyle;
      button.classList.toggle("active", isSelected);
      button.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });

    const badge = $("antiAiActiveBadge");
    if (badge) {
      const activePreset = ANTI_AI_PRESETS.find((p) => p.id === state.antiAiStyle);
      if (activePreset && state.antiAiStyle !== "general") {
        badge.textContent = activePreset.labelKo;
        badge.style.display = "";
      } else {
        badge.style.display = "none";
      }
    }
  }

  function pruneEmptyFields() {
    sanitizeStateValues();
    state.omitEmptyFields = "true";
    promptDirty = false;
    renderPreview();
    status("빈 항목 제거 기준으로 프롬프트를 다시 정리했습니다.", "success");
  }

  function resetTextFields() {
    [
      "headline",
      "subheadline",
      "bodyCopy",
      "cta",
      "mandatoryElements",
      "posterOffer",
      "snsHook",
      "snsHashtags",
    ].forEach((key) => {
      if (key in state) state[key] = "";
    });
    promptDirty = false;
    syncStaticFields();
    renderPreview();
    status("직접 노출 텍스트 항목을 초기화했습니다.", "info");
  }

  function resetStyleFields() {
    [
      "tone",
      "visualStyle",
      "qualityNotes",
      "bigIdea",
      "visualMetaphor",
      "posterKeyVisual",
      "posterInfoLayout",
      "snsVisualFocus",
      "snsPlacementNotes",
      "backgroundDetails",
      "forbiddenElements",
    ].forEach((key) => {
      if (key in state) state[key] = key === "forbiddenElements" ? DEFAULT_STATE.forbiddenElements : "";
    });
    state.commercialBaseline = DEFAULT_STATE.commercialBaseline;
    state.creativityLevel = DEFAULT_STATE.creativityLevel;
    state.variationMode = DEFAULT_STATE.variationMode;
    state.posterKeyVisualEnabled = DEFAULT_STATE.posterKeyVisualEnabled;
    state.posterInfoLayoutEnabled = DEFAULT_STATE.posterInfoLayoutEnabled;
    state.snsVisualFocusEnabled = DEFAULT_STATE.snsVisualFocusEnabled;
    state.snsPlacementNotesEnabled = DEFAULT_STATE.snsPlacementNotesEnabled;
    state.backgroundMode = "solid";
    promptDirty = false;
    syncStaticFields();
    renderPreview();
    status("스타일/연출 지시를 초기화했습니다.", "info");
  }

  function resetColorFields() {
    ["primaryColor", "secondaryColor", "accentColor", "backgroundColor", "backgroundDetails"].forEach((key) => {
      if (key in state) state[key] = "";
    });
    state.backgroundMode = "solid";
    promptDirty = false;
    syncStaticFields();
    renderPreview();
    status("색상과 배경 설정을 초기화했습니다.", "info");
  }

  function reapplyCurrentTemplate() {
    applyContentTypeTemplate(state.contentType);
  }

  function rerunOptimization() {
    sanitizeStateValues();
    promptDirty = false;
    renderPreview();
    status("현재 설정으로 프롬프트 최적화를 다시 실행했습니다.", "success");
  }

  function saveCurrentPalettePreset() {
    const nameInput = $("promotionPalettePresetName");
    const presetName = String(nameInput?.value || "").trim();
    if (!presetName) {
      status("팔레트 저장 전 이름을 입력하세요.", "error");
      return;
    }

    const preset = {
      id: `palette_${Date.now()}`,
      name: presetName,
      ...getCurrentPaletteSnapshot(),
    };

    colorPresets.push(preset);
    persistColorPresets();
    renderColorPresetOptions();
    if (nameInput) nameInput.value = "";
    const select = $("promotionPalettePresetSelect");
    if (select) select.value = preset.id;
    applySelectedPalettePreset({ silent: true });
    status("현재 색상 팔레트를 저장했습니다.", "success");
  }

  function applySelectedPalettePreset(options = {}) {
    const select = $("promotionPalettePresetSelect");
    const presetId = select?.value;
    const shouldNotify = !options.silent;
    if (!presetId) {
      if (!shouldNotify) return;
      status("적용할 색상 팔레트를 먼저 선택하세요.", "error");
      return;
    }

    const preset = colorPresets.find((item) => item.id === presetId);
    if (!preset) {
      if (!shouldNotify) return;
      status("선택한 색상 팔레트를 찾을 수 없습니다.", "error");
      return;
    }

    Object.entries(getCurrentPaletteSnapshot()).forEach(([key]) => {
      state[key] = String(preset[key] || "");
    });
    state.backgroundMode = String(preset.backgroundMode || "solid");
    syncStaticFields();
    syncColorFieldUI();
    renderPreview();
    if (!shouldNotify) return;
    status("선택한 색상 팔레트를 적용했습니다.", "success");
  }

  function deleteSelectedPalettePreset() {
    const select = $("promotionPalettePresetSelect");
    const presetId = select?.value;
    if (!presetId) {
      status("삭제할 색상 팔레트를 먼저 선택하세요.", "error");
      return;
    }

    const preset = colorPresets.find(p => p.id === presetId);
    if (preset && preset.isDefault) {
      status("기본 프리셋은 삭제할 수 없습니다.", "error");
      return;
    }

    const nextPresets = colorPresets.filter((item) => item.id !== presetId);
    if (nextPresets.length === colorPresets.length) {
      status("선택한 색상 팔레트를 찾을 수 없습니다.", "error");
      return;
    }

    colorPresets = nextPresets;
    persistColorPresets();
    renderColorPresetOptions();
    if (select) select.value = "";
    status("선택한 색상 팔레트를 삭제했습니다.", "info");
  }

  function bindQuickButtons(scope) {
    scope.querySelectorAll(".promo-quick-btns").forEach((container) => {
      const targetId = container.dataset.quickFor;
      const targetInput = $(targetId);
      if (!targetInput) return;

      container.querySelectorAll(".btn-quick").forEach((btn) => {
        btn.addEventListener("click", () => {
          const value = btn.textContent || "";
          targetInput.value = toggleQuickButtonValue(targetInput.value, value, targetInput);
          const stateKey = getFieldStateKeyFromInput(targetInput);
          if (stateKey) {
            state[stateKey] = targetInput.value;
          }
          syncQuickButtonStates(scope);
          renderPreview();
        });
      });
    });
  }

  function getEffectiveOrientation() {
    if (state.sizeMode === "direct" && isPositiveNumberText(state.directSizeW) && isPositiveNumberText(state.directSizeH)) {
      return Number(state.directSizeW) >= Number(state.directSizeH) ? "horizontal" : "vertical";
    }
    return state.orientation;
  }

  function getSpecificationSummary() {
    if (state.sizeMode === "direct") {
      const width = String(state.directSizeW || "").trim();
      const height = String(state.directSizeH || "").trim();
      return width || height ? `${width || "?"}×${height || "?"} ${state.directSizeUnit}` : "직접 크기 미입력";
    }

    if (state.ratio === "custom") {
      return `사용자 정의 ${getResolvedRatioLabel()}`;
    }

    return getResolvedRatioLabel();
  }

  function getPromptSpecificationSummary() {
    if (state.sizeMode === "direct") {
      const width = String(state.directSizeW || "").trim();
      const height = String(state.directSizeH || "").trim();
      if (width || height) {
        return `${width || "?"}×${height || "?"} ${state.directSizeUnit}`;
      }
      return localizeSentence("직접 크기 미입력", "exact size not specified");
    }

    if (state.ratio === "custom") {
      return localizeSentence(`사용자 정의 ${getResolvedRatioLabel()}`, `custom ${getResolvedRatioLabel()}`);
    }

    return getResolvedRatioLabel();
  }

  function toPositiveNumber(value) {
    const number = Number(String(value || "").replace(/,/g, "").trim());
    return Number.isFinite(number) && number > 0 ? number : 0;
  }

  function parseRatioLabel(label) {
    const parts = String(label || "")
      .split(":")
      .map((value) => toPositiveNumber(value));
    return parts.length === 2 && parts[0] && parts[1]
      ? { width: parts[0], height: parts[1] }
      : null;
  }

  function getSizePreviewSpec() {
    if (state.sizeMode === "direct") {
      const width = toPositiveNumber(state.directSizeW);
      const height = toPositiveNumber(state.directSizeH);
      if (width && height) {
        return {
          width,
          height,
          label: `${width}×${height} ${state.directSizeUnit || "px"}`,
          source: "direct",
        };
      }
    }

    const ratio = parseRatioLabel(getResolvedRatioLabel()) || { width: 4, height: 5 };
    return {
      width: ratio.width,
      height: ratio.height,
      label: formatRatio(ratio.width, ratio.height),
      source: state.ratio === "custom" ? "custom" : "ratio",
    };
  }

  function getSizePreviewCopy(width, height, source) {
    const ratio = width / height;
    const directSuffix = source === "direct" ? " 입력한 실제 크기를 축소해 표시했습니다." : "";

    if (ratio >= 1.65) {
      return {
        title: "넓은 배너형 이미지",
        desc: `웹 배너, 헤더, 가로 광고처럼 좌우 흐름을 쓰기 좋습니다.${directSuffix}`,
      };
    }
    if (ratio > 1.12) {
      return {
        title: "넓은 카드형 이미지",
        desc: `썸네일, 카드뉴스 표지, 발표 화면형 홍보 이미지에 적합합니다.${directSuffix}`,
      };
    }
    if (ratio >= 0.88) {
      return {
        title: "정방형에 가까운 이미지",
        desc: `SNS 피드와 카드형 홍보 이미지처럼 균형 잡힌 구성이 쉽습니다.${directSuffix}`,
      };
    }
    if (ratio >= 0.58) {
      return {
        title: "긴 카드형 이미지",
        desc: `SNS 피드, 포스터, 모바일 노출에 적합한 비율입니다.${directSuffix}`,
      };
    }
    return {
      title: "긴 세로 스토리형 이미지",
      desc: `스토리, 릴스 커버, 모바일 전면 노출처럼 위아래 흐름이 강한 구성입니다.${directSuffix}`,
    };
  }

  function syncSizePreviewUI() {
    const frame = $("promotionSizePreviewFrame");
    const ratioText = $("promotionSizePreviewRatio");
    const title = $("promotionSizePreviewTitle");
    const desc = $("promotionSizePreviewDesc");
    if (!frame || !ratioText || !title || !desc) return;

    const spec = getSizePreviewSpec();
    const maxWidth = 118;
    const maxHeight = 112;
    const scale = Math.min(maxWidth / spec.width, maxHeight / spec.height);
    const frameWidth = Math.max(38, Math.round(spec.width * scale));
    const frameHeight = Math.max(38, Math.round(spec.height * scale));
    const copy = getSizePreviewCopy(spec.width, spec.height, spec.source);

    frame.style.width = `${frameWidth}px`;
    frame.style.height = `${frameHeight}px`;
    ratioText.textContent = spec.label;
    title.textContent = copy.title;
    desc.textContent = copy.desc;
  }

  function syncSizeModeUI() {
    const ratioBox = $("promotionRatioModeBox");
    const directBox = $("promotionDirectSizeBox");
    const customRatioBox = $("promotionCustomRatioBox");
    const unitLabelW = $("promotionDirectSizeUnitLabelW");
    const unitLabelH = $("promotionDirectSizeUnitLabelH");
    const directUnit = state.directSizeUnit || "px";
    const showRatioMode = state.sizeMode !== "direct";

    if (ratioBox) {
      ratioBox.style.display = showRatioMode ? "" : "none";
    }
    if (directBox) {
      directBox.style.display = showRatioMode ? "none" : "block";
    }
    if (customRatioBox) {
      customRatioBox.style.display = showRatioMode && state.ratio === "custom" ? "flex" : "none";
    }
    if (unitLabelW) unitLabelW.textContent = directUnit;
    if (unitLabelH) unitLabelH.textContent = directUnit;
    syncSizePreviewUI();
  }

  function isFieldManualActive(field) {
    const enabledKey = `${field}Enabled`;
    const modeKey = `${field}Mode`;
    return isEnabled(state[enabledKey]) && state[modeKey] === "manual";
  }

  function visibleTextEntries() {
    const entries = [
      ["headline", state.headline],
      ["subheadline", state.subheadline],
      ["bodyCopy", state.bodyCopy],
      ["mandatoryElements", state.mandatoryElements],
    ];

    if (isFieldManualActive("cta")) entries.push(["cta", state.cta]);
    if (isFieldManualActive("posterOffer")) entries.push(["posterOffer", state.posterOffer]);
    if (isFieldManualActive("snsHook")) entries.push(["snsHook", state.snsHook]);
    if (isFieldManualActive("snsHashtags")) entries.push(["snsHashtags", state.snsHashtags]);

    return entries
      .map(([key, value]) => ({
        key,
        label: FIELD_LABELS[key],
        value: normalizeLines(value).join(" / ") || String(value || "").trim(),
      }))
      .filter((entry) => entry.value);
  }

  function instructionEntries() {
    const entries = [
      ["contentType", CONTENT_TYPE_TEMPLATES[state.contentType]?.name || "직접 입력"],
      ["sizeMode", state.sizeMode === "direct" ? "크기 직접 입력" : "비율 설정"],
      [state.sizeMode === "direct" ? "directSize" : "ratio", getSpecificationSummary()],
      ["orientation", getEffectiveOrientation() === "vertical" ? "세로형" : "가로형"],
      ["goal", state.goal],
      ["audience", state.audience],
      ["commercialBaseline", COMMERCIAL_BASELINE_PROFILES[state.commercialBaseline]?.labelKo || state.commercialBaseline],
      ["creativityLevel", CREATIVITY_LEVEL_PROFILES[state.creativityLevel]?.labelKo || state.creativityLevel],
      ["tone", state.tone],
      ["visualStyle", state.visualStyle],
      ["qualityNotes", state.qualityNotes],
      ["colorStrategy", isAiColorStrategy() ? "색상과 배경 모두 AI에게 맡기기" : "직접 지정"],
      ["bigIdea", state.bigIdea],
      ["visualMetaphor", state.visualMetaphor],
      ["primaryColor", isAiColorStrategy() ? "" : state.primaryColor],
      ["secondaryColor", isAiColorStrategy() ? "" : state.secondaryColor],
      ["accentColor", isAiColorStrategy() ? "" : state.accentColor],
      ["backgroundMode", isAiColorStrategy() ? "" : backgroundModeLabel(state.backgroundMode)],
      ["backgroundColor", isAiColorStrategy() ? "" : state.backgroundColor],
      ["backgroundDetails", isAiColorStrategy() ? "" : state.backgroundDetails],
      ["forbiddenElements", state.forbiddenElements],
    ];

    if (isEnabled(state.posterKeyVisualEnabled)) entries.push(["posterKeyVisual", state.posterKeyVisual]);
    if (isEnabled(state.posterInfoLayoutEnabled)) entries.push(["posterInfoLayout", state.posterInfoLayout]);
    if (isEnabled(state.snsVisualFocusEnabled)) entries.push(["snsVisualFocus", state.snsVisualFocus]);
    if (isEnabled(state.snsPlacementNotesEnabled)) entries.push(["snsPlacementNotes", state.snsPlacementNotes]);

    return entries
      .map(([key, value]) => ({
        key,
        label: FIELD_LABELS[key] || key,
        value: normalizeLines(value).join(" / ") || String(value || "").trim(),
      }))
      .filter((entry) => entry.value);
  }

  function renderDataList(targetId, entries, emptyText) {
    const node = $(targetId);
    if (!node) return;

    if (!entries.length) {
      node.innerHTML = `<div class="promo-data-empty">${escapeHtml(emptyText)}</div>`;
      return;
    }

    node.innerHTML = entries
      .map((entry) => `
        <div class="promo-data-item">
          <strong>${escapeHtml(entry.label)}</strong>
          <span>${escapeHtml(entry.value)}</span>
        </div>
      `)
      .join("");
  }

  function summaryItems(textEntries, instructionItems, validation) {
    const items = [
      ASSET_LABELS[state.assetType],
      CONTENT_TYPE_TEMPLATES[state.contentType]?.name || "직접 입력",
      outputLanguageLabel(),
      promptModeLabel(),
      state.sizeMode === "direct" ? `직접 크기 ${getSpecificationSummary()}` : getSpecificationSummary(),
      getEffectiveOrientation() === "vertical" ? "세로형" : "가로형",
      textEntries.length ? `직접 텍스트 ${textEntries.length}개` : "직접 텍스트 없음",
      instructionItems.length ? `설계 지시 ${instructionItems.length}개` : "설계 지시 없음",
    ];

    if (validation.errors.length) {
      items.push(`오류 ${validation.errors.length}개`);
    } else if (validation.warnings.length) {
      items.push(`검토 힌트 ${validation.warnings.length}개`);
    } else {
      items.push("복사 가능");
    }

    return items;
  }

  function guidanceItems() {
    if (state.assetType === "image") {
      return [
        "헤드라인과 CTA처럼 직접 노출 텍스트는 짧고 강하게 유지하는 편이 좋습니다.",
        "메인 비주얼 포인트와 정보 배치 방식을 함께 적어두면 포스터형과 SNS형 지시가 더 자연스럽게 통합됩니다.",
        "첫 줄 훅과 배치 메모를 적어두면 스토리형 화면에서도 시선 유도와 안전영역 관리가 쉬워집니다.",
        "해시태그는 실제 이미지 노출용인지 캡션 참고용인지 구분해서 적는 편이 결과 품질에 도움이 됩니다.",
        "색상 시스템과 배경 처리 방식을 분리해서 적어두면 브랜드 톤과 CTA 대비를 동시에 잡기 좋습니다.",
      ];
    }

    if (state.assetType === "poster") {
      return [
        "헤드라인과 CTA처럼 실제 노출 텍스트는 짧고 강하게 유지합니다.",
        "목적, 타깃, 톤 같은 항목은 연출 참고용으로만 쓰고 문구를 그대로 복사하지 않도록 분리합니다.",
        "포스터는 메인 비주얼 1개와 정보 블록 1개를 중심으로 화면 위계를 단순하게 잡는 편이 좋습니다.",
        "품질 보정 지시에 텍스트 선명도와 배경 대비를 적어두면 실제 광고 시안에 가까운 결과를 요구하기 쉽습니다.",
        "메인/보조/포인트 색과 배경 방식을 함께 적어두면 브랜드 일관성과 시선 유도 포인트를 동시에 잡기 좋습니다.",
      ];
  }

    if (state.assetType === "cardnews") {
      return [
        "카드뉴스는 한 장당 한 메시지 원칙을 지키고, 카드 흐름으로 전체 설득 구조를 잡는 것이 중요합니다.",
        "커버 카드 훅과 마지막 카드 CTA의 온도 차이를 분명히 두면 저장·공유 유도가 쉬워집니다.",
        "헤드라인이 모든 카드에 반복되지 않도록 정보 분산과 시각 리듬을 함께 지시하는 편이 좋습니다.",
        "품질 보정 지시에 숫자, 아이콘, 본문 대비를 명시하면 정보형 카드뉴스의 가독성이 더 안정적입니다.",
        "색상 시스템을 명시하면 카드별 강조색이 제멋대로 바뀌는 문제를 줄일 수 있습니다.",
      ];
  }

    return [
      "SNS 이미지는 첫 줄 훅과 CTA의 가독성이 가장 중요하므로 직접 노출 텍스트를 최소화합니다.",
      "플랫폼 안전영역, 스티커 위치, 해시태그 배치는 연출 지시로 다루고 문구 본문과 분리합니다.",
      "화면 안에 실제로 넣을 텍스트와 캡션으로 넘길 텍스트를 섞지 않는 것이 중요합니다.",
      "SNS 비주얼 중심 포인트와 품질 보정 지시를 함께 적어두면 썸네일 단계에서도 시선이 모이는 구성을 요구하기 쉽습니다.",
      "포인트 색상과 배경 처리 방식을 분리해서 적어두면 CTA 버튼과 헤드라인 대비를 더 안정적으로 잡을 수 있습니다.",
    ];
  }

  function prunePromptLines(lines) {
    const base = lines
      .map((line) => trimValue(line))
      .filter(Boolean)
      .filter((line) => !(isEnabled(state.omitEmptyFields) && /미입력|\?:\?|직접 크기 미입력/.test(line)));

    if (!isEnabled(state.dedupePromptLines)) {
      return base;
    }

    const seen = new Set();
    return base.filter((line) => {
      const normalized = line.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }

  function resolveConflictLines(lines, lint) {
    if (!isEnabled(state.autoResolveConflicts) || (!lint.conflicts.length && !lint.duplicates.length)) {
      return lines;
    }

    return lines.filter((line) => {
      if (/광택|glossy/i.test(state.qualityNotes) && /플랫 디자인/.test(state.visualStyle) && /광택|glossy/i.test(line)) {
        return false;
      }
      if (/해시태그 제외|해시태그 본문 노출 금지/.test(state.forbiddenElements) && /해시태그\/태그/.test(line)) {
        return false;
      }
      return true;
    });
  }

  function getLocalizedProfileLines(profile) {
    if (!profile) return [];
    if (state.outputLanguage === "en") return [...(profile.linesEn || [])];
    if (state.outputLanguage === "bilingual") {
      return (profile.linesKo || []).map((item, index) => `${item} / ${profile.linesEn?.[index] || item}`);
    }
    return [...(profile.linesKo || [])];
  }

  function qrCodePromptLines() {
    if (!isEnabled(state.qrEnabled)) return [];
    const qrUrl = String(state.qrUrl || "").trim();
    return prunePromptLines([
      localizeSentence(
        "QR코드 사용: 이미지 하단 또는 엑션버튼 주변에 명확한 QR코드 공간을 배정하고, 주변 여백을 충분히 확보한다.",
        "QR code requested: reserve a clear QR-code area near the bottom or near the action button, with enough quiet space around it."
      ),
      localizeSentence(
        "실제 스캔 가능한 QR코드를 이미지 생성 모델이 정확히 만들지 못할 수 있으므로, 최종 편집에서 실제 QR 이미지를 삽입할 수 있는 빈 자리 또는 플레이스홀더로 구성한다.",
        "Because the image model may not create a reliably scannable QR code, compose this as a blank slot or placeholder where the real QR image can be inserted during final editing."
      ),
      qrUrl
        ? localizeSentence(
            `QR 연결 주소 참고: ${qrUrl}`,
            `QR target URL reference: ${qrUrl}`
          )
        : "",
      localizeSentence(
        "QR 안내문구: 'QR코드로 바로가기' 또는 'QR로 신청하기'처럼 짧고 읽기 쉬운 안내문구를 QR 영역 옆에 배치한다.",
        "QR helper text: place a short readable label such as 'Scan the QR code' or 'Apply via QR' next to the QR area."
      ),
    ]);
  }

  function createPromptSections(validation, lint) {
    const textEntries = visibleTextEntries();
    const instructionItems = instructionEntries();
    const commercialProfile = COMMERCIAL_BASELINE_PROFILES[state.commercialBaseline] || COMMERCIAL_BASELINE_PROFILES[DEFAULT_STATE.commercialBaseline];
    const creativityProfile = CREATIVITY_LEVEL_PROFILES[state.creativityLevel] || CREATIVITY_LEVEL_PROFILES[DEFAULT_STATE.creativityLevel];
    const promotionStrategyProfile = CONTENT_PROMOTION_STRATEGIES[state.contentType] || CONTENT_PROMOTION_STRATEGIES.none;
    const diversityProfile = CREATIVE_DIVERSITY_PROFILES[state.creativityLevel] || CREATIVE_DIVERSITY_PROFILES.balanced;
    const compositionExcludedKeys = new Set([
      "contentType",
      "sizeMode",
      "ratio",
      "directSize",
      "orientation",
      "forbiddenElements",
      "backgroundMode",
      "backgroundColor",
      "backgroundDetails",
      "primaryColor",
      "secondaryColor",
      "accentColor",
      "qualityNotes",
      "commercialBaseline",
      "creativityLevel",
    ]);

    const targetLines = prunePromptLines([
      `${localizeSentence("산출물 유형", "Asset type")}: ${localizeValue(ASSET_LABELS[state.assetType])}`,
      `${localizeSentence("컨텐츠 유형", "Content template")}: ${localizeValue(CONTENT_TYPE_TEMPLATES[state.contentType]?.name || "직접 입력")}`,
      `${localizeSentence("규격 입력 방식", "Sizing mode")}: ${localizeValue(state.sizeMode === "direct" ? "크기 직접 입력" : "비율 설정")}`,
      state.sizeMode === "direct"
        ? `${localizeSentence("직접 입력 크기", "Exact size")}: ${getPromptSpecificationSummary()}`
        : `${localizeSentence("비율/방향", "Aspect ratio / orientation")}: ${getPromptSpecificationSummary()} / ${localizeValue(getEffectiveOrientation() === "vertical" ? "세로형" : "가로형")}`,
    ]);

    const koreanTextConstraint =
      state.outputLanguage !== "en" && state.outputLanguage !== "bilingual"
        ? [
            localizeSentence(
              "이미지에 렌더링되는 텍스트(헤드라인·서브카피·CTA·오퍼·훅 등)는 사용자가 입력한 원문 언어 그대로 표기한다. 한국어 입력은 한국어로, 영어 입력은 영어로 렌더링하며, AI가 임의로 번역하거나 언어를 전환하지 않는다.",
              "Render all on-image text (headline, sub-copy, CTA, offer, hook, etc.) in exactly the language the user provided — Korean stays Korean, English stays English. Do not translate or switch languages arbitrarily."
            ),
          ]
        : [];

    const activeAntiAiPreset = ANTI_AI_PRESETS.find((p) => p.id === state.antiAiStyle) || null;
    const antiAiForbiddenTokens = activeAntiAiPreset
      ? splitKeywordValues(localizeSentence(activeAntiAiPreset.forbiddenKo, activeAntiAiPreset.forbiddenEn))
      : [];
    const userForbiddenTokens = splitKeywordValues(state.forbiddenElements).filter((token) => {
      const norm = token.trim().toLowerCase().replace(/[\s·.,]/g, "");
      return !antiAiForbiddenTokens.some((t) => t.trim().toLowerCase().replace(/[\s·.,]/g, "") === norm);
    });
    const mergedForbiddenTokens = [...userForbiddenTokens, ...antiAiForbiddenTokens];

    const defaultHardConstraintLines = [
      localizeSentence(
        "이미지 안 텍스트는 사용자가 제공한 문구와 AI 자동 생성 요청 항목만 사용하고, 임의 문장·가짜 한글·중복 문구·의미 없는 장식 텍스트를 추가하지 않는다.",
        "Use only the user-provided copy and explicitly requested AI-generated copy on the image; do not add arbitrary sentences, fake Korean, duplicated copy, or meaningless decorative text."
      ),
      localizeSentence(
        "헤드라인, 서브카피, 행동버튼 문구, 숫자, 날짜, 장소는 획이 뭉개지지 않는 또렷한 타이포그래피로 렌더링하고 철자·숫자·띄어쓰기를 왜곡하지 않는다.",
        "Render headlines, sub-copy, action button text, numbers, dates, and locations with crisp typography; do not distort spelling, numerals, or spacing."
      ),
      localizeSentence(
        "실제 존재하는 기업·기관·정부 로고, 상표, 엠블럼, 워터마크를 임의로 생성하거나 모사하지 않는다. 필요한 경우 깨끗한 빈 자리 또는 중립 플레이스홀더로 남긴다.",
        "Do not invent or imitate real company, institution, government logos, trademarks, emblems, or watermarks. Leave a clean blank area or neutral placeholder if needed."
      ),
      localizeSentence(
        "주요 헤드라인, 핵심 수치, 행동버튼, QR 자리 등 필수 정보는 캔버스 가장자리에서 충분히 떨어진 안전영역 안에 배치한다.",
        "Place key information such as the headline, key numbers, action button, and QR placeholder inside a safe area with enough margin from the canvas edges."
      ),
      localizeSentence(
        "결과물은 목업 화면, 포스터를 든 장면, 프레임 안 미리보기, 흰 외부 여백이 아니라 바로 배포 가능한 단일 홍보 이미지여야 한다.",
        "The result must be a single ready-to-use promotion image, not a mockup screen, poster-in-hand scene, framed preview, or image with external white margins."
      ),
    ];

    const hardConstraintLines = prunePromptLines([
      ...koreanTextConstraint,
      ...defaultHardConstraintLines,
      ...(activeAntiAiPreset
        ? [localizeSentence(
            `스타일 제약(${activeAntiAiPreset.labelKo}): ${activeAntiAiPreset.visualHintKo}로 렌더링하라`,
            `Style constraint (${activeAntiAiPreset.labelEn}): render in ${activeAntiAiPreset.visualHintEn}`
          )]
        : []),
      ...validation.errors.map((item) => localizeValue(item)),
      ...mergedForbiddenTokens.map((item) => `${localizeSentence("절대 금지", "Strictly avoid")}: ${localizeValue(item)}`),
    ]);

    const directTextLines = prunePromptLines(
      textEntries.map((entry) => `${localizeValue(entry.label)}: ${localizeValue(entry.value)}`)
    );

    const AI_AUTO_FIELD_DEFS = [
      {
        field: "cta",
        labelKo: "엑션버튼(CTA) 문구",
        labelEn: "action button (CTA) copy",
        directiveKo: "엑션버튼(CTA) 문구를 홍보 목적과 핵심 타깃에 맞춰 즉각적인 행동을 유도하는 형태로 생성하라",
        directiveEn: "Generate an action button (CTA) copy that drives immediate action, matched to the promotion goal and target audience",
      },
      {
        field: "posterOffer",
        labelKo: "한 줄 오퍼",
        labelEn: "single-line offer",
        directiveKo: "이미지에 직접 노출될 한 줄 오퍼 문구를 핵심 혜택 중심으로 간결하게 생성하라",
        directiveEn: "Generate a concise single-line offer focused on the core benefit, suitable for direct display on the image",
      },
      {
        field: "snsHook",
        labelKo: "첫 줄 훅",
        labelEn: "opening hook",
        directiveKo: "SNS 피드/스토리에서 즉시 시선을 끌 수 있는 첫 줄 훅 문구를 생성하라",
        directiveEn: "Generate an opening hook that immediately grabs attention in SNS feed or story formats",
      },
      {
        field: "snsHashtags",
        labelKo: "해시태그/태그",
        labelEn: "hashtags/tags",
        directiveKo: "컨텐츠 유형과 홍보 목적에 맞는 해시태그 5~10개를 생성하라",
        directiveEn: "Generate 5 to 10 hashtags matched to the content type and promotion goal",
      },
      {
        field: "tone",
        labelKo: "브랜드 톤",
        labelEn: "brand tone",
        directiveKo: "홍보 목적과 타깃 독자에 맞게 가장 설득력 있고 매력적인 브랜드 톤앤매너(예: 신뢰감, 역동적, 미래지향적 등)를 자동으로 생성하라",
        directiveEn: "Generate a compelling brand tone and voice suitable for the promotion goal and target audience"
      },
      {
        field: "bigIdea",
        labelKo: "핵심 개념(Big Idea)",
        labelEn: "core concept (Big Idea)",
        directiveKo: "메시지와 비주얼을 하나로 관통하는 창의적인 핵심 개념(Big Idea)을 정의하고 프롬프트 전반에 반영하라",
        directiveEn: "Generate a creative core concept (Big Idea) that unifies the campaign message and visual identity"
      },
      {
        field: "visualMetaphor",
        labelKo: "비주얼 은유",
        labelEn: "visual metaphor",
        directiveKo: "핵심 개념을 암시하거나 시각적으로 상징할 수 있는 메인 그래픽 메타포 또는 상징적 사물/장면을 생성하라",
        directiveEn: "Generate a creative visual metaphor or symbolic objects representing the core concept"
      },
      {
        field: "visualStyle",
        labelKo: "비주얼 스타일",
        labelEn: "visual style",
        directiveKo: "타깃 디자인 룩에 걸맞은 사진 기법, 그래픽 텍스처, 질감 및 비주얼 스타일 지시어를 디테일하게 자동 생성하라",
        directiveEn: "Generate a visual style concept suggestion with detailed style descriptors matching the campaign theme"
      },
      {
        field: "layoutComposition",
        labelKo: "레이아웃 구도 배치",
        labelEn: "layout composition",
        directiveKo: "헤드라인, 본문포인트, CTA, 비주얼 오브젝트를 최적으로 배치할 구도 전략(예: 비대칭, 중앙 대칭, 상단 타이포 중심 등)을 스스로 선택하여 조화롭게 배치하라",
        directiveEn: "Determine and generate a layout composition strategy (e.g., asymmetrical, centered, or typography-led) that optimally balances the elements"
      }
    ];

    const aiAutoLines = prunePromptLines(
      AI_AUTO_FIELD_DEFS
        .filter((def) => isEnabled(state[`${def.field}Enabled`]) && state[`${def.field}Mode`] === "ai")
        .map((def) => localizeSentence(
          `[AI 자동 생성] ${def.labelKo}: ${def.directiveKo}`,
          `[AI auto-generate] ${def.labelEn}: ${def.directiveEn}`
        ))
    );

    const promotionStrategyLines = prunePromptLines([
      `${localizeSentence("광고 목적", "promotion goal")}: ${localizeValue(state.goal || CONTENT_TYPE_TEMPLATES[state.contentType]?.goal || "직접 입력 목적")}`,
      `${localizeSentence("타깃 대상", "target audience")}: ${localizeValue(state.audience || CONTENT_TYPE_TEMPLATES[state.contentType]?.audience || "직접 입력 대상")}`,
      (isEnabled(state.toneEnabled) && state.toneMode === "manual" && state.tone)
        ? `${localizeSentence("브랜드 톤", "brand tone")}: ${localizeValue(state.tone)}`
        : "",
      ...getLocalizedProfileLines(promotionStrategyProfile),
      localizeSentence(
        "이 이미지는 정보 안내물이 아니라 시선 포획, 메시지 압축, 행동 유도를 수행하는 광고 키비주얼이어야 한다.",
        "This image must function as an advertising key visual that captures attention, compresses the message, and drives action, not as a plain information notice."
      ),
    ]);

    const attentionFlowLines = prunePromptLines([
      localizeSentence(
        "시선 흐름 1순위: 헤드라인 또는 가장 중요한 후킹 문구",
        "Attention order 1: headline or most important hook copy"
      ),
      localizeSentence(
        "시선 흐름 2순위: 메인 비주얼 오브젝트, 인물, 상징 장면, 또는 핵심 데이터",
        "Attention order 2: main visual object, person, symbolic scene, or key data"
      ),
      localizeSentence(
        "시선 흐름 3순위: 혜택, 일정, 장소, 핵심 조건 등 보조 정보",
        "Attention order 3: supporting details such as benefit, date, location, or key condition"
      ),
      localizeSentence(
        "시선 흐름 4순위: 엑션버튼, QR 자리, 링크 안내 같은 행동 유도 요소",
        "Attention order 4: action button, QR placeholder, link guide, or other conversion element"
      ),
      localizeSentence(
        "텍스트 블록은 가능하면 3개 이하로 묶고, 모든 작은 텍스트는 정보 카드 또는 하단 정보 영역에 정돈한다.",
        "Keep text blocks to 3 or fewer when possible, and organize small text into information cards or a bottom information zone."
      ),
    ]);

    const commercialLines = prunePromptLines([
      `${localizeSentence("상업 품질 기준", "Commercial baseline")}: ${localizeSentence(commercialProfile.labelKo, commercialProfile.labelEn)}`,
      ...getLocalizedProfileLines(commercialProfile),
    ]);

    const layoutCompLines = (() => {
      if (!isEnabled(state.layoutCompositionEnabled) || state.layoutCompositionMode !== "manual") {
        return [];
      }
      const compKey = state.layoutComposition || "centered";
      const profile = LAYOUT_COMPOSITION_PROFILES[compKey] || LAYOUT_COMPOSITION_PROFILES.centered;
      const label = localizeSentence(profile.labelKo, profile.labelEn);
      const lines = state.outputLanguage === "en" ? profile.linesEn
        : state.outputLanguage === "bilingual"
          ? profile.linesKo.map((ko, i) => `${ko} / ${profile.linesEn[i] || ko}`)
          : profile.linesKo;
      return [
        `${localizeSentence("레이아웃 구도 배치", "Layout composition")}: ${label}`,
        ...lines
      ];
    })();

    const conceptStyleLine = state.appliedConceptStyle
      ? [`${localizeSentence("컨셉 제안 비주얼 스타일", "Visual style concept suggestion")}: ${state.appliedConceptStyle}`]
      : [];

    const designLines = prunePromptLines([
      ...layoutCompLines,
      ...conceptStyleLine,
      ...instructionItems
        .filter((entry) => {
          if (entry.key === "visualStyle" && (!isEnabled(state.visualStyleEnabled) || state.visualStyleMode !== "manual")) {
            return false;
          }
          return !compositionExcludedKeys.has(entry.key);
        })
        .map((entry) => `${localizeValue(entry.label)}: ${localizeValue(entry.value)}`),
      ...qrCodePromptLines(),
    ]);

    const creativityLines = prunePromptLines([
      (isEnabled(state.bigIdeaEnabled) && state.bigIdeaMode === "manual" && state.bigIdea) ? `${localizeSentence("핵심 개념", "Core concept")}: ${localizeValue(state.bigIdea)}` : "",
      (isEnabled(state.visualMetaphorEnabled) && state.visualMetaphorMode === "manual" && state.visualMetaphor) ? `${localizeSentence("비주얼 은유", "Visual metaphor")}: ${localizeValue(state.visualMetaphor)}` : "",
      `${localizeSentence("레이아웃 실험 범위", "Layout experimentation")}: ${localizeSentence(creativityProfile.labelKo, creativityProfile.labelEn)}`,
      ...getLocalizedProfileLines(creativityProfile),
      ...getLocalizedProfileLines(diversityProfile),
      localizeSentence(
        "같은 입력값이라도 매번 동일한 템플릿 구도로 반복하지 말고, 선택한 창의성 강도 안에서 색면, 크롭, 오브젝트 스케일, 정보 카드 형태, 배경 은유 중 일부를 변주한다.",
        "Even with the same inputs, do not repeat the same template composition every time; within the selected creativity level, vary color fields, cropping, object scale, information-card shape, or background metaphor."
      ),
    ]);

    const colorLines = prunePromptLines(
      isAiColorStrategy()
        ? [
            `${localizeSentence("색상/배경 전략", "Color and background strategy")}: ${localizeSentence("색상과 배경 모두 AI에게 맡기기", "Let AI direct both the color palette and the background")}`,
            localizeSentence(
              "브랜드 톤, 컨텐츠 유형, CTA 위계에 맞춰 메인/보조/포인트 색상과 배경 색감, 배경 처리 방식을 AI가 함께 설계한다.",
              "Let the model design the primary, secondary, and accent colors together with the background palette and background treatment to match the brand tone, content type, and CTA hierarchy."
            ),
            localizeSentence(
              "색상 수는 3~4개 이내로 절제하고, 강조색은 한 가지 포인트 컬러만 강하게 사용한다.",
              "Keep the palette restrained to roughly 3 to 4 colors and use a single dominant accent color for emphasis."
            ),
            localizeSentence(
              "배경은 단색, 패턴, 이미지, 혼합 중 가장 적절한 방식을 스스로 고르고 텍스트 가독성을 우선해 정리한다.",
              "Choose the most suitable background treatment among solid, pattern, image-led, or mixed approaches while keeping text readability as the first priority."
            ),
          ]
        : [
            `${localizeSentence("색상 전략", "Color strategy")}: ${localizeSentence("직접 지정", "Manual palette")}`,
            `${localizeSentence("메인 색상", "Primary color")}: ${localizeValue(state.primaryColor)}`,
            `${localizeSentence("보조 색상", "Secondary color")}: ${localizeValue(state.secondaryColor)}`,
            `${localizeSentence("포인트 색상", "Accent color")}: ${localizeValue(state.accentColor)}`,
            `${localizeSentence("배경 처리 방식", "Background treatment")}: ${localizeValue(backgroundModeLabel(state.backgroundMode))}`,
            state.backgroundColor ? `${localizeSentence("배경 색상", "Background color")}: ${localizeValue(state.backgroundColor)}` : "",
            state.backgroundDetails ? `${localizeSentence("배경 패턴/이미지 지시", "Background pattern/image guidance")}: ${localizeValue(state.backgroundDetails)}` : "",
          ]
    );

    const compositeQualityLines = [
      localizeSentence(
        "겹쳐지는 레이어 밑에는 부드러운 그림자를 두어 실제 물리적인 깊이감을 형성한다.",
        "Apply subtle drop shadows beneath overlapping layers to establish a realistic sense of physical depth."
      ),
      localizeSentence(
        "글자가 배치되는 뒷배경은 아무런 시각 노이즈가 없는 완전한 평면/단색 상태를 유지하며 복잡한 텍스처는 그래픽 영역에만 허용한다.",
        "Keep the background behind the text clean and plain, reserving complex textures only for the artistic graphic zones."
      ),
      localizeSentence(
        "얕은 피사체 심도(DoF)를 활용해 글자는 아주 또렷하게 표현하고 배경 그래픽 요소는 부드럽게 흐리게 처리한다.",
        "Use slight depth of field to keep the text in sharp focus while making the distant background elements softly out of focus."
      ),
      localizeSentence(
        "중앙 비주얼 오브젝트와 그래픽 요소가 인위적인 둥근 테두리 박스에 갇히지 않도록 하고 전체 배경과 유기적으로 블렌딩(blending)되어야 한다.",
        "Ensure the central visual object and graphic elements are organically blended with the overall background, without being enclosed in an isolated border frame or box."
      ),
      localizeSentence(
        "평평한 격리형 레이아웃을 지양하고, 다층적인 사선 분할이나 오버랩을 활용해 다채롭고 조화로운 공간감을 구현한다.",
        "Avoid flat isolated layouts; implement multi-layered overlapping where elements blend seamlessly across spatial segments for a dynamic sense of depth."
      )
    ];

    const qualityLines = prunePromptLines([
      ...getDefaultQualityTagLines(),
      ...compositeQualityLines,
      ...splitQualityNoteLines(state.qualityNotes).map((item) => localizeValue(item)),
    ]);

    const variationLines = (() => {
      const seed = VARIATION_SEEDS.find((s) => s.id === state.variationMode);
      if (!seed) return [];
      const label = localizeSentence(seed.labelKo, seed.labelEn);
      const lines = state.outputLanguage === "en" ? seed.linesEn
        : state.outputLanguage === "bilingual"
          ? seed.linesKo.map((ko, i) => `${ko} / ${seed.linesEn[i] || ko}`)
          : seed.linesKo;
      return prunePromptLines([
        localizeSentence(`비주얼 구성 방향: ${label}`, `Visual composition direction: ${label}`),
        ...lines,
      ]);
    })();

    const sections = [
      { priority: 10, title: localizeHeading("출력 대상", "Output target"), lines: targetLines },
      { priority: 15, title: localizeHeading("광고 전략", "Promotion strategy"), lines: promotionStrategyLines },
      { priority: 20, title: localizeHeading("상업 품질 기준", "Commercial baseline"), lines: commercialLines },
      { priority: 30, title: localizeHeading("하드 제약", "Hard constraints"), lines: hardConstraintLines },
      { priority: 35, title: localizeHeading("AI 자동 생성 요청", "AI auto-generate requests"), lines: aiAutoLines },
      { priority: 40, title: localizeHeading("이미지에 직접 포함할 텍스트 (한국어 원문 그대로 렌더링)", "Text to render exactly as-is — Korean source text, do not translate"), lines: directTextLines },
      { priority: 45, title: localizeHeading("시선 흐름", "Attention flow"), lines: attentionFlowLines },
      { priority: 50, title: localizeHeading("구성/배치 지시", "Composition and layout guidance"), lines: resolveConflictLines(designLines, lint) },
      { priority: 60, title: localizeHeading("창의 방향", "Creative direction"), lines: creativityLines },
      { priority: 65, title: localizeHeading("비주얼 구성 방향", "Visual composition direction"), lines: variationLines },
      { priority: 70, title: localizeHeading("색상 시스템", "Color system"), lines: colorLines },
      { priority: 80, title: localizeHeading("품질 보정 지시", "Quality refinements"), lines: qualityLines },
    ];

    const seenLines = new Set();
    return sections
      .map((section) => ({
        ...section,
        lines: section.lines.filter((line) => {
          const normalized = normalizePromptLineForDedupe(line);
          if (!normalized || seenLines.has(normalized)) return false;
          seenLines.add(normalized);
          return true;
        }),
      }))
      .filter((section) => section.lines.length > 0);
  }

  function buildTextLanguageDirective() {
    // 영문 전용 또는 한영 병기 모드에서는 언어 강제 규칙을 삽입하지 않는다
    if (state.outputLanguage === "en" || state.outputLanguage === "bilingual") return "";
    return localizeSentence(
      "이미지 안에 렌더링되는 텍스트(헤드라인, 서브카피, CTA, 본문 포인트 등)는 사용자가 입력한 원문 언어 그대로 표기한다. 입력값이 한국어이면 한국어로, 영어이면 영어로 렌더링하고, AI가 임의로 번역하거나 다른 언어로 전환하지 않는다. 해시태그는 입력된 언어와 표기 방식을 유지한다.",
      "Render all on-image text (headline, sub-copy, CTA, body points, etc.) exactly in the language the user provided — Korean stays Korean, English stays English. Do not translate or switch languages arbitrarily. Hashtags follow the same rule and retain their original language and format."
    );
  }

  function buildRoleStatement() {
    const contentName = state.contentType !== "none"
      ? localizeSentence(
          CONTENT_TYPE_TEMPLATES[state.contentType]?.name || "",
          CONTENT_TYPE_TEMPLATES_EN[state.contentType]?.name || ""
        )
      : "";
    const assetLabel = localizeSentence(ASSET_LABELS[state.assetType], ASSET_PROMPT_TARGET_EN[state.assetType] || ASSET_LABELS[state.assetType]);
    const langDirective = buildTextLanguageDirective();
    if (contentName) {
      return localizeSentence(
        `아래 지시에 따라 [${contentName}] 목적의 ${assetLabel}를 생성하라. 상업 광고 수준의 완성도, 텍스트 정확성, 레이아웃 위계, 브랜드 일관성을 동시에 충족해야 한다.${langDirective ? ` ${langDirective}` : ""}`,
        `Generate a ${assetLabel} for [${contentName}] following the instructions below. It must achieve campaign-grade commercial polish, exact text fidelity, strong layout hierarchy, and brand consistency at the same time.${langDirective ? ` ${langDirective}` : ""}`
      );
    }
    return localizeSentence(
      `아래 지시에 따라 ${assetLabel}를 생성하라. 상업 광고 수준의 완성도, 텍스트 정확성, 레이아웃 위계, 브랜드 일관성을 동시에 충족해야 한다.${langDirective ? ` ${langDirective}` : ""}`,
      `Generate a ${assetLabel} following the instructions below. It must achieve campaign-grade commercial polish, exact text fidelity, strong layout hierarchy, and brand consistency at the same time.${langDirective ? ` ${langDirective}` : ""}`
    );
  }

  function renderReviewPrompt(validation, lint) {
    const sections = createPromptSections(validation, lint);
    const intro = [
      `# ${localizeHeading("홍보이미지 생성 프롬프트", "Promotion Image Generation Prompt")}`,
      "",
      `## ${localizeHeading("생성 지시", "Generation directive")}`,
      buildRoleStatement(),
    ];

    const sectionLines = sections.flatMap((section) => [
      "",
      `## ${section.title}`,
      ...section.lines.flatMap((line) => line.split(/\r?\n/)).map((line) => `- ${line.trim().replace(/^-\s*/, "")}`),
    ]);

    const footer = [
      "",
      `## ${localizeHeading("우선순위", "Priority order")}`,
      localizeSentence("- 이미지 내 텍스트 언어 규칙 (한국어 단독 표기) 및 금지 규칙 준수", "- On-image text language rule (Korean only) and all hard constraints"),
      localizeSentence("- AI 자동 생성 항목 (CTA·오퍼·훅·태그) 적절히 생성 후 배치", "- Generate AI auto-requested items (CTA, offer, hook, hashtags) and place them appropriately"),
      localizeSentence("- 텍스트 위계와 가독성 (헤드라인 → CTA 순)", "- Text hierarchy and readability (headline → CTA)"),
      localizeSentence("- 상업 품질 기준 및 창의 방향 반영", "- Commercial baseline and creative direction"),
      localizeSentence("- 구성·배치·비주얼 구성 방향 반영", "- Composition, layout, and visual composition direction"),
      localizeSentence("- 색상·배경 시스템 일관성 및 품질 보정", "- Color system, background, and quality refinements"),
    ];

    return [...intro, ...sectionLines, ...footer].join("\n");
  }

  function renderOptimizedPrompt(validation, lint) {
    const sections = createPromptSections(validation, lint);
    const compressed = sections.flatMap((section) =>
      section.lines
        .flatMap((line) => line.split(/\r?\n/))
        .map((line) => `- ${line.replace(/^\d+\.\s*/, "").trim().replace(/^-\s*/, "")}`)
    );
    const assetLabelEn = ASSET_PROMPT_TARGET_EN[state.assetType] || ASSET_LABELS[state.assetType];
    const contentNameEn = state.contentType !== "none" ? (CONTENT_TYPE_TEMPLATES_EN[state.contentType]?.name || "") : "";
    const contentNameKo = state.contentType !== "none" ? (CONTENT_TYPE_TEMPLATES[state.contentType]?.name || "") : "";
    const optimizedIntro = [
      localizeSentence(
        contentNameKo
          ? `[${contentNameKo}] 목적의 고품질 홍보 이미지를 생성하라.`
          : `고품질 홍보 이미지를 생성하라.`,
        contentNameEn
          ? `Generate a premium ${assetLabelEn} for [${contentNameEn}].`
          : `Generate a premium ${assetLabelEn}.`
      ),
      localizeSentence(
        "텍스트 정확성, 타이포그래피 위계, 레이아웃 명확성, CTA 집중도와 상업 광고 수준의 완성도를 최우선으로 처리하라.",
        "Prioritize exact text fidelity, typography hierarchy, layout clarity, strong CTA focus, and campaign-grade commercial finish."
      ),
      localizeSentence(
        "평범한 템플릿형 안내 이미지로 만들지 말고, 타이포그래피 중심·상징 오브젝트 중심·공간 분할 중심 중 하나의 광고 콘셉트를 과감하게 선택해 차별화된 결과를 만든다.",
        "Do not produce a generic template-like notice image; decisively choose one advertising concept such as typography-led, symbolic-object-led, or spatially split composition to create a distinctive result."
      ),
      localizeSentence(
        "창의성은 장식 추가가 아니라 시선 흐름, 크롭, 여백, 오브젝트 스케일, 정보 카드 구조의 변주로 표현한다.",
        "Express creativity through variation in eye flow, cropping, whitespace, object scale, and information-card structure rather than by adding decoration."
      ),
      ...(state.outputLanguage !== "en"
        ? [localizeSentence(
            "이미지 내 모든 텍스트는 한국어로만 표기하고, 영어로 번역하거나 영문을 병기하지 않는다.",
            "All on-image text must be in Korean only — do not translate or add English."
          )]
        : []),
    ];

    return prunePromptLines([...optimizedIntro, ...resolveConflictLines(compressed, lint)]).join("\n");
  }

  function sanitizePromptForAI(text) {
    // "CTA"를 그대로 두면 이미지 생성 AI가 해당 문자열을 이미지에 직접 렌더링하는 오류 발생.
    // 단어 경계 기준으로 치환해 AI가 개념으로 이해하도록 유도.
    return text.replace(/\bCTA\b/g, "action button");
  }

  function buildPromptPreview(validation = latestValidation) {
    latestLint = detectPromptLint(validation, visibleTextEntries(), instructionEntries());
    const raw = state.promptMode === "optimized"
      ? renderOptimizedPrompt(validation, latestLint)
      : renderReviewPrompt(validation, latestLint);
    return sanitizePromptForAI(raw);
  }

  function renderPreview() {
    const textEntries = visibleTextEntries();
    const instructionItems = instructionEntries();
    const validation = validateState();
    const autoPrompt = buildPromptPreview(validation);

    latestValidation = validation;

    const badge = $("promotionAssetBadge");
    const previewBadge = $("promotionPreviewBadge");
    const summary = $("promotionSummary");
    const guidance = $("promotionGuidance");
    const preview = $("promotionPromptPreview");

    if (badge) badge.textContent = ASSET_LABELS[state.assetType];
    if (previewBadge) {
      if (promptDirty) {
        previewBadge.textContent = "직접 편집 중";
      } else if (validation.errors.length) {
        previewBadge.textContent = "입력 보완 필요";
      } else if (validation.warnings.length) {
        previewBadge.textContent = "검토 가능";
      } else {
        previewBadge.textContent = state.promptMode === "optimized" ? "최적화 완료" : `${ASSET_LABELS[state.assetType]} 생성용`;
      }
    }

    renderDataList("promotionVisibleTextList", textEntries, "아직 직접 노출 텍스트가 없습니다.");
    renderDataList("promotionInstructionList", instructionItems, "아직 설계 지시가 없습니다.");
    renderValidation(validation);
    renderLintPanel(latestLint);

    if (summary) {
      summary.innerHTML = summaryItems(textEntries, instructionItems, validation)
        .map((item) => `<span class="gen-config-chip">${escapeHtml(item)}</span>`)
        .join("");
    }

    if (guidance) {
      guidance.innerHTML = guidanceItems()
        .map((item) => `<div class="promo-guidance-item">${escapeHtml(item)}</div>`)
        .join("");
    }

    syncQuickButtonStates(root);

    if (preview) {
      if (!promptDirty) {
        promptDraft = autoPrompt;
      }
      if (preview.value !== promptDraft) {
        preview.value = promptDraft;
      }
    }

    persistDraft();
  }

  function syncCtaToggleUI() {
    const enabled = isEnabled(state.ctaEnabled);
    const isAi = state.ctaMode !== "manual";

    const checkbox = root.querySelector(".promo-ai-toggle-enabled[data-toggle-field='cta']");
    if (checkbox) checkbox.checked = enabled;

    const modeBtns = $("promotionCtaModeBtns");
    if (modeBtns) {
      modeBtns.classList.toggle("disabled", !enabled);
      modeBtns.querySelectorAll("[data-toggle-mode='cta']").forEach((btn) => {
        btn.disabled = !enabled;
        btn.classList.toggle("active", btn.dataset.mode === (isAi ? "ai" : "manual"));
      });
    }

    const inputWrap = $("promotionCtaInput");
    const aiPlaceholder = $("promotionCtaAiPlaceholder");
    if (inputWrap) inputWrap.style.display = enabled && !isAi ? "" : "none";
    if (aiPlaceholder) {
      aiPlaceholder.style.display = !enabled || isAi ? "" : "none";
      aiPlaceholder.textContent = !enabled ? "사용 안 함" : "AI가 자동으로 생성합니다";
    }

    const section = $("promotionCtaSection");
    if (section) section.classList.toggle("promo-field-disabled", !enabled && !isEnabled(state.qrEnabled));
  }

  function syncQrCodeUI() {
    const enabled = isEnabled(state.qrEnabled);
    const checkbox = $("promotionQrEnabled");
    const urlWrap = $("promotionQrUrlWrap");
    const urlInput = $("promotionQrUrl");

    if (checkbox) checkbox.checked = enabled;
    if (urlWrap) urlWrap.style.display = enabled ? "" : "none";
    if (urlInput) urlInput.disabled = !enabled;

    const section = $("promotionCtaSection");
    if (section) section.classList.toggle("promo-field-disabled", !isEnabled(state.ctaEnabled) && !enabled);
  }

  function syncPosterOfferToggleUI() {
    const enabled = isEnabled(state.posterOfferEnabled);
    const isAi = state.posterOfferMode !== "manual";

    const checkbox = root.querySelector(".promo-ai-toggle-enabled[data-toggle-field='posterOffer']");
    if (checkbox) checkbox.checked = enabled;

    const modeBtns = $("promotionPosterOfferModeBtns");
    if (modeBtns) {
      modeBtns.classList.toggle("disabled", !enabled);
      modeBtns.querySelectorAll("[data-toggle-mode='posterOffer']").forEach((btn) => {
        btn.disabled = !enabled;
        btn.classList.toggle("active", btn.dataset.mode === (isAi ? "ai" : "manual"));
      });
    }

    const inputWrap = $("promotionPosterOfferInput");
    const aiPlaceholder = $("promotionPosterOfferAiPlaceholder");
    if (inputWrap) inputWrap.style.display = enabled && !isAi ? "" : "none";
    if (aiPlaceholder) {
      aiPlaceholder.style.display = !enabled || isAi ? "" : "none";
      aiPlaceholder.textContent = !enabled ? "사용 안 함" : "AI가 자동으로 생성합니다";
    }

    const section = $("promotionPosterOfferSection");
    if (section) section.classList.toggle("promo-field-disabled", !enabled);
  }

  function syncSnsHookToggleUI() {
    const enabled = isEnabled(state.snsHookEnabled);
    const isAi = state.snsHookMode !== "manual";

    const checkbox = root.querySelector(".promo-ai-toggle-enabled[data-toggle-field='snsHook']");
    if (checkbox) checkbox.checked = enabled;

    const modeBtns = $("promotionSnsHookModeBtns");
    if (modeBtns) {
      modeBtns.classList.toggle("disabled", !enabled);
      modeBtns.querySelectorAll("[data-toggle-mode='snsHook']").forEach((btn) => {
        btn.disabled = !enabled;
        btn.classList.toggle("active", btn.dataset.mode === (isAi ? "ai" : "manual"));
      });
    }

    const inputWrap = $("promotionSnsHookInput");
    const aiPlaceholder = $("promotionSnsHookAiPlaceholder");
    if (inputWrap) inputWrap.style.display = enabled && !isAi ? "" : "none";
    if (aiPlaceholder) {
      aiPlaceholder.style.display = !enabled || isAi ? "" : "none";
      aiPlaceholder.textContent = !enabled ? "사용 안 함" : "AI가 자동으로 생성합니다";
    }

    const section = $("promotionSnsHookSection");
    if (section) section.classList.toggle("promo-field-disabled", !enabled);
  }

  function syncSnsHashtagsToggleUI() {
    const enabled = isEnabled(state.snsHashtagsEnabled);
    const isAi = state.snsHashtagsMode !== "manual";

    const checkbox = root.querySelector(".promo-ai-toggle-enabled[data-toggle-field='snsHashtags']");
    if (checkbox) checkbox.checked = enabled;

    const modeBtns = $("promotionSnsHashtagsModeBtns");
    if (modeBtns) {
      modeBtns.classList.toggle("disabled", !enabled);
      modeBtns.querySelectorAll("[data-toggle-mode='snsHashtags']").forEach((btn) => {
        btn.disabled = !enabled;
        btn.classList.toggle("active", btn.dataset.mode === (isAi ? "ai" : "manual"));
      });
    }

    const inputWrap = $("promotionSnsHashtagsInput");
    const aiPlaceholder = $("promotionSnsHashtagsAiPlaceholder");
    if (inputWrap) inputWrap.style.display = enabled && !isAi ? "" : "none";
    if (aiPlaceholder) {
      aiPlaceholder.style.display = !enabled || isAi ? "" : "none";
      aiPlaceholder.textContent = !enabled ? "사용 안 함" : "AI가 자동으로 생성합니다";
    }

    const section = $("promotionSnsHashtagsSection");
    if (section) section.classList.toggle("promo-field-disabled", !enabled);
  }

  function syncToggleFieldUI(fieldKey) {
    const enabled = isEnabled(state[`${fieldKey}Enabled`]);
    const isAi = state[`${fieldKey}Mode`] !== "manual";
    const fieldCamel = fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1);

    const checkbox = root.querySelector(`.promo-ai-toggle-enabled[data-toggle-field='${fieldKey}']`);
    if (checkbox) checkbox.checked = enabled;

    const modeBtns = $(`promotion${fieldCamel}ModeBtns`);
    if (modeBtns) {
      modeBtns.classList.toggle("disabled", !enabled);
      modeBtns.querySelectorAll(`[data-toggle-mode='${fieldKey}']`).forEach((btn) => {
        btn.disabled = !enabled;
        btn.classList.toggle("active", btn.dataset.mode === (isAi ? "ai" : "manual"));
      });
    }

    const inputWrap = $(`promotion${fieldCamel}Input`);
    const aiPlaceholder = $(`promotion${fieldCamel}AiPlaceholder`);
    if (inputWrap) inputWrap.style.display = enabled && !isAi ? "" : "none";
    if (aiPlaceholder) {
      aiPlaceholder.style.display = !enabled || isAi ? "" : "none";
      aiPlaceholder.textContent = !enabled ? "사용 안 함" : "AI가 자동으로 생성합니다";
    }

    const inputNode = $(`promotion${fieldCamel}`);
    if (inputNode) {
      const section = inputNode.closest(".gen-config-group");
      if (section) section.classList.toggle("promo-field-disabled", !enabled);
    }
  }

  function syncStaticFields() {
    root.querySelectorAll("[data-promo-field]").forEach((input) => {
      const value = state[input.dataset.promoField] ?? "";
      if (input.type === "checkbox") {
        input.checked = isEnabled(value);
      } else if (input.value !== value) {
        input.value = value;
      }
    });

    const outputLanguageSelect = $("promotionOutputLanguage");
    if (outputLanguageSelect && outputLanguageSelect.value !== state.outputLanguage) {
      outputLanguageSelect.value = state.outputLanguage;
    }

    const promptModeSelect = $("promotionPromptMode");
    if (promptModeSelect && promptModeSelect.value !== state.promptMode) {
      promptModeSelect.value = state.promptMode;
    }

    const commercialBaselineSelect = $("promotionCommercialBaseline");
    if (commercialBaselineSelect && commercialBaselineSelect.value !== state.commercialBaseline) {
      commercialBaselineSelect.value = state.commercialBaseline;
    }

    const creativityLevelSelect = $("promotionCreativityLevel");
    if (creativityLevelSelect && creativityLevelSelect.value !== state.creativityLevel) {
      creativityLevelSelect.value = state.creativityLevel;
    }

    const bigIdeaInput = $("promotionBigIdea");
    if (bigIdeaInput && bigIdeaInput.value !== state.bigIdea) {
      bigIdeaInput.value = state.bigIdea;
    }

    const visualMetaphorInput = $("promotionVisualMetaphor");
    if (visualMetaphorInput && visualMetaphorInput.value !== state.visualMetaphor) {
      visualMetaphorInput.value = state.visualMetaphor;
    }

    [
      { id: "promotionOmitEmptyFields", value: state.omitEmptyFields },
      { id: "promotionDedupePromptLines", value: state.dedupePromptLines },
      { id: "promotionAutoResolveConflicts", value: state.autoResolveConflicts },
    ].forEach(({ id, value }) => {
      const input = $(id);
      if (input) input.checked = isEnabled(value);
    });

    document.querySelectorAll("[data-promo-variation]").forEach((btn) => {
      const active = btn.dataset.promoVariation === state.variationMode;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });

    document.querySelectorAll(".promo-type-tab").forEach((button) => {
      const active = button.dataset.promoAsset === state.assetType;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });

    root.querySelectorAll("[data-promo-content-type]").forEach((button) => {
      const active = button.dataset.promoContentType === state.contentType;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    root.querySelectorAll("[data-promo-output-language]").forEach((button) => {
      if (button.tagName !== "BUTTON") return;
      const active = normalizeOutputLanguage(button.dataset.promoOutputLanguage) === state.outputLanguage;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    root.querySelectorAll("[data-promo-prompt-mode]").forEach((button) => {
      if (button.tagName !== "BUTTON") return;
      const active = (button.dataset.promoPromptMode === "optimized" ? "optimized" : "review") === state.promptMode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    root.querySelectorAll("[data-promo-commercial-baseline]").forEach((button) => {
      if (button.tagName !== "BUTTON") return;
      const active = button.dataset.promoCommercialBaseline === state.commercialBaseline;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    root.querySelectorAll("[data-promo-creativity-level]").forEach((button) => {
      if (button.tagName !== "BUTTON") return;
      const active = button.dataset.promoCreativityLevel === state.creativityLevel;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    syncSizeModeUI();
    syncColorFieldUI();
    syncQuickButtonStates(root);
    syncCtaToggleUI();
    syncQrCodeUI();
    syncPosterOfferToggleUI();
    syncSnsHookToggleUI();
    syncSnsHashtagsToggleUI();
    syncAntiAiPresetUI();
    syncToggleFieldUI("tone");
    syncToggleFieldUI("bigIdea");
    syncToggleFieldUI("visualMetaphor");
    syncToggleFieldUI("visualStyle");
    syncToggleFieldUI("layoutComposition");
  }

  function resetAll() {
    assignState(DEFAULT_STATE);
    visitedAssetTypes = new Set([DEFAULT_STATE.assetType]);
    promptDraft = "";
    promptDirty = false;
    syncStaticFields();
    renderTypeFields();
    renderPreview();
    status("홍보이미지 입력값을 초기화했습니다.", "info");
  }

  function setAssetType(nextType) {
    if (!ASSET_LABELS[nextType]) return;
    state.assetType = nextType;
    if (!visitedAssetTypes.has(nextType)) {
      applyAssetDefaults(nextType);
      visitedAssetTypes.add(nextType);
    }
    syncStaticFields();
    renderTypeFields();
    renderPreview();
    status(`${ASSET_LABELS[nextType]} 모드로 전환했습니다.`, "info");
  }

  function getSelectedSampleProfile() {
    return CONTENT_TYPE_SAMPLE_PROFILES[state.contentType] || CONTENT_TYPE_SAMPLE_PROFILES.none;
  }

  function applySampleProfile(profile) {
    if (!profile) return;

    assignState({
      ...state,
      ...profile.state,
      colorStrategy: state.colorStrategy,
    });

    if (!isAiColorStrategy() && profile.paletteId) {
      applyPaletteSnapshot(findPaletteById(profile.paletteId));
    }

    Object.entries(profile.quickFields || {}).forEach(([fieldId, values]) => {
      setPresetFieldValues(fieldId, values);
    });

    promptDirty = false;
    syncStaticFields();
    renderTypeFields();
    renderPreview();
  }

  function applySample() {
    if (state.assetType !== "image") return;

    const profile = getSelectedSampleProfile();
    const contentName = state.contentType === "none"
      ? "기본 홍보 이미지"
      : (CONTENT_TYPE_TEMPLATES[state.contentType]?.name || "선택한 템플릿");

    applySampleProfile(profile);
    status(`${contentName} 샘플을 적용했습니다. 프리셋이 있는 항목은 현재 화면에 보이는 프리셋 안에서만 채웠습니다.`, "success");
  }

  function applyRandomPresets() {
    if (state.assetType === "image") {
      const selectedPalette = !isAiColorStrategy() && colorPresets.length
        ? colorPresets[Math.floor(Math.random() * colorPresets.length)]
        : null;
      if (selectedPalette) {
        applyPaletteSnapshot(selectedPalette);
      }

      UNIFIED_RANDOMIZABLE_PRESET_FIELDS.forEach((fieldId) => {
        const options = getQuickButtonOptions(fieldId);
        if (!options.length) return;
        const { min, max } = randomFieldSelectionCount(fieldId);
        setPresetFieldValues(fieldId, pickRandomSubset(options, min, max));
      });

      promptDirty = false;
      syncStaticFields();
      renderTypeFields();
      renderPreview();
      status("이미지 규격과 직접 노출 텍스트는 유지하고, 프리셋 항목만 랜덤 적용했습니다.", "success");
      return;
    }
  }

  function createSnapshot() {
    return {
      schemaVersion: PROMOTION_SCHEMA_VERSION,
      mode: "promotion",
      savedAt: new Date().toISOString(),
      promotionState: deepClone(state),
      promptDraft,
      promptDirty,
    };
  }

  function saveSettings() {
    const data = createSnapshot();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `promotion_settings_${new Date().getTime()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    status("홍보이미지 설정을 저장했습니다.", "success");
  }

  function migratePromotionData(data) {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid promotion settings");
    }

    const promotionState =
      data.mode === "promotion" && data.promotionState
        ? data.promotionState
        : data.promotionState || data;

    return {
      schemaVersion: Number(data.schemaVersion) || PROMOTION_SCHEMA_VERSION,
      mode: "promotion",
      savedAt: data.savedAt || new Date().toISOString(),
      promotionState: normalizePromotionState(promotionState),
    };
  }

  function applyLoadedSettings(data) {
    assignState(data.promotionState);
    promptDraft = typeof data.promptDraft === "string" ? data.promptDraft : "";
    promptDirty = Boolean(data.promptDirty && promptDraft);
    visitedAssetTypes.add(state.assetType);
    syncStaticFields();
    renderTypeFields();
    renderPreview();
  }

  function loadSettings() {
    $("promotionLoadInput")?.click();
  }

  async function writeTextToClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const fallback = document.createElement("textarea");
    fallback.value = text;
    fallback.setAttribute("readonly", "");
    fallback.style.position = "fixed";
    fallback.style.top = "-9999px";
    document.body.appendChild(fallback);
    fallback.focus();
    fallback.select();
    const copied = document.execCommand("copy");
    fallback.remove();
    if (!copied) {
      throw new Error("Clipboard fallback failed");
    }
    return true;
  }

  function getCurrentPromptText() {
    const preview = $("promotionPromptPreview");
    if (preview && typeof preview.value === "string") {
      return preview.value;
    }
    return promptDraft || buildPromptPreview(validateState());
  }

  function resetPromptDraft() {
    promptDirty = false;
    promptDraft = buildPromptPreview(validateState());
    renderPreview();
    status("자동 생성된 프롬프트 초안을 다시 반영했습니다.", "info");
  }

  async function copyPrompt() {
    const validation = validateState();
    const promptText = getCurrentPromptText();

    try {
      await writeTextToClipboard(promptText);
      if (validation.errors.length) {
        status("입력 보완 필요 항목이 포함된 현재 초안을 복사했습니다.", "success");
      } else if (promptDirty) {
        status("직접 편집한 프롬프트 초안을 클립보드에 복사했습니다.", "success");
      } else {
        status("홍보이미지 프롬프트를 클립보드에 복사했습니다.", "success");
      }
    } catch (error) {
      status("클립보드 복사에 실패했습니다.", "error");
    }
  }

  function bindPromptEditor() {
    const preview = $("promotionPromptPreview");
    if (!preview) return;

    preview.addEventListener("input", () => {
      const autoPrompt = buildPromptPreview(validateState());
      promptDraft = preview.value;
      promptDirty = preview.value !== autoPrompt;
      persistDraft();
      const previewBadge = $("promotionPreviewBadge");
      if (previewBadge && promptDirty) {
        previewBadge.textContent = "직접 편집 중";
      } else if (previewBadge && !promptDirty) {
        renderPreview();
      }
    });
  }

  function bindTabs() {
    document.querySelectorAll(".promo-type-tab").forEach((button) => {
      button.addEventListener("click", () => {
        setAssetType(button.dataset.promoAsset);
      });
    });
  }

  function bindAntiAiPresetBtns() {
    const container = root.querySelector(".anti-ai-preset-btns");
    if (!container) return;
    container.querySelectorAll(".anti-ai-preset-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const selectedId = button.dataset.antiAiPreset;
        if (state.antiAiStyle === selectedId) {
          state.antiAiStyle = "general";
        } else {
          state.antiAiStyle = selectedId;
        }
        promptDirty = false;
        syncAntiAiPresetUI();
        renderPreview();
      });
    });
  }

  function bindStaticInputs() {
    bindFieldInputs(root);
    bindQuickButtons(root);
    bindAntiAiPresetBtns();
    bindAiToggleControls(root);
  }

  function bindLoadInput() {
    $("promotionLoadInput")?.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        try {
          const parsed = JSON.parse(loadEvent.target.result);
          const migrated = migratePromotionData(parsed);
          applyLoadedSettings(migrated);
          status("홍보이미지 설정을 불러왔습니다.", "success");
        } catch (error) {
          status("올바르지 않은 홍보이미지 설정 파일입니다.", "error");
        }
        event.target.value = "";
      };
      reader.readAsText(file);
    });
  }

  function applyStep5ChoiceTaxonomy() {
    const step = $("promotionStepConstraints");
    if (!step) return;

    const setText = (selector, text) => {
      const node = step.querySelector(selector);
      if (node) node.textContent = text;
    };
    const setHtml = (selector, html) => {
      const node = step.querySelector(selector);
      if (node) node.innerHTML = html;
    };
    const setOptions = (selectId, labels) => {
      const select = $(selectId);
      if (!select) return;
      Array.from(select.options).forEach((option) => {
        if (labels[option.value]) option.textContent = labels[option.value];
      });
    };
    const setSegmentLabels = (selector, labels, dataKey) => {
      step.querySelectorAll(selector).forEach((button) => {
        const value = button.dataset[dataKey];
        if (labels[value]) button.textContent = labels[value];
      });
    };

    setText(".promo-step-copy small", "피해야 할 요소, 상업 완성도.");
    setText("label[for='promotionForbiddenElements'] + .gen-config-guide", "다른 단계에서 이미 지정한 색상, 배경, 액션버튼, 배치가 아니라 제외할 표현만 적습니다.");


    setHtml("label[for='promotionCommercialBaseline']", `상업 완성도 기준 <span class="promo-field-badge instruction">품질 단계</span>`);
    setText("label[for='promotionCommercialBaseline'] + .promo-control-hint", "내용·색상·배치가 아니라 결과물의 마감 밀도를 정합니다. 보통 premium이 적합합니다.");
    setOptions("promotionCommercialBaseline", { off: "기본", standard: "실무형", premium: "프리미엄", luxury: "하이엔드" });
    setSegmentLabels("[data-promo-commercial-baseline]", { off: "기본", standard: "실무형", premium: "프리미엄", luxury: "하이엔드" }, "promoCommercialBaseline");

    setHtml("label[for='promotionCreativityLevel']", `구성 실험 강도 <span class="promo-field-badge instruction">위험도</span>`);
    setText("label[for='promotionCreativityLevel'] + .promo-control-hint", "색상이나 스타일이 아니라 화면 구성의 실험 폭만 조절합니다. 보통 balanced가 안정적입니다.");
    setOptions("promotionCreativityLevel", { stable: "안정형", balanced: "균형형", experimental: "실험형" });
    setSegmentLabels("[data-promo-creativity-level]", { stable: "안정형", balanced: "균형형", experimental: "실험형" }, "promoCreativityLevel");

    setText("label[for='promotionQualityNotes']", "결과물 결함 방지");
    setText("label[for='promotionQualityNotes'] + .gen-config-guide", "내용 추가나 배치 지시가 아니라 텍스트 깨짐, 저해상도, 왜곡, 노이즈 같은 산출물 결함만 지정합니다.");
    const qualityContainer = step.querySelector(".promo-quick-btns[data-quick-for='promotionQualityNotes']");
    if (qualityContainer) {
      qualityContainer.innerHTML = STEP5_QUALITY_OPTIONS
        .map((item) => `<button type="button" class="btn-quick">${escapeHtml(item)}</button>`)
        .join("");
    }
    const qualityInput = $("promotionQualityNotes");
    if (qualityInput) {
      qualityInput.placeholder = "예: 텍스트 가장자리는 선명하게, 작은 글자는 번짐 없이, 인물 얼굴과 손가락 왜곡 방지";
    }
  }

  function replaceQuickButtons(container, values) {
    if (!container) return;
    container.innerHTML = values
      .map((item) => `<button type="button" class="btn-quick">${escapeHtml(item)}</button>`)
      .join("");
  }

  function applyActionCtaQrHierarchy() {
    const section = $("promotionCtaSection");
    if (!section) return;
    section.classList.add("gen-config-group-wide", "promo-action-choice-section");
    section.innerHTML = `
      <div class="promo-action-choice-grid">
        <div class="promo-action-choice-card" id="promotionCtaChoiceCard">
          <div class="gen-config-label-row">
            <label class="gen-config-label" for="promotionCta">엑션버튼(CTA) <span class="promo-field-badge visible">이미지 텍스트</span></label>
            <div class="promo-ai-toggle-header">
              <label class="promo-ai-toggle-switch" title="사용 여부">
                <input type="checkbox" class="promo-ai-toggle-enabled" data-toggle-field="cta" checked />
                <span class="promo-ai-toggle-track"></span>
              </label>
              <div class="promo-ai-mode-btns" id="promotionCtaModeBtns">
                <button type="button" class="promo-ai-mode-btn active" data-toggle-mode="cta" data-mode="ai">AI 자동</button>
                <button type="button" class="promo-ai-mode-btn" data-toggle-mode="cta" data-mode="manual">직접 입력</button>
              </div>
            </div>
          </div>
          <p class="gen-config-guide">사용자가 마지막에 어떤 행동을 하길 원하는지 명확히 적습니다.</p>
          <div id="promotionCtaInput" style="display:none">
            <input id="promotionCta" class="gen-input-text" type="text" data-promo-field="cta" placeholder="예: 지금 신청하기" />
          </div>
          <div id="promotionCtaAiPlaceholder" class="promo-ai-placeholder">AI가 자동으로 생성합니다</div>
        </div>
        <div class="promo-action-choice-card" id="promotionQrChoiceCard">
          <div class="gen-config-label-row">
            <label class="gen-config-label" for="promotionQrEnabled">QR코드 <span class="promo-field-badge instruction">연결 안내</span></label>
            <label class="promo-qr-toggle">
              <input type="checkbox" id="promotionQrEnabled" data-promo-field="qrEnabled" />
              <span>사용</span>
            </label>
          </div>
          <p class="gen-config-guide">실제 연결 가능한 QR코드는 정확히 생성되지 않을 수 있어, 최종 제작 시 실제 QR 이미지를 별도로 삽입하는 것을 권장합니다.</p>
          <div id="promotionQrUrlWrap" class="promo-qr-url-wrap" style="display:none">
            <label class="gen-config-label" for="promotionQrUrl">QR코드 연결 주소</label>
            <input id="promotionQrUrl" class="gen-input-text" type="url" data-promo-field="qrUrl" placeholder="예: https://example.com/apply" />
            <p class="gen-hint">프롬프트에는 QR코드 공간 배정과 안내문구가 추가됩니다.</p>
          </div>
        </div>
      </div>
    `;
  }

  function applyStep3ChoiceTaxonomy() {
    const step = $("promotionStepVisual");
    if (!step) return;
    const setText = (selector, text) => {
      const node = step.querySelector(selector);
      if (node) node.textContent = text;
    };
    const setHtml = (selector, html) => {
      const node = step.querySelector(selector);
      if (node) node.innerHTML = html;
    };

    setText(".promo-step-copy strong", "비주얼 방향");
    setText(".promo-step-copy small", "전체 아이디어를 먼저 고르고, 톤·상징·표현방식만 짧게 보완합니다.");

    const body = step.querySelector(".promo-step-body");
    if (body && !$("promotionVisualIdeaPresets")) {
      body.insertAdjacentHTML("afterbegin", `
        <section class="gen-config-group gen-config-group-wide promo-visual-preset-panel" id="promotionVisualIdeaPresets">
          <label class="gen-config-label">아이디어 빠른 선택</label>
          <p class="gen-config-guide">하나를 고르면 톤, 핵심 개념, 비주얼 은유, 스타일이 함께 정리됩니다. 이후 세부 항목은 직접 수정할 수 있습니다.</p>
          <div class="promo-visual-preset-grid">
            ${STEP3_IDEA_PRESETS.map((preset) => `
              <button type="button" class="promo-visual-preset-btn" data-visual-idea-preset="${escapeHtml(preset.id)}">
                <strong>${escapeHtml(preset.label)}</strong>
                <span>${escapeHtml(preset.desc)}</span>
              </button>
            `).join("")}
          </div>
        </section>
      `);
    }

    const subgroupLabels = step.querySelectorAll(".promo-visual-subgroup-label");
    const subgroupDescs = step.querySelectorAll(".promo-visual-subgroup-desc");
    if (subgroupLabels[0]) subgroupLabels[0].textContent = "아이디어";
    if (subgroupDescs[0]) subgroupDescs[0].textContent = "무드와 상징을 선택합니다";
    if (subgroupLabels[1]) subgroupLabels[1].textContent = "표현 방식";
    if (subgroupDescs[1]) subgroupDescs[1].textContent = "그래픽 스타일만 선택합니다";

    setText("label[for='promotionTone']", "톤");
    setText("label[for='promotionTone'] + .gen-config-guide", "브랜드가 전달해야 할 감정만 짧게 고릅니다.");
    replaceQuickButtons(step.querySelector(".promo-quick-btns[data-quick-for='promotionTone']"), STEP3_VISUAL_OPTION_GROUPS.tone);

    setHtml("label[for='promotionBigIdea']", `핵심 개념 <span class="promo-field-badge instruction">아이디어</span>`);
    setText("label[for='promotionBigIdea'] + .gen-config-guide", "이미지 한 장이 말해야 할 중심 아이디어를 고릅니다.");
    replaceQuickButtons(step.querySelector(".promo-quick-btns[data-quick-for='promotionBigIdea']"), STEP3_VISUAL_OPTION_GROUPS.bigIdea);

    setHtml("label[for='promotionVisualMetaphor']", `상징 장면 <span class="promo-field-badge instruction">아이디어</span>`);
    setText("label[for='promotionVisualMetaphor'] + .gen-config-guide", "직접 설명 대신 이미지로 보여줄 장면을 1개만 고릅니다.");
    replaceQuickButtons(step.querySelector(".promo-quick-btns[data-quick-for='promotionVisualMetaphor']"), STEP3_VISUAL_OPTION_GROUPS.visualMetaphor);

    setText("label[for='promotionVisualStyle']", "표현 스타일");
    setText("label[for='promotionVisualStyle'] + .gen-config-guide", "색상과 배경은 4단계에서 정하고, 여기서는 표현 방식만 고릅니다.");
    replaceQuickButtons(step.querySelector(".promo-quick-btns[data-quick-for='promotionVisualStyle']"), STEP3_VISUAL_OPTION_GROUPS.visualStyle);

    $("promotionBigIdea")?.setAttribute("data-promo-field", "bigIdea");
    $("promotionVisualMetaphor")?.setAttribute("data-promo-field", "visualMetaphor");
  }

  function bindStep3IdeaPresets() {
    root.querySelectorAll("[data-visual-idea-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        const preset = STEP3_IDEA_PRESETS.find((item) => item.id === button.dataset.visualIdeaPreset);
        if (!preset) return;
        Object.entries(preset.fields).forEach(([key, value]) => {
          state[key] = value;
        });
        promptDirty = false;
        syncStaticFields();
        syncQuickButtonStates(root);
        renderPreview();
      });
    });
  }

  function init() {
    attachStaticFieldBadges();
    applyActionCtaQrHierarchy();
    applyStep3ChoiceTaxonomy();
    applyStep5ChoiceTaxonomy();
    loadColorPresets();
    renderColorPresetOptions();
    loadSizePresets();
    renderSizePresetList();
    bindSizePresetControls();
    bindTabs();
    bindTemplateCards();
    bindStaticInputs();
    bindOptimizationControls();
    bindColorPickers();
    bindColorClearButtons();
    bindStep3IdeaPresets();
    bindLoadInput();
    bindPromptEditor();
    bindWarningModalEvents();
    $("promotionSampleBtn")?.addEventListener("click", applySample);
    $("promotionRandomPresetBtn")?.addEventListener("click", applyRandomPresets);
    $("promotionSaveBtn")?.addEventListener("click", saveSettings);
    $("promotionLoadBtn")?.addEventListener("click", loadSettings);
    $("promotionPaletteSaveBtn")?.addEventListener("click", saveCurrentPalettePreset);
    $("promotionPaletteApplyBtn")?.addEventListener("click", applySelectedPalettePreset);
    $("promotionPalettePresetSelect")?.addEventListener("change", () => applySelectedPalettePreset({ silent: true }));
    $("promotionPaletteDeleteBtn")?.addEventListener("click", deleteSelectedPalettePreset);
    $("promotionResetBtn")?.addEventListener("click", resetAll);
    $("promotionPruneEmptyBtn")?.addEventListener("click", pruneEmptyFields);
    $("promotionResetTextBtn")?.addEventListener("click", resetTextFields);
    $("promotionResetStyleBtn")?.addEventListener("click", resetStyleFields);
    $("promotionResetColorsBtn")?.addEventListener("click", resetColorFields);
    $("promotionReapplyTemplateBtn")?.addEventListener("click", reapplyCurrentTemplate);
    $("promotionOptimizePromptBtn")?.addEventListener("click", rerunOptimization);
    $("promotionCopyPromptBtn")?.addEventListener("click", copyPrompt);
    $("promotionResetPromptBtn")?.addEventListener("click", resetPromptDraft);

    restoreDraft();
    visitedAssetTypes = new Set([state.assetType]);
    syncStaticFields();
    renderTypeFields();
    renderPreview();
  }

  window.applyPromotionConceptStyle = function (style) {
    if (!style) return;

    state.colorStrategy = "manual";

    // 컨셉 제안 스타일은 왼쪽 패널의 '표현 스타일' 인풋을 수정하지 않고
    // 독립적인 상태 변수 appliedConceptStyle에 직접 저장하여 우측 프롬프트에만 렌더링되게 처리
    state.appliedConceptStyle = style.prompt;

    if (style.palette && style.palette.length > 0) {
      state.primaryColor = style.palette[0] || "";
      state.secondaryColor = style.palette[1] || "";
      state.accentColor = style.palette[2] || "";
      state.backgroundMode = "solid";
      state.backgroundColor = style.palette[4] || style.palette[3] || "";

      // 5가지 색상이 모두 AI에게 전달되도록 전체 팔레트 목록을 배경 지시사항에 함께 기록
      const colorList = style.palette.join(", ");
      state.backgroundDetails = `${style.nameKo} 스타일 배경 (전체 색상 팔레트: ${colorList}). ${style.desc || ""}`;
    }

    promptDirty = false;
    syncStaticFields();
    renderPreview();

    status(`'${style.nameKo}' 콘셉트 스타일과 5가지 색상이 모두 적용되었습니다.`, "success");
  };

  init();
})();
