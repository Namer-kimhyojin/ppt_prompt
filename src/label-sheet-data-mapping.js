// PromptDeck label/ticket tabular column mapping helpers.
// Keeps import matching deterministic so preview, PNG, PDF and prompts share the same records.
(function (root) {
  "use strict";

  const VERSION = "1.1.0";
  const NONE = "";
  const FIELD_DEFINITIONS = Object.freeze([
    { key: "id", label: "라벨 ID", target: "label_id", side: "common", aliases: ["label_id", "labelid", "id", "식별자", "고유번호", "관리번호"] },
    { key: "number", label: "연번", target: "number", side: "common", aliases: ["number", "번호", "순번", "연번", "일련번호", "티켓번호"] },
    { key: "data.name", label: "이름", target: "name", side: "common", aliases: ["name", "이름", "성명", "참석자", "대상자", "교육생", "담당자"] },
    { key: "data.category", label: "구분·소속", target: "category", side: "common", aliases: ["category", "구분", "소속", "기관", "기관명", "회사", "회사명", "과정", "과정명", "종류", "역할", "role", "좌석", "좌석번호"] },
    { key: "front.title", label: "앞면 제목", target: "front_title", side: "front", aliases: ["front_title", "앞면제목", "제목", "title", "품명", "항목명"] },
    { key: "front.subtitle", label: "앞면 부제", target: "front_subtitle", side: "front", aliases: ["front_subtitle", "앞면부제", "부제", "subtitle"] },
    { key: "front.body", label: "앞면 본문", target: "front_body", side: "front", aliases: ["front_body", "앞면본문", "본문", "내용", "body", "content"] },
    { key: "front.footer", label: "앞면 하단", target: "front_footer", side: "front", aliases: ["front_footer", "앞면하단문구", "하단문구", "footer", "비고", "note", "날짜", "date", "장소", "location", "유효기간"] },
    { key: "front.qrValue", label: "앞면 QR", target: "front_qr_value", side: "front", aliases: ["front_qr_value", "앞면qr값", "qr_value", "qr", "qrcode", "qr코드", "링크", "url", "주소"] },
    { key: "back.title", label: "뒷면 제목", target: "back_title", side: "back", aliases: ["back_title", "뒷면제목", "후면제목"] },
    { key: "back.subtitle", label: "뒷면 부제", target: "back_subtitle", side: "back", aliases: ["back_subtitle", "뒷면부제", "후면부제"] },
    { key: "back.body", label: "뒷면 본문", target: "back_body", side: "back", aliases: ["back_body", "뒷면본문", "후면본문", "뒷면내용", "이용안내", "주의사항"] },
    { key: "back.footer", label: "뒷면 하단", target: "back_footer", side: "back", aliases: ["back_footer", "뒷면하단문구", "후면하단문구", "문의처"] },
    { key: "back.qrValue", label: "뒷면 QR", target: "back_qr_value", side: "back", aliases: ["back_qr_value", "뒷면qr값", "후면qr값"] },
  ]);

  function clean(value) {
    return String(value ?? "").trim();
  }

  function token(value) {
    return clean(value)
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[\s._\-\/\\()[\]{}]+/g, "")
      .replace(/[^0-9a-z가-힣]/g, "");
  }

  function uniqueHeaders(input) {
    const seen = new Set();
    return Array.from(input || []).map(clean).filter((header) => {
      if (!header || seen.has(header)) return false;
      seen.add(header);
      return true;
    });
  }

  function definition(key) {
    return FIELD_DEFINITIONS.find((item) => item.key === key) || null;
  }

  function headerScore(header, field) {
    const normalized = token(header);
    if (!normalized) return 0;
    let score = 0;
    field.aliases.forEach((alias, index) => {
      const candidate = token(alias);
      if (!candidate) return;
      if (normalized === candidate) score = Math.max(score, 1000 - index);
      else if (normalized.includes(candidate) || candidate.includes(normalized)) score = Math.max(score, 450 - index);
    });
    if (normalized === token(field.target)) score = Math.max(score, 1200);
    return score;
  }

  function normalizeMapping(input = {}) {
    const source = input && typeof input === "object" ? input : {};
    const normalized = {};
    FIELD_DEFINITIONS.forEach((field) => {
      normalized[field.key] = clean(source[field.key]);
    });
    return normalized;
  }

  function suggest(headersInput, options = {}) {
    const headers = uniqueHeaders(headersInput);
    const mapping = normalizeMapping(options.current);
    const claimed = new Set();
    FIELD_DEFINITIONS.forEach((field) => {
      if (field.side === "back" && options.duplex === false) return;
      const current = mapping[field.key];
      if (current && headers.includes(current)) claimed.add(current);
    });
    FIELD_DEFINITIONS.forEach((field) => {
      if (field.side === "back" && options.duplex === false) return;
      const current = mapping[field.key];
      if (current && headers.includes(current)) {
        return;
      }
      let winner = "";
      let winnerScore = 0;
      headers.forEach((header) => {
        if (claimed.has(header)) return;
        const score = headerScore(header, field);
        if (score > winnerScore) {
          winner = header;
          winnerScore = score;
        }
      });
      if (winnerScore > 0) {
        mapping[field.key] = winner;
        claimed.add(winner);
      }
    });
    return mapping;
  }

  function own(object, key) {
    return Boolean(object) && Object.prototype.hasOwnProperty.call(object, key);
  }

  function applyRecord(recordInput, mappingInput, index = 0) {
    const record = recordInput && typeof recordInput === "object" ? { ...recordInput } : { value: recordInput };
    const mapping = normalizeMapping(mappingInput);
    FIELD_DEFINITIONS.forEach((field) => {
      const sourceHeader = mapping[field.key];
      if (!sourceHeader || !own(record, sourceHeader)) return;
      record[field.target] = record[sourceHeader] ?? "";
    });
    if (!clean(record.label_id || record.id || record.labelId)) record.label_id = `label-${Math.max(0, Number(index) || 0) + 1}`;
    return record;
  }

  function describe(mappingInput, headersInput) {
    const mapping = normalizeMapping(mappingInput);
    const headers = new Set(uniqueHeaders(headersInput));
    const matched = FIELD_DEFINITIONS.filter((field) => mapping[field.key] && headers.has(mapping[field.key]));
    return {
      count: matched.length,
      total: FIELD_DEFINITIONS.length,
      matched: matched.map((field) => ({ key: field.key, label: field.label, header: mapping[field.key], target: field.target })),
      text: matched.length ? matched.map((item) => `${item.header}→${item.label}`).join(" · ") : "연결된 열 없음",
    };
  }

  root.PromptDeckLabelSheetDataMapping = Object.freeze({
    VERSION,
    NONE,
    FIELD_DEFINITIONS,
    token,
    definition,
    normalizeMapping,
    suggest,
    applyRecord,
    describe,
  });
})(typeof window !== "undefined" ? window : globalThis);
