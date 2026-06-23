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
  let _prevSectionHashes = null; // null = 첫 렌더링, 하이라이트 없음
  let _viewerEditMode = false;   // true = textarea 편집 모드
  let _viewerAnimRafId = null;   // RAF 핸들 — 빠른 연속 변경 시 중복 실행 방지
  // ─────────────────────────────────────────────────────────────

  // ── 프롬프트 엔진 연결 ──────────────────────────────────
  const {
    createPromptSections, renderBasicPrompt, renderReviewPrompt, renderOptimizedPrompt, sanitizePromptForAI,
    conceptPromptPartsFromStyle, applyConceptPartsToState,
    prunePromptLines, finalizePromptLines, resolveConflictLines,
    getAppliedConceptLines, getConceptBridgeLines, getPaletteRoleSplitLines,
    getConceptQualityLines, qrCodePromptLines, buildRoleStatement,
    buildTextLanguageDirective, getRecommendedCompositionDirective,
    shouldSkipOptimizedLine, getConceptAwareAutoDirective, shouldRestrictAiAutoForCurrentInput,
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
    let nextValue = "";
    fallbackValues.forEach((value) => {
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
        next[key] = String(incoming[key]);
      }
    });

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
    next.promptMode = "basic";
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

  function promptModeLabel() {
    if (state.promptMode === "optimized") return "모델 최적화용";
    if (state.promptMode === "basic") return "기본";
    return "검토용";
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
        `출력 모드: ${promptModeLabel()}`,
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
        state[input.dataset.promoField] = input.type === "checkbox" ? String(input.checked) : input.value;
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
      { id: "promotionPromptMode", stateKey: "promptMode", normalize: (value) => "basic" },
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

    root.querySelectorAll("[data-promo-prompt-mode]").forEach((button) => {
      if (button.tagName !== "BUTTON") return;
      button.addEventListener("click", () => {
        state.promptMode = "basic";
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
    
    "brand name", "logo", "logo slot", "participation hashtags", "event title", 
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
    const OPENAI_CHAR_WARN = 3200;
    const OPENAI_CHAR_MAX = 3600;
    const isOpenAIOptimized = isOpenAITargetEngine(state.targetEngine) && state.promptMode === "optimized";
    const isWarn = isOpenAIOptimized
      ? chars >= OPENAI_CHAR_WARN && chars <= OPENAI_CHAR_MAX
      : tokens >= TOKEN_WARN && tokens < TOKEN_OVER;
    const isOver = isOpenAIOptimized
      ? chars > OPENAI_CHAR_MAX
      : tokens >= TOKEN_OVER;
    const pct = Math.min(((isOpenAIOptimized ? chars : tokens) / (isOpenAIOptimized ? OPENAI_CHAR_MAX : TOKEN_MAX)) * 100, 100);

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
      c.textContent = isOpenAIOptimized
        ? `${chars.toLocaleString()} / ${OPENAI_CHAR_MAX.toLocaleString()}자`
        : `${chars.toLocaleString()}자`;
      c.classList.toggle("is-warn", isWarn);
      c.classList.toggle("is-over", isOver);
      c.title = isOpenAIOptimized
        ? "최종 복사 문자열의 유니코드 문자 수(공백·줄바꿈 포함). GPT Image 2 권장 기준 3,600자"
        : "최종 복사 문자열의 유니코드 문자 수(공백·줄바꿈 포함)";
    }
    if (t) {
      t.textContent = `≈ ${tokens.toLocaleString()} 토큰`;
      t.classList.toggle("is-warn", isWarn);
      t.classList.toggle("is-over", isOver);
    }
    if (transfer) {
      if (isOpenAIOptimized) {
        transfer.textContent = "품질 권장 3,600";
        transfer.title = "글자 왜곡 방지와 지시어 정확도 유지를 위해 3,600자 내외의 최적화 압축을 권장합니다.";
      } else if (state.promptMode === "optimized") {
        transfer.textContent = "전체 최적화";
        transfer.title = "현재 대상 엔진은 OpenAI GPT Image가 아니며, 최적화 프롬프트가 빌드되었습니다.";
      } else {
        transfer.textContent = "검토용 전체";
        transfer.title = "Review 모드는 검토용 상세 프롬프트 전체를 표시합니다.";
      }
      transfer.classList.toggle("is-ok", isOpenAIOptimized && !isOver);
      transfer.classList.toggle("is-over", isOpenAIOptimized && isOver);
    }
    if (gaugeFill) {
      gaugeFill.style.width = `${pct.toFixed(1)}%`;
      gaugeFill.title = isOpenAIOptimized
        ? `품질 최적화 권장 기준 ${chars.toLocaleString()} / ${OPENAI_CHAR_MAX.toLocaleString()}자`
        : `예상 토큰 ${tokens.toLocaleString()} / ${TOKEN_MAX.toLocaleString()}`;
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

  function renderPromptViewer(validation) {
    const viewer = $("promotionPromptViewer");
    if (!viewer) return;

    if (state.promptMode === "optimized") {
      const lines = (promptDraft || "").split(/\r?\n/);
      const title = "Optimized Prompt";
      viewer.innerHTML = "<div class=\"promo-viewer-section\">" +
        "<div class=\"promo-viewer-section-title\">" + escapeHtml(title) + "</div>" +
        "<button type=\"button\" class=\"promo-section-edit-btn\" title=\"이 섹션 편집\">Edit</button>" +
        "<button type=\"button\" class=\"promo-section-cancel-btn\" title=\"편집 취소\" style=\"display:none\">Cancel</button>" +
        "<button type=\"button\" class=\"promo-section-copy-btn\" title=\"이 섹션 복사\">Copy</button>" +
        "<div class=\"promo-section-lines-container\">" +
        lines.map((line) => "<div class=\"promo-viewer-line\">" + escapeHtml(line) + "</div>").join("") +
        "</div>" +
        "</div>";
      _prevSectionHashes = null;
      return;
    }

    if (state.promptMode === "basic") {
      const rawPrompt = (promptDraft || "");
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
      _prevSectionHashes = null;
      return;
    }

    const sections = createPromptSections(validation, latestLint);
    const isFirstRender = _prevSectionHashes === null;
    const canHighlight = !_viewerEditMode && !isFirstRender;
    const newHashes = new Map(sections.map((s) => [s.title, s.lines.join("\n")]));

    // 변경된 섹션 타이틀 수집
    const changedTitles = new Set();
    if (canHighlight) {
      sections.forEach((s) => {
        if (_prevSectionHashes.get(s.title) !== newHashes.get(s.title)) {
          changedTitles.add(s.title);
        }
      });
    }

    // is-changed 없이 렌더링 — data-changed 속성으로 마킹
    viewer.innerHTML = sections.map((section) => {
      const linesHtml = section.lines
        .map((line) => "<div class=\"promo-viewer-line\">" + escapeHtml(line) + "</div>")
        .join("");
      const dataAttr = changedTitles.has(section.title) ? " data-changed=\"true\"" : "";
      return "<div class=\"promo-viewer-section\"" + dataAttr + ">" +
        "<div class=\"promo-viewer-section-title\">" + escapeHtml(section.title) + "</div>" +
        "<button type=\"button\" class=\"promo-section-edit-btn\" title=\"이 섹션 편집\">Edit</button>" +
        "<button type=\"button\" class=\"promo-section-cancel-btn\" title=\"편집 취소\" style=\"display:none\">Cancel</button>" +
        "<button type=\"button\" class=\"promo-section-copy-btn\" title=\"이 섹션 복사\">Copy</button>" +
        "<div class=\"promo-section-lines-container\">" + linesHtml + "</div>" +
        "</div>";
    }).join("");

    _prevSectionHashes = newHashes;

    if (_viewerAnimRafId) cancelAnimationFrame(_viewerAnimRafId);
    _viewerAnimRafId = null;

    if (changedTitles.size > 0) {
      _viewerAnimRafId = requestAnimationFrame(() => {
        _viewerAnimRafId = null;
        const els = viewer.querySelectorAll("[data-changed=\"true\"]");
        els.forEach((el) => {
          el.removeAttribute("data-changed");
          el.classList.add("is-changed");
        });
        if (els[0] && !_viewerEditMode) {
          els[0].scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    }
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
      updateStatsBar(preview.value);
    }

    // 섹션 뷰어 항상 갱신 — promptDirty 무관. 뷰어가 숨겨져도 내용 준비.
    renderPromptViewer(validation);

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
    if (section) section.classList.toggle("promo-field-disabled", !enabled && !isEnabled(state.qrEnabled));
  }

  function syncQrCodeUI() {
    const enabled = isEnabled(state.qrEnabled);
    const checkbox = $("promotionQrEnabled");
    const urlWrap = $("promotionQrUrlWrap");
    const urlInput = $("promotionQrUrl");

    if (checkbox) checkbox.checked = enabled;
    if (urlWrap) urlWrap.style.display = enabled ? "" : "none";
    if (urlInput) urlInput.disabled = !enabled;

    const section = $("promotionCtaSection");
    if (section) section.classList.toggle("promo-field-disabled", !isEnabled(state.ctaEnabled) && !enabled);
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
        : "최종 프롬프트를 전송할 이미지 생성 AI 엔진을 지정하면 최적화 형태로 프롬프트를 빌드합니다.";
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

    // variation, kv-placement 동기화 제거

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

    root.querySelectorAll("[data-promo-prompt-mode]").forEach((button) => {
      if (button.tagName !== "BUTTON") return;
      const active = button.dataset.promoPromptMode === state.promptMode;
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
    if (!promptDirty && state.promptMode === "optimized" && isOpenAITargetEngine(state.targetEngine)) {
      return buildPromptPreview(validateState());
    }
    if (preview && typeof preview.value === "string") {
      return preview.value;
    }
    return promptDraft || buildPromptPreview(validateState());
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

    // Normalize for gauge display and prompt (same logic as buildCustomLayoutLines)
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

    const setRaw   = (id, val) => { const el = $(id); if (el) el.textContent = val; };
    const setAlloc = (id, val) => { const el = $(id); if (el) el.textContent = val + "%"; };
    const setWidth = (id, val) => { const el = $(id); if (el) el.style.width = val + "%"; };

    // Raw input values (user's emphasis weight, no % sign)
    setRaw("promotionLayoutWeightTitleVal", tw);
    setRaw("promotionLayoutWeightVisualVal", vw);
    setRaw("promotionLayoutWeightInfoVal", iw);

    // Normalized canvas allocation (%)
    setAlloc("promotionLayoutWeightTitleAlloc", ntw);
    setAlloc("promotionLayoutWeightVisualAlloc", nvw);
    setAlloc("promotionLayoutWeightInfoAlloc", niw);
    setAlloc("promotionLayoutWeightBackgroundVal", nbw);

    // Gauge bars show normalized proportions (always sum to 100%)
    setWidth("promotionLayoutWeightTitleGauge", ntw);
    setWidth("promotionLayoutWeightVisualGauge", nvw);
    setWidth("promotionLayoutWeightInfoGauge", niw);
    setWidth("promotionLayoutWeightBackgroundGauge", nbw);

    // Move background slider thumb to reflect auto-derived allocation
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
    setText("label[for='promotionQualityNotes'] + .gen-config-guide", "Optimized 공통 규칙을 바탕으로 가독성, 대비, 여백, 왜곡 방지 같은 품질 기준을 지정합니다.");
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

  function applyActionCtaQrHierarchy() {
    const section = $("promotionCtaSection");
    if (!section) return;
    section.classList.add("gen-config-group-wide", "promo-action-choice-section");
    section.innerHTML = `
      <div class="promo-action-choice-grid">
        <div class="promo-action-choice-card" id="promotionCtaChoiceCard">
          <div class="gen-config-label-row">
            <label class="gen-config-label" for="promotionCta">엑션버튼(CTA) <span class="promo-field-badge visible">이미지 텍스트</span></label>
            <div class="promo-ai-toggle-header">
              <label class="promo-ai-toggle-switch" title="사용 여부">
                <input type="checkbox" class="promo-ai-toggle-enabled" data-toggle-field="cta" checked />
                <span class="promo-ai-toggle-track"></span>
              </label>
              <div class="promo-ai-mode-btns" id="promotionCtaModeBtns">
                <button type="button" class="promo-ai-mode-btn active" data-toggle-mode="cta" data-mode="ai">AI 자동</button>
                <button type="button" class="promo-ai-mode-btn" data-toggle-mode="cta" data-mode="manual">직접 입력</button>
              </div>
            </div>
          </div>
          <p class="gen-config-guide">사용자가 마지막에 어떤 행동을 하길 원하는지 명확히 적습니다.</p>
          <div id="promotionCtaInput" style="display:none">
            <input id="promotionCta" class="gen-input-text" type="text" data-promo-field="cta" placeholder="예: 지금 신청하기" />
          </div>
          <div id="promotionCtaAiPlaceholder" class="promo-ai-placeholder">AI가 자동으로 생성합니다</div>
        </div>
        <div class="promo-action-choice-card" id="promotionQrChoiceCard">
          <div class="gen-config-label-row">
            <label class="gen-config-label" for="promotionQrEnabled">QR코드 <span class="promo-field-badge instruction">연결 안내</span></label>
            <label class="promo-qr-toggle">
              <input type="checkbox" id="promotionQrEnabled" data-promo-field="qrEnabled" />
              <span>사용</span>
            </label>
          </div>
          <p class="gen-config-guide">실제 연결 가능한 QR코드는 정확히 생성되지 않을 수 있어, 최종 제작 시 실제 QR 이미지를 별도로 삽입하는 것을 권장합니다.</p>
          <div id="promotionQrUrlWrap" class="promo-qr-url-wrap" style="display:none">
            <label class="gen-config-label" for="promotionQrUrl">QR코드 연결 주소</label>
            <input id="promotionQrUrl" class="gen-input-text" type="url" data-promo-field="qrUrl" placeholder="예: https://example.com/apply" />
            <p class="gen-hint">프롬프트에는 QR코드 공간 배정과 안내문구가 추가됩니다.</p>
          </div>
        </div>
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
    applyActionCtaQrHierarchy();
    applyStep5ChoiceTaxonomy();
    loadColorPresets();
    renderColorPresetOptions();
    loadSizePresets();
    renderSizePresetList();
    bindSizeQuickPresets();
    bindSizePresetControls();
    bindTabs();
    bindStaticInputs();
    bindOptimizationControls();
    bindColorPickers();
    bindColorModeControls();
    bindColorClearButtons();
    bindLoadInput();
    bindPromptEditor();
    bindWarningModalEvents();
    const goConceptTab = () => { document.getElementById("tabBtnConceptMixer")?.click(); };
    $("promotionConceptSelectBtn")?.addEventListener("click", goConceptTab);
    $("promotionConceptChangeBtn")?.addEventListener("click", goConceptTab);

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
          textToCopy = lines.length > 0 ? lines.join("\n") : (promptDraft || "");
        }

        const sectionTitleEl = sectionEl.querySelector(".promo-viewer-section-title");
        const sectionTitle = sectionTitleEl ? sectionTitleEl.textContent.trim() : "";
        if (state.promptMode === "basic" && sectionTitle && sectionTitle.startsWith("[")) {
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

            if (state.promptMode === "basic") {
              if (titleText) {
                allSections.push(titleText + "\n" + secLines.join("\n"));
              } else {
                allSections.push(secLines.join("\n"));
              }
            } else if (state.promptMode === "optimized") {
              allSections.push(secLines.join("\n"));
            } else {
              if (titleText) {
                allSections.push("## " + titleText + "\n" + secLines.join("\n"));
              } else {
                allSections.push(secLines.join("\n"));
              }
            }
          });

          let finalPrompt = "";
          if (state.promptMode === "optimized") {
            finalPrompt = allSections.join("\n");
          } else {
            finalPrompt = allSections.join("\n\n");
          }

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
      _prevSectionHashes = null;
    });

    // 섹션 뷰어 편집 모드 토글
    $("promotionViewerToggleBtn")?.addEventListener("click", () => {
      if (_viewerEditMode) {
        // 편집 → 뷰어: 뷰어 내용은 이미 최신 상태이므로 바로 전환
        setViewerMode(false);
        // promptDirty 상태이면 뷰어와 textarea가 다를 수 있으므로 하이라이트 리셋
        if (promptDirty) _prevSectionHashes = null;
      } else {
        // 뷰어 → 편집 모드
        setViewerMode(true);
        const preview = $("promotionPromptPreview");
        if (preview) preview.focus();
      }
    });

    restoreDraft();
    visitedAssetTypes = new Set([state.assetType]);
    syncStaticFields();
    renderTypeFields();
    // 초기 뷰어 모드: promptDirty 복원 상태 기반
    _viewerEditMode = promptDirty;
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

    promptDirty = false;
    syncStaticFields();
    renderPreview();
  };

  init();
})();
