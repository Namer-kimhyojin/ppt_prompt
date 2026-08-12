(function () {
  "use strict";

  const store = window.CONCEPT_MIXER_PRESETS || {};
  const palettes = Array.isArray(store.MIXER_PALETTES) ? store.MIXER_PALETTES : [];
  const declaredCategories = Array.isArray(store.PALETTE_CATEGORIES) ? store.PALETTE_CATEGORIES : [];
  const ROLE_KEYS = ["primary", "secondary", "accent", "background", "surface", "textPrimary", "textSecondary", "border"];

  function normalizeHex(value) {
    let hex = String(value || "").trim().toUpperCase();
    if (/^#[0-9A-F]{3}$/.test(hex)) hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    return /^#[0-9A-F]{6}$/.test(hex) ? hex : "";
  }

  function hexToRgb(value) {
    const hex = normalizeHex(value);
    if (!hex) return null;
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    };
  }

  function rgbToHex(r, g, b) {
    const part = (value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0").toUpperCase();
    return `#${part(r)}${part(g)}${part(b)}`;
  }

  function mix(a, b, weight) {
    const x = hexToRgb(a); const y = hexToRgb(b);
    if (!x || !y) return normalizeHex(a) || normalizeHex(b) || "#808080";
    const w = Math.max(0, Math.min(1, Number(weight) || 0));
    return rgbToHex(x.r + (y.r - x.r) * w, x.g + (y.g - x.g) * w, x.b + (y.b - x.b) * w);
  }

  function colorMetrics(value) {
    const rgb = hexToRgb(value);
    if (!rgb) return { hue: 0, saturation: 0, lightness: 0, luminance: 0 };
    const rn = rgb.r / 255; const gn = rgb.g / 255; const bn = rgb.b / 255;
    const max = Math.max(rn, gn, bn); const min = Math.min(rn, gn, bn); const delta = max - min;
    const lightness = (max + min) / 2;
    const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
    let hue = 0;
    if (delta) {
      if (max === rn) hue = 60 * (((gn - bn) / delta + 6) % 6);
      else if (max === gn) hue = 60 * ((bn - rn) / delta + 2);
      else hue = 60 * ((rn - gn) / delta + 4);
    }
    const linear = [rn, gn, bn].map((item) => item <= .03928 ? item / 12.92 : Math.pow((item + .055) / 1.055, 2.4));
    return { hue, saturation, lightness, luminance: linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722 };
  }

  function contrast(a, b) {
    const x = colorMetrics(a).luminance; const y = colorMetrics(b).luminance;
    return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
  }

  function hueNames(hue, saturation) {
    if (saturation < .08) return ["그레이", "gray"];
    if (hue < 15 || hue >= 345) return ["레드", "red"];
    if (hue < 35) return ["코랄 오렌지", "coral orange"];
    if (hue < 55) return ["앰버", "amber"];
    if (hue < 75) return ["옐로", "yellow"];
    if (hue < 105) return ["라임 그린", "lime green"];
    if (hue < 145) return ["그린", "green"];
    if (hue < 175) return ["민트 그린", "mint green"];
    if (hue < 195) return ["틸", "teal"];
    if (hue < 215) return ["시안 블루", "cyan blue"];
    if (hue < 245) return ["블루", "blue"];
    if (hue < 270) return ["인디고", "indigo"];
    if (hue < 295) return ["바이올렛", "violet"];
    if (hue < 325) return ["마젠타", "magenta"];
    return ["로즈", "rose"];
  }

  function describeColor(value) {
    const hex = normalizeHex(value) || "#808080";
    const metrics = colorMetrics(hex);
    if (metrics.lightness >= .97 && metrics.saturation < .08) return { hex, nameKo: "클린 화이트", nameEn: "clean white" };
    if (metrics.lightness <= .06 && metrics.saturation < .08) return { hex, nameKo: "퓨어 블랙", nameEn: "pure black" };
    const [baseKo, baseEn] = hueNames(metrics.hue, metrics.saturation);
    let toneKo = ""; let toneEn = "";
    if (metrics.lightness < .18) { toneKo = "딥 "; toneEn = "deep "; }
    else if (metrics.lightness < .34) { toneKo = "다크 "; toneEn = "dark "; }
    else if (metrics.lightness > .9) { toneKo = "페일 "; toneEn = "pale "; }
    else if (metrics.lightness > .76) { toneKo = "라이트 "; toneEn = "light "; }
    else if (metrics.saturation < .22) { toneKo = "뮤트 "; toneEn = "muted "; }
    else if (metrics.saturation > .82) { toneKo = "비비드 "; toneEn = "vivid "; }
    else if (metrics.saturation < .42) { toneKo = "소프트 "; toneEn = "soft "; }
    return { hex, nameKo: `${toneKo}${baseKo}`.trim(), nameEn: `${toneEn}${baseEn}`.trim() };
  }

  function makeRole(hex, usageKo, usageEn, source) {
    return { ...describeColor(hex), usageKo, usageEn, nameSource: source || "auto" };
  }

  function uniqueColors(list) {
    return [...new Set((list || []).map(normalizeHex).filter(Boolean))];
  }

  function chooseChromatic(colors, excluded) {
    return colors
      .filter((hex) => !excluded.has(hex))
      .map((hex, index) => ({ hex, index, ...colorMetrics(hex) }))
      .sort((a, b) => (b.saturation * .65 + Math.abs(.5 - b.lightness) * .1) - (a.saturation * .65 + Math.abs(.5 - a.lightness) * .1));
  }

  function toSlidePalette(palette) {
    if (!palette || palette.id === "none") return null;
    const colors = uniqueColors(palette.colors);
    if (!colors.length) return null;
    const sorted = colors.map((hex) => ({ hex, ...colorMetrics(hex) })).sort((a, b) => a.luminance - b.luminance);
    const darkMode = palette.mode === "dark";
    const background = darkMode ? sorted[0].hex : sorted[sorted.length - 1].hex;
    let textPrimary = darkMode ? sorted[sorted.length - 1].hex : sorted[0].hex;
    if (contrast(textPrimary, background) < 4.5) textPrimary = darkMode ? "#F8FAFC" : "#111827";
    const excluded = new Set([background, textPrimary]);
    const chromatic = chooseChromatic(colors, excluded);
    const accent = chromatic[0]?.hex || (darkMode ? "#60A5FA" : "#2563EB");
    const primary = chromatic.find((item) => item.hex !== accent && contrast(item.hex, background) >= 2.2)?.hex || chromatic[1]?.hex || accent;
    const secondary = chromatic.find((item) => item.hex !== accent && item.hex !== primary)?.hex || mix(primary, background, .35);
    const surface = darkMode ? mix(background, textPrimary, .09) : mix(background, textPrimary, .055);
    let textSecondary = mix(textPrimary, background, .32);
    if (contrast(textSecondary, background) < 3) textSecondary = mix(textPrimary, background, .2);
    const border = mix(background, textPrimary, darkMode ? .2 : .16);
    const roles = {
      primary: makeRole(primary, "제목, 주요 도형과 핵심 구조", "headings, primary shapes, and structure"),
      secondary: makeRole(secondary, "보조 정보와 구분 요소", "supporting information and dividers"),
      accent: makeRole(accent, "핵심 수치와 선택적 강조", "key figures and selective emphasis"),
      background: makeRole(background, "슬라이드 기본 배경", "main slide background"),
      surface: makeRole(surface, "카드와 정보 표면", "cards and information surfaces"),
      textPrimary: makeRole(textPrimary, "제목과 본문 텍스트", "headings and body text"),
      textSecondary: makeRole(textSecondary, "보조 설명과 캡션", "supporting copy and captions"),
      border: makeRole(border, "테두리와 구분선", "borders and dividers"),
    };
    return {
      source: "visual-mixer",
      presetId: palette.id,
      presetVersion: 1,
      paletteNameKo: palette.name || palette.id,
      paletteNameEn: palette.nameEn || `${roles.primary.nameEn} and ${roles.accent.nameEn}`,
      mode: palette.mode || "light",
      category: palette.category || "all",
      mood: palette.mood || "",
      usage: palette.usage || "",
      originalColors: colors,
      roles,
      validation: {
        textContrast: contrast(roles.textPrimary.hex, roles.background.hex),
        secondaryTextContrast: contrast(roles.textSecondary.hex, roles.background.hex),
        accentContrast: contrast(roles.accent.hex, roles.background.hex),
      },
    };
  }

  const analysisCache = new Map();
  const ANALYSIS_LABELS = {
    temperature: { cool: "쿨", neutralCool: "뉴트럴 쿨", neutral: "중성", neutralWarm: "뉴트럴 웜", warm: "웜" },
    saturation: { muted: "차분한 채도", controlled: "절제된 채도", balanced: "균형 채도", vivid: "선명한 채도" },
    contrast: { soft: "부드러운 대비", clear: "명확한 대비", bold: "강한 대비", dramatic: "극적인 대비" },
  };

  function hueTemperatureScore(hue) {
    if (hue >= 165 && hue <= 260) return -1;
    if (hue > 260 && hue < 315) return -.3;
    if (hue >= 315 || hue <= 75) return 1;
    if (hue > 75 && hue < 150) return .35;
    return 0;
  }

  function classifyTemperature(score) {
    if (score <= -.55) return "cool";
    if (score <= -.15) return "neutralCool";
    if (score < .15) return "neutral";
    if (score < .55) return "neutralWarm";
    return "warm";
  }

  function classifySaturation(score) {
    if (score < .3) return "muted";
    if (score < .52) return "controlled";
    if (score < .74) return "balanced";
    return "vivid";
  }

  function classifyContrast(score) {
    if (score < 2.2) return "soft";
    if (score < 3.8) return "clear";
    if (score < 6.5) return "bold";
    return "dramatic";
  }

  function analyzePalette(palette) {
    if (!palette || palette.id === "none") return null;
    if (analysisCache.has(palette.id)) return analysisCache.get(palette.id);
    const candidate = toSlidePalette(palette);
    if (!candidate) return null;
    const chromatic = [candidate.roles.primary, candidate.roles.secondary, candidate.roles.accent]
      .map((role) => colorMetrics(role.hex))
      .filter((metrics) => metrics.saturation >= .08);
    const saturationScore = chromatic.length
      ? chromatic.reduce((sum, metrics) => sum + metrics.saturation, 0) / chromatic.length
      : 0;
    const temperatureWeight = chromatic.reduce((sum, metrics) => sum + Math.max(.15, metrics.saturation), 0);
    const temperatureScore = temperatureWeight
      ? chromatic.reduce((sum, metrics) => sum + hueTemperatureScore(metrics.hue) * Math.max(.15, metrics.saturation), 0) / temperatureWeight
      : 0;
    const contrastScore = (
      contrast(candidate.roles.primary.hex, candidate.roles.background.hex)
      + contrast(candidate.roles.accent.hex, candidate.roles.background.hex)
    ) / 2;
    const analysis = {
      temperature: classifyTemperature(temperatureScore),
      temperatureScore,
      saturation: classifySaturation(saturationScore),
      saturationScore,
      contrast: classifyContrast(contrastScore),
      contrastScore,
      textContrast: candidate.validation.textContrast,
      labels: {
        temperature: ANALYSIS_LABELS.temperature[classifyTemperature(temperatureScore)],
        saturation: ANALYSIS_LABELS.saturation[classifySaturation(saturationScore)],
        contrast: ANALYSIS_LABELS.contrast[classifyContrast(contrastScore)],
      },
    };
    analysisCache.set(palette.id, analysis);
    return analysis;
  }

  function withAnalysis(palette) {
    return palette ? { ...palette, analysis: analyzePalette(palette) } : null;
  }

  const actualCategories = [...new Set(palettes.map((item) => item.category).filter(Boolean))];
  const categoryMap = new Map(declaredCategories.map((item) => [item.id, item.label]));
  const categories = actualCategories.filter((id) => id !== "all").map((id) => ({ id, label: categoryMap.get(id) || ({ modern: "✨ 모던 템플릿", photo: "🎬 사진·시네마" }[id] || id) }));

  function list(filters) {
    const options = filters || {};
    const query = String(options.query || "").trim().toLowerCase();
    return palettes.filter((palette) => {
      if (!palette || palette.id === "none") return false;
      const analysis = analyzePalette(palette);
      if (options.category && options.category !== "all" && palette.category !== options.category) return false;
      if (options.mode && options.mode !== "all" && palette.mode !== options.mode) return false;
      if (options.usage && options.usage !== "all" && palette.usage !== options.usage) return false;
      if (options.temperature && options.temperature !== "all" && analysis?.temperature !== options.temperature) return false;
      if (options.saturation && options.saturation !== "all" && analysis?.saturation !== options.saturation) return false;
      if (options.contrast && options.contrast !== "all" && analysis?.contrast !== options.contrast) return false;
      if (options.recommended && !(palette.category === "official" || palette.usage === "corporate")) return false;
      if (!query) return true;
      return [palette.name, palette.nameEn, palette.category, palette.mode, palette.usage, palette.mood, palette.colorMapping].some((value) => String(value || "").toLowerCase().includes(query));
    }).map(withAnalysis);
  }

  function get(id) { return withAnalysis(palettes.find((palette) => palette.id === id) || null); }

  window.PromptDeckPaletteCatalog = {
    ROLE_KEYS,
    categories,
    list,
    get,
    toSlidePalette,
    analyzePalette,
    analysisLabels: ANALYSIS_LABELS,
    describeColor,
    contrast,
    normalizeHex,
  };
})();
