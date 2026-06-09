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
    CONTENT_PROMOTION_STRATEGIES,
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
    STEP3_VISUAL_OPTION_GROUPS,
    STEP3_IDEA_PRESETS,
    ANTI_AI_PRESETS,
    DEFAULT_COLOR_PRESETS,
    TYPE_FIELD_DEFS,
    CONTENT_TYPE_TEMPLATES,
    CONTENT_TYPE_TEMPLATES_EN,
    CONTENT_TYPE_SAMPLE_PROFILES,
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
    escapeHtml, normalizeLines, mergeUniqueLines,
    summarizeDisplayTextPoint, normalizeForbiddenPromptToken,
  } = window.PROMO_UTILS;

  const {
    EN_TOKEN_MAP,
    translateFragment,
    SYSTEM_QUALITY_PHRASES,
    isSystemQualityPhrase,
    splitQualityNoteLines,
  } = window.PROMO_I18N;


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
    return isBasicVisualPlanningMode() && hasBasicConceptPromptInput() && shouldRestrictAiAutoForCurrentInput();
  }

  function isBasicVisualPlanningMode() {
    return state.visualPlanningMode !== "detail";
  }

  function isDetailVisualPlanningMode() {
    return !isBasicVisualPlanningMode();
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

  function visualPlanningModeLabel() {
    return isBasicVisualPlanningMode()
      ? localizeSentence("기본 모드(컨셉 제안 중심)", "Basic mode (concept-suggestion led)")
      : localizeSentence("상세 모드(직접 비주얼 기획)", "Detail mode (manual visual planning)");
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
    next.promptMode = incoming.promptMode === "optimized" ? "optimized" : DEFAULT_STATE.promptMode;
    next.visualPlanningMode = incoming.visualPlanningMode === "detail" ? "detail" : DEFAULT_STATE.visualPlanningMode;
    next.omitEmptyFields = normalizeBooleanSetting(incoming.omitEmptyFields, DEFAULT_STATE.omitEmptyFields);
    next.dedupePromptLines = normalizeBooleanSetting(incoming.dedupePromptLines, DEFAULT_STATE.dedupePromptLines);
    next.autoResolveConflicts = normalizeBooleanSetting(incoming.autoResolveConflicts, DEFAULT_STATE.autoResolveConflicts);
    next.commercialBaseline = ["off", "standard", "premium", "luxury"].includes(incoming.commercialBaseline)
      ? incoming.commercialBaseline
      : DEFAULT_STATE.commercialBaseline;
    next.creativityLevel = ["stable", "balanced", "experimental"].includes(incoming.creativityLevel)
      ? incoming.creativityLevel
      : DEFAULT_STATE.creativityLevel;
    next.colorStrategy = COLOR_STRATEGY_VALUES.includes(incoming.colorStrategy)
      ? incoming.colorStrategy
      : DEFAULT_STATE.colorStrategy;
    next.variationMode = ["none", "typo", "visual", "experimental"].includes(incoming.variationMode)
      ? incoming.variationMode
      : DEFAULT_STATE.variationMode;
    next.conceptInfluenceMode = ["balanced", "strong", "style-only"].includes(incoming.conceptInfluenceMode)
      ? incoming.conceptInfluenceMode
      : DEFAULT_STATE.conceptInfluenceMode;

    ["posterOffer", "snsHook", "snsHashtags", "cta"].forEach((field) => {
      const enabledKey = `${field}Enabled`;
      const modeKey = `${field}Mode`;
      next[enabledKey] = normalizeBooleanSetting(incoming[enabledKey], DEFAULT_STATE[enabledKey]);
      next[modeKey] = incoming[modeKey] === "manual" ? "manual" : DEFAULT_STATE[modeKey];
    });

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
    return state.promptMode === "optimized" ? "모델 최적화용" : "검토용";
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
    if (!forbiddenTokens.includes("이모지 사용 금지")) {
      notes.push("금지 규칙에 `이모지 사용 금지`를 유지하는 것을 권장합니다.");
    }
    if (state.commercialBaseline === "off") {
      notes.push("상업 품질 기준이 꺼져 있어 결과물이 무난한 안내 이미지처럼 보일 수 있습니다.");
    }
    if (!trimValue(state.bigIdea) && !trimValue(state.visualMetaphor) && state.creativityLevel !== "stable") {
      notes.push("창의성 강도를 높였지만 Big Idea 또는 비주얼 은유가 없어 결과 방향이 평범해질 수 있습니다.");
    }
    if (state.variationMode === "none" && state.creativityLevel !== "stable") {
      notes.push("다양성 변형 지시가 꺼져 있어 결과가 기본 템플릿형으로 반복될 수 있습니다. 타이포/비주얼/실험적 중 하나를 선택하면 결과 폭이 넓어집니다.");
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
        `창의성 강도: ${CREATIVITY_LEVEL_PROFILES[state.creativityLevel]?.labelKo || state.creativityLevel}`,
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
              <strong>${escapeHtml(localizeValue(label))}</strong>
              <ul>
                ${messages.map((item) => `<li>${escapeHtml(localizeValue(item))}</li>`).join("")}
              </ul>
            </div>
          `;
        })
        .join("");
    };

    if (!validation.errors.length && !validation.warnings.length) {
      node.innerHTML = `
        <div class="promo-validation-item is-ok">
          <strong>${localizeSentence("입력 상태 양호", "All Inputs Valid")}</strong>
          <span>${localizeSentence("현재 입력으로 프롬프트를 복사하거나 설정을 저장할 수 있습니다.", "You can now copy the prompt or save your configuration with the current inputs.")}</span>
        </div>
      `;
      updateFieldWarningsUI(validation);
      return;
    }

    const blocks = [];
    if (validation.errors.length) {
      blocks.push(`
        <div class="promo-validation-item is-error">
          <strong>${localizeSentence("보완이 필요한 항목", "Required Fixes")}</strong>
          <span>${localizeSentence("아래 항목을 먼저 수정하면 프롬프트 복사와 이미지 품질이 함께 안정됩니다.", "Fix the items below first to stabilize both prompt copying and image quality.")}</span>
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
        if (input.id === "promotionContentType") {
          applyContentTypeTemplate(input.value);
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

  function applyContentTypeTemplate(type) {
    if (!CONTENT_TYPE_VALUES.includes(type)) return;
    state.contentType = type;
    const profile = CONTENT_TYPE_SAMPLE_PROFILES[type] || CONTENT_TYPE_SAMPLE_PROFILES.none;
    const template = CONTENT_TYPE_TEMPLATES[type];

    applySampleProfile(profile);

    if (!template) {
      status("직접 입력 템플릿 예시를 자동으로 적용했습니다.", "info");
      return;
    }

    status(`'${template.name}' 템플릿 예시를 자동으로 적용했습니다.`, "success");
  }

  function bindTemplateCards() {
    root.querySelectorAll("[data-promo-content-type]").forEach((button) => {
      button.addEventListener("click", () => {
        applyContentTypeTemplate(button.dataset.promoContentType);
      });
    });
  }

  function bindOptimizationControls() {
    const selectBindings = [
      { id: "promotionOutputLanguage", stateKey: "outputLanguage", normalize: normalizeOutputLanguage },
      { id: "promotionPromptMode", stateKey: "promptMode", normalize: (value) => value === "optimized" ? "optimized" : "review" },
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

    document.querySelectorAll("[data-promo-variation]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.variationMode = btn.dataset.promoVariation;
        document.querySelectorAll("[data-promo-variation]").forEach((b) => {
          const active = b.dataset.promoVariation === state.variationMode;
          b.classList.toggle("active", active);
          b.setAttribute("aria-pressed", String(active));
        });
        renderPreview();
      });
    });

    root.querySelectorAll("[data-promo-commercial-baseline]").forEach((button) => {
      if (button.tagName !== "BUTTON") return;
      button.addEventListener("click", () => {
        state.commercialBaseline = ["off", "standard", "premium", "luxury"].includes(button.dataset.promoCommercialBaseline)
          ? button.dataset.promoCommercialBaseline
          : DEFAULT_STATE.commercialBaseline;
        syncStaticFields();
        renderPreview();
      });
    });

    root.querySelectorAll("[data-promo-creativity-level]").forEach((button) => {
      if (button.tagName !== "BUTTON") return;
      button.addEventListener("click", () => {
        state.creativityLevel = ["stable", "balanced", "experimental"].includes(button.dataset.promoCreativityLevel)
          ? button.dataset.promoCreativityLevel
          : DEFAULT_STATE.creativityLevel;
        syncStaticFields();
        renderPreview();
      });
    });

    [
      { id: "promotionBigIdea", stateKey: "bigIdea" },
      { id: "promotionVisualMetaphor", stateKey: "visualMetaphor" },
    ].forEach(({ id, stateKey }) => {
      const input = $(id);
      if (!input) return;
      const handler = () => {
        state[stateKey] = input.value;
        renderPreview();
      };
      input.addEventListener("input", handler);
      input.addEventListener("change", handler);
    });

    root.querySelectorAll("[data-promo-output-language]").forEach((button) => {
      if (button.tagName !== "BUTTON") return;
      button.addEventListener("click", () => {
        state.outputLanguage = normalizeOutputLanguage(button.dataset.promoOutputLanguage);
        syncStaticFields();
        renderPreview();
      });
    });

    root.querySelectorAll("[data-promo-prompt-mode]").forEach((button) => {
      if (button.tagName !== "BUTTON") return;
      button.addEventListener("click", () => {
        state.promptMode = button.dataset.promoPromptMode === "optimized" ? "optimized" : "review";
        syncStaticFields();
        renderPreview();
      });
    });

    root.querySelectorAll("[data-promo-visual-planning-mode]").forEach((button) => {
      if (button.tagName !== "BUTTON") return;
      button.addEventListener("click", () => {
        state.visualPlanningMode = button.dataset.promoVisualPlanningMode === "detail" ? "detail" : "basic";
        if (isDetailVisualPlanningMode()) {
          scrubConceptFromDetailPlanningFields();
        }
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

  function reapplyCurrentTemplate() {
    applyContentTypeTemplate(state.contentType);
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
    const entries = [
      ["headline", state.headline],
      ["subheadline", state.subheadline],
      ["bodyCopy", state.bodyCopy],
      ["mandatoryElements", state.mandatoryElements],
    ];

    if (isFieldManualActive("cta")) entries.push(["cta", state.cta]);
    if (isFieldManualActive("posterOffer")) entries.push(["posterOffer", state.posterOffer]);
    if (isFieldManualActive("snsHook")) entries.push(["snsHook", state.snsHook]);
    if (isFieldManualActive("snsHashtags")) entries.push(["snsHashtags", state.snsHashtags]);

    return entries
      .map(([key, value]) => ({
        key,
        label: FIELD_LABELS[key],
        value: normalizeLines(value).join(" / ") || String(value || "").trim(),
      }))
      .filter((entry) => entry.value);
  }

  function instructionEntries() {
    const entries = [
      ["contentType", CONTENT_TYPE_TEMPLATES[state.contentType]?.name || "직접 입력"],
      ["sizeMode", state.sizeMode === "direct" ? "크기 직접 입력" : "비율 설정"],
      [state.sizeMode === "direct" ? "directSize" : "ratio", getSpecificationSummary()],
      ["orientation", getEffectiveOrientation() === "vertical" ? "세로형" : "가로형"],
      ["goal", state.goal],
      ["audience", state.audience],
      ["commercialBaseline", COMMERCIAL_BASELINE_PROFILES[state.commercialBaseline]?.labelKo || state.commercialBaseline],
      ["creativityLevel", CREATIVITY_LEVEL_PROFILES[state.creativityLevel]?.labelKo || state.creativityLevel],
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
      CONTENT_TYPE_TEMPLATES[state.contentType]?.name || "직접 입력",
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

  function prunePromptLines(lines) {
    const base = lines
      .map((line) => trimValue(line))
      .filter(Boolean)
      .filter((line) => !(isEnabled(state.omitEmptyFields) && /미입력|\?:\?|직접 크기 미입력/.test(line)));

    if (!isEnabled(state.dedupePromptLines)) {
      return base;
    }

    const seen = new Set();
    return base.filter((line) => {
      const normalized = line.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }

  const FINAL_PROMPT_CONFLICT_RULES = [
    {
      id: "ai-color-vs-manual",
      test: () => isAiColorStrategy(),
      patterns: [/^메인 색상:/, /^보조 색상:/, /^포인트 색상:/, /^배경 색상:/, /^Primary color:/, /^Secondary color:/, /^Accent color:/, /^Background color:/],
    },
    {
      id: "manual-color-vs-ai",
      test: () => !isAiColorStrategy(),
      patterns: [/AI에게 맡기기/, /Let AI direct both the color palette and the background/],
    },
    {
      id: "concept-style-vs-ai-style",
      test: () => isBasicVisualPlanningMode() && hasBasicConceptPromptInput(),
      patterns: [/^\[AI 자동 생성\] 비주얼 스타일:/, /^\[AI auto-generate\] visual style:/],
    },
    {
      id: "qr-none-vs-qr",
      test: () => !isEnabled(state.qrEnabled),
      patterns: [/QR/i, /QR코드/, /큐알/i],
    },
    {
      id: "hashtags-forbidden",
      test: () => /해시태그 제외|해시태그 본문 노출 금지|no hashtags|exclude hashtags/i.test(state.forbiddenElements),
      patterns: [/해시태그\/태그:/, /hashtags\/tags:/],
    },
  ];

  function isFinalPromptConflictLine(line) {
    if (!isEnabled(state.autoResolveConflicts)) return false;
    return FINAL_PROMPT_CONFLICT_RULES.some((rule) =>
      rule.test() && rule.patterns.some((pattern) => pattern.test(line))
    );
  }

  function finalLinePriority(line) {
    if (/원문 그대로|verbatim|do not translate|철자|숫자|text fidelity|텍스트 정확성/i.test(line)) return 10;
    if (/컨셉-홍보 브리지|Concept-to-campaign bridge|적용된 컨셉|Applied concept|컨셉 Visual DNA|Concept visual DNA/i.test(line)) return 9;
    if (/광고 목적|promotion goal|타깃|target audience|헤드라인|headline/i.test(line)) return 8;
    if (/절대 금지|Strictly avoid|금지|avoid/i.test(line)) return 7;
    if (/품질|quality|가독성|readability/i.test(line)) return 6;
    return 1;
  }

  function normalizeFinalPromptLine(line) {
    return String(line || "")
      .replace(/^[-*]\s*/, "")
      .replace(/\s+/g, " ")
      .replace(/\s*\/\s*/g, " / ")
      .trim()
      .toLowerCase();
  }

  function normalizeFinalPromptConceptFamily(line) {
    const raw = String(line || "").trim();
    const lower = raw.toLowerCase();
    const value = raw.replace(/^[-*]\s*/, "").replace(/^[^:]+:\s*/, "").trim().toLowerCase();
    if (/^(컨셉 기반 홍보 적응|컨셉 홍보 적응|항목 반영 - 홍보 적응|concept campaign adaptation|field mapping - campaign adaptation)/i.test(raw)) {
      return `concept-campaign:${value}`;
    }
    if (/^(컨셉 기반 오브젝트\/은유|컨셉 오브젝트 적응|항목 반영 - 오브젝트\/은유|concept object adaptation|field mapping - object\/metaphor)/i.test(raw)) {
      return `concept-object:${value}`;
    }
    if (/^(컨셉 타이포|컨셉 타이포 지침|항목 반영 - 타이포그래피|concept typography)/i.test(raw)) {
      return `concept-typography:${value}`;
    }
    return lower;
  }

  function finalizePromptLines(lines) {
    const kept = [];
    const seen = new Map();
    lines.forEach((line) => {
      const trimmed = trimValue(line);
      if (!trimmed || isFinalPromptConflictLine(trimmed)) return;
      const key = normalizeFinalPromptLine(trimmed);
      const familyKey = normalizeFinalPromptConceptFamily(trimmed);
      const existingIndex = seen.get(key) ?? seen.get(familyKey);
      if (existingIndex === undefined) {
        seen.set(key, kept.length);
        seen.set(familyKey, kept.length);
        kept.push(trimmed);
        return;
      }
      if (finalLinePriority(trimmed) > finalLinePriority(kept[existingIndex])) {
        kept[existingIndex] = trimmed;
      }
    });
    return kept;
  }

  function resolveConflictLines(lines, lint) {
    if (!isEnabled(state.autoResolveConflicts) || (!lint.conflicts.length && !lint.duplicates.length)) {
      return lines;
    }

    return lines.filter((line) => {
      if (/광택|glossy/i.test(state.qualityNotes) && /플랫 디자인/.test(state.visualStyle) && /광택|glossy/i.test(line)) {
        return false;
      }
      if (/해시태그 제외|해시태그 본문 노출 금지/.test(state.forbiddenElements) && /해시태그\/태그/.test(line)) {
        return false;
      }
      return true;
    });
  }

  function getLocalizedProfileLines(profile) {
    if (!profile) return [];
    if (state.outputLanguage === "en") return [...(profile.linesEn || [])];
    if (state.outputLanguage === "bilingual") {
      return (profile.linesKo || []).map((item, index) => `${item} / ${profile.linesEn?.[index] || item}`);
    }
    return [...(profile.linesKo || [])];
  }

  function stringifyConceptPart(value) {
    if (Array.isArray(value)) {
      return value.map((item) => stringifyConceptPart(item)).filter(Boolean).join("\n");
    }
    if (value && typeof value === "object") {
      return Object.entries(value)
        .map(([key, item]) => {
          const text = stringifyConceptPart(item);
          return text ? `${key}: ${text}` : "";
        })
        .filter(Boolean)
        .join("\n");
    }
    return trimValue(value);
  }

  function conceptPromptPartsFromStyle(style) {
    const structuredCandidate = style?.promptParts || style?.structuredPrompt || style?.promotionPrompt || {};
    const structured = structuredCandidate && typeof structuredCandidate === "object" ? structuredCandidate : {};
    const palette = Array.isArray(style?.palette) ? style.palette.join(", ") : stringifyConceptPart(style?.palette);
    const prompt = stringifyConceptPart(style?.prompt);
    const desc = stringifyConceptPart(style?.desc);
    const tags = Array.isArray(style?.tags) ? style.tags.join(", ") : stringifyConceptPart(style?.tags);
    const category = stringifyConceptPart(style?.category);
    const name = [style?.nameKo, style?.nameEn].filter(Boolean).join(" / ");
    const styleDNA = [name, category, tags].filter(Boolean).join(" / ");
    const sourceText = [name, desc, prompt, tags].filter(Boolean).join("\n");

    const categoryProfiles = {
      game: {
        campaignAdaptation: "게임적 재미는 장식이 아니라 참여 행동을 쉽게 이해시키는 친근한 안내 장치로 번역한다.",
        objectAdaptation: "캐릭터나 게임 요소가 있다면 홍보 주제의 행동을 돕는 마스코트, 미션 배지, 단계형 참여 장면으로 바꾼다.",
        typographyGuidance: "귀여운 장식보다 헤드라인 판독성을 우선하고, 정보는 미션 카드/배지처럼 짧게 묶는다.",
        avoid: "유치한 게임 화면, 과도한 캐릭터 표정, 메시지와 무관한 판타지 오브젝트",
      },
      "3d": {
        campaignAdaptation: "입체감은 홍보 메시지의 구조와 행동 경로를 설명하는 키비주얼 오브젝트로 사용한다.",
        objectAdaptation: "홍보 목적을 상징하는 단일 3D 오브젝트, 아이소메트릭 장면, 깊이감 있는 정보 노드로 변환한다.",
        typographyGuidance: "3D 오브젝트와 텍스트 영역을 분리하고, 헤드라인 주변은 낮은 노이즈의 평면으로 확보한다.",
        avoid: "장난감 같은 과장된 3D, 의미 없는 홀로그램, 텍스트를 가리는 입체 장식",
      },
      modern: {
        campaignAdaptation: "모던 그래픽 언어를 메시지 압축, 정보 위계, 강한 CTA 흐름으로 번역한다.",
        objectAdaptation: "오브젝트보다 타이포그래피, 그리드, 색면, 기하학적 프레임을 중심으로 설계한다.",
        typographyGuidance: "헤드라인 스케일 대비와 여백을 컨셉의 핵심 표현으로 사용한다.",
        avoid: "의미 없는 장식 도형 과밀, 템플릿형 카드 반복, 낮은 대비",
      },
      photo: {
        campaignAdaptation: "사진적 사실감은 홍보 메시지를 실제 상황처럼 믿게 만드는 장면 설계에 사용한다.",
        objectAdaptation: "타깃이 공감할 수 있는 실제 행동, 제품, 장소, 손동작, 현장 분위기로 변환한다.",
        typographyGuidance: "사진 배경 위 텍스트 영역에는 오버레이 또는 깨끗한 여백을 확보한다.",
        avoid: "저해상도 스톡 사진 느낌, 어두운 인물, 텍스트와 배경의 낮은 대비",
      },
      nature: {
        campaignAdaptation: "자연 모티프를 성장, 회복, 순환, 지속가능성, 참여 확산의 은유로 번역한다.",
        objectAdaptation: "잎, 물결, 숲, 빛, 순환 루프 같은 자연 상징을 홍보 행동과 연결한다.",
        typographyGuidance: "자연 질감은 배경과 프레임에 두고 텍스트 영역은 깨끗하게 유지한다.",
        avoid: "복잡한 풍경 사진, 텍스트를 가리는 식물 질감, 주제와 무관한 장식 자연물",
      },
      brand: {
        campaignAdaptation: "브랜드형 컨셉은 신뢰도, 일관된 색상 시스템, 고급 광고 키비주얼 완성도로 번역한다.",
        objectAdaptation: "브랜드명, 로고 자리, CTA, 제품/서비스 상징이 정돈된 광고 레이아웃으로 결합되게 한다.",
        typographyGuidance: "브랜드 헤드라인과 CTA의 대비, 정렬축, 여백을 일관되게 유지한다.",
        avoid: "가짜 로고 생성, 과장된 브랜드 마크, 촌스러운 원색 효과",
      },
      arch: {
        campaignAdaptation: "공간감과 구조미를 홍보 메시지의 안정감, 신뢰감, 참여 동선으로 번역한다.",
        objectAdaptation: "건축·인테리어 요소는 실제 장소 홍보가 아니라 정보가 놓이는 공간, 안내 사인, 책상 위 참여 장면, 깨끗한 프레임으로 바꾼다.",
        typographyGuidance: "절제된 산세리프 계열 타이포와 정렬축을 사용하고, 헤드라인 주변에는 충분한 여백을 둔다.",
        avoid: "부동산·쇼룸 홍보처럼 보이는 공간 중심 이미지, 불가능한 구조, 깨진 원근, 스케일 혼란",
      },
      craft: {
        campaignAdaptation: "수공예 질감은 친근함, 정성, 참여의 온도를 높이는 배경 언어로 번역한다.",
        objectAdaptation: "홍보 주제를 종이 조각, 손작업 오브젝트, 라벨, 스티커, 작은 소품으로 재해석한다.",
        typographyGuidance: "손맛은 장식에만 쓰고 핵심 정보는 읽기 쉬운 정돈된 글자로 유지한다.",
        avoid: "과한 수작업 질감으로 인한 가독성 저하, 지나치게 유아적인 장식",
      },
      illustration: {
        campaignAdaptation: "일러스트 스타일은 메시지를 쉽게 이해시키는 상징 장면과 친근한 키비주얼로 번역한다.",
        objectAdaptation: "홍보 주제를 그려진 오브젝트, 인물 없는 상징 장면, 간단한 아이콘형 소품으로 변환한다.",
        typographyGuidance: "그림체와 어울리되 헤드라인은 선명한 타이포그래피로 분리한다.",
        avoid: "클립아트 느낌, 서로 다른 선화 스타일 혼합, 장식 과밀",
      },
      fashion: {
        campaignAdaptation: "패션 에디토리얼 감성은 프리미엄한 여백, 세련된 크롭, 정제된 무드로 번역한다.",
        objectAdaptation: "의상 자체보다 소재감, 실루엣, 룩북식 배치, 고급 소품 언어를 홍보 주제에 맞게 차용한다.",
        typographyGuidance: "짧고 고급스러운 헤드라인 중심으로 구성하고 본문 정보는 작고 정돈된 레일로 둔다.",
        avoid: "홍보 목적과 무관한 모델 중심 이미지, 어색한 인체, 과한 런웨이 연출",
      },
      food: {
        campaignAdaptation: "음식 스타일은 혜택과 참여 동기를 따뜻하고 즉각적인 감각으로 번역한다.",
        objectAdaptation: "홍보 주제를 접시, 테이블, 패키지, 재료 배치 같은 친숙한 정보 오브젝트로 바꾼다.",
        typographyGuidance: "메뉴판처럼 가격·기간·혜택 정보를 짧고 읽기 쉽게 배열한다.",
        avoid: "식욕만 강조되어 홍보 목적이 사라지는 구성, 과한 광택, 지저분한 테이블",
      },
    };
    const categoryProfile = categoryProfiles[category] || {
      campaignAdaptation: "컨셉의 시각적 특징을 홍보 목적, 타깃, 헤드라인 의미에 맞는 키비주얼로 번역한다.",
      objectAdaptation: "주제와 맞지 않는 오브젝트는 제거하지 말고 같은 스타일 언어의 홍보 상징으로 치환한다.",
      typographyGuidance: "컨셉 장식보다 텍스트 정확성과 CTA 위계를 우선한다.",
      avoid: "컨셉만 보이고 홍보 목적이 사라지는 구성, 텍스트를 가리는 장식",
    };

    const text = sourceText.toLowerCase();
    const derived = {
      visualDNA: state.outputLanguage === "ko"
        ? [styleDNA, desc].filter(Boolean).join(". ")
        : [desc, prompt].filter(Boolean).join("\n"),
      paletteStrategy: palette ? `컨셉 팔레트 전체를 유지하되, 강조색은 CTA와 핵심 정보에 제한적으로 사용한다.\n${palette}` : "",
      textureRendering: /watercolor|paper|collage|grain|texture|clay|glass|metal|oil|pencil|수채|종이|질감|클레이|유리|메탈|색연필/.test(text)
        ? "컨셉 원문에 포함된 재질감과 렌더링 방식을 배경, 키비주얼, 정보 묶음의 표면 처리에 반영한다."
        : "컨셉 원문의 렌더링 방식과 표면 질감을 과하지 않게 유지한다.",
      lightingMood: /light|glow|neon|cinematic|shadow|lighting|광원|조명|네온|빛|그림자/.test(text)
        ? "컨셉 원문의 조명 방향, 명암 대비, 광원 분위기를 유지하되 텍스트 영역은 고대비로 정리한다."
        : "컨셉의 무드에 맞는 조명을 사용하되 헤드라인과 정보 영역은 노이즈 없이 밝기 대비를 확보한다.",
      shapeLanguage: /round|rounded|geometric|line|isometric|pixel|bold|organic|curve|동그란|기하학|라인|곡선|픽셀/.test(text)
        ? "컨셉 원문에 있는 형태 언어를 키비주얼 오브젝트, 배지, 프레임, 정보 노드의 모양에 반복 적용한다."
        : "컨셉의 대표 형태를 키비주얼과 정보 묶음 형태에 반복 적용한다.",
      layoutBehavior: categoryProfile.campaignAdaptation,
      typographyGuidance: categoryProfile.typographyGuidance,
      campaignAdaptation: categoryProfile.campaignAdaptation,
      objectAdaptation: categoryProfile.objectAdaptation,
      avoid: categoryProfile.avoid,
      qualityRules: "선택 컨셉의 특징이 팔레트, 형태, 렌더링, 배경, 정보 묶음 중 최소 세 영역에 보이도록 한다.",
    };

    const pick = (...keys) => keys.map((key) => stringifyConceptPart(structured[key])).find(Boolean) || "";
    return {
      visualDNA: pick("visualDNA", "visualDna", "styleDNA", "styleDna") || derived.visualDNA,
      paletteStrategy: pick("paletteStrategy", "colorSystem", "colors") || derived.paletteStrategy,
      textureRendering: pick("textureRendering", "textureStyle", "renderingStyle", "rendering") || derived.textureRendering,
      lightingMood: pick("lightingMood", "lightingStyle", "mood") || derived.lightingMood,
      shapeLanguage: pick("shapeLanguage", "forms", "formLanguage") || derived.shapeLanguage,
      layoutBehavior: pick("layoutBehavior", "layoutUse", "compositionBehavior") || derived.layoutBehavior,
      typographyGuidance: pick("typographyGuidance", "textStrategy", "typography") || derived.typographyGuidance,
      campaignAdaptation: pick("campaignAdaptation", "campaignUse", "promotionBridge") || derived.campaignAdaptation,
      objectAdaptation: pick("objectAdaptation", "objectStrategy", "metaphorAdaptation") || derived.objectAdaptation,
      avoid: pick("avoid", "negativePrompt", "forbidden") || derived.avoid,
      qualityRules: pick("qualityRules", "quality", "executionRules") || derived.qualityRules,
    };
  }

  function applyConceptPartsToState(parts) {
    state.appliedConceptVisualDNA = stringifyConceptPart(parts.visualDNA);
    state.appliedConceptPaletteStrategy = stringifyConceptPart(parts.paletteStrategy);
    state.appliedConceptTextureRendering = stringifyConceptPart(parts.textureRendering);
    state.appliedConceptLightingMood = stringifyConceptPart(parts.lightingMood);
    state.appliedConceptShapeLanguage = stringifyConceptPart(parts.shapeLanguage);
    state.appliedConceptLayoutBehavior = stringifyConceptPart(parts.layoutBehavior);
    state.appliedConceptTypographyGuidance = stringifyConceptPart(parts.typographyGuidance);
    state.appliedConceptCampaignAdaptation = stringifyConceptPart(parts.campaignAdaptation);
    state.appliedConceptObjectAdaptation = stringifyConceptPart(parts.objectAdaptation);
    state.appliedConceptAvoid = stringifyConceptPart(parts.avoid);
    state.appliedConceptQualityRules = stringifyConceptPart(parts.qualityRules);
  }

  function getContentConceptBridgeOverrides(parts) {
    if (!state.contentType || state.contentType === "none") return {};
    const isInteriorLike = /공간|인테리어|건축|home|interior|architecture|scandinavian|hygge/i.test(
      `${state.appliedConceptName} ${state.appliedConceptCategory} ${parts.visualDNA} ${parts.shapeLanguage}`
    );
    const softSpaceCue = isInteriorLike
      ? "선택 컨셉의 밝은 공간감, 따뜻한 표면, 정돈된 책상/홈오피스/거실 무드를 유지하되"
      : "선택 컨셉의 색감, 형태 언어, 렌더링 무드를 유지하되";
    const surveyObjectCue = isEnabled(state.qrEnabled)
      ? "모바일 설문 카드, 체크리스트, 의견 카드, QR 자리, 작은 식물이나 소품을 메인 오브젝트로 묶어 참여 흐름을 보여준다."
      : "모바일 설문 카드, 체크리스트, 의견 카드, 작은 식물이나 소품을 메인 오브젝트로 묶어 참여 흐름을 보여준다.";
    const surveyLayoutCue = isEnabled(state.qrEnabled)
      ? "헤드라인은 상단 또는 좌측 큰 타이포로 두고, 기간·대상·소요시간·QR 참여는 3~4개의 라운드 배지나 사이드 레일로 정리한다."
      : "헤드라인은 상단 또는 좌측 큰 타이포로 두고, 기간·대상·소요시간·참여 방법은 3~4개의 라운드 배지나 사이드 레일로 정리한다.";
    const eventLayoutCue = isEnabled(state.qrEnabled)
      ? "행사명과 일시는 가장 큰 정보 축으로 두고 장소·신청방법·QR은 보조 정보 레일로 분리한다."
      : "행사명과 일시는 가장 큰 정보 축으로 두고 장소·신청방법·부가 혜택은 보조 정보 레일로 분리한다.";

    const profiles = {
      "survey-request": {
        campaignAdaptation: `${softSpaceCue}, 설문 참여를 부담 없는 3분 일상 행동처럼 느끼게 만드는 친근한 참여 장면으로 번역한다.`,
        objectAdaptation: surveyObjectCue,
        layoutBehavior: surveyLayoutCue,
        typographyGuidance: "정책/설문 문구는 딱딱한 공문서 느낌을 피하고, 짧고 부드러운 안내형 산세리프 타이포로 구성한다.",
        avoid: "부동산·쇼룸 홍보처럼 보이는 공간 중심 이미지, 설문 목적이 사라지는 인테리어 장식 과잉, 작은 본문 난립",
      },
      "event-info": {
        campaignAdaptation: `${softSpaceCue}, 행사 참여를 기대감 있는 일정 안내와 명확한 신청 행동으로 번역한다.`,
        objectAdaptation: "캘린더, 티켓, 입장 패스, 장소 핀, 신청 버튼을 컨셉 스타일의 메인 비주얼로 구성한다.",
        layoutBehavior: eventLayoutCue,
        typographyGuidance: "일시와 장소 숫자는 큰 크기와 고대비로 처리하고, CTA는 한눈에 보이는 버튼형으로 둔다.",
        avoid: "행사 정보보다 배경 장식이 먼저 보이는 구성, 일정/장소 누락, 과밀한 하단 정보 박스",
      },
      "training-info": {
        campaignAdaptation: `${softSpaceCue}, 교육 신청을 성장·기회·실무 역량 향상의 장면으로 번역한다.`,
        objectAdaptation: "노트북, 교재, 성장 계단, 체크 배지, 커리큘럼 카드 등을 컨셉 스타일로 재해석한다.",
        layoutBehavior: "과정명과 모집 마감일을 우선 배치하고, 기간·자격·혜택은 단계형 카드나 세로 레일로 정리한다.",
        typographyGuidance: "과정명은 명확하게, 혜택과 마감일은 배지형 강조로 처리한다.",
        avoid: "복잡한 커리큘럼 표, 어두운 학원 광고 느낌, 성장 메시지와 무관한 장식",
      },
      "biz-promo": {
        campaignAdaptation: `${softSpaceCue}, 지원사업 참여를 신뢰감 있는 기회 제안과 명확한 접수 행동으로 번역한다.`,
        objectAdaptation: "사업 안내 문서, 성장 그래프, 연결 노드, 지원 패키지, 신청 포털을 컨셉 스타일로 구성한다.",
        layoutBehavior: "사업명과 지원 내용을 가장 먼저 읽히게 하고, 대상·기간·방법은 정보 노드로 분리한다.",
        typographyGuidance: "전문적이고 신뢰감 있는 타이포를 사용하되 CTA는 선명한 색상 대비로 강조한다.",
        avoid: "스타트업 클리셰 아이콘 과다, 불명확한 지원 내용, 지나치게 딱딱한 관공서 문서 느낌",
      },
      campaign: {
        campaignAdaptation: `${softSpaceCue}, 캠페인 메시지를 직관적인 상징 행동과 참여 동기로 압축한다.`,
        objectAdaptation: "캠페인 슬로건을 뒷받침하는 하나의 상징 오브젝트와 짧은 참여 라벨을 중심으로 구성한다.",
        layoutBehavior: "슬로건·상징 오브젝트·CTA가 삼각 구도로 읽히게 하고 보조 정보는 최소화한다.",
        typographyGuidance: "슬로건은 가장 큰 타이포로, 참여 행동은 짧은 버튼형 문구로 처리한다.",
        avoid: "상징만 남고 행동 유도가 사라지는 이미지, 장식적 캠페인 포스터 과잉",
      },
    };

    return profiles[state.contentType] || {};
  }

  function getAppliedConceptLines() {
    if (!hasBasicConceptPromptInput()) return [];

    const name = trimValue(state.appliedConceptName);
    const influenceLabel = state.conceptInfluenceMode === "style-only"
      ? localizeSentence("스타일만 적용", "style-only")
      : state.conceptInfluenceMode === "balanced"
        ? localizeSentence("균형 적용", "balanced")
        : localizeSentence("강하게 적용", "strong");

    const styleContractLine = state.conceptInfluenceMode === "style-only"
      ? localizeSentence(
          "위 컨셉은 질감, 조명, 렌더링 방식, 형태 언어에 강하게 적용하고 오브젝트·업종 은유는 현재 홍보 목적에 맞게 새로 설계한다.",
          "Apply the concept strongly to texture, lighting, rendering method, and shape language; redesign objects and industry metaphors to fit the current promotion goal."
        )
      : localizeSentence(
          "위 컨셉은 전체 이미지의 1순위 스타일 기준이다. 단, 특정 오브젝트가 홍보 목적과 충돌하면 같은 질감·조명·형태 언어 안에서 현재 메시지에 맞게 치환한다.",
          "The concept above is the primary style contract governing the whole image. If a specific object conflicts with the promotion goal, replace it within the same texture, lighting, and form language."
        );

    const executionLine = state.conceptInfluenceMode === "balanced"
      ? localizeSentence(
          "광고 메시지와 텍스트 가독성을 먼저 확보한 뒤, 배경·오브젝트·장식에 컨셉 스타일을 일관되게 반영한다.",
          "Secure advertising message clarity and text readability first, then consistently apply the concept style to the background, objects, and decoration."
        )
      : localizeSentence(
          "헤드라인 영역을 제외한 배경, 키비주얼, 장식, 색면, 광원, 질감에서 컨셉의 특징이 즉시 식별될 만큼 분명하게 드러나야 한다.",
          "Outside the headline zone, the background, key visual, decoration, color fields, lighting, and texture must make the concept immediately recognizable."
        );

    // concept-suggest.js가 미리 만든 구조화 프롬프트가 있으면 그대로 사용
    const richPrompt = trimValue(state.appliedConceptPromotionPrompt);
    if (richPrompt) {
      return prunePromptLines([
        styleContractLine,
        richPrompt,
      ]);
    }

    // fallback: 부분 state에서 재조립
    const prompt = trimValue(state.appliedConceptStyle);
    const category = trimValue(state.appliedConceptCategory);
    const visualDNA = compactConceptSummary(state.appliedConceptVisualDNA);
    const textureRendering = trimValue(state.appliedConceptTextureRendering);
    const lightingMood = trimValue(state.appliedConceptLightingMood);
    const shapeLanguage = trimValue(state.appliedConceptShapeLanguage);
    const typographyGuidance = trimValue(state.appliedConceptTypographyGuidance);
    const avoid = trimValue(state.appliedConceptAvoid);
    const label = [name, category ? `${localizeSentence("카테고리", "category")}: ${category}` : ""]
      .filter(Boolean)
      .join(" / ");

    return prunePromptLines([
      label ? `${localizeSentence("적용된 컨셉", "Applied concept")}: ${label}` : "",
      `${localizeSentence("컨셉 적용 강도", "Concept influence")}: ${influenceLabel}`,
      prompt ? `${localizeSentence("소스 스타일 프롬프트", "Source style prompt")}: ${prompt}` : "",
      visualDNA ? `${localizeSentence("컨셉 요약", "Concept summary")}: ${visualDNA}` : "",
      [textureRendering, lightingMood, shapeLanguage].filter(Boolean).length
        ? `${localizeSentence("컨셉 실행 요소", "Concept execution traits")}: ${[textureRendering, lightingMood, shapeLanguage].filter(Boolean).join(" / ")}`
        : "",
      typographyGuidance ? `${localizeSentence("컨셉 타이포", "Concept typography")}: ${typographyGuidance}` : "",
      avoid ? `${localizeSentence("컨셉 회피", "Concept avoid")}: ${avoid}` : "",
      styleContractLine,
      executionLine,
    ]);
  }

  function getConceptBridgeLines() {
    if (!hasBasicConceptPromptInput()) return [];

    const conceptName = trimValue(state.appliedConceptName) || localizeSentence("선택된 컨셉", "the selected concept");
    const goal = trimValue(state.goal || CONTENT_TYPE_TEMPLATES[state.contentType]?.goal || "");
    const audience = trimValue(state.audience || CONTENT_TYPE_TEMPLATES[state.contentType]?.audience || "");
    const headline = trimValue(state.headline);
    const bodyPoints = normalizeLines(state.bodyCopy).slice(0, 3).join(" / ");
    const hasRich = !!trimValue(state.appliedConceptPromotionPrompt);

    if (hasRich) {
      // richPrompt가 스타일·색상·적응 규칙 전부 포함 — 캠페인 입력값 연결만 추가
      return prunePromptLines([
        headline ? localizeSentence(
          `헤드라인 우선: '${headline}'이 컨셉 장식보다 먼저 읽히도록 하고, 컨셉 요소는 헤드라인의 의미를 강화하는 배경·오브젝트·프레임 역할을 한다.`,
          `Headline first: make '${headline}' read before the concept decoration; concept elements reinforce the headline's meaning as background, objects, or framing.`
        ) : "",
        bodyPoints ? localizeSentence(
          `본문 재구성: 본문 포인트 항목을 컨셉 고유의 정보 노드, 배지, 라벨, 오브젝트 주변 캡션으로 재구성하되 원문 의미·숫자·고유명사를 유지한다.`,
          `Body restructure: reorganize the body-point items (see text section) as concept-native information nodes, badges, labels, or captions while preserving the original wording, numbers, and proper nouns.`
        ) : "",
      ]);
    }

    const campaignAdaptation = trimValue(state.appliedConceptCampaignAdaptation);
    const objectAdaptation = trimValue(state.appliedConceptObjectAdaptation);
    const layoutBehavior = trimValue(state.appliedConceptLayoutBehavior);
    const typographyGuidance = trimValue(state.appliedConceptTypographyGuidance);
    const normalizedCampaign = normalizeFinalPromptLine(campaignAdaptation);
    const normalizedObject = normalizeFinalPromptLine(objectAdaptation);
    const normalizedLayout = normalizeFinalPromptLine(layoutBehavior);

    return prunePromptLines([
      localizeSentence(
        `홍보 이미지 적응 원칙: '${conceptName}'의 스타일 언어를 유지하면서, 홍보용 이미지 입력값을 메시지·타깃·행동 유도 기준으로 삼아 장면과 정보 구조를 설계한다.`,
        `Promotion image adaptation principle: preserve the style language of '${conceptName}', while using the promotion-image inputs as the source of truth for message, audience, and conversion structure.`
      ),
      goal ? localizeSentence(
        `홍보 목적 연결: '${goal}'을 컨셉 스타일 안에서 즉시 이해되는 메인 비주얼 행동 또는 상징으로 표현한다.`,
        `Promotion goal connection: express '${localizeValue(goal)}' as an immediately understandable main visual action or symbol within the concept style.`
      ) : "",
      audience ? localizeSentence(
        `타깃 연결: '${audience}'가 유치하거나 동떨어진 이미지로 느끼지 않도록, 컨셉의 장식성보다 설득력·신뢰감·참여 동기를 우선한다.`,
        `Audience connection: make sure '${localizeValue(audience)}' does not perceive the result as childish or off-topic; prioritize persuasion, credibility, and motivation to act over pure decoration.`
      ) : "",
      headline ? localizeSentence(
        `핵심 문구 연결: 헤드라인 '${headline}'이 컨셉 장식보다 먼저 읽히도록 하고, 컨셉 요소는 헤드라인의 의미를 강화하는 배경·오브젝트·프레임 역할을 한다.`,
        `Headline connection: make the headline '${headline}' read before the concept decoration; concept elements should act as background, objects, or frames that reinforce the headline's meaning.`
      ) : "",
      bodyPoints ? localizeSentence(
        `세부 정보 연결: '${bodyPoints}' 같은 본문 포인트는 컨셉의 정보 노드, 배지, 리본, 라벨, 오브젝트 주변 캡션으로 재구성하되 원문 의미를 유지한다.`,
        `Detail connection: reorganize body points such as '${bodyPoints}' as concept-native information nodes, badges, ribbons, labels, or captions around the object while preserving the original meaning.`
      ) : "",
      campaignAdaptation ? `${localizeSentence("항목 반영 - 홍보 적응", "Field mapping - campaign adaptation")}: ${campaignAdaptation}` : "",
      objectAdaptation ? `${localizeSentence("항목 반영 - 오브젝트/은유", "Field mapping - object/metaphor")}: ${objectAdaptation}` : "",
      layoutBehavior && normalizedLayout !== normalizedCampaign && normalizedLayout !== normalizedObject
        ? `${localizeSentence("항목 반영 - 레이아웃", "Field mapping - layout")}: ${layoutBehavior}`
        : "",
      typographyGuidance ? `${localizeSentence("항목 반영 - 타이포그래피", "Field mapping - typography")}: ${typographyGuidance}` : "",
    ]);
  }

  function getPaletteRoleSplitLines() {
    if (!isBasicVisualPlanningMode() || !hasBasicConceptPromptInput() || isAiColorStrategy()) return [];
    const conceptPalette = trimValue(state.appliedConceptPalette);
    const manualColors = [
      state.primaryColor,
      state.secondaryColor,
      state.accentColor,
      state.backgroundColor,
    ].map(trimValue).filter(Boolean);
    if (!conceptPalette || !manualColors.length) return [];
    const conceptColors = conceptPalette.split(/\s*,\s*/).map((item) => item.toLowerCase()).filter(Boolean);
    const allManualColorsFromConcept = manualColors.every((color) => conceptColors.includes(color.toLowerCase()));
    if (allManualColorsFromConcept) return [];
    return prunePromptLines([
      localizeSentence(
        `색상 역할 분리: 사용자가 지정한 색상(${manualColors.join(", ")})은 브랜드 신호, 헤드라인 대비, 행동버튼 강조에 우선 사용하고, 컨셉 팔레트(${conceptPalette})는 배경 질감, 조명, 보조 오브젝트, 정보 묶음의 분위기에 적용한다.`,
        `Palette role split: use the user-specified colors (${manualColors.join(", ")}) first for brand signals, headline contrast, and action-button emphasis; apply the concept palette (${conceptPalette}) to background texture, lighting, supporting objects, and information-group mood.`
      ),
      localizeSentence(
        "두 팔레트가 충돌하면 새 색상을 추가하지 말고, 사용자 색상은 전경/행동 유도에, 컨셉 색상은 후경/공간감에 배치해 같은 이미지 안에서 역할을 분리한다.",
        "If the two palettes conflict, do not add new colors; place user colors in the foreground and action path, and concept colors in the background and spatial mood."
      ),
    ]);
  }

  function shouldRestrictAiAutoForCurrentInput() {
    const bodyLength = String(state.bodyCopy || "").trim().length;
    const manualSignalCount = [
      state.headline,
      state.subheadline,
      state.bodyCopy,
      state.goal,
      state.audience,
      state.mandatoryElements,
    ].filter((value) => trimValue(value)).length;
    return (isBasicVisualPlanningMode() && hasBasicConceptPromptInput()) || state.contentType === "none" || bodyLength >= 80 || manualSignalCount >= 4;
  }

  function isLowRiskAutoField(field) {
    return field === "cta" || field === "posterOffer" || field === "snsHook" || field === "snsHashtags";
  }

  function getConceptAwareAutoDirective(def) {
    return localizeSentence(
      `[AI 자동 생성] ${def.labelKo}: ${def.directiveKo}`,
      `[AI auto-generate] ${def.labelEn}: ${def.directiveEn}`
    );
  }

  function getConceptQualityLines() {
    if (!isBasicVisualPlanningMode() || !hasBasicConceptPromptInput()) return [];
    const hasRich = !!trimValue(state.appliedConceptPromotionPrompt);
    return prunePromptLines([
      // richPrompt의 [Execution Rules]에 이미 포함 — 중복 생략
      !hasRich && state.appliedConceptQualityRules
        ? `${localizeSentence("컨셉 항목별 품질 규칙", "Concept item-level quality rules")}: ${state.appliedConceptQualityRules}`
        : "",
      localizeSentence(
        "컨셉 결합 품질 검사: 최종 이미지를 보고 선택한 컨셉명을 몰라도 해당 컨셉의 팔레트·형태·질감·조명 방향이 느껴져야 한다.",
        "Concept integration quality check: even without knowing the selected concept name, the final image must visibly communicate that concept's palette, form, texture, and lighting direction."
      ),
      localizeSentence(
        "컨셉 과잉 방지: 컨셉 요소가 텍스트 정확성, 헤드라인 판독성, CTA 집중도, 필수 정보 위계를 가리면 안 된다.",
        "Prevent concept overreach: concept elements must not obscure text accuracy, headline readability, action-button focus, or required information hierarchy."
      ),
      localizeSentence(
        "컨셉 누락 방지: 단순히 색상만 바꾸는 수준으로 끝내지 말고, 키비주얼 오브젝트, 정보 묶음, 배경 패턴, 조명 또는 형태 비율 중 최소 두 영역에 컨셉을 구조적으로 반영한다.",
        "Prevent concept underuse: do not stop at changing colors only; structurally apply the concept to at least two areas among key visual object, information grouping, background pattern, lighting, or form proportions."
      ),
    ]);
  }

  function qrCodePromptLines() {
    if (!isEnabled(state.qrEnabled)) return [];
    const qrUrl = String(state.qrUrl || "").trim();
    return prunePromptLines([
      localizeSentence(
        "QR 배치: 선택한 구도에 가장 자연스럽게 어울리는 위치에 QR 자리를 배치한다. 하단 고정은 피하고 스캔 여백을 충분히 확보한다.",
        "QR placement: position the QR slot where it fits the chosen composition most naturally — avoid defaulting to the bottom, and keep enough clear space around it for scan clarity."
      ),
      localizeSentence(
        "실제 스캔 가능한 QR코드를 이미지 생성 모델이 정확히 만들지 못할 수 있으므로, 최종 편집에서 실제 QR 이미지를 삽입할 수 있는 빈 자리 또는 플레이스홀더로 구성한다.",
        "Because the image model may not create a reliably scannable QR code, compose this as a blank slot or placeholder where the real QR image can be inserted during final editing."
      ),
      qrUrl
        ? localizeSentence(
            `QR 연결 주소 참고: ${qrUrl}`,
            `QR target URL reference: ${qrUrl}`
          )
        : "",
      localizeSentence(
        "QR 안내문구: 'QR코드로 바로가기' 또는 'QR로 신청하기'처럼 짧고 읽기 쉬운 안내문구를 QR 영역과 같은 정보 묶음 안에 배치한다.",
        "QR helper text: place a short readable label such as 'Scan the QR code' or 'Apply via QR' within the same information group as the QR area."
      ),
    ]);
  }

  function actionElementLabelKo() {
    return isEnabled(state.qrEnabled)
      ? "행동버튼, QR 자리, 링크 안내 같은 행동 유도 요소"
      : "행동버튼, 링크 안내, 신청/참여 안내 같은 행동 유도 요소";
  }

  function actionElementLabelEn() {
    return isEnabled(state.qrEnabled)
      ? "action button, QR placeholder, link guide, or other conversion element"
      : "action button, link guide, application guide, or other conversion element";
  }

  function createPromptSections(validation, lint) {
    const textEntries = visibleTextEntries();
    const instructionItems = instructionEntries();
    const commercialProfile = COMMERCIAL_BASELINE_PROFILES[state.commercialBaseline] || COMMERCIAL_BASELINE_PROFILES[DEFAULT_STATE.commercialBaseline];
    const creativityProfile = CREATIVITY_LEVEL_PROFILES[state.creativityLevel] || CREATIVITY_LEVEL_PROFILES[DEFAULT_STATE.creativityLevel];
    const promotionStrategyProfile = CONTENT_PROMOTION_STRATEGIES[state.contentType] || CONTENT_PROMOTION_STRATEGIES.none;
    const diversityProfile = CREATIVE_DIVERSITY_PROFILES[state.creativityLevel] || CREATIVE_DIVERSITY_PROFILES.balanced;
    const compositionExcludedKeys = new Set([
      "contentType",
      "sizeMode",
      "ratio",
      "directSize",
      "orientation",
      "forbiddenElements",
      "backgroundMode",
      "backgroundColor",
      "backgroundDetails",
      "primaryColor",
      "secondaryColor",
      "accentColor",
      "qualityNotes",
      "commercialBaseline",
      "creativityLevel",
    ]);

    const targetLines = prunePromptLines([
      `${localizeSentence("산출물 유형", "Asset type")}: ${localizeValue(ASSET_LABELS[state.assetType])}`,
      `${localizeSentence("컨텐츠 유형", "Content template")}: ${localizeValue(CONTENT_TYPE_TEMPLATES[state.contentType]?.name || "직접 입력")}`,
      `${localizeSentence("규격 입력 방식", "Sizing mode")}: ${localizeValue(state.sizeMode === "direct" ? "크기 직접 입력" : "비율 설정")}`,
      state.sizeMode === "direct"
        ? `${localizeSentence("직접 입력 크기", "Exact size")}: ${getPromptSpecificationSummary()}`
        : `${localizeSentence("비율/방향", "Aspect ratio / orientation")}: ${getPromptSpecificationSummary()} / ${localizeValue(getEffectiveOrientation() === "vertical" ? "세로형" : "가로형")}`,
    ]);

    const visualPlanningModeLines = prunePromptLines([
      `${localizeSentence("비주얼 기획 모드", "Visual planning mode")}: ${visualPlanningModeLabel()}`,
      isBasicVisualPlanningMode()
        ? localizeSentence(
            "컨셉 제안에서 적용된 스타일 코어, 색상 시스템, 홍보 적응 규칙을 비주얼 설계의 우선 기준으로 사용한다.",
            "Use the applied concept suggestion's style core, color system, and promotion adaptation rules as the primary basis for visual design."
          )
        : localizeSentence(
            "컨셉 제안의 스타일 코어와 브리지 규칙은 사용하지 않고, 사용자가 3~5번에서 직접 지정한 비주얼 방향, 색상, 품질 제약을 우선한다.",
            "Do not use concept-suggestion style core or bridge rules; prioritize the visual direction, color, and quality constraints manually specified in steps 3 to 5."
          ),
      isBasicVisualPlanningMode() && !hasBasicConceptPromptInput()
        ? localizeSentence(
            "컨셉이 아직 적용되지 않았다면 기본 모드에서도 오류를 내지 말고, 현재 입력값과 공통 광고 품질 규칙만으로 안전하게 생성한다.",
            "If no concept has been applied yet, do not fail in basic mode; safely generate from the current inputs and shared campaign-quality rules."
          )
        : "",
    ]);

    const koreanTextConstraint =
      state.outputLanguage !== "en" && state.outputLanguage !== "bilingual"
        ? [
            localizeSentence(
              "이미지에 렌더링되는 텍스트(헤드라인·서브카피·CTA·오퍼·훅 등)는 사용자가 입력한 원문 언어 그대로 표기한다. 한국어 입력은 한국어로, 영어 입력은 영어로 렌더링하며, AI가 임의로 번역하거나 언어를 전환하지 않는다.",
              "Render all on-image text (headline, sub-copy, CTA, offer, hook, etc.) in exactly the language the user provided — Korean stays Korean, English stays English. Do not translate or switch languages arbitrarily."
            ),
          ]
        : [];

    const activeAntiAiPreset = ANTI_AI_PRESETS.find((p) => p.id === state.antiAiStyle) || null;
    const antiAiForbiddenTokens = activeAntiAiPreset
      ? splitKeywordValues(localizeSentence(activeAntiAiPreset.forbiddenKo, activeAntiAiPreset.forbiddenEn))
      : [];
    const antiAiForbiddenAllLangs = activeAntiAiPreset
      ? [
          ...splitKeywordValues(activeAntiAiPreset.forbiddenKo || ""),
          ...splitKeywordValues(activeAntiAiPreset.forbiddenEn || ""),
        ]
      : [];
    const userForbiddenTokens = splitForbiddenValues(state.forbiddenElements).filter((token) => {
      const norm = token.trim().toLowerCase().replace(/[\s·.,]/g, "");
      return !antiAiForbiddenAllLangs.some((t) => t.trim().toLowerCase().replace(/[\s·.,]/g, "") === norm);
    });
    const mergedForbiddenTokens = [...userForbiddenTokens, ...antiAiForbiddenTokens];

    const defaultHardConstraintLines = [
      localizeSentence(
        "이미지 안 텍스트는 사용자가 제공한 문구와 AI 자동 생성 요청 항목만 사용하고, 임의 문장·가짜 한글·중복 문구·의미 없는 장식 텍스트를 추가하지 않는다.",
        "Use only the user-provided copy and explicitly requested AI-generated copy on the image; do not add arbitrary sentences, fake Korean, duplicated copy, or meaningless decorative text."
      ),
      localizeSentence(
        "이미지 내 모든 텍스트(헤드라인·서브카피·CTA·숫자·날짜)는 벡터급 선명도로 렌더링한다: 배경 색상에 맞는 정교한 안티에일리어싱, 정확한 글리프 형태·자간·철자 유지. 사용자가 제공하지 않은 임의의 문자, 기호, 단어를 추가하지 않는다.",
        "Render all on-image text (headlines, sub-copy, CTA, numbers, dates) with vector-quality sharpness: precise anti-aliasing against the background color, exact glyph shapes, correct letter-spacing, zero spelling errors. Do not add any characters, symbols, or words not present in the user input."
      ),
      localizeSentence(
        "실제 존재하는 기업·기관·정부 로고, 상표, 엠블럼, 워터마크를 임의로 생성하거나 모사하지 않는다. 필요한 경우 깨끗한 빈 자리 또는 중립 플레이스홀더로 남긴다.",
        "Do not invent or imitate real company, institution, government logos, trademarks, emblems, or watermarks. Leave a clean blank area or neutral placeholder if needed."
      ),
      localizeSentence(
        `주요 헤드라인, 핵심 수치, ${actionElementLabelKo()}는 캔버스 가장자리에서 충분히 떨어진 안전영역 안에 배치한다.`,
        `Place key information such as the headline, key numbers, and ${actionElementLabelEn()} inside a safe area with enough margin from the canvas edges.`
      ),
      localizeSentence(
        "결과물은 목업 화면, 포스터를 든 장면, 프레임 안 미리보기, 흰 외부 여백이 아니라 바로 배포 가능한 단일 홍보 이미지여야 한다.",
        "The result must be a single ready-to-use promotion image, not a mockup screen, poster-in-hand scene, framed preview, or image with external white margins."
      ),
    ];

    const hardConstraintLines = prunePromptLines([
      ...koreanTextConstraint,
      ...defaultHardConstraintLines,
      ...(activeAntiAiPreset
        ? [localizeSentence(
            `스타일 제약(${activeAntiAiPreset.labelKo}): ${activeAntiAiPreset.visualHintKo}로 렌더링하라`,
            `Style constraint (${activeAntiAiPreset.labelEn}): render in ${activeAntiAiPreset.visualHintEn}`
          )]
        : []),
      ...mergedForbiddenTokens
        .map(normalizeForbiddenPromptToken)
        .filter(Boolean)
        .map((item) => `${localizeSentence("절대 금지", "Strictly avoid")}: ${localizeValue(item)}`),
    ]);

    const negativePromptLines = (() => {
      const BASE_KO = [
        "흐릿함", "저해상도", "픽셀 깨짐", "JPEG 아티팩트", "노이즈",
        "텍스트 왜곡", "철자 오류", "가짜 글리프", "읽기 어려운 글자",
        "워터마크", "서명", "외부 프레임", "외부 흰 여백", "목업 화면",
        "포스터를 든 장면", "프레임 안 미리보기",
        "과채도", "과노출", "거친 그림자",
        "장난감 같은 3D", "플라스틱 렌더링", "가짜 홀로그램", "네온 번짐",
        "손가락 왜곡", "신체 변형", "팔다리 과잉",
        "의미 없는 장식 텍스트", "임의 추가 텍스트",
        "평면 격리 레이아웃", "공간감 없는 배치",
      ];
      const BASE_EN = [
        "blurry", "low quality", "pixelated", "jpeg artifacts", "noise",
        "text distortion", "misspelled text", "garbled glyphs", "illegible text",
        "watermark", "signature", "outer frame", "white border",
        "mockup", "poster in hand", "framed preview",
        "oversaturated", "overexposed", "harsh shadows",
        "toy-like 3D", "plastic render", "fake hologram", "neon bloom",
        "distorted hands", "anatomical errors", "extra limbs",
        "arbitrary decorative text", "random text overlay",
        "flat isolated layout", "no depth",
      ];
      const userExtra = mergedForbiddenTokens
        .map(normalizeForbiddenPromptToken)
        .filter(Boolean)
        .map((item) => localizeValue(item));
      const antiExtra = activeAntiAiPreset
        ? splitKeywordValues(
            localizeSentence(activeAntiAiPreset.forbiddenKo, activeAntiAiPreset.forbiddenEn)
          )
        : [];
      const extraAll = [...userExtra, ...antiExtra].filter(Boolean);

      if (state.outputLanguage === "en") {
        return prunePromptLines([[...BASE_EN, ...extraAll].join(", ")]);
      }
      if (state.outputLanguage === "bilingual") {
        return prunePromptLines([
          `KO: ${[...BASE_KO, ...extraAll].join(", ")}`,
          `EN: ${[...BASE_EN, ...extraAll].join(", ")}`,
        ]);
      }
      return prunePromptLines([[...BASE_KO, ...extraAll].join(", ")]);
    })();

    const directTextLines = prunePromptLines(
      textEntries.map((entry) => `${localizeValue(entry.label)}: ${localizeValue(entry.value)}`)
    );

    const informationItemLayoutLines = prunePromptLines(
      shouldUseCompactPromptGuidance()
        ? [
            localizeSentence(
              "정보항목은 고정 카드가 아니라 컨셉에 맞는 배지, 라벨, 사이드 레일, 비주얼 내장 텍스트 중 하나로 압축해 배치한다.",
              "Compress information items into one concept-native format such as badges, labels, a side rail, or embedded visual text instead of fixed cards."
            ),
            localizeSentence(
              "사용자가 입력한 문구, 날짜, 숫자는 원문 그대로 유지하되, 화면에는 2~3개 정보 묶음만 남긴다.",
              "Keep user wording, dates, and numbers exact, but leave only 2 to 3 information groups on the image."
            ),
          ]
        : [
            localizeSentence(
              "정보항목 배치: 일정, 자격, 혜택, 마감일, 장소, 신청방법, 연락처 같은 세부사항은 고정 카드가 아니라 자유롭게 조합 가능한 의미 단위로 취급한다.",
              "Information item layout: treat schedule, eligibility, benefits, deadline, location, application method, and contact details as flexible semantic units, not fixed cards."
            ),
            localizeSentence(
              "생성할 때마다 아래 표현 방식 중 정확히 하나 또는 서로 보완되는 두 가지를 선택하고, 선택한 시선 흐름과 레이아웃 구도에 맞춰 정보 묶음 형태를 바꾼다.",
              "For each generation, choose exactly one or two complementary presentation formats below and vary the information grouping according to the selected attention flow and layout composition."
            ),
            ...INFORMATION_ITEM_LAYOUT_VARIANTS.map((option) => localizeSentence(
              `${option.labelKo} — ${option.descKo}`,
              `${option.labelEn} — ${option.descEn}`
            )),
            localizeSentence(
              "일정·자격·혜택·마감일이 함께 있을 때 자동으로 '혜택 카드 3개 + 하단 정보박스 1개'로 나누지 않는다. 네 항목을 동등한 노드, 타임라인, 세로 레일, 대각선 단계, 배지 묶음, 비주얼 내장 라벨 등으로 변주한다.",
              "When schedule, eligibility, benefits, and deadline appear together, do not automatically split them into 'three benefit cards plus one bottom information box.' Vary them as equal nodes, a timeline, a vertical rail, diagonal steps, badge groups, or labels integrated into the visual."
            ),
            localizeSentence(
              "사용자가 입력한 문구, 날짜, 숫자는 원문 그대로 유지하되, 시각적 묶음과 위치는 선택한 구도 전략에 따라 자유롭게 재구성한다.",
              "Keep user-provided wording, dates, and numbers exactly as written, but freely reorganize the visual grouping and placement according to the selected composition strategy."
            ),
          ]
    );

    const mandatoryElementPlacementLines = String(state.mandatoryElements || "").trim()
      ? prunePromptLines([
          localizeSentence(
            "반드시 포함할 요소 배치: 브랜드명, 로고 자리, 주최기관, 필수 문구, 출처, 신청방법 같은 요구 요소를 모두 같은 하단 박스에 몰아넣지 않는다.",
            "Mandatory element placement: do not cluster required elements such as brand name, logo slot, organizer, required phrase, source, or application method into the same bottom box."
          ),
          localizeSentence(
            "각 요소는 시각 위계에 맞는 위치에 분산 배치한다. 코너 태그, 헤더 라벨, 사이드 레일, CTA 인접 배치, 통합 캡션 중 레이아웃 구도에 맞는 방식을 선택한다.",
            "Distribute each required element to the position matching its visual weight. Choose from corner tag, header micro-label, side rail, CTA-adjacent label, or integrated caption — whichever fits the chosen composition."
          ),
          localizeSentence(
            "로고나 실제 기관 마크는 직접 생성하지 말고, 필요한 경우 깨끗한 빈 자리 또는 중립 플레이스홀더로 남긴다.",
            "Do not generate real logos or official marks; leave a clean blank slot or neutral placeholder when needed."
          ),
        ])
      : [];

    const AI_AUTO_FIELD_DEFS = [
      {
        field: "cta",
        labelKo: "엑션버튼(CTA) 문구",
        labelEn: "action button (CTA) copy",
        directiveKo: "엑션버튼(CTA) 문구를 홍보 목적과 핵심 타깃에 맞춰 즉각적인 행동을 유도하는 형태로 생성하라",
        directiveEn: "Generate an action button (CTA) copy that drives immediate action, matched to the promotion goal and target audience",
      },
      {
        field: "posterOffer",
        labelKo: "한 줄 오퍼",
        labelEn: "single-line offer",
        directiveKo: "이미지에 직접 노출될 한 줄 오퍼 문구를 핵심 혜택 중심으로 간결하게 생성하라",
        directiveEn: "Generate a concise single-line offer focused on the core benefit, suitable for direct display on the image",
      },
      {
        field: "snsHook",
        labelKo: "첫 줄 훅",
        labelEn: "opening hook",
        directiveKo: "SNS 피드/스토리에서 즉시 시선을 끌 수 있는 첫 줄 훅 문구를 생성하라",
        directiveEn: "Generate an opening hook that immediately grabs attention in SNS feed or story formats",
      },
      {
        field: "snsHashtags",
        labelKo: "해시태그/태그",
        labelEn: "hashtags/tags",
        directiveKo: "컨텐츠 유형과 홍보 목적에 맞는 해시태그 5~10개를 생성하라",
        directiveEn: "Generate 5 to 10 hashtags matched to the content type and promotion goal",
      },
      {
        field: "tone",
        labelKo: "브랜드 톤",
        labelEn: "brand tone",
        directiveKo: "홍보 목적과 타깃 독자에 맞게 가장 설득력 있고 매력적인 브랜드 톤앤매너(예: 신뢰감, 역동적, 미래지향적 등)를 자동으로 생성하라",
        directiveEn: "Generate a compelling brand tone and voice suitable for the promotion goal and target audience"
      },
      {
        field: "bigIdea",
        labelKo: "핵심 개념(Big Idea)",
        labelEn: "core concept (Big Idea)",
        directiveKo: "메시지와 비주얼을 하나로 관통하는 창의적인 핵심 개념(Big Idea)을 정의하고 프롬프트 전반에 반영하라",
        directiveEn: "Generate a creative core concept (Big Idea) that unifies the campaign message and visual identity"
      },
      {
        field: "visualMetaphor",
        labelKo: "비주얼 은유",
        labelEn: "visual metaphor",
        directiveKo: "핵심 개념을 암시하는 메타포를 고정형 카드/화살표로 수렴시키지 말고, 계단, 상승 그래프, 경로, 열린 문, 연결 노드, 로켓, 다리, 포털처럼 다양한 전문적 은유 중 하나로 생성하라",
        directiveEn: "Generate one diverse professional metaphor for the core concept, such as stairs, rising graphs, paths, open doors, connected nodes, rockets, bridges, or portals; do not converge on generic cards or arrows"
      },
      {
        field: "visualStyle",
        labelKo: "비주얼 스타일",
        labelEn: "visual style",
        directiveKo: "타깃 디자인 룩에 걸맞은 사진 기법, 그래픽 텍스처, 질감 및 비주얼 스타일 지시어를 디테일하게 자동 생성하라",
        directiveEn: "Generate a visual style concept suggestion with detailed style descriptors matching the campaign theme"
      },
      {
        field: "layoutComposition",
        labelKo: "레이아웃 구도 배치",
        labelEn: "layout composition",
        directiveKo: "아래 구성/배치 지시의 Layout composition strategy 선택지 중 하나를 선택하고, 선택한 전략을 우선 적용하라",
        directiveEn: "Select one option from the Layout composition strategy choices in the composition guidance below and prioritize that chosen strategy"
      }
    ];

    const aiAutoLines = prunePromptLines(
      AI_AUTO_FIELD_DEFS
        .filter((def) => {
          if (def.field === "visualMetaphor" || def.field === "layoutComposition") {
            return false;
          }
          if (def.field === "visualStyle" && isBasicVisualPlanningMode() && hasBasicConceptPromptInput()) {
            return false;
          }
          if (shouldRestrictAiAutoForCurrentInput() && !isLowRiskAutoField(def.field)) {
            return false;
          }
          return isEnabled(state[`${def.field}Enabled`]) && state[`${def.field}Mode`] === "ai";
        })
        .map((def) => getConceptAwareAutoDirective(def))
    );

    const conceptAutoAlignmentLines = isBasicVisualPlanningMode() && hasBasicConceptPromptInput()
      ? prunePromptLines([
          shouldRestrictAiAutoForCurrentInput()
            ? localizeSentence(
                "AI 자동생성은 행동버튼 문구와 짧은 한 줄 오퍼 보완에만 사용하고, 선택 컨셉·헤드라인·본문·레이아웃 방향을 새로 만들거나 덮어쓰지 않는다.",
                "Use AI auto-generation only to refine the action-button copy and a short offer line; do not recreate or overwrite the selected concept, headline, body copy, or layout direction."
              )
            : localizeSentence(
                "AI 자동 생성 항목은 적용된 컨셉을 대체하지 않고, 현재 컨셉의 색감·질감·조명·형태 언어 안에서 부족한 문구만 보완한다.",
                "AI auto-generated items must not replace the applied concept; fill only missing copy within the current concept's color, texture, lighting, and shape language."
              ),
        ])
      : [];

    const promotionStrategyLines = prunePromptLines([
      `${localizeSentence("광고 목적", "promotion goal")}: ${localizeValue(state.goal || CONTENT_TYPE_TEMPLATES[state.contentType]?.goal || "직접 입력 목적")}`,
      `${localizeSentence("타깃 대상", "target audience")}: ${localizeValue(state.audience || CONTENT_TYPE_TEMPLATES[state.contentType]?.audience || "직접 입력 대상")}`,
      (isEnabled(state.toneEnabled) && state.toneMode === "manual" && state.tone)
        ? `${localizeSentence("브랜드 톤", "brand tone")}: ${localizeValue(state.tone)}`
        : "",
      ...getLocalizedProfileLines(promotionStrategyProfile),
      localizeSentence(
        "이 이미지는 정보 안내물이 아니라 시선 포획, 메시지 압축, 행동 유도를 수행하는 광고 키비주얼이어야 한다.",
        "This image must function as an advertising key visual that captures attention, compresses the message, and drives action, not as a plain information notice."
      ),
    ]);

    const attentionFlowLines = prunePromptLines(
      shouldUseCompactPromptGuidance()
        ? [
            getRecommendedCompositionDirective(),
            localizeSentence(
              "시선 흐름은 헤드라인 또는 핵심 제안 → 컨셉 키비주얼 → 짧은 정보 묶음 → 행동버튼 순서로 정리한다.",
              "Use the eye flow: headline or core offer → concept key visual → short information groups → action button."
            ),
          ]
        : [
            localizeSentence(
              "생성할 때마다 아래 시선 흐름 패턴 중 정확히 하나를 무작위로 선택하고, 선택한 패턴을 전체 레이아웃의 우선순위로 사용한다.",
              "For each generation, randomly choose exactly one of the attention-flow patterns below and use it as the priority order for the entire layout."
            ),
            ...ATTENTION_FLOW_VARIANTS.map((variant) => {
              const lines = state.outputLanguage === "en" ? variant.linesEn
                : state.outputLanguage === "bilingual"
                  ? variant.linesKo.map((ko, i) => `${ko} / ${variant.linesEn[i] || ko}`)
                  : variant.linesKo;
              return `${localizeSentence(variant.labelKo, variant.labelEn)} — ${lines.join(" → ")}`;
            }),
            localizeSentence(
              "동일한 입력을 다시 생성할 때 이전과 같은 시선 흐름을 반복하지 말고, 정보 중심/비주얼 중심/타이포 중심/증거 중심 사이에서 변주한다.",
              "When regenerating the same input, do not repeat the same eye-flow pattern; vary among information-first, visual-first, typography-first, and proof-first structures."
            ),
            localizeSentence(
              "텍스트 블록은 가능하면 3개 이하로 묶되, 반드시 하단 카드 배열로 고정하지 말고 오버랩 단계, 원형 노드, 비주얼 내부 통합 텍스트 블록 등으로 변주한다.",
              "Keep text blocks to 3 or fewer when possible, but do not lock them into bottom card rows; vary them as overlapping steps, circular nodes, or integrated text blocks inside the main visual."
            ),
          ]
    );

    const commercialLines = prunePromptLines([
      `${localizeSentence("상업 품질 기준", "Commercial baseline")}: ${localizeSentence(commercialProfile.labelKo, commercialProfile.labelEn)}`,
      ...getLocalizedProfileLines(commercialProfile),
    ]);
    const conceptBridgeLines = isBasicVisualPlanningMode() ? getConceptBridgeLines() : [];

    const layoutCompLines = (() => {
      if (!isEnabled(state.layoutCompositionEnabled)) {
        return [];
      }

      if (state.layoutCompositionMode === "ai") {
        return prunePromptLines(
          shouldUseCompactPromptGuidance()
            ? [
                localizeSentence(
                  "Layout composition strategy: 후보를 나열하지 말고 이번 입력에 가장 적합한 단일 구도를 선택해 전체 화면 분할, 정보 묶음, 키비주얼 위치에 일관되게 적용한다.",
                  "Layout composition strategy: do not list candidates; choose one layout best suited to this input and apply it consistently to screen division, information grouping, and key-visual placement."
                ),
                localizeSentence(
                  "중앙 정렬 + 하단 카드 2~3개 조합을 기본값으로 반복하지 않는다.",
                  "Do not repeat the default centered layout with 2 to 3 bottom cards."
                ),
              ]
            : [
                localizeSentence(
                  "Layout composition strategy: 생성할 때마다 아래 전략 중 정확히 하나를 무작위로 선택하고, 선택한 전략명을 내부 기준으로 삼아 전체 구도를 설계한다.",
                  "Layout composition strategy: for each generation, randomly choose exactly one of the strategies below and use the chosen strategy as the internal basis for the whole composition."
                ),
                ...AI_LAYOUT_STRATEGY_OPTIONS.map((option) => localizeSentence(
                  `${option.labelKo} — ${option.descKo}`,
                  `${option.labelEn} — ${option.descEn}`
                )),
                localizeSentence(
                  "중앙 정렬 + 하단 카드 2~3개 조합을 기본값으로 반복하지 말고, 선택한 구도 전략이 화면 분할, 시선 흐름, 정보 묶음 형태에 실제로 드러나게 한다.",
                  "Do not repeat the default centered layout with 2 to 3 bottom cards; make the chosen strategy visibly affect screen division, eye flow, and the way information is grouped."
                ),
              ]
        );
      }

      if (state.layoutCompositionMode !== "manual") {
        return [];
      }

      const compKey = state.layoutComposition || "centered";
      const profile = LAYOUT_COMPOSITION_PROFILES[compKey] || LAYOUT_COMPOSITION_PROFILES.centered;
      const label = localizeSentence(profile.labelKo, profile.labelEn);
      const lines = state.outputLanguage === "en" ? profile.linesEn
        : state.outputLanguage === "bilingual"
          ? profile.linesKo.map((ko, i) => `${ko} / ${profile.linesEn[i] || ko}`)
          : profile.linesKo;
      return [
        `${localizeSentence("레이아웃 구도 배치", "Layout composition")}: ${label}`,
        ...lines
      ];
    })();

    const conceptStyleLine = isBasicVisualPlanningMode() ? getAppliedConceptLines() : [];

    const visualMetaphorDiversityLines = (() => {
      if (!isEnabled(state.visualMetaphorEnabled) || state.visualMetaphorMode !== "ai") {
        return [];
      }

      if (isBasicVisualPlanningMode() && hasBasicConceptPromptInput()) {
        return [];
      }

      return [
        localizeSentence(
          `비주얼 은유: AI 위임 — 고정된 단일 은유를 반복하지 말고, ${AI_VISUAL_METAPHOR_EXAMPLES.join(", ")} 같은 긍정적이고 전문적인 메타포 중 하나를 슬라이드 메시지에 맞게 선택한다.`,
          `Visual metaphor: AI-directed — do not repeat one fixed metaphor; choose a positive professional metaphor suited to the message, such as ${AI_VISUAL_METAPHOR_EXAMPLES.join(", ")}.`
        ),
        localizeSentence(
          "선택한 은유의 형태가 실제 구도에 영향을 주게 한다. 예를 들어 계단은 대각선 진행형, 열린 문은 깊이감 있는 원근형, 네트워크 노드는 방사형/연결형, 상승 그래프는 축 기반 상승 구도를 유도한다.",
          "Let the chosen metaphor influence the actual composition. For example, stairs imply diagonal progression, open doors imply perspective depth, network nodes imply radial/connected structure, and rising graphs imply an upward axis."
        ),
      ];
    })();

    const designLines = prunePromptLines([
      ...layoutCompLines,
      ...(isDetailVisualPlanningMode() ? instructionItems : [])
        .filter((entry) => {
          const visualFields = ["tone", "bigIdea", "visualMetaphor", "visualStyle", "layoutComposition"];
          if (visualFields.includes(entry.key)) {
            const enabled = isEnabled(state[`${entry.key}Enabled`]);
            const isManual = state[`${entry.key}Mode`] === "manual";
            if (!enabled || !isManual) {
              return false;
            }
            if (state.appliedConceptStyle && isConceptGeneratedPromptValue(entry.value)) {
              return false;
            }
          }
          return !compositionExcludedKeys.has(entry.key);
        })
        .map((entry) => `${localizeValue(entry.label)}: ${localizeValue(entry.value)}`),
      ...mandatoryElementPlacementLines,
      ...qrCodePromptLines(),
    ]);

    const creativityLines = prunePromptLines([
      (isDetailVisualPlanningMode() && isEnabled(state.bigIdeaEnabled) && state.bigIdeaMode === "manual" && state.bigIdea) ? `${localizeSentence("핵심 개념", "Core concept")}: ${localizeValue(state.bigIdea)}` : "",
      (isDetailVisualPlanningMode() && isEnabled(state.visualMetaphorEnabled) && state.visualMetaphorMode === "manual" && state.visualMetaphor) ? `${localizeSentence("비주얼 은유", "Visual metaphor")}: ${localizeValue(state.visualMetaphor)}` : "",
      ...visualMetaphorDiversityLines,
      isDetailVisualPlanningMode() ? `${localizeSentence("레이아웃 실험 범위", "Layout experimentation")}: ${localizeSentence(creativityProfile.labelKo, creativityProfile.labelEn)}` : "",
      ...(isDetailVisualPlanningMode() ? getLocalizedProfileLines(creativityProfile) : []),
      ...(isDetailVisualPlanningMode() ? getLocalizedProfileLines(diversityProfile) : []),
      isDetailVisualPlanningMode() ? localizeSentence(
        "본문 포인트는 반드시 동일한 직사각형 카드 2~3개로 만들지 말고, 겹친 단계 카드, 연결 원형 노드, 타임라인 조각, 비주얼 은유 내부 텍스트 블록처럼 서로 다른 정보 묶음 방식을 허용한다.",
        "Do not force body points into the same 2 to 3 rectangular cards; allow diverse information groupings such as overlapping step cards, connected circular nodes, timeline fragments, or text blocks integrated into the visual metaphor."
      ) : "",
      isDetailVisualPlanningMode() ? localizeSentence(
        "'혜택 카드 3개 + 하단 정보박스' 공식을 반복 금지 패턴으로 취급한다. 꼭 필요한 경우가 아니라면 정보항목의 수와 성격에 맞춰 카드 개수, 방향, 밀도, 위치를 매번 다르게 설계한다.",
        "Treat the 'three benefit cards plus bottom information box' formula as an anti-pattern. Unless truly required, vary the number, direction, density, and position of information units according to their count and meaning."
      ) : "",
      isDetailVisualPlanningMode() ? localizeSentence(
        "같은 입력값이라도 매번 동일한 템플릿 구도로 반복하지 말고, 선택한 창의성 강도 안에서 색면, 크롭, 오브젝트 스케일, 정보 카드 형태, 배경 은유 중 일부를 변주한다.",
        "Even with the same inputs, do not repeat the same template composition every time; within the selected creativity level, vary color fields, cropping, object scale, information-card shape, or background metaphor."
      ) : "",
      isDetailVisualPlanningMode() ? localizeSentence(
        "사용 모델이 chaos, stylize, variation 같은 창의성 파라미터를 지원한다면 중간 수준(예: chaos 30~50)을 사용해 메시지는 유지하되 구도와 배치의 예측 가능성을 낮춘다.",
        "If the image model supports creative parameters such as chaos, stylize, or variation, use a medium level (for example chaos 30-50) to preserve the message while reducing predictable composition."
      ) : "",
    ]);

    const backgroundDetailLines = getNonConceptPromptLines(state.backgroundDetails);
    const backgroundDetailsForPrompt = backgroundDetailLines
      .filter((line) => !((isBasicVisualPlanningMode() && hasBasicConceptPromptInput()) && /스타일 배경|전체 색상 팔레트|컨셉 질감|고대비 단색|저노이즈/.test(line)))
      .join("\n");
    const colorLines = prunePromptLines(
      isBasicVisualPlanningMode() && hasBasicConceptPromptInput()
        ? (() => {
            const hasRich = !!trimValue(state.appliedConceptPromotionPrompt);
            if (hasRich) return []; // richPrompt의 [Color System]이 완전히 커버
            return [
              localizeSentence(
                "색상 출처: 컨셉 제안의 Color System을 기본 모드의 색상 기준으로 사용한다.",
                "Color source: use the concept suggestion's Color System as the basic-mode color standard."
              ),
              state.appliedConceptPaletteStrategy
                ? `${localizeSentence("컨셉 색상 전략", "Concept color strategy")}: ${localizeValue(state.appliedConceptPaletteStrategy)}`
                : "",
              state.appliedConceptPalette
                ? `${localizeSentence("컨셉 팔레트", "Concept palette")}: ${localizeValue(state.appliedConceptPalette)}`
                : "",
              localizeSentence(
                "헤드라인, 핵심 정보, 행동버튼은 컨셉 팔레트 안에서 가장 높은 대비를 확보하고, 배경·질감·보조 오브젝트는 팔레트의 낮은 대비 색상으로 정리한다.",
                "Keep the headline, key information, and action button in the highest-contrast colors within the concept palette; use lower-contrast palette colors for background, texture, and supporting objects."
              ),
              localizeSentence(
                "위에 명시된 hex 색상값을 정확히 사용한다. AI가 유사한 다른 색상으로 임의 대체하지 않는다.",
                "Use the hex color values specified above exactly as written. Do not substitute with visually similar alternatives."
              ),
            ];
          })()
        : isAiColorStrategy()
        ? [
            `${localizeSentence("색상/배경 전략", "Color and background strategy")}: ${localizeSentence("색상과 배경 모두 AI에게 맡기기", "Let AI direct both the color palette and the background")}`,
            localizeSentence(
              "브랜드 톤, 컨텐츠 유형, CTA 위계에 맞춰 메인/보조/포인트 색상과 배경 색감, 배경 처리 방식을 AI가 함께 설계한다.",
              "Let the model design the primary, secondary, and accent colors together with the background palette and background treatment to match the brand tone, content type, and CTA hierarchy."
            ),
            localizeSentence(
              "색상 수는 3~4개 이내로 절제하고, 강조색은 한 가지 포인트 컬러만 강하게 사용한다.",
              "Keep the palette restrained to roughly 3 to 4 colors and use a single dominant accent color for emphasis."
            ),
            localizeSentence(
              "배경은 단색, 패턴, 이미지, 혼합 중 가장 적절한 방식을 스스로 고르고 텍스트 가독성을 우선해 정리한다.",
              "Choose the most suitable background treatment among solid, pattern, image-led, or mixed approaches while keeping text readability as the first priority."
            ),
          ]
        : [
            `${localizeSentence("색상 전략", "Color strategy")}: ${localizeSentence("직접 지정", "Manual palette")}`,
            isBasicVisualPlanningMode() && hasBasicConceptPromptInput() ? localizeSentence(
              "색상 출처: 컨셉 제안의 Color System을 홍보 이미지용 메인/보조/포인트/배경 색상으로 변환해 적용한다.",
              "Color source: map the concept suggestion's Color System into promotion-image primary, secondary, accent, and background colors."
            ) : "",
            `${localizeSentence("메인 색상", "Primary color")}: ${localizeValue(state.primaryColor)}`,
            `${localizeSentence("보조 색상", "Secondary color")}: ${localizeValue(state.secondaryColor)}`,
            `${localizeSentence("포인트 색상", "Accent color")}: ${localizeValue(state.accentColor)}`,
            `${localizeSentence("배경 처리 방식", "Background treatment")}: ${localizeValue(backgroundModeLabel(state.backgroundMode))}`,
            state.backgroundColor ? `${localizeSentence("배경 색상", "Background color")}: ${localizeValue(state.backgroundColor)}` : "",
            backgroundDetailsForPrompt ? `${localizeSentence("배경 패턴/이미지 지시", "Background pattern/image guidance")}: ${localizeValue(backgroundDetailsForPrompt)}` : "",
            ...getPaletteRoleSplitLines(),
            localizeSentence(
              "색상과 배경값이 고정되어 있어도 레이아웃을 고정하지 않는다. 동일한 팔레트 안에서 화면 분할, 여백 비율, 오브젝트 크롭, 정보 묶음 방식은 선택된 시선 흐름과 구도 전략에 맞춰 변주한다.",
              "Even when color and background values are fixed, do not lock the layout. Within the same palette, vary screen division, whitespace ratio, object cropping, and information grouping according to the selected attention-flow and composition strategy."
            ),
            localizeSentence(
              "위에 명시된 메인·보조·포인트 색상의 hex 값을 정확히 사용한다. AI가 유사한 다른 색상으로 임의 대체하지 않는다.",
              "Use the hex values for primary, secondary, and accent colors exactly as specified above. Do not substitute with visually similar alternatives."
            ),
          ]
    );

    const compositeQualityLines = [
      localizeSentence(
        "겹쳐지는 레이어 밑에는 부드러운 그림자를 두어 실제 물리적인 깊이감을 형성한다.",
        "Apply subtle drop shadows beneath overlapping layers to establish a realistic sense of physical depth."
      ),
      localizeSentence(
        "글자가 배치되는 뒷배경은 아무런 시각 노이즈가 없는 완전한 평면/단색 상태를 유지하며 복잡한 텍스처는 그래픽 영역에만 허용한다.",
        "Keep the background behind the text clean and plain, reserving complex textures only for the artistic graphic zones."
      ),
      localizeSentence(
        "얕은 피사체 심도(DoF)를 활용해 글자는 아주 또렷하게 표현하고 배경 그래픽 요소는 부드럽게 흐리게 처리한다.",
        "Use slight depth of field to keep the text in sharp focus while making the distant background elements softly out of focus."
      ),
      localizeSentence(
        "중앙 비주얼 오브젝트와 그래픽 요소가 인위적인 둥근 테두리 박스에 갇히지 않도록 하고 전체 배경과 유기적으로 블렌딩(blending)되어야 한다.",
        "Ensure the central visual object and graphic elements are organically blended with the overall background, without being enclosed in an isolated border frame or box."
      ),
      localizeSentence(
        "평평한 격리형 레이아웃을 지양하고, 다층적인 사선 분할이나 오버랩을 활용해 다채롭고 조화로운 공간감을 구현한다.",
        "Avoid flat isolated layouts; implement multi-layered overlapping where elements blend seamlessly across spatial segments for a dynamic sense of depth."
      ),
      localizeSentence(
        "공간 깊이를 세 레이어로 구분한다 — 전경(포커스 대상·CTA·핵심 텍스트) / 중경(보조 비주얼·컨셉 키비주얼) / 원경(배경 분위기·컬러워시·질감). 각 레이어 간 깊이 차이를 명확히 표현한다.",
        "Structure the visual space across three depth layers — foreground (focal subject, CTA, key text) / midground (supporting visual, concept key visual) / background (atmosphere, color wash, texture). Make the depth separation between layers visually distinct."
      ),
    ];

    const qualityNoteLines = getNonConceptPromptLines(state.qualityNotes);
    const qualityLines = prunePromptLines([
      ...getDefaultQualityTagLines(),
      ...compositeQualityLines,
      ...getConceptQualityLines(),
      ...splitQualityNoteLines(qualityNoteLines.join("\n")).map((item) => localizeValue(item)),
    ]);

    const variationLines = (() => {
      const seed = VARIATION_SEEDS.find((s) => s.id === state.variationMode);
      if (!seed) return [];
      const label = localizeSentence(seed.labelKo, seed.labelEn);
      const lines = state.outputLanguage === "en" ? seed.linesEn
        : state.outputLanguage === "bilingual"
          ? seed.linesKo.map((ko, i) => `${ko} / ${seed.linesEn[i] || ko}`)
          : seed.linesKo;
      return prunePromptLines([
        localizeSentence(`비주얼 구성 방향: ${label}`, `Visual composition direction: ${label}`),
        ...lines,
      ]);
    })();

    const sections = [
      { priority: 10, title: localizeHeading("출력 대상", "Output target"), lines: targetLines },
      { priority: 15, title: localizeHeading("광고 전략", "Promotion strategy"), lines: promotionStrategyLines },
      { priority: 17, title: localizeHeading("비주얼 컨셉", "Visual concept"), lines: conceptStyleLine },
      { priority: 18, title: localizeHeading("캠페인 적응 지시", "Campaign adaptation"), lines: conceptBridgeLines },
      // 이미지 원문 텍스트: 컨셉 직후 배치 — 무엇을 보여줄지 확정 후 나머지 규칙 적용
      { priority: 20, title: localizeHeading("이미지 원문 텍스트", "On-image copy"), lines: [...directTextLines, ...informationItemLayoutLines] },
      // AI 생성 지시: 텍스트 확정 후 — 무엇을 생성할지 알고 난 뒤 규칙 진입
      { priority: 28, title: localizeHeading("AI 생성 지시", "AI generation tasks"), lines: [...aiAutoLines, ...conceptAutoAlignmentLines] },
      { priority: 35, title: localizeHeading("상업 품질 기준", "Commercial baseline"), lines: commercialLines },
      { priority: 40, title: localizeHeading("금지 조건", "Prohibited elements"), lines: hardConstraintLines },
      { priority: 45, title: localizeHeading("시선 흐름", "Attention flow"), lines: attentionFlowLines },
      { priority: 50, title: localizeHeading("레이아웃 구성", "Layout & composition"), lines: resolveConflictLines(designLines, lint) },
      { priority: 60, title: localizeHeading("비주얼 방향성", "Visual direction"), lines: creativityLines },
      { priority: 65, title: localizeHeading("비주얼 구성 방향", "Visual composition direction"), lines: variationLines },
      { priority: 70, title: localizeHeading("색상 시스템", "Color system"), lines: colorLines },
      { priority: 80, title: localizeHeading("이미지 품질 기준", "Image quality standards"), lines: qualityLines },
      { priority: 90, title: localizeHeading("제외할 표현", "Negative prompt"), lines: negativePromptLines },
    ];

    const seenLines = new Set();
    return sections
      .map((section) => ({
        ...section,
        lines: finalizePromptLines(section.lines).filter((line) => {
          const normalized = normalizePromptLineForDedupe(line);
          if (!normalized || seenLines.has(normalized)) return false;
          seenLines.add(normalized);
          return true;
        }),
      }))
      .filter((section) => section.lines.length > 0);
  }

  function buildTextLanguageDirective() {
    // 영문 전용 또는 한영 병기 모드에서는 언어 강제 규칙을 삽입하지 않는다
    if (state.outputLanguage === "en" || state.outputLanguage === "bilingual") return "";
    return localizeSentence(
      "이미지 안에 렌더링되는 텍스트(헤드라인, 서브카피, CTA, 본문 포인트 등)는 사용자가 입력한 원문 언어 그대로 표기한다. 입력값이 한국어이면 한국어로, 영어이면 영어로 렌더링하고, AI가 임의로 번역하거나 다른 언어로 전환하지 않는다. 해시태그는 입력된 언어와 표기 방식을 유지한다.",
      "Render all on-image text (headline, sub-copy, CTA, body points, etc.) exactly in the language the user provided — Korean stays Korean, English stays English. Do not translate or switch languages arbitrarily. Hashtags follow the same rule and retain their original language and format."
    );
  }

  function buildRoleStatement() {
    const contentName = state.contentType !== "none"
      ? localizeSentence(
          CONTENT_TYPE_TEMPLATES[state.contentType]?.name || "",
          CONTENT_TYPE_TEMPLATES_EN[state.contentType]?.name || ""
        )
      : "";
    const assetLabel = localizeSentence(ASSET_LABELS[state.assetType], ASSET_PROMPT_TARGET_EN[state.assetType] || ASSET_LABELS[state.assetType]);
    const langDirective = buildTextLanguageDirective();
    const goalValue = trimValue(state.goal || CONTENT_TYPE_TEMPLATES[state.contentType]?.goal || "");
    const audienceValue = trimValue(state.audience || CONTENT_TYPE_TEMPLATES[state.contentType]?.audience || "");
    const missionBits = [
      goalValue ? localizeSentence(`목적: ${goalValue}`, `goal: ${goalValue}`) : "",
      audienceValue ? localizeSentence(`타깃: ${audienceValue}`, `audience: ${audienceValue}`) : "",
    ].filter(Boolean).join(" / ");
    const conceptDirective = isBasicVisualPlanningMode() && hasBasicConceptPromptInput()
      ? localizeSentence(
          ` 아래 홍보 전략 섹션의 목적·타깃이 메시지 기준이다. 적용된 컨셉은 선택 사항이 아니라 결과물의 시각 DNA로 사용한다. 텍스트 정확성·헤드라인 판독성·CTA 집중도는 어떤 컨셉 요소보다 우선한다.`,
          ` The Promotion strategy section below defines the campaign mission and target audience. The applied concept is the visual DNA — not optional. Text accuracy, headline readability, and CTA focus take priority over any concept element.`
        )
      : "";
    if (contentName) {
      return localizeSentence(
        `아래 지시에 따라 [${contentName}] 목적의 ${assetLabel}를 생성하라. 상업 광고 수준의 완성도, 텍스트 정확성, 레이아웃 위계, 브랜드 일관성을 동시에 충족해야 한다.${conceptDirective}${langDirective ? ` ${langDirective}` : ""}`,
        `Generate a ${assetLabel} for [${contentName}] following the instructions below. It must achieve campaign-grade commercial polish, exact text fidelity, strong layout hierarchy, and brand consistency at the same time.${conceptDirective}${langDirective ? ` ${langDirective}` : ""}`
      );
    }
    return localizeSentence(
      `아래 지시에 따라 ${assetLabel}를 생성하라. 상업 광고 수준의 완성도, 텍스트 정확성, 레이아웃 위계, 브랜드 일관성을 동시에 충족해야 한다.${conceptDirective}${langDirective ? ` ${langDirective}` : ""}`,
      `Generate a ${assetLabel} following the instructions below. It must achieve campaign-grade commercial polish, exact text fidelity, strong layout hierarchy, and brand consistency at the same time.${conceptDirective}${langDirective ? ` ${langDirective}` : ""}`
    );
  }

  function getRecommendedCompositionDirective() {
    const bodyCount = normalizeLines(state.bodyCopy).length;
    if (state.contentType === "survey-request") {
      return localizeSentence(
        isEnabled(state.qrEnabled)
          ? "이번 입력의 추천 구도는 타이포그래피 중심 정보형이다. 큰 헤드라인과 짧은 참여 동기를 먼저 읽히게 하고, 기간·대상·소요시간·QR 참여는 작은 배지나 사이드 레일로 정리한다."
          : "이번 입력의 추천 구도는 타이포그래피 중심 정보형이다. 큰 헤드라인과 짧은 참여 동기를 먼저 읽히게 하고, 기간·대상·소요시간·참여 방법은 작은 배지나 사이드 레일로 정리한다.",
        isEnabled(state.qrEnabled)
          ? "For this input, use a typography-led information composition. Make the large headline and short participation motive read first, then organize period, audience, duration, and QR participation as small badges or a side rail."
          : "For this input, use a typography-led information composition. Make the large headline and short participation motive read first, then organize period, audience, duration, and participation method as small badges or a side rail."
      );
    }
    if (state.contentType === "event-info") {
      return localizeSentence(
        isEnabled(state.qrEnabled)
          ? "이번 입력의 추천 구도는 분할 화면 정보형이다. 행사명·일시·장소를 가장 먼저 읽히게 하고, 신청/QR/부가 혜택은 보조 정보 레일로 분리한다."
          : "이번 입력의 추천 구도는 분할 화면 정보형이다. 행사명·일시·장소를 가장 먼저 읽히게 하고, 신청 방법과 부가 혜택은 보조 정보 레일로 분리한다.",
        isEnabled(state.qrEnabled)
          ? "For this input, use a split-screen information composition. Make event title, date, and venue read first, then separate application, QR, and supporting benefits into a secondary information rail."
          : "For this input, use a split-screen information composition. Make event title, date, and venue read first, then separate application method and supporting benefits into a secondary information rail."
      );
    }
    if (bodyCount >= 4) {
      return localizeSentence(
        "이번 입력의 추천 구도는 헤드라인 분리형 사이드 정보 레일이다. 본문 정보가 많으므로 세부 항목은 한쪽 레일에 촘촘히 묶고, 헤드라인과 메인 비주얼 영역은 크게 분리한다.",
        "For this input, use a headline-separated side information rail. Because there are many body details, group details densely in one side rail while reserving a large separate headline and main-visual zone."
      );
    }
    return localizeSentence(
      "이번 입력의 추천 구도는 타이포그래피 중심 키비주얼이다. 헤드라인과 행동 유도 요소를 가장 큰 시선축으로 두고, 컨셉 오브젝트는 메시지를 보조하는 한 개의 상징으로 제한한다.",
      "For this input, use a typography-led key visual. Treat the headline and action prompt as the largest eye-flow axis, and limit concept objects to one symbol that supports the message."
    );
  }

  function shouldSkipOptimizedLine(line) {
    const trimmed = String(line || "").trim();
    return /^(패턴 [A-D]|Pattern [A-D]|타임라인 리본|세로 마일스톤|방사형 정보|대각선 스텝|사이드 정보|배지 스택|비주얼 내장|컴팩트 표|Asymmetrical axis|Split-screen|Typography-led|Radial composition|Diagonal progression)/.test(trimmed)
      || /생성할 때마다 아래|For each generation|무작위로 선택|randomly choose|정확히 하나 또는 서로 보완|one or two complementary/i.test(trimmed)
      || /동일한 입력을 다시 생성|When regenerating the same input|같은 입력값이라도|Even with the same inputs/i.test(trimmed)
      || /chaos|stylize|variation|혜택 카드 3개|three benefit cards/i.test(trimmed)
      || /아래 표현 방식|presentation formats below|아래 시선 흐름|attention-flow patterns below/i.test(trimmed);
  }


  function renderReviewPrompt(validation, lint) {
    const sections = createPromptSections(validation, lint);
    const intro = [
      `# ${localizeHeading("홍보이미지 생성 프롬프트", "Promotion Image Generation Prompt")}`,
      "",
      `## ${localizeHeading("생성 지시", "Generation directive")}`,
      buildRoleStatement(),
    ];

    const sectionLines = sections.flatMap((section) => [
      "",
      `## ${section.title}`,
      ...finalizePromptLines(section.lines.flatMap((line) => line.split(/\r?\n/)))
        .map((line) => {
          const t = line.trim();
          if (/^\[.+\]$/.test(t)) return `### ${t.slice(1, -1)}`;
          return `- ${t.replace(/^-\s*/, "")}`;
        }),
    ]);

    const footer = [
      "",
      `## ${localizeHeading("적용 우선순위", "Priority order")}`,
      localizeSentence("- 이미지 내 텍스트 언어 규칙 및 금지 조건 준수", "- On-image text language rule (Korean only) and all prohibited elements"),
      ...(state.appliedConceptStyle
        ? [localizeSentence("- 적용된 비주얼 컨셉의 시각 언어 준수", "- Applied concept visual language (Visual concept section)")]
        : []),
      localizeSentence("- AI 생성 항목(CTA·오퍼) 적절히 생성 후 배치", "- AI generation tasks: generate action button and offer items and place them appropriately"),
      localizeSentence("- 시선 흐름 패턴에 따른 텍스트 위계와 가독성 유지", "- Maintain text hierarchy and readability according to the attention flow pattern"),
      localizeSentence("- 상업 품질 기준 및 비주얼 방향성 반영", "- Commercial baseline and visual direction"),
      localizeSentence("- 레이아웃 구성 및 비주얼 구성 방향 반영", "- Layout & composition and visual composition direction"),
      localizeSentence("- 색상 시스템 일관성 및 이미지 품질 기준 반영", "- Color system consistency and image quality standards"),
    ];

    return [...intro, ...sectionLines, ...footer].join("\n");
  }

  function renderOptimizedPrompt(validation, lint) {
    const sections = createPromptSections(validation, lint);
    const compressed = sections.flatMap((section) =>
      finalizePromptLines(section.lines)
        .flatMap((line) => line.split(/\r?\n/))
        .filter((line) => !shouldSkipOptimizedLine(line.trim()))
        .map((line) => `- ${line.replace(/^\d+\.\s*/, "").trim().replace(/^-\s*/, "")}`)
    );
    const assetLabelEn = ASSET_PROMPT_TARGET_EN[state.assetType] || ASSET_LABELS[state.assetType];
    const contentNameEn = state.contentType !== "none" ? (CONTENT_TYPE_TEMPLATES_EN[state.contentType]?.name || "") : "";
    const contentNameKo = state.contentType !== "none" ? (CONTENT_TYPE_TEMPLATES[state.contentType]?.name || "") : "";
    const optimizedIntro = [
      localizeSentence(
        contentNameKo
          ? `[${contentNameKo}] 목적의 고품질 홍보 이미지를 생성하라.`
          : `고품질 홍보 이미지를 생성하라.`,
        contentNameEn
          ? `Generate a premium ${assetLabelEn} for [${contentNameEn}].`
          : `Generate a premium ${assetLabelEn}.`
      ),
      localizeSentence(
        "텍스트 정확성, 타이포그래피 위계, 레이아웃 명확성, CTA 집중도와 상업 광고 수준의 완성도를 최우선으로 처리하라.",
        "Prioritize exact text fidelity, typography hierarchy, layout clarity, strong CTA focus, and campaign-grade commercial finish."
      ),
      localizeSentence(
        "평범한 템플릿형 안내 이미지로 만들지 말고, 타이포그래피 중심·상징 오브젝트 중심·공간 분할 중심 중 하나의 광고 콘셉트를 과감하게 선택해 차별화된 결과를 만든다.",
        "Do not produce a generic template-like notice image; decisively choose one advertising concept such as typography-led, symbolic-object-led, or spatially split composition to create a distinctive result."
      ),
      localizeSentence(
        "창의성은 장식 추가가 아니라 시선 흐름, 크롭, 여백, 오브젝트 스케일, 정보 카드 구조의 변주로 표현한다.",
        "Express creativity through variation in eye flow, cropping, whitespace, object scale, and information-card structure rather than by adding decoration."
      ),
      getRecommendedCompositionDirective(),
      ...(state.outputLanguage !== "en"
        ? [localizeSentence(
            "이미지 내 모든 텍스트는 한국어로만 표기하고, 영어로 번역하거나 영문을 병기하지 않는다.",
            "All on-image text must be in Korean only — do not translate or add English."
          )]
        : []),
    ];

    return prunePromptLines([...optimizedIntro, ...resolveConflictLines(compressed, lint)]).join("\n");
  }

  function sanitizePromptForAI(text) {
    // "CTA"를 그대로 두면 이미지 생성 AI가 해당 문자열을 이미지에 직접 렌더링하는 오류 발생.
    // 단어 경계 기준으로 치환해 AI가 개념으로 이해하도록 유도.
    return text.replace(/\bCTA\b/g, "action button");
  }

  function updateStatsBar(text) {
    const sections = (text.match(/^#{1,3}\s/gm) || []).length;
    const lines = text.split("\n").filter((l) => l.trim()).length;
    const ko = (text.match(/[가-힣]/g) || []).length;
    const digits = (text.match(/\d/g) || []).length;
    const other = text.replace(/[가-힣\d\s]/g, "").length;
    // 한글 1자 ≈ 1.5 토큰, 숫자 2자 ≈ 1 토큰, 영문/특수 4자 ≈ 1 토큰
    const tokens = Math.ceil(ko * 1.5 + digits * 0.5 + other / 4);

    const TOKEN_WARN = 1500;
    const TOKEN_OVER = 2500;
    const TOKEN_MAX = 3000;
    const pct = Math.min((tokens / TOKEN_MAX) * 100, 100);
    const isWarn = tokens >= TOKEN_WARN && tokens < TOKEN_OVER;
    const isOver = tokens >= TOKEN_OVER;

    const s = $("promotionStatSections");
    const l = $("promotionStatLines");
    const t = $("promotionStatTokens");
    const gaugeFill = $("promotionTokenGaugeFill");

    if (s) s.textContent = `섹션 ${sections}`;
    if (l) l.textContent = `${lines} 줄`;
    if (t) {
      t.textContent = `≈ ${tokens.toLocaleString()} 토큰`;
      t.classList.toggle("is-warn", isWarn);
      t.classList.toggle("is-over", isOver);
    }
    if (gaugeFill) {
      gaugeFill.style.width = `${pct.toFixed(1)}%`;
      gaugeFill.classList.toggle("is-warn", isWarn);
      gaugeFill.classList.toggle("is-over", isOver);
    }
  }

  function buildPromptPreview(validation = latestValidation) {
    latestLint = detectPromptLint(validation, visibleTextEntries(), instructionEntries());
    const raw = state.promptMode === "optimized"
      ? renderOptimizedPrompt(validation, latestLint)
      : renderReviewPrompt(validation, latestLint);
    return sanitizePromptForAI(raw);
  }

  function renderPreview() {
    const textEntries = visibleTextEntries();
    const instructionItems = instructionEntries();
    const validation = validateState();
    const autoPrompt = buildPromptPreview(validation);

    latestValidation = validation;

    const badge = $("promotionAssetBadge");
    const previewBadge = $("promotionPreviewBadge");
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

    if (preview) {
      if (!promptDirty) {
        promptDraft = autoPrompt;
      }
      if (preview.value !== promptDraft) {
        preview.value = promptDraft;
      }
      updateStatsBar(preview.value);
    }

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
        btn.disabled = !enabled;
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
        btn.disabled = !enabled;
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
        btn.disabled = !enabled;
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
        btn.disabled = !enabled;
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
      const section = inputNode.closest(".gen-config-group");
      if (section) section.classList.toggle("promo-field-disabled", !enabled);
    }
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

    document.querySelectorAll("[data-promo-variation]").forEach((btn) => {
      const active = btn.dataset.promoVariation === state.variationMode;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });

    document.querySelectorAll(".promo-type-tab").forEach((button) => {
      const active = button.dataset.promoAsset === state.assetType;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });

    root.querySelectorAll("[data-promo-content-type]").forEach((button) => {
      const active = button.dataset.promoContentType === state.contentType;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    root.querySelectorAll("[data-promo-output-language]").forEach((button) => {
      if (button.tagName !== "BUTTON") return;
      const active = normalizeOutputLanguage(button.dataset.promoOutputLanguage) === state.outputLanguage;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    root.querySelectorAll("[data-promo-prompt-mode]").forEach((button) => {
      if (button.tagName !== "BUTTON") return;
      const active = (button.dataset.promoPromptMode === "optimized" ? "optimized" : "review") === state.promptMode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    root.querySelectorAll("[data-promo-visual-planning-mode]").forEach((button) => {
      if (button.tagName !== "BUTTON") return;
      const mode = button.dataset.promoVisualPlanningMode === "detail" ? "detail" : "basic";
      const active = mode === state.visualPlanningMode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    root.classList.toggle("promo-basic-mode", isBasicVisualPlanningMode());
    root.classList.toggle("promo-detail-mode", isDetailVisualPlanningMode());
    root.querySelectorAll("[data-promo-mode-panel]").forEach((panel) => {
      const panelMode = panel.dataset.promoModePanel;
      panel.hidden = panelMode === "basic" ? !isBasicVisualPlanningMode() : !isDetailVisualPlanningMode();
    });

    const modeHint = $("promotionVisualPlanningModeHint");
    if (modeHint) {
      modeHint.textContent = isBasicVisualPlanningMode()
        ? "컨셉 제안에서 적용한 스타일 코어와 홍보 적응 규칙을 기본 패널에서 항목별로 편집하고, 그 값을 최종 프롬프트의 비주얼 기준으로 사용합니다."
        : "컨셉 제안 섹션을 제외하고, 3~5번에서 직접 기획한 비주얼 방향·색상·품질 지시를 중심으로 프롬프트를 구성합니다.";
    }

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
    syncAntiAiPresetUI();
    syncToggleFieldUI("tone");
    syncToggleFieldUI("bigIdea");
    syncToggleFieldUI("visualMetaphor");
    syncToggleFieldUI("visualStyle");
    syncToggleFieldUI("layoutComposition");
  }

  function resetAll() {
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

  function getSelectedSampleProfile() {
    return CONTENT_TYPE_SAMPLE_PROFILES[state.contentType] || CONTENT_TYPE_SAMPLE_PROFILES.none;
  }

  function applySampleProfile(profile) {
    if (!profile) return;

    assignState({
      ...state,
      ...profile.state,
      colorStrategy: state.colorStrategy,
    });

    if (!isAiColorStrategy() && profile.paletteId) {
      applyPaletteSnapshot(findPaletteById(profile.paletteId));
    }

    Object.entries(profile.quickFields || {}).forEach(([fieldId, values]) => {
      setPresetFieldValues(fieldId, values);
    });

    promptDirty = false;
    syncStaticFields();
    renderTypeFields();
    renderPreview();
  }

  function applySample() {
    if (state.assetType !== "image") return;

    const profile = getSelectedSampleProfile();
    const contentName = state.contentType === "none"
      ? "기본 홍보 이미지"
      : (CONTENT_TYPE_TEMPLATES[state.contentType]?.name || "선택한 템플릿");

    applySampleProfile(profile);
    status(`${contentName} 샘플을 적용했습니다. 프리셋이 있는 항목은 현재 화면에 보이는 프리셋 안에서만 채웠습니다.`, "success");
  }

  function applyRandomPresets() {
    if (state.assetType === "image") {
      const selectedPalette = !isAiColorStrategy() && colorPresets.length
        ? colorPresets[Math.floor(Math.random() * colorPresets.length)]
        : null;
      if (selectedPalette) {
        applyPaletteSnapshot(selectedPalette);
      }

      UNIFIED_RANDOMIZABLE_PRESET_FIELDS.forEach((fieldId) => {
        const options = getQuickButtonOptions(fieldId);
        if (!options.length) return;
        const { min, max } = randomFieldSelectionCount(fieldId);
        setPresetFieldValues(fieldId, pickRandomSubset(options, min, max));
      });

      promptDirty = false;
      syncStaticFields();
      renderTypeFields();
      renderPreview();
      status("이미지 규격과 직접 노출 텍스트는 유지하고, 프리셋 항목만 랜덤 적용했습니다.", "success");
      return;
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
    if (preview && typeof preview.value === "string") {
      return preview.value;
    }
    return promptDraft || buildPromptPreview(validateState());
  }

  function resetPromptDraft() {
    promptDirty = false;
    promptDraft = buildPromptPreview(validateState());
    renderPreview();
    status("자동 생성된 프롬프트 초안을 다시 반영했습니다.", "info");
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

  function bindStaticInputs() {
    bindFieldInputs(root);
    bindQuickButtons(root);
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

    setText(".promo-step-copy small", "피해야 할 요소, 상업 완성도.");
    setText("label[for='promotionForbiddenElements'] + .gen-config-guide", "다른 단계에서 이미 지정한 색상, 배경, 액션버튼, 배치가 아니라 제외할 표현만 적습니다.");


    setHtml("label[for='promotionCommercialBaseline']", `상업 완성도 기준 <span class="promo-field-badge instruction">품질 단계</span>`);
    setText("label[for='promotionCommercialBaseline'] + .promo-control-hint", "내용·색상·배치가 아니라 결과물의 마감 밀도를 정합니다. 보통 premium이 적합합니다.");
    setOptions("promotionCommercialBaseline", { off: "기본", standard: "실무형", premium: "프리미엄", luxury: "하이엔드" });
    setSegmentLabels("[data-promo-commercial-baseline]", { off: "기본", standard: "실무형", premium: "프리미엄", luxury: "하이엔드" }, "promoCommercialBaseline");

    setHtml("label[for='promotionCreativityLevel']", `구성 실험 강도 <span class="promo-field-badge instruction">위험도</span>`);
    setText("label[for='promotionCreativityLevel'] + .promo-control-hint", "색상이나 스타일이 아니라 화면 구성의 실험 폭만 조절합니다. 보통 balanced가 안정적입니다.");
    setOptions("promotionCreativityLevel", { stable: "안정형", balanced: "균형형", experimental: "실험형" });
    setSegmentLabels("[data-promo-creativity-level]", { stable: "안정형", balanced: "균형형", experimental: "실험형" }, "promoCreativityLevel");

    setText("label[for='promotionQualityNotes']", "결과물 결함 방지");
    setText("label[for='promotionQualityNotes'] + .gen-config-guide", "내용 추가나 배치 지시가 아니라 텍스트 깨짐, 저해상도, 왜곡, 노이즈 같은 산출물 결함만 지정합니다.");
    const qualityContainer = step.querySelector(".promo-quick-btns[data-quick-for='promotionQualityNotes']");
    if (qualityContainer) {
      qualityContainer.innerHTML = STEP5_QUALITY_OPTIONS
        .map((item) => `<button type="button" class="btn-quick">${escapeHtml(item)}</button>`)
        .join("");
    }
    const qualityInput = $("promotionQualityNotes");
    if (qualityInput) {
      qualityInput.placeholder = "예: 텍스트 가장자리는 선명하게, 작은 글자는 번짐 없이, 인물 얼굴과 손가락 왜곡 방지";
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

  function applyStep3ChoiceTaxonomy() {
    const step = $("promotionStepVisual");
    if (!step) return;
    const setText = (selector, text) => {
      const node = step.querySelector(selector);
      if (node) node.textContent = text;
    };
    const setHtml = (selector, html) => {
      const node = step.querySelector(selector);
      if (node) node.innerHTML = html;
    };

    setText(".promo-step-copy strong", "비주얼 방향");
    setText(".promo-step-copy small", "전체 아이디어를 먼저 고르고, 톤·상징·표현방식만 짧게 보완합니다.");

    const body = step.querySelector(".promo-step-body");
    if (body && !$("promotionVisualIdeaPresets")) {
      body.insertAdjacentHTML("afterbegin", `
        <section class="gen-config-group gen-config-group-wide promo-visual-preset-panel" id="promotionVisualIdeaPresets">
          <label class="gen-config-label">아이디어 빠른 선택</label>
          <p class="gen-config-guide">하나를 고르면 톤, 핵심 개념, 비주얼 은유, 스타일이 함께 정리됩니다. 이후 세부 항목은 직접 수정할 수 있습니다.</p>
          <div class="promo-visual-preset-grid">
            ${STEP3_IDEA_PRESETS.map((preset) => `
              <button type="button" class="promo-visual-preset-btn" data-visual-idea-preset="${escapeHtml(preset.id)}">
                <strong>${escapeHtml(preset.label)}</strong>
                <span>${escapeHtml(preset.desc)}</span>
              </button>
            `).join("")}
          </div>
        </section>
      `);
    }

    const subgroupLabels = step.querySelectorAll(".promo-visual-subgroup-label");
    const subgroupDescs = step.querySelectorAll(".promo-visual-subgroup-desc");
    if (subgroupLabels[0]) subgroupLabels[0].textContent = "아이디어";
    if (subgroupDescs[0]) subgroupDescs[0].textContent = "무드와 상징을 선택합니다";
    if (subgroupLabels[1]) subgroupLabels[1].textContent = "표현 방식";
    if (subgroupDescs[1]) subgroupDescs[1].textContent = "그래픽 스타일만 선택합니다";

    setText("label[for='promotionTone']", "톤");
    setText("label[for='promotionTone'] + .gen-config-guide", "브랜드가 전달해야 할 감정만 짧게 고릅니다.");
    replaceQuickButtons(step.querySelector(".promo-quick-btns[data-quick-for='promotionTone']"), STEP3_VISUAL_OPTION_GROUPS.tone);

    setHtml("label[for='promotionBigIdea']", `핵심 개념 <span class="promo-field-badge instruction">아이디어</span>`);
    setText("label[for='promotionBigIdea'] + .gen-config-guide", "이미지 한 장이 말해야 할 중심 아이디어를 고릅니다.");
    replaceQuickButtons(step.querySelector(".promo-quick-btns[data-quick-for='promotionBigIdea']"), STEP3_VISUAL_OPTION_GROUPS.bigIdea);

    setHtml("label[for='promotionVisualMetaphor']", `상징 장면 <span class="promo-field-badge instruction">아이디어</span>`);
    setText("label[for='promotionVisualMetaphor'] + .gen-config-guide", "직접 설명 대신 이미지로 보여줄 장면을 1개만 고릅니다.");
    replaceQuickButtons(step.querySelector(".promo-quick-btns[data-quick-for='promotionVisualMetaphor']"), STEP3_VISUAL_OPTION_GROUPS.visualMetaphor);

    setText("label[for='promotionVisualStyle']", "표현 스타일");
    setText("label[for='promotionVisualStyle'] + .gen-config-guide", "색상과 배경은 4단계에서 정하고, 여기서는 표현 방식만 고릅니다.");
    replaceQuickButtons(step.querySelector(".promo-quick-btns[data-quick-for='promotionVisualStyle']"), STEP3_VISUAL_OPTION_GROUPS.visualStyle);

    $("promotionBigIdea")?.setAttribute("data-promo-field", "bigIdea");
    $("promotionVisualMetaphor")?.setAttribute("data-promo-field", "visualMetaphor");
  }

  function bindStep3IdeaPresets() {
    root.querySelectorAll("[data-visual-idea-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        const preset = STEP3_IDEA_PRESETS.find((item) => item.id === button.dataset.visualIdeaPreset);
        if (!preset) return;
        Object.entries(preset.fields).forEach(([key, value]) => {
          state[key] = value;
        });
        promptDirty = false;
        syncStaticFields();
        syncQuickButtonStates(root);
        renderPreview();
      });
    });
  }

  function init() {
    attachStaticFieldBadges();
    applyActionCtaQrHierarchy();
    applyStep3ChoiceTaxonomy();
    applyStep5ChoiceTaxonomy();
    loadColorPresets();
    renderColorPresetOptions();
    loadSizePresets();
    renderSizePresetList();
    bindSizePresetControls();
    bindTabs();
    bindTemplateCards();
    bindStaticInputs();
    bindOptimizationControls();
    bindColorPickers();
    bindColorClearButtons();
    bindStep3IdeaPresets();
    bindLoadInput();
    bindPromptEditor();
    bindWarningModalEvents();
    const goConceptTab = () => { document.getElementById("tabBtnPromotionPlanner")?.click(); };
    $("promotionConceptSelectBtn")?.addEventListener("click", goConceptTab);
    $("promotionConceptChangeBtn")?.addEventListener("click", goConceptTab);
    $("promotionSampleBtn")?.addEventListener("click", applySample);
    $("promotionRandomPresetBtn")?.addEventListener("click", applyRandomPresets);
    $("promotionSaveBtn")?.addEventListener("click", saveSettings);
    $("promotionLoadBtn")?.addEventListener("click", loadSettings);
    $("promotionPaletteSaveBtn")?.addEventListener("click", saveCurrentPalettePreset);
    $("promotionPaletteApplyBtn")?.addEventListener("click", applySelectedPalettePreset);
    $("promotionPalettePresetSelect")?.addEventListener("change", () => applySelectedPalettePreset({ silent: true }));
    $("promotionPaletteDeleteBtn")?.addEventListener("click", deleteSelectedPalettePreset);
    $("promotionResetBtn")?.addEventListener("click", resetAll);
    $("promotionPruneEmptyBtn")?.addEventListener("click", pruneEmptyFields);
    $("promotionResetTextBtn")?.addEventListener("click", resetTextFields);
    $("promotionResetStyleBtn")?.addEventListener("click", resetStyleFields);
    $("promotionResetColorsBtn")?.addEventListener("click", resetColorFields);
    $("promotionReapplyTemplateBtn")?.addEventListener("click", reapplyCurrentTemplate);
    $("promotionOptimizePromptBtn")?.addEventListener("click", rerunOptimization);
    $("promotionCopyPromptBtn")?.addEventListener("click", copyPrompt);
    $("promotionResetPromptBtn")?.addEventListener("click", resetPromptDraft);

    restoreDraft();
    visitedAssetTypes = new Set([state.assetType]);
    syncStaticFields();
    renderTypeFields();
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
    Object.assign(conceptParts, getContentConceptBridgeOverrides(conceptParts));
    applyConceptPartsToState(conceptParts);
    scrubConceptFromDetailPlanningFields(conceptStripValues);

    promptDirty = false;
    syncStaticFields();
    renderPreview();

    status(`'${style.nameKo}' 콘셉트가 기본 모드 프롬프트 편집 패널에 적용되었습니다.`, "success");
  };

  init();
})();
