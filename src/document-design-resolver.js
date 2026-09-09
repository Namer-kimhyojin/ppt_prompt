(function () {
  "use strict";
  const bundles = window.PromptDeckDocumentBundles;
  const palettes = window.PromptDeckDocumentPalettes;
  if (!bundles) return;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const sizes = { A4: [210, 297], A3: [297, 420], A5: [148, 210], B5: [182, 257], Letter: [215.9, 279.4] };
  const options = {
    colorPresence: ["low", "balanced", "high"], breathing: ["compact", "balanced", "airy"],
    imagePresence: ["text", "balanced", "image"], titlePresence: ["quiet", "clear", "strong"],
    decorationPresence: ["minimal", "balanced", "rich"],
  };
  const componentOptions = {
    tableStyle: ["rules", "striped", "plain"], chartType: ["bar", "line", "donut"],
    iconStyle: ["line", "solid", "square"], backgroundScope: ["cover", "chapter", "all", "none"],
    backgroundStyle: ["wash", "band", "frame", "grid"],
    imageStyle: ["original", "muted"], diagramStyle: ["flow", "hierarchy"],
  };
  const fontNames = ["Noto Sans KR", "Noto Serif KR"];
  const colorKeys = ["primary", "secondary", "accent", "background", "surface", "text", "muted", "border"];
  const scopeKeys = ["heading", "body", "numeral", "table", "caption", "quote"];
  const pick = (value, allowed, fallback) => allowed.includes(value) ? value : fallback;
  const object = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
  function defaults() {
    const bundle = bundles.bundles[0];
    return {
      stateVersion: 3, bundleId: bundle.id, bundleVersion: bundle.version, familyId: bundle.familyId,
      activePageId: bundle.pages[0].id, feel: clone(bundle.defaultFeel), pageLayouts: {},
      colorPresetId: "", colorBaseBundleId: "", colorFeel: { ...palettes?.defaultFeel }, keepPaletteOnBundleChange: true,
      overrides: { colors: {}, fonts: {}, typographyScope: {}, components: {} },
      physicalSpec: { sizeId: "A4", widthMm: 210, heightMm: 297, orientation: "portrait", bindingId: "none", duplex: "single", spreadMode: "single-pages", bleedMm: 0 },
      formats: ["PDF"], sourcePrompt: "", interpretation: "balanced", hierarchy: window.PromptDeckDocumentHierarchy?.defaults(),
    };
  }
  function normalize(input) {
    const base = defaults();
    const raw = object(input);
    const bundle = bundles.get(raw.bundleId) || bundles.bundles[0];
    const aliases = { comfortable: "balanced", "image-led": "image", "text-led": "text" };
    const feel = Object.fromEntries(Object.entries(options).map(([key, values]) => [key, pick(aliases[raw.feel?.[key]] || raw.feel?.[key], values, pick(aliases[bundle.defaultFeel[key]] || bundle.defaultFeel[key], values, values[1]))]));
    const physical = object(raw.physicalSpec);
    const sizeId = pick(physical.sizeId === "LETTER" ? "Letter" : physical.sizeId, Object.keys(sizes), "A4");
    const orientation = pick(physical.orientation, ["portrait", "landscape"], "portrait");
    const [widthMm, heightMm] = orientation === "landscape" ? sizes[sizeId].slice().reverse() : sizes[sizeId];
    const overrides = { colors: {}, fonts: {}, typographyScope: {}, components: {} };
    for (const key of colorKeys) {
      const value = raw.overrides?.colors?.[key];
      if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)) overrides.colors[key] = value.toLowerCase();
    }
    for (const key of ["heading", "body"]) if (fontNames.includes(raw.overrides?.fonts?.[key])) overrides.fonts[key] = raw.overrides.fonts[key];
    for (const key of scopeKeys) if (fontNames.includes(raw.overrides?.typographyScope?.[key])) overrides.typographyScope[key] = raw.overrides.typographyScope[key];
    for (const [key, values] of Object.entries(componentOptions)) if (values.includes(raw.overrides?.components?.[key])) overrides.components[key] = raw.overrides.components[key];
    const formats = [...new Set((Array.isArray(raw.formats) ? raw.formats : base.formats).filter((v) => ["PDF", "DOCX", "PPTX", "HWPX", "HTML"].includes(v)))];
    return {
      ...base, bundleId: bundle.id, bundleVersion: bundle.version, familyId: bundle.familyId,
      activePageId: bundle.pages.some((p) => p.id === raw.activePageId) ? raw.activePageId : bundle.pages[0].id,
      feel, overrides, formats: formats.length ? formats : base.formats,
      interpretation: pick(raw.interpretation, ["faithful", "balanced", "creative"], "balanced"),
      hierarchy: window.PromptDeckDocumentHierarchy?.normalize(raw.hierarchy),
      pageLayouts: window.PromptDeckDocumentLayouts?.normalize(bundle.id, raw.pageLayouts) || {},
      colorPresetId: palettes?.get(raw.colorPresetId)?.id || "",
      colorBaseBundleId: bundles.get(raw.colorBaseBundleId)?.id || "",
      colorFeel: palettes?.normalizeFeel(raw.colorFeel) || {},
      keepPaletteOnBundleChange: raw.keepPaletteOnBundleChange !== false,
      sourcePrompt: typeof raw.sourcePrompt === "string" ? raw.sourcePrompt : "",
      physicalSpec: {
        sizeId, widthMm, heightMm, orientation,
        bindingId: pick(physical.bindingId, ["none", "left", "top", "saddle", "perfect", "hardcover", "spiral"], "none"),
        duplex: pick(physical.duplex, ["single", "duplex", "duplex-long", "duplex-short"], "single"),
        spreadMode: pick(physical.spreadMode, ["single-pages", "facing", "facing-pages"], "single-pages"),
        bleedMm: [0, 3].includes(Number(physical.bleedMm)) ? Number(physical.bleedMm) : 0,
      },
    };
  }
  function blend(hex, target, amount) {
    const rgb = (value) => [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16));
    const a = rgb(hex); const b = rgb(target);
    return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * amount).toString(16).padStart(2, "0")).join("");
  }
  function luminance(hex) {
    const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((n) => n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4);
    return v[0] * .2126 + v[1] * .7152 + v[2] * .0722;
  }
  function resolve(input) {
    const state = normalize(input);
    const bundle = bundles.get(state.bundleId);
    const preset = palettes?.get(state.colorPresetId);
    const colorBundle = bundles.get(state.colorBaseBundleId) || bundle;
    const basePalette = preset?.colors || colorBundle.palette;
    const palette = { ...(palettes?.applyFeel(basePalette, state.colorFeel) || basePalette), ...state.overrides.colors };
    const colorLevel = { low: .18, balanced: .55, high: 1 }[state.feel.colorPresence];
    // Color degree changes large surfaces; explicit palette swatches remain exact.
    const fonts = { ...bundle.fonts, ...state.overrides.fonts };
    const scope = { heading: fonts.heading, body: fonts.body, numeral: fonts.heading, table: fonts.body, caption: fonts.body, quote: fonts.body, ...state.overrides.typographyScope };
    const variantComponents = {
      "editorial-report": { tableStyle: "plain", chartType: "line", backgroundScope: "chapter" },
      "field-ledger": { tableStyle: "striped", chartType: "bar", imageStyle: "muted" },
      "brand-story": { tableStyle: "plain", chartType: "donut", backgroundScope: "chapter" },
      "sprint-canvas": { tableStyle: "striped", chartType: "bar", diagramStyle: "hierarchy" },
      "visual-atlas": { tableStyle: "plain", chartType: "donut", diagramStyle: "hierarchy", backgroundScope: "chapter" },
      "write-workbook": { tableStyle: "rules", chartType: "bar", backgroundScope: "none" },
      "quick-review": { tableStyle: "plain", chartType: "line", backgroundScope: "chapter" },
      "question-bank": { tableStyle: "striped", chartType: "bar", backgroundScope: "none" },
      letterpress: { tableStyle: "plain", backgroundScope: "none", imageStyle: "muted" },
      "seasonal-journal": { tableStyle: "plain", imageStyle: "muted", backgroundScope: "chapter" },
      "night-adventure": { backgroundScope: "all", imageStyle: "original" },
      "comic-panels": { backgroundScope: "all", imageStyle: "original", iconStyle: "solid" },
      "executive-brief": { tableStyle: "plain", chartType: "donut", backgroundScope: "chapter" },
      "audit-matrix": { tableStyle: "striped", chartType: "bar", backgroundScope: "none" },
      "research-monograph": { tableStyle: "rules", chartType: "line", imageStyle: "muted", backgroundScope: "none" },
      "operations-dashboard": { tableStyle: "striped", chartType: "bar", iconStyle: "solid", backgroundScope: "chapter" },
      "tender-response": { tableStyle: "striped", chartType: "bar", diagramStyle: "hierarchy", backgroundScope: "none" },
      "investment-case": { tableStyle: "plain", chartType: "line", iconStyle: "solid", backgroundScope: "chapter" },
      "service-blueprint": { tableStyle: "rules", chartType: "bar", diagramStyle: "flow", backgroundScope: "chapter" },
      "creative-concept": { tableStyle: "plain", chartType: "donut", imageStyle: "original", backgroundScope: "all" },
    };
    const componentStyles = {
      tableStyle: bundle.variant === "data" ? "striped" : "rules", chartType: "bar", iconStyle: "line",
      backgroundScope: "cover", backgroundStyle: "wash", imageStyle: "original", diagramStyle: "flow",
      ...(variantComponents[bundle.variant] || {}), ...state.overrides.components,
    };
    const physical = state.physicalSpec;
    const px = 96 / 25.4;
    const breath = { compact: 0, balanced: 1, airy: 2 }[state.feel.breathing];
    const title = { quiet: 0, clear: 1, strong: 2 }[state.feel.titlePresence];
    const width = physical.widthMm * px;
    const previewTokens = {
      widthPx: width, heightPx: physical.heightMm * px,
      marginPx: Math.min(width * .11, (12 + breath * 4) * px),
      fontPx: bundle.familyId === "story" ? 21 : bundle.familyId === "prose" ? 16 : 14.5,
      titlePx: [27, 36, 46][title], lineHeight: [1.5, 1.8, 2.08][breath],
      paragraphGap: [10, 18, 28][breath], cellPadding: [7, 11, 16][breath],
      imageRatio: { text: .24, balanced: .43, image: .67 }[state.feel.imagePresence],
      decorationLevel: { minimal: 0, balanced: .5, rich: 1 }[state.feel.decorationPresence],
      colorLevel, titleWeight: [500, 700, 800][title],
      colorWash: blend(palette.background, palette.primary, colorLevel * .13),
    };
    const hi = Math.max(luminance(palette.text), luminance(palette.background));
    const lo = Math.min(luminance(palette.text), luminance(palette.background));
    const issues = [];
    if ((hi + .05) / (lo + .05) < 4.5) issues.push({ level: "warning", code: "low-contrast", message: "본문과 배경의 색이 비슷합니다. 읽기 쉬운 대비로 조정해 주세요." });
    if (palettes) {
      const pairs = [["text", "surface", "본문·내용 면", 4.5], ["muted", "background", "보조 글자·배경", 4.5], ["muted", "surface", "보조 글자·내용 면", 4.5], ["primary", "background", "제목·배경", 4.5], ["primary", "surface", "제목·내용 면", 4.5]];
      const weak = pairs.filter(([a, b, , limit]) => palettes.contrast(palette[a], palette[b]) < limit).map(([, , label]) => label);
      if (weak.length) issues.push({ level: "warning", code: "palette-contrast", message: `${weak.join(", ")}의 대비가 낮습니다. 직접 지정한 색상을 확인해 주세요.` });
    }
    const design = { bundleId: bundle.id, bundleVersion: bundle.version, familyId: bundle.familyId, label: bundle.label, variant: bundle.variant, pages: clone(bundle.pages), palette, fonts, typographyScope: scope, feel: clone(state.feel), componentStyles, physicalSpec: clone(physical), image: bundle.image, rules: bundle.rules.slice() };
    design.pageLayouts = clone(state.pageLayouts);
    design.interpretation = state.interpretation;
    if (window.PromptDeckDocumentHierarchy?.enabled(state.hierarchy)) design.hierarchy = clone(state.hierarchy);
    design.pages.forEach((page) => {
      const layout = window.PromptDeckDocumentLayouts?.get(bundle.id, page.id, state.pageLayouts[page.id] || "default");
      if (layout) page.layout = { ...layout };
    });
    design.colorScheme = { presetId: state.colorPresetId, label: preset?.label || (state.colorBaseBundleId ? `${colorBundle.label} 색상` : "견본 기본 색상"), feel: { ...state.colorFeel }, direction: palettes?.describe(state.colorFeel) || "", customizedRoles: Object.keys(state.overrides.colors), keepOnBundleChange: state.keepPaletteOnBundleChange };
    return { state, design, previewTokens, issues };
  }
  function changeBundle(input, id) {
    const state = normalize(input);
    const bundle = bundles.get(id) || bundles.bundles[0];
    const keep = state.keepPaletteOnBundleChange && (state.colorPresetId || state.colorBaseBundleId || Object.keys(state.overrides.colors).length || Object.entries(state.colorFeel).some(([k, v]) => v !== palettes?.defaultFeel[k]));
    const overrides = defaults().overrides;
    if (keep) overrides.colors = { ...state.overrides.colors };
    if (bundle.id !== state.bundleId) state.pageLayouts = {};
    return normalize({ ...state, bundleId: bundle.id, feel: { ...bundle.defaultFeel, ...(keep ? { colorPresence: state.feel.colorPresence } : {}) }, activePageId: bundle.pages[0].id, overrides, colorPresetId: keep ? state.colorPresetId : "", colorBaseBundleId: keep && !state.colorPresetId ? state.colorBaseBundleId || state.bundleId : "", colorFeel: keep ? state.colorFeel : palettes?.defaultFeel });
  }
  function restore(input) { const state = normalize(input); return changeBundle({ ...state, pageLayouts: {}, colorPresetId: "", colorBaseBundleId: "", colorFeel: palettes?.defaultFeel, overrides: defaults().overrides }, state.bundleId); }
  window.PromptDeckDocumentResolver = Object.freeze({ defaults, normalize, resolve, changeBundle, restore, sizes, options, componentOptions, fontNames });
})();
