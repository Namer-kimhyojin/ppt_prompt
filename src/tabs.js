// 디자이너/생성기/홍보이미지 탭 전환
(function () {
  const tabs = {
    designer: {
      button: document.getElementById("tabBtnDesigner"),
      pane: document.getElementById("paneDesigner"),
      group: "deck",
      actions: "designer",
      actionHost: ".preview-panel",
      stickyActionPanel: true,
    },
    commonPrompt: {
      button: document.getElementById("tabBtnCommonPrompt"),
      pane: document.getElementById("paneCommonPrompt"),
      group: "deck",
      actions: "commonPrompt",
      actionHost: ".cpd-summary-inner",
      stickyActionPanel: false,
    },
    generator: {
      button: document.getElementById("tabBtnGenerator"),
      pane: document.getElementById("paneGenerator"),
      group: "deck",
      actions: "generator",
      actionHost: ".gen-result-stack",
      stickyActionPanel: false,
    },
    promotion: {
      button: document.getElementById("tabBtnPromotion"),
      pane: document.getElementById("panePromotion"),
      group: "special",
      actions: "promotion",
      actionHost: ".promo-result-stack",
      stickyActionPanel: false,
    },
    slideImage: {
      button: document.getElementById("tabBtnSlideImage"),
      pane: document.getElementById("paneSlideImage"),
      group: "deck",
      actions: "slideImage",
      actionHost: ".slide-image-result-section",
      stickyActionPanel: true,
    },
    mapPrompt: {
      button: document.getElementById("tabBtnMapPrompt"),
      pane: document.getElementById("paneMapPrompt"),
      group: "special",
      actions: "mapPrompt",
      actionHost: ".map-result-stack",
      stickyActionPanel: false,
    },
    dataDiagram: {
      button: document.getElementById("tabBtnDataDiagram"),
      pane: document.getElementById("paneDataDiagram"),
      group: "special",
      actions: "dataDiagram",
      actionHost: ".diagram-result-stack",
      stickyActionPanel: false,
    },
    slideDocument: {
      button: document.getElementById("tabBtnSlideDocument"),
      pane: document.getElementById("paneSlideDocument"),
      group: "special",
      actions: "slideDocument",
      actionHost: ".slide-sub-pane.active .slide-doc-preview-section",
      stickyActionPanel: true,
    },
    promotionPlanner: {
      button: document.getElementById("tabBtnPromotionPlanner"),
      pane: document.getElementById("panePromotionPlanner"),
      group: "visual",
      actions: "promotionPlanner",
    },
    photoTransform: {
      button: document.getElementById("tabBtnPhotoTransform"),
      pane: document.getElementById("panePhotoTransform"),
      group: "visual",
      actions: "photoTransform",
      actionHost: ".pt-results-column",
      stickyActionPanel: false,
    },
    conceptMixer: {
      button: document.getElementById("tabBtnConceptMixer"),
      pane: document.getElementById("paneConceptMixer"),
      group: "visual",
      actions: "conceptMixer",
      actionHost: ".mixer-right",
    },
    formImage: {
      button: document.getElementById("tabBtnFormImage"),
      pane: document.getElementById("paneFormImage"),
      group: "special",
      actions: "formImage",
      actionHost: ".form-image-result-stack",
      stickyActionPanel: false,
    },
    documentDesign: {
      button: document.getElementById("tabBtnDocumentDesign"),
      pane: document.getElementById("paneDocumentDesign"),
      group: "deck",
      actions: "documentDesign",
      actionHost: ".doc-design-result-stack",
      stickyActionPanel: false,
    },
    labelSheet: {
      button: document.getElementById("tabBtnLabelSheet"),
      pane: document.getElementById("paneLabelSheet"),
      group: "special",
      actions: "labelSheet",
      actionHost: ".label-sheet-workspace-actions",
      stickyActionPanel: false,
    },
    qrGenerator: {
      button: document.getElementById("tabBtnQrGenerator"),
      pane: document.getElementById("paneQrGenerator"),
      group: "special",
      actions: "qrGenerator",
      actionHost: ".qr-result-stack",
      stickyActionPanel: false,
    },
  };

  const tabActions = document.getElementById("tabActions");
  const mobileTabActions = document.getElementById("mobileTabActions");
  const tabList = document.querySelector(".app-tabs");
  const groupFilters = Array.from(document.querySelectorAll("[data-tab-group-filter]"));
  const appToolMenuButton = document.getElementById("appToolMenuBtn");
  const mobileActiveTool = document.getElementById("mobileActiveTool");
  const ACTIVE_TAB_STORAGE_KEY = "promptdeck.activeTab.v1";
  const DEFAULT_TAB_KEY = "commonPrompt";
  const defaultTabsByGroup = {
    deck: "commonPrompt",
    visual: "promotionPlanner",
    special: "formImage",
  };
  const designerActions = tabActions ? Array.from(tabActions.children) : [];
  let currentActionHost = tabActions?.parentElement || null;
  const actionSets = {
    commonPrompt: [
      { label: "디자인 가이드 생성", targetId: "commonPromptGenerateBtn", className: "btn primary" },
      { label: "분리기로 보내기", targetId: "commonPromptSendGeneratorBtn", className: "btn secondary" },
      { label: "디자인 가이드 복사", targetId: "commonPromptCopyBtn", className: "btn secondary" },
      { label: "초기화", targetId: "commonPromptResetBtn", className: "btn ghost", placement: "more" },
    ],
    generator: [
      { label: "프롬프트 생성", targetId: "genGenerateBtn", className: "btn primary" },
      { label: "현재 슬라이드 복사", targetId: "genCopyCurrentBtn", className: "btn secondary" },
      { label: "전체 슬라이드 복사", targetId: "genCopyBtn", className: "btn secondary" },
      { label: "프롬프트 다운로드", targetId: "genDownloadBtn", className: "btn ghost", placement: "more" },
      { label: "초기화", targetId: "genClearBtn", className: "btn ghost", placement: "more" },
    ],
    promotion: [
      { label: "레이아웃 바꾸기", targetId: "promotionShuffleLayoutBtn", className: "btn secondary" },
      { label: "기관용 비주얼 바꾸기", targetId: "btnMixerInstRandom", className: "btn secondary" },
      { label: "프롬프트 복사", targetId: "promotionCopyPromptBtn", className: "btn primary" },
    ],
    promotionPlanner: [
      // 컨셉 제안 탭: 카드별 복사 버튼으로 동작 — 헤더 액션 없음
    ],
    photoTransform: [],
    conceptMixer: [
      { label: "새 랜덤 조합", targetId: "btnMixerRandom", className: "btn primary" },
      { label: "현재 프롬프트 복사", targetId: "btnMixerCopy", className: "btn secondary" },
      { label: "홍보 이미지에 적용", targetId: "btnMixerApply", className: "btn secondary" },
      { label: "양식 이미지에 적용", targetId: "btnMixerFormImage", className: "btn secondary", placement: "more" },
      { label: "주제 고정 랜덤", targetId: "btnMixerRandomFixed", className: "btn ghost", placement: "more" },
      { label: "초기화", targetId: "btnMixerReset", className: "btn ghost", placement: "more" },
    ],
    formImage: [
      { label: "프롬프트 복사", targetId: "formImageCopyPromptBtn", className: "btn primary" },
      { label: "샘플 채우기", targetId: "formImageSampleBtn", className: "btn secondary" },
      { label: "기관용 랜덤 비주얼", targetId: "formImageRandomInstitutionBtnResult", className: "btn secondary", placement: "more" },
      { label: "초기화", targetId: "formImageResetBtn", className: "btn ghost", placement: "more" },
    ],
    documentDesign: [
      { label: "디자인 지침 생성", targetId: "documentDesignGenerateBtn", className: "btn primary" },
      { label: "전체 프롬프트 복사", targetId: "documentDesignCopyBtn", className: "btn secondary" },
      { label: "공통 프롬프트로 전달", targetId: "documentDesignSendCommonBtn", className: "btn secondary" },
      { label: "JSON 다운로드", targetId: "documentDesignDownloadBtn", className: "btn ghost", placement: "more" },
      { label: "샘플 채우기", targetId: "documentDesignSampleBtn", className: "btn ghost", placement: "more" },
      { label: "초기화", targetId: "documentDesignResetBtn", className: "btn ghost", placement: "more" },
    ],
    labelSheet: [
      { label: "프롬프트 생성", targetId: "labelSheetGeneratePromptBtn", className: "btn primary" },
      { label: "PDF 저장", targetId: "labelSheetExportPdfBtn", className: "btn primary" },
      { label: "PNG 내보내기", targetId: "labelSheetExportPngBtn", className: "btn secondary", placement: "more" },
      { label: "인쇄창", targetId: "labelSheetPrintBtn", className: "btn secondary", placement: "more" },
      { label: "샘플 채우기", targetId: "labelSheetSampleBtn", className: "btn secondary", placement: "more" },
      { label: "초기화", targetId: "labelSheetResetBtn", className: "btn ghost", placement: "more" },
    ],
    slideImage: [
      { label: "이미지 생성", targetId: "slideImageGenerateBtn", className: "btn primary" },
      { label: "분리 결과 가져오기", targetId: "slideImageLoadDeckBtn", className: "btn secondary" },
      { label: "전체 슬라이드 생성", targetId: "slideImageStartQueueBtn", className: "btn secondary" },
      { label: "연결 상태 확인", targetId: "slideImageHealthBtn", className: "btn ghost", placement: "more" },
      { label: "결과 폴더 열기", targetId: "slideImageOpenFolderBtn", className: "btn ghost", placement: "more" },
    ],
    mapPrompt: [
      { label: "프롬프트 생성", targetId: "mapGeneratePromptBtn", className: "btn primary" },
      { label: "프롬프트 복사", targetId: "mapCopyPromptBtn", className: "btn secondary" },
      { label: "샘플 채우기", targetId: "mapSampleBtn", className: "btn secondary" },
      { label: "초기화", targetId: "mapResetBtn", className: "btn ghost", placement: "more" },
    ],
    dataDiagram: [
      { label: "프롬프트 생성", targetId: "diagramGeneratePromptBtn", className: "btn primary" },
      { label: "프롬프트 복사", targetId: "diagramCopyPromptBtn", className: "btn secondary" },
      { label: "샘플 채우기", targetId: "diagramSampleBtn", className: "btn secondary" },
      { label: "구조 설계 복사", targetId: "diagramCopySpecBtn", className: "btn ghost", placement: "more" },
      { label: "초기화", targetId: "diagramResetBtn", className: "btn ghost", placement: "more" },
    ],
    slideDocument: [
      { label: "프롬프트 복사", targetId: "slideDocCopyPromptBtn", className: "btn primary" },
      { label: "샘플 채우기", targetId: "slideDocSampleBtn", className: "btn secondary" },
      { label: "초기화", targetId: "slideDocResetBtn", className: "btn ghost", placement: "more" },
    ],
    qrGenerator: [
      { label: "QR코드 생성", targetId: "qrGeneratorGenerateBtn", className: "btn primary" },
      { label: "PNG 다운로드", targetId: "qrGeneratorDownloadPngBtn", className: "btn secondary" },
      { label: "QR 라벨 출력", targetId: "qrGeneratorPrintBtn", className: "btn secondary" },
      { label: "샘플 채우기", targetId: "qrGeneratorSampleBtn", className: "btn secondary", placement: "more" },
      { label: "SVG 다운로드", targetId: "qrGeneratorDownloadSvgBtn", className: "btn secondary", placement: "more" },
      { label: "초기화", targetId: "qrGeneratorResetBtn", className: "btn ghost", placement: "more" },
    ],
  };

  const mobilePrimaryTargets = {
    documentDesign: "documentDesignCopyBtn",
    generator: "genGenerateBtn",
    promotion: "promotionCopyPromptBtn",
    conceptMixer: "btnMixerRandom",
    formImage: "formImageCopyPromptBtn",
    labelSheet: "labelSheetGeneratePromptBtn",
    slideImage: "slideImageGenerateBtn",
    mapPrompt: "mapGeneratePromptBtn",
    dataDiagram: "diagramGeneratePromptBtn",
    slideDocument: "slideDocCopyPromptBtn",
    qrGenerator: "qrGeneratorGenerateBtn",
  };

  function syncHeaderActionStates() {
    [tabActions, mobileTabActions].filter(Boolean).forEach((container) => container.querySelectorAll("[data-proxy-target]").forEach((button) => {
      const target = document.getElementById(button.dataset.proxyTarget);
      button.hidden = !target || target.hidden;
      button.disabled = !target || target.disabled;
    }));
  }

  function makeProxyAction(action) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = action.className;
    button.textContent = action.label;
    button.dataset.proxyTarget = action.targetId;
    button.addEventListener("click", () => {
      const target = document.getElementById(action.targetId);
      if (!target || target.disabled) {
        syncHeaderActionStates();
        return;
      }
      target.click();
      const menu = button.closest("details");
      if (menu) menu.open = false;
      window.setTimeout(syncHeaderActionStates, 0);
      window.setTimeout(syncHeaderActionStates, 250);
    });
    return button;
  }

  function buildActionDockContent(actionKey) {
    const direct = [];
    const more = [];
    if (actionKey === "designer") {
      designerActions.forEach((button) => {
        if (["btnClearSelections", "btnReset"].includes(button.id)) more.push(button);
        else direct.push(button);
      });
    } else {
      (actionSets[actionKey] || []).forEach((action) => {
        const button = makeProxyAction(action);
        if (action.placement === "more") more.push(button);
        else direct.push(button);
      });
    }

    if (!direct.length && !more.length) return [];
    const directGroup = document.createElement("div");
    directGroup.className = "tab-action-direct";
    directGroup.append(...direct);
    const content = [directGroup];

    if (more.length) {
      const details = document.createElement("details");
      details.className = "tab-action-more";
      const summary = document.createElement("summary");
      summary.className = "btn ghost";
      summary.textContent = "더보기";
      summary.setAttribute("aria-label", "추가 빠른 작업 열기");
      const menu = document.createElement("div");
      menu.className = "tab-action-more-menu";
      menu.append(...more);
      details.append(summary, menu);
      content.push(details);
    }
    return content;
  }

  function mountActionDock(tabKey, attempt = 0) {
    if (!tabActions || tabActions.hidden) return;
    const entry = tabs[tabKey];
    const host = entry?.pane?.querySelector(entry.actionHost || "");
    if (!host) {
      if (attempt < 5) window.setTimeout(() => mountActionDock(tabKey, attempt + 1), 50);
      return;
    }
    if (currentActionHost && currentActionHost !== host) {
      currentActionHost.classList.remove("tab-action-host", "tab-action-panel-sticky");
    }
    host.classList.add("tab-action-host");
    host.classList.toggle("tab-action-panel-sticky", entry.stickyActionPanel === true);
    host.prepend(tabActions);
    currentActionHost = host;
  }

  function renderHeaderActions(actionKey, tabKey = activeTabKey) {
    if (!tabActions) return;
    const content = buildActionDockContent(actionKey);
    tabActions.replaceChildren(...content);
    tabActions.hidden = content.length === 0;
    if (content.length) {
      mountActionDock(tabKey);
    } else if (currentActionHost) {
      currentActionHost.classList.remove("tab-action-host", "tab-action-panel-sticky");
      currentActionHost = null;
    }
    syncHeaderActionStates();
  }

  function renderMobileActions(actionKey) {
    if (!mobileTabActions) return;
    if (actionKey === "labelSheet") {
      mobileTabActions.replaceChildren();
      mobileTabActions.hidden = true;
      document.body.classList.remove("has-mobile-tab-actions");
      return;
    }
    if (actionKey === "qrGenerator") {
      const actions = actionSets.qrGenerator
        .filter((item) => ["qrGeneratorGenerateBtn", "qrGeneratorPrintBtn"].includes(item.targetId))
        .map((item) => makeProxyAction({
          ...item,
          className: item.targetId === "qrGeneratorPrintBtn" ? "btn primary" : "btn secondary",
        }));
      mobileTabActions.replaceChildren(...actions);
      mobileTabActions.hidden = actions.length === 0;
      document.body.classList.toggle("has-mobile-tab-actions", actions.length > 0);
      syncHeaderActionStates();
      return;
    }
    const labelSheetPane = document.getElementById("paneLabelSheet");
    const labelSheetGoal = labelSheetPane?.dataset.outputGoal || "print";
    const labelSheetWorkspaceAction = labelSheetGoal === "prompt"
      ? { label: "전체 프롬프트 생성", targetId: "labelSheetGeneratePromptBtn", className: "btn primary" }
      : { label: "검토·내보내기", targetId: "labelSheetWorkspaceReviewBtn", className: "btn primary" };
    const targetId = actionKey === "labelSheet" ? labelSheetWorkspaceAction.targetId : mobilePrimaryTargets[actionKey];
    const action = actionKey === "labelSheet"
      ? labelSheetWorkspaceAction
      : (actionSets[actionKey] || []).find((item) => item.targetId === targetId);
    if (!action) {
      mobileTabActions.replaceChildren();
      mobileTabActions.hidden = true;
      document.body.classList.remove("has-mobile-tab-actions");
      return;
    }
    const button = makeProxyAction({ ...action, className: "btn primary" });
    mobileTabActions.replaceChildren(button);
    mobileTabActions.hidden = false;
    document.body.classList.add("has-mobile-tab-actions");
    syncHeaderActionStates();
  }

  function readStoredTabKey() {
    try {
      const storedTabKey = window.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
      return tabs[storedTabKey] ? storedTabKey : null;
    } catch (error) {
      return null;
    }
  }

  function persistActiveTab(tabKey) {
    try {
      window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tabKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  const restoredTabKey = readStoredTabKey();
  let activeTabKey = restoredTabKey || DEFAULT_TAB_KEY;
  window.lastActiveTabId = tabs[activeTabKey]?.button?.id || "tabBtnCommonPrompt";

  window.PromptDeckTabs = {
    syncHeaderActionStates,
    syncMobileActions: () => renderMobileActions(tabs[activeTabKey]?.actions || "designer"),
    renderHeaderActions,
    getActiveTabKey: () => activeTabKey,
    switchTab: (tabKey) => switchTab(tabKey),
  };


  function getTabGroup(tabKey) {
    const entry = tabs[tabKey];
    return entry?.button?.closest("[data-tab-group]")?.dataset.tabGroup || entry?.group || "deck";
  }

  function getAvailableTabKeys(groupKey, includeLocked = false) {
    return Object.keys(tabs).filter((key) => {
      const button = tabs[key]?.button;
      if (!button || getTabGroup(key) !== groupKey) return false;
      if (!includeLocked && button.classList.contains("tab-locked")) return false;
      return window.getComputedStyle(button).display !== "none";
    });
  }

  function updateGroupNavigation(groupKey) {
    if (tabList) tabList.dataset.activeGroup = groupKey;
    groupFilters.forEach((button) => {
      const available = getAvailableTabKeys(button.dataset.tabGroupFilter, true).length > 0;
      button.hidden = !available;
      const isActive = button.dataset.tabGroupFilter === groupKey;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function setMobileToolNavigation(open, options = {}) {
    const nextOpen = Boolean(open) && window.matchMedia("(max-width: 720px)").matches;
    document.body.classList.toggle("app-tool-nav-open", nextOpen);
    appToolMenuButton?.setAttribute("aria-expanded", String(nextOpen));
    if (nextOpen) {
      window.requestAnimationFrame(() => {
        const activeGroup = groupFilters.find((button) => button.getAttribute("aria-pressed") === "true");
        (activeGroup || tabs[activeTabKey]?.button)?.focus({ preventScroll: true });
      });
    } else if (options.restoreFocus) {
      appToolMenuButton?.focus({ preventScroll: true });
    }
  }

  function syncMobileShellLabel(tabKey) {
    if (!mobileActiveTool) return;
    mobileActiveTool.textContent = tabs[tabKey]?.button?.textContent?.trim() || "작업 도구";
  }

  function revealActiveTab(tabKey, immediate = false) {
    const button = tabs[tabKey]?.button;
    if (!tabList || !button) return;
    window.requestAnimationFrame(() => {
      const groupButtons = button.closest(".app-tab-group-buttons");
      const scrollHost = groupButtons && groupButtons.scrollWidth > groupButtons.clientWidth
        ? groupButtons
        : tabList;
      const listRect = scrollHost.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      let delta = 0;
      if (buttonRect.left < listRect.left) delta = buttonRect.left - listRect.left - 12;
      else if (buttonRect.right > listRect.right) delta = buttonRect.right - listRect.right + 12;
      if (!delta) return;
      scrollHost.scrollTo({
        left: Math.max(0, scrollHost.scrollLeft + delta),
        behavior: immediate ? "auto" : "smooth",
      });
    });
  }

  function switchTab(nextTab, options = {}) {
    if (!tabs[nextTab]) return;
    const previousTabKey = activeTabKey;
    if (activeTabKey !== nextTab) {
      window.lastActiveTabId = tabs[activeTabKey]?.button?.id || "tabBtnCommonPrompt";
      activeTabKey = nextTab;
    }
    Object.entries(tabs).forEach(([key, entry]) => {
      if (!entry.button || !entry.pane) return;
      const isActive = key === nextTab;
      entry.button.classList.toggle("active", isActive);
      entry.button.setAttribute("aria-selected", isActive ? "true" : "false");
      entry.pane.classList.toggle("active", isActive);
    });

    updateGroupNavigation(getTabGroup(nextTab));
    revealActiveTab(nextTab, options.initial === true);
    if (options.persist !== false && (previousTabKey !== nextTab || options.forcePersist)) {
      persistActiveTab(nextTab);
    }
    renderHeaderActions(tabs[nextTab]?.actions || "designer", nextTab);
    renderMobileActions(tabs[nextTab]?.actions || "designer");
    syncMobileShellLabel(nextTab);
    setMobileToolNavigation(false);
  }

  Object.keys(tabs).forEach((key) => {
    if (!tabs[key].button) return;
    tabs[key].button.addEventListener("click", () => switchTab(key));
  });

  groupFilters.forEach((button) => {
    button.addEventListener("click", () => {
      const groupKey = button.dataset.tabGroupFilter;
      if (document.body.classList.contains("app-tool-nav-open")) {
        updateGroupNavigation(groupKey);
        return;
      }
      const availableTabs = getAvailableTabKeys(groupKey);
      const currentTabInGroup = getTabGroup(activeTabKey) === groupKey && availableTabs.includes(activeTabKey) ? activeTabKey : null;
      const configuredDefault = defaultTabsByGroup[groupKey];
      const nextTab = currentTabInGroup || (availableTabs.includes(configuredDefault) ? configuredDefault : availableTabs[0]);
      if (nextTab) switchTab(nextTab);
    });
  });

  appToolMenuButton?.addEventListener("click", () => {
    setMobileToolNavigation(!document.body.classList.contains("app-tool-nav-open"));
  });

  document.getElementById("legacyGoCommonBtn")?.addEventListener("click", () => switchTab(DEFAULT_TAB_KEY));

  tabList?.addEventListener("keydown", (event) => {
    if (!event.target.matches("[role='tab']")) return;
    const group = event.target.closest("[data-tab-group]");
    const buttons = Array.from(group?.querySelectorAll("[role='tab']") || []);
    const currentIndex = buttons.indexOf(event.target);
    if (currentIndex < 0) return;
    let nextIndex = null;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % buttons.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = buttons.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    buttons[nextIndex].focus();
    buttons[nextIndex].click();
  });

  document.addEventListener("click", (event) => {
    if (tabActions?.contains(event.target)) return;
    tabActions?.querySelectorAll("details[open]").forEach((details) => { details.open = false; });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    tabActions?.querySelectorAll("details[open]").forEach((details) => { details.open = false; });
    if (document.body.classList.contains("app-tool-nav-open")) {
      setMobileToolNavigation(false, { restoreFocus: true });
    }
  });

  window.addEventListener("promptdeck:label-sheet-goal-change", () => {
    if (activeTabKey !== "labelSheet") return;
    renderHeaderActions("labelSheet", "labelSheet");
    renderMobileActions("labelSheet");
  });

  let revealResizeFrame = 0;
  const revealActiveTabAfterResize = () => {
    window.cancelAnimationFrame(revealResizeFrame);
    revealResizeFrame = window.requestAnimationFrame(() => revealActiveTab(activeTabKey, true));
  };
  window.addEventListener("resize", () => {
    revealActiveTabAfterResize();
    if (!window.matchMedia("(max-width: 720px)").matches) setMobileToolNavigation(false);
  }, { passive: true });

  const slideDocumentPane = tabs.slideDocument.pane;
  if (slideDocumentPane) {
    slideDocumentPane.addEventListener("click", (event) => {
      if (!event.target.closest(".slide-sub-tab-btn")) return;
      window.setTimeout(() => {
        if (activeTabKey === "slideDocument") mountActionDock("slideDocument");
      }, 0);
    });
  }

  const initializeActiveTab = () => {
    const ready = window.PromptDeckAdminSettingsReady;
    Promise.resolve(ready).finally(() => {
      window.setTimeout(() => {
        // Resolve homepage deep links only after public visibility and access rules apply.
        const requested = new URLSearchParams(window.location.search).get("tab");
        const entry = Object.prototype.hasOwnProperty.call(tabs, requested) ? tabs[requested] : null;
        const available = entry?.pane && entry?.button
          && !entry.button.hidden
          && !entry.button.disabled
          && !entry.button.classList.contains("tab-locked")
          && window.getComputedStyle(entry.button).display !== "none";
        switchTab(available ? requested : activeTabKey, { initial: true, persist: false });
      }, 0);
    });
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeActiveTab, { once: true });
  } else {
    initializeActiveTab();
  }
})();
