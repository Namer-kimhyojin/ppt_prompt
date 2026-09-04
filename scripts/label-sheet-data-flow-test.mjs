// End-to-end data contract: real input events through resolved ticket/QR output.
import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
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
const browser = await chromium.launch({ channel: "msedge", headless: true });
const base = `http://127.0.0.1:${server.address().port}`;
const values = ["T1", "0007", "홍길동", "연구팀", "앞 제목", "앞 부제", "본문, 쉼표\n두 줄", "앞 하단", "뒤 제목", "뒤 부제", "뒤 본문", "뒤 하단", "https://example.kr/front/T1", "https://example.kr/back/T1", "front.png", "back.png", false];
const encode = (v, delimiter) => {
  const s = String(v);
  return s.includes(delimiter) || /["\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.PromptDeckLabelSheet && document.querySelector("#paneLabelSheet")?.dataset.labelWorkspaceLayoutReady === "true");
    await page.locator("#tabBtnLabelSheet").evaluate((el) => el.click());
    const fields = await page.evaluate(() => window.PromptDeckLabelSheetEngine.RECORD_FIELDS);
    const reset = () => page.evaluate(async () => {
      const e = window.PromptDeckLabelSheetEngine;
      await window.PromptDeckLabelSheet.replaceProject(e.createDefaultProject({ records: [e.normalizeRecord({ id: "blank" })], settings: { frontTitle: "{{제목}} · {{ID}}", frontBody: "{{이름}} · {{구분}}\n{{본문}}", backTitle: "{{제목}}", qr: { enabled: true, source: "record", side: "both" } } }));
    });
    const projection = () => page.evaluate(() => {
      const r = window.PromptDeckLabelSheet.getProjectSnapshot().records[0];
      return window.PromptDeckLabelSheetEngine.RECORD_FIELDS.map((f) => window.PromptDeckLabelSheetEngine.fieldValue(r, f));
    });
    const commit = () => page.locator("#labelSheetImportCommitBtn").evaluate((el) => el.click());
    const table = (headers, delimiter) => [headers, values].map((row) => row.map((v) => encode(v, delimiter)).join(delimiter)).join("\r\n");
    const pasteArea = async (text) => {
      await page.locator("#labelSheetPasteInput").evaluate((el, v) => { el.value = v; }, text);
      await page.locator("#labelSheetPasteApplyBtn").evaluate((el) => el.click());
    };
    const csv = (text) => page.locator("#labelSheetCsvInput").setInputFiles({ name: "contract.csv", mimeType: "text/csv", buffer: Buffer.from(text) });

    for (const route of ["manual", "grid", "paste", "csv-ko", "csv-en", "no-header"]) {
      await reset();
      if (route === "manual") {
        for (let i = 0; i < fields.length; i++) {
          await page.evaluate(({ field, v }) => {
            const el = document.querySelector(`#labelSheetRecordTableBody [data-record-field="${field}"]`);
            if (el.type === "checkbox") el.checked = v; else el.value = v;
            el.dispatchEvent(new Event("change", { bubbles: true }));
          }, { field: fields[i].key, v: values[i] });
        }
      } else if (route === "grid") {
        await page.locator('#labelSheetRecordTableBody [data-record-field="id"]').first().evaluate((el, text) => {
          el.focus();
          const clipboardData = new DataTransfer(); clipboardData.setData("text/plain", text);
          el.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData }));
        }, table(fields.map((f) => f.label), "\t"));
      } else {
        if (route === "paste") await pasteArea(table(fields.map((f) => f.label), "\t"));
        else if (route === "no-header") await pasteArea(values.map((v) => encode(v, "\t")).join("\t"));
        else await csv(table(fields.map((f) => route === "csv-ko" ? f.label : f.target), ","));
        await commit();
      }
      assert.deepEqual(await projection(), values, `${width}px ${route} must use the same 17 fields`);
      const output = await page.evaluate(() => {
        const api = window.PromptDeckLabelSheet;
        return { front: api.resolveOutputTemplate("T1", "front", "{{제목}} · {{ID}} / {{이름}}"), back: api.resolveOutputTemplate("T1", "back", "{{제목}}"), qr: api.resolveQrTemplate("T1", "front", "{{ID}}/{number}/{{이름|url}}/{{front_qr_value}}"), effective: api.getProject().records[0] };
      });
      assert.equal(output.front.value, "앞 제목 · T1 / 홍길동");
      assert.equal(output.back.value, "뒤 제목");
      assert.equal(output.qr.value, `T1/0007/${encodeURIComponent("홍길동")}/https://example.kr/front/T1`);
      assert.equal(output.effective.front.title, "앞 제목 · T1");
      assert.equal(output.effective.front.body, "홍길동 · 연구팀\n본문, 쉼표\n두 줄");
    }
    await reset();
    await csv("ID,앞면 제목,뒷면 제목\nT1,원본,뒤 제목");
    await page.locator("#labelSheetMapFrontTitle").evaluate((el) => { el.value = ""; el.dispatchEvent(new Event("change", { bubbles: true })); });
    await commit();
    assert.equal((await projection())[4], "", "unmapping must clear original canonical fields");

    await reset();
    await csv("ID,앞면 제목,뒷면 제목,Allergy\nT1,원본,뒤 제목,견과류");
    await page.locator('#labelSheetRecordTableBody [data-record-field="front.title"]').first().evaluate((el) => { el.value = "직접 수정"; el.dispatchEvent(new Event("change", { bubbles: true })); });
    await page.locator("#labelSheetMapBackTitle").evaluate((el) => { el.dispatchEvent(new Event("change", { bubbles: true })); });
    await commit();
    assert.equal((await projection())[4], "직접 수정", "mapping refresh must preserve edited draft cells");
    await page.locator("#labelSheetPasteMode").evaluate((el) => { el.value = "update"; });
    await pasteArea("ID\t앞면 부제\nT1\t부제 수정");
    await commit();
    assert.equal((await projection())[4], "직접 수정", "ID update must preserve fields absent from input");
    assert.equal((await projection())[5], "부제 수정");
    assert.equal(await page.evaluate(() => window.PromptDeckLabelSheet.resolveOutputTemplate("T1", "front", "{{data.Allergy}}").value), "견과류");
    const extra = await page.evaluate(async () => {
      const api = window.PromptDeckLabelSheet;
      await api.loadPayload({ importMode: "append", records: [{ id: "BRIDGE1", front: { title: "QR 전달", qrValue: "https://example.kr/bridge" } }] });
      const bridge = api.getProjectSnapshot().records.find((r) => r.id === "BRIDGE1");
      await api.refresh();
      await api.generatePrompts();
      return { qr: bridge.front.qrValue, bundle: JSON.stringify(api.getPromptBundle()) };
    });
    assert.equal(extra.qr, "https://example.kr/bridge", "nested QR-generator records survive the shared mapper");
    assert.ok(extra.bundle.includes("직접 수정"), "print prompt output contains the edited source text");
    const downloadPromise = page.waitForEvent("download");
    await page.locator("#labelSheetCsvSampleBtn").evaluate((el) => el.click());
    const download = await downloadPromise;
    const downloaded = await readFile(await download.path(), "utf8");
    assert.equal(downloaded.replace(/^\uFEFF/, "").split("\r\n")[0], fields.map((f) => f.target).join(","), "sample CSV uses exactly the table schema and order");
    await reset();
    await page.evaluate(() => {
      const el = document.querySelector('#labelSheetRecordTableBody [data-record-field="id"]');
      el.focus();
      const clipboardData = new DataTransfer();
      clipboardData.setData("text/plain", "ID\tAllergy\tBatch.Code\nT1\t견과류\tB-007");
      el.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData }));
    });
    assert.equal(await page.evaluate(() => window.PromptDeckLabelSheet.resolveOutputTemplate("T1", "front", "{{data.Allergy}} / {{data.Batch.Code}}").value), "견과류 / B-007", "grid clipboard preserves custom columns including dotted names");
    await page.locator("#labelSheetPasteMode").evaluate((el) => { el.value = "replace"; });
    await csv("ID,앞면 제목,제외\nT1,출력하지 않음,예\nT2,출력 대상,아니오");
    await commit();
    const selection = await page.evaluate(() => ({ source: window.PromptDeckLabelSheet.getProjectSnapshot().records.map((r) => r.data.excluded), output: window.PromptDeckLabelSheet.getProject().records.map((r) => r.id) }));
    assert.deepEqual(selection.source, [true, false]);
    assert.deepEqual(selection.output, ["T2"], "excluded records must not reach ticket output");
    assert.deepEqual(errors, [], `${width}px must not raise page errors`);
    console.log(`label data flow ${width}px: six input routes, ticket/QR/prompts, unmapping, draft edit, ID update, QR bridge and sample CSV passed`);
    await page.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
