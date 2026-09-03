// 라벨·티켓 V2 워크스페이스의 UI 전용 상태와 패널 상호작용
(function () {
  "use strict";

  const STORAGE_KEY = "promptdeck_label_sheet_workspace_v3";
  const RECOVERY_KEY = "promptdeck_label_sheet_recovery_v1";
  const CHANGE_EVENT = "promptdeck:label-workspace-change";
  const ROOT_SELECTOR = "#paneLabelSheet.label-sheet-workspace-v2";
  const HISTORY_LIMIT = 30;
  const RECOVERY_LIMIT = 5;
  const WORKSPACE_PRESET_LABELS = Object.freeze({
    design: "제작 작업공간",
    data: "데이터 작업공간",
    focus: "집중 작업공간",
    custom: "사용자 작업공간",
  });
  const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");

  const RESIZER_CONFIG = {
    left: {
      property: "--label-workspace-left-width",
      properties: ["--label-workspace-left-width", "--label-workspace-sidebar-width"],
      axis: "x",
      direction: 1,
      min: 180,
      max: 440,
      panelSelector: "[data-label-workspace-region='left']",
    },
    right: {
      property: "--label-workspace-right-width",
      properties: ["--label-workspace-right-width", "--label-workspace-inspector-width"],
      axis: "x",
      direction: -1,
      min: 280,
      max: 560,
      panelSelector: "[data-label-workspace-region='right']",
    },
    bottom: {
      property: "--label-workspace-bottom-height",
      properties: ["--label-workspace-bottom-height", "--label-workspace-sheet-height"],
      axis: "y",
      direction: -1,
      min: 160,
      max: 560,
      panelSelector: "[data-label-workspace-region='bottom']",
    },
  };

  function init() {
    const root = document.querySelector(ROOT_SELECTOR);
    if (!root || root.dataset.labelWorkspaceControllerReady === "true") return;
    root.dataset.labelWorkspaceControllerReady = "true";

    const toolButtons = Array.from(root.querySelectorAll("[data-label-workspace-tool]"));
    const toolPanels = Array.from(root.querySelectorAll("[data-label-workspace-panel]"));
    const mobileToolPanel = root.querySelector("#labelSheetWorkspaceToolPanel");
    const mobileToolPanelClose = root.querySelector("#labelSheetWorkspaceToolPanelClose");
    const mobileToolTabs = Array.from(root.querySelectorAll("[data-label-workspace-mobile-tool]"));
    const workspaceToolsButton = root.querySelector("#labelSheetWorkspaceToolsBtn");
    const appNavButton = root.querySelector("#labelSheetWorkspaceAppNavBtn");
    const appTabsBar = document.querySelector(".app-tabs-bar");
    const mobileInspector = root.querySelector("#labelSheetWorkspaceInspector");
    const mobileInspectorClose = root.querySelector(".label-sheet-workspace-mobile-inspector-close");
    const canvasButtons = Array.from(root.querySelectorAll("[data-label-canvas-view]"));
    const bottomButtons = Array.from(root.querySelectorAll("[data-label-bottom-tab]"));
    const bottomPanels = Array.from(root.querySelectorAll("[data-label-bottom-panel]"));
    const leftToggle = root.querySelector("#labelSheetWorkspaceLeftToggle");
    const bottomToggle = root.querySelector("#labelSheetWorkspaceBottomToggle");
    const commandButton = root.querySelector("#labelSheetWorkspaceCommandBtn");
    const commandPalette = root.querySelector("#labelSheetWorkspaceCommandPalette");
    const commandSearch = root.querySelector("#labelSheetWorkspaceCommandSearch");
    const commandList = root.querySelector("#labelSheetWorkspaceCommandList");
    const commandEmpty = root.querySelector("#labelSheetWorkspaceCommandEmpty");
    const commandClose = root.querySelector("#labelSheetWorkspaceCommandClose");
    const historyStatus = root.querySelector("#labelSheetWorkspaceHistoryState");
    const workspaceStatus = root.querySelector("#labelSheetWorkspacePresetState");
    const settingsButton = root.querySelector("#labelSheetWorkspaceSettingsBtn");
    const layoutModeButton = root.querySelector("#labelSheetWorkspaceLayoutModeBtn");
    const dataModeButton = root.querySelector("#labelSheetWorkspaceDataModeBtn");
    const reviewButton = root.querySelector("#labelSheetWorkspaceReviewBtn");
    const flowButtons = Array.from(root.querySelectorAll("[data-label-workspace-flow-step]"));
    const flowCurrent = root.querySelector("#labelSheetWorkspaceFlowCurrent");
    const settingsStepHeader = root.querySelector("#labelSheetWorkspaceSettingsStepHeader");
    const settingsStepKicker = root.querySelector("#labelSheetWorkspaceSettingsStepKicker");
    const settingsStepTitle = root.querySelector("#labelSheetWorkspaceSettingsStepTitle");
    const settingsStepDescription = root.querySelector("#labelSheetWorkspaceSettingsStepDescription");
    const settingsStepState = root.querySelector("#labelSheetWorkspaceSettingsStepState");
    const settingsIntentPanel = root.querySelector("#labelSheetIntentPanel");
    const settingsSpecPanel = root.querySelector("#labelSheetSpecStep");
    const settingsNextButton = root.querySelector("#labelSheetWorkspaceSettingsNextBtn");
    const dataNextButton = root.querySelector("#labelSheetWorkspaceDataNextBtn");
    const importCommitButton = root.querySelector("#labelSheetImportCommitBtn");
    const commonButton = root.querySelector("#labelSheetWorkspaceCommonBtn");
    const detailButton = root.querySelector("#labelSheetWorkspaceDetailBtn");
    const placementButton = root.querySelector("#labelSheetWorkspacePlacementBtn");
    const qrButton = root.querySelector("#labelSheetWorkspaceQrBtn");
    const assetsButton = root.querySelector("#labelSheetWorkspaceAssetsBtn");
    const openDetailedEditButton = root.querySelector("#labelSheetOpenDetailedEditBtn");
    const settingsDrawer = root.querySelector("#labelSheetWorkspaceSettingsDrawer");
    const dataDrawer = root.querySelector("#labelSheetWorkspaceDataDrawer");
    const assetsDrawer = root.querySelector("#labelSheetWorkspaceAssetsDrawer");
    const reviewDrawer = root.querySelector("#labelSheetWorkspaceReviewDrawer");
    const promptWorkbench = root.querySelector("#labelSheetWorkspacePromptWorkbench");
    const commonDrawer = root.querySelector("#labelSheetWorkspaceCommonDrawer");
    const qrDrawer = root.querySelector("#labelSheetWorkspaceQrDrawer");
    const contentEditor = root.querySelector("#labelSheetDesignContentStep");
    const placementEditor = root.querySelector("#labelSheetWorkspacePlacementEditor");
    const inspectorTabButtons = Array.from(root.querySelectorAll("[data-label-workspace-inspector-tab]"));
    const inspectorTabPanels = Array.from(root.querySelectorAll("[data-label-workspace-inspector-panel]"));
    const documentSpecButton = root.querySelector("#labelSheetWorkspaceDocumentSpecBtn");
    const inspectorRevealButton = root.querySelector("#labelSheetWorkspaceInspectorRevealBtn");
    const contextTargetPicker = root.querySelector("#labelSheetWorkspaceContextTargetPicker");
    const recoveryMenu = root.querySelector("#labelSheetWorkspaceRecoveryMenu");
    const assetsMenu = root.querySelector("#labelSheetWorkspaceAssetsMenu");
    const recoveryCard = root.querySelector("#labelSheetWorkspaceRecoveryCard");
    const recoveryList = root.querySelector("#labelSheetWorkspaceRecoveryList");
    const undoToast = root.querySelector("#labelSheetWorkspaceUndoToast");
    const undoToastMessage = root.querySelector("#labelSheetWorkspaceUndoToastMessage");
    const undoToastAction = root.querySelector("#labelSheetWorkspaceUndoToastAction");
    const undoToastClose = root.querySelector("#labelSheetWorkspaceUndoToastClose");
    const drawers = [settingsDrawer, dataDrawer, assetsDrawer, reviewDrawer, commonDrawer, qrDrawer].filter(Boolean);
    const menuTriggers = Array.from(root.querySelectorAll("[data-label-workspace-menu-trigger]"));
    const menus = Array.from(root.querySelectorAll("[data-label-workspace-menu]"));
    const statusOutputs = Array.from(root.querySelectorAll("[data-label-workspace-status]"));
    const mobileToolQuery = window.matchMedia("(max-width: 860px)");
    const compactWorkspaceQuery = window.matchMedia("(max-width: 720px), (max-height: 600px) and (max-width: 1024px)");
    let compactWorkspaceWasActive = compactWorkspaceQuery.matches;
    const modalBackground = Array.from(root.querySelector(".label-sheet-shell")?.children || [])
      .filter((element) => !element.matches(".label-sheet-workspace-drawer, .label-sheet-workspace-command-palette"));
    const modalBackgroundState = new Map();

    const saved = readSavedState();
    const state = {
      activeTool: chooseInitialValue(
        saved.activeTool,
        root.dataset.activeTool || root.dataset.workspaceTool,
        toolButtons,
        "labelWorkspaceTool"
      ),
      canvasView: chooseInitialValue(
        saved.canvasView,
        root.dataset.canvasView,
        canvasButtons,
        "labelCanvasView"
      ),
      bottomTab: chooseInitialValue(
        saved.bottomTab,
        root.dataset.bottomTab,
        bottomButtons,
        "labelBottomTab"
      ),
      leftCollapsed: typeof saved.leftCollapsed === "boolean" ? saved.leftCollapsed : false,
      rightCollapsed: typeof saved.rightCollapsed === "boolean" ? saved.rightCollapsed : false,
      bottomCollapsed: compactWorkspaceQuery.matches
        ? true
        : typeof saved.bottomCollapsed === "boolean" ? saved.bottomCollapsed : true,
      workspacePreset: WORKSPACE_PRESET_LABELS[saved.workspacePreset] ? saved.workspacePreset : "design",
      sizes: isPlainObject(saved.sizes) ? saved.sizes : {},
      activeDrawer: null,
      drawerTrigger: null,
      activeMenu: null,
      menuTrigger: null,
      commandPaletteOpen: false,
      commandPaletteTrigger: null,
      activeStep: ["intent", "spec", "data", "design", "output"].includes(saved.activeStep)
        ? saved.activeStep
        : "intent",
    };
    const projectHistory = {
      entries: [],
      index: -1,
      timer: 0,
      applying: false,
    };
    let undoToastTimer = 0;
    let undoToastDirection = -1;

    function snapshot() {
      return {
        activeTool: state.activeTool || "",
        canvasView: state.canvasView || "",
        bottomTab: state.bottomTab || "",
        leftCollapsed: state.leftCollapsed,
        rightCollapsed: state.rightCollapsed,
        bottomCollapsed: state.bottomCollapsed,
        workspacePreset: state.workspacePreset,
        activeDrawer: state.activeDrawer || "",
        activeStep: state.activeStep,
        sizes: { ...state.sizes },
      };
    }

    function emit(kind, value, options) {
      const detail = {
        kind,
        value,
        source: options?.source || "workspace",
        state: snapshot(),
      };
      root.dispatchEvent(new CustomEvent(CHANGE_EVENT, { bubbles: true, composed: true, detail }));
    }

    function persist() {
      const value = {
        version: 4,
        activeTool: state.activeTool,
        canvasView: state.canvasView,
        bottomTab: state.bottomTab,
        leftCollapsed: state.leftCollapsed,
        rightCollapsed: state.rightCollapsed,
        bottomCollapsed: state.bottomCollapsed,
        workspacePreset: state.workspacePreset,
        activeStep: state.activeStep,
        sizes: state.sizes,
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch (_error) {
        // 저장소가 차단된 환경에서도 편집 UI는 계속 동작해야 한다.
      }
    }

    function activateTool(value, options) {
      if (!value || !hasDataValue(toolButtons, "labelWorkspaceTool", value)) return;
      state.activeTool = value;
      root.dataset.activeTool = value;
      root.dataset.workspaceTool = value;
      updateTabGroup(toolButtons, toolPanels, "labelWorkspaceTool", "labelWorkspacePanel", value, "tool");
      mobileToolTabs.forEach((button) => {
        const active = button.dataset.labelWorkspaceMobileTool === value;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
        button.tabIndex = active ? 0 : -1;
      });
      updateStatus(statusOutputs, "tool", controlLabel(toolButtons, "labelWorkspaceTool", value));
      if (options?.focus) focusButton(toolButtons, "labelWorkspaceTool", value);
      if (options?.persist !== false) persist();
      if (options?.emit !== false) emit("tool", value, options);
    }

    function setMobileToolPanelOpen(open, options) {
      const nextOpen = Boolean(open) && mobileToolQuery.matches;
      if (nextOpen && root.classList.contains("is-mobile-inspector-open")) {
        mobileInspectorClose?.click();
      }
      if (nextOpen) {
        const activePanel = toolPanels.find((panel) => panel.dataset.labelWorkspacePanel === state.activeTool);
        if (!activePanel || !mobileToolPanel?.contains(activePanel)) {
          activateTool("project", { source: "mobile-tools", persist: false, emit: false });
        }
      }
      root.classList.toggle("is-mobile-tool-panel-open", nextOpen);
      workspaceToolsButton?.setAttribute("aria-expanded", String(nextOpen));
      if (mobileToolPanel) {
        if (mobileToolQuery.matches) {
          mobileToolPanel.setAttribute("aria-hidden", String(!nextOpen));
          mobileToolPanel.inert = !nextOpen;
        } else {
          mobileToolPanel.removeAttribute("aria-hidden");
          mobileToolPanel.inert = false;
        }
      }
      toolButtons.forEach((button) => {
        if (mobileToolQuery.matches) button.setAttribute("aria-expanded", String(nextOpen && button.dataset.labelWorkspaceTool === state.activeTool));
        else button.removeAttribute("aria-expanded");
      });
      if (nextOpen && options?.focusPanel) {
        const activePanel = toolPanels.find((panel) => panel.dataset.labelWorkspacePanel === state.activeTool && mobileToolPanel?.contains(panel));
        (activePanel?.querySelector(FOCUSABLE_SELECTOR) || mobileToolPanelClose)?.focus({ preventScroll: true });
      } else if (!nextOpen && options?.restoreFocus) {
        (workspaceToolsButton || toolButtons.find((button) => button.dataset.labelWorkspaceTool === state.activeTool))?.focus({ preventScroll: true });
      }
    }

    function activateCanvasView(value, options) {
      if (!value || !hasDataValue(canvasButtons, "labelCanvasView", value)) return;
      state.canvasView = value;
      root.dataset.canvasView = value;
      canvasButtons.forEach((button) => {
        const active = button.dataset.labelCanvasView === value;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      updateStatus(statusOutputs, "canvas", controlLabel(canvasButtons, "labelCanvasView", value));
      if (options?.focus) focusButton(canvasButtons, "labelCanvasView", value);
      if (options?.persist !== false) persist();
      if (options?.emit !== false) emit("canvas-view", value, options);
    }

    function activateBottomTab(value, options) {
      if (!value || !hasDataValue(bottomButtons, "labelBottomTab", value)) return;
      state.bottomTab = value;
      root.dataset.bottomTab = value;
      updateTabGroup(bottomButtons, bottomPanels, "labelBottomTab", "labelBottomPanel", value, "bottom");
      updateStatus(statusOutputs, "bottom", controlLabel(bottomButtons, "labelBottomTab", value));
      if (options?.expand) setBottomCollapsed(false, { emit: false });
      if (options?.focus) focusButton(bottomButtons, "labelBottomTab", value);
      if (options?.persist !== false) persist();
      if (options?.emit !== false) emit("bottom-tab", value, options);
    }

    function setWorkMode(value) {
      const mode = value === "data" || value === "prompt" ? value : "layout";
      root.dataset.workMode = mode;
      [layoutModeButton, dataModeButton].filter(Boolean).forEach((control) => {
        const active = control.dataset.labelWorkspaceMode === mode;
        control.classList.toggle("is-active", active);
        control.setAttribute("aria-pressed", String(active));
      });
      if (workspaceStatus) {
        workspaceStatus.textContent = mode === "data"
          ? "데이터 편집"
          : mode === "prompt" ? "AI 프롬프트 편집" : "레이아웃 편집";
      }
    }

    function setInspectorTab(value, options = {}) {
      const tab = ["object", "background", "document"].includes(value) ? value : "object";
      inspectorTabButtons.forEach((control) => {
        const active = control.dataset.labelWorkspaceInspectorTab === tab;
        control.classList.toggle("is-active", active);
        control.setAttribute("aria-selected", String(active));
        control.tabIndex = active ? 0 : -1;
      });
      inspectorTabPanels.forEach((panel) => {
        const active = panel.dataset.labelWorkspaceInspectorPanel === tab;
        panel.hidden = !active;
        panel.inert = !active;
        panel.setAttribute("aria-hidden", String(!active));
      });
      if (options.focus) inspectorTabButtons.find((control) => control.dataset.labelWorkspaceInspectorTab === tab)?.focus({ preventScroll: true });
    }

    function focusPromptWorkbench(options = {}) {
      if (root.dataset.outputGoal !== "prompt" || !promptWorkbench) return false;
      if (state.activeDrawer) closeDrawer({ restoreFocus: false, source: options.source || "prompt-workbench", emit: false });
      setWorkMode("prompt");
      setFlowStep("output", { source: options.source || "prompt-workbench", emit: false });
      promptWorkbench.scrollIntoView({ block: "nearest", inline: "nearest" });
      if (options.focus) {
        const target = promptWorkbench.querySelector("#labelSheetCopyAllPromptsBtn:not([disabled]), #labelSheetWorkspacePromptGenerateBtn");
        window.requestAnimationFrame(() => target?.focus({ preventScroll: true }));
      }
      return true;
    }

    function setSettingsPanelVisibility(view) {
      [[settingsIntentPanel, "intent"], [settingsSpecPanel, "spec"]].forEach(([panel, panelView]) => {
        if (!panel) return;
        const visible = view === panelView;
        panel.hidden = !visible;
        panel.inert = !visible;
        panel.setAttribute("aria-hidden", String(!visible));
      });
    }

    function setFlowStep(value, options = {}) {
      const step = ["intent", "spec", "data", "design", "output"].includes(value) ? value : "design";
      const steps = {
        intent: { current: "1단계 · 만들 결과물을 정하세요", kicker: "STEP 1 / 5", title: "제작 목표 선택", description: "결과물, 품목, 출력 면을 먼저 정하세요." },
        spec: { current: "2단계 · 용지와 라벨 규격을 확인하세요", kicker: "STEP 2 / 5", title: "용지와 제품 규격", description: "용지 방향, 한 칸 크기와 배치 수를 확인하세요." },
        data: { current: "3단계 · 출력 데이터를 연결하세요" },
        design: { current: "4단계 · 라벨 화면을 편집하세요" },
        output: { current: "5단계 · 오류를 확인하고 저장하세요" },
      };
      state.activeStep = step;
      root.dataset.activeWorkspaceStep = step;
      setSettingsPanelVisibility(step);
      flowButtons.forEach((control) => {
        const active = control.dataset.labelWorkspaceFlowStep === step;
        control.classList.toggle("is-active", active);
        control.setAttribute("aria-current", active ? "step" : "false");
      });
      if (flowCurrent) {
        flowCurrent.dataset.copy = steps[step].current;
        flowCurrent.textContent = steps[step].current;
      }
      if (settingsStepHeader && (step === "intent" || step === "spec")) {
        root.dataset.settingsView = step;
        settingsStepHeader.dataset.step = step;
        if (settingsStepKicker) settingsStepKicker.textContent = steps[step].kicker;
        if (settingsStepTitle) settingsStepTitle.textContent = steps[step].title;
        if (settingsStepDescription) settingsStepDescription.textContent = steps[step].description;
      }
      if (settingsNextButton && (step === "intent" || step === "spec")) {
        settingsNextButton.textContent = step === "intent" ? "다음 · 규격 설정" : "다음 · 데이터 연결";
      }
      if (options.persist !== false) persist();
      if (options.emit !== false) emit("flow-step", step, options);
      if (options.syncCore !== false && root.dataset.activeStep !== step) {
        window.dispatchEvent(new CustomEvent("promptdeck:label-workspace-step-request", { detail: { step } }));
      }
    }

    function setLeftCollapsed(collapsed, options) {
      state.leftCollapsed = Boolean(collapsed);
      if (!["preset", "initialization", "responsive"].includes(options?.source)) setWorkspacePresetName("custom");
      root.classList.toggle("is-left-collapsed", state.leftCollapsed);
      root.dataset.leftPanel = state.leftCollapsed ? "collapsed" : "expanded";
      if (leftToggle) {
        leftToggle.setAttribute("aria-expanded", String(!state.leftCollapsed));
        leftToggle.setAttribute("aria-pressed", String(state.leftCollapsed));
        leftToggle.textContent = state.leftCollapsed ? "도크 펼치기" : "도크 접기";
      }
      if (options?.persist !== false) persist();
      if (options?.emit !== false) emit("left-panel", root.dataset.leftPanel, options);
    }

    function setRightCollapsed(collapsed, options) {
      state.rightCollapsed = Boolean(collapsed);
      if (!["preset", "initialization", "responsive"].includes(options?.source)) setWorkspacePresetName("custom");
      root.classList.toggle("is-right-collapsed", state.rightCollapsed);
      root.dataset.rightPanel = state.rightCollapsed ? "collapsed" : "expanded";
      if (inspectorRevealButton) {
        inspectorRevealButton.hidden = !state.rightCollapsed || mobileToolQuery.matches;
        inspectorRevealButton.setAttribute("aria-expanded", String(!state.rightCollapsed));
      }
      if (!mobileToolQuery.matches && mobileInspector) {
        mobileInspector.setAttribute("aria-hidden", String(state.rightCollapsed));
        mobileInspector.inert = state.rightCollapsed;
      }
      if (state.rightCollapsed && mobileInspector?.contains(document.activeElement)) {
        commandButton?.focus({ preventScroll: true });
      }
      if (options?.persist !== false) persist();
      if (options?.emit !== false) emit("right-panel", root.dataset.rightPanel, options);
    }

    function setBottomCollapsed(collapsed, options) {
      state.bottomCollapsed = Boolean(collapsed);
      if (!["preset", "initialization", "responsive"].includes(options?.source)) setWorkspacePresetName("custom");
      root.classList.toggle("is-bottom-collapsed", state.bottomCollapsed);
      root.dataset.bottomPanel = state.bottomCollapsed ? "collapsed" : "expanded";
      if (bottomToggle) {
        bottomToggle.setAttribute("aria-expanded", String(!state.bottomCollapsed));
        bottomToggle.setAttribute("aria-pressed", String(state.bottomCollapsed));
        bottomToggle.textContent = state.bottomCollapsed ? "펼치기" : "접기";
      }
      bottomPanels.forEach((panel) => {
        const active = panel.dataset.labelBottomPanel === state.bottomTab;
        panel.hidden = state.bottomCollapsed || !active;
        panel.setAttribute("aria-hidden", String(state.bottomCollapsed || !active));
      });
      if (options?.persist !== false) persist();
      if (options?.emit !== false) emit("bottom-panel", root.dataset.bottomPanel, options);
    }

    function setWorkspacePresetName(name) {
      state.workspacePreset = WORKSPACE_PRESET_LABELS[name] ? name : "custom";
      root.dataset.workspacePreset = state.workspacePreset;
      if (workspaceStatus && !root.classList.contains("label-sheet-workspace-v6")) {
        workspaceStatus.textContent = WORKSPACE_PRESET_LABELS[state.workspacePreset];
      }
      root.querySelectorAll("[data-label-workspace-preset]").forEach((control) => {
        const active = control.dataset.labelWorkspacePreset === state.workspacePreset;
        control.classList.toggle("is-active", active);
        control.setAttribute("aria-checked", String(active));
      });
    }

    function applyWorkspacePreset(name, options = {}) {
      if (!WORKSPACE_PRESET_LABELS[name] || name === "custom") return;
      setWorkspacePresetName(name);
      if (name === "design") {
        setLeftCollapsed(false, { source: "preset", emit: false, persist: false });
        setRightCollapsed(false, { source: "preset", emit: false, persist: false });
        setBottomCollapsed(true, { source: "preset", emit: false, persist: false });
        activateTool("layers", { source: "preset", emit: false, persist: false });
        if (root.dataset.outputGoal !== "prompt") activateCanvasView("ticket", { source: "preset", emit: false, persist: false });
      } else if (name === "data") {
        setLeftCollapsed(false, { source: "preset", emit: false, persist: false });
        setRightCollapsed(true, { source: "preset", emit: false, persist: false });
        setBottomCollapsed(false, { source: "preset", emit: false, persist: false });
        activateTool("records", { source: "preset", emit: false, persist: false });
        activateBottomTab("data", { source: "preset", emit: false, persist: false });
      } else {
        setLeftCollapsed(true, { source: "preset", emit: false, persist: false });
        setRightCollapsed(true, { source: "preset", emit: false, persist: false });
        setBottomCollapsed(true, { source: "preset", emit: false, persist: false });
      }
      persist();
      emit("workspace-preset", name, { source: options.source || "preset" });
    }

    function setContentEditorOpen(open, options = {}) {
      if (!contentEditor) return;
      contentEditor.hidden = !open;
      contentEditor.open = open;
      detailButton?.setAttribute("aria-expanded", String(open));
      if (!open || !options.focus) return;
      window.requestAnimationFrame(() => {
        contentEditor.scrollIntoView({ block: "nearest", inline: "nearest" });
        contentEditor.querySelector("input, textarea, select, button")?.focus({ preventScroll: true });
      });
    }

    function setPlacementEditorOpen(open, options = {}) {
      if (!placementEditor) return;
      placementEditor.open = Boolean(open);
      placementButton?.setAttribute("aria-expanded", String(Boolean(open)));
      openDetailedEditButton?.setAttribute("aria-expanded", String(Boolean(open)));
      if (!open || !options.focus) return;
      window.requestAnimationFrame(() => {
        placementEditor.scrollIntoView({ block: "nearest", inline: "nearest" });
        placementEditor.querySelector("select, input, button")?.focus({ preventScroll: true });
      });
    }

    function activateFocusToolPanel(value) {
      root.querySelectorAll(".label-sheet-focus-tool-panel").forEach((panel) => {
        const active = panel.id === `labelSheetFocus${value[0].toUpperCase()}${value.slice(1)}Panel`;
        panel.hidden = !active;
        panel.classList.toggle("active", active);
      });
      root.querySelectorAll("[data-label-sheet-focus-tool]").forEach((control) => {
        const active = control.dataset.labelSheetFocusTool === value;
        control.classList.toggle("active", active);
        control.setAttribute("aria-selected", String(active));
      });
    }

    function setWorkspaceModalState(open, activeDrawer = null) {
      root.classList.toggle("is-drawer-open", open);
      document.body.classList.toggle("label-sheet-modal-open", open);
      if (open) setAppNavOpen(false);
      modalBackground.forEach((element) => {
        if (open) {
          if (!modalBackgroundState.has(element)) {
            modalBackgroundState.set(element, {
              inert: element.inert,
              hadAriaHidden: element.hasAttribute("aria-hidden"),
              ariaHidden: element.getAttribute("aria-hidden"),
            });
          }
          element.inert = true;
          element.setAttribute("aria-hidden", "true");
        } else {
          const previous = modalBackgroundState.get(element);
          element.inert = previous?.inert || false;
          if (previous?.hadAriaHidden) element.setAttribute("aria-hidden", previous.ariaHidden);
          else element.removeAttribute("aria-hidden");
          modalBackgroundState.delete(element);
        }
      });
      drawers.forEach((drawer) => {
        drawer.inert = open && drawer !== activeDrawer;
      });
    }

    function isVisibleTrigger(element) {
      if (!element?.isConnected || element.disabled || element.closest("[hidden], [aria-hidden='true'], [inert]")) return false;
      const style = window.getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
    }

    function resolveDrawerTrigger(kind, requested, activeElement = document.activeElement) {
      const mobileReviewTrigger = document.querySelector(
        '#mobileTabActions [data-proxy-target="labelSheetWorkspaceReviewBtn"], #mobileTabActions [data-proxy-target="labelSheetGeneratePromptBtn"]'
      );
      const fallbacks = kind === "review"
        ? mobileToolQuery.matches
          ? [mobileReviewTrigger, requested, activeElement, reviewButton]
          : [requested, activeElement, reviewButton, mobileReviewTrigger]
        : kind === "common"
          ? [requested, commonButton, activeElement]
          : kind === "qr"
            ? [requested, qrButton, activeElement]
          : kind === "detail"
          ? [requested, placementButton, openDetailedEditButton, activeElement]
          : kind === "data"
          ? [requested, dataModeButton, workspaceToolsButton]
          : kind === "assets"
            ? [requested, workspaceToolsButton, assetsMenu, activeElement, settingsButton]
            : [requested, workspaceToolsButton, settingsButton];
      return fallbacks.find(isVisibleTrigger) || requested || activeElement || null;
    }

    function openDrawer(kind, drawer, trigger, options) {
      if (!drawer) return;
      closeMenu({ restoreFocus: false });
      if (root.classList.contains("is-mobile-tool-panel-open")) {
        setMobileToolPanelOpen(false, { restoreFocus: false });
      }
      if (root.classList.contains("is-mobile-inspector-open")) {
        mobileInspectorClose?.click();
      }
      if (state.activeDrawer && state.activeDrawer !== drawer) {
        closeDrawer({ restoreFocus: false, emit: false });
      }

      state.activeDrawer = drawer;
      state.drawerTrigger = resolveDrawerTrigger(kind, trigger);
      drawers.forEach((item) => setDrawerOpen(item, item === drawer));
      setWorkspaceModalState(true, drawer);
      settingsButton?.setAttribute("aria-expanded", String(drawer === settingsDrawer));
      reviewButton?.setAttribute("aria-expanded", String(drawer === reviewDrawer));
      commonButton?.setAttribute("aria-expanded", String(drawer === commonDrawer));
      qrButton?.setAttribute("aria-expanded", String(drawer === qrDrawer));
      placementButton?.setAttribute("aria-expanded", "false");
      openDetailedEditButton?.setAttribute("aria-expanded", "false");
      dataModeButton?.setAttribute("aria-expanded", String(drawer === dataDrawer));
      if (drawer === dataDrawer) {
        setBottomCollapsed(false, { source: "data-drawer", emit: false, persist: false });
        setWorkMode("data");
        setFlowStep("data", { source: options?.source || "drawer", emit: false });
      } else if (drawer === settingsDrawer) {
        const requestedStep = options?.flowStep || trigger?.dataset?.labelWorkspaceFlowStep;
        setWorkMode("layout");
        setFlowStep(requestedStep === "spec" ? "spec" : "intent", { source: options?.source || "drawer", emit: false });
        if (options?.source === "recovery-menu") {
          root.dataset.settingsView = "recovery";
          setSettingsPanelVisibility("recovery");
          if (settingsStepHeader) settingsStepHeader.dataset.step = "recovery";
          if (settingsStepKicker) settingsStepKicker.textContent = "RECOVERY";
          if (settingsStepTitle) settingsStepTitle.textContent = "최근 자동 저장";
          if (settingsStepDescription) settingsStepDescription.textContent = "복원할 시점을 확인한 뒤 현재 프로젝트에 적용하세요.";
          if (settingsStepState) settingsStepState.textContent = "복원 선택";
          if (settingsNextButton) settingsNextButton.hidden = true;
        } else if (settingsNextButton) {
          settingsNextButton.hidden = false;
        }
      } else if (drawer === reviewDrawer) {
        setWorkMode("layout");
        setFlowStep("output", { source: options?.source || "drawer", emit: false });
      } else {
        setWorkMode("layout");
        setFlowStep("design", { source: options?.source || "drawer", emit: false });
      }
      updateStatus(statusOutputs, "drawer", `${controlLabel([trigger].filter(Boolean), "labelWorkspaceDrawer", kind) || kind} 열림`);

      window.requestAnimationFrame(() => {
        const target = drawer.querySelector("[autofocus]") || drawer.querySelector(FOCUSABLE_SELECTOR) || drawer;
        if (target === drawer && !drawer.hasAttribute("tabindex")) drawer.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      });
      emit("drawer", kind, options);
    }

    function closeDrawer(options) {
      const drawer = state.activeDrawer;
      if (!drawer) return;
      const trigger = state.drawerTrigger;
      const kind = drawer === settingsDrawer
        ? "settings"
        : drawer === dataDrawer
          ? "data"
          : drawer === assetsDrawer
            ? "assets"
            : drawer === reviewDrawer
              ? "review"
              : drawer === commonDrawer
                ? "common"
                  : drawer === qrDrawer ? "qr" : "drawer";
      setDrawerOpen(drawer, false);
      setWorkspaceModalState(false);
      state.activeDrawer = null;
      state.drawerTrigger = null;
      root.removeAttribute("data-settings-view");
      settingsButton?.setAttribute("aria-expanded", "false");
      reviewButton?.setAttribute("aria-expanded", "false");
      commonButton?.setAttribute("aria-expanded", "false");
      qrButton?.setAttribute("aria-expanded", "false");
      placementButton?.setAttribute("aria-expanded", String(Boolean(placementEditor?.open)));
      openDetailedEditButton?.setAttribute("aria-expanded", String(Boolean(placementEditor?.open)));
      dataModeButton?.setAttribute("aria-expanded", "false");
      setWorkMode(root.dataset.outputGoal === "prompt" ? "prompt" : "layout");
      const recordCount = root.querySelectorAll("#labelSheetRecordTableBody tr[data-record-id]").length;
      setFlowStep(root.dataset.outputGoal === "prompt" ? "output" : recordCount ? "design" : kind === "settings" ? state.activeStep : "data", {
        source: options?.source || "drawer-close",
        emit: false,
      });
      if (drawer === commonDrawer) activateFocusToolPanel("quick");
      updateStatus(statusOutputs, "drawer", "닫힘");
      if (options?.restoreFocus !== false) {
        const focusTarget = resolveDrawerTrigger(kind, trigger);
        window.requestAnimationFrame(() => focusTarget?.focus?.({ preventScroll: true }));
      }
      if (options?.emit !== false) emit("drawer", `${kind}:closed`, options);
    }

    function openMenu(menu, trigger, options = {}) {
      if (!menu || !trigger) return;
      if (state.activeMenu && state.activeMenu !== menu) closeMenu({ restoreFocus: false });
      state.activeMenu = menu;
      state.menuTrigger = trigger;
      menus.forEach((item) => {
        const open = item === menu;
        item.hidden = !open;
        item.setAttribute("aria-hidden", String(!open));
      });
      menuTriggers.forEach((item) => item.setAttribute("aria-expanded", String(item === trigger)));
      if (options.focusFirst) menu.querySelector(':is([role="menuitem"], [role="menuitemradio"]):not([disabled])')?.focus({ preventScroll: true });
    }

    function closeMenu(options = {}) {
      const trigger = state.menuTrigger;
      menus.forEach((menu) => {
        menu.hidden = true;
        menu.setAttribute("aria-hidden", "true");
      });
      menuTriggers.forEach((item) => item.setAttribute("aria-expanded", "false"));
      state.activeMenu = null;
      state.menuTrigger = null;
      if (options.restoreFocus && trigger?.isConnected) trigger.focus({ preventScroll: true });
    }

    function normalizedProjectSnapshot() {
      const api = window.PromptDeckLabelSheet;
      const reader = typeof api?.getProjectSnapshot === "function" ? api.getProjectSnapshot : api?.getProject;
      if (typeof reader !== "function") return null;
      try {
        const value = JSON.parse(JSON.stringify(reader()));
        delete value.updatedAt;
        return { value, key: JSON.stringify(value) };
      } catch (_error) {
        return null;
      }
    }

    function readRecoverySnapshots() {
      try {
        const parsed = JSON.parse(window.localStorage.getItem(RECOVERY_KEY) || "[]");
        return Array.isArray(parsed) ? parsed.filter((entry) => entry?.value && entry?.key).slice(0, RECOVERY_LIMIT) : [];
      } catch (_error) {
        return [];
      }
    }

    function writeRecoverySnapshots(entries) {
      try {
        window.localStorage.setItem(RECOVERY_KEY, JSON.stringify(entries.slice(0, RECOVERY_LIMIT)));
        return true;
      } catch (_error) {
        return false;
      }
    }

    function recoveryTimeLabel(savedAt) {
      const value = new Date(savedAt);
      if (Number.isNaN(value.getTime())) return "저장 시각 없음";
      return new Intl.DateTimeFormat("ko-KR", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(value);
    }

    function renderRecoverySnapshots() {
      if (!recoveryList) return;
      const entries = readRecoverySnapshots();
      recoveryList.replaceChildren();
      if (!entries.length) {
        const empty = document.createElement("p");
        empty.className = "label-sheet-workspace-recovery-empty";
        empty.textContent = "복구할 자동 저장본이 아직 없습니다.";
        recoveryList.append(empty);
        return;
      }
      entries.forEach((entry, index) => {
        const row = document.createElement("div");
        row.className = "label-sheet-workspace-recovery-row";
        const copy = document.createElement("span");
        const title = document.createElement("strong");
        const meta = document.createElement("small");
        title.textContent = entry.name || `자동 저장 ${index + 1}`;
        meta.textContent = `${recoveryTimeLabel(entry.savedAt)} · 데이터 ${Number(entry.recordCount) || 0}건`;
        copy.append(title, meta);
        const restore = document.createElement("button");
        restore.type = "button";
        restore.className = "btn secondary label-sheet-compact-btn";
        restore.textContent = index === 0 ? "현재본 복원" : "이 상태 복원";
        restore.addEventListener("click", async () => {
          const api = window.PromptDeckLabelSheet;
          if (typeof api?.replaceProject !== "function") return;
          try {
            await api.replaceProject(entry.value, {
              source: "workspace-recovery",
              message: `${recoveryTimeLabel(entry.savedAt)} 자동 저장 상태를 복원했습니다.`,
            });
            captureProjectHistory({ force: true });
            showUndoToast("자동 저장 상태를 복원했습니다.", -1, "실행 취소");
            closeDrawer({ restoreFocus: true, source: "recovery" });
          } catch (error) {
            const status = root.querySelector("#labelSheetStatus");
            if (status) {
              status.textContent = error.message || "자동 저장 상태를 복원하지 못했습니다.";
              status.dataset.tone = "error";
            }
          }
        });
        row.append(copy, restore);
        recoveryList.append(row);
      });
    }

    function persistRecoverySnapshot(snapshotValue) {
      if (!snapshotValue?.value || !snapshotValue.key) return;
      const entries = readRecoverySnapshots();
      if (entries[0]?.key === snapshotValue.key) return;
      entries.unshift({
        key: snapshotValue.key,
        value: snapshotValue.value,
        savedAt: new Date().toISOString(),
        name: snapshotValue.value.name || "라벨·티켓 프로젝트",
        recordCount: Array.isArray(snapshotValue.value.records) ? snapshotValue.value.records.length : 0,
      });
      if (writeRecoverySnapshots(entries)) renderRecoverySnapshots();
    }

    function hideUndoToast() {
      window.clearTimeout(undoToastTimer);
      if (undoToast) undoToast.hidden = true;
    }

    function showUndoToast(message, direction = -1, actionLabel = "실행 취소") {
      if (!undoToast || state.activeDrawer) return;
      window.clearTimeout(undoToastTimer);
      undoToastDirection = direction;
      if (undoToastMessage) undoToastMessage.textContent = message;
      if (undoToastAction) {
        undoToastAction.textContent = actionLabel;
        undoToastAction.disabled = direction < 0 ? projectHistory.index <= 0 : projectHistory.index >= projectHistory.entries.length - 1;
      }
      undoToast.hidden = false;
      undoToastTimer = window.setTimeout(hideUndoToast, 5200);
    }

    function setAppNavOpen(open, options = {}) {
      const nextOpen = Boolean(open) && mobileToolQuery.matches && root.classList.contains("active");
      document.body.classList.toggle("label-workspace-app-nav-open", nextOpen);
      appNavButton?.setAttribute("aria-expanded", String(nextOpen));
      if (!nextOpen && options.restoreFocus) appNavButton?.focus({ preventScroll: true });
    }

    function updateHistoryUi() {
      const canUndo = projectHistory.index > 0 && !projectHistory.applying;
      const canRedo = projectHistory.index >= 0 && projectHistory.index < projectHistory.entries.length - 1 && !projectHistory.applying;
      root.querySelectorAll('[data-label-workspace-history-command="undo"]').forEach((control) => { control.disabled = !canUndo; });
      root.querySelectorAll('[data-label-workspace-history-command="redo"]').forEach((control) => { control.disabled = !canRedo; });
      if (historyStatus) {
        const undoCount = Math.max(0, projectHistory.index);
        const redoCount = Math.max(0, projectHistory.entries.length - projectHistory.index - 1);
        historyStatus.textContent = projectHistory.applying ? "상태 복원 중…" : `취소 ${undoCount} · 다시 ${redoCount}`;
      }
    }

    function captureProjectHistory(options = {}) {
      if (projectHistory.applying) return;
      const snapshotValue = normalizedProjectSnapshot();
      if (!snapshotValue) return;
      const current = projectHistory.entries[projectHistory.index];
      if (!options.force && current?.key === snapshotValue.key) return;
      if (projectHistory.index < projectHistory.entries.length - 1) {
        projectHistory.entries.splice(projectHistory.index + 1);
      }
      projectHistory.entries.push(snapshotValue);
      if (projectHistory.entries.length > HISTORY_LIMIT) projectHistory.entries.shift();
      projectHistory.index = projectHistory.entries.length - 1;
      persistRecoverySnapshot(snapshotValue);
      updateHistoryUi();
      // Background saves stay silent; explicit undo/redo and recovery actions keep their feedback.
    }

    function scheduleProjectHistoryCapture(delay = 420) {
      if (projectHistory.applying) return;
      window.clearTimeout(projectHistory.timer);
      projectHistory.timer = window.setTimeout(() => captureProjectHistory(), delay);
    }

    async function moveProjectHistory(direction) {
      if (projectHistory.applying) return;
      captureProjectHistory();
      const nextIndex = projectHistory.index + direction;
      if (nextIndex < 0 || nextIndex >= projectHistory.entries.length) return;
      const api = window.PromptDeckLabelSheet;
      if (typeof api?.replaceProject !== "function") return;
      projectHistory.applying = true;
      updateHistoryUi();
      try {
        const action = direction < 0 ? "실행 취소" : "다시 실행";
        await api.replaceProject(projectHistory.entries[nextIndex].value, {
          source: "workspace-history",
          message: `${action}로 이전 프로젝트 상태를 복원했습니다.`,
        });
        projectHistory.index = nextIndex;
        showUndoToast(
          direction < 0 ? "이전 상태로 복원했습니다." : "변경사항을 다시 적용했습니다.",
          direction < 0 ? 1 : -1,
          direction < 0 ? "다시 실행" : "실행 취소"
        );
      } catch (error) {
        const status = root.querySelector("#labelSheetStatus");
        if (status) {
          status.textContent = error.message || "프로젝트 상태를 복원하지 못했습니다.";
          status.dataset.tone = "error";
        }
      } finally {
        projectHistory.applying = false;
        updateHistoryUi();
      }
    }

    function toggleRightPanel(options = {}) {
      if (mobileToolQuery.matches) {
        root.querySelector("#labelSheetWorkspaceInspectorBtn")?.click();
        return;
      }
      setRightCollapsed(!state.rightCollapsed, options);
    }

    function openOrientationSetting(kind, trigger) {
      const textDirection = kind === "text";
      if (textDirection) openFocusDrawer("common", trigger || commonButton, commonDrawer, "common");
      else openDrawer("settings", settingsDrawer, trigger || settingsButton, { source: "orientation-command", flowStep: "spec" });
      window.setTimeout(() => {
        const control = root.querySelector(textDirection ? "#labelSheetContentOrientation" : "#labelSheetOrientation");
        control?.scrollIntoView({ block: "center", inline: "nearest" });
        control?.focus({ preventScroll: true });
      }, 80);
    }

    const paletteCommands = [
      { id: "undo", category: "편집", title: "실행 취소", keywords: "이전 복원 되돌리기", shortcut: "Ctrl+Z", enabled: () => projectHistory.index > 0, run: () => moveProjectHistory(-1) },
      { id: "redo", category: "편집", title: "다시 실행", keywords: "다음 복구", shortcut: "Ctrl+Shift+Z", enabled: () => projectHistory.index < projectHistory.entries.length - 1, run: () => moveProjectHistory(1) },
      { id: "settings", category: "프로젝트", title: "프로젝트 설정 열기", keywords: "품목 규격 용지 양면", shortcut: "Alt+P", run: () => settingsButton?.click() },
      { id: "paper-orientation", category: "레이아웃", title: "용지 방향 설정", keywords: "A4 가로 세로 편집용지", run: () => openOrientationSetting("paper", commandButton) },
      { id: "text-orientation", category: "레이아웃", title: "문구 방향 설정", keywords: "가로쓰기 세로쓰기 글자 세움 90도 회전", run: () => openOrientationSetting("text", commandButton) },
      { id: "data", category: "데이터", title: "데이터 편집기 열기", keywords: "표 csv 레코드 목록", shortcut: "Alt+D", run: () => openDrawer("data", dataDrawer, dataModeButton, { source: "command" }) },
      { id: "assets", category: "레이아웃", title: "배경·디자인 자산", keywords: "배경 이미지 dna", run: () => openDrawer("assets", assetsDrawer, assetsMenu, { source: "command" }) },
      { id: "content", category: "편집", title: "문구 편집 열기", keywords: "제목 부제 본문 하단 템플릿", run: () => detailButton?.click() },
      { id: "qr", category: "편집", title: "QR 코드 설정", keywords: "qr 데이터 배치 크기 여백 합성", run: () => qrButton?.click() },
      { id: "detail", category: "편집", title: "선택 항목 배치·프리셋", keywords: "위치 크기 정렬 프리셋 정밀", run: () => placementButton?.click() },
      { id: "review", category: "프로젝트", title: "검토·내보내기", keywords: "검증 png pdf 인쇄 프롬프트", run: () => reviewButton?.click() },
      { id: "goal-print", category: "제작 방식", title: "직접 제작 모드", keywords: "출력 인쇄 png pdf", run: () => root.querySelector('[data-label-workspace-goal="print"]')?.click() },
      { id: "goal-prompt", category: "제작 방식", title: "AI 프롬프트 모드", keywords: "생성 이미지 배경", run: () => root.querySelector('[data-label-workspace-goal="prompt"]')?.click() },
      { id: "view-ticket", category: "보기", title: "개별 티켓 캔버스", keywords: "확대 단일", run: () => activateCanvasView("ticket", { source: "command" }) },
      { id: "view-sheet", category: "보기", title: "A4 시트 캔버스", keywords: "전체 페이지 배치", run: () => activateCanvasView("sheet", { source: "command" }) },
      { id: "workspace-design", category: "작업 모드", title: "레이아웃 편집으로 돌아가기", keywords: "캔버스 디자인 속성", run: () => state.activeDrawer ? closeDrawer({ source: "command" }) : setWorkMode("layout") },
      { id: "workspace-data", category: "작업 모드", title: "데이터 편집 열기", keywords: "표 목록 매핑", shortcut: "Alt+D", run: () => openDrawer("data", dataDrawer, dataModeButton, { source: "command" }) },
      { id: "toggle-right", category: "보기", title: "속성 패널 접기·펼치기", keywords: "오른쪽 인스펙터", run: () => toggleRightPanel({ source: "command" }) },
      { id: "save-package", category: "프로젝트", title: "프로젝트 ZIP 저장", keywords: "백업 내보내기 파일", run: () => root.querySelector("#labelSheetSavePackageBtn")?.click() },
    ];

    function filteredPaletteCommands() {
      const query = String(commandSearch?.value || "").trim().toLocaleLowerCase();
      if (!query) return paletteCommands;
      const terms = query.split(/\s+/).filter(Boolean);
      return paletteCommands.filter((command) => {
        const haystack = `${command.category} ${command.title} ${command.keywords || ""}`.toLocaleLowerCase();
        return terms.every((term) => haystack.includes(term));
      });
    }

    function renderCommandPalette() {
      if (!commandList) return;
      const commands = filteredPaletteCommands();
      const fragment = document.createDocumentFragment();
      commands.forEach((command, index) => {
        const control = document.createElement("button");
        control.type = "button";
        control.className = "label-sheet-workspace-command-item";
        control.dataset.labelWorkspaceCommand = command.id;
        control.setAttribute("role", "menuitem");
        control.disabled = command.enabled ? !command.enabled() : false;
        control.tabIndex = index === 0 && !control.disabled ? 0 : -1;
        const copy = document.createElement("span");
        const category = document.createElement("small");
        const title = document.createElement("strong");
        category.textContent = command.category;
        title.textContent = command.title;
        copy.append(category, title);
        control.append(copy);
        if (command.shortcut) {
          const shortcut = document.createElement("kbd");
          shortcut.textContent = command.shortcut;
          control.append(shortcut);
        }
        control.addEventListener("click", () => executePaletteCommand(command));
        fragment.append(control);
      });
      commandList.replaceChildren(fragment);
      if (commandEmpty) commandEmpty.hidden = commands.length > 0;
    }

    function openCommandPalette(trigger = commandButton) {
      if (!commandPalette || !commandSearch) return;
      closeMenu({ restoreFocus: false });
      if (state.activeDrawer) closeDrawer({ restoreFocus: false, emit: false });
      state.commandPaletteOpen = true;
      state.commandPaletteTrigger = trigger || document.activeElement;
      commandPalette.hidden = false;
      commandPalette.setAttribute("aria-hidden", "false");
      root.classList.add("is-command-palette-open");
      commandSearch.value = "";
      renderCommandPalette();
      window.requestAnimationFrame(() => commandSearch.focus({ preventScroll: true }));
      emit("command-palette", "open", { source: "command" });
    }

    function closeCommandPalette(options = {}) {
      if (!state.commandPaletteOpen || !commandPalette) return;
      const trigger = state.commandPaletteTrigger;
      state.commandPaletteOpen = false;
      state.commandPaletteTrigger = null;
      commandPalette.hidden = true;
      commandPalette.setAttribute("aria-hidden", "true");
      root.classList.remove("is-command-palette-open");
      if (options.restoreFocus !== false && trigger?.isConnected) trigger.focus({ preventScroll: true });
      if (options.emit !== false) emit("command-palette", "closed", { source: options.source || "command" });
    }

    function executePaletteCommand(command) {
      if (!command || (command.enabled && !command.enabled())) return;
      closeCommandPalette({ restoreFocus: false, source: "execute" });
      Promise.resolve(command.run()).catch(() => {});
    }

    setupTabSemantics(toolButtons, toolPanels, "labelWorkspaceTool", "labelWorkspacePanel", "tool");
    setupTabSemantics(bottomButtons, bottomPanels, "labelBottomTab", "labelBottomPanel", "bottom");
    setupDrawerSemantics(settingsButton, settingsDrawer, "settings");
    setupDrawerSemantics(dataModeButton, dataDrawer, "data");
    setupDrawerSemantics(assetsMenu, assetsDrawer, "assets");
    setupDrawerSemantics(reviewButton, reviewDrawer, "review");
    setupDrawerSemantics(commonButton, commonDrawer, "common");
    setupDrawerSemantics(qrButton, qrDrawer, "qr");

    toolButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const value = button.dataset.labelWorkspaceTool;
        const closeCurrent = mobileToolQuery.matches
          && root.classList.contains("is-mobile-tool-panel-open")
          && state.activeTool === value;
        activateTool(value, { source: "pointer" });
        if (mobileToolQuery.matches) setMobileToolPanelOpen(!closeCurrent, { focusPanel: !closeCurrent });
      });
    });
    const activateMobileTool = (button, source = "mobile-tools") => {
      const value = button?.dataset.labelWorkspaceMobileTool;
      if (value === "records") {
        openDrawer("data", dataDrawer, button, { source });
        return;
      }
      if (value === "assets") {
        openDrawer("assets", assetsDrawer, button, { source });
        return;
      }
      activateTool(value, { source });
    };
    mobileToolTabs.forEach((button) => {
      button.addEventListener("click", () => activateMobileTool(button));
    });
    canvasButtons.forEach((button) => {
      button.addEventListener("click", () => activateCanvasView(button.dataset.labelCanvasView, { source: "pointer" }));
    });
    bottomButtons.forEach((button) => {
      button.addEventListener("click", () => activateBottomTab(button.dataset.labelBottomTab, { expand: true, source: "pointer" }));
    });

    bindRovingKeys(toolButtons, "labelWorkspaceTool", (value) => activateTool(value, { focus: true, source: "keyboard" }));
    bindRovingKeys(canvasButtons, "labelCanvasView", (value) => activateCanvasView(value, { focus: true, source: "keyboard" }));
    bindRovingKeys(bottomButtons, "labelBottomTab", (value) => activateBottomTab(value, { expand: true, focus: true, source: "keyboard" }));
    bindRovingKeys(mobileToolTabs, "labelWorkspaceMobileTool", (value) => {
      activateMobileTool(mobileToolTabs.find((button) => button.dataset.labelWorkspaceMobileTool === value), "keyboard");
    });
    leftToggle?.addEventListener("click", () => setLeftCollapsed(!state.leftCollapsed, { source: "pointer" }));
    bottomToggle?.addEventListener("click", () => setBottomCollapsed(!state.bottomCollapsed, { source: "pointer" }));
    commandButton?.addEventListener("click", () => openCommandPalette(commandButton));
    commandClose?.addEventListener("click", () => closeCommandPalette({ source: "pointer" }));
    commandPalette?.addEventListener("click", (event) => {
      if (event.target === commandPalette) closeCommandPalette({ source: "backdrop" });
    });
    commandSearch?.addEventListener("input", renderCommandPalette);
    commandSearch?.addEventListener("keydown", (event) => {
      const items = Array.from(commandList?.querySelectorAll(".label-sheet-workspace-command-item:not([disabled])") || []);
      if (!["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) return;
      event.preventDefault();
      if (!items.length) return;
      if (event.key === "Enter") {
        items[0].click();
        return;
      }
      (event.key === "ArrowDown" ? items[0] : items[items.length - 1]).focus({ preventScroll: true });
    });
    commandList?.addEventListener("keydown", (event) => {
      const items = Array.from(commandList.querySelectorAll(".label-sheet-workspace-command-item:not([disabled])"));
      const current = items.indexOf(document.activeElement);
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let next = current;
      if (event.key === "Home") next = 0;
      else if (event.key === "End") next = items.length - 1;
      else if (event.key === "ArrowDown") next = (Math.max(0, current) + 1) % items.length;
      else next = (current - 1 + items.length) % items.length;
      items[next]?.focus({ preventScroll: true });
    });
    mobileToolPanelClose?.addEventListener("click", () => setMobileToolPanelOpen(false, { restoreFocus: true }));
    workspaceToolsButton?.addEventListener("click", () => setMobileToolPanelOpen(!root.classList.contains("is-mobile-tool-panel-open"), { focusPanel: true }));
    appNavButton?.addEventListener("click", () => setAppNavOpen(!document.body.classList.contains("label-workspace-app-nav-open")));
    appTabsBar?.addEventListener("click", (event) => {
      if (event.target.closest("[role='tab'], .app-tab-btn")) setAppNavOpen(false);
    });
    settingsButton?.addEventListener("click", () => toggleDrawer("settings", settingsDrawer, settingsButton));
    layoutModeButton?.addEventListener("click", () => {
      if (state.activeDrawer === dataDrawer) closeDrawer({ source: "mode-switch" });
      else {
        setWorkMode("layout");
        setFlowStep("design", { source: "mode-switch" });
      }
    });
    reviewButton?.addEventListener("click", () => {
      if (!focusPromptWorkbench({ source: "review-button", focus: true })) toggleDrawer("review", reviewDrawer, reviewButton);
    });
    commonButton?.addEventListener("click", () => openFocusDrawer("common", commonButton, commonDrawer, "common"));
    detailButton?.addEventListener("click", () => {
      setInspectorTab("object");
      setContentEditorOpen(contentEditor?.hidden, { focus: true });
    });
    placementButton?.addEventListener("click", () => {
      setInspectorTab("object");
      const open = !placementEditor?.open;
      activateFocusToolPanel(open ? "detail" : "quick");
      setPlacementEditorOpen(open, { focus: true });
    });
    qrButton?.addEventListener("click", () => {
      setInspectorTab("object");
      toggleDrawer("qr", qrDrawer, qrButton);
    });
    assetsButton?.addEventListener("click", () => openDrawer("assets", assetsDrawer, assetsButton, { source: "surface-assets" }));
    openDetailedEditButton?.addEventListener("click", () => placementButton?.click());
    flowButtons.forEach((control) => {
      control.addEventListener("click", () => {
        const step = control.dataset.labelWorkspaceFlowStep;
        if (step === "intent" || step === "spec") {
          openDrawer("settings", settingsDrawer, control, { source: "flow", flowStep: step });
          window.setTimeout(() => {
            const target = root.querySelector(step === "intent" ? "#labelSheetIntentPanel" : "#labelSheetSpecStep");
            target?.scrollIntoView({ block: "start", inline: "nearest" });
          }, 80);
          return;
        }
        if (step === "data") {
          openDrawer("data", dataDrawer, control, { source: "flow" });
          return;
        }
        if (step === "output") {
          if (!focusPromptWorkbench({ source: "flow", focus: true })) openDrawer("review", reviewDrawer, control, { source: "flow" });
          return;
        }
        if (state.activeDrawer) closeDrawer({ restoreFocus: false, source: "flow" });
        setWorkMode("layout");
        setFlowStep("design", { source: "flow" });
        activateCanvasView("ticket", { source: "flow" });
      });
    });
    settingsNextButton?.addEventListener("click", () => {
      if (state.activeStep === "intent") {
        setFlowStep("spec", { source: "settings-next" });
        window.requestAnimationFrame(() => {
          settingsDrawer?.querySelector(".label-sheet-workspace-drawer-body")?.scrollTo({ top: 0, behavior: "smooth" });
          settingsStepTitle?.focus?.({ preventScroll: true });
        });
        return;
      }
      openDrawer("data", dataDrawer, settingsNextButton, { source: "settings-next" });
    });
    dataNextButton?.addEventListener("click", () => {
      if (dataNextButton.disabled) return;
      closeDrawer({ restoreFocus: false, source: "data-next" });
      setFlowStep("design", { source: "data-next" });
      activateCanvasView("ticket", { source: "data-next" });
    });
    importCommitButton?.addEventListener("click", () => {
      window.setTimeout(() => {
        const hasRecords = root.querySelectorAll("#labelSheetRecordTableBody tr[data-record-id]").length > 0;
        if (!hasRecords || !importCommitButton.disabled || state.activeDrawer !== dataDrawer) return;
        closeDrawer({ restoreFocus: false, source: "data-applied" });
        setFlowStep("design", { source: "data-applied" });
        activateCanvasView("ticket", { source: "data-applied" });
      }, 120);
    });
    function openFocusDrawer(panel, trigger, drawer = commonDrawer, drawerKind = "common") {
      root.querySelector(`[data-label-sheet-focus-tool="${panel}"]`)?.click();
      activateFocusToolPanel(panel);
      if (state.activeDrawer !== drawer) openDrawer(drawerKind, drawer, trigger, { source: "pointer" });
    }

    function syncLayerMenuCommands() {
      const activeTarget = root.querySelector("#labelSheetQuickTarget")?.value || "content";
      root.querySelectorAll("[data-label-workspace-layer-command]").forEach((control) => {
        const active = control.dataset.labelWorkspaceLayerCommand === activeTarget;
        control.classList.toggle("is-active", active);
        control.setAttribute("aria-checked", String(active));
      });
    }

    menuTriggers.forEach((trigger, index) => {
      const menu = menus.find((item) => item.dataset.labelWorkspaceMenu === trigger.dataset.labelWorkspaceMenuTrigger);
      trigger.addEventListener("click", () => {
        if (state.activeMenu === menu) closeMenu({ restoreFocus: false });
        else {
          if (trigger.dataset.labelWorkspaceMenuTrigger === "edit") syncLayerMenuCommands();
          openMenu(menu, trigger);
        }
      });
      trigger.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          if (trigger.dataset.labelWorkspaceMenuTrigger === "edit") syncLayerMenuCommands();
          openMenu(menu, trigger, { focusFirst: true });
          return;
        }
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        const direction = event.key === "ArrowLeft" ? -1 : 1;
        menuTriggers[(index + direction + menuTriggers.length) % menuTriggers.length]?.focus({ preventScroll: true });
      });
    });

    menus.forEach((menu) => {
      menu.addEventListener("keydown", (event) => {
        const items = Array.from(menu.querySelectorAll(':is([role="menuitem"], [role="menuitemradio"]):not([disabled])'));
        const current = items.indexOf(document.activeElement);
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          let next = current;
          if (event.key === "Home") next = 0;
          else if (event.key === "End") next = items.length - 1;
          else if (event.key === "ArrowDown") next = (Math.max(0, current) + 1) % items.length;
          else next = (current - 1 + items.length) % items.length;
          items[next]?.focus({ preventScroll: true });
        }
      });
      menu.addEventListener("click", () => closeMenu({ restoreFocus: false }));
    });

    root.querySelectorAll("[data-label-workspace-bottom-command]").forEach((control) => {
      control.addEventListener("click", () => {
        const command = control.dataset.labelWorkspaceBottomCommand;
        if (state.activeDrawer !== dataDrawer) openDrawer("data", dataDrawer, control, { source: "data-command" });
        if (["mapping", "validation"].includes(command)) {
          activateBottomTab(command, { expand: true, source: "menu" });
          return;
        }
        activateBottomTab("data", { expand: true, source: "menu" });
        const tabId = command === "paste" ? "labelSheetDataPasteTab" : command === "csv" ? "labelSheetDataCsvTab" : "labelSheetDataDirectTab";
        root.querySelector(`#${tabId}`)?.click();
        window.requestAnimationFrame(() => root.querySelector(`#${tabId}`)?.focus({ preventScroll: true }));
      });
    });
    assetsMenu?.addEventListener("click", () => openDrawer("assets", assetsDrawer, assetsMenu, { source: "menu" }));
    documentSpecButton?.addEventListener("click", () => openDrawer("settings", settingsDrawer, documentSpecButton, { source: "document-spec", flowStep: "spec" }));
    inspectorTabButtons.forEach((control) => {
      control.addEventListener("click", () => setInspectorTab(control.dataset.labelWorkspaceInspectorTab));
      control.addEventListener("keydown", (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const current = inspectorTabButtons.indexOf(control);
        const next = event.key === 'Home' ? 0
          : event.key === 'End' ? inspectorTabButtons.length - 1
            : (current + (event.key === 'ArrowRight' ? 1 : -1) + inspectorTabButtons.length) % inspectorTabButtons.length;
        const nextTab = inspectorTabButtons[next];
        setInspectorTab(nextTab.dataset.labelWorkspaceInspectorTab, { focus: true });
      });
    });
    root.querySelectorAll("[data-label-workspace-prompt-command]").forEach((control) => {
      control.addEventListener("click", () => {
        const command = control.dataset.labelWorkspacePromptCommand;
        if (command === "assets") openDrawer("assets", assetsDrawer, control, { source: "prompt-workbench" });
        if (command === "data") openDrawer("data", dataDrawer, control, { source: "prompt-workbench" });
      });
    });
    root.querySelectorAll("[data-label-workspace-canvas-command]").forEach((control) => {
      control.addEventListener("click", () => activateCanvasView(control.dataset.labelWorkspaceCanvasCommand, { source: "menu" }));
    });
    root.querySelectorAll("[data-label-workspace-layer-command]").forEach((control) => {
      control.addEventListener("click", () => {
        const target = control.dataset.labelWorkspaceLayerCommand;
        const quickTarget = root.querySelector("#labelSheetQuickTarget");
        if (quickTarget && quickTarget.value !== target) {
          quickTarget.value = target;
          quickTarget.dispatchEvent(new Event("change", { bubbles: true }));
        }
        root.querySelector(`[data-label-sheet-focus-target="${target}"]`)?.click();
        syncLayerMenuCommands();
      });
    });
    inspectorRevealButton?.addEventListener("click", () => {
      setRightCollapsed(false, { source: "inspector-reveal" });
      commonButton?.focus({ preventScroll: true });
    });
    root.querySelectorAll("[data-label-workspace-context-nudge]").forEach((control) => {
      control.addEventListener("click", () => {
        root.querySelector(`[data-label-sheet-nudge="${control.dataset.labelWorkspaceContextNudge}"]`)?.click();
      });
    });
    root.querySelectorAll("[data-label-workspace-context-align]").forEach((control) => {
      control.addEventListener("click", () => {
        root.querySelector(`[data-label-sheet-focus-align="${control.dataset.labelWorkspaceContextAlign}"]`)?.click();
      });
    });
    root.querySelectorAll("[data-label-workspace-orientation-command]").forEach((control) => {
      control.addEventListener("click", () => openOrientationSetting(control.dataset.labelWorkspaceOrientationCommand, control));
    });
    root.querySelectorAll("[data-label-workspace-history-command]").forEach((control) => {
      control.addEventListener("click", () => moveProjectHistory(control.dataset.labelWorkspaceHistoryCommand === "undo" ? -1 : 1));
    });
    recoveryMenu?.addEventListener("click", () => {
      renderRecoverySnapshots();
      openDrawer("settings", settingsDrawer, settingsButton, { source: "recovery-menu" });
      window.setTimeout(() => {
        recoveryCard?.scrollIntoView({ block: "start" });
        recoveryList?.querySelector("button")?.focus({ preventScroll: true });
      }, 80);
    });
    undoToastAction?.addEventListener("click", () => {
      const direction = undoToastDirection;
      hideUndoToast();
      void moveProjectHistory(direction);
    });
    undoToastClose?.addEventListener("click", hideUndoToast);
    root.querySelectorAll("[data-label-workspace-preset]").forEach((control) => {
      control.setAttribute("role", "menuitemradio");
      control.addEventListener("click", () => applyWorkspacePreset(control.dataset.labelWorkspacePreset, { source: "menu" }));
    });
    root.querySelectorAll("[data-label-workspace-toggle-command]").forEach((control) => {
      control.addEventListener("click", () => {
        const command = control.dataset.labelWorkspaceToggleCommand;
        if (command === "left") setLeftCollapsed(!state.leftCollapsed, { source: "menu" });
        else if (command === "right") toggleRightPanel({ source: "menu" });
        else if (command === "bottom") setBottomCollapsed(!state.bottomCollapsed, { source: "menu" });
        else root.querySelector("#labelSheetFocusShortcutHelpBtn")?.click();
      });
    });

    function toggleDrawer(kind, drawer, trigger) {
      if (state.activeDrawer === drawer) closeDrawer({ source: "trigger" });
      else openDrawer(kind, drawer, trigger, { source: "pointer" });
    }

    root.querySelectorAll("[data-label-workspace-drawer-close]").forEach((button) => {
      button.addEventListener("click", () => closeDrawer({ source: "pointer" }));
    });
    drawers.forEach((drawer) => {
      drawer.addEventListener("click", (event) => {
        if (event.target === drawer) closeDrawer({ source: "backdrop" });
      });
      drawer.addEventListener("cancel", (event) => {
        event.preventDefault();
        closeDrawer({ source: "escape" });
      });
    });

    ["input", "change", "click", "pointerup"].forEach((eventName) => {
      root.addEventListener(eventName, () => scheduleProjectHistoryCapture(eventName === "input" ? 520 : 320));
    });
    window.addEventListener("promptdeck:label-sheet-project-replaced", (event) => {
      if (event.detail?.source !== "workspace-history") scheduleProjectHistoryCapture(80);
    });
    window.addEventListener("promptdeck:label-workspace-record-count", (event) => {
      const count = Math.max(0, Number(event.detail?.count) || 0);
      if (state.activeDrawer) return;
      if (count > 0 && ["intent", "spec", "data"].includes(state.activeStep)) {
        setFlowStep("design", { source: "record-sync" });
      } else if (count === 0 && ["design", "output"].includes(state.activeStep)) {
        setFlowStep("intent", { source: "record-sync" });
      }
    });
    window.addEventListener("promptdeck:label-sheet-project-change", () => scheduleProjectHistoryCapture(260));
    window.addEventListener("promptdeck:label-sheet-goal-change", () => scheduleProjectHistoryCapture(80));
    window.addEventListener("promptdeck:label-sheet-step-change", (event) => {
      const step = event.detail?.step;
      if (!step || step === state.activeStep) return;
      setFlowStep(step, { source: "core-sync", syncCore: false });
    });
    window.addEventListener("promptdeck:label-sheet-step-state-change", (event) => {
      const readiness = event.detail?.readiness?.[state.activeStep] || "incomplete";
      const labels = {
        incomplete: "미완료",
        complete: "완료",
        warning: "확인 필요",
        blocked: "선행 단계 필요",
      };
      const stateLabel = labels[readiness] || labels.incomplete;
      if (flowCurrent) {
        flowCurrent.dataset.state = "current";
        flowCurrent.dataset.readiness = readiness;
        flowCurrent.textContent = `${flowCurrent.dataset.copy || flowCurrent.textContent} · 현재 · ${stateLabel}`;
      }
      if (settingsStepState && ["intent", "spec"].includes(state.activeStep)) {
        settingsStepState.dataset.state = "current";
        settingsStepState.dataset.readiness = readiness;
        settingsStepState.textContent = `현재 · ${stateLabel}`;
      }
    });
    window.addEventListener("promptdeck:label-sheet-focus-issue", (event) => {
      const detail = event.detail || {};
      if (detail.route === "settings") {
        openDrawer("settings", settingsDrawer, settingsButton, { source: "preflight" });
        return;
      }
      if (detail.route === "assets") {
        openDrawer("assets", assetsDrawer, assetsMenu, { source: "preflight" });
        return;
      }
      if (detail.route === "data") {
        openDrawer("data", dataDrawer, dataModeButton, { source: "preflight" });
        activateBottomTab("data", { expand: true, source: "preflight" });
        return;
      }
      activateCanvasView("ticket", { source: "preflight" });
      if (mobileToolQuery.matches) setBottomCollapsed(true, { source: "preflight" });
      if (detail.route === "advanced") {
        openDrawer("qr", qrDrawer, qrButton, { source: "preflight" });
      }
    });

    document.addEventListener("pointerdown", (event) => {
      if (contextTargetPicker?.open && !contextTargetPicker.contains(event.target)) {
        contextTargetPicker.open = false;
      }
      if (state.activeMenu && !state.activeMenu.contains(event.target) && !state.menuTrigger?.contains(event.target)) {
        closeMenu({ restoreFocus: false });
      }
      const drawer = state.activeDrawer;
      if (!drawer || drawer.contains(event.target) || state.drawerTrigger?.contains(event.target)) return;
      closeDrawer({ source: "outside" });
    });
    document.addEventListener("keydown", (event) => {
      if (!root.classList.contains("active") || root.hidden) return;
      if (state.commandPaletteOpen) {
        if (event.key === "Escape") {
          event.preventDefault();
          closeCommandPalette({ source: "escape" });
        } else if (event.key === "Tab" && commandPalette) {
          keepFocusInDrawer(event, commandPalette);
        }
        return;
      }
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        openCommandPalette(document.activeElement);
        return;
      }
      if (modifier && event.key.toLocaleLowerCase() === "z" && !isEditableTarget(event.target)) {
        event.preventDefault();
        moveProjectHistory(event.shiftKey ? 1 : -1);
        return;
      }
      if (modifier && event.key.toLocaleLowerCase() === "y" && !isEditableTarget(event.target)) {
        event.preventDefault();
        moveProjectHistory(1);
        return;
      }
      if (event.altKey && !modifier && ["1", "2", "3"].includes(event.key)) {
        event.preventDefault();
        if (event.key === "2") openDrawer("data", dataDrawer, dataModeButton, { source: "keyboard" });
        else if (state.activeDrawer) closeDrawer({ source: "keyboard" });
        else {
          setRightCollapsed(event.key === "3", { source: "keyboard" });
          setWorkMode("layout");
        }
        return;
      }
      if (event.altKey && !modifier && event.key.toLocaleLowerCase() === "p") {
        event.preventDefault();
        settingsButton?.click();
        return;
      }
      if (event.altKey && !modifier && event.key.toLocaleLowerCase() === "d") {
        event.preventDefault();
        openDrawer("data", dataDrawer, dataModeButton, { source: "keyboard" });
        return;
      }
      if (state.activeMenu && event.key === "Escape") {
        event.preventDefault();
        closeMenu({ restoreFocus: true });
        return;
      }
      if (state.activeMenu && event.key === "Tab") closeMenu({ restoreFocus: false });
      if (contextTargetPicker?.open && event.key === "Escape") {
        event.preventDefault();
        contextTargetPicker.open = false;
        contextTargetPicker.querySelector("summary")?.focus({ preventScroll: true });
        return;
      }
      if (event.key === "Escape" && document.body.classList.contains("label-workspace-app-nav-open")) {
        event.preventDefault();
        setAppNavOpen(false, { restoreFocus: true });
        return;
      }
      if (event.key === "Escape" && root.classList.contains("is-mobile-tool-panel-open")) {
        event.preventDefault();
        setMobileToolPanelOpen(false, { restoreFocus: true });
        return;
      }
      if (event.key === "Tab" && root.classList.contains("is-mobile-tool-panel-open") && mobileToolPanel) {
        keepFocusInDrawer(event, mobileToolPanel);
        return;
      }
      if (event.key === "Tab" && root.classList.contains("is-mobile-inspector-open") && mobileInspector) {
        keepFocusInDrawer(event, mobileInspector);
        return;
      }
      if (!state.activeDrawer) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer({ source: "escape" });
      } else if (event.key === "Tab") {
        keepFocusInDrawer(event, state.activeDrawer);
      }
    });

    setupResizers(root, state, persist, emit);
    restoreSizes(root, state.sizes);

    if (state.activeTool) activateTool(state.activeTool, { persist: false, emit: false });
    if (state.canvasView) activateCanvasView(state.canvasView, { persist: false, emit: false });
    if (state.bottomTab) activateBottomTab(state.bottomTab, { persist: false, emit: false });
    setWorkspacePresetName(state.workspacePreset);
    setLeftCollapsed(state.leftCollapsed, { source: "initialization", persist: false, emit: false });
    setRightCollapsed(false, { source: "initialization", persist: false, emit: false });
    setBottomCollapsed(state.bottomCollapsed, { source: "initialization", persist: false, emit: false });
    setMobileToolPanelOpen(false);
    setInspectorTab("object");
    const initialPromptMode = root.dataset.outputGoal === "prompt";
    setWorkMode(initialPromptMode ? "prompt" : "layout");
    setFlowStep(initialPromptMode ? "output" : root.querySelector("#labelSheetRecordTableBody tr[data-record-id]") ? "design" : "intent", {
      source: "initialization",
      persist: false,
      emit: false,
    });
    drawers.forEach((drawer) => setDrawerOpen(drawer, false));
    window.addEventListener("promptdeck:label-sheet-goal-change", () => {
      if (root.dataset.outputGoal === "prompt" && !state.activeDrawer) {
        focusPromptWorkbench({ source: "goal-change" });
      }
    });
    const syncResponsivePanels = () => {
      if (!root.classList.contains("active") && state.activeDrawer) {
        closeDrawer({ restoreFocus: false, source: "tab-change" });
      }
      if (!mobileToolQuery.matches || !root.classList.contains("is-mobile-tool-panel-open")) {
        setMobileToolPanelOpen(false);
      }
      if (!mobileToolQuery.matches || !root.classList.contains("active")) setAppNavOpen(false);
      setRightCollapsed(state.rightCollapsed, { source: "responsive", persist: false, emit: false });
      const compactWorkspaceIsActive = compactWorkspaceQuery.matches;
      if (compactWorkspaceIsActive && !compactWorkspaceWasActive) {
        setBottomCollapsed(true, { source: "responsive" });
      }
      compactWorkspaceWasActive = compactWorkspaceIsActive;
    };
    window.addEventListener("resize", syncResponsivePanels, { passive: true });
    mobileToolQuery.addEventListener?.("change", syncResponsivePanels);
    new MutationObserver(syncResponsivePanels).observe(root, { attributes: true, attributeFilter: ["class"] });
    persist();
    renderRecoverySnapshots();
    window.setTimeout(() => captureProjectHistory({ force: true }), 700);
    updateHistoryUi();
    emit("ready", "v6", { source: "initialization" });
  }

  function chooseInitialValue(savedValue, rootValue, buttons, dataKey) {
    const values = buttons.map((button) => button.dataset[dataKey]).filter(Boolean);
    if (values.includes(savedValue)) return savedValue;
    if (values.includes(rootValue)) return rootValue;
    const selected = buttons.find((button) => button.classList.contains("is-active") || button.getAttribute("aria-selected") === "true" || button.getAttribute("aria-pressed") === "true");
    return selected?.dataset[dataKey] || values[0] || "";
  }

  function isEditableTarget(target) {
    return Boolean(target?.closest?.("input, textarea, select, [contenteditable='true']"));
  }

  function hasDataValue(elements, dataKey, value) {
    return elements.some((element) => element.dataset[dataKey] === value);
  }

  function focusButton(buttons, dataKey, value) {
    buttons.find((button) => button.dataset[dataKey] === value)?.focus({ preventScroll: true });
  }

  function updateTabGroup(buttons, panels, buttonDataKey, panelDataKey, value, prefix) {
    buttons.forEach((button) => {
      const active = button.dataset[buttonDataKey] === value;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => {
      const active = panel.dataset[panelDataKey] === value;
      panel.classList.toggle("is-active", active);
      panel.hidden = !active;
      panel.setAttribute("aria-hidden", String(!active));
      if (!panel.id) panel.id = makePanelId(prefix, panel.dataset[panelDataKey]);
    });
  }

  function setupTabSemantics(buttons, panels, buttonDataKey, panelDataKey, prefix) {
    panels.forEach((panel) => {
      if (!panel.id) panel.id = makePanelId(prefix, panel.dataset[panelDataKey]);
      if (!panel.hasAttribute("role")) panel.setAttribute("role", "tabpanel");
    });
    buttons.forEach((button) => {
      if (!button.hasAttribute("role")) button.setAttribute("role", "tab");
      const value = button.dataset[buttonDataKey];
      const panel = panels.find((item) => item.dataset[panelDataKey] === value);
      if (!button.id) button.id = `${makePanelId(prefix, value)}-tab`;
      if (panel && !button.hasAttribute("aria-controls")) button.setAttribute("aria-controls", panel.id);
      if (panel && !panel.hasAttribute("aria-labelledby")) panel.setAttribute("aria-labelledby", button.id);
    });
    const parents = new Set(buttons.map((button) => button.parentElement).filter(Boolean));
    if (parents.size === 1) {
      const tabList = parents.values().next().value;
      if (!tabList.hasAttribute("role")) tabList.setAttribute("role", "tablist");
    }
  }

  function bindRovingKeys(buttons, dataKey, activate) {
    buttons.forEach((button) => {
      button.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const current = buttons.indexOf(button);
        let next = current;
        if (event.key === "Home") next = 0;
        else if (event.key === "End") next = buttons.length - 1;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (current - 1 + buttons.length) % buttons.length;
        else next = (current + 1) % buttons.length;
        const value = buttons[next]?.dataset[dataKey];
        if (value) activate(value);
      });
    });
  }

  function setupDrawerSemantics(trigger, drawer, kind) {
    if (!drawer) return;
    if (!drawer.id) drawer.id = `labelSheetWorkspace${capitalize(kind)}Drawer`;
    if (!drawer.hasAttribute("role")) drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    trigger?.setAttribute("aria-controls", drawer.id);
    trigger?.setAttribute("aria-haspopup", "dialog");
    trigger?.setAttribute("aria-expanded", "false");
  }

  function setDrawerOpen(drawer, open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.dataset.open = String(open);
    drawer.setAttribute("aria-hidden", String(!open));
    if (typeof HTMLDialogElement !== "undefined" && drawer instanceof HTMLDialogElement) {
      if (open && !drawer.open) {
        drawer.hidden = false;
        try {
          drawer.showModal();
        } catch (_error) {
          drawer.setAttribute("open", "");
        }
      } else if (!open && drawer.open) {
        drawer.close();
        drawer.hidden = true;
      } else {
        drawer.hidden = !open;
      }
    } else {
      drawer.hidden = !open;
    }
  }

  function keepFocusInDrawer(event, drawer) {
    const focusable = Array.from(drawer.querySelectorAll(FOCUSABLE_SELECTOR)).filter((element) => {
      if (element.hidden || element.closest("[hidden], [aria-hidden='true'], [inert]")) return false;
      const style = window.getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
    });
    if (!focusable.length) {
      event.preventDefault();
      drawer.focus({ preventScroll: true });
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!drawer.contains(document.activeElement)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus({ preventScroll: true });
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }

  function setupResizers(root, state, persist, emit) {
    root.querySelectorAll("[data-label-workspace-resizer]").forEach((handle) => {
      const name = handle.dataset.labelWorkspaceResizer;
      const base = RESIZER_CONFIG[name];
      if (!base) return;
      const requestedProperty = handle.dataset.labelWorkspaceResizeProperty;
      const property = findAvailableProperty(root, requestedProperty, base.properties || [base.property]);
      if (!property) return;

      handle.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        const startPointer = base.axis === "x" ? event.clientX : event.clientY;
        const startSize = resolveCurrentSize(root, handle, base, property);
        if (!Number.isFinite(startSize)) return;
        event.preventDefault();
        handle.setPointerCapture?.(event.pointerId);
        root.classList.add("is-resizing");
        handle.classList.add("is-resizing");

        const move = (moveEvent) => {
          const pointer = base.axis === "x" ? moveEvent.clientX : moveEvent.clientY;
          const value = clamp(startSize + (pointer - startPointer) * base.direction, base.min, resolveMax(root, base));
          root.style.setProperty(property, `${Math.round(value)}px`);
        };
        const end = (endEvent) => {
          handle.removeEventListener("pointermove", move);
          handle.removeEventListener("pointerup", end);
          handle.removeEventListener("pointercancel", end);
          handle.releasePointerCapture?.(endEvent.pointerId);
          root.classList.remove("is-resizing");
          handle.classList.remove("is-resizing");
          const value = root.style.getPropertyValue(property).trim();
          if (/^\d+(?:\.\d+)?px$/.test(value)) {
            state.sizes[property] = value;
            persist();
            emit("resize", { property, value }, { source: "pointer" });
          }
        };
        handle.addEventListener("pointermove", move);
        handle.addEventListener("pointerup", end);
        handle.addEventListener("pointercancel", end);
      });
    });
  }

  function restoreSizes(root, sizes) {
    Object.entries(sizes).forEach(([property, value]) => {
      if (!isSafeCustomProperty(property) || !/^\d+(?:\.\d+)?px$/.test(String(value))) return;
      if (hasCustomProperty(root, property)) root.style.setProperty(property, value);
    });
  }

  function resolveCurrentSize(root, handle, config, property) {
    const customValue = Number.parseFloat(getComputedStyle(root).getPropertyValue(property));
    if (Number.isFinite(customValue)) return customValue;
    const region = root.querySelector(handle.dataset.labelWorkspaceResizeTarget || config.panelSelector);
    if (!region) return Number.NaN;
    const rect = region.getBoundingClientRect();
    return config.axis === "x" ? rect.width : rect.height;
  }

  function resolveMax(root, config) {
    if (config.axis === "y") return Math.max(config.min, Math.min(config.max, root.clientHeight * 0.68));
    return Math.max(config.min, Math.min(config.max, root.clientWidth * 0.42));
  }

  function hasCustomProperty(root, property) {
    return Boolean(getComputedStyle(root).getPropertyValue(property).trim());
  }

  function findAvailableProperty(root, requestedProperty, candidates) {
    if (isSafeCustomProperty(requestedProperty) && hasCustomProperty(root, requestedProperty)) return requestedProperty;
    return candidates.find((property) => hasCustomProperty(root, property)) || "";
  }

  function isSafeCustomProperty(property) {
    return typeof property === "string" && /^--[a-z0-9-]+$/i.test(property);
  }

  function readSavedState() {
    try {
      const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
      return isPlainObject(value) ? value : {};
    } catch (_error) {
      return {};
    }
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function updateStatus(outputs, kind, text) {
    if (!text) return;
    outputs.forEach((output) => {
      if (output.dataset.labelWorkspaceStatus !== kind) return;
      output.textContent = text;
    });
  }

  function controlLabel(controls, dataKey, value) {
    const control = controls.find((item) => item?.dataset?.[dataKey] === value) || controls[0];
    return control?.getAttribute("aria-label") || control?.textContent?.trim().replace(/\s+/g, " ") || "";
  }

  function makePanelId(prefix, value) {
    const slug = String(value || "panel").replace(/[^a-z0-9_-]/gi, "-");
    return `labelSheetWorkspace-${prefix}-${slug}`;
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
