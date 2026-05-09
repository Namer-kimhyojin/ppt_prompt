// 디자이너/생성기/홍보이미지 탭 전환
(function () {
  const tabs = {
    designer: {
      button: document.getElementById("tabBtnDesigner"),
      pane: document.getElementById("paneDesigner"),
      showActions: true,
    },
    generator: {
      button: document.getElementById("tabBtnGenerator"),
      pane: document.getElementById("paneGenerator"),
      showActions: false,
    },
    promotion: {
      button: document.getElementById("tabBtnPromotion"),
      pane: document.getElementById("panePromotion"),
      showActions: false,
    },
    slideImage: {
      button: document.getElementById("tabBtnSlideImage"),
      pane: document.getElementById("paneSlideImage"),
      showActions: false,
    },
  };

  const tabActions = document.getElementById("tabActions");

  function switchTab(nextTab) {
    Object.entries(tabs).forEach(([key, entry]) => {
      if (!entry.button || !entry.pane) return;
      const isActive = key === nextTab;
      entry.button.classList.toggle("active", isActive);
      entry.button.setAttribute("aria-selected", isActive ? "true" : "false");
      entry.pane.classList.toggle("active", isActive);
    });

    if (tabActions) tabActions.style.display = tabs[nextTab]?.showActions ? "" : "none";
  }

  Object.keys(tabs).forEach((key) => {
    if (!tabs[key].button) return;
    tabs[key].button.addEventListener("click", () => switchTab(key));
  });
})();
