import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..", "dist-static");
const indexHtml = await fs.readFile(path.join(root, "index.html"), "utf8");
const appHtml = await fs.readFile(path.join(root, "app.html"), "utf8");
const aboutHtml = await fs.readFile(path.join(root, "about.html"), "utf8");
const robots = await fs.readFile(path.join(root, "robots.txt"), "utf8");
const sitemap = await fs.readFile(path.join(root, "sitemap.xml"), "utf8");
const feed = await fs.readFile(path.join(root, "feed.xml"), "utf8");
const socialCard = await fs.readFile(path.join(root, "assets", "brand", "promptdeck-social-card.png"));
const guidePaths = [
  "guides/index.html",
  "guides/ppt-slide-planner-skill.html",
  "guides/ai-presentation-prompt.html",
  "guides/data-diagram-prompt.html",
  "guides/promotion-image-prompt.html",
];

assert.match(indexHtml, /<title>PromptDeck \| 실무 시각자료 프롬프트 설계<\/title>/u);
assert.match(indexHtml, /<link rel="canonical" href="https:\/\/promptdeck\.kr\/" \/>/u);
assert.match(indexHtml, /<meta property="og:url" content="https:\/\/promptdeck\.kr\/" \/>/u);
assert.match(indexHtml, /<meta property="og:image" content="https:\/\/promptdeck\.kr\/assets\/brand\/promptdeck-social-card\.png" \/>/u);
assert.match(indexHtml, /<meta name="twitter:card" content="summary_large_image" \/>/u);
assert.match(indexHtml, /<meta name="google-site-verification" content="IvvWzu4r08gewXxdCKnimD2Bv291qwFJhojCJUS_vrs" \/>/u);
assert.match(indexHtml, /<link rel="alternate" type="application\/atom\+xml"[^>]+href="https:\/\/promptdeck\.kr\/feed\.xml" \/>/u);
assert.match(indexHtml, /href="\/app">작업 도구 열기<\/a>/u);
assert.match(indexHtml, /<h1\b[^>]*>[\s\S]*?프롬프트[\s\S]*?<\/h1>/u);
assert.doesNotMatch(indexHtml, /pagead2\.googlesyndication\.com|adsbygoogle|mainAdBand|src\/adsense\.js/u);

assert.match(appHtml, /<meta name="robots" content="noindex, follow" \/>/u);
assert.match(appHtml, /<link rel="canonical" href="https:\/\/promptdeck\.kr\/app" \/>/u);
assert.doesNotMatch(appHtml, /pagead2\.googlesyndication\.com|adsbygoogle|mainAdBand|src\/adsense\.js|src\/adsense-config\.js/u);
assert.match(aboutHtml, /<link rel="canonical" href="https:\/\/promptdeck\.kr\/about" \/>/u);

const jsonLdMatch = indexHtml.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/u);
assert.ok(jsonLdMatch, "JSON-LD metadata is missing");
const jsonLd = JSON.parse(jsonLdMatch[1]);
const graph = Array.isArray(jsonLd["@graph"]) ? jsonLd["@graph"] : [];
assert.ok(graph.some((item) => item["@type"] === "WebSite" && item.url === "https://promptdeck.kr/"));
assert.ok(graph.some((item) => item["@type"] === "WebApplication" && item.name === "PromptDeck"));

assert.match(robots, /Sitemap: https:\/\/promptdeck\.kr\/sitemap\.xml/u);
assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/u);
assert.match(sitemap, /<loc>https:\/\/promptdeck\.kr\/<\/loc>/u);

for (const guidePath of guidePaths) {
  const html = await fs.readFile(path.join(root, ...guidePath.split("/")), "utf8");
  const titles = [...html.matchAll(/<title>([^<]+)<\/title>/gu)];
  const descriptions = [...html.matchAll(/<meta name="description" content="([^"]+)" \/>/gu)];
  const headings = [...html.matchAll(/<h1(?:\s[^>]*)?>/gu)];
  assert.equal(titles.length, 1, `${guidePath} must contain one title`);
  assert.ok(titles[0][1].length <= 60, `${guidePath} title exceeds 60 characters`);
  assert.equal(descriptions.length, 1, `${guidePath} must contain one meta description`);
  assert.ok(descriptions[0][1].length <= 160, `${guidePath} description exceeds 160 characters`);
  assert.equal(headings.length, 1, `${guidePath} must contain one h1`);
  assert.match(html, /<link rel="canonical" href="https:\/\/promptdeck\.kr\/guides\//u);
  assert.match(html, /<meta property="og:image" content="https:\/\/promptdeck\.kr\/assets\/brand\/promptdeck-social-card\.png" \/>/u);
  assert.match(html, /src="\.\.\/src\/guide-share\.js"/u);
}

const guideUrls = [
  "https://promptdeck.kr/guides/",
  "https://promptdeck.kr/guides/ppt-slide-planner-skill",
  "https://promptdeck.kr/guides/ai-presentation-prompt",
  "https://promptdeck.kr/guides/data-diagram-prompt",
  "https://promptdeck.kr/guides/promotion-image-prompt",
];
for (const guideUrl of guideUrls) {
  assert.ok(sitemap.includes(`<loc>${guideUrl}</loc>`), `sitemap missing ${guideUrl}`);
  assert.ok(feed.includes(guideUrl), `feed missing ${guideUrl}`);
}

for (const [filename, canonical] of [
  ["privacy.html", "https://promptdeck.kr/privacy"],
  ["terms.html", "https://promptdeck.kr/terms"],
  ["ai-policy.html", "https://promptdeck.kr/ai-policy"],
  ["copyright-policy.html", "https://promptdeck.kr/copyright-policy"],
]) {
  const html = await fs.readFile(path.join(root, filename), "utf8");
  assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`), `${filename} canonical mismatch`);
  assert.ok(sitemap.includes(`<loc>${canonical}</loc>`), `sitemap missing ${canonical}`);
}
assert.ok(sitemap.includes("<loc>https://promptdeck.kr/about</loc>"), "sitemap missing about page");
assert.doesNotMatch(sitemap, /<loc>[^<]+\.html<\/loc>|<loc>https:\/\/promptdeck\.kr\/app<\/loc>/u);

const key = "c0ffcaf8d345462bbcc8c7d3ae78acae";
const indexNowKey = (await fs.readFile(path.join(root, `indexnow-${key}.txt`), "utf8")).trim();
assert.equal(indexNowKey, key, "IndexNow key file must contain the exact public key");

assert.equal(socialCard.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", "social card must be PNG");
assert.equal(socialCard.readUInt32BE(16), 1200, "social card width must be 1200px");
assert.equal(socialCard.readUInt32BE(20), 630, "social card height must be 630px");

console.log("SEO smoke test passed: metadata, guides, JSON-LD, sitemap, feed, IndexNow key, robots, and social card");
