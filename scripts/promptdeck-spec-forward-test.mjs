import fs from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const projectRoot = process.cwd();
const specificationPath = path.resolve(projectRoot, process.argv[2] || "");
const outputRoot = path.resolve(projectRoot, process.argv[3] || "artifacts/promptdeck-spec-forward-test");
const contextPath = process.argv[4] ? path.resolve(projectRoot, process.argv[4]) : "";

if (!process.argv[2] || !existsSync(specificationPath)) {
  throw new Error("Usage: node scripts/promptdeck-spec-forward-test.mjs <spec.md> [output-dir] [context.json]");
}

const defaultContext = {
  "project.audience": "발표자료 검토자",
  "project.presentationPurpose": "복잡한 정보를 정확하고 빠르게 설명",
  "project.desiredAction": "핵심 관계와 우선순위를 판단",
  "project.currentPerception": "정보 관계를 한눈에 파악하기 어려움",
  "project.targetPerception": "핵심 구조와 데이터 지위를 구분해 이해",
  "project.keyBarrier": "복잡한 관계가 장식적 연결이나 인과로 오해될 위험",
  "project.governingThought": "관계 의미와 데이터 지위를 먼저 고정해 판단 가능한 슬라이드로 전환",
};

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function startStaticServer(rootDir) {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const filePath = path.join(rootDir, pathname);
    if (!existsSync(filePath)) {
      response.statusCode = 404;
      response.end("Not found");
      return;
    }
    response.setHeader("Content-Type", MIME_TYPES[path.extname(filePath)] || "application/octet-stream");
    createReadStream(filePath).pipe(response);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((done, reject) => server.close((error) => (error ? reject(error) : done()))),
      });
    });
  });
}

async function launchBrowser() {
  try {
    return { browser: await chromium.launch({ channel: "msedge", headless: true }), channel: "msedge" };
  } catch (_) {
    return { browser: await chromium.launch({ headless: true }), channel: "chromium" };
  }
}

const specification = await fs.readFile(specificationPath, "utf8");
const context = contextPath
  ? { ...defaultContext, ...JSON.parse(await fs.readFile(contextPath, "utf8")) }
  : defaultContext;
const server = await startStaticServer(projectRoot);
const { browser, channel } = await launchBrowser();

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await page.goto(server.baseUrl, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.PromptDeckCommonPrompt && window.PromptDeckSlidePromptGenerator);
  await page.click('[data-journey-profile="inform"]');
  await page.evaluate((values) => {
    Object.entries(values).forEach(([fieldPath, value]) => {
      const input = document.querySelector(`[data-path="${fieldPath}"]`);
      if (!input) throw new Error(`Missing common-prompt field: ${fieldPath}`);
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }, context);
  await page.evaluate(() => window.PromptDeckCommonPrompt.sendToGenerator());
  await page.click("#tabBtnGenerator");
  await page.waitForSelector("#paneGenerator.active");
  await page.waitForFunction(() => window.PromptDeckSlidePromptGenerator.getCommonPromptPackage().source === "common-prompt-builder");
  await page.locator("#genMdInput").fill(specification);
  await page.click("#genGenerateBtn");
  await page.waitForFunction(() => window.PromptDeckSlidePromptGenerator.getRecords().length > 0);

  const result = await page.evaluate(() => ({
    commonPrompt: window.PromptDeckSlidePromptGenerator.getCommonPromptPackage(),
    records: window.PromptDeckSlidePromptGenerator.getRecords(),
  }));

  await fs.mkdir(path.join(outputRoot, "final-prompts"), { recursive: true });
  await fs.writeFile(path.join(outputRoot, "common-design-prompt.md"), result.commonPrompt.text, "utf8");
  await fs.writeFile(path.join(outputRoot, "prompt-package.json"), JSON.stringify(result, null, 2), "utf8");
  for (const record of result.records) {
    const filename = `${record.slideNo}-${record.pageType}.md`;
    await fs.writeFile(path.join(outputRoot, "final-prompts", filename), record.prompt, "utf8");
  }

  const summary = {
    browser: channel,
    specificationPath,
    commonPromptSource: result.commonPrompt.source,
    contractVersion: result.commonPrompt.contractVersion,
    designPackageSchema: result.commonPrompt.designPackage?.schemaVersion,
    commonPromptLength: result.commonPrompt.text.length,
    records: result.records.map((record) => ({
      slideNo: record.slideNo,
      title: record.title,
      pageType: record.pageType,
      generationPath: record.generationPath,
      generationReason: record.generationPlan?.reasonKo,
      diagramPlan: record.diagramPlan,
      commonPromptApplied: record.commonPromptApplied,
      headerFooterApplied: record.headerFooterApplied,
      promptLength: record.prompt.length,
    })),
  };
  await fs.writeFile(path.join(outputRoot, "integration-summary.json"), JSON.stringify(summary, null, 2), "utf8");
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
  await server.close();
}
