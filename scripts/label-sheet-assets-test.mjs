import assert from "node:assert/strict";

await import("../src/label-sheet-assets.js");
await import("../src/label-sheet-renderer.js");

const Assets = globalThis.PromptDeckLabelSheetAssets;
const Renderer = globalThis.PromptDeckLabelSheetRenderer;

assert.ok(Assets, "PromptDeckLabelSheetAssets global must be available");
assert.ok(Renderer, "PromptDeckLabelSheetRenderer global must be available");

assert.equal(Assets.isSupportedRasterMime("image/png"), true);
assert.equal(Assets.isSupportedRasterMime("image/jpg"), true);
assert.equal(Assets.isSupportedRasterMime("image/webp; charset=binary"), true);
assert.equal(Assets.isSupportedRasterMime("image/svg+xml"), false);
assert.equal(Assets.isSupportedRasterMime("", "ticket.jpeg"), true);
assert.equal(Assets.isSupportedRasterMime("", "ticket.svg"), false);

assert.deepEqual(Assets.calculateTargetPixels(70, 40, 300), {
  width: 827,
  height: 472,
  dpi: 300,
  bleedMm: 0,
});
assert.deepEqual(Assets.calculateTargetPixels(70, 40, 300, 3), {
  width: 898,
  height: 543,
  dpi: 300,
  bleedMm: 3,
});

