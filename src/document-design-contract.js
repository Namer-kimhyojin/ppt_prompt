(function () {
  "use strict";

  const SCHEMA = "promptdeck-document-design/2.0";
  const CATALOG = window.PromptDeckDocumentDesignCatalog || {};
  const DEGREE_KEYS = [
    "colorIntensity", "colorPresence", "accentFrequency", "backgroundPresence", "contrast", "darkPageFrequency",
    "titlePresence", "bodyScale", "notePresence", "lineSpacing", "headingEmphasis", "hierarchyDepth",
    "pageWhitespace", "marginBalance", "paragraphRhythm", "pageRhythm", "sectionSeparation", "headerFooterBreathing",
    "imagePresence", "decorationPresence", "tableInformationAmount", "cellBreathing",
  ];
  const PAGE_ROLE_IDS = ["cover", "chapter", "body", "image", "data", "special"];
  const FALLBACK_PAGE_SIZES = [{ id: "A4", label: "A4", widthMm: 210, heightMm: 297 }];
  const FALLBACK_ORIENTATIONS = [{ id: "portrait", label: "세로형" }, { id: "landscape", label: "가로형" }];
  const FALLBACK_FORMATS = [{ id: "DOCX", label: "DOCX", rule: "지정한 판형과 시각 체계를 유지하고 페이지 잘림을 검수" }];
  const FALLBACK_KINDS = [{ id: "business-report", label: "업무보고서" }];
  const FALLBACK_GRAMMARS = [
    { id: "report-analysis", label: "보고·분석형" },
    { id: "professional-explanation", label: "전문·해설형" },
    { id: "textbook-learning", label: "교과·학습형" },
    { id: "exam-practice", label: "수험·문제형" },
    { id: "literary-reading", label: "문학·읽기형" },
    { id: "illustrated-narrative", label: "그림·서사형" },
    { id: "editorial", label: "에디토리얼형" },
  ];
  const FALLBACK_PUBLICATION_TYPES = [
    { id: "business-report", label: "일반 보고서", visualGrammarId: "report-analysis" },
    { id: "business-plan", label: "기획서·사업계획서", visualGrammarId: "report-analysis" },
    { id: "policy-research", label: "정책·연구보고서", visualGrammarId: "professional-explanation" },
    { id: "textbook", label: "교과서", visualGrammarId: "textbook-learning" },
    { id: "study-guide", label: "자습서", visualGrammarId: "textbook-learning" },
    { id: "certification-book", label: "자격증 도서", visualGrammarId: "exam-practice" },
    { id: "essay", label: "수필집·산문집", visualGrammarId: "literary-reading" },
    { id: "fairy-tale", label: "동화책", visualGrammarId: "illustrated-narrative" },
    { id: "magazine", label: "매거진·브랜드북", visualGrammarId: "editorial" },
  ];
  const FALLBACK_PRODUCTION = {
    media: [
      { id: "print", label: "인쇄용" },
      { id: "screen", label: "화면용" },
      { id: "hybrid", label: "인쇄·화면 겸용" },
    ],
    bindings: [
      { id: "none", label: "제본 없음" },
      { id: "saddle", label: "중철" },
      { id: "perfect", label: "무선제본" },
      { id: "hardcover", label: "양장제본" },
      { id: "spiral", label: "스프링제본" },
    ],
    duplex: [{ id: "single", label: "단면" }, { id: "duplex-long", label: "양면·긴쪽 넘김" }, { id: "duplex-short", label: "양면·짧은쪽 넘김" }],
    spreads: [{ id: "single-pages", label: "낱장" }, { id: "facing-pages", label: "맞쪽·펼침" }, { id: "cover-spread", label: "표지 펼침면" }],
  };
  const DEFAULT_THEME = {
    id: "default", nameKo: "기본 문서", sourceVisualStyleId: "default", description: "읽기 쉬운 균형형 문서",
    palette: { primary: "#17375E", secondary: "#486581", accent: "#2563EB", background: "#FFFFFF", surface: "#F7F9FC", text: "#172033", muted: "#667085", border: "#D0D7E2" },
    typography: { fontPreset: "corporate", headingFamily: "Pretendard", bodyFamily: "Pretendard", fallback: "Arial, sans-serif" },
    layout: { density: "balanced", grid: "단일 본문 + 보조 열", header: true, footer: true },
    hierarchy: { method: "크기·굵기·여백을 함께 사용", headlineStyle: "명확한 제목", numbering: "1. / 1.1", emphasis: "강조색과 굵기", alignment: "왼쪽 정렬" },
    tableRules: { style: "얇은 가로선 중심", headerStyle: "주색 머리행", borderStyle: "최소 선", stripeRows: false, repeatHeader: true, numericAlignment: "오른쪽 정렬", showUnits: true, showSource: true },
    chartRules: { preferredType: "막대·선 차트", colorMode: "주색 계열 + 강조색", dataLabels: "핵심 값만", legend: "상단", gridlines: "주요 가로선만", sortOrder: "의미 있는 순서", zeroBaseline: true, threeD: false, showUnits: true, showSource: true },
    components: { cover: true, toc: true, sectionDividers: true, pageNumber: true, table: true, chart: true, images: "필요한 시각 근거만 사용" },
    visualAssets: { backgroundUsage: "표지·간지 중심", backgroundStyle: "낮은 대비", imageUsage: "내용 이해에 필요한 경우", imageStyle: "테마와 같은 색조", imagePlacement: "주변 여백을 확보", iconUsage: "탐색 보조", iconStyle: "일관된 선형", pictogramUsage: "절차·분류 설명", pictogramStyle: "동일 조형 언어", diagramUsage: "관계·절차 설명", diagramStyle: "연결 방향과 범례를 명확히", typographyScope: "모든 페이지 요소" },
    creativeDegrees: {}, signatureRules: [], avoidRules: [],
  };
  const DEFAULT_DEGREES = {
    colorIntensity: "균형 있게", colorPresence: "균형 있게", accentFrequency: "절제되게", backgroundPresence: "은은하게", contrast: "명확하게", darkPageFrequency: "거의 사용하지 않게",
    titlePresence: "강하게", bodyScale: "편안하게", notePresence: "은은하게", lineSpacing: "여유롭게", headingEmphasis: "강하게", hierarchyDepth: "균형 있게",
    pageWhitespace: "균형 있게", marginBalance: "사방 균형 있게", paragraphRhythm: "균형 있게", pageRhythm: "차분하게", sectionSeparation: "분명하게", headerFooterBreathing: "균형 있게",
    imagePresence: "필요한 만큼", decorationPresence: "절제되게", tableInformationAmount: "균형 있게", cellBreathing: "균형 있게",
  };
  const DEFAULT_COLOR_PLACEMENT = {
    primary: "표지 제목·장 제목·핵심 구분", secondary: "보조 구분·연결 정보", accent: "핵심 수치·주의·선택 지점", background: "기본 페이지 바탕", surface: "표·박스·인용 면", text: "본문과 주요 레이블", muted: "캡션·주석·보조 정보", border: "구획선·표 선",
  };
  const DEFAULT_TYPE_SCOPE = {
    cover: "표지 제목과 부제", chapter: "장 제목과 장 번호", body: "본문·소제목·목록", quote: "인용문과 출처", questionAnswer: "문제·선지·정답·해설", tableChart: "표·차트 제목·축·범례·값", caption: "그림·표 캡션", footer: "머리말·꼬리말·쪽번호", numeral: "KPI·공식·페이지 번호", dialogue: "대화·말풍선",
  };
  const DEFAULT_PAGE_RULES = {
    cover: { label: "표지", rule: "책임 있는 첫인상, 제목·부제·발행 정보의 선명한 위계, 테마의 대표 배경과 상징 요소 사용" },
    chapter: { label: "장 도입", rule: "장 번호와 제목을 크게 구분하고 이후 본문과 연결되는 색상·이미지 단서 사용" },
    body: { label: "본문", rule: "긴 읽기에 안정적인 행 길이와 여백, 반복 가능한 제목·본문·주석 위계 유지" },
    image: { label: "이미지·도식", rule: "이미지·아이콘·픽토그램·다이어그램의 역할을 분리하고 캡션·출처를 인접 배치" },
    data: { label: "표·차트", rule: "표와 차트의 수치 비교가 먼저 읽히도록 색상·선·레이블을 절제해 사용" },
    special: { label: "특수 페이지", rule: "문서 유형에 맞는 문제·해설·인용·사례·양면 펼침을 같은 테마 안에서 변주" },
  };
  const DEFAULT_CONSISTENCY = {
    themeContinuity: "전 페이지에 같은 색상 역할·서체 위계·그리드를 유지",
    recurringElements: "장 번호·쪽번호·캡션·표와 그림 번호의 위치와 형식을 고정",
    chapterVariation: "장별 변주는 보조색·대표 이미지 수준으로 제한",
    crossReferences: "그림·표·문제·해설의 상호 참조 표기를 일관되게 유지",
    printContinuity: "홀짝 페이지와 맞쪽 여백·머리말·꼬리말을 제본 방향에 맞춰 검수",
  };

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function pick(list, id, fallback) {
    const safeList = Array.isArray(list) ? list : [];
    return safeList.find((item) => item.id === id) || fallback || safeList[0] || null;
  }

  function catalogList(key, fallback) {
    return Array.isArray(CATALOG[key]) && CATALOG[key].length ? CATALOG[key] : fallback;
  }

  function asObject(value, key = "overall") {
    if (value && typeof value === "object" && !Array.isArray(value)) return value;
    return typeof value === "string" && value.trim() ? { [key]: value.trim() } : {};
  }

  function themeById(id) {
    const themes = catalogList("themes", [DEFAULT_THEME]);
    return (typeof CATALOG.get === "function" ? CATALOG.get(id) : null) || pick(themes, id, themes[0]) || DEFAULT_THEME;
  }

  function mergePageRules(...sources) {
    return Object.fromEntries(PAGE_ROLE_IDS.map((id) => {
      const merged = sources.reduce((result, source) => ({ ...result, ...(source?.[id] || {}) }), {});
      return [id, { ...DEFAULT_PAGE_RULES[id], ...merged }];
    }));
  }

  function productionLists() {
    const production = CATALOG.productionOptions || CATALOG.production || CATALOG.productionProfiles || {};
    return {
      media: production.media || production.mediums || production.outputMedia || CATALOG.outputMedia || FALLBACK_PRODUCTION.media,
      bindings: production.bindings || CATALOG.bindingOptions || FALLBACK_PRODUCTION.bindings,
      duplex: production.duplex || production.duplexModes || CATALOG.duplexOptions || FALLBACK_PRODUCTION.duplex,
      spreads: production.spreads || production.spreadModes || CATALOG.spreadOptions || FALLBACK_PRODUCTION.spreads,
    };
  }

  function productionId(group, value) {
    if (group === "duplex" && typeof value === "boolean") return value ? "duplex-long" : "single";
    const aliases = {
      medium: { "print-screen": "hybrid" },
      duplex: { simplex: "single", duplex: "duplex-long" },
      spread: { single: "single-pages", facing: "facing-pages" },
    };
    return aliases[group]?.[value] || value;
  }

  function numericBleed(value) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return Math.round(parsed * 10) / 10;
    return 0;
  }

  function normalize(input) {
    const theme = themeById(input?.themeId);
    const pageSizes = catalogList("pageSizes", FALLBACK_PAGE_SIZES);
    const orientations = catalogList("pageOrientations", FALLBACK_ORIENTATIONS);
    const outputFormats = catalogList("outputFormats", FALLBACK_FORMATS);
    const documentKinds = catalogList("documentKinds", FALLBACK_KINDS);
    const publicationTypes = catalogList("publicationTypes", FALLBACK_PUBLICATION_TYPES);
    const grammars = catalogList("visualGrammars", FALLBACK_GRAMMARS);
    const pageSize = pick(pageSizes, input?.pageSpec?.sizeId, pageSizes[0]);
    const pageOrientation = pick(orientations, input?.pageSpec?.orientation, orientations[0]);
    const formats = [...new Set((Array.isArray(input?.formats) ? input.formats : ["DOCX"]).filter((id) => outputFormats.some((item) => item.id === id)))];
    const legacyKind = pick(documentKinds, input?.documentKind, documentKinds[0]) || FALLBACK_KINDS[0];
    const requestedPublicationId = input?.publicationTypeId || input?.publicationType || input?.documentKind || legacyKind.id;
    const publicationType = publicationTypes.find((item) => item.id === requestedPublicationId)
      || FALLBACK_PUBLICATION_TYPES.find((item) => item.id === requestedPublicationId)
      || { id: legacyKind.id, label: legacyKind.label, visualGrammarId: "report-analysis" };
    const grammarId = input?.visualGrammarId || publicationType.visualGrammarId || publicationType.grammarId || "report-analysis";
    const visualGrammar = grammars.find((item) => item.id === grammarId)
      || FALLBACK_GRAMMARS.find((item) => item.id === grammarId)
      || FALLBACK_GRAMMARS[0];
    const production = productionLists();
    const productionInput = input?.productionSpec || {};
    const medium = pick(production.media, productionId("medium", productionInput.mediumId || input?.pageSpec?.mediumId), production.media[0] || FALLBACK_PRODUCTION.media[0]);
    const binding = pick(production.bindings, productionInput.bindingId || input?.pageSpec?.bindingId, production.bindings[0] || FALLBACK_PRODUCTION.bindings[0]);
    const duplex = pick(production.duplex, productionId("duplex", productionInput.duplex ?? productionInput.duplexMode ?? input?.pageSpec?.duplex ?? input?.pageSpec?.duplexMode), production.duplex[0] || FALLBACK_PRODUCTION.duplex[0]);
    const spread = pick(production.spreads, productionId("spread", productionInput.spreadMode || input?.pageSpec?.spreadMode), production.spreads[0] || FALLBACK_PRODUCTION.spreads[0]);
    const colors = { ...DEFAULT_THEME.palette, ...(theme.palette || {}), ...(input?.adjustments?.colors || {}) };
    const typography = { ...DEFAULT_THEME.typography, ...(theme.typography || {}), ...(input?.adjustments?.typography || {}) };
    const layout = { ...DEFAULT_THEME.layout, ...(theme.layout || {}), ...(input?.adjustments?.layout || {}) };
    const hierarchy = { ...DEFAULT_THEME.hierarchy, ...(theme.hierarchy || {}), ...(input?.adjustments?.hierarchy || {}) };
    const tableRules = { ...DEFAULT_THEME.tableRules, ...(theme.tableRules || {}), ...(input?.adjustments?.tableRules || {}) };
    const chartRules = { ...DEFAULT_THEME.chartRules, ...(theme.chartRules || {}), ...(input?.adjustments?.chartRules || {}) };
    const components = { ...DEFAULT_THEME.components, ...(theme.components || {}), ...(input?.adjustments?.components || {}) };
    const visualAssets = {
      ...DEFAULT_THEME.visualAssets,
      ...(theme.visualAssets || {}),
      ...(visualGrammar.imageSystem ? { publicationImageSystem: visualGrammar.imageSystem } : {}),
      ...(input?.adjustments?.visualAssets || {}),
    };
    const colorPlacement = { ...DEFAULT_COLOR_PLACEMENT, ...asObject(visualGrammar.colorPlacement, "strategy"), ...asObject(theme.colorPlacement, "strategy"), ...asObject(input?.adjustments?.colorPlacement, "strategy") };
    const typographyScope = { ...DEFAULT_TYPE_SCOPE, ...asObject(visualGrammar.typographyScope || visualGrammar.typeSystem, "visualGrammar"), ...asObject(theme.typographyScope), ...asObject(input?.adjustments?.typographyScope) };
    const grammarPageRules = {
      cover: { rule: `‘${visualGrammar.visualTone || visualGrammar.description || "선택한 시각 어조"}’의 인상을 대표 색상·이미지·제목 배치로 명확히 보여준다.` },
      chapter: { rule: `${visualGrammar.pageRhythm || "문서 전체 리듬"}을 이어가며 장 번호·장 제목·전환 배경을 같은 체계로 반복한다.` },
      body: { rule: `${visualGrammar.typeSystem || "제목·본문·주석 위계"}와 ${visualGrammar.layoutSystem || "반복 가능한 그리드"}를 적용해 긴 읽기의 안정성을 유지한다.` },
      image: { rule: `${visualGrammar.imageSystem || "사진·삽화·도식 체계"}을 적용하고 캡션·출처·텍스트 안전 영역을 일관되게 배치한다.` },
      data: { rule: `${visualGrammar.tableChartSystem || "표·차트 조형 체계"}을 적용하고 단위·기준일·출처가 즉시 읽히게 한다.` },
      special: { label: visualGrammar.specialPageLabel || DEFAULT_PAGE_RULES.special.label, rule: `${visualGrammar.specialPageLabel || "특수 페이지"}의 목적에 맞게 기본 테마를 변주하되 색상 역할·서체 위계·그리드는 유지한다.` },
    };
    const pageRules = mergePageRules(grammarPageRules, visualGrammar.pageRules, publicationType.pageRules, theme.pageRules, input?.adjustments?.pageRules);
    const grammarConsistency = visualGrammar.pageRhythm ? { pageRhythm: visualGrammar.pageRhythm } : {};
    const longDocumentConsistency = { ...DEFAULT_CONSISTENCY, ...grammarConsistency, ...asObject(visualGrammar.longDocumentConsistency), ...asObject(theme.longDocumentConsistency), ...asObject(input?.adjustments?.longDocumentConsistency) };
    const suppliedDegrees = input?.adjustments?.creativeDegrees || input?.creativeDegrees || {};
    const creativeDegrees = Object.fromEntries(DEGREE_KEYS.map((key) => {
      const supplied = typeof suppliedDegrees[key] === "string" ? suppliedDegrees[key].trim() : "";
      return [key, supplied || theme.creativeDegrees?.[key] || visualGrammar.creativeDegrees?.[key] || DEFAULT_DEGREES[key]];
    }));
    const requestedPageRole = input?.pageRole || ({ content: "body", visual: "image" })[input?.previewView] || input?.previewView;
    return {
      sourcePrompt: typeof input?.sourcePrompt === "string" ? input.sourcePrompt : "",
      documentKind: publicationType.id,
      publicationTypeId: publicationType.id,
      publicationType: publicationType.id,
      visualGrammarId: visualGrammar.id,
      formats: formats.length ? formats : ["DOCX"],
      themeId: theme.id,
      pageSpec: { sizeId: pageSize.id, orientation: pageOrientation.id },
      productionSpec: {
        mediumId: medium.id,
        bindingId: binding.id,
        duplex: duplex.id,
        spreadMode: spread.id,
        bleedMm: numericBleed(productionInput.bleedMm ?? input?.pageSpec?.bleedMm),
      },
      previewView: PAGE_ROLE_IDS.includes(requestedPageRole) ? requestedPageRole : "cover",
      pageRole: PAGE_ROLE_IDS.includes(requestedPageRole) ? requestedPageRole : "cover",
      adjustments: { colors, colorPlacement, typography, typographyScope, layout, hierarchy, tableRules, chartRules, components, visualAssets, pageRules, longDocumentConsistency, creativeDegrees },
      quality: {
        preserveFacts: input?.quality?.preserveFacts !== false,
        preserveContentStructure: input?.quality?.preserveContentStructure !== false,
        preventOverflow: input?.quality?.preventOverflow !== false,
        verifyPrint: input?.quality?.verifyPrint !== false,
        accessibleContrast: input?.quality?.accessibleContrast !== false,
        verifyPhysicalSpec: input?.quality?.verifyPhysicalSpec !== false,
        verifyPageSetConsistency: input?.quality?.verifyPageSetConsistency !== false,
        verifyTableChartMetadata: input?.quality?.verifyTableChartMetadata !== false,
        verifyFontAvailability: input?.quality?.verifyFontAvailability !== false,
        verifyImageRights: input?.quality?.verifyImageRights !== false,
      },
    };
  }

  function validate(input) {
    const state = normalize(input);
    const issues = [];
    if (!state.sourcePrompt.trim()) issues.push({ level: "error", field: "sourcePrompt", message: "문서 작성 요청을 입력해주세요." });
    if (!state.formats.length) issues.push({ level: "error", field: "formats", message: "출력 형식을 하나 이상 선택해주세요." });
    if (!state.publicationTypeId) issues.push({ level: "error", field: "publicationTypeId", message: "문서·출판 유형을 선택해주세요." });
    if (!state.visualGrammarId) issues.push({ level: "error", field: "visualGrammarId", message: "비주얼 문법을 확인해주세요." });
    if (!Number.isFinite(state.productionSpec.bleedMm) || state.productionSpec.bleedMm < 0) issues.push({ level: "error", field: "bleedMm", message: "도련 값을 확인해주세요." });
    DEGREE_KEYS.forEach((key) => {
      if (!String(state.adjustments.creativeDegrees[key] || "").trim()) issues.push({ level: "error", field: key, message: "디자인 정도 선택을 확인해주세요." });
    });
    return issues;
  }

  function buildSpec(input) {
    const state = normalize(input);
    const theme = themeById(state.themeId);
    const kinds = catalogList("documentKinds", FALLBACK_KINDS);
    const publicationTypes = catalogList("publicationTypes", FALLBACK_PUBLICATION_TYPES);
    const grammars = catalogList("visualGrammars", FALLBACK_GRAMMARS);
    const outputFormats = catalogList("outputFormats", FALLBACK_FORMATS);
    const pageSizes = catalogList("pageSizes", FALLBACK_PAGE_SIZES);
    const orientations = catalogList("pageOrientations", FALLBACK_ORIENTATIONS);
    const production = productionLists();
    const publicationType = publicationTypes.find((item) => item.id === state.publicationTypeId)
      || FALLBACK_PUBLICATION_TYPES.find((item) => item.id === state.publicationTypeId)
      || { id: state.publicationTypeId, label: state.publicationTypeId, visualGrammarId: state.visualGrammarId };
    const kind = kinds.find((item) => item.id === state.documentKind)
      || { id: publicationType.id, label: publicationType.label };
    const visualGrammar = grammars.find((item) => item.id === state.visualGrammarId)
      || FALLBACK_GRAMMARS.find((item) => item.id === state.visualGrammarId)
      || FALLBACK_GRAMMARS[0];
    const formatProfiles = state.formats.map((id) => pick(outputFormats, id, FALLBACK_FORMATS[0])).filter(Boolean);
    const pageSize = pick(pageSizes, state.pageSpec.sizeId, pageSizes[0]) || FALLBACK_PAGE_SIZES[0];
    const pageOrientation = pick(orientations, state.pageSpec.orientation, orientations[0]) || FALLBACK_ORIENTATIONS[0];
    const medium = pick(production.media, state.productionSpec.mediumId, FALLBACK_PRODUCTION.media[0]);
    const binding = pick(production.bindings, state.productionSpec.bindingId, FALLBACK_PRODUCTION.bindings[0]);
    const duplex = pick(production.duplex, state.productionSpec.duplex, FALLBACK_PRODUCTION.duplex[0]);
    const spread = pick(production.spreads, state.productionSpec.spreadMode, FALLBACK_PRODUCTION.spreads[0]);
    const degrees = state.adjustments.creativeDegrees;
    const typography = state.adjustments.typography;
    const layout = state.adjustments.layout;
    const hierarchy = state.adjustments.hierarchy;
    const tableRules = state.adjustments.tableRules;
    const { levels: _legacyLevels, ...semanticHierarchy } = clone(hierarchy);
    const { maxColumns: _legacyMaxColumns, cellPaddingMm: _legacyCellPadding, ...semanticTableRules } = clone(tableRules);
    const pageWidthMm = pageOrientation.id === "landscape" ? pageSize.heightMm : pageSize.widthMm;
    const pageHeightMm = pageOrientation.id === "landscape" ? pageSize.widthMm : pageSize.heightMm;
    return {
      schema: SCHEMA,
      createdAt: new Date().toISOString(),
      source: "promptdeck-document-design",
      document: {
        kind: kind.id,
        kindLabel: kind.label,
        formats: formatProfiles.map((item) => item.id),
        page: { sizeId: pageSize.id, sizeLabel: pageSize.label, orientation: pageOrientation.id, orientationLabel: pageOrientation.label, widthMm: pageWidthMm, heightMm: pageHeightMm },
        production: {
          mediumId: medium.id, mediumLabel: medium.label, mediumRule: medium.rule || "",
          bindingId: binding.id, bindingLabel: binding.label, gutterMm: Number(binding.gutterMm) || 0,
          duplex: duplex.id, duplexLabel: duplex.label, duplexRule: duplex.rule || "",
          spreadMode: spread.id, spreadLabel: spread.label, spreadRule: spread.rule || "",
          bleedMm: state.productionSpec.bleedMm,
        },
      },
      publication: {
        typeId: publicationType.id,
        typeLabel: publicationType.label,
        visualGrammarId: visualGrammar.id,
        visualGrammarLabel: visualGrammar.label,
        visualSystem: {
          tone: visualGrammar.visualTone || "목적에 맞는 일관된 시각 어조",
          layout: visualGrammar.layoutSystem || "페이지 역할에 맞는 반복 가능한 그리드",
          typography: visualGrammar.typeSystem || "제목·본문·보조 정보의 명확한 위계",
          imagery: visualGrammar.imageSystem || "이미지·도식의 역할과 스타일을 일관되게 유지",
          data: visualGrammar.tableChartSystem || "표·차트의 판독성과 테마 일관성을 함께 유지",
        },
      },
      theme: { id: theme.id, name: theme.nameKo, sourceVisualStyleId: theme.sourceVisualStyleId, description: theme.description },
      colors: clone(state.adjustments.colors),
      colorPlacement: clone(state.adjustments.colorPlacement),
      typography: {
        fontPreset: typography.fontPreset,
        headingFamily: typography.headingFamily,
        bodyFamily: typography.bodyFamily,
        fallback: typography.fallback,
        titlePresence: degrees.titlePresence,
        bodyScale: degrees.bodyScale,
        notePresence: degrees.notePresence,
        lineSpacing: degrees.lineSpacing,
        headingEmphasis: degrees.headingEmphasis,
        scope: clone(state.adjustments.typographyScope),
      },
      layout: {
        density: layout.density,
        grid: layout.grid,
        pageWhitespace: degrees.pageWhitespace,
        marginBalance: degrees.marginBalance,
        paragraphRhythm: degrees.paragraphRhythm,
        sectionSeparation: degrees.sectionSeparation,
        headerFooterBreathing: degrees.headerFooterBreathing,
        header: layout.header,
        footer: layout.footer,
      },
      hierarchy: { ...semanticHierarchy, depth: degrees.hierarchyDepth },
      tableRules: { ...semanticTableRules, informationAmount: degrees.tableInformationAmount, cellBreathing: degrees.cellBreathing },
      chartRules: clone(state.adjustments.chartRules),
      components: clone(state.adjustments.components),
      visualAssets: clone(state.adjustments.visualAssets),
      pageRules: clone(state.adjustments.pageRules),
      longDocumentConsistency: clone(state.adjustments.longDocumentConsistency),
      creativeDirection: clone(degrees),
      formatRules: formatProfiles.map((item) => ({ format: item.id, rule: item.rule })),
      signatureRules: Array.isArray(theme.signatureRules) ? theme.signatureRules.slice() : [],
      avoidRules: Array.isArray(theme.avoidRules) ? theme.avoidRules.slice() : [],
      quality: clone(state.quality),
    };
  }

  function yesNo(value) {
    return value ? "사용" : "사용 안 함";
  }

  function densityLabel(value) {
    return ({ airy: "여유롭게", balanced: "균형 있게", compact: "촘촘하게" })[value] || value;
  }

  function inlineRules(rules, order) {
    return order.map((key) => `${rules[key]?.label || key}: ${rules[key]?.rule || rules[key] || "테마 기본값 적용"}`).join("; ");
  }

  function inlineScope(scope) {
    return Object.entries(scope || {}).map(([key, value]) => `${key}=${value}`).join("; ");
  }

  function renderDesignPrompt(spec) {
    const component = spec.components;
    const quality = spec.quality;
    const colors = spec.colors;
    const type = spec.typography;
    const layout = spec.layout;
    const hierarchy = spec.hierarchy;
    const table = spec.tableRules;
    const chart = spec.chartRules;
    const visual = spec.visualAssets;
    const production = spec.document.production;
    const direction = spec.creativeDirection;
    const lines = [
      "## 문서 비주얼 편집 및 출력 지침 (PromptDeck DocumentDesignSpec 2.0)",
      "- 원문 불변 원칙: 입력된 원문의 내용·목차·문장·사실·수치·고유명사를 수정·요약·보완하지 않는다. 이 사양은 시각 편집과 제작 방식에만 적용한다.",
      `- 제작 규격: ${spec.document.page.sizeLabel} · ${spec.document.page.orientationLabel} · 완성 크기 ${spec.document.page.widthMm}×${spec.document.page.heightMm}mm · ${production.mediumLabel} · ${production.bindingLabel}${production.gutterMm ? `, 제본 여유 ${production.gutterMm}mm` : ""} · ${production.duplexLabel} · ${production.spreadLabel} · 사방 도련 ${production.bleedMm}mm. 이 물리 규격은 정확히 고정하고 임의로 변경하지 않는다.`,
      `- 제작 방식 적용: ${[production.mediumRule, production.duplexRule, production.spreadRule].filter(Boolean).join("; ") || "지정한 출력 매체와 제본 방식에 맞춰 여백과 페이지 기준선을 유지"}.`,
      `- 문서·출판 비주얼 유형: ${spec.publication.typeLabel} · ${spec.publication.visualGrammarLabel}. 내용의 구성이나 순서를 제안하지 말고 이 유형의 시각 문법만 적용한다.`,
      `- 유형별 시각 문법: 어조 ${spec.publication.visualSystem.tone}; 레이아웃 ${spec.publication.visualSystem.layout}; 서체 ${spec.publication.visualSystem.typography}; 이미지·도식 ${spec.publication.visualSystem.imagery}; 표·차트 ${spec.publication.visualSystem.data}.`,
      `- 출력 형식: ${spec.document.formats.join(", ")}`,
      `- 통합 디자인 테마: ${spec.theme.name} — ${spec.theme.description}`,
      `- 6종 페이지 세트: ${inlineRules(spec.pageRules, PAGE_ROLE_IDS)}`,
      "- AI 해석 원칙: 아래의 정도 표현은 고정 수치가 아닌 시각적 의도와 느낌이다. 문서의 목적·분량·판형·내용에 맞춰 창의적으로 해석하되, 선택한 테마의 일관성과 실제 읽기 편의성을 유지한다. pt·mm·% 값을 기계적으로 고정하지 않는다.",
      `- 색상 정도: 색상 존재감 ${direction.colorPresence}, 색상 강도 ${direction.colorIntensity}, 강조 빈도 ${direction.accentFrequency}, 배경 사용 ${direction.backgroundPresence}, 대비 ${direction.contrast}, 어두운 페이지 빈도 ${direction.darkPageFrequency}.`,
      `- 색상 팔레트: 주색 ${colors.primary}, 보조색 ${colors.secondary}, 강조색 ${colors.accent}, 배경 ${colors.background}, 표면 ${colors.surface}, 본문 ${colors.text}, 보조 글자 ${colors.muted}, 선 ${colors.border}.`,
      `- 색상 역할과 배치: ${Object.entries(spec.colorPlacement).map(([role, value]) => `${role}=${value}`).join("; ")}. 색은 장식이 아니라 정보 위계와 페이지 역할을 구분하는 데 사용한다.`,
      `- 글꼴 방향: 제목 ${type.headingFamily}, 본문 ${type.bodyFamily}; 제목 존재감 ${type.titlePresence}, 본문 크기감 ${type.bodyScale}, 주석 존재감 ${type.notePresence}, 행간 ${type.lineSpacing}, 제목 무게감 ${type.headingEmphasis}`,
      `- 타이포그래피 적용 범위: ${inlineScope(type.scope)}. 같은 의미의 요소에는 페이지 유형이 달라도 같은 서체 역할을 적용한다.`,
      `- 레이아웃 방향: ${layout.grid}, 정보 밀도 ${densityLabel(layout.density)}, 페이지 여백 ${layout.pageWhitespace}, 여백 배분 ${layout.marginBalance}, 머리말·꼬리말 거리감 ${layout.headerFooterBreathing}, 문단 호흡 ${layout.paragraphRhythm}, 페이지 리듬 ${direction.pageRhythm}, 절 구분 ${layout.sectionSeparation}, 장식 정도 ${direction.decorationPresence}`,
      `- 정보 위계: 깊이 ${hierarchy.depth}, ${hierarchy.method}; 제목은 ${hierarchy.headlineStyle}, 번호 체계 ${hierarchy.numbering}, 강조 ${hierarchy.emphasis}, ${hierarchy.alignment}`,
      `- 문서 요소: 표지 ${yesNo(component.cover)}, 목차 ${yesNo(component.toc)}, 간지 ${yesNo(component.sectionDividers)}, 쪽번호 ${yesNo(component.pageNumber)}, 표 ${yesNo(component.table)}, 차트 ${yesNo(component.chart)}, 이미지 정책 ‘${component.images}’`,
      `- 이미지: 존재감 ${direction.imagePresence}; ${visual.imageUsage}; ${visual.imageStyle}; 배치 ${visual.imagePlacement}`,
      `- 배경 이미지: ${visual.backgroundUsage}; ${visual.backgroundStyle}; 배경 사용 정도 ${direction.backgroundPresence}`,
      `- 아이콘: ${visual.iconUsage}; ${visual.iconStyle}`,
      `- 픽토그램: ${visual.pictogramUsage}; ${visual.pictogramStyle}`,
      `- 다이어그램: ${visual.diagramUsage}; ${visual.diagramStyle}. 관계·순서·원인·구조 중 전달하려는 개념에 맞는 형식을 선택하고 연결선·방향·범례를 분명히 한다.`,
      `- 표 규칙: ${table.style}, 머리행 ${table.headerStyle}, 선 ${table.borderStyle}, 정보량 ${table.informationAmount}, 셀 여백 ${table.cellBreathing}, 줄무늬 ${yesNo(table.stripeRows)}, 머리행 반복 ${yesNo(table.repeatHeader)}, 숫자 ${table.numericAlignment}, 단위 ${yesNo(table.showUnits)}, 출처 ${yesNo(table.showSource)}`,
      `- 그래프 규칙: 우선 ${chart.preferredType}, 색상 ${chart.colorMode}, 값 표기 ${chart.dataLabels}, 범례 ${chart.legend}, 눈금선 ${chart.gridlines}, 정렬 ${chart.sortOrder}, 0 기준선 ${yesNo(chart.zeroBaseline)}, 3D ${yesNo(chart.threeD)}, 단위 ${yesNo(chart.showUnits)}, 출처 ${yesNo(chart.showSource)}`,
      `- 장문 일관성: ${Object.values(spec.longDocumentConsistency).join("; ")}`,
      `- 시그니처 규칙: ${spec.signatureRules.join("; ")}`,
      `- 피할 표현: ${spec.avoidRules.join("; ")}`,
      ...spec.formatRules.map((item) => `- ${item.format} 규칙: ${item.rule}`),
      "- 출력 형식 공통 원칙: 형식별 기본 관례보다 위에서 지정한 완성 크기·방향·도련을 우선한다. 글꼴을 포함하고 화면과 인쇄에서 같은 위계가 유지되게 한다.",
      `- 검수: 원문 내용·구조 보존 ${yesNo(quality.preserveFacts && quality.preserveContentStructure)}, 물리 규격 ${yesNo(quality.verifyPhysicalSpec)}, 넘침·잘림 방지 ${yesNo(quality.preventOverflow)}, 인쇄 결과 ${yesNo(quality.verifyPrint)}, 접근성 대비 ${yesNo(quality.accessibleContrast)}, 6종 페이지 세트 일관성 ${yesNo(quality.verifyPageSetConsistency)}, 표·차트 제목·단위·기준일·출처 ${yesNo(quality.verifyTableChartMetadata)}, 글꼴 사용 가능 여부 ${yesNo(quality.verifyFontAvailability)}, 이미지 사용 권리와 출처 ${yesNo(quality.verifyImageRights)}.`,
      "- 이 지침의 제목과 항목명은 제작 메타데이터이며, 문서 본문에 그대로 출력하지 않는다.",
    ];
    return lines.join("\n");
  }

  function composeFullPrompt(sourcePrompt, designPrompt) {
    const source = typeof sourcePrompt === "string" ? sourcePrompt : "";
    if (!source) return designPrompt;
    const separator = source.endsWith("\n\n") ? "" : source.endsWith("\n") ? "\n" : "\n\n";
    return `${source}${separator}${designPrompt}`;
  }

  function build(input) {
    const state = normalize(input);
    const spec = buildSpec(state);
    const designPrompt = renderDesignPrompt(spec);
    return { state, spec, designPrompt, fullPrompt: composeFullPrompt(state.sourcePrompt, designPrompt), issues: validate(state) };
  }

  window.PromptDeckDocumentDesignContract = Object.freeze({
    schema: SCHEMA,
    normalize,
    validate,
    buildSpec,
    renderDesignPrompt,
    composeFullPrompt,
    build,
  });
})();
