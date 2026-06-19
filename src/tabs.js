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
    mapPrompt: {
      button: document.getElementById("tabBtnMapPrompt"),
      pane: document.getElementById("paneMapPrompt"),
      actions: "mapPrompt",
    },
    slideDocument: {
      button: document.getElementById("tabBtnSlideDocument"),
      pane: document.getElementById("paneSlideDocument"),
      actions: "slideDocument",
    },
    promotionPlanner: {
      button: document.getElementById("tabBtnPromotionPlanner"),
      pane: document.getElementById("panePromotionPlanner"),
      actions: "promotionPlanner",
    },
    conceptMixer: {
      button: document.getElementById("tabBtnConceptMixer"),
      pane: document.getElementById("paneConceptMixer"),
      actions: "conceptMixer",
    },
  };

  const tabActions = document.getElementById("tabActions");
  const designerActions = tabActions ? Array.from(tabActions.children) : [];
  const actionSets = {
    generator: [
      { label: "프롬프트 생성", targetId: "genGenerateBtn", className: "btn primary" },
      { label: "현재 복사", targetId: "genCopyCurrentBtn", className: "btn secondary" },
      { label: "전체 복사", targetId: "genCopyBtn", className: "btn secondary" },
      { label: "다운로드", targetId: "genDownloadBtn", className: "btn ghost" },
      { label: "초기화", targetId: "genClearBtn", className: "btn ghost" },
    ],
    promotion: [
      { label: "레이아웃 변경", targetId: "promotionShuffleLayoutBtn", className: "btn secondary" },
      { label: "복사", targetId: "promotionCopyPromptBtn", className: "btn primary" },
    ],
    promotionPlanner: [
      // 컨셉 제안 탭: 카드별 복사 버튼으로 동작 — 헤더 액션 없음
    ],
    conceptMixer: [
      { label: "랜덤 조합", targetId: "btnMixerRandom", className: "btn primary" },
      { label: "초기화", targetId: "btnMixerReset", className: "btn secondary" },
      { label: "unsplash API", targetId: "btnMixerSettings", className: "btn ghost" },
    ],
    slideImage: [
      { label: "상태 확인", targetId: "slideImageHealthBtn", className: "btn ghost" },
      { label: "목록 가져오기", targetId: "slideImageLoadDeckBtn", className: "btn secondary" },
      { label: "이미지 생성", targetId: "slideImageGenerateBtn", className: "btn primary" },
      { label: "전체 순차 생성", targetId: "slideImageStartQueueBtn", className: "btn secondary" },
      { label: "outputs 열기", targetId: "slideImageOpenFolderBtn", className: "btn ghost" },
    ],
    mapPrompt: [
      { label: "프롬프트 생성", targetId: "mapGeneratePromptBtn", className: "btn primary" },
      { label: "프롬프트 복사", targetId: "mapCopyPromptBtn", className: "btn secondary" },
      { label: "샘플 채우기", targetId: "mapSampleBtn", className: "btn secondary" },
      { label: "초기화", targetId: "mapResetBtn", className: "btn ghost" },
    ],
    slideDocument: [
      { label: "프롬프트 복사", targetId: "slideDocCopyPromptBtn", className: "btn primary" },
      { label: "샘플 채우기", targetId: "slideDocSampleBtn", className: "btn secondary" },
      { label: "초기화", targetId: "slideDocResetBtn", className: "btn ghost" },
    ],
  };

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

  function switchTab(nextTab) {
    Object.entries(tabs).forEach(([key, entry]) => {
      if (!entry.button || !entry.pane) return;
      const isActive = key === nextTab;
      entry.button.classList.toggle("active", isActive);
      entry.button.setAttribute("aria-selected", isActive ? "true" : "false");
      entry.pane.classList.toggle("active", isActive);
    });

    renderHeaderActions(tabs[nextTab]?.actions || "designer");
  }

  Object.keys(tabs).forEach((key) => {
    if (!tabs[key].button) return;
    tabs[key].button.addEventListener("click", () => switchTab(key));
  });

  renderHeaderActions("designer");
})();
