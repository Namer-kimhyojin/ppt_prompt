(function () {
  const root = document.getElementById("panePromotion");
  if (!root) return;

  const $ = (id) => document.getElementById(id);

  const PROMOTION_SCHEMA_VERSION = 1;
  const PROMOTION_DRAFT_STORAGE_KEY = "promptdeck-promotion-draft-v1";
  const PROMOTION_COLOR_PRESETS_KEY = "promptdeck-promotion-color-presets-v1";
  const PROMOTION_SIZE_PRESETS_KEY = "promptdeck-promotion-size-presets-v1";
  const ASSET_TYPES = ["image"];
  const CONTENT_TYPE_VALUES = ["none", "event", "contest", "training", "demand-survey", "survey"];
  const COLOR_STRATEGY_VALUES = ["manual", "ai"];

  const ASSET_DEFAULTS = {
    image: {
      contentType: "event",
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
    visualStyle: "",
    antiAiStyle: "",
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
    posterInfoLayout: "",
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
    snsPlacementNotes: "",
    ctaEnabled: "true",
    ctaMode: "ai",
    bigIdea: "",
    visualMetaphor: "",
    variationMode: "none",
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
    commercialBaseline: "상업 품질 기준",
    creativityLevel: "창의성 강도",
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
    cta: "CTA",
    tone: "브랜드 톤",
    visualStyle: "비주얼 스타일",
    antiAiStyle: "AI 느낌 억제",
    qualityNotes: "품질 보정 지시",
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
    cta: "CTA",
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
      "모던한",
      "역동적인",
      "친근한",
      "미니멀한",
      "전문적인",
      "고급스러운",
      "심플한",
      "프리미엄",
      "스마트한",
      "따뜻한",
      "임팩트 있는",
      "차분한",
      "세련된",
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
      "연결",
      "돌파",
      "신뢰",
      "전환",
      "미래",
      "참여",
      "속도",
    ],
    visualMetaphor: [
      "유리 큐브",
      "빛의 축",
      "데이터 흐름",
      "프레임 돌출",
      "구조물 교차",
      "레이어 겹침",
    ],
  };

  const DEFAULT_QUALITY_TAGS = {
    ko: [
      "광고 이미지급 고해상도 품질",
      "텍스트와 배경 대비 선명",
      "텍스트 가장자리 또렷함",
      "픽셀 깨짐 없음",
      "썸네일 축소 시에도 핵심 문구 가독성 유지",
    ],
    en: [
      "advertising-grade high-resolution quality",
      "strong text-to-background contrast",
      "crisp text edges",
      "no pixelation",
      "headline legible at thumbnail size",
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

  const AI_TOGGLE_FIELDS = new Set(["posterOffer", "snsHook", "snsHashtags", "cta"]);

  const ANTI_AI_PRESETS = [
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
    event: {
      name: "행사 개최 안내",
      goal: "행사 인지도 제고 및 참가 유도",
      audience: "잠재 참가자, 관련 업계 종사자, 일반 시민",
      tone: "신뢰감, 전문적인, 역동적, 축제 분위기",
      visualStyle: "대담한 타이포그래픽, 실사 위주, 매거진 편집형, 화려한 포인트 컬러",
      qualityNotes: "고대비 가독성, 행사 핵심 정보(일시/장소) 시각적 위계 강조, 광고 이미지급 디테일",
      mandatoryElements: "행사명, 일시, 장소, 신청 방법, 주최/주관 로고 영역",
      forbiddenElements: "장황한 텍스트, 흐릿한 배경 이미지, 불명확한 CTA",
      posterKeyVisual: "행사 주제를 상징하는 오브젝트 또는 현장감 넘치는 실사 이미지",
      posterInfoLayout: "상단 헤드라인 고정, 하단 정보 카드 배치",
      cardnewsFlow: "행사 취지 → 프로그램 핵심 → 참가 혜택 → 신청 안내(CTA)",
      snsVisualFocus: "행사 타이틀과 일시가 가장 먼저 보이도록 중앙 집중형 배치",
    },
    contest: {
      name: "공모사업 홍보",
      goal: "공모전 참여 및 제안서 접수 유도",
      audience: "대학생, 스타트업, 예비 창업자, 창작자 그룹",
      tone: "창의적인, 세련된, 임팩트 있는, 도전적인",
      visualStyle: "3D 그래픽, 플랫 디자인, 네온 무드, 기하학적 패턴 활용",
      qualityNotes: "공모 주제의 상징성 부각, 상금/혜택 수치를 큰 폰트로 강조, 타이포 가장자리 또렷하게",
      mandatoryElements: "공모 주제, 시상 내역, 접수 기간, 홈페이지 URL, 참가 자격",
      forbiddenElements: "촌스러운 원색 그라데이션, 작은 수치 표기, 올드한 스톡 이미지",
      posterKeyVisual: "도전과 창의성을 나타내는 기하학적 3D 오브젝트",
      posterInfoLayout: "Z자 흐름 레이아웃, 시상 내역을 중앙에 배치",
      cardnewsFlow: "공모 배경 → 주제 및 상금 → 참가 방법 → 접수 마감 강조",
      snsVisualFocus: "총 상금 규모와 '접수 중' 배지가 시선을 끌도록 배치",
    },
    training: {
      name: "교육생 모집",
      goal: "교육 과정 신청 및 인원 확보",
      audience: "취업 준비생, 스킬업 희망 실무자, 대학 졸업 예정자",
      tone: "친근한, 전문적인, 스마트한, 미래지향적",
      visualStyle: "인포그래픽형, 인물 클로즈업(밝은 미소), 미니멀 그리드형, 블루/그린 계열의 신뢰감 있는 색상",
      qualityNotes: "커리큘럼 가독성 최우선, 모집 마감일 임팩트 있게 처리, 인물 피부톤 자연스럽게",
      mandatoryElements: "교육 과정명, 교육 기간, 신청 자격, 모집 마감일, 교육 혜택(수강료 등)",
      forbiddenElements: "복잡한 도표, 어두운 인물 사진, 가독성 낮은 명조체 본문",
      posterKeyVisual: "성장과 배움을 상징하는 상징물 또는 밝은 표정의 학습자 이미지",
      posterInfoLayout: "좌측 텍스트 강조, 우측 비주얼 배치 (또는 상하 분할)",
      cardnewsFlow: "고민/니즈 공감 → 교육 해결책 → 커리큘럼 요약 → 수강생 후기 → 신청",
      snsVisualFocus: "교육 명칭과 '전액 무료' 등 핵심 혜택을 최상단 배치",
    },
    "demand-survey": {
      name: "수요조사 안내",
      goal: "시장 요구 사항 파악 및 데이터 수집",
      audience: "해당 서비스 사용자, 특정 산업군 종사자, 타깃 고객층",
      tone: "차분한, 전문적인, 미니멀, 정중한",
      visualStyle: "데이터 중심 레이아웃, 글래스모피즘, 깔끔한 인터페이스 느낌, 화이트/그레이 중심",
      qualityNotes: "조사 참여의 가치 강조, 답변 소요 시간 명확히 표기, 노이즈 없는 깨끗한 화면",
      mandatoryElements: "조사 목적, 참여 혜택, 예상 소요 시간, 참여 링크(QR)",
      forbiddenElements: "화려한 장식, 산만한 배경 패턴, 이모지 과다 사용",
      posterKeyVisual: "데이터 분석, 설문지, 또는 추상적인 연결망 그래픽",
      posterInfoLayout: "중앙 집중형, 깔끔한 박스 레이아웃",
      cardnewsFlow: "조사 취지 → 참여 필요성 → 참여 방법 및 혜택 → 감사 메시지",
      snsVisualFocus: "참여 혜택(기프티콘 등)을 시각적으로 가장 강조",
    },
    survey: {
      name: "설문조사 참여",
      goal: "사용자 피드백 수집 및 참여 독려",
      audience: "기존 고객, 서비스 이용자, 일반 대중",
      tone: "친근한, 심플한, 따뜻한, 가벼운",
      visualStyle: "일러스트형, 파스텔 톤, 단순하고 직관적인 레이아웃, 라운드 형태의 요소",
      qualityNotes: "참여 버튼(CTA)을 버튼 형태로 강조, 모바일 환경 최적화 가독성, 부드러운 조명 효과",
      mandatoryElements: "설문 주제, 참여 기간, 경품 안내, 참여 링크",
      forbiddenElements: "딱딱한 관공서 느낌, 작은 본문 텍스트, 복잡한 레이아웃",
      posterKeyVisual: "친근한 일러스트 캐릭터 또는 선물 상자 아이콘",
      posterInfoLayout: "상단 비주얼, 하단 큰 제목과 버튼",
      cardnewsFlow: "궁금증 유발 → 설문 주제 → 경품 안내 → 참여 링크",
      snsVisualFocus: "선물 이미지와 함께 '5분이면 완료' 문구를 강조",
    },
  };

  const CONTENT_TYPE_TEMPLATES_EN = {
    event: {
      name: "event announcement",
      goal: "Increase event awareness and drive attendance",
      audience: "potential attendees, industry professionals, general public",
      tone: "trustworthy, professional, dynamic, festive",
      visualStyle: "bold typography, photo-real direction, editorial magazine layout, vivid accent colors",
      qualityNotes: "high-contrast readability, strong visual hierarchy for key event information such as date and venue, advertising-grade detail",
      mandatoryElements: "event title, date and time, venue, registration method, organizer logo area",
      forbiddenElements: "lengthy text blocks, blurry background imagery, unclear CTA",
      posterKeyVisual: "an object that symbolizes the event theme or a vivid editorial-style event image",
      posterInfoLayout: "headline locked at the top, information card layout at the bottom",
      cardnewsFlow: "event purpose → key program highlights → attendance benefits → registration CTA",
      snsVisualFocus: "center-weighted composition where the event title and date are seen first",
    },
    contest: {
      name: "contest promotion",
      goal: "Drive contest participation and proposal submissions",
      audience: "university students, startups, aspiring founders, creator groups",
      tone: "creative, refined, impactful, ambitious",
      visualStyle: "3D graphics, flat design, neon mood, geometric pattern usage",
      qualityNotes: "emphasize the symbolic nature of the contest theme, highlight prize or benefit figures in large type, keep typography edges crisp",
      mandatoryElements: "contest theme, prize details, submission period, website URL, eligibility requirements",
      forbiddenElements: "cheap primary-color gradients, tiny numerical details, dated stock imagery",
      posterKeyVisual: "a geometric 3D object expressing challenge and creativity",
      posterInfoLayout: "Z-flow layout with prize information centered",
      cardnewsFlow: "contest background → theme and prize → participation method → deadline emphasis",
      snsVisualFocus: "place the total prize scale and an 'open for submissions' badge where they draw attention first",
    },
    training: {
      name: "training recruitment",
      goal: "Drive course applications and secure enrollment",
      audience: "job seekers, working professionals seeking upskilling, soon-to-graduate university students",
      tone: "friendly, professional, smart, future-oriented",
      visualStyle: "infographic style, close-up portraits with bright expressions, minimal grid layout, trustworthy blue/green palette",
      qualityNotes: "curriculum readability comes first, make the recruitment deadline feel impactful, keep skin tones natural",
      mandatoryElements: "course title, training period, eligibility, application deadline, training benefits such as tuition support",
      forbiddenElements: "complex charts, dark portraits, low-readability serif body text",
      posterKeyVisual: "a symbol of growth and learning or a learner image with a bright expression",
      posterInfoLayout: "text-forward layout on the left with visuals on the right, or a vertical split",
      cardnewsFlow: "pain point empathy → training solution → curriculum summary → student proof → application CTA",
      snsVisualFocus: "place the course name and the strongest benefit such as 'fully funded' at the top",
    },
    "demand-survey": {
      name: "demand survey announcement",
      goal: "Identify market needs and collect data",
      audience: "service users, professionals in the target industry, target customer groups",
      tone: "calm, professional, minimal, respectful",
      visualStyle: "data-led layout, glassmorphism, clean interface mood, white and gray dominant palette",
      qualityNotes: "emphasize the value of participating, clearly show expected response time, keep the surface clean and noise-free",
      mandatoryElements: "survey purpose, participation benefit, estimated completion time, participation link or QR",
      forbiddenElements: "flashy decoration, distracting background patterns, excessive emoji usage",
      posterKeyVisual: "data analysis, a questionnaire motif, or an abstract network-style graphic",
      posterInfoLayout: "centered clean box layout",
      cardnewsFlow: "survey purpose → why participation matters → participation method and benefit → thank-you message",
      snsVisualFocus: "make the participation benefit, such as a gift coupon, the most visually emphasized element",
    },
    survey: {
      name: "survey participation",
      goal: "Collect user feedback and encourage participation",
      audience: "existing customers, service users, general audience",
      tone: "friendly, simple, warm, light",
      visualStyle: "illustrative style, pastel tone, simple intuitive layout, rounded elements",
      qualityNotes: "present the CTA as a strong button, optimize readability for mobile, use soft lighting",
      mandatoryElements: "survey topic, participation period, prize information, participation link",
      forbiddenElements: "rigid bureaucratic mood, tiny body text, cluttered layout",
      posterKeyVisual: "a friendly illustrated character or a gift-box icon",
      posterInfoLayout: "visual at the top, bold title and button at the bottom",
      cardnewsFlow: "curiosity hook → survey topic → prize info → participation link",
      snsVisualFocus: "highlight a gift image together with a line such as 'done in 5 minutes'",
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
    event: {
      paletteId: "preset_modern_dark",
      state: {
        contentType: "event",
        sizeMode: "ratio",
        ratio: "4:5",
        orientation: "vertical",
        directSizeUnit: "px",
        directSizeW: "",
        directSizeH: "",
        headline: "NEXT HORIZON: 2026 글로벌 산업 혁신 포럼",
        subheadline: "지속 가능한 미래를 위한 기술과 정책의 융합 / 대한민국 최대 규모 산업 컨퍼런스",
        bodyCopy: "- 2026. 06. 18 (목) - 19 (금)\n- 서울 코엑스(COEX) 그랜드볼룸\n- 글로벌 10개국 50인의 기조연설 및 세션\n- 공식 홈페이지를 통한 선착순 사전 등록",
        cta: "지금 바로 사전 등록하기 (Early Bird 20% 할인)",
        posterOffer: "사전 등록 시 VIP 네트워킹 세션 참여권 및 요약 리포트 증정",
        snsHook: "이번 포럼, 선착순 등록이 먼저입니다",
        snsHashtags: "#산업혁신포럼 #사전등록 #글로벌컨퍼런스",
      },
      quickFields: {
        promotionGoal: ["사전 등록 유도"],
        promotionAudience: ["국내외 기업 의사결정자"],
        promotionTone: ["프리미엄", "신뢰감 있는", "세련된", "브랜드 광고 같은"],
        promotionVisualStyle: ["하이엔드 제품광고형", "매거진 편집형", "대담한 타이포그래피"],
        promotionQualityNotes: ["광고 이미지급 디테일", "텍스트와 배경 대비 선명", "타이포 가장자리 또렷하게"],
        promotionBackgroundDetails: ["딥 네이비 그라데이션 배경", "추상 광원 오버레이", "텍스트 영역만 어둡게 오버레이"],
        promotionMandatoryElements: ["행사명", "일정", "장소", "QR코드 영역", "로고"],
        promotionForbiddenElements: ["이모지 사용 금지", "두꺼운 텍스트 외곽선", "장문 문단", "저해상도 스톡 느낌"],
        promotionPosterKeyVisual: ["추상적 그래픽", "대형 헤드라인과 단일 오브젝트"],
        promotionPosterInfoLayout: ["상단 헤드라인 고정", "정보 카드 1개로 묶기"],
        promotionSnsVisualFocus: ["헤드라인과 CTA 양축 강조"],
        promotionSnsPlacementNotes: ["상단 25% 훅 카피", "하단 CTA 버튼 영역 분리", "상하단 UI 영역 피해 배치"],
      },
    },
    contest: {
      paletteId: "preset_vibrant_energy",
      state: {
        contentType: "contest",
        sizeMode: "ratio",
        ratio: "4:5",
        orientation: "vertical",
        directSizeUnit: "px",
        directSizeW: "",
        directSizeH: "",
        headline: "2026 K-스타트업 오픈이노베이션 챌린지",
        subheadline: "대기업 현업과 함께 검증하는 PoC 연계형 공모 프로그램 / 우수팀 후속 투자 검토",
        bodyCopy: "- 접수 기간: 2026. 07. 01 ~ 07. 31\n- 모집 대상: 예비창업팀, 스타트업, 대학(원)생 팀\n- 총 상금 5,000만원 및 실증 지원\n- 공식 홈페이지를 통한 온라인 접수",
        cta: "제안서 접수하기",
        posterOffer: "결선 진출팀 대상 PoC 연계 및 투자 IR 멘토링 제공",
        snsHook: "총상금 5,000만원, 지금 도전하세요",
        snsHashtags: "#오픈이노베이션 #스타트업챌린지 #공모사업",
      },
      quickFields: {
        promotionGoal: ["이벤트 참여 유도"],
        promotionAudience: ["대학생 구직자"],
        promotionTone: ["임팩트 있는", "세련된", "모던한"],
        promotionVisualStyle: ["3D 그래픽", "캠페인 광고형", "대담한 타이포그래피"],
        promotionQualityNotes: ["광고 이미지급 디테일", "CTA 버튼 한눈에 읽히게", "타이포 가장자리 또렷하게"],
        promotionBackgroundDetails: ["기하학 라인 패턴", "추상 광원 오버레이", "텍스트 영역만 어둡게 오버레이"],
        promotionMandatoryElements: ["행사명", "일정", "신청 링크", "CTA 버튼"],
        promotionForbiddenElements: ["이모지 사용 금지", "과한 네온 효과", "장문 문단", "저해상도 스톡 느낌"],
        promotionPosterKeyVisual: ["기하학적 패턴", "추상적 그래픽"],
        promotionPosterInfoLayout: ["Z자 흐름", "중앙 집중형"],
        promotionSnsVisualFocus: ["CTA 버튼 중심"],
        promotionSnsPlacementNotes: ["상단 25% 훅 카피", "하단 CTA 버튼 영역 분리", "헤드라인과 배경 대비 강하게"],
      },
    },
    training: {
      paletteId: "preset_corporate_blue",
      state: {
        contentType: "training",
        sizeMode: "ratio",
        ratio: "4:5",
        orientation: "vertical",
        directSizeUnit: "px",
        directSizeW: "",
        directSizeH: "",
        headline: "실무형 AI 데이터 분석 부트캠프 6기",
        subheadline: "비전공자도 따라오는 프로젝트 중심 집중 과정 / 수료 후 포트폴리오와 취업 연계까지",
        bodyCopy: "- 교육 기간: 2026. 08. 03 ~ 10. 30\n- 전액 지원 선발 과정 / 월별 학습 장려금 제공\n- 현업 멘토 프로젝트와 1:1 커리어 코칭\n- 신청 마감: 2026. 07. 20",
        cta: "지금 지원하기",
        posterOffer: "사전 설명회 참석자에게 커리큘럼 가이드북 제공",
        snsHook: "AI 실무 커리어, 이번 기수에서 시작하세요",
        snsHashtags: "#데이터분석 #부트캠프 #교육생모집",
      },
      quickFields: {
        promotionGoal: ["사전 등록 유도"],
        promotionAudience: ["20~30대 취업 준비생"],
        promotionTone: ["친근한", "스마트한", "신뢰감 있는"],
        promotionVisualStyle: ["인포그래픽형", "미니멀 그리드형", "실사 위주"],
        promotionQualityNotes: ["모바일 썸네일 가독성 우선", "텍스트와 배경 대비 선명", "CTA 버튼 한눈에 읽히게"],
        promotionBackgroundDetails: ["은은한 그리드 패턴", "텍스트 영역만 어둡게 오버레이"],
        promotionMandatoryElements: ["행사명", "일정", "신청 링크", "CTA 버튼"],
        promotionForbiddenElements: ["이모지 사용 금지", "두꺼운 텍스트 외곽선", "정보 과밀 배치"],
        promotionPosterKeyVisual: ["인물 클로즈업", "데이터 시각화"],
        promotionPosterInfoLayout: ["좌측 텍스트 강조, 우측 비주얼 배치", "정보 카드 1개로 묶기"],
        promotionSnsVisualFocus: ["인물 반신과 큰 제목 중심"],
        promotionSnsPlacementNotes: ["상단 25% 훅 카피", "하단 CTA 버튼 영역 분리", "텍스트 블록 2개 이하 유지"],
      },
    },
    "demand-survey": {
      paletteId: "preset_minimal_mono",
      state: {
        contentType: "demand-survey",
        sizeMode: "ratio",
        ratio: "4:5",
        orientation: "vertical",
        directSizeUnit: "px",
        directSizeW: "",
        directSizeH: "",
        headline: "2026 스마트제조 전환 수요조사",
        subheadline: "현장 자동화와 AI 도입 과제를 파악해 맞춤형 지원사업을 설계합니다",
        bodyCopy: "- 응답 시간: 약 3분\n- 조사 대상: 제조기업 실무자 및 의사결정자\n- 참여 기업 대상 결과 리포트 제공\n- 응답 기간: 2026. 06. 01 ~ 06. 21",
        cta: "수요조사 참여하기",
        posterOffer: "응답 완료 기업에 요약 인사이트 리포트 우선 제공",
        snsHook: "3분 응답으로 내년 지원사업 방향을 바꿔보세요",
        snsHashtags: "#스마트제조 #수요조사 #기업지원",
      },
      quickFields: {
        promotionGoal: ["신규 서비스 관심 유도"],
        promotionAudience: ["중소기업 실무자"],
        promotionTone: ["차분한", "전문적인", "미니멀한"],
        promotionVisualStyle: ["미니멀 그리드형", "인포그래픽형", "에디토리얼 광고형"],
        promotionQualityNotes: ["텍스트와 배경 대비 선명", "노이즈 없는 깨끗한 표면", "타이포 가장자리 또렷하게"],
        promotionBackgroundDetails: ["은은한 그리드 패턴", "텍스트 영역만 어둡게 오버레이"],
        promotionMandatoryElements: ["브랜드명", "신청 링크", "QR코드 영역"],
        promotionForbiddenElements: ["이모지 사용 금지", "과한 네온 효과", "과한 색상 남용"],
        promotionPosterKeyVisual: ["데이터 시각화", "기하학적 패턴"],
        promotionPosterInfoLayout: ["중앙 집중형", "그리드 분할"],
        promotionSnsVisualFocus: ["정보카드 중심"],
        promotionSnsPlacementNotes: ["텍스트 블록 2개 이하 유지", "안전영역 침범 금지", "좌측 정렬축 유지"],
      },
    },
    survey: {
      paletteId: "preset_soft_creative",
      state: {
        contentType: "survey",
        sizeMode: "ratio",
        ratio: "4:5",
        orientation: "vertical",
        directSizeUnit: "px",
        directSizeW: "",
        directSizeH: "",
        headline: "서비스 만족도 설문 참여 이벤트",
        subheadline: "더 나은 사용 경험을 위해 2분 설문에 참여하고 모바일 쿠폰 혜택을 받아보세요",
        bodyCopy: "- 참여 기간: 2026. 05. 10 ~ 05. 31\n- 응답자 전원 커피 쿠폰 증정\n- 추첨을 통해 10명 백화점 상품권 제공\n- 모바일 링크 또는 QR코드로 바로 참여",
        cta: "지금 설문 참여하기",
        posterOffer: "응답 완료 시 즉시 응모 처리",
        snsHook: "2분 설문 참여하고 커피 쿠폰 받기",
        snsHashtags: "#설문이벤트 #고객의견 #참여혜택",
      },
      quickFields: {
        promotionGoal: ["이벤트 참여 유도"],
        promotionAudience: ["브랜드 관심 고객"],
        promotionTone: ["친근한", "따뜻한", "스마트한"],
        promotionVisualStyle: ["파스텔 톤", "캠페인 광고형", "실사 위주"],
        promotionQualityNotes: ["모바일 썸네일 가독성 우선", "CTA 버튼 한눈에 읽히게", "텍스트와 배경 대비 선명"],
        promotionBackgroundDetails: ["현장 사진 흐림 처리 배경", "텍스트 영역만 어둡게 오버레이"],
        promotionMandatoryElements: ["브랜드명", "신청 링크", "CTA 버튼", "QR코드 영역"],
        promotionForbiddenElements: ["이모지 사용 금지", "정보 과밀 배치", "장문 문단"],
        promotionPosterKeyVisual: ["자연 풍경", "인물 클로즈업"],
        promotionPosterInfoLayout: ["상단 헤드라인 고정", "하단 정보 박스 일체형"],
        promotionSnsVisualFocus: ["CTA 버튼 중심"],
        promotionSnsPlacementNotes: ["상단 25% 훅 카피", "하단 CTA 버튼 영역 분리", "모바일 썸네일 축소 시도 가독성 유지"],
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

    return formatQuickButtonValues([...values, trimValue(nextValue)], targetInput, nextValue);
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
    "유리 큐브": "glass cube",
    "빛의 축": "light axis",
    "데이터 흐름": "data flow",
    "프레임 돌출": "frame breakout",
    "구조물 교차": "intersecting structures",
    "레이어 겹침": "layer overlap",
    "행사 참가 신청 전환": "drive event sign-ups",
    "사전 등록 유도": "drive pre-registration",
    "브랜드 인지도 제고": "increase brand awareness",
    "이벤트 참여 유도": "drive event participation",
    "신규 서비스 관심 유도": "generate interest in a new service",
    "상담 문의 전환": "convert viewers into consultation inquiries",
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

  function splitQualityNoteLines(value) {
    return uniqueValues(
      String(value || "")
        .split(/[\r\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean)
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

    if (!String(state.headline || "").trim()) {
      errors.push("헤드라인을 입력해야 프롬프트를 복사할 수 있습니다.");
    }
    if (!String(state.goal || "").trim()) {
      errors.push("홍보 목적을 입력해야 메시지 방향이 분명해집니다.");
    }

    if (state.sizeMode === "ratio") {
      if (state.ratio === "custom") {
        if (!isPositiveNumberText(state.customRatioW) || !isPositiveNumberText(state.customRatioH)) {
          errors.push("직접 입력 비율을 사용할 때는 너비와 높이를 모두 숫자로 입력해야 합니다.");
        }
      }
    } else {
      validateDimensionPair(
        state.directSizeW,
        state.directSizeH,
        `직접 입력 크기(${state.directSizeUnit})`,
        errors
      );
      if (!String(state.directSizeW || "").trim() && !String(state.directSizeH || "").trim()) {
        errors.push("크기 직접 입력 방식을 선택했다면 실제 너비와 높이를 입력해야 합니다.");
      }
    }

    if (state.assetType === "poster") {
      if (!String(state.posterKeyVisual || "").trim()) {
        warnings.push("포스터는 메인 비주얼 포인트를 적어두면 결과 품질이 더 안정적입니다.");
      }
      if (!String(state.posterInfoLayout || "").trim()) {
        warnings.push("포스터는 정보 배치 방식을 적어두면 위계가 덜 흔들립니다.");
      }
    }

    if (state.assetType === "cardnews") {
      const cardCount = Number(state.cardnewsCardCount);
      if (!Number.isInteger(cardCount) || cardCount < 3 || cardCount > 10) {
        errors.push("카드뉴스 카드 수는 3장 이상 10장 이하로 설정하세요.");
      }
      if (!String(state.cardnewsFlow || "").trim()) {
        warnings.push("카드뉴스는 카드 흐름을 적어두면 장별 메시지 연결이 좋아집니다.");
      }
    }

    if (state.assetType === "sns") {
      if (!String(state.snsHook || "").trim()) {
        warnings.push("SNS 이미지는 첫 줄 훅이 있으면 시선 유도가 훨씬 쉬워집니다.");
      }
      if (!String(state.snsPlacementNotes || "").trim()) {
        warnings.push("SNS는 안전영역이나 CTA 위치 메모를 남기면 플랫폼별 잘림 위험을 줄일 수 있습니다.");
      }
    }

    return { errors, warnings };
  }

  function renderValidation(validation) {
    const node = $("promotionValidation");
    if (!node) return;

    if (!validation.errors.length && !validation.warnings.length) {
      node.innerHTML = `
        <div class="promo-validation-item is-ok">
          <strong>입력 상태 양호</strong>
          <span>현재 입력으로 프롬프트를 복사하거나 설정을 저장할 수 있습니다.</span>
        </div>
      `;
      return;
    }

    const blocks = [];
    if (validation.errors.length) {
      blocks.push(`
        <div class="promo-validation-item is-error">
          <strong>보완이 필요한 항목</strong>
          <span>${validation.errors.map((item) => escapeHtml(item)).join("<br />")}</span>
        </div>
      `);
    }
    if (validation.warnings.length) {
      blocks.push(`
        <div class="promo-validation-item is-warning">
          <strong>품질 개선 힌트</strong>
          <span>${validation.warnings.map((item) => escapeHtml(item)).join("<br />")}</span>
        </div>
      `);
    }

    node.innerHTML = blocks.join("");
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
            const enabled = !hasToggle || isEnabled(state[`${field.key}Enabled`]);
            const isAiMode = hasToggle && state[`${field.key}Mode`] !== "manual";
            const inputDisabled = hasToggle && (!enabled || isAiMode);
            return `
              <section class="gen-config-group${wideClass}${hasToggle && !enabled ? " promo-field-disabled" : ""}">
                <div class="gen-config-label-row">
                  <label class="gen-config-label" for="${fieldId}">
                    ${escapeHtml(field.label)}
                    ${kindBadgeHtml(field.kind)}
                  </label>
                  ${hasToggle ? renderAiToggleHeader(field.key) : ""}
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
  }

  const STATIC_TOGGLE_SYNC = {
    cta: () => syncCtaToggleUI(),
    posterOffer: () => syncPosterOfferToggleUI(),
    snsHook: () => syncSnsHookToggleUI(),
    snsHashtags: () => syncSnsHashtagsToggleUI(),
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
          input.id === "promotionDirectSizeUnit"
        ) {
          syncSizeModeUI();
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

      picker.addEventListener("input", () => {
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

    root.querySelectorAll("[data-anti-ai-preset]").forEach((button) => {
      if (button.tagName !== "BUTTON") return;
      button.addEventListener("click", () => {
        const id = button.dataset.antiAiPreset;
        state.antiAiStyle = state.antiAiStyle === id ? "" : id;
        syncAntiAiPresetUI();
        renderPreview();
      });
    });

    bindAiToggleControls(root);
  }

  function syncAntiAiPresetUI() {
    root.querySelectorAll("[data-anti-ai-preset]").forEach((button) => {
      const active = button.dataset.antiAiPreset === state.antiAiStyle;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const badge = $("antiAiActiveBadge");
    if (badge) {
      const preset = ANTI_AI_PRESETS.find((p) => p.id === state.antiAiStyle);
      badge.textContent = preset ? `AI 억제: ${preset.labelKo}` : "";
      badge.style.display = preset ? "" : "none";
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
    status("현재 색상 팔레트를 저장했습니다.", "success");
  }

  function applySelectedPalettePreset() {
    const select = $("promotionPalettePresetSelect");
    const presetId = select?.value;
    if (!presetId) {
      status("적용할 색상 팔레트를 먼저 선택하세요.", "error");
      return;
    }

    const preset = colorPresets.find((item) => item.id === presetId);
    if (!preset) {
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

    entries.push(["posterKeyVisual", state.posterKeyVisual]);
    entries.push(["posterInfoLayout", state.posterInfoLayout]);
    entries.push(["snsVisualFocus", state.snsVisualFocus]);
    entries.push(["snsPlacementNotes", state.snsPlacementNotes]);

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

  function createPromptSections(validation, lint) {
    const textEntries = visibleTextEntries();
    const instructionItems = instructionEntries();
    const commercialProfile = COMMERCIAL_BASELINE_PROFILES[state.commercialBaseline] || COMMERCIAL_BASELINE_PROFILES[DEFAULT_STATE.commercialBaseline];
    const creativityProfile = CREATIVITY_LEVEL_PROFILES[state.creativityLevel] || CREATIVITY_LEVEL_PROFILES[DEFAULT_STATE.creativityLevel];
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
    const userForbiddenTokens = splitKeywordValues(state.forbiddenElements);
    const mergedForbiddenTokens = [...new Set([...userForbiddenTokens, ...antiAiForbiddenTokens])];

    const hardConstraintLines = prunePromptLines([
      ...koreanTextConstraint,
      ...(activeAntiAiPreset
        ? [localizeSentence(
            `비주얼 스타일 프리셋(${activeAntiAiPreset.labelKo}): ${activeAntiAiPreset.visualHintKo}`,
            `Visual style preset (${activeAntiAiPreset.labelEn}): ${activeAntiAiPreset.visualHintEn}`
          )]
        : []),
      ...validation.errors.map((item) => localizeValue(item)),
      ...mergedForbiddenTokens.map((item) => `${localizeSentence("금지", "Avoid")}: ${localizeValue(item)}`),
    ]);

    const directTextLines = prunePromptLines(
      textEntries.map((entry, index) => `${index + 1}. ${localizeValue(entry.label)}: ${localizeValue(entry.value)}`)
    );

    const AI_AUTO_FIELD_DEFS = [
      {
        field: "cta",
        labelKo: "CTA 문구",
        labelEn: "CTA copy",
        directiveKo: "CTA 문구를 홍보 목적과 핵심 타깃에 맞춰 즉각적인 행동을 유도하는 형태로 생성하라",
        directiveEn: "Generate a CTA copy that drives immediate action, matched to the promotion goal and target audience",
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
    ];

    const aiAutoLines = prunePromptLines(
      AI_AUTO_FIELD_DEFS
        .filter((def) => isEnabled(state[`${def.field}Enabled`]) && state[`${def.field}Mode`] === "ai")
        .map((def) => localizeSentence(
          `[AI 자동 생성] ${def.labelKo}: ${def.directiveKo}`,
          `[AI auto-generate] ${def.labelEn}: ${def.directiveEn}`
        ))
    );

    const commercialLines = prunePromptLines([
      `${localizeSentence("상업 품질 기준", "Commercial baseline")}: ${localizeSentence(commercialProfile.labelKo, commercialProfile.labelEn)}`,
      ...getLocalizedProfileLines(commercialProfile),
    ]);

    const designLines = prunePromptLines([
      ...instructionItems
        .filter((entry) => !compositionExcludedKeys.has(entry.key))
        .map((entry, index) => `${index + 1}. ${localizeValue(entry.label)}: ${localizeValue(entry.value)}`),
    ]);

    const creativityLines = prunePromptLines([
      state.bigIdea ? `${localizeSentence("핵심 개념", "Core concept")}: ${localizeValue(state.bigIdea)}` : "",
      state.visualMetaphor ? `${localizeSentence("비주얼 은유", "Visual metaphor")}: ${localizeValue(state.visualMetaphor)}` : "",
      `${localizeSentence("레이아웃 실험 범위", "Layout experimentation")}: ${localizeSentence(creativityProfile.labelKo, creativityProfile.labelEn)}`,
      ...getLocalizedProfileLines(creativityProfile),
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

    const qualityLines = prunePromptLines([
      ...getDefaultQualityTagLines(),
      ...(state.qualityNotes
        ? splitQualityNoteLines(state.qualityNotes).map((item) => localizeValue(item))
        : [
            localizeSentence(
              "텍스트 가장자리 또렷함, 픽셀 깨짐 없음, 썸네일 축소 시에도 핵심 문구 가독성 유지.",
              "Crisp text edges, no pixelation, headline legible at thumbnail size."
            ),
          ]),
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
      { priority: 20, title: localizeHeading("상업 품질 기준", "Commercial baseline"), lines: commercialLines },
      { priority: 30, title: localizeHeading("하드 제약", "Hard constraints"), lines: hardConstraintLines },
      { priority: 35, title: localizeHeading("AI 자동 생성 요청", "AI auto-generate requests"), lines: aiAutoLines },
      { priority: 40, title: localizeHeading("이미지에 직접 포함할 텍스트 (한국어 원문 그대로 렌더링)", "Text to render exactly as-is — Korean source text, do not translate"), lines: directTextLines },
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

    const sectionLines = sections.flatMap((section) => ["", `## ${section.title}`, ...section.lines]);

    const footer = [
      "",
      `## ${localizeHeading("우선순위", "Priority order")}`,
      localizeSentence("1. 이미지 내 텍스트 언어 규칙 (한국어 단독 표기) 및 금지 규칙 준수", "1. On-image text language rule (Korean only) and all hard constraints"),
      localizeSentence("2. AI 자동 생성 항목 (CTA·오퍼·훅·태그) 적절히 생성 후 배치", "2. Generate AI auto-requested items (CTA, offer, hook, hashtags) and place them appropriately"),
      localizeSentence("3. 텍스트 위계와 가독성 (헤드라인 → CTA 순)", "3. Text hierarchy and readability (headline → CTA)"),
      localizeSentence("4. 상업 품질 기준 및 창의 방향 반영", "4. Commercial baseline and creative direction"),
      localizeSentence("5. 구성·배치·비주얼 구성 방향 반영", "5. Composition, layout, and visual composition direction"),
      localizeSentence("6. 색상·배경 시스템 일관성 및 품질 보정", "6. Color system, background, and quality refinements"),
    ];

    return [...intro, ...sectionLines, ...footer].join("\n");
  }

  function renderOptimizedPrompt(validation, lint) {
    const sections = createPromptSections(validation, lint);
    const compressed = sections.flatMap((section) => section.lines.map((line) => `- ${line.replace(/^\d+\.\s*/, "")}`));
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
    if (section) section.classList.toggle("promo-field-disabled", !enabled);
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
    syncPosterOfferToggleUI();
    syncSnsHookToggleUI();
    syncSnsHashtagsToggleUI();
    syncAntiAiPresetUI();
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

  function bindStaticInputs() {
    bindFieldInputs(root);
    bindQuickButtons(root);
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

  function init() {
    attachStaticFieldBadges();
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
    bindLoadInput();
    bindPromptEditor();
    $("promotionSampleBtn")?.addEventListener("click", applySample);
    $("promotionRandomPresetBtn")?.addEventListener("click", applyRandomPresets);
    $("promotionSaveBtn")?.addEventListener("click", saveSettings);
    $("promotionLoadBtn")?.addEventListener("click", loadSettings);
    $("promotionPaletteSaveBtn")?.addEventListener("click", saveCurrentPalettePreset);
    $("promotionPaletteApplyBtn")?.addEventListener("click", applySelectedPalettePreset);
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

  init();
})();
