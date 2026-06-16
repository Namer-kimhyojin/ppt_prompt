// src/promotion-prompt-engine.js
// Loaded AFTER promotion-data.js, promotion-utils.js, promotion-i18n.js
// window.PROMO_PROMPT.init(state, helpers) must be called by promotion.js init()

window.PROMO_PROMPT = (function () {
  const {
    COMMERCIAL_BASELINE_PROFILES,
    CREATIVITY_LEVEL_PROFILES,
    CONTENT_PROMOTION_STRATEGIES,
    CREATIVE_DIVERSITY_PROFILES,
    LAYOUT_COMPOSITION_PROFILES,
    ATTENTION_FLOW_VARIANTS,
    AI_LAYOUT_STRATEGY_OPTIONS,
    AI_VISUAL_METAPHOR_EXAMPLES,
    INFORMATION_ITEM_LAYOUT_VARIANTS,
    QR_PLACEMENT_VARIANTS,
    MANDATORY_ELEMENT_PLACEMENT_VARIANTS,
    DEFAULT_STATE,
    ASSET_LABELS,
    ASSET_PROMPT_TARGET_EN,
    CONTENT_TYPE_TEMPLATES,
    CONTENT_TYPE_TEMPLATES_EN,
    KIND_META,
    STATIC_FIELD_KINDS,
    FIELD_LABELS,
    FIELD_LABELS_EN,
    STEP5_QUALITY_OPTIONS,
    STEP3_VISUAL_OPTION_GROUPS,
    ANTI_AI_PRESETS,
    VARIATION_SEEDS,
  } = window.PROMO_DATA;

  const {
    trimValue,
    isEnabled,
    uniqueValues,
    splitSentenceLines,
    splitKeywordValues,
    splitForbiddenValues,
    normalizeLines,
    normalizeForbiddenPromptToken,
    isConceptInjectedLine,
    stripConceptInjectedLines,
    normalizeConceptStripValue,
    conceptStripValuesFromStyle,
    normalizePromptLineForDedupe,
  } = window.PROMO_UTILS;

  const { translateFragment, splitQualityNoteLines } = window.PROMO_I18N;

  // State reference — bound by init(), points to promotion.js's `state` object
  let _s = {};
  // Helpers — functions defined in promotion.js that read state
  let _h = {};

  function _init(stateRef, helpers) {
    _s = stateRef;
    _h = helpers;
  }

  // ── CROSS PLATFORM & UNIVERSAL PORTABILITY HELPERS ──
  const COLOR_NAME_MAP = {
    "#ffffff": "pure white",
    "#000000": "true black",
    "#0d0d0d": "near-black charcoal",
    "#1a1a2e": "deep midnight navy",
    "#16213e": "dark indigo navy",
    "#7c4dff": "electric violet",
    "#e94560": "crimson red",
    "#ffd700": "bright gold yellow",
    "#f9d4ff": "soft lavender pastel",
    "#b8d4ff": "sky-blue pastel",
    "#ffe8b8": "warm cream highlights",
    "#c8ffb8": "mint green pastel",
    "#ffd6f9": "blush pink pastel",
    "#ff9de2": "hot pink",
    "#ffb3c6": "rose pink",
    "#ffd6ff": "soft lavender",
    "#caffbf": "pale mint green",
    "#fdffb6": "lemon yellow",
    "#6c63ff": "indigo violet",
    "#3f3d56": "dark charcoal",
    "#f2f2f2": "light gray",
    "#ff6584": "coral pink",
    "#43d9ad": "teal green",
    "#2193b0": "deep cyan blue",
    "#6dd5ed": "sky blue",
    "#ee0979": "vivid magenta",
    "#ff6a00": "vivid orange",
    "#44f7c2": "turquoise",
    "#ff9a9e": "salmon pink",
    "#fad0c4": "peach pink",
    "#a18cd1": "soft purple",
    "#fbc2eb": "blush pink",
    "#ffecd2": "cream white",
    "#11998e": "deep teal",
    "#38ef7d": "lime green",
    "#fc4a1a": "fiery orange-red",
    "#f7b733": "amber yellow",
    "#0099f7": "electric blue",
    "#ff00ff": "electric magenta",
    "#00ffff": "luminous cyan",
    "#ff6600": "warning orange",
    "#ff0055": "crimson alert",
    "#a8e6cf": "pale mint",
    "#dcedc1": "sage green",
    "#ffd3b6": "warm peach",
    "#ffaaa5": "coral orange",
    "#d4a5e5": "soft lilac",
    "#ff6b6b": "coral red",
    "#ffd93d": "bright yellow",
    "#6bcb77": "fresh green",
    "#4d96ff": "sky blue",
    "#ff922b": "warm orange",
    "#2d4a22": "deep forest green",
    "#8b4513": "saddle brown",
    "#daa520": "golden amber",
    "#1a1a5e": "dark navy",
    "#8b0000": "deep crimson",
    "#ff595e": "vivid red",
    "#ffca3a": "amber yellow",
    "#6a4c93": "deep purple",
    "#1982c4": "royal blue",
    "#8ac926": "lime green",
    "#e63946": "vibrant tomato red",
    "#457b9d": "steel blue",
    "#f1faee": "off-white",
    "#a8dadc": "powder blue",
    "#ffd6a5": "warm peach",
    "#264653": "dark slate blue",
    "#2a9d8f": "emerald teal",
    "#e9c46a": "golden yellow",
    "#f4a261": "sandy orange",
    "#e76f51": "burnt terracotta",
    "#c9a84c": "metallic gold",
    "#f5f0e8": "warm ivory",
    "#7d7d7d": "medium gray",
  };

  function formatColorForUniversal(hexColor) {
    const hex = String(hexColor || "").trim().toLowerCase();
    if (!hex) return "";
    const cleanHex = hex.startsWith("#") ? hex : `#${hex}`;
    const mapped = COLOR_NAME_MAP[cleanHex];
    if (_s.targetEngine === "imagen") {
      return mapped ? mapped : "custom color tone";
    }
    if (mapped) return `${cleanHex} (${mapped})`;
    if (/^#[0-9a-f]{3,6}$/i.test(cleanHex)) {
      return `${cleanHex} (custom color tone)`;
    }
    return hex;
  }

  function sanitizePromptForUniversal(promptText) {
    let cleaned = promptText;

    // 1. HEX 코드를 찾아서 괄호 병기 형태로 일괄 정규식 치환 (단, 이미 병기되어 있지 않은 경우에만)
    cleaned = cleaned.replace(/#([0-9a-fA-F]{3,6})(?!\s*\()/gi, (match) => {
      return formatColorForUniversal(match);
    });

    // 2. 무의미한 품질 키워드 제거
    cleaned = cleaned.replace(/(,\s*)?(4[kK]|ultra-detailed|hyper-detailed|hyperrealistic|photorealistic|high quality|extremely detailed)/g, "");
    cleaned = cleaned.replace(/^,\s*/, "");

    // 3. 부정문 지시어 우회 보정
    cleaned = cleaned.replace(/\bno\s+(blurry|blur|low-quality|cluttered|distorted|noisy)\b/gi, "clean and crystal clear focused");
    cleaned = cleaned.replace(/\bavoid\s+(text|texts|font|fonts|typography|letters)\b/gi, "maintain visual composition with zero text clutter");
    cleaned = cleaned.replace(/\bno\s+(text|texts|font|fonts|typography|letters)\b/gi, "zero text clutter");
    cleaned = cleaned.replace(/\b(without|exclude)\s+(text|texts|font|fonts|typography|letters)\b/gi, "clean zero text layout");

    return cleaned.trim();
  }

  function replaceHexCodesWithNames(text) {
    if (!text) return "";
    return text.replace(/#[0-9a-fA-F]{6}/g, (hex) => {
      const h = hex.toLowerCase();
      return COLOR_NAME_MAP[h] || h || "custom color";
    });
  }

  function convertAvoidToPositive(avoidText) {
    if (!avoidText) return "";
    const clean = avoidText.toLowerCase().trim();
    const mappings = [
      { bad: "avoid cluttered HUD overload, unreadable tiny details, and mismatched fantasy props", good: "Keep the interface layout simple and clear, with highly legible key details, ensuring all design props align naturally with the campaign theme" },
      { bad: "avoid plastic-looking overgloss, distorted perspective, and fake terrain unless requested", good: "Use matte or realistically satin surfaces, keep the perspective standard and geometrically balanced, and ensure natural realistic environments" },
      { bad: "avoid sterile digital finish, excessive symmetry, and glossy stock-photo polish", good: "Incorporate organic hand-made textures, slight natural asymmetry, and warm soft-toned material feels" },
      { bad: "avoid generic clip-art, inconsistent line styles, and overcrowded decoration", good: "Focus on bespoke uniform drawing styles, consistent line weights, and clean balanced compositions" },
      { bad: "avoid random decoration, weak alignment, and low-contrast palette mixing", good: "Adhere to grid discipline, crisp structural alignments, and clean high-contrast color pairings" },
      { bad: "avoid fake-looking composites, warped products, and unreadable busy backgrounds", good: "Stage product structures with believable scale and perspective, leaving background layers clean and low-noise" },
      { bad: "avoid awkward anatomy, cheap styling, and fabric texture mismatch", good: "Depict realistic proportions, elegant premium styling, and authentic material fabrics" },
      { bad: "avoid impossible construction, broken perspective, and scale confusion", good: "Render stable realistic architecture, natural spatial perspective, and plausible proportional scales" },
      { bad: "avoid weak motion, impossible poses, and confusing team/color hierarchy", good: "Capture dynamic readable action moments, natural anatomy, and distinct team color coding" },
      { bad: "avoid fake logos, cluttered claims, and off-brand decorative noise", good: "Leave clean space for real logos, keep claims minimal and readable, and focus on brand-aligned visual hierarchy" },
      { bad: "avoid fake ecology, over-saturated greens, and inaccurate natural textures", good: "Depict authentic ecological scenes, natural balanced green tones, and realistic botanical textures" },
      { bad: "avoid unappetizing colors, warped food anatomy, and messy plating", good: "Use warm appetizing color tones, accurate food structures, and clean elegant plating" },
      { bad: "avoid costume clichés, inaccurate symbols, and disrespectful cultural mixing", good: "Respect cultural heritage details, use accurate traditional symbols, and maintain authentic cultural representation" },
      { bad: "avoid fake scientific labels, impossible instruments, and visual misinformation", good: "Use clear factual visual references, mathematically plausible scientific instruments, and clean layout labels" },
      { bad: "avoid misleading medical certainty, grotesque anatomy, and inaccurate scale cues", good: "Depict clean anatomical structures, clear biological scale cues, and professional scientific representation" },
      { bad: "avoid unsafe equipment depictions, fake meters, and chaotic glow effects", good: "Ensure safe and realistic industrial equipment styling, clean metrics, and controlled ambient glows" },
      { bad: "avoid unreadable fake ui, excessive neon, and meaningless data clutter", good: "Design highly legible functional UI panels, balanced clean glows, and scannable structured data layouts" },
      { bad: "avoid unsafe workplace setups, impossible machinery, and dirty visual clutter", good: "Keep scale believable, surfaces specific, and operational context clear" },
      { bad: "avoid black full-canvas background, avoid nightclub/neon darkness, avoid heavy gloomy shadows", good: "Maintain a clean bright layout with high text contrast, generous whitespace, and light neutral backgrounds" }
    ];

    for (const m of mappings) {
      if (clean.includes(m.bad.toLowerCase())) {
        return m.good;
      }
    }

    let processed = avoidText;
    processed = processed.replace(/avoid\s+losing\s+the\s+original\s+style\s+identity\s+from\s+the\s+source\s+concept\.?/gi, "Maintain the original style identity of the source concept.");
    processed = processed.replace(/avoid\s+([^,.;]+)/gi, (match, p1) => {
      return `maintain a clean design by ensuring there is no ${p1.trim()}`;
    });
    return processed;
  }

  function sanitizePromptForImagen(text) {
    if (!text) return "";
    
    // 1. HEX 코드 및 괄호 병기 등 일괄 정제
    let processedText = replaceHexCodesWithNames(text);

    // 2. 라인별 전처리 진행
    let lines = processedText.split(/\r?\n/);
    let keptLines = [];
    
    for (let line of lines) {
      let trimmed = line.trim();
      if (!trimmed) continue;
      
      // 대괄호 섹션 헤더 처리 (대괄호를 제거하거나 서술형 문장 성분으로 가공)
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        const header = trimmed.slice(1, -1);
        const parts = header.split(/\s*[\/|·]\s*/);
        const englishHeader = parts.find(p => !/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(p)) || header;
        keptLines.push(`Regarding ${englishHeader.trim()}:`);
        continue;
      }

      // '절대 금지', 'Strictly avoid'와 같은 부정 룰들 치환
      if (trimmed.startsWith("- 절대 금지:") || trimmed.startsWith("- Strictly avoid:")) {
        const token = trimmed.replace(/^-\s*(절대 금지|Strictly avoid):\s*/i, "");
        keptLines.push(`• Maintain a clean design without: ${convertAvoidToPositive(token)}`);
        continue;
      }
      
      // 'avoid ' 문장이 들어간 라인 치환
      if (trimmed.toLowerCase().includes("avoid ")) {
        keptLines.push(`• ${convertAvoidToPositive(trimmed.replace(/^-\s*/, ""))}`);
        continue;
      }

      // "이미지 내 모든 텍스트..." 같은 복잡한 기술 지시 제거
      if (/벡터급 선명도로|vector-quality sharpness|안티에일리어싱|anti-aliasing/i.test(trimmed)) {
        keptLines.push("• Ensure clean visual backdrop spaces for overlay text.");
        continue;
      }
      if (/실제 존재하는 기업|Do not invent or imitate real company/i.test(trimmed)) {
        keptLines.push("• Leave logo zones as empty neutral placeholders.");
        continue;
      }

      // 한글과 영어가 혼용된 라인인 경우, 한글 문구나 단어를 제거하는 일반 정제 규칙 적용 (따옴표 내 텍스트 보호)
      if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(trimmed)) {
        const quotes = [];
        let placeholderText = trimmed.replace(/"([^"]*)"/g, (match, p1) => {
          quotes.push(p1);
          return `__QUOTE_PLACEHOLDER_${quotes.length - 1}__`;
        });

        if (/ko:\s*(.*?)\s*[\/|·]?\s*en:\s*(.*)/i.test(placeholderText)) {
          const match = placeholderText.match(/en:\s*(.*)/i);
          if (match) {
            placeholderText = "• " + match[1].trim();
          }
        } else {
          const parts = placeholderText.split(/\s*[\/|·|—|-]\s*/);
          const englishParts = parts.filter(p => !/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(p));
          if (englishParts.length > 0) {
            placeholderText = englishParts.join(" ").trim();
          } else {
            if (quotes.length === 0) continue;
            placeholderText = "";
          }
        }

        trimmed = placeholderText.replace(/__QUOTE_PLACEHOLDER_(\d+)__/g, (match, p1) => {
          return `"${quotes[parseInt(p1, 10)]}"`;
        });
      }

      // 정제된 결과물이 비었거나 순수 한글 잔여물이 있다면 스킵
      trimmed = trimmed.replace(/^[-•]\s*/, "").trim();
      if (!trimmed || (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(trimmed) && !/"[^"]*[ㄱ-ㅎ|ㅏ-ㅣ|가-힣][^"]*"/.test(trimmed))) {
        continue;
      }

      keptLines.push("• " + trimmed);
    }
    
    let joined = keptLines.join("\n");
    return joined;
  }

  // ── EXTRACTED ENGINE FUNCTIONS (all state.X -> _s.X, helpers -> _h.fn()) ──

