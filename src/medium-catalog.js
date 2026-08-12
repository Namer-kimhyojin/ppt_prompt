(function () {
  "use strict";

  const presets = window.CONCEPT_MIXER_PRESETS || {};
  const mediums = Array.isArray(presets.MIXER_MEDIUMS) ? presets.MIXER_MEDIUMS : [];
  const categories = Array.isArray(presets.MEDIUM_CATEGORIES) ? presets.MEDIUM_CATEGORIES : [];
  const recommendedIds = presets.PUBINST_MEDIUM_IDS instanceof Set ? presets.PUBINST_MEDIUM_IDS : new Set();

  const NAME_EN = {
    "med-3d": "3D Technical Render",
    "med-iso": "Isometric 3D",
    "med-official-photo": "Official Public-Sector Photography",
    "med-public-modern-line": "Modern Line Illustration",
    "med-public-soft-color": "Soft Color Illustration",
    "med-public-icon-system": "Public Icon System",
    "med-minimal-grid-system": "Minimal Grid System",
    "med-clean-studio-photo": "Clean Studio Photography",
    "med-soft-3d-matte": "Soft Matte 3D Render",
    "med-tech-node-lineart": "Tech Node Line Art",
  };

  const GROUP_LABELS = {
    render3d: "3D 렌더",
    photo3d: "사진·3D 합성",
    graphic: "그래픽·일러스트",
    experimental: "실험적 표현",
    photo: "사진·실사",
    craft: "공예·재질",
    uiinfo: "UI·정보 시각화",
  };
  const TEXTURE_LABELS = {
    clean: "깔끔함",
    real: "사실적",
    textured: "질감 강조",
    glossy: "광택·입체감",
    vivid: "선명함",
    tactile: "촉감·재질감",
  };
  const USAGE_LABELS = {
    proposal: "제안·발표",
    campaign: "캠페인",
    corporate: "기업·기관",
    brand: "브랜드",
    explainer: "설명자료",
  };

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function cleanCategoryLabel(value) {
    return String(value || "").replace(/^\S+\s+/, "").trim();
  }

  function getNameEn(medium) {
    if (!medium) return "";
    if (NAME_EN[medium.id]) return NAME_EN[medium.id];
    const idLabel = String(medium.id || "").replace(/^med-/, "").replace(/[-_]+/g, " ").trim();
    return idLabel.replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Visual Technique";
  }

  function promptTokens(medium) {
    const raw = String(medium?.suffix || medium?.desc || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item) => !/octane render|unreal engine|8k|4k/i.test(item));
    return [...new Set(raw)].slice(0, 3);
  }

  function normalize(medium, source) {
    if (!medium) return null;
    const category = categories.find((item) => item.id === medium.category);
    const tokens = promptTokens(medium);
    return {
      id: medium.id,
      source: source || "visual-mixer",
      version: 1,
      nameKo: medium.nameKo || medium.name || medium.id,
      nameEn: getNameEn(medium),
      description: medium.desc || "",
      category: medium.category || "",
      categoryLabel: cleanCategoryLabel(category?.label || medium.category),
      group: medium.group || "",
      groupLabel: GROUP_LABELS[medium.group] || medium.group || "표현 기법",
      texture: medium.texture || "",
      textureLabel: TEXTURE_LABELS[medium.texture] || medium.texture || "",
      usage: medium.usage || "",
      usageLabel: USAGE_LABELS[medium.usage] || medium.usage || "",
      promptTokens: tokens,
      promptSummaryKo: [medium.desc, ...tokens].filter(Boolean).slice(0, 3).join(", "),
      promptSummaryEn: tokens.join(", "),
      recommended: recommendedIds.has(medium.id),
    };
  }

  function list(filters = {}) {
    const query = String(filters.query || "").trim().toLowerCase();
    return mediums
      .filter((medium) => !filters.recommended || recommendedIds.has(medium.id))
      .filter((medium) => !filters.category || filters.category === "all" || medium.category === filters.category)
      .filter((medium) => !filters.group || filters.group === "all" || medium.group === filters.group)
      .filter((medium) => !filters.texture || filters.texture === "all" || medium.texture === filters.texture)
      .filter((medium) => !filters.usage || filters.usage === "all" || medium.usage === filters.usage)
      .filter((medium) => {
        if (!query) return true;
        return [medium.nameKo, medium.desc, medium.prefix, medium.suffix, medium.category, medium.group, medium.texture, medium.usage]
          .some((value) => String(value || "").toLowerCase().includes(query));
      })
      .map((medium) => normalize(medium));
  }

  function get(id) {
    return normalize(mediums.find((medium) => medium.id === id));
  }

  window.PromptDeckMediumCatalog = {
    categories: categories.map((item) => ({ id: item.id, label: cleanCategoryLabel(item.label) })),
    groupLabels: clone(GROUP_LABELS),
    textureLabels: clone(TEXTURE_LABELS),
    usageLabels: clone(USAGE_LABELS),
    list,
    get,
    normalize,
  };
})();
