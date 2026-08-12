import crypto from "node:crypto";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const sourceFiles = [
  "src/slide-style-presets/commercial-core.js",
  "src/slide-style-presets/commercial-visual.js",
  "src/slide-style-presets/local-trend.js",
  "src/slide-style-presets/self-introduction.js",
  "src/slide-style-presets/technology-commercialization.js",
  "src/slide-style-presets/event-guidance.js",
  "src/slide-style-presets/visual-spectrum.js",
  "src/slide-style-catalog.js",
];
const context = { console };
context.window = context;
vm.createContext(context);
for (const sourceFile of sourceFiles) {
  vm.runInContext(fs.readFileSync(path.resolve(sourceFile), "utf8"), context, { filename: sourceFile });
}

const catalog = context.window.PromptDeckSlideStyleCatalog;
if (!catalog || !Array.isArray(catalog.styles)) {
  console.error("catalog load failed");
  process.exit(1);
}

const styles = catalog.styles;
const validCategories = new Set(catalog.categories.map((item) => item.id));
const errors = [];
const warnings = [];
const byId = new Map();
const byNameKo = new Map();
const byNameEn = new Map();
const requiredColorRoles = ["primary", "secondary", "accent", "background", "surface", "textPrimary", "textSecondary", "border"];
const visualSpectrumDefinitions = context.window.PromptDeckSlideStylePresetPacks?.visualSpectrum || [];
const visualSpectrumIds = new Set(visualSpectrumDefinitions.map((definition) => definition.id));
const visualSpectrumById = new Map(visualSpectrumDefinitions.map((definition) => [definition.id, definition]));
const provenancePath = path.resolve("assets/slide-style-previews/visual-spectrum-provenance.json");
let provenance = null;
try {
  provenance = JSON.parse(fs.readFileSync(provenancePath, "utf8"));
} catch (error) {
  errors.push(`visual-spectrum provenance unavailable: ${error.message}`);
}
const provenanceAssets = new Map();
if (provenance) {
  if (provenance.sourceKind !== "ai-image-generation") errors.push("visual-spectrum provenance must identify AI image generation as the source");
  if (provenance.reviewStatus !== "visual-review-passed") errors.push("visual-spectrum previews must pass visual review");
  if (!Array.isArray(provenance.assets)) errors.push("visual-spectrum provenance assets must be an array");
  else {
    for (const asset of provenance.assets) {
      if (!asset?.id) { errors.push("visual-spectrum provenance asset is missing id"); continue; }
      if (provenanceAssets.has(asset.id)) errors.push(`duplicate visual-spectrum provenance: ${asset.id}`);
      else provenanceAssets.set(asset.id, asset);
    }
  }
}

function addUnique(map, value, label, id) {
  const key = String(value || "").trim().toLocaleLowerCase("ko-KR");
  if (!key) return;
  if (map.has(key)) errors.push(`duplicate ${label}: ${value} (${map.get(key)}, ${id})`);
  else map.set(key, id);
}

