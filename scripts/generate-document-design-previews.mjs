#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { pathToFileURL } from "node:url";

async function loadPlaywright() {
  try { return await import("playwright"); }
  catch (error) {
    const moduleRoot = process.env.PROMPTDECK_NODE_MODULES;
    if (!moduleRoot) throw error;
    return import(pathToFileURL(path.join(moduleRoot, "playwright", "index.mjs")).href);
  }
}

const { chromium } = await loadPlaywright();

const repoRoot = path.resolve(import.meta.dirname, "..");
const outputDir = path.join(repoRoot, "assets", "document-design-previews");
const source = await fs.readFile(path.join(repoRoot, "src", "document-design-catalog.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(source, context, { filename: "document-design-catalog.js" });
const themes = context.window.PromptDeckDocumentDesignCatalog.themes;

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function previewBody(theme, view, sourceImage) {
  const c = theme.palette;
  const common = `--p:${c.primary};--s:${c.secondary};--a:${c.accent};--bg:${c.background};--surface:${c.surface};--text:${c.text};--muted:${c.muted};--border:${c.border};`;
  const cover = `<main class="page cover" style="${common}"><div class="rail"></div><div class="eyebrow">2026 DOCUMENT REPORT</div><h1>${escapeHtml(theme.nameKo)}</h1><div class="rule"></div><p>${escapeHtml(theme.description)}</p><div class="tags"><span>${escapeHtml(theme.categoryLabel)}</span><span>${escapeHtml(theme.sourceVisualStyleId)}</span></div><footer><b>PROMPTDECK</b><span>2026. 09.</span></footer></main>`;
  const chapter = `<main class="page chapter" style="${common}"><div class="chapter-field"><span>CHAPTER</span><b>02</b></div><section class="chapter-copy"><div class="eyebrow">NEXT SECTION</div><h1>실행 방향과<br>핵심 기준</h1><p>장 시작면은 본문보다 여유롭게 구성하고 다음 내용의 목적과 범위를 한눈에 안내합니다.</p><div class="chapter-points"><span>현황 진단</span><span>실행 과제</span><span>검수 기준</span></div></section><footer><b>${escapeHtml(theme.nameKo)}</b><span>02</span></footer></main>`;
  const content = `<main class="page content" style="${common}"><header><b>02 · 추진전략</b><span>${escapeHtml(theme.nameKo)}</span></header><h2>핵심 과제는 근거와 실행 주체가 함께 보이게 구성합니다</h2><section class="columns"><article><strong>핵심 메시지</strong><p>중요한 결론을 먼저 쓰고 이를 뒷받침하는 사실과 수치를 가까이 배치합니다.</p><p>페이지마다 제목, 본문, 주석의 위계를 일관되게 유지합니다.</p><aside>실행 기준과 검수 항목을 분리해 확인합니다.</aside></article><ol><li><i>1</i><div><b>현황과 문제 정의</b><span>확인된 사실 중심</span></div></li><li><i>2</i><div><b>실행 과제와 담당</b><span>주체와 기한 명시</span></div></li><li><i>3</i><div><b>일정과 점검 기준</b><span>측정 가능한 지표</span></div></li></ol></section><footer><b>PROMPTDECK</b><span>02</span></footer></main>`;
  const image = `<main class="page image-page" style="${common}"><header><b>03 · 현장과 사례</b><span>${escapeHtml(theme.nameKo)}</span></header><h2>이미지와 설명이 서로의 의미를 보완합니다</h2><section class="image-layout"><figure><img src="${sourceImage}" alt=""><figcaption><b>그림 1.</b> 핵심 장면과 근거 이미지를 넓게 보여주고 출처를 함께 표시합니다.</figcaption></figure><aside><strong>IMAGE NOTE</strong><p>주제와 직접 관련된 이미지만 사용하며 제목과 본문을 가리지 않는 안전 영역을 확보합니다.</p><dl><div><dt>초점</dt><dd>핵심 대상</dd></div><div><dt>캡션</dt><dd>의미·출처</dd></div><div><dt>배치</dt><dd>큰 화면 1개</dd></div></dl></aside></section><footer><b>출처: 프로젝트 기록 이미지</b><span>03</span></footer></main>`;
  const data = `<main class="page data" style="${common}"><header><b>03 · 핵심 성과</b><span>단위·기준일·출처 표시</span></header><h2>지원 성과가 목표 대비 안정적으로 증가했습니다</h2><section class="kpis"><article><span>지원 기업</span><b>128</b><small>전년 대비 +18%</small></article><article><span>목표 달성률</span><b>112%</b><small>목표 100%</small></article><article><span>후속 연계</span><b>46건</b><small>투자·판로 연계</small></article></section><section class="chart"><div class="axis"></div><i style="height:28%"></i><i style="height:42%"></i><i style="height:55%"></i><i style="height:67%"></i><i style="height:84%"></i><em>기준 대비 성과 추이</em></section><footer><b>출처: 사업관리시스템 · 2026.08.31.</b><span>03</span></footer></main>`;
  const special = `<main class="page special" style="${common}"><header><b>04 · 핵심 요약</b><span>${escapeHtml(theme.nameKo)}</span></header><section class="special-hero"><div><span>KEY DECISION</span><b>3</b></div><h2>다음 행동으로 이어지는<br>결론을 한 화면에 모읍니다</h2><p>특수면은 문서 유형에 따라 의사결정, 활동, 해설, 인용 또는 장면 전환으로 변주합니다.</p></section><section class="special-grid"><article><span>01</span><b>확인된 결과</b><p>핵심 결론과 근거를 연결합니다.</p></article><article><span>02</span><b>결정할 사항</b><p>선택지와 판단 기준을 보여줍니다.</p></article><article><span>03</span><b>다음 행동</b><p>담당과 시점을 분명히 합니다.</p></article></section><footer><b>PROMPTDECK · SUMMARY</b><span>04</span></footer></main>`;
  return ({ cover, chapter, content, image, data, special })[view] || content;
}

const css = `
  *{box-sizing:border-box}html,body{margin:0;width:960px;height:540px;overflow:hidden}body{display:grid;place-items:center;background:#dbe3ea;font-family:"Malgun Gothic","Segoe UI",Arial,sans-serif}.page{position:relative;width:960px;height:540px;overflow:hidden;padding:54px 66px;background:var(--bg);color:var(--text)}.rail{position:absolute;left:0;top:0;bottom:0;width:15px;background:var(--p)}.eyebrow{color:var(--a);font-size:16px;font-weight:900;letter-spacing:.12em}.cover h1{max-width:720px;margin:38px 0 0;font-size:58px;line-height:1.1;letter-spacing:-.05em}.rule{width:116px;height:8px;margin:29px 0;background:var(--a)}.cover p{max-width:650px;margin:0;color:var(--muted);font-size:22px;line-height:1.6}.tags{display:flex;gap:10px;margin-top:30px}.tags span{padding:7px 12px;border:1px solid var(--border);border-radius:999px;background:var(--surface);font-size:14px;font-weight:700}.page footer{position:absolute;left:66px;right:66px;bottom:29px;display:flex;justify-content:space-between;align-items:center;color:var(--muted);font-size:14px}.page header{display:flex;justify-content:space-between;padding-bottom:16px;border-bottom:2px solid var(--border);color:var(--muted);font-size:15px}.page header b{color:var(--p)}h2{max-width:810px;margin:27px 0 24px;font-size:32px;line-height:1.25;letter-spacing:-.035em}.chapter{padding:0}.chapter-field{position:absolute;left:0;top:0;bottom:0;width:300px;display:grid;align-content:center;padding:58px;background:var(--p);color:var(--bg)}.chapter-field span{font-size:16px;font-weight:800;letter-spacing:.18em}.chapter-field b{margin-top:18px;color:var(--a);font-size:118px;line-height:.85}.chapter-copy{margin-left:300px;padding:83px 72px}.chapter-copy h1{margin:26px 0 24px;font-size:55px;line-height:1.08;letter-spacing:-.055em}.chapter-copy p{max-width:500px;color:var(--muted);font-size:18px;line-height:1.65}.chapter-points{display:flex;gap:10px;margin-top:28px}.chapter-points span{padding:8px 13px;border:1px solid var(--border);border-radius:999px;background:var(--surface);font-size:14px;font-weight:800}.chapter footer{left:358px}.columns{display:grid;grid-template-columns:1.1fr .9fr;gap:20px}.columns article,.columns ol,.kpis article,.chart{border:1px solid var(--border);border-radius:16px;background:var(--surface)}.columns article{padding:25px}.columns article>strong{display:block;margin-bottom:14px;color:var(--p);font-size:20px}.columns p{margin:0 0 11px;color:var(--muted);font-size:16px;line-height:1.65}.columns aside{margin-top:18px;padding:13px 15px;border-left:5px solid var(--a);background:color-mix(in srgb,var(--a) 10%,var(--surface));font-size:15px;font-weight:700}.columns ol{display:grid;gap:15px;margin:0;padding:22px;list-style:none}.columns li{display:grid;grid-template-columns:42px 1fr;gap:13px;align-items:center}.columns li i{display:grid;place-items:center;width:42px;height:42px;border-radius:50%;background:var(--p);color:var(--bg);font-style:normal;font-weight:900}.columns li b,.columns li span{display:block}.columns li b{font-size:16px}.columns li span{margin-top:3px;color:var(--muted);font-size:14px}.image-layout{display:grid;grid-template-columns:1.5fr .7fr;gap:18px}.image-layout figure{margin:0;padding:10px;border:1px solid var(--border);border-radius:16px;background:var(--surface)}.image-layout img{display:block;width:100%;height:225px;border-radius:10px;object-fit:cover}.image-layout figcaption{padding:11px 4px 1px;color:var(--muted);font-size:13px;line-height:1.5}.image-layout figcaption b{color:var(--p)}.image-layout aside{padding:22px;border-radius:16px;background:var(--p);color:var(--bg)}.image-layout aside>strong{color:var(--a);font-size:14px;letter-spacing:.1em}.image-layout aside>p{margin:15px 0 18px;font-size:15px;line-height:1.55}.image-layout dl{display:grid;gap:9px;margin:0}.image-layout dl div{display:flex;justify-content:space-between;gap:10px;padding-top:8px;border-top:1px solid color-mix(in srgb,var(--bg) 35%,transparent);font-size:13px}.image-layout dt{font-weight:800}.image-layout dd{margin:0}.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.kpis article{padding:17px 19px}.kpis span,.kpis b,.kpis small{display:block}.kpis span{color:var(--muted);font-size:14px}.kpis b{margin:5px 0;color:var(--p);font-size:31px}.kpis small{color:var(--muted);font-size:13px}.chart{position:relative;display:flex;align-items:flex-end;gap:22px;height:160px;margin-top:17px;padding:51px 38px 28px}.chart i{flex:1;border-radius:8px 8px 0 0;background:var(--s)}.chart i:nth-of-type(2n){background:var(--p)}.chart i:last-of-type{background:var(--a)}.chart em{position:absolute;left:38px;top:22px;color:var(--muted);font-size:15px;font-style:normal;font-weight:800}.axis{position:absolute;left:30px;right:30px;bottom:27px;height:1px;background:var(--border)}.special-hero{display:grid;grid-template-columns:150px 1fr;gap:28px;align-items:center;margin-top:25px}.special-hero>div{display:grid;place-items:center;height:145px;border-radius:20px;background:var(--p);color:var(--bg)}.special-hero>div span{color:var(--a);font-size:13px;font-weight:900;letter-spacing:.1em}.special-hero>div b{font-size:70px;line-height:.9}.special-hero h2{margin:0;font-size:35px}.special-hero p{grid-column:2;margin:-23px 0 0;color:var(--muted);font-size:15px;line-height:1.55}.special-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:13px;margin-top:25px}.special-grid article{padding:15px 17px;border:1px solid var(--border);border-radius:14px;background:var(--surface)}.special-grid span{color:var(--a);font-size:13px;font-weight:900}.special-grid b{display:block;margin-top:5px;font-size:17px}.special-grid p{margin:5px 0 0;color:var(--muted);font-size:13px;line-height:1.4}
`;

await fs.mkdir(outputDir, { recursive: true });
let browser;
try { browser = await chromium.launch({ channel: "msedge", headless: true }); }
catch (_) { browser = await chromium.launch({ headless: true }); }

const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
try {
  for (const theme of themes) {
    const sourcePreviewPath = path.join(repoRoot, "assets", "slide-style-previews", `${theme.sourceVisualStyleId}.jpg`);
    const sourcePreview = await fs.readFile(sourcePreviewPath);
    const sourceImage = `data:image/jpeg;base64,${sourcePreview.toString("base64")}`;
    for (const view of ["cover", "chapter", "content", "image", "data", "special"]) {
      await page.setContent(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${css}</style></head><body>${previewBody(theme, view, sourceImage)}</body></html>`, { waitUntil: "load" });
      await page.screenshot({ path: path.join(outputDir, `${theme.id}-${view}.png`), type: "png" });
    }
  }
} finally {
  await browser.close();
}
console.log(`Generated ${themes.length * 6} document preview images in ${path.relative(repoRoot, outputDir)}`);
