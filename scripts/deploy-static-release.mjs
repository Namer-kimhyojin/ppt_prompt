#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { chromium } from "playwright";

const repoRoot = path.resolve(import.meta.dirname, "..");
const distDir = path.join(repoRoot, "dist-static");
const defaults = Object.freeze({
  project: "promptdeck",
  branch: "main",
  remote: "kim",
  productionUrl: "https://promptdeck-8dh.pages.dev",
});

function printHelp() {
  console.log(`Usage: npm run release:static -- [options]

Options:
  --project=<name>          Cloudflare Pages project (default: ${defaults.project})
  --branch=<name>           Release branch (default: ${defaults.branch})
  --remote=<name>           Git remote that must contain HEAD (default: ${defaults.remote})
  --production-url=<url>    Production alias (default: ${defaults.productionUrl})
  --help                    Show this help

The script requires a clean worktree and a pushed release commit. It runs focused,
full, static, and Pages-admin tests; builds dist-static; deploys the exact HEAD;
then verifies the production and unique deployment URLs.`);
}

function parseArgs(argv) {
  const options = { ...defaults };
  for (const argument of argv) {
    if (argument === "--help" || argument === "-h") {
      printHelp();
      process.exit(0);
    }
    const [key, ...valueParts] = argument.split("=");
    const value = valueParts.join("=").trim();
    if (!value) throw new Error(`Missing value for ${key}`);
    if (key === "--project") options.project = value;
    else if (key === "--branch") options.branch = value;
    else if (key === "--remote") options.remote = value;
    else if (key === "--production-url") options.productionUrl = value.replace(/\/+$/u, "");
    else throw new Error(`Unknown option: ${key}`);
  }
  return options;
}

function findNodeCli(name) {
  const candidates = [
    process.env.npm_execpath && name === "npm" ? process.env.npm_execpath : "",
    process.env.npm_execpath ? path.join(path.dirname(process.env.npm_execpath), `${name}-cli.js`) : "",
    path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", `${name}-cli.js`),
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate)) || "";
}

const npmCli = findNodeCli("npm");
const npxCli = findNodeCli("npx");

function run(command, args, { capture = false, label = command } = {}) {
  console.log(`\n[release] ${label}`);
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    maxBuffer: 32 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    if (capture) {
      if (result.stdout) console.error(result.stdout.trim());
      if (result.stderr) console.error(result.stderr.trim());
    }
    throw new Error(`${label} failed with exit code ${result.status}`);
  }
  return capture ? String(result.stdout || "").trim() : "";
}

function runGit(args, options = {}) {
  return run("git", args, { ...options, label: `git ${args.join(" ")}` });
}

function runNpm(args, options = {}) {
  if (npmCli) return run(process.execPath, [npmCli, ...args], { ...options, label: `npm ${args.join(" ")}` });
  const command = process.platform === "win32" ? "npm.cmd" : "npm";
  return run(command, args, { ...options, label: `npm ${args.join(" ")}` });
}

