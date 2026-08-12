import fs from 'node:fs/promises';
import http from 'node:http';
import { existsSync, createReadStream } from 'node:fs';
import path from 'path';
import { chromium } from 'playwright';

const projectRoot = 'd:/개발관련/ppt_prompt';

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

async function startStaticServer(rootDir) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const filePath = path.join(rootDir, pathname);

    if (!existsSync(filePath)) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }

    res.setHeader('Content-Type', MIME_TYPES[path.extname(filePath)] || 'application/octet-stream');
    createReadStream(filePath).pipe(res);
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}

async function run() {
  const server = await startStaticServer(projectRoot);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.on('console', (msg) => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', (err) => console.error(`[BROWSER ERROR] ${err.message}`));

    await page.goto(`${server.baseUrl}/index.html`, { waitUntil: 'domcontentloaded' });
    
    // Go to Promotion tab
    await page.click('#tabBtnPromotion');
    await page.waitForSelector('#panePromotion.active');
    
    console.log('--- Initial State ---');
    const initialState = await page.evaluate(() => {
      const pane = document.getElementById('panePromotion');
      const visualStep = document.getElementById('promotionStepVisual');
      const detailBtn = document.querySelector("[data-promo-visual-planning-mode='detail']");
      return {
        paneClasses: pane ? pane.className : null,
        visualStepHiddenAttr: visualStep ? visualStep.hidden : null,
        visualStepDisplay: visualStep ? window.getComputedStyle(visualStep).display : null,
        detailBtnExists: !!detailBtn,
        detailBtnClasses: detailBtn ? detailBtn.className : null,
      };
    });
    console.log(initialState);

    console.log('--- Clicking Detail Button ---');
    await page.locator("[data-promo-visual-planning-mode='detail']").click();
    await page.waitForTimeout(500);

    const afterClickState = await page.evaluate(() => {
      const pane = document.getElementById('panePromotion');
      const visualStep = document.getElementById('promotionStepVisual');
      return {
        paneClasses: pane ? pane.className : null,
        visualStepHiddenAttr: visualStep ? visualStep.hidden : null,
        visualStepDisplay: visualStep ? window.getComputedStyle(visualStep).display : null,
        visualStepOpen: visualStep ? visualStep.open : null,
      };
    });
    console.log(afterClickState);

    // Let's also check step 2 details open
    console.log('--- Setting all step disclosures open ---');
    await page.evaluate(() => {
      document.querySelectorAll(".promo-step-disclosure").forEach((details) => {
        details.open = true;
      });
    });
    await page.waitForTimeout(200);

    const afterOpenState = await page.evaluate(() => {
      const visualStep = document.getElementById('promotionStepVisual');
      const button = document.querySelector("[data-toggle-mode='tone'][data-mode='manual']");
      return {
        visualStepHiddenAttr: visualStep ? visualStep.hidden : null,
        visualStepDisplay: visualStep ? window.getComputedStyle(visualStep).display : null,
        visualStepOpen: visualStep ? visualStep.open : null,
        buttonExists: !!button,
        buttonVisible: button ? button.offsetWidth > 0 && button.offsetHeight > 0 : false,
        buttonDisplay: button ? window.getComputedStyle(button).display : null,
      };
    });
    console.log(afterOpenState);

  } finally {
    await browser.close();
    await server.close();
  }
}

run().catch(console.error);
