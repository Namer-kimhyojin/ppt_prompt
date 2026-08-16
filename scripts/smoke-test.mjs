import fs from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const projectRoot = process.cwd();

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function log(message) {
  console.log(message);
}

function record(condition, message, failures) {
  if (!condition) failures.push(message);
}

function isIgnoredConsoleError(text) {
  return (
    text.includes("favicon.ico") ||
    text.includes("/api/") ||
    text.includes("Failed to load resource: the server responded with a status of 404") ||
    text.includes("ERR_NETWORK_ACCESS_DENIED") ||
    text.includes("ERR_BLOCKED_BY_ORB") ||
    text.includes("ERR_NO_BUFFER_SPACE")
  );
}

async function hasLocator(page, selector) {
  return (await page.locator(selector).count()) > 0;
}

async function maxAxisTickAlignmentError(page, selector) {
  return page.locator(selector).evaluateAll((inputs) => Math.max(0, ...inputs.flatMap((input) => {
    const inputBox = input.getBoundingClientRect();
    const ticks = [...input.parentElement.querySelectorAll(".cpd-axis-ticks i")];
    const thumbSize = 22;
    return ticks.map((tick, index) => {
      const tickBox = tick.getBoundingClientRect();
      const ratio = ticks.length > 1 ? index / (ticks.length - 1) : .5;
      const expected = inputBox.left + (thumbSize / 2) + ratio * (inputBox.width - thumbSize);
      return Math.abs((tickBox.left + tickBox.width / 2) - expected);
    });
  })));
}

async function auditActivePaneAccessibility(page, { tabId, theme, viewport }) {
  return page.evaluate(({ tabId: activeTabId, theme: activeTheme, viewport: activeViewport }) => {
    const pane = document.querySelector(".tab-pane.active");
    const previewSelector = [
      ".cpd-preview",
      ".cpd-component-preview",
      ".cpd-palette-card-preview",
      ".cpd-zone-preview",
      ".cpd-frame-preview",
      ".cpd-outcome-preview",
      ".cpd-slide-style-preview",
      ".mixer-preview-image-box",
      ".mixer-result-image",
      ".pt-card-visual",
      ".pt-card-generated-preview",
      ".slide-image-preview",
      ".map-outcome-art",
      ".map-preview-compact",
      ".promo-logo-preview-canvas",
      ".promo-size-preview-stage",
      ".qr-code-stage",
      ".qr-print-preview-sheet",
      ".print-label-card",
    ].join(",");
    const inactiveSelector = ":disabled,[aria-disabled='true'],.disabled,.is-disabled,.is-incompatible,[hidden]";

    const parseColor = (value) => {
      if (!value || value === "transparent") return [0, 0, 0, 0];
      const match = value.match(/rgba?\(([^)]+)\)/i);
      if (!match) return null;
      const parts = match[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
      if (parts.length < 3 || parts.slice(0, 3).some((part) => !Number.isFinite(part))) return null;
      return [parts[0], parts[1], parts[2], Number.isFinite(parts[3]) ? parts[3] : 1];
    };
    const composite = (foreground, background) => {
      const alpha = foreground[3] + background[3] * (1 - foreground[3]);
      if (!alpha) return [0, 0, 0, 0];
      return [
        (foreground[0] * foreground[3] + background[0] * background[3] * (1 - foreground[3])) / alpha,
        (foreground[1] * foreground[3] + background[1] * background[3] * (1 - foreground[3])) / alpha,
        (foreground[2] * foreground[3] + background[2] * background[3] * (1 - foreground[3])) / alpha,
        alpha,
      ];
    };
    const luminance = (color) => {
      const channel = (value) => {
        const normalized = value / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(color[0]) + 0.7152 * channel(color[1]) + 0.0722 * channel(color[2]);
    };
    const contrast = (first, second) => {
      const firstLuminance = luminance(first);
      const secondLuminance = luminance(second);
      return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
    };
    const effectiveBackground = (element) => {
      const chain = [];
      for (let current = element; current; current = current.parentElement) {
        const parsed = parseColor(getComputedStyle(current).backgroundColor);
        if (parsed) chain.unshift(parsed);
      }
      return chain.reduce((result, color) => composite(color, result), [255, 255, 255, 1]);
    };
    const backgroundCandidates = (element) => {
      for (let current = element; current; current = current.parentElement) {
        const style = getComputedStyle(current);
        if (style.backgroundImage && style.backgroundImage !== "none") {
          const matches = style.backgroundImage.match(/rgba?\([^)]+\)/gi) || [];
          const colors = matches.map(parseColor).filter(Boolean);
          if (colors.length) {
            const parentBackground = effectiveBackground(current.parentElement || document.documentElement);
            return colors.map((color) => composite(color, parentBackground));
          }
        }
        const solidBackground = parseColor(style.backgroundColor);
        if (solidBackground && solidBackground[3] >= 0.98) {
          return [effectiveBackground(element)];
        }
      }
      return [effectiveBackground(element)];
    };
    const colorRatio = (element, cssColor) => {
      const foreground = parseColor(cssColor);
      if (!foreground) return 21;
      return Math.min(...backgroundCandidates(element).map((background) => contrast(composite(foreground, background), background)));
    };
    const outsideRatio = (element, cssColor) => {
      const foreground = parseColor(cssColor);
      if (!foreground) return 21;
      const outside = effectiveBackground(element.parentElement || document.documentElement);
      return contrast(composite(foreground, outside), outside);
    };
    const isVisible = (element) => {
      if (!(element instanceof Element) || element.closest(inactiveSelector)) return false;
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) < 0.55) return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const isExcluded = (element) => (
      element.matches("img,picture,video,canvas,svg,svg *,script,style") ||
      Boolean(element.closest("[aria-hidden='true']")) ||
      Boolean(element.closest(previewSelector))
    );
    const describe = (element) => {
      if (element.id) return `#${element.id}`;
      const classes = typeof element.className === "string"
        ? element.className.trim().split(/\s+/).filter(Boolean).slice(0, 3).join(".")
        : "";
      const label = (element.getAttribute("aria-label") || element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 28);
      return `${element.tagName.toLowerCase()}${classes ? `.${classes}` : ""}${label ? `(${label})` : ""}`;
    };
    const roots = [
      document.querySelector(".app-header"),
      document.querySelector(".app-tabs-bar"),
      pane,
      document.querySelector(".mobile-tab-actions:not([hidden])"),
    ].filter(Boolean);
    const elements = [...new Set(roots.flatMap((root) => [root, ...root.querySelectorAll("*")]))];
    const textViolations = [];
    const placeholderViolations = [];
    const boundaryViolations = [];
    const selectedViolations = [];

    for (const element of elements) {
      if (!isVisible(element) || isExcluded(element)) continue;
      const style = getComputedStyle(element);
      const directText = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
      const isTextControl = element.matches("button,input,select,textarea,summary,[role='button'],[role='tab']");
      let renderedText = directText ? (element.textContent || "").trim() : "";
      if (element.matches("input,textarea")) renderedText = element.value.trim();
      if (element.matches("select")) renderedText = element.selectedOptions[0]?.textContent?.trim() || "";
      if (!directText && isTextControl && !renderedText) renderedText = (element.getAttribute("aria-label") || "").trim();
      if (renderedText) {
        const fontSize = parseFloat(style.fontSize) || 16;
        const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
        const required = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700) ? 3 : 4.5;
        const ratio = colorRatio(element, style.color);
        if (ratio + 0.01 < required) {
          textViolations.push({ selector: describe(element), ratio: Number(ratio.toFixed(2)), required });
        }
      }

      if (element.matches("input[placeholder],textarea[placeholder]") && element.getAttribute("placeholder")) {
        const ratio = colorRatio(element, getComputedStyle(element, "::placeholder").color);
        if (ratio + 0.01 < 4.5) {
          placeholderViolations.push({ selector: describe(element), ratio: Number(ratio.toFixed(2)), required: 4.5 });
        }
      }
    }

    const interactiveElements = elements.filter((element) => (
      isVisible(element) &&
      !isExcluded(element) &&
      element.matches("button,input:not([type='hidden']):not([type='checkbox']):not([type='radio']):not([type='range']):not([type='color']):not([type='file']),select,textarea,summary,[role='button'],[role='tab'],[tabindex]:not([tabindex='-1'])")
    ));
    const boundaryRatio = (element) => {
      const style = getComputedStyle(element);
      const borderWidth = Math.max(
        parseFloat(style.borderTopWidth) || 0,
        parseFloat(style.borderRightWidth) || 0,
        parseFloat(style.borderBottomWidth) || 0,
        parseFloat(style.borderLeftWidth) || 0,
      );
      const borderRatio = borderWidth > 0 && style.borderStyle !== "none" ? outsideRatio(element, style.borderColor) : 1;
      const outside = effectiveBackground(element.parentElement || document.documentElement);
      const backgroundRatio = Math.max(...backgroundCandidates(element).map((background) => contrast(background, outside)));
      return { borderWidth, borderRatio, backgroundRatio, ratio: Math.max(borderRatio, backgroundRatio) };
    };
    for (const element of interactiveElements) {
      const style = getComputedStyle(element);
      const boundary = boundaryRatio(element);
      const visuallyBounded = boundary.borderWidth > 0 || boundary.backgroundRatio > 1.1 || style.backgroundImage !== "none";
      if (visuallyBounded && boundary.ratio + 0.01 < 3) {
        boundaryViolations.push({ selector: describe(element), ratio: Number(boundary.ratio.toFixed(2)), required: 3 });
      }

      const selected = element.matches("[aria-pressed='true'],[aria-selected='true'],button.active,button.selected,[role='button'].active,[role='button'].selected");
      if (!selected) continue;
      const pseudoRatios = ["::before", "::after"].map((pseudo) => {
        const pseudoStyle = getComputedStyle(element, pseudo);
        const pseudoColor = parseColor(pseudoStyle.backgroundColor);
        if (!pseudoColor || pseudoStyle.display === "none" || Number(pseudoStyle.opacity) === 0) return 1;
        const outside = effectiveBackground(element);
        return contrast(composite(pseudoColor, outside), outside);
      });
      if (Math.max(boundary.ratio, ...pseudoRatios) + 0.01 < 3) {
        selectedViolations.push({ selector: describe(element), ratio: Number(Math.max(boundary.ratio, ...pseudoRatios).toFixed(2)), required: 3 });
      }
    }

    const regressionSelectors = {
      tabBtnCommonPrompt: [".cpd-btn.primary", ".cpd-journey-panel-head > span"],
      tabBtnFormImage: [".form-image-prompt-viewer", ".form-image-step-head b"],
      tabBtnLabelSheet: [".label-sheet-workspace-mark", ".label-sheet-workspace-mode-button.is-active"],
      tabBtnMapPrompt: [".map-readiness-badge", ".map-readiness-list li > span"],
      tabBtnDataDiagram: [".diagram-readiness-head span", ".diagram-result-tab.active"],
      tabBtnPromotion: [".promo-step-num", ".promo-stat-chip"],
      tabBtnConceptMixer: [".mixer-step-tab.active .step-num", ".mixer-pal-filter-btn.active"],
      tabBtnPhotoTransform: [".pt-field-label", ".pt-card-copy-ko"],
    };
    const regressions = (regressionSelectors[activeTabId] || []).map((selector) => {
      const element = [...document.querySelectorAll(selector)].find(isVisible);
      if (!element) return { selector, missing: true };
      const ratio = colorRatio(element, getComputedStyle(element).color);
      return {
        selector,
        ratio: Number(ratio.toFixed(2)),
        required: 4.5,
        backgroundLuminance: Number(luminance(effectiveBackground(element)).toFixed(3)),
        missing: false,
      };
    });
    const overflow = pane ? Math.max(0, pane.scrollWidth - pane.clientWidth) : 0;

    return {
      tabId: activeTabId,
      theme: activeTheme,
      viewport: activeViewport,
      textViolations,
      placeholderViolations,
      boundaryViolations,
      selectedViolations,
      regressions,
      overflow: Number(overflow.toFixed(2)),
    };
  }, { tabId, theme, viewport });
}

async function auditActivePaneFocus(page) {
  const candidate = page.locator(".tab-pane.active :is(input:not([type='hidden']):not(:disabled),textarea:not(:disabled),select:not(:disabled),button:not(:disabled),summary,[tabindex]:not([tabindex='-1'])):visible").first();
  if (!(await candidate.count())) return { missing: true };
  await candidate.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await page.waitForTimeout(250);
  const focused = page.locator(".tab-pane.active :focus").first();
  if (!(await focused.count())) return { missing: false, focused: false, visible: false, width: 0, ratio: 0, ringGuardRatio: 0, boxShadow: "none" };
  return focused.evaluate((element) => {
    const parseColor = (value) => {
      const match = value?.match(/rgba?\(([^)]+)\)/i);
      if (!match) return null;
      const parts = match[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
      return [parts[0], parts[1], parts[2], Number.isFinite(parts[3]) ? parts[3] : 1];
    };
    const channel = (value) => {
      const normalized = value / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    };
    const luminance = (color) => 0.2126 * channel(color[0]) + 0.7152 * channel(color[1]) + 0.0722 * channel(color[2]);
    const contrast = (first, second) => {
      const firstLum = luminance(first);
      const secondLum = luminance(second);
      return (Math.max(firstLum, secondLum) + 0.05) / (Math.min(firstLum, secondLum) + 0.05);
    };
    const style = getComputedStyle(element);
    const ring = parseColor(style.outlineColor);
    const guard = parseColor(style.boxShadow);
    let parent = element.parentElement;
    let background = null;
    while (parent && !background) {
      const candidateColor = parseColor(getComputedStyle(parent).backgroundColor);
      if (candidateColor && candidateColor[3] > 0.9) background = candidateColor;
      parent = parent.parentElement;
    }
    background ||= parseColor(getComputedStyle(document.body).backgroundColor) || [255, 255, 255, 1];
    const ringRatio = ring ? contrast(ring, background) : 0;
    const guardRatio = guard ? contrast(guard, background) : 0;
    return {
      missing: false,
      selector: element.id ? `#${element.id}` : element.tagName.toLowerCase(),
      focused: document.activeElement === element,
      visible: element.matches(":focus-visible"),
      width: parseFloat(style.outlineWidth) || 0,
      ratio: Number(Math.max(ringRatio, guardRatio).toFixed(2)),
      ringGuardRatio: ring && guard ? Number(contrast(ring, guard).toFixed(2)) : 0,
      boxShadow: style.boxShadow,
    };
  });
}

async function verifyQuickToggleBehavior(page, { quickFor, inputSelector, label, failures }) {
  const fieldMap = {
    "promotionBigIdea": "bigIdea",
    "promotionVisualMetaphor": "visualMetaphor"
  };
  const field = fieldMap[quickFor];
  if (field) {
    const toggleSelector = `[data-toggle-mode='${field}'][data-mode='manual']`;
    if (await hasLocator(page, toggleSelector)) {
      await page.click(toggleSelector);
      await page.waitForTimeout(50);
    }
  }

  const buttonSelector = `[data-quick-for='${quickFor}'] .btn-quick`;
  const hasButtons = await hasLocator(page, buttonSelector);
  record(hasButtons, `${label} quick preset buttons were missing`, failures);
  if (!hasButtons) return;

  const input = page.locator(inputSelector);
  await input.fill("");

  const button = page.locator(buttonSelector).first();
  const buttonText = ((await button.textContent()) || "").trim();

  await button.click();
  const afterFirstClick = (await input.inputValue()).trim();
  record(afterFirstClick.length > 0, `${label} quick button did not add a preset on first click`, failures);
  record((await button.getAttribute("aria-pressed")) === "true", `${label} quick button did not reflect the active toggle state`, failures);
  if (buttonText) {
    record(afterFirstClick.includes(buttonText), `${label} quick button did not add its preset text`, failures);
  }

  await button.click();
  const afterSecondClick = (await input.inputValue()).trim();
  record(afterSecondClick === "", `${label} quick button did not remove the preset on second click`, failures);
  record((await button.getAttribute("aria-pressed")) === "false", `${label} quick button did not clear the active toggle state`, failures);

  await button.click();
  const afterThirdClick = (await input.inputValue()).trim();
  record(afterThirdClick === afterFirstClick, `${label} quick button re-added the preset with duplicates or altered text`, failures);

  await button.click();
  const afterFourthClick = (await input.inputValue()).trim();
  record(afterFourthClick === "", `${label} quick button did not clear the preset after repeated toggles`, failures);
}

async function startStaticServer(rootDir) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const filePath = path.join(rootDir, pathname);

    if (!existsSync(filePath)) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }

    res.setHeader("Content-Type", MIME_TYPES[path.extname(filePath)] || "application/octet-stream");
    createReadStream(filePath).pipe(res);
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}

async function launchBrowser() {
  try {
    const browser = await chromium.launch({ channel: "msedge", headless: true });
    return { browser, channel: "msedge" };
  } catch (error) {
    const browser = await chromium.launch({ headless: true });
    return { browser, channel: "chromium" };
  }
}

async function runSmokeTest() {
  const failures = [];
  const consoleErrors = [];
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "promptdeck-smoke-"));
  const server = await startStaticServer(projectRoot);
  const { browser, channel } = await launchBrowser();

  log(`Smoke test browser: ${channel}`);
  log(`Smoke test server: ${server.baseUrl}`);

  try {
    const context = await browser.newContext({
      acceptDownloads: true,
      viewport: { width: 1440, height: 1200 },
    });
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: server.baseUrl });
    const page = await context.newPage();

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (!isIgnoredConsoleError(text)) {
          consoleErrors.push(`[console.${msg.type()}] ${text}`);
        }
      }
    });
    page.on("pageerror", (error) => {
      consoleErrors.push(`[pageerror] ${error.message}\nStack: ${error.stack}`);
    });
    page.on("response", (response) => {
      if (response.status() >= 400) {
        const url = response.url();
        if (
          !url.endsWith("/favicon.ico")
          && !url.includes("/api/")
          && !url.includes("/outputs/mixer_samples/")
        ) {
          consoleErrors.push(`[404/Error] ${url} returned status ${response.status()}`);
        }
      }
    });

    await page.goto(`${server.baseUrl}/index.html`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "domcontentloaded" });

    await page.waitForSelector("#paneCommonPrompt.active");
    await page.evaluate(() => {
      const legacyState = window.PromptDeckCommonPrompt.getState();
      legacyState.schemaVersion = "3.3";
      legacyState.activeStep = 1;
      delete legacyState.project.audienceRole;
      legacyState.project.audience = "실무자";
      legacyState.project.audienceLevel = "child";
      legacyState.photoComposite.mode = "conditional";
      legacyState.background.photoMode = "preferred";
      legacyState.journey = { profileId: "public", activeStage: 1, reviewedStages: ["direction"] };
      localStorage.setItem("promptdeck.commonPromptBuilder.v1", JSON.stringify(legacyState));
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("#paneCommonPrompt.active");
    const migratedGuidedState = await page.evaluate(() => window.PromptDeckCommonPrompt.getState());
    record(migratedGuidedState?.schemaVersion === "4.0" && migratedGuidedState?.activeStep === 1 && migratedGuidedState?.journey?.activeStage === 1, "Schema 3.3 migration changed the user's active visual-style section", failures);
    record(migratedGuidedState?.journey?.profileId === "inform" && migratedGuidedState?.journey?.reviewedStages?.includes("style"), "Schema 3.3 migration did not map the former outcome profile and visual-style review", failures);
    record(migratedGuidedState?.project?.audienceRole === "실행 담당자" && migratedGuidedState?.project?.audience === "" && migratedGuidedState?.project?.audienceLevel === "newcomer", "Legacy audience context did not migrate cleanly to the new MECE axes", failures);
    record(migratedGuidedState?.photoComposite?.mode === "preferred" && migratedGuidedState?.background?.photoMode === "preferred", "Legacy mixed photo levels did not normalize to one visible policy level", failures);
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("#paneCommonPrompt.active");
    record((await page.locator(".app-tab-group").count()) === 3, "Primary tools were not organized into three purpose groups", failures);
    record((await page.locator("[data-tab-group-filter]").count()) === 3, "Purpose-group switcher was incomplete", failures);
    record((await page.locator('[data-tab-group-filter="deck"]').textContent()).trim() === "슬라이드" && (await page.locator('[data-tab-group-filter="special"]').textContent()).trim() === "업무 이미지" && (await page.locator('[data-tab-group-filter="visual"]').textContent()).trim() === "일반 이미지", "Purpose-group switcher labels were incorrect", failures);
    record((await page.locator('.app-tab-group[data-tab-group="deck"] .app-tab-btn').count()) === 4 && (await page.locator('.app-tab-group[data-tab-group="deck"] .app-tab-btn').last().getAttribute("id")) === "tabBtnDesigner", "Slide-production group did not include the legacy tool at the end", failures);
    record((await page.locator('.app-tab-group[data-tab-group="special"] .app-tab-btn').count()) === 7, "Business-image group did not include the expected tools", failures);
    record((await page.locator('.app-tab-group[data-tab-group="visual"] .app-tab-btn').count()) === 3, "General-image group did not include the expected tools", failures);
    record(!(await page.locator("#paneDesigner").evaluate((element) => element.classList.contains("active"))), "Legacy designer remained the default start screen", failures);
    record((await page.locator("#workspaceState").count()) === 0, "Removed workspace status card was still rendered", failures);

    await page.setViewportSize({ width: 1366, height: 900 });
    record(await page.locator(".app-tab-group-switcher").isVisible(), "Desktop navigation did not expose the task-group switcher when tabs overflowed", failures);
    await page.click('[data-tab-group-filter="special"]');
    await page.waitForSelector("#paneFormImage.active");
    await page.waitForTimeout(250);
    const desktopActiveTabVisibility = await page.evaluate(() => {
      const tabList = document.querySelector(".app-tabs");
      const activeTab = tabList?.querySelector(".app-tab-btn.active");
      if (!tabList || !activeTab) return false;
      const listRect = tabList.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      const visibleTabs = [...tabList.querySelectorAll(".app-tab-btn")].filter((tab) => tab.getClientRects().length > 0);
      return tabRect.left >= listRect.left - 1
        && tabRect.right <= listRect.right + 1
        && visibleTabs.every((tab) => {
          const rect = tab.getBoundingClientRect();
          return rect.left >= listRect.left - 1 && rect.right <= listRect.right + 1;
        });
    });
    record(desktopActiveTabVisibility, "Desktop task-group selection did not reveal every tab in the selected group", failures);
    await page.click('[data-tab-group-filter="deck"]');
    await page.waitForSelector("#paneCommonPrompt.active");
    await page.setViewportSize({ width: 1440, height: 1200 });

    // Admin tab placement/name settings must preserve the grouped navigation structure.
    await page.evaluate(() => {
      localStorage.setItem("promptdeck_admin", JSON.stringify({
        tabOrder: ["tabBtnQrGenerator", "tabBtnCommonPrompt"],
        tabLabels: { tabBtnQrGenerator: "빠른 QR" },
        tabGroups: { tabBtnQrGenerator: "deck" },
        defaultTab: "tabBtnCommonPrompt"
      }));
      localStorage.removeItem("promptdeck.activeTab.v1");
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("#paneCommonPrompt.active");
    record((await page.locator('.app-tab-group[data-tab-group="deck"] #tabBtnQrGenerator').count()) === 1, "Admin tab placement did not move the tab into its configured group", failures);
    record((await page.locator('.app-tab-group[data-tab-group="deck"] .app-tab-btn').first().getAttribute("id")) === "tabBtnQrGenerator", "Admin tab order was not applied within the configured group", failures);
    record((await page.locator("#tabBtnQrGenerator").textContent()).trim() === "빠른 QR", "Admin tab label was not applied to the user page", failures);
    await page.click("#tabBtnQrGenerator");
    await page.waitForSelector("#paneQrGenerator.active");
    record((await page.locator("#tabBtnQrGenerator").evaluate((element) => element.closest("[data-tab-group]")?.dataset.tabGroup)) === "deck", "Moved tab did not remain in its configured group", failures);
    await page.evaluate(() => {
      localStorage.removeItem("promptdeck_admin");
      localStorage.removeItem("promptdeck.activeTab.v1");
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("#paneCommonPrompt.active");

    await page.click("#tabBtnGenerator");
    await page.waitForSelector("#paneGenerator.active");
    record(await page.evaluate(() => localStorage.getItem("promptdeck.activeTab.v1")) === "generator", "Active workspace location was not saved", failures);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("#paneGenerator.active");
    record(await page.evaluate(() => localStorage.getItem("promptdeck.activeTab.v1")) === "generator", "Saved workspace location did not persist after reload", failures);
    await page.click("#tabBtnDesigner");
    await page.waitForSelector("#paneDesigner.active");
    record(await page.locator("#paneDesigner .legacy-tool-notice").isVisible(), "Legacy designer did not explain the recommended replacement", failures);
    await page.click("#legacyGoCommonBtn");
    await page.waitForSelector("#paneCommonPrompt.active");

    // ----------------------------------------------------
    // Common Prompt Institution Preset Regression Test
    // ----------------------------------------------------
    record((await page.locator("#paneCommonPrompt .cpd-page-head").count()) === 0, "Removed common-prompt header summary was still visible", failures);
    await page.click("#tabBtnCommonPrompt");
    await page.waitForSelector("#paneCommonPrompt.active");
    record((await page.locator(".app-tabs-bar #tabActions").count()) === 0, "Quick actions were still mounted inside the tab bar", failures);
    record((await page.locator("#paneCommonPrompt .cpd-summary-inner > #tabActions").count()) === 1, "Common Prompt quick actions were not mounted at the top of the right panel", failures);
    record((await page.locator("#paneCommonPrompt .cpd-summary-inner > #cpdResults").count()) === 1, "Common Prompt preview was not kept as a sibling of the quick-action panel", failures);
    const commonPromptActionGap = await page.locator("#paneCommonPrompt .cpd-summary-inner").evaluate((element) => {
      const dock = element.querySelector(":scope > #tabActions");
      const result = element.querySelector(":scope > #cpdResults");
      if (!dock || !result) return -1;
      return Math.round(result.getBoundingClientRect().top - dock.getBoundingClientRect().bottom);
    });
    record(commonPromptActionGap === 20, `Common Prompt quick-action gap was ${commonPromptActionGap}px instead of 20px`, failures);
    const previewPanelLayout = await page.locator("#paneCommonPrompt .cpd-workspace").evaluate((workspace) => {
      const main = workspace.querySelector(".cpd-main-column").getBoundingClientRect();
      const summary = workspace.querySelector(".cpd-summary").getBoundingClientRect();
      const summaryList = workspace.querySelector(".cpd-summary-list");
      const wideRow = summaryList.querySelector(".priority-wide").getBoundingClientRect();
      return {
        summaryWidth: summary.width,
        columns: getComputedStyle(summaryList).gridTemplateColumns.split(" ").length,
        wideRowWidth: wideRow.width,
        overlap: Math.max(0, main.right - summary.left),
      };
    });
    record(previewPanelLayout.summaryWidth >= 580, `Common Prompt preview panel remained narrow at ${Math.round(previewPanelLayout.summaryWidth)}px`, failures);
    record(previewPanelLayout.columns === 2 && previewPanelLayout.wideRowWidth >= 500, "Preview summary did not separate full-width strategic rows from compact two-column settings", failures);
    record(previewPanelLayout.overlap === 0, `Common Prompt columns overlapped by ${Math.round(previewPanelLayout.overlap)}px`, failures);
    record((await page.locator("#tabActions .tab-action-direct > .btn").count()) === 3, "Quick action dock did not keep exactly three primary actions visible", failures);
    record((await page.locator("#tabActions .tab-action-more").count()) === 1, "Quick action overflow menu was not created", failures);
    const slideStyleMeta = await page.evaluate(() => {
      const styles = window.PromptDeckSlideStyleCatalog?.styles || [];
      const ids = new Set();
      const duplicates = new Set();
      for (const style of styles) {
        if (!style?.id) continue;
        if (ids.has(style.id)) duplicates.add(style.id);
        ids.add(style.id);
      }
      return {
        total: styles.length,
        unique: ids.size,
        recommended: window.PromptDeckSlideStyleCatalog?.list?.({ category: "recommended" }).length || 0,
        duplicateIds: [...duplicates],
      };
    });
    record(slideStyleMeta.total > 0, "Slide style catalog did not expose any styles", failures);
    record(
      slideStyleMeta.total === slideStyleMeta.unique,
      `Slide style catalog has duplicate style IDs: ${slideStyleMeta.duplicateIds.join(", ")}`,
      failures
    );
    const slideStylePreviewAssets = await page.evaluate(() => window.PromptDeckSlideStyleCatalog?.styles?.map((style) => style.previewImage) || []);
    record(
      slideStylePreviewAssets.length === slideStyleMeta.unique &&
      new Set(slideStylePreviewAssets).size === slideStyleMeta.unique &&
      slideStylePreviewAssets.every((assetPath) => existsSync(path.join(projectRoot, assetPath.split("?")[0]))),
      `Slide style catalog did not map every style to a unique generated preview image (${slideStyleMeta.unique} expected)`,
      failures
    );
    await page.locator('[data-journey-stage="1"]').first().click();
    record((await page.locator('#cpdJourneyPanel .cpd-slide-style-gallery').count()) === 0, "Slide style gallery still occupied the stage body instead of the modal", failures);
    record((await page.locator('.cpd-journey-header [data-action="open-slide-style-gallery"]').count()) === 1, "Common Prompt header omitted the slide style gallery button", failures);
    await page.click('.cpd-journey-header [data-action="open-slide-style-gallery"]');
    await page.waitForSelector('#cpdSlideStyleDialog .cpd-slide-style-gallery');
    record(await page.locator("#cpdSlideStyleDialog").isVisible(), "Slide style gallery did not open as a modal", failures);
    record((await page.locator("#cpdSlideStyleDialog .cpd-slide-style-workspace").count()) === 1 && (await page.locator("#cpdSlideStyleDialog .cpd-slide-style-inspector").count()) === 1, "Slide style modal did not render the fixed inspector workspace", failures);
    const slideStyleGridColumns = await page.locator("#cpdSlideStyleDialog .cpd-slide-style-grid").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length);
    record(slideStyleGridColumns === 3, `Slide style gallery did not use the compact three-column desktop grid (actual: ${slideStyleGridColumns})`, failures);
    record((await page.locator("#cpdSlideStyleDialog .cpd-slide-style-facet-panel").count()) === 1 && (await page.locator("#cpdSlideStyleDialog [data-slide-style-filter]").count()) === 6 && (await page.locator('#cpdSlideStyleDialog [data-slide-style-filter="useCase"]').count()) === 1, "Slide style workflow facet filters were not rendered", failures);
    record((await page.locator('.cpd-slide-style-card').count()) === slideStyleMeta.recommended, `Recommended slide style gallery did not show the curated set (expected ${slideStyleMeta.recommended})`, failures);
    const proposalUseCaseCount = await page.evaluate(() => window.PromptDeckSlideStyleCatalog?.list?.({ category: "all", useCase: "proposal" }).length || 0);
    await page.selectOption('[data-slide-style-filter="useCase"]', "proposal");
    const proposalUseCaseRenderedCount = await page.locator('.cpd-slide-style-card').count();
    const proposalUseCaseReportedCount = Number((await page.locator('#cpdSlideStyleDialog .cpd-slide-style-count strong').textContent()).replace(/,/g, ""));
    record(proposalUseCaseCount > 0 && proposalUseCaseReportedCount === proposalUseCaseCount && proposalUseCaseRenderedCount === Math.min(24, proposalUseCaseCount), "Proposal use-case filter did not report and render the expected presets", failures);
    await page.click('[data-action="clear-slide-style-filters"]');
    await page.selectOption('[data-slide-style-filter="workStage"]', "poc");
    record((await page.locator('.cpd-slide-style-card').count()) === 2 && (await page.locator('[data-slide-style-id="tc-poc-plan"]').count()) === 1 && (await page.locator('[data-slide-style-id="tc-poc-result-scaleup"]').count()) === 1, "PoC workflow filter did not show the two PoC presets", failures);
    const pocStylePreview = page.locator('[data-slide-style-id="tc-poc-plan"] .cpd-slide-style-preview-image');
    await pocStylePreview.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const image = document.querySelector('[data-slide-style-id="tc-poc-plan"] .cpd-slide-style-preview-image');
      return image?.complete && image.naturalWidth > 0;
    });
    const pocStylePreviewSize = await pocStylePreview.evaluate((image) => ({ width: image.naturalWidth, height: image.naturalHeight }));
    record(pocStylePreviewSize.width === 960 && pocStylePreviewSize.height === 540, "PoC generated preview did not load at the expected 960x540 source size", failures);
    await page.click('[data-action="clear-slide-style-filters"]');
    await page.click('[data-slide-style-category="proposal-planning"]');
    record((await page.locator('.cpd-slide-style-card').count()) === 24 && (await page.locator('[data-slide-style-id="annual-business-plan"]').count()) === 1 && (await page.locator('[data-slide-style-id="monitoring-evaluation-plan"]').count()) === 1, "Proposal and planning category did not show all 24 presets", failures);
    const annualPlanPreview = page.locator('[data-slide-style-id="annual-business-plan"] .cpd-slide-style-preview-image');
    await annualPlanPreview.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const image = document.querySelector('[data-slide-style-id="annual-business-plan"] .cpd-slide-style-preview-image');
      return image?.complete && image.naturalWidth > 0;
    });
    const annualPlanPreviewSize = await annualPlanPreview.evaluate((image) => ({ width: image.naturalWidth, height: image.naturalHeight }));
    record(annualPlanPreviewSize.width === 960 && annualPlanPreviewSize.height === 540, "Annual Business Plan preview did not load at the expected 960x540 source size", failures);
    await page.click('[data-slide-style-category="event-guidance"]');
    record((await page.locator('.cpd-slide-style-card').count()) === 12 && (await page.locator('[data-slide-style-id="event-seminar-overview"]').count()) === 1, "Event guidance category did not show the 12 event presets", failures);
    await page.selectOption('[data-slide-style-filter="workStage"]', "event-delivery");
    record((await page.locator('[data-slide-style-id="event-hands-on-workshop"]').count()) === 1 && (await page.locator('[data-slide-style-id="event-webinar-live"]').count()) === 1, "Event delivery filter did not show workshop and webinar presets", failures);
    await page.click('[data-action="clear-slide-style-filters"]');
    await page.click('[data-slide-style-category="all"]');
    record((await page.locator('[data-action="slide-style-load-more"]').count()) === 0, "Slide style gallery still rendered a manual load-more button", failures);
    for (let loadAttempt = 0; loadAttempt < 10 && await page.locator('[data-slide-style-auto-load]:not([data-complete="true"])').count(); loadAttempt += 1) {
      const previousCardCount = await page.locator(".cpd-slide-style-card").count();
      await page.locator("[data-slide-style-auto-load]").scrollIntoViewIfNeeded();
      await page.waitForFunction((count) => document.querySelectorAll(".cpd-slide-style-card").length > count || document.querySelector('[data-slide-style-auto-load]')?.dataset.complete === "true", previousCardCount);
    }
    record((await page.locator('.cpd-slide-style-card').count()) === slideStyleMeta.unique, `All slide style cards were not reachable from the gallery (expected ${slideStyleMeta.unique})`, failures);
    record((await page.locator('.cpd-slide-style-card .cpd-slide-style-preview-image').count()) === slideStyleMeta.unique, `Generated slide preview images were not rendered for every gallery card (expected ${slideStyleMeta.unique})`, failures);
    const swissStylePreview = page.locator('[data-slide-style-id="swiss-grid"] .cpd-slide-style-preview-image');
    await swissStylePreview.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const image = document.querySelector('[data-slide-style-id="swiss-grid"] .cpd-slide-style-preview-image');
      return image?.complete && image.naturalWidth > 0;
    });
    const swissStylePreviewSize = await swissStylePreview.evaluate((image) => ({ width: image.naturalWidth, height: image.naturalHeight }));
    record(swissStylePreviewSize.width === 960 && swissStylePreviewSize.height === 540, "Swiss Grid optimized preview did not load at the expected 960x540 source size", failures);
    await page.evaluate(() => { window.__cpdSlideStyleGridBeforeSelection = document.querySelector("#cpdSlideStyleDialog .cpd-slide-style-grid"); });
    await page.click('[data-slide-style-id="consulting-strategy"]');
    record(await page.locator('.cpd-slide-style-draft').isVisible(), "Slide style selection did not open the application preview", failures);
    record((await page.locator("#cpdSlideStyleDialog .cpd-slide-style-inspector.has-selection .cpd-slide-style-draft").count()) === 1 && (await page.locator("#cpdSlideStyleDialog .cpd-slide-style-browser > .cpd-slide-style-draft").count()) === 0, "Selected slide style was not kept in the fixed inspector", failures);
    const presetSlideStyleCopyPrompt = await page.locator('[data-slide-style-prompt-output]').inputValue();
    record(
      (await page.locator("#cpdSlideStyleDialog .cpd-slide-style-prompt-tool").count()) === 1 &&
      (await page.locator("[data-slide-style-prompt-palette-mode]").count()) === 2 &&
      presetSlideStyleCopyPrompt.includes("Consulting Strategy") &&
      presetSlideStyleCopyPrompt.includes("#12315B") &&
      presetSlideStyleCopyPrompt.includes("pyramid-like information hierarchy") &&
      presetSlideStyleCopyPrompt.includes("default PowerPoint theme") &&
      presetSlideStyleCopyPrompt.includes("Do not translate, paraphrase, summarize, omit, or invent any content") &&
      !/[가-힣]/.test(presetSlideStyleCopyPrompt),
      "Slide style gallery did not create a copy-ready presentation suffix from the selected style and preset colors",
      failures
    );
    await page.click('[data-slide-style-prompt-palette-mode="custom"]');
    record((await page.locator('[data-slide-style-prompt-color]:visible').count()) === 5, "Custom slide style prompt palette did not expose the five color roles", failures);
    await page.locator('[data-slide-style-prompt-color="primary"]').fill("#6D28D9");
    await page.locator('[data-slide-style-prompt-color="accent"]').fill("#F97316");
    const customSlideStyleCopyPrompt = await page.locator('[data-slide-style-prompt-output]').inputValue();
    record(customSlideStyleCopyPrompt.includes("Custom Palette") && customSlideStyleCopyPrompt.includes("primary #6D28D9") && customSlideStyleCopyPrompt.includes("accent #F97316"), "Direct color choices did not update the copy-ready slide style prompt", failures);
    await page.click('[data-action="copy-slide-style-prompt"]');
    const copiedSlideStylePrompt = await page.evaluate(() => navigator.clipboard.readText());
    record(copiedSlideStylePrompt === customSlideStyleCopyPrompt, "Slide style prompt copy action did not copy only the visible presentation suffix", failures);
    await page.click('[data-slide-style-id="data-storytelling"]');
    record(
      await page.evaluate(() => window.__cpdSlideStyleGridBeforeSelection === document.querySelector("#cpdSlideStyleDialog .cpd-slide-style-grid")) &&
      (await page.locator("#cpdSlideStyleDialog .cpd-slide-style-inspector h4").textContent()).includes("데이터 스토리텔링") &&
      (await page.locator('[data-slide-style-prompt-output]').inputValue()).includes("primary #174EA6"),
      "Slide style switching recreated the gallery grid instead of updating the selection in place",
      failures
    );
    await page.click('[data-slide-style-id="consulting-strategy"]');
    await page.evaluate(() => { delete window.__cpdSlideStyleGridBeforeSelection; });
    await page.click('[data-action="apply-slide-style-full"]');
    const appliedSlideStyleState = await page.evaluate(() => window.PromptDeckCommonPrompt?.getState?.());
    const appliedSlideStylePrompt = await page.evaluate(() => window.PromptDeckCommonPrompt?.buildPrompt?.());
    record(
      appliedSlideStyleState?.visualStyle?.presetId === "consulting-strategy" &&
      appliedSlideStyleState?.composition?.profile === "slide-style:consulting-strategy" &&
      appliedSlideStyleState?.colors?.primary === "#12315B" &&
      appliedSlideStyleState?.resources?.dataVisualization === "allow",
      "Full slide style application did not update the structured design settings",
      failures
    );
    record(appliedSlideStylePrompt.includes("Consulting Strategy") && appliedSlideStylePrompt.includes("피라미드형 정보 위계"), "Applied slide style did not reach the generated common prompt as structured guidance", failures);
    await page.click('#cpdSlideStyleDialog .cpd-dialog-close[data-action="close-slide-style-gallery"]');
    record(await page.locator("#cpdSlideStyleDialog").isHidden(), "Slide style gallery did not close from its modal close button", failures);
    await page.click('[data-choice-axis-set="visualStyle.energy"][data-choice-axis-index="4"]');
    await page.click('.cpd-journey-header [data-action="open-slide-style-gallery"]');
    record(
      (await page.locator('#cpdSlideStyleDialog .cpd-slide-style-dialog-actions > .cpd-slide-style-current').count()) === 1 &&
      (await page.locator('#cpdSlideStyleDialog .cpd-slide-style-dialog-body .cpd-slide-style-current').count()) === 0 &&
      (await page.locator('.cpd-slide-style-current').textContent()).includes("사용자 조정됨"),
      "Slide style current-state summary was not kept in the modal footer",
      failures
    );
    await page.locator('[data-slide-style-query]').fill("Apple");
    await page.click('[data-action="slide-style-search"]');
    record((await page.locator('[data-slide-style-id="product-keynote"]').count()) === 1, "Slide style aliases were not searchable", failures);
    await page.locator('[data-slide-style-query]').fill("Blueprint");
    await page.click('[data-action="slide-style-search"]');
    record((await page.locator('[data-slide-style-id="blueprint"]').count()) === 1, "Expanded slide styles were not searchable", failures);
    await page.click('[data-slide-style-id="blueprint"]');
    await page.click('[data-action="apply-slide-style-full"]');
    const expandedSlideStyleState = await page.evaluate(() => window.PromptDeckCommonPrompt?.getState?.());
    const expandedSlideStylePrompt = await page.evaluate(() => window.PromptDeckCommonPrompt?.buildPrompt?.());
    record(
      expandedSlideStyleState?.visualStyle?.presetId === "blueprint" &&
      expandedSlideStyleState?.composition?.profile === "slide-style:blueprint" &&
      expandedSlideStyleState?.colors?.background === "#07366B" &&
      expandedSlideStyleState?.resources?.photo === "exclude",
      "Expanded slide style did not apply its structured design settings",
      failures
    );
    record(expandedSlideStylePrompt.includes("Blueprint") && expandedSlideStylePrompt.includes("청색 격자"), "Expanded slide style did not reach the generated common prompt", failures);
    await page.locator('[data-slide-style-query]').fill("시스템 구성도");
    await page.click('[data-action="slide-style-search"]');
    record((await page.locator('[data-slide-style-id="system-architecture-map"]').count()) === 1, "Visual-spectrum slide styles were not searchable", failures);
    await page.click('[data-slide-style-id="system-architecture-map"]');
    await page.click('[data-action="apply-slide-style-full"]');
    const visualSpectrumStyleState = await page.evaluate(() => window.PromptDeckCommonPrompt?.getState?.());
    const visualSpectrumStylePrompt = await page.evaluate(() => window.PromptDeckCommonPrompt?.buildPrompt?.());
    record(
      visualSpectrumStyleState?.visualStyle?.presetId === "system-architecture-map" &&
      visualSpectrumStyleState?.composition?.profile === "slide-style:system-architecture-map" &&
      visualSpectrumStyleState?.colors?.background === "#081421" &&
      visualSpectrumStyleState?.resources?.diagramInfographic === "allow",
      "Visual-spectrum slide style did not apply its structured design settings",
      failures
    );
    record(visualSpectrumStylePrompt.includes("System Architecture Map") && visualSpectrumStylePrompt.includes("시스템 아키텍처 맵처럼"), "Visual-spectrum slide style did not reach the generated common prompt", failures);
    await page.locator('[data-slide-style-query]').fill("수묵화");
    await page.click('[data-action="slide-style-search"]');
    record((await page.locator('[data-slide-style-id="ink-wash-modern"]').count()) === 1, "Visual-spectrum Korean aliases were not searchable", failures);
    await page.locator('[data-slide-style-query]').fill("공공기관");
    await page.click('[data-action="slide-style-search"]');
    record((await page.locator('[data-slide-style-id="korea-public-project"]').count()) === 1, "Korean commercial slide styles were not searchable", failures);
    await page.click('[data-slide-style-id="korea-public-project"]');
    await page.click('[data-action="apply-slide-style-full"]');
    const koreaCommercialState = await page.evaluate(() => window.PromptDeckCommonPrompt?.getState?.());
    const koreaCommercialPrompt = await page.evaluate(() => window.PromptDeckCommonPrompt?.buildPrompt?.());
    record(
      koreaCommercialState?.visualStyle?.presetId === "korea-public-project" &&
      koreaCommercialState?.colors?.primary === "#0754A6" &&
      koreaCommercialState?.resources?.diagramInfographic === "allow",
      "Korean commercial slide style did not apply its structured design state",
      failures
    );
    record(koreaCommercialPrompt.includes("Korean Public Project Plan") && koreaCommercialPrompt.includes("공공기관 사업계획서"), "Korean commercial slide style did not reach the generated common prompt", failures);
    await page.locator('[data-slide-style-query]').fill("기후에너지환경부");
    await page.click('[data-action="slide-style-search"]');
    record((await page.locator('[data-slide-style-id="ministry-climate-energy-environment"]').count()) === 1, "Government ministry slide styles were not searchable", failures);
    await page.click('[data-slide-style-id="ministry-climate-energy-environment"]');
    await page.click('[data-action="apply-slide-style-full"]');
    const ministryStyleState = await page.evaluate(() => window.PromptDeckCommonPrompt?.getState?.());
    const ministryStylePrompt = await page.evaluate(() => window.PromptDeckCommonPrompt?.buildPrompt?.());
    record(
      ministryStyleState?.visualStyle?.presetId === "ministry-climate-energy-environment" &&
      ministryStyleState?.colors?.primary === "#06452B" &&
      ministryStyleState?.resources?.dataVisualization === "allow",
      "Government ministry slide style did not apply its structured design state",
      failures
    );
    record(ministryStylePrompt.includes("Climate, Energy & Environment Policy") && ministryStylePrompt.includes("기후에너지환경 정책자료"), "Government ministry slide style did not reach the generated common prompt", failures);
    await page.locator('[data-slide-style-query]').fill("기계·로봇");
    await page.click('[data-action="slide-style-search"]');
    record((await page.locator('[data-slide-style-id="industry-machinery-robotics"]').count()) === 1, "Major industry slide styles were not searchable", failures);
    await page.click('[data-slide-style-id="industry-machinery-robotics"]');
    await page.click('[data-action="apply-slide-style-full"]');
    const industryStyleState = await page.evaluate(() => window.PromptDeckCommonPrompt?.getState?.());
    const industryStylePrompt = await page.evaluate(() => window.PromptDeckCommonPrompt?.buildPrompt?.());
    record(
      industryStyleState?.visualStyle?.presetId === "industry-machinery-robotics" &&
      industryStyleState?.colors?.primary === "#F7FBFF" &&
      industryStyleState?.resources?.threeD === "allow",
      "Major industry slide style did not apply its structured design state",
      failures
    );
    record(industryStylePrompt.includes("Machinery & Robotics") && industryStylePrompt.includes("기계·로봇 산업 전략"), "Major industry slide style did not reach the generated common prompt", failures);
    await page.evaluate(() => localStorage.removeItem("promptdeck.commonPromptBuilder.v1"));
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("#paneCommonPrompt.active");
    const legacyCommonPromptJourney = (await page.locator("#cpdAccordion .cpd-accordion-item").count()) > 0;
    if (legacyCommonPromptJourney) {
    record((await page.locator("#cpdAccordion .cpd-accordion-item").count()) === 12, "Common prompt did not render the expected 12 configurable sections", failures);
    const initialSurfaceState = await page.evaluate(() => window.PromptDeckCommonPrompt?.getState?.());
    record(initialSurfaceState?.background?.zoneSeparation === 4 && initialSurfaceState?.header?.surfaceRole !== initialSurfaceState?.footer?.surfaceRole, "Default deck surfaces did not separate header, body, and footer backgrounds", failures);
    record((await page.locator("#cpdAccordion .cpd-journey-intro").count()) === 1, "Common prompt did not explain the five-step efficient journey", failures);
    record((await page.locator("#cpdAccordion > .cpd-accordion-item").count()) === 5, "Common prompt did not keep exactly five core steps visible", failures);
    record((await page.locator("#cpdAccordion .cpd-advanced-journey .cpd-accordion-item").count()) === 7, "Common prompt did not group the seven fine-tuning steps", failures);
    record(!(await page.locator("#cpdAccordion .cpd-advanced-journey").evaluate((element) => element.open)), "Fine-tuning steps were expanded before the user requested them", failures);
    record((await page.locator('#cpdAccordion [data-step="0"] .cpd-accordion-copy strong').textContent()).includes("디자인 브리프"), "Design brief was not the first common-prompt step", failures);
    record((await page.locator("#cpdAccordionBody0 .cpd-brief-choice").count()) === 5 && (await page.locator("#cpdAccordionBody0 [data-brief-path]").count()) === 28, "Design brief did not render the five compact click-first choices", failures);
    record(!(await page.locator("#cpdAccordionBody0 .cpd-brief-details-body").isVisible()), "Optional design-brief writing fields were expanded by default", failures);
    const desktopBriefLayout = await page.locator("#cpdAccordionBody0 .cpd-brief-choice").first().evaluate((element) => ({ columns: getComputedStyle(element).gridTemplateColumns.split(" ").length, overflow: element.scrollWidth - element.clientWidth }));
    record(desktopBriefLayout.columns === 2 && desktopBriefLayout.overflow <= 1, "Design-brief choices did not use a compact two-column desktop row", failures);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.click('[data-tab-group-filter="visual"]');
    await page.click("#tabBtnPhotoTransform");
    await page.waitForSelector("#panePhotoTransform.active");
    const desktopPhotoControls = await page.locator("#panePhotoTransform .pt-control-column").evaluate((element) => {
      const style = getComputedStyle(element);
      element.scrollTop = Math.min(240, element.scrollHeight - element.clientHeight);
      return {
        position: style.position,
        overflowY: style.overflowY,
        hasScrollableContent: element.scrollHeight > element.clientHeight,
        scrolled: element.scrollTop > 0,
      };
    });
    record(
      desktopPhotoControls.position === "sticky" &&
      desktopPhotoControls.overflowY === "auto" &&
      desktopPhotoControls.hasScrollableContent &&
      desktopPhotoControls.scrolled,
      "Desktop photo-transform Step 1/2 controls were not independently scrollable",
      failures
    );
    record((await page.locator("#photoTransformSourceStructure").count()) === 1, "Photo transform did not expose the source-photo structure control", failures);
    record((await page.locator("#photoTransformOutputMode").count()) === 1, "Photo transform did not expose the result-composition control", failures);
    record((await page.locator("#photoTransformOutputHint").textContent()).includes("해당 카드의 스타일과 용도"), "Automatic photo output did not explain card-based style resolution", failures);
    record(
      (await page.locator("#photoTransformIdentityGuide").textContent()).includes("프리셋의 캐릭터·재질 표현을 우선") &&
      (await page.locator("#photoTransformIdentityNotice").textContent()).includes("기술적으로 보장하지 않습니다"),
      "Photo transform did not explain the creative identity level and its model limitation",
      failures
    );
    record(await page.locator("#photoTransformCollageOptions").isHidden(), "Collage details remained visible before a manual collage choice", failures);
    record((await page.locator("[data-clone-preset]").count()) > 0, "Photo transform cards did not expose style cloning", failures);
    record((await page.locator("[data-select-preset], [data-compare-preset], #photoTransformSelectionBar, #photoTransformCompareDialog").count()) === 0, "Removed photo-transform selection or compare-deck UI returned", failures);

    await page.selectOption("#photoTransformSourceStructure", "mixed");
    await page.selectOption("#photoTransformPeople", "smallGroup");
    await page.selectOption("#photoTransformOutputMode", "scene");
    const mixedScenePrompt = await page.evaluate(() => window.PromptDeckPhotoTransform?.buildPrompt?.("clean-profile", "ko") || "");
    record(
      mixedScenePrompt.includes("단체사진과 개인사진을 함께 분석") &&
      mixedScenePrompt.includes("하나의 일관된 장면에 함께 배치") &&
      mixedScenePrompt.includes("개인사진을 얼굴·헤어라인·자연 머리색·피부색"),
      "Mixed references did not produce the shared-scene identity instructions",
      failures
    );
    const identityLevelAudit = [];
    for (const [value, uiCue, promptCue] of [
      ["exact", "얼굴 동일성을 우선", "보존 우선순위: 높음"],
      ["balanced", "스타일 변환도 충분히 적용", "보존 우선순위: 균형"],
      ["creative", "캐릭터·재질 표현을 우선", "보존 우선순위: 창의적"]
    ]) {
      await page.selectOption("#photoTransformIdentity", value);
      identityLevelAudit.push({
        value,
        ui: (await page.locator("#photoTransformIdentityGuide").textContent()).includes(uiCue),
        prompt: (await page.evaluate(() => window.PromptDeckPhotoTransform?.buildPrompt?.("clean-profile", "ko") || "")).includes(promptCue)
      });
    }
    record(
      identityLevelAudit.every((result) => result.ui && result.prompt),
      `Photo transform identity levels did not keep UI guidance and prompts aligned: ${JSON.stringify(identityLevelAudit)}`,
      failures
    );
    const photoTransformationAudit = await page.evaluate(() => {
      const api = window.PromptDeckPhotoTransform;
      const all = api?.getPresets?.() || [];
      const expectedSocialTrendIds = [
        "social-brand-daylight", "beauty-creator-glow", "soft-power-leader", "reel-cover-creator",
        "paparazzi-street-flash", "cafe-mirror-selfie", "fisheye-room-selfie", "instant-film-candid",
        "disposable-night-out", "rainy-cinema-duo", "idol-comeback-teaser", "pastel-cloud-dream",
        "desk-figurine-workflow", "blister-mini-me", "shoulder-mini-me", "acrylic-charm-avatar",
        "crochet-mini-self", "marshmallow-mascot", "dollhouse-room-mini", "bento-character-box",
        "claw-machine-plush", "scribble-caricature", "childhood-self-reunion", "pet-career-character"
      ];
      const strengthControl = document.querySelector("#photoTransformStrength");
      const failures = [];
      for (const strength of ["short", "standard", "strict"]) {
        strengthControl.value = strength;
        for (const language of ["ko", "en"]) {
          for (const preset of all) {
            const prompt = api.buildPrompt(preset.id, language);
            const missing = [];
            const isEnglish = language === "en";
            const section = strength === "short"
              ? (isEnglish ? "Preset-directed transformation:" : "프리셋 지시 변환:")
              : (isEnglish ? "## 2. Preset-directed transformation" : "## 2. 프리셋 지시 변환");
            if (!prompt.includes(section)) missing.push("section");
            const promptLines = prompt.split("\n");
            if (!prompt.startsWith(isEnglish ? "# Photo transformation prompt — " : "# 사진 변환 프롬프트 — ")) missing.push("markdown-title");
            if (!promptLines.some((line) => line.startsWith("> "))) missing.push("markdown-intro");
            if (promptLines.some((line) => line && !line.startsWith("#") && !line.startsWith("- ") && !line.startsWith("> "))) missing.push("markdown-body-hierarchy");
            const headingCount = promptLines.filter((line) => line.startsWith("## ")).length;
            if (headingCount < (strength === "short" ? 4 : 8)) missing.push("markdown-section-hierarchy");
            if (!prompt.includes(isEnglish ? "expression and gaze" : "표정과 시선")) missing.push("expression");
            if (!prompt.includes(isEnglish ? "head and camera angle" : "고개와 카메라 각도")) missing.push("angle");
            if (preset.subjectType === "pet") {
              if (!prompt.includes(isEnglish ? "grooming and coat presentation" : "그루밍과 털 연출")) missing.push("coat");
              if (!prompt.includes(isEnglish ? "breed, facial markings, ear shape" : "품종, 얼굴 무늬, 귀 모양")) missing.push("pet-identity");
            } else if (!prompt.includes(isEnglish ? "hairstyle arrangement" : "헤어 연출")) {
              missing.push("hair");
            }
            const visualSpecificationSection = strength === "short"
              ? (isEnglish ? "Preset visual specification:" : "프리셋 시각 설계:")
              : (isEnglish ? "## 3. Preset visual specification" : "## 3. 프리셋 시각 설계");
            if (!prompt.includes(visualSpecificationSection)) missing.push("visual-specification-section");
            const visualSpecificationCue = strength === "short"
              ? (isEnglish ? "selected preset as the visual specification" : "선택한 프리셋을 시각 설계의 기준")
              : (isEnglish ? "art-direction source of truth" : "아트디렉션의 단일 기준");
            if (!prompt.includes(visualSpecificationCue)) missing.push("visual-specification-cue");
            if (!prompt.includes(isEnglish ? "Success criterion:" : "성공 기준:")) missing.push("preset-success-criterion");
            if (strength === "strict" && !prompt.includes(isEnglish ? "Preset-match verification:" : "프리셋 일치 검수:")) missing.push("strict-preset-verification");
            if (preset.id.startsWith("expanded-") && prompt.includes(isEnglish
              ? "Distribute the preset's specific material, color, lighting, and composition cue intentionally"
              : "프리셋의 구체적인 재질·색·빛·구도 단서를 한 부분의 장식으로 가두지 말고")) {
              missing.push("generic-expansion-direction");
            }
            if (prompt.includes(isEnglish ? "PromptDeck preview" : "PromptDeck 미리보기 이미지")) missing.push("preview-dependency");
            if (preset.id.endsWith("-paper-tactile") && !prompt.includes(isEnglish ? "three to five physical layers" : "3~5개의 실제 레이어")) {
              missing.push("paper-construction");
            }
            if (missing.length) failures.push({ id: preset.id, strength, language, missing });
          }
        }
      }
      const previewFailures = [];
      for (const preset of all) {
        const prompt = api.buildPreviewPrompt(preset.id);
        const lines = prompt.split("\n");
        const missing = [];
        if (!prompt.startsWith("# 프리셋 미리보기 생성 — ")) missing.push("markdown-title");
        if (!lines.some((line) => line.startsWith("> "))) missing.push("markdown-intro");
        if (lines.filter((line) => line.startsWith("## ")).length < 5) missing.push("markdown-section-hierarchy");
        if (lines.some((line) => line && !line.startsWith("#") && !line.startsWith("- ") && !line.startsWith("> "))) missing.push("markdown-body-hierarchy");
        if (!prompt.includes("성공 기준:")) missing.push("preset-success-criterion");
        if (missing.length) previewFailures.push({ id: preset.id, missing });
      }
      strengthControl.value = "strict";
      return {
        count: all.length,
        combinations: all.length * 3 * 2,
        missingSocialTrendIds: expectedSocialTrendIds.filter((id) => !all.some((preset) => preset.id === id)),
        failureCount: failures.length,
        failures: failures.slice(0, 12),
        previewFailureCount: previewFailures.length,
        previewFailures: previewFailures.slice(0, 12)
      };
    });
    record(
      photoTransformationAudit.count >= 450 &&
      photoTransformationAudit.combinations >= 2700 &&
      photoTransformationAudit.missingSocialTrendIds.length === 0 &&
      photoTransformationAudit.failureCount === 0 &&
      photoTransformationAudit.previewFailureCount === 0,
      `Photo transform preset transformation contract was incomplete: ${JSON.stringify(photoTransformationAudit)}`,
      failures
    );
    record(await page.locator("#photoTransformCollageOptions").isHidden(), "Collage details were visible for shared-scene output", failures);

    await page.selectOption("#photoTransformOutputMode", "collage");
    const collagePrompt = await page.evaluate(() => window.PromptDeckPhotoTransform?.buildPrompt?.("clean-profile", "ko") || "");
    record(collagePrompt.includes("완성된 콜라주 이미지 한 장"), "Collage output did not request one finished collage", failures);
    record(await page.locator("#photoTransformCollageOptions").isVisible(), "Collage details were hidden for collage output", failures);

    await page.selectOption("#photoTransformOutputMode", "individual");
    const individualPrompt = await page.evaluate(() => window.PromptDeckPhotoTransform?.buildPrompt?.("clean-profile", "ko") || "");
    record(
      individualPrompt.includes("각 사람마다 완성 이미지 한 장씩") &&
      individualPrompt.includes("결과 이미지 수는 최종 인물 수와 같아야"),
      "Individual output did not request one image per deduplicated person",
      failures
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page.click('[data-tab-group-filter="special"]');
    await page.waitForSelector("#paneFormImage.active");
    record((await page.locator('.app-tabs[data-active-group="special"] .app-tab-group[data-tab-group="special"]:visible').count()) === 1, "Mobile task-group switcher did not reveal the selected tool group", failures);
    record((await page.locator('.app-tabs .app-tab-group:visible').count()) === 1, "Mobile navigation displayed more than one tool group at a time", failures);
    const mobileNavigation = await page.evaluate(() => {
      const switches = [...document.querySelectorAll("[data-tab-group-filter]")].filter((element) => element.getClientRects().length);
      const detailTabs = [...document.querySelectorAll('.app-tabs[data-active-group="special"] .app-tab-btn')].filter((element) => element.getClientRects().length);
      const switchWidths = switches.map((element) => element.getBoundingClientRect().width);
      const detailRow = document.querySelector('.app-tabs[data-active-group="special"] .app-tab-group-buttons');
      return {
        headerPosition: getComputedStyle(document.querySelector(".app-header")).position,
        tabBarPosition: getComputedStyle(document.querySelector(".app-tabs-bar")).position,
        tabBarTop: getComputedStyle(document.querySelector(".app-tabs-bar")).top,
        tabBarHeight: document.querySelector(".app-tabs-bar").getBoundingClientRect().height,
        switchMinHeight: Math.min(...switches.map((element) => element.getBoundingClientRect().height)),
        switchWidthSpread: Math.max(...switchWidths) - Math.min(...switchWidths),
        detailMinHeight: Math.min(...detailTabs.map((element) => element.getBoundingClientRect().height)),
        detailDisplay: getComputedStyle(detailRow).display,
        detailRowHeight: detailRow.getBoundingClientRect().height,
        detailScrollable: detailRow.scrollWidth > detailRow.clientWidth,
      };
    });
    record(mobileNavigation.headerPosition === "static" && mobileNavigation.tabBarPosition === "sticky" && mobileNavigation.tabBarTop === "0px", "Mobile header and sticky task navigation did not use the compact scroll behavior", failures);
    record(mobileNavigation.switchMinHeight >= 44 && mobileNavigation.detailMinHeight >= 44, "Mobile purpose or detail tabs were smaller than the 44px touch target", failures);
    record(mobileNavigation.switchWidthSpread <= 1 && mobileNavigation.detailDisplay === "flex" && mobileNavigation.detailScrollable, "Mobile purpose/detail navigation did not use a balanced group switcher and one-row scroller", failures);
    record(mobileNavigation.tabBarHeight <= 110 && mobileNavigation.detailRowHeight <= 48, `Mobile task navigation consumed too much vertical space (${Math.round(mobileNavigation.tabBarHeight)}px)`, failures);
    record(await page.locator('#mobileTabActions:not([hidden]) [data-proxy-target="formImageCopyPromptBtn"]').isVisible(), "Mobile primary action did not follow the active business-image tool", failures);

    await page.click("#tabBtnPromotion");
    await page.waitForSelector("#panePromotion.active");
    record(await page.locator("#promotionCopyPromptBtn").isHidden(), "Promotion result duplicated its copy action inside the mobile output card", failures);
    record(await page.locator('#mobileTabActions:not([hidden]) [data-proxy-target="promotionCopyPromptBtn"]').isVisible(), "Promotion mobile copy action was not kept in the global action bar", failures);

    await page.click('[data-tab-group-filter="visual"]');
    await page.click("#tabBtnPhotoTransform");
    await page.waitForSelector("#panePhotoTransform.active");
    await page.waitForFunction(() => document.querySelectorAll("#photoTransformGallery .pt-style-card").length === 18);
    record((await page.locator("#photoTransformGallery .pt-style-card").count()) === 18, "Photo style gallery did not limit its initial mobile render to 18 cards", failures);
    record(await page.locator("#photoTransformGalleryMore:not([hidden])").isVisible(), "Photo style gallery did not expose progressive loading on mobile", failures);
    await page.click("#photoTransformGalleryMoreBtn");
    record((await page.locator("#photoTransformGallery .pt-style-card").count()) === 36, "Photo style gallery did not append the next mobile page", failures);
    await page.click('[data-tab-group-filter="deck"]');
    await page.waitForSelector("#paneCommonPrompt.active");
    record(await page.locator("#mobileTabActions").isHidden(), "Global mobile action bar conflicted with the common-prompt journey bar", failures);
    const mobileBriefOverflow = await page.locator("#cpdAccordionBody0 .cpd-brief-quick-grid").evaluate((element) => element.scrollWidth - element.clientWidth);
    record(mobileBriefOverflow <= 1, `Design-brief quick choices overflowed the mobile viewport by ${Math.round(mobileBriefOverflow)}px`, failures);
    await page.click('.cpd-journey-header [data-action="open-slide-style-gallery"]');
    await page.click('[data-slide-style-id="minimal-report"]');
    const mobileSlideStylePromptGeometry = await page.locator("#cpdSlideStyleDialog .cpd-slide-style-inspector.has-selection").evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const prompt = element.querySelector(".cpd-slide-style-prompt-tool");
      return {
        left: rect.left,
        right: rect.right,
        promptOverflow: prompt ? prompt.scrollWidth - prompt.clientWidth : Number.POSITIVE_INFINITY,
        paletteMinHeight: Math.min(...[...element.querySelectorAll("[data-slide-style-prompt-palette-mode]")].map((button) => button.getBoundingClientRect().height)),
      };
    });
    record(mobileSlideStylePromptGeometry.left >= 0 && mobileSlideStylePromptGeometry.right <= 390 && mobileSlideStylePromptGeometry.promptOverflow <= 1, "Copy-ready slide style prompt tool overflowed the mobile viewport", failures);
    record(mobileSlideStylePromptGeometry.paletteMinHeight >= 42, "Slide style prompt palette choices were smaller than the mobile touch target", failures);
    await page.keyboard.press("Escape");
    record(await page.locator("#cpdSlideStyleDialog").isHidden(), "Slide style prompt gallery did not close from the mobile keyboard route", failures);
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.locator('#cpdAccordionBody0 [data-brief-path="project.audience"][data-brief-value="실무자"]').click();
    await page.locator('#cpdAccordionBody0 [data-brief-path="project.presentationPurpose"][data-brief-value="현황과 성과 보고"]').click();
    await page.locator('#cpdAccordionBody0 [data-brief-path="project.desiredAction"][data-brief-value="핵심 내용을 이해"]').click();
    await page.locator('#cpdAccordionBody0 [data-brief-path="project.secondsPerSlide"][data-brief-value="30"]').click();
    const quickBriefState = await page.evaluate(() => window.PromptDeckCommonPrompt?.getState?.().project);
    record(quickBriefState?.audience === "실무자" && quickBriefState?.presentationPurpose === "현황과 성과 보고" && quickBriefState?.desiredAction === "핵심 내용을 이해" && quickBriefState?.secondsPerSlide === 30, "Design-brief quick choices did not update the existing prompt state", failures);
    await page.locator("#cpdAccordionBody0 .cpd-brief-details > summary").click();
    await page.locator('#cpdAccordionBody0 [data-path="project.audience"]').fill("경상북도 지자체 관계자");
    await page.locator('#cpdAccordionBody0 [data-path="project.presentationPurpose"]').fill("지역 산업 현황 보고와 정책 우선순위 설득");
    await page.locator('#cpdAccordionBody0 [data-path="project.desiredAction"]').fill("핵심 정책과제 우선 추진에 합의");
    record(!(await page.locator("#cpdAccordionBody0 .cpd-brief-strategy-body").isVisible()), "Detailed persuasion fields were expanded before the user requested them", failures);
    await page.locator("#cpdAccordionBody0 .cpd-brief-strategy > summary").click();
    await page.locator('#cpdAccordionBody0 [data-path="project.currentPerception"]').fill("생산 규모가 지역 경쟁력이라고 생각");
    await page.locator('#cpdAccordionBody0 [data-path="project.targetPerception"]').fill("소재와 순환의 연결성이 핵심 경쟁력이라고 판단");
    await page.locator('#cpdAccordionBody0 [data-path="project.keyBarrier"]').fill("기업과 시설을 개별 성과로 보는 관점");
    await page.locator('#cpdAccordionBody0 [data-path="project.governingThought"]').fill("경북은 생산과 순환을 연결하는 소재 허브로 전환해야 한다");
    const contextPrompt = await page.evaluate(() => window.PromptDeckCommonPrompt?.buildPrompt?.() || "");
    record(contextPrompt.length <= 3800 && contextPrompt.startsWith("## 공통 디자인 시스템"), `Default image-generation prompt exceeded the 3,800-character efficiency budget (${contextPrompt.length})`, failures);
    record(contextPrompt.includes("### 발표 대상과 목적") && contextPrompt.includes("경상북도 지자체 관계자") && contextPrompt.includes("정책 우선순위 설득") && contextPrompt.includes("페이지당 발표 시간: 30초") && contextPrompt.includes("화면에 직접 표시하지 않고"), "Presentation audience, purpose, and per-slide timing were not added as non-display prompt context", failures);
    record(contextPrompt.includes("### 발표 전략 맥락") && contextPrompt.includes("청중의 현재 인식: 생산 규모가 지역 경쟁력이라고 생각") && contextPrompt.includes("발표 후 목표 인식: 소재와 순환의 연결성이 핵심 경쟁력이라고 판단") && contextPrompt.includes("핵심 인식 장벽: 기업과 시설을 개별 성과로 보는 관점") && contextPrompt.includes("Governing Thought"), "Presentation strategy context was not added to the common prompt", failures);
    record((await page.locator("#cpdAccordionBody0 .cpd-brief-chip.selected").count()) >= 2, "Design-brief quick choices did not keep a visible selected state", failures);
    await page.locator('#cpdAccordion [data-step="1"]').click();
    record((await page.locator("#cpdAccordionBody1 .cpd-design-axis").count()) === 6, "Design DNA did not render the six sequential design questions", failures);
    record((await page.locator("#cpdAccordionBody1 .cpd-axis-board-head").textContent()).includes("양끝 사이") && (await page.locator("#cpdAccordionBody1 [data-axis-range]").count()) === 6, "Design DNA did not render the bipolar slider board", failures);
    record((await page.locator("#cpdAccordionBody1 [data-axis-set][data-axis-value='1'], #cpdAccordionBody1 [data-axis-set][data-axis-value='5']").count()) === 12, "Design axes did not expose clickable opposing endpoints", failures);
    const designAxisTickError = await maxAxisTickAlignmentError(page, "#cpdAccordionBody1 [data-axis-range]");
    record(designAxisTickError <= 1, `Five-step slider ticks were misaligned by ${designAxisTickError.toFixed(2)}px`, failures);
    await page.locator('#cpdAccordionBody1 [data-axis-set="visualDirection.authority"][data-axis-value="5"]').click();
    record((await page.evaluate(() => window.PromptDeckCommonPrompt?.getState?.().visualDirection?.authority)) === 5 && (await page.locator('#cpdAccordionBody1 [data-axis-output="visualDirection.authority"]').textContent()).includes("개방적·인간적"), "Opposing concept endpoint did not update the design coordinate", failures);
    await page.locator('#cpdAccordionBody1 [data-action="reset-design-axes"]').click();
    record((await page.evaluate(() => ["authority", "energy", "expression", "rationality", "geometry", "depth"].every((key) => window.PromptDeckCommonPrompt?.getState?.().visualDirection?.[key] === 3))), "Design-axis balance reset did not restore all six midpoint values", failures);
    await page.setViewportSize({ width: 390, height: 844 });
    const designAxisMobileBox = await page.locator("#cpdAccordionBody1 .cpd-design-axis").first().boundingBox();
    record(Boolean(designAxisMobileBox && designAxisMobileBox.x >= 0 && designAxisMobileBox.x + designAxisMobileBox.width <= 390), "Design slider board overflowed the mobile viewport", failures);
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.locator('#cpdAccordionBody1 [data-path="visualDirection.conceptKeywords"]').fill("신뢰, 연결, 정밀");
    await page.locator('#cpdAccordionBody1 [data-path="visualDirection.signatureMotif"]').fill("연결되는 궤적");
    const dnaPrompt = await page.evaluate(() => window.PromptDeckCommonPrompt?.buildPrompt?.() || "");
    record(dnaPrompt.includes("### 덱 디자인 선언과 디자인 DNA") && dnaPrompt.includes("고유한 아트 디렉션") && dnaPrompt.includes("연결되는 궤적"), "Sequential design answers were not composed into an editable deck design DNA", failures);
    record(!(await page.locator("#cpdAccordionBody1 .cpd-design-advanced-body").isVisible()), "Advanced visual-treatment library was expanded by default", failures);
    await page.locator('#cpdAccordion [data-step="2"]').click();
    record((await page.locator("#cpdAccordionBody2 .cpd-responsibility-map").textContent()).includes("페이지 목적") && (await page.locator("#cpdAccordionBody2 .cpd-responsibility-map").textContent()).includes("덱 전체의 디자인 DNA"), "Skill and web design-guide responsibilities were not separated in the composition journey", failures);
    record(!(await page.locator("#cpdAccordionBody2 .cpd-resource-grid").isVisible()), "Visual resource checklist was not moved into advanced editing", failures);
    const grammarPrompt = await page.evaluate(() => window.PromptDeckCommonPrompt?.buildPrompt?.() || "");
    record(grammarPrompt.includes("### 시각 문법·일관성·레이아웃 변주") && grammarPrompt.includes("레이아웃 변주 원칙"), "Visual grammar and layout-variation rules were not added to the common prompt", failures);
    record((await page.getByText("프로젝트 기본정보", { exact: true }).count()) === 0, "Removed project-information section was still visible", failures);
    record((await page.getByText("검토 및 생성", { exact: true }).count()) === 0, "Removed review accordion was still visible", failures);
    record((await page.locator("#cpdQuickStartDialog").count()) === 0, "Removed quick-start dialog was still mounted", failures);
    record(await page.locator(".cpd-inspiration-starter").isVisible(), "Optional inspiration starter was not visible", failures);
    record(!(await page.locator(".cpd-institution-random").isVisible()), "Institution starter details were expanded before the user requested them", failures);
    await page.locator(".cpd-inspiration-starter > summary").click();
    record(await page.locator(".cpd-institution-random").isVisible(), "Institution starter details did not expand", failures);
    const institutionActionLabels = await page.locator(".cpd-institution-random-actions .cpd-btn").allTextContents();
    record(institutionActionLabels.map((label) => label.trim()).join("|") === "시작 조합 만들기|표현 기법만 변경|팔레트만 변경", "Inspiration starter actions did not use the revised optional-start terminology or order", failures);
    record((await page.locator(".cpd-institution-random-copy").textContent()).includes("시작점"), "Inspiration starter did not explain that presets are only starting material", failures);
    record((await page.locator(".cpd-summary-reuse [data-action='export']").count()) === 1, "Settings reuse controls were not moved into the preview panel", failures);
    record((await page.locator("#cpdAccordion .cpd-accordion-status.complete").count()) === 0, "Redundant configured-status label was still rendered", failures);
    record((await page.locator('#cpdAccordion [data-step="9"]').locator("xpath=..").locator(".cpd-section-toggle").textContent()).trim() === "핵심 가이드", "Canvas was not retained as a core design-guide stage", failures);
    await page.locator("#cpdAccordion .cpd-advanced-journey > summary").click();
    record(await page.locator("#cpdAccordion .cpd-advanced-journey").evaluate((element) => element.open), "Fine-tuning steps did not expand on request", failures);
    const headerUsageToggle = page.locator('[data-section-toggle="header"]');
    record((await headerUsageToggle.textContent()).trim() === "가이드에 포함" && (await headerUsageToggle.getAttribute("aria-pressed")) === "true", "Optional section control did not show the included state", failures);
    await headerUsageToggle.click();
    await page.waitForFunction(() => document.querySelector('[data-section-toggle="header"]')?.getAttribute("aria-pressed") === "false");
    record((await page.locator('[data-section-toggle="header"]').textContent()).trim() === "선택 안 함", "Optional section control did not show the omitted state", failures);
    record((await page.locator('#cpdAccordion [data-section-toggle]').count()) === 4, "Core design stages rendered unnecessary usage toggles", failures);
    await page.locator('[data-section-toggle="header"]').click();
    await page.click('[data-action="institution-random"]');
    await page.waitForFunction(() => document.querySelectorAll(".cpd-institution-random-result dl > div").length === 8);
    const institutionState = await page.evaluate(() => window.PromptDeckCommonPrompt?.getState?.());
    const institutionPools = await page.evaluate(() => ({
      mediumIds: window.PromptDeckMediumCatalog?.list?.({ recommended: true }).map((item) => item.id) || [],
      paletteIds: window.PromptDeckPaletteCatalog?.list?.({ category: "official" }).map((item) => item.id) || [],
    }));
    record(institutionPools.mediumIds.length > 0 && institutionPools.paletteIds.length > 0, "Visual Mixer institutional preset pools were empty", failures);
    record(Boolean(institutionState?.visualDirection?.mediumNameKo), "Institution preset did not apply a visual medium", failures);
    record(institutionPools.mediumIds.includes(institutionState?.visualDirection?.mediumId), "Institution preset used a medium outside the Visual Mixer public-institution filter", failures);
    record(institutionPools.paletteIds.includes(institutionState?.colors?.presetId), "Institution preset used a palette outside the Visual Mixer public/institution filter", failures);
    record(Boolean(institutionState?.composition?.profile && institutionState?.colors?.preset), "Institution preset did not apply composition and color settings", failures);
    record(Boolean(institutionState?.background?.profile && institutionState?.header?.profile && institutionState?.footer?.profile), "Institution preset did not apply background, header, and footer systems", failures);
    record(Boolean(institutionState?.typography?.presetId && institutionState?.photoComposite?.mode), "Institution preset did not apply typography and photo-composite settings", failures);
    record(["direction", "composition", "colors", "background", "header", "footer", "typography", "photoComposite"].every((key) => institutionState?.sectionEnabled?.[key] !== false), "Institution preset left a required design section disabled", failures);
    const colorBefore = institutionState?.colors?.preset;
    await page.click('[data-action="institution-random-color"]');
    const colorAfter = await page.evaluate(() => window.PromptDeckCommonPrompt?.getState?.().colors?.preset);
    record(Boolean(colorAfter) && colorAfter !== colorBefore, "Color-only random button did not change the palette", failures);
    record(institutionPools.paletteIds.includes(colorAfter), "Color-only random button used a palette outside the Visual Mixer public/institution filter", failures);
    const mediumBefore = await page.evaluate(() => window.PromptDeckCommonPrompt?.getState?.().visualDirection?.mediumId);
    await page.click('[data-action="institution-random-medium"]');
    const mediumAfter = await page.evaluate(() => window.PromptDeckCommonPrompt?.getState?.().visualDirection?.mediumId);
    record(Boolean(mediumAfter) && mediumAfter !== mediumBefore, "Medium-only random button did not change the visual medium", failures);
    record(institutionPools.mediumIds.includes(mediumAfter), "Medium-only random button used a medium outside the Visual Mixer public-institution filter", failures);
    await page.setViewportSize({ width: 390, height: 844 });
    record(await page.locator("#tabActions").isHidden(), "Right-panel quick action dock remained visible on mobile", failures);
    const institutionMobileBox = await page.locator(".cpd-institution-random").boundingBox();
    const institutionMobileColumns = await page.locator(".cpd-institution-random-result dl").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
    record(Boolean(institutionMobileBox && institutionMobileBox.x >= 0 && institutionMobileBox.x + institutionMobileBox.width <= 390), "Institution preset panel overflowed the mobile viewport", failures);
    record(institutionMobileColumns === 1, "Institution preset summary did not collapse to one column on a narrow mobile viewport", failures);
    record(await page.locator(".cpd-summary-reuse").isVisible(), "Settings reuse controls disappeared from the mobile preview panel", failures);
    await page.setViewportSize({ width: 1440, height: 1200 });
    const contractPrompt = await page.evaluate(() => window.PromptDeckCommonPrompt?.buildPrompt?.() || "");
    record(contractPrompt.includes("완성된 전체 슬라이드 이미지 한 장을 생성한다"), "Removing project information also removed the required image output contract", failures);
    record(contractPrompt.includes("### 덱 디자인 선언과 디자인 DNA"), "Common prompt omitted the deck design declaration and DNA", failures);
    record(contractPrompt.includes("보조 표현 기법") && contractPrompt.includes("모든 요소를 같은 질감으로 덮지 않는다"), "Supporting visual treatment did not remain subordinate to the design DNA", failures);
    record(!contractPrompt.includes("### 금지 규칙"), "Default common prompt still emitted a prohibition section", failures);
    record(!contractPrompt.includes("### 발표 대상과 목적") && !contractPrompt.includes("### 발표 전략 맥락"), "Common design prompt still mixed audience or persuasion context into the design layer", failures);

    record((await page.locator('#cpdAccordion [data-step="1"] .cpd-accordion-copy strong').textContent()).includes("디자인 DNA"), "Design DNA was not placed immediately after the brief", failures);
    record((await page.locator('#cpdAccordion [data-step="11"] .cpd-accordion-copy strong').textContent()).includes("고급 품질 보호"), "Optional quality protection did not remain the final common-prompt step", failures);
    await page.click('#cpdAccordion [data-step="1"]');
    await page.locator('#cpdAccordionBody1 .cpd-design-advanced > summary').click();
    await page.waitForSelector('#cpdAccordionBody1 .cpd-direction-current [data-action="remove-medium"]');
    record((await page.locator('#cpdAccordionBody1 .cpd-direction-current [data-action="remove-medium"]').count()) === 1, "Current-medium removal was not integrated into advanced design-DNA editing", failures);
    record((await page.locator('#cpdAccordionBody1 .cpd-applied-medium').count()) === 0, "Duplicate applied-medium banner was still rendered above the medium grid", failures);

    await page.click('#cpdAccordion [data-step="2"]');
    await page.waitForSelector('#cpdAccordionBody2 .cpd-responsibility-map');
    await page.locator('#cpdAccordionBody2 .cpd-design-advanced > summary').click();
    record((await page.locator('#cpdAccordionBody2 .cpd-resource-card').count()) === 10, "Visual-resource step did not expose all ten available evidence media", failures);
    const responsibilityText = await page.locator('#cpdAccordionBody2 .cpd-responsibility-map').textContent();
    record(responsibilityText.includes("발표 맥락") && responsibilityText.includes("스킬 의미 브리프") && responsibilityText.includes("공통 디자인 가이드") && responsibilityText.includes("이미지 AI"), "Visual-resource step did not explain the separated context, semantic, design, and rendering roles", failures);
    record((await page.locator('#cpdAccordionBody2 .cpd-design-advanced-body [data-path="composition.grid"], #cpdAccordionBody2 .cpd-design-advanced-body [data-path="composition.layerCount"]').count()) === 2, "Technical composition controls were not preserved under advanced editing", failures);
    record((await page.locator('#cpdAccordionBody2 [data-choice-path="composition.container"], #cpdAccordionBody2 [data-choice-path="composition.layoutFreedom"], #cpdAccordionBody2 [data-choice-path="composition.density"]').count()) === 3, "Composition intensity choices were not converted to the shared slider pattern", failures);
    const compositionAxisTickError = await maxAxisTickAlignmentError(page, "#cpdAccordionBody2 [data-choice-axis-range]");
    record(compositionAxisTickError <= 1, `Three-step slider ticks were misaligned by ${compositionAxisTickError.toFixed(2)}px`, failures);
    await page.setViewportSize({ width: 390, height: 844 });
    record(await page.locator('#cpdAccordionBody2 .cpd-resource-grid').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length) === 1, "Visual-resource cards did not collapse to one column on mobile", failures);
    record(await page.locator('#cpdAccordionBody2 .cpd-responsibility-map').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length) === 1, "Responsibility map did not collapse to one column on mobile", failures);
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.click('#cpdAccordionBody2 [data-choice-axis-set="composition.container"][data-choice-axis-index="1"]');
    const compositionPrompt = await page.evaluate(() => window.PromptDeckCommonPrompt?.buildPrompt?.() || "");
    record(compositionPrompt.includes("시각 문법·일관성·레이아웃 변주"), "Common prompt omitted the visual-grammar and variation section", failures);
    record(compositionPrompt.includes("선택 자원을") && compositionPrompt.includes("적극 활용") && compositionPrompt.includes("의미 그룹·읽기 우선순위·핵심 강조 이유") && compositionPrompt.includes("서로 다른 구도 후보"), "Common prompt did not activate selected resources or delegate composition from semantic priorities", failures);
    record(compositionPrompt.includes("핵심 블록") && compositionPrompt.includes("근거 블록") && compositionPrompt.includes("보조 블록"), "Common prompt omitted the selected card, section, and block object grammar", failures);
    record(!compositionPrompt.includes("공간 예산") && !compositionPrompt.includes("허용 레이아웃 계열"), "Common prompt still emitted deterministic layout geometry", failures);

    await page.click('.cpd-summary [data-action="output-settings"]');
    record((await page.locator('#cpdOutputSettingsDialog label.cpd-output-choice.recommended [data-path="project.outputMode"]').getAttribute("value")) === "standard", "Image-generation output settings did not recommend the practical standard mode", failures);
    record((await page.locator("#cpdOutputSettingsDialog .cpd-output-budget").textContent()).includes("현재 프롬프트"), "Output settings did not expose the prompt-length budget", failures);
    await page.locator('#cpdOutputSettingsDialog label:has([data-path="project.targetModel"][value="gemini"])').click();
    await page.locator('#cpdOutputSettingsDialog label:has([data-path="project.outputMode"][value="detailed"])').click();
    const geminiPrompt = await page.evaluate(() => window.PromptDeckCommonPrompt?.buildPrompt?.() || "");
    record(geminiPrompt.length <= 5200 && geminiPrompt.startsWith("## 공통 디자인 시스템"), `Detailed review prompt exceeded the 5,200-character budget (${geminiPrompt.length})`, failures);
    record(geminiPrompt.includes("Gemini 최종 준수 점검"), "Gemini prompt omitted the final compliance pass", failures);
    record(geminiPrompt.includes("Accent가 불필요하면 생략") && geminiPrompt.includes("한 색조로 수렴하지 않게"), "Gemini prompt did not preserve adaptive color usage and local color variation", failures);
    await page.locator('#cpdOutputSettingsDialog label:has([data-path="project.targetModel"][value="common"])').click();
    const commonModelPrompt = await page.evaluate(() => window.PromptDeckCommonPrompt?.buildPrompt?.() || "");
    record(commonModelPrompt.includes("특정 모델 문법에 의존하지 않는") && !commonModelPrompt.includes("Gemini 최종 준수 점검"), "Common model prompt was not provider-neutral", failures);
    await page.locator('#cpdOutputSettingsDialog label:has([data-path="project.targetModel"][value="gpt_image"])').click();
    await page.locator('#cpdOutputSettingsDialog label:has([data-path="project.outputMode"][value="standard"])').click();
    const gptImagePrompt = await page.evaluate(() => window.PromptDeckCommonPrompt?.buildPrompt?.() || "");
    record(gptImagePrompt.includes("GPT Image용 직접 렌더링") && gptImagePrompt.includes("설득에 도움이 되는 것만 선택"), "GPT Image prompt omitted direct rendering or selective visual-resource usage", failures);
    await page.click('#cpdOutputSettingsDialog [data-action="apply-output-settings"]');

    await page.click('#cpdAccordion [data-step="3"]');
    await page.waitForSelector('#cpdAccordionBody3 [data-palette-intent]');
    record((await page.locator('#cpdAccordionBody3 [data-palette-intent]').count()) === 6, "Palette finder did not expose six result-oriented impression choices", failures);
    record((await page.locator('#cpdAccordionBody3 [data-palette-easy-filter]').count()) === 12, "Palette finder did not expose three plain-language detail filters", failures);
    record((await page.locator('#cpdAccordionBody3 [data-palette-easy-value="all"][aria-pressed="true"]').count()) === 3, "Palette detail filters did not start in the optional state", failures);
    record((await page.locator('#cpdAccordionBody3 .cpd-palette-card').count()) > 0, "Palette finder did not render searchable palette results", failures);
    const palettePromptBeforeFilter = await page.evaluate(() => window.PromptDeckCommonPrompt?.buildPrompt?.() || "");
    await page.click('#cpdAccordionBody3 [data-palette-intent="trust"]');
    record((await page.locator('#cpdAccordionBody3 [data-palette-intent="trust"]').getAttribute("aria-pressed")) === "true", "Palette impression choice did not become active", failures);
    record((await page.locator('#cpdAccordionBody3 .cpd-palette-card').count()) > 0, "Palette impression recommendation produced no results", failures);
    await page.fill('#cpdAccordionBody3 [data-color-query]', '신뢰감 있는 파란색, 너무 차갑지 않게');
    await page.click('#cpdAccordionBody3 [data-action="color-search"]');
    record((await page.locator('#cpdAccordionBody3 .cpd-palette-card').count()) > 0, "Natural-language palette search produced no results", failures);
    await page.click('#cpdAccordionBody3 [data-action="reset-palette-filters"]');
    await page.locator('#cpdAccordionBody3 .cpd-palette-more-filters > summary').click();
    await page.click('#cpdAccordionBody3 [data-palette-easy-filter="temperature"][data-palette-easy-value="cool"]');
    await page.waitForSelector('#cpdAccordionBody3 .cpd-active-palette-filters button');
    record((await page.locator('#cpdAccordionBody3 .cpd-active-palette-filters').textContent()).includes("온도"), "Palette temperature filter did not become visible as an active search condition", failures);
    const palettePromptAfterFilter = await page.evaluate(() => window.PromptDeckCommonPrompt?.buildPrompt?.() || "");
    record(palettePromptAfterFilter === palettePromptBeforeFilter, "Palette search filters leaked into the generated design prompt", failures);
    await page.click('#cpdAccordionBody3 [data-action="reset-palette-filters"]');
    const firstPaletteCard = page.locator('#cpdAccordionBody3 .cpd-palette-card').first();
    const candidatePaletteName = (await firstPaletteCard.locator('strong').textContent()).trim();
    await firstPaletteCard.hover();
    record((await page.locator('#cpdResults .cpd-summary-head span').textContent()).includes("PALETTE PREVIEW"), "Hovering a palette did not activate the live slide preview", failures);
    record((await page.locator('#cpdResults .cpd-preview-caption').textContent()).includes(candidatePaletteName), "Live preview did not identify the hovered palette", failures);
    await firstPaletteCard.click();
    await page.waitForSelector('#cpdAccordionBody3 .cpd-color-draft');
    record((await page.locator('#cpdAccordionBody3 [data-action="apply-color-draft"]').count()) === 1, "Selecting a palette did not expose an explicit apply action", failures);
    await page.click('#cpdAccordionBody3 [data-action="apply-color-draft"]');
    record((await page.evaluate(() => window.PromptDeckCommonPrompt?.getState?.().colors?.paletteNameKo || "")) === candidatePaletteName, "Applying a palette did not update the final color system", failures);
    await page.locator('#cpdAccordionBody3 .cpd-design-advanced > summary').click();
    await page.waitForSelector('#cpdAccordionBody3 .cpd-color-role-card');
    record((await page.locator('#cpdAccordionBody3 .cpd-color-role-card').count()) === 5, "Color system did not expose all five visual-mixer roles", failures);
    record((await page.locator('#cpdResults .cpd-color-dots i').count()) === 5, "Color summary did not display all five configured roles", failures);
    record((await page.locator('#cpdAccordionBody3 [data-path="colors.photoColorPolicy"]').count()) === 0, "Photo color policy remained inside the color system", failures);
    record((await page.locator('#cpdAccordionBody3').textContent()).includes("느낌을 고르고 결과로 결정하세요"), "Color step did not present the result-first palette decision flow", failures);
    const simplifiedColorPrompt = await page.evaluate(() => window.PromptDeckCommonPrompt?.buildPrompt?.() || "");
    record(simplifiedColorPrompt.includes("### 색상 팔레트") && simplifiedColorPrompt.includes("Secondary=") && !simplifiedColorPrompt.includes("Surface=") && !simplifiedColorPrompt.includes("사진 색상은"), "Generated prompt omitted the final palette roles or exposed derived/photo color policy", failures);
    record(!simplifiedColorPrompt.includes("색채 언어는") && !simplifiedColorPrompt.includes("색온도 필터") && !simplifiedColorPrompt.includes("채도 필터") && !simplifiedColorPrompt.includes("대비 필터"), "Generated prompt still exposed abstract palette-search controls", failures);
    record(simplifiedColorPrompt.includes("Accent가") && simplifiedColorPrompt.includes("생략할 수 있다") && simplifiedColorPrompt.includes("전체 화면") && simplifiedColorPrompt.includes("고유색"), "Generated prompt omitted adaptive accent or local photo-color protection", failures);
    await page.setViewportSize({ width: 390, height: 844 });
    const paletteFinderMobileBox = await page.locator('#cpdAccordionBody3 .cpd-palette-finder').boundingBox();
    record(Boolean(paletteFinderMobileBox && paletteFinderMobileBox.x >= 0 && paletteFinderMobileBox.x + paletteFinderMobileBox.width <= 390), "Palette finder overflowed the mobile viewport", failures);
    record(await page.locator('#cpdAccordionBody3 .cpd-palette-grid').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length) === 1, "Palette results did not collapse to one column on mobile", failures);
    await page.setViewportSize({ width: 1440, height: 1200 });

    await page.click('#cpdAccordion [data-step="6"]');
    record((await page.locator("#cpdAccordionBody6 .cpd-zone-preview > div").count()) === 3 && (await page.locator("#cpdAccordionBody6 [data-zone-range]").count()) === 1, "Background step did not expose the three-zone surface preview and separation slider", failures);
    const zonePreviewColors = await page.locator("#cpdAccordionBody6 .cpd-zone-preview > div").evaluateAll((elements) => elements.map((element) => getComputedStyle(element).backgroundColor));
    record(new Set(zonePreviewColors).size >= 2, "Header, body, and footer preview surfaces collapsed into one background tone", failures);
    await page.locator('#cpdAccordionBody6 [data-zone-set="5"]').click();
    record((await page.evaluate(() => window.PromptDeckCommonPrompt?.getState?.().background?.zoneSeparation)) === 5 && (await page.locator("#cpdAccordionBody6 [data-zone-output]").textContent()).includes("강한 영역 대비"), "Background zone-separation control did not update the surface system", failures);
    await page.locator('#cpdAccordionBody6 .cpd-design-advanced > summary').click();
    await page.waitForSelector('#cpdAccordionBody6 [data-choice-path="background.photoMode"]');
    await page.click('#cpdAccordionBody6 [data-choice-axis-set="background.photoMode"][data-choice-axis-index="2"]');
    record((await page.locator('#cpdAccordionBody6 [data-choice-path="background.photoSaturation"]').count()) === 1, "Background photo saturation control was not moved into advanced background editing", failures);
    record((await page.locator('#cpdAccordionBody6 [data-choice-path="background.photoOverlay"]').count()) === 1, "Background photo overlay control was not moved into advanced background editing", failures);
    await page.click('#cpdAccordionBody6 [data-choice-axis-set="background.photoSaturation"][data-choice-axis-index="2"]');
    record((await page.locator('#cpdAccordionBody6 [data-path="background.photoLayerMode"], #cpdAccordionBody6 [data-path="background.photoLayerLayout"], #cpdAccordionBody6 [data-path="background.photoLayerMaxImages"]').count()) === 0, "Background step still exposed layer-count or layout controls", failures);
    const backgroundPhotoPrompt = await page.evaluate(() => window.PromptDeckCommonPrompt?.buildPrompt?.() || "");
    record(backgroundPhotoPrompt.includes("서로 다른 조화 표면") && backgroundPhotoPrompt.includes("헤더·본문·푸터"), "Common prompt did not preserve independent zoned surfaces for the header, body, and footer", failures);
    record(backgroundPhotoPrompt.includes("흑백") && backgroundPhotoPrompt.includes("실사 배경"), "Common prompt omitted the photographic-background treatment", failures);
    record(backgroundPhotoPrompt.includes("장면·크롭·깊이·레이어") && backgroundPhotoPrompt.includes("이미지 AI가 설득 목적") && backgroundPhotoPrompt.includes("선택"), "Common prompt did not delegate background composition to the image AI", failures);

    await page.click('#cpdAccordion [data-step="7"]');
    await page.waitForSelector('#cpdAccordionBody7 .cpd-check.has-help');
    record((await page.locator('#cpdAccordionBody7 [data-path="header.surfaceRole"]').count()) === 1, "Header step did not expose an independent background-surface role", failures);
    const headerCheckHierarchy = await page.locator('#cpdAccordionBody7 .cpd-check.has-help').first().evaluate((element) => ({
      hasTitle: Boolean(element.querySelector(":scope > span > strong")?.textContent.trim()),
      hasHelp: Boolean(element.querySelector(":scope > span > small")?.textContent.trim()),
      copyLayout: getComputedStyle(element.querySelector(":scope > span")).display,
      helpDisplay: getComputedStyle(element.querySelector(":scope > span > small")).display,
      groupLayout: getComputedStyle(element.closest(".cpd-checks")).display,
    }));
    record(headerCheckHierarchy.hasTitle && headerCheckHierarchy.hasHelp, "Header option did not render separate title and help elements", failures);
    record(headerCheckHierarchy.copyLayout === "grid" && headerCheckHierarchy.helpDisplay === "block", "Header option title and help were not stacked", failures);
    record(headerCheckHierarchy.groupLayout === "grid", "Help-bearing check options did not use the shared responsive grid", failures);

    await page.click('#cpdAccordion [data-step="8"]');
    await page.waitForSelector('#cpdAccordionBody8 [data-path="footer.surfaceRole"]');
    record((await page.locator('#cpdAccordionBody8 [data-path="footer.surfaceRole"]').count()) === 1, "Footer step did not expose an independent background-surface role", failures);

    await page.click('#cpdAccordion [data-step="5"]');
    await page.locator('#cpdAccordionBody5 .cpd-design-advanced > summary').click();
    await page.waitForSelector('#cpdAccordionBody5 [data-choice-path="photoComposite.mode"]');
    record((await page.locator('#cpdAccordionBody5 [data-choice-axis-set="photoComposite.mode"][data-choice-axis-index="3"]').count()) === 0, "Photo step still exposed a mandatory-photo mode", failures);
    await page.click('#cpdAccordionBody5 [data-choice-axis-set="photoComposite.mode"][data-choice-axis-index="2"]');
    record((await page.locator('#cpdAccordionBody5 .cpd-photo-mode-guide').textContent()).includes("적극 활용 가능"), "Photo mode guide did not explain optional high availability", failures);
    record((await page.locator('#cpdAccordionBody5 [data-path="photoComposite.primary"], #cpdAccordionBody5 [data-path="photoComposite.secondary"], #cpdAccordionBody5 [data-path="photoComposite.maxAreaPercent"]').count()) === 0, "Photo step still exposed placement or area constraints", failures);
    record((await page.locator('#cpdAccordionBody5').textContent()).includes("크롭·배치·크기·레이어는 AI가 결정"), "Photo step did not delegate composition decisions to the image AI", failures);
    } else {
      record((await page.locator("#cpdAccordion .cpd-journey-step").count()) === 0, "Duplicate five-stage navigation remained above the editing panel", failures);
      record((await page.locator(".cpd-summary .cpd-summary-journey-steps .cpd-journey-step").count()) === 5, "Five-stage navigation was not moved above the live preview", failures);
      record((await page.locator(".cpd-summary-path, .cpd-summary-path-step").count()) === 0, "Legacy compact summary navigation remained after consolidation", failures);
      const summaryPathGeometry = await page.locator('.cpd-summary-journey-steps').evaluate((track) => {
        const trackRect = track.getBoundingClientRect();
        const buttons = [...track.querySelectorAll('.cpd-journey-step')].map((button) => button.getBoundingClientRect());
        return {
          count: buttons.length,
          widthSpread: Math.max(...buttons.map((rect) => rect.width)) - Math.min(...buttons.map((rect) => rect.width)),
          leftGap: Math.abs((buttons[0]?.left || 0) - trackRect.left),
          rightGap: Math.abs(trackRect.right - (buttons.at(-1)?.right || 0)),
        };
      });
      record(summaryPathGeometry.count === 5 && summaryPathGeometry.widthSpread <= 1 && summaryPathGeometry.leftGap <= 1 && summaryPathGeometry.rightGap <= 1, `Five-stage summary did not fill the available width evenly (${JSON.stringify(summaryPathGeometry)})`, failures);
      record((await page.locator("#cpdAccordion #cpdQuickSetup").count()) === 0, "Quick Start still occupied space above the five-stage workspace", failures);
      record((await page.locator('.cpd-journey-header [data-action="open-quick-setup-modal"]').count()) === 1, "Five-stage header omitted the Quick Start modal button", failures);
      record((await page.locator('.cpd-journey-header [data-action="open-slide-style-gallery"]').count()) === 1, "Five-stage header omitted the slide style gallery modal button", failures);
      record((await page.locator('#cpdJourneyPanel [data-canvas-preset]').count()) === 6, "Format stage omitted canvas presets", failures);
      record((await page.locator('#cpdJourneyPanel [data-path="frame.headerHeightPercent"], #cpdJourneyPanel [data-path="frame.footerHeightPercent"], #cpdJourneyPanel [data-path="frame.bodySafeMarginPercent"]').count()) === 3, "Format stage omitted reserved-area controls", failures);
      record((await page.locator('#cpdJourneyPanel [data-comma-input]').count()) === 2, "Header and footer elements were not entered as comma-separated lists", failures);
      record((await page.locator('#cpdJourneyPanel .cpd-frame-overview').count()) === 1 && (await page.locator('#cpdJourneyPanel .cpd-frame-setting-row').count()) === 3, "Format stage omitted the live area preview or the header/footer/body editing rows", failures);
      const frameRowLabels = await page.locator('#cpdJourneyPanel .cpd-frame-setting-row').evaluateAll((rows) => rows.map((row) => [...row.querySelectorAll('.cpd-range-head > span:first-child, .cpd-comma-field > label')].map((item) => item.textContent.trim())));
      record(frameRowLabels[0]?.includes("헤더 비율") && frameRowLabels[0]?.includes("헤더 정보 항목") && frameRowLabels[1]?.includes("푸터 비율") && frameRowLabels[1]?.includes("푸터 정보 항목") && frameRowLabels[2]?.includes("본문 안전 여백"), "Format rows did not pair header/footer ratios with their information fields in the requested order", failures);
      record((await page.locator('#cpdJourneyPanel [data-frame-token]').count()) === 8, "Format stage omitted the quick header/footer information buttons", failures);
      const headerOrganizationToken = page.locator('#cpdJourneyPanel [data-frame-token-path="frame.headerElements"][data-frame-token="기관명"]');
      const headerElementsBeforeToken = await page.evaluate(() => window.PromptDeckCommonPrompt.getState().frame.headerElements);
      await headerOrganizationToken.click();
      record((await page.evaluate(() => window.PromptDeckCommonPrompt.getState().frame.headerElements)).includes("기관명"), "Quick header information button did not add its item", failures);
      await headerOrganizationToken.click();
      record((await page.evaluate(() => window.PromptDeckCommonPrompt.getState().frame.headerElements)) === headerElementsBeforeToken, "Quick header information button did not restore the prior item list", failures);
      record((await page.getByText("한 장을 보는 시간", { exact: true }).count()) === 0, "Removed per-slide presentation-time control was still visible", failures);
      const frameBeforeQuick = await page.evaluate(() => JSON.stringify(window.PromptDeckCommonPrompt.getState().frame));
      await page.click('.cpd-journey-header [data-action="open-quick-setup-modal"]');
      record(await page.locator("#cpdQuickSetupDialog").isVisible(), "Quick Start did not open as a modal", failures);
      record((await page.locator("#cpdQuickSetupDialog [data-quick-setup-mode]").count()) === 3, "Quick settings, user presets, and random modes were not preserved in the modal", failures);
      record((await page.locator("#cpdQuickSetupDialog .cpd-profile-card").count()) === 6, "Quick settings modal did not expose the six communication goals", failures);
      await page.click('[data-journey-profile="inform"]');
      const fiveStageProfileState = await page.evaluate(() => window.PromptDeckCommonPrompt.getState());
      record(fiveStageProfileState?.schemaVersion === "4.0" && fiveStageProfileState?.journey?.profileId === "inform", "Quick setting did not apply schema 4.0 recommendations", failures);
      record(JSON.stringify(fiveStageProfileState?.frame) === frameBeforeQuick, "Quick setting changed the protected frame geometry", failures);
      await page.click('#cpdQuickSetupDialog .cpd-dialog-close[data-action="close-quick-setup-modal"]');
      record(await page.locator("#cpdQuickSetupDialog").isHidden(), "Quick Start modal did not close after applying a quick setting", failures);
      await page.click('[data-journey-stage="1"]');
      record((await page.locator('#cpdJourneyPanel [data-choice-path^="visualStyle."]').count()) === 3, "Visual-style stage did not expose the three bipolar sliders", failures);
      const fiveStageAxisError = await maxAxisTickAlignmentError(page, '#cpdJourneyPanel [data-choice-axis-range]');
      record(fiveStageAxisError <= 1, `Five-stage slider ticks were misaligned by ${fiveStageAxisError.toFixed(2)}px`, failures);
      await page.click('[data-journey-stage="2"]');
      record((await page.locator('#cpdJourneyPanel [data-path="colors.baseCanvas"]').count()) === 2, "Palette stage omitted the white/palette base-canvas choice", failures);
      record((await page.locator('#cpdJourneyPanel .cpd-palette-card').count()) > 6, "Palette finder did not expose the palette catalog", failures);
      await page.click('[data-journey-stage="3"]');
      record((await page.locator('#cpdJourneyPanel [data-choice-path="typography.emphasis"]').count()) === 1, "Typography stage omitted the result-focused emphasis slider", failures);
      await page.click('[data-journey-stage="4"]');
      record((await page.locator('#cpdJourneyPanel .cpd-resource-card').count()) === 9 && (await page.locator('#cpdJourneyPanel .cpd-resource-card input').count()) === 27, "Visual resource stage did not expose nine tri-state resources", failures);
      record((await page.locator('#cpdJourneyPanel [data-path="composition.layoutFreedom"]').count()) === 0, "Removed layout-freedom question was still visible", failures);
      await page.locator('#cpdJourneyPanel [data-path="resources.dataVisualization"][value="allow"]').check();
      const fiveStagePrompt = await page.evaluate(() => window.PromptDeckCommonPrompt.buildPrompt());
      record(fiveStagePrompt.startsWith("## SLIDE IMAGE VISUAL SPECIFICATION") && fiveStagePrompt.includes("### OUTPUT SIZE AND RESERVED AREAS") && fiveStagePrompt.includes("### CONTENT-BASED COMPOSITION"), "Generated prompt did not use the general five-stage image-specification structure", failures);
      record(fiveStagePrompt.includes("데이터 시각화") && fiveStagePrompt.includes("흰색") && fiveStagePrompt.length <= 2400, `Five-stage prompt omitted selected settings or exceeded 2,400 characters (${fiveStagePrompt.length})`, failures);
      record(!fiveStagePrompt.includes("디자인 DNA") && !fiveStagePrompt.includes("AI 자유도") && !fiveStagePrompt.includes("MECE") && !fiveStagePrompt.includes("발표 시간"), "Generated prompt leaked internal jargon or removed presentation-time metadata", failures);
      await page.click('.cpd-summary [data-action="output-settings"]');
      const outputModeLengths = {};
      for (const mode of ["standard", "compact", "style_lock", "detailed"]) {
        await page.locator(`#cpdOutputSettingsDialog label:has([data-path="project.outputMode"][value="${mode}"])`).click();
        outputModeLengths[mode] = await page.evaluate(() => window.PromptDeckCommonPrompt.buildPrompt().length);
      }
      record(new Set(Object.values(outputModeLengths)).size === 4 && outputModeLengths.compact < outputModeLengths.standard && outputModeLengths.detailed > outputModeLengths.standard, `Output modes did not compile distinct prompt structures (${JSON.stringify(outputModeLengths)})`, failures);
      record((await page.locator('#cpdOutputSettingsDialog .cpd-output-choice-length').count()) === 4, "Output mode cards did not show actual character counts for the current Korean settings", failures);
      await page.locator('#cpdOutputSettingsDialog [data-path="project.promptLanguage"]').selectOption("en");
      const englishOutputModePrompts = {};
      for (const mode of ["standard", "compact", "style_lock", "detailed"]) {
        await page.locator(`#cpdOutputSettingsDialog label:has([data-path="project.outputMode"][value="${mode}"])`).click();
        englishOutputModePrompts[mode] = await page.evaluate(() => window.PromptDeckCommonPrompt.buildPrompt());
      }
      const englishOutputModeLengths = Object.fromEntries(Object.entries(englishOutputModePrompts).map(([mode, prompt]) => [mode, prompt.length]));
      record(new Set(Object.values(englishOutputModePrompts)).size === 4 && englishOutputModeLengths.compact < englishOutputModeLengths.standard && englishOutputModeLengths.detailed > englishOutputModeLengths.standard, `English output modes collapsed to the same prompt (${JSON.stringify(englishOutputModeLengths)})`, failures);
      record(englishOutputModeLengths.standard <= 2400 && englishOutputModeLengths.compact <= 1600 && englishOutputModeLengths.style_lock <= 2200 && englishOutputModeLengths.detailed <= 2800, `English output modes exceeded their character budgets (${JSON.stringify(englishOutputModeLengths)})`, failures);
      record(englishOutputModePrompts.standard.startsWith("## COMMON SLIDE IMAGE VISUAL SPECIFICATION") && englishOutputModePrompts.compact.startsWith("## COMPACT SLIDE IMAGE VISUAL SPECIFICATION") && englishOutputModePrompts.style_lock.startsWith("## DECK-WIDE VISUAL STYLE LOCK") && englishOutputModePrompts.detailed.startsWith("## SLIDE IMAGE VISUAL SPECIFICATION — REVIEW EDITION") && englishOutputModePrompts.detailed.includes("Before finalizing"), "English output modes did not preserve their mode-specific contracts", failures);
      const englishModeLengthLabels = await page.locator('#cpdOutputSettingsDialog .cpd-output-choice-length').allTextContents();
      const englishCardLengths = englishModeLengthLabels.map((text) => text.match(/기준 ([\d,]+)자/)?.[1] || "");
      record(new Set(englishCardLengths).size === 4, `English output mode cards did not show distinct character counts (${JSON.stringify(englishModeLengthLabels)})`, failures);
      await page.locator('#cpdOutputSettingsDialog [data-path="project.promptLanguage"]').selectOption("ko");
      await page.locator('#cpdOutputSettingsDialog label:has([data-path="project.outputMode"][value="standard"])').click();
      await page.click('#cpdOutputSettingsDialog [data-action="apply-output-settings"]');
      const previewOverflow = await page.locator('.cpd-summary-card').evaluate((card) => ({ card: card.scrollWidth - card.clientWidth, budget: (() => { const element = card.querySelector('.cpd-prompt-budget-card'); return element ? element.scrollWidth - element.clientWidth : 0; })() }));
      record(previewOverflow.card <= 1 && previewOverflow.budget <= 1, `Preview summary overflowed horizontally (${JSON.stringify(previewOverflow)})`, failures);
      const slidePreviewBounds = await page.locator('.cpd-preview').evaluate((preview) => {
        const bounds = preview.getBoundingClientRect();
        const outside = [...preview.querySelectorAll('*')].filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && (rect.left < bounds.left - 2 || rect.right > bounds.right + 2 || rect.top < bounds.top - 2 || rect.bottom > bounds.bottom + 2);
        }).map((element) => element.className || element.tagName);
        return {
          overflowX: preview.scrollWidth - preview.clientWidth,
          overflowY: preview.scrollHeight - preview.clientHeight,
          outside,
        };
      });
      record(slidePreviewBounds.overflowX <= 1 && slidePreviewBounds.overflowY <= 1 && slidePreviewBounds.outside.length === 0, `Slide preview content escaped its canvas (${JSON.stringify(slidePreviewBounds)})`, failures);
      await page.click('.cpd-journey-header [data-action="open-quick-setup-modal"]');
      await page.click('#cpdQuickSetupDialog [data-quick-setup-mode="random"]');
      record((await page.locator('#cpdQuickSetupDialog [data-quick-random]').count()) === 3, "Random setup did not expose the three revised scopes", failures);
      const frameBeforeRandom = await page.evaluate(() => JSON.stringify(window.PromptDeckCommonPrompt.getState().frame));
      await page.click('#cpdQuickSetupDialog [data-quick-random="resources"]');
      record((await page.evaluate(() => JSON.stringify(window.PromptDeckCommonPrompt.getState().frame))) === frameBeforeRandom, "Random visual-resource setup changed protected frame geometry", failures);
      await page.click('#cpdQuickSetupDialog .cpd-dialog-close[data-action="close-quick-setup-modal"]');
      if (false) {
      record((await page.locator("#cpdAccordion .cpd-journey-step").count()) === 7, "Common prompt did not render the seven-stage MECE journey", failures);
      record((await page.locator("#cpdQuickSetup").count()) === 1 && await page.locator("#cpdQuickSetup").isVisible(), "Question-reducing quick setup was not visible", failures);
      record((await page.locator("#cpdQuickSetup [data-quick-setup-mode]").count()) === 3, "Quick setup did not expose quick settings, user presets, and random modes", failures);
      record((await page.locator("#cpdAccordion .cpd-profile-card").count()) === 6, "Primary-change start did not expose all six mutually exclusive outcomes", failures);
      const primaryChangeIds = await page.locator("#cpdAccordion .cpd-profile-card").evaluateAll((cards) => cards.map((card) => card.dataset.journeyProfile));
      record(primaryChangeIds.join("|") === "inform|explain|decide|act|teach|inspire", "Primary-change choices were not collectively exhaustive or kept a stable MECE order", failures);
      record((await page.locator("#cpdAccordion .cpd-journey-panel").count()) === 1, "Guided journey rendered more than one active panel", failures);
      record((await page.locator("#cpdAccordion .cpd-profile-card.selected").count()) === 0, "A new project selected a profile before the user chose a type", failures);
      await page.click('[data-journey-profile="inform"]');
      const profileState = await page.evaluate(() => window.PromptDeckCommonPrompt?.getState?.());
      record(profileState?.schemaVersion === "3.5" && profileState?.journey?.profileId === "inform" && profileState?.journey?.profileDirty === false, "Primary-change choice did not apply clean schema 3.5 recommendations", failures);
      record(profileState?.visualDirection?.preset === "custom" && profileState?.visualDirection?.keywords?.includes("명료함"), "Outcome start leaked a domain-specific design preset into the recommendation", failures);
      record(Boolean(profileState?.composition?.profile && profileState?.colors?.presetId && profileState?.typography?.presetId), "One-click profile did not fill composition, color, and typography", failures);
      record(["direction", "composition", "colors", "background", "header", "footer", "typography", "photoComposite"].every((key) => profileState?.sectionEnabled?.[key] !== false), "One-click profile left a required design section disabled", failures);
      await page.click('[data-quick-setup-mode="presets"]');
      await page.locator("#cpdUserPresetName").fill("검증용 기관 보고형");
      await page.click('[data-action="save-user-preset"]');
      const savedPreset = await page.evaluate(() => JSON.parse(localStorage.getItem("promptdeck.commonPromptBuilder.userPresets.v1") || "null"));
      record(savedPreset?.schemaVersion === 1 && savedPreset?.items?.length === 1 && savedPreset.items[0].name === "검증용 기관 보고형", "User preset was not saved in the browser", failures);
      record(!Object.hasOwn(savedPreset?.items?.[0]?.settings || {}, "project") && Boolean(savedPreset?.items?.[0]?.settings?.projectOutput), "User preset stored presentation content instead of design/output settings only", failures);
      const beforeRandom = await page.evaluate(() => {
        const current = window.PromptDeckCommonPrompt.getState();
        return { project: JSON.stringify(current.project), composition: JSON.stringify(current.composition), palette: current.colors.presetId };
      });
      await page.click('[data-quick-setup-mode="random"]');
      record((await page.locator("[data-quick-random]").count()) === 4, "Random setup did not expose full, structure, palette, and media scopes", failures);
      await page.click('[data-quick-random="palette"]');
      const afterPaletteRandom = await page.evaluate(() => {
        const current = window.PromptDeckCommonPrompt.getState();
        return { project: JSON.stringify(current.project), composition: JSON.stringify(current.composition), palette: current.colors.presetId, textContrast: window.PromptDeckPaletteCatalog.contrast(current.colors.textPrimary, current.colors.background) };
      });
      record(afterPaletteRandom.palette && afterPaletteRandom.palette !== beforeRandom.palette, "Palette-only random setup did not assign a new palette", failures);
      record(afterPaletteRandom.project === beforeRandom.project && afterPaletteRandom.composition === beforeRandom.composition, "Palette-only random setup changed presentation content or layout structure", failures);
      record(afterPaletteRandom.textContrast >= 4.5, "Random palette did not preserve readable text contrast", failures);
      await page.click('[data-quick-setup-mode="presets"]');
      await page.click('[data-user-preset-apply]');
      const restoredPresetState = await page.evaluate(() => window.PromptDeckCommonPrompt.getState());
      record(restoredPresetState?.colors?.presetId === beforeRandom.palette && JSON.stringify(restoredPresetState?.composition) === beforeRandom.composition, "Applying a user preset did not restore its design settings", failures);
      record(JSON.stringify(restoredPresetState?.project) === beforeRandom.project, "Applying a user preset changed project-specific presentation content", failures);
      page.once("dialog", (dialog) => dialog.accept());
      await page.click('[data-user-preset-delete]');
      record((await page.locator("[data-user-preset-card]").count()) === 0, "Deleting a user preset did not update the preset list", failures);
      await page.click('[data-quick-setup-mode="quick"]');
      await page.setViewportSize({ width: 390, height: 844 });
      const quickSetupMobile = await page.locator("#cpdQuickSetup").evaluate((element) => ({
        overflow: element.scrollWidth - element.clientWidth,
        minTabHeight: Math.min(...[...element.querySelectorAll("[data-quick-setup-mode]")].map((button) => button.getBoundingClientRect().height)),
      }));
      record(quickSetupMobile.overflow <= 1, `Quick setup overflowed the mobile viewport by ${Math.round(quickSetupMobile.overflow)}px`, failures);
      record(quickSetupMobile.minTabHeight >= 44, "Quick setup mode tabs were smaller than the mobile touch target", failures);
      await page.setViewportSize({ width: 1440, height: 1200 });
      record((await page.locator("#cpdJourneyPanel .cpd-brief-choice").count()) === 5, "Context stage did not retain five non-overlapping audience axes", failures);
      await page.locator('#cpdJourneyPanel [data-brief-path="project.audienceRole"][data-brief-value="실행 담당자"]').click();
      await page.locator('#cpdJourneyPanel [data-brief-path="project.audienceLevel"][data-brief-value="practitioner"]').click();
      await page.locator('#cpdJourneyPanel [data-brief-path="project.audienceStance"][data-brief-value="skeptical"]').click();
      await page.locator('#cpdJourneyPanel [data-brief-path="project.readingMode"][data-brief-value="hybrid"]').click();
      const adjustedProfileState = await page.evaluate(() => window.PromptDeckCommonPrompt?.getState?.());
      record(adjustedProfileState?.project?.audienceRole === "실행 담당자" && adjustedProfileState?.project?.audienceLevel === "practitioner" && adjustedProfileState?.project?.audienceStance === "skeptical" && adjustedProfileState?.project?.readingMode === "hybrid", "Context axes did not update their independent state fields", failures);
      record(adjustedProfileState?.journey?.profileDirty === true && (await page.locator(".cpd-journey-header > em").textContent()).includes("수정됨"), "Adjusted profile recommendations were still presented as untouched defaults", failures);
      await page.locator("#cpdJourneyPanel .cpd-brief-details > summary").click();
      await page.locator('#cpdJourneyPanel [data-path="project.audience"]').fill("경상북도 지자체 관계자");
      await page.locator('#cpdJourneyPanel [data-path="project.presentationPurpose"]').fill("지역 산업 현황 보고와 정책 우선순위 설득");
      await page.locator('#cpdJourneyPanel [data-path="project.desiredAction"]').fill("핵심 정책과제 우선 추진에 합의");
      record((await page.evaluate(() => window.PromptDeckCommonPrompt?.getState?.().project?.audienceRole)) === "실행 담당자", "Entering a concrete audience erased the independently selected audience role", failures);
      await page.locator("#cpdJourneyPanel .cpd-brief-strategy > summary").click();
      await page.locator('#cpdJourneyPanel [data-path="project.currentPerception"]').fill("생산 규모가 지역 경쟁력이라고 생각");
      await page.locator('#cpdJourneyPanel [data-path="project.targetPerception"]').fill("소재와 순환의 연결성이 핵심 경쟁력이라고 판단");
      await page.locator('#cpdJourneyPanel [data-path="project.keyBarrier"]').fill("기업과 시설을 개별 성과로 보는 관점");
      await page.locator('#cpdJourneyPanel [data-path="project.governingThought"]').fill("경북은 생산과 순환을 연결하는 소재 허브로 전환해야 한다");
      await page.click('[data-journey-stage="1"]');
      record((await page.locator('#cpdJourneyPanel [data-path^="visualDirection."][data-number-radio="true"]').count()) === 20, "Design direction did not expose four five-choice identity questions", failures);
      record((await page.locator('#cpdJourneyPanel [data-path="visualDirection.geometry"], #cpdJourneyPanel [data-path="visualDirection.depth"]').count()) === 0, "Geometry or depth remained duplicated inside design identity", failures);
      record((await page.locator('#cpdJourneyPanel [data-path^="composition."]').count()) === 0, "Structure decisions remained duplicated inside design identity", failures);
      record((await page.locator("#cpdJourneyPanel .cpd-direction-outcome").count()) === 1, "Design identity did not expose a live outcome interpretation", failures);
      record((await page.locator("#cpdJourneyPanel .cpd-outcome-technique").count()) === 5, "Design outcome did not translate identity into five visual techniques", failures);
      record((await page.locator("#cpdJourneyPanel .cpd-mini-slide").count()) === 1 && (await page.locator("#cpdJourneyPanel .cpd-direction-outcome").textContent()).includes("슬라이드에 반영되는 현재 기법"), "Design outcome did not expose an expected-slide preview and implementation explanation", failures);
      await page.locator('#cpdJourneyPanel [data-path="visualDirection.authority"][value="5"]').check();
      record((await page.evaluate(() => window.PromptDeckCommonPrompt?.getState?.().visualDirection?.authority)) === 5, "Clicking an identity option did not update design direction", failures);
      await page.waitForTimeout(20);
      record(await page.evaluate(() => document.activeElement?.matches?.('#cpdJourneyPanel [data-path="visualDirection.authority"][value="5"]')), "Full journey refresh did not restore keyboard focus to the changed choice", failures);
      record((await page.locator('#cpdJourneyPanel [data-action="apply-identity-grammar"]').count()) === 1, "Identity changes did not reveal the recommended-technique alignment action", failures);
      await page.locator('#cpdJourneyPanel [data-action="apply-identity-grammar"]').click();
      const identityTechniquesAligned = await page.locator("#cpdJourneyPanel .cpd-outcome-technique").evaluateAll((elements) => elements.length === 5 && elements.every((element) => element.dataset.current === element.dataset.recommended));
      record(identityTechniquesAligned && (await page.locator("#cpdJourneyPanel .cpd-direction-outcome-head > em").textContent()).includes("5/5"), "Applying the identity recommendation did not align the final visual grammar", failures);
      await page.locator('#cpdJourneyPanel .cpd-journey-advanced > summary').click();
      await page.locator('#cpdJourneyPanel [data-path="visualDirection.conceptKeywords"]').fill("신뢰, 연결, 정밀");
      await page.locator('#cpdJourneyPanel [data-path="visualDirection.signatureMotif"]').fill("연결되는 궤적");
      record(await page.locator("#cpdJourneyPanel .cpd-inspiration-starter").isVisible(), "Random inspiration was not moved into advanced design editing", failures);
      const mecePrompt = await page.evaluate(() => window.PromptDeckCommonPrompt?.buildPrompt?.() || "");
      record(mecePrompt.includes("### 덱 디자인 선언과 디자인 DNA") && mecePrompt.includes("### 시각 문법·일관성·레이아웃 변주"), "MECE prompt omitted design identity or visual grammar", failures);
      record(mecePrompt.includes("연결되는 궤적") && !mecePrompt.includes("geometry=") && !mecePrompt.includes("depth="), "Design DNA still emitted duplicated geometry or depth axes", failures);
      await page.setViewportSize({ width: 390, height: 844 });
      const journeyPanelBox = await page.locator("#cpdJourneyPanel").boundingBox();
      const clickChoiceOverflow = await page.locator("#cpdJourneyPanel .cpd-click-question-list").first().evaluate((element) => element.scrollWidth - element.clientWidth);
      const directionOutcomeOverflow = await page.locator("#cpdJourneyPanel .cpd-direction-outcome").evaluate((element) => element.scrollWidth - element.clientWidth);
      const directionPreviewBox = await page.locator("#cpdJourneyPanel .cpd-mini-slide").boundingBox();
      record(Boolean(journeyPanelBox && journeyPanelBox.x >= 0 && journeyPanelBox.x + journeyPanelBox.width <= 390), "Guided design panel overflowed the mobile viewport", failures);
      record(clickChoiceOverflow <= 1, `Click-choice groups overflowed mobile by ${Math.round(clickChoiceOverflow)}px`, failures);
      record(directionOutcomeOverflow <= 1 && Boolean(directionPreviewBox && directionPreviewBox.x >= 0 && directionPreviewBox.x + directionPreviewBox.width <= 390), "Identity outcome preview overflowed the mobile viewport", failures);
      record(await page.locator("#cpdMobileJourneyBar").isVisible(), "Context-aware mobile journey bar was hidden", failures);
      await page.setViewportSize({ width: 1440, height: 1200 });
      await page.click('[data-journey-stage="2"]');
      record((await page.locator('#cpdJourneyPanel [data-path="composition.formLanguage"], #cpdJourneyPanel [data-path="composition.surfaceLanguage"]').count()) === 8, "Structure stage did not own the form and surface decisions", failures);
      record((await page.locator('#cpdJourneyPanel [data-path="composition.container"], #cpdJourneyPanel [data-path="composition.layoutFreedom"], #cpdJourneyPanel [data-path="composition.density"]').count()) === 9, "Structure stage omitted its three independent layout axes", failures);
      await page.click('[data-journey-stage="3"]');
      record((await page.locator('#cpdJourneyPanel [data-palette-intent]').count()) === 6 && (await page.locator('#cpdJourneyPanel [data-palette-easy-filter]').count()) === 12, "Color and type stage omitted impression choices or plain-language palette filters", failures);
      const journeyPalettePromptBefore = await page.evaluate(() => window.PromptDeckCommonPrompt?.buildPrompt?.() || "");
      await page.click('#cpdJourneyPanel [data-palette-intent="trust"]');
      record((await page.locator('#cpdJourneyPanel [data-palette-intent="trust"]').getAttribute("aria-pressed")) === "true" && (await page.locator('#cpdJourneyPanel .cpd-palette-card').count()) > 0, "Palette impression did not activate a non-empty recommendation set", failures);
      await page.locator('#cpdJourneyPanel [data-color-query]').fill('신뢰감 있는 파란색, 너무 차갑지 않게');
      await page.click('#cpdJourneyPanel [data-action="color-search"]');
      const naturalPaletteNames = await page.locator('#cpdJourneyPanel .cpd-palette-card-title strong').allTextContents();
      record(naturalPaletteNames.length > 0 && naturalPaletteNames.slice(0, 6).some((name) => /블루|인디고|마린|시안/.test(name)), "Natural-language palette search did not prioritize an explicitly requested color family", failures);
      const journeyPalettePromptAfter = await page.evaluate(() => window.PromptDeckCommonPrompt?.buildPrompt?.() || "");
      record(journeyPalettePromptAfter === journeyPalettePromptBefore, "Palette recommendation or search controls leaked into the final image prompt", failures);
      await page.click('#cpdJourneyPanel [data-action="reset-palette-filters"]');
      await page.locator('#cpdJourneyPanel .cpd-palette-more-filters > summary').click();
      await page.click('#cpdJourneyPanel [data-palette-easy-filter="temperature"][data-palette-easy-value="cool"]');
      record((await page.locator('#cpdJourneyPanel .cpd-active-palette-filters').textContent()).includes("온도: 차가운 쪽"), "Plain-language temperature refinement did not show its active condition", failures);
      await page.click('#cpdJourneyPanel [data-action="reset-palette-filters"]');
      record((await page.locator('#cpdJourneyPanel [data-typography-preset]').count()) >= 6, "Color and type stage omitted typography presets", failures);
      await page.click('[data-journey-stage="4"]');
      record((await page.locator('#cpdJourneyPanel [data-photo-policy-level]').count()) === 3 && (await page.locator('#cpdJourneyPanel [data-photo-policy-scope]').count()) === 3, "Media stage omitted the unified photo availability or scope policy", failures);
      record((await page.locator('#cpdJourneyPanel [data-choice-path="photoComposite.mode"], #cpdJourneyPanel [data-choice-path="background.photoMode"]').count()) === 0, "Media stage exposed duplicate content/background photo availability controls", failures);
      record((await page.locator('#cpdJourneyPanel [data-path="photoComposite.visualRole"]').count()) === 5, "Media stage did not expose five mutually exclusive visual-resource roles", failures);
      record((await page.locator('#cpdJourneyPanel .cpd-zone-preview').count()) === 1, "Image and surface stage omitted the zoned background preview", failures);
      await page.click('#cpdJourneyPanel [data-photo-policy-level="preferred"]');
      await page.click('#cpdJourneyPanel [data-photo-policy-scope="both"]');
      await page.locator('#cpdJourneyPanel [data-design-advanced="photoComposite"] > summary').click();
      await page.locator('#cpdJourneyPanel [data-path="composition.primaryVisualLanguage"]').selectOption("photo");
      await page.click('#cpdJourneyPanel [data-photo-policy-level="off"]');
      const disabledPhotoState = await page.evaluate(() => window.PromptDeckCommonPrompt?.getState?.());
      record(disabledPhotoState?.photoComposite?.mode === "off" && disabledPhotoState?.background?.photoMode === "off" && disabledPhotoState?.composition?.allowPhotography === false && disabledPhotoState?.composition?.primaryVisualLanguage === "adaptive", "Turning photography off left a conflicting photo resource or visual language enabled", failures);
      record((await page.locator('#cpdJourneyPanel [data-path="composition.primaryVisualLanguage"] option[value="photo"]').count()) === 0, "Photo visual language remained selectable while the unified photo policy was off", failures);
      await page.click('#cpdJourneyPanel [data-photo-policy-level="preferred"]');
      await page.click('#cpdJourneyPanel [data-photo-policy-scope="both"]');
      await page.locator('#cpdJourneyPanel [data-path="composition.primaryVisualLanguage"]').selectOption("data");
      await page.locator('#cpdJourneyPanel [data-path="composition.secondaryVisualLanguage"]').selectOption("data");
      const mediaPolicyState = await page.evaluate(() => window.PromptDeckCommonPrompt?.getState?.());
      record(mediaPolicyState?.photoComposite?.mode === "preferred" && mediaPolicyState?.background?.photoMode === "preferred", "Unified photo policy did not map both scopes atomically", failures);
      record(mediaPolicyState?.composition?.primaryVisualLanguage === "data" && mediaPolicyState?.composition?.secondaryVisualLanguage === "none", "Duplicate primary and secondary visual languages were not resolved", failures);
      await page.click('[data-journey-stage="5"]');
      record((await page.locator('#cpdJourneyPanel [data-page-number-location]').count()) === 3, "Frame stage omitted the single page-number location control", failures);
      record((await page.locator('#cpdJourneyPanel [data-path="header.showPageNumber"], #cpdJourneyPanel [data-path="footer.showPageNumber"]').count()) === 0, "Header or footer still exposed duplicate page-number toggles", failures);
      record((await page.locator('#cpdJourneyPanel [data-path="footer.type"] option[value="page"], #cpdJourneyPanel [data-footer-profile="page"]').count()) === 0, "Footer information type still duplicated the global page-number choice", failures);
      await page.click('#cpdJourneyPanel [data-page-number-location="footer"]');
      const pageNumberState = await page.evaluate(() => window.PromptDeckCommonPrompt?.getState?.());
      record(pageNumberState?.header?.showPageNumber === false && pageNumberState?.footer?.showPageNumber === true, "Page-number location did not update header and footer atomically", failures);
      record((await page.locator('#cpdJourneyPanel [data-header-profile]').count()) >= 5 && (await page.locator('#cpdJourneyPanel [data-footer-profile]').count()) >= 5, "Frame stage omitted header or footer presets", failures);
      record((await page.locator('#cpdJourneyPanel [data-canvas-preset]').count()) === 6, "Frame stage omitted canvas presets", failures);
      await page.click('[data-journey-stage="6"]');
      record((await page.locator('#cpdJourneyPanel [data-path="project.targetModel"]').count()) === 3, "Output stage omitted model choices", failures);
      record((await page.locator('#cpdJourneyPanel [data-path="project.outputMode"]').count()) === 4, "Output stage omitted output modes", failures);
      record((await page.locator('#cpdJourneyPanel [data-section-toggle="constraints"]').count()) === 1, "Output stage omitted optional quality protection", failures);
      await page.locator('#cpdJourneyPanel [data-path="project.targetModel"][value="gpt_image"]').check();
      await page.locator('#cpdJourneyPanel [data-path="project.outputMode"][value="standard"]').check();
      record((await page.locator("#cpdAccordion .cpd-accordion-status.complete").count()) === 0, "Redundant configured labels returned in the guided journey", failures);
      }
    }
    await page.click('.cpd-summary-actions [data-action="send-generator"]');
    await page.waitForSelector("#paneGenerator.active");
    await page.locator("#genAdvancedSettings").evaluate((el) => { el.open = true; });
    const linkedPromptPackage = await page.evaluate(() => window.PromptDeckSlidePromptGenerator?.getCommonPromptPackage?.());
    const headerFooterContract = await page.evaluate(() => ({
      version: window.PromptDeckHeaderFooterContract?.version,
      headerReserved: window.PromptDeckHeaderFooterContract?.reserved?.header?.map((item) => item.key),
      footerReserved: window.PromptDeckHeaderFooterContract?.reserved?.footer?.map((item) => item.key),
      customKey: window.PromptDeckHeaderFooterContract?.canonicalFieldKey?.("헤더 세션번호", "header"),
      titleKey: window.PromptDeckHeaderFooterContract?.canonicalFieldKey?.("헤더 2단계 제목", "header"),
    }));
    record(headerFooterContract.version === "1.1", "PromptDeck header/footer contract was not loaded before the generator", failures);
    record(!headerFooterContract.headerReserved?.includes("__slide_title") && headerFooterContract.footerReserved?.includes("__page_number"), "PromptDeck reserved header/footer fields did not leave title values to the skill", failures);
    record(headerFooterContract.customKey === "custom:header:세션번호", "PromptDeck did not canonicalize a declared custom header category", failures);
    record(headerFooterContract.titleKey === "__slide_title", "PromptDeck did not recognize the skill-defined second-level header title", failures);
    record(linkedPromptPackage?.schemaVersion === 1 && linkedPromptPackage?.contractVersion === "4.0", "Common Prompt did not send the five-stage contract 4.0", failures);
    record(
      linkedPromptPackage?.designContractVersion === "4.0"
        && linkedPromptPackage?.plannerContractVersion === "3.6"
        && linkedPromptPackage?.skillPresetContractVersion === "1.0",
      "Common Prompt did not separate design, planner, and skill–preset contract versions",
      failures
    );
    const skillPresetResolverProbe = await page.evaluate(() => {
      const contract = window.PromptDeckSkillPresetContract;
      return {
        plannerCurrent: contract?.versions?.plannerCurrent,
        supports35: contract?.isPlannerVersionSupported?.("3.5"),
        supports36: contract?.isPlannerVersionSupported?.("3.6"),
        migratedLegacyVersions: contract?.parseContractVersions?.("", { contractVersion: "3.5" }),
        presetCannotLock: contract?.resolveCompositionAuthority?.({
          declaredAuthority: "open",
          safetyFloor: "open",
          presetPreference: "locked",
        }),
        safetyCanGuide: contract?.resolveCompositionAuthority?.({
          declaredAuthority: "open",
          safetyFloor: "guided",
          presetPreference: "open",
        }),
      };
    });
    record(
      skillPresetResolverProbe.plannerCurrent === "3.6"
        && skillPresetResolverProbe.supports35 === true
        && skillPresetResolverProbe.supports36 === true
        && skillPresetResolverProbe.migratedLegacyVersions?.designContractVersion === "4.0"
        && skillPresetResolverProbe.migratedLegacyVersions?.plannerContractVersion === "3.5"
        && skillPresetResolverProbe.presetCannotLock?.key === "open"
        && skillPresetResolverProbe.presetCannotLock?.presetAffectsAuthority === false
        && skillPresetResolverProbe.safetyCanGuide?.key === "guided",
      "Shared skill–preset resolver did not preserve skill priority or the safety floor",
      failures
    );
    record(linkedPromptPackage?.designPackage?.schemaVersion === 11 && Boolean(linkedPromptPackage?.designPackage?.settings?.visualResources) && Boolean(linkedPromptPackage?.designPackage?.settings?.frame), "Common Prompt did not send the five-stage visual package schema", failures);
    record(!Object.hasOwn(linkedPromptPackage?.designPackage?.project || {}, "audienceRole") && !Object.hasOwn(linkedPromptPackage?.designPackage?.project || {}, "secondsPerSlide"), "Common Prompt package retained presentation content or timing metadata", failures);
    const linkedSkillPresetContract = linkedPromptPackage?.designPackage?.settings?.skillPresetContract;
    record(
      linkedPromptPackage?.designPackage?.settings?.compositionGrammar?.layoutFreedom
        && linkedPromptPackage?.designPackage?.settings?.contentBasedComposition === true,
      "Design package omitted the composition-authority grammar needed for skill precedence",
      failures
    );
    record(
      linkedSkillPresetContract?.version === "1.0"
        && linkedSkillPresetContract?.precedence?.[1] === "skill-content-semantics"
        && linkedSkillPresetContract?.ownership?.skill?.includes("compositionAuthority")
        && linkedSkillPresetContract?.ownership?.preset?.includes("imageTreatment")
        && linkedSkillPresetContract?.preset?.minimumRequiredTraits >= 2,
      "Common Prompt package omitted the structured skill–preset ownership and precedence contract",
      failures
    );
    record(
      ["cover", "agenda", "divider", "closing"].every((role) => linkedSkillPresetContract?.preset?.roleVariants?.[role]?.motifPhase)
        && linkedSkillPresetContract?.specialPageInheritance?.skillOwned?.includes("macroComposition"),
      "Skill–preset contract omitted special-page role variants or selective inheritance",
      failures
    );
    record(Boolean(linkedPromptPackage?.designPackage?.settings?.visualStyle) && linkedPromptPackage?.designPackage?.settings?.lowContentFocalPresence === true, "Design package omitted visual style or sparse-content focal presence", failures);
    record(linkedPromptPackage?.targetModel === "gpt_image", "Common Prompt target model was not linked to the generator", failures);
    record(linkedPromptPackage?.enabledSlots?.contractVersion === "1.1", "Header/footer contract version was not linked through PromptPackage", failures);
    record(typeof linkedPromptPackage?.enabledSlots?.header?.enabled === "boolean" && typeof linkedPromptPackage?.enabledSlots?.footer?.enabled === "boolean", "Header/footer slot state was not linked to the generator", failures);
    const optionalPhotoCommonPrompt = await page.locator("#genCommonPrompt").inputValue();
    record(optionalPhotoCommonPrompt.includes("Surface") && !optionalPhotoCommonPrompt.match(/팔레트[^\n]*…/), "Common Prompt truncated palette role colors", failures);
    record(optionalPhotoCommonPrompt.includes("내용이 적을수록") && optionalPhotoCommonPrompt.includes("시각적 존재감"), "Common Prompt did not encode the low-content focal-presence rule", failures);
    await page.locator("#genSplitRules").fill("slide|^##\\s+슬라이드\\s+(\\d{2})\\.\\s*(.+)$");
    await page.locator("#genMdInput").fill(`## 슬라이드 01. 정책 추진 방향
### 본문
추상적인 정책 개념과 추진 원칙을 설명합니다.`);
    await page.click("#genGenerateBtn");
    await page.waitForFunction(() => document.querySelector("#genResultBadge")?.textContent === "1 prompts");
    const linkedRecord = await page.evaluate(() => window.PromptDeckSlidePromptGenerator?.getRecords?.()[0]);
    record(linkedRecord?.targetModel === "gpt_image" && linkedRecord?.generationPath === "full_slide", "Generator record did not carry model and generation-path metadata", failures);
    const optionalPhotoSlidePrompt = await page.locator("#genOutput").textContent();
    record(optionalPhotoSlidePrompt.includes("## AI 비주얼 디렉터"), "Generator did not add the AI visual-director directive", failures);
    record(!optionalPhotoSlidePrompt.includes("슬라이드별 실사 합성 요구사항") && optionalPhotoSlidePrompt.includes("설득력을 높이지 않는 자원은 생략"), "Generator still forced a slide-specific photo role", failures);

    const commonDesignMarker = optionalPhotoCommonPrompt
      .split(/\r?\n/)
      .find((line) => line.includes("CONTENT-BASED COMPOSITION"))
      ?.trim();
    record(Boolean(commonDesignMarker), "Special-slide scope test could not find a stable common-prompt marker", failures);
    record(await page.locator("#genSpecialSlidesOwnDesign").isChecked(), "Special-slide individual-design mode was not enabled by default", failures);
    await page.locator("#genMdInput").fill(`# 덱 메타데이터 〔헤더·푸터 표시용 전역 데이터〕
- 기관명: 테스트 기관
- 페이지 번호 정책: 전체

## 슬라이드 01. 프로젝트 표지
### 표현 방식 〔화면 비표시〕
- 페이지 유형: 표지
- 정보 밀도: C1 핵심만 인지
- 데이터 시각화 강도: V0 비데이터 비주얼 주도
### 콘텐츠 〔화면 표시〕
- 제목: 프로젝트 표지
- 부제: 실행 우선순위와 의사결정 기준
- 기관명: 표지 표시 기관

## 슬라이드 02. 발표 목차
### 표현 방식 〔화면 비표시〕
- 페이지 유형: 목차
- 정보 밀도: C2 근거까지 이해
- 데이터 시각화 강도: V0 비데이터 비주얼 주도
### 콘텐츠 〔화면 표시〕
- 목차 제목: 발표 흐름
- 세션 1: 추진 배경 — 변화 필요성 확인
- 세션 2: 실행 전략 — 우선순위 결정
- 세션 3: 이행 계획 — 착수 조건 합의

## 슬라이드 03. 본문 근거, 상태 구분
### 핵심 주제·목적 〔화면 비표시〕
- 도식 핵심 판단: 중심 기능이 두 보완 기능의 역할을 결속해 하나의 정책 판단 단위로 관리
- 목표 판단 또는 행동: 세 기능을 개별 목록이 아니라 중심–보완 구조로 검토
### 표현 방식 〔화면 비표시〕
- 페이지 유형: 본문
- 정보 밀도: C3 비교·분석
- 데이터 시각화 강도: V3 다변량 분석
- 도식 유형: 네트워크·생태계
- 도식 복잡도: D2
- 논증 경로: 중심 역할 → 두 보완 역할 → 통합 관리 판단
- 관계 구조: 노드 01 — 노드 02, 노드 01 — 노드 03
- 관계 레이블 적용 범위: 전체 관계
### 콘텐츠 〔화면 표시〕
- 주장 헤드라인: 중심 기능과 두 보완 기능, 하나의 관리 단위
- 노드 01: 중심 기능 | 역할구: 두 보완 역할 결속
- 노드 02: 보완 기능 A | 역할구: 실행 역량 보완
- 노드 03: 보완 기능 B | 역할구: 적용 범위 보완
- 관계 EDGE-01: 노드 01 — 노드 02 | 관계 동사: 실행 역량 결속
- 관계 EDGE-02: 노드 01 — 노드 03 | 관계 동사: 적용 범위 결속
- 결론 귀착점: 중심–보완 구조의 통합 관리
### 품질 조건 〔화면 비표시〕
- 관계 지위: 정책 설계 관계이며 직접 인과·달성 성과를 의미하지 않음
- 의미 무결성: 세 역할구와 두 관계 동사가 통합 관리 판단을 지지
- 3초 재진술: 중심 역할이 두 보완 역할을 결속하는 관리 구조로 복원
- 구조 무결성: 노드 3개·방향 없는 연결 2개
- 허용 연결: 노드 01 — 노드 02 | 노드 01 — 노드 03
- 금지 연결: 노드 02 — 노드 03 0개
- 화살촉 규칙: 전체 연결의 화살촉 0개

## 슬라이드 04. 실행 전략
### 표현 방식 〔화면 비표시〕
- 페이지 유형: 간지
- 정보 밀도: C1 핵심만 인지
- 데이터 시각화 강도: V0 비데이터 비주얼 주도
### 콘텐츠 〔화면 표시〕
- 파트명: 실행 전략
- 전환 메시지: 필요성 확인에서 실행 우선순위 결정으로

## 슬라이드 05. 맺음말
### 표현 방식 〔화면 비표시〕
- 페이지 유형: 클로징
- 정보 밀도: C1 핵심만 인지
- 데이터 시각화 강도: V0 비데이터 비주얼 주도
### 콘텐츠 〔화면 표시〕
- 결론: 실행 우선순위 확정이 전환의 출발점
- 기억점 1: 변화 필요성 확인
- 기억점 2: 실행축 우선순위 합의
- 요청: 1단계 실행안 승인`);
    await page.click("#genGenerateBtn");
    await page.waitForFunction(() => window.PromptDeckSlidePromptGenerator?.getRecords?.().length === 5);
    const specialScopeRecords = await page.evaluate(() => window.PromptDeckSlidePromptGenerator.getRecords());
    const specialRecords = specialScopeRecords.filter((item) => ["cover", "agenda", "divider", "closing"].includes(item.pageType));
    const bodyRecord = specialScopeRecords.find((item) => item.pageType === "body");
    record(specialRecords.length === 4, `Generator did not identify all four special slide roles (actual: ${specialRecords.length})`, failures);
    record(specialScopeRecords.map((item) => item.visualPresence?.key).join(",") === "strong,balanced,structured,strong,strong", "Generator did not derive visual presence from page role and C-density", failures);
    record(specialScopeRecords.every((item) => item.prompt.includes("## 정보 밀도 → 비주얼 존재감")), "A slide prompt omitted the derived visual-presence directive", failures);
    record(specialRecords.every((item) => item.prompt.includes("V0는 비주얼 약화가 아니라 비데이터 비주얼 주도형")), "V0 special slides were not protected from visually weak interpretation", failures);
    record(specialRecords.every((item) => item.commonPromptApplied === false && item.prompt.includes("특수 슬라이드 디자인 적용 범위")), "Special slides did not switch to their individual design specification", failures);
    record(specialRecords.every((item) => item.prompt.includes("압축 덱 정체성 브리지") && item.prompt.includes("P #")), "Special slides did not retain the compact deck identity bridge", failures);
    record(specialRecords.every((item) => item.prompt.includes("스킬–프리셋 시각 계약") && item.prompt.includes("스킬의 의미·증거·관계·구성 잠금") && item.prompt.includes("색상만 바꾼 결과로 축소하지 않고")), "Special slides omitted the resolved skill-first preset contract", failures);
    record(specialRecords.every((item) => item.prompt.includes("시각 시그니처") && item.prompt.includes("프리셋 정체성")), "Special slides did not selectively inherit the preset's non-color identity", failures);
    record(specialRecords.every((item) => item.prompt.includes("특수 슬라이드 구현 계약")), "A special slide omitted the role-specific implementation contract", failures);
    record(specialRecords.find((item) => item.pageType === "cover")?.prompt.includes("발표 범위와 약속의 첫인상"), "Cover implementation did not preserve the first-impression task", failures);
    record(specialRecords.find((item) => item.pageType === "cover")?.prompt.includes("모티프 단계=introduce"), "Cover did not introduce the preset motif through its role variant", failures);
    record(specialRecords.find((item) => item.pageType === "agenda")?.prompt.includes("권장 개요 구조는"), "Agenda implementation did not preserve the relationship-fit overview task", failures);
    record(specialRecords.find((item) => item.pageType === "agenda")?.prompt.includes("대형 번호·타이포 인덱스"), "Agenda did not select a compact typographic index for three parallel sessions", failures);
    record(specialRecords.find((item) => item.pageType === "agenda")?.prompt.includes("모티프 단계=organize"), "Agenda did not organize the preset motif through its role variant", failures);
    record(specialRecords.find((item) => item.pageType === "divider")?.prompt.includes("하나의 전환 동사"), "Divider implementation did not preserve the transition gesture", failures);
    record(specialRecords.find((item) => item.pageType === "divider")?.prompt.includes("모티프 단계=transform"), "Divider did not transform the preset motif through its role variant", failures);
    record(specialRecords.find((item) => item.pageType === "closing")?.prompt.includes("최종 판단 또는 다음 행동"), "Closing implementation did not preserve the convergence task", failures);
    record(specialRecords.find((item) => item.pageType === "closing")?.prompt.includes("모티프 단계=resolve"), "Closing did not resolve the preset motif through its role variant", failures);
    record(specialRecords.every((item) => item.headerFooterApplied === false && item.prompt.includes("화면 비표시·전체 캔버스") && !item.prompt.includes("테스트 기관") && !item.prompt.includes("페이지 번호 표기값")), "A special slide retained header/footer metadata or omitted the full-canvas policy", failures);
    record(bodyRecord?.headerFooterApplied === true && bodyRecord?.prompt.includes("테스트 기관") && bodyRecord?.prompt.includes("페이지 번호 표기값: 03 / 05"), "The body slide lost its enabled header/footer metadata", failures);
    record(specialRecords.every((item) => !item.prompt.includes("프레임 연속성")), "The compact special-slide bridge still imported header/footer frame continuity", failures);
    record(specialRecords.every((item) => item.generationPath === "full_slide"), "Generation-path derivation did not keep low-burden special slides on the full-slide route", failures);
    record(bodyRecord?.generationPath === "precision_full_slide" && bodyRecord?.prompt.includes("정밀 일체형"), "V3 data burden did not switch the body slide to the precision full-slide route", failures);
    record(bodyRecord?.compositionAutonomy?.key === "guided" && bodyRecord?.prompt.includes("구성 위임 수준: 읽기 방향 가이드"), "D2/V3 body slide did not derive guided composition autonomy", failures);
    record(bodyRecord?.prompt.includes("스킬–프리셋 시각 계약") && bodyRecord?.prompt.includes("본문 역할: 스킬은 정보의 의미를 소유"), "Body slide omitted the skill-first preset resolution contract", failures);
    record(bodyRecord?.prompt.includes("## AI 비주얼 디렉터") && bodyRecord?.prompt.includes("노드 형태·공간 배치·방향·연결선 경로·레이어·매체는 자유롭게 재설계"), "Structured diagram skipped the AI visual director or kept its geometry over-locked", failures);
    record(bodyRecord?.prompt.indexOf("## 개별 슬라이드 의미 브리프") < bodyRecord?.prompt.indexOf("## AI 비주얼 디렉터"), "Final prompt did not place the semantic brief before AI composition decisions", failures);
    const bodyContextIndex = bodyRecord?.prompt.indexOf("## 발표 맥락 및 세션 위치") ?? -1;
    const bodyCommonIndex = bodyRecord?.prompt.indexOf("## SLIDE IMAGE VISUAL SPECIFICATION") ?? -1;
    const bodySemanticIndex = bodyRecord?.prompt.indexOf("## 개별 슬라이드 의미 브리프") ?? -1;
    record(bodyCommonIndex >= 0 && bodyCommonIndex < bodySemanticIndex && (bodyContextIndex < 0 || bodyContextIndex < bodyCommonIndex), "Final prompt did not preserve the optional context → common visual specification → individual semantic layers", failures);
    record(!bodyRecord?.prompt.includes("후속 합성") && !bodyRecord?.prompt.includes("BACKGROUND VISUAL ONLY"), "The precision full-slide route still requested a separate composition stage", failures);
    record(bodyRecord?.title.includes("상태 구분") && bodyRecord?.pageType === "body", "An ordinary use of the word '구분' overrode the explicitly declared body page type", failures);
    record(bodyRecord?.diagramPlan?.code === "D2" && bodyRecord?.diagramPlan?.semanticReady === true && bodyRecord?.prompt.includes("다이어그램 의미·무결성 계약") && bodyRecord?.prompt.includes("목표 판단 또는 행동") && bodyRecord?.prompt.includes("관계 동사") && bodyRecord?.prompt.includes("3초 재진술") && bodyRecord?.prompt.includes("관계 레이블 적용 범위") && bodyRecord?.prompt.includes("금지 연결") && bodyRecord?.prompt.includes("화살촉 규칙"), "Diagram meaning, complexity, or integrity guidance was not preserved in the final slide prompt", failures);
    const diagramMeaningContract = await page.evaluate(() => window.PromptDeckQualityLoop.extractDiagramContract(window.PromptDeckSlidePromptGenerator.getRecords().find((item) => item.pageType === "body")?.prompt || ""));
    record(diagramMeaningContract.semanticReady === true && diagramMeaningContract.topologyReady === true, `Meaning-first diagram contract did not pass (warnings: ${diagramMeaningContract.warnings.join(" / ")})`, failures);
    const vagueDiagramContract = await page.evaluate(() => window.PromptDeckQualityLoop.extractDiagramContract(`
- 도식 유형: 네트워크·생태계
- 도식 복잡도: D2
- 관계 구조: 노드 01 — 노드 02
- 관계 레이블 적용 범위: 전체 관계
- 구조 무결성: 노드 2개·방향 없는 연결 1개
- 주장 헤드라인: 2개 기능의 생태계 작동 구조
`));
    record(vagueDiagramContract.topologyReady === true && vagueDiagramContract.semanticReady === false && vagueDiagramContract.semanticWarnings.length >= 4, "A topology-only abstract diagram incorrectly passed the semantic gate", failures);
    record(specialScopeRecords.every((item) => Boolean(item.generationPlan?.reasonKo)), "Generator records did not expose generation-path reasons", failures);
    record(specialRecords.every((item) => !item.prompt.includes("아래 공통 디자인 시스템과 개별 슬라이드 명세") && !item.prompt.includes("using the Common Design System")), "A special slide retained a common-design execution instruction", failures);
    if (commonDesignMarker) {
      record(specialRecords.every((item) => !item.prompt.includes(commonDesignMarker)), "A special slide still contained the common design prompt", failures);
      record(Boolean(bodyRecord?.prompt.includes(commonDesignMarker)), "A body slide lost the common design prompt", failures);
    }
    record((await page.locator("#genSpecialSlidesScopeStatus").textContent()).includes("4장"), "Special-slide detection status did not report four slides", failures);
    await page.locator(".gen-special-slide-toggle").click();
    await page.waitForFunction(() => window.PromptDeckSlidePromptGenerator.getRecords().every((item) => item.commonPromptApplied));
    const allCommonRecords = await page.evaluate(() => window.PromptDeckSlidePromptGenerator.getRecords());
    record(allCommonRecords.every((item) => !item.prompt.includes("특수 슬라이드 디자인 적용 범위")), "Disabling individual special-slide design did not restore common-design mode", failures);
    record(allCommonRecords.filter((item) => ["cover", "agenda", "divider", "closing"].includes(item.pageType)).every((item) => item.headerFooterApplied === false && !item.prompt.includes("테스트 기관") && !item.prompt.includes("페이지 번호 표기값")), "Special slides regained header/footer metadata when common-design mode was enabled", failures);
    await page.locator(".gen-special-slide-toggle").click();

    await page.click("#tabBtnDesigner");
    await page.waitForSelector("#paneDesigner.active");

    const agendaLayoutLabels = await page.evaluate(() => getAllowedOptionsForPageType("content", "agenda").map((item) => item.text));
    record(
      agendaLayoutLabels.slice(0, 7).join("|") === "대형 번호·타이포 인덱스|다중 열 목차|그룹·계층 목차|시간·담당 목차|텍스트·비주얼 분할 목차|진행 강조 내비게이터|매트릭스·모자이크 목차",
      `Agenda-specific layout choices were missing or not prioritized (actual: ${agendaLayoutLabels.slice(0, 7).join("|")})`,
      failures
    );
    const bodyLayoutLabels = await page.evaluate(() => getAllowedOptionsForPageType("content", "body").map((item) => item.text));
    record(!bodyLayoutLabels.includes("진행 강조 내비게이터"), "Agenda-only layout choices leaked into body slides", failures);

    // ----------------------------------------------------
    // Slide Prompt Generator Regression Test
    // ----------------------------------------------------
    await page.click("#btnCopyEn");
    await page.waitForTimeout(100);
    record((await page.locator("#genCommonPrompt").getAttribute("data-prompt-lang")) === "en", "English prompt copy did not preserve its language for the generator", failures);
    await page.evaluate(() => {
      window.pptState.colorSystem.primary = "#FF0000";
    });

    await page.click("#tabBtnGenerator");
    await page.waitForSelector("#paneGenerator.active");
    record((await page.locator("#paneGenerator .gen-result-stack > #tabActions").count()) === 1, "Generator quick actions were not mounted in an independent result column", failures);
    record((await page.locator("#paneGenerator .gen-result-stack > .gen-result-section").count()) === 1, "Generator result panel was not kept as a sibling of the quick action dock", failures);
    await page.locator("#genMdInput").fill("");
    record((await page.locator("#genPlannerTemplateBtn").textContent()).trim() === "작성 예시 넣기", "Planner example action still used internal template terminology", failures);
    record((await page.locator("#genPlannerConvertBtn").textContent()).trim() === "기획안 자동 정리", "Planner conversion action was not described as a user task", failures);
    record(await page.locator("#genPlannerConvertBtn").isDisabled(), "Planner conversion action was enabled before any MD was entered", failures);
    record((await page.locator("#genPlannerContractTitle").textContent()).trim() === "이미지 생성 준비 상태", "Planner status panel still exposed the internal contract name", failures);
    record(await page.locator("#genPlannerContractMetrics").isHidden(), "Empty planner state still displayed five unexplained zero metrics", failures);
    record(await page.locator("#genPlannerContractOptions").isHidden(), "Empty planner state still exposed advanced quality controls", failures);
    await page.click("#genPlannerTemplateBtn");
    const semanticTemplate = await page.locator("#genMdInput").inputValue();
    record(semanticTemplate.includes("promptdeck_contract: 3.6") && semanticTemplate.includes("skill_preset_contract: 1.0") && semanticTemplate.includes("# 발표 맥락 〔화면 비표시·모든 슬라이드 전달〕") && semanticTemplate.includes("# 세션 설계 〔화면 비표시·모든 슬라이드 전달〕") && semanticTemplate.includes("### 양식 〔화면 표시·헤더/푸터〕") && semanticTemplate.includes("헤더 1단계 파트:") && semanticTemplate.includes("헤더 2단계 제목:") && semanticTemplate.includes("헤더 3단계 부제:") && semanticTemplate.includes("### 핵심 주제·목적 〔화면 비표시〕") && semanticTemplate.includes("### 콘텐츠 〔화면 표시〕") && semanticTemplate.includes("### 표현 방식 〔화면 비표시〕") && semanticTemplate.includes("비주얼 존재감: 균형 강조형") && semanticTemplate.includes("구성 위임 수준: 의미만 고정") && semanticTemplate.includes("잠금 항목:") && semanticTemplate.includes("가이드 항목:") && semanticTemplate.includes("자유 항목:") && semanticTemplate.includes("구성 잠금 이유:") && semanticTemplate.includes("프리셋 적용 범위:") && semanticTemplate.includes("의미 그룹과 관계:") && semanticTemplate.includes("핵심 강조 대상:") && semanticTemplate.includes("### 품질 조건 〔화면 비표시〕"), "Planner example did not use the five-section MECE contract 3.6 and skill–preset authority fields", failures);
    record((await page.locator("#genPlannerContractBadge").textContent()).includes("생성 준비 완료"), "Planner MECE example was not accepted as generation-ready", failures);
    record(!semanticTemplate.includes("### 시각화 명세") && !semanticTemplate.includes("### 이미지 장면 명세") && !semanticTemplate.includes("픽셀 좌표"), "Planner example over-specified visual composition details", failures);
    await page.locator("#genMdInput").fill(`## 슬라이드 01. 전환 필요성
### 본문 콘텐츠
- 현황과 목표의 격차를 설명한다.`);
    await page.click("#genPlannerConvertBtn");
    const convertedSemanticMd = await page.locator("#genMdInput").inputValue();
    record(convertedSemanticMd.includes("promptdeck_contract: 3.6") && convertedSemanticMd.includes("skill_preset_contract: 1.0") && convertedSemanticMd.includes("### 양식 〔화면 표시·헤더/푸터〕") && convertedSemanticMd.includes("헤더 2단계 제목:") && convertedSemanticMd.includes("### 핵심 주제·목적 〔화면 비표시〕") && convertedSemanticMd.includes("인식 변화:") && convertedSemanticMd.includes("핵심 장벽:") && convertedSemanticMd.includes("### 콘텐츠 〔화면 표시〕") && convertedSemanticMd.includes("### 표현 방식 〔화면 비표시〕") && convertedSemanticMd.includes("비주얼 존재감:") && convertedSemanticMd.includes("구성 위임 수준:") && convertedSemanticMd.includes("잠금 항목:") && convertedSemanticMd.includes("가이드 항목:") && convertedSemanticMd.includes("자유 항목:") && convertedSemanticMd.includes("구성 잠금 이유:") && convertedSemanticMd.includes("프리셋 적용 범위:") && convertedSemanticMd.includes("의미 그룹과 관계:") && convertedSemanticMd.includes("비주얼 논증:") && convertedSemanticMd.includes("핵심 강조 대상:") && convertedSemanticMd.includes("### 품질 조건 〔화면 비표시〕"), "Planner conversion did not produce MECE contract 3.6 and skill–preset authority fields", failures);
    record(!convertedSemanticMd.includes("허용 레이아웃 계열") && !convertedSemanticMd.includes("공간 예산") && !convertedSemanticMd.includes("픽셀 좌표:"), "Planner conversion emitted deterministic micro-layout geometry", failures);
    await page.locator("#genMdInput").fill(`## 슬라이드 04. 실행 전략 간지
### 화면 표시 콘텐츠
- 파트명: III. 실행 전략
- 전환 메시지: 필요성 확인에서 실행 우선순위 결정으로`);
    await page.click("#genPlannerConvertBtn");
    const convertedDividerMd = await page.locator("#genMdInput").inputValue();
    record(convertedDividerMd.includes("### 양식 〔화면 비표시·전체 캔버스〕") && convertedDividerMd.includes("앞 세션 결론:") && convertedDividerMd.includes("다음 세션 질문:") && convertedDividerMd.includes("전환 이유:") && convertedDividerMd.includes("단일 시각 제스처:") && convertedDividerMd.includes("페이지 변주:"), "Planner conversion did not carry the divider implementation contract", failures);
    record(!convertedDividerMd.includes("헤더 2단계 제목:") && !convertedDividerMd.includes("푸터 출처:"), "Planner conversion added header/footer fields to a special slide", failures);
    const duplicateRules = [
      "slide|^##\\s+슬라이드\\s+(\\d{2})\\.\\s*(.+)$",
      "slide|^##\\s+슬라이드\\s+(\\d{2})\\.\\s*(.+)$",
    ].join("\n");
    await page.locator("#genSplitRules").fill(duplicateRules);
    await page.locator("#genMdInput").fill(`# 헤더·푸터 슬롯 정의 〔화면 비표시〕
- 헤더 카테고리: 세션번호, 파트번호, 프로그램명
- 푸터 카테고리: 검토등급

# 덱 메타데이터 〔헤더·푸터 표시용 전역 데이터〕
- 발표자료명: 지역혁신사업 추진계획
- 기관명: 샘플혁신지원센터
- 발표 일자: 2026.07.14.
- 헤더 프로그램명: 지역혁신 포럼
- 헤더 세션번호: GLOBAL SESSION
- 푸터 반복 문구: 지역혁신사업 추진계획

# 발표 맥락 〔화면 비표시·모든 슬라이드 전달〕
- 발표 대상: 경상북도 정책 의사결정자
- 청중 수준: 의사결정자
- 발표 목적: 지역혁신사업의 실행 우선순위 보고
- 발표 후 원하는 판단 또는 행동: 핵심 실행과제 승인
- 청중의 현재 인식: 실행과제를 부서별 사업 목록으로 이해
- 발표 후 목표 인식: 핵심 실행과제를 공동 우선순위로 판단
- 핵심 인식 장벽: 부서별 책임과 공동 성과의 연결이 보이지 않음
- Governing Thought: 핵심 실행과제를 공동 일정과 지표로 추진해야 한다.

# 세션 설계 〔화면 비표시·모든 슬라이드 전달〕
## 세션 1. 실행 근거 · 슬라이드 01–02
- 세션 역할: 핵심 실행 근거를 두 장으로 증명
- 청중의 핵심 질문: 무엇을 우선 실행해야 하는가?
- 세션 결론: 지역혁신 핵심과제를 우선 추진한다.
- 다음 세션 연결: 근거 확인 → 실행 승인

# 전체 전달 전략 〔화면 비표시〕
- 내부 메모: DO-NOT-INJECT-STRATEGY

## 슬라이드 01. 첫 번째
- 헤더 세션번호: SESSION 03
- 헤더 파트번호: PART 2
- 푸터 검토등급: 내부 검토
### 헤더
유지할 헤더
### 레이아웃
유지할 레이아웃
### 본문
SLIDE-ONE-CONTENT
### 발표자 스크립트
REMOVE-THIS-SCRIPT
### 근거 데이터
KEEP-THIS-EVIDENCE

---

## 슬라이드 02. 두 번째
### 본문
SLIDE-TWO-CONTENT`);
    record(!(await page.locator("#genPlannerConvertBtn").isDisabled()), "Planner conversion action did not activate after MD input", failures);
    record(!(await page.locator("#genPlannerContractMetrics").isHidden()), "Planner readiness metrics did not appear after MD input", failures);
    record(!(await page.locator("#genPlannerContractOptions").isHidden()), "AI visual-director explanation did not become available after MD input", failures);
    record((await page.locator("#genPlannerContractOptions").textContent()).includes("3초 이해도") && (await page.locator("#genPlannerContractOptions").textContent()).includes("증거 적합성"), "AI visual-director decision criteria were not explained in the UI", failures);
    record((await page.locator("#genPlannerContractOptions input[type='checkbox']").count()) === 0, "AI visual-director UI still exposed manual composition toggles", failures);
    record((await page.locator("#genPlannerContractMetrics").textContent()).includes("주제·목적") && (await page.locator("#genPlannerContractMetrics").textContent()).includes("표현 방식") && (await page.locator("#genPlannerContractMetrics").textContent()).includes("품질 조건"), "Planner readiness metrics did not reflect the MECE contract", failures);
    await page.setViewportSize({ width: 390, height: 844 });
    record(await page.locator("#genPlannerContractOptions .gen-director-contract").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length) === 1, "AI visual-director responsibility map did not collapse on mobile", failures);
    await page.setViewportSize({ width: 1440, height: 1200 });
    const generatorPreviewText = await page.locator("#genSplitRulesPreview").textContent();
    record(generatorPreviewText.includes("SLIDE-ONE-CONTENT"), "Split preview did not show the first slide content", failures);
    record(generatorPreviewText.includes("KEEP-THIS-EVIDENCE"), "Split preview removed valid content after presenter notes", failures);
    record(!generatorPreviewText.includes("REMOVE-THIS-SCRIPT"), "Split preview included the presenter script section", failures);
    await page.click("#genHeaderFooterSettingsBtn");
    const dynamicHeaderFooterFields = await page.locator("#genHeaderFooterModal .gen-modal-body").textContent();
    record(dynamicHeaderFooterFields.includes("헤더 세션번호") && dynamicHeaderFooterFields.includes("헤더 파트번호") && dynamicHeaderFooterFields.includes("푸터 검토등급"), "Dynamic header/footer categories from the skill file were not detected", failures);
    record(dynamicHeaderFooterFields.includes("프로그램명"), "A declared global header category was not added to the settings UI", failures);
    await page.click("#genHeaderFooterModal button[data-close-header-footer-modal]");
    const generatorCommonPrompt = await page.locator("#genCommonPrompt").inputValue();
    record(generatorCommonPrompt.startsWith("## COMMON DESIGN SYSTEM"), "Copied common prompt did not start at the H2 common-design level", failures);
    record(/(^|\n)###\s+/.test(generatorCommonPrompt), "Common prompt detail sections were not demoted to H3", failures);
    record(!/(^|\n)---(?:\n|$)/.test(generatorCommonPrompt), "Copied common prompt still included decorative horizontal rules", failures);
    await page.click("#genGenerateBtn");
    await page.waitForFunction(() => document.querySelector("#genResultBadge")?.textContent === "2 prompts");
    record((await page.locator(".gen-slide-item").count()) === 2, "Overlapping split rules produced duplicate slide records", failures);

    const firstGeneratorOutput = await page.locator("#genOutput").textContent();
    record(!firstGeneratorOutput.includes("REMOVE-THIS-SCRIPT"), "Presenter script section was not excluded from the slide prompt", failures);
    record(firstGeneratorOutput.includes("KEEP-THIS-EVIDENCE"), "A valid section after presenter notes was removed", failures);
    record(firstGeneratorOutput.includes("# FINAL SLIDE IMAGE GENERATION TASK"), "Generated prompt did not include the top-level slide image execution task", failures);
    record(firstGeneratorOutput.includes("authoring labels, Markdown, codes, notes, and control metadata invisible"), "Generated prompt did not prohibit visible authoring metadata", failures);
    record(firstGeneratorOutput.includes("Render only user-facing content"), "Generated prompt did not separate authoring labels from visible content", failures);
    record(firstGeneratorOutput.includes("only enabled header/footer values") && firstGeneratorOutput.includes("computed page number"), "Generated prompt did not constrain deck metadata to enabled header/footer slots", failures);
    record(firstGeneratorOutput.includes("## COMMON DESIGN SYSTEM"), "Generated prompt did not include the common design system at H2", failures);
    record(firstGeneratorOutput.includes("## AI VISUAL DIRECTOR"), "Generated prompt omitted the AI visual-director stage", failures);
    record(firstGeneratorOutput.includes("Silently compare 2–3 materially different treatments") && firstGeneratorOutput.includes("3-second comprehension"), "AI visual director did not compare alternatives by persuasion criteria", failures);
    record(!firstGeneratorOutput.includes("SLIDE-SPECIFIC LAYOUT ASSIGNMENT") && !firstGeneratorOutput.includes("Assigned family:"), "Generated prompt still included a deterministic layout assignment", failures);
    record(firstGeneratorOutput.includes("## 슬라이드 01. 첫 번째"), "Generated prompt did not preserve the individual slide at H2", failures);
    record(firstGeneratorOutput.includes("발표자료명: 지역혁신사업 추진계획") && firstGeneratorOutput.includes("기관명: 샘플혁신지원센터") && firstGeneratorOutput.includes("발표 일자: 2026.07.14."), "Generator did not inject global deck metadata into the individual slide prompt", failures);
    record(firstGeneratorOutput.includes("발표 맥락 및 세션 위치") && firstGeneratorOutput.includes("발표 대상: 경상북도 정책 의사결정자") && firstGeneratorOutput.includes("청중의 현재 인식: 실행과제를 부서별 사업 목록으로 이해") && firstGeneratorOutput.includes("발표 후 목표 인식: 핵심 실행과제를 공동 우선순위로 판단") && firstGeneratorOutput.includes("핵심 인식 장벽: 부서별 책임과 공동 성과의 연결이 보이지 않음") && firstGeneratorOutput.includes("현재 세션: 세션 1. 실행 근거 · 슬라이드 01–02") && firstGeneratorOutput.includes("세션 역할: 핵심 실행 근거를 두 장으로 증명"), "Generator did not inject audience, strategy, and current-session context into the individual slide prompt", failures);
    record(firstGeneratorOutput.includes("헤더 프로그램명: 지역혁신 포럼") && firstGeneratorOutput.includes("헤더 세션번호: SESSION 03") && firstGeneratorOutput.includes("헤더 파트번호: PART 2") && firstGeneratorOutput.includes("푸터 검토등급: 내부 검토"), "Generator did not preserve flexible header/footer category-value pairs", failures);
    record(!firstGeneratorOutput.includes("헤더 세션번호: GLOBAL SESSION"), "Global header value was not overridden by the slide-specific value of the same category", failures);
    record(!firstGeneratorOutput.includes("헤더 카테고리: 세션번호"), "Header/footer slot definitions leaked into the generated slide prompt", failures);
    record(firstGeneratorOutput.includes("페이지 번호 표기값: 01 / 02"), "Generator did not inject the computed current/total page value", failures);
    record(!firstGeneratorOutput.includes("DO-NOT-INJECT-STRATEGY"), "Generator injected non-metadata preamble content into the slide prompt", failures);
    record(!firstGeneratorOutput.includes("# 공통 프롬프트") && !firstGeneratorOutput.includes("# 개별 슬라이드 내용"), "Generated prompt still used the legacy wrapper headings", failures);
    record(firstGeneratorOutput.indexOf("# FINAL SLIDE IMAGE GENERATION TASK") < firstGeneratorOutput.indexOf("## COMMON DESIGN SYSTEM") && firstGeneratorOutput.indexOf("## COMMON DESIGN SYSTEM") < firstGeneratorOutput.indexOf("## 슬라이드 01. 첫 번째"), "Generated prompt hierarchy was not ordered as execution task, common design system, then individual slide", failures);
    record(!/(^|\n)---(?:\n|$)/.test(firstGeneratorOutput), "Current prompt viewer still displayed decorative horizontal rules", failures);
    record(!firstGeneratorOutput.includes("## SLIDE 01 |") && !firstGeneratorOutput.includes("**TOC:**") && !firstGeneratorOutput.includes("<!-- BEGIN") && !firstGeneratorOutput.includes("<!-- END"), "Current prompt viewer still displayed prompt-management metadata", failures);
    record(!firstGeneratorOutput.includes("# 슬라이드별 사용자 프롬프트"), "Generated prompt still included the duplicated regenerated prompt block", failures);
    record(firstGeneratorOutput.split(generatorCommonPrompt).length - 1 === 1, "Generated prompt repeated the common prompt", failures);
    record(firstGeneratorOutput.split("SLIDE-ONE-CONTENT").length - 1 === 1, "Generated prompt repeated the individual slide content", failures);
    const visualDirectorRecords = await page.evaluate(() => window.PromptDeckSlidePromptGenerator?.getRecords?.() || []);
    record(visualDirectorRecords.length === 2 && visualDirectorRecords.every((record) => !Object.hasOwn(record, "layoutFamily")), "Generator records still exposed assigned layout families", failures);
    const generatorLintText = await page.locator("#genLintList").textContent();
    record(!generatorLintText.includes("핵심 내용이 비어") && !generatorLintText.includes("core slide content to render is empty"), "Generator lint ignored the per-slide MD content", failures);

    await page.click("#genCopyCurrentBtn");
    const copiedCurrentPrompt = await page.evaluate(() => navigator.clipboard.readText());
    record(copiedCurrentPrompt.startsWith("# FINAL SLIDE IMAGE GENERATION TASK"), "Current prompt copy did not start with the actual execution prompt", failures);
    record(!copiedCurrentPrompt.includes("**TOC:**") && !copiedCurrentPrompt.includes("<!-- BEGIN") && !copiedCurrentPrompt.includes("<!-- END"), "Current prompt copy included prompt-management metadata", failures);

    await page.click("#genCopyBtn");
    const copiedDeckPrompts = await page.evaluate(() => navigator.clipboard.readText());
    record(copiedDeckPrompts.includes("SLIDE-ONE-CONTENT") && copiedDeckPrompts.includes("SLIDE-TWO-CONTENT"), "Full prompt copy did not include every generated slide prompt", failures);
    record(copiedDeckPrompts.includes("페이지 번호 표기값: 01 / 02") && copiedDeckPrompts.includes("페이지 번호 표기값: 02 / 02"), "Deck prompt copy did not preserve per-slide page metadata", failures);
    record(!/(^|\n)---(?:\n|$)/.test(copiedDeckPrompts), "Full prompt copy included decorative horizontal rules", failures);
    record(!copiedDeckPrompts.includes("**TOC:**") && !copiedDeckPrompts.includes("<!-- BEGIN") && !copiedDeckPrompts.includes("<!-- END") && !copiedDeckPrompts.includes("# Slide Image Prompts"), "Full prompt copy included prompt-management metadata", failures);

    record(await page.locator("#genSlideList .gen-slide-item").count() === 2, "Generator slide navigation did not render every slide", failures);
    record(await page.locator("#genSlideList button[aria-label*='개별']").count() === 0, "Removed individual settings action was still visible in the slide list", failures);
    record(await page.locator("#genConfigModal").evaluate((el) => el.hasAttribute("hidden")), "Removed individual settings modal was unexpectedly opened", failures);

    await page.locator("#genSplitRules").fill("slide|^##\\s+슬라이드\\s+(\\d+)\\.\\s*(.+)$");
    await page.locator("#genMdInput").fill("## 슬라이드 5. 한 자리 번호\n### 본문\nONE-DIGIT-SLIDE");
    await page.click("#genGenerateBtn");
    await page.locator("#genJumpInput").fill("5");
    await page.click("#genJumpBtn");
    record((await page.locator("#genMessage").textContent()).includes("이동했습니다"), "One-digit slide number could not be found by jump", failures);

    await page.locator("#genSplitRules").fill("slide|^()()");
    await page.locator("#genMdInput").fill("## 슬라이드 01. 빈 매칭 방지");
    await page.click("#genGenerateBtn");
    record((await page.locator("#genMessage").textContent()).includes("빈 문자열과 일치"), "Zero-length split rule was not rejected", failures);

    await page.locator("#genSplitRules").fill("slide|^##\\s+슬라이드\\s+(\\d{2})\\.\\s*(.+)$");
    await page.locator("#genMdInput").fill("## 슬라이드 01. 같은 제목\n### 본문\nOLD-SLIDE-CONTENT");
    await page.click("#genGenerateBtn");
    await page.click("#genEditCurrentBtn");
    await page.locator("#genPromptEditor").fill("STALE-MANUAL-PROMPT");
    await page.click("#genSaveEditBtn");
    await page.locator("#genMdInput").fill("## 슬라이드 01. 같은 제목\n### 본문\nNEW-SLIDE-CONTENT");
    await page.click("#genGenerateBtn");
    const regeneratedOutput = await page.locator("#genOutput").textContent();
    record(!regeneratedOutput.includes("STALE-MANUAL-PROMPT"), "Stale manual prompt survived after the MD content changed", failures);
    record(regeneratedOutput.includes("NEW-SLIDE-CONTENT"), "Regenerated prompt did not include the updated MD content", failures);

    if (!(await page.locator("#genAdvancedSettings").evaluate((el) => el.open))) {
      await page.locator("#genAdvancedSettings > summary").click();
    }
    if (!(await page.locator(".gen-project-tools").evaluate((el) => el.open))) {
      await page.locator(".gen-project-tools > summary").click();
    }
    await page.locator("#genFormat").selectOption("jsonl");
    await page.locator("#genMaxChars").fill("1234");
    const generatorProjectDownloadPromise = page.waitForEvent("download");
    await page.click("#genSaveProjectBtn");
    const generatorProjectDownload = await generatorProjectDownloadPromise;
    const generatorProjectPath = path.join(tempDir, generatorProjectDownload.suggestedFilename());
    await generatorProjectDownload.saveAs(generatorProjectPath);
    const generatorProject = JSON.parse(await fs.readFile(generatorProjectPath, "utf8"));
    record(generatorProject.format === "jsonl", "Generator project did not save the output format", failures);
    record(generatorProject.maxChars === 1234, "Generator project did not save the maximum character limit", failures);
    record(generatorProject.commonPromptLang === "en", "Generator project did not save the common prompt language", failures);
    record(generatorProject.schemaVersion >= 5, "Generator project did not use the common prompt package schema", failures);
    record(generatorProject.commonPromptPackage?.config?.colorSystem?.primary === "#004DB0", "Generator project did not save the configuration captured with the common prompt", failures);
    record(generatorProject.commonPromptPackage?.lang === "en", "Generator project did not save the common prompt package language", failures);
    record(generatorProject.commonPromptPackage?.schemaVersion === 1, "Generator project did not save the unified PromptPackage schema version", failures);
    record(generatorProject.commonPromptPackage?.contractVersion === "legacy", `Generator project did not keep the active common-design contract alias (actual: ${generatorProject.commonPromptPackage?.contractVersion ?? "missing"})`, failures);
    record(generatorProject.commonPromptPackage?.designContractVersion === "legacy" && generatorProject.commonPromptPackage?.plannerContractVersion === "3.6" && generatorProject.commonPromptPackage?.skillPresetContractVersion === "1.0", "Generator project did not preserve the separated contract versions", failures);
    record(generatorProject.plannerEnhancements?.visualDirector === true && !generatorProject.records?.some((item) => Object.hasOwn(item, "layoutAssignment")), "Generator project did not save the visual-director contract cleanly", failures);
    record(generatorProject.specialSlideScope?.individualDesign === true, "Generator project did not save the special-slide design scope", failures);
    record(Boolean(generatorProject.commonPromptPackage?.targetModel), "Generator project did not save the target image model", failures);

    await page.locator("#genFormat").selectOption("markdown");
    await page.locator("#genMaxChars").fill("3600");
    await page.locator("#genLoadProjectInput").setInputFiles(generatorProjectPath);
    await page.waitForFunction(() => document.querySelector("#genFormat")?.value === "jsonl");
    record((await page.locator("#genMaxChars").inputValue()) === "1234", "Generator project load did not restore the maximum character limit", failures);
    record((await page.locator("#genCommonPrompt").getAttribute("data-prompt-lang")) === "en", "Generator project load did not restore the prompt language", failures);
    record(await page.locator("#genSpecialSlidesOwnDesign").isChecked(), "Generator project load did not restore the special-slide design scope", failures);

    await page.click("#tabBtnSlideImage");
    await page.waitForSelector("#paneSlideImage.active");
    await page.click("#slideImageLoadDeckBtn");
    record(!(await page.locator("#slideImageQueueSummary").textContent()).includes("총 0개"), "Slide image queue did not load generated prompts", failures);
    await page.click("#slideImageClearPromptBtn");
    record((await page.locator("#slideImagePrompt").inputValue()) === "", "Slide image prompt clear left prompt text behind", failures);
    record((await page.locator("#slideImageTitle").inputValue()) === "slide-01", "Slide image prompt clear left the previous slide title behind", failures);
    record((await page.locator("#slideImageQueueSummary").textContent()).includes("총 0개"), "Slide image prompt clear left the previous generation queue behind", failures);

    await page.click("#tabBtnGenerator");
    await page.waitForSelector("#paneGenerator.active");
    const minimalProjectPath = path.join(tempDir, "minimal-project.json");
    await fs.writeFile(minimalProjectPath, JSON.stringify({ schemaVersion: generatorProject.schemaVersion, records: [] }), "utf8");
    await page.locator("#genMdInput").fill("GHOST-MARKDOWN");
    await page.locator("#genCommonPrompt").fill("GHOST-COMMON-PROMPT");
    await page.locator("#genLoadProjectInput").setInputFiles(minimalProjectPath);
    await page.waitForFunction(() => document.querySelector("#genMdInput")?.value === "");
    record((await page.locator("#genCommonPrompt").inputValue()) === "", "Loading a project without a common prompt retained the previous prompt", failures);
    record((await page.locator("#genOutput").textContent()) === "", "Loading an empty project retained previous generated output", failures);

    record(await hasLocator(page, "#tabBtnConceptMixer"), "Concept Mixer top-level tab button is missing", failures);
    record(await hasLocator(page, "#paneConceptMixer"), "Concept Mixer top-level pane is missing", failures);
    record(!(await hasLocator(page, "#btnToggleMixer")), "Legacy Concept Mixer toggle still exists inside Concept Suggestion", failures);
    await page.click("#tabBtnConceptMixer");
    await page.waitForSelector("#paneConceptMixer.active");
    record(await hasLocator(page, "#paneConceptMixer #conceptMixerContainer .mixer-workspace"), "Concept Mixer did not initialize in its top-level pane", failures);
    record((await page.locator("#tabBtnConceptMixer").getAttribute("aria-selected")) === "true", "Concept Mixer tab was not marked selected", failures);

    await page.waitForSelector("#tabBtnPromotion");
    await page.click("#tabBtnPromotion");
    await page.waitForSelector("#panePromotion.active");
    record((await page.locator("#panePromotion .promo-result-stack > #tabActions").count()) === 1, "Promotion quick actions were not mounted in an independent result column", failures);
    record((await page.locator("#panePromotion .promo-result-stack > .promo-preview-section").count()) === 1, "Promotion result panel was not kept as a sibling of the quick action dock", failures);

    // 상세 모드 제거에 따라 기본 모드 전용 필드들만 검증하도록 테스트 수정
    record((await page.locator("#promotionAssetBadge").textContent()) === "홍보 이미지", "Promotion tab did not initialize with the unified promotion image mode", failures);
    record(await page.evaluate(() => Boolean(window.PromptDeckPromotionParser?.parse)), "Promotion source parser v3 was not exposed", failures);

    await page.click("#promotionQuickFillBtn");
    await page.waitForSelector("#promotionQuickFillModal:not([hidden])");
    await page.locator("#promotionQuickFillTextarea").fill(`2026년 경북 미래차 부품전환 지원사업 참여기업 모집
사업목적: 지역 자동차부품 기업의 미래차 전환과 사업화를 촉진합니다.
지원대상: 경상북도 소재 자동차부품 중소기업
접수기간: 2026. 8. 12.(수) ~ 2026. 9. 5.(토) 18:00
지원내용:
- 기업당 최대 2,000만원 사업화 지원
- 전문가 컨설팅 제공
신청방법: 온라인 신청 후 서류 제출
문의처: 기업지원팀 054-123-4567, future@example.kr
신청링크: https://example.kr/apply`);
    await page.click("#promotionQuickFillParseBtn");
    await page.waitForSelector("#promotionQuickFillStepPreview:not([hidden])");
    record((await page.locator("#promotionQuickFillPreviewList .promo-quickfill-preview-row").count()) >= 8, "Promotion parser preview did not expose the structured summary fields", failures);
    record((await page.locator("#promotionQuickFillPreviewList .promo-quickfill-origin.is-extracted").count()) >= 2, "Promotion parser preview did not distinguish source-extracted fields", failures);
    record((await page.locator("#promotionQuickFillPreviewList .promo-quickfill-origin.is-summary").count()) >= 2, "Promotion parser preview did not distinguish generated summaries", failures);
    record((await page.locator("#promotionQuickFillPreviewList .promo-quickfill-evidence").count()) >= 5, "Promotion parser preview did not expose source evidence", failures);
    record((await page.locator("#promotionQuickFillAnalysisSummary").textContent()).includes("핵심정보"), "Promotion parser analysis summary was not rendered", failures);
    const promotionParserProbe = await page.evaluate(() => {
      const rows = [...document.querySelectorAll("#promotionQuickFillPreviewList [data-quickfill-key]")];
      return {
        schema: window.PromptDeckPromotionParser.SCHEMA_VERSION,
        body: document.querySelector('[data-quickfill-key="bodyCopy"]')?.closest(".promo-quickfill-preview-row")?.textContent || "",
        uncheckedReviewRows: rows.filter((input) => !input.checked && input.closest(".promo-quickfill-preview-row")?.classList.contains("is-review")).length,
      };
    });
    record(promotionParserProbe.schema === "promotion-source-parser/3.0" && promotionParserProbe.body.includes("2,000만원"), `Promotion parser lost its schema or grounded amount: ${JSON.stringify(promotionParserProbe)}`, failures);
    await page.click("#promotionQuickFillApplyBtn");
    await page.locator("#promotionQuickFillModal").waitFor({ state: "hidden" });
    record((await page.locator("#promotionHeadline").inputValue()).includes("미래차 부품전환"), "Promotion parser did not apply the extracted headline", failures);
    record((await page.locator("#promotionBodyCopy").inputValue()).includes("2,000만원"), "Promotion parser did not apply the grounded body summary", failures);

    await page.locator("#promotionSizeMode").selectOption("direct");
    await page.locator("#promotionDirectSizeW").fill("1080");
    await page.locator("#promotionDirectSizeH").fill("1920");
    await page.locator("#promotionHeadline").fill("주말 설명회 사전 신청");
    await page.locator("#promotionGoal").fill("이벤트 참여 유도");
    await page.locator("#promotionAudience").fill("취업 준비생");
    await page.waitForTimeout(150);
    const directSizePreview = await page.locator("#promotionPromptPreview").inputValue();
    record(directSizePreview.includes("주말 설명회 사전 신청"), "Promotion prompt preview did not reflect the headline", failures);
    record(directSizePreview.includes("Size: 1080×1920 px"), "Promotion prompt preview did not reflect the direct size input", failures);
    record((directSizePreview.match(/컨텐츠 유형:/g) || []).length <= 1, "Promotion prompt preview repeated the content type line", failures);

    if (await hasLocator(page, "#promotionRandomPresetBtn")) {
      await page.click("#promotionRandomPresetBtn");
      await page.waitForTimeout(200);
      record((await page.locator("#promotionHeadline").inputValue()) === "주말 설명회 사전 신청", "Random preset button changed the headline", failures);
      record((await page.locator("#promotionSizeMode").inputValue()) === "direct", "Random preset button changed the size mode", failures);
      record((await page.locator("#promotionDirectSizeW").inputValue()) === "1080", "Random preset button changed the direct width", failures);
      record((await page.locator("#promotionDirectSizeH").inputValue()) === "1920", "Random preset button changed the direct height", failures);
    }

    const enableManualMode = async (field) => {
      const selector = `[data-toggle-mode='${field}'][data-mode='manual']`;
      if (await hasLocator(page, selector)) {
        await page.click(selector);
        await page.waitForTimeout(50);
      }
    };
    await enableManualMode("cta");
    await enableManualMode("posterOffer");
    await enableManualMode("snsHook");
    await enableManualMode("snsHashtags");

    const visibleTextFieldValues = [
      ["#promotionHeadline", "Weekend session signup"],
      ["#promotionSubheadline", "Secure your place before seats run out"],
      ["#promotionBodyCopy", "One-page event overview with speakers and benefits"],
      ["#promotionCta", "Register now"],
    ];
    const visibleTextExpectations = [];
    for (const [selector, value] of visibleTextFieldValues) {
      if (await hasLocator(page, selector)) {
        await page.locator(selector).fill(value);
        visibleTextExpectations.push([selector, value]);
      }
    }
    if (await hasLocator(page, "#promotionPosterOffer")) {
      await page.locator("#promotionPosterOffer").fill("Early registrants receive a networking pass and summary report");
      visibleTextExpectations.push(["#promotionPosterOffer", "Early registrants receive a networking pass and summary report"]);
    }
    if (await hasLocator(page, "#promotionSnsHook")) {
      await page.locator("#promotionSnsHook").fill("Register before seats run out");
      visibleTextExpectations.push(["#promotionSnsHook", "Register before seats run out"]);
    }
    if (await hasLocator(page, "#promotionSnsHashtags")) {
      await page.locator("#promotionSnsHashtags").fill("#event #signup #career");
      visibleTextExpectations.push(["#promotionSnsHashtags", "#event #signup #career"]);
    }

    if (await hasLocator(page, "#promotionResetStyleBtn")) {
      await page.click("#promotionResetStyleBtn");
      await page.waitForTimeout(150);
      for (const [selector, value] of visibleTextExpectations) {
        record((await page.locator(selector).inputValue()) === value, `Style reset unexpectedly changed ${selector}`, failures);
      }
    }

    await page.locator("#promotionGoal").fill("Drive event registration");
    await page.locator("#promotionAudience").fill("Young professionals");

    await page.waitForTimeout(200);
    const basicPreview = await page.locator("#promotionPromptPreview").inputValue();
    console.log("=== DEBUG BASIC PREVIEW ===\n" + basicPreview + "\n===============================");
    record(basicPreview.includes("Design a unified"), "Basic English prompt did not render role header", failures);
    record(basicPreview.includes("[Output]"), "Basic English prompt did not render format header", failures);
    record(basicPreview.includes("[Copy Content]"), "Basic English prompt did not include the copy content section", failures);
    record(basicPreview.includes("[Layered Composition]"), "Promotion prompt did not include the layered-composition contract", failures);
    record(basicPreview.includes("4-5 coordinated semantic layers"), "Promotion prompt did not require coordinated information and visual layers", failures);
    record(basicPreview.includes("not equal-sized slices, stacked bands, or isolated cards"), "Promotion semantic layers could still be interpreted as rigid visual compartments", failures);
    record(basicPreview.includes("Organic integration mode"), "Promotion prompt did not use organic layer integration by default", failures);
    record(basicPreview.includes("Concept-layout precedence: organic integration overrides"), "Applied concept layout rules could still override organic integration", failures);
    record(!(await page.locator("#promotionLayoutStrict").isChecked()), "Promotion layout still defaulted to strict zone separation", failures);

    await enableManualMode("layoutComposition");
    await page.click("[data-layout-choice='custom']");
    const setPromotionWeight = async (selector, value) => {
      await page.locator(selector).evaluate((input, nextValue) => {
        input.value = nextValue;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }, String(value));
    };
    await setPromotionWeight("#promotionLayoutWeightTitle", 20);
    await setPromotionWeight("#promotionLayoutWeightVisual", 45);
    await setPromotionWeight("#promotionLayoutWeightInfo", 35);
    await page.waitForFunction(() => document.querySelector("#promotionPromptPreview")?.value.includes("USER EMPHASIS PROFILE"));
    const customEmphasisPreview = await page.locator("#promotionPromptPreview").inputValue();
    record(customEmphasisPreview.includes("relative visual influence, not geometric partitions"), "Custom promotion weights were not interpreted as relative visual influence", failures);
    record(customEmphasisPreview.includes("key visual presence 45/100"), "Custom promotion prompt did not preserve the requested visual emphasis", failures);
    record(customEmphasisPreview.includes("adapt locally to actual copy volume"), "Custom promotion prompt did not harmonize requested emphasis with real content volume", failures);
    record(!/(?:% of canvas|occupy approximately|Canvas allocation target)/i.test(customEmphasisPreview), "Custom promotion prompt still converted emphasis scores into rigid canvas acreage", failures);

    await page.click("#promotionViewerToggleBtn");
    await page.waitForTimeout(150);
    await page.locator("#promotionPromptPreview").fill(`${basicPreview}\n\n## 메모\n직접 편집 테스트`);
    await page.evaluate(() => document.getElementById("promotionCopyPromptBtn").click());
    await page.waitForTimeout(250);
    const copiedPrompt = await page.evaluate(() => navigator.clipboard.readText());
    record(copiedPrompt.includes("직접 편집 테스트"), "Promotion copy did not include the edited prompt draft", failures);

    await page.click("#promotionResetPromptBtn");
    await page.waitForTimeout(150);
    const resetPrompt = await page.locator("#promotionPromptPreview").inputValue();
    record(!resetPrompt.includes("직접 편집 테스트"), "Promotion prompt reset did not restore the auto-generated draft", failures);

    const download = page.waitForEvent("download");
    await page.click("#promotionSaveBtn");
    const promotionDownload = await download;
    const promotionPath = path.join(tempDir, promotionDownload.suggestedFilename());
    await promotionDownload.saveAs(promotionPath);
    const promotionData = JSON.parse(await fs.readFile(promotionPath, "utf8"));
    record(promotionData.mode === "promotion", `Unexpected promotion mode: ${promotionData.mode}`, failures);
    record(promotionData.promotionState?.assetType === "image", "Promotion settings did not capture the unified asset type", failures);

    await page.click("#promotionResetBtn");
    await page.waitForTimeout(150);
    await page.locator("#promotionLoadInput").setInputFiles(promotionPath);
    await page.waitForSelector("#promotionSnsHashtags");
    await page.waitForFunction(
      (expectedGoal) => {
        const input = document.querySelector("#promotionGoal");
        return input && input.value === expectedGoal;
      },
      promotionData.promotionState?.goal
    );
    record((await page.locator("#promotionHeadline").inputValue()) === promotionData.promotionState?.headline, "Promotion load did not restore the headline", failures);
    record((await page.locator("#promotionGoal").inputValue()) === promotionData.promotionState?.goal, "Promotion load did not restore the goal", failures);

    const photoPromotionPath = path.join(tempDir, "promotion-photo-layering.json");
    const photoPromotionData = structuredClone(promotionData);
    photoPromotionData.promotionState.antiAiStyle = "photo_real";
    photoPromotionData.promotionState.layoutStrictSeparation = "false";
    photoPromotionData.promotionState.appliedConceptStyle = "photorealistic documentary campaign photography with natural light";
    await fs.writeFile(photoPromotionPath, JSON.stringify(photoPromotionData), "utf8");
    await page.locator("#promotionLoadInput").setInputFiles(photoPromotionPath);
    await page.waitForFunction(() => document.querySelector("#promotionPromptPreview")?.value.includes("Photographic layering:"));
    const photoLayeredPreview = await page.locator("#promotionPromptPreview").inputValue();
    record(photoLayeredPreview.includes("2D editorial overlays"), "Photoreal promotion prompt did not integrate editorial information layers", failures);
    record(photoLayeredPreview.includes("never holograms or translucent 3D interfaces"), "Photoreal promotion prompt did not distinguish editorial layers from fake 3D UI", failures);
    record(!photoLayeredPreview.includes("translucent layer stacking"), "Photoreal exclusions still prohibited all translucent layer composition", failures);

    const vectorPromotionPath = path.join(tempDir, "promotion-vector-layering.json");
    const vectorPromotionData = structuredClone(promotionData);
    vectorPromotionData.promotionState.antiAiStyle = "flat_vector";
    vectorPromotionData.promotionState.layoutStrictSeparation = "false";
    vectorPromotionData.promotionState.appliedConceptStyle = "flat vector editorial performance infographic";
    vectorPromotionData.promotionState.appliedConceptDesc = "비실사 성과 인포그래픽";
    vectorPromotionData.promotionState.appliedConceptPromotionPrompt = "Use no photography. Build a flat vector data narrative with integrated visual motifs.";
    await fs.writeFile(vectorPromotionPath, JSON.stringify(vectorPromotionData), "utf8");
    await page.locator("#promotionLoadInput").setInputFiles(vectorPromotionPath);
    await page.waitForFunction(() => document.querySelector("#promotionPromptPreview")?.value.includes("Give the hero visual supporting depth"));
    const vectorLayeredPreview = await page.locator("#promotionPromptPreview").inputValue();
    record(!vectorLayeredPreview.includes("Photographic layering:"), "Explicitly non-photographic promotion concept was misclassified as photographic", failures);
    record(vectorLayeredPreview.includes("integrated information graphics"), "Non-photographic promotion prompt lost its layered information-graphic guidance", failures);

    if (await hasLocator(page, "#promotionOmitEmptyFields")) {
      await page.locator("#promotionOmitEmptyFields").setChecked(true);
      await page.waitForTimeout(150);
      record(!(await page.locator("#promotionPromptPreview").inputValue()).includes("미입력"), "Promotion prompt preview still showed placeholders after omit-empty-fields", failures);
    }

    await page.click("#tabBtnFormImage");
    await page.waitForSelector("#paneFormImage.active");
    record((await page.locator("#paneFormImage .form-image-result-stack > #tabActions").count()) === 1, "Form-image quick actions were not mounted in an independent result column", failures);
    record((await page.locator("#paneFormImage .form-image-result-stack > .form-image-result-panel").count()) === 1, "Form-image result panel was not kept as a sibling of the quick action dock", failures);
    await page.locator("#formImageTitle").fill("GHOST-FORM-TITLE");
    await page.waitForTimeout(100);
    await page.locator("#formImagePromptViewer .form-image-section-edit-btn").first().click();
    await page.click("#formImageResetBtn");
    await page.waitForTimeout(100);
    record(!(await page.locator("#formImagePromptPreview").inputValue()).includes("GHOST-FORM-TITLE"), "Form image reset retained prior prompt text", failures);
    record(!(await page.locator("#formImagePromptViewer").textContent()).includes("GHOST-FORM-TITLE"), "Form image reset left an inline-edited prompt section visible", failures);

    await page.click("#tabBtnLabelSheet");
    await page.waitForSelector("#paneLabelSheet.active");
    const selectLabelGoal = async (goal) => {
      const openDrawer = page.locator("#paneLabelSheet .label-sheet-workspace-drawer:not([hidden])");
      if (await openDrawer.count()) {
        await openDrawer.locator("[data-label-workspace-drawer-close]").first().click();
        await page.waitForFunction(() => !document.querySelector("#paneLabelSheet .label-sheet-workspace-drawer:not([hidden])"));
      }
      await page.locator(`[data-label-workspace-goal="${goal}"]`).click();
      await page.waitForFunction((value) => document.querySelector("#paneLabelSheet")?.dataset.outputGoal === value, goal);
    };
    const generateLabelPrompt = async () => {
      const target = page.locator("#labelSheetGeneratePromptBtn");
      if (await target.isVisible()) await target.click();
      else await page.locator('#tabActions [data-proxy-target="labelSheetGeneratePromptBtn"]').click();
      await page.waitForSelector("#labelSheetWorkspaceReviewDrawer:not([hidden])");
    };
    const closeLabelReview = async () => {
      const drawer = page.locator("#labelSheetWorkspaceReviewDrawer:not([hidden])");
      if (!await drawer.count()) return;
      await drawer.locator("[data-label-workspace-drawer-close]").first().click();
      await page.waitForSelector("#labelSheetWorkspaceReviewDrawer", { state: "hidden" });
    };
    const openLabelDetail = async () => {
      if (await page.locator("#labelSheetWorkspaceDetailDrawer:not([hidden])").count()) return;
      const openDrawer = page.locator("#paneLabelSheet .label-sheet-workspace-drawer:not([hidden])");
      if (await openDrawer.count()) {
        await openDrawer.locator("[data-label-workspace-drawer-close]").first().click();
        await page.waitForFunction(() => !document.querySelector("#paneLabelSheet .label-sheet-workspace-drawer:not([hidden])"));
      }
      await page.click("#labelSheetWorkspaceDetailBtn");
      await page.waitForSelector("#labelSheetWorkspaceDetailDrawer:not([hidden])");
    };
    const closeLabelDetail = async () => {
      const drawer = page.locator("#labelSheetWorkspaceDetailDrawer:not([hidden])");
      if (!await drawer.count()) return;
      await drawer.locator("[data-label-workspace-drawer-close]").first().click();
      await page.waitForSelector("#labelSheetWorkspaceDetailDrawer", { state: "hidden" });
    };
    const selectLabelDocumentType = async (value) => {
      await page.evaluate((documentType) => {
        const radio = document.querySelector(`input[name="labelSheetIntentDocumentType"][value="${documentType}"]`);
        if (!radio) throw new Error(`Missing label-sheet document type: ${documentType}`);
        radio.checked = true;
        radio.dispatchEvent(new Event("change", { bubbles: true }));
      }, value);
    };
    const selectHiddenLabelValue = async (selector, value) => {
      await page.evaluate(({ selector: controlSelector, value: nextValue }) => {
        const control = document.querySelector(controlSelector);
        if (!control) throw new Error(`Missing label-sheet control: ${controlSelector}`);
        control.value = nextValue;
        control.dispatchEvent(new Event("change", { bubbles: true }));
      }, { selector, value });
    };
    record((await page.locator("#paneLabelSheet .label-sheet-workspace-actions > #tabActions").count()) === 1, "Label-sheet quick actions were not mounted in the workspace project bar", failures);
    record((await page.locator("#paneLabelSheet.label-sheet-workspace-v7[data-label-workspace-layout-ready='true'] .label-sheet-workspace-frame").count()) === 1, "Label-sheet V7 workspace shell did not initialize", failures);
    record((await page.locator("[data-label-workspace-history-command]").count()) === 4 && (await page.locator("[data-label-workspace-mode]").count()) === 2, "Label-sheet desktop history or layout/data modes were not exposed", failures);
    record((await page.locator(".label-sheet-workspace-context-toolbar [data-label-sheet-nudge]").count()) === 0 && (await page.locator("#labelSheetWorkspaceDetailDrawer .label-sheet-workspace-precision-tools [data-label-sheet-nudge]").count()) === 4, "Label-sheet low-frequency precision tools were not moved into the detail dialog", failures);
    const labelEntryState = await page.evaluate(() => {
      const count = window.PromptDeckLabelSheet?.getProject()?.records?.length || 0;
      const entry = document.querySelector("#labelSheetWorkspaceEntry");
      const frame = document.querySelector("#paneLabelSheet .label-sheet-workspace-frame");
      const buttons = Array.from(entry?.querySelectorAll("button") || []).filter((control) => control.getClientRects().length > 0);
      return {
        count,
        entryVisible: Boolean(entry && getComputedStyle(entry).display !== "none" && entry.getClientRects().length),
        frameHidden: Boolean(frame && getComputedStyle(frame).display === "none"),
        projectState: document.querySelector("#paneLabelSheet")?.dataset.projectState,
        buttonOverflow: buttons.some((control) => control.scrollWidth > control.clientWidth + 1 || control.scrollHeight > control.clientHeight + 1),
      };
    });
    record(
      labelEntryState.count > 0 || (labelEntryState.entryVisible && labelEntryState.frameHidden && labelEntryState.projectState === "empty" && !labelEntryState.buttonOverflow),
      `Label-sheet empty project did not expose the guided entry screen cleanly: ${JSON.stringify(labelEntryState)}`,
      failures
    );
    record(await page.evaluate(() => typeof window.PromptDeckLabelSheet?.getProjectSnapshot === "function" && typeof window.PromptDeckLabelSheet?.replaceProject === "function"), "Label-sheet project history API was not exposed", failures);
    await page.keyboard.press("Control+K");
    await page.waitForSelector("#labelSheetWorkspaceCommandPalette:not([hidden])");
    await page.locator("#labelSheetWorkspaceCommandSearch").fill("레이아웃 편집으로 돌아가기");
    record((await page.locator(".label-sheet-workspace-command-item").count()) === 1, "Label-sheet command palette did not filter commands", failures);
    await page.keyboard.press("Escape");
    await page.waitForSelector("#labelSheetWorkspaceCommandPalette", { state: "hidden" });
    await page.keyboard.press("Alt+3");
    record((await page.locator("#paneLabelSheet").getAttribute("data-right-panel")) === "collapsed", "Label-sheet focus shortcut did not collapse the property panel", failures);
    await page.keyboard.press("Alt+1");
    record((await page.locator("#paneLabelSheet").getAttribute("data-right-panel")) === "expanded", "Label-sheet layout shortcut did not restore the two-panel editing layout", failures);
    record((await page.locator('input[name="labelSheetOutputGoal"]').count()) === 2, "Label-sheet did not expose the two distinct creation methods", failures);
    record((await page.locator('input[name="labelSheetIntentDocumentType"]').count()) === 4, "Label-sheet did not ask for the document type before detailed settings", failures);
    await page.click("#labelSheetWorkspaceSettingsBtn");
    record(await page.locator("#labelSheetWorkspaceSettingsDrawer").isVisible() && await page.locator("#labelSheetOutputGoalPrompt").isVisible(), "Label-sheet project settings drawer did not expose creation settings", failures);
    const labelSettingsGeometry = await page.evaluate(() => {
      const drawer = document.querySelector("#labelSheetWorkspaceSettingsDrawer");
      const panel = drawer?.querySelector(".label-sheet-workspace-drawer-panel");
      const body = drawer?.querySelector(".label-sheet-workspace-drawer-body");
      const intent = document.querySelector("#labelSheetIntentPanel");
      const spec = document.querySelector("#labelSheetSpecStep");
      const drawerBox = drawer?.getBoundingClientRect();
      const panelBox = panel?.getBoundingClientRect();
      const intentBox = intent?.getBoundingClientRect();
      const specBox = spec?.getBoundingClientRect();
      return {
        panelWidth: panelBox?.width || 0,
        panelCenterDelta: panelBox && drawerBox ? Math.abs((panelBox.left + panelBox.width / 2) - (drawerBox.left + drawerBox.width / 2)) : 999,
        bodyDisplay: body ? getComputedStyle(body).display : "missing",
        separatedColumns: Boolean(intentBox && specBox && intentBox.right < specBox.left),
      };
    });
    record(
      labelSettingsGeometry.panelWidth >= 900 &&
        labelSettingsGeometry.panelCenterDelta <= 3 &&
        labelSettingsGeometry.bodyDisplay === "grid" &&
        labelSettingsGeometry.separatedColumns,
      `Label-sheet desktop output settings were not organized as a centered two-column task modal: ${JSON.stringify(labelSettingsGeometry)}`,
      failures
    );
    await page.click("#labelSheetWorkspaceSettingsDrawer [data-label-workspace-drawer-close]");
    await selectLabelGoal("prompt");
    record((await page.locator("#paneLabelSheet").getAttribute("data-output-goal")) === "prompt", "Label-sheet prompt goal did not update the workflow state", failures);
    record(await page.locator("#labelSheetPrintBtn").isHidden(), "Label-sheet prompt-only goal kept the print action visible", failures);
    record(await page.locator('#tabActions [data-proxy-target="labelSheetGeneratePromptBtn"]').isVisible(), "Label-sheet prompt workspace did not expose its primary generation action", failures);
    record((await page.locator("#labelSheetOutputTitle").textContent()).includes("프롬프트"), "Label-sheet result title did not adapt to the prompt goal", failures);
    record(!(await page.locator("#labelSheetQrEnabled").isDisabled()), "Label-sheet prompt goal did not keep QR-space reservation available", failures);
    record(await page.locator("#labelSheetAssetRegisterBtn").isHidden(), "Label-sheet prompt-only goal still exposed background-image composition", failures);
    record(await page.locator("#labelSheetPageImageRegisterBtn").isHidden(), "Label-sheet prompt-only goal still exposed the two-stage page-image registration step", failures);
    record(await page.locator('[data-label-sheet-design-part="content"]').isHidden() && (await page.locator("#labelSheetWorkspaceDetailDrawer [data-label-sheet-design-part='content']").count()) === 1, "Label-sheet prompt workspace did not move detailed design controls into the focused editor dialog", failures);
    record((await page.locator("#labelSheetPromptMode").inputValue()) === "integrated", "Label-sheet prompt goal did not lock to full-image prompt mode", failures);
    record(await page.locator("#labelSheetQrSource").isHidden(), "Label-sheet prompt goal exposed actual QR-value assignment controls", failures);
    record((await page.locator("#labelSheetQrPosition").count()) === 1, "Label-sheet prompt goal removed QR-space position controls", failures);
    record((await page.locator("#labelSheetDnaFeaturedGallery").count()) === 1, "Label-sheet prompt goal removed its design-DNA gallery", failures);
    record((await page.locator('.label-sheet-output-route p:visible').count()) === 0, "Label-sheet prompt-only goal retained the redundant output-route explainer", failures);
    await selectLabelGoal("print");
    record(await page.locator('#tabActions [data-proxy-target="labelSheetExportPdfBtn"]').isVisible() && await page.locator("#labelSheetGeneratePromptBtn").isHidden(), "Label-sheet print workspace did not expose the correct output route", failures);
    record(!(await page.locator("#labelSheetQrEnabled").isDisabled()), "Label-sheet print goal did not restore QR composition capability", failures);
    record(await page.evaluate(() => Boolean(window.PromptDeckLabelSheet && window.PromptDeckLabelSheetEngine && window.PromptDeckLabelSheetAssets && window.PromptDeckLabelSheetRenderer && window.PromptDeckLabelSheetPackage && window.PromptDeckTabularData)), "Label-sheet controller or domain modules were not exposed", failures);
    await selectLabelDocumentType("admission");
    record((await page.locator("#labelSheetSamplePreset option").count()) === 3, "Label-sheet admission type did not expose three contextual sample presets", failures);
    await selectHiddenLabelValue("#labelSheetSamplePreset", "staff-pass");
    await page.click("#labelSheetWorkspaceSettingsBtn");
    await page.click("#labelSheetIntentSampleBtn");
    await page.click("#labelSheetWorkspaceSettingsDrawer [data-label-workspace-drawer-close]");
    await page.waitForFunction(() => window.PromptDeckLabelSheet.getProject().records[0]?.id?.startsWith("DEMO-STAFF-"));
    const staffSample = await page.evaluate(() => window.PromptDeckLabelSheet.getProject().records.map((record) => ({ id: record.id, number: record.number, role: record.data?.category })));
    record(staffSample.length === 8 && staffSample.every((record) => !record.number) && staffSample.some((record) => record.role === "안전관리"), `Label-sheet staff sample did not exercise unnumbered role data: ${JSON.stringify(staffSample)}`, failures);
    await selectLabelDocumentType("meal-ticket");
    record((await page.locator("#labelSheetSamplePreset").inputValue()) === "training-lunch" && (await page.locator("#labelSheetSamplePreset option").count()) === 3, "Label-sheet meal-ticket type did not restore the training center lunch default among three presets", failures);
    const labelContrastProbe = await page.evaluate(async () => {
      const renderer = window.PromptDeckLabelSheetRenderer;
      const dpi = 72;
      const mmToPx = (mm) => Math.round(mm / 25.4 * dpi);
      const labelX = mmToPx(10);
      const labelY = mmToPx(10);
      const labelWidth = mmToPx(70);
      const labelHeight = mmToPx(40);
      const canvas = await renderer.composePageCanvas({
        paper: { size: "A4", orientation: "portrait", widthMm: 210, heightMm: 297 },
        side: "front",
        items: [{
          rectMm: { xMm: 10, yMm: 10, widthMm: 70, heightMm: 40 },
          record: {
            id: "CONTRAST-PROBE",
            style: {
              backgroundColor: "#031f36",
              contrastMode: "auto",
              autoContrast: true,
              color: "#111827",
              align: "left",
              verticalAlign: "center",
              safeAreaMm: 2,
            },
            front: {
              enabled: true,
              title: "어두운 배경 자동 대비",
              body: "문구와 QR 가독성 확인",
              qrEnabled: true,
              qrValue: "https://example.kr/contrast-probe",
              qrStyle: {
                enabled: true,
                position: "right",
                layoutMode: "adaptive",
                sizePercent: 30,
                darkColor: "#445566",
                lightColor: "#556677",
                eyeColor: "#667788",
              },
            },
          },
        }],
      }, { side: "front", dpi, preferDomCanvas: true });
      const context = canvas.getContext("2d");
      const pixels = context.getImageData(labelX, labelY, labelWidth, labelHeight).data;
      let brightTextPixels = 0;
      let qrWhitePixels = 0;
      let qrDarkPixels = 0;
      for (let y = 0; y < labelHeight; y += 1) {
        for (let x = 0; x < labelWidth; x += 1) {
          const index = (y * labelWidth + x) * 4;
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          if (x < labelWidth * 0.65 && red > 205 && green > 205 && blue > 205) brightTextPixels += 1;
          if (x > labelWidth * 0.68 && red > 245 && green > 245 && blue > 245) qrWhitePixels += 1;
          if (x > labelWidth * 0.68 && red < 25 && green < 25 && blue < 25) qrDarkPixels += 1;
        }
      }
      return { brightTextPixels, qrWhitePixels, qrDarkPixels };
    });
    record(labelContrastProbe.brightTextPixels > 20, `Label-sheet auto contrast did not render light text over dark artwork: ${JSON.stringify(labelContrastProbe)}`, failures);
    record(labelContrastProbe.qrWhitePixels > 150 && labelContrastProbe.qrDarkPixels > 40, `Label-sheet QR contrast plate or module repair was not visible: ${JSON.stringify(labelContrastProbe)}`, failures);
    const labelQrDisableProbe = await page.evaluate(async () => {
      const renderer = window.PromptDeckLabelSheetRenderer;
      const dpi = 72;
      const mmToPx = (mm) => Math.round(mm / 25.4 * dpi);
      const labelX = mmToPx(10);
      const labelY = mmToPx(10);
      const labelWidth = mmToPx(70);
      const labelHeight = mmToPx(40);
      const canvas = await renderer.composePageCanvas({
        paper: { size: "A4", orientation: "portrait", widthMm: 210, heightMm: 297 },
        side: "front",
        items: [{
          rectMm: { xMm: 10, yMm: 10, widthMm: 70, heightMm: 40 },
          record: {
            id: "QR-OFF-PROBE",
            style: { backgroundColor: "#ffffff", safeAreaMm: 2, qr: { enabled: true } },
            front: {
              enabled: true,
              qrEnabled: true,
              qrValue: "https://example.kr/stale-assignment",
              qrStyle: { enabled: true, position: "right", layoutMode: "adaptive", sizePercent: 34 },
            },
          },
        }],
      }, { side: "front", dpi, qrEnabled: false, preferDomCanvas: true });
      const pixels = canvas.getContext("2d").getImageData(labelX, labelY, labelWidth, labelHeight).data;
      let darkPixels = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        if (pixels[index] < 80 && pixels[index + 1] < 80 && pixels[index + 2] < 80 && pixels[index + 3] > 0) darkPixels += 1;
      }
      return { darkPixels };
    });
    record(labelQrDisableProbe.darkPixels === 0, `Label-sheet global QR disable did not veto a stale assigned QR value: ${JSON.stringify(labelQrDisableProbe)}`, failures);
    const labelOrientationProbe = await page.evaluate(async () => {
      const renderer = window.PromptDeckLabelSheetRenderer;
      const dpi = 72;
      const px = (mm) => mm / 25.4 * dpi;
      const destination = { x: px(10), y: px(10), width: px(70), height: px(40) };
      const inset = px(2);
      const physicalTextBox = {
        x: destination.x + inset,
        y: destination.y + inset,
        width: destination.width - inset * 2,
        height: destination.height - inset * 2,
      };
      const expected = renderer.resolveOrientedBox(physicalTextBox, 90);
      const calls = [];
      const originalFillText = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function (text, x, y) {
        const matrix = this.getTransform();
        calls.push({ text: String(text), x, y, align: this.textAlign, transform: [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f] });
        return originalFillText.call(this, text, x, y);
      };
      try {
        await renderer.composePageCanvas({
          paper: { size: "A4", orientation: "portrait", widthMm: 210, heightMm: 297 },
          side: "front",
          items: [{
            rectMm: { xMm: 10, yMm: 10, widthMm: 70, heightMm: 40 },
            record: {
              id: "ORIENTATION-PROBE",
              number: "001",
              style: { backgroundColor: "#ffffff", color: "#111827", safeAreaMm: 2, rotation: 90, align: "left", verticalAlign: "top" },
              front: { enabled: true, number: "001", qrEnabled: false, qrValue: "" },
            },
          }],
        }, { side: "front", dpi, qrEnabled: false, preferDomCanvas: true });
      } finally {
        CanvasRenderingContext2D.prototype.fillText = originalFillText;
      }
      return { expected, numberCall: calls.find((call) => call.text === "001") || null };
    });
    record(Boolean(labelOrientationProbe.numberCall)
      && labelOrientationProbe.numberCall.align === "left"
      && Math.abs(labelOrientationProbe.numberCall.x - labelOrientationProbe.expected.x) < 0.25,
    `Label-sheet portrait content was not measured on swapped axes or the number ignored text alignment: ${JSON.stringify(labelOrientationProbe)}`, failures);
    await page.waitForFunction(() => window.PromptDeckLabelSheet.assetStore.list().filter((asset) => asset.filename.startsWith("기본-")).length >= 6, null, { timeout: 60_000 });
    record((await page.locator("#labelSheetAssetList .label-sheet-asset-card").count()) >= 6, "Label-sheet default background library did not expose six generated images", failures);
    await page.evaluate(async () => {
      await window.PromptDeckLabelSheet.loadPayload({
        sourceTab: "print-smoke-probe",
        importMode: "replace",
        spec: {
          page: { size: "A4", orientation: "portrait", widthMm: 210, heightMm: 297 },
          grid: { rows: 2, columns: 2, labelWidthMm: 90, labelHeightMm: 45, offsetTopMm: 20, offsetLeftMm: 10, pitchXmm: 95, pitchYmm: 50, gapXmm: 5, gapYmm: 5 },
          dpi: 150,
          firstSheetStartSlot: 3,
          firstSheetSkippedSlots: [0, 1, 2],
          duplex: { enabled: false },
        },
        settings: { documentType: "label", requireBackgrounds: false, sequenceMode: "none", textContrast: "light" },
        records: [{
          id: "PRINT-SMOKE-001",
          number: "",
          front: { enabled: true, title: "인쇄 확인", body: "빈 화면 회귀 테스트", footer: "PromptDeck", qrValue: "" },
          back: { enabled: false },
        }],
      }, { confirmReplace: false, switchTab: true });
      window.__labelSheetNativePrint = window.print;
      window.print = () => {
        const printRoot = [...document.body.children].find((element) => element.matches?.(".label-sheet-print-root"));
        const image = printRoot?.querySelector(".label-sheet-print-page img");
        window.__labelSheetPrintProbe = {
          ready: printRoot?.dataset.ready,
          directChild: printRoot?.parentElement === document.body,
          pageCount: printRoot?.querySelectorAll(".label-sheet-print-page").length || 0,
          imageComplete: image?.complete,
          naturalWidth: image?.naturalWidth || 0,
          naturalHeight: image?.naturalHeight || 0,
          display: printRoot ? getComputedStyle(printRoot).display : "missing",
        };
      };
    });
    await page.emulateMedia({ media: "print" });
    await page.evaluate(() => document.querySelector("#labelSheetPrintBtn")?.click());
    await page.waitForFunction(() => window.__labelSheetPrintProbe, null, { timeout: 60_000 });
    const labelPrintProbe = await page.evaluate(() => window.__labelSheetPrintProbe);
    record(labelPrintProbe.ready === "true" && labelPrintProbe.directChild && labelPrintProbe.pageCount === 1, `Label-sheet print root was not ready or mounted directly: ${JSON.stringify(labelPrintProbe)}`, failures);
    record(labelPrintProbe.imageComplete && labelPrintProbe.naturalWidth > 0 && labelPrintProbe.naturalHeight > 0 && labelPrintProbe.display === "block", `Label-sheet print dialog opened before its page image was printable: ${JSON.stringify(labelPrintProbe)}`, failures);
    await page.evaluate(() => {
      window.dispatchEvent(new Event("afterprint"));
      window.print = window.__labelSheetNativePrint;
      delete window.__labelSheetNativePrint;
      delete window.__labelSheetPrintProbe;
    });
    await page.emulateMedia({ media: "screen" });
    await page.waitForFunction(() => !document.body.classList.contains("label-sheet-printing") && !document.body.querySelector(":scope > .label-sheet-print-root"));
    await page.click("#labelSheetWorkspaceReviewBtn");
    await page.waitForSelector("#labelSheetWorkspaceReviewDrawer:not([hidden])");
    const [labelPdfDownload] = await Promise.all([
      page.waitForEvent("download", { timeout: 60_000 }),
      page.click("#labelSheetExportPdfBtn"),
    ]);
    const labelPdfPath = await labelPdfDownload.path();
    const labelPdfBytes = labelPdfPath ? await fs.readFile(labelPdfPath) : Buffer.alloc(0);
    const labelPdfText = labelPdfBytes.toString("latin1");
    record(labelPdfDownload.suggestedFilename().endsWith(".pdf"), `Label-sheet PDF download used an invalid filename: ${labelPdfDownload.suggestedFilename()}`, failures);
    record(labelPdfBytes.subarray(0, 8).toString("ascii") === "%PDF-1.4" && /\/Type \/Pages .*\/Count 1/.test(labelPdfText) && /startxref\n\d+\n%%EOF/.test(labelPdfText), "Label-sheet PDF download was not a valid one-page PDF document", failures);
    await page.click("#labelSheetWorkspaceReviewDrawer [data-label-workspace-drawer-close]");
    await page.evaluate(() => {
      window.__labelSheetNativePrint = window.print;
      window.print = () => {
        const printRoot = [...document.body.children].find((element) => element.matches?.(".label-sheet-print-root"));
        const pages = [...(printRoot?.querySelectorAll(".label-sheet-print-page") || [])].map((section) => {
          const image = section.querySelector("img");
          const canvas = document.createElement("canvas");
          canvas.width = 210;
          canvas.height = 297;
          const context = canvas.getContext("2d");
          if (image?.complete && image.naturalWidth > 0) context.drawImage(image, 0, 0, canvas.width, canvas.height);
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
          let nonWhitePixels = 0;
          let darkPixels = 0;
          for (let index = 0; index < pixels.length; index += 4) {
            if (pixels[index] < 248 || pixels[index + 1] < 248 || pixels[index + 2] < 248) nonWhitePixels += 1;
            if (pixels[index] < 180 && pixels[index + 1] < 180 && pixels[index + 2] < 180) darkPixels += 1;
          }
          return {
            side: section.dataset.side,
            complete: image?.complete,
            naturalWidth: image?.naturalWidth || 0,
            naturalHeight: image?.naturalHeight || 0,
            nonWhitePixels,
            darkPixels,
          };
        });
        window.__labelSheetCalibrationProbe = {
          ready: printRoot?.dataset.ready,
          directChild: printRoot?.parentElement === document.body,
          display: printRoot ? getComputedStyle(printRoot).display : "missing",
          pages,
        };
      };
    });
    await page.emulateMedia({ media: "print" });
    await page.evaluate(() => document.querySelector("#labelSheetCalibrationBtn")?.click());
    await page.waitForFunction(() => window.__labelSheetCalibrationProbe, null, { timeout: 60_000 });
    const calibrationProbe = await page.evaluate(() => window.__labelSheetCalibrationProbe);
    record(calibrationProbe.ready === "true" && calibrationProbe.directChild && calibrationProbe.display === "block", `Label-sheet calibration root was not printable: ${JSON.stringify(calibrationProbe)}`, failures);
    record(calibrationProbe.pages.length === 2 && calibrationProbe.pages[0]?.side === "front" && calibrationProbe.pages[1]?.side === "back", `Label-sheet calibration did not create paired front/back pages: ${JSON.stringify(calibrationProbe)}`, failures);
    record(calibrationProbe.pages.every((item) => item.complete && item.naturalWidth > 0 && item.naturalHeight > 0 && item.nonWhitePixels > 600 && item.darkPixels > 150), `Label-sheet calibration page was blank, low-contrast, or inherited skipped slots: ${JSON.stringify(calibrationProbe)}`, failures);
    await page.evaluate(() => {
      window.dispatchEvent(new Event("afterprint"));
      window.print = window.__labelSheetNativePrint;
      delete window.__labelSheetNativePrint;
      delete window.__labelSheetCalibrationProbe;
    });
    await page.emulateMedia({ media: "screen" });
    await page.waitForFunction(() => !document.body.classList.contains("label-sheet-printing") && !document.body.querySelector(":scope > .label-sheet-print-root"));
    const labelWorkspaceGeometry = await page.evaluate(() => {
      const pane = document.querySelector("#paneLabelSheet");
      const frame = pane?.querySelector(".label-sheet-workspace-frame");
      const canvas = pane?.querySelector(".label-sheet-workspace-canvas-column");
      const inspector = pane?.querySelector(".label-sheet-workspace-inspector");
      const left = pane?.querySelector(".label-sheet-workspace-left");
      const toolPanel = pane?.querySelector("#labelSheetWorkspaceToolPanel");
      const topbar = pane?.querySelector(".label-sheet-workspace-topbar");
      const paneBox = pane?.getBoundingClientRect();
      const requiredTopbarControls = [
        ".label-sheet-workspace-menubar",
        ".label-sheet-workspace-work-mode",
        ".label-sheet-workspace-goal-switch",
        ".label-sheet-workspace-spec-summary",
        ".label-sheet-workspace-history-actions",
        ".label-sheet-workspace-command-button",
      ].map((selector) => pane?.querySelector(selector));
      const visibleButtons = Array.from(topbar?.querySelectorAll("button") || [])
        .filter((control) => control.getClientRects().length && getComputedStyle(control).visibility !== "hidden");
      return {
        ready: pane?.dataset.labelWorkspaceLayoutReady,
        classReady: pane?.classList.contains("label-sheet-workspace-v7"),
        paneBottom: paneBox?.bottom || 0,
        viewportHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
        topbarDisplay: topbar ? getComputedStyle(topbar).display : "missing",
        topbarHeight: topbar?.getBoundingClientRect().height || 0,
        topbarControlsVisible: requiredTopbarControls.every((control) => control && control.getClientRects().length && getComputedStyle(control).display !== "none"),
        clippedTopbarButtons: visibleButtons.filter((control) => control.scrollWidth > control.clientWidth + 1 || control.scrollHeight > control.clientHeight + 1).map((control) => control.id || control.textContent?.trim()),
        frameDisplay: frame ? getComputedStyle(frame).display : "missing",
        frameChildren: frame?.children.length || 0,
        leftCount: pane?.querySelectorAll(".label-sheet-workspace-left").length || 0,
        leftDisplay: left ? getComputedStyle(left).display : "missing",
        toolPanelDisplay: toolPanel ? getComputedStyle(toolPanel).display : "missing",
        widths: [canvas, inspector].map((element) => element?.getBoundingClientRect().width || 0),
        statusbarCount: pane?.querySelectorAll(".label-sheet-workspace-statusbar").length || 0,
      };
    });
    record(
      labelWorkspaceGeometry.ready === "true" &&
        labelWorkspaceGeometry.classReady &&
        labelWorkspaceGeometry.topbarDisplay === "grid" &&
        labelWorkspaceGeometry.topbarHeight >= 80 &&
        labelWorkspaceGeometry.topbarControlsVisible &&
        labelWorkspaceGeometry.clippedTopbarButtons.length === 0 &&
        labelWorkspaceGeometry.frameDisplay === "grid" &&
        labelWorkspaceGeometry.frameChildren === 1 &&
        labelWorkspaceGeometry.leftCount === 1 &&
        labelWorkspaceGeometry.leftDisplay === "none" &&
        labelWorkspaceGeometry.toolPanelDisplay === "none" &&
        labelWorkspaceGeometry.widths.every((width) => width > 0) &&
        labelWorkspaceGeometry.paneBottom <= labelWorkspaceGeometry.viewportHeight + 1 &&
        labelWorkspaceGeometry.documentHeight <= labelWorkspaceGeometry.viewportHeight + 1 &&
        labelWorkspaceGeometry.documentWidth <= labelWorkspaceGeometry.viewportWidth + 1 &&
        labelWorkspaceGeometry.statusbarCount === 1,
      `Label-sheet workspace did not stay within the desktop viewport: ${JSON.stringify(labelWorkspaceGeometry)}`,
      failures
    );
    await selectLabelGoal("print");
    await selectLabelDocumentType("meal-ticket");
    await page.evaluate(() => {
      const duplex = document.querySelector("#labelSheetModeDuplex");
      duplex.checked = true;
      duplex.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.click("#labelSheetWorkspaceSettingsBtn");
    await page.click("#labelSheetIntentSampleBtn");
    await page.click("#labelSheetWorkspaceSettingsDrawer [data-label-workspace-drawer-close]");
    await page.waitForFunction(() => document.querySelectorAll("#labelSheetRecordTableBody tr[data-record-id]").length === 8);
    await page.waitForFunction(() => document.querySelectorAll("#labelSheetPreviewSurface canvas").length === 1);
    await page.click("#labelSheetWorkspaceDataModeBtn");
    await page.click('[data-label-bottom-tab="data"]');
    await page.waitForFunction(() => {
      const table = document.querySelector("#labelSheetRecordTable");
      return table && getComputedStyle(table).display !== "none" && table.getClientRects().length > 0;
    });
    const labelDataGeometry = await page.evaluate(() => {
      const drawer = document.querySelector("#labelSheetWorkspaceDataDrawer");
      const panel = drawer?.querySelector(".label-sheet-workspace-drawer-panel");
      const records = drawer?.querySelector(".label-sheet-workspace-data-records");
      const editor = drawer?.querySelector(".label-sheet-workspace-data-editor");
      const drawerBox = drawer?.getBoundingClientRect();
      const panelBox = panel?.getBoundingClientRect();
      const recordsBox = records?.getBoundingClientRect();
      const editorBox = editor?.getBoundingClientRect();
      return {
        panelWidth: panelBox?.width || 0,
        panelCenterDelta: panelBox && drawerBox ? Math.abs((panelBox.left + panelBox.width / 2) - (drawerBox.left + drawerBox.width / 2)) : 999,
        recordsWidth: recordsBox?.width || 0,
        editorWidth: editorBox?.width || 0,
        separatedColumns: Boolean(recordsBox && editorBox && recordsBox.right <= editorBox.left + 1),
      };
    });
    record(
      labelDataGeometry.panelWidth >= 1200 &&
        labelDataGeometry.panelCenterDelta <= 3 &&
        labelDataGeometry.recordsWidth >= 280 &&
        labelDataGeometry.editorWidth > labelDataGeometry.recordsWidth &&
        labelDataGeometry.separatedColumns,
      `Label-sheet desktop data editor did not use the wide two-pane workspace: ${JSON.stringify(labelDataGeometry)}`,
      failures
    );
    record((await page.locator("#labelSheetWorkspaceRecordList .label-sheet-workspace-record").count()) === 8, "Label-sheet workspace record navigator did not mirror the imported rows", failures);
    record(await page.locator("#labelSheetWorkspaceEmpty").isHidden(), "Label-sheet workspace kept the empty state over populated data", failures);
    await page.click("#labelSheetWorkspaceDataDrawer [data-label-workspace-drawer-close]");
    await openLabelDetail();
    const labelDetailGeometry = await page.evaluate(() => {
      const drawer = document.querySelector("#labelSheetWorkspaceDetailDrawer");
      const grid = drawer?.querySelector(".label-sheet-workspace-detail-grid");
      const advanced = drawer?.querySelector(".label-sheet-workspace-advanced-detail");
      const gridBox = grid?.getBoundingClientRect();
      const advancedBox = advanced?.getBoundingClientRect();
      return {
        panelWidth: drawer?.querySelector(".label-sheet-workspace-drawer-panel")?.getBoundingClientRect().width || 0,
        advancedWidthRatio: gridBox && advancedBox && gridBox.width ? advancedBox.width / gridBox.width : 0,
      };
    });
    record(labelDetailGeometry.panelWidth >= 1000 && labelDetailGeometry.advancedWidthRatio >= 0.95, `Label-sheet advanced detail settings did not span the desktop modal width: ${JSON.stringify(labelDetailGeometry)}`, failures);
    await page.locator("#labelSheetQrAdvanced").evaluate((details) => { details.open = true; });
    const labelSample = await page.evaluate(() => {
      const project = window.PromptDeckLabelSheet.getProject();
      const promptBundle = window.PromptDeckLabelSheetEngine.generatePromptBundle(project, { includeEmptySides: project.spec.duplex.enabled });
      return {
        recordCount: project.records.length,
        firstId: project.records[0]?.id,
        firstNumber: project.records[0]?.number,
        columns: project.spec.grid.columns,
        rows: project.spec.grid.rows,
        duplex: project.spec.duplex.enabled,
        documentType: project.settings.documentType,
        sequenceMode: project.settings.sequenceMode,
        textVerticalAlign: project.settings.textVerticalAlign,
        textScalePercent: project.settings.textScalePercent,
        qrCount: project.records.filter((record) => Boolean(record.front?.qrValue)).length,
        backgroundCount: project.records.filter((record) => Boolean(record.front?.backgroundAssetId)).length,
        contentFlows: promptBundle.entries.filter((entry) => entry.side === "front").map((entry) => entry.layout?.contentFlow),
        preflight: window.PromptDeckLabelSheet.runPreflight(),
      };
    });
    record(labelSample.recordCount === 8 && labelSample.firstId === "DEMO-MEAL-001" && labelSample.firstNumber === "", "Label-sheet meal-ticket sample did not preserve its unnumbered trainee records", failures);
    record(labelSample.columns === 2 && labelSample.rows === 4 && labelSample.duplex, "Label-sheet sample did not apply the 2x4 duplex geometry", failures);
    record(labelSample.documentType === "meal-ticket" && labelSample.sequenceMode === "none", "Label-sheet sample did not retain the unnumbered meal-ticket document type", failures);
    record(labelSample.textVerticalAlign === "center" && labelSample.textScalePercent === 95, "Label-sheet sample did not retain its text size and vertical placement controls", failures);
    record(labelSample.qrCount === 4 && labelSample.backgroundCount === 8, "Label-sheet sample did not mix QR/no-QR records or assign its default background", failures);
    record(labelSample.contentFlows.includes("field-aware-wrap-around-qr") && labelSample.contentFlows.includes("full-width-no-qr-reservation"), "Label-sheet sample prompt did not distinguish QR and no-QR content flows", failures);
    record(!labelSample.preflight.fatal, "Label-sheet sample was blocked by a fatal preflight issue", failures);
    record(await page.evaluate(() => {
      const project = window.PromptDeckLabelSheet.getProject();
      return project.settings.qr?.enabled === true
        && project.settings.qr?.layoutMode === "adaptive"
        && project.records[0]?.front?.qrValue === "https://example.kr/sample-meal/DEMO-MEAL-001"
        && project.records[1]?.front?.qrValue === "";
    }), "Label-sheet sample did not preserve its adaptive mixed QR assignments", failures);
    await page.uncheck("#labelSheetQrEnabled");
    await page.waitForFunction(() => window.PromptDeckLabelSheet.getProject().settings.qr?.enabled === false);
    const qrDisabledOutputModel = await page.evaluate(() => {
      const project = window.PromptDeckLabelSheet.getProject();
      return {
        enabled: project.settings.qr?.enabled,
        qrValues: project.records.map((record) => record.front?.qrValue || ""),
        previewText: document.querySelector("#labelSheetQrResolvedPreview")?.textContent || "",
      };
    });
    record(qrDisabledOutputModel.enabled === false && qrDisabledOutputModel.qrValues.every((value) => !value), `Label-sheet QR-off output model retained printable QR values: ${JSON.stringify(qrDisabledOutputModel)}`, failures);
    record(qrDisabledOutputModel.previewText.includes("QR 꺼짐"), "Label-sheet QR-off preview did not confirm that QR space was removed", failures);
    await page.check("#labelSheetQrEnabled");
    await page.waitForFunction(() => window.PromptDeckLabelSheet.getProject().settings.qr?.enabled === true);
    record((await page.locator("#labelSheetRecordTable thead th").count()) === 18, "Label-sheet record table did not expose the complete source data and front/back assignment columns", failures);
    const outputTemplateProbe = await page.evaluate(() => {
      const firstRow = document.querySelector("#labelSheetRecordTableBody tr[data-record-id]");
      const field = (name) => firstRow?.querySelector(`[data-record-field="${name}"]`)?.value || "";
      const project = window.PromptDeckLabelSheet.getProject();
      return {
        templates: [
          document.querySelector("#labelSheetFrontTitle")?.value,
          document.querySelector("#labelSheetFrontBody")?.value,
          document.querySelector("#labelSheetFrontFooter")?.value,
        ],
        raw: {
          name: field("data.name"),
          category: field("data.category"),
          title: field("front.title"),
          subtitle: field("front.subtitle"),
          body: field("front.body"),
          footer: field("front.footer"),
        },
        rendered: project.records[0]?.front,
        resolved: window.PromptDeckLabelSheet.resolveOutputTemplate("DEMO-MEAL-001", "front", "{{ID}}|{{번호}}|{{이름}}|{{구분}}|{{제목}}"),
      };
    });
    record(
      outputTemplateProbe.templates[0] === "{{제목}}" && outputTemplateProbe.templates[1].includes("{{이름}}") && outputTemplateProbe.templates[2] === "{{하단}}" &&
        outputTemplateProbe.raw.name === "김배움" && outputTemplateProbe.raw.category === "배터리 기초" &&
        outputTemplateProbe.raw.title === "샘플교육센터 교육생 식권" && outputTemplateProbe.raw.subtitle === "이차전지 전문인력 양성과정" &&
        outputTemplateProbe.raw.body === "중식 1회 · 교육 당일 사용" && outputTemplateProbe.raw.footer.includes("샘플교육센터") &&
        outputTemplateProbe.rendered?.body.includes("김배움 · 배터리 기초") && outputTemplateProbe.rendered?.body.includes("중식 1회") &&
        outputTemplateProbe.resolved?.value.includes("DEMO-MEAL-001||김배움|배터리 기초|샘플교육센터 교육생 식권"),
      `Label-sheet sample did not keep source data separate from token-driven output: ${JSON.stringify(outputTemplateProbe)}`,
      failures
    );
    await page.locator("#labelSheetFrontTitle").focus();
    await page.locator("#labelSheetFrontTitle").evaluate((input) => input.setSelectionRange(input.value.length, input.value.length));
    await page.click('[data-label-sheet-output-token-bar="front"] [data-label-sheet-output-token="{{번호}}"]');
    await page.waitForFunction(() => document.querySelector("#labelSheetFrontTitle")?.value === "{{제목}}{{번호}}");
    record((await page.locator("#labelSheetFrontResolvedPreview").textContent()).includes("샘플교육센터 교육생 식권"), "Label-sheet output token button did not refresh the resolved preview", failures);
    await page.locator("#labelSheetFrontTitle").fill("{{제목}}");
    await page.uncheck("#labelSheetFrontSubtitleVisible");
    await page.waitForFunction(() => window.PromptDeckLabelSheet.getProject().records[0]?.front?.subtitle === "");
    record(
      (await page.locator('#labelSheetRecordTableBody input[data-record-field="front.subtitle"]').first().inputValue()) === "이차전지 전문인력 양성과정" &&
        (await page.locator("#labelSheetFrontSubtitle").inputValue()) === "{{부제}}",
      "Label-sheet field visibility toggle removed source data or the output template instead of hiding only the rendered field",
      failures
    );
    await page.check("#labelSheetFrontSubtitleVisible");
    await page.waitForFunction(() => window.PromptDeckLabelSheet.getProject().records[0]?.front?.subtitle === "이차전지 전문인력 양성과정");
    await page.selectOption("#labelSheetQrMargin", "8");
    await page.waitForFunction(() => window.PromptDeckLabelSheet.getProject().settings.qr?.margin === 8);
    record((await page.locator("#labelSheetQrMargin").inputValue()) === "8", "Label-sheet QR quiet-zone control did not persist its margin setting", failures);
    await page.selectOption("#labelSheetQrSource", "number");
    record(!(await page.locator("#labelSheetQrTemplate").isDisabled()), "Label-sheet QR template remained disabled outside template mode", failures);
    await page.locator("#labelSheetQrTemplate").fill("https://example.kr/check/{id}?name={name|url}");
    await page.waitForFunction(() => document.querySelector("#labelSheetQrSource")?.value === "template");
    await page.waitForFunction(() => document.querySelector("#labelSheetQrResolvedPreview")?.textContent.includes("https://example.kr/check/DEMO-MEAL-001?name=%"));
    await page.selectOption("#labelSheetQrAssignScope", "selected");
    await page.locator('#labelSheetRecordTableBody input[data-record-select="true"]').first().evaluate((input) => {
      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.click("#labelSheetQrAssignBtn");
    await page.waitForFunction(() => document.querySelector("#labelSheetQrSource")?.value === "record");
    const selectedQrAssignmentValues = await page.evaluate(() => window.PromptDeckLabelSheet.getProject().records.map((record) => record.front?.qrValue));
    record(selectedQrAssignmentValues.length === 8 && selectedQrAssignmentValues.every(Boolean), "Selected QR assignment discarded dynamic values from unselected labels", failures);
    await page.locator('#labelSheetRecordTableBody input[data-record-select="true"]').first().evaluate((input) => {
      input.checked = false;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.selectOption("#labelSheetQrSource", "template");
    await page.selectOption("#labelSheetQrAssignScope", "all");
    await page.click("#labelSheetQrAssignBtn");
    await page.waitForFunction(() => document.querySelector("#labelSheetQrSource")?.value === "record");
    const assignedQrValues = await page.evaluate(() => window.PromptDeckLabelSheet.getProject().records.map((record) => record.front?.qrValue));
    record(assignedQrValues.length === 8 && assignedQrValues.every((qrValue) => qrValue.startsWith("https://example.kr/check/DEMO-MEAL-") && qrValue.includes("?name=%")), "Label-sheet QR template was not materialized into per-record values", failures);
    await page.selectOption("#labelSheetQrAssignScope", "selected");
    await page.locator('#labelSheetRecordTableBody input[data-record-select="true"]').first().evaluate((input) => {
      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.click("#labelSheetQrClearBtn");
    await page.waitForFunction(() => {
      const records = window.PromptDeckLabelSheet.getProject().records;
      return records[0]?.front?.qrValue === "" && records[1]?.front?.qrValue?.startsWith("https://example.kr/check/DEMO-MEAL-");
    });
    await page.locator('#labelSheetRecordTableBody input[data-record-field="front.qrValue"]').first().evaluate((input) => {
      input.value = "https://example.kr/manual/first";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForFunction(() => window.PromptDeckLabelSheet.getProject().records[0]?.front?.qrValue === "https://example.kr/manual/first");
    record((await page.locator("#labelSheetQrSource").inputValue()) === "record", "Editing a per-record QR value did not activate direct assignment mode", failures);
    await page.locator('#labelSheetRecordTableBody input[data-record-select="true"]').first().evaluate((input) => {
      input.checked = false;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.selectOption("#labelSheetQrAssignScope", "all");
    await page.selectOption("#labelSheetQrSource", "template");
    await page.locator("#labelSheetQrTemplate").fill("https://example.kr/pass/{id}");
    await selectLabelGoal("prompt");
    record(!(await page.locator("#labelSheetQrEnabled").isDisabled()) && await page.locator("#labelSheetQrSource").isHidden(), "Label-sheet prompt mode did not separate QR-space controls from actual QR data", failures);
    await page.click("#labelSheetWorkspaceDataModeBtn");
    record(await page.locator("#labelSheetRecordTable").isVisible(), "Label-sheet prompt mode hid the shared data review and direct-edit table", failures);
    await page.locator('#labelSheetRecordTableBody input[data-record-field="front.title"]').first().fill("프롬프트 데이터 직접 반영");
    await page.waitForFunction(() => window.PromptDeckLabelSheet.getProject().records[0]?.front?.title === "프롬프트 데이터 직접 반영");
    await page.click("#labelSheetWorkspaceDataDrawer [data-label-workspace-drawer-close]");
    await generateLabelPrompt();
    record((await page.locator("#labelSheetPromptPageSelect option").count()) === 2, "Label-sheet duplex sample did not expose separate front/back prompt pages", failures);
    await page.waitForFunction(() => document.querySelector("#labelSheetPromptPreview")?.value.includes("DEMO-MEAL-001"));
    const integratedLabelPrompt = await page.locator("#labelSheetPromptPreview").inputValue();
    record(integratedLabelPrompt.includes("A4 FULL IMAGE PAGE") && integratedLabelPrompt.includes("FULL LABEL IMAGE PROMPTS") && integratedLabelPrompt.includes("샘플교육센터 교육생 식권") && integratedLabelPrompt.includes("프롬프트 데이터 직접 반영"), "Label-sheet full-image prompt lost shared table data or the page contract", failures);
    record(integratedLabelPrompt.includes("reserve-blank-space") && !integratedLabelPrompt.includes("https://example.kr/pass/DEMO-MEAL-001"), "Label-sheet full-image prompt did not reserve QR space without leaking an actual QR value", failures);
    await page.click("#labelSheetPromptItemViewTab");
    record((await page.locator("#labelSheetPromptItemSelect option").count()) === 8, "Label-sheet first page did not expose eight individually copyable label prompts", failures);
    record((await page.locator("#labelSheetPromptItemPreview").inputValue()).includes("프롬프트 데이터 직접 반영"), "Label-sheet individual prompt view did not retain the shared table's visible copy", failures);
    await page.click("#labelSheetPromptPageViewTab");
    await closeLabelReview();
    await page.click("#labelSheetWorkspaceDataModeBtn");
    await page.locator("#labelSheetSkippedSlots").fill("2,4");
    await page.selectOption("#labelSheetSequenceMode", "sequence");
    await page.locator("#labelSheetStartNumber").fill("1");
    await page.locator("#labelSheetEndNumber").fill("10");
    await page.locator("#labelSheetPrefix").fill("PASS-");
    await page.locator("#labelSheetPadding").fill("3");
    await page.waitForFunction(() => window.PromptDeckLabelSheet.getProject().records.length === 10);
    await page.waitForFunction(() => window.PromptDeckLabelSheet.getProject().records[0]?.number === "PASS-001");
    await page.click("#labelSheetWorkspaceDataDrawer [data-label-workspace-drawer-close]");
    await generateLabelPrompt();
    await page.waitForFunction(() => document.querySelectorAll("#labelSheetPromptPageSelect option").length === 4);
    const multiSheetPromptPages = await page.evaluate(() => window.PromptDeckLabelSheet.getPromptPages().map((promptPage) => ({
      printPageNumber: promptPage.printPageNumber,
      sheetNumber: promptPage.sheetNumber,
      side: promptPage.side,
      recordIds: promptPage.recordIds,
      slotNumbers: promptPage.slots.map((slot) => slot.slotNumber),
    })));
    record(
      multiSheetPromptPages.length === 4
      && multiSheetPromptPages[2]?.sheetNumber === 2
      && multiSheetPromptPages[2]?.side === "front"
      && multiSheetPromptPages[3]?.side === "back",
      `Label-sheet multi-sheet prompt pagination failed: ${JSON.stringify(multiSheetPromptPages)}`,
      failures,
    );
    record(!multiSheetPromptPages[0]?.slotNumbers.includes(2) && !multiSheetPromptPages[0]?.slotNumbers.includes(4), `Label-sheet first-sheet skipped slots were still occupied: ${JSON.stringify(multiSheetPromptPages[0])}`, failures);
    record(multiSheetPromptPages[2]?.slotNumbers.includes(2) && multiSheetPromptPages[2]?.slotNumbers.includes(4), "Label-sheet arbitrary skipped slots incorrectly carried over to later sheets", failures);
    record((await page.locator("#labelSheetPromptPageSelectBottom option").count()) === 4, "Label-sheet bottom page prompt selector did not mirror the top selector", failures);
    page.once("dialog", (dialog) => dialog.accept());
    await page.click("#labelSheetCopyPromptNextBtn");
    await page.waitForFunction(() => document.querySelector("#labelSheetPromptPageSelect")?.value === "1" && document.querySelector("#labelSheetPromptPageSelectBottom")?.value === "1");
    const firstCopiedPage = await page.evaluate(() => navigator.clipboard.readText());
    record(firstCopiedPage.includes("SHEET 1 FRONT") && (await page.locator("#labelSheetPromptCopyProgress").textContent()).includes("1 / 4") && (await page.locator("#labelSheetPromptPageSelect option").first().textContent()).startsWith("✓"), "Label-sheet copy-and-next did not copy, mark, and advance from the first page", failures);
    await page.click("#labelSheetCopyPromptBottomBtn");
    const secondCopiedPage = await page.evaluate(() => navigator.clipboard.readText());
    record(secondCopiedPage.includes("SHEET 1 BACK") && (await page.locator("#labelSheetPromptCopyProgressBottom").textContent()).includes("2 / 4"), "Label-sheet bottom copy control did not copy and track the selected page", failures);
    await page.selectOption("#labelSheetPromptPageSelectBottom", "3");
    await page.waitForFunction(() => document.querySelector("#labelSheetPromptPageSelect")?.value === "3");
    await page.click("#labelSheetPromptPrevBtn");
    await page.waitForFunction(() => document.querySelector("#labelSheetPromptPageSelectBottom")?.value === "2");
    record((await page.locator("#labelSheetPromptPageStatus").textContent()).trim() === "3 / 4" && (await page.locator("#labelSheetPromptPageStatusBottom").textContent()).trim() === "3 / 4", "Label-sheet top and bottom page navigation fell out of sync", failures);
    await selectLabelGoal("print");
    await page.click("#labelSheetWorkspaceReviewBtn");
    await page.waitForSelector("#labelSheetWorkspaceReviewDrawer:not([hidden])");
    await page.selectOption("#labelSheetPrintRangeMode", "range");
    await page.locator("#labelSheetPrintFrom").fill("2");
    await page.locator("#labelSheetPrintTo").fill("2");
    await page.locator("#labelSheetPrintCopies").fill("2");
    await page.locator("#labelSheetPrintCopies").dispatchEvent("change");
    const printSelection = await page.evaluate(() => window.PromptDeckLabelSheet.getPrintSelection());
    record(printSelection?.from === 2 && printSelection?.to === 2 && printSelection?.copies === 2, `Label-sheet print range manager did not preserve range/copies: ${JSON.stringify(printSelection)}`, failures);
    await selectLabelGoal("prompt");
    await generateLabelPrompt();
    await page.waitForFunction(() => document.querySelectorAll("#labelSheetPromptPageSelect option").length === 4);
    await page.selectOption("#labelSheetPromptPageSelect", "2");
    await page.waitForFunction(() => document.querySelector("#labelSheetPromptPreview")?.value.includes("SHEET 2 FRONT"));
    const secondSheetFrontPrompt = await page.locator("#labelSheetPromptPreview").inputValue();
    record(!secondSheetFrontPrompt.includes("PASS-001") && secondSheetFrontPrompt.includes("PASS-007") && secondSheetFrontPrompt.includes("PASS-009") && secondSheetFrontPrompt.includes("SHEET 2 FRONT"), "Label-sheet second-sheet full-image prompt mixed records from another print page", failures);
    await page.click("#labelSheetPromptItemViewTab");
    record((await page.locator("#labelSheetPromptItemSelect option").count()) === 4, "Label-sheet second front page did not expose four individual prompts", failures);
    record((await page.locator("#labelSheetPromptItemPreview").inputValue()).includes("PASS-007"), "Label-sheet individual prompt did not stay on the selected print page", failures);
    await page.click("#labelSheetPromptPageViewTab");
    record((await page.locator("#labelSheetPromptPageStatus").textContent()).trim() === "3 / 4", "Label-sheet prompt page status did not follow the selected print page", failures);
    await page.waitForFunction(() => document.querySelector("#labelSheetPageStatus")?.textContent.trim() === "2 / 2");
    await page.selectOption("#labelSheetPromptPageSelect", "3");
    await page.waitForFunction(() => document.querySelector("#labelSheetPreviewBackBtn")?.classList.contains("active"));
    record((await page.locator("#labelSheetPromptPreview").inputValue()).includes("SHEET 2 BACK"), "Label-sheet back prompt page did not synchronize with the back preview", failures);
    await closeLabelReview();
    await page.click("#labelSheetWorkspaceDataModeBtn");
    await page.locator("#labelSheetSkippedSlots").fill("");
    await page.locator("#labelSheetEndNumber").fill("8");
    await page.click("#labelSheetApplySequenceBtn");
    await page.waitForFunction(() => window.PromptDeckLabelSheet.getProject().records.length === 8);
    await page.click("#labelSheetWorkspaceDataDrawer [data-label-workspace-drawer-close]");
    await generateLabelPrompt();
    await page.waitForFunction(() => document.querySelectorAll("#labelSheetPromptPageSelect option").length === 2);
    await page.selectOption("#labelSheetPromptPageSelect", "0");
    await page.waitForFunction(() => document.querySelector("#labelSheetPreviewFrontBtn")?.classList.contains("active"));
    await closeLabelReview();
    await selectLabelGoal("print");
    await selectHiddenLabelValue("#labelSheetDpi", "150");
    await page.waitForTimeout(150);
    await page.evaluate(() => window.PromptDeckLabelSheet.refresh());
    const [latestStatePngDownload] = await Promise.all([
      page.waitForEvent("download", { timeout: 60_000 }),
      page.evaluate(() => {
        const probe = { qrCalls: 0, textCalls: [], events: [], busyImmediately: false };
        const originalQr = window.QRGeneratorCore.drawCustomQRCode;
        const originalFillText = CanvasRenderingContext2D.prototype.fillText;
        window.__labelSheetLatestStateProbe = probe;
        window.__labelSheetLatestStateRestore = () => {
          window.QRGeneratorCore.drawCustomQRCode = originalQr;
          CanvasRenderingContext2D.prototype.fillText = originalFillText;
          delete window.__labelSheetLatestStateRestore;
        };
        window.QRGeneratorCore.drawCustomQRCode = (...args) => {
          probe.qrCalls += 1;
          probe.events.push({ type: "qr" });
          return originalQr(...args);
        };
        CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
          const matrix = this.getTransform();
          const call = { text: String(text), align: this.textAlign, transform: [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f] };
          probe.textCalls.push(call);
          probe.events.push({ type: "text", ...call });
          return maxWidth === undefined ? originalFillText.call(this, text, x, y) : originalFillText.call(this, text, x, y, maxWidth);
        };
        const qrToggle = document.querySelector("#labelSheetQrEnabled");
        const sequenceMode = document.querySelector("#labelSheetSequenceMode");
        const orientation = document.querySelector("#labelSheetContentOrientation");
        const align = document.querySelector("#labelSheetTextAlign");
        qrToggle.checked = false;
        qrToggle.dispatchEvent(new Event("change", { bubbles: true }));
        sequenceMode.value = "none";
        sequenceMode.dispatchEvent(new Event("change", { bubbles: true }));
        orientation.value = "portrait";
        orientation.dispatchEvent(new Event("input", { bubbles: true }));
        align.value = "right";
        align.dispatchEvent(new Event("input", { bubbles: true }));
        const exportButton = document.querySelector("#labelSheetExportPngBtn");
        exportButton.click();
        probe.busyImmediately = exportButton.disabled;
      }),
    ]);
    await latestStatePngDownload.path();
    await page.waitForFunction(() => !document.querySelector("#labelSheetExportPngBtn")?.disabled);
    const latestStateOutputProbe = await page.evaluate(() => {
      const probe = window.__labelSheetLatestStateProbe;
      window.__labelSheetLatestStateRestore?.();
      delete window.__labelSheetLatestStateProbe;
      return probe;
    });
    record(latestStateOutputProbe.busyImmediately, "Label-sheet current PNG export did not lock concurrent output actions", failures);
    const latestStateExportStart = latestStateOutputProbe.events.findIndex((event) => event.type === "text" && event.align === "right" && Math.abs(event.transform?.[1] || 0) > 0.9);
    const latestStateExportEvents = latestStateExportStart >= 0 ? latestStateOutputProbe.events.slice(latestStateExportStart) : [];
    const latestStateExportTextCalls = latestStateExportEvents.filter((event) => event.type === "text");
    record(!latestStateExportEvents.some((event) => event.type === "qr"), `Label-sheet immediate QR-off change was not used by PNG export: ${JSON.stringify(latestStateExportEvents.slice(0, 20))}`, failures);
    record(!latestStateExportTextCalls.some((call) => /^PASS-\d+/.test(call.text)), `Label-sheet immediate no-number change was not used by PNG export: ${JSON.stringify(latestStateExportTextCalls.slice(0, 12))}`, failures);
    record(latestStateExportStart >= 0, `Label-sheet immediate vertical/right layout was not used by PNG export: ${JSON.stringify(latestStateOutputProbe.textCalls.slice(0, 12))}`, failures);
    await openLabelDetail();
    await page.check("#labelSheetQrEnabled");
    await closeLabelDetail();
    await page.click("#labelSheetWorkspaceDataModeBtn");
    await page.selectOption("#labelSheetSequenceMode", "sequence");
    await page.click("#labelSheetWorkspaceDataDrawer [data-label-workspace-drawer-close]");
    await page.evaluate(() => {
      const orientation = document.querySelector("#labelSheetContentOrientation");
      const align = document.querySelector("#labelSheetTextAlign");
      orientation.value = "auto";
      orientation.dispatchEvent(new Event("input", { bubbles: true }));
      align.value = "center";
      align.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const labelLayerProbe = await page.evaluate(async () => {
      const pageModel = {
        paper: { widthMm: 210, heightMm: 297, orientation: "portrait" },
        side: "front",
        placements: [{
          xMm: 10,
          yMm: 10,
          widthMm: 60,
          heightMm: 40,
          side: "front",
          record: {
            id: "QR-PROBE",
            front: {
              enabled: true,
              qrEnabled: true,
              qrValue: "https://example.kr/probe",
              qrStyle: { enabled: true, position: "right", sizePercent: 34, margin: 4, ecc: "M" },
            },
          },
        }],
      };
      const canvas = await window.PromptDeckLabelSheetRenderer.composePageCanvas(pageModel, {
        dpi: 72,
        outputLayer: "overlay",
        showCutLines: false,
        showSafeArea: false,
      });
      const context = canvas.getContext("2d");
      const outside = context.getImageData(0, 0, 1, 1).data[3];
      const pixels = context.getImageData(28, 28, 170, 114).data;
      let opaque = 0;
      for (let index = 3; index < pixels.length; index += 4) if (pixels[index] > 0) opaque += 1;
      return { outside, opaque };
    });
    record(labelLayerProbe.outside === 0 && labelLayerProbe.opaque > 100, `Label-sheet transparent QR overlay was not rendered correctly: ${JSON.stringify(labelLayerProbe)}`, failures);
    await selectLabelGoal("prompt");
    await page.click('[data-label-workspace-menu-trigger="edit"]');
    await page.click("#labelSheetWorkspaceAssetsMenu");
    await page.waitForSelector("#labelSheetWorkspaceAssetsDrawer:not([hidden])");
    await page.click("#labelSheetOpenDnaGalleryBtn");
    await page.locator("#labelSheetDnaSearch").fill("미니멀 리포트");
    await page.waitForSelector('[data-label-sheet-dna-style-id="minimal-report"]');
    await page.click('[data-label-sheet-dna-style-id="minimal-report"]');
    await page.waitForFunction(() => window.PromptDeckLabelSheet.getProject().settings.visualStyleSnapshot?.id === "minimal-report");
    record((await page.locator("#labelSheetStyleStatus").textContent()).includes("미니멀"), "Label-sheet did not apply the shared visual-style contract", failures);
    await page.click('#labelSheetDnaDialog [data-label-sheet-dna-dialog-close]');
    await page.waitForFunction(() => document.querySelector("#labelSheetWorkspaceAssetsDrawer")?.dataset.open === "true");
    await selectLabelGoal("print");
    await page.click('[data-label-workspace-menu-trigger="edit"]');
    await page.click("#labelSheetWorkspaceAssetsMenu");
    await page.waitForSelector("#labelSheetWorkspaceAssetsDrawer:not([hidden])");
    await page.evaluate(async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 900;
      const context = canvas.getContext("2d");
      const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#103d5a");
      gradient.addColorStop(1, "#32a7a0");
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error("PNG canvas encoding failed")), "image/png"));
      const transfer = new DataTransfer();
      transfer.items.add(new File([blob], "smoke-label-background.png", { type: "image/png" }));
      const input = document.querySelector("#labelSheetAssetInput");
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.click("#labelSheetAssetRegisterBtn");
    await page.waitForFunction(() => window.PromptDeckLabelSheet.assetStore.list().some((asset) => (
      asset.filename === "smoke-label-background.png"
      && asset.status !== "processing"
      && asset.status !== "failed"
      && (asset.derivatives?.length || 0) > 0
    )), null, { timeout: 60_000 });
    const labelAsset = await page.evaluate(() => {
      const asset = window.PromptDeckLabelSheet.assetStore.list().find((item) => item.filename === "smoke-label-background.png");
      return { width: asset?.width, height: asset?.height, status: asset?.status, derivatives: asset?.derivatives?.length || 0 };
    });
    record(labelAsset.width === 1600 && labelAsset.height === 900 && labelAsset.status !== "failed" && labelAsset.derivatives > 0, `Label-sheet raster upload was not decoded and resized: ${JSON.stringify(labelAsset)}`, failures);
    const smokeAssetCard = page.locator("#labelSheetAssetList .label-sheet-asset-card").filter({ hasText: "smoke-label-background.png" });
    await smokeAssetCard.locator("input[name='labelSheetAssetSelection']").check();
    await page.selectOption("#labelSheetImageFit", "crop");
    await page.waitForFunction(() => !document.querySelector("#labelSheetCropEditor")?.hidden);
    await page.evaluate(() => {
      const values = { labelSheetCropX: "10", labelSheetCropY: "5", labelSheetCropWidth: "80", labelSheetCropHeight: "90" };
      Object.entries(values).forEach(([id, value]) => {
        const input = document.getElementById(id);
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
      document.getElementById("labelSheetCropHeight").dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForFunction(() => {
      const selected = document.querySelector("#labelSheetAssetList input[name='labelSheetAssetSelection']:checked")?.value;
      const crop = window.PromptDeckLabelSheet.assetStore.get(selected)?.settings?.crop;
      return crop?.x === 0.1 && crop?.y === 0.05 && crop?.width === 0.8 && crop?.height === 0.9;
    }, null, { timeout: 60_000 });
    const cropBoxStyle = await page.locator("#labelSheetCropPreviewBox").getAttribute("style");
    record(cropBoxStyle?.includes("left: 10%") && cropBoxStyle?.includes("width: 80%"), `Label-sheet crop editor preview did not reflect saved crop: ${cropBoxStyle}`, failures);
    await page.selectOption("#labelSheetImageFit", "cover");
    await page.selectOption("#labelSheetAssetScope", "all");
    await page.click("#labelSheetAssetAssignBtn");
    await page.waitForFunction(() => document.querySelector("#labelSheetAssetStatus")?.textContent.includes("배경 8건"), null, { timeout: 60_000 });
    record(await page.evaluate(() => window.PromptDeckLabelSheet.getProject().records.every((record) => Boolean(record.front?.backgroundAssetId))), "Label-sheet assignment status completed without retaining every front background ID", failures);
    record((await page.locator("#labelSheetAssetStatus").textContent()).includes("배경 8건"), "Label-sheet uploaded background was not assigned across the sample records", failures);
    await page.click("#labelSheetWorkspaceAssetsDrawer [data-label-workspace-drawer-close]");
    await page.click("#labelSheetPreviewBackBtn");
    await page.waitForFunction(() => document.querySelector("#labelSheetPreviewSurface canvas")?.getAttribute("aria-label")?.includes("뒷면"));
    record((await page.locator("#labelSheetDuplexStepState").textContent()).includes("양면"), "Label-sheet back preview did not keep the duplex state", failures);
    await page.click("#tabBtnQrGenerator");
    await page.waitForSelector("#paneQrGenerator.active");
    await page.click('.qr-type-btn[data-type="text"]');
    await page.locator("#qrInputText").fill("https://example.kr/from-qr-tab");
    await page.evaluate(() => { document.querySelector("#qrLabelText").value = "QR 탭 연동 라벨"; });
    await page.click("#btnQrSendToLabel");
    await page.waitForSelector("#paneLabelSheet.active");
    await page.waitForFunction(() => window.PromptDeckLabelSheet.getProject().records.length === 9);
    const qrBridgeResult = await page.evaluate(() => {
      const project = window.PromptDeckLabelSheet.getProject();
      const last = project.records.at(-1);
      return {
        sourceQr: last?.front?.qrValue,
        title: last?.front?.title,
        qrEnabled: project.settings.qr?.enabled,
        qrSource: project.settings.qr?.source,
      };
    });
    record(qrBridgeResult.sourceQr === "https://example.kr/from-qr-tab" && qrBridgeResult.title === "QR 탭 연동 라벨" && qrBridgeResult.qrEnabled && qrBridgeResult.qrSource === "record", `QR-to-label structured bridge failed: ${JSON.stringify(qrBridgeResult)}`, failures);
    const labelPackageProbe = await page.evaluate(async () => {
      const built = await window.PromptDeckLabelSheetPackage.buildProjectPackage({
        project: window.PromptDeckLabelSheet.getProject(),
        assets: window.PromptDeckLabelSheet.assetStore.list(),
        promptBundle: window.PromptDeckLabelSheet.getPromptBundle(),
      });
      const parsed = await window.PromptDeckLabelSheetPackage.parseProjectPackage(built.blob);
      return { records: parsed.project.records.length, assets: parsed.assets.length, schema: parsed.manifest.schema };
    });
    record(labelPackageProbe.records === 9 && labelPackageProbe.assets >= 1 && labelPackageProbe.schema === "promptdeck-label-sheet-package/1.0", `Label-sheet project ZIP round-trip failed: ${JSON.stringify(labelPackageProbe)}`, failures);
    await page.click("#labelSheetWorkspaceDataModeBtn");
    await page.click("#labelSheetDataPasteTab");
    await page.locator("#labelSheetPasteInput").fill([
      "label_id\tnumber\tfront_title\tname\tback_title",
      "MEAL-001\t001\t식권\t홍길동\t사용 안내",
      "MEAL-002\t002\t식권\t김서연\t사용 안내",
    ].join("\n"));
    await page.click("#labelSheetPasteApplyBtn");
    record((await page.locator("#labelSheetRecordTableBody tr[data-record-id]").count()) === 2, "Label-sheet TSV paste review did not expose two rows", failures);
    await page.click("#labelSheetImportCommitBtn");
    await page.waitForFunction(() => window.PromptDeckLabelSheet.getProject().records.length === 2);
    record((await page.locator("#labelSheetImportStatus").textContent()).includes("추가 2건"), "Label-sheet paste commit did not report the replace result", failures);
    await page.selectOption("#labelSheetPasteMode", "update");
    await page.locator("#labelSheetPasteInput").fill([
      "label_id\tfront_title",
      "MEAL-001\t수정 식권",
    ].join("\n"));
    await page.click("#labelSheetPasteApplyBtn");
    await page.click("#labelSheetImportCommitBtn");
    await page.waitForFunction(() => window.PromptDeckLabelSheet.getProject().records[0]?.front?.title === "수정 식권");
    const labelUpdate = await page.evaluate(() => {
      const [first, second] = window.PromptDeckLabelSheet.getProject().records;
      return {
        count: window.PromptDeckLabelSheet.getProject().records.length,
        firstTitle: first?.front?.title,
        firstName: first?.data?.name,
        firstBackTitle: first?.back?.title,
        secondTitle: second?.front?.title,
      };
    });
    record(
      labelUpdate.count === 2 &&
      labelUpdate.firstTitle === "수정 식권" &&
      labelUpdate.firstName === "홍길동" &&
      labelUpdate.firstBackTitle === "사용 안내" &&
      labelUpdate.secondTitle === "식권",
      `Label-sheet update-by-ID cleared fields that were not supplied: ${JSON.stringify(labelUpdate)}`,
      failures
    );
    record((await page.locator("#labelSheetImportStatus").textContent()).includes("업데이트 1건"), "Label-sheet update-by-ID did not report the updated row", failures);
    const spreadsheetTitleCell = page.locator('#labelSheetRecordTableBody input[data-record-field="front.title"]').first();
    await spreadsheetTitleCell.focus();
    await spreadsheetTitleCell.evaluate((element) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData("text/plain", [
        "앞면 제목\t이름·구분",
        "엑셀 붙여넣기 1\t교육생 A",
        "엑셀 붙여넣기 2\t교육생 B",
      ].join("\n"));
      element.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData }));
    });
    await page.waitForFunction(() => {
      const records = window.PromptDeckLabelSheet.getProject().records;
      return records[0]?.front?.title === "엑셀 붙여넣기 1"
        && records[0]?.data?.name === "교육생 A"
        && records[1]?.front?.title === "엑셀 붙여넣기 2"
        && records[1]?.data?.name === "교육생 B";
    });
    record((await page.locator("#labelSheetSpreadsheetStatus").textContent()).includes("4셀"), "Label-sheet spreadsheet paste did not report the applied Excel range", failures);
    const spreadsheetNameCell = page.locator('#labelSheetRecordTableBody input[data-record-field="data.name"]').first();
    await spreadsheetNameCell.fill("공통 교육생");
    await page.click("#labelSheetFillDownBtn");
    await page.waitForFunction(() => window.PromptDeckLabelSheet.getProject().records.every((record) => record.data?.name === "공통 교육생"));
    record((await page.locator("#labelSheetSpreadsheetStatus").textContent()).includes("열 끝") || (await page.locator("#labelSheetSpreadsheetStatus").textContent()).includes("채웠습니다"), "Label-sheet fill-down did not confirm the repeated column value", failures);
    await page.click("#labelSheetCopyAllRowsBtn");
    await page.waitForFunction(() => document.querySelector("#labelSheetSpreadsheetStatus")?.textContent.includes("전체 2행"));
    record((await page.locator("#labelSheetSpreadsheetStatus").textContent()).includes("전체 2행"), "Label-sheet full-table TSV copy was not exposed", failures);
    await page.locator('#labelSheetRecordTableBody input[data-record-select="true"]').first().check();
    await page.click("#labelSheetCopySelectedRowsBtn");
    await page.waitForFunction(() => document.querySelector("#labelSheetSpreadsheetStatus")?.textContent.includes("선택한 1행"));
    record((await page.locator("#labelSheetSpreadsheetStatus").textContent()).includes("선택한 1행"), "Label-sheet selected-row TSV copy was not exposed", failures);
    await page.locator('#labelSheetRecordTableBody input[data-record-select="true"]').first().uncheck();
    await page.locator('#labelSheetRecordTableBody input[data-record-field="front.title"]').first().fill("수정 식권");
    await page.locator('#labelSheetRecordTableBody input[data-record-field="front.title"]').nth(1).fill("식권");
    const firstLabelTitleInput = page.locator("#labelSheetRecordTableBody input[data-record-field='front.title']").first();
    await firstLabelTitleInput.fill("출력 영역을 반드시 넘겨서 정밀 검사에 잡혀야 하는 매우 긴 라벨 제목 ".repeat(20));
    await page.waitForFunction(() => window.PromptDeckLabelSheet.runPreflight().issues.some((issue) => issue.code === "TEXT_TRUNCATED"));
    record(await page.evaluate(() => window.PromptDeckLabelSheet.runPreflight().fatal), "Label-sheet exact text overflow did not block output", failures);
    await firstLabelTitleInput.fill("수정 식권");
    await page.waitForFunction(() => !window.PromptDeckLabelSheet.runPreflight().fatal);
    record(await page.locator("#labelSheetExportPngBtn").isEnabled(), "Label-sheet PNG export stayed disabled after valid pasted data", failures);

    await page.click("#labelSheetWorkspaceDataDrawer [data-label-workspace-drawer-close]");
    await openLabelDetail();
    await page.check("#labelSheetQrEnabled");
    await page.selectOption("#labelSheetQrPosition", "center");
    await page.selectOption("#labelSheetQrSize", "40");
    await page.selectOption("#labelSheetQrLayoutMode", "adaptive");
    await closeLabelDetail();
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('#labelSheetRecordTableBody input[data-record-field="front.qrValue"]');
      ["https://example.kr/meal/MEAL-001", "https://example.kr/meal/MEAL-002"].forEach((value, index) => {
        inputs[index].value = value;
        inputs[index].dispatchEvent(new Event("input", { bubbles: true }));
        inputs[index].dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
    await page.waitForFunction(() => {
      const records = window.PromptDeckLabelSheet.getProject().records;
      return records[0]?.front?.qrValue === "https://example.kr/meal/MEAL-001" && records[1]?.front?.qrValue === "https://example.kr/meal/MEAL-002";
    });
    await page.click("#labelSheetPreviewFrontBtn");
    await page.click('[data-label-canvas-view="sheet"]');
    await page.waitForFunction(() => document.querySelector("#paneLabelSheet")?.dataset.canvasView === "sheet");
    const labelStickyPreviewGeometry = await page.evaluate(() => {
      const frame = document.querySelector("#labelSheetPagePreview");
      const sheet = document.querySelector("#labelSheetPreviewSurface");
      if (!frame || !sheet) return null;
      const frameRect = frame.getBoundingClientRect();
      const sheetRect = sheet.getBoundingClientRect();
      const orientation = window.PromptDeckLabelSheet.getProject().spec.page.orientation;
      return {
        orientation,
        expectedRatio: orientation === "landscape" ? 297 / 210 : 210 / 297,
        actualRatio: sheetRect.width / sheetRect.height,
        frameScrollsInternally: frame.scrollHeight > frame.clientHeight + 1 || frame.scrollWidth > frame.clientWidth + 1,
        clipping: {
          top: Math.max(0, frameRect.top - sheetRect.top),
          right: Math.max(0, sheetRect.right - frameRect.right),
          bottom: Math.max(0, sheetRect.bottom - frameRect.bottom),
          left: Math.max(0, frameRect.left - sheetRect.left),
        },
      };
    });
    record(
      Boolean(labelStickyPreviewGeometry) &&
        Math.abs(labelStickyPreviewGeometry.actualRatio - labelStickyPreviewGeometry.expectedRatio) <= 0.002 &&
        Object.values(labelStickyPreviewGeometry.clipping).every((value) => value <= 1),
      `Label-sheet A4 preview did not preserve ratio inside the two-panel canvas: ${JSON.stringify(labelStickyPreviewGeometry)}`,
      failures
    );
    await page.click('[data-label-canvas-view="ticket"]');
    await page.waitForFunction(() => document.querySelector("#paneLabelSheet")?.dataset.canvasView === "ticket");
    if ((await page.locator("#labelSheetWysiwygToggle").getAttribute("aria-pressed")) !== "true") await page.click("#labelSheetWysiwygToggle");
    await page.waitForFunction(() => document.querySelectorAll("#labelSheetPreviewSurface .label-sheet-wysiwyg-hit").length === 2);
    await page.waitForFunction(() => document.querySelectorAll("#labelSheetFocusSurface .label-sheet-preview-canvas").length === 1
      && document.querySelectorAll("#labelSheetFocusSurface .label-sheet-wysiwyg-hit").length === 1);
    const labelFocusEditorProbe = await page.evaluate(() => {
      const overview = document.querySelector("#labelSheetPreviewSurface");
      const overviewHit = overview?.querySelector(".label-sheet-wysiwyg-hit.is-selected");
      const focus = document.querySelector("#labelSheetFocusSurface");
      return {
        focusHidden: document.querySelector("#labelSheetFocusEditor")?.hidden,
        editorBeforeOverview: Boolean(document.querySelector("#labelSheetFocusEditor")?.compareDocumentPosition(document.querySelector("#labelSheetPagePreview")) & Node.DOCUMENT_POSITION_FOLLOWING),
        backgroundOnly: focus?.dataset.editorLayer,
        editContrast: focus?.classList.contains("is-edit-contrast"),
        overviewFieldCount: overview?.querySelectorAll(".label-sheet-wysiwyg-field").length || 0,
        focusFieldCount: focus?.querySelectorAll(".label-sheet-wysiwyg-field").length || 0,
        focusQrCanvasCount: focus?.querySelectorAll(".label-sheet-wysiwyg-qr canvas").length || 0,
        titleFontSize: parseFloat(getComputedStyle(focus?.querySelector('.label-sheet-wysiwyg-field[data-wysiwyg-field="title"]')).fontSize || "0"),
        overviewHitWidth: overviewHit?.getBoundingClientRect().width || 0,
        focusWidth: focus?.getBoundingClientRect().width || 0,
        recordScopePressed: document.querySelector("#labelSheetFocusScopeRecord")?.getAttribute("aria-pressed"),
        quickIntegrated: document.querySelector("#labelSheetQuickEditbar")?.parentElement?.id,
        commonIntegrated: document.querySelector("#labelSheetCommonLayout")?.parentElement?.id,
        detailIntegrated: document.querySelector("#labelSheetWysiwygDetails")?.parentElement?.id,
        focusStageHost: document.querySelector("#labelSheetFocusStage")?.parentElement?.dataset.labelCanvasPanel,
        inspectorHost: document.querySelector("#labelSheetWorkspaceInspector")?.parentElement?.id,
        dataHost: document.querySelector("#labelSheetDataStep")?.parentElement?.dataset.labelBottomPanel,
      };
    });
    record(
      !labelFocusEditorProbe.focusHidden &&
        labelFocusEditorProbe.editorBeforeOverview &&
        labelFocusEditorProbe.backgroundOnly === "background-only" &&
        labelFocusEditorProbe.editContrast &&
        labelFocusEditorProbe.overviewFieldCount === 0 &&
        labelFocusEditorProbe.focusFieldCount >= 5 &&
        labelFocusEditorProbe.focusQrCanvasCount === 1 &&
        labelFocusEditorProbe.titleFontSize >= 4 &&
        labelFocusEditorProbe.focusWidth > 0 &&
        labelFocusEditorProbe.focusWidth >= labelFocusEditorProbe.overviewHitWidth &&
        labelFocusEditorProbe.recordScopePressed === "true" &&
        labelFocusEditorProbe.quickIntegrated === "labelSheetFocusQuickPanel" &&
        labelFocusEditorProbe.commonIntegrated === "labelSheetFocusCommonPanel" &&
        labelFocusEditorProbe.detailIntegrated === "labelSheetFocusDetailPanel" &&
        labelFocusEditorProbe.focusStageHost === "ticket" &&
        labelFocusEditorProbe.inspectorHost === "labelSheetFocusEditor" &&
        labelFocusEditorProbe.dataHost === "data",
      `Label-sheet focus editor did not separate the enlarged ticket workspace from the A4 selector: ${JSON.stringify(labelFocusEditorProbe)}`,
      failures
    );
    const focusTitleSizeBefore = await page.locator('#labelSheetFocusSurface .label-sheet-wysiwyg-field[data-wysiwyg-field="title"]').evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
    await page.locator("#labelSheetQuickSize").fill("20");
    await page.waitForFunction((before) => parseFloat(getComputedStyle(document.querySelector('#labelSheetFocusSurface .label-sheet-wysiwyg-field[data-wysiwyg-field="title"]')).fontSize) > before, focusTitleSizeBefore);
    await page.click("#labelSheetWorkspaceFineTuneBtn");
    await page.waitForSelector("#labelSheetWorkspaceDetailDrawer:not([hidden])");
    await page.click('[data-label-sheet-focus-align="right"]');
    await page.waitForFunction(() => document.querySelector('#labelSheetFocusSurface .label-sheet-wysiwyg-field[data-wysiwyg-field="title"]')?.style.textAlign === "right");
    record((await page.locator('#labelSheetFocusSurface .label-sheet-wysiwyg-field[data-wysiwyg-field="title"]').evaluate((element) => element.style.textAlign)) === "right", "Label-sheet focus editor did not apply alignment immediately", failures);
    await page.click('[data-label-sheet-focus-align="center"]');
    await closeLabelDetail();
    await page.click("#labelSheetWorkspaceContextTargetPicker > summary");
    await page.click('[data-label-sheet-focus-target="subtitle"]');
    record((await page.locator('[data-label-sheet-focus-target="subtitle"]').getAttribute("aria-pressed")) === "true" && (await page.locator("#labelSheetQuickTarget").inputValue()) === "subtitle", "Label-sheet integrated target shortcuts did not synchronize the selected field", failures);
    const focusSubtitleSizeBefore = Number(await page.locator("#labelSheetQuickSize").inputValue());
    await openLabelDetail();
    await page.click("#labelSheetFocusSizeUp");
    record(Number(await page.locator("#labelSheetQuickSize").inputValue()) === focusSubtitleSizeBefore + 0.5, "Label-sheet integrated size shortcut did not update the selected field", failures);
    await closeLabelDetail();
    await page.locator("#labelSheetFocusStage").press("3");
    record((await page.locator('[data-label-sheet-focus-target="title"]').getAttribute("aria-pressed")) === "true", "Label-sheet numeric field shortcut did not return to the title field", failures);
    const shortcutXBefore = Number(await page.locator("#labelSheetWysiwygX").inputValue());
    await page.locator("#labelSheetQuickSize").focus();
    await page.locator("#labelSheetQuickSize").press("Alt+ArrowRight");
    await page.waitForFunction((before) => Number(document.querySelector("#labelSheetWysiwygX")?.value) === before + 1, shortcutXBefore);
    await page.locator("#labelSheetQuickSize").press("Alt+r");
    await page.waitForFunction(() => document.querySelector('#labelSheetFocusSurface .label-sheet-wysiwyg-field[data-wysiwyg-field="title"]')?.style.textAlign === "right");
    await page.locator("#labelSheetFocusStage").press("c");
    await page.waitForFunction(() => document.querySelector('#labelSheetFocusSurface .label-sheet-wysiwyg-field[data-wysiwyg-field="title"]')?.style.textAlign === "center");
    record(Number(await page.locator("#labelSheetWysiwygX").inputValue()) === shortcutXBefore + 1, "Label-sheet Alt+arrow shortcut was ignored while an editor control held focus", failures);
    await page.click("#labelSheetFocusNext");
    await page.waitForFunction(() => document.querySelector("#labelSheetFocusPosition")?.textContent.trim() === "2 / 2"
      && document.querySelectorAll("#labelSheetPreviewSurface .label-sheet-wysiwyg-hit.is-selected").length === 1
      && document.querySelector("#labelSheetPreviewSurface .label-sheet-wysiwyg-hit.is-selected") === document.querySelectorAll("#labelSheetPreviewSurface .label-sheet-wysiwyg-hit")[1]);
    await page.click("#labelSheetFocusPrev");
    await page.waitForFunction(() => document.querySelector("#labelSheetFocusPosition")?.textContent.trim() === "1 / 2");
    await page.click("#labelSheetFocusScopeGlobal");
    record(
      (await page.locator("#labelSheetFocusScopeGlobal").getAttribute("aria-pressed")) === "true" &&
        (await page.locator("#labelSheetQuickScope").inputValue()) === "global",
      "Label-sheet focus editor did not disclose or synchronize the common-layout scope",
      failures
    );
    await page.click("#labelSheetFocusScopeRecord");
    await page.click("#labelSheetWorkspaceCommonBtn");
    await page.waitForSelector("#labelSheetWorkspaceDetailDrawer:not([hidden])");
    record(await page.locator("#labelSheetFocusCommonPanel").isVisible() && await page.locator("#labelSheetCommonLayout").isVisible(), "Label-sheet common layout was not available inside the detail dialog", failures);
    await page.click("#labelSheetFocusDetailTab");
    record(await page.locator("#labelSheetFocusDetailPanel").isVisible() && await page.locator("#labelSheetWysiwygDetails").evaluate((element) => element.open), "Label-sheet detailed preset editor was not available inside the detail dialog", failures);
    await page.locator("#labelSheetWysiwygY").fill("40");
    await page.locator("#labelSheetWysiwygY").dispatchEvent("change");
    await page.waitForFunction(() => document.querySelector("#labelSheetQuickWidthValue")?.textContent.includes("→"));
    record((await page.locator("#labelSheetQuickStatus").textContent()).includes("실제 너비"), "Label-sheet adaptive QR wrapping did not disclose the applied text width", failures);

    await page.locator("#labelSheetWysiwygWidth").fill("62");
    await page.locator("#labelSheetWysiwygWidth").dispatchEvent("change");
    await page.waitForFunction(() => window.PromptDeckLabelSheet.getProject().settings.recordTextLayouts?.["record:MEAL-001"]?.front?.withQr?.title?.widthPercent === 62);
    await page.click("#labelSheetWorkspaceDetailDrawer [data-label-workspace-drawer-close]");
    await page.waitForSelector("#labelSheetWorkspaceDetailDrawer", { state: "hidden" });
    const firstRecordSelection = page.locator('#labelSheetRecordTableBody input[data-record-select="true"]').first();
    await page.evaluate(() => {
      const selected = document.querySelector('#labelSheetRecordTableBody input[data-record-select="true"]');
      selected.checked = true;
      selected.dispatchEvent(new Event("change", { bubbles: true }));
      const id = document.querySelector('#labelSheetRecordTableBody input[data-record-field="id"]');
      id.value = "MEAL-RENAMED";
      id.dispatchEvent(new Event("input", { bubbles: true }));
      id.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForFunction(() => {
      const project = window.PromptDeckLabelSheet.getProject();
      return project.records[0]?.id === "MEAL-RENAMED" &&
        project.settings.recordTextLayouts?.["record:MEAL-RENAMED"]?.front?.withQr?.title?.widthPercent === 62 &&
        !project.settings.recordTextLayouts?.["record:MEAL-001"];
    });
    await page.waitForFunction(() => document.querySelector("#labelSheetFocusDescription")?.textContent.includes("MEAL-RENAMED")
      && !document.querySelector("#labelSheetFocusEditor")?.classList.contains("is-rendering"));
    record(
      await firstRecordSelection.isChecked() && (await page.locator("#labelSheetRecordTableBody tr").first().getAttribute("data-record-id")) === "MEAL-RENAMED",
      "Label-sheet ID edit lost the selected row or left a stale row identity",
      failures
    );

    await page.click("#labelSheetFocusScopeGlobal");
    await page.waitForFunction(() => document.querySelector("#labelSheetFocusScopeGlobal")?.getAttribute("aria-pressed") === "true"
      && document.querySelector("#labelSheetQuickScope")?.value === "global");
    await openLabelDetail();
    await page.locator("#labelSheetWysiwygWidth").fill("74");
    await page.locator("#labelSheetWysiwygWidth").dispatchEvent("change");
    await page.waitForFunction(() => {
      const settings = window.PromptDeckLabelSheet.getProject().settings;
      return settings.textLayouts?.front?.withQr?.title?.widthPercent === 74 &&
        !settings.recordTextLayouts?.["record:MEAL-RENAMED"]?.front?.withQr;
    });
    await closeLabelDetail();
    await page.click("#labelSheetFocusScopeRecord");
    await page.waitForFunction(() => document.querySelector("#labelSheetWysiwygWidth")?.value === "74"
      && document.querySelector("#labelSheetWysiwygStatus")?.textContent.includes("공통값 상속"));
    await page.click("#labelSheetFocusNext");
    await page.waitForFunction(() => document.querySelector("#labelSheetWysiwygWidth")?.value === "74");
    record(
      !(await page.evaluate(() => Object.values(window.PromptDeckLabelSheet.getProject().settings.recordTextLayouts || {})
        .some((entry) => Boolean(entry?.front?.withQr)))) &&
        Number(await page.locator("#labelSheetWysiwygWidth").inputValue()) === 74,
      "Label-sheet common layout did not replace per-ticket overrides for every ticket in the same face and QR variant",
      failures
    );
    await page.click("#labelSheetFocusPrev");

    await page.evaluate(() => {
      const id = document.querySelectorAll('#labelSheetRecordTableBody input[data-record-field="id"]')[1];
      id.value = "MEAL-RENAMED";
      id.dispatchEvent(new Event("input", { bubbles: true }));
      id.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForFunction(() => window.PromptDeckLabelSheet.getProject().records[1]?.id === "MEAL-RENAMED");
    await page.click("#labelSheetFocusNext");
    await page.waitForFunction(() => document.querySelector("#labelSheetFocusPosition")?.textContent.trim().startsWith("2 /"));
    await openLabelDetail();
    await page.locator("#labelSheetWysiwygText").fill("두 번째 식권만 수정");
    await page.waitForFunction(() => window.PromptDeckLabelSheet.getProject().records[1]?.front?.title === "두 번째 식권만 수정");
    await closeLabelDetail();
    const duplicateIdEdit = await page.evaluate(() => window.PromptDeckLabelSheet.getProject().records.map((record) => record.front?.title));
    record(duplicateIdEdit[0] === "수정 식권" && duplicateIdEdit[1] === "두 번째 식권만 수정", `Label-sheet selected placement edited the wrong duplicate-ID row: ${JSON.stringify(duplicateIdEdit)}`, failures);
    await page.evaluate(() => {
      const id = document.querySelectorAll('#labelSheetRecordTableBody input[data-record-field="id"]')[1];
      id.value = "MEAL-002";
      id.dispatchEvent(new Event("input", { bubbles: true }));
      id.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForFunction(() => window.PromptDeckLabelSheet.getProject().records[1]?.id === "MEAL-002");
    await page.click("#labelSheetFocusPrev");
    await page.waitForFunction(() => document.querySelector("#labelSheetFocusPosition")?.textContent.trim().startsWith("1 /"));
    await openLabelDetail();
    await page.click("#labelSheetWysiwygResetField");
    await page.selectOption("#labelSheetQrPosition", "right");
    await page.selectOption("#labelSheetQrSize", "28");
    await closeLabelDetail();
    await page.waitForFunction(() => !window.PromptDeckLabelSheet.runPreflight().fatal);
    await page.click("#labelSheetWorkspaceReviewBtn");
    await page.waitForSelector("#labelSheetWorkspaceReviewDrawer:not([hidden])");

    const labelResultOverflow = await page.locator("#labelSheetWorkspaceReviewDrawer").evaluate((drawer) => {
      const panel = drawer.querySelector(".label-sheet-workspace-drawer-panel");
      const body = drawer.querySelector(".label-sheet-workspace-drawer-body");
      const result = drawer.querySelector("#labelSheetResultCard");
      const panelBox = panel?.getBoundingClientRect();
      return {
        drawerOpen: drawer.dataset.open,
        panelHeight: panelBox?.height || 0,
        viewportHeight: window.innerHeight,
        bodyOverflowY: body ? getComputedStyle(body).overflowY : "missing",
        resultOverflowY: result ? getComputedStyle(result).overflowY : "missing",
      };
    });
    record(
      labelResultOverflow.drawerOpen === "true" &&
        labelResultOverflow.panelHeight <= labelResultOverflow.viewportHeight + 1 &&
        ["auto", "scroll"].includes(labelResultOverflow.bodyOverflowY) &&
        !["auto", "scroll"].includes(labelResultOverflow.resultOverflowY),
      `Label-sheet review drawer did not own result scrolling correctly: ${JSON.stringify(labelResultOverflow)}`,
      failures
    );
    await page.click("#labelSheetWorkspaceReviewDrawer [data-label-workspace-drawer-close]");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(250);
    const labelMobileBox = await page.locator("#paneLabelSheet").boundingBox();
    const labelCanvasMobileBox = await page.locator(".label-sheet-workspace-canvas-column").boundingBox();
    const labelMobileLayout = await page.evaluate(() => {
      const pane = document.querySelector("#paneLabelSheet");
      const action = document.querySelector("#mobileTabActions");
      const topbar = pane?.querySelector(".label-sheet-workspace-topbar");
      const toolButton = pane?.querySelector("#labelSheetWorkspaceToolsBtn");
      const toolPanel = pane?.querySelector("#labelSheetWorkspaceToolPanel");
      const left = pane?.querySelector(".label-sheet-workspace-left");
      const paneBox = pane?.getBoundingClientRect();
      const actionBox = action?.getBoundingClientRect();
      const visibleTopbarButtons = Array.from(topbar?.querySelectorAll("button") || [])
        .filter((control) => control.getClientRects().length && getComputedStyle(control).visibility !== "hidden");
      return {
        documentOverflow: document.documentElement.scrollHeight > window.innerHeight + 1,
        headerDisplay: getComputedStyle(document.querySelector(".app-header")).display,
        paneBottom: paneBox?.bottom || 0,
        actionTop: actionBox?.top || window.innerHeight,
        toolbarDisplay: getComputedStyle(document.querySelector("#labelSheetPreviewToolbar")).display,
        leftPanelCount: pane?.querySelectorAll(".label-sheet-workspace-left").length || 0,
        leftPanelDisplay: left ? getComputedStyle(left).display : "missing",
        toolPanelPresent: Boolean(toolPanel),
        toolPanelVisibility: toolPanel ? getComputedStyle(toolPanel).visibility : "missing",
        toolButtonVisible: Boolean(toolButton?.getClientRects().length),
        smallTopbarButtons: visibleTopbarButtons.filter((control) => {
          const box = control.getBoundingClientRect();
          return box.width < 44 || box.height < 44;
        }).map((control) => control.id || control.textContent?.trim()),
      };
    });
    record(Boolean(labelMobileBox && labelMobileBox.x >= 0 && labelMobileBox.x + labelMobileBox.width <= 390), "Label-sheet workflow overflowed the mobile viewport", failures);
    record(Boolean(labelCanvasMobileBox && labelCanvasMobileBox.width >= 280 && labelCanvasMobileBox.x + labelCanvasMobileBox.width <= 390), "Label-sheet mobile workspace did not prioritize the canvas", failures);
    record(
      !labelMobileLayout.documentOverflow
        && labelMobileLayout.headerDisplay === "none"
        && labelMobileLayout.paneBottom <= labelMobileLayout.actionTop + 1
        && labelMobileLayout.toolbarDisplay === "none"
        && labelMobileLayout.leftPanelCount === 1
        && labelMobileLayout.leftPanelDisplay === "none"
        && labelMobileLayout.toolPanelPresent
        && labelMobileLayout.toolPanelVisibility === "hidden"
        && labelMobileLayout.toolButtonVisible
        && labelMobileLayout.smallTopbarButtons.length === 0,
      `Label-sheet mobile viewport still overlapped or wasted canvas space: ${JSON.stringify(labelMobileLayout)}`,
      failures
    );
    record(
      await page.locator("#labelSheetWorkspaceDataModeBtn").isVisible()
        && await page.locator("#labelSheetWorkspaceInspectorBtn").isVisible()
        && await page.locator("#labelSheetWorkspaceToolsBtn").isVisible(),
      "Label-sheet mobile workspace hid data, property, or project access",
      failures
    );
    await page.click("#labelSheetWorkspaceToolsBtn");
    await page.waitForFunction(() => document.querySelector("#paneLabelSheet")?.classList.contains("is-mobile-tool-panel-open"));
    await page.click('[data-label-workspace-mobile-tool="project"]');
    const labelMobileToolPanel = await page.evaluate(() => {
      const pane = document.querySelector("#paneLabelSheet");
      const panel = document.querySelector("#labelSheetWorkspaceToolPanel");
      const panelBox = panel?.getBoundingClientRect();
      const activePanels = Array.from(panel?.querySelectorAll("[data-label-workspace-panel]") || [])
        .filter((element) => !element.hidden && getComputedStyle(element).display !== "none");
      const visibleControls = Array.from(panel?.querySelectorAll("button, a, input, select, textarea") || [])
        .filter((control) => {
          const box = control.getBoundingClientRect();
          const style = getComputedStyle(control);
          return box.width > 0 && box.height > 0 && style.display !== "none" && style.visibility !== "hidden";
        });
      return {
        expanded: document.querySelector("#labelSheetWorkspaceToolsBtn")?.getAttribute("aria-expanded"),
        visibility: panel ? getComputedStyle(panel).visibility : "missing",
        width: panelBox?.width || 0,
        viewportWidth: window.innerWidth,
        activePanels: activePanels.map((element) => element.dataset.labelWorkspacePanel),
        selectedTool: panel?.querySelector('[data-label-workspace-mobile-tool][aria-selected="true"]')?.dataset.labelWorkspaceMobileTool,
        smallControls: visibleControls.filter((control) => {
          const box = control.getBoundingClientRect();
          return box.width < 44 || box.height < 44;
        }).map((control) => control.id || control.textContent?.trim()),
        documentOverflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        paneOpen: pane?.classList.contains("is-mobile-tool-panel-open"),
      };
    });
    record(
      labelMobileToolPanel.expanded === "true"
        && labelMobileToolPanel.paneOpen
        && labelMobileToolPanel.visibility === "visible"
        && labelMobileToolPanel.width >= 320
        && labelMobileToolPanel.width <= labelMobileToolPanel.viewportWidth + 1
        && labelMobileToolPanel.activePanels.length === 1
        && labelMobileToolPanel.activePanels[0] === "project"
        && labelMobileToolPanel.selectedTool === "project"
        && labelMobileToolPanel.smallControls.length === 0
        && !labelMobileToolPanel.documentOverflowX,
      `Label-sheet mobile project menu was not a clear touch-first entry point: ${JSON.stringify(labelMobileToolPanel)}`,
      failures
    );
    await page.click("#labelSheetWorkspaceSetupStartBtnMobile");
    await page.waitForSelector("#labelSheetWorkspaceSettingsDrawer:not([hidden])");
    const labelMobileSettings = await page.evaluate(() => {
      const drawer = document.querySelector("#labelSheetWorkspaceSettingsDrawer");
      const panel = drawer?.querySelector(".label-sheet-workspace-drawer-panel");
      const box = panel?.getBoundingClientRect();
      const smallControls = Array.from(panel?.querySelectorAll("button, a, input, select, textarea") || [])
        .filter((control) => {
          const rect = control.getBoundingClientRect();
          const style = getComputedStyle(control);
          if (!rect.width || !rect.height || style.display === "none" || style.visibility === "hidden") return false;
          if (control.matches('input[type="checkbox"], input[type="radio"], input[type="range"]')) return false;
          return rect.width < 44 || rect.height < 44;
        }).map((control) => control.id || control.textContent?.trim());
      return {
        open: drawer?.dataset.open,
        width: box?.width || 0,
        height: box?.height || 0,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        toolPanelOpen: document.querySelector("#paneLabelSheet")?.classList.contains("is-mobile-tool-panel-open"),
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        smallControls,
      };
    });
    record(
      labelMobileSettings.open === "true"
        && labelMobileSettings.width >= 320
        && labelMobileSettings.width <= labelMobileSettings.viewportWidth + 1
        && labelMobileSettings.height <= labelMobileSettings.viewportHeight + 1
        && !labelMobileSettings.toolPanelOpen
        && !labelMobileSettings.overflowX
        && labelMobileSettings.smallControls.length === 0,
      `Label-sheet mobile output settings did not open as a focused, touch-safe screen: ${JSON.stringify(labelMobileSettings)}`,
      failures
    );
    await page.keyboard.press("Escape");
    await page.waitForSelector("#labelSheetWorkspaceSettingsDrawer", { state: "hidden" });
    await page.click("#labelSheetWorkspaceToolsBtn");
    await page.waitForFunction(() => document.querySelector("#paneLabelSheet")?.classList.contains("is-mobile-tool-panel-open"));
    await page.click('[data-label-workspace-mobile-tool="records"]');
    await page.waitForFunction(() => {
      const panel = document.querySelector("#labelSheetWorkspaceDataDrawer .label-sheet-workspace-drawer-panel");
      const box = panel?.getBoundingClientRect();
      return document.querySelector("#labelSheetWorkspaceDataDrawer")?.dataset.open === "true"
        && getComputedStyle(panel).visibility === "visible"
        && box.left >= 0
        && box.right <= window.innerWidth + 1;
    });
    const labelMobileRecordCounts = await page.evaluate(() => ({
      drawer: document.querySelectorAll("#labelSheetWorkspaceRecordList .label-sheet-workspace-record").length,
      project: window.PromptDeckLabelSheet.getProject().records.length,
    }));
    record(
      labelMobileRecordCounts.drawer > 0 && labelMobileRecordCounts.drawer === labelMobileRecordCounts.project,
      `Label-sheet mobile record drawer did not mirror the current records: ${JSON.stringify(labelMobileRecordCounts)}`,
      failures
    );
    await page.keyboard.press("Escape");
    await page.waitForSelector("#labelSheetWorkspaceDataDrawer", { state: "hidden" });
    await page.click("#labelSheetWorkspaceInspectorBtn");
    await page.waitForFunction(() => document.querySelector("#paneLabelSheet")?.classList.contains("is-mobile-inspector-open"));
    const labelMobileInspectorOpen = await page.locator("#labelSheetWorkspaceInspector").evaluate((element) => ({
      expanded: document.querySelector("#labelSheetWorkspaceInspectorBtn")?.getAttribute("aria-expanded"),
      visibility: getComputedStyle(element).visibility,
      display: getComputedStyle(element).display,
      width: element.getBoundingClientRect().width,
      transform: getComputedStyle(element).transform,
      smallControls: Array.from(element.querySelectorAll("button, a, input, select, textarea"))
        .filter((control) => {
          const box = control.getBoundingClientRect();
          const style = getComputedStyle(control);
          if (!box.width || !box.height || style.display === "none" || style.visibility === "hidden") return false;
          if (control.matches('input[type="checkbox"], input[type="radio"], input[type="range"]')) return false;
          return box.width < 44 || box.height < 44;
        }).map((control) => control.id || control.textContent?.trim()),
    }));
    record(
      labelMobileInspectorOpen.expanded === "true"
        && labelMobileInspectorOpen.visibility === "visible"
        && labelMobileInspectorOpen.display !== "none"
        && labelMobileInspectorOpen.width >= 280
        && labelMobileInspectorOpen.smallControls.length === 0,
      `Label-sheet mobile property drawer did not open with touch-safe controls: ${JSON.stringify(labelMobileInspectorOpen)}`,
      failures
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector("#paneLabelSheet")?.classList.contains("is-mobile-inspector-open"));
    await page.waitForFunction(() => getComputedStyle(document.querySelector("#labelSheetWorkspaceInspector")).visibility === "hidden");
    const labelMobileInspectorClosed = await page.locator("#labelSheetWorkspaceInspector").evaluate((element) => ({
      expanded: document.querySelector("#labelSheetWorkspaceInspectorBtn")?.getAttribute("aria-expanded"),
      visibility: getComputedStyle(element).visibility,
      left: element.getBoundingClientRect().left,
      viewportWidth: window.innerWidth,
    }));
    record(labelMobileInspectorClosed.expanded === "false" && labelMobileInspectorClosed.visibility === "hidden", `Label-sheet mobile property drawer did not close with Escape: ${JSON.stringify(labelMobileInspectorClosed)}`, failures);
    record(await page.locator("#paneLabelSheet #tabActions").isHidden(), "Label-sheet quick action dock remained visible on mobile", failures);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(250);
    const labelSmallMobileLayout = await page.evaluate(() => {
      const pane = document.querySelector("#paneLabelSheet")?.getBoundingClientRect();
      const action = document.querySelector("#mobileTabActions")?.getBoundingClientRect();
      const canvas = document.querySelector(".label-sheet-workspace-canvas-column")?.getBoundingClientRect();
      return {
        documentHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight,
        paneBottom: pane?.bottom || 0,
        actionTop: action?.top || window.innerHeight,
        canvasWidth: canvas?.width || 0,
      };
    });
    record(
      labelSmallMobileLayout.documentHeight <= labelSmallMobileLayout.viewportHeight + 1
        && labelSmallMobileLayout.paneBottom <= labelSmallMobileLayout.actionTop + 1
        && labelSmallMobileLayout.canvasWidth >= 280,
      `Label-sheet compact phone viewport overflowed: ${JSON.stringify(labelSmallMobileLayout)}`,
      failures
    );
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(250);
    const labelLandscapeLayout = await page.evaluate(() => {
      const pane = document.querySelector("#paneLabelSheet");
      const canvas = document.querySelector(".label-sheet-workspace-canvas-column")?.getBoundingClientRect();
      return {
        documentHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight,
        headerDisplay: getComputedStyle(document.querySelector(".app-header")).display,
        inspectorAccess: getComputedStyle(document.querySelector("#labelSheetWorkspaceInspectorBtn")).display,
        canvasWidth: canvas?.width || 0,
      };
    });
    record(
      labelLandscapeLayout.documentHeight <= labelLandscapeLayout.viewportHeight + 1
        && labelLandscapeLayout.headerDisplay === "none"
        && labelLandscapeLayout.inspectorAccess !== "none"
        && labelLandscapeLayout.canvasWidth >= 700,
      `Label-sheet compact landscape viewport overflowed: ${JSON.stringify(labelLandscapeLayout)}`,
      failures
    );
    await page.setViewportSize({ width: 1440, height: 1200 });

    await page.click("#tabBtnMapPrompt");
    await page.waitForSelector("#paneMapPrompt.active");
    record((await page.locator("#paneMapPrompt .map-result-stack > #tabActions").count()) === 1, "Map quick actions were not mounted in an independent result column", failures);
    record((await page.locator("#paneMapPrompt .map-result-stack > .map-preview-section").count()) === 1, "Map result panel was not kept as a sibling of the quick action dock", failures);
    record((await page.locator("#paneMapPrompt .map-workflow").count()) === 1, "Map inputs and preference controls were not grouped into one workflow", failures);
    record((await page.locator("#paneMapPrompt .map-workflow > .map-flow-step").count()) === 3, "Map workflow did not expose the three ordered steps", failures);
    record((await page.locator("#paneMapPrompt .map-workflow > .map-context-panel + .map-decision-panel + .map-preference-panel").count()) === 1, "Map workflow steps were not kept in context-to-preference order", failures);
    record((await page.locator("#paneMapPrompt .map-workflow-progress > li").count()) === 3, "Map workflow progress did not match the three content steps", failures);
    record((await page.locator("#paneMapPrompt .map-finalize-panel").count()) === 0, "Removed map finalize panel was still present", failures);
    record((await page.locator("#paneMapPrompt .map-context-panel #mapCanvas").count()) === 1, "Map canvas control was not moved into the context step", failures);
    record((await page.locator("#paneMapPrompt .map-decision-panel #mapLabels").count()) === 1, "Map label content was not moved into the result-form step", failures);
    record((await page.locator("#paneMapPrompt .map-preference-panel #mapPreferenceDetails").count()) === 1, "Map visual detail controls were not moved into the preference step", failures);
    record((await page.locator("#paneMapPrompt .map-preference-panel #mapExclusions").count()) === 1, "Map quality constraints were not moved into the preference step", failures);
    record((await page.locator("#paneMapPrompt .map-workflow > .map-workflow-footer #mapGeneratePromptBtn").count()) === 1, "Map completion actions were not moved into the unnumbered workflow footer", failures);
    await page.click("#mapResetBtn");
    await page.waitForTimeout(100);
    record(!(await page.locator("#mapPromptPanel").isHidden()), "Map prompt was not shown as the primary result view", failures);
    record(await page.locator("#mapOutcomePanel").isHidden(), "Map composition reference displaced the primary prompt view", failures);
    record((await page.locator("#paneMapPrompt .map-quick-nav a").count()) === 3, "Map quick navigation did not expose the three input steps", failures);
    record((await page.locator("#paneMapPrompt .map-context-writing-grid .map-required-label").count()) === 2, "Map required context inputs were not identified", failures);
    record((await page.locator("#mapIntentGrid .map-intent-card").count()) === 5, "Map decision tree did not render five primary intents", failures);
    record((await page.locator('[data-map-intent="location"].active').count()) === 1, "Map decision tree did not restore the default location intent", failures);
    record((await page.locator('[data-map-branch="boundary-focus"].active').count()) === 1, "Map decision tree did not restore the default boundary result", failures);
    record((await page.locator("#mapOutcomeArt svg").count()) === 1, "Map outcome preview SVG was not rendered", failures);
    record((await page.locator("#mapOutcomeArt [data-map-layer]").count()) === 8, "Map outcome preview did not render the eight semantic SVG layers", failures);
    record((await page.locator('[data-map-preview-mode="composed"][aria-pressed="true"]').count()) === 1, "Map outcome preview did not default to the composed mode", failures);
    record((await page.locator("#mapReadinessBadge").textContent()).includes("입력 보완"), "Map readiness check did not flag missing context inputs", failures);
    const promptBeforePreviewMode = await page.locator("#mapPromptPreview").inputValue();
    await page.click("#mapOutcomeTab");
    await page.click('[data-map-preview-mode="flat"]');
    record((await page.locator('[data-map-preview-mode="flat"][aria-pressed="true"]').count()) === 1, "Map flat preview mode did not activate", failures);
    record((await page.locator("#mapPromptPreview").inputValue()) === promptBeforePreviewMode, "Map preview-only mode changed the generated prompt", failures);
    record((await page.locator('#mapOutcomeArt [data-map-layer="finish"] > *').count()) === 0, "Map flat preview retained finish effects", failures);
    await page.click('[data-map-preview-mode="composed"]');
    await page.click('#mapLayerButtons [data-map-layer="target"]');
    record((await page.locator('#mapOutcomeArt [data-map-layer="target"].is-highlighted').count()) === 1, "Map layer inspector did not highlight the selected target layer", failures);
    record((await page.locator('#mapOutcomeArt [data-map-layer="base"].is-dimmed').count()) === 1, "Map layer inspector did not de-emphasize other layers", failures);
    await page.click('#mapLayerButtons [data-map-layer="target"]');
    await page.locator("#mapReferenceNote").fill("행정경계와 주요 도로가 표시된 참조 지도입니다.");
    await page.locator("#mapTargetArea").fill("지도 중앙 남동쪽 대상 사업 부지입니다.");
    await page.locator("#mapContextInfo").fill("광역 접근성과 주변 산업거점 연계를 강조합니다.");
    await page.waitForTimeout(100);
    record((await page.locator("#mapReadinessBadge").textContent()).includes("준비 완료"), "Map readiness check did not recognize a complete brief", failures);
    await page.click('[data-map-intent="access"]');
    await page.waitForSelector('[data-map-branch="access-axis"].active');
    record((await page.locator("#mapPathSummary").textContent()).includes("도로·철도 접근축"), "Map decision path did not update for the access intent", failures);
    record((await page.locator("#mapPromptPreview").inputValue()).includes("verified road, rail, or regional access axes"), "Map prompt did not reflect the selected access-axis result", failures);
    await page.locator("#mapDepthRange").fill("2");
    await page.waitForTimeout(100);
    record((await page.locator('#mapOutcomeArt [data-map-layer="depth"] > *').count()) > 0, "Map composed preview did not render target depth at an allowed depth level", failures);
    record((await page.locator('#mapLayerButtons [data-map-layer="depth"]').count()) === 1, "Map layer inspector did not expose the active depth layer", failures);
    await page.locator("#mapAnnotationMode").selectOption("inset-map");
    await page.waitForTimeout(100);
    record((await page.locator("#mapTechniqueGrid").textContent()).includes("확대 인셋"), "Map annotation selection did not update the derived technique summary", failures);
    await page.click('[data-map-intent="performance"]');
    await page.locator("#mapDepthRange").fill("4");
    await page.waitForTimeout(100);
    record((await page.locator("#mapDepthRange").inputValue()) === "1", "Map depth preference exceeded the before/after branch safety cap", failures);
    record(await page.locator("#mapThreeDStyle").isDisabled(), "Map 3D control remained enabled when the normalized result used no 3D", failures);
    record(await page.locator("#mapCameraAngle").isDisabled(), "Map camera control remained enabled when 3D was not in use", failures);
    record((await page.locator("#mapDepthAvailabilityHint").textContent()).includes("사용할 수 없습니다"), "Map depth detail did not explain why 3D controls were unavailable", failures);
    await page.locator("#mapPreferenceDetails").evaluate((details) => { details.open = true; });
    await page.locator("#mapColorPalette").selectOption("green-growth");
    await page.waitForTimeout(100);
    record((await page.locator("#mapToneDetailStatus").textContent()).includes("직접 조정"), "Map detail override state was not exposed after a manual palette change", failures);
    await page.click('[data-map-preference-reset="tone"]');
    record((await page.locator("#mapToneDetailStatus").textContent()).includes("슬라이더 연동"), "Map detail recommendation reset did not restore slider-linked state", failures);
    await page.locator("#mapPreferenceDetails").evaluate((details) => { details.open = false; });
    await page.click("#mapPromptTab");
    record(await page.locator("#mapOutcomePanel").isHidden(), "Map result tabs did not hide the outcome preview on the prompt view", failures);
    record(!(await page.locator("#mapPromptPanel").isHidden()), "Map result tabs did not reveal the prompt view", failures);
    await page.click("#mapOutcomeTab");
    for (const viewport of [{ width: 960, height: 1000 }, { width: 720, height: 900 }]) {
      await page.setViewportSize(viewport);
      const workflowBox = await page.locator("#paneMapPrompt .map-workflow").boundingBox();
      record(Boolean(workflowBox && workflowBox.x >= 0 && workflowBox.x + workflowBox.width <= viewport.width), `Integrated map workflow overflowed the ${viewport.width}px viewport`, failures);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const mapWorkflowMobileBox = await page.locator("#paneMapPrompt .map-workflow").boundingBox();
    const mapDecisionMobileBox = await page.locator("#paneMapPrompt .map-decision-panel").boundingBox();
    const mapOutcomeMobileBox = await page.locator("#paneMapPrompt .map-outcome-art").boundingBox();
    const mapFooterMobileBox = await page.locator("#paneMapPrompt .map-workflow-footer").boundingBox();
    const mapReadinessMobileBox = await page.locator("#paneMapPrompt .map-readiness-panel").boundingBox();
    record(Boolean(mapWorkflowMobileBox && mapWorkflowMobileBox.x >= 0 && mapWorkflowMobileBox.x + mapWorkflowMobileBox.width <= 390), "Integrated map workflow overflowed the mobile viewport", failures);
    record(Boolean(mapDecisionMobileBox && mapDecisionMobileBox.x >= 0 && mapDecisionMobileBox.x + mapDecisionMobileBox.width <= 390), "Map decision tree overflowed the mobile viewport", failures);
    record(Boolean(mapOutcomeMobileBox && mapOutcomeMobileBox.x >= 0 && mapOutcomeMobileBox.x + mapOutcomeMobileBox.width <= 390), "Map outcome preview overflowed the mobile viewport", failures);
    record(Boolean(mapFooterMobileBox && mapFooterMobileBox.x >= 0 && mapFooterMobileBox.x + mapFooterMobileBox.width <= 390), "Map workflow footer overflowed the mobile viewport", failures);
    record(Boolean(mapReadinessMobileBox && mapReadinessMobileBox.x >= 0 && mapReadinessMobileBox.x + mapReadinessMobileBox.width <= 390), "Map readiness panel overflowed the mobile viewport", failures);
    record(await page.locator(".map-workflow-progress").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length) === 3, "Map workflow progress did not render the three compact mobile steps", failures);
    record(await page.locator("#mapIntentGrid").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length) === 1, "Map intent choices did not collapse to one column on mobile", failures);
    record(await page.locator(".map-range-grid").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length) === 1, "Map preference controls did not collapse to one column on mobile", failures);
    record(await page.locator("#paneMapPrompt #tabActions").isHidden(), "Map quick action dock remained visible on mobile", failures);
    record(!(await page.locator(".map-preference-details").getAttribute("open")), "Map preference details opened by default and crowded the mobile flow", failures);
    await page.setViewportSize({ width: 1440, height: 1200 });

    await page.click("#tabBtnDataDiagram");
    await page.waitForSelector("#paneDataDiagram.active");
    record((await page.locator("#diagramTypeGrid .diagram-choice-card").count()) === 8, "Data Diagram did not render the eight supported diagram families", failures);
    record((await page.locator("#diagramLivePreview svg").count()) === 1, "Data Diagram did not render the live structure preview", failures);
    record((await page.locator("#diagramBestMatch .diagram-match-art svg").count()) === 1, "Data Diagram did not render the matched expected image", failures);
    record((await page.locator("#diagramAlternativeMatches .diagram-alt-card").count()) === 2, "Data Diagram did not expose two alternative expected images", failures);
    record((await page.locator(".diagram-match-disclaimer").textContent()).includes("성공 확률이 아닙니다"), "Data Diagram did not distinguish setting match score from generation probability", failures);
    record((await page.locator("#diagramReadinessBadge").textContent()).includes("입력 보완"), "Data Diagram readiness did not flag missing source data", failures);
    await page.click("#diagramSampleBtn");
    await page.waitForTimeout(150);
    record((await page.locator('[data-option-id="funnel"][aria-checked="true"]').count()) >= 1, "Data Diagram sample did not select the funnel structure", failures);
    record((await page.locator("#diagramDataSummary").textContent()).includes("항목 4개"), "Data Diagram sample was not parsed into four items", failures);
    record((await page.locator("#diagramReadinessBadge").textContent()).includes("준비 완료"), "Data Diagram sample did not become generation-ready", failures);
    record((await page.locator("#diagramMatchScore").textContent()).includes("100%"), "Data Diagram exact visual preset did not produce a 100 percent setting match", failures);
    record((await page.locator("#diagramPromptPreview").inputValue()).includes('label: "수출계약 체결"') && (await page.locator("#diagramPromptPreview").inputValue()).includes('exact data: "12 · 개사"'), "Data Diagram prompt did not preserve the sample label, value, and unit", failures);
    record((await page.locator("#diagramBestMatch svg").textContent()).includes("참여기업 모집"), "Data Diagram expected match still used preset sample copy instead of source data", failures);
    await page.click('[data-diagram-result="spec"]');
    record((await page.locator("#diagramSpecPreview").textContent()).includes('"dataMustRemainExact": true'), "Data Diagram structure spec omitted the immutable-data contract", failures);
    const diagramV2Contract = await page.evaluate(() => {
      const spec = window.PromptDeckDataDiagram.getSpec();
      const collisionData = window.PromptDeckDataDiagram.parseData("항목\nA+B\nA B");
      const exportSvg = window.PromptDeckDataDiagram.renderExportSvg();
      return {
        schema: spec.schema,
        hash: spec.source.hash,
        uniqueIds: new Set(collisionData.nodes.map((node) => node.id)).size === collisionData.nodes.length,
        exportCanvas: /width="1920" height="1080"/.test(exportSvg),
      };
    });
    record(diagramV2Contract.schema === "promptdeck-data-diagram/2.0", "Data Diagram did not expose DiagramSpec v2", failures);
    record(/^sha256:[0-9a-f]{64}$/.test(diagramV2Contract.hash), "Data Diagram source fingerprint was not a SHA-256 contract", failures);
    record(diagramV2Contract.uniqueIds, "Data Diagram parser produced colliding node IDs", failures);
    record(diagramV2Contract.exportCanvas, "Data Diagram SVG export did not honor the selected 16:9 output size", failures);
    const svgDownloadPromise = page.waitForEvent("download");
    await page.click("#diagramDownloadSvgBtn");
    const svgDownload = await svgDownloadPromise;
    record(svgDownload.suggestedFilename().endsWith(".svg"), "Data Diagram SVG export did not create an SVG download", failures);
    const specDownloadPromise = page.waitForEvent("download");
    await page.click("#diagramDownloadSpecBtn");
    const specDownload = await specDownloadPromise;
    record(specDownload.suggestedFilename().endsWith(".json"), "Data Diagram spec export did not create a JSON download", failures);
    await page.click('[data-diagram-result="expected"]');
    const alternativeVisual = await page.locator("#diagramAlternativeMatches .diagram-alt-card").first().locator("strong").textContent();
    await page.locator("#diagramAlternativeMatches .diagram-alt-card button").first().click();
    record((await page.locator("#diagramBestMatch .diagram-match-copy strong").textContent()).trim() === alternativeVisual.trim(), "Data Diagram alternative match was not applied as the new expected result", failures);
    record(await page.locator("#diagramSendSlideImageBtn").isEnabled(), "Data Diagram did not enable the image-generation bridge for ready data", failures);
    await page.click("#diagramSendSlideImageBtn");
    await page.waitForSelector("#paneSlideImage.active");
    const transferredDiagram = await page.evaluate(() => window.PromptDeckSlideImageGeneration.getActivePayload());
    record(transferredDiagram.contractVersion === "diagram-2.0" && /^sha256:[0-9a-f]{64}$/.test(transferredDiagram.sourceHash || ""), "Data Diagram generation bridge lost the v2 contract or source fingerprint", failures);
    record((await page.locator("#slideImagePrompt").inputValue()).includes("Workflow source fingerprint") && (await page.locator("#slideImageTitle").inputValue()).includes("지역기업 해외진출 지원 퍼널"), "Data Diagram generation bridge did not transfer the prompt and title", failures);
    await page.evaluate(() => window.PromptDeckTabs.switchTab("dataDiagram"));
    await page.waitForSelector("#paneDataDiagram.active");
    record((await page.locator(".diagram-result-stack").evaluate((element) => getComputedStyle(element).position)) === "sticky", "Data Diagram result stack did not remain visible on desktop", failures);
    await page.locator("#diagramDataInput").fill([
      "단계\t수치", "1단계\t10", "2단계\t9", "3단계\t8", "4단계\t7", "5단계\t6", "6단계\t5",
    ].join("\n"));
    await page.waitForTimeout(250);
    record((await page.locator("#diagramReadinessList").textContent()).includes("최대 5개"), "Data Diagram silently truncated source data beyond the selected type capacity", failures);
    record((await page.locator("#diagramCapacityBadge").textContent()).includes("5/5") && (await page.locator("#diagramCapacityBadge").getAttribute("class") || "").includes("is-over"), "Data Diagram did not expose the over-capacity state", failures);
    await page.locator("#diagramDataInput").fill("기획 -> 실행\n실행 -> 검증");
    await page.waitForTimeout(250);
    const normalizedDiagramEdges = await page.evaluate(() => window.PromptDeckDataDiagram.getSpec().data.edges);
    record(normalizedDiagramEdges.length === 2 && normalizedDiagramEdges.every((edge) => edge.id && edge.fromId && edge.toId && edge.fromLabel && edge.toLabel), "DiagramSpec v2 did not normalize relationship IDs and labels", failures);
    await page.click("#diagramSampleBtn");
    await page.waitForTimeout(150);
    await page.setViewportSize({ width: 390, height: 844 });
    record((await page.locator("#paneDataDiagram .diagram-step.is-open").count()) === 1, "Data Diagram mobile workflow did not keep a single step open", failures);
    await page.locator('[data-diagram-step="structure"] .diagram-step-toggle').click();
    record((await page.locator("#paneDataDiagram .diagram-step.is-open").count()) === 1 && (await page.locator('[data-diagram-step="structure"].is-open').count()) === 1, "Data Diagram mobile step navigation did not move to the selected step", failures);
    const diagramWorkflowMobileBox = await page.locator("#paneDataDiagram .diagram-workflow").boundingBox();
    const diagramPreviewMobileBox = await page.locator("#diagramLivePreview").boundingBox();
    record(Boolean(diagramWorkflowMobileBox && diagramWorkflowMobileBox.x >= 0 && diagramWorkflowMobileBox.x + diagramWorkflowMobileBox.width <= 390), "Data Diagram workflow overflowed the mobile viewport", failures);
    record(Boolean(diagramPreviewMobileBox && diagramPreviewMobileBox.x >= 0 && diagramPreviewMobileBox.x + diagramPreviewMobileBox.width <= 390), "Data Diagram expected image overflowed the mobile viewport", failures);
    record(await page.locator("#paneDataDiagram #tabActions").isHidden(), "Data Diagram quick action dock remained visible on mobile", failures);
    await page.setViewportSize({ width: 1440, height: 1200 });

    await page.click("#tabBtnQrGenerator");
    await page.waitForSelector("#paneQrGenerator.active");
    record((await page.locator("#paneQrGenerator .qr-result-stack > #tabActions").count()) === 1, "QR quick actions were not mounted in an independent result column", failures);
    record((await page.locator("#paneQrGenerator .qr-result-stack > .qr-gen-preview-section").count()) === 1, "QR result panel was not kept as a sibling of the quick action dock", failures);
    await page.locator("#qrInputText").fill("https://example.com/current-label-qr");
    await page.waitForFunction(() => window.QRGeneratorCore?.getCurrentValue?.() === "https://example.com/current-label-qr");
    await page.click("#btnQrBatchOpen");
    await page.waitForSelector("#qrBatchModal:not([hidden])");
    record((await page.locator("#qrBatchModal .qr-batch-step").count()) === 3, "QR batch modal did not present the three-step workflow", failures);
    record(await page.locator("#qrBatchProgressWrap").isHidden(), "QR batch modal showed an empty progress bar before generation", failures);
    record((await page.locator("#qrBatchModalTitle").textContent()).trim() === "CSV 일괄 QR 생성", "QR batch modal title did not use the concise workflow label", failures);
    await page.locator("#qrBatchFileInput").setInputFiles({
      name: "qr-batch-smoke.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("data,filename\nhttps://example.com,example-01\nhttps://openai.com,example-02"),
    });
    await page.waitForFunction(() => document.querySelector("#qrBatchUploadCard")?.classList.contains("is-ready"));
    record(!(await page.locator("#qrBatchStartBtn").isDisabled()), "QR batch modal did not enable generation after a valid CSV selection", failures);
    record((await page.locator("#qrBatchFileName").textContent()).includes("데이터 2개"), "QR batch modal did not expose the parsed row count", failures);
    const labelCountBeforeQrBatch = await page.evaluate(() => window.PromptDeckLabelSheet.getProject().records.length);
    await page.click("#qrBatchStartBtn");
    await page.waitForSelector("#qrBatchSendLabelBtn:not([hidden])");
    await page.click("#qrBatchSendLabelBtn");
    await page.waitForSelector("#paneLabelSheet.active");
    await page.waitForFunction((count) => window.PromptDeckLabelSheet.getProject().records.length === count + 2, labelCountBeforeQrBatch);
    const qrBatchBridgeValues = await page.evaluate(() => window.PromptDeckLabelSheet.getProject().records.slice(-2).map((record) => record.front?.qrValue));
    record(qrBatchBridgeValues[0] === "https://example.com" && qrBatchBridgeValues[1] === "https://openai.com", `QR batch-to-label bridge lost row payloads: ${JSON.stringify(qrBatchBridgeValues)}`, failures);
    record(await page.locator("#qrBatchModal").isHidden(), "QR batch modal did not close after sending records to the label studio", failures);
    await page.click("#labelSheetWorkspaceDataModeBtn");
    await page.waitForFunction(() => document.querySelector("#labelSheetRecordTable")?.getClientRects().length > 0);
    await openLabelDetail();
    await page.selectOption("#labelSheetQrAssignScope", "selected");
    await page.locator('#labelSheetRecordTableBody input[data-record-select="true"]').last().evaluate((input) => {
      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.click("#labelSheetQrUseCurrentBtn");
    await page.waitForFunction(() => window.PromptDeckLabelSheet.getProject().records.at(-1)?.front?.qrValue === "https://example.com/current-label-qr");
    const qrCurrentBridgeValues = await page.evaluate(() => window.PromptDeckLabelSheet.getProject().records.slice(-2).map((record) => record.front?.qrValue));
    record(qrCurrentBridgeValues[0] === "https://example.com" && qrCurrentBridgeValues[1] === "https://example.com/current-label-qr", `QR current-value assignment changed the wrong labels: ${JSON.stringify(qrCurrentBridgeValues)}`, failures);
    await closeLabelDetail();

    const typographyTabIds = [
      "tabBtnDesigner", "tabBtnCommonPrompt", "tabBtnGenerator", "tabBtnSlideImage", "tabBtnMapPrompt",
      "tabBtnDataDiagram", "tabBtnSlideDocument", "tabBtnPromotionPlanner", "tabBtnConceptMixer", "tabBtnPhotoTransform", "tabBtnFormImage", "tabBtnLabelSheet", "tabBtnPromotion", "tabBtnQrGenerator",
    ];
    for (const tabId of typographyTabIds) {
      await page.click(`#${tabId}`);
      const controlledPaneId = await page.locator(`#${tabId}`).getAttribute("aria-controls");
      record(Boolean(controlledPaneId) && (await page.locator(`#${controlledPaneId}.active`).count()) === 1, `${tabId} did not activate its controlled pane`, failures);
      record((await page.locator(".tab-pane.active").count()) === 1, `${tabId} left more than one top-level pane active`, failures);
      if (["tabBtnPromotionPlanner", "tabBtnPhotoTransform"].includes(tabId)) {
        record(await page.locator("#tabActions").isHidden(), `${tabId} unexpectedly displayed an empty quick-action dock`, failures);
      } else {
        record(!(await page.locator("#tabActions").isHidden()) && (await page.locator(`#${controlledPaneId} #tabActions`).count()) === 1, `${tabId} quick actions were not mounted inside the active pane`, failures);
        const missingProxyTargets = await page.locator("#tabActions [data-proxy-target]").evaluateAll((buttons) => buttons
          .map((button) => button.dataset.proxyTarget)
          .filter((targetId) => !document.getElementById(targetId)));
        record(missingProxyTargets.length === 0, `${tabId} quick actions referenced missing controls: ${missingProxyTargets.join(", ")}`, failures);
      }
      const undersizedUiText = await page.evaluate(() => {
        const pane = document.querySelector(".tab-pane.active");
        const previewSelector = ".cpd-preview, .qr-print-preview-sheet, .print-label-card, #previewCanvas, .preview-canvas, .slide-preview-canvas, [aria-hidden='true']";
        return Array.from(pane?.querySelectorAll("*") || []).filter((element) => {
          if (element.matches("script, style") || element.closest(previewSelector)) return false;
          const style = getComputedStyle(element);
          if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0 || !element.getClientRects().length) return false;
          const hasText = Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
          if (!hasText && !element.matches("button, input, select, textarea, summary")) return false;
          if (element.closest(".cpd-slide-style-current") || element.closest(".cpd-slide-style-card")) return false;
        return parseFloat(style.fontSize) < 12;
        }).map((element) => ({
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === "string" ? element.className : "",
          fontSize: getComputedStyle(element).fontSize,
          text: (element.textContent || "").trim().slice(0, 40),
        }));
      });
      record(undersizedUiText.length === 0, `${tabId} still rendered UI text below 12px: ${JSON.stringify(undersizedUiText)}`, failures);
    }

    // ----------------------------------------------------
    // Slide Document Consolidated Tab Test
    // ----------------------------------------------------
    await page.click("#tabBtnSlideDocument");
    await page.waitForSelector("#paneSlideDocument.active");
    record((await page.locator("#paneSlideCover.active .slide-doc-preview-section > #tabActions").count()) === 1, "Slide Document quick actions were not mounted in the active cover preview panel", failures);

    // Sub-tab 1: Cover
    await page.evaluate(() => {
      document.querySelectorAll("#paneSlideCover .promo-step-disclosure").forEach((details) => {
        details.open = true;
      });
    });
    await page.waitForTimeout(150);
    // Click sample data button
    await page.click("#slideCoverSampleBtn");
    await page.waitForTimeout(150);
    let coverHeadline = await page.locator("#slideCoverHeadline").inputValue();
    record(coverHeadline.includes("Strategy") || coverHeadline.includes("전략") || coverHeadline.length > 0, "Slide Cover headline was not populated by sample data", failures);
    await page.locator("#slideCoverHeaderText").fill("GHOST-COVER-HEADER");
    await page.locator("#slideCoverFooterText").fill("GHOST-COVER-FOOTER");
    await page.locator("#slideCoverSubjectImageDesc").evaluate((input) => {
      input.value = "GHOST-COVER-SUBJECT";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    // Click reset button
    await page.click("#slideCoverResetBtn");
    await page.waitForTimeout(150);
    let coverHeadlineReset = await page.locator("#slideCoverHeadline").inputValue();
    record(coverHeadlineReset === "", "Slide Cover headline was not reset", failures);
    record((await page.locator("#slideCoverHeaderText").inputValue()) === "" && (await page.locator("#slideCoverFooterText").inputValue()) === "" && (await page.locator("#slideCoverSubjectImageDesc").inputValue()) === "", "Slide Cover reset left optional user inputs behind", failures);
    record(!(await page.locator("#slideCoverPromptPreview").inputValue()).includes("GHOST-COVER"), "Slide Cover reset retained ghost values in the generated prompt", failures);

    // Sub-tab 2: Divider
    await page.click('.slide-sub-tab-btn[data-target="paneSlideDivider"]');
    await page.waitForSelector("#paneSlideDivider.active");
    record((await page.locator("#paneSlideDivider.active .slide-doc-preview-section > #tabActions").count()) === 1, "Slide Document quick actions did not follow the active sub-tab", failures);
    await page.evaluate(() => {
      document.querySelectorAll("#paneSlideDivider .promo-step-disclosure").forEach((details) => {
        details.open = true;
      });
    });
    await page.waitForTimeout(150);
    await page.click("#slideDividerSampleBtn");
    await page.waitForTimeout(150);
    let dividerHeadline = await page.locator("#slideDividerHeadline").inputValue();
    record(dividerHeadline.includes("혁신") || dividerHeadline.includes("기술") || dividerHeadline.length > 0, "Slide Divider headline was not populated by sample data", failures);
    await page.click("#slideDividerResetBtn");
    await page.waitForTimeout(150);
    let dividerHeadlineReset = await page.locator("#slideDividerHeadline").inputValue();
    record(dividerHeadlineReset === "", "Slide Divider headline was not reset", failures);

    // Sub-tab 3: Background
    await page.click('.slide-sub-tab-btn[data-target="paneSlideBackground"]');
    await page.waitForSelector("#paneSlideBackground.active");
    await page.evaluate(() => {
      document.querySelectorAll("#paneSlideBackground .promo-step-disclosure").forEach((details) => {
        details.open = true;
      });
    });
    await page.waitForTimeout(150);
    await page.click("#slideBackgroundSampleBtn");
    await page.waitForTimeout(150);
    let bgBrandTone = await page.locator("#slideBackgroundBrandTone").inputValue();
    let bgHeaderStyle = await page.locator("#slideBackgroundHeaderStyle").inputValue();
    record(bgBrandTone.includes("가독성") || bgBrandTone.length > 0, "Slide Background brand tone was not populated by sample data", failures);
    record(bgHeaderStyle === "thin_line", "Slide Background header style was not populated by sample data", failures);
    await page.click("#slideBackgroundResetBtn");
    await page.waitForTimeout(150);
    let bgBrandToneReset = await page.locator("#slideBackgroundBrandTone").inputValue();
    let bgHeaderStyleReset = await page.locator("#slideBackgroundHeaderStyle").inputValue();
    record(bgBrandToneReset === "", "Slide Background brand tone was not reset", failures);
    record(bgHeaderStyleReset === "none", "Slide Background header style was not reset", failures);

    // Sub-tab 4: Signboard
    await page.click('.slide-sub-tab-btn[data-target="paneSlideSignboard"]');
    await page.waitForSelector("#paneSlideSignboard.active");
    record((await page.locator("#paneSlideSignboard.active .slide-doc-preview-section > #tabActions").count()) === 1, "Slide Document quick actions did not follow the active signboard sub-tab", failures);
    await page.evaluate(() => {
      document.querySelectorAll("#paneSlideSignboard .promo-step-disclosure").forEach((details) => {
        details.open = true;
      });
    });
    await page.waitForTimeout(150);
    await page.click("#slideSignboardSampleBtn");
    await page.waitForTimeout(150);
    const signboardHeadline = await page.locator("#slideSignboardHeadline").inputValue();
    const signboardPromptKo = await page.locator("#slideSignboardPromptPreview").inputValue();
    record(signboardHeadline.length > 0 && signboardPromptKo.includes(signboardHeadline), "Slide Signboard sample data did not reach the generated prompt", failures);
    record(signboardPromptKo.includes("[행사 안내판 디자인 사양]") && signboardPromptKo.includes("대상 슬라이드 유형: 행사 정보 안내판"), "Slide Signboard Korean prompt did not identify the output as an event information signboard", failures);
    record(!signboardPromptKo.includes("PPT 문서 배경 이미지") && !signboardPromptKo.includes("[문서 배경 디자인 사양]") && !signboardPromptKo.includes("본문 내지 배경 템플릿"), "Slide Signboard Korean prompt leaked document-background labels", failures);
    await page.click("#slideSignboardBtnEn");
    const signboardPromptEn = await page.locator("#slideSignboardPromptPreview").inputValue();
    record(signboardPromptEn.includes("[Information Signboard Design Specifications]") && signboardPromptEn.includes("Asset Style Target: Event Information Signboard"), "Slide Signboard English prompt did not identify the output as an information signboard", failures);
    record(!signboardPromptEn.includes("PPT document Background") && !signboardPromptEn.includes("Content Background Template Slide"), "Slide Signboard English prompt leaked document-background labels", failures);
    record(signboardPromptEn.includes("full canvas background of the signboard"), "Slide Signboard English color-system guidance used the wrong asset label", failures);
    await page.click("#slideSignboardResetBtn");
    await page.waitForTimeout(150);
    record((await page.locator("#slideSignboardHeadline").inputValue()) === "", "Slide Signboard headline was not reset", failures);
    record(!(await page.locator("#slideSignboardPromptPreview").inputValue()).includes(signboardHeadline), "Slide Signboard reset retained sample text in the generated prompt", failures);

    // ----------------------------------------------------
    // Dark theme WCAG 2.1 AA regression coverage
    // ----------------------------------------------------
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => localStorage.setItem("promptdeck_theme", "light"));
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector(".tab-pane.active");
    record(await page.evaluate(() => document.documentElement.dataset.theme) === "light", "Theme storage did not restore the light theme", failures);
    record((await page.locator("#themeToggleBtn").getAttribute("aria-pressed")) === "false", "Theme toggle did not expose aria-pressed=false in light mode", failures);

    await page.click("#themeToggleBtn");
    record(await page.evaluate(() => document.documentElement.dataset.theme) === "dark", "Theme toggle did not activate dark mode", failures);
    record((await page.locator("#themeToggleBtn").getAttribute("aria-pressed")) === "true", "Theme toggle did not expose aria-pressed=true in dark mode", failures);
    record((await page.locator("#themeToggleBtn").getAttribute("aria-label")) === "라이트 모드로 전환", "Theme toggle did not announce the next light-mode action", failures);
    record(await page.evaluate(() => localStorage.getItem("promptdeck_theme")) === "dark", "Theme toggle did not persist dark mode", failures);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector(".tab-pane.active");
    record(await page.evaluate(() => document.documentElement.dataset.theme) === "dark", "Persisted dark mode was not restored after reload", failures);
    record((await page.locator("#themeToggleBtn").getAttribute("aria-pressed")) === "true", "Restored dark mode did not synchronize the toggle ARIA state", failures);

    const accessibilityViewports = [
      { width: 1440, height: 1000, label: "desktop" },
      { width: 390, height: 844, label: "mobile" },
    ];
    for (const viewport of accessibilityViewports) {
      await page.setViewportSize(viewport);
      for (const tabId of typographyTabIds) {
        if (viewport.width <= 720) {
          const group = await page.locator(`#${tabId}`).evaluate((element) => element.closest("[data-tab-group]")?.dataset.tabGroup || "deck");
          const groupFilter = page.locator(`[data-tab-group-filter="${group}"]`);
          if (!(await groupFilter.isVisible()) && await page.locator("#labelSheetWorkspaceAppNavBtn").isVisible()) {
            await page.click("#labelSheetWorkspaceAppNavBtn");
          }
          await groupFilter.click();
        }
        await page.click(`#${tabId}`);
        const paneId = await page.locator(`#${tabId}`).getAttribute("aria-controls");
        await page.waitForSelector(`#${paneId}.active`);
        await page.waitForTimeout(80);

        const audit = await auditActivePaneAccessibility(page, { tabId, theme: "dark", viewport: viewport.label });
        const summary = (items) => JSON.stringify(items.slice(0, 6));
        record(audit.textViolations.length === 0, `${tabId} dark ${viewport.label} text contrast failures (${audit.textViolations.length}): ${summary(audit.textViolations)}`, failures);
        record(audit.placeholderViolations.length === 0, `${tabId} dark ${viewport.label} placeholder contrast failures (${audit.placeholderViolations.length}): ${summary(audit.placeholderViolations)}`, failures);
        record(audit.boundaryViolations.length === 0, `${tabId} dark ${viewport.label} control-boundary contrast failures (${audit.boundaryViolations.length}): ${summary(audit.boundaryViolations)}`, failures);
        record(audit.selectedViolations.length === 0, `${tabId} dark ${viewport.label} selected-state contrast failures (${audit.selectedViolations.length}): ${summary(audit.selectedViolations)}`, failures);
        record(audit.overflow <= 1, `${tabId} dark ${viewport.label} overflowed horizontally by ${audit.overflow}px`, failures);
        for (const regression of audit.regressions) {
          record(!regression.missing, `${tabId} dark ${viewport.label} explicit regression target was missing: ${regression.selector}`, failures);
          if (!regression.missing) {
            record(regression.ratio + 0.01 >= regression.required, `${tabId} dark ${viewport.label} regression contrast failed for ${regression.selector}: ${regression.ratio}:1`, failures);
            if (regression.selector === ".form-image-prompt-viewer") {
              record(regression.backgroundLuminance < 0.08, `Form-image prompt viewer did not use a fully dark surface (${regression.backgroundLuminance})`, failures);
            }
          }
        }

        const focusAudit = await auditActivePaneFocus(page);
        record(!focusAudit.missing, `${tabId} dark ${viewport.label} did not expose a focusable control`, failures);
        if (!focusAudit.missing) {
          record(focusAudit.focused && focusAudit.visible, `${tabId} dark ${viewport.label} focus indicator was not keyboard-visible`, failures);
          record(focusAudit.width >= 2 && focusAudit.ratio + 0.01 >= 3 && focusAudit.ringGuardRatio + 0.01 >= 3 && focusAudit.boxShadow !== "none", `${tabId} dark ${viewport.label} focus indicator did not meet the two-tone 3:1 contract: ${JSON.stringify(focusAudit)}`, failures);
        }
        if (viewport.width <= 720) {
          record(await page.locator("#tabActions").isHidden(), `${tabId} dark mobile kept the right-panel action dock visible`, failures);
        }
      }
    }

    const conceptMixerSource = await fs.readFile(path.join(projectRoot, "src", "concept-mixer.js"), "utf8");
    for (const selector of ["mixer-cat-btn.active", "mixer-nav-btn.next", "mixer-action-btn.apply", "mixer-quick-add-btn", "mmpAddCat", "btnMixerResultConfirm"]) {
      const selectorIndex = conceptMixerSource.indexOf(selector);
      const selectorBlock = selectorIndex >= 0 ? conceptMixerSource.slice(selectorIndex, selectorIndex + 520) : "";
      record(selectorIndex >= 0 && selectorBlock.includes("var(--on-accent"), `Concept Mixer accent action did not use --on-accent: ${selector}`, failures);
    }

    // Light mode keeps the same tab activation and overflow behavior after the dark audit.
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.click("#themeToggleBtn");
    record(await page.evaluate(() => document.documentElement.dataset.theme) === "light", "Theme toggle did not return to light mode", failures);
    record((await page.locator("#themeToggleBtn").getAttribute("aria-pressed")) === "false", "Theme toggle did not expose aria-pressed=false after returning to light mode", failures);
    record(await page.evaluate(() => localStorage.getItem("promptdeck_theme")) === "light", "Theme toggle did not persist light mode", failures);
    for (const viewport of accessibilityViewports) {
      await page.setViewportSize(viewport);
      for (const tabId of typographyTabIds) {
        if (viewport.width <= 720) {
          const group = await page.locator(`#${tabId}`).evaluate((element) => element.closest("[data-tab-group]")?.dataset.tabGroup || "deck");
          const groupFilter = page.locator(`[data-tab-group-filter="${group}"]`);
          if (!(await groupFilter.isVisible()) && await page.locator("#labelSheetWorkspaceAppNavBtn").isVisible()) {
            await page.click("#labelSheetWorkspaceAppNavBtn");
          }
          await groupFilter.click();
        }
        await page.click(`#${tabId}`);
        const paneId = await page.locator(`#${tabId}`).getAttribute("aria-controls");
        await page.waitForSelector(`#${paneId}.active`);
        const paneOverflow = await page.locator(`#${paneId}`).evaluate((element) => Math.max(0, element.scrollWidth - element.clientWidth));
        record(paneOverflow <= 1, `${tabId} light ${viewport.label} overflowed horizontally by ${Math.round(paneOverflow)}px`, failures);
        if (viewport.width <= 720) {
          record(await page.locator("#tabActions").isHidden(), `${tabId} light mobile kept the right-panel action dock visible`, failures);
        }
      }
    }

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.click("#themeToggleBtn");
    record(await page.evaluate(() => localStorage.getItem("promptdeck_theme")) === "dark", "Dark theme was not restored after the light-mode regression pass", failures);

    if (consoleErrors.length) {
      failures.push(`Console errors were reported:\n${consoleErrors.join("\n")}`);
    }

    if (failures.length) {
      throw new Error(`Smoke test failed.\n- ${failures.join("\n- ")}`);
    }

    log("Smoke test passed.");
  } finally {
    if (consoleErrors.length) {
      console.error("=== CONSOLE ERRORS DURING RUN ===");
      console.error(consoleErrors.join("\n"));
      console.error("=================================");
    }
    await browser.close();
    await server.close();
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

runSmokeTest().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
