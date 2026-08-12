// 다차원 화풍 믹서 (Visual Style Mixer) — 사용자 중심 UI/UX 고도화 버전
(function () {
  const presetStore = window.CONCEPT_MIXER_PRESETS;
  if (!presetStore) {
    console.error('비주얼 믹서 프리셋 데이터를 불러오지 못했습니다. src/concept-mixer-presets.js 로딩 상태를 확인하세요.');
    return;
  }

  const {
    MIXER_SUBJECTS,
    MEDIUM_CATEGORIES,
    MIXER_MEDIUMS,
    MIXER_MEDIUM_SAMPLES,
    PUBINST_MEDIUM_IDS,
    MIXER_SUBJECT_CATEGORY_FALLBACKS,
    UNSPLASH_CACHE,
    getSubjectDefaultKeyword,
    getUnsplashKey,
    setUnsplashKey,
    fetchUnsplashImage,
    loadMixerManifest,
    getCustomSamplesForMed,
    setCustomSample,
    clearCustomSample,
    readClipboardImageDataUrl,
    uploadMixerSample,
    getCustomKeyword,
    setCustomKeyword,
    clearCustomKeyword,
    resolveSearchKeyword,
    PALETTE_CATEGORIES,
    MIXER_PALETTES,
    EXTRA_BRAND_PALETTES,
    COMPOSITION_CATEGORIES,
    TYPOGRAPHY_CATEGORIES,
    MIXER_COMPOSITIONS,
    MIXER_TYPOGRAPHIES,
  } = presetStore;

  let activeStep = 1; // Wizard 단계: 1, 2, 3, 4, 5
  let activeCategory = 'all';
  let selectedCompositionId = 'none';
  let selectedTypographyId = 'none';
  let activeCompositionCategory = 'all';
  let activeTypographyCategory = 'all';
  let selectedSubjId = 'mix-steel-hot-rolling';
  let selectedMediumId = 'med-3d';
  let selectedPaletteIdx = 0; // 기본: 선택 안 함 (None)
  let activePaletteFilter = 'all';
  let activePaletteColorFilter = 'all';
  let activePaletteTagFilter = 'all';
  let customSubjectKo = '';
  let customSubjectEn = '';
  let customSubjectMode = 'en'; // 'ko' = 한글번역, 'en' = 영어직접입력
  let customMediumKo = '';
  let customMediumEn = '';
  let customMediumEnSuffix = '';
  let customMediumSuffixRaw = '';
  let customMediumMode = 'en';
  let customSubjectPresetSourceId = '';
  let customMediumPresetSourceId = '';
  let subjSearchQ = '';
  let medSearchQ = '';
  let palSearchQ = '';
  let activeSubjectGroupFilter = 'all';
  let activeSubjectSceneFilter = 'all';
  let activeMediumGroupFilter = 'all';
  let activeMediumTextureFilter = 'all';
  let activeMediumCategory = 'all';
  let activePaletteCategory = 'all';
  let isPaletteOverriddenByUser = false;
  let lastGeneratedImageUrl = null;
  let lastGeneratedPrompt = null;
  let isSubjectOverlayOpen = false;
  let isMediumOverlayOpen = false;

  const MIXER_SAMPLE_PLACEHOLDER = 'assets/mixer-placeholder.svg';

  function getMixerPresetSampleUrl(itemId) {
    const safeId = String(itemId || '').replace(/[^a-zA-Z0-9._-]/g, '');
    return safeId
      ? `assets/concept-mixer-previews/${safeId}.jpg`
      : MIXER_SAMPLE_PLACEHOLDER;
  }

  function bindMixerPresetSampleFallback(image) {
    if (!image) return;
    image.addEventListener('error', () => {
      image.src = MIXER_SAMPLE_PLACEHOLDER;
    }, { once: true });
  }

  function getManagedMixerImageSource(image) {
    if (!image) return '';
    const raw = String(image.getAttribute('src') || image.src || '');
    if (/^data:image\/(?:png|jpeg|webp);base64,/i.test(raw)) return raw;
    if (/^assets\//.test(raw) || /^\/assets\//.test(raw)) return raw;
    if (/^\/?outputs\/mixer_samples\//.test(raw)) {
      return raw.startsWith('/') ? raw : `/${raw}`;
    }
    try {
      const parsed = new URL(raw, window.location.origin);
      if (parsed.origin !== window.location.origin) return '';
      if (!parsed.pathname.startsWith('/outputs/mixer_samples/')) return '';
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch (_) {
      return '';
    }
  }

  function getRegisteredMixerSampleUrl(itemId, extension = 'jpg') {
    const safeId = String(itemId || '').replace(/[^a-zA-Z0-9._-]/g, '');
    return safeId
      ? `outputs/mixer_samples/${safeId}_0.${extension}`
      : MIXER_SAMPLE_PLACEHOLDER;
  }

  function bindRegisteredMixerSampleFallback(image, itemId) {
    if (!image) return;
    const safeId = String(itemId || '').replace(/[^a-zA-Z0-9._-]/g, '');
    if (!safeId) {
      image.src = MIXER_SAMPLE_PLACEHOLDER;
      return;
    }

    const currentPath = (() => {
      try { return new URL(image.src, document.baseURI).pathname.replace(/^\//, ''); }
      catch { return String(image.getAttribute('src') || '').replace(/^\//, '').split('?')[0]; }
    })();
    const candidates = ['jpg', 'png', 'webp']
      .map(extension => getRegisteredMixerSampleUrl(safeId, extension))
      .filter(candidate => !currentPath.endsWith(candidate));
    candidates.push(MIXER_SAMPLE_PLACEHOLDER);

    let cursor = 0;
    image.addEventListener('error', function useNextRegisteredSample() {
      if (cursor >= candidates.length) {
        image.removeEventListener('error', useNextRegisteredSample);
        return;
      }
      image.src = candidates[cursor++];
    });
  }

  // 사용자 커스텀 항목 (localStorage)
  const LS_USER_SUBJ      = 'mixerUserSubjects';
  const LS_USER_MED       = 'mixerUserMediums';
  const LS_USER_SUBJ_CATS = 'mixerUserSubjectCategories';
  const LS_USER_MED_CATS  = 'mixerUserMediumCategories';
  const LS_ADMIN_PRESET_OVERRIDES = 'mixerAdminPresetOverridesV1';
  const SUBJ_SCENE_LABELS = {
    all: '🌐 전체',
    facility: '🏗 시설·현장',
    lab: '🧪 연구·실험',
    space: '🏛 공간·건축',
    people: '👥 사람·활동',
    nature: '🌿 자연·환경',
    service: '📋 서비스·행정'
  };

  const SUBJ_CATEGORY_LABELS = {
    all: '🌐 전체',
    steel: '🏭 철강 & 중공업',
    energy: '⚡ 미래 에너지',
    software: '💻 소프트웨어 & IT',
    bio: '🧬 바이오 & 라이프',
    finance: '📈 금융 & 자산',
    public: '🏛️ 공공 & 인프라',
    brand: '🏷️ 브랜드 & 홍보',
    space: '🚀 우주항공 & 미래',
    regional: '📍 지역산업 & 거점',
    policy: '📋 정책 & 공공지원',
    urban: '🏙️ 도시 & 건축',
    food: '🍱 푸드 & 농식품',
    culture: '🎭 문화 & 관광',
    education: '📚 교육 & 연구',
    health: '🏥 헬스케어 & 의료',
    mobility: '🚗 모빌리티 & 물류',
    ocean: '🌊 해양 & 수산',
    materials: '⚗️ 신소재 & 화학',
    creative: '🎬 창작 & 미디어',
    environment: '🌍 환경 & 기후',
    tech_transfer: '🤝 기술사업화',
    talent_cultivation: '🎓 인력양성',
    networking: '🌐 네트워킹',
    __user__: '⭐ 내 커스텀'
  };

  const SUBJECT_WIZARD_DOMAINS = [
    { id: 'battery', label: '이차전지', emoji: '🔋', group: 'mfg', scene: 'facility', en: 'secondary battery' },
    { id: 'hydrogen', label: '수소', emoji: '🧪', group: 'mfg', scene: 'facility', en: 'hydrogen energy' },
    { id: 'ai', label: 'AI·데이터', emoji: '🧠', group: 'knowledge', scene: 'service', en: 'AI and data technology' },
    { id: 'bio', label: '바이오', emoji: '🧬', group: 'knowledge', scene: 'lab', en: 'bio and healthcare technology' },
    { id: 'renewable', label: '신재생', emoji: '☀️', group: 'mfg', scene: 'facility', en: 'renewable energy' },
    { id: 'steel_mfg', label: '철강·제조업', emoji: '🏭', group: 'mfg', scene: 'facility', en: 'steel and manufacturing industry' }
  ];

  // 모든 분야에 공통 적용되는 범용 구성요소 풀 (도메인 전용 전문용어 대신 산업 단계어로 다양성 확보)
  // scene/target과 동일하게 카테고리당 phrase pool을 둬서 클릭할 때마다 구체어가 바뀌도록 함
  const SUBJECT_WIZARD_STAGES = [
    {
      id: 'materials',
      label: '소재',
      emoji: '🧱',
      phrases: [
        { en: 'raw materials', ko: '원료' },
        { en: 'advanced materials', ko: '신소재' },
        { en: 'composite materials', ko: '복합소재' },
        { en: 'nanomaterials', ko: '나노소재' },
        { en: 'eco-friendly materials', ko: '친환경소재' }
      ]
    },
    {
      id: 'process',
      label: '공정',
      emoji: '🔧',
      phrases: [
        { en: 'refining process', ko: '정제공정' },
        { en: 'synthesis process', ko: '합성공정' },
        { en: 'processing', ko: '가공공정' },
        { en: 'coating process', ko: '코팅공정' },
        { en: 'heat treatment process', ko: '열처리공정' }
      ]
    },
    {
      id: 'components',
      label: '부품',
      emoji: '🔩',
      phrases: [
        { en: 'core components', ko: '핵심부품' },
        { en: 'module components', ko: '모듈부품' },
        { en: 'precision components', ko: '정밀부품' },
        { en: 'assembly components', ko: '조립부품' },
        { en: 'spare components', ko: '예비부품' }
      ]
    },
    {
      id: 'design',
      label: '설계',
      emoji: '📐',
      phrases: [
        { en: 'structural design', ko: '구조설계' },
        { en: 'circuit design', ko: '회로설계' },
        { en: 'process design', ko: '공정설계' },
        { en: 'optimized design', ko: '최적설계' },
        { en: 'drafting design', ko: '도면설계' }
      ]
    },
    {
      id: 'packaging',
      label: '패키징',
      emoji: '📦',
      phrases: [
        { en: 'packaging design', ko: '포장설계' },
        { en: 'cushioning configuration', ko: '완충재구성' },
        { en: 'labeling', ko: '라벨링' },
        { en: 'eco-friendly packaging', ko: '친환경포장' },
        { en: 'logistics packaging', ko: '물류포장' }
      ]
    },
    {
      id: 'supply',
      label: '유통·공급망',
      emoji: '🚚',
      phrases: [
        { en: 'raw material sourcing', ko: '원자재조달' },
        { en: 'logistics optimization', ko: '물류최적화' },
        { en: 'inventory management', ko: '재고관리' },
        { en: 'supplier management', ko: '협력사관리' },
        { en: 'import-export process', ko: '수출입절차' }
      ]
    },
    {
      id: 'integration',
      label: '시스템·통합',
      emoji: '🧩',
      phrases: [
        { en: 'integrated control', ko: '통합제어' },
        { en: 'data integration', ko: '데이터연동' },
        { en: 'automation linkage', ko: '자동화연계' },
        { en: 'platform integration', ko: '플랫폼통합' },
        { en: 'IoT integration', ko: 'IoT연동' }
      ]
    },
    {
      id: 'pilot',
      label: '실증',
      emoji: '🛰️',
      phrases: [
        { en: 'pilot operation', ko: '파일럿운영' },
        { en: 'demonstration plant', ko: '실증플랜트' },
        { en: 'field verification', ko: '현장검증' },
        { en: 'performance demonstration', ko: '성능실증' },
        { en: 'commercialization test', ko: '상용화테스트' }
      ]
    },
    { id: 'auto', label: 'AI 위임', emoji: '🤖', phrases: [] }
  ];

  const SUBJECT_WIZARD_SCENES = [
    {
      id: 'dev',
      label: '개발·실험',
      emoji: '🔬',
      verb: 'conducting',
      phrases: [
        { en: 'testing and analysis', ko: '시험분석' },
        { en: 'technology development', ko: '기술개발' },
        { en: 'material analysis', ko: '소재분석' },
        { en: 'testing and certification', ko: '시험인증' },
        { en: 'performance evaluation', ko: '성능평가' },
        { en: 'prototype trial', ko: '시제품시험' },
        { en: 'simulation modeling', ko: '시뮬레이션' }
      ]
    },
    {
      id: 'teach',
      label: '교육·전수',
      emoji: '👨‍🏫',
      verb: 'leading',
      phrases: [
        { en: 'lecture session', ko: '강의' },
        { en: 'hands-on instruction', ko: '실습지도' },
        { en: 'seminar', ko: '세미나' },
        { en: 'workshop', ko: '워크숍' },
        { en: 'expert advisory session', ko: '자문' },
        { en: 'mentoring session', ko: '멘토링' },
        { en: 'curriculum briefing', ko: '커리큘럼설명회' }
      ]
    },
    {
      id: 'learn',
      label: '학습·실습',
      emoji: '🙋',
      verb: 'participating in',
      phrases: [
        { en: 'practical training', ko: '실습' },
        { en: 'site tour', ko: '견학' },
        { en: 'internship', ko: '인턴십' },
        { en: 'field training', ko: '현장실습' },
        { en: 'self-directed study', ko: '자율학습' },
        { en: 'group project work', ko: '팀프로젝트' },
        { en: 'competency test', ko: '역량평가' }
      ]
    },
    {
      id: 'build',
      label: '구축·설치',
      emoji: '🏗️',
      verb: 'overseeing',
      phrases: [
        { en: 'groundbreaking', ko: '착공' },
        { en: 'completion ceremony', ko: '준공' },
        { en: 'installation', ko: '설치' },
        { en: 'facility expansion', ko: '증설' },
        { en: 'renovation', ko: '리모델링' },
        { en: 'equipment commissioning', ko: '장비셋업' },
        { en: 'test run before opening', ko: '시운전' }
      ]
    },
    {
      id: 'plan',
      label: '기획·설계',
      emoji: '📐',
      verb: 'planning',
      phrases: [
        { en: 'feasibility study', ko: '타당성조사' },
        { en: 'basic design', ko: '기본설계' },
        { en: 'detailed design', ko: '실시설계' },
        { en: 'permit approval process', ko: '인허가' },
        { en: 'project planning', ko: '사업기획' },
        { en: 'blueprint review', ko: '도면검토' },
        { en: 'budget planning session', ko: '예산기획' }
      ]
    },
    {
      id: 'ops',
      label: '운영·점검',
      emoji: '⚙️',
      verb: 'carrying out',
      phrases: [
        { en: 'facility operation', ko: '가동' },
        { en: 'routine inspection', ko: '정기점검' },
        { en: 'maintenance work', ko: '유지보수' },
        { en: 'safety inspection', ko: '안전점검' },
        { en: 'quality control', ko: '품질관리' },
        { en: 'process monitoring', ko: '공정모니터링' },
        { en: 'equipment calibration', ko: '장비교정' }
      ]
    },
    {
      id: 'report',
      label: '성과·보고',
      emoji: '📢',
      verb: 'presenting at',
      phrases: [
        { en: 'results presentation', ko: '성과발표' },
        { en: 'performance report', ko: '실적보고' },
        { en: 'evaluation meeting', ko: '평가회' },
        { en: 'conference', ko: '컨퍼런스' },
        { en: 'awards ceremony', ko: '시상식' },
        { en: 'press briefing', ko: '언론브리핑' },
        { en: 'outcome showcase', ko: '성과전시' }
      ]
    },
    {
      id: 'network',
      label: '협력·교류',
      emoji: '🤝',
      verb: 'attending',
      phrases: [
        { en: 'MOU signing', ko: '업무협약' },
        { en: 'consortium meeting', ko: '컨소시엄' },
        { en: 'consultation event', ko: '상담회' },
        { en: 'trade fair', ko: '박람회' },
        { en: 'exchange gathering', ko: '교류회' },
        { en: 'networking reception', ko: '네트워킹행사' },
        { en: 'joint working session', ko: '공동작업회의' }
      ]
    },
    {
      id: 'auto',
      label: 'AI 위임',
      emoji: '🤖',
      phrases: []
    }
  ];
  // 각 phrase 객체에 소속 카테고리의 동사(verb)를 부착 (AI 위임 pool 평탄화 후에도 동사 유지)
  SUBJECT_WIZARD_SCENES.forEach(cat => {
    if (cat.verb) cat.phrases.forEach(phrase => { phrase.verb = cat.verb; });
  });

  const SUBJECT_WIZARD_TARGETS = [
    {
      id: 'people',
      label: '사람',
      emoji: '🧑',
      usage: 'education',
      phrases: [
        { en: 'professor', ko: '교수' },
        { en: 'student', ko: '학생' },
        { en: 'researcher', ko: '연구원' },
        { en: 'office worker', ko: '직장인' },
        { en: 'job seeker', ko: '취업예정자' },
        { en: 'engineer', ko: '엔지니어' },
        { en: 'entrepreneur', ko: '창업가' }
      ]
    },
    {
      id: 'facility',
      label: '시설',
      emoji: '🏭',
      usage: 'promotion',
      phrases: [
        { en: 'factory', ko: '공장' },
        { en: 'research institute', ko: '연구소' },
        { en: 'campus', ko: '캠퍼스' },
        { en: 'center facility', ko: '센터' },
        { en: 'industrial complex', ko: '단지' },
        { en: 'incubation center', ko: '창업보육센터' },
        { en: 'demonstration plant', ko: '실증플랜트' }
      ]
    },
    {
      id: 'equipment',
      label: '장비',
      emoji: '⚙️',
      usage: 'promotion',
      phrases: [
        { en: 'analysis equipment', ko: '분석장비' },
        { en: 'production equipment', ko: '생산설비' },
        { en: 'laboratory instrument', ko: '실험기기' },
        { en: 'measurement device', ko: '계측장비' },
        { en: 'prototype equipment', ko: '시제품장비' },
        { en: 'automation robot', ko: '자동화로봇' },
        { en: 'control system panel', ko: '제어시스템' }
      ]
    },
    {
      id: 'data',
      label: '데이터·성과',
      emoji: '📊',
      usage: 'report',
      phrases: [
        { en: 'statistical data', ko: '통계자료' },
        { en: 'report document', ko: '보고서' },
        { en: 'dashboard', ko: '대시보드' },
        { en: 'certificate', ko: '인증서' },
        { en: 'patent', ko: '특허' },
        { en: 'growth chart', ko: '성장그래프' },
        { en: 'analytics infographic', ko: '분석인포그래픽' }
      ]
    },
    {
      id: 'product',
      label: '제품·결과물',
      emoji: '📦',
      usage: 'promotion',
      phrases: [
        { en: 'prototype', ko: '시제품' },
        { en: 'finished product', ko: '완제품' },
        { en: 'component part', ko: '부품' },
        { en: 'sample', ko: '샘플' },
        { en: 'module', ko: '모듈' },
        { en: 'packaged unit', ko: '패키지제품' },
        { en: 'demo kit', ko: '데모키트' }
      ]
    },
    {
      id: 'network',
      label: '단체·네트워크',
      emoji: '🤝',
      usage: 'promotion',
      phrases: [
        { en: 'association', ko: '협회' },
        { en: 'consortium', ko: '컨소시엄' },
        { en: 'industry cluster', ko: '클러스터' },
        { en: 'cooperative', ko: '조합' },
        { en: 'forum', ko: '포럼' },
        { en: 'alliance', ko: '얼라이언스' },
        { en: 'working committee', ko: '실무위원회' }
      ]
    },
    {
      id: 'site',
      label: '현장·환경',
      emoji: '🌍',
      usage: 'promotion',
      phrases: [
        { en: 'industrial park', ko: '산업단지' },
        { en: 'campus panorama', ko: '캠퍼스전경' },
        { en: 'port', ko: '항만' },
        { en: 'logistics center', ko: '물류센터' },
        { en: 'urban landscape', ko: '도시경관' },
        { en: 'construction site', ko: '건설현장' },
        { en: 'coastal industrial zone', ko: '연안산업지대' }
      ]
    },
    {
      id: 'document',
      label: '문서·계약',
      emoji: '🧾',
      usage: 'report',
      phrases: [
        { en: 'contract document', ko: '계약서' },
        { en: 'certification document', ko: '인증서' },
        { en: 'MOU document', ko: 'MOU' },
        { en: 'patent certificate', ko: '특허증' },
        { en: 'authorization document', ko: '인가서' },
        { en: 'proposal document', ko: '제안서' },
        { en: 'signed agreement', ko: '협약서' }
      ]
    },
    {
      id: 'auto',
      label: 'AI 위임',
      emoji: '🤖',
      usage: 'promotion',
      phrases: []
    }
  ];

  const MED_CATEGORY_LABELS = {
    all: '🌐 전체',
    tech3d: '🧊 3D·건축',
    graphic: '🎨 그래픽·디자인',
    paint: '🖌️ 회화·일러스트',
    anime: '🎬 만화·애니',
    photo: '📷 사진·실사',
    craft: '🧶 공예·핸드메이드',
    game: '🎮 게임·픽셀',
    abstract: '🌀 추상·실험',
    __user__: '⭐ 내 커스텀'
  };

  const MED_TEXTURE_LABELS = {
    all: '🌐 전체',
    clean: '📐 클린',
    glossy: '✨ 글로시',
    textured: '🖌 질감형',
    real: '📷 리얼',
    tactile: '🧵 재질감',
    vivid: '🌈 비비드'
  };

  const ORIGINAL_MIXER_PRESETS = {
    subjects: JSON.parse(JSON.stringify(MIXER_SUBJECTS)),
    mediums: JSON.parse(JSON.stringify(MIXER_MEDIUMS))
  };

  const SUBJECT_GROUP_FILTER_MAP = {
    // 제조·생산 (중공업·에너지·소재·모빌리티)
    steel: 'mfg',
    energy: 'mfg',
    materials: 'mfg',
    mobility: 'mfg',
    // 지식·서비스 (소프트웨어·바이오·금융·기술사업화)
    software: 'knowledge',
    bio: 'knowledge',
    finance: 'knowledge',
    tech_transfer: 'knowledge',
    // 공공·정책
    public: 'public',
    policy: 'public',
    regional: 'public',
    networking: 'public',
    talent_cultivation: 'public',
    // 도시·인프라
    urban: 'urban',
    // 도시·인프라
    space: 'urban',
    environment: 'future',
    // 생활·문화
    brand: 'life',
    food: 'life',
    culture: 'life',
    education: 'life',
    health: 'life',
    creative: 'life',
    ocean: 'life',
  };

  const SUBJECT_SCENE_FILTER_MAP = {
    steel: 'facility',
    energy: 'facility',
    software: 'service',
    bio: 'lab',
    finance: 'service',
    materials: 'lab',
    mobility: 'facility',
    tech_transfer: 'service',
    public: 'service',
    policy: 'service',
    regional: 'facility',
    networking: 'people',
    talent_cultivation: 'people',
    urban: 'space',
    space: 'space',
    brand: 'people',
    food: 'people',
    culture: 'people',
    education: 'people',
    health: 'people',
    creative: 'people',
    ocean: 'nature',
    environment: 'nature',
  };

  const MEDIUM_GROUP_FILTER_MAP = {
    tech3d: 'render3d',
    arch: 'render3d',
    analog: 'graphic',
    graphic: 'graphic',
    trad: 'graphic',
    editorial: 'graphic',
    digital_paint: 'graphic',
    youtube_anim: 'graphic',
    photo: 'photo',
    nature_photo: 'photo',
    craft: 'craft',
    official: 'uiinfo',
    cardnews: 'graphic',
    ui_ux: 'uiinfo',
    anime: 'experimental',
    game: 'experimental',
    pixel_adv: 'experimental',
    abstract: 'experimental',
  };

  const MEDIUM_TEXTURE_FILTER_MAP = {
    tech3d: 'glossy',
    arch: 'clean',
    analog: 'textured',
    graphic: 'clean',
    trad: 'textured',
    editorial: 'glossy',
    digital_paint: 'textured',
    youtube_anim: 'clean',
    photo: 'real',
    nature_photo: 'real',
    craft: 'tactile',
    official: 'clean',
    cardnews: 'glossy',
    ui_ux: 'clean',
    anime: 'vivid',
    game: 'vivid',
    pixel_adv: 'vivid',
    abstract: 'vivid',
  };

  function loadUserItems(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  }
  function saveUserItems(key, arr) {
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch {}
  }

  function loadAdminPresetOverrides() {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_ADMIN_PRESET_OVERRIDES) || '{}');
      return {
        subjects: raw && typeof raw.subjects === 'object' ? raw.subjects : {},
        mediums: raw && typeof raw.mediums === 'object' ? raw.mediums : {}
      };
    } catch {
      return { subjects: {}, mediums: {} };
    }
  }

  function saveAdminPresetOverrides(overrides) {
    try {
      localStorage.setItem(LS_ADMIN_PRESET_OVERRIDES, JSON.stringify(overrides));
      return true;
    } catch {
      alert('수정값 저장에 실패했습니다. 브라우저 저장 공간을 확인하세요.');
      return false;
    }
  }

  function isMixerAdminUser() {
    try {
      const session = window.PromptDeckAuth?.loadSession?.()
        || JSON.parse(sessionStorage.getItem('promptdeck_session') || 'null');
      return !!session && session.role === 'admin';
    } catch {
      return false;
    }
  }

  function findBuiltInSubjectById(id) {
    return Object.values(MIXER_SUBJECTS).flat().find(item => item.id === id) || null;
  }

  function findOriginalBuiltInSubjectById(id) {
    return Object.values(ORIGINAL_MIXER_PRESETS.subjects).flat().find(item => item.id === id) || null;
  }

  function findOriginalBuiltInMediumById(id) {
    return ORIGINAL_MIXER_PRESETS.mediums.find(item => item.id === id) || null;
  }

  function getSubjectGroupFilterId(categoryId) {
    return SUBJECT_GROUP_FILTER_MAP[categoryId] || 'knowledge';
  }

  function getSubjectSceneFilterId(categoryId) {
    return SUBJECT_SCENE_FILTER_MAP[categoryId] || 'people';
  }

  function getMediumGroupFilterId(categoryId) {
    return MEDIUM_GROUP_FILTER_MAP[categoryId] || 'graphic';
  }

  function getMediumTextureFilterId(categoryId) {
    return MEDIUM_TEXTURE_FILTER_MAP[categoryId] || 'clean';
  }

  const DELETED_PRESET_IDS = { subjects: new Set(), mediums: new Set() };

  function applyAdminPresetOverrides() {
    const overrides = loadAdminPresetOverrides();
    DELETED_PRESET_IDS.subjects.clear();
    DELETED_PRESET_IDS.mediums.clear();
    Object.entries(overrides.subjects || {}).forEach(([id, patch]) => {
      if (patch?._deleted) { DELETED_PRESET_IDS.subjects.add(id); return; }
      const item = findBuiltInSubjectById(id);
      if (item && patch && typeof patch === 'object') {
        Object.assign(item, {
          emoji: patch.emoji || item.emoji,
          nameKo: patch.nameKo || item.nameKo,
          desc: patch.desc || '',
          descKo: patch.descKo || '',
          prompt: patch.prompt || item.prompt,
          _cat: patch._cat || item._cat,
          group: patch.group || item.group,
          scene: patch.scene || item.scene
        });
      }
    });
    Object.entries(overrides.mediums || {}).forEach(([id, patch]) => {
      if (patch?._deleted) { DELETED_PRESET_IDS.mediums.add(id); return; }
      const item = MIXER_MEDIUMS.find(medium => medium.id === id);
      if (item && patch && typeof patch === 'object') {
        Object.assign(item, {
          emoji: patch.emoji || item.emoji,
          nameKo: patch.nameKo || item.nameKo,
          desc: patch.desc || '',
          descKo: patch.descKo || '',
          prefix: patch.prefix || item.prefix,
          suffix: patch.suffix || '',
          category: patch.category || item.category,
          group: patch.group || item.group,
          texture: patch.texture || item.texture
        });
      }
    });
  }

  function deleteBuiltInPreset(type, id) {
    const key = type === 'subject' ? 'subjects' : 'mediums';
    const overrides = loadAdminPresetOverrides();
    overrides[key][id] = { _deleted: true };
    if (!saveAdminPresetOverrides(overrides)) return false;
    DELETED_PRESET_IDS[key].add(id);
    return true;
  }

  function saveAdminPresetOverride(type, id, patch) {
    const key = type === 'subject' ? 'subjects' : 'mediums';
    const overrides = loadAdminPresetOverrides();
    overrides[key][id] = patch;
    return saveAdminPresetOverrides(overrides);
  }

  function clearAdminPresetOverride(type, id) {
    const key = type === 'subject' ? 'subjects' : 'mediums';
    const overrides = loadAdminPresetOverrides();
    delete overrides[key][id];
    return saveAdminPresetOverrides(overrides);
  }

  function syncSubjectPresetToCustom(subj) {
    if (!subj) return;
    customSubjectMode = 'en';
    customSubjectKo = subj.nameKo || '';
    customSubjectEn = subj.prompt || '';
    customSubjectPresetSourceId = subj.id || '';
  }

  function syncMediumPresetToCustom(med) {
    if (!med) return;
    customMediumMode = 'en';
    customMediumKo = med.nameKo || '';
    customMediumSuffixRaw = med.suffix || '';
    customMediumEn = med.prefix || '';
    customMediumEnSuffix = med.suffix || '';
    customMediumPresetSourceId = med.id || '';
  }

  function syncSelectedPresetsToCustom(subject, medium) {
    if (subject && customSubjectPresetSourceId !== subject.id) {
      syncSubjectPresetToCustom(subject);
    }
    if (medium && customMediumPresetSourceId !== medium.id) {
      syncMediumPresetToCustom(medium);
    }
  }

  applyAdminPresetOverrides();

  let userSubjects      = loadUserItems(LS_USER_SUBJ);
  let userMediums       = loadUserItems(LS_USER_MED);
  let userSubjectCats   = loadUserItems(LS_USER_SUBJ_CATS); // [{id,name,emoji}]
  let userMediumCats    = loadUserItems(LS_USER_MED_CATS);

  // "내 커스텀" 탭 내 서브카테고리 필터 상태
  let activeUserSubjCat = '__all__'; // '__all__' or category id
  let activeUserMedCat  = '__all__';

  // 스타일 주입 (화풍 믹서 위저드 스텝퍼 및 실시간 하이라이팅 포함)
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    /* ── 비주얼 믹서 전용 변수 매핑 (base.css 토큰으로 정규화) ── */
    :root {
      --surface-1:         var(--surface);
      --surface-2:         var(--surface-alt);
      --surface-3:         var(--line);
      --text-primary:      var(--ink);
      --text-secondary:    var(--ink-soft);
      --accent-faint:      var(--accent-soft);
      --accent-faint-active: var(--accent-strong);
      --accent-faint-alpha: var(--accent-soft);
    }

    .tab-pane.concept-mixer-page.active {
      display: flex;
      min-height: 0;
      overflow-y: auto;
    }
    .concept-mixer-page .concept-mixer-container {
      width: 100%;
      min-width: 0;
    }
    .mixer-workspace {
      display: grid;
      grid-template-columns: minmax(0, 1.45fr) minmax(360px, 0.75fr);
      gap: 18px;
      min-height: 520px;
      align-items: start;
    }
    .mixer-left {
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: var(--surface-1, #fff);
      border: 1px solid var(--line, #e5e7eb);
      border-radius: 14px;
      padding: 18px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
      min-width: 0;
      max-height: calc(100vh - 160px);
      overflow-y: auto;
      scrollbar-width: thin;
    }
    .mixer-right {
      display: flex;
      flex-direction: column;
      align-self: flex-start;
      position: sticky;
      top: 0;
      width: 100%;
      min-width: 0;
    }

    /* 위저드 스텝퍼 */
    .mixer-stepper {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      align-items: center;
      position: relative;
      background: var(--surface-2, #f8fafc);
      padding: 8px;
      border-radius: 12px;
      border: 1px solid var(--line, #e2e8f0);
      margin-bottom: 0;
      gap: 8px;
    }
    .mixer-step-tab {
      min-width: 0;
      border: 1px solid transparent;
      background: transparent;
      padding: 10px 12px;
      font-size: 13px;
      font-weight: 700;
      color: var(--text-secondary, #64748b);
      cursor: pointer;
      border-radius: 10px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: grid;
      grid-template-columns: 24px minmax(0, 1fr);
      align-items: center;
      gap: 9px;
      text-align: left;
    }
    .mixer-step-tab .step-num {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--surface-3, #cbd5e1);
      color: var(--text-secondary, #64748b);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 800;
      transition: all 0.2s;
    }
    .mixer-step-tab.active {
      color: var(--accent, #4361ee);
      border-color: var(--accent-faint, #c7d2fe);
      background: var(--surface-1, #fff);
      box-shadow: 0 3px 10px rgba(67, 97, 238, 0.08);
    }
    .mixer-step-tab.active .step-num {
      background: var(--accent, #4361ee);
      color: var(--on-accent, #ffffff);
      box-shadow: 0 0 0 4px rgba(67, 97, 238, 0.15);
    }
    .mixer-step-tab.completed {
      color: var(--accent-faint-active, #2563eb);
    }
    .mixer-step-tab.completed .step-num {
      background: var(--accent-faint, #e0e7ff);
      color: var(--accent, #4361ee);
      font-size: 10px;
    }
    .mixer-step-copy {
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: 3px;
    }
    .mixer-step-label {
      font-size: 12px;
      line-height: 1.2;
      color: inherit;
    }
    .mixer-step-current {
      overflow: hidden;
      color: var(--ink, #1a1f2b);
      font-size: 12.5px;
      font-weight: 800;
      line-height: 1.35;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .mixer-step-current.empty {
      color: var(--text-secondary, #94a3b8);
      font-weight: 600;
    }
    .hl-composition {
      color: #e65100;
      font-weight: 700;
    }
    .hl-lighting {
      color: #7b2cbf;
      font-weight: 700;
    }

    /* 미니 썸네일 카드 디자인 */
    .mixer-item-thumb {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      border-top-left-radius: 12px;
      border-top-right-radius: 12px;
      background: var(--surface-2, #f1f5f9);
    }
    .mixer-item-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .mixer-item-thumb-settings-btn {
      position: absolute;
      top: 6px;
      right: 6px;
      z-index: 5;
      background: rgba(15, 23, 42, 0.72);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 50%;
      color: white;
      width: 24px;
      height: 24px;
      font-size: 11px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
      transition: all 0.2s;
    }
    .mixer-item-thumb-settings-btn:hover {
      background: var(--accent, #4361ee);
      color: var(--on-accent, #ffffff);
      transform: scale(1.1);
    }
    .mixer-item-thumb-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.98);
      z-index: 10;
      display: flex;
      flex-direction: column;
      padding: 6px;
      box-sizing: border-box;
      border-top-left-radius: 12px;
      border-top-right-radius: 12px;
    }
    .mixer-item-thumb-overlay[hidden] {
      display: none !important;
    }
    [data-theme="dark"] .mixer-item-thumb-overlay {
      background: var(--surface-panel);
      color: var(--ink);
    }
    .overlay-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--line, #e2e8f0);
      padding-bottom: 3px;
      margin-bottom: 4px;
    }
    .overlay-header span {
      font-size: 10px;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
    }
    .overlay-close-btn {
      background: none;
      border: none;
      color: var(--text-secondary, #64748b);
      font-size: 14px;
      cursor: pointer;
      line-height: 1;
      padding: 0;
    }
    .overlay-close-btn:hover {
      color: var(--text-primary, #0f172a);
    }
    .overlay-btn {
      border: 1px solid var(--line, #cbd5e1);
      background: var(--surface-1, #fff);
      color: var(--text-primary, #334155);
      border-radius: 4px;
      transition: all 0.2s;
    }
    .overlay-btn:hover:not([disabled]) {
      background: var(--line, #f1f5f9);
      border-color: #94a3b8;
    }
    .overlay-btn[disabled] {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .overlay-btn.btn-apply {
      background: var(--status-success, #10b981);
      color: var(--on-status, #ffffff);
      border-color: var(--status-success, #10b981);
    }
    .overlay-btn.btn-apply:hover {
      background: var(--status-success, #059669);
      filter: brightness(.92);
    }
    [data-theme="dark"] .overlay-btn {
      border-color: var(--line-strong);
      background: var(--surface-soft);
      color: var(--ink);
    }
    [data-theme="dark"] .overlay-btn:hover:not([disabled]) {
      background: var(--line);
    }

    /* 실시간 선택 요약 바 */
    .mixer-summary-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--surface-2, #f8fafc);
      border: 1px dashed var(--accent-faint, #c7d2fe);
      border-radius: 10px;
      padding: 10px 16px;
      margin-bottom: 0;
      font-size: 13px;
      color: var(--ink, #1a1f2b);
      flex-wrap: wrap;
    }
    .mixer-summary-title {
      font-weight: 700;
      color: var(--accent, #4361ee);
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .mixer-summary-chips {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .mixer-summary-chip {
      background: var(--surface-1, #fff);
      border: 1px solid var(--line, #e2e8f0);
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 12px;
      font-weight: 600;
      color: var(--ink, #1a1f2b);
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 4px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    }
    .mixer-summary-chip span {
      color: var(--text-secondary, #64748b);
      font-weight: normal;
    }
    .mixer-summary-chip:hover {
      border-color: var(--accent, #4361ee);
      background: var(--accent-faint-alpha, #f0f4ff);
      color: var(--accent, #4361ee);
      transform: translateY(-1px);
    }
    .mixer-summary-chip.empty {
      color: var(--text-secondary, #94a3b8);
      border-style: dotted;
      background: transparent;
    }
    .mixer-summary-arrow {
      color: var(--text-secondary, #cbd5e1);
      font-size: 10px;
    }

    /* 단계별 컨테이너 */
    .mixer-step-pane {
      display: none;
      flex-direction: column;
      gap: 16px;
      animation: mixerSlideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .mixer-step-pane.active {
      display: flex;
    }
    @keyframes mixerSlideUp {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .mixer-section-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--ink, #1a1f2b);
      margin: 0 0 6px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .mixer-section-title span {
      background: var(--accent-faint, #e0e7ff);
      color: var(--accent, #4361ee);
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }
    .mixer-sub-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-secondary, #64748b);
      margin: 16px 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .mixer-sub-title::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--line, #e5e7eb);
    }

    /* 주제 분류 탭 */
    .mixer-cat-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      padding-bottom: 10px;
      margin-bottom: 4px;
      border-bottom: 1px solid var(--line, #e5e7eb);
    }
    .mixer-cat-btn {
      border: 1px solid var(--line, #e2e8f0);
      background: var(--surface-alt, #f8fafc);
      padding: 4px 11px;
      font-size: 12px;
      font-weight: 600;
      color: var(--ink-soft, #64748b);
      cursor: pointer;
      border-radius: 20px;
      transition: all 0.18s;
      white-space: nowrap;
      line-height: 1.5;
    }
    .mixer-cat-btn:hover {
      border-color: var(--accent, #4361ee);
      color: var(--accent, #4361ee);
      background: var(--accent-soft, rgba(67,97,238,0.07));
    }
    .mixer-cat-btn.active {
      background: var(--accent, #4361ee);
      color: var(--on-accent, #fff);
      border-color: var(--accent, #4361ee);
      font-weight: 700;
    }

    /* 그리드 형태 선택기 */
    .mixer-subj-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px;
      padding-right: 4px;
      align-items: start;
    }
    .mixer-med-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px;
      margin-bottom: 12px;
      align-items: start;
    }

    /* 아이템 카드 고도화 */
    .mixer-item-card {
      border: 1.5px solid var(--line, #e5e7eb);
      background: var(--surface-1, #fff);
      border-radius: 10px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      gap: 10px;
      position: relative;
      box-shadow: 0 1px 3px rgba(0,0,0,0.01);
      width: 100%;
      text-align: left;
      font-family: inherit;
      min-height: 156px;
    }
    .mixer-item-card:hover {
      border-color: var(--accent-faint, #c7d2fe);
      background: var(--surface-2, #f8fafc);
      transform: translateY(-1px);
      box-shadow: 0 6px 12px rgba(67, 97, 238, 0.04);
    }
    .mixer-item-card.active {
      border-color: var(--line-selected, var(--accent, #4361ee));
      background: var(--surface-2, #f8fafc);
      box-shadow: 0 8px 16px rgba(67, 97, 238, 0.06);
    }

    /* 선택 강조는 외곽선과 배경만 사용 */
    .mixer-item-card::after {
      content: '';
      display: none;
    }
    .mixer-item-card.active::after {
      content: '';
      display: none;
    }
    .mixer-item-card:focus-visible,
    .mixer-cat-btn:focus-visible,
    .mixer-step-tab:focus-visible,
    .mixer-action-btn:focus-visible,
    .mixer-nav-btn:focus-visible,
    .mixer-utility-btn:focus-visible,
    .mixer-prompt-details summary:focus-visible,
    .mixer-settings summary:focus-visible {
      outline: 3px solid rgba(67, 97, 238, 0.24);
      outline-offset: 2px;
    }

    .mixer-item-head {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 14px;
      font-weight: 700;
      color: var(--ink, #1a1f2b);
      line-height: 1.45;
      min-height: 42px;
    }
    .mixer-item-desc {
      font-size: 12.5px;
      color: var(--text-secondary, #64748b);
      line-height: 1.55;
      margin: 2px 0 0 0;
      flex: 1 1 auto;
      min-height: 60px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* 카드 내 하단 미리보기 영역 (일관되게 렌더링) */
    .mixer-med-preview-area {
      display: none;
      width: 100%;
      margin-top: 10px;
      border-top: 1px dashed var(--line, #e2e8f0);
      padding-top: 10px;
      animation: mixerFadeIn 0.2s ease-in-out;
    }
    .mixer-item-card.active .mixer-med-preview-area {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .mixer-med-preview-img {
      width: 100%;
      height: 90px;
      border-radius: 8px;
      background: #f8fafc;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--line, #e2e8f0);
    }
    .mixer-med-preview-title {
      font-size: 10px;
      font-weight: 700;
      color: var(--ink, #1a1f2b);
      text-align: center;
      line-height: 1.35;
    }
    .mixer-med-preview-meta {
      font-size: 9px;
      color: var(--text-secondary, #64748b);
      text-align: center;
      font-family: monospace;
      background: var(--surface-2, #f1f5f9);
      padding: 2px 4px;
      border-radius: 4px;
      word-break: break-all;
    }

    /* 실시간 이미지 프리뷰 상자 */
    .mixer-preview-image-box {
      width: 100%;
      aspect-ratio: 1 / 1;
      margin: 12px 0;
      border-radius: 12px;
      border: 1.5px dashed var(--line, #cbd5e1);
      background: var(--surface-2, #f8fafc);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
      transition: all 0.3s ease;
      cursor: pointer;
    }
    .mixer-preview-image-box.has-image {
      border-style: solid;
      border-color: var(--accent-faint, #c7d2fe);
      box-shadow: 0 4px 12px rgba(67, 97, 238, 0.04);
    }
    .mixer-preview-image-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .mixer-preview-image-box.has-image:hover img {
      transform: scale(1.03);
    }
    .mixer-preview-image-placeholder {
      font-size: 11px;
      color: var(--text-secondary, #94a3b8);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      text-align: center;
      padding: 20px;
    }
    .mixer-preview-image-placeholder .placeholder-icon {
      font-size: 24px;
      opacity: 0.6;
    }

    /* 로딩 스켈레톤 애니메이션 */
    .mixer-preview-image-box.loading {
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: mixerSkeleton 1.5s infinite;
      cursor: wait;
      border-style: solid;
      border-color: var(--line, #cbd5e1);
    }
    @keyframes mixerSkeleton {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .mixer-preview-image-box.loading::after {
      content: '⚡ 이미지 생성 중...';
      position: absolute;
      font-size: 11px;
      font-weight: 700;
      color: var(--accent, #4361ee);
      background: rgba(255,255,255,0.85);
      padding: 6px 12px;
      border-radius: 20px;
      border: 1px solid var(--accent-faint, #c7d2fe);
      box-shadow: 0 2px 8px rgba(67, 97, 238, 0.1);
    }

    /* 이미지 생성 액션 버튼 */
    .mixer-action-btn.generate {
      background: linear-gradient(135deg, var(--accent, #4361ee), var(--accent-strong, #3f37c9));
      color: var(--on-accent, #ffffff);
      border-color: var(--accent, #4361ee);
      box-shadow: 0 2px 6px rgba(67, 97, 238, 0.2);
    }
    .mixer-action-btn.generate:hover:not(:disabled) {
      background: linear-gradient(135deg, var(--accent-strong, #3a54d6), var(--accent, #322baf));
      box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
    }

    /* 모달 라이트박스(Lightbox) */
    .mixer-lightbox {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(10, 10, 16, 0.85);
      backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      cursor: zoom-out;
    }
    .mixer-lightbox.visible {
      opacity: 1;
      visibility: visible;
    }
    .mixer-lightbox-content {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      cursor: default;
    }
    .mixer-lightbox-img {
      max-width: 100%;
      max-height: 80vh;
      border-radius: 12px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      border: 2px solid rgba(255,255,255,0.1);
      object-fit: contain;
    }
    .mixer-lightbox-close {
      position: absolute;
      top: -40px;
      right: 0;
      background: transparent;
      border: 0;
      color: #fff;
      font-size: 28px;
      cursor: pointer;
      opacity: 0.8;
      transition: opacity 0.2s;
    }
    .mixer-lightbox-close:hover {
      opacity: 1;
    }
    .mixer-lightbox-title {
      color: #ffffff;
      font-size: 13px;
      font-weight: 600;
      text-align: center;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
      background: rgba(255,255,255,0.1);
      padding: 6px 14px;
      border-radius: 20px;
    }

    @keyframes mixerFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    }
    @keyframes mixerSkeleton {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .mixer-preview-image-box.loading::after {
      content: '⚡ 이미지 생성 중...';
      position: absolute;
      font-size: 11px;
      font-weight: 700;
      color: var(--accent, #4361ee);
      background: rgba(255,255,255,0.85);
      padding: 6px 12px;
      border-radius: 20px;
      border: 1px solid var(--accent-faint, #c7d2fe);
      box-shadow: 0 2px 8px rgba(67, 97, 238, 0.1);
    }

    /* 이미지 생성 액션 버튼 */
    .mixer-action-btn.generate {
      background: linear-gradient(135deg, var(--accent, #4361ee), var(--accent-strong, #3f37c9));
      color: var(--on-accent, #ffffff);
      border-color: var(--accent, #4361ee);
      box-shadow: 0 2px 6px rgba(67, 97, 238, 0.2);
    }
    .mixer-action-btn.generate:hover:not(:disabled) {
      background: linear-gradient(135deg, var(--accent-strong, #3a54d6), var(--accent, #322baf));
      box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
    }

    /* 모달 라이트박스(Lightbox) */
    .mixer-lightbox {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(10, 10, 16, 0.85);
      backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      cursor: zoom-out;
    }
    .mixer-lightbox.visible {
      opacity: 1;
      visibility: visible;
    }
    .mixer-lightbox-content {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      cursor: default;
    }
    .mixer-lightbox-img {
      max-width: 100%;
      max-height: 80vh;
      border-radius: 12px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      border: 2px solid rgba(255,255,255,0.1);
      object-fit: contain;
    }
    .mixer-lightbox-close {
      position: absolute;
      top: -40px;
      right: 0;
      background: transparent;
      border: 0;
      color: #fff;
      font-size: 28px;
      cursor: pointer;
      opacity: 0.8;
      transition: opacity 0.2s;
    }
    .mixer-lightbox-close:hover {
      opacity: 1;
    }
    .mixer-lightbox-title {
      color: #ffffff;
      font-size: 13px;
      font-weight: 600;
      text-align: center;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
      background: rgba(255,255,255,0.1);
      padding: 6px 14px;
      border-radius: 20px;
    }

    @keyframes mixerFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .mixer-sub-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-secondary, #64748b);
      margin: 16px 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .mixer-sub-title::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--line, #e5e7eb);
    }

    /* 주제 분류 탭 */
    .mixer-cat-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      padding-bottom: 10px;
      margin-bottom: 4px;
      border-bottom: 1px solid var(--line, #e5e7eb);
    }
    .mixer-cat-btn {
      border: 1px solid var(--line, #e2e8f0);
      background: var(--surface-alt, #f8fafc);
      padding: 4px 11px;
      font-size: 11px;
      font-weight: 600;
      color: var(--ink-soft, #64748b);
      cursor: pointer;
      border-radius: 20px;
      transition: all 0.18s;
      white-space: nowrap;
      line-height: 1.5;
    }
    .mixer-cat-btn:hover {
      border-color: var(--accent, #4361ee);
      color: var(--accent, #4361ee);
      background: var(--accent-soft, rgba(67,97,238,0.07));
    }
    .mixer-cat-btn.active {
      background: var(--accent, #4361ee);
      color: var(--on-accent, #fff);
      border-color: var(--accent, #4361ee);
      font-weight: 700;
    }

    /* 그리드 형태 선택기 */
    .mixer-subj-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px;
      padding-right: 4px;
    }
    .mixer-med-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 12px;
      margin-bottom: 12px;
    }

    /* 아이템 카드 고도화 */
    .mixer-item-card {
      border: 1.5px solid var(--line, #e5e7eb);
      background: var(--surface-1, #fff);
      border-radius: 10px;
      padding: 14px;
      min-height: 164px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
      box-shadow: 0 1px 3px rgba(0,0,0,0.01);
    }
    .mixer-item-card:hover {
      border-color: var(--accent-faint, #c7d2fe);
      background: var(--surface-2, #f8fafc);
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(67, 97, 238, 0.04);
    }
    .mixer-item-card.active {
      border-color: var(--line-selected, var(--accent, #4361ee));
      background: var(--surface-2, #f8fafc);
      box-shadow: 0 8px 16px rgba(67, 97, 238, 0.06);
    }

    /* 선택 체크마크 뱃지 */
    .mixer-item-card::after {
      content: '✓';
      position: absolute;
      top: 10px;
      right: 10px;
      width: 18px;
      height: 18px;
      background: var(--accent, #4361ee);
      color: var(--on-accent, #ffffff);
      border-radius: 50%;
      font-size: 10px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transform: scale(0.6);
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .mixer-item-card.active::after {
      opacity: 1;
      transform: scale(1);
    }

    .mixer-item-head {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      font-weight: 700;
      color: var(--ink, #1a1f2b);
    }
    .mixer-item-desc {
      font-size: 11px;
      color: var(--text-secondary, #64748b);
      line-height: 1.45;
      margin: 2px 0 0 0;
    }

    /* 팔레트 그룹 그리드 */
    .mixer-palettes-group-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 30px 16px;
      padding-right: 4px;
    }
    .mixer-palette-group-block {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .mixer-palette-dots {
      display: flex;
      gap: 5px;
      margin: 6px 0;
      justify-content: flex-start;
    }
    .mixer-palette-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 1px solid rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    .mixer-item-card:hover .mixer-palette-dot {
      transform: scale(1.15);
    }

    /* 필터 바 묶음 — 2열 그리드 (레이블 | 컨테이너) */
    .mixer-pal-filters-row {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 6px 10px;
      align-items: center;
      margin-bottom: 14px;
    }

    .mixer-pal-filters-layout {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 14px;
    }

    .mixer-pal-filter-combo {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      flex-wrap: wrap;
    }

    .mixer-pal-filter-inline-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--ink-soft, #64748b);
      white-space: nowrap;
    }

    /* 그룹 래퍼는 레이아웃에서 투명하게 — 자식이 직접 그리드 셀이 됨 */
    .mixer-pal-filter-group {
      display: contents;
    }

    /* 필터 레이블 */
    .mixer-pal-filter-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--ink-soft, #64748b);
      text-align: right;
      white-space: nowrap;
      letter-spacing: 0.01em;
    }

    /* 팔레트 필터 탭 컨테이너 (3개 행 공통) */
    .mixer-pal-filter-tabs {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
      background: var(--surface-2, #f1f5f9);
      padding: 4px;
      border-radius: 8px;
      border: 1px solid var(--line, #e2e8f0);
    }

    .mixer-pal-filter-btn {
      border: 1px solid transparent;
      background: transparent;
      padding: 5px 11px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary, #64748b);
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    }
    .mixer-pal-filter-btn.active {
      background: var(--surface-1, #ffffff);
      color: var(--accent, #4361ee);
      border-color: var(--line-selected, #8f8f8f);
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
      font-weight: 700;
    }

    /* 색상 스와치 컨테이너 — mixer-pal-filter-tabs 공통 스타일 상속 */
    .mixer-pal-color-filter {
      gap: 5px;
      padding: 3px;
    }
    .mixer-pal-color-btn {
      border: 2px solid transparent;
      border-radius: 50%;
      width: 22px;
      height: 22px;
      cursor: pointer;
      padding: 0;
      background: var(--swatch, #ccc);
      transition: transform 0.15s, border-color 0.15s;
      position: relative;
    }
    .mixer-pal-color-btn[data-pal-color="all"] {
      width: auto;
      height: 22px;
      border-radius: 11px;
      padding: 0 9px;
      background: var(--surface-alt, #f1f5f9);
      border-color: var(--line, #e2e8f0);
      font-size: 10px;
      font-weight: 600;
      color: var(--ink-soft, #64748b);
    }
    .mixer-pal-color-btn[data-pal-color="all"].active {
      background: var(--accent, #4361ee);
      color: var(--on-accent, #fff);
      border-color: var(--accent, #4361ee);
    }
    .mixer-pal-color-btn:not([data-pal-color="all"]):hover {
      transform: scale(1.18);
    }
    .mixer-pal-color-btn:not([data-pal-color="all"]).active {
      border-color: var(--ink, #132238);
      transform: scale(1.12);
      box-shadow: 0 0 0 2px var(--surface, #fff), 0 0 0 4px var(--ink, #132238);
    }

    @media (max-width: 980px) {
      .mixer-pal-filter-combo {
        align-items: flex-start;
      }
    }

    /* 팔레트 모드 뱃지 */
    .mixer-palette-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 3px;
      z-index: 5;
    }
    .mixer-palette-badge + .mixer-item-head {
      padding-right: 64px;
    }
    .mixer-palette-badge.light {
      background: #fff9db;
      color: #f08c00;
      border: 1px solid #ffe3e3;
    }
    .mixer-palette-badge.dark {
      background: #e7f5ff;
      color: #1c7ed6;
      border: 1px solid #d0ebff;
    }
    /* 화풍 미리보기 미니 팝업 (데스크톱) */
    .mixer-med-popup {
      position: absolute;
      bottom: 115%;
      left: 50%;
      transform: translateX(-50%) translateY(8px);
      width: 190px;
      background: var(--surface-1, #ffffff);
      border: 1.5px solid var(--accent, #4361ee);
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(67, 97, 238, 0.15);
      padding: 8px;
      z-index: 150;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .mixer-item-card.active .mixer-med-popup {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0);
    }
    .mixer-med-popup::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: var(--accent, #4361ee);
    }
    .mixer-med-popup-img {
      width: 100%;
      height: 100px;
      border-radius: 8px;
      background: #f8fafc;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--line, #e2e8f0);
    }
    .mixer-med-popup-title {
      font-size: 10px;
      font-weight: 700;
      color: var(--ink, #1a1f2b);
      text-align: center;
      line-height: 1.3;
    }
    .mixer-med-popup-meta {
      font-size: 9px;
      color: var(--text-secondary, #64748b);
      text-align: center;
      font-family: monospace;
      background: var(--surface-2, #f1f5f9);
      padding: 2px 4px;
      border-radius: 4px;
      word-break: break-all;
    }

    /* 모바일 아코디언 미리보기 영역 */
    .mixer-med-mobile-preview {
      display: none;
      width: 100%;
      margin-top: 8px;
      border-top: 1px dashed var(--line, #e2e8f0);
      padding-top: 8px;
      animation: mixerFadeIn 0.2s ease-in-out;
    }
    .mixer-item-card.active .mixer-med-mobile-preview {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .mixer-med-mobile-img {
      width: 100%;
      height: 80px;
      border-radius: 6px;
      background: #f8fafc;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--line, #e2e8f0);
    }

    @keyframes mixerFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* 위저드 내비게이션 바 */
    .mixer-wizard-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 16px;
      border-top: 1px solid var(--line, #e5e7eb);
    }
    .mixer-nav-btn {
      border: 1px solid var(--line, #cbd5e1);
      background: var(--surface-1, #fff);
      border-radius: 8px;
      padding: 9px 18px;
      font-size: 12px;
      font-weight: 700;
      color: var(--ink, #1a1f2b);
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .mixer-nav-btn:hover:not(:disabled) {
      background: var(--surface-2, #f1f5f9);
      border-color: var(--text-secondary, #94a3b8);
    }
    .mixer-nav-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .mixer-nav-btn.next {
      background: var(--accent, #4361ee);
      color: var(--on-accent, #ffffff);
      border-color: var(--accent, #4361ee);
      box-shadow: 0 2px 4px rgba(67, 97, 238, 0.15);
    }
    .mixer-nav-btn.next:hover:not(:disabled) {
      background: var(--accent-strong, #304fd0);
      box-shadow: 0 4px 8px rgba(67, 97, 238, 0.25);
    }


    /* 구도 & 리터칭 전용 가변 높이 및 설명글 전체 노출 스타일 */
    #mixerCompositionGrid,
    #mixerTypographyGrid {
      grid-auto-rows: minmax(146px, auto);
    }
    #mixerCompositionGrid .mixer-item,
    #mixerTypographyGrid .mixer-item {
      display: flex;
      flex-direction: column;
      background: var(--surface-1, #ffffff);
      border: 1px solid var(--line, #e2e8f0);
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 5px rgba(0,0,0,0.03);
    }
    #mixerCompositionGrid .mixer-item.active,
    #mixerTypographyGrid .mixer-item.active {
      border-color: var(--accent, #4361ee);
      box-shadow: 0 4px 12px rgba(67, 97, 238, 0.12);
    }
    #mixerCompositionGrid .mixer-item .mixer-item-desc,
    #mixerTypographyGrid .mixer-item .mixer-item-desc {
      display: block;
      overflow: visible;
      -webkit-line-clamp: unset;
      font-size: 11.5px;
      line-height: 1.45;
    }
    /* 미리보기 카드 */
    .mixer-preview-card {
      width: 100%;
      border: 1px solid var(--line, #e2e8f0);
      border-radius: 14px;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
      transition: box-shadow 0.25s ease;
      animation: mixerPreviewFadeIn 0.3s ease-out;
    }

    @keyframes mixerPreviewFadeIn {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* 미리보기 카드 hover: 위치 이동/색 변동 없이 그림자만 강화 */
    .mixer-preview-card:hover {
      box-shadow: 0 14px 34px rgba(0, 0, 0, 0.08);
    }

    /* 색상 테마 비율 바 (Palette Weight Bar) */
    .mixer-palette-weight-bar {
      display: flex;
      width: 100%;
      height: 14px;
      border-radius: 999px;
      overflow: hidden;
      margin-bottom: 8px;
      border: 1px solid var(--line, #e2e8f0);
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.06);
    }
    .mixer-palette-weight-segment {
      height: 100%;
      transition: width 0.3s ease;
    }
    .mixer-palette-weight-labels {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-secondary, #64748b);
      margin-top: 4px;
      padding: 0 4px;
    }

    /* 흐르는 그래디언트 애니메이션 */
    .mixer-preview-header {
      padding: 7px 12px;
      color: white;
      display: flex;
      flex-direction: column;
      gap: 4px;
      position: relative;
    }
    /* 팔레트 색에 관계없이 흰 글씨 가독성 보장하는 스크림 */
    .mixer-preview-header::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(0,0,0,0.32), rgba(0,0,0,0.14));
      pointer-events: none;
    }
    .mixer-preview-header > * {
      position: relative;
      z-index: 1;
    }
    .mixer-preview-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 14px;
    }
    .mixer-preview-meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }
    .mixer-preview-meta-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      opacity: 0.75;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
      flex-shrink: 0;
    }
    .mixer-preview-meta-value {
      font-size: 13px;
      font-weight: 700;
      text-shadow: 0 1px 3px rgba(0,0,0,0.25);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .mixer-preview-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-top: 3px;
      border-top: 1px solid rgba(255,255,255,0.2);
    }
    .mixer-preview-code {
      font-size: 9px;
      font-family: monospace;
      opacity: 0.8;
      letter-spacing: 0.03em;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .mixer-preview-palette {
      font-size: 10.5px;
      font-weight: 600;
      opacity: 0.9;
      text-shadow: 0 1px 2px rgba(0,0,0,0.15);
      flex-shrink: 0;
      white-space: nowrap;
    }
    .mixer-preview-body {
      padding: 10px 14px 14px;
      display: flex;
      flex-direction: column;
      gap: 9px;
    }
    .mixer-preview-desc {
      font-size: 13px;
      color: var(--text-secondary, #64748b);
      line-height: 1.55;
      margin: 0;
    }
    .mixer-preview-prompt-box {
      background: var(--surface-2, #f8fafc);
      border: 1px solid var(--line, #e2e8f0);
      border-radius: 10px;
      padding: 14px;
      font-size: 12.5px;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      line-height: 1.6;
      color: var(--ink, #1a1f2b);
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 160px;
      overflow-y: auto;
      margin: 0;
    }

    /* 프롬프트 조립 하이라이트 */
    .hl-medium {
      background: rgba(67, 97, 238, 0.06);
      color: var(--accent, #4361ee);
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      border: 1px solid rgba(67, 97, 238, 0.12);
    }
    .hl-subj {
      background: rgba(16, 185, 129, 0.06);
      color: #10b981;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      border: 1px solid rgba(16, 185, 129, 0.12);
    }
    .hl-palette {
      background: rgba(245, 158, 11, 0.06);
      color: #d97706;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      border: 1px solid rgba(245, 158, 11, 0.12);
    }

    .mixer-custom-subject-row {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      padding: 8px 0;
      border-top: 1px solid var(--line, #dbe2ea);
    }
    .mixer-custom-subject-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--ink, #1a1f2b);
      white-space: nowrap;
    }
    .mixer-custom-mode-toggle {
      display: flex;
      border: 1px solid var(--line-strong, #d0d8e4);
      border-radius: 6px;
      overflow: hidden;
      flex-shrink: 0;
    }
    .mixer-custom-mode-btn {
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 600;
      border: none;
      border-radius: 0;
      background: transparent;
      color: var(--ink-soft, #64748b);
      cursor: pointer;
      white-space: nowrap;
    }
    .mixer-custom-mode-btn + .mixer-custom-mode-btn {
      border-left: 1px solid var(--line-strong, #d0d8e4);
    }
    .mixer-custom-mode-btn.active {
      background: var(--accent, #4361ee);
      color: var(--on-accent, #fff);
    }
    .mixer-custom-mode-btn:not(.active):hover {
      background: var(--surface-alt, #e8edf4);
    }
    .mixer-custom-subject-input {
      flex: 1;
      border: 1px solid var(--line-strong, #d0d8e4);
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 13px;
      background: var(--surface, #fff);
      color: var(--ink, #1a1f2b);
      outline: none;
      min-width: 0;
    }
    .mixer-custom-subject-input:focus {
      border-color: var(--accent, #4361ee);
      box-shadow: 0 0 0 2px rgba(67,97,238,0.12);
    }
    .mixer-custom-subject-apply,
    .mixer-custom-subject-clear {
      border: 1px solid var(--line-strong, #d0d8e4);
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }
    .mixer-custom-subject-apply {
      background: var(--accent, #4361ee);
      color: var(--on-accent, #fff);
      border-color: var(--accent, #4361ee);
    }
    .mixer-custom-subject-apply:hover { opacity: 0.88; }
    .mixer-custom-subject-clear {
      background: transparent;
      color: var(--ink-soft, #64748b);
    }
    .mixer-custom-subject-clear:hover:not(:disabled) { background: var(--surface-alt, #e8edf4); }
    .mixer-custom-subject-clear:disabled { opacity: 0.38; cursor: default; }
    .mixer-custom-subject-preview {
      font-size: 12px;
      color: #10b981;
      padding: 0 4px;
    }
    .mixer-custom-subject-preview em {
      font-style: normal;
      font-weight: 600;
    }

    .mixer-preview-actions {
      display: flex;
      gap: 8px;
    }
    .mixer-action-btn {
      flex: 1;
      border: 1px solid var(--line-control, #707070);
      border-radius: 8px;
      padding: 11px 0;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
    }
    .mixer-action-btn.copy {
      background: var(--surface-3, #e2e8f0);
      color: var(--ink, #1a1f2b);
    }
    .mixer-action-btn.copy:hover {
      background: var(--line, #cbd5e1);
      transform: translateY(-1px);
    }
    .mixer-action-btn.apply {
      background: var(--accent, #4361ee);
      color: var(--on-accent, #ffffff);
      box-shadow: 0 2px 4px rgba(67, 97, 238, 0.15);
    }
    .mixer-action-btn.apply:hover {
      background: var(--accent-strong, #304fd0);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(67, 97, 238, 0.25);
    }
    .mixer-action-btn.slidedoc {
      background: #0f766e;
      color: white;
      box-shadow: 0 2px 4px rgba(15, 118, 110, 0.15);
    }
    .mixer-action-btn.slidedoc:hover {
      background: #0d6660;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(15, 118, 110, 0.25);
    }
    .mixer-feedback {
      text-align: center;
      font-size: 12px;
      color: var(--accent, #4361ee);
      height: 16px;
      margin-top: -6px;
      font-weight: 600;
      visibility: hidden;
    }
    .mixer-feedback.visible {
      visibility: visible;
    }

    .mixer-toolbar {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 10px;
    }
    .mixer-toolbar-copy h3 {
      font-size: 18px;
      font-weight: 800;
      color: var(--ink, #1a1f2b);
      margin: 0 0 4px;
    }
    .mixer-toolbar-copy p {
      font-size: 13px;
      line-height: 1.5;
      color: var(--text-secondary, #64748b);
      margin: 0;
    }
    .mixer-toolbar-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      justify-content: flex-end;
      margin-left: auto;
    }
    #btnScrollToPreview {
      display: none;
    }
    .mixer-utility-btn,
    .mixer-settings summary {
      min-height: 34px;
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 8px;
      padding: 7px 10px;
      background: var(--surface-1, #fff);
      color: var(--ink, #1a1f2b);
      font: 700 12px/1.2 inherit;
      cursor: pointer;
      list-style: none;
      white-space: nowrap;
    }
    .mixer-utility-btn:hover,
    .mixer-settings summary:hover {
      border-color: var(--accent, #4361ee);
      color: var(--accent, #4361ee);
    }
    .mixer-utility-btn.primary {
      color: var(--accent, #4361ee);
      background: var(--accent-faint-alpha, #f0f4ff);
      border-color: var(--accent-faint, #c7d2fe);
    }
    .mixer-hidden-proxy {
      position: absolute !important;
      left: -9999px !important;
      top: -9999px !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
    }
    .mixer-settings {
      position: relative;
    }
    .mixer-settings summary::-webkit-details-marker { display: none; }
    .mixer-settings-panel {
      position: absolute;
      z-index: 20;
      top: calc(100% + 7px);
      right: 0;
      width: min(360px, calc(100vw - 36px));
      padding: 12px;
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 10px;
      background: var(--surface-1, #fff);
      box-shadow: 0 14px 34px rgba(15, 23, 42, 0.14);
    }
    .mixer-settings-label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      color: var(--ink, #1a1f2b);
      margin-bottom: 7px;
    }
    .mixer-settings-row,
    .mixer-search-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .mixer-settings-input,
    .mixer-search-input {
      width: 100%;
      min-width: 0;
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 8px;
      background: var(--surface-1, #fff);
      color: var(--ink, #1a1f2b);
      outline: none;
      font: 500 13px/1.3 inherit;
    }
    .mixer-settings-input { padding: 8px 9px; }
    .mixer-search-input { padding: 9px 11px; }
    .mixer-settings-input:focus,
    .mixer-search-input:focus {
      border-color: var(--accent, #4361ee);
      box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
    }
    .mixer-search-empty {
      display: none;
      padding: 24px;
      text-align: center;
      color: var(--text-secondary, #64748b);
      font-size: 13px;
    }
    /* 검색 인풋 행 */
    .mixer-search-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    .mixer-search-bar .mixer-search-input {
      flex: 1 1 260px;
      min-width: 180px;
      padding: 8px 10px;
      font-size: 13px;
    }
    .mixer-search-clear {
      flex-shrink: 0;
      background: none;
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 7px;
      color: var(--text-secondary, #64748b);
      font-size: 12px;
      padding: 6px 10px;
      cursor: pointer;
      white-space: nowrap;
    }
    .mixer-search-clear:hover { background: var(--surface-2, #f3f6fa); }
    .mixer-quick-add-btn {
      flex-shrink: 0;
      background: var(--accent, #4361ee);
      border: none;
      border-radius: 7px;
      color: var(--on-accent, #fff);
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      cursor: pointer;
      white-space: nowrap;
    }
    .mixer-quick-add-btn:hover { background: var(--accent-strong, #3451d1); }
    .mixer-subject-wizard-btn {
      flex-shrink: 0;
      background: var(--surface-2, #f3f6fa);
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 7px;
      color: var(--text-secondary, #64748b);
      font-size: 12px;
      font-weight: 700;
      padding: 6px 10px;
      cursor: pointer;
      white-space: nowrap;
    }
    .mixer-subject-wizard-btn:hover {
      border-color: rgba(67, 97, 238, 0.32);
      color: var(--accent, #4361ee);
      background: rgba(67, 97, 238, 0.05);
    }
    .mixer-subject-wizard-modal {
      width: min(1040px, calc(100vw - 24px)) !important;
      max-width: min(1040px, calc(100vw - 24px)) !important;
      max-height: min(820px, calc(100vh - 24px));
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 0 !important;
    }
    .mixer-subject-wizard-modal .mixer-custom-modal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--line, #dbe2ea);
      flex-shrink: 0;
    }
    .mixer-subject-wizard-modal .mixer-custom-modal-head h3 {
      margin: 0;
      font-size: 16px;
      line-height: 1.2;
    }
    .mixer-subject-wizard-modal .mixer-modal-close {
      width: 30px;
      height: 30px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 8px;
      background: var(--surface-1, #fff);
      color: var(--text-secondary, #64748b);
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      flex-shrink: 0;
    }
    .mixer-subject-wizard-modal .mixer-modal-close:hover {
      background: var(--surface-2, #f3f6fa);
      color: var(--ink, #1a1f2b);
    }
    .mixer-subject-wizard-body {
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(300px, 0.95fr);
      gap: 14px;
      overflow-y: auto;
      padding: 14px;
    }
    .mixer-wizard-section {
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 10px;
      padding: 12px;
      background: var(--surface-1, #fff);
    }
    .mixer-wizard-section h4 {
      margin: 0 0 9px;
      font-size: 13px;
      color: var(--ink, #1a1f2b);
    }
    .mixer-wizard-choice-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
      gap: 7px;
    }
    .mixer-wizard-choice {
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 8px;
      background: var(--surface-2, #f8fafc);
      color: var(--ink, #1a1f2b);
      cursor: pointer;
      padding: 8px 9px;
      text-align: left;
      font-size: 12px;
      font-weight: 700;
    }
    .mixer-wizard-choice.active {
      border-color: var(--accent, #4361ee);
      background: rgba(67, 97, 238, 0.08);
      color: var(--accent, #4361ee);
    }
    .mixer-wizard-preview {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 100%;
      min-width: 0;
    }
    .mixer-wizard-preview-card {
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 10px;
      background: var(--surface-2, #f8fafc);
      padding: 12px;
    }
    .mixer-wizard-preview-card strong {
      display: block;
      margin-bottom: 5px;
      font-size: 14px;
      color: var(--ink, #1a1f2b);
    }
    .mixer-wizard-preview-card p {
      margin: 0 0 8px;
      color: var(--text-secondary, #64748b);
      font-size: 12px;
      line-height: 1.55;
    }
    .mixer-wizard-combo {
      font-size: 11.5px;
      font-weight: 600;
      color: var(--accent, #4361ee);
      line-height: 1.6;
      word-break: keep-all;
    }
    .mixer-wizard-preview-card pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 11.5px;
      line-height: 1.55;
      color: var(--ink, #1a1f2b);
      background: var(--surface-1, #fff);
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 8px;
      padding: 9px;
      max-height: 240px;
      overflow-y: auto;
    }
    .mixer-wizard-prompt-ko {
      margin: 6px 0 0;
      font-size: 11.5px;
      line-height: 1.55;
      color: var(--text-secondary, #64748b);
      word-break: break-word;
    }
    .mixer-wizard-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 14px;
      border-top: 1px solid var(--line, #dbe2ea);
      background: var(--surface-1, #fff);
      flex-shrink: 0;
    }
    @media (max-width: 760px) {
      .mixer-subject-wizard-body {
        grid-template-columns: 1fr;
      }
      .mixer-subject-wizard-modal {
        width: calc(100vw - 18px) !important;
        max-width: calc(100vw - 18px) !important;
      }
    }
    .mixer-user-tab-btn {
      flex-shrink: 0;
      background: var(--surface-2, #f3f6fa);
      border: 1.5px solid var(--line, #dbe2ea);
      border-radius: 7px;
      color: var(--text-primary, #1a202c);
      font-size: 12px;
      font-weight: 600;
      padding: 6px 11px;
      cursor: pointer;
      white-space: nowrap;
      transition: border-color 0.15s, background 0.15s;
    }
    .mixer-user-tab-btn:hover { border-color: var(--accent, #4361ee); color: var(--accent, #4361ee); }
    .mixer-user-tab-btn.active { border-color: var(--accent, #4361ee); background: rgba(67,97,238,0.07); color: var(--accent, #4361ee); }
    .mixer-user-tab-count { font-size: 11px; font-weight: 700; margin-left: 3px; opacity: 0.7; }
    .mixer-user-back-btn {
      flex-shrink: 0;
      background: none;
      border: 1.5px solid var(--line, #dbe2ea);
      border-radius: 7px;
      color: var(--text-secondary, #64748b);
      font-size: 12px;
      font-weight: 600;
      padding: 5px 11px;
      cursor: pointer;
      white-space: nowrap;
      margin-right: 6px;
    }
    .mixer-user-back-btn:hover { border-color: var(--accent, #4361ee); color: var(--accent, #4361ee); background: rgba(67,97,238,0.05); }
    /* 사용자 커스텀 항목 카드 (편집/삭제 버튼 포함) */
    .mixer-item-card.user-custom {
      border-color: var(--accent, #4361ee);
      box-shadow: 0 0 0 1px rgba(67, 97, 238, 0.08);
      min-height: 156px;
      padding: 14px;
    }
    .mixer-item-desc {
      display: -webkit-box;
      min-height: calc(1.55em * 2);
      overflow: hidden;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
    .mixer-item-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 8px;
      padding-right: 56px;
    }
    .mixer-item-badge {
      display: inline-flex;
      align-items: center;
      min-height: 22px;
      padding: 0 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      line-height: 1;
      border: 1px solid transparent;
    }
    .mixer-item-badge.custom {
      color: var(--accent, #4361ee);
      background: rgba(67, 97, 238, 0.08);
      border-color: rgba(67, 97, 238, 0.16);
    }
    .mixer-item-badge.category {
      color: var(--ink, #1a1f2b);
      background: rgba(148, 163, 184, 0.12);
      border-color: rgba(148, 163, 184, 0.22);
    }
    .mixer-item-card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 5px;
      margin-top: auto;
      padding-top: 8px;
    }
    .mixer-item-card-actions button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      gap: 4px;
      min-width: 48px;
      height: 28px;
      padding: 0 8px;
      border-radius: 7px;
      border: 1px solid rgba(148, 163, 184, 0.34);
      background: transparent;
      cursor: pointer;
      color: var(--text-secondary, #64748b);
      line-height: 1;
      opacity: 0.68;
      transition: opacity 0.15s, background 0.15s, border-color 0.15s, color 0.15s;
    }
    .mixer-action-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 13px;
      height: 13px;
      font-size: 13px;
      line-height: 1;
      font-weight: 700;
      flex: 0 0 13px;
    }
    .mixer-action-label {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0;
      line-height: 1;
      white-space: nowrap;
    }
    .mixer-item-card-actions button:hover {
      opacity: 1;
      background: var(--surface-2, #f3f6fa);
      border-color: rgba(100, 116, 139, 0.42);
      color: var(--ink, #1a1f2b);
    }
    .mixer-item-card-actions .del-btn,
    .mixer-item-card-actions .danger {
      color: var(--text-secondary, #64748b);
      border-color: rgba(148, 163, 184, 0.34);
    }
    .mixer-item-card-actions .del-btn:hover,
    .mixer-item-card-actions .danger:hover {
      color: #dc2626;
      border-color: rgba(220, 38, 38, 0.32);
      background: rgba(254, 242, 242, 0.64);
    }
    .mixer-hidden-chip {
      flex-shrink: 0;
      background: none;
      border: 1.5px dashed #fca5a5;
      border-radius: 7px;
      color: #dc2626;
      font-size: 12px;
      font-weight: 600;
      padding: 5px 11px;
      cursor: pointer;
      white-space: nowrap;
    }
    .mixer-hidden-chip:hover { background: #fff1f2; }
    /* 빌트인 카드 일반 액션 버튼 */
    .mixer-item-card { position: relative; }
    .mixer-item-prompt { display: none; }
    .mixer-copy-btn,
    .mixer-admin-edit-btn {
      flex: 1;
      min-height: 34px;
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 8px;
      border: 1px solid var(--accent, #4361ee);
      background: var(--surface, #fff);
      color: var(--accent, #4361ee);
      cursor: pointer;
      white-space: nowrap;
      line-height: 1.2;
    }
    .mixer-item-card-actions .mixer-copy-btn,
    .mixer-item-card-actions .mixer-admin-edit-btn,
    .mixer-item-card-actions .mixer-builtin-del-btn {
      flex: 0 0 auto;
      min-height: 0;
      height: 28px;
      min-width: 48px;
      padding: 0 8px;
      font-size: inherit;
      line-height: 1;
      border-radius: 7px;
      border-color: var(--line-control, #707070);
      background: var(--surface-1, #ffffff);
      color: var(--text-secondary, #64748b);
    }
    .mixer-admin-edit-btn {
      border-color: var(--line-control, #707070);
      color: var(--ink, #1a1f2b);
      background: var(--surface-2, #f8fafc);
    }
    .mixer-copy-btn:hover,
    .mixer-admin-edit-btn:hover {
      background: var(--surface-2, #f8fafc);
    }

    .mixer-admin-preset-note {
      margin: -4px 0 10px;
      font-size: 12px;
      line-height: 1.5;
      color: var(--text-secondary, #64748b);
    }
    .mixer-admin-modal-head {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--line, #e2e8f0);
    }
    .mixer-admin-modal-head h3 {
      font-size: 17px;
    }
    .mixer-admin-inline-grid {
      display: grid;
      grid-template-columns: 90px minmax(0, 1fr);
      gap: 12px;
      align-items: end;
    }
    .mixer-admin-layout {
      display: flex;
      flex-direction: column;
      gap: 14px;
      min-height: 0;
    }
    .mixer-admin-row {
      display: grid;
      grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.95fr);
      gap: 14px;
      align-items: stretch;
    }
    .mixer-admin-stack {
      display: flex;
      flex-direction: column;
      gap: 14px;
      min-width: 0;
    }
    .mixer-admin-section {
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 14px;
      padding: 14px;
      background: var(--surface-1, #fff);
      min-width: 0;
    }
    .mixer-admin-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 10px;
    }
    .mixer-admin-section-title {
      margin: 0;
      font-size: 13px;
      font-weight: 800;
      color: var(--ink, #1a1f2b);
    }
    .mixer-admin-section-caption {
      margin: 0;
      font-size: 11.5px;
      color: var(--text-secondary, #64748b);
    }
    .mixer-admin-card {
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 14px;
      padding: 14px;
      background: linear-gradient(180deg, #f8fbff 0%, #f5f7fb 100%);
      min-width: 0;
    }
    .mixer-admin-card-title {
      margin: 0 0 10px;
      font-size: 12px;
      font-weight: 700;
      color: var(--ink, #1a1f2b);
    }
    .mixer-admin-helper {
      margin-top: 10px;
      font-size: 12px;
      line-height: 1.5;
      color: var(--text-secondary, #64748b);
    }
    .mixer-admin-filter-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      align-items: end;
    }
    .mixer-admin-emoji-input {
      text-align: center;
      font-size: 20px;
      padding-left: 0 !important;
      padding-right: 0 !important;
    }
    .mixer-admin-workspace {
      display: grid;
      grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
      gap: 14px;
      align-items: start;
    }
    .mixer-admin-translate-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 12px;
      background: var(--surface-2, #f8fafc);
    }
    .mixer-admin-translate-bar button {
      min-height: 34px;
      padding: 7px 12px;
      border-radius: 8px;
      border: 1px solid rgba(67, 97, 238, 0.28);
      background: var(--surface-1, #fff);
      color: var(--accent, #4361ee);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
    }
    .mixer-admin-translate-bar button:disabled {
      opacity: 0.6;
      cursor: wait;
    }
    .mixer-admin-translate-status {
      min-width: 0;
      color: var(--text-secondary, #64748b);
      font-size: 12px;
      line-height: 1.45;
      text-align: left;
    }
    .mixer-admin-prompt-note {
      margin: 0 0 10px;
      font-size: 11.5px;
      line-height: 1.5;
      color: var(--text-secondary, #64748b);
    }
    .mixer-custom-modal-actions .reset-btn {
      margin-right: auto;
      color: #dc2626;
      border-color: #fca5a5;
      background: #fff5f5;
    }
    /* 추가 버튼 카드 */
    .mixer-add-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 2px dashed var(--line, #dbe2ea);
      border-radius: 10px;
      padding: 18px 12px;
      cursor: pointer;
      background: none;
      color: var(--text-secondary, #64748b);
      font-size: 13px;
      transition: border-color 0.15s, background 0.15s;
      min-height: 142px;
    }
    .mixer-add-card strong {
      color: var(--ink, #1a1f2b);
      font-size: 14px;
    }
    .mixer-add-card small {
      max-width: 180px;
      color: var(--text-secondary, #64748b);
      font-size: 11.5px;
      line-height: 1.45;
      text-align: center;
    }
    .mixer-add-card:hover { border-color: var(--accent, #4361ee); background: var(--surface-2, #f3f6fa); color: var(--accent, #4361ee); }
    /* 사용자 커스텀 항목 추가/편집 모달 */
    .mixer-custom-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      z-index: 9000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .mixer-custom-modal {
      background: var(--surface-1, #fff);
      border-radius: 14px;
      padding: 24px;
      width: min(420px, 90vw);
      box-shadow: 0 8px 40px rgba(0,0,0,0.18);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .mixer-custom-modal h3 {
      margin: 0;
      font-size: 15px;
      color: var(--ink, #1a1f2b);
    }
    .mixer-custom-modal label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary, #64748b);
      display: block;
      margin-bottom: 4px;
    }
    .mixer-custom-modal input, .mixer-custom-modal textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 13px;
      font-family: inherit;
      background: var(--surface-1, #fff);
      color: var(--ink, #1a1f2b);
      outline: none;
    }
    .mixer-custom-modal select {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 13px;
      font-family: inherit;
      background: var(--surface-1, #fff);
      color: var(--ink, #1a1f2b);
      outline: none;
    }
    .mixer-custom-modal input:focus, .mixer-custom-modal textarea:focus {
      border-color: var(--accent, #4361ee);
      box-shadow: 0 0 0 3px rgba(67,97,238,0.1);
    }
    .mixer-custom-modal select:focus {
      border-color: var(--accent, #4361ee);
      box-shadow: 0 0 0 3px rgba(67,97,238,0.1);
    }
    .mixer-custom-modal textarea { resize: vertical; min-height: 60px; }
    .mixer-admin-preset-modal {
      width: min(1040px, calc(100vw - 24px));
      max-height: calc(100vh - 22px);
      padding: 18px 18px 16px;
      overflow-y: auto;
      gap: 14px;
    }
    .mixer-admin-preset-modal textarea {
      min-height: 84px;
      line-height: 1.5;
    }
    .mixer-admin-preset-modal #mapDescKo {
      min-height: 110px;
    }
    .mixer-admin-preset-modal #mapPrompt {
      min-height: 148px;
    }
    .mixer-admin-preset-modal #mapSuffix {
      min-height: 148px;
    }
    .mixer-admin-prompt-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      align-items: start;
    }
    .mixer-custom-modal-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      position: sticky;
      bottom: 0;
      padding-top: 10px;
      background: linear-gradient(to bottom, rgba(255,255,255,0), var(--surface-1, #fff) 32%);
    }
    .mixer-custom-modal-actions button {
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      border: 1px solid var(--line, #dbe2ea);
      background: var(--surface-2, #f3f6fa);
      color: var(--ink, #1a1f2b);
    }
    .mixer-custom-modal-actions .save-btn {
      background: var(--accent, #4361ee);
      color: var(--on-accent, #fff);
      border-color: var(--accent, #4361ee);
    }
    .mixer-custom-modal-actions .save-btn:hover { filter: brightness(1.08); }
    /* 화풍 커스텀 행 */
    .mixer-custom-medium-row {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--line, #dbe2ea);
    }
    .mixer-custom-medium-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--ink, #1a1f2b);
      white-space: nowrap;
    }
    .mixer-custom-medium-fields {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1 1 100%;
      width: 100%;
    }
    .mixer-custom-medium-field-row {
      display: grid;
      grid-template-columns: 56px minmax(0, 1fr);
      align-items: center;
      gap: 8px;
      width: 100%;
    }
    .mixer-custom-medium-field-label {
      font-size: 11px;
      color: var(--ink-soft, #64748b);
      white-space: nowrap;
      text-align: right;
    }
    .mixer-custom-medium-field-row .mixer-custom-subject-input {
      width: 100%;
    }
    .mixer-custom-medium-actions {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
    }
    .mixer-custom-medium-preview {
      font-size: 11px;
      color: var(--text-secondary, #64748b);
      margin-top: 2px;
      padding-left: 2px;
      width: 100%;
      font-style: italic;
    }
    @media (max-width: 640px) {
      .mixer-admin-workspace,
      .mixer-admin-row,
      .mixer-admin-filter-grid,
      .mixer-admin-prompt-grid {
        grid-template-columns: 1fr;
      }
      .mixer-admin-inline-grid {
        grid-template-columns: 1fr;
      }
      .mixer-admin-translate-bar {
        flex-direction: column;
        align-items: stretch;
      }
      .mixer-admin-translate-status {
        text-align: left;
      }
      .mixer-custom-medium-actions {
        margin-left: 0;
      }
      .mixer-custom-medium-field-row {
        grid-template-columns: 1fr;
        gap: 4px;
      }
      .mixer-custom-medium-field-label {
        text-align: left;
      }
    }
    /* 사용자 커스텀 서브카테고리 */
    .mixer-user-cat-row {
      display: flex;
      align-items: center;
      gap: 5px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }
    .mixer-user-cat-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 999px;
      border: 1px solid var(--line, #dbe2ea);
      background: var(--surface-2, #f3f6fa);
      color: var(--text-secondary, #64748b);
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
    }
    .mixer-user-cat-btn-main {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      min-width: 0;
    }
    .mixer-user-cat-meta {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .mixer-user-cat-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 6px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.14);
      color: inherit;
      font-size: 11px;
      font-weight: 700;
      line-height: 1;
    }
    .mixer-user-cat-btn.active {
      background: var(--accent, #4361ee);
      color: var(--on-accent, #fff);
      border-color: var(--accent, #4361ee);
    }
    .mixer-user-cat-btn.active .mixer-user-cat-count {
      background: rgba(255, 255, 255, 0.16);
    }
    .mixer-user-cat-add-btn {
      padding: 6px 10px;
      border-radius: 999px;
      border: 1.5px dashed var(--accent, #4361ee);
      background: none;
      color: var(--accent, #4361ee);
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
    }
    .mixer-user-cat-add-btn:hover { background: var(--surface-2, #f3f6fa); }
    .mixer-user-cat-panel {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      align-items: center;
      margin: 2px 0 10px;
      padding: 12px;
      border: 1px solid rgba(67, 97, 238, 0.16);
      border-radius: 12px;
      background: linear-gradient(180deg, rgba(67, 97, 238, 0.055), rgba(67, 97, 238, 0.025));
    }
    .mixer-user-cat-panel-title {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      color: var(--ink, #1a1f2b);
      font-size: 13px;
      font-weight: 800;
    }
    .mixer-user-cat-panel-title strong {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .mixer-user-cat-panel-sub {
      margin-top: 3px;
      color: var(--text-secondary, #64748b);
      font-size: 11.5px;
      line-height: 1.45;
    }
    .mixer-user-cat-panel-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .mixer-user-cat-panel-actions button {
      min-height: 32px;
      padding: 0 11px;
      border-radius: 8px;
      border: 1px solid var(--line, #dbe2ea);
      background: var(--surface-1, #fff);
      color: var(--ink, #1a1f2b);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
    }
    .mixer-user-cat-panel-actions button:hover {
      background: var(--surface-2, #f3f6fa);
    }
    .mixer-user-cat-panel-actions .primary {
      background: var(--accent, #4361ee);
      border-color: var(--accent, #4361ee);
      color: var(--on-accent, #fff);
    }
    .mixer-user-cat-panel-actions .danger {
      border-color: #fca5a5;
      color: #dc2626;
    }
    .mixer-custom-grid {
      grid-auto-rows: minmax(142px, auto) !important;
      align-items: stretch;
    }
    .mixer-preview-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .mixer-preview-label strong {
      font-size: 15px;
      color: var(--ink, #1a1f2b);
    }
    .mixer-preview-label span {
      font-size: 11px;
      font-weight: 700;
      color: #059669;
      background: #ecfdf5;
      border-radius: 999px;
      padding: 4px 8px;
    }
    .mixer-result-image {
      position: relative;
      aspect-ratio: 8 / 3;
      overflow: hidden;
      background: var(--surface-2, #f8fafc);
      display: flex;
      border-bottom: 1px solid var(--line, #e2e8f0);
    }
    .mixer-result-image-half {
      flex: 1;
      position: relative;
      overflow: hidden;
      height: 100%;
    }
    .mixer-result-image-half img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .mixer-half-settings-trigger {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 10;
      width: auto;
      min-width: 34px;
      height: 34px;
      padding: 0 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: rgba(15, 23, 42, 0.78);
      border: 1px solid rgba(255, 255, 255, 0.24);
      border-radius: 999px;
      color: #fff;
      cursor: pointer;
      font-size: 11px;
      font-weight: 700;
      backdrop-filter: blur(10px);
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.18);
      transition: background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
    }
    .mixer-half-settings-trigger:hover {
      background: var(--accent, #4361ee);
      color: var(--on-accent, #fff);
      transform: translateY(-1px);
      box-shadow: 0 8px 22px rgba(67, 97, 238, 0.3);
    }
    .mixer-half-settings-trigger:focus-visible,
    .mixer-image-overlay-panel button:focus-visible,
    .mixer-image-overlay-panel input:focus-visible {
      outline: 3px solid color-mix(in srgb, var(--accent, #4361ee) 28%, transparent);
      outline-offset: 2px;
    }
    .mixer-ui-icon {
      width: 16px;
      height: 16px;
      flex: 0 0 16px;
      display: block;
      stroke: currentColor;
    }
    .mixer-image-overlay-panel {
      width: auto;
      margin: 12px;
      background: var(--surface-1, #fff);
      color: var(--ink, #1a1f2b);
      display: none;
      flex-direction: column;
      box-sizing: border-box;
      font-size: 12px;
      border: 1px solid color-mix(in srgb, var(--line, #e2e8f0) 82%, var(--accent, #4361ee));
      border-radius: 14px;
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
      overflow: hidden;
    }
    [data-theme="dark"] .mixer-image-overlay-panel {
      background: var(--surface-panel);
      color: var(--ink);
      border-color: var(--line);
    }
    .mixer-image-overlay-panel.active {
      display: flex;
      animation: mixerPanelReveal 0.2s ease-out;
    }
    @keyframes mixerPanelReveal {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .mixer-image-overlay-panel .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--line, #e2e8f0);
      padding: 14px 16px;
      background: color-mix(in srgb, var(--surface-2, #f8fafc) 72%, var(--surface-1, #fff));
    }
    .mixer-image-overlay-panel .panel-header-main {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .mixer-image-overlay-panel .panel-header-icon {
      width: 32px;
      height: 32px;
      border-radius: 9px;
      display: grid;
      place-items: center;
      color: var(--accent, #4361ee);
      background: color-mix(in srgb, var(--accent, #4361ee) 10%, var(--surface-1, #fff));
      border: 1px solid color-mix(in srgb, var(--accent, #4361ee) 20%, transparent);
    }
    .mixer-image-overlay-panel .panel-header-copy {
      display: grid;
      gap: 2px;
      min-width: 0;
    }
    .mixer-image-overlay-panel .panel-header-copy strong {
      font-size: 13px;
      line-height: 1.3;
      color: var(--ink, #1a1f2b);
    }
    .mixer-image-overlay-panel .panel-header-copy small {
      font-size: 10.5px;
      line-height: 1.35;
      color: var(--text-secondary, #64748b);
      font-weight: 500;
    }
    .mixer-image-overlay-panel .panel-close-btn {
      background: var(--surface-1, #fff);
      border: 1px solid var(--line, #e2e8f0);
      cursor: pointer;
      color: var(--text-secondary, #64748b);
      width: 30px;
      height: 30px;
      padding: 0;
      border-radius: 8px;
      display: grid;
      place-items: center;
      flex: 0 0 30px;
    }
    .mixer-image-overlay-panel .panel-close-btn:hover {
      color: var(--ink, #1a1f2b);
      background: var(--surface-2, #f8fafc);
    }
    [data-theme="dark"] .mixer-image-overlay-panel .panel-close-btn:hover {
      color: var(--ink);
    }
    .mixer-image-overlay-panel .panel-body {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 15px 16px 16px;
    }
    .mixer-image-overlay-panel .panel-search-block,
    .mixer-image-overlay-panel .panel-action-section {
      display: grid;
      gap: 8px;
    }
    .mixer-image-overlay-panel .panel-field-label,
    .mixer-image-overlay-panel .panel-group-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
    }
    .mixer-image-overlay-panel .panel-field-label strong,
    .mixer-image-overlay-panel .panel-group-label {
      font-size: 11px;
      font-weight: 750;
      color: var(--ink, #1a1f2b);
    }
    .mixer-image-overlay-panel .panel-field-label span,
    .mixer-image-overlay-panel .panel-group-head span {
      font-size: 10px;
      color: var(--text-secondary, #64748b);
      text-align: right;
    }
    .mixer-image-overlay-panel .panel-keyword-row {
      display: flex;
      gap: 7px;
      align-items: center;
    }
    .mixer-image-overlay-panel .panel-keyword-row input {
      flex: 1;
      min-width: 0;
      min-height: 40px;
      padding: 8px 11px;
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 9px;
      background: var(--surface-1, #fff);
      color: var(--ink, #1a1f2b);
      font-size: 12.5px;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.16s ease, box-shadow 0.16s ease;
    }
    .mixer-image-overlay-panel .panel-keyword-row input:focus {
      border-color: var(--accent, #4361ee);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent, #4361ee) 12%, transparent);
    }
    [data-theme="dark"] .mixer-image-overlay-panel .panel-keyword-row input {
      background: var(--surface-alt);
      color: var(--ink);
      border-color: var(--line-strong);
    }
    .mixer-image-overlay-panel .panel-icon-btn {
      flex: 0 0 40px;
      height: 40px;
      padding: 0;
      font-weight: 700;
      border-radius: 9px;
      border: 1px solid var(--line, #dbe2ea);
      background: var(--surface-2, #f8fafc);
      color: var(--ink, #1a1f2b);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    [data-theme="dark"] .mixer-image-overlay-panel .panel-icon-btn {
      background: var(--surface-soft);
      color: var(--ink);
      border-color: var(--line-strong);
    }
    .mixer-image-overlay-panel .panel-icon-btn:hover:not(:disabled) {
      border-color: var(--accent, #4361ee);
      color: var(--accent, #4361ee);
      background: color-mix(in srgb, var(--accent, #4361ee) 7%, var(--surface-1, #fff));
    }
    .mixer-image-overlay-panel .panel-icon-btn:disabled,
    .mixer-image-overlay-panel .panel-action-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .mixer-image-overlay-panel .panel-actions-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 7px;
    }
    .mixer-image-overlay-panel .panel-action-btn {
      min-height: 44px;
      padding: 7px 9px;
      font-size: 11px;
      font-weight: 650;
      border-radius: 9px;
      border: 1px solid var(--line, #dbe2ea);
      background: var(--surface-2, #f8fafc);
      color: var(--ink, #1a1f2b);
      cursor: pointer;
      text-align: left;
      line-height: 1.2;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 8px;
      transition: border-color 0.16s ease, color 0.16s ease, background 0.16s ease, transform 0.16s ease;
    }
    .mixer-image-overlay-panel .panel-action-btn .mixer-ui-icon {
      width: 15px;
      height: 15px;
      flex-basis: 15px;
      color: var(--text-secondary, #64748b);
    }
    [data-theme="dark"] .mixer-image-overlay-panel .panel-action-btn {
      background: var(--surface-soft);
      color: var(--ink);
      border-color: var(--line-strong);
    }
    .mixer-image-overlay-panel .panel-action-btn:hover:not(:disabled) {
      border-color: var(--accent, #4361ee);
      color: var(--accent, #4361ee);
      background: color-mix(in srgb, var(--accent, #4361ee) 6%, var(--surface-1, #fff));
      transform: translateY(-1px);
    }
    .mixer-image-overlay-panel .panel-action-btn:hover:not(:disabled) .mixer-ui-icon {
      color: currentColor;
    }
    .mixer-image-overlay-panel .panel-status-msg {
      font-size: 11px;
      color: var(--text-secondary, #64748b);
      line-height: 1.4;
      padding: 8px 10px;
      border-radius: 8px;
      background: var(--surface-2, #f8fafc);
      border: 1px solid var(--line, #e2e8f0);
    }
    .mixer-image-overlay-panel .panel-status-msg:empty {
      display: none;
    }
    .mixer-reference-tools-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 7px;
    }
    .mixer-reference-tools-row .panel-action-btn:first-child {
      background: #2563eb;
      border-color: #2563eb;
      color: #fff;
      box-shadow: 0 5px 14px rgba(37, 99, 235, 0.24);
    }
    .mixer-reference-tools-row .panel-action-btn:first-child .mixer-ui-icon {
      color: #fff;
    }
    .mixer-reference-tools-row .panel-action-btn:first-child:hover:not(:disabled) {
      background: #1d4ed8;
      border-color: #1d4ed8;
      color: #fff;
    }
    .mixer-result-image-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      padding: 4px 7px;
      border-radius: 999px;
      background: rgba(2, 6, 23, 0.72);
      color: #fff;
      font-size: 10.5px;
      font-weight: 700;
      backdrop-filter: blur(8px);
      z-index: 9;
    }
    .mixer-preview-tools {
      display: flex;
      flex-direction: column;
      gap: 9px;
      padding: 12px;
      border: 1px solid var(--line, #e2e8f0);
      border-radius: 10px;
      background: var(--surface-2, #f8fafc);
    }
    .mixer-preview-tools-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 12px;
      font-weight: 800;
      color: var(--ink, #1a1f2b);
    }
    .mixer-preview-tools-title span {
      font-size: 10px;
      font-weight: 600;
      color: var(--text-secondary, #64748b);
    }
    .mixer-preview-tool-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px;
    }
    .mixer-preview-tool-btn {
      min-height: 34px;
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 7px;
      background: var(--surface-1, #fff);
      color: var(--ink, #1a1f2b);
      font: 700 11px/1.2 inherit;
      cursor: pointer;
    }
    .mixer-preview-tool-btn:hover {
      border-color: var(--accent, #4361ee);
      color: var(--accent, #4361ee);
    }
    .mixer-preview-tool-btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .mixer-preview-keyword-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      gap: 5px;
    }
    .mixer-preview-keyword-row input {
      min-width: 0;
      padding: 8px 9px;
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 7px;
      background: var(--surface-1, #fff);
      color: var(--ink, #1a1f2b);
      font: 500 12px/1.2 inherit;
      outline: none;
    }
    .mixer-preview-keyword-row input:focus {
      border-color: var(--accent, #4361ee);
      box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
    }
    .mixer-preview-medium-prefix {
      font: 500 10.5px/1.45 'SFMono-Regular', Consolas, monospace;
      color: var(--text-secondary, #64748b);
      overflow-wrap: anywhere;
    }
    .mixer-preview-tool-status {
      min-height: 15px;
      font-size: 10.5px;
      color: var(--text-secondary, #64748b);
    }
    .mixer-prompt-details {
      border: 1px solid var(--line, #e2e8f0);
      border-radius: 10px;
      overflow: hidden;
    }
    .mixer-prompt-details summary {
      padding: 10px 12px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 700;
      color: var(--ink, #1a1f2b);
      background: var(--surface-2, #f8fafc);
    }
    .mixer-prompt-details .mixer-preview-prompt-box {
      border: 0;
      border-top: 1px solid var(--line, #e2e8f0);
      border-radius: 0;
    }
    /* 중복 레거시 규칙 이후에 적용되는 최종 가독성 기준 */
    .mixer-sub-title { font-size: 12px; }
    .mixer-cat-tabs {
      flex-wrap: wrap;
      overflow: visible;
    }
    .mixer-cat-btn {
      font-size: 12px;
    }
    .mixer-subj-grid {
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      grid-auto-rows: auto;
      gap: 9px;
      padding-top: 4px;
      align-items: start;
    }
    .mixer-med-grid {
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      grid-auto-rows: auto;
      gap: 9px;
      align-items: start;
      padding-top: 4px;
    }
    .mixer-subj-grid.mixer-custom-grid,
    .mixer-med-grid.mixer-custom-grid {
      grid-auto-rows: minmax(154px, auto);
    }
    .mixer-palettes-group-grid {
      grid-auto-rows: 146px;
      padding-top: 4px;
    }
    .mixer-item-card {
      height: auto;
      padding: 14px;
      width: 100%;
      text-align: left;
      font-family: inherit;
      min-height: 166px;
    }
    .mixer-item-card.user-custom {
      padding: 14px;
    }
    .mixer-item-card::after { content: ''; display: none; }
    .mixer-item-card.active::after { content: ''; display: none; }
    .mixer-item-card.active:hover {
      transform: none;
    }
    .mixer-item-head {
      font-size: 14px;
      line-height: 1.45;
      min-height: auto;
    }
    .mixer-item-desc {
      display: -webkit-box;
      overflow: hidden;
      font-size: 12.5px;
      line-height: 1.55;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      min-height: calc(1.55em * 2);
    }
    .mixer-nav-btn {
      font-size: 13px;
    }
    .mixer-palette-badge,
    .mixer-med-preview-title,
    .mixer-med-preview-meta {
      font-size: 11px;
      line-height: 1.45;
    }

    /* 다크모드 대응 — CSS 변수로 처리되지 않는 예외 항목만 명시 */
    [data-theme="dark"] .mixer-left {
      box-shadow: none;
    }
    [data-theme="dark"] .mixer-step-tab.active .step-num {
      box-shadow: 0 0 0 4px var(--accent-soft);
    }
    [data-theme="dark"] .mixer-step-tab.completed .step-num {
      background: var(--surface-soft);
      color: var(--ink-soft);
      border-color: var(--line-strong);
    }
    [data-theme="dark"] .mixer-summary-chip:hover {
      background: var(--surface-soft);
    }
    [data-theme="dark"] .mixer-item-card:hover {
      border-color: var(--line-strong);
    }
    [data-theme="dark"] .mixer-item-card.active {
      border-color: var(--line-selected);
      background: var(--surface-2);
    }
    [data-theme="dark"] .mixer-med-popup {
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
    }
    /* 미리보기 카드: base 규칙에 rgba(255,255,255,0.85) 하드코딩되어 있어 명시 필요 */
    [data-theme="dark"] .mixer-preview-card {
      background: var(--surface-panel);
      border-color: var(--line);
    }
    /* 프롬프트 하이라이트 색상은 다크모드에서도 컬러 유지 */
    [data-theme="dark"] .hl-medium {
      background: rgba(92, 124, 250, 0.12);
      color: #8da2fb;
      border-color: rgba(92, 124, 250, 0.25);
    }
    [data-theme="dark"] .hl-subj {
      background: rgba(32, 201, 151, 0.12);
      color: #52e0b5;
      border-color: rgba(32, 201, 151, 0.25);
    }
    [data-theme="dark"] .hl-palette {
      background: rgba(252, 196, 25, 0.12);
      color: #fdd561;
      border-color: rgba(252, 196, 25, 0.25);
    }

    /* 모바일 반응형 최적화 */
    @media (max-width: 900px) {
      .mixer-workspace {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-height: auto;
      }
      .mixer-left, .mixer-right {
        flex: none;
        width: 100%;
      }
      .mixer-left {
        max-height: none;
        overflow-y: visible;
      }
      .mixer-right {
        position: static;
        margin-top: 10px;
      }
      .mixer-preview-card {
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      }
    }
    @media (max-width: 600px) {
      .mixer-toolbar {
        flex-direction: column;
      }
      .mixer-toolbar-actions {
        width: 100%;
        justify-content: flex-start;
      }
      .mixer-toolbar-actions > * {
        flex: 1 1 calc(50% - 6px);
      }
      #btnScrollToPreview {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .mixer-settings summary {
        text-align: center;
      }
      .mixer-stepper {
        display: grid;
        grid-template-columns: none;
        grid-auto-flow: column;
        grid-auto-columns: minmax(148px, 72%);
        align-items: stretch;
        padding: 8px;
        gap: 6px;
        border-radius: 8px;
        overflow-x: auto;
        overscroll-behavior-x: contain;
        scroll-snap-type: x proximity;
        scrollbar-width: thin;
      }
      .mixer-step-tab {
        grid-template-columns: 22px minmax(0, 1fr);
        min-height: 62px;
        padding: 9px 10px;
        gap: 8px;
        scroll-snap-align: start;
      }
      .mixer-step-tab .step-num {
        width: 22px;
        height: 22px;
        font-size: 11px;
      }
      .mixer-step-label {
        font-size: 11px;
      }
      .mixer-step-current {
        display: block;
        min-height: 0;
        overflow: hidden;
        font-size: 11.5px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .mixer-step-pane.active {
        max-height: min(68dvh, 620px);
        padding: 2px 4px 12px 2px;
        overflow-y: auto;
        overscroll-behavior-y: contain;
        scrollbar-width: thin;
      }
      .mixer-left {
        padding: 13px;
      }
      .mixer-summary-bar {
        padding: 8px 12px;
      }
      .mixer-summary-chip {
        padding: 2px 6px;
        font-size: 11.5px;
      }
      .mixer-summary-title,
      .mixer-summary-arrow {
        display: none;
      }
      .mixer-subj-grid,
      .mixer-med-grid {
        grid-template-columns: 1fr;
        grid-auto-rows: auto;
      }
      .mixer-palettes-group-grid {
        grid-auto-rows: auto;
      }
      .mixer-item-card {
        min-height: 92px;
      }
      .mixer-item-card.user-custom,
      .mixer-add-card {
        min-height: auto;
      }
      .mixer-subj-grid.mixer-custom-grid,
      .mixer-med-grid.mixer-custom-grid {
        grid-auto-rows: auto;
      }
      .mixer-user-cat-panel {
        grid-template-columns: 1fr;
      }
      .mixer-user-cat-panel-actions {
        justify-content: stretch;
      }
      .mixer-user-cat-panel-actions button {
        flex: 1 1 calc(50% - 4px);
      }
      .mixer-preview-actions {
        position: sticky;
        bottom: 8px;
        z-index: 5;
        padding: 6px;
        margin: 0 -6px -6px;
        border-radius: 10px;
        background: color-mix(in srgb, var(--surface-1, #fff) 92%, transparent);
        backdrop-filter: blur(10px);
      }
      .mixer-image-overlay-panel .panel-body {
        padding: 13px;
        gap: 13px;
      }
      .mixer-image-overlay-panel .panel-actions-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .mixer-reference-tools-row {
        grid-template-columns: 1fr;
      }
      .mixer-image-overlay-panel {
        margin: 8px;
        border-radius: 12px;
      }
      .mixer-image-overlay-panel .panel-header {
        padding: 12px 13px;
      }
      .mixer-image-overlay-panel .panel-header-copy small {
        font-size: 10px;
      }
      .mixer-image-overlay-panel .panel-field-label,
      .mixer-image-overlay-panel .panel-group-head {
        align-items: flex-start;
      }
      .mixer-preview-header {
        padding: 9px 12px;
      }
    }

    /* 화풍 샘플 갤러리 */
    .mixer-gallery-container {
      width: 100%;
      margin: 12px 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .mixer-gallery-main {
      width: 100%;
      aspect-ratio: 1 / 1;
      border-radius: 12px;
      border: 1.5px solid var(--accent-faint, #c7d2fe);
      background: var(--surface-2, #f8fafc);
      overflow: hidden;
      cursor: pointer;
      position: relative;
      box-shadow: 0 4px 12px rgba(67, 97, 238, 0.04);
    }
    .mixer-gallery-main img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
      display: block;
    }
    .mixer-gallery-main:hover img {
      transform: scale(1.03);
    }
    .mixer-gallery-zoom-badge {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(0, 0, 0, 0.65);
      color: white;
      font-size: 10px;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 700;
      pointer-events: none;
      backdrop-filter: blur(2px);
      transition: background 0.2s;
    }
    .mixer-gallery-main:hover .mixer-gallery-zoom-badge {
      background: var(--accent, #4361ee);
      color: var(--on-accent, #fff);
    }
    .mixer-gallery-thumbs {
      display: flex;
      gap: 6px;
      justify-content: space-between;
    }
    .mixer-gallery-thumb-item {
      flex: 1;
      aspect-ratio: 1.5 / 1;
      border-radius: 6px;
      border: 1.5px solid var(--line, #cbd5e1);
      overflow: hidden;
      cursor: pointer;
      opacity: 0.7;
      transition: all 0.2s ease;
      background: var(--surface-2, #f8fafc);
    }
    .mixer-gallery-thumb-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .mixer-gallery-thumb-item.active {
      border-color: var(--accent, #4361ee);
      opacity: 1;
      box-shadow: 0 2px 6px rgba(67, 97, 238, 0.15);
    }
    .mixer-gallery-thumb-item:hover {
      opacity: 1;
    }

    [data-theme="dark"] .mixer-gallery-main {
      border-color: rgba(67, 97, 238, 0.25);
    }
    [data-theme="dark"] .mixer-gallery-thumb-item {
      border-color: var(--line, #334155);
    }
    [data-theme="dark"] .mixer-gallery-thumb-item.active {
      border-color: var(--accent, #4361ee);
    }

    /* 카드 내 화풍 샘플 갤러리 */
    .mixer-med-gallery-row {
      display: flex;
      gap: 6px;
      justify-content: center;
      margin: 10px 0;
    }
    .mixer-med-gallery-thumb-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      border-radius: 6px;
      border: 1px solid var(--line, #cbd5e1);
      overflow: hidden;
      cursor: default;
      background: var(--surface-2, #f8fafc);
      transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    }
    .mixer-thumb-action-row {
      display: flex;
      gap: 6px;
      margin: 4px 0 2px;
    }
    .mixer-thumb-action-row button {
      flex: 1;
      font-size: 11px;
      padding: 5px 0;
      border-radius: 5px;
      border: 1px solid var(--line, #e2e8f0);
      background: var(--surface-2, #f8fafc);
      color: var(--text-secondary, #64748b);
      cursor: pointer;
      font-weight: 600;
      transition: border-color 0.15s, color 0.15s;
    }
    .mixer-thumb-action-row button:hover {
      border-color: var(--accent, #4361ee);
      color: var(--accent, #4361ee);
    }
    .mixer-thumb-action-row button:disabled {
      opacity: 0.55;
      cursor: default;
    }
    [data-theme="dark"] .mixer-thumb-action-row button {
      background: var(--surface-2, #1e293b);
      border-color: var(--line, #334155);
      color: var(--text-secondary, #94a3b8);
    }
    .mixer-keyword-edit-row {
      display: flex;
      align-items: center;
      gap: 4px;
      margin: 4px 0 2px;
    }
    .mixer-keyword-input {
      flex: 1;
      font-size: 11px;
      padding: 5px 7px;
      border-radius: 5px;
      border: 1px solid var(--line, #e2e8f0);
      background: var(--surface-2, #f8fafc);
      color: var(--ink, #1a1f2b);
      outline: none;
      min-width: 0;
    }
    .mixer-keyword-input:focus {
      border-color: var(--accent, #4361ee);
    }
    .mixer-keyword-apply-btn {
      font-size: 11px;
      padding: 5px 8px;
      border-radius: 5px;
      border: 1px solid var(--accent, #4361ee);
      background: transparent;
      color: var(--accent, #4361ee);
      cursor: pointer;
      font-weight: 700;
      white-space: nowrap;
    }
    .mixer-keyword-reset-btn {
      font-size: 11px;
      padding: 2px 5px;
      border-radius: 5px;
      border: 1px solid var(--line, #e2e8f0);
      background: transparent;
      color: var(--text-secondary, #64748b);
      cursor: pointer;
    }
    [data-theme="dark"] .mixer-keyword-input {
      background: var(--surface-2, #1e293b);
      border-color: var(--line, #334155);
      color: var(--ink, #f1f5f9);
    }
    [data-theme="dark"] .mixer-keyword-reset-btn {
      border-color: var(--line, #334155);
    }
    .mixer-med-gallery-thumb-wrapper:hover {
      transform: scale(1.05);
      border-color: var(--accent, #4361ee);
      box-shadow: 0 2px 8px rgba(67, 97, 238, 0.15);
    }
    .mixer-med-gallery-thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: opacity 0.25s;
    }
    .mixer-thumb-upload-btn {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.52);
      color: #fff;
      border: none;
      font-size: 11px;
      padding: 4px 0;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s;
      line-height: 1.4;
      text-align: center;
    }
    .mixer-med-gallery-thumb-wrapper:hover .mixer-thumb-upload-btn {
      opacity: 1;
    }
    .mixer-thumb-del-btn {
      position: absolute;
      top: 2px;
      right: 2px;
      background: rgba(239, 68, 68, 0.88);
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 14px;
      height: 14px;
      font-size: 9px;
      line-height: 14px;
      text-align: center;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    [data-theme="dark"] .mixer-med-gallery-thumb-wrapper {
      border-color: var(--line, #334155);
      background: var(--surface-2, #1e293b);
    }
  `;
  document.head.appendChild(styleTag);

  // 헥스 색상을 자연어 이름으로 매핑하는 헬퍼
  function getPaletteColorNames(colors) {
    const tempMap = {
      "#ffffff": "pure white", "#000000": "true black", "#ffd700": "gold",
      "#ff0000": "red", "#0000ff": "blue", "#00ff00": "green",
      "#ff6600": "orange", "#ff0555": "crimson", "#ff00ff": "magenta",
      "#00ffff": "cyan", "#7d7d7d": "gray", "#1a1a2e": "dark navy",
      "#16213e": "navy", "#ffe8b8": "warm cream", "#ff9de2": "pink",
      "#ee0979": "magenta", "#ff6a00": "orange", "#0099f7": "blue",
      "#fc4a1a": "orange-red", "#4d96ff": "sky blue", "#6bcb77": "fresh green",
      "#ffd93d": "bright yellow", "#ff6b6b": "coral red", "#d4a5e5": "soft lilac",
      "#ffaaa5": "coral orange", "#ffd3b6": "warm peach", "#dcedc1": "sage green",
      "#a8e6cf": "pale mint", "#c9a84c": "metallic gold", "#e76f51": "burnt terracotta",
      "#f4a261": "sandy orange", "#e9c46a": "golden yellow", "#2a9d8f": "emerald teal",
      "#264653": "dark slate blue", "#ffd6a5": "warm peach", "#a8dadc": "powder blue",
      "#f1faee": "off-white", "#457b9d": "steel blue", "#e63946": "vibrant tomato red",
      "#8ac926": "lime green", "#1982c4": "royal blue", "#6a4c93": "deep purple",
      "#ffca3a": "amber yellow", "#ff595e": "vivid red", "#8b0000": "deep crimson",
      "#1a1a5e": "dark navy", "#daa520": "golden amber", "#8b4513": "saddle brown",
      "#2d4a22": "deep forest green", "#ff922b": "warm orange", "#caffbf": "pale mint green",
      "#ffd6ff": "soft lavender", "#ffb3c6": "rose pink", "#fdffb6": "lemon yellow",
      "#ffecd2": "cream white", "#fbc2eb": "blush pink", "#a18cd1": "soft purple",
      "#fad0c4": "peach pink", "#ff9a9e": "salmon pink", "#44f7c2": "turquoise",
      "#0099f7": "electric blue", "#f7b733": "amber yellow", "#38ef7d": "lime green",
      "#11998e": "deep teal", "#ffe5b4": "warm peach", "#ff8f00": "amber orange",
      "#8ae9a8": "pale green", "#0b333e": "deep slate blue", "#7cd1f9": "sky blue",
      "#0c4b82": "ocean blue", "#ffd57a": "pastel yellow", "#ff7a7a": "pastel red"
    };
    return colors.map(c => {
      let clean = String(c || "").toLowerCase().trim();
      if (clean.startsWith("#")) {
        if (clean.length === 4) {
          clean = "#" + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3];
        }
        return tempMap[clean] || clean;
      }
      return clean;
    }).filter(Boolean).join(", ");
  }

  function escapeMixerHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function resolveMixerSubject() {
    // 사용자 커스텀 탭이거나 ID가 user-s-로 시작하면 userSubjects에서 탐색
    const fromUser = userSubjects.find(s => s.id === selectedSubjId);
    if (fromUser) return fromUser;
    const categoryList = activeCategory === 'all'
      ? Object.values(MIXER_SUBJECTS).flat()
      : (MIXER_SUBJECTS[activeCategory] || []);
    return categoryList.find(s => s.id === selectedSubjId) || Object.values(MIXER_SUBJECTS).flat().find(s => s.id === selectedSubjId) || categoryList[0] || null;
  }

  function resolveMixerMedium() {
    const fromUser = userMediums.find(m => m.id === selectedMediumId);
    if (fromUser) return fromUser;
    return MIXER_MEDIUMS.find(m => m.id === selectedMediumId) || MIXER_MEDIUMS[0] || null;
  }

  function resolveMixerComposition() {
    if (!selectedCompositionId || selectedCompositionId === 'none') return null;
    return MIXER_COMPOSITIONS.find(c => c.id === selectedCompositionId) || null;
  }

  function resolveMixerTypography() {
    if (!selectedTypographyId || selectedTypographyId === 'none') return null;
    return MIXER_TYPOGRAPHIES.find(r => r.id === selectedTypographyId) || null;
  }

  function getVisibleCompositions() {
    return MIXER_COMPOSITIONS.filter(c => {
      if (c.id === 'none') return false;
      if (activeCompositionCategory === 'all') return true;
      return c.category === activeCompositionCategory;
    });
  }

  function getVisibleTypographies() {
    return MIXER_TYPOGRAPHIES.filter(r => {
      if (r.id === 'none') return false;
      if (activeTypographyCategory === 'all') return true;
      return r.category === activeTypographyCategory;
    });
  }

  function syncCompositionCategoryTabs() {
    const container = document.getElementById('conceptMixerContainer');
    if (!container) return;
    container.querySelectorAll('[data-composition-cat]').forEach(btn => {
      const isActive = btn.dataset.compositionCat === activeCompositionCategory;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });
  }

  function syncTypographyCategoryTabs() {
    const container = document.getElementById('conceptMixerContainer');
    if (!container) return;
    container.querySelectorAll('[data-typography-cat]').forEach(btn => {
      const isActive = btn.dataset.typographyCat === activeTypographyCategory;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });
  }

  function ensureVisibleCompositionSelection() {
    if (selectedCompositionId === 'none') return;
    if (!getVisibleCompositions().some(c => c.id === selectedCompositionId)) {
      selectedCompositionId = 'none';
    }
  }

  function ensureVisibleTypographySelection() {
    if (selectedTypographyId === 'none') return;
    if (!getVisibleTypographies().some(r => r.id === selectedTypographyId)) {
      selectedTypographyId = 'none';
    }
  }

  // 한글 주제어 → 영어 변환 사전
  const KO_EN_SUBJECT_MAP = {
    // 사람/직업
    '의사': 'doctor', '간호사': 'nurse', '교사': 'teacher', '선생님': 'teacher',
    '학생': 'student', '어린이': 'children', '아이': 'child', '아기': 'baby',
    '노인': 'elderly person', '여성': 'woman', '남성': 'man', '부부': 'couple',
    '가족': 'family', '친구': 'friends', '직장인': 'office worker', '요리사': 'chef',
    '운동선수': 'athlete', '음악가': 'musician', '예술가': 'artist', '과학자': 'scientist',
    '엔지니어': 'engineer', '건축가': 'architect', '디자이너': 'designer',
    // 동물
    '고양이': 'cat', '강아지': 'dog', '개': 'dog', '말': 'horse', '새': 'bird',
    '독수리': 'eagle', '나비': 'butterfly', '물고기': 'fish', '고래': 'whale',
    '호랑이': 'tiger', '사자': 'lion', '여우': 'fox', '늑대': 'wolf', '곰': 'bear',
    '토끼': 'rabbit', '판다': 'panda', '코끼리': 'elephant', '기린': 'giraffe',
    '용': 'dragon', '봉황': 'phoenix',
    // 음식/음료
    '커피': 'coffee', '차': 'tea', '케이크': 'cake', '빵': 'bread', '라면': 'ramen',
    '스시': 'sushi', '피자': 'pizza', '버거': 'burger', '과일': 'fruit', '채소': 'vegetables',
    '와인': 'wine', '맥주': 'beer', '칵테일': 'cocktail',
    // 자연/풍경
    '산': 'mountain', '바다': 'ocean', '강': 'river', '숲': 'forest', '꽃': 'flowers',
    '나무': 'tree', '하늘': 'sky', '구름': 'clouds', '별': 'stars', '달': 'moon',
    '태양': 'sun', '일출': 'sunrise', '일몰': 'sunset', '폭포': 'waterfall',
    '사막': 'desert', '눈': 'snow', '비': 'rain', '벚꽃': 'cherry blossoms',
    '단풍': 'autumn leaves',
    // 도시/건물
    '도시': 'city', '빌딩': 'building', '집': 'house', '성': 'castle', '탑': 'tower',
    '다리': 'bridge', '거리': 'street', '시장': 'market', '카페': 'cafe',
    '도서관': 'library', '병원': 'hospital', '학교': 'school', '공장': 'factory',
    '항구': 'harbor', '공항': 'airport',
    // 기술/제품
    '로봇': 'robot', '자동차': 'car', '자전거': 'bicycle', '오토바이': 'motorcycle',
    '비행기': 'airplane', '배': 'ship', '기차': 'train', '스마트폰': 'smartphone',
    '컴퓨터': 'computer', '카메라': 'camera', '드론': 'drone',
    // 스포츠/활동
    '축구': 'soccer', '농구': 'basketball', '야구': 'baseball', '수영': 'swimming',
    '등산': 'hiking', '달리기': 'running', '댄스': 'dance', '요가': 'yoga',
    '게임': 'gaming',
    // 비즈니스/추상
    '협업': 'teamwork', '성장': 'growth', '혁신': 'innovation', '데이터': 'data',
    '네트워크': 'network', '글로벌': 'global', '비즈니스': 'business',
    '창의성': 'creativity', '미래': 'future', '에너지': 'energy',
    '환경': 'environment', '지속가능성': 'sustainability', '교육': 'education',
    '건강': 'health', '의료': 'healthcare', '금융': 'finance', '부동산': 'real estate',
    // 오브젝트
    '책': 'book', '꽃다발': 'bouquet', '보석': 'jewel', '시계': 'clock', '열쇠': 'key',
    '편지': 'letter', '지도': 'map', '달력': 'calendar', '안경': 'glasses',
    '가방': 'bag', '의자': 'chair', '테이블': 'table', '램프': 'lamp',
  };

  async function translateWithMyMemory(text, langpair = 'ko|en') {
    // 사용자가 입력한 문장을 고지 없이 제3자 번역 API로 보내지 않는다.
    // 내장 사전/원문 폴백만 사용하며, 번역 기능을 다시 도입할 때는 별도 동의와 처리방침 고지가 필요하다.
    return null;
  }

  function resolveCustomSubjectEn(koText) {
    if (!koText) return '';
    const trimmed = koText.trim();
    if (!trimmed) return '';
    // 사전 직접 매핑
    if (KO_EN_SUBJECT_MAP[trimmed]) return KO_EN_SUBJECT_MAP[trimmed];
    // 단어 분리 후 부분 매핑 시도
    const parts = trimmed.split(/[\s,]+/);
    const mapped = parts.map(p => KO_EN_SUBJECT_MAP[p] || p);
    return mapped.join(' ');
  }

  // 현재 조합 상태에 따라 하이라이트 HTML로 구성된 프롬프트 반환
  function buildMixedHighlightPromptHTML() {
    const subject = resolveMixerSubject();
    const medium = resolveMixerMedium();
    const palette = MIXER_PALETTES[selectedPaletteIdx];
    const composition = resolveMixerComposition();
    const typography = resolveMixerTypography();

    if (!subject || !medium || !palette) return '';

    const colorPart = getSequentialColorPart(palette);

    const subjectPromptText = customSubjectEn || subject.prompt;
    const medPrefix = customMediumEn || medium.prefix;
    const medSuffix = customMediumEnSuffix || (customMediumEn ? '' : medium.suffix);
    const medSuffixSepHL = customMediumEnSuffix ? ', ' : '. ';
    const part1 = `<span class="hl-medium">${escapeMixerHTML(`A ${medPrefix}`)}</span>` +
                  (composition ? ` <span class="hl-composition">${escapeMixerHTML(composition.prefix)}</span>` : '') +
                  ` <span class="hl-subj">${escapeMixerHTML(subjectPromptText)}</span>`;

    let part2Parts = [];
    if (medSuffix) part2Parts.push(`<span class="hl-medium">${escapeMixerHTML(medSuffix)}</span>`);
    if (composition && composition.suffix) part2Parts.push(`<span class="hl-composition">${escapeMixerHTML(composition.suffix)}</span>`);
    if (palette.id !== 'none' && colorPart) part2Parts.push(`<span class="hl-palette">color palette: ${escapeMixerHTML(colorPart)}</span>`);
    if (typography) part2Parts.push(`<span class="hl-lighting">${escapeMixerHTML(typography.prompt)}</span>`);

    if (part2Parts.length === 0) return part1;
    const firstSep = medSuffix ? medSuffixSepHL : '. ';
    const [first, ...rest] = part2Parts;
    const part2 = first + (rest.length ? `, ${rest.join(', ')}` : '');
    return `${part1}${firstSep}${part2}`;
  }

  // 결합된 플레인 텍스트 프롬프트 반환 (복사용)
  function buildMixedPrompt() {
    const subject = resolveMixerSubject();
    const medium = resolveMixerMedium();
    const palette = MIXER_PALETTES[selectedPaletteIdx];
    const composition = resolveMixerComposition();
    const typography = resolveMixerTypography();

    if (!subject || !medium || !palette) return '';

    const colorPart = getSequentialColorPart(palette);
    const compPrefix = composition ? `${composition.prefix} ` : '';
    const compSuffix = composition ? `, ${composition.suffix}` : '';
    const typoStr = typography ? `, ${typography.prompt}` : '';

    let colorPartStr = '';
    if (palette.id !== 'none' && colorPart) {
      colorPartStr = `, color palette: ${colorPart}`;
    }

    const subjectPromptText = customSubjectEn || subject.prompt;
    const medPrefix = customMediumEn || medium.prefix;
    const medSuffix = customMediumEnSuffix || (customMediumEn ? '' : medium.suffix);
    const medSuffixSep = customMediumEnSuffix ? ', ' : '. ';
    return `A ${medPrefix} ${compPrefix}${subjectPromptText}${medSuffix ? `${medSuffixSep}${medSuffix}` : ''}${compSuffix}${colorPartStr}${typoStr}`;
  }

  // 48종 화풍에 맞춘 무의존성 동적 인라인 SVG 생성기
  function getMediumPreviewSVG(medId) {
    let svgContent = '';

    // defs 그라데이션 및 공통 필터 정의
    const defs = `
      <defs>
        <linearGradient id="g-tech" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00f0ff" />
          <stop offset="100%" stop-color="#ff007f" />
        </linearGradient>
        <linearGradient id="g-clay" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffccd5" />
          <stop offset="100%" stop-color="#b800ff" />
        </linearGradient>
        <linearGradient id="g-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffe5b4" />
          <stop offset="100%" stop-color="#ff8f00" />
        </linearGradient>
        <linearGradient id="g-nature" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#8ae9a8" />
          <stop offset="100%" stop-color="#0b333e" />
        </linearGradient>
        <linearGradient id="g-sky" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#7cd1f9" />
          <stop offset="100%" stop-color="#0c4b82" />
        </linearGradient>
        <linearGradient id="g-retro" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff0055" />
          <stop offset="100%" stop-color="#ffd000" />
        </linearGradient>
        <filter id="shadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="1" dy="2" stdDeviation="1.5" flood-opacity="0.15"/>
        </filter>
        <filter id="heavy-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.25"/>
        </filter>
      </defs>
    `;

    switch(medId) {
      // 1. 3D & 테크니컬 (tech3d)
      case 'med-3d':
        svgContent = `<circle cx="50" cy="28" r="15" fill="url(#g-tech)" filter="url(#shadow)"/><ellipse cx="50" cy="48" rx="18" ry="3.5" fill="rgba(0,0,0,0.15)"/>`;
        break;
      case 'med-clay':
        svgContent = `<rect x="35" y="14" width="30" height="30" rx="9" fill="url(#g-clay)" filter="url(#shadow)"/><circle cx="43" cy="24" r="2.5" fill="#333"/><circle cx="57" cy="24" r="2.5" fill="#333"/><path d="M 46 32 Q 50 36 54 32" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
        break;
      case 'med-lowpoly':
        svgContent = `<path d="M50 10 L25 28 L50 50 Z" fill="#4361ee"/><path d="M50 10 L75 28 L50 50 Z" fill="#3f37c9"/><path d="M25 28 L50 50 L25 45 Z" fill="#4895ef"/><path d="M75 28 L50 50 L75 45 Z" fill="#7209b7"/>`;
        break;
      case 'med-isometric':
        svgContent = `<path d="M50 14 L78 28 L50 42 L22 28 Z" fill="#e2e8f0" stroke="#cbd5e1"/><path d="M50 22 L68 31 L50 40 L32 31 Z" fill="url(#g-tech)" filter="url(#shadow)"/><path d="M32 31 L32 46 L50 55 L50 40 Z" fill="#00c8ff"/><path d="M68 31 L68 46 L50 55 L50 40 Z" fill="#ff00cc"/>`;
        break;
      case 'med-spline':
        svgContent = `<path d="M20 42 Q 35 12, 50 42 T 80 18" fill="none" stroke="url(#g-tech)" stroke-width="5" stroke-linecap="round" filter="url(#shadow)"/>`;
        break;
      case 'med-hologram':
        svgContent = `<circle cx="50" cy="30" r="16" fill="url(#g-tech)" opacity="0.85" filter="url(#shadow)"/><circle cx="50" cy="30" r="12" fill="none" stroke="#fff" stroke-width="1" opacity="0.5"/><path d="M36 30 L64 30" stroke="#fff" stroke-width="0.5" opacity="0.5"/><path d="M50 16 L50 44" stroke="#fff" stroke-width="0.5" opacity="0.5"/>`;
        break;
      case 'med-glassmorphism':
        svgContent = `<circle cx="38" cy="24" r="13" fill="#ff007f" opacity="0.7"/><circle cx="62" cy="36" r="13" fill="#00f0ff" opacity="0.7"/><rect x="32" y="18" width="36" height="26" rx="7" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" style="backdrop-filter: blur(3px);" filter="url(#heavy-shadow)"/>`;
        break;
      case 'med-fluid-abstract':
        svgContent = `<path d="M32 34 Q 26 14, 50 18 T 72 34 Q 58 48, 44 40 Z" fill="url(#g-clay)" filter="url(#shadow)"/><circle cx="63" cy="20" r="4.5" fill="#ffccd5"/><circle cx="34" cy="40" r="3" fill="#00f0ff"/>`;
        break;

      // 2. 아날로그 & 회화 (analog)
      case 'med-watercolor':
        svgContent = `<circle cx="42" cy="26" r="13" fill="#ffccd5" opacity="0.6"/><circle cx="58" cy="34" r="14" fill="#baffc9" opacity="0.6"/><circle cx="46" cy="38" r="11" fill="#bae1ff" opacity="0.6"/>`;
        break;
      case 'med-oil':
        svgContent = `<path d="M18 18 L82 18" stroke="#7b2a1e" stroke-width="7" stroke-linecap="round"/><path d="M22 30 L78 30" stroke="#a74a1b" stroke-width="9" stroke-linecap="round"/><path d="M26 42 L74 42" stroke="#e5ba73" stroke-width="8" stroke-linecap="round"/>`;
        break;
      case 'med-pencil':
        svgContent = `<rect x="25" y="16" width="50" height="28" rx="4" fill="none" stroke="#555" stroke-width="1.5"/><path d="M30 38 L58 10 M34 40 L62 12 M38 42 L66 14 M42 44 L70 16" stroke="#666" stroke-width="1"/>`;
        break;
      case 'med-pastel':
        svgContent = `<circle cx="39" cy="30" r="13" fill="#ffccd5" filter="url(#shadow)" opacity="0.95"/><circle cx="61" cy="30" r="13" fill="#e8cbf5" filter="url(#shadow)" opacity="0.95"/>`;
        break;
      case 'med-gouache':
        svgContent = `<rect x="22" y="16" width="56" height="28" rx="3" fill="#8c9a78"/><path d="M22 16 L50 44 L78 16 Z" fill="#3c2a21"/><circle cx="50" cy="25" r="7" fill="#e6ded5"/>`;
        break;
      case 'med-ink-wash':
        svgContent = `<path d="M18 42 C 32 8, 42 38, 56 12 C 68 42, 78 18, 82 42 Z" fill="#333" opacity="0.8" filter="url(#shadow)"/>`;
        break;
      case 'med-charcoal':
        svgContent = `<rect x="22" y="16" width="56" height="28" fill="#2c3e50" opacity="0.9"/><circle cx="50" cy="30" r="11" fill="#000" opacity="0.8" filter="url(#shadow)"/>`;
        break;
      case 'med-collage':
        svgContent = `<rect x="22" y="16" width="26" height="28" fill="#f4c493" transform="rotate(-6 30 30)"/><rect x="44" y="14" width="34" height="30" fill="#a2dbfa" transform="rotate(4 60 30)"/><line x1="41" y1="12" x2="47" y2="48" stroke="#fff" stroke-dasharray="3" stroke-width="2"/>`;
        break;

      // 3. 그래픽 & 디자인 (graphic)
      case 'med-flat':
        svgContent = `<circle cx="36" cy="30" r="12" fill="#ff0055"/><rect x="52" y="18" width="18" height="18" fill="#ffd000"/>`;
        break;
      case 'med-lineart':
        svgContent = `<path d="M22 30 C 35 12, 40 48, 55 30 C 64 16, 68 44, 78 30" fill="none" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>`;
        break;
      case 'med-retro':
        svgContent = `<circle cx="36" cy="30" r="13" fill="url(#g-retro)" stroke="#000" stroke-width="2"/><circle cx="58" cy="26" r="3.5" fill="#000"/><circle cx="68" cy="26" r="3.5" fill="#000"/><circle cx="58" cy="36" r="3.5" fill="#000"/><circle cx="68" cy="36" r="3.5" fill="#000"/>`;
        break;
      case 'med-bauhaus':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#f5f5f5" stroke="#333" stroke-width="1.5"/><circle cx="36" cy="30" r="9" fill="#ff0000"/><path d="M52 36 L68 36 L60 20 Z" fill="#0000ff"/>`;
        break;
      case 'med-minimalist':
        svgContent = `<rect x="48" y="28" width="4" height="4" fill="#ff0055"/>`;
        break;
      case 'med-brutalist':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#ffd000" stroke="#000" stroke-width="2.5"/><text x="50" y="36" font-size="15" font-weight="900" fill="#000" text-anchor="middle" font-family="monospace">RAW</text>`;
        break;
      case 'med-duotone':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#0f0c1b"/><circle cx="50" cy="30" r="12" fill="#00f0ff" stroke="#ff007f" stroke-width="3"/>`;
        break;
      case 'med-gradient-art':
        svgContent = `<rect x="18" y="14" width="64" height="32" rx="5" fill="url(#g-tech)" filter="url(#shadow)"/>`;
        break;

      // 4. 만화 & 애니메이션 (anime)
      case 'med-webtoon':
        svgContent = `<circle cx="50" cy="26" r="11" fill="#fff" stroke="#333" stroke-width="2"/><path d="M46 28 C 46 34, 54 34, 54 28" fill="none" stroke="#333" stroke-width="1.5"/><path d="M36 21 C 43 16, 57 16, 64 21" stroke="#333" stroke-width="2" fill="none"/>`;
        break;
      case 'med-ghibli':
        svgContent = `<rect x="18" y="14" width="64" height="32" rx="5" fill="url(#g-sky)"/><circle cx="39" cy="31" r="7" fill="#fff"/><circle cx="49" cy="31" r="9" fill="#fff"/><circle cx="59" cy="31" r="6" fill="#fff"/>`;
        break;
      case 'med-cyberpunk':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#0d1117"/><line x1="22" y1="28" x2="78" y2="28" stroke="#ff007f" stroke-width="2" filter="url(#shadow)"/><line x1="22" y1="20" x2="78" y2="20" stroke="#00f0ff" stroke-width="2" filter="url(#shadow)"/>`;
        break;
      case 'med-chibi':
        svgContent = `<circle cx="50" cy="30" r="13" fill="#fff" stroke="#ccc" stroke-width="1" filter="url(#shadow)"/><circle cx="50" cy="30" r="11" fill="url(#g-clay)"/><circle cx="47" cy="28" r="1.5" fill="#fff"/><circle cx="53" cy="28" r="1.5" fill="#fff"/>`;
        break;
      case 'med-disney':
        svgContent = `<circle cx="50" cy="30" r="13" fill="url(#g-clay)" filter="url(#shadow)"/><circle cx="45" cy="26" r="2.5" fill="#fff"/><circle cx="55" cy="26" r="2.5" fill="#fff"/><circle cx="45" cy="26" r="1.2" fill="#000"/><circle cx="55" cy="26" r="1.2" fill="#000"/>`;
        break;
      case 'med-line-sticker':
        svgContent = `<rect x="25" y="15" width="50" height="30" rx="8" fill="#fff" stroke="#000" stroke-width="2.5" filter="url(#shadow)"/><circle cx="42" cy="25" r="2" fill="#000"/><circle cx="58" cy="25" r="2" fill="#000"/><path d="M 46 31 Q 50 34 54 31" stroke="#000" stroke-width="1.8" fill="none"/>`;
        break;
      case 'med-vector-cartoon':
        svgContent = `<path d="M25 15 L75 15 L60 45 L40 45 Z" fill="none" stroke="#2563eb" stroke-width="2.5"/><circle cx="50" cy="30" r="7" fill="#ff4500"/>`;
        break;
      case 'med-graphic-novel':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#fff" stroke="#000" stroke-width="2"/><path d="M18 14 L50 46 L82 14 Z" fill="#000"/><circle cx="50" cy="25" r="5" fill="#ff0055"/>`;
        break;

      // 5. 사진 & 실사 (photo)
      case 'med-cinematic':
        svgContent = `<rect x="18" y="16" width="64" height="28" rx="2" fill="#0c4b82"/><ellipse cx="50" cy="30" rx="13" ry="9" fill="none" stroke="#ff8f00" stroke-width="1.5"/><line x1="12" y1="30" x2="88" y2="30" stroke="#00f0ff" stroke-width="1" opacity="0.8" filter="url(#shadow)"/>`;
        break;
      case 'med-macro':
        svgContent = `<circle cx="50" cy="30" r="15" fill="url(#g-nature)" filter="url(#shadow)"/><circle cx="45" cy="25" r="3" fill="#fff" opacity="0.85"/><circle cx="55" cy="34" r="1.5" fill="#fff" opacity="0.65"/>`;
        break;
      case 'med-vintage-photo':
        svgContent = `<rect x="22" y="16" width="56" height="28" fill="#ffe5b4" stroke="#857467" stroke-width="1.5"/><circle cx="50" cy="30" r="9" fill="#857467" opacity="0.5"/>`;
        break;
      case 'med-drone':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#8ae9a8"/><line x1="32" y1="14" x2="32" y2="46" stroke="#fff" stroke-width="1.8"/><line x1="56" y1="14" x2="56" y2="46" stroke="#fff" stroke-width="1.8"/><rect x="32" y="24" width="24" height="10" fill="#ffd07b"/>`;
        break;
      case 'med-blackwhite':
        svgContent = `<rect x="18" y="14" width="32" height="32" fill="#000"/><rect x="50" y="14" width="32" height="32" fill="#fff"/><circle cx="50" cy="30" r="11" fill="#7f7f7f" filter="url(#shadow)"/>`;
        break;
      case 'med-cyber-neon-photo':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#05161c"/><circle cx="36" cy="24" r="5" fill="#ff007f" filter="url(#shadow)"/><circle cx="64" cy="32" r="5.5" fill="#00ff87" filter="url(#shadow)"/><circle cx="50" cy="28" r="3.5" fill="#00ffff" filter="url(#shadow)"/>`;
        break;
      case 'med-studio-portrait':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#3a3a3a"/><path d="M50 18 C 45 18, 41 22, 41 27 C 41 32, 45 36, 50 36 C 55 36, 59 32, 59 27 Z" fill="#fff" opacity="0.85" filter="url(#shadow)"/>`;
        break;
      case 'med-infrared':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#3d0016"/><circle cx="50" cy="30" r="13" fill="#fff" filter="url(#shadow)"/>`;
        break;

      // 6. 핸드메이드 & 실물 공예 (craft)
      case 'med-craft-clay':
        svgContent = `<circle cx="50" cy="30" r="14" fill="url(#g-clay)" filter="url(#shadow)"/><path d="M43 30 Q 50 25 57 30" stroke="rgba(0,0,0,0.2)" stroke-width="1.5" fill="none"/>`;
        break;
      case 'med-origami':
        svgContent = `<path d="M50 14 L73 30 L50 46 L27 30 Z" fill="#ff80a4"/><path d="M50 14 L50 46 L27 30 Z" fill="#ffccd5"/><path d="M50 14 L73 30 L50 30 Z" fill="#ff0055"/>`;
        break;
      case 'med-felt':
        svgContent = `<rect x="24" y="16" width="52" height="28" rx="7" fill="#ffd07b" filter="url(#shadow)"/><rect x="28" y="20" width="44" height="20" rx="4" fill="none" stroke="#ff0055" stroke-width="1.2" stroke-dasharray="2.5"/>`;
        break;
      case 'med-paper-cut':
        svgContent = `<rect x="22" y="16" width="56" height="28" rx="4" fill="#1b1736"/><rect x="27" y="20" width="46" height="20" rx="4" fill="#2f2663" filter="url(#shadow)"/><circle cx="50" cy="30" r="7" fill="#00f0ff" filter="url(#shadow)"/>`;
        break;
      case 'med-embroidery':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#8c5e62"/><path d="M28 30 Q 50 16, 72 30" fill="none" stroke="#fff" stroke-dasharray="2" stroke-width="2.5"/>`;
        break;
      case 'med-woodcarving':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#8d7b68"/><circle cx="50" cy="30" r="13" fill="none" stroke="#2f2519" stroke-width="1.8" stroke-dasharray="25 8 8 15"/><path d="M32 22 L42 38" stroke="#2f2519" stroke-width="2.5"/>`;
        break;
      case 'med-glass-stained':
        svgContent = `<rect x="22" y="14" width="56" height="32" fill="none" stroke="#222" stroke-width="2"/><path d="M22 14 L50 46 L78 14 Z" fill="url(#g-tech)" opacity="0.55"/><line x1="50" y1="14" x2="50" y2="46" stroke="#222" stroke-width="2"/><line x1="22" y1="30" x2="78" y2="30" stroke="#222" stroke-width="2"/>`;
        break;
      case 'med-miniature':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#a2dbfa"/><circle cx="36" cy="34" r="5" fill="#8ae9a8"/><rect x="54" y="24" width="10" height="18" fill="#ffd000"/>`;
        break;

      default:
        svgContent = `<circle cx="50" cy="30" r="10" fill="url(#g-tech)"/>`;
        break;
    }

    return `<svg viewBox="0 0 100 60" style="width: 100%; height: 100%; display: block;" xmlns="http://www.w3.org/2000/svg">${defs}${svgContent}</svg>`;
  }

  // 단계 내 현재 선택값 업데이트 함수
  function updateMixerSummaryBar() {
    const container = document.getElementById('conceptMixerContainer');
    if (!container) return;

    const categoryList = activeCategory === 'all'
      ? Object.values(MIXER_SUBJECTS).flat()
      : (MIXER_SUBJECTS[activeCategory] || []);
    const subject = categoryList.find(s => s.id === selectedSubjId) || userSubjects.find(s => s.id === selectedSubjId);
    const medium = MIXER_MEDIUMS.find(m => m.id === selectedMediumId);
    const palette = MIXER_PALETTES[selectedPaletteIdx];
    const composition = resolveMixerComposition();
    const typography = resolveMixerTypography();

    const subjText = subject ? `${subject.emoji} ${subject.nameKo}` : '선택 대기중';
    const medText = medium ? `${medium.emoji} ${medium.nameKo}` : '선택 대기중';
    const palText = palette ? `🎨 ${palette.name}` : '선택 대기중';
    const compText = composition ? `${composition.emoji} ${composition.nameKo}` : '선택 안 함';
    const typoText = typography ? `${typography.emoji} ${typography.nameKo}` : '선택 안 함';

    const values = [
      { step: 1, text: subjText, hasValue: Boolean(subject) },
      { step: 2, text: medText, hasValue: Boolean(medium) },
      { step: 3, text: palText, hasValue: Boolean(palette), palette: palette },
      { step: 4, text: compText, hasValue: selectedCompositionId !== 'none' },
      { step: 5, text: typoText, hasValue: selectedTypographyId !== 'none' }
    ];

    values.forEach(({ step, text, hasValue, palette }) => {
      const valueEl = container.querySelector(`.mixer-step-tab[data-step="${step}"] .mixer-step-current`);
      const tab = container.querySelector(`.mixer-step-tab[data-step="${step}"]`);
      if (!valueEl || !tab) return;

      if (step === 3 && hasValue && palette && palette.colors) {
        const chipsHtml = palette.colors.map(c => `
          <span class="mixer-summary-color-chip" style="background:${c}; display:inline-block; width:10px; height:10px; border-radius:50%; border:1px solid rgba(0,0,0,0.15); margin-left:3px; vertical-align:middle;"></span>
        `).join('');
        valueEl.innerHTML = `${text} <span style="margin-left:4px; display:inline-flex; align-items:center;">${chipsHtml}</span>`;
      } else {
        valueEl.textContent = text;
      }

      valueEl.classList.toggle('empty', !hasValue && step <= 3);
      tab.title = text;
    });
  }

  // 믹서 탭 초기 로드 (Wizard 구조)
  function initConceptMixer() {
    const container = document.getElementById('conceptMixerContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="mixer-workspace">
        <div class="mixer-left">

          <!-- 위저드 스텝퍼 -->
          <div class="mixer-stepper">
            <button type="button" class="mixer-step-tab active" data-step="1">
              <span class="step-num">1</span>
              <span class="mixer-step-copy">
                <span class="mixer-step-label">주제 선택</span>
                <strong class="mixer-step-current">선택 대기중</strong>
              </span>
            </button>
            <button type="button" class="mixer-step-tab" data-step="2">
              <span class="step-num">2</span>
              <span class="mixer-step-copy">
                <span class="mixer-step-label">화풍/기법 선택</span>
                <strong class="mixer-step-current">선택 대기중</strong>
              </span>
            </button>
            <button type="button" class="mixer-step-tab" data-step="3">
              <span class="step-num">3</span>
              <span class="mixer-step-copy">
                <span class="mixer-step-label">색상 테마 선택</span>
                <strong class="mixer-step-current">선택 대기중</strong>
              </span>
            </button>
            <button type="button" class="mixer-step-tab" data-step="4">
              <span class="step-num">4</span>
              <span class="mixer-step-copy">
                <span class="mixer-step-label">구도 선택</span>
                <strong class="mixer-step-current">선택 안 함</strong>
              </span>
            </button>
            <button type="button" class="mixer-step-tab" data-step="5">
              <span class="step-num">5</span>
              <span class="mixer-step-copy">
                <span class="mixer-step-label">타이포그래피</span>
                <strong class="mixer-step-current">선택 안 함</strong>
              </span>
            </button>
          </div>

          <!-- Step 1. 비주얼 주제 (Subject) Pane -->
          <div class="mixer-step-pane active" id="paneStep1">
            <div class="mixer-cat-tabs" style="display: none !important;" role="tablist" aria-label="비주얼 주제 카테고리">
              <button type="button" class="mixer-cat-btn" data-mix-cat="all" role="tab">🌐 전체</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="steel" role="tab">🏭 철강 & 중공업</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="energy" role="tab">⚡ 미래 에너지</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="software" role="tab">💻 소프트웨어 & IT</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="bio" role="tab">🧬 바이오 & 라이프</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="finance" role="tab">📈 금융 & 자산</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="public" role="tab">🏛️ 공공 & 인프라</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="brand" role="tab">🏷️ 브랜드 & 홍보</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="space" role="tab">🚀 우주항공 & 미래</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="regional" role="tab">📍 지역산업 & 거점</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="policy" role="tab">📋 정책 & 공공지원</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="urban" role="tab">🏙️ 도시 & 건축</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="food" role="tab">🍱 푸드 & 농식품</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="culture" role="tab">🎭 문화 & 관광</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="education" role="tab">📚 교육 & 연구</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="health" role="tab">🏥 헬스케어 & 의료</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="mobility" role="tab">🚗 모빌리티 & 물류</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="ocean" role="tab">🌊 해양 & 수산</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="materials" role="tab">⚗️ 신소재 & 화학</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="creative" role="tab">🎬 창작 & 미디어</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="environment" role="tab">🌍 환경 & 기후</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="tech_transfer" role="tab">🤝 기술사업화</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="talent_cultivation" role="tab">🎓 인력양성</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="networking" role="tab">🌐 네트워킹</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="pubinst_viz" role="tab">📊 공공 시각자료</button>
              <button type="button" class="mixer-cat-btn${activeCategory === '__user__' ? ' active' : ''}" data-mix-cat="__user__" role="tab">⭐ 내 커스텀</button>
            </div>
            <div class="mixer-pal-filters-row">
              <div class="mixer-pal-filter-group">
                <span class="mixer-pal-filter-label">주제군</span>
                <div class="mixer-pal-filter-tabs" id="mixerSubjectQuickFilters">
                  <button type="button" class="mixer-pal-filter-btn${activeSubjectGroupFilter === 'all' ? ' active' : ''}" data-subj-group="all">🌐 전체</button>
                  <button type="button" class="mixer-pal-filter-btn${activeSubjectGroupFilter === 'mfg' ? ' active' : ''}" data-subj-group="mfg">🏭 제조·생산</button>
                  <button type="button" class="mixer-pal-filter-btn${activeSubjectGroupFilter === 'knowledge' ? ' active' : ''}" data-subj-group="knowledge">💡 지식·서비스</button>
                  <button type="button" class="mixer-pal-filter-btn${activeSubjectGroupFilter === 'public' ? ' active' : ''}" data-subj-group="public">🏛 공공·정책</button>
                  <button type="button" class="mixer-pal-filter-btn${activeSubjectGroupFilter === 'urban' ? ' active' : ''}" data-subj-group="urban">🏙 도시·인프라</button>
                  <button type="button" class="mixer-pal-filter-btn${activeSubjectGroupFilter === 'life' ? ' active' : ''}" data-subj-group="life">🎨 생활·문화</button>
                  <button type="button" class="mixer-pal-filter-btn${activeSubjectGroupFilter === 'future' ? ' active' : ''}" data-subj-group="future">🌍 미래·환경</button>
                </div>
              </div>
              <div class="mixer-pal-filter-group">
                <span class="mixer-pal-filter-label">장면</span>
                <div class="mixer-pal-filter-tabs">
                  <button type="button" class="mixer-pal-filter-btn${activeSubjectSceneFilter === 'all' ? ' active' : ''}" data-subj-scene="all">🌐 전체</button>
                  <button type="button" class="mixer-pal-filter-btn${activeSubjectSceneFilter === 'facility' ? ' active' : ''}" data-subj-scene="facility">🏗 시설·현장</button>
                  <button type="button" class="mixer-pal-filter-btn${activeSubjectSceneFilter === 'lab' ? ' active' : ''}" data-subj-scene="lab">🧪 연구·실험</button>
                  <button type="button" class="mixer-pal-filter-btn${activeSubjectSceneFilter === 'space' ? ' active' : ''}" data-subj-scene="space">🏛 공간·건축</button>
                  <button type="button" class="mixer-pal-filter-btn${activeSubjectSceneFilter === 'people' ? ' active' : ''}" data-subj-scene="people">👥 사람·활동</button>
                  <button type="button" class="mixer-pal-filter-btn${activeSubjectSceneFilter === 'nature' ? ' active' : ''}" data-subj-scene="nature">🌿 자연·환경</button>
                  <button type="button" class="mixer-pal-filter-btn${activeSubjectSceneFilter === 'service' ? ' active' : ''}" data-subj-scene="service">📋 서비스·행정</button>
                </div>
              </div>
            </div>
            <div class="mixer-search-bar">
              <input type="text" id="mixerSubjSearchInput" class="mixer-search-input" placeholder="🔍 주제 검색..." value="${escapeMixerHTML(subjSearchQ)}" />
              <button type="button" class="mixer-search-clear" id="btnSubjSearchClear">지우기</button>
              <button type="button" class="mixer-user-tab-btn${activeCategory === '__user__' ? ' active' : ''}" id="btnSubjUserCat" title="내 커스텀 보기" style="${userSubjects.length === 0 ? 'display:none' : ''}">⭐ 내 커스텀 <span class="mixer-user-tab-count">${userSubjects.length}</span></button>
              <button type="button" class="mixer-hidden-chip" id="btnSubjHiddenChip" title="숨긴 프리셋 복원" style="${DELETED_PRESET_IDS.subjects.size === 0 ? 'display:none' : ''}">🚫 숨김 <span id="subjHiddenCount">${DELETED_PRESET_IDS.subjects.size}</span></button>
              <button type="button" class="mixer-subject-wizard-btn" id="btnSubjWizard" title="2단계 선택으로 주제 프리셋 생성">✨ 주제 마법사</button>
              <button type="button" class="mixer-quick-add-btn" id="btnSubjQuickAdd" title="새 주제 추가">＋ 새 추가</button>
            </div>
            <div class="mixer-subj-grid" id="mixerSubjGrid"></div>
            <div class="mixer-search-empty" id="mixerSubjectEmpty">검색 결과가 없습니다.</div>
          </div>

          <!-- Step 2. 표현 화풍 (Medium) Pane -->
          <div class="mixer-step-pane" id="paneStep2">
              <div class="mixer-cat-tabs" id="mixerMediumCategoryTabs" style="display: none !important;" role="tablist" aria-label="화풍 카테고리">
                <button type="button" class="mixer-cat-btn${activeMediumCategory === 'all' ? ' active' : ''}" data-med-cat="all" role="tab" aria-selected="${activeMediumCategory === 'all'}">🌐 전체</button>
                ${MEDIUM_CATEGORIES.map(cat => `
                  <button type="button" class="mixer-cat-btn${cat.id === activeMediumCategory ? ' active' : ''}"
                    data-med-cat="${cat.id}" role="tab" aria-selected="${cat.id === activeMediumCategory}">${cat.label}</button>
                `).join('')}
                <button type="button" class="mixer-cat-btn${activeMediumCategory === '__user__' ? ' active' : ''}" data-med-cat="__user__" role="tab" aria-selected="${activeMediumCategory === '__user__'}">⭐ 내 커스텀</button>
              </div>
            <div class="mixer-pal-filters-row">
              <div class="mixer-pal-filter-group">
                <span class="mixer-pal-filter-label">표현군</span>
                <div class="mixer-pal-filter-tabs" id="mixerMediumQuickFilters">
                  <button type="button" class="mixer-pal-filter-btn${activeMediumGroupFilter === 'all' ? ' active' : ''}" data-med-group="all">🌐 전체</button>
                  <button type="button" class="mixer-pal-filter-btn${activeMediumGroupFilter === 'pubinst' ? ' active' : ''}" data-med-group="pubinst">🏛️ 공공기관</button>
                  <button type="button" class="mixer-pal-filter-btn${activeMediumGroupFilter === 'render3d' ? ' active' : ''}" data-med-group="render3d">🧊 3D·공간</button>
                  <button type="button" class="mixer-pal-filter-btn${activeMediumGroupFilter === 'graphic' ? ' active' : ''}" data-med-group="graphic">🎨 그래픽·회화</button>
                  <button type="button" class="mixer-pal-filter-btn${activeMediumGroupFilter === 'photo' ? ' active' : ''}" data-med-group="photo">📷 사진·실사</button>
                  <button type="button" class="mixer-pal-filter-btn${activeMediumGroupFilter === 'craft' ? ' active' : ''}" data-med-group="craft">🧶 공예·재질</button>
                  <button type="button" class="mixer-pal-filter-btn${activeMediumGroupFilter === 'uiinfo' ? ' active' : ''}" data-med-group="uiinfo">📋 UI·정보</button>
                  <button type="button" class="mixer-pal-filter-btn${activeMediumGroupFilter === 'experimental' ? ' active' : ''}" data-med-group="experimental">🧪 실험·서브컬처</button>
                </div>
              </div>
              <div class="mixer-pal-filter-group">
                <span class="mixer-pal-filter-label">질감</span>
                <div class="mixer-pal-filter-tabs">
                  <button type="button" class="mixer-pal-filter-btn${activeMediumTextureFilter === 'all' ? ' active' : ''}" data-med-texture="all">🌐 전체</button>
                  <button type="button" class="mixer-pal-filter-btn${activeMediumTextureFilter === 'clean' ? ' active' : ''}" data-med-texture="clean">📐 클린</button>
                  <button type="button" class="mixer-pal-filter-btn${activeMediumTextureFilter === 'glossy' ? ' active' : ''}" data-med-texture="glossy">✨ 글로시</button>
                  <button type="button" class="mixer-pal-filter-btn${activeMediumTextureFilter === 'textured' ? ' active' : ''}" data-med-texture="textured">🖌 질감형</button>
                  <button type="button" class="mixer-pal-filter-btn${activeMediumTextureFilter === 'real' ? ' active' : ''}" data-med-texture="real">📷 리얼</button>
                  <button type="button" class="mixer-pal-filter-btn${activeMediumTextureFilter === 'tactile' ? ' active' : ''}" data-med-texture="tactile">🧵 재질감</button>
                  <button type="button" class="mixer-pal-filter-btn${activeMediumTextureFilter === 'vivid' ? ' active' : ''}" data-med-texture="vivid">🌈 비비드</button>
                </div>
              </div>
            </div>
            <div class="mixer-search-bar">
              <input type="text" id="mixerMedSearchInput" class="mixer-search-input" placeholder="🔍 화풍 검색..." value="${escapeMixerHTML(medSearchQ)}" />
              <button type="button" class="mixer-search-clear" id="btnMedSearchClear">지우기</button>
              <button type="button" class="mixer-user-tab-btn${activeMediumCategory === '__user__' ? ' active' : ''}" id="btnMedUserCat" title="내 커스텀 보기" style="${userMediums.length === 0 ? 'display:none' : ''}">⭐ 내 커스텀 <span class="mixer-user-tab-count">${userMediums.length}</span></button>
              <button type="button" class="mixer-hidden-chip" id="btnMedHiddenChip" title="숨긴 프리셋 복원" style="${DELETED_PRESET_IDS.mediums.size === 0 ? 'display:none' : ''}">🚫 숨김 <span id="medHiddenCount">${DELETED_PRESET_IDS.mediums.size}</span></button>
              <button type="button" class="mixer-quick-add-btn" id="btnMedQuickAdd" title="새 화풍 추가">＋ 새 추가</button>
            </div>
            <div id="mixerMedCategoriesWrap"></div>
            <div class="mixer-search-empty" id="mixerMediumEmpty">검색 결과가 없습니다.</div>
          </div>

          <!-- Step 3. 색상 테마 (Palette) Pane -->
          <div class="mixer-step-pane" id="paneStep3">
            <div class="mixer-cat-tabs" id="mixerPaletteCategoryTabs" style="display: none !important;" role="tablist" aria-label="색상 테마 카테고리">
              <button type="button" class="mixer-cat-btn${activePaletteCategory === 'all' ? ' active' : ''}" data-palette-cat="all" role="tab" aria-selected="${activePaletteCategory === 'all'}">🌐 전체</button>
              ${PALETTE_CATEGORIES.map(cat => `
                <button type="button" class="mixer-cat-btn${cat.id === activePaletteCategory ? ' active' : ''}"
                  data-palette-cat="${cat.id}" role="tab" aria-selected="${cat.id === activePaletteCategory}">${cat.label}</button>
              `).join('')}
            </div>

            <!-- 필터 바 묶음 -->
            <div class="mixer-pal-filters-row">
              <!-- 톤 필터 -->
              <div class="mixer-pal-filter-group">
                <span class="mixer-pal-filter-label">톤</span>
                <div class="mixer-pal-filter-tabs">
                  <button type="button" class="mixer-pal-filter-btn active" data-pal-filter="all">🌈 전체</button>
                  <button type="button" class="mixer-pal-filter-btn" data-pal-filter="dark">🌙 다크</button>
                  <button type="button" class="mixer-pal-filter-btn" data-pal-filter="light">☀️ 라이트</button>
                </div>
              </div>

              <!-- 색상 필터 -->
              <div class="mixer-pal-filter-group">
                <span class="mixer-pal-filter-label">색상</span>
                <div class="mixer-pal-filter-tabs mixer-pal-color-filter" id="mixerPalColorFilter">
                  <button type="button" class="mixer-pal-color-btn active" data-pal-color="all" title="전체">전체</button>
                  <button type="button" class="mixer-pal-color-btn" data-pal-color="red" title="레드" style="--swatch:#e53935;"></button>
                  <button type="button" class="mixer-pal-color-btn" data-pal-color="orange" title="오렌지" style="--swatch:#fb8c00;"></button>
                  <button type="button" class="mixer-pal-color-btn" data-pal-color="yellow" title="옐로우" style="--swatch:#fdd835;"></button>
                  <button type="button" class="mixer-pal-color-btn" data-pal-color="green" title="그린" style="--swatch:#43a047;"></button>
                  <button type="button" class="mixer-pal-color-btn" data-pal-color="blue" title="블루" style="--swatch:#1e88e5;"></button>
                  <button type="button" class="mixer-pal-color-btn" data-pal-color="purple" title="퍼플" style="--swatch:#8e24aa;"></button>
                  <button type="button" class="mixer-pal-color-btn" data-pal-color="pink" title="핑크" style="--swatch:#e91e8c;"></button>
                  <button type="button" class="mixer-pal-color-btn" data-pal-color="neutral" title="뉴트럴" style="--swatch:#90a4ae;"></button>
                </div>
              </div>

              <!-- 분위기 필터 -->
              <div class="mixer-pal-filter-group">
                <span class="mixer-pal-filter-label">분위기</span>
                <div class="mixer-pal-filter-tabs mixer-pal-mood-filter" id="mixerPalMoodFilter">
                  <button type="button" class="mixer-pal-filter-btn active" data-pal-mood="all">🌐 전체</button>
                  <button type="button" class="mixer-pal-filter-btn" data-pal-mood="official">🏛️ 공공/기관</button>
                  <button type="button" class="mixer-pal-filter-btn" data-pal-mood="vivid">✨ 비비드</button>
                  <button type="button" class="mixer-pal-filter-btn" data-pal-mood="festival">🎪 페스티벌</button>
                  <button type="button" class="mixer-pal-filter-btn" data-pal-mood="retro">🕹 레트로</button>
                  <button type="button" class="mixer-pal-filter-btn" data-pal-mood="luxury">💎 럭셔리</button>
                  <button type="button" class="mixer-pal-filter-btn" data-pal-mood="natural">🌿 내추럴</button>
                  <button type="button" class="mixer-pal-filter-btn" data-pal-mood="minimal">📐 미니멀</button>
                </div>
              </div>
            </div><!-- /.mixer-pal-filters-row -->

            <div class="mixer-search-bar">
              <input type="text" id="mixerPalSearchInput" class="mixer-search-input" placeholder="🔍 색상 검색..." value="${escapeMixerHTML(palSearchQ)}" />
              <button type="button" class="mixer-search-clear" id="btnPalSearchClear">지우기</button>
            </div>
            <div class="mixer-palettes-group-grid" id="mixerPalettesGroupGrid"></div>
            <div class="mixer-search-empty" id="mixerPaletteEmpty">선택한 조건에 맞는 색상 테마가 없습니다.</div>
          </div>

          <!-- Step 4. 구도 (Composition) Pane -->
          <div class="mixer-step-pane" id="paneStep4">
            <div class="mixer-cat-tabs" id="mixerCompositionCategoryTabs" role="tablist" aria-label="구도 카테고리">
              <button type="button" class="mixer-cat-btn active" data-composition-cat="all" role="tab" aria-selected="true">🌐 전체</button>
              ${COMPOSITION_CATEGORIES.map(cat => `
                <button type="button" class="mixer-cat-btn"
                  data-composition-cat="${cat.id}" role="tab" aria-selected="false">${cat.label}</button>
              `).join('')}
            </div>
            <div class="mixer-palettes-group-grid" id="mixerCompositionGrid"></div>
            <div class="mixer-search-empty" id="mixerCompositionEmpty">선택한 조건에 맞는 구도가 없습니다.</div>
          </div>

          <!-- Step 5. 타이포그래피 (Typography) Pane -->
          <div class="mixer-step-pane" id="paneStep5">
            <div class="mixer-cat-tabs" id="mixerTypographyCategoryTabs" role="tablist" aria-label="타이포그래피 카테고리">
              <button type="button" class="mixer-cat-btn active" data-typography-cat="all" role="tab" aria-selected="true">🌐 전체</button>
              ${TYPOGRAPHY_CATEGORIES.map(cat => `
                <button type="button" class="mixer-cat-btn"
                  data-typography-cat="${cat.id}" role="tab" aria-selected="false">${cat.label}</button>
              `).join('')}
            </div>
            <div class="mixer-palettes-group-grid" id="mixerTypographyGrid"></div>
            <div class="mixer-search-empty" id="mixerTypographyEmpty">선택한 조건에 맞는 타이포그래피가 없습니다.</div>
          </div>

        </div>

        <!-- 우측 결과 프리뷰 -->
        <div class="mixer-right">
          <div class="mixer-preview-card" id="mixerPreviewCard"></div>
        </div>
      </div>
      <!-- 상단 액션 버튼들 (숨김) -->
      <button type="button" id="btnMixerRandomFixed" class="mixer-utility-btn" style="display:none;"></button>
      <button type="button" id="btnMixerRandom" class="mixer-utility-btn" style="display:none;"></button>
      <button type="button" id="btnMixerReset" class="mixer-utility-btn" style="display:none;"></button>
      <button type="button" id="btnMixerInstRandom" class="mixer-utility-btn" style="display:none;"></button>
      <button type="button" id="btnMixerInstRandomForm" class="mixer-utility-btn" style="display:none;"></button>
    `;

    // 카테고리 전환 바인딩
    container.querySelectorAll('[data-mix-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.mixCat;
        activeCategory = cat;
        // 주제 첫 항목 설정
        if (cat === '__user__') {
          selectedSubjId = userSubjects[0]?.id || selectedSubjId;
        } else {
          const firstSubj = cat === 'all'
            ? Object.values(MIXER_SUBJECTS).flat()[0]
            : MIXER_SUBJECTS[cat]?.[0];
          selectedSubjId = firstSubj ? firstSubj.id : '';
        }
        subjSearchQ = '';
        const si = container.querySelector('#mixerSubjSearchInput');
        if (si) si.value = '';

        updateCategoryTabs();
        renderSubjects();
        updateMixerSummaryBar();
        renderPreviewCard();
      });
    });

    // 스텝퍼 탭 직접 클릭 이벤트 바인딩
    container.querySelectorAll('.mixer-step-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const step = parseInt(tab.dataset.step, 10);
        switchStep(step);
        if (step === 2) {
          renderMediums();
        } else if (step === 3) {
          renderPalettes();
        } else if (step === 4) {
          renderCompositions();
        } else if (step === 5) {
          renderTypographies();
        }
      });
    });

    // 구도 카테고리 필터 클릭 바인딩
    container.querySelectorAll('[data-composition-cat]').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const cat = e.currentTarget.dataset.compositionCat;
        activeCompositionCategory = cat;
        syncCompositionCategoryTabs();
        ensureVisibleCompositionSelection();
        renderCompositions();
        updateMixerSummaryBar();
        renderPreviewCard();
      });
    });

    // 조명 카테고리 필터 클릭 바인딩
    container.querySelectorAll('[data-typography-cat]').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const catValue = e.currentTarget.dataset.typographyCat;
        activeTypographyCategory = catValue;
        syncTypographyCategoryTabs();
        ensureVisibleTypographySelection();
        renderTypographies();
        updateMixerSummaryBar();
        renderPreviewCard();
      });
    });

    container.querySelectorAll('[data-med-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeMediumCategory = btn.dataset.medCat;
        if (activeMediumCategory === '__user__') {
          selectedMediumId = userMediums[0]?.id || selectedMediumId;
        } else if (activeMediumCategory === 'all') {
          selectedMediumId = MIXER_MEDIUMS[0]?.id || selectedMediumId;
        } else {
          selectedMediumId = MIXER_MEDIUMS.find(medium => medium.category === activeMediumCategory)?.id || selectedMediumId;
        }
        medSearchQ = '';
        const mi = container.querySelector('#mixerMedSearchInput');
        if (mi) mi.value = '';
        container.querySelectorAll('[data-med-cat]').forEach(tab => {
          const isActive = tab === btn;
          tab.classList.toggle('active', isActive);
          tab.setAttribute('aria-selected', String(isActive));
        });
        renderMediums();
        updateMixerSummaryBar();
        renderPreviewCard();
      });
    });

    container.querySelectorAll('[data-subj-group]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSubjectGroupFilter = btn.dataset.subjGroup;
        if (activeCategory === '__user__') { activeCategory = 'all'; updateCategoryTabs(); }
        container.querySelectorAll('[data-subj-group]').forEach(tab => {
          tab.classList.toggle('active', tab === btn);
        });
        renderSubjects();
        updateMixerSummaryBar();
        renderPreviewCard();
      });
    });

    container.querySelectorAll('[data-subj-scene]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSubjectSceneFilter = btn.dataset.subjScene;
        if (activeCategory === '__user__') { activeCategory = 'all'; updateCategoryTabs(); }
        container.querySelectorAll('[data-subj-scene]').forEach(tab => {
          tab.classList.toggle('active', tab === btn);
        });
        renderSubjects();
        updateMixerSummaryBar();
        renderPreviewCard();
      });
    });

    container.querySelectorAll('[data-med-group]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeMediumGroupFilter = btn.dataset.medGroup;
        if (activeMediumCategory === '__user__') activeMediumCategory = 'all';
        container.querySelectorAll('[data-med-group]').forEach(tab => {
          tab.classList.toggle('active', tab === btn);
        });
        renderMediums();
        updateMixerSummaryBar();
        renderPreviewCard();
      });
    });

    container.querySelectorAll('[data-med-texture]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeMediumTextureFilter = btn.dataset.medTexture;
        if (activeMediumCategory === '__user__') activeMediumCategory = 'all';
        container.querySelectorAll('[data-med-texture]').forEach(tab => {
          tab.classList.toggle('active', tab === btn);
        });
        renderMediums();
        updateMixerSummaryBar();
        renderPreviewCard();
      });
    });

    // 숨긴 항목 칩 바인딩
    container.querySelector('#btnSubjHiddenChip')?.addEventListener('click', () => openHiddenPresetsModal('subject'));
    container.querySelector('#btnMedHiddenChip')?.addEventListener('click', () => openHiddenPresetsModal('medium'));

    // 내 커스텀 탭 토글 버튼 바인딩
    const subjUserCatBtn = container.querySelector('#btnSubjUserCat');
    const medUserCatBtn  = container.querySelector('#btnMedUserCat');
    if (subjUserCatBtn) {
      subjUserCatBtn.addEventListener('click', () => {
        if (activeCategory === '__user__') {
          activeCategory = 'all';
        } else {
          activeCategory = '__user__';
          selectedSubjId = userSubjects[0]?.id || selectedSubjId;
        }
        updateCategoryTabs();
        renderSubjects();
      });
    }
    if (medUserCatBtn) {
      medUserCatBtn.addEventListener('click', () => {
        if (activeMediumCategory === '__user__') {
          activeMediumCategory = 'all';
        } else {
          activeMediumCategory = '__user__';
          selectedMediumId = userMediums[0]?.id || selectedMediumId;
        }
        renderMediums();
      });
    }

    // 빠른 추가 버튼 바인딩
    const subjWizardBtn = container.querySelector('#btnSubjWizard');
    const subjQuickAdd = container.querySelector('#btnSubjQuickAdd');
    const medQuickAdd  = container.querySelector('#btnMedQuickAdd');
    if (subjWizardBtn) {
      subjWizardBtn.addEventListener('click', openSubjectWizardModal);
    }
    if (subjQuickAdd) {
      subjQuickAdd.addEventListener('click', () => {
        openCustomItemModal({
          type: 'subject',
          onSave: (saved) => {
            userSubjects.push(saved);
            saveUserItems(LS_USER_SUBJ, userSubjects);
            selectedSubjId = saved.id;
            activeCategory = '__user__';
            updateCategoryTabs();
            renderSubjects();
            updateMixerSummaryBar();
            renderPreviewCard();
          }
        });
      });
    }
    if (medQuickAdd) {
      medQuickAdd.addEventListener('click', () => {
        openCustomItemModal({
          type: 'medium',
          onSave: (saved) => {
            userMediums.push(saved);
            saveUserItems(LS_USER_MED, userMediums);
            selectedMediumId = saved.id;
            activeMediumCategory = '__user__';
            renderMediums();
            updateMixerSummaryBar();
            renderPreviewCard();
          }
        });
      });
    }

    // 검색 인풋 바인딩
    const subjSearchInput = container.querySelector('#mixerSubjSearchInput');
    const subjSearchClear = container.querySelector('#btnSubjSearchClear');
    const medSearchInput  = container.querySelector('#mixerMedSearchInput');
    const medSearchClear  = container.querySelector('#btnMedSearchClear');

    if (subjSearchInput) {
      subjSearchInput.addEventListener('input', () => {
        subjSearchQ = subjSearchInput.value;
        renderSubjects();
      });
    }
    if (subjSearchClear) {
      subjSearchClear.addEventListener('click', () => {
        subjSearchQ = '';
        if (subjSearchInput) subjSearchInput.value = '';
        renderSubjects();
      });
    }
    if (medSearchInput) {
      medSearchInput.addEventListener('input', () => {
        medSearchQ = medSearchInput.value;
        renderMediums();
      });
    }
    if (medSearchClear) {
      medSearchClear.addEventListener('click', () => {
        medSearchQ = '';
        if (medSearchInput) medSearchInput.value = '';
        renderMediums();
      });
    }
    const palSearchInput = container.querySelector('#mixerPalSearchInput');
    const palSearchClear = container.querySelector('#btnPalSearchClear');
    if (palSearchInput) {
      palSearchInput.addEventListener('input', () => {
        palSearchQ = palSearchInput.value;
        renderPalettes();
      });
    }
    if (palSearchClear) {
      palSearchClear.addEventListener('click', () => {
        palSearchQ = '';
        activePaletteCategory = 'all';
        activePaletteFilter = 'all';
        activePaletteColorFilter = 'all';
        activePaletteTagFilter = 'all';
        if (palSearchInput) palSearchInput.value = '';
        container.querySelectorAll('[data-palette-cat]').forEach(tab => {
          const isActive = tab.dataset.paletteCat === 'all';
          tab.classList.toggle('active', isActive);
          tab.setAttribute('aria-selected', String(isActive));
        });
        container.querySelectorAll('.mixer-pal-filter-btn[data-pal-filter]').forEach(b => b.classList.toggle('active', b.dataset.palFilter === 'all'));
        container.querySelectorAll('.mixer-pal-color-btn').forEach(b => b.classList.toggle('active', b.dataset.palColor === 'all'));
        container.querySelectorAll('[data-pal-mood]').forEach(b => b.classList.toggle('active', b.dataset.palMood === 'all'));
        renderPalettes();
        updateMixerSummaryBar();
        renderPreviewCard();
      });
    }

    container.querySelectorAll('[data-palette-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        activePaletteCategory = btn.dataset.paletteCat;
        // 색상 계열 필터 초기화
        activePaletteColorFilter = 'all';
        activePaletteTagFilter = 'all';
        container.querySelectorAll('.mixer-pal-color-btn').forEach(b => b.classList.toggle('active', b.dataset.palColor === 'all'));
        container.querySelectorAll('[data-pal-mood]').forEach(b => b.classList.toggle('active', b.dataset.palMood === 'all'));
        const effectivePaletteCategory = getEffectivePaletteCategoryFilter();
        const firstPalette = MIXER_PALETTES.find(palette =>
          (effectivePaletteCategory === 'all' || palette.category === effectivePaletteCategory) &&
          (activePaletteFilter === 'all' || palette.mode === activePaletteFilter) &&
          paletteMatchesColorFilter(palette, activePaletteColorFilter) &&
          paletteMatchesTagFilter(palette, activePaletteTagFilter)
        );
        if (firstPalette) selectedPaletteIdx = MIXER_PALETTES.indexOf(firstPalette);
        container.querySelectorAll('[data-palette-cat]').forEach(tab => {
          const isActive = tab === btn;
          tab.classList.toggle('active', isActive);
          tab.setAttribute('aria-selected', String(isActive));
        });
        renderPalettes();
        updateMixerSummaryBar();
        renderPreviewCard();
      });
    });

    // 팔레트 톤 필터 버튼 바인딩 (data-pal-filter 속성 한정 — 무드 버튼과 충돌 방지)
    container.querySelectorAll('.mixer-pal-filter-btn[data-pal-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.mixer-pal-filter-btn[data-pal-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activePaletteFilter = btn.dataset.palFilter;
        const currentPalette = MIXER_PALETTES[selectedPaletteIdx];
        const effectivePaletteCategory = getEffectivePaletteCategoryFilter();
        if (!currentPalette || (effectivePaletteCategory !== 'all' && currentPalette.category !== effectivePaletteCategory) ||
            (activePaletteFilter !== 'all' && currentPalette.mode !== activePaletteFilter)) {
          const firstPalette = MIXER_PALETTES.find(palette =>
            (effectivePaletteCategory === 'all' || palette.category === effectivePaletteCategory) &&
            (activePaletteFilter === 'all' || palette.mode === activePaletteFilter) &&
            paletteMatchesColorFilter(palette, activePaletteColorFilter) &&
            paletteMatchesTagFilter(palette, activePaletteTagFilter)
          );
          if (firstPalette) selectedPaletteIdx = MIXER_PALETTES.indexOf(firstPalette);
        }
        renderPalettes();
        updateMixerSummaryBar();
        renderPreviewCard();
      });
    });

    // 팔레트 색상 계열 필터 바인딩
    container.querySelectorAll('.mixer-pal-color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.mixer-pal-color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activePaletteColorFilter = btn.dataset.palColor;
        const effectivePaletteCategory = getEffectivePaletteCategoryFilter();
        const firstPalette = MIXER_PALETTES.find(palette =>
          (effectivePaletteCategory === 'all' || palette.category === effectivePaletteCategory) &&
          (activePaletteFilter === 'all' || palette.mode === activePaletteFilter) &&
          paletteMatchesColorFilter(palette, activePaletteColorFilter) &&
          paletteMatchesTagFilter(palette, activePaletteTagFilter)
        );
        if (firstPalette) selectedPaletteIdx = MIXER_PALETTES.indexOf(firstPalette);
        renderPalettes();
        updateMixerSummaryBar();
        renderPreviewCard();
      });
    });

    // 팔레트 무드/분위기 필터 바인딩
    container.querySelectorAll('[data-pal-mood]').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('[data-pal-mood]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activePaletteTagFilter = btn.dataset.palMood;
        const effectivePaletteCategory = getEffectivePaletteCategoryFilter();
        const firstPalette = MIXER_PALETTES.find(palette =>
          (effectivePaletteCategory === 'all' || palette.category === effectivePaletteCategory) &&
          (activePaletteFilter === 'all' || palette.mode === activePaletteFilter) &&
          paletteMatchesColorFilter(palette, activePaletteColorFilter) &&
          paletteMatchesTagFilter(palette, activePaletteTagFilter)
        );
        if (firstPalette) selectedPaletteIdx = MIXER_PALETTES.indexOf(firstPalette);
        renderPalettes();
        updateMixerSummaryBar();
        renderPreviewCard();
      });
    });


    // 모바일 전용 결과 바로가기 앵커 스크롤 바인딩
    const scrollBtn = container.querySelector('#btnScrollToPreview');
    if (scrollBtn) {
      // 화면 폭에 따라 보이기 제어
      if (window.innerWidth <= 900) {
        scrollBtn.style.display = 'inline-flex';
      }
      window.addEventListener('resize', () => {
        if (window.innerWidth <= 900) {
          scrollBtn.style.display = 'inline-flex';
        } else {
          scrollBtn.style.display = 'none';
        }
      });

      scrollBtn.addEventListener('click', () => {
        const previewEl = document.getElementById('mixerPreviewCard');
        if (previewEl) {
          previewEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }



    // 주제 고정 랜덤: 선택된 주제는 유지, 화풍/색상/구도/타이포만 랜덤화
    var btnRandomFixed = container.querySelector('.mixer-utility-btn[id="btnMixerRandomFixed"]') ||
                         document.querySelector('.mixer-utility-btn[id="btnMixerRandomFixed"]');
    if (btnRandomFixed) {
      btnRandomFixed.addEventListener('click', () => {
        // selectedSubjId 유지 (현재 선택된 주제)
        selectedMediumId = MIXER_MEDIUMS[Math.floor(Math.random() * MIXER_MEDIUMS.length)]?.id || '';
        selectedPaletteIdx = Math.floor(Math.random() * MIXER_PALETTES.length);
        activeCategory = 'all';
        activeMediumCategory = 'all';
        activePaletteCategory = 'all';
        activePaletteFilter = 'all';
        activePaletteColorFilter = 'all';
        activePaletteTagFilter = 'all';
        activeSubjectGroupFilter = 'all';
        activeSubjectSceneFilter = 'all';
        activeMediumGroupFilter = 'all';
        activeMediumTextureFilter = 'all';

        // 구도 무작위 선택
        if (Math.random() > 0.5) {
          const comps = MIXER_COMPOSITIONS.filter(c => c.id !== 'none');
          selectedCompositionId = comps[Math.floor(Math.random() * comps.length)].id;
        } else {
          selectedCompositionId = 'none';
        }

        // 타이포그래피 무작위 선택
        if (Math.random() > 0.5) {
          const typographies = MIXER_TYPOGRAPHIES.filter(r => r.id !== 'none');
          selectedTypographyId = typographies[Math.floor(Math.random() * typographies.length)].id;
        } else {
          selectedTypographyId = 'none';
        }

        activeCompositionCategory = 'all';
        activeTypographyCategory = 'all';

        updateMixerSummaryBar();
        renderPreviewCard();
      });
    }

    var btnRandom = container.querySelector('.mixer-utility-btn[id="btnMixerRandom"]') ||
                    document.querySelector('.mixer-utility-btn[id="btnMixerRandom"]');
    if (btnRandom) {
      btnRandom.addEventListener('click', () => {
        const allSubjects = Object.values(MIXER_SUBJECTS).flat();
        selectedSubjId = allSubjects[Math.floor(Math.random() * allSubjects.length)]?.id || '';
        selectedMediumId = MIXER_MEDIUMS[Math.floor(Math.random() * MIXER_MEDIUMS.length)]?.id || '';
        selectedPaletteIdx = Math.floor(Math.random() * MIXER_PALETTES.length);
        activeCategory = 'all';
        activeMediumCategory = 'all';
        activePaletteCategory = 'all';
        activePaletteFilter = 'all';
        activePaletteColorFilter = 'all';
        activePaletteTagFilter = 'all';
        activeSubjectGroupFilter = 'all';
        activeSubjectSceneFilter = 'all';
        activeMediumGroupFilter = 'all';
        activeMediumTextureFilter = 'all';

        // 구도 무작위 선택 (50% 확률로 none 또는 랜덤 프리셋 선택)
        if (Math.random() > 0.5) {
          const comps = MIXER_COMPOSITIONS.filter(c => c.id !== 'none');
          selectedCompositionId = comps[Math.floor(Math.random() * comps.length)].id;
        } else {
          selectedCompositionId = 'none';
        }

        // 타이포그래피 무작위 선택 (50% 확률로 none 또는 랜덤 프리셋 선택)
        if (Math.random() > 0.5) {
          const typographies = MIXER_TYPOGRAPHIES.filter(r => r.id !== 'none');
          selectedTypographyId = typographies[Math.floor(Math.random() * typographies.length)].id;
        } else {
          selectedTypographyId = 'none';
        }

        activeCompositionCategory = 'all';
        activeTypographyCategory = 'all';

        container.querySelectorAll('[data-med-cat]').forEach(tab => {
          const isActive = tab.dataset.medCat === activeMediumCategory;
          tab.classList.toggle('active', isActive);
          tab.setAttribute('aria-selected', String(isActive));
        });
        container.querySelectorAll('[data-palette-cat]').forEach(tab => {
          const isActive = tab.dataset.paletteCat === activePaletteCategory;
          tab.classList.toggle('active', isActive);
          tab.setAttribute('aria-selected', String(isActive));
        });
        container.querySelectorAll('.mixer-pal-filter-btn').forEach(btn => {
          const isAllTone = btn.dataset.palFilter === 'all';
          const isAllMood = btn.dataset.palMood === 'all';
          btn.classList.toggle('active', isAllTone || isAllMood);
        });
        container.querySelectorAll('.mixer-pal-color-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.palColor === 'all');
        });
        updateCategoryTabs();
        renderSubjects();
        renderMediums();
        renderPalettes();
        renderCompositions();
        renderTypographies();
        updateMixerSummaryBar();
        renderPreviewCard();
      });
    }

    var btnReset = container.querySelector('.mixer-utility-btn[id="btnMixerReset"]') ||
                   document.querySelector('.mixer-utility-btn[id="btnMixerReset"]');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        activeCategory = 'all';
        selectedSubjId = 'mix-steel-hot-rolling';
        selectedMediumId = 'med-3d';
        selectedPaletteIdx = 0;
        selectedCompositionId = 'none';
        selectedTypographyId = 'none';
        activeMediumCategory = 'all';
        activePaletteCategory = 'all';
        activeCompositionCategory = 'all';
        activeTypographyCategory = 'all';
        activePaletteFilter = 'all';
        activePaletteColorFilter = 'all';
        activePaletteTagFilter = 'all';
        activeSubjectGroupFilter = 'all';
        activeSubjectSceneFilter = 'all';
        activeMediumGroupFilter = 'all';
        activeMediumTextureFilter = 'all';
        isPaletteOverriddenByUser = false;
        customSubjectKo = ''; customSubjectEn = ''; customSubjectMode = 'en';
        customMediumKo = ''; customMediumEn = ''; customMediumEnSuffix = ''; customMediumSuffixRaw = ''; customMediumMode = 'en';
        customSubjectPresetSourceId = '';
        customMediumPresetSourceId = '';
        subjSearchQ = ''; medSearchQ = ''; palSearchQ = '';
        const si = container.querySelector('#mixerSubjSearchInput');
        const mi = container.querySelector('#mixerMedSearchInput');
        const pi = container.querySelector('#mixerPalSearchInput');
        if (si) si.value = '';
        if (mi) mi.value = '';
        if (pi) pi.value = '';
        container.querySelectorAll('.mixer-pal-filter-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.palFilter === 'all');
        });
        container.querySelectorAll('[data-pal-mood]').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.palMood === 'all');
        });
        container.querySelectorAll('.mixer-pal-color-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.palColor === 'all');
        });
        container.querySelectorAll('[data-subj-group]').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.subjGroup === 'all');
        });
        container.querySelectorAll('[data-subj-scene]').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.subjScene === 'all');
        });
        container.querySelectorAll('[data-med-group]').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.medGroup === 'all');
        });
        container.querySelectorAll('[data-med-texture]').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.medTexture === 'all');
        });
        container.querySelectorAll('[data-med-cat]').forEach(tab => {
          const isActive = tab.dataset.medCat === activeMediumCategory;
          tab.classList.toggle('active', isActive);
          tab.setAttribute('aria-selected', String(isActive));
        });
        container.querySelectorAll('[data-palette-cat]').forEach(tab => {
          const isActive = tab.dataset.paletteCat === activePaletteCategory;
          tab.classList.toggle('active', isActive);
          tab.setAttribute('aria-selected', String(isActive));
        });
        updateCategoryTabs();
        renderSubjects();
        renderMediums();
        renderPalettes();
        renderCompositions();
        renderTypographies();
        updateMixerSummaryBar();
        renderPreviewCard();
        switchStep(1);
      });
    }

    function randomizeInstitutionalVisual() {
      // 주제: 무제
      selectedSubjId = 'none';
      // 화풍: 공공기관 필터 내 랜덤
      const pubinstMeds = MIXER_MEDIUMS.filter(m => PUBINST_MEDIUM_IDS && PUBINST_MEDIUM_IDS.has(m.id));
      if (pubinstMeds.length > 0) {
        selectedMediumId = pubinstMeds[Math.floor(Math.random() * pubinstMeds.length)].id;
      }
      // 색상: 공공기관 필터('official' 카테고리) 내 랜덤
      const pubinstPals = MIXER_PALETTES.filter(p => p.category === 'official');
      if (pubinstPals.length > 0) {
        const chosenPal = pubinstPals[Math.floor(Math.random() * pubinstPals.length)];
        selectedPaletteIdx = MIXER_PALETTES.indexOf(chosenPal);
      } else {
        selectedPaletteIdx = 0;
      }
      // 구도·타이포: 선택 안 함
      selectedCompositionId = 'none';
      selectedTypographyId = 'none';
      // 필터 상태
      activeCategory = 'all';
      activeMediumCategory = 'all';
      activeMediumGroupFilter = 'pubinst';
      activeMediumTextureFilter = 'all';
      activePaletteCategory = 'all';
      activePaletteFilter = 'all';
      activePaletteColorFilter = 'all';
      activePaletteTagFilter = 'official';
      activeSubjectGroupFilter = 'all';
      activeSubjectSceneFilter = 'all';
      activeCompositionCategory = 'all';
      activeTypographyCategory = 'all';
      // 표현군 필터 버튼 UI 동기화
      container.querySelectorAll('[data-med-group]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.medGroup === 'pubinst');
      });
      // 색상 분위기(mood) 필터 버튼 UI 동기화
      container.querySelectorAll('[data-pal-mood]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.palMood === 'official');
      });
      // 톤 필터와 색상 필터는 전체('all')로 초기화
      container.querySelectorAll('.mixer-pal-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.palFilter === 'all');
      });
      container.querySelectorAll('.mixer-pal-color-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.palColor === 'all');
      });
      updateCategoryTabs();
      renderSubjects();
      renderMediums();
      renderPalettes();
      renderCompositions();
      renderTypographies();
      updateMixerSummaryBar();
      renderPreviewCard();
    }

    var btnInstRandom = document.querySelector('#btnMixerInstRandom');
    if (btnInstRandom) {
      btnInstRandom.addEventListener('click', () => {
        randomizeInstitutionalVisual();
        // 홍보 이미지에 자동 적용
        window.setTimeout(() => {
          const applyBtn = document.getElementById('btnMixerApply');
          if (applyBtn) applyBtn.click();
        }, 0);
      });
    }

    var btnInstRandomForm = document.querySelector('#btnMixerInstRandomForm');
    if (btnInstRandomForm) {
      btnInstRandomForm.addEventListener('click', () => {
        randomizeInstitutionalVisual();
        // 양식 이미지에 자동 적용
        window.setTimeout(() => {
          const applyBtn = document.getElementById('btnMixerFormImage');
          if (applyBtn) applyBtn.click();
        }, 0);
      });
    }

    updateCategoryTabs();
    renderSubjects();
    renderMediums();
    renderPalettes();
    renderCompositions();
    renderTypographies();
    updateMixerSummaryBar();
    renderPreviewCard();
    switchStep(1); // 1단계부터 시작
  }

  // ────────────────────────────────────────────────────────────
  // 기존 프리셋 가져오기 피커
  // ────────────────────────────────────────────────────────────
  function openPresetPickerModal({ type, onPick }) {
    const isSubject = type === 'subject';

    // 전체 빌트인 목록 수집
    const allPresets = isSubject
      ? Object.entries(MIXER_SUBJECTS).flatMap(([cat, items]) => items.map(i => ({ ...i, _cat: cat })))
      : MIXER_MEDIUMS.map(m => ({ ...m, _cat: m.category }));

    const existing = document.getElementById('mixerPresetPickerOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'mixerPresetPickerOverlay';
    overlay.className = 'mixer-custom-modal-overlay';
    overlay.style.cssText = 'align-items:flex-start;padding:32px 16px;overflow-y:auto;z-index:10001;';

    overlay.innerHTML = `
      <div class="mixer-custom-modal" style="width:min(560px,95vw);max-height:80vh;display:flex;flex-direction:column;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <h3 style="margin:0;font-size:15px;">📥 기존 프리셋 가져오기 — ${isSubject ? '주제' : '화풍'}</h3>
          <button id="ppcClose" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-secondary,#64748b);">&times;</button>
        </div>
        <p style="margin:0 0 10px;font-size:12px;color:var(--text-secondary,#64748b);">선택한 프리셋을 내 커스텀으로 복사해 자유롭게 수정할 수 있습니다.</p>
        <input id="ppcSearch" type="text" placeholder="이름·설명 검색..." style="width:100%;box-sizing:border-box;border:1px solid var(--line,#dbe2ea);border-radius:8px;padding:7px 10px;font-size:13px;margin-bottom:10px;background:var(--surface,#fff);color:var(--ink,#1a1f2b);" />
        <div id="ppcList" style="overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:4px;"></div>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('#ppcClose').addEventListener('click', () => overlay.remove());

    const listEl = overlay.querySelector('#ppcList');
    const searchEl = overlay.querySelector('#ppcSearch');

    function renderList(q) {
      const lower = (q || '').toLowerCase();
      const filtered = allPresets.filter(p => {
        const text = `${p.nameKo} ${p.desc || ''} ${p.prompt || p.prefix || ''}`.toLowerCase();
        return !lower || text.includes(lower);
      });

      if (filtered.length === 0) {
        listEl.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-secondary,#64748b);font-size:13px;">검색 결과 없음</div>`;
        return;
      }

      listEl.innerHTML = filtered.map(p => `
        <button class="ppc-item" data-id="${escapeMixerHTML(p.id)}"
          style="display:flex;align-items:flex-start;gap:10px;padding:9px 12px;border:1px solid var(--line,#dbe2ea);border-radius:8px;background:var(--surface,#fff);cursor:pointer;text-align:left;width:100%;">
          <span style="font-size:20px;flex-shrink:0;">${escapeMixerHTML(p.emoji || '')}</span>
          <div style="min-width:0;">
            <div style="font-size:13px;font-weight:700;color:var(--ink,#1a1f2b);">${escapeMixerHTML(p.nameKo)}</div>
            <div style="font-size:11px;color:var(--text-secondary,#64748b);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeMixerHTML(p.desc || p.prompt || p.prefix || '')}</div>
          </div>
        </button>
      `).join('');

      listEl.querySelectorAll('.ppc-item').forEach(btn => {
        btn.addEventListener('mouseenter', () => { btn.style.borderColor = 'var(--accent,#4361ee)'; btn.style.background = 'var(--surface-2,#f3f6fa)'; });
        btn.addEventListener('mouseleave', () => { btn.style.borderColor = 'var(--line,#dbe2ea)'; btn.style.background = 'var(--surface,#fff)'; });
        btn.addEventListener('click', () => {
          const preset = filtered.find(p => p.id === btn.dataset.id);
          if (!preset) return;
          overlay.remove();
          // 새 ID 부여하여 원본 불변
          const copy = { ...preset, id: (isSubject ? 'usubj-' : 'umed-') + Date.now(), categoryId: '' };
          onPick(copy);
        });
      });
    }

    renderList('');
    searchEl.addEventListener('input', () => renderList(searchEl.value));
    searchEl.focus();
  }

  // ────────────────────────────────────────────────────────────
  // 커스텀 관리 패널
  // ────────────────────────────────────────────────────────────
  function openManagePanel() {
    const existing = document.getElementById('mixerManagePanelOverlay');
    if (existing) { existing.remove(); return; }

    const overlay = document.createElement('div');
    overlay.id = 'mixerManagePanelOverlay';
    overlay.className = 'mixer-custom-modal-overlay';
    overlay.style.cssText = 'align-items:flex-start;padding:32px 16px;overflow-y:auto;';

    overlay.innerHTML = `
      <div class="mixer-custom-modal" style="width:min(640px,95vw);max-height:85vh;overflow-y:auto;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <h3 style="margin:0;font-size:16px;">커스텀 주제·화풍 관리</h3>
          <button id="mmpClose" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-secondary,#64748b);">&times;</button>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:16px;">
          <button class="mmp-tab active" data-mmp-tab="subject" style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--line,#dbe2ea);cursor:pointer;font-size:13px;background:var(--accent,#4361ee);color:var(--on-accent,#fff);">📋 주제 관리</button>
          <button class="mmp-tab" data-mmp-tab="medium" style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--line,#dbe2ea);cursor:pointer;font-size:13px;background:var(--surface-2,#f3f6fa);color:var(--ink,#1a1f2b);">🎨 화풍 관리</button>
        </div>
        <div id="mmpBody"></div>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('#mmpClose').addEventListener('click', () => overlay.remove());

    let mmpActiveType = 'subject';

    function renderMmpBody() {
      const body = overlay.querySelector('#mmpBody');
      const isSubject = mmpActiveType === 'subject';
      const cats = isSubject ? userSubjectCats : userMediumCats;
      const items = isSubject ? userSubjects : userMediums;
      const LS_CATS = isSubject ? LS_USER_SUBJ_CATS : LS_USER_MED_CATS;
      const LS_ITEMS = isSubject ? LS_USER_SUBJ : LS_USER_MED;
      const typeLabel = isSubject ? '주제' : '화풍';

      let html = `<div style="margin-bottom:10px;display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap;">
        <button id="mmpImportPreset" style="padding:7px 14px;border-radius:8px;background:var(--surface-2,#f3f6fa);color:var(--accent,#4361ee);border:1px solid var(--accent,#4361ee);cursor:pointer;font-size:13px;">📥 기존 프리셋 가져오기</button>
        <button id="mmpAddCat" style="padding:7px 14px;border-radius:8px;background:var(--accent,#4361ee);color:var(--on-accent,#fff);border:none;cursor:pointer;font-size:13px;">+ 카테고리 추가</button>
      </div>`;

      if (cats.length === 0) {
        html += `<div style="text-align:center;padding:24px;color:var(--text-secondary,#64748b);font-size:13px;">카테고리가 없습니다.<br>위 버튼으로 카테고리를 먼저 추가하세요.</div>`;
      }

      cats.forEach(cat => {
        const catItems = items.filter(i => i.categoryId === cat.id);
        html += `
          <div class="mmp-cat-block" data-cat-id="${escapeMixerHTML(cat.id)}" style="border:1px solid var(--line,#dbe2ea);border-radius:10px;margin-bottom:12px;overflow:hidden;">
            <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--surface-2,#f3f6fa);border-bottom:1px solid var(--line,#dbe2ea);">
              <span style="font-size:18px;">${escapeMixerHTML(cat.emoji)}</span>
              <strong style="flex:1;font-size:14px;">${escapeMixerHTML(cat.name)}</strong>
              <span style="font-size:12px;color:var(--text-secondary,#64748b);">${catItems.length}개</span>
              <button class="mmp-cat-edit" data-cat-id="${escapeMixerHTML(cat.id)}" style="padding:4px 8px;border-radius:6px;border:1px solid var(--line,#dbe2ea);background:var(--surface-1,#fff);cursor:pointer;font-size:12px;">편집</button>
              <button class="mmp-cat-del" data-cat-id="${escapeMixerHTML(cat.id)}" style="padding:4px 8px;border-radius:6px;border:1px solid #fca5a5;background:#fff;color:#dc2626;cursor:pointer;font-size:12px;">삭제</button>
            </div>
            <div style="padding:8px 12px;">
              ${catItems.map(item => `
                <div class="mmp-item-row" data-item-id="${escapeMixerHTML(item.id)}" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--line,#f1f5f9);">
                  <span>${escapeMixerHTML(item.emoji || '')}</span>
                  <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:600;">${escapeMixerHTML(item.nameKo)}</div>
                    <div style="font-size:11px;color:var(--text-secondary,#64748b);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeMixerHTML(isSubject ? (item.prompt || '') : (item.prefix || ''))}</div>
                  </div>
                  <button class="mmp-item-edit" data-item-id="${escapeMixerHTML(item.id)}" style="padding:3px 8px;border-radius:6px;border:1px solid var(--line,#dbe2ea);background:var(--surface-1,#fff);cursor:pointer;font-size:11px;">편집</button>
                  <button class="mmp-item-del" data-item-id="${escapeMixerHTML(item.id)}" style="padding:3px 8px;border-radius:6px;border:1px solid #fca5a5;background:#fff;color:#dc2626;cursor:pointer;font-size:11px;">삭제</button>
                </div>
              `).join('')}
              <button class="mmp-item-add" data-cat-id="${escapeMixerHTML(cat.id)}" style="width:100%;margin-top:6px;padding:6px;border-radius:7px;border:1.5px dashed var(--accent,#4361ee);background:none;color:var(--accent,#4361ee);cursor:pointer;font-size:12px;">+ ${typeLabel} 추가</button>
            </div>
          </div>
        `;
      });

      // 미분류 항목
      const uncategorized = items.filter(i => !i.categoryId || !cats.find(c => c.id === i.categoryId));
      if (uncategorized.length > 0) {
        html += `
          <div style="border:1px dashed var(--line,#dbe2ea);border-radius:10px;margin-bottom:12px;overflow:hidden;">
            <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--surface-2,#f3f6fa);border-bottom:1px solid var(--line,#dbe2ea);">
              <span style="font-size:18px;">📂</span>
              <strong style="flex:1;font-size:14px;">미분류</strong>
              <span style="font-size:12px;color:var(--text-secondary,#64748b);">${uncategorized.length}개</span>
            </div>
            <div style="padding:8px 12px;">
              ${uncategorized.map(item => `
                <div class="mmp-item-row" data-item-id="${escapeMixerHTML(item.id)}" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--line,#f1f5f9);">
                  <span>${escapeMixerHTML(item.emoji || '')}</span>
                  <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:600;">${escapeMixerHTML(item.nameKo)}</div>
                    <div style="font-size:11px;color:var(--text-secondary,#64748b);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeMixerHTML(isSubject ? (item.prompt || '') : (item.prefix || ''))}</div>
                  </div>
                  <button class="mmp-item-edit" data-item-id="${escapeMixerHTML(item.id)}" style="padding:3px 8px;border-radius:6px;border:1px solid var(--line,#dbe2ea);background:var(--surface-1,#fff);cursor:pointer;font-size:11px;">편집</button>
                  <button class="mmp-item-del" data-item-id="${escapeMixerHTML(item.id)}" style="padding:3px 8px;border-radius:6px;border:1px solid #fca5a5;background:#fff;color:#dc2626;cursor:pointer;font-size:11px;">삭제</button>
                </div>
              `).join('')}
              <button class="mmp-item-add" data-cat-id="" style="width:100%;margin-top:6px;padding:6px;border-radius:7px;border:1.5px dashed var(--accent,#4361ee);background:none;color:var(--accent,#4361ee);cursor:pointer;font-size:12px;">+ ${typeLabel} 추가</button>
            </div>
          </div>
        `;
      }

      // 카테고리도 없고 항목도 없을 때 바로 추가 버튼
      if (cats.length === 0 && uncategorized.length === 0) {
        html += `<button class="mmp-item-add" data-cat-id="" style="width:100%;padding:10px;border-radius:7px;border:1.5px dashed var(--accent,#4361ee);background:none;color:var(--accent,#4361ee);cursor:pointer;font-size:13px;">+ ${typeLabel} 추가 (미분류)</button>`;
      }

      body.innerHTML = html;

      // ── 이벤트 바인딩 ──
      body.querySelector('#mmpImportPreset')?.addEventListener('click', () => {
        openPresetPickerModal({ type: mmpActiveType, onPick: (preset) => {
          const defaultCatId = null;
          openCustomItemModal({ type: mmpActiveType, item: preset, defaultCatId, onSave: (saved) => {
            if (isSubject) { userSubjects.push(saved); saveUserItems(LS_USER_SUBJ, userSubjects); renderSubjects(); }
            else { userMediums.push(saved); saveUserItems(LS_USER_MED, userMediums); renderMediums(); }
            renderMmpBody();
          }});
        }});
      });

      body.querySelector('#mmpAddCat')?.addEventListener('click', () => {
        openUserCatModal({ type: mmpActiveType, onSave: (saved) => {
          if (isSubject) { userSubjectCats.push(saved); saveUserItems(LS_CATS, userSubjectCats); }
          else { userMediumCats.push(saved); saveUserItems(LS_CATS, userMediumCats); }
          renderMmpBody();
          if (isSubject) renderSubjects(); else renderMediums();
        }});
      });

      body.querySelectorAll('.mmp-cat-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          const arr = isSubject ? userSubjectCats : userMediumCats;
          const cat = arr.find(c => c.id === btn.dataset.catId);
          if (!cat) return;
          openUserCatModal({ type: mmpActiveType, cat, onSave: (saved) => {
            const idx = arr.findIndex(c => c.id === saved.id);
            if (idx >= 0) arr[idx] = saved;
            saveUserItems(LS_CATS, arr);
            renderMmpBody();
            if (isSubject) renderSubjects(); else renderMediums();
          }});
        });
      });

      body.querySelectorAll('.mmp-cat-del').forEach(btn => {
        btn.addEventListener('click', () => {
          const deleted = deleteUserCategory(mmpActiveType, btn.dataset.catId, isSubject ? activeUserSubjCat : activeUserMedCat);
          if (deleted) renderMmpBody();
        });
      });

      body.querySelectorAll('.mmp-item-add').forEach(btn => {
        btn.addEventListener('click', () => {
          const defaultCatId = btn.dataset.catId || null;
          openCustomItemModal({ type: mmpActiveType, defaultCatId, onSave: (saved) => {
            if (isSubject) { userSubjects.push(saved); saveUserItems(LS_USER_SUBJ, userSubjects); renderSubjects(); }
            else { userMediums.push(saved); saveUserItems(LS_USER_MED, userMediums); renderMediums(); }
            renderMmpBody();
          }});
        });
      });

      body.querySelectorAll('.mmp-item-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          const arr = isSubject ? userSubjects : userMediums;
          const item = arr.find(i => i.id === btn.dataset.itemId);
          if (!item) return;
          openCustomItemModal({ type: mmpActiveType, item, onSave: (saved) => {
            const idx = arr.findIndex(i => i.id === saved.id);
            if (idx >= 0) arr[idx] = saved;
            if (isSubject) { userSubjects = arr; saveUserItems(LS_USER_SUBJ, userSubjects); renderSubjects(); }
            else { userMediums = arr; saveUserItems(LS_USER_MED, userMediums); renderMediums(); }
            renderMmpBody();
            renderPreviewCard();
          }});
        });
      });

      body.querySelectorAll('.mmp-item-del').forEach(btn => {
        btn.addEventListener('click', () => {
          const arr = isSubject ? userSubjects : userMediums;
          const item = arr.find(i => i.id === btn.dataset.itemId);
          if (!item || !confirm(`"${item.nameKo}" 항목을 삭제하겠습니까?`)) return;
          const newArr = arr.filter(i => i.id !== item.id);
          if (isSubject) {
            userSubjects = newArr; saveUserItems(LS_USER_SUBJ, userSubjects);
            if (selectedSubjId === item.id) selectedSubjId = Object.values(MIXER_SUBJECTS).flat()[0]?.id || '';
            renderSubjects();
          } else {
            userMediums = newArr; saveUserItems(LS_USER_MED, userMediums);
            if (selectedMediumId === item.id) selectedMediumId = MIXER_MEDIUMS[0]?.id || '';
            renderMediums();
          }
          renderMmpBody();
          renderPreviewCard();
        });
      });
    }

    // 탭 전환
    overlay.querySelectorAll('.mmp-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        mmpActiveType = tab.dataset.mmpTab;
        overlay.querySelectorAll('.mmp-tab').forEach(t => {
          const isActive = t === tab;
          t.style.background = isActive ? 'var(--accent,#4361ee)' : 'var(--surface-2,#f3f6fa)';
          t.style.color = isActive ? 'var(--on-accent,#fff)' : 'var(--ink,#1a1f2b)';
        });
        renderMmpBody();
      });
    });

    renderMmpBody();
  }

  // 단계(Step) 전환 함수
  function switchStep(step) {
    activeStep = step;
    const container = document.getElementById('conceptMixerContainer');
    if (!container) return;

    if (step === 3) {
      const selectedPalette = MIXER_PALETTES[selectedPaletteIdx];
      if (selectedPalette) {
        activePaletteCategory = selectedPalette.category || 'all';
        activePaletteFilter = 'all';
        activePaletteColorFilter = 'all';
      }
    } else if (step === 4) {
      const selectedComp = resolveMixerComposition();
      if (selectedComp) {
        activeCompositionCategory = selectedComp.category || 'all';
      }
      syncCompositionCategoryTabs();
    } else if (step === 5) {
      const selectedTypo = resolveMixerTypography();
      if (selectedTypo) {
        activeTypographyCategory = selectedTypo.category || 'all';
      }
      syncTypographyCategoryTabs();
    }

    container.querySelectorAll('.mixer-step-tab').forEach(tab => {
      const tabStep = parseInt(tab.dataset.step, 10);
      tab.classList.toggle('active', tabStep === step);
      tab.classList.toggle('completed', tabStep < step);

      const numSpan = tab.querySelector('.step-num');
      if (numSpan) {
        if (tabStep < step) {
          numSpan.textContent = '✓';
        } else {
          numSpan.textContent = tabStep;
        }
      }
    });

    container.querySelectorAll('.mixer-step-pane').forEach(pane => {
      const paneId = pane.id;
      pane.classList.toggle('active', paneId === `paneStep${step}`);
    });

    updateMixerSummaryBar();
  }

  function updateCategoryTabs() {
    const container = document.getElementById('conceptMixerContainer');
    if (!container) return;
    container.querySelectorAll('[data-mix-cat]').forEach(btn => {
      const isActive = btn.dataset.mixCat === activeCategory;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });
  }

  // 숨긴 기본 프리셋 복원 모달
  function openHiddenPresetsModal(type) {
    const isSubject = type === 'subject';
    const deletedIds = isSubject ? DELETED_PRESET_IDS.subjects : DELETED_PRESET_IDS.mediums;
    if (deletedIds.size === 0) return;

    const existing = document.getElementById('mixerHiddenPresetsOverlay');
    if (existing) existing.remove();

    const items = isSubject
      ? Object.values(MIXER_SUBJECTS).flat().filter(s => deletedIds.has(s.id))
      : MIXER_MEDIUMS.filter(m => deletedIds.has(m.id));

    const overlay = document.createElement('div');
    overlay.id = 'mixerHiddenPresetsOverlay';
    overlay.className = 'mixer-custom-modal-overlay';
    overlay.innerHTML = `
      <div class="mixer-custom-modal" style="max-width:480px;">
        <h3>숨긴 ${isSubject ? '주제' : '화풍'} 프리셋 (${items.length}개)</h3>
        <p style="font-size:13px;color:var(--text-secondary,#64748b);margin:0 0 16px;">복원 버튼을 누르면 목록에 다시 표시됩니다.</p>
        <div id="hiddenPresetList" style="display:flex;flex-direction:column;gap:8px;max-height:400px;overflow-y:auto;">
          ${items.map(item => `
            <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--line,#dbe2ea);border-radius:8px;background:var(--surface-1,#fff);">
              <span style="font-size:18px;">${escapeMixerHTML(item.emoji || '')}</span>
              <div style="flex:1;min-width:0;">
                <div style="font-weight:600;font-size:13px;">${escapeMixerHTML(item.nameKo)}</div>
                <div style="font-size:11px;color:var(--text-secondary,#64748b);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeMixerHTML(item.desc || '')}</div>
              </div>
              <button class="restore-btn" data-id="${escapeMixerHTML(item.id)}" style="flex-shrink:0;padding:5px 12px;border-radius:6px;border:1.5px solid var(--accent,#4361ee);background:none;color:var(--accent,#4361ee);font-size:12px;font-weight:600;cursor:pointer;">복원</button>
            </div>
          `).join('')}
        </div>
        <div class="mixer-custom-modal-actions" style="margin-top:16px;">
          <button id="hiddenPresetsClose" type="button">닫기</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.querySelector('#hiddenPresetsClose').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelectorAll('.restore-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (!clearAdminPresetOverride(type, id)) return;
        deletedIds.delete(id);
        btn.closest('div[style]').remove();
        if (isSubject) { renderSubjects(); updateMixerSummaryBar(); renderPreviewCard(); }
        else { renderMediums(); updateMixerSummaryBar(); renderPreviewCard(); }
        if (deletedIds.size === 0) overlay.remove();
      });
    });
  }

  // 사용자 카테고리 추가/편집 모달
  function openUserCatModal({ type, cat = null, onSave }) {
    const existing = document.getElementById('mixerUserCatModalOverlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.className = 'mixer-custom-modal-overlay';
    overlay.id = 'mixerUserCatModalOverlay';
    overlay.innerHTML = `
      <div class="mixer-custom-modal">
        <h3>${cat ? '카테고리 편집' : '새 카테고리 추가'}</h3>
        <div>
          <label>이모지</label>
          <input id="uccEmoji" maxlength="4" value="${escapeMixerHTML(cat?.emoji || '📁')}" style="width:60px" />
        </div>
        <div>
          <label>카테고리 이름</label>
          <input id="uccName" placeholder="예: 수소에너지 프로젝트" value="${escapeMixerHTML(cat?.name || '')}" />
        </div>
        <div class="mixer-custom-modal-actions">
          <button id="uccCancel">취소</button>
          <button id="uccSave" class="save-btn">저장</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#uccCancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('#uccSave').addEventListener('click', () => {
      const emoji = overlay.querySelector('#uccEmoji').value.trim() || '📁';
      const name  = overlay.querySelector('#uccName').value.trim();
      if (!name) { alert('카테고리 이름을 입력하세요.'); return; }
      const saved = { id: cat?.id || ('ucat-' + type + '-' + Date.now()), emoji, name };
      onSave(saved);
      overlay.remove();
    });
    setTimeout(() => overlay.querySelector('#uccName').focus(), 50);
  }

  // 사용자 커스텀 항목 추가/편집 모달
  function openCustomItemModal({ type, item = null, defaultCatId = null, onSave }) {
    const isSubject = type === 'subject';
    const cats = isSubject ? userSubjectCats : userMediumCats;
    const existing = document.getElementById('mixerCustomItemModalOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'mixer-custom-modal-overlay';
    overlay.id = 'mixerCustomItemModalOverlay';

    const emojiVal  = item?.emoji  || '✨';
    const nameVal   = item?.nameKo || '';
    const descVal   = item?.desc   || '';
    const descKoVal = item?.descKo || '';
    const promptVal = isSubject ? (item?.prompt || '') : (item?.prefix || '');
    const suffixVal = isSubject ? '' : (item?.suffix || '');
    const curCatId  = item?.categoryId || defaultCatId || (cats[0]?.id || '');
    const curGroup  = item?.group || (isSubject ? 'mfg' : 'render3d');
    const curSecondary = isSubject ? (item?.scene || 'facility') : (item?.texture || 'glossy');

    const catOptions = cats.map(c =>
      `<option value="${escapeMixerHTML(c.id)}" ${c.id === curCatId ? 'selected' : ''}>${escapeMixerHTML(c.emoji)} ${escapeMixerHTML(c.name)}</option>`
    ).join('');

    const primaryLabel    = isSubject ? '주제군' : '표현군';
    const secondaryLabel  = isSubject ? '장면' : '질감';
    const primaryOptions  = isSubject
      ? [['mfg','🏭 제조·생산'],['knowledge','💡 지식·서비스'],['public','🏛 공공·정책'],['urban','🏙 도시·인프라'],['life','🎨 생활·문화'],['future','🌍 미래·환경']]
          .map(([k,l]) => `<option value="${k}" ${k===curGroup?'selected':''}>${l}</option>`).join('')
      : [['render3d','🧊 3D·공간'],['graphic','🎨 그래픽·회화'],['photo','📷 사진·실사'],['craft','🧶 공예·재질'],['uiinfo','📋 UI·정보'],['experimental','🧪 실험·서브컬처']]
          .map(([k,l]) => `<option value="${k}" ${k===curGroup?'selected':''}>${l}</option>`).join('');
    const secondaryOptions = isSubject
      ? Object.entries(SUBJ_SCENE_LABELS).filter(([k])=>k!=='all').map(([k,l])=>`<option value="${k}" ${k===curSecondary?'selected':''}>${l}</option>`).join('')
      : Object.entries(MED_TEXTURE_LABELS).filter(([k])=>k!=='all').map(([k,l])=>`<option value="${k}" ${k===curSecondary?'selected':''}>${l}</option>`).join('');

    const title = item ? '항목 편집' : (isSubject ? '새 주제 추가' : '새 화풍 추가');

    overlay.innerHTML = `
      <div class="mixer-custom-modal mixer-admin-preset-modal">
        <div class="mixer-admin-modal-head">
          <h3>${title}</h3>
          <p class="mixer-admin-preset-note">이름과 영문 프롬프트는 필수 항목입니다. 한글 설명을 입력하면 자동 번역으로 영문 프롬프트를 채울 수 있습니다.</p>
        </div>
        <div class="mixer-admin-layout">
          <div class="mixer-admin-row">
            <div class="mixer-admin-section mixer-admin-stack">
              <div class="mixer-admin-section-header">
                <p class="mixer-admin-section-title">기본 정보</p>
                <p class="mixer-admin-section-caption">카드에 표시되는 영역</p>
              </div>
              <div class="mixer-admin-inline-grid">
                <div>
                  <label>이모지</label>
                  <input id="mcmEmoji" class="mixer-admin-emoji-input" maxlength="4" value="${escapeMixerHTML(emojiVal)}" />
                </div>
                <div>
                  <label>표시 이름</label>
                  <input id="mcmName" placeholder="${isSubject ? '예: 수소연료전지' : '예: 수채화 일러스트'}" value="${escapeMixerHTML(nameVal)}" />
                </div>
              </div>
              <div class="mixer-admin-card">
                <label>짧은 설명</label>
                <input id="mcmDesc" placeholder="${isSubject ? '예: 수소와 산소의 전기화학 반응' : '예: 부드러운 수채 물감 번짐 효과'}" value="${escapeMixerHTML(descVal)}" />
              </div>
            </div>
            <div class="mixer-admin-card mixer-admin-stack">
              <p class="mixer-admin-card-title">카테고리 & 필터</p>
              <div>
                <label>내 커스텀 카테고리</label>
                <select id="mcmCat" style="width:100%;padding:8px 10px;border:1px solid var(--line,#dbe2ea);border-radius:8px;font-size:13px;background:var(--surface-1,#fff);color:var(--ink,#1a1f2b);">
                  ${cats.length ? catOptions : '<option value="">카테고리 없음</option>'}
                </select>
              </div>
              <div class="mixer-admin-filter-grid">
                <div>
                  <label>${primaryLabel}</label>
                  <select id="mcmFilterPrimary">${primaryOptions}</select>
                </div>
                <div>
                  <label>${secondaryLabel}</label>
                  <select id="mcmFilterSecondary">${secondaryOptions}</select>
                </div>
              </div>
            </div>
          </div>
          <div class="mixer-admin-workspace">
            <div class="mixer-admin-section mixer-admin-stack">
              <div class="mixer-admin-section-header">
                <p class="mixer-admin-section-title">한글 설명 (번역용)</p>
                <p class="mixer-admin-section-caption">한글로 입력 후 번역 버튼을 누르면 아래 영문 입력이 채워집니다.</p>
              </div>
              <div>
                <textarea id="mcmDescKo" rows="4" placeholder="${isSubject ? '예: 수소와 산소가 반응하는 연료전지 단면의 빛나는 막...' : '예: 부드러운 수채 물감이 번지는 감성적인 일러스트 스타일...'}">${escapeMixerHTML(descKoVal)}</textarea>
              </div>
              <div class="mixer-admin-translate-bar">
                <button id="mcmTranslate" type="button">${isSubject ? '한글 이름/설명 → 영문 프롬프트' : '한글 이름/설명 → prefix/suffix'}</button>
                <span class="mixer-admin-translate-status" id="mcmTranslateStatus">한글 내용을 먼저 다듬고 번역 버튼을 누르면 아래 영문 입력이 자동으로 채워집니다.</span>
              </div>
            </div>
            <div class="mixer-admin-section mixer-admin-stack">
              <div class="mixer-admin-section-header">
                <p class="mixer-admin-section-title">영문 프롬프트</p>
                <p class="mixer-admin-section-caption">생성 품질에 직접 반영되는 값</p>
              </div>
              <p class="mixer-admin-prompt-note">${isSubject ? '주제 프롬프트는 한 문장으로 명확하게 작성하세요.' : '화풍은 prefix로 핵심 스타일을, suffix로 질감·조명 디테일을 분리하세요.'}</p>
              <div class="mixer-admin-prompt-grid">
                <div>
                  <label>${isSubject ? '실제 주제 프롬프트' : '앞 설명 prefix'}</label>
                  <textarea id="mcmPrompt" rows="5" placeholder="${isSubject ? 'hydrogen fuel cell cross-section with glowing blue membrane' : 'watercolor illustration of'}">${escapeMixerHTML(promptVal)}</textarea>
                </div>
                ${!isSubject ? `<div>
                  <label>뒤 설명 suffix</label>
                  <textarea id="mcmSuffix" rows="5" placeholder="watercolor painting, soft edges, paper texture">${escapeMixerHTML(suffixVal)}</textarea>
                </div>` : ''}
              </div>
            </div>
          </div>
        </div>
        <div class="mixer-custom-modal-actions">
          <button id="mcmCancel" type="button">취소</button>
          <button id="mcmSave" type="button" class="save-btn">저장</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#mcmCancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    // 자동번역
    const translateBtn = overlay.querySelector('#mcmTranslate');
    const translateStatus = overlay.querySelector('#mcmTranslateStatus');
    const setStatus = (msg, tone = 'muted') => {
      if (!translateStatus) return;
      translateStatus.textContent = msg;
      translateStatus.style.color = tone === 'error' ? 'var(--status-error, #dc2626)' : (tone === 'success' ? 'var(--status-success, #059669)' : 'var(--ink-faint, #64748b)');
    };
    translateBtn?.addEventListener('click', async () => {
      const nameKo = overlay.querySelector('#mcmName').value.trim();
      const descKo = overlay.querySelector('#mcmDescKo').value.trim();
      if (!nameKo && !descKo) { setStatus('한글 이름 또는 설명을 먼저 입력해 주세요.', 'error'); return; }
      translateBtn.disabled = true;
      translateBtn.textContent = '번역 중...';
      setStatus('번역 API 호출 중...');
      try {
        if (isSubject) {
          const src = [nameKo, descKo].filter(Boolean).join(', ');
          overlay.querySelector('#mcmPrompt').value = (await translateWithMyMemory(src)) || src;
        } else {
          const pInput = overlay.querySelector('#mcmPrompt');
          const sInput = overlay.querySelector('#mcmSuffix');
          if (nameKo) pInput.value = ((await translateWithMyMemory(nameKo)) || nameKo) + ' style illustration of';
          if (descKo && sInput) sInput.value = (await translateWithMyMemory(descKo)) || descKo;
        }
        setStatus('번역 완료. 영문 입력란을 확인하세요.', 'success');
      } catch {
        setStatus('번역 실패. 네트워크를 확인하세요.', 'error');
      } finally {
        translateBtn.disabled = false;
        translateBtn.textContent = isSubject ? '한글 이름/설명 → 영문 프롬프트' : '한글 이름/설명 → prefix/suffix';
      }
    });

    overlay.querySelector('#mcmSave').addEventListener('click', () => {
      const emoji      = overlay.querySelector('#mcmEmoji').value.trim() || '✨';
      const nameKo     = overlay.querySelector('#mcmName').value.trim();
      const desc       = overlay.querySelector('#mcmDesc').value.trim();
      const descKo     = overlay.querySelector('#mcmDescKo').value.trim();
      const prompt     = overlay.querySelector('#mcmPrompt').value.trim();
      const suffix     = isSubject ? '' : (overlay.querySelector('#mcmSuffix')?.value.trim() || '');
      const categoryId = overlay.querySelector('#mcmCat')?.value || '';
      const group      = overlay.querySelector('#mcmFilterPrimary').value;
      const secondary  = overlay.querySelector('#mcmFilterSecondary').value;

      if (!nameKo || !prompt) { alert('이름과 영문 프롬프트는 필수입니다.'); return; }

      const saved = {
        id: item?.id || ('user-' + (isSubject ? 's' : 'm') + '-' + Date.now()),
        emoji, nameKo, desc, descKo, categoryId,
        ...(isSubject
          ? { prompt, group, scene: secondary }
          : { prefix: prompt, suffix, category: 'user', group, texture: secondary })
      };
      onSave(saved);
      overlay.remove();
    });
    setTimeout(() => overlay.querySelector('#mcmName').focus(), 50);
  }

  function openAdminPresetModal({ type, item, onSave }) {
    if (!item) return;

    const isSubject = type === 'subject';
    const original = isSubject ? findOriginalBuiltInSubjectById(item.id) : findOriginalBuiltInMediumById(item.id);
    const overrides = loadAdminPresetOverrides();
    const hasOverride = !!(overrides[isSubject ? 'subjects' : 'mediums'] || {})[item.id];
    const existing = document.getElementById('mixerAdminPresetModalOverlay');
    if (existing) existing.remove();

    // renderSubjects/renderMediums는 매번 MIXER_SUBJECTS/MIXER_MEDIUMS를 얕은 복제한 카드 객체를
    // 넘기므로, 여기서 받은 item은 화면용 사본이다. 저장/복원 시에는 실제 원본(liveItem)을
    // 함께 패치해야 다음 렌더에서도 값이 유지된다.
    const liveItem = isSubject ? findBuiltInSubjectById(item.id) : MIXER_MEDIUMS.find(m => m.id === item.id);

    const overlay = document.createElement('div');
    overlay.className = 'mixer-custom-modal-overlay';
    overlay.id = 'mixerAdminPresetModalOverlay';

    const promptVal = isSubject ? (item.prompt || '') : (item.prefix || '');
    const suffixVal = isSubject ? '' : (item.suffix || '');
    const primaryLabel = isSubject ? '주제군' : '표현군';
    const secondaryLabel = isSubject ? '장면' : '질감';
    const currentCategory = isSubject ? (item._cat || item.category || 'steel') : (item.category || 'tech3d');

    overlay.innerHTML = `
      <div class="mixer-custom-modal mixer-admin-preset-modal">
        <div class="mixer-admin-modal-head">
          <h3>${isSubject ? '주제 프리셋 수정' : '화풍/기법 프리셋 수정'}</h3>
          <p class="mixer-admin-preset-note">상단에서 카드 표시 정보와 필터 분류를, 하단에서 실제 프롬프트 구조를 편집합니다. 수정값은 기기 로컬에 저장됩니다.</p>
        </div>
        <div class="mixer-admin-layout">
          <div class="mixer-admin-row">
            <div class="mixer-admin-section mixer-admin-stack">
              <div class="mixer-admin-section-header">
                <p class="mixer-admin-section-title">기본 정보</p>
                <p class="mixer-admin-section-caption">사용자 카드에 노출되는 영역</p>
              </div>
              <div class="mixer-admin-inline-grid">
                <div>
                  <label>이모지</label>
                  <input id="mapEmoji" class="mixer-admin-emoji-input" maxlength="4" value="${escapeMixerHTML(item.emoji || '✨')}" />
                </div>
                <div>
                  <label>표시 이름</label>
                  <input id="mapName" placeholder="사용자에게 보이는 프리셋 이름" value="${escapeMixerHTML(item.nameKo || '')}" />
                </div>
              </div>
              <div class="mixer-admin-card">
                <label>짧은 설명</label>
                <input id="mapDesc" placeholder="카드에 표시할 짧은 설명" value="${escapeMixerHTML(item.desc || '')}" />
              </div>
            </div>
            <div class="mixer-admin-card mixer-admin-stack">
                <p class="mixer-admin-card-title">메인 필터</p>
                <div class="mixer-admin-filter-grid">
                  <div>
                    <label>${primaryLabel}</label>
                    <select id="mapFilterPrimary">
                      ${isSubject
                        ? [
                            ['mfg', '🏭 제조·생산'],
                            ['knowledge', '💡 지식·서비스'],
                            ['public', '🏛 공공·정책'],
                            ['urban', '🏙 도시·인프라'],
                            ['life', '🎨 생활·문화'],
                            ['future', '🌍 미래·환경']
                          ]
                            .map(([k, label]) => `<option value="${k}" ${k === (item.group || getSubjectGroupFilterId(item._cat || item.category || 'steel')) ? 'selected' : ''}>${label}</option>`)
                            .join('')
                        : [
                            ['render3d', '🧊 3D·공간'],
                            ['graphic', '🎨 그래픽·회화'],
                            ['photo', '📷 사진·실사'],
                            ['craft', '🧶 공예·재질'],
                            ['uiinfo', '📋 UI·정보'],
                            ['experimental', '🧪 실험·서브컬처']
                          ]
                            .map(([k, label]) => `<option value="${k}" ${k === (item.group || getMediumGroupFilterId(item.category || 'tech3d')) ? 'selected' : ''}>${label}</option>`)
                            .join('')
                      }
                    </select>
                  </div>
                  <div>
                    <label>${secondaryLabel}</label>
                    <select id="mapFilterSecondary">
                      ${isSubject
                        ? Object.entries(SUBJ_SCENE_LABELS)
                            .filter(([k]) => k !== 'all')
                            .map(([k, label]) => `<option value="${k}" ${k === (item.scene || getSubjectSceneFilterId(item._cat || item.category || 'steel')) ? 'selected' : ''}>${label}</option>`)
                            .join('')
                        : Object.entries(MED_TEXTURE_LABELS)
                            .filter(([k]) => k !== 'all')
                            .map(([k, label]) => `<option value="${k}" ${k === (item.texture || getMediumTextureFilterId(item.category || 'tech3d')) ? 'selected' : ''}>${label}</option>`)
                            .join('')
                      }
                    </select>
                  </div>
                </div>
                <div class="mixer-admin-helper">
                  메인 페이지와 동일한 2단계 필터 구조만 유지합니다. 세부 카테고리는 따로 노출하지 않습니다.
                </div>
            </div>
          </div>

          <div class="mixer-admin-workspace">
            <div class="mixer-admin-section mixer-admin-stack">
              <div class="mixer-admin-section-header">
                <p class="mixer-admin-section-title">한글 원본 및 번역 입력</p>
                <p class="mixer-admin-section-caption">수정 후 자동 번역으로 영문 필드를 채울 수 있습니다.</p>
              </div>
              <div>
                <label>한글 설명 (번역용)</label>
                <textarea id="mapDescKo" rows="4" placeholder="영문 프롬프트로 번역할 상세 한글 설명">${escapeMixerHTML(item.descKo || item.desc || '')}</textarea>
              </div>
              <div class="mixer-admin-translate-bar">
                <button id="mapTranslateKoToEn" type="button">${isSubject ? '한글 이름/설명 → 영문 프롬프트' : '한글 이름/설명 → prefix/suffix'}</button>
                <span class="mixer-admin-translate-status" id="mapTranslateStatus">한글 내용을 먼저 다듬고 번역 버튼을 누르면 아래 영문 입력이 자동으로 채워집니다.</span>
              </div>
            </div>
            <div class="mixer-admin-section mixer-admin-stack">
              <div class="mixer-admin-section-header">
                <p class="mixer-admin-section-title">실제 프롬프트 편집</p>
                <p class="mixer-admin-section-caption">생성 품질에 직접 반영되는 값</p>
              </div>
              <p class="mixer-admin-prompt-note">${isSubject ? '주제 프롬프트는 한 문장으로 명확하게 유지하는 것이 좋습니다.' : '화풍 프리셋은 prefix로 핵심 스타일을, suffix로 질감·조명·마감 디테일을 분리해두면 관리가 쉽습니다.'}</p>
              <div class="mixer-admin-prompt-grid">
                <div>
                  <label>${isSubject ? '실제 주제 프롬프트' : '앞 설명 prefix'}</label>
                  <textarea id="mapPrompt" rows="5" placeholder="${isSubject ? 'subject prompt' : 'prefix (e.g. watercolor illustration of)'}">${escapeMixerHTML(promptVal)}</textarea>
                </div>
                ${!isSubject ? `<div>
                  <label>뒤 설명 suffix</label>
                  <textarea id="mapSuffix" rows="5" placeholder="suffix (e.g. soft colors, detailed texture)">${escapeMixerHTML(suffixVal)}</textarea>
                </div>` : ''}
              </div>
            </div>
          </div>
        </div>
        <div class="mixer-custom-modal-actions">
          ${hasOverride ? '<button id="mapReset" type="button" class="reset-btn">기본값 복원</button>' : ''}
          <button id="mapCancel" type="button">취소</button>
          <button id="mapSave" type="button" class="save-btn">수정 저장</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#mapCancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    const translateBtn = overlay.querySelector('#mapTranslateKoToEn');
    const translateStatus = overlay.querySelector('#mapTranslateStatus');
    const setTranslateStatus = (message, tone = 'muted') => {
      if (!translateStatus) return;
      translateStatus.textContent = message;
      translateStatus.style.color = tone === 'error' ? 'var(--status-error, #dc2626)' : (tone === 'success' ? 'var(--status-success, #059669)' : 'var(--ink-faint, #64748b)');
    };

    translateBtn?.addEventListener('click', async () => {
      const nameKo = overlay.querySelector('#mapName').value.trim();
      const descKo = overlay.querySelector('#mapDescKo').value.trim();
      const promptInput = overlay.querySelector('#mapPrompt');
      const suffixInput = overlay.querySelector('#mapSuffix');

      if (!nameKo && !descKo) {
        setTranslateStatus('번역할 표시 이름이나 한글 설명을 먼저 입력해 주세요.', 'error');
        return;
      }

      translateBtn.disabled = true;
      translateBtn.textContent = '번역 중...';
      setTranslateStatus('한영 번역 API를 호출하고 있습니다.');

      try {
        if (isSubject) {
          const source = [nameKo, descKo].filter(Boolean).join(', ');
          const translated = await translateWithMyMemory(source);
          promptInput.value = translated || source;
        } else {
          let prefixEn = '';
          let suffixEn = '';
          if (nameKo) {
            const translatedName = await translateWithMyMemory(nameKo);
            prefixEn = translatedName ? `${translatedName} style illustration of` : `${nameKo} style illustration of`;
          }
          if (descKo) {
            suffixEn = await translateWithMyMemory(descKo) || descKo;
          }
          promptInput.value = prefixEn;
          if (suffixInput) suffixInput.value = suffixEn;
        }
        setTranslateStatus('번역값을 영문 입력 영역에 반영했습니다.', 'success');
      } catch (err) {
        setTranslateStatus('번역 API 호출에 실패했습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.', 'error');
      } finally {
        translateBtn.disabled = false;
        translateBtn.textContent = isSubject ? '한글 이름/설명 → 영문 프롬프트' : '한글 이름/설명 → prefix/suffix';
      }
    });

    overlay.querySelector('#mapReset')?.addEventListener('click', () => {
      if (!original || !confirm('이 프리셋을 기본값으로 복원할까요?')) return;
      if (!clearAdminPresetOverride(type, item.id)) return;
      [item, liveItem].forEach(target => {
        if (!target) return;
        Object.assign(target, original);
        // 추가했던 필드들 제거
        delete target.descKo;
        delete target._cat;
        delete target.group;
        delete target.scene;
        delete target.category;
        delete target.texture;
      });
      onSave?.(item);
      overlay.remove();
    });

    overlay.querySelector('#mapSave').addEventListener('click', () => {
      const emoji = overlay.querySelector('#mapEmoji').value.trim() || '✨';
      const nameKo = overlay.querySelector('#mapName').value.trim();
      const desc = overlay.querySelector('#mapDesc').value.trim();
      const descKo = overlay.querySelector('#mapDescKo').value.trim();
      const prompt = overlay.querySelector('#mapPrompt').value.trim();
      const suffix = isSubject ? '' : (overlay.querySelector('#mapSuffix')?.value.trim() || '');
      const primaryFilter = overlay.querySelector('#mapFilterPrimary').value;
      const secondaryFilter = overlay.querySelector('#mapFilterSecondary').value;

      if (!nameKo || !prompt) {
        alert('표시 이름과 실제 프롬프트 값은 필수입니다.');
        return;
      }

      const patch = isSubject
        ? { emoji, nameKo, desc, descKo, prompt, _cat: currentCategory, group: primaryFilter, scene: secondaryFilter }
        : { emoji, nameKo, desc, descKo, prefix: prompt, suffix, category: currentCategory, group: primaryFilter, texture: secondaryFilter };

      if (!saveAdminPresetOverride(type, item.id, patch)) return;
      Object.assign(item, patch);
      if (liveItem) Object.assign(liveItem, patch);
      onSave?.(item);
      overlay.remove();
    });

    setTimeout(() => overlay.querySelector('#mapName').focus(), 50);
  }

  function getUserCategoryCount(type, catId) {
    const isSubject = type === 'subject';
    const items = isSubject ? userSubjects : userMediums;
    if (catId === '__all__') return items.length;
    return items.filter(item => item.categoryId === catId).length;
  }

  function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  // 주제 마법사 재구성(다시 구성/AI 위임) 시 직전 뽑기와 겹치지 않도록 축별 이력 관리
  const WIZARD_PICK_HISTORY = { stage: [], scene: [], target: [], template: [] };
  const WIZARD_HISTORY_LIMIT = 3;

  function pickFresh(pool, historyKey) {
    if (!pool.length) return null;
    if (pool.length === 1) return pool[0];
    const history = WIZARD_PICK_HISTORY[historyKey];
    const limit = Math.min(WIZARD_HISTORY_LIMIT, pool.length - 1);
    const avoid = new Set(history.slice(-limit));
    const candidates = pool.filter(item => !avoid.has(item));
    const pickList = candidates.length ? candidates : pool;
    const picked = pickList[Math.floor(Math.random() * pickList.length)];
    history.push(picked);
    if (history.length > WIZARD_HISTORY_LIMIT) history.shift();
    return picked;
  }

  // 축별 개별 재추첨: 해당 축의 카테고리 클릭 시에만 호출, 다른 축 단어에는 영향 없음
  function pickStageWord(stageId) {
    const stagePick = SUBJECT_WIZARD_STAGES.find(item => item.id === stageId) || SUBJECT_WIZARD_STAGES[0];
    if (stagePick.id === 'auto' || !stagePick.phrases.length) {
      const allPhrases = SUBJECT_WIZARD_STAGES.filter(item => item.id !== 'auto').flatMap(item => item.phrases);
      return pickFresh(allPhrases, 'stage');
    }
    return pickFresh(stagePick.phrases, 'stage');
  }

  function pickSceneWord(sceneTypeId) {
    const sceneType = SUBJECT_WIZARD_SCENES.find(item => item.id === sceneTypeId) || SUBJECT_WIZARD_SCENES[0];
    if (sceneType.id === 'auto' || !sceneType.phrases.length) {
      const allPhrases = SUBJECT_WIZARD_SCENES.filter(item => item.id !== 'auto').flatMap(item => item.phrases);
      return pickFresh(allPhrases, 'scene');
    }
    return pickFresh(sceneType.phrases, 'scene');
  }

  function pickTargetWord(targetId) {
    const target = SUBJECT_WIZARD_TARGETS.find(item => item.id === targetId) || SUBJECT_WIZARD_TARGETS[0];
    if (target.id === 'auto' || !target.phrases.length) {
      const allPhrases = SUBJECT_WIZARD_TARGETS.filter(item => item.id !== 'auto').flatMap(item => item.phrases);
      return pickFresh(allPhrases, 'target');
    }
    return pickFresh(target.phrases, 'target');
  }

  // 영문 관사 보정: 모음으로 시작하면 an, 아니면 a
  function withArticle(word) {
    if (!word) return word;
    return (/^[aeiouAEIOU]/.test(word) ? 'an ' : 'a ') + word;
  }

  // 문장 구조 다양화용 프롬프트 템플릿 (매번 같은 뼈대로 나오지 않도록 순환)
  const WIZARD_PROMPT_TEMPLATES = [
    (domain, stageWord, sceneWord, targetWord) =>
      `${sceneWord.en} in ${domain.en} ${stageWord.en}, featuring ${withArticle(targetWord.en)}`,
    (domain, stageWord, sceneWord, targetWord) =>
      `${withArticle(targetWord.en)} ${sceneWord.verb || 'engaged in'} ${sceneWord.en} at a ${domain.en} ${stageWord.en} site`,
    (domain, stageWord, sceneWord, targetWord) =>
      `${withArticle(targetWord.en)} ${sceneWord.verb || 'engaged in'} ${sceneWord.en}, ${stageWord.en} for ${domain.en} production`
  ];

  function pickWizardTemplate() {
    return pickFresh(WIZARD_PROMPT_TEMPLATES, 'template');
  }

  // 순수 조합 함수: 랜덤 없이 이미 뽑힌 축 단어들과 템플릿을 그대로 조립만 함
  function composeSubjectWizardPreset(domainId, targetId, stageWord, sceneWord, targetWord, template) {
    const domain = SUBJECT_WIZARD_DOMAINS.find(item => item.id === domainId) || SUBJECT_WIZARD_DOMAINS[0];
    const target = SUBJECT_WIZARD_TARGETS.find(item => item.id === targetId) || SUBJECT_WIZARD_TARGETS[0];
    const nameKo = `${domain.label} ${stageWord.ko} ${sceneWord.ko} ${targetWord.ko}`;
    const desc = `${domain.label} ${stageWord.ko} 분야의 ${sceneWord.ko} · ${targetWord.ko} 장면.`;
    const prompt = (template || WIZARD_PROMPT_TEMPLATES[0])(domain, stageWord, sceneWord, targetWord);
    const comboKo = [domain.label, stageWord.ko, sceneWord.ko, targetWord.ko];

    return {
      id: `uwiz-s-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      nameKo,
      emoji: domain.emoji,
      desc,
      prompt,
      comboKo,
      group: domain.group,
      scene: domain.scene || 'service',
      usage: target.usage || 'promotion',
      categoryId: ''
    };
  }

  function openSubjectWizardModal() {
    let selectedDomainId = SUBJECT_WIZARD_DOMAINS[0]?.id || 'battery';
    let selectedStageId = 'auto';
    let selectedSceneId = SUBJECT_WIZARD_SCENES[0]?.id || 'dev';
    let selectedTargetId = SUBJECT_WIZARD_TARGETS[0]?.id || 'people';
    // 축별 실제 단어는 카테고리 클릭 시에만 재추첨 (다른 축 값은 그대로 유지)
    let stageWord = pickStageWord(selectedStageId);
    let sceneWord = pickSceneWord(selectedSceneId);
    let targetWord = pickTargetWord(selectedTargetId);
    // 문장 템플릿은 축 클릭으로는 안 바뀌고 "다시 구성"에서만 함께 재추첨
    let promptTemplate = pickWizardTemplate();
    let draft = composeSubjectWizardPreset(selectedDomainId, selectedTargetId, stageWord, sceneWord, targetWord, promptTemplate);

    const overlay = document.createElement('div');
    overlay.className = 'mixer-custom-modal-overlay';
    overlay.innerHTML = `
      <div class="mixer-custom-modal mixer-subject-wizard-modal">
        <div class="mixer-custom-modal-head">
          <h3>주제 마법사</h3>
          <button type="button" class="mixer-modal-close" aria-label="닫기">×</button>
        </div>
        <div class="mixer-subject-wizard-body">
          <div style="display:flex;flex-direction:column;gap:12px;">
            <section class="mixer-wizard-section">
              <h4>1단계. 기술·산업 분야</h4>
              <div class="mixer-wizard-choice-grid" id="subjectWizardDomains">
                ${SUBJECT_WIZARD_DOMAINS.map(item => `
                  <button type="button" class="mixer-wizard-choice${item.id === selectedDomainId ? ' active' : ''}" data-domain-id="${escapeMixerHTML(item.id)}">
                    ${escapeMixerHTML(item.emoji)} ${escapeMixerHTML(item.label)}
                  </button>
                `).join('')}
              </div>
            </section>
            <section class="mixer-wizard-section">
              <h4>2단계. 세부 단계</h4>
              <div class="mixer-wizard-choice-grid" id="subjectWizardStages">
                ${SUBJECT_WIZARD_STAGES.map(item => `
                  <button type="button" class="mixer-wizard-choice${item.id === selectedStageId ? ' active' : ''}" data-stage-id="${escapeMixerHTML(item.id)}">
                    ${escapeMixerHTML(item.emoji)} ${escapeMixerHTML(item.label)}
                  </button>
                `).join('')}
              </div>
            </section>
            <section class="mixer-wizard-section">
              <h4>3단계. 장면 행위 유형</h4>
              <div class="mixer-wizard-choice-grid" id="subjectWizardScenes">
                ${SUBJECT_WIZARD_SCENES.map(item => `
                  <button type="button" class="mixer-wizard-choice${item.id === selectedSceneId ? ' active' : ''}" data-scene-id="${escapeMixerHTML(item.id)}">
                    ${escapeMixerHTML(item.emoji)} ${escapeMixerHTML(item.label)}
                  </button>
                `).join('')}
              </div>
            </section>
            <section class="mixer-wizard-section">
              <h4>4단계. 대상</h4>
              <div class="mixer-wizard-choice-grid" id="subjectWizardTargets">
                ${SUBJECT_WIZARD_TARGETS.map(item => `
                  <button type="button" class="mixer-wizard-choice${item.id === selectedTargetId ? ' active' : ''}" data-target-id="${escapeMixerHTML(item.id)}">
                    ${escapeMixerHTML(item.emoji)} ${escapeMixerHTML(item.label)}
                  </button>
                `).join('')}
              </div>
            </section>
          </div>
          <aside class="mixer-wizard-preview">
            <div class="mixer-wizard-preview-card">
              <strong id="subjectWizardName"></strong>
              <p id="subjectWizardDesc"></p>
              <p class="mixer-wizard-combo" id="subjectWizardCombo"></p>
              <pre id="subjectWizardPrompt"></pre>
              <p class="mixer-wizard-prompt-ko" id="subjectWizardPromptKo"></p>
            </div>
            <button type="button" class="mixer-user-tab-btn" id="subjectWizardRegenerate">↻ 다시 구성</button>
          </aside>
        </div>
        <div class="mixer-wizard-actions">
          <button type="button" class="mixer-search-clear" id="subjectWizardCancel">취소</button>
          <button type="button" class="mixer-quick-add-btn" id="subjectWizardAdd">프리셋에 추가</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // 생성된 영문 프롬프트가 실제로 어떤 뜻인지 확인용 — 결과 프롬프트에는 포함 안 됨
    let promptKoRequestId = 0;
    const updatePromptKoPreview = async (text) => {
      const requestId = ++promptKoRequestId;
      const koEl = overlay.querySelector('#subjectWizardPromptKo');
      if (!koEl) return;
      koEl.textContent = '해석 확인 중...';
      const translated = await translateWithMyMemory(text, 'en|ko');
      if (requestId !== promptKoRequestId || !overlay.isConnected) return;
      koEl.textContent = translated ? `→ ${translated}` : '해석을 불러오지 못했습니다.';
    };

    const refreshDraft = () => {
      draft = composeSubjectWizardPreset(selectedDomainId, selectedTargetId, stageWord, sceneWord, targetWord, promptTemplate);
      overlay.querySelector('#subjectWizardName').textContent = `${draft.emoji} ${draft.nameKo}`;
      overlay.querySelector('#subjectWizardDesc').textContent = draft.desc;
      overlay.querySelector('#subjectWizardCombo').textContent = draft.comboKo.map(word => `"${word}"`).join(' + ');
      overlay.querySelector('#subjectWizardPrompt').textContent = draft.prompt;
      updatePromptKoPreview(draft.prompt);
    };
    const syncChoiceState = () => {
      overlay.querySelectorAll('[data-domain-id]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.domainId === selectedDomainId);
      });
      overlay.querySelectorAll('[data-stage-id]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.stageId === selectedStageId);
      });
      overlay.querySelectorAll('[data-scene-id]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sceneId === selectedSceneId);
      });
      overlay.querySelectorAll('[data-target-id]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.targetId === selectedTargetId);
      });
    };
    const close = () => overlay.remove();

    overlay.querySelectorAll('[data-domain-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedDomainId = btn.dataset.domainId;
        syncChoiceState();
        refreshDraft();
      });
    });
    overlay.querySelectorAll('[data-stage-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedStageId = btn.dataset.stageId;
        stageWord = pickStageWord(selectedStageId);
        syncChoiceState();
        refreshDraft();
      });
    });
    overlay.querySelectorAll('[data-scene-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedSceneId = btn.dataset.sceneId;
        sceneWord = pickSceneWord(selectedSceneId);
        syncChoiceState();
        refreshDraft();
      });
    });
    overlay.querySelectorAll('[data-target-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedTargetId = btn.dataset.targetId;
        targetWord = pickTargetWord(selectedTargetId);
        syncChoiceState();
        refreshDraft();
      });
    });
    overlay.querySelector('#subjectWizardRegenerate')?.addEventListener('click', () => {
      stageWord = pickStageWord(selectedStageId);
      sceneWord = pickSceneWord(selectedSceneId);
      targetWord = pickTargetWord(selectedTargetId);
      promptTemplate = pickWizardTemplate();
      refreshDraft();
    });
    overlay.querySelector('#subjectWizardCancel')?.addEventListener('click', close);
    overlay.querySelector('.mixer-modal-close')?.addEventListener('click', close);
    overlay.addEventListener('click', event => {
      if (event.target === overlay) close();
    });
    overlay.querySelector('#subjectWizardAdd')?.addEventListener('click', () => {
      const saved = { ...draft, id: `uwiz-s-${Date.now()}-${Math.floor(Math.random() * 10000)}` };
      userSubjects.push(saved);
      saveUserItems(LS_USER_SUBJ, userSubjects);
      selectedSubjId = saved.id;
      activeCategory = '__user__';
      activeUserSubjCat = '__all__';
      updateCategoryTabs();
      renderSubjects();
      updateMixerSummaryBar();
      renderPreviewCard();
      close();
    });

    refreshDraft();
  }

  function duplicateUserMixerItem(type, item, defaultCatId = null) {
    const isSubject = type === 'subject';
    const duplicated = {
      ...item,
      id: `user-${isSubject ? 's' : 'm'}-${Date.now()}`,
      nameKo: `${item.nameKo} 복사본`,
      categoryId: item.categoryId || defaultCatId || ''
    };

    openCustomItemModal({
      type,
      item: duplicated,
      defaultCatId: duplicated.categoryId || null,
      onSave: (saved) => {
        if (isSubject) {
          userSubjects.push(saved);
          saveUserItems(LS_USER_SUBJ, userSubjects);
          selectedSubjId = saved.id;
          renderSubjects();
        } else {
          userMediums.push(saved);
          saveUserItems(LS_USER_MED, userMediums);
          selectedMediumId = saved.id;
          renderMediums();
        }
        updateMixerSummaryBar();
        renderPreviewCard();
      }
    });
  }

  function deleteUserCategory(type, catId, activeCatId) {
    const isSubject = type === 'subject';
    const cats = isSubject ? userSubjectCats : userMediumCats;
    const items = isSubject ? userSubjects : userMediums;
    const cat = cats.find(c => c.id === catId);
    if (!cat) return false;

    if (!confirm(`"${cat.name}" 카테고리를 삭제하겠습니까?\n(이 카테고리 항목들은 미분류로 이동됩니다)`)) {
      return false;
    }

    const nextCats = cats.filter(c => c.id !== cat.id);
    const nextItems = items.map(item => item.categoryId === cat.id ? { ...item, categoryId: '' } : item);

    if (isSubject) {
      userSubjectCats = nextCats;
      userSubjects = nextItems;
      saveUserItems(LS_USER_SUBJ_CATS, userSubjectCats);
      saveUserItems(LS_USER_SUBJ, userSubjects);
      if (activeCatId === cat.id) activeUserSubjCat = '__all__';
      renderSubjects();
    } else {
      userMediumCats = nextCats;
      userMediums = nextItems;
      saveUserItems(LS_USER_MED_CATS, userMediumCats);
      saveUserItems(LS_USER_MED, userMediums);
      if (activeCatId === cat.id) activeUserMedCat = '__all__';
      renderMediums();
    }

    updateMixerSummaryBar();
    renderPreviewCard();
    return true;
  }

  function openNewUserMixerItem(type, defaultCatId = null) {
    const isSubject = type === 'subject';
    openCustomItemModal({
      type,
      defaultCatId,
      onSave: (saved) => {
        if (isSubject) {
          userSubjects.push(saved);
          saveUserItems(LS_USER_SUBJ, userSubjects);
          selectedSubjId = saved.id;
          renderSubjects();
        } else {
          userMediums.push(saved);
          saveUserItems(LS_USER_MED, userMediums);
          selectedMediumId = saved.id;
          renderMediums();
        }
        updateMixerSummaryBar();
        renderPreviewCard();
      }
    });
  }

  function renderUserCatPanel(container, { type, activeCatId }) {
    const isSubject = type === 'subject';
    const cats = isSubject ? userSubjectCats : userMediumCats;
    const items = isSubject ? userSubjects : userMediums;
    const panelId = isSubject ? 'mixerSubjUserCatPanel' : 'mixerMedUserCatPanel';
    const row = document.getElementById(isSubject ? 'mixerSubjUserCatRow' : 'mixerMedUserCatRow');
    const selectedCat = activeCatId === '__all__' ? null : cats.find(cat => cat.id === activeCatId);
    const activeItems = activeCatId === '__all__'
      ? items
      : items.filter(item => item.categoryId === activeCatId);
    const typeLabel = isSubject ? '주제' : '화풍';
    const itemLabel = isSubject ? '새 주제' : '새 화풍';
    const targetName = selectedCat ? selectedCat.name : '전체 커스텀';
    const targetEmoji = selectedCat ? selectedCat.emoji : '📋';

    let panel = document.getElementById(panelId);
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'mixer-user-cat-panel';
      panel.id = panelId;
      if (row && row.parentNode) {
        row.after(panel);
      } else {
        const searchBar = container.querySelector(isSubject ? '#mixerSubjSearchInput' : '#mixerMedSearchInput');
        if (searchBar) searchBar.closest('.mixer-search-bar').before(panel);
        else container.prepend(panel);
      }
    }

    panel.innerHTML = `
      <div>
        <div class="mixer-user-cat-panel-title">
          <span>${escapeMixerHTML(targetEmoji)}</span>
          <strong>${escapeMixerHTML(targetName)}</strong>
          <span class="mixer-user-cat-count">${activeItems.length}</span>
        </div>
        <div class="mixer-user-cat-panel-sub">
          ${selectedCat
            ? `${escapeMixerHTML(selectedCat.name)} 카테고리의 커스텀 ${typeLabel}만 보고 관리합니다.`
            : `모든 커스텀 ${typeLabel}를 한 번에 보고 관리합니다.`}
        </div>
      </div>
      <div class="mixer-user-cat-panel-actions">
        <button type="button" class="primary panel-add-item">${itemLabel} 추가</button>
        ${selectedCat ? '<button type="button" class="panel-edit-cat">카테고리 편집</button>' : ''}
        ${selectedCat ? '<button type="button" class="danger panel-delete-cat">카테고리 삭제</button>' : ''}
      </div>
    `;

    panel.querySelector('.panel-add-item')?.addEventListener('click', () => {
      openNewUserMixerItem(type, selectedCat ? selectedCat.id : null);
    });

    panel.querySelector('.panel-edit-cat')?.addEventListener('click', () => {
      if (!selectedCat) return;
      openUserCatModal({ type, cat: selectedCat, onSave: (saved) => {
        const arr = isSubject ? userSubjectCats : userMediumCats;
        const idx = arr.findIndex(cat => cat.id === selectedCat.id);
        if (idx >= 0) arr[idx] = saved;
        saveUserItems(isSubject ? LS_USER_SUBJ_CATS : LS_USER_MED_CATS, arr);
        if (isSubject) renderSubjects(); else renderMediums();
      }});
    });

    panel.querySelector('.panel-delete-cat')?.addEventListener('click', () => {
      if (!selectedCat) return;
      deleteUserCategory(type, selectedCat.id, activeCatId);
    });
  }

  // 사용자 카테고리 서브탭 행 렌더링 헬퍼
  function renderUserCatRow(container, { type, activeCatId, onChange }) {
    const isSubject = type === 'subject';
    const cats = isSubject ? userSubjectCats : userMediumCats;
    const rowId = isSubject ? 'mixerSubjUserCatRow' : 'mixerMedUserCatRow';

    let row = document.getElementById(rowId);
    if (!row) {
      row = document.createElement('div');
      row.className = 'mixer-user-cat-row';
      row.id = rowId;
      const searchBar = container.querySelector(isSubject ? '#mixerSubjSearchInput' : '#mixerMedSearchInput');
      if (searchBar) {
        searchBar.closest('.mixer-search-bar').before(row);
      } else {
        container.prepend(row);
      }
    }
    row.innerHTML = '';

    // 전체 목록으로 돌아가기 버튼
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'mixer-user-back-btn';
    backBtn.textContent = '← 전체 목록';
    backBtn.addEventListener('click', () => {
      if (isSubject) {
        activeCategory = 'all';
        updateCategoryTabs();
        renderSubjects();
      } else {
        activeMediumCategory = 'all';
        renderMediums();
      }
    });
    row.appendChild(backBtn);

    // 전체 버튼
    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'mixer-user-cat-btn' + (activeCatId === '__all__' ? ' active' : '');
    allBtn.innerHTML = `
      <span class="mixer-user-cat-btn-main">📋 전체</span>
      <span class="mixer-user-cat-count">${getUserCategoryCount(type, '__all__')}</span>
    `;
    allBtn.addEventListener('click', () => onChange('__all__'));
    row.appendChild(allBtn);

    // 사용자 카테고리 버튼들
    cats.forEach(cat => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mixer-user-cat-btn' + (activeCatId === cat.id ? ' active' : '');
      btn.innerHTML = `
        <span class="mixer-user-cat-btn-main">${escapeMixerHTML(cat.emoji)} ${escapeMixerHTML(cat.name)}</span>
        <span class="mixer-user-cat-meta">
          <span class="mixer-user-cat-count">${getUserCategoryCount(type, cat.id)}</span>
        </span>
      `;
      btn.addEventListener('click', (e) => {
        onChange(cat.id);
      });
      // 우클릭/롱프레스 = 삭제
      btn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        deleteUserCategory(type, cat.id, activeCatId);
      });
      row.appendChild(btn);
    });

    // 카테고리 추가 버튼
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'mixer-user-cat-add-btn';
    addBtn.textContent = '＋ 카테고리';
    addBtn.addEventListener('click', () => {
      openUserCatModal({ type, onSave: (saved) => {
        if (isSubject) {
          userSubjectCats.push(saved);
          saveUserItems(LS_USER_SUBJ_CATS, userSubjectCats);
          activeUserSubjCat = saved.id;
          renderSubjects();
        } else {
          userMediumCats.push(saved);
          saveUserItems(LS_USER_MED_CATS, userMediumCats);
          activeUserMedCat = saved.id;
          renderMediums();
        }
      }});
    });
    row.appendChild(addBtn);
    renderUserCatPanel(container, { type, activeCatId });
  }

  // 주제 렌더링
  function renderSubjects() {
    const pane = document.getElementById('paneStep1');
    const grid = document.getElementById('mixerSubjGrid');
    const emptyEl = document.getElementById('mixerSubjectEmpty');
    if (!grid) return;

    // 내 커스텀 탭 버튼 표시/상태 동기화
    const subjUserBtn = document.getElementById('btnSubjUserCat');
    if (subjUserBtn) {
      subjUserBtn.style.display = userSubjects.length === 0 ? 'none' : '';
      subjUserBtn.classList.toggle('active', activeCategory === '__user__');
      const countEl = subjUserBtn.querySelector('.mixer-user-tab-count');
      if (countEl) countEl.textContent = userSubjects.length;
    }
    // 숨긴 항목 칩 동기화
    const subjHiddenChip = document.getElementById('btnSubjHiddenChip');
    if (subjHiddenChip) {
      const n = DELETED_PRESET_IDS.subjects.size;
      subjHiddenChip.style.display = n === 0 ? 'none' : '';
      const cEl = document.getElementById('subjHiddenCount');
      if (cEl) cEl.textContent = n;
    }

    const isUserCat = activeCategory === '__user__';

    // 사용자 탭일 때 서브카테고리 행 표시
    const existingRow = document.getElementById('mixerSubjUserCatRow');
    const existingPanel = document.getElementById('mixerSubjUserCatPanel');
    if (!isUserCat) {
      if (existingRow) existingRow.remove();
      if (existingPanel) existingPanel.remove();
    } else {
      if (pane) renderUserCatRow(pane, {
        type: 'subject',
        activeCatId: activeUserSubjCat,
        onChange: (id) => { activeUserSubjCat = id; renderSubjects(); }
      });
    }

    grid.innerHTML = '';
    grid.classList.toggle('mixer-custom-grid', isUserCat);

    const q = subjSearchQ.trim().toLowerCase();

    let list;
    if (isUserCat) {
      list = activeUserSubjCat === '__all__'
        ? userSubjects.slice()
        : userSubjects.filter(s => s.categoryId === activeUserSubjCat);
    } else {
      list = activeCategory === 'all'
        ? Object.entries(MIXER_SUBJECTS).flatMap(([cat, items]) => items.map(item => ({ _cat: item._cat || cat, ...item })))
        : (MIXER_SUBJECTS[activeCategory] || []).map(item => ({ _cat: item._cat || activeCategory, ...item }));
      if (activeSubjectGroupFilter !== 'all') {
        list = list.filter(s => (s.group || getSubjectGroupFilterId(s._cat)) === activeSubjectGroupFilter);
      }
      if (activeSubjectSceneFilter !== 'all') {
        list = list.filter(s => (s.scene || getSubjectSceneFilterId(s._cat)) === activeSubjectSceneFilter);
      }
      list = list.filter(s => !DELETED_PRESET_IDS.subjects.has(s.id));
    }

    if (q) {
      list = list.filter(s =>
        s.nameKo.toLowerCase().includes(q) ||
        (s.desc || '').toLowerCase().includes(q)
      );
    }

    if (list.length > 0 && !list.some(s => s.id === selectedSubjId)) {
      selectedSubjId = list[0].id;
    }

    list.forEach(subj => {
      const isActive = selectedSubjId === subj.id;
      const isUser = isUserCat || userSubjects.some(u => u.id === subj.id);
      const card = document.createElement('div');
      card.setAttribute('role', 'button');
      card.tabIndex = 0;
      card.className = 'mixer-item-card' + (isActive ? ' active' : '') + (isUser ? ' user-custom' : '');
      card.setAttribute('aria-pressed', String(isActive));

      const catName = isUser ? (userSubjectCats.find(c => c.id === subj.categoryId)?.name || '') : '';
      card.innerHTML = `
        ${isUser ? `<div class="mixer-item-meta">
          <span class="mixer-item-badge custom">내 커스텀</span>
          ${catName ? `<span class="mixer-item-badge category">${escapeMixerHTML(catName)}</span>` : ''}
        </div>` : ''}
        <div class="mixer-item-head">${escapeMixerHTML(subj.emoji || '')} ${escapeMixerHTML(subj.nameKo)}</div>
        <div class="mixer-item-desc">${escapeMixerHTML(subj.desc || '')}</div>
        ${isUser ? `<div class="mixer-item-card-actions">
          <button class="dup-btn" type="button" title="복제" aria-label="복제"><span class="mixer-action-icon" aria-hidden="true">⧉</span><span class="mixer-action-label">복제</span></button>
          <button class="edit-btn" type="button" title="편집" aria-label="편집"><span class="mixer-action-icon" aria-hidden="true">✎</span><span class="mixer-action-label">편집</span></button>
          <button class="del-btn" type="button" title="삭제" aria-label="삭제"><span class="mixer-action-icon" aria-hidden="true">×</span><span class="mixer-action-label">삭제</span></button>
        </div>` : `<div class="mixer-item-card-actions">
          <button class="mixer-copy-btn" type="button" title="내 커스텀으로 복사" aria-label="내 커스텀으로 복사"><span class="mixer-action-icon" aria-hidden="true">⧉</span><span class="mixer-action-label">복사</span></button>
          <button class="mixer-admin-edit-btn" type="button" title="프리셋 수정" aria-label="프리셋 수정"><span class="mixer-action-icon" aria-hidden="true">✎</span><span class="mixer-action-label">편집</span></button>
          <button class="mixer-builtin-del-btn danger" type="button" title="프리셋 숨김" aria-label="프리셋 숨김"><span class="mixer-action-icon" aria-hidden="true">×</span><span class="mixer-action-label">숨김</span></button>
        </div>`}
      `;

      if (!isUser) {
        card.querySelector('.mixer-copy-btn')?.addEventListener('click', (e) => {
          e.stopPropagation();
          const copy = { ...subj, id: 'usubj-' + Date.now(), categoryId: '' };
          openCustomItemModal({ type: 'subject', item: copy, defaultCatId: null, onSave: (saved) => {
            userSubjects.push(saved);
            saveUserItems(LS_USER_SUBJ, userSubjects);
            renderSubjects();
            renderPreviewCard();
          }});
        });
        card.querySelector('.mixer-admin-edit-btn')?.addEventListener('click', (e) => {
          e.stopPropagation();
          openAdminPresetModal({ type: 'subject', item: subj, onSave: () => {
            renderSubjects();
            updateMixerSummaryBar();
            renderPreviewCard();
          }});
        });
        card.querySelector('.mixer-builtin-del-btn')?.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!confirm(`"${subj.nameKo}" 프리셋을 숨기겠습니까?\n(편집 모달의 '기본값 복원'으로 되돌릴 수 있습니다)`)) return;
          if (deleteBuiltInPreset('subject', subj.id)) {
            renderSubjects();
            updateMixerSummaryBar();
            renderPreviewCard();
          }
        });
      }

      if (isUser) {
        card.querySelector('.dup-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          duplicateUserMixerItem('subject', subj, activeUserSubjCat !== '__all__' ? activeUserSubjCat : null);
        });
        card.querySelector('.edit-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          openCustomItemModal({ type: 'subject', item: subj, defaultCatId: activeUserSubjCat !== '__all__' ? activeUserSubjCat : null, onSave: (saved) => {
            const idx = userSubjects.findIndex(u => u.id === subj.id);
            if (idx >= 0) userSubjects[idx] = saved;
            saveUserItems(LS_USER_SUBJ, userSubjects);
            renderSubjects();
            renderPreviewCard();
          }});
        });
        card.querySelector('.del-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          if (!confirm(`"${subj.nameKo}" 항목을 삭제하겠습니까?`)) return;
          userSubjects = userSubjects.filter(u => u.id !== subj.id);
          saveUserItems(LS_USER_SUBJ, userSubjects);
          if (selectedSubjId === subj.id) {
            selectedSubjId = Object.values(MIXER_SUBJECTS).flat()[0]?.id || '';
            customSubjectKo = ''; customSubjectEn = '';
          }
          renderSubjects();
          renderPreviewCard();
        });
      }

      card.addEventListener('click', (e) => {
        if (e.target.closest('.mixer-item-card-actions')) return;
        selectedSubjId = subj.id;
        syncSubjectPresetToCustom(subj);
        grid.querySelectorAll('.mixer-item-card').forEach(c => {
          c.classList.remove('active'); c.setAttribute('aria-pressed', 'false');
        });
        card.classList.add('active'); card.setAttribute('aria-pressed', 'true');
        updateMixerSummaryBar();
        renderPreviewCard();
      });
      card.addEventListener('keydown', (event) => {
        if ((event.key === 'Enter' || event.key === ' ') && event.target === card) {
          event.preventDefault();
          card.click();
        }
      });
      grid.appendChild(card);
    });

    // "내 커스텀" 탭일 때 추가 버튼
    if (isUserCat) {
      const addCard = document.createElement('button');
      addCard.type = 'button';
      addCard.className = 'mixer-add-card';
      const selectedCatName = activeUserSubjCat === '__all__'
        ? '전체 커스텀'
        : (userSubjectCats.find(cat => cat.id === activeUserSubjCat)?.name || '미분류');
      addCard.innerHTML = `
        <span style="font-size:20px">＋</span>
        <strong>새 주제 추가</strong>
        <small>${escapeMixerHTML(selectedCatName)}에 바로 저장됩니다.</small>
      `;
      addCard.addEventListener('click', () => {
        openNewUserMixerItem('subject', activeUserSubjCat !== '__all__' ? activeUserSubjCat : null);
      });
      grid.appendChild(addCard);
    }

    const hasItems = grid.children.length > (isUserCat ? 1 : 0);
    if (emptyEl) emptyEl.style.display = (!hasItems && (q || (!isUserCat && (activeSubjectGroupFilter !== 'all' || activeSubjectSceneFilter !== 'all')))) ? 'block' : 'none';
  }

  // 분류형 화풍(Medium) 렌더링
  function renderMediums() {
    const pane = document.getElementById('paneStep2');
    const wrap = document.getElementById('mixerMedCategoriesWrap');
    const emptyEl = document.getElementById('mixerMediumEmpty');
    if (!wrap) return;

    // 내 커스텀 탭 버튼 표시/상태 동기화
    const medUserBtn = document.getElementById('btnMedUserCat');
    if (medUserBtn) {
      medUserBtn.style.display = userMediums.length === 0 ? 'none' : '';
      medUserBtn.classList.toggle('active', activeMediumCategory === '__user__');
      const countEl = medUserBtn.querySelector('.mixer-user-tab-count');
      if (countEl) countEl.textContent = userMediums.length;
    }
    // 숨긴 항목 칩 동기화
    const medHiddenChip = document.getElementById('btnMedHiddenChip');
    if (medHiddenChip) {
      const n = DELETED_PRESET_IDS.mediums.size;
      medHiddenChip.style.display = n === 0 ? 'none' : '';
      const cEl = document.getElementById('medHiddenCount');
      if (cEl) cEl.textContent = n;
    }

    const isUserCat = activeMediumCategory === '__user__';

    // 사용자 탭일 때 서브카테고리 행 표시
    const existingRow = document.getElementById('mixerMedUserCatRow');
    const existingPanel = document.getElementById('mixerMedUserCatPanel');
    if (!isUserCat) {
      if (existingRow) existingRow.remove();
      if (existingPanel) existingPanel.remove();
    } else {
      if (pane) renderUserCatRow(pane, {
        type: 'medium',
        activeCatId: activeUserMedCat,
        onChange: (id) => { activeUserMedCat = id; renderMediums(); }
      });
    }

    wrap.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'mixer-med-grid' + (isUserCat ? ' mixer-custom-grid' : '');

    const q = medSearchQ.trim().toLowerCase();

    let filtered;
    if (isUserCat) {
      filtered = activeUserMedCat === '__all__'
        ? userMediums.slice()
        : userMediums.filter(m => m.categoryId === activeUserMedCat);
    } else {
      filtered = (activeMediumCategory === 'all')
        ? MIXER_MEDIUMS.slice()
        : MIXER_MEDIUMS.filter(m => m.category === activeMediumCategory);
      if (activeMediumGroupFilter === 'pubinst') {
        filtered = filtered.filter(m => PUBINST_MEDIUM_IDS && PUBINST_MEDIUM_IDS.has(m.id));
      } else if (activeMediumGroupFilter !== 'all') {
        filtered = filtered.filter(m => (m.group || getMediumGroupFilterId(m.category)) === activeMediumGroupFilter);
      }
      if (activeMediumTextureFilter !== 'all') {
        filtered = filtered.filter(m => (m.texture || getMediumTextureFilterId(m.category)) === activeMediumTextureFilter);
      }
      filtered = filtered.filter(m => !DELETED_PRESET_IDS.mediums.has(m.id));
    }

    if (q) {
      filtered = filtered.filter(m =>
        m.nameKo.toLowerCase().includes(q) ||
        (m.desc || '').toLowerCase().includes(q)
      );
    }

    if (filtered.length > 0 && !filtered.some(m => m.id === selectedMediumId)) {
      selectedMediumId = filtered[0].id;
    }

    filtered.forEach(med => {
      const isActive = selectedMediumId === med.id;
      const isUser = isUserCat || userMediums.some(u => u.id === med.id);
      const card = document.createElement('div');
      card.setAttribute('role', 'button');
      card.tabIndex = 0;
      card.className = 'mixer-item-card' + (isActive ? ' active' : '') + (isUser ? ' user-custom' : '');
      card.setAttribute('aria-pressed', String(isActive));

      const catName = isUser ? (userMediumCats.find(c => c.id === med.categoryId)?.name || '') : '';
      card.innerHTML = `
        ${isUser ? `<div class="mixer-item-meta">
          <span class="mixer-item-badge custom">내 커스텀</span>
          ${catName ? `<span class="mixer-item-badge category">${escapeMixerHTML(catName)}</span>` : ''}
        </div>` : ''}
        <div class="mixer-item-head">${escapeMixerHTML(med.emoji || '')} ${escapeMixerHTML(med.nameKo)}</div>
        <div class="mixer-item-desc">${escapeMixerHTML(med.desc || '')}</div>
        ${isUser ? `<div class="mixer-item-card-actions">
          <button class="dup-btn" type="button" title="복제" aria-label="복제"><span class="mixer-action-icon" aria-hidden="true">⧉</span><span class="mixer-action-label">복제</span></button>
          <button class="edit-btn" type="button" title="편집" aria-label="편집"><span class="mixer-action-icon" aria-hidden="true">✎</span><span class="mixer-action-label">편집</span></button>
          <button class="del-btn" type="button" title="삭제" aria-label="삭제"><span class="mixer-action-icon" aria-hidden="true">×</span><span class="mixer-action-label">삭제</span></button>
        </div>` : `<div class="mixer-item-card-actions">
          <button class="mixer-copy-btn" type="button" title="내 커스텀으로 복사" aria-label="내 커스텀으로 복사"><span class="mixer-action-icon" aria-hidden="true">⧉</span><span class="mixer-action-label">복사</span></button>
          <button class="mixer-admin-edit-btn" type="button" title="프리셋 수정" aria-label="프리셋 수정"><span class="mixer-action-icon" aria-hidden="true">✎</span><span class="mixer-action-label">편집</span></button>
          <button class="mixer-builtin-del-btn danger" type="button" title="프리셋 숨김" aria-label="프리셋 숨김"><span class="mixer-action-icon" aria-hidden="true">×</span><span class="mixer-action-label">숨김</span></button>
        </div>`}
      `;

      if (!isUser) {
        card.querySelector('.mixer-copy-btn')?.addEventListener('click', (e) => {
          e.stopPropagation();
          const copy = { ...med, id: 'umed-' + Date.now(), categoryId: '' };
          openCustomItemModal({ type: 'medium', item: copy, defaultCatId: null, onSave: (saved) => {
            userMediums.push(saved);
            saveUserItems(LS_USER_MED, userMediums);
            renderMediums();
            renderPreviewCard();
          }});
        });
        card.querySelector('.mixer-admin-edit-btn')?.addEventListener('click', (e) => {
          e.stopPropagation();
          openAdminPresetModal({ type: 'medium', item: med, onSave: () => {
            renderMediums();
            updateMixerSummaryBar();
            renderPreviewCard();
          }});
        });
        card.querySelector('.mixer-builtin-del-btn')?.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!confirm(`"${med.nameKo}" 프리셋을 숨기겠습니까?\n(편집 모달의 '기본값 복원'으로 되돌릴 수 있습니다)`)) return;
          if (deleteBuiltInPreset('medium', med.id)) {
            renderMediums();
            updateMixerSummaryBar();
            renderPreviewCard();
          }
        });
      }

      if (isUser) {
        card.querySelector('.dup-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          duplicateUserMixerItem('medium', med, activeUserMedCat !== '__all__' ? activeUserMedCat : null);
        });
        card.querySelector('.edit-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          openCustomItemModal({ type: 'medium', item: med, defaultCatId: activeUserMedCat !== '__all__' ? activeUserMedCat : null, onSave: (saved) => {
            const idx = userMediums.findIndex(u => u.id === med.id);
            if (idx >= 0) userMediums[idx] = saved;
            saveUserItems(LS_USER_MED, userMediums);
            renderMediums();
            renderPreviewCard();
          }});
        });
        card.querySelector('.del-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          if (!confirm(`"${med.nameKo}" 항목을 삭제하겠습니까?`)) return;
          userMediums = userMediums.filter(u => u.id !== med.id);
          saveUserItems(LS_USER_MED, userMediums);
          if (selectedMediumId === med.id) {
            selectedMediumId = MIXER_MEDIUMS[0]?.id || '';
            customMediumKo = ''; customMediumEn = ''; customMediumEnSuffix = ''; customMediumSuffixRaw = '';
          }
          renderMediums();
          renderPreviewCard();
        });
      }

      card.addEventListener('click', (e) => {
        if (e.target.closest('.mixer-item-card-actions')) return;
        selectedMediumId = med.id;
        syncMediumPresetToCustom(med);
        wrap.querySelectorAll('.mixer-item-card').forEach(c => {
          c.classList.remove('active'); c.setAttribute('aria-pressed', 'false');
        });
        card.classList.add('active'); card.setAttribute('aria-pressed', 'true');
        updateMixerSummaryBar();
        renderPreviewCard();
      });
      card.addEventListener('keydown', (event) => {
        if ((event.key === 'Enter' || event.key === ' ') && event.target === card) {
          event.preventDefault(); card.click();
        }
      });
      grid.appendChild(card);
    });

    // "내 커스텀" 탭일 때 추가 버튼
    if (isUserCat) {
      const addCard = document.createElement('div');
      addCard.setAttribute('role', 'button');
      addCard.tabIndex = 0;
      addCard.className = 'mixer-add-card';
      const selectedCatName = activeUserMedCat === '__all__'
        ? '전체 커스텀'
        : (userMediumCats.find(cat => cat.id === activeUserMedCat)?.name || '미분류');
      addCard.innerHTML = `
        <span style="font-size:20px">＋</span>
        <strong>새 화풍 추가</strong>
        <small>${escapeMixerHTML(selectedCatName)}에 바로 저장됩니다.</small>
      `;
      addCard.addEventListener('click', () => {
        openNewUserMixerItem('medium', activeUserMedCat !== '__all__' ? activeUserMedCat : null);
      });
      addCard.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          addCard.click();
        }
      });
      grid.appendChild(addCard);
    }

    wrap.appendChild(grid);
    const hasItems = grid.children.length > (isUserCat ? 1 : 0);
    if (emptyEl) emptyEl.style.display = (!hasItems && (q || (!isUserCat && (activeMediumGroupFilter !== 'all' || activeMediumTextureFilter !== 'all')))) ? 'block' : 'none';
  }

  // hex 색상 → hue 패밀리 분류
  function hexToHueFamily(hex) {
    const r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
    if (d < 0.08) return 'neutral';
    let h = 0;
    if (max === r) h = ((g-b)/d + (g<b?6:0)) * 60;
    else if (max === g) h = ((b-r)/d + 2) * 60;
    else h = ((r-g)/d + 4) * 60;
    if (h < 20 || h >= 340) return 'red';
    if (h < 50) return 'orange';
    if (h < 75) return 'yellow';
    if (h < 165) return 'green';
    if (h < 255) return 'blue';
    if (h < 290) return 'purple';
    return 'pink';
  }

  function paletteMatchesColorFilter(pal, filter) {
    if (filter === 'all') return true;
    return pal.colors.some(c => c.length === 7 && hexToHueFamily(c) === filter);
  }

  function getEffectivePaletteCategoryFilter() {
    const tabs = document.getElementById('mixerPaletteCategoryTabs');
    if (!tabs) return 'all';
    const style = window.getComputedStyle ? window.getComputedStyle(tabs) : null;
    if (tabs.hidden || tabs.style.display === 'none' || (style && style.display === 'none')) {
      return 'all';
    }
    return activePaletteCategory || 'all';
  }

  function getPaletteMood(pal) {
    if (!pal) return null;
    if (pal.mood) return pal.mood;
    var cat = pal.category;
    if (cat === 'candy' || cat === 'energy') return 'vivid';
    if (cat === 'warm_earth' || cat === 'nature') return 'natural';
    if (cat === 'nordic') return 'minimal';
    if (cat === 'soft' && pal.mode === 'light') return 'minimal';
    if (cat === 'light_pastel' || cat === 'morning') return 'minimal';
    if (cat === 'multicolor') return 'festival';
    if (cat === 'official') return 'luxury';
    return null;
  }

  function paletteMatchesTagFilter(pal, filter) {
    if (filter === 'all') return true;
    if (filter === 'official') return pal.category === 'official';
    return getPaletteMood(pal) === filter;
  }

  function getCleanColorMapping(pal) {
    if (!pal) return '';
    if (pal.id === 'none') return '본연의 색';

    const SPECIAL_MAPPING = {
      'pal-lego': 'red, yellow, blue, green, white',
      'pal-mario': 'red, blue, gold yellow, green, white',
      'pal-roblox': 'orange, cyan, gold, white, dark grey',
      'pal-mabinogi': 'green, sky blue, parchment, pink',
      'pal-canva': 'blue, white, green, red',
      'pal-miricanvas': 'pastel red, pastel yellow, violet, mint green, white',
      'pal-webtoon': 'pink, light pink, pale yellow, pastel blue, white',
      'pal-anime-cinematic': 'dark navy, red, gold, light blue',
      'pal-film-grain': 'dark slate, grey, brown, gold, ivory',
      'pal-trust-navy': 'navy, slate navy, royal blue, sky blue, white',
      'pal-copper-slate': 'slate grey, forest sage, gold, ivory',
      'pal-smart-tech': 'dark tech navy, steel blue, cyan, aquamarine, ice blue',
      'pal-mobility-orange': 'carbon black, amber orange, logistics orange, light grey',
      'pal-pitch-neon': 'pitch-black, dark slate navy, neon mint, neon cyan, white',
      'pal-esg-forest': 'cream white, mint, organic green, forest green',
      'pal-steel-charcoal': 'charcoal, steel grey, silver, platinum, white',
      'pal-bio-mint': 'white, ice blue, mint, teal, turquoise',
      'pal-edu-violet': 'white, lavender, purple, violet',
      'pal-warm-beige': 'linen white, cozy beige, earthen brown, clay brown'
    };

    if (SPECIAL_MAPPING[pal.id]) {
      return SPECIAL_MAPPING[pal.id];
    }

    let str = pal.colorMapping || '';
    let cleaned = str.replace(/\b(background|ambient|mid-tone|midtones|accent|accents|emphasis|shadows|shadow|glow|glows|base|lines|surfaces|surface|highlight|highlights|tone|tones|depth|shimmer|shimmers|sparks|streaks|core|nodes|backdrop|gradients|gradient|anchors|anchor|strikes|strike|metallic|neon|electric|stark|warm|cool|cold|intense|soft|vivid|vibrant|bold|dark|deep|light|pale|dreamy|fresh|muted|clean|pure|radiant|glowing|luminous|bioluminescent|fiery|molten|toxic|athletic|chrome|dusty|subtle|archival|documentary|textured|heavy|classic|retro|trendy|aesthetic|spectrum|shift|iridescent|energy|flows|flow|lines|textures|details|detail|borders|border|headers|header|body|copy|text|outlines|outline|style|illustration|of|similar|to|popular|template|sets|sets)\b/gi, '');
    cleaned = cleaned.replace(/,+/g, ',');
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/\s*,\s*/g, ', ');
    cleaned = cleaned.replace(/^,|,$/g, '');
    return cleaned.trim();
  }

  function getSequentialColorPart(palette) {
    if (!palette || !palette.colors || palette.colors.length === 0) return '';
    if (palette.id === 'none') return '본연의 색';

    const SPECIAL_MAPPING = {
      'pal-lego': ['red', 'yellow', 'blue', 'green', 'white'],
      'pal-mario': ['red', 'blue', 'gold yellow', 'green', 'white'],
      'pal-roblox': ['orange', 'cyan', 'gold', 'white', 'dark grey'],
      'pal-mabinogi': ['green', 'sky blue', 'parchment', 'pink', 'white'],
      'pal-canva': ['blue', 'white', 'green', 'red'],
      'pal-miricanvas': ['pastel red', 'pastel yellow', 'violet', 'mint green', 'white'],
      'pal-webtoon': ['pink', 'light pink', 'pale yellow', 'pastel blue', 'white'],
      'pal-anime-cinematic': ['dark navy', 'red', 'gold', 'light blue'],
      'pal-film-grain': ['dark slate', 'grey', 'brown', 'gold', 'ivory'],
      'pal-trust-navy': ['navy', 'slate navy', 'royal blue', 'sky blue', 'white'],
      'pal-copper-slate': ['slate grey', 'forest sage', 'gold', 'ivory', 'white'],
      'pal-smart-tech': ['dark tech navy', 'steel blue', 'cyan', 'aquamarine', 'ice blue'],
      'pal-mobility-orange': ['carbon black', 'amber orange', 'logistics orange', 'light grey', 'white'],
      'pal-pitch-neon': ['pitch-black', 'dark slate navy', 'neon mint', 'neon cyan', 'white'],
      'pal-esg-forest': ['cream white', 'mint', 'organic green', 'forest green', 'white'],
      'pal-steel-charcoal': ['charcoal', 'steel grey', 'silver', 'platinum', 'white'],
      'pal-bio-mint': ['white', 'ice blue', 'mint', 'teal', 'turquoise'],
      'pal-edu-violet': ['white', 'lavender', 'purple', 'violet', 'indigo'],
      'pal-warm-beige': ['linen white', 'cozy beige', 'earthen brown', 'clay brown', 'white']
    };

    const tempMap = {
      "#ffffff": "white", "#000000": "black", "#ffd700": "gold",
      "#ff0000": "red", "#0000ff": "blue", "#00ff00": "green",
      "#ff6600": "orange", "#ff0555": "crimson", "#ff00ff": "magenta",
      "#00ffff": "cyan", "#7d7d7d": "gray", "#1a1a2e": "dark navy",
      "#16213e": "navy", "#ffe8b8": "cream", "#ff9de2": "pink",
      "#ee0979": "magenta", "#ff6a00": "orange", "#0099f7": "blue",
      "#fc4a1a": "orange-red", "#4d96ff": "sky blue", "#6bcb77": "green",
      "#ffd93d": "yellow", "#ff6b6b": "coral", "#d4a5e5": "lilac",
      "#ffaaa5": "coral orange", "#ffd3b6": "peach", "#dcedc1": "sage green",
      "#a8e6cf": "mint", "#c9a84c": "gold", "#e76f51": "terracotta",
      "#f4a261": "orange", "#e9c46a": "yellow", "#2a9d8f": "teal",
      "#264653": "slate blue", "#ffd6a5": "peach", "#a8dadc": "powder blue",
      "#f1faee": "off-white", "#457b9d": "steel blue", "#e63946": "red",
      "#8ac926": "lime green", "#1982c4": "royal blue", "#6a4c93": "purple",
      "#ffca3a": "yellow", "#ff595e": "red", "#8b0000": "crimson",
      "#1a1a5e": "navy", "#daa520": "gold", "#8b4513": "brown",
      "#2d4a22": "forest green", "#ff922b": "orange", "#caffbf": "mint green",
      "#ffd6ff": "lavender", "#ffb3c6": "rose pink", "#fdffb6": "yellow",
      "#ffecd2": "cream white", "#fbc2eb": "pink", "#a18cd1": "purple",
      "#fad0c4": "peach pink", "#ff9a9e": "salmon pink", "#44f7c2": "turquoise",
      "#0099f7": "blue", "#f7b733": "yellow", "#38ef7d": "lime green",
      "#11998e": "teal", "#ffe5b4": "peach", "#ff8f00": "orange",
      "#8ae9a8": "green", "#0b333e": "slate blue", "#7cd1f9": "sky blue",
      "#0c4b82": "blue", "#ffd57a": "yellow", "#ff7a7a": "red"
    };

    return palette.colors.map((hex, idx) => {
      let name = '';
      if (SPECIAL_MAPPING[palette.id] && SPECIAL_MAPPING[palette.id][idx]) {
        name = SPECIAL_MAPPING[palette.id][idx];
      } else {
        const cleanHex = String(hex || "").toLowerCase().trim();
        name = tempMap[cleanHex] || '';
      }

      if (!name && hex.startsWith('#')) {
        let cleanHex = hex.toLowerCase().trim();
        if (cleanHex.length === 4) {
          cleanHex = "#" + cleanHex[1] + cleanHex[1] + cleanHex[2] + cleanHex[2] + cleanHex[3] + cleanHex[3];
        }
        name = tempMap[cleanHex];
        if (!name) {
          const r = parseInt(cleanHex.substring(1, 3), 16);
          const g = parseInt(cleanHex.substring(3, 5), 16);
          const b = parseInt(cleanHex.substring(5, 7), 16);
          // HSL-based descriptive naming
          const rn = r/255, gn = g/255, bn = b/255;
          const cmax = Math.max(rn, gn, bn), cmin = Math.min(rn, gn, bn), dt = cmax - cmin;
          const l = (cmax + cmin) / 2;
          const s = dt === 0 ? 0 : dt / (1 - Math.abs(2*l - 1));
          let h = 0;
          if (dt > 0) {
            if (cmax === rn) h = 60 * (((gn - bn)/dt + 6) % 6);
            else if (cmax === gn) h = 60 * ((bn - rn)/dt + 2);
            else h = 60 * ((rn - gn)/dt + 4);
          }
          function hueWord(deg) {
            if (deg < 20 || deg >= 340) return 'red';
            if (deg < 50) return 'orange';
            if (deg < 80) return 'yellow';
            if (deg < 120) return 'yellow-green';
            if (deg < 165) return 'green';
            if (deg < 200) return 'cyan';
            if (deg < 235) return 'blue';
            if (deg < 265) return 'indigo';
            if (deg < 295) return 'violet';
            if (deg < 340) return 'magenta';
            return 'red';
          }
          if (l < 0.14) {
            name = s < 0.15 ? 'near-black' : 'near-black ' + hueWord(h);
          } else if (l < 0.22) {
            name = s < 0.18 ? 'dark charcoal' : 'deep ' + hueWord(h);
          } else if (l < 0.38) {
            name = s < 0.18 ? 'charcoal' : 'dark ' + hueWord(h);
          } else if (l > 0.88) {
            name = s < 0.12 ? 'white' : 'pale ' + hueWord(h);
          } else if (l > 0.75) {
            name = s < 0.20 ? 'light grey' : 'light ' + hueWord(h);
          } else if (s > 0.80 && l >= 0.40 && l <= 0.65) {
            if (h >= 140 && h < 200) name = 'electric cyan';
            else if (h >= 200 && h < 250) name = 'electric blue';
            else if (h >= 250 && h < 290) name = 'electric violet';
            else if (h >= 290 && h < 340) name = 'neon magenta';
            else if (h >= 340 || h < 20) name = 'neon red';
            else if (h >= 60 && h < 140) name = 'neon green';
            else name = 'neon ' + hueWord(h);
          } else {
            const midColors = [
              { name: 'red', r: 200, g: 30, b: 40 },
              { name: 'crimson', r: 155, g: 10, b: 35 },
              { name: 'orange', r: 230, g: 120, b: 20 },
              { name: 'amber', r: 215, g: 160, b: 30 },
              { name: 'yellow', r: 238, g: 210, b: 40 },
              { name: 'olive', r: 108, g: 120, b: 30 },
              { name: 'lime green', r: 140, g: 210, b: 50 },
              { name: 'green', r: 40, g: 150, b: 60 },
              { name: 'forest green', r: 20, g: 80, b: 30 },
              { name: 'teal', r: 20, g: 140, b: 130 },
              { name: 'mint', r: 100, g: 210, b: 190 },
              { name: 'sky blue', r: 120, g: 190, b: 230 },
              { name: 'blue', r: 40, g: 100, b: 200 },
              { name: 'cobalt blue', r: 20, g: 60, b: 180 },
              { name: 'navy', r: 15, g: 25, b: 100 },
              { name: 'indigo', r: 60, g: 20, b: 140 },
              { name: 'violet', r: 130, g: 40, b: 200 },
              { name: 'purple', r: 120, g: 30, b: 120 },
              { name: 'magenta', r: 190, g: 20, b: 140 },
              { name: 'rose', r: 210, g: 60, b: 90 },
              { name: 'pink', r: 240, g: 140, b: 170 },
              { name: 'salmon', r: 240, g: 130, b: 110 },
              { name: 'coral', r: 240, g: 100, b: 80 },
              { name: 'brown', r: 130, g: 70, b: 30 },
              { name: 'tan', r: 195, g: 155, b: 110 },
              { name: 'cream', r: 235, g: 215, b: 185 },
              { name: 'beige', r: 220, g: 200, b: 170 },
              { name: 'grey', r: 140, g: 140, b: 140 },
              { name: 'silver', r: 195, g: 195, b: 195 },
              { name: 'slate blue', r: 90, g: 100, b: 140 },
              { name: 'steel blue', r: 70, g: 130, b: 180 },
              { name: 'gold', r: 210, g: 170, b: 30 },
              { name: 'lavender', r: 200, g: 175, b: 230 },
              { name: 'sage', r: 140, g: 170, b: 130 },
            ];
            let closestName = 'color', minDist = Infinity;
            for (const bc of midColors) {
              const dist = (r - bc.r)**2 + (g - bc.g)**2 + (b - bc.b)**2;
              if (dist < minDist) { minDist = dist; closestName = bc.name; }
            }
            name = closestName;
          }
        }
      }

      if (name) {
        return `${hex} (${name})`;
      }
      return hex;
    }).join(', ');
  }

  // 스타일/미디엄에 맞는 팔레트를 자동 매핑하는 기본 전략
  // 1) 명시적 매핑 테이블(스타일/미디엄 id -> palette id)을 우선 사용
  // 2) 없으면 색상 겹침(HEX 포함) 우선 검색
  // 3) 색상 겹침이 없으면 태그/카테고 기반 완화 매칭
  const STYLE_TO_PALETTE_MAP = window.STYLE_TO_PALETTE_MAP || {
  '3d-abstract-sculpture': 'pal-style-3d-abstract-sculpture',
  '3d-architecture-viz': 'pal-style-3d-architecture-viz',
  '3d-fluid-simulation': 'pal-style-3d-fluid-simulation',
  '3d-game-environment': 'pal-style-3d-game-environment',
  '3d-holographic-ui': 'pal-style-3d-holographic-ui',
  '3d-nft-generative': 'pal-style-3d-nft-generative',
  '3d-product-render': 'pal-style-3d-product-render',
  'Content-Type': 'application/json',
  'Unsplash 요청 한도를 확인해 주세요.': '사진을 불러오지 못했습니다.',
  'anime-chibi-pixel-game': 'pal-style-anime-chibi-pixel-game',
  'anime-cyberpunk': 'pal-style-anime-cyberpunk',
  'anime-disney-3d': 'pal-style-anime-disney-3d',
  'anime-disney-classic-2d': 'pal-style-anime-disney-classic-2d',
  'anime-graphic-novel': 'pal-style-anime-graphic-novel',
  'anime-manga-screentone': 'pal-style-anime-manga-screentone',
  'anime-retro-80s-mech': 'pal-style-anime-retro-80s-mech',
  'anime-retro-90s': 'pal-style-anime-retro-90s',
  'anime-shonen-battle': 'pal-style-anime-shonen-battle',
  'anime-shoujo-romance': 'pal-style-anime-shoujo-romance',
  'anime-stick-figure': 'pal-style-anime-stick-figure',
  'anime-studio-ghibli': 'pal-style-anime-studio-ghibli',
  'anime-watercolor-ghibli': 'pal-style-anime-watercolor-ghibli',
  'anime-webtoon': 'pal-style-anime-webtoon',
  'arch-baroque-palace': 'pal-style-arch-baroque-palace',
  'arch-bohemian': 'pal-style-arch-bohemian',
  'arch-brutalist': 'pal-style-arch-brutalist',
  'arch-futuristic': 'pal-style-arch-futuristic',
  'arch-hanok': 'pal-style-arch-hanok',
  'arch-industrial': 'pal-style-arch-industrial',
  'arch-modernist': 'pal-style-arch-modernist',
  'arch-scandinavian': 'pal-style-arch-scandinavian',
  'arch-tropical-resort': 'pal-style-arch-tropical-resort',
  'arch-wabi-sabi': 'pal-style-arch-wabi-sabi',
  'artnouveau': 'pal-style-artnouveau',
  'bauhaus': 'pal-style-bauhaus',
  'bio-botanical-watercolor': 'pal-style-bio-botanical-watercolor',
  'bio-dna-neon-glow': 'pal-style-bio-dna-neon-glow',
  'bio-dna-origami': 'pal-style-bio-dna-origami',
  'bio-eco-genetic-fusion': 'pal-style-bio-eco-genetic-fusion',
  'bio-futuristic-clinic': 'pal-style-bio-futuristic-clinic',
  'bio-immunology-shield': 'pal-style-bio-immunology-shield',
  'bio-nano-microscopic': 'pal-style-bio-nano-microscopic',
  'bio-neuro-network': 'pal-style-bio-neuro-network',
  'bio-organic-cyber': 'pal-style-bio-organic-cyber',
  'bio-petri-dish-art': 'pal-style-bio-petri-dish-art',
  'bio-pharmaceutical-glass': 'pal-style-bio-pharmaceutical-glass',
  'bokeh': 'pal-style-bokeh',
  'brand-corporate-b2b': 'pal-style-brand-corporate-b2b',
  'brand-eco-sustainable': 'pal-style-brand-eco-sustainable',
  'brand-graffiti-street': 'pal-style-brand-graffiti-street',
  'brand-luxury-mono': 'pal-style-brand-luxury-mono',
  'brand-neon-sign': 'pal-style-brand-neon-sign',
  'brand-premium-package': 'pal-style-brand-premium-package',
  'brand-retro-vintage-ad': 'pal-style-brand-retro-vintage-ad',
  'brand-social-story': 'pal-style-brand-social-story',
  'brand-startup-minimal': 'pal-style-brand-startup-minimal',
  'brand-streetwear': 'pal-style-brand-streetwear',
  'brand-tattoo-flash': 'pal-style-brand-tattoo-flash',
  'brand-tech-saas': 'pal-style-brand-tech-saas',
  'brand-wellness-spa': 'pal-style-brand-wellness-spa',
  'chibi': 'pal-webtoon',
  'cinematic': 'pal-anime-cinematic',
  'clay': 'pal-miricanvas',
  'collage': 'pal-style-collage',
  'comic': 'pal-style-comic',
  'comic-american-superhero': 'pal-style-comic-american-superhero',
  'comic-franco-belgian': 'pal-style-comic-franco-belgian',
  'comic-graphic-novel-noir': 'pal-style-comic-graphic-novel-noir',
  'comic-shojo-manga': 'pal-style-comic-shojo-manga',
  'comic-underground-comix': 'pal-style-comic-underground-comix',
  'comic-vintage-newspaper-strip': 'pal-style-comic-vintage-newspaper-strip',
  'comic-webtoon': 'pal-style-comic-webtoon',
  'constructivism': 'pal-style-constructivism',
  'craft-batik': 'pal-style-craft-batik',
  'craft-ceramic-pottery': 'pal-style-craft-ceramic-pottery',
  'craft-claymation': 'pal-style-craft-claymation',
  'craft-digital-painting': 'pal-style-craft-digital-painting',
  'craft-embroidery': 'pal-style-craft-embroidery',
  'craft-glassblowing': 'pal-style-craft-glassblowing',
  'craft-leather': 'pal-style-craft-leather',
  'craft-linocut': 'pal-style-craft-linocut',
  'craft-macrame': 'pal-style-craft-macrame',
  'craft-metal-repousse': 'pal-style-craft-metal-repousse',
  'craft-needle-felt': 'pal-style-craft-needle-felt',
  'craft-stained-glass': 'pal-style-craft-stained-glass',
  'craft-woodcarving': 'pal-style-craft-woodcarving',
  'culture-african-tribal': 'pal-style-culture-african-tribal',
  'culture-byzantine': 'pal-style-culture-byzantine',
  'culture-celtic': 'pal-style-culture-celtic',
  'culture-chinese-ink': 'pal-style-culture-chinese-ink',
  'culture-indian-mandala': 'pal-style-culture-indian-mandala',
  'culture-islamic-arabesque': 'pal-style-culture-islamic-arabesque',
  'culture-korean-minhwa': 'pal-style-culture-korean-minhwa',
  'culture-maya-aztec': 'pal-style-culture-maya-aztec',
  'culture-mexican-oaxaca': 'pal-style-culture-mexican-oaxaca',
  'culture-russian-khokhloma': 'pal-style-culture-russian-khokhloma',
  'culture-ukiyoe': 'pal-style-culture-ukiyoe',
  'cyberpunk': 'pal-style-cyberpunk',
  'doodle': 'pal-style-doodle',
  'duotone': 'pal-style-duotone',
  'energy-battery-flexible': 'pal-style-energy-battery-flexible',
  'energy-battery-lithium': 'pal-style-energy-battery-lithium',
  'energy-battery-lithiumsulfur': 'pal-style-energy-battery-lithiumsulfur',
  'energy-battery-recycle': 'pal-style-energy-battery-recycle',
  'energy-battery-silicon': 'pal-style-energy-battery-silicon',
  'energy-battery-sodium': 'pal-style-energy-battery-sodium',
  'energy-battery-solidstate': 'pal-style-energy-battery-solidstate',
  'energy-biomass-circular': 'pal-style-energy-biomass-circular',
  'energy-eco-city-green': 'pal-style-energy-eco-city-green',
  'energy-fuelcell-stack': 'pal-style-energy-fuelcell-stack',
  'energy-geothermal-magma': 'pal-style-energy-geothermal-magma',
  'energy-hydrogen-clean': 'pal-style-energy-hydrogen-clean',
  'energy-hydrogen-electrolysis': 'pal-style-energy-hydrogen-electrolysis',
  'energy-hydrogen-mobility': 'pal-style-energy-hydrogen-mobility',
  'energy-hydrogen-storage': 'pal-style-energy-hydrogen-storage',
  'energy-nuclear-fusion': 'pal-style-energy-nuclear-fusion',
  'energy-piezoelectric-vibration': 'pal-style-energy-piezoelectric-vibration',
  'energy-smart-grid-neon': 'pal-style-energy-smart-grid-neon',
  'energy-solar-parametric': 'pal-style-energy-solar-parametric',
  'energy-tidal-marine': 'pal-style-energy-tidal-marine',
  'energy-wind-aeolian': 'pal-style-energy-wind-aeolian',
  'fantasy': 'pal-style-fantasy',
  'fashion-beauty-ad': 'pal-style-fashion-beauty-ad',
  'fashion-editorial-luxury': 'pal-style-fashion-editorial-luxury',
  'fashion-gorpcore': 'pal-style-fashion-gorpcore',
  'fashion-haute-couture': 'pal-style-fashion-haute-couture',
  'fashion-kbeauty-glow': 'pal-style-fashion-kbeauty-glow',
  'fashion-maximalist': 'pal-style-fashion-maximalist',
  'fashion-monotone': 'pal-style-fashion-monotone',
  'fashion-seoul-street': 'pal-style-fashion-seoul-street',
  'fashion-streetwear-lookbook': 'pal-style-fashion-streetwear-lookbook',
  'fashion-y2k': 'pal-style-fashion-y2k',
  'finance-crypto-web3': 'pal-style-finance-crypto-web3',
  'finance-fintech-neon': 'pal-style-finance-fintech-neon',
  'finance-insurance-trust': 'pal-style-finance-insurance-trust',
  'finance-payment-speed': 'pal-style-finance-payment-speed',
  'finance-pension-wealth': 'pal-style-finance-pension-wealth',
  'finance-premium-banking': 'pal-style-finance-premium-banking',
  'finance-real-estate': 'pal-style-finance-real-estate',
  'finance-stock-market': 'pal-style-finance-stock-market',
  'flat': 'pal-canva',
  'food-bakery': 'pal-style-food-bakery',
  'food-bubble-tea': 'pal-style-food-bubble-tea',
  'food-cafe-aesthetic': 'pal-style-food-cafe-aesthetic',
  'food-dessert-pastel': 'pal-style-food-dessert-pastel',
  'food-fine-dining': 'pal-style-food-fine-dining',
  'food-flatlay': 'pal-style-food-flatlay',
  'food-healthy-vegan': 'pal-style-food-healthy-vegan',
  'food-korean-cuisine': 'pal-style-food-korean-cuisine',
  'food-pizza-popart': 'pal-style-food-pizza-popart',
  'food-ramen': 'pal-style-food-ramen',
  'food-street-food': 'pal-style-food-street-food',
  'food-wine-cocktail': 'pal-style-food-wine-cocktail',
  'game-horror-gothic': 'pal-style-game-horror-gothic',
  'game-isekai-anime': 'pal-style-game-isekai-anime',
  'game-mecha-robot': 'pal-style-game-mecha-robot',
  'game-open-world-nature': 'pal-style-game-open-world-nature',
  'game-retrowave-racing': 'pal-style-game-retrowave-racing',
  'game-rhythm-music': 'pal-style-game-rhythm-music',
  'game-space-opera': 'pal-style-game-space-opera',
  'game-steampunk': 'pal-style-game-steampunk',
  'game-survival-wilderness': 'pal-style-game-survival-wilderness',
  'handlettering': 'pal-style-handlettering',
  'heavy-aerospace-turbine': 'pal-style-heavy-aerospace-turbine',
  'heavy-auto-robotics': 'pal-style-heavy-auto-robotics',
  'heavy-construction-crane': 'pal-style-heavy-construction-crane',
  'heavy-industrial-welding-laser': 'pal-style-heavy-industrial-welding-laser',
  'heavy-mining-excavator': 'pal-style-heavy-mining-excavator',
  'heavy-petrochemical-pipe': 'pal-style-heavy-petrochemical-pipe',
  'heavy-precision-cnc': 'pal-style-heavy-precision-cnc',
  'heavy-railway-locomotive': 'pal-style-heavy-railway-locomotive',
  'heavy-shipbuilding-dock': 'pal-style-heavy-shipbuilding-dock',
  'heavy-steel-foundry': 'pal-style-heavy-steel-foundry',
  'heavy-wind-blade-molding': 'pal-style-heavy-wind-blade-molding',
  'illust-anime-cel': 'pal-style-illust-anime-cel',
  'illust-botanical': 'pal-style-illust-botanical',
  'illust-charcoal': 'pal-style-illust-charcoal',
  'illust-concept-art': 'pal-style-illust-concept-art',
  'illust-editorial': 'pal-style-illust-editorial',
  'illust-gouache': 'pal-style-illust-gouache',
  'illust-pastel-kawaii': 'pal-style-illust-pastel-kawaii',
  'illust-silkscreen': 'pal-style-illust-silkscreen',
  'illust-sticker-design': 'pal-style-illust-sticker-design',
  'illust-vector-portrait': 'pal-style-illust-vector-portrait',
  'isometric': 'pal-style-isometric',
  'letter-blackletter-gothic': 'pal-style-letter-blackletter-gothic',
  'letter-brush-calligraphy': 'pal-style-letter-brush-calligraphy',
  'letter-chalk-blackboard': 'pal-style-letter-chalk-blackboard',
  'letter-vintage-sign-painting': 'pal-style-letter-vintage-sign-painting',
  'letter-watercolor-lettering': 'pal-style-letter-watercolor-lettering',
  'lineart': 'pal-style-lineart',
  'lowpoly': 'pal-style-lowpoly',
  'med-3d': 'pal-cyber',
  'med-3d-game-scene': 'pal-candy-pop',
  'med-3d-paint-hybrid': 'pal-miricanvas',
  'med-abstract-expr': 'pal-candy-pop',
  'med-abstract-geo': 'pal-canva',
  'med-acrylic': 'pal-miricanvas',
  'med-adaptive-reuse': 'pal-anime-cinematic',
  'med-aerial-drone': 'pal-forest',
  'med-algorithmic-art': 'pal-candy-pop',
  'med-american-comic': 'pal-lego',
  'med-anime-bg': 'pal-anime-cinematic',
  'med-annual-report': 'pal-gov-blue',
  'med-app-dashboard': 'pal-canva',
  'med-arch-diagram': 'pal-anime-cinematic',
  'med-arch-render': 'pal-film-grain',
  'med-architecture-editorial': 'pal-canva',
  'med-art-deco': 'pal-terracotta',
  'med-art-nouveau-illust': 'pal-anime-cinematic',
  'med-aurora-long-exp': 'pal-forest',
  'med-auth-ui': 'pal-canva',
  'med-bauhaus': 'pal-canva',
  'med-beauty-ad': 'pal-canva',
  'med-beauty-campaign': 'pal-canva',
  'med-biophilic-arch': 'pal-anime-cinematic',
  'med-blueprint': 'pal-anime-cinematic',
  'med-book-cover-art': 'pal-candy',
  'med-boss-monster': 'pal-candy-pop',
  'med-brutalism-web': 'pal-candy-pop',
  'med-bubble-3d': 'pal-cyber',
  'med-budget-chart': 'pal-gov-blue',
  'med-bw-street-doc': 'pal-forest',
  'med-cel-anime': 'pal-lego',
  'med-cel-shade-3d': 'pal-anime-cinematic',
  'med-census-map': 'pal-gov-blue',
  'med-ceramic': 'pal-candy',
  'med-character-concept': 'pal-candy',
  'med-character-sheet': 'pal-candy-pop',
  'med-charcoal': 'pal-candy',
  'med-chibi': 'pal-webtoon',
  'med-childrens-book': 'pal-canva',
  'med-chinese-inkwash': 'pal-terracotta',
  'med-chrome-3d': 'pal-film-grain',
  'med-clay': 'pal-cyber',
  'med-collage': 'pal-candy-pop',
  'med-color-field': 'pal-candy-pop',
  'med-concept-fantasy': 'pal-candy-pop',
  'med-concept-game': 'pal-candy-pop',
  'med-concept-scifi': 'pal-candy-pop',
  'med-concept-sketch': 'pal-candy',
  'med-conceptual-fashion': 'pal-canva',
  'med-constructivism': 'pal-terracotta',
  'med-copperplate-illust': 'pal-terracotta',
  'med-corporate-portrait': 'pal-canva',
  'med-crayon': 'pal-miricanvas',
  'med-creature-design': 'pal-candy',
  'med-crystal-3d': 'pal-cyber',
  'med-cyber-cyberpunk': 'pal-anime-cinematic',
  'med-cyberpunk-vector': 'pal-canva',
  'med-dark-mode-app': 'pal-canva',
  'med-data-art': 'pal-candy-pop',
  'med-data-journalism': 'pal-gov-blue',
  'med-data-table-ui': 'pal-canva',
  'med-data-viz-infographic': 'pal-canva',
  'med-demoscene': 'pal-lego',
  'med-desert-sand': 'pal-forest',
  'med-design-system': 'pal-canva',
  'med-digital-impasto': 'pal-miricanvas',
  'med-digital-ink': 'pal-canva',
  'med-diorama': 'pal-candy',
  'med-dither-grayscale': 'pal-lego',
  'med-dot-art-sprite': 'pal-lego',
  'med-double-exposure': 'pal-anime-cinematic',
  'med-drone': 'pal-anime-cinematic',
  'med-duotone': 'pal-canva',
  'med-e-commerce-ui': 'pal-canva',
  'med-editorial-color': 'pal-film-grain',
  'med-embroidery': 'pal-candy',
  'med-empty-state': 'pal-canva',
  'med-encaustic': 'pal-candy',
  'med-environment-concept': 'pal-canva',
  'med-etching': 'pal-candy',
  'med-eval-matrix': 'pal-gov-blue',
  'med-exposure-photo': 'pal-film-grain',
  'med-fan-art': 'pal-candy',
  'med-fashion-illust': 'pal-miricanvas',
  'med-felt': 'pal-webtoon',
  'med-film-grain': 'pal-film-grain',
  'med-film-photo': 'pal-film-grain',
  'med-flat': 'pal-canva',
  'med-fluiddyn': 'pal-cyber',
  'med-folk-art': 'pal-terracotta',
  'med-food-editorial': 'pal-canva',
  'med-fractal': 'pal-candy-pop',
  'med-gacha-card': 'pal-candy-pop',
  'med-game-hud': 'pal-candy-pop',
  'med-gamification-ui': 'pal-canva',
  'med-generative': 'pal-candy-pop',
  'med-ghibli': 'pal-lego',
  'med-glass': 'pal-candy-pop',
  'med-glass-blowing': 'pal-candy',
  'med-glassmorphism': 'pal-canva',
  'med-glitch': 'pal-lego',
  'med-glitch-art': 'pal-lego',
  'med-golden-hour': 'pal-forest',
  'med-gouache': 'pal-canva',
  'med-gov-diagram': 'pal-gov-blue',
  'med-graphic-novel': 'pal-canva',
  'med-halftone': 'pal-lego',
  'med-hdr-landscape': 'pal-anime-cinematic',
  'med-heritage-drawing': 'pal-anime-cinematic',
  'med-hi-res-pixel': 'pal-lego',
  'med-high-key': 'pal-anime-cinematic',
  'med-hologram': 'pal-cyber',
  'med-infrared': 'pal-anime-cinematic',
  'med-ink': 'pal-miricanvas',
  'med-ink-splatter': 'pal-anime-cinematic',
  'med-interior-render': 'pal-film-grain',
  'med-interior-viz': 'pal-film-grain',
  'med-iso': 'pal-cyber',
  'med-iso-pixel-city': 'pal-lego',
  'med-jewelry-craft': 'pal-candy',
  'med-kinetic-pattern': 'pal-canva',
  'med-korean-calligraphy': 'pal-terracotta',
  'med-landing-page-ui': 'pal-canva',
  'med-landscape-arch': 'pal-anime-cinematic',
  'med-leather': 'pal-candy',
  'med-letterpress': 'pal-terracotta',
  'med-lifestyle-photo': 'pal-canva',
  'med-light-art': 'pal-candy-pop',
  'med-lino-print': 'pal-candy',
  'med-linocut': 'pal-terracotta',
  'med-lowpoly': 'pal-cyber',
  'med-luxury-mag': 'pal-canva',
  'med-luxury-product': 'pal-canva',
  'med-macrame': 'pal-candy',
  'med-macro': 'pal-anime-cinematic',
  'med-macro-nature': 'pal-forest',
  'med-manga': 'pal-anime-cinematic',
  'med-manhwa-line': 'pal-webtoon',
  'med-marbling': 'pal-candy',
  'med-matte-painting': 'pal-canva',
  'med-micro-photo': 'pal-anime-cinematic',
  'med-minhwa': 'pal-terracotta',
  'med-misty-forest': 'pal-forest',
  'med-moba-splash': 'pal-candy-pop',
  'med-mobile-game-ui': 'pal-candy-pop',
  'med-mobile-notification': 'pal-canva',
  'med-monotype': 'pal-miricanvas',
  'med-mosaic-art': 'pal-terracotta',
  'med-mountain-fog': 'pal-forest',
  'med-neon': 'pal-canva',
  'med-neon-glow': 'pal-cyber',
  'med-neon-sign': 'pal-lego',
  'med-neumorphism': 'pal-canva',
  'med-night-arch': 'pal-anime-cinematic',
  'med-night-portrait': 'pal-film-grain',
  'med-night-sky-photo': 'pal-forest',
  'med-noise-texture': 'pal-canva',
  'med-ocean-wave': 'pal-forest',
  'med-official-photo': 'pal-gov-blue',
  'med-oil': 'pal-miricanvas',
  'med-onboarding-flow': 'pal-canva',
  'med-op-art': 'pal-candy-pop',
  'med-optical-illusion': 'pal-candy-pop',
  'med-org-chart': 'pal-gov-blue',
  'med-origami': 'pal-terracotta',
  'med-papercraft': 'pal-candy',
  'med-papercut': 'pal-terracotta',
  'med-parametric-arch': 'pal-anime-cinematic',
  'med-particle-3d': 'pal-film-grain',
  'med-pencil': 'pal-canva',
  'med-photobash': 'pal-canva',
  'med-pixel-16bit': 'pal-lego',
  'med-pixel-anim-still': 'pal-lego',
  'med-pixel-cutscene': 'pal-lego',
  'med-pixel-horror': 'pal-lego',
  'med-pixel-icon-set': 'pal-lego',
  'med-pixel-landscape': 'pal-lego',
  'med-pixel-map': 'pal-lego',
  'med-pixel-particles': 'pal-lego',
  'med-pixel-portrait': 'pal-lego',
  'med-pixel-retro': 'pal-lego',
  'med-polaroid': 'pal-film-grain',
  'med-policy-deck': 'pal-gov-blue',
  'med-portrait-editorial': 'pal-canva',
  'med-pottery-craft': 'pal-candy',
  'med-presentation-slide': 'pal-gov-blue',
  'med-press-photo': 'pal-anime-cinematic',
  'med-product-3d': 'pal-cyber',
  'med-psychedelic': 'pal-lego',
  'med-psychedelic-art': 'pal-cyber',
  'med-reflection-symmetry': 'pal-forest',
  'med-report-cover': 'pal-gov-blue',
  'med-report-diagram': 'pal-gov-blue',
  'med-retro-crt': 'pal-lego',
  'med-retro-poster': 'pal-lego',
  'med-risograph': 'pal-terracotta',
  'med-rpg-bg-pixel': 'pal-lego',
  'med-sci-fi-matte': 'pal-canva',
  'med-season-color': 'pal-forest',
  'med-section-drawing': 'pal-anime-cinematic',
  'med-serigraphy': 'pal-terracotta',
  'med-shonen': 'pal-anime-cinematic',
  'med-side-scroll-bg': 'pal-lego',
  'med-social-content': 'pal-canva',
  'med-soft-pastel': 'pal-candy',
  'med-space-planning': 'pal-anime-cinematic',
  'med-speed-paint': 'pal-candy',
  'med-spline': 'pal-cyber',
  'med-sports-editorial': 'pal-canva',
  'med-sports-illust': 'pal-canva',
  'med-stainedglass': 'pal-terracotta',
  'med-stencil-graffiti': 'pal-terracotta',
  'med-storm-sky': 'pal-forest',
  'med-storyboard': 'pal-canva',
  'med-studio-still-life': 'pal-forest',
  'med-suprematism': 'pal-canva',
  'med-survey-viz': 'pal-gov-blue',
  'med-swiss-typography': 'pal-candy-pop',
  'med-synthwave': 'pal-lego',
  'med-system-arch-diagram': 'pal-canva',
  'med-tactical-map': 'pal-candy-pop',
  'med-technical-explode': 'pal-cyber',
  'med-tempera': 'pal-candy',
  'med-thermal': 'pal-anime-cinematic',
  'med-tilt-shift': 'pal-anime-cinematic',
  'med-timber-arch': 'pal-anime-cinematic',
  'med-travel-editorial': 'pal-canva',
  'med-ukiyoe': 'pal-terracotta',
  'med-underwater': 'pal-forest',
  'med-urban-masterplan': 'pal-anime-cinematic',
  'med-urban-planning': 'pal-anime-cinematic',
  'med-vaporwave': 'pal-lego',
  'med-vintage-anime': 'pal-anime-cinematic',
  'med-vintage-poster': 'pal-terracotta',
  'med-voxel': 'pal-cyber',
  'med-voxel-art': 'pal-lego',
  'med-watercolor': 'pal-miricanvas',
  'med-webtoon': 'pal-webtoon',
  'med-whitepaper': 'pal-gov-blue',
  'med-wildlife-photo': 'pal-forest',
  'med-wireframe': 'pal-canva',
  'med-wireframe-3d': 'pal-cyber',
  'med-wood-carving': 'pal-candy',
  'med-woodblock': 'pal-terracotta',
  'med-zine': 'pal-candy-pop',
  'minimalist': 'pal-style-minimalist',
  'modern-acid-design': 'pal-style-modern-acid-design',
  'modern-brutalist-web': 'pal-style-modern-brutalist-web',
  'modern-dark-library': 'pal-style-modern-dark-library',
  'modern-data-art': 'pal-style-modern-data-art',
  'modern-gradient-mesh': 'pal-style-modern-gradient-mesh',
  'modern-halftone-risograph': 'pal-style-modern-halftone-risograph',
  'modern-memphis-design': 'pal-style-modern-memphis-design',
  'modern-swiss-international': 'pal-style-modern-swiss-international',
  'modern-synthwave': 'pal-style-modern-synthwave',
  'modern-typographic-poster': 'pal-style-modern-typographic-poster',
  'modern-vaporwave': 'pal-style-modern-vaporwave',
  'music-classical-elegant': 'pal-style-music-classical-elegant',
  'music-concert-energy': 'pal-style-music-concert-energy',
  'music-edm-festival': 'pal-style-music-edm-festival',
  'music-hiphop-street': 'pal-style-music-hiphop-street',
  'music-indie-band': 'pal-style-music-indie-band',
  'music-jazz-bar': 'pal-style-music-jazz-bar',
  'music-kpop-idol': 'pal-style-music-kpop-idol',
  'music-mv-cinematic': 'pal-style-music-mv-cinematic',
  'nature-aurora': 'pal-style-nature-aurora',
  'nature-autumn-foliage': 'pal-style-nature-autumn-foliage',
  'nature-cottagecore': 'pal-style-nature-cottagecore',
  'nature-deep-sea': 'pal-style-nature-deep-sea',
  'nature-desert-sunset': 'pal-style-nature-desert-sunset',
  'nature-misty-forest': 'pal-style-nature-misty-forest',
  'nature-rainforest': 'pal-style-nature-rainforest',
  'nature-solarpunk': 'pal-style-nature-solarpunk',
  'nature-spring-cherry': 'pal-style-nature-spring-cherry',
  'nature-summer-tropical': 'pal-style-nature-summer-tropical',
  'nature-volcanic': 'pal-style-nature-volcanic',
  'nature-winter-snow': 'pal-style-nature-winter-snow',
  'none': 'block',
  'oil': 'pal-style-oil',
  'origami': 'pal-style-origami',
  'pencil': 'pal-style-pencil',
  'photo-aerial-drone': 'pal-style-photo-aerial-drone',
  'photo-dark-moody': 'pal-style-photo-dark-moody',
  'photo-double-exposure': 'pal-style-photo-double-exposure',
  'photo-golden-hour': 'pal-style-photo-golden-hour',
  'photo-hyperrealistic-portrait': 'pal-style-photo-hyperrealistic-portrait',
  'photo-lo-fi-aesthetic': 'pal-style-photo-lo-fi-aesthetic',
  'photo-long-exposure': 'pal-style-photo-long-exposure',
  'photo-macro-nature': 'pal-style-photo-macro-nature',
  'photo-street-bw': 'pal-style-photo-street-bw',
  'photo-underwater': 'pal-style-photo-underwater',
  'pixel-art': 'pal-style-pixel-art',
  'polaroid': 'pal-style-polaroid',
  'popart': 'pal-style-popart',
  'product': 'pal-style-product',
  'public-application-flow': 'pal-style-public-application-flow',
  'public-campaign': 'pal-style-public-campaign',
  'public-civic-participation': 'pal-style-public-civic-participation',
  'public-clean-energy-white': 'pal-style-public-clean-energy-white',
  'public-culture': 'pal-style-public-culture',
  'public-data-report': 'pal-style-public-data-report',
  'public-digital-service': 'pal-style-public-digital-service',
  'public-eco': 'pal-style-public-eco',
  'public-edu': 'pal-style-public-edu',
  'public-facility-reservation': 'pal-style-public-facility-reservation',
  'public-grant-program': 'pal-style-public-grant-program',
  'public-health': 'pal-style-public-health',
  'public-health-white-card': 'pal-style-public-health-white-card',
  'public-policy': 'pal-style-public-policy',
  'public-resident-service': 'pal-style-public-resident-service',
  'public-safety': 'pal-style-public-safety',
  'public-senior-care': 'pal-style-public-senior-care',
  'public-smart-city': 'pal-style-public-smart-city',
  'public-welfare': 'pal-style-public-welfare',
  'public-white-notice-board': 'pal-style-public-white-notice-board',
  'public-youth-program': 'pal-style-public-youth-program',
  'quilt': 'pal-style-quilt',
  'rpg': 'pal-style-rpg',
  'science-ai-machine-learning': 'pal-style-science-ai-machine-learning',
  'science-biomedical': 'pal-style-science-biomedical',
  'science-data-viz': 'pal-style-science-data-viz',
  'science-dna': 'pal-style-science-dna',
  'science-fractal': 'pal-style-science-fractal',
  'science-neural-network': 'pal-style-science-neural-network',
  'science-particle-physics': 'pal-style-science-particle-physics',
  'science-periodic-table': 'pal-style-science-periodic-table',
  'science-quantum-circuit': 'pal-style-science-quantum-circuit',
  'science-space': 'pal-style-science-space',
  'science-weather-satellite': 'pal-style-science-weather-satellite',
  'sketch-architectural': 'pal-style-sketch-architectural',
  'sketch-fashion-croquis': 'pal-style-sketch-fashion-croquis',
  'sketch-gesture-drawing': 'pal-style-sketch-gesture-drawing',
  'sketch-ink-pen': 'pal-style-sketch-ink-pen',
  'sketch-pencil-rough': 'pal-style-sketch-pencil-rough',
  'sketch-scientific-illustration': 'pal-style-sketch-scientific-illustration',
  'software-abstract-data': 'pal-style-software-abstract-data',
  'software-agile-kanban': 'pal-style-software-agile-kanban',
  'software-ai-agent-orchestrator': 'pal-style-software-ai-agent-orchestrator',
  'software-ai-brain-neural': 'pal-style-software-ai-brain-neural',
  'software-ai-computervision': 'pal-style-software-ai-computervision',
  'software-ai-llm-transformer': 'pal-style-software-ai-llm-transformer',
  'software-api-integration': 'pal-style-software-api-integration',
  'software-cyber-code': 'pal-style-software-cyber-code',
  'software-cybersecurity-shield': 'pal-style-software-cybersecurity-shield',
  'software-database-cube': 'pal-style-software-database-cube',
  'software-datacenter-edge': 'pal-style-software-datacenter-edge',
  'software-datacenter-hyperscale': 'pal-style-software-datacenter-hyperscale',
  'software-datacenter-liquidcooling': 'pal-style-software-datacenter-liquidcooling',
  'software-devops-infinity': 'pal-style-software-devops-infinity',
  'software-glass-ui': 'pal-style-software-glass-ui',
  'software-mobility-autonomous': 'pal-style-software-mobility-autonomous',
  'software-mobility-sdv': 'pal-style-software-mobility-sdv',
  'software-mobility-uam': 'pal-style-software-mobility-uam',
  'software-quantum-computing': 'pal-style-software-quantum-computing',
  'software-server-rack-airflow': 'pal-style-software-server-rack-airflow',
  'sport-combat': 'pal-style-sport-combat',
  'sport-dynamic-action': 'pal-style-sport-dynamic-action',
  'sport-esports': 'pal-style-sport-esports',
  'sport-extreme': 'pal-style-sport-extreme',
  'sport-infographic': 'pal-style-sport-infographic',
  'sport-marathon': 'pal-style-sport-marathon',
  'sport-olympic': 'pal-style-sport-olympic',
  'sport-retro-poster': 'pal-style-sport-retro-poster',
  'sport-team-uniform': 'pal-style-sport-team-uniform',
  'sport-winter': 'pal-style-sport-winter',
  'steel-cold-rolled-coil': 'pal-style-steel-cold-rolled-coil',
  'steel-continuous-casting': 'pal-style-steel-continuous-casting',
  'steel-gigasteel-automotive': 'pal-style-steel-gigasteel-automotive',
  'steel-heavy-plate': 'pal-style-steel-heavy-plate',
  'steel-hot-rolling': 'pal-style-steel-hot-rolling',
  'steel-hydrogen-reduction': 'pal-style-steel-hydrogen-reduction',
  'steel-smart-factory': 'pal-style-steel-smart-factory',
  'steel-stainless-corrosion': 'pal-style-steel-stainless-corrosion',
  'travel-airport-aviation': 'pal-style-travel-airport-aviation',
  'travel-backpacker-adventure': 'pal-style-travel-backpacker-adventure',
  'travel-cruise-oceanic': 'pal-style-travel-cruise-oceanic',
  'travel-eco-nature': 'pal-style-travel-eco-nature',
  'travel-korea-heritage': 'pal-style-travel-korea-heritage',
  'travel-luxury-resort': 'pal-style-travel-luxury-resort',
  'travel-urban-explorer': 'pal-style-travel-urban-explorer',
  'travel-wilderness-expedition': 'pal-style-travel-wilderness-expedition',
  'vintage': 'pal-style-vintage',
  'voxel': 'pal-style-voxel',
  'watercolor': 'pal-style-watercolor',
  'wellness-active-fitness': 'pal-style-wellness-active-fitness',
  'wellness-clean-nutrition': 'pal-style-wellness-clean-nutrition',
  'wellness-forest-therapy': 'pal-style-wellness-forest-therapy',
  'wellness-herbal-remedy': 'pal-style-wellness-herbal-remedy',
  'wellness-kbeauty-glow': 'pal-style-wellness-kbeauty-glow',
  'wellness-luxury-spa': 'pal-style-wellness-luxury-spa',
  'wellness-mindfulness-zen': 'pal-style-wellness-mindfulness-zen',
  'wellness-yoga-sunrise': 'pal-style-wellness-yoga-sunrise',
  '클립보드 이미지를 이 주제의 대표 샘플로 서버에 저장했습니다.': '서버 저장 실패: 로컬 브라우저에 임시 저장했습니다.',
  '클립보드 이미지를 이 화풍의 대표 샘플로 서버에 저장했습니다.': '서버 저장 실패: 로컬 브라우저에 임시 저장했습니다.',
  '🌙 다크': '☀️ 라이트',
};

  function autoMapPaletteForMedium(med) {
    if (!med || !med.id) return;
    if (isPaletteOverriddenByUser) return;

    // 1) 명시적 매핑
    const explicit = STYLE_TO_PALETTE_MAP[med.id] || STYLE_TO_PALETTE_MAP[med.nameEn] || STYLE_TO_PALETTE_MAP[med.nameKo] || (window && window.STYLE_TO_PALETTE_MAP && (window.STYLE_TO_PALETTE_MAP[med.id] || window.STYLE_TO_PALETTE_MAP[med.nameEn] || window.STYLE_TO_PALETTE_MAP[med.nameKo]));
    if (explicit) {
      const idx = MIXER_PALETTES.findIndex(p => p.id === explicit);
      if (idx >= 0) { selectedPaletteIdx = idx; syncPaletteSelection(); return; }
    }

    // 2) CONCEPT_STYLES와 이름/태그 매칭
    // 2) 키워드 기반 휴리스틱 매핑
    const text = [med.id, med.nameEn, med.nameKo, med.desc, med.prefix, med.suffix].filter(Boolean).join(' ').toLowerCase();
    const keywordMap = [
      { keys: ['pixel','voxel','sprite','retro','8bit','16bit','pixel-art','voxel'], palette: 'pal-lego' },
      { keys: ['lego','brick'], palette: 'pal-lego' },
      { keys: ['mario','nintendo'], palette: 'pal-mario' },
      { keys: ['roblox','roblo'], palette: 'pal-roblox' },
      { keys: ['mabinogi'], palette: 'pal-mabinogi' },
      { keys: ['webtoon','manhwa','korean webtoon'], palette: 'pal-webtoon' },
      { keys: ['chibi','kawaii','cute'], palette: 'pal-webtoon' },
      { keys: ['anime','manga','cel','cel shading','ghibli','studio ghibli'], palette: 'pal-anime-cinematic' },
      { keys: ['cinematic','film','movie','luts','color grading','cinematic'], palette: 'pal-film-grain' },
      { keys: ['flat','vector','bauhaus','duotone','pop art','popart','risograph','minimal'], palette: 'pal-canva' },
      { keys: ['watercolor','gouache','oil painting','oil','acrylic','painterly'], palette: 'pal-miricanvas' },
      { keys: ['neon','cyberpunk','holographic','glow'], palette: 'pal-cyber' },
      { keys: ['isometric','iso','lowpoly','low-poly','low poly'], palette: 'pal-canva' },
      { keys: ['bokeh','portrait','polaroid','vintage film','film grain','photorealistic'], palette: 'pal-film-grain' }
    ];

    for (const km of keywordMap) {
      for (const k of km.keys) {
        if (text.includes(k)) {
          const idx = MIXER_PALETTES.findIndex(p => p.id === km.palette);
          if (idx >= 0) { selectedPaletteIdx = idx; syncPaletteSelection(); return; }
        }
      }
    }

    // 3) 색상 HEX 겹침 기반 매핑
    if (med.colorHints && Array.isArray(med.colorHints) && med.colorHints.length) {
      let best = -1, bestScore = -1;
      MIXER_PALETTES.forEach((p, i) => {
        const common = p.colors.filter(c => med.colorHints.includes(c)).length;
        if (common > bestScore) { bestScore = common; best = i; }
      });
      if (best >= 0 && bestScore > 0) { selectedPaletteIdx = best; syncPaletteSelection(); return; }
    }

    // 4) 카테고리 기반 완화 매핑 (카테고리 이름이 정확히 일치하지 않을 수 있으므로 매핑 테이블 사용)
    const cat = String(med.category || '').toLowerCase();
    const CAT_TO_PALETTE_CATS = {
      tech3d: ['tech'],
      '3d': ['tech'],
      tech: ['tech'],
      game: ['energy','tech','soft'],
      pixel_adv: ['candy','soft'],
      analog: ['soft','nature'],
      graphic: ['soft','modern','graphic'],
      anime: ['photo','soft'],
      photo: ['photo'],
      craft: ['soft'],
      digital_paint: ['soft','modern'],
      arch: ['nature','soft','tech'],
      editorial: ['soft','photo'],
      official: ['soft','neutral'],
      modern: ['soft','modern'],
      nature: ['nature'],
      energy: ['energy']
    };

    const candidateCats = CAT_TO_PALETTE_CATS[cat] || [cat];
    for (const tryCat of candidateCats) {
      const idx = MIXER_PALETTES.findIndex(p => p.category === tryCat);
      if (idx >= 0) { selectedPaletteIdx = idx; syncPaletteSelection(); return; }
    }

    // 5) 최종 폴백: 가시성이 좋은 기본 팔레트 선택
    const fallback = MIXER_PALETTES.findIndex(p => p.category === 'soft' || p.category === 'nature' || p.category === 'tech');
    if (fallback >= 0) { selectedPaletteIdx = fallback; syncPaletteSelection(); return; }
  }

  // UI 동기화: selectedPaletteIdx에 맞춰 그리드 활성화 및 관련 입력 동기화
  function syncPaletteSelection() {
    try {
      const groupGrid = document.getElementById('mixerPalettesGroupGrid');
      if (groupGrid) {
        groupGrid.querySelectorAll('.mixer-item-card').forEach((el) => {
          const idx = parseInt(el.dataset.index, 10);
          el.classList.toggle('active', idx === selectedPaletteIdx);
          el.setAttribute('aria-pressed', String(idx === selectedPaletteIdx));
        });
      }
    } catch (e) {}
    // 추가: 팔레트 색상 입력/픽커 동기화(만약 존재하면)
    try { syncColorInputs && typeof syncColorInputs === 'function' && syncColorInputs(); } catch (e) {}
  }

    // 외부에서 스타일 id로 믹서 팔레트 적용하는 공개 함수
    window.applyMixerPaletteForStyle = function(styleOrId) {
      try {
        const styleId = typeof styleOrId === 'string' ? styleOrId : (styleOrId && styleOrId.id);
        if (!styleId) return false;
        const pid = `pal-style-${styleId}`;
        let idx = MIXER_PALETTES.findIndex(p => p.id === pid);

        // 명시적 매핑 확인
        if (idx === -1) {
          const explicit = STYLE_TO_PALETTE_MAP[styleId] || (window && window.STYLE_TO_PALETTE_MAP && window.STYLE_TO_PALETTE_MAP[styleId]);
          if (explicit) idx = MIXER_PALETTES.findIndex(p => p.id === explicit);
        }

        if (idx >= 0) {
          selectedPaletteIdx = idx;
          // 카테고리 필터 초기화하여 추가된 팔레트 노출 보장
          activePaletteCategory = 'all';
          activePaletteFilter = 'all';
          activePaletteColorFilter = 'all';

          try {
            // 카테고리 탭 UI 동기화
            const catTabs = document.querySelectorAll('#mixerPaletteCategoryTabs .mixer-cat-btn');
            catTabs.forEach(btn => {
              btn.classList.toggle('active', btn.dataset.paletteCat === 'all');
            });
            const filterBtns = document.querySelectorAll('.mixer-pal-filter-btn');
            filterBtns.forEach(btn => {
              btn.classList.toggle('active', btn.dataset.palFilter === 'all');
            });
            const colorBtns = document.querySelectorAll('.mixer-pal-color-btn');
            colorBtns.forEach(btn => {
              btn.classList.toggle('active', btn.dataset.palColor === 'all');
            });
          } catch(e) {}

          try { switchStep(3); } catch(e) {}
          try { syncPaletteSelection(); } catch(e) {}
          try { renderPalettes(); } catch(e) {}
          try { renderPreviewCard(); } catch(e) {}
          const tabBtn = document.getElementById('tabBtnConceptMixer');
          if (tabBtn) tabBtn.click();
          return true;
        }
      } catch (err) { console.error(err); }
      return false;
    };

    // 샘플 채우기 등 외부 소스의 임의 팔레트를 믹서에 동기화
    window.applyMixerSamplePalette = function(colors, nameKo) {
      try {
        if (!Array.isArray(colors) || !colors.length) return false;
        const SAMPLE_PAL_ID = 'pal-sample-custom';
        const existing = MIXER_PALETTES.findIndex(p => p.id === SAMPLE_PAL_ID);
        const entry = {
          id: SAMPLE_PAL_ID,
          category: 'multicolor',
          name: nameKo || '샘플 팔레트',
          mode: 'light',
          colors: colors.slice(0, 5),
          colorMapping: '',
        };
        if (existing >= 0) {
          MIXER_PALETTES[existing] = entry;
          selectedPaletteIdx = existing;
        } else {
          MIXER_PALETTES.push(entry);
          selectedPaletteIdx = MIXER_PALETTES.length - 1;
        }
        activePaletteCategory = 'all';
        activePaletteFilter = 'all';
        activePaletteColorFilter = 'all';
        try { syncPaletteSelection(); } catch(e) {}
        try { renderPalettes(); } catch(e) {}
        try { renderPreviewCard(); } catch(e) {}
        return true;
      } catch(err) { console.error(err); }
      return false;
    };

      // 공개 API: 외부에서 쓰기 편하도록 몇 가지 헬퍼 노출
      try {
        if (typeof window !== 'undefined') {
          window.autoMapPaletteForMedium = autoMapPaletteForMedium;
          window.getStyleToPaletteMap = function() { return STYLE_TO_PALETTE_MAP; };
          window.setStyleToPaletteMap = function(map) { if (map && typeof map === 'object') Object.assign(STYLE_TO_PALETTE_MAP, map); return STYLE_TO_PALETTE_MAP; };
        }
      } catch (e) {}

    // 분류형 색상 테마(Palette) 렌더링
  function renderCompositions() {
    const grid = document.getElementById('conceptCompositionGrid');
    const container = document.getElementById('conceptMixerContainer');
    const targetGrid = grid || (container && container.querySelector('#mixerCompositionGrid'));
    if (!targetGrid) return;
    targetGrid.innerHTML = '';

    ensureVisibleCompositionSelection();
    syncCompositionCategoryTabs();
    const list = getVisibleCompositions();

    const displayList = [MIXER_COMPOSITIONS.find(c => c.id === 'none'), ...list].filter(Boolean);

    displayList.forEach(item => {
      const card = document.createElement('div');
      card.className = 'mixer-item';
      if (item.id === selectedCompositionId) card.classList.add('active');
      card.setAttribute('aria-pressed', String(item.id === selectedCompositionId));

      let thumbHtml = '';
      let hasCustom = false;
      let imageUrl = '';
      let keyword = '';

      if (item.id !== 'none') {
        const customSamples = getCustomSamplesForMed(item.id);
        hasCustom = Boolean(customSamples[0]);
        imageUrl = customSamples[0] || UNSPLASH_CACHE[item.id] || getMixerPresetSampleUrl(item.id);
        keyword = resolveSearchKeyword(item.id, item.suffix);

        thumbHtml = [
          '<div class="mixer-item-thumb">',
          '  <img src="' + imageUrl + '" alt="' + item.nameKo + ' 예시" />',
          '  <button type="button" class="mixer-item-thumb-settings-btn" title="이미지 설정">⚙️</button>',
          '  <div class="mixer-item-thumb-overlay" hidden>',
          '    <div class="overlay-header">',
          '      <span>이미지 설정</span>',
          '      <button type="button" class="overlay-close-btn">&times;</button>',
          '    </div>',
          '    <div class="overlay-body">',
          '      <input type="text" class="overlay-kw-input" value="' + keyword + '" placeholder="검색어 (영문)" style="width:100%; height:26px; border:1px solid #ccc; border-radius:4px; padding:0 4px; box-sizing:border-box; font-size:11px;" />',
          '      <div class="overlay-buttons" style="display:grid; grid-template-columns:1fr 1.5fr 1fr 1fr; gap:4px; margin-top:5px;">',
          '        <button type="button" class="overlay-btn btn-apply" style="height:24px; font-size:10px; cursor:pointer;" title="적용">✓</button>',
          '        <button type="button" class="overlay-btn btn-refresh" style="height:24px; font-size:10px; cursor:pointer;">🔄다음</button>',
          '        <button type="button" class="overlay-btn btn-replace" style="height:24px; font-size:10px; cursor:pointer;">📁파일</button>',
          '        <button type="button" class="overlay-btn btn-save" style="height:24px; font-size:10px; cursor:pointer;">💾저장</button>',
          '      </div>',
          '      <button type="button" class="overlay-btn btn-reset" ' + (hasCustom ? '' : 'disabled') + ' style="width:100%; height:24px; margin-top:4px; font-size:10px; cursor:pointer;">↩ 원본 복원</button>',
          '      <div class="overlay-status-msg" style="font-size:9px; color:#555; margin-top:3px; height:12px; overflow:hidden;"></div>',
          '    </div>',
          '  </div>',
          '  <input type="file" class="overlay-file-input" accept="image/*" hidden />',
          '</div>'
        ].join('\n');
      } else {
        thumbHtml = [
          '<div class="mixer-item-thumb" style="display:flex; align-items:center; justify-content:center; background:#f1f5f9; color:var(--text-secondary,#64748b);">',
          '  <span style="font-size: 24px;">❌</span>',
          '</div>'
        ].join('\n');
      }

      card.innerHTML = [
        thumbHtml,
        '<div class="mixer-item-text-wrap" style="padding: 10px;">',
        '  <div class="mixer-item-head">' + item.emoji + ' ' + item.nameKo + '</div>',
        '  <div class="mixer-item-desc" style="margin-top: 4.5px;">' + item.desc + '</div>',
        '</div>'
      ].join('\n');

      // 인라인 오버레이 바인딩 로직
      if (item.id !== 'none') {
        const settingsBtn = card.querySelector('.mixer-item-thumb-settings-btn');
        const overlay = card.querySelector('.mixer-item-thumb-overlay');
        const closeBtn = card.querySelector('.overlay-close-btn');
        const kwInput = card.querySelector('.overlay-kw-input');
        const applyBtn = card.querySelector('.btn-apply');
        const refreshBtn = card.querySelector('.btn-refresh');
        const replaceBtn = card.querySelector('.btn-replace');
        const fileInput = card.querySelector('.overlay-file-input');
        const saveBtn = card.querySelector('.btn-save');
        const resetBtn = card.querySelector('.btn-reset');
        const statusMsg = card.querySelector('.overlay-status-msg');
        const imgEl = card.querySelector('.mixer-item-thumb img');
        bindMixerPresetSampleFallback(imgEl);

        const setMsg = (txt, isErr = false) => {
          if (statusMsg) {
            statusMsg.textContent = txt;
            statusMsg.style.color = isErr ? '#dc2626' : '';
          }
        };

        settingsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          overlay.hidden = false;
        });

        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          overlay.hidden = true;
        });

        card.addEventListener('click', (e) => {
          if (overlay && !overlay.hidden) return; // 오버레이 켜져있을 땐 카드 선택 방지
          selectedCompositionId = item.id;
          container.querySelectorAll('#mixerCompositionGrid .mixer-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === item.id);
          });
          updateMixerSummaryBar();
          renderPreviewCard();
        });

        // 1) 검색어 적용
        applyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const val = kwInput.value.trim();
          if (!val) return;
          setCustomKeyword(item.id, val);
          setMsg('검색 키워드가 적용되었습니다.');
        });

        // 2) Unsplash 다음 사진
        refreshBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!getUnsplashKey()) {
            setMsg('unsplash API Key가 필요합니다.', true);
            return;
          }
          refreshBtn.disabled = true;
          refreshBtn.textContent = '...';
          setMsg('새 사진 불러오는 중...');
          delete UNSPLASH_CACHE[item.id];
          try {
            const query = kwInput.value.trim() || item.suffix.split(',')[0].trim();
            const url = await fetchUnsplashImage(item.id, query, true);
            if (url && imgEl) imgEl.src = url;
            setMsg('로컬 파일로 저장되었습니다.');
            resetBtn.disabled = false;
          } catch (err) {
            setMsg('사진 변경 실패', true);
          } finally {
            refreshBtn.disabled = false;
            refreshBtn.textContent = '🔄다음';
          }
        });

        // 3) 파일 교체 업로드
        replaceBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
          const file = fileInput.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = async ev => {
            const dataUrl = ev.target.result;
            setMsg('서버 저장 중...');
            try {
              const res = await fetch('/api/save-mixer-sample', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ medId: item.id, idx: 0, image: dataUrl })
              });
              const ret = await res.json();
              if (ret.ok && ret.url) {
                setCustomSample(item.id, 0, ret.url);
                if (imgEl) imgEl.src = ret.url;
                setMsg('서버 저장 완료!');
                resetBtn.disabled = false;
              } else {
                throw new Error();
              }
            } catch (err) {
              setCustomSample(item.id, 0, dataUrl);
              if (imgEl) imgEl.src = dataUrl;
              setMsg('로컬 저장 완료 (임시)');
              resetBtn.disabled = false;
            }
          };
          reader.readAsDataURL(file);
        });

        // 4) 저장
        saveBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!imgEl || !imgEl.src) return;
          const imageSource = getManagedMixerImageSource(imgEl);
          if (!imageSource) {
            setMsg('원격 이미지 주소는 저장할 수 없습니다.', true);
            return;
          }
          saveBtn.disabled = true;
          setMsg('서버 저장 중...');
          try {
            const res = await fetch('/api/save-mixer-sample', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ medId: item.id, idx: 0, image: imageSource })
            });
            const ret = await res.json();
            if (ret.ok && ret.url) {
              setCustomSample(item.id, 0, ret.url);
              setMsg('저장 성공!');
              resetBtn.disabled = false;
            } else {
              throw new Error();
            }
          } catch (err) {
            if (setCustomSample(item.id, 0, imageSource)) {
              setMsg('서버 저장 실패: 브라우저에 임시 저장했습니다.', true);
              resetBtn.disabled = false;
            } else {
              setMsg('저장하지 못했습니다.', true);
            }
          } finally {
            saveBtn.disabled = false;
          }
        });

        // 5) 복원
        resetBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          clearCustomSample(item.id, 0);
          clearCustomKeyword(item.id);
          delete UNSPLASH_CACHE[item.id];
          if (imgEl) imgEl.src = getMixerPresetSampleUrl(item.id);
          kwInput.value = item.suffix.split(',')[0].trim();
          setMsg('기본 사진으로 복원되었습니다.');
          resetBtn.disabled = true;
        });
      } else {
        card.addEventListener('click', () => {
          selectedCompositionId = 'none';
          container.querySelectorAll('#mixerCompositionGrid .mixer-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === 'none');
          });
          updateMixerSummaryBar();
          renderPreviewCard();
        });
      }

      card.setAttribute('data-id', item.id);
      targetGrid.appendChild(card);
    });
  }

  function renderTypographies() {
    const grid = document.getElementById('conceptTypographyGrid');
    const container = document.getElementById('conceptMixerContainer');
    const targetGrid = grid || (container && container.querySelector('#mixerTypographyGrid'));
    if (!targetGrid) return;
    targetGrid.innerHTML = '';

    ensureVisibleTypographySelection();
    syncTypographyCategoryTabs();
    const list = getVisibleTypographies();

    const displayList = [MIXER_TYPOGRAPHIES.find(r => r.id === 'none'), ...list].filter(Boolean);

    displayList.forEach(item => {
      const card = document.createElement('div');
      card.className = 'mixer-item';
      if (item.id === selectedTypographyId) card.classList.add('active');
      card.setAttribute('aria-pressed', String(item.id === selectedTypographyId));

      let thumbHtml = '';
      let hasCustom = false;
      let imageUrl = '';
      let keyword = '';

      if (item.id !== 'none') {
        const customSamples = getCustomSamplesForMed(item.id);
        hasCustom = Boolean(customSamples[0]);
        imageUrl = customSamples[0] || UNSPLASH_CACHE[item.id] || getMixerPresetSampleUrl(item.id);
        keyword = resolveSearchKeyword(item.id, item.prompt);

        thumbHtml = [
          '<div class="mixer-item-thumb">',
          '  <img src="' + imageUrl + '" alt="' + item.nameKo + ' 예시" />',
          '  <button type="button" class="mixer-item-thumb-settings-btn" title="이미지 설정">⚙️</button>',
          '  <div class="mixer-item-thumb-overlay" hidden>',
          '    <div class="overlay-header">',
          '      <span>이미지 설정</span>',
          '      <button type="button" class="overlay-close-btn">&times;</button>',
          '    </div>',
          '    <div class="overlay-body">',
          '      <input type="text" class="overlay-kw-input" value="' + keyword + '" placeholder="검색어 (영문)" style="width:100%; height:26px; border:1px solid #ccc; border-radius:4px; padding:0 4px; box-sizing:border-box; font-size:11px;" />',
          '      <div class="overlay-buttons" style="display:grid; grid-template-columns:1fr 1.5fr 1fr 1fr; gap:4px; margin-top:5px;">',
          '        <button type="button" class="overlay-btn btn-apply" style="height:24px; font-size:10px; cursor:pointer;" title="적용">✓</button>',
          '        <button type="button" class="overlay-btn btn-refresh" style="height:24px; font-size:10px; cursor:pointer;">🔄다음</button>',
          '        <button type="button" class="overlay-btn btn-replace" style="height:24px; font-size:10px; cursor:pointer;">📁파일</button>',
          '        <button type="button" class="overlay-btn btn-save" style="height:24px; font-size:10px; cursor:pointer;">💾저장</button>',
          '      </div>',
          '      <button type="button" class="overlay-btn btn-reset" ' + (hasCustom ? '' : 'disabled') + ' style="width:100%; height:24px; margin-top:4px; font-size:10px; cursor:pointer;">↩ 원본 복원</button>',
          '      <div class="overlay-status-msg" style="font-size:9px; color:#555; margin-top:3px; height:12px; overflow:hidden;"></div>',
          '    </div>',
          '  </div>',
          '  <input type="file" class="overlay-file-input" accept="image/*" hidden />',
          '</div>'
        ].join('\n');
      } else {
        thumbHtml = [
          '<div class="mixer-item-thumb" style="display:flex; align-items:center; justify-content:center; background:#f1f5f9; color:var(--text-secondary,#64748b);">',
          '  <span style="font-size: 24px;">❌</span>',
          '</div>'
        ].join('\n');
      }

      card.innerHTML = [
        thumbHtml,
        '<div class="mixer-item-text-wrap" style="padding: 10px;">',
        '  <div class="mixer-item-head">' + item.emoji + ' ' + item.nameKo + '</div>',
        '  <div class="mixer-item-desc" style="margin-top: 4.5px;">' + item.desc + '</div>',
        '</div>'
      ].join('\n');

      // 인라인 오버레이 바인딩 로직
      if (item.id !== 'none') {
        const settingsBtn = card.querySelector('.mixer-item-thumb-settings-btn');
        const overlay = card.querySelector('.mixer-item-thumb-overlay');
        const closeBtn = card.querySelector('.overlay-close-btn');
        const kwInput = card.querySelector('.overlay-kw-input');
        const applyBtn = card.querySelector('.btn-apply');
        const refreshBtn = card.querySelector('.btn-refresh');
        const replaceBtn = card.querySelector('.btn-replace');
        const fileInput = card.querySelector('.overlay-file-input');
        const saveBtn = card.querySelector('.btn-save');
        const resetBtn = card.querySelector('.btn-reset');
        const statusMsg = card.querySelector('.overlay-status-msg');
        const imgEl = card.querySelector('.mixer-item-thumb img');
        bindMixerPresetSampleFallback(imgEl);

        const setMsg = (txt, isErr = false) => {
          if (statusMsg) {
            statusMsg.textContent = txt;
            statusMsg.style.color = isErr ? '#dc2626' : '';
          }
        };

        settingsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          overlay.hidden = false;
        });

        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          overlay.hidden = true;
        });

        card.addEventListener('click', (e) => {
          if (overlay && !overlay.hidden) return;
          selectedTypographyId = item.id;
          container.querySelectorAll('#mixerTypographyGrid .mixer-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === item.id);
          });
          updateMixerSummaryBar();
          renderPreviewCard();
        });

        // 1) 검색어 적용
        applyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const val = kwInput.value.trim();
          if (!val) return;
          setCustomKeyword(item.id, val);
          setMsg('검색 키워드가 적용되었습니다.');
        });

        // 2) Unsplash 다음 사진
        refreshBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!getUnsplashKey()) {
            setMsg('unsplash API Key가 필요합니다.', true);
            return;
          }
          refreshBtn.disabled = true;
          refreshBtn.textContent = '...';
          setMsg('새 사진 불러오는 중...');
          delete UNSPLASH_CACHE[item.id];
          try {
            const query = kwInput.value.trim() || item.prompt.split(',')[0].trim();
            const url = await fetchUnsplashImage(item.id, query, true);
            if (url && imgEl) imgEl.src = url;
            setMsg('로컬 파일로 저장되었습니다.');
            resetBtn.disabled = false;
          } catch (err) {
            setMsg('사진 변경 실패', true);
          } finally {
            refreshBtn.disabled = false;
            refreshBtn.textContent = '🔄다음';
          }
        });

        // 3) 파일 교체 업로드
        replaceBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
          const file = fileInput.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = async ev => {
            const dataUrl = ev.target.result;
            setMsg('서버 저장 중...');
            try {
              const res = await fetch('/api/save-mixer-sample', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ medId: item.id, idx: 0, image: dataUrl })
              });
              const ret = await res.json();
              if (ret.ok && ret.url) {
                setCustomSample(item.id, 0, ret.url);
                if (imgEl) imgEl.src = ret.url;
                setMsg('서버 저장 완료!');
                resetBtn.disabled = false;
              } else {
                throw new Error();
              }
            } catch (err) {
              setCustomSample(item.id, 0, dataUrl);
              if (imgEl) imgEl.src = dataUrl;
              setMsg('로컬 저장 완료 (임시)');
              resetBtn.disabled = false;
            }
          };
          reader.readAsDataURL(file);
        });

        // 4) 저장
        saveBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!imgEl || !imgEl.src) return;
          const imageSource = getManagedMixerImageSource(imgEl);
          if (!imageSource) {
            setMsg('원격 이미지 주소는 저장할 수 없습니다.', true);
            return;
          }
          saveBtn.disabled = true;
          setMsg('서버 저장 중...');
          try {
            const res = await fetch('/api/save-mixer-sample', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ medId: item.id, idx: 0, image: imageSource })
            });
            const ret = await res.json();
            if (ret.ok && ret.url) {
              setCustomSample(item.id, 0, ret.url);
              setMsg('저장 성공!');
              resetBtn.disabled = false;
            } else {
              throw new Error();
            }
          } catch (err) {
            if (setCustomSample(item.id, 0, imageSource)) {
              setMsg('서버 저장 실패: 브라우저에 임시 저장했습니다.', true);
              resetBtn.disabled = false;
            } else {
              setMsg('저장하지 못했습니다.', true);
            }
          } finally {
            saveBtn.disabled = false;
          }
        });

        // 5) 복원
        resetBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          clearCustomSample(item.id, 0);
          clearCustomKeyword(item.id);
          delete UNSPLASH_CACHE[item.id];
          if (imgEl) imgEl.src = getMixerPresetSampleUrl(item.id);
          kwInput.value = item.prompt.split(',')[0].trim();
          setMsg('기본 사진으로 복원되었습니다.');
          resetBtn.disabled = true;
        });
      } else {
        card.addEventListener('click', () => {
          selectedTypographyId = 'none';
          container.querySelectorAll('#mixerTypographyGrid .mixer-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === 'none');
          });
          updateMixerSummaryBar();
          renderPreviewCard();
        });
      }

      card.setAttribute('data-id', item.id);
      targetGrid.appendChild(card);
    });
  }

  function renderPalettes() {
    const groupGrid = document.getElementById('mixerPalettesGroupGrid');
    if (!groupGrid) return;

    groupGrid.innerHTML = '';
    const q = palSearchQ.trim().toLowerCase();
    const effectivePaletteCategory = getEffectivePaletteCategoryFilter();
    const list = MIXER_PALETTES.filter(p => {
      if (p.id === 'none') return false;
      const baseFilter = (effectivePaletteCategory === 'all' || p.category === effectivePaletteCategory) &&
             (activePaletteFilter === 'all' || p.mode === activePaletteFilter) &&
             paletteMatchesColorFilter(p, activePaletteColorFilter) &&
             paletteMatchesTagFilter(p, activePaletteTagFilter);
      if (!baseFilter) return false;

      if (q) {
        return p.name.toLowerCase().includes(q) ||
               (p.colorMapping || '').toLowerCase().includes(q) ||
               (p.mood || '').toLowerCase().includes(q);
      }
      return true;
    });

    const selectedPalette = MIXER_PALETTES[selectedPaletteIdx];
    const nonePaletteIdx = MIXER_PALETTES.findIndex(p => p.id === 'none');
    if (list.length > 0 && (!selectedPalette || selectedPalette.id !== 'none' && !list.some(p => p === selectedPalette))) {
      selectedPaletteIdx = MIXER_PALETTES.indexOf(list[0]);
    } else if (list.length === 0 && nonePaletteIdx >= 0) {
      selectedPaletteIdx = nonePaletteIdx;
    }

    const displayList = [MIXER_PALETTES.find(p => p.id === 'none'), ...list].filter(Boolean);
    const empty = document.getElementById('mixerPaletteEmpty');
    if (empty) empty.style.display = list.length ? 'none' : 'block';

    displayList.forEach(pal => {
        const palIdx = MIXER_PALETTES.indexOf(pal);
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'mixer-item-card' + (selectedPaletteIdx === palIdx ? ' active' : '');
        item.setAttribute('aria-pressed', String(selectedPaletteIdx === palIdx));
        item.setAttribute('data-index', palIdx);

        const weights = pal.colors.length >= 3 ? [55, 30, 15] : (pal.colors.length === 2 ? [65, 35] : [100]);
        const weightBarStr = pal.id === 'none' ? `
          <div class="mixer-palette-weight-bar" style="background: linear-gradient(135deg, #e2e8f0 25%, #f1f5f9 25%, #f1f5f9 50%, #e2e8f0 50%, #e2e8f0 75%, #f1f5f9 75%, #f1f5f9 100%); background-size: 20px 20px;"></div>
          <div class="mixer-palette-weight-labels">
            <span>자연 색상</span>
          </div>
        ` : `
          <div class="mixer-palette-weight-bar">
            ${pal.colors.map((c, idx) => `
              <div class="mixer-palette-weight-segment" style="background:${c}; width:${weights[idx] || 10}%;"></div>
            `).join('')}
          </div>
          <div class="mixer-palette-weight-labels">
            <span>메인 (${weights[0]}%)</span>
            ${weights[1] ? `<span>보조 (${weights[1]}%)</span>` : ''}
            ${weights[2] ? `<span>강조 (${weights[2]}%)</span>` : ''}
          </div>
        `;
        const badgeText = pal.id === 'none' ? '🎨 자연' : (pal.mode === 'dark' ? '🌙 다크' : '☀️ 라이트');
        const badgeClass = pal.id === 'none' ? 'light' : pal.mode;

        item.innerHTML = `
          <div class="mixer-palette-badge ${badgeClass}">${badgeText}</div>
          <div class="mixer-item-head">🎨 ${pal.name}</div>
          ${weightBarStr}
          <div class="mixer-item-desc" style="margin-top: 4.5px;">${getSequentialColorPart(pal)}</div>
        `;

        item.addEventListener('click', () => {
          selectedPaletteIdx = palIdx;
          isPaletteOverriddenByUser = true;
          groupGrid.querySelectorAll('.mixer-item-card').forEach(p => {
            p.classList.remove('active');
            p.setAttribute('aria-pressed', 'false');
          });
          item.classList.add('active');
          item.setAttribute('aria-pressed', 'true');
          updateMixerSummaryBar();
          renderPreviewCard();
        });
      groupGrid.appendChild(item);
    });
  }

  function renderMixerUiIcon(name) {
    const paths = {
      settings: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55V20h-3v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7 14.7a1.7 1.7 0 0 0-1.55-1H5.3v-3h.09a1.7 1.7 0 0 0 1.55-1A1.7 1.7 0 0 0 6.6 7.8l-.06-.06 2.12-2.12.06.06A1.7 1.7 0 0 0 10.6 6a1.7 1.7 0 0 0 1-1.55V4.3h3v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.12 2.12-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.55 1h.09v3h-.09A1.7 1.7 0 0 0 19.4 15z"></path>',
      image: '<rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="8.5" cy="9" r="1.5"></circle><path d="m21 15-5-5L5 20"></path>',
      close: '<path d="m18 6-12 12M6 6l12 12"></path>',
      check: '<path d="m5 12 4 4L19 6"></path>',
      reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"></path><path d="M3 3v5h5"></path>',
      refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"></path><path d="M20 5v6h-6"></path>',
      upload: '<path d="M12 16V4m0 0L7 9m5-5 5 5"></path><path d="M5 20h14"></path>',
      save: '<path d="M5 4h12l2 2v14H5z"></path><path d="M8 4v6h8V4M8 20v-6h8v6"></path>',
      restore: '<path d="M9 7H4v-5"></path><path d="M4.5 7A9 9 0 1 1 3 15"></path>',
      sparkles: '<path d="m12 3 1.2 3.3L16.5 7.5l-3.3 1.2L12 12l-1.2-3.3-3.3-1.2 3.3-1.2L12 3zM18 13l.8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8L18 13zM6 14l.7 1.8 1.8.7-1.8.7L6 19l-.7-1.8-1.8-.7 1.8-.7L6 14z"></path>',
      clipboard: '<rect x="5" y="5" width="14" height="16" rx="2"></rect><path d="M9 5V3h6v2M9 11h6M9 15h6"></path>'
    };
    return `<svg class="mixer-ui-icon" viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ''}</svg>`;
  }

  // 우측 프리뷰 카드 렌더링 (동적 하이라이트 반영 및 실시간 이미지 생성 연동)
  function renderPreviewCard() {
    const cardWrap = document.getElementById('mixerPreviewCard');
    if (!cardWrap) return;

    const subject = resolveMixerSubject();
    const medium  = resolveMixerMedium();
    const palette = MIXER_PALETTES[selectedPaletteIdx];

    if (!subject || !medium || !palette) return;
    syncSelectedPresetsToCustom(subject, medium);

    const highlightHTML = buildMixedHighlightPromptHTML();
    const plainPrompt = buildMixedPrompt();

    // 1. 주제(Subject) 참고 이미지 관련 처리
    const customSubjectSamples = getCustomSamplesForMed(subject.id);
    const hasCustomSubjectSample = Boolean(customSubjectSamples[0]);
    let subjectImageUrl = customSubjectSamples[0] || UNSPLASH_CACHE[subject.id] || getRegisteredMixerSampleUrl(subject.id);
    if (customSubjectSamples[0]) {
      subjectImageUrl += `?t=${Date.now()}`;
    }

    // 2. 화풍(Medium) 참고 이미지 관련 처리
    const customMediumSamples = getCustomSamplesForMed(medium.id);
    const hasCustomMediumSample = Boolean(customMediumSamples[0]);
    let mediumImageUrl = customMediumSamples[0] || UNSPLASH_CACHE[medium.id] || getRegisteredMixerSampleUrl(medium.id);
    if (customMediumSamples[0]) {
      mediumImageUrl += `?t=${Date.now()}`;
    }

    // 3가지 이상의 풍성한 색상으로 쉬머 애니메이션용 그라데이션 선언
    const gradient = `linear-gradient(135deg, ${palette.colors[0]}, ${palette.colors[2] || palette.colors[1]}, ${palette.colors[palette.colors.length - 1]})`;

    cardWrap.innerHTML = `
      <div class="mixer-result-image">
        <!-- 좌측: 주제 참고 이미지 영역 -->
        <div class="mixer-result-image-half" id="subjectSampleHalf">
          <img src="${subjectImageUrl}" alt="${subject.nameKo} 주제 참고 이미지" />
          <div class="mixer-result-image-badge">주제 참고 이미지</div>
          <button type="button" class="mixer-half-settings-trigger" id="btnSubjectSampleSettings" title="주제 참고 이미지 설정" aria-label="주제 참고 이미지 설정" aria-controls="panelSubjectSettings" aria-expanded="${isSubjectOverlayOpen}">${renderMixerUiIcon('settings')}<span>설정</span></button>
          <input type="file" id="subjectFileInput" accept="image/*" hidden />
        </div>

        <!-- 우측: 화풍 참고 이미지 영역 -->
        <div class="mixer-result-image-half" id="mediumSampleHalf" style="border-left: 1px solid var(--line, #e2e8f0);">
          <img src="${mediumImageUrl}" alt="${medium.nameKo} 화풍 참고 이미지" />
          <div class="mixer-result-image-badge">화풍 참고 이미지</div>
          <button type="button" class="mixer-half-settings-trigger" id="btnMediumSampleSettings" title="화풍 참고 이미지 설정" aria-label="화풍 참고 이미지 설정" aria-controls="panelMediumSettings" aria-expanded="${isMediumOverlayOpen}">${renderMixerUiIcon('settings')}<span>설정</span></button>
          <input type="file" id="mediumFileInput" accept="image/*" hidden />
        </div>
      </div>
      <div class="mixer-image-overlay-panel ${isSubjectOverlayOpen ? 'active' : ''}" id="panelSubjectSettings" role="region" aria-labelledby="subjectSettingsTitle">
        <div class="panel-header">
          <div class="panel-header-main">
            <span class="panel-header-icon">${renderMixerUiIcon('image')}</span>
            <span class="panel-header-copy"><strong id="subjectSettingsTitle">주제 참고 이미지</strong><small>현재 믹스의 주제 이미지를 검색하거나 직접 교체합니다.</small></span>
          </div>
          <button type="button" class="panel-close-btn" id="btnSubjectSettingsClose" aria-label="주제 이미지 설정 닫기">${renderMixerUiIcon('close')}</button>
        </div>
        <div class="panel-body">
          <div class="panel-search-block">
            <label class="panel-field-label" for="subjectKeywordInput"><strong>이미지 검색어</strong><span>영문 키워드 · Enter로 적용</span></label>
            <div class="panel-keyword-row">
              <input type="text" id="subjectKeywordInput" value="${resolveSearchKeyword(subject.id, getSubjectDefaultKeyword(subject))}" aria-label="주제 이미지 검색어" placeholder="예: steel hot rolling" />
              <button type="button" class="panel-icon-btn" id="btnSubjectKeywordApply" title="검색어 적용" aria-label="검색어 적용">${renderMixerUiIcon('check')}</button>
              <button type="button" class="panel-icon-btn" id="btnSubjectKeywordReset" title="기본 검색어로 초기화" aria-label="기본 검색어로 초기화" ${getCustomKeyword(subject.id) ? '' : 'disabled'}>${renderMixerUiIcon('reset')}</button>
            </div>
          </div>
          <div class="panel-action-section">
            <div class="panel-group-head"><strong class="panel-group-label">빠른 교체</strong><span>현재 참고 이미지를 관리합니다.</span></div>
            <div class="panel-actions-grid">
              <button type="button" class="panel-action-btn" id="btnSubjectSampleRefresh" title="다른 사진으로 다시 불러오기">${renderMixerUiIcon('refresh')}<span>다른 사진</span></button>
              <button type="button" class="panel-action-btn" id="btnSubjectSampleReplace" title="내 컴퓨터에서 사진 업로드">${renderMixerUiIcon('upload')}<span>파일 선택</span></button>
              <button type="button" class="panel-action-btn" id="btnSubjectSampleSave" title="지금 사진을 기본값으로 저장">${renderMixerUiIcon('save')}<span>현재 사진 저장</span></button>
              <button type="button" class="panel-action-btn" id="btnSubjectSampleReset" ${hasCustomSubjectSample ? '' : 'disabled'} title="${hasCustomSubjectSample ? '저장해둔 기본 이미지로 되돌리기' : '저장된 기본 이미지가 없습니다'}">${renderMixerUiIcon('restore')}<span>기본값 복원</span></button>
            </div>
          </div>
          <div class="panel-action-section">
            <div class="panel-group-head"><strong class="panel-group-label">새 이미지 만들기</strong><span>Pollinations로 생성하거나 가져옵니다.</span></div>
            <div class="mixer-reference-tools-row">
              <button type="button" class="panel-action-btn" id="btnSubjectSampleGenerate" title="Pollinations로 새 이미지 생성 후 저장">${renderMixerUiIcon('sparkles')}<span>Pollinations 생성 · 저장</span></button>
              <button type="button" class="panel-action-btn" id="btnSubjectSamplePaste" title="클립보드의 이미지 붙여넣기">${renderMixerUiIcon('clipboard')}<span>클립보드에서 가져오기</span></button>
            </div>
          </div>
          <div class="panel-status-msg" id="subjectToolStatus" aria-live="polite"></div>
        </div>
      </div>
      <div class="mixer-image-overlay-panel ${isMediumOverlayOpen ? 'active' : ''}" id="panelMediumSettings" role="region" aria-labelledby="mediumSettingsTitle">
        <div class="panel-header">
          <div class="panel-header-main">
            <span class="panel-header-icon">${renderMixerUiIcon('image')}</span>
            <span class="panel-header-copy"><strong id="mediumSettingsTitle">화풍 참고 이미지</strong><small>현재 믹스의 스타일 이미지를 검색하거나 직접 교체합니다.</small></span>
          </div>
          <button type="button" class="panel-close-btn" id="btnMediumSettingsClose" aria-label="화풍 이미지 설정 닫기">${renderMixerUiIcon('close')}</button>
        </div>
        <div class="panel-body">
          <div class="panel-search-block">
            <label class="panel-field-label" for="mediumKeywordInput"><strong>이미지 검색어</strong><span>영문 키워드 · Enter로 적용</span></label>
            <div class="panel-keyword-row">
              <input type="text" id="mediumKeywordInput" value="${resolveSearchKeyword(medium.id, medium.suffix)}" aria-label="화풍 이미지 검색어" placeholder="예: editorial industrial photography" />
              <button type="button" class="panel-icon-btn" id="btnMediumKeywordApply" title="검색어 적용" aria-label="검색어 적용">${renderMixerUiIcon('check')}</button>
              <button type="button" class="panel-icon-btn" id="btnMediumKeywordReset" title="기본 검색어로 초기화" aria-label="기본 검색어로 초기화" ${getCustomKeyword(medium.id) ? '' : 'disabled'}>${renderMixerUiIcon('reset')}</button>
            </div>
          </div>
          <div class="panel-action-section">
            <div class="panel-group-head"><strong class="panel-group-label">빠른 교체</strong><span>현재 참고 이미지를 관리합니다.</span></div>
            <div class="panel-actions-grid">
              <button type="button" class="panel-action-btn" id="btnMediumSampleRefresh" title="다른 사진으로 다시 불러오기">${renderMixerUiIcon('refresh')}<span>다른 사진</span></button>
              <button type="button" class="panel-action-btn" id="btnMediumSampleReplace" title="내 컴퓨터에서 사진 업로드">${renderMixerUiIcon('upload')}<span>파일 선택</span></button>
              <button type="button" class="panel-action-btn" id="btnMediumSampleSave" title="지금 사진을 기본값으로 저장">${renderMixerUiIcon('save')}<span>현재 사진 저장</span></button>
              <button type="button" class="panel-action-btn" id="btnMediumSampleReset" ${hasCustomMediumSample ? '' : 'disabled'} title="${hasCustomMediumSample ? '저장해둔 기본 이미지로 되돌리기' : '저장된 기본 이미지가 없습니다'}">${renderMixerUiIcon('restore')}<span>기본값 복원</span></button>
            </div>
          </div>
          <div class="panel-action-section">
            <div class="panel-group-head"><strong class="panel-group-label">새 이미지 만들기</strong><span>Pollinations로 생성하거나 가져옵니다.</span></div>
            <div class="mixer-reference-tools-row">
              <button type="button" class="panel-action-btn" id="btnMediumSampleGenerate" title="Pollinations로 새 이미지 생성 후 저장">${renderMixerUiIcon('sparkles')}<span>Pollinations 생성 · 저장</span></button>
              <button type="button" class="panel-action-btn" id="btnMediumSamplePaste" title="클립보드의 이미지 붙여넣기">${renderMixerUiIcon('clipboard')}<span>클립보드에서 가져오기</span></button>
            </div>
          </div>
          <div class="panel-status-msg" id="mediumToolStatus" aria-live="polite"></div>
        </div>
      </div>
      <div class="mixer-preview-header" style="background:${gradient}">
        <div class="mixer-preview-meta">
          <div class="mixer-preview-meta-item">
            <span class="mixer-preview-meta-label">주제</span>
            <strong class="mixer-preview-meta-value">${subject.nameKo}</strong>
          </div>
          <div class="mixer-preview-meta-item">
            <span class="mixer-preview-meta-label">화풍</span>
            <strong class="mixer-preview-meta-value">${medium.nameKo}</strong>
          </div>
        </div>
        <div class="mixer-preview-footer">
          <span class="mixer-preview-code">#MIX-${subject.id.replace('mix-','').toUpperCase()}-${medium.id.replace('med-','').toUpperCase()}</span>
          <span class="mixer-preview-palette">${palette.name}</span>
        </div>
      </div>
      <div class="mixer-preview-body">
        <div class="mixer-custom-subject-row">
          <label class="mixer-custom-subject-label">주제 커스텀</label>
          <div class="mixer-custom-mode-toggle">
            <button type="button" class="mixer-custom-mode-btn${customSubjectMode === 'ko' ? ' active' : ''}" id="btnMixerModeKo">🇰🇷 한글번역</button>
            <button type="button" class="mixer-custom-mode-btn${customSubjectMode === 'en' ? ' active' : ''}" id="btnMixerModeEn">🔤 영어직접</button>
          </div>
          <input type="text" id="mixerCustomSubjectInput" class="mixer-custom-subject-input"
            placeholder="${customSubjectMode === 'ko' ? '한글 주제어 (예: 이차전지)' : 'English keyword (e.g. battery)'}"
            value="${escapeMixerHTML(customSubjectMode === 'ko' ? customSubjectKo : customSubjectEn)}" />
          <button type="button" class="mixer-custom-subject-apply" id="btnMixerCustomSubjectApply">적용</button>
          <button type="button" class="mixer-custom-subject-clear" id="btnMixerCustomSubjectClear" ${(customSubjectKo || customSubjectEn) ? '' : 'disabled'}>초기화</button>
        </div>
        ${customSubjectMode === 'ko' && customSubjectEn ? `<div class="mixer-custom-subject-preview">→ <em>${escapeMixerHTML(customSubjectEn)}</em></div>` : ''}
        <div class="mixer-custom-medium-row">
          <label class="mixer-custom-medium-label">화풍 커스텀</label>
          <div class="mixer-custom-mode-toggle">
            <button type="button" class="mixer-custom-mode-btn${customMediumMode === 'ko' ? ' active' : ''}" id="btnMixerMedModeKo">🇰🇷 한글번역</button>
            <button type="button" class="mixer-custom-mode-btn${customMediumMode === 'en' ? ' active' : ''}" id="btnMixerMedModeEn">🔤 영어직접</button>
          </div>
          <div class="mixer-custom-medium-actions">
            <button type="button" class="mixer-custom-subject-apply" id="btnMixerCustomMediumApply">적용</button>
            <button type="button" class="mixer-custom-subject-clear" id="btnMixerCustomMediumClear" ${(customMediumKo || customMediumEn || customMediumEnSuffix) ? '' : 'disabled'}>초기화</button>
          </div>
          <div class="mixer-custom-medium-fields">
            <div class="mixer-custom-medium-field-row">
              <span class="mixer-custom-medium-field-label">화풍명</span>
              <input type="text" id="mixerCustomMediumInput" class="mixer-custom-subject-input"
                placeholder="${customMediumMode === 'ko' ? '화풍명 (예: 수채화)' : 'prefix (e.g. watercolor illustration of)'}"
                value="${escapeMixerHTML(customMediumMode === 'ko' ? customMediumKo : customMediumEn)}" />
            </div>
            <div class="mixer-custom-medium-field-row">
              <span class="mixer-custom-medium-field-label">뒤 설명</span>
              <input type="text" id="mixerCustomMediumSuffixInput" class="mixer-custom-subject-input"
                placeholder="${customMediumMode === 'ko' ? '뒷 설명 (예: 부드러운 색감, 세밀한 묘사)' : 'suffix (e.g. soft colors, detailed brush texture)'}"
                value="${escapeMixerHTML(customMediumSuffixRaw)}" />
            </div>
          </div>
        </div>
        ${customMediumMode === 'ko' && customMediumEn ? `<div class="mixer-custom-medium-preview">→ <em>${escapeMixerHTML(customMediumEn)}</em>${customMediumEnSuffix ? ` … <em>${escapeMixerHTML(customMediumEnSuffix)}</em>` : ''}</div>` : ''}
        <details class="mixer-prompt-details" open>
          <summary>완성 프롬프트</summary>
          <pre class="mixer-preview-prompt-box" id="mixerCombinedPromptText">${highlightHTML}</pre>
        </details>
        <div class="mixer-feedback" id="mixerFeedback">✓ 클립보드 복사 완료!</div>
        <div class="mixer-preview-actions">
          <button type="button" class="mixer-action-btn copy" id="btnMixerCopy">프롬프트 복사</button>
          <button type="button" class="mixer-action-btn apply" id="btnMixerApply">홍보 이미지에 적용</button>
          <button type="button" class="mixer-action-btn slidedoc" id="btnMixerFormImage">양식 이미지에 적용</button>
        </div>
      </div>
    `;

    bindRegisteredMixerSampleFallback(cardWrap.querySelector('#subjectSampleHalf img'), subject.id);
    bindRegisteredMixerSampleFallback(cardWrap.querySelector('#mediumSampleHalf img'), medium.id);

    // -------------------------------------------------------------
    // 커스텀 주제어 이벤트 바인딩
    // -------------------------------------------------------------
    const customInput = cardWrap.querySelector('#mixerCustomSubjectInput');
    const customApplyBtn = cardWrap.querySelector('#btnMixerCustomSubjectApply');
    const customClearBtn = cardWrap.querySelector('#btnMixerCustomSubjectClear');
    const btnModeKo = cardWrap.querySelector('#btnMixerModeKo');
    const btnModeEn = cardWrap.querySelector('#btnMixerModeEn');

    async function applyCustomSubject() {
      const val = (customInput.value || '').trim();
      if (!val) {
        customSubjectKo = '';
        customSubjectEn = '';
        customSubjectPresetSourceId = selectedSubjId || '';
        renderPreviewCard();
        return;
      }

      if (customSubjectMode === 'en') {
        customSubjectKo = '';
        customSubjectEn = val;
        customSubjectPresetSourceId = selectedSubjId || '';
        renderPreviewCard();
        return;
      }

      // 한글번역 모드 — 사전 우선, 없으면 MyMemory API
      const exactMatch = KO_EN_SUBJECT_MAP[val];
      if (exactMatch) {
        customSubjectKo = val;
        customSubjectEn = exactMatch;
        customSubjectPresetSourceId = selectedSubjId || '';
        renderPreviewCard();
        return;
      }

      // 사전 미등록 → MyMemory 호출
      customApplyBtn.textContent = '번역 중...';
      customApplyBtn.disabled = true;
      try {
        const translated = await translateWithMyMemory(val);
        customSubjectKo = val;
        customSubjectEn = translated || resolveCustomSubjectEn(val);
      } catch (e) {
        customSubjectKo = val;
        customSubjectEn = resolveCustomSubjectEn(val);
      } finally {
        customSubjectPresetSourceId = selectedSubjId || '';
        renderPreviewCard();
      }
    }

    customApplyBtn.addEventListener('click', applyCustomSubject);
    customInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') applyCustomSubject();
    });
    customClearBtn.addEventListener('click', () => {
      customSubjectKo = '';
      customSubjectEn = '';
      customSubjectPresetSourceId = selectedSubjId || '';
      renderPreviewCard();
    });
    btnModeKo.addEventListener('click', () => {
      if (customSubjectMode === 'ko') return;
      const activeSubject = resolveMixerSubject();
      customSubjectMode = 'ko';
      customSubjectKo = activeSubject?.nameKo || '';
      customSubjectEn = activeSubject?.prompt || '';
      customSubjectPresetSourceId = selectedSubjId || '';
      renderPreviewCard();
    });
    btnModeEn.addEventListener('click', () => {
      if (customSubjectMode === 'en') return;
      customSubjectMode = 'en';
      customSubjectKo = '';
      customSubjectEn = resolveMixerSubject()?.prompt || '';
      customSubjectPresetSourceId = selectedSubjId || '';
      renderPreviewCard();
    });

    // -------------------------------------------------------------
    // 화풍 커스텀 이벤트 바인딩
    // -------------------------------------------------------------
    const medCustomInput        = cardWrap.querySelector('#mixerCustomMediumInput');
    const medCustomSuffixInput  = cardWrap.querySelector('#mixerCustomMediumSuffixInput');
    const medApplyBtn           = cardWrap.querySelector('#btnMixerCustomMediumApply');
    const medClearBtn           = cardWrap.querySelector('#btnMixerCustomMediumClear');
    const btnMedModeKo          = cardWrap.querySelector('#btnMixerMedModeKo');
    const btnMedModeEn          = cardWrap.querySelector('#btnMixerMedModeEn');

    async function applyCustomMedium() {
      const val    = (medCustomInput.value || '').trim();
      const sufVal = (medCustomSuffixInput.value || '').trim();
      customMediumSuffixRaw = sufVal;

      if (customMediumMode === 'en') {
        customMediumKo = '';
        customMediumEn = val;
        customMediumEnSuffix = sufVal;
        customMediumPresetSourceId = selectedMediumId || '';
        renderPreviewCard();
        return;
      }

      // 한글번역 모드 — prefix + suffix 번역
      if (!val && !sufVal) {
        customMediumKo = ''; customMediumEn = ''; customMediumEnSuffix = ''; customMediumSuffixRaw = '';
        customMediumPresetSourceId = selectedMediumId || '';
        renderPreviewCard();
        return;
      }

      medApplyBtn.textContent = '번역 중...';
      medApplyBtn.disabled = true;

      try {
        // prefix 번역
        let prefixEn = '';
        if (val) {
          const exact = KO_EN_SUBJECT_MAP[val];
          if (exact) {
            prefixEn = exact;
          } else {
            const t = await translateWithMyMemory(val);
            prefixEn = t ? `${t} style illustration of` : `${val} style illustration of`;
          }
        }

        // suffix 번역 (한글 포함 시 번역, 영문이면 그대로)
        let suffixEn = '';
        if (sufVal) {
          const hasKorean = /[가-힣]/.test(sufVal);
          if (hasKorean) {
            const t = await translateWithMyMemory(sufVal);
            suffixEn = t || sufVal;
          } else {
            suffixEn = sufVal;
          }
        }

        customMediumKo = val;
        customMediumEn = prefixEn;
        customMediumEnSuffix = suffixEn;
      } catch (e) {
        customMediumKo = val;
        customMediumEn = val ? `${val} style illustration of` : '';
        customMediumEnSuffix = sufVal;
      } finally {
        customMediumPresetSourceId = selectedMediumId || '';
        renderPreviewCard();
      }
    }

    medApplyBtn.addEventListener('click', applyCustomMedium);
    medCustomInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyCustomMedium(); });
    medCustomSuffixInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyCustomMedium(); });
    medClearBtn.addEventListener('click', () => {
      customMediumKo = ''; customMediumEn = ''; customMediumEnSuffix = ''; customMediumSuffixRaw = '';
      customMediumPresetSourceId = selectedMediumId || '';
      renderPreviewCard();
    });
    btnMedModeKo.addEventListener('click', () => {
      if (customMediumMode === 'ko') return;
      const activeMedium = resolveMixerMedium();
      customMediumMode = 'ko';
      customMediumKo = activeMedium?.nameKo || '';
      customMediumEn = activeMedium?.prefix || '';
      customMediumEnSuffix = activeMedium?.suffix || '';
      customMediumSuffixRaw = activeMedium?.desc || '';
      customMediumPresetSourceId = selectedMediumId || '';
      renderPreviewCard();
    });
    btnMedModeEn.addEventListener('click', () => {
      if (customMediumMode === 'en') return;
      const activeMedium = resolveMixerMedium();
      customMediumMode = 'en';
      customMediumKo = '';
      customMediumEn = activeMedium?.prefix || '';
      customMediumEnSuffix = activeMedium?.suffix || '';
      customMediumSuffixRaw = activeMedium?.suffix || '';
      customMediumPresetSourceId = selectedMediumId || '';
      renderPreviewCard();
    });

    // -------------------------------------------------------------
    // 패널 열기/닫기 이벤트 바인딩
    // -------------------------------------------------------------
    const subjectPanel = cardWrap.querySelector('#panelSubjectSettings');
    const subjectSettingsBtn = cardWrap.querySelector('#btnSubjectSampleSettings');
    const subjectCloseBtn = cardWrap.querySelector('#btnSubjectSettingsClose');

    subjectSettingsBtn.addEventListener('click', () => {
      const shouldOpen = !isSubjectOverlayOpen;
      isSubjectOverlayOpen = shouldOpen;
      isMediumOverlayOpen = false;
      subjectPanel.classList.toggle('active', shouldOpen);
      mediumPanel.classList.remove('active');
      subjectSettingsBtn.setAttribute('aria-expanded', String(shouldOpen));
      mediumSettingsBtn.setAttribute('aria-expanded', 'false');
      if (shouldOpen) requestAnimationFrame(() => cardWrap.querySelector('#subjectKeywordInput')?.focus());
      else subjectSettingsBtn.focus();
    });
    subjectCloseBtn.addEventListener('click', () => {
      isSubjectOverlayOpen = false;
      subjectPanel.classList.remove('active');
      subjectSettingsBtn.setAttribute('aria-expanded', 'false');
      subjectSettingsBtn.focus();
    });

    const mediumPanel = cardWrap.querySelector('#panelMediumSettings');
    const mediumSettingsBtn = cardWrap.querySelector('#btnMediumSampleSettings');
    const mediumCloseBtn = cardWrap.querySelector('#btnMediumSettingsClose');

    mediumSettingsBtn.addEventListener('click', () => {
      const shouldOpen = !isMediumOverlayOpen;
      isMediumOverlayOpen = shouldOpen;
      isSubjectOverlayOpen = false;
      mediumPanel.classList.toggle('active', shouldOpen);
      subjectPanel.classList.remove('active');
      mediumSettingsBtn.setAttribute('aria-expanded', String(shouldOpen));
      subjectSettingsBtn.setAttribute('aria-expanded', 'false');
      if (shouldOpen) requestAnimationFrame(() => cardWrap.querySelector('#mediumKeywordInput')?.focus());
      else mediumSettingsBtn.focus();
    });
    mediumCloseBtn.addEventListener('click', () => {
      isMediumOverlayOpen = false;
      mediumPanel.classList.remove('active');
      mediumSettingsBtn.setAttribute('aria-expanded', 'false');
      mediumSettingsBtn.focus();
    });
    [subjectPanel, mediumPanel].forEach(panel => {
      panel.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        if (panel === subjectPanel) subjectCloseBtn.click();
        else mediumCloseBtn.click();
      });
    });

    // -------------------------------------------------------------
    // 1. 주제(Subject) 설정 관련 이벤트 연동
    // -------------------------------------------------------------
    const subjectImg = cardWrap.querySelector('#subjectSampleHalf img');
    const subjectStatus = cardWrap.querySelector('#subjectToolStatus');
    const subjectFileInput = cardWrap.querySelector('#subjectFileInput');
    const setSubjectStatus = (message, isError = false) => {
      if (!subjectStatus) return;
      subjectStatus.textContent = message;
      subjectStatus.style.color = isError ? '#dc2626' : '';
    };

    cardWrap.querySelector('#btnSubjectSampleReplace').addEventListener('click', () => {
      subjectFileInput.click();
    });
    subjectFileInput.addEventListener('change', () => {
      const file = subjectFileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async event => {
        const dataUrl = event.target.result;
        setSubjectStatus('사진을 서버에 저장하는 중…');
        try {
          const response = await fetch('/api/save-mixer-sample', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              medId: subject.id,
              idx: 0,
              image: dataUrl
            })
          });
          const result = await response.json();
          if (result.ok && result.url) {
            setCustomSample(subject.id, 0, result.url);
            setSubjectStatus('사진을 이 주제의 대표 샘플로 서버에 저장했습니다.');
          } else {
            throw new Error(result.error || '업로드 실패');
          }
        } catch (err) {
          console.error(err);
          setCustomSample(subject.id, 0, dataUrl);
          setSubjectStatus('서버 저장 실패: 로컬 브라우저에 임시 저장했습니다.', true);
        }
        isSubjectOverlayOpen = false; // 완료 시 오버레이 닫기
        renderPreviewCard();
      };
      reader.readAsDataURL(file);
    });

    cardWrap.querySelector('#btnSubjectSampleRefresh').addEventListener('click', async event => {
      const button = event.currentTarget;
      const originalContent = button.innerHTML;
      if (!getUnsplashKey()) {
        setSubjectStatus('unsplash API 설정에서 Access Key를 먼저 저장해 주세요.', true);
        return;
      }
      button.disabled = true;
      button.textContent = '불러오는 중…';
      setSubjectStatus('새 주제 샘플을 검색하고 있습니다.');
      delete UNSPLASH_CACHE[subject.id];
      try {
        const url = await fetchUnsplashImage(subject.id, getSubjectDefaultKeyword(subject), true);
        if (!url) throw new Error('검색 결과 없음');
        if (subjectImg) subjectImg.src = url;
        setSubjectStatus('새 사진을 로컬 파일로 저장했습니다.');
        renderPreviewCard(); // 즉시 미리보기 갱신 (오버레이는 열려있음)
      } catch (error) {
        setSubjectStatus(error.message.includes('403') ? 'Unsplash 요청 한도를 확인해 주세요.' : '사진을 불러오지 못했습니다.', true);
      } finally {
        button.disabled = false;
        button.innerHTML = originalContent;
      }
    });

    cardWrap.querySelector('#btnSubjectSampleSave').addEventListener('click', async event => {
      if (!subjectImg?.src) return;
      const imageSource = getManagedMixerImageSource(subjectImg);
      if (!imageSource) {
        setSubjectStatus('원격 이미지 주소는 저장할 수 없습니다.', true);
        return;
      }
      const button = event.currentTarget;
      button.disabled = true;
      setSubjectStatus('현재 사진을 서버에 저장하는 중…');
      try {
        const response = await fetch('/api/save-mixer-sample', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            medId: subject.id,
            idx: 0,
            image: imageSource
          })
        });
        const result = await response.json();
        if (result.ok && result.url) {
          setCustomSample(subject.id, 0, result.url);
          setSubjectStatus('현재 사진을 이 주제의 대표 샘플로 서버에 저장했습니다.');
          button.textContent = '저장됨';
          isSubjectOverlayOpen = false; // 완료 시 오버레이 닫기
        } else {
          throw new Error(result.error || '업로드 실패');
        }
      } catch (err) {
        console.error(err);
        if (setCustomSample(subject.id, 0, imageSource)) {
          setSubjectStatus('서버 저장 실패: 브라우저에 임시 저장했습니다.', true);
        } else {
          setSubjectStatus('현재 사진을 저장하지 못했습니다.', true);
        }
      } finally {
        button.disabled = false;
        setTimeout(() => renderPreviewCard(), 700);
      }
    });

    cardWrap.querySelector('#btnSubjectSampleGenerate')?.addEventListener('click', async event => {
      const keywordInput = cardWrap.querySelector('#subjectKeywordInput');
      const prompt = keywordInput ? keywordInput.value.trim() : '';
      if (!prompt) {
        showMixerResultOverlay('생성 실패', null, '생성할 영어 키워드/프롬프트를 입력해주세요.', true);
        return;
      }

      const button = event.currentTarget;
      button.disabled = true;
      const originalContent = button.innerHTML;
      button.textContent = 'Pollinations 생성 중…';
      setSubjectStatus('Pollinations가 이미지를 생성하여 서버에 저장하고 있습니다…');

      try {
        if (!window.confirm('입력한 프롬프트가 이미지 생성을 위해 Pollinations에 전송됩니다. 개인정보·기밀정보가 없음을 확인하고 계속할까요?')) throw new Error('사용자가 Pollinations 전송을 취소했습니다.');
        const response = await fetch('/api/generate-photo-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            medId: subject.id,
            prompt,
            privacyConfirmed: true,
            provider: 'pollinations'
          })
        });
        const result = await response.json();
        
        if (result.ok && result.url) {
          const cacheBusterUrl = `${result.url}?t=${Date.now()}`;
          setCustomSample(subject.id, 0, result.url);
          if (subjectImg) subjectImg.src = cacheBusterUrl;
          isSubjectOverlayOpen = false;
          
          showMixerResultOverlay(
            '참조 이미지 생성 성공', 
            cacheBusterUrl, 
            `주제 <strong>"${subject.nameKo}"</strong>의 Pollinations 참조 이미지가 생성되어 서버에 저장되었습니다.`
          );
        } else {
          throw new Error(result.error || '서버 측 생성/업로드 실패');
        }
      } catch (err) {
        console.error(err);
        showMixerResultOverlay('Pollinations 생성 실패', null, `이미지 생성 또는 저장 중 오류가 발생했습니다.<br><small style="color:#e74c3c;">(${err.message})</small>`, true);
        setSubjectStatus(`Pollinations 생성 실패: ${err.message}`, true);
      } finally {
        button.disabled = false;
        button.innerHTML = originalContent;
        setTimeout(() => renderPreviewCard(), 700);
      }
    });

    cardWrap.querySelector('#btnSubjectSamplePaste').addEventListener('click', async event => {
      const button = event.currentTarget;
      button.disabled = true;
      setSubjectStatus('클립보드 이미지를 읽는 중…');
      try {
        const dataUrl = await readClipboardImageDataUrl();
        if (subjectImg) subjectImg.src = dataUrl;
        setSubjectStatus('클립보드 이미지를 저장하는 중…');
        const where = await uploadMixerSample(subject.id, dataUrl);
        setSubjectStatus(where === 'server'
          ? '클립보드 이미지를 이 주제의 대표 샘플로 서버에 저장했습니다.'
          : '서버 저장 실패: 로컬 브라우저에 임시 저장했습니다.', where !== 'server');
        isSubjectOverlayOpen = false; // 완료 시 오버레이 닫기
        renderPreviewCard();

        showMixerResultOverlay(
          where === 'server' ? '클립보드 이미지 저장 성공' : '로컬 임시 저장 완료', 
          dataUrl, 
          where === 'server' 
            ? '클립보드 참조 이미지를 서버에 안전하게 업로드 및 등록했습니다.' 
            : '서버 저장에는 실패하였으나 브라우저 세션에 임시로 이미지를 적용했습니다.',
          where !== 'server'
        );
      } catch (err) {
        setSubjectStatus(err.message, true);
        showMixerResultOverlay('클립보드 읽기 실패', null, err.message, true);
        button.disabled = false;
      }
    });

    cardWrap.querySelector('#btnSubjectSampleReset').addEventListener('click', () => {
      clearCustomSample(subject.id, 0);
      delete UNSPLASH_CACHE[subject.id];
      renderPreviewCard();
    });

    const subjectKeywordInput = cardWrap.querySelector('#subjectKeywordInput');
    const subjectKeywordApplyBtn = cardWrap.querySelector('#btnSubjectKeywordApply');
    subjectKeywordApplyBtn.addEventListener('click', () => {
      const keyword = subjectKeywordInput.value.trim();
      if (!keyword) {
        setSubjectStatus('검색 키워드를 입력해 주세요.', true);
        return;
      }
      setCustomKeyword(subject.id, keyword);
      delete UNSPLASH_CACHE[subject.id];
      setSubjectStatus('키워드를 저장했습니다.');
      renderPreviewCard();
    });
    subjectKeywordInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') subjectKeywordApplyBtn.click();
    });

    cardWrap.querySelector('#btnSubjectKeywordReset').addEventListener('click', () => {
      clearCustomKeyword(subject.id);
      delete UNSPLASH_CACHE[subject.id];
      renderPreviewCard();
    });

    // -------------------------------------------------------------
    // 2. 화풍(Medium) 설정 관련 이벤트 연동
    // -------------------------------------------------------------
    const mediumImg = cardWrap.querySelector('#mediumSampleHalf img');
    const mediumStatus = cardWrap.querySelector('#mediumToolStatus');
    const mediumFileInput = cardWrap.querySelector('#mediumFileInput');
    const setMediumStatus = (message, isError = false) => {
      if (!mediumStatus) return;
      mediumStatus.textContent = message;
      mediumStatus.style.color = isError ? '#dc2626' : '';
    };

    cardWrap.querySelector('#btnMediumSampleReplace').addEventListener('click', () => {
      mediumFileInput.click();
    });
    mediumFileInput.addEventListener('change', () => {
      const file = mediumFileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async event => {
        const dataUrl = event.target.result;
        setMediumStatus('사진을 서버에 저장하는 중…');
        try {
          const response = await fetch('/api/save-mixer-sample', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              medId: medium.id,
              idx: 0,
              image: dataUrl
            })
          });
          const result = await response.json();
          if (result.ok && result.url) {
            setCustomSample(medium.id, 0, result.url);
            setMediumStatus('사진을 이 화풍의 대표 샘플로 서버에 저장했습니다.');
          } else {
            throw new Error(result.error || '업로드 실패');
          }
        } catch (err) {
          console.error(err);
          setCustomSample(medium.id, 0, dataUrl);
          setMediumStatus('서버 저장 실패: 로컬 브라우저에 임시 저장했습니다.', true);
        }
        isMediumOverlayOpen = false; // 완료 시 오버레이 닫기
        renderPreviewCard();
      };
      reader.readAsDataURL(file);
    });

    cardWrap.querySelector('#btnMediumSampleRefresh').addEventListener('click', async event => {
      const button = event.currentTarget;
      const originalContent = button.innerHTML;
      if (!getUnsplashKey()) {
        setMediumStatus('unsplash API 설정에서 Access Key를 먼저 저장해 주세요.', true);
        return;
      }
      button.disabled = true;
      button.textContent = '불러오는 중…';
      setMediumStatus('새 화풍 샘플을 검색하고 있습니다.');
      delete UNSPLASH_CACHE[medium.id];
      try {
        const url = await fetchUnsplashImage(medium.id, medium.suffix, true);
        if (!url) throw new Error('검색 결과 없음');
        if (mediumImg) mediumImg.src = url;
        setMediumStatus('새 사진을 로컬 파일로 저장했습니다.');
        renderPreviewCard(); // 즉시 미리보기 갱신 (오버레이는 열려있음)
      } catch (error) {
        setMediumStatus(error.message.includes('403') ? 'Unsplash 요청 한도를 확인해 주세요.' : '사진을 불러오지 못했습니다.', true);
      } finally {
        button.disabled = false;
        button.innerHTML = originalContent;
      }
    });

    cardWrap.querySelector('#btnMediumSampleSave').addEventListener('click', async event => {
      if (!mediumImg?.src) return;
      const imageSource = getManagedMixerImageSource(mediumImg);
      if (!imageSource) {
        setMediumStatus('원격 이미지 주소는 저장할 수 없습니다.', true);
        return;
      }
      const button = event.currentTarget;
      button.disabled = true;
      setMediumStatus('현재 사진을 서버에 저장하는 중…');
      try {
        const response = await fetch('/api/save-mixer-sample', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            medId: medium.id,
            idx: 0,
            image: imageSource
          })
        });
        const result = await response.json();
        if (result.ok && result.url) {
          setCustomSample(medium.id, 0, result.url);
          setMediumStatus('현재 사진을 이 화풍의 대표 샘플로 서버에 저장했습니다.');
          button.textContent = '저장됨';
          isMediumOverlayOpen = false; // 완료 시 오버레이 닫기
        } else {
          throw new Error(result.error || '업로드 실패');
        }
      } catch (err) {
        console.error(err);
        if (setCustomSample(medium.id, 0, imageSource)) {
          setMediumStatus('서버 저장 실패: 브라우저에 임시 저장했습니다.', true);
        } else {
          setMediumStatus('현재 사진을 저장하지 못했습니다.', true);
        }
      } finally {
        button.disabled = false;
        setTimeout(() => renderPreviewCard(), 700);
      }
    });

    cardWrap.querySelector('#btnMediumSampleGenerate')?.addEventListener('click', async event => {
      const keywordInput = cardWrap.querySelector('#mediumKeywordInput');
      const prompt = keywordInput ? keywordInput.value.trim() : '';
      if (!prompt) {
        showMixerResultOverlay('생성 실패', null, '생성할 영어 키워드/프롬프트를 입력해주세요.', true);
        return;
      }

      const button = event.currentTarget;
      button.disabled = true;
      const originalContent = button.innerHTML;
      button.textContent = 'Pollinations 생성 중…';
      setMediumStatus('Pollinations가 이미지를 생성하여 서버에 저장하고 있습니다…');

      try {
        if (!window.confirm('입력한 프롬프트가 이미지 생성을 위해 Pollinations에 전송됩니다. 개인정보·기밀정보가 없음을 확인하고 계속할까요?')) throw new Error('사용자가 Pollinations 전송을 취소했습니다.');
        const response = await fetch('/api/generate-photo-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            medId: medium.id,
            prompt,
            privacyConfirmed: true,
            provider: 'pollinations'
          })
        });
        const result = await response.json();
        
        if (result.ok && result.url) {
          const cacheBusterUrl = `${result.url}?t=${Date.now()}`;
          setCustomSample(medium.id, 0, result.url);
          if (mediumImg) mediumImg.src = cacheBusterUrl;
          isMediumOverlayOpen = false;
          
          showMixerResultOverlay(
            '참조 이미지 생성 성공', 
            cacheBusterUrl, 
            `화풍 <strong>"${medium.nameKo}"</strong>의 Pollinations 참조 이미지가 생성되어 서버에 저장되었습니다.`
          );
        } else {
          throw new Error(result.error || '서버 측 생성/업로드 실패');
        }
      } catch (err) {
        console.error(err);
        showMixerResultOverlay('Pollinations 생성 실패', null, `이미지 생성 또는 저장 중 오류가 발생했습니다.<br><small style="color:#e74c3c;">(${err.message})</small>`, true);
        setMediumStatus(`Pollinations 생성 실패: ${err.message}`, true);
      } finally {
        button.disabled = false;
        button.innerHTML = originalContent;
        setTimeout(() => renderPreviewCard(), 700);
      }
    });

    cardWrap.querySelector('#btnMediumSamplePaste').addEventListener('click', async event => {
      const button = event.currentTarget;
      button.disabled = true;
      setMediumStatus('클립보드 이미지를 읽는 중…');
      try {
        const dataUrl = await readClipboardImageDataUrl();
        if (mediumImg) mediumImg.src = dataUrl;
        setMediumStatus('클립보드 이미지를 저장하는 중…');
        const where = await uploadMixerSample(medium.id, dataUrl);
        setMediumStatus(where === 'server'
          ? '클립보드 이미지를 이 화풍의 대표 샘플로 서버에 저장했습니다.'
          : '서버 저장 실패: 로컬 브라우저에 임시 저장했습니다.', where !== 'server');
        isMediumOverlayOpen = false; // 완료 시 오버레이 닫기
        renderPreviewCard();

        showMixerResultOverlay(
          where === 'server' ? '클립보드 이미지 저장 성공' : '로컬 임시 저장 완료', 
          dataUrl, 
          where === 'server' 
            ? '클립보드 참조 이미지를 서버에 안전하게 업로드 및 등록했습니다.' 
            : '서버 저장에는 실패하였으나 브라우저 세션에 임시로 이미지를 적용했습니다.',
          where !== 'server'
        );
      } catch (err) {
        setMediumStatus(err.message, true);
        showMixerResultOverlay('클립보드 읽기 실패', null, err.message, true);
        button.disabled = false;
      }
    });

    cardWrap.querySelector('#btnMediumSampleReset').addEventListener('click', () => {
      clearCustomSample(medium.id, 0);
      delete UNSPLASH_CACHE[medium.id];
      renderPreviewCard();
    });

    const mediumKeywordInput = cardWrap.querySelector('#mediumKeywordInput');
    const mediumKeywordApplyBtn = cardWrap.querySelector('#btnMediumKeywordApply');
    mediumKeywordApplyBtn.addEventListener('click', () => {
      const keyword = mediumKeywordInput.value.trim();
      if (!keyword) {
        setMediumStatus('검색 키워드를 입력해 주세요.', true);
        return;
      }
      setCustomKeyword(medium.id, keyword);
      delete UNSPLASH_CACHE[medium.id];
      setMediumStatus('키워드를 저장했습니다.');
      renderPreviewCard();
    });
    mediumKeywordInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') mediumKeywordApplyBtn.click();
    });

    cardWrap.querySelector('#btnMediumKeywordReset').addEventListener('click', () => {
      clearCustomKeyword(medium.id);
      delete UNSPLASH_CACHE[medium.id];
      renderPreviewCard();
    });

    // 복사 이벤트
    cardWrap.querySelector('#btnMixerCopy').addEventListener('click', () => {
      const text = plainPrompt;
      const feedback = cardWrap.querySelector('#mixerFeedback');
      navigator.clipboard.writeText(text).then(() => {
        feedback.classList.add('visible');
        setTimeout(() => feedback.classList.remove('visible'), 2000);
      }).catch(() => {
        const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        feedback.classList.add('visible');
        setTimeout(() => feedback.classList.remove('visible'), 2000);
      });
    });

    // ID 기반 영문 이름 생성 헬퍼
    function capitalizeId(id, prefixToRemove) {
      if (!id) return '';
      let clean = id;
      if (prefixToRemove && id.startsWith(prefixToRemove)) {
        clean = id.slice(prefixToRemove.length);
      }
      return clean.split('-')
        .map(word => {
          if (word.toLowerCase() === '3d') return '3D';
          if (word.toLowerCase() === 'ui') return 'UI';
          if (word.toLowerCase() === 'ai') return 'AI';
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
    }

    // mixer medium.category → PROMOTION_PROMPT_DEFAULTS 키 매핑
    const MIXER_TO_PROMO_CATEGORY = {
      tech3d: '3d', analog: 'illustration', graphic: 'modern',
      anime: 'anime', photo: 'photo', craft: 'craft',
      game: 'game', nature_photo: 'nature', editorial: 'photo',
      abstract: 'modern', arch: 'arch', trad: 'culture',
      digital_paint: 'illustration', ui_ux: 'software',
      pixel_adv: 'game', official: 'modern', youtube_anim: 'illustration',
    };

    // mixer 선택 데이터 → 11개 구조화 promptParts 생성
    function buildMixerPromptParts(subj, med, pal, comp, typo) {
      const seqStr = pal ? getSequentialColorPart(pal) : '';
      const paletteStr = seqStr
        ? `Use the campaign color palette: ${seqStr}`
        : 'Derive palette from the selected visual style';

      const medName = capitalizeId(med.id, 'med-');
      const subjName = capitalizeId(subj.id, 'mix-');
      const visualDNA = [medName, subjName].filter(Boolean).join(' — ');
      const shapeLanguage = subj.prompt
        ? subj.prompt.split('.')[0].trim()
        : `${subjName} subject in ${medName} style`;
      const textureRendering = med.suffix
        ? med.suffix.split(',').slice(0, 3).join(',').trim()
        : `${med.prefix} style rendering`;
      const lightingMood = typo && typo.prompt
        ? typo.prompt
        : `Typography style matched to the ${medName} visual language`;
      const layoutBehavior = comp
        ? `${comp.prefix}${comp.suffix ? ', ' + comp.suffix : ''}`
        : 'Hero subject centered with clear zones for headline, subtext, and CTA';

      const typoMap = {
        tech3d: 'Clean modern sans-serif placed on minimal planes; do not let typography compete with 3D depth',
        analog: 'Warm readable typography; handmade feel belongs in decoration, not legibility-critical copy',
        graphic: 'Confident graphic typography integrated into the design system',
        anime: 'Dynamic graphic lettering or clean placement complementing the illustration style',
        photo: 'Restrained editorial typography placed on flat or blurred zones away from subject detail',
        craft: 'Warm readable sans-serif; handcrafted feel in decoration only, not headline text',
        game: 'Bold display type or game UI label treatment; keep copy short and legible',
        nature_photo: 'Clean nature-complementary typography with strong legibility over organic backgrounds',
        editorial: 'Restrained editorial typography on uncluttered background zones',
        abstract: 'Bold geometric typography that complements abstract forms without visual competition',
        arch: 'Restrained modern sans-serif with strong alignment and generous white space',
        trad: 'Traditional or cultural typography matched to the aesthetic; maintain legibility',
        digital_paint: 'Match type mood to the painting style; headline stays sharp and legible',
        ui_ux: 'System UI or modern screen typography with strong readability hierarchy',
        pixel_adv: 'Bold pixel-friendly or chunky sans-serif matching the pixel art energy',
        official: 'Professional sans-serif with clear hierarchy for institutional communication',
        youtube_anim: 'Energetic animation-friendly typography with bold scale contrast',
      };
      const typographyGuidance = typoMap[med.category] ||
        'Bold, clean sans-serif typography with strong contrast against the background';

      return {
        visualDNA,
        paletteStrategy: paletteStr,
        textureRendering,
        lightingMood,
        shapeLanguage,
        layoutBehavior,
        typographyGuidance,
        campaignAdaptation: `Present the promotional message through the ${medName} visual language — keep the style recognizable while centering the campaign goal`,
        objectAdaptation: `Render the promoted item or service as the primary subject within a ${medName} composition featuring ${subjName}`,
        avoid: `avoid style inconsistency, unrelated decorative elements outside the ${medName} aesthetic, and mismatched rendering qualities`,
        qualityRules: `maintain ${medName} fidelity, clear subject readability, and campaign message legibility at all text overlay zones`,
      };
    }

    // 적용 이벤트
    cardWrap.querySelector('#btnMixerApply').addEventListener('click', () => {
      if (typeof window.applyPromotionConceptStyle === 'function') {
        const composition = resolveMixerComposition();
        const typography = resolveMixerTypography();

        let styleId = `mix-${subject.id}-${medium.id}`;
        let styleNameKo = `${subject.nameKo} (${medium.nameKo})`;
        let styleNameEn = `${capitalizeId(subject.id, 'mix-')} (${capitalizeId(medium.id, 'med-')})`;
        let styleDesc = `${subject.nameKo}에 ${medium.nameKo} 기법을 다차원으로 믹싱한 스타일입니다.`;
        let styleDescEn = `A style that multi-dimensionally mixes ${capitalizeId(subject.id, 'mix-')} with ${capitalizeId(medium.id, 'med-')} technique.`;
        const styleTags = [activeCategory, 'mixer', subject.nameKo, medium.nameKo];

        if (composition) {
          styleId += `-${composition.id}`;
          styleNameKo += ` [${composition.nameKo}]`;
          styleNameEn += ` [${capitalizeId(composition.id, 'comp-')}]`;
          styleDesc += ` 구도는 ${composition.nameKo}을(를) 취합니다.`;
          styleDescEn += ` The composition takes ${capitalizeId(composition.id, 'comp-')}.`;
          styleTags.push(composition.nameKo);
        }
        if (typography) {
          styleId += `-${typography.id}`;
          styleNameKo += ` + ${typography.nameKo}`;
          styleNameEn += ` + ${capitalizeId(typography.id, 'typo-')}`;
          styleDesc += ` 타이포그래피 스타일로 ${typography.nameKo}을(를) 적용합니다.`;
          styleDescEn += ` The typography style applies ${capitalizeId(typography.id, 'typo-')}.`;
          styleTags.push(typography.nameKo);
        }

        const mixerPromptParts = buildMixerPromptParts(subject, medium, palette, composition, typography);
        const mappedCategory = MIXER_TO_PROMO_CATEGORY[medium.category] || 'modern';

        let dummyStyle = {
          id: styleId,
          category: mappedCategory,
          mixerCategory: activeCategory,
          nameKo: styleNameKo,
          nameEn: styleNameEn,
          emoji: subject.emoji,
          desc: styleDesc,
          descEn: styleDescEn,
          palette: palette.colors,
          prompt: plainPrompt,
          promotionPrompt: plainPrompt,
          promptParts: mixerPromptParts,
          tags: styleTags,
          // 동기화용 ID 정보 추가
          subjectId: subject.id,
          mediumId: medium.id,
          paletteIdx: selectedPaletteIdx,
          compositionId: composition ? composition.id : 'none',
          typographyId: typography ? typography.id : 'none'
        };

        // 홍보 탭의 고도화된 프롬프트 파서가 로드되어 있으면 연동 (기존 promptParts 유지)
        if (typeof window.buildPromotionConceptStyle === 'function') {
          dummyStyle = window.buildPromotionConceptStyle(dummyStyle);
        }

        window.applyPromotionConceptStyle(dummyStyle);
        const tabBtn = document.getElementById('tabBtnPromotion');
        if (tabBtn) tabBtn.click();
      } else {
        alert('홍보용 이미지 탭을 찾을 수 없습니다.');
      }
    });

    cardWrap.querySelector('#btnMixerFormImage').addEventListener('click', () => {
      if (typeof window.applyMixerToFormImage === 'function') {
        const composition = resolveMixerComposition();
        const typography = resolveMixerTypography();
        const plainPrompt = buildMixedPrompt();
        const promptParts = buildMixerPromptParts(subject, medium, palette, composition, typography);
        let nameKo = `${subject.nameKo} (${medium.nameKo})`;
        let nameEn = `${capitalizeId(subject.id, 'mix-')} (${capitalizeId(medium.id, 'med-')})`;
        if (composition) { nameKo += ` [${composition.nameKo}]`; nameEn += ` [${capitalizeId(composition.id, 'comp-')}]`; }
        if (typography) { nameKo += ` + ${typography.nameKo}`; nameEn += ` + ${capitalizeId(typography.id, 'typo-')}`; }
        window.applyMixerToFormImage({
          nameKo, nameEn,
          prompt: plainPrompt,
          promptParts,
          palette,
          subjectKo: subject.nameKo,
          subjectEn: capitalizeId(subject.id, 'mix-'),
          mediumKo: medium.nameKo,
          mediumEn: capitalizeId(medium.id, 'med-'),
          mediumRendering: medium.suffix || '',
          colorRoles: promptParts.paletteStrategy || '',
          textureInfo: promptParts.textureRendering || '',
          layoutFeel: promptParts.layoutBehavior || '',
          typographyGuidance: promptParts.typographyGuidance || '',
          // 동기화용 ID 정보 추가
          subjectId: subject.id,
          mediumId: medium.id,
          paletteIdx: selectedPaletteIdx,
          compositionId: composition ? composition.id : 'none',
          typographyId: typography ? typography.id : 'none'
        });
      } else {
        alert('양식 이미지 탭을 찾을 수 없습니다.');
      }
    });

    // 외부 탭(양식, 홍보)에서 이전 선택된 스타일 복원하는 함수
    window.restoreMixerSelection = function (selectionState) {
      if (!selectionState) return;

      if (selectionState.subjectId) {
        selectedSubjId = selectionState.subjectId;
        for (const cat in MIXER_SUBJECTS) {
          if (MIXER_SUBJECTS[cat].some(s => s.id === selectedSubjId)) {
            activeCategory = cat;
            break;
          }
        }
      }

      if (selectionState.mediumId) {
        selectedMediumId = selectionState.mediumId;
        const med = MIXER_MEDIUMS.find(m => m.id === selectedMediumId);
        if (med) {
          activeMediumCategory = med.category || 'all';
        }
      }

      if (selectionState.paletteIdx !== undefined) {
        selectedPaletteIdx = parseInt(selectionState.paletteIdx, 10);
        const pal = MIXER_PALETTES[selectedPaletteIdx];
        if (pal) {
          activePaletteCategory = pal.category || 'all';
        }
      }

      if (selectionState.compositionId) {
        selectedCompositionId = selectionState.compositionId;
        const comp = MIXER_COMPOSITIONS.find(c => c.id === selectedCompositionId);
        if (comp) {
          activeCompositionCategory = comp.category || 'all';
        }
      }

      if (selectionState.typographyId) {
        selectedTypographyId = selectionState.typographyId;
        const typo = MIXER_TYPOGRAPHIES.find(t => t.id === selectedTypographyId);
        if (typo) {
          activeTypographyCategory = typo.category || 'all';
        }
      }

      // UI 강제 리렌더링
      updateCategoryTabs();
      renderSubjects();
      renderMediums();
      renderPalettes();
      renderCompositions();
      renderTypographies();
      renderPreviewCard();
      updateMixerSummaryBar();
    };

    // 공통 프롬프트 등 다른 탭이 현재 선택 색상을 안전하게 읽기 위한 공개 API
    window.PromptDeckConceptMixer = Object.assign(window.PromptDeckConceptMixer || {}, {
      getSelectedMedium: function () {
        const medium = resolveMixerMedium();
        if (!medium) return null;
        return JSON.parse(JSON.stringify(Object.assign({}, medium, {
          source: userMediums.some(item => item.id === medium.id) ? 'visual-mixer-custom' : 'visual-mixer',
        })));
      },
      selectMedium: function (mediumId) {
        const medium = userMediums.find(item => item.id === mediumId) || MIXER_MEDIUMS.find(item => item.id === mediumId);
        if (!medium) return false;
        selectedMediumId = medium.id;
        activeMediumCategory = userMediums.some(item => item.id === medium.id) ? 'user' : (medium.category || 'all');
        renderMediums();
        renderPreviewCard();
        updateMixerSummaryBar();
        return true;
      },
      getSelectedPalette: function () {
        const palette = MIXER_PALETTES[selectedPaletteIdx];
        if (!palette || palette.id === 'none') return null;
        return JSON.parse(JSON.stringify(palette));
      },
      selectPalette: function (paletteId) {
        const index = MIXER_PALETTES.findIndex(palette => palette.id === paletteId);
        if (index < 0) return false;
        selectedPaletteIdx = index;
        activePaletteCategory = MIXER_PALETTES[index].category || 'all';
        renderPalettes();
        renderPreviewCard();
        updateMixerSummaryBar();
        return true;
      },
      getSelectedTypography: function () {
        const typography = MIXER_TYPOGRAPHIES.find(item => item.id === selectedTypographyId);
        if (!typography || typography.id === 'none') return null;
        return JSON.parse(JSON.stringify(typography));
      },
      selectTypography: function (typographyId) {
        const typography = MIXER_TYPOGRAPHIES.find(item => item.id === typographyId);
        if (!typography) return false;
        selectedTypographyId = typography.id;
        activeTypographyCategory = typography.category || 'all';
        renderTypographies();
        renderPreviewCard();
        updateMixerSummaryBar();
        return true;
      },
    });

    // 생성 및 붙여넣기 실행 결과를 레이어 형태로 띄워주는 헬퍼
    function showMixerResultOverlay(title, imageUrl, message, isError = false) {
      const existing = document.getElementById('mixerResultOverlay');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'mixerResultOverlay';
      overlay.className = 'mixer-custom-modal-overlay';
      overlay.style.zIndex = '10000'; // 팝업창 위에 뜸을 보장

      overlay.innerHTML = `
        <div class="mixer-custom-modal" style="max-width:400px; text-align:center; padding: 24px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.15);">
          <div style="font-size: 48px; margin-bottom: 12px;">${isError ? '❌' : '🎉'}</div>
          <h3 style="margin: 0 0 12px 0; font-size: 18px; color: ${isError ? '#e74c3c' : '#2ecc71'}; font-weight:700;">${title}</h3>
          
          ${(!isError && imageUrl) ? `
            <div style="width: 100%; max-height: 200px; overflow: hidden; border-radius: 8px; margin-bottom: 16px; border: 1.5px solid var(--line, #e2e8f0); background: #f8fafc; display: flex; align-items: center; justify-content: center;">
              <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="참조 이미지" />
            </div>
          ` : ''}
          
          <p style="font-size: 14px; color: var(--text-secondary, #64748b); margin: 0 0 20px 0; line-height: 1.5; word-break: keep-all;">
            ${message}
          </p>
          
          <div class="mixer-custom-modal-actions" style="margin-top: 0; display:flex; justify-content:center;">
            <button id="btnMixerResultConfirm" type="button" style="padding: 8px 32px; border-radius: 8px; border: none; background: var(--accent,#4361ee); color: var(--on-accent,#fff); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;">확인</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      
      const confirmBtn = overlay.querySelector('#btnMixerResultConfirm');
      confirmBtn.addEventListener('click', () => overlay.remove());
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
      });
    }
  }


  // 독립 화풍 믹서 탭 초기화
  document.addEventListener('DOMContentLoaded', () => {
    const mixerContainer = document.getElementById('conceptMixerContainer');
    if (!mixerContainer) return;
    // 서버 manifest 로드 후 초기화 — 커스텀 이미지가 즉시 반영됨
    loadMixerManifest().finally(() => initConceptMixer());
  });

})();