function runNpx(args, options = {}) {
  if (npxCli) return run(process.execPath, [npxCli, ...args], { ...options, label: `npx ${args.join(" ")}` });
  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  return run(command, args, { ...options, label: `npx ${args.join(" ")}` });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseJsonArray(output, label) {
  const start = output.indexOf("[");
  const end = output.lastIndexOf("]");
  assert(start >= 0 && end > start, `${label} did not return a JSON array`);
  return JSON.parse(output.slice(start, end + 1));
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function releaseAssetHash(filename, buffer) {
  if (filename !== "index.html") return sha256(buffer);
  const normalizedHtml = Buffer.from(buffer)
    .toString("utf8")
    .replace(/\snonce=(?:"[^"]*"|'[^']*')/gu, "");
  return sha256(Buffer.from(normalizedHtml, "utf8"));
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function retry(label, operation, attempts = 20, delayMs = 1_500) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      console.log(`[release] ${label}: ${error.message}; waiting for propagation (${attempt}/${attempts})`);
      await sleep(delayMs);
    }
  }
  throw lastError;
}

function getDeployments(project) {
  const output = runNpx([
    "--yes",
    "wrangler",
    "pages",
    "deployment",
    "list",
    "--project-name",
    project,
    "--json",
  ], { capture: true });
  return parseJsonArray(output, "Wrangler deployment list");
}

function findDeployment(deployments, branch, head) {
  return deployments.find((deployment) => (
    deployment.Environment === "Production"
    && deployment.Branch === branch
    && head.startsWith(String(deployment.Source || ""))
  ));
}

async function verifyStaticContract() {
  const indexPath = path.join(distDir, "index.html");
  assert(existsSync(indexPath), "dist-static/index.html is missing after build");
  const html = await fs.readFile(indexPath, "utf8");
  assert(/src\/static-mode\.js(?:\?[^"']*)?/u.test(html), "Static build omitted src/static-mode.js");
  for (const forbidden of [
    "src/account-settings.js",
    "src/image-generation-client.js",
    "src/generation-queue.js",
    "src/slide-image-generation.js",
  ]) {
    assert(!html.includes(forbidden), `Static build still references server-only script: ${forbidden}`);
  }
  console.log("[release] Static script contract passed");
}

async function fetchChecked(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "cache-control": "no-cache",
      ...(options.headers || {}),
    },
  });
  return response;
}

async function verifyAssetHashes(origin, head) {
  const files = [
    "index.html",
    "src/data-diagram.js",
    "src/visual-style-contract.js",
    "src/slide-style-presets/visual-spectrum.js",
    "src/slide-style-catalog.js",
    "styles/data-diagram.css",
    "src/static-mode.js",
    "src/tabular-data.js",
    "src/label-sheet-package.js",
    "src/label-sheet.js",
    "src/label-sheet-workspace-layout.js",
    "src/label-sheet-workspace.js",
    "src/label-sheet-renderer.js",
    "src/tabs.js",
    "src/qr-batch.js",
    "src/qr-generator.js",
    "src/zip-writer.js",
    "styles/label-sheet.css",
    "styles/label-sheet-workspace.css",
    "assets/slide-style-previews/decision-memo.jpg",
    "assets/slide-style-previews/visual-spectrum-provenance.json",
  ];
  const hashes = {};
  for (const filename of files) {
    const local = await fs.readFile(path.join(distDir, ...filename.split("/")));
    const localHash = releaseAssetHash(filename, local);
    const response = await fetchChecked(`${origin}/${filename}?release=${head}`);
    assert(response.status === 200, `${origin}/${filename} returned ${response.status}`);
    const remoteHash = releaseAssetHash(filename, Buffer.from(await response.arrayBuffer()));
    assert(remoteHash === localHash, `${origin}/${filename} hash mismatch`);
    hashes[filename] = localHash;
  }
  const provenance = JSON.parse(await fs.readFile(path.join(distDir, "assets", "slide-style-previews", "visual-spectrum-provenance.json"), "utf8"));
  assert(provenance.sourceKind === "ai-image-generation" && provenance.reviewStatus === "visual-review-passed", "visual-spectrum provenance is not release-approved");
  assert(Array.isArray(provenance.assets) && provenance.assets.length === 24, "visual-spectrum provenance must contain 24 assets");
  for (const asset of provenance.assets) {
    const filename = `assets/slide-style-previews/${asset.file}`;
    const local = await fs.readFile(path.join(distDir, ...filename.split("/")));
    const localHash = sha256(local);
    assert(localHash === asset.sha256, `${filename} does not match reviewed provenance`);
    const response = await fetchChecked(`${origin}/${filename}?release=${head}`);
    assert(response.status === 200, `${origin}/${filename} returned ${response.status}`);
    const remoteHash = sha256(Buffer.from(await response.arrayBuffer()));
    assert(remoteHash === localHash, `${origin}/${filename} hash mismatch`);
    hashes[filename] = localHash;
  }
  return hashes;
}

async function verifyHttpContracts(origin) {
  let response = await fetchChecked(`${origin}/`);
  assert(response.status === 200, `${origin}/ returned ${response.status}`);
  const publicAppCsp = String(response.headers.get("content-security-policy") || "");
  const publicAppHtml = await response.text();
  const nonceMatch = publicAppCsp.match(/'nonce-([^']+)'/u);
  assert(nonceMatch && /^[a-f0-9]{32}$/u.test(nonceMatch[1]), `${origin}/ CSP omitted a valid per-response nonce`);
  assert(publicAppCsp.includes("'strict-dynamic'"), `${origin}/ CSP omitted strict-dynamic`);
  const scriptTags = publicAppHtml.match(/<script\b[^>]*>/giu) || [];
  assert(scriptTags.length > 0, `${origin}/ did not include any script tags`);
  assert(scriptTags.every((tag) => {
    const attribute = tag.match(/\snonce=(?:"([^"]+)"|'([^']+)')/iu);
    return (attribute?.[1] || attribute?.[2] || "") === nonceMatch[1];
  }), `${origin}/ did not apply its CSP nonce to every script tag`);

  response = await fetchChecked(`${origin}/admin.html`, { redirect: "manual" });
  assert(response.status === 302, `${origin}/admin.html did not redirect for an unauthenticated visitor`);
  assert(String(response.headers.get("location") || "").includes("admin=locked"), `${origin}/admin.html redirect omitted admin=locked`);

  response = await fetchChecked(`${origin}/api/admin/access`);
  assert(response.status === 200, `${origin}/api/admin/access returned ${response.status}`);
  const access = await response.json();
  assert(access && access.authenticated === false, `${origin}/api/admin/access returned an unexpected session state`);

  response = await fetchChecked(`${origin}/outputs/mixer_samples/manifest.json`);
  assert(response.status === 200, `${origin}/outputs/mixer_samples/manifest.json returned ${response.status}`);
  const manifest = await response.json();
  assert(manifest && typeof manifest === "object", `${origin} mixer manifest is invalid`);

  response = await fetchChecked(`${origin}/assets/slide-style-previews/decision-memo.jpg`);
  assert(response.status === 200, `${origin} slide-style preview asset returned ${response.status}`);

  for (const privatePath of ["/server/local-server.js", "/.env", "/static-deploy.json", "/.git/config"]) {
    response = await fetchChecked(`${origin}${privatePath}`, { redirect: "manual" });
    assert(response.status === 404, `${origin}${privatePath} should be 404 but returned ${response.status}`);
  }
}

