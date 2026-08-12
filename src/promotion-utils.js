// 홍보용 이미지 생성 탭 — 순수 유틸리티 함수
// DOM·state 미접근 함수만 포함. promotion.js 와 promotion-data.js 보다 먼저 로드.

window.PROMO_UTILS = (function () {
  const { QUICK_BTNS } = window.PROMO_DATA;
  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isEnabled(value) {
    return String(value) === "true";
  }

  function trimValue(value) {
    return String(value || "").trim();
  }

  function uniqueValues(items) {
    const seen = new Set();
    return items.filter((item) => {
      const normalized = trimValue(item).toLowerCase();
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }

  function splitKeywordValues(value) {
    return uniqueValues(
      String(value || "")
        .split(/[\n,\/]/)
        .map((item) => item.trim())
        .filter(Boolean)
    );
  }

  function splitKeywordValuesRaw(value) {
    return String(value || "")
      .split(/[\n,\/]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function splitSentenceLines(value) {
    return uniqueValues(
      String(value || "")
        .split(/\r?\n+/)
        .map((item) => item.trim())
        .filter(Boolean)
    );
  }

  function splitForbiddenValues(value) {
    return uniqueValues(
      String(value || "")
        .split(/\r?\n+/)
        .flatMap((line) => {
          const trimmed = line.trim();
          if (!trimmed) return [];
          if (/^(컨셉별|컨셉|Concept|Avoid|Quality|홍보용 이미지 제작 입력값|AI 자동생성)/i.test(trimmed)) {
            return [trimmed];
          }
          return trimmed.split(/[,/]+/).map((item) => item.trim()).filter(Boolean);
        })
    );
  }
  const CONCEPT_INJECTION_PATTERNS = [
    /^컨셉 제안 적용:/,
    /^컨셉 소스 스타일:/,
    /^Visual DNA:/i,
    /^질감\/렌더링:/,
    /^조명\/무드:/,
    /^형태 언어:/,
    /^컨셉 기반 홍보 적응:/,
    /^컨셉 기반 오브젝트\/은유:/,
    /^컨셉 색상 전략:/,
    /^컨셉 조명\/무드:/,
    /^컨셉 레이아웃:/,
    /^컨셉 타이포그래피:/,
    /^컨셉 품질 규칙:/,
    /^컨셉별 회피:/,
    /^.+\s스타일 배경\s*\(전체 색상 팔레트:/,
    /^헤드라인과 CTA가 놓이는 영역은 컨셉 질감을/,
    /^컨셉 제안의 색감·질감·조명·형태 언어를/,
    /^홍보용 이미지 제작 입력값\(목적, 타깃, 헤드라인, 본문 포인트\)을 선택한 컨셉/,
    /^AI 자동생성 문구나 은유가 컨셉 스타일을/,
  ];
  function normalizeConceptStripValue(value) {
    return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function conceptStripValuesFromStyle(style) {
    if (!style) return [];
    const palette = Array.isArray(style.palette) ? style.palette.join(", ") : String(style.palette || "");
    return [
      style.prompt,
      style.sourcePrompt,
      style.desc,
      style.nameKo,
      style.nameEn,
      [style.nameKo, style.nameEn].filter(Boolean).join(" / "),
      palette,
    ].map(normalizeConceptStripValue).filter(Boolean);
  }
  function isConceptInjectedLine(line, stripValues = []) {
    const raw = String(line || "").trim();
    const normalized = normalizeConceptStripValue(raw);
    if (!normalized) return false;
    if (CONCEPT_INJECTION_PATTERNS.some((pattern) => pattern.test(raw))) return true;
    if (/color palette:/i.test(raw) && stripValues.some((value) => value.length > 24 && (normalized.includes(value) || value.includes(normalized)))) {
      return true;
    }
    return stripValues.some((value) => {
      if (value.length < 8) return false;
      return normalized === value || normalized.includes(value);
    });
  }

  function stripConceptInjectedLines(value, stripValues = []) {
    const normalizedStripValues = stripValues.map(normalizeConceptStripValue).filter(Boolean);
    return normalizeLines(value)
      .filter((line) => !isConceptInjectedLine(line, normalizedStripValues))
      .join("\n");
  }

  function normalizePromptLineForDedupe(value) {
    return String(value || "")
      .replace(/^[-*]\s+/, "")
      .replace(/^\d+\.\s+/, "")
      .trim()
      .toLowerCase();
  }

  function normalizeQuickToken(value) {
    return trimValue(value).replace(/\s+/g, " ").toLowerCase();
  }

  function isQuickButtonMultiline(targetInput, currentValue = "", nextValue = "") {
    return (
      targetInput.tagName === "TEXTAREA" &&
      (String(currentValue || "").includes("\n") ||
        String(currentValue || "").includes("→") ||
        String(nextValue || "").includes("→"))
    );
  }
  function formatQuickButtonValues(values, targetInput, nextValue = "") {
    if (!values.length) return "";
    return isQuickButtonMultiline(targetInput, values.join("\n"), nextValue)
      ? values.join("\n")
      : values.join(", ");
  }

  function getFieldStateKeyFromInput(input) {
    if (!input) return "";
    if (input.dataset?.promoField) return input.dataset.promoField;
    const fallbackMap = {
      promotionBigIdea: "bigIdea",
      promotionVisualMetaphor: "visualMetaphor",
    };
    return fallbackMap[input.id] || "";
  }
  function pickRandomSubset(options, minCount = 1, maxCount = 1) {
    if (!options.length) return [];
    const shuffled = [...options];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    const safeMin = Math.max(1, Math.min(minCount, shuffled.length));
    const safeMax = Math.max(safeMin, Math.min(maxCount, shuffled.length));
    const count = safeMin + Math.floor(Math.random() * (safeMax - safeMin + 1));
    return shuffled.slice(0, count);
  }

  function randomFieldSelectionCount(fieldId) {
    if (["promotionGoal", "promotionAudience"].includes(fieldId)) {
      return { min: 1, max: 1 };
    }
    if (fieldId === "promotionVisualStyle") {
      return { min: 1, max: 2 };
    }
    if (["promotionPosterKeyVisual", "promotionPosterInfoLayout", "promotionSnsVisualFocus"].includes(fieldId)) {
      return { min: 1, max: 2 };
    }
    if (fieldId === "promotionSnsPlacementNotes") {
      return { min: 2, max: 3 };
    }
    return { min: 2, max: 3 };
  }
  function normalizeBooleanSetting(value, fallback = "true") {
    if (String(value) === "true") return "true";
    if (String(value) === "false") return "false";
    return fallback;
  }

  function normalizeColorStrategy(value) {
    return value === "ai" ? "ai" : "manual";
  }
  function normalizeOutputLanguage(value) {
    return "en";
  }

  function normalizeHexColor(value) {
    const raw = String(value || "").trim();
    const match = raw.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
    if (!match) return "";
    const hex = match[1].toLowerCase();
    if (hex.length === 3) {
      return `#${hex.split("").map((char) => char + char).join("")}`;
    }
    return `#${hex}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeLines(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function normalizeImageTextLines(text) {
    return parseImageTextHierarchy(text).map((item) => item.text);
  }

  function parseImageTextHierarchy(text) {
    const rawLines = String(text || "").split(/\r?\n/);
    const parsed = rawLines
      .map((rawLine) => {
        if (!rawLine.trim()) return null;
        const leading = rawLine.match(/^[\t ]*/)?.[0] || "";
        const indentWidth = [...leading].reduce(
          (total, char) => total + (char === "\t" ? 2 : 1),
          0
        );
        const content = rawLine.slice(leading.length);
        const bulletMatch = content.match(/^[-‐‑‒–—*•·▪▫◦‣▸▶✓✔]+\s*/);
        const orderedMatch = content.match(/^\(?(\d+(?:[.-]\d+)*)\)?[.)]?\s+/);
        const markerType = orderedMatch ? "ordered" : (bulletMatch ? "bullet" : "none");
        const marker = orderedMatch?.[0] || bulletMatch?.[0] || "";
        const textValue = content.slice(marker.length).trim();
        if (!textValue) return null;
        const orderedDepth = orderedMatch
          ? orderedMatch[1].split(/[.-]/).filter(Boolean).length - 1
          : 0;
        return { indentWidth, markerType, orderedDepth, text: textValue };
      })
      .filter(Boolean);

    if (!parsed.length) return [];

    const indentLevels = [...new Set(parsed.map((item) => item.indentWidth))]
      .sort((a, b) => a - b);
    let previous = null;
    const inferredLevelByIndent = new Map();
    return parsed.map((item) => {
      const indentLevel = indentLevels.indexOf(item.indentWidth);
      let level = indentLevel;

      if (item.markerType === "ordered") {
        level = Math.max(indentLevel, item.orderedDepth);
      } else if (item.markerType === "bullet") {
        if (inferredLevelByIndent.has(item.indentWidth)) {
          level = inferredLevelByIndent.get(item.indentWidth);
        } else if (previous?.markerType === "none" && item.indentWidth === previous.indentWidth) {
          level = previous.level + 1;
        } else if (previous && item.indentWidth > previous.indentWidth) {
          level = previous.level + 1;
        } else if (previous?.markerType === "bullet" && item.indentWidth === previous.indentWidth) {
          level = previous.level;
        }
        inferredLevelByIndent.set(item.indentWidth, level);
      } else if (item.indentWidth === 0) {
        inferredLevelByIndent.clear();
      }

      const result = {
        text: item.text,
        level,
        markerType: item.markerType,
        indentWidth: item.indentWidth,
      };
      previous = result;
      return result;
    });
  }

  function formatImageTextHierarchy(text) {
    const counters = [];
    return parseImageTextHierarchy(text).map(({ text: lineText, level }) => {
      counters[level] = (counters[level] || 0) + 1;
      counters.length = level + 1;
      return {
        text: lineText,
        level,
        number: counters.join("."),
      };
    });
  }

  function mergeUniqueLines(...values) {
    const seen = new Set();
    return values
      .flatMap((value) => normalizeLines(value))
      .filter((line) => {
        const key = line.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .join("\n");
  }

  function summarizeDisplayTextPoint(line, maxLength = 18) {
    const cleaned = String(line || "")
      .replace(/^[-*•]\s*/, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!cleaned) return "";
    const colonParts = cleaned.split(/\s*[:：]\s*/);
    const candidate = colonParts.length > 1 && colonParts[0].length <= 10
      ? `${colonParts[0]}: ${colonParts.slice(1).join(": ").trim()}`
      : cleaned;
    if (candidate.length <= maxLength) return candidate;
    return `${candidate.slice(0, maxLength).replace(/[,\s·:：-]+$/g, "")}…`;
  }
  function normalizeForbiddenPromptToken(value) {
    return String(value || "")
      .replace(/^컨셉별\s*(회피|금지)[:：]\s*/i, "")
      .replace(/^컨셉\s*(사용 시 피할 점|회피|금지)[:：]\s*/i, "")
      .replace(/^Concept-specific\s*(avoid rules|avoid)[:：]\s*/i, "")
      .trim();
  }
  return {
    CONCEPT_INJECTION_PATTERNS,
    deepClone, isEnabled, trimValue, uniqueValues,
    splitKeywordValues, splitKeywordValuesRaw,
    splitSentenceLines, splitForbiddenValues,
    normalizeConceptStripValue, conceptStripValuesFromStyle,
    isConceptInjectedLine, stripConceptInjectedLines,
    normalizePromptLineForDedupe, normalizeQuickToken,
    isQuickButtonMultiline, formatQuickButtonValues,
    getFieldStateKeyFromInput,
    pickRandomSubset, randomFieldSelectionCount,
    normalizeBooleanSetting, normalizeColorStrategy,
    normalizeOutputLanguage, normalizeHexColor,
    escapeHtml, normalizeLines, normalizeImageTextLines,
    parseImageTextHierarchy, formatImageTextHierarchy, mergeUniqueLines,
    summarizeDisplayTextPoint, normalizeForbiddenPromptToken,
  };
})();
