(function () {
  "use strict";

  const SCHEMA = "promptdeck-document-design/1.0";
  const CATALOG = window.PromptDeckDocumentDesignCatalog;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function pick(list, id, fallback) {
    return list.find((item) => item.id === id) || fallback || list[0];
  }

  function normalize(input) {
    const theme = CATALOG.get(input?.themeId) || CATALOG.themes[0];
    const formats = [...new Set((Array.isArray(input?.formats) ? input.formats : ["DOCX"]).filter((id) => CATALOG.outputFormats.some((item) => item.id === id)))];
    const colors = { ...theme.palette, ...(input?.adjustments?.colors || {}) };
    const typography = { ...theme.typography, ...(input?.adjustments?.typography || {}) };
    const layout = { ...theme.layout, ...(input?.adjustments?.layout || {}) };
    const hierarchy = { ...theme.hierarchy, ...(input?.adjustments?.hierarchy || {}) };
    const tableRules = { ...theme.tableRules, ...(input?.adjustments?.tableRules || {}) };
    const chartRules = { ...theme.chartRules, ...(input?.adjustments?.chartRules || {}) };
    const components = { ...theme.components, ...(input?.adjustments?.components || {}) };
    return {
      sourcePrompt: typeof input?.sourcePrompt === "string" ? input.sourcePrompt : "",
      documentKind: pick(CATALOG.documentKinds, input?.documentKind, CATALOG.documentKinds[0]).id,
      formats: formats.length ? formats : ["DOCX"],
      themeId: theme.id,
      previewView: ["cover", "content", "data"].includes(input?.previewView) ? input.previewView : "cover",
      adjustments: { colors, typography, layout, hierarchy, tableRules, chartRules, components },
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
    const bodySize = Number(state.adjustments.typography.bodySizePt);
    if (!Number.isFinite(bodySize) || bodySize < 8 || bodySize > 24) issues.push({ level: "error", field: "bodySizePt", message: "본문 크기는 8~24pt 범위로 설정해주세요." });
    const lineHeight = Number(state.adjustments.typography.lineHeightPercent);
    if (!Number.isFinite(lineHeight) || lineHeight < 110 || lineHeight > 220) issues.push({ level: "error", field: "lineHeightPercent", message: "행간은 110~220% 범위로 설정해주세요." });
    ["marginTopMm", "marginRightMm", "marginBottomMm", "marginLeftMm"].forEach((key) => {
      const margin = Number(state.adjustments.layout[key]);
      if (!Number.isFinite(margin) || margin < 8 || margin > 40) issues.push({ level: "error", field: key, message: "페이지 여백은 8~40mm 범위로 설정해주세요." });
    });
    const maxColumns = Number(state.adjustments.tableRules.maxColumns);
    if (!Number.isFinite(maxColumns) || maxColumns < 3 || maxColumns > 12) issues.push({ level: "error", field: "maxColumns", message: "표의 권장 최대 열 수는 3~12열로 설정해주세요." });
    return issues;
  }

  function buildSpec(input) {
    const state = normalize(input);
    const theme = CATALOG.get(state.themeId);
    const kind = pick(CATALOG.documentKinds, state.documentKind);
    const formatProfiles = state.formats.map((id) => pick(CATALOG.outputFormats, id));
    return {
      schema: SCHEMA,
      createdAt: new Date().toISOString(),
      source: "promptdeck-document-design",
      document: { kind: kind.id, kindLabel: kind.label, contentFlow: kind.flow, formats: formatProfiles.map((item) => item.id) },
      theme: { id: theme.id, name: theme.nameKo, sourceVisualStyleId: theme.sourceVisualStyleId, description: theme.description },
      colors: clone(state.adjustments.colors),
      typography: clone(state.adjustments.typography),
      layout: clone(state.adjustments.layout),
      hierarchy: clone(state.adjustments.hierarchy),
      tableRules: clone(state.adjustments.tableRules),
      chartRules: clone(state.adjustments.chartRules),
      components: clone(state.adjustments.components),
      formatRules: formatProfiles.map((item) => ({ format: item.id, rule: item.rule })),
      signatureRules: theme.signatureRules.slice(),
      avoidRules: theme.avoidRules.slice(),
      quality: clone(state.quality),
    };
  }

  function yesNo(value) {
    return value ? "사용" : "사용 안 함";
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
    const lines = [
      "## 문서 디자인 및 출력 지침 (PromptDeck DocumentDesignSpec 1.0)",
      `- 문서 종류: ${spec.document.kindLabel}`,
      `- 출력 형식: ${spec.document.formats.join(", ")}`,
      `- 권장 내용 흐름: ${spec.document.contentFlow}`,
      `- 디자인 테마: ${spec.theme.name} — ${spec.theme.description}`,
      `- 색상 역할: 주색 ${colors.primary}, 보조색 ${colors.secondary}, 강조색 ${colors.accent}, 배경 ${colors.background}, 표면 ${colors.surface}, 본문 ${colors.text}, 보조 글자 ${colors.muted}, 선 ${colors.border}`,
      `- 글꼴: 제목 ${type.headingFamily}, 본문 ${type.bodyFamily}; 제목 ${type.headingSizePt}pt, 본문 ${type.bodySizePt}pt, 주석 ${type.footnoteSizePt}pt, 행간 ${type.lineHeightPercent}%, 제목 굵기 ${type.headingWeight}`,
      `- 레이아웃: ${layout.grid}, 정보 밀도 ${layout.density}, 여백 상 ${layout.marginTopMm}mm·우 ${layout.marginRightMm}mm·하 ${layout.marginBottomMm}mm·좌 ${layout.marginLeftMm}mm, 머리말 거리 ${layout.headerDistanceMm}mm, 꼬리말 거리 ${layout.footerDistanceMm}mm, 문단 간격 ${layout.paragraphGapPt}pt, 절 간격 ${layout.sectionGapPt}pt`,
      `- 정보 위계: ${hierarchy.levels}단계, ${hierarchy.method}; 제목은 ${hierarchy.headlineStyle}, 번호 체계 ${hierarchy.numbering}, 강조 ${hierarchy.emphasis}, ${hierarchy.alignment}`,
      `- 문서 요소: 표지 ${yesNo(component.cover)}, 목차 ${yesNo(component.toc)}, 간지 ${yesNo(component.sectionDividers)}, 쪽번호 ${yesNo(component.pageNumber)}, 표 ${yesNo(component.table)}, 차트 ${yesNo(component.chart)}, 이미지 정책 ‘${component.images}’`,
      `- 표 규칙: ${table.style}, 머리행 ${table.headerStyle}, 선 ${table.borderStyle}, 줄무늬 ${yesNo(table.stripeRows)}, 머리행 반복 ${yesNo(table.repeatHeader)}, 숫자 ${table.numericAlignment}, 셀 안쪽 여백 ${table.cellPaddingMm}mm, 최대 ${table.maxColumns}열, 단위 ${yesNo(table.showUnits)}, 출처 ${yesNo(table.showSource)}`,
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