function channel(value) {
  const normalized = value / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function contrast(a, b) {
  const rgb = (hex) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
  const luminance = (hex) => {
    const [r, g, b] = rgb(hex).map(channel);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

function jpegDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    if (marker === 0xd9 || marker === 0xda) break;
    const length = buffer.readUInt16BE(offset + 2);
    if (!length) break;
    offset += length + 2;
  }
  return null;
}

for (const style of styles) {
  if (!style.id) { errors.push("missing id"); continue; }
  if (byId.has(style.id)) errors.push(`duplicate id: ${style.id}`);
  else byId.set(style.id, style);
  addUnique(byNameKo, style.nameKo, "nameKo", style.id);
  addUnique(byNameEn, style.nameEn, "nameEn", style.id);
  if (!validCategories.has(style.category)) errors.push(`invalid category: ${style.id} -> ${style.category}`);

  for (const key of ["nameKo", "nameEn", "description", "bestFor"]) {
    if (!String(style[key] || "").trim()) errors.push(`${style.id}: missing ${key}`);
  }
  if (!String(style.prompt?.ko || "").trim() || !String(style.prompt?.en || "").trim()) errors.push(`${style.id}: missing bilingual prompt`);
  if (!Array.isArray(style.aliases) || style.aliases.length === 0) errors.push(`${style.id}: missing aliases`);
  if (!Array.isArray(style.tags) || style.tags.length === 0) errors.push(`${style.id}: missing tags`);

  const colors = style.settings?.colors || {};
  for (const role of requiredColorRoles) {
    if (!/^#[0-9a-f]{6}$/i.test(colors[role] || "")) errors.push(`${style.id}: invalid color ${role}`);
  }
  if (Number(style.introducedIn) === Number(catalog.version)) {
    if (!style.facets?.useCases?.length || !style.facets?.moods?.length || !style.facets?.media?.length) errors.push(`${style.id}: incomplete facets`);
    if (style.distinctiveRules.length < 3 || style.avoidRules.length < 2) errors.push(`${style.id}: incomplete differentiation rules`);
    if (contrast(colors.textPrimary, colors.background) < 4.5) errors.push(`${style.id}: text/background contrast below 4.5`);
  }

  const previewPath = path.join("assets", "slide-style-previews", `${style.id}.jpg`);
  if (!fs.existsSync(previewPath)) errors.push(`${style.id}: missing preview`);
  else {
    const size = jpegDimensions(previewPath);
    const expectedPreviewSize = { width: 960, height: 540 };
    if (!size || size.width !== expectedPreviewSize.width || size.height !== expectedPreviewSize.height) {
      errors.push(`${style.id}: preview must be ${expectedPreviewSize.width}x${expectedPreviewSize.height} JPG`);
    }
    if (visualSpectrumIds.has(style.id)) {
      const asset = provenanceAssets.get(style.id);
      const definition = visualSpectrumById.get(style.id);
      if (!asset) errors.push(`${style.id}: missing AI preview provenance`);
      else {
        const digest = crypto.createHash("sha256").update(fs.readFileSync(previewPath)).digest("hex");
        if (asset.file !== `${style.id}.jpg`) errors.push(`${style.id}: provenance filename mismatch`);
        if (asset.width !== 960 || asset.height !== 540) errors.push(`${style.id}: provenance dimensions mismatch`);
        if (asset.sha256 !== digest) errors.push(`${style.id}: preview hash does not match reviewed AI source`);
        if (asset.catalogAnchor !== (definition?.preview?.title || definition?.nameKo)) errors.push(`${style.id}: catalog anchor mismatch`);
      }
    }
  }
}

for (const id of provenanceAssets.keys()) {
  if (!visualSpectrumIds.has(id)) errors.push(`orphan visual-spectrum provenance: ${id}`);
}
if (provenanceAssets.size !== visualSpectrumIds.size) {
  errors.push(`expected ${visualSpectrumIds.size} visual-spectrum provenance records, found ${provenanceAssets.size}`);
}

const previewIds = fs.readdirSync(path.resolve("assets/slide-style-previews"))
  .filter((name) => name.toLowerCase().endsWith(".jpg"))
  .map((name) => path.basename(name, ".jpg"));
for (const previewId of previewIds) if (!byId.has(previewId)) errors.push(`orphan preview: ${previewId}`);

const newStyles = styles.filter((style) => Number(style.introducedIn) === Number(catalog.version));
const release = catalog.release || {};
if (styles.length !== release.expectedTotal) errors.push(`expected ${release.expectedTotal} styles, found ${styles.length}`);
if (newStyles.length !== release.expectedNew) errors.push(`expected ${release.expectedNew} version-${catalog.version} styles, found ${newStyles.length}`);
if (catalog.list({ category: "recommended" }).length !== release.expectedRecommended) errors.push(`expected ${release.expectedRecommended} recommended styles`);

const searchCases = [
  ["회사소개서", "photo-company-profile"], ["온보딩", "employee-handbook"], ["베이지", "neutral-beige-proposal"],
  ["UI", "product-ui-story"], ["한지", "korean-heritage-modern"], ["워크숍", "training-workshop"],
  ["자기소개서", "self-intro-clean-standard"], ["개발자 자기소개", "self-intro-developer-profile"], ["연구계획", "self-intro-research-academic"],
  ["기술사업화 진단", "tc-commercialization-diagnostic"], ["PoC 기획", "tc-poc-plan"], ["기술이전 협상", "tc-transfer-terms-comparison"],
  ["세미나 안내", "event-seminar-overview"], ["워크숍 일정", "event-workshop-agenda"], ["웨비나", "event-webinar-live"],
  ["의사결정 보고", "decision-memo"], ["북유럽 미니멀", "nordic-soft-minimal"], ["제품 출시", "product-launch-story"],
  ["시스템 구성도", "system-architecture-map"], ["수묵화", "ink-wash-modern"], ["Y2K", "holographic-y2k"],
];
for (const [query, expectedId] of searchCases) {
  if (!catalog.list({ category: "all", query }).some((style) => style.id === expectedId)) errors.push(`search failed: ${query} -> ${expectedId}`);
}
if (!catalog.list({ category: "all", useCase: "hr" }).some((style) => style.id === "people-culture")) errors.push("facet failed: useCase=hr");
if (!catalog.list({ category: "all", media: "ui" }).some((style) => style.id === "product-ui-story")) errors.push("facet failed: media=ui");
if (catalog.list({ category: "self-introduction" }).length !== 8) errors.push("category failed: self-introduction");
if (!catalog.list({ category: "all", useCase: "self-introduction" }).some((style) => style.id === "self-intro-clean-standard")) errors.push("facet failed: useCase=self-introduction");
if (!catalog.list({ category: "all", workStage: "poc" }).some((style) => style.id === "tc-poc-plan")) errors.push("facet failed: workStage=poc");
if (!catalog.list({ category: "all", documentType: "tech-brief" }).some((style) => style.id === "tc-tech-brief")) errors.push("facet failed: documentType=tech-brief");
if (!catalog.list({ category: "all", audience: "investor" }).some((style) => style.id === "tc-investment-finance-linkage")) errors.push("facet failed: audience=investor");
if (!catalog.list({ category: "all", supportInstrument: "transfer" }).some((style) => style.id === "tc-demand-supply-matching")) errors.push("facet failed: supportInstrument=transfer");
if (catalog.list({ category: "technology-commercialization" }).length !== 16) errors.push("category failed: technology-commercialization");
if (catalog.list({ category: "event-guidance" }).length !== 12) errors.push("category failed: event-guidance");
if (catalog.list({ category: "reporting" }).length !== 20) errors.push("category failed: reporting");
if (catalog.list({ category: "branding" }).length !== 22) errors.push("category failed: branding");
if (catalog.list({ category: "startup" }).length !== 13) errors.push("category failed: startup");
if (catalog.list({ category: "technology" }).length !== 12) errors.push("category failed: technology");
if (catalog.list({ category: "creative" }).length !== 20) errors.push("category failed: creative");
if (!catalog.list({ category: "all", media: "diagram" }).some((style) => style.id === "system-architecture-map")) errors.push("facet failed: media=diagram for system-architecture-map");
if (!catalog.list({ category: "all", workStage: "event-delivery" }).some((style) => style.id === "event-hands-on-workshop")) errors.push("facet failed: workStage=event-delivery");
if (!catalog.list({ category: "all", documentType: "speaker-profile" }).some((style) => style.id === "event-keynote-speaker")) errors.push("facet failed: documentType=speaker-profile");
if (!catalog.list({ category: "all", supportInstrument: "online" }).some((style) => style.id === "event-webinar-live")) errors.push("facet failed: supportInstrument=online");

const structureGroups = new Map();
for (const style of styles) {
  const signature = JSON.stringify({
    compositionProfile: style.settings.compositionProfile,
    composition: style.settings.composition,
    typographyPreset: style.settings.typographyPreset,
    typography: style.settings.typography,
    backgroundProfile: style.settings.backgroundProfile,
    resources: style.settings.resources,
    photoComposite: style.settings.photoComposite,
  });
  if (!structureGroups.has(signature)) structureGroups.set(signature, []);
  structureGroups.get(signature).push(style.id);
}
for (const group of structureGroups.values()) if (group.length > 1) warnings.push(`shared structural grammar: ${group.join(", ")}`);

const categoryCount = Object.fromEntries(catalog.categories.map((category) => [category.id, styles.filter((style) => style.category === category.id).length]));
console.log("slide-style summary");
console.log(`TOTAL=${styles.length}`);
console.log(`VERSION=${catalog.version}`);
console.log(`NEW=${newStyles.length}`);
console.log(`RECOMMENDED=${catalog.list({ category: "recommended" }).length}`);
console.log(`CATEGORIES=${JSON.stringify(categoryCount)}`);
console.log(`PREVIEWS=${previewIds.length}`);
if (warnings.length) warnings.forEach((warning) => console.warn(`WARN ${warning}`));
if (errors.length) {
  errors.forEach((error) => console.error(`ERROR ${error}`));
  process.exit(1);
}
console.log("validation passed");
