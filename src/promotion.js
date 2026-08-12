(function () {
  const root = document.getElementById("panePromotion");
  if (!root) return;

  const $ = (id) => document.getElementById(id);

  const {
    PROMOTION_SCHEMA_VERSION,
    PROMOTION_DRAFT_STORAGE_KEY,
    PROMOTION_COLOR_PRESETS_KEY,
    PROMOTION_SIZE_PRESETS_KEY,
    ASSET_TYPES,
    CONTENT_TYPE_VALUES,
    COLOR_STRATEGY_VALUES,
    ASSET_DEFAULTS,
    DEFAULT_STATE,
    ASSET_LABELS,
    ASSET_LABELS_EN,
    ASSET_PROMPT_TARGET_EN,
    KIND_META,
    STATIC_FIELD_KINDS,
    FIELD_LABELS,
    FIELD_LABELS_EN,
    QUICK_BTNS,
    DEFAULT_QUALITY_TAGS,
    COMMERCIAL_BASELINE_PROFILES,
    CREATIVITY_LEVEL_PROFILES,
    VARIATION_SEEDS,
    CREATIVE_DIVERSITY_PROFILES,
    LAYOUT_COMPOSITION_PROFILES,
    ATTENTION_FLOW_VARIANTS,
    AI_LAYOUT_STRATEGY_OPTIONS,
    AI_VISUAL_METAPHOR_EXAMPLES,
    INFORMATION_ITEM_LAYOUT_VARIANTS,
    QR_PLACEMENT_VARIANTS,
    MANDATORY_ELEMENT_PLACEMENT_VARIANTS,
    AI_TOGGLE_FIELDS,
    FIELD_ENABLE_TOGGLE_FIELDS,
    STEP5_QUALITY_OPTIONS,
    ANTI_AI_PRESETS,
    DEFAULT_COLOR_PRESETS,
    TYPE_FIELD_DEFS,
    SAMPLE_PROFILES,
    DEFAULT_SAMPLE_PROFILE,
    UNIFIED_RANDOMIZABLE_PRESET_FIELDS,
    COLOR_FIELD_IDS,
  } = window.PROMO_DATA;


  const {
    CONCEPT_INJECTION_PATTERNS,
    deepClone, isEnabled, trimValue, uniqueValues,
    splitKeywordValues, splitKeywordValuesRaw,
    splitSentenceLines, splitForbiddenValues,
    normalizeConceptStripValue, conceptStripValuesFromStyle,
    isConceptInjectedLine, stripConceptInjectedLines,
    normalizePromptLineForDedupe, normalizeQuickToken,
    isQuickButtonMultiline, formatQuickButtonValues,
    getFieldStateKeyFromInput,
    pickRandomSubset, randomFieldSelectionCount,
    normalizeBooleanSetting, normalizeColorStrategy,
    normalizeOutputLanguage, normalizeHexColor,
    escapeHtml, normalizeLines, formatImageTextHierarchy, mergeUniqueLines,
    summarizeDisplayTextPoint, normalizeForbiddenPromptToken,
  } = window.PROMO_UTILS;

  const {
    EN_TOKEN_MAP,
    translateFragment,
    SYSTEM_QUALITY_PHRASES,
    isSystemQualityPhrase,
    splitQualityNoteLines,
  } = window.PROMO_I18N;

  // ── 클로저 변수 (IIFE 내 공유 상태) ──────────────────────────
  const state = deepClone(DEFAULT_STATE);
  const COLOR_MODE_PALETTES = {
    light: {
      primaryColor: "#1f4f99",
      secondaryColor: "#e8eef7",
      accentColor: "#d87922",
      backgroundColor: "#ffffff",
      backgroundMode: "solid",
      backgroundDetails: "흰색 또는 아주 밝은 쿨 그레이 배경, 공공기관 홍보물에 어울리는 넓은 여백과 높은 텍스트 대비",
    },
    dark: {
      primaryColor: "#102a56",
      secondaryColor: "#1e293b",
      accentColor: "#f59e0b",
      backgroundColor: "#0f172a",
      backgroundMode: "solid",
      backgroundDetails: "딥 네이비 배경, 제한적인 포인트 조명, 핵심 정보와 CTA가 선명하게 보이는 고대비 구성",
    },
  };
  let visitedAssetTypes = new Set([DEFAULT_STATE.assetType]);
  let latestValidation = null; // validateState() 초기값 — init() 호출 시 갱신
  let latestLint = { conflicts: [], duplicates: [], notes: [], summary: [] };
  let promptDraft = "";
  let promptDirty = false;
  let colorPresets = [];
  let sizePresets = [];
  // 섹션 뷰어 상태
  let _viewerEditMode = false;   // true = textarea 편집 모드
  let recommendationRefreshTimer = null;
  let quickFillLastParsed = null;
  let quickFillParsedRaw = null;
  // ─────────────────────────────────────────────────────────────

  const LAYOUT_CHOICE_LABELS = {
    normal: {
      title_focus: "타이틀 중심",
      visual_focus: "비주얼 중심",
      info_focus: "정보 중심",
      title_info_hybrid: "타이틀+정보 혼합",
      visual_info_hybrid: "비주얼+정보 혼합",
      custom: "사용자 지정 (커스텀)",
    },
    background: {
      title_focus: "타이틀 중심",
      visual_focus: "배경 분위기 중심",
      info_focus: "정보 중심",
      title_info_hybrid: "타이틀+정보 혼합",
      visual_info_hybrid: "배경+정보 혼합",
      custom: "사용자 지정 (커스텀)",
    },
  };

  const LAYOUT_CHOICE_TITLES = {
    normal: {
      title_focus: "헤드라인과 타이틀을 가장 먼저 읽히게 합니다.",
      visual_focus: "키비주얼을 전경의 주요 시선 요소로 사용합니다.",
      info_focus: "본문 정보와 세부 항목을 가장 명확하게 읽히게 합니다.",
      title_info_hybrid: "타이틀과 정보 영역을 함께 강조합니다.",
      visual_info_hybrid: "키비주얼과 정보 영역을 함께 강조합니다.",
      custom: "타이틀, 비주얼, 정보 비율을 직접 조정합니다.",
    },
    background: {
      title_focus: "타이틀을 전경 중심에 두고 비주얼은 낮은 대비 배경으로만 사용합니다.",
      visual_focus: "비주얼을 전경 오브젝트가 아니라 배경 이미지의 분위기와 질감으로 크게 사용합니다.",
      info_focus: "정보를 전경 중심에 두고 비주얼은 주변 배경 맥락으로만 사용합니다.",
      title_info_hybrid: "타이틀과 정보를 전경에 두고 비주얼은 둘을 연결하는 배경 분위기로만 사용합니다.",
      visual_info_hybrid: "배경 분위기와 정보 영역을 함께 설계하되 비주얼은 전경 주역으로 만들지 않습니다.",
      custom: "비주얼 비율을 전경 키비주얼이 아니라 배경 분위기 비율로 해석합니다.",
    },
  };

  const PROMOTION_STYLE_RECOMMENDATION_RULES = [
    {
      id: "support-recruit",
      label: "모집·접수 전환",
      keywords: ["지원사업", "모집", "참가기업", "참여기업", "수혜기업", "지원대상", "신청", "접수", "접수기간", "신청기간", "신청방법", "바우처", "보조금", "지원금", "사업비", "공고", "모집공고", "마감", "마감일", "선착순", "소상공인", "중소기업", "중견기업", "스타트업", "창업", "예비창업", "입주기업", "참여자", "대상자", "선발", "선정", "혜택", "자격", "요건"],
      mediums: ["med-photo-3d-icons", "med-real-cgi-keyvisual", "med-ar-interface-composite", "med-pub-grant-recruit-card"],
      reason: "신청 행동과 핵심 혜택을 빠르게 읽히게 하는 홍보형 구성이 잘 맞습니다.",
    },
    {
      id: "technology-innovation",
      label: "기술·혁신 홍보",
      keywords: ["기술", "ai", "a.i", "인공지능", "생성형", "데이터", "빅데이터", "클라우드", "스마트", "디지털", "디지털전환", "dx", "ict", "it", "플랫폼", "솔루션", "시스템", "서비스형", "r&d", "연구", "개발", "실증", "검증", "고도화", "혁신", "전환", "자동화", "로봇", "iot", "사물인터넷", "메타버스", "ar", "vr", "xr", "블록체인", "보안", "사이버", "핀테크", "바이오", "헬스케어", "스마트시티", "스마트공장", "제조혁신"],
      mediums: ["med-real-hologram-hybrid", "med-human-3d-data", "med-arch-photo-3d-overlay", "med-real-cgi-keyvisual"],
      reason: "실사 기반 신뢰감에 3D 데이터·인터페이스를 더해 기술성을 직관적으로 보여줍니다.",
    },
    {
      id: "event-conference",
      label: "행사·포럼 안내",
      keywords: ["행사", "포럼", "컨퍼런스", "콘퍼런스", "세미나", "웨비나", "설명회", "간담회", "토론회", "공청회", "워크숍", "박람회", "전시", "전시회", "페어", "데모데이", "피칭", "IR", "네트워킹", "밋업", "상담회", "매칭데이", "참가", "참석", "초청", "초대", "등록", "사전등록", "일정", "장소", "연사", "패널", "부스", "현장", "온오프라인", "온라인", "오프라인"],
      mediums: ["med-3d-motion-still", "med-real-cgi-keyvisual", "med-human-3d-data", "med-pub-conference-dark"],
      reason: "행사의 스케일과 현장감을 살리면서 날짜·장소·CTA를 분리하기 쉽습니다.",
    },
    {
      id: "education-training",
      label: "교육·훈련 모집",
      keywords: ["교육", "훈련", "강의", "강좌", "특강", "세션", "클래스", "과정", "커리큘럼", "교육원", "캠프", "부트캠프", "워크숍", "워크샵", "수강", "수강생", "교육생", "학습", "실습", "멘토링", "코칭", "컨설팅", "자격증", "역량강화", "취업", "채용", "진로", "청년", "대학생", "재직자", "예비창업자", "창업교육"],
      mediums: ["med-real-clay-hybrid", "med-photo-3d-icons", "med-human-3d-data", "med-pub-edu-bright"],
      reason: "친근한 입체 오브젝트와 명확한 정보 블록으로 참여 장벽을 낮춥니다.",
    },
    {
      id: "performance-report",
      label: "성과·리포트",
      keywords: ["성과", "성과보고", "보고", "보고서", "실적", "결과", "결과보고", "리포트", "인사이트", "사례", "우수사례", "성공사례", "통계", "지표", "kpi", "데이터", "분석", "증가", "상승", "개선", "달성", "돌파", "누적", "수상", "선정", "인증", "평가", "만족도", "효과", "발표", "공개", "백서", "연차보고"],
      mediums: ["med-arch-photo-3d-overlay", "med-human-3d-data", "med-photo-3d-icons", "med-pub-performance-report-card"],
      reason: "성과 수치와 근거를 시각화하기 좋아 기관 신뢰도를 높이는 데 유리합니다.",
    },
    {
      id: "product-service",
      label: "제품·서비스 런칭",
      keywords: ["출시", "런칭", "론칭", "오픈", "개시", "공개", "서비스", "서비스오픈", "앱", "어플", "웹", "웹사이트", "플랫폼", "포털", "제품", "상품", "브랜드", "솔루션", "툴", "기능", "업데이트", "리뉴얼", "베타", "사전예약", "예약", "체험", "무료체험", "시범서비스", "구독", "멤버십", "패키지", "프로모션", "할인", "이벤트", "혜택"],
      mediums: ["med-product-photo-cgi", "med-ar-interface-composite", "med-3d-motion-still", "med-real-cgi-keyvisual"],
      reason: "제품·서비스의 사용 장면과 기능을 상업 광고처럼 선명하게 보여줍니다.",
    },
    {
      id: "public-campaign",
      label: "공익·인식 확산",
      keywords: ["캠페인", "공익", "인식개선", "인식확산", "동참", "참여문화", "실천", "약속", "안전문화", "환경", "탄소중립", "저탄소", "기후", "에너지절약", "재활용", "분리배출", "교통안전", "화재예방", "재난", "재난안전", "건강", "예방", "금연", "청렴", "윤리", "갑질근절", "성평등", "인권", "나눔", "봉사", "기부", "사회공헌"],
      mediums: ["med-public-service-campaign", "med-pub-citizen-participation-card", "med-pub-rounded-char", "med-pub-local-program-poster"],
      reason: "참여와 인식 확산 메시지를 친근한 공익 캠페인 톤으로 전달하기 좋습니다.",
    },
    {
      id: "public-notice",
      label: "공지·안내",
      keywords: ["공지", "안내", "알림", "공문", "고지", "통보", "안내문", "안내사항", "절차", "방법", "이용방법", "신청방법", "제출방법", "기간", "운영기간", "대상", "자격", "조건", "문의", "문의처", "연락처", "유의", "주의", "필독", "확인", "체크", "체크리스트", "준비물", "서류", "제출서류", "증빙", "FAQ", "자주묻는질문", "변경", "연장", "취소", "휴무", "점검", "안전", "예방"],
      mediums: ["med-photo-3d-icons", "med-pub-safety-notice", "med-pub-application-step-guide", "med-ar-interface-composite"],
      reason: "복잡한 안내 정보를 아이콘·단계·카드 구조로 정리하기 좋습니다.",
    },
  ];

  const PROMOTION_STYLE_FALLBACK_MEDIUMS = [
    "med-real-cgi-keyvisual",
    "med-photo-3d-icons",
    "med-human-3d-data",
    "med-3d-motion-still",
  ];

  const PROMOTION_RECOMMENDATION_PALETTES = {
    support: ["#1d4ed8", "#ffffff", "#f97316", "#e8f1ff"],
    tech: ["#0f2f57", "#e6f7ff", "#00b8d9", "#7c3aed"],
    event: ["#111827", "#ffffff", "#2563eb", "#f59e0b"],
    education: ["#185abc", "#ffffff", "#10b981", "#e0f2fe"],
    performance: ["#102a56", "#ffffff", "#38bdf8", "#dbeafe"],
    product: ["#111827", "#ffffff", "#2563eb", "#d946ef"],
    notice: ["#1f4f99", "#ffffff", "#f97316", "#edf2f7"],
  };

  const PROMOTION_RECOMMENDATION_CONTENT_TYPE_HINTS = {
    campaign: "캠페인 참여 동참 인식 확산 공공 메시지 공익 실천 안전 환경 건강 청렴 사회공헌",
    "result-promo": "성과 보고 실적 결과 리포트 지표 통계 데이터 발표 사례 만족도 기관 홍보",
    "event-info": "행사 포럼 컨퍼런스 세미나 설명회 박람회 전시 일정 장소 참가 등록 초청",
    "survey-request": "설문 참여 의견 수집 조사 피드백 응답 시민 참여 만족도 공청회 제안",
    "training-info": "교육 훈련 강의 강좌 교육원 워크숍 수강 교육생 청년 취업 멘토링 실습 모집",
    "biz-promo": "지원사업 모집 참가기업 신청 접수 바우처 보조금 지원금 중소기업 소상공인 스타트업 창업",
  };

  const PROMOTION_RECOMMENDATION_COPY_SIGNALS = [
    {
      id: "deadline-urgent",
      label: "마감·신청 행동 강조",
      keywords: ["마감", "마감일", "마감임박", "마지막", "d-", "d day", "d-day", "오늘", "내일", "이번주", "이번 달", "곧 종료", "종료", "연장", "선착순", "한정", "조기마감", "지금", "바로", "즉시", "신청", "신청하기", "등록", "등록하기", "접수", "접수하기", "참가신청", "예약", "예약하기", "모집중", "참여하기", "지원하기", "바로가기", "클릭", "확인하기"],
      fields: ["headline", "subheadline", "bodyCopy", "cta"],
      mediums: ["med-pub-deadline-alert", "med-pub-grant-recruit-card", "med-ar-interface-composite", "med-photo-3d-icons"],
      reason: "마감·신청 행동 문구가 있어 날짜와 CTA가 즉시 보이는 전환형 카드가 적합합니다.",
      palette: "notice",
      weight: 15,
    },
    {
      id: "numbers-proof",
      label: "수치·성과 근거 강조",
      keywords: ["성과", "실적", "선정", "수상", "인증", "평가", "증가", "상승", "개선", "감소", "절감", "달성", "돌파", "누적", "kpi", "통계", "지표", "데이터", "분석", "만족도", "성장률", "전년대비", "전월대비", "명", "개사", "개소", "건", "회", "팀", "억", "억원", "만원", "원", "퍼센트", "%", "배"],
      pattern: /(\d[\d,.]*(?:%|퍼센트|명|개사|개소|건|억|억원|만원|원|회|개|곳|팀|배|년)?)|([+▲]\s*\d)/i,
      fields: ["headline", "subheadline", "bodyCopy"],
      mediums: ["med-pub-performance-report-card", "med-arch-photo-3d-overlay", "med-human-3d-data", "med-pub-benefit-comparison"],
      reason: "수치·성과 근거가 보여 리포트형 정보 구조와 데이터 오버레이 화풍이 더 잘 맞습니다.",
      palette: "performance",
      weight: 16,
    },
    {
      id: "event-venue",
      label: "행사·현장감 강조",
      keywords: ["행사", "포럼", "컨퍼런스", "콘퍼런스", "세미나", "웨비나", "설명회", "간담회", "토론회", "공청회", "워크숍", "워크샵", "박람회", "전시", "전시회", "페어", "데모데이", "피칭", "ir", "네트워킹", "밋업", "상담회", "매칭", "매칭데이", "초청", "초대", "일정", "장소", "행사장", "현장", "온라인", "오프라인", "온오프라인", "연사", "패널", "발표자", "강연", "부스", "등록", "사전등록", "참석", "참가"],
      fields: ["goal", "headline", "subheadline", "bodyCopy", "cta"],
      mediums: ["med-pub-event-bold", "med-3d-motion-still", "med-pub-conference-dark", "med-real-cgi-keyvisual"],
      reason: "행사성 문구가 있어 스케일감과 일정 정보를 동시에 살리는 포스터형 화풍이 적합합니다.",
      palette: "event",
      weight: 15,
    },
    {
      id: "education-friendly",
      label: "교육·참여 장벽 완화",
      keywords: ["교육", "훈련", "강의", "강좌", "특강", "세션", "클래스", "과정", "커리큘럼", "교육원", "캠프", "부트캠프", "워크숍", "워크샵", "수강", "수강신청", "수강생", "교육생", "학습", "실습", "멘토링", "코칭", "컨설팅", "자격증", "역량", "역량강화", "취업", "채용", "진로", "취창업", "청년", "대학생", "재직자", "예비창업자", "입문", "심화"],
      fields: ["goal", "audience", "headline", "subheadline", "bodyCopy"],
      mediums: ["med-pub-edu-bright", "med-real-clay-hybrid", "med-pub-youth-business-support", "med-photo-3d-icons"],
      reason: "교육·훈련성 문구가 있어 친근하고 밝은 정보 카드형 화풍이 적합합니다.",
      palette: "education",
      weight: 15,
    },
    {
      id: "participation-feedback",
      label: "설문·참여 유도",
      keywords: ["설문", "설문조사", "조사", "의견", "의견수렴", "의견청취", "참여", "응답", "답변", "피드백", "만족도", "투표", "제안", "제보", "공모", "아이디어", "공청회", "토론회", "간담회", "주민참여", "시민참여", "국민참여", "참여단", "모니터링단", "서포터즈", "체험단", "리뷰", "후기"],
      fields: ["goal", "headline", "subheadline", "bodyCopy", "cta"],
      mediums: ["med-pub-citizen-participation-card", "med-pub-rounded-char", "med-real-clay-hybrid", "med-pub-local-program-poster"],
      reason: "참여·응답을 유도하는 카피라 친근한 인물/말풍선 중심의 캠페인 카드가 적합합니다.",
      palette: "education",
      weight: 14,
    },
    {
      id: "product-service-launch",
      label: "서비스·제품 출시",
      keywords: ["출시", "런칭", "론칭", "오픈", "개시", "공개", "서비스", "신규서비스", "서비스오픈", "앱", "어플", "웹", "웹사이트", "플랫폼", "포털", "제품", "상품", "브랜드", "솔루션", "툴", "시스템", "기능", "업데이트", "리뉴얼", "개편", "베타", "시범", "시범운영", "시범서비스", "사전예약", "예약", "체험", "무료체험", "구독", "멤버십", "패키지", "혜택", "쿠폰", "이용권"],
      fields: ["goal", "headline", "subheadline", "bodyCopy", "cta"],
      mediums: ["med-product-photo-cgi", "med-pub-service-launch-guide", "med-ar-interface-composite", "med-3d-motion-still"],
      reason: "서비스·제품 소개 문구가 있어 실제 사용 장면과 UI/CGI 결합 화풍이 적합합니다.",
      palette: "product",
      weight: 15,
    },
    {
      id: "official-process",
      label: "절차·준비물 안내",
      keywords: ["절차", "프로세스", "방법", "이용방법", "신청방법", "제출방법", "접수방법", "준비", "준비물", "제출", "서류", "제출서류", "증빙", "양식", "서식", "요건", "조건", "자격", "대상", "대상자", "기간", "운영기간", "접수기간", "문의", "문의처", "연락처", "유의", "주의", "필독", "체크", "체크리스트", "확인", "안내", "faq", "자주묻는질문", "단계", "순서"],
      fields: ["headline", "subheadline", "bodyCopy", "cta"],
      mediums: ["med-pub-application-step-guide", "med-pub-checklist-carousel", "med-pub-faq-notice-card", "med-pub-policy-cardnews"],
      reason: "절차·조건 안내가 많아 단계형 플로우나 체크리스트형 카드가 더 읽기 쉽습니다.",
      palette: "notice",
      weight: 13,
    },
    {
      id: "public-awareness",
      label: "공익·인식 확산",
      keywords: ["캠페인", "공익", "인식개선", "인식확산", "동참", "실천", "약속", "생활화", "문화확산", "안전", "안전문화", "예방", "환경", "탄소중립", "저탄소", "기후", "에너지", "재활용", "분리배출", "건강", "금연", "청렴", "윤리", "인권", "성평등", "나눔", "봉사", "기부", "사회공헌", "함께", "우리"],
      fields: ["goal", "audience", "headline", "subheadline", "bodyCopy", "cta"],
      mediums: ["med-public-service-campaign", "med-pub-citizen-participation-card", "med-pub-rounded-char", "med-pub-local-program-poster"],
      reason: "공익·인식 확산 메시지가 있어 참여를 부드럽게 유도하는 캠페인형 화풍이 적합합니다.",
      palette: "education",
      weight: 13,
    },
    {
      id: "local-community",
      label: "지역·커뮤니티 홍보",
      keywords: ["지역", "지자체", "시민", "주민", "구민", "도민", "군민", "마을", "동네", "상권", "전통시장", "골목상권", "소상공인", "로컬", "커뮤니티", "공동체", "센터", "복지관", "도서관", "청소년", "가족", "어르신", "장애인", "다문화", "생활권", "우리동네"],
      fields: ["goal", "audience", "headline", "subheadline", "bodyCopy"],
      mediums: ["med-pub-local-program-poster", "med-pub-youth-business-support", "med-pub-citizen-participation-card", "med-real-clay-hybrid"],
      reason: "지역·주민 대상 표현이 있어 친근하고 접근성 높은 지역 프로그램형 화풍이 적합합니다.",
      palette: "education",
      weight: 12,
    },
    {
      id: "short-bold-headline",
      label: "짧은 헤드라인 임팩트",
      fields: ["headline"],
      mediums: ["med-real-cgi-keyvisual", "med-3d-motion-still", "med-pub-event-bold", "med-product-photo-cgi"],
      reason: "헤드라인이 짧아 키비주얼을 크게 쓰는 광고형 구성이 효과적입니다.",
      palette: "product",
      weight: 10,
      test: (fields) => {
        const headline = trimValue(fields.headline);
        return headline && headline.replace(/\s/g, "").length <= 14 ? 1 : 0;
      },
    },
    {
      id: "copy-heavy",
      label: "본문 정보량 많음",
      fields: ["bodyCopy"],
      mediums: ["med-pub-policy-cardnews", "med-pub-checklist-carousel", "med-pub-application-step-guide", "med-photo-3d-icons"],
      reason: "본문 포인트가 많아 장식보다 정보 블록을 안정적으로 정리하는 화풍이 적합합니다.",
      palette: "notice",
      weight: 12,
      test: (fields) => {
        const body = trimValue(fields.bodyCopy);
        const lines = body.split(/\r?\n/).filter((line) => trimValue(line)).length;
        return body.length >= 80 || lines >= 3 ? 1 : 0;
      },
    },
  ];

  const PROMOTION_RECOMMENDATION_TRIGGER_FIELDS = new Set([
    "contentType",
    "goal",
    "audience",
    "headline",
    "subheadline",
    "bodyCopy",
    "cta",
    "tone",
    "visualStyle",
    "bigIdea",
    "visualMetaphor",
    "mandatoryElements",
  ]);

  const PROMOTION_SINGLE_QUICK_FIELD_IDS = new Set([
    "promotionGoal",
    "promotionAudience",
  ]);

  // ── 프롬프트 엔진 연결 ──────────────────────────────────
  const {
    renderBasicPrompt, sanitizePromptForAI,
    conceptPromptPartsFromStyle, applyConceptPartsToState,
    prunePromptLines, resolveConflictLines,
    getAppliedConceptLines, getConceptBridgeLines, getPaletteRoleSplitLines,
    qrCodePromptLines,
  } = window.PROMO_PROMPT;
  // ─────────────────────────────────────────────────────────────

  function conceptStripValuesFromState() {
    return [
      state.appliedConceptStyle,
      state.appliedConceptDesc,
      state.appliedConceptName,
      state.appliedConceptPalette,
      state.appliedConceptVisualDNA,
      state.appliedConceptPaletteStrategy,
      state.appliedConceptTextureRendering,
      state.appliedConceptLightingMood,
      state.appliedConceptShapeLanguage,
      state.appliedConceptLayoutBehavior,
      state.appliedConceptTypographyGuidance,
      state.appliedConceptCampaignAdaptation,
      state.appliedConceptObjectAdaptation,
      state.appliedConceptAvoid,
      state.appliedConceptQualityRules,
    ].map(normalizeConceptStripValue).filter(Boolean);
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


  function hasQuickButtonValue(currentValue, nextValue, targetInput) {
    const normalizedNext = normalizeQuickToken(nextValue);
    if (!normalizedNext) return false;
    if (PROMOTION_SINGLE_QUICK_FIELD_IDS.has(targetInput?.id)) {
      return normalizeQuickToken(currentValue) === normalizedNext;
    }
    return splitQuickButtonValues(currentValue, targetInput, nextValue)
      .some((item) => normalizeQuickToken(item) === normalizedNext);
  }

  function toggleQuickButtonValue(currentValue, nextValue, targetInput) {
    if (PROMOTION_SINGLE_QUICK_FIELD_IDS.has(targetInput?.id)) {
      return trimValue(nextValue);
    }

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
    const valuesToApply = PROMOTION_SINGLE_QUICK_FIELD_IDS.has(input.id)
      ? fallbackValues.slice(0, 1)
      : fallbackValues;
    let nextValue = "";
    valuesToApply.forEach((value) => {
      nextValue = toggleQuickButtonValue(nextValue, value, input);
    });

    input.value = nextValue;
    state[stateKey] = nextValue;
    return true;
  }



  function isAiColorStrategy() {
    return normalizeColorStrategy(state.colorStrategy) === "ai";
  }



  function isConceptGeneratedPromptValue(value) {
    const lines = normalizeLines(value);
    if (!lines.length || !state.appliedConceptStyle) return false;
    const stripValues = conceptStripValuesFromState();
    return lines.some((line) => isConceptInjectedLine(line, stripValues) || line.includes(trimValue(state.appliedConceptName)));
  }

  function getNonConceptPromptLines(value) {
    const stripValues = conceptStripValuesFromState();
    return normalizeLines(value).filter((line) => !isConceptInjectedLine(line, stripValues));
  }


  function shouldUseCompactPromptGuidance() {
    return true;
  }

  function isBasicVisualPlanningMode() {
    return true;
  }

  function hasBasicConceptPromptInput() {
    return [
      state.appliedConceptStyle,
      state.appliedConceptVisualDNA,
      state.appliedConceptCampaignAdaptation,
      state.appliedConceptObjectAdaptation,
      state.appliedConceptLayoutBehavior,
      state.appliedConceptPaletteStrategy,
      state.appliedConceptQualityRules,
      state.appliedConceptAvoid,
    ].some((value) => trimValue(value));
  }

  function scrubConceptFromDetailPlanningFields(stripValues = conceptStripValuesFromState()) {
    state.visualStyle = stripConceptInjectedLines(state.visualStyle, stripValues);
    state.bigIdea = stripConceptInjectedLines(state.bigIdea, stripValues);
    state.visualMetaphor = stripConceptInjectedLines(state.visualMetaphor, stripValues);
    state.backgroundDetails = stripConceptInjectedLines(state.backgroundDetails, stripValues);
    state.qualityNotes = stripConceptInjectedLines(state.qualityNotes, stripValues);
    state.forbiddenElements = stripConceptInjectedLines(state.forbiddenElements, stripValues) || DEFAULT_STATE.forbiddenElements;

    const conceptColors = trimValue(state.appliedConceptPalette)
      .split(/\s*,\s*/)
      .map((color) => color.toLowerCase())
      .filter(Boolean);
    if (!conceptColors.length) return;

    ["primaryColor", "secondaryColor", "accentColor", "backgroundColor"].forEach((key) => {
      const value = trimValue(state[key]).toLowerCase();
      if (value && conceptColors.includes(value)) {
        state[key] = "";
      }
    });
  }

  function compactConceptSummary(value) {
    return String(value || "")
      .replace(/color palette\s*:\s*#[0-9a-fA-F]{3,6}(?:[\s,]+#[0-9a-fA-F]{3,6})*/gi, "")
      .replace(/#[0-9a-fA-F]{3,6}/g, "")
      .replace(/컨셉 팔레트|팔레트 전체|색상 팔레트|color roles|palette roles/gi, "")
      .replace(/\s*[,/]\s*(?=[,/]|$)/g, "")
      .replace(/\s{2,}/g, " ")
      .replace(/\s*([./])\s*/g, "$1 ")
      .trim();
  }

  function getMixerMediums() {
    return Array.isArray(window.CONCEPT_MIXER_PRESETS?.MIXER_MEDIUMS)
      ? window.CONCEPT_MIXER_PRESETS.MIXER_MEDIUMS
      : [];
  }

  function getMixerMediumById(id) {
    return getMixerMediums().find((medium) => medium.id === id) || null;
  }

  function getVisibleRecommendationFieldValue(fieldKey) {
    const input = root.querySelector(`[data-promo-field="${fieldKey}"]`);
    if (!input) return "";
    return input.type === "checkbox" ? String(input.checked) : input.value;
  }

  function getPromotionRecommendationFieldTexts() {
    hydratePromotionRecommendationStateFromDom();
    const contentTypeValue = getVisibleRecommendationFieldValue("contentType");
    const contentTypeHint = contentTypeValue
      ? `${contentTypeValue} ${PROMOTION_RECOMMENDATION_CONTENT_TYPE_HINTS[contentTypeValue] || ""}`
      : "";
    const fields = {
      contentType: contentTypeHint,
      goal: getVisibleRecommendationFieldValue("goal"),
      audience: getVisibleRecommendationFieldValue("audience"),
      headline: getVisibleRecommendationFieldValue("headline"),
      subheadline: getVisibleRecommendationFieldValue("subheadline"),
      bodyCopy: getVisibleRecommendationFieldValue("bodyCopy"),
      cta: getVisibleRecommendationFieldValue("cta"),
      tone: getVisibleRecommendationFieldValue("tone"),
      visualStyle: getVisibleRecommendationFieldValue("visualStyle"),
      bigIdea: getVisibleRecommendationFieldValue("bigIdea"),
      visualMetaphor: getVisibleRecommendationFieldValue("visualMetaphor"),
      mandatoryElements: getVisibleRecommendationFieldValue("mandatoryElements"),
    };
    fields.all = Object.values(fields)
      .map((value) => String(value || ""))
      .join(" ");
    return fields;
  }

  function getPromotionRecommendationContext() {
    return String(getPromotionRecommendationFieldTexts().all || "").toLowerCase();
  }

  function hydratePromotionRecommendationStateFromDom() {
    root.querySelectorAll("[data-promo-field]").forEach((input) => {
      const fieldKey = input.dataset.promoField;
      if (!PROMOTION_RECOMMENDATION_TRIGGER_FIELDS.has(fieldKey)) return;
      state[fieldKey] = input.type === "checkbox" ? String(input.checked) : input.value;
    });
  }

  function schedulePromotionStyleRecommendationRefresh(fieldKey) {
    const panel = $("promotionStyleRecommendPanel");
    if (!panel || panel.hidden) return;
    if (fieldKey && !PROMOTION_RECOMMENDATION_TRIGGER_FIELDS.has(fieldKey)) return;

    clearTimeout(recommendationRefreshTimer);
    recommendationRefreshTimer = setTimeout(() => {
      renderPromotionStyleRecommendations({ silent: true });
    }, 120);
  }

  function getRecommendationPalette(ruleId) {
    if (ruleId === "technology-innovation") return PROMOTION_RECOMMENDATION_PALETTES.tech;
    if (ruleId === "event-conference") return PROMOTION_RECOMMENDATION_PALETTES.event;
    if (ruleId === "education-training") return PROMOTION_RECOMMENDATION_PALETTES.education;
    if (ruleId === "performance-report") return PROMOTION_RECOMMENDATION_PALETTES.performance;
    if (ruleId === "product-service") return PROMOTION_RECOMMENDATION_PALETTES.product;
    if (ruleId === "public-notice") return PROMOTION_RECOMMENDATION_PALETTES.notice;
    return PROMOTION_RECOMMENDATION_PALETTES.support;
  }

  function scoreRecommendationRule(rule, contextText) {
    return rule.keywords.reduce((score, keyword) => (
      contextText.includes(String(keyword).toLowerCase()) ? score + 1 : score
    ), 0);
  }

  function scoreRecommendationKeywords(text, keywords = []) {
    const normalized = String(text || "").toLowerCase();
    if (!normalized) return 0;
    return keywords.reduce((score, keyword) => (
      normalized.includes(String(keyword).toLowerCase()) ? score + 1 : score
    ), 0);
  }

  function getRecommendationPaletteByKey(key) {
    return PROMOTION_RECOMMENDATION_PALETTES[key] || PROMOTION_RECOMMENDATION_PALETTES.support;
  }

  function getActivePromotionCopySignals(fields) {
    return PROMOTION_RECOMMENDATION_COPY_SIGNALS
      .map((signal) => {
        const signalText = (signal.fields || ["all"])
          .map((fieldKey) => fields[fieldKey] || "")
          .join(" ");
        const keywordScore = scoreRecommendationKeywords(signalText, signal.keywords);
        const patternScore = signal.pattern && signal.pattern.test(signalText) ? 2 : 0;
        const customScore = typeof signal.test === "function" ? Number(signal.test(fields) || 0) : 0;
        const score = keywordScore + patternScore + customScore;
        return { signal, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  function addPromotionRecommendationCandidate(candidateMap, mediumId, payload) {
    const medium = getMixerMediumById(mediumId);
    if (!medium) return;

    const existing = candidateMap.get(mediumId);
    if (!existing) {
      candidateMap.set(mediumId, {
        medium,
        ruleId: payload.ruleId,
        ruleLabel: payload.ruleLabel,
        reason: payload.reason,
        palette: payload.palette,
        score: payload.score,
        reasonScore: payload.score,
        sourceCount: 1,
      });
      return;
    }

    existing.sourceCount += 1;
    existing.score = Math.max(existing.score, payload.score);
    if (payload.score >= existing.reasonScore) {
      existing.ruleId = payload.ruleId;
      existing.ruleLabel = payload.ruleLabel;
      existing.reason = payload.reason;
      existing.palette = payload.palette || existing.palette;
      existing.reasonScore = payload.score;
    }
  }

  function buildRecommendedPromotionStyle(recommendation) {
    const medium = recommendation.medium;
    const mediumNameEn = String(medium.id || "")
      .replace(/^med-/, "")
      .split("-")
      .map((word) => word.toLowerCase() === "3d" ? "3D" : word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    const prompt = `${medium.prefix || "commercial visual style of"} campaign key visual, ${medium.suffix || medium.desc || ""}`.trim();
    const palette = recommendation.palette || PROMOTION_RECOMMENDATION_PALETTES.support;
    const promptParts = {
      visualDNA: `${mediumNameEn} / ${recommendation.ruleLabel}`,
      paletteStrategy: `Use campaign palette roles: primary ${palette[0]}, background ${palette[1]}, accent ${palette[2]}, support ${palette[3] || palette[1]}. Keep strongest contrast for headline, CTA, and key information.`,
      textureRendering: medium.suffix || medium.desc || "polished commercial visual rendering",
      lightingMood: "commercial campaign lighting with clear readable foreground zones",
      shapeLanguage: "structured promotional composition with a clear hero visual, information area, and CTA zone",
      layoutBehavior: "headline-first layout with clean copy space, controlled depth, and no visual conflict behind text",
      typographyGuidance: "clean modern sans-serif hierarchy; headline remains large, sharp, and readable at mobile thumbnail size",
      campaignAdaptation: `Adapt the ${medium.nameKo} style to the current promotion goal and content type.`,
      objectAdaptation: "Represent the promoted organization, service, event, or benefit as an immediately understandable main visual metaphor.",
      avoid: "avoid unrelated decorative objects, fake logos, unreadable text, noisy backgrounds, and style inconsistency",
      qualityRules: "premium commercial finish, believable composition, precise spacing, strong contrast, and polished Korean public-service communication quality",
    };

    const style = {
      id: `recommended-${medium.id}`,
      category: medium.category === "tech3d" ? "3d" : "modern",
      mixerCategory: medium.category || "",
      nameKo: `${medium.nameKo} 추천`,
      nameEn: `${mediumNameEn} Recommendation`,
      emoji: medium.emoji || "🎨",
      desc: `${recommendation.ruleLabel}: ${recommendation.reason}`,
      descEn: recommendation.reason,
      prompt,
      promotionPrompt: prompt,
      promptParts,
      palette,
      tags: ["recommended", recommendation.ruleLabel, medium.nameKo].filter(Boolean),
      mediumId: medium.id,
      paletteIdx: 0,
      compositionId: "none",
      typographyId: "none",
    };

    return typeof window.buildPromotionConceptStyle === "function"
      ? window.buildPromotionConceptStyle(style)
      : style;
  }

  function getPromotionStyleRecommendations() {
    const fields = getPromotionRecommendationFieldTexts();
    const contextText = String(fields.all || "").toLowerCase();
    const scoredRules = PROMOTION_STYLE_RECOMMENDATION_RULES
      .map((rule) => ({ rule, score: scoreRecommendationRule(rule, contextText) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
    const activeRules = scoredRules.length
      ? scoredRules
      : [{ rule: PROMOTION_STYLE_RECOMMENDATION_RULES[0], score: 0 }];
    const activeSignals = getActivePromotionCopySignals(fields);
    const candidateMap = new Map();

    activeRules.forEach(({ rule, score }) => {
      rule.mediums.forEach((mediumId, index) => {
        addPromotionRecommendationCandidate(candidateMap, mediumId, {
          ruleId: rule.id,
          ruleLabel: rule.label,
          reason: rule.reason,
          palette: getRecommendationPalette(rule.id),
          score: (score * 9) + (rule.mediums.length - index),
        });
      });
    });

    activeSignals.slice(0, 5).forEach(({ signal, score }) => {
      signal.mediums.forEach((mediumId, index) => {
        addPromotionRecommendationCandidate(candidateMap, mediumId, {
          ruleId: signal.id,
          ruleLabel: signal.label,
          reason: signal.reason,
          palette: getRecommendationPaletteByKey(signal.palette),
          score: (score * signal.weight) + ((signal.mediums.length - index) * 2),
        });
      });
    });

    const recommendations = Array.from(candidateMap.values())
      .map((item) => ({
        ...item,
        score: item.score + Math.min(item.sourceCount, 3) * 2,
      }))
      .sort((a, b) => b.score - a.score);
    const seen = new Set(recommendations.map((item) => item.medium.id));

    PROMOTION_STYLE_FALLBACK_MEDIUMS.forEach((mediumId) => {
      if (recommendations.length >= 4 || seen.has(mediumId)) return;
      const medium = getMixerMediumById(mediumId);
      if (!medium) return;
      seen.add(mediumId);
      recommendations.push({
        medium,
        ruleId: "fallback",
        ruleLabel: "범용 상업 비주얼",
        reason: "입력 정보가 적어도 대부분의 기관 홍보물에 안정적으로 맞는 범용 화풍입니다.",
        palette: PROMOTION_RECOMMENDATION_PALETTES.support,
        score: 1,
      });
    });

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }

  function renderPromotionStyleRecommendations({ silent = false } = {}) {
    const panel = $("promotionStyleRecommendPanel");
    if (!panel) return;
    const recommendations = getPromotionStyleRecommendations();
    if (!recommendations.length) {
      panel.hidden = true;
      panel.innerHTML = "";
      if (!silent) status("추천 가능한 화풍 데이터를 찾지 못했습니다.", "error");
      return;
    }

    panel.hidden = false;
    panel.innerHTML = `
      <div class="promo-style-recommend-head">
        <div>
          <strong>목적 기반 추천 화풍</strong>
          <span>홍보 목적·컨텐츠 유형·문구를 기준으로 상업용 화풍을 제안합니다.</span>
        </div>
        <button type="button" class="promo-style-recommend-close" data-promo-recommend-close>닫기</button>
      </div>
      <div class="promo-style-recommend-grid">
        ${recommendations.map((item, index) => `
          <article class="promo-style-recommend-card">
            <div class="promo-style-recommend-title">
              <span>${escapeHtml(item.medium.emoji || "🎨")}</span>
              <strong>${escapeHtml(item.medium.nameKo || "")}</strong>
            </div>
            <p>${escapeHtml(item.medium.desc || item.reason)}</p>
            <div class="promo-style-recommend-reason">${escapeHtml(item.ruleLabel)} · ${escapeHtml(item.reason)}</div>
            <button type="button" class="gen-btn secondary promo-style-recommend-apply" data-promo-recommend-index="${index}">적용</button>
          </article>
        `).join("")}
      </div>
    `;
    panel.__promotionStyleRecommendations = recommendations;
    if (!silent) status("홍보 목적과 문구를 기준으로 추천 화풍을 준비했습니다.", "info");
  }

  function applyPromotionStyleRecommendation(index) {
    const panel = $("promotionStyleRecommendPanel");
    const recommendations = panel?.__promotionStyleRecommendations || getPromotionStyleRecommendations();
    const recommendation = recommendations[Number(index)];
    if (!recommendation || !recommendation.medium) return;
    window.applyPromotionConceptStyle(buildRecommendedPromotionStyle(recommendation));
    if (panel) panel.hidden = true;
    status(`추천 화풍 '${recommendation.medium.nameKo}'을 적용했습니다.`, "success");
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

  function normalizeTargetEngine(value) {
    return "dalle";
  }

  function isOpenAITargetEngine(value) {
    return normalizeTargetEngine(value) === "dalle";
  }

  function isGeminiTargetEngine(value = state.targetEngine) {
    return normalizeTargetEngine(value) === "imagen";
  }

  function forceGeminiManualTextModes(targetState = state) {
    if (!isGeminiTargetEngine(targetState.targetEngine)) return false;

    let changed = false;
    AI_TOGGLE_FIELDS.forEach((field) => {
      const modeKey = `${field}Mode`;
      if (targetState[modeKey] !== "manual") {
        targetState[modeKey] = "manual";
        changed = true;
      }
    });
    return changed;
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
        if (key === "logoItems") {
          next[key] = normalizePromotionLogoItems(incoming[key], incoming);
        } else if (key === "logoRoleLabels") {
          next[key] = normalizePromotionLogoRoleLabels(incoming[key]);
        } else {
          next[key] = String(incoming[key]);
        }
      }
    });

    next.logoItems = normalizePromotionLogoItems(incoming.logoItems, incoming);
    next.logoRoleLabels = normalizePromotionLogoRoleLabels(incoming.logoRoleLabels);

    if (!next.qualityNotes || next.qualityNotes.trim() === "") {
      next.qualityNotes = DEFAULT_STATE.qualityNotes;
    }

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
    next.targetEngine = normalizeTargetEngine(incoming.targetEngine || next.targetEngine);
    next.visualPlanningMode = incoming.visualPlanningMode === "detail" ? "detail" : DEFAULT_STATE.visualPlanningMode;
    next.omitEmptyFields = normalizeBooleanSetting(incoming.omitEmptyFields, DEFAULT_STATE.omitEmptyFields);
    next.dedupePromptLines = normalizeBooleanSetting(incoming.dedupePromptLines, DEFAULT_STATE.dedupePromptLines);
    next.autoResolveConflicts = normalizeBooleanSetting(incoming.autoResolveConflicts, DEFAULT_STATE.autoResolveConflicts);
    next.qualityNotesEnabled = normalizeBooleanSetting(incoming.qualityNotesEnabled, DEFAULT_STATE.qualityNotesEnabled);
    next.commercialBaseline = ["off", "standard", "premium", "luxury"].includes(incoming.commercialBaseline)
      ? incoming.commercialBaseline
      : DEFAULT_STATE.commercialBaseline;
    next.creativityLevel = ["stable", "balanced", "experimental"].includes(incoming.creativityLevel)
      ? incoming.creativityLevel
      : DEFAULT_STATE.creativityLevel;
    next.colorStrategy = COLOR_STRATEGY_VALUES.includes(incoming.colorStrategy)
      ? incoming.colorStrategy
      : DEFAULT_STATE.colorStrategy;
    next.colorMode = incoming.colorMode === "dark" ? "dark" : DEFAULT_STATE.colorMode;
    next.variationMode = ["none", "typo", "visual", "color-graphic", "cinematic", "proof", "experimental", "content-focus", "official-notice"].includes(incoming.variationMode)
      ? incoming.variationMode
      : DEFAULT_STATE.variationMode;
    next.keyVisualPlacement = ["auto", "background", "foreground"].includes(incoming.keyVisualPlacement)
      ? incoming.keyVisualPlacement
      : DEFAULT_STATE.keyVisualPlacement;
    next.qrSize = ["small", "medium", "large"].includes(incoming.qrSize)
      ? incoming.qrSize
      : DEFAULT_STATE.qrSize;
    next.qrPosition = ["auto", "bottom-right", "bottom-left", "top-right", "top-left", "inline-info"].includes(incoming.qrPosition)
      ? incoming.qrPosition
      : DEFAULT_STATE.qrPosition;
    next.logoArrangement = ["row", "grid", "split"].includes(incoming.logoArrangement)
      ? incoming.logoArrangement
      : DEFAULT_STATE.logoArrangement;
    next.logoPosition = ["bottom", "top"].includes(incoming.logoPosition)
      ? incoming.logoPosition
      : DEFAULT_STATE.logoPosition;
    next.logoStyle = ["placeholder", "wordmark", "blank"].includes(incoming.logoStyle)
      ? incoming.logoStyle
      : DEFAULT_STATE.logoStyle;
    next.logoTextMode = ["hidden", "plain", "transparent"].includes(incoming.logoTextMode)
      ? incoming.logoTextMode
      : DEFAULT_STATE.logoTextMode;
    next.logoBlendStyle = ["panel", "scene", "ribbon", "line", "glass"].includes(incoming.logoBlendStyle)
      ? incoming.logoBlendStyle
      : DEFAULT_STATE.logoBlendStyle;
    next.conceptInfluenceMode = ["balanced", "strong", "style-only"].includes(incoming.conceptInfluenceMode)
      ? incoming.conceptInfluenceMode
      : DEFAULT_STATE.conceptInfluenceMode;

    ["posterOffer", "snsHook", "snsHashtags", "cta"].forEach((field) => {
      const enabledKey = `${field}Enabled`;
      const modeKey = `${field}Mode`;
      next[enabledKey] = normalizeBooleanSetting(incoming[enabledKey], DEFAULT_STATE[enabledKey]);
      next[modeKey] = incoming[modeKey] === "manual" ? "manual" : DEFAULT_STATE[modeKey];
    });
    forceGeminiManualTextModes(next);

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
      state[key] = key === "logoItems" || key === "logoRoleLabels" ? deepClone(normalized[key]) : normalized[key];
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

  function bindSizeQuickPresets() {
    const container = document.getElementById("promoSizeQuickPresets");
    if (!container) return;
    container.addEventListener("click", (e) => {
      const chip = e.target.closest(".promo-sqp-chip");
      if (!chip) return;
      const mode = chip.dataset.sqpMode;
      if (mode === "direct") {
        applySizePreset({
          sizeMode: "direct",
          directSizeUnit: chip.dataset.sqpUnit || "px",
          directSizeW: chip.dataset.sqpW || "",
          directSizeH: chip.dataset.sqpH || "",
        });
      } else {
        applySizePreset({
          sizeMode: "ratio",
          ratio: chip.dataset.sqpRatio || "4:5",
          orientation: chip.dataset.sqpOrientation || "vertical",
        });
      }
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

    root.querySelectorAll("[data-promo-color-mode]").forEach((button) => {
      const mode = button.dataset.promoColorMode === "dark" ? "dark" : "light";
      const active = mode === state.colorMode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
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

  const PROMOTION_LOGO_ROLE_OPTIONS = [
    { value: "host", label: "주최", hint: "공식 주최 기관" },
    { value: "organizer", label: "주관", hint: "운영·주관 기관" },
    { value: "sponsor", label: "후원", hint: "후원·협력 기관" },
    { value: "partner", label: "협력", hint: "협력·참여 기관" },
  ];

  const PROMOTION_DEFAULT_LOGO_ROLE_LABELS = PROMOTION_LOGO_ROLE_OPTIONS.reduce((acc, roleOption) => {
    acc[roleOption.value] = roleOption.label;
    return acc;
  }, {});

  const PROMOTION_LOGO_BLEND_META = {
    panel: "자연 배치형 (구도에 맞춰 작게 배치)",
    scene: "장면 통합형 (이미지 흐름에 자연스럽게 배치)",
    ribbon: "흐름 배치형 (곡선·띠 흐름을 따라 배치)",
    line: "정렬 배치형 (한 줄 기준으로 정돈)",
    glass: "단순 배치형 (장식 없이 깔끔하게 배치)",
  };

  const PROMOTION_LOGO_POSITION_META = {
    bottom: "하단 통합",
    top: "상단 통합",
  };

  const PROMOTION_LOGO_ARRANGEMENT_META = {
    row: "가로 일렬",
    grid: "그리드",
    split: "좌우 분산",
  };

  const PROMOTION_LOGO_PRESETS = {
    publicNotice: {
      blendStyle: "panel",
      style: "placeholder",
      position: "bottom",
      arrangement: "grid",
      labelShow: true,
      emphasis: false,
    },
    eventPoster: {
      blendStyle: "ribbon",
      style: "placeholder",
      position: "top",
      arrangement: "row",
      labelShow: true,
      emphasis: false,
    },
    postProduction: {
      blendStyle: "line",
      style: "blank",
      position: "bottom",
      arrangement: "row",
      labelShow: false,
      emphasis: false,
    },
  };

  function getPromotionLogoRoleMeta(role) {
    return PROMOTION_LOGO_ROLE_OPTIONS.find((item) => item.value === role) || PROMOTION_LOGO_ROLE_OPTIONS[0];
  }

  function normalizePromotionLogoRoleLabels(rawLabels) {
    const source = rawLabels && typeof rawLabels === "object" && !Array.isArray(rawLabels) ? rawLabels : {};
    return PROMOTION_LOGO_ROLE_OPTIONS.reduce((acc, roleOption) => {
      const value = trimValue(source[roleOption.value]);
      acc[roleOption.value] = value || PROMOTION_DEFAULT_LOGO_ROLE_LABELS[roleOption.value];
      return acc;
    }, {});
  }

  function getPromotionLogoRoleLabel(role) {
    if (!state.logoRoleLabels || typeof state.logoRoleLabels !== "object" || Array.isArray(state.logoRoleLabels)) {
      state.logoRoleLabels = normalizePromotionLogoRoleLabels(state.logoRoleLabels);
    }
    const meta = getPromotionLogoRoleMeta(role);
    return trimValue(state.logoRoleLabels[meta.value]) || meta.label;
  }

  function splitPromotionLogoNames(rawName) {
    return String(rawName || "")
      .split(/[,\n]/)
      .map((name) => trimValue(name))
      .filter(Boolean);
  }

  function createPromotionLogoItem(overrides = {}) {
    const next = overrides && typeof overrides === "object" ? overrides : {};
    const role = PROMOTION_LOGO_ROLE_OPTIONS.some((item) => item.value === next.role) ? next.role : "host";
    return {
      role,
      name: splitPromotionLogoNames(next.name).join(", "),
    };
  }

  function normalizePromotionLogoItems(rawItems, legacySource) {
    const source = Array.isArray(rawItems) ? rawItems : [];
    const items = source
      .map((item) => createPromotionLogoItem(item))
      .filter((item) => item.name);

    if (items.length) return items;

    const legacyItems = [
      { role: "host", name: legacySource?.logoHost },
      { role: "organizer", name: legacySource?.logoOrganizer },
      { role: "sponsor", name: legacySource?.logoSponsor },
    ]
      .map((item) => createPromotionLogoItem(item))
      .filter((item) => item.name);

    return legacyItems;
  }

  function getPromotionLogoItems() {
    if (!Array.isArray(state.logoItems)) {
      state.logoItems = normalizePromotionLogoItems([], state);
    }
    return state.logoItems;
  }

  function getPromotionLogoItemByRole(role) {
    return getPromotionLogoItems().find((item) => item.role === role) || createPromotionLogoItem({ role, name: "" });
  }

  function upsertPromotionLogoItem(role, nameValue) {
    const normalizedName = splitPromotionLogoNames(nameValue).join(", ");
    const items = getPromotionLogoItems();
    const index = items.findIndex((item) => item.role === role);
    if (!normalizedName) {
      if (index >= 0) items.splice(index, 1);
      return;
    }
    const nextItem = createPromotionLogoItem({ role, name: normalizedName });
    if (index >= 0) items[index] = nextItem;
    else items.push(nextItem);
  }

  function setPromotionLogoRoleCount(role, countValue) {
    const meta = getPromotionLogoRoleMeta(role);
    const count = Math.max(0, Math.min(12, Number.parseInt(countValue, 10) || 0));
    const items = getPromotionLogoItems();
    const index = items.findIndex((item) => item.role === meta.value);
    if (!count) {
      if (index >= 0) items.splice(index, 1);
      return;
    }
    const nextItem = createPromotionLogoItem({
      role: meta.value,
      name: Array.from({ length: count }, (_, i) => `${meta.label} 로고 ${i + 1}`).join(", "),
    });
    if (index >= 0) items[index] = nextItem;
    else items.push(nextItem);
  }

  function getExpandedPromotionLogoItems() {
    return getPromotionLogoItems().flatMap((item) =>
      splitPromotionLogoNames(item.name).map((name) => ({
        role: item.role,
        name,
      }))
    );
  }

  function getLogoUiSummaryChips() {
    const items = getExpandedPromotionLogoItems();
    return [
      { label: "어울림", value: PROMOTION_LOGO_BLEND_META[state.logoBlendStyle] || "자연 여백형" },
      { label: "위치", value: PROMOTION_LOGO_POSITION_META[state.logoPosition] || "하단 통합" },
      { label: "배치", value: PROMOTION_LOGO_ARRANGEMENT_META[state.logoArrangement] || "가로 일렬" },
      { label: "로고 수", value: `${items.length || 0}개` },
    ];
  }

  function getLogoRoleActivityStats() {
    return PROMOTION_LOGO_ROLE_OPTIONS.map((roleOption) => {
      const item = getPromotionLogoItemByRole(roleOption.value);
      const names = splitPromotionLogoNames(item.name);
      return {
        role: roleOption.value,
        label: getPromotionLogoRoleLabel(roleOption.value),
        hint: roleOption.hint,
        count: names.length,
        active: Boolean(names.length),
        names,
      };
    });
  }

  function getLogoExperienceSummary() {
    const blend = state.logoBlendStyle;
    const position = state.logoPosition;
    const arrangement = state.logoArrangement;

    const titleParts = [];
    if (blend === "panel") titleParts.push("자연 여백형");
    else if (blend === "scene") titleParts.push("장면 통합형");
    else if (blend === "ribbon") titleParts.push("흐름 여백형");
    else if (blend === "line") titleParts.push("정렬 여백형");
    else if (blend === "glass") titleParts.push("공간 확보형");

    if (position === "top") titleParts.push("상단 인지");
    else titleParts.push("하단 정리");

    if (arrangement === "split") titleParts.push("역할 분리");
    else if (arrangement === "grid") titleParts.push("다기관 대응");
    else titleParts.push("일렬 노출");

    let description = "이미지와 분리된 박스나 빈 여백이 아니라, 생성된 이미지의 구도에 어울리는 로고 배치 방향을 정하는 설정입니다.";
    if (blend === "scene") {
      description = "이미지 안의 비어 있는 장면 공간을 활용해 후처리 시 로고를 넣기 쉽게 둡니다.";
    } else if (blend === "ribbon") {
      description = "시선 흐름을 따라 로고가 들어갈 공간만 비워두고, 장식 요소는 추가하지 않습니다.";
    } else if (blend === "line") {
      description = "선이나 테두리 없이 줄맞춤만 고려해 로고 삽입 공간을 남깁니다.";
    } else if (blend === "glass") {
      description = "별도 시각 효과 없이 로고가 들어갈 공간만 자연스럽게 비워두는 가장 안전한 방식입니다.";
    }

    return {
      title: titleParts.join(" · "),
      description,
    };
  }

  function getLogoEditSafetySummary() {
    if (state.logoBlendStyle === "scene") {
      return {
        title: "주의",
        description: "장면에 녹아드는 설정이라 실제 로고 삽입 위치를 후처리에서 더 섬세하게 맞춰야 할 수 있습니다.",
      };
    }
    return {
      title: "높음",
      description: "기관명은 보이지 않게 하고, 실제 로고를 나중에 얹기 좋은 배치 위치만 가이드합니다.",
    };
  }

  function getLogoDensitySummary() {
    const itemCount = getExpandedPromotionLogoItems().length;
    if (!itemCount) {
      return {
        title: "준비 전",
        description: "역할별 로고 개수를 지정하면 실제 밀도와 배치 감각이 더 정확하게 반영됩니다.",
      };
    }
    if (itemCount >= 6 && state.logoArrangement === "row") {
      return {
        title: "밀도 높음",
        description: "가로 일렬 대비 기관 수가 많아 보입니다. 그리드나 좌우 분산이 더 안정적일 수 있습니다.",
      };
    }
    if (state.logoArrangement === "split") {
      return {
        title: "역할 분산형",
        description: "주최·주관과 후원·협력을 시각적으로 나눠 읽히게 하는 구조입니다.",
      };
    }
    if (state.logoArrangement === "grid") {
      return {
        title: "정돈형",
        description: "기관 수가 늘어나도 줄맞춤이 쉬워 공고형 이미지에 잘 어울립니다.",
      };
    }
    return {
      title: "가벼움",
      description: "기관 수가 많지 않아 일렬 배치만으로도 자연스럽게 보일 가능성이 큽니다.",
    };
  }

  function getLogoPreviewTemplate() {
    if (state.logoBlendStyle === "ribbon") {
      return {
        key: "event",
        label: "행사 홍보형",
        headline: "행사 타이틀 존",
        body: "일정 · 장소 · 신청 포인트가 빠르게 읽히는 포스터형 레이아웃",
        eyebrow: "EVENT",
      };
    }
    if (state.logoBlendStyle === "glass" || state.logoBlendStyle === "scene") {
      return {
        key: "brand",
        label: "브랜드 홍보형",
        headline: "브랜드 메시지 존",
        body: "핵심 문구와 비주얼 무드가 먼저 보이는 캠페인형 레이아웃",
        eyebrow: "BRAND",
      };
    }
    return {
      key: "public",
      label: "공공 공고형",
      headline: "공고 헤드라인 존",
      body: "지원 내용 · 대상 · 신청 방법을 정돈해 읽히는 안내형 레이아웃",
      eyebrow: "NOTICE",
    };
  }

  function getLogoGuidanceMessages() {
    const items = getExpandedPromotionLogoItems();
    const messages = [];

    if (!items.length) {
      messages.push("미리보기에서 역할별 로고 개수를 1개 이상 지정하면 이미지 구도에 어울리는 로고 배치 가이드가 프롬프트에 반영됩니다.");
    }
    if (state.logoArrangement === "split") {
      const leftCount = items.filter((item) => item.role === "host" || item.role === "organizer").length;
      const rightCount = items.filter((item) => item.role === "sponsor" || item.role === "partner").length;
      if (!leftCount || !rightCount) {
        messages.push("좌우 분산은 양쪽 역할군이 모두 있어야 자연스럽습니다. 한쪽 그룹이 비면 가로 일렬이나 그리드가 더 안정적입니다.");
      }
    }
    if (items.length >= 6 && state.logoArrangement === "row") {
      messages.push("기관 수가 많은데 가로 일렬을 쓰면 과밀해질 수 있습니다. 그리드 배열이 더 읽기 쉬운 경우가 많습니다.");
    }
    if (state.logoPosition === "bottom" && isEnabled(state.qrEnabled) && (state.qrPosition === "bottom-right" || state.qrPosition === "bottom-left" || state.qrPosition === "auto")) {
      messages.push("하단 로고 배치와 하단 QR이 함께 있으면 하단 밀도가 높아질 수 있습니다. 로고를 상단부에 배치하는 것도 검토해보세요.");
    }

    return uniqueValues(messages).slice(0, 4);
  }

  function renderLogoGuidance() {
    const node = $("promotionLogoGuidance");
    if (!node) return;
    const messages = getLogoGuidanceMessages();
    if (!messages.length) {
      node.hidden = true;
      node.innerHTML = "";
      return;
    }
    node.hidden = false;
    node.innerHTML = `
      <div class="promo-logo-guidance-title">설정 가이드</div>
      <ul>${messages.map((message) => `<li>${escapeHtml(message)}</li>`).join("")}</ul>
    `;
  }

  function applyLogoPreset(presetKey) {
    const preset = PROMOTION_LOGO_PRESETS[presetKey];
    if (!preset) return;
    state.logoBlendStyle = preset.blendStyle;
    state.logoStyle = preset.style;
    state.logoPosition = preset.position;
    state.logoArrangement = preset.arrangement;
    state.logoLabelShow = String(Boolean(preset.labelShow));
    state.logoEmphasis = "false";
    syncStaticFields();
    renderPreview();
  }

  function getDefaultQualityTagLines() {
    const ko = DEFAULT_QUALITY_TAGS.ko;
    const en = DEFAULT_QUALITY_TAGS.en;
    const conceptText = (state.appliedConceptPromotionPrompt || state.appliedConceptStyle || "").toLowerCase();
    const conceptUsesLensFlare = /lens.?flare/.test(conceptText);
    const shouldInclude = (_ko, enItem) =>
      !(conceptUsesLensFlare && /lens flare|neon bloom|excessive lighting/i.test(enItem));
    if (state.outputLanguage === "en") return en.filter((e) => shouldInclude("", e));
    if (state.outputLanguage === "bilingual") {
      return ko
        .map((k, i) => ({ k, e: en[i] || k }))
        .filter(({ e }) => shouldInclude("", e))
        .map(({ k, e }) => `${k} / ${e}`);
    }
    return ko.filter((_, i) => shouldInclude("", en[i] || ""));
  }



  function sanitizeStateValues() {
    Object.keys(state).forEach((key) => {
        if (key === "logoItems" && Array.isArray(state.logoItems)) {
          state.logoItems = state.logoItems
            .map((item) => createPromotionLogoItem(item))
            .filter((item) => item.name);
          return;
        }
        if (key === "logoRoleLabels") {
          state.logoRoleLabels = normalizePromotionLogoRoleLabels(state.logoRoleLabels);
          return;
        }
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
    const forbiddenTokens = splitForbiddenValues(state.forbiddenElements);
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

    if (state.commercialBaseline === "off") {
      notes.push("상업 품질 기준이 꺼져 있어 결과물이 무난한 안내 이미지처럼 보일 수 있습니다.");
    }
    if (state.variationMode === "none") {
      notes.push("변형 방향이 선택되지 않았습니다. 타이포/비주얼/컬러 그래픽 등 하나를 선택하면 결과 방향이 더 명확해집니다.");
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
        `상업 품질 기준: ${COMMERCIAL_BASELINE_PROFILES[state.commercialBaseline]?.labelKo || state.commercialBaseline}`,
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
      optimizationStateNode.textContent = `통합 프롬프트 · ${outputLanguageLabel()}`;
    }

    if (metricsNode) {
      metricsNode.innerHTML = [
        `<span class="promo-lint-chip is-neutral">${escapeHtml(ASSET_LABELS[state.assetType])}</span>`,
        `<span class="promo-lint-chip is-info">언어: ${escapeHtml(outputLanguageLabel())}</span>`,
        `<span class="promo-lint-chip is-info">통합 프롬프트</span>`,
      ].join("");
    }

    if (badgeNode) {
      const badgeText = lint.conflicts.length
        ? "검토 필요"
          : lint.duplicates.length
            ? "중복 정리"
            : lint.notes.length
            ? "정리 힌트"
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

      if (isEnabled(state.logoEnabled)) {
        const logoItems = getExpandedPromotionLogoItems();
        if (!logoItems.length) {
          addWarning("logoItems", "기관 로고를 사용하려면 미리보기에서 역할별 로고 개수를 1개 이상 지정하는 편이 좋습니다.");
        }
        if (logoItems.length >= 6 && state.logoArrangement === "row") {
          addWarning("logoItems", "기관 수가 많습니다. 가로 일렬보다 그리드 배열이 더 안정적으로 보일 가능성이 큽니다.");
        }
        if (logoItems.length >= 9) {
          addWarning("logoItems", "기관 수가 매우 많습니다. 이미지 생성 단계에서는 로고 배치가 과밀해질 수 있으니 대표 기관만 남기거나 후처리 합성 전용 시안으로 사용하는 편이 안전합니다.");
        }
        if (state.logoArrangement === "split") {
          const leftCount = logoItems.filter((item) => item.role === "host" || item.role === "organizer").length;
          const rightCount = logoItems.filter((item) => item.role === "sponsor" || item.role === "partner").length;
          if (!leftCount || !rightCount) {
            addWarning("logoItems", "좌우 분산 배치는 양쪽 역할 그룹이 모두 있어야 안정적입니다. 현재 한쪽 그룹이 비어 있어 split 의도가 제대로 반영되지 않을 수 있습니다.");
          }
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

    const fieldHintLabels = {
      headline: "헤드라인",
      bodyCopy: "본문 포인트",
        posterKeyVisual: "메인 비주얼 포인트",
        posterInfoLayout: "정보 배치 방식",
        qrUrl: "QR코드 연결 주소",
        logoItems: "기관 로고 구성",
        goal: "홍보 목적",
      directSize: "직접 입력 크기",
      customRatio: "직접 입력 비율",
      cardnewsCardCount: "카드뉴스 카드 수",
      cardnewsFlow: "카드뉴스 흐름",
      snsHook: "SNS 첫 줄 훅",
      snsPlacementNotes: "SNS 배치 메모",
    };

    const renderFieldIssueCards = (fieldMessages, type) => {
      const entries = Object.entries(fieldMessages || {});
      if (!entries.length) return "";
      return entries
        .map(([fieldKey, messages]) => {
          const label = fieldHintLabels[fieldKey] || FIELD_LABELS[fieldKey] || fieldKey;
          return `
            <div class="promo-validation-detail ${type === "error" ? "is-error" : "is-warning"}">
              <strong>${escapeHtml(label)}</strong>
              <ul>
                ${messages.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
              </ul>
            </div>
          `;
        })
        .join("");
    };

    if (!validation.errors.length && !validation.warnings.length) {
      node.innerHTML = `
        <div class="promo-validation-item is-ok">
          <strong>입력 상태 양호</strong>
          <span>현재 입력으로 프롬프트를 복사하거나 설정을 저장할 수 있습니다.</span>
        </div>
      `;
      updateFieldWarningsUI(validation);
      return;
    }

    const blocks = [];
    if (validation.errors.length) {
      blocks.push(`
        <div class="promo-validation-item is-error">
          <strong>보완이 필요한 항목</strong>
          <span>아래 항목을 먼저 수정하면 프롬프트 복사와 이미지 품질이 함께 안정됩니다.</span>
          <div class="promo-validation-detail-list">
            ${renderFieldIssueCards(validation.fieldErrors, "error")}
          </div>
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
        const trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "promo-warning-trigger";
        trigger.dataset.warningField = fieldKey;
        trigger.innerHTML = "⚠";
        trigger.title = "품질 개선 가이드 확인";
        trigger.setAttribute("aria-label", "품질 개선 가이드 확인");

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

  function ensureWarningModal() {
    let modal = $("promotionWarningModal");
    if (!modal) {
      const wrapper = document.createElement("div");
      wrapper.id = "promotionWarningModal";
      wrapper.className = "promo-warning-modal";
      wrapper.setAttribute("hidden", "");
      wrapper.innerHTML = `
        <div class="promo-warning-modal-backdrop" id="promotionWarningModalBackdrop"></div>
        <section class="promo-warning-modal-card" role="dialog" aria-modal="true" aria-labelledby="promotionWarningModalTitle">
          <div class="promo-warning-modal-head">
            <strong id="promotionWarningModalTitle">품질 개선 가이드</strong>
            <button type="button" class="promo-warning-modal-close" id="promotionWarningModalCloseBtn" aria-label="닫기">×</button>
          </div>
          <div class="promo-warning-modal-body" id="promotionWarningModalBody"></div>
          <div class="promo-warning-modal-actions">
            <button type="button" class="gen-btn promo-copy-btn" id="promotionWarningModalConfirmBtn">확인</button>
          </div>
        </section>
      `;
      document.body.appendChild(wrapper);
      modal = wrapper;
      bindWarningModalEvents();
    }

    return {
      modal,
      body: $("promotionWarningModalBody"),
      title: $("promotionWarningModalTitle"),
    };
  }

  function showWarningModal(fieldKey, messages) {
    const { modal, body, title } = ensureWarningModal();
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

    let html = `<div style="margin-bottom: 12px; font-weight: 700; color: #d35400;">발견된 보완 권장사항</div>`;
    html += `<ul style="margin: 0 0 16px 20px; padding: 0; list-style-type: disc;">`;
    messages.forEach(msg => {
      html += `<li style="margin-bottom: 8px; color: var(--ink);">${escapeHtml(msg)}</li>`;
    });
    html += `</ul>`;

    const tips = {
      headline: `<strong>레이아웃 품질 향상 팁</strong>헤드라인 글자수가 20자를 넘어가면 이미지 생성 AI가 가독성 확보를 위해 글자를 크게 깔고 배경을 단순화하는 경향이 있습니다.<br/>글자수를 최대한 <strong>20자 이하</strong>로 줄이고 핵심 명사와 행동 유도어만 남기면, 남는 공간에 더 깊이감 있는 비주얼을 배치하기 쉬워집니다.`,

      bodyCopy: `<strong>본문 정보 구성 팁</strong>본문 텍스트가 80자를 넘거나 항목이 길어지면 화면이 카드뉴스형 박스로 고정되기 쉽습니다.<br/>일정, 자격, 혜택, 마감일처럼 의미 단위로 짧게 나누면 타임라인, 노드, 배지, 사이드 레일 같은 다양한 정보 배치가 가능해집니다.`,

      posterKeyVisual: `<strong>비주얼 은유 팁</strong>메인 비주얼 포인트가 비어 있으면 AI가 빈 배경이나 평범한 카드형 안내물로 수렴하기 쉽습니다.<br/>단순한 계단이나 화살표보다 구체적인 공간, 빛의 방향, 깊이감, 상징 장면을 함께 적으면 상업 이미지 느낌이 안정됩니다.`,

      posterInfoLayout: `<strong>배치 합성 팁</strong>정보 배치 방식을 비워두면 혜택 카드 3개와 하단 정보박스 같은 반복 구도가 나오기 쉽습니다.<br/>타임라인, 세로 레일, 방사형 노드, 대각선 스텝, 비주얼 내장 라벨처럼 원하는 정보 구조를 짧게 지정해 보세요.`,

      qrUrl: `<strong>QR 배치 팁</strong>QR 주소가 있으면 AI가 QR 자리, 안내 문구, 주변 여백을 더 명확하게 설계할 수 있습니다.<br/>실제 스캔 가능한 QR은 이미지 생성 후 편집 단계에서 원본 QR로 교체하는 전제를 유지하는 것이 안전합니다.`,

      goal: `<strong>홍보 목적 정렬 팁</strong>홍보 목적이 명확해야 색상, CTA, 정보 우선순위, 비주얼 은유가 같은 방향으로 정렬됩니다.<br/>예: 신청 유도, 정책 성과 보고, 행사 참여, 브랜드 인지도 강화처럼 최종 행동을 중심으로 적어보세요.`,

      directSize: `<strong>크기 설정 팁</strong>정확한 크기를 입력하면 텍스트 안전영역, QR 자리, CTA 크기 기준이 더 안정적으로 잡힙니다.<br/>실제 게시 채널이나 출력 규격이 정해져 있다면 픽셀 또는 mm 기준으로 입력하는 편이 좋습니다.`,

      customRatio: `<strong>비율 설정 팁</strong>비율이 명확해야 AI가 모바일형, 포스터형, 배너형 중 어느 구도에 맞출지 판단하기 쉽습니다.<br/>모바일 홍보 이미지는 세로형, 웹 배너는 가로형, 카드뉴스는 정방형에 가까운 비율이 안정적입니다.`,

      cardnewsCardCount: `<strong>카드 수 구성 팁</strong>카드 수가 명확하면 장별 메시지 밀도를 조절하기 쉬워지고, 한 장에 정보가 과밀해지는 것을 줄일 수 있습니다.<br/>도입, 문제, 해결, 혜택, 행동 유도처럼 역할별로 나누는 구성이 안정적입니다.`,

      cardnewsFlow: `<strong>카드 흐름 팁</strong>카드 흐름을 적으면 각 장이 같은 레이아웃을 반복하지 않고 도입, 문제, 해결, 행동 유도로 분화됩니다.<br/>각 카드의 역할을 짧게 지정해두면 생성 결과의 일관성이 좋아집니다.`,

      snsHook: `<strong>SNS 훅 작성 팁</strong>첫 줄 훅이 있으면 썸네일 환경에서 가장 먼저 읽힐 문구와 비주얼 중심점을 더 쉽게 잡을 수 있습니다.<br/>짧고 즉각적인 이득, 질문, 숫자, 마감감을 활용해 보세요.`,

      snsPlacementNotes: `<strong>SNS 안전영역 팁</strong>플랫폼 안전영역과 CTA 위치를 적으면 잘림 위험이 줄고 모바일 미리보기에서 핵심 정보가 남습니다.<br/>프로필 영역, 버튼 영역, 하단 UI와 겹치지 않도록 주요 문구 위치를 지정해 주세요.`
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

  function ensureQuickFillModal() {
    let modal = $("promotionQuickFillModal");
    if (!modal) {
      const wrapper = document.createElement("div");
      wrapper.id = "promotionQuickFillModal";
      wrapper.className = "promo-quickfill-modal";
      wrapper.setAttribute("hidden", "");
      wrapper.innerHTML = `
        <div class="promo-quickfill-modal-backdrop" id="promotionQuickFillModalBackdrop"></div>
        <section class="promo-quickfill-modal-card" role="dialog" aria-modal="true" aria-labelledby="promotionQuickFillModalTitle">
          <div class="promo-quickfill-modal-head">
            <strong id="promotionQuickFillModalTitle">원문 분석 · 자동 요약</strong>
            <button type="button" class="promo-quickfill-modal-close" id="promotionQuickFillModalCloseBtn" aria-label="닫기">×</button>
          </div>
          <div class="promo-quickfill-modal-body" id="promotionQuickFillStepPaste">
            <p class="promo-quickfill-guide">공고문·보도자료·행사 안내 원문을 붙여넣으면 제목, 대상, 일정, 혜택, 신청방법, 문의처를 구조화합니다. 분석은 브라우저 안에서 처리되며 원문은 외부로 전송되지 않습니다.</p>
            <textarea id="promotionQuickFillTextarea" class="promo-quickfill-textarea" placeholder="원문을 그대로 붙여넣으세요. 표나 PDF에서 복사한 텍스트도 분석할 수 있습니다."></textarea>
            <p class="promo-quickfill-shortcut">Ctrl+Enter로 바로 분석</p>
            <div class="promo-quickfill-modal-actions">
              <span class="promo-quickfill-result" id="promotionQuickFillResult"></span>
              <button type="button" class="gen-btn ghost" id="promotionQuickFillCancelBtn">취소</button>
              <button type="button" class="gen-btn promo-copy-btn" id="promotionQuickFillParseBtn">분석하고 요약</button>
            </div>
          </div>
          <div class="promo-quickfill-modal-body" id="promotionQuickFillStepPreview" hidden>
            <p class="promo-quickfill-guide">추출 정보와 생성한 요약을 구분했습니다. 근거를 확인한 뒤 반영할 항목만 선택하세요. 신뢰도가 낮은 항목은 기본 선택에서 제외됩니다.</p>
            <div class="promo-quickfill-analysis" id="promotionQuickFillAnalysisSummary" role="status" aria-live="polite"></div>
            <label class="promo-quickfill-compress-row">
              <input type="checkbox" id="promotionQuickFillCompressToggle" checked />
              <span>홍보 이미지용으로 압축 — 원문 숫자·날짜를 유지하며 긴 문장을 줄입니다</span>
            </label>
            <div class="promo-quickfill-preview-list" id="promotionQuickFillPreviewList"></div>
            <div class="promo-quickfill-modal-actions">
              <span class="promo-quickfill-result" id="promotionQuickFillPreviewResult"></span>
              <button type="button" class="gen-btn ghost" id="promotionQuickFillBackBtn">다시 붙여넣기</button>
              <button type="button" class="gen-btn promo-copy-btn" id="promotionQuickFillApplyBtn">선택 항목 적용</button>
            </div>
          </div>
        </section>
      `;
      document.body.appendChild(wrapper);
      modal = wrapper;
      bindQuickFillModalEvents();
    }
    return {
      modal,
      textarea: $("promotionQuickFillTextarea"),
      result: $("promotionQuickFillResult"),
    };
  }

  function showQuickFillStep(step) {
    const pasteEl = $("promotionQuickFillStepPaste");
    const previewEl = $("promotionQuickFillStepPreview");
    if (pasteEl) pasteEl.hidden = step !== "paste";
    if (previewEl) previewEl.hidden = step !== "preview";
  }

  function showQuickFillModal() {
    const { modal, textarea, result } = ensureQuickFillModal();
    if (!modal) return;
    if (result) result.textContent = "";
    showQuickFillStep("paste");
    modal.removeAttribute("hidden");
    document.body.classList.add("modal-open");
    textarea?.focus();
  }

  function hideQuickFillModal() {
    const modal = $("promotionQuickFillModal");
    if (modal) modal.setAttribute("hidden", "");
    document.body.classList.remove("modal-open");
  }

  function bindQuickFillModalEvents() {
    $("promotionQuickFillModalCloseBtn")?.addEventListener("click", hideQuickFillModal);
    $("promotionQuickFillCancelBtn")?.addEventListener("click", hideQuickFillModal);
    $("promotionQuickFillModalBackdrop")?.addEventListener("click", hideQuickFillModal);
    $("promotionQuickFillParseBtn")?.addEventListener("click", parseQuickFillAndShowPreview);
    $("promotionQuickFillBackBtn")?.addEventListener("click", () => showQuickFillStep("paste"));
    $("promotionQuickFillApplyBtn")?.addEventListener("click", applyCheckedQuickFillFields);
    $("promotionQuickFillCompressToggle")?.addEventListener("change", renderQuickFillPreview);
    $("promotionQuickFillTextarea")?.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        parseQuickFillAndShowPreview();
      }
    });
  }

  function bindQuickFillTrigger() {
    $("promotionQuickFillBtn")?.addEventListener("click", showQuickFillModal);
  }

  // 각 그룹의 라벨 배열은 우선순위 순서 (앞 라벨이 여러 줄에서 동시에 매칭될 때 우선)
  const QUICK_FILL_LABEL_GROUPS = {
    goal: ["사업목적", "추진목적", "지원목적", "조사목적", "목적", "추진배경", "사업개요", "공고개요", "사업소개"],
    audience: ["신청대상", "지원대상", "참가대상", "모집대상", "참여대상", "신청자격", "지원자격", "응모대상", "교육대상", "대상"],
    period: ["신청기간", "접수기간", "모집기간", "공모기간", "제출기간", "접수일정", "참여기간", "사업기간", "교육기간", "행사기간", "운영기간", "기간"],
    method: ["신청방법", "접수방법", "제출방법", "신청절차", "접수절차", "참여방법"],
    support: ["지원내용", "지원사항", "주요내용", "사업내용", "모집내용", "교육내용", "교육과정", "커리큘럼", "행사내용"],
    budget: ["지원금액", "지원규모", "선정규모", "선정인원", "모집인원", "수강료", "참가비", "교육비", "예산"],
    contact: ["문의처", "담당자", "연락처", "문의전화", "문의사항", "문의", "신청문의", "접수문의", "전화번호", "전화", "휴대폰", "핸드폰", "이메일", "메일", "E-mail", "Email", "Tel", "TEL"],
    place: ["개최장소", "행사장소", "교육장소", "장소", "일시"],
    organizer: ["주관기관", "주최기관", "주관", "주최", "시행기관"],
  };

  // 줄 시작의 불릿/번호/괄호표기 등을 라벨 매칭 전에 제거한다.
  const QUICK_FILL_BULLET_PREFIX =
    "(?:[○□▶●◆■\\-\\*]\\s*)?(?:\\d{1,2}\\s*[.\\)]\\s*)?(?:\\[[^\\]]*\\]\\s*)?";

  const QUICK_FILL_ALL_LABELS = Array.from(
    new Set(Object.values(QUICK_FILL_LABEL_GROUPS).flat())
  ).sort((a, b) => b.length - a.length);

  function isQuickFillLabelLine(line) {
    return QUICK_FILL_ALL_LABELS.some(
      (label) =>
        new RegExp(`^${QUICK_FILL_BULLET_PREFIX}${label}\\s*[:：]`).test(line) ||
        new RegExp(`^${QUICK_FILL_BULLET_PREFIX}${label}\\s*[:：]?$`).test(line)
    );
  }

  // 여러 줄에 걸쳐 서술되는 필드만 다음 줄을 이어붙인다 (기간·금액·연락처 같은 단문 필드는 제외).
  const QUICK_FILL_CONTINUATION_FIELDS = new Set(["goal", "audience", "support"]);

  function quickFillFindLabeled(lines, labels, fieldKey) {
    const allowContinuation = QUICK_FILL_CONTINUATION_FIELDS.has(fieldKey);
    for (const label of labels) {
      const inlineRe = new RegExp(`^${QUICK_FILL_BULLET_PREFIX}${label}\\s*[:：]\\s*(.+)$`);
      for (let i = 0; i < lines.length; i += 1) {
        const inlineMatch = lines[i].match(inlineRe);
        if (inlineMatch && inlineMatch[1].trim()) {
          let value = inlineMatch[1].trim();
          if (allowContinuation) {
            let cursor = i + 1;
            let merged = 0;
            while (cursor < lines.length && merged < 2) {
              const nextLine = lines[cursor];
              if (!nextLine || isQuickFillLabelLine(nextLine)) break;
              if (nextLine.includes(":") || nextLine.includes("：")) break;
              // 섹션 기호(○□▶, "1.")나 불릿(-·•)으로 시작하는 줄은 별개 항목이므로 병합하지 않음
              if (QUICK_FILL_SECTION_PREFIX_RE.test(nextLine)) break;
              if (QUICK_FILL_CONTENT_BULLET_RE.test(nextLine)) break;
              value += ` ${nextLine}`;
              cursor += 1;
              merged += 1;
            }
          }
          return value.trim();
        }
      }
    }
    for (const label of labels) {
      const aloneRe = new RegExp(`^${QUICK_FILL_BULLET_PREFIX}${label}\\s*[:：]?$`);
      for (let i = 0; i < lines.length; i += 1) {
        if (aloneRe.test(lines[i]) && lines[i + 1] && !isQuickFillLabelLine(lines[i + 1])) {
          return lines[i + 1];
        }
      }
    }
    return "";
  }

  function extractQuickFillDeadlineDate(period) {
    if (!period) return "";
    const dotMatches = [...period.matchAll(/(?:\d{4}\s*[.\-]\s*)?(\d{1,2})\s*[.\/]\s*(\d{1,2})/g)];
    const wordMatches = [...period.matchAll(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/g)];
    const all = [...dotMatches, ...wordMatches];
    if (!all.length) return "";
    const last = all[all.length - 1];
    const month = parseInt(last[1], 10);
    const day = parseInt(last[2], 10);
    if (!month || !day || month > 12 || day > 31) return "";
    return `${month}월 ${day}일`;
  }

  function extractQuickFillDeadlineHook(period) {
    const date = extractQuickFillDeadlineDate(period);
    return date ? `${date} 마감` : "";
  }

  function extractQuickFillPhoneFallback(text) {
    const match = text.match(/0\d{1,2}[-.\s]\d{3,4}[-.\s]\d{4}/);
    return match ? match[0] : "";
  }

  // ── 공고 유형 분류 ──
  const QUICK_FILL_TYPE_RULES = [
    { id: "education", keywords: ["교육", "훈련", "강의", "과정", "교육원", "수강", "커리큘럼", "부트캠프", "연수"] },
    { id: "seminar", keywords: ["세미나", "포럼", "컨퍼런스", "콘퍼런스", "설명회", "박람회", "전시회", "네트워킹", "데모데이", "워크숍", "워크샵", "발표회", "초청", "행사"] },
    { id: "survey", keywords: ["수요조사", "설문", "의견수렴", "만족도", "실태조사"] },
    { id: "recruit", keywords: ["채용", "인턴", "직원 모집", "인력 모집", "구인", "임용"] },
    { id: "support", keywords: ["지원사업", "지원금", "사업화", "보조금", "바우처", "창업", "참가기업", "육성"] },
  ];

  const QUICK_FILL_TYPE_LABELS = {
    education: "교육",
    seminar: "세미나·행사",
    support: "지원사업",
    survey: "수요조사",
    recruit: "모집·채용",
    general: "일반 안내",
  };

  const QUICK_FILL_TYPE_CTA = {
    education: "지금 수강 신청하기",
    seminar: "지금 사전등록 하기",
    support: "지금 신청하기",
    survey: "설문 참여하기",
    recruit: "지금 지원하기",
    general: "지금 신청하기",
  };

  function detectQuickFillNoticeType(text) {
    let best = "general";
    let bestScore = 0;
    QUICK_FILL_TYPE_RULES.forEach((rule) => {
      const score = rule.keywords.reduce(
        (sum, keyword) => sum + (text.split(keyword).length - 1),
        0
      );
      if (score > bestScore) {
        bestScore = score;
        best = rule.id;
      }
    });
    return best;
  }

  // ── 유형별 서브카피 템플릿 ({슬롯}이 모두 채워지는 것 중 랜덤 선택) ──
  const QUICK_FILL_SUBHEADLINE_TEMPLATES = {
    education: [
      "{audience} 대상 실무 교육 · {period}",
      "{audience}를 위한 교육 과정, {deadline} 접수 마감",
      "현장에서 바로 쓰는 역량, {deadline}까지 신청하세요",
      "{audience} 대상 · {benefit}",
    ],
    seminar: [
      "{audience} 초청 · {period}",
      "현장에서 만나는 인사이트, {deadline} 사전등록 마감",
      "{audience}라면 놓칠 수 없는 자리 · {period}",
    ],
    support: [
      "{audience} 대상 · {benefit}",
      "{benefit} — {deadline} 접수 마감",
      "{audience}의 다음 도약을 지원합니다 · {period}",
    ],
    survey: [
      "{audience}의 의견을 듣습니다 · {period}",
      "짧은 참여가 정책을 바꿉니다 — {deadline}까지",
      "{audience} 대상 수요조사 · {period}",
    ],
    recruit: [
      "함께할 {audience}를 찾습니다 · {period}",
      "{audience} 모집, {deadline} 마감",
    ],
    general: [
      "{audience} · {period}",
      "{audience} 대상 안내, {deadline} 마감",
    ],
  };

  function buildQuickFillSubheadline(noticeType, slotsRaw) {
    const slots = {};
    Object.entries(slotsRaw).forEach(([key, value]) => {
      const trimmed = trimValue(value).replace(/\s+/g, " ");
      slots[key] = trimmed.length > 0 && trimmed.length <= 38 ? trimmed : "";
    });
    const templates =
      QUICK_FILL_SUBHEADLINE_TEMPLATES[noticeType] || QUICK_FILL_SUBHEADLINE_TEMPLATES.general;
    const usable = templates.filter((tpl) =>
      [...tpl.matchAll(/\{(\w+)\}/g)].every((match) => slots[match[1]])
    );
    if (usable.length) {
      const tpl = usable[Math.floor(Math.random() * usable.length)];
      return tpl.replace(/\{(\w+)\}/g, (_, key) => slots[key]);
    }
    return [trimValue(slotsRaw.audience), trimValue(slotsRaw.period)]
      .filter(Boolean)
      .join(" · ");
  }

  // ── 본문 포인트: 헤드라인 제외 전체 내용을 2단 개조식으로 압축 ──
  // 섹션 구분 기호(○□▶, "1.", [괄호])와 내용 불릿(-, •, ①)을 구분한다.
  const QUICK_FILL_SECTION_PREFIX_RE =
    /^(?:[○□◇▷▶●◆■➤]\s*|\d{1,2}\s*[.)]\s*(?=[^\d\s])|\[[^\]]{1,14}\]\s*$)/;
  const QUICK_FILL_CONTENT_BULLET_RE = /^(?:[-–—•▪▸►✔✓☑*·]\s*|[①-⑳]\s*)/;
  const QUICK_FILL_ANY_BULLET_RE =
    /^(?:[○□◇▷▶●◆■➤•▪▸►✔✓☑*·\-–—]\s*|\d{1,2}\s*[.)]\s*(?=[^\d\s])|[①-⑳]\s*)/;

  const QUICK_FILL_GENERIC_LABEL_RE = /^([가-힣A-Za-z0-9·/&() ]{2,14})\s*[:：]\s*(.+)$/;

  function stripQuickFillLinePrefix(line) {
    let value = String(line || "").trim();
    for (let i = 0; i < 3; i += 1) {
      const next = value.replace(QUICK_FILL_ANY_BULLET_RE, "").trim();
      if (next === value) break;
      value = next;
    }
    const bracketOnly = value.match(/^\[([^\]]{1,20})\]$/);
    if (bracketOnly) value = bracketOnly[1].trim();
    return value;
  }

  function clipQuickFillText(value, max = 70) {
    const clean = trimValue(value).replace(/\s+/g, " ");
    return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
  }

  // 라벨 그룹 → 본문 포인트 표준 버킷 매핑 (__contact__는 문의처로 별도 합성)
  const QUICK_FILL_BODY_CATEGORY_BY_GROUP = {
    audience: "지원 대상",
    period: "주요 일정",
    place: "주요 일정",
    support: "주요 내용",
    budget: "주요 내용",
    method: "신청 방법",
    organizer: "주최·주관",
    contact: "__contact__",
  };

  const QUICK_FILL_LABEL_TO_GROUP = (() => {
    const map = {};
    Object.entries(QUICK_FILL_LABEL_GROUPS).forEach(([groupKey, labels]) => {
      labels.forEach((label) => {
        if (!(label in map)) map[label] = groupKey;
      });
    });
    return map;
  })();

  function extractQuickFillContacts(text) {
    const source = String(text || "");
    const dedupe = (arr) => [...new Set(arr)];
    const emails = dedupe(
      source.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []
    ).slice(0, 2);
    const phones = [];
    const mobiles = [];
    const reps = [];
    const phoneRe = /(?:\(?(0\d{1,2})\)?[-.\s]?(\d{3,4})[-.\s]?(\d{4})|(1\d{3})[-.\s]?(\d{4}))(?!\d)/g;
    [...source.matchAll(phoneRe)].forEach((match) => {
      if (match[4]) {
        reps.push(`${match[4]}-${match[5]}`);
        return;
      }
      const area = match[1];
      const num = `${area}-${match[2]}-${match[3]}`;
      if (/^01[016789]$/.test(area)) mobiles.push(num);
      else phones.push(num);
    });
    return {
      emails,
      phones: dedupe(phones).slice(0, 2),
      mobiles: dedupe(mobiles).slice(0, 2),
      reps: dedupe(reps).slice(0, 2),
    };
  }

  function buildQuickFillContactChildren(contactText, contacts) {
    const children = [];
    let leftover = trimValue(contactText)
      .replace(/\(?0\d{1,2}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/g, " ")
      .replace(/1\d{3}[-.\s]?\d{4}/g, " ")
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, " ")
      .replace(/\s*[/|,·]\s*/g, " / ")
      .replace(/\s+/g, " ")
      .replace(/^[\s/]+|[\s/]+$/g, "")
      .trim();
    if (leftover && leftover.length >= 2) children.push(`담당: ${leftover}`);
    contacts.reps.forEach((num) => children.push(`대표번호: ${num}`));
    contacts.phones.forEach((num) => children.push(`전화: ${num}`));
    contacts.mobiles.forEach((num) => children.push(`휴대폰: ${num}`));
    contacts.emails.forEach((email) => children.push(`이메일: ${email}`));
    return children;
  }

  function buildQuickFillBodyOutline(lines, context) {
    const headline = trimValue(context.headline);
    const goalText = trimValue(context.goal);
    const goalLabels = QUICK_FILL_LABEL_GROUPS.goal;
    const contacts = context.contacts || { emails: [], phones: [], mobiles: [], reps: [] };

    // 표준 버킷(고정 순서) + 문서 고유 섹션(등장 순서) + 문의처(항상 마지막)
    const bucketOrder = ["지원 대상", "주요 일정", "주요 내용", "신청 방법", "주최·주관"];
    const buckets = new Map(); // name -> [{ text, subs: [] }]
    const customOrder = [];
    const seen = new Set();
    let itemCount = 0;

    const ensureBucket = (name) => {
      if (!buckets.has(name)) {
        buckets.set(name, []);
        if (!bucketOrder.includes(name) && name !== "문의처") customOrder.push(name);
      }
      return buckets.get(name);
    };
    const addChild = (bucketName, text) => {
      const clean = clipQuickFillText(text);
      if (!clean || clean.length < 2 || seen.has(clean) || itemCount >= 18) return null;
      seen.add(clean);
      itemCount += 1;
      const child = { text: clean, subs: [] };
      ensureBucket(bucketName).push(child);
      return child;
    };
    const addSub = (child, text) => {
      const clean = clipQuickFillText(text);
      if (!child || !clean || seen.has(clean) || itemCount >= 18) return;
      seen.add(clean);
      itemCount += 1;
      child.subs.push(clean);
    };

    let currentBucket = ""; // 섹션 헤더가 지정한 버킷
    let lastChild = null; // 라벨 항목의 연속줄을 하위(3단계)로 붙일 대상
    let skippingGoalSection = false;

    for (const raw of lines) {
      const line = String(raw || "").trim();
      if (!line) continue;
      if (headline && (line.includes(headline) || (line.length >= 4 && headline.includes(line)))) continue;
      if (/https?:\/\//.test(line)) continue;

      const stripped = stripQuickFillLinePrefix(line);
      const strippedNoColon = stripped.replace(/[:：]\s*$/, "").trim();
      const hasSectionPrefix = QUICK_FILL_SECTION_PREFIX_RE.test(line);
      const hasContentBullet = QUICK_FILL_CONTENT_BULLET_RE.test(line);

      // 1) 라벨 단독 줄 → 섹션 헤더 (내용 불릿 -·• 줄은 섹션으로 보지 않음)
      const isKnownLabelAlone =
        !hasContentBullet && QUICK_FILL_ALL_LABELS.includes(strippedNoColon);
      const looksLikeHeader =
        !hasContentBullet &&
        !QUICK_FILL_GENERIC_LABEL_RE.test(stripped) &&
        strippedNoColon.length >= 2 &&
        strippedNoColon.length <= 14 &&
        !/\d{2,}/.test(strippedNoColon) &&
        (hasSectionPrefix || /[:：]\s*$/.test(stripped));

      if (isKnownLabelAlone || looksLikeHeader) {
        lastChild = null;
        if (goalLabels.includes(strippedNoColon)) {
          skippingGoalSection = true;
          currentBucket = "";
          continue;
        }
        skippingGoalSection = false;
        const groupKey = QUICK_FILL_LABEL_TO_GROUP[strippedNoColon];
        const category = groupKey ? QUICK_FILL_BODY_CATEGORY_BY_GROUP[groupKey] : "";
        if (category === "__contact__") {
          currentBucket = ""; // 연락처는 아래에서 별도 합성
          continue;
        }
        currentBucket = category || strippedNoColon; // 미분류 헤더는 자체 그룹 유지
        ensureBucket(currentBucket);
        continue;
      }

      // 2) 인라인 라벨 줄 → 카테고리 버킷으로 분류
      const labeledMatch = stripped.match(QUICK_FILL_GENERIC_LABEL_RE);
      if (labeledMatch) {
        const label = labeledMatch[1].trim();
        const value = labeledMatch[2].trim();
        skippingGoalSection = false;
        if (goalLabels.includes(label)) {
          lastChild = null;
          continue;
        }
        const groupKey = QUICK_FILL_LABEL_TO_GROUP[label];
        const category = groupKey ? QUICK_FILL_BODY_CATEGORY_BY_GROUP[groupKey] : "";
        if (category === "__contact__") {
          lastChild = null; // 문의처 버킷에서 전화/이메일과 함께 합성
          continue;
        }
        const bucketName = category || currentBucket || "주요 내용";
        lastChild = addChild(bucketName, `${label}: ${value}`);
        continue;
      }

      // 3) 일반 내용 줄
      if (skippingGoalSection) continue;
      if (goalText && stripped.length > 8 && goalText.includes(stripped)) continue;
      if (/\(?0\d{1,2}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/.test(stripped)) continue;
      if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(stripped)) continue;
      if (stripped.length < 4) continue;
      if (currentBucket) {
        addChild(currentBucket, stripped);
        continue;
      }
      if (lastChild) {
        addSub(lastChild, stripped);
        continue;
      }
      if (stripped.length <= (hasContentBullet ? 60 : 40)) {
        addChild("주요 내용", stripped);
      }
    }

    // 문의처 버킷 합성 (담당 + 전화/휴대폰/이메일)
    const contactChildren = buildQuickFillContactChildren(context.contact, contacts);
    if (contactChildren.length) {
      const bucket = ensureBucket("문의처");
      contactChildren.forEach((text) => {
        if (seen.has(text)) return;
        seen.add(text);
        bucket.push({ text, subs: [] });
      });
    }

    const orderedNames = [
      ...bucketOrder.filter((name) => buckets.has(name)),
      ...customOrder,
      ...(buckets.has("문의처") ? ["문의처"] : []),
    ];
    const linesOut = [];
    orderedNames.forEach((name) => {
      const children = buckets.get(name) || [];
      if (!children.length) return;
      linesOut.push(name);
      children.forEach((child) => {
        linesOut.push(`  - ${child.text}`);
        child.subs.forEach((sub) => linesOut.push(`    - ${sub}`));
      });
    });
    return linesOut.join("\n");
  }

  function extractQuickFillHeadline(lines, text) {
    const bracketMatch = text.match(/[「『【《"]([^」』】》"]{4,60})[」』】》"]/);
    if (bracketMatch && bracketMatch[1].trim()) return bracketMatch[1].trim();

    for (const line of lines.slice(0, 10)) {
      if (isQuickFillLabelLine(line)) continue;
      if (line.includes(":") || line.includes("：")) continue;
      const cleaned = line
        .replace(new RegExp(`^${QUICK_FILL_BULLET_PREFIX}`), "")
        .replace(/^제?\s*20\d{2}[-.]\d+\s*호\s*/, "")
        .trim();
      if (cleaned.length < 4 || cleaned.length > 60) continue;
      return cleaned;
    }
    return "";
  }

  function parsePromotionNoticeText(raw) {
    const upgradedParser = window.PromptDeckPromotionParser;
    if (upgradedParser && typeof upgradedParser.parse === "function") {
      return upgradedParser.parse(raw);
    }

    const text = String(raw || "").replace(/\r\n/g, "\n");
    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

    const goal = quickFillFindLabeled(lines, QUICK_FILL_LABEL_GROUPS.goal, "goal");
    const audience = quickFillFindLabeled(lines, QUICK_FILL_LABEL_GROUPS.audience, "audience");
    const period = quickFillFindLabeled(lines, QUICK_FILL_LABEL_GROUPS.period, "period");
    const method = quickFillFindLabeled(lines, QUICK_FILL_LABEL_GROUPS.method, "method");
    const support = quickFillFindLabeled(lines, QUICK_FILL_LABEL_GROUPS.support, "support");
    const budget = quickFillFindLabeled(lines, QUICK_FILL_LABEL_GROUPS.budget, "budget");
    const place = quickFillFindLabeled(lines, QUICK_FILL_LABEL_GROUPS.place, "place");
    const organizer = quickFillFindLabeled(lines, QUICK_FILL_LABEL_GROUPS.organizer, "organizer");
    let contact = quickFillFindLabeled(lines, QUICK_FILL_LABEL_GROUPS.contact, "contact");
    if (!contact) contact = extractQuickFillPhoneFallback(text);

    const headline = extractQuickFillHeadline(lines, text);

    const noticeType = detectQuickFillNoticeType(text);

    const subheadline = buildQuickFillSubheadline(noticeType, {
      audience,
      period,
      deadline: extractQuickFillDeadlineDate(period),
      benefit: budget || support || "",
    });

    let bodyCopy = buildQuickFillBodyOutline(lines, { headline, goal });
    if (!bodyCopy || bodyCopy.split("\n").length < 2) {
      const bodyItems = [];
      if (period) bodyItems.push(`- 신청기간: ${period}`);
      if (place) bodyItems.push(`- 일시/장소: ${place}`);
      if (budget) bodyItems.push(`- 지원금액: ${budget}`);
      if (support) bodyItems.push(`- 지원내용: ${support}`);
      if (method) bodyItems.push(`- 신청방법: ${method}`);
      if (organizer) bodyItems.push(`- 주관/주최: ${organizer}`);
      if (contact) bodyItems.push(`- 문의: ${contact}`);
      bodyCopy = bodyItems.join("\n");
    }

    let cta = "";
    if (/신청|접수|모집|참여|등록|지원/.test(text)) {
      cta = QUICK_FILL_TYPE_CTA[noticeType] || QUICK_FILL_TYPE_CTA.general;
    }

    const posterOffer = budget || support || "";
    const snsHook = extractQuickFillDeadlineHook(period);

    const urlMatch = text.match(/https?:\/\/[^\s)\]>"']+/);

    return {
      noticeType,
      noticeTypeLabel: QUICK_FILL_TYPE_LABELS[noticeType] || QUICK_FILL_TYPE_LABELS.general,
      headline,
      goal,
      audience,
      subheadline,
      bodyCopy,
      cta,
      posterOffer,
      snsHook,
      qrUrl: urlMatch ? urlMatch[0] : "",
    };
  }

  const QUICK_FILL_PREVIEW_FIELDS = [
    { key: "headline", label: "헤드라인" },
    { key: "goal", label: "홍보 목적" },
    { key: "audience", label: "핵심 타깃" },
    { key: "subheadline", label: "서브 카피" },
    { key: "bodyCopy", label: "본문 포인트" },
    { key: "posterOffer", label: "한 줄 오퍼", toggleMode: true },
    { key: "snsHook", label: "첫 줄 훅", toggleMode: true },
    { key: "cta", label: "CTA", toggleMode: true },
    { key: "qrUrl", label: "QR URL" },
  ];

  function escapeQuickFillHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ── 텍스트 요약 압축 (개조식 축약) ──
  function compressQuickFillClause(value) {
    let v = trimValue(value).replace(/\s+/g, " ");
    // "~부터 ~까지" → "~"
    v = v.replace(/([0-9년월일일.\s()~:]+?)\s*부터\s+(.+?)\s*까지/g, "$1 ~ $2");
    // 동일 연도 반복 축약: 2024.05.01 ~ 2024.05.31 → 2024.05.01 ~ 05.31
    v = v.replace(/\b(20\d{2})([.\-/년]\s?)([^~]{0,14}?)\s*~\s*\1[.\-/년]\s?/g, "$1$2$3 ~ ");
    // 목적·의례 어미 제거
    v = v.replace(/(하기|하고자|시키기)\s*위(함|하여|해)\s*[.]?$/, "");
    v = v.replace(/(을|를)\s*목적으로\s*(함|한다)?\s*[.]?$/, "");
    v = v.replace(/(합니다|입니다|됩니다|바랍니다)\s*[.]?$/, "");
    v = v.replace(/함\s*[.]?$/, "");
    v = v.replace(/^(본|이번|우리)\s*(사업|행사|과정|조사|교육)(은|는)\s*/, "");
    // 13자 이상 긴 괄호 보충설명 제거
    v = v.replace(/\s*\([^)]{13,}\)/g, "");
    return v.trim().replace(/[,·;]\s*$/, "");
  }

  function clipQuickFillAtWordBoundary(value, max) {
    if (value.length <= max) return value;
    const cut = value.slice(0, max);
    const lastSpace = cut.lastIndexOf(" ");
    const clipped = (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut)
      .trim()
      .replace(/[을를이가은는의에로와과]$/, "");
    return `${clipped}…`;
  }

  function compressQuickFillText(value, max = 48) {
    return clipQuickFillAtWordBoundary(compressQuickFillClause(value), max);
  }

  function compressQuickFillBodyCopy(bodyCopy) {
    return String(bodyCopy || "")
      .split("\n")
      .map((line) => {
        const subMatch = line.match(/^(\s*- )(.*)$/);
        if (!subMatch) return line.trim(); // 그룹 헤더는 그대로
        const rest = subMatch[2];
        const labelMatch = rest.match(/^([^:：]{2,14})\s*[:：]\s*(.+)$/);
        if (labelMatch) {
          return `${subMatch[1]}${labelMatch[1]}: ${compressQuickFillText(labelMatch[2], 40)}`;
        }
        return `${subMatch[1]}${compressQuickFillText(rest, 44)}`;
      })
      .filter((line) => trimValue(line))
      .join("\n");
  }

  function compressQuickFillParsed(parsed) {
    if (!parsed) return parsed;
    const upgradedParser = window.PromptDeckPromotionParser;
    if (upgradedParser && typeof upgradedParser.compress === "function") {
      return upgradedParser.compress(parsed);
    }
    return {
      ...parsed,
      goal: compressQuickFillText(parsed.goal, 50),
      audience: compressQuickFillText(parsed.audience, 30),
      bodyCopy: compressQuickFillBodyCopy(parsed.bodyCopy),
      posterOffer: compressQuickFillText(parsed.posterOffer, 30),
    };
  }

  function getQuickFillFieldMeta(parsed, fieldKey) {
    const fieldMeta = parsed?.analysis?.fields?.[fieldKey];
    if (fieldMeta && typeof fieldMeta === "object") return fieldMeta;
    return { kind: "extracted", confidence: 0.85, evidence: [], note: "" };
  }

  function getQuickFillKindLabel(kind) {
    const parser = window.PromptDeckPromotionParser;
    if (parser && typeof parser.kindLabel === "function") return parser.kindLabel(kind);
    return ({ extracted: "원문 추출", inferred: "문맥 추론", summary: "요약 생성", derived: "카피 생성" })[kind] || "분석 결과";
  }

  function getQuickFillConfidenceLabel(confidence) {
    const parser = window.PromptDeckPromotionParser;
    if (parser && typeof parser.confidenceLabel === "function") return parser.confidenceLabel(confidence);
    if (Number(confidence) >= 0.88) return "높음";
    if (Number(confidence) >= 0.72) return "보통";
    return "검토 필요";
  }

  function renderQuickFillEvidence(fieldMeta) {
    const evidence = Array.isArray(fieldMeta?.evidence)
      ? fieldMeta.evidence.map((item) => trimValue(item)).filter(Boolean).slice(0, 6)
      : [];
    const note = trimValue(fieldMeta?.note);
    if (!evidence.length && !note) return "";
    return `
      <details class="promo-quickfill-evidence">
        <summary>원문 근거${evidence.length ? ` ${evidence.length}개` : ""}</summary>
        <div class="promo-quickfill-evidence-body">
          ${note ? `<p class="promo-quickfill-evidence-note">${escapeQuickFillHtml(note)}</p>` : ""}
          ${evidence.map((item) => `<blockquote>${escapeQuickFillHtml(item)}</blockquote>`).join("")}
        </div>
      </details>`;
  }

  function renderQuickFillAnalysisSummary(parsed) {
    const node = $("promotionQuickFillAnalysisSummary");
    if (!node) return;
    const analysis = parsed?.analysis;
    const stats = analysis?.stats;
    if (!analysis || !stats) {
      node.innerHTML = "";
      node.hidden = true;
      return;
    }

    const warnings = Array.isArray(analysis.warnings) ? analysis.warnings.filter(Boolean) : [];
    const completeness = Number.isFinite(Number(analysis.completeness))
      ? Math.max(0, Math.min(100, Math.round(Number(analysis.completeness))))
      : 0;
    node.hidden = false;
    node.innerHTML = `
      <div class="promo-quickfill-analysis-chips">
        <span><strong>${escapeQuickFillHtml(parsed.noticeTypeLabel || "일반 안내")}</strong> 유형</span>
        <span><strong>${completeness}%</strong> 핵심정보</span>
        <span><strong>${Number(stats.extractedCount) || 0}</strong> 추출·추론</span>
        <span><strong>${Number(stats.derivedCount) || 0}</strong> 요약·카피</span>
        ${Number(stats.reviewCount) ? `<span class="is-review"><strong>${Number(stats.reviewCount)}</strong> 검토 필요</span>` : ""}
      </div>
      ${warnings.length ? `
        <details class="promo-quickfill-warning-list">
          <summary>확인할 내용 ${warnings.length}개</summary>
          <ul>${warnings.map((warning) => `<li>${escapeQuickFillHtml(warning)}</li>`).join("")}</ul>
        </details>` : ""}
    `;
  }

  function renderQuickFillPreview() {
    if (!quickFillParsedRaw) return;
    const list = $("promotionQuickFillPreviewList");
    const previousSelection = new Map();
    list?.querySelectorAll("[data-quickfill-key]").forEach((checkbox) => {
      previousSelection.set(checkbox.dataset.quickfillKey, checkbox.checked);
    });

    const compressOn = $("promotionQuickFillCompressToggle")?.checked !== false;
    const parsed = compressOn ? compressQuickFillParsed(quickFillParsedRaw) : quickFillParsedRaw;
    quickFillLastParsed = parsed;

    const previewResult = $("promotionQuickFillPreviewResult");
    const rows = QUICK_FILL_PREVIEW_FIELDS.filter((field) => trimValue(parsed[field.key]));

    if (list) {
      list.innerHTML = rows.length
        ? rows
            .map(
              (field) => {
                const fieldMeta = getQuickFillFieldMeta(parsed, field.key);
                const confidence = Number(fieldMeta.confidence) || 0;
                const confidenceLabel = getQuickFillConfidenceLabel(confidence);
                const kind = ["extracted", "inferred", "summary", "derived"].includes(fieldMeta.kind)
                  ? fieldMeta.kind
                  : "extracted";
                const checked = previousSelection.has(field.key)
                  ? previousSelection.get(field.key)
                  : confidence >= 0.72;
                return `
        <div class="promo-quickfill-preview-row${confidence < 0.72 ? " is-review" : ""}">
          <label class="promo-quickfill-preview-choice">
            <input type="checkbox" ${checked ? "checked " : ""}data-quickfill-key="${field.key}" />
            <span class="promo-quickfill-preview-field">
              <strong>${field.label}</strong>
              <small>
                <span class="promo-quickfill-origin is-${kind}">${getQuickFillKindLabel(kind)}</span>
                <span class="promo-quickfill-confidence${confidence < 0.72 ? " is-review" : ""}">신뢰도 ${confidenceLabel}</span>
              </small>
            </span>
          </label>
          <div class="promo-quickfill-preview-content">
            <span class="promo-quickfill-preview-value">${escapeQuickFillHtml(parsed[field.key])}</span>
            ${renderQuickFillEvidence(fieldMeta)}
          </div>
        </div>`;
              }
            )
            .join("")
        : "";
    }
    renderQuickFillAnalysisSummary(parsed);
    if (previewResult) {
      const stats = parsed?.analysis?.stats;
      previewResult.textContent = rows.length
        ? stats
          ? `${rows.length}개 항목 · 검토 필요 ${Number(stats.reviewCount) || 0}개`
          : `인식 유형: ${parsed.noticeTypeLabel || "일반 안내"}`
        : "인식된 항목이 없습니다. 직접 입력해 주세요.";
    }
  }

  function parseQuickFillAndShowPreview() {
    const textarea = $("promotionQuickFillTextarea");
    const result = $("promotionQuickFillResult");
    const raw = textarea ? textarea.value : "";
    if (!raw || !raw.trim()) {
      if (result) result.textContent = "붙여넣은 내용이 없습니다.";
      return;
    }

    quickFillParsedRaw = parsePromotionNoticeText(raw);
    renderQuickFillPreview();
    showQuickFillStep("preview");
  }

  function setQuickFillFieldValue(fieldKey, value) {
    if (!value) return false;
    const input = root.querySelector(`[data-promo-field="${fieldKey}"]`);
    if (!input) return false;
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function setQuickFillManualMode(fieldKey) {
    const btn = root.querySelector(`[data-toggle-mode="${fieldKey}"][data-mode="manual"]`);
    if (btn && !btn.disabled) btn.click();
  }

  function applyCheckedQuickFillFields() {
    const parsed = quickFillLastParsed;
    const list = $("promotionQuickFillPreviewList");
    const previewResult = $("promotionQuickFillPreviewResult");
    if (!parsed || !list) return;

    const filledLabels = [];
    QUICK_FILL_PREVIEW_FIELDS.forEach((field) => {
      const checkbox = list.querySelector(`[data-quickfill-key="${field.key}"]`);
      if (!checkbox || !checkbox.checked) return;
      const value = parsed[field.key];
      if (!value) return;
      if (field.toggleMode) setQuickFillManualMode(field.key);
      if (setQuickFillFieldValue(field.key, value)) filledLabels.push(field.label);
    });

    if (previewResult) {
      previewResult.textContent = filledLabels.length
        ? `자동 입력 완료: ${filledLabels.join(", ")}`
        : "선택된 항목이 없습니다.";
    }
    status(
      filledLabels.length
        ? `공고문에서 ${filledLabels.length}개 항목을 자동 입력했습니다.`
        : "선택된 항목이 없습니다.",
      filledLabels.length ? "success" : "info"
    );
    renderPreview();
    if (filledLabels.length) hideQuickFillModal();
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
    qualityNotes: () => syncToggleFieldUI("qualityNotes"),
  };

  function bindAiToggleControls(scope) {
    scope.querySelectorAll(".promo-ai-toggle-enabled").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const field = checkbox.dataset.toggleField;
        state[`${field}Enabled`] = String(checkbox.checked);
        promptDirty = false;
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
        if (isGeminiTargetEngine() && AI_TOGGLE_FIELDS.has(field) && btn.dataset.mode === "ai") {
          status("Gemini에서는 글자 깨짐을 줄이기 위해 이미지 텍스트를 직접 입력으로 사용합니다.", "info");
          return;
        }
        state[`${field}Mode`] = btn.dataset.mode;
        promptDirty = false;
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
        promptDirty = false;
        renderTypeFields();
        renderPreview();
      });
    });
  }

  function bindFieldInputs(scope) {
    scope.querySelectorAll("[data-promo-field]").forEach((input) => {
      const handler = () => {
        const fieldKey = input.dataset.promoField;
        state[fieldKey] = input.type === "checkbox" ? String(input.checked) : input.value;
        promptDirty = false;
        if (input.id === "promotionTargetEngine") {
          state.targetEngine = normalizeTargetEngine(input.value);
          const changed = forceGeminiManualTextModes();
          syncGeminiTextModePolicyUI();
          if (changed) {
            status("Gemini 선택: CTA·한 줄 오퍼·첫 줄 훅·해시태그를 직접 입력으로 전환했습니다.", "info");
          }
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
          if (input.id === "promotionLogoEnabled") {
            syncLogoUI();
          }
          if (
            input.id === "promotionLogoArrangement" ||
            input.id === "promotionLogoPosition" ||
            input.id === "promotionLogoBlendStyle" ||
            input.id === "promotionLogoTextMode" ||
            input.id === "promotionLogoEmphasis"
          ) {
            renderLogoGuidance();
            renderLogoPreview();
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
        schedulePromotionStyleRecommendationRefresh(fieldKey);
        renderPreview();
      };
      input.addEventListener("input", handler);
      input.addEventListener("change", handler);
    });
  }

  function bindRecommendationAutoRefresh() {
    const handler = (event) => {
      const input = event.target.closest?.("[data-promo-field]");
      if (!input || !root.contains(input)) return;
      const fieldKey = input.dataset.promoField;
      if (!PROMOTION_RECOMMENDATION_TRIGGER_FIELDS.has(fieldKey)) return;
      state[fieldKey] = input.type === "checkbox" ? String(input.checked) : input.value;
      schedulePromotionStyleRecommendationRefresh(fieldKey);
    };
    root.addEventListener("input", handler);
    root.addEventListener("change", handler);
  }

  function bindLogoListControls() {
    root.querySelectorAll("[data-logo-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        applyLogoPreset(button.dataset.logoPreset);
      });
    });

    $("promotionLogoPreview")?.addEventListener("click", (event) => {
      const stepButton = event.target.closest("[data-logo-count-step]");
      if (!stepButton) return;
      const role = String(stepButton.dataset.logoRole || "");
      const delta = Number.parseInt(stepButton.dataset.logoCountStep, 10) || 0;
      if (!PROMOTION_LOGO_ROLE_OPTIONS.some((item) => item.value === role)) return;
      const currentCount = splitPromotionLogoNames(getPromotionLogoItemByRole(role).name).length;
      setPromotionLogoRoleCount(role, currentCount + delta);
      if (state.logoArrangement === "row" && getExpandedPromotionLogoItems().length >= 6) {
        state.logoArrangement = "grid";
      }
      syncStaticFields();
      renderLogoGuidance();
      renderLogoPreview();
      renderPreview();
    });

    $("promotionLogoPreview")?.addEventListener("input", (event) => {
      const labelInput = event.target.closest("[data-logo-role-label]");
      if (labelInput) {
        const role = String(labelInput.dataset.logoRoleLabel || "");
        if (!PROMOTION_LOGO_ROLE_OPTIONS.some((item) => item.value === role)) return;
        state.logoRoleLabels = normalizePromotionLogoRoleLabels({
          ...state.logoRoleLabels,
          [role]: labelInput.value,
        });
        promptDirty = false;
        return;
      }

      const nameInput = event.target.closest("[data-logo-role-name]");
      if (nameInput) {
        const role = String(nameInput.dataset.logoRoleName || "");
        if (!PROMOTION_LOGO_ROLE_OPTIONS.some((item) => item.value === role)) return;
        upsertPromotionLogoItem(role, nameInput.value);
        promptDirty = false;
        renderPreview();
        return;
      }

      const countInput = event.target.closest("[data-logo-role-count]");
      if (countInput) {
        const role = String(countInput.dataset.logoRoleCount || "");
        if (!PROMOTION_LOGO_ROLE_OPTIONS.some((item) => item.value === role)) return;
        setPromotionLogoRoleCount(role, countInput.value);
        if (state.logoArrangement === "row" && getExpandedPromotionLogoItems().length >= 6) {
          state.logoArrangement = "grid";
        }
      }
    });

    $("promotionLogoPreview")?.addEventListener("change", (event) => {
      if (!event.target.closest("[data-logo-role-label], [data-logo-role-name], [data-logo-role-count]")) return;
      syncStaticFields();
      renderLogoGuidance();
      renderLogoPreview();
      renderPreview();
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

  function applyColorMode(mode) {
    const normalizedMode = mode === "dark" ? "dark" : "light";
    const palette = COLOR_MODE_PALETTES[normalizedMode];
    state.colorMode = normalizedMode;
    Object.assign(state, palette);
    promptDirty = false;
    syncStaticFields();
    syncColorFieldUI();
    renderPreview();
  }

  function bindColorModeControls() {
    root.querySelectorAll("[data-promo-color-mode]").forEach((button) => {
      button.addEventListener("click", () => applyColorMode(button.dataset.promoColorMode));
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

  

  

  function bindOptimizationControls() {
    const selectBindings = [
      { id: "promotionOutputLanguage", stateKey: "outputLanguage", normalize: normalizeOutputLanguage },
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

    // 상세 모드 관련 필드 및 비주얼 기획 모드 전환 리스너 제거 (기본 모드로 고정)
    root.querySelectorAll("[data-promo-output-language]").forEach((button) => {
      if (button.tagName !== "BUTTON") return;
      button.addEventListener("click", () => {
        state.outputLanguage = "en";
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
    state.keyVisualPlacement = DEFAULT_STATE.keyVisualPlacement;
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

  

  function rerunOptimization() {
    sanitizeStateValues();
    promptDirty = false;
    renderPreview();
    status("현재 설정으로 프롬프트를 다시 정리했습니다.", "success");
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

  const META_PLACEHOLDERS = new Set([
    "브랜드명", "로고", "로고 자리", "참여 태그", "행사명", "일정", "장소", 
    "신청 링크", "CTA 버튼", "QR코드 영역", "출처", "주최기관", "주최/주관 로고", 
    "주관 기관 로고", "교육 과정명", "교육 기간", "신청 자격", "접수 마감일", 
    "교육 혜택(수강료 등)", "사업명", "지원 내용", "접수 기간", "신청 자격 및 방법", 
    "성과 타이틀", "주요 수치 데이터", "캠페인 슬로건", "신청 방법(QR/링크)", "참여 링크(QR)",
    "소요 시간", "경품 혜택", "설문 주제", "신청 방법", "주최/주관", "주관 기관", "주최 기관",
    
    "brand name", "logo", "logo compositing whitespace", "participation hashtags", "event title",
    "date and time", "location", "application method", "organizer logo", "survey topic", 
    "estimated duration", "reward details", "participation link", "course title", 
    "training period", "eligibility", "application deadline", "program benefits", 
    "program title", "support details", "application period", "host agency logo", 
    "performance title", "key numeric data", "data source", "campaign slogan",
    "participation link (qr)", "application method (qr/link)"
  ]);

  function filterMetaPlaceholders(text) {
    if (!text) return "";
    const tokens = text.split(/[,/;·\n]+/);
    const filtered = tokens
      .map(t => t.trim())
      .filter(token => {
        if (!token) return false;
        const lower = token.toLowerCase();
        if (META_PLACEHOLDERS.has(lower)) return false;
        const cleanToken = lower.replace(/\s*\([^)]*\)/g, "").trim();
        if (META_PLACEHOLDERS.has(cleanToken)) return false;
        return true;
      });
    return filtered.join(", ");
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
          schedulePromotionStyleRecommendationRefresh(stateKey);
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
    const bodyCopyForPrompt = formatImageTextHierarchy(state.bodyCopy)
      .map(({ number, text }) => `${number}. ${text}`)
      .join("\n");
    const entries = [
      ["headline", state.headline],
      ["subheadline", state.subheadline],
      ["bodyCopy", bodyCopyForPrompt],
      ["mandatoryElements", filterMetaPlaceholders(state.mandatoryElements)],
    ];

    if (isFieldManualActive("cta")) entries.push(["cta", state.cta]);
    if (isFieldManualActive("posterOffer")) entries.push(["posterOffer", state.posterOffer]);
    if (isFieldManualActive("snsHook")) entries.push(["snsHook", state.snsHook]);
    if (isFieldManualActive("snsHashtags")) entries.push(["snsHashtags", state.snsHashtags]);

    return entries
      .map(([key, value]) => ({
        key,
        label: FIELD_LABELS[key],
        value: key === "bodyCopy"
          ? normalizeLines(value).join("\n")
          : normalizeLines(value).join(" / ") || String(value || "").trim(),
      }))
      .filter((entry) => entry.value);
  }

  function instructionEntries() {
    const entries = [
      ["sizeMode", state.sizeMode === "direct" ? "크기 직접 입력" : "비율 설정"],
      [state.sizeMode === "direct" ? "directSize" : "ratio", getSpecificationSummary()],
      ["orientation", getEffectiveOrientation() === "vertical" ? "세로형" : "가로형"],
      ["goal", state.goal],
      ["audience", state.audience],
      ["commercialBaseline", COMMERCIAL_BASELINE_PROFILES[state.commercialBaseline]?.labelKo || state.commercialBaseline],
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
    if (isEnabled(state.logoEnabled) && getPromotionLogoItems().length) {
      entries.push(["logoItems", getPromotionLogoItems().map((item) => `${getPromotionLogoRoleLabel(item.role)} ${splitPromotionLogoNames(item.name).length}개`).join(" / ")]);
    }

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
      "직접 입력",
      outputLanguageLabel(),
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


  function analyzePromptStats(text) {
    const normalized = String(text || "").replace(/\r\n?/g, "\n");
    const contentLines = normalized
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const sectionPatterns = [
      /^#{1,6}\s+\S/,
      /^\[[^\]]+\]\s*$/,
      /^Regarding\s+.+:\s*$/i,
    ];
    const sections = contentLines.filter((line) =>
      sectionPatterns.some((pattern) => pattern.test(line))
    ).length;
    return {
      normalized,
      sections,
      lines: contentLines.length,
      chars: Array.from(normalized).length,
    };
  }

  function updateStatsBar(text) {
    const stats = analyzePromptStats(text);
    const { normalized, sections, lines, chars } = stats;
    const ko = (normalized.match(/[가-힣ㄱ-ㅎㅏ-ㅣ]/g) || []).length;
    const digits = (normalized.match(/\d/g) || []).length;
    const other = normalized.replace(/[가-힣ㄱ-ㅎㅏ-ㅣ\d]/g, "").length;
    // 한글 1자 ≈ 2.5 토큰 (LLM 표준 보정), 숫자 1자 ≈ 1.0 토큰, 영문/특수(공백 포함) 4자 ≈ 1 토큰
    const tokens = Math.ceil(ko * 2.5 + digits * 1.0 + other / 4);

    const TOKEN_WARN = 1500;
    const TOKEN_OVER = 2500;
    const TOKEN_MAX = 3000;
    const isWarn = tokens >= TOKEN_WARN && tokens < TOKEN_OVER;
    const isOver = tokens >= TOKEN_OVER;
    const pct = Math.min((tokens / TOKEN_MAX) * 100, 100);

    const s = $("promotionStatSections");
    const l = $("promotionStatLines");
    const c = $("promotionStatChars");
    const t = $("promotionStatTokens");
    const transfer = $("promotionStatTransfer");
    const gaugeFill = $("promotionTokenGaugeFill");

    if (s) {
      s.textContent = `섹션 ${sections}`;
      s.title = "최종 프롬프트에서 인식된 실제 제목 블록 수";
    }
    if (l) {
      l.textContent = `${lines} 줄`;
      l.title = "빈 줄을 제외한 실제 내용 줄 수";
    }
    if (c) {
      c.textContent = `${chars.toLocaleString()}자`;
      c.classList.toggle("is-warn", isWarn);
      c.classList.toggle("is-over", isOver);
      c.title = "최종 복사 문자열의 유니코드 문자 수(공백·줄바꿈 포함)";
    }
    if (t) {
      t.textContent = `≈ ${tokens.toLocaleString()} 토큰`;
      t.classList.toggle("is-warn", isWarn);
      t.classList.toggle("is-over", isOver);
    }
    if (transfer) {
      transfer.textContent = "통합 프롬프트";
      transfer.title = "기본 생성 프롬프트를 압축된 단일 구조로 표시합니다.";
      transfer.classList.toggle("is-ok", !isOver);
      transfer.classList.toggle("is-over", isOver);
    }
    if (gaugeFill) {
      gaugeFill.style.width = `${pct.toFixed(1)}%`;
      gaugeFill.title = `예상 토큰 ${tokens.toLocaleString()} / ${TOKEN_MAX.toLocaleString()}`;
      gaugeFill.classList.toggle("is-warn", isWarn);
      gaugeFill.classList.toggle("is-over", isOver);
    }
  }

  function buildPromptPreview(validation = latestValidation) {
    state.targetEngine = normalizeTargetEngine(state.targetEngine);
    latestLint = detectPromptLint(validation, visibleTextEntries(), instructionEntries());
    const raw = renderBasicPrompt(validation, latestLint);
    return sanitizePromptForAI(raw, state.targetEngine);
  }

  // ── 섹션 뷰어: 변경된 섹션 글자색 하이라이트 ──────────────────
  function setViewerMode(editMode) {
    _viewerEditMode = editMode;
    const viewer = $("promotionPromptViewer");
    const textarea = $("promotionPromptPreview");
    const toggleBtn = $("promotionViewerToggleBtn");
    if (viewer) viewer.classList.toggle("promo-mode-hidden", editMode);
    if (textarea) textarea.classList.toggle("promo-mode-hidden", !editMode);
    if (toggleBtn) {
      toggleBtn.textContent = editMode ? "← 미리보기" : "✎ 편집";
      toggleBtn.classList.toggle("is-editing", editMode);
      toggleBtn.title = editMode ? "미리보기 모드로 전환" : "직접 편집 모드로 전환";
    }
  }

  function renderPromptViewer(validation, autoPromptText = promptDraft || "") {
    const viewer = $("promotionPromptViewer");
    if (!viewer) return;

    const rawPrompt = (autoPromptText || "");
    const blocks = rawPrompt.split(/\n\n+/);
    const sections = [];
    blocks.forEach((block) => {
      const lines = block.split(/\r?\n/);
      if (lines.length === 0 || (lines.length === 1 && lines[0] === "")) return;
      const firstLine = lines[0].trim();
      let title = "";
      let bodyLines = lines;
      if (firstLine.startsWith("[") && firstLine.endsWith("]")) {
        title = firstLine;
        bodyLines = lines.slice(1);
      }
      sections.push({
        title: title,
        lines: bodyLines
      });
    });

    viewer.innerHTML = sections.map((section) => {
      const linesHtml = section.lines
        .map((line) => "<div class=\"promo-viewer-line\">" + escapeHtml(line) + "</div>")
        .join("");
      return "<div class=\"promo-viewer-section\">" +
        (section.title ? "<div class=\"promo-viewer-section-title\">" + escapeHtml(section.title) + "</div>" : "") +
        "<button type=\"button\" class=\"promo-section-edit-btn\" title=\"이 섹션 편집\">Edit</button>" +
        "<button type=\"button\" class=\"promo-section-cancel-btn\" title=\"편집 취소\" style=\"display:none\">Cancel</button>" +
        "<button type=\"button\" class=\"promo-section-copy-btn\" title=\"이 섹션 복사\">Copy</button>" +
        "<div class=\"promo-section-lines-container\">" + linesHtml + "</div>" +
        "</div>";
    }).join("");

  }

  // ─────────────────────────────────────────────────────────────

  function renderPreview() {
    const textEntries = visibleTextEntries();
    const instructionItems = instructionEntries();
    const validation = validateState();
    const autoPrompt = buildPromptPreview(validation);

    latestValidation = validation;

    const badge = $("promotionAssetBadge");
    const previewBadge = $("promotionPreviewBadge");
    const targetEngineBadge = $("promotionTargetEngineBadge");
    const summary = $("promotionSummary");
    const guidance = $("promotionGuidance");
    const preview = $("promotionPromptPreview");

    if (badge) badge.textContent = ASSET_LABELS[state.assetType];
    if (previewBadge) {
      if (promptDirty && _viewerEditMode) {
        previewBadge.textContent = "직접 편집 중";
      } else if (promptDirty) {
        previewBadge.textContent = "자동 초안 표시";
      } else if (validation.errors.length) {
        previewBadge.textContent = "입력 보완 필요";
      } else if (validation.warnings.length) {
        previewBadge.textContent = "검토 가능";
      } else {
        previewBadge.textContent = `${ASSET_LABELS[state.assetType]} 생성용`;
      }
    }
    if (targetEngineBadge) {
      const isImagen = !isOpenAITargetEngine(state.targetEngine);
      targetEngineBadge.textContent = isImagen ? "Google" : "OpenAI";
      targetEngineBadge.style.display = "";
      if (isImagen) {
        targetEngineBadge.style.backgroundColor = "#e8f0fe";
        targetEngineBadge.style.color = "#1a73e8";
        targetEngineBadge.style.border = "1px solid #d2e3fc";
      } else {
        targetEngineBadge.style.backgroundColor = "#e6fcf5";
        targetEngineBadge.style.color = "#0ca678";
        targetEngineBadge.style.border = "1px solid #c3fae8";
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

    const shuffleBtn = $("promotionShuffleLayoutBtn");
    if (shuffleBtn) shuffleBtn.style.display = promptDirty ? "none" : "";

    if (preview) {
      if (!promptDirty) {
        promptDraft = autoPrompt;
        // 설정 변경 시 항상 뷰어로 복귀 (편집 모드였어도)
        setViewerMode(false);
      }
      if (preview.value !== promptDraft) {
        preview.value = promptDraft;
      }
      updateStatsBar(_viewerEditMode ? preview.value : autoPrompt);
    }

    // 섹션 뷰어는 직접 편집 초안과 분리해서 항상 최신 자동 프롬프트를 보여준다.
    renderPromptViewer(validation, autoPrompt);

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
        const geminiAiLocked = isGeminiTargetEngine() && btn.dataset.mode === "ai";
        btn.disabled = !enabled || geminiAiLocked;
        btn.title = geminiAiLocked ? "Gemini에서는 글자 정확성을 위해 직접 입력만 사용합니다." : "";
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

  function syncQrCodeUI() {
    const enabled = isEnabled(state.qrEnabled);
    const checkbox = $("promotionQrEnabled");
    const urlWrap = $("promotionQrUrlWrap");
    const urlInput = $("promotionQrUrl");

    if (checkbox) checkbox.checked = enabled;
    if (urlWrap) urlWrap.style.display = enabled ? "" : "none";
    if (urlInput) urlInput.disabled = !enabled;
  }

  function syncLogoUI() {
    const enabled = isEnabled(state.logoEnabled);
    const checkbox = $("promotionLogoEnabled");
    const wrap = $("promotionLogoWrap");

    if (checkbox) checkbox.checked = enabled;
    if (wrap) wrap.style.display = enabled ? "" : "none";
    renderLogoGuidance();
    renderLogoPreview();
  }

  function renderLogoPreview() {
    const container = $("promotionLogoPreview");
    if (!container) return;

    const arrangement = ["row", "grid", "split"].includes(state.logoArrangement) ? state.logoArrangement : "row";
    const position = state.logoPosition === "top" ? "top" : "bottom";
    const style = "blank";
    const emphasis = false;
    const labelShow = true;
    const items = getExpandedPromotionLogoItems();
    const blend = ["panel", "scene", "ribbon", "line", "glass"].includes(state.logoBlendStyle) ? state.logoBlendStyle : "panel";
    const template = getLogoPreviewTemplate();
    const qrBottom = isEnabled(state.qrEnabled) && (state.qrPosition === "bottom-right" || state.qrPosition === "bottom-left" || state.qrPosition === "auto");
    const roleStats = getLogoRoleActivityStats();
    const fallbackItems = items.length
      ? items
      : [
          { role: "host", name: "주최 기관" },
          { role: "organizer", name: "주관 기관" },
          { role: "sponsor", name: "후원 기관" },
        ];

      const slot = (item) => {
        const text = "";
        const roleLabel = labelShow ? `<span class="promo-logo-role-label">${escapeHtml(getPromotionLogoRoleLabel(item.role))}</span>` : "";
        return `<span class="promo-logo-slot">${roleLabel}<span class="promo-logo-chip style-${style} blend-${blend}">${text}</span></span>`;
      };

    let zoneInner = fallbackItems.map((item) => slot(item)).join("");
    if (arrangement === "split") {
      const leftItems = fallbackItems.filter((item) => item.role === "host" || item.role === "organizer");
      const rightItems = fallbackItems.filter((item) => item.role !== "host" && item.role !== "organizer");
      zoneInner = `
        <div class="promo-logo-preview-split-group">${(leftItems.length ? leftItems : fallbackItems.slice(0, Math.ceil(fallbackItems.length / 2))).map((item) => slot(item)).join("")}</div>
        <div class="promo-logo-preview-split-group">${(rightItems.length ? rightItems : fallbackItems.slice(Math.ceil(fallbackItems.length / 2))).map((item) => slot(item)).join("")}</div>
      `;
    }

    const zoneHtml = `<div class="promo-logo-preview-zone arrange-${arrangement} pos-${position} blend-${blend} style-${style}${emphasis ? " emphasis" : ""}">${zoneInner}</div>`;
      const bodyHtml = `
        <div class="promo-logo-preview-canvas-body blend-${blend}">
          <div class="promo-logo-preview-stage template-${template.key}">
            <div class="promo-logo-preview-copy">
              <span class="promo-logo-preview-eyebrow">${escapeHtml(template.eyebrow)}</span>
              <strong>${escapeHtml(template.headline)}</strong>
              <span>${escapeHtml(template.body)}</span>
              <div class="promo-logo-preview-copy-lines">
                <span class="line w-72"></span>
                <span class="line w-58"></span>
                <span class="line w-46"></span>
              </div>
            </div>
            <div class="promo-logo-preview-visual visual-${blend} visual-template-${template.key}">
              <span class="promo-logo-preview-orb orb-a"></span>
              <span class="promo-logo-preview-orb orb-b"></span>
              <span class="promo-logo-preview-panel"></span>
              <span class="promo-logo-preview-photo-card"></span>
              <span class="promo-logo-preview-photo-card secondary"></span>
              <span class="promo-logo-preview-scene-bar"></span>
            </div>
            ${qrBottom ? `<div class="promo-logo-preview-qr">QR</div>` : ``}
          </div>
        </div>
      `;
      const behaviorLines = [
          `목업: ${template.label}`,
          `영역 처리: ${PROMOTION_LOGO_BLEND_META[blend] || "자연 여백형"}`,
          `배치: ${PROMOTION_LOGO_POSITION_META[position] || "하단 통합"} / ${PROMOTION_LOGO_ARRANGEMENT_META[arrangement] || "가로 일렬"}`,
      ];
      const experience = getLogoExperienceSummary();
      const density = getLogoDensitySummary();
      const safety = getLogoEditSafetySummary();
      const activeRoles = getLogoRoleActivityStats().filter((stat) => stat.active);

      container.innerHTML = `
        <div class="promo-logo-preview-frame">
          <div class="promo-logo-live-editor">
            ${roleStats.map((stat) => `
              <div class="promo-logo-live-row${stat.active ? " is-active" : ""}">
                <input type="text" class="promo-logo-live-label" data-logo-role-label="${escapeHtml(stat.role)}" value="${escapeHtml(stat.label)}" aria-label="${escapeHtml(stat.label)} 역할 라벨명" />
                <input type="text" class="promo-logo-live-names" data-logo-role-name="${escapeHtml(stat.role)}" value="${escapeHtml(getPromotionLogoItemByRole(stat.role).name)}" placeholder="기관명, 기관명" aria-label="${escapeHtml(stat.label)} 기관명 목록" />
                <div class="promo-logo-live-stepper" aria-label="${escapeHtml(stat.label)} 로고 개수">
                  <button type="button" data-logo-role="${escapeHtml(stat.role)}" data-logo-count-step="-1" aria-label="${escapeHtml(stat.label)} 로고 1개 줄이기">-</button>
                  <input type="number" min="0" max="12" inputmode="numeric" data-logo-role-count="${escapeHtml(stat.role)}" value="${escapeHtml(String(stat.count))}" aria-label="${escapeHtml(stat.label)} 로고 개수" />
                  <button type="button" data-logo-role="${escapeHtml(stat.role)}" data-logo-count-step="1" aria-label="${escapeHtml(stat.label)} 로고 1개 늘리기">+</button>
                </div>
              </div>
            `).join("")}
          </div>
          <div class="promo-logo-preview-meta">
            ${behaviorLines.map((line) => `<span class="promo-logo-preview-meta-chip">${escapeHtml(line)}</span>`).join("")}
          </div>
          <div class="promo-logo-preview-insights">
            <div class="promo-logo-preview-insight is-primary">
              <span class="promo-logo-preview-insight-label">예상 체감</span>
              <strong>${escapeHtml(experience.title)}</strong>
              <p>${escapeHtml(experience.description)}</p>
            </div>
            <div class="promo-logo-preview-insight">
              <span class="promo-logo-preview-insight-label">배치 밀도</span>
              <strong>${escapeHtml(density.title)}</strong>
              <p>${escapeHtml(density.description)}</p>
            </div>
            <div class="promo-logo-preview-insight">
              <span class="promo-logo-preview-insight-label">후편집 안정성</span>
              <strong>${escapeHtml(safety.title)}</strong>
              <p>${escapeHtml(safety.description)}</p>
            </div>
          </div>
          <div class="promo-logo-preview-canvas blend-${blend}">
            <div class="promo-logo-preview-activity">
              <span class="promo-logo-preview-activity-count">활성 역할 ${activeRoles.length}개</span>
              <span class="promo-logo-preview-activity-roles">${escapeHtml(activeRoles.length ? activeRoles.map((stat) => stat.label).join(" · ") : "아직 입력된 역할 없음")}</span>
            </div>
            ${position === "top" ? zoneHtml + bodyHtml : bodyHtml + zoneHtml}
          </div>
        </div>
      `;
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
        const geminiAiLocked = isGeminiTargetEngine() && btn.dataset.mode === "ai";
        btn.disabled = !enabled || geminiAiLocked;
        btn.title = geminiAiLocked ? "Gemini에서는 글자 정확성을 위해 직접 입력만 사용합니다." : "";
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
        const geminiAiLocked = isGeminiTargetEngine() && btn.dataset.mode === "ai";
        btn.disabled = !enabled || geminiAiLocked;
        btn.title = geminiAiLocked ? "Gemini에서는 글자 정확성을 위해 직접 입력만 사용합니다." : "";
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
        const geminiAiLocked = isGeminiTargetEngine() && btn.dataset.mode === "ai";
        btn.disabled = !enabled || geminiAiLocked;
        btn.title = geminiAiLocked ? "Gemini에서는 글자 정확성을 위해 직접 입력만 사용합니다." : "";
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
      inputNode.disabled = !enabled;
      const section = inputNode.closest(".gen-config-group");
      if (section) section.classList.toggle("promo-field-disabled", !enabled);
    }
  }

  function syncGeminiTextModePolicyUI() {
    const isGemini = isGeminiTargetEngine();
    const guide = $("promotionTargetEngineGuide");
    if (guide) {
      guide.textContent = isGemini
        ? "Gemini는 이미지 속 글자 정확성을 위해 CTA·한 줄 오퍼·첫 줄 훅·해시태그를 직접 입력으로 고정합니다."
        : "최종 프롬프트를 전송할 이미지 생성 AI 엔진을 지정합니다.";
    }
    const notice = $("promotionGeminiTextNotice");
    if (notice) notice.hidden = !isGemini;
    syncCtaToggleUI();
    syncPosterOfferToggleUI();
    syncSnsHookToggleUI();
    syncSnsHashtagsToggleUI();
  }

  function syncConceptBadgeUI() {
    const hasConceptApplied = hasBasicConceptPromptInput();
    const emptyEl = $("promotionConceptEmpty");
    const appliedEl = $("promotionConceptApplied");
    if (!emptyEl || !appliedEl) return;
    emptyEl.hidden = hasConceptApplied;
    appliedEl.hidden = !hasConceptApplied;
    if (!hasConceptApplied) return;
    const nameEl = $("promotionConceptName");
    if (nameEl) nameEl.textContent = state.appliedConceptName || "";
    const emojiEl = $("promotionConceptEmoji");
    if (emojiEl) emojiEl.textContent = state.appliedConceptEmoji || "🎨";
    const catEl = $("promotionConceptCat");
    if (catEl) catEl.textContent = state.appliedConceptCategory || "";
    const descEl = $("promotionConceptCardDesc");
    if (descEl) descEl.textContent = state.appliedConceptDesc || "";
    const paletteEl = $("promotionConceptCardPalette");
    if (paletteEl) {
      paletteEl.innerHTML = "";
      const colors = state.appliedConceptPalette
        ? state.appliedConceptPalette.split(",").map(c => c.trim()).filter(Boolean)
        : [];
      colors.forEach(hex => {
        const dot = document.createElement("span");
        dot.className = "promo-concept-palette-dot";
        dot.style.background = hex;
        dot.title = hex;
        paletteEl.appendChild(dot);
      });
    }
  }

  function syncLayoutBackgroundModeLabels() {
    const isBackgroundOnly = state.keyVisualPlacement === "background";
    const mode = isBackgroundOnly ? "background" : "normal";
    const labels = LAYOUT_CHOICE_LABELS[mode];
    const titles = LAYOUT_CHOICE_TITLES[mode];

    root.querySelectorAll("[data-layout-choice]").forEach((button) => {
      const key = button.dataset.layoutChoice;
      if (!key) return;
      if (labels[key]) button.textContent = labels[key];
      if (titles[key]) button.title = titles[key];
      button.setAttribute("aria-label", labels[key] || button.textContent || "");
    });

    const select = $("promotionLayoutComposition");
    if (select) {
      Array.from(select.options).forEach((option) => {
        const key = option.value;
        if (labels[key]) option.textContent = labels[key];
      });
    }

    const visualGauge = $("promotionLayoutWeightVisualGauge");
    if (visualGauge) {
      visualGauge.title = isBackgroundOnly ? "배경 분위기" : "키비주얼";
    }

    const visualName = $("promotionLayoutWeightVisualName");
    if (visualName) {
      visualName.textContent = isBackgroundOnly
        ? "배경 분위기 강조도 (Background Atmosphere)"
        : "키비주얼 강조도 (Key Visual / Metaphor)";
      visualName.title = isBackgroundOnly
        ? "면적 비율이 아니라 배경 이미지의 분위기, 질감, 이미지 레이어가 주는 상대적 영향도로 해석됩니다."
        : "";
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

    const targetEngineSelect = $("promotionTargetEngine");
    if (targetEngineSelect && targetEngineSelect.value !== state.targetEngine) {
      targetEngineSelect.value = state.targetEngine;
      targetEngineSelect.dispatchEvent(new Event('change'));
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

    const visualAsBgCheckbox = $("promotionVisualAsBackground");
    if (visualAsBgCheckbox) visualAsBgCheckbox.checked = state.keyVisualPlacement === "background";

    // variation, kv-placement 동기화 제거
    syncLayoutBackgroundModeLabels();

    document.querySelectorAll(".promo-type-tab").forEach((button) => {
      const active = button.dataset.promoAsset === state.assetType;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });

    
    root.querySelectorAll("[data-promo-output-language]").forEach((button) => {
      if (button.tagName !== "BUTTON") return;
      const active = normalizeOutputLanguage(button.dataset.promoOutputLanguage) === state.outputLanguage;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    root.querySelectorAll("[data-layout-choice]").forEach((button) => {
      if (button.tagName !== "BUTTON") return;
      const active = button.dataset.layoutChoice === state.layoutComposition;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    syncCustomWeightPanel();

    root.classList.add("promo-basic-mode");

    syncConceptBadgeUI();

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
    syncLogoUI();
    syncPosterOfferToggleUI();
    syncSnsHookToggleUI();
    syncSnsHashtagsToggleUI();
    syncGeminiTextModePolicyUI();
    syncAntiAiPresetUI();
    syncToggleFieldUI("tone");
    syncToggleFieldUI("bigIdea");
    syncToggleFieldUI("visualMetaphor");
    syncToggleFieldUI("visualStyle");
    syncToggleFieldUI("layoutComposition");
    syncToggleFieldUI("qualityNotes");
  }

  function resetAll() {
    if (!confirm("모든 입력값을 초기화합니다. 되돌릴 수 없습니다. 계속할까요?")) return;
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

  

  const _SAMPLE_CONCEPT_KEYS = new Set([
    'appliedConceptStyle', 'appliedConceptName', 'appliedConceptEmoji',
    'appliedConceptCategory', 'appliedConceptDesc', 'appliedConceptTags',
    'appliedConceptPalette', 'appliedConceptPromotionPrompt', 'appliedConceptVisualDNA',
    'appliedConceptPaletteStrategy', 'appliedConceptTextureRendering',
    'appliedConceptLightingMood', 'appliedConceptShapeLanguage',
    'appliedConceptLayoutBehavior', 'appliedConceptTypographyGuidance',
    'appliedConceptCampaignAdaptation', 'appliedConceptObjectAdaptation',
    'appliedConceptAvoid', 'appliedConceptQualityRules', 'conceptInfluenceMode',
  ]);

  function applySampleProfile(profile) {
    if (!profile) return;

    const profileState = profile.state || {};
    const regularState = {};
    const conceptState = {};
    for (const [k, v] of Object.entries(profileState)) {
      if (_SAMPLE_CONCEPT_KEYS.has(k)) conceptState[k] = v;
      else regularState[k] = v;
    }

    assignState({ ...state, ...regularState, colorStrategy: state.colorStrategy });

    if (!isAiColorStrategy() && profile.paletteId) {
      applyPaletteSnapshot(findPaletteById(profile.paletteId));
    }

    Object.entries(profile.quickFields || {}).forEach(([fieldId, values]) => {
      setPresetFieldValues(fieldId, values);
    });

    renderTypeFields();

    // 비주얼 컨셉: 화풍 믹서 pathway(applyPromotionConceptStyle)로 라우팅
    const mixerStyle = profile.mixerStyle || (Object.keys(conceptState).length ? (() => {
      const palette = (conceptState.appliedConceptPalette || '').split(/\s*,\s*/).filter(Boolean);
      return {
        nameKo: conceptState.appliedConceptName || '',
        nameEn: conceptState.appliedConceptName || '',
        emoji: conceptState.appliedConceptEmoji || '🎨',
        category: conceptState.appliedConceptCategory || '',
        desc: conceptState.appliedConceptDesc || '',
        prompt: conceptState.appliedConceptStyle || '',
        promotionPrompt: conceptState.appliedConceptStyle || '',
        palette,
        tags: [],
        promptParts: {
          paletteStrategy:      conceptState.appliedConceptPaletteStrategy || '',
          textureRendering:     conceptState.appliedConceptTextureRendering || '',
          lightingMood:         conceptState.appliedConceptLightingMood || '',
          shapeLanguage:        conceptState.appliedConceptShapeLanguage || '',
          layoutBehavior:       conceptState.appliedConceptLayoutBehavior || '',
          typographyGuidance:   conceptState.appliedConceptTypographyGuidance || '',
          campaignAdaptation:   conceptState.appliedConceptCampaignAdaptation || '',
          objectAdaptation:     conceptState.appliedConceptObjectAdaptation || '',
          avoid:                conceptState.appliedConceptAvoid || '',
          qualityRules:         conceptState.appliedConceptQualityRules || '',
        },
      };
    })() : null);

    if (mixerStyle && typeof window.applyPromotionConceptStyle === 'function') {
      window.applyPromotionConceptStyle(mixerStyle);
      // 화풍 믹서 팔레트도 동기화 (탭 전환 없이 상태만 업데이트)
      if (mixerStyle.palette && mixerStyle.palette.length && typeof window.applyMixerSamplePalette === 'function') {
        window.applyMixerSamplePalette(mixerStyle.palette, mixerStyle.nameKo);
      }
    } else {
      promptDirty = false;
      syncStaticFields();
      renderPreview();
    }
  }

  let _lastSampleIndex = -1;

  function applySample() {
    const pool = (window.PROMO_DATA && SAMPLE_PROFILES && SAMPLE_PROFILES.length > 0) ? SAMPLE_PROFILES : [DEFAULT_SAMPLE_PROFILE];
    let idx;
    do { idx = Math.floor(Math.random() * pool.length); } while (pool.length > 1 && idx === _lastSampleIndex);
    _lastSampleIndex = idx;
    applySampleProfile(pool[idx]);
    status(`샘플 ${idx + 1}/${pool.length} — 내용을 수정해 사용하세요.`, "success");
  }

  function applyRandomMixerPreset() {
    const randomBtn = document.getElementById("btnMixerRandom");
    if (!randomBtn) {
      status("비주얼 믹서가 아직 로드되지 않았습니다. 비주얼 믹서 탭을 한 번 방문한 뒤 다시 시도하세요.", "error");
      return;
    }
    randomBtn.click();
    const applyBtn = document.getElementById("btnMixerApply");
    if (applyBtn) {
      applyBtn.click();
    } else {
      status("비주얼 믹서 랜덤 조합 후 적용 버튼을 찾지 못했습니다.", "error");
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
    if (_viewerEditMode && preview && typeof preview.value === "string") {
      return preview.value;
    }
    return buildPromptPreview(validateState());
  }

  function resetPromptDraft() {
    promptDirty = false;
    promptDraft = buildPromptPreview(validateState());
    renderPreview();
    status("수동 편집을 취소하고 자동 생성 초안으로 되돌렸습니다.", "info");
  }

  async function copyPrompt() {
    const validation = validateState();
    const promptText = getCurrentPromptText();

    try {
      await writeTextToClipboard(promptText);
      if (validation.errors.length) {
        status("입력 보완 필요 항목이 포함된 현재 초안을 복사했습니다.", "success");
      } else if (_viewerEditMode && promptDirty) {
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

    // textarea에 포커스 → 편집 모드 전환
    preview.addEventListener("focus", () => {
      if (!_viewerEditMode) setViewerMode(true);
    });

    preview.addEventListener("input", () => {
      const autoPrompt = buildPromptPreview(validateState());
      promptDraft = preview.value;
      promptDirty = preview.value !== autoPrompt;
      updateStatsBar(preview.value);
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
    $("promotionConceptSampleStyleBtn")?.addEventListener("click", () => {
      window.applyPromotionConceptStyle({
        nameKo: "기본 문서형 스타일",
        nameEn: "Clean Institutional",
        category: "기본",
        emoji: "🏛️",
        desc: "군더더기 없이 깔끔하고 신뢰감 있는 공공·기관 문서형 비주얼 스타일입니다.",
        tags: ["공공기관", "신뢰감", "깔끔", "문서형"],
        prompt: "Clean institutional editorial-campaign style. Restrained navy, white, and warm gray palette. Layer believable documentary photography, structured color fields, fine linework, and compact information modules within one coherent composition. Clear typographic hierarchy, natural light, and controlled visual depth without decorative noise.",
        promotionPrompt: "Clean institutional editorial campaign with a believable documentary photograph as the visual anchor. Integrate the photograph with asymmetric color fields, precise rules, concise information modules, and a strong headline-to-evidence-to-action reading path. Use restrained navy, white, warm gray, and one accent; create layered depth through crop edges, tonal masks, and shared alignment rather than floating UI cards or ornamental effects.",
        visualDNA: "Restrained · Trustworthy · Editorial · Layered · Official",
        paletteStrategy: "Navy and white primary, warm gray secondary. Accent color limited to one soft institutional tone.",
        textureRendering: "Flat matte surfaces, crisp edges, no grain or texture overlay.",
        lightingMood: "Even, shadowless or soft directional light. No dramatic contrast.",
        shapeLanguage: "Rectangular structures, geometric order, no rounded excess.",
        layoutBehavior: "Structured asymmetric editorial grid. Let the headline, documentary photo, and compact information modules share aligned edges and controlled overlaps while preserving calm negative space.",
        typographyGuidance: "Sans-serif institutional typeface. Precise kerning and leading. No decorative type.",
        qualityRules: "Photorealistic or clean flat-graphic quality. No stock-photo clichés. No fake UI overlays.",
        avoid: "Busy backgrounds, excessive gradients, decorative clipart, and amateur layout.",
        palette: ["#1a2e5a", "#ffffff", "#e8e8e8", "#4a7ab5"],
      });
      status("기본 스타일이 적용되었습니다.", "success");
    });
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

  function updateCustomWeightGauge() {
    const tw = Math.max(0, parseInt(state.layoutWeightTitle) || 0);
    const vw = Math.max(0, parseInt(state.layoutWeightVisual) || 0);
    const iw = Math.max(0, parseInt(state.layoutWeightInfo) || 0);

    // Normalize only for the relative-emphasis gauge and prompt hierarchy.
    const total = tw + vw + iw;
    let ntw, nvw, niw, nbw;
    if (total === 0) {
      ntw = nvw = niw = 0; nbw = 100;
    } else if (total <= 100) {
      ntw = tw; nvw = vw; niw = iw;
      nbw = 100 - total;
    } else {
      ntw = Math.round(tw / total * 100);
      nvw = Math.round(vw / total * 100);
      niw = Math.round(iw / total * 100);
      nbw = Math.max(0, 100 - ntw - nvw - niw);
    }
    state.layoutWeightBackground = String(nbw);

    const setScore = (id, val) => { const el = $(id); if (el) el.textContent = val; };
    const setWidth = (id, val) => { const el = $(id); if (el) el.style.width = val + "%"; };

    // Raw inputs are 0-100 emphasis scores, not canvas percentages.
    setScore("promotionLayoutWeightTitleVal", tw);
    setScore("promotionLayoutWeightVisualVal", vw);
    setScore("promotionLayoutWeightInfoVal", iw);

    // Optional normalized labels and the derived breathing-room score.
    setScore("promotionLayoutWeightTitleAlloc", ntw);
    setScore("promotionLayoutWeightVisualAlloc", nvw);
    setScore("promotionLayoutWeightInfoAlloc", niw);
    setScore("promotionLayoutWeightBackgroundVal", nbw);

    // Gauge widths visualize relative attention shares (always sum to 100%).
    setWidth("promotionLayoutWeightTitleGauge", ntw);
    setWidth("promotionLayoutWeightVisualGauge", nvw);
    setWidth("promotionLayoutWeightInfoGauge", niw);
    setWidth("promotionLayoutWeightBackgroundGauge", nbw);

    // Reflect the auto-derived breathing-room score.
    const bgSlider = $("promotionLayoutWeightBackground");
    if (bgSlider) bgSlider.value = nbw;
  }

  function syncCustomWeightPanel() {
    const isCustom = state.layoutComposition === "custom";
    const panel = $("promotionLayoutCustomContainer");
    if (panel) panel.style.display = isCustom ? "" : "none";
    if (isCustom) updateCustomWeightGauge();
  }

  function bindLayoutChoiceBtns() {
    root.querySelectorAll("[data-layout-choice]").forEach((button) => {
      if (button.tagName !== "BUTTON") return;
      button.addEventListener("click", () => {
        state.layoutComposition = button.dataset.layoutChoice;
        const sel = $("promotionLayoutComposition");
        if (sel) sel.value = state.layoutComposition;
        syncStaticFields();
        syncCustomWeightPanel();
        renderPreview();
      });
    });

    $("promotionVisualAsBackground")?.addEventListener("change", (e) => {
      state.keyVisualPlacement = e.target.checked ? "background" : "auto";
      syncStaticFields();
      setViewerMode(false);
      renderPreview();
    });
  }

  function bindCustomWeightSliders() {
    const sliderMap = [
      { id: "promotionLayoutWeightTitle",  key: "layoutWeightTitle" },
      { id: "promotionLayoutWeightVisual", key: "layoutWeightVisual" },
      { id: "promotionLayoutWeightInfo",   key: "layoutWeightInfo" },
    ];
    sliderMap.forEach(({ id, key }) => {
      $(id)?.addEventListener("input", (e) => {
        state[key] = e.target.value;
        updateCustomWeightGauge();
        renderPreview();
      });
    });
  }

  function bindStaticInputs() {
    bindFieldInputs(root);
    bindLogoListControls();
    bindQuickButtons(root);
    bindLayoutChoiceBtns();
    bindCustomWeightSliders();
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

    setText(".promo-step-copy small", "필수 요소와 금지 표현, 결과물 품질 조건을 설정합니다.");
    setText("label[for='promotionMandatoryElements'] + .gen-config-guide", "로고, QR코드, 날짜·장소처럼 결과물에 반드시 확보해야 할 요소를 적습니다.");
    setText("label[for='promotionForbiddenElements'] + .gen-config-guide", "다른 단계에서 이미 지정한 색상, 배경, 액션버튼, 배치가 아니라 제외할 표현만 적습니다.");


    setHtml("label[for='promotionCommercialBaseline']", `상업 완성도 기준 <span class="promo-field-badge instruction">품질 단계</span>`);
    setText("label[for='promotionCommercialBaseline'] + .promo-control-hint", "내용·색상·배치가 아니라 결과물의 마감 밀도를 정합니다. 보통 premium이 적합합니다.");
    setOptions("promotionCommercialBaseline", { off: "기본", standard: "실무형", premium: "프리미엄", luxury: "하이엔드" });
    setSegmentLabels("[data-promo-commercial-baseline]", { off: "기본", standard: "실무형", premium: "프리미엄", luxury: "하이엔드" }, "promoCommercialBaseline");

    setHtml("label[for='promotionCreativityLevel']", `구성 실험 강도 <span class="promo-field-badge instruction">위험도</span>`);
    setText("label[for='promotionCreativityLevel'] + .promo-control-hint", "색상이나 스타일이 아니라 화면 구성의 실험 폭만 조절합니다. 보통 balanced가 안정적입니다.");
    setOptions("promotionCreativityLevel", { stable: "안정형", balanced: "균형형", experimental: "실험형" });
    setSegmentLabels("[data-promo-creativity-level]", { stable: "안정형", balanced: "균형형", experimental: "실험형" }, "promoCreativityLevel");

    setText("label[for='promotionQualityNotes']", "품질 조건");
    setText("label[for='promotionQualityNotes'] + .gen-config-guide", "입력한 품질 조건이 최종 프롬프트의 [Do Not] 영역에 그대로 반영됩니다.");
    const qualityContainer = step.querySelector(".promo-quick-btns[data-quick-for='promotionQualityNotes']");
    if (qualityContainer) {
      qualityContainer.innerHTML = STEP5_QUALITY_OPTIONS
        .map((item) => `<button type="button" class="btn-quick">${escapeHtml(item)}</button>`)
        .join("");
    }
    const qualityInput = $("promotionQualityNotes");
    if (qualityInput) {
      qualityInput.placeholder = "예: 헤드라인과 배경의 명도 대비를 높이고, 작은 글자는 번짐 없이 선명하게 표현";
    }
  }

  function replaceQuickButtons(container, values) {
    if (!container) return;
    container.innerHTML = values
      .map((item) => `<button type="button" class="btn-quick">${escapeHtml(item)}</button>`)
      .join("");
  }

  function applyQrHierarchy() {
    const section = $("promotionQrSection");
    if (!section) return;
    section.innerHTML = `
      <div class="gen-config-label-row">
        <label class="gen-config-label" for="promotionQrEnabled">QR코드 <span class="promo-field-badge instruction">연결 안내</span></label>
        <label class="promo-toggle-row" title="사용 여부">
          <span class="promo-ai-toggle-switch">
            <input type="checkbox" id="promotionQrEnabled" data-promo-field="qrEnabled" />
            <span class="promo-ai-toggle-track"></span>
          </span>
          <span>사용</span>
        </label>
      </div>
      <p class="gen-config-guide">실제 연결 가능한 QR코드는 정확히 생성되지 않을 수 있어, 최종 제작 시 실제 QR 이미지를 별도로 삽입하는 것을 권장합니다.</p>
      <div id="promotionQrUrlWrap" class="promo-qr-url-wrap" style="display:none">
        <label class="gen-config-label" for="promotionQrUrl">QR코드 연결 주소</label>
        <input id="promotionQrUrl" class="gen-input-text" type="url" data-promo-field="qrUrl" placeholder="예: https://example.com/apply" />
        <label class="gen-config-label" for="promotionQrSize">QR코드 크기</label>
        <select id="promotionQrSize" class="gen-select" data-promo-field="qrSize">
          <option value="small">작게</option>
          <option value="medium">보통</option>
          <option value="large">크게</option>
        </select>
        <label class="gen-config-label" for="promotionQrCaption">QR코드 안내문구</label>
        <input id="promotionQrCaption" class="gen-input-text" type="text" data-promo-field="qrCaption" placeholder="예: Scan Me / 스캔해서 신청하기" />
        <label class="gen-config-label" for="promotionQrPosition">QR코드 위치</label>
        <select id="promotionQrPosition" class="gen-select" data-promo-field="qrPosition">
          <option value="auto">자동 (AI가 자연스럽게 배치)</option>
          <option value="bottom-right">우측 하단</option>
          <option value="bottom-left">좌측 하단</option>
          <option value="top-right">우측 상단</option>
          <option value="top-left">좌측 상단</option>
          <option value="inline-info">정보 블록 안에 통합</option>
        </select>
        <label class="promo-toggle-row">
          <span class="promo-ai-toggle-switch">
            <input type="checkbox" id="promotionQrEmphasis" data-promo-field="qrEmphasis" />
            <span class="promo-ai-toggle-track"></span>
          </span>
          <span>QR코드 강조 (테두리·배지·시선유도 요소 추가)</span>
        </label>
        <p class="gen-hint">프롬프트에는 QR코드 공간 배정과 안내문구가 추가됩니다.</p>
      </div>
    `;
  }


  function init() {
    // Bind prompt engine to this IIFE's state and helpers
    window.PROMO_PROMPT.init(state, {
      isAiColorStrategy,
      isConceptGeneratedPromptValue,
      getNonConceptPromptLines,
      shouldUseCompactPromptGuidance,
      isBasicVisualPlanningMode,
      hasBasicConceptPromptInput,
      conceptStripValuesFromState,
      compactConceptSummary,
      kindBadgeHtml,
      status,
      localizeValue,
      localizeHeading,
      localizeSentence,
      getDefaultQualityTagLines,
      getEffectiveOrientation,
      getPromptSpecificationSummary,
      visibleTextEntries,
      instructionEntries,
      backgroundModeLabel,
    });
    attachStaticFieldBadges();
    applyQrHierarchy();
    applyStep5ChoiceTaxonomy();
    loadColorPresets();
    renderColorPresetOptions();
    loadSizePresets();
    renderSizePresetList();
    bindSizeQuickPresets();
    bindSizePresetControls();
    bindTabs();
    bindStaticInputs();
    bindRecommendationAutoRefresh();
    bindOptimizationControls();
    bindColorPickers();
    bindColorModeControls();
    bindColorClearButtons();
    bindLoadInput();
    bindPromptEditor();
    bindWarningModalEvents();
    bindQuickFillTrigger();
    const goConceptTabWithRestore = () => {
      if (typeof window.restoreMixerSelection === "function") {
        window.restoreMixerSelection({
          subjectId: state.appliedConceptSubjectId || "",
          mediumId: state.appliedConceptMediumId || "",
          paletteIdx: state.appliedConceptPaletteIdx !== undefined ? state.appliedConceptPaletteIdx : 0,
          compositionId: state.appliedConceptCompositionId || "",
          typographyId: state.appliedConceptTypographyId || ""
        });
      }
      document.getElementById("tabBtnConceptMixer")?.click();
    };
    $("promotionConceptSelectBtn")?.addEventListener("click", goConceptTabWithRestore);
    $("promotionConceptChangeBtn")?.addEventListener("click", goConceptTabWithRestore);

    // 기관용 랜덤 비주얼 연동
    $("promotionConceptInstRandomBtn")?.addEventListener("click", () => {
      document.getElementById("btnMixerInstRandom")?.click();
    });
    $("promotionConceptInstRandomBtnApplied")?.addEventListener("click", () => {
      document.getElementById("btnMixerInstRandom")?.click();
    });

    // 컬러 팔레트 삭제
    $("promotionConceptClearPaletteBtn")?.addEventListener("click", () => {
      state.appliedConceptPalette = "";
      state.appliedConceptPaletteStrategy = "Derive palette from the selected visual style";
      promptDirty = false;
      syncStaticFields();
      renderPreview();
      status("컬러 팔레트가 삭제되어 기본 색상으로 설정되었습니다.", "success");
    });

    // 스타일 정보 삭제 (기본 스타일로 시작 / 컨셉 삭제)
    $("promotionConceptClearBtn")?.addEventListener("click", () => {
      window.clearPromotionConceptStyle();
      status("스타일 컨셉 정보가 삭제되었습니다.", "success");
    });

    $("promotionRecommendStyleBtn")?.addEventListener("click", renderPromotionStyleRecommendations);
    $("promotionStyleRecommendPanel")?.addEventListener("click", (event) => {
      const closeBtn = event.target.closest("[data-promo-recommend-close]");
      if (closeBtn) {
        const panel = $("promotionStyleRecommendPanel");
        if (panel) panel.hidden = true;
        return;
      }
      const applyBtn = event.target.closest("[data-promo-recommend-index]");
      if (applyBtn) {
        applyPromotionStyleRecommendation(applyBtn.dataset.promoRecommendIndex);
      }
    });

    // 섹션별 Copy / Cancel / Edit 버튼 이벤트 위임 바인딩
    $("promotionPromptViewer")?.addEventListener("click", (e) => {
      const copyBtn = e.target.closest(".promo-section-copy-btn");
      if (copyBtn) {
        const sectionEl = copyBtn.closest(".promo-viewer-section");
        if (!sectionEl) return;

        let textToCopy = "";
        const inlineTextarea = sectionEl.querySelector(".promo-section-inline-textarea");
        if (inlineTextarea) {
          textToCopy = inlineTextarea.value;
        } else {
          const lines = [];
          sectionEl.querySelectorAll(".promo-viewer-line").forEach((el) => {
            lines.push(el.textContent);
          });
          textToCopy = lines.length > 0 ? lines.join("\n") : buildPromptPreview(validateState());
        }

        const sectionTitleEl = sectionEl.querySelector(".promo-viewer-section-title");
        const sectionTitle = sectionTitleEl ? sectionTitleEl.textContent.trim() : "";
        if (sectionTitle && sectionTitle.startsWith("[")) {
          textToCopy = sectionTitle + "\n" + textToCopy;
        }

        navigator.clipboard.writeText(textToCopy)
          .then(() => {
            copyBtn.textContent = "Copied!";
            const sectionTitle = sectionEl.querySelector(".promo-viewer-section-title")?.textContent || "섹션";
            status("'" + sectionTitle + "'" + " 텍스트를 복사했습니다.", "success");
            setTimeout(() => {
              copyBtn.textContent = "Copy";
            }, 1500);
          })
          .catch((err) => {
            status("섹션 텍스트 복사에 실패했습니다.", "error");
          });
        return;
      }

      const cancelBtn = e.target.closest(".promo-section-cancel-btn");
      if (cancelBtn) {
        const sectionEl = cancelBtn.closest(".promo-viewer-section");
        if (!sectionEl) return;

        const linesContainer = sectionEl.querySelector(".promo-section-lines-container");
        const inlineTextarea = sectionEl.querySelector(".promo-section-inline-textarea");
        const editBtn = sectionEl.querySelector(".promo-section-edit-btn");

        if (inlineTextarea) {
          inlineTextarea.remove();
        }
        if (linesContainer) {
          linesContainer.style.display = "";
        }
        if (editBtn) {
          editBtn.textContent = "Edit";
          editBtn.classList.remove("is-active");
        }
        cancelBtn.style.display = "none";
        status("섹션 편집을 취소했습니다.", "info");
        return;
      }

      const editBtn = e.target.closest(".promo-section-edit-btn");
      if (editBtn) {
        const sectionEl = editBtn.closest(".promo-viewer-section");
        if (!sectionEl) return;

        const linesContainer = sectionEl.querySelector(".promo-section-lines-container");
        const isActive = editBtn.classList.contains("is-active");

        if (isActive) {
          const inlineTextarea = sectionEl.querySelector(".promo-section-inline-textarea");
          if (inlineTextarea && linesContainer) {
            const rawText = inlineTextarea.value;
            const lines = rawText.split(/\r?\n/);
            linesContainer.innerHTML = lines
              .map((line) => "<div class=\"promo-viewer-line\">" + escapeHtml(line) + "</div>")
              .join("");
            inlineTextarea.remove();
            linesContainer.style.display = "";
          }

          const cancelBtn = sectionEl.querySelector(".promo-section-cancel-btn");
          if (cancelBtn) cancelBtn.style.display = "none";

          editBtn.textContent = "Edit";
          editBtn.classList.remove("is-active");
          status("섹션 변경 사항을 저장했습니다. (메인 프롬프트에 실시간 반영)", "success");

          const viewer = $("promotionPromptViewer");
          const allSections = [];
          viewer.querySelectorAll(".promo-viewer-section").forEach((sec) => {
            const titleEl = sec.querySelector(".promo-viewer-section-title");
            const titleText = titleEl ? titleEl.textContent.trim() : "";
            
            const secLines = [];
            const secTextarea = sec.querySelector(".promo-section-inline-textarea");
            if (secTextarea) {
              secLines.push(secTextarea.value);
            } else {
              sec.querySelectorAll(".promo-viewer-line").forEach((lineEl) => {
                secLines.push(lineEl.textContent);
              });
            }

            if (titleText) {
              allSections.push(titleText + "\n" + secLines.join("\n"));
            } else {
              allSections.push(secLines.join("\n"));
            }
          });

          const finalPrompt = allSections.join("\n\n");

          const preview = $("promotionPromptPreview");
          promptDraft = finalPrompt;
          if (preview) {
            preview.value = finalPrompt;
          }
          promptDirty = true;

          const previewBadge = $("promotionPreviewBadge");
          if (previewBadge) previewBadge.textContent = "직접 편집 중";
          const shuffleBtn = $("promotionShuffleLayoutBtn");
          if (shuffleBtn) shuffleBtn.style.display = "none";
          
          updateStatsBar(finalPrompt);

        } else {
          if (linesContainer) {
            const lines = [];
            linesContainer.querySelectorAll(".promo-viewer-line").forEach((el) => {
              lines.push(el.textContent);
            });
            const bodyText = lines.join("\n");

            linesContainer.style.display = "none";

            const textarea = document.createElement("textarea");
            textarea.className = "promo-section-inline-textarea";
            textarea.value = bodyText;
            textarea.spellcheck = false;
            sectionEl.appendChild(textarea);
            textarea.focus();
            
            textarea.style.height = "auto";
            textarea.style.height = (textarea.scrollHeight + 10) + "px";
          }

          const cancelBtn = sectionEl.querySelector(".promo-section-cancel-btn");
          if (cancelBtn) cancelBtn.style.display = "inline-block";

          editBtn.textContent = "Save";
          editBtn.classList.add("is-active");
        }
        return;
      }
    });

    // 배지 클릭 시 생성엔진 토글 및 동기화 이벤트
    $("promotionTargetEngineBadge")?.addEventListener("click", () => {
      const nextEngine = state.targetEngine === "dalle" ? "imagen" : "dalle";
      const targetEngineSelect = $("promotionTargetEngine");
      if (targetEngineSelect) {
        targetEngineSelect.value = nextEngine;
        targetEngineSelect.dispatchEvent(new Event('change'));
      }
    });

    $("promotionSampleBtn")?.addEventListener("click", applySample);
    $("promotionRandomPresetBtn")?.addEventListener("click", applyRandomMixerPreset);
    $("promotionSaveBtn")?.addEventListener("click", saveSettings);
    $("promotionLoadBtn")?.addEventListener("click", loadSettings);
    $("promotionPaletteSaveBtn")?.addEventListener("click", saveCurrentPalettePreset);
    $("promotionPaletteApplyBtn")?.addEventListener("click", applySelectedPalettePreset);
    $("promotionPalettePresetSelect")?.addEventListener("change", () => applySelectedPalettePreset({ silent: true }));
    $("promotionPaletteDeleteBtn")?.addEventListener("click", deleteSelectedPalettePreset);
    $("promotionResetBtn")?.addEventListener("click", resetAll);
    $("promotionQualityNotesResetBtn")?.addEventListener("click", () => {
      state.qualityNotes = DEFAULT_STATE.qualityNotes;
      state.qualityNotesEnabled = "true";
      const input = $("promotionQualityNotes");
      if (input) {
        input.value = DEFAULT_STATE.qualityNotes;
      }
      syncToggleFieldUI("qualityNotes");
      promptDirty = false;
      renderPreview();
      status("품질 조건이 기본값으로 초기화되었습니다.", "success");
    });
    $("promotionCopyPromptBtn")?.addEventListener("click", copyPrompt);
    $("promotionShuffleLayoutBtn")?.addEventListener("click", () => {
      const keys = Object.keys(LAYOUT_COMPOSITION_PROFILES);
      const currentKey = state.layoutComposition || "title_focus";
      const candidates = keys.filter((k) => k !== currentKey);
      const newKey = candidates[Math.floor(Math.random() * candidates.length)];
      state.layoutComposition = newKey;
      state.layoutCompositionEnabled = "true";
      state.layoutCompositionMode = "manual";
      promptDirty = false;
      syncStaticFields();
      syncToggleFieldUI("layoutComposition");
      renderPreview();
      const label = LAYOUT_COMPOSITION_PROFILES[newKey]?.labelKo || newKey;
      status(`레이아웃이 재설정되었습니다: ${label}`, "success");
    });
    $("promotionResetPromptBtn")?.addEventListener("click", () => {
      resetPromptDraft();
      setViewerMode(false);
    });

    // 섹션 뷰어 편집 모드 토글
    $("promotionViewerToggleBtn")?.addEventListener("click", () => {
      if (_viewerEditMode) {
        // 편집 → 뷰어: 뷰어 내용은 이미 최신 상태이므로 바로 전환
        setViewerMode(false);
        updateStatsBar(buildPromptPreview(validateState()));
      } else {
        // 뷰어 → 편집 모드
        setViewerMode(true);
        const preview = $("promotionPromptPreview");
        if (preview) preview.focus();
        if (preview) updateStatsBar(preview.value);
      }
    });

    restoreDraft();
    visitedAssetTypes = new Set([state.assetType]);
    syncStaticFields();
    renderTypeFields();
    // 직접 편집 초안이 복원되어도 기본 화면은 최신 자동 프롬프트 뷰어로 시작한다.
    _viewerEditMode = false;
    setViewerMode(_viewerEditMode);
    renderPreview();
  }

  window.applyPromotionConceptStyle = function (style) {
    if (!style) return;

    const previousConceptStripValues = conceptStripValuesFromState();
    const nextConceptStripValues = conceptStripValuesFromStyle(style);
    const conceptStripValues = uniqueValues([...previousConceptStripValues, ...nextConceptStripValues]);

    state.visualPlanningMode = "basic";

    state.appliedConceptStyle = String(style.prompt || style.sourcePrompt || "").trim();
    state.appliedConceptName = [style.nameKo, style.nameEn].filter(Boolean).join(" / ");
    state.appliedConceptCategory = String(style.category || "");
    state.appliedConceptEmoji = String(style.emoji || "").trim();
    state.appliedConceptDesc = String(style.desc || "");
    state.appliedConceptTags = Array.isArray(style.tags) ? style.tags.join(", ") : String(style.tags || "");
    state.appliedConceptPalette = Array.isArray(style.palette) ? style.palette.join(", ") : "";
    state.appliedConceptPromotionPrompt = String(style.promotionPrompt || "").trim();
    state.conceptInfluenceMode = "strong";

    // 복원용 ID 정보 state에 저장
    state.appliedConceptSubjectId = style.subjectId || "";
    state.appliedConceptMediumId = style.mediumId || "";
    state.appliedConceptPaletteIdx = style.paletteIdx !== undefined ? style.paletteIdx : 0;
    state.appliedConceptCompositionId = style.compositionId || "";
    state.appliedConceptTypographyId = style.typographyId || "";

    const conceptParts = conceptPromptPartsFromStyle(style);
        applyConceptPartsToState(conceptParts);
    scrubConceptFromDetailPlanningFields(conceptStripValues);

    promptDirty = false;
    syncStaticFields();
    renderPreview();

    status(`'${style.nameKo}' 콘셉트가 기본 모드 프롬프트 편집 패널에 적용되었습니다.`, "success");
  };

  window.clearPromotionConceptStyle = function () {
    state.appliedConceptStyle = "";
    state.appliedConceptName = "";
    state.appliedConceptCategory = "";
    state.appliedConceptEmoji = "";
    state.appliedConceptDesc = "";
    state.appliedConceptTags = "";
    state.appliedConceptPalette = "";
    state.appliedConceptPromotionPrompt = "";
    state.appliedConceptVisualDNA = "";
    state.appliedConceptPaletteStrategy = "";
    state.appliedConceptTextureRendering = "";
    state.appliedConceptLightingMood = "";
    state.appliedConceptShapeLanguage = "";
    state.appliedConceptLayoutBehavior = "";
    state.appliedConceptTypographyGuidance = "";
    state.appliedConceptCampaignAdaptation = "";
    state.appliedConceptObjectAdaptation = "";
    state.appliedConceptAvoid = "";
    state.appliedConceptQualityRules = "";
    state.conceptInfluenceMode = "none";

    // 복원용 ID 정보 초기화
    state.appliedConceptSubjectId = "";
    state.appliedConceptMediumId = "";
    state.appliedConceptPaletteIdx = 0;
    state.appliedConceptCompositionId = "";
    state.appliedConceptTypographyId = "";

    promptDirty = false;
    syncStaticFields();
    renderPreview();
  };

  init();
})();
