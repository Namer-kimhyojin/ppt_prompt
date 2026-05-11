(function () {
  const STORAGE_KEY = "promptdeck_theme";
  const root = document.documentElement;

  function getCurrentTheme() {
    return root.dataset.theme === "dark" ? "dark" : "light";
  }

  function applyTheme(theme) {
    const nextTheme = theme === "dark" ? "dark" : "light";
    root.dataset.theme = nextTheme;
    localStorage.setItem(STORAGE_KEY, nextTheme);

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
