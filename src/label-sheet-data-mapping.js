// PromptDeck label/ticket tabular column mapping helpers.
// Keeps import matching deterministic so preview, PNG, PDF and prompts share the same records.
(function (root) {
  "use strict";

  const VERSION = "1.1.0";
  const NONE = "";
  const FIELD_DEFINITIONS = root.PromptDeckLabelSheetEngine.RECORD_FIELDS;

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
    });
    if ([field.target, field.key, field.label].some((alias) => normalized === token(alias))) score = Math.max(score, 1200);
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
      const current = mapping[field.key];
      if (current && headers.includes(current)) claimed.add(current);
    });
    FIELD_DEFINITIONS.forEach((field) => {
      const current = mapping[field.key];
      if (current && headers.includes(current)) {
        return;
      }
      mapping[field.key] = "";
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

  function applyRecord(recordInput, mappingInput, index = 0, options = {}) {
    const source = recordInput && typeof recordInput === "object" ? recordInput : { value: recordInput };
    // Keep source columns separate: unmapping must not revive an old canonical value.
    const record = { data: { ...(source.data || {}) } };
    for (const side of ["front", "back"]) {
      if (source[side] && typeof source[side] === "object") record[side] = { ...source[side] };
    }
    Object.entries(source).forEach(([key, value]) => {
      if (["front", "back", "data"].includes(key)) return;
      if (!root.PromptDeckLabelSheetEngine.fieldForHeader(key)) {
        const dataKey = key.startsWith("data.") ? key.slice(5) : key;
        if (!["__proto__", "constructor", "prototype"].includes(dataKey)) {
          record.data[dataKey] = value;
          if (!key.startsWith("data.")) record[key] = value;
        }
      }
    });
    const mapping = normalizeMapping(mappingInput);
    FIELD_DEFINITIONS.forEach((field) => {
      const sourceHeader = mapping[field.key];
      const mapped = sourceHeader && own(source, sourceHeader);
      const [scope, property] = field.key.split(".");
      const nested = property && own(source[scope], property);
      if (options.partial && !mapped && !nested) return;
      record[field.target] = mapped ? source[sourceHeader] ?? "" : nested ? source[scope][property] ?? "" : "";
    });
    if (!options.partial && !clean(record.label_id)) record.label_id = `label-${Math.max(0, Number(index) || 0) + 1}`;
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
      text: matched.length ? matched.map((item) => `${mapping[item.key]}→${item.label}`).join(" · ") : "연결된 열 없음",
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
