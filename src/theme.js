(function () {
  const STORAGE_KEY = "promptdeck_theme";
  const root = document.documentElement;

  function getThemeStorage() {
    try {
      const storage = window.localStorage;
      return storage && typeof storage.getItem === "function" && typeof storage.setItem === "function"
        ? storage
        : null;
    } catch (error) {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      getThemeStorage()?.setItem(STORAGE_KEY, theme);
    } catch (error) {
      // 저장소가 차단된 환경에서도 현재 페이지의 테마 전환은 유지한다.
    }
  }

  function getCurrentTheme() {
    return root.dataset.theme === "dark" ? "dark" : "light";
  }

  function applyTheme(theme) {
    const nextTheme = theme === "dark" ? "dark" : "light";
    root.dataset.theme = nextTheme;
    saveTheme(nextTheme);

    const button = document.getElementById("themeToggleBtn");
    if (!button) return;
    const isDark = nextTheme === "dark";
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute("aria-label", isDark ? "라이트 모드로 전환" : "다크 모드로 전환");
    const icon = button.querySelector(".theme-toggle-icon");
    const text = button.querySelector(".theme-toggle-text");
    if (icon) icon.textContent = isDark ? "☀" : "☾";
    if (text) text.textContent = isDark ? "라이트" : "다크";
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(getCurrentTheme());
    document.getElementById("themeToggleBtn")?.addEventListener("click", () => {
      applyTheme(getCurrentTheme() === "dark" ? "light" : "dark");
    });
  });
})();
