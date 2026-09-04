import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import os from "node:os";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const root = process.cwd();
const server = http.createServer(async (req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const file = path.resolve(root, `.${name === "/" ? "/index.html" : name}`);
    if (!file.startsWith(root + path.sep)) throw new Error("Outside test root");
    const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp" };
    res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
    res.end(await readFile(file));
  } catch { res.statusCode = 404; res.end(); }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ channel: "msedge" });
try {
  for (const [width, height] of [[320, 568], [375, 667], [390, 844], [844, 390]]) {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.PromptDeckLabelSheet && document.querySelector("#paneLabelSheet")?.dataset.labelWorkspaceLayoutReady === "true");
    await page.locator("#tabBtnLabelSheet").evaluate((el) => el.click());
    await page.evaluate(async () => {
      const e = window.PromptDeckLabelSheetEngine;
      await window.PromptDeckLabelSheet.replaceProject(e.createDefaultProject({ records: [1, 2].map((n) => e.normalizeRecord({ id: `M-${n}`, name: `참가자 ${n}`, front_title: `티켓 ${n}`, back_body: `뒷면 ${n}` })) }));
    });
    await page.locator('[data-label-workspace-flow-step="data"]').click();
    const drawer = page.locator("#labelSheetWorkspaceDataDrawer");
    await drawer.waitFor({ state: "visible" });
    const geometry = await drawer.evaluate((el) => {
      const panel = el.querySelector(".label-sheet-workspace-drawer-panel");
      const tabs = [...el.querySelectorAll(".label-sheet-data-tabs button")].map((b) => ({ top: b.getBoundingClientRect().top, height: b.getBoundingClientRect().height }));
      return { right: panel.getBoundingClientRect().right, width: panel.clientWidth, scroll: panel.scrollWidth, tabs };
    });
    assert.ok(geometry.right <= width + 1 && geometry.scroll <= geometry.width + 1, "mobile dialog must fit horizontally");
    assert.ok(Math.max(...geometry.tabs.map((t) => t.top)) - Math.min(...geometry.tabs.map((t) => t.top)) < 2, "input modes stay on one row");
    assert.ok(geometry.tabs.every((t) => t.height >= 44), "input modes retain touch targets");
    await page.locator("#labelSheetMobileRecordSelect").scrollIntoViewIfNeeded();
    await page.locator("#labelSheetMobileRecordSelect").selectOption("1");
    const current = page.locator("#labelSheetRecordTableBody .is-mobile-record-current");
    assert.equal(await current.getAttribute("data-record-index"), "1");
    assert.equal(await page.locator("#labelSheetRecordTableBody tr:visible").count(), 1);
    await current.locator('[data-record-field="front.title"]').fill("모바일 수정");
    await page.waitForFunction(() => window.PromptDeckLabelSheet.getProjectSnapshot().records[1].front.title === "모바일 수정");
    await page.locator("#labelSheetMobileRecordMore").click();
    await current.locator('[data-record-field="back.body"]').fill("뒷면 수정\n둘째 줄");
    await current.locator('[data-record-field="data.excluded"]').check();
    await page.locator("#labelSheetMobileRecordPrev").click();
    assert.equal(await current.locator('[data-record-field="id"]').inputValue(), "M-1");
    await current.locator('[data-record-field="data.name"]').fill("첫 참가자 수정");
    assert.ok((await page.locator("#labelSheetMobileRecordSelect option").first().textContent()).includes("첫 참가자 수정"));
    await current.locator('[data-record-field="data.name"]').press("Enter");
    assert.equal(await page.locator("#labelSheetMobileRecordSelect").inputValue(), "1", "Enter reveals the next ticket before moving focus");
    assert.equal(await current.locator('[data-record-field="front.title"]').inputValue(), "모바일 수정");
    assert.equal(await current.locator('[data-record-field="back.body"]').inputValue(), "뒷면 수정\n둘째 줄");
    assert.ok(await current.locator('[data-record-field="data.excluded"]').isChecked());
    assert.equal(await page.locator("#labelSheetMobileRecordNext").isDisabled(), true);
    const sizes = await current.locator("input:not([type=checkbox]),textarea").evaluateAll((els) => els.filter((e) => e.checkVisibility()).map((e) => ({ font: parseFloat(getComputedStyle(e).fontSize), h: e.getBoundingClientRect().height })));
    assert.ok(sizes.every((s) => s.font >= 16 && s.h >= 44), "readable mobile fields with touch-sized controls");
    await page.locator("#labelSheetMobileRecordMore").click();
    await current.scrollIntoViewIfNeeded();
    if (width === 390) await page.screenshot({ path: path.join(os.tmpdir(), "label-mobile-final-data.png") });
    // Simulate the visual viewport shrinking without changing the layout viewport (software keyboard).
    await page.evaluate(() => {
      Object.defineProperty(window.visualViewport, "height", { configurable: true, get: () => 360 });
      Object.defineProperty(window.visualViewport, "offsetTop", { configurable: true, get: () => 25 });
      window.visualViewport.dispatchEvent(new Event("resize"));
    });
    await page.waitForFunction(() => Math.abs(document.querySelector("#labelSheetWorkspaceDataDrawer").getBoundingClientRect().height - 360) < 2);
    const footer = await drawer.locator(".label-sheet-workspace-drawer-footer").boundingBox();
    assert.ok(footer.y + footer.height <= 386, "footer remains above the simulated keyboard");
    await page.evaluate(() => {
      delete window.visualViewport.height;
      delete window.visualViewport.offsetTop;
      window.visualViewport.dispatchEvent(new Event("resize"));
    });
    await page.keyboard.press("Escape");
    assert.ok(await drawer.isHidden(), "Escape closes data editor");
    assert.equal(await page.locator('[data-label-workspace-flow-step="data"]').evaluate((e) => document.activeElement === e), true, "focus returns to the opener");
    await page.locator("#labelSheetWorkspaceInspectorBtn").click();
    const scope = await page.locator(".label-sheet-workspace-inspector-context .label-sheet-focus-scope button").evaluateAll((els) => els.map((e) => ({ top: e.getBoundingClientRect().top, height: e.getBoundingClientRect().height })));
    assert.ok(scope.every((s) => s.height >= 44) && Math.abs(scope[0].top - scope[1].top) < 2, "scope switch is compact and touch sized");
    await page.keyboard.press("Escape");
    await page.locator('[data-label-workspace-flow-step="output"]').click();
    assert.ok(await page.locator("#labelSheetWorkspaceReviewDrawer").isVisible(), "mobile output remains accessible");
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('[data-label-workspace-flow-step="data"]').click();
    assert.ok(await page.locator("#labelSheetMobileRecordNav").isHidden());
    assert.equal(await page.locator("#labelSheetRecordTableBody tr:visible").count(), 2, "desktop keeps the multi-row table");
    assert.deepEqual(errors, []);
    console.log(`mobile label UX ${width}x${height}: card editing, navigation, responsive layout, keyboard viewport, focus return and desktop fallback passed`);
    await page.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
