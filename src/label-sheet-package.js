// PromptDeck 라벨·티켓 프로젝트 패키지
// 프로젝트 JSON, CSV, 프롬프트와 원본 래스터 이미지를 하나의 STORE ZIP으로 보관합니다.
(function (root) {
  "use strict";

  const PACKAGE_SCHEMA = "promptdeck-label-sheet-package/1.0";
  const encoder = new TextEncoder();
  const decoder = new TextDecoder("utf-8");

  class LabelSheetPackageError extends Error {
    constructor(code, message, details = {}) {
      super(message);
      this.name = "LabelSheetPackageError";
      this.code = code;
      this.details = details;
    }
  }

  const cleanText = (value) => String(value ?? "").trim();
  const toBytes = (value) => encoder.encode(String(value ?? ""));

  function safePathPart(value, fallback = "file") {
    return cleanText(value || fallback)
      .normalize("NFKC")
      .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/^\.+|\.+$/g, "")
      .slice(0, 100) || fallback;
  }

  function csvCell(value) {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function recordsToCsv(records) {
    const headers = [
      "label_id", "number", "name", "category",
      "front_title", "front_subtitle", "front_body", "front_footer", "front_qr_value", "front_background_file",
      "back_title", "back_subtitle", "back_body", "back_footer", "back_qr_value", "back_background_file",
    ];
    const lines = [headers.join(",")];
    Array.from(records || []).forEach((record) => {
      const row = [
        record?.id,
        record?.number,
        record?.data?.name,
        record?.data?.category,
        record?.front?.title,
        record?.front?.subtitle,
        record?.front?.body,
        record?.front?.footer,
        record?.front?.qrValue,
        record?.front?.backgroundFile,
        record?.back?.title,
        record?.back?.subtitle,
        record?.back?.body,
        record?.back?.footer,
        record?.back?.qrValue,
        record?.back?.backgroundFile,
      ];
      lines.push(row.map(csvCell).join(","));
    });
    return `\uFEFF${lines.join("\r\n")}`;
  }

  async function blobToBytes(blob) {
    if (!blob || typeof blob.arrayBuffer !== "function") {
      throw new LabelSheetPackageError("INVALID_BLOB", "패키지에 넣을 이미지 원본을 읽을 수 없습니다.");
    }
    return new Uint8Array(await blob.arrayBuffer());
  }

  function uniqueAssetPath(asset, usedPaths) {
    const assetId = safePathPart(asset?.assetId || asset?.id || "asset", "asset");
    const filename = safePathPart(asset?.filename || asset?.name || "background.png", "background.png");
    const base = `assets/${assetId}--${filename}`;
    let candidate = base;
    let suffix = 2;
    while (usedPaths.has(candidate.toLocaleLowerCase())) {
      const dot = base.lastIndexOf(".");
      candidate = dot > base.lastIndexOf("/")
        ? `${base.slice(0, dot)}-${suffix}${base.slice(dot)}`
        : `${base}-${suffix}`;
      suffix += 1;
    }
    usedPaths.add(candidate.toLocaleLowerCase());
    return candidate;
  }

  async function buildProjectPackage(options = {}) {
    if (typeof root.createZip !== "function") {
      throw new LabelSheetPackageError("ZIP_WRITER_MISSING", "ZIP 작성 모듈을 불러오지 못했습니다.");
    }
    const project = options.project && typeof options.project === "object" ? options.project : null;
    if (!project) throw new LabelSheetPackageError("PROJECT_REQUIRED", "저장할 라벨·티켓 프로젝트가 없습니다.");

    const usedPaths = new Set();
    const manifestAssets = [];
    const files = [];
    for (const asset of Array.from(options.assets || [])) {
      const original = asset?.original?.blob;
      if (!original) continue;
      const path = uniqueAssetPath(asset, usedPaths);
      files.push({ name: path, data: await blobToBytes(original) });
      manifestAssets.push({
        assetId: cleanText(asset.assetId || asset.id),
        filename: cleanText(asset.filename || asset.name),
        path,
        mime: cleanText(asset.mime || original.type || "application/octet-stream"),
        source: cleanText(asset.source || "upload"),
        width: Number(asset.width) || 0,
        height: Number(asset.height) || 0,
      });
    }

    const now = new Date().toISOString();
    const pagePrompts = Array.isArray(options.promptBundle?.pagePrompts)
      ? options.promptBundle.pagePrompts.filter((page) => cleanText(page?.prompt))
      : [];
    const manifest = {
      schema: PACKAGE_SCHEMA,
      version: 1,
      createdAt: now,
      projectId: cleanText(project.id),
      projectName: cleanText(project.name),
      assetCount: manifestAssets.length,
      pagePromptCount: pagePrompts.length,
      assets: manifestAssets,
    };
    const promptJsonl = cleanText(options.promptBundle?.jsonl);
    const pagePromptJsonl = cleanText(options.promptBundle?.pageJsonl)
      || pagePrompts.map((page) => JSON.stringify(page)).join("\n");
    const pagePromptFiles = pagePrompts.map((page, index) => {
      const printPageNumber = Math.max(1, Number(page.printPageNumber) || index + 1);
      const sheetNumber = Math.max(1, Number(page.sheetNumber) || index + 1);
      const side = page.side === "back" ? "back" : "front";
      return {
        name: `prompts/pages/print-page-${String(printPageNumber).padStart(3, "0")}-sheet-${String(sheetNumber).padStart(3, "0")}-${side}.txt`,
        data: toBytes(`${cleanText(page.prompt)}\n`),
      };
    });
    files.unshift(
      { name: "README-KO.txt", data: toBytes([
        "PromptDeck 라벨·티켓 프로젝트 패키지",
        "",
        "project.json: 규격, 데이터, QR, 스타일, 양면 설정",
        "records.csv: 표 형태의 라벨 데이터",
        "prompts.jsonl: 라벨 면별 배경 및 오버레이 프롬프트",
        "page-prompts.jsonl: A4 출력 페이지별 프롬프트와 슬롯 정보",
        "prompts/pages/: 출력 순서대로 분리된 A4 페이지 프롬프트",
        "assets/: 업로드하거나 생성한 원본 래스터 이미지",
        "",
        "PromptDeck의 라벨·티켓 제작 탭에서 이 ZIP을 다시 불러올 수 있습니다.",
      ].join("\r\n")) },
      { name: "manifest.json", data: toBytes(JSON.stringify(manifest, null, 2)) },
      { name: "project.json", data: toBytes(JSON.stringify(project, null, 2)) },
      { name: "records.csv", data: toBytes(recordsToCsv(project.records)) },
      { name: "prompts.jsonl", data: toBytes(promptJsonl ? `${promptJsonl}\n` : "") },
      { name: "page-prompts.jsonl", data: toBytes(pagePromptJsonl ? `${pagePromptJsonl}\n` : "") },
      ...pagePromptFiles,
    );
    return { blob: root.createZip(files), manifest, files };
  }

  function uint16(view, offset) {
    return view.getUint16(offset, true);
  }

  function uint32(view, offset) {
    return view.getUint32(offset, true);
  }

  async function readStoredZip(blob) {
    const bytes = await blobToBytes(blob);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const entries = new Map();
    let offset = 0;
    while (offset + 4 <= bytes.length) {
      const signature = uint32(view, offset);
      if (signature === 0x02014b50 || signature === 0x06054b50) break;
      if (signature !== 0x04034b50 || offset + 30 > bytes.length) {
        throw new LabelSheetPackageError("ZIP_INVALID", "PromptDeck 프로젝트 ZIP 구조를 읽을 수 없습니다.", { offset });
      }
      const flags = uint16(view, offset + 6);
      const compression = uint16(view, offset + 8);
      const compressedSize = uint32(view, offset + 18);
      const uncompressedSize = uint32(view, offset + 22);
      const nameLength = uint16(view, offset + 26);
      const extraLength = uint16(view, offset + 28);
      if (flags & 0x0008) {
        throw new LabelSheetPackageError("ZIP_DATA_DESCRIPTOR_UNSUPPORTED", "이 ZIP은 PromptDeck 패키지 형식이 아닙니다.");
      }
      if (compression !== 0 || compressedSize !== uncompressedSize) {
        throw new LabelSheetPackageError("ZIP_COMPRESSION_UNSUPPORTED", "PromptDeck에서 만든 무압축 프로젝트 ZIP만 불러올 수 있습니다.");
      }
      const nameStart = offset + 30;
      const dataStart = nameStart + nameLength + extraLength;
      const dataEnd = dataStart + compressedSize;
      if (dataEnd > bytes.length) throw new LabelSheetPackageError("ZIP_TRUNCATED", "프로젝트 ZIP 파일이 중간에 잘렸습니다.");
      const name = decoder.decode(bytes.slice(nameStart, nameStart + nameLength));
      entries.set(name, bytes.slice(dataStart, dataEnd));
      offset = dataEnd;
    }
    return entries;
  }

  function parseJsonBytes(bytes, filename) {
    try {
      return JSON.parse(decoder.decode(bytes));
    } catch (error) {
      throw new LabelSheetPackageError("JSON_INVALID", `${filename}의 JSON 형식이 올바르지 않습니다.`, { cause: error.message });
    }
  }

  async function parseProjectPackage(input) {
    if (!input || typeof input.arrayBuffer !== "function") {
      throw new LabelSheetPackageError("PACKAGE_REQUIRED", "불러올 ZIP 또는 JSON 파일을 선택해 주세요.");
    }
    const filename = cleanText(input.name).toLocaleLowerCase();
    const mime = cleanText(input.type).toLocaleLowerCase();
    if (filename.endsWith(".json") || mime.includes("json")) {
      const project = parseJsonBytes(await blobToBytes(input), input.name || "project.json");
      return { project, manifest: null, assets: [], source: "json" };
    }

    const entries = await readStoredZip(input);
    const projectBytes = entries.get("project.json");
    if (!projectBytes) throw new LabelSheetPackageError("PROJECT_JSON_MISSING", "ZIP 안에 project.json이 없습니다.");
    const manifestBytes = entries.get("manifest.json");
    const manifest = manifestBytes ? parseJsonBytes(manifestBytes, "manifest.json") : { assets: [] };
    if (manifest.schema && manifest.schema !== PACKAGE_SCHEMA) {
      throw new LabelSheetPackageError("PACKAGE_SCHEMA_UNSUPPORTED", "지원하지 않는 PromptDeck 프로젝트 패키지 버전입니다.");
    }
    const assets = Array.from(manifest.assets || []).map((asset) => {
      const data = entries.get(asset.path);
      if (!data) return { ...asset, missing: true, blob: null };
      return {
        ...asset,
        missing: false,
        blob: new Blob([data], { type: asset.mime || "application/octet-stream" }),
      };
    });
    return {
      project: parseJsonBytes(projectBytes, "project.json"),
      manifest,
      assets,
      source: "zip",
    };
  }

  root.PromptDeckLabelSheetPackage = Object.freeze({
    PACKAGE_SCHEMA,
    LabelSheetPackageError,
    recordsToCsv,
    buildProjectPackage,
    readStoredZip,
    parseProjectPackage,
  });
})(typeof window !== "undefined" ? window : globalThis);
