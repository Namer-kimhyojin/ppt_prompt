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
  "src/slide-style-presets/proposal-planning.js",
  "src/slide-style-catalog.js",
];
const context = { console };
context.window = context;
vm.createContext(context);
for (const sourceFile of sourceFiles) {
  vm.runInContext(fs.readFileSync(path.resolve(sourceFile), "utf8"), context, { filename: sourceFile });
}

const catalog = context.window.PromptDeckSlideStyleCatalog;
if (!catalog?.styles) {
  console.error("catalog load failed");
  process.exit(1);
}

const styles = catalog.styles;
const idSet = new Set(styles.map((style) => style.id));
const previewIds = fs.readdirSync(path.resolve("assets/slide-style-previews"))
  .filter((name) => name.toLowerCase().endsWith(".jpg"))
  .map((name) => path.basename(name, ".jpg"));
const previewSet = new Set(previewIds);
const missing = [...idSet].filter((id) => !previewSet.has(id));
const orphan = [...previewSet].filter((id) => !idSet.has(id));
const byCategory = Object.fromEntries(catalog.categories.map((category) => [category.id, styles.filter((style) => style.category === category.id).length]));
const newStyles = styles.filter((style) => Number(style.introducedIn) === Number(catalog.version));

console.log("slide-style-audit-summary");
console.log(`catalog-version: ${catalog.version}`);
console.log(`source-packs: ${sourceFiles.length - 1}`);
console.log(`styles-total: ${styles.length}`);
for (const [category, count] of Object.entries(byCategory)) console.log(`category: ${category} -> ${count}`);
console.log(`recommended: ${catalog.list({ category: "recommended" }).length}`);
console.log(`introduced-in-current-version: ${newStyles.length}`);
console.log(`previews-total: ${previewIds.length}`);
console.log(`missing-preview: ${missing.length}`);
console.log(`orphan-preview: ${orphan.length}`);
if (missing.length) console.log(`missing: ${missing.join(", ")}`);
if (orphan.length) console.log(`orphan: ${orphan.join(", ")}`);

process.exit(missing.length || orphan.length || styles.length !== idSet.size ? 2 : 0);
