import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';

// Run after build:static. Workers AI responses are fixtures; no AI allocation is spent.
const root = path.resolve('dist-static');
const screenshots = await fs.mkdtemp(path.join(os.tmpdir(), 'promptdeck-workers-ai-'));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const headers = await fs.readFile(path.join(root, '_headers'), 'utf8');
assert.doesNotMatch(headers, /gen\.pollinations\.ai/u);
const server = http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = path.resolve(root, pathname === '/app' ? 'app.html' : `.${pathname}`);
    if (!file.startsWith(root + path.sep)) throw new Error('bad path');
    const body = await fs.readFile(file);
    res.writeHead(200, {
      'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'",
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = process.env.STATIC_BASE_URL || `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const viewport of [{ width: 1440, height: 1050 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.route('**/api/admin-settings', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true }) }));
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    let accepted = true;
    page.on('dialog', dialog => accepted ? dialog.accept() : dialog.dismiss());
    await page.goto(`${origin}/app`);
    await page.waitForFunction(() => window.CONCEPT_MIXER_PRESETS?.getCustomSamplesForMed?.('mix-steel-hot-rolling')?.[0]);
    const openMixer = async () => {
      if (viewport.width < 720 && !await page.locator('#tabBtnConceptMixer').isVisible()) await page.locator('#appToolMenuBtn').click();
      if (!await page.locator('#tabBtnConceptMixer').isVisible()) await page.locator('[data-tab-group-filter="visual"]').click();
      await page.locator('#tabBtnConceptMixer').click();
      await page.locator('#btnSubjectSampleSettings').waitFor({ state: 'visible' });
    };
    await openMixer();
    const image = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 16;
      canvas.getContext('2d').fillRect(0, 0, 24, 16);
      return canvas.toDataURL('image/png').split(',')[1];
    });
    let requests = 0;
    let status = 200;
    let invalidImage = false;
    await page.route('**/api/mixer-reference', async route => {
      requests += 1;
      assert.equal(route.request().method(), 'POST');
      assert.equal(route.request().headers().authorization, undefined);
      const body = route.request().postDataJSON();
      assert.deepEqual(Object.keys(body).sort(), ['privacyConfirmed', 'prompt']);
      assert.equal(body.privacyConfirmed, true);
      assert.equal(typeof body.prompt, 'string');
      if (status !== 200) {
        await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ ok: false, error: '오늘의 무료 이미지 생성 한도를 사용했습니다.' }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: invalidImage ? 'text/html' : 'image/png', body: invalidImage ? '<html>not an image</html>' : Buffer.from(image, 'base64') });
    });
    for (const [kind, label, itemId] of [['Subject', 'subject', 'mix-steel-hot-rolling'], ['Medium', 'medium', 'med-3d']]) {
      await page.locator(`#btn${kind}SampleSettings`).click();
      const button = page.locator(`#btn${kind}SampleGenerate`);
      assert.equal(await button.isVisible(), true);
      assert.match(await button.textContent(), /무료 AI 생성/u);
      assert.equal(await page.locator(`#btn${kind}SamplePaste`).isVisible(), true);
      assert.equal(await page.locator('[data-pollinations-key]').count(), 0);
      await page.locator(`#panel${kind}Settings`).screenshot({ path: path.join(screenshots, `${viewport.width}-${label}.png`) });
      const box = await button.boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= viewport.width + 1, 'generation button must fit viewport');
      await button.click();
      await page.locator('#mixerResultOverlay').getByText('참조 이미지 생성 성공', { exact: true }).waitFor();
      assert.match(await page.evaluate(id => window.CONCEPT_MIXER_PRESETS.getCustomSamplesForMed(id)[0], itemId), /^data:image\/jpeg;base64,/u);
      await page.locator('#btnMixerResultConfirm').click();
      await page.waitForFunction(id => document.getElementById(id)?.getAttribute('aria-expanded') === 'false', `btn${kind}SampleSettings`);
    }
    assert.equal(requests, 2);
    await page.reload();
    await openMixer();
    for (const id of ['mix-steel-hot-rolling', 'med-3d']) assert.match(await page.evaluate(itemId => window.CONCEPT_MIXER_PRESETS.getCustomSamplesForMed(itemId)[0], id), /^data:image\/jpeg;base64,/u);
    await page.locator('#btnSubjectSampleSettings').click();
    const closeError = async text => {
      await page.locator('#mixerResultOverlay').getByText(text, { exact: false }).waitFor();
      await page.locator('#btnMixerResultConfirm').click();
      await page.waitForFunction(() => !document.getElementById('btnSubjectSampleGenerate')?.disabled);
    };
    accepted = false;
    await page.locator('#btnSubjectSampleGenerate').click();
    assert.equal(requests, 2, 'cancellation must not send a generation request');
    accepted = true;
    status = 429;
    await page.locator('#btnSubjectSampleGenerate').click();
    await closeError('오늘의 무료 이미지 생성 한도');
    status = 200;
    invalidImage = true;
    await page.locator('#btnSubjectSampleGenerate').click();
    await closeError('유효한 이미지 파일을 반환하지 않았습니다');
    assert.match(await page.evaluate(() => window.CONCEPT_MIXER_PRESETS.getCustomSamplesForMed('mix-steel-hot-rolling')[0]), /^data:image\/jpeg;base64,/u);
    assert.deepEqual(pageErrors, []);
    console.log(`PASS ${viewport.width}px: generation, persistence, no browser key, cancellation and errors`);
    await context.close();
  }
  console.log(`Screenshots: ${screenshots}`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
