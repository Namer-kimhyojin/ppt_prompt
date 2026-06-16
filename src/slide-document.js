// src/slide-document.js
(function () {
  const root = document.getElementById("paneSlideDocument");
  if (!root) return;

  const $ = (id) => document.getElementById(id);

  // Common Premium Color Presets
  const COLOR_PRESETS = [
    { name: "클래식 네이비 (Classic Navy)", primary: "#0F3D8A", secondary: "#DDE7F8", bg: "#F5F7FB", accent: "#FF6B2C" },
    { name: "에메랄드 포레스트 (Emerald Forest)", primary: "#0B6623", secondary: "#E3F2E6", bg: "#F4F9F5", accent: "#FFB300" },
    { name: "웜 테라코타 (Warm Terracotta)", primary: "#B23A22", secondary: "#F9EBEA", bg: "#FDF8F7", accent: "#2E86C1" },
    { name: "차콜 에디토리얼 (Charcoal Editorial)", primary: "#1C2833", secondary: "#E5E7E9", bg: "#F8F9F9", accent: "#E74C3C" },
    { name: "딥 퍼플 럭셔리 (Deep Purple)", primary: "#4A235A", secondary: "#EBDEF0", bg: "#FBEEFC", accent: "#F4D03F" }
  ];

  // Active Sub-Tab: 'cover', 'divider', 'background'
  let activeSubTab = "cover";

  // Independent States
  const COVER_STATE = {
    documentType: "ppt",
    orientation: "landscape",
    headline: "",
    subheadline: "",
    metaInfo: "",
    brandTone: "",
    layoutMetaphor: "geometric",
    layoutMetaphorCustom: "",
    layoutStructure: "centered_split",
    layoutStructureCustom: "",
    visualStrategy: "minimal_shape",
    visualStrategyCustom: "",
    layerComplexity: "single",
    layerComplexityCustom: "",
    primaryColor: "#0F3D8A",
    secondaryColor: "#DDE7F8",
    backgroundColor: "#F5F7FB",
    accentColor: "#FF6B2C",
    outputLang: "ko",
    // New Fields
    artStyle: "none",
    artStyleCustom: "",
    bgBrightness: "none",
    gradTransEffect: "none",
    gradTransEffectCustom: "",
    headerText: "",
    headerPosition: "none",
    footerText: "",
    footerPosition: "none",
    subjectImageDesc: "",
    useColorSystem: true,
    // Logo & QR
    logos: [],  // [{ name, mode, path, position }]
    qrMode: "none",
    qrUrl: "",
    qrCaption: "",
    qrPosition: "bottom_right"
  };

  const DIVIDER_STATE = {
    documentType: "ppt",
    orientation: "landscape",
    headline: "",
    subheadline: "",
    metaInfo: "",
    brandTone: "",
    layoutMetaphor: "minimal_line",
    layoutMetaphorCustom: "",
    dividerStyle: "bold_number",
    dividerStyleCustom: "",
    visualStrategy: "minimal_shape",
    visualStrategyCustom: "",
    layerComplexity: "single",
    layerComplexityCustom: "",
    primaryColor: "#0F3D8A",
    secondaryColor: "#DDE7F8",
    backgroundColor: "#F5F7FB",
    accentColor: "#FF6B2C",
    outputLang: "ko",
    // Frame Fields
    headerStyle: "none",
    headerStyleCustom: "",
    footerStyle: "none",
    footerStyleCustom: "",
    borderStyle: "none",
    borderStyleCustom: "",
    marginArea: "none",
    marginAreaCustom: "",
    // New Fields
    artStyle: "none",
    artStyleCustom: "",
    bgBrightness: "none",
    gradTransEffect: "none",
    gradTransEffectCustom: "",
    headerText: "",
    headerPosition: "none",
    footerText: "",
    footerPosition: "none",
    subjectImageDesc: "",
    useColorSystem: true,
    // Logo & QR
    logos: [],  // [{ name, mode, path, position }]
    qrMode: "none",
    qrUrl: "",
    qrCaption: "",
    qrPosition: "bottom_right"
  };

  const BACKGROUND_STATE = {
    documentType: "ppt",
    orientation: "landscape",
    brandTone: "",
    layoutMetaphor: "geometric",
    layoutMetaphorCustom: "",
    headerStyle: "none",
    headerStyleCustom: "",
    footerStyle: "none",
    footerStyleCustom: "",
    borderStyle: "none",
    borderStyleCustom: "",
    marginArea: "center_80",
    marginAreaCustom: "",
    visualStrategy: "minimal_shape",
    visualStrategyCustom: "",
    layerComplexity: "single",
    layerComplexityCustom: "",
    primaryColor: "#0F3D8A",
    secondaryColor: "#DDE7F8",
    backgroundColor: "#F5F7FB",
    accentColor: "#FF6B2C",
    outputLang: "ko",
    // New Fields
    artStyle: "none",
    artStyleCustom: "",
    bgBrightness: "none",
    gradTransEffect: "none",
    gradTransEffectCustom: "",
    headerText: "",
    headerPosition: "none",
    footerText: "",
    footerPosition: "none",
    subjectImageDesc: "",
    useColorSystem: true,
    // Logo & QR
    logos: [],  // [{ name, mode, path, position }]
    qrMode: "none",
    qrUrl: "",
    qrCaption: "",
    qrPosition: "bottom_right"
  };

  const SIGNBOARD_STATE = {
    documentType: "a4",
    orientation: "landscape",
    headline: "",
    schedule: "",
    contactInfo: "",
    contactPhone: "",
    includeContact: true,
    directionArrow: "right",
    locationText: "",
    brandTone: "",
    layoutMetaphor: "geometric",
    layoutMetaphorCustom: "",
    visualStrategy: "minimal_shape",
    visualStrategyCustom: "",
    layerComplexity: "single",
    layerComplexityCustom: "",
    primaryColor: "#0F3D8A",
    secondaryColor: "#DDE7F8",
    backgroundColor: "#F5F7FB",
    accentColor: "#FF6B2C",
    outputLang: "ko",
    artStyle: "none",
    artStyleCustom: "",
    bgBrightness: "none",
    gradTransEffect: "none",
    gradTransEffectCustom: "",
    headerText: "",
    headerPosition: "none",
    footerText: "",
    footerPosition: "none",
    subjectImageDesc: "",
    useColorSystem: true,
    logos: [{ name: "그림1", mode: "placeholder", path: "", position: "top_left" }],  // [{ name, mode, path, position }]
    qrMode: "none",
    qrUrl: "",
    qrCaption: "",
    qrPosition: "bottom_right"
  };

  function getActiveState() {
    if (activeSubTab === "cover") return COVER_STATE;
    if (activeSubTab === "divider") return DIVIDER_STATE;
    if (activeSubTab === "background") return BACKGROUND_STATE;
    return SIGNBOARD_STATE;
  }

  function getMergedPresets() {
    let customPresets = [];
    try {
      const stored = localStorage.getItem("ppt_prompt_custom_colors");
      if (stored) {
        customPresets = JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    return [...COLOR_PRESETS, ...customPresets];
  }

  function init() {
    setupSubTabs();
    setupColorPresets("slideCoverColorPresetGrid", "cover");
    setupColorPresets("slideDividerColorPresetGrid", "divider");
    setupColorPresets("slideBackgroundColorPresetGrid", "background");
    setupColorPresets("slideSignboardColorPresetGrid", "signboard");

    bindSubPaneEvents("Cover", COVER_STATE);
    bindSubPaneEvents("Divider", DIVIDER_STATE);
    bindSubPaneEvents("Background", BACKGROUND_STATE);
    bindSubPaneEvents("Signboard", SIGNBOARD_STATE);

    setupCustomColorReg("Cover");
    setupCustomColorReg("Divider");
    setupCustomColorReg("Background");
    setupCustomColorReg("Signboard");

    // Bind proxy buttons
    $("slideDocSampleBtn").addEventListener("click", () => triggerActiveAction("sample"));
    $("slideDocResetBtn").addEventListener("click", () => triggerActiveAction("reset"));
    $("slideDocCopyPromptBtn").addEventListener("click", () => triggerActiveAction("copy"));

    // Sync all
    syncUIFromState("Cover", COVER_STATE);
    syncUIFromState("Divider", DIVIDER_STATE);
    syncUIFromState("Background", BACKGROUND_STATE);
    syncUIFromState("Signboard", SIGNBOARD_STATE);

    updatePromptPreview("Cover", COVER_STATE);
    updatePromptPreview("Divider", DIVIDER_STATE);
    updatePromptPreview("Background", BACKGROUND_STATE);
    updatePromptPreview("Signboard", SIGNBOARD_STATE);
  }

  function setupSubTabs() {
    const buttons = root.querySelectorAll(".slide-sub-tab-btn");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        buttons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const targetId = btn.dataset.target;
        root.querySelectorAll(".slide-sub-pane").forEach(pane => {
          pane.classList.remove("active");
        });
        $(targetId).classList.add("active");

        // Update active sub tab key
        if (targetId === "paneSlideCover") activeSubTab = "cover";
        else if (targetId === "paneSlideDivider") activeSubTab = "divider";
        else if (targetId === "paneSlideBackground") activeSubTab = "background";
        else activeSubTab = "signboard";

        if (window.PromptDeckTabs?.syncHeaderActionStates) {
          window.PromptDeckTabs.syncHeaderActionStates();
        }
      });
    });
  }

  function setupColorPresets(gridId, paneKey) {
    const grid = $(gridId);
    if (!grid) return;
    grid.innerHTML = "";

    const merged = getMergedPresets();
    const state = paneKey === "cover" ? COVER_STATE : paneKey === "divider" ? DIVIDER_STATE : paneKey === "background" ? BACKGROUND_STATE : SIGNBOARD_STATE;

    merged.forEach((preset, index) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "promo-color-preset-chip";

      if (state.primaryColor === preset.primary && state.backgroundColor === preset.bg) {
        chip.classList.add("active");
      } else if (!state.primaryColor && index === 0) {
        chip.classList.add("active");
      }

      chip.innerHTML = `
        <span class="promo-color-preset-name">${preset.name}</span>
        <div class="promo-color-preset-preview">
          <span class="promo-color-preset-dot" style="background: ${preset.primary}"></span>
          <span class="promo-color-preset-dot" style="background: ${preset.secondary}"></span>
          <span class="promo-color-preset-dot" style="background: ${preset.bg}"></span>
          <span class="promo-color-preset-dot" style="background: ${preset.accent}"></span>
        </div>
      `;

      chip.addEventListener("click", () => {
        grid.querySelectorAll(".promo-color-preset-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");

        const prefix = paneKey === "cover" ? "Cover" : paneKey === "divider" ? "Divider" : paneKey === "background" ? "Background" : "Signboard";

        state.primaryColor = preset.primary;
        state.secondaryColor = preset.secondary;
        state.backgroundColor = preset.bg;
        state.accentColor = preset.accent;

        syncUIFromState(prefix, state);
        updatePromptPreview(prefix, state);
      });

      grid.appendChild(chip);
    });
  }

  function setupCustomColorReg(prefix) {
    const btn = $(`slide${prefix}AddCustomColorBtn`);
    if (!btn) return;

    btn.addEventListener("click", () => {
      const nameInput = $(`slide${prefix}CustomName`);
      const name = nameInput.value.trim() || `나만의 색상 (${new Date().toLocaleTimeString()})`;
      const primary = $(`slide${prefix}CustomPrimary`).value;
      const secondary = $(`slide${prefix}CustomSecondary`).value;
      const bg = $(`slide${prefix}CustomBg`).value;
      const accent = $(`slide${prefix}CustomAccent`).value;

      const newPreset = { name, primary, secondary, bg, accent };

      let list = [];
      try {
        const stored = localStorage.getItem("ppt_prompt_custom_colors");
        if (stored) {
          list = JSON.parse(stored);
        }
      } catch (e) {}

      list.push(newPreset);
      localStorage.setItem("ppt_prompt_custom_colors", JSON.stringify(list));

      nameInput.value = "";

      const paneKey = prefix.toLowerCase();
      const state = paneKey === "cover" ? COVER_STATE : paneKey === "divider" ? DIVIDER_STATE : paneKey === "background" ? BACKGROUND_STATE : SIGNBOARD_STATE;
      state.primaryColor = primary;
      state.secondaryColor = secondary;
      state.backgroundColor = bg;
      state.accentColor = accent;

      setupColorPresets("slideCoverColorPresetGrid", "cover");
      setupColorPresets("slideDividerColorPresetGrid", "divider");
      setupColorPresets("slideBackgroundColorPresetGrid", "background");
      setupColorPresets("slideSignboardColorPresetGrid", "signboard");

      syncUIFromState(prefix, state);
      updatePromptPreview(prefix, state);

      showToast(`새 컬러 시스템 [${name}]을 추가 및 적용했습니다.`);
    });
  }

  function toggleCustomInputs(prefix, state) {
    // 1. Color System Wrapper toggle
    const useColorSys = $(`slide${prefix}UseColorSystem`);
    const colorFieldsWrapper = $(`slide${prefix}ColorFieldsWrapper`);
    if (useColorSys && colorFieldsWrapper) {
      if (state.useColorSystem) {
        colorFieldsWrapper.classList.remove("disabled");
      } else {
        colorFieldsWrapper.classList.add("disabled");
      }
    }

    // 2. Subject image description group toggle (only show when visualStrategy is "realistic_synth")
    const subjectImgGroup = $(`slide${prefix}SubjectImageGroup`);
    if (subjectImgGroup) {
      if (state.visualStrategy === "realistic_synth") {
        subjectImgGroup.classList.remove("hide");
      } else {
        subjectImgGroup.classList.add("hide");
      }
    }

    // 3. Select custom inputs toggle
    const selectCustomIds = [
      { selectId: `slide${prefix}LayoutMetaphor`, customId: `slide${prefix}LayoutMetaphorCustom` },
      { selectId: `slide${prefix}VisualStrategy`, customId: `slide${prefix}VisualStrategyCustom` },
      { selectId: `slide${prefix}LayerComplexity`, customId: `slide${prefix}LayerComplexityCustom` },
      { selectId: `slide${prefix}ArtStyle`, customId: `slide${prefix}ArtStyleCustom` },
      { selectId: `slide${prefix}GradTransEffect`, customId: `slide${prefix}GradTransEffectCustom` },
      // tab-specific
      { selectId: `slideCoverLayoutStructure`, customId: `slideCoverLayoutStructureCustom` },
      { selectId: `slideDividerStyle`, customId: `slideDividerStyleCustom` },
      // frame settings
      { selectId: `slide${prefix}HeaderStyle`, customId: `slide${prefix}HeaderStyleCustom` },
      { selectId: `slide${prefix}FooterStyle`, customId: `slide${prefix}FooterStyleCustom` },
      { selectId: `slide${prefix}BorderStyle`, customId: `slide${prefix}BorderStyleCustom` },
      { selectId: `slide${prefix}MarginArea`, customId: `slide${prefix}MarginAreaCustom` }
    ];

    selectCustomIds.forEach(pair => {
      const selectEl = $(pair.selectId);
      const customEl = $(pair.customId);
      if (selectEl && customEl) {
        if (selectEl.value === "custom") {
          customEl.classList.remove("hide");
        } else {
          customEl.classList.add("hide");
        }
      }
    });
  }

  function syncUIFromState(prefix, state) {
    const setVal = (id, val) => {
      const el = $(id);
      if (el) el.value = val !== undefined ? val : "";
    };

    const setChecked = (id, checked) => {
      const el = $(id);
      if (el) el.checked = !!checked;
    };

    // Standard Selects
    setVal(`slide${prefix}DocumentType`, state.documentType);
    setVal(`slide${prefix}Orientation`, state.orientation);
    setVal(`slide${prefix}LayoutMetaphor`, state.layoutMetaphor);
    setVal(`slide${prefix}VisualStrategy`, state.visualStrategy);
    setVal(`slide${prefix}LayerComplexity`, state.layerComplexity);
    setVal(`slide${prefix}ArtStyle`, state.artStyle);
    setVal(`slide${prefix}BgBrightness`, state.bgBrightness);
    setVal(`slide${prefix}GradTransEffect`, state.gradTransEffect);
    setVal(`slide${prefix}HeaderPosition`, state.headerPosition);
    setVal(`slide${prefix}FooterPosition`, state.footerPosition);

    // Standard Inputs
    setVal(`slide${prefix}Headline`, state.headline);
    setVal(`slide${prefix}Subheadline`, state.subheadline);
    setVal(`slide${prefix}MetaInfo`, state.metaInfo);
    setVal(`slide${prefix}BrandTone`, state.brandTone);
    setVal(`slide${prefix}HeaderText`, state.headerText);
    setVal(`slide${prefix}FooterText`, state.footerText);
    setVal(`slide${prefix}SubjectImageDesc`, state.subjectImageDesc);

    // Custom text inputs
    setVal(`slide${prefix}LayoutMetaphorCustom`, state.layoutMetaphorCustom);
    setVal(`slide${prefix}VisualStrategyCustom`, state.visualStrategyCustom);
    setVal(`slide${prefix}LayerComplexityCustom`, state.layerComplexityCustom);
    setVal(`slide${prefix}ArtStyleCustom`, state.artStyleCustom);
    setVal(`slide${prefix}GradTransEffectCustom`, state.gradTransEffectCustom);

    // Tab-specific settings
    if (prefix === "Cover") {
      setVal("slideCoverLayoutStructure", state.layoutStructure);
      setVal("slideCoverLayoutStructureCustom", state.layoutStructureCustom);
    } else if (prefix === "Divider") {
      setVal("slideDividerStyle", state.dividerStyle);
      setVal("slideDividerStyleCustom", state.dividerStyleCustom);
    }

    // Frame fields (Divider and Background)
    setVal(`slide${prefix}HeaderStyle`, state.headerStyle);
    setVal(`slide${prefix}HeaderStyleCustom`, state.headerStyleCustom);
    setVal(`slide${prefix}FooterStyle`, state.footerStyle);
    setVal(`slide${prefix}FooterStyleCustom`, state.footerStyleCustom);
    setVal(`slide${prefix}BorderStyle`, state.borderStyle);
    setVal(`slide${prefix}BorderStyleCustom`, state.borderStyleCustom);
    setVal(`slide${prefix}MarginArea`, state.marginArea);
    setVal(`slide${prefix}MarginAreaCustom`, state.marginAreaCustom);

    // Colors
    setVal(`slide${prefix}PrimaryColor`, state.primaryColor);
    setVal(`slide${prefix}PrimaryColorPicker`, state.primaryColor);
    setVal(`slide${prefix}SecondaryColor`, state.secondaryColor);
    setVal(`slide${prefix}SecondaryColorPicker`, state.secondaryColor);
    setVal(`slide${prefix}BackgroundColor`, state.backgroundColor);
    setVal(`slide${prefix}BackgroundColorPicker`, state.backgroundColor);
    setVal(`slide${prefix}AccentColor`, state.accentColor);
    setVal(`slide${prefix}AccentColorPicker`, state.accentColor);

    // Checkboxes
    setChecked(`slide${prefix}UseColorSystem`, state.useColorSystem);

    // Logo & QR
    renderLogoList(prefix, state);
    setVal(`slide${prefix}QrMode`, state.qrMode);
    setVal(`slide${prefix}QrUrl`, state.qrUrl);
    setVal(`slide${prefix}QrCaption`, state.qrCaption);
    setVal(`slide${prefix}QrPosition`, state.qrPosition);

    // QR visibility
    const qrDetails = $(`slide${prefix}QrDetails`);
    if (qrDetails) qrDetails.style.display = state.qrMode !== "none" ? "" : "none";

    // Toggle custom inputs visibility and color system wrapper disabled state
    toggleCustomInputs(prefix, state);
  }

  function renderLogoList(prefix, state) {
    const listEl = $(`slide${prefix}LogoList`);
    const emptyEl = $(`slide${prefix}LogoEmpty`);
    if (!listEl) return;

    listEl.innerHTML = "";
    const logos = state.logos || [];
    if (emptyEl) emptyEl.style.display = logos.length === 0 ? "" : "none";

    logos.forEach((logo, idx) => {
      const card = document.createElement("div");
      card.className = "logo-card";
      card.innerHTML = `
        <div class="logo-card-header">
          <span class="logo-card-num">#${idx + 1}</span>
          <button type="button" class="logo-card-remove" title="삭제">✕</button>
        </div>
        <div class="logo-card-fields">
          <div class="logo-field-wide">
            <label>사명 (Company Name)</label>
            <input type="text" class="gen-input-text logo-name-input" placeholder="예: 주식회사 홍길동" value="${logo.name || ""}">
          </div>
          <div class="logo-field-wide">
            <label>경로 / URL</label>
            <input type="text" class="gen-input-text logo-path-input" placeholder="https://example.com/logo.png 또는 파일 경로" value="${logo.path || ""}">
          </div>
          <div class="logo-card-selects-row">
            <div>
              <label>처리 방식</label>
              <select class="gen-select logo-mode-select">
                <option value="placeholder" ${logo.mode === "placeholder" ? "selected" : ""}>플레이스홀더 영역</option>
                <option value="custom" ${logo.mode === "custom" ? "selected" : ""}>실제 로고 경로</option>
              </select>
            </div>
            <div>
              <label>위치</label>
              <select class="gen-select logo-pos-select">
                <option value="top_left" ${logo.position === "top_left" ? "selected" : ""}>좌측 상단</option>
                <option value="top_right" ${logo.position === "top_right" ? "selected" : ""}>우측 상단</option>
                <option value="top_center" ${logo.position === "top_center" ? "selected" : ""}>상단 중앙</option>
                <option value="bottom_left" ${logo.position === "bottom_left" ? "selected" : ""}>좌측 하단</option>
                <option value="bottom_right" ${logo.position === "bottom_right" ? "selected" : ""}>우측 하단</option>
              </select>
            </div>
          </div>
        </div>
      `;

      // Remove button
      card.querySelector(".logo-card-remove").addEventListener("click", () => {
        state.logos.splice(idx, 1);
        renderLogoList(prefix, state);
        updatePromptPreview(prefix, state);
      });

      // Name input
      card.querySelector(".logo-name-input").addEventListener("input", (e) => {
        state.logos[idx].name = e.target.value;
        updatePromptPreview(prefix, state);
      });

      // Path input
      card.querySelector(".logo-path-input").addEventListener("input", (e) => {
        state.logos[idx].path = e.target.value;
        updatePromptPreview(prefix, state);
      });

      // Mode select
      card.querySelector(".logo-mode-select").addEventListener("change", (e) => {
        state.logos[idx].mode = e.target.value;
        updatePromptPreview(prefix, state);
      });

      // Position select
      card.querySelector(".logo-pos-select").addEventListener("change", (e) => {
        state.logos[idx].position = e.target.value;
        updatePromptPreview(prefix, state);
      });

      listEl.appendChild(card);
    });
  }

  function bindSubPaneEvents(prefix, state) {
    // 1. Text Inputs (input events)
    const textInputs = [
      { id: `slide${prefix}Headline`, key: "headline" },
      { id: `slide${prefix}Subheadline`, key: "subheadline" },
      { id: `slide${prefix}MetaInfo`, key: "metaInfo" },
      { id: `slide${prefix}BrandTone`, key: "brandTone" },
      { id: `slide${prefix}HeaderText`, key: "headerText" },
      { id: `slide${prefix}FooterText`, key: "footerText" },
      { id: `slide${prefix}SubjectImageDesc`, key: "subjectImageDesc" },
      // Custom text inputs
      { id: `slide${prefix}LayoutMetaphorCustom`, key: "layoutMetaphorCustom" },
      { id: `slide${prefix}VisualStrategyCustom`, key: "visualStrategyCustom" },
      { id: `slide${prefix}LayerComplexityCustom`, key: "layerComplexityCustom" },
      { id: `slide${prefix}ArtStyleCustom`, key: "artStyleCustom" },
      { id: `slide${prefix}GradTransEffectCustom`, key: "gradTransEffectCustom" },
      // Tab-specific custom inputs
      { id: "slideCoverLayoutStructureCustom", key: "layoutStructureCustom" },
      { id: "slideDividerStyleCustom", key: "dividerStyleCustom" },
      // Frame custom inputs
      { id: `slide${prefix}HeaderStyleCustom`, key: "headerStyleCustom" },
      { id: `slide${prefix}FooterStyleCustom`, key: "footerStyleCustom" },
      { id: `slide${prefix}BorderStyleCustom`, key: "borderStyleCustom" },
      { id: `slide${prefix}MarginAreaCustom`, key: "marginAreaCustom" }
    ];

    textInputs.forEach(item => {
      const el = $(item.id);
      if (el) {
        el.addEventListener("input", (e) => {
          state[item.key] = e.target.value;
          updatePromptPreview(prefix, state);
        });
      }
    });

    // 2. Select Fields (change events)
    const selectFields = [
      { id: `slide${prefix}DocumentType`, key: "documentType" },
      { id: `slide${prefix}Orientation`, key: "orientation" },
      { id: `slide${prefix}LayoutMetaphor`, key: "layoutMetaphor" },
      { id: `slide${prefix}VisualStrategy`, key: "visualStrategy" },
      { id: `slide${prefix}LayerComplexity`, key: "layerComplexity" },
      { id: `slide${prefix}ArtStyle`, key: "artStyle" },
      { id: `slide${prefix}BgBrightness`, key: "bgBrightness" },
      { id: `slide${prefix}GradTransEffect`, key: "gradTransEffect" },
      { id: `slide${prefix}HeaderPosition`, key: "headerPosition" },
      { id: `slide${prefix}FooterPosition`, key: "footerPosition" },
      // Tab-specific selects
      { id: "slideCoverLayoutStructure", key: "layoutStructure" },
      { id: "slideDividerStyle", key: "dividerStyle" },
      // Frame selects
      { id: `slide${prefix}HeaderStyle`, key: "headerStyle" },
      { id: `slide${prefix}FooterStyle`, key: "footerStyle" },
      { id: `slide${prefix}BorderStyle`, key: "borderStyle" },
      { id: `slide${prefix}MarginArea`, key: "marginArea" }
    ];

    selectFields.forEach(item => {
      const el = $(item.id);
      if (el) {
        el.addEventListener("change", (e) => {
          state[item.key] = e.target.value;
          toggleCustomInputs(prefix, state);
          updatePromptPreview(prefix, state);
        });
      }
    });

    // 3. Use Color System checkbox
    const useColorSys = $(`slide${prefix}UseColorSystem`);
    if (useColorSys) {
      useColorSys.addEventListener("change", (e) => {
        state.useColorSystem = e.target.checked;
        toggleCustomInputs(prefix, state);
        updatePromptPreview(prefix, state);
      });
    }

    // 4. Color Inputs and Pickers
    const colors = [
      { textId: `slide${prefix}PrimaryColor`, pickerId: `slide${prefix}PrimaryColorPicker`, key: "primaryColor" },
      { textId: `slide${prefix}SecondaryColor`, pickerId: `slide${prefix}SecondaryColorPicker`, key: "secondaryColor" },
      { textId: `slide${prefix}BackgroundColor`, pickerId: `slide${prefix}BackgroundColorPicker`, key: "backgroundColor" },
      { textId: `slide${prefix}AccentColor`, pickerId: `slide${prefix}AccentColorPicker`, key: "accentColor" }
    ];
    colors.forEach(c => {
      const txt = $(c.textId);
      const pck = $(c.pickerId);
      if (txt && pck) {
        txt.addEventListener("input", (e) => {
          const val = e.target.value;
          if (/^#[0-9A-F]{6}$/i.test(val)) {
            state[c.key] = val;
            pck.value = val;
            updatePromptPreview(prefix, state);
          }
        });
        pck.addEventListener("input", (e) => {
          const val = e.target.value;
          state[c.key] = val;
          txt.value = val;
          updatePromptPreview(prefix, state);
        });
      }
    });

    // 5. Language Switch
    const btnKo = $(`slide${prefix}BtnKo`);
    const btnEn = $(`slide${prefix}BtnEn`);
    if (btnKo && btnEn) {
      btnKo.addEventListener("click", () => {
        btnKo.classList.add("active");
        btnEn.classList.remove("active");
        state.outputLang = "ko";
        updatePromptPreview(prefix, state);
      });
      btnEn.addEventListener("click", () => {
        btnEn.classList.add("active");
        btnKo.classList.remove("active");
        state.outputLang = "en";
        updatePromptPreview(prefix, state);
      });
    }

    // 6. Logo & QR bindings
    const addLogoBtn = $(`slide${prefix}AddLogoBtn`);
    if (addLogoBtn) {
      addLogoBtn.addEventListener("click", () => {
        state.logos.push({ name: "", mode: "placeholder", path: "", position: "top_left" });
        renderLogoList(prefix, state);
        updatePromptPreview(prefix, state);
      });
    }
    const qrModeEl = $(`slide${prefix}QrMode`);
    if (qrModeEl) {
      qrModeEl.addEventListener("change", (e) => {
        state.qrMode = e.target.value;
        const qrDetails = $(`slide${prefix}QrDetails`);
        if (qrDetails) qrDetails.style.display = state.qrMode !== "none" ? "" : "none";
        updatePromptPreview(prefix, state);
      });
    }
    const qrUrlEl = $(`slide${prefix}QrUrl`);
    if (qrUrlEl) {
      qrUrlEl.addEventListener("input", (e) => {
        state.qrUrl = e.target.value;
        updatePromptPreview(prefix, state);
      });
    }
    const qrCaptionEl = $(`slide${prefix}QrCaption`);
    if (qrCaptionEl) {
      qrCaptionEl.addEventListener("input", (e) => {
        state.qrCaption = e.target.value;
        updatePromptPreview(prefix, state);
      });
    }
    const qrPosEl = $(`slide${prefix}QrPosition`);
    if (qrPosEl) {
      qrPosEl.addEventListener("change", (e) => {
        state.qrPosition = e.target.value;
        updatePromptPreview(prefix, state);
      });
    }

    // 7. Action buttons
    if ($(`slide${prefix}SampleBtn`)) $(`slide${prefix}SampleBtn`).addEventListener("click", () => fillSampleData(prefix, state));
    if ($(`slide${prefix}ResetBtn`)) $(`slide${prefix}ResetBtn`).addEventListener("click", () => resetData(prefix, state));
    if ($(`slide${prefix}CopyPromptBtn`)) $(`slide${prefix}CopyPromptBtn`).addEventListener("click", () => copyPrompt(prefix, state));
  }

  function updatePromptPreview(prefix, state) {
    const textarea = $(`slide${prefix}PromptPreview`);
    if (textarea) {
      textarea.value = compilePrompt(prefix, state);
    }
  }

  function getOptionVal(val, customVal, mappingsKo, mappingsEn, prefixKo = "", prefixEn = "") {
    if (!val || val === "none") return null;
    if (val === "custom") {
      const cv = String(customVal || "").trim();
      if (!cv) return null;
      return { ko: prefixKo + cv, en: prefixEn + cv };
    }
    const mKo = mappingsKo[val] || val;
    const mEn = mappingsEn[val] || val;
    return { ko: prefixKo + mKo, en: prefixEn + mEn };
  }

  function compilePrompt(prefix, state) {
    const isPpt = state.documentType === "ppt";
    const layoutRatio = isPpt ? "16:9 widescreen layout" : "A4 standard page layout";
    const orientationTextKo = state.orientation === "landscape" ? "가로형 (Landscape)" : "세로형 (Portrait)";
    const orientationTextEn = state.orientation === "landscape" ? "Landscape orientation" : "Portrait orientation";

    // Mappings
    const layoutMetaphorMapKo = {
      geometric: "기하학적 도형(Geometric Abstract Shapes)과 선을 조화롭게 배치한 세련되고 균형 잡힌 구조",
      "3d_isometric": "3D 입체 디자인 요소를 활용하여 입체적이고 볼륨감 있는 현대적인 구조",
      editorial: "고급 매거진 표지 같은 세련되고 정제된 그리드 기반 에디토리얼 레이아웃",
      glassmorphism: "투명하고 유려한 유리가 겹친 듯한 글래스모피즘(Glassmorphism) 효과와 레이어 구조",
      light_refraction: "빛과 유리의 굴절, 프리즘 오버레이 효과가 적용되어 몽환적이면서 고급스러운 구조",
      minimal_line: "불필요한 요소를 모두 배제하고 극도로 정제된 얇은 선(Minimal Line Art)을 활용한 구조"
    };
    const layoutMetaphorMapEn = {
      geometric: "geometric abstract shapes and crisp vector lines aligned in a structured, balanced grid",
      "3d_isometric": "modern 3D isometric objects, glossy render, elegant material finishes with visual depth",
      editorial: "magazine-style premium editorial layout with refined whitespace and high-contrast typography grid",
      glassmorphism: "sleek translucent glassmorphism panels, blurry glass sheets overlaying soft light sources",
      light_refraction: "photorealistic prism light refraction overlay, subtle color dispersion, high-end premium optics",
      minimal_line: "ultra-minimalist fine line art, delicate outlines, plenty of sophisticated whitespace"
    };

    const visualStrategyTextKo = {
      minimal_shape: "미니멀도형 연출전략 (Minimal Shape Strategy) - 여백이 극대화된 절제된 형태",
      geometric_pattern: "기하학 패턴 연출전략 (Geometric Pattern Strategy) - 균형 잡힌 기하학 패턴 오버레이",
      texture_pattern: "텍스처/패턴 연출전략 (Subtle Textures Strategy) - 은은한 텍스처와 미세한 디테일",
      realistic_synth: "실사이미지 합성 연출전략 (Realistic Photo Synthesis Strategy) - 사실적인 오브젝트/이미지 백드롭 조화"
    };
    const visualStrategyTextEn = {
      minimal_shape: "minimal shapes strategy with optimized empty space",
      geometric_pattern: "geometric abstract pattern overlays and crisp accents",
      texture_pattern: "organic texture pattern with ultra-subtle detail layers",
      realistic_synth: "realistic photorealistic object synthesis and background integration"
    };

    const layerComplexityMapKo = {
      single: "단일 레이어 평면 구성 (Flat 2D layout with clean structure)",
      composite: "복합 레이어 입체 구성 (Multi-layered layout with depth and overlay sheets)"
    };
    const layerComplexityMapEn = {
      single: "single flat 2D layer layout with clean structure",
      composite: "multi-layered composite layout with depth shadows and overlays"
    };

    const artStyleMapKo = {
      vector_flat: "플랫 벡터 그래픽 디자인 기법",
      claymorphism: "부드러운 점토 느낌의 클레이모피즘 스타일",
      neumorphism: "미세한 오목/볼록 엠보싱 효과가 가미된 뉴모피즘 스타일",
      isometric_3d: "3차원 등각 투영 3D 아이소메트릭 렌더링 스타일",
      line_art: "미니멀리즘 라인 아트(선묘화) 기법",
      abstract_glass: "투명하고 오묘한 질감의 추상 글래스 그래픽 기법"
    };
    const artStyleMapEn = {
      vector_flat: "clean flat vector graphic design style",
      claymorphism: "smooth waxy 3D claymorphic style",
      neumorphism: "tactile neumorphic style with soft inner/outer drop shadows",
      isometric_3d: "3D isometric projection graphic rendering style",
      line_art: "minimalist line art graphic style",
      abstract_glass: "abstract translucent glass aesthetic graphic style"
    };

    const bgBrightnessMapKo = {
      light: "라이트 테마 (밝은 배경에 고대비 텍스트 매칭)",
      dark: "다크 테마 (어두운 배경에 대비 텍스트 매칭)"
    };
    const bgBrightnessMapEn = {
      light: "Light Theme (bright background layout with high-contrast text)",
      dark: "Dark Theme (dark background layout with light contrast text)"
    };

    const gradTransEffectMapKo = {
      soft_gradient: "은은하고 균일한 파스텔조 그라데이션 효과",
      glassmorphism: "반투명 유리판이 중첩된 글래스모피즘 효과",
      liquid_gradient: "물 흐르듯 매끄럽게 흐르는 리퀴드 유동 그라데이션",
      prism_refraction: "프리즘 빛 굴절과 무지개빛 광원 오버레이 효과"
    };
    const gradTransEffectMapEn = {
      soft_gradient: "subtle and uniform pastel gradient effect",
      glassmorphism: "frosted translucent glassmorphism plate effect",
      liquid_gradient: "smoothly flowing liquid fluid gradient effect",
      prism_refraction: "prism light refraction and rainbow-hued lens flare overlay effect"
    };

    const layoutStructureMapKo = {
      centered_split: "중앙 분할형 레이아웃 구조 (Centered Split Layout)",
      asymmetric_block: "비대칭 블록형 레이아웃 구조 (Asymmetric Block Layout)",
      minimal_typo: "여백 강조 타이포형 레이아웃 구조 (Minimal Typographic Layout)",
      editorial_grid: "매거진 그리드형 레이아웃 구조 (Editorial Grid Layout)"
    };
    const layoutStructureMapEn = {
      centered_split: "centered split layout structure",
      asymmetric_block: "asymmetric block layout structure",
      minimal_typo: "minimal typographic layout structure",
      editorial_grid: "magazine editorial grid layout structure"
    };

    const dividerStyleMapKo = {
      bold_number: "장 번호 볼드 표기형 간지 스타일 (Chapter Number Bold)",
      vertical_bar: "세로 분할 라인 바 간지 스타일 (Vertical Accent Line Bar)",
      frosted_plate: "글래스모피즘 플레이트 오버레이 간지 스타일 (Frosted Glass Plate)"
    };
    const dividerStyleMapEn = {
      bold_number: "chapter number bold styling",
      vertical_bar: "vertical accent divider line bar",
      frosted_plate: "frosted glassplate overlay panel"
    };

    // Frame mappings (Divider & Background)
    const headerStyleMapKo = {
      thin_line: "얇은 실선 머릿말 구분선",
      accent_block: "강조 컬러 블록 머릿말 구분선",
      double_line: "이중 실선 머릿말 프레임"
    };
    const headerStyleMapEn = {
      thin_line: "thin divider line header indicator",
      accent_block: "accent color block header indicator",
      double_line: "double line header separator"
    };

    const footerStyleMapKo = {
      dots: "점선 꼬릿말 구분선",
      bottom_bar: "하단 얇은 바 꼬릿말 구분선"
    };
    const footerStyleMapEn = {
      dots: "dotted divider footer line indicator",
      bottom_bar: "bottom accent thin footer line"
    };

    const borderStyleMapKo = {
      thin_frame: "외곽 실선 프레임 테두리",
      corners: "모서리 앵글 라인 테두리 장식",
      double_frame: "이중 실선 프레임 테두리"
    };
    const borderStyleMapEn = {
      thin_frame: "thin outer border frame line",
      corners: "minimal corner accent lines decoration",
      double_frame: "double outer border frame lines"
    };

    const marginAreaMapKo = {
      center_80: "중앙 80% 완전 여백 레이아웃 (Clean Content Margin)",
      asymmetric_right: "우측 70% 여백 레이아웃 (Asymmetric Left Banner Grid)",
      grid_split: "2분할 그리드 프레임 레이아웃 (Split Content Sections)"
    };
    const marginAreaMapEn = {
      center_80: "clean central content area with 80% empty workspace",
      asymmetric_right: "asymmetric left banner grid layout with 70% right margin",
      grid_split: "split two-column grid frame placeholder layout"
    };

    const headerPositionMapKo = {
      left: "좌측 정렬",
      center: "중앙 정렬",
      right: "우측 정렬"
    };
    const headerPositionMapEn = {
      left: "aligned to left",
      center: "aligned to center",
      right: "aligned to right"
    };

    // ─────────────────────────────────────────────────────────────
    // [충돌 감지 & 자동 조정] 전체 옵션 조합을 검토하여
    // 모순·과잉 지시를 완화하는 주석(conflict notes)을 생성한다.
    // ─────────────────────────────────────────────────────────────
    const conflictNotesKo = [];
    const conflictNotesEn = [];

    // ── 그룹 A: "발광·투명 계열" 옵션들 ───────────────────────
    // glassmorphism(레이아웃컨셉), light_refraction(레이아웃컨셉),
    // abstract_glass(아트스타일), glassmorphism(그라데이션),
    // prism_refraction(그라데이션), frosted_plate(간지스타일)
    const glowGroup = [];
    if (state.layoutMetaphor === "glassmorphism")  glowGroup.push("레이아웃컨셉:glassmorphism");
    if (state.layoutMetaphor === "light_refraction") glowGroup.push("레이아웃컨셉:light_refraction");
    if (state.artStyle === "abstract_glass")        glowGroup.push("아트스타일:abstract_glass");
    if (state.gradTransEffect === "glassmorphism")  glowGroup.push("그라데이션효과:glassmorphism");
    if (state.gradTransEffect === "prism_refraction") glowGroup.push("그라데이션효과:prism_refraction");
    if (state.dividerStyle === "frosted_plate")     glowGroup.push("간지스타일:frosted_plate");

    if (glowGroup.length >= 2) {
      conflictNotesKo.push(
        `⚠️ [스타일 과잉 경고] 발광·투명 계열 옵션이 ${glowGroup.length}개 동시 지정되었습니다(${glowGroup.join(", ")}). ` +
        `과잉 렌더링(글리치·과포화)을 방지하기 위해 주 기법 1가지에 집중하고, 나머지는 보조적으로만 적용하십시오. ` +
        `예: 유리/글래스 효과는 주요 장식 패널 1~2개에만 제한하고, 나머지 영역은 매트(matte) 처리를 유지할 것.`
      );
      conflictNotesEn.push(
        `⚠️ [STYLE OVERLOAD WARNING] ${glowGroup.length} glow/glass-type options are simultaneously active (${glowGroup.join(", ")}). ` +
        `To prevent over-rendering artifacts (glitching, over-saturation): focus on ONE primary technique. ` +
        `Apply glass/translucent effects ONLY to 1–2 accent panels. Keep the remaining areas matte and clean.`
      );
    }

    // ── 그룹 B: "어두운 계열"(dark) vs "밝은 계열"(light) 명도 충돌 ──
    const hasDarkBg = state.bgBrightness === "dark";
    const hasLightBg = state.bgBrightness === "light";
    const hasDarkMetaphor = state.layoutMetaphor === "light_refraction"; // 발광계 → 다크배경 자연스러움
    // 배경색 hex 기준으로 밝기 추정 (HEX → 상대 밝기)
    const bgHex = (state.backgroundColor || "#F5F7FB").replace("#", "");
    const bgR = parseInt(bgHex.slice(0,2), 16);
    const bgG = parseInt(bgHex.slice(2,4), 16);
    const bgB = parseInt(bgHex.slice(4,6), 16);
    const bgLuminance = (bgR * 299 + bgG * 587 + bgB * 114) / 1000;
    const bgIsLight = bgLuminance > 160;

    if (hasLightBg && !bgIsLight) {
      conflictNotesKo.push(
        `⚠️ [명도 충돌] 배경 명도 테마가 '라이트'로 설정되었으나 배경색(${state.backgroundColor})이 어두운 계열입니다. ` +
        `배경색 HEX 값을 우선 기준으로 삼아 밝기를 결정하십시오.`
      );
      conflictNotesEn.push(
        `⚠️ [BRIGHTNESS CONFLICT] Brightness theme is set to "Light", but the background color (${state.backgroundColor}) appears dark. ` +
        `Treat the background HEX value as the ground truth for brightness decisions.`
      );
    }
    if (hasDarkBg && bgIsLight) {
      conflictNotesKo.push(
        `⚠️ [명도 충돌] 배경 명도 테마가 '다크'로 설정되었으나 배경색(${state.backgroundColor})이 밝은 계열입니다. ` +
        `배경색 HEX 값을 우선 기준으로 삼아 밝기를 결정하십시오.`
      );
      conflictNotesEn.push(
        `⚠️ [BRIGHTNESS CONFLICT] Brightness theme is set to "Dark", but the background color (${state.backgroundColor}) appears light. ` +
        `Treat the background HEX value as the ground truth for brightness decisions.`
      );
    }

    // ── 그룹 C: "3D 입체" vs "플랫 벡터" 아트스타일 충돌 ──
    const has3DMetaphor = state.layoutMetaphor === "3d_isometric";
    const has3DArt = state.artStyle === "isometric_3d";
    const hasFlatArt = state.artStyle === "vector_flat";
    const hasLineArt = state.artStyle === "line_art";
    const hasClayArt = state.artStyle === "claymorphism";

    if ((has3DMetaphor || has3DArt) && (hasFlatArt || hasLineArt)) {
      conflictNotesKo.push(
        `⚠️ [스타일 충돌] 3D 입체 계열(${has3DMetaphor ? "레이아웃컨셉:3d_isometric" : "아트스타일:isometric_3d"})과 ` +
        `평면 계열(${hasFlatArt ? "아트스타일:vector_flat" : "아트스타일:line_art"})이 동시 지정되었습니다. ` +
        `3D 입체감을 주 방향으로 설정하되, 평면 요소는 UI 텍스트 레이어에만 적용하십시오.`
      );
      conflictNotesEn.push(
        `⚠️ [STYLE CONFLICT] 3D rendering direction (${has3DMetaphor ? "metaphor:3d_isometric" : "art:isometric_3d"}) and ` +
        `flat art direction (${hasFlatArt ? "art:vector_flat" : "art:line_art"}) are simultaneously active. ` +
        `Use 3D as the primary visual treatment; restrict flat elements to typography/UI layers only.`
      );
    }

    // ── 그룹 D: "뉴모피즘" vs "글래스모피즘" 동시 사용 충돌 ──
    const hasNeumorphism = state.artStyle === "neumorphism";
    const hasGlassArt = state.artStyle === "abstract_glass";
    const hasGlassMeta = state.layoutMetaphor === "glassmorphism";
    const hasGlassGrad = state.gradTransEffect === "glassmorphism";

    if (hasNeumorphism && (hasGlassArt || hasGlassMeta || hasGlassGrad)) {
      conflictNotesKo.push(
        `⚠️ [스타일 충돌] 뉴모피즘(neumorphism)과 글래스모피즘(glassmorphism) 계열이 동시 지정되었습니다. ` +
        `두 기법은 빛 모델이 상반되어(내부 엠보싱 vs 외부 투명) 혼합 시 결과물이 왜곡됩니다. ` +
        `하나만 선택하여 적용하십시오.`
      );
      conflictNotesEn.push(
        `⚠️ [STYLE CONFLICT] Neumorphism and Glassmorphism are simultaneously active. ` +
        `These techniques use opposing light models (inner emboss vs. outer transparency) and produce distorted results when mixed. ` +
        `Use ONLY ONE of these techniques.`
      );
    }

    // ── 그룹 E: "클레이모피즘" vs 발광/투명 계열 충돌 ──
    if (hasClayArt && glowGroup.length >= 1) {
      conflictNotesKo.push(
        `⚠️ [스타일 충돌] 클레이모피즘(claymorphism)은 불투명하고 부드러운 매트 재질을 특징으로 하며, ` +
        `발광·투명 계열(${glowGroup.join(", ")})과 혼합 시 재질감이 왜곡됩니다. ` +
        `클레이 질감을 유지하고 발광 효과는 배경 그라데이션에만 서브틀하게 제한하십시오.`
      );
      conflictNotesEn.push(
        `⚠️ [STYLE CONFLICT] Claymorphism requires opaque, matte-soft materials — applying glow/transparency effects (${glowGroup.join(", ")}) simultaneously distorts the clay material look. ` +
        `Keep the clay texture as-is; limit any glow/transparency to the background gradient only, at low opacity.`
      );
    }

    // ── 그룹 F: "미니멀 라인아트 / 미니멀 도형" vs "복합 레이어 구조" 충돌 ──
    const hasMinimalMeta = state.layoutMetaphor === "minimal_line";
    const hasMinimalStrat = state.visualStrategy === "minimal_shape";
    const hasCompositeLayer = state.layerComplexity === "composite";

    if ((hasMinimalMeta || hasMinimalStrat) && hasCompositeLayer) {
      conflictNotesKo.push(
        `⚠️ [복잡도 충돌] 미니멀 계열(${hasMinimalMeta ? "레이아웃컨셉:minimal_line" : ""}${hasMinimalStrat ? " 비주얼전략:minimal_shape" : ""})과 ` +
        `복합 레이어 구조(깊이 레이어: composite)가 동시 지정되었습니다. ` +
        `미니멀 방향을 우선하여, 레이어는 최대 2단(배경+전경)으로 제한하십시오.`
      );
      conflictNotesEn.push(
        `⚠️ [COMPLEXITY CONFLICT] Minimal direction (${hasMinimalMeta ? "metaphor:minimal_line" : ""}${hasMinimalStrat ? " strategy:minimal_shape" : ""}) ` +
        `conflicts with multi-layered composite depth structure. ` +
        `Prioritize the minimal direction: limit layers to a maximum of 2 tiers (background + foreground only).`
      );
    }

    // ── 그룹 G: 레이아웃 구조(Cover) vs 비주얼 전략 충돌 ──
    // editorial_grid + realistic_synth: 그리드 격자 위에 사진합성 → 복잡도 폭발
    if (prefix === "Cover" && state.layoutStructure === "editorial_grid" && state.visualStrategy === "realistic_synth") {
      conflictNotesKo.push(
        `⚠️ [레이아웃 충돌] 매거진 그리드형 레이아웃(editorial_grid)과 실사이미지 합성(realistic_synth)을 동시 사용 시 ` +
        `그리드 구조가 사진 배경에 묻혀 판독 불가 상태가 될 수 있습니다. ` +
        `합성 이미지는 슬라이드 우측 40% 영역에만 배치하고, 좌측 60%는 그리드 타이포 영역으로 유지하십시오.`
      );
      conflictNotesEn.push(
        `⚠️ [LAYOUT CONFLICT] Editorial grid layout combined with realistic photo synthesis may cause the grid structure to be obscured by the photo background. ` +
        `Constrain the synthesized image to the right 40% of the slide. Preserve the left 60% as a clean typographic grid zone.`
      );
    }

    // ── 그룹 H: "대칭 구조" 표현 vs "비대칭 블록형" 레이아웃 충돌 ──
    // (결함방지 문구에서 처리 — 프롬프트 출력부에서 대칭→균형 표현으로 교체)
    const useAsymmetricLayout = (prefix === "Cover" && state.layoutStructure === "asymmetric_block") ||
      (prefix === "Divider" && state.dividerStyle === "vertical_bar") ||
      (prefix === "Background" && state.marginArea === "asymmetric_right");

    // ─────────────────────────────────────────────────────────────
    // Dynamically build layout options lists to renumber and filter out "none"
    // ─────────────────────────────────────────────────────────────
    const layoutLinesKo = [];
    const layoutLinesEn = [];
    let idxKo = 1;
    let idxEn = 1;

    const addLine = (resolved, labelKo, labelEn) => {
      if (resolved?.ko?.trim() || resolved?.en?.trim()) {
        layoutLinesKo.push(`${idxKo++}. ${labelKo}: ${resolved.ko}`);
        layoutLinesEn.push(`${idxEn++}. ${labelEn}: ${resolved.en}`);
      }
    };

    // 1. Layout Metaphor
    const resolvedMetaphor = getOptionVal(state.layoutMetaphor, state.layoutMetaphorCustom, layoutMetaphorMapKo, layoutMetaphorMapEn);
    addLine(resolvedMetaphor, "레이아웃 컨셉", "Visual Metaphor Concept");

    // 2. Visual Strategy
    const resolvedStrategy = getOptionVal(state.visualStrategy, state.visualStrategyCustom, visualStrategyTextKo, visualStrategyTextEn);
    addLine(resolvedStrategy, "비주얼 구성 전략", "Visual Strategy");

    // 3. Tab-specific & Specs
    if (prefix === "Cover") {
      const resolvedStruct = getOptionVal(state.layoutStructure, state.layoutStructureCustom, layoutStructureMapKo, layoutStructureMapEn);
      addLine(resolvedStruct, "표지 구성 레이아웃", "Title Cover Layout");

      const resolvedComplexity = getOptionVal(state.layerComplexity, state.layerComplexityCustom, layerComplexityMapKo, layerComplexityMapEn);
      addLine(resolvedComplexity, "깊이 레이어 구조", "Depth & Layer Structure");
    } else if (prefix === "Divider") {
      const resolvedStyle = getOptionVal(state.dividerStyle, state.dividerStyleCustom, dividerStyleMapKo, dividerStyleMapEn);
      addLine(resolvedStyle, "간지 데코레이션 스타일", "Divider Style Option");

      const resolvedComplexity = getOptionVal(state.layerComplexity, state.layerComplexityCustom, layerComplexityMapKo, layerComplexityMapEn);
      addLine(resolvedComplexity, "깊이 레이어 구조", "Depth & Layer Structure");

      const resolvedHeaderStyle = getOptionVal(state.headerStyle, state.headerStyleCustom, headerStyleMapKo, headerStyleMapEn);
      const resolvedFooterStyle = getOptionVal(state.footerStyle, state.footerStyleCustom, footerStyleMapKo, footerStyleMapEn);
      const resolvedBorderStyle = getOptionVal(state.borderStyle, state.borderStyleCustom, borderStyleMapKo, borderStyleMapEn);

      const frameKo = [resolvedHeaderStyle?.ko, resolvedFooterStyle?.ko, resolvedBorderStyle?.ko].filter(Boolean).join(", ");
      const frameEn = [resolvedHeaderStyle?.en, resolvedFooterStyle?.en, resolvedBorderStyle?.en].filter(Boolean).join(", ");
      if (frameKo) {
        addLine({ ko: frameKo, en: frameEn }, "배경 프레임 사양", "Frame Specifications");
      }

      const resolvedMargin = getOptionVal(state.marginArea, state.marginAreaCustom, marginAreaMapKo, marginAreaMapEn);
      addLine(resolvedMargin, "여백 및 배치 방식", "Page Layout Grid");
    } else if (prefix === "Signboard") {
      const resolvedComplexity = getOptionVal(state.layerComplexity, state.layerComplexityCustom, layerComplexityMapKo, layerComplexityMapEn);
      addLine(resolvedComplexity, "깊이 레이어 구조", "Depth & Layer Structure");
    } else { // Background
      const resolvedHeaderStyle = getOptionVal(state.headerStyle, state.headerStyleCustom, headerStyleMapKo, headerStyleMapEn);
      const resolvedFooterStyle = getOptionVal(state.footerStyle, state.footerStyleCustom, footerStyleMapKo, footerStyleMapEn);
      const resolvedBorderStyle = getOptionVal(state.borderStyle, state.borderStyleCustom, borderStyleMapKo, borderStyleMapEn);

      const frameKo = [resolvedHeaderStyle?.ko, resolvedFooterStyle?.ko, resolvedBorderStyle?.ko].filter(Boolean).join(", ");
      const frameEn = [resolvedHeaderStyle?.en, resolvedFooterStyle?.en, resolvedBorderStyle?.en].filter(Boolean).join(", ");
      if (frameKo) {
        addLine({ ko: frameKo, en: frameEn }, "배경 프레임 사양", "Frame Specifications");
      }

      const resolvedMargin = getOptionVal(state.marginArea, state.marginAreaCustom, marginAreaMapKo, marginAreaMapEn);
      addLine(resolvedMargin, "본문 콘텐츠 배치 영역", "Page Layout Grid");

      const resolvedComplexity = getOptionVal(state.layerComplexity, state.layerComplexityCustom, layerComplexityMapKo, layerComplexityMapEn);
      addLine(resolvedComplexity, "깊이 레이어 구조", "Depth & Layer Structure");
    }

    // 4. Common Advanced Options
    const resolvedArtStyle = getOptionVal(state.artStyle, state.artStyleCustom, artStyleMapKo, artStyleMapEn);
    addLine(resolvedArtStyle, "아트 스타일 기법", "Artistic Style Style");

    const resolvedBrightness = getOptionVal(state.bgBrightness, null, bgBrightnessMapKo, bgBrightnessMapEn);
    addLine(resolvedBrightness, "배경 명도 테마", "Brightness Theme Tone");

    const resolvedGradTrans = getOptionVal(state.gradTransEffect, state.gradTransEffectCustom, gradTransEffectMapKo, gradTransEffectMapEn);
    addLine(resolvedGradTrans, "그라데이션 & 투명 효과", "Gradient & Transparency");

    // 5. Tone & Manner (always added as the last item)
    const toneText = state.brandTone || "전문적이고 정돈된 신뢰감 있는 분위기";
    addLine({ ko: toneText, en: toneText }, "분위기 및 톤앤매너", "Mood & Tone");

    // Color System Block — 용도(role) 명시 추가
    let colorSystemKo = "";
    let colorSystemEn = "";
    if (state.useColorSystem) {
      const docLabel = prefix === "Cover" ? "표지" : prefix === "Divider" ? "간지" : prefix === "Background" ? "배경" : "안내판";
      colorSystemKo = `- 주조색 (Primary ${state.primaryColor}): 헤더 배경 블록, 주요 장식 도형 fill, 핵심 구조선에 사용
- 보조색 (Secondary ${state.secondaryColor}): 서브 도형, 카드 배경, 구분 패널 fill에 사용
- 배경색 (Background ${state.backgroundColor}): ${docLabel} 전체 슬라이드 캔버스 배경에 사용 — 다른 요소가 이 색 위를 덮어도 됨
- 강조색 (Accent ${state.accentColor}): CTA 포인트선, 핵심 아이콘·번호·언더라인에 소량(전체 면적 10% 이내) 사용 — 남발 금지`;
      colorSystemEn = `- Primary ${state.primaryColor}: use for header background block, main decorative shape fills, key structural lines
- Secondary ${state.secondaryColor}: use for sub-shapes, card backgrounds, divider panel fills
- Background ${state.backgroundColor}: use as the full canvas background of the ${docLabel.toLowerCase()} slide — other elements may layer on top
- Accent ${state.accentColor}: use SPARINGLY (≤10% of total area) for CTA accent lines, key icons, numbers, underlines — do NOT overuse`;
    } else {
      colorSystemKo = `- 주조색, 보조색, 배경색, 강조색: 특정 고정 Hex 코드를 따르지 않고, 전체적인 슬라이드 주제와 지정된 브랜드 톤앤매너에 맞게 AI가 유기적이고 자율적인 어울리는 프리미엄 색상을 직접 선택하여 조화롭게 배색해 주십시오.
- 배경-텍스트 대비를 최우선으로 하며, 채도 낮은 2~3색 기반에 강조색 1개만 강하게 사용하십시오.
- 강조색은 전체 면적의 10% 이내로 제한하고, 장식보다 제목·번호·구조선 같은 정보 위계에 사용하십시오.`;
      colorSystemEn = `- Palette (Primary, Secondary, Background, Accent): Autonomously select a harmonious, premium palette matching the visual metaphor and brand tone.
- Prioritize background-to-text contrast; use a restrained low-saturation 2-3 color base with only one strong accent color.
- Restrict accent color to ≤10% of total area and use it for hierarchy such as titles, numbers, and structural lines rather than decoration.`;
    }

    // Placements and placeholders — 입력값이 없는 항목은 프롬프트에 포함하지 않음
    const textHeadline = state.headline ? state.headline.trim() : "";
    const textSub = state.subheadline ? state.subheadline.trim() : "";
    const textMeta = state.metaInfo ? state.metaInfo.trim() : "";

    let placeholderKo = "";
    let placeholderEn = "";
    if (prefix === "Signboard") {
      const textLinesKo = [];
      const textLinesEn = [];
      if (textHeadline) {
        textLinesKo.push(`- 행사 제목 (가장 크고 선명하게 렌더링): "${textHeadline}"`);
        textLinesEn.push(`- Event Title (render largest and most prominent): "${textHeadline}"`);
      }
      const textSchedule = state.schedule ? state.schedule.trim() : "";
      if (textSchedule) {
        textLinesKo.push(`- 행사 일정 (일자 및 시간): "${textSchedule}"`);
        textLinesEn.push(`- Event Schedule (date and time): "${textSchedule}"`);
      }
      const textContact = state.contactInfo ? state.contactInfo.trim() : "";
      if (textContact) {
        if (state.includeContact) {
          textLinesKo.push(`- 담당자 정보 및 연락처: "${textContact}"`);
          textLinesEn.push(`- Contact Information and Phone Number: "${textContact}"`);
        } else {
          textLinesKo.push(`- 담당자 정보 (※전화번호나 연락처 숫자 표기 절대 제외): "${textContact}"`);
          textLinesEn.push(`- Contact Information (※DO NOT include any telephone numbers or digit patterns): "${textContact}"`);
        }
      }
      const textLocText = state.locationText ? state.locationText.trim() : "";
      if (textLocText) {
        textLinesKo.push(`- 안내 위치 및 장소: "${textLocText}"`);
        textLinesEn.push(`- Location and Venue Text: "${textLocText}"`);
      }

      // 화살표 처리
      const arrowMapKo = {
        left: "왼쪽 방향을 가리키는 큰 좌측 화살표 심볼 (←)",
        right: "오른쪽 방향을 가리키는 큰 우측 화살표 심볼 (→)",
        up: "위쪽 방향을 가리키는 큰 상향 화살표 심볼 (↑)",
        down: "아래쪽 방향을 가리키는 큰 하향 화살표 심볼 (↓)"
      };
      const arrowMapEn = {
        left: "large directional left arrow symbol (←) pointing left",
        right: "large directional right arrow symbol (→) pointing right",
        up: "large directional up arrow symbol (↑) pointing up",
        down: "large directional down arrow symbol (↓) pointing down"
      };

      if (state.directionArrow && state.directionArrow !== "none") {
        const arrowKo = arrowMapKo[state.directionArrow];
        const arrowEn = arrowMapEn[state.directionArrow];
        textLinesKo.push(`- 위치 지시 화살표: "${arrowKo}"를 위치 정보 바로 옆에 매우 크고 선명하며 심플한 미니멀 기하학 심볼로 표시할 것`);
        textLinesEn.push(`- Directional Arrow: render a "${arrowEn}" clearly next to the location text as a prominent, simple, minimal geometric icon`);
      }

      if (textLinesKo.length > 0) {
        placeholderKo = `⚠️ [안내판 정보 출력 절대 준수 규칙] 아래 지정된 텍스트는 반드시 입력된 원문 그대로 이미지에 렌더링해야 합니다. 번역, 의역, 요약, 수정, 생략, 보완 등 어떠한 변형도 절대 허용되지 않습니다. 큰따옴표 안의 문자열을 한 글자도 바꾸지 말고 그대로 출력하십시오.\n${textLinesKo.join("\n")}`;
        placeholderEn = `⚠️ [STRICT TEXT VERBATIM RULE] ALL text strings below MUST be rendered exactly as provided — character by character, with zero modification. Do NOT translate, paraphrase, summarize, alter, omit, or rewrite any part of the quoted text. Reproduce each string literally as-is in the image.\n${textLinesEn.join("\n")}`;
      } else {
        placeholderKo = `- 안내판 정보 입력이 없으므로, 레이아웃에 텍스트를 임의로 채우지 마십시오.`;
        placeholderEn = `- No signboard text information specified. Do NOT generate arbitrary text.`;
      }
    } else if (prefix !== "Background") {
      // 입력된 텍스트 항목만 수집
      const textLinesKo = [];
      const textLinesEn = [];
      if (textHeadline) {
        textLinesKo.push(`- 메인 헤드라인 텍스트 (원문 그대로 출력): "${textHeadline}"`);
        textLinesEn.push(`- Main Headline Text (render verbatim, NO translation): "${textHeadline}"`);
      }
      if (textSub) {
        textLinesKo.push(`- 서브 타이틀 텍스트 (원문 그대로 출력): "${textSub}"`);
        textLinesEn.push(`- Subtitle Text (render verbatim, NO translation): "${textSub}"`);
      }
      if (textMeta) {
        textLinesKo.push(`- 메타 정보 텍스트 (원문 그대로 출력): "${textMeta}"`);
        textLinesEn.push(`- Metadata Text (render verbatim, NO translation): "${textMeta}"`);
      }

      if (textLinesKo.length > 0) {
        placeholderKo = `⚠️ [텍스트 출력 절대 준수 규칙] 아래 지정된 텍스트는 반드시 입력된 원문 그대로 이미지에 렌더링해야 합니다. 번역, 의역, 요약, 수정, 생략, 보완 등 어떠한 변형도 절대 허용되지 않습니다. 큰따옴표 안의 문자열을 한 글자도 바꾸지 말고 그대로 출력하십시오.\n${textLinesKo.join("\n")}`;
        placeholderEn = `⚠️ [STRICT TEXT VERBATIM RULE] ALL text strings below MUST be rendered exactly as provided — character by character, with zero modification. Do NOT translate, paraphrase, summarize, alter, omit, or rewrite any part of the quoted text. Reproduce each string literally as-is in the image.\n${textLinesEn.join("\n")}`;
      } else {
        // 텍스트 입력이 전혀 없으면 — 텍스트 영역을 빈 공간으로 처리
        placeholderKo = `- 텍스트 입력이 없으므로, 해당 텍스트 영역은 빈 여백으로 남겨두십시오. 임의로 텍스트를 생성하거나 추가하지 마십시오.`;
        placeholderEn = `- No text has been specified. Leave all text areas as clean empty whitespace. Do NOT generate or add any text content on your own.`;
      }
    } else {
      placeholderKo = `- 레이아웃 속 본문 콘텐츠 영역은 완전한 빈 여백으로 비워둡니다.`;
      placeholderEn = `- Center grid and text areas MUST remain empty as clean whitespace.`;
    }

    // Add headers and footers text & alignment
    if (state.headerText && state.headerPosition !== "none") {
      const posKo = headerPositionMapKo[state.headerPosition] || state.headerPosition;
      const posEn = headerPositionMapEn[state.headerPosition] || state.headerPosition;
      placeholderKo += `\n- 머릿말 텍스트 (원문 그대로, 번역·수정 금지): "${state.headerText}" → ${posKo} 배치`;
      placeholderEn += `\n- Header Text (verbatim, NO translation or modification): "${state.headerText}" → ${posEn}`;
    }
    if (state.footerText && state.footerPosition !== "none") {
      const posKo = headerPositionMapKo[state.footerPosition] || state.footerPosition;
      const posEn = headerPositionMapEn[state.footerPosition] || state.footerPosition;
      placeholderKo += `\n- 꼬릿말 텍스트 (원문 그대로, 번역·수정 금지): "${state.footerText}" → ${posKo} 배치`;
      placeholderEn += `\n- Footer Text (verbatim, NO translation or modification): "${state.footerText}" → ${posEn}`;
    }

    // Add subject image description for realistic synthesis
    if (state.visualStrategy === "realistic_synth" && state.subjectImageDesc) {
      placeholderKo += `\n- 합성할 주제 피사체 묘사: "${state.subjectImageDesc}"를 레이아웃의 비주얼 구역에 현실적이고 입체적으로 합성`;
      placeholderEn += `\n- Subject Image Synthesis: Synthesize "${state.subjectImageDesc}" realistically with proper lighting and shadows into the visual zone`;
    }

    // ── 타이포그래피 계층 지시 빌드 ──
    const typoHierarchyKo = prefix === "Signboard"
      ? `[타이포그래피 계층 & 시인성 비율]
- 행사 제목: 가장 큰 텍스트 (시인성 100%, 기준 비율 1.0×)
- 행사 일정 / 장소: 제목의 약 50% 크기 (기준 비율 0.5×), 깔끔하고 두꺼운 고딕계열 폰트로 렌더링하여 판독성 확보
- 위치 화살표: 장소 텍스트의 약 1.2배 크기로 굵고 뚜렷하게 렌더링
- 담당자 정보: 하단 구석에 작게 배치 (제목의 약 25% 크기, 기준 비율 0.25×)
- 폰트 패밀리: Sans-serif 계열만 사용 (고딕, Noto Sans, Helvetica Neue, Inter 계열). Serif·손글씨체 사용 금지.`
      : prefix !== "Background"
        ? `[타이포그래피 계층 & 크기 비율]
- 메인 헤드라인: 전체 슬라이드 높이 대비 가장 큰 텍스트 (기준 비율 1.0×)
- 서브 타이틀: 헤드라인의 약 45~55% 크기 (기준 비율 0.5×)
- 메타 정보 / 소속: 헤드라인의 약 22~28% 크기 (기준 비율 0.25×), 보조 컬러 처리
- 머릿말·꼬릿말: 메타 정보와 유사하거나 더 작은 크기 (기준 비율 0.2× 이하), 상단/하단 여백 안쪽에 배치
- 폰트 패밀리: Sans-serif 계열만 사용 (고딕, Noto Sans, Helvetica Neue, Inter 계열). Serif·손글씨체 사용 금지.`
        : `[타이포그래피 규칙]
- 배경 슬라이드 전체에 텍스트를 임의로 추가하지 마십시오. 텍스트 영역은 완전한 빈 여백으로 남길 것.
- 폰트 패밀리: 만약 장식용 레이블이 필요한 경우 Sans-serif 계열만 허용.`;

    const typoHierarchyEn = prefix === "Signboard"
      ? `[Typography Hierarchy & Visibility Ratio]
- Event Title: largest text element (100% prominence, ratio 1.0×)
- Schedule & Location: approximately 50% the size of the title (ratio 0.5×), using clean bold Sans-serif font for maximum legibility
- Directional Arrow: rendered prominently, roughly 1.2× the height of the location text
- Contact Info: placed discretely at the bottom area (approximately 25% the size of the title, ratio 0.25×)
- Font family: Sans-serif ONLY (Gothic, Noto Sans, Helvetica, Inter family). NO Serif or handwriting fonts.`
      : prefix !== "Background"
        ? `[Typography Hierarchy & Size Ratio]
- Main Headline: largest text element relative to slide height (ratio 1.0×)
- Subtitle: approximately 45–55% the size of the headline (ratio 0.5×)
- Meta Info / Affiliation: approximately 22–28% the size of the headline (ratio 0.25×), rendered in secondary color
- Header / Footer text: similar to or smaller than meta info (ratio ≤0.2×), placed within top/bottom margin bands
- Font family: Sans-serif ONLY (Gothic, Noto Sans, Helvetica Neue, Inter family). NO Serif or handwriting fonts.`
        : `[Typography Rules]
- Do NOT add any arbitrary text on the background slide. All text zones must remain as clean empty whitespace.
- If a decorative label is required, use Sans-serif fonts only.`;

    // ── 공간 분리 지시 빌드 (Cover/Divider만 해당) ──
    let zoneSeparationKo = "";
    let zoneSeparationEn = "";
    if (prefix === "Cover") {
      if (state.layoutStructure === "asymmetric_block") {
        zoneSeparationKo = `[텍스트/그래픽 공간 분리]
- 텍스트 존: 슬라이드 좌측 55% — 헤드라인, 서브타이틀, 메타 정보를 이 영역 안에 배치
- 그래픽 존: 슬라이드 우측 45% — 비주얼 장식, 오브젝트, 패턴을 이 영역에 집중
- 두 존의 경계는 명확히 구분하고, 그래픽 요소가 텍스트 존을 침범하지 않도록 할 것`;
        zoneSeparationEn = `[Text / Graphic Zone Separation]
- Text zone: left 55% of slide — place headline, subtitle, and meta info strictly within this area
- Graphic zone: right 45% of slide — concentrate visual decorations, objects, and patterns here
- Maintain a clear boundary between zones; graphic elements must NOT intrude into the text zone`;
      } else if (state.layoutStructure === "centered_split") {
        zoneSeparationKo = `[텍스트/그래픽 공간 분리]
- 중앙 분할 구조: 상단 40%에 타이틀 텍스트, 하단 35%에 서브타이틀+메타 배치
- 좌우 배경 장식은 슬라이드 가장자리 20% 이내로 제한`;
        zoneSeparationEn = `[Text / Graphic Zone Separation]
- Centered split: title text in top 40%, subtitle + meta in bottom 35%
- Left/right decorations constrained to outermost 20% margins`;
      } else {
        zoneSeparationKo = `[텍스트/그래픽 공간 분리]
- 텍스트 영역과 그래픽 장식 영역을 시각적으로 명확하게 분리하고, 텍스트 가독성을 최우선으로 확보할 것`;
        zoneSeparationEn = `[Text / Graphic Zone Separation]
- Visually separate text regions from decorative graphic regions; text legibility is the top priority`;
      }
    } else if (prefix === "Divider") {
      zoneSeparationKo = `[텍스트/그래픽 공간 분리]
- 간지의 장 번호·타이틀 텍스트는 슬라이드 중앙 60% 내에 배치하고, 나머지 영역은 그래픽 프레임으로 처리
- 텍스트와 배경 장식 간 대비(contrast)를 충분히 확보하여 텍스트 가독성 보장`;
      zoneSeparationEn = `[Text / Graphic Zone Separation]
- Place chapter number and title text within the central 60% of the slide; treat remaining areas as graphic frame
- Ensure sufficient contrast between text and background decorations to guarantee legibility`;
    } else if (prefix === "Signboard") {
      const arrow = state.directionArrow;
      if (arrow === "left") {
        zoneSeparationKo = `[텍스트/화살표 배치 구조]
- 레이아웃 구성: 좌측 30% 영역에 대형 방향 화살표(←)를 배치하고, 우측 70% 영역에 행사 제목, 일정, 장소 정보를 우측 정렬 또는 좌측 정렬로 구조화하여 균형감 있게 배치할 것.`;
        zoneSeparationEn = `[Layout & Arrow Structure]
- Layout configuration: Place the large leftward arrow (←) in the left 30% area. Arrange the event title, schedule, and location details in the right 70% area with a balanced grid.`;
      } else if (arrow === "right") {
        zoneSeparationKo = `[텍스트/화살표 배치 구조]
- 레이아웃 구성: 우측 30% 영역에 대형 방향 화살표(→)를 배치하고, 좌측 70% 영역에 행사 제목, 일정, 장소 정보를 배치할 것.`;
        zoneSeparationEn = `[Layout & Arrow Structure]
- Layout configuration: Place the large rightward arrow (→) in the right 30% area. Arrange the event title, schedule, and location details in the left 70% area with a balanced grid.`;
      } else if (arrow === "up" || arrow === "down") {
        const arrowSym = arrow === "up" ? "↑" : "↓";
        const arrowPos = arrow === "up" ? "상단" : "하단";
        zoneSeparationKo = `[텍스트/화살표 배치 구조]
- 레이아웃 구성: 슬라이드 중앙의 ${arrowPos} 영역에 대형 화살표(${arrowSym})를 배치하고, 나머지 수직 축에 행사 제목, 일정, 장소 정보를 균형 잡힌 중앙 정렬 레이아웃으로 조화롭게 배치할 것.`;
        zoneSeparationEn = `[Layout & Arrow Structure]
- Layout configuration: Place the large arrow (${arrowSym}) in the center ${arrow === "up" ? "top" : "bottom"} area, and align the event title, schedule, and location vertically along the center axis.`;
      } else {
        zoneSeparationKo = `[레이아웃 배치 구조]
- 슬라이드 중앙 정렬 혹은 비대칭 정렬을 선택하여, 전체 행사 정보(제목, 일정, 장소)가 한눈에 판독되도록 최상의 시인성을 제공하는 균형 잡힌 구조로 배치할 것.`;
        zoneSeparationEn = `[Layout Structure]
- Use a clean centered or asymmetric layout designed for maximum glanceable readability of the event title, schedule, and venue details.`;
      }
    }

    const docIntentKo = prefix === "Cover"
      ? `[문서 표지 품질 강화 지시]
- 표지는 문서 전체의 첫인상을 결정하는 타이틀 키비주얼입니다. 제목 판독성, 기관/프로젝트 신뢰감, 주제 상징성을 우선순위로 설계하십시오.
- 정보 밀도는 낮게 유지하고, 헤드라인·서브타이틀·메타 정보의 위계를 명확히 분리하십시오.
- 비주얼 장식은 타이틀을 압도하지 말고, 주제의 방향성과 브랜드 톤을 보조하는 구조적 배경으로 작동해야 합니다.`
      : prefix === "Divider"
        ? `[문서 간지 품질 강화 지시]
- 간지는 다음 섹션이 시작됨을 분명히 알리는 전환 슬라이드입니다. 장 번호 또는 섹션 제목을 시각적 앵커로 삼아 즉시 인식되게 하십시오.
- 본문 슬라이드보다 정보 밀도를 낮추고, 표지보다 절제된 리듬으로 구역 전환감과 정돈감을 만드십시오.
- 장식 요소는 번호·타이틀·구분선의 방향성을 강화해야 하며, 임의의 포스터형 배경으로 흐르지 않게 하십시오.`
        : prefix === "Background"
          ? `[문서 배경 품질 강화 지시]
- 배경은 이후 텍스트, 표, 차트, 아이콘이 올라갈 작업용 템플릿입니다. 중앙 콘텐츠 안전 영역의 가독성을 최우선으로 보장하십시오.
- 장식 밀도는 가장자리, 프레임, 코너, 헤더/푸터 주변에 집중하고 중앙 본문 영역에는 저대비 패턴·복잡한 질감·강한 광원을 넣지 마십시오.
- 완성 이미지는 단독 포스터가 아니라 반복 사용 가능한 본문 슬라이드 배경이어야 하며, 후속 편집 요소가 올라와도 시각적으로 깨끗해야 합니다.`
          : `[행사 안내판 품질 강화 지시]
- 안내판은 멀리서도 정보가 즉시 판독되어야 하는 시인성 최우선 디자인입니다. 행사 제목, 일정, 장소, 화살표 등 텍스트와 위치 정보의 선명한 전달에 집중하십시오.
- 배경은 저채도로 절제하고, 텍스트와 화살표(있을 경우)는 주조색 및 강조색을 조화롭게 적용하여 고대비 시각적 앵커로 만드십시오.
- 시각 장식이 정보를 가리지 않도록 디자인 밀도와 여백 비율을 신중히 안배하십시오.`;

    const docIntentEn = prefix === "Cover"
      ? `[Document Cover Quality Reinforcement]
- The cover is the title key visual that defines the first impression of the whole document. Prioritize title readability, institutional/project credibility, and thematic symbolism.
- Keep information density low and clearly separate the hierarchy of headline, subtitle, and metadata.
- Visual decoration must not overpower the title; it should work as a structured background that supports the topic direction and brand tone.`
      : prefix === "Divider"
        ? `[Document Divider Quality Reinforcement]
- The divider must clearly signal the beginning of the next section. Use the chapter number or section title as the visual anchor for immediate recognition.
- Keep information density lower than body slides and use a more restrained rhythm than the cover to create a polished transition.
- Decorative elements must reinforce the direction of the number, title, and divider line, not drift into a generic poster background.`
        : prefix === "Background"
          ? `[Document Background Quality Reinforcement]
- The background is a reusable working template for later text, tables, charts, and icons. Prioritize readability in the central content-safe area.
- Concentrate decorative density around edges, frames, corners, headers, and footers; avoid low-contrast patterns, complex textures, or strong light sources in the central body area.
- The result must be a reusable body-slide background rather than a standalone poster, and it must stay visually clean after later editing elements are placed on top.`
          : `[Information Signboard Quality Reinforcement]
- The signboard is a visibility-first design where information must be readable instantly from a distance. Focus on crystal-clear delivery of the event title, schedule, location, and directional arrow.
- Keep the background low-saturation and understated. Treat the text and arrow as high-contrast visual anchors using primary and accent colors.
- Wisely distribute the visual elements and whitespace so that decorative details never obscure the core information.`;

    // Logo & QR prompt blocks
    const logoPositionMapKo = { top_left: "좌측 상단", top_right: "우측 상단", bottom_left: "좌측 하단", bottom_right: "우측 하단", top_center: "상단 중앙" };
    const logoPositionMapEn = { top_left: "top-left", top_right: "top-right", bottom_left: "bottom-left", bottom_right: "bottom-right", top_center: "top-center" };
    const qrPositionMapKo = { bottom_right: "우측 하단", bottom_left: "좌측 하단", bottom_center: "하단 중앙", top_right: "우측 상단" };
    const qrPositionMapEn = { bottom_right: "bottom-right", bottom_left: "bottom-left", bottom_center: "bottom-center", top_right: "top-right" };

    let logoBlockKo = "";
    let logoBlockEn = "";
    let qrBlockKo = "";
    let qrBlockEn = "";
    // Logo block — iterate logos array
    const logos = state.logos || [];
    if (logos.length > 0) {
      const logoLinesKo = logos.map((logo, idx) => {
        const num = logos.length > 1 ? `로고 ${idx + 1}${logo.name ? " (" + logo.name + ")" : ""}` : `로고${logo.name ? " (" + logo.name + ")" : ""}`;
        const pos = logoPositionMapKo[logo.position] || "좌측 상단";
        if (logo.mode === "placeholder") {
          return `- ${num}: ${pos} 모서리에 약 120×40px 크기의 중립적인 회색 사각형 블록(placeholder)을 배치하여 로고 삽입 공간을 표시하시오. 블록 내부에는 아무 텍스트도 표기하지 마시오.`;
        } else {
          const pathNote = logo.path ? `(참조 경로: ${logo.path})` : "";
          return `- ${num}: ${pos} 모서리에 약 120×40px의 로고 삽입 공간을 확보할 것. 로고는 직접 생성하지 말고 해당 위치에 깔끔한 여백 영역으로 처리하시오. ${pathNote}`;
        }
      });
      logoBlockKo = `\n[로고 영역 처리]\n- 로고 이미지는 직접 생성하지 말 것.\n${logoLinesKo.join("\n")}`;

      const logoLinesEn = logos.map((logo, idx) => {
        const num = logos.length > 1 ? `Logo ${idx + 1}${logo.name ? " (" + logo.name + ")" : ""}` : `Logo${logo.name ? " (" + logo.name + ")" : ""}`;
        const pos = logoPositionMapEn[logo.position] || "top-left";
        if (logo.mode === "placeholder") {
          return `- ${num}: place a neutral gray rectangular placeholder (approx. 120×40px) at the ${pos} corner to mark the logo insertion area. No text inside the placeholder.`;
        } else {
          const pathNote = logo.path ? `(Reference path: ${logo.path})` : "";
          return `- ${num}: reserve a logo area (approx. 120×40px) at the ${pos} corner. Do NOT generate the logo — leave a clean blank space. ${pathNote}`;
        }
      });
      logoBlockEn = `\n[Logo Zone Handling]\n- Do NOT generate any logo image.\n${logoLinesEn.join("\n")}`;
    }
    // QR block
    if (state.qrMode === "placeholder") {
      const pos = qrPositionMapKo[state.qrPosition] || "우측 하단";
      const posEn = qrPositionMapEn[state.qrPosition] || "bottom-right";
      qrBlockKo = `\n[QR코드 영역 처리]\n- QR코드 이미지는 생성하지 말 것. 대신 ${pos}에 약 70×70px 크기의 중립적인 회색 정사각형 블록(placeholder)을 배치하여 QR코드 삽입 공간을 표시하시오.`;
      qrBlockEn = `\n[QR Code Zone Handling]\n- Do NOT generate a QR code image. Instead, place a neutral gray square placeholder (approx. 70×70px) at the ${posEn} to mark the QR code insertion area.`;
    } else if (state.qrMode === "full") {
      const pos = qrPositionMapKo[state.qrPosition] || "우측 하단";
      const posEn = qrPositionMapEn[state.qrPosition] || "bottom-right";
      const urlNote = state.qrUrl ? `링크: ${state.qrUrl}` : "";
      const captionNote = state.qrCaption ? `안내문구: "${state.qrCaption}"` : "";
      qrBlockKo = `\n[QR코드 영역 처리]\n- ${pos}에 약 70×70px 크기의 QR코드 placeholder 블록을 배치하시오. QR 이미지는 직접 생성하지 말고 해당 위치에 회색 정사각형으로 표시하시오.${urlNote ? "\n- " + urlNote : ""}${captionNote ? "\n- QR 하단에 캡션 텍스트를 원문 그대로 배치: " + captionNote : ""}`;
      qrBlockEn = `\n[QR Code Zone Handling]\n- Place a QR code placeholder block (approx. 70×70px gray square) at the ${posEn}. Do NOT generate an actual QR code image — use a gray placeholder square.${state.qrUrl ? "\n- Link: " + state.qrUrl : ""}${state.qrCaption ? '\n- Place caption text verbatim below the QR area: "' + state.qrCaption + '"' : ""}`;
    }

    // Prohibition line adjustments based on logo/QR mode
    const hasLogo = logos.length > 0;
    const prohibitLogoKo = hasLogo ? "" : "회사 로고·상표, ";
    const prohibitQrKo = state.qrMode === "none" ? "QR코드, 바코드" : "바코드";
    const prohibitLogoEn = hasLogo ? "" : "company logos/trademarks, ";
    const prohibitQrEn = state.qrMode === "none" ? "QR codes, barcodes" : "barcodes";

    if (state.outputLang === "ko") {
      const docTypeLabel = prefix === "Cover" ? "표지" : prefix === "Divider" ? "간지" : "배경";
      const balanceNote = useAsymmetricLayout
        ? "시각적 균형감 있는 구조로 마무리하고, 정렬 일관성을 확립할 것."
        : "대칭적이고 균형 있는 디자인 구조를 확립할 것.";
      const conflictBlock = conflictNotesKo.length > 0
        ? `\n[스타일 충돌 조정 지시]\n${conflictNotesKo.join("\n")}\n` : "";

      return `[작업 요청] 다음 상세 요구사항과 디자인 가이드라인을 엄격히 준수하여 전문 디자인 에이전시 수준의 고품질 PPT 문서 ${docTypeLabel} 이미지를 생성해 주세요.

[문서 ${docTypeLabel} 디자인 사양]
규격 및 방향: ${layoutRatio}, ${orientationTextKo}
대상 슬라이드 유형: ${prefix === "Cover" ? "타이틀 표지 슬라이드 (Title Cover)" : prefix === "Divider" ? "구역 분리 간지 슬라이드 (Section Divider)" : "본문 내지 배경 템플릿 (Slide Background)"}
${conflictBlock}
[디자인 연출 및 레이아웃 구조]
${layoutLinesKo.join("\n")}

${docIntentKo}

[컬러 시스템 — 용도별 적용 기준]
${colorSystemKo}

${typoHierarchyKo}

${zoneSeparationKo ? zoneSeparationKo + "\n\n" : ""}[정보 및 타이포그래피 배치 영역 — 텍스트 원문 출력 최우선 규칙]
${placeholderKo}
${logoBlockKo}${qrBlockKo}

[디자인 결함 방지 요건]
- 전형적인 AI 생성 이미지 특유의 부자연스러운 느낌 제거: 과도하게 반짝이는 플라스틱 광택(glossy sheen), 왁스 질감(waxy texture), 비현실적으로 번지는 네온/마법 광원(magic CG glow)을 피하십시오.
- 실제 전문 디자인 에이전시에서 작업한 듯한 고해상도 인쇄용 플랫 그래픽, 고급 매트 재질감(matte finish), 정갈한 선과 면의 배치 구조를 최우선으로 연출합니다.
- 텍스트 깨짐 방지, 글자가 서로 겹치지 않게 조절.
- 여백(Whitespace) 비율을 정확히 확보하여 가독성이 높고 답답함이 없는 캠페인급 완성도 구현.
- ${balanceNote}
- ⛔ 이미지 내 포함 금지: 실제 사람 얼굴, ${prohibitLogoKo}국기·국가 상징, 워터마크, ${prohibitQrKo}. 이러한 요소가 필요한 자리는 중립적인 placeholder(회색 블록 등)로 처리할 것.
- ⛔ 텍스트 절대 금지 사항: 지정된 텍스트를 영어로 번역하거나, 의역하거나, 요약하거나, 임의로 수정하는 행위는 절대 허용되지 않습니다. 입력된 원문 텍스트를 한 글자도 바꾸지 말고 그대로 렌더링하십시오.`;
    } else {
      const balanceNoteEn = useAsymmetricLayout
        ? "Finish with a visually balanced composition; maintain consistent alignment throughout."
        : "Establish a symmetrical, balanced design structure.";
      const conflictBlockEn = conflictNotesEn.length > 0
        ? `\n[Style Conflict Adjustment]\n${conflictNotesEn.join("\n")}\n` : "";

      return `[TASK REQUEST] Please generate a high-quality premium PPT document ${prefix === "Cover" ? "Cover" : prefix === "Divider" ? "Divider" : "Background"} design image that strictly adheres to the following detailed requirements and professional design agency guidelines.

[Document ${prefix} Page Design Specifications]
Standard & Direction: ${layoutRatio}, ${orientationTextEn}
Asset Style Target: ${prefix === "Cover" ? "Title Cover Slide" : prefix === "Divider" ? "Chapter/Section Divider Slide" : "Content Background Template Slide"}
${conflictBlockEn}
[Visual Theme & Layout Strategy]
${layoutLinesEn.join("\n")}

${docIntentEn}

[Color System & Palette — Role-Based Application]
${colorSystemEn}

${typoHierarchyEn}

${zoneSeparationEn ? zoneSeparationEn + "\n\n" : ""}[Typography & Layout Placeholders — VERBATIM TEXT RENDERING REQUIRED]
${placeholderEn}
${logoBlockEn}${qrBlockEn}

[Visual Quality & Zero-Defect Rule]
- Eliminate typical AI-generated aesthetics: Avoid cheap glossy plastic reflections, waxy textures, and unnatural magical CGI glows.
- Prioritize realistic high-end publication design style, matte material surfaces, clean geometric solids, and professional vector layout proportions like studio-crafted media.
- Ensure zero text overlapping, precise alignment, and realistic typographic spacing.
- Maximize whitespace distribution for professional premium design balance.
- ${balanceNoteEn}
- ⛔ PROHIBITED image content: real human faces, ${prohibitLogoEn}national flags/symbols, watermarks, ${prohibitQrEn}. Replace any such required area with a neutral placeholder (e.g., solid gray block).
- ⛔ ABSOLUTE TEXT RULE: You are strictly prohibited from translating, paraphrasing, summarizing, or altering any of the specified text strings in any way. Render every quoted text string exactly as-is — do not change even a single character.`;
    }
  }


  function fillSampleData(prefix, state) {
    state.orientation = "landscape";
    state.visualStrategy = "geometric_pattern";
    state.visualStrategyCustom = "";
    state.layerComplexity = "composite";
    state.layerComplexityCustom = "";
    state.brandTone = prefix === "Cover" ? "미래지향적이며 정교하고 신뢰감 있는 분위기" : prefix === "Divider" ? "절제되고 심플하며 고대비적인 정돈감" : prefix === "Background" ? "가독성이 최우선이며 미래 지향적인 분위기" : "시인성이 뛰어나며 정돈되고 깔끔한 분위기";
    state.artStyle = "abstract_glass";
    state.artStyleCustom = "";
    state.bgBrightness = "light";
    state.gradTransEffect = "prism_refraction";
    state.gradTransEffectCustom = "";
    state.headerText = "국정기획보고서";
    state.headerPosition = "left";
    state.footerText = "CONFIDENTIAL";
    state.footerPosition = "right";
    state.subjectImageDesc = "";
    state.useColorSystem = true;
    state.logos = [];
    state.qrMode = "none";
    state.qrUrl = "";
    state.qrCaption = "";
    state.qrPosition = "bottom_right";

    if (prefix === "Cover") {
      state.headline = "2026 차세대 AI 반도체 산업 전략";
      state.subheadline = "초격차 기술 확보 및 글로벌 공급망 허브 구축 방안";
      state.metaInfo = "산업통상자원부 · 반도체정책과";
      state.layoutMetaphor = "geometric";
      state.layoutMetaphorCustom = "";
      state.layoutStructure = "asymmetric_block";
      state.layoutStructureCustom = "";
    } else if (prefix === "Divider") {
      state.headline = "제 2 장. 혁신 기술 및 경쟁력 분석";
      state.subheadline = "미세 공정 한계 돌파를 위한 핵심 과제 및 대안 검토";
      state.metaInfo = "SECTION 02";
      state.layoutMetaphor = "minimal_line";
      state.layoutMetaphorCustom = "";
      state.dividerStyle = "vertical_bar";
      state.dividerStyleCustom = "";
      state.headerStyle = "thin_line";
      state.headerStyleCustom = "";
      state.footerStyle = "bottom_bar";
      state.footerStyleCustom = "";
      state.borderStyle = "corners";
      state.borderStyleCustom = "";
      state.marginArea = "center_80";
      state.marginAreaCustom = "";
    } else if (prefix === "Signboard") {
      state.headline = "2026 차세대 AI 반도체 산업 전략 발표회";
      state.schedule = "2026. 06. 17 (수) 14:00 ~ 17:00";
      state.contactInfo = "산업통상자원부 반도체정책과 (02-123-4567)";
      state.includeContact = true;
      state.directionArrow = "right";
      state.locationText = "3층 대회의실";
      state.layoutMetaphor = "geometric";
      state.layoutMetaphorCustom = "";
    } else { // Background
      state.layoutMetaphor = "geometric";
      state.layoutMetaphorCustom = "";
      state.headerStyle = "thin_line";
      state.headerStyleCustom = "";
      state.footerStyle = "bottom_bar";
      state.footerStyleCustom = "";
      state.borderStyle = "corners";
      state.borderStyleCustom = "";
      state.marginArea = "center_80";
      state.marginAreaCustom = "";
    }

    const preset = COLOR_PRESETS[prefix === "Divider" ? 1 : 0];
    state.primaryColor = preset.primary;
    state.secondaryColor = preset.secondary;
    state.backgroundColor = preset.bg;
    state.accentColor = preset.accent;

    const gridKey = prefix === "Cover" ? "slideCoverColorPresetGrid" : prefix === "Divider" ? "slideDividerColorPresetGrid" : prefix === "Background" ? "slideBackgroundColorPresetGrid" : "slideSignboardColorPresetGrid";
    setupColorPresets(gridKey, prefix.toLowerCase());

    syncUIFromState(prefix, state);
    updatePromptPreview(prefix, state);
    showToast(`[${prefix === "Cover" ? "표지" : prefix === "Divider" ? "간지" : prefix === "Background" ? "배경" : "안내판"}] 샘플 데이터를 채웠습니다.`);
  }

  function resetData(prefix, state) {
    state.orientation = "landscape";
    state.visualStrategy = "minimal_shape";
    state.visualStrategyCustom = "";
    state.layerComplexity = "single";
    state.layerComplexityCustom = "";
    state.brandTone = "";
    state.artStyle = "";
    state.artStyleCustom = "";
    state.bgBrightness = "dark";
    state.gradTransEffect = "";
    state.gradTransEffectCustom = "";
    state.headerText = "";
    state.headerPosition = "none";
    state.footerText = "";
    state.footerPosition = "none";
    state.subjectImageDesc = "";
    state.useColorSystem = false;
    state.logos = [];
    state.qrMode = "none";
    state.qrUrl = "";
    state.qrCaption = "";
    state.qrPosition = "bottom_right";

    if (prefix === "Cover") {
      state.headline = "";
      state.subheadline = "";
      state.metaInfo = "";
      state.layoutMetaphor = "";
      state.layoutMetaphorCustom = "";
      state.layoutStructure = "";
      state.layoutStructureCustom = "";
    } else if (prefix === "Divider") {
      state.headline = "";
      state.subheadline = "";
      state.metaInfo = "";
      state.layoutMetaphor = "";
      state.layoutMetaphorCustom = "";
      state.dividerStyle = "";
      state.dividerStyleCustom = "";
      state.headerStyle = "";
      state.headerStyleCustom = "";
      state.footerStyle = "";
      state.footerStyleCustom = "";
      state.borderStyle = "";
      state.borderStyleCustom = "";
      state.marginArea = "";
      state.marginAreaCustom = "";
    } else if (prefix === "Signboard") {
      state.headline = "";
      state.schedule = "";
      state.contactInfo = "";
      state.includeContact = true;
      state.directionArrow = "right";
      state.locationText = "";
      state.layoutMetaphor = "geometric";
      state.layoutMetaphorCustom = "";
    } else { // Background
      state.layoutMetaphor = "";
      state.layoutMetaphorCustom = "";
      state.headerStyle = "none";
      state.headerStyleCustom = "";
      state.footerStyle = "none";
      state.footerStyleCustom = "";
      state.borderStyle = "none";
      state.borderStyleCustom = "";
      state.marginArea = "center_80";
      state.marginAreaCustom = "";
    }

    const preset = COLOR_PRESETS[0];
    state.primaryColor = preset.primary;
    state.secondaryColor = preset.secondary;
    state.backgroundColor = preset.bg;
    state.accentColor = preset.accent;

    syncUIFromState(prefix, state);
    updatePromptPreview(prefix, state);
    showToast(`[${prefix === "Cover" ? "표지" : prefix === "Divider" ? "간지" : prefix === "Background" ? "배경" : "안내판"}] 설정을 초기화했습니다.`);
  }

  function copyPrompt(prefix, state) {
    const text = compilePrompt(prefix, state);
    navigator.clipboard.writeText(text)
      .then(() => showToast("프롬프트가 클립보드에 복사되었습니다!"))
      .catch(() => showToast("복사에 실패했습니다.", true));
  }

  function triggerActiveAction(actionType) {
    const prefix = activeSubTab === "cover" ? "Cover" : activeSubTab === "divider" ? "Divider" : activeSubTab === "background" ? "Background" : "Signboard";
    const state = getActiveState();
    if (actionType === "sample") fillSampleData(prefix, state);
    else if (actionType === "reset") resetData(prefix, state);
    else if (actionType === "copy") copyPrompt(prefix, state);
  }

  function showToast(msg, isError = false) {
    let toast = document.getElementById("promptdeck-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "promptdeck-toast";
      Object.assign(toast.style, {
        position: "fixed", bottom: "32px", left: "50%",
        transform: "translateX(-50%)", background: "#1e293b",
        color: "#fff", padding: "10px 24px", borderRadius: "24px",
        fontSize: "13px", fontWeight: "600", zIndex: "9999",
        opacity: "0", transition: "opacity 0.25s", pointerEvents: "none"
      });
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.background = isError ? "#b91c1c" : "#1e293b";
    toast.style.opacity = "1";
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = "0"; }, 2500);
  }

  init();
})();
