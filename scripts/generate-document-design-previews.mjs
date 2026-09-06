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

function previewBody(theme, view) {
  const c = theme.palette;
  const common = `--p:${c.primary};--s:${c.secondary};--a:${c.accent};--bg:${c.background};--surface:${c.surface};--text:${c.text};--muted:${c.muted};--border:${c.border};`;
  const cover = `<main class="page cover" style="${common}"><div class="rail"></div><div class="eyebrow">2026 DOCUMENT REPORT</div><h1>${escapeHtml(theme.nameKo)}</h1><div class="rule"></div><p>${escapeHtml(theme.description)}</p><div class="tags"><span>${escapeHtml(theme.categoryLabel)}</span><span>${escapeHtml(theme.sourceVisualStyleId)}</span></div><footer><b>PROMPTDECK</b><span>2026. 09.</span></footer></main>`;
  const content = `<main class="page content" style="${common}"><header><b>02 · 추진전략</b><span>${escapeHtml(theme.nameKo)}</span></header><h2>핵심 과제는 근거와 실행 주체가 함께 보이게 구성합니다</h2><section class="columns"><article><strong>핵심 메시지</strong><p>중요한 결론을 먼저 쓰고 이를 뒷받침하는 사실과 수치를 가까이 배치합니다.</p><p>페이지마다 제목, 본문, 주석의 위계를 일관되게 유지합니다.</p><aside>실행 기준과 검수 항목을 분리해 확인합니다.</aside></article><ol><li><i>1</i><div><b>현황과 문제 정의</b><span>확인된 사실 중심</span></div></li><li><i>2</i><div><b>실행 과제와 담당</b><span>주체와 기한 명시</span></div></li><li><i>3</i><div><b>일정과 점검 기준</b><span>측정 가능한 지표</span></div></li></ol></section><footer><b>PROMPTDECK</b><span>02</span></footer></main>`;
  const data = `<main class="page data" style="${common}"><header><b>03 · 핵심 성과</b><span>단위·기준일·출처 표시</span></header><h2>지원 성과가 목표 대비 안정적으로 증가했습니다</h2><section class="kpis"><article><span>지원 기업</span><b>128</b><small>전년 대비 +18%</small></article><article><span>목표 달성률</span><b>112%</b><small>목표 100%</small></article><article><span>후속 연계</span><b>46건</b><small>투자·판로 연계</small></article></section><section class="chart"><div class="axis"></div><i style="height:28%"></i><i style="height:42%"></i><i style="height:55%"></i><i style="height:67%"></i><i style="height:84%"></i><em>기준 대비 성과 추이</em></section><footer><b>출처: 사업관리시스템 · 2026.08.31.</b><span>03</span></footer></main>`;
  return view === "cover" ? cover : view === "content" ? content : data;
}

const css = `
  *{box-sizing:border-box}html,body{margin:0;width:960px;height:540px;overflow:hidden}body{display:grid;place-items:center;background:#dbe3ea;font-family:"Malgun Gothic","Segoe UI",Arial,sans-serif}.page{position:relative;width:960px;height:540px;overflow:hidden;padding:54px 66px;background:var(--bg);color:var(--text)}.rail{position:absolute;left:0;top:0;bottom:0;width:15px;background:var(--p)}.eyebrow{color:var(--a);font-size:16px;font-weight:900;letter-spacing:.12em}.cover h1{max-width:720px;margin:38px 0 0;font-size:58px;line-height:1.1;letter-spacing:-.05em}.rule{width:116px;height:8px;margin:29px 0;background:var(--a)}.cover p{max-width:650px;margin:0;color:var(--muted);font-size:22px;line-height:1.6}.tags{display:flex;gap:10px;margin-top:30px}.tags span{padding:7px 12px;border:1px solid var(--border);border-radius:999px;background:var(--surface);font-size:14px;font-weight:700}.page footer{position:absolute;left:66px;right:66px;bottom:29px;display:flex;justify-content:space-between;align-items:center;color:var(--muted);font-size:14px}.page header{display:flex;justify-content:space-between;padding-bottom:16px;border-bottom:2px solid var(--border);color:var(--muted);font-size:15px}.page header b{color:var(--p)}h2{max-width:810px;margin:27px 0 24px;font-size:32px;line-height:1.25;letter-spacing:-.035em}.columns{display:grid;grid-template-columns:1.1fr .9fr;gap:20px}.columns article,.columns ol,.kpis article,.chart{border:1px solid var(--border);border-radius:16px;background:var(--surface)}.columns article{padding:25px}.columns article>strong{display:block;margin-bottom:14px;color:var(--p);font-size:20px}.columns p{margin:0 0 11px;color:var(--muted);font-size:16px;line-height:1.65}.columns aside{margin-top:18px;padding:13px 15px;border-left:5px solid var(--a);background:color-mix(in srgb,var(--a) 10%,var(--surface));font-size:15px;font-weight:700}.columns ol{display:grid;gap:15px;margin:0;padding:22px;list-style:none}.columns li{display:grid;grid-template-columns:42px 1fr;gap:13px;align-items:center}.columns li i{display:grid;place-items:center;width:42px;height:42px;border-radius:50%;background:var(--p);color:var(--bg);font-style:normal;font-weight:900}.columns li b,.columns li span{display:block}.columns li b{font-size:16px}.columns li span{margin-top:3px;color:var(--muted);font-size:14px}.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.kpis article{padding:17px 19px}.kpis span,.kpis b,.kpis small{display:block}.kpis span{color:var(--muted);font-size:14px}.kpis b{margin:5px 0;color:var(--p);font-size:31px}.kpis small{color:var(--muted);font-size:13px}.chart{position:relative;display:flex;align-items:flex-end;gap:22px;height:160px;margin-top:17px;padding:51px 38px 28px}.chart i{flex:1;border-radius:8px 8px 0 0;background:var(--s)}.chart i:nth-of-type(2n){background:var(--p)}.chart i:last-of-type{background:var(--a)}.chart em{position:absolute;left:38px;top:22px;color:var(--muted);font-size:15px;font-style:normal;font-weight:800}.axis{position:absolute;left:30px;right:30px;bottom:27px;height:1px;background:var(--border)}
`;

await fs.mkdir(outputDir, { recursive: true });
let browser;
try { browser = await chromium.launch({ channel: "msedge", headless: true }); }
catch (_) { browser = await chromium.launch({ headless: true }); }

const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
try {
  for (const theme of themes) {
    for (const view of ["cover", "content", "data"]) {
      await page.setContent(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${css}</style></head><body>${previewBody(theme, view)}</body></html>`, { waitUntil: "load" });
      await page.screenshot({ path: path.join(outputDir, `${theme.id}-${view}.png`), type: "png" });
    }
  }
} finally {
  await browser.close();
}
console.log(`Generated ${themes.length * 3} document preview images in ${path.relative(repoRoot, outputDir)}`);
