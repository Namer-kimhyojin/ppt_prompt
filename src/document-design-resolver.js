(function () {
  "use strict";
  const bundles = window.PromptDeckDocumentBundles;
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
    iconStyle: ["line", "solid"], backgroundScope: ["cover", "chapter", "all", "none"],
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
      activePageId: bundle.pages[0].id, feel: clone(bundle.defaultFeel),
      overrides: { colors: {}, fonts: {}, typographyScope: {}, components: {} },
      physicalSpec: { sizeId: "A4", widthMm: 210, heightMm: 297, orientation: "portrait", bindingId: "none", duplex: "single", spreadMode: "single-pages", bleedMm: 0 },
      formats: ["PDF"], sourcePrompt: "",
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
    const palette = { ...bundle.palette, ...state.overrides.colors };
    const colorLevel = { low: .18, balanced: .55, high: 1 }[state.feel.colorPresence];
    // Color degree changes large surfaces; explicit palette swatches remain exact.
    const fonts = { ...bundle.fonts, ...state.overrides.fonts };
    const scope = { heading: fonts.heading, body: fonts.body, numeral: fonts.heading, table: fonts.body, caption: fonts.body, quote: fonts.body, ...state.overrides.typographyScope };
    const componentStyles = {
      tableStyle: bundle.variant === "data" ? "striped" : "rules", chartType: "bar", iconStyle: "line",
      backgroundScope: "cover", imageStyle: "original", diagramStyle: "flow", ...state.overrides.components,
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
    const design = { bundleId: bundle.id, bundleVersion: bundle.version, familyId: bundle.familyId, label: bundle.label, variant: bundle.variant, pages: clone(bundle.pages), palette, fonts, typographyScope: scope, feel: clone(state.feel), componentStyles, physicalSpec: clone(physical), image: bundle.image, rules: bundle.rules.slice() };
    return { state, design, previewTokens, issues };
  }
  function changeBundle(input, id) {
    const state = normalize(input);
    const bundle = bundles.get(id) || bundles.bundles[0];
    return normalize({ ...state, bundleId: bundle.id, feel: bundle.defaultFeel, activePageId: bundle.pages[0].id, overrides: defaults().overrides });
  }
  function restore(input) { const state = normalize(input); return changeBundle(state, state.bundleId); }
  window.PromptDeckDocumentResolver = Object.freeze({ defaults, normalize, resolve, changeBundle, restore, sizes, options, componentOptions, fontNames });
})();