async function verifyBrowserSurface(browser, origin, viewport, cacheToken) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const badResponses = [];
  const requestFailures = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.stack || error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
  });
  page.on("requestfailed", (request) => requestFailures.push(`${request.failure()?.errorText || "failed"} ${request.url()}`));

  try {
    await page.goto(`${origin}/?release-browser=${cacheToken}-${Date.now()}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForFunction(() => Boolean(window.PromptDeckDataDiagram && window.PromptDeckTabs), null, { timeout: 30_000 });
    assert((await page.locator("#diagramOpenSlideStyleGalleryBtn").count()) === 1, `${origin} edge still serves HTML without the full gallery control`);
    await page.evaluate(() => window.PromptDeckTabs.switchTab("dataDiagram"));
    await page.waitForSelector("#paneDataDiagram.active");
    if (viewport.width <= 720) {
      const visualStep = page.locator('[data-diagram-step="visual"]');
      if (!(await visualStep.evaluate((element) => element.classList.contains("is-open")))) {
        await visualStep.locator(".diagram-step-toggle").click();
      }
    }
    await page.locator("#diagramOpenSlideStyleGalleryBtn").scrollIntoViewIfNeeded();
    await page.locator("#diagramOpenSlideStyleGalleryBtn").click();
    await page.waitForSelector("#diagramSlideStyleDialog:not([hidden])");
    await page.waitForFunction(() => document.querySelectorAll("#diagramSlideStyleAllGrid .diagram-style-browser-card").length === 24);
    await page.waitForFunction(() => [...document.querySelectorAll("#diagramSlideStyleAllGrid img")].some((image) => image.complete && image.naturalWidth > 0));
    await page.locator("#diagramSlideStyleSearch").fill("Decision Memo");
    await page.waitForFunction(() => document.querySelectorAll('#diagramSlideStyleAllGrid [data-slide-style-id="decision-memo"]').length === 1);
    const reviewedPreview = page.locator('#diagramSlideStyleAllGrid [data-slide-style-id="decision-memo"] img');
    assert((await reviewedPreview.count()) === 1, `${origin} gallery omitted the reviewed AI preview`);
    await reviewedPreview.scrollIntoViewIfNeeded();
    await reviewedPreview.evaluate((image) => image.decode());
    const reviewedPreviewState = await reviewedPreview.evaluate((image) => ({
      loaded: image.complete && image.naturalWidth === 960 && image.naturalHeight === 540,
      revision: new URL(image.currentSrc || image.src).searchParams.get("v"),
    }));
    assert(reviewedPreviewState.loaded, `${origin} reviewed AI preview did not load at 960x540`);
    assert(reviewedPreviewState.revision === "13", `${origin} reviewed AI preview did not use revision 13`);
    const layout = await page.locator("#diagramSlideStyleDialog .diagram-style-dialog").evaluate((dialog) => {
      const body = dialog.querySelector(".diagram-style-dialog-body");
      return {
        count: window.PromptDeckVisualStyleContract?.counts?.total,
        dialogWidth: dialog.getBoundingClientRect().width,
        viewportWidth: window.innerWidth,
        bodyOverflow: body.scrollWidth > body.clientWidth + 1,
        pageOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      };
    });
    assert(layout.count === 180, `${origin} browser did not load the 180-style catalog`);
    assert(layout.dialogWidth <= layout.viewportWidth + 1, `${origin} gallery dialog overflowed ${viewport.width}px viewport`);
    assert(!layout.bodyOverflow && !layout.pageOverflow, `${origin} gallery produced horizontal overflow at ${viewport.width}px`);
    await page.locator("#diagramSlideStyleDialog [data-diagram-style-dialog-close]").last().click();
    await page.waitForSelector("#diagramSlideStyleDialog", { state: "hidden" });

    await page.evaluate(() => window.PromptDeckTabs.switchTab("labelSheet"));
    await page.waitForSelector("#paneLabelSheet.active");
    await page.waitForFunction(() => Boolean(
      window.PromptDeckLabelSheet
      && window.PromptDeckLabelSheetEngine
      && window.PromptDeckLabelSheetRenderer
      && window.PromptDeckLabelSheetPackage
      && window.PromptDeckTabularData
      && window.QRGeneratorCore
    ));
    await page.evaluate(() => {
      const goal = document.querySelector("#labelSheetOutputGoalPrompt");
      const type = document.querySelector('input[name="labelSheetIntentDocumentType"][value="meal-ticket"]');
      const duplex = document.querySelector("#labelSheetModeDuplex");
      goal.checked = true;
      goal.dispatchEvent(new Event("change", { bubbles: true }));
      type.checked = true;
      type.dispatchEvent(new Event("change", { bubbles: true }));
      duplex.checked = true;
      duplex.dispatchEvent(new Event("change", { bubbles: true }));
      document.querySelector("#labelSheetIntentSampleBtn")?.click();
    });
    await page.waitForFunction(() => document.querySelectorAll("#labelSheetRecordTableBody tr[data-record-id]").length === 8);
    await page.waitForFunction(() => document.querySelectorAll("#labelSheetPreviewSurface canvas").length === 1);
    const promptAction = viewport.width <= 720
      ? page.locator('#mobileTabActions [data-proxy-target="labelSheetGeneratePromptBtn"]')
      : page.locator('#tabActions [data-proxy-target="labelSheetGeneratePromptBtn"]');
    await promptAction.click();
    await page.waitForSelector("#labelSheetWorkspaceReviewDrawer:not([hidden])");
    await page.waitForFunction(() => document.querySelector("#labelSheetPromptPreview")?.value.includes("DEMO-MEAL-001"));
    const labelSurface = await page.evaluate(() => {
      const isVisible = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return false;
        const style = getComputedStyle(element);
        return !element.hidden && style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
      };
      const project = window.PromptDeckLabelSheet.getProject();
      const prompt = document.querySelector("#labelSheetPromptPreview")?.value || "";
      const shell = document.querySelector("#paneLabelSheet .label-sheet-shell");
      return {
        recordCount: project.records.length,
        firstId: project.records[0]?.id,
        firstNumber: project.records[0]?.number,
        documentType: project.settings.documentType,
        sequenceMode: project.settings.sequenceMode,
        qrEnabled: project.settings.qr?.enabled === true,
        qrValue: project.records[0]?.front?.qrValue,
        secondQrValue: project.records[1]?.front?.qrValue || "",
        qrCount: project.records.filter((record) => Boolean(record.front?.qrValue)).length,
        promptQrReservationCount: (prompt.match(/reserve-blank-space/g) || []).length,
        backgroundCount: project.records.filter((record) => Boolean(record.front?.backgroundAssetId)).length,
        packageVisible: isVisible("#labelSheetSavePackageBtn") && isVisible("#labelSheetExportLayersBtn"),
        aiVisible: isVisible("#labelSheetGenerateMissingBtn"),
        promptReady: prompt.includes("A4 FULL IMAGE PAGE")
          && prompt.includes("샘플교육센터 교육생 식권")
          && prompt.includes("DEMO-MEAL-001")
          && prompt.includes("reserve-blank-space")
          && !prompt.includes("https://example.kr/sample-meal/DEMO-MEAL-001"),
        promptPageCount: document.querySelectorAll("#labelSheetPromptPageSelect option").length,
        promptPageCountBottom: document.querySelectorAll("#labelSheetPromptPageSelectBottom option").length,
        promptItemCount: document.querySelectorAll("#labelSheetPromptItemSelect option").length,
        promptCycleControlsVisible: isVisible("#labelSheetCopyPromptBtn")
          && isVisible("#labelSheetCopyPromptBottomBtn")
          && isVisible("#labelSheetCopyPromptNextBtn")
          && isVisible("#labelSheetCopyPromptNextBottomBtn"),
        samplePresetCount: document.querySelectorAll("#labelSheetSamplePreset option").length,
        samplePreset: document.querySelector("#labelSheetSamplePreset")?.value || "",
        qrSourceVisible: isVisible("#labelSheetQrSource"),
        pdfVisible: isVisible("#labelSheetExportPdfBtn"),
        workspaceReady: document.querySelector("#paneLabelSheet")?.dataset.labelWorkspaceLayoutReady === "true",
        workspaceRecordCount: document.querySelectorAll("#labelSheetWorkspaceRecordList .label-sheet-workspace-record").length,
        workspaceDocumentOverflow: document.documentElement.scrollHeight > window.innerHeight + 1,
        shellOverflow: Boolean(shell && shell.scrollWidth > shell.clientWidth + 1),
        pageOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      };
    });
    assert(
      labelSurface.recordCount === 8
        && labelSurface.firstId === "DEMO-MEAL-001"
        && labelSurface.firstNumber === ""
        && labelSurface.documentType === "meal-ticket"
        && labelSurface.sequenceMode === "none",
      `${origin} label sample data is incomplete`,
    );
    assert(
      labelSurface.qrEnabled
        && labelSurface.qrValue === ""
        && labelSurface.secondQrValue === ""
        && labelSurface.qrCount === 0
        && labelSurface.promptQrReservationCount === 8,
      `${origin} label prompt QR reservation contract failed`,
    );
    assert(labelSurface.backgroundCount === 0, `${origin} prompt mode retained composited background assets`);
    assert(!labelSurface.packageVisible, `${origin} prompt mode exposed print package or layer export controls`);
    assert(!labelSurface.aiVisible, `${origin} static label surface exposed server-only AI generation`);
    assert(
      labelSurface.promptReady
        && labelSurface.promptPageCount === 2
        && labelSurface.promptPageCountBottom === 2
        && labelSurface.promptItemCount === 8
        && labelSurface.promptCycleControlsVisible
        && labelSurface.samplePresetCount === 3
        && labelSurface.samplePreset === "training-lunch"
        && !labelSurface.qrSourceVisible
        && !labelSurface.pdfVisible
        && labelSurface.workspaceReady
        && labelSurface.workspaceRecordCount === 8
        && !labelSurface.workspaceDocumentOverflow,
      `${origin} label full-image prompt separation contract failed`,
    );
    assert(!labelSurface.shellOverflow && !labelSurface.pageOverflow, `${origin} label surface overflowed ${viewport.width}px viewport`);
    await page.waitForTimeout(350);
    assert(consoleErrors.length === 0, `${origin} console errors: ${consoleErrors.join(" | ")}`);
    assert(pageErrors.length === 0, `${origin} page errors: ${pageErrors.join(" | ")}`);
    assert(badResponses.length === 0, `${origin} bad responses: ${badResponses.join(" | ")}`);
    assert(requestFailures.length === 0, `${origin} request failures: ${requestFailures.join(" | ")}`);
  } finally {
    await context.close();
  }
}

async function verifyBrowsers(origins, head) {
  let browser;
  try {
    browser = await chromium.launch({ channel: "msedge", headless: true });
  } catch {
    browser = await chromium.launch({ headless: true });
  }
  try {
    for (const origin of origins) {
      for (const viewport of [{ width: 1920, height: 1080 }, { width: 1440, height: 1000 }, { width: 1280, height: 720 }, { width: 390, height: 844 }]) {
        const label = `browser ${origin} at ${viewport.width}x${viewport.height}`;
        console.log(`[release] Verifying ${label}`);
        await retry(label, () => verifyBrowserSurface(browser, origin, viewport, head.slice(0, 12)), 8, 2_500);
      }
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const branch = runGit(["branch", "--show-current"], { capture: true });
  assert(branch === options.branch, `Release must run from ${options.branch}; current branch is ${branch || "detached HEAD"}`);
  const worktree = runGit(["status", "--porcelain=v1"], { capture: true });
  assert(!worktree, `Release requires a clean worktree:\n${worktree}`);

  runGit(["fetch", options.remote, options.branch, "--prune"]);
  const head = runGit(["rev-parse", "HEAD"], { capture: true });
  const remoteHead = runGit(["rev-parse", `${options.remote}/${options.branch}`], { capture: true });
  assert(head === remoteHead, `HEAD ${head} is not pushed to ${options.remote}/${options.branch} (${remoteHead})`);
  const commitMessage = runGit(["log", "-1", "--format=%s"], { capture: true });
  const priorDeployments = getDeployments(options.project);
  const previous = priorDeployments.find((deployment) => deployment.Environment === "Production" && deployment.Branch === options.branch);
  console.log(`[release] Releasing ${head} (${commitMessage})`);
  if (previous) console.log(`[release] Previous production: ${previous.Source} ${previous.Deployment}`);

  for (const script of ["diagram:test", "label:test", "smoke:test", "build:static", "static:test", "pages:admin:test"]) {
    runNpm(["run", script]);
  }
  await verifyStaticContract();
  const postBuildWorktree = runGit(["status", "--porcelain=v1"], { capture: true });
  assert(!postBuildWorktree, `Build changed tracked files:\n${postBuildWorktree}`);

  runNpx([
    "--yes",
    "wrangler",
    "pages",
    "deploy",
    "dist-static",
    "--project-name",
    options.project,
    "--branch",
    options.branch,
    "--commit-hash",
    head,
    "--commit-message",
    commitMessage,
    "--commit-dirty=false",
  ]);

  const deployment = await retry("Cloudflare deployment metadata", async () => {
    const match = findDeployment(getDeployments(options.project), options.branch, head);
    assert(match, `Cloudflare deployment list does not contain ${head.slice(0, 7)}`);
    return match;
  }, 12, 2_000);
  const uniqueUrl = String(deployment.Deployment || "").replace(/\/+$/u, "");
  assert(/^https:\/\//u.test(uniqueUrl), "Unique deployment URL is missing");
  const origins = [options.productionUrl, uniqueUrl];

  let hashes;
  for (const origin of origins) {
    hashes = await retry(`asset hashes at ${origin}`, () => verifyAssetHashes(origin, head));
    // Pages Functions routing can trail static-asset readiness on a fresh edge URL.
    // Keep verification bounded, but allow up to two minutes for that propagation.
    await retry(`HTTP contracts at ${origin}`, () => verifyHttpContracts(origin), 60, 2_000);
  }
  await verifyBrowsers(origins, head);

  const finalWorktree = runGit(["status", "--porcelain=v1"], { capture: true });
  assert(!finalWorktree, `Release left tracked worktree changes:\n${finalWorktree}`);
  const report = {
    head,
    commitMessage,
    project: options.project,
    branch: options.branch,
    productionUrl: options.productionUrl,
    uniqueUrl,
    previousSource: previous?.Source || null,
    previousUrl: previous?.Deployment || null,
    verifiedAssetHashes: hashes,
    verifiedViewports: ["1920x1080", "1440x1000", "1280x720", "390x844"],
  };
  console.log("\n[release] DEPLOYMENT VERIFIED");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(`\n[release] FAILED: ${error.stack || error.message}`);
  process.exitCode = 1;
});