const portraitQuadrants = [
  Assets.calculatePageCrop({ xMm: 0, yMm: 0, widthMm: 105, heightMm: 148.5 }, { orientation: "portrait" }),
  Assets.calculatePageCrop({ xMm: 105, yMm: 0, widthMm: 105, heightMm: 148.5 }, { orientation: "portrait" }),
  Assets.calculatePageCrop({ xMm: 0, yMm: 148.5, widthMm: 105, heightMm: 148.5 }, { orientation: "portrait" }),
  Assets.calculatePageCrop({ xMm: 105, yMm: 148.5, widthMm: 105, heightMm: 148.5 }, { orientation: "portrait" }),
];
assert.deepEqual(portraitQuadrants, [
  { x: 0, y: 0, width: 0.5, height: 0.5 },
  { x: 0.5, y: 0, width: 0.5, height: 0.5 },
  { x: 0, y: 0.5, width: 0.5, height: 0.5 },
  { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
]);

assert.deepEqual(
  Assets.calculatePageCrop(
    { xMm: 148.5, yMm: 105, widthMm: 148.5, heightMm: 105 },
    { orientation: "landscape" }
  ),
  { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }
);

assert.deepEqual(
  Assets.calculatePageCrop(
    { xMm: -12.25, yMm: -3.75, widthMm: 240.5, heightMm: 320.25 },
    { widthMm: 210, heightMm: 297, orientation: "portrait" }
  ),
  { x: 0, y: 0, width: 1, height: 1 }
);

const beyondPageCrop = Assets.calculatePageCrop(
  { xMm: 500, yMm: 400, widthMm: -10, heightMm: -20 },
  { widthMm: 210, heightMm: 297 }
);
assert.deepEqual(beyondPageCrop, { x: 0.9999, y: 0.9999, width: 0.0001, height: 0.0001 });

assert.deepEqual(
  Assets.calculatePageCrop(
    { xMm: 10, yMm: 20, widthMm: 50, heightMm: 30 },
    { widthMm: 100, heightMm: 100 },
    { bleedMm: 2, insetMm: 1 }
  ),
  { x: 0.09, y: 0.19, width: 0.52, height: 0.32 }
);

const floatingCrop = Assets.calculatePageCrop(
  { xMm: 0.1 + 0.2, yMm: 0.3, widthMm: 69.7, heightMm: 98.7 },
  { widthMm: 210, heightMm: 297 }
);
assert.equal(floatingCrop.x, 0.001428571429);
assert.equal(floatingCrop.y, 0.00101010101);
assert.equal(floatingCrop.width, 0.331904761904);
assert.equal(floatingCrop.height, 0.332323232323);

const squareCover = Assets.calculateDrawRect(1600, 900, 400, 400, { fit: "cover" });
assert.deepEqual(squareCover, {
  sx: 350,
  sy: 0,
  sw: 900,
  sh: 900,
  dx: 0,
  dy: 0,
  dw: 400,
  dh: 400,
  fit: "cover",
});

const leftCover = Assets.calculateDrawRect(1600, 900, 400, 400, {
  fit: "cover",
  focalPoint: { x: 0, y: 0.5 },
});
assert.equal(leftCover.sx, 0);
const rightCover = Assets.calculateDrawRect(1600, 900, 400, 400, {
  fit: "cover",
  focalPoint: { x: 1, y: 0.5 },
});
assert.equal(rightCover.sx, 700);

const squareContain = Assets.calculateDrawRect(1600, 900, 400, 400, { fit: "contain" });
assert.equal(squareContain.dx, 0);
assert.equal(squareContain.dy, 87.5);
assert.equal(squareContain.dw, 400);
assert.equal(squareContain.dh, 225);

const cropped = Assets.calculateDrawRect(1600, 900, 400, 400, {
  fit: "cover",
  crop: { x: 0.25, y: 0, width: 0.5, height: 1 },
});
assert.equal(cropped.sx, 400);
assert.equal(cropped.sy, 50);
assert.equal(cropped.sw, 800);
assert.equal(cropped.sh, 800);

const noUpscale = Assets.calculateDerivativeSize(300, 200, 900, 600, {
  sw: 300,
  sh: 200,
  dw: 900,
  dh: 600,
}, false);
assert.equal(noUpscale.lowResolution, true);
assert.equal(noUpscale.width, 300);
assert.equal(noUpscale.height, 200);
assert.equal(noUpscale.upscaled, false);

const store = Assets.createStore({ persist: false });
await store.ready();
const first = await store.register(new Blob(["not-a-real-png-one"], { type: "image/png" }), {
  filename: "배경 01.PNG",
});
const second = await store.register(new Blob(["not-a-real-png-two"], { type: "image/png" }), {
  filename: "배경 02.png",
});
assert.ok(first.assetId);
assert.ok(second.assetId);
assert.equal(store.findByFilename("C:\\imports\\배경 01.PNG").status, "matched");
assert.equal(store.findByFilename("배경 1.PNG").status, "missing", "filename lookup must not use fuzzy matching");
const mapped = store.mapFilenames(
  [
    { front_background_file: "배경 01.PNG" },
    { front_background_file: "배경 02.png" },
    { front_background_file: "없는파일.png" },
    { front_background_file: "" },
  ],
  { field: "front_background_file" }
);
assert.equal(mapped.matches.length, 2);
assert.equal(mapped.missing.length, 1);
assert.equal(mapped.empty.length, 1);
assert.equal(mapped.ok, false);
await store.destroy();

assert.deepEqual(Renderer.getPagePixelSize({ orientation: "portrait" }, 300), {
  width: 2480,
  height: 3508,
  widthMm: 210,
  heightMm: 297,
  orientation: "portrait",
  dpi: 300,
});
assert.deepEqual(Renderer.getPagePixelSize({ orientation: "landscape" }, 300), {
  width: 3508,
  height: 2480,
  widthMm: 297,
  heightMm: 210,
  orientation: "landscape",
  dpi: 300,
});

assert.ok(Renderer.contrastRatio("#ffffff", "#111827") >= 4.5, "white and slate text pair must satisfy WCAG AA contrast");
const darkBackgroundContrast = Renderer.summarizeContrastSamples([0.01, 0.025, 0.04, 0.06]);
assert.equal(darkBackgroundContrast.color, "#ffffff", "dark artwork must receive light text automatically");
assert.equal(darkBackgroundContrast.needsScrim, false, "uniform dark artwork should not receive an unnecessary scrim");
const lightBackgroundContrast = Renderer.summarizeContrastSamples([0.72, 0.8, 0.9, 0.98]);
assert.equal(lightBackgroundContrast.color, "#111827", "light artwork must receive dark text automatically");
const mixedBackgroundContrast = Renderer.summarizeContrastSamples([0.01, 0.03, 0.08, 0.82, 0.92, 0.98]);
assert.equal(mixedBackgroundContrast.needsScrim, true, "mixed artwork must receive a localized readability scrim");
const repairedQrPalette = Renderer.resolveQrContrast({ darkColor: "#666666", lightColor: "#777777", eyeColor: "#888888" });
assert.deepEqual(
  { darkColor: repairedQrPalette.darkColor, lightColor: repairedQrPalette.lightColor, eyeColor: repairedQrPalette.eyeColor, adjusted: repairedQrPalette.adjusted },
  { darkColor: "#000000", lightColor: "#ffffff", eyeColor: "#000000", adjusted: true },
  "low-contrast QR colors must fall back to a scanner-safe palette"
);
const preservedQrPalette = Renderer.resolveQrContrast({ darkColor: "#003366", lightColor: "#ffffff", eyeColor: "#003366" });
assert.equal(preservedQrPalette.adjusted, false, "high-contrast QR brand colors should be preserved");

assert.deepEqual(
  Renderer.resolveOrientedBox({ x: 10, y: 20, width: 100, height: 50 }, 90),
  { x: 35, y: -5, width: 50, height: 100, centerX: 60, centerY: 45, rotation: 90, swapsAxes: true },
  "portrait text in a landscape label must be measured against swapped logical axes"
);
assert.deepEqual(
  Renderer.resolveOrientedBox({ x: 10, y: 20, width: 100, height: 50 }, 0),
  { x: 10, y: 20, width: 100, height: 50, centerX: 60, centerY: 45, rotation: 0, swapsAxes: false },
  "horizontal text must retain the physical content box"
);

const mirrored = Renderer.transformRectForSide(
  { xMm: 10, yMm: 20, widthMm: 30, heightMm: 40 },
  { widthMm: 210, heightMm: 297 },
  { side: "back", backTransform: "mirror-x", backOffsetXmm: 0.5, backOffsetYmm: -0.25 }
);
assert.deepEqual(mirrored, { xMm: 170.5, yMm: 19.75, widthMm: 30, heightMm: 40 });

const fronts = [{ pageNumber: 1 }, { pageNumber: 2 }];
const backs = [{ pageNumber: 1 }];
const automatic = Renderer.buildPrintSequence(fronts, backs, "auto-duplex");
assert.deepEqual(automatic.map((page) => page.side), ["front", "back", "front", "back"]);
assert.equal(automatic[3].blank, true, "missing back page must become a blank paired page");
assert.deepEqual(Renderer.buildPrintSequence(fronts, backs, "manual-front").map((page) => page.side), ["front", "front"]);
assert.deepEqual(Renderer.buildPrintSequence(fronts, backs, "manual-back").map((page) => page.side), ["back"]);

const measuringContext = {
  font: "",
  textBaseline: "top",
  measureText: (text) => ({ width: Array.from(String(text)).length * 6 }),
};
const fittingLayout = Renderer.analyzeLabelLayout({
  widthMm: 70,
  heightMm: 40,
  side: "front",
  record: { number: "001", front: { title: "출입표", body: "입장 시 제시" }, style: { safeAreaMm: 2 } },
}, { dpi: 72, context: measuringContext });
assert.equal(fittingLayout.fits, true);
assert.deepEqual(fittingLayout.truncatedFields, []);

const noQrLayout = Renderer.analyzeLabelLayout({
  widthMm: 70,
  heightMm: 40,
  side: "front",
  record: {
    front: { title: "QR 없는 전체폭", qrEnabled: true, qrValue: "", qrStyle: { enabled: true, position: "right", layoutMode: "adaptive" } },
    style: { safeAreaMm: 2, verticalAlign: "center", fontScalePercent: 110 },
  },
}, { dpi: 72, context: measuringContext });
const withQrLayout = Renderer.analyzeLabelLayout({
  widthMm: 70,
  heightMm: 40,
  side: "front",
  record: {
    front: { title: "QR 있는 분할", qrEnabled: true, qrValue: "https://example.kr/qr", qrStyle: { enabled: true, position: "right", layoutMode: "adaptive", sizePercent: 28 } },
    style: { safeAreaMm: 2, verticalAlign: "center", fontScalePercent: 110 },
  },
}, { dpi: 72, context: measuringContext });
const forcedNoQrLayout = Renderer.analyzeLabelLayout({
  widthMm: 70,
  heightMm: 40,
  side: "front",
  record: {
    front: { title: "전역 QR 끄기", qrEnabled: true, qrValue: "https://example.kr/stale-qr", qrStyle: { enabled: true, position: "right", layoutMode: "adaptive", sizePercent: 28 } },
    style: { safeAreaMm: 2, verticalAlign: "center", fontScalePercent: 110 },
  },
}, { dpi: 72, context: measuringContext, qrEnabled: false });
assert.equal(noQrLayout.metrics.contentFlow, "full-width-no-qr-reservation");
assert.equal(withQrLayout.metrics.contentFlow, "field-aware-wrap-around-qr");
assert.equal(forcedNoQrLayout.metrics.contentFlow, "full-width-no-qr-reservation", "global QR disable must veto stale per-record QR assignments");
assert.ok(noQrLayout.metrics.width > withQrLayout.metrics.width, "QR 없는 레이아웃은 문구가 전체 폭을 사용해야 합니다.");
assert.ok(noQrLayout.metrics.contentTop > 0, "가운데 세로 배치는 상단 여유를 계산해야 합니다.");

const customFields = Renderer.normalizeCustomTextFields({
  title: { xPercent: 10, yPercent: 12, widthPercent: 70, sizePercent: 18, fontFamily: "Malgun Gothic, sans-serif", color: "#C82333", align: "left" },
  body: { visible: false },
});
assert.equal(customFields.title.xPercent, 10);
assert.equal(customFields.title.widthPercent, 70);
assert.equal(customFields.title.fontFamily, "Malgun Gothic, sans-serif");
assert.equal(customFields.title.color, "#c82333");
assert.equal(customFields.body.align, "center", "missing custom fields must retain safe defaults");
assert.equal(customFields.body.visible, false, "individual fields can be excluded from output");
assert.equal(customFields.title.heightPercent, null, "text fields use content-driven height until the user fixes it");
assert.equal(customFields.title.avoidQr, true, "text fields avoid QR by default");
const customLayout = Renderer.analyzeLabelLayout({
  widthMm: 70,
  heightMm: 40,
  side: "front",
  record: {
    front: { title: "직접 배치 제목", body: "직접 배치 본문" },
    style: { safeAreaMm: 2, textFields: customFields },
  },
}, { dpi: 72, context: measuringContext });
assert.equal(customLayout.metrics.custom, true);
assert.equal(customLayout.fits, true);
assert.ok(customLayout.metrics.fields.find((field) => field.field === "title").x > 0);
assert.equal(customLayout.metrics.fields.some((field) => field.field === "body"), false, "hidden fields must not reserve output space");
const forcedBreakLayout = Renderer.analyzeLabelLayout({
  widthMm: 70,
  heightMm: 40,
  side: "front",
  record: {
    front: { title: "첫째 줄\n둘째 줄" },
    style: { safeAreaMm: 2, textFields: { title: { widthPercent: 90, sizePercent: 12, maxLines: 2, color: "#2457d6" } } },
  },
}, { dpi: 72, context: measuringContext });
const forcedBreakTitle = forcedBreakLayout.metrics.fields.find((field) => field.field === "title");
assert.equal(forcedBreakTitle.lineCount, 2, "manual newlines must remain forced line breaks");
assert.equal(forcedBreakTitle.color, "#2457d6", "per-field colors must survive renderer normalization");
const customOverflow = Renderer.analyzeLabelLayout({
  widthMm: 70,
  heightMm: 40,
  side: "front",
  record: {
    front: { title: "아래로 밀린 긴 제목입니다" },
    style: { safeAreaMm: 2, textFields: { title: { yPercent: 96, sizePercent: 30, maxLines: 2 } } },
  },
}, { dpi: 72, context: measuringContext });
assert.equal(customOverflow.fits, false);
assert.equal(customOverflow.verticalOverflow, true);
assert.ok(customOverflow.truncatedFields.includes("title"));

const customQrBox = Renderer.resolveQrLayout({
  data: {
    qrEnabled: true,
    qrValue: "https://example.kr/custom-qr",
    qrStyle: { enabled: true, position: "right", layoutMode: "adaptive", sizePercent: 32, xPercent: 12, yPercent: 20 },
  },
  record: { style: { safeAreaMm: 2 } },
  placement: {},
}, { x: 0, y: 0, width: 200, height: 100 }, 72);
assert.equal(customQrBox.customPosition, true, "per-label QR coordinates must override the named position preset");
assert.equal(customQrBox.size, 32);
assert.equal(customQrBox.x, 24);
assert.equal(customQrBox.y, 20);

const customQrLayout = Renderer.analyzeLabelLayout({
  widthMm: 70,
  heightMm: 40,
  side: "front",
  record: {
    front: {
      title: "왼쪽 QR에 맞춘 문구",
      qrEnabled: true,
      qrValue: "https://example.kr/custom-qr",
      qrStyle: { enabled: true, layoutMode: "adaptive", sizePercent: 32, xPercent: 12, yPercent: 20 },
    },
    style: { safeAreaMm: 2 },
  },
}, { dpi: 72, context: measuringContext });
assert.equal(customQrLayout.metrics.contentFlow, "field-aware-wrap-around-qr");
assert.ok(customQrLayout.metrics.qrRect.x < customQrLayout.metrics.width * 0.2, "custom QR x position must reach the output layout");
assert.ok(customQrLayout.metrics.contentTop >= 0, "adaptive text layout must remain inside the label after custom QR movement");

const fieldAwareQrLayout = Renderer.analyzeLabelLayout({
  widthMm: 94,
  heightMm: 67.75,
  side: "front",
  record: {
    front: {
      title: "QR과 같은 높이에 있는 제목은 QR만 피합니다",
      footer: "QR 아래의 하단 문구는 전체 너비를 유지합니다",
      qrEnabled: true,
      qrValue: "https://example.kr/field-aware",
      qrStyle: { enabled: true, layoutMode: "adaptive", sizePercent: 28, xPercent: 68, yPercent: 5, gapPercent: 2 },
      style: {
        textFields: {
          title: { xPercent: 5, yPercent: 5, widthPercent: 90, sizePercent: 10, maxLines: 3, avoidQr: true },
          footer: { xPercent: 5, yPercent: 82, widthPercent: 90, sizePercent: 6, maxLines: 2, avoidQr: true },
        },
        textGroup: { xPercent: 0, yPercent: 0, widthPercent: 100, heightPercent: 100 },
      },
    },
    style: { safeAreaMm: 2 },
  },
}, { dpi: 72, context: measuringContext });
const wrappedTitle = fieldAwareQrLayout.metrics.fields.find((field) => field.field === "title");
const fullWidthFooter = fieldAwareQrLayout.metrics.fields.find((field) => field.field === "footer");
assert.ok(fieldAwareQrLayout.metrics.autoWrappedFields.includes("title"), "only a field sharing the QR vertical range should wrap");
assert.equal(fieldAwareQrLayout.metrics.autoWrappedFields.includes("footer"), false, "a field below the QR must retain its preferred width");
assert.ok(wrappedTitle.width < fullWidthFooter.width, "QR wrapping must not shrink unrelated text fields");
assert.equal(fieldAwareQrLayout.qrCollision, false, "automatic wrapping should resolve the QR collision");

const freeOverlapLayout = Renderer.analyzeLabelLayout({
  widthMm: 94,
  heightMm: 67.75,
  side: "front",
  record: {
    front: {
      title: "자유 겹침",
      qrEnabled: true,
      qrValue: "https://example.kr/free-overlap",
      qrStyle: { enabled: true, layoutMode: "overlay", sizePercent: 32, xPercent: 36, yPercent: 20 },
      style: { textFields: { title: { xPercent: 20, yPercent: 20, widthPercent: 60, heightPercent: 30, sizePercent: 14, avoidQr: false } } },
    },
    style: { safeAreaMm: 2 },
  },
}, { dpi: 72, context: measuringContext });
assert.equal(freeOverlapLayout.qrCollision, true, "free overlap keeps the user's placement and reports a non-blocking collision");

const groupedLayout = Renderer.analyzeLabelLayout({
  widthMm: 94,
  heightMm: 67.75,
  side: "front",
  record: {
    front: {
      title: "그룹 이동",
      style: {
        textGroup: { xPercent: 20, yPercent: 10, widthPercent: 60, heightPercent: 70 },
        textFields: { title: { xPercent: 0, yPercent: 0, widthPercent: 100, heightPercent: 25, sizePercent: 12 } },
      },
    },
    style: { safeAreaMm: 2 },
  },
}, { dpi: 72, context: measuringContext });
assert.equal(groupedLayout.metrics.group.xPercent, 20);
assert.equal(groupedLayout.metrics.group.widthPercent, 60);
assert.ok(groupedLayout.metrics.fields[0].x > 0, "content-group positioning must affect final output coordinates");

const overflowingLayout = Renderer.analyzeLabelLayout({
  widthMm: 35,
  heightMm: 1,
  side: "front",
  record: {
    number: "LONG-NUMBER-000000000000000000000000",
    front: { title: "아주 긴 라벨 제목".repeat(30), body: "본문".repeat(100) },
    style: { safeAreaMm: 2 },
  },
}, { dpi: 72, context: measuringContext });
assert.equal(overflowingLayout.fits, false);
assert.ok(overflowingLayout.truncatedFields.includes("number"));
assert.ok(overflowingLayout.truncatedFields.includes("title"));
assert.ok(overflowingLayout.verticalOverflow);

const pdfBytes = Renderer.buildPdfFromJpegPages([
  { bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), widthPx: 2480, heightPx: 3508, widthMm: 210, heightMm: 297 },
  { bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), widthPx: 3508, heightPx: 2480, widthMm: 297, heightMm: 210 },
]);
const pdfText = new TextDecoder("latin1").decode(pdfBytes);
assert.equal(pdfText.startsWith("%PDF-1.4"), true, "PDF export must emit a valid PDF header");
assert.match(pdfText, /\/Type \/Pages \/Kids \[3 0 R 6 0 R\] \/Count 2/, "PDF must contain every rendered page");
assert.match(pdfText, /\/MediaBox \[0 0 595\.276 841\.89\]/, "portrait A4 size must be written in PDF points");
assert.match(pdfText, /\/MediaBox \[0 0 841\.89 595\.276\]/, "landscape A4 size must be written in PDF points");
const declaredXrefOffset = Number(pdfText.match(/startxref\n(\d+)\n%%EOF/)?.[1]);
assert.equal(declaredXrefOffset, pdfText.indexOf("xref\n"), "PDF xref offset must point to the cross-reference table");

console.log("label-sheet assets/renderer tests passed");
