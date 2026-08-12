import assert from "node:assert/strict";

globalThis.window = globalThis;
await import("../src/tabular-data.js");
await import("../src/zip-writer.js");
await import("../src/label-sheet-package.js");

const Package = globalThis.PromptDeckLabelSheetPackage;
const Tabular = globalThis.PromptDeckTabularData;
assert.ok(Package, "PromptDeckLabelSheetPackage global must be available");
assert.ok(Tabular, "PromptDeckTabularData global must be available");
assert.equal(typeof globalThis.createZip, "function", "ZIP writer must be available");

const project = {
  schema: "promptdeck-label-sheet-project/1.0",
  version: 1,
  id: "project-한글",
  name: "행사 출입표",
  spec: { page: { orientation: "portrait" } },
  settings: {
    qr: { enabled: true, source: "record" },
    visualStyleSnapshot: { id: "minimal-report", nameKo: "미니멀 리포트" },
  },
  records: [{
    id: "PASS-001",
    number: "001",
    data: { name: "홍길동", category: "VIP" },
    front: { title: "행사, 출입표", qrValue: "https://example.kr/pass/PASS-001", backgroundFile: "앞면 배경.png" },
    back: { title: "이용 안내", body: "줄 1\n줄 2" },
  }],
};
const sourceBlob = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], { type: "image/png" });
const pagePrompt = {
  schema: "promptdeck-label-page-prompt/1.0",
  printPageNumber: 1,
  sheetNumber: 1,
  side: "front",
  prompt: "[A4 PRINT PAGE 1/1 — SHEET 1 FRONT]\n페이지별 프롬프트",
};
const built = await Package.buildProjectPackage({
  project,
  assets: [{
    assetId: "asset-한글",
    filename: "앞면 배경.png",
    mime: "image/png",
    source: "upload",
    width: 1600,
    height: 900,
    original: { blob: sourceBlob },
  }],
  promptBundle: {
    jsonl: '{"recordId":"PASS-001"}',
    pagePrompts: [pagePrompt],
    pageJsonl: JSON.stringify(pagePrompt),
  },
});

assert.equal(built.manifest.schema, Package.PACKAGE_SCHEMA);
assert.equal(built.manifest.assetCount, 1);
assert.equal(built.manifest.pagePromptCount, 1);
assert.ok(built.files.some((file) => file.name.includes("앞면-배경.png")), "UTF-8 asset filename must be retained in the package");
assert.ok(built.files.some((file) => file.name === "page-prompts.jsonl"), "Page prompt JSONL must be included in the package");
const pagePromptFile = built.files.find((file) => file.name === "prompts/pages/print-page-001-sheet-001-front.txt");
assert.ok(pagePromptFile, "Each print page prompt must be stored as an individual text file");
assert.ok(new TextDecoder().decode(pagePromptFile.data).includes("페이지별 프롬프트"));

const parsed = await Package.parseProjectPackage(built.blob);
assert.equal(parsed.source, "zip");
assert.equal(parsed.project.name, "행사 출입표");
assert.equal(parsed.project.records[0].front.qrValue, "https://example.kr/pass/PASS-001");
assert.equal(parsed.assets.length, 1);
assert.equal(parsed.assets[0].filename, "앞면 배경.png");
assert.equal(parsed.assets[0].blob.type, "image/png");
assert.deepEqual(Array.from(new Uint8Array(await parsed.assets[0].blob.arrayBuffer())), [137, 80, 78, 71, 13, 10, 26, 10]);

const csv = Package.recordsToCsv(project.records);
assert.ok(csv.startsWith("\uFEFFlabel_id,number"));
assert.ok(csv.includes('"행사, 출입표"'));
assert.ok(csv.includes('"줄 1\n줄 2"'));

const jsonBlob = new Blob([JSON.stringify(project)], { type: "application/json" });
Object.defineProperty(jsonBlob, "name", { value: "project.json" });
const parsedJson = await Package.parseProjectPackage(jsonBlob);
assert.equal(parsedJson.source, "json");
assert.equal(parsedJson.project.id, "project-한글");

const sharedCsv = Tabular.parseTable('name,note\n"홍길동","쉼표, 포함"\n김서연,일반', { delimiter: "auto", header: "present" });
assert.equal(sharedCsv.delimiter, ",");
assert.equal(sharedCsv.objects[0].note, "쉼표, 포함");
const sharedTsv = Tabular.parseTable("name\tcategory\n홍길동\tVIP", { delimiter: "auto", header: "present" });
assert.equal(sharedTsv.delimiter, "\t");
assert.deepEqual(sharedTsv.objects[0], { name: "홍길동", category: "VIP" });

console.log("label-sheet package tests passed");