function prunePromptLines(lines) {
  const base = lines
    .map((line) => trimValue(line))
    .filter(Boolean)
    .filter((line) => !(isEnabled(_s.omitEmptyFields) && /미입력|\?:\?|직접 크기 미입력/.test(line)));

  if (!isEnabled(_s.dedupePromptLines)) {
    return base;
  }

  const seen = new Set();
  return base.filter((line) => {
    const normalized = line.toLowerCase();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

const FINAL_PROMPT_CONFLICT_RULES = [
  {
    id: "ai-color-vs-manual",
    test: () => _h.isAiColorStrategy(),
    patterns: [/^메인 색상:/, /^보조 색상:/, /^포인트 색상:/, /^배경 색상:/, /^Primary color:/, /^Secondary color:/, /^Accent color:/, /^Background color:/],
  },
  {
    id: "manual-color-vs-ai",
    test: () => !_h.isAiColorStrategy(),
    patterns: [/AI에게 맡기기/, /Let AI direct both the color palette and the background/],
  },
  {
    id: "concept-style-vs-ai-style",
    test: () => _h.isBasicVisualPlanningMode() && _h.hasBasicConceptPromptInput(),
    patterns: [/^\[AI 자동 생성\] 비주얼 스타일:/, /^\[AI auto-generate\] visual style:/],
  },
  {
    id: "qr-none-vs-qr",
    test: () => !isEnabled(_s.qrEnabled),
    patterns: [/QR/i, /QR코드/, /큐알/i],
  },
  {
    id: "hashtags-forbidden",
    test: () => /해시태그 제외|해시태그 본문 노출 금지|no hashtags|exclude hashtags/i.test(_s.forbiddenElements),
    patterns: [/해시태그\/태그:/, /hashtags\/tags:/],
  },
];

function isFinalPromptConflictLine(line) {
  if (!isEnabled(_s.autoResolveConflicts)) return false;
  return FINAL_PROMPT_CONFLICT_RULES.some((rule) =>
    rule.test() && rule.patterns.some((pattern) => pattern.test(line))
  );
}

function finalLinePriority(line) {
  if (/원문 그대로|verbatim|do not translate|철자|숫자|text fidelity|텍스트 정확성/i.test(line)) return 10;
  if (/컨셉-홍보 브리지|Concept-to-campaign bridge|적용된 컨셉|Applied concept|컨셉 Visual DNA|Concept visual DNA/i.test(line)) return 9;
  if (/광고 목적|promotion goal|타깃|target audience|헤드라인|headline/i.test(line)) return 8;
  if (/절대 금지|Strictly avoid|금지|avoid/i.test(line)) return 7;
  if (/품질|quality|가독성|readability/i.test(line)) return 6;
  return 1;
}

function normalizeFinalPromptLine(line) {
  return String(line || "")
    .replace(/^[-*]\s*/, "")
    .replace(/\s+/g, " ")
    .replace(/\s*\/\s*/g, " / ")
    .trim()
    .toLowerCase();
}

function normalizeFinalPromptConceptFamily(line) {
  const raw = String(line || "").trim();
  const lower = raw.toLowerCase();
  const value = raw.replace(/^[-*]\s*/, "").replace(/^[^:]+:\s*/, "").trim().toLowerCase();
  if (/^(컨셉 기반 홍보 적응|컨셉 홍보 적응|항목 반영 - 홍보 적응|concept campaign adaptation|field mapping - campaign adaptation)/i.test(raw)) {
    return `concept-campaign:${value}`;
  }
  if (/^(컨셉 기반 오브젝트\/은유|컨셉 오브젝트 적응|항목 반영 - 오브젝트\/은유|concept object adaptation|field mapping - object\/metaphor)/i.test(raw)) {
    return `concept-object:${value}`;
  }
  if (/^(컨셉 타이포|컨셉 타이포 지침|항목 반영 - 타이포그래피|concept typography)/i.test(raw)) {
    return `concept-typography:${value}`;
  }
  return lower;
}

function finalizePromptLines(lines) {
  const kept = [];
  const seen = new Map();
  lines.forEach((line) => {
    const trimmed = trimValue(line);
    if (!trimmed || isFinalPromptConflictLine(trimmed)) return;
    const key = normalizeFinalPromptLine(trimmed);
    const familyKey = normalizeFinalPromptConceptFamily(trimmed);
    const existingIndex = seen.get(key) ?? seen.get(familyKey);
    if (existingIndex === undefined) {
      seen.set(key, kept.length);
      seen.set(familyKey, kept.length);
      kept.push(trimmed);
      return;
    }
    if (finalLinePriority(trimmed) > finalLinePriority(kept[existingIndex])) {
      kept[existingIndex] = trimmed;
    }
  });
  return kept;
}

function resolveConflictLines(lines, lint) {
  if (!isEnabled(_s.autoResolveConflicts) || (!lint.conflicts.length && !lint.duplicates.length)) {
    return lines;
  }

  return lines.filter((line) => {
    if (/광택|glossy/i.test(_s.qualityNotes) && /플랫 디자인/.test(_s.visualStyle) && /광택|glossy/i.test(line)) {
      return false;
    }
    if (/해시태그 제외|해시태그 본문 노출 금지/.test(_s.forbiddenElements) && /해시태그\/태그/.test(line)) {
      return false;
    }
    return true;
  });
}

function getLocalizedProfileLines(profile) {
  if (!profile) return [];
  if (_s.outputLanguage === "en") return [...(profile.linesEn || [])];
  if (_s.outputLanguage === "bilingual") {
    return (profile.linesKo || []).map((item, index) => `${item} / ${profile.linesEn?.[index] || item}`);
  }
  return [...(profile.linesKo || [])];
}

function stringifyConceptPart(value) {
  if (Array.isArray(value)) {
    return value.map((item) => stringifyConceptPart(item)).filter(Boolean).join("\n");
  }
  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => {
        const text = stringifyConceptPart(item);
        return text ? `${key}: ${text}` : "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return trimValue(value);
}

function conceptPromptPartsFromStyle(style) {
  const structuredCandidate = style?.promptParts || style?.structuredPrompt || style?.promotionPrompt || {};
  const structured = structuredCandidate && typeof structuredCandidate === "object" ? structuredCandidate : {};
  const palette = Array.isArray(style?.palette) ? style.palette.join(", ") : stringifyConceptPart(style?.palette);
  const prompt = stringifyConceptPart(style?.prompt);
  const desc = stringifyConceptPart(style?.desc);
  const tags = Array.isArray(style?.tags) ? style.tags.join(", ") : stringifyConceptPart(style?.tags);
  const category = stringifyConceptPart(style?.category);
  const name = [style?.nameKo, style?.nameEn].filter(Boolean).join(" / ");
  const styleDNA = [name, category, tags].filter(Boolean).join(" / ");
  const sourceText = [name, desc, prompt, tags].filter(Boolean).join("\n");

  const categoryProfiles = {
    game: {
      campaignAdaptation: "게임적 재미는 장식이 아니라 참여 행동을 쉽게 이해시키는 친근한 안내 장치로 번역한다.",
      objectAdaptation: "캐릭터나 게임 요소가 있다면 홍보 주제의 행동을 돕는 마스코트, 미션 배지, 단계형 참여 장면으로 바꾼다.",
      typographyGuidance: "귀여운 장식보다 헤드라인 판독성을 우선하고, 정보는 미션 카드/배지처럼 짧게 묶는다.",
      avoid: "유치한 게임 화면, 과도한 캐릭터 표정, 메시지와 무관한 판타지 오브젝트",
    },
    "3d": {
      campaignAdaptation: "입체감은 홍보 메시지의 구조와 행동 경로를 설명하는 키비주얼 오브젝트로 사용한다.",
      objectAdaptation: "홍보 목적을 상징하는 단일 3D 오브젝트, 아이소메트릭 장면, 깊이감 있는 정보 노드로 변환한다.",
      typographyGuidance: "3D 오브젝트와 텍스트 영역을 분리하고, 헤드라인 주변은 낮은 노이즈의 평면으로 확보한다.",
      avoid: "장난감 같은 과장된 3D, 의미 없는 홀로그램, 텍스트를 가리는 입체 장식",
    },
    modern: {
      campaignAdaptation: "모던 그래픽 언어를 메시지 압축, 정보 위계, 강한 CTA 흐름으로 번역한다.",
      objectAdaptation: "오브젝트보다 타이포그래피, 그리드, 색면, 기하학적 프레임을 중심으로 설계한다.",
      typographyGuidance: "헤드라인 스케일 대비와 여백을 컨셉의 핵심 표현으로 사용한다.",
      avoid: "의미 없는 장식 도형 과밀, 템플릿형 카드 반복, 낮은 대비",
    },
    photo: {
      campaignAdaptation: "사진적 사실감은 홍보 메시지를 실제 상황처럼 믿게 만드는 장면 설계에 사용한다.",
      objectAdaptation: "타깃이 공감할 수 있는 실제 행동, 제품, 장소, 손동작, 현장 분위기로 변환한다.",
      typographyGuidance: "사진 배경 위 텍스트 영역에는 오버레이 또는 깨끗한 여백을 확보한다.",
      avoid: "저해상도 스톡 사진 느낌, 어두운 인물, 텍스트와 배경의 낮은 대비",
    },
    nature: {
      campaignAdaptation: "자연 모티프를 성장, 회복, 순환, 지속가능성, 참여 확산의 은유로 번역한다.",
      objectAdaptation: "잎, 물결, 숲, 빛, 순환 루프 같은 자연 상징을 홍보 행동과 연결한다.",
      typographyGuidance: "자연 질감은 배경과 프레임에 두고 텍스트 영역은 깨끗하게 유지한다.",
      avoid: "복잡한 풍경 사진, 텍스트를 가리는 식물 질감, 주제와 무관한 장식 자연물",
    },
    brand: {
      campaignAdaptation: "브랜드형 컨셉은 신뢰도, 일관된 색상 시스템, 고급 광고 키비주얼 완성도로 번역한다.",
      objectAdaptation: "브랜드명, 로고 자리, CTA, 제품/서비스 상징이 정돈된 광고 레이아웃으로 결합되게 한다.",
      typographyGuidance: "브랜드 헤드라인과 CTA의 대비, 정렬축, 여백을 일관되게 유지한다.",
      avoid: "가짜 로고 생성, 과장된 브랜드 마크, 촌스러운 원색 효과",
    },
    arch: {
      campaignAdaptation: "공간감과 구조미를 홍보 메시지의 안정감, 신뢰감, 참여 동선으로 번역한다.",
      objectAdaptation: "건축·인테리어 요소는 실제 장소 홍보가 아니라 정보가 놓이는 공간, 안내 사인, 책상 위 참여 장면, 깨끗한 프레임으로 바꾼다.",
      typographyGuidance: "절제된 산세리프 계열 타이포와 정렬축을 사용하고, 헤드라인 주변에는 충분한 여백을 둔다.",
      avoid: "부동산·쇼룸 홍보처럼 보이는 공간 중심 이미지, 불가능한 구조, 깨진 원근, 스케일 혼란",
    },
    craft: {
      campaignAdaptation: "수공예 질감은 친근함, 정성, 참여의 온도를 높이는 배경 언어로 번역한다.",
      objectAdaptation: "홍보 주제를 종이 조각, 손작업 오브젝트, 라벨, 스티커, 작은 소품으로 재해석한다.",
      typographyGuidance: "손맛은 장식에만 쓰고 핵심 정보는 읽기 쉬운 정돈된 글자로 유지한다.",
      avoid: "과한 수작업 질감으로 인한 가독성 저하, 지나치게 유아적인 장식",
    },
    illustration: {
      campaignAdaptation: "일러스트 스타일은 메시지를 쉽게 이해시키는 상징 장면과 친근한 키비주얼로 번역한다.",
      objectAdaptation: "홍보 주제를 그려진 오브젝트, 인물 없는 상징 장면, 간단한 아이콘형 소품으로 변환한다.",
      typographyGuidance: "그림체와 어울리되 헤드라인은 선명한 타이포그래피로 분리한다.",
      avoid: "클립아트 느낌, 서로 다른 선화 스타일 혼합, 장식 과밀",
    },
    fashion: {
      campaignAdaptation: "패션 에디토리얼 감성은 프리미엄한 여백, 세련된 크롭, 정제된 무드로 번역한다.",
      objectAdaptation: "의상 자체보다 소재감, 실루엣, 룩북식 배치, 고급 소품 언어를 홍보 주제에 맞게 차용한다.",
      typographyGuidance: "짧고 고급스러운 헤드라인 중심으로 구성하고 본문 정보는 작고 정돈된 레일로 둔다.",
      avoid: "홍보 목적과 무관한 모델 중심 이미지, 어색한 인체, 과한 런웨이 연출",
    },
    food: {
      campaignAdaptation: "음식 스타일은 혜택과 참여 동기를 따뜻하고 즉각적인 감각으로 번역한다.",
      objectAdaptation: "홍보 주제를 접시, 테이블, 패키지, 재료 배치 같은 친숙한 정보 오브젝트로 바꾼다.",
      typographyGuidance: "메뉴판처럼 가격·기간·혜택 정보를 짧고 읽기 쉽게 배열한다.",
      avoid: "식욕만 강조되어 홍보 목적이 사라지는 구성, 과한 광택, 지저분한 테이블",
    },
  };
  const categoryProfile = categoryProfiles[category] || {
    campaignAdaptation: "컨셉의 시각적 특징을 홍보 목적, 타깃, 헤드라인 의미에 맞는 키비주얼로 번역한다.",
    objectAdaptation: "주제와 맞지 않는 오브젝트는 제거하지 말고 같은 스타일 언어의 홍보 상징으로 치환한다.",
    typographyGuidance: "컨셉 장식보다 텍스트 정확성과 CTA 위계를 우선한다.",
    avoid: "컨셉만 보이고 홍보 목적이 사라지는 구성, 텍스트를 가리는 장식",
  };

  const text = sourceText.toLowerCase();
  const derived = {
    visualDNA: _s.outputLanguage === "ko"
      ? [styleDNA, desc].filter(Boolean).join(". ")
      : [desc, prompt].filter(Boolean).join("\n"),
    paletteStrategy: palette ? `컨셉 팔레트 전체를 유지하되, 강조색은 CTA와 핵심 정보에 제한적으로 사용한다.\n${palette}` : "",
    textureRendering: /watercolor|paper|collage|grain|texture|clay|glass|metal|oil|pencil|수채|종이|질감|클레이|유리|메탈|색연필/.test(text)
      ? "컨셉 원문에 포함된 재질감과 렌더링 방식을 배경, 키비주얼, 정보 묶음의 표면 처리에 반영한다."
      : "컨셉 원문의 렌더링 방식과 표면 질감을 과하지 않게 유지한다.",
    lightingMood: /light|glow|neon|cinematic|shadow|lighting|광원|조명|네온|빛|그림자/.test(text)
      ? "컨셉 원문의 조명 방향, 명암 대비, 광원 분위기를 유지하되 텍스트 영역은 고대비로 정리한다."
      : "컨셉의 무드에 맞는 조명을 사용하되 헤드라인과 정보 영역은 노이즈 없이 밝기 대비를 확보한다.",
    shapeLanguage: /round|rounded|geometric|line|isometric|pixel|bold|organic|curve|동그란|기하학|라인|곡선|픽셀/.test(text)
      ? "컨셉 원문에 있는 형태 언어를 키비주얼 오브젝트, 배지, 프레임, 정보 노드의 모양에 반복 적용한다."
      : "컨셉의 대표 형태를 키비주얼과 정보 묶음 형태에 반복 적용한다.",
    layoutBehavior: categoryProfile.campaignAdaptation,
    typographyGuidance: categoryProfile.typographyGuidance,
    campaignAdaptation: categoryProfile.campaignAdaptation,
    objectAdaptation: categoryProfile.objectAdaptation,
    avoid: categoryProfile.avoid,
    qualityRules: "선택 컨셉의 특징이 팔레트, 형태, 렌더링, 배경, 정보 묶음 중 최소 세 영역에 보이도록 한다.",
  };

  const pick = (...keys) => keys.map((key) => stringifyConceptPart(structured[key])).find(Boolean) || "";
  return {
    visualDNA: pick("visualDNA", "visualDna", "styleDNA", "styleDna") || derived.visualDNA,
    paletteStrategy: pick("paletteStrategy", "colorSystem", "colors") || derived.paletteStrategy,
    textureRendering: pick("textureRendering", "textureStyle", "renderingStyle", "rendering") || derived.textureRendering,
    lightingMood: pick("lightingMood", "lightingStyle", "mood") || derived.lightingMood,
    shapeLanguage: pick("shapeLanguage", "forms", "formLanguage") || derived.shapeLanguage,
    layoutBehavior: pick("layoutBehavior", "layoutUse", "compositionBehavior") || derived.layoutBehavior,
    typographyGuidance: pick("typographyGuidance", "textStrategy", "typography") || derived.typographyGuidance,
    campaignAdaptation: pick("campaignAdaptation", "campaignUse", "promotionBridge") || derived.campaignAdaptation,
    objectAdaptation: pick("objectAdaptation", "objectStrategy", "metaphorAdaptation") || derived.objectAdaptation,
    avoid: pick("avoid", "negativePrompt", "forbidden") || derived.avoid,
    qualityRules: pick("qualityRules", "quality", "executionRules") || derived.qualityRules,
  };
}

function applyConceptPartsToState(parts) {
  _s.appliedConceptVisualDNA = stringifyConceptPart(parts.visualDNA);
  _s.appliedConceptPaletteStrategy = stringifyConceptPart(parts.paletteStrategy);
  _s.appliedConceptTextureRendering = stringifyConceptPart(parts.textureRendering);
  _s.appliedConceptLightingMood = stringifyConceptPart(parts.lightingMood);
  _s.appliedConceptShapeLanguage = stringifyConceptPart(parts.shapeLanguage);
  _s.appliedConceptLayoutBehavior = stringifyConceptPart(parts.layoutBehavior);
  _s.appliedConceptTypographyGuidance = stringifyConceptPart(parts.typographyGuidance);
  _s.appliedConceptCampaignAdaptation = stringifyConceptPart(parts.campaignAdaptation);
  _s.appliedConceptObjectAdaptation = stringifyConceptPart(parts.objectAdaptation);
  _s.appliedConceptAvoid = stringifyConceptPart(parts.avoid);
  _s.appliedConceptQualityRules = stringifyConceptPart(parts.qualityRules);
}

function getContentConceptBridgeOverrides(parts) {
  if (!_s.contentType || _s.contentType === "none") return {};
  const isInteriorLike = /공간|인테리어|건축|home|interior|architecture|scandinavian|hygge/i.test(
    `${_s.appliedConceptName} ${_s.appliedConceptCategory} ${parts.visualDNA} ${parts.shapeLanguage}`
  );
  const softSpaceCue = isInteriorLike
    ? "선택 컨셉의 밝은 공간감, 따뜻한 표면, 정돈된 책상/홈오피스/거실 무드를 유지하되"
    : "선택 컨셉의 색감, 형태 언어, 렌더링 무드를 유지하되";
  const surveyObjectCue = isEnabled(_s.qrEnabled)
    ? "모바일 설문 카드, 체크리스트, 의견 카드, QR 자리, 작은 식물이나 소품을 메인 오브젝트로 묶어 참여 흐름을 보여준다."
    : "모바일 설문 카드, 체크리스트, 의견 카드, 작은 식물이나 소품을 메인 오브젝트로 묶어 참여 흐름을 보여준다.";
  const surveyLayoutCue = isEnabled(_s.qrEnabled)
    ? "헤드라인은 상단 또는 좌측 큰 타이포로 두고, 기간·대상·소요시간·QR 참여는 3~4개의 라운드 배지나 사이드 레일로 정리한다."
    : "헤드라인은 상단 또는 좌측 큰 타이포로 두고, 기간·대상·소요시간·참여 방법은 3~4개의 라운드 배지나 사이드 레일로 정리한다.";
  const eventLayoutCue = isEnabled(_s.qrEnabled)
    ? "행사명과 일시는 가장 큰 정보 축으로 두고 장소·신청방법·QR은 보조 정보 레일로 분리한다."
    : "행사명과 일시는 가장 큰 정보 축으로 두고 장소·신청방법·부가 혜택은 보조 정보 레일로 분리한다.";

  const profiles = {
    "survey-request": {
      campaignAdaptation: `${softSpaceCue}, 설문 참여를 부담 없는 3분 일상 행동처럼 느끼게 만드는 친근한 참여 장면으로 번역한다.`,
      objectAdaptation: surveyObjectCue,
      layoutBehavior: surveyLayoutCue,
      typographyGuidance: "정책/설문 문구는 딱딱한 공문서 느낌을 피하고, 짧고 부드러운 안내형 산세리프 타이포로 구성한다.",
      avoid: "부동산·쇼룸 홍보처럼 보이는 공간 중심 이미지, 설문 목적이 사라지는 인테리어 장식 과잉, 작은 본문 난립",
    },
    "event-info": {
      campaignAdaptation: `${softSpaceCue}, 행사 참여를 기대감 있는 일정 안내와 명확한 신청 행동으로 번역한다.`,
      objectAdaptation: "캘린더, 티켓, 입장 패스, 장소 핀, 신청 버튼을 컨셉 스타일의 메인 비주얼로 구성한다.",
      layoutBehavior: eventLayoutCue,
      typographyGuidance: "일시와 장소 숫자는 큰 크기와 고대비로 처리하고, CTA는 한눈에 보이는 버튼형으로 둔다.",
      avoid: "행사 정보보다 배경 장식이 먼저 보이는 구성, 일정/장소 누락, 과밀한 하단 정보 박스",
    },
    "training-info": {
      campaignAdaptation: `${softSpaceCue}, 교육 신청을 성장·기회·실무 역량 향상의 장면으로 번역한다.`,
      objectAdaptation: "노트북, 교재, 성장 계단, 체크 배지, 커리큘럼 카드 등을 컨셉 스타일로 재해석한다.",
      layoutBehavior: "과정명과 모집 마감일을 우선 배치하고, 기간·자격·혜택은 단계형 카드나 세로 레일로 정리한다.",
      typographyGuidance: "과정명은 명확하게, 혜택과 마감일은 배지형 강조로 처리한다.",
      avoid: "복잡한 커리큘럼 표, 어두운 학원 광고 느낌, 성장 메시지와 무관한 장식",
    },
    "biz-promo": {
      campaignAdaptation: `${softSpaceCue}, 지원사업 참여를 신뢰감 있는 기회 제안과 명확한 접수 행동으로 번역한다.`,
      objectAdaptation: "사업 안내 문서, 성장 그래프, 연결 노드, 지원 패키지, 신청 포털을 컨셉 스타일로 구성한다.",
      layoutBehavior: "사업명과 지원 내용을 가장 먼저 읽히게 하고, 대상·기간·방법은 정보 노드로 분리한다.",
      typographyGuidance: "전문적이고 신뢰감 있는 타이포를 사용하되 CTA는 선명한 색상 대비로 강조한다.",
      avoid: "스타트업 클리셰 아이콘 과다, 불명확한 지원 내용, 지나치게 딱딱한 관공서 문서 느낌",
    },
    campaign: {
      campaignAdaptation: `${softSpaceCue}, 캠페인 메시지를 직관적인 상징 행동과 참여 동기로 압축한다.`,
      objectAdaptation: "캠페인 슬로건을 뒷받침하는 하나의 상징 오브젝트와 짧은 참여 라벨을 중심으로 구성한다.",
      layoutBehavior: "슬로건·상징 오브젝트·CTA가 삼각 구도로 읽히게 하고 보조 정보는 최소화한다.",
      typographyGuidance: "슬로건은 가장 큰 타이포로, 참여 행동은 짧은 버튼형 문구로 처리한다.",
      avoid: "상징만 남고 행동 유도가 사라지는 이미지, 장식적 캠페인 포스터 과잉",
    },
  };

  return profiles[_s.contentType] || {};
}

function getAppliedConceptLines() {
  if (!_h.hasBasicConceptPromptInput()) return [];

  const toneCoordinationLine = (() => {
    if (!_s.appliedConceptStyle) return "";
    const hasLuxury = _s.commercialBaseline === "luxury" || _s.commercialBaseline === "premium";
    const isCasualConcept = /game|craft|illustration|pixel|doodle|comic|retro|clay|pop|flat|casual|art/i.test(_s.appliedConceptCategory || "") ||
                           /game|craft|illustration|pixel|doodle|comic|retro|clay|pop|flat|casual|art/i.test(_s.appliedConceptStyle || "");
    if (hasLuxury && isCasualConcept) {
      return _h.localizeSentence(
        "톤앤매너 완충 규칙: 상업 품질 기준의 명품 고급 지시어와 선택된 컨셉 스타일 자체의 고유 질감이 충돌할 경우, 컨셉 스타일 질감을 최우선 적용하고 상업 기준은 정갈하고 세련된 마감 완성도로만 해석하여 묘사한다.",
        "Tone Coordination: The Luxury or Premium commercial baseline directives must not inject unfitting textures that clash with the selected visual concept. Instead, express high-end luxury as an extremely polished visual finish and pristine layout order within the selected style's native texture. If a clash occurs, prioritize the concept's texture."
      );
    }
    return "";
  })();

  const name = trimValue(_s.appliedConceptName);
  const influenceLabel = _s.conceptInfluenceMode === "style-only"
    ? _h.localizeSentence("스타일만 적용", "style-only")
    : _s.conceptInfluenceMode === "balanced"
      ? _h.localizeSentence("균형 적용", "balanced")
      : _h.localizeSentence("강하게 적용", "strong");

  const styleContractLine = _s.conceptInfluenceMode === "style-only"
    ? _h.localizeSentence(
        "위 컨셉은 질감, 조명, 렌더링 방식, 형태 언어에 강하게 적용하고 오브젝트·업종 은유는 현재 홍보 목적에 맞게 새로 설계한다.",
        "Apply the concept strongly to texture, lighting, rendering method, and shape language; redesign objects and industry metaphors to fit the current promotion goal."
      )
    : _h.localizeSentence(
        "위 컨셉은 전체 이미지의 1순위 스타일 기준이다. 단, 특정 오브젝트가 홍보 목적과 충돌하면 같은 질감·조명·형태 언어 안에서 현재 메시지에 맞게 치환한다.",
        "The concept above is the primary style contract governing the whole image. If a specific object conflicts with the promotion goal, replace it within the same texture, lighting, and form language."
      );

  const executionLine = _s.conceptInfluenceMode === "balanced"
    ? _h.localizeSentence(
        "광고 메시지와 텍스트 가독성을 먼저 확보한 뒤, 배경·오브젝트·장식에 컨셉 스타일을 일관되게 반영한다.",
        "Secure advertising message clarity and text readability first, then consistently apply the concept style to the background, objects, and decoration."
      )
    : _h.localizeSentence(
        "헤드라인 영역을 제외한 배경, 키비주얼, 장식, 색면, 광원, 질감에서 컨셉의 특징이 즉시 식별될 만큼 분명하게 드러나야 한다.",
        "Outside the headline zone, the background, key visual, decoration, color fields, lighting, and texture must make the concept immediately recognizable."
      );

  // concept-suggest.js가 미리 만든 구조화 프롬프트가 있으면 그대로 사용
  const richPrompt = trimValue(_s.appliedConceptPromotionPrompt);
  if (richPrompt) {
    return prunePromptLines([
      styleContractLine,
      toneCoordinationLine,
      richPrompt,
    ]);
  }

  // fallback: 부분 state에서 재조립
  const prompt = trimValue(_s.appliedConceptStyle);
  const category = trimValue(_s.appliedConceptCategory);
  const visualDNA = _h.compactConceptSummary(_s.appliedConceptVisualDNA);
  const textureRendering = trimValue(_s.appliedConceptTextureRendering);
  const lightingMood = trimValue(_s.appliedConceptLightingMood);
  const shapeLanguage = trimValue(_s.appliedConceptShapeLanguage);
  const typographyGuidance = trimValue(_s.appliedConceptTypographyGuidance);
  const avoid = trimValue(_s.appliedConceptAvoid);
  const label = [name, category ? `${_h.localizeSentence("카테고리", "category")}: ${category}` : ""]
    .filter(Boolean)
    .join(" / ");

  return prunePromptLines([
    label ? `${_h.localizeSentence("적용된 컨셉", "Applied concept")}: ${label}` : "",
    `${_h.localizeSentence("컨셉 적용 강도", "Concept influence")}: ${influenceLabel}`,
    toneCoordinationLine,
    prompt ? `${_h.localizeSentence("소스 스타일 프롬프트", "Source style prompt")}: ${prompt}` : "",
    visualDNA ? `${_h.localizeSentence("컨셉 요약", "Concept summary")}: ${visualDNA}` : "",
    [textureRendering, lightingMood, shapeLanguage].filter(Boolean).length
      ? `${_h.localizeSentence("컨셉 실행 요소", "Concept execution traits")}: ${[textureRendering, lightingMood, shapeLanguage].filter(Boolean).join(" / ")}`
      : "",
    typographyGuidance ? `${_h.localizeSentence("컨셉 타이포", "Concept typography")}: ${typographyGuidance}` : "",
    avoid ? `${_h.localizeSentence("컨셉 회피", "Concept avoid")}: ${avoid}` : "",
    styleContractLine,
    executionLine,
  ]);
}

function getConceptBridgeLines() {
  if (!_h.hasBasicConceptPromptInput()) return [];

  const conceptName = trimValue(_s.appliedConceptName) || _h.localizeSentence("선택된 컨셉", "the selected concept");
  const goal = trimValue(_s.goal || CONTENT_TYPE_TEMPLATES[_s.contentType]?.goal || "");
  const audience = trimValue(_s.audience || CONTENT_TYPE_TEMPLATES[_s.contentType]?.audience || "");
  const headline = trimValue(_s.headline);
  const bodyPoints = normalizeLines(_s.bodyCopy).slice(0, 3).join(" / ");
  const hasRich = !!trimValue(_s.appliedConceptPromotionPrompt);

  if (hasRich) {
    // richPrompt가 스타일·색상·적응 규칙 전부 포함 — 캠페인 입력값 연결만 추가
    return prunePromptLines([
      headline ? _h.localizeSentence(
        `헤드라인 우선: '${headline}'이 컨셉 장식보다 먼저 읽히도록 하고, 컨셉 요소는 헤드라인의 의미를 강화하는 배경·오브젝트·프레임 역할을 한다.`,
        `Headline first: make '${headline}' read before the concept decoration; concept elements reinforce the headline's meaning as background, objects, or framing.`
      ) : "",
      bodyPoints ? _h.localizeSentence(
        `본문 재구성: 본문 포인트 항목을 컨셉 고유의 정보 노드, 배지, 라벨, 오브젝트 주변 캡션으로 재구성하되 원문 의미·숫자·고유명사를 유지한다.`,
        `Body restructure: reorganize the body-point items (see text section) as concept-native information nodes, badges, labels, or captions while preserving the original wording, numbers, and proper nouns.`
      ) : "",
    ]);
  }

  const campaignAdaptation = trimValue(_s.appliedConceptCampaignAdaptation);
  const objectAdaptation = trimValue(_s.appliedConceptObjectAdaptation);
  const layoutBehavior = trimValue(_s.appliedConceptLayoutBehavior);
  const typographyGuidance = trimValue(_s.appliedConceptTypographyGuidance);
  const normalizedCampaign = normalizeFinalPromptLine(campaignAdaptation);
  const normalizedObject = normalizeFinalPromptLine(objectAdaptation);
  const normalizedLayout = normalizeFinalPromptLine(layoutBehavior);

  return prunePromptLines([
    _h.localizeSentence(
      `홍보 이미지 적응 원칙: '${conceptName}'의 스타일 언어를 유지하면서, 홍보용 이미지 입력값을 메시지·타깃·행동 유도 기준으로 삼아 장면과 정보 구조를 설계한다.`,
      `Promotion image adaptation principle: preserve the style language of '${conceptName}', while using the promotion-image inputs as the source of truth for message, audience, and conversion structure.`
    ),
    goal ? _h.localizeSentence(
      `홍보 목적 연결: '${goal}'을 컨셉 스타일 안에서 즉시 이해되는 메인 비주얼 행동 또는 상징으로 표현한다.`,
      `Promotion goal connection: express '${_h.localizeValue(goal)}' as an immediately understandable main visual action or symbol within the concept style.`
    ) : "",
    audience ? _h.localizeSentence(
      `타깃 연결: '${audience}'가 유치하거나 동떨어진 이미지로 느끼지 않도록, 컨셉의 장식성보다 설득력·신뢰감·참여 동기를 우선한다.`,
      `Audience connection: make sure '${_h.localizeValue(audience)}' does not perceive the result as childish or off-topic; prioritize persuasion, credibility, and motivation to act over pure decoration.`
    ) : "",
    headline ? _h.localizeSentence(
      `핵심 문구 연결: 헤드라인 '${headline}'이 컨셉 장식보다 먼저 읽히도록 하고, 컨셉 요소는 헤드라인의 의미를 강화하는 배경·오브젝트·프레임 역할을 한다.`,
      `Headline connection: make the headline '${headline}' read before the concept decoration; concept elements should act as background, objects, or frames that reinforce the headline's meaning.`
    ) : "",
    bodyPoints ? _h.localizeSentence(
      `세부 정보 연결: '${bodyPoints}' 같은 본문 포인트는 컨셉의 정보 노드, 배지, 리본, 라벨, 오브젝트 주변 캡션으로 재구성하되 원문 의미를 유지한다.`,
      `Detail connection: reorganize body points such as '${bodyPoints}' as concept-native information nodes, badges, ribbons, labels, or captions around the object while preserving the original meaning.`
    ) : "",
    campaignAdaptation ? `${_h.localizeSentence("항목 반영 - 홍보 적응", "Field mapping - campaign adaptation")}: ${campaignAdaptation}` : "",
    objectAdaptation ? `${_h.localizeSentence("항목 반영 - 오브젝트/은유", "Field mapping - object/metaphor")}: ${objectAdaptation}` : "",
    layoutBehavior && normalizedLayout !== normalizedCampaign && normalizedLayout !== normalizedObject
      ? `${_h.localizeSentence("항목 반영 - 레이아웃", "Field mapping - layout")}: ${layoutBehavior}`
      : "",
    typographyGuidance ? `${_h.localizeSentence("항목 반영 - 타이포그래피", "Field mapping - typography")}: ${typographyGuidance}` : "",
  ]);
}

function getPaletteRoleSplitLines() {
  if (!_h.isBasicVisualPlanningMode() || !_h.hasBasicConceptPromptInput() || _h.isAiColorStrategy()) return [];
  const conceptPalette = trimValue(_s.appliedConceptPalette);
  const manualColors = [
    _s.primaryColor,
    _s.secondaryColor,
    _s.accentColor,
    _s.backgroundColor,
  ].map(trimValue).filter(Boolean);
  if (!conceptPalette || !manualColors.length) return [];
  const conceptColors = conceptPalette.split(/\s*,\s*/).map((item) => item.toLowerCase()).filter(Boolean);
  const allManualColorsFromConcept = manualColors.every((color) => conceptColors.includes(color.toLowerCase()));
  if (allManualColorsFromConcept) return [];
  return prunePromptLines([
    _h.localizeSentence(
      `색상 역할 분리: 사용자가 지정한 색상(${manualColors.join(", ")})은 브랜드 신호, 헤드라인 대비, 행동버튼 강조에 우선 사용하고, 컨셉 팔레트(${conceptPalette})는 배경 질감, 조명, 보조 오브젝트, 정보 묶음의 분위기에 적용한다.`,
      `Palette role split: use the user-specified colors (${manualColors.join(", ")}) first for brand signals, headline contrast, and action-button emphasis; apply the concept palette (${conceptPalette}) to background texture, lighting, supporting objects, and information-group mood.`
    ),
    _h.localizeSentence(
      "두 팔레트가 충돌하면 새 색상을 추가하지 말고, 사용자 색상은 전경/행동 유도에, 컨셉 색상은 후경/공간감에 배치해 같은 이미지 안에서 역할을 분리한다.",
      "If the two palettes conflict, do not add new colors; place user colors in the foreground and action path, and concept colors in the background and spatial mood."
    ),
  ]);
}

function shouldRestrictAiAutoForCurrentInput() {
  const bodyLength = String(_s.bodyCopy || "").trim().length;
  const manualSignalCount = [
    _s.headline,
    _s.subheadline,
    _s.bodyCopy,
    _s.goal,
    _s.audience,
    _s.mandatoryElements,
  ].filter((value) => trimValue(value)).length;
  return (_h.isBasicVisualPlanningMode() && _h.hasBasicConceptPromptInput()) || _s.contentType === "none" || bodyLength >= 80 || manualSignalCount >= 4;
}

function isLowRiskAutoField(field) {
  return field === "cta" || field === "posterOffer" || field === "snsHook" || field === "snsHashtags";
}

function getConceptAwareAutoDirective(def) {
  return _h.localizeSentence(
    `[AI 자동 생성] ${def.labelKo}: ${def.directiveKo}`,
    `[AI auto-generate] ${def.labelEn}: ${def.directiveEn}`
  );
}

function getConceptQualityLines() {
  if (!_h.isBasicVisualPlanningMode() || !_h.hasBasicConceptPromptInput()) return [];
  const hasRich = !!trimValue(_s.appliedConceptPromotionPrompt);
  return prunePromptLines([
    // richPrompt의 [Execution Rules]에 이미 포함 — 중복 생략
    !hasRich && _s.appliedConceptQualityRules
      ? `${_h.localizeSentence("컨셉 항목별 품질 규칙", "Concept item-level quality rules")}: ${_s.appliedConceptQualityRules}`
      : "",
    _h.localizeSentence(
      "선택한 컨셉의 색감, 형태, 질감을 배경과 오브젝트에 과하지 않게 자연스럽게 녹여내고, 글자의 가독성을 최우선으로 확보하시오.",
      "Blend the concept colors, forms, and textures naturally into the background and objects while ensuring text readability is the absolute priority."
    ),
  ]);
}

function qrCodePromptLines() {
  if (!isEnabled(_s.qrEnabled)) return [];
  const qrUrl = String(_s.qrUrl || "").trim();
  return prunePromptLines([
    _h.localizeSentence(
      "QR 배치: 선택한 구도에 가장 자연스럽게 어울리는 위치에 QR 자리를 배치한다. 하단 고정은 피하고 스캔 여백을 충분히 확보한다.",
      "QR placement: position the QR slot where it fits the chosen composition most naturally — avoid defaulting to the bottom, and keep enough clear space around it for scan clarity."
    ),
    _h.localizeSentence(
      "실제 스캔 가능한 QR코드를 이미지 생성 모델이 정확히 만들지 못할 수 있으므로, 최종 편집에서 실제 QR 이미지를 삽입할 수 있는 빈 자리 또는 플레이스홀더로 구성한다.",
      "Because the image model may not create a reliably scannable QR code, compose this as a blank slot or placeholder where the real QR image can be inserted during final editing."
    ),
    qrUrl
      ? _h.localizeSentence(
          `QR 연결 주소 참고: ${qrUrl}`,
          `QR target URL reference: ${qrUrl}`
        )
      : "",
    _h.localizeSentence(
      "QR 안내문구: 'QR코드로 바로가기' 또는 'QR로 신청하기'처럼 짧고 읽기 쉬운 안내문구를 QR 영역과 같은 정보 묶음 안에 배치한다.",
      "QR helper text: place a short readable label such as 'Scan the QR code' or 'Apply via QR' within the same information group as the QR area."
    ),
  ]);
}

function actionElementLabelKo() {
  return isEnabled(_s.qrEnabled)
    ? "행동버튼, QR 자리, 링크 안내 같은 행동 유도 요소"
    : "행동버튼, 링크 안내, 신청/참여 안내 같은 행동 유도 요소";
}

function actionElementLabelEn() {
  return isEnabled(_s.qrEnabled)
    ? "action button, QR placeholder, link guide, or other conversion element"
    : "action button, link guide, application guide, or other conversion element";
}

function createPromptSections(validation, lint) {
  const textEntries = _h.visibleTextEntries();
  const instructionItems = _h.instructionEntries();
  const commercialProfile = COMMERCIAL_BASELINE_PROFILES[_s.commercialBaseline] || COMMERCIAL_BASELINE_PROFILES[DEFAULT_STATE.commercialBaseline];
  const promotionStrategyProfile = CONTENT_PROMOTION_STRATEGIES[_s.contentType] || CONTENT_PROMOTION_STRATEGIES.none;
  const compositionExcludedKeys = new Set([
    "contentType",
    "sizeMode",
    "ratio",
    "directSize",
    "orientation",
    "forbiddenElements",
    "backgroundMode",
    "backgroundColor",
    "backgroundDetails",
    "primaryColor",
    "secondaryColor",
    "accentColor",
    "qualityNotes",
    "commercialBaseline",
    "creativityLevel",
  ]);

  const isBgPlacement = _s.keyVisualPlacement === "background";
  const bodyCount = normalizeLines(_s.bodyCopy).length;
  const isAsymmetricLayout = 
    (_s.layoutCompositionEnabled && _s.layoutCompositionMode === "manual" && _s.layoutComposition === "left-heavy") ||
    (_s.attentionFlowEnabled && _s.attentionFlowMode === "manual" && _s.attentionFlow === "side-rail") ||
    (_s.layoutCompositionMode === "ai" || _s.attentionFlowMode === "ai") ||
    (bodyCount >= 4) ||
    (_s.contentType === "event-info") ||
    (_s.contentType === "survey-request");

  const posterVisualKo = isBgPlacement 
    ? "화면 중앙 또는 배경에 텍스트를 방해하지 않도록 차분하게 블렌딩된 저대비 배경 그래픽 비주얼"
    : (isAsymmetricLayout
        ? "레이아웃 구도에 맞춰 한쪽 측면 또는 비대칭 축에 조화롭게 정렬된 메인 비주얼"
        : "화면 중앙에 선명하게 포커싱된 메인 비주얼");
  const posterVisualEn = isBgPlacement
    ? "a subtle, low-contrast background graphic visual blended softly behind the text areas"
    : (isAsymmetricLayout
        ? "a strong visual balanced harmoniously off-center or on one side according to the layout composition"
        : "a strong center-focused key visual");

  const assetLayoutTemplates = {
    "card-news": _h.localizeSentence(
      "구도 프레임워크 (카드뉴스): SNS 카드뉴스 포스트에 최적화된 정돈된 사각형 레이아웃 구조. 정보 묶음을 감싸는 라운드 테두리 패널과 헤드라인용 단색 오버레이 배너 영역을 명확히 디자인하여 텍스트 배치가 쉬운 템플릿 캔버스를 만든다.",
      "Composition Framework (Card News): A structured square layout optimized for social media card news. Designed with clean background panels featuring rounded borders and a dedicated flat color zone, creating a perfect canvas ready for graphic and text overlays."
    ),
    "poster": _h.localizeSentence(
      `구도 프레임워크 (포스터): 여백이 강조된 강렬한 세로형 포스터 레이아웃 구조. ${posterVisualKo}, 테두리 사방에 보호 여백을 충분히 두고, 상단에는 큰 제목, 하단에는 날짜/장소/참여방법 정보가 오목조목 묶일 수 있는 별도 정보 프레임 밴드를 설계한다.`,
      `Composition Framework (Poster): A vertical graphic poster design. Features a clear visual hierarchy with ${posterVisualEn}, wide protective margins on all edges, and distinct empty header and footer bands designed to hold titles and event information without clutter.`
    ),
    "notice": _h.localizeSentence(
      "구도 프레임워크 (안내문): 단정한 모던 안내판 및 공고문 보드 레이아웃 구조. 차분한 미니멀리즘 배경 위에 정보가 구조적으로 정렬되도록 격자형(그리드) 라인 디바이더와 모듈형 블록 카드들을 질서 정연하게 배치한다.",
      "Composition Framework (Notice): A corporate announcement bulletin board layout. Features clean grid dividers and modular block shapes on a warm minimal background, designed to present structured information in a clean, highly readable executive format."
    )
  };

  let resolvedLayoutKey = "notice";
  const effectiveRatio = String(_s.ratio || "").trim();
  const effectiveOrientation = typeof _h.getEffectiveOrientation === "function" 
    ? _h.getEffectiveOrientation() 
    : (_s.orientation || "vertical");

  if (effectiveRatio === "1:1") {
    resolvedLayoutKey = "card-news";
  } else if (effectiveOrientation === "vertical") {
    resolvedLayoutKey = "poster";
  } else {
    resolvedLayoutKey = "notice";
  }

  const currentAssetLayout = assetLayoutTemplates[resolvedLayoutKey] || "";

  const targetLines = prunePromptLines([
    `${_h.localizeSentence("산출물 유형", "Asset type")}: ${_h.localizeValue(ASSET_LABELS[_s.assetType])}`,
    `${_h.localizeSentence("컨텐츠 유형", "Content template")}: ${_h.localizeValue(CONTENT_TYPE_TEMPLATES[_s.contentType]?.name || "직접 입력")}`,
    `${_h.localizeSentence("규격 입력 방식", "Sizing mode")}: ${_h.localizeValue(_s.sizeMode === "direct" ? "크기 직접 입력" : "비율 설정")}`,
    _s.sizeMode === "direct"
      ? `${_h.localizeSentence("직접 입력 크기", "Exact size")}: ${_h.getPromptSpecificationSummary()}`
      : `${_h.localizeSentence("비율/방향", "Aspect ratio / orientation")}: ${_h.getPromptSpecificationSummary()} / ${_h.localizeValue(_h.getEffectiveOrientation() === "vertical" ? "세로형" : "가로형")}`,
    currentAssetLayout,
  ]);

  const visualPlanningModeLines = prunePromptLines([
    `${_h.localizeSentence("비주얼 기획 모드", "Visual planning mode")}: ${_h.visualPlanningModeLabel()}`,
    _h.isBasicVisualPlanningMode()
      ? _h.localizeSentence(
          "컨셉 제안에서 적용된 스타일 코어, 색상 시스템, 홍보 적응 규칙을 비주얼 설계의 우선 기준으로 사용한다.",
          "Use the applied concept suggestion's style core, color system, and promotion adaptation rules as the primary basis for visual design."
        )
      : _h.localizeSentence(
          "컨셉 제안의 스타일 코어와 브리지 규칙은 사용하지 않고, 사용자가 3~5번에서 직접 지정한 비주얼 방향, 색상, 품질 제약을 우선한다.",
          "Do not use concept-suggestion style core or bridge rules; prioritize the visual direction, color, and quality constraints manually specified in steps 3 to 5."
        ),
    _h.isBasicVisualPlanningMode() && !_h.hasBasicConceptPromptInput()
      ? _h.localizeSentence(
          "컨셉이 아직 적용되지 않았다면 기본 모드에서도 오류를 내지 말고, 현재 입력값과 공통 광고 품질 규칙만으로 안전하게 생성한다.",
          "If no concept has been applied yet, do not fail in basic mode; safely generate from the current inputs and shared campaign-quality rules."
        )
      : "",
  ]);

  const koreanTextConstraint =
    _s.outputLanguage !== "en" && _s.outputLanguage !== "bilingual"
      ? [
          _s.targetEngine === "imagen"
            ? _h.localizeSentence(
                "이미지 내부에는 글자를 직접 렌더링하지 말고, 추후 텍스트가 삽입될 여백(Negative Space)과 정돈된 레이아웃 구도만 완성하시오.",
                "Do not render text characters directly on the image; complete only the clean layouts and empty negative spaces for future text overlays."
              )
            : _h.localizeSentence(
                "이미지에 렌더링되는 텍스트(헤드라인·서브카피·CTA·오퍼·훅 등)는 사용자가 입력한 원문 언어 그대로 표기한다. 한국어 입력은 한국어로, 영어 입력은 영어로 렌더링하며, AI가 임의로 번역하거나 언어를 전환하지 않는다.",
                "Render all on-image text (headline, sub-copy, CTA, offer, hook, etc.) in exactly the language the user provided — Korean stays Korean, English stays English. Do not translate or switch languages arbitrarily."
              ),
        ]
      : [];

  const activeAntiAiPreset = ANTI_AI_PRESETS.find((p) => p.id === _s.antiAiStyle) || null;
  const antiAiForbiddenTokens = activeAntiAiPreset
    ? splitKeywordValues(_h.localizeSentence(activeAntiAiPreset.forbiddenKo, activeAntiAiPreset.forbiddenEn))
    : [];
  const antiAiForbiddenAllLangs = activeAntiAiPreset
    ? [
        ...splitKeywordValues(activeAntiAiPreset.forbiddenKo || ""),
        ...splitKeywordValues(activeAntiAiPreset.forbiddenEn || ""),
      ]
    : [];
  const userForbiddenTokens = splitForbiddenValues(_s.forbiddenElements).filter((token) => {
    const norm = token.trim().toLowerCase().replace(/[\s·.,]/g, "");
    return !antiAiForbiddenAllLangs.some((t) => t.trim().toLowerCase().replace(/[\s·.,]/g, "") === norm);
  });
  const mergedForbiddenTokens = [...userForbiddenTokens, ...antiAiForbiddenTokens];

  const defaultHardConstraintLines = [
    _h.localizeSentence(
      "이미지 안 텍스트는 임의 문장·가짜 한글·중복 문구·의미 없는 장식 텍스트 없이 제공된 문구만 사용한다.",
      "Use only the provided copy on the image; do not add arbitrary text, fake characters, or duplicate copy."
    ),
    _h.localizeSentence(
      "모든 텍스트는 철자 오류 없이 정확하고 선명한 아웃라인으로 렌더링한다.",
      "Render all text clearly with correct spelling and zero distortion."
    ),
    _h.localizeSentence(
      "실제 로고/상표는 직접 생성하지 말고, 필요한 경우 빈 자리나 중립 플레이스홀더로 남긴다.",
      "Do not invent real logos or trademarks; leave a clean empty slot or neutral placeholder instead."
    ),
    _h.localizeSentence(
      `주요 헤드라인과 ${actionElementLabelKo()}는 외곽 경계선에 너무 가깝지 않은 안전한 영역 내에 정렬해 둔다.`,
      `Align key headline and ${actionElementLabelEn()} safely away from the canvas edges.`
    ),
    _h.localizeSentence(
      "결과물은 목업 프레임, 외부 흰 여백, 포스터를 손에 든 연출 장면이 없는 깨끗한 단일 그래픽 디자인 자체여야 한다.",
      "Ensure a single flat graphic design without mockups, outer white borders, or hand-held poster scenes."
    ),
  ];

  const hardConstraintLines = prunePromptLines([
    ...koreanTextConstraint,
    ...defaultHardConstraintLines,
    ...(activeAntiAiPreset
      ? [_h.localizeSentence(
          `스타일 제약(${activeAntiAiPreset.labelKo}): ${activeAntiAiPreset.visualHintKo}로 렌더링하라`,
          `Style constraint (${activeAntiAiPreset.labelEn}): render in ${activeAntiAiPreset.visualHintEn}`
        )]
      : []),
    ...mergedForbiddenTokens
      .map(normalizeForbiddenPromptToken)
      .filter(Boolean)
      .map((item) => `${_h.localizeSentence("절대 금지", "Strictly avoid")}: ${_h.localizeValue(item)}`),
  ]);

  const negativePromptLines = (() => {
    const BASE_KO = [
      "흐릿함", "저해상도", "픽셀 깨짐", "JPEG 아티팩트", "노이즈",
      "텍스트 왜곡", "철자 오류", "가짜 글리프", "읽기 어려운 글자",
      "워터마크", "서명", "외부 프레임", "외부 흰 여백", "목업 화면",
      "포스터를 든 장면", "프레임 안 미리보기",
      "과채도", "과노출", "거친 그림자",
      "장난감 같은 3D", "플라스틱 렌더링", "가짜 홀로그램", "네온 번짐",
      "손가락 왜곡", "신체 변형", "팔다리 과잉",
      "의미 없는 장식 텍스트", "임의 추가 텍스트",
      "평면 격리 레이아웃", "공간감 없는 배치",
    ];
    const BASE_EN = [
      "blurry", "low quality", "pixelated", "jpeg artifacts", "noise",
      "text distortion", "misspelled text", "garbled glyphs", "illegible text",
      "watermark", "signature", "outer frame", "white border",
      "mockup", "poster in hand", "framed preview",
      "oversaturated", "overexposed", "harsh shadows",
      "toy-like 3D", "plastic render", "fake hologram", "neon bloom",
      "distorted hands", "anatomical errors", "extra limbs",
      "arbitrary decorative text", "random text overlay",
      "flat isolated layout", "no depth",
    ];

    const isNonPhoto = /game|craft|illustration|pixel|doodle|comic|retro|clay|pop|flat|art/i.test(_s.appliedConceptCategory || "") ||
                       /game|craft|illustration|pixel|doodle|comic|retro|clay|pop|flat|art/i.test(_s.appliedConceptStyle || "") ||
                       /game|craft|illustration|pixel|doodle|comic|retro|clay|pop|flat|art/i.test(_s.visualStyle || "");

    if (isNonPhoto && _s.targetEngine === "imagen") {
      BASE_KO.push("실사 사진", "실제 카메라 촬영 느낌", "실사 인물 사진", "3D 렌더링 오버글로스");
      BASE_EN.push("real photography", "realistic camera shot", "photorealistic human photo", "over-glossy 3D plastic render");
    }

    const is3dActive = 
      /3d|game|isometric|입체|토이/i.test(_s.appliedConceptCategory || "") ||
      /3d|game|isometric|입체|토이/i.test(_s.appliedConceptStyle || "") ||
      /3d|game|isometric|입체|토이/i.test(_s.visualStyle || "");

    const isFlatActive = 
      /flat|minimal|vector|graphic|modern|illustration|일러스트|플랫/i.test(_s.appliedConceptCategory || "") ||
      /flat|minimal|vector|graphic|modern|illustration|일러스트|플랫/i.test(_s.appliedConceptStyle || "") ||
      /flat|minimal|vector|graphic|modern|illustration|일러스트|플랫/i.test(_s.visualStyle || "") ||
      /centered|split-screen/i.test(_s.layoutComposition || "");

    const excludedKo = [];
    const excludedEn = [];

    if (is3dActive) {
      excludedKo.push("장난감 같은 3D", "플라스틱 렌더링", "가짜 홀로그램");
      excludedEn.push("toy-like 3D", "plastic render", "fake hologram");
    }
    if (isFlatActive) {
      excludedKo.push("평면 격리 레이아웃", "공간감 없는 배치");
      excludedEn.push("flat isolated layout", "no depth");
    }

    const filteredKo = BASE_KO.filter((item) => !excludedKo.includes(item));
    const filteredEn = BASE_EN.filter((item) => !excludedEn.includes(item));

    const userExtra = mergedForbiddenTokens
      .map(normalizeForbiddenPromptToken)
      .filter(Boolean)
      .map((item) => _h.localizeValue(item));
    const antiExtra = activeAntiAiPreset
      ? splitKeywordValues(
          _h.localizeSentence(activeAntiAiPreset.forbiddenKo, activeAntiAiPreset.forbiddenEn)
        )
      : [];
    const extraAll = [...userExtra, ...antiExtra].filter(Boolean);

    if (_s.outputLanguage === "en") {
      return prunePromptLines([[...filteredEn, ...extraAll].join(", ")]);
    }
    if (_s.outputLanguage === "bilingual") {
      return prunePromptLines([
        `KO: ${[...filteredKo, ...extraAll].join(", ")}`,
        `EN: ${[...filteredEn, ...extraAll].join(", ")}`,
      ]);
    }
    return prunePromptLines([[...filteredKo, ...extraAll].join(", ")]);
  })();

  const directTextLines = prunePromptLines(
    _s.targetEngine === "imagen"
      ? textEntries.map((entry) => {
          const cleanLabel = _h.localizeValue(entry.label);
          const cleanValue = _h.localizeValue(entry.value);
          return _h.localizeSentence(
            `텍스트 [${cleanLabel}]: "${cleanValue}" (텍스트가 삽입될 수 있는 단색의 깨끗하고 노이즈 없는 백드롭/플레이스홀더/여백 영역을 배경으로 남겨두고 텍스트를 또렷하게 렌더링하시오.)`,
            `Text [${cleanLabel}]: "${cleanValue}" (Render this text clearly, reserving a clean, flat, noise-free solid backdrop plate or negative space ready for the text overlay.)`
          );
        })
      : textEntries.map((entry) => `${_h.localizeValue(entry.label)}: ${_h.localizeValue(entry.value)}`)
  );

  const infoGroupCount = bodyCount;
  const infoQuantityDirectKo = infoGroupCount > 3
    ? `제공된 ${infoGroupCount}개의 본문 정보 그룹을 누락 없이 조화롭고 깔끔하게 표현하되, 시각적 과밀을 방지하도록 단정하게 정렬하라.`
    : "사용자가 입력한 문구, 날짜, 숫자는 원문 그대로 유지하되, 화면에는 2~3개 정보 묶음만 남긴다.";
  const infoQuantityDirectEn = infoGroupCount > 3
    ? `Express all the provided ${infoGroupCount} information groups clearly and without omission, organizing them neatly in clean blocks to prevent visual clutter.`
    : "Keep user wording, dates, and numbers exact, but leave only 2 to 3 information groups on the image.";

  const informationItemLayoutLines = prunePromptLines(
    _h.shouldUseCompactPromptGuidance()
      ? [
          _h.localizeSentence(
            "정보항목은 고정 카드가 아니라 컨셉에 맞는 배지, 라벨, 사이드 레일, 비주얼 내장 텍스트 중 하나로 압축해 배치한다.",
            "Compress information items into one concept-native format such as badges, labels, a side rail, or embedded visual text instead of fixed cards."
          ),
          _h.localizeSentence(
            infoQuantityDirectKo,
            infoQuantityDirectEn
          ),
        ]
      : [
          _h.localizeSentence(
            "정보항목 배치: 일정, 자격, 혜택, 마감일, 장소, 신청방법, 연락처 같은 세부사항은 고정 카드가 아니라 자유롭게 조합 가능한 의미 단위로 취급한다.",
            "Information item layout: treat schedule, eligibility, benefits, deadline, location, application method, and contact details as flexible semantic units, not fixed cards."
          ),
          _h.localizeSentence(
            "생성할 때마다 아래 표현 방식 중 정확히 하나 또는 서로 보완되는 두 가지를 선택하고, 선택한 시선 흐름과 레이아웃 구도에 맞춰 정보 묶음 형태를 바꾼다.",
            "For each generation, choose exactly one or two complementary presentation formats below and vary the information grouping according to the selected attention flow and layout composition."
          ),
          ...INFORMATION_ITEM_LAYOUT_VARIANTS.map((option) => _h.localizeSentence(
            `${option.labelKo} — ${option.descKo}`,
            `${option.labelEn} — ${option.descEn}`
          )),
          _h.localizeSentence(
            "일정·자격·혜택·마감일이 함께 있을 때 자동으로 '혜택 카드 3개 + 하단 정보박스 1개'로 나누지 않는다. 네 항목을 동등한 노드, 타임라인, 세로 레일, 대각선 단계, 배지 묶음, 비주얼 내장 라벨 등으로 변주한다.",
            "When schedule, eligibility, benefits, and deadline appear together, do not automatically split them into 'three benefit cards plus one bottom information box.' Vary them as equal nodes, a timeline, a vertical rail, diagonal steps, badge groups, or labels integrated into the visual."
          ),
          _h.localizeSentence(
            "사용자가 입력한 문구, 날짜, 숫자는 원문 그대로 유지하되, 시각적 묶음과 위치는 선택한 구도 전략에 따라 자유롭게 재구성한다.",
            "Keep user-provided wording, dates, and numbers exactly as written, but freely reorganize the visual grouping and placement according to the selected composition strategy."
          ),
        ]
  );

  const mandatoryElementPlacementLines = String(_s.mandatoryElements || "").trim()
    ? prunePromptLines([
        _h.localizeSentence(
          "반드시 포함할 요소 배치: 브랜드명, 로고 자리, 주최기관, 필수 문구, 출처, 신청방법 같은 요구 요소를 모두 같은 하단 박스에 몰아넣지 않는다.",
          "Mandatory element placement: do not cluster required elements such as brand name, logo slot, organizer, required phrase, source, or application method into the same bottom box."
        ),
        _h.localizeSentence(
          "푸터 밴드가 활용되는 세로형 포스터 구도인 경우, 일시/장소 등 상세 캠페인 정보는 하단 푸터 밴드 안에 오목조목 묶어 배치할 수 있지만, 주최기관 브랜드명이나 로고 자리는 푸터에 몰아넣지 말고 상단 헤더 라벨이나 코너 태그로 분산시켜야 여백과 위계가 유지된다.",
          "If a footer band is used in a vertical poster layout, event details like date and venue can be structured within the footer, but the brand name or logo slot must not be clustered inside it. Place them separately as a header label or corner tag to maintain proper spacing."
        ),
        _h.localizeSentence(
          "각 요소는 시각 위계에 맞는 위치에 분산 배치한다. 코너 태그, 헤더 라벨, 사이드 레일, CTA 인접 배치, 통합 캡션 중 레이아웃 구도에 맞는 방식을 선택한다.",
          "Distribute each required element to the position matching its visual weight. Choose from corner tag, header micro-label, side rail, CTA-adjacent label, or integrated caption — whichever fits the chosen composition."
        ),
        _h.localizeSentence(
          "로고나 실제 기관 마크는 직접 생성하지 말고, 필요한 경우 깨끗한 빈 자리 또는 중립 플레이스홀더로 남긴다.",
          "Do not generate real logos or official marks; leave a clean blank slot or neutral placeholder when needed."
        ),
      ])
    : [];

  const getContextualMetaphors = () => {
    const conceptText = (
      (_s.appliedConceptCategory || "") + " " +
      (_s.appliedConceptStyle || "") + " " +
      (_s.appliedConceptName || "") + " " +
      (_s.visualStyle || "")
    ).toLowerCase();

    if (/airport|aviation|flight|plane|공항|항공|비행/i.test(conceptText)) {
      return {
        ko: ["활주로", "비행 경로", "유선형 날개", "터미널 아치", "지평선", "나침반 바늘"],
        en: ["flight paths", "runways", "streamlined wings", "terminal arches", "horizon lines", "compass needles"]
      };
    }
    if (/traditional|korean|oriental|동양|전통|한옥|붓/i.test(conceptText)) {
      return {
        ko: ["전통 기와 곡선", "묵직한 붓터치", "전통 병풍 격자", "은은한 한지 전등갓", "정적인 여백"],
        en: ["traditional tile curves", "heavy brush strokes", "folding screen lattices", "soft paper lanterns", "static negative spaces"]
      };
    }
    if (/network|node|technology|tech|digital|cyber|it|기술|네트워크|디지털/i.test(conceptText)) {
      return {
        ko: ["연결된 네트워크 노드", "발광하는 광섬유 경로", "홀로그램 게이트", "디지털 데이터 스트림"],
        en: ["connected network nodes", "glowing pathway fibers", "holographic portals", "digital data streams"]
      };
    }
    return {
      ko: ["상승 그래프", "대각선 계단", "곧게 뻗은 경로", "열린 문", "연결 노드", "상승하는 로켓", "견고한 다리"],
      en: ["rising graphs", "diagonal stairs", "straight paths", "open doors", "connected nodes", "rising rockets", "solid bridges"]
    };
  };

  const contextMetaphors = getContextualMetaphors();
  const metaphorKoStr = contextMetaphors.ko.join(", ");
  const metaphorEnStr = contextMetaphors.en.join(", ");

  const AI_AUTO_FIELD_DEFS = [
    {
      field: "cta",
      labelKo: "엑션버튼(CTA) 문구",
      labelEn: "action button (CTA) copy",
      directiveKo: "엑션버튼(CTA) 문구를 홍보 목적과 핵심 타깃에 맞춰 즉각적인 행동을 유도하는 형태로 생성하라",
      directiveEn: "Generate an action button (CTA) copy that drives immediate action, matched to the promotion goal and target audience",
    },
    {
      field: "posterOffer",
      labelKo: "한 줄 오퍼",
      labelEn: "single-line offer",
      directiveKo: "이미지에 직접 노출될 한 줄 오퍼 문구를 핵심 혜택 중심으로 간결하게 생성하라",
      directiveEn: "Generate a concise single-line offer focused on the core benefit, suitable for direct display on the image",
    },
    {
      field: "snsHook",
      labelKo: "첫 줄 훅",
      labelEn: "opening hook",
      directiveKo: "SNS 피드/스토리에서 즉시 시선을 끌 수 있는 첫 줄 훅 문구를 생성하라",
      directiveEn: "Generate an opening hook that immediately grabs attention in SNS feed or story formats",
    },
    {
      field: "snsHashtags",
      labelKo: "해시태그/태그",
      labelEn: "hashtags/tags",
      directiveKo: "컨텐츠 유형과 홍보 목적에 맞는 해시태그 5~10개를 생성하라",
      directiveEn: "Generate 5 to 10 hashtags matched to the content type and promotion goal",
    },
    {
      field: "tone",
      labelKo: "브랜드 톤",
      labelEn: "brand tone",
      directiveKo: "홍보 목적과 타깃 독자에 맞게 가장 설득력 있고 매력적인 브랜드 톤앤매너(예: 신뢰감, 역동적, 미래지향적 등)를 자동으로 생성하라",
      directiveEn: "Generate a compelling brand tone and voice suitable for the promotion goal and target audience"
    },
    {
      field: "bigIdea",
      labelKo: "핵심 개념(Big Idea)",
      labelEn: "core concept (Big Idea)",
      directiveKo: "메시지와 비주얼을 하나로 관통하는 창의적인 핵심 개념(Big Idea)을 정의하고 프롬프트 전반에 반영하라",
      directiveEn: "Generate a creative core concept (Big Idea) that unifies the campaign message and visual identity"
    },
    {
      field: "visualMetaphor",
      labelKo: "비주얼 은유",
      labelEn: "visual metaphor",
      directiveKo: `핵심 개념을 암시하는 메타포를 고정형 카드/화살표로 수렴시키지 말고, ${metaphorKoStr}처럼 컨셉에 어울리는 다양한 전문적 은유 중 하나로 생성하라`,
      directiveEn: `Generate one diverse professional metaphor for the core concept suited to the concept style, such as ${metaphorEnStr}; do not converge on generic cards or arrows`
    },
    {
      field: "visualStyle",
      labelKo: "비주얼 스타일",
      labelEn: "visual style",
      directiveKo: "타깃 디자인 룩에 걸맞은 사진 기법, 그래픽 텍스처, 질감 및 비주얼 스타일 지시어를 디테일하게 자동 생성하라",
      directiveEn: "Generate a visual style concept suggestion with detailed style descriptors matching the campaign theme"
    },
    {
      field: "layoutComposition",
      labelKo: "레이아웃 구도 배치",
      labelEn: "layout composition",
      directiveKo: "아래 구성/배치 지시의 Layout composition strategy 선택지 중 하나를 선택하고, 선택한 전략을 우선 적용하라",
      directiveEn: "Select one option from the Layout composition strategy choices in the composition guidance below and prioritize that chosen strategy"
    }
  ];

  const aiAutoLines = prunePromptLines(
    AI_AUTO_FIELD_DEFS
      .filter((def) => {
        if (def.field === "visualMetaphor" || def.field === "layoutComposition") {
          return false;
        }
        if (def.field === "visualStyle" && _h.isBasicVisualPlanningMode()) {
          return false;
        }
        if (shouldRestrictAiAutoForCurrentInput() && !isLowRiskAutoField(def.field)) {
          return false;
        }
        return isEnabled(state[`${def.field}Enabled`]) && state[`${def.field}Mode`] === "ai";
      })
      .map((def) => getConceptAwareAutoDirective(def))
  );

  const conceptAutoAlignmentLines = _h.isBasicVisualPlanningMode() && _h.hasBasicConceptPromptInput()
    ? prunePromptLines([
        shouldRestrictAiAutoForCurrentInput()
          ? _h.localizeSentence(
              "AI 자동생성은 행동버튼 문구와 짧은 한 줄 오퍼 보완에만 사용하고, 선택 컨셉·헤드라인·본문·레이아웃 방향을 새로 만들거나 덮어쓰지 않는다.",
              "Use AI auto-generation only to refine the action-button copy and a short offer line; do not recreate or overwrite the selected concept, headline, body copy, or layout direction."
            )
          : _h.localizeSentence(
              "AI 자동 생성 항목은 적용된 컨셉을 대체하지 않고, 현재 컨셉의 색감·질감·조명·형태 언어 안에서 부족한 문구만 보완한다.",
              "AI auto-generated items must not replace the applied concept; fill only missing copy within the current concept's color, texture, lighting, and shape language."
            ),
      ])
    : [];

  const promotionStrategyLines = prunePromptLines([
    `${_h.localizeSentence("광고 목적", "promotion goal")}: ${_h.localizeValue(_s.goal || CONTENT_TYPE_TEMPLATES[_s.contentType]?.goal || "직접 입력 목적")}`,
    `${_h.localizeSentence("타깃 대상", "target audience")}: ${_h.localizeValue(_s.audience || CONTENT_TYPE_TEMPLATES[_s.contentType]?.audience || "직접 입력 대상")}`,
    (isEnabled(_s.toneEnabled) && _s.toneMode === "manual" && _s.tone)
      ? `${_h.localizeSentence("브랜드 톤", "brand tone")}: ${_h.localizeValue(_s.tone)}`
      : "",
    ...getLocalizedProfileLines(promotionStrategyProfile),
    _h.localizeSentence(
      "이 이미지는 정보 안내물이 아니라 시선 포획, 메시지 압축, 행동 유도를 수행하는 광고 키비주얼이어야 한다.",
      "This image must function as an advertising key visual that captures attention, compresses the message, and drives action, not as a plain information notice."
    ),
  ]);

  const textBlockLimitKo = infoGroupCount > 3
    ? `제공된 ${infoGroupCount}개의 정보 블록을 정밀하게 배치하되, 하단 카드 배열이 콘텐츠에 맞으면 그대로 사용하고, 오버랩 단계·원형 노드·비주얼 내부 통합 텍스트 블록도 선택지로 고려한다.`
    : "텍스트 블록은 가능하면 3개 이하로 묶되, 하단 카드 배열이 콘텐츠에 맞으면 그대로 사용하고, 오버랩 단계·원형 노드·비주얼 내부 통합 텍스트 블록도 선택지로 고려한다.";
  const textBlockLimitEn = infoGroupCount > 3
    ? `Neatly organize the ${infoGroupCount} text blocks; if bottom card rows suit the content use them, but also consider overlapping steps, circular nodes, or integrated text blocks inside the main visual.`
    : "Keep text blocks to 3 or fewer when possible; if bottom card rows suit the content use them, but also consider overlapping steps, circular nodes, or integrated text blocks inside the main visual.";

  const attentionFlowLines = prunePromptLines(
    _h.shouldUseCompactPromptGuidance()
      ? [
          getRecommendedCompositionDirective(),
          _h.localizeSentence(
            "시선 흐름은 헤드라인 또는 핵심 제안 → 컨셉 키비주얼 → 짧은 정보 묶음 → 행동버튼 순서로 정리한다.",
            "Use the eye flow: headline or core offer → concept key visual → short information groups → action button."
          ),
        ]
      : [
          _h.localizeSentence(
            "아래 시선 흐름 패턴 중 이번 콘텐츠와 타깃에 가장 적합한 하나를 선택해 전체 레이아웃의 우선순위로 사용한다.",
            "Select the one attention-flow pattern below that best fits the current content and target audience, and use it as the layout priority."
          ),
          ...ATTENTION_FLOW_VARIANTS.map((variant) => {
            const lines = _s.outputLanguage === "en" ? variant.linesEn
              : _s.outputLanguage === "bilingual"
                ? variant.linesKo.map((ko, i) => `${ko} / ${variant.linesEn[i] || ko}`)
                : variant.linesKo;
            return `${_h.localizeSentence(variant.labelKo, variant.labelEn)} — ${lines.join(" → ")}`;
          }),
          _h.localizeSentence(
            textBlockLimitKo,
            textBlockLimitEn
          ),
        ]
  );

  const commercialLines = prunePromptLines([
    `${_h.localizeSentence("상업 품질 기준", "Commercial baseline")}: ${_h.localizeSentence(commercialProfile.labelKo, commercialProfile.labelEn)}`,
    ...getLocalizedProfileLines(commercialProfile),
  ]);
  const conceptBridgeLines = _h.isBasicVisualPlanningMode() ? getConceptBridgeLines() : [];

  const layoutCompLines = (() => {
    if (!isEnabled(_s.layoutCompositionEnabled)) {
      return [];
    }

    if (_s.layoutCompositionMode === "ai") {
      return prunePromptLines(
        _h.shouldUseCompactPromptGuidance()
          ? [
              _h.localizeSentence(
                "Layout composition strategy: 후보를 나열하지 말고 이번 입력에 가장 적합한 단일 구도를 선택해 전체 화면 분할, 정보 묶음, 키비주얼 위치에 일관되게 적용한다.",
                "Layout composition strategy: do not list candidates; choose one layout best suited to this input and apply it consistently to screen division, information grouping, and key-visual placement."
              ),
              _h.localizeSentence(
                "중앙 정렬 + 하단 카드 2~3개 조합을 기본값으로 반복하지 않는다.",
                "Do not repeat the default centered layout with 2 to 3 bottom cards."
              ),
            ]
          : [
              _h.localizeSentence(
                "Layout composition strategy: 생성할 때마다 아래 전략 중 정확히 하나를 무작위로 선택하고, 선택한 전략명을 내부 기준으로 삼아 전체 구도를 설계한다.",
                "Layout composition strategy: for each generation, randomly choose exactly one of the strategies below and use the chosen strategy as the internal basis for the whole composition."
              ),
              ...AI_LAYOUT_STRATEGY_OPTIONS.map((option) => _h.localizeSentence(
                `${option.labelKo} — ${option.descKo}`,
                `${option.labelEn} — ${option.descEn}`
              )),
              _h.localizeSentence(
                "중앙 정렬 + 하단 카드 2~3개 조합을 기본값으로 반복하지 말고, 선택한 구도 전략이 화면 분할, 시선 흐름, 정보 묶음 형태에 실제로 드러나게 한다.",
                "Do not repeat the default centered layout with 2 to 3 bottom cards; make the chosen strategy visibly affect screen division, eye flow, and the way information is grouped."
              ),
            ]
      );
    }

    if (_s.layoutCompositionMode !== "manual") {
      return [];
    }

    const compKey = _s.layoutComposition || "centered";
    const profile = LAYOUT_COMPOSITION_PROFILES[compKey] || LAYOUT_COMPOSITION_PROFILES.centered;
    const label = _h.localizeSentence(profile.labelKo, profile.labelEn);
    const lines = _s.outputLanguage === "en" ? profile.linesEn
      : _s.outputLanguage === "bilingual"
        ? profile.linesKo.map((ko, i) => `${ko} / ${profile.linesEn[i] || ko}`)
        : profile.linesKo;
    return [
      `${_h.localizeSentence("레이아웃 구도 배치", "Layout composition")}: ${label}`,
      ...lines
    ];
  })();

  const conceptStyleLine = _h.isBasicVisualPlanningMode() ? getAppliedConceptLines() : [];

  const visualMetaphorDiversityLines = (() => {
    if (!isEnabled(_s.visualMetaphorEnabled) || _s.visualMetaphorMode !== "ai") {
      return [];
    }

    if (_h.isBasicVisualPlanningMode()) {
      return [];
    }

    return [
      _h.localizeSentence(
        `비주얼 은유: AI 위임 — 고정된 단일 은유를 반복하지 말고, ${metaphorKoStr} 같은 긍정적이고 전문적인 메타포 중 하나를 슬라이드 메시지에 맞게 선택한다.`,
        `Visual metaphor: AI-directed — do not repeat one fixed metaphor; choose a positive professional metaphor suited to the message, such as ${metaphorEnStr}.`
      ),
      _h.localizeSentence(
        "선택한 은유의 형태가 실제 구도에 영향을 주게 한다. 예를 들어 계단은 대각선 진행형, 열린 문은 깊이감 있는 원근형, 네트워크 노드는 방사형/연결형, 상승 그래프는 축 기반 상승 구도를 유도한다.",
        "Let the chosen metaphor influence the actual composition. For example, stairs imply diagonal progression, open doors imply perspective depth, network nodes imply radial/connected structure, and rising graphs imply an upward axis."
      ),
    ];
  })();

  const designLines = prunePromptLines([
    ...(_h.isDetailVisualPlanningMode() ? layoutCompLines : []),
    ...instructionItems
      .filter((entry) => {
        const visualFields = ["tone", "bigIdea", "visualMetaphor", "visualStyle", "layoutComposition"];
        if (visualFields.includes(entry.key)) {
          const enabled = isEnabled(state[`${entry.key}Enabled`]);
          const isManual = state[`${entry.key}Mode`] === "manual";
          if (!enabled || !isManual) {
            return false;
          }
          if (_s.appliedConceptStyle && _h.isConceptGeneratedPromptValue(entry.value)) {
            return false;
          }
        }
        return !compositionExcludedKeys.has(entry.key);
      })
      .map((entry) => `${_h.localizeValue(entry.label)}: ${_h.localizeValue(entry.value)}`),
    ...mandatoryElementPlacementLines,
    ...qrCodePromptLines(),
  ]);

  // 비주얼 방향성: bigIdea, visualMetaphor 수동 입력값 + AI 은유 다양성 지시 + 구성 실험 강도/창의성 프로파일 반영
const creativityProfile = CREATIVITY_LEVEL_PROFILES[_s.creativityLevel] || CREATIVITY_LEVEL_PROFILES.balanced;
  const creativityLevelLines = getLocalizedProfileLines(creativityProfile);

  const creativityLines = prunePromptLines([
    (isEnabled(_s.bigIdeaEnabled) && _s.bigIdeaMode === "manual" && _s.bigIdea) ? `${_h.localizeSentence("핵심 개념", "Core concept")}: ${_h.localizeValue(_s.bigIdea)}` : "",
    (isEnabled(_s.visualMetaphorEnabled) && _s.visualMetaphorMode === "manual" && _s.visualMetaphor) ? `${_h.localizeSentence("비주얼 은유", "Visual metaphor")}: ${_h.localizeValue(_s.visualMetaphor)}` : "",
    ...visualMetaphorDiversityLines,
    ...creativityLevelLines,
  ]);

  const backgroundDetailLines = _h.getNonConceptPromptLines(_s.backgroundDetails);
  const backgroundDetailsForPrompt = _h.isBasicVisualPlanningMode()
    ? ""
    : backgroundDetailLines.join("\n");
  const colorLines = prunePromptLines(
    _h.isBasicVisualPlanningMode() && _h.hasBasicConceptPromptInput()
      ? (() => {
          const hasRich = !!trimValue(_s.appliedConceptPromotionPrompt);
          if (hasRich) return [];
          return [
            _h.localizeSentence(
              "색상 출처: 컨셉 제안의 Color System을 기본 모드의 색상 기준으로 사용한다.",
              "Color source: use the concept suggestion's Color System as the basic-mode color standard."
            ),
            _s.appliedConceptPaletteStrategy
              ? `${_h.localizeSentence("컨셉 색상 전략", "Concept color strategy")}: ${_h.localizeValue(_s.appliedConceptPaletteStrategy)}`
              : "",
            _s.appliedConceptPalette
              ? `${_h.localizeSentence("컨셉 팔레트", "Concept palette")}: ${_h.localizeValue(_s.appliedConceptPalette)}`
              : "",
            _h.localizeSentence(
              "헤드라인, 핵심 정보, 행동버튼은 컨셉 팔레트 안에서 가장 높은 대비를 확보하고, 배경·질감·보조 오브젝트는 팔레트의 낮은 대비 색상으로 정리한다.",
              "Keep the headline, key information, and action button in the highest-contrast colors within the concept palette; use lower-contrast palette colors for background, texture, and supporting objects."
            ),
            _h.localizeSentence(
              "위에 명시된 hex 색상값을 정확히 사용한다. AI가 유사한 다른 색상으로 임의 대체하지 않는다.",
              "Use the hex color values specified above exactly as written. Do not substitute with visually similar alternatives."
            ),
          ];
        })()
      : _h.isAiColorStrategy()
      ? [
          `${_h.localizeSentence("색상/배경 전략", "Color and background strategy")}: ${_h.localizeSentence("색상과 배경 모두 AI에게 맡기기", "Let AI direct both the color palette and the background")}`,
          _h.localizeSentence(
            "브랜드 톤, 컨텐츠 유형, CTA 위계에 맞춰 메인/보조/포인트 색상과 배경 색감, 배경 처리 방식을 AI가 함께 설계한다.",
            "Let the model design the primary, secondary, and accent colors together with the background palette and background treatment to match the brand tone, content type, and CTA hierarchy."
          ),
          _h.localizeSentence(
            "색상 수는 3~4개 이내로 절제하고, 강조색은 한 가지 포인트 컬러만 강하게 사용한다.",
            "Keep the palette restrained to roughly 3 to 4 colors and use a single dominant accent color for emphasis."
          ),
          _h.localizeSentence(
            "배경은 단색, 패턴, 이미지, 혼합 중 가장 적절한 방식을 스스로 고르고 텍스트 가독성을 우선해 정리한다.",
            "Choose the most suitable background treatment among solid, pattern, image-led, or mixed approaches while keeping text readability as the first priority."
          ),
        ]
      : [
          `${_h.localizeSentence("색상 전략", "Color strategy")}: ${_h.localizeSentence("직접 지정", "Manual palette")}`,
          _h.isBasicVisualPlanningMode() && _h.hasBasicConceptPromptInput() ? _h.localizeSentence(
            "색상 출처: 컨셉 제안의 Color System을 홍보 이미지용 메인/보조/포인트/배경 색상으로 변환해 적용한다.",
            "Color source: map the concept suggestion's Color System into promotion-image primary, secondary, accent, and background colors."
          ) : "",
          `${_h.localizeSentence("메인 색상", "Primary color")}: ${_h.localizeValue(_s.primaryColor)}`,
          `${_h.localizeSentence("보조 색상", "Secondary color")}: ${_h.localizeValue(_s.secondaryColor)}`,
          `${_h.localizeSentence("포인트 색상", "Accent color")}: ${_h.localizeValue(_s.accentColor)}`,
          `${_h.localizeSentence("배경 처리 방식", "Background treatment")}: ${_h.localizeValue(_h.backgroundModeLabel(_s.backgroundMode))}`,
          _s.backgroundColor ? `${_h.localizeSentence("배경 색상", "Background color")}: ${_h.localizeValue(_s.backgroundColor)}` : "",
          backgroundDetailsForPrompt ? `${_h.localizeSentence("배경 패턴/이미지 지시", "Background pattern/image guidance")}: ${_h.localizeValue(backgroundDetailsForPrompt)}` : "",
          ...getPaletteRoleSplitLines(),
          _h.localizeSentence(
            "색상과 배경값이 고정되어 있어도 레이아웃을 고정하지 않는다. 동일한 팔레트 안에서 화면 분할, 여백 비율, 오브젝트 크롭, 정보 묶음 방식은 선택된 시선 흐름과 구도 전략에 맞춰 변주한다.",
            "Even when color and background values are fixed, do not lock the layout. Within the same palette, vary screen division, whitespace ratio, object cropping, and information grouping according to the selected attention-flow and composition strategy."
          ),
          _h.localizeSentence(
            "위에 명시된 메인·보조·포인트 색상의 hex 값을 정확히 사용한다. AI가 유사한 다른 색상으로 임의 대체하지 않는다.",
            "Use the hex values for primary, secondary, and accent colors exactly as specified above. Do not substitute with visually similar alternatives."
          ),
        ]
  );

  const hasVariationMode = _s.variationMode && _s.variationMode !== "none";

  const compositeQualityLines = [
    ...(hasVariationMode ? [
      _h.localizeSentence(
        "본문 포인트를 동일한 직사각형 카드 2~3개로 반복하지 말고, 겹친 단계 카드, 연결 원형 노드, 타임라인 조각, 비주얼 은유 내부 텍스트 블록처럼 서로 다른 정보 묶음 방식을 허용한다.",
        "Do not repeat body points in identical 2-3 rectangular cards; allow varied groupings such as overlapping step cards, connected circular nodes, timeline fragments, or text blocks embedded in the visual metaphor."
      ),
      _h.localizeSentence(
        "'혜택 카드 3개 + 하단 정보박스' 공식을 반복 금지 패턴으로 취급한다. 정보 항목의 수와 성격에 맞춰 카드 개수, 방향, 밀도, 위치를 콘텐츠에 맞게 설계한다.",
        "Treat the 'three benefit cards plus bottom info box' as an overused pattern. Vary the number, direction, density, and position of information units to fit the actual content."
      ),
      _h.localizeSentence(
        "선택된 변형 방향을 반영해 색면, 크롭, 오브젝트 스케일, 정보 카드 형태, 배경 처리 중 적절한 요소에 변주를 적용한다.",
        "Apply variation to appropriate elements such as color fields, cropping, object scale, card shape, or background treatment in line with the selected composition direction."
      ),
    ] : []),
    _h.localizeSentence(
      "겹쳐지는 레이어 밑에는 부드러운 그림자를 두어 실제 물리적인 깊이감을 형성한다.",
      "Apply subtle drop shadows beneath overlapping layers to establish a realistic sense of physical depth."
    ),
    _h.localizeSentence(
      "글자가 배치되는 뒷배경은 아무런 시각 노이즈가 없는 완전한 평면/단색 상태를 유지하며 복잡한 텍스처는 그래픽 영역에만 허용한다.",
      "Keep the background behind the text clean and plain, reserving complex textures only for the artistic graphic zones."
    ),
    _h.localizeSentence(
      "얕은 피사체 심도(DoF)를 활용해 글자는 아주 또렷하게 표현하고 배경 그래픽 요소는 부드럽게 흐리게 처리한다.",
      "Use slight depth of field to keep the text in sharp focus while making the distant background elements softly out of focus."
    ),
    _h.localizeSentence(
      "중앙 비주얼 오브젝트와 그래픽 요소가 인위적인 둥근 테두리 박스에 갇히지 않도록 하고 전체 배경과 유기적으로 블렌딩(blending)되어야 한다.",
      "Ensure the central visual object and graphic elements are organically blended with the overall background, without being enclosed in an isolated border frame or box."
    ),
    _h.localizeSentence(
      "평평한 격리형 레이아웃을 지양하고, 다층적인 사선 분할이나 오버랩을 활용해 다채롭고 조화로운 공간감을 구현한다.",
      "Avoid flat isolated layouts; implement multi-layered overlapping where elements blend seamlessly across spatial segments for a dynamic sense of depth."
    ),
    _h.localizeSentence(
      "공간 깊이를 세 레이어로 구분한다 — 전경(포커스 대상·CTA·핵심 텍스트) / 중경(보조 비주얼·컨셉 키비주얼) / 원경(배경 분위기·컬러워시·질감). 각 레이어 간 깊이 차이를 명확히 표현한다.",
      "Structure the visual space across three depth layers — foreground (focal subject, CTA, key text) / midground (supporting visual, concept key visual) / background (atmosphere, color wash, texture). Make the depth separation between layers visually distinct."
    ),
  ];

  const relaxQualityLinesForNonPhoto = (lines) => {
    if (_s.targetEngine !== "imagen") return lines;
    const isNonPhoto = /game|craft|illustration|pixel|doodle|comic|retro|clay|pop|flat|art/i.test(_s.appliedConceptCategory || "") ||
                       /game|craft|illustration|pixel|doodle|comic|retro|clay|pop|flat|art/i.test(_s.appliedConceptStyle || "") ||
                       /game|craft|illustration|pixel|doodle|comic|retro|clay|pop|flat|art/i.test(_s.visualStyle || "");
    if (!isNonPhoto) return lines;
    return lines.map((line) => {
      let l = line;
      l = l.replace(/\bphotorealistic\b/gi, "high-fidelity graphic");
      l = l.replace(/\bphotograph(y)?\b/gi, "stylized graphic design");
      l = l.replace(/\brealistic photo(s)?\b/gi, "stylized digital representation");
      l = l.replace(/\brealistic depth\b/gi, "harmonious stylized depth");
      l = l.replace(/\brealistic lighting\b/gi, "stylized lighting");
      l = l.replace(/\bcamera lens(es)?\b/gi, "clean digital composition");
      l = l.replace(/\bdslr\b/gi, "digital rendering tool");
      l = l.replace(/\bsubsurface scattering\b/gi, "stylized material texture");
      l = l.replace(/\brealistic material\b/gi, "concept-native texture");
      return l;
    });
  };

  const qualityNoteLines = _h.getNonConceptPromptLines(_s.qualityNotes);
  const qualityLines = relaxQualityLinesForNonPhoto(prunePromptLines([
    ..._h.getDefaultQualityTagLines(),
    ...compositeQualityLines,
    ...getConceptQualityLines(),
    ...splitQualityNoteLines(qualityNoteLines.join("\n")).map((item) => _h.localizeValue(item)),
  ]));

  const variationLines = (() => {
    const seed = VARIATION_SEEDS.find((s) => s.id === _s.variationMode);
    if (!seed) return [];
    const label = _h.localizeSentence(seed.labelKo, seed.labelEn);
    const lines = _s.outputLanguage === "en" ? seed.linesEn
      : _s.outputLanguage === "bilingual"
        ? seed.linesKo.map((ko, i) => `${ko} / ${seed.linesEn[i] || ko}`)
        : seed.linesKo;
    return prunePromptLines([
      _h.localizeSentence(`비주얼 구성 방향: ${label}`, `Visual composition direction: ${label}`),
      ...lines,
    ]);
  })();

  // 키비주얼 배치 — 상세 모드 + auto 아닐 때만 발동
  const keyVisualPlacementLines = (() => {
    if (!_h.isDetailVisualPlanningMode()) return [];
    const placement = _s.keyVisualPlacement;
    if (!placement || placement === "auto") return [];

    if (placement === "background") {
      return prunePromptLines([
        _h.localizeSentence("키비주얼 배치: 배경 처리", "Key visual placement: background layer"),
        _h.localizeSentence(
          "키비주얼·비주얼 오브젝트는 배경층(color wash, 반투명 이미지, 질감 레이어)에만 배치하고, 전경에 독립 오브젝트로 등장하지 않는다.",
          "Place the key visual and visual objects only in the background layer as color washes, semi-transparent images, or texture layers; they must not appear as standalone foreground objects."
        ),
        _h.localizeSentence(
          "전경은 헤드라인·정보 카드·CTA 텍스트 위계가 완전히 점유하며, 어떤 비주얼 오브젝트도 텍스트 가독성을 방해하는 위치에 오지 않는다.",
          "The foreground is fully occupied by the headline, information card, and CTA hierarchy; no visual object may obstruct text readability."
        ),
        _h.localizeSentence(
          "배경 비주얼의 채도·명도를 낮추거나 가우시안 블러·반투명 오버레이를 적용해 텍스트와의 명도 대비를 확보한다.",
          "Reduce the saturation and brightness of the background visual, or apply a Gaussian blur or semi-transparent overlay to ensure adequate contrast between background and text."
        ),
        _h.localizeSentence(
          "콘텐츠 정보의 명확성을 최우선으로 하며, 배경은 분위기·브랜드 인상만 전달하는 보조 역할을 한다.",
          "Content clarity is the top priority; the background serves only to convey atmosphere and brand impression."
        ),
      ]);
    }

    if (placement === "foreground") {
      return prunePromptLines([
        _h.localizeSentence("키비주얼 배치: 전면 배치", "Key visual placement: foreground"),
        _h.localizeSentence(
          "키비주얼·비주얼 오브젝트를 전경 중심에 강하게 배치하고, 시선이 비주얼 → 헤드라인 → CTA 순으로 흐르도록 설계한다.",
          "Place the key visual and visual objects prominently in the foreground center; design the eye flow as visual → headline → CTA."
        ),
        _h.localizeSentence(
          "텍스트는 비주얼 오브젝트 주변(상단·하단·측면)에 배치하며 오브젝트와 충돌하지 않게 공간을 나눈다.",
          "Position text around the visual object (above, below, or to the side) and divide the space to prevent collision between text and object."
        ),
        _h.localizeSentence(
          "배경은 비주얼 오브젝트를 돋보이게 하는 보조 역할로만 처리하며, 배경 요소가 오브젝트의 실루엣과 경쟁하지 않도록 한다.",
          "Treat the background as a supporting layer that makes the visual object stand out; background elements must not compete with the object's silhouette."
        ),
      ]);
    }

    return [];
  })();

  const sections = [
    { priority: 10, title: _h.localizeHeading("출력 대상", "Output target"), lines: targetLines },
    { priority: 15, title: _h.localizeHeading("광고 전략", "Promotion strategy"), lines: promotionStrategyLines },
    { priority: 17, title: _h.localizeHeading("비주얼 컨셉", "Visual concept"), lines: conceptStyleLine },
    { priority: 18, title: _h.localizeHeading("캠페인 적응 지시", "Campaign adaptation"), lines: conceptBridgeLines },
    // 이미지 원문 텍스트: 컨셉 직후 배치 — 무엇을 보여줄지 확정 후 나머지 규칙 적용
    { priority: 20, title: _h.localizeHeading("이미지 원문 텍스트", "On-image copy"), lines: [...directTextLines, ...informationItemLayoutLines] },
    // AI 생성 지시: 텍스트 확정 후 — 무엇을 생성할지 알고 난 뒤 규칙 진입
    { priority: 28, title: _h.localizeHeading("AI 생성 지시", "AI generation tasks"), lines: [...aiAutoLines, ...conceptAutoAlignmentLines] },
    { priority: 35, title: _h.localizeHeading("상업 품질 기준", "Commercial baseline"), lines: commercialLines },
    { priority: 40, title: _h.localizeHeading("금지 조건", "Prohibited elements"), lines: hardConstraintLines },
    { priority: 45, title: _h.localizeHeading("시선 흐름", "Attention flow"), lines: attentionFlowLines },
    { priority: 50, title: _h.localizeHeading("레이아웃 구성", "Layout & composition"), lines: resolveConflictLines(designLines, lint) },
    { priority: 60, title: _h.localizeHeading("비주얼 방향성", "Visual direction"), lines: creativityLines },
    { priority: 65, title: _h.localizeHeading("비주얼 구성 방향", "Visual composition direction"), lines: variationLines },
    { priority: 67, title: _h.localizeHeading("키비주얼 배치", "Key visual placement"), lines: keyVisualPlacementLines },
    { priority: 70, title: _h.localizeHeading("색상 시스템", "Color system"), lines: colorLines },
    { priority: 80, title: _h.localizeHeading("이미지 품질 기준", "Image quality standards"), lines: qualityLines },
    { priority: 90, title: _h.localizeHeading("제외할 표현", "Negative prompt"), lines: negativePromptLines },
  ];

  const seenLines = new Set();
  return sections
    .map((section) => ({
      ...section,
      lines: finalizePromptLines(section.lines).filter((line) => {
        const normalized = normalizePromptLineForDedupe(line);
        if (!normalized || seenLines.has(normalized)) return false;
        seenLines.add(normalized);
        return true;
      }),
    }))
    .filter((section) => section.lines.length > 0);
}

function buildTextLanguageDirective() {
  if (_s.targetEngine === "imagen") {
    return _h.localizeSentence(
      " 텍스트 가독성을 최우선하여, 글자가 배치될 영역에는 시각 노이즈나 복잡한 패턴을 전면 배제하고 완전한 여백으로 처리하라.",
      " Prioritize text readability: ensure areas reserved for text overlays are completely free of visual noise, cluttered patterns, or high-contrast background elements."
    );
  }
  // 영문 전용 또는 한영 병기 모드에서는 언어 강제 규칙을 삽입하지 않는다
  if (_s.outputLanguage === "en" || _s.outputLanguage === "bilingual") return "";
  return _h.localizeSentence(
    "이미지 안에 렌더링되는 텍스트(헤드라인, 서브카피, CTA, 본문 포인트 등)는 사용자가 입력한 원문 언어 그대로 표기한다. 입력값이 한국어이면 한국어로, 영어이면 영어로 렌더링하고, AI가 임의로 번역하거나 다른 언어로 전환하지 않는다. 해시태그는 입력된 언어와 표기 방식을 유지한다.",
    "Render all on-image text (headline, sub-copy, CTA, body points, etc.) exactly in the language the user provided — Korean stays Korean, English stays English. Do not translate or switch languages arbitrarily. Hashtags follow the same rule and retain their original language and format."
  );
}

function getPriorityTierName(priority) {
  const p = Number(priority || 0);
  if (p < 30) return { ko: "우선순위 1: Critical", en: "Priority 1: Critical" };
  if (p < 60) return { ko: "우선순위 2: High", en: "Priority 2: High" };
  return { ko: "우선순위 3: Medium", en: "Priority 3: Medium" };
}

function buildPriorityTierDirective() {
  if (_s.targetEngine === "imagen") {
    return _h.localizeSentence(
      " 이미지는 복잡한 지시문 조건보다 시각적 아름다움, 질감, 그리고 텍스트가 배치될 영역의 완전한 평면성과 여백 확보를 최우선으로 하여 생성하라.",
      " Focus on visual elegance, texture rendering, and reserving clean negative spaces for text overlays over strict constraint checklist matching."
    );
  }
  return _h.localizeSentence(
    " 정의된 우선순위 등급(Critical > High > Medium)을 엄격히 준수하여 이미지를 생성하라. 만약 비주얼 스타일이나 배경이 글자 배치 및 정보 보드 구조와 충돌할 경우, 최우선순위(Critical) 지시가 다른 모든 지시보다 최우선으로 적용되어 가독성을 침해해선 안 된다.",
    " Follow the directives in strict order of the defined Priority Tiers (Critical > High > Medium). If visual style or background elements conflict with text placement or board structures, Priority 1 (Critical) directives MUST override all other instructions to ensure readability."
  );
}

function buildRoleStatement() {
  const contentName = _s.contentType !== "none"
    ? _h.localizeSentence(
        CONTENT_TYPE_TEMPLATES[_s.contentType]?.name || "",
        CONTENT_TYPE_TEMPLATES_EN[_s.contentType]?.name || ""
      )
    : "";
  const assetLabel = _h.localizeSentence(ASSET_LABELS[_s.assetType], ASSET_PROMPT_TARGET_EN[_s.assetType] || ASSET_LABELS[_s.assetType]);
  const langDirective = buildTextLanguageDirective();
  const priorityDirective = buildPriorityTierDirective();
  const goalValue = trimValue(_s.goal || CONTENT_TYPE_TEMPLATES[_s.contentType]?.goal || "");
  const audienceValue = trimValue(_s.audience || CONTENT_TYPE_TEMPLATES[_s.contentType]?.audience || "");
  const missionBits = [
    goalValue ? _h.localizeSentence(`목적: ${goalValue}`, `goal: ${goalValue}`) : "",
    audienceValue ? _h.localizeSentence(`타깃: ${audienceValue}`, `audience: ${audienceValue}`) : "",
  ].filter(Boolean).join(" / ");
  const conceptDirective = _h.isBasicVisualPlanningMode() && _h.hasBasicConceptPromptInput()
    ? _h.localizeSentence(
        ` 아래 홍보 전략 섹션의 목적·타깃이 메시지 기준이다. 적용된 컨셉은 선택 사항이 아니라 결과물의 시각 DNA로 사용한다. 텍스트 정확성·헤드라인 판독성·CTA 집중도는 어떤 컨셉 요소보다 우선한다.`,
        ` The Promotion strategy section below defines the campaign mission and target audience. The applied concept is the visual DNA — not optional. Text accuracy, headline readability, and CTA focus take priority over any concept element.`
      )
    : "";
  if (contentName) {
    return _h.localizeSentence(
      `아래 지시에 따라 [${contentName}] 목적의 ${assetLabel}를 생성하라. 상업 광고 수준의 완성도, 텍스트 정확성, 레이아웃 위계, 브랜드 일관성을 동시에 충족해야 한다.${conceptDirective}${langDirective ? ` ${langDirective}` : ""}${priorityDirective}`,
      `Generate a ${assetLabel} for [${contentName}] following the instructions below. It must achieve campaign-grade commercial polish, exact text fidelity, strong layout hierarchy, and brand consistency at the same time.${conceptDirective}${langDirective ? ` ${langDirective}` : ""}${priorityDirective}`
    );
  }
  return _h.localizeSentence(
    `아래 지시에 따라 ${assetLabel}를 생성하라. 상업 광고 수준의 완성도, 텍스트 정확성, 레이아웃 위계, 브랜드 일관성을 동시에 충족해야 한다.${conceptDirective}${langDirective ? ` ${langDirective}` : ""}${priorityDirective}`,
    `Generate a ${assetLabel} following the instructions below. It must achieve campaign-grade commercial polish, exact text fidelity, strong layout hierarchy, and brand consistency at the same time.${conceptDirective}${langDirective ? ` ${langDirective}` : ""}${priorityDirective}`
  );
}

function getRecommendedCompositionDirective() {
  const bodyCount = normalizeLines(_s.bodyCopy).length;
  if (_s.contentType === "survey-request") {
    return _h.localizeSentence(
      isEnabled(_s.qrEnabled)
        ? "이번 입력의 추천 구도는 타이포그래피 중심 정보형이다. 큰 헤드라인과 짧은 참여 동기를 먼저 읽히게 하고, 기간·대상·소요시간·QR 참여는 작은 배지나 사이드 레일로 정리한다."
        : "이번 입력의 추천 구도는 타이포그래피 중심 정보형이다. 큰 헤드라인과 짧은 참여 동기를 먼저 읽히게 하고, 기간·대상·소요시간·참여 방법은 작은 배지나 사이드 레일로 정리한다.",
      isEnabled(_s.qrEnabled)
        ? "For this input, use a typography-led information composition. Make the large headline and short participation motive read first, then organize period, audience, duration, and QR participation as small badges or a side rail."
        : "For this input, use a typography-led information composition. Make the large headline and short participation motive read first, then organize period, audience, duration, and participation method as small badges or a side rail."
    );
  }
  if (_s.contentType === "event-info") {
    return _h.localizeSentence(
      isEnabled(_s.qrEnabled)
        ? "이번 입력의 추천 구도는 분할 화면 정보형이다. 행사명·일시·장소를 가장 먼저 읽히게 하고, 신청/QR/부가 혜택은 보조 정보 레일로 분리한다."
        : "이번 입력의 추천 구도는 분할 화면 정보형이다. 행사명·일시·장소를 가장 먼저 읽히게 하고, 신청 방법과 부가 혜택은 보조 정보 레일로 분리한다.",
      isEnabled(_s.qrEnabled)
        ? "For this input, use a split-screen information composition. Make event title, date, and venue read first, then separate application, QR, and supporting benefits into a secondary information rail."
        : "For this input, use a split-screen information composition. Make event title, date, and venue read first, then separate application method and supporting benefits into a secondary information rail."
    );
  }
  if (bodyCount >= 4) {
    return _h.localizeSentence(
      "이번 입력의 추천 구도는 헤드라인 분리형 사이드 정보 레일이다. 본문 정보가 많으므로 세부 항목은 한쪽 레일에 촘촘히 묶고, 헤드라인과 메인 비주얼 영역은 크게 분리한다.",
      "For this input, use a headline-separated side information rail. Because there are many body details, group details densely in one side rail while reserving a large separate headline and main-visual zone."
    );
  }
  return _h.localizeSentence(
    "이번 입력의 추천 구도는 타이포그래피 중심 키비주얼이다. 헤드라인과 행동 유도 요소를 가장 큰 시선축으로 두고, 컨셉 오브젝트는 메시지를 보조하는 한 개의 상징으로 제한한다.",
    "For this input, use a typography-led key visual. Treat the headline and action prompt as the largest eye-flow axis, and limit concept objects to one symbol that supports the message."
  );
}

function shouldSkipOptimizedLine(line) {
  const trimmed = String(line || "").trim();
  return /^(패턴 [A-D]|Pattern [A-D]|타임라인 리본|세로 마일스톤|방사형 정보|대각선 스텝|사이드 정보|배지 스택|비주얼 내장|컴팩트 표|Asymmetrical axis|Split-screen|Typography-led|Radial composition|Diagonal progression)/.test(trimmed)
    || /생성할 때마다 아래|For each generation|무작위로 선택|randomly choose|정확히 하나 또는 서로 보완|one or two complementary/i.test(trimmed)
    || /동일한 입력을 다시 생성|When regenerating the same input|같은 입력값이라도|Even with the same inputs/i.test(trimmed)
    || /chaos|stylize|variation|혜택 카드 3개|three benefit cards/i.test(trimmed)
    || /아래 표현 방식|presentation formats below|아래 시선 흐름|attention-flow patterns below/i.test(trimmed);
}


function renderReviewPrompt(validation, lint) {
  const sections = createPromptSections(validation, lint);
  const intro = [
    `# ${_h.localizeHeading("홍보이미지 생성 프롬프트", "Promotion Image Generation Prompt")}`,
    "",
    `## ${_h.localizeHeading("생성 지시", "Generation directive")}`,
    buildRoleStatement(),
  ];

  const sectionLines = sections.flatMap((section) => {
    const tier = getPriorityTierName(section.priority);
    const tierPrefix = _s.outputLanguage === "en" ? `[${tier.en}] ` : `[${tier.ko}] `;
    return [
      "",
      `## ${tierPrefix}${section.title}`,
      ...finalizePromptLines(section.lines.flatMap((line) => line.split(/\r?\n/)))
        .map((line) => {
          const t = line.trim();
          if (/^\[.+\]$/.test(t)) return `### ${t.slice(1, -1)}`;
          return `- ${t.replace(/^-\s*/, "")}`;
        }),
    ];
  });

  const footer = [
    "",
    `## ${_h.localizeHeading("적용 우선순위", "Priority order")}`,
    _h.localizeSentence("- 이미지 내 텍스트 언어 규칙 및 금지 조건 준수", "- On-image text language rule (Korean only) and all prohibited elements"),
    ...(_s.appliedConceptStyle
      ? [_h.localizeSentence("- 적용된 비주얼 컨셉의 시각 언어 준수", "- Applied concept visual language (Visual concept section)")]
      : []),
    _h.localizeSentence("- AI 생성 항목(CTA·오퍼) 적절히 생성 후 배치", "- AI generation tasks: generate action button and offer items and place them appropriately"),
    _h.localizeSentence("- 시선 흐름 패턴에 따른 텍스트 위계와 가독성 유지", "- Maintain text hierarchy and readability according to the attention flow pattern"),
    _h.localizeSentence("- 상업 품질 기준 및 비주얼 방향성 반영", "- Commercial baseline and visual direction"),
    _h.localizeSentence("- 레이아웃 구성 및 비주얼 구성 방향 반영", "- Layout & composition and visual composition direction"),
    _h.localizeSentence("- 색상 시스템 일관성 및 이미지 품질 기준 반영", "- Color system consistency and image quality standards"),
  ];

  const rawPrompt = sanitizePromptForUniversal([...intro, ...sectionLines, ...footer].join("\n"));
  return _s.targetEngine === "imagen" ? sanitizePromptForImagen(rawPrompt) : rawPrompt;
}

function renderOptimizedPrompt(validation, lint) {
  const sections = createPromptSections(validation, lint);
  const assetLabelEn = ASSET_PROMPT_TARGET_EN[_s.assetType] || ASSET_LABELS[_s.assetType];
  const contentNameEn = _s.contentType !== "none" ? (CONTENT_TYPE_TEMPLATES_EN[_s.contentType]?.name || "") : "";
  const contentNameKo = _s.contentType !== "none" ? (CONTENT_TYPE_TEMPLATES[_s.contentType]?.name || "") : "";
  const priorityTierDirective = buildPriorityTierDirective();
  
  const optimizedIntro = [
    _h.localizeSentence(
      contentNameKo
        ? `[${contentNameKo}] 목적의 고품질 홍보 이미지를 생성하라. 상업 광고 수준의 완성도, 텍스트 정확성, 레이아웃 위계, 브랜드 일관성을 동시에 충족해야 한다.${priorityTierDirective}`
        : `고품질 홍보 이미지를 생성하라. 상업 광고 수준의 완성도, 텍스트 정확성, 레이아웃 위계, 브랜드 일관성을 동시에 충족해야 한다.${priorityTierDirective}`,
      contentNameEn
        ? `Generate a premium ${assetLabelEn} for [${contentNameEn}] following the instructions below. It must achieve campaign-grade commercial polish, exact text fidelity, strong layout hierarchy, and brand consistency at the same time.${priorityTierDirective}`
        : `Generate a premium ${assetLabelEn} following the instructions below. It must achieve campaign-grade commercial polish, exact text fidelity, strong layout hierarchy, and brand consistency at the same time.${priorityTierDirective}`
    ),
    _h.localizeSentence(
      "텍스트 정확성, 타이포그래피 위계, 레이아웃 명확성, CTA 집중도를 최우선으로 처리하라.",
      "Prioritize exact text fidelity, typography hierarchy, layout clarity, and strong CTA focus."
    ),
    _h.localizeSentence(
      "평범한 템플릿형 안내 이미지로 만들지 말고, 타이포그래피 중심·상징 오브젝트 중심·공간 분할 중심 중 하나의 광고 콘셉트를 과감하게 선택해 차별화된 결과를 만든다.",
      "Do not produce a generic template-like notice image; decisively choose one advertising concept such as typography-led, symbolic-object-led, or spatially split composition to create a distinctive result."
    ),
    _h.localizeSentence(
      "창의성은 장식 추가가 아니라 시선 흐름, 크롭, 여백, 오브젝트 스케일, 정보 카드 구조의 변주로 표현한다.",
      "Express creativity through variation in eye flow, cropping, whitespace, object scale, and information-card structure rather than by adding decoration."
    ),
    getRecommendedCompositionDirective(),
    ...(_s.outputLanguage !== "en"
      ? [_h.localizeSentence(
          "이미지 내 모든 텍스트는 한국어로만 표기하고, 영어로 번역하거나 영문을 병기하지 않는다.",
          "All on-image text must be in Korean only — do not translate or add English."
        )]
      : []),
  ];

  const sectionLines = sections.flatMap((section) => {
    const lines = finalizePromptLines(section.lines)
      .flatMap((line) => line.split(/\r?\n/))
      .filter((line) => !shouldSkipOptimizedLine(line.trim()))
      .map((line) => `- ${line.replace(/^\d+\.\s*/, "").trim().replace(/^-\s*/, "")}`);
    
    if (lines.length === 0) return [];
    
    const tier = getPriorityTierName(section.priority);
    const tierPrefix = _s.outputLanguage === "en" ? `[${tier.en}] ` : `[${tier.ko}] `;
    
    return [
      "",
      `## ${tierPrefix}${section.title}`,
      ...lines
    ];
  });

  const rawPrompt = sanitizePromptForUniversal(prunePromptLines([...optimizedIntro, ...sectionLines]).join("\n"));
  return _s.targetEngine === "imagen" ? sanitizePromptForImagen(rawPrompt) : rawPrompt;
}

function sanitizePromptForAI(text) {
  // "CTA"를 그대로 두면 이미지 생성 AI가 해당 문자열을 이미지에 직접 렌더링하는 오류 발생.
  // 단어 경계 기준으로 치환해 AI가 개념으로 이해하도록 유도.
  return text.replace(/\bCTA\b/g, "action button");
}
  return {
    init: _init,
    createPromptSections,
    renderReviewPrompt,
    renderOptimizedPrompt,
    sanitizePromptForAI,
    conceptPromptPartsFromStyle,
    applyConceptPartsToState,
    getContentConceptBridgeOverrides,
    prunePromptLines,
    finalizePromptLines,
    resolveConflictLines,
    getAppliedConceptLines,
    getConceptBridgeLines,
    getPaletteRoleSplitLines,
    getConceptQualityLines,
    qrCodePromptLines,
    buildRoleStatement,
    buildTextLanguageDirective,
    getRecommendedCompositionDirective,
    shouldSkipOptimizedLine,
    getConceptAwareAutoDirective,
    shouldRestrictAiAutoForCurrentInput,
  };
})();
