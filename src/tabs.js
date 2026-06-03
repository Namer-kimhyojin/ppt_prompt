// 디자이너/생성기/홍보이미지 탭 전환
(function () {
  const tabs = {
    designer: {
      button: document.getElementById("tabBtnDesigner"),
      pane: document.getElementById("paneDesigner"),
      actions: "designer",
    },
    generator: {
      button: document.getElementById("tabBtnGenerator"),
      pane: document.getElementById("paneGenerator"),
      actions: "generator",
    },
    promotion: {
      button: document.getElementById("tabBtnPromotion"),
      pane: document.getElementById("panePromotion"),
      actions: "promotion",
    },
    slideImage: {
      button: document.getElementById("tabBtnSlideImage"),
      pane: document.getElementById("paneSlideImage"),
      actions: "slideImage",
    },
    slideDocument: {
      button: document.getElementById("tabBtnSlideDocument"),
      pane: document.getElementById("paneSlideDocument"),
      actions: "slideDocument",
    },
  };

  const tabActions = document.getElementById("tabActions");
  const designerActions = tabActions ? Array.from(tabActions.children) : [];
  const tabLabels = {
    designer: "설계",
    generator: "분리",
    promotion: "홍보",
    slideImage: "이미지",
    slideDocument: "부속",
  };
  const actionSets = {
    designer: [
      { label: "한글 복사", targetId: "btnCopy", className: "btn secondary", mobilePrimary: true },
      { label: "영문 복사", targetId: "btnCopyEn", className: "btn primary" },
      { label: "선택 해제", targetId: "btnClearSelections", className: "btn ghost" },
      { label: "초기화", targetId: "btnReset", className: "btn ghost" },
    ],
    generator: [
      { label: "프롬프트 생성", targetId: "genGenerateBtn", className: "btn primary" },
      { label: "현재 복사", targetId: "genCopyCurrentBtn", className: "btn secondary" },
      { label: "전체 복사", targetId: "genCopyBtn", className: "btn secondary" },
      { label: "다운로드", targetId: "genDownloadBtn", className: "btn ghost" },
      { label: "초기화", targetId: "genClearBtn", className: "btn ghost" },
    ],
    promotion: [
      { label: "최적화 실행", targetId: "promotionOptimizePromptBtn", className: "btn primary" },
      { label: "프롬프트 복사", targetId: "promotionCopyPromptBtn", className: "btn secondary" },
      { label: "샘플 채우기", targetId: "promotionSampleBtn", className: "btn secondary" },
      { label: "텍스트 리셋", targetId: "promotionResetTextBtn", className: "btn ghost" },
      { label: "전체 초기화", targetId: "promotionResetBtn", className: "btn ghost" },
    ],
    slideImage: [
      { label: "상태 확인", targetId: "slideImageHealthBtn", className: "btn ghost" },
      { label: "목록 가져오기", targetId: "slideImageLoadDeckBtn", className: "btn secondary" },
      { label: "이미지 생성", targetId: "slideImageGenerateBtn", className: "btn primary" },
      { label: "전체 순차 생성", targetId: "slideImageStartQueueBtn", className: "btn secondary" },
      { label: "outputs 열기", targetId: "slideImageOpenFolderBtn", className: "btn ghost" },
    ],
    slideDocument: [
      { label: "프롬프트 복사", targetId: "slideDocCopyPromptBtn", className: "btn primary" },
      { label: "샘플 채우기", targetId: "slideDocSampleBtn", className: "btn secondary" },
      { label: "초기화", targetId: "slideDocResetBtn", className: "btn ghost" },
    ],
  };
  let currentTab = "designer";
  let mobileUi;

  function syncHeaderActionStates() {
    if (!tabActions) return;
    tabActions.querySelectorAll("[data-proxy-target]").forEach((button) => {
      const target = document.getElementById(button.dataset.proxyTarget);
      button.disabled = !target || target.disabled;
    });
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
      window.setTimeout(syncHeaderActionStates, 0);
      window.setTimeout(syncHeaderActionStates, 250);
    });
    return button;
  }

  function clickProxyTarget(action) {
    const target = document.getElementById(action?.targetId);
    if (!target || target.disabled) {
      syncHeaderActionStates();
      return false;
    }
    target.click();
    window.setTimeout(syncHeaderActionStates, 0);
    window.setTimeout(syncMobileActions, 0);
    window.setTimeout(syncHeaderActionStates, 250);
    window.setTimeout(syncMobileActions, 250);
    return true;
  }

  function renderHeaderActions(actionKey) {
    if (!tabActions) return;
    if (actionKey === "designer") {
      tabActions.replaceChildren(...designerActions);
    } else {
      tabActions.replaceChildren(...(actionSets[actionKey] || []).map(makeProxyAction));
    }
    tabActions.style.display = "";
    syncHeaderActionStates();
  }

  function getCurrentPromptText() {
    if (currentTab === "designer") {
      if (typeof window.pptBuildPromptText === "function") {
        return window.pptBuildPromptText("ko") || "";
      }
      return document.getElementById("promptSections")?.innerText?.trim() || "";
    }

    if (currentTab === "generator") {
      const editor = document.getElementById("genPromptEditor");
      if (editor && editor.offsetParent !== null && editor.value.trim()) return editor.value.trim();
      return document.getElementById("genOutput")?.textContent?.trim() || "";
    }

    if (currentTab === "promotion") {
      return document.getElementById("promotionPromptPreview")?.value?.trim() || "";
    }

    if (currentTab === "slideImage") {
      return document.getElementById("slideImagePrompt")?.value?.trim() || "";
    }

    if (currentTab === "slideDocument") {
      const activePane = document.querySelector("#paneSlideDocument .slide-sub-pane.active");
      return activePane?.querySelector("textarea[id$='PromptPreview']")?.value?.trim() || "";
    }

    return "";
  }

  function getPrimaryMobileAction(actionKey) {
    const actions = actionSets[actionKey] || [];
    return actions.find((action) => action.mobilePrimary) || actions.find((action) => /복사|생성|최적화/.test(action.label)) || actions[0];
  }

  function getSecondaryMobileAction(actionKey) {
    const actions = actionSets[actionKey] || [];
    const primary = getPrimaryMobileAction(actionKey);
    return actions.find((action) => action !== primary && /초기화|리셋|샘플|목록/.test(action.label)) || actions.find((action) => action !== primary);
  }

  function renderMobileActionMenu(actionKey) {
    if (!mobileUi?.menu) return;
    const actions = actionSets[actionKey] || [];
    mobileUi.menu.replaceChildren(...actions.map((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mobile-action-menu-btn";
      button.textContent = action.label;
      button.dataset.proxyTarget = action.targetId;
      button.addEventListener("click", () => {
        mobileUi.menu.hidden = true;
        clickProxyTarget(action);
      });
      return button;
    }));
  }

  function syncMobileActions() {
    if (!mobileUi) return;
    const actionKey = tabs[currentTab]?.actions || "designer";
    const primary = getPrimaryMobileAction(actionKey);
    const secondary = getSecondaryMobileAction(actionKey);
    const promptText = getCurrentPromptText();

    mobileUi.title.textContent = tabLabels[currentTab] || "작업";
    mobileUi.viewPrompt.disabled = !promptText;
    mobileUi.primary.textContent = primary?.label || "실행";
    mobileUi.primary.disabled = !primary || !document.getElementById(primary.targetId) || document.getElementById(primary.targetId).disabled;
    mobileUi.primary.dataset.proxyTarget = primary?.targetId || "";

    mobileUi.secondary.textContent = secondary?.label || "더보기";
    mobileUi.secondary.disabled = !secondary || !document.getElementById(secondary.targetId) || document.getElementById(secondary.targetId).disabled;
    mobileUi.secondary.dataset.proxyTarget = secondary?.targetId || "";

    renderMobileActionMenu(actionKey);
  }

  function showMobilePromptSheet() {
    if (!mobileUi) return;
    const text = getCurrentPromptText();
    if (!text) {
      mobileUi.sheetText.value = "현재 탭에서 확인할 프롬프트가 아직 없습니다.";
    } else {
      mobileUi.sheetText.value = text;
    }
    mobileUi.sheet.hidden = false;
    document.body.classList.add("mobile-sheet-open");
    mobileUi.sheetText.focus({ preventScroll: true });
  }

  function hideMobilePromptSheet() {
    if (!mobileUi) return;
    mobileUi.sheet.hidden = true;
    document.body.classList.remove("mobile-sheet-open");
  }

  async function copyMobileSheetText() {
    const text = mobileUi?.sheetText?.value?.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      mobileUi.sheetCopy.textContent = "복사됨";
      window.setTimeout(() => {
        if (mobileUi?.sheetCopy) mobileUi.sheetCopy.textContent = "전체 복사";
      }, 1200);
    } catch (err) {
      mobileUi.sheetCopy.textContent = "복사 실패";
      window.setTimeout(() => {
        if (mobileUi?.sheetCopy) mobileUi.sheetCopy.textContent = "전체 복사";
      }, 1200);
    }
  }

  function initMobileUi() {
    const bar = document.createElement("div");
    bar.className = "mobile-action-bar";
    bar.innerHTML = `
      <div class="mobile-action-meta">
        <span class="mobile-action-kicker">현재 작업</span>
        <strong class="mobile-action-title"></strong>
      </div>
      <button type="button" class="mobile-action-btn ghost" data-mobile-action="view-prompt">프롬프트</button>
      <button type="button" class="mobile-action-btn secondary" data-mobile-action="secondary"></button>
      <button type="button" class="mobile-action-btn primary" data-mobile-action="primary"></button>
      <button type="button" class="mobile-action-more" data-mobile-action="more" aria-label="작업 더보기">⋯</button>
      <div class="mobile-action-menu" hidden></div>
    `;

    const sheet = document.createElement("div");
    sheet.className = "mobile-prompt-sheet";
    sheet.hidden = true;
    sheet.innerHTML = `
      <div class="mobile-prompt-backdrop" data-mobile-sheet-close></div>
      <section class="mobile-prompt-panel" role="dialog" aria-modal="true" aria-label="프롬프트 전체 보기">
        <div class="mobile-prompt-head">
          <div>
            <span class="mobile-action-kicker">PromptDeck</span>
            <strong>프롬프트 전체 보기</strong>
          </div>
          <button type="button" class="mobile-prompt-close" data-mobile-sheet-close aria-label="닫기">×</button>
        </div>
        <textarea class="mobile-prompt-text" readonly></textarea>
        <div class="mobile-prompt-actions">
          <button type="button" class="mobile-action-btn secondary" data-mobile-sheet-copy>전체 복사</button>
          <button type="button" class="mobile-action-btn primary" data-mobile-sheet-close>닫기</button>
        </div>
      </section>
    `;

    document.body.append(bar, sheet);
    mobileUi = {
      bar,
      title: bar.querySelector(".mobile-action-title"),
      viewPrompt: bar.querySelector("[data-mobile-action='view-prompt']"),
      primary: bar.querySelector("[data-mobile-action='primary']"),
      secondary: bar.querySelector("[data-mobile-action='secondary']"),
      more: bar.querySelector("[data-mobile-action='more']"),
      menu: bar.querySelector(".mobile-action-menu"),
      sheet,
      sheetText: sheet.querySelector(".mobile-prompt-text"),
      sheetCopy: sheet.querySelector("[data-mobile-sheet-copy]"),
    };

    mobileUi.viewPrompt.addEventListener("click", showMobilePromptSheet);
    mobileUi.primary.addEventListener("click", () => clickProxyTarget({ targetId: mobileUi.primary.dataset.proxyTarget }));
    mobileUi.secondary.addEventListener("click", () => clickProxyTarget({ targetId: mobileUi.secondary.dataset.proxyTarget }));
    mobileUi.more.addEventListener("click", () => {
      mobileUi.menu.hidden = !mobileUi.menu.hidden;
    });
    mobileUi.sheet.addEventListener("click", (event) => {
      if (event.target.closest("[data-mobile-sheet-close]")) hideMobilePromptSheet();
    });
    mobileUi.sheetCopy.addEventListener("click", copyMobileSheetText);

    document.addEventListener("input", syncMobileActions, true);
    document.addEventListener("change", syncMobileActions, true);
    document.addEventListener("click", (event) => {
      if (!mobileUi.menu.hidden && !event.target.closest(".mobile-action-bar")) {
        mobileUi.menu.hidden = true;
      }
      window.setTimeout(syncMobileActions, 0);
    }, true);
  }

  function switchTab(nextTab) {
    currentTab = nextTab;
    Object.entries(tabs).forEach(([key, entry]) => {
      if (!entry.button || !entry.pane) return;
      const isActive = key === nextTab;
      entry.button.classList.toggle("active", isActive);
      entry.button.setAttribute("aria-selected", isActive ? "true" : "false");
      entry.pane.classList.toggle("active", isActive);
    });

    renderHeaderActions(tabs[nextTab]?.actions || "designer");
    syncMobileActions();
  }

  window.PromptDeckTabs = {
    switchTab,
    syncHeaderActionStates,
  };

  Object.keys(tabs).forEach((key) => {
    if (!tabs[key].button) return;
    tabs[key].button.dataset.mobileLabel = tabLabels[key] || tabs[key].button.textContent.trim();
    tabs[key].button.addEventListener("click", () => switchTab(key));
  });

  initMobileUi();
  renderHeaderActions("designer");
  syncMobileActions();
})();
