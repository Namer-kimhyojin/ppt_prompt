(function () {
  "use strict";

  const SCHEMA = "promptdeck-document-design/1.2";
  const CATALOG = window.PromptDeckDocumentDesignCatalog;
  const DEGREE_KEYS = ["colorIntensity", "contrast", "titlePresence", "bodyScale", "notePresence", "lineSpacing", "headingEmphasis", "hierarchyDepth", "pageWhitespace", "marginBalance", "paragraphRhythm", "sectionSeparation", "headerFooterBreathing", "tableInformationAmount", "cellBreathing"];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function pick(list, id, fallback) {
    return list.find((item) => item.id === id) || fallback || list[0];
  }

  function normalize(input) {
    const theme = CATALOG.get(input?.themeId) || CATALOG.themes[0];
    const pageSize = pick(CATALOG.pageSizes, input?.pageSpec?.sizeId, CATALOG.pageSizes[0]);
    const pageOrientation = pick(CATALOG.pageOrientations, input?.pageSpec?.orientation, CATALOG.pageOrientations[0]);
    const formats = [...new Set((Array.isArray(input?.formats) ? input.formats : ["DOCX"]).filter((id) => CATALOG.outputFormats.some((item) => item.id === id)))];
    const colors = { ...theme.palette, ...(input?.adjustments?.colors || {}) };
    const typography = { ...theme.typography, ...(input?.adjustments?.typography || {}) };
    const layout = { ...theme.layout, ...(input?.adjustments?.layout || {}) };
    const hierarchy = { ...theme.hierarchy, ...(input?.adjustments?.hierarchy || {}) };
    const tableRules = { ...theme.tableRules, ...(input?.adjustments?.tableRules || {}) };
    const chartRules = { ...theme.chartRules, ...(input?.adjustments?.chartRules || {}) };
    const components = { ...theme.components, ...(input?.adjustments?.components || {}) };
    const visualAssets = { ...theme.visualAssets, ...(input?.adjustments?.visualAssets || {}) };
    const suppliedDegrees = input?.adjustments?.creativeDegrees || input?.creativeDegrees || {};
    const creativeDegrees = Object.fromEntries(DEGREE_KEYS.map((key) => {
      const supplied = typeof suppliedDegrees[key] === "string" ? suppliedDegrees[key].trim() : "";
      return [key, supplied || theme.creativeDegrees[key]];
    }));
    return {
      sourcePrompt: typeof input?.sourcePrompt === "string" ? input.sourcePrompt : "",
      documentKind: pick(CATALOG.documentKinds, input?.documentKind, CATALOG.documentKinds[0]).id,
      formats: formats.length ? formats : ["DOCX"],
      themeId: theme.id,
      pageSpec: { sizeId: pageSize.id, orientation: pageOrientation.id },
      previewView: ["cover", "content", "data"].includes(input?.previewView) ? input.previewView : "cover",
      adjustments: { colors, typography, layout, hierarchy, tableRules, chartRules, components, visualAssets, creativeDegrees },
      quality: {
        preserveFacts: input?.quality?.preserveFacts !== false,
        preventOverflow: input?.quality?.preventOverflow !== false,
        verifyPrint: input?.quality?.verifyPrint !== false,
        accessibleContrast: input?.quality?.accessibleContrast !== false,
      },
    };
  }

  function validate(input) {
    const state = normalize(input);
    const issues = [];
    if (!state.sourcePrompt.trim()) issues.push({ level: "error", field: "sourcePrompt", message: "문서 작성 요청을 입력해주세요." });
    if (!state.formats.length) issues.push({ level: "error", field: "formats", message: "출력 형식을 하나 이상 선택해주세요." });
    DEGREE_KEYS.forEach((key) => {
      if (!String(state.adjustments.creativeDegrees[key] || "").trim()) issues.push({ level: "error", field: key, message: "디자인 정도 선택을 확인해주세요." });
    });
    return issues;
  }

  function buildSpec(input) {
    const state = normalize(input);
    const theme = CATALOG.get(state.themeId);
    const kind = pick(CATALOG.documentKinds, state.documentKind);
    const formatProfiles = state.formats.map((id) => pick(CATALOG.outputFormats, id));
    const pageSize = pick(CATALOG.pageSizes, state.pageSpec.sizeId, CATALOG.pageSizes[0]);
    const pageOrientation = pick(CATALOG.pageOrientations, state.pageSpec.orientation, CATALOG.pageOrientations[0]);
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
        contentFlow: kind.flow,
        formats: formatProfiles.map((item) => item.id),
        page: { sizeId: pageSize.id, sizeLabel: pageSize.label, orientation: pageOrientation.id, orientationLabel: pageOrientation.label, widthMm: pageWidthMm, heightMm: pageHeightMm },
      },
      theme: { id: theme.id, name: theme.nameKo, sourceVisualStyleId: theme.sourceVisualStyleId, description: theme.description },
      colors: clone(state.adjustments.colors),
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
      creativeDirection: clone(degrees),
      formatRules: formatProfiles.map((item) => ({ format: item.id, rule: item.rule })),
      signatureRules: theme.signatureRules.slice(),
      avoidRules: theme.avoidRules.slice(),
      quality: clone(state.quality),
    };
  }

  function yesNo(value) {
    return value ? "사용" : "사용 안 함";
  }

  function densityLabel(value) {
    return ({ airy: "여유롭게", balanced: "균형 있게", compact: "촘촘하게" })[value] || value;
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
    const lines = [
      "## 문서 디자인 및 출력 지침 (PromptDeck DocumentDesignSpec 1.2)",
      `- 문서 종류: ${spec.document.kindLabel}`,
      `- 출력 형식: ${spec.document.formats.join(", ")}`,
      `- 문서 규격: ${spec.document.page.sizeLabel} · ${spec.document.page.orientationLabel} · 완성 크기 ${spec.document.page.widthMm}×${spec.document.page.heightMm}mm. 이 물리 규격은 정확히 고정하고 AI가 임의로 바꾸지 않는다.`,
      `- 권장 내용 흐름: ${spec.document.contentFlow}`,
      `- 디자인 테마: ${spec.theme.name} — ${spec.theme.description}`,
      "- AI 해석 원칙: 아래의 정도 표현은 고정 수치가 아닌 시각적 의도와 느낌이다. 문서의 목적·분량·판형·내용에 맞춰 창의적으로 해석하되, 선택한 테마의 일관성과 실제 읽기 편의성을 유지한다. pt·mm·% 값을 기계적으로 고정하지 않는다.",
      `- 색상 방향: 주색 ${colors.primary}, 보조색 ${colors.secondary}, 강조색 ${colors.accent}, 배경 ${colors.background}, 표면 ${colors.surface}, 본문 ${colors.text}, 보조 글자 ${colors.muted}, 선 ${colors.border}를 기준 팔레트로 삼고 색상 강도는 ${spec.creativeDirection.colorIntensity}, 대비는 ${spec.creativeDirection.contrast} 표현한다. 출력 매체와 내용에 맞춰 자연스럽게 변주한다.`,
      `- 글꼴 방향: 제목 ${type.headingFamily}, 본문 ${type.bodyFamily}; 제목 존재감 ${type.titlePresence}, 본문 크기감 ${type.bodyScale}, 주석 존재감 ${type.notePresence}, 행간 ${type.lineSpacing}, 제목 무게감 ${type.headingEmphasis}`,
      `- 레이아웃 방향: ${layout.grid}, 정보 밀도 ${densityLabel(layout.density)}, 페이지 여백 ${layout.pageWhitespace}, 여백 배분 ${layout.marginBalance}, 머리말·꼬리말 거리감 ${layout.headerFooterBreathing}, 문단 호흡 ${layout.paragraphRhythm}, 절 구분 ${layout.sectionSeparation}`,
      `- 정보 위계: 깊이 ${hierarchy.depth}, ${hierarchy.method}; 제목은 ${hierarchy.headlineStyle}, 번호 체계 ${hierarchy.numbering}, 강조 ${hierarchy.emphasis}, ${hierarchy.alignment}`,
      `- 문서 요소: 표지 ${yesNo(component.cover)}, 목차 ${yesNo(component.toc)}, 간지 ${yesNo(component.sectionDividers)}, 쪽번호 ${yesNo(component.pageNumber)}, 표 ${yesNo(component.table)}, 차트 ${yesNo(component.chart)}, 이미지 정책 ‘${component.images}’`,
      `- 배경 이미지: ${visual.backgroundUsage}; ${visual.backgroundStyle}`,
      `- 아이콘: ${visual.iconUsage}; ${visual.iconStyle}`,
      `- 픽토그램: ${visual.pictogramUsage}; ${visual.pictogramStyle}`,
      `- 타이포그래피 적용 범위: ${visual.typographyScope}`,
      `- 표 규칙: ${table.style}, 머리행 ${table.headerStyle}, 선 ${table.borderStyle}, 정보량 ${table.informationAmount}, 셀 여백 ${table.cellBreathing}, 줄무늬 ${yesNo(table.stripeRows)}, 머리행 반복 ${yesNo(table.repeatHeader)}, 숫자 ${table.numericAlignment}, 단위 ${yesNo(table.showUnits)}, 출처 ${yesNo(table.showSource)}`,
      `- 그래프 규칙: 우선 ${chart.preferredType}, 색상 ${chart.colorMode}, 값 표기 ${chart.dataLabels}, 범례 ${chart.legend}, 눈금선 ${chart.gridlines}, 정렬 ${chart.sortOrder}, 0 기준선 ${yesNo(chart.zeroBaseline)}, 3D ${yesNo(chart.threeD)}, 단위 ${yesNo(chart.showUnits)}, 출처 ${yesNo(chart.showSource)}`,
      `- 시그니처 규칙: ${spec.signatureRules.join("; ")}`,
      `- 피할 표현: ${spec.avoidRules.join("; ")}`,
      ...spec.formatRules.map((item) => `- ${item.format} 규칙: ${item.rule}`),
      "- 작성 원칙: 원문의 사실, 수치, 고유명사, 문서 목적과 요구 분량을 임의로 바꾸지 않는다.",
      `- 검수: 넘침·잘림 방지 ${yesNo(quality.preventOverflow)}, 인쇄 결과 확인 ${yesNo(quality.verifyPrint)}, 접근성 대비 확인 ${yesNo(quality.accessibleContrast)}, 사실 보존 확인 ${yesNo(quality.preserveFacts)}. 표·차트에는 제목, 단위, 기준일, 출처를 표시한다.`,
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
