const fs = require('fs');
const path = require('path');

// 1. 필요한 mock 및 글로벌 객체들 정의
global.window = {
  PROMO_DATA: {
    PROMOTION_SCHEMA_VERSION: 1,
    ASSET_TYPES: ["image", "card-news", "notice"],
    CONTENT_TYPE_VALUES: ["none", "card-news", "notice"],
    COLOR_STRATEGY_VALUES: ["ai", "manual"],
    ASSET_DEFAULTS: {},
    DEFAULT_STATE: {
      assetType: "image",
      contentType: "none",
      outputLanguage: "ko",
      promptMode: "review",
      visualPlanningMode: "basic",
      targetEngine: "dalle",
      commercialBaseline: "premium",
      creativityLevel: "balanced",
      ratio: "1:1",
      orientation: "vertical",
    },
    ASSET_LABELS: { image: "단일 이미지" },
    ASSET_LABELS_EN: { image: "Single Image" },
    ASSET_PROMPT_TARGET_EN: {},
    KIND_META: {},
    STATIC_FIELD_KINDS: {},
    FIELD_LABELS: {},
    FIELD_LABELS_EN: {},
    QUICK_BTNS: {},
    DEFAULT_QUALITY_TAGS: [],
    COMMERCIAL_BASELINE_PROFILES: {},
    CREATIVITY_LEVEL_PROFILES: {},
    VARIATION_SEEDS: [],
    CONTENT_PROMOTION_STRATEGIES: {},
    CREATIVE_DIVERSITY_PROFILES: {},
    LAYOUT_COMPOSITION_PROFILES: {},
    ATTENTION_FLOW_VARIANTS: [],
    AI_LAYOUT_STRATEGY_OPTIONS: [],
    AI_VISUAL_METAPHOR_EXAMPLES: [],
    INFORMATION_ITEM_LAYOUT_VARIANTS: [],
    QR_PLACEMENT_VARIANTS: [],
    MANDATORY_ELEMENT_PLACEMENT_VARIANTS: [],
    AI_TOGGLE_FIELDS: [],
    FIELD_ENABLE_TOGGLE_FIELDS: [],
    STEP5_QUALITY_OPTIONS: [],
    STEP3_VISUAL_OPTION_GROUPS: [],
    STEP3_IDEA_PRESETS: [],
    ANTI_AI_PRESETS: [],
    DEFAULT_COLOR_PRESETS: [],
    TYPE_FIELD_DEFS: {},
    CONTENT_TYPE_TEMPLATES: {},
    CONTENT_TYPE_TEMPLATES_EN: {},
    CONTENT_TYPE_SAMPLE_PROFILES: {},
    UNIFIED_RANDOMIZABLE_PRESET_FIELDS: [],
    COLOR_FIELD_IDS: [],
  },
  PROMO_UTILS: {
    CONCEPT_INJECTION_PATTERNS: {},
    deepClone: (obj) => JSON.parse(JSON.stringify(obj)),
    isEnabled: (v) => v === "true" || v === true,
    trimValue: (v) => String(v || "").trim(),
    uniqueValues: (arr) => [...new Set(arr)],
    splitKeywordValues: (v) => String(v || "").split(/,\s*/).filter(Boolean),
    splitKeywordValuesRaw: (v) => String(v || "").split(/,\s*/).filter(Boolean),
    splitSentenceLines: (v) => String(v || "").split(/\n+/).filter(Boolean),
    splitForbiddenValues: (v) => String(v || "").split(/,\s*/).filter(Boolean),
    normalizeConceptStripValue: (v) => String(v || "").trim(),
    conceptStripValuesFromStyle: () => [],
    isConceptInjectedLine: () => false,
    stripConceptInjectedLines: (v) => v,
    normalizePromptLineForDedupe: (v) => String(v || "").trim().toLowerCase(),
    normalizeQuickToken: (v) => String(v || "").trim().toLowerCase(),
    isQuickButtonMultiline: () => false,
    formatQuickButtonValues: (v) => v,
    getFieldStateKeyFromInput: (v) => v,
    pickRandomSubset: (arr) => arr,
    randomFieldSelectionCount: () => 1,
    normalizeBooleanSetting: (v, def) => v !== undefined ? v : def,
    normalizeColorStrategy: (v) => v,
    normalizeOutputLanguage: (v) => v,
    normalizeHexColor: (v) => v,
    escapeHtml: (v) => v,
    normalizeLines: (v) => String(v || "").split(/\n+/).filter(Boolean),
    mergeUniqueLines: (a, b) => [...new Set([...a, ...b])],
    summarizeDisplayTextPoint: (v) => v,
    normalizeForbiddenPromptToken: (v) => v,
  },
  PROMO_I18N: {
    EN_TOKEN_MAP: {},
    translateFragment: (v) => v,
    SYSTEM_QUALITY_PHRASES: [],
    isSystemQualityPhrase: () => false,
  }
};

// 2. promotion-prompt-engine.js 코드를 로드
const codePath = path.join(__dirname, '../src/promotion-prompt-engine.js');
let fileContent = fs.readFileSync(codePath, 'utf8');

// (function () { ... })() 형태이므로 eval하여 PROMO_PROMPT 객체를 바인딩함
// window.PROMO_PROMPT = ... 형식으로 할당되므로 global.window.PROMO_PROMPT 로 바인딩됨
eval(fileContent);

const PROMO_PROMPT = global.window.PROMO_PROMPT;

// 3. 테스트 데이터 설정 및 결과 관찰
const testLanguages = ["ko", "en", "bilingual"];

testLanguages.forEach(lang => {
  console.log(`\n==========================================`);
  console.log(`TESTING LANG: ${lang.toUpperCase()}`);
  console.log(`==========================================`);
  
  // mock init 호출을 통해 내부 state(_s) 설정
  const testState = {
    assetType: "image",
    contentType: "none",
    outputLanguage: lang,
    promptMode: "review",
    visualPlanningMode: "basic",
    targetEngine: "dalle",
    commercialBaseline: "premium",
    creativityLevel: "balanced",
    ratio: "1:1",
    orientation: "vertical",
    headline: "배터리 교육원 모집",
    bodyCopy: "모집 요강 설명 1\n모집 요강 설명 2",
    cta: "신청하기",
    appliedConceptStyle: "dark fantasy style, dramatic chiaroscuro lighting",
    appliedConceptName: "RPG 던전 / Dark Fantasy RPG",
    appliedConceptCategory: "game",
    appliedConceptPromotionPrompt: `
[Visual Anatomy]
- Concept name: Dark Fantasy RPG
- Category: game
- Visual DNA: Dark Fantasy RPG
- Shape language: dramatic shapes
- Texture / rendering: digital painting
- Lighting / mood: chiaroscuro

[Color System]
- Palette roles: deep midnight navy
`,
  };
  
  PROMO_PROMPT.init(testState);
  
  const validation = { errors: [] };
  const lint = { conflicts: [], duplicates: [] };
  
  const sections = PROMO_PROMPT.createPromptSections(validation, lint);
  console.log(`Total sections: ${sections.length}`);
  sections.forEach(s => {
    console.log(` - Section [${s.title}]: ${s.lines.length} lines`);
  });
  
  const finalPrompt = PROMO_PROMPT.renderReviewPrompt(validation, lint);
  const linesCount = finalPrompt.split('\n').filter(l => l.trim()).length;
  console.log(`\nFinal Prompt line count: ${linesCount} lines`);
  console.log(`--- PREVIEW ---`);
  console.log(finalPrompt.split('\n').slice(0, 15).join('\n'));
  console.log(`--- ... ---`);
});
