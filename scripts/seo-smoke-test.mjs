import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..", "dist-static");
const indexHtml = await fs.readFile(path.join(root, "index.html"), "utf8");
const robots = await fs.readFile(path.join(root, "robots.txt"), "utf8");
const sitemap = await fs.readFile(path.join(root, "sitemap.xml"), "utf8");
const socialCard = await fs.readFile(path.join(root, "assets", "brand", "promptdeck-social-card.png"));

assert.match(indexHtml, /<title>PromptDeck \| AI 발표자료·이미지 프롬프트 설계 도구<\/title>/u);
assert.match(indexHtml, /<link rel="canonical" href="https:\/\/promptdeck\.kr\/" \/>/u);
assert.match(indexHtml, /<meta property="og:url" content="https:\/\/promptdeck\.kr\/" \/>/u);
assert.match(indexHtml, /<meta property="og:image" content="https:\/\/promptdeck\.kr\/assets\/brand\/promptdeck-social-card\.png" \/>/u);
assert.match(indexHtml, /<meta name="twitter:card" content="summary_large_image" \/>/u);

const jsonLdMatch = indexHtml.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/u);
assert.ok(jsonLdMatch, "JSON-LD metadata is missing");
const jsonLd = JSON.parse(jsonLdMatch[1]);
const graph = Array.isArray(jsonLd["@graph"]) ? jsonLd["@graph"] : [];
assert.ok(graph.some((item) => item["@type"] === "WebSite" && item.url === "https://promptdeck.kr/"));
assert.ok(graph.some((item) => item["@type"] === "WebApplication" && item.name === "PromptDeck"));

assert.match(robots, /Sitemap: https:\/\/promptdeck\.kr\/sitemap\.xml/u);
assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/u);
assert.match(sitemap, /<loc>https:\/\/promptdeck\.kr\/<\/loc>/u);

assert.equal(socialCard.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", "social card must be PNG");
assert.equal(socialCard.readUInt32BE(16), 1200, "social card width must be 1200px");
assert.equal(socialCard.readUInt32BE(20), 630, "social card height must be 630px");

console.log("SEO smoke test passed: metadata, JSON-LD, sitemap, robots, and 1200x630 social card");
