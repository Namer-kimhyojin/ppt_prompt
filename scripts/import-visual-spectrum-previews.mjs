import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { chromium } from "playwright";

const args = new Map(process.argv.slice(2).map((argument) => {
  const [key, ...value] = argument.split("=");
  return [key, value.join("=")];
}));
if (!process.argv.includes("--approved")) {
  throw new Error("Production preview import requires --approved after visual review.");
}
if (args.get("--source") !== "imagegen") {
  throw new Error("Production preview import requires --source=imagegen.");
}

const inputDir = path.resolve(args.get("--input-dir") || "tmp/slide-style-preview-selected");
const outputDir = path.resolve("assets/slide-style-previews");
const reviewedOn = args.get("--reviewed-on") || new Date().toISOString().slice(0, 10);
const manifestPath = path.join(outputDir, "visual-spectrum-provenance.json");
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

const definitions = context.window.PromptDeckSlideStylePresetPacks?.visualSpectrum || [];
if (!definitions.length) throw new Error("visual-spectrum presets could not be loaded");

function pngDimensions(buffer) {
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function jpegDimensions(buffer) {
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

const inputs = definitions.map((definition) => {
  const candidates = ["png", "jpg", "jpeg"].map((extension) => path.join(inputDir, `${definition.id}.${extension}`));
  const sourcePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!sourcePath) throw new Error(`${definition.id}: reviewed source image is missing from ${inputDir}`);
  const buffer = fs.readFileSync(sourcePath);
  const dimensions = pngDimensions(buffer) || jpegDimensions(buffer);
  if (!dimensions || dimensions.width < 1280 || dimensions.height < 720) {
    throw new Error(`${definition.id}: source must be a valid image at least 1280x720`);
  }
  if (Math.abs((dimensions.width / dimensions.height) - (16 / 9)) > 0.01) {
    throw new Error(`${definition.id}: source aspect ratio must be 16:9`);
  }
  if (buffer.length < 500_000) {
    throw new Error(`${definition.id}: source is unexpectedly small for a reviewed generated image`);
  }
  return { definition, sourcePath, buffer, dimensions };
});

fs.mkdirSync(outputDir, { recursive: true });
const stageDir = path.resolve("tmp", `slide-style-preview-import-${Date.now()}`);
fs.mkdirSync(stageDir, { recursive: true });
const browserCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const executablePath = browserCandidates.find((candidate) => fs.existsSync(candidate));
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const assets = [];

try {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
  for (const input of inputs) {
    const mime = input.sourcePath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    const dataUrl = `data:${mime};base64,${input.buffer.toString("base64")}`;
    await page.setContent(`<!doctype html><html><head><style>*{box-sizing:border-box}html,body{width:960px;height:540px;margin:0;overflow:hidden;background:#111}img{display:block;width:960px;height:540px;object-fit:cover;object-position:center}</style></head><body><img id="preview" alt="" src="${dataUrl}"></body></html>`);
    const imageLoaded = await page.locator("#preview").evaluate((image) => image.complete && image.naturalWidth > 0);
    if (!imageLoaded) throw new Error(`${input.definition.id}: browser could not decode source image`);
    const stagedPath = path.join(stageDir, `${input.definition.id}.jpg`);
    await page.screenshot({ path: stagedPath, type: "jpeg", quality: 92 });
    const finalBuffer = fs.readFileSync(stagedPath);
    assets.push({
      id: input.definition.id,
      file: `${input.definition.id}.jpg`,
      catalogAnchor: input.definition.preview?.title || input.definition.nameKo,
      sourceFile: path.basename(input.sourcePath),
      sourceWidth: input.dimensions.width,
      sourceHeight: input.dimensions.height,
      sourceBytes: input.buffer.length,
      width: 960,
      height: 540,
      bytes: finalBuffer.length,
      sha256: crypto.createHash("sha256").update(finalBuffer).digest("hex"),
    });
    console.log(`prepared ${input.definition.id}.jpg`);
  }
} finally {
  await browser.close();
}

const manifest = {
  schemaVersion: 1,
  pack: "visualSpectrum",
  sourceKind: "ai-image-generation",
  generator: "OpenAI imagegen",
  reviewStatus: "visual-review-passed",
  reviewedOn,
  qualityGate: [
    "generated visual rather than HTML/SVG fallback",
    "16:9 source at least 1280x720",
    "visual composition and readable key copy reviewed",
    "normalized to 960x540 JPEG quality 92",
  ],
  assets,
};
fs.writeFileSync(path.join(stageDir, path.basename(manifestPath)), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
for (const asset of assets) {
  fs.copyFileSync(path.join(stageDir, asset.file), path.join(outputDir, asset.file));
}
fs.copyFileSync(path.join(stageDir, path.basename(manifestPath)), manifestPath);
fs.rmSync(stageDir, { recursive: true, force: true });
console.log(`imported ${assets.length} reviewed AI previews`);
console.log(`wrote ${path.relative(process.cwd(), manifestPath)}`);
