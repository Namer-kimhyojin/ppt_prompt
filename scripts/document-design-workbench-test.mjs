#!/usr/bin/env node

import assert from "node:assert/strict";
import { createReadStream, existsSync, readFileSync, writeFileSync } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function loadPlaywright() {
  try { return await import("playwright"); }
  catch (error) {
    if (!process.env.PROMPTDECK_NODE_MODULES) throw error;
    return import(pathToFileURL(path.join(process.env.PROMPTDECK_NODE_MODULES, "playwright/index.mjs")).href);
  }
}

const { chromium } = await loadPlaywright();
const root = path.resolve(import.meta.dirname, "..");
const csp = readFileSync(path.join(root, "static-pages/_headers"), "utf8").match(/Content-Security-Policy: (.+)/)?.[1]?.trim();
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2" };
const server = http.createServer((request, response) => {
  const requested = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const filename = path.resolve(root, requested === "/" || requested === "/app" ? "index.html" : `.${requested}`);
  if (!filename.startsWith(`${root}${path.sep}`) || !existsSync(filename)) { response.writeHead(404).end("Not found"); return; }
  response.writeHead(200, { "Content-Type": mime[path.extname(filename)] || "application/octet-stream", ...(csp ? { "Content-Security-Policy": csp } : {}) });
  createReadStream(filename).pipe(response);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
let browser;

try {
  try { browser = await chromium.launch({ channel: "msedge", headless: true }); }
  catch (_) { browser = await chromium.launch({ headless: true }); }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  const documentAssets = [];
  page.on("pageerror", (error) => errors.push(error.stack || error.message));
  page.on("request", (request) => { if (/\/assets\/(?:document-design-images|fonts\/document-design)\//.test(request.url())) documentAssets.push(request.url()); });
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { waitUntil: "networkidle" });
  assert.equal(documentAssets.length, 0, `Inactive document design loaded image/font assets: ${documentAssets.join(", ")}`);
  await page.locator("#tabBtnDocumentDesign").click();
  await page.locator("#paneDocumentDesign.active .dw-bundle-card").first().waitFor();
  await page.waitForFunction(() => window.PromptDeckDocumentDesign?.getState && window.PromptDeckDocumentResolver?.resolve && window.PromptDeckDocumentRenderer?.renderPage);

  const contractCheck = await page.evaluate(() => {
    const catalog = window.PromptDeckDocumentBundles;
    const resolver = window.PromptDeckDocumentResolver;
    const contract = window.PromptDeckDocumentDesignContract;
    const resolved = resolver.resolve({});
    const state = resolved.state;
    const source = "  원문은 그대로 보존합니다.\n\n숫자 12.5% · PromptDeck\n끝 공백  ";
    const input = { ...state, sourcePrompt: source };
    const before = JSON.stringify(input);
    const built = contract.build(input);
    const designOnly = contract.build({ ...state, sourcePrompt: "" });
    return {
      families: catalog.families.length,
      bundles: catalog.bundles.length,
      pages: catalog.bundles.reduce((sum, bundle) => sum + bundle.pages.length, 0),
      uniqueIds: new Set(catalog.bundles.map((bundle) => bundle.id)).size,
      familyCounts: catalog.families.map((family) => catalog.bundles.filter((bundle) => bundle.familyId === family.id).length),
      genrePages: catalog.bundles.filter((bundle) => ["prose", "story"].includes(bundle.familyId)).every((bundle) => !bundle.pages.some((entry) => ["table", "chart"].includes(entry.kind))),
      physical: state.physicalSpec,
      schema: built.spec.schema,
      sourcePreserved: built.fullPrompt.startsWith(source),
      unchanged: before === JSON.stringify(input),
      noSourceNeeded: Boolean(designOnly.designPrompt?.trim()),
      samplesIsolated: !["지역의 다양한 주체가 함께 만나는 공간", "창문을 열자 밤새 식어 있던 공기", "2, 4, 4, 7, 8"].some((sample) => designOnly.designPrompt.includes(sample)),
      noPreviewNumbers: !/marginPx|fontPx|lineHeight|widthPx|heightPx|cellPadding|paragraphGap/.test(JSON.stringify(built.spec)),
      sourceInDesign: built.designPrompt.includes(source),
      lazyCapture: !window.html2canvas && !document.querySelector("script[data-document-capture]"),
    };
  });
  assert.equal(contractCheck.families, 6, "Six document families must be available");
  assert.equal(contractCheck.bundles, 12, "Twelve complete design bundles must be available");
  assert.equal(contractCheck.pages, 72, "The catalog must offer 72 genre-specific page models");
  assert.equal(contractCheck.uniqueIds, 12, "Bundle ids must be unique");
  assert.ok(contractCheck.familyCounts.every((count) => count === 2), "Each family must have two distinct bundles");
  assert.ok(contractCheck.genrePages, "Literary and story bundles must not force report tables/charts");
  assert.equal(contractCheck.physical.sizeId, "A4");
  assert.equal(contractCheck.physical.orientation, "portrait");
  assert.equal(contractCheck.physical.widthMm, 210);
  assert.equal(contractCheck.physical.heightMm, 297);
  assert.match(contractCheck.schema, /3\.0/, "The visual workbench must generate spec version 3");
  for (const key of ["sourcePreserved", "unchanged", "noSourceNeeded", "samplesIsolated", "noPreviewNumbers", "lazyCapture"]) assert.ok(contractCheck[key], `Contract check failed: ${key}`);
  assert.equal(contractCheck.sourceInDesign, false, "Design-only instructions must not include user source");

  const migration = await page.evaluate(() => {
    const api = window.PromptDeckDocumentMigration;
    const keys = [api.KEY, api.LEGACY_KEY];
    const originals = keys.map((key) => localStorage.getItem(key));
    const source = "  이전 작성 요청\n\n공백까지 보존  ";
    const legacy = JSON.stringify({ themeId: "public-brief", sourcePrompt: source, formats: ["HWPX", "PDF"], pageSpec: { sizeId: "A3", orientation: "landscape" }, productionSpec: { bindingId: "perfect", duplex: "duplex-long", spreadMode: "facing-pages", bleedMm: 3 }, adjustments: { colors: { accent: "#d03456" }, creativeDegrees: { pageWhitespace: "매우 여유롭게" } } });
    try {
      localStorage.removeItem(api.KEY);
      localStorage.setItem(api.LEGACY_KEY, legacy);
      const migrated = api.load();
      const preserved = localStorage.getItem(api.LEGACY_KEY) === legacy;
      const saved = localStorage.getItem(api.KEY);
      localStorage.setItem(api.KEY, "{corrupt");
      const damaged = api.load();
      return { state: migrated.state, source, notice: migrated.notice, preserved, saved: Boolean(saved), corruptRetained: localStorage.getItem(api.KEY) === "{corrupt", damagedNotice: damaged.notice, damagedBundle: damaged.state.bundleId };
    } finally {
      keys.forEach((key, index) => originals[index] === null ? localStorage.removeItem(key) : localStorage.setItem(key, originals[index]));
    }
  });
  assert.ok(migration.notice && migration.preserved && migration.saved, "Migration must save v3 and retain the untouched legacy record");
  assert.equal(migration.state.sourcePrompt, migration.source);
  assert.equal(migration.state.physicalSpec.widthMm, 420);
  assert.equal(migration.state.physicalSpec.heightMm, 297);
  assert.equal(migration.state.physicalSpec.bindingId, "perfect");
  assert.equal(migration.state.physicalSpec.bleedMm, 3);
  assert.equal(migration.state.overrides.colors.accent, "#d03456");
  assert.equal(migration.state.feel.breathing, "airy");
  assert.ok(migration.corruptRetained && migration.damagedNotice && migration.damagedBundle, "Damaged storage must recover visibly without erasing the original data");
  console.log("Workbench contract, source isolation and storage migration passed.");

  const rendering = await page.evaluate(async () => {
    const resolver = window.PromptDeckDocumentResolver;
    const renderer = window.PromptDeckDocumentRenderer;
    const initial = resolver.resolve({}).state;
    const stage = document.createElement("div");
    stage.style.cssText = "position:fixed;left:-20000px;top:0;";
    document.body.append(stage);
    async function metrics(state, id = "body") {
      const resolved = resolver.resolve(state);
      const node = renderer.renderPage(resolved.design, resolved.previewTokens, id);
      stage.replaceChildren(node);
      await renderer.ready(node);
      const content = node.querySelector("[data-dd-content]") || node;
      const firstParagraph = content.querySelector(".dd-paragraph") || content.querySelector("p");
      const heading = content.querySelector("h1,h2,h3");
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(firstParagraph || content);
      return { width: rect.width, height: rect.height, text: content.textContent, paragraphLineHeight: style.lineHeight, paragraphFont: style.fontFamily, titleFont: heading ? getComputedStyle(heading).fontFamily : "", html: content.innerHTML, tokens: resolved.previewTokens };
    }
    try {
      const compact = await metrics({ ...initial, feel: { ...initial.feel, breathing: "compact" } });
      const airy = await metrics({ ...initial, feel: { ...initial.feel, breathing: "airy" } });
      const a5 = await metrics({ ...initial, physicalSpec: { ...initial.physicalSpec, sizeId: "A5", orientation: "portrait" } });
      const landscape = await metrics({ ...initial, physicalSpec: { ...initial.physicalSpec, sizeId: "A4", orientation: "landscape" } });
      const scopedFont = await metrics({ ...initial, feel: { ...initial.feel, breathing: "compact" }, overrides: { ...initial.overrides, typographyScope: { heading: "Noto Serif KR" } } });
      const bundles = window.PromptDeckDocumentBundles.bundles;
      const all = [];
      for (const bundle of bundles) {
        const resolved = resolver.resolve({ ...initial, bundleId: bundle.id, familyId: bundle.familyId });
        const signatures = [];
        for (const definition of bundle.pages) {
          const node = renderer.renderPage(resolved.design, resolved.previewTokens, definition.id);
          stage.replaceChildren(node);
          await renderer.ready(node);
          const fragments = await renderer.paginate(node);
          let overflow = 0;
          for (const fragment of fragments) {
            stage.replaceChildren(fragment);
            await renderer.ready(fragment);
            const content = fragment.querySelector("[data-dd-content]");
            if (content) overflow = Math.max(overflow, content.scrollHeight - content.clientHeight, content.scrollWidth - content.clientWidth);
          }
          signatures.push(node.innerHTML);
          all.push({ bundle: bundle.id, page: definition.id, fragmentCount: fragments.length, overflow });
        }
        if (new Set(signatures).size !== bundle.pages.length) throw new Error(`Repeated page markup in ${bundle.id}`);
      }
      const longSamples = [];
      for (const scenario of [{ bundleId: "report-public-calm", familyId: "report", pageId: "body" }, { bundleId: "report-public-calm", familyId: "report", pageId: "table" }, { bundleId: "prose-quiet", familyId: "prose", pageId: "body" }]) {
        const resolved = resolver.resolve({ ...initial, ...scenario });
        const sample = window.PromptDeckDocumentSamples.get(scenario.familyId, true);
        const node = renderer.renderPage(resolved.design, resolved.previewTokens, scenario.pageId, sample);
        stage.replaceChildren(node);
        await renderer.ready(node);
        const paragraphText = [...node.querySelectorAll(".dd-paragraph")].map((item) => item.textContent).join("");
        const rows = [...node.querySelectorAll("tbody tr")].map((item) => item.textContent);
        const fragments = await renderer.paginate(node);
        const afterParagraphs = [];
        const afterRows = [];
        let overflow = 0;
        for (const fragment of fragments) {
          stage.replaceChildren(fragment);
          await renderer.ready(fragment);
          afterParagraphs.push(...[...fragment.querySelectorAll(".dd-paragraph")].map((item) => item.textContent));
          afterRows.push(...[...fragment.querySelectorAll("tbody tr")].map((item) => item.textContent));
          const content = fragment.querySelector("[data-dd-content]");
          overflow = Math.max(overflow, content.scrollHeight - content.clientHeight, content.scrollWidth - content.clientWidth);
        }
        longSamples.push({ ...scenario, fragments: fragments.length, paragraphsPreserved: paragraphText === afterParagraphs.join(""), rowsPreserved: JSON.stringify(rows) === JSON.stringify(afterRows), overflow });
      }
      const feelChecks = [];
      const degrees = { colorPresence: ["low", "high"], breathing: ["compact", "airy"], imagePresence: ["text", "image"], titlePresence: ["quiet", "strong"], decorationPresence: ["minimal", "rich"] };
      for (const family of window.PromptDeckDocumentBundles.families) {
        const bundle = bundles.find((entry) => entry.familyId === family.id);
        for (const [key, values] of Object.entries(degrees)) {
          const pageId = key === "breathing" ? (family.id === "proposal" ? "message" : "body") : key === "imagePresence" ? ({ learning: "diagram", exam: "data-question", story: "body" }[family.id] || "image") : key === "decorationPresence" && family.id === "prose" ? "chapter" : "cover";
          const snapshots = [];
          for (const value of values) {
            const resolved = resolver.resolve({ ...initial, bundleId: bundle.id, feel: { ...bundle.defaultFeel, [key]: value } });
            const node = renderer.renderPage(resolved.design, resolved.previewTokens, pageId);
            stage.replaceChildren(node);
            await renderer.ready(node);
            const computed = [node, ...node.querySelectorAll("*")].map((element) => {
              const style = getComputedStyle(element);
              const rect = element.getBoundingClientRect();
              return [element.tagName, ...[rect.width, rect.height, rect.left, rect.top].map((number) => Math.round(number * 100) / 100), ...["backgroundColor", "color", "borderTopWidth", "borderLeftWidth", "borderRadius", "fontSize", "fontWeight", "lineHeight", "opacity", "filter", "display"].map((property) => style[property])];
            });
            snapshots.push({ actual: JSON.stringify(computed), text: node.textContent });
          }
          feelChecks.push({ familyId: family.id, key, pageId, visiblyChanged: snapshots[0].actual !== snapshots[1].actual, sourcePreserved: snapshots[0].text === snapshots[1].text });
        }
      }
      return { compact, airy, a5, landscape, scopedFont, all, longSamples, feelChecks };
    } finally { stage.remove(); }
  });
  assert.notEqual(rendering.compact.paragraphLineHeight, rendering.airy.paragraphLineHeight, "Breathing must change the actual paragraph line height");
  assert.equal(rendering.compact.text, rendering.airy.text, "Feeling changes must preserve the sample content");
  assert.notEqual(rendering.compact.tokens.marginPx, rendering.airy.tokens.marginPx, "Breathing must change actual page spacing");
  assert.ok(Math.abs(rendering.compact.width / rendering.compact.height - 210 / 297) < .002, "A4 portrait must have exact physical ratio");
  assert.ok(Math.abs(rendering.a5.width / rendering.a5.height - 148 / 210) < .002, "A5 must have exact physical ratio");
  assert.ok(Math.abs(rendering.landscape.width / rendering.landscape.height - 297 / 210) < .002, "Landscape must reflow at the correct ratio");
  assert.notEqual(rendering.a5.width, rendering.compact.width, "Paper selection must change the layout width");
  assert.notEqual(rendering.scopedFont.titleFont, rendering.compact.titleFont, "The title font scope must update actual title typography");
  assert.equal(rendering.scopedFont.paragraphFont, rendering.compact.paragraphFont, "Changing title typography must leave the body font unchanged");
  assert.equal(rendering.all.length, 72);
  assert.ok(rendering.all.every((item) => item.fragmentCount >= 1 && item.overflow <= 2), `Page overflow after pagination: ${JSON.stringify(rendering.all.filter((item) => item.overflow > 2))}`);
  assert.ok(rendering.longSamples.every((item) => item.fragments > 1 && item.paragraphsPreserved && item.rowsPreserved && item.overflow <= 2), `Long sample pagination lost or clipped content: ${JSON.stringify(rendering.longSamples)}`);
  assert.ok(rendering.feelChecks.every((item) => item.visiblyChanged && item.sourcePreserved), `A feeling control has no actual visual effect or changed sample content: ${JSON.stringify(rendering.feelChecks.filter((item) => !item.visiblyChanged || !item.sourcePreserved))}`);
  console.log("All 72 live pages, scoped typography, physical reflow and long-sample pagination passed.");

  // Exercise the visible controls and make sure a bundle change keeps the exact paper specification.
  await page.locator('[data-action="resume"]').click();
  await page.locator("[data-feel='breathing'][value='airy']").first().locator("..").click();
  let uiState = await page.evaluate(() => window.PromptDeckDocumentDesign.getState());
  assert.equal(uiState.feel.breathing, "airy", "Visible feel control must update the saved state");
  const source = "  UI 작성 요청\n두 번째 줄  ";
  const uiCheck = await page.evaluate((text) => {
    const api = window.PromptDeckDocumentDesign;
    const before = api.getState();
    const other = window.PromptDeckDocumentBundles.bundles.find((bundle) => bundle.id !== before.bundleId);
    api.applyBundle(other.id);
    const after = api.getState();
    return { physicalPreserved: JSON.stringify(before.physicalSpec) === JSON.stringify(after.physicalSpec), bundleChanged: after.bundleId === other.id, hasPrompt: Boolean(api.build()?.designPrompt), source: text };
  }, source);
  assert.ok(uiCheck.physicalPreserved && uiCheck.bundleChanged, "Choosing a new bundle must keep paper settings");
  assert.ok(uiCheck.hasPrompt, "The UI must produce design instructions without a source request");
  const restoredId = await page.evaluate(() => window.PromptDeckDocumentDesign.getState().bundleId);
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.evaluate(() => window.PromptDeckDocumentDesign.getState().bundleId), restoredId, "Reload must restore the current bundle");
  await page.locator('[data-action="resume"]').click();

  for (const viewport of [{ width: 375, height: 667 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 1000 }]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => window.dispatchEvent(new Event("resize")));
    await page.waitForTimeout(100);
    const layout = await page.evaluate(() => {
      const pane = document.getElementById("paneDocumentDesign");
      const preview = document.getElementById("documentDesignLivePreview");
      const box = preview.getBoundingClientRect();
      return { overflow: Math.max(document.documentElement.scrollWidth - window.innerWidth, pane.scrollWidth - pane.clientWidth), previewWidth: box.width, visiblePage: Boolean(preview.querySelector(".dd-page")), width: window.innerWidth };
    });
    assert.ok(layout.overflow <= 2, `Document workbench overflows at ${viewport.width}x${viewport.height}: ${JSON.stringify(layout)}`);
    assert.ok(layout.visiblePage && layout.previewWidth > 0 && layout.previewWidth <= viewport.width, "The current live page must remain available");
    if (viewport.width === 375) {
      await page.locator('[data-action="mobile-next"]').click();
      await page.locator("#dwControlDialog[open]").waitFor();
      await page.locator("#dwMobileControls [data-feel='breathing'][value='airy']").locator("..").click();
      assert.equal(await page.evaluate(() => window.PromptDeckDocumentDesign.getState().feel.breathing), "airy", "The mobile sheet must apply the same feeling control");
      const touchSizes = await page.locator("#dwControlDialog .dw-segmented span").evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));
      assert.ok(touchSizes.every((height) => height >= 44), "Mobile feeling choices must have usable touch targets");
      await page.locator('[aria-label="느낌 조정 닫기"]').click();
      assert.equal(await page.locator("#dwControlDialog").getAttribute("open"), null, "The mobile adjustment sheet must close");
    }
  }
  console.log("Visible editing, storage restoration and mobile adjustment sheet passed.");

  const exported = await page.evaluate(async () => {
    const exporter = window.PromptDeckDocumentExport;
    if (!exporter) throw new Error("Document exporter did not load");
    const base = window.PromptDeckDocumentResolver.resolve({}).state;
    const earlyController = new AbortController();
    earlyController.abort();
    let earlyCancelled = false;
    try { await exporter.createFiles(base, { kind: "page", signal: earlyController.signal }); }
    catch (error) { earlyCancelled = error.name === "AbortError"; }
    const state = { ...base, sourcePrompt: "SECRET ORIGINAL\n  unchanged source  ", feel: { ...base.feel, breathing: "compact" } };
    const before = JSON.stringify(state);
    const files = await exporter.createFiles(state, { kind: "zip", pageIds: ["cover", "body", "table"], onProgress(message) { if (message.startsWith("저장 시작")) { state.sourcePrompt = "MUTATED SOURCE"; state.feel.breathing = "airy"; } } });
    const decoder = new TextDecoder();
    const textFiles = files.filter((file) => /\.(txt|json)$/.test(file.name));
    const spec = JSON.parse(decoder.decode(files.find((file) => file.name === "design-spec.json").data));
    const pngs = files.filter((file) => file.name.endsWith(".png")).map((file) => {
      const view = new DataView(file.data.buffer, file.data.byteOffset, file.data.byteLength);
      return { name: file.name, signature: [...file.data.slice(0, 8)], width: view.getUint32(16), height: view.getUint32(20), length: file.data.length };
    });
    const zipBytes = new Uint8Array(await window.createZip(files).arrayBuffer());
    const view = new DataView(zipBytes.buffer);
    let offset = 0;
    const zipNames = [];
    while (view.getUint32(offset, true) === 0x04034b50) {
      const size = view.getUint32(offset + 18, true);
      const nameLength = view.getUint16(offset + 26, true);
      const extraLength = view.getUint16(offset + 28, true);
      zipNames.push(decoder.decode(zipBytes.slice(offset + 30, offset + 30 + nameLength)));
      offset += 30 + nameLength + extraLength + size;
    }
    const sourceFiles = await exporter.createFiles({ ...base, sourcePrompt: "  exact source\n마지막 공백  " }, { kind: "zip", pageIds: ["body"], includeSource: true });
    const sourceFile = sourceFiles.find((file) => file.name === "source-prompt.txt");
    const chartPngs = [];
    for (const chartType of ["line", "donut"]) {
      const chartFiles = await exporter.createFiles({ ...base, overrides: { ...base.overrides, components: { chartType } } }, { kind: "page", pageIds: ["chart"] });
      chartPngs.push(chartFiles[0].data);
    }
    const canvasChartsPreserved = chartPngs[0].length !== chartPngs[1].length || chartPngs[0].some((byte, index) => byte !== chartPngs[1][index]);
    const controller = new AbortController();
    let cancelled = false;
    try {
      await exporter.createFiles(base, { kind: "zip", pageIds: ["cover", "body"], signal: controller.signal, onProgress(message) { if (message.startsWith("참고 이미지 2/")) controller.abort(); } });
    } catch (error) { cancelled = error.name === "AbortError"; }
    let failed = false;
    const originalReady = window.PromptDeckDocumentRenderer.ready;
    try {
      window.PromptDeckDocumentRenderer.ready = async () => { throw new Error("TEST_FONT_IMAGE_FAILURE"); };
      await exporter.createFiles(base, { kind: "page", pageIds: ["body"] });
    } catch (error) { failed = error.message === "TEST_FONT_IMAGE_FAILURE"; }
    finally { window.PromptDeckDocumentRenderer.ready = originalReady; }
    return { names: files.map((file) => file.name), pngs, zipNames, canvasChartsPreserved, bodyPng: [...files.find((file) => file.name.endsWith("-body.png")).data], noSourceLeak: textFiles.every((file) => !decoder.decode(file.data).includes("SECRET ORIGINAL") && !decoder.decode(file.data).includes("MUTATED SOURCE")), snapshotPreserved: JSON.stringify(spec).includes("compact") && !JSON.stringify(spec).includes('"breathing":"airy"'), exactSource: decoder.decode(sourceFile.data), earlyCancelled, cancelled, failed, cleaned: document.querySelectorAll("[data-document-export-stage], iframe.html2canvas-container").length === 0, before };
  });
  assert.ok(exported.noSourceLeak && exported.snapshotPreserved, "Export must freeze settings and exclude the source unless requested");
  assert.ok(exported.canvasChartsPreserved, "Canvas-based line and donut charts must retain their distinct content after iframe adoption and PNG capture");
  assert.equal(exported.exactSource, "  exact source\n마지막 공백  ", "Explicit source export must preserve every character");
  assert.ok(exported.earlyCancelled && exported.cancelled && exported.failed && exported.cleaned, "Cancellation and asset failure must reject without partial success or leftover DOM/iframes");
  assert.deepEqual(exported.zipNames, exported.names, "Every requested file must be present in the ZIP archive");
  assert.ok(["reference-sheet.png", "design-prompt.txt", "design-spec.json", "README.txt"].every((name) => exported.names.includes(name)), "The complete design package must include all required files");
  for (const png of exported.pngs) {
    assert.deepEqual(png.signature, [137, 80, 78, 71, 13, 10, 26, 10], `Invalid PNG: ${png.name}`);
    assert.ok(png.width > 100 && png.height > 100 && Math.max(png.width, png.height) <= 1601 && png.length > 1000, `Invalid or oversized reference image: ${JSON.stringify(png)}`);
  }
  writeFileSync(path.join(os.tmpdir(), "promptdeck-workbench-export-body.png"), Buffer.from(exported.bodyPng));
  await page.locator('.dw-steps [data-step="3"]').click();
  const [download] = await Promise.all([page.waitForEvent("download"), page.locator('[data-action="export-page"]').click()]);
  assert.equal(await download.failure(), null, "The visible PNG export button must complete a browser download");
  assert.match(download.suggestedFilename(), /\.png$/, "Current-page export must download a PNG");
  const downloaded = readFileSync(await download.path());
  assert.ok(downloaded.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), "The UI download must contain a real PNG");
  assert.equal(errors.length, 0, `Browser errors: ${errors.join(" | ")}`);
  console.log("Document design workbench passed: 12 bundles / 72 live pages, paper reflow, qualitative editing, source isolation, responsive UI, export snapshots, PNG/ZIP, cancellation and cleanup.");
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
