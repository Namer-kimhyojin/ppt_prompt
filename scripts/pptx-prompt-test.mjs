import assert from "node:assert/strict";
import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { chromium } from "playwright";

const staticBuild = process.argv.includes("--static");
const root = path.resolve(import.meta.dirname, "..", staticBuild ? "dist-static" : ".");
const entry = staticBuild ? "app.html" : "index.html";
const html = fs.readFileSync(path.join(root, entry), "utf8");
const sandbox = { console }; sandbox.window = sandbox; vm.createContext(sandbox);
for (const match of html.matchAll(/<script[^>]+src="([^"?]+)(?:\?[^\"]*)?"/g)) {
  const file = match[1];
  if (file.startsWith("src/slide-style-presets/") || ["src/slide-style-catalog.js", "src/pptx-prompt-contract.js"].includes(file)) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file });
  }
}
const catalog = sandbox.PromptDeckSlideStyleCatalog, contract = sandbox.PromptDeckPptxPromptContract;
const source = "  원문 <img src=x onerror=alert(1)>\n수치: 12.5%, 예산 미확정\n끝 공백  ";
for (const style of catalog.styles) {
  const state = { ...contract.defaults(), styleId: style.id, sourceText: source, slideCount: "12", notes: false, ratio: "A4", colorOverrides: { accent: "#aa11bb" } };
  const before = JSON.stringify(state), result = contract.build(state);
  assert.equal(result.issues.length, 0, style.id);
  assert.ok(result.prompt.endsWith(source), `${style.id}: source preserved`);
  assert.ok(result.prompt.includes(style.nameKo), `${style.id}: style identity`);
  assert.ok(result.prompt.includes(style.prompt.ko), `${style.id}: style grammar`);
  for (const rule of style.distinctiveRules) assert.ok(result.prompt.includes(rule), `${style.id}: distinctive rule`);
  for (const rule of style.pptxGuidance || []) assert.ok(result.prompt.includes(rule), `${style.id}: editable style adaptation`);
  assert.match(result.prompt, /#aa11bb/);
  assert.match(result.prompt, /총 12장/);
  assert.match(result.prompt, /29\.7 × 21cm/);
  assert.match(result.prompt, /발표자 노트: 작성하지 않는다/);
  assert.match(result.prompt, /편집 가능한 차트/);
  assert.ok(!result.prompt.includes(style.previewImage), "Sample imagery must not become production content");
  assert.equal(JSON.stringify(state), before, "Build must not mutate its input or shared catalog");
}
for (const slideCount of ["0", "81", "2.5", "-1", "oops"]) assert.equal(contract.build({ slideCount }).prompt, "", `Reject invalid count ${slideCount}`);
assert.ok(contract.build({}).prompt, "Style-only workflow requires no source");
assert.equal(contract.normalize({ styleId: "missing", ratio: "__proto__", purpose: "constructor", notes: "false" }).ratio, "16:9");
assert.equal(Object.keys(contract.normalize({ colorOverrides: { primary: "red", background: "#aabbcc", evil: "#ffffff" } }).colorOverrides).length, 1);
console.log(`PASS: ${catalog.styles.length} styles preserve identity, source, color overrides and editable PPTX instructions`);
const trendStyles = catalog.list({ category: "trend-2026" });
assert.equal(trendStyles.length, 6);
assert.equal(new Set(trendStyles.map(style => style.settings.composition.grid)).size, 6, "Trend layouts must differ structurally");
for (const style of trendStyles) {
  assert.ok(style.pptxGuidance.length >= 2);
  assert.ok(catalog.list({ category: "all", query: "2026 트렌드" }).some(item => item.id === style.id));
}

const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const csp = fs.readFileSync(path.join(root, staticBuild ? "_headers" : "static-pages/_headers"), "utf8").match(/Content-Security-Policy: (.+)/)?.[1]?.trim();
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const file = path.resolve(root, pathname === "/" || pathname === "/app" ? entry : `.${pathname}`);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404).end("Not found"); return; }
  response.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream", ...(csp ? { "Content-Security-Policy": csp } : {}) });
  fs.createReadStream(file).pipe(response);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}`;
const artifacts = await fsp.mkdtemp(path.join(os.tmpdir(), "promptdeck-pptx-test-"));
let browser;
try {
  try { browser = await chromium.launch({ channel: "msedge", headless: true }); }
  catch (_) { browser = await chromium.launch({ headless: true }); }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage(), errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url, { waitUntil: "networkidle" });
  assert.equal(await page.locator("#ppStyleGrid img").count(), 0, "Inactive tab must not load its gallery");
  await page.locator("#tabBtnPptxPrompt").click();
  await page.locator("#panePptxPrompt.active .pp-style-card").first().waitFor();
  assert.equal(await page.locator(".pp-result-stack > #tabActions").count(), 1);
  assert.equal(await page.locator(".app-tabs-bar #tabActions").count(), 0);
  assert.equal(await page.locator("#ppStyleGrid .pp-style-card").count(), 12);
  await page.screenshot({ path: path.join(artifacts, "desktop-gallery.png") });
  await page.locator("#ppSearch").fill("NO-STYLE-EXISTS-86743");
  await page.locator("#ppBrowseTrends").click();
  assert.equal(await page.locator("#ppSearch").inputValue(), "", "Trend shortcut clears stale search");
  assert.equal(await page.locator("#ppCategory").inputValue(), "trend-2026");
  assert.equal(await page.locator("#ppBrowseTrends").getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator("#ppStyleGrid .pp-style-card").count(), 6);
  assert.ok(await page.locator("#ppLoadMore").isHidden());
  for (const style of trendStyles) {
    const card = page.locator(`[data-pp-style="${style.id}"]`);
    await card.scrollIntoViewIfNeeded();
    await card.locator("img").evaluate(image => image.decode());
    assert.equal(await card.locator("img").evaluate(image => image.naturalWidth), 960);
    await card.click();
    assert.equal(await page.locator("#ppSelectedName").textContent(), style.nameKo);
    for (const rule of style.pptxGuidance) assert.ok((await page.locator("#ppOutput").inputValue()).includes(rule));
  }
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: path.join(artifacts, "desktop-trends.png") });
  await page.locator("#ppCategory").selectOption("all");
  assert.equal(await page.locator("#ppBrowseTrends").getAttribute("aria-pressed"), "false");
  await page.locator("#ppLoadMore").click();
  assert.equal(await page.locator("#ppStyleGrid .pp-style-card").count(), 24);
  await page.locator("#ppSearch").fill("NO-STYLE-EXISTS-86743");
  await page.locator("#ppClearSearch").click();
  const lastStyle = catalog.styles.at(-1);
  await page.locator("#ppSearch").fill(lastStyle.nameEn);
  await page.locator(`[data-pp-style="${lastStyle.id}"]`).click();
  assert.equal(await page.locator("#ppSelectedName").textContent(), lastStyle.nameKo);
  await page.locator("#ppSearch").fill("스위스 그리드");
  await page.locator('[data-pp-style="swiss-grid"]').click();
  await page.locator("#ppRatio").selectOption("A4");
  await page.locator("#ppSlideCount").fill("12");
  await page.locator("#ppNotes").uncheck();
  await page.locator(".pp-content-details > summary").click();
  await page.locator("#ppTitle").fill("기관 성과 보고");
  await page.locator("#ppSource").fill(source);
  await page.locator(".pp-style-details > summary").click();
  await page.locator('[data-pp-color="accent"]').fill("#aa11bb");
  let expected = await page.locator("#ppOutput").inputValue();
  assert.ok(expected.endsWith(source));
  assert.match(expected, /#aa11bb/);
  assert.equal(await page.locator("#ppSource img").count(), 0);
  await page.locator("#pptxPromptCopyBtn").click();
  assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replaceAll("\r\n", "\n"), expected, "Clipboard content survives Windows line-ending conversion");
  const downloadEvent = page.waitForEvent("download");
  await page.locator("#pptxPromptDownloadBtn").click();
  const download = await downloadEvent;
  const filename = path.join(artifacts, download.suggestedFilename());
  await download.saveAs(filename);
  assert.equal(await fsp.readFile(filename, "utf8"), expected);
  await page.locator("#ppSlideCount").fill("0");
  assert.equal(await page.locator("#pptxPromptCopyBtn").isDisabled(), true);
  assert.equal(await page.locator('#tabActions [data-proxy-target="pptxPromptCopyBtn"]').isDisabled(), true);
  await page.locator("#ppSlideCount").fill("12");
  await page.locator("#pptxPromptResetBtn").click();
  assert.equal(await page.locator("#ppSource").inputValue(), "");
  await page.locator("#ppUndoReset").click();
  assert.equal(await page.locator("#ppSource").inputValue(), source);
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#panePptxPrompt.active").waitFor();
  assert.equal(await page.locator("#ppOutput").inputValue(), expected, "Reload preserves the complete result");
  await page.evaluate(() => {
    const common = window.PromptDeckCommonPrompt.getState();
    common.visualStyle.presetId = "neutral-beige-proposal";
    common.colors.accent = "#d03456";
    localStorage.setItem("promptdeck.commonPromptBuilder.v1", JSON.stringify(common));
  });
  await page.reload({ waitUntil: "networkidle" });
  const sharedBefore = await page.evaluate(() => JSON.stringify(window.PromptDeckCommonPrompt.getState()));
  await page.locator("#ppImportStyle").click();
  assert.equal(await page.locator("#ppSelectedName").textContent(), "뉴트럴 베이지 제안서");
  assert.match(await page.locator("#ppOutput").inputValue(), /#d03456/);
  assert.equal(await page.evaluate(() => JSON.stringify(window.PromptDeckCommonPrompt.getState())), sharedBefore, "Import must not change the existing slide workflow");
  assert.equal(await page.locator("#ppSource").inputValue(), source);

  for (const width of [1440, 1024, 801, 800, 720, 390, 375]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ["light", "dark"]) {
      await page.evaluate((theme) => { document.documentElement.dataset.theme = theme; }, theme);
      for (const view of ["gallery", "result"]) {
        if (width <= 800) await page.locator(`[data-pp-view="${view}"]`).click();
        const geometry = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, tabY: getComputedStyle(document.querySelector(".app-tabs")).overflowY, dockVisible: !!document.querySelector("#tabActions").getClientRects().length }));
        assert.ok(geometry.scrollWidth <= geometry.width + 1, `${width} ${theme} ${view}: page overflows`);
        assert.equal(geometry.tabY, "hidden");
        if (width <= 800) assert.equal(geometry.dockVisible, false, "Mobile uses the bottom/body actions");
      }
      if ([1440, 390].includes(width)) {
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: path.join(artifacts, `${width}-${theme}-result.png`) });
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-pp-view="gallery"]').click();
  await page.locator("#ppSearch").fill("스위스 그리드");
  await page.locator('[data-pp-style="swiss-grid"]').click();
  assert.equal(await page.locator("#pptxPromptApp").getAttribute("data-view"), "result");
  await page.locator('#mobileTabActions [data-proxy-target="pptxPromptCopyBtn"]').click();
  assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replaceAll("\r\n", "\n"), await page.locator("#ppOutput").inputValue());
  await page.evaluate(() => { Object.defineProperty(navigator.clipboard, "writeText", { configurable: true, value: async () => { throw new Error("denied"); } }); });
  await page.locator('#mobileTabActions [data-proxy-target="pptxPromptCopyBtn"]').click();
  assert.ok(await page.locator("#ppOutput").evaluate((element) => element.selectionEnd - element.selectionStart === element.value.length));
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const [tab, active] of [["tabBtnMapPrompt", "paneMapPrompt"], ["tabBtnSlideDocument", "paneSlideDocument"], ["tabBtnDocumentDesign", "paneDocumentDesign"]]) {
    await page.locator(`#${tab}`).click();
    assert.ok(await page.locator(`#${active}.active`).isVisible(), `Existing tab ${tab} still works`);
    if (tab === "tabBtnSlideDocument") assert.equal(await page.locator("#paneSlideDocument .slide-sub-tab-btn").count(), 4);
  }
  await page.evaluate(() => localStorage.setItem("promptdeck.pptxPrompt.v1", "{broken"));
  await page.goto(`${url}/app?tab=pptxPrompt`, { waitUntil: "networkidle" });
  assert.equal(await page.locator("#ppSelectedName").textContent(), "컨설팅 전략");
  assert.ok((await page.locator("#ppOutput").inputValue()).length > 1000);
  assert.deepEqual(errors, []);
  console.log("PASS: gallery/search, style import, clipboard/fallback, TXT, validation, reset/undo, reload and existing tabs");
  console.log("PASS: desktop/mobile/tablet, light/dark, action dock and horizontal overflow");
  console.log(`Screenshots and download: ${artifacts}`);
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
