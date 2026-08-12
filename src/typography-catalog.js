(function () {
  "use strict";

  const presetSource = window.CONCEPT_MIXER_PRESETS || {};
  const items = Array.isArray(presetSource.MIXER_TYPOGRAPHIES) ? presetSource.MIXER_TYPOGRAPHIES : [];
  const categories = Array.isArray(presetSource.TYPOGRAPHY_CATEGORIES) ? presetSource.TYPOGRAPHY_CATEGORIES : [];
  const PRESENTATION_SAFE_IDS = new Set([
    "typo-geometric-sans", "typo-humanist-sans", "typo-neo-grotesque", "typo-rounded-soft",
    "typo-modern-serif", "typo-old-style", "typo-slab-serif", "typo-transitional",
    "typo-mono-technical", "typo-swiss-international",
  ]);
  const HIGH_RISK_CATEGORIES = new Set(["script", "experimental"]);

  function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
  function nameEn(id) {
    return String(id || "")
      .replace(/^typo-/, "")
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
  function categoryLabel(category) {
    return categories.find((item) => item.id === category)?.label?.replace(/^\S+\s*/, "") || category || "기타";
  }
  function normalize(item) {
    if (!item || item.id === "none") return null;
    return {
      id: item.id,
      source: "visual-mixer",
      version: 1,
      category: item.category || "all",
      categoryLabel: categoryLabel(item.category),
      nameKo: item.nameKo || item.id,
      nameEn: nameEn(item.id),
      description: item.desc || "",
      promptSummary: item.prompt || "",
      recommended: PRESENTATION_SAFE_IDS.has(item.id),
      highRisk: HIGH_RISK_CATEGORIES.has(item.category) || /ultra|glitch|3d|neon|fragment|fire|psychedelic|graffiti|distressed|chrome|ice/i.test(item.id),
    };
  }
  function get(id) { return normalize(items.find((item) => item.id === id)); }
  function list(filters = {}) {
    const query = String(filters.query || "").trim().toLowerCase();
    return items.map(normalize).filter(Boolean).filter((item) => {
      if (filters.recommended && !item.recommended) return false;
      if (filters.category && filters.category !== "all" && item.category !== filters.category) return false;
      if (query && !`${item.nameKo} ${item.nameEn} ${item.description}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }
  function toSlideTypography(item, scope = "headline") {
    const normalized = normalize(item?.id ? item : get(item));
    if (!normalized) return null;
    return Object.assign(clone(normalized), { scope: scope || "headline" });
  }

  window.PromptDeckTypographyCatalog = { categories: clone(categories), get, list, normalize, toSlideTypography };
})();
