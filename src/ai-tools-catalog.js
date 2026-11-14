(function () {
  "use strict";

  var search = document.getElementById("aiToolsSearch");
  var category = document.getElementById("aiToolsCategory");
  var cards = Array.from(document.querySelectorAll("[data-ai-tool]"));
  var filterButtons = Array.from(document.querySelectorAll("[data-type-filter]"));
  var allowedTypes = ["all", "skill", "plugin", "mcp"];
  var activeType = "all";
  var inputTimer;

  function normalized(value) {
    return String(value || "").normalize("NFKC").toLocaleLowerCase().trim();
  }

  function applyFilters(updateUrl, pushHistory) {
    if (!search || !category) return;
    var query = normalized(search.value);
    var terms = query.split(/\s+/u).filter(Boolean);
    var selectedCategory = category.value;
    var visible = 0;
    cards.forEach(function (card) {
      var haystack = normalized(card.dataset.search);
      var matches = (activeType === "all" || card.dataset.type === activeType)
        && (!selectedCategory || (card.dataset.category || "").split("|").includes(selectedCategory))
        && terms.every(function (term) { return haystack.includes(term); });
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    filterButtons.forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.typeFilter === activeType));
    });
    var count = document.getElementById("aiToolsCount");
    var empty = document.getElementById("aiToolsEmpty");
    if (count) count.textContent = visible + "개 도구" + (visible !== cards.length ? " / 전체 " + cards.length + "개" : "");
    if (empty) empty.hidden = visible > 0;
    if (updateUrl) {
      var url = new URL(window.location.href);
      if (activeType !== "all") url.searchParams.set("type", activeType);
      else url.searchParams.delete("type");
      if (search.value.trim()) url.searchParams.set("q", search.value.trim());
      else url.searchParams.delete("q");
      if (selectedCategory) url.searchParams.set("category", selectedCategory);
      else url.searchParams.delete("category");
      if (url.href !== window.location.href) {
        window.history[pushHistory ? "pushState" : "replaceState"]({}, "", url.href);
      }
    }
  }

  function readUrl() {
    if (!search || !category) return;
    var params = new URLSearchParams(window.location.search);
    var requestedType = params.get("type") || "all";
    activeType = allowedTypes.includes(requestedType) ? requestedType : "all";
    search.value = params.get("q") || "";
    var requestedCategory = params.get("category") || "";
    category.value = Array.from(category.options).some(function (option) { return option.value === requestedCategory; }) ? requestedCategory : "";
    applyFilters(false, false);
  }

  function clearFilters() {
    if (!search || !category) return;
    clearTimeout(inputTimer);
    search.value = "";
    category.value = "";
    activeType = "all";
    applyFilters(true, true);
    search.focus();
  }

  if (search && category) {
    search.addEventListener("input", function () {
      applyFilters(false, false);
      clearTimeout(inputTimer);
      inputTimer = setTimeout(function () { applyFilters(true, false); }, 180);
    });
    category.addEventListener("change", function () { clearTimeout(inputTimer); applyFilters(true, true); });
    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        clearTimeout(inputTimer);
        activeType = allowedTypes.includes(button.dataset.typeFilter) ? button.dataset.typeFilter : "all";
        applyFilters(true, true);
      });
    });
    if (search.form) {
      search.form.addEventListener("submit", function (event) { event.preventDefault(); clearTimeout(inputTimer); applyFilters(true, true); });
      search.form.addEventListener("reset", function (event) { event.preventDefault(); clearFilters(); });
    }
    document.querySelectorAll("[data-clear-filters]").forEach(function (button) { button.addEventListener("click", clearFilters); });
    window.addEventListener("popstate", function () { clearTimeout(inputTimer); readUrl(); });
    readUrl();
  }

  async function copyText(text) {
    if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
      try { await navigator.clipboard.writeText(text); return true; } catch (error) { /* Use selection fallback below. */ }
    }
    var previousFocus = document.activeElement;
    var field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.setAttribute("aria-label", "복사할 요청문");
    field.style.position = "fixed";
    field.style.top = "0";
    field.style.left = "-9999px";
    document.body.appendChild(field);
    field.select();
    field.setSelectionRange(0, text.length);
    var copied = false;
    try { copied = document.execCommand("copy"); } catch (error) { copied = false; }
    field.remove();
    if (previousFocus && previousFocus.focus) previousFocus.focus({ preventScroll: true });
    return copied;
  }

  document.querySelectorAll("[data-copy-target]").forEach(function (button) {
    button.addEventListener("click", async function () {
      var target = document.getElementById(button.dataset.copyTarget);
      var status = document.getElementById("aiToolsCopyStatus");
      if (!target) return;
      button.disabled = true;
      var copied = await copyText(target.textContent || "");
      button.disabled = false;
      if (copied) {
        if (status) status.textContent = "예시 요청을 복사했습니다. 사용하는 AI에 붙여 넣으세요.";
      } else {
        var range = document.createRange();
        range.selectNodeContents(target);
        var selection = window.getSelection();
        if (selection) { selection.removeAllRanges(); selection.addRange(range); }
        target.focus();
        if (status) status.textContent = "자동 복사를 사용할 수 없습니다. 선택된 문장을 직접 복사하세요.";
      }
    });
  });
})();
