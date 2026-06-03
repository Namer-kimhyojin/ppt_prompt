function getAllowedOptionsForPageType(key, pageType) {
  if (key !== "content") return OPTIONS[key] || [];
  const allowed = CONTENT_FILTERS[pageType];
  if (!allowed) return OPTIONS.content;
  return OPTIONS.content.filter((item) => allowed.includes(item.text));
}

function getPageRuleForType(pageType) {
  return PAGE_RULES[pageType] || PAGE_RULES.body;
}

function getOptionStorageId(key, item) {
  const token = item?.icon
    ? String(item.icon).toLowerCase()
    : String(item?.text || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "custom";
  return `option:${key}:${token}`;
}

function findOptionById(key, optionId) {
  if (!optionId || typeof optionId !== "string") return null;
  return (OPTIONS[key] || []).find((item) => getOptionStorageId(key, item) === optionId) || null;
}

function normalizeSelectionItem(key, item) {
  if (!item) return null;
  if (typeof item === "string") {
    if (item.startsWith("option:")) return findOptionById(key, item);
    return findOptionByText(key, item);
  }
  if (typeof item === "object" && typeof item.text === "string") {
    return findOptionByText(key, item.text) || item;
  }
  return null;
}

function normalizeSelectionSnapshot(selections = {}) {
  const next = createEmptySelections();
  const migrated = typeof migrateSelectionSnapshotForMece === "function"
    ? migrateSelectionSnapshotForMece(selections)
    : selections;

  Object.keys(next).forEach((key) => {
    const value = migrated[key];
    if (Array.isArray(value)) {
      next[key] = value.map((item) => normalizeSelectionItem(key, item)).filter(Boolean);
      return;
    }
    next[key] = normalizeSelectionItem(key, value);
  });

  return next;
}

function normalizePromptConfigSnapshot(config = {}) {
  return {
    pageType: config.pageType || state.pageType,
    selections: normalizeSelectionSnapshot(config.selections || state.selections),
    colorSystem: { ...DEFAULT_COLOR_SYSTEM, ...(config.colorSystem || state.colorSystem) },
    customRatio: { ...(config.customRatio || state.customRatio) },
    barSettings: { ...state.barSettings, ...(config.barSettings || {}) },
    promptSettings: { ...state.promptSettings, ...(config.promptSettings || {}) },
    bgSolidColor: config.bgSolidColor || state.bgSolidColor,
    promptLineOverrides: clonePromptLineOverrides(config.promptLineOverrides || state.promptLineOverrides),
  };
}

function serializeSelectionSnapshot(selections = {}) {
  const next = {};

  Object.keys(createEmptySelections()).forEach((key) => {
    const value = selections[key];
    if (Array.isArray(value)) {
      next[key] = value.map((item) => getOptionStorageId(key, item)).filter(Boolean);
      return;
    }
    next[key] = value ? getOptionStorageId(key, value) : null;
  });

  return next;
}

function serializePromptConfigSnapshot(config = {}) {
  const normalized = normalizePromptConfigSnapshot(config);
  return {
    pageType: normalized.pageType,
    selections: serializeSelectionSnapshot(normalized.selections),
    colorSystem: { ...normalized.colorSystem },
    customRatio: { ...normalized.customRatio },
    barSettings: { ...normalized.barSettings },
    promptSettings: { ...normalized.promptSettings },
    bgSolidColor: normalized.bgSolidColor,
    promptLineOverrides: clonePromptLineOverrides(normalized.promptLineOverrides),
  };
}

function captureCurrentPromptConfig() {
  return normalizePromptConfigSnapshot({
    pageType: state.pageType,
    selections: state.selections,
    colorSystem: state.colorSystem,
    customRatio: state.customRatio,
    barSettings: state.barSettings,
    promptSettings: state.promptSettings,
    bgSolidColor: state.bgSolidColor,
    promptLineOverrides: state.promptLineOverrides,
  });
}

function applyPromptConfigSnapshot(config) {
  const next = normalizePromptConfigSnapshot(config);
  state.pageType = next.pageType;
  state.selections = next.selections;
  state.colorSystem = { ...next.colorSystem };
  state.customRatio = { ...next.customRatio };
  state.barSettings = { ...next.barSettings };
  state.promptSettings = { ...next.promptSettings };
  state.bgSolidColor = next.bgSolidColor;
  state.promptLineOverrides = clonePromptLineOverrides(next.promptLineOverrides);
  state.promptLineDrafts = {};
  return next;
}

function withPromptConfig(config, userInput, runner) {
  const backup = {
    pageType: state.pageType,
    selections: normalizeSelectionSnapshot(state.selections),
    colorSystem: { ...state.colorSystem },
    customRatio: { ...state.customRatio },
    barSettings: { ...state.barSettings },
    promptSettings: { ...state.promptSettings },
    bgSolidColor: state.bgSolidColor,
    promptLineOverrides: clonePromptLineOverrides(state.promptLineOverrides),
    promptLineDrafts: { ...state.promptLineDrafts },
    promptInputOverride: state.promptInputOverride ? { ...state.promptInputOverride } : null,
  };

  applyPromptConfigSnapshot(config || backup);
  state.promptInputOverride = userInput
    ? {
        content: userInput.content || "",
        designContext: userInput.designContext || "",
        exclusions: userInput.exclusions || "",
      }
    : null;

  try {
    return runner();
  } finally {
    state.pageType = backup.pageType;
    state.selections = backup.selections;
    state.colorSystem = backup.colorSystem;
    state.customRatio = backup.customRatio;
    state.barSettings = backup.barSettings;
    state.promptSettings = backup.promptSettings;
    state.bgSolidColor = backup.bgSolidColor;
    state.promptLineOverrides = backup.promptLineOverrides;
    state.promptLineDrafts = backup.promptLineDrafts;
    state.promptInputOverride = backup.promptInputOverride;
  }
}

function getPromptDiffPageLabel(pageTypeId, lang = "ko") {
  const pageType = PAGE_TYPES.find((item) => item.id === pageTypeId) || PAGE_TYPES[0];
  if (!pageType) return pageTypeId || (lang === "ko" ? "없음" : "None");
  return lang === "ko" ? pageType.text : pageType.en;
}

function formatPromptDiffSelectionValue(key, value, lang = "ko") {
  const empty = lang === "ko" ? "없음" : "None";
  if (Array.isArray(value)) {
    const texts = value.map((item) => item?.text).filter(Boolean);
    return texts.length ? texts.join(", ") : empty;
  }
  if (value && typeof value === "object") {
    return value.text || empty;
  }
  return empty;
}

function formatPromptDiffColorSystem(value, lang = "ko") {
  if (!value) return "Default";
  return [value.primary, value.accent, value.backgroundBlock].filter(Boolean).join(" / ");
}

function formatPromptDiffCustomRatio(value, lang = "ko") {
  if (!value) return lang === "ko" ? "기본 비율" : "Default ratio";
  return `${value.width || 16}:${value.height || 9}`;
}

function formatPromptDiffBarSettings(value, lang = "ko") {
  if (!value) return lang === "ko" ? "기본 바 설정" : "Default bars";
  const header = value.headerEnabled ? `H ${value.headerHeight || 0}px` : "H off";
  const footer = value.footerEnabled ? `F ${value.footerHeight || 0}px` : "F off";
  return `${header} / ${footer}`;
}

function formatPromptDiffPromptSettings(value, lang = "ko") {
  if (!value) return lang === "ko" ? "기본 출력 설정" : "Default prompt settings";
  const tokens = [
    value.addPreamble ? (lang === "ko" ? "역할 지시문 포함" : "Preamble on") : (lang === "ko" ? "역할 지시문 제외" : "Preamble off"),
    value.koreanContent ? "Korean slide text" : "Original slide text",
    value.outputMode === "prose" ? "Prose" : "Block",
  ];
  return tokens.join(", ");
}

function formatPromptDiffOverrides(value, lang = "ko") {
  const count = Object.values(value || {}).filter(Boolean).length;
  return `${count} line overrides`;
}

function diffPromptConfig(baseConfig = {}, targetConfig = {}, lang = "ko") {
  const base = normalizePromptConfigSnapshot(baseConfig || {});
  const target = normalizePromptConfigSnapshot(targetConfig || {});
  const changes = [];
  const pushChange = (key, label, from, to, group = "config") => {
    if (from === to) return;
    changes.push({
      key,
      label,
      group,
      from,
      to,
      summary: `${label}: ${from} -> ${to}`,
    });
  };

  pushChange(
    "pageType",
    lang === "ko" ? "페이지 유형" : "Page Type",
    getPromptDiffPageLabel(base.pageType, lang),
    getPromptDiffPageLabel(target.pageType, lang),
    "pageType"
  );

  Object.keys(createEmptySelections()).forEach((key) => {
    pushChange(
      `selection:${key}`,
      OPTION_META[key]?.label || key,
      formatPromptDiffSelectionValue(key, base.selections[key], lang),
      formatPromptDiffSelectionValue(key, target.selections[key], lang),
      "selection"
    );
  });

  pushChange(
    "colorSystem",
    "Color System",
    formatPromptDiffColorSystem(base.colorSystem, lang),
    formatPromptDiffColorSystem(target.colorSystem, lang)
  );
  pushChange(
    "customRatio",
    lang === "ko" ? "슬라이드 비율" : "Slide Ratio",
    formatPromptDiffCustomRatio(base.customRatio, lang),
    formatPromptDiffCustomRatio(target.customRatio, lang)
  );
  pushChange(
    "barSettings",
    lang === "ko" ? "상하단 바 설정" : "Header/Footer Bars",
    formatPromptDiffBarSettings(base.barSettings, lang),
    formatPromptDiffBarSettings(target.barSettings, lang)
  );
  pushChange(
    "promptSettings",
    lang === "ko" ? "프롬프트 출력 설정" : "Prompt Output Settings",
    formatPromptDiffPromptSettings(base.promptSettings, lang),
    formatPromptDiffPromptSettings(target.promptSettings, lang)
  );
  pushChange(
    "bgSolidColor",
    lang === "ko" ? "단색 배경" : "Solid Background",
    (base.bgSolidColor || "").toUpperCase(),
    (target.bgSolidColor || "").toUpperCase()
  );
  pushChange(
    "promptLineOverrides",
    "Prompt Line Overrides",
    formatPromptDiffOverrides(base.promptLineOverrides, lang),
    formatPromptDiffOverrides(target.promptLineOverrides, lang)
  );

  return {
    changeCount: changes.length,
    changes,
  };
}

function buildPromptIR(config, userInput = {}, lang = "ko") {
  return withPromptConfig(config, userInput, () => {
    const pageType = getCurrentPageType();
    return {
      lang,
      pageType: pageType.id,
      pageLabel: lang === "ko" ? pageType.text : pageType.en,
      promptSettings: { ...state.promptSettings },
      priorityNotes: getPriorityNotes(lang),
      parts: buildPromptParts(lang).map((part) => ({
        label: part.label,
        cls: part.cls,
        text: part.text,
      })),
      userInput: getUserInputParts(),
    };
  });
}

function buildPromptFromConfig(config, userInput = {}, lang = "ko") {
  return withPromptConfig(config, userInput, () => buildFullPrompt(lang));
}

function validatePromptConfig(config, userInput = {}, lang = "ko") {
  return withPromptConfig(config, userInput, () => {
    const conflicts = (typeof getResolvedConflicts === "function" ? getResolvedConflicts() : getConflicts()).map((item) => ({
      keyA: item.a.key,
      keyB: item.b.key,
      message: item.msg,
      messageEn: item.msgEn,
      severity: item.severity === "block" ? "error" : item.severity || "warning",
      action: item.action || "choose-one",
    }));

    const pageType = getCurrentPageType();
    const parts = buildPromptParts(lang);
    const promptText = buildFullPrompt(lang);
    const currentUserInput = getUserInputParts();
    const warnings = [];
    const requiredByPageType = {
      cover: ["mood", "hierarchy"],
      agenda: ["layout", "content"],
      divider: ["hierarchy"],
      body: ["layout", "content"],
      closing: ["content"],
    };

    (requiredByPageType[state.pageType] || []).forEach((key) => {
      if (!hasSelection(key)) {
        warnings.push({
          type: "missing-selection",
          key,
          severity: "warning",
          message: lang === "ko"
            ? `${OPTION_META[key]?.label || key} 항목이 비어 있어 슬라이드 의도가 모호해질 수 있습니다.`
            : `${OPTION_META[key]?.label || key} is empty, so the slide intent may become ambiguous.`,
        });
      }
    });

    if (!currentUserInput.content) {
      warnings.push({
        type: "missing-content",
        key: "userContent",
        severity: "warning",
        message: lang === "ko"
          ? "슬라이드에 표시할 핵심 내용이 비어 있습니다."
          : "The core slide content to render is empty.",
      });
    }

    if (promptText.length > 12000) {
      warnings.push({
        type: "prompt-too-long",
        key: "promptLength",
        severity: "warning",
        message: lang === "ko"
          ? `프롬프트 길이가 ${promptText.length.toLocaleString("ko-KR")}자로 길어 모델 집중도가 흐려질 수 있습니다.`
          : `The prompt is ${promptText.length} characters long and may dilute model focus.`,
      });
    }

    if (parts.length < 3) {
      warnings.push({
        type: "low-structure",
        key: "parts",
        severity: "warning",
        message: lang === "ko"
          ? "프롬프트 구조가 단순해 슬라이드 표현이 평면적으로 나올 수 있습니다."
          : "The prompt structure is too shallow and may lead to flat outputs.",
      });
    }

    const selectedKeys = Object.keys(state.selections).filter((key) => hasSelection(key));
    const ir = {
      lang,
      pageType: pageType.id,
      pageLabel: lang === "ko" ? pageType.text : pageType.en,
      promptSettings: { ...state.promptSettings },
      priorityNotes: getPriorityNotes(lang),
      parts: parts.map((part) => ({
        label: part.label,
        cls: part.cls,
        text: part.text,
      })),
      userInput: currentUserInput,
    };

    const errorConflictCount = conflicts.filter((item) => item.severity === "error").length;

    return {
      ok: errorConflictCount === 0 && warnings.length === 0,
      conflicts,
      warnings,
      summary: {
        pageType: pageType.id,
        pageLabel: lang === "ko" ? pageType.text : pageType.en,
        promptLength: promptText.length,
        partCount: parts.length,
        priorityNoteCount: ir.priorityNotes.length,
        selectedKeyCount: selectedKeys.length,
      },
      ir,
    };
  });
}

window.pptState = state;
window.pptBuildPromptText = buildFullPrompt;
window.pptRenderAll = renderAll;
window.pptConfigApi = {
  PAGE_TYPES,
  OPTIONS,
  OPTION_META,
  SECTION_DEFS,
  DEFAULT_COLOR_SYSTEM,
  COLOR_PRESETS,
  createEmptySelections,
  findOptionById,
  findOptionByText,
  getOptionStorageId,
  getAllowedOptionsForPageType,
  getPageRuleForType,
};
window.PromptDeck = {
  captureCurrentConfig: captureCurrentPromptConfig,
  normalizeConfig: normalizePromptConfigSnapshot,
  serializeConfig: serializePromptConfigSnapshot,
  serializeSelections: serializeSelectionSnapshot,
  diffConfig: diffPromptConfig,
  buildPromptIR,
  buildPromptFromConfig,
  validateConfig: validatePromptConfig,
};
