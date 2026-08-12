// 슬라이드 스타일 카탈로그를 이미지·다이어그램 기능에서 공유하는 경량 계약
(function (global) {
  "use strict";

  const catalog = global.PromptDeckSlideStyleCatalog;
  if (!catalog) return;

  const VERSION = "1.1";
  const CURATED_IDS = [
    "minimal-report",
    "swiss-grid",
    "consulting-strategy",
    "data-storytelling",
  ];

  const safeColor = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value || "")) ? value : fallback;

  function isDiagramCompatible(style) {
    if (!style) return false;
    if (CURATED_IDS.includes(style.id)) return true;
    const composition = style.settings?.composition || {};
    const resources = style.settings?.resources || {};
    const media = new Set([
      ...(style.facets?.media || []),
      composition.primaryVisualLanguage,
      composition.secondaryVisualLanguage,
    ].filter(Boolean));
    return resources.diagramInfographic === "allow"
      || resources.dataVisualization === "allow"
      || media.has("diagram")
      || media.has("data")
      || media.has("table");
  }

  function normalizeStyle(styleOrId, scope = "visual") {
    const style = typeof styleOrId === "string" ? catalog.get(styleOrId) : styleOrId;
    if (!style) return null;
    const settings = style.settings || {};
    const colors = settings.colors || {};
    const composition = settings.composition || {};
    const visualDirection = settings.visualDirection || {};
    const normalizedScope = scope === "composition" ? "composition" : "visual";
    return {
      version: VERSION,
      catalogVersion: catalog.version,
      catalogRelease: catalog.release?.previewRevision || null,
      id: style.id,
      nameKo: style.nameKo,
      nameEn: style.nameEn,
      category: style.category,
      categoryLabel: catalog.categoryLabel(style.category),
      recommended: Boolean(style.recommended),
      introducedIn: Number(style.introducedIn) || 1,
      description: style.description || "",
      bestFor: style.bestFor || "",
      previewImage: style.previewImage || "",
      scope: normalizedScope,
      palette: {
        mode: colors.mode || "light",
        primary: safeColor(colors.primary, "#17324d"),
        secondary: safeColor(colors.secondary, "#4c78a8"),
        accent: safeColor(colors.accent, "#f28e2b"),
        background: safeColor(colors.background, "#ffffff"),
        surface: safeColor(colors.surface, "#f5f7fa"),
        textPrimary: safeColor(colors.textPrimary, "#172033"),
        textSecondary: safeColor(colors.textSecondary, "#667085"),
        border: safeColor(colors.border, "#d5dbe6"),
      },
      composition: {
        formLanguage: composition.formLanguage || "preciseGeometric",
        lineLanguage: composition.lineLanguage || "fineStructural",
        surfaceLanguage: composition.surfaceLanguage || "flat",
        spatialRhythm: composition.spatialRhythm || "ordered",
        hierarchyBehavior: composition.hierarchyBehavior || "scalePosition",
        container: composition.container || "mixed",
        density: composition.density || "balanced",
        whitespacePercent: Number(composition.whitespacePercent) || 22,
        signatureMotif: visualDirection.signatureMotif || "",
      },
      typography: {
        preset: settings.typographyPreset || "public",
        emphasis: settings.typography?.emphasis || "balanced",
        hierarchyStyle: settings.typography?.hierarchyStyle || "scaleWeight",
        rhythm: settings.typography?.rhythm || "compact",
      },
      prompt: {
        ko: style.prompt?.ko || "",
        en: style.prompt?.en || "",
      },
      rules: {
        required: [...(style.distinctiveRules || [])],
        avoid: [...(style.avoidRules || [])],
      },
    };
  }

  function listDiagramStyles(options = {}) {
    const mode = options.mode === "all" ? "all" : "compatible";
    const category = options.category || "all";
    const query = String(options.query || "").trim();
    const limitValue = Number(options.limit);
    const limit = Number.isFinite(limitValue) && limitValue > 0 ? Math.floor(limitValue) : Infinity;
    let matches = catalog.list({ category, query });
    if (mode === "compatible") matches = matches.filter(isDiagramCompatible);

    const ordered = mode === "compatible"
      ? [
        ...CURATED_IDS.map((id) => catalog.get(id)).filter((style) => style && matches.some((candidate) => candidate.id === style.id)),
        ...matches.filter((style) => style.recommended),
        ...matches,
      ].filter((style, index, items) => items.findIndex((candidate) => candidate.id === style.id) === index)
      : matches;
    return ordered.slice(0, limit).map((style) => normalizeStyle(style, options.scope));
  }

  const categories = Object.freeze(catalog.categories.map((category) => Object.freeze({ ...category })));
  const counts = Object.freeze({
    total: catalog.styles.length,
    recommended: catalog.styles.filter((style) => style.recommended).length,
    compatible: catalog.styles.filter(isDiagramCompatible).length,
  });

  function deriveRenderTokens(contract) {
    if (!contract) return null;
    const form = contract.composition.formLanguage;
    const line = contract.composition.lineLanguage;
    const surface = contract.composition.surfaceLanguage;
    const precise = /precise|geometric|sharp/i.test(form);
    const organic = /organic|soft|rounded/i.test(form);
    const flat = /flat/i.test(surface);
    const layered = /layer|panel|matte|glass/i.test(surface);
    return {
      radius: precise ? 7 : organic ? 22 : 14,
      strokeWidth: /fine|minimal/i.test(line) ? 1.5 : /bold|heavy/i.test(line) ? 3 : 2,
      shadowOpacity: flat ? 0.04 : layered ? 0.12 : 0.08,
      backgroundTintOpacity: flat ? 0.08 : 0.26,
      whitespacePercent: contract.composition.whitespacePercent,
      focusText: luminance(contract.palette.accent) > 0.48 ? contract.palette.textPrimary : "#ffffff",
    };
  }

  function luminance(hex) {
    const value = String(hex || "#000000").replace("#", "");
    const channels = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255)
      .map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  }

  function promptLines(contract) {
    if (!contract) return [];
    const lines = [
      `- Shared slide-gallery design DNA: ${contract.nameKo} (${contract.nameEn}).`,
      `- Apply its palette, typography hierarchy, ${contract.composition.lineLanguage} line language, and ${contract.composition.surfaceLanguage} surface language as one coordinated system.`,
      `- Style direction: ${contract.prompt.en || contract.prompt.ko}`,
    ];
    if (contract.scope === "composition") {
      lines.push(`- Also carry over its ${contract.composition.spatialRhythm} spatial rhythm, ${contract.composition.hierarchyBehavior} hierarchy behavior, and approximately ${contract.composition.whitespacePercent}% breathing room.`);
    }
    if (contract.rules.required.length) lines.push(`- Preserve these signature rules: ${contract.rules.required.join("; ")}.`);
    if (contract.rules.avoid.length) lines.push(`- Avoid: ${contract.rules.avoid.join("; ")}.`);
    lines.push("- The diagram topology, axis semantics, labels, and exact source data take precedence over decorative style rules.");
    return lines;
  }

  global.PromptDeckVisualStyleContract = Object.freeze({
    version: VERSION,
    categories,
    counts,
    get: normalizeStyle,
    listDiagramStyles,
    isDiagramCompatible,
    deriveRenderTokens,
    promptLines,
  });
})(window);
