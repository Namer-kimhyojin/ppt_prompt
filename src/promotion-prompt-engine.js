// src/promotion-prompt-engine.js
// Loaded AFTER promotion-data.js, promotion-utils.js, promotion-i18n.js
// window.PROMO_PROMPT.init(state, helpers) must be called by promotion.js init()

window.PROMO_PROMPT = (function () {
  const {
    COMMERCIAL_BASELINE_PROFILES,
    CREATIVITY_LEVEL_PROFILES,
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
    normalizeImageTextLines,
    formatImageTextHierarchy,
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

  function prunePromptLines(lines) {
    const result = [];
    const seen = new Set();
    (Array.isArray(lines) ? lines : [lines]).forEach((line) => {
      const value = String(line || "").trim();
      if (!value) return;
      const key = normalizePromptLineForDedupe(value);
      if (isEnabled(_s.dedupePromptLines) && key) {
        if (seen.has(key)) return;
        seen.add(key);
      }
      result.push(value);
    });
    return result;
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

function adaptLayoutLinesForCta(lines, isCtaActive) {
  if (isCtaActive) return lines;
  return lines
    .map((line) => {
      if (line.startsWith("Visual priority:")) {
        const prefix = "Visual priority:";
        const itemsStr = line.slice(prefix.length).trim().replace(/\.$/, "");
        const items = itemsStr.split(/,\s*/);
        const filteredItems = items.filter((item) => !/\bCTA\b/i.test(item));
        const reindexedItems = filteredItems.map((item, idx) => {
          const cleanItem = item.replace(/^\d+\.\s*/, "");
          return `${idx + 1}. ${cleanItem}`;
        });
        return `${prefix} ${reindexedItems.join(", ")}.`;
      }
      if (line.startsWith("Recommended eye flow:")) {
        let updated = line
          .replace(/\s*(?:->|→)\s*CTA\s+button/gi, "")
          .replace(/\s*(?:->|→)\s*CTA/gi, "")
          .trim();
        if (line.endsWith(".") && !updated.endsWith(".")) {
          updated += ".";
        }
        return updated;
      }
      const sentences = line.split(/(?<=\.)\s+/);
      const filteredSentences = sentences.filter((sentence) => {
        const hasCta = /\bCTA\b/i.test(sentence);
        if (hasCta) {
          if (
            /Place the CTA/i.test(sentence) ||
            /The CTA button should/i.test(sentence) ||
            /Do not make the CTA/i.test(sentence) ||
            /CTA must/i.test(sentence)
          ) {
            return false;
          }
        }
        return true;
      });
      if (filteredSentences.length === 0) return null;
      let reconstructedLine = filteredSentences.join(" ");
      reconstructedLine = reconstructedLine
        .replace(/,\s*and\s+CTA\b/gi, "")
        .replace(/,\s*CTA\b/gi, "")
        .replace(/\bCTA\s+text\s+must\s+remain\s+easy/gi, "text must remain easy")
        .replace(/\bCTA\s+button\b/gi, "button")
        .replace(/\bCTA\b/gi, "action element");
      return reconstructedLine;
    })
    .filter((line) => line !== null);
}

function buildCustomLayoutLines(tw, vw, iw) {
  // Sliders are independent 0-100 emphasis weights. Normalize them only to
  // describe relative visual influence; never treat the result as canvas acreage.
  const total = tw + vw + iw;
  let ntw, nvw, niw, nbw;
  if (total === 0) {
    ntw = nvw = niw = 0; nbw = 100;
  } else if (total <= 100) {
    ntw = tw; nvw = vw; niw = iw;
    nbw = 100 - total;
  } else {
    ntw = Math.round(tw / total * 100);
    nvw = Math.round(vw / total * 100);
    niw = Math.round(iw / total * 100);
    nbw = Math.max(0, 100 - ntw - nvw - niw);
  }

  const slots = [
    { key: "title",  w: ntw, label: "headline/title presence" },
    { key: "visual", w: nvw, label: "key visual presence" },
    { key: "info",   w: niw, label: "information hierarchy" },
    { key: "bg",     w: nbw, label: "atmosphere and breathing room" },
  ].sort((a, b) => b.w - a.w);

  const [first, second] = slots;
  const emphasisProfile = slots.map((s, i) => `${i + 1}. ${s.label} ${s.w}/100`).join(", ");

  const isStrict = isEnabled(_s.layoutStrictSeparation);

  const emphasisInstructions = {
    title: `Headline/title influence is ${ntw}/100. Express it through typographic scale, contrast, rhythm, and its role as the reading entry point; let visual contours, color fields, or negative space frame and echo the type instead of creating a separate title slab.`,
    visual: `Key visual influence is ${nvw}/100. Give it the strongest appropriate focal presence through crop, scale, lighting, detail, and subject placement; nest copy and information along usable negative space, contours, or perspective cues rather than isolating them in another panel.`,
    info: `Information influence is ${niw}/100. Express it through legible grouping, scale changes, density, repetition, and a clear reading sequence; anchor labels and facts to relevant visual features instead of turning every item into an equal standalone card.`,
    bg: `Atmosphere and breathing-room influence is ${nbw}/100. Use intentional negative space, texture, tonal transitions, and peripheral motifs to unify the eye path; breathing room must feel composed and connected, never like unused empty canvas.`,
  };

  const lines = [
    isStrict
      ? "LAYOUT MODE: CUSTOM EMPHASIS WITH TEXT PROTECTION. Respect the hierarchy while protecting copy on calm local surfaces."
      : "LAYOUT MODE: ORGANIC CUSTOM EMPHASIS. Translate the requested hierarchy into one continuous, art-directed composition.",
    `USER EMPHASIS PROFILE (relative visual influence, not geometric partitions) — ${emphasisProfile}.`,
    "Treat these scores as guidance for scale, contrast, density, repetition, crop, and viewing time. Honor their ranking and overall balance, then adapt locally to actual copy volume, legibility, and the visual's natural geometry. Never convert them into exact canvas percentages, fixed-width bands, equal columns, or visibly separated blocks, and never invent filler just to satisfy a score.",
    emphasisInstructions[first.key],
  ];

  if (second && second.w >= 10) {
    lines.push(emphasisInstructions[second.key]);
  }

  const dominant = first.key;
  const weak = slots.filter(s => s.w <= 10).map(s => s.label);

  if (dominant === "title") {
    lines.push("Because the headline leads, let the visual support its silhouette, cadence, or negative space while remaining clearly recognizable; do not solve the hierarchy with a detached top banner.");
  } else if (dominant === "visual") {
    lines.push("Because the key visual leads, use its silhouette, gaze, motion, crop edge, or perspective to carry the reader toward copy and information; do not solve the hierarchy with a separate text strip.");
  } else if (dominant === "info") {
    lines.push("Because information leads, build a varied but coherent reading rhythm around the visual, using shared baselines, recurring shapes, and localized contrast; avoid a wall of uniform cards.");
  } else if (dominant === "bg") {
    lines.push("Because atmosphere and breathing room lead, let tonal flow, texture, and negative space bind the headline, visual, and information into a few purposeful anchors rather than leaving a sparse backdrop with disconnected objects.");
  }

  if (weak.length) {
    lines.push(`Quieter supporting roles (${weak.join(", ")}) must remain recognizable and functional. Use them as connective cues without letting them compete, disappear, or become isolated token boxes.`);
  }

  lines.push(isStrict
    ? "The text-protection option permits calm high-contrast local surfaces where needed, but it still does not justify rigid proportional slices. Connect protected copy areas through shared axes, continued crops, repeated palette, and consistent spacing rhythm."
    : "Organic integration is the default: share alignment axes and negative space, echo colors and shapes, and allow selected edge overlaps. The result must read as one composition rather than visibly partitioned sections.");
  return lines;
}

const ORGANIC_LAYOUT_COMPOSITION_PROFILES = {
  title_focus: {
    linesKo: [
      "ORGANIC TITLE-DRIVEN INTEGRATION: Make the headline the first read through scale, contrast, and rhythm, while key-visual contours, color fields, and negative space frame or pass behind selected type edges; do not place it in a detached title band.",
      "GENTLE TRANSITIONS: Preserve legibility with localized tonal control, subtle masks, or calm negative space, while recurring motifs and shared alignment bind typography to the visual scene.",
      "Guide the eye from headline to supporting copy, relevant information, and CTA along one continuous path; use compact clusters near related imagery rather than a stack of separate rows.",
    ],
    linesEn: [
      "ORGANIC TITLE-DRIVEN INTEGRATION: Make the headline the first read through scale, contrast, and rhythm, while key-visual contours, color fields, and negative space frame or pass behind selected type edges; do not place it in a detached title band.",
      "GENTLE TRANSITIONS: Preserve legibility with localized tonal control, subtle masks, or calm negative space, while recurring motifs and shared alignment bind typography to the visual scene.",
      "Guide the eye from headline to supporting copy, relevant information, and CTA along one continuous path; use compact clusters near related imagery rather than a stack of separate rows.",
    ]
  },
  visual_focus: {
    linesKo: [
      "ORGANIC VISUAL-DRIVEN INTEGRATION: Give the key visual the strongest focal presence, then use its silhouette, gaze, motion, crop edge, or perspective to create natural resting places for headline and information.",
      "SMOOTH COEXISTENCE: Blend copy into usable negative space with localized contrast, tonal masks, or restrained color fields; avoid isolated boxes, a detached headline strip, and a separate information footer.",
      "Let supporting copy, facts, and CTA follow the visual's internal direction and share its alignment cues so every element feels embedded in the same scene.",
    ],
    linesEn: [
      "ORGANIC VISUAL-DRIVEN INTEGRATION: Give the key visual the strongest focal presence, then use its silhouette, gaze, motion, crop edge, or perspective to create natural resting places for headline and information.",
      "SMOOTH COEXISTENCE: Blend copy into usable negative space with localized contrast, tonal masks, or restrained color fields; avoid isolated boxes, a detached headline strip, and a separate information footer.",
      "Let supporting copy, facts, and CTA follow the visual's internal direction and share its alignment cues so every element feels embedded in the same scene.",
    ]
  },
  info_focus: {
    linesKo: [
      "ORGANIC INFORMATION-FIRST INTEGRATION: Make information the primary reading experience through scale changes, density, repetition, and clear grouping, while anchoring each cluster to a relevant visual cue rather than a uniform card grid.",
      "INTEGRATED STRUCTURE: Thread the key visual, ambient motifs, and color rhythm between information groups, using localized contrast so structure remains clear without boxing every item.",
      "Keep headline, supporting visual, facts, and CTA on one connected eye path with varied pacing; avoid a narrow title strip above a separate data block.",
    ],
    linesEn: [
      "ORGANIC INFORMATION-FIRST INTEGRATION: Make information the primary reading experience through scale changes, density, repetition, and clear grouping, while anchoring each cluster to a relevant visual cue rather than a uniform card grid.",
      "INTEGRATED STRUCTURE: Thread the key visual, ambient motifs, and color rhythm between information groups, using localized contrast so structure remains clear without boxing every item.",
      "Keep headline, supporting visual, facts, and CTA on one connected eye path with varied pacing; avoid a narrow title strip above a separate data block.",
    ]
  },
  title_info_hybrid: {
    linesKo: [
      "ORGANIC TITLE + INFORMATION INTEGRATION: Give headline and information comparable influence through shared alignment, typographic rhythm, recurring color, and related scale changes; do not turn that balance into equal bands or separate slabs.",
      "BOUNDLESS FLOW: Let the visual concept weave behind, beside, and occasionally across selected edges of both text roles, connecting them as one continuous reading sequence.",
    ],
    linesEn: [
      "ORGANIC TITLE + INFORMATION INTEGRATION: Give headline and information comparable influence through shared alignment, typographic rhythm, recurring color, and related scale changes; do not turn that balance into equal bands or separate slabs.",
      "BOUNDLESS FLOW: Let the visual concept weave behind, beside, and occasionally across selected edges of both text roles, connecting them as one continuous reading sequence.",
    ]
  },
  visual_info_hybrid: {
    linesKo: [
      "ORGANIC VISUAL + INFORMATION HYBRID: Give key visual and information near-equal perceptual influence, but never express that balance as a 50:50 split. Interlock them through shared axes, crop continuation, repeated shapes, and varied overlap.",
      "INTERTWINED COMPOSITION: Anchor information to visual contours and contextual details, preserving legibility with local tonal control while keeping both roles inside one coherent scene.",
    ],
    linesEn: [
      "ORGANIC VISUAL + INFORMATION HYBRID: Give key visual and information near-equal perceptual influence, but never express that balance as a 50:50 split. Interlock them through shared axes, crop continuation, repeated shapes, and varied overlap.",
      "INTERTWINED COMPOSITION: Anchor information to visual contours and contextual details, preserving legibility with local tonal control while keeping both roles inside one coherent scene.",
    ]
  }
};

const BACKGROUND_ONLY_LAYOUT_COMPOSITION_PROFILES = {
  title_focus: {
    linesKo: [
      "BACKGROUND-ONLY TITLE FOCUS: 헤드라인이 화면의 최우선 전경 요소가 되며, 선택된 비주얼 컨셉은 배경 질감·색면·주변 장식으로만 사용한다.",
      "배경 비주얼은 헤드라인보다 딱 한 톤 정도만 명도를 낮춰서, 과도한 블러나 반투명 처리 없이도 컨셉을 또렷이 알아볼 수 있게 유지한다.",
      "정보와 CTA는 헤드라인 이후의 전경 위계로 배치하고, 어떤 비주얼 오브젝트도 텍스트보다 먼저 읽히지 않게 한다.",
    ],
    linesEn: [
      "BACKGROUND-ONLY TITLE FOCUS: Make the headline the dominant foreground element; use the selected visual concept only as background texture, color field, or edge decoration.",
      "Keep the background visual just one tone darker than the headline zone — clearly recognizable as the chosen concept, without heavy blur or excessive transparency.",
      "Place information and CTA as the next foreground hierarchy, and do not let any visual object read before the text.",
    ],
  },
  visual_focus: {
    linesKo: [
      "BACKGROUND-ONLY ATMOSPHERE FOCUS: 기존 비주얼 중심 구도를 전경 키비주얼이 아니라 넓은 배경 분위기 영역으로 해석한다.",
      "선택된 비주얼 컨셉은 화면 전체의 색감, 질감, 실루엣, 패턴 레이어로 또렷하게 표현하되 독립된 주역 오브젝트로 만들지 않는다. 정보/타이틀 구역보다 딱 한 톤만 낮춘 명도를 유지한다.",
      "헤드라인, 핵심 정보, CTA는 선명한 전경 레이어에 배치하며 배경 이미지와 충분한 명도 대비를 확보한다.",
    ],
    linesEn: [
      "BACKGROUND-ONLY ATMOSPHERE FOCUS: Reinterpret the visual-focused layout as a broad background atmosphere field, not as a foreground hero key visual.",
      "Express the selected visual concept clearly through overall color mood, texture, silhouettes, and pattern layers — one tone darker than the title/information zones, not a standalone hero object but still recognizable, not faint or washed out.",
      "Keep headline, key information, and CTA on crisp foreground layers with strong contrast against the background image.",
    ],
  },
  info_focus: {
    linesKo: [
      "BACKGROUND-ONLY INFORMATION FOCUS: 정보 영역이 전경의 중심이며, 비주얼 컨셉은 정보 카드 주변의 배경 질감과 분위기로 작동한다. 정보 구역보다 딱 한 톤만 낮춘 명도로, 컨셉이 또렷이 인지되게 유지한다.",
      "정보 카드 뒤에는 복잡한 오브젝트를 두지 말고, 배경 비주얼은 여백·테두리·주변부에 연결한다.",
      "본문 정보의 가독성과 구조가 모든 배경 표현보다 우선하지만, 배경 비주얼이 거의 안 보일 정도로 사라지게 하지는 않는다.",
    ],
    linesEn: [
      "BACKGROUND-ONLY INFORMATION FOCUS: Make information the foreground center; the visual concept works as background texture and atmosphere around the information areas, kept just one tone darker than the information zone so it stays clearly recognizable.",
      "Do not place complex objects behind information cards; keep background visuals in whitespace, borders, and peripheral areas.",
      "Readability and structure of the body information override background styling, but the background visual must not fade to near-invisibility.",
    ],
  },
  title_info_hybrid: {
    linesKo: [
      "BACKGROUND-ONLY TITLE + INFO HYBRID: 헤드라인과 정보가 공통 정렬축과 타이포 리듬을 공유하도록 구성하고, 비주얼 컨셉은 두 역할을 잇는 배경 분위기로 사용한다.",
      "균형을 상하 또는 좌우 면적으로 나누지 말고 크기·대비·밀도 차이로 표현하며, 배경 비주얼은 텍스트보다 앞선 전경 오브젝트가 되지 않게 한다.",
      "CTA와 핵심 정보는 배경보다 한 톤 정도 더 밝고 선명한 대비를 가진다.",
    ],
    linesEn: [
      "BACKGROUND-ONLY TITLE + INFO HYBRID: Connect headline and information through shared alignment and typographic rhythm, while the visual concept links both roles as background atmosphere.",
      "Express their balance through scale, contrast, and density rather than top-bottom or side-by-side acreage; do not let background visuals become foreground objects ahead of the text.",
      "CTA and key information should read about one tone brighter and sharper than the background, not several steps removed.",
    ],
  },
  visual_info_hybrid: {
    linesKo: [
      "BACKGROUND-ONLY ATMOSPHERE + INFO HYBRID: 기존 비주얼+정보 혼합 구도를 배경 분위기 영역과 전경 정보 영역의 조합으로 해석한다.",
      "선택된 컨셉의 색감·질감·이미지 레이어를 화면 흐름 전체에 엮되 정보보다 한 톤만 낮춘 명도를 유지하고, 정보와 CTA는 선명한 전경 위계로 읽히게 한다.",
      "비주얼 컨셉은 정보 영역을 묶어주는 배경 맥락이며, 정보 카드 위의 경쟁 요소가 되지는 않되 알아볼 수 없을 만큼 흐려지지도 않는다.",
    ],
    linesEn: [
      "BACKGROUND-ONLY ATMOSPHERE + INFO HYBRID: Reinterpret the visual + info hybrid as a combination of background atmosphere area and foreground information area.",
      "Weave the concept's color mood, texture, and image layers through the full compositional flow, kept just one tone darker than the information; keep information and CTA clearly readable in the foreground hierarchy.",
      "The visual concept provides background context that ties the information together; it must not compete over information cards, but it must remain recognizable rather than fading to near-invisibility.",
    ],
  },
};

function getBackgroundOnlyLayoutLines(compKey, isStrict) {
  const profile = BACKGROUND_ONLY_LAYOUT_COMPOSITION_PROFILES[compKey] || BACKGROUND_ONLY_LAYOUT_COMPOSITION_PROFILES.visual_focus;
  const baseLines = _s.outputLanguage === "en" ? profile.linesEn
    : _s.outputLanguage === "bilingual"
      ? profile.linesKo.map((ko, i) => `${ko} / ${profile.linesEn[i] || ko}`)
      : profile.linesKo;

  const separationLine = isStrict
    ? {
        ko: "구역은 명확히 나누되, 전경 텍스트/정보 영역과 한 톤만 낮춘 배경 분위기 영역을 기준으로 분리한다.",
        en: "Keep zones clearly separated between the foreground text/information and a background atmosphere that is just one tone darker, not heavily faded.",
      }
    : {
        ko: "구역 경계는 유기적으로 연결하되, 비주얼은 배경층에만 머물고 전경 텍스트 위계를 침범하지 않는다.",
        en: "Blend zone boundaries organically, but keep visuals in the background layer only and do not invade the foreground text hierarchy.",
      };

  return [
    ...baseLines,
    _s.outputLanguage === "en"
      ? separationLine.en
      : _s.outputLanguage === "bilingual"
        ? `${separationLine.ko} / ${separationLine.en}`
        : separationLine.ko,
  ];
}

function buildBackgroundOnlyCustomLayoutLines(tw, vw, iw) {
  const total = tw + vw + iw;
  const titlePct = total ? Math.round(tw / total * 100) : 33;
  const atmospherePct = total ? Math.round(vw / total * 100) : 33;
  const infoPct = total ? Math.round(iw / total * 100) : 33;
  const isStrict = isEnabled(_s.layoutStrictSeparation);
  const en = [
    `BACKGROUND-ONLY CUSTOM EMPHASIS: Relative influence scores — headline/title ${titlePct}/100, background atmosphere ${atmospherePct}/100, information/CTA ${infoPct}/100.`,
    "These scores control prominence, contrast, density, rhythm, and viewing time; they are not canvas percentages or instructions for rectangular zones.",
    "Honor the requested hierarchy, then adapt it to actual copy volume and the image's natural geometry; never invent filler or empty modules just to satisfy a score.",
    "Use the selected visual concept as background color, texture, imagery, or peripheral motif, rendered just one tone darker or slightly less saturated than the foreground zones — clearly recognizable, not faint or washed out.",
    isStrict
      ? "Protect copy with calm local high-contrast surfaces where needed, while connecting them through shared axes, recurring motifs, and continued tonal flow rather than fixed bands."
      : "Interweave foreground copy and background atmosphere through shared alignment, negative space, and soft tonal transitions while preserving strong text readability.",
  ];
  const ko = [
    `BACKGROUND-ONLY CUSTOM EMPHASIS: 상대 강조도 — 헤드라인/타이틀 ${titlePct}/100, 배경 분위기 ${atmospherePct}/100, 정보/CTA ${infoPct}/100.`,
    "이 수치는 크기, 대비, 밀도, 리듬, 시선 체류시간을 조절하며 캔버스 면적 비율이나 사각 구역 지시가 아니다.",
    "요청한 위계는 유지하되 실제 카피 양과 이미지의 자연스러운 구조에 맞춰 보정하고, 점수를 채우려고 빈 모듈이나 장식을 만들지 않는다.",
    "선택된 비주얼 컨셉은 배경 색감, 질감, 이미지, 주변 모티프로 사용하되 전경 구역보다 딱 한 톤만 낮춘 명도로, 또렷이 알아볼 수 있게 유지한다.",
    isStrict
      ? "필요한 곳에만 차분한 고대비 텍스트 보호 면을 사용하고, 고정 밴드 대신 공통 정렬축·반복 모티프·이어지는 톤으로 연결한다."
      : "공통 정렬축, 여백, 부드러운 톤 전환으로 전경 텍스트와 배경 분위기를 엮으면서 가독성을 강하게 유지한다.",
  ];

  return _s.outputLanguage === "en" ? en
    : _s.outputLanguage === "bilingual"
      ? ko.map((line, index) => `${line} / ${en[index] || line}`)
      : ko;
}

function getLayoutCompositionLines(profile) {
  if (!profile) return [];

  const isStrict = isEnabled(_s.layoutStrictSeparation);
  const compKey = Object.keys(LAYOUT_COMPOSITION_PROFILES).find(k => LAYOUT_COMPOSITION_PROFILES[k] === profile) || "visual_focus";

  if (profile === LAYOUT_COMPOSITION_PROFILES.custom || (profile.linesKo && profile.linesKo.length === 0 && profile.linesEn && profile.linesEn.length === 0)) {
    const parseWeight = (value) => {
      const parsed = parseInt(value, 10);
      return Number.isFinite(parsed) ? Math.max(0, parsed) : 25;
    };
    const tw = parseWeight(_s.layoutWeightTitle);
    const vw = parseWeight(_s.layoutWeightVisual);
    const iw = parseWeight(_s.layoutWeightInfo);
    if (_s.keyVisualPlacement === "background") {
      return buildBackgroundOnlyCustomLayoutLines(tw, vw, iw);
    }
    return buildCustomLayoutLines(tw, vw, iw);
  }

  if (_s.keyVisualPlacement === "background") {
    const lines = getBackgroundOnlyLayoutLines(compKey, isStrict);
    const isCtaActive = isEnabled(_s.ctaEnabled) && !!(trimValue(_s.cta));
    return adaptLayoutLinesForCta(lines, isCtaActive);
  }

  let targetProfile = profile;
  if (!isStrict) {
    targetProfile = ORGANIC_LAYOUT_COMPOSITION_PROFILES[compKey] || profile;
  }

  const lines = _s.outputLanguage === "en" ? targetProfile.linesEn
    : _s.outputLanguage === "bilingual"
      ? targetProfile.linesKo.map((ko, i) => `${ko} / ${targetProfile.linesEn[i] || ko}`)
      : targetProfile.linesKo;

  const isCtaActive = isEnabled(_s.ctaEnabled) && !!(trimValue(_s.cta));
  return adaptLayoutLinesForCta(lines, isCtaActive);
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
  const styleDNAEn = [style?.nameEn, category].filter(Boolean).join(" / ");
  const derived = {
    visualDNA: _s.outputLanguage === "ko"
      ? styleDNAEn
      : [styleDNAEn, prompt].filter(Boolean).join("\n"),
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
  const goal = trimValue(_s.goal || "");
  const audience = trimValue(_s.audience || "");
  const headline = trimValue(_s.headline);
  const bodyPoints = normalizeImageTextLines(_s.bodyCopy).slice(0, 3).join(" / ");
  const hasRich = !!trimValue(_s.appliedConceptPromotionPrompt);
  const bgOnly = _s.keyVisualPlacement === "background";

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
    goal ? (bgOnly ? _h.localizeSentence(
      `홍보 목적 연결: '${goal}'은 전경 텍스트(헤드라인·정보·CTA)로 전달하고, 컨셉 스타일은 이를 뒷받침하는 배경 분위기로만 표현한다.`,
      `Promotion goal connection: convey '${_h.localizeValue(goal)}' through the foreground text (headline, information, CTA), and let the concept style act only as a supporting background atmosphere.`
    ) : _h.localizeSentence(
      `홍보 목적 연결: '${goal}'을 컨셉 스타일 안에서 즉시 이해되는 메인 비주얼 행동 또는 상징으로 표현한다.`,
      `Promotion goal connection: express '${_h.localizeValue(goal)}' as an immediately understandable main visual action or symbol within the concept style.`
    )) : "",
    audience ? _h.localizeSentence(
      `타깃 연결: '${audience}'가 유치하거나 동떨어진 이미지로 느끼지 않도록, 컨셉의 장식성보다 설득력·신뢰감·참여 동기를 우선한다.`,
      `Audience connection: make sure '${_h.localizeValue(audience)}' does not perceive the result as childish or off-topic; prioritize persuasion, credibility, and motivation to act over pure decoration.`
    ) : "",
    headline ? (bgOnly ? _h.localizeSentence(
      `핵심 문구 연결: 헤드라인 '${headline}'이 가장 먼저 읽히도록 하고, 컨셉 요소는 헤드라인을 방해하지 않는 배경 분위기·질감·색면으로만 의미를 보조한다.`,
      `Headline connection: make the headline '${_h.localizeValue(headline)}' read first, and let concept elements support its meaning only as background atmosphere, texture, or color fields that do not compete with it.`
    ) : _h.localizeSentence(
      `핵심 문구 연결: 헤드라인 '${headline}'이 컨셉 장식보다 먼저 읽히도록 하고, 컨셉 요소는 헤드라인의 의미를 강화하는 배경·오브젝트·프레임 역할을 한다.`,
      `Headline connection: make the headline '${headline}' read before the concept decoration; concept elements should act as background, objects, or frames that reinforce the headline's meaning.`
    )) : "",
    bodyPoints ? (bgOnly ? _h.localizeSentence(
      `세부 정보 연결: '${bodyPoints}' 같은 본문 포인트는 전경 정보 카드·배지·라벨 위계로 명확히 배치하고, 컨셉은 그 뒤의 배경 분위기로만 연결한다.`,
      `Detail connection: place body points such as '${_h.localizeValue(bodyPoints)}' clearly as foreground information cards, badges, or labels, while the concept connects them only through background atmosphere.`
    ) : _h.localizeSentence(
      `세부 정보 연결: '${bodyPoints}' 같은 본문 포인트는 컨셉의 정보 노드, 배지, 리본, 라벨, 오브젝트 주변 캡션으로 재구성하되 원문 의미를 유지한다.`,
      `Detail connection: reorganize body points such as '${bodyPoints}' as concept-native information nodes, badges, ribbons, labels, or captions around the object while preserving the original meaning.`
    )) : "",
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

function isLowRiskAutoField(field) {
  return field === "cta" || field === "posterOffer" || field === "snsHook" || field === "snsHashtags";
}

const QR_SIZE_SPEC = {
  small: { ko: "작게 (전체 캔버스의 약 8~10%, 텍스트보다 작아지지 않는 선에서)", en: "small (about 8-10% of the canvas, never smaller than the surrounding text)" },
  medium: { ko: "보통 (전체 캔버스의 약 12~15%)", en: "medium (about 12-15% of the canvas)" },
  large: { ko: "크게 (전체 캔버스의 약 18~22%)", en: "large (about 18-22% of the canvas)" },
};

const QR_POSITION_SPEC = {
  "bottom-right": { ko: "화면 우측 하단", en: "the bottom-right corner of the canvas" },
  "bottom-left": { ko: "화면 좌측 하단", en: "the bottom-left corner of the canvas" },
  "top-right": { ko: "화면 우측 상단", en: "the top-right corner of the canvas" },
  "top-left": { ko: "화면 좌측 상단", en: "the top-left corner of the canvas" },
  "inline-info": { ko: "정보 카드/텍스트 블록 내부의 한 요소로 통합된 위치", en: "integrated as one element inside the information/text card block, not floating separately" },
};

function qrCodePromptLines() {
  if (!isEnabled(_s.qrEnabled)) return [];
  const qrUrl = String(_s.qrUrl || "").trim();
  const qrCaption = String(_s.qrCaption || "").trim();
  const sizeSpec = QR_SIZE_SPEC[_s.qrSize] || QR_SIZE_SPEC.medium;
  const positionSpec = QR_POSITION_SPEC[_s.qrPosition];

  return prunePromptLines([
    positionSpec
      ? _h.localizeSentence(
          `QR 자리: ${positionSpec.ko}에 확보한다.`,
          `QR area: reserve it at ${positionSpec.en}.`
        )
      : _h.localizeSentence(
          "QR 자리: 선택한 구도에 가장 자연스럽게 어울리는 위치에 QR 공간을 확보한다.",
          "QR area: reserve a QR space where it fits the chosen composition most naturally."
        ),
    _h.localizeSentence(
        `QR 크기: ${sizeSpec.ko} 정도의 스캔 가능한 정사각형 영역과 밝은 단색 배경, 충분한 quiet zone 여백을 확보한다.`,
        `QR size: reserve a scannable square area at ${sizeSpec.en} with a light solid background and sufficient quiet-zone margin.`
      ),
    _h.localizeSentence(
        "QR 간섭 금지: 헤드라인, 본문 정보, CTA, 주요 비주얼과 겹치지 않도록 독립된 공간으로 유지한다.",
        "QR isolation: keep it as an independent space that does not overlap the headline, information hierarchy, CTA, or primary visual."
      ),
      qrUrl
        ? _h.localizeSentence(
            `QR 연결 주소 : ${qrUrl}`,
            `QR target URL : ${qrUrl}`
          )
        : "",
      qrCaption
        ? _h.localizeSentence(
            `QR 안내문구: "${qrCaption}" 문구를 QR 영역에 인접한 짧은 보조 텍스트로만 배치한다.`,
            `QR caption: place the exact text "${qrCaption}" only as a short helper label adjacent to the QR area.`
          )
        : "",
  ]);
}

const LOGO_ARRANGEMENT_SPEC = {
  row: { ko: "가로 일렬로 자연스럽게 정렬된 로고 배치 흐름", en: "a naturally aligned horizontal logo placement flow" },
  grid: { ko: "여러 줄로 정돈된 로고 배치 흐름", en: "a multi-row logo placement flow" },
  split: { ko: "주최 측과 후원 측의 시선 흐름이 좌우로 나뉘는 로고 배치", en: "a split logo placement separating host/organizer and sponsor/partner groups" },
};

const LOGO_POSITION_SPEC = {
  bottom: { ko: "화면 하단 가장자리 근처", en: "near the bottom edge of the canvas" },
  top: { ko: "화면 상단 가장자리 근처", en: "near the top edge of the canvas" },
};

const LOGO_BLEND_SPEC = {
  panel: {
    ko: "자연 배치형: 전체 구도에 맞춰 로고를 작고 자연스럽게 배치한다.",
    en: "Natural placement: place logos subtly within the overall composition.",
  },
  scene: {
    ko: "장면 통합형: 배경 이미지 흐름 안에 로고를 자연스럽게 배치한다.",
    en: "Scene-integrated placement: place logos naturally within the image flow.",
  },
  ribbon: {
    ko: "흐름 배치형: 곡선, 띠, 시선 흐름을 따라 로고를 배치한다.",
    en: "Flow placement: place logos along curves, bands, or reading flow.",
  },
  line: {
    ko: "정렬 배치형: 로고를 한 줄 기준으로 가지런히 정돈한다.",
    en: "Aligned placement: align logos cleanly along a single row.",
  },
  glass: {
    ko: "단순 배치형: 장식 없이 로고를 깔끔하게 배치한다.",
    en: "Simple placement: place logos cleanly without decorative treatment.",
  },
};

const LOGO_TREATMENT_PROMPT_SPEC = {
  panel: {
    ko: [
      "로고 배치: 자연 배치형. 전체 구도에 맞춰 로고를 작고 자연스럽게 배치한다.",
      "표시 방식: 로고 자리를 나타내는 별도 박스나 빈 띠를 추가하지 않는다.",
    ],
    en: [
      "Logo placement: natural placement. Place logos subtly within the overall composition.",
      "Display rule: do not add any separate box, blank strip, or marker for the logo placement.",
    ],
  },
  scene: {
    ko: [
      "로고 배치: 장면 통합형. 배경 이미지 흐름 안에 로고를 자연스럽게 배치한다.",
      "표시 방식: 로고 자리를 나타내는 별도 사물이나 표면을 추가하지 않는다.",
    ],
    en: [
      "Logo placement: scene-integrated placement. Place logos naturally within the image flow.",
      "Display rule: do not add any separate object or surface to mark the logo placement.",
    ],
  },
  ribbon: {
    ko: [
      "로고 배치: 흐름 배치형. 곡선, 띠, 시선 흐름을 따라 로고를 배치한다.",
      "표시 방식: 로고 자리를 나타내는 장식 요소를 추가하지 않는다.",
    ],
    en: [
      "Logo placement: flow placement. Place logos along the reading flow without interrupting it.",
      "Display rule: do not add any decorative element to mark the logo placement.",
    ],
  },
  line: {
    ko: [
      "로고 배치: 정렬 배치형. 로고를 한 줄 기준으로 가지런히 정돈한다.",
      "표시 방식: 로고 자리를 나타내는 선이나 표시물을 추가하지 않는다.",
    ],
    en: [
      "Logo placement: aligned placement. Align logos cleanly along a single row.",
      "Display rule: do not add any line or marker to indicate the logo placement.",
    ],
  },
  glass: {
    ko: [
      "로고 배치: 단순 배치형. 장식 없이 로고를 깔끔하게 배치한다.",
      "표시 방식: 로고 자리를 나타내는 별도 시각 요소나 빈 공간을 추가하지 않는다.",
      "배경 연속성: 로고 배치는 주변 이미지 흐름과 자연스럽게 어울리게 하고, 별도 영역처럼 표시하지 않는다.",
    ],
    en: [
      "Logo placement: simple placement. Place logos cleanly without added graphics or effects.",
      "Display rule: do not add any separate visual element or blank area to mark the logo placement.",
      "Background continuity: the logo placement should belong naturally within the surrounding image flow, not as a separate area.",
    ],
  },
};

const LOGO_STYLE_SPEC = {
  placeholder: {
    ko: "기관명 텍스트 없이 배치 위치만 가이드한다.",
    en: "Guide placement without organization-name text.",
  },
  wordmark: {
    ko: "기관명 텍스트 없이 역할 라벨과 배치 위치만 가이드한다.",
    en: "Guide role labels and placement without organization-name wordmarks.",
  },
  blank: {
    ko: "텍스트 없이 배치 위치만 가이드한다.",
    en: "Guide text-free placement only.",
  },
};

const LOGO_ROLE_SPEC = {
  host: { ko: "주최", en: "Host" },
  organizer: { ko: "주관", en: "Organizer" },
  sponsor: { ko: "후원", en: "Sponsor" },
  partner: { ko: "협력", en: "Partner" },
};

function splitLogoNames(rawName) {
  return String(rawName || "")
    .split(/[,\n]/)
    .map((name) => trimValue(name))
    .filter(Boolean);
}

function quotePromptText(value) {
  return `"${String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function normalizeLogoItems(rawItems, legacySource) {
  const items = Array.isArray(rawItems)
    ? rawItems
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          role: LOGO_ROLE_SPEC[item.role] ? item.role : "host",
          name: splitLogoNames(item.name).join(", "),
        }))
        .filter((item) => item.name)
    : [];

  if (items.length) return items;

  return [
    { role: "host", name: splitLogoNames(legacySource?.logoHost).join(", ") },
    { role: "organizer", name: splitLogoNames(legacySource?.logoOrganizer).join(", ") },
    { role: "sponsor", name: splitLogoNames(legacySource?.logoSponsor).join(", ") },
  ].filter((item) => item.name);
}

function expandLogoItems(items) {
  return items.flatMap((item) =>
    splitLogoNames(item.name).map((name) => ({
      role: item.role,
      name,
    }))
  );
}

function normalizeLogoRoleLabels(rawLabels) {
  const source = rawLabels && typeof rawLabels === "object" && !Array.isArray(rawLabels) ? rawLabels : {};
  return Object.keys(LOGO_ROLE_SPEC).reduce((acc, role) => {
    const value = trimValue(source[role]);
    acc[role] = value || LOGO_ROLE_SPEC[role].ko;
    return acc;
  }, {});
}

function logoTreatmentPromptLines(blendStyle) {
  const spec = LOGO_TREATMENT_PROMPT_SPEC[blendStyle] || LOGO_TREATMENT_PROMPT_SPEC.panel;
  const koLines = spec.ko || [];
  const enLines = spec.en || [];
  const maxLength = Math.max(koLines.length, enLines.length);
  return Array.from({ length: maxLength }, (_, index) =>
    _h.localizeSentence(koLines[index] || "", enLines[index] || "")
  );
}

function organizerLogoPromptLines() {
  if (!isEnabled(_s.logoEnabled)) return [];
  const groupedLogoItems = normalizeLogoItems(_s.logoItems, _s);
  const logoItems = expandLogoItems(groupedLogoItems);
  if (!logoItems.length) return [];
  const requestedArrangement = LOGO_ARRANGEMENT_SPEC[_s.logoArrangement] || LOGO_ARRANGEMENT_SPEC.row;
  const positionSpec = LOGO_POSITION_SPEC[_s.logoPosition] || LOGO_POSITION_SPEC.bottom;
  const blendStyle = LOGO_TREATMENT_PROMPT_SPEC[_s.logoBlendStyle] ? _s.logoBlendStyle : "panel";
  const qrIsBottom = isEnabled(_s.qrEnabled) && (_s.qrPosition === "bottom-right" || _s.qrPosition === "bottom-left" || _s.qrPosition === "auto");

  const splitLeftCount = logoItems.filter((item) => item.role === "host" || item.role === "organizer").length;
  const splitRightCount = Math.max(logoItems.length - splitLeftCount, 0);
  const canUseSplit = requestedArrangement === LOGO_ARRANGEMENT_SPEC.split && splitLeftCount > 0 && splitRightCount > 0;
  const arrangementSpec = canUseSplit
    ? requestedArrangement
    : (logoItems.length >= 6 ? LOGO_ARRANGEMENT_SPEC.grid : LOGO_ARRANGEMENT_SPEC.row);
  const roleLabels = normalizeLogoRoleLabels(_s.logoRoleLabels);
  const activeRoleLabels = Object.keys(LOGO_ROLE_SPEC)
    .filter((role) => logoItems.some((item) => item.role === role))
    .map((role) => roleLabels[role]);
  const activeRoleLabelText = activeRoleLabels.map(quotePromptText).join(", ");
  const logoTextMode = ["hidden", "plain", "transparent"].includes(_s.logoTextMode) ? _s.logoTextMode : "hidden";
  const roleNameLines = Object.keys(LOGO_ROLE_SPEC)
    .map((role) => {
      const names = logoItems.filter((item) => item.role === role).map((item) => item.name);
      return names.length ? `${quotePromptText(roleLabels[role])}: ${names.map(quotePromptText).join(", ")}` : "";
    })
    .filter(Boolean);

  return prunePromptLines([
    _h.localizeSentence(
      `로고 위치: ${positionSpec.ko}의 기존 이미지 흐름 안에 총 ${logoItems.length}개 로고와 역할 라벨을 자연스럽게 배치한다.`,
      `Logo placement: place ${logoItems.length} logos and their role labels ${positionSpec.en} in a way that belongs naturally within the existing image flow.`
    ),
    ...logoTreatmentPromptLines(blendStyle),
    _h.localizeSentence(
      `배열 방식: ${arrangementSpec.ko} 기준으로 균일한 간격과 시각적 높이를 유지한다.`,
      `Arrangement: use ${arrangementSpec.en} with even spacing and consistent visual height.`
    ),
    canUseSplit
      ? _h.localizeSentence(
          `역할 분산: 좌측 그룹 ${splitLeftCount}개 / 우측 그룹 ${splitRightCount}개가 자연스럽게 나뉘어 보이도록 배치한다.`,
          `Role split: balance placement for ${splitLeftCount} left-group logos and ${splitRightCount} right-group logos.`
        )
      : "",
    _h.localizeSentence(
      "후합성 처리: 실제 로고를 직접 그리지 말고, 나중에 실제 로고를 얹어도 자연스럽게 어울릴 위치와 스케일만 설계한다.",
      "Compositing treatment: do not draw real logos; design only the placement and scale so real logos can be added naturally later."
    ),
    roleNameLines.length
      ? _h.localizeSentence(
          `기관명 목록: ${roleNameLines.join(" / ")}.`,
          `Organization list by role: ${roleNameLines.join(" / ")}.`
        )
      : "",
    logoTextMode === "plain" && activeRoleLabels.length
      ? _h.localizeSentence(
          `텍스트 표시: 역할 라벨 ${activeRoleLabelText}과 기관명을 단순 텍스트로만 작게 표기한다. 로고 심볼, 박스, 바, 배지는 만들지 않는다.`,
          `Text display: render the role labels ${activeRoleLabelText} and organization names as small plain text only. Do not create logo symbols, boxes, bars, or badges.`
        )
      : "",
    logoTextMode === "transparent" && activeRoleLabels.length
      ? _h.localizeSentence(
          `투명 텍스트 표시: 역할 라벨 ${activeRoleLabelText}과 기관명을 낮은 불투명도의 투명한 가이드 텍스트처럼 조용하게 배치한다. 진한 글씨나 고대비 텍스트로 만들지 않는다.`,
          `Transparent text display: place the role labels ${activeRoleLabelText} and organization names as low-opacity transparent guide text. Avoid dark, opaque, or high-contrast text.`
        )
      : "",
    logoTextMode === "hidden"
      ? _h.localizeSentence(
          "텍스트 숨김: 역할 라벨과 기관명은 보이는 글자로 렌더링하지 말고, 로고 배치의 수량과 그룹 계산에만 사용한다.",
          "Hidden text mode: do not render role labels or organization names as visible text; use them only to size and group the logo placement."
        )
      : "",
    _h.localizeSentence(
      "배치 품질: 로고 배치를 위해 빈 띠, 흰 박스, 표시물, 분리된 영역을 만들지 말고 전체 구도와 어울리게 정렬한다.",
      "Placement quality: do not create a blank strip, white box, marker, or separated area for logos; align the placement with the overall composition."
    ),
    qrIsBottom && _s.logoPosition === "bottom"
      ? _h.localizeSentence(
          "하단 충돌 방지: 하단 QR 블록과 로고 배치가 서로 겹치지 않도록 시각적 위계를 분리한다.",
          "Bottom conflict prevention: keep the bottom QR block and logo placement visually separated without overlap."
        )
      : "",
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

function getCompositionStrategyLines() {
  const compEnabled = isEnabled(_s.layoutCompositionEnabled);
  const compMode = _s.layoutCompositionMode;

  if (!compEnabled) {
    return [];
  }

  // 1. 레이아웃 구도 라인 추출
  let compLabel = "";
  let compLines = [];
  const isCtaActive = isEnabled(_s.ctaEnabled) && !!(trimValue(_s.cta));
  if (compMode === "ai") {
    compLabel = _h.localizeSentence("AI 자동 추천 구도", "AI-recommended layout");
    compLines = [
      _h.localizeSentence(
        "레이아웃 기본 원칙: 콘텐츠의 정보량과 목적에 맞춰 가장 읽기 쉬운 배치를 선택한다.",
        "Layout default principle: choose the most readable arrangement for the content volume and campaign goal."
      ),
      isCtaActive ? _h.localizeSentence(
        "헤드라인, 핵심 정보, 행동버튼(CTA) 순서의 시선 흐름을 유지한다.",
        "Maintain a clear eye flow from headline to key information to action button (CTA)."
      ) : _h.localizeSentence(
        "헤드라인, 핵심 정보 순서의 시선 흐름을 유지한다.",
        "Maintain a clear eye flow from headline to key information."
      ),
      isEnabled(_s.layoutStrictSeparation) ? _h.localizeSentence(
        "텍스트가 복잡한 배경 위에 올라가지 않게 하고, 텍스트 영역과 비주얼 영역을 명확히 분리한다.",
        "Do not place text over a busy background; clearly separate text zones from visual zones."
      ) : _h.localizeSentence(
        "비주얼 요소, 배경, 텍스트 영역이 유기적이고 부드럽게 연결되도록 처리하되, 글자의 가독성을 해치지 않도록 조절한다.",
        "The visual elements, background, and text zones must blend and transition organically, maintaining text legibility through localized contrast."
      ),
    ];
  } else {
    const compKey = _s.layoutComposition || "visual_focus";
    const profile = LAYOUT_COMPOSITION_PROFILES[compKey] || LAYOUT_COMPOSITION_PROFILES.visual_focus;
    compLabel = _h.localizeSentence(profile.labelKo, profile.labelEn);
    compLines = getLayoutCompositionLines(profile);
  }

  // 2. 단일 섹션으로 조립하여 리턴
  const title = _h.localizeSentence("구도 및 레이아웃 스타일", "Composition & Layout Style");
  const headerLines = [`${title}: ${compLabel}`];

  return prunePromptLines([
    ...headerLines,
    ...compLines,
  ]);
}

const _pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function compactPromptValue(value, maxLength = 360) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function adaptConceptTextToActiveLayout(value, maxLength) {
  const compact = compactPromptValue(value, maxLength);
  if (!compact || isEnabled(_s.layoutStrictSeparation)) return compact;
  return compact
    .replace(/\bclear(?:ly)?\s+separated\s+(?:zones?|blocks?|panels?)\b/gi, "clearly ordered connected roles")
    .replace(/\bclear\s+zones?\b/gi, "clear visual hierarchy")
    .replace(/\b(?:clean|hard-edged)\s+split\b/gi, "connected asymmetric flow")
    .replace(/\basymmetric\s+split\b/gi, "asymmetric connected flow")
    .replace(/\bsplit\s+layout\b/gi, "connected-flow layout")
    .replace(/명확히\s*분리된\s*(?:구역|블록|패널)/g, "명확한 위계로 연결된 역할")
    .replace(/(?:비대칭\s*)?분할\s*(?:구도|레이아웃)?/g, "비대칭 연결 흐름")
    .replace(/명확한\s*구역/g, "명확한 시각 위계");
}

function isPhotographicDirection() {
  if (_s.antiAiStyle === "photo_real") return true;
  const source = [
    _s.visualStyle,
    _s.appliedConceptStyle,
    _s.appliedConceptDesc,
    _s.appliedConceptPromotionPrompt,
    _s.appliedConceptTextureRendering,
  ].map((value) => String(value || "").toLowerCase()).join(" ");

  const explicitlyNonPhotographic = _s.antiAiStyle === "flat_vector"
    || /비\s*실사|(?:사진|촬영|실사)(?:을|은|이)?\s*(?:없음|금지|제외|미사용|사용하지\s*않(?:음|기)|아님)/i.test(source)
    || /\b(?:no|not|without|exclude|excluding|avoid|avoiding)\s+(?:any\s+|a\s+)?(?:photo(?:s|graph(?:ic|y)?)?|photoreal(?:istic)?|camera-made\s+imagery)\b/i.test(source);
  if (explicitlyNonPhotographic) return false;

  return /실사|사진|촬영|포토그래픽|photoreal|photo-real|photographic|photography|camera-made|documentary|cinematic\s+(?:photo|photography)/i.test(source);
}

function getCompactArtDirectionLines() {
  const baseline = COMMERCIAL_BASELINE_PROFILES[_s.commercialBaseline];
  const creativity = CREATIVITY_LEVEL_PROFILES[_s.creativityLevel];
  const antiAiPreset = ANTI_AI_PRESETS.find((preset) => preset.id === _s.antiAiStyle)
    || ANTI_AI_PRESETS.find((preset) => preset.id === "general");

  return prunePromptLines([
    ...(baseline?.linesEn || []).slice(0, 2),
    ...(creativity?.linesEn || []).slice(0, 2),
    antiAiPreset?.visualHintEn ? `Rendering character: ${antiAiPreset.visualHintEn}.` : "",
  ]);
}

function getLayeredCompositionLines() {
  const isPhoto = isPhotographicDirection();
  const isStrict = isEnabled(_s.layoutStrictSeparation);
  const backgroundOnly = _s.keyVisualPlacement === "background";
  const lines = [
    "Build one coherent art-directed composition from 4-5 coordinated semantic layers; do not stop at a single background image with text placed on top.",
    "Treat these layers as interdependent semantic responsibilities, not equal-sized slices, stacked bands, or isolated cards. One element may serve and connect multiple layer roles when that improves continuity.",
    "Layer roles: (1) environmental background and atmosphere, (2) main subject or hero visual, (3) structural bridge using crops, masks, color fields, lines, or repeated motifs, (4) headline and grouped information modules, and (5) CTA, brand, logo, or QR accents when enabled.",
    "Make the information belong to the visual scene: anchor text and data modules to subject edges, negative space, perspective lines, or repeated color/shape cues. Avoid one lonely centered card, an empty backdrop, and a scatter of unrelated floating tiles.",
    "Create a deliberate reading path from headline to hero visual to key information to CTA. Use controlled overlap, edge continuation, and partial occlusion only where they strengthen that path; never cover a face, product, essential number, or critical copy.",
  ];

  if (isPhoto) {
    lines.push(
      "Photographic layering: begin with one believable camera-made scene and establish foreground framing, a clear midground subject, and contextual background depth with coherent perspective, scale, focus, shadows, and white balance.",
      "Integrate 2D editorial overlays through purposeful cropping, tonal masks, solid or softly graded color fields, fine rules, captions, statistic tabs, and typography aligned to the photograph. These are printed/editorial design layers, never holograms or translucent 3D interfaces floating in the photographed space.",
      "When useful, let one natural subject silhouette or crop edge cross a color field or typography zone to bind photo and information together, while preserving clean negative space around faces and the core message. Do not assemble unrelated stock photos into a collage."
    );
  } else {
    lines.push("Give the hero visual supporting depth through one contextual secondary element, a restrained texture or lighting layer, and integrated information graphics; avoid an isolated object on a mostly empty canvas.");
  }

  if (backgroundOnly) {
    lines.push("Background-only mode still requires layered depth: separate the background visual into context, focus, tonal-mask, and texture layers, then place typography and information as crisp foreground layers without introducing a standalone foreground hero object.");
  } else if (isStrict) {
    lines.push("Strict separation means copy stays on calm high-contrast surfaces, not that the composition becomes disconnected. Connect zones through a shared grid, aligned edges, continued crops, repeated colors, and controlled boundary overlaps without placing text over busy imagery.");
  } else {
    lines.push("Organic integration mode: let visual, typography, and information layers overlap at selected edges and transition through localized contrast, masking, and negative space so they feel interlocked rather than boxed into separate sections.");
  }

  return prunePromptLines(lines);
}

function getCompactConceptExecutionLines() {
  if (!_h.hasBasicConceptPromptInput || !_h.hasBasicConceptPromptInput()) return [];
  const isStrict = isEnabled(_s.layoutStrictSeparation);
  return prunePromptLines([
    !isStrict
      ? "Concept-layout precedence: organic integration overrides any split, panel, fixed-zone, or percentage instruction embedded in the source concept. Preserve its visual DNA and intended hierarchy without literal compartments."
      : "",
    trimValue(_s.appliedConceptPromotionPrompt)
      ? `Concept execution: ${adaptConceptTextToActiveLayout(_s.appliedConceptPromotionPrompt, 460)}`
      : "",
    trimValue(_s.appliedConceptVisualDNA)
      ? `Visual DNA: ${compactPromptValue(_s.appliedConceptVisualDNA, 180)}`
      : "",
    [
      trimValue(_s.appliedConceptTextureRendering),
      trimValue(_s.appliedConceptLightingMood),
      trimValue(_s.appliedConceptShapeLanguage),
    ].filter(Boolean).length
      ? `Material, light, and form: ${compactPromptValue([
          _s.appliedConceptTextureRendering,
          _s.appliedConceptLightingMood,
          _s.appliedConceptShapeLanguage,
        ].filter(Boolean).join("; "), 360)}`
      : "",
    trimValue(_s.appliedConceptCampaignAdaptation)
      ? `Campaign adaptation: ${compactPromptValue(_s.appliedConceptCampaignAdaptation, 280)}`
      : "",
    trimValue(_s.appliedConceptObjectAdaptation)
      ? `Subject/metaphor adaptation: ${compactPromptValue(_s.appliedConceptObjectAdaptation, 260)}`
      : "",
    trimValue(_s.appliedConceptLayoutBehavior)
      ? `Concept layout behavior: ${adaptConceptTextToActiveLayout(_s.appliedConceptLayoutBehavior, 240)}`
      : "",
    trimValue(_s.appliedConceptTypographyGuidance)
      ? `Concept typography: ${compactPromptValue(_s.appliedConceptTypographyGuidance, 220)}`
      : "",
    trimValue(_s.appliedConceptQualityRules)
      ? `Concept quality standard: ${compactPromptValue(_s.appliedConceptQualityRules, 280)}`
      : "",
  ]);
}

function renderBasicPrompt(validation, lint) {
  const has = (v) => !!(trimValue(v));
  const blocks = [];
  const assetLabelEn = ASSET_PROMPT_TARGET_EN[_s.assetType] || _s.assetType;
  const sizeSpec = _h.getPromptSpecificationSummary ? _h.getPromptSpecificationSummary() : "";
  const formatAssetLabel = _s.assetType === "image" ? "promotion web image" : assetLabelEn;
  const isPublicToneConcept = trimValue(_s.appliedConceptCategory) === "official";

  const pushBlock = (title, lines) => {
    const body = prunePromptLines(lines).join("\n");
    if (body) blocks.push(`[${title}]\n${body}`);
  };

  const pushDirective = (lines) => {
    const body = prunePromptLines(lines).join("\n");
    if (body) blocks.push(body);
  };

  const compactQualityNotes = () => {
    if (!isEnabled(_s.qualityNotesEnabled) || !has(_s.qualityNotes)) return [];
    return prunePromptLines(normalizeLines(_s.qualityNotes));
  };

  pushDirective([
    isPublicToneConcept
      ? "Design a unified, restrained, trustworthy Korean public-institution promotional image with refined composition and clean production quality."
      : "Design a unified, polished Korean promotional image with clear campaign hierarchy, refined composition, and clean production quality.",
  ]);

  pushBlock("Output", [
    `Create one finished ${formatAssetLabel}.`,
    sizeSpec ? `Size: ${sizeSpec}` : "",
    "No outer frame, mockup, watermark, or presentation border.",
  ]);

  pushBlock("Core Brief", [
    has(_s.goal) ? `Goal: ${_s.goal}` : "",
    has(_s.audience) ? `Audience: ${_s.audience}` : "",
    isEnabled(_s.toneEnabled) && _s.toneMode !== "ai" && has(_s.tone) ? `Tone: ${_s.tone}` : "",
  ]);

  const visualLines = [];
  if (_h.hasBasicConceptPromptInput && _h.hasBasicConceptPromptInput()) {
    const name = trimValue(_s.appliedConceptName);
    const desc = trimValue(_s.appliedConceptDesc);
    const style = trimValue(_s.appliedConceptStyle);
    let conceptText = style || [name, desc].filter(Boolean).join(" — ");
    if (conceptText) {
      if (_s.keyVisualPlacement === "background") {
        conceptText += " Use it as recognizable background atmosphere only, not as a foreground hero object.";
      }
      visualLines.push(`Concept: ${conceptText}`);
    }
  }
  if (isEnabled(_s.bigIdeaEnabled) && _s.bigIdeaMode !== "ai" && has(_s.bigIdea)) {
    visualLines.push(`Core idea: ${_s.bigIdea}`);
  }
  if (isEnabled(_s.visualMetaphorEnabled) && _s.visualMetaphorMode !== "ai" && has(_s.visualMetaphor)) {
    visualLines.push(`Visual metaphor: ${_s.visualMetaphor}`);
  }
  if (isEnabled(_s.visualStyleEnabled) && _s.visualStyleMode !== "ai" && has(_s.visualStyle)) {
    visualLines.push(`Style: ${_s.visualStyle}`);
  }
  visualLines.push(...getCompactConceptExecutionLines());
  if (has(_s.backgroundDetails)) {
    visualLines.push(`Background treatment: ${_s.backgroundDetails}`);
  }
  if (isEnabled(_s.posterKeyVisualEnabled) && has(_s.posterKeyVisual)) {
    visualLines.push(`Main visual focal point: ${_s.posterKeyVisual}`);
  }
  if (isEnabled(_s.snsVisualFocusEnabled) && has(_s.snsVisualFocus)) {
    visualLines.push(`Social visual focal point: ${_s.snsVisualFocus}`);
  }
  if (visualLines.length) {
    visualLines.push("Finish: refined commercial key-visual quality with intentional spacing, clean edges, balanced contrast, and cohesive material/style treatment.");
  }
  pushBlock("Visual Direction", visualLines);
  pushBlock("Art Direction", getCompactArtDirectionLines());
  pushBlock("Layered Composition", getLayeredCompositionLines());

  const texts = [];
  if (has(_s.headline)) {
    texts.push(`Headline: "${_s.headline}"`);
    if (String(_s.headline).trim().length >= 16) {
      texts.push(`Headline length note: this headline is long — wrap it into two visually balanced lines at a natural word/phrase boundary rather than shrinking the font excessively or letting it overflow its zone.`);
    }
  }
  if (has(_s.subheadline)) texts.push(`Subheadline: "${_s.subheadline}"`);
  if (has(_s.mandatoryElements)) {
    normalizeLines(_s.mandatoryElements).forEach((line) => {
      texts.push(`Required visible content: "${line}"`);
    });
  }

  const bodyItems = formatImageTextHierarchy(_s.bodyCopy || "");
  if (bodyItems.length) {
    texts.push("Body Copy Hierarchy (hierarchy labels and numbers are layout guides only and must not be rendered on the image):");
    bodyItems.forEach(({ text, level, number }) => {
      const hierarchyLabel = level === 0 ? "Primary" : level === 1 ? "Secondary" : "Detailed";
      texts.push(`${"  ".repeat(Math.min(level, 2))}- ${hierarchyLabel} ${number}: "${text}"`);
    });
  }

  // CTA 반영 (AI 자동 / 직접 입력) — 자동생성 지시는 글자수를 좁게 못박아 이미지 생성기 과부하를 완화
  if (isEnabled(_s.ctaEnabled)) {
    if (_s.ctaMode === "ai") {
      texts.push(`CTA: [AI Auto-Generated: Generate short action-button (CTA) copy, 2-5 words maximum, tailored to the campaign goal and target audience to drive immediate conversion]`);
    } else if (has(_s.cta)) {
      texts.push(`CTA: "${_s.cta}"`);
    }
  }

  // 한 줄 오퍼 반영 (AI 자동 / 직접 입력)
  if (isEnabled(_s.posterOfferEnabled)) {
    if (_s.posterOfferMode === "ai") {
      texts.push(`Key Offer: [AI Auto-Generated: Generate one concise offer line, under 20 Korean characters, focusing on the single core benefit]`);
    } else if (has(_s.posterOffer)) {
      texts.push(`Key Offer: "${_s.posterOffer}"`);
    }
  }

  // 첫 줄 훅 반영 (AI 자동 / 직접 입력)
  if (isEnabled(_s.snsHookEnabled)) {
    if (_s.snsHookMode === "ai") {
      texts.push(`Social Hook: [AI Auto-Generated: Generate a catchy first-line hook, under 15 Korean characters, to capture attention instantly]`);
    } else if (has(_s.snsHook)) {
      texts.push(`Social Hook: "${_s.snsHook}"`);
    }
  }

  const hashtagsForbidden = /해시태그 제외|해시태그 본문 노출 금지|no hashtags|exclude hashtags/i.test(_s.forbiddenElements || "");

  // 해시태그 반영 (AI 자동 / 직접 입력)
  if (isEnabled(_s.snsHashtagsEnabled) && !hashtagsForbidden) {
    if (_s.snsHashtagsMode === "ai") {
      texts.push(`Hashtags: [AI Auto-Generated: Generate 5-10 relevant hashtags aligned with the content type and promotional goal]`);
    } else if (has(_s.snsHashtags)) {
      texts.push(`Hashtags: "${_s.snsHashtags}"`);
    }
  }

  if (texts.length) blocks.push(`[Copy Content]\n${texts.join("\n")}\nDo NOT render label names (Headline, Body Copy, CTA, etc.) as visible text — render only the actual content values.`);

  const layoutLines = getCompositionStrategyLines();
  if (_s.keyVisualPlacement === "background") {
    layoutLines.push("Do not place concept-derived objects as standalone foreground hero objects.");
  }
  if (isEnabled(_s.posterInfoLayoutEnabled) && has(_s.posterInfoLayout)) {
    layoutLines.push(`Information layout: ${_s.posterInfoLayout}`);
  }
  if (isEnabled(_s.snsPlacementNotesEnabled) && has(_s.snsPlacementNotes)) {
    layoutLines.push(`Placement notes: ${_s.snsPlacementNotes}`);
  }
  layoutLines.push("Keep the composition visually breathable; avoid crowding text, icons, decorative objects, and functional spaces.");
  pushBlock("Layout", layoutLines);

  const functionalLines = [];
  if (isEnabled(_s.qrEnabled)) {
    functionalLines.push(...qrCodePromptLines());
  }
  pushBlock("Functional Spaces", functionalLines);

  const logoLines = [];
  if (isEnabled(_s.logoEnabled)) {
    logoLines.push("Logo compositing is an independent requirement, not optional decoration and not part of the main copy hierarchy.");
    logoLines.push(...organizerLogoPromptLines());
  }
  pushBlock("Logo Compositing", logoLines);

  const activeAntiAiPreset = ANTI_AI_PRESETS.find((preset) => preset.id === _s.antiAiStyle)
    || ANTI_AI_PRESETS.find((preset) => preset.id === "general");
  pushBlock("Do Not", [
    has(_s.forbiddenElements) ? `Avoid: ${_s.forbiddenElements}` : "",
    activeAntiAiPreset?.forbiddenEn ? `Rendering exclusions: ${activeAntiAiPreset.forbiddenEn}.` : "",
    has(_s.appliedConceptAvoid) ? `Concept exclusions: ${compactPromptValue(_s.appliedConceptAvoid, 280)}` : "",
    ...compactQualityNotes(),
  ]);

  return blocks.join("\n\n");
}

function sanitizePromptForAI(text, targetEngine = "") {
  if (!text) return "";

  // targetEngine이 'imagen'이거나 혹은 텍스트 내에 이미지에 그려지면 안 되는 한글 찌꺼기가 남아있는 경우 정밀 필터링 적용
  const isImagen = targetEngine === "imagen" || (typeof _s !== "undefined" && _s.targetEngine === "imagen");
  const isEnglishOnly = (typeof _s !== "undefined" && _s.outputLanguage === "en") || targetEngine === "en";

  // Imagen은 약어를 잘 처리하지 못하므로 CTA를 풀어씀. OpenAI/DALL-E는 한국어 CTA 그대로 유지.
  let processed = isImagen ? text.replace(/\bCTA\b/g, "action button") : text;

  if (isImagen) {
    // 따옴표 내의 한글 텍스트(사용자가 실제 렌더링하고 싶어하는 한글 정보)를 임시 플레이스홀더로 보호
    const quotes = [];
    let placeholderText = processed.replace(/"([^"]*)"/g, (match, p1) => {
      quotes.push(p1);
      return `__AI_QUOTE_PLACEHOLDER_${quotes.length - 1}__`;
    });
    
    // 라인별로 보면서 한글이 있으면 정제 처리
    const lines = placeholderText.split(/\r?\n/);
    const cleanedLines = [];
    
    for (let line of lines) {
      let trimmed = line.trim();
      if (!trimmed) {
        cleanedLines.push("");
        continue;
      }
      
      if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(trimmed)) {
        if (isEnglishOnly) {
          // 한글이 있는 라인이면, split 기호로 쪼개어 영문만 남김
          const parts = trimmed.split(/\s*[\/|·|—|-]\s*/);
          const englishParts = parts.filter(p => !/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(p));
          if (englishParts.length > 0) {
            trimmed = englishParts.join(" ").trim();
          } else {
            // 순수 한글로만 된 라인(예: 가이드 설명)은 스킵
            continue;
          }
        } else {
          // 한국어 또는 Bilingual 모드일 때는 한글을 제거하지 않고 그대로 유지!
          cleanedLines.push(line);
          continue;
        }
      }
      
      // 앞뒤 마크다운 불릿이나 불필요한 기호 정리
      cleanedLines.push(line.replace(line.trim(), trimmed));
    }
    
    // 플레이스홀더 복원
    processed = cleanedLines.join("\n").replace(/__AI_QUOTE_PLACEHOLDER_(\d+)__/g, (match, p1) => {
      return `"${quotes[parseInt(p1, 10)]}"`;
    });

    // 엔진별 품질 보정문은 통합 프롬프트와 충돌할 수 있어 추가하지 않는다.
  }
  
  return processed;
}
  return {
    init: _init,
    renderBasicPrompt,
    sanitizePromptForAI,
    conceptPromptPartsFromStyle,
    applyConceptPartsToState,
    prunePromptLines,
    resolveConflictLines,
    getAppliedConceptLines,
    getConceptBridgeLines,
    getPaletteRoleSplitLines,
    qrCodePromptLines,
  };
})();
