#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const siteHost = "promptdeck.kr";
const siteOrigin = `https://${siteHost}`;
const key = "c0ffcaf8d345462bbcc8c7d3ae78acae";
const keyFilename = `indexnow-${key}.txt`;
const sourceDir = process.argv.includes("--source") ? "static-pages" : "dist-static";
const sourceRoot = path.join(repoRoot, sourceDir);
const dryRun = process.argv.includes("--dry-run");

const keyContents = (await fs.readFile(path.join(sourceRoot, keyFilename), "utf8")).trim();
if (keyContents !== key) throw new Error("IndexNow 키 파일 내용이 예상 키와 일치하지 않습니다.");

const sitemap = await fs.readFile(path.join(sourceRoot, "sitemap.xml"), "utf8");
const urls = [...sitemap.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/gu)].map((match) => match[1]);
if (!urls.length) throw new Error("sitemap.xml에서 제출할 URL을 찾지 못했습니다.");
for (const value of urls) {
  const url = new URL(value);
  if (url.hostname !== siteHost || url.protocol !== "https:") {
    throw new Error(`IndexNow 제출 범위를 벗어난 URL입니다: ${value}`);
  }
}

const payload = {
  host: siteHost,
  key,
  keyLocation: `${siteOrigin}/${keyFilename}`,
  urlList: urls,
};

if (dryRun) {
  console.log(`IndexNow dry run passed: ${urls.length} URLs, keyLocation=${payload.keyLocation}`);
  process.exit(0);
}

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  const responseText = await response.text();
  throw new Error(`IndexNow 제출 실패: HTTP ${response.status}${responseText ? ` ${responseText}` : ""}`);
}

console.log(`IndexNow submitted: ${urls.length} URLs (HTTP ${response.status})`);
console.log("제출은 검색엔진에 변경을 알리며 색인 노출을 보장하지는 않습니다.");
