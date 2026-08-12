import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const context = { console };
context.globalThis = context;
vm.createContext(context);

for (const filename of ["src/label-sheet-engine.js", "src/label-sheet-data-mapping.js"]) {
  const source = fs.readFileSync(new URL(`../${filename}`, import.meta.url), "utf8");
  vm.runInContext(source, context, { filename });
}

const engine = context.PromptDeckLabelSheetEngine;
const mapping = context.PromptDeckLabelSheetDataMapping;
assert.ok(engine && mapping, "label-sheet globals must load");

const headers = ["식별자", "성명", "소속", "식권종류", "링크", "뒷면내용"];
const suggested = mapping.suggest(headers, { duplex: true });
assert.equal(suggested.id, "식별자");
assert.equal(suggested["front.title"], "성명");
assert.equal(suggested["front.subtitle"], "소속");
assert.equal(suggested["front.body"], "식권종류");
assert.equal(suggested["front.qrValue"], "링크");
assert.equal(suggested["back.body"], "뒷면내용");

const raw = {
  식별자: "MEAL-001",
  성명: "김배터리",
  소속: "샘플교육센터",
  식권종류: "교육생 중식",
  링크: "https://example.kr/meal/MEAL-001",
  뒷면내용: "당일 1회 사용",
  알레르기: "견과류",
};
const materialized = mapping.applyRecord(raw, suggested, 0);
const record = engine.normalizeRecord(materialized, 0);
assert.equal(record.id, "MEAL-001");
assert.equal(record.front.title, "김배터리");
assert.equal(record.front.subtitle, "샘플교육센터");
assert.equal(record.front.body, "교육생 중식");
assert.equal(record.front.qrValue, "https://example.kr/meal/MEAL-001");
assert.equal(record.back.body, "당일 1회 사용");
assert.equal(record.data.알레르기, "견과류", "unmapped source columns must be preserved");

const manual = mapping.suggest(headers, { current: { "front.title": "소속" }, duplex: false });
assert.equal(manual["front.title"], "소속", "valid manual mappings must survive suggestion refresh");
assert.equal(manual["front.body"], "식권종류", "remaining unclaimed columns must still be auto-matched");

const fallback = mapping.applyRecord({ 성명: "ID 없는 데이터" }, { "front.title": "성명" }, 4);
assert.equal(fallback.label_id, "label-5");

console.log("label-sheet data mapping tests: 15 assertions passed");
