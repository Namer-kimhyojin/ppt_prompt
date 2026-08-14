// 라벨·티켓 V2 워크스페이스의 UI 전용 상태와 패널 상호작용
(function () {
  "use strict";

  const STORAGE_KEY = "promptdeck_label_sheet_workspace_v2";
  const CHANGE_EVENT = "promptdeck:label-workspace-change";
  const ROOT_SELECTOR = "#paneLabelSheet.label-sheet-workspace-v2";
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
    const canvasButtons = Array.from(root.querySelectorAll("[data-label-canvas-view]"));
    const bottomButtons = Array.from(root.querySelectorAll("[data-label-bottom-tab]"));
    const bottomPanels = Array.from(root.querySelectorAll("[data-label-bottom-panel]"));
    const leftToggle = root.querySelector("#labelSheetWorkspaceLeftToggle");
    const bottomToggle = root.querySelector("#labelSheetWorkspaceBottomToggle");
    const settingsButton = root.querySelector("#labelSheetWorkspaceSettingsBtn");
    const reviewButton = root.querySelector("#labelSheetWorkspaceReviewBtn");
    const settingsDrawer = root.querySelector("#labelSheetWorkspaceSettingsDrawer");
    const reviewDrawer = root.querySelector("#labelSheetWorkspaceReviewDrawer");
    const drawers = [settingsDrawer, reviewDrawer].filter(Boolean);
    const statusOutputs = Array.from(root.querySelectorAll("[data-label-workspace-status]"));

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
      bottomCollapsed: typeof saved.bottomCollapsed === "boolean" ? saved.bottomCollapsed : false,
      sizes: isPlainObject(saved.sizes) ? saved.sizes : {},
      activeDrawer: null,
      drawerTrigger: null,
    };

    function snapshot() {
      return {
        activeTool: state.activeTool || "",
        canvasView: state.canvasView || "",
        bottomTab: state.bottomTab || "",
        leftCollapsed: state.leftCollapsed,
        bottomCollapsed: state.bottomCollapsed,
        activeDrawer: state.activeDrawer || "",
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
        version: 2,
        activeTool: state.activeTool,
        canvasView: state.canvasView,
        bottomTab: state.bottomTab,
        leftCollapsed: state.leftCollapsed,
        bottomCollapsed: state.bottomCollapsed,
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
      updateStatus(statusOutputs, "tool", controlLabel(toolButtons, "labelWorkspaceTool", value));
      if (options?.focus) focusButton(toolButtons, "labelWorkspaceTool", value);
      if (options?.persist !== false) persist();
      if (options?.emit !== false) emit("tool", value, options);
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

    function setLeftCollapsed(collapsed, options) {
      state.leftCollapsed = Boolean(collapsed);
      root.classList.toggle("is-left-collapsed", state.leftCollapsed);
      root.dataset.leftPanel = state.leftCollapsed ? "collapsed" : "expanded";
      if (leftToggle) {
        leftToggle.setAttribute("aria-expanded", String(!state.leftCollapsed));
        leftToggle.setAttribute("aria-pressed", String(state.leftCollapsed));
      }
      if (options?.persist !== false) persist();
      if (options?.emit !== false) emit("left-panel", root.dataset.leftPanel, options);
    }

    function setBottomCollapsed(collapsed, options) {
      state.bottomCollapsed = Boolean(collapsed);
      root.classList.toggle("is-bottom-collapsed", state.bottomCollapsed);
      root.dataset.bottomPanel = state.bottomCollapsed ? "collapsed" : "expanded";
      if (bottomToggle) {
        bottomToggle.setAttribute("aria-expanded", String(!state.bottomCollapsed));
        bottomToggle.setAttribute("aria-pressed", String(state.bottomCollapsed));
      }
      bottomPanels.forEach((panel) => {
        const active = panel.dataset.labelBottomPanel === state.bottomTab;
        panel.hidden = state.bottomCollapsed || !active;
        panel.setAttribute("aria-hidden", String(state.bottomCollapsed || !active));
      });
      if (options?.persist !== false) persist();
      if (options?.emit !== false) emit("bottom-panel", root.dataset.bottomPanel, options);
    }

    function openDrawer(kind, drawer, trigger, options) {
      if (!drawer) return;
      if (state.activeDrawer && state.activeDrawer !== drawer) {
        closeDrawer({ restoreFocus: false, emit: false });
      }

      state.activeDrawer = drawer;
      state.drawerTrigger = trigger || null;
      drawers.forEach((item) => setDrawerOpen(item, item === drawer));
      settingsButton?.setAttribute("aria-expanded", String(drawer === settingsDrawer));
      reviewButton?.setAttribute("aria-expanded", String(drawer === reviewDrawer));
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
      const kind = drawer === settingsDrawer ? "settings" : drawer === reviewDrawer ? "review" : "drawer";
      setDrawerOpen(drawer, false);
      state.activeDrawer = null;
      state.drawerTrigger = null;
      settingsButton?.setAttribute("aria-expanded", "false");
      reviewButton?.setAttribute("aria-expanded", "false");
      updateStatus(statusOutputs, "drawer", "닫힘");
      if (options?.restoreFocus !== false && trigger?.isConnected) {
        trigger.focus({ preventScroll: true });
      }
      if (options?.emit !== false) emit("drawer", `${kind}:closed`, options);
    }

    setupTabSemantics(toolButtons, toolPanels, "labelWorkspaceTool", "labelWorkspacePanel", "tool");
    setupTabSemantics(bottomButtons, bottomPanels, "labelBottomTab", "labelBottomPanel", "bottom");
    setupDrawerSemantics(settingsButton, settingsDrawer, "settings");
    setupDrawerSemantics(reviewButton, reviewDrawer, "review");

    toolButtons.forEach((button) => {
      button.addEventListener("click", () => activateTool(button.dataset.labelWorkspaceTool, { source: "pointer" }));
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

    leftToggle?.addEventListener("click", () => setLeftCollapsed(!state.leftCollapsed, { source: "pointer" }));
    bottomToggle?.addEventListener("click", () => setBottomCollapsed(!state.bottomCollapsed, { source: "pointer" }));
    settingsButton?.addEventListener("click", () => toggleDrawer("settings", settingsDrawer, settingsButton));
    reviewButton?.addEventListener("click", () => toggleDrawer("review", reviewDrawer, reviewButton));

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

    document.addEventListener("pointerdown", (event) => {
      const drawer = state.activeDrawer;
      if (!drawer || drawer.contains(event.target) || state.drawerTrigger?.contains(event.target)) return;
      closeDrawer({ source: "outside" });
    });
    document.addEventListener("keydown", (event) => {
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
    setLeftCollapsed(state.leftCollapsed, { persist: false, emit: false });
    setBottomCollapsed(state.bottomCollapsed, { persist: false, emit: false });
    drawers.forEach((drawer) => setDrawerOpen(drawer, false));
    persist();
    emit("ready", "v2", { source: "initialization" });
  }

  function chooseInitialValue(savedValue, rootValue, buttons, dataKey) {
    const values = buttons.map((button) => button.dataset[dataKey]).filter(Boolean);
    if (values.includes(savedValue)) return savedValue;
    if (values.includes(rootValue)) return rootValue;
    const selected = buttons.find((button) => button.classList.contains("is-active") || button.getAttribute("aria-selected") === "true" || button.getAttribute("aria-pressed") === "true");
    return selected?.dataset[dataKey] || values[0] || "";
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
    const focusable = Array.from(drawer.querySelectorAll(FOCUSABLE_SELECTOR)).filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");
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
