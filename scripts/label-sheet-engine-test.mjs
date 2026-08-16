import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const root = process.cwd();
const context = vm.createContext({
  window: {},
  console,
  Blob,
  Date,
  Math,
  JSON,
  Map,
  Set,
  RangeError,
});

for (const relativePath of ["src/label-sheet-presets.js", "src/label-sheet-engine.js"]) {
  const source = await readFile(`${root}/${relativePath}`, "utf8");
  assert.equal(source.charCodeAt(0) === 0xfeff, false, `${relativePath} must be UTF-8 without BOM`);
  vm.runInContext(source, context, { filename: relativePath });
}

const presets = context.window.PromptDeckLabelSheetPresets;
const engine = context.window.PromptDeckLabelSheetEngine;
const passed = [];

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function test(name, callback) {
  callback();
  passed.push(name);
}

test("preset registry exposes generic and verified Formtec geometry", () => {
  assert.equal(presets.A4.portrait.widthMm, 210);
  assert.equal(presets.A4.landscape.heightMm, 210);
  const generic = presets.get("generic-a4-3x8-portrait");
  assert.equal(generic.grid.columns, 3);
  assert.equal(generic.grid.rows, 8);
  assert.equal(generic.source.type, "computed-generic");

  const expected = {
    "formtec-ls-3106": [3, 8, 12.5, 6.5, 64, 33.9, 66.5, 33.9],
    "formtec-ls-3107": [2, 8, 14.2, 4.7, 99.1, 33.9, 101.6, 33.9],
    "formtec-ls-3108": [2, 7, 13.8, 5, 99.1, 38.1, 101.6, 38.1],
    "formtec-ls-3109": [2, 9, 13.5, 3.7, 100, 29.9, 102.5, 29.9],
  };
  Object.entries(expected).forEach(([id, values]) => {
    const preset = presets.get(id);
    assert.ok(preset, `${id} must exist`);
    assert.deepEqual(
      [preset.grid.columns, preset.grid.rows, preset.grid.offsetTopMm, preset.grid.offsetLeftMm, preset.grid.labelWidthMm, preset.grid.labelHeightMm, preset.grid.pitchXmm, preset.grid.pitchYmm],
      values,
    );
    assert.equal(preset.duplexSuitable, false);
    assert.equal(preset.source.type, "official-manufacturer");
    assert.match(preset.source.url, /^https:\/\/www\.formtec\.co\.kr\//);
  });
});

test("portrait and landscape A4 geometry normalize and validate", () => {
  const portrait = engine.createDefaultSpec();
  const portraitResult = engine.validateGeometry(portrait);
  assert.equal(portraitResult.valid, true);
  assert.equal(portrait.page.widthMm, 210);
  assert.equal(portrait.page.heightMm, 297);
  assert.equal(portraitResult.metrics.capacity, 24);
  assert.ok(Math.abs(engine.mmToPx(25.4, 300) - 300) < 1e-9);

  const landscape = engine.createDefaultSpec({
    page: { orientation: "landscape" },
    grid: {
      rows: 2,
      columns: 3,
      labelWidthMm: 90,
      labelHeightMm: 90,
      offsetTopMm: 5,
      offsetLeftMm: 5,
      pitchXmm: 95,
      pitchYmm: 95,
    },
  });
  const landscapeResult = engine.validateGeometry(landscape);
  assert.equal(landscapeResult.valid, true);
  assert.equal(landscape.page.widthMm, 297);
  assert.equal(landscape.page.heightMm, 210);

  const invalid = engine.validateGeometry({
    page: { size: "A4", orientation: "portrait" },
    grid: { rows: 2, columns: 2, labelWidthMm: 120, labelHeightMm: 150, offsetLeftMm: 5, offsetTopMm: 5, pitchXmm: 120, pitchYmm: 150 },
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.some((entry) => entry.code === "GRID_EXCEEDS_PAGE_WIDTH"));
  assert.ok(invalid.errors.some((entry) => entry.code === "GRID_EXCEEDS_PAGE_HEIGHT"));
});

test("sequence formatting supports prefix suffix padding and descending ranges", () => {
  assert.equal(engine.formatSequence(7, { prefix: "DEMO-", suffix: "-A", padding: 3 }), "DEMO-007-A");
  assert.equal(engine.formatSequence(-4, { padding: 3 }), "-004");
  const records = engine.createSequenceRecords({ start: 3, end: 1, prefix: "T-", padding: 2 });
  assert.deepEqual(plain(records.map((record) => record.number)), ["T-03", "T-02", "T-01"]);
  assert.deepEqual(plain(records.map((record) => record.id)), ["label-3", "label-2", "label-1"]);

  const unnumbered = engine.createSequenceRecords({ start: 1, end: 3, includeNumber: false });
  assert.deepEqual(plain(unnumbered.map((record) => record.number)), ["", "", ""]);
  assert.deepEqual(plain(unnumbered.map((record) => record.id)), ["label-1", "label-2", "label-3"]);
});

test("quoted CSV preserves commas quotes and embedded newlines", () => {
  const csv = 'label_id,title,front_background_prompt,back_body\r\nA1,"홍길동, VIP","blue ""ocean""\nline","뒤,면"';
  const result = engine.parseTable(csv);
  assert.equal(result.delimiter, ",");
  assert.equal(result.hasHeader, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.objects.length, 1);
  assert.equal(result.objects[0].title, "홍길동, VIP");
  assert.equal(result.objects[0].front_background_prompt, 'blue "ocean"\nline');
  assert.equal(result.objects[0].back_body, "뒤,면");
});

test("TSV paste and one-value-per-line paste are detected", () => {
  const tsv = engine.parseTable("라벨 ID\t이름\t번호\nA\t가나다\t001\nB\t라마바\t002");
  assert.equal(tsv.delimiter, "\t");
  assert.equal(tsv.hasHeader, true);
  assert.deepEqual(plain(tsv.headers), ["label_id", "name", "number"]);
  assert.equal(tsv.objects[1].name, "라마바");

  const lines = engine.parseTable("첫 번째\n두 번째\n세 번째");
  assert.equal(lines.delimiter, "newline");
  assert.equal(lines.hasHeader, false);
  assert.deepEqual(plain(lines.objects.map((row) => row.title)), ["첫 번째", "두 번째", "세 번째"]);
});

test("replace append and update-by-id imports have distinct semantics", () => {
  const existing = [
    { label_id: "A", title: "기존 A", number: "1" },
    { label_id: "B", title: "기존 B", number: "2" },
  ];
  const replacement = engine.importRecords(existing, [{ label_id: "C", title: "교체" }], { mode: "replace" });
  assert.deepEqual(plain(replacement.records.map((record) => record.id)), ["C"]);
  assert.equal(replacement.added, 1);

  const appended = engine.importRecords(existing, [{ label_id: "C", title: "추가" }], { mode: "append" });
  assert.deepEqual(plain(appended.records.map((record) => record.id)), ["A", "B", "C"]);
  assert.equal(appended.added, 1);

  const updated = engine.importRecords(existing, [
    { label_id: "A", title: "수정 A" },
    { label_id: "C", title: "없는 ID" },
    { title: "ID 없음" },
  ], { mode: "update-by-id" });
  assert.equal(updated.records[0].front.title, "수정 A");
  assert.equal(updated.records[1].front.title, "기존 B");
  assert.equal(updated.updated, 1);
  assert.equal(updated.skipped, 2);
  assert.ok(updated.warnings.some((entry) => entry.code === "UPDATE_ID_NOT_FOUND"));
  assert.ok(updated.errors.some((entry) => entry.code === "UPDATE_ID_REQUIRED"));
});

test("front and back fields normalize into one LabelRecord", () => {
  const record = engine.normalizeRecord({
    label_id: "meal-1",
    number: "M-001",
    title: "식권",
    front_background_file: "front.webp",
    back_body: "당일만 유효",
    back_background_file: "back.jpg",
  });
  assert.equal(record.id, "meal-1");
  assert.equal(record.front.title, "식권");
  assert.equal(record.front.backgroundFile, "front.webp");
  assert.equal(record.back.enabled, true);
  assert.equal(record.back.body, "당일만 유효");
  assert.equal(record.back.backgroundFile, "back.jpg");

  const frontOnly = engine.normalizeRecord({ label_id: "one", number: "1", title: "앞면만" });
  assert.equal(frontOnly.back.enabled, false);
  assert.equal(frontOnly.front.backgroundCrop, null);
});

test("optional background crops normalize and survive project serialization", () => {
  const record = engine.normalizeRecord({
    label_id: "crop-1",
    title: "크롭",
    front_background_crop: { x: -0.25, y: 0.8, width: 2, height: 0.7 },
    back: {
      enabled: true,
      title: "뒷면",
      backgroundCrop: { left: 0.2, top: 0.1, width: 0.5, height: 0.6 },
    },
  });
  assert.deepEqual(plain(record.front.backgroundCrop), { x: 0, y: 0.8, width: 1, height: 0.19999999999999996 });
  assert.deepEqual(plain(record.back.backgroundCrop), { x: 0.2, y: 0.1, width: 0.5, height: 0.6 });

  const restored = engine.deserializeProject(engine.serializeProject(engine.createDefaultProject({ records: [record] }), 0));
  assert.deepEqual(plain(restored.records[0].front.backgroundCrop), plain(record.front.backgroundCrop));
  assert.deepEqual(plain(restored.records[0].back.backgroundCrop), plain(record.back.backgroundCrop));
  assert.equal(engine.normalizeRecord({ label_id: "crop-none" }).front.backgroundCrop, null);
});

test("first-sheet slot and row/column fill pagination stay deterministic", () => {
  const records = engine.createSequenceRecords({ start: 1, end: 4 });
  const spec = engine.createDefaultSpec({
    grid: { rows: 2, columns: 2, labelWidthMm: 90, labelHeightMm: 130, offsetLeftMm: 5, offsetTopMm: 5, pitchXmm: 100, pitchYmm: 140 },
    firstSheetStartSlot: 2,
  });
  const pages = engine.paginateRecords(records, spec);
  assert.equal(pages.capacity, 4);
  assert.equal(pages.totalSheets, 2);
  assert.equal(pages.pages[0].slots[0], null);
  assert.equal(pages.pages[0].slots[1], null);
  assert.equal(pages.pages[0].slots[2].record.number, "1");
  assert.equal(pages.pages[0].slots[3].record.number, "2");
  assert.equal(pages.pages[1].slots[0].record.number, "3");
  assert.equal(pages.pages[1].slots[1].record.number, "4");
  assert.deepEqual(plain(pages.pages[0].slots[2].rectMm), { xMm: 5, yMm: 145, widthMm: 90, heightMm: 130 });

  const columnMajor = engine.paginateRecords(records.slice(0, 3), engine.createDefaultSpec({
    grid: { rows: 2, columns: 2, labelWidthMm: 90, labelHeightMm: 130, offsetLeftMm: 5, offsetTopMm: 5, pitchXmm: 100, pitchYmm: 140 },
    fillOrder: "column-major",
    firstSheetStartSlot: 0,
  }));
  assert.equal(columnMajor.pages[0].slots[0].record.number, "1");
  assert.equal(columnMajor.pages[0].slots[2].record.number, "2");
  assert.equal(columnMajor.pages[0].slots[1].record.number, "3");
});

test("first-sheet arbitrary skipped slots combine with start slot and reset on later sheets", () => {
  const records = engine.createSequenceRecords({ start: 1, end: 5 });
  const spec = engine.createDefaultSpec({
    grid: {
      rows: 2,
      columns: 3,
      labelWidthMm: 60,
      labelHeightMm: 130,
      offsetLeftMm: 5,
      offsetTopMm: 5,
      pitchXmm: 65,
      pitchYmm: 135,
    },
    firstSheetStartSlot: 1,
    firstSheetSkippedSlots: [2, 4],
  });
  const pagination = engine.paginateRecords(records, spec);
  assert.deepEqual(plain(pagination.firstSheetSkippedSlots), [2, 4]);
  assert.deepEqual(plain(pagination.pages[0].skippedSlotIndices), [2, 4]);
  assert.equal(pagination.totalSheets, 2);
  assert.equal(pagination.pages[0].slots[0], null);
  assert.equal(pagination.pages[0].slots[1].record.number, "1");
  assert.equal(pagination.pages[0].slots[2], null);
  assert.equal(pagination.pages[0].slots[3].record.number, "2");
  assert.equal(pagination.pages[0].slots[4], null);
  assert.equal(pagination.pages[0].slots[5].record.number, "3");
  assert.equal(pagination.pages[1].slots[0].record.number, "4");
  assert.equal(pagination.pages[1].slots[1].record.number, "5");
  assert.deepEqual(
    plain(engine.paginateRecords(records, spec).pages.map((page) => page.slots.map((slot) => slot?.recordId || null))),
    plain(pagination.pages.map((page) => page.slots.map((slot) => slot?.recordId || null))),
  );

  const serializedSpec = engine.deserializeProject(engine.serializeProject(engine.createDefaultProject({ spec }), 0)).spec;
  assert.deepEqual(plain(serializedSpec.firstSheetSkippedSlots), [2, 4]);
  const invalid = engine.validateGeometry({
    ...spec,
    firstSheetSkippedSlots: [-1, 1.5, 6],
  });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.filter((entry) => entry.code === "INVALID_FIRST_SHEET_SKIPPED_SLOT").length, 3);
});

test("2x2 duplex transforms and print-page pairing preserve record identity", () => {
  const records = [1, 2, 3, 4].map((number) => engine.normalizeRecord({
    label_id: `R${number}`,
    number,
    title: `앞${number}`,
    back_title: `뒤${number}`,
  }, number - 1));
  const spec = engine.createDefaultSpec({
    grid: { rows: 2, columns: 2, labelWidthMm: 90, labelHeightMm: 130, offsetLeftMm: 5, offsetTopMm: 5, pitchXmm: 100, pitchYmm: 140 },
    duplex: { enabled: true, flipEdge: "long", backTransform: "auto" },
  });
  assert.equal(engine.transformBackSlot(0, spec, "none").slotIndex, 0);
  assert.equal(engine.transformBackSlot(0, spec, "mirrorX").slotIndex, 1);
  assert.equal(engine.transformBackSlot(0, spec, "mirrorY").slotIndex, 2);
  assert.equal(engine.transformBackSlot(0, spec, "rotate180").slotIndex, 3);
  assert.equal(engine.recommendBackTransform("portrait", "long"), "mirrorX");
  assert.equal(engine.recommendBackTransform("portrait", "short"), "mirrorY");
  assert.equal(engine.recommendBackTransform("landscape", "long"), "mirrorY");
  assert.equal(engine.recommendBackTransform("landscape", "short"), "mirrorX");

  const pagination = engine.paginateRecords(records, spec);
  const paired = engine.pairPrintPages(pagination, spec);
  assert.equal(paired.printPageCount, 2);
  assert.equal(paired.pages[0].side, "front");
  assert.equal(paired.pages[1].side, "back");
  assert.equal(paired.pages[1].transform, "mirrorX");
  assert.equal(paired.pages[1].slots[1].recordId, "R1");
  assert.equal(paired.pages[1].slots[1].frontSlotIndex, 0);
  assert.deepEqual(plain(paired.pages[1].slots[1].rectMm), { xMm: 105, yMm: 5, widthMm: 90, heightMm: 130 });
});

test("prompt bundle separates background and exact overlays without changing literals", () => {
  const literalPrompt = '청색 "바다"\n둘째 줄: {원문 그대로}';
  const literalTitle = '제목 "A"\n둘째 줄';
  const project = engine.createDefaultProject({
    records: [{
      label_id: "literal-1",
      number: "001",
      title: literalTitle,
      front_background_prompt: literalPrompt,
    }],
  });
  const bundle = engine.generatePromptBundle(project);
  assert.equal(bundle.entries.length, 1);
  assert.ok(bundle.entries[0].backgroundPrompt.includes(literalPrompt));
  assert.ok(bundle.entries[0].backgroundPrompt.includes("Do not draw any letters"));
  assert.ok(bundle.entries[0].overlayDirective.includes(JSON.stringify(literalTitle)));
  assert.ok(bundle.entries[0].integratedPrompt.includes(literalPrompt));
  const jsonlEntry = JSON.parse(bundle.jsonl);
  assert.equal(jsonlEntry.backgroundPrompt, bundle.entries[0].backgroundPrompt);
  assert.equal(jsonlEntry.overlayDirective, bundle.entries[0].overlayDirective);
});

test("prompt bundle distinguishes field-aware QR wrapping from full-width no-QR layout", () => {
  const project = engine.createDefaultProject({
    settings: {
      sequenceMode: "none",
      textAlign: "left",
      textVerticalAlign: "center",
      textScalePercent: 125,
      qr: { enabled: true, side: "front", position: "right", layoutMode: "adaptive" },
    },
    records: [
      { label_id: "QR-YES", number: "001", front_title: "QR 있음", front_qr_value: "https://example.kr/yes" },
      { label_id: "QR-NO", number: "002", front_title: "QR 없음", front_qr_value: "" },
    ],
  });
  const bundle = engine.generatePromptBundle(project);
  assert.equal(bundle.entries[0].layout.qrPresent, true);
  assert.equal(bundle.entries[0].layout.contentFlow, "field-aware-wrap-around-qr");
  assert.equal(bundle.entries[0].layout.fontScalePercent, 125);
  assert.ok(bundle.entries[0].backgroundPrompt.includes("QR code will be composited later at right"));
  assert.ok(bundle.entries[0].overlayDirective.includes('"number": ""'));
  assert.equal(bundle.entries[1].layout.qrPresent, false);
  assert.equal(bundle.entries[1].layout.contentFlow, "full-width-no-qr-reservation");
  assert.ok(bundle.entries[1].backgroundPrompt.includes("Do not reserve an empty QR box"));
  assert.ok(bundle.entries[1].overlayDirective.includes("do not leave an empty QR-shaped gap"));

  project.settings.qr.layoutMode = "reserved";
  const reservedBundle = engine.generatePromptBundle(project);
  assert.equal(reservedBundle.entries[0].layout.contentFlow, "fixed-reserved-qr-zone");
});

test("prompt bundle groups multiple sheets into front and back print-page prompts", () => {
  const spec = engine.createDefaultSpec({
    grid: {
      rows: 2,
      columns: 2,
      labelWidthMm: 90,
      labelHeightMm: 130,
      offsetLeftMm: 5,
      offsetTopMm: 5,
      pitchXmm: 100,
      pitchYmm: 135,
      gapXmm: 10,
      gapYmm: 5,
    },
    duplex: { enabled: true, flipEdge: "long", backTransform: "auto" },
  });
  const project = engine.createDefaultProject({
    spec,
    records: Array.from({ length: 6 }, (_, index) => ({
      label_id: `PAGE-${index + 1}`,
      number: String(index + 1).padStart(2, "0"),
      front_title: `앞면 ${index + 1}`,
      back_title: `뒷면 ${index + 1}`,
      back_body: `안내 ${index + 1}`,
    })),
  });
  const bundle = engine.generatePromptBundle(project, { includeEmptySides: true });
  assert.equal(bundle.pagination.totalSheets, 2);
  assert.equal(bundle.pagination.printPageCount, 4);
  assert.equal(bundle.pagePrompts.map((page) => page.side).join(","), "front,back,front,back");
  assert.equal(bundle.pagePrompts.map((page) => page.sheetNumber).join(","), "1,1,2,2");
  assert.equal(bundle.pagePrompts[0].recordIds.join(","), "PAGE-1,PAGE-2,PAGE-3,PAGE-4");
  assert.equal(bundle.pagePrompts[2].recordIds.join(","), "PAGE-5,PAGE-6");
  assert.ok(bundle.pagePrompts[2].prompt.includes("PAGE-5"));
  assert.ok(!bundle.pagePrompts[2].prompt.includes("PAGE-1"));
  assert.ok(bundle.pagePrompts[3].prompt.includes("SHEET 2 BACK"));
  assert.ok(bundle.pagePrompts[3].prompt.includes("Back-side transform: mirrorX"));
  assert.equal(bundle.pageJsonl.split("\n").length, 4);
  assert.equal(bundle.allPagesPrompt.match(/\[A4 FULL IMAGE PAGE/g)?.length, 4);
  assert.equal(bundle.pagePrompts[0].prompt, bundle.pagePrompts[0].promptVariants.integrated);
  assert.equal(bundle.allPagesPrompt, bundle.allPagesByMode.integrated);
});

test("background-only page prompts exclude identifiers copy QR and private art direction", () => {
  const secrets = {
    id: "person-hong@example.com",
    number: "EMPLOYEE-7788",
    title: "홍길동 비공개 출입표",
    body: "개인전화 000-0000-0000",
    qr: "QR-PRIVATE-TOKEN-XYZ",
    direction: "PRIVATE-ART-DIRECTION-ALPHA",
  };
  const project = engine.createDefaultProject({
    settings: { backgroundPrompt: "navy and teal geometric paper texture with generous quiet space", qr: { enabled: true, side: "front", layoutMode: "adaptive" } },
    records: [{
      label_id: secrets.id,
      number: secrets.number,
      front_title: secrets.title,
      front_body: secrets.body,
      front_qr_value: secrets.qr,
      front_background_prompt: secrets.direction,
    }],
  });
  const bundle = engine.generatePromptBundle(project);
  const page = bundle.pagePrompts[0];
  const backgroundOnly = page.promptVariants.backgroundOnly;
  [secrets.id, secrets.number, secrets.title, secrets.body, secrets.qr, secrets.direction].forEach((secret) => {
    assert.equal(backgroundOnly.includes(secret), false, `background-only leaked ${secret}`);
  });
  assert.ok(backgroundOnly.includes("SLOT 1"));
  assert.ok(backgroundOnly.includes("navy and teal geometric paper texture"));
  assert.ok(backgroundOnly.includes(`${project.spec.grid.labelWidthMm} mm × ${project.spec.grid.labelHeightMm} mm`));
  assert.ok(page.promptVariants.overlayOnly.includes(secrets.title));
  assert.ok(page.promptVariants.overlayOnly.includes(secrets.qr));
  assert.ok(page.promptVariants.integrated.includes(secrets.id));
  assert.ok(page.promptVariants.integrated.includes(secrets.title));
  assert.equal(page.promptVariants.integrated.includes(secrets.qr), false, "full-image prompts must reserve QR space without leaking the QR value");
  assert.equal(page.prompt, page.promptVariants.integrated);
  assert.equal(bundle.allPagesByMode["background-only"], backgroundOnly);
  assert.equal(bundle.allPagesByMode["overlay-only"], page.promptVariants.overlayOnly);
  assert.equal(bundle.allPagesPrompt, bundle.allPagesByMode.integrated);
});

test("prompt output keeps exact text and numbering while reserving QR compositing space", () => {
  const project = engine.createDefaultProject({
    settings: {
      outputGoal: "prompt",
      sequenceMode: "sequence",
      backgroundPrompt: "ivory battery training center meal-ticket design",
      qr: { enabled: true, side: "front", position: "bottom-right", sizePercent: 34, layoutMode: "adaptive" },
      visualStyleSnapshot: { prompt: { en: "Swiss editorial grid" }, stylePrompt: { invalid: true } },
    },
    records: [{
      label_id: "DEMO-MEAL-001",
      number: "DEMO-001",
      front_title: "샘플교육센터 교육생 식권",
      front_body: "중식 1회 · 교육 당일 사용",
      front_qr_value: "https://private.example/meal/001",
    }],
  });
  const bundle = engine.generatePromptBundle(project);
  const entry = bundle.entries[0];
  const page = bundle.pagePrompts[0];
  assert.equal(entry.layout.qrPresent, false);
  assert.equal(entry.layout.qrReserved, true);
  assert.equal(entry.layout.qrMode, "reserve-blank-space");
  assert.equal(entry.layout.qrPosition, "bottom-right");
  assert.equal(entry.layout.qrSizePercent, 34);
  assert.ok(entry.individualPrompt.includes("샘플교육센터 교육생 식권"));
  assert.ok(entry.individualPrompt.includes("DEMO-001"));
  assert.ok(entry.individualPrompt.includes("completely clean square at bottom-right"));
  assert.equal(entry.individualPrompt.includes("https://private.example/meal/001"), false);
  assert.equal(entry.individualPrompt.includes("[object Object]"), false);
  assert.equal(page.individualPrompts.length, 1);
  assert.equal(page.slots[0].individualPrompt, entry.individualPrompt);
  assert.ok(page.prompt.includes("[A4 FULL IMAGE PAGE 1/1"));
  assert.ok(page.prompt.includes("샘플교육센터 교육생 식권"));
  assert.equal(bundle.individualPrompts.length, 1);
  assert.ok(bundle.allIndividualPrompts.includes("DEMO-MEAL-001"));
});

test("preflight reports geometry duplicate missing-background and empty-back issues", () => {
  const project = {
    spec: {
      page: { orientation: "portrait" },
      grid: { rows: 2, columns: 2, labelWidthMm: 120, labelHeightMm: 140, offsetLeftMm: 5, offsetTopMm: 5, pitchXmm: 120, pitchYmm: 140 },
      duplex: { enabled: true },
    },
    settings: { requireBackgrounds: true },
    records: [
      { label_id: "DUP", number: "7", title: "첫째" },
      { label_id: "DUP", number: "7", title: "둘째" },
    ],
  };
  const result = engine.preflightProject(project);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((entry) => entry.code === "GRID_EXCEEDS_PAGE_WIDTH"));
  assert.ok(result.errors.some((entry) => entry.code === "DUPLICATE_RECORD_ID"));
  assert.ok(result.errors.some((entry) => entry.code === "MISSING_BACKGROUNDS"));
  assert.ok(result.warnings.some((entry) => entry.code === "DUPLICATE_NUMBER"));
  assert.ok(result.warnings.some((entry) => entry.code === "EMPTY_BACKS"));

  const missingAsset = engine.preflightProject({
    records: [{ label_id: "asset-ref", title: "자산", front_background_asset_id: "not-registered" }],
    assets: [],
  });
  assert.ok(missingAsset.errors.some((entry) => entry.code === "BACKGROUND_ASSET_NOT_FOUND"));
});

test("serialization excludes runtime blobs and object URLs", () => {
  const project = engine.createDefaultProject({
    settings: { outputGoal: "both" },
    records: [{ label_id: "A", title: "보존" }],
    assets: [{ assetId: "asset-1", name: "a.png", originalBlob: new Blob(["data"]), objectUrl: "blob:runtime", metadata: { keep: true } }],
  });
  const serializable = engine.toSerializableProject(project);
  assert.equal(serializable.assets[0].originalBlob, undefined);
  assert.equal(serializable.assets[0].objectUrl, undefined);
  assert.equal(serializable.assets[0].metadata.keep, true);
  const serialized = engine.serializeProject(project, 0);
  assert.equal(serialized.includes("blob:runtime"), false);
  const restored = engine.deserializeProject(serialized);
  assert.equal(restored.records[0].front.title, "보존");
  assert.equal(restored.settings.outputGoal, "both");
  assert.equal(engine.createDefaultProject({ settings: { outputGoal: "invalid" } }).settings.outputGoal, "print");
});

test("upright vertical text orientation survives project normalization", () => {
  const project = engine.createDefaultProject({
    records: [{ label_id: "VERTICAL", front: { title: "세로쓰기", textOrientation: "vertical-upright" } }],
  });
  assert.equal(project.records[0].front.textOrientation, "vertical-upright");
  assert.equal(engine.toSerializableProject(project).records[0].front.textOrientation, "vertical-upright");
});

console.log(`label-sheet-engine: ${passed.length} tests passed`);
passed.forEach((name) => console.log(`  ✓ ${name}`));
