// PromptDeck 라벨·티켓 A4 규격 레지스트리
// Public API: window.PromptDeckLabelSheetPresets
// - A4: canonical A4 dimensions in millimetres
// - presets: immutable preset registry keyed by id
// - list(options?): cloned preset list; supports { category, orientation }
// - get(id): cloned preset or null
// - createGenericGrid(options): computed, non-product A4 grid preset
(function (global) {
  "use strict";

  const A4 = Object.freeze({
    portrait: Object.freeze({ widthMm: 210, heightMm: 297 }),
    landscape: Object.freeze({ widthMm: 297, heightMm: 210 }),
  });

  function finiteNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function positiveInteger(value, fallback) {
    const number = Math.trunc(finiteNumber(value, fallback));
    return number > 0 ? number : fallback;
  }

  function roundMm(value) {
    return Math.round(value * 10000) / 10000;
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.keys(value).forEach((key) => deepFreeze(value[key]));
    return value;
  }

  function createGenericGrid(options) {
    const input = options && typeof options === "object" ? options : {};
    const orientation = input.orientation === "landscape" ? "landscape" : "portrait";
    const page = A4[orientation];
    const rows = positiveInteger(input.rows, orientation === "portrait" ? 8 : 3);
    const columns = positiveInteger(input.columns, orientation === "portrait" ? 3 : 8);
    const marginTopMm = Math.max(0, finiteNumber(input.marginTopMm, 10));
    const marginRightMm = Math.max(0, finiteNumber(input.marginRightMm, 10));
    const marginBottomMm = Math.max(0, finiteNumber(input.marginBottomMm, 10));
    const marginLeftMm = Math.max(0, finiteNumber(input.marginLeftMm, 10));
    const gapXmm = Math.max(0, finiteNumber(input.gapXmm, 2));
    const gapYmm = Math.max(0, finiteNumber(input.gapYmm, 2));
    const usableWidth = page.widthMm - marginLeftMm - marginRightMm - gapXmm * (columns - 1);
    const usableHeight = page.heightMm - marginTopMm - marginBottomMm - gapYmm * (rows - 1);

    if (!(usableWidth > 0) || !(usableHeight > 0)) {
      throw new RangeError("A4 용지 안에 배치할 수 있도록 여백·간격·행·열 값을 조정하세요.");
    }

    const labelWidthMm = roundMm(usableWidth / columns);
    const labelHeightMm = roundMm(usableHeight / rows);
    const id = String(input.id || `generic-a4-${columns}x${rows}-${orientation}`);
    const label = String(input.label || `A4 범용 ${columns}×${rows} (${orientation === "portrait" ? "세로" : "가로"})`);

    return {
      id,
      label,
      category: input.category || "generic-grid",
      manufacturer: null,
      productCode: null,
      editable: input.editable !== false,
      page: {
        size: "A4",
        orientation,
        widthMm: page.widthMm,
        heightMm: page.heightMm,
      },
      grid: {
        rows,
        columns,
        labelWidthMm,
        labelHeightMm,
        offsetTopMm: roundMm(marginTopMm),
        offsetLeftMm: roundMm(marginLeftMm),
        pitchXmm: roundMm(labelWidthMm + gapXmm),
        pitchYmm: roundMm(labelHeightMm + gapYmm),
        gapXmm: roundMm(gapXmm),
        gapYmm: roundMm(gapYmm),
      },
      duplexSuitable: input.duplexSuitable == null ? null : Boolean(input.duplexSuitable),
      duplexSuitability: input.duplexSuitability || "depends-on-media",
      source: {
        type: "computed-generic",
        authority: "PromptDeck",
        title: "A4 균등 분할 계산 규격",
        url: null,
        verifiedAt: null,
        notes: "제조사 제품 규격이 아닙니다. 실제 용지의 인쇄 가능 영역과 재단 위치를 시험 출력으로 확인해야 합니다.",
      },
    };
  }

  const formtecManualUrl = "https://www.formtec.co.kr/software/software_manual.html?board=manual&id=27&kw=&kw_name=&mode=read&page=2";
  const formtecProductListUrl = "https://www.formtec.co.kr/product/product_list.html?cid=010103&colnum=&divpaper=&orderby=pname-asc";

  function formtecPreset(code, label, grid) {
    return {
      id: `formtec-${code.toLowerCase()}`,
      label: `폼텍 ${code} · ${label}`,
      category: "manufacturer-product",
      manufacturer: "한국폼텍",
      productCode: code,
      editable: false,
      page: { size: "A4", orientation: "portrait", widthMm: 210, heightMm: 297 },
      grid: Object.assign({}, grid, {
        gapXmm: roundMm(grid.pitchXmm - grid.labelWidthMm),
        gapYmm: roundMm(grid.pitchYmm - grid.labelHeightMm),
      }),
      duplexSuitable: false,
      duplexSuitability: "not-recommended",
      source: {
        type: "official-manufacturer",
        authority: "한국폼텍",
        title: "폼텍 라벨 위치 조정방법 및 주소용 라벨 제품 목록",
        url: formtecManualUrl,
        relatedUrl: formtecProductListUrl,
        verifiedAt: "2026-08-10",
        notes: "위치·피치·라벨 크기는 공식 소프트웨어 매뉴얼, 칸 수는 공식 제품 목록과 대조했습니다. 접착식 라벨이므로 양면 출력 비권장입니다.",
      },
    };
  }

  const presetList = [
    createGenericGrid({
      id: "custom-a4-portrait",
      label: "A4 사용자 지정 (세로)",
      category: "custom",
      orientation: "portrait",
      columns: 3,
      rows: 8,
      editable: true,
    }),
    createGenericGrid({
      id: "custom-a4-landscape",
      label: "A4 사용자 지정 (가로)",
      category: "custom",
      orientation: "landscape",
      columns: 8,
      rows: 3,
      editable: true,
    }),
    createGenericGrid({
      id: "generic-a4-2x4-portrait",
      label: "A4 범용 2×4 (세로)",
      orientation: "portrait",
      columns: 2,
      rows: 4,
    }),
    createGenericGrid({
      id: "generic-a4-3x8-portrait",
      label: "A4 범용 3×8 (세로)",
      orientation: "portrait",
      columns: 3,
      rows: 8,
    }),
    createGenericGrid({
      id: "generic-a4-4x10-portrait",
      label: "A4 범용 4×10 (세로)",
      orientation: "portrait",
      columns: 4,
      rows: 10,
    }),
    formtecPreset("LS-3106", "24칸", {
      columns: 3,
      rows: 8,
      offsetTopMm: 12.5,
      offsetLeftMm: 6.5,
      labelWidthMm: 64,
      labelHeightMm: 33.9,
      pitchXmm: 66.5,
      pitchYmm: 33.9,
    }),
    formtecPreset("LS-3107", "16칸", {
      columns: 2,
      rows: 8,
      offsetTopMm: 14.2,
      offsetLeftMm: 4.7,
      labelWidthMm: 99.1,
      labelHeightMm: 33.9,
      pitchXmm: 101.6,
      pitchYmm: 33.9,
    }),
    formtecPreset("LS-3108", "14칸", {
      columns: 2,
      rows: 7,
      offsetTopMm: 13.8,
      offsetLeftMm: 5,
      labelWidthMm: 99.1,
      labelHeightMm: 38.1,
      pitchXmm: 101.6,
      pitchYmm: 38.1,
    }),
    formtecPreset("LS-3109", "18칸", {
      columns: 2,
      rows: 9,
      offsetTopMm: 13.5,
      offsetLeftMm: 3.7,
      labelWidthMm: 100,
      labelHeightMm: 29.9,
      pitchXmm: 102.5,
      pitchYmm: 29.9,
    }),
  ];

  const registry = {};
  presetList.forEach((preset) => {
    registry[preset.id] = deepFreeze(preset);
  });
  deepFreeze(registry);

  function list(options) {
    const filter = options && typeof options === "object" ? options : {};
    return Object.keys(registry)
      .map((id) => registry[id])
      .filter((preset) => !filter.category || preset.category === filter.category)
      .filter((preset) => !filter.orientation || preset.page.orientation === filter.orientation)
      .map(clone);
  }

  function get(id) {
    return registry[String(id || "")] ? clone(registry[String(id)]) : null;
  }

  global.PromptDeckLabelSheetPresets = Object.freeze({
    VERSION: "1.0.0",
    A4,
    presets: registry,
    list,
    get,
    createGenericGrid,
  });
})(typeof window !== "undefined" ? window : globalThis);
