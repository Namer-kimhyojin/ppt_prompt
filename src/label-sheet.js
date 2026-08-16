// PromptDeck 라벨·티켓 제작 탭 컨트롤러
// 규격, 데이터, 래스터 배경, 프롬프트, 미리보기와 인쇄가 하나의 프로젝트 상태를 공유합니다.
(function () {
  "use strict";

  const STORAGE_KEY = "promptdeck_label_sheet_project_v1";
  const LAYOUT_PRESET_STORAGE_KEY = "promptdeck_label_sheet_layout_presets_v1";
  const CONTRAST_MIGRATION_KEY = "promptdeck_label_sheet_auto_contrast_v1";
  const DEFAULT_ASSET_SEED_KEY = "promptdeck_label_sheet_default_assets_v1";
  const DEFAULT_ASSET_SEED_VERSION = "2";
  const PREVIEW_DPI = 72;
  const FOCUS_PREVIEW_DPI = 144;
  const GENERATION_DELAY_MS = 3500;
  const WYSIWYG_TEXT_LINE_HEIGHT = 1.25;
  const WYSIWYG_AUTO_HEIGHT_MIN_PERCENT = 7;
  const ENGINE = window.PromptDeckLabelSheetEngine;
  const PRESETS = window.PromptDeckLabelSheetPresets;
  const ASSETS = window.PromptDeckLabelSheetAssets;
  const RENDERER = window.PromptDeckLabelSheetRenderer;
  const PACKAGE = window.PromptDeckLabelSheetPackage;
  const VISUAL_STYLES = window.PromptDeckVisualStyleContract;
  const TABLE_DATA = window.PromptDeckTabularData;
  const DATA_MAPPING = window.PromptDeckLabelSheetDataMapping;
  const pane = document.getElementById("paneLabelSheet");
  const DEFAULT_BACKGROUND_ASSETS = Object.freeze([
    { filename: "기본-배터리-네이비.webp", url: "assets/label-sheet/default-backgrounds/battery-navy-energy.webp" },
    { filename: "기본-배터리-아이스블루.webp", url: "assets/label-sheet/default-backgrounds/battery-ice-blue.webp" },
    { filename: "기본-교육생식권-앰버.webp", url: "assets/label-sheet/default-backgrounds/meal-ticket-amber.webp" },
    { filename: "기본-배터리-에코그린.webp", url: "assets/label-sheet/default-backgrounds/battery-eco-green.webp" },
    { filename: "기본-배터리-인디고데이터.webp", url: "assets/label-sheet/default-backgrounds/battery-indigo-data.webp" },
    { filename: "기본-배터리-인더스트리얼.webp", url: "assets/label-sheet/default-backgrounds/battery-industrial-charcoal.webp" },
  ]);

  if (!pane) return;

  const $ = (id) => document.getElementById(id);
  const value = (id) => $(id)?.value ?? "";
  const numberValue = (id, fallback = 0) => {
    const parsed = Number(value(id));
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const checked = (id) => Boolean($(id)?.checked);
  const cleanText = (input) => String(input ?? "").trim();
  const deepClone = (input) => JSON.parse(JSON.stringify(input));
  const isStaticMode = () => Boolean(window.PROMPTDECK_STATIC_MODE);
  const escapeFilename = (input) => cleanText(input || "label-sheet")
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "label-sheet";

  if (!ENGINE || !PRESETS || !ASSETS || !RENDERER || !DATA_MAPPING) {
    const status = $("labelSheetStatus");
    if (status) status.textContent = "라벨·티켓 모듈을 불러오지 못했습니다. 페이지를 새로고침해 주세요.";
    return;
  }

  const assetStore = ASSETS.createStore({ persist: true, persistDerivatives: true });
  let project = restoreProject();
  let draftRecords = [];
  let draftRawRecords = [];
  let draftHeaders = [];
  let draftMapping = DATA_MAPPING.normalizeMapping();
  let draftMode = "replace";
  let draftActive = false;
  let undoRecords = null;
  let pendingFiles = [];
  let selectedAssetId = "";
  let selectedRecordIds = new Set();
  let previewSide = "front";
  let currentPageIndex = 0;
  let currentPagination = null;
  let currentPages = { front: [], back: [] };
  let renderVersion = 0;
  let lastPromptBundle = null;
  let currentPromptPageIndex = 0;
  let currentPromptItemIndex = 0;
  let promptResultView = "page";
  let copiedPromptPageIndices = new Set();
  let promptDisclosureAccepted = false;
  let printRoot = null;
  let manualPrintPhase = "front";
  let saveTimer = 0;
  let renderTimer = 0;
  let sequenceTimer = 0;
  let generationRunning = false;
  let generationQueue = null;
  let generationContext = null;
  let packageBusy = false;
  let assetStoreReady = false;
  let trackedAssetReferences = new Map();
  let previewAbortController = null;
  let focusPreviewAbortController = null;
  let focusOverlayResizeObserver = null;
  let focusOverlayFinalizeFrame = 0;
  let focusRenderVersion = 0;
  let pendingPageImageFile = null;
  let lastPreparedPrintRange = null;
  let manualPrintRange = null;
  let outputExportBusy = false;
  let currentWorkingProject = null;
  let wysiwygEnabled = pane.classList.contains("label-sheet-workspace-v2");
  let wysiwygField = "title";
  let wysiwygScope = "record";
  let wysiwygPlacementIndex = 0;
  let wysiwygDrag = null;
  let focusBackgroundMuted = true;
  let focusToolPanel = "quick";
  let activeSpreadsheetCell = null;
  let activeOutputTemplateInput = null;
  let layoutPresets = [];
  const DNA_STYLE_BATCH_SIZE = 36;
  const dnaStyleBrowser = {
    category: "all",
    query: "",
    visible: DNA_STYLE_BATCH_SIZE,
    returnFocus: null,
  };
  const WYSIWYG_FIELD_KEYS = Object.freeze(["number", "title", "subtitle", "body", "footer"]);
  const WYSIWYG_TARGET_KEYS = Object.freeze(["content", ...WYSIWYG_FIELD_KEYS, "qr"]);
  const WYSIWYG_FIELD_LABELS = Object.freeze({ content: "전체 콘텐츠", number: "연번", title: "제목", subtitle: "부제", body: "본문", footer: "하단 문구", qr: "QR 영역" });
  const OUTPUT_FIELD_KEYS = Object.freeze(["title", "subtitle", "body", "footer"]);
  const OUTPUT_FIELD_LABELS = Object.freeze({ title: "제목", subtitle: "부제", body: "본문", footer: "하단 문구" });
  const RECORD_TABLE_COLUMNS = Object.freeze([
    Object.freeze({ field: "id", label: "ID", aliases: ["id", "label_id", "labelid", "라벨id", "라벨아이디"] }),
    Object.freeze({ field: "number", label: "번호", aliases: ["번호", "연번", "number", "serial", "sequence"] }),
    Object.freeze({ field: "data.name", label: "이름", aliases: ["이름", "성명", "이름·구분", "이름구분", "name", "data.name"] }),
    Object.freeze({ field: "data.category", label: "구분·소속", aliases: ["구분소속", "구분·소속", "구분", "소속", "category", "affiliation", "data.category"] }),
    Object.freeze({ field: "front.title", label: "앞면 제목", aliases: ["앞면제목", "앞면 제목", "front_title", "front.title", "title", "제목"] }),
    Object.freeze({ field: "front.subtitle", label: "앞면 부제", aliases: ["앞면부제", "앞면 부제", "front_subtitle", "front.subtitle", "subtitle", "부제"] }),
    Object.freeze({ field: "front.body", label: "앞면 본문", aliases: ["앞면본문", "앞면 본문", "front_body", "front.body", "body", "본문"] }),
    Object.freeze({ field: "front.footer", label: "앞면 하단", aliases: ["앞면하단", "앞면 하단", "front_footer", "front.footer", "footer", "하단"] }),
    Object.freeze({ field: "back.title", label: "뒷면 제목", aliases: ["뒷면제목", "뒷면 제목", "back_title", "back.title"] }),
    Object.freeze({ field: "back.subtitle", label: "뒷면 부제", aliases: ["뒷면부제", "뒷면 부제", "back_subtitle", "back.subtitle"] }),
    Object.freeze({ field: "back.body", label: "뒷면 본문", aliases: ["뒷면본문", "뒷면 본문", "back_body", "back.body"] }),
    Object.freeze({ field: "back.footer", label: "뒷면 하단", aliases: ["뒷면하단", "뒷면 하단", "back_footer", "back.footer"] }),
    Object.freeze({ field: "front.qrValue", label: "앞면 QR", aliases: ["앞면qr", "앞면 qr", "front_qr", "front_qr_value", "front.qrvalue"] }),
    Object.freeze({ field: "back.qrValue", label: "뒷면 QR", aliases: ["뒷면qr", "뒷면 qr", "back_qr", "back_qr_value", "back.qrvalue"] }),
    Object.freeze({ field: "front.backgroundFile", label: "앞면 배경", aliases: ["앞면배경", "앞면 배경", "front_background", "front_background_file", "front.backgroundfile"] }),
    Object.freeze({ field: "back.backgroundFile", label: "뒷면 배경", aliases: ["뒷면배경", "뒷면 배경", "back_background", "back_background_file", "back.backgroundfile"] }),
    Object.freeze({ field: "data.excluded", label: "제외", aliases: ["제외", "출력제외", "excluded", "exclude", "data.excluded"], type: "boolean" }),
  ]);
  const DEFAULT_CONTENT_LAYOUT = Object.freeze({ xPercent: 0, yPercent: 0, widthPercent: 100, heightPercent: 100 });
  const DEFAULT_TEXT_FIELD_LAYOUT = Object.freeze({
    number: Object.freeze({ xPercent: 50, yPercent: 0, widthPercent: 50, heightPercent: null, sizePercent: 12, fontFamily: "inherit", color: "inherit", align: "right", weight: 700, maxLines: 1, visible: true, avoidQr: true }),
    title: Object.freeze({ xPercent: 5, yPercent: 18, widthPercent: 90, heightPercent: null, sizePercent: 15, fontFamily: "inherit", color: "inherit", align: "center", weight: 700, maxLines: 2, visible: true, avoidQr: true }),
    subtitle: Object.freeze({ xPercent: 5, yPercent: 43, widthPercent: 90, heightPercent: null, sizePercent: 8.5, fontFamily: "inherit", color: "inherit", align: "center", weight: 500, maxLines: 2, visible: true, avoidQr: true }),
    body: Object.freeze({ xPercent: 5, yPercent: 58, widthPercent: 90, heightPercent: null, sizePercent: 7.2, fontFamily: "inherit", color: "inherit", align: "center", weight: 400, maxLines: 4, visible: true, avoidQr: true }),
    footer: Object.freeze({ xPercent: 5, yPercent: 87, widthPercent: 90, heightPercent: null, sizePercent: 6, fontFamily: "inherit", color: "inherit", align: "center", weight: 400, maxLines: 2, visible: true, avoidQr: true }),
  });

  function clamp(value, minimum, maximum) {
    const number = Number(value);
    if (!Number.isFinite(number)) return minimum;
    return Math.min(maximum, Math.max(minimum, number));
  }

  function createDefaultTextFieldLayout(variant = "") {
    const layout = {
      content: normalizeContentFieldLayout(null),
      ...Object.fromEntries(WYSIWYG_FIELD_KEYS.map((field) => [field, { ...DEFAULT_TEXT_FIELD_LAYOUT[field] }])),
      qr: normalizeQrFieldLayout(null),
    };
    if (variant === "withQr") {
      layout.number = { ...layout.number, sizePercent: 10.5 };
      layout.title = { ...layout.title, sizePercent: 12.5, maxLines: 3 };
      layout.subtitle = { ...layout.subtitle, sizePercent: 7.5, maxLines: 3 };
      layout.body = { ...layout.body, sizePercent: 6.5, maxLines: 5 };
      layout.footer = { ...layout.footer, sizePercent: 5.5 };
    }
    return layout;
  }

  function normalizeFieldColor(input) {
    const color = cleanText(input);
    return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/iu.test(color) ? color.toLowerCase() : "inherit";
  }

  function normalizeTextFieldLayout(input, field) {
    const fallback = DEFAULT_TEXT_FIELD_LAYOUT[field] || DEFAULT_TEXT_FIELD_LAYOUT.body;
    const source = input && typeof input === "object" ? input : {};
    const widthPercent = clamp(source.widthPercent ?? fallback.widthPercent, 5, 100);
    return {
      xPercent: clamp(source.xPercent ?? fallback.xPercent, 0, Math.max(0, 100 - widthPercent)),
      yPercent: clamp(source.yPercent ?? fallback.yPercent, 0, 96),
      widthPercent,
      heightPercent: normalizeOptionalPercent(source.heightPercent, 5, 100),
      sizePercent: clamp(source.sizePercent ?? fallback.sizePercent, 3, 30),
      fontFamily: cleanText(source.fontFamily) || fallback.fontFamily,
      color: normalizeFieldColor(source.color ?? fallback.color),
      align: ["left", "center", "right"].includes(source.align) ? source.align : fallback.align,
      weight: [300, 400, 500, 600, 700, 800, 900].includes(Number(source.weight)) ? Number(source.weight) : fallback.weight,
      maxLines: Math.min(8, Math.max(1, Math.trunc(Number(source.maxLines) || fallback.maxLines))),
      visible: source.visible !== false,
      avoidQr: source.avoidQr !== false,
    };
  }

  function normalizeOptionalPercent(input, minimum, maximum) {
    if (input === null || input === undefined || input === "") return null;
    const number = Number(input);
    return Number.isFinite(number) ? clamp(number, minimum, maximum) : null;
  }

  function normalizeQrFieldLayout(input) {
    const source = input && typeof input === "object" ? input : {};
    return {
      xPercent: normalizeOptionalPercent(source.xPercent, 0, 100),
      yPercent: normalizeOptionalPercent(source.yPercent, 0, 100),
      sizePercent: normalizeOptionalPercent(source.sizePercent, 16, 48),
      layoutMode: ["adaptive", "reserved", "overlay"].includes(source.layoutMode) ? source.layoutMode : null,
      gapPercent: normalizeOptionalPercent(source.gapPercent, 0, 12),
      layer: ["front", "behind"].includes(source.layer) ? source.layer : null,
    };
  }

  function normalizeContentFieldLayout(input) {
    const source = input && typeof input === "object" ? input : {};
    const widthPercent = clamp(source.widthPercent ?? DEFAULT_CONTENT_LAYOUT.widthPercent, 10, 100);
    const heightPercent = clamp(source.heightPercent ?? DEFAULT_CONTENT_LAYOUT.heightPercent, 10, 100);
    return {
      xPercent: clamp(source.xPercent ?? DEFAULT_CONTENT_LAYOUT.xPercent, 0, Math.max(0, 100 - widthPercent)),
      yPercent: clamp(source.yPercent ?? DEFAULT_CONTENT_LAYOUT.yPercent, 0, Math.max(0, 100 - heightPercent)),
      widthPercent,
      heightPercent,
    };
  }

  function normalizeTextFieldLayoutSet(input) {
    const source = input && typeof input === "object" ? input : {};
    return {
      content: normalizeContentFieldLayout(source.content),
      ...Object.fromEntries(WYSIWYG_FIELD_KEYS.map((field) => [field, normalizeTextFieldLayout(source[field], field)])),
      qr: normalizeQrFieldLayout(source.qr),
    };
  }

  function textOnlyWysiwygFields(layout) {
    const normalized = normalizeTextFieldLayoutSet(layout);
    return Object.fromEntries(WYSIWYG_FIELD_KEYS.map((field) => [field, normalized[field]]));
  }

  function isLegacyDefaultTextLayout(layout) {
    if (!layout || typeof layout !== "object") return false;
    return JSON.stringify(textOnlyWysiwygFields(layout)) === JSON.stringify(textOnlyWysiwygFields(createDefaultTextFieldLayout()));
  }

  function normalizeTextLayouts(input) {
    const source = input && typeof input === "object" ? input : {};
    const normalized = { front: { withQr: null, withoutQr: null }, back: { withQr: null, withoutQr: null } };
    ["front", "back"].forEach((sideName) => ["withQr", "withoutQr"].forEach((variant) => {
      const layout = source[sideName]?.[variant];
      normalized[sideName][variant] = layout && typeof layout === "object" ? normalizeTextFieldLayoutSet(layout) : null;
    }));
    return normalized;
  }

  function recordLayoutKey(recordId) {
    return `record:${cleanText(recordId)}`;
  }

  function normalizeRecordTextLayouts(input) {
    const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    const normalized = {};
    Object.entries(source).forEach(([key, entry]) => {
      if (!key.startsWith("record:") || !entry || typeof entry !== "object" || Array.isArray(entry)) return;
      const next = { front: { withQr: null, withoutQr: null }, back: { withQr: null, withoutQr: null } };
      ["front", "back"].forEach((sideName) => ["withQr", "withoutQr"].forEach((variant) => {
        const layout = entry[sideName]?.[variant];
        next[sideName][variant] = layout && typeof layout === "object" ? normalizeTextFieldLayoutSet(layout) : null;
      }));
      normalized[key] = next;
    });
    return normalized;
  }

  function clearRecordTextLayoutOverrides(input, sideName, variant) {
    const layouts = normalizeRecordTextLayouts(input);
    let cleared = 0;
    Object.keys(layouts).forEach((key) => {
      if (layouts[key]?.[sideName]?.[variant]) {
        layouts[key][sideName][variant] = null;
        cleared += 1;
      }
      const hasRemainingLayout = ["front", "back"].some((candidateSide) =>
        ["withQr", "withoutQr"].some((candidateVariant) => Boolean(layouts[key]?.[candidateSide]?.[candidateVariant]))
      );
      if (!hasRemainingLayout) delete layouts[key];
    });
    return { layouts, cleared };
  }

  function reconcileSelectedRecordIds() {
    const availableIds = new Set(project.records.map((record) => cleanText(record?.id)).filter(Boolean));
    selectedRecordIds = new Set(Array.from(selectedRecordIds).filter((recordId) => availableIds.has(recordId)));
  }

  function migrateRecordIdentity(previousId, nextId, recordIndex, target) {
    const previous = cleanText(previousId);
    const next = cleanText(nextId);
    const row = target?.closest?.("tr[data-record-id]");
    if (row) row.dataset.recordId = next;
    if (!previous || !next || previous === next) return;

    const previousStillUsed = project.records.some((record, index) => index !== recordIndex && cleanText(record?.id) === previous);
    if (selectedRecordIds.has(previous)) {
      selectedRecordIds.add(next);
      if (!previousStillUsed) selectedRecordIds.delete(previous);
    }

    const layouts = normalizeRecordTextLayouts(project.settings?.recordTextLayouts);
    const previousKey = recordLayoutKey(previous);
    const nextKey = recordLayoutKey(next);
    if (!previousStillUsed && layouts[previousKey] && !layouts[nextKey]) {
      layouts[nextKey] = layouts[previousKey];
      delete layouts[previousKey];
      project.settings = project.settings || {};
      project.settings.recordTextLayouts = layouts;
    }

    if (row) {
      const selected = selectedRecordIds.has(next);
      row.classList.toggle("is-selected", selected);
      row.setAttribute("aria-selected", String(selected));
      const checkbox = row.querySelector("[data-record-select]");
      if (checkbox) checkbox.checked = selected;
    }
  }

  function normalizeLayoutPreset(input, index = 0) {
    if (!input || typeof input !== "object" || Array.isArray(input)) return null;
    const name = cleanText(input.name).slice(0, 60);
    if (!name) return null;
    return {
      id: cleanText(input.id) || `layout-preset-${index + 1}`,
      name,
      side: input.side === "back" ? "back" : "front",
      variant: input.variant === "withQr" ? "withQr" : "withoutQr",
      fields: normalizeTextFieldLayoutSet(input.fields),
      createdAt: cleanText(input.createdAt) || new Date().toISOString(),
    };
  }

  function restoreLayoutPresets() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(LAYOUT_PRESET_STORAGE_KEY) || "[]");
      return (Array.isArray(parsed) ? parsed : []).map(normalizeLayoutPreset).filter(Boolean).slice(0, 30);
    } catch (_error) {
      return [];
    }
  }

  function persistLayoutPresets() {
    try {
      window.localStorage.setItem(LAYOUT_PRESET_STORAGE_KEY, JSON.stringify(layoutPresets.slice(0, 30)));
      return true;
    } catch (_error) {
      setElementStatus("labelSheetWysiwygPresetStatus", "브라우저 저장 공간이 부족해 프리셋을 저장하지 못했습니다.", "error");
      return false;
    }
  }

  function renderLayoutPresetOptions(preferredId = "") {
    const select = $("labelSheetWysiwygPreset");
    if (!select) return;
    const current = preferredId || select.value;
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = layoutPresets.length ? "저장한 프리셋 선택" : "저장한 프리셋 없음";
    select.replaceChildren(placeholder, ...layoutPresets.map((preset) => {
      const option = document.createElement("option");
      option.value = preset.id;
      option.textContent = preset.name;
      return option;
    }));
    select.value = layoutPresets.some((preset) => preset.id === current) ? current : "";
    if ($("labelSheetWysiwygPresetApply")) $("labelSheetWysiwygPresetApply").disabled = !select.value;
    if ($("labelSheetWysiwygPresetDelete")) $("labelSheetWysiwygPresetDelete").disabled = !select.value;
  }

  function textLayoutVariant(sideData) {
    return sideData?.qrEnabled && cleanText(sideData?.qrValue) ? "withQr" : "withoutQr";
  }

  function normalizedCrop(input = {}) {
    const x = clamp(input.x ?? 0, 0, 0.99);
    const y = clamp(input.y ?? 0, 0, 0.99);
    const width = clamp(input.width ?? 1 - x, 0.01, 1 - x);
    const height = clamp(input.height ?? 1 - y, 0.01, 1 - y);
    return { x, y, width, height };
  }

  function cropFromControls() {
    return normalizedCrop({
      x: numberValue("labelSheetCropX", 0) / 100,
      y: numberValue("labelSheetCropY", 0) / 100,
      width: numberValue("labelSheetCropWidth", 100) / 100,
      height: numberValue("labelSheetCropHeight", 100) / 100,
    });
  }

  function parseSlotExpression(input, capacity) {
    const maximum = Math.max(0, Math.trunc(Number(capacity) || 0));
    const slots = new Set();
    const invalid = [];
    String(input || "").split(",").map((token) => token.trim()).filter(Boolean).forEach((token) => {
      const match = token.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!match) {
        invalid.push(token);
        return;
      }
      const start = Number(match[1]);
      const end = Number(match[2] || match[1]);
      if (start < 1 || end < start || end > maximum) {
        invalid.push(token);
        return;
      }
      for (let slot = start; slot <= end; slot += 1) slots.add(slot - 1);
    });
    return { slots: Array.from(slots).sort((left, right) => left - right), invalid };
  }

  function formatSlotExpression(slots) {
    return Array.from(slots || []).map((slot) => Number(slot) + 1).filter((slot) => Number.isInteger(slot) && slot > 0).join(",");
  }

  function normalizePrintJob(input = {}) {
    return {
      rangeMode: ["all", "current", "range", "resume"].includes(input.rangeMode) ? input.rangeMode : "all",
      fromSheet: Math.max(1, Math.trunc(Number(input.fromSheet) || 1)),
      toSheet: Math.max(1, Math.trunc(Number(input.toSheet) || 1)),
      copies: Math.min(50, Math.max(1, Math.trunc(Number(input.copies) || 1))),
      lastCompletedSheet: Math.max(0, Math.trunc(Number(input.lastCompletedSheet) || 0)),
    };
  }

  const OUTPUT_GOALS = Object.freeze({
    print: { label: "완성물 직접 제작", title: "화면 그대로 출력하기", description: "미리보기와 완료 전 점검을 확인한 뒤 현재·전체 PNG, 실제 PDF 파일 또는 인쇄물로 저장하세요." },
    prompt: { label: "이미지 생성 프롬프트 설계", title: "전체 이미지 프롬프트 검토하기", description: "실제 문구와 연번, QR 합성 예약 공간을 포함한 프롬프트를 A4 페이지·개별 라벨별로 복사하세요." },
  });
  const DOCUMENT_TYPE_LABELS = Object.freeze({
    label: "일반 라벨",
    ticket: "일반 티켓",
    admission: "행사 출입표",
    "meal-ticket": "식권",
  });
  const DOCUMENT_TYPE_SAMPLE_LABELS = Object.freeze({
    label: "일반 라벨 예시 채우기",
    ticket: "일반 티켓 예시 채우기",
    admission: "행사 출입표 예시 채우기",
    "meal-ticket": "교육생 식권 예시 채우기",
  });
  const SAMPLE_PRESET_CATALOG = Object.freeze({
    label: Object.freeze([
      { id: "training-material", label: "교육 교재 분류", description: "연번·QR 없이 과정별 교재를 구분합니다." },
      { id: "lab-sample", label: "배터리 실험 시료", description: "시료 연번과 일부 QR을 함께 시험합니다." },
      { id: "archive-box", label: "문서 보관 상자", description: "긴 분류명과 연번 없는 레이아웃을 확인합니다." },
    ]),
    ticket: Object.freeze([
      { id: "program-voucher", label: "교육 프로그램 교환권", description: "연속번호가 있는 단면 교환권입니다." },
      { id: "consultation-order", label: "현장 상담 순번표", description: "짧은 번호와 대기 안내를 중심으로 구성합니다." },
      { id: "parking-pass", label: "행사 주차권", description: "차량별 QR과 긴 안내 문구를 함께 확인합니다." },
    ]),
    admission: Object.freeze([
      { id: "networking-pass", label: "네트워킹 행사 출입표", description: "이름·소속·QR이 있는 양면 출입표입니다." },
      { id: "seminar-seat", label: "세미나 좌석 출입표", description: "좌석번호와 세션 정보를 강조합니다." },
      { id: "staff-pass", label: "운영 스태프 패스", description: "연번 없이 역할·출입권한을 구분합니다." },
    ]),
    "meal-ticket": Object.freeze([
      { id: "training-lunch", label: "교육생 중식 식권", description: "샘플교육센터 기본 식권 샘플입니다." },
      { id: "daily-meals", label: "조식·중식·석식 식권", description: "식사 구분과 연속번호를 함께 표시합니다." },
      { id: "dietary-meal", label: "알레르기·식단 구분 식권", description: "QR 없이 긴 식단 정보를 확인합니다." },
    ]),
  });
  const FLOW_STEP_KEYS = Object.freeze(["intent", "spec", "data", "design", "output"]);
  let flowActiveStep = "intent";
  let flowShowAll = false;
  let flowNavigationBusy = false;
  let flowNavigationFrame = 0;

  function normalizeOutputGoal(input) {
    if (input === "both") return "print";
    return Object.prototype.hasOwnProperty.call(OUTPUT_GOALS, input) ? input : "print";
  }

  function selectedRadioValue(name, fallback = "") {
    return pane.querySelector(`input[name="${name}"]:checked`)?.value || fallback;
  }

  function syncIntentDocumentType(typeInput = project.settings?.documentType) {
    const type = Object.prototype.hasOwnProperty.call(DOCUMENT_TYPE_LABELS, typeInput) ? typeInput : "label";
    pane.querySelectorAll('input[name="labelSheetIntentDocumentType"]').forEach((radio) => {
      radio.checked = radio.value === type;
    });
    setControl("labelSheetDocumentType", type);
    return type;
  }

  function updateResultHeaderCopy() {
    const goal = normalizeOutputGoal(project.settings?.outputGoal);
    const stepNumber = Math.max(1, FLOW_STEP_KEYS.indexOf(flowActiveStep) + 1);
    if (flowActiveStep === "output") {
      if ($("labelSheetOutputKicker")) $("labelSheetOutputKicker").textContent = goal === "prompt" ? "STEP 5 · 프롬프트 결과" : "STEP 5 · 미리보기·출력";
      if ($("labelSheetOutputTitle")) $("labelSheetOutputTitle").textContent = OUTPUT_GOALS[goal].title;
      if ($("labelSheetOutputDescription")) $("labelSheetOutputDescription").textContent = OUTPUT_GOALS[goal].description;
      return;
    }
    if ($("labelSheetOutputKicker")) $("labelSheetOutputKicker").textContent = `현재 STEP ${stepNumber} · 실시간 확인`;
    if ($("labelSheetOutputTitle")) $("labelSheetOutputTitle").textContent = goal === "prompt" ? "프롬프트 페이지 구성 미리보기" : "현재 완성물 미리보기";
    if ($("labelSheetOutputDescription")) {
      $("labelSheetOutputDescription").textContent = goal === "prompt"
        ? "입력 데이터와 디자인 DNA가 페이지별 프롬프트 구조에 즉시 반영됩니다."
        : "입력과 설정을 바꾸면 현재 페이지에 즉시 반영됩니다.";
    }
  }

  function syncSamplePresetOptions(typeInput, preferredId = "") {
    const type = Object.prototype.hasOwnProperty.call(SAMPLE_PRESET_CATALOG, typeInput) ? typeInput : "label";
    const select = $("labelSheetSamplePreset");
    const catalog = SAMPLE_PRESET_CATALOG[type];
    if (!select) return catalog[0];
    const currentId = select.dataset.documentType === type ? select.value : "";
    const nextId = [preferredId, currentId, catalog[0].id].find((id) => catalog.some((item) => item.id === id)) || catalog[0].id;
    select.replaceChildren(...catalog.map((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.label;
      option.title = item.description;
      return option;
    }));
    select.dataset.documentType = type;
    select.value = nextId;
    return catalog.find((item) => item.id === nextId) || catalog[0];
  }

  function setDuplexMode(enabled, options = {}) {
    const duplex = Boolean(enabled);
    if ($("labelSheetModeDuplex")) $("labelSheetModeDuplex").checked = duplex;
    if ($("labelSheetModeSingle")) $("labelSheetModeSingle").checked = !duplex;
    if (!duplex && previewSide === "back") {
      previewSide = "front";
      currentPageIndex = 0;
    }
    if ($("labelSheetContentBackTab")) {
      $("labelSheetContentBackTab").disabled = !duplex;
      $("labelSheetContentBackTab").setAttribute("aria-disabled", String(!duplex));
    }
    if (!duplex && $("labelSheetContentBackTab")?.classList.contains("active")) {
      activateSubTab("labelSheetContentFrontTab", "labelSheetFrontContentPanel", ".label-sheet-content-tabs [role=tab]", ".label-sheet-content-panel");
    }
    if ($("labelSheetDuplexSettings")) $("labelSheetDuplexSettings").hidden = !duplex;
    updateIntentSummary();
    if (options.refresh) onProjectControlsChanged(duplex ? "양면 제작으로 전환했습니다." : "단면 제작으로 전환했습니다.");
  }

  function updateIntentSummary() {
    const type = syncIntentDocumentType(value("labelSheetDocumentType") || project.settings?.documentType);
    const samplePreset = syncSamplePresetOptions(type);
    const goal = normalizeOutputGoal(selectedRadioValue("labelSheetOutputGoal", project.settings?.outputGoal));
    const sideLabel = checked("labelSheetModeDuplex") ? "양면" : "단면";
    const recordCount = project.records.filter((record) => !record.data?.excluded).length;
    const summary = $("labelSheetIntentSummary");
    if (summary) {
      const strong = document.createElement("strong");
      strong.textContent = DOCUMENT_TYPE_LABELS[type];
      summary.replaceChildren(strong, ` · ${OUTPUT_GOALS[goal].label} · ${sideLabel}${recordCount ? ` · 현재 ${recordCount}건` : ""}`);
    }
    const workspaceMode = $("labelSheetWorkspaceMode");
    if (workspaceMode) {
      const shortGoal = goal === "prompt" ? "프롬프트" : "완성물";
      workspaceMode.textContent = `${DOCUMENT_TYPE_LABELS[type]} · ${shortGoal} · ${sideLabel} · ${recordCount}건`;
      workspaceMode.title = `${DOCUMENT_TYPE_LABELS[type]}을 ${OUTPUT_GOALS[goal].label} 방식으로 ${sideLabel} 제작합니다.`;
    }
    if ($("labelSheetIntentSampleBtn")) $("labelSheetIntentSampleBtn").textContent = `${samplePreset.label} 채우기`;
    if ($("labelSheetSampleBtn")) $("labelSheetSampleBtn").textContent = `${samplePreset.label} 예시`;
  }

  function initializeCompactHelp() {
    pane.querySelectorAll(".label-sheet-step > summary").forEach((summary) => {
      const help = summary.querySelector("small");
      const copy = cleanText(help?.textContent);
      if (!copy) return;
      summary.dataset.compactHelp = "true";
      summary.title = copy;
      summary.setAttribute("aria-description", copy);
    });
    pane.querySelectorAll(".label-sheet-field > small:not([id]), .label-sheet-intent-card small").forEach((help) => {
      const host = help.closest("label");
      const copy = cleanText(help.textContent);
      if (!host || !copy) return;
      host.dataset.compactHelp = "true";
      host.dataset.help = copy;
      if (!host.title) host.title = copy;
      host.setAttribute("aria-description", copy);
    });
  }

  function flowStepCopy(goalInput = project.settings?.outputGoal) {
    const goal = normalizeOutputGoal(goalInput);
    return {
      intent: { label: "목표", title: "제작 목표 선택", meta: "결과물·품목·출력 면을 정하세요." },
      spec: { label: "규격", title: "용지와 제품 규격", meta: "A4 방향과 라벨 배치를 확인하세요." },
      data: { label: "데이터", title: "라벨 데이터 입력", meta: "연번·표·CSV를 같은 목록으로 관리합니다." },
      design: goal === "prompt"
        ? { label: "프롬프트 설계", title: "디자인 DNA와 문구 구조", meta: "모든 페이지가 공유할 시각 규칙을 정하세요." }
        : { label: "화면 편집", title: "선택 티켓 확대 편집", meta: "문구·QR을 큰 작업대에서 바로 조정하세요." },
      output: goal === "prompt"
        ? { label: "페이지·라벨 복사", title: "페이지별 프롬프트 복사", meta: "현재 페이지를 복사하고 다음 페이지로 이어가세요." }
        : { label: "검토·출력", title: "완성물 검토와 저장", meta: "미리보기 확인 후 PNG·PDF·인쇄로 저장하세요." },
    };
  }

  function updateFlowContextBar() {
    const copy = flowStepCopy();
    const index = Math.max(0, FLOW_STEP_KEYS.indexOf(flowActiveStep));
    const current = copy[flowActiveStep] || copy.intent;
    const previous = copy[FLOW_STEP_KEYS[index - 1]];
    const next = copy[FLOW_STEP_KEYS[index + 1]];
    if ($("labelSheetContextTitle")) $("labelSheetContextTitle").textContent = `${index + 1}/5 · ${current.title}`;
    if ($("labelSheetContextMeta")) $("labelSheetContextMeta").textContent = current.meta;
    const previousButton = $("labelSheetContextPrevBtn");
    const nextButton = $("labelSheetContextNextBtn");
    if (previousButton) {
      previousButton.hidden = !previous;
      previousButton.textContent = previous ? `이전 · ${previous.label}` : "이전";
    }
    if (nextButton) {
      nextButton.hidden = !next;
      nextButton.textContent = next ? `다음 · ${next.label}` : "다음";
    }
    if ($("labelSheetContextBar")) $("labelSheetContextBar").dataset.step = flowActiveStep;
  }

  function moveFlowStep(direction) {
    const currentIndex = Math.max(0, FLOW_STEP_KEYS.indexOf(flowActiveStep));
    const nextIndex = Math.min(FLOW_STEP_KEYS.length - 1, Math.max(0, currentIndex + direction));
    if (nextIndex === currentIndex) return;
    activateFlowStep(FLOW_STEP_KEYS[nextIndex], { focus: true });
  }

  function updateProgressState(activeStep = flowActiveStep) {
    flowActiveStep = FLOW_STEP_KEYS.includes(activeStep) ? activeStep : "intent";
    const geometryValid = ENGINE.validateGeometry(project.spec).valid;
    const hasRecords = project.records.some((record) => !record.data?.excluded);
    const completed = {
      intent: true,
      spec: geometryValid,
      data: hasRecords,
      design: hasRecords && Boolean(
        cleanText(project.settings?.frontTitle)
        || cleanText(project.settings?.frontBody)
        || cleanText(project.settings?.backgroundPrompt)
        || project.records.some((record) => cleanText(record.front?.title) || cleanText(record.front?.backgroundAssetId)),
      ),
      output: false,
    };
    pane.querySelectorAll("[data-label-sheet-progress]").forEach((item) => {
      const step = item.dataset.labelSheetProgress;
      const active = step === flowActiveStep;
      item.classList.toggle("is-active", active);
      item.classList.toggle("is-complete", Boolean(completed[step]));
      const button = item.querySelector("button");
      if (button) {
        if (active) button.setAttribute("aria-current", "step");
        else button.removeAttribute("aria-current");
      }
    });
    updateResultHeaderCopy();
    const stepChanged = pane.dataset.activeStep !== flowActiveStep;
    pane.dataset.activeStep = flowActiveStep;
    updateFlowContextBar();
    if (stepChanged) {
      window.dispatchEvent(new CustomEvent("promptdeck:label-sheet-step-change", { detail: { step: flowActiveStep } }));
    }
  }

  function setFlowDetailsState(targetStep) {
    const goal = normalizeOutputGoal(project.settings?.outputGoal);
    const details = Array.from(pane.querySelectorAll("details[data-label-sheet-step]"));
    const wysiwygDetails = $("labelSheetWysiwygDetails");
    flowNavigationBusy = true;
    window.cancelAnimationFrame(flowNavigationFrame);

    if (flowShowAll) {
      details.forEach((item) => { item.open = true; });
    } else {
      details.forEach((item) => { item.open = false; });
      if (targetStep === "spec" || targetStep === "data") {
        const targetDetails = details.find((item) => item.dataset.labelSheetStep === targetStep);
        if (targetDetails) targetDetails.open = true;
      } else if (targetStep === "design") {
        const designPart = goal === "prompt" ? "background" : "content";
        const targetDetails = details.find((item) => item.dataset.labelSheetStep === "design" && item.dataset.labelSheetDesignPart === designPart);
        if (targetDetails) targetDetails.open = true;
      }
    }

    if (wysiwygDetails) wysiwygDetails.open = targetStep === "design" && goal === "print" && (flowShowAll || focusToolPanel === "detail");
    flowNavigationFrame = window.requestAnimationFrame(() => { flowNavigationBusy = false; });
  }

  function flowTargetForStep(targetStep) {
    const goal = normalizeOutputGoal(project.settings?.outputGoal);
    if (targetStep === "intent") return $("labelSheetIntentPanel");
    if (targetStep === "spec") return $("labelSheetSpecStep");
    if (targetStep === "data") return $("labelSheetDataStep");
    if (targetStep === "design") {
      return goal === "print" ? ($("labelSheetFocusEditor") || $("labelSheetPreviewToolbar")) : $("labelSheetDesignBackgroundStep");
    }
    return $("labelSheetResultCard") || pane.querySelector(".label-sheet-action-dock");
  }

  function scrollToFlowTarget(target, options = {}) {
    if (!target) return;
    window.requestAnimationFrame(() => {
      const headerBottom = document.querySelector(".app-header")?.getBoundingClientRect().bottom || 0;
      const tabsBottom = document.querySelector(".app-tabs-bar")?.getBoundingClientRect().bottom || 0;
      const stickyBottom = Math.max(headerBottom, tabsBottom, 0);
      const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - stickyBottom - 14);
      window.scrollTo({ top, behavior: options.instant ? "auto" : "smooth" });
      if (options.focus === true) {
        const focusTarget = target.id === "labelSheetIntentPanel"
          ? target.querySelector('input[name="labelSheetOutputGoal"]')
          : target.matches("details")
            ? target.querySelector(":scope > summary")
            : target.querySelector("summary, input, select, button");
        focusTarget?.focus({ preventScroll: true });
      }
    });
  }

  function activateFlowStep(step, options = {}) {
    const targetStep = FLOW_STEP_KEYS.includes(step) ? step : "intent";
    setFlowDetailsState(targetStep);
    if (targetStep === "design" && normalizeOutputGoal(project.settings?.outputGoal) === "print" && !wysiwygEnabled) toggleWysiwyg();
    const target = flowTargetForStep(targetStep);
    updateProgressState(targetStep);
    if (options.scroll !== false) scrollToFlowTarget(target, options);
  }

  function setFlowShowAll(nextValue, options = {}) {
    flowShowAll = Boolean(nextValue);
    pane.dataset.flowView = flowShowAll ? "all" : "guided";
    const button = $("labelSheetToggleAllStepsBtn");
    if (button) {
      button.setAttribute("aria-pressed", String(flowShowAll));
      button.textContent = flowShowAll ? "단계별 보기" : "전체 설정 보기";
    }
    if (flowShowAll) setFlowDetailsState(flowActiveStep);
    else activateFlowStep(flowActiveStep, { scroll: false });
    if (options.announce !== false) {
      setStatus(flowShowAll ? "모든 세부 설정을 펼쳤습니다." : "현재 단계만 펼쳐 작업 흐름을 간결하게 정리했습니다.", "success");
    }
  }

  function updatePromptModeAvailability(goalInput) {
    const goal = normalizeOutputGoal(goalInput);
    const select = $("labelSheetPromptMode");
    if (!select) return;
    select.value = "integrated";
    select.disabled = goal !== "prompt";
    const privacy = $("labelSheetPromptPrivacyStatus");
    if (privacy) {
      privacy.textContent = "실제 문구·번호가 포함됩니다. QR 이미지는 생성하지 않고 선택한 위치와 크기만큼 깨끗한 합성 공간을 남깁니다.";
      privacy.dataset.tone = "warning";
    }
  }

  function applyOutputGoalUi(goalInput, options = {}) {
    const goal = normalizeOutputGoal(goalInput);
    const previous = pane.dataset.outputGoal;
    project.settings = { ...(project.settings || {}), outputGoal: goal };
    pane.dataset.outputGoal = goal;
    pane.querySelectorAll('input[name="labelSheetOutputGoal"]').forEach((radio) => {
      radio.checked = radio.value === goal;
    });
    updateResultHeaderCopy();
    if ($("labelSheetProgressDesignLabel")) $("labelSheetProgressDesignLabel").textContent = goal === "prompt" ? "프롬프트 설계" : "화면 편집";
    if ($("labelSheetProgressOutputLabel")) $("labelSheetProgressOutputLabel").textContent = goal === "prompt" ? "페이지·라벨 복사" : "검토·출력";
    if ($("labelSheetStepDesignBtn")) {
      $("labelSheetStepDesignBtn").setAttribute("aria-controls", goal === "prompt" ? "labelSheetDesignBackgroundStep" : "labelSheetFocusEditor");
    }
    if ($("labelSheetPreflightDescription")) {
      $("labelSheetPreflightDescription").textContent = goal === "prompt"
        ? "페이지 수, 실제 문구, 연번과 QR 예약 공간을 점검합니다. QR 값 자체는 프롬프트에 포함하지 않습니다."
        : "치명적 오류는 해결하기 전까지 PNG·PDF 출력을 막습니다.";
    }
    const backgroundCopy = {
      print: ["배경 이미지 등록·맞춤", "출력에 사용할 실제 이미지를 등록하고 크기와 배정 범위를 맞춥니다."],
      prompt: ["전체 이미지 디자인 DNA", "문구·연번·QR 예약 영역과 조화를 이루는 전체 이미지의 공통 시각 규칙을 정합니다."],
    }[goal];
    if ($("labelSheetBackgroundStepTitle")) $("labelSheetBackgroundStepTitle").textContent = backgroundCopy[0];
    if ($("labelSheetBackgroundStepDescription")) $("labelSheetBackgroundStepDescription").textContent = backgroundCopy[1];
    const promptButton = $("labelSheetGeneratePromptBtn");
    const pngButton = $("labelSheetExportPngBtn");
    const pdfButton = $("labelSheetExportPdfBtn");
    const printButton = $("labelSheetPrintBtn");
    if (promptButton) {
      promptButton.hidden = goal === "print";
      promptButton.className = `btn ${goal === "prompt" ? "primary" : "secondary"}`;
    }
    if (pngButton) pngButton.hidden = goal === "prompt";
    if (pdfButton) pdfButton.hidden = goal === "prompt";
    if (printButton) {
      printButton.hidden = goal === "prompt";
      printButton.className = `btn ${goal === "print" ? "primary" : "secondary"}`;
    }
    if ($("labelSheetAssetStepState")) {
      $("labelSheetAssetStepState").textContent = goal === "prompt" ? "DNA 준비" : `${assetStore.list().length}개`;
    }
    updatePromptModeAvailability(goal);
    updateQrControlState(goal);
    updateSequenceControlState();
    updateIntentSummary();
    updateProgressState();
    if (flowActiveStep === "design" && !flowShowAll) setFlowDetailsState("design");
    if (previous !== goal) window.dispatchEvent(new CustomEvent("promptdeck:label-sheet-goal-change", { detail: { goal } }));
    if (options.announce) setStatus(`${OUTPUT_GOALS[goal].label} 중심으로 화면을 정리했습니다.`, "success");
    if (options.save !== false) queueSave();
    return goal;
  }

  function restoreProject() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const restored = saved ? ENGINE.deserializeProject(saved) : ENGINE.createDefaultProject();
      if (!window.localStorage.getItem(CONTRAST_MIGRATION_KEY)) {
        if (restored.settings?.textContrast === "light") restored.settings.textContrast = "auto";
        window.localStorage.setItem(CONTRAST_MIGRATION_KEY, "1");
      }
      return restored;
    } catch (_error) {
      return ENGINE.createDefaultProject();
    }
  }

  function setStatus(message, tone = "") {
    const element = $("labelSheetStatus");
    if (!element) return;
    element.textContent = message;
    element.dataset.tone = tone;
  }

  function setImportStatus(message, tone = "") {
    const element = $("labelSheetImportStatus");
    if (!element) return;
    element.textContent = message;
    element.dataset.tone = tone;
  }

  function setAssetStatus(message, tone = "") {
    const element = $("labelSheetAssetStatus");
    if (!element) return;
    element.textContent = message;
    element.dataset.tone = tone;
  }

  function setElementStatus(id, message, tone = "") {
    const element = $(id);
    if (!element) return;
    element.textContent = message;
    element.dataset.tone = tone;
  }

  function setOutputActionStatus(message, tone = "") {
    setElementStatus("labelSheetActionDockStatus", message, tone);
  }

  function queueSave() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(saveProject, 180);
  }

  function projectAssetMetadata() {
    return assetStore.list().map((asset) => ({
      assetId: asset.assetId,
      id: asset.assetId,
      filename: asset.filename,
      fileName: asset.filename,
      name: asset.filename,
      mime: asset.mime,
      width: asset.width,
      height: asset.height,
      status: asset.status,
      warnings: asset.warnings,
    }));
  }

  function saveProject() {
    try {
      project.assets = projectAssetMetadata();
      project.updatedAt = new Date().toISOString();
      window.localStorage.setItem(STORAGE_KEY, ENGINE.serializeProject(project, 0));
    } catch (_error) {
      setStatus("프로젝트 자동 저장 공간이 부족합니다. 이미지 원본은 별도 보관함에 유지됩니다.", "warning");
    }
  }

  function fillPresetOptions() {
    const select = $("labelSheetPreset");
    if (!select) return;
    select.replaceChildren();
    PRESETS.list().forEach((preset) => {
      const option = document.createElement("option");
      option.value = preset.id;
      option.textContent = preset.label;
      select.appendChild(option);
    });
    const desired = cleanText(project.settings?.presetId);
    select.value = PRESETS.get(desired) ? desired : project.spec.page.orientation === "landscape" ? "custom-a4-landscape" : "custom-a4-portrait";
  }

  function defaultQrSettings() {
    return {
      enabled: false,
      side: "front",
      source: "record",
      template: "",
      assignScope: "selected",
      position: "right",
      layoutMode: "adaptive",
      gapPercent: 2,
      layer: "front",
      sizePercent: 28,
      margin: 4,
      ecc: "M",
      darkColor: "#000000",
      lightColor: "#ffffff",
      roundDots: false,
      customEye: false,
      eyeColor: "#000000",
      contrastProtection: true,
    };
  }

  function normalizeQrSettings(input = {}) {
    const base = { ...defaultQrSettings(), ...(input || {}) };
    return {
      ...base,
      enabled: Boolean(base.enabled),
      side: ["front", "back", "both"].includes(base.side) ? base.side : "front",
      source: ["record", "number", "id", "template"].includes(base.source) ? base.source : "record",
      assignScope: ["selected", "all", "missing"].includes(base.assignScope) ? base.assignScope : "selected",
      position: ["left", "right", "top-left", "top-right", "bottom-left", "bottom-right", "center"].includes(base.position) ? base.position : "right",
      layoutMode: ["adaptive", "reserved", "overlay"].includes(base.layoutMode) ? base.layoutMode : "adaptive",
      gapPercent: clamp(base.gapPercent ?? 2, 0, 12),
      layer: base.layer === "behind" ? "behind" : "front",
      sizePercent: Math.min(48, Math.max(16, Number(base.sizePercent) || 28)),
      margin: Math.min(12, Math.max(2, Math.trunc(Number(base.margin) || 4))),
      ecc: ["L", "M", "Q", "H"].includes(base.ecc) ? base.ecc : "M",
      contrastProtection: base.contrastProtection !== false,
    };
  }

  function defaultOutputVisibility() {
    return Object.fromEntries(["front", "back"].map((sideName) => [
      sideName,
      Object.fromEntries(OUTPUT_FIELD_KEYS.map((fieldName) => [fieldName, true])),
    ]));
  }

  function normalizeOutputVisibility(input = {}) {
    return Object.fromEntries(["front", "back"].map((sideName) => [
      sideName,
      Object.fromEntries(OUTPUT_FIELD_KEYS.map((fieldName) => [fieldName, input?.[sideName]?.[fieldName] !== false])),
    ]));
  }

  function outputVisibilityControlId(sideName, fieldName) {
    const side = sideName === "back" ? "Back" : "Front";
    const field = `${fieldName.slice(0, 1).toUpperCase()}${fieldName.slice(1)}`;
    return `labelSheet${side}${field}Visible`;
  }

  function fillVisualStyleOptions() {
    const select = $("labelSheetVisualStyle");
    if (!select || !VISUAL_STYLES?.listDiagramStyles) return;
    const current = cleanText(project.settings?.visualStyleId);
    select.replaceChildren();
    const base = document.createElement("option");
    base.value = "";
    base.textContent = "기본 라벨 스타일";
    select.appendChild(base);
    const groups = new Map();
    VISUAL_STYLES.listDiagramStyles({ mode: "all", scope: "visual" }).forEach((style) => {
      const label = cleanText(style.categoryLabel) || "기타";
      if (!groups.has(label)) {
        const group = document.createElement("optgroup");
        group.label = label;
        groups.set(label, group);
        select.appendChild(group);
      }
      const option = document.createElement("option");
      option.value = style.id;
      option.textContent = `${style.nameKo}${style.nameEn ? ` · ${style.nameEn}` : ""}`;
      groups.get(label).appendChild(option);
    });
    select.value = Array.from(select.options).some((option) => option.value === current) ? current : "";
  }

  function dnaStyleScope() {
    return value("labelSheetDnaScope") === "composition" ? "composition" : "visual";
  }

  function dnaStyleMatches() {
    if (!VISUAL_STYLES?.listDiagramStyles) return [];
    const category = dnaStyleBrowser.category;
    return VISUAL_STYLES.listDiagramStyles({
      mode: category === "compatible" ? "compatible" : "all",
      category: ["all", "recommended", "compatible"].includes(category) ? "all" : category,
      query: dnaStyleBrowser.query,
      scope: dnaStyleScope(),
    }).filter((contract) => category !== "recommended" || contract.recommended);
  }

  function updateDnaSummary() {
    const snapshot = project.settings?.visualStyleSnapshot;
    const summary = $("labelSheetDnaSummary");
    if (!summary) return;
    if (!snapshot) {
      summary.textContent = "기본 라벨 디자인을 사용합니다. 갤러리에서 스타일을 고르면 색·표면·타이포그래피와 구성 리듬이 여기에 요약됩니다.";
      return;
    }
    const composition = snapshot.composition || {};
    const palette = snapshot.palette || {};
    const colors = [palette.background, palette.surface, palette.accent, palette.textPrimary].filter(Boolean).join(" · ");
    summary.textContent = [
      snapshot.description || `${snapshot.nameKo || snapshot.name || "선택 스타일"} DNA`,
      colors ? `팔레트 ${colors}` : "",
      dnaStyleScope() === "composition" && composition.spatialRhythm ? `구성 리듬 ${composition.spatialRhythm}` : "",
      "실제 문구의 가독성과 QR 예약 공간을 우선합니다.",
    ].filter(Boolean).join(" · ");
  }

  function makeDnaStyleCard(contract, compact = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = compact ? "diagram-slide-style-card" : "diagram-style-browser-card";
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", String(contract.id === project.settings?.visualStyleId));
    button.dataset.labelSheetDnaStyleId = contract.id;
    button.title = `${contract.nameKo || contract.nameEn || contract.id} · ${contract.description || ""}`;
    const preview = document.createElement("span");
    preview.className = compact ? "diagram-slide-style-preview" : "diagram-style-browser-preview";
    const image = document.createElement("img");
    image.src = contract.previewImage;
    image.alt = "";
    image.loading = "lazy";
    image.addEventListener("error", () => image.remove(), { once: true });
    preview.appendChild(image);
    if (compact) {
      const label = document.createElement("strong");
      label.textContent = contract.nameKo || contract.nameEn || contract.id;
      button.append(preview, label);
    } else {
      if (contract.recommended) {
        const badge = document.createElement("em");
        badge.textContent = "추천";
        preview.appendChild(badge);
      }
      const copy = document.createElement("span");
      copy.className = "diagram-style-browser-copy";
      const label = document.createElement("strong");
      label.textContent = contract.nameKo || contract.nameEn || contract.id;
      const category = document.createElement("small");
      category.textContent = contract.categoryLabel || "비주얼 스타일";
      const description = document.createElement("span");
      description.textContent = contract.description || "라벨 이미지에 공유할 디자인 DNA";
      copy.append(label, category, description);
      button.append(preview, copy);
    }
    button.addEventListener("click", () => {
      setControl("labelSheetVisualStyle", contract.id);
      applyGalleryVisualStyle();
      renderDnaFeaturedGallery();
      renderDnaDialog();
    });
    return button;
  }

  function renderDnaFeaturedGallery() {
    const gallery = $("labelSheetDnaFeaturedGallery");
    if (!gallery || !VISUAL_STYLES?.listDiagramStyles) return;
    const featured = VISUAL_STYLES.listDiagramStyles({ limit: 8, scope: dnaStyleScope() });
    const selected = project.settings?.visualStyleId ? VISUAL_STYLES.get?.(project.settings.visualStyleId, dnaStyleScope()) : null;
    const visible = selected && !featured.some((item) => item.id === selected.id) ? [selected, ...featured.slice(0, 7)] : featured;
    gallery.replaceChildren(...visible.map((contract) => makeDnaStyleCard(contract, true)));
    if ($("labelSheetDnaGalleryCount")) {
      const total = VISUAL_STYLES.counts?.total || VISUAL_STYLES.listDiagramStyles({ mode: "all", scope: dnaStyleScope() }).length;
      $("labelSheetDnaGalleryCount").textContent = `추천 ${featured.length}개 · 전체 ${total}개`;
    }
    updateDnaSummary();
  }

  function renderDnaDialog() {
    const dialog = $("labelSheetDnaDialog");
    if (!dialog || dialog.hidden || !VISUAL_STYLES?.listDiagramStyles) return;
    const all = VISUAL_STYLES.listDiagramStyles({ mode: "all", scope: dnaStyleScope() });
    const categories = [
      { id: "all", label: "전체", count: all.length },
      { id: "recommended", label: "추천", count: all.filter((item) => item.recommended).length },
      { id: "compatible", label: "구성 적합", count: VISUAL_STYLES.listDiagramStyles({ mode: "compatible", scope: dnaStyleScope() }).length },
      ...Array.from(VISUAL_STYLES.categories || []).map((category) => ({
        ...category,
        count: VISUAL_STYLES.listDiagramStyles({ mode: "all", category: category.id, scope: dnaStyleScope() }).length,
      })),
    ];
    $("labelSheetDnaCategories")?.replaceChildren(...categories.map((category) => {
      const button = document.createElement("button");
      const selected = category.id === dnaStyleBrowser.category;
      button.type = "button";
      button.className = "diagram-style-category";
      button.dataset.labelSheetDnaCategory = category.id;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      button.textContent = `${category.label} ${category.count}`;
      return button;
    }));
    const matches = dnaStyleMatches();
    const visible = matches.slice(0, dnaStyleBrowser.visible);
    $("labelSheetDnaAllGrid")?.replaceChildren(...visible.map((contract) => makeDnaStyleCard(contract)));
    if ($("labelSheetDnaResultCount")) {
      $("labelSheetDnaResultCount").textContent = `${dnaStyleBrowser.query ? `“${dnaStyleBrowser.query}” 검색` : "선택한 분류"} ${matches.length}개 · ${visible.length}개 표시`;
    }
    const selected = project.settings?.visualStyleSnapshot;
    if ($("labelSheetDnaSelection")) $("labelSheetDnaSelection").textContent = `현재 선택: ${selected?.nameKo || selected?.name || "기본 라벨"}`;
    if ($("labelSheetDnaEmpty")) $("labelSheetDnaEmpty").hidden = matches.length > 0;
    const loadMore = $("labelSheetDnaLoadMoreBtn");
    if (loadMore) {
      const remaining = Math.max(0, matches.length - visible.length);
      loadMore.hidden = remaining === 0;
      loadMore.textContent = `더 보기 (${remaining}개 남음)`;
    }
    const search = $("labelSheetDnaSearch");
    if (search && search.value !== dnaStyleBrowser.query) search.value = dnaStyleBrowser.query;
    if ($("labelSheetDnaSearchClear")) $("labelSheetDnaSearchClear").hidden = !dnaStyleBrowser.query;
  }

  function openDnaDialog() {
    const dialog = $("labelSheetDnaDialog");
    if (!dialog || !VISUAL_STYLES) return;
    const assetsDrawer = $("labelSheetWorkspaceAssetsDrawer");
    const assetsDrawerWasOpen = assetsDrawer?.dataset.open === "true" || assetsDrawer?.hasAttribute("open");
    dnaStyleBrowser.returnFocus = document.activeElement;
    if (assetsDrawerWasOpen) {
      dialog.dataset.restoreWorkspaceAssets = "true";
      assetsDrawer.querySelector("[data-label-workspace-drawer-close]")?.click();
    } else {
      delete dialog.dataset.restoreWorkspaceAssets;
    }
    dnaStyleBrowser.visible = DNA_STYLE_BATCH_SIZE;
    if (dialog.parentElement !== document.body) document.body.appendChild(dialog);
    dialog.hidden = false;
    document.body.classList.add("label-sheet-dna-dialog-open", "diagram-style-dialog-open");
    $("labelSheetOpenDnaGalleryBtn")?.setAttribute("aria-expanded", "true");
    renderDnaDialog();
    window.setTimeout(() => $("labelSheetDnaSearch")?.focus(), 0);
  }

  function closeDnaDialog() {
    const dialog = $("labelSheetDnaDialog");
    if (!dialog || dialog.hidden) return;
    const restoreWorkspaceAssets = dialog.dataset.restoreWorkspaceAssets === "true";
    delete dialog.dataset.restoreWorkspaceAssets;
    dialog.hidden = true;
    document.body.classList.remove("label-sheet-dna-dialog-open", "diagram-style-dialog-open");
    $("labelSheetOpenDnaGalleryBtn")?.setAttribute("aria-expanded", "false");
    const returnFocus = dnaStyleBrowser.returnFocus;
    dnaStyleBrowser.returnFocus = null;
    if (restoreWorkspaceAssets && $("paneLabelSheet")?.classList.contains("active")) {
      window.setTimeout(() => $("labelSheetWorkspaceAssetsMenu")?.click(), 0);
    } else if (returnFocus instanceof HTMLElement && returnFocus.isConnected) {
      returnFocus.focus();
    }
  }

  function updateQrControlState(goalInput = selectedRadioValue("labelSheetOutputGoal", project.settings?.outputGoal)) {
    const goal = normalizeOutputGoal(goalInput);
    const promptOnly = goal === "prompt";
    const toggle = $("labelSheetQrEnabled");
    if (toggle) toggle.disabled = false;
    const enabled = checked("labelSheetQrEnabled");
    const section = $("labelSheetQrSection");
    if (section) {
      section.dataset.available = "true";
      section.dataset.mode = promptOnly ? "reservation" : "render";
    }
    const advanced = $("labelSheetQrAdvanced");
    const controls = $("labelSheetQrControls");
    if (controls) controls.dataset.enabled = String(enabled);
    ["labelSheetQrSide", "labelSheetQrPosition", "labelSheetQrSize", "labelSheetQrMargin", "labelSheetQrLayoutMode"].forEach((id) => {
      if ($(id)) $(id).disabled = !enabled;
    });
    ["labelSheetQrSource", "labelSheetQrTemplate", "labelSheetQrAssignScope", "labelSheetUseQrStyleBtn", "labelSheetQrAssignBtn", "labelSheetQrUseCurrentBtn", "labelSheetQrClearBtn"].forEach((id) => {
      if ($(id)) $(id).disabled = !enabled || promptOnly;
    });
    pane.querySelectorAll("[data-label-sheet-qr-token]").forEach((button) => {
      button.disabled = !enabled || promptOnly;
    });
    if ($("labelSheetQrTitle")) $("labelSheetQrTitle").textContent = promptOnly ? "QR 합성 공간" : "출력용 QR코드";
    if ($("labelSheetQrDescription")) {
      $("labelSheetQrDescription").textContent = promptOnly
        ? "실제 QR은 만들지 않고, 나중에 합성할 위치·크기만큼 비어 있는 정사각형 안전 영역을 프롬프트에 지정합니다."
        : "QR을 켠 라벨만 문구 영역을 자동으로 줄이고, QR이 없으면 문구가 전체 폭을 사용합니다.";
    }
    if ($("labelSheetQrAdvancedSummary")) $("labelSheetQrAdvancedSummary").textContent = promptOnly ? "QR 예약 위치·크기 설정" : "QR 데이터·배치 세부 설정";
    if ($("labelSheetQrAvailability")) {
      $("labelSheetQrAvailability").textContent = promptOnly
        ? "프롬프트에는 QR 값이나 가짜 QR 무늬를 넣지 않습니다. 선택한 면·위치·크기에 깨끗한 합성 공간만 예약합니다."
        : "PNG·PDF 출력에서 실제 스캔 가능한 QR을 합성합니다. QR이 없는 라벨은 빈자리 없이 문구가 전체 폭을 사용합니다.";
    }
    if ($("labelSheetQrStatus")) {
      $("labelSheetQrStatus").textContent = promptOnly
        ? enabled ? "QR 합성 공간을 예약했습니다. 페이지·개별 프롬프트에서 위치와 크기를 확인하세요." : "QR 공간을 끄면 문구와 배경 구성이 전체 안전 영역을 사용합니다."
        : enabled ? "QR 합성을 켰습니다. 데이터 원본과 적용 면을 확인해 주세요." : "QR을 끄면 배정값은 보존되지만 미리보기·PNG·인쇄에서는 완전히 제외됩니다.";
    }
    updateQrAssignmentPreview();
  }

  function sequenceMode() {
    return value("labelSheetSequenceMode") === "none" ? "none" : "sequence";
  }

  function updateSequenceControlState(options = {}) {
    const unnumbered = sequenceMode() === "none";
    pane.querySelectorAll("[data-label-sheet-sequence-number-field]").forEach((field) => {
      field.hidden = unnumbered;
      field.querySelectorAll("input,select").forEach((control) => { control.disabled = unnumbered; });
    });
    const countField = $("labelSheetRecordCountField");
    if (countField) countField.hidden = !unnumbered;
    if ($("labelSheetRecordCount")) $("labelSheetRecordCount").disabled = !unnumbered;
    if ($("labelSheetApplySequenceBtn")) $("labelSheetApplySequenceBtn").textContent = "지금 다시 적용";
    if (options.updateSummary !== false && $("labelSheetSequenceSummary")) {
      if (unnumbered) {
        const count = Math.max(1, Math.trunc(numberValue("labelSheetRecordCount", 24)));
        $("labelSheetSequenceSummary").textContent = `연번 없음 · ${count}건 · 자동 반영`;
      } else {
        const start = Math.trunc(numberValue("labelSheetStartNumber", 1));
        const end = Math.trunc(numberValue("labelSheetEndNumber", start));
        const count = Math.abs(end - start) + 1;
        $("labelSheetSequenceSummary").textContent = `${value("labelSheetPrefix")}${start}~${end}${value("labelSheetSuffix")} · ${count}건 · 자동 반영`;
      }
    }
  }

  function rightMarginFor(spec) {
    const grid = spec.grid;
    return Math.max(0, spec.page.widthMm - (grid.offsetLeftMm + (grid.columns - 1) * grid.pitchXmm + grid.labelWidthMm));
  }

  function bottomMarginFor(spec) {
    const grid = spec.grid;
    return Math.max(0, spec.page.heightMm - (grid.offsetTopMm + (grid.rows - 1) * grid.pitchYmm + grid.labelHeightMm));
  }

  function setControl(id, input) {
    const element = $(id);
    if (element) element.value = String(input ?? "");
  }

  function setSpecControls(spec) {
    setControl("labelSheetOrientation", spec.page.orientation);
    setControl("labelSheetDpi", spec.dpi);
    setControl("labelSheetColumns", spec.grid.columns);
    setControl("labelSheetRows", spec.grid.rows);
    setControl("labelSheetMarginTop", rounded(spec.grid.offsetTopMm));
    setControl("labelSheetMarginRight", rounded(rightMarginFor(spec)));
    setControl("labelSheetMarginBottom", rounded(bottomMarginFor(spec)));
    setControl("labelSheetMarginLeft", rounded(spec.grid.offsetLeftMm));
    setControl("labelSheetGapX", rounded(spec.grid.gapXmm));
    setControl("labelSheetGapY", rounded(spec.grid.gapYmm));
    setControl("labelSheetFirstSlot", Math.max(1, Number(spec.firstSheetStartSlot) + 1));
    setControl("labelSheetSkippedSlots", formatSlotExpression(spec.firstSheetSkippedSlots));
    setControl("labelSheetFlowOrder", spec.fillOrder === "column-major" ? "column" : "row");
    setControl("labelSheetFlipEdge", project.settings?.manualDuplex ? "manual" : spec.duplex.flipEdge);
    setControl("labelSheetBackTransform", transformToUi(spec.duplex.backTransform));
    setControl("labelSheetBackOffsetX", spec.duplex.offsetXmm);
    setControl("labelSheetBackOffsetY", spec.duplex.offsetYmm);
    const duplex = Boolean(spec.duplex.enabled);
    setDuplexMode(duplex);
  }

  function setSettingsControls() {
    const settings = project.settings || {};
    settings.textLayouts = normalizeTextLayouts(settings.textLayouts);
    settings.recordTextLayouts = normalizeRecordTextLayouts(settings.recordTextLayouts);
    settings.dataMapping = DATA_MAPPING.normalizeMapping(settings.dataMapping);
    draftMapping = DATA_MAPPING.normalizeMapping(settings.dataMapping);
    setControl("labelSheetSafeArea", settings.safeAreaMm ?? 2);
    setControl("labelSheetBleed", settings.bleedMm ?? 0);
    setControl("labelSheetFrontTitle", settings.frontTitle ?? "");
    setControl("labelSheetFrontSubtitle", settings.frontSubtitle ?? "");
    setControl("labelSheetFrontBody", settings.frontBody ?? "");
    setControl("labelSheetFrontFooter", settings.frontFooter ?? "");
    setControl("labelSheetBackTitle", settings.backTitle ?? "");
    setControl("labelSheetBackSubtitle", settings.backSubtitle ?? "");
    setControl("labelSheetBackBody", settings.backBody ?? "");
    setControl("labelSheetBackFooter", settings.backFooter ?? "");
    const outputVisibility = normalizeOutputVisibility(settings.outputVisibility);
    ["front", "back"].forEach((sideName) => OUTPUT_FIELD_KEYS.forEach((fieldName) => {
      const control = $(outputVisibilityControlId(sideName, fieldName));
      if (control) control.checked = outputVisibility[sideName][fieldName];
    }));
    setControl("labelSheetBackgroundPrompt", settings.backgroundPrompt ?? "");
    setControl("labelSheetDocumentType", settings.documentType ?? "label");
    syncIntentDocumentType(settings.documentType ?? "label");
    setControl("labelSheetContentOrientation", settings.contentOrientation ?? "auto");
    setControl("labelSheetTextAlign", settings.textAlign ?? "center");
    setControl("labelSheetTextVerticalAlign", settings.textVerticalAlign ?? "top");
    setControl("labelSheetTextScale", clamp(settings.textScalePercent ?? 100, 70, 160));
    setControl("labelSheetTextContrast", settings.textContrast ?? "auto");
    const inferredSequenceMode = project.records.length && project.records.every((record) => !cleanText(record.number)) ? "none" : "sequence";
    setControl("labelSheetSequenceMode", settings.sequenceMode === "none" ? "none" : settings.sequenceMode === "sequence" ? "sequence" : inferredSequenceMode);
    setControl("labelSheetRecordCount", Math.max(1, project.records.length || 24));
    setControl("labelSheetImageFit", settings.imageFit ?? "cover");
    setControl("labelSheetFocalX", Math.round(Number(settings.focalPoint?.x ?? 0.5) * 100));
    setControl("labelSheetFocalY", Math.round(Number(settings.focalPoint?.y ?? 0.5) * 100));
    if ($("labelSheetAllowUpscale")) $("labelSheetAllowUpscale").checked = Boolean(settings.allowUpscale);
    setControl("labelSheetVisualStyle", settings.visualStyleId ?? "");
    const qr = normalizeQrSettings(settings.qr);
    const outputGoal = normalizeOutputGoal(settings.outputGoal);
    if ($("labelSheetQrEnabled")) $("labelSheetQrEnabled").checked = qr.enabled;
    setControl("labelSheetQrSide", qr.side);
    setControl("labelSheetQrSource", qr.source);
    setControl("labelSheetQrTemplate", qr.template);
    setControl("labelSheetQrAssignScope", qr.assignScope);
    setControl("labelSheetQrPosition", qr.position);
    setControl("labelSheetQrLayoutMode", qr.layoutMode);
    setControl("labelSheetQrSize", qr.sizePercent);
    setControl("labelSheetQrMargin", qr.margin);
    setControl("labelSheetGenerationDelay", Number(settings.generationDelayMs ?? GENERATION_DELAY_MS) / 1000);
    setControl("labelSheetGenerationRetries", settings.generationRetries ?? 1);
    const printJob = normalizePrintJob(settings.printJob);
    setControl("labelSheetPrintRangeMode", printJob.rangeMode);
    setControl("labelSheetPrintFrom", printJob.fromSheet);
    setControl("labelSheetPrintTo", printJob.toSheet);
    setControl("labelSheetPrintCopies", printJob.copies);
    updateSequenceControlState();
    updateTextScaleOutput();
    updateContrastStatus();
    const styleName = settings.visualStyleSnapshot?.nameKo || settings.visualStyleSnapshot?.name || "기본 스타일";
    setElementStatus("labelSheetStyleStatus", styleName, settings.visualStyleSnapshot ? "success" : "");
    updateFocalOutputs();
    updatePrintJobControls();
    applyOutputGoalUi(outputGoal, { save: false });
    updateOutputTemplatePreviews();
  }

  function rounded(input) {
    return Math.round(Number(input) * 1000) / 1000;
  }

  function transformToEngine(input) {
    return ({ "mirror-x": "mirrorX", "mirror-y": "mirrorY", "rotate-180": "rotate180" })[input] || input || "auto";
  }

  function transformToUi(input) {
    return ({ mirrorX: "mirror-x", mirrorY: "mirror-y", rotate180: "rotate-180" })[input] || input || "auto";
  }

  function transformToRenderer(input) {
    return ({ mirrorX: "mirror-x", mirrorY: "mirror-y", rotate180: "rotate-180" })[input] || input || "none";
  }

  function selectedPreset() {
    return PRESETS.get(value("labelSheetPreset"));
  }

  function setProductControlsLocked(locked) {
    [
      "labelSheetOrientation", "labelSheetColumns", "labelSheetRows", "labelSheetMarginTop",
      "labelSheetMarginRight", "labelSheetMarginBottom", "labelSheetMarginLeft", "labelSheetGapX", "labelSheetGapY",
    ].forEach((id) => {
      if ($(id)) $(id).disabled = locked;
    });
    const cloneButton = $("labelSheetClonePresetBtn");
    if (cloneButton) cloneButton.hidden = !locked;
  }

  function applyPreset(preset, options = {}) {
    if (!preset) return;
    if ($("labelSheetPreset")) $("labelSheetPreset").value = preset.id;
    setSpecControls(ENGINE.normalizeSpec({ ...preset, dpi: numberValue("labelSheetDpi", project.spec.dpi) }));
    setProductControlsLocked(preset.editable === false);
    project.settings.presetId = preset.id;
    if (!options.silent) onProjectControlsChanged("제품 규격을 적용했습니다.");
  }

  function collectSpec() {
    const preset = selectedPreset();
    const dpi = Math.max(72, numberValue("labelSheetDpi", 300));
    const firstSheetStartSlot = Math.max(0, Math.trunc(numberValue("labelSheetFirstSlot", 1)) - 1);
    const duplexEnabled = checked("labelSheetModeDuplex");
    const flipUi = value("labelSheetFlipEdge");
    const flipEdge = flipUi === "short" ? "short" : "long";
    const duplex = {
      enabled: duplexEnabled,
      flipEdge,
      backTransform: transformToEngine(value("labelSheetBackTransform")),
      offsetXmm: numberValue("labelSheetBackOffsetX", 0),
      offsetYmm: numberValue("labelSheetBackOffsetY", 0),
    };

    if (preset && preset.editable === false) {
      const parsedSkipped = parseSlotExpression(value("labelSheetSkippedSlots"), preset.grid.rows * preset.grid.columns);
      if (parsedSkipped.invalid.length) throw new Error(`건너뛸 칸 입력을 확인해 주세요: ${parsedSkipped.invalid.join(", ")}`);
      return ENGINE.normalizeSpec({
        ...preset,
        dpi,
        firstSheetStartSlot,
        firstSheetSkippedSlots: parsedSkipped.slots,
        fillOrder: value("labelSheetFlowOrder") === "column" ? "column-major" : "row-major",
        duplex,
      });
    }

    const orientation = value("labelSheetOrientation") === "landscape" ? "landscape" : "portrait";
    const page = PRESETS.A4[orientation];
    const columns = Math.max(1, Math.trunc(numberValue("labelSheetColumns", 3)));
    const rows = Math.max(1, Math.trunc(numberValue("labelSheetRows", 8)));
    const marginTopMm = Math.max(0, numberValue("labelSheetMarginTop", 10));
    const marginRightMm = Math.max(0, numberValue("labelSheetMarginRight", 10));
    const marginBottomMm = Math.max(0, numberValue("labelSheetMarginBottom", 10));
    const marginLeftMm = Math.max(0, numberValue("labelSheetMarginLeft", 10));
    const gapXmm = Math.max(0, numberValue("labelSheetGapX", 0));
    const gapYmm = Math.max(0, numberValue("labelSheetGapY", 0));
    const labelWidthMm = (page.widthMm - marginLeftMm - marginRightMm - gapXmm * (columns - 1)) / columns;
    const labelHeightMm = (page.heightMm - marginTopMm - marginBottomMm - gapYmm * (rows - 1)) / rows;
    const parsedSkipped = parseSlotExpression(value("labelSheetSkippedSlots"), rows * columns);
    if (parsedSkipped.invalid.length) throw new Error(`건너뛸 칸 입력을 확인해 주세요: ${parsedSkipped.invalid.join(", ")}`);
    return ENGINE.normalizeSpec({
      page: { size: "A4", orientation, widthMm: page.widthMm, heightMm: page.heightMm },
      grid: {
        rows,
        columns,
        labelWidthMm,
        labelHeightMm,
        offsetTopMm: marginTopMm,
        offsetLeftMm: marginLeftMm,
        pitchXmm: labelWidthMm + gapXmm,
        pitchYmm: labelHeightMm + gapYmm,
        gapXmm,
        gapYmm,
      },
      fillOrder: value("labelSheetFlowOrder") === "column" ? "column-major" : "row-major",
      firstSheetStartSlot,
      firstSheetSkippedSlots: parsedSkipped.slots,
      dpi,
      duplex,
    });
  }

  function syncProjectFromControls() {
    project.spec = collectSpec();
    const outputGoal = normalizeOutputGoal(selectedRadioValue("labelSheetOutputGoal", project.settings?.outputGoal));
    project.settings = {
      ...(project.settings || {}),
      presetId: value("labelSheetPreset"),
      safeAreaMm: Math.max(0, numberValue("labelSheetSafeArea", 2)),
      bleedMm: Math.max(0, numberValue("labelSheetBleed", 0)),
      frontTitle: value("labelSheetFrontTitle"),
      frontSubtitle: value("labelSheetFrontSubtitle"),
      frontBody: value("labelSheetFrontBody"),
      frontFooter: value("labelSheetFrontFooter"),
      backTitle: value("labelSheetBackTitle"),
      backSubtitle: value("labelSheetBackSubtitle"),
      backBody: value("labelSheetBackBody"),
      backFooter: value("labelSheetBackFooter"),
      outputVisibility: normalizeOutputVisibility(Object.fromEntries(["front", "back"].map((sideName) => [
        sideName,
        Object.fromEntries(OUTPUT_FIELD_KEYS.map((fieldName) => [fieldName, checked(outputVisibilityControlId(sideName, fieldName))])),
      ]))),
      backgroundPrompt: value("labelSheetBackgroundPrompt"),
      documentType: value("labelSheetDocumentType") || "label",
      outputGoal,
      manualDuplex: value("labelSheetFlipEdge") === "manual",
      sequenceMode: sequenceMode(),
      contentOrientation: value("labelSheetContentOrientation"),
      textAlign: value("labelSheetTextAlign"),
      textVerticalAlign: value("labelSheetTextVerticalAlign"),
      textScalePercent: clamp(numberValue("labelSheetTextScale", 100), 70, 160),
      textContrast: value("labelSheetTextContrast"),
      textLayouts: normalizeTextLayouts(project.settings?.textLayouts),
      recordTextLayouts: normalizeRecordTextLayouts(project.settings?.recordTextLayouts),
      dataMapping: DATA_MAPPING.normalizeMapping(project.settings?.dataMapping),
      imageFit: value("labelSheetImageFit"),
      focalPoint: { x: numberValue("labelSheetFocalX", 50) / 100, y: numberValue("labelSheetFocalY", 50) / 100 },
      allowUpscale: checked("labelSheetAllowUpscale"),
      visualStyleId: value("labelSheetVisualStyle"),
      generationDelayMs: Math.max(0, numberValue("labelSheetGenerationDelay", GENERATION_DELAY_MS / 1000) * 1000),
      generationRetries: Math.min(3, Math.max(0, Math.trunc(numberValue("labelSheetGenerationRetries", 1)))),
      printJob: normalizePrintJob({
        ...(project.settings?.printJob || {}),
        rangeMode: value("labelSheetPrintRangeMode"),
        fromSheet: numberValue("labelSheetPrintFrom", 1),
        toSheet: numberValue("labelSheetPrintTo", 1),
        copies: numberValue("labelSheetPrintCopies", 1),
      }),
      qr: normalizeQrSettings({
        ...(project.settings?.qr || {}),
        enabled: checked("labelSheetQrEnabled"),
        side: value("labelSheetQrSide"),
        source: value("labelSheetQrSource"),
        template: value("labelSheetQrTemplate"),
        assignScope: value("labelSheetQrAssignScope"),
        position: value("labelSheetQrPosition"),
        layoutMode: value("labelSheetQrLayoutMode"),
        sizePercent: numberValue("labelSheetQrSize", 28),
        margin: numberValue("labelSheetQrMargin", 4),
      }),
    };
    project.assets = projectAssetMetadata();
    syncAssetReferences();
  }

  function contentOrientation(spec, requestedInput = project.settings?.contentOrientation) {
    const requested = cleanText(requestedInput) || "auto";
    if (requested === "landscape") return "horizontal";
    if (requested === "vertical-upright") return "vertical-upright";
    if (requested === "portrait") return "vertical";
    return spec.grid.labelHeightMm > spec.grid.labelWidthMm * 1.2 ? "vertical" : "horizontal";
  }

  function resolveRecordBackground(record, sideName) {
    const side = record?.[sideName];
    if (!side) return { status: "missing", asset: null };
    const filename = cleanText(side.backgroundFile);
    if (filename) {
      const match = assetStore.findByFilename(filename);
      if (match.status === "matched") {
        side.backgroundAssetId = match.assets[0].assetId;
        side.backgroundFile = match.assets[0].filename;
        return { status: "matched", asset: match.assets[0] };
      }
      side.backgroundAssetId = "";
      return { status: match.status, asset: null };
    }
    const asset = cleanText(side.backgroundAssetId) ? assetStore.get(side.backgroundAssetId) : null;
    if (asset) {
      side.backgroundFile = asset.filename;
      return { status: "matched", asset };
    }
    if (side.backgroundAssetId) return { status: "missing", asset: null };
    return { status: "empty", asset: null };
  }

  function syncAssetReferences() {
    if (!assetStoreReady) return;
    const desired = new Map();
    project.records.forEach((record, recordIndex) => {
      ["front", "back"].forEach((sideName) => {
        resolveRecordBackground(record, sideName);
        const assetId = cleanText(record[sideName]?.backgroundAssetId);
        if (assetId && assetStore.get(assetId)) desired.set(`record-${recordIndex}:${record.id}:${sideName}`, assetId);
      });
    });
    trackedAssetReferences.forEach((assetId, referenceKey) => {
      if (desired.get(referenceKey) !== assetId) assetStore.releaseReference(assetId, referenceKey);
    });
    desired.forEach((assetId, referenceKey) => {
      if (trackedAssetReferences.get(referenceKey) !== assetId) assetStore.addReference(assetId, referenceKey);
    });
    trackedAssetReferences = desired;
  }

  function safeHex(value, fallback) {
    return /^#[0-9a-f]{6}$/i.test(String(value || "")) ? String(value) : fallback;
  }

  function resolveFontFamily(typography = {}) {
    const probe = [typography.preset, typography.id, typography.nameKo, typography.prompt].filter(Boolean).join(" ").toLocaleLowerCase();
    if (/mono|모노|technical|hud/.test(probe)) return '"D2Coding", "Consolas", "Noto Sans KR", monospace';
    if (/serif|세리프|명조|batang|didot|bodoni/.test(probe)) return '"Noto Serif KR", "Batang", serif';
    if (/rounded|둥근/.test(probe)) return '"Pretendard", "Noto Sans KR", "Malgun Gothic", sans-serif';
    return '"Pretendard", "Noto Sans KR", "Malgun Gothic", sans-serif';
  }

  function resolveVisualDesign(settings) {
    const snapshot = settings.visualStyleSnapshot;
    if (!snapshot) {
      return {
        background: "#ffffff",
        surface: "#f8fafc",
        text: "#111827",
        secondaryText: "#475569",
        accent: "",
        border: "",
        fontFamily: resolveFontFamily(),
        stylePrompt: "",
      };
    }
    const palette = snapshot.palette || {};
    const typography = snapshot.typography || {};
    const colors = Array.isArray(snapshot.colors) ? snapshot.colors : [];
    const dark = snapshot.mode === "dark" || palette.mode === "dark";
    const background = safeHex(palette.background || colors[0], dark ? "#111827" : "#ffffff");
    const surface = safeHex(palette.surface || colors[1], dark ? "#1f2937" : "#f8fafc");
    const text = safeHex(palette.textPrimary || colors[4], dark ? "#f8fafc" : "#111827");
    const secondaryText = safeHex(palette.textSecondary || colors[2], dark ? "#dbeafe" : "#475569");
    const accent = safeHex(palette.accent || colors[3], dark ? "#22d3ee" : "#2563eb");
    const border = safeHex(palette.border || colors[2], dark ? "#475569" : "#cbd5e1");
    const styleName = cleanText(snapshot.nameKo || snapshot.name || snapshot.id);
    const styleDirection = cleanText(snapshot.prompt?.en || snapshot.prompt?.ko || snapshot.prompt || snapshot.medium?.prompt);
    const stylePrompt = [
      styleName ? `Shared PromptDeck visual style: ${styleName}.` : "",
      `Coordinated palette: background ${background}, surface ${surface}, accent ${accent}, print text contrast ${text}.`,
      styleDirection,
      "Apply the style only to the no-text background artwork; keep a generous quiet zone for the deterministic label overlay.",
    ].filter(Boolean).join("\n");
    return { background, surface, text, secondaryText, accent, border, fontFamily: resolveFontFamily(typography), stylePrompt };
  }

  function readRecordToken(record, key, sideName) {
    const normalized = cleanText(key);
    if (normalized === "id" || normalized === "label_id") return record.id;
    if (normalized === "number") return record.number;
    if (normalized.startsWith("front.")) return record.front?.[normalized.slice(6)] ?? "";
    if (normalized.startsWith("back.")) return record.back?.[normalized.slice(5)] ?? "";
    if (normalized.startsWith("data.")) return record.data?.[normalized.slice(5)] ?? "";
    return record.data?.[normalized] ?? record?.[sideName]?.[normalized] ?? record?.[normalized] ?? "";
  }

  function normalizedOutputToken(input) {
    return cleanText(input).normalize("NFKC").toLowerCase().replace(/[\s_-]+/gu, "");
  }

  function outputTokenResult(record, keyInput, sideName) {
    const key = cleanText(keyInput);
    const token = normalizedOutputToken(key);
    const side = sideName === "back" ? "back" : "front";
    const aliases = {
      id: ["id", "아이디", "라벨id", "labelid"],
      number: ["번호", "연번", "number", "serial", "sequence"],
      name: ["이름", "성명", "name"],
      category: ["구분", "소속", "구분소속", "category", "affiliation"],
      title: ["제목", "title"],
      subtitle: ["부제", "subtitle"],
      body: ["본문", "body", "content"],
      footer: ["하단", "하단문구", "footer"],
    };
    const matches = (name) => aliases[name].some((alias) => normalizedOutputToken(alias) === token);
    if (matches("id")) return { found: true, value: record?.id ?? "" };
    if (matches("number")) return { found: true, value: record?.number ?? "" };
    if (matches("name")) return { found: true, value: record?.data?.name ?? "" };
    if (matches("category")) return { found: true, value: record?.data?.category ?? "" };
    if (matches("title")) return { found: true, value: record?.[side]?.title ?? "" };
    if (matches("subtitle")) return { found: true, value: record?.[side]?.subtitle ?? "" };
    if (matches("body")) return { found: true, value: record?.[side]?.body ?? "" };
    if (matches("footer")) return { found: true, value: record?.[side]?.footer ?? "" };

    const qualified = token.match(/^(앞면|front|뒷면|뒤면|back)[.·:]?(제목|title|부제|subtitle|본문|body|content|하단|하단문구|footer)$/u);
    if (qualified) {
      const qualifiedSide = ["뒷면", "뒤면", "back"].includes(qualified[1]) ? "back" : "front";
      const fieldToken = qualified[2];
      const fieldName = Object.keys(aliases).find((name) => ["title", "subtitle", "body", "footer"].includes(name)
        && aliases[name].some((alias) => normalizedOutputToken(alias) === normalizedOutputToken(fieldToken)));
      if (fieldName) return { found: true, value: record?.[qualifiedSide]?.[fieldName] ?? "" };
    }

    const dataKey = token.startsWith("data.") ? key.slice(key.indexOf(".") + 1) : key;
    if (Object.prototype.hasOwnProperty.call(record?.data || {}, dataKey)) return { found: true, value: record.data[dataKey] ?? "" };
    const matchingDataKey = Object.keys(record?.data || {}).find((candidate) => normalizedOutputToken(candidate) === normalizedOutputToken(dataKey));
    if (matchingDataKey) return { found: true, value: record.data[matchingDataKey] ?? "" };
    return { found: false, value: "" };
  }

  function resolveOutputTemplate(record, sideName, templateInput) {
    const emptyTokens = new Set();
    const unknownTokens = new Set();
    let tokenCount = 0;
    const template = String(templateInput ?? "");
    const value = template.replace(/\{\{\s*([^{}|]+?)\s*(?:\|\s*(url)\s*)?\}\}/gu, (_match, key, modifier) => {
      tokenCount += 1;
      const result = outputTokenResult(record, key, sideName);
      const tokenValue = String(result.value ?? "");
      if (!result.found) unknownTokens.add(cleanText(key));
      else if (!cleanText(tokenValue)) emptyTokens.add(cleanText(key));
      return modifier === "url" ? encodeURIComponent(tokenValue) : tokenValue;
    });
    return {
      value: cleanText(value),
      tokenCount,
      emptyTokens: Array.from(emptyTokens),
      unknownTokens: Array.from(unknownTokens),
    };
  }

  function outputTemplateSetting(settings, sideName, fieldName) {
    const prefix = sideName === "back" ? "back" : "front";
    return settings?.[`${prefix}${fieldName.slice(0, 1).toUpperCase()}${fieldName.slice(1)}`] ?? "";
  }

  function resolveOutputField(record, sideName, fieldName, settings, visibilityInput) {
    const visibility = normalizeOutputVisibility(visibilityInput || settings?.outputVisibility);
    if (visibility[sideName]?.[fieldName] === false) {
      return { value: "", tokenCount: 0, emptyTokens: [], unknownTokens: [], hidden: true };
    }
    const template = String(outputTemplateSetting(settings, sideName, fieldName) ?? "");
    if (!cleanText(template)) {
      return { value: cleanText(record?.[sideName]?.[fieldName]), tokenCount: 0, emptyTokens: [], unknownTokens: [], hidden: false };
    }
    return { ...resolveOutputTemplate(record, sideName, template), hidden: false };
  }

  function resolveQrTemplate(record, sideName, template) {
    const emptyTokens = new Set();
    let tokenCount = 0;
    const value = cleanText(template).replace(/\{([a-zA-Z0-9_.-]+)(?:\|(url))?\}/g, (_match, key, modifier) => {
      tokenCount += 1;
      const tokenValue = String(readRecordToken(record, key, sideName) ?? "");
      if (!cleanText(tokenValue)) emptyTokens.add(key);
      return modifier === "url" ? encodeURIComponent(tokenValue) : tokenValue;
    });
    return { value: cleanText(value), tokenCount, emptyTokens: Array.from(emptyTokens) };
  }

  function qrValueFor(record, sideName, settings) {
    if (settings.source === "number") return cleanText(record.number);
    if (settings.source === "id") return cleanText(record.id);
    if (settings.source === "template") {
      return resolveQrTemplate(record, sideName, settings.template).value;
    }
    return cleanText(record?.[sideName]?.qrValue);
  }

  function qrAppliesToSide(settings, sideName) {
    return settings.enabled && (settings.side === "both" || settings.side === sideName);
  }

  function qrSettingsFromControls() {
    return normalizeQrSettings({
      ...(project.settings?.qr || {}),
      enabled: checked("labelSheetQrEnabled"),
      side: value("labelSheetQrSide"),
      source: value("labelSheetQrSource"),
      template: value("labelSheetQrTemplate"),
      assignScope: value("labelSheetQrAssignScope"),
      position: value("labelSheetQrPosition"),
      layoutMode: value("labelSheetQrLayoutMode"),
      sizePercent: numberValue("labelSheetQrSize", 28),
      margin: numberValue("labelSheetQrMargin", 4),
    });
  }

  function qrAssignmentSides(settings) {
    return settings.side === "both" ? ["front", "back"] : [settings.side === "back" ? "back" : "front"];
  }

  function qrAssignmentRecords(scope) {
    const printable = project.records.filter((record) => !record.data?.excluded);
    if (scope !== "selected") return printable;
    return printable.filter((record) => selectedRecordIds.has(record.id));
  }

  function materializeDynamicQrValues(settings) {
    if (settings.source === "record") return 0;
    let materialized = 0;
    const sides = qrAssignmentSides(settings);
    project.records.filter((record) => !record.data?.excluded).forEach((record) => {
      sides.forEach((sideName) => {
        const resolved = qrValueFor(record, sideName, settings);
        if (!resolved) return;
        record[sideName].qrValue = resolved;
        materialized += 1;
      });
    });
    return materialized;
  }

  function qrSettingsForManualSide(sideName) {
    const currentSide = value("labelSheetQrSide");
    if (currentSide !== "both" && currentSide !== sideName) setControl("labelSheetQrSide", "both");
    return qrSettingsFromControls();
  }

  function updateQrAssignmentPreview() {
    const output = $("labelSheetQrResolvedPreview");
    if (!output) return;
    const promptOnly = normalizeOutputGoal(selectedRadioValue("labelSheetOutputGoal", project.settings?.outputGoal)) === "prompt";
    if (!checked("labelSheetQrEnabled")) {
      output.textContent = "QR 꺼짐 · 문구는 라벨의 전체 안전 영역을 사용하며 QR용 빈 공간을 남기지 않습니다.";
      output.dataset.tone = "";
      return;
    }
    if (promptOnly) {
      const settings = qrSettingsFromControls();
      const sideLabel = ({ front: "앞면", back: "뒷면", both: "앞·뒷면" })[settings.side] || "앞면";
      const positionLabel = ({ left: "왼쪽", right: "오른쪽", "top-left": "왼쪽 위", "top-right": "오른쪽 위", "bottom-left": "왼쪽 아래", "bottom-right": "오른쪽 아래", center: "가운데" })[settings.position] || "오른쪽";
      output.textContent = `${sideLabel} · ${positionLabel} · 라벨 너비 ${settings.sizePercent}%의 깨끗한 QR 합성 공간 예약 · QR 값과 가짜 코드 무늬는 포함하지 않음`;
      output.dataset.tone = "success";
      return;
    }
    const record = project.records.find((item) => selectedRecordIds.has(item.id) && !item.data?.excluded)
      || project.records.find((item) => !item.data?.excluded);
    if (!record) {
      output.textContent = "QR 값을 확인할 라벨 데이터가 없습니다.";
      output.dataset.tone = "warning";
      return;
    }
    const settings = qrSettingsFromControls();
    const sideName = settings.side === "back" ? "back" : "front";
    const resolution = settings.source === "template"
      ? resolveQrTemplate(record, sideName, settings.template)
      : { value: qrValueFor(record, sideName, settings), tokenCount: 0, emptyTokens: [] };
    const sourceLabel = ({ record: "직접 배정", number: "번호", id: "ID", template: "템플릿" })[settings.source] || "QR";
    const emptyTokenText = resolution.emptyTokens.length ? ` · 빈 토큰: ${resolution.emptyTokens.join(", ")}` : "";
    const layoutText = resolution.value
      ? settings.layoutMode === "adaptive" ? "자동 감싸기 레이아웃" : settings.layoutMode === "reserved" ? "고정 여백 레이아웃" : "자유 겹침 레이아웃"
      : "QR 없음 → 문구 전체폭";
    output.textContent = resolution.value
      ? `샘플 · ${record.id} ${sideName === "front" ? "앞면" : "뒷면"} · ${sourceLabel} → ${resolution.value} · ${layoutText}${emptyTokenText}`
      : `샘플 · ${record.id}에 사용할 ${sourceLabel} QR 값이 비어 있습니다. · ${layoutText}${emptyTokenText}`;
    output.dataset.tone = resolution.value && !resolution.emptyTokens.length ? "success" : "warning";
  }

  function setQrSourceToAssignedValues(settings) {
    if ($("labelSheetQrEnabled")) $("labelSheetQrEnabled").checked = true;
    setControl("labelSheetQrSource", "record");
    project.settings.qr = normalizeQrSettings({ ...settings, enabled: true, source: "record" });
  }

  function assignQrValues(options = {}) {
    if (draftActive) {
      setElementStatus("labelSheetQrStatus", "가져오기 미리보기를 먼저 목록에 반영한 뒤 QR 값을 배정해 주세요.", "warning");
      return { assigned: 0, skipped: 0 };
    }
    syncProjectFromControls();
    const settings = normalizeQrSettings({
      ...qrSettingsFromControls(),
      side: options.side || value("labelSheetQrSide"),
      assignScope: options.scope || value("labelSheetQrAssignScope"),
    });
    const records = qrAssignmentRecords(settings.assignScope);
    if (!records.length) {
      const message = settings.assignScope === "selected"
        ? "출력 목록에서 QR을 배정할 행을 먼저 선택해 주세요."
        : "QR을 배정할 라벨 데이터가 없습니다.";
      setElementStatus("labelSheetQrStatus", message, "warning");
      return { assigned: 0, skipped: 0 };
    }
    if (settings.source === "template" && !cleanText(settings.template) && options.constantValue === undefined) {
      setElementStatus("labelSheetQrStatus", "QR 템플릿을 입력해 주세요. 예: https://example.kr/pass/{id}", "warning");
      $("labelSheetQrTemplate")?.focus();
      return { assigned: 0, skipped: records.length };
    }
    if (settings.source === "record" && options.constantValue === undefined) {
      setElementStatus("labelSheetQrStatus", "직접 배정 모드입니다. 출력 목록의 앞면·뒷면 QR 열을 수정하거나 번호·ID·템플릿을 선택해 일괄 배정하세요.", "warning");
      return { assigned: 0, skipped: records.length };
    }
    const sides = qrAssignmentSides(settings);
    const missingSidesBefore = new Map(records.map((record) => [
      record,
      new Set(sides.filter((sideName) => !cleanText(record[sideName]?.qrValue))),
    ]));
    materializeDynamicQrValues(settings);
    let assigned = 0;
    let skipped = 0;
    records.forEach((record) => {
      sides.forEach((sideName) => {
        if (settings.assignScope === "missing" && !missingSidesBefore.get(record)?.has(sideName)) {
          skipped += 1;
          return;
        }
        const nextValue = options.constantValue === undefined
          ? qrValueFor(record, sideName, settings)
          : cleanText(options.constantValue);
        if (!nextValue) {
          skipped += 1;
          return;
        }
        record[sideName].qrValue = nextValue;
        assigned += 1;
      });
    });
    if (!assigned) {
      setElementStatus("labelSheetQrStatus", "배정할 QR 값이 없습니다. 템플릿 토큰과 원본 데이터를 확인해 주세요.", "warning");
      updateQrAssignmentPreview();
      return { assigned, skipped };
    }
    setQrSourceToAssignedValues(settings);
    updateQrControlState();
    renderRecordTable();
    onProjectControlsChanged(`QR 값 ${assigned}개를 각 라벨에 확정했습니다. 이제 표에서 개별 수정할 수 있습니다.`, { rerenderTable: false });
    setElementStatus("labelSheetQrStatus", `QR 값 ${assigned}개 배정 완료${skipped ? ` · ${skipped}개 건너뜀` : ""}. 데이터 원본을 직접 배정 모드로 전환했습니다.`, "success");
    return { assigned, skipped };
  }

  function assignCurrentQrValue() {
    const currentValue = cleanText(window.QRGeneratorCore?.getCurrentValue?.());
    if (!currentValue) {
      setElementStatus("labelSheetQrStatus", "QR코드 생성기 탭에서 내용을 입력하고 QR을 만든 뒤 다시 시도해 주세요.", "warning");
      return { assigned: 0, skipped: 0 };
    }
    return assignQrValues({ constantValue: currentValue });
  }

  function clearAssignedQrValues(options = {}) {
    if (draftActive) {
      setElementStatus("labelSheetQrStatus", "가져오기 미리보기를 먼저 목록에 반영한 뒤 QR 값을 지워 주세요.", "warning");
      return { cleared: 0 };
    }
    syncProjectFromControls();
    const settings = normalizeQrSettings({
      ...qrSettingsFromControls(),
      side: options.side || value("labelSheetQrSide"),
      assignScope: options.scope || value("labelSheetQrAssignScope"),
    });
    const records = qrAssignmentRecords(settings.assignScope);
    if (!records.length) {
      setElementStatus("labelSheetQrStatus", settings.assignScope === "selected" ? "QR 값을 지울 행을 먼저 선택해 주세요." : "QR 값을 지울 라벨이 없습니다.", "warning");
      return { cleared: 0 };
    }
    if (settings.assignScope === "missing") {
      setElementStatus("labelSheetQrStatus", "QR 값이 빈 라벨에는 지울 배정값이 없습니다. 선택한 라벨 또는 전체 라벨 범위를 사용해 주세요.", "warning");
      return { cleared: 0 };
    }
    materializeDynamicQrValues(settings);
    let cleared = 0;
    const sides = qrAssignmentSides(settings);
    records.forEach((record) => sides.forEach((sideName) => {
      if (cleanText(record[sideName]?.qrValue)) cleared += 1;
      record[sideName].qrValue = "";
    }));
    setQrSourceToAssignedValues(settings);
    updateQrControlState();
    renderRecordTable();
    onProjectControlsChanged(`QR 배정값 ${cleared}개를 지웠습니다.`, { rerenderTable: false });
    setElementStatus("labelSheetQrStatus", `QR 배정값 ${cleared}개를 지웠습니다.`, cleared ? "success" : "warning");
    return { cleared };
  }

  function insertQrTemplateToken(token) {
    const input = $("labelSheetQrTemplate");
    if (!input) return;
    const start = Number.isInteger(input.selectionStart) ? input.selectionStart : input.value.length;
    const end = Number.isInteger(input.selectionEnd) ? input.selectionEnd : start;
    input.value = `${input.value.slice(0, start)}${token}${input.value.slice(end)}`;
    input.setSelectionRange(start + token.length, start + token.length);
    setControl("labelSheetQrSource", "template");
    updateQrControlState();
    input.focus();
    onProjectControlsChanged("QR 템플릿 토큰을 추가했습니다.");
  }

  function outputSettingsFromControls() {
    return {
      ...(project.settings || {}),
      frontTitle: value("labelSheetFrontTitle"),
      frontSubtitle: value("labelSheetFrontSubtitle"),
      frontBody: value("labelSheetFrontBody"),
      frontFooter: value("labelSheetFrontFooter"),
      backTitle: value("labelSheetBackTitle"),
      backSubtitle: value("labelSheetBackSubtitle"),
      backBody: value("labelSheetBackBody"),
      backFooter: value("labelSheetBackFooter"),
      outputVisibility: normalizeOutputVisibility(Object.fromEntries(["front", "back"].map((sideName) => [
        sideName,
        Object.fromEntries(OUTPUT_FIELD_KEYS.map((fieldName) => [fieldName, checked(outputVisibilityControlId(sideName, fieldName))])),
      ]))),
    };
  }

  function updateOutputVisibilityControls() {
    pane.querySelectorAll("[data-label-sheet-output-visible]").forEach((control) => {
      const field = control.closest(".label-sheet-output-field");
      if (field) field.classList.toggle("is-output-hidden", !control.checked);
      control.setAttribute("aria-label", `${control.dataset.labelSheetOutputVisible?.startsWith("back.") ? "뒷면" : "앞면"} ${OUTPUT_FIELD_LABELS[control.dataset.labelSheetOutputVisible?.split(".")[1]] || "문구"} 출력 표시`);
    });
  }

  function updateOutputTemplatePreviews() {
    const record = project.records.find((item) => !item.data?.excluded);
    const settings = outputSettingsFromControls();
    ["front", "back"].forEach((sideName) => {
      const output = $(`labelSheet${sideName === "back" ? "Back" : "Front"}ResolvedPreview`);
      if (!output) return;
      if (!record) {
        output.textContent = "원본 데이터를 입력하면 첫 티켓의 실제 출력 문구를 확인할 수 있습니다.";
        output.dataset.tone = "";
        return;
      }
      const emptyTokens = new Set();
      const unknownTokens = new Set();
      const lines = OUTPUT_FIELD_KEYS.map((fieldName) => {
        const resolved = resolveOutputField(record, sideName, fieldName, settings, settings.outputVisibility);
        resolved.emptyTokens.forEach((token) => emptyTokens.add(token));
        resolved.unknownTokens.forEach((token) => unknownTokens.add(token));
        if (resolved.hidden) return `${OUTPUT_FIELD_LABELS[fieldName]}: 숨김`;
        return `${OUTPUT_FIELD_LABELS[fieldName]}: ${resolved.value || "(빈 값)"}`;
      });
      const notes = [
        unknownTokens.size ? `알 수 없는 호출: ${Array.from(unknownTokens).map((token) => `{{${token}}}`).join(", ")}` : "",
        emptyTokens.size ? `첫 데이터에서 빈 호출: ${Array.from(emptyTokens).map((token) => `{{${token}}}`).join(", ")}` : "",
      ].filter(Boolean);
      output.textContent = `첫 데이터 ${record.id}${cleanText(record.number) ? ` · 번호 ${record.number}` : ""}\n${lines.join(" · ")}${notes.length ? `\n${notes.join(" · ")}` : ""}`;
      output.dataset.tone = unknownTokens.size ? "warning" : "success";
    });
    updateOutputVisibilityControls();
  }

  function insertOutputTemplateToken(button) {
    const panel = button.closest("[data-label-sheet-output-token-bar]")?.closest(".label-sheet-content-panel");
    const activeBelongsToPanel = activeOutputTemplateInput && panel?.contains(activeOutputTemplateInput);
    const input = activeBelongsToPanel ? activeOutputTemplateInput : panel?.querySelector("[data-label-sheet-output-template]");
    if (!input) return;
    const token = button.dataset.labelSheetOutputToken || "";
    const start = Number.isInteger(input.selectionStart) ? input.selectionStart : input.value.length;
    const end = Number.isInteger(input.selectionEnd) ? input.selectionEnd : start;
    input.value = `${input.value.slice(0, start)}${token}${input.value.slice(end)}`;
    input.setSelectionRange(start + token.length, start + token.length);
    activeOutputTemplateInput = input;
    input.focus();
    onProjectControlsChanged("출력 템플릿에 데이터 호출을 추가했습니다.");
  }

  function effectiveProject(sourceProject = project, options = {}) {
    if (sourceProject === project && options.sync !== false) syncProjectFromControls();
    const working = ENGINE.normalizeProject(sourceProject);
    const settings = working.settings || {};
    const orientation = contentOrientation(working.spec, settings.contentOrientation);
    const focalPoint = deepClone(settings.focalPoint || { x: 0.5, y: 0.5 });
    const fitSelection = settings.imageFit;
    const imageFit = fitSelection === "contain" || fitSelection === "original" ? "contain" : fitSelection === "stretch" ? "stretch" : "cover";
    const contrast = settings.textContrast;
    const visualDesign = resolveVisualDesign(settings);
    const qr = normalizeQrSettings(settings.qr);
    const outputVisibility = normalizeOutputVisibility(settings.outputVisibility);
    const textLayouts = normalizeTextLayouts(settings.textLayouts);
    const recordTextLayouts = normalizeRecordTextLayouts(settings.recordTextLayouts);
    const promptOnly = normalizeOutputGoal(settings.outputGoal) === "prompt";
    const showNumbers = settings.sequenceMode !== "none";
    const style = {
      safeAreaMm: settings.safeAreaMm,
      align: settings.textAlign,
      verticalAlign: settings.textVerticalAlign,
      fontScalePercent: settings.textScalePercent,
      rotation: orientation === "vertical" ? 90 : 0,
      writingMode: orientation === "vertical-upright" ? "vertical-upright" : "horizontal",
      contrastMode: contrast,
      autoContrast: contrast === "auto",
      color: contrast === "light" ? "#ffffff" : contrast === "dark" ? "#111827" : visualDesign.text,
      overlayOpacity: contrast === "overlay" ? 0.55 : 0,
      overlayColor: contrast === "light" ? "#111827" : "#ffffff",
      backgroundColor: visualDesign.background,
      accentColor: visualDesign.accent,
      accentEdge: orientation === "horizontal" ? "top" : "left",
      borderColor: visualDesign.border,
      fontFamily: visualDesign.fontFamily,
      qr: deepClone(qr),
    };

    working.records = working.records
      .filter((record) => !record.data?.excluded)
      .map((record) => {
        const next = deepClone(record);
        const sourceRecord = deepClone(record);
        if (!showNumbers) {
          next.number = "";
          next.front.number = "";
          next.back.number = "";
        }
        resolveRecordBackground(next, "front");
        resolveRecordBackground(next, "back");
        OUTPUT_FIELD_KEYS.forEach((fieldName) => {
          next.front[fieldName] = resolveOutputField(sourceRecord, "front", fieldName, settings, outputVisibility).value;
        });
        next.front.number = showNumbers ? cleanText(next.front.number) || cleanText(next.number) : "";
        next.front.backgroundPrompt = [cleanText(next.front.backgroundPrompt) || cleanText(settings.backgroundPrompt), visualDesign.stylePrompt].filter(Boolean).join("\n");
        next.front.imageFit = imageFit;
        next.front.focalPoint = deepClone(focalPoint);
        next.front.textOrientation = orientation;
        next.front.enabled = true;
        next.front.qrEnabled = qrAppliesToSide(qr, "front");
        next.front.qrStyle = { ...deepClone(qr), enabled: next.front.qrEnabled };
        next.front.qrValue = next.front.qrEnabled ? qrValueFor(next, "front", qr) : "";

        OUTPUT_FIELD_KEYS.forEach((fieldName) => {
          next.back[fieldName] = resolveOutputField(sourceRecord, "back", fieldName, settings, outputVisibility).value;
        });
        next.back.backgroundPrompt = [cleanText(next.back.backgroundPrompt) || cleanText(settings.backgroundPrompt), visualDesign.stylePrompt].filter(Boolean).join("\n");
        next.back.imageFit = imageFit;
        next.back.focalPoint = deepClone(focalPoint);
        next.back.textOrientation = orientation;
        next.back.enabled = Boolean(working.spec.duplex.enabled);
        next.back.qrEnabled = qrAppliesToSide(qr, "back");
        next.back.qrStyle = { ...deepClone(qr), enabled: next.back.qrEnabled };
        next.back.qrValue = next.back.qrEnabled ? qrValueFor(next, "back", qr) : "";
        if (promptOnly) {
          ["front", "back"].forEach((sideName) => {
            next[sideName].qrValue = "";
            next[sideName].backgroundAssetId = "";
            next[sideName].backgroundFile = "";
          });
        }
        ["front", "back"].forEach((sideName) => {
          const variant = textLayoutVariant(next[sideName]);
          const recordFields = recordTextLayouts[recordLayoutKey(next.id)]?.[sideName]?.[variant];
          const customLayout = recordFields || textLayouts[sideName][variant] || (variant === "withQr" ? createDefaultTextFieldLayout(variant) : null);
          const normalizedLayout = customLayout ? normalizeTextFieldLayoutSet(customLayout) : null;
          next[sideName].style = normalizedLayout ? {
            textFields: deepClone(textOnlyWysiwygFields(normalizedLayout)),
            textGroup: deepClone(normalizedLayout.content),
          } : {};
          if (customLayout) {
            const qrLayout = normalizeQrFieldLayout(normalizedLayout.qr);
            const qrOverrides = Object.fromEntries(Object.entries(qrLayout).filter(([, value]) => value !== null));
            next[sideName].qrStyle = { ...next[sideName].qrStyle, ...qrOverrides };
          }
        });
        next.style = deepClone(style);
        return next;
      });
    working.assets = projectAssetMetadata();
    working.settings = { ...working.settings, ...deepClone(settings) };
    return working;
  }

  function updateFocalOutputs() {
    if ($("labelSheetFocalXValue")) $("labelSheetFocalXValue").textContent = `${Math.round(numberValue("labelSheetFocalX", 50))}%`;
    if ($("labelSheetFocalYValue")) $("labelSheetFocalYValue").textContent = `${Math.round(numberValue("labelSheetFocalY", 50))}%`;
  }

  function updateTextScaleOutput() {
    const output = $("labelSheetTextScaleValue");
    if (output) output.textContent = `${Math.round(clamp(numberValue("labelSheetTextScale", 100), 70, 160))}%`;
  }

  function updateContrastStatus() {
    const status = $("labelSheetContrastStatus");
    if (!status) return;
    const mode = value("labelSheetTextContrast") || "auto";
    status.textContent = ({
      auto: "권장 · 각 배경을 분석해 밝은 배경에는 어두운 글씨, 어두운 배경에는 흰 글씨와 보호 효과를 자동 적용합니다.",
      light: "흰색 문구를 고정합니다. 밝은 배경에서는 읽기 어려울 수 있습니다.",
      dark: "어두운 문구를 고정합니다. 어두운 배경에서는 읽기 어려울 수 있습니다.",
      overlay: "배경 위에 밝은 보호 패널을 넣고 어두운 문구를 사용합니다.",
    })[mode];
  }

  function setCropControlsForAsset(asset) {
    const crop = normalizedCrop(asset?.settings?.crop || {});
    setControl("labelSheetCropX", Math.round(crop.x * 100));
    setControl("labelSheetCropY", Math.round(crop.y * 100));
    setControl("labelSheetCropWidth", Math.round(crop.width * 100));
    setControl("labelSheetCropHeight", Math.round(crop.height * 100));
    updateCropEditor();
  }

  function updateCropEditor() {
    const editor = $("labelSheetCropEditor");
    if (!editor) return;
    const asset = selectedAssetId ? assetStore.get(selectedAssetId) : null;
    const cropMode = value("labelSheetImageFit") === "crop";
    editor.hidden = !cropMode || !asset;
    const crop = cropFromControls();
    const x = Math.round(crop.x * 100);
    const y = Math.round(crop.y * 100);
    const width = Math.round(crop.width * 100);
    const height = Math.round(crop.height * 100);
    const widthInput = $("labelSheetCropWidth");
    const heightInput = $("labelSheetCropHeight");
    if (widthInput) widthInput.max = String(Math.max(1, 100 - x));
    if (heightInput) heightInput.max = String(Math.max(1, 100 - y));
    if ($("labelSheetCropXValue")) $("labelSheetCropXValue").textContent = `${x}%`;
    if ($("labelSheetCropYValue")) $("labelSheetCropYValue").textContent = `${y}%`;
    if ($("labelSheetCropWidthValue")) $("labelSheetCropWidthValue").textContent = `${width}%`;
    if ($("labelSheetCropHeightValue")) $("labelSheetCropHeightValue").textContent = `${height}%`;
    const image = $("labelSheetCropPreviewImage");
    if (image && asset) image.src = asset.original?.url || asset.thumbnail?.url || "";
    const box = $("labelSheetCropPreviewBox");
    if (box) {
      box.style.left = `${x}%`;
      box.style.top = `${y}%`;
      box.style.width = `${width}%`;
      box.style.height = `${height}%`;
    }
  }

  async function persistSelectedAssetCrop() {
    const asset = selectedAssetId ? assetStore.get(selectedAssetId) : null;
    if (!asset || value("labelSheetImageFit") !== "crop") return;
    const crop = cropFromControls();
    await assetStore.updateSettings(selectedAssetId, {
      fit: "cover",
      crop,
      focalPoint: { x: numberValue("labelSheetFocalX", 50) / 100, y: numberValue("labelSheetFocalY", 50) / 100 },
    });
    await assetStore.process(selectedAssetId, {
      widthMm: project.spec.grid.labelWidthMm,
      heightMm: project.spec.grid.labelHeightMm,
      dpi: project.spec.dpi,
      fit: "cover",
      crop,
      focalPoint: { x: 0.5, y: 0.5 },
      allowUpscale: checked("labelSheetAllowUpscale"),
    });
    renderAssets();
    setCropControlsForAsset(assetStore.get(selectedAssetId));
    setAssetStatus("선택한 배경의 자르기 영역을 저장했습니다.", "success");
    onProjectControlsChanged("배경 자르기 영역을 출력에 반영했습니다.", { rerenderTable: false });
  }

  function applyGalleryVisualStyle() {
    const styleId = value("labelSheetVisualStyle");
    if (!styleId) {
      project.settings.visualStyleId = "";
      project.settings.visualStyleSource = "";
      project.settings.visualStyleSnapshot = null;
      setElementStatus("labelSheetStyleStatus", "기본 스타일");
      renderDnaFeaturedGallery();
      renderDnaDialog();
      onProjectControlsChanged("기본 라벨 스타일로 전환했습니다.");
      return;
    }
    const contract = VISUAL_STYLES?.get?.(styleId, "visual");
    if (!contract) {
      setElementStatus("labelSheetStyleStatus", "스타일을 찾지 못했습니다.", "error");
      return;
    }
    project.settings.visualStyleId = contract.id;
    project.settings.visualStyleSource = "gallery";
    project.settings.visualStyleSnapshot = deepClone(contract);
    setElementStatus("labelSheetStyleStatus", contract.nameKo || contract.nameEn || contract.id, "success");
    updateDnaSummary();
    onProjectControlsChanged(`${contract.nameKo || contract.id} 스타일을 라벨 배경·문구에 적용했습니다.`);
  }

  function mixerVisualSnapshot() {
    const mixer = window.PromptDeckConceptMixer;
    const palette = mixer?.getSelectedPalette?.();
    const typography = mixer?.getSelectedTypography?.();
    const medium = mixer?.getSelectedMedium?.();
    if (!palette && !typography && !medium) return null;
    const colors = Array.isArray(palette?.colors) ? palette.colors.filter((color) => /^#[0-9a-f]{6}$/i.test(color)) : [];
    const dark = palette?.mode === "dark";
    return {
      id: `mixer-${palette?.id || "none"}-${typography?.id || "none"}-${medium?.id || "none"}`,
      nameKo: [palette?.name, typography?.nameKo, medium?.nameKo].filter(Boolean).join(" · ") || "비주얼 믹서 스타일",
      source: "concept-mixer",
      mode: dark ? "dark" : "light",
      colors,
      palette: {
        mode: dark ? "dark" : "light",
        background: safeHex(colors[0], dark ? "#111827" : "#ffffff"),
        surface: safeHex(colors[1], dark ? "#1f2937" : "#f8fafc"),
        primary: safeHex(colors[2], dark ? "#64748b" : "#334155"),
        accent: safeHex(colors[3], dark ? "#22d3ee" : "#2563eb"),
        textPrimary: safeHex(colors[4], dark ? "#f8fafc" : "#111827"),
        textSecondary: dark ? "#dbeafe" : "#475569",
        border: safeHex(colors[2], dark ? "#475569" : "#cbd5e1"),
      },
      typography: typography || {},
      medium: medium || {},
      prompt: [palette?.colorMapping, typography?.prompt, medium?.prompt].filter(Boolean).join("; "),
    };
  }

  function applyMixerVisualStyle() {
    const snapshot = mixerVisualSnapshot();
    if (!snapshot) {
      setElementStatus("labelSheetStyleStatus", "비주얼 믹서에서 색상·글꼴·매체를 먼저 선택해 주세요.", "warning");
      return;
    }
    project.settings.visualStyleId = "";
    project.settings.visualStyleSource = "mixer";
    project.settings.visualStyleSnapshot = snapshot;
    setControl("labelSheetVisualStyle", "");
    setElementStatus("labelSheetStyleStatus", snapshot.nameKo, "success");
    renderDnaFeaturedGallery();
    renderDnaDialog();
    onProjectControlsChanged("현재 비주얼 믹서의 색상·타이포그래피·매체 방향을 적용했습니다.");
  }

  function clearVisualStyle() {
    project.settings.visualStyleId = "";
    project.settings.visualStyleSource = "";
    project.settings.visualStyleSnapshot = null;
    setControl("labelSheetVisualStyle", "");
    setElementStatus("labelSheetStyleStatus", "기본 스타일");
    renderDnaFeaturedGallery();
    renderDnaDialog();
    onProjectControlsChanged("연결된 비주얼 스타일을 해제했습니다.");
  }

  function importQrGeneratorStyle() {
    const core = window.QRGeneratorCore;
    if (!core?.getStyleOptions) {
      setElementStatus("labelSheetQrStatus", "QR코드 생성기 스타일을 읽을 수 없습니다.", "error");
      return;
    }
    const imported = core.getStyleOptions();
    project.settings.qr = normalizeQrSettings({
      ...(project.settings.qr || {}),
      ...imported,
      enabled: true,
      sizePercent: numberValue("labelSheetQrSize", 28),
      position: value("labelSheetQrPosition"),
      layoutMode: value("labelSheetQrLayoutMode"),
      side: value("labelSheetQrSide"),
      source: value("labelSheetQrSource"),
      template: value("labelSheetQrTemplate"),
    });
    setControl("labelSheetQrMargin", project.settings.qr.margin);
    setElementStatus("labelSheetQrStatus", `QR 탭 스타일 적용 · ${project.settings.qr.ecc} 보정 · 여백 ${project.settings.qr.margin}칸`, "success");
    onProjectControlsChanged("QR코드 생성기의 색상·점·오류 보정 설정을 가져왔습니다.");
  }

  function updateSpecSummary() {
    const geometry = ENGINE.validateGeometry(project.spec);
    const capacity = geometry.metrics.capacity || 0;
    const firstSlot = $("labelSheetFirstSlot");
    if (firstSlot) firstSlot.max = String(Math.max(1, capacity));
    if ($("labelSheetCellSize")) $("labelSheetCellSize").textContent = `${rounded(project.spec.grid.labelWidthMm)} × ${rounded(project.spec.grid.labelHeightMm)} mm`;
    if ($("labelSheetCapacity")) $("labelSheetCapacity").textContent = `${capacity}칸`;
    if ($("labelSheetSpecStepState")) $("labelSheetSpecStepState").textContent = geometry.valid ? `${project.spec.grid.columns}×${project.spec.grid.rows}` : "확인 필요";
    if ($("labelSheetSpecStatus")) {
      $("labelSheetSpecStatus").textContent = geometry.valid
        ? `한 칸 ${rounded(project.spec.grid.labelWidthMm)}×${rounded(project.spec.grid.labelHeightMm)}mm · A4 한 장 ${capacity}칸`
        : geometry.errors[0]?.message || "규격을 확인해 주세요.";
    }
    updateIntentSummary();
    updateProgressState();
    return geometry;
  }

  function renderDataMappingControls() {
    const panel = $("labelSheetDataMappingPanel");
    if (!panel) return;
    const visible = draftActive && draftHeaders.length > 0;
    const emptyState = $("labelSheetDataMappingEmpty");
    const activeState = $("labelSheetDataMappingActive");
    if (emptyState) emptyState.hidden = visible;
    if (activeState) activeState.hidden = !visible;
    const currentCount = (project.records || []).filter((record) => !record.data?.excluded).length;
    if ($("labelSheetDataMappingCurrentStatus")) {
      $("labelSheetDataMappingCurrentStatus").textContent = currentCount
        ? `현재 ${currentCount}건은 이미 출력 항목으로 정리되어 있습니다. 값 수정은 데이터 탭에서 바로 진행할 수 있습니다.`
        : "아직 등록된 데이터가 없습니다. 표를 붙여넣거나 CSV·TSV 파일을 선택해 시작하세요.";
    }
    if (!visible) return;
    if ($("labelSheetDataMappingImportSummary")) {
      $("labelSheetDataMappingImportSummary").textContent = `${draftRecords.length}행 · 원본 열 ${draftHeaders.length}개를 검토 중입니다. 자동 연결 결과를 확인하고 필요한 항목만 바꾸세요.`;
    }
    pane.querySelectorAll("[data-label-sheet-map]").forEach((select) => {
      const fieldKey = select.dataset.labelSheetMap;
      const selected = draftMapping[fieldKey] || "";
      select.replaceChildren();
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "연결하지 않음";
      select.appendChild(empty);
      draftHeaders.forEach((header) => {
        const option = document.createElement("option");
        option.value = header;
        option.textContent = header;
        select.appendChild(option);
      });
      select.value = draftHeaders.includes(selected) ? selected : "";
    });
    const back = $("labelSheetDataMappingBack");
    if (back) back.hidden = !project.spec.duplex.enabled;
    const summary = DATA_MAPPING.describe(draftMapping, draftHeaders);
    setElementStatus(
      "labelSheetDataMappingStatus",
      `${summary.count}개 항목 연결 · ${summary.text}`,
      summary.count ? "success" : "warning"
    );
  }

  function activateDataWorkspace() {
    pane.querySelector('[data-label-bottom-tab="data"]')?.click();
  }

  function openDataMappingSource(source) {
    activateDataWorkspace();
    const isCsv = source === "csv";
    $(isCsv ? "labelSheetDataCsvTab" : "labelSheetDataPasteTab")?.click();
    window.requestAnimationFrame(() => {
      if (isCsv) {
        $("labelSheetCsvInput")?.click();
        return;
      }
      const input = $("labelSheetPasteInput");
      input?.scrollIntoView({ behavior: "smooth", block: "center" });
      input?.focus({ preventScroll: true });
    });
  }

  function reviewMappedData() {
    activateDataWorkspace();
    window.requestAnimationFrame(() => {
      const button = $("labelSheetImportCommitBtn");
      button?.scrollIntoView({ behavior: "smooth", block: "center" });
      button?.focus({ preventScroll: true });
    });
  }

  function applyDraftMapping(options = {}) {
    if (!draftRawRecords.length) return;
    draftMapping = DATA_MAPPING.normalizeMapping(draftMapping);
    project.settings = project.settings || {};
    project.settings.dataMapping = deepClone(draftMapping);
    draftRawRecords = draftRawRecords.map((record, index) => DATA_MAPPING.applyRecord(record, draftMapping, index));
    draftRecords = draftRawRecords.map((record, index) => ENGINE.normalizeRecord(record, index));
    if (options.render !== false) {
      renderDataMappingControls();
      renderRecordTable();
      scheduleRefresh();
      queueSave();
    }
  }

  function autoMapDraft() {
    if (!draftHeaders.length) {
      setElementStatus("labelSheetDataMappingStatus", "먼저 붙여넣기 또는 CSV 데이터를 검토해 주세요.", "warning");
      return;
    }
    draftMapping = DATA_MAPPING.suggest(draftHeaders, { duplex: project.spec.duplex.enabled });
    applyDraftMapping();
    const summary = DATA_MAPPING.describe(draftMapping, draftHeaders);
    setElementStatus("labelSheetDataMappingStatus", `자동 연결 완료 · ${summary.text}`, summary.count ? "success" : "warning");
  }

  function renderRecordTable() {
    const tbody = $("labelSheetRecordTableBody");
    if (!tbody) return;
    renderRecordTableHeader();
    const rows = draftActive ? draftRecords : project.records;
    tbody.replaceChildren();
    if (!rows.length) {
      const row = document.createElement("tr");
      row.className = "label-sheet-empty-row";
      const cell = document.createElement("td");
      cell.colSpan = RECORD_TABLE_COLUMNS.length + 1;
      cell.textContent = "직접 입력을 적용하거나 표·CSV 데이터를 가져오면 여기에 표시됩니다.";
      row.appendChild(cell);
      tbody.appendChild(row);
    } else {
      rows.slice(0, 500).forEach((record, index) => tbody.appendChild(createRecordRow(record, index, draftActive)));
    }
    if ($("labelSheetDataStepState")) $("labelSheetDataStepState").textContent = `${rows.filter((record) => !record.data?.excluded).length}건${draftActive ? " · 검토" : ""}`;
    if ($("labelSheetImportCommitBtn")) $("labelSheetImportCommitBtn").disabled = !draftActive;
    if ($("labelSheetImportUndoBtn")) $("labelSheetImportUndoBtn").disabled = !draftActive && !undoRecords;
    updateQrAssignmentPreview();
    updateOutputTemplatePreviews();
    updateIntentSummary();
    updateProgressState();
    renderDataMappingControls();
    syncSpreadsheetTools(rows);
    restoreSpreadsheetActiveCell();
  }

  function renderRecordTableHeader() {
    const row = $("labelSheetRecordTable")?.querySelector("thead tr");
    if (!row) return;
    const columns = [{ label: "선택" }, ...RECORD_TABLE_COLUMNS];
    row.replaceChildren(...columns.map((column) => {
      const cell = document.createElement("th");
      cell.scope = "col";
      cell.textContent = column.label;
      return cell;
    }));
  }

  function editableCell(record, index, field, textValue, draft, label = field) {
    const cell = document.createElement("td");
    const input = document.createElement("input");
    input.type = "text";
    input.value = String(textValue ?? "");
    input.dataset.recordIndex = String(index);
    input.dataset.recordField = field;
    input.dataset.recordDraft = String(draft);
    input.setAttribute("aria-label", `${index + 1}행 ${label}`);
    cell.appendChild(input);
    return cell;
  }

  function createRecordRow(record, index, draft) {
    const row = document.createElement("tr");
    row.dataset.recordId = record.id;
    row.dataset.recordIndex = String(index);
    row.dataset.recordDraft = String(draft);
    row.tabIndex = 0;
    row.title = "행을 클릭하면 배경·QR 배정 대상으로 선택합니다.";
    row.setAttribute("aria-selected", String(selectedRecordIds.has(record.id)));
    row.classList.toggle("is-selected", selectedRecordIds.has(record.id));
    const selectionCell = document.createElement("td");
    selectionCell.className = "label-sheet-selection-cell";
    const selection = document.createElement("input");
    selection.type = "checkbox";
    selection.checked = selectedRecordIds.has(record.id);
    selection.dataset.recordSelect = "true";
    selection.setAttribute("aria-label", `${index + 1}행 QR·배경 배정 대상으로 선택`);
    selectionCell.appendChild(selection);
    row.appendChild(selectionCell);
    RECORD_TABLE_COLUMNS.forEach((column) => {
      if (column.type !== "boolean") {
        row.appendChild(editableCell(record, index, column.field, spreadsheetValue(record, column.field), draft, column.label));
        return;
      }
      const cell = document.createElement("td");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = Boolean(spreadsheetValue(record, column.field));
      input.dataset.recordIndex = String(index);
      input.dataset.recordField = column.field;
      input.dataset.recordDraft = String(draft);
      input.setAttribute("aria-label", `${index + 1}행 ${column.label}`);
      cell.appendChild(input);
      row.appendChild(cell);
    });
    return row;
  }

  function normalizedSpreadsheetHeader(input) {
    return cleanText(input).normalize("NFKC").toLowerCase().replace(/[\s·._\-/]+/gu, "");
  }

  function spreadsheetColumn(field) {
    return RECORD_TABLE_COLUMNS.find((column) => column.field === field) || null;
  }

  function spreadsheetFieldForHeader(input) {
    const normalized = normalizedSpreadsheetHeader(input);
    if (!normalized) return "";
    const column = RECORD_TABLE_COLUMNS.find((candidate) => [candidate.label, candidate.field, ...candidate.aliases]
      .some((alias) => normalizedSpreadsheetHeader(alias) === normalized));
    return column?.field || "";
  }

  function spreadsheetRows(draft = draftActive) {
    return draft ? draftRecords : project.records;
  }

  function recordFieldValue(record, field) {
    if (!record || !field) return "";
    return field.split(".").reduce((current, key) => current?.[key], record) ?? "";
  }

  function setRecordFieldValue(record, field, nextValue) {
    const parts = field.split(".");
    if (parts.length < 2) return false;
    let current = record;
    parts.slice(0, -1).forEach((key) => {
      if (!current[key] || typeof current[key] !== "object") current[key] = {};
      current = current[key];
    });
    current[parts.at(-1)] = nextValue;
    return true;
  }

  function spreadsheetValue(record, field) {
    if (field === "id") return record?.id ?? "";
    if (field === "number") return record?.number ?? "";
    if (field === "data.excluded") return Boolean(record?.data?.excluded);
    return recordFieldValue(record, field);
  }

  function spreadsheetBoolean(input) {
    if (typeof input === "boolean") return input;
    const normalized = cleanText(input).normalize("NFKC").toLowerCase();
    if (["1", "true", "yes", "y", "예", "제외", "x"].includes(normalized)) return true;
    return false;
  }

  function ensureSpreadsheetRows(rowCount, draft) {
    const rows = spreadsheetRows(draft);
    const targetCount = Math.min(500, Math.max(0, Number(rowCount) || 0));
    while (rows.length < targetCount) {
      const index = rows.length;
      const raw = { label_id: `label-${index + 1}`, number: "" };
      if (draft) {
        draftRawRecords.push(raw);
        draftRecords.push(ENGINE.normalizeRecord(raw, index));
      } else {
        project.records.push(ENGINE.normalizeRecord({ id: raw.label_id, number: "" }, index));
      }
    }
    return rows;
  }

  function applyRecordFieldValue(index, field, nextValue, draft, target = null) {
    const rows = spreadsheetRows(draft);
    const record = rows[index];
    if (!record) return false;
    const draftRaw = draft ? draftRawRecords[index] : null;
    if (field === "id") {
      const previousId = record.id;
      record.id = cleanText(nextValue) || `label-${index + 1}`;
      if (draftRaw) draftRaw.label_id = cleanText(nextValue);
      else migrateRecordIdentity(previousId, record.id, index, target);
      if (draftRaw) {
        const row = target?.closest?.("tr[data-record-id]");
        if (row) row.dataset.recordId = record.id;
      }
    }
    else if (field === "number") {
      record.number = String(nextValue);
      record.front.number = String(nextValue);
      record.back.number = String(nextValue);
      if (draftRaw) draftRaw.number = String(nextValue);
    }
    else if (field === "front.qrValue") {
      const qrSettings = draftRaw ? null : qrSettingsForManualSide("front");
      if (qrSettings) materializeDynamicQrValues(qrSettings);
      record.front.qrValue = String(nextValue);
      if (draftRaw) draftRaw.front_qr_value = String(nextValue);
      else {
        setQrSourceToAssignedValues(qrSettings);
        updateQrControlState();
      }
    }
    else if (field === "back.qrValue") {
      const qrSettings = draftRaw ? null : qrSettingsForManualSide("back");
      if (qrSettings) materializeDynamicQrValues(qrSettings);
      record.back.qrValue = String(nextValue);
      if (draftRaw) draftRaw.back_qr_value = String(nextValue);
      else {
        setQrSourceToAssignedValues(qrSettings);
        updateQrControlState();
      }
    }
    else if (field === "front.backgroundFile") {
      record.front.backgroundFile = String(nextValue);
      if (draftRaw) draftRaw.front_background_file = String(nextValue);
      else resolveRecordBackground(record, "front");
    }
    else if (field === "back.backgroundFile") {
      record.back.backgroundFile = String(nextValue);
      if (draftRaw) draftRaw.back_background_file = String(nextValue);
      else resolveRecordBackground(record, "back");
    }
    else if (field === "data.excluded") {
      record.data.excluded = spreadsheetBoolean(nextValue);
      if (draftRaw) draftRaw.data = { ...(draftRaw.data || {}), excluded: spreadsheetBoolean(nextValue) };
    }
    else if (/^(front|back)\.(title|subtitle|body|footer)$/u.test(field) || /^(data)\.(name|category)$/u.test(field)) {
      setRecordFieldValue(record, field, String(nextValue));
      if (draftRaw) {
        const targetName = DATA_MAPPING.definition(field)?.target;
        if (targetName) draftRaw[targetName] = String(nextValue);
      }
    } else return false;
    return true;
  }

  function updateRecordField(target) {
    const index = Number(target.dataset.recordIndex);
    const draft = target.dataset.recordDraft === "true";
    const field = target.dataset.recordField;
    const nextValue = target.type === "checkbox" ? target.checked : target.value;
    if (!applyRecordFieldValue(index, field, nextValue, draft, target)) return;
    if (draft) {
      if (lastPromptBundle) invalidatePromptBundle();
      scheduleRefresh();
    } else {
      onProjectControlsChanged("목록을 수정했습니다.", { rerenderTable: false });
    }
  }

  function spreadsheetCellTarget(cell = activeSpreadsheetCell) {
    if (!cell) return null;
    return $("labelSheetRecordTableBody")?.querySelector(
      `input[data-record-index="${cell.index}"][data-record-field="${cell.field}"][data-record-draft="${cell.draft}"]`
    ) || null;
  }

  function syncSpreadsheetTools(rows = spreadsheetRows()) {
    const hasRows = rows.length > 0;
    const selectedCount = rows.filter((record) => selectedRecordIds.has(record.id)).length;
    if ($("labelSheetCopySelectedRowsBtn")) $("labelSheetCopySelectedRowsBtn").disabled = selectedCount === 0;
    if ($("labelSheetCopyAllRowsBtn")) $("labelSheetCopyAllRowsBtn").disabled = !hasRows;
    const active = activeSpreadsheetCell;
    const canFill = Boolean(active
      && active.draft === draftActive
      && active.field !== "id"
      && active.index >= 0
      && active.index < rows.length - 1);
    if ($("labelSheetFillDownBtn")) $("labelSheetFillDownBtn").disabled = !canFill;
  }

  function restoreSpreadsheetActiveCell(options = {}) {
    const tbody = $("labelSheetRecordTableBody");
    if (!tbody) return null;
    tbody.querySelectorAll(".is-spreadsheet-active").forEach((input) => input.classList.remove("is-spreadsheet-active"));
    const target = spreadsheetCellTarget();
    if (!target) {
      if (activeSpreadsheetCell && activeSpreadsheetCell.draft === draftActive) activeSpreadsheetCell = null;
      syncSpreadsheetTools();
      return null;
    }
    target.classList.add("is-spreadsheet-active");
    if (options.focus) target.focus({ preventScroll: true });
    return target;
  }

  function rememberSpreadsheetCell(target, options = {}) {
    const input = target?.closest?.("input[data-record-index][data-record-field]");
    if (!input) return null;
    activeSpreadsheetCell = {
      index: Number(input.dataset.recordIndex),
      field: input.dataset.recordField,
      draft: input.dataset.recordDraft === "true",
    };
    restoreSpreadsheetActiveCell();
    syncSpreadsheetTools();
    const column = spreadsheetColumn(activeSpreadsheetCell.field);
    const fillHint = activeSpreadsheetCell.field === "id"
      ? "ID는 중복 방지를 위해 열 채우기를 사용할 수 없습니다."
      : "Ctrl+D 또는 ‘열 끝까지 채우기’로 아래 행에 같은 값을 넣을 수 있습니다.";
    if (options.announce !== false) {
      setElementStatus("labelSheetSpreadsheetStatus", `${activeSpreadsheetCell.index + 1}행 · ${column?.label || activeSpreadsheetCell.field} 선택 · ${fillHint}`, "success");
    }
    return input;
  }

  function parseSpreadsheetMatrix(text) {
    const source = String(text ?? "").replace(/^\uFEFF/u, "");
    if (!source) return [];
    const parsed = ENGINE.parseTable(source, {
      delimiter: source.includes("\t") ? "\t" : "auto",
      header: "absent",
    });
    if (parsed.errors.length) throw new Error(parsed.errors[0].message);
    return parsed.rows;
  }

  function spreadsheetHeaderFields(row) {
    const fields = (row || []).map(spreadsheetFieldForHeader);
    const nonEmpty = (row || []).filter((cell) => cleanText(cell)).length;
    const recognized = fields.filter(Boolean).length;
    return {
      fields,
      hasHeader: recognized > 0 && recognized >= Math.max(1, Math.ceil(nonEmpty * 0.6)),
    };
  }

  function finishSpreadsheetBatch(draft, message) {
    if (draft) {
      if (lastPromptBundle) invalidatePromptBundle();
      scheduleRefresh();
      setImportStatus(message, "success");
    } else {
      reconcileSelectedRecordIds();
      onProjectControlsChanged(message, { rerenderTable: false });
    }
    renderRecordTable();
  }

  function applySpreadsheetText(text, options = {}) {
    const matrix = parseSpreadsheetMatrix(text);
    if (!matrix.length) {
      setElementStatus("labelSheetSpreadsheetStatus", "붙여넣을 셀 데이터가 없습니다.", "warning");
      return { applied: 0, added: 0, clipped: 0 };
    }
    const start = options.cell || activeSpreadsheetCell || { index: 0, field: "id", draft: draftActive };
    const draft = Boolean(start.draft && draftActive);
    const startColumn = Math.max(0, RECORD_TABLE_COLUMNS.findIndex((column) => column.field === start.field));
    const header = spreadsheetHeaderFields(matrix[0]);
    const dataRows = header.hasHeader ? matrix.slice(1) : matrix;
    if (!dataRows.length) {
      setElementStatus("labelSheetSpreadsheetStatus", "머리글 아래에 붙여넣을 데이터 행이 없습니다.", "warning");
      return { applied: 0, added: 0, clipped: 0 };
    }
    const beforeCount = spreadsheetRows(draft).length;
    const requestedCount = start.index + dataRows.length;
    ensureSpreadsheetRows(requestedCount, draft);
    const rows = spreadsheetRows(draft);
    let applied = 0;
    let clipped = 0;
    dataRows.forEach((row, rowOffset) => {
      const recordIndex = start.index + rowOffset;
      if (recordIndex >= rows.length) {
        clipped += row.length;
        return;
      }
      row.forEach((cellValue, cellIndex) => {
        const field = header.hasHeader
          ? header.fields[cellIndex]
          : RECORD_TABLE_COLUMNS[startColumn + cellIndex]?.field;
        if (!field) {
          clipped += 1;
          return;
        }
        if (applyRecordFieldValue(recordIndex, field, cellValue, draft)) applied += 1;
      });
    });
    activeSpreadsheetCell = { index: start.index, field: start.field, draft };
    const added = Math.max(0, rows.length - beforeCount);
    const message = `Excel 범위 ${applied}셀을 적용했습니다${added ? ` · 행 ${added}개 추가` : ""}${clipped ? ` · 범위 밖 ${clipped}셀 제외` : ""}.`;
    finishSpreadsheetBatch(draft, message);
    restoreSpreadsheetActiveCell({ focus: options.focus !== false });
    setElementStatus("labelSheetSpreadsheetStatus", `${message} 미리보기와 프롬프트 데이터가 갱신되었습니다.`, clipped ? "warning" : "success");
    return { applied, added, clipped, header: header.hasHeader };
  }

  function spreadsheetTsvCell(input) {
    const value = String(input ?? "");
    return /["\t\r\n]/u.test(value) ? `"${value.replace(/"/gu, '""')}"` : value;
  }

  function spreadsheetTsv(records) {
    const header = RECORD_TABLE_COLUMNS.map((column) => spreadsheetTsvCell(column.label)).join("\t");
    const rows = records.map((record) => RECORD_TABLE_COLUMNS.map((column) => {
      const cellValue = spreadsheetValue(record, column.field);
      return spreadsheetTsvCell(column.type === "boolean" ? (cellValue ? "예" : "") : cellValue);
    }).join("\t"));
    return [header, ...rows].join("\r\n");
  }

  async function copySpreadsheetRows(scope) {
    const rows = spreadsheetRows();
    const targets = scope === "selected" ? rows.filter((record) => selectedRecordIds.has(record.id)) : rows;
    if (!targets.length) {
      setElementStatus("labelSheetSpreadsheetStatus", scope === "selected" ? "복사할 행을 표 왼쪽에서 먼저 선택해 주세요." : "복사할 데이터가 없습니다.", "warning");
      return 0;
    }
    await writePromptClipboard(spreadsheetTsv(targets));
    setElementStatus("labelSheetSpreadsheetStatus", `${scope === "selected" ? "선택한" : "전체"} ${targets.length}행을 머리글 포함 TSV로 복사했습니다. Excel의 첫 셀에 붙여넣으세요.`, "success");
    return targets.length;
  }

  async function pasteSpreadsheetClipboard() {
    const fallbackTarget = spreadsheetCellTarget() || $("labelSheetRecordTableBody")?.querySelector('input[data-record-field="id"]');
    if (!navigator.clipboard?.readText) {
      fallbackTarget?.focus();
      setElementStatus("labelSheetSpreadsheetStatus", "브라우저의 클립보드 읽기가 제한되었습니다. 시작 셀을 선택하고 Ctrl+V를 눌러 주세요.", "warning");
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      applySpreadsheetText(text, { focus: true });
    } catch (_error) {
      fallbackTarget?.focus();
      setElementStatus("labelSheetSpreadsheetStatus", "클립보드 권한을 받지 못했습니다. 시작 셀을 선택한 상태에서 Ctrl+V를 눌러 주세요.", "warning");
    }
  }

  function fillSpreadsheetColumn() {
    const active = activeSpreadsheetCell;
    const rows = spreadsheetRows();
    if (!active || active.draft !== draftActive || active.index < 0 || active.index >= rows.length) {
      setElementStatus("labelSheetSpreadsheetStatus", "먼저 아래로 채울 시작 셀을 선택해 주세요.", "warning");
      return 0;
    }
    if (active.field === "id") {
      setElementStatus("labelSheetSpreadsheetStatus", "ID를 같은 값으로 채우면 중복 오류가 생깁니다. 번호·문구·QR·배경 열에서 사용해 주세요.", "warning");
      return 0;
    }
    const nextValue = spreadsheetValue(rows[active.index], active.field);
    let applied = 0;
    for (let index = active.index + 1; index < rows.length; index += 1) {
      if (applyRecordFieldValue(index, active.field, nextValue, active.draft)) applied += 1;
    }
    const column = spreadsheetColumn(active.field);
    const message = `${column?.label || active.field} 값을 ${active.index + 2}~${rows.length}행에 ${applied}셀 채웠습니다.`;
    finishSpreadsheetBatch(active.draft, message);
    restoreSpreadsheetActiveCell({ focus: true });
    setElementStatus("labelSheetSpreadsheetStatus", `${message} Ctrl+D로도 같은 작업을 할 수 있습니다.`, applied ? "success" : "warning");
    return applied;
  }

  function activateSubTab(buttonId, panelId, buttonSelector, panelSelector) {
    pane.querySelectorAll(buttonSelector).forEach((button) => {
      const active = button.id === buttonId;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    pane.querySelectorAll(panelSelector).forEach((panel) => {
      const active = panel.id === panelId;
      panel.classList.toggle("active", active);
      panel.hidden = !active;
    });
  }

  function applySequence(options = {}) {
    window.clearTimeout(sequenceTimer);
    try {
      const unnumbered = sequenceMode() === "none";
      const start = unnumbered ? 1 : Math.trunc(numberValue("labelSheetStartNumber", 1));
      const end = unnumbered
        ? Math.min(100000, Math.max(1, Math.trunc(numberValue("labelSheetRecordCount", 24))))
        : Math.trunc(numberValue("labelSheetEndNumber", start));
      if (!options.live) undoRecords = deepClone(project.records);
      const previousRecords = options.replace ? [] : project.records.map((record) => deepClone(record));
      const generatedRecords = ENGINE.createSequenceRecords({
        start,
        end,
        step: end >= start ? 1 : -1,
        prefix: unnumbered ? "" : value("labelSheetPrefix"),
        suffix: unnumbered ? "" : value("labelSheetSuffix"),
        padding: unnumbered ? 0 : Math.max(0, Math.trunc(numberValue("labelSheetPadding", 0))),
        idPrefix: "label-",
        includeNumber: !unnumbered,
      });
      project.records = generatedRecords.map((generated, index) => {
        const existing = previousRecords[index];
        if (!existing) return generated;
        existing.number = generated.number;
        existing.front = { ...(existing.front || {}), number: generated.number };
        existing.back = { ...(existing.back || {}), number: generated.number };
        return ENGINE.normalizeRecord(existing, index);
      });
      reconcileSelectedRecordIds();
      draftActive = false;
      draftRecords = [];
      draftRawRecords = [];
      draftHeaders = [];
      project.settings.sequenceMode = sequenceMode();
      const summary = unnumbered
        ? `연번 없음 · ${project.records.length}건 · 자동 반영`
        : `${value("labelSheetPrefix")}${start}~${end}${value("labelSheetSuffix")} · ${project.records.length}건 · 자동 반영`;
      if ($("labelSheetSequenceSummary")) $("labelSheetSequenceSummary").textContent = summary;
      if (options.announce !== false) setImportStatus(`${unnumbered ? "연번 없는" : "연속"} 데이터 ${project.records.length}건을 출력 목록에 적용했습니다.`, "success");
      onProjectControlsChanged(options.announce === false ? "" : unnumbered ? "수량 기준 데이터를 적용했습니다." : "연속번호를 적용했습니다.");
    } catch (error) {
      setImportStatus(error.message || "연속번호를 만들 수 없습니다.", "error");
    }
  }

  function scheduleSequenceApply() {
    updateSequenceControlState();
    window.clearTimeout(sequenceTimer);
    const unnumbered = sequenceMode() === "none";
    const requiredIds = unnumbered ? ["labelSheetRecordCount"] : ["labelSheetStartNumber", "labelSheetEndNumber"];
    if (requiredIds.some((id) => value(id) === "")) return;
    sequenceTimer = window.setTimeout(() => applySequence({ live: true, announce: false }), 220);
  }

  function reviewImportText(text, sourceLabel) {
    const parsed = TABLE_DATA?.parseLabelTable
      ? TABLE_DATA.parseLabelTable(text, { delimiter: "auto", header: "auto" })
      : ENGINE.parseTable(text, { delimiter: "auto", header: "auto" });
    if (parsed.errors.length || !parsed.objects.length) {
      setImportStatus(parsed.errors[0]?.message || "가져올 행을 찾지 못했습니다.", "error");
      return;
    }
    const sourceHeaders = parsed.hasHeader && parsed.originalHeaders?.length === parsed.headers?.length
      ? parsed.originalHeaders
      : parsed.headers;
    const headerCounts = new Map();
    draftHeaders = Array.from(sourceHeaders || []).map((header, index) => {
      const base = cleanText(header) || cleanText(parsed.headers?.[index]) || `column_${index + 1}`;
      const count = (headerCounts.get(base) || 0) + 1;
      headerCounts.set(base, count);
      return count === 1 ? base : `${base}_${count}`;
    });
    draftRawRecords = Array.isArray(parsed.rows) && draftHeaders.length
      ? parsed.rows.map((row) => Object.fromEntries(draftHeaders.map((header, index) => [header, row[index] ?? ""])))
      : parsed.objects.map((record) => ({ ...record }));
    draftMapping = DATA_MAPPING.suggest(draftHeaders, {
      current: project.settings?.dataMapping,
      duplex: project.spec.duplex.enabled,
    });
    draftMode = value("labelSheetPasteMode") === "update" ? "update-by-id" : value("labelSheetPasteMode") || "replace";
    draftActive = true;
    applyDraftMapping({ render: false });
    renderRecordTable();
    scheduleRefresh();
    const warning = parsed.warnings.length ? ` · 열 수 주의 ${parsed.warnings.length}건` : "";
    const mappingSummary = DATA_MAPPING.describe(draftMapping, draftHeaders);
    setImportStatus(`${sourceLabel} ${draftRecords.length}행 검토 중 · 출력 항목 ${mappingSummary.count}개 자동 연결${warning}.`, parsed.warnings.length ? "warning" : "success");
  }

  function commitImport() {
    if (!draftActive) {
      setImportStatus("먼저 붙여넣기 또는 CSV 데이터를 검토해 주세요.", "warning");
      return;
    }
    if (draftMode === "update-by-id" && draftRawRecords.some((record) => !cleanText(record.label_id || record.id || record.labelId))) {
      setImportStatus("ID 기준 업데이트에는 모든 행의 label_id가 필요합니다. 표의 ID 셀을 확인해 주세요.", "error");
      return;
    }
    undoRecords = deepClone(project.records);
    const importInput = draftMode === "update-by-id" ? draftRawRecords : draftRecords;
    const result = ENGINE.importRecords(project.records, importInput, { mode: draftMode, idField: draftMode === "update-by-id" ? "label_id" : "id" });
    if (result.errors.length) {
      setImportStatus(result.errors[0].message, "error");
      return;
    }
    project.records = result.records;
    const hasFrontQr = project.records.some((record) => cleanText(record.front?.qrValue));
    const hasBackQr = project.spec.duplex.enabled && project.records.some((record) => cleanText(record.back?.qrValue));
    if (hasFrontQr || hasBackQr) {
      const side = hasFrontQr && hasBackQr ? "both" : hasBackQr ? "back" : "front";
      project.settings.qr = normalizeQrSettings({
        ...(project.settings.qr || {}),
        enabled: true,
        source: "record",
        side,
      });
      if ($("labelSheetQrEnabled")) $("labelSheetQrEnabled").checked = true;
      setControl("labelSheetQrSource", "record");
      setControl("labelSheetQrSide", side);
      updateQrControlState();
    }
    reconcileSelectedRecordIds();
    project.settings.dataMapping = deepClone(draftMapping);
    draftRecords = [];
    draftRawRecords = [];
    draftHeaders = [];
    draftActive = false;
    renderRecordTable();
    const qrNotice = hasFrontQr || hasBackQr ? " · QR 표시 켬" : "";
    setImportStatus(`데이터 적용 완료 · 추가 ${result.added}건 · 업데이트 ${result.updated}건 · 건너뜀 ${result.skipped}건${qrNotice}`, result.warnings.length ? "warning" : "success");
    onProjectControlsChanged("가져온 데이터를 반영했습니다.", { rerenderTable: false });
  }

  function undoImport() {
    if (draftActive) {
      draftActive = false;
      draftRecords = [];
      draftRawRecords = [];
      draftHeaders = [];
      renderRecordTable();
      scheduleRefresh();
      setImportStatus("가져오기 미리보기를 취소했습니다.");
      return;
    }
    if (undoRecords) {
      project.records = undoRecords;
      undoRecords = null;
      reconcileSelectedRecordIds();
      renderRecordTable();
      onProjectControlsChanged("이전 출력 목록으로 되돌렸습니다.", { rerenderTable: false });
    }
  }

  async function readCsvFile(file) {
    if (!file) return;
    try {
      const text = await file.text();
      if ($("labelSheetCsvStatus")) $("labelSheetCsvStatus").textContent = `${file.name} · ${(file.size / 1024).toFixed(1)}KB`;
      reviewImportText(text, /\.tsv$/i.test(file.name) ? "TSV" : "CSV");
    } catch (_error) {
      setImportStatus("CSV/TSV 파일을 UTF-8 텍스트로 읽지 못했습니다.", "error");
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadSampleCsv() {
    const csv = [
      "label_id,number,front_title,name,front_body,front_footer,front_qr_value,back_title,back_body,back_qr_value,front_background_file,back_background_file",
      "PASS-001,001,행사 출입표,홍길동,VIP,2026 지역혁신 포럼,https://example.kr/pass/PASS-001,이용 안내,입장 시 제시해 주세요,,pass-001-front.png,pass-001-back.png",
      "PASS-002,002,행사 출입표,김서연,일반,2026 지역혁신 포럼,https://example.kr/pass/PASS-002,이용 안내,타인에게 양도할 수 없습니다,,pass-002-front.png,pass-002-back.png",
    ].join("\r\n");
    downloadBlob(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }), "label-ticket-sample.csv");
    setImportStatus("앞·뒷면과 배경 파일명이 분리된 샘플 CSV를 내려받았습니다.", "success");
  }

  function printFitValue() {
    const fit = value("labelSheetImageFit");
    if (fit === "contain" || fit === "original") return "contain";
    if (fit === "stretch") return "stretch";
    return "cover";
  }

  async function registerPendingAssets(files = pendingFiles) {
    const candidates = Array.from(files || []);
    if (!candidates.length) {
      setAssetStatus("먼저 PNG, JPEG 또는 WebP 이미지를 선택해 주세요.", "warning");
      return { readyAssets: [], failedAssets: [], rejected: [], duplicates: [] };
    }
    setAssetStatus(`${candidates.length}개 원본을 등록하고 있습니다…`);
    const result = await assetStore.registerFiles(candidates, {
      fit: printFitValue(),
      focalPoint: { x: numberValue("labelSheetFocalX", 50) / 100, y: numberValue("labelSheetFocalY", 50) / 100 },
    });
    const readyAssets = result.assets.filter((asset) => asset.status !== "failed");
    const failedAssets = result.assets.filter((asset) => asset.status === "failed");
    const request = project.spec.grid;
    if (readyAssets.length) {
      await assetStore.processMany(readyAssets.map((asset) => ({
        assetId: asset.assetId,
        widthMm: request.labelWidthMm,
        heightMm: request.labelHeightMm,
        dpi: project.spec.dpi,
        bleedMm: project.settings.bleedMm || 0,
        fit: printFitValue(),
        focalPoint: { x: numberValue("labelSheetFocalX", 50) / 100, y: numberValue("labelSheetFocalY", 50) / 100 },
        allowUpscale: checked("labelSheetAllowUpscale"),
      })));
    }
    pendingFiles = [];
    if ($("labelSheetAssetInput")) $("labelSheetAssetInput").value = "";
    if ($("labelSheetFreeBackgroundInput")) $("labelSheetFreeBackgroundInput").value = "";
    if ($("labelSheetRegisterFreeBackgroundBtn")) $("labelSheetRegisterFreeBackgroundBtn").disabled = true;
    if (!selectedAssetId && readyAssets[0]) selectedAssetId = readyAssets[0].assetId;
    renderAssets();
    project.assets = projectAssetMetadata();
    queueSave();
    const duplicateText = result.duplicates.length ? ` · 중복 ${result.duplicates.length}개는 기존 원본 재사용` : "";
    const rejectText = result.rejected.length ? ` · 거절 ${result.rejected.length}개` : "";
    const failedText = failedAssets.length ? ` · 이미지 해석 실패 ${failedAssets.length}개` : "";
    const hasFailure = result.rejected.length > 0 || failedAssets.length > 0;
    setAssetStatus(`등록 ${readyAssets.length}개${duplicateText}${rejectText}${failedText}`, !readyAssets.length && hasFailure ? "error" : hasFailure ? "warning" : "success");
    scheduleRefresh();
    return { ...result, readyAssets, failedAssets };
  }

  const FREE_BACKGROUND_TOOLS = Object.freeze({
    gemini: "https://gemini.google.com/app",
    firefly: "https://firefly.adobe.com/",
    designer: "https://designer.microsoft.com/image-creator",
  });

  function setFreeBackgroundStatus(message, tone = "") {
    setElementStatus("labelSheetFreeBackgroundStatus", message, tone);
  }

  function prepareFreeBackgroundPrompt(options = {}) {
    const working = effectiveProject();
    const placement = activeWysiwygPlacement();
    const recordIndex = Math.max(0, Number(placement?.recordIndex) || 0);
    const total = Math.max(1, working.records.length);
    const prompt = uniqueBackgroundPrompt(previewSide, working, recordIndex, total);
    const textarea = $("labelSheetFreeBackgroundPrompt");
    if (textarea) textarea.value = prompt;
    if ($("labelSheetCopyFreeBackgroundPromptBtn")) $("labelSheetCopyFreeBackgroundPromptBtn").disabled = false;
    if ($("labelSheetOpenFreeImageToolBtn")) $("labelSheetOpenFreeImageToolBtn").disabled = false;
    if (options.announce !== false) {
      setFreeBackgroundStatus(`${previewSide === "front" ? "앞면" : "뒷면"} ${working.spec.grid.labelWidthMm}×${working.spec.grid.labelHeightMm}mm용 배경 전용 프롬프트를 준비했습니다.`, "success");
    }
    return prompt;
  }

  async function copyFreeBackgroundPrompt() {
    const prompt = cleanText(value("labelSheetFreeBackgroundPrompt")) || prepareFreeBackgroundPrompt({ announce: false });
    await writePromptClipboard(prompt);
    setFreeBackgroundStatus("배경 전용 프롬프트를 복사했습니다. 선택한 무료 생성 도구에 붙여넣어 주세요.", "success");
  }

  async function openFreeBackgroundTool() {
    const prompt = cleanText(value("labelSheetFreeBackgroundPrompt")) || prepareFreeBackgroundPrompt({ announce: false });
    const toolKey = value("labelSheetFreeImageTool") || "gemini";
    const toolUrl = FREE_BACKGROUND_TOOLS[toolKey] || FREE_BACKGROUND_TOOLS.gemini;
    const opened = window.open(toolUrl, "_blank");
    if (opened) opened.opener = null;
    await writePromptClipboard(prompt);
    setFreeBackgroundStatus(
      opened
        ? "프롬프트를 복사하고 생성 도구를 새 탭에서 열었습니다. 생성 결과를 내려받은 뒤 3단계에서 등록하세요."
        : "프롬프트는 복사했습니다. 팝업이 차단되어 생성 도구를 열지 못했으니 브라우저의 팝업 허용 상태를 확인해 주세요.",
      opened ? "success" : "warning"
    );
  }

  function selectFreeBackgroundFiles(files) {
    pendingFiles = Array.from(files || []);
    const registerButton = $("labelSheetRegisterFreeBackgroundBtn");
    if (registerButton) registerButton.disabled = pendingFiles.length === 0;
    setFreeBackgroundStatus(
      pendingFiles.length
        ? `${pendingFiles.length}개 생성 이미지를 선택했습니다. ‘선택 파일 보관함 등록’을 누르면 규격 맞춤과 품질 검사를 시작합니다.`
        : "등록할 생성 이미지가 선택되지 않았습니다.",
      pendingFiles.length ? "success" : "warning"
    );
  }

  async function registerFreeBackgroundFiles(files = pendingFiles) {
    const result = await registerPendingAssets(files);
    const registered = result?.readyAssets?.length || 0;
    const failed = (result?.failedAssets?.length || 0) + (result?.rejected?.length || 0);
    if (registered) {
      setFreeBackgroundStatus(`배경 ${registered}개를 보관함에 등록했습니다${failed ? ` · 실패 ${failed}개` : ""}. 위 보관함에서 선택해 라벨에 배정하세요.`, failed ? "warning" : "success");
    } else {
      setFreeBackgroundStatus(failed ? "선택한 이미지를 등록하지 못했습니다. PNG·JPEG·WebP 파일인지 확인해 주세요." : "등록할 이미지를 먼저 선택해 주세요.", failed ? "error" : "warning");
    }
  }

  async function pasteFreeBackgroundFromClipboard() {
    if (!navigator.clipboard?.read) {
      setFreeBackgroundStatus("이 브라우저는 클립보드 이미지 읽기를 지원하지 않습니다. 생성 이미지를 파일로 내려받아 선택해 주세요.", "warning");
      return;
    }
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const mimeType = item.types.find((type) => ["image/png", "image/jpeg", "image/webp"].includes(type));
        if (!mimeType) continue;
        const blob = await item.getType(mimeType);
        const extension = mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1];
        const file = new File([blob], `ai-background-${Date.now()}.${extension}`, { type: mimeType });
        selectFreeBackgroundFiles([file]);
        await registerFreeBackgroundFiles([file]);
        return;
      }
      setFreeBackgroundStatus("클립보드에서 PNG·JPEG·WebP 이미지를 찾지 못했습니다. 생성 결과 이미지를 먼저 복사해 주세요.", "warning");
    } catch (error) {
      setFreeBackgroundStatus(error?.name === "NotAllowedError" ? "클립보드 접근이 허용되지 않았습니다. 파일 선택 방식으로 등록해 주세요." : "클립보드 이미지를 읽지 못했습니다. 파일 선택 방식으로 등록해 주세요.", "warning");
    }
  }

  async function ensureDefaultAssets(options = {}) {
    const force = Boolean(options.force);
    const seeded = window.localStorage.getItem(DEFAULT_ASSET_SEED_KEY) === DEFAULT_ASSET_SEED_VERSION;
    if (!force && seeded) return { registered: 0, existing: DEFAULT_BACKGROUND_ASSETS.length, failed: 0 };

    let registered = 0;
    let existing = 0;
    let failed = 0;
    if (options.announce) setAssetStatus("기본 배경 6종을 확인하고 있습니다…");
    for (const definition of DEFAULT_BACKGROUND_ASSETS) {
      const found = assetStore.list().find((asset) => asset.filename === definition.filename && asset.status !== "failed");
      if (found) {
        existing += 1;
        continue;
      }
      try {
        const asset = await assetStore.registerGeneratedUrl(definition.url, {
          filename: definition.filename,
          source: "generated",
          fit: "cover",
          focalPoint: { x: 0.5, y: 0.5 },
        });
        if (asset.status === "failed") failed += 1;
        else registered += 1;
      } catch (_error) {
        failed += 1;
      }
    }
    if (!failed) window.localStorage.setItem(DEFAULT_ASSET_SEED_KEY, DEFAULT_ASSET_SEED_VERSION);
    project.assets = projectAssetMetadata();
    renderAssets();
    queueSave();
    if (options.announce) {
      setAssetStatus(
        failed
          ? `기본 배경 ${registered}개 복구 · ${failed}개 불러오기 실패`
          : `기본 배경 6종 준비 완료${registered ? ` · 새로 등록 ${registered}개` : ""}`,
        failed ? "warning" : "success",
      );
    }
    return { registered, existing, failed };
  }

  function renderAssets() {
    const container = $("labelSheetAssetList");
    if (!container) return;
    const assets = assetStore.list();
    container.replaceChildren();
    if (!assets.length) {
      const empty = document.createElement("p");
      empty.className = "label-sheet-empty-state";
      empty.textContent = "이미지를 등록하면 원본 크기, 인쇄용 크기, 연결 상태가 표시됩니다.";
      container.appendChild(empty);
    } else {
      if (!assets.some((asset) => asset.assetId === selectedAssetId)) selectedAssetId = assets[0].assetId;
      assets.forEach((asset) => {
        const label = document.createElement("label");
        label.className = "label-sheet-asset-card";
        label.classList.toggle("is-selected", asset.assetId === selectedAssetId);
        label.setAttribute("role", "listitem");
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "labelSheetAssetSelection";
        radio.value = asset.assetId;
        radio.checked = asset.assetId === selectedAssetId;
        radio.className = "label-sheet-asset-radio";
        radio.setAttribute("aria-label", `${asset.filename} 선택`);
        const image = document.createElement("img");
        image.src = asset.thumbnail?.url || asset.original?.url || "";
        image.alt = `${asset.filename} 미리보기`;
        const body = document.createElement("span");
        body.className = "label-sheet-asset-card-body";
        const name = document.createElement("strong");
        name.textContent = asset.filename;
        name.title = asset.filename;
        const size = document.createElement("span");
        size.textContent = `${asset.width}×${asset.height}px · ${asset.mime.replace("image/", "").toUpperCase()}`;
        const state = document.createElement("span");
        const defaultLabel = asset.filename.startsWith("기본-") ? "기본 · " : "";
        state.textContent = asset.status === "low-resolution" ? `${defaultLabel}해상도 주의` : asset.status === "failed" ? "처리 실패" : `${defaultLabel}연결 ${asset.referenceCount || 0}건`;
        body.append(name, size, state);
        label.append(radio, image, body);
        container.appendChild(label);
      });
    }
    if ($("labelSheetAssetStepState")) {
      $("labelSheetAssetStepState").textContent = normalizeOutputGoal(project.settings?.outputGoal) === "prompt" ? "DNA 준비" : `${assets.length}개`;
    }
    if ($("labelSheetAssetStatus") && !assets.length) $("labelSheetAssetStatus").textContent = "등록된 이미지 없음";
    if (assets.length) setCropControlsForAsset(assetStore.get(selectedAssetId));
    else updateCropEditor();
  }

  function releaseRecordAsset(record, sideName) {
    if (!record?.[sideName]) return;
    record[sideName].backgroundAssetId = "";
    record[sideName].backgroundFile = "";
    record[sideName].backgroundCrop = null;
  }

  function assignRecordAsset(record, sideName, assetId) {
    if (!record?.[sideName] || !assetId) return false;
    const previous = cleanText(record[sideName].backgroundAssetId);
    record[sideName].backgroundAssetId = assetId;
    const asset = assetStore.get(assetId);
    if (asset) record[sideName].backgroundFile = asset.filename;
    record[sideName].backgroundCrop = null;
    return previous !== assetId;
  }

  async function updateSelectedAssetProcessing() {
    if (!selectedAssetId) return;
    const crop = value("labelSheetImageFit") === "crop" ? cropFromControls() : undefined;
    await assetStore.updateSettings(selectedAssetId, {
      fit: printFitValue(),
      crop,
      focalPoint: { x: numberValue("labelSheetFocalX", 50) / 100, y: numberValue("labelSheetFocalY", 50) / 100 },
    });
    await assetStore.process(selectedAssetId, {
      widthMm: project.spec.grid.labelWidthMm,
      heightMm: project.spec.grid.labelHeightMm,
      dpi: project.spec.dpi,
      bleedMm: project.settings.bleedMm || 0,
      fit: printFitValue(),
      crop,
      focalPoint: { x: numberValue("labelSheetFocalX", 50) / 100, y: numberValue("labelSheetFocalY", 50) / 100 },
      allowUpscale: checked("labelSheetAllowUpscale"),
    });
  }

  async function assignAssets() {
    const scope = value("labelSheetAssetScope");
    const face = value("labelSheetAssetFace");
    const sides = face === "both" ? ["front", "back"] : [face === "back" ? "back" : "front"];
    const records = project.records.filter((record) => !record.data?.excluded);
    const assets = assetStore.list().filter((asset) => asset.status !== "failed");
    if (!records.length) {
      setAssetStatus("배경을 배정할 라벨 데이터가 없습니다.", "warning");
      return;
    }
    if (!assets.length) {
      setAssetStatus("먼저 배경 이미지를 등록해 주세요.", "warning");
      return;
    }
    if (!["filename", "sequence"].includes(scope) && !selectedAssetId) {
      setAssetStatus("보관함에서 배경 한 개를 선택해 주세요.", "warning");
      return;
    }

    await updateSelectedAssetProcessing().catch(() => undefined);
    let assigned = 0;
    let missing = 0;
    if (scope === "filename") {
      sides.forEach((sideName) => {
        records.forEach((record) => {
          const filename = cleanText(record[sideName]?.backgroundFile || record.data?.[`${sideName}_background_file`]);
          if (!filename) {
            missing += 1;
            return;
          }
          const match = assetStore.findByFilename(filename);
          if (match.status === "matched") assigned += assignRecordAsset(record, sideName, match.assets[0].assetId) ? 1 : 0;
          else missing += 1;
        });
      });
    } else if (scope === "sequence") {
      const ordered = assets.slice().sort((left, right) => left.filename.localeCompare(right.filename, "ko", { numeric: true }));
      sides.forEach((sideName) => {
        records.forEach((record, index) => {
          if (!ordered[index]) {
            missing += 1;
            return;
          }
          assigned += assignRecordAsset(record, sideName, ordered[index].assetId) ? 1 : 0;
        });
      });
    } else {
      let targets = records;
      if (scope === "selected") targets = records.filter((record) => selectedRecordIds.has(record.id));
      if (scope === "missing") targets = records.filter((record) => sides.some((sideName) => !cleanText(record[sideName]?.backgroundAssetId)));
      if (!targets.length) {
        setAssetStatus(scope === "selected" ? "표에서 배정할 행을 클릭해 선택해 주세요." : "선택한 범위에 배경이 필요한 라벨이 없습니다.", "warning");
        return;
      }
      sides.forEach((sideName) => targets.forEach((record) => {
        if (scope === "missing" && cleanText(record[sideName]?.backgroundAssetId)) return;
        assigned += assignRecordAsset(record, sideName, selectedAssetId) ? 1 : 0;
      }));
    }
    onProjectControlsChanged("배경 연결을 반영했습니다.", { rerenderTable: false });
    renderAssets();
    renderRecordTable();
    setAssetStatus(`배경 ${assigned}건을 연결했습니다${missing ? ` · 파일 미일치 ${missing}건` : ""}.`, missing ? "warning" : "success");
  }

  async function removeSelectedAsset() {
    const asset = assetStore.get(selectedAssetId);
    if (!asset) {
      setAssetStatus("삭제할 배경을 선택해 주세요.", "warning");
      return;
    }
    const referenced = [];
    project.records.forEach((record) => ["front", "back"].forEach((sideName) => {
      if (record[sideName]?.backgroundAssetId === selectedAssetId) referenced.push({ record, sideName });
    }));
    const message = referenced.length
      ? `${asset.filename}은 ${referenced.length}개 면에 연결되어 있습니다. 연결을 해제하고 보관함에서 삭제할까요? 원본 파일을 다시 올리기 전에는 복구할 수 없습니다.`
      : `${asset.filename}을 보관함에서 삭제할까요? 원본 파일을 다시 올리기 전에는 복구할 수 없습니다.`;
    if (!window.confirm(message)) return;
    referenced.forEach(({ record, sideName }) => {
      releaseRecordAsset(record, sideName);
    });
    await assetStore.remove(selectedAssetId, { force: true });
    selectedAssetId = "";
    onProjectControlsChanged("배경 이미지를 삭제했습니다.", { rerenderTable: false });
    renderAssets();
    renderRecordTable();
    setAssetStatus(`${asset.filename}을 삭제했습니다. 다시 사용하려면 원본을 재등록해 주세요.`, "success");
  }

  function resolvedBackTransform(spec) {
    const requested = spec.duplex.backTransform;
    return requested === "auto" ? ENGINE.recommendBackTransform(spec.page.orientation, spec.duplex.flipEdge) : requested;
  }

  function createPageModels(working) {
    const pagination = ENGINE.paginateRecords(working.records, working.spec);
    const transform = transformToRenderer(resolvedBackTransform(working.spec));
    const models = { front: [], back: [], pagination };
    ["front", "back"].forEach((sideName) => {
      models[sideName] = pagination.pages.map((sheet) => ({
        paper: working.spec.page,
        spec: working.spec.page,
        pageNumber: sheet.pageNumber,
        sheetIndex: sheet.sheetIndex,
        side: sideName,
        backTransform: sideName === "back" ? transform : "none",
        placements: sheet.slots.filter(Boolean).map((slot) => {
          const sourceRecord = working.records[slot.recordIndex] || slot.record;
          return {
          ...slot.rectMm,
          record: sourceRecord,
          recordId: slot.recordId,
          recordIndex: slot.recordIndex,
          side: sideName,
          assetId: sourceRecord?.[sideName]?.backgroundAssetId || "",
          style: sourceRecord?.style,
        };
        }),
      }));
    });
    return models;
  }

  function createOutputSnapshot(options = {}) {
    const sourceProject = options.project || project;
    const working = effectiveProject(sourceProject, { sync: options.sync !== false });
    const models = createPageModels(working);
    return { working, models };
  }

  function previewSourceProject() {
    if (!draftActive) return project;
    syncProjectFromControls();
    const previewProject = deepClone(project);
    previewProject.records = deepClone(draftRecords);
    return previewProject;
  }

  function rendererOptions(working, sideName, extra = {}) {
    return {
      assetStore,
      side: sideName,
      previewDpi: PREVIEW_DPI,
      dpi: working.spec.dpi,
      safeAreaMm: working.settings.safeAreaMm || 2,
      bleedMm: working.settings.bleedMm || 0,
      showCutLines: true,
      showSafeArea: true,
      backTransform: transformToRenderer(resolvedBackTransform(working.spec)),
      backOffsetXmm: working.spec.duplex.offsetXmm,
      backOffsetYmm: working.spec.duplex.offsetYmm,
      allowUpscale: Boolean(working.settings.allowUpscale),
      qrEnabled: Boolean(normalizeQrSettings(working.settings?.qr).enabled),
      ...extra,
    };
  }

  function ensureWysiwygLayouts() {
    const layouts = normalizeTextLayouts(project.settings?.textLayouts);
    ["front", "back"].forEach((sideName) => ["withQr", "withoutQr"].forEach((variant) => {
      if (!layouts[sideName][variant] || (variant === "withQr" && isLegacyDefaultTextLayout(layouts[sideName][variant]))) {
        layouts[sideName][variant] = createDefaultTextFieldLayout(variant);
      }
    }));
    project.settings.textLayouts = layouts;
    return layouts;
  }

  function activeWysiwygPlacement() {
    const page = currentPages[previewSide]?.[currentPageIndex];
    if (!page?.placements?.length) return null;
    wysiwygPlacementIndex = Math.min(Math.max(0, wysiwygPlacementIndex), page.placements.length - 1);
    return page.placements[wysiwygPlacementIndex] || page.placements[0] || null;
  }

  function activeWysiwygLayout(create = false) {
    const placement = activeWysiwygPlacement();
    const sideData = placement?.record?.[previewSide] || {};
    const variant = textLayoutVariant(sideData);
    const layouts = create ? ensureWysiwygLayouts() : normalizeTextLayouts(project.settings?.textLayouts);
    const globalLayout = layouts[previewSide][variant] || createDefaultTextFieldLayout(variant);
    const sourceRecord = activeWysiwygRecord();
    const key = sourceRecord?.id ? recordLayoutKey(sourceRecord.id) : "";
    const recordLayouts = normalizeRecordTextLayouts(project.settings?.recordTextLayouts);
    let layout = globalLayout;
    let inherited = false;
    if (wysiwygScope === "record" && key) {
      if (!recordLayouts[key] && create) {
        recordLayouts[key] = { front: { withQr: null, withoutQr: null }, back: { withQr: null, withoutQr: null } };
      }
      if (recordLayouts[key] && !recordLayouts[key][previewSide][variant] && create) {
        recordLayouts[key][previewSide][variant] = deepClone(globalLayout);
      }
      layout = recordLayouts[key]?.[previewSide]?.[variant] || globalLayout;
      inherited = !recordLayouts[key]?.[previewSide]?.[variant];
      if (create) project.settings.recordTextLayouts = recordLayouts;
    }
    return {
      placement,
      sideName: previewSide,
      variant,
      layout,
      globalLayout,
      layouts,
      recordLayouts,
      recordKey: key,
      scope: wysiwygScope,
      inherited,
    };
  }

  function commitWysiwygLayout(context) {
    if (!context) return 0;
    if (context.scope === "record" && context.recordKey) {
      project.settings.recordTextLayouts = context.recordLayouts;
      return 0;
    }
    project.settings.textLayouts = context.layouts;
    const cleared = clearRecordTextLayoutOverrides(project.settings?.recordTextLayouts, context.sideName, context.variant);
    context.recordLayouts = cleared.layouts;
    project.settings.recordTextLayouts = cleared.layouts;
    return cleared.cleared;
  }

  function replaceActiveWysiwygLayout(fields) {
    const context = activeWysiwygLayout(true);
    const next = normalizeTextFieldLayoutSet(fields);
    if (context.scope === "record" && context.recordKey) {
      context.recordLayouts[context.recordKey][context.sideName][context.variant] = next;
    } else {
      context.layouts[context.sideName][context.variant] = next;
    }
    context.layout = next;
    commitWysiwygLayout(context);
    return next;
  }

  function activeWysiwygRecord() {
    const placement = activeWysiwygPlacement();
    const printableRecords = project.records.filter((record) => !record.data?.excluded);
    const recordIndex = Number(placement?.recordIndex);
    if (Number.isInteger(recordIndex) && recordIndex >= 0 && recordIndex < printableRecords.length) return printableRecords[recordIndex];
    const id = cleanText(placement?.record?.id);
    return id ? project.records.find((record) => record.id === id) || null : null;
  }

  function activeWysiwygTextValue(context = activeWysiwygLayout(false)) {
    if (wysiwygField === "qr") return "";
    const sideData = context.placement?.record?.[context.sideName] || {};
    return String(sideData[wysiwygField] ?? (wysiwygField === "number" ? context.placement?.record?.number : "") ?? "");
  }

  function resolvedWysiwygQrLayout(context = activeWysiwygLayout(false)) {
    const placement = context?.placement;
    const width = Math.max(0.1, Number(placement?.widthMm) || 1);
    const height = Math.max(0.1, Number(placement?.heightMm) || 1);
    const sideData = placement?.record?.[context?.sideName || previewSide] || {};
    const qrStyle = { ...(placement?.record?.style?.qr || {}), ...(sideData.qrStyle || {}) };
    const custom = normalizeQrFieldLayout(context?.layout?.qr);
    const sizePercent = custom.sizePercent ?? clamp(Number(qrStyle.sizePercent) || 28, 16, 48);
    const sizeMm = Math.min(width, height) * sizePercent / 100;
    const sizeWidthPercent = sizeMm / width * 100;
    const sizeHeightPercent = sizeMm / height * 100;
    const safeInset = Math.max(Number(currentWorkingProject?.settings?.safeAreaMm ?? project.settings?.safeAreaMm) || 2, Math.min(width, height) * 0.04);
    const position = ["left", "right", "top-left", "top-right", "bottom-left", "bottom-right", "center"].includes(qrStyle.position) ? qrStyle.position : "right";
    let xMm = width - safeInset - sizeMm;
    let yMm = (height - sizeMm) / 2;
    if (position.includes("left")) xMm = safeInset;
    if (position === "center") xMm = (width - sizeMm) / 2;
    if (position.startsWith("top")) yMm = safeInset;
    if (position.startsWith("bottom")) yMm = height - safeInset - sizeMm;
    const xPercent = clamp(custom.xPercent ?? xMm / width * 100, 0, Math.max(0, 100 - sizeWidthPercent));
    const yPercent = clamp(custom.yPercent ?? yMm / height * 100, 0, Math.max(0, 100 - sizeHeightPercent));
    return {
      xPercent,
      yPercent,
      sizePercent,
      widthPercent: sizeWidthPercent,
      heightPercent: sizeHeightPercent,
      layoutMode: custom.layoutMode || (["adaptive", "reserved", "overlay"].includes(qrStyle.layoutMode) ? qrStyle.layoutMode : "adaptive"),
      gapPercent: custom.gapPercent ?? clamp(Number(qrStyle.gapPercent) || 2, 0, 12),
      layer: custom.layer || (qrStyle.layer === "behind" ? "behind" : "front"),
    };
  }

  function resolvedWysiwygContentLayout(context = activeWysiwygLayout(false)) {
    return normalizeContentFieldLayout(context?.layout?.content);
  }

  function automaticFieldHeightPercent(config) {
    const sizePercent = Math.max(0, Number(config?.sizePercent) || 0);
    const lineCount = Math.max(1, Number(config?.maxLines) || 1);
    // The output renderer uses a 1.25 line-height for custom fields. Keep the
    // editor's initial collision box large enough for every permitted line;
    // finalizeWysiwygOverlayVisuals() replaces this estimate with the actual
    // browser-measured height once the font and width are applied.
    return clamp(sizePercent * lineCount * WYSIWYG_TEXT_LINE_HEIGHT + 2, WYSIWYG_AUTO_HEIGHT_MIN_PERCENT, 100);
  }

  function setFocusToolPanel(panelInput, options = {}) {
    const panel = ["quick", "common", "detail"].includes(panelInput) ? panelInput : "quick";
    focusToolPanel = panel;
    pane.querySelectorAll("[data-label-sheet-focus-tool]").forEach((button) => {
      const active = button.dataset.labelSheetFocusTool === panel;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    ["quick", "common", "detail"].forEach((name) => {
      const target = $(`labelSheetFocus${name[0].toUpperCase()}${name.slice(1)}Panel`);
      if (!target) return;
      const active = name === panel;
      target.hidden = !active;
      target.classList.toggle("active", active);
    });
    const details = $("labelSheetWysiwygDetails");
    if (panel === "detail" && details) details.open = true;
    if (options.focus === true) {
      const firstControl = panel === "detail"
        ? $("labelSheetWysiwygText")
        : panel === "common"
          ? $("labelSheetContentOrientation")
          : $("labelSheetQuickFont");
      firstControl?.focus({ preventScroll: true });
    }
  }

  function integrateFocusEditorControls() {
    const moves = [
      ["labelSheetQuickEditbar", "labelSheetFocusQuickPanel", "is-focus-integrated"],
      ["labelSheetCommonLayout", "labelSheetFocusCommonPanel", "is-focus-integrated"],
      ["labelSheetWysiwygDetails", "labelSheetFocusDetailPanel", "is-focus-integrated"],
    ];
    moves.forEach(([sourceId, hostId, className]) => {
      const source = $(sourceId);
      const host = $(hostId);
      if (!source || !host || source.parentElement === host) return;
      source.classList.add(className);
      host.appendChild(source);
    });
    const details = $("labelSheetWysiwygDetails");
    if (details) details.open = true;
    setFocusToolPanel(focusToolPanel);
  }

  function toggleFocusShortcutHelp(force) {
    const help = $("labelSheetFocusShortcutHelp");
    const button = $("labelSheetFocusShortcutHelpBtn");
    if (!help || !button) return;
    const visible = typeof force === "boolean" ? force : help.hidden;
    help.hidden = !visible;
    button.setAttribute("aria-expanded", String(visible));
    button.textContent = visible ? "단축키 닫기" : "단축키 보기";
  }

  function selectWysiwygTarget(targetInput, options = {}) {
    const target = WYSIWYG_TARGET_KEYS.includes(targetInput) ? targetInput : "title";
    const context = activeWysiwygLayout(false);
    if (target === "qr" && context.variant !== "withQr") {
      setElementStatus("labelSheetFocusStatus", "이 티켓에는 QR이 없습니다. 다른 문구 항목을 선택하거나 QR을 활성화해 주세요.", "warning");
      return;
    }
    wysiwygField = target;
    syncWysiwygControls();
    renderWysiwygWorkspace(currentWorkingProject, currentPages[previewSide]?.[currentPageIndex]);
    if (options.focusStage === true) $("labelSheetFocusStage")?.focus({ preventScroll: true });
  }

  function adjustActiveWysiwygSize(delta) {
    if (wysiwygField === "content") return;
    const context = activeWysiwygLayout(false);
    if (!context.layout) return;
    const config = wysiwygField === "qr"
      ? resolvedWysiwygQrLayout(context)
      : normalizeTextFieldLayout(context.layout[wysiwygField], wysiwygField);
    const minimum = wysiwygField === "qr" ? 16 : 3;
    const maximum = wysiwygField === "qr" ? 48 : 30;
    const next = clamp(Number(config.sizePercent) + Number(delta || 0), minimum, maximum);
    updateWysiwygField("sizePercent", next, `${WYSIWYG_FIELD_LABELS[wysiwygField]} 크기를 ${delta < 0 ? "줄였습니다" : "키웠습니다"}.`);
  }

  function nudgeActiveWysiwyg(direction, step = 1) {
    const delta = {
      left: [-step, 0],
      right: [step, 0],
      up: [0, -step],
      down: [0, step],
    }[direction];
    if (!delta) return;
    const context = activeWysiwygLayout(true);
    if (!context.layout) return;
    const isQr = wysiwygField === "qr";
    const isContent = wysiwygField === "content";
    const config = isQr
      ? resolvedWysiwygQrLayout(context)
      : isContent
        ? resolvedWysiwygContentLayout(context)
        : normalizeTextFieldLayout(context.layout[wysiwygField], wysiwygField);
    const width = isQr ? config.widthPercent : config.widthPercent;
    const height = isQr
      ? config.heightPercent
      : isContent
        ? config.heightPercent
        : (config.heightPercent ?? automaticFieldHeightPercent(config));
    config.xPercent = clamp(Number(config.xPercent) + delta[0], 0, Math.max(0, 100 - Number(width || 0)));
    config.yPercent = clamp(Number(config.yPercent) + delta[1], 0, Math.max(0, 100 - Number(height || 0)));
    if (isQr) context.layout.qr = normalizeQrFieldLayout(config);
    else if (isContent) context.layout.content = normalizeContentFieldLayout(config);
    else context.layout[wysiwygField] = normalizeTextFieldLayout(config, wysiwygField);
    commitWysiwygLayout(context);
    syncWysiwygControls();
    renderWysiwygFocusOverlayNow();
    onProjectControlsChanged(`${WYSIWYG_FIELD_LABELS[wysiwygField]} 영역을 ${direction === "left" ? "왼쪽" : direction === "right" ? "오른쪽" : direction === "up" ? "위" : "아래"}으로 ${step}% 이동했습니다.`, { rerenderTable: false });
  }

  function handleFocusEditorKeydown(event) {
    if (!wysiwygEnabled || event.defaultPrevented || event.ctrlKey || event.metaKey) return;
    const textEntry = Boolean(event.target.closest?.("input:not([type='checkbox']):not([type='radio']), select, textarea, [contenteditable='true']"));
    const consume = () => {
      event.preventDefault();
      event.stopPropagation();
    };
    if (event.altKey && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      consume();
      const direction = ({ ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" })[event.key];
      nudgeActiveWysiwyg(direction, event.shiftKey ? 5 : 1);
      return;
    }
    const alignmentKey = event.key.toLowerCase();
    if ((event.altKey || !textEntry) && ["l", "c", "r"].includes(alignmentKey) && WYSIWYG_FIELD_KEYS.includes(wysiwygField)) {
      consume();
      const align = ({ l: "left", c: "center", r: "right" })[alignmentKey];
      updateWysiwygField("align", align, `${WYSIWYG_FIELD_LABELS[wysiwygField]} 정렬을 바꿨습니다.`);
      return;
    }
    if (event.altKey || textEntry) return;
    const numberTargets = ["content", "number", "title", "subtitle", "body", "footer", "qr"];
    if (/^[1-7]$/.test(event.key)) {
      consume();
      selectWysiwygTarget(numberTargets[Number(event.key) - 1], { focusStage: true });
      return;
    }
    if (event.key === "[" || event.key === "]") {
      if (wysiwygField === "content") return;
      consume();
      adjustActiveWysiwygSize(event.key === "[" ? -0.5 : 0.5);
      return;
    }
    if (event.key === "?") {
      consume();
      toggleFocusShortcutHelp();
    }
  }

  function setWysiwygControlVisibility(target) {
    const isQr = target === "qr";
    const isContent = target === "content";
    const isText = !isQr && !isContent;
    document.querySelectorAll("#paneLabelSheet [data-wysiwyg-text-only]").forEach((element) => {
      element.hidden = !isText;
    });
    document.querySelectorAll("#paneLabelSheet [data-wysiwyg-qr-only]").forEach((element) => {
      element.hidden = !isQr;
    });
    document.querySelectorAll("#paneLabelSheet [data-wysiwyg-box-only]").forEach((element) => {
      element.hidden = isQr;
    });
    document.querySelectorAll("#paneLabelSheet [data-wysiwyg-text-box-only]").forEach((element) => {
      element.hidden = !isText;
    });
    document.querySelectorAll("#paneLabelSheet [data-wysiwyg-size-only]").forEach((element) => {
      element.hidden = isContent;
    });
  }

  function syncWysiwygControls() {
    const toggle = $("labelSheetWysiwygToggle");
    const controls = $("labelSheetWysiwygControls");
    const quickbar = $("labelSheetQuickEditbar");
    const focusEditor = $("labelSheetFocusEditor");
    const previewToolbar = $("labelSheetPreviewToolbar");
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(wysiwygEnabled));
      toggle.textContent = wysiwygEnabled ? "편집 끝내기" : "문구·QR 편집";
    }
    if (controls) controls.hidden = !wysiwygEnabled;
    if (quickbar) quickbar.hidden = !wysiwygEnabled;
    if (focusEditor) focusEditor.hidden = pane.classList.contains("label-sheet-workspace-v2") ? false : !wysiwygEnabled;
    if (previewToolbar) previewToolbar.classList.toggle("is-editing-hidden", wysiwygEnabled);
    if (!wysiwygEnabled) return;
    const context = activeWysiwygLayout(false);
    if (context.placement && wysiwygField === "qr" && context.variant !== "withQr") wysiwygField = "title";
    const isQr = wysiwygField === "qr";
    const isContent = wysiwygField === "content";
    const isText = !isQr && !isContent;
    const uprightText = isText && value("labelSheetContentOrientation") === "vertical-upright";
    [
      ["labelSheetWysiwygAlignLabel", uprightText ? "세로축 정렬" : "문구 정렬"],
      ["labelSheetWysiwygMaxLinesLabel", uprightText ? "최대 열 수" : "최대 줄 수"],
      ["labelSheetWysiwygWidthLabel", uprightText ? "세로 길이 (%)" : "영역 너비 (%)"],
      ["labelSheetWysiwygHeightLabel", uprightText ? "열 너비 (%)" : "영역 높이 (%)"],
      ["labelSheetWysiwygAutoHeightLabel", uprightText ? "내용에 맞춰 열 너비" : "내용에 맞춰 높이"],
      ["labelSheetWysiwygAutoHeightHint", uprightText ? "끄면 지정한 열 너비에서 자름을 검사" : "끄면 지정한 높이에서 자름을 검사"],
      ["labelSheetWysiwygXLabel", uprightText ? "위쪽 위치 (%)" : "가로 위치 X (%)"],
      ["labelSheetWysiwygYLabel", uprightText ? "오른쪽 기준 열 위치 (%)" : "세로 위치 Y (%)"],
      ["labelSheetQuickWidthLabel", uprightText ? "세로 길이" : "너비"],
      ["labelSheetQuickHeightLabel", uprightText ? "열 너비" : "높이"],
      ["labelSheetQuickAutoHeightLabel", uprightText ? "자동 열 너비" : "자동 높이"],
      ["labelSheetQuickAutoHeightHint", uprightText ? "문구 열 수에 맞춤" : "문구 줄 수에 맞춤"],
    ].forEach(([id, label]) => { if ($(id)) $(id).textContent = label; });
    const axisLabels = uprightText
      ? { left: "위쪽", center: "가운데", right: "아래쪽" }
      : { left: "왼쪽", center: "가운데", right: "오른쪽" };
    $("labelSheetWysiwygAlign")?.querySelectorAll("option").forEach((option) => { option.textContent = axisLabels[option.value] || option.textContent; });
    $("labelSheetWysiwygMaxLines")?.querySelectorAll("option").forEach((option) => { option.textContent = `${option.value}${uprightText ? "열" : "줄"}`; });
    if ($("labelSheetQuickAlignGroup")) $("labelSheetQuickAlignGroup").setAttribute("aria-label", uprightText ? "세로축 문구 정렬" : "문구 정렬");
    Object.entries(axisLabels).forEach(([align, label]) => {
      const button = $(`labelSheetQuickAlign${align[0].toUpperCase()}${align.slice(1)}`);
      if (button) button.textContent = label;
      pane.querySelectorAll(`[data-label-sheet-focus-align="${align}"]`).forEach((focusButton) => {
        Array.from(focusButton.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE).forEach((node) => { node.textContent = label; });
        focusButton.setAttribute("aria-label", `${label} 정렬`);
      });
    });
    if (!context.placement) {
      setElementStatus("labelSheetQuickStatus", "편집할 라벨 데이터가 없습니다.", "warning");
      setElementStatus("labelSheetFocusStatus", "편집할 티켓 데이터를 먼저 입력해 주세요.", "warning");
      return;
    }
    const config = isQr
      ? resolvedWysiwygQrLayout(context)
      : isContent
        ? resolvedWysiwygContentLayout(context)
        : (context.layout?.[wysiwygField] || normalizeTextFieldLayout(null, wysiwygField));
    ["labelSheetWysiwygField", "labelSheetQuickTarget"].forEach((id) => {
      const option = $(id)?.querySelector('option[value="qr"]');
      if (option) option.disabled = context.variant !== "withQr";
    });
    pane.querySelectorAll("[data-label-sheet-focus-target]").forEach((button) => {
      const target = button.dataset.labelSheetFocusTarget;
      const active = target === wysiwygField;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
      button.disabled = target === "qr" && context.variant !== "withQr";
    });
    setWysiwygControlVisibility(wysiwygField);
    setControl("labelSheetWysiwygScope", wysiwygScope);
    setControl("labelSheetQuickScope", wysiwygScope);
    [
      ["labelSheetFocusScopeRecord", "record"],
      ["labelSheetFocusScopeGlobal", "global"],
    ].forEach(([id, scope]) => {
      const button = $(id);
      if (!button) return;
      const active = wysiwygScope === scope;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    setControl("labelSheetWysiwygField", wysiwygField);
    setControl("labelSheetQuickTarget", wysiwygField);
    if (isText) {
      setControl("labelSheetWysiwygFont", config.fontFamily);
      setControl("labelSheetQuickFont", config.fontFamily);
      if ($("labelSheetWysiwygFont")?.value !== config.fontFamily) setControl("labelSheetWysiwygFont", "inherit");
      if ($("labelSheetQuickFont")?.value !== config.fontFamily) setControl("labelSheetQuickFont", "inherit");
      setControl("labelSheetWysiwygAlign", config.align);
      ["left", "center", "right"].forEach((align) => {
        const button = $(`labelSheetQuickAlign${align[0].toUpperCase()}${align.slice(1)}`);
        if (button) button.setAttribute("aria-pressed", String(config.align === align));
        pane.querySelectorAll(`[data-label-sheet-focus-align="${align}"]`).forEach((focusButton) => {
          focusButton.classList.toggle("active", config.align === align);
          focusButton.setAttribute("aria-pressed", String(config.align === align));
        });
      });
    }
    ["labelSheetWysiwygSize", "labelSheetQuickSize"].forEach((id) => {
      const input = $(id);
      if (!input) return;
      input.min = isQr ? "16" : "3";
      input.max = isQr ? "48" : "30";
      input.step = "0.5";
    });
    if (!isContent) {
      setControl("labelSheetWysiwygSize", config.sizePercent);
      setControl("labelSheetQuickSize", config.sizePercent);
    }
    if (isText) setControl("labelSheetWysiwygMaxLines", config.maxLines);
    setControl("labelSheetWysiwygX", rounded(config.xPercent));
    setControl("labelSheetWysiwygY", rounded(config.yPercent));
    if (!isQr) {
      setControl("labelSheetWysiwygWidth", rounded(config.widthPercent));
      setControl("labelSheetQuickWidth", rounded(config.widthPercent));
      const renderedField = isText
        ? $("labelSheetFocusSurface")?.querySelector(`.label-sheet-wysiwyg-field.is-active[data-wysiwyg-field="${wysiwygField}"]`)
        : null;
      const renderedHeight = Number(renderedField?.dataset.displayHeightPercent);
      const renderedWidth = Number(renderedField?.dataset.displayWidthPercent);
      const effectiveHeight = isContent
        ? config.heightPercent
        : config.heightPercent ?? (uprightText && Number.isFinite(renderedWidth)
          ? renderedWidth
          : Number.isFinite(renderedHeight) ? renderedHeight : automaticFieldHeightPercent(config));
      setControl("labelSheetWysiwygHeight", rounded(effectiveHeight));
      setControl("labelSheetQuickHeight", rounded(effectiveHeight));
      const autoWrapped = Boolean(renderedField?.classList.contains("is-auto-wrapped") && Number.isFinite(renderedWidth));
      const widthLabel = autoWrapped && Math.abs(renderedWidth - config.widthPercent) >= 0.1
        ? `${rounded(config.widthPercent)}% → ${rounded(renderedWidth)}%`
        : `${rounded(config.widthPercent)}%`;
      if ($("labelSheetQuickWidthValue")) {
        $("labelSheetQuickWidthValue").textContent = widthLabel;
        $("labelSheetQuickWidthValue").title = autoWrapped ? "QR을 피해 실제 출력 너비가 자동 조정되었습니다." : "설정한 출력 너비";
      }
      if ($("labelSheetQuickHeightValue")) $("labelSheetQuickHeightValue").textContent = `${rounded(effectiveHeight)}%`;
    }
    if (isText) {
      const automaticHeight = config.heightPercent === null;
      if ($("labelSheetWysiwygAutoHeight")) $("labelSheetWysiwygAutoHeight").checked = automaticHeight;
      if ($("labelSheetQuickAutoHeight")) $("labelSheetQuickAutoHeight").checked = automaticHeight;
      if ($("labelSheetWysiwygHeight")) $("labelSheetWysiwygHeight").disabled = automaticHeight;
      if ($("labelSheetQuickHeight")) $("labelSheetQuickHeight").disabled = automaticHeight;
      if ($("labelSheetWysiwygAvoidQr")) $("labelSheetWysiwygAvoidQr").checked = config.avoidQr !== false;
      if ($("labelSheetQuickAvoidQr")) $("labelSheetQuickAvoidQr").checked = config.avoidQr !== false;
      setControl("labelSheetWysiwygColorMode", config.color === "inherit" ? "inherit" : "custom");
      setControl("labelSheetWysiwygColor", config.color === "inherit" ? "#111827" : config.color);
      if ($("labelSheetWysiwygColor")) $("labelSheetWysiwygColor").disabled = config.color === "inherit";
      if ($("labelSheetWysiwygVisible")) $("labelSheetWysiwygVisible").checked = config.visible !== false;
    }
    if (isContent) {
      if ($("labelSheetWysiwygHeight")) $("labelSheetWysiwygHeight").disabled = false;
      if ($("labelSheetQuickHeight")) $("labelSheetQuickHeight").disabled = false;
    }
    if (isQr) {
      setControl("labelSheetWysiwygQrMode", config.layoutMode);
      setControl("labelSheetQuickQrMode", config.layoutMode);
      setControl("labelSheetWysiwygQrGap", rounded(config.gapPercent));
      setControl("labelSheetWysiwygQrLayer", config.layer);
      setControl("labelSheetQuickQrLayer", config.layer);
    }
    const textInput = $("labelSheetWysiwygText");
    if (isText && textInput && document.activeElement !== textInput) textInput.value = activeWysiwygTextValue(context);
    if (!isContent && $("labelSheetWysiwygSizeValue")) $("labelSheetWysiwygSizeValue").textContent = `${rounded(config.sizePercent)}%`;
    if (!isContent && $("labelSheetQuickSizeValue")) $("labelSheetQuickSizeValue").textContent = `${rounded(config.sizePercent)}%`;
    if ($("labelSheetWysiwygSizeLabel")) $("labelSheetWysiwygSizeLabel").textContent = isQr ? "QR 크기" : "글자 크기";
    const labelNumber = Number(context.placement?.recordIndex ?? wysiwygPlacementIndex) + 1;
    const recordId = cleanText(context.placement?.record?.id) || `label-${labelNumber}`;
    if ($("labelSheetWysiwygRecordLabel")) $("labelSheetWysiwygRecordLabel").textContent = `${labelNumber}번 · ${recordId}`;
    if ($("labelSheetQuickRecordLabel")) $("labelSheetQuickRecordLabel").textContent = `${labelNumber}번 · ${recordId}`;
    if ($("labelSheetFocusRecordLabel")) $("labelSheetFocusRecordLabel").textContent = `${labelNumber}번 · ${recordId}`;
    if ($("labelSheetPageSelectionStatus")) $("labelSheetPageSelectionStatus").textContent = `${labelNumber}번 티켓 선택`;
    const focusPage = currentPages[previewSide]?.[currentPageIndex];
    const focusCount = focusPage?.placements?.length || 0;
    if ($("labelSheetFocusPosition")) $("labelSheetFocusPosition").textContent = focusCount ? `${wysiwygPlacementIndex + 1} / ${focusCount}` : "0 / 0";
    if ($("labelSheetFocusPrev")) $("labelSheetFocusPrev").disabled = wysiwygPlacementIndex <= 0;
    if ($("labelSheetFocusNext")) $("labelSheetFocusNext").disabled = wysiwygPlacementIndex >= focusCount - 1;
    if ($("labelSheetWysiwygResetLayout")) $("labelSheetWysiwygResetLayout").textContent = wysiwygScope === "record" ? "이 라벨 레이아웃 초기화" : "공통 레이아웃 초기화";
    const statusMessage = `${previewSide === "front" ? "앞면" : "뒷면"} · ${context.variant === "withQr" ? "QR 있음" : "QR 없음"} · ${wysiwygScope === "record" ? `${labelNumber}번 라벨만` : "현재 면 공통"} · ${WYSIWYG_FIELD_LABELS[wysiwygField]} 편집 중${context.inherited ? " (공통값 상속)" : ""}`;
    setElementStatus(
      "labelSheetWysiwygStatus",
      statusMessage,
      "success"
    );
    const activeRenderedField = isText
      ? $("labelSheetFocusSurface")?.querySelector(`.label-sheet-wysiwyg-field.is-active[data-wysiwyg-field="${wysiwygField}"]`)
      : null;
    const appliedWidth = Number(activeRenderedField?.dataset.displayWidthPercent);
    const adaptiveWidthHint = activeRenderedField?.classList.contains("is-auto-wrapped") && Number.isFinite(appliedWidth)
      ? ` QR 회피로 실제 너비 ${rounded(appliedWidth)}%를 적용했습니다.`
      : "";
    const quickHint = isQr
      ? "QR 상자를 이동·확대하고 배치 방식과 레이어를 정할 수 있습니다."
      : isContent
        ? "콘텐츠 외곽선을 끌거나 핸들로 전체 문구 영역을 조정할 수 있습니다."
        : `문구 상자를 이동·크기 조절하고 항목별 QR 회피 여부를 정할 수 있습니다.${adaptiveWidthHint}`;
    setElementStatus("labelSheetQuickStatus", `${statusMessage} · ${quickHint}`, "success");
    setElementStatus("labelSheetFocusStatus", `${statusMessage} · 변경 내용은 A4 전체 미리보기와 PNG·PDF에 함께 반영됩니다.`, "success");
  }

  function updateWysiwygQrField(property, nextValue, message) {
    const context = activeWysiwygLayout(true);
    if (!context.layout || context.variant !== "withQr") return;
    const resolved = resolvedWysiwygQrLayout(context);
    const config = normalizeQrFieldLayout(context.layout.qr);
    if (property === "xPercent" || property === "yPercent") {
      if (config.xPercent === null) config.xPercent = resolved.xPercent;
      if (config.yPercent === null) config.yPercent = resolved.yPercent;
    }
    config[property] = nextValue;
    context.layout.qr = normalizeQrFieldLayout(config);
    commitWysiwygLayout(context);
    syncWysiwygControls();
    renderWysiwygFocusOverlayNow();
    onProjectControlsChanged(message || "QR 영역을 수정했습니다.", { rerenderTable: false });
  }

  function updateWysiwygField(property, nextValue, message) {
    if (wysiwygField === "qr") {
      updateWysiwygQrField(property, nextValue, message);
      return;
    }
    const context = activeWysiwygLayout(true);
    if (!context.layout) return;
    if (wysiwygField === "content") {
      const group = normalizeContentFieldLayout(context.layout.content);
      group[property] = nextValue;
      context.layout.content = normalizeContentFieldLayout(group);
      commitWysiwygLayout(context);
      syncWysiwygControls();
      renderWysiwygFocusOverlayNow();
      onProjectControlsChanged(message || "전체 콘텐츠 영역을 수정했습니다.", { rerenderTable: false });
      return;
    }
    const config = normalizeTextFieldLayout(context.layout[wysiwygField], wysiwygField);
    config[property] = nextValue;
    context.layout[wysiwygField] = normalizeTextFieldLayout(config, wysiwygField);
    commitWysiwygLayout(context);
    syncWysiwygControls();
    renderWysiwygFocusOverlayNow();
    onProjectControlsChanged(message || `${WYSIWYG_FIELD_LABELS[wysiwygField]} 레이아웃을 수정했습니다.`, { rerenderTable: false });
  }

  function updateWysiwygText(options = {}) {
    if (wysiwygField === "qr" || wysiwygField === "content") return;
    const record = activeWysiwygRecord();
    if (!record) return;
    const nextValue = String(value("labelSheetWysiwygText") ?? "").replace(/\r\n?/g, "\n");
    record[previewSide] = record[previewSide] && typeof record[previewSide] === "object" ? record[previewSide] : {};
    record[previewSide][wysiwygField] = nextValue;
    const recordIndex = project.records.indexOf(record);
    const tableInput = recordIndex >= 0
      ? $("labelSheetRecordTableBody")?.querySelector(`input[data-record-index="${recordIndex}"][data-record-field="${previewSide}.${wysiwygField}"]`)
      : null;
    if (tableInput && document.activeElement !== tableInput) tableInput.value = nextValue;
    const forcedLines = Math.min(8, Math.max(1, nextValue.split("\n").length));
    const context = activeWysiwygLayout(true);
    const config = normalizeTextFieldLayout(context.layout?.[wysiwygField], wysiwygField);
    if (forcedLines > config.maxLines) {
      config.maxLines = forcedLines;
      context.layout[wysiwygField] = normalizeTextFieldLayout(config, wysiwygField);
      commitWysiwygLayout(context);
    }
    renderWysiwygFocusOverlayNow();
    onProjectControlsChanged(`${WYSIWYG_FIELD_LABELS[wysiwygField]} 문구를 수정했습니다. Enter 줄바꿈을 출력에 반영합니다.`, { rerenderTable: false });
  }

  function toggleWysiwyg() {
    wysiwygEnabled = !wysiwygEnabled;
    if (wysiwygEnabled) ensureWysiwygLayouts();
    else focusPreviewAbortController?.abort();
    syncWysiwygControls();
    if (wysiwygEnabled && !flowShowAll && flowActiveStep !== "design") {
      setFlowDetailsState("design");
      updateProgressState("design");
      scrollToFlowTarget($("labelSheetFocusEditor"), { focus: false });
    }
    onProjectControlsChanged(wysiwygEnabled ? "확대 편집 작업대를 켰습니다. A4에서 티켓을 선택한 뒤 큰 화면에서 문구와 QR을 조정하세요." : "확대 편집 작업대를 닫았습니다.", { rerenderTable: false });
  }

  function resetWysiwygField() {
    const context = activeWysiwygLayout(true);
    if (!context.layout) return;
    context.layout[wysiwygField] = wysiwygField === "qr"
      ? (context.scope === "record" ? normalizeQrFieldLayout(context.globalLayout?.qr) : normalizeQrFieldLayout(null))
      : wysiwygField === "content"
        ? (context.scope === "record" ? normalizeContentFieldLayout(context.globalLayout?.content) : normalizeContentFieldLayout(null))
        : (context.scope === "record"
          ? normalizeTextFieldLayout(context.globalLayout?.[wysiwygField], wysiwygField)
          : { ...createDefaultTextFieldLayout(context.variant)[wysiwygField] });
    commitWysiwygLayout(context);
    syncWysiwygControls();
    onProjectControlsChanged(`${WYSIWYG_FIELD_LABELS[wysiwygField]} 배치를 기본값으로 되돌렸습니다.`, { rerenderTable: false });
  }

  function resetWysiwygLayout() {
    const context = activeWysiwygLayout(false);
    if (wysiwygScope === "record" && context.recordKey) {
      if (context.recordLayouts[context.recordKey]) context.recordLayouts[context.recordKey][previewSide][context.variant] = null;
    } else {
      context.layouts[previewSide][context.variant] = null;
    }
    context.layout = null;
    commitWysiwygLayout(context);
    syncWysiwygControls();
    onProjectControlsChanged(`${wysiwygScope === "record" ? "선택 라벨" : "현재 면 공통"} 문구를 자동 배치로 되돌렸습니다.`, { rerenderTable: false });
  }

  function saveWysiwygPreset() {
    const context = activeWysiwygLayout(false);
    if (!context.placement) return;
    const fallbackName = `${previewSide === "front" ? "앞면" : "뒷면"} ${context.variant === "withQr" ? "QR 있음" : "QR 없음"} 레이아웃`;
    const name = cleanText(value("labelSheetWysiwygPresetName") || fallbackName).slice(0, 60);
    const id = window.crypto?.randomUUID?.() || `layout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const preset = normalizeLayoutPreset({
      id,
      name,
      side: context.sideName,
      variant: context.variant,
      fields: context.layout || createDefaultTextFieldLayout(context.variant),
      createdAt: new Date().toISOString(),
    });
    if (!preset) return;
    layoutPresets = [preset, ...layoutPresets].slice(0, 30);
    if (!persistLayoutPresets()) return;
    renderLayoutPresetOptions(preset.id);
    setControl("labelSheetWysiwygPresetName", preset.name);
    setElementStatus("labelSheetWysiwygPresetStatus", `“${preset.name}” 저장 완료 · 문구와 QR의 배치·서식만 저장하고 실제 데이터 값은 제외했습니다.`, "success");
  }

  function applyWysiwygPreset() {
    const preset = layoutPresets.find((item) => item.id === value("labelSheetWysiwygPreset"));
    if (!preset) return;
    replaceActiveWysiwygLayout(preset.fields);
    syncWysiwygControls();
    onProjectControlsChanged(`“${preset.name}” 프리셋을 ${wysiwygScope === "record" ? "선택 라벨" : "현재 면 공통 레이아웃"}에 적용했습니다.`, { rerenderTable: false });
    setElementStatus("labelSheetWysiwygPresetStatus", `“${preset.name}” 적용 완료`, "success");
  }

  function deleteWysiwygPreset() {
    const preset = layoutPresets.find((item) => item.id === value("labelSheetWysiwygPreset"));
    if (!preset || !window.confirm(`“${preset.name}” 레이아웃 프리셋을 삭제할까요?`)) return;
    layoutPresets = layoutPresets.filter((item) => item.id !== preset.id);
    persistLayoutPresets();
    renderLayoutPresetOptions();
    setElementStatus("labelSheetWysiwygPresetStatus", `“${preset.name}” 프리셋을 삭제했습니다.`, "success");
  }

  function wysiwygTextBoxMm(working, placement) {
    const width = Math.max(0.1, Number(placement.widthMm) || 1);
    const height = Math.max(0.1, Number(placement.heightMm) || 1);
    const sideData = placement.record?.[previewSide] || {};
    const style = placement.record?.style || {};
    const safeInset = Math.max(Number(working.settings?.safeAreaMm) || 2, Math.min(width, height) * 0.04);
    let x = safeInset;
    let y = safeInset;
    let boxWidth = Math.max(0.1, width - safeInset * 2);
    let boxHeight = Math.max(0.1, height - safeInset * 2);
    const qr = { ...(style.qr || {}), ...(sideData.qrStyle || {}) };
    const hasQr = sideData.qrEnabled && cleanText(sideData.qrValue);
    if (hasQr) {
      const size = Math.min(width, height) * clamp(Number(qr.sizePercent) || 28, 16, 48) / 100;
      const position = ["left", "right", "top-left", "top-right", "bottom-left", "bottom-right", "center"].includes(qr.position) ? qr.position : "right";
      let qrX = width - safeInset - size;
      let qrY = (height - size) / 2;
      if (position.includes("left")) qrX = safeInset;
      if (position === "center") qrX = (width - size) / 2;
      if (position.startsWith("top")) qrY = safeInset;
      if (position.startsWith("bottom")) qrY = height - safeInset - size;
      const hasCustomPosition = Number.isFinite(Number(qr.xPercent)) && Number.isFinite(Number(qr.yPercent));
      if (hasCustomPosition) {
        qrX = clamp(Number(qr.xPercent), 0, Math.max(0, 100 - size / width * 100)) / 100 * width;
        qrY = clamp(Number(qr.yPercent), 0, Math.max(0, 100 - size / height * 100)) / 100 * height;
      }
      const mode = ["adaptive", "reserved", "overlay"].includes(qr.layoutMode) ? qr.layoutMode : "adaptive";
      const gap = Math.max(safeInset * 0.8, 0.8);
      if (mode === "reserved") {
        const centerX = qrX + size / 2;
        const centerY = qrY + size / 2;
        if (hasCustomPosition && centerX >= width * 0.62) boxWidth = Math.max(0.1, qrX - gap - x);
        else if (hasCustomPosition && centerX <= width * 0.38) {
          const rightEdge = width - safeInset;
          x = qrX + size + gap;
          boxWidth = Math.max(0.1, rightEdge - x);
        } else if (hasCustomPosition && centerY >= height * 0.55) boxHeight = Math.max(0.1, qrY - gap - y);
        else if (hasCustomPosition) {
          const bottomEdge = height - safeInset;
          y = qrY + size + gap;
          boxHeight = Math.max(0.1, bottomEdge - y);
        } else if (position === "right" || position.endsWith("-right")) boxWidth = Math.max(0.1, qrX - gap - x);
        else if (position === "left" || position.endsWith("-left")) {
          const rightEdge = width - safeInset;
          x = qrX + size + gap;
          boxWidth = Math.max(0.1, rightEdge - x);
        } else if (position === "center") boxHeight = Math.max(0.1, qrY - gap - y);
      }
    }
    const rotation = Number(style.rotation) || 0;
    const swapsAxes = rotation === 90 || rotation === 270;
    const logicalWidth = swapsAxes ? boxHeight : boxWidth;
    const logicalHeight = swapsAxes ? boxWidth : boxHeight;
    const centerX = x + boxWidth / 2;
    const centerY = y + boxHeight / 2;
    return {
      x: centerX - logicalWidth / 2,
      y: centerY - logicalHeight / 2,
      width: logicalWidth,
      height: logicalHeight,
      rotation,
    };
  }

  function rotatedDragDelta(deltaX, deltaY, rotation) {
    if (rotation === 90) return { x: deltaY, y: -deltaX };
    if (rotation === 180) return { x: -deltaX, y: -deltaY };
    if (rotation === 270) return { x: -deltaY, y: deltaX };
    return { x: deltaX, y: deltaY };
  }

  function overlayFieldGeometry(config, contentConfig, qrConfig, textBox, labelRect) {
    const geometry = {
      xPercent: config.xPercent,
      yPercent: config.yPercent,
      widthPercent: config.widthPercent,
      heightPercent: config.heightPercent ?? automaticFieldHeightPercent(config),
      autoWrapped: false,
    };
    if (!qrConfig || qrConfig.layoutMode !== "adaptive" || config.avoidQr === false) return geometry;
    const spaceLeft = textBox.x / labelRect.widthMm * 100;
    const spaceTop = textBox.y / labelRect.heightMm * 100;
    const spaceWidth = textBox.width / labelRect.widthMm * 100;
    const spaceHeight = textBox.height / labelRect.heightMm * 100;
    const contentLeft = spaceLeft + spaceWidth * contentConfig.xPercent / 100;
    const contentTop = spaceTop + spaceHeight * contentConfig.yPercent / 100;
    const contentWidth = spaceWidth * contentConfig.widthPercent / 100;
    const contentHeight = spaceHeight * contentConfig.heightPercent / 100;
    const field = {
      x: contentLeft + contentWidth * config.xPercent / 100,
      y: contentTop + contentHeight * config.yPercent / 100,
      width: contentWidth * config.widthPercent / 100,
      height: contentHeight * geometry.heightPercent / 100,
    };
    const gapMm = Math.min(labelRect.widthMm, labelRect.heightMm) * qrConfig.gapPercent / 100;
    const qr = {
      x: qrConfig.xPercent - gapMm / labelRect.widthMm * 100,
      y: qrConfig.yPercent - gapMm / labelRect.heightMm * 100,
      width: qrConfig.widthPercent + gapMm / labelRect.widthMm * 200,
      height: qrConfig.heightPercent + gapMm / labelRect.heightMm * 200,
    };
    const intersects = field.x < qr.x + qr.width
      && field.x + field.width > qr.x
      && field.y < qr.y + qr.height
      && field.y + field.height > qr.y;
    if (!intersects) return geometry;
    const preferredRight = field.x + field.width;
    const leftWidth = Math.max(0, Math.min(preferredRight, qr.x) - field.x);
    const rightX = Math.max(field.x, qr.x + qr.width);
    const rightWidth = Math.max(0, preferredRight - rightX);
    const minimum = Math.max(0.5, contentWidth * 0.05);
    if (leftWidth < minimum && rightWidth < minimum) return geometry;
    const adjustedX = leftWidth >= rightWidth ? field.x : rightX;
    const adjustedWidth = leftWidth >= rightWidth ? leftWidth : rightWidth;
    geometry.xPercent = (adjustedX - contentLeft) / Math.max(0.001, contentWidth) * 100;
    geometry.widthPercent = adjustedWidth / Math.max(0.001, contentWidth) * 100;
    geometry.autoWrapped = true;
    return geometry;
  }

  function verticalOverlayFieldGeometry(config, textValue, contentConfig, textBox, fontScale = 1) {
    const groupWidth = Math.max(0.1, textBox.width * contentConfig.widthPercent / 100);
    const groupHeight = Math.max(0.1, textBox.height * contentConfig.heightPercent / 100);
    const base = Math.max(0.1, Math.min(groupWidth, groupHeight));
    const size = Math.max(0.1, base * config.sizePercent / 100 * fontScale);
    const heightPercent = config.widthPercent;
    const height = Math.max(size * 1.25, groupHeight * heightPercent / 100);
    const rowsPerColumn = Math.max(1, Math.floor(height / (size * 1.18)));
    const columns = String(textValue ?? "").replace(/\r\n?/g, "\n").split("\n").reduce((total, paragraph) => (
      total + Math.max(1, Math.ceil(Array.from(paragraph).length / rowsPerColumn))
    ), 0);
    const visibleColumns = Math.max(1, Math.min(config.maxLines, columns));
    const widthPercent = config.heightPercent === null
      ? clamp(visibleColumns * size * 1.22 / groupWidth * 100, 5, 100)
      : clamp(config.heightPercent, 5, 100);
    return {
      xPercent: clamp(100 - config.yPercent - widthPercent, 0, Math.max(0, 100 - widthPercent)),
      yPercent: clamp(config.xPercent, 0, Math.max(0, 100 - heightPercent)),
      widthPercent,
      heightPercent,
      autoWrapped: false,
    };
  }

  function beginWysiwygGroupDrag(event, element, space) {
    if (event.target.closest(".label-sheet-wysiwyg-resize-handle")) return;
    event.preventDefault();
    event.stopPropagation();
    wysiwygField = "content";
    const context = activeWysiwygLayout(true);
    const config = normalizeContentFieldLayout(context.layout?.content);
    const pointerId = event.pointerId;
    const state = {
      pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startXPercent: config.xPercent,
      startYPercent: config.yPercent,
      xPercent: config.xPercent,
      yPercent: config.yPercent,
      widthPercent: config.widthPercent,
      heightPercent: config.heightPercent,
      rotation: Number(space.dataset.rotation) || 0,
    };
    wysiwygDrag = state;
    element.setPointerCapture?.(pointerId);
    syncWysiwygControls();

    const move = (moveEvent) => {
      if (wysiwygDrag !== state || moveEvent.pointerId !== pointerId) return;
      const rotated = rotatedDragDelta(moveEvent.clientX - state.startClientX, moveEvent.clientY - state.startClientY, state.rotation);
      const width = Math.max(1, space.offsetWidth);
      const height = Math.max(1, space.offsetHeight);
      state.xPercent = clamp(state.startXPercent + rotated.x / width * 100, 0, Math.max(0, 100 - state.widthPercent));
      state.yPercent = clamp(state.startYPercent + rotated.y / height * 100, 0, Math.max(0, 100 - state.heightPercent));
      element.style.left = `${state.xPercent}%`;
      element.style.top = `${state.yPercent}%`;
    };
    const end = (endEvent) => {
      if (wysiwygDrag !== state || endEvent.pointerId !== pointerId) return;
      wysiwygDrag = null;
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", end);
      element.removeEventListener("pointercancel", end);
      element.releasePointerCapture?.(pointerId);
      const nextContext = activeWysiwygLayout(true);
      nextContext.layout.content = normalizeContentFieldLayout({ ...nextContext.layout.content, xPercent: state.xPercent, yPercent: state.yPercent });
      commitWysiwygLayout(nextContext);
      onProjectControlsChanged("전체 콘텐츠 영역을 옮겼습니다.", { rerenderTable: false });
    };
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", end);
    element.addEventListener("pointercancel", end);
  }

  function beginWysiwygResize(event, element, space, targetName, axis = "both") {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    wysiwygField = targetName;
    const context = activeWysiwygLayout(true);
    const isContent = targetName === "content";
    const config = isContent
      ? normalizeContentFieldLayout(context.layout?.content)
      : normalizeTextFieldLayout(context.layout?.[targetName], targetName);
    const pointerId = event.pointerId;
    const measuredHeight = clamp(element.offsetHeight / Math.max(1, space.offsetHeight) * 100, 5, 100);
    const displayWidthPercent = Number(element.dataset.displayWidthPercent ?? config.widthPercent);
    const displayHeightPercent = Number(element.dataset.displayHeightPercent ?? (config.heightPercent ?? measuredHeight));
    const verticalUpright = !isContent && space.dataset.writingMode === "vertical-upright";
    const state = {
      pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startWidthPercent: config.widthPercent,
      startHeightPercent: isContent ? config.heightPercent : (config.heightPercent ?? (verticalUpright ? displayWidthPercent : measuredHeight)),
      startDisplayWidthPercent: displayWidthPercent,
      startDisplayHeightPercent: displayHeightPercent,
      widthPercent: config.widthPercent,
      heightPercent: isContent ? config.heightPercent : (config.heightPercent ?? (verticalUpright ? displayWidthPercent : measuredHeight)),
      displayWidthPercent,
      displayHeightPercent,
      xPercent: config.xPercent,
      yPercent: config.yPercent,
      rotation: Number(space.dataset.rotation) || 0,
      verticalUpright,
    };
    wysiwygDrag = state;
    element.setPointerCapture?.(pointerId);
    syncWysiwygControls();

    const move = (moveEvent) => {
      if (wysiwygDrag !== state || moveEvent.pointerId !== pointerId) return;
      const rotated = rotatedDragDelta(moveEvent.clientX - state.startClientX, moveEvent.clientY - state.startClientY, state.rotation);
      const width = Math.max(1, space.offsetWidth);
      const height = Math.max(1, space.offsetHeight);
      if (axis === "both" || axis === "x") {
        if (state.verticalUpright) state.heightPercent = clamp(state.startHeightPercent + rotated.x / width * 100, 5, 100);
        else state.widthPercent = clamp(state.startWidthPercent + rotated.x / width * 100, isContent ? 10 : 5, Math.max(isContent ? 10 : 5, 100 - state.xPercent));
        state.displayWidthPercent = clamp(state.startDisplayWidthPercent + rotated.x / width * 100, isContent ? 10 : 5, Math.max(isContent ? 10 : 5, 100 - state.xPercent));
        element.style.width = `${state.displayWidthPercent}%`;
      }
      if (axis === "both" || axis === "y") {
        if (state.verticalUpright) state.widthPercent = clamp(state.startWidthPercent + rotated.y / height * 100, 5, 100);
        else state.heightPercent = clamp(state.startHeightPercent + rotated.y / height * 100, isContent ? 10 : 5, Math.max(isContent ? 10 : 5, 100 - state.yPercent));
        state.displayHeightPercent = clamp(state.startDisplayHeightPercent + rotated.y / height * 100, isContent ? 10 : 5, Math.max(isContent ? 10 : 5, 100 - state.yPercent));
        element.style.height = `${state.displayHeightPercent}%`;
      }
    };
    const end = (endEvent) => {
      if (wysiwygDrag !== state || endEvent.pointerId !== pointerId) return;
      wysiwygDrag = null;
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", end);
      element.removeEventListener("pointercancel", end);
      element.releasePointerCapture?.(pointerId);
      const nextContext = activeWysiwygLayout(true);
      if (isContent) {
        nextContext.layout.content = normalizeContentFieldLayout({ ...nextContext.layout.content, widthPercent: state.widthPercent, heightPercent: state.heightPercent });
      } else {
        nextContext.layout[targetName] = normalizeTextFieldLayout({
          ...nextContext.layout[targetName],
          widthPercent: state.widthPercent,
          heightPercent: state.heightPercent,
        }, targetName);
      }
      commitWysiwygLayout(nextContext);
      onProjectControlsChanged(`${WYSIWYG_FIELD_LABELS[targetName]} 영역 크기를 조정했습니다.`, { rerenderTable: false });
    };
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", end);
    element.addEventListener("pointercancel", end);
  }

  function beginWysiwygQrResize(event, element, hit) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    wysiwygField = "qr";
    const context = activeWysiwygLayout(true);
    const resolved = resolvedWysiwygQrLayout(context);
    const pointerId = event.pointerId;
    const state = {
      pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startSizePercent: resolved.sizePercent,
      sizePercent: resolved.sizePercent,
      widthPercent: resolved.widthPercent,
      heightPercent: resolved.heightPercent,
    };
    wysiwygDrag = state;
    element.setPointerCapture?.(pointerId);
    syncWysiwygControls();
    const move = (moveEvent) => {
      if (wysiwygDrag !== state || moveEvent.pointerId !== pointerId) return;
      const delta = ((moveEvent.clientX - state.startClientX) + (moveEvent.clientY - state.startClientY)) / 2;
      const reference = Math.max(1, Math.min(hit.offsetWidth, hit.offsetHeight));
      state.sizePercent = clamp(state.startSizePercent + delta / reference * 100, 16, 48);
      const ratio = state.sizePercent / Math.max(1, state.startSizePercent);
      element.style.width = `${state.widthPercent * ratio}%`;
      element.style.height = `${state.heightPercent * ratio}%`;
    };
    const end = (endEvent) => {
      if (wysiwygDrag !== state || endEvent.pointerId !== pointerId) return;
      wysiwygDrag = null;
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", end);
      element.removeEventListener("pointercancel", end);
      element.releasePointerCapture?.(pointerId);
      updateWysiwygQrField("sizePercent", state.sizePercent, "QR 영역 크기를 조정했습니다.");
    };
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", end);
    element.addEventListener("pointercancel", end);
  }

  function beginWysiwygDrag(event, element, space, fieldName) {
    if (event.target.closest(".label-sheet-wysiwyg-resize-handle")) return;
    event.preventDefault();
    event.stopPropagation();
    wysiwygField = fieldName;
    const context = activeWysiwygLayout(true);
    const config = normalizeTextFieldLayout(context.layout?.[fieldName], fieldName);
    const pointerId = event.pointerId;
    wysiwygDrag = {
      pointerId,
      element,
      space,
      rotation: Number(space.dataset.rotation) || 0,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startXPercent: config.xPercent,
      startYPercent: config.yPercent,
      startDisplayXPercent: Number(element.dataset.displayXPercent ?? config.xPercent),
      startDisplayYPercent: Number(element.dataset.displayYPercent ?? config.yPercent),
      xPercent: config.xPercent,
      yPercent: config.yPercent,
      displayXPercent: Number(element.dataset.displayXPercent ?? config.xPercent),
      displayYPercent: Number(element.dataset.displayYPercent ?? config.yPercent),
      widthPercent: config.widthPercent,
      verticalUpright: space.dataset.writingMode === "vertical-upright",
    };
    element.setPointerCapture?.(pointerId);
    syncWysiwygControls();

    const move = (moveEvent) => {
      if (!wysiwygDrag || moveEvent.pointerId !== pointerId) return;
      const rotated = rotatedDragDelta(moveEvent.clientX - wysiwygDrag.startClientX, moveEvent.clientY - wysiwygDrag.startClientY, wysiwygDrag.rotation);
      const width = Math.max(1, space.offsetWidth);
      const height = Math.max(1, space.offsetHeight);
      if (wysiwygDrag.verticalUpright) {
        wysiwygDrag.xPercent = clamp(wysiwygDrag.startXPercent + rotated.y / height * 100, 0, Math.max(0, 100 - wysiwygDrag.widthPercent));
        wysiwygDrag.yPercent = clamp(wysiwygDrag.startYPercent - rotated.x / width * 100, 0, 96);
      } else {
        wysiwygDrag.xPercent = clamp(wysiwygDrag.startXPercent + rotated.x / width * 100, 0, Math.max(0, 100 - wysiwygDrag.widthPercent));
        wysiwygDrag.yPercent = clamp(wysiwygDrag.startYPercent + rotated.y / height * 100, 0, 96);
      }
      wysiwygDrag.displayXPercent = wysiwygDrag.startDisplayXPercent + rotated.x / width * 100;
      wysiwygDrag.displayYPercent = wysiwygDrag.startDisplayYPercent + rotated.y / height * 100;
      element.style.left = `${wysiwygDrag.displayXPercent}%`;
      element.style.top = `${wysiwygDrag.displayYPercent}%`;
    };
    const end = (endEvent) => {
      if (!wysiwygDrag || endEvent.pointerId !== pointerId) return;
      const finished = wysiwygDrag;
      wysiwygDrag = null;
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", end);
      element.removeEventListener("pointercancel", end);
      element.releasePointerCapture?.(pointerId);
      const nextContext = activeWysiwygLayout(true);
      const nextConfig = normalizeTextFieldLayout(nextContext.layout?.[fieldName], fieldName);
      nextConfig.xPercent = finished.xPercent;
      nextConfig.yPercent = finished.yPercent;
      nextContext.layout[fieldName] = normalizeTextFieldLayout(nextConfig, fieldName);
      commitWysiwygLayout(nextContext);
      onProjectControlsChanged(`${WYSIWYG_FIELD_LABELS[fieldName]} 위치를 옮겼습니다.`, { rerenderTable: false });
    };
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", end);
    element.addEventListener("pointercancel", end);
  }

  function beginWysiwygQrDrag(event, element, hit) {
    event.preventDefault();
    event.stopPropagation();
    wysiwygField = "qr";
    const context = activeWysiwygLayout(true);
    const resolved = resolvedWysiwygQrLayout(context);
    const pointerId = event.pointerId;
    wysiwygDrag = {
      pointerId,
      element,
      hit,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startXPercent: resolved.xPercent,
      startYPercent: resolved.yPercent,
      xPercent: resolved.xPercent,
      yPercent: resolved.yPercent,
      widthPercent: resolved.widthPercent,
      heightPercent: resolved.heightPercent,
    };
    element.setPointerCapture?.(pointerId);
    syncWysiwygControls();

    const move = (moveEvent) => {
      if (!wysiwygDrag || moveEvent.pointerId !== pointerId) return;
      const width = Math.max(1, hit.offsetWidth);
      const height = Math.max(1, hit.offsetHeight);
      wysiwygDrag.xPercent = clamp(wysiwygDrag.startXPercent + (moveEvent.clientX - wysiwygDrag.startClientX) / width * 100, 0, Math.max(0, 100 - wysiwygDrag.widthPercent));
      wysiwygDrag.yPercent = clamp(wysiwygDrag.startYPercent + (moveEvent.clientY - wysiwygDrag.startClientY) / height * 100, 0, Math.max(0, 100 - wysiwygDrag.heightPercent));
      element.style.left = `${wysiwygDrag.xPercent}%`;
      element.style.top = `${wysiwygDrag.yPercent}%`;
    };
    const end = (endEvent) => {
      if (!wysiwygDrag || endEvent.pointerId !== pointerId) return;
      const finished = wysiwygDrag;
      wysiwygDrag = null;
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", end);
      element.removeEventListener("pointercancel", end);
      element.releasePointerCapture?.(pointerId);
      const nextContext = activeWysiwygLayout(true);
      const nextQr = normalizeQrFieldLayout(nextContext.layout?.qr);
      nextQr.xPercent = finished.xPercent;
      nextQr.yPercent = finished.yPercent;
      nextContext.layout.qr = normalizeQrFieldLayout(nextQr);
      commitWysiwygLayout(nextContext);
      onProjectControlsChanged("QR 영역 위치를 옮겼습니다.", { rerenderTable: false });
    };
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", end);
    element.addEventListener("pointercancel", end);
  }

  function wysiwygOverlayFontScale(placement, sideData) {
    const style = { ...(placement?.record?.style || {}), ...(sideData?.style || {}), ...(placement?.style || {}) };
    const percent = Number(style.fontScalePercent);
    const scale = Number.isFinite(Number(style.fontScale))
      ? Number(style.fontScale)
      : Number.isFinite(percent) ? percent / 100 : 1;
    return clamp(scale, 0.7, 1.6);
  }

  function sampleWysiwygFieldContrast(canvas, field) {
    try {
      const context = canvas?.getContext?.("2d", { willReadFrequently: true });
      const canvasRect = canvas?.getBoundingClientRect?.();
      const fieldRect = field?.getBoundingClientRect?.();
      if (!context || !canvasRect?.width || !canvasRect?.height || !fieldRect?.width || !fieldRect?.height) return null;
      const luminance = [];
      [0.16, 0.38, 0.62, 0.84].forEach((yRatio) => {
        [0.12, 0.34, 0.58, 0.82].forEach((xRatio) => {
          const cssX = fieldRect.left - canvasRect.left + fieldRect.width * xRatio;
          const cssY = fieldRect.top - canvasRect.top + fieldRect.height * yRatio;
          const pixelX = Math.min(canvas.width - 1, Math.max(0, Math.round(cssX / canvasRect.width * canvas.width)));
          const pixelY = Math.min(canvas.height - 1, Math.max(0, Math.round(cssY / canvasRect.height * canvas.height)));
          const pixel = context.getImageData(pixelX, pixelY, 1, 1).data;
          luminance.push(RENDERER.relativeLuminance({ r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] / 255 }));
        });
      });
      return RENDERER.summarizeContrastSamples(luminance);
    } catch (_error) {
      return null;
    }
  }

  function finalizeWysiwygOverlayVisuals(surface, placement, sideData) {
    const overlay = surface?.querySelector(".label-sheet-wysiwyg-overlay.is-focus-editor");
    const contentBox = overlay?.querySelector(".label-sheet-wysiwyg-content");
    if (!overlay || !contentBox) return;
    const contentWidth = contentBox.offsetWidth || 0;
    const contentHeightPx = contentBox.offsetHeight || 0;
    if (contentWidth < 16 || contentHeightPx < 16) return;
    const base = Math.max(8, Math.min(contentWidth, contentHeightPx));
    const scale = wysiwygOverlayFontScale(placement, sideData);
    const canvas = surface.querySelector("canvas");
    overlay.querySelectorAll(".label-sheet-wysiwyg-field").forEach((field) => {
      const configuredSizePercent = Number(field.dataset.sizePercent) || 8;
      const sizePercent = field.dataset.placeholder === "true"
        ? Math.min(configuredSizePercent, 7)
        : configuredSizePercent;
      field.style.fontSize = `${Math.max(5, base * sizePercent / 100 * scale)}px`;
      field.style.fontWeight = field.dataset.fontWeight || "400";
      if (field.dataset.automaticHeight === "true") {
        const handles = Array.from(field.querySelectorAll(".label-sheet-wysiwyg-resize-handle"));
        handles.forEach((handle) => { handle.style.display = "none"; });
        field.style.height = "auto";
        const measuredHeight = field.getBoundingClientRect().height + 1;
        const contentHeight = Math.max(1, contentBox.getBoundingClientRect().height);
        const yPercent = clamp(Number(field.dataset.displayYPercent) || 0, 0, 100);
        const maximumHeight = Math.max(0.1, 100 - yPercent);
        const measuredHeightPercent = measuredHeight / contentHeight * 100;
        const fittedHeight = clamp(measuredHeightPercent, WYSIWYG_AUTO_HEIGHT_MIN_PERCENT, maximumHeight);
        field.style.height = `${fittedHeight}%`;
        field.dataset.displayHeightPercent = String(fittedHeight);
        const overflowsAvailableSpace = measuredHeightPercent > maximumHeight + 0.1;
        field.dataset.textOverflow = String(overflowsAvailableSpace);
        field.classList.toggle("has-text-overflow", overflowsAvailableSpace);
        if (overflowsAvailableSpace) field.title = `${field.title} · 출력 영역 높이 초과`;
        handles.forEach((handle) => { handle.style.removeProperty("display"); });
        if (field.classList.contains("is-active")) {
          setControl("labelSheetWysiwygHeight", rounded(fittedHeight));
          setControl("labelSheetQuickHeight", rounded(fittedHeight));
          if ($("labelSheetQuickHeightValue")) $("labelSheetQuickHeightValue").textContent = `${rounded(fittedHeight)}%`;
        }
      }
      if (field.dataset.inheritColor !== "true") return;
      const profile = sampleWysiwygFieldContrast(canvas, field);
      const fallbackLight = currentWorkingProject?.settings?.textContrast === "light";
      const color = profile?.color || (fallbackLight ? "#ffffff" : "#111827");
      const outline = profile?.outlineColor || (color === "#ffffff" ? "rgba(15, 23, 42, 0.72)" : "rgba(255, 255, 255, 0.78)");
      field.style.setProperty("--wysiwyg-preview-color", color);
      field.style.setProperty("--wysiwyg-preview-shadow", `0 0 1px ${outline}, 0 1px 2px ${outline}`);
    });
  }

  function observeWysiwygOverlaySize(surface, overlay, placement, sideData) {
    focusOverlayResizeObserver?.disconnect();
    focusOverlayResizeObserver = null;
    if (focusOverlayFinalizeFrame) window.cancelAnimationFrame(focusOverlayFinalizeFrame);
    const contentBox = overlay?.querySelector(".label-sheet-wysiwyg-content");
    if (!surface || !contentBox) return;
    const finalize = () => {
      if (focusOverlayFinalizeFrame) window.cancelAnimationFrame(focusOverlayFinalizeFrame);
      focusOverlayFinalizeFrame = window.requestAnimationFrame(() => {
        focusOverlayFinalizeFrame = 0;
        if (surface.contains(overlay)) finalizeWysiwygOverlayVisuals(surface, placement, sideData);
      });
    };
    if (typeof window.ResizeObserver === "function") {
      focusOverlayResizeObserver = new ResizeObserver(finalize);
      focusOverlayResizeObserver.observe(contentBox);
    }
    finalize();
  }

  function appendWysiwygQrPreview(qrBox, value, placement, sideData) {
    const core = window.QRGeneratorCore;
    if (!cleanText(value) || typeof core?.drawCustomQRCode !== "function") {
      qrBox.textContent = "QR";
      return;
    }
    const qrStyle = { ...(placement?.record?.style?.qr || {}), ...(sideData?.qrStyle || {}), ...(placement?.style?.qr || {}) };
    const palette = RENDERER.resolveQrContrast(qrStyle);
    try {
      const result = core.drawCustomQRCode(String(value), 256, {
        margin: Math.max(2, Math.trunc(Number(qrStyle.margin) || 4)),
        ecc: ["L", "M", "Q", "H"].includes(qrStyle.ecc) ? qrStyle.ecc : "M",
        darkColor: palette.darkColor,
        lightColor: palette.lightColor,
        roundDots: Boolean(qrStyle.roundDots),
        customEye: Boolean(qrStyle.customEye),
        eyeColor: palette.eyeColor,
      });
      const canvas = result?.canvas;
      if (!canvas) throw new Error("QR preview missing");
      canvas.setAttribute("aria-hidden", "true");
      qrBox.replaceChildren(canvas);
    } catch (_error) {
      qrBox.textContent = "QR";
    }
  }

  function syncFocusBackgroundMode() {
    const surface = $("labelSheetFocusSurface");
    const button = $("labelSheetFocusBackgroundToggle");
    surface?.classList.toggle("is-edit-contrast", focusBackgroundMuted);
    if (button) {
      button.setAttribute("aria-pressed", String(focusBackgroundMuted));
      button.textContent = focusBackgroundMuted ? "편집 대비 켬" : "편집 대비 끔";
      button.title = focusBackgroundMuted ? "배경을 약하게 표시해 편집 개체를 선명하게 봅니다." : "배경 원본 밝기와 색상을 표시합니다.";
    }
  }

  function renderWysiwygOverlay(working, page, options = {}) {
    const surface = options.surface || $("labelSheetPreviewSurface");
    const focusMode = options.focusMode === true;
    const selectionOnly = options.selectionOnly === true;
    surface?.querySelector(".label-sheet-wysiwyg-overlay")?.remove();
    if (!surface || !working || !wysiwygEnabled || normalizeOutputGoal(working.settings?.outputGoal) !== "print" || !page?.placements?.length) return;
    if (!focusMode) wysiwygPlacementIndex = Math.min(Math.max(0, wysiwygPlacementIndex), page.placements.length - 1);
    const activeIndex = focusMode ? 0 : wysiwygPlacementIndex;
    const pageWidth = Number(working.spec.page.widthMm) || 210;
    const pageHeight = Number(working.spec.page.heightMm) || 297;
    const overlay = document.createElement("div");
    overlay.className = `label-sheet-wysiwyg-overlay${selectionOnly ? " is-selection-only" : ""}${focusMode ? " is-focus-editor" : ""}`;
    overlay.setAttribute("aria-label", focusMode ? "선택 티켓 확대 편집 영역" : "A4 티켓 선택 영역");
    page.placements.forEach((placement, index) => {
      const rect = RENDERER.transformRectForSide(placement, working.spec.page, {
        side: previewSide,
        page,
        backTransform: page.backTransform,
        backOffsetXmm: working.spec.duplex.offsetXmm,
        backOffsetYmm: working.spec.duplex.offsetYmm,
      });
      const hit = document.createElement("div");
      hit.className = `label-sheet-wysiwyg-hit${index === activeIndex ? " is-selected" : ""}`;
      hit.dataset.selectionLabel = String(Number(placement.recordIndex ?? index) + 1);
      hit.tabIndex = 0;
      hit.setAttribute("role", "button");
      hit.setAttribute("aria-label", focusMode ? "선택 티켓 편집 작업대" : `${Number(placement.recordIndex ?? index) + 1}번 티켓 확대 편집`);
      hit.style.left = `${rect.xMm / pageWidth * 100}%`;
      hit.style.top = `${rect.yMm / pageHeight * 100}%`;
      hit.style.width = `${rect.widthMm / pageWidth * 100}%`;
      hit.style.height = `${rect.heightMm / pageHeight * 100}%`;
      const selectPlacement = () => {
        if (focusMode || wysiwygPlacementIndex === index) return;
        wysiwygPlacementIndex = index;
        syncWysiwygControls();
        renderWysiwygWorkspace(working, page);
      };
      hit.addEventListener("click", selectPlacement);
      hit.addEventListener("keydown", (event) => {
        if (!["Enter", " "].includes(event.key)) return;
        event.preventDefault();
        selectPlacement();
      });
      if (!selectionOnly && index === activeIndex) {
        const layoutContext = activeWysiwygLayout(false);
        const layout = layoutContext.layout || createDefaultTextFieldLayout(layoutContext.variant);
        const sideData = placement.record?.[previewSide] || {};
        const textBox = wysiwygTextBoxMm(working, placement);
        const verticalUpright = placement.record?.style?.writingMode === "vertical-upright"
          || sideData.textOrientation === "vertical-upright";
        const space = document.createElement("div");
        space.className = "label-sheet-wysiwyg-space";
        space.dataset.rotation = String(textBox.rotation);
        space.dataset.writingMode = verticalUpright ? "vertical-upright" : "horizontal";
        space.style.left = `${textBox.x / rect.widthMm * 100}%`;
        space.style.top = `${textBox.y / rect.heightMm * 100}%`;
        space.style.width = `${textBox.width / rect.widthMm * 100}%`;
        space.style.height = `${textBox.height / rect.heightMm * 100}%`;
        space.style.transform = textBox.rotation ? `rotate(${textBox.rotation}deg)` : "none";
        const contentConfig = normalizeContentFieldLayout(layout.content);
        const contentBox = document.createElement("div");
        contentBox.className = `label-sheet-wysiwyg-content${wysiwygField === "content" ? " is-active" : ""}`;
        contentBox.dataset.rotation = String(textBox.rotation);
        contentBox.tabIndex = 0;
        contentBox.setAttribute("role", "group");
        contentBox.setAttribute("aria-label", "전체 콘텐츠 영역 이동과 크기 조절");
        contentBox.title = "전체 콘텐츠 · 끌어서 이동 · 모서리 핸들로 크기 조절";
        contentBox.style.left = `${contentConfig.xPercent}%`;
        contentBox.style.top = `${contentConfig.yPercent}%`;
        contentBox.style.width = `${contentConfig.widthPercent}%`;
        contentBox.style.height = `${contentConfig.heightPercent}%`;
        contentBox.addEventListener("pointerdown", (event) => beginWysiwygGroupDrag(event, contentBox, space));
        contentBox.addEventListener("keydown", (event) => {
          if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
          event.preventDefault();
          event.stopPropagation();
          wysiwygField = "content";
          const step = event.shiftKey ? 5 : 1;
          const current = resolvedWysiwygContentLayout(activeWysiwygLayout(true));
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") updateWysiwygField("xPercent", current.xPercent + (event.key === "ArrowLeft" ? -step : step), "전체 콘텐츠 영역을 가로로 이동했습니다.");
          else updateWysiwygField("yPercent", current.yPercent + (event.key === "ArrowUp" ? -step : step), "전체 콘텐츠 영역을 세로로 이동했습니다.");
        });
        const contentResize = document.createElement("span");
        contentResize.className = "label-sheet-wysiwyg-resize-handle is-corner";
        contentResize.setAttribute("aria-hidden", "true");
        contentResize.addEventListener("pointerdown", (event) => beginWysiwygResize(event, contentBox, space, "content", "both"));
        contentBox.appendChild(contentResize);
        const qrConfig = sideData.qrEnabled && cleanText(sideData.qrValue)
          ? resolvedWysiwygQrLayout(layoutContext)
          : null;
        const outputText = {
          number: sideData.number || placement.record?.number || "",
          title: sideData.title || "",
          subtitle: sideData.subtitle || "",
          body: sideData.body || "",
          footer: sideData.footer || "",
        };
        const previewText = {
          number: outputText.number || "연번 없음",
          title: outputText.title || "제목",
          subtitle: outputText.subtitle || "부제",
          body: outputText.body || "본문",
          footer: outputText.footer || "하단 문구",
        };
        WYSIWYG_FIELD_KEYS.forEach((fieldName) => {
          const config = normalizeTextFieldLayout(layout[fieldName], fieldName);
          const displayGeometry = verticalUpright
            ? verticalOverlayFieldGeometry(config, previewText[fieldName], contentConfig, textBox, wysiwygOverlayFontScale(placement, sideData))
            : overlayFieldGeometry(config, contentConfig, qrConfig, textBox, rect);
          const field = document.createElement("div");
          const placeholder = !cleanText(outputText[fieldName]);
          field.className = `label-sheet-wysiwyg-field${verticalUpright ? " is-vertical-upright" : ""}${fieldName === wysiwygField ? " is-active" : ""}${config.visible === false ? " is-hidden-field" : ""}${displayGeometry.autoWrapped ? " is-auto-wrapped" : ""}${placeholder ? " is-placeholder" : ""}`;
          field.setAttribute("role", "button");
          field.setAttribute("aria-label", `${WYSIWYG_FIELD_LABELS[fieldName]} 위치 이동`);
          field.title = `${WYSIWYG_FIELD_LABELS[fieldName]} · 끌어서 이동${displayGeometry.autoWrapped ? " · QR을 피해 자동 감싸기" : ""}${config.visible === false ? " · 출력 숨김" : ""}`;
          field.textContent = config.visible === false ? `${WYSIWYG_FIELD_LABELS[fieldName]} (숨김)` : previewText[fieldName];
          field.dataset.wysiwygField = fieldName;
          field.dataset.displayXPercent = String(displayGeometry.xPercent);
          field.dataset.displayYPercent = String(displayGeometry.yPercent);
          field.dataset.displayWidthPercent = String(displayGeometry.widthPercent);
          field.dataset.displayHeightPercent = String(displayGeometry.heightPercent);
          field.dataset.automaticHeight = String(!verticalUpright && config.heightPercent === null);
          field.dataset.placeholder = String(placeholder);
          field.dataset.sizePercent = String(config.sizePercent);
          field.dataset.fontWeight = String(config.weight);
          field.dataset.inheritColor = String(config.color === "inherit");
          field.style.left = `${displayGeometry.xPercent}%`;
          field.style.top = `${displayGeometry.yPercent}%`;
          field.style.width = `${displayGeometry.widthPercent}%`;
          field.style.height = `${displayGeometry.heightPercent}%`;
          field.style.textAlign = config.align;
          field.style.justifyContent = config.align === "right" ? "flex-end" : config.align === "center" ? "center" : "flex-start";
          if (verticalUpright) {
            field.style.writingMode = "vertical-rl";
            field.style.textOrientation = "upright";
          }
          field.style.fontFamily = config.fontFamily === "inherit"
            ? placement.record?.style?.fontFamily || placement.style?.fontFamily || "inherit"
            : config.fontFamily;
          if (config.color !== "inherit") field.style.color = config.color;
          field.addEventListener("pointerdown", (event) => beginWysiwygDrag(event, field, contentBox, fieldName));
          if (fieldName === wysiwygField) {
            const widthHandle = document.createElement("span");
            widthHandle.className = "label-sheet-wysiwyg-resize-handle is-width";
            widthHandle.setAttribute("aria-hidden", "true");
            widthHandle.addEventListener("pointerdown", (event) => beginWysiwygResize(event, field, contentBox, fieldName, "x"));
            const cornerHandle = document.createElement("span");
            cornerHandle.className = "label-sheet-wysiwyg-resize-handle is-corner";
            cornerHandle.setAttribute("aria-hidden", "true");
            cornerHandle.addEventListener("pointerdown", (event) => beginWysiwygResize(event, field, contentBox, fieldName, "both"));
            field.append(widthHandle, cornerHandle);
          }
          contentBox.appendChild(field);
        });
        space.appendChild(contentBox);
        hit.appendChild(space);
        if (qrConfig) {
          const qrBox = document.createElement("div");
          qrBox.className = `label-sheet-wysiwyg-qr${wysiwygField === "qr" ? " is-active" : ""}${qrConfig.layer === "behind" ? " is-behind" : ""}`;
          qrBox.tabIndex = 0;
          qrBox.setAttribute("role", "button");
          qrBox.setAttribute("aria-label", "QR 영역 위치와 크기 편집");
          qrBox.title = "QR 영역 · 끌어서 이동 · 방향키로 미세 이동";
          qrBox.textContent = "QR";
          qrBox.style.left = `${qrConfig.xPercent}%`;
          qrBox.style.top = `${qrConfig.yPercent}%`;
          qrBox.style.width = `${qrConfig.widthPercent}%`;
          qrBox.style.height = `${qrConfig.heightPercent}%`;
          appendWysiwygQrPreview(qrBox, sideData.qrValue, placement, sideData);
          const selectQr = (event) => {
            event?.preventDefault();
            event?.stopPropagation();
            wysiwygField = "qr";
            syncWysiwygControls();
            renderWysiwygOverlay(working, page, options);
          };
          qrBox.addEventListener("click", selectQr);
          qrBox.addEventListener("pointerdown", (event) => beginWysiwygQrDrag(event, qrBox, hit));
          if (wysiwygField === "qr") {
            const qrResize = document.createElement("span");
            qrResize.className = "label-sheet-wysiwyg-resize-handle is-corner";
            qrResize.setAttribute("aria-hidden", "true");
            qrResize.addEventListener("pointerdown", (event) => beginWysiwygQrResize(event, qrBox, hit));
            qrBox.appendChild(qrResize);
          }
          qrBox.addEventListener("keydown", (event) => {
            if (["Enter", " "].includes(event.key)) {
              selectQr(event);
              return;
            }
            const step = event.shiftKey ? 5 : 1;
            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
              event.preventDefault();
              event.stopPropagation();
              wysiwygField = "qr";
              const current = resolvedWysiwygQrLayout(activeWysiwygLayout(true));
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") updateWysiwygQrField("xPercent", current.xPercent + (event.key === "ArrowLeft" ? -step : step), "QR 영역을 가로로 이동했습니다.");
              else updateWysiwygQrField("yPercent", current.yPercent + (event.key === "ArrowUp" ? -step : step), "QR 영역을 세로로 이동했습니다.");
            }
          });
          hit.appendChild(qrBox);
        }
      }
      overlay.appendChild(hit);
    });
    surface.appendChild(overlay);
    if (focusMode) {
      const focusPlacement = page.placements[0];
      const focusSideData = focusPlacement?.record?.[previewSide] || {};
      observeWysiwygOverlaySize(surface, overlay, focusPlacement, focusSideData);
    }
    syncWysiwygControls();
  }

  function focusPreviewPlaceholder(title, message) {
    const surface = $("labelSheetFocusSurface");
    if (!surface) return;
    focusOverlayResizeObserver?.disconnect();
    focusOverlayResizeObserver = null;
    if (focusOverlayFinalizeFrame) window.cancelAnimationFrame(focusOverlayFinalizeFrame);
    focusOverlayFinalizeFrame = 0;
    surface.className = "label-sheet-focus-surface";
    delete surface.dataset.editorLayer;
    surface.style.removeProperty("aspect-ratio");
    const holder = document.createElement("div");
    holder.className = "label-sheet-preview-placeholder";
    const heading = document.createElement("strong");
    heading.textContent = title;
    const text = document.createElement("span");
    text.textContent = message;
    holder.append(heading, text);
    surface.replaceChildren(holder);
  }

  function createFocusPageModel(working, page, placement) {
    const transformed = RENDERER.transformRectForSide(placement, working.spec.page, {
      side: previewSide,
      page,
      backTransform: page.backTransform,
      backOffsetXmm: working.spec.duplex.offsetXmm,
      backOffsetYmm: working.spec.duplex.offsetYmm,
    });
    const widthMm = Math.max(0.1, Number(transformed.widthMm) || Number(placement.widthMm) || 1);
    const heightMm = Math.max(0.1, Number(transformed.heightMm) || Number(placement.heightMm) || 1);
    const paper = {
      name: "선택 티켓",
      orientation: widthMm >= heightMm ? "landscape" : "portrait",
      widthMm,
      heightMm,
    };
    const { geometry: _geometry, rect: _rect, rectMm: _rectMm, ...placementBase } = placement;
    const focusPlacement = {
      ...placementBase,
      xMm: 0,
      yMm: 0,
      widthMm,
      heightMm,
      rectMm: { xMm: 0, yMm: 0, widthMm, heightMm },
      backTransform: "none",
      side: previewSide,
      assetId: placement.record?.[previewSide]?.backgroundAssetId || placement.assetId || "",
    };
    return {
      working: { ...working, spec: { ...working.spec, page: paper } },
      page: {
        paper,
        spec: paper,
        pageNumber: page.pageNumber,
        sheetIndex: page.sheetIndex,
        side: previewSide,
        backTransform: "none",
        placements: [focusPlacement],
      },
    };
  }

  async function renderWysiwygFocusEditor(working, page) {
    const editor = $("labelSheetFocusEditor");
    const surface = $("labelSheetFocusSurface");
    focusPreviewAbortController?.abort();
    const version = ++focusRenderVersion;
    if (!editor || !surface || !wysiwygEnabled || normalizeOutputGoal(working?.settings?.outputGoal) !== "print") return;
    const placement = page?.placements?.[wysiwygPlacementIndex];
    if (!placement) {
      focusPreviewPlaceholder("편집할 티켓 없음", "A4 미리보기에 표시할 데이터가 없습니다.");
      setElementStatus("labelSheetFocusStatus", "편집할 티켓 데이터를 먼저 입력해 주세요.", "warning");
      return;
    }
    focusPreviewAbortController = new AbortController();
    const signal = focusPreviewAbortController.signal;
    const focusModel = createFocusPageModel(working, page, placement);
    const recordNumber = Number(placement.recordIndex ?? wysiwygPlacementIndex) + 1;
    const recordId = cleanText(placement.record?.id) || `label-${recordNumber}`;
    editor.classList.add("is-rendering");
    if ($("labelSheetFocusTitle")) $("labelSheetFocusTitle").textContent = `${recordNumber}번 티켓 확대 편집`;
    if ($("labelSheetFocusDescription")) $("labelSheetFocusDescription").textContent = `${previewSide === "front" ? "앞면" : "뒷면"} · ${recordId} · 상자를 끌거나 모서리 핸들로 크기를 조정하세요.`;
    try {
      const staging = document.createElement("div");
      await RENDERER.renderPreview(staging, focusModel.page, rendererOptions(working, previewSide, {
        previewDpi: FOCUS_PREVIEW_DPI,
        usePrintDerivatives: false,
        outputLayer: "background",
        backTransform: "none",
        backOffsetXmm: 0,
        backOffsetYmm: 0,
        signal,
      }));
      if (version !== focusRenderVersion || signal.aborted) return;
      surface.className = `label-sheet-focus-surface is-${focusModel.page.paper.orientation}`;
      surface.dataset.editorLayer = "background-only";
      surface.style.aspectRatio = `${focusModel.page.paper.widthMm} / ${focusModel.page.paper.heightMm}`;
      surface.replaceChildren(...Array.from(staging.childNodes));
      syncFocusBackgroundMode();
      renderWysiwygOverlay(focusModel.working, focusModel.page, {
        surface,
        focusMode: true,
      });
      await new Promise((resolve) => window.requestAnimationFrame(resolve));
      if (version !== focusRenderVersion || signal.aborted) return;
      finalizeWysiwygOverlayVisuals(surface, focusModel.page.placements[0], focusModel.page.placements[0]?.record?.[previewSide] || {});
    } catch (error) {
      if (version !== focusRenderVersion || signal.aborted || error?.name === "AbortError") return;
      focusPreviewPlaceholder("확대 편집 표시 실패", error.message || "선택 티켓을 다시 그릴 수 없습니다.");
      setElementStatus("labelSheetFocusStatus", "확대 편집 화면을 만들지 못했습니다. A4 미리보기와 출력 기능은 그대로 사용할 수 있습니다.", "warning");
    } finally {
      if (version === focusRenderVersion) editor.classList.remove("is-rendering");
    }
  }

  function renderWysiwygWorkspace(working, page) {
    renderWysiwygOverlay(working, page, { selectionOnly: true });
    void renderWysiwygFocusEditor(working, page);
  }

  function renderWysiwygFocusOverlayNow() {
    const surface = $("labelSheetFocusSurface");
    const page = currentPages[previewSide]?.[currentPageIndex];
    const placement = page?.placements?.[wysiwygPlacementIndex];
    if (!surface || !currentWorkingProject || !placement || !wysiwygEnabled) return;
    const recordIndex = Number(placement.recordIndex);
    const liveRecord = (Number.isInteger(recordIndex) ? project.records[recordIndex] : null)
      || project.records.find((record) => cleanText(record.id) === cleanText(placement.record?.id))
      || placement.record;
    const livePlacement = { ...placement, record: liveRecord };
    const livePage = { ...page, placements: [livePlacement] };
    const focusModel = createFocusPageModel(currentWorkingProject, livePage, livePlacement);
    renderWysiwygOverlay(focusModel.working, focusModel.page, { surface, focusMode: true });
    syncFocusBackgroundMode();
  }

  function moveWysiwygPlacement(delta) {
    const page = currentPages[previewSide]?.[currentPageIndex];
    const count = page?.placements?.length || 0;
    if (!count) return;
    const nextIndex = Math.min(count - 1, Math.max(0, wysiwygPlacementIndex + delta));
    if (nextIndex === wysiwygPlacementIndex) return;
    wysiwygPlacementIndex = nextIndex;
    syncWysiwygControls();
    renderWysiwygWorkspace(currentWorkingProject, page);
  }

  function previewPlaceholder(message) {
    const surface = $("labelSheetPreviewSurface");
    if (!surface) return;
    surface.replaceChildren();
    const holder = document.createElement("div");
    holder.className = "label-sheet-preview-placeholder";
    const title = document.createElement("strong");
    title.textContent = "A4 미리보기";
    const text = document.createElement("span");
    text.textContent = message;
    holder.append(title, text);
    surface.appendChild(holder);
  }

  async function refreshOutput() {
    const version = ++renderVersion;
    previewAbortController?.abort();
    previewAbortController = new AbortController();
    const signal = previewAbortController.signal;
    const sourceProject = previewSourceProject();
    const { working, models } = createOutputSnapshot({ project: sourceProject, sync: sourceProject === project });
    currentWorkingProject = working;
    currentPagination = models.pagination;
    currentPages = { front: models.front, back: models.back };
    const pages = currentPages[previewSide];
    currentPageIndex = Math.min(Math.max(0, currentPageIndex), Math.max(0, pages.length - 1));
    const surface = $("labelSheetPreviewSurface");
    if (surface) surface.className = `label-sheet-a4-sheet is-${working.spec.page.orientation}`;
    updateSpecSummary();
    if ($("labelSheetPageCount")) $("labelSheetPageCount").textContent = pages.length ? `${pages.length}장${working.spec.duplex.enabled ? " · 양면" : ""}` : "0장";
    if ($("labelSheetPageStatus")) $("labelSheetPageStatus").textContent = pages.length ? `${currentPageIndex + 1} / ${pages.length}` : "0 / 0";
    if ($("labelSheetFocusPageStatus")) $("labelSheetFocusPageStatus").textContent = pages.length ? `${currentPageIndex + 1} / ${pages.length}` : "0 / 0";
    if ($("labelSheetPagePrev")) $("labelSheetPagePrev").disabled = currentPageIndex <= 0;
    if ($("labelSheetPageNext")) $("labelSheetPageNext").disabled = currentPageIndex >= pages.length - 1;
    if ($("labelSheetFocusPagePrev")) $("labelSheetFocusPagePrev").disabled = currentPageIndex <= 0;
    if ($("labelSheetFocusPageNext")) $("labelSheetFocusPageNext").disabled = currentPageIndex >= pages.length - 1;
    if ($("labelSheetDuplexStepState")) $("labelSheetDuplexStepState").textContent = working.spec.duplex.enabled ? `양면 · ${transformLabel(resolvedBackTransform(working.spec))}` : "단면";
    if ($("labelSheetDuplexSettings")) $("labelSheetDuplexSettings").hidden = !working.spec.duplex.enabled;
    if ($("labelSheetPreviewBackBtn")) $("labelSheetPreviewBackBtn").disabled = !working.spec.duplex.enabled;
    if ($("labelSheetFocusBackBtn")) $("labelSheetFocusBackBtn").disabled = !working.spec.duplex.enabled;
    updatePrintJobControls(models.front.length);

    if (!pages.length) {
      previewPlaceholder("규격과 데이터를 적용하면 칸별 앞·뒷면이 표시됩니다.");
    } else {
      try {
        const staging = document.createElement("div");
        await RENDERER.renderPreview(staging, pages, rendererOptions(working, previewSide, {
          currentPageIndex,
          usePrintDerivatives: false,
          signal,
        }));
        if (version !== renderVersion || signal.aborted) return;
        surface.replaceChildren(...Array.from(staging.childNodes));
      } catch (error) {
        if (version !== renderVersion || signal.aborted || error?.name === "AbortError") return;
        previewPlaceholder(error.message || "미리보기를 만들 수 없습니다.");
      }
    }
    if (version !== renderVersion) return;
    renderWysiwygWorkspace(working, pages[currentPageIndex]);
    runPreflight({ working, models, announce: false });
    queueSave();
  }

  function transformLabel(input) {
    return ({ mirrorX: "좌우 반전", mirrorY: "상하 반전", rotate180: "180° 회전", none: "변환 없음" })[input] || "자동";
  }

  function scheduleRefresh() {
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(() => refreshOutput(), 90);
  }

  function onProjectControlsChanged(message, options = {}) {
    try {
      syncProjectFromControls();
      if (options.keepPrompts !== true && lastPromptBundle) invalidatePromptBundle();
      manualPrintPhase = "front";
      manualPrintRange = null;
      lastPreparedPrintRange = null;
      if ($("labelSheetPrintBtn")) $("labelSheetPrintBtn").textContent = "인쇄창 열기";
      if (options.rerenderTable !== false) renderRecordTable();
      else updateOutputTemplatePreviews();
      if (message) setStatus(message);
      scheduleRefresh();
      queueSave();
      window.dispatchEvent(new CustomEvent("promptdeck:label-sheet-project-change", {
        detail: { source: options.source || "controls" },
      }));
    } catch (error) {
      setStatus(error.message || "설정값을 확인해 주세요.", "error");
    }
  }

  function normalizeIssues(result, working) {
    const promptOnly = normalizeOutputGoal(working.settings?.outputGoal) === "prompt";
    const irrelevantForBackgroundPrompt = (issue) => promptOnly && /^(BACKGROUND|QR|TEXT|ASSET)/.test(issue.code || "");
    const errors = result.errors.filter((issue) => !irrelevantForBackgroundPrompt(issue)).map((issue) => ({ ...issue, level: "error" }));
    const warnings = result.warnings.filter((issue) => !irrelevantForBackgroundPrompt(issue)).map((issue) => ({ ...issue, level: "warning" }));
    const usedAssets = new Map();
    const qrValues = new Map();
    const qrEmptyTokens = new Map();
    const qrSettings = normalizeQrSettings(working.settings?.qr);
    if (!working.records.length) errors.push({ level: "error", code: "NO_RECORDS", message: promptOnly ? "페이지 수를 계산할 항목 수량이 없습니다." : "출력할 라벨·티켓 데이터가 없습니다." });
    if (!promptOnly) {
    if (qrSettings.enabled && !window.QRGeneratorCore?.drawCustomQRCode) {
      errors.push({ level: "error", code: "QR_RENDERER_MISSING", message: "QR코드 렌더링 모듈을 불러오지 못했습니다." });
    }
    if (qrSettings.enabled && qrSettings.side === "back" && !working.spec.duplex.enabled) {
      warnings.push({ level: "warning", code: "QR_BACK_WITH_SINGLE_SIDE", message: "QR 적용 면이 뒷면이지만 현재 출력은 단면입니다." });
    }
    if (qrSettings.enabled && qrSettings.source === "template" && !cleanText(qrSettings.template)) {
      warnings.push({ level: "warning", code: "QR_TEMPLATE_EMPTY", message: "QR 데이터가 템플릿 조합이지만 QR 템플릿이 비어 있습니다." });
    }
    if (qrSettings.enabled && qrSettings.source === "number" && working.settings.sequenceMode === "none") {
      warnings.push({ level: "warning", code: "QR_NUMBER_WITHOUT_SEQUENCE", message: "연번 없는 모드에서는 번호 기반 QR이 비어 있습니다. label_id 또는 템플릿 QR을 사용해 주세요." });
    }
    working.records.forEach((record) => {
      ["front", ...(working.spec.duplex.enabled ? ["back"] : [])].forEach((sideName) => {
        const side = record[sideName];
        const assetId = cleanText(side.backgroundAssetId);
        const filename = cleanText(side.backgroundFile);
        const asset = assetId ? assetStore.get(assetId) : null;
        if (assetId && !asset) {
          errors.push({ level: "error", code: "BACKGROUND_ASSET_NOT_FOUND", message: `${record.id} ${sideName === "front" ? "앞면" : "뒷면"}: 연결한 배경 원본이 보관함에 없습니다.` });
        } else if (asset) {
          usedAssets.set(asset.assetId, asset);
        } else if (filename) {
          const match = assetStore.findByFilename(filename);
          if (match.status === "ambiguous") errors.push({ level: "error", code: "BACKGROUND_FILE_AMBIGUOUS", message: `${record.id}: ${filename}과 같은 이름의 배경이 여러 개입니다.` });
          else if (match.status === "missing") errors.push({ level: "error", code: "BACKGROUND_FILE_NOT_FOUND", message: `${record.id}: ${filename} 배경을 먼저 보관함에 등록해 주세요.` });
        }
        const length = [side.title, side.subtitle, side.body, side.footer, side.number].join("").length;
        const area = working.spec.grid.labelWidthMm * working.spec.grid.labelHeightMm;
        const roughLimit = Math.max(70, Math.floor(area / 3));
        if (length > roughLimit) warnings.push({ level: "warning", code: "TEXT_DENSITY", message: `${record.id} ${sideName === "front" ? "앞면" : "뒷면"}: 문구가 많아 시험 인쇄에서 넘침을 확인해야 합니다.` });
        if (typeof RENDERER.analyzeLabelLayout === "function") {
          try {
            const layout = RENDERER.analyzeLabelLayout({
              record,
              side: sideName,
              widthMm: working.spec.grid.labelWidthMm,
              heightMm: working.spec.grid.labelHeightMm,
            }, {
              dpi: PREVIEW_DPI,
              safeAreaMm: working.settings.safeAreaMm || 2,
            });
            if (layout.truncatedFields.length) {
              const labels = { number: "번호", title: "제목", subtitle: "부제", body: "본문", footer: "하단 문구" };
              errors.push({
                level: "error",
                code: "TEXT_TRUNCATED",
                message: `${record.id} ${sideName === "front" ? "앞면" : "뒷면"}: ${layout.truncatedFields.map((field) => labels[field] || field).join("·")}가 출력 영역에서 잘립니다. 글자 크기를 줄이거나 문구·라벨 규격을 조정해 주세요.`,
              });
            }
            if (layout.verticalOverflow) errors.push({ level: "error", code: "TEXT_VERTICAL_OVERFLOW", message: `${record.id} ${sideName === "front" ? "앞면" : "뒷면"}: 본문과 하단 문구가 세로로 겹칩니다.` });
            if (layout.qrCollision) warnings.push({ level: "warning", code: "QR_TEXT_COLLISION", message: `${record.id} ${sideName === "front" ? "앞면" : "뒷면"}: QR과 문구가 겹칩니다. 자유 배치는 유지되지만 QR 판독과 문구 가독성을 시험 인쇄로 확인해 주세요.` });
          } catch (_error) {
            warnings.push({ level: "warning", code: "TEXT_LAYOUT_CHECK_FAILED", message: `${record.id}: 정밀 문구 배치 검사를 완료하지 못했습니다. 시험 인쇄로 확인해 주세요.` });
          }
        }
        if (side.qrEnabled) {
          if (qrSettings.source === "template") {
            resolveQrTemplate(record, sideName, qrSettings.template).emptyTokens.forEach((token) => {
              if (!qrEmptyTokens.has(token)) qrEmptyTokens.set(token, []);
              qrEmptyTokens.get(token).push(record.id);
            });
          }
          const qrValue = cleanText(side.qrValue);
          if (!qrValue) {
            warnings.push({ level: "warning", code: "QR_VALUE_MISSING", message: `${record.id} ${sideName === "front" ? "앞면" : "뒷면"}: QR 데이터가 비어 있어 QR을 출력하지 않습니다.` });
          } else {
            if (!qrValues.has(qrValue)) qrValues.set(qrValue, []);
            qrValues.get(qrValue).push(`${record.id} ${sideName}`);
            const effectiveQrSizePercent = clamp(Number(side.qrStyle?.sizePercent) || qrSettings.sizePercent, 16, 48);
            const qrSizeMm = Math.min(working.spec.grid.labelWidthMm, working.spec.grid.labelHeightMm) * effectiveQrSizePercent / 100;
            if (qrSizeMm < 15) warnings.push({ level: "warning", code: "QR_TOO_SMALL", message: `${record.id}: QR 한 변이 약 ${rounded(qrSizeMm)}mm로 작습니다. 실제 기기에서 스캔 시험을 해 주세요.` });
          }
        }
      });
    });
    qrEmptyTokens.forEach((recordIds, token) => {
      warnings.push({
        level: "warning",
        code: "QR_TEMPLATE_TOKEN_EMPTY",
        message: `QR 템플릿의 {${token}} 값이 ${recordIds.length}개 라벨에서 비어 있습니다. 샘플 변환값과 CSV 열 이름을 확인해 주세요.`,
      });
    });
    if (["admission", "meal-ticket"].includes(working.settings.documentType)) {
      qrValues.forEach((references, qrValue) => {
        if (references.length > 1) warnings.push({ level: "warning", code: "QR_VALUE_DUPLICATE", message: `출입·사용 확인용 QR 값이 ${references.length}개 면에서 중복됩니다: ${qrValue.slice(0, 60)}` });
      });
    }
    usedAssets.forEach((asset) => {
      if (asset.status === "low-resolution" || asset.warnings?.some((warning) => warning.code === "LOW_RESOLUTION")) {
        warnings.push({ level: "warning", code: "LOW_RESOLUTION", message: `${asset.filename}: 목표 인쇄 크기보다 원본 해상도가 작습니다.` });
      }
      if (asset.status === "failed") errors.push({ level: "error", code: "ASSET_FAILED", message: `${asset.filename}: 배경 이미지를 처리할 수 없습니다.` });
    });
    }
    const preset = PRESETS.get(working.settings.presetId);
    if (working.spec.duplex.enabled && preset?.duplexSuitable === false) {
      warnings.push({ level: "warning", code: "DUPLEX_MEDIA_NOT_RECOMMENDED", message: `${preset.productCode || preset.label} 접착식 라벨은 양면 출력용이 아닙니다. 출입표·식권은 양면 가능한 일반 용지를 사용해 주세요.` });
    }
    const bleed = Number(working.settings.bleedMm) || 0;
    const bleedOverlapsX = working.spec.grid.columns > 1 && working.spec.grid.gapXmm < bleed * 2;
    const bleedOverlapsY = working.spec.grid.rows > 1 && working.spec.grid.gapYmm < bleed * 2;
    if (bleed > 0 && (bleedOverlapsX || bleedOverlapsY)) {
      errors.push({ level: "error", code: "BLEED_OVERLAP", message: "재단 여유가 칸 사이 간격의 절반보다 커서 인접 배경과 겹칩니다. 재단 여유 또는 간격을 조정해 주세요." });
    }
    const unique = new Set();
    return [...errors, ...warnings].filter((issue) => {
      const key = `${issue.level}:${issue.code}:${issue.message}`;
      if (unique.has(key)) return false;
      unique.add(key);
      return true;
    });
  }

  function resolvePreflightIssueTarget(issue, working) {
    const code = cleanText(issue?.code);
    const message = cleanText(issue?.message);
    const path = cleanText(issue?.path);
    const pathMatch = path.match(/^records\[(\d+)\](?:\.(front|back))?(?:\.([a-zA-Z]+))?/u);
    let recordIndex = pathMatch ? Number(pathMatch[1]) : -1;
    if (!Number.isInteger(recordIndex) || recordIndex < 0 || recordIndex >= working.records.length) {
      recordIndex = working.records.findIndex((record) => message === record.id || message.startsWith(`${record.id} `) || message.startsWith(`${record.id}:`));
    }
    const recordId = recordIndex >= 0 ? working.records[recordIndex]?.id || "" : "";
    const side = pathMatch?.[2] || (/뒷면| back(?:\s|$)/iu.test(message) ? "back" : "front");
    const pathField = pathMatch?.[3] || "";
    const dataField = pathMatch
      ? path.replace(/^records\[\d+\]\.?/u, "").replace(/\.background(?:AssetId|File)$/u, "").replace(/\.qrValue$/u, ".qrValue")
      : "";
    const field = code.startsWith("QR_")
      ? "qr"
      : /하단 문구|footer/iu.test(message) || pathField === "footer"
        ? "footer"
        : /부제|subtitle/iu.test(message) || pathField === "subtitle"
          ? "subtitle"
          : /제목|title/iu.test(message) || pathField === "title"
            ? "title"
            : /연번|번호|number/iu.test(message) || pathField === "number"
              ? "number"
              : /본문|세로로 겹/iu.test(message) || pathField === "body"
                ? "body"
                : "title";
    const route = code === "NO_RECORDS"
      ? "data"
      : /^(DUPLICATE_|UPDATE_|UNCLOSED_QUOTE)/u.test(code)
        ? "data"
        : /^(BACKGROUND_|ASSET_|LOW_RESOLUTION|MISSING_BACKGROUNDS)/u.test(code)
          ? "assets"
          : /^(QR_|TEXT_)/u.test(code)
            ? code.startsWith("QR_") ? "advanced" : "canvas"
            : /^(INVALID_|PAGE_|GRID_|NEGATIVE_|LOW_DPI|VERY_HIGH_DPI|HIGH_CELL_COUNT|BLEED_|DUPLEX_)/u.test(code)
              ? "settings"
              : recordIndex >= 0 ? "canvas" : "validation";
    return { code, route, recordIndex, recordId, side, field, path, dataField };
  }

  function focusPreflightIssue(issue, working) {
    const target = resolvePreflightIssueTarget(issue, working);
    window.dispatchEvent(new CustomEvent("promptdeck:label-sheet-focus-issue", {
      detail: { ...target, level: issue.level, message: issue.message },
    }));
    setStatus(
      target.route === "canvas" || target.route === "advanced"
        ? `${target.recordId || "선택 티켓"}의 ${WYSIWYG_FIELD_LABELS[target.field] || "편집 항목"} 위치로 이동했습니다.`
        : "문제를 해결할 수 있는 설정 화면으로 이동했습니다.",
      issue.level === "error" ? "error" : "warning"
    );
  }

  function runPreflight(options = {}) {
    const snapshot = options.working && options.models
      ? { working: options.working, models: options.models }
      : options.working
        ? { working: options.working, models: createPageModels(options.working) }
        : createOutputSnapshot();
    const { working, models } = snapshot;
    const promptOnly = normalizeOutputGoal(working.settings?.outputGoal) === "prompt";
    const result = ENGINE.preflightProject(working, { requireBackgrounds: false });
    const issues = normalizeIssues(result, working);
    const container = $("labelSheetPreflight");
    if (container) {
      container.replaceChildren();
      if (!issues.length) {
        const item = document.createElement("div");
        item.className = "label-sheet-preflight-item is-success";
        item.textContent = "필수 점검을 통과했습니다. 실제 용지에는 먼저 1장을 시험 인쇄해 주세요.";
        container.appendChild(item);
      } else {
        issues.slice(0, 12).forEach((issue) => {
          const item = document.createElement("button");
          item.type = "button";
          item.className = `label-sheet-preflight-item is-${issue.level}`;
          item.dataset.issueCode = issue.code || "";
          const badge = document.createElement("span");
          badge.className = "label-sheet-preflight-badge";
          badge.textContent = issue.level === "error" ? "오류" : "주의";
          const message = document.createElement("span");
          message.className = "label-sheet-preflight-message";
          message.textContent = issue.message;
          const action = document.createElement("span");
          action.className = "label-sheet-preflight-action";
          action.textContent = "수정";
          item.append(badge, message, action);
          item.addEventListener("click", () => focusPreflightIssue(issue, working));
          container.appendChild(item);
        });
      }
    }
    const fatal = issues.some((issue) => issue.level === "error");
    const hasPages = models.front.length > 0;
    if ($("labelSheetExportPngBtn")) $("labelSheetExportPngBtn").disabled = outputExportBusy || fatal || !hasPages;
    if ($("labelSheetExportAllPngBtn")) $("labelSheetExportAllPngBtn").disabled = outputExportBusy || fatal || !hasPages;
    if ($("labelSheetExportPdfBtn")) $("labelSheetExportPdfBtn").disabled = outputExportBusy || fatal || !hasPages || typeof RENDERER.exportPagesPdf !== "function";
    if ($("labelSheetPrintBtn")) $("labelSheetPrintBtn").disabled = outputExportBusy || fatal || !hasPages;
    if ($("labelSheetPrintCurrentBtn")) $("labelSheetPrintCurrentBtn").disabled = outputExportBusy || fatal || !hasPages;
    if ($("labelSheetOutputState")) {
      $("labelSheetOutputState").textContent = fatal ? "수정 필요" : issues.length ? `주의 ${issues.length}건` : promptOnly ? "프롬프트 가능" : "출력 가능";
      $("labelSheetOutputState").dataset.tone = fatal ? "error" : issues.length ? "warning" : "success";
    }
    if (options.announce) setStatus(
      fatal
        ? `${promptOnly ? "프롬프트 생성을" : "출력을"} 막는 오류를 확인해 주세요.`
        : issues.length
          ? `${promptOnly ? "프롬프트 생성" : "출력"} 전 주의사항 ${issues.length}건을 확인해 주세요.`
          : `${promptOnly ? "프롬프트 생성" : "출력"} 전 점검을 통과했습니다.`,
      fatal ? "error" : issues.length ? "warning" : "success",
    );
    if (!outputExportBusy && $("labelSheetActionDockStatus")) {
      const generatedPromptPages = lastPromptBundle?.pagePrompts?.length || 0;
      const generatedPromptItems = lastPromptBundle?.individualPrompts?.length || 0;
      setOutputActionStatus(
        fatal
          ? `${promptOnly ? "프롬프트 생성" : "출력"} 전 오류를 먼저 수정해 주세요.`
          : hasPages
            ? promptOnly && generatedPromptPages
              ? `프롬프트 생성 완료 · 페이지 ${generatedPromptPages}개 · 개별 ${generatedPromptItems}개`
              : promptOnly
                ? `프롬프트 생성 준비 · A4 ${currentPages.front.length}시트${working.spec.duplex.enabled ? " · 양면" : " · 단면"}`
              : `현재 ${currentPageIndex + 1}쪽 · 전체 ${currentPages.front.length}시트${working.spec.duplex.enabled ? " · 양면" : " · 단면"}`
            : `규격과 데이터를 입력하면 ${promptOnly ? "프롬프트" : "출력"} 기능이 활성화됩니다.`,
        fatal ? "error" : issues.length ? "warning" : hasPages ? "success" : "",
      );
    }
    window.PromptDeckTabs?.syncHeaderActionStates?.();
    return { result, issues, fatal };
  }

  function promptPageLabel(page, total) {
    const side = page.side === "back" ? "뒷면" : "앞면";
    return `출력 ${page.printPageNumber}/${total} · 시트 ${page.sheetNumber} ${side} · ${page.promptEntryCount}개 라벨`;
  }

  function promptMode() {
    const mode = value("labelSheetPromptMode");
    return ["background-only", "overlay-only", "integrated"].includes(mode) ? mode : "integrated";
  }

  function promptForMode(page, mode = promptMode()) {
    if (!page) return "";
    if (mode === "background-only") return page.promptVariants?.backgroundOnly || page.prompt || "";
    if (mode === "overlay-only") return page.promptVariants?.overlayOnly || page.prompt || "";
    return page.promptVariants?.integrated || page.prompt || "";
  }

  function allPromptsForMode(bundle, mode = promptMode()) {
    if (!bundle) return "";
    return bundle.allPagesByMode?.[mode] || bundle.allPagesPrompt || "";
  }

  function updatePromptPrivacyStatus() {
    const status = $("labelSheetPromptPrivacyStatus");
    if (!status) return;
    status.textContent = "실제 문구·번호가 포함됩니다. QR 값이나 가짜 코드는 넣지 않고 선택한 위치·크기의 깨끗한 합성 공간만 예약합니다.";
    status.dataset.tone = "warning";
  }

  function confirmPromptDisclosure() {
    if (promptDisclosureAccepted) return true;
    promptDisclosureAccepted = window.confirm("전체 이미지 프롬프트에는 실제 라벨 문구와 번호가 포함됩니다. QR 값은 제외되지만, 외부 서비스로 복사하기 전에 개인정보와 민감정보를 확인했나요?");
    return promptDisclosureAccepted;
  }

  function promptItemsForPage(page) {
    if (!page) return [];
    if (Array.isArray(page.individualPrompts)) return page.individualPrompts;
    return Array.from(page.slots || []).map((slot) => ({
      slotNumber: slot.slotNumber,
      recordId: slot.recordId,
      side: page.side,
      prompt: slot.individualPrompt || slot.integratedPrompt || "",
    }));
  }

  function setPromptResultView(viewInput) {
    promptResultView = viewInput === "item" ? "item" : "page";
    const tabs = {
      page: $("labelSheetPromptPageViewTab"),
      item: $("labelSheetPromptItemViewTab"),
    };
    const panels = {
      page: $("labelSheetPromptPagePanel"),
      item: $("labelSheetPromptItemPanel"),
    };
    Object.keys(tabs).forEach((key) => {
      const active = key === promptResultView;
      tabs[key]?.classList.toggle("active", active);
      tabs[key]?.setAttribute("aria-selected", String(active));
      panels[key]?.classList.toggle("active", active);
      if (panels[key]) panels[key].hidden = !active;
    });
  }

  function renderPromptItem() {
    const page = lastPromptBundle?.pagePrompts?.[currentPromptPageIndex];
    const items = promptItemsForPage(page);
    const select = $("labelSheetPromptItemSelect");
    if (!items.length) {
      currentPromptItemIndex = 0;
      if (select) {
        select.replaceChildren();
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "현재 페이지에 라벨이 없습니다";
        select.appendChild(option);
        select.disabled = true;
      }
      if ($("labelSheetPromptItemStatus")) $("labelSheetPromptItemStatus").textContent = "0 / 0";
      if ($("labelSheetPromptItemPreview")) $("labelSheetPromptItemPreview").value = "";
      ["labelSheetPromptItemPrevBtn", "labelSheetPromptItemNextBtn", "labelSheetCopyItemPromptBtn", "labelSheetCopyPageItemsBtn"].forEach((id) => {
        if ($(id)) $(id).disabled = true;
      });
      return "";
    }
    currentPromptItemIndex = Math.min(Math.max(0, currentPromptItemIndex), items.length - 1);
    if (select) {
      select.replaceChildren();
      items.forEach((item, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = `칸 ${item.slotNumber} · ${item.recordId} · ${item.side === "back" ? "뒷면" : "앞면"}`;
        select.appendChild(option);
      });
      select.disabled = false;
      select.value = String(currentPromptItemIndex);
    }
    const item = items[currentPromptItemIndex];
    if ($("labelSheetPromptItemStatus")) $("labelSheetPromptItemStatus").textContent = `${currentPromptItemIndex + 1} / ${items.length}`;
    if ($("labelSheetPromptItemPreview")) $("labelSheetPromptItemPreview").value = item.prompt || "";
    if ($("labelSheetPromptItemPrevBtn")) $("labelSheetPromptItemPrevBtn").disabled = currentPromptItemIndex <= 0;
    if ($("labelSheetPromptItemNextBtn")) $("labelSheetPromptItemNextBtn").disabled = currentPromptItemIndex >= items.length - 1;
    if ($("labelSheetCopyItemPromptBtn")) $("labelSheetCopyItemPromptBtn").disabled = !item.prompt;
    if ($("labelSheetCopyPageItemsBtn")) $("labelSheetCopyPageItemsBtn").disabled = !items.some((entry) => entry.prompt);
    return item.prompt || "";
  }

  function renderPromptPage() {
    const pages = lastPromptBundle?.pagePrompts || [];
    const selects = [$("labelSheetPromptPageSelect"), $("labelSheetPromptPageSelectBottom")].filter(Boolean);
    const pageStatuses = [$("labelSheetPromptPageStatus"), $("labelSheetPromptPageStatusBottom")].filter(Boolean);
    const previousButtons = [$("labelSheetPromptPrevBtn"), $("labelSheetPromptPrevBottomBtn")].filter(Boolean);
    const nextButtons = [$("labelSheetPromptNextBtn"), $("labelSheetPromptNextBottomBtn")].filter(Boolean);
    const copyButtons = [$("labelSheetCopyPromptBtn"), $("labelSheetCopyPromptBottomBtn")].filter(Boolean);
    const copyNextButtons = [$("labelSheetCopyPromptNextBtn"), $("labelSheetCopyPromptNextBottomBtn")].filter(Boolean);
    const copyProgress = [$("labelSheetPromptCopyProgress"), $("labelSheetPromptCopyProgressBottom")].filter(Boolean);
    if (!pages.length) {
      currentPromptPageIndex = 0;
      selects.forEach((select) => {
        select.replaceChildren();
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "프롬프트를 먼저 생성해 주세요";
        select.appendChild(option);
        select.disabled = true;
      });
      pageStatuses.forEach((status) => { status.textContent = "0 / 0"; });
      previousButtons.forEach((button) => { button.disabled = true; });
      nextButtons.forEach((button) => { button.disabled = true; });
      copyButtons.forEach((button) => { button.disabled = true; });
      copyNextButtons.forEach((button) => { button.disabled = true; });
      copyProgress.forEach((status) => { status.textContent = "복사 완료 0 / 0"; });
      if ($("labelSheetCopyAllPromptsBtn")) $("labelSheetCopyAllPromptsBtn").disabled = true;
      if ($("labelSheetPromptPreview")) $("labelSheetPromptPreview").value = "";
      if ($("labelSheetPromptSplitSummary")) {
        $("labelSheetPromptSplitSummary").setAttribute("aria-label", "프롬프트 생성 전");
      }
      renderPromptItem();
      updatePromptPrivacyStatus();
      return "";
    }

    currentPromptPageIndex = Math.min(Math.max(0, currentPromptPageIndex), pages.length - 1);
    selects.forEach((select) => {
      const currentOptions = Array.from(select.options).map((option) => option.value);
      const desiredOptions = pages.map((_, index) => String(index));
      if (currentOptions.length !== desiredOptions.length || currentOptions.some((value, index) => value !== desiredOptions[index])) {
        select.replaceChildren();
        pages.forEach((page, index) => {
          const option = document.createElement("option");
          option.value = String(index);
          option.textContent = `${copiedPromptPageIndices.has(index) ? "✓ " : ""}${promptPageLabel(page, pages.length)}`;
          select.appendChild(option);
        });
      } else {
        pages.forEach((page, index) => {
          select.options[index].textContent = `${copiedPromptPageIndices.has(index) ? "✓ " : ""}${promptPageLabel(page, pages.length)}`;
        });
      }
      select.disabled = false;
      select.value = String(currentPromptPageIndex);
    });
    const page = pages[currentPromptPageIndex];
    pageStatuses.forEach((status) => { status.textContent = `${currentPromptPageIndex + 1} / ${pages.length}`; });
    previousButtons.forEach((button) => { button.disabled = currentPromptPageIndex <= 0; });
    nextButtons.forEach((button) => { button.disabled = currentPromptPageIndex >= pages.length - 1; });
    copyButtons.forEach((button) => { button.disabled = false; });
    copyNextButtons.forEach((button) => { button.disabled = currentPromptPageIndex >= pages.length - 1; });
    copyProgress.forEach((status) => { status.textContent = `복사 완료 ${copiedPromptPageIndices.size} / ${pages.length}`; });
    if ($("labelSheetCopyAllPromptsBtn")) $("labelSheetCopyAllPromptsBtn").disabled = false;
    const output = promptForMode(page);
    if ($("labelSheetPromptPreview")) $("labelSheetPromptPreview").value = output;
    const totalItems = pages.reduce((sum, item) => sum + promptItemsForPage(item).length, 0);
    if ($("labelSheetPromptSplitSummary")) {
      const strongs = $("labelSheetPromptSplitSummary").querySelectorAll("strong");
      if (strongs[0]) strongs[0].textContent = String(pages.length);
      if (strongs[1]) strongs[1].textContent = String(pages.length);
      if (strongs[2]) strongs[2].textContent = String(totalItems);
      $("labelSheetPromptSplitSummary").setAttribute("aria-label", `A4 ${pages.length}페이지와 개별 라벨 ${totalItems}개 프롬프트 생성 완료`);
    }
    renderPromptItem();
    updatePromptPrivacyStatus();
    return output;
  }

  function invalidatePromptBundle() {
    lastPromptBundle = null;
    currentPromptPageIndex = 0;
    currentPromptItemIndex = 0;
    copiedPromptPageIndices = new Set();
    promptDisclosureAccepted = false;
    renderPromptPage();
  }

  function syncPromptPageToPreview() {
    const pages = lastPromptBundle?.pagePrompts || [];
    const matchedIndex = pages.findIndex((page) => page.sheetIndex === currentPageIndex && page.side === previewSide);
    if (matchedIndex < 0) return;
    currentPromptPageIndex = matchedIndex;
    renderPromptPage();
  }

  function selectPromptPage(index, options = {}) {
    const pages = lastPromptBundle?.pagePrompts || [];
    if (!pages.length) return;
    currentPromptPageIndex = Math.min(Math.max(0, Number(index) || 0), pages.length - 1);
    currentPromptItemIndex = 0;
    const page = pages[currentPromptPageIndex];
    renderPromptPage();
    if (options.syncPreview === false) return;
    previewSide = page.side === "back" ? "back" : "front";
    currentPageIndex = page.sheetIndex;
    ["front", "back"].forEach((side) => {
      const button = $(`labelSheetPreview${side === "front" ? "Front" : "Back"}Btn`);
      if (!button) return;
      const active = side === previewSide;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    window.clearTimeout(renderTimer);
    void refreshOutput().catch((error) => {
      setStatus(error.message || "선택한 프롬프트 페이지의 미리보기를 만들 수 없습니다.", "error");
    });
  }

  function generatePrompts(options = {}) {
    const working = effectiveProject();
    if (!working.records.length) {
      setStatus("프롬프트를 만들 라벨 데이터를 먼저 입력해 주세요.", "warning");
      return "";
    }
    lastPromptBundle = ENGINE.generatePromptBundle(working, { includeEmptySides: working.spec.duplex.enabled });
    copiedPromptPageIndices = new Set();
    promptDisclosureAccepted = false;
    const matchedIndex = lastPromptBundle.pagePrompts.findIndex((page) => page.sheetIndex === currentPageIndex && page.side === previewSide);
    currentPromptPageIndex = matchedIndex >= 0 ? matchedIndex : Math.min(currentPromptPageIndex, Math.max(0, lastPromptBundle.pagePrompts.length - 1));
    const output = renderPromptPage();
    if (options.announce !== false) {
      const summary = lastPromptBundle.pagination;
      const itemCount = lastPromptBundle.individualPrompts?.length || 0;
      setStatus(`A4 ${summary.totalSheets}장 · 페이지 프롬프트 ${summary.printPageCount}개 · 개별 라벨 프롬프트 ${itemCount}개를 생성했습니다.`, "success");
      setOutputActionStatus(`프롬프트 생성 완료 · 페이지 ${summary.printPageCount}개 · 개별 ${itemCount}개`, "success");
    }
    return output;
  }

  async function writePromptClipboard(text) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (_error) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
  }

  async function copyPrompt(options = {}) {
    if (!lastPromptBundle?.pagePrompts?.length) generatePrompts({ announce: false });
    const pages = lastPromptBundle?.pagePrompts || [];
    const copiedIndex = currentPromptPageIndex;
    const page = pages[copiedIndex];
    const mode = promptMode();
    const output = promptForMode(page, mode);
    if (!output || !confirmPromptDisclosure(mode)) return;
    await writePromptClipboard(output);
    copiedPromptPageIndices.add(copiedIndex);
    if (options.advance === true && copiedIndex < pages.length - 1) {
      selectPromptPage(copiedIndex + 1);
      setStatus(`페이지 ${copiedIndex + 1} 프롬프트를 복사하고 ${copiedIndex + 2}페이지로 이동했습니다.`, "success");
      setOutputActionStatus(`복사 완료 ${copiedPromptPageIndices.size}/${pages.length} · ${copiedIndex + 2}페이지 선택`, "success");
      return;
    }
    renderPromptPage();
    setStatus(`페이지 ${copiedIndex + 1} · 시트 ${page.sheetNumber} ${page.side === "back" ? "뒷면" : "앞면"} 프롬프트를 복사했습니다.`, "success");
    setOutputActionStatus(`복사 완료 ${copiedPromptPageIndices.size}/${pages.length}`, "success");
  }

  async function copyAllPrompts() {
    if (!lastPromptBundle?.pagePrompts?.length) generatePrompts({ announce: false });
    const pages = lastPromptBundle?.pagePrompts || [];
    if (!pages.length) return;
    const mode = promptMode();
    if (!confirmPromptDisclosure(mode)) return;
    await writePromptClipboard(allPromptsForMode(lastPromptBundle, mode));
    copiedPromptPageIndices = new Set(pages.map((_, index) => index));
    renderPromptPage();
    setStatus(`출력 순서대로 ${pages.length}페이지 프롬프트를 모두 복사했습니다.`, "success");
  }

  function selectPromptItem(index) {
    const page = lastPromptBundle?.pagePrompts?.[currentPromptPageIndex];
    const items = promptItemsForPage(page);
    if (!items.length) return;
    currentPromptItemIndex = Math.min(Math.max(0, Number(index) || 0), items.length - 1);
    renderPromptItem();
  }

  async function copyItemPrompt() {
    if (!lastPromptBundle?.pagePrompts?.length) generatePrompts({ announce: false });
    const page = lastPromptBundle?.pagePrompts?.[currentPromptPageIndex];
    const item = promptItemsForPage(page)[currentPromptItemIndex];
    if (!item?.prompt || !confirmPromptDisclosure()) return;
    await writePromptClipboard(item.prompt);
    setStatus(`칸 ${item.slotNumber} · ${item.recordId} 개별 라벨 프롬프트를 복사했습니다.`, "success");
  }

  async function copyPageItems() {
    if (!lastPromptBundle?.pagePrompts?.length) generatePrompts({ announce: false });
    const page = lastPromptBundle?.pagePrompts?.[currentPromptPageIndex];
    const items = promptItemsForPage(page).filter((item) => item.prompt);
    if (!items.length || !confirmPromptDisclosure()) return;
    const output = items.map((item, index) => `### ITEM ${index + 1} · SLOT ${item.slotNumber} · ${item.recordId}\n${item.prompt}`).join("\n\n################################################################\n\n");
    await writePromptClipboard(output);
    setStatus(`현재 A4 페이지의 개별 라벨 프롬프트 ${items.length}개를 출력 순서대로 복사했습니다.`, "success");
  }

  async function registerPageImage() {
    if (!pendingPageImageFile) {
      setElementStatus("labelSheetPageImageStatus", "먼저 외부 AI에서 만든 A4 배경 이미지를 선택해 주세요.", "warning");
      return;
    }
    if (promptMode() !== "background-only") {
      setElementStatus("labelSheetPageImageStatus", "페이지 배경 등록은 글자 없는 ‘배경만’ 프롬프트 결과에서만 사용할 수 있습니다.", "warning");
      return;
    }
    if (!lastPromptBundle?.pagePrompts?.length) generatePrompts({ announce: false });
    const page = lastPromptBundle?.pagePrompts?.[currentPromptPageIndex];
    if (!page) {
      setElementStatus("labelSheetPageImageStatus", "먼저 페이지별 배경 프롬프트를 생성해 주세요.", "warning");
      return;
    }
    const working = effectiveProject();
    const engineCheck = ENGINE.preflightProject(working, { requireBackgrounds: false });
    if (engineCheck.errors.length) {
      setElementStatus("labelSheetPageImageStatus", engineCheck.errors[0].message || "규격과 데이터 오류를 먼저 수정해 주세요.", "error");
      return;
    }
    const activeRecords = project.records.filter((record) => !record.data?.excluded);
    const recordById = new Map(activeRecords.map((record) => [record.id, record]));
    if (recordById.size !== activeRecords.length) {
      setElementStatus("labelSheetPageImageStatus", "중복된 라벨 ID가 있어 페이지 이미지를 안전하게 연결할 수 없습니다.", "error");
      return;
    }

    const button = $("labelSheetPageImageRegisterBtn");
    if (button) button.disabled = true;
    setElementStatus("labelSheetPageImageStatus", `시트 ${page.sheetNumber} ${page.side === "back" ? "뒷면" : "앞면"} 이미지를 등록하고 칸별로 자르고 있습니다…`);
    try {
      const asset = await assetStore.register(pendingPageImageFile, {
        filename: pendingPageImageFile.name,
        fit: "cover",
        focalPoint: { x: 0.5, y: 0.5 },
      });
      if (asset.status === "failed") throw new Error(asset.errors?.[0]?.message || "A4 배경 이미지를 해석하지 못했습니다.");
      const pageRatio = working.spec.page.widthMm / working.spec.page.heightMm;
      const imageRatio = asset.width / asset.height;
      const ratioDifference = Math.abs(imageRatio / pageRatio - 1);
      if (ratioDifference > 0.03 && !window.confirm(`선택한 이미지 비율이 현재 ${working.spec.page.orientation === "landscape" ? "가로형" : "세로형"} A4와 다릅니다. 가장자리가 잘릴 수 있습니다. 계속 연결할까요?`)) {
        setElementStatus("labelSheetPageImageStatus", "페이지 이미지 연결을 취소했습니다. 등록한 원본은 보관함에서 다시 사용할 수 있습니다.", "warning");
        selectedAssetId = asset.assetId;
        renderAssets();
        return;
      }
      const sideName = page.side === "back" ? "back" : "front";
      const requests = [];
      let assigned = 0;
      page.slots.forEach((slot) => {
        const record = recordById.get(slot.recordId);
        if (!record?.[sideName]) return;
        const crop = ASSETS.calculatePageCrop(slot.rectMm, working.spec.page);
        record[sideName].backgroundAssetId = asset.assetId;
        record[sideName].backgroundFile = asset.filename;
        record[sideName].backgroundCrop = crop;
        requests.push({
          assetId: asset.assetId,
          widthMm: working.spec.grid.labelWidthMm,
          heightMm: working.spec.grid.labelHeightMm,
          dpi: working.spec.dpi,
          fit: "cover",
          crop,
          focalPoint: { x: 0.5, y: 0.5 },
          allowUpscale: checked("labelSheetAllowUpscale"),
        });
        assigned += 1;
      });
      const processed = await assetStore.processMany(requests);
      const failed = processed.filter((item) => !item.ok).length;
      selectedAssetId = asset.assetId;
      pendingPageImageFile = null;
      if ($("labelSheetPageImageInput")) $("labelSheetPageImageInput").value = "";
      syncAssetReferences();
      renderAssets();
      renderRecordTable();
      onProjectControlsChanged("A4 페이지 배경을 라벨별 자르기 영역과 함께 연결했습니다.", { rerenderTable: false });
      setElementStatus(
        "labelSheetPageImageStatus",
        `시트 ${page.sheetNumber} ${sideName === "back" ? "뒷면" : "앞면"} · ${assigned}칸 연결 완료${failed ? ` · 인쇄용 처리 실패 ${failed}건` : ""}`,
        failed ? "warning" : "success",
      );
    } catch (error) {
      setElementStatus("labelSheetPageImageStatus", error.message || "A4 페이지 배경을 등록하지 못했습니다.", "error");
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function exportCurrentPage() {
    if (outputExportBusy) return;
    quiescePreviewForOutput();
    const { working, models } = createOutputSnapshot();
    const pages = models[previewSide];
    const exportPageIndex = Math.min(Math.max(0, currentPageIndex), Math.max(0, pages.length - 1));
    const page = pages[exportPageIndex];
    if (!page) {
      setStatus("내보낼 페이지가 없습니다.", "warning");
      scheduleRefresh();
      return;
    }
    const check = runPreflight({ working, models, announce: true });
    if (check.fatal) {
      scheduleRefresh();
      return;
    }
    let finalActionStatus = null;
    setOutputExportBusy(true);
    try {
      await waitForOutputResources();
      setStatus(`${previewSide === "front" ? "앞면" : "뒷면"} ${exportPageIndex + 1}쪽을 ${working.spec.dpi}dpi PNG로 만들고 있습니다…`);
      await RENDERER.exportPagePng(page, rendererOptions(working, previewSide, {
        download: true,
        filename: `${escapeFilename(project.name)}-${previewSide}-${exportPageIndex + 1}.png`,
        usePrintDerivatives: true,
        showSafeArea: false,
      }));
      setStatus("페이지 PNG를 내려받았습니다.", "success");
      finalActionStatus = { message: `${previewSide === "front" ? "앞면" : "뒷면"} ${exportPageIndex + 1}쪽 PNG 저장 완료`, tone: "success" };
      setOutputActionStatus(finalActionStatus.message, finalActionStatus.tone);
    } catch (error) {
      setStatus(error.message || "페이지 PNG를 만들 수 없습니다.", "error");
      finalActionStatus = { message: error.message || "페이지 PNG 생성 실패", tone: "error" };
      setOutputActionStatus(finalActionStatus.message, finalActionStatus.tone);
    } finally {
      setOutputExportBusy(false);
      runPreflight({ announce: false });
      scheduleRefresh();
      if (finalActionStatus) setOutputActionStatus(finalActionStatus.message, finalActionStatus.tone);
    }
  }

  function outputSequenceForRange(working, models, options = {}) {
    const range = resolvePrintRange(models.front.length, options);
    if (!range || range.empty) return { range, sequence: [] };
    const frontPages = models.front.slice(range.from - 1, range.to);
    if (!working.spec.duplex.enabled) return { range, sequence: frontPages.map((page) => ({ ...page, side: "front" })) };
    const backPages = models.back.slice(range.from - 1, range.to);
    return { range, sequence: RENDERER.buildPrintSequence(frontPages, backPages, "auto-duplex") };
  }

  function setOutputExportBusy(busy) {
    outputExportBusy = Boolean(busy);
    ["labelSheetExportPngBtn", "labelSheetExportAllPngBtn", "labelSheetExportPdfBtn", "labelSheetPrintBtn", "labelSheetPrintCurrentBtn", "labelSheetExportLayersBtn", "labelSheetCalibrationBtn"].forEach((id) => {
      const button = $(id);
      if (button) button.disabled = outputExportBusy;
    });
    window.PromptDeckTabs?.syncHeaderActionStates?.();
  }

  function quiescePreviewForOutput() {
    window.clearTimeout(renderTimer);
    renderTimer = 0;
    previewAbortController?.abort();
  }

  async function waitForOutputResources() {
    try {
      if (document.fonts?.ready) await document.fonts.ready;
    } catch (_error) {
      // Canvas falls back to the next configured font when a webfont cannot load.
    }
  }

  async function exportAllPagesPng(options = {}) {
    if (outputExportBusy) return;
    if (typeof window.createZip !== "function") {
      setOutputActionStatus("PNG 묶음용 ZIP 모듈을 불러오지 못했습니다.", "error");
      return;
    }
    const { working, models } = createOutputSnapshot();
    const check = runPreflight({ working, models, announce: true });
    if (check.fatal) return;
    const { range, sequence } = outputSequenceForRange(working, models, options);
    if (!sequence.length) {
      setOutputActionStatus("저장할 출력 페이지가 없습니다.", "warning");
      return;
    }
    if (sequence.length > 24 && !window.confirm(`${sequence.length}쪽을 ${working.spec.dpi}dpi PNG로 만듭니다. 브라우저 메모리를 많이 사용할 수 있습니다. 계속할까요?`)) return;

    let finalActionStatus = null;
    setOutputExportBusy(true);
    try {
      await waitForOutputResources();
      const files = [];
      for (let index = 0; index < sequence.length; index += 1) {
        const page = sequence[index];
        const sideName = page.side === "back" ? "back" : "front";
        const sheetNumber = Number(page.sheetIndex) + 1 || page.pageNumber || index + 1;
        const progress = `${index + 1}/${sequence.length}`;
        setStatus(`전체 PNG ${progress} · ${sideName === "back" ? "뒷면" : "앞면"} ${sheetNumber}쪽 생성 중…`);
        setOutputActionStatus(`전체 PNG 묶음 생성 중 · ${progress}`);
        const blob = await RENDERER.exportPagePng(page, rendererOptions(working, sideName, {
          download: false,
          usePrintDerivatives: true,
          showCutLines: false,
          showSafeArea: false,
        }));
        files.push({
          name: `page-${String(index + 1).padStart(3, "0")}-sheet-${String(sheetNumber).padStart(3, "0")}-${sideName}.png`,
          data: await blobBytes(blob),
        });
      }
      const rangeLabel = range ? `${range.from}-${range.to}` : "all";
      files.push({
        name: "README-KO.txt",
        data: new TextEncoder().encode(`라벨·티켓 전체 페이지 PNG\r\n출력 시트 범위: ${rangeLabel}\r\n페이지 순서: ${working.spec.duplex.enabled ? "앞면-뒷면 교차" : "앞면"}\r\n해상도: ${working.spec.dpi} dpi\r\n`),
      });
      const filename = `${escapeFilename(project.name)}-pages-${rangeLabel}.zip`;
      downloadBlob(window.createZip(files), filename);
      setStatus(`전체 ${sequence.length}쪽 PNG를 ZIP으로 저장했습니다.`, "success");
      finalActionStatus = { message: `전체 PNG 묶음 저장 완료 · ${sequence.length}쪽`, tone: "success" };
      setOutputActionStatus(finalActionStatus.message, finalActionStatus.tone);
    } catch (error) {
      setStatus(error.message || "전체 페이지 PNG를 만들 수 없습니다.", "error");
      finalActionStatus = { message: error.message || "전체 PNG 묶음 생성 실패", tone: "error" };
      setOutputActionStatus(finalActionStatus.message, finalActionStatus.tone);
    } finally {
      setOutputExportBusy(false);
      runPreflight({ announce: false });
      if (finalActionStatus) setOutputActionStatus(finalActionStatus.message, finalActionStatus.tone);
    }
  }

  async function exportPdfProject(options = {}) {
    if (outputExportBusy) return;
    if (typeof RENDERER.exportPagesPdf !== "function") {
      setOutputActionStatus("PDF 생성 모듈을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.", "error");
      return;
    }
    const { working, models } = createOutputSnapshot();
    const check = runPreflight({ working, models, announce: true });
    if (check.fatal) return;
    const { range, sequence } = outputSequenceForRange(working, models, options);
    if (!sequence.length) {
      setOutputActionStatus("PDF로 저장할 출력 페이지가 없습니다.", "warning");
      return;
    }

    let finalActionStatus = null;
    setOutputExportBusy(true);
    try {
      await waitForOutputResources();
      setStatus(`A4 PDF ${sequence.length}쪽을 ${working.spec.dpi}dpi로 준비하고 있습니다…`);
      setOutputActionStatus(`PDF 생성 준비 · 총 ${sequence.length}쪽`);
      const pdf = await RENDERER.exportPagesPdf(sequence, rendererOptions(working, "front", {
        usePrintDerivatives: true,
        showCutLines: false,
        showSafeArea: false,
        jpegQuality: 0.94,
        onProgress: ({ completed, total, side }) => {
          const sideLabel = side === "back" ? "뒷면" : "앞면";
          setStatus(`PDF ${completed}/${total}쪽 렌더링 중 · ${sideLabel}`);
          setOutputActionStatus(`PDF 생성 중 · ${completed}/${total}쪽`);
        },
      }));
      const rangeLabel = range ? `${range.from}-${range.to}` : "all";
      const filename = `${escapeFilename(project.name)}-${rangeLabel}.pdf`;
      downloadBlob(pdf, filename);
      setStatus(`PDF 파일을 저장했습니다 · ${sequence.length}쪽 · ${(pdf.size / 1024 / 1024).toFixed(1)}MB`, "success");
      finalActionStatus = { message: `PDF 저장 완료 · ${sequence.length}쪽`, tone: "success" };
      setOutputActionStatus(finalActionStatus.message, finalActionStatus.tone);
    } catch (error) {
      setStatus(error.message || "PDF 파일을 만들 수 없습니다.", "error");
      finalActionStatus = { message: error.message || "PDF 생성 실패", tone: "error" };
      setOutputActionStatus(finalActionStatus.message, finalActionStatus.tone);
    } finally {
      setOutputExportBusy(false);
      runPreflight({ announce: false });
      if (finalActionStatus) setOutputActionStatus(finalActionStatus.message, finalActionStatus.tone);
    }
  }

  async function saveProjectPackage() {
    if (packageBusy) return;
    if (!PACKAGE?.buildProjectPackage) {
      setElementStatus("labelSheetPackageStatus", "프로젝트 패키지 모듈을 불러오지 못했습니다.", "error");
      return;
    }
    packageBusy = true;
    const button = $("labelSheetSavePackageBtn");
    if (button) button.disabled = true;
    try {
      syncProjectFromControls();
      const serializable = ENGINE.toSerializableProject(project);
      const promptBundle = ENGINE.generatePromptBundle(effectiveProject(), { includeEmptySides: project.spec.duplex.enabled });
      setElementStatus("labelSheetPackageStatus", "프로젝트 데이터와 원본 배경을 ZIP으로 묶고 있습니다…");
      const result = await PACKAGE.buildProjectPackage({
        project: serializable,
        assets: assetStore.list(),
        promptBundle,
      });
      downloadBlob(result.blob, `${escapeFilename(project.name)}-project.zip`);
      setElementStatus("labelSheetPackageStatus", `프로젝트 ZIP 저장 완료 · 데이터 ${project.records.length}건 · 페이지 프롬프트 ${result.manifest.pagePromptCount || 0}개 · 원본 이미지 ${result.manifest.assetCount}개`, "success");
    } catch (error) {
      setElementStatus("labelSheetPackageStatus", error.message || "프로젝트 ZIP을 만들 수 없습니다.", "error");
    } finally {
      packageBusy = false;
      if (button) button.disabled = false;
    }
  }

  async function loadProjectPackage(file) {
    if (!file || packageBusy) return;
    if (!PACKAGE?.parseProjectPackage) {
      setElementStatus("labelSheetPackageStatus", "프로젝트 패키지 모듈을 불러오지 못했습니다.", "error");
      return;
    }
    if (generationRunning) {
      setElementStatus("labelSheetPackageStatus", "배경 생성 큐를 중지한 뒤 프로젝트를 불러와 주세요.", "warning");
      return;
    }
    const shouldReplace = !project.records.length || window.confirm("현재 라벨 데이터와 설정을 선택한 프로젝트로 교체할까요? 현재 배경 보관함의 원본은 그대로 유지됩니다.");
    if (!shouldReplace) return;
    packageBusy = true;
    try {
      setElementStatus("labelSheetPackageStatus", `${file.name} 프로젝트를 읽고 있습니다…`);
      const parsed = await PACKAGE.parseProjectPackage(file);
      const loaded = ENGINE.deserializeProject(parsed.project);
      const assetIdMap = new Map();
      let missingAssets = 0;
      for (const item of parsed.assets || []) {
        if (!item.blob) {
          missingAssets += 1;
          continue;
        }
        const registered = await assetStore.register(item.blob, {
          filename: item.filename,
          source: item.source === "generated" ? "generated" : "upload",
          fit: loaded.settings?.imageFit,
        });
        assetIdMap.set(item.assetId, registered.assetId);
      }
      loaded.records.forEach((record) => {
        ["front", "back"].forEach((sideName) => {
          const side = record[sideName];
          const remapped = assetIdMap.get(side.backgroundAssetId);
          if (remapped) side.backgroundAssetId = remapped;
          const asset = side.backgroundAssetId ? assetStore.get(side.backgroundAssetId) : null;
          if (asset) side.backgroundFile = asset.filename;
          else if (side.backgroundFile) resolveRecordBackground(record, sideName);
        });
      });
      project = loaded;
      selectedRecordIds.clear();
      selectedAssetId = "";
      previewSide = "front";
      currentPageIndex = 0;
      invalidatePromptBundle();
      fillPresetOptions();
      fillVisualStyleOptions();
      setSpecControls(project.spec);
      setSettingsControls();
      setProductControlsLocked(selectedPreset()?.editable === false);
      syncAssetReferences();
      renderAssets();
      renderRecordTable();
      saveProject();
      await refreshOutput();
      const suffix = missingAssets ? ` · 누락 이미지 ${missingAssets}개` : "";
      setElementStatus("labelSheetPackageStatus", `프로젝트 불러오기 완료 · 데이터 ${project.records.length}건 · 원본 이미지 ${assetIdMap.size}개${suffix}`, missingAssets ? "warning" : "success");
      setStatus(`${project.name} 프로젝트를 불러왔습니다.`, "success");
    } catch (error) {
      setElementStatus("labelSheetPackageStatus", error.message || "프로젝트를 불러오지 못했습니다.", "error");
    } finally {
      packageBusy = false;
      if ($("labelSheetLoadPackageInput")) $("labelSheetLoadPackageInput").value = "";
    }
  }

  async function blobBytes(blob) {
    return new Uint8Array(await blob.arrayBuffer());
  }

  async function exportLayerPackage() {
    if (packageBusy || outputExportBusy) return;
    if (typeof window.createZip !== "function") {
      setElementStatus("labelSheetPackageStatus", "ZIP 작성 모듈을 불러오지 못했습니다.", "error");
      return;
    }
    const { working, models } = createOutputSnapshot();
    const check = runPreflight({ working, models, announce: true });
    if (check.fatal) return;
    const sides = working.spec.duplex.enabled ? ["front", "back"] : ["front"];
    const tasks = sides.flatMap((sideName) => models[sideName].flatMap((page, pageIndex) => ["background", "overlay", "merged"].map((layer) => ({ sideName, page, pageIndex, layer }))));
    if (!tasks.length) {
      setElementStatus("labelSheetPackageStatus", "내보낼 라벨 페이지가 없습니다.", "warning");
      return;
    }
    packageBusy = true;
    setOutputExportBusy(true);
    const button = $("labelSheetExportLayersBtn");
    if (button) button.disabled = true;
    try {
      await waitForOutputResources();
      const files = [];
      for (let index = 0; index < tasks.length; index += 1) {
        const task = tasks[index];
        setElementStatus("labelSheetPackageStatus", `페이지·레이어 ${index + 1}/${tasks.length} 생성 중 · ${task.sideName === "front" ? "앞면" : "뒷면"} ${task.pageIndex + 1}쪽 ${task.layer}`);
        const blob = await RENDERER.exportPagePng(task.page, rendererOptions(working, task.sideName, {
          download: false,
          outputLayer: task.layer,
          usePrintDerivatives: true,
          showCutLines: false,
          showSafeArea: false,
        }));
        files.push({ name: `${task.sideName}/page-${String(task.pageIndex + 1).padStart(3, "0")}-${task.layer}.png`, data: await blobBytes(blob) });
      }
      files.push({ name: "project.json", data: new TextEncoder().encode(ENGINE.serializeProject(project, 2)) });
      files.push({ name: "README-KO.txt", data: new TextEncoder().encode("background: 글자 없는 배경\r\noverlay: 투명 문구·QR 레이어\r\nmerged: 최종 합성 확인본\r\n") });
      downloadBlob(window.createZip(files), `${escapeFilename(project.name)}-page-layers.zip`);
      setElementStatus("labelSheetPackageStatus", `페이지·레이어 ZIP 저장 완료 · PNG ${tasks.length}개`, "success");
    } catch (error) {
      setElementStatus("labelSheetPackageStatus", error.message || "페이지·레이어 ZIP을 만들 수 없습니다.", "error");
    } finally {
      packageBusy = false;
      setOutputExportBusy(false);
      if (button) button.disabled = false;
      runPreflight({ announce: false });
    }
  }

  function clearPrintRoot() {
    if (printRoot?.cleanup) printRoot.cleanup();
    printRoot = null;
    $("labelSheetPrintRoot")?.replaceChildren();
  }

  function printSheetCount() {
    try {
      return createOutputSnapshot().models.front.length;
    } catch (_error) {
      return currentPagination?.totalSheets || 0;
    }
  }

  function updatePrintJobControls(totalInput = printSheetCount()) {
    const total = Math.max(0, Math.trunc(Number(totalInput) || 0));
    const stored = normalizePrintJob(project.settings?.printJob);
    const mode = ["all", "current", "range", "resume"].includes(value("labelSheetPrintRangeMode")) ? value("labelSheetPrintRangeMode") : stored.rangeMode;
    const maximum = Math.max(1, total);
    const fromInput = $("labelSheetPrintFrom");
    const toInput = $("labelSheetPrintTo");
    [fromInput, toInput].forEach((input) => {
      if (!input) return;
      input.min = "1";
      input.max = String(maximum);
      input.disabled = mode !== "range";
    });
    let from = clamp(Math.trunc(numberValue("labelSheetPrintFrom", stored.fromSheet)), 1, maximum);
    let to = clamp(Math.trunc(numberValue("labelSheetPrintTo", stored.toSheet || maximum)), 1, maximum);
    if (mode === "all") {
      from = 1;
      to = maximum;
    } else if (mode === "current") {
      from = to = clamp(currentPageIndex + 1, 1, maximum);
    } else if (mode === "resume") {
      from = clamp(stored.lastCompletedSheet + 1, 1, maximum);
      to = maximum;
    }
    if (mode !== "range" || from > to) {
      setControl("labelSheetPrintFrom", Math.min(from, to));
      setControl("labelSheetPrintTo", Math.max(from, to));
    }
    const markButton = $("labelSheetMarkPrintedBtn");
    if (markButton) markButton.disabled = !lastPreparedPrintRange;
    const status = $("labelSheetPrintJobStatus");
    if (!status) return;
    const completed = stored.lastCompletedSheet;
    if (!total) {
      status.textContent = "출력할 페이지가 없습니다.";
      status.dataset.tone = "warning";
      return;
    }
    if (lastPreparedPrintRange) {
      status.textContent = `${lastPreparedPrintRange.from}–${lastPreparedPrintRange.to}페이지 · ${lastPreparedPrintRange.copies}부 인쇄 대화상자 열림 · 실제 출력 후 완료로 기록하세요.`;
      status.dataset.tone = "warning";
      return;
    }
    const modeLabel = ({ all: "전체", current: "현재 페이지", range: "범위", resume: "재개" })[mode];
    status.textContent = `${modeLabel} 출력 대기 · 전체 ${total}페이지${completed ? ` · ${completed}페이지까지 완료 기록` : " · 아직 기록된 재개 지점이 없습니다."}`;
    status.dataset.tone = completed ? "success" : "";
  }

  function resolvePrintRange(totalSheets, overrides = {}) {
    const total = Math.max(0, Math.trunc(Number(totalSheets) || 0));
    if (!total) return null;
    const stored = normalizePrintJob(project.settings?.printJob);
    const mode = ["all", "current", "range", "resume"].includes(overrides.rangeMode)
      ? overrides.rangeMode
      : ["all", "current", "range", "resume"].includes(value("labelSheetPrintRangeMode"))
        ? value("labelSheetPrintRangeMode")
        : stored.rangeMode;
    let from = 1;
    let to = total;
    if (mode === "current") from = to = clamp(currentPageIndex + 1, 1, total);
    if (mode === "range") {
      from = clamp(Math.trunc(Number(overrides.fromSheet ?? numberValue("labelSheetPrintFrom", stored.fromSheet))), 1, total);
      to = clamp(Math.trunc(Number(overrides.toSheet ?? numberValue("labelSheetPrintTo", stored.toSheet))), 1, total);
      if (from > to) throw new Error("출력 시작 페이지는 끝 페이지보다 클 수 없습니다.");
    }
    if (mode === "resume") {
      from = stored.lastCompletedSheet + 1;
      if (from > total) return { empty: true, mode, from, to: total, copies: 1 };
    }
    const copies = Math.min(50, Math.max(1, Math.trunc(Number(overrides.copies ?? numberValue("labelSheetPrintCopies", stored.copies)) || 1)));
    return { empty: false, mode, from, to, copies };
  }

  function repeatPrintPages(pages, copies) {
    const output = [];
    for (let copyIndex = 0; copyIndex < copies; copyIndex += 1) {
      pages.forEach((page) => output.push({ ...page, copyIndex }));
    }
    return output;
  }

  function rememberPreparedPrint(range) {
    lastPreparedPrintRange = { from: range.from, to: range.to, copies: range.copies };
    updatePrintJobControls();
  }

  function capturePrintJobControls() {
    project.settings = project.settings || {};
    project.settings.printJob = normalizePrintJob({
      ...(project.settings.printJob || {}),
      rangeMode: value("labelSheetPrintRangeMode"),
      fromSheet: numberValue("labelSheetPrintFrom", 1),
      toSheet: numberValue("labelSheetPrintTo", 1),
      copies: numberValue("labelSheetPrintCopies", 1),
    });
    lastPreparedPrintRange = null;
    updatePrintJobControls();
    queueSave();
  }

  function useResumePoint() {
    setControl("labelSheetPrintRangeMode", "resume");
    capturePrintJobControls();
    const job = normalizePrintJob(project.settings.printJob);
    setElementStatus("labelSheetPrintJobStatus", job.lastCompletedSheet ? `${job.lastCompletedSheet + 1}페이지부터 재개하도록 설정했습니다.` : "완료 기록이 없어 1페이지부터 출력합니다.", "success");
  }

  function markPrintCompleted() {
    if (!lastPreparedPrintRange) {
      setElementStatus("labelSheetPrintJobStatus", "먼저 인쇄 대화상자를 열고 실제 출력이 끝난 뒤 기록해 주세요.", "warning");
      return;
    }
    const job = normalizePrintJob(project.settings?.printJob);
    job.lastCompletedSheet = Math.max(job.lastCompletedSheet, lastPreparedPrintRange.to);
    project.settings.printJob = job;
    const completed = { ...lastPreparedPrintRange };
    lastPreparedPrintRange = null;
    queueSave();
    updatePrintJobControls();
    setElementStatus("labelSheetPrintJobStatus", `${completed.to}페이지까지 출력 완료로 기록했습니다. 다음 재개 지점은 ${completed.to + 1}페이지입니다.`, "success");
  }

  async function prepareAndPrint(sequence, working, statusMessage, renderOptions = {}) {
    clearPrintRoot();
    setStatus(`${statusMessage} 인쇄 문서를 준비하고 있습니다…`);
    setOutputActionStatus(`${statusMessage} 인쇄 문서 준비 중…`);
    printRoot = await RENDERER.createPrintRoot(sequence, rendererOptions(working, "front", {
      mount: $("labelSheetPrintRoot"),
      usePrintDerivatives: true,
      showSafeArea: false,
      ...renderOptions,
      onProgress: ({ completed, total }) => {
        setStatus(`${statusMessage} 인쇄 문서 ${completed}/${total}쪽 준비 중…`);
        setOutputActionStatus(`인쇄 문서 준비 중 · ${completed}/${total}쪽`);
      },
    }));
    const preparedRoot = printRoot;
    window.addEventListener("afterprint", () => {
      preparedRoot.cleanup?.();
      if (printRoot === preparedRoot) printRoot = null;
    }, { once: true });
    await RENDERER.print(preparedRoot, { mount: $("labelSheetPrintRoot") });
    setStatus(`${statusMessage} 인쇄 대화상자를 열었습니다. 배율 100%와 여백 없음을 확인해 주세요.`, "success");
  }

  async function printProject(options = {}) {
    if (outputExportBusy) return;
    let snapshot;
    let range;
    try {
      snapshot = createOutputSnapshot();
      const check = runPreflight({ ...snapshot, announce: true });
      if (check.fatal) return;
      range = manualPrintPhase === "back" && manualPrintRange ? manualPrintRange : resolvePrintRange(snapshot.models.front.length, options);
    } catch (error) {
      setStatus(error.message || "인쇄 범위와 설정을 확인해 주세요.", "error");
      setOutputActionStatus(error.message || "인쇄 준비 실패", "error");
      return;
    }
    const { working, models } = snapshot;
    if (!range || range.empty) {
      setElementStatus("labelSheetPrintJobStatus", "기록된 마지막 페이지 이후에 출력할 페이지가 없습니다. 범위를 바꾸거나 완료 기록을 확인해 주세요.", "warning");
      return;
    }
    const frontPages = models.front.slice(range.from - 1, range.to);
    const backPages = models.back.slice(range.from - 1, range.to);
    lastPreparedPrintRange = null;
    updatePrintJobControls(models.front.length);
    let finalActionStatus = null;
    setOutputExportBusy(true);
    try {
      await waitForOutputResources();
      if (!working.spec.duplex.enabled) {
        await prepareAndPrint(repeatPrintPages(frontPages, range.copies), working, `단면 ${range.from}–${range.to}페이지 · ${range.copies}부`);
        rememberPreparedPrint(range);
        finalActionStatus = { message: `단면 인쇄창 열림 · ${range.from}–${range.to}페이지 · ${range.copies}부`, tone: "success" };
        return;
      }
      if (value("labelSheetFlipEdge") === "manual") {
        const sideName = manualPrintPhase;
        if (sideName === "front") manualPrintRange = range;
        const selectedPages = sideName === "front" ? frontPages : backPages;
        await prepareAndPrint(repeatPrintPages(selectedPages, range.copies), working, sideName === "front" ? `수동 양면 1단계 · 앞면 ${range.from}–${range.to}페이지 · ${range.copies}부` : `수동 양면 2단계 · 뒷면 ${range.from}–${range.to}페이지 · ${range.copies}부`);
        manualPrintPhase = sideName === "front" ? "back" : "front";
        if ($("labelSheetPrintBtn")) $("labelSheetPrintBtn").textContent = manualPrintPhase === "back" ? "뒷면 인쇄" : "인쇄창 열기";
        if (manualPrintPhase === "back") {
          setStatus("앞면 출력 후 용지를 프린터 지침에 맞게 다시 넣고 ‘뒷면 인쇄’를 누르세요.", "warning");
          finalActionStatus = { message: "수동 양면 앞면 완료 · 용지를 다시 넣고 뒷면 인쇄", tone: "warning" };
        } else {
          rememberPreparedPrint(range);
          manualPrintRange = null;
          finalActionStatus = { message: `수동 양면 인쇄창 열림 · ${range.from}–${range.to}페이지`, tone: "success" };
        }
        return;
      }
      const sequence = RENDERER.buildPrintSequence(frontPages, backPages, "auto-duplex");
      await prepareAndPrint(repeatPrintPages(sequence, range.copies), working, `자동 양면 ${range.from}–${range.to}페이지 · ${range.copies}부`);
      rememberPreparedPrint(range);
      finalActionStatus = { message: `자동 양면 인쇄창 열림 · ${range.from}–${range.to}페이지 · ${range.copies}부`, tone: "success" };
    } catch (error) {
      clearPrintRoot();
      setStatus(error.message || "인쇄 문서를 만들 수 없습니다.", "error");
      finalActionStatus = { message: error.message || "인쇄 준비 실패", tone: "error" };
    } finally {
      setOutputExportBusy(false);
      runPreflight({ announce: false });
      if (finalActionStatus) setOutputActionStatus(finalActionStatus.message, finalActionStatus.tone);
    }
  }

  async function printCurrentPage() {
    await printProject({ rangeMode: "current" });
  }

  async function makeCalibrationSheet() {
    if (outputExportBusy) return;
    syncProjectFromControls();
    const capacity = project.spec.grid.rows * project.spec.grid.columns;
    const records = Array.from({ length: capacity }, (_, index) => ENGINE.normalizeRecord({
      id: `CAL-${index + 1}`,
      number: `A${index + 1}`,
      front_title: "앞면 교정",
      front_body: `칸 A${index + 1} · 위쪽 ↑`,
      back_title: "뒷면 교정",
      back_body: `칸 A${index + 1} · 위쪽 ↑`,
      back_enabled: true,
    }, index));
    const calibration = effectiveProject(ENGINE.normalizeProject({
      ...project,
      name: "양면 교정 시트",
      spec: {
        ...project.spec,
        firstSheetStartSlot: 0,
        firstSheetSkippedSlots: [],
        duplex: { ...project.spec.duplex, enabled: true },
      },
      records,
    }), { sync: false });
    calibration.spec.duplex.enabled = true;
    calibration.spec.firstSheetStartSlot = 0;
    calibration.spec.firstSheetSkippedSlots = [];
    calibration.records.forEach((record, index) => {
      const slotLabel = `A${index + 1}`;
      record.number = slotLabel;
      record.style = {
        ...record.style,
        align: "center",
        verticalAlign: "center",
        fontScalePercent: 100,
        rotation: 0,
        color: "#111827",
        overlayOpacity: 0,
        backgroundColor: "#ffffff",
        accentColor: "#2563eb",
        accentEdge: "top",
        accentWidthMm: 0.8,
        borderColor: "#111827",
        borderWidthMm: 0.3,
        qr: { ...(record.style?.qr || {}), enabled: false },
      };
      record.front.enabled = true;
      record.front.title = "앞면 교정";
      record.front.body = `칸 ${slotLabel} · 위쪽 ↑`;
      record.front.number = slotLabel;
      record.front.qrEnabled = false;
      record.front.qrValue = "";
      record.front.backgroundAssetId = "";
      record.front.backgroundFile = "";
      record.front.backgroundColor = "#ffffff";
      record.front.style = { accentColor: "#2563eb", borderColor: "#1d4ed8" };
      record.back.enabled = true;
      record.back.title = "뒷면 교정";
      record.back.body = `칸 ${slotLabel} · 위쪽 ↑`;
      record.back.number = slotLabel;
      record.back.qrEnabled = false;
      record.back.qrValue = "";
      record.back.backgroundAssetId = "";
      record.back.backgroundFile = "";
      record.back.backgroundColor = "#ffffff";
      record.back.style = { accentColor: "#dc2626", borderColor: "#b91c1c" };
    });
    const models = createPageModels(calibration);
    const sequence = RENDERER.buildPrintSequence(models.front.slice(0, 1), models.back.slice(0, 1), "auto-duplex");
    let finalActionStatus = null;
    setOutputExportBusy(true);
    try {
      await waitForOutputResources();
      await prepareAndPrint(sequence, calibration, "양면 교정", {
        labelBackground: "#ffffff",
        pageBackground: "#ffffff",
        showCutLines: true,
        showSafeArea: true,
        cutLineColor: "rgba(17, 24, 39, 0.78)",
        safeAreaColor: "rgba(220, 38, 38, 0.64)",
      });
      finalActionStatus = { message: "양면 교정 시트 인쇄창 열림 · 앞면 1쪽 + 뒷면 1쪽", tone: "success" };
    } catch (error) {
      clearPrintRoot();
      setStatus(error.message || "양면 교정 시트를 만들 수 없습니다.", "error");
      finalActionStatus = { message: error.message || "양면 교정 시트 생성 실패", tone: "error" };
    } finally {
      setOutputExportBusy(false);
      runPreflight({ announce: false });
      if (finalActionStatus) setOutputActionStatus(finalActionStatus.message, finalActionStatus.tone);
    }
  }

  function uniqueBackgroundPrompt(sideName, working, index, total) {
    const userDirection = cleanText(working.settings.backgroundPrompt) || "절제된 공공행사 티켓 배경, 충분한 문구 여백, 인쇄 친화적 색 대비";
    const styleDirection = resolveVisualDesign(working.settings).stylePrompt;
    return [
      "[RASTER BACKGROUND ONLY]",
      `Create one print-ready raster background for a ${sideName === "front" ? "front" : "back"} label face.`,
      `Exact trim size: ${working.spec.grid.labelWidthMm} mm × ${working.spec.grid.labelHeightMm} mm.`,
      `[UNIQUE VARIATION ${index + 1} OF ${total}]`,
      userDirection,
      styleDirection,
      "Create a visually distinct variation while keeping the whole batch stylistically coherent.",
      "Raster image only. Absolutely no text, letters, numerals, QR codes, barcodes, readable symbols, watermarks, or logos.",
      "No record identifier or personal data is included. Preserve generous quiet space for the separately composited label copy.",
    ].join("\n");
  }

  function updateGenerationQueueUi(snapshot) {
    const jobs = snapshot?.jobs || [];
    const done = jobs.filter((job) => job.status === "done").length;
    const failed = jobs.filter((job) => job.status === "failed").length;
    const running = jobs.find((job) => job.status === "running");
    const active = ["running", "paused"].includes(snapshot?.status);
    const pauseButton = $("labelSheetGenerationPauseBtn");
    const stopButton = $("labelSheetGenerationStopBtn");
    const generateButton = $("labelSheetGenerateMissingBtn");
    if (pauseButton) {
      pauseButton.hidden = !active;
      pauseButton.disabled = !active;
      pauseButton.textContent = snapshot?.status === "paused" ? "계속" : "일시정지";
    }
    if (stopButton) {
      stopButton.hidden = !active;
      stopButton.disabled = !active;
    }
    if (generateButton) generateButton.disabled = active;
    const message = snapshot?.status === "paused"
      ? `생성 일시정지 · 완료 ${done}/${jobs.length}${failed ? ` · 실패 ${failed}` : ""}`
      : active
        ? `고유 배경 ${done + failed + 1}/${jobs.length} 생성 중${running ? ` · ${running.recordId} ${running.side === "front" ? "앞면" : "뒷면"}` : ""}`
        : jobs.length
          ? `생성 큐 완료 ${done}건${failed ? ` · 실패 ${failed}건` : ""}`
          : "생성 결과는 보관함에 등록한 뒤 크기 검사와 배정을 거칩니다.";
    setElementStatus("labelSheetGenerationStatus", message, failed ? "warning" : snapshot?.status === "done" ? "success" : "");
  }

  function finishGenerationQueue(snapshot) {
    const jobs = snapshot?.jobs || [];
    const completed = jobs.filter((job) => job.status === "done").length;
    const failed = jobs.filter((job) => job.status === "failed").length;
    generationRunning = false;
    generationContext = null;
    updateGenerationQueueUi(snapshot);
    renderAssets();
    renderRecordTable();
    if (completed) onProjectControlsChanged("생성된 배경을 보관함과 라벨에 연결했습니다.", { rerenderTable: false });
    else scheduleRefresh();
    setAssetStatus(`고유 배경 생성 완료 ${completed}건${failed ? ` · 실패 ${failed}건` : ""}`, failed ? "warning" : completed ? "success" : "warning");
  }

  async function runBackgroundGenerationJob(job) {
    const context = generationContext;
    if (!context) throw new Error("배경 생성 작업 정보가 만료되었습니다.");
    const expectedTarget = project.records[job.recordIndex];
    if (!expectedTarget || expectedTarget.id !== job.recordId) throw new Error("라벨 목록이 변경되어 이 생성 작업을 시작하지 않았습니다.");
    const result = await context.client.generateImage({
      slideId: `label-background-${Date.now()}-${job.queueIndex + 1}`,
      title: `라벨 배경 ${job.queueIndex + 1}`,
      prompt: uniqueBackgroundPrompt(job.side, context.working, job.queueIndex, context.total),
      ratio: `${rounded(context.working.spec.grid.labelWidthMm)}:${rounded(context.working.spec.grid.labelHeightMm)}`,
    });
    const asset = await assetStore.registerGeneratedUrl(result.url, {
      filename: result.filename || `generated-label-background-${job.queueIndex + 1}-${job.side}.png`,
      source: "generated",
      fit: printFitValue(),
    });
    await assetStore.process(asset.assetId, {
      widthMm: context.working.spec.grid.labelWidthMm,
      heightMm: context.working.spec.grid.labelHeightMm,
      dpi: context.working.spec.dpi,
      bleedMm: context.working.settings.bleedMm || 0,
      fit: printFitValue(),
      focalPoint: context.working.settings.focalPoint,
      allowUpscale: Boolean(context.working.settings.allowUpscale),
    });
    const target = project.records[job.recordIndex];
    if (!target || target.id !== job.recordId) {
      job.assignmentSkipped = true;
      setAssetStatus(`${asset.filename} 생성 완료 · 목록이 변경되어 보관함에만 저장했습니다.`, "warning");
    } else {
      assignRecordAsset(target, job.side, asset.assetId);
    }
    selectedAssetId = asset.assetId;
    return { url: result.url, filename: asset.filename };
  }

  async function generateMissingBackgrounds() {
    if (generationRunning) return;
    if (isStaticMode()) {
      setAssetStatus("정적 배포판에서는 이미지 업로드·축소·인쇄만 사용할 수 있습니다. AI 생성은 로컬 서버판에서 지원합니다.", "warning");
      return;
    }
    const client = window.PromptDeckImageGenerationClient;
    const queueFactory = window.PromptDeckGenerationQueue;
    if (!client?.generateImage || !queueFactory?.createGenerationQueue) {
      setAssetStatus("이미지 생성 서버 연결 모듈을 찾지 못했습니다. 일반 이미지는 계속 업로드할 수 있습니다.", "error");
      return;
    }
    const working = effectiveProject();
    const preflight = runPreflight({ working, announce: true });
    if (preflight.fatal) {
      setAssetStatus("규격 오류, 중복 ID 또는 끊어진 배경 연결을 해결한 뒤 AI 배경을 생성해 주세요.", "error");
      return;
    }
    const bundle = ENGINE.generatePromptBundle(working, { includeEmptySides: working.spec.duplex.enabled });
    const jobs = bundle.entries.map((entry) => ({
      ...entry,
      recordIndex: working.records.findIndex((item) => item.id === entry.recordId),
    })).filter((entry) => entry.recordIndex >= 0 && !cleanText(working.records[entry.recordIndex]?.[entry.side]?.backgroundAssetId));
    if (!jobs.length) {
      setAssetStatus("배경이 없는 라벨 면이 없습니다.", "success");
      return;
    }
    if (!window.confirm(`배경이 없는 ${jobs.length}개 면을 외부 AI 이미지 서비스로 순차 생성할까요? 문구와 개인정보는 배경 프롬프트에서 제외되며, 서비스 사용량이 발생할 수 있습니다.`)) return;

    try {
      await client.checkImageGenerationServer?.();
      generationContext = { client, working, total: jobs.length };
      generationQueue = queueFactory.createGenerationQueue({
        worker: runBackgroundGenerationJob,
        onUpdate: updateGenerationQueueUi,
        onDone: finishGenerationQueue,
      });
      generationQueue.setJobs(jobs);
      generationRunning = true;
      setAssetStatus(`고유 배경 ${jobs.length}건을 생성 큐에 등록했습니다.`);
      await generationQueue.run({
        delayMs: Math.max(0, numberValue("labelSheetGenerationDelay", GENERATION_DELAY_MS / 1000) * 1000),
        maxRetries: Math.min(3, Math.max(0, Math.trunc(numberValue("labelSheetGenerationRetries", 1)))),
      });
    } catch (error) {
      generationRunning = false;
      generationContext = null;
      generationQueue = null;
      updateGenerationQueueUi({ status: "idle", jobs: [] });
      const message = error.message || "이미지 생성 서버에 연결할 수 없습니다.";
      setAssetStatus(message, "error");
      setElementStatus("labelSheetGenerationStatus", message, "error");
    }
  }

  function movePreviewPage(delta) {
    const pageCount = currentPages[previewSide]?.length || 0;
    currentPageIndex = clamp(currentPageIndex + Number(delta || 0), 0, Math.max(0, pageCount - 1));
    wysiwygPlacementIndex = 0;
    syncPromptPageToPreview();
    scheduleRefresh();
  }

  function selectPreviewSide(sideName) {
    if (sideName === "back" && !project.spec.duplex.enabled) {
      setStatus("뒷면 미리보기는 양면 출력을 선택하면 사용할 수 있습니다.", "warning");
      return;
    }
    previewSide = sideName === "back" ? "back" : "front";
    currentPageIndex = 0;
    wysiwygPlacementIndex = 0;
    ["front", "back"].forEach((side) => {
      const active = side === previewSide;
      [
        $(`labelSheetPreview${side === "front" ? "Front" : "Back"}Btn`),
        $(`labelSheetFocus${side === "front" ? "Front" : "Back"}Btn`),
      ].filter(Boolean).forEach((button) => {
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    });
    syncPromptPageToPreview();
    window.clearTimeout(renderTimer);
    void refreshOutput().catch((error) => {
      setStatus(error.message || "선택한 면의 미리보기를 만들 수 없습니다.", "error");
    });
  }

  function applyDocumentTypeDefaults() {
    const type = syncIntentDocumentType(value("labelSheetDocumentType"));
    project.settings.documentType = type;
    updateIntentSummary();
    onProjectControlsChanged(`${DOCUMENT_TYPE_LABELS[type]} 항목을 선택했습니다. 예시 채우기를 누르면 해당 항목의 샘플 데이터가 입력됩니다.`);
  }

  function sampleProfile(typeInput, presetInput = "") {
    const type = Object.prototype.hasOwnProperty.call(DOCUMENT_TYPE_LABELS, typeInput) ? typeInput : "label";
    const profiles = {
      label: {
        presetId: "training-material", sequenceMode: "none", prefix: "", padding: 0, duplex: false, qr: false, qrCoverage: "none", idPrefix: "DEMO-LABEL",
        frontTitle: "배터리 교재", frontSubtitle: "샘플교육센터", frontBody: "과정명 · 교재 구분", frontFooter: "교육운영팀",
        backTitle: "", backSubtitle: "", backBody: "", backFooter: "",
        backgroundPrompt: "샘플교육센터 교육 교재 분류 라벨, 밝은 아이보리 바탕과 배터리 블루 포인트, 단정한 정보 영역, 글자·숫자·로고·QR 없음",
        frontAsset: "기본-배터리-아이스블루.webp", backAsset: "기본-배터리-아이스블루.webp",
        people: [["전극 공정", "기초 교재"], ["셀 조립", "실습 교재"], ["배터리 소재", "참고 자료"], ["품질·안전", "점검표"], ["BMS 이해", "심화 교재"], ["재사용·재활용", "사례집"], ["공정 데이터", "실습 자료"], ["교육 운영", "행정 자료"]],
      },
      ticket: {
        presetId: "program-voucher", sequenceMode: "sequence", prefix: "TICKET-", padding: 3, duplex: false, qr: false, qrCoverage: "none", idPrefix: "DEMO-TICKET",
        frontTitle: "교육 프로그램 교환권", frontSubtitle: "샘플교육센터", frontBody: "현장 체험 프로그램 1회 이용", frontFooter: "행사 당일 사용",
        backTitle: "이용 안내", backSubtitle: "운영 부스에서 제시해 주세요", backBody: "1인 1매 사용 · 현금 교환 불가", backFooter: "교육운영팀",
        backgroundPrompt: "배터리 교육 행사 교환권, 밝은 뉴트럴 배경과 청록 포인트, 티켓다운 리듬과 충분한 문구 여백, 글자·숫자·로고·QR 없음",
        frontAsset: "기본-배터리-에코그린.webp", backAsset: "기본-배터리-아이스블루.webp",
        people: [["전시 체험", "A코스"], ["공정 실습", "B코스"], ["소재 분석", "C코스"], ["안전 교육", "D코스"], ["전시 체험", "A코스"], ["공정 실습", "B코스"], ["소재 분석", "C코스"], ["안전 교육", "D코스"]],
      },
      admission: {
        presetId: "networking-pass", sequenceMode: "sequence", prefix: "PASS-", padding: 3, duplex: true, qr: true, qrCoverage: "all", idPrefix: "DEMO-PASS",
        frontTitle: "샘플교육센터 행사 출입표", frontSubtitle: "이차전지 전문인력 네트워킹 데이", frontBody: "이름 · 소속", frontFooter: "2026 교육 성과공유회",
        backTitle: "출입 안내", backSubtitle: "입장 시 QR을 제시해 주세요", backBody: "본인만 사용 가능 · 재입장 시 출입표 확인", backFooter: "행사 운영본부",
        backgroundPrompt: "샘플교육센터 행사 출입표, 신뢰감 있는 네이비와 에너지 블루, 인물 정보와 QR 합성 공간을 넉넉히 비운 배경, 글자·숫자·로고·QR 없음",
        frontAsset: "기본-배터리-인디고데이터.webp", backAsset: "기본-배터리-네이비.webp",
        people: [["김배움", "샘플혁신지원센터"], ["이채움", "배터리 기업 A"], ["박에너지", "연구기관 B"], ["최미래", "대학 C"], ["정하늘", "배터리 기업 D"], ["강새롬", "교육기관 E"], ["윤다온", "연구기관 F"], ["한가람", "대학 G"]],
      },
      "meal-ticket": {
        presetId: "training-lunch", sequenceMode: "none", prefix: "", padding: 0, duplex: true, qr: true, qrCoverage: "alternating", idPrefix: "DEMO-MEAL",
        frontTitle: "샘플교육센터 교육생 식권", frontSubtitle: "이차전지 전문인력 양성과정", frontBody: "중식 1회 · 교육 당일 사용", frontFooter: "배부처 · 샘플교육센터 교육운영팀",
        backTitle: "식권 이용 안내", backSubtitle: "교육생 본인만 사용할 수 있습니다", backBody: "지정된 교육일과 식사 시간에 1회 사용해 주세요. 타인에게 양도하거나 현금으로 교환할 수 없습니다.", backFooter: "문의 · 교육운영팀",
        backgroundPrompt: "샘플교육센터 교육생 식권, 밝은 아이보리 바탕과 배터리 블루·앰버 포인트, 편안하고 전문적인 교육 분위기, 문구 영역을 충분히 비우기, 글자·숫자·로고·QR 없음",
        frontAsset: "기본-교육생식권-앰버.webp", backAsset: "기본-배터리-네이비.webp",
        people: [["김배움", "배터리 기초"], ["이채움", "셀 제조 공정"], ["박에너지", "배터리 소재"], ["최미래", "품질·안전"], ["정하늘", "배터리 기초"], ["강새롬", "셀 제조 공정"], ["윤다온", "배터리 소재"], ["한가람", "품질·안전"]],
      },
    };
    const variants = {
      "lab-sample": {
        sequenceMode: "sequence", prefix: "CELL-", padding: 3, qr: true, qrCoverage: "alternating", idPrefix: "DEMO-CELL",
        frontTitle: "배터리 실험 시료 라벨", frontSubtitle: "셀 평가실 · 추적 관리", frontBody: "시료명 · 시험 조건", frontFooter: "취급주의 · 담당자 확인",
        backgroundPrompt: "배터리 실험 시료 추적 라벨, 깨끗한 화이트와 코발트 블루, 작은 시료 용기에서도 읽기 쉬운 고대비 정보 구조, QR 합성 공간을 일부 라벨에 확보",
        people: [["NCM811 파우치셀", "25℃ 기준"], ["LFP 각형셀", "급속충전"], ["실리콘 음극", "수명평가"], ["고체전해질", "임피던스"], ["재사용 모듈", "용량선별"], ["분리막 시편", "열수축"], ["양극 슬러리", "점도측정"], ["BMS 보드", "기능검사"]],
      },
      "archive-box": {
        sequenceMode: "none", prefix: "", padding: 0, qr: false, qrCoverage: "none", idPrefix: "DEMO-ARCHIVE",
        frontTitle: "교육 운영 문서 보관 라벨", frontSubtitle: "샘플교육센터 기록물", frontBody: "문서 분류 · 보존 기간 · 담당 부서", frontFooter: "무단 반출 금지",
        backgroundPrompt: "공공 교육기관 문서 보관 라벨, 차분한 웜그레이와 네이비, 긴 문서 분류명이 두 줄에서도 선명하게 읽히는 기록관리 디자인",
        frontAsset: "기본-배터리-네이비.webp",
        people: [["교육생 출결 및 수료관리", "5년 보존"], ["이차전지 실습장 안전점검", "10년 보존"], ["강사 계약 및 강의자료", "5년 보존"], ["교육과정 개발 자문회의", "영구 보존"], ["기업 재직자 교육 신청서", "3년 보존"], ["장비 유지보수 이력", "10년 보존"], ["성과공유회 운영 결과", "5년 보존"], ["개인정보 파기 확인서", "법정기간"]],
      },
      "consultation-order": {
        sequenceMode: "sequence", prefix: "WAIT-", padding: 2, qr: false, qrCoverage: "none", idPrefix: "DEMO-WAIT",
        frontTitle: "현장 상담 순번표", frontSubtitle: "배터리 기업지원 상담부스", frontBody: "상담 분야 · 호출 순서", frontFooter: "번호가 호출되면 상담석으로 와 주세요",
        backgroundPrompt: "현장 상담 대기표, 큰 순번이 즉시 보이는 블루 포인트, 혼잡한 행사장에서 빠르게 읽히는 단순하고 친절한 티켓 디자인",
        people: [["기술개발", "1번 상담석"], ["시험평가", "2번 상담석"], ["사업화", "3번 상담석"], ["인력양성", "4번 상담석"], ["기술개발", "1번 상담석"], ["시험평가", "2번 상담석"], ["사업화", "3번 상담석"], ["인력양성", "4번 상담석"]],
      },
      "parking-pass": {
        sequenceMode: "sequence", prefix: "PARK-", padding: 3, qr: true, qrCoverage: "all", idPrefix: "DEMO-PARK",
        frontTitle: "교육 행사 방문 주차권", frontSubtitle: "샘플교육센터", frontBody: "차량번호 · 방문 구역", frontFooter: "출차 전 안내데스크에서 확인",
        backgroundPrompt: "교육 행사 주차권, 밝은 회색과 안전 오렌지 포인트, 차량번호와 QR 합성 영역이 명확한 가로형 티켓 디자인",
        frontAsset: "기본-교육생식권-앰버.webp",
        people: [["12가 3456", "교육동"], ["34나 5678", "실습동"], ["56다 7890", "행사장"], ["78라 9012", "VIP 구역"], ["23마 4567", "교육동"], ["45바 6789", "실습동"], ["67사 8901", "행사장"], ["89아 0123", "운영차량"]],
      },
      "seminar-seat": {
        sequenceMode: "sequence", prefix: "SEAT-", padding: 3, qr: true, qrCoverage: "all", idPrefix: "DEMO-SEAT",
        frontTitle: "배터리 기술 세미나 좌석 출입표", frontSubtitle: "차세대 전지 기술 세션", frontBody: "참석자 · 지정 좌석", frontFooter: "세션 시작 10분 전 입장",
        backTitle: "세미나 안내", backSubtitle: "지정 좌석을 확인해 주세요", backBody: "세션 중 이동과 촬영은 운영요원의 안내를 따라 주세요.", backFooter: "세미나 운영본부",
        people: [["김배움", "A-01"], ["이채움", "A-02"], ["박에너지", "A-03"], ["최미래", "A-04"], ["정하늘", "B-01"], ["강새롬", "B-02"], ["윤다온", "B-03"], ["한가람", "B-04"]],
      },
      "staff-pass": {
        sequenceMode: "none", prefix: "", padding: 0, qr: true, qrCoverage: "alternating", idPrefix: "DEMO-STAFF",
        frontTitle: "행사 운영 스태프 패스", frontSubtitle: "샘플교육센터", frontBody: "이름 · 담당 역할", frontFooter: "AUTHORIZED STAFF",
        backTitle: "출입 권한", backSubtitle: "운영 구역별 권한을 확인해 주세요", backBody: "분실 시 즉시 운영본부에 신고해 주세요.", backFooter: "행사 운영본부",
        backgroundPrompt: "행사 스태프 패스, 역할을 멀리서 구분하는 선명한 인디고와 민트 포인트, 일부 QR과 QR 없는 전체폭 레이아웃을 함께 지원",
        people: [["김운영", "총괄·전 구역"], ["이안내", "등록데스크"], ["박기술", "무대·음향"], ["최안전", "안전관리"], ["정진행", "세션 운영"], ["강촬영", "공식 기록"], ["윤의전", "VIP 안내"], ["한지원", "현장 지원"]],
      },
      "daily-meals": {
        sequenceMode: "sequence", prefix: "MEAL-", padding: 3, qr: true, qrCoverage: "all", idPrefix: "DEMO-DAILY-MEAL",
        frontTitle: "샘플교육센터 교육생 식권", frontSubtitle: "3일 집중 교육과정", frontBody: "식사 구분 · 지정일 1회 사용", frontFooter: "식당 입구에서 QR 확인",
        backgroundPrompt: "배터리 교육과정 조식 중식 석식 식권, 식사 시간대를 색상으로 명확히 구분하는 밝고 전문적인 티켓 디자인, QR 합성 공간 포함",
        people: [["1일차 조식", "07:30~08:30"], ["1일차 중식", "12:00~13:00"], ["1일차 석식", "18:00~19:00"], ["2일차 조식", "07:30~08:30"], ["2일차 중식", "12:00~13:00"], ["2일차 석식", "18:00~19:00"], ["3일차 조식", "07:30~08:30"], ["3일차 중식", "12:00~13:00"]],
      },
      "dietary-meal": {
        sequenceMode: "none", prefix: "", padding: 0, qr: false, qrCoverage: "none", idPrefix: "DEMO-DIET",
        frontTitle: "교육생 맞춤 식단 식권", frontSubtitle: "알레르기·식이 제한 확인", frontBody: "대상자 · 식단 구분", frontFooter: "배식 전 조리 담당자에게 제시",
        backTitle: "식단 확인 안내", backSubtitle: "등록된 식이 제한 정보 기준", backBody: "교차오염 가능성이 있으므로 현장 조리 담당자와 한 번 더 확인해 주세요.", backFooter: "교육운영팀 · 식당 운영팀",
        backgroundPrompt: "맞춤 식단 식권, 알레르기 정보를 오해 없이 읽는 고대비 아이보리와 안전색 포인트, QR 없이 문구가 전체 폭을 사용하는 디자인",
        people: [["김배움", "견과류 제외"], ["이채움", "유제품 제외"], ["박에너지", "글루텐 프리"], ["최미래", "채식 식단"], ["정하늘", "갑각류 제외"], ["강새롬", "저염 식단"], ["윤다온", "돼지고기 제외"], ["한가람", "일반 식단"]],
      },
    };
    const catalog = SAMPLE_PRESET_CATALOG[type];
    const presetId = catalog.some((item) => item.id === presetInput) ? presetInput : profiles[type].presetId;
    const presetMeta = catalog.find((item) => item.id === presetId) || catalog[0];
    return { type, ...profiles[type], ...(variants[presetId] || {}), presetId, presetLabel: presetMeta.label };
  }

  function fillSample(typeInput) {
    const selectedType = typeof typeInput === "string"
      ? typeInput
      : selectedRadioValue("labelSheetIntentDocumentType", value("labelSheetDocumentType") || "label");
    const profile = sampleProfile(selectedType, value("labelSheetSamplePreset"));
    const goal = normalizeOutputGoal(selectedRadioValue("labelSheetOutputGoal", project.settings?.outputGoal));
    const requestedDuplex = checked("labelSheetModeDuplex");
    const preset = PRESETS.get("generic-a4-2x4-portrait");
    applyPreset(preset, { silent: true });
    setControl("labelSheetSequenceMode", profile.sequenceMode);
    setControl("labelSheetRecordCount", 8);
    setControl("labelSheetStartNumber", 1);
    setControl("labelSheetEndNumber", 8);
    setControl("labelSheetPrefix", profile.prefix);
    setControl("labelSheetSuffix", "");
    setControl("labelSheetPadding", profile.padding);
    updateSequenceControlState();
    setControl("labelSheetFirstSlot", 1);
    setControl("labelSheetFrontTitle", "{{제목}}");
    setControl("labelSheetFrontSubtitle", "{{부제}}");
    setControl("labelSheetFrontBody", ["admission", "label"].includes(profile.type) ? "{{이름}} · {{구분}}" : "{{이름}} · {{구분}}\n{{본문}}");
    setControl("labelSheetFrontFooter", "{{하단}}");
    setControl("labelSheetBackTitle", "{{제목}}");
    setControl("labelSheetBackSubtitle", "{{부제}}");
    setControl("labelSheetBackBody", "{{본문}}");
    setControl("labelSheetBackFooter", "{{하단}}");
    const sampleVisibility = defaultOutputVisibility();
    OUTPUT_FIELD_KEYS.forEach((fieldName) => {
      const profileKey = `back${fieldName.slice(0, 1).toUpperCase()}${fieldName.slice(1)}`;
      sampleVisibility.back[fieldName] = Boolean(cleanText(profile[profileKey]));
    });
    ["front", "back"].forEach((sideName) => OUTPUT_FIELD_KEYS.forEach((fieldName) => {
      const control = $(outputVisibilityControlId(sideName, fieldName));
      if (control) control.checked = sampleVisibility[sideName][fieldName];
    }));
    setControl("labelSheetBackgroundPrompt", profile.backgroundPrompt);
    setControl("labelSheetDocumentType", profile.type);
    syncIntentDocumentType(profile.type);
    setControl("labelSheetTextAlign", "left");
    setControl("labelSheetTextVerticalAlign", "center");
    setControl("labelSheetTextScale", 95);
    setControl("labelSheetTextContrast", "auto");
    updateTextScaleOutput();
    project.settings.qrEnabledForPrint = profile.qr;
    if ($("labelSheetQrEnabled")) $("labelSheetQrEnabled").checked = profile.qr;
    setControl("labelSheetQrSide", "front");
    setControl("labelSheetQrSource", "record");
    setControl("labelSheetQrTemplate", "");
    setControl("labelSheetQrPosition", "right");
    setControl("labelSheetQrLayoutMode", "adaptive");
    setControl("labelSheetQrSize", 28);
    setControl("labelSheetQrMargin", 4);
    updateQrControlState(goal);
    setDuplexMode(requestedDuplex);
    setControl("labelSheetFlipEdge", "long");
    project.settings.documentType = profile.type;
    project.settings.textLayouts = normalizeTextLayouts(null);
    project.settings.recordTextLayouts = {};
    project.settings.outputVisibility = sampleVisibility;
    applySequence({ replace: true, announce: false });
    const frontAssetId = assetStore.list().find((asset) => asset.filename === profile.frontAsset)?.assetId || "";
    const backAssetId = assetStore.list().find((asset) => asset.filename === profile.backAsset)?.assetId || "";
    project.records.forEach((record, index) => {
      const [name, category] = profile.people[index];
      record.id = `${profile.idPrefix}-${String(index + 1).padStart(3, "0")}`;
      record.data.name = name;
      record.data.category = category;
      record.data.course = category;
      record.front.title = profile.frontTitle || "";
      record.front.subtitle = profile.frontSubtitle || "";
      record.front.body = ["admission", "label"].includes(profile.type) ? "" : (profile.frontBody || "");
      record.front.footer = profile.frontFooter || "";
      record.back.title = profile.backTitle || "";
      record.back.subtitle = profile.backSubtitle || "";
      record.back.body = profile.backBody || "";
      record.back.footer = profile.backFooter || "";
      const qrRoute = profile.type === "meal-ticket" ? "sample-meal" : profile.type;
      const usesQr = profile.qr && (profile.qrCoverage === "all" || (profile.qrCoverage === "alternating" && index % 2 === 0));
      record.front.qrValue = usesQr ? `https://example.kr/${qrRoute}/${record.id}` : "";
      if (goal !== "prompt" && frontAssetId) assignRecordAsset(record, "front", frontAssetId);
      if (goal !== "prompt" && requestedDuplex && backAssetId) assignRecordAsset(record, "back", backAssetId);
    });
    renderRecordTable();
    previewSide = "front";
    onProjectControlsChanged(`${profile.presetLabel} 예시 8건을 채웠습니다. ${goal === "prompt" ? "실제 문구와 QR 예약 공간을 페이지·라벨별 프롬프트로 확인하세요." : "자동 대비와 QR 유무별 문구 재배치를 미리보기에서 확인하세요."}`, { rerenderTable: false });
    if (goal !== "print") generatePrompts();
    activateFlowStep("output");
  }

  function resetProject() {
    if (!window.confirm("라벨 규격과 데이터, 연결 정보를 초기화할까요? 등록한 이미지 원본은 보관함에 남습니다.")) return;
    project = ENGINE.createDefaultProject();
    project.assets = projectAssetMetadata();
    draftRecords = [];
    draftRawRecords = [];
    draftHeaders = [];
    draftActive = false;
    undoRecords = null;
    selectedRecordIds = new Set();
    previewSide = "front";
    currentPageIndex = 0;
    wysiwygEnabled = pane.classList.contains("label-sheet-workspace-v2");
    wysiwygPlacementIndex = 0;
    wysiwygField = "title";
    wysiwygScope = "record";
    invalidatePromptBundle();
    fillPresetOptions();
    fillVisualStyleOptions();
    setSpecControls(project.spec);
    setSettingsControls();
    renderDnaFeaturedGallery();
    updateDnaSummary();
    setProductControlsLocked(false);
    renderRecordTable();
    setImportStatus("가져올 데이터를 기다리는 중입니다.");
    activateFlowStep("intent", { scroll: false });
    saveProject();
    scheduleRefresh();
    setStatus("프로젝트를 초기화했습니다. 등록 이미지 원본은 보관함에 유지됩니다.", "success");
  }

  async function loadTransferPayload(payload = {}, options = {}) {
    const sourceTab = cleanText(payload.sourceTab || "external");
    const incomingRaw = Array.isArray(payload.records) ? payload.records : [];
    if (!incomingRaw.length) throw new Error("라벨로 보낼 데이터가 없습니다.");
    const incomingHeaders = Array.from(new Set(incomingRaw.flatMap((record) => Object.keys(record && typeof record === "object" ? record : {}))));
    const incomingMapping = DATA_MAPPING.suggest(incomingHeaders, {
      current: payload.dataMapping || project.settings?.dataMapping,
      duplex: payload.spec?.duplex?.enabled ?? project.spec.duplex.enabled,
    });
    const incoming = incomingRaw.map((record, index) => DATA_MAPPING.applyRecord(record, incomingMapping, index));
    const mode = ["replace", "append", "update-by-id"].includes(payload.importMode) ? payload.importMode : "append";
    if (mode === "replace" && project.records.length && options.confirmReplace !== false) {
      const confirmed = window.confirm("현재 라벨 목록을 전달받은 데이터로 교체할까요?");
      if (!confirmed) return { ok: false, cancelled: true };
    }
    const result = ENGINE.importRecords(project.records, incoming, { mode, idField: payload.idField || "id" });
    if (result.errors.length) throw new Error(result.errors[0].message);
    project.records = result.records;
    if (payload.spec) project.spec = ENGINE.normalizeSpec(payload.spec);
    if (payload.settings && typeof payload.settings === "object") {
      project.settings = { ...project.settings, ...deepClone(payload.settings) };
    }
    project.settings.dataMapping = deepClone(incomingMapping);
    if (payload.styleSnapshot) {
      project.settings.visualStyleSnapshot = deepClone(payload.styleSnapshot);
      project.settings.visualStyleSource = sourceTab;
      project.settings.visualStyleId = VISUAL_STYLES?.get?.(payload.styleSnapshot.id) ? payload.styleSnapshot.id : "";
    }
    if (payload.qrSettings) {
      project.settings.qr = normalizeQrSettings({ ...project.settings.qr, ...deepClone(payload.qrSettings), enabled: true });
    }
    const registeredAssets = new Map();
    for (const asset of Array.from(payload.assets || [])) {
      let registered = null;
      if (asset?.blob) {
        registered = await assetStore.register(asset.blob, { filename: asset.filename, source: asset.source, fit: asset.fit });
      } else if (asset?.url) {
        registered = await assetStore.registerGeneratedUrl(asset.url, { filename: asset.filename, source: "generated", fit: asset.fit });
      }
      if (!registered) continue;
      registeredAssets.set(asset.key || asset.assetId || asset.filename, registered.assetId);
      if (asset.assign?.recordId && ["front", "back"].includes(asset.assign.side)) {
        const target = project.records.find((record) => record.id === asset.assign.recordId);
        if (target) assignRecordAsset(target, asset.assign.side, registered.assetId);
      }
    }
    draftActive = false;
    draftRecords = [];
    draftRawRecords = [];
    draftHeaders = [];
    undoRecords = null;
    selectedRecordIds.clear();
    invalidatePromptBundle();
    fillPresetOptions();
    fillVisualStyleOptions();
    setSpecControls(project.spec);
    setSettingsControls();
    setProductControlsLocked(selectedPreset()?.editable === false);
    syncAssetReferences();
    renderAssets();
    renderRecordTable();
    await refreshOutput();
    setStatus(`${sourceTab}에서 라벨 데이터 ${incoming.length}건을 가져왔습니다.`, "success");
    if (options.switchTab !== false) window.PromptDeckTabs?.switchTab?.("labelSheet");
    return { ok: true, ...result, registeredAssets: Object.fromEntries(registeredAssets) };
  }

  async function replaceProjectSnapshot(snapshot, options = {}) {
    if (generationRunning) throw new Error("배경 생성 큐를 중지한 뒤 실행 취소 또는 다시 실행을 사용해 주세요.");
    const loaded = ENGINE.deserializeProject(deepClone(snapshot));
    project = loaded;
    draftRecords = [];
    draftRawRecords = [];
    draftHeaders = [];
    draftActive = false;
    undoRecords = null;
    selectedRecordIds.clear();
    selectedAssetId = "";
    previewSide = options.previewSide === "back" && project.spec.duplex.enabled ? "back" : "front";
    currentPageIndex = 0;
    wysiwygPlacementIndex = 0;
    wysiwygField = "title";
    wysiwygScope = "record";
    invalidatePromptBundle();
    fillPresetOptions();
    fillVisualStyleOptions();
    setSpecControls(project.spec);
    setSettingsControls();
    setProductControlsLocked(selectedPreset()?.editable === false);
    syncAssetReferences();
    renderAssets();
    renderRecordTable();
    saveProject();
    await refreshOutput();
    const message = cleanText(options.message) || `${project.name || "라벨·티켓"} 프로젝트 상태를 복원했습니다.`;
    setStatus(message, "success");
    window.dispatchEvent(new CustomEvent("promptdeck:label-sheet-project-replaced", {
      detail: { source: cleanText(options.source) || "api", recordCount: project.records.length },
    }));
    return ENGINE.toSerializableProject(effectiveProject());
  }

  async function loadTablePayload(text, options = {}) {
    const parsed = TABLE_DATA?.parseLabelTable
      ? TABLE_DATA.parseLabelTable(text, { delimiter: options.delimiter || "auto", header: options.header || "auto" })
      : ENGINE.parseTable(text, { delimiter: options.delimiter || "auto", header: options.header || "auto" });
    if (parsed.errors.length || !parsed.objects.length) throw new Error(parsed.errors[0]?.message || "가져올 표 데이터를 찾지 못했습니다.");
    return loadTransferPayload({
      sourceTab: options.sourceTab || "table",
      records: parsed.objects,
      importMode: options.importMode || "append",
      settings: options.settings,
      styleSnapshot: options.styleSnapshot,
      qrSettings: options.qrSettings,
    }, options);
  }

  function toggleSelectedRecord(row, forceSelected) {
    const id = cleanText(row?.dataset.recordId);
    if (!id) return;
    const selected = typeof forceSelected === "boolean" ? forceSelected : !selectedRecordIds.has(id);
    if (selected) selectedRecordIds.add(id);
    else selectedRecordIds.delete(id);
    row.classList.toggle("is-selected", selected);
    row.setAttribute("aria-selected", String(selected));
    const checkbox = row.querySelector("[data-record-select]");
    if (checkbox) checkbox.checked = selected;
    setAssetStatus(`배경·QR 배정 대상 ${selectedRecordIds.size}개 행 선택`);
    updateQrAssignmentPreview();
    syncSpreadsheetTools();
  }

  function safeAsync(callback) {
    return (...args) => Promise.resolve(callback(...args)).catch((error) => {
      setStatus(error.message || "작업을 완료하지 못했습니다.", "error");
    });
  }

  function listen(id, eventName, callback) {
    const element = $(id);
    if (element) element.addEventListener(eventName, callback);
  }

  function bindEvents() {
    pane.querySelectorAll('input[name="labelSheetOutputGoal"]').forEach((radio) => {
      radio.addEventListener("change", (event) => {
        if (!event.target.checked) return;
        applyOutputGoalUi(event.target.value, { announce: true });
        onProjectControlsChanged();
        if (event.target.value !== "prompt" && project.records.length) scheduleSequenceApply();
        activateFlowStep("intent", { scroll: false });
      });
    });
    pane.querySelectorAll('input[name="labelSheetIntentDocumentType"]').forEach((radio) => {
      radio.addEventListener("change", (event) => {
        if (!event.target.checked) return;
        setControl("labelSheetDocumentType", event.target.value);
        project.settings.documentType = event.target.value;
        setDuplexMode(["admission", "meal-ticket"].includes(event.target.value));
        updateIntentSummary();
        onProjectControlsChanged(`${DOCUMENT_TYPE_LABELS[event.target.value]}을 선택했습니다. ‘${DOCUMENT_TYPE_SAMPLE_LABELS[event.target.value]}’를 누르면 예시가 입력됩니다.`);
        updateProgressState("intent");
      });
    });
    listen("labelSheetIntentContinueBtn", "click", () => activateFlowStep("spec", { focus: true }));
    listen("labelSheetIntentEditBtn", "click", () => activateFlowStep("intent", { focus: true }));
    listen("labelSheetContextPrevBtn", "click", () => moveFlowStep(-1));
    listen("labelSheetContextNextBtn", "click", () => moveFlowStep(1));
    listen("labelSheetSamplePreset", "change", () => {
      updateIntentSummary();
      const type = selectedRadioValue("labelSheetIntentDocumentType", value("labelSheetDocumentType") || "label");
      const selected = SAMPLE_PRESET_CATALOG[type].find((item) => item.id === value("labelSheetSamplePreset"));
      if (selected) setStatus(`${selected.label} 예시를 선택했습니다. ${selected.description}`, "success");
    });
    listen("labelSheetIntentSampleBtn", "click", fillSample);
    pane.querySelectorAll("[data-label-sheet-step-target]").forEach((button) => {
      button.addEventListener("click", () => activateFlowStep(button.dataset.labelSheetStepTarget, { focus: true }));
    });
    listen("labelSheetToggleAllStepsBtn", "click", () => setFlowShowAll(!flowShowAll));
    pane.querySelectorAll("details[data-label-sheet-step]").forEach((details) => {
      details.addEventListener("toggle", () => {
        if (!details.open || flowNavigationBusy) return;
        if (!flowShowAll) {
          flowNavigationBusy = true;
          pane.querySelectorAll("details[data-label-sheet-step]").forEach((item) => {
            if (item !== details) item.open = false;
          });
          window.cancelAnimationFrame(flowNavigationFrame);
          flowNavigationFrame = window.requestAnimationFrame(() => { flowNavigationBusy = false; });
        }
        updateProgressState(details.dataset.labelSheetStep);
      });
    });
    listen("labelSheetPreset", "change", () => applyPreset(selectedPreset()));
    listen("labelSheetClonePresetBtn", "click", () => {
      const orientation = value("labelSheetOrientation") === "landscape" ? "landscape" : "portrait";
      setControl("labelSheetPreset", `custom-a4-${orientation}`);
      project.settings.presetId = `custom-a4-${orientation}`;
      setProductControlsLocked(false);
      onProjectControlsChanged("제품 규격의 현재 치수를 사용자 지정으로 복사했습니다.");
    });
    listen("labelSheetOrientation", "change", () => {
      const orientation = value("labelSheetOrientation") === "landscape" ? "landscape" : "portrait";
      if (selectedPreset()?.editable !== false) setControl("labelSheetPreset", `custom-a4-${orientation}`);
      onProjectControlsChanged();
    });
    [
      "labelSheetDpi", "labelSheetColumns", "labelSheetRows", "labelSheetMarginTop", "labelSheetMarginRight",
      "labelSheetMarginBottom", "labelSheetMarginLeft", "labelSheetGapX", "labelSheetGapY", "labelSheetSafeArea",
      "labelSheetBleed", "labelSheetFirstSlot", "labelSheetFlowOrder", "labelSheetFlipEdge", "labelSheetBackTransform",
      "labelSheetBackOffsetX", "labelSheetBackOffsetY", "labelSheetSkippedSlots",
    ].forEach((id) => listen(id, "change", () => onProjectControlsChanged()));
    [
      "labelSheetFrontTitle", "labelSheetFrontSubtitle", "labelSheetFrontBody", "labelSheetFrontFooter",
      "labelSheetBackTitle", "labelSheetBackSubtitle", "labelSheetBackBody", "labelSheetBackFooter",
      "labelSheetBackgroundPrompt", "labelSheetContentOrientation", "labelSheetTextAlign", "labelSheetTextVerticalAlign", "labelSheetTextContrast",
    ].forEach((id) => listen(id, "input", () => onProjectControlsChanged()));
    listen("labelSheetContentOrientation", "change", syncWysiwygControls);
    pane.addEventListener("focusin", (event) => {
      const input = event.target.closest?.("[data-label-sheet-output-template]");
      if (input) activeOutputTemplateInput = input;
    });
    pane.querySelectorAll("[data-label-sheet-output-token-bar]").forEach((bar) => {
      bar.addEventListener("click", (event) => {
        const button = event.target.closest("[data-label-sheet-output-token]");
        if (button) insertOutputTemplateToken(button);
      });
    });
    pane.querySelectorAll("[data-label-sheet-output-visible]").forEach((control) => {
      control.addEventListener("change", () => {
        updateOutputVisibilityControls();
        onProjectControlsChanged(`${control.dataset.labelSheetOutputVisible?.startsWith("back.") ? "뒷면" : "앞면"} 항목 표시 여부를 변경했습니다.`);
      });
    });
    listen("labelSheetTextScale", "input", () => {
      updateTextScaleOutput();
      onProjectControlsChanged();
    });
    listen("labelSheetTextContrast", "change", updateContrastStatus);
    listen("labelSheetSequenceMode", "change", () => {
      updateSequenceControlState();
      scheduleSequenceApply();
    });
    ["labelSheetRecordCount", "labelSheetStartNumber", "labelSheetEndNumber", "labelSheetPrefix", "labelSheetSuffix", "labelSheetPadding"].forEach((id) => {
      listen(id, "input", scheduleSequenceApply);
    });
    listen("labelSheetImageFit", "change", () => {
      updateCropEditor();
      onProjectControlsChanged();
    });
    listen("labelSheetAllowUpscale", "change", () => onProjectControlsChanged());
    ["labelSheetCropX", "labelSheetCropY", "labelSheetCropWidth", "labelSheetCropHeight"].forEach((id) => {
      listen(id, "input", updateCropEditor);
      listen(id, "change", safeAsync(persistSelectedAssetCrop));
    });
    listen("labelSheetVisualStyle", "change", applyGalleryVisualStyle);
    listen("labelSheetUseMixerStyleBtn", "click", applyMixerVisualStyle);
    listen("labelSheetClearStyleBtn", "click", clearVisualStyle);
    listen("labelSheetOpenDnaGalleryBtn", "click", openDnaDialog);
    listen("labelSheetDnaScope", "change", () => {
      renderDnaFeaturedGallery();
      renderDnaDialog();
      updateDnaSummary();
      onProjectControlsChanged("디자인 DNA 적용 범위를 변경했습니다.");
    });
    listen("labelSheetDnaSearch", "input", () => {
      dnaStyleBrowser.query = cleanText(value("labelSheetDnaSearch"));
      dnaStyleBrowser.visible = DNA_STYLE_BATCH_SIZE;
      renderDnaDialog();
    });
    listen("labelSheetDnaSearchClear", "click", () => {
      dnaStyleBrowser.query = "";
      dnaStyleBrowser.visible = DNA_STYLE_BATCH_SIZE;
      setControl("labelSheetDnaSearch", "");
      renderDnaDialog();
    });
    $("labelSheetDnaCategories")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-label-sheet-dna-category]");
      if (!button) return;
      dnaStyleBrowser.category = button.dataset.labelSheetDnaCategory || "all";
      dnaStyleBrowser.visible = DNA_STYLE_BATCH_SIZE;
      renderDnaDialog();
    });
    listen("labelSheetDnaLoadMoreBtn", "click", () => {
      dnaStyleBrowser.visible += DNA_STYLE_BATCH_SIZE;
      renderDnaDialog();
    });
    listen("labelSheetDnaUseDefaultBtn", "click", clearVisualStyle);
    $("labelSheetDnaDialog")?.addEventListener("click", (event) => {
      if (event.target === $("labelSheetDnaDialog") || event.target.closest("[data-label-sheet-dna-dialog-close]")) closeDnaDialog();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !$("labelSheetDnaDialog")?.hidden) closeDnaDialog();
    });
    listen("labelSheetQrEnabled", "change", () => {
      updateQrControlState();
      onProjectControlsChanged();
    });
    ["labelSheetQrSide", "labelSheetQrSource", "labelSheetQrPosition", "labelSheetQrSize", "labelSheetQrMargin", "labelSheetQrLayoutMode", "labelSheetQrAssignScope"].forEach((id) => listen(id, "change", () => {
      updateQrControlState();
      onProjectControlsChanged();
    }));
    listen("labelSheetQrTemplate", "input", () => {
      if (checked("labelSheetQrEnabled") && cleanText(value("labelSheetQrTemplate"))) setControl("labelSheetQrSource", "template");
      updateQrControlState();
      onProjectControlsChanged();
    });
    $("labelSheetQrTokenBar")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-label-sheet-qr-token]");
      if (!button || button.disabled) return;
      insertQrTemplateToken(button.dataset.labelSheetQrToken || "");
    });
    listen("labelSheetQrAssignBtn", "click", () => assignQrValues());
    listen("labelSheetQrUseCurrentBtn", "click", () => assignCurrentQrValue());
    listen("labelSheetQrClearBtn", "click", () => clearAssignedQrValues());
    listen("labelSheetUseQrStyleBtn", "click", importQrGeneratorStyle);
    listen("labelSheetRestoreDefaultsBtn", "click", safeAsync(() => ensureDefaultAssets({ force: true, announce: true })));
    ["labelSheetGenerationDelay", "labelSheetGenerationRetries"].forEach((id) => listen(id, "change", () => syncProjectFromControls()));
    listen("labelSheetDocumentType", "change", applyDocumentTypeDefaults);
    ["labelSheetFocalX", "labelSheetFocalY"].forEach((id) => {
      listen(id, "input", () => {
        updateFocalOutputs();
        onProjectControlsChanged();
      });
    });
    listen("labelSheetModeSingle", "change", () => {
      if (checked("labelSheetModeSingle")) {
        setDuplexMode(false, { refresh: true });
      }
    });
    listen("labelSheetModeDuplex", "change", () => {
      if (checked("labelSheetModeDuplex")) setDuplexMode(true, { refresh: true });
    });

    const dataTabs = [
      ["labelSheetDataDirectTab", "labelSheetDataDirectPanel"],
      ["labelSheetDataPasteTab", "labelSheetDataPastePanel"],
      ["labelSheetDataCsvTab", "labelSheetDataCsvPanel"],
    ];
    dataTabs.forEach(([buttonId, panelId]) => listen(buttonId, "click", () => activateSubTab(buttonId, panelId, ".label-sheet-data-tabs [role=tab]", ".label-sheet-data-panel")));
    const contentTabs = [
      ["labelSheetContentFrontTab", "labelSheetFrontContentPanel"],
      ["labelSheetContentBackTab", "labelSheetBackContentPanel"],
    ];
    contentTabs.forEach(([buttonId, panelId]) => listen(buttonId, "click", () => {
      if (buttonId === "labelSheetContentBackTab" && !checked("labelSheetModeDuplex")) return;
      activateSubTab(buttonId, panelId, ".label-sheet-content-tabs [role=tab]", ".label-sheet-content-panel");
      const side = buttonId === "labelSheetContentBackTab" ? "back" : "front";
      if ($("labelSheetContentScopeStatus")) $("labelSheetContentScopeStatus").textContent = `${side === "front" ? "앞면" : "뒷면"} 개별 설정`;
      selectPreviewSide(side);
    }));

    listen("labelSheetApplySequenceBtn", "click", () => applySequence({ announce: true }));
    listen("labelSheetPasteApplyBtn", "click", () => reviewImportText(value("labelSheetPasteInput"), "붙여넣기"));
    listen("labelSheetCsvInput", "change", (event) => readCsvFile(event.target.files?.[0]));
    listen("labelSheetCsvSampleBtn", "click", downloadSampleCsv);
    listen("labelSheetDataMappingPasteBtn", "click", () => openDataMappingSource("paste"));
    listen("labelSheetDataMappingCsvBtn", "click", () => openDataMappingSource("csv"));
    listen("labelSheetDataMappingAutoBtn", "click", autoMapDraft);
    listen("labelSheetDataMappingReviewBtn", "click", reviewMappedData);
    $("labelSheetDataMappingControls")?.closest(".label-sheet-data-mapping")?.addEventListener("change", (event) => {
      const select = event.target.closest("[data-label-sheet-map]");
      if (!select || !draftActive) return;
      draftMapping[select.dataset.labelSheetMap] = select.value;
      applyDraftMapping();
    });
    listen("labelSheetImportCommitBtn", "click", commitImport);
    listen("labelSheetImportUndoBtn", "click", undoImport);
    listen("labelSheetPasteClipboardBtn", "click", safeAsync(pasteSpreadsheetClipboard));
    listen("labelSheetCopySelectedRowsBtn", "click", safeAsync(() => copySpreadsheetRows("selected")));
    listen("labelSheetCopyAllRowsBtn", "click", safeAsync(() => copySpreadsheetRows("all")));
    listen("labelSheetFillDownBtn", "click", fillSpreadsheetColumn);
    const recordBody = $("labelSheetRecordTableBody");
    recordBody?.addEventListener("focusin", (event) => {
      if (event.target?.matches("input[data-record-index][data-record-field]")) rememberSpreadsheetCell(event.target);
    });
    recordBody?.addEventListener("paste", (event) => {
      const target = event.target?.closest?.('input[type="text"][data-record-field]');
      const text = event.clipboardData?.getData("text/plain") || "";
      if (!target || (!text.includes("\t") && !/[\r\n]/u.test(text))) return;
      event.preventDefault();
      rememberSpreadsheetCell(target, { announce: false });
      try {
        applySpreadsheetText(text, { focus: true });
      } catch (error) {
        setElementStatus("labelSheetSpreadsheetStatus", error.message || "붙여넣은 셀 범위를 읽지 못했습니다.", "error");
      }
    });
    recordBody?.addEventListener("input", (event) => {
      if (event.target?.dataset?.recordField) updateRecordField(event.target);
    });
    recordBody?.addEventListener("change", (event) => {
      if (event.target?.matches("[data-record-select]")) {
        toggleSelectedRecord(event.target.closest("tr[data-record-id]"), event.target.checked);
        return;
      }
      if (event.target?.dataset?.recordField) updateRecordField(event.target);
    });
    recordBody?.addEventListener("click", (event) => {
      if (event.target.closest("input,button,a,label")) return;
      toggleSelectedRecord(event.target.closest("tr[data-record-id]"));
    });
    recordBody?.addEventListener("keydown", (event) => {
      const input = event.target?.closest?.('input[type="text"][data-record-field]');
      if (input && event.ctrlKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        rememberSpreadsheetCell(input, { announce: false });
        fillSpreadsheetColumn();
        return;
      }
      if (input && event.key === "Enter" && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
        event.preventDefault();
        const nextIndex = Number(input.dataset.recordIndex) + 1;
        const next = recordBody.querySelector(`input[data-record-index="${nextIndex}"][data-record-field="${input.dataset.recordField}"]`);
        next?.focus();
        next?.select?.();
        return;
      }
      if (!["Enter", " "].includes(event.key) || event.target.matches("input")) return;
      event.preventDefault();
      toggleSelectedRecord(event.target.closest("tr[data-record-id]"));
    });

    listen("labelSheetAssetInput", "change", (event) => {
      pendingFiles = Array.from(event.target.files || []);
      setAssetStatus(pendingFiles.length ? `${pendingFiles.length}개 파일 선택 · ‘선택 이미지 등록’을 눌러 원본을 보관하세요.` : "등록된 이미지 없음");
    });
    listen("labelSheetPrepareFreeBackgroundBtn", "click", () => prepareFreeBackgroundPrompt());
    listen("labelSheetCopyFreeBackgroundPromptBtn", "click", safeAsync(copyFreeBackgroundPrompt));
    listen("labelSheetOpenFreeImageToolBtn", "click", safeAsync(openFreeBackgroundTool));
    listen("labelSheetFreeBackgroundPrompt", "input", () => {
      const ready = Boolean(cleanText(value("labelSheetFreeBackgroundPrompt")));
      if ($("labelSheetCopyFreeBackgroundPromptBtn")) $("labelSheetCopyFreeBackgroundPromptBtn").disabled = !ready;
      if ($("labelSheetOpenFreeImageToolBtn")) $("labelSheetOpenFreeImageToolBtn").disabled = !ready;
    });
    listen("labelSheetFreeBackgroundInput", "change", (event) => selectFreeBackgroundFiles(event.target.files));
    listen("labelSheetRegisterFreeBackgroundBtn", "click", safeAsync(() => registerFreeBackgroundFiles()));
    listen("labelSheetPasteFreeBackgroundBtn", "click", safeAsync(pasteFreeBackgroundFromClipboard));
    listen("labelSheetGoToAssetLibraryBtn", "click", () => {
      const library = document.querySelector("#paneLabelSheet .label-sheet-asset-library");
      library?.scrollIntoView({ behavior: "smooth", block: "center" });
      $("labelSheetAssetList")?.focus?.({ preventScroll: true });
      setFreeBackgroundStatus("보관함에서 등록된 배경을 선택한 뒤 ‘선택 배경 배정’을 누르세요.", "success");
    });
    listen("labelSheetAssetRegisterBtn", "click", safeAsync(() => registerPendingAssets()));
    listen("labelSheetAssetAssignBtn", "click", safeAsync(assignAssets));
    listen("labelSheetAssetRemoveBtn", "click", safeAsync(removeSelectedAsset));
    listen("labelSheetGenerateMissingBtn", "click", safeAsync(generateMissingBackgrounds));
    listen("labelSheetGenerationPauseBtn", "click", () => {
      if (!generationQueue) return;
      const snapshot = generationQueue.snapshot();
      if (snapshot.status === "paused") generationQueue.resume();
      else generationQueue.pause();
    });
    listen("labelSheetGenerationStopBtn", "click", () => {
      generationQueue?.stop();
      setElementStatus("labelSheetGenerationStatus", "현재 생성 작업을 마친 뒤 큐를 중지합니다.", "warning");
    });
    const drop = $("labelSheetAssetDrop");
    ["dragenter", "dragover"].forEach((eventName) => drop?.addEventListener(eventName, (event) => {
      event.preventDefault();
      drop.classList.add("is-dragover");
    }));
    ["dragleave", "drop"].forEach((eventName) => drop?.addEventListener(eventName, (event) => {
      event.preventDefault();
      drop.classList.remove("is-dragover");
    }));
    drop?.addEventListener("drop", (event) => {
      pendingFiles = Array.from(event.dataTransfer?.files || []);
      setAssetStatus(`${pendingFiles.length}개 파일을 받았습니다. ‘선택 이미지 등록’을 눌러 원본을 보관하세요.`);
    });
    drop?.addEventListener("click", (event) => {
      if (event.target.closest("label,input,button")) return;
      $("labelSheetAssetInput")?.click();
    });
    drop?.addEventListener("keydown", (event) => {
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      $("labelSheetAssetInput")?.click();
    });
    $("labelSheetAssetList")?.addEventListener("change", (event) => {
      if (!event.target.matches("input[name='labelSheetAssetSelection']")) return;
      selectedAssetId = event.target.value;
      renderAssets();
      const asset = assetStore.get(selectedAssetId);
      if (asset) setAssetStatus(`${asset.filename} 선택 · ${asset.width}×${asset.height}px`);
    });

    listen("labelSheetWysiwygToggle", "click", toggleWysiwyg);
    listen("labelSheetFocusDoneBtn", "click", () => {
      if (wysiwygEnabled) toggleWysiwyg();
    });
    listen("labelSheetOpenDetailedEditBtn", "click", () => {
      if (!wysiwygEnabled) toggleWysiwyg();
      setFocusToolPanel("detail", { focus: true });
    });
    pane.querySelectorAll("[data-label-sheet-focus-tool]").forEach((button) => {
      button.addEventListener("click", () => setFocusToolPanel(button.dataset.labelSheetFocusTool, { focus: false }));
    });
    pane.querySelectorAll("[data-label-sheet-focus-target]").forEach((button) => {
      button.addEventListener("click", () => selectWysiwygTarget(button.dataset.labelSheetFocusTarget, { focusStage: true }));
    });
    pane.querySelectorAll("[data-label-sheet-nudge]").forEach((button) => {
      button.addEventListener("click", (event) => nudgeActiveWysiwyg(button.dataset.labelSheetNudge, event.shiftKey ? 5 : 1));
    });
    pane.querySelectorAll("[data-label-sheet-focus-align]").forEach((button) => {
      button.addEventListener("click", () => updateWysiwygField("align", button.dataset.labelSheetFocusAlign, `${WYSIWYG_FIELD_LABELS[wysiwygField]} 정렬을 바꿨습니다.`));
    });
    listen("labelSheetFocusSizeDown", "click", () => adjustActiveWysiwygSize(-0.5));
    listen("labelSheetFocusSizeUp", "click", () => adjustActiveWysiwygSize(0.5));
    listen("labelSheetFocusShortcutHelpBtn", "click", () => toggleFocusShortcutHelp());
    $("labelSheetFocusEditor")?.addEventListener("keydown", handleFocusEditorKeydown);
    listen("labelSheetWysiwygScope", "change", () => {
      wysiwygScope = value("labelSheetWysiwygScope") === "global" ? "global" : "record";
      syncWysiwygControls();
      renderWysiwygWorkspace(currentWorkingProject, currentPages[previewSide]?.[currentPageIndex]);
    });
    listen("labelSheetQuickScope", "change", () => {
      wysiwygScope = value("labelSheetQuickScope") === "global" ? "global" : "record";
      syncWysiwygControls();
      renderWysiwygWorkspace(currentWorkingProject, currentPages[previewSide]?.[currentPageIndex]);
    });
    [
      ["labelSheetFocusScopeRecord", "record"],
      ["labelSheetFocusScopeGlobal", "global"],
    ].forEach(([id, scope]) => listen(id, "click", () => {
      wysiwygScope = scope;
      syncWysiwygControls();
      renderWysiwygWorkspace(currentWorkingProject, currentPages[previewSide]?.[currentPageIndex]);
    }));
    listen("labelSheetFocusPrev", "click", () => moveWysiwygPlacement(-1));
    listen("labelSheetFocusNext", "click", () => moveWysiwygPlacement(1));
    listen("labelSheetFocusBackgroundToggle", "click", () => {
      focusBackgroundMuted = !focusBackgroundMuted;
      syncFocusBackgroundMode();
      setElementStatus("labelSheetFocusStatus", focusBackgroundMuted
        ? "편집 대비를 켰습니다. 배경은 약하게, 실제 문구·QR 편집 레이어는 선명하게 표시합니다."
        : "배경 원본 밝기와 색상을 표시합니다. 이 전환은 편집 화면에만 적용되고 출력물에는 영향을 주지 않습니다.", "success");
    });
    listen("labelSheetWysiwygField", "change", () => {
      wysiwygField = WYSIWYG_TARGET_KEYS.includes(value("labelSheetWysiwygField")) ? value("labelSheetWysiwygField") : "title";
      syncWysiwygControls();
      renderWysiwygWorkspace(currentWorkingProject, currentPages[previewSide]?.[currentPageIndex]);
    });
    listen("labelSheetQuickTarget", "change", () => {
      wysiwygField = WYSIWYG_TARGET_KEYS.includes(value("labelSheetQuickTarget")) ? value("labelSheetQuickTarget") : "title";
      syncWysiwygControls();
      renderWysiwygWorkspace(currentWorkingProject, currentPages[previewSide]?.[currentPageIndex]);
    });
    listen("labelSheetWysiwygText", "input", () => updateWysiwygText({ rerenderTable: false }));
    listen("labelSheetWysiwygText", "change", () => updateWysiwygText({ rerenderTable: false }));
    listen("labelSheetWysiwygVisible", "change", () => updateWysiwygField("visible", checked("labelSheetWysiwygVisible"), `${WYSIWYG_FIELD_LABELS[wysiwygField]} 표시 여부를 바꿨습니다.`));
    listen("labelSheetWysiwygFont", "change", () => updateWysiwygField("fontFamily", value("labelSheetWysiwygFont"), `${WYSIWYG_FIELD_LABELS[wysiwygField]} 글꼴을 바꿨습니다.`));
    listen("labelSheetQuickFont", "change", () => updateWysiwygField("fontFamily", value("labelSheetQuickFont"), `${WYSIWYG_FIELD_LABELS[wysiwygField]} 글꼴을 바꿨습니다.`));
    listen("labelSheetWysiwygSize", "input", () => {
      if ($("labelSheetWysiwygSizeValue")) $("labelSheetWysiwygSizeValue").textContent = `${rounded(numberValue("labelSheetWysiwygSize", 15))}%`;
      updateWysiwygField("sizePercent", numberValue("labelSheetWysiwygSize", 15), `${WYSIWYG_FIELD_LABELS[wysiwygField]} 크기를 바꿨습니다.`);
    });
    listen("labelSheetWysiwygAlign", "change", () => updateWysiwygField("align", value("labelSheetWysiwygAlign"), `${WYSIWYG_FIELD_LABELS[wysiwygField]} 정렬을 바꿨습니다.`));
    listen("labelSheetQuickSize", "input", () => {
      const nextSize = numberValue("labelSheetQuickSize", wysiwygField === "qr" ? 28 : 15);
      if ($("labelSheetQuickSizeValue")) $("labelSheetQuickSizeValue").textContent = `${rounded(nextSize)}%`;
      updateWysiwygField("sizePercent", nextSize, `${WYSIWYG_FIELD_LABELS[wysiwygField]} 크기를 바꿨습니다.`);
    });
    listen("labelSheetQuickWidth", "input", () => {
      const nextWidth = numberValue("labelSheetQuickWidth", 90);
      if ($("labelSheetQuickWidthValue")) $("labelSheetQuickWidthValue").textContent = `${rounded(nextWidth)}%`;
      updateWysiwygField("widthPercent", nextWidth, `${WYSIWYG_FIELD_LABELS[wysiwygField]} 너비를 바꿨습니다.`);
    });
    listen("labelSheetQuickHeight", "input", () => {
      const nextHeight = numberValue("labelSheetQuickHeight", 20);
      if ($("labelSheetQuickHeightValue")) $("labelSheetQuickHeightValue").textContent = `${rounded(nextHeight)}%`;
      updateWysiwygField("heightPercent", nextHeight, `${WYSIWYG_FIELD_LABELS[wysiwygField]} 높이를 바꿨습니다.`);
    });
    ["left", "center", "right"].forEach((align) => {
      const id = `labelSheetQuickAlign${align[0].toUpperCase()}${align.slice(1)}`;
      listen(id, "click", () => updateWysiwygField("align", align, `${WYSIWYG_FIELD_LABELS[wysiwygField]} 정렬을 바꿨습니다.`));
    });
    listen("labelSheetWysiwygMaxLines", "change", () => updateWysiwygField("maxLines", numberValue("labelSheetWysiwygMaxLines", 2), `${WYSIWYG_FIELD_LABELS[wysiwygField]} 최대 줄 수를 바꿨습니다.`));
    ["labelSheetWysiwygAutoHeight", "labelSheetQuickAutoHeight"].forEach((id) => listen(id, "change", () => {
      const automatic = checked(id);
      const context = activeWysiwygLayout(true);
      const config = normalizeTextFieldLayout(context.layout?.[wysiwygField], wysiwygField);
      updateWysiwygField("heightPercent", automatic ? null : automaticFieldHeightPercent(config), automatic ? "문구 높이를 내용에 맞춰 자동 조정합니다." : "문구 영역 높이를 고정했습니다.");
    }));
    ["labelSheetWysiwygAvoidQr", "labelSheetQuickAvoidQr"].forEach((id) => listen(id, "change", () => updateWysiwygField("avoidQr", checked(id), checked(id) ? "이 문구가 QR을 자동으로 피하도록 설정했습니다." : "이 문구의 QR 자동 회피를 해제했습니다.")));
    listen("labelSheetWysiwygColorMode", "change", () => {
      const custom = value("labelSheetWysiwygColorMode") === "custom";
      updateWysiwygField("color", custom ? value("labelSheetWysiwygColor") || "#111827" : "inherit", custom ? `${WYSIWYG_FIELD_LABELS[wysiwygField]} 색상을 직접 지정합니다.` : `${WYSIWYG_FIELD_LABELS[wysiwygField]} 색상을 자동 대비로 되돌렸습니다.`);
    });
    listen("labelSheetWysiwygColor", "input", () => updateWysiwygField("color", value("labelSheetWysiwygColor"), `${WYSIWYG_FIELD_LABELS[wysiwygField]} 색상을 바꿨습니다.`));
    listen("labelSheetWysiwygX", "change", () => updateWysiwygField("xPercent", numberValue("labelSheetWysiwygX", 0), `${WYSIWYG_FIELD_LABELS[wysiwygField]} 가로 위치를 바꿨습니다.`));
    listen("labelSheetWysiwygY", "change", () => updateWysiwygField("yPercent", numberValue("labelSheetWysiwygY", 0), `${WYSIWYG_FIELD_LABELS[wysiwygField]} 세로 위치를 바꿨습니다.`));
    listen("labelSheetWysiwygWidth", "change", () => updateWysiwygField("widthPercent", numberValue("labelSheetWysiwygWidth", 90), `${WYSIWYG_FIELD_LABELS[wysiwygField]} 문구 영역 너비를 바꿨습니다.`));
    listen("labelSheetWysiwygHeight", "change", () => updateWysiwygField("heightPercent", numberValue("labelSheetWysiwygHeight", 20), `${WYSIWYG_FIELD_LABELS[wysiwygField]} 영역 높이를 바꿨습니다.`));
    ["labelSheetWysiwygQrMode", "labelSheetQuickQrMode"].forEach((id) => listen(id, "change", () => updateWysiwygQrField("layoutMode", value(id), `QR 배치를 ${value(id) === "adaptive" ? "자동 감싸기" : value(id) === "reserved" ? "고정 여백" : "자유 겹침"}으로 바꿨습니다.`)));
    listen("labelSheetWysiwygQrGap", "change", () => updateWysiwygQrField("gapPercent", numberValue("labelSheetWysiwygQrGap", 2), "QR 주변 여백을 바꿨습니다."));
    ["labelSheetWysiwygQrLayer", "labelSheetQuickQrLayer"].forEach((id) => listen(id, "change", () => updateWysiwygQrField("layer", value(id), value(id) === "behind" ? "QR을 문구 아래 레이어로 옮겼습니다." : "QR을 문구 위 레이어로 옮겼습니다.")));
    listen("labelSheetWysiwygResetField", "click", resetWysiwygField);
    listen("labelSheetWysiwygResetLayout", "click", resetWysiwygLayout);
    listen("labelSheetWysiwygPreset", "change", () => {
      const preset = layoutPresets.find((item) => item.id === value("labelSheetWysiwygPreset"));
      if (preset) setControl("labelSheetWysiwygPresetName", preset.name);
      renderLayoutPresetOptions(value("labelSheetWysiwygPreset"));
    });
    listen("labelSheetWysiwygPresetSave", "click", saveWysiwygPreset);
    listen("labelSheetWysiwygPresetApply", "click", applyWysiwygPreset);
    listen("labelSheetWysiwygPresetDelete", "click", deleteWysiwygPreset);
    listen("labelSheetPreviewFrontBtn", "click", () => selectPreviewSide("front"));
    listen("labelSheetPreviewBackBtn", "click", () => selectPreviewSide("back"));
    listen("labelSheetFocusFrontBtn", "click", () => selectPreviewSide("front"));
    listen("labelSheetFocusBackBtn", "click", () => selectPreviewSide("back"));
    listen("labelSheetPagePrev", "click", () => movePreviewPage(-1));
    listen("labelSheetPageNext", "click", () => movePreviewPage(1));
    listen("labelSheetFocusPagePrev", "click", () => movePreviewPage(-1));
    listen("labelSheetFocusPageNext", "click", () => movePreviewPage(1));
    listen("labelSheetRunPreflightBtn", "click", () => runPreflight({ announce: true }));
    listen("labelSheetGeneratePromptBtn", "click", generatePrompts);
    listen("labelSheetPromptMode", "change", renderPromptPage);
    listen("labelSheetPromptPageSelect", "change", () => selectPromptPage(numberValue("labelSheetPromptPageSelect", 0)));
    listen("labelSheetPromptPageSelectBottom", "change", () => selectPromptPage(numberValue("labelSheetPromptPageSelectBottom", 0)));
    listen("labelSheetPromptPrevBtn", "click", () => selectPromptPage(currentPromptPageIndex - 1));
    listen("labelSheetPromptNextBtn", "click", () => selectPromptPage(currentPromptPageIndex + 1));
    listen("labelSheetPromptPrevBottomBtn", "click", () => selectPromptPage(currentPromptPageIndex - 1));
    listen("labelSheetPromptNextBottomBtn", "click", () => selectPromptPage(currentPromptPageIndex + 1));
    listen("labelSheetPromptPageViewTab", "click", () => setPromptResultView("page"));
    listen("labelSheetPromptItemViewTab", "click", () => setPromptResultView("item"));
    listen("labelSheetPromptItemSelect", "change", () => selectPromptItem(numberValue("labelSheetPromptItemSelect", 0)));
    listen("labelSheetPromptItemPrevBtn", "click", () => selectPromptItem(currentPromptItemIndex - 1));
    listen("labelSheetPromptItemNextBtn", "click", () => selectPromptItem(currentPromptItemIndex + 1));
    listen("labelSheetCopyPromptBtn", "click", safeAsync(copyPrompt));
    listen("labelSheetCopyPromptBottomBtn", "click", safeAsync(copyPrompt));
    listen("labelSheetCopyPromptNextBtn", "click", safeAsync(() => copyPrompt({ advance: true })));
    listen("labelSheetCopyPromptNextBottomBtn", "click", safeAsync(() => copyPrompt({ advance: true })));
    listen("labelSheetCopyAllPromptsBtn", "click", safeAsync(copyAllPrompts));
    listen("labelSheetCopyItemPromptBtn", "click", safeAsync(copyItemPrompt));
    listen("labelSheetCopyPageItemsBtn", "click", safeAsync(copyPageItems));
    listen("labelSheetPageImageInput", "change", (event) => {
      pendingPageImageFile = event.target.files?.[0] || null;
      setElementStatus("labelSheetPageImageStatus", pendingPageImageFile ? `${pendingPageImageFile.name} 선택 · 현재 프롬프트 페이지의 글자 없는 A4 배경으로 등록할 수 있습니다.` : "PNG, JPEG, WebP 파일을 선택해 현재 프롬프트 페이지의 배경으로 연결하세요.");
    });
    listen("labelSheetPageImageRegisterBtn", "click", safeAsync(registerPageImage));
    listen("labelSheetExportPngBtn", "click", safeAsync(exportCurrentPage));
    listen("labelSheetExportAllPngBtn", "click", safeAsync(exportAllPagesPng));
    listen("labelSheetExportPdfBtn", "click", safeAsync(exportPdfProject));
    listen("labelSheetPrintBtn", "click", safeAsync(printProject));
    listen("labelSheetPrintCurrentBtn", "click", safeAsync(printCurrentPage));
    listen("labelSheetUseResumeBtn", "click", useResumePoint);
    listen("labelSheetMarkPrintedBtn", "click", markPrintCompleted);
    listen("labelSheetPrintRangeMode", "change", capturePrintJobControls);
    ["labelSheetPrintFrom", "labelSheetPrintTo", "labelSheetPrintCopies"].forEach((id) => listen(id, "change", capturePrintJobControls));
    listen("labelSheetCalibrationBtn", "click", safeAsync(makeCalibrationSheet));
    listen("labelSheetSavePackageBtn", "click", safeAsync(saveProjectPackage));
    listen("labelSheetLoadPackageInput", "change", (event) => safeAsync(loadProjectPackage)(event.target.files?.[0]));
    listen("labelSheetExportLayersBtn", "click", safeAsync(exportLayerPackage));
    listen("labelSheetSampleBtn", "click", fillSample);
    listen("labelSheetResetBtn", "click", resetProject);
  }

  async function initialize() {
    integrateFocusEditorControls();
    initializeCompactHelp();
    layoutPresets = restoreLayoutPresets();
    fillPresetOptions();
    fillVisualStyleOptions();
    setSpecControls(project.spec);
    setSettingsControls();
    const preset = selectedPreset();
    setProductControlsLocked(preset?.editable === false);
    bindEvents();
    renderLayoutPresetOptions();
    syncWysiwygControls();
    renderPromptPage();
    setPromptResultView(promptResultView);
    await assetStore.ready();
    assetStoreReady = true;
    await ensureDefaultAssets();
    syncAssetReferences();
    project.assets = projectAssetMetadata();
    renderAssets();
    renderRecordTable();
    if (isStaticMode()) {
      const button = $("labelSheetGenerateMissingBtn");
      if (button) {
        button.hidden = true;
        button.disabled = true;
        button.title = "정적 배포판에서는 AI 배경 생성을 사용할 수 없습니다.";
      }
      ["labelSheetGenerationDelay", "labelSheetGenerationRetries", "labelSheetGenerationPauseBtn", "labelSheetGenerationStopBtn"].forEach((id) => {
        const element = $(id);
        if (element?.closest(".label-sheet-generation-options")) element.closest(".label-sheet-generation-options").hidden = true;
        else if (element) element.hidden = true;
      });
      setElementStatus("labelSheetGenerationStatus", "정적 배포판에서는 업로드·축소·QR·레이어 ZIP·인쇄를 사용할 수 있습니다.");
    }
    syncProjectFromControls();
    await refreshOutput();
    if (pane.classList.contains("label-sheet-workspace-v2")) {
      updateProgressState("design");
      setFlowShowAll(true, { announce: false });
    } else {
      updateProgressState("intent");
      setFlowShowAll(false, { announce: false });
    }
    const goalLabel = OUTPUT_GOALS[normalizeOutputGoal(project.settings?.outputGoal)].label;
    setStatus(project.records.length
      ? `자동 저장된 프로젝트 ${project.records.length}건을 불러왔습니다.`
      : pane.classList.contains("label-sheet-workspace-v2")
        ? `${goalLabel} 작업대가 준비되었습니다. 샘플 또는 표·CSV 데이터로 바로 시작하세요.`
        : `${goalLabel} 목표를 확인한 뒤 규격 설정부터 진행해 주세요.`);
  }

  const labelSheetApi = Object.freeze({
    getProject: () => ENGINE.toSerializableProject(effectiveProject()),
    getProjectSnapshot: () => {
      syncProjectFromControls();
      return ENGINE.toSerializableProject(project);
    },
    getPagination: () => currentPagination,
    getPromptBundle: () => lastPromptBundle,
    getPromptPages: () => deepClone(lastPromptBundle?.pagePrompts || []),
    getStyleSnapshot: () => deepClone(project.settings?.visualStyleSnapshot || null),
    getLayoutPresets: () => deepClone(layoutPresets),
    assetStore,
    refresh: refreshOutput,
    replaceProject: replaceProjectSnapshot,
    runPreflight: () => runPreflight({ announce: false }),
    assignQrValues: (options = {}) => assignQrValues(options),
    clearQrValues: (options = {}) => clearAssignedQrValues(options),
    resolveQrTemplate: (recordId, side = "front", template = value("labelSheetQrTemplate")) => {
      const record = project.records.find((item) => item.id === recordId);
      return record ? deepClone(resolveQrTemplate(record, side === "back" ? "back" : "front", template)) : null;
    },
    resolveOutputTemplate: (recordId, side = "front", template = "") => {
      const record = project.records.find((item) => item.id === recordId);
      return record ? deepClone(resolveOutputTemplate(record, side === "back" ? "back" : "front", template)) : null;
    },
    loadPayload: loadTransferPayload,
    loadTable: loadTablePayload,
    savePackage: saveProjectPackage,
    exportLayers: exportLayerPackage,
    generatePrompts,
    selectPromptPage: (index) => selectPromptPage(index),
    registerPageImage: (file) => {
      pendingPageImageFile = file;
      return registerPageImage();
    },
    getPrintJob: () => deepClone(project.settings?.printJob || normalizePrintJob()),
    getPrintSelection: () => deepClone(resolvePrintRange(printSheetCount()) || null),
    markPrinted: markPrintCompleted,
    fillSample,
  });
  window.PromptDeckLabelSheet = labelSheetApi;
  window.PromptDeckLabelBridge = Object.freeze({
    version: "1.0",
    send: (payload, options = {}) => loadTransferPayload(payload, { switchTab: true, ...options }),
    sendTable: (text, options = {}) => loadTablePayload(text, { switchTab: true, ...options }),
    getTarget: () => labelSheetApi,
  });
  window.addEventListener("promptdeck:label-sheet-load", (event) => {
    loadTransferPayload(event.detail || {}, { switchTab: true }).then((result) => {
      window.dispatchEvent(new CustomEvent("promptdeck:label-sheet-loaded", { detail: { ok: true, result } }));
    }).catch((error) => {
      setStatus(error.message || "다른 탭의 데이터를 가져오지 못했습니다.", "error");
      window.dispatchEvent(new CustomEvent("promptdeck:label-sheet-loaded", { detail: { ok: false, error: error.message } }));
    });
  });

  initialize().catch((error) => {
    setStatus(error.message || "라벨·티켓 제작 탭을 초기화하지 못했습니다.", "error");
  });
})();
