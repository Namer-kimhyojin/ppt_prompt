import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import "../src/motion-style-catalog.js";

const catalog = globalThis.PromptDeckMotionStyles;
const source = `https://raw.githubusercontent.com/lemomo-ai/lemo-opuscar/${catalog.revision}/`;
const destination = path.resolve(import.meta.dirname, "../assets/motion-style-previews");
await fs.mkdir(destination, { recursive: true });
const license = await (await fetch(`${source}LICENSE`)).text();
if (!license.includes("Copyright (c) 2026 LemoLab")) throw new Error("Unexpected license");
await fs.writeFile(path.join(destination, "LICENSE-MIT.txt"), license, "utf8");
const queue = [...catalog.styles], assets = [];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) {
    const style = queue.shift();
    const imageSource = `${source}styleboard/img/${style.id}_0.jpg`;
    const [image, text] = await Promise.all([fetch(imageSource), fetch(`${source}styles/${style.id}/STYLE.md`)]);
    if (!image.ok || !text.ok) throw new Error(`Missing source: ${style.id}`);
    const bytes = Buffer.from(await image.arrayBuffer()), styleText = await text.text();
    if (bytes[0] !== 255 || bytes[1] !== 216 || !styleText.includes("# ")) throw new Error(`Invalid source: ${style.id}`);
    await fs.writeFile(path.join(destination, `${style.id}.jpg`), bytes);
    assets.push({ id: style.id, file: `${style.id}.jpg`, imageSource, styleSource: style.reference, sha256: createHash("sha256").update(bytes).digest("hex"), styleSourceSha256: createHash("sha256").update(styleText).digest("hex"), changed: false });
  }
}));
assets.sort((a, b) => a.id.localeCompare(b.id));
await fs.writeFile(path.join(destination, "manifest.json"), JSON.stringify({ source: "https://github.com/lemomo-ai/lemo-opuscar", revision: catalog.revision, author: "LemoLab", imageLicense: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", changes: "Original still files unchanged; displayed as reference thumbnails. Korean direction notes authored by PromptDeck. No audio or video files included.", assets }, null, 2), "utf8");
await fs.writeFile(path.join(destination, "ATTRIBUTION.txt"), "Reference stills: LemoLab / Lemo-Opuscar\nSource: https://github.com/lemomo-ai/lemo-opuscar\nLicense: CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/\nOriginal image files unchanged; scaled/cropped only for gallery display.\nKorean style descriptions and planning prompts: PromptDeck.\nOriginal films, narration, characters and example storylines are reference material, not PromptDeck-generated outputs.\n", "utf8");
console.log(`Imported ${assets.length} attributed reference stills and verified their STYLE.md sources.`);
