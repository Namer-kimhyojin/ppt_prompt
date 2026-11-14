// Builds assets/motion-style-prompts/<id>.js from a local Lemo-Opuscar checkout.
// Usage: node scripts/import-motion-style-prompts.mjs <path-to-lemo-opuscar-checkout>
// The checkout must be at the revision pinned in src/motion-style-catalog.js.
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import "../src/motion-style-catalog.js";

const catalog = globalThis.PromptDeckMotionStyles;
const checkout = process.argv[2];
if (!checkout) throw new Error("Pass the path to a lemo-opuscar checkout at revision " + catalog.revision);
const license = await fs.readFile(path.join(checkout, "LICENSE"), "utf8");
const previewLicense = await fs.readFile(path.resolve(import.meta.dirname, "../assets/motion-style-previews/LICENSE-MIT.txt"), "utf8");
if (!previewLicense.includes("Copyright (c) 2026 LemoLab")) throw new Error("Unexpected license");
const lf = (text) => text.replace(/\r\n?/g, "\n").trim();
if (lf(license) !== lf(previewLicense)) throw new Error("LICENSE differs from the pinned revision");
const provenance = JSON.parse(await fs.readFile(path.resolve(import.meta.dirname, "../assets/motion-style-previews/manifest.json"), "utf8"));
if (provenance.revision !== catalog.revision || !Array.isArray(provenance.assets) || provenance.assets.length !== catalog.styles.length) throw new Error("Style provenance does not match the pinned catalog");
const sources = new Map(provenance.assets.map((entry) => [entry.id, entry]));
if (sources.size !== catalog.styles.length) throw new Error("Duplicate style provenance entries");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const destination = path.resolve(import.meta.dirname, "../assets/motion-style-prompts");

// Keep the style rules; drop the parts that only point at the demo's own source files.
function distill(markdown) {
  return markdown
    .replace(/\r\n?/g, "\n")
    .replace(/\n## \d+\. Engine\n[\s\S]*?(?=\n## |\n---\s*\n|$)/, "\n")
    .replace(/\n\*\*Engine\*\*[^\n]*(?:\n(?!\n)[^\n]*)*/g, "\n")
    .replace(/\n---\s*\n+How our demo was made[\s\S]*$/, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Validate every input before writing anything, including styles near the end of
// the catalog. A bad checkout must not leave a partially replaced prompt pack.
const records = [];
for (const style of catalog.styles) {
  const expected = sources.get(style.id);
  if (!expected || expected.styleSource !== style.reference || !/^[a-f0-9]{64}$/.test(expected.styleSourceSha256)) throw new Error(`Missing pinned source: ${style.id}`);
  const folder = path.join(checkout, "styles", style.id);
  const bytes = await fs.readFile(path.join(folder, "STYLE.md"));
  const source = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  // Git may check out LF source files with CRLF on Windows. Accept that exact
  // newline conversion only; keep sourceSha256 equal to the verified upstream
  // bytes, never the platform-specific working-copy digest.
  const checkoutSha256 = sha256(bytes);
  const sourceSha256 = checkoutSha256 === expected.styleSourceSha256 ? checkoutSha256 : sha256(source.replace(/\r\n/g, "\n"));
  if (sourceSha256 !== expected.styleSourceSha256) throw new Error(`STYLE.md differs from the pinned revision: ${style.id}`);
  const meta = JSON.parse(await fs.readFile(path.join(folder, "style.json"), "utf8"));
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) throw new Error(`Invalid style metadata: ${style.id}`);
  for (const field of ["en", "film", "line"]) if (meta[field] != null && typeof meta[field] !== "string") throw new Error(`Invalid ${field} metadata: ${style.id}`);
  if (meta.dur != null && (typeof meta.dur !== "number" && typeof meta.dur !== "string" || String(meta.dur).trim() === "" || !Number.isFinite(Number(meta.dur)) || Number(meta.dur) < 0)) throw new Error(`Invalid duration metadata: ${style.id}`);
  const text = distill(source);
  const title = (text.match(/^# (.+)$/m)?.[1] || meta.en || "").replace(/\s+—\s+Style Prompt$/i, "").trim();
  if (!title || /[\r\n]/.test(title)) throw new Error(`Invalid style title: ${style.id}`);
  if (!/## \d+\. /.test(text) || text.length < 4000) throw new Error(`Spec too short: ${style.id}`);
  records.push({ id: style.id, title, demo: { film: meta.film || "", line: meta.line || "", seconds: Number(meta.dur) || 0 }, revision: catalog.revision, source: style.reference, sourceSha256, text });
}
const assets = [];
await fs.mkdir(destination, { recursive: true });
for (const record of records) {
  const { id, title, text } = record;
  await fs.writeFile(path.join(destination, `${id}.js`), `// ${title}: style prompt from LemoLab Lemo-Opuscar (MIT), engine notes removed. See LICENSE-MIT.txt.\n(function (g) { "use strict"; const registry = g.PromptDeckMotionStylePrompts = g.PromptDeckMotionStylePrompts || {}; registry[${JSON.stringify(id)}] = Object.freeze(${JSON.stringify(record)}); })(globalThis);\n`, "utf8");
  assets.push({ id, title, file: `${id}.js`, source: record.source, sourceSha256: record.sourceSha256, chars: text.length });
}
await fs.writeFile(path.join(destination, "LICENSE-MIT.txt"), previewLicense, "utf8");
await fs.writeFile(path.join(destination, "manifest.json"), JSON.stringify({ source: "https://github.com/lemomo-ai/lemo-opuscar", revision: catalog.revision, author: "LemoLab", license: "MIT", changes: "STYLE.md text kept in English; demo engine sections and DEMO.md pointers removed. Loaded only when a style is selected.", assets }, null, 2) + "\n", "utf8");
console.log(`Wrote ${assets.length} style prompts (${assets.reduce((sum, a) => sum + a.chars, 0)} chars).`);
