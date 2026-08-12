// PromptDeck 공용 CSV/TSV/붙여넣기 파서
// 라벨·티켓, QR 일괄 생성과 이후 데이터 기반 탭이 같은 행 구조를 공유하도록 합니다.
(function (root) {
  "use strict";

  function delimiterScore(text, delimiter) {
    let score = 0;
    let inQuotes = false;
    const limit = Math.min(String(text || "").length, 12000);
    for (let index = 0; index < limit; index += 1) {
      const character = text[index];
      if (character === '"') {
        if (inQuotes && text[index + 1] === '"') index += 1;
        else inQuotes = !inQuotes;
      } else if (!inQuotes && character === delimiter) score += 1;
    }
    return score;
  }

  function detectDelimiter(text) {
    const source = String(text || "");
    const candidates = ["\t", ",", ";"];
    const ranked = candidates.map((delimiter) => ({ delimiter, score: delimiterScore(source, delimiter) }))
      .sort((left, right) => right.score - left.score);
    return ranked[0].score > 0 ? ranked[0].delimiter : "\n";
  }

  function parseRows(text, options = {}) {
    const source = String(text ?? "").replace(/^\uFEFF/, "");
    const delimiter = options.delimiter && options.delimiter !== "auto" ? options.delimiter : detectDelimiter(source);
    if (delimiter === "\n") {
      return source.split(/\r?\n/).map((value) => [value.trim()]).filter((row) => row[0] !== "");
    }
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];
      if (inQuotes) {
        if (character === '"') {
          if (source[index + 1] === '"') {
            field += '"';
            index += 1;
          } else inQuotes = false;
        } else field += character;
      } else if (character === '"') {
        inQuotes = true;
      } else if (character === delimiter) {
        row.push(field);
        field = "";
      } else if (character === "\n" || character === "\r") {
        if (character === "\r" && source[index + 1] === "\n") index += 1;
        row.push(field);
        field = "";
        if (row.some((value) => value !== "")) rows.push(row);
        row = [];
      } else field += character;
    }
    if (field !== "" || row.length) {
      row.push(field);
      if (row.some((value) => value !== "")) rows.push(row);
    }
    return rows;
  }

  function uniqueHeaders(headers) {
    const used = new Map();
    return headers.map((header, index) => {
      const base = String(header ?? "").replace(/^\uFEFF/, "").trim() || `column_${index + 1}`;
      const count = (used.get(base) || 0) + 1;
      used.set(base, count);
      return count === 1 ? base : `${base}_${count}`;
    });
  }

  function parseTable(text, options = {}) {
    const delimiter = options.delimiter && options.delimiter !== "auto" ? options.delimiter : detectDelimiter(text);
    const rows = parseRows(text, { delimiter });
    if (!rows.length) return { delimiter, headers: [], rows: [], objects: [], errors: [{ code: "NO_ROWS", message: "가져올 데이터 행이 없습니다." }], warnings: [] };
    const headerMode = options.header || "present";
    const hasHeader = headerMode === "absent" ? false : headerMode === "present" ? true : rows.length > 1;
    const width = Math.max(...rows.map((row) => row.length));
    const headers = hasHeader ? uniqueHeaders(rows[0]) : Array.from({ length: width }, (_item, index) => `column_${index + 1}`);
    const dataRows = hasHeader ? rows.slice(1) : rows;
    const warnings = [];
    const objects = dataRows.map((row, rowIndex) => {
      if (row.length !== headers.length) warnings.push({ code: "COLUMN_COUNT", message: `${rowIndex + 1}행의 열 수가 헤더와 다릅니다.`, rowIndex, expected: headers.length, actual: row.length });
      return Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]));
    });
    return { delimiter, hasHeader, headers, rows: dataRows, objects, errors: [], warnings };
  }

  function parseLabelTable(text, options = {}) {
    const engine = root.PromptDeckLabelSheetEngine;
    return typeof engine?.parseTable === "function" ? engine.parseTable(text, options) : parseTable(text, options);
  }

  async function readFile(file, options = {}) {
    if (!file || typeof file.text !== "function") throw new Error("읽을 표 파일을 선택해 주세요.");
    const text = await file.text();
    const parsed = options.labelRecords ? parseLabelTable(text, options) : parseTable(text, options);
    return { ...parsed, text, filename: file.name || "", size: Number(file.size) || 0 };
  }

  root.PromptDeckTabularData = Object.freeze({
    detectDelimiter,
    parseRows,
    parseTable,
    parseLabelTable,
    readFile,
  });
})(typeof window !== "undefined" ? window : globalThis);
