// PromptDeck 라벨·티켓 순수 도메인 엔진
//
// Public API: window.PromptDeckLabelSheetEngine
//
// Project/spec
//   createDefaultSpec(overrides?), normalizeSpec(input?), validateGeometry(spec)
//   createDefaultProject(overrides?), normalizeProject(input?)
//
// Data
//   mmToPx(mm, dpi?), formatSequence(value, options?), createSequenceRecords(options)
//   normalizeRecord(record, index?), parseTable(text, options?)
//   importRecords(existing, input, options?)
//
// Layout/duplex
//   slotToCell(slotIndex, spec), cellToSlot(row, column, spec)
//   paginateRecords(records, spec, options?)
//   transformBackSlot(slotIndex, spec, transform)
//   recommendBackTransform(orientation, flipEdge)
//   pairPrintPages(pagination, spec, options?)
//
// Output/validation
//   generatePromptBundle(project, options?), preflightProject(project, options?)
//   toSerializableProject(project), serializeProject(project, space?)
//   deserializeProject(jsonOrObject)
(function (global) {
  "use strict";

  const VERSION = "1.5.0";
  const SCHEMAS = Object.freeze({
    spec: "promptdeck-label-sheet-spec/1.0",
    project: "promptdeck-label-sheet-project/1.0",
    promptEntry: "promptdeck-label-prompt-entry/1.0",
    pagePrompt: "promptdeck-label-page-prompt/1.0",
  });
  const A4 = Object.freeze({
    portrait: Object.freeze({ widthMm: 210, heightMm: 297 }),
    landscape: Object.freeze({ widthMm: 297, heightMm: 210 }),
  });
  const IMPORT_MODES = Object.freeze(["replace", "append", "update-by-id"]);
  const FILL_ORDERS = Object.freeze(["row-major", "column-major"]);
  const BACK_TRANSFORMS = Object.freeze(["auto", "none", "mirrorX", "mirrorY", "rotate180"]);
  const FLIP_EDGES = Object.freeze(["long", "short"]);

  const DEFAULT_SPEC = Object.freeze({
    schema: SCHEMAS.spec,
    page: Object.freeze({ size: "A4", orientation: "portrait", widthMm: 210, heightMm: 297 }),
    grid: Object.freeze({
      rows: 8,
      columns: 3,
      labelWidthMm: 62,
      labelHeightMm: 32.875,
      offsetTopMm: 10,
      offsetLeftMm: 10,
      pitchXmm: 64,
      pitchYmm: 34.875,
      gapXmm: 2,
      gapYmm: 2,
    }),
    fillOrder: "row-major",
    firstSheetStartSlot: 0,
    firstSheetSkippedSlots: Object.freeze([]),
    dpi: 300,
    duplex: Object.freeze({
      enabled: false,
      flipEdge: "long",
      backTransform: "auto",
      offsetXmm: 0,
      offsetYmm: 0,
    }),
  });

  const HEADER_ALIASES = Object.freeze({
    id: "label_id",
    labelid: "label_id",
    label_id: "label_id",
    "라벨id": "label_id",
    "라벨_id": "label_id",
    "식별자": "label_id",
    no: "number",
    number: "number",
    "번호": "number",
    "순번": "number",
    name: "name",
    "이름": "name",
    title: "title",
    "제목": "title",
    subtitle: "subtitle",
    "부제": "subtitle",
    body: "body",
    content: "body",
    "본문": "body",
    "내용": "body",
    footer: "footer",
    "하단": "footer",
    "하단문구": "footer",
    date: "date",
    "날짜": "date",
    place: "place",
    location: "place",
    "장소": "place",
    category: "category",
    "구분": "category",
    qr: "qr_value",
    qr_value: "qr_value",
    qrcode: "qr_value",
    "qr값": "qr_value",
    background_file: "background_file",
    "배경파일": "background_file",
    background_prompt: "background_prompt",
    "배경프롬프트": "background_prompt",
    front_title: "front_title",
    "앞면제목": "front_title",
    front_subtitle: "front_subtitle",
    "앞면부제": "front_subtitle",
    front_body: "front_body",
    "앞면본문": "front_body",
    front_footer: "front_footer",
    "앞면하단문구": "front_footer",
    front_number: "front_number",
    "앞면번호": "front_number",
    front_qr_value: "front_qr_value",
    "앞면qr값": "front_qr_value",
    front_background_file: "front_background_file",
    "앞면배경파일": "front_background_file",
    front_background_prompt: "front_background_prompt",
    "앞면배경프롬프트": "front_background_prompt",
    back_title: "back_title",
    "뒷면제목": "back_title",
    back_subtitle: "back_subtitle",
    "뒷면부제": "back_subtitle",
    back_body: "back_body",
    "뒷면본문": "back_body",
    back_footer: "back_footer",
    "뒷면하단문구": "back_footer",
    back_number: "back_number",
    "뒷면번호": "back_number",
    back_qr_value: "back_qr_value",
    "뒷면qr값": "back_qr_value",
    back_background_file: "back_background_file",
    "뒷면배경파일": "back_background_file",
    back_background_prompt: "back_background_prompt",
    "뒷면배경프롬프트": "back_background_prompt",
  });

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function own(object, key) {
    return Boolean(object) && Object.prototype.hasOwnProperty.call(object, key);
  }

  function firstDefined(object, keys, fallback) {
    for (let index = 0; index < keys.length; index += 1) {
      if (own(object, keys[index]) && object[keys[index]] !== undefined && object[keys[index]] !== null) {
        return object[keys[index]];
      }
    }
    return fallback;
  }

  function finiteNumber(value, fallback) {
    if (value === "" || value === null || value === undefined) return fallback;
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function text(value, fallback) {
    if (value === undefined || value === null) return fallback == null ? "" : String(fallback);
    return String(value);
  }

  function trimmed(value, fallback) {
    return text(value, fallback).trim();
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function deepMerge(base, patch) {
    if (!isObject(base)) return isObject(patch) ? deepMerge({}, patch) : patch;
    const result = {};
    Object.keys(base).forEach((key) => {
      const value = base[key];
      result[key] = isObject(value) ? deepMerge(value, {}) : Array.isArray(value) ? value.slice() : value;
    });
    if (!isObject(patch)) return result;
    Object.keys(patch).forEach((key) => {
      const value = patch[key];
      result[key] = isObject(value) && isObject(result[key])
        ? deepMerge(result[key], value)
        : Array.isArray(value) ? value.slice() : value;
    });
    return result;
  }

  function makeId(prefix) {
    const cryptoApi = global.crypto;
    if (cryptoApi && typeof cryptoApi.randomUUID === "function") return `${prefix}${cryptoApi.randomUUID()}`;
    return `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function readOrientation(input) {
    const source = isObject(input) ? input : {};
    const page = isObject(source.page) ? source.page : {};
    return text(firstDefined(page, ["orientation"], firstDefined(source, ["orientation", "pageOrientation"], "portrait")));
  }

  function normalizeSlotList(input) {
    if (!Array.isArray(input)) return [];
    const seen = new Set();
    const slots = [];
    input.forEach((value) => {
      const slot = Number(value);
      if (!Number.isFinite(slot) || seen.has(slot)) return;
      seen.add(slot);
      slots.push(slot);
    });
    return slots;
  }

  function normalizeSpec(input) {
    const source = isObject(input) ? input : {};
    const pageInput = isObject(source.page) ? source.page : {};
    const gridInput = isObject(source.grid) ? source.grid : source;
    const marginInput = isObject(gridInput.margins) ? gridInput.margins : isObject(source.margins) ? source.margins : {};
    const duplexInput = isObject(source.duplex) ? source.duplex : {};
    const rawOrientation = readOrientation(source);
    const orientation = rawOrientation === "landscape" ? "landscape" : "portrait";
    const page = A4[orientation];
    const rows = finiteNumber(firstDefined(gridInput, ["rows"], 8), 8);
    const columns = finiteNumber(firstDefined(gridInput, ["columns", "cols"], 3), 3);
    const offsetTopMm = finiteNumber(
      firstDefined(gridInput, ["offsetTopMm", "topMm"], firstDefined(marginInput, ["top"], 10)),
      10,
    );
    const offsetLeftMm = finiteNumber(
      firstDefined(gridInput, ["offsetLeftMm", "leftMm"], firstDefined(marginInput, ["left"], 10)),
      10,
    );
    const marginRightMm = finiteNumber(firstDefined(marginInput, ["right"], offsetLeftMm), offsetLeftMm);
    const marginBottomMm = finiteNumber(firstDefined(marginInput, ["bottom"], offsetTopMm), offsetTopMm);
    const requestedGapX = finiteNumber(firstDefined(gridInput, ["gapXmm", "horizontalGapMm"], 2), 2);
    const requestedGapY = finiteNumber(firstDefined(gridInput, ["gapYmm", "verticalGapMm"], 2), 2);
    const safeColumns = Number.isFinite(columns) && columns > 0 ? columns : 1;
    const safeRows = Number.isFinite(rows) && rows > 0 ? rows : 1;
    const computedWidth = (page.widthMm - offsetLeftMm - marginRightMm - requestedGapX * (safeColumns - 1)) / safeColumns;
    const computedHeight = (page.heightMm - offsetTopMm - marginBottomMm - requestedGapY * (safeRows - 1)) / safeRows;
    const labelWidthMm = finiteNumber(firstDefined(gridInput, ["labelWidthMm", "widthMm"], computedWidth), computedWidth);
    const labelHeightMm = finiteNumber(firstDefined(gridInput, ["labelHeightMm", "heightMm"], computedHeight), computedHeight);
    const pitchXmm = finiteNumber(firstDefined(gridInput, ["pitchXmm", "horizontalPitchMm"], labelWidthMm + requestedGapX), labelWidthMm + requestedGapX);
    const pitchYmm = finiteNumber(firstDefined(gridInput, ["pitchYmm", "verticalPitchMm"], labelHeightMm + requestedGapY), labelHeightMm + requestedGapY);
    const rawFillOrder = text(firstDefined(source, ["fillOrder"], "row-major"));
    const fillOrder = FILL_ORDERS.includes(rawFillOrder) ? rawFillOrder : "row-major";
    const rawFlipEdge = text(firstDefined(duplexInput, ["flipEdge"], "long"));
    const flipEdge = FLIP_EDGES.includes(rawFlipEdge) ? rawFlipEdge : "long";
    const rawTransform = text(firstDefined(duplexInput, ["backTransform", "transform"], "auto"));
    const backTransform = BACK_TRANSFORMS.includes(rawTransform) ? rawTransform : "auto";

    return {
      schema: SCHEMAS.spec,
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
        offsetTopMm,
        offsetLeftMm,
        pitchXmm,
        pitchYmm,
        gapXmm: pitchXmm - labelWidthMm,
        gapYmm: pitchYmm - labelHeightMm,
      },
      fillOrder,
      firstSheetStartSlot: finiteNumber(firstDefined(source, ["firstSheetStartSlot", "startSlot"], 0), 0),
      firstSheetSkippedSlots: normalizeSlotList(firstDefined(source, ["firstSheetSkippedSlots", "skippedSlots"], [])),
      dpi: finiteNumber(firstDefined(source, ["dpi"], 300), 300),
      duplex: {
        enabled: Boolean(firstDefined(duplexInput, ["enabled"], false)),
        flipEdge,
        backTransform,
        offsetXmm: finiteNumber(firstDefined(duplexInput, ["offsetXmm"], 0), 0),
        offsetYmm: finiteNumber(firstDefined(duplexInput, ["offsetYmm"], 0), 0),
      },
    };
  }

  function createDefaultSpec(overrides) {
    return normalizeSpec(deepMerge(DEFAULT_SPEC, isObject(overrides) ? overrides : {}));
  }

  function issue(code, message, path, details) {
    const result = { code, message, path: path || "" };
    if (details !== undefined) result.details = details;
    return result;
  }

  function validateGeometry(input) {
    const raw = isObject(input) ? input : {};
    const spec = normalizeSpec(raw);
    const grid = spec.grid;
    const errors = [];
    const warnings = [];
    const rawOrientation = readOrientation(raw);
    const rawPage = isObject(raw.page) ? raw.page : {};
    const tolerance = 0.01;

    if (!Object.keys(A4).includes(rawOrientation)) {
      errors.push(issue("INVALID_ORIENTATION", "용지 방향은 portrait 또는 landscape여야 합니다.", "page.orientation"));
    }
    if (own(rawPage, "size") && text(rawPage.size).toUpperCase() !== "A4") {
      errors.push(issue("PAGE_SIZE_NOT_A4", "현재 엔진은 A4 용지만 지원합니다.", "page.size"));
    }
    if (own(rawPage, "widthMm") && Math.abs(finiteNumber(rawPage.widthMm, spec.page.widthMm) - spec.page.widthMm) > tolerance) {
      errors.push(issue("PAGE_WIDTH_NOT_A4", "용지 너비가 선택한 A4 방향과 일치하지 않습니다.", "page.widthMm"));
    }
    if (own(rawPage, "heightMm") && Math.abs(finiteNumber(rawPage.heightMm, spec.page.heightMm) - spec.page.heightMm) > tolerance) {
      errors.push(issue("PAGE_HEIGHT_NOT_A4", "용지 높이가 선택한 A4 방향과 일치하지 않습니다.", "page.heightMm"));
    }
    if (!Number.isInteger(grid.rows) || grid.rows < 1) {
      errors.push(issue("INVALID_ROWS", "세로 칸 수는 1 이상의 정수여야 합니다.", "grid.rows"));
    }
    if (!Number.isInteger(grid.columns) || grid.columns < 1) {
      errors.push(issue("INVALID_COLUMNS", "가로 칸 수는 1 이상의 정수여야 합니다.", "grid.columns"));
    }
    if (!(grid.labelWidthMm > 0)) {
      errors.push(issue("INVALID_LABEL_WIDTH", "라벨 너비는 0mm보다 커야 합니다.", "grid.labelWidthMm"));
    }
    if (!(grid.labelHeightMm > 0)) {
      errors.push(issue("INVALID_LABEL_HEIGHT", "라벨 높이는 0mm보다 커야 합니다.", "grid.labelHeightMm"));
    }
    if (!(grid.offsetLeftMm >= 0)) {
      errors.push(issue("INVALID_LEFT_OFFSET", "왼쪽 시작 위치는 0mm 이상이어야 합니다.", "grid.offsetLeftMm"));
    }
    if (!(grid.offsetTopMm >= 0)) {
      errors.push(issue("INVALID_TOP_OFFSET", "위쪽 시작 위치는 0mm 이상이어야 합니다.", "grid.offsetTopMm"));
    }
    if (!(grid.pitchXmm >= grid.labelWidthMm)) {
      errors.push(issue("NEGATIVE_HORIZONTAL_GAP", "가로 피치는 라벨 너비보다 작을 수 없습니다.", "grid.pitchXmm"));
    }
    if (!(grid.pitchYmm >= grid.labelHeightMm)) {
      errors.push(issue("NEGATIVE_VERTICAL_GAP", "세로 피치는 라벨 높이보다 작을 수 없습니다.", "grid.pitchYmm"));
    }
    if (!FILL_ORDERS.includes(text(firstDefined(raw, ["fillOrder"], "row-major")))) {
      errors.push(issue("INVALID_FILL_ORDER", "채움 순서는 row-major 또는 column-major여야 합니다.", "fillOrder"));
    }

    const integerRows = Number.isInteger(grid.rows) && grid.rows > 0 ? grid.rows : 0;
    const integerColumns = Number.isInteger(grid.columns) && grid.columns > 0 ? grid.columns : 0;
    const capacity = integerRows * integerColumns;
    const gridRightMm = integerColumns > 0
      ? grid.offsetLeftMm + (integerColumns - 1) * grid.pitchXmm + grid.labelWidthMm
      : NaN;
    const gridBottomMm = integerRows > 0
      ? grid.offsetTopMm + (integerRows - 1) * grid.pitchYmm + grid.labelHeightMm
      : NaN;

    if (Number.isFinite(gridRightMm) && gridRightMm > spec.page.widthMm + tolerance) {
      errors.push(issue("GRID_EXCEEDS_PAGE_WIDTH", "라벨 격자가 A4 너비를 벗어납니다.", "grid", { gridRightMm, pageWidthMm: spec.page.widthMm }));
    }
    if (Number.isFinite(gridBottomMm) && gridBottomMm > spec.page.heightMm + tolerance) {
      errors.push(issue("GRID_EXCEEDS_PAGE_HEIGHT", "라벨 격자가 A4 높이를 벗어납니다.", "grid", { gridBottomMm, pageHeightMm: spec.page.heightMm }));
    }
    if (!Number.isInteger(spec.firstSheetStartSlot) || spec.firstSheetStartSlot < 0 || (capacity > 0 && spec.firstSheetStartSlot >= capacity)) {
      errors.push(issue("INVALID_FIRST_SHEET_SLOT", "첫 장 시작 칸은 용지의 유효한 0 기반 칸 번호여야 합니다.", "firstSheetStartSlot"));
    }
    const rawSkippedSlots = own(raw, "firstSheetSkippedSlots")
      ? raw.firstSheetSkippedSlots
      : own(raw, "skippedSlots") ? raw.skippedSlots : spec.firstSheetSkippedSlots;
    if (!Array.isArray(rawSkippedSlots)) {
      errors.push(issue("INVALID_FIRST_SHEET_SKIPPED_SLOTS", "첫 장 건너뜀 칸은 0 기반 칸 번호 배열이어야 합니다.", "firstSheetSkippedSlots"));
    } else {
      const seenSkippedSlots = new Set();
      rawSkippedSlots.forEach((value, index) => {
        const slot = Number(value);
        if (!Number.isInteger(slot) || slot < 0 || (capacity > 0 && slot >= capacity)) {
          errors.push(issue(
            "INVALID_FIRST_SHEET_SKIPPED_SLOT",
            "첫 장 건너뜀 칸에는 용지의 유효한 0 기반 정수 칸 번호만 사용할 수 있습니다.",
            `firstSheetSkippedSlots[${index}]`,
            { value },
          ));
          return;
        }
        if (seenSkippedSlots.has(slot)) {
          warnings.push(issue(
            "DUPLICATE_FIRST_SHEET_SKIPPED_SLOT",
            `첫 장 건너뜀 칸 ${slot}이 중복되어 한 번만 적용됩니다.`,
            `firstSheetSkippedSlots[${index}]`,
            { slot },
          ));
        }
        seenSkippedSlots.add(slot);
      });
      if (capacity > 0 && Number.isInteger(spec.firstSheetStartSlot)) {
        const usableFirstSlots = fillSlotOrder(spec)
          .slice(Math.max(0, fillSlotOrder(spec).indexOf(spec.firstSheetStartSlot)))
          .filter((slot) => !seenSkippedSlots.has(slot));
        if (usableFirstSlots.length === 0) {
          warnings.push(issue(
            "FIRST_SHEET_HAS_NO_USABLE_SLOTS",
            "첫 장에서 시작 칸 이후의 모든 칸을 건너뜁니다. 데이터는 다음 용지부터 배치됩니다.",
            "firstSheetSkippedSlots",
          ));
        }
      }
    }
    if (!(spec.dpi > 0)) {
      errors.push(issue("INVALID_DPI", "출력 DPI는 0보다 커야 합니다.", "dpi"));
    } else if (spec.dpi < 150) {
      warnings.push(issue("LOW_DPI", "150dpi 미만에서는 작은 글자와 QR의 인쇄 품질이 낮을 수 있습니다.", "dpi"));
    } else if (spec.dpi > 1200) {
      warnings.push(issue("VERY_HIGH_DPI", "1200dpi를 넘는 설정은 브라우저 메모리를 과도하게 사용할 수 있습니다.", "dpi"));
    }
    if (capacity > 400) {
      warnings.push(issue("HIGH_CELL_COUNT", "한 장의 칸 수가 많아 미리보기와 이미지 처리 속도가 느려질 수 있습니다.", "grid"));
    }

    return {
      valid: errors.length === 0,
      spec,
      errors,
      warnings,
      metrics: {
        capacity,
        pageWidthMm: spec.page.widthMm,
        pageHeightMm: spec.page.heightMm,
        gridRightMm,
        gridBottomMm,
        rightMarginMm: Number.isFinite(gridRightMm) ? spec.page.widthMm - gridRightMm : NaN,
        bottomMarginMm: Number.isFinite(gridBottomMm) ? spec.page.heightMm - gridBottomMm : NaN,
        labelWidthPx: mmToPx(grid.labelWidthMm, spec.dpi),
        labelHeightPx: mmToPx(grid.labelHeightMm, spec.dpi),
      },
    };
  }

  function mmToPx(mm, dpi) {
    const millimetres = finiteNumber(mm, NaN);
    const resolution = finiteNumber(dpi, 300);
    return Number.isFinite(millimetres) && Number.isFinite(resolution)
      ? millimetres / 25.4 * resolution
      : NaN;
  }

  function formatSequence(value, options) {
    const input = isObject(options) ? options : {};
    const prefix = text(input.prefix);
    const suffix = text(input.suffix);
    const padding = Math.max(0, Math.trunc(finiteNumber(input.padding, 0)));
    const number = Number(value);
    let core;
    if (Number.isFinite(number) && Number.isInteger(number)) {
      const sign = number < 0 ? "-" : "";
      core = `${sign}${String(Math.abs(number)).padStart(padding, "0")}`;
    } else {
      core = text(value);
      if (padding > 0) core = core.padStart(padding, "0");
    }
    return `${prefix}${core}${suffix}`;
  }

  function normalizeFit(value) {
    return value === "contain" ? "contain" : "cover";
  }

  function normalizeTextOrientation(value) {
    return ["horizontal", "vertical", "vertical-upright"].includes(value) ? value : "auto";
  }

  function normalizeFocalPoint(value) {
    const input = isObject(value) ? value : {};
    return {
      x: clamp(finiteNumber(input.x, 0.5), 0, 1),
      y: clamp(finiteNumber(input.y, 0.5), 0, 1),
    };
  }

  function normalizeBackgroundCrop(value) {
    if (!isObject(value)) return null;
    const x = clamp(finiteNumber(firstDefined(value, ["x", "left"], 0), 0), 0, 0.9999);
    const y = clamp(finiteNumber(firstDefined(value, ["y", "top"], 0), 0), 0, 0.9999);
    const width = clamp(finiteNumber(firstDefined(value, ["width"], 1 - x), 1 - x), 0.0001, Math.max(0.0001, 1 - x));
    const height = clamp(finiteNumber(firstDefined(value, ["height"], 1 - y), 1 - y), 0.0001, Math.max(0.0001, 1 - y));
    return { x, y, width, height };
  }

  function sideHasOwnContent(side) {
    if (!isObject(side)) return false;
    const keys = ["title", "subtitle", "body", "footer", "number", "qrValue", "backgroundAssetId", "backgroundFile", "backgroundPrompt"];
    return keys.some((key) => trimmed(side[key]) !== "");
  }

  function normalizeSide(record, sideName, commonNumber) {
    const nested = isObject(record[sideName]) ? record[sideName] : {};
    const isFront = sideName === "front";
    const sidePrefix = `${sideName}_`;
    const generic = isFront;
    const titleValue = firstDefined(record, [`${sidePrefix}title`], generic ? firstDefined(record, ["title", "제목"], nested.title) : nested.title);
    const subtitleValue = firstDefined(record, [`${sidePrefix}subtitle`], generic ? firstDefined(record, ["subtitle", "부제"], nested.subtitle) : nested.subtitle);
    const bodyValue = firstDefined(record, [`${sidePrefix}body`], generic ? firstDefined(record, ["body", "content", "본문", "내용"], nested.body) : nested.body);
    const footerValue = firstDefined(record, [`${sidePrefix}footer`], generic ? firstDefined(record, ["footer", "하단문구"], nested.footer) : nested.footer);
    const explicitNumberValue = firstDefined(record, [`${sidePrefix}number`], nested.number);
    const numberValue = explicitNumberValue === undefined || explicitNumberValue === null ? commonNumber : explicitNumberValue;
    const qrValue = firstDefined(record, [`${sidePrefix}qr_value`, `${sidePrefix}qrValue`], generic ? firstDefined(record, ["qr_value", "qrValue"], nested.qrValue) : nested.qrValue);
    const backgroundAssetId = firstDefined(record, [`${sidePrefix}background_asset_id`, `${sidePrefix}backgroundAssetId`], generic ? firstDefined(record, ["background_asset_id", "backgroundAssetId"], nested.backgroundAssetId) : nested.backgroundAssetId);
    const backgroundFile = firstDefined(record, [`${sidePrefix}background_file`, `${sidePrefix}backgroundFile`], generic ? firstDefined(record, ["background_file", "backgroundFile"], nested.backgroundFile) : nested.backgroundFile);
    const backgroundPrompt = firstDefined(record, [`${sidePrefix}background_prompt`, `${sidePrefix}backgroundPrompt`], generic ? firstDefined(record, ["background_prompt", "backgroundPrompt"], nested.backgroundPrompt) : nested.backgroundPrompt);
    const imageFit = firstDefined(record, [`${sidePrefix}image_fit`, `${sidePrefix}imageFit`], generic ? firstDefined(record, ["image_fit", "imageFit"], nested.imageFit) : nested.imageFit);
    const focalPoint = firstDefined(record, [`${sidePrefix}focal_point`, `${sidePrefix}focalPoint`], nested.focalPoint);
    const backgroundCrop = firstDefined(record, [`${sidePrefix}background_crop`, `${sidePrefix}backgroundCrop`], generic ? firstDefined(record, ["background_crop", "backgroundCrop"], nested.backgroundCrop) : nested.backgroundCrop);
    const orientation = firstDefined(record, [`${sidePrefix}text_orientation`, `${sidePrefix}textOrientation`], nested.textOrientation);
    const draft = {
      title: text(titleValue),
      subtitle: text(subtitleValue),
      body: text(bodyValue),
      footer: text(footerValue),
      number: text(numberValue),
      qrValue: text(qrValue),
      backgroundAssetId: text(backgroundAssetId),
      backgroundFile: text(backgroundFile),
      backgroundPrompt: text(backgroundPrompt),
    };
    const contentProbe = isFront ? draft : Object.assign({}, draft, { number: text(explicitNumberValue) });
    const ownContent = sideHasOwnContent(contentProbe);
    const enabledDefault = isFront || ownContent;

    return {
      enabled: own(nested, "enabled") ? Boolean(nested.enabled) : own(record, `${sidePrefix}enabled`) ? Boolean(record[`${sidePrefix}enabled`]) : enabledDefault,
      title: draft.title,
      subtitle: draft.subtitle,
      body: draft.body,
      footer: draft.footer,
      number: draft.number,
      qrValue: draft.qrValue,
      backgroundAssetId: draft.backgroundAssetId,
      backgroundFile: draft.backgroundFile,
      backgroundPrompt: draft.backgroundPrompt,
      imageFit: normalizeFit(text(imageFit || "cover")),
      focalPoint: normalizeFocalPoint(focalPoint),
      backgroundCrop: normalizeBackgroundCrop(backgroundCrop),
      textOrientation: normalizeTextOrientation(text(orientation || "auto")),
    };
  }

  function normalizeRecord(input, index) {
    const record = isObject(input) ? input : { title: input };
    const position = Math.max(0, Math.trunc(finiteNumber(index, 0)));
    const idValue = firstDefined(record, ["id", "label_id", "labelId", "식별자"], `label-${position + 1}`);
    const numberValue = firstDefined(record, ["number", "번호", "순번"], "");
    const data = isObject(record.data) ? deepMerge({}, record.data) : {};
    Object.keys(record).forEach((key) => {
      if (!["front", "back", "data"].includes(key)) data[key] = record[key];
    });
    const normalized = {
      id: trimmed(idValue) || `label-${position + 1}`,
      number: text(numberValue),
      data,
      front: normalizeSide(record, "front", numberValue),
      back: normalizeSide(record, "back", numberValue),
    };
    return normalized;
  }

  function createSequenceRecords(options) {
    const input = isObject(options) ? options : {};
    const start = Math.trunc(finiteNumber(input.start, 1));
    const end = Math.trunc(finiteNumber(input.end, start));
    const defaultStep = end >= start ? 1 : -1;
    const step = Math.trunc(finiteNumber(input.step, defaultStep));
    if (step === 0) throw new RangeError("연속번호 간격(step)은 0일 수 없습니다.");
    if ((end - start) * step < 0) throw new RangeError("연속번호 간격(step)의 방향이 시작번호와 끝번호에 맞지 않습니다.");
    const count = Math.floor(Math.abs((end - start) / step)) + 1;
    if (count > 100000) throw new RangeError("한 번에 만들 수 있는 연속번호는 100,000개 이하입니다.");
    const records = [];
    const template = isObject(input.template) ? input.template : {};
    const idPrefix = text(input.idPrefix, "label-");
    const includeNumber = input.includeNumber !== false;
    let value = start;
    for (let index = 0; index < count; index += 1) {
      const formatted = formatSequence(value, input);
      const raw = deepMerge(template, {
        id: `${idPrefix}${value}`,
        number: includeNumber ? formatted : "",
      });
      records.push(normalizeRecord(raw, index));
      value += step;
    }
    return records;
  }

  function canonicalHeader(value, index) {
    const raw = trimmed(value).replace(/^\uFEFF/, "");
    const compact = raw.toLowerCase().replace(/[\s-]+/g, "_");
    const aliasKey = compact.replace(/_/g, "");
    if (own(HEADER_ALIASES, compact)) return HEADER_ALIASES[compact];
    if (own(HEADER_ALIASES, aliasKey)) return HEADER_ALIASES[aliasKey];
    return compact || `column_${index + 1}`;
  }

  function dedupeHeaders(values) {
    const seen = new Map();
    return values.map((value, index) => {
      const base = canonicalHeader(value, index);
      const count = (seen.get(base) || 0) + 1;
      seen.set(base, count);
      return count === 1 ? base : `${base}_${count}`;
    });
  }

  function parseDelimitedRows(source, delimiter) {
    const rows = [];
    const errors = [];
    let row = [];
    let field = "";
    let quoted = false;
    let index = 0;
    const textSource = text(source).replace(/^\uFEFF/, "");

    while (index < textSource.length) {
      const character = textSource[index];
      if (quoted) {
        if (character === '"') {
          if (textSource[index + 1] === '"') {
            field += '"';
            index += 2;
            continue;
          }
          quoted = false;
          index += 1;
          continue;
        }
        field += character;
        index += 1;
        continue;
      }
      if (character === '"' && field === "") {
        quoted = true;
        index += 1;
        continue;
      }
      if (delimiter && character === delimiter) {
        row.push(field);
        field = "";
        index += 1;
        continue;
      }
      if (character === "\r" || character === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        if (character === "\r" && textSource[index + 1] === "\n") index += 2;
        else index += 1;
        continue;
      }
      field += character;
      index += 1;
    }
    if (quoted) errors.push(issue("UNCLOSED_QUOTE", "따옴표로 감싼 필드가 닫히지 않았습니다.", "source"));
    if (field !== "" || row.length > 0 || textSource.length > 0) {
      row.push(field);
      rows.push(row);
    }
    while (rows.length > 0 && rows[rows.length - 1].every((value) => value === "")) rows.pop();
    return { rows, errors };
  }

  function delimiterScore(source, delimiter) {
    const parsed = parseDelimitedRows(source, delimiter).rows.filter((row) => row.some((value) => trimmed(value) !== ""));
    if (!parsed.length) return { delimiter, score: -1, width: 0 };
    const widths = parsed.slice(0, 25).map((row) => row.length);
    const maximum = Math.max.apply(null, widths);
    if (maximum <= 1) return { delimiter, score: 0, width: maximum };
    const matching = widths.filter((width) => width === maximum).length;
    return { delimiter, score: maximum * 10 + matching, width: maximum };
  }

  function detectDelimiter(source) {
    const candidates = ["\t", ",", ";"].map((delimiter) => delimiterScore(source, delimiter));
    candidates.sort((left, right) => right.score - left.score);
    return candidates[0].score > 0 ? candidates[0].delimiter : null;
  }

  function detectedHeader(row) {
    if (!Array.isArray(row) || !row.length) return false;
    const recognized = row.filter((value, index) => canonicalHeader(value, index) !== `column_${index + 1}` && own(HEADER_ALIASES, trimmed(value).toLowerCase().replace(/[\s-]+/g, "_"))).length;
    if (recognized > 0) return true;
    const canonical = row.map(canonicalHeader);
    const semantic = canonical.filter((value) => ["label_id", "number", "name", "title", "subtitle", "body", "footer", "date", "place", "category", "qr_value"].includes(value));
    return semantic.length > 0;
  }

  function parseTable(source, options) {
    const input = isObject(options) ? options : {};
    const rawText = text(source).replace(/^\uFEFF/, "");
    const delimiterOption = input.delimiter == null ? "auto" : input.delimiter;
    const delimiter = delimiterOption === "auto"
      ? detectDelimiter(rawText)
      : delimiterOption === "newline" || delimiterOption === "" ? null : String(delimiterOption);
    const parsed = parseDelimitedRows(rawText, delimiter);
    const nonEmptyRows = parsed.rows.filter((row) => row.some((value) => trimmed(value) !== ""));
    const headerOption = ["present", "absent"].includes(input.header) ? input.header : "auto";
    const hasHeader = headerOption === "present" || (headerOption === "auto" && detectedHeader(nonEmptyRows[0]));
    const sourceHeaders = hasHeader
      ? (nonEmptyRows[0] || [])
      : Array.isArray(input.columns) && input.columns.length ? input.columns : [];
    const dataRows = hasHeader ? nonEmptyRows.slice(1) : nonEmptyRows;
    const width = Math.max(sourceHeaders.length, ...dataRows.map((row) => row.length), delimiter ? 0 : 1);
    const defaultHeaders = width === 1
      ? ["title"]
      : Array.from({ length: width }, (_, index) => `column_${index + 1}`);
    const headers = dedupeHeaders(sourceHeaders.length ? sourceHeaders : defaultHeaders);
    while (headers.length < width) headers.push(`column_${headers.length + 1}`);
    const warnings = [];
    const objects = dataRows.map((row, rowIndex) => {
      if (row.length !== headers.length) {
        warnings.push(issue(
          "COLUMN_COUNT_MISMATCH",
          `${rowIndex + (hasHeader ? 2 : 1)}행의 열 수가 ${headers.length}개 헤더와 일치하지 않습니다.`,
          `rows[${rowIndex}]`,
          { expected: headers.length, actual: row.length },
        ));
      }
      const object = {};
      headers.forEach((header, columnIndex) => {
        object[header] = row[columnIndex] === undefined ? "" : row[columnIndex];
      });
      return object;
    });

    return {
      delimiter: delimiter || "newline",
      hasHeader,
      originalHeaders: sourceHeaders.map((value) => text(value)),
      headers,
      rows: dataRows.map((row) => row.slice()),
      objects,
      errors: parsed.errors,
      warnings,
    };
  }

  function mergeRawIntoRecord(existing, incoming, index) {
    const raw = isObject(incoming) ? incoming : {};
    const combined = deepMerge(existing, raw);
    if (isObject(existing.front) && isObject(raw.front)) combined.front = deepMerge(existing.front, raw.front);
    if (isObject(existing.back) && isObject(raw.back)) combined.back = deepMerge(existing.back, raw.back);
    return normalizeRecord(combined, index);
  }

  function importRecords(existing, input, options) {
    const current = Array.isArray(existing) ? existing.map(normalizeRecord) : [];
    const config = isObject(options) ? options : {};
    const mode = IMPORT_MODES.includes(config.mode) ? config.mode : "replace";
    const idField = trimmed(config.idField, "label_id") || "label_id";
    const parsed = typeof input === "string" ? parseTable(input, config.parseOptions) : null;
    const incoming = parsed ? parsed.objects : Array.isArray(input) ? input : isObject(input) && Array.isArray(input.objects) ? input.objects : [];
    const errors = parsed ? parsed.errors.slice() : [];
    const warnings = parsed ? parsed.warnings.slice() : [];
    let records = [];
    let added = 0;
    let updated = 0;
    let skipped = 0;

    if (mode === "replace") {
      records = incoming.map((record, index) => normalizeRecord(record, index));
      added = records.length;
    } else if (mode === "append") {
      records = current.slice();
      const baseLength = records.length;
      incoming.forEach((record, index) => {
        records.push(normalizeRecord(record, baseLength + index));
        added += 1;
      });
    } else {
      records = current.slice();
      const indexById = new Map();
      records.forEach((record, index) => {
        if (!indexById.has(record.id)) indexById.set(record.id, index);
      });
      incoming.forEach((rawRecord, incomingIndex) => {
        const raw = isObject(rawRecord) ? rawRecord : {};
        const id = trimmed(firstDefined(raw, [idField, "label_id", "labelId", "id"], ""));
        if (!id) {
          errors.push(issue("UPDATE_ID_REQUIRED", "ID 기준 업데이트에는 각 행의 label_id가 필요합니다.", `incoming[${incomingIndex}]`));
          skipped += 1;
          return;
        }
        if (!indexById.has(id)) {
          warnings.push(issue("UPDATE_ID_NOT_FOUND", `기존 데이터에서 ${id}를 찾지 못해 건너뛰었습니다.`, `incoming[${incomingIndex}]`, { id }));
          skipped += 1;
          return;
        }
        const recordIndex = indexById.get(id);
        records[recordIndex] = mergeRawIntoRecord(records[recordIndex], raw, recordIndex);
        updated += 1;
      });
    }

    const seen = new Set();
    records.forEach((record, index) => {
      if (seen.has(record.id)) {
        warnings.push(issue("DUPLICATE_ID_AFTER_IMPORT", `가져오기 결과에 중복 ID ${record.id}가 있습니다.`, `records[${index}].id`, { id: record.id }));
      }
      seen.add(record.id);
    });

    return { records, added, updated, skipped, errors, warnings, parsed };
  }

  function createDefaultProject(overrides) {
    const timestamp = nowIso();
    const base = {
      schema: SCHEMAS.project,
      version: 1,
      id: makeId("label-project-"),
      name: "새 라벨·티켓 프로젝트",
      createdAt: timestamp,
      updatedAt: timestamp,
      spec: createDefaultSpec(),
      records: [],
      assets: [],
      settings: {
        documentType: "label",
        outputGoal: "print",
        requireBackgrounds: false,
        sequenceMode: "sequence",
        textContrast: "auto",
        qrEnabledForPrint: false,
      },
    };
    return normalizeProject(deepMerge(base, isObject(overrides) ? overrides : {}));
  }

  function normalizeProject(input) {
    const source = isObject(input) ? input : {};
    const documentType = ["label", "ticket", "admission", "meal-ticket"].includes(source.settings && source.settings.documentType)
      ? source.settings.documentType
      : "label";
    const outputGoal = ["print", "prompt", "both"].includes(source.settings && source.settings.outputGoal)
      ? source.settings.outputGoal
      : "print";
    return {
      schema: SCHEMAS.project,
      version: 1,
      id: trimmed(source.id) || makeId("label-project-"),
      name: text(source.name, "새 라벨·티켓 프로젝트"),
      createdAt: text(source.createdAt, nowIso()),
      updatedAt: text(source.updatedAt, nowIso()),
      spec: normalizeSpec(source.spec),
      records: Array.isArray(source.records) ? source.records.map(normalizeRecord) : [],
      assets: Array.isArray(source.assets) ? source.assets.slice() : [],
      settings: {
        ...deepMerge({ documentType, outputGoal, requireBackgrounds: false }, isObject(source.settings) ? source.settings : {}),
        documentType,
        outputGoal,
      },
    };
  }

  function geometryIntegers(spec) {
    const normalized = normalizeSpec(spec);
    const rows = Math.max(0, Math.trunc(normalized.grid.rows));
    const columns = Math.max(0, Math.trunc(normalized.grid.columns));
    return { spec: normalized, rows, columns, capacity: rows * columns };
  }

  function slotToCell(slotIndex, spec) {
    const geometry = geometryIntegers(spec);
    const slot = Math.trunc(finiteNumber(slotIndex, -1));
    if (slot < 0 || slot >= geometry.capacity || geometry.columns === 0) return null;
    return { slotIndex: slot, row: Math.floor(slot / geometry.columns), column: slot % geometry.columns };
  }

  function cellToSlot(row, column, spec) {
    const geometry = geometryIntegers(spec);
    const rowIndex = Math.trunc(finiteNumber(row, -1));
    const columnIndex = Math.trunc(finiteNumber(column, -1));
    if (rowIndex < 0 || rowIndex >= geometry.rows || columnIndex < 0 || columnIndex >= geometry.columns) return -1;
    return rowIndex * geometry.columns + columnIndex;
  }

  function fillSlotOrder(spec) {
    const geometry = geometryIntegers(spec);
    const slots = [];
    if (geometry.spec.fillOrder === "column-major") {
      for (let column = 0; column < geometry.columns; column += 1) {
        for (let row = 0; row < geometry.rows; row += 1) slots.push(cellToSlot(row, column, geometry.spec));
      }
    } else {
      for (let slot = 0; slot < geometry.capacity; slot += 1) slots.push(slot);
    }
    return slots;
  }

  function rectForCell(cell, spec) {
    return {
      xMm: spec.grid.offsetLeftMm + cell.column * spec.grid.pitchXmm,
      yMm: spec.grid.offsetTopMm + cell.row * spec.grid.pitchYmm,
      widthMm: spec.grid.labelWidthMm,
      heightMm: spec.grid.labelHeightMm,
    };
  }

  function paginateRecords(inputRecords, inputSpec, options) {
    const spec = normalizeSpec(inputSpec);
    const geometry = geometryIntegers(spec);
    const records = Array.isArray(inputRecords) ? inputRecords.map(normalizeRecord) : [];
    const config = isObject(options) ? options : {};
    const requestedStart = finiteNumber(firstDefined(config, ["firstSheetStartSlot"], spec.firstSheetStartSlot), 0);
    const firstSheetStartSlot = Number.isInteger(requestedStart) && requestedStart >= 0 && requestedStart < geometry.capacity
      ? requestedStart
      : 0;
    const requestedSkippedSlots = own(config, "firstSheetSkippedSlots")
      ? config.firstSheetSkippedSlots
      : spec.firstSheetSkippedSlots;
    const firstSheetSkippedSlots = normalizeSlotList(requestedSkippedSlots)
      .filter((slot) => Number.isInteger(slot) && slot >= 0 && slot < geometry.capacity);
    const firstSheetSkippedSet = new Set(firstSheetSkippedSlots);
    const order = fillSlotOrder(spec);
    const firstOrderIndex = Math.max(0, order.indexOf(firstSheetStartSlot));
    const pages = [];
    let recordIndex = 0;
    let sheetIndex = 0;

    while (recordIndex < records.length && geometry.capacity > 0) {
      const availableSlots = sheetIndex === 0
        ? order.slice(firstOrderIndex).filter((slot) => !firstSheetSkippedSet.has(slot))
        : order;
      const slots = Array.from({ length: geometry.capacity }, () => null);
      const recordStartIndex = recordIndex;
      for (let index = 0; index < availableSlots.length && recordIndex < records.length; index += 1) {
        const slotIndex = availableSlots[index];
        const cell = slotToCell(slotIndex, spec);
        const record = records[recordIndex];
        slots[slotIndex] = {
          slotIndex,
          row: cell.row,
          column: cell.column,
          rectMm: rectForCell(cell, spec),
          recordIndex,
          recordId: record.id,
          record,
        };
        recordIndex += 1;
      }
      pages.push({
        sheetIndex,
        pageNumber: sheetIndex + 1,
        slots,
        skippedSlotIndices: sheetIndex === 0 ? firstSheetSkippedSlots.slice() : [],
        recordStartIndex,
        recordEndIndex: recordIndex - 1,
      });
      sheetIndex += 1;
    }

    return {
      spec,
      paper: Object.assign({}, spec.page),
      capacity: geometry.capacity,
      totalRecords: records.length,
      totalSheets: pages.length,
      firstSheetStartSlot,
      firstSheetSkippedSlots: firstSheetSkippedSlots.slice(),
      pages,
    };
  }

  function recommendBackTransform(orientation, flipEdge) {
    const pageOrientation = orientation === "landscape" ? "landscape" : "portrait";
    const edge = flipEdge === "short" ? "short" : "long";
    if (pageOrientation === "portrait") return edge === "long" ? "mirrorX" : "mirrorY";
    return edge === "long" ? "mirrorY" : "mirrorX";
  }

  function transformBackSlot(slotIndex, inputSpec, transform) {
    const spec = normalizeSpec(inputSpec);
    const cell = slotToCell(slotIndex, spec);
    if (!cell) return null;
    const requested = BACK_TRANSFORMS.includes(transform) ? transform : spec.duplex.backTransform;
    const resolved = requested === "auto"
      ? recommendBackTransform(spec.page.orientation, spec.duplex.flipEdge)
      : requested;
    let row = cell.row;
    let column = cell.column;
    if (resolved === "mirrorX" || resolved === "rotate180") column = spec.grid.columns - 1 - column;
    if (resolved === "mirrorY" || resolved === "rotate180") row = spec.grid.rows - 1 - row;
    return {
      slotIndex: cellToSlot(row, column, spec),
      row,
      column,
      transform: resolved,
      sourceSlotIndex: cell.slotIndex,
    };
  }

  function pairPrintPages(paginationInput, inputSpec, options) {
    const config = isObject(options) ? options : {};
    const pagination = paginationInput && Array.isArray(paginationInput.pages)
      ? paginationInput
      : paginateRecords([], inputSpec);
    const spec = normalizeSpec(inputSpec || pagination.spec);
    const duplexEnabled = own(config, "duplexEnabled") ? Boolean(config.duplexEnabled) : spec.duplex.enabled;
    const includeBlankBacks = own(config, "includeBlankBacks") ? Boolean(config.includeBlankBacks) : true;
    const requestedTransform = BACK_TRANSFORMS.includes(config.transform) ? config.transform : spec.duplex.backTransform;
    const resolvedTransform = requestedTransform === "auto"
      ? recommendBackTransform(spec.page.orientation, spec.duplex.flipEdge)
      : requestedTransform;
    const pages = [];

    pagination.pages.forEach((sheet) => {
      const frontSlots = sheet.slots.map((assignment) => assignment ? Object.assign({}, assignment, { side: "front" }) : null);
      pages.push({
        printPageIndex: pages.length,
        pageNumber: pages.length + 1,
        sheetIndex: sheet.sheetIndex,
        side: "front",
        transform: "none",
        offsetXmm: 0,
        offsetYmm: 0,
        slots: frontSlots,
      });
      if (!duplexEnabled) return;

      const backSlots = Array.from({ length: pagination.capacity }, () => null);
      let backHasContent = false;
      sheet.slots.forEach((assignment) => {
        if (!assignment) return;
        const target = transformBackSlot(assignment.slotIndex, spec, resolvedTransform);
        const sideEnabled = Boolean(assignment.record && assignment.record.back && assignment.record.back.enabled);
        if (sideEnabled) backHasContent = true;
        backSlots[target.slotIndex] = Object.assign({}, assignment, {
          slotIndex: target.slotIndex,
          row: target.row,
          column: target.column,
          rectMm: rectForCell(target, spec),
          frontSlotIndex: assignment.slotIndex,
          side: "back",
        });
      });
      if (includeBlankBacks || backHasContent) {
        pages.push({
          printPageIndex: pages.length,
          pageNumber: pages.length + 1,
          sheetIndex: sheet.sheetIndex,
          side: "back",
          transform: resolvedTransform,
          offsetXmm: spec.duplex.offsetXmm,
          offsetYmm: spec.duplex.offsetYmm,
          slots: backSlots,
        });
      }
    });

    return {
      pages,
      paper: Object.assign({}, spec.page),
      sheetCount: pagination.pages.length,
      printPageCount: pages.length,
      duplexEnabled,
      transform: resolvedTransform,
    };
  }

  function sideMeaningful(side) {
    return Boolean(side && side.enabled && sideHasOwnContent(side));
  }

  function overlayLayout(record, sideName, settings) {
    const side = record[sideName];
    const source = isObject(settings) ? settings : {};
    const qr = isObject(source.qr) ? source.qr : {};
    const qrSideEnabled = Boolean(qr.enabled) && (qr.side === "both" || qr.side === sideName);
    const promptOutput = source.outputGoal === "prompt";
    const qrPresent = qrSideEnabled && !promptOutput && trimmed(side.qrValue) !== "";
    const qrReserved = qrSideEnabled && (promptOutput || qrPresent);
    const qrLayoutMode = ["adaptive", "reserved", "overlay"].includes(qr.layoutMode) ? qr.layoutMode : "adaptive";
    const horizontalAlign = ["left", "center", "right"].includes(source.textAlign) ? source.textAlign : "center";
    const verticalAlign = ["top", "center", "bottom"].includes(source.textVerticalAlign) ? source.textVerticalAlign : "top";
    const qrPosition = ["left", "right", "top-left", "top-right", "bottom-left", "bottom-right", "center"].includes(qr.position) ? qr.position : "right";
    const fontScalePercent = clamp(finiteNumber(source.textScalePercent, 100), 70, 160);
    const number = side.number || record.number;
    return {
      numberVisible: source.sequenceMode !== "none" && trimmed(number) !== "",
      horizontalAlign,
      verticalAlign,
      fontScalePercent,
      qrPresent,
      qrReserved,
      qrMode: qrReserved ? (qrPresent ? "render-exact-qr" : "reserve-blank-space") : "none",
      qrPosition: qrReserved ? qrPosition : null,
      qrSizePercent: qrReserved ? clamp(finiteNumber(qr.sizePercent, 28), 16, 48) : 0,
      qrLayoutMode: qrReserved ? qrLayoutMode : null,
      contentFlow: qrReserved
        ? qrLayoutMode === "adaptive"
          ? "field-aware-wrap-around-qr"
          : qrLayoutMode === "reserved"
            ? "fixed-reserved-qr-zone"
            : "full-width-overlay"
        : "full-width-no-qr-reservation",
    };
  }

  function overlayPayload(record, sideName, settings) {
    const side = record[sideName];
    const layout = overlayLayout(record, sideName, settings);
    return {
      recordId: record.id,
      side: sideName,
      strings: {
        number: layout.numberVisible ? side.number || record.number : "",
        title: side.title,
        subtitle: side.subtitle,
        body: side.body,
        footer: side.footer,
      },
      qrValue: layout.qrPresent ? side.qrValue : "",
      qrReservation: layout.qrReserved ? {
        position: layout.qrPosition,
        sizePercent: layout.qrSizePercent,
        mode: layout.qrMode,
      } : null,
      textOrientation: side.textOrientation,
      layout,
    };
  }

  function backgroundPromptFor(record, sideName, spec, settings) {
    const side = record[sideName];
    const userDirection = side.backgroundPrompt;
    const layout = overlayLayout(record, sideName, settings);
    const layoutDirection = layout.qrReserved
      ? `A QR code will be composited later at ${layout.qrPosition}. Keep a clean square quiet zone occupying about ${layout.qrSizePercent}% of the label width without drawing a visible placeholder box.`
      : "No QR code is used on this label side. Do not reserve an empty QR box, side panel, or unused column; balance the artwork across the full safe area.";
    return [
      "[RASTER BACKGROUND ONLY]",
      `Create one print-ready raster background for the ${sideName} of an anonymous label or ticket.`,
      `Exact trim size: ${spec.grid.labelWidthMm} mm × ${spec.grid.labelHeightMm} mm; orientation: ${side.textOrientation}.`,
      `Image fit: ${side.imageFit}; focal point: (${side.focalPoint.x}, ${side.focalPoint.y}).`,
      "Do not draw any letters, numbers, QR codes, barcodes, logos containing text, placeholders, guide lines, crop marks, or pseudo-text.",
      "Keep important visual subjects inside the safe area and leave sufficient quiet space for a separate exact text overlay.",
      layoutDirection,
      "User art direction follows verbatim:",
      userDirection || "Use a restrained, legible, print-friendly background appropriate to the supplied label content.",
    ].join("\n");
  }

  function privacySafeSharedArtDirection(project) {
    const settings = isObject(project && project.settings) ? project.settings : {};
    const snapshot = isObject(settings.visualStyleSnapshot) ? settings.visualStyleSnapshot : {};
    const snapshotPrompt = typeof snapshot.prompt === "string"
      ? snapshot.prompt
      : isObject(snapshot.prompt) ? snapshot.prompt.en || snapshot.prompt.ko : "";
    let direction = [
      settings.backgroundPrompt,
      typeof snapshot.stylePrompt === "string" ? snapshot.stylePrompt : "",
      snapshotPrompt,
    ]
      .map(trimmed)
      .filter(Boolean)
      .join("\n");
    if (!direction) return "Use a restrained, legible, print-friendly background appropriate to a generic label or ticket.";
    const sensitive = [];
    const add = (value) => {
      const candidate = trimmed(value);
      if (candidate.length >= 2) sensitive.push(candidate);
    };
    project.records.forEach((record) => {
      add(record.id);
      add(record.number);
      [record.front, record.back].forEach((side) => {
        if (!side) return;
        [side.number, side.title, side.subtitle, side.body, side.footer, side.qrValue].forEach(add);
      });
      Object.values(record.data || {}).forEach((value) => {
        if (["string", "number"].includes(typeof value)) add(value);
      });
    });
    Array.from(new Set(sensitive)).sort((left, right) => right.length - left.length).forEach((secret) => {
      direction = direction.split(secret).join("[redacted]");
    });
    return trimmed(direction) || "Use a restrained, legible, print-friendly background appropriate to a generic label or ticket.";
  }

  function anonymousBackgroundPromptFor(entry, slotNumber, sideName, spec) {
    const crop = entry.backgroundCrop
      ? `; crop: (${entry.backgroundCrop.x}, ${entry.backgroundCrop.y}, ${entry.backgroundCrop.width}, ${entry.backgroundCrop.height})`
      : "";
    return [
      `[ANONYMOUS RASTER BACKGROUND — SLOT ${slotNumber}]`,
      `Create one print-ready, text-free raster background for physical slot ${slotNumber} on the ${sideName} page.`,
      `Exact trim size: ${spec.grid.labelWidthMm} mm × ${spec.grid.labelHeightMm} mm at ${spec.dpi} dpi.`,
      `Image fit: ${entry.imageFit}; focal point: (${entry.focalPoint.x}, ${entry.focalPoint.y})${crop}.`,
      "Use a restrained, professional, non-identifying visual treatment suitable for a generic label or ticket background.",
      "Privacy-scrubbed shared art direction:",
      entry.anonymousArtDirection,
      "Do not include or infer any record identifier, name, title, body copy, number, QR value, barcode, readable symbol, logo text, watermark, placeholder, or pseudo-text.",
      entry.layout.qrReserved
        ? `A deterministic QR overlay will occupy ${entry.layout.qrPosition}; keep a clean square quiet zone of about ${entry.layout.qrSizePercent}% without drawing a placeholder or pseudo-QR.`
        : "No QR overlay is used in this slot. Do not reserve an empty QR box or unused side column; use the full safe area for the separate deterministic text overlay.",
    ].join("\n");
  }

  function overlayDirectiveFor(record, sideName, spec, settings) {
    const payload = overlayPayload(record, sideName, settings);
    return [
      "[EXACT TEXT/QR OVERLAY — COMPOSITE AFTER BACKGROUND GENERATION]",
      `Canvas trim size: ${spec.grid.labelWidthMm} mm × ${spec.grid.labelHeightMm} mm at ${spec.dpi} dpi.`,
      "Render the following Unicode strings exactly as JSON-encoded. Do not translate, paraphrase, autocorrect, invent, omit, or duplicate characters.",
      JSON.stringify(payload, null, 2),
      "Keep every glyph and QR quiet zone inside the printable safe area. Text remains a separate editable overlay layer.",
      payload.layout.qrPresent
        ? "Apply the supplied QR-aware content flow only because this record has a QR value. Keep text out of the QR quiet zone."
        : "This record has no active QR value. Use the full text width and do not leave an empty QR-shaped gap.",
    ].join("\n");
  }

  function integratedPromptFor(record, sideName, spec, settings) {
    const side = record[sideName];
    const payload = overlayPayload(record, sideName, settings);
    const qrInstruction = payload.layout.qrReserved
      ? [
        `Reserve one completely clean square at ${payload.layout.qrPosition}, sized about ${payload.layout.qrSizePercent}% of the label width, for later QR compositing.`,
        "Do not render a QR code, finder squares, barcode, pseudo-QR texture, placeholder icon, border, caption, or URL inside that reserved square.",
        "Keep all visible text and important artwork outside the reserved square and its quiet zone.",
      ].join("\n")
      : "No QR space is required. Use the full safe area and do not leave an unexplained empty square or side column.";
    return [
      "[FULL LABEL IMAGE PROMPT]",
      "Generate one finished, flattened, print-ready raster label or ticket image. The result must include both the visual design and every supplied visible text string; do not return a prompt sheet, wireframe, mockup, layer guide, or background-only image.",
      `Exact trim size: ${spec.grid.labelWidthMm} mm × ${spec.grid.labelHeightMm} mm at ${spec.dpi} dpi; side: ${sideName}; text orientation: ${side.textOrientation}.`,
      `Image fit: ${side.imageFit}; focal point: (${side.focalPoint.x}, ${side.focalPoint.y}).`,
      "[BACKGROUND DESIGN DNA]",
      side.backgroundPrompt || "Use a restrained, professional, print-friendly design with strong text readability.",
      "[EXACT VISIBLE TEXT]",
      "Render the following Unicode strings exactly. Do not translate, paraphrase, autocorrect, invent, omit, duplicate, or turn them into pseudo-text.",
      JSON.stringify(payload.strings, null, 2),
      "[LAYOUT CONTRACT]",
      JSON.stringify({
        horizontalAlign: payload.layout.horizontalAlign,
        verticalAlign: payload.layout.verticalAlign,
        fontScalePercent: payload.layout.fontScalePercent,
        contentFlow: payload.layout.contentFlow,
        textOrientation: payload.textOrientation,
        qrMode: payload.layout.qrMode,
        qrPosition: payload.layout.qrPosition,
        qrSizePercent: payload.layout.qrSizePercent,
      }, null, 2),
      qrInstruction,
      "Keep every glyph inside the printable safe area with clear hierarchy and strong contrast against the background. Deliver only the final label image.",
    ].join("\n");
  }

  function pagePromptText(page, totalPrintPages, spec) {
    const sideLabel = page.side === "back" ? "BACK" : "FRONT";
    const orientation = spec.page.orientation === "landscape" ? "landscape" : "portrait";
    const slotMap = page.slots.length
      ? page.slots.map((slot) => [
        `- Slot ${slot.slotNumber} (row ${slot.rowNumber}, column ${slot.columnNumber})`,
        `recordId=${JSON.stringify(slot.recordId)}, number=${JSON.stringify(slot.number)}`,
        `rect=${slot.rectMm.xMm}mm,${slot.rectMm.yMm}mm,${slot.rectMm.widthMm}mm,${slot.rectMm.heightMm}mm`,
      ].join("; ")).join("\n")
      : "(This print page intentionally contains no label prompts.)";
    const fullImagePrompts = page.slots.length
      ? page.slots.map((slot) => `--- SLOT ${slot.slotNumber} · ${slot.recordId} ---\n${slot.individualPrompt || slot.integratedPrompt}`).join("\n\n")
      : "(No label image prompts on this page.)";
    const duplexLine = page.side === "back"
      ? `Back-side transform: ${page.transform}; registration offset: X ${page.offsetXmm} mm / Y ${page.offsetYmm} mm.`
      : "Front-side transform: none.";

    return [
      `[A4 FULL IMAGE PAGE ${page.printPageNumber}/${totalPrintPages} — SHEET ${page.sheetNumber} ${sideLabel}]`,
      [
        `Create only this one A4 ${orientation} print page (${spec.page.widthMm} mm × ${spec.page.heightMm} mm).`,
        `Grid: ${spec.grid.columns} columns × ${spec.grid.rows} rows; label trim: ${spec.grid.labelWidthMm} mm × ${spec.grid.labelHeightMm} mm; ${spec.dpi} dpi.`,
        `This page contains ${page.slots.length} prompted label side(s) out of ${page.capacity} physical slots.`,
        duplexLine,
        "Do not move records to another page, reorder slots, repeat labels, fill unused slots, or merge this page with another print page.",
      ].join("\n"),
      `[1. 페이지 슬롯 배치 / PAGE SLOT MAP]\n${slotMap}`,
      `[2. 칸별 완성 이미지 프롬프트 / FULL LABEL IMAGE PROMPTS]\n${fullImagePrompts}`,
      [
        "[3. PAGE COMPOSITION CONTRACT]",
        "Create one finished A4 page containing every listed label as a flattened full image with its exact visible text.",
        "Clip each label to its assigned trim rectangle, preserve empty physical slots as blank, and never move a label to another slot.",
        "Where a slot reserves QR space, leave that square clean for later compositing and never invent a QR-like pattern.",
        "Generate only the current A4 page identified in the header.",
      ].join("\n"),
    ].join("\n\n============================================================\n\n");
  }

  function pageBackgroundOnlyPromptText(page, totalPrintPages, spec) {
    const sideLabel = page.side === "back" ? "BACK" : "FRONT";
    const orientation = spec.page.orientation === "landscape" ? "landscape" : "portrait";
    const slotMap = page.slots.length
      ? page.slots.map((slot) => [
        `- Slot ${slot.slotNumber} (row ${slot.rowNumber}, column ${slot.columnNumber})`,
        `rect=${slot.rectMm.xMm}mm,${slot.rectMm.yMm}mm,${slot.rectMm.widthMm}mm,${slot.rectMm.heightMm}mm`,
      ].join("; ")).join("\n")
      : "(This print page intentionally contains no raster background slots.)";
    const backgroundPrompts = page.slots.length
      ? page.slots.map((slot) => slot.backgroundOnlyPrompt).join("\n\n")
      : "(No raster backgrounds on this page.)";
    const duplexLine = page.side === "back"
      ? `Back-side transform: ${page.transform}; registration offset: X ${page.offsetXmm} mm / Y ${page.offsetYmm} mm.`
      : "Front-side transform: none.";

    return [
      `[A4 BACKGROUND-ONLY PAGE ${page.printPageNumber}/${totalPrintPages} — SHEET ${page.sheetNumber} ${sideLabel}]`,
      [
        `Create only this one anonymous A4 ${orientation} raster-background page (${spec.page.widthMm} mm × ${spec.page.heightMm} mm).`,
        `Grid: ${spec.grid.columns} columns × ${spec.grid.rows} rows; label trim: ${spec.grid.labelWidthMm} mm × ${spec.grid.labelHeightMm} mm; ${spec.dpi} dpi.`,
        `This page contains ${page.slots.length} anonymous background slot(s) out of ${page.capacity} physical slots.`,
        duplexLine,
        "Do not add, infer, or expose record IDs, personal data, label copy, serial numbers, or QR values.",
        "Do not move backgrounds to another page, reorder slots, fill unused slots, or merge this page with another print page.",
      ].join("\n"),
      `[1. 익명 슬롯 배치 / ANONYMOUS SLOT MAP]\n${slotMap}`,
      `[2. 글자 없는 익명 배경 지침 / ANONYMOUS RASTER BACKGROUNDS]\n${backgroundPrompts}`,
      [
        "[3. BACKGROUND-ONLY CONTRACT]",
        "Generate raster backgrounds only. Preserve every unlisted physical slot as blank.",
        "Exact text and QR overlays are intentionally excluded from this mode and must be composited separately.",
      ].join("\n"),
    ].join("\n\n============================================================\n\n");
  }

  function pageOverlayOnlyPromptText(page, totalPrintPages, spec) {
    const sideLabel = page.side === "back" ? "BACK" : "FRONT";
    const orientation = spec.page.orientation === "landscape" ? "landscape" : "portrait";
    const slotMap = page.slots.length
      ? page.slots.map((slot) => [
        `- Slot ${slot.slotNumber} (row ${slot.rowNumber}, column ${slot.columnNumber})`,
        `recordId=${JSON.stringify(slot.recordId)}, number=${JSON.stringify(slot.number)}`,
        `rect=${slot.rectMm.xMm}mm,${slot.rectMm.yMm}mm,${slot.rectMm.widthMm}mm,${slot.rectMm.heightMm}mm`,
      ].join("; ")).join("\n")
      : "(This print page intentionally contains no overlay slots.)";
    const overlayDirectives = page.slots.length
      ? page.slots.map((slot) => `--- SLOT ${slot.slotNumber} · ${slot.recordId} ---\n${slot.overlayDirective}`).join("\n\n")
      : "(No text or QR overlays on this page.)";

    return [
      `[A4 OVERLAY-ONLY PAGE ${page.printPageNumber}/${totalPrintPages} — SHEET ${page.sheetNumber} ${sideLabel}]`,
      [
        `Create only the deterministic overlay layer for this one A4 ${orientation} page (${spec.page.widthMm} mm × ${spec.page.heightMm} mm).`,
        `Grid: ${spec.grid.columns} columns × ${spec.grid.rows} rows; label trim: ${spec.grid.labelWidthMm} mm × ${spec.grid.labelHeightMm} mm; ${spec.dpi} dpi.`,
        "Render every supplied Unicode string and QR value exactly. Do not translate, paraphrase, autocorrect, invent, omit, duplicate, or reorder content.",
        "Keep all raster backgrounds transparent or absent in this mode and preserve unused physical slots as blank.",
      ].join("\n"),
      `[1. 정확한 슬롯 배치 / EXACT SLOT MAP]\n${slotMap}`,
      `[2. 정확한 문구·QR 오버레이 지침 / EXACT TEXT/QR OVERLAYS]\n${overlayDirectives}`,
    ].join("\n\n============================================================\n\n");
  }

  function generatePromptBundle(projectInput, options) {
    const project = normalizeProject(projectInput);
    const config = isObject(options) ? options : {};
    const includeEmptySides = Boolean(config.includeEmptySides);
    const entries = [];
    const anonymousArtDirection = privacySafeSharedArtDirection(project);

    project.records.forEach((record, recordIndex) => {
      ["front", "back"].forEach((sideName) => {
        const side = record[sideName];
        if (!side.enabled) return;
        if (!includeEmptySides && sideName === "back" && !sideMeaningful(side)) return;
        const layout = overlayLayout(record, sideName, project.settings);
        const backgroundPrompt = backgroundPromptFor(record, sideName, project.spec, project.settings);
        const overlayDirective = overlayDirectiveFor(record, sideName, project.spec, project.settings);
        const integratedPrompt = integratedPromptFor(record, sideName, project.spec, project.settings);
        entries.push({
          schema: SCHEMAS.promptEntry,
          recordIndex,
          recordId: record.id,
          number: record.number,
          side: sideName,
          labelSizeMm: {
            width: project.spec.grid.labelWidthMm,
            height: project.spec.grid.labelHeightMm,
          },
          dpi: project.spec.dpi,
          backgroundAssetId: side.backgroundAssetId,
          backgroundFile: side.backgroundFile,
          imageFit: side.imageFit,
          focalPoint: Object.assign({}, side.focalPoint),
          backgroundCrop: side.backgroundCrop ? Object.assign({}, side.backgroundCrop) : null,
          textOrientation: side.textOrientation,
          layout,
          backgroundPrompt,
          anonymousArtDirection,
          overlayDirective,
          integratedPrompt,
          individualPrompt: integratedPrompt,
        });
      });
    });

    const pagination = paginateRecords(project.records, project.spec);
    const printSequence = pairPrintPages(pagination, project.spec, { includeBlankBacks: includeEmptySides });
    const entryByRecordSide = new Map(entries.map((entry) => [`${entry.recordIndex}:${entry.side}`, entry]));
    const pagePrompts = printSequence.pages.map((printPage) => {
      const slots = printPage.slots.map((assignment) => {
        if (!assignment) return null;
        const entry = entryByRecordSide.get(`${assignment.recordIndex}:${printPage.side}`);
        if (!entry) return null;
        return {
          slotIndex: assignment.slotIndex,
          slotNumber: assignment.slotIndex + 1,
          row: assignment.row,
          rowNumber: assignment.row + 1,
          column: assignment.column,
          columnNumber: assignment.column + 1,
          frontSlotIndex: Number.isInteger(assignment.frontSlotIndex) ? assignment.frontSlotIndex : assignment.slotIndex,
          rectMm: Object.assign({}, assignment.rectMm),
          recordIndex: assignment.recordIndex,
          recordId: entry.recordId,
          number: entry.number,
          backgroundOnlyPrompt: anonymousBackgroundPromptFor(entry, assignment.slotIndex + 1, printPage.side, project.spec),
          backgroundPrompt: entry.backgroundPrompt,
          overlayDirective: entry.overlayDirective,
          integratedPrompt: entry.integratedPrompt,
          individualPrompt: entry.individualPrompt,
        };
      }).filter(Boolean);
      const page = {
        schema: SCHEMAS.pagePrompt,
        printPageIndex: printPage.printPageIndex,
        printPageNumber: printPage.pageNumber,
        sheetIndex: printPage.sheetIndex,
        sheetNumber: printPage.sheetIndex + 1,
        side: printPage.side,
        transform: printPage.transform,
        offsetXmm: printPage.offsetXmm,
        offsetYmm: printPage.offsetYmm,
        capacity: pagination.capacity,
        occupiedSlotCount: printPage.slots.filter(Boolean).length,
        promptEntryCount: slots.length,
        recordIds: slots.map((slot) => slot.recordId),
        slots,
        individualPrompts: slots.map((slot) => ({
          slotNumber: slot.slotNumber,
          recordId: slot.recordId,
          side: printPage.side,
          prompt: slot.individualPrompt,
        })),
      };
      page.promptVariants = {
        backgroundOnly: pageBackgroundOnlyPromptText(page, printSequence.printPageCount, project.spec),
        overlayOnly: pageOverlayOnlyPromptText(page, printSequence.printPageCount, project.spec),
        integrated: pagePromptText(page, printSequence.printPageCount, project.spec),
      };
      page.prompt = page.promptVariants.integrated;
      return page;
    });
    const pageSeparator = "\n\n################################################################\n\n";
    const allPagesByMode = {
      "background-only": pagePrompts.map((page) => page.promptVariants.backgroundOnly).join(pageSeparator),
      "overlay-only": pagePrompts.map((page) => page.promptVariants.overlayOnly).join(pageSeparator),
      integrated: pagePrompts.map((page) => page.promptVariants.integrated).join(pageSeparator),
    };

    return {
      schema: "promptdeck-label-prompt-bundle/1.0",
      projectId: project.id,
      entries,
      backgroundPrompts: entries.map((entry) => ({ recordId: entry.recordId, side: entry.side, prompt: entry.backgroundPrompt })),
      overlayDirectives: entries.map((entry) => ({ recordId: entry.recordId, side: entry.side, directive: entry.overlayDirective })),
      integratedPrompts: entries.map((entry) => ({ recordId: entry.recordId, side: entry.side, prompt: entry.integratedPrompt })),
      individualPrompts: entries.map((entry) => ({ recordId: entry.recordId, side: entry.side, prompt: entry.individualPrompt })),
      pagination: {
        capacity: pagination.capacity,
        totalRecords: pagination.totalRecords,
        totalSheets: pagination.totalSheets,
        firstSheetStartSlot: pagination.firstSheetStartSlot,
        firstSheetSkippedSlots: pagination.firstSheetSkippedSlots.slice(),
        printPageCount: printSequence.printPageCount,
        duplexEnabled: printSequence.duplexEnabled,
      },
      pagePrompts,
      allPagesByMode,
      allPagesPrompt: allPagesByMode.integrated,
      allIndividualPrompts: entries.map((entry, index) => `### LABEL ${index + 1} · ${entry.recordId} · ${entry.side.toUpperCase()}\n${entry.individualPrompt}`).join(pageSeparator),
      jsonl: entries.map((entry) => JSON.stringify(entry)).join("\n"),
      pageJsonl: pagePrompts.map((page) => JSON.stringify(page)).join("\n"),
    };
  }

  function preflightProject(projectInput, options) {
    const project = normalizeProject(projectInput);
    const config = isObject(options) ? options : {};
    const geometry = validateGeometry(projectInput && projectInput.spec ? projectInput.spec : project.spec);
    const errors = geometry.errors.slice();
    const warnings = geometry.warnings.slice();
    const requireBackgrounds = own(config, "requireBackgrounds")
      ? Boolean(config.requireBackgrounds)
      : Boolean(project.settings.requireBackgrounds);
    const assetIds = new Set();
    const assetFiles = new Set();
    project.assets.forEach((asset) => {
      if (!isObject(asset)) return;
      if (trimmed(asset.assetId || asset.id)) assetIds.add(trimmed(asset.assetId || asset.id));
      if (trimmed(asset.fileName || asset.name)) assetFiles.add(trimmed(asset.fileName || asset.name));
    });
    const ids = new Map();
    const numbers = new Map();
    const emptyBackIds = [];
    const missingBackgrounds = [];

    project.records.forEach((record, index) => {
      if (ids.has(record.id)) {
        errors.push(issue("DUPLICATE_RECORD_ID", `중복 라벨 ID ${record.id}가 있습니다.`, `records[${index}].id`, { id: record.id, firstIndex: ids.get(record.id) }));
      } else {
        ids.set(record.id, index);
      }
      if (trimmed(record.number)) {
        if (numbers.has(record.number)) {
          warnings.push(issue("DUPLICATE_NUMBER", `번호 ${record.number}가 두 번 이상 사용되었습니다.`, `records[${index}].number`, { number: record.number, firstIndex: numbers.get(record.number) }));
        } else {
          numbers.set(record.number, index);
        }
      }
      ["front", "back"].forEach((sideName) => {
        const side = record[sideName];
        if (!side.enabled) return;
        const hasBackground = Boolean(trimmed(side.backgroundAssetId) || trimmed(side.backgroundFile) || trimmed(side.backgroundPrompt));
        if (!hasBackground) missingBackgrounds.push({ id: record.id, side: sideName, index });
        if (trimmed(side.backgroundAssetId) && !assetIds.has(trimmed(side.backgroundAssetId))) {
          errors.push(issue("BACKGROUND_ASSET_NOT_FOUND", `${record.id} ${sideName}의 배경 자산을 찾을 수 없습니다.`, `records[${index}].${sideName}.backgroundAssetId`, { assetId: side.backgroundAssetId }));
        }
        if (trimmed(side.backgroundFile) && !assetFiles.has(trimmed(side.backgroundFile))) {
          errors.push(issue("BACKGROUND_FILE_NOT_FOUND", `${record.id} ${sideName}의 배경 파일을 등록소에서 찾을 수 없습니다.`, `records[${index}].${sideName}.backgroundFile`, { fileName: side.backgroundFile }));
        }
      });
      if (project.spec.duplex.enabled && !sideMeaningful(record.back)) emptyBackIds.push(record.id);
    });

    if (project.records.length === 0) {
      warnings.push(issue("NO_RECORDS", "출력할 라벨·티켓 데이터가 없습니다.", "records"));
    }
    if (missingBackgrounds.length) {
      const target = requireBackgrounds ? errors : warnings;
      target.push(issue(
        "MISSING_BACKGROUNDS",
        `${missingBackgrounds.length}개 면에 등록 이미지나 배경 프롬프트가 없습니다.`,
        "records",
        missingBackgrounds,
      ));
    }
    if (project.spec.duplex.enabled && emptyBackIds.length) {
      warnings.push(issue(
        "EMPTY_BACKS",
        `${emptyBackIds.length}개 레코드의 뒷면이 비어 있습니다.`,
        "records",
        { recordIds: emptyBackIds },
      ));
    }

    return {
      valid: errors.length === 0,
      project,
      errors,
      warnings,
      summary: {
        recordCount: project.records.length,
        assetCount: project.assets.length,
        errorCount: errors.length,
        warningCount: warnings.length,
        missingBackgroundCount: missingBackgrounds.length,
        emptyBackCount: emptyBackIds.length,
      },
    };
  }

  const RUNTIME_KEYS = new Set([
    "blob",
    "originalBlob",
    "thumbnailBlob",
    "printBlob",
    "runtime",
    "objectUrl",
    "objectURL",
    "imageBitmap",
    "canvas",
    "element",
    "fileHandle",
  ]);

  function scrubSerializable(value, seen) {
    if (value === null || ["string", "number", "boolean"].includes(typeof value)) return value;
    if (["undefined", "function", "symbol", "bigint"].includes(typeof value)) return undefined;
    if (value instanceof Date) return value.toISOString();
    if (typeof Blob !== "undefined" && value instanceof Blob) return undefined;
    if (seen.has(value)) return undefined;
    seen.add(value);
    if (Array.isArray(value)) {
      const result = value.map((item) => scrubSerializable(item, seen)).filter((item) => item !== undefined);
      seen.delete(value);
      return result;
    }
    const result = {};
    Object.keys(value).forEach((key) => {
      if (RUNTIME_KEYS.has(key) || key.startsWith("_runtime")) return;
      const clean = scrubSerializable(value[key], seen);
      if (clean !== undefined) result[key] = clean;
    });
    seen.delete(value);
    return result;
  }

  function toSerializableProject(projectInput) {
    return scrubSerializable(normalizeProject(projectInput), new Set());
  }

  function serializeProject(projectInput, space) {
    const indentation = space === undefined ? 2 : space;
    return JSON.stringify(toSerializableProject(projectInput), null, indentation);
  }

  function deserializeProject(jsonOrObject) {
    const source = typeof jsonOrObject === "string" ? JSON.parse(jsonOrObject) : jsonOrObject;
    return normalizeProject(source);
  }

  global.PromptDeckLabelSheetEngine = Object.freeze({
    VERSION,
    SCHEMAS,
    A4,
    IMPORT_MODES,
    FILL_ORDERS,
    BACK_TRANSFORMS,
    createDefaultSpec,
    normalizeSpec,
    validateGeometry,
    createDefaultProject,
    normalizeProject,
    mmToPx,
    formatSequence,
    createSequenceRecords,
    normalizeRecord,
    parseTable,
    importRecords,
    slotToCell,
    cellToSlot,
    paginateRecords,
    transformBackSlot,
    recommendBackTransform,
    pairPrintPages,
    generatePromptBundle,
    preflightProject,
    toSerializableProject,
    serializeProject,
    deserializeProject,
  });
})(typeof window !== "undefined" ? window : globalThis);
