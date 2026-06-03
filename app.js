const state = {
  lang: "ko",
  pageType: "body",
  focusKey: "format",
  colorSystem: { ...DEFAULT_COLOR_SYSTEM },
  customRatio: { width: 16, height: 9 },
  barSettings: createDefaultBarSettings(),
  promptSettings: {
    addPreamble: true,       // 프롬프트 서두 지시문 포함
    koreanContent: false,    // 슬라이드 내 텍스트를 한국어로 작성
    outputMode: "block",     // "block" | "prose"  블록형 vs 자연어 단일 문단
  },
  bgSolidColor: "#F5F6F7",   // 배경 베이스가 '단색 배경'일 때 사용할 HEX
  customPhotoSubject: "",
  promptLineOverrides: {},
  promptLineDrafts: {},
  selections: createEmptySelections(),
};

const BUILT_IN_TEMPLATE_OVERRIDES_KEY = "pd_builtin_template_overrides";

let activeBuiltInTemplateIndex = null;
let activeUserTemplateIndex = null;

function normalizeHexColor(value, fallback = DEFAULT_COLOR_SYSTEM.primary) {
  const raw = String(value || "").trim();
  return /^#[0-9A-Fa-f]{6}$/.test(raw) ? raw.toUpperCase() : fallback.toUpperCase();
}

function createDefaultBarSettings() {
  return {
    headerEnabled: true,
    headerHeight: 48,
    headerColor: normalizeHexColor(DEFAULT_COLOR_SYSTEM.primary),
    footerEnabled: false,
    footerHeight: 32,
    footerColor: normalizeHexColor(DEFAULT_COLOR_SYSTEM.primary),
  };
}

function syncFooterBarColorWithTheme(previousPrimary = DEFAULT_COLOR_SYSTEM.primary, force = false) {
  if (!state?.barSettings) return;

  const nextPrimary = normalizeHexColor(state.colorSystem?.primary);
  const current = normalizeHexColor(state.barSettings.footerColor);
  const previous = normalizeHexColor(previousPrimary);
  const defaultPrimary = normalizeHexColor(DEFAULT_COLOR_SYSTEM.primary);
  const shouldSync =
    force ||
    !state.barSettings.footerEnabled ||
    current === previous ||
    current === defaultPrimary;

  if (shouldSync) {
    state.barSettings.footerColor = nextPrimary;
  }
}

function clonePromptLineOverrides(overrides = {}) {
  const next = {};

  Object.entries(overrides).forEach(([id, value]) => {
    if (!value || typeof value !== "object") return;

    const ko = typeof value.ko === "string" ? value.ko : "";
    const en = typeof value.en === "string" ? value.en : "";

    if (!ko && !en) return;
    next[id] = { ko, en };
  });

  return next;
}

function createEmptySelections() {
  return {
    format: null,
    mood: null,
    quality: [],
    "screen-elements": [],
    bg: null,
    material: null,
    lighting: null,
    palette: null,
    pattern: null,
    hierarchy: null,
    typography: null,
    spacing: null,
    density: null,
    layout: null,
    "reference-scope": null,
    "title-bar-rule": null,
    "page-number": null,
    "header-bg": null,
    "header-line": null,
    "header-icon": null,
    "header-shape": null,
    "header-align": null,
    "logo-handling": null,
    "header-slot-ratio": null,
    "header-slot-left": null,
    "header-slot-center": null,
    "header-slot-right": null,
    "footer-bar": null,
    "footer-elem": [],
    "footer-shape": null,
    "footer-align": null,
    "photo-composite": [],
    "photo-subject": null,
    "bg-style": null,
    "bg-tone": null,
    content: [],
    "text-policy": null,
    "forbidden-rules": [],
  };
}

function isMultiSelect(key) {
  return OPTION_META[key]?.mode === "multi";
}

function getSelectionValues(key) {
  const value = state.selections[key];
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function isAiDelegatedSelection(key) {
  return getSelectionValues(key).some((item) => item?.text === "AI 위임");
}

function hasCustomColorSystemValues() {
  return Object.entries(state.colorSystem).some(([name, value]) => value !== DEFAULT_COLOR_SYSTEM[name]);
}

function hasFixedColorSystem() {
  return !isAiDelegatedSelection("palette") && (
    Boolean(state.selections.palette) ||
    hasCustomColorSystemValues()
  );
}

function isAiDelegatedColorSystem() {
  return isAiDelegatedSelection("palette") && !hasCustomColorSystemValues();
}

function shouldUseAdaptiveThemeColor(color) {
  return isAiDelegatedColorSystem() &&
    normalizeHexColor(color) === normalizeHexColor(DEFAULT_COLOR_SYSTEM.primary);
}

function formatThemeColorValue(color, lang) {
  if (shouldUseAdaptiveThemeColor(color)) {
    return lang === "ko"
      ? "AI가 선택한 Primary 컬러와 연동"
      : "linked to the AI-selected Primary color";
  }
  return normalizeHexColor(color).toUpperCase();
}

function hasSelection(key) {
  if (key === "pageType") return Boolean(state.pageType);
  if (key === "color-system") {
    return (
      Boolean(state.selections.palette) ||
      hasCustomColorSystemValues()
    );
  }
  if (key === "photo-subject" && getCustomPhotoSubject()) return true;
  return getSelectionValues(key).length > 0;
}

function getInputValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function getCustomPhotoSubject() {
  return String(state.customPhotoSubject || "").trim();
}

function getUserInputParts() {
  return {
    content: getInputValue("userContent"),
    designContext: getInputValue("userDesignContext"),
    exclusions: getInputValue("userExclusions"),
  };
}

function hasStructuredUserInput() {
  const parts = getUserInputParts();
  return Boolean(parts.content || parts.designContext || parts.exclusions);
}

function formatUserInputPreview(parts, lang) {
  const lines = [];

  if (parts.content) {
    lines.push(lang === "ko" ? "[슬라이드에 표시할 내용]" : "[Slide content to render]");
    lines.push(parts.content);
  }

  if (parts.designContext) {
    if (lines.length) lines.push("");
    lines.push(lang === "ko" ? "[디자인 이해용 스크립트/맥락 - 원문 삽입 금지]" : "[Design context/script - do not render verbatim]");
    lines.push(parts.designContext);
  }

  if (parts.exclusions) {
    if (lines.length) lines.push("");
    lines.push(lang === "ko" ? "[슬라이드 구성 시 금지 요소]" : "[Forbidden composition elements]");
    lines.push(parts.exclusions);
  }

  return lines.join("\n");
}

function getCurrentPageType() {
  return PAGE_TYPES.find((item) => item.id === state.pageType) || PAGE_TYPES[3];
}

function getAllowedOptions(key) {
  if (key !== "content") return OPTIONS[key] || [];
  const allowed = CONTENT_FILTERS[state.pageType];
  if (!allowed) return OPTIONS.content;
  return OPTIONS.content.filter((item) => allowed.includes(item.text));
}

function findOptionByText(key, text) {
  const normalizedText = typeof normalizeOptionText === "function" ? normalizeOptionText(key, text) : text;
  return (OPTIONS[key] || []).find((item) => item.text === normalizedText) || null;
}

function getPageRule() {
  return PAGE_RULES[state.pageType] || PAGE_RULES.body;
}

// 타이틀바 모드 분류
// REF: 첨부 이미지 타이틀바 차용 — 다른 헤더 옵션은 자동 무시
// NEW: 참조 없이 새 디자인 — 헤더 옵션 활성
// MIN: 최소화/없음 — 헤더 옵션 비활성
const TITLE_BAR_MODE_REF     = ["첨부 이미지 타이틀바 디자인 차용"];
const TITLE_BAR_MODE_NEW     = ["새 타이틀바 디자인 (참조 없이)"];
const TITLE_BAR_MODE_MINIMAL = ["타이틀바 최소화 / 없음"];
const REFERENCE_SCOPE_TITLE_BAR = ["타이틀바만 참조"];
const REFERENCE_SCOPE_FULL = ["전체 디자인 참조"];

// 첨부 이미지의 타이틀바 디자인을 차용하는 모드
function isTitleBarFromReference() {
  const tr = state.selections["title-bar-rule"];
  if (!tr) return false;
  return TITLE_BAR_MODE_REF.includes(tr.text);
}

// 타이틀바 자체를 거의/전혀 그리지 않는 모드
function isTitleBarMinimized() {
  const tr = state.selections["title-bar-rule"];
  if (!tr) return false;
  return TITLE_BAR_MODE_MINIMAL.includes(tr.text);
}

function isFullDesignReference() {
  const scope = state.selections["reference-scope"];
  return Boolean(scope && REFERENCE_SCOPE_FULL.includes(scope.text));
}

function isTitleBarReferenceScope() {
  const scope = state.selections["reference-scope"];
  return Boolean(scope && REFERENCE_SCOPE_TITLE_BAR.includes(scope.text));
}

// 헤더 디자인을 참조에서 가져오거나 그리지 않을 때 의미 없어지는 키들
const HEADER_DESIGN_KEYS_OVERRIDDEN_BY_PRESERVE = [
  "header-bg", "header-shape", "header-line", "header-icon",
  "header-align", "header-bar-settings",
  "header-slot-ratio", "header-slot-left", "header-slot-center", "header-slot-right",
  "logo-handling", "page-number",
];

const FULL_REFERENCE_OMITTED_KEYS = [
  "mood", "quality", "screen-elements", "material", "lighting",
  "bg", "bg-style", "bg-tone", "bg-solid-color",
  "palette", "color-system",
  "pattern", "hierarchy", "typography", "spacing", "density",
  "layout",
  "title-bar-rule", "logo-handling", "page-number",
  "header-bg", "header-shape", "header-line", "header-icon", "header-align", "header-bar-settings",
  "header-slot-ratio", "header-slot-left", "header-slot-center", "header-slot-right",
  "footer-bar", "footer-shape", "footer-elem", "footer-align", "footer-bar-settings",
];

// 바닥글 형태가 '없음'일 때 무효화되는 키들
const FOOTER_DEPENDENT_KEYS = [
  "footer-shape", "footer-elem", "footer-align", "footer-bar-settings",
];

const PHOTO_COMPOSITE_TEXT_MIGRATIONS = {
  "악센트형 합성": "포인트 보조 컷",
  "병렬 카드형 합성": "정보 카드 주변",
  "배경 레이어형 합성": "저채도 배경 레이어",
  "전면 합성": "대형 히어로 영역",
};

function migratePhotoCompositeText(text) {
  return PHOTO_COMPOSITE_TEXT_MIGRATIONS[text] || text;
}

function isFooterNoneSelected() {
  const footerBar = state.selections["footer-bar"];
  return Boolean(footerBar && (footerBar.icon === "NONE" || footerBar.text === "없음" || footerBar.text === "?놁쓬"));
}

function isOptionDisabled(key) {
  if (getPageRule().disabledKeys.includes(key)) return true;

  if (key === "color-system" && isAiDelegatedSelection("palette")) {
    return true;
  }

  if (isFullDesignReference() && FULL_REFERENCE_OMITTED_KEYS.includes(key)) {
    return true;
  }

  if (FOOTER_DEPENDENT_KEYS.includes(key) && isFooterNoneSelected()) {
    return true;
  }

  // 실사 합성 적용 요소가 미선택이거나 '사용 안 함'만 선택되어 있으면 피사체 선택을 비활성화
  if (key === "photo-subject") {
    const texts = getSelectionValues("photo-composite").map((v) => v.text);
    const hasActive = texts.some((t) => t !== "사용 안 함");
    if (!hasActive) return true;
  }

  // 배경 톤은 단색 배경이거나 배경 콘텐츠가 '장식 없음'일 때 의미 없음
  if (key === "bg-tone") {
    const bgBase = state.selections.bg;
    const bgStyle = state.selections["bg-style"];
    if (!bgStyle) return true;
    if (bgBase?.text === "단색 배경" || bgStyle.text === "장식 없음 (기본)") return true;
  }

  // 타이틀바 모드별 헤더 디자인 옵션 일괄 비활성화
  // - REF: 첨부 이미지 디자인을 그대로 차용하므로 다른 헤더 옵션은 의미 없음
  // - MIN: 헤더 자체를 거의 그리지 않으므로 옵션 의미 없음
  if ((isTitleBarFromReference() || isTitleBarMinimized()) && HEADER_DESIGN_KEYS_OVERRIDDEN_BY_PRESERVE.includes(key)) {
    return true;
  }

  // 슬롯 비율이 선택되면 헤더 정렬은 슬롯 구조에 흡수됨
  if (key === "header-align" && state.selections["header-slot-ratio"]) {
    return true;
  }

  // 좌측 슬롯이 로고/라벨/배지 역할을 직접 수행하면 header-icon은 중복
  if (key === "header-icon") {
    const leftSlot = state.selections["header-slot-left"];
    if (leftSlot && (leftSlot.text === "브랜드 마크/로고" || leftSlot.text === "카테고리 라벨" || leftSlot.text === "섹션 번호 배지")) {
      return true;
    }
  }

  // 우측 슬롯 또는 푸터 요소에 페이지 번호가 들어가면 page-number 그룹 자체는 비활성화
  // (어디에 표시할지가 이미 다른 그룹에서 결정되었으므로)
  if (key === "page-number") {
    const rightSlot = getSelectionValues("header-slot-right").map((v) => v.text);
    const footerElem = getSelectionValues("footer-elem").map((v) => v.text);
    if (rightSlot.includes("페이지 번호") || footerElem.includes("페이지 넘버")) {
      return true;
    }
  }

  // 바닥글이 '없음'이면 형태·콘텐츠·정렬·높이·컬러 모두 의미 없음
  if (FOOTER_DEPENDENT_KEYS.includes(key)) {
    const fb = state.selections["footer-bar"];
    if (fb && fb.text === "없음") return true;
  }

  return false;
}

function getDisableReason(key) {
  const pageReason = getPageRule().reasons[key];
  if (pageReason) return pageReason;

  if (key === "color-system" && isAiDelegatedSelection("palette")) {
    return "컬러 프리셋이 AI 위임으로 설정되어 있어 고정 HEX 컬러 입력은 사용하지 않습니다.";
  }

  if (FOOTER_DEPENDENT_KEYS.includes(key) && isFooterNoneSelected()) {
    return "바닥글 형태가 '없음'으로 설정되어 있어 이 옵션은 적용되지 않습니다.";
  }

  if (isFullDesignReference() && FULL_REFERENCE_OMITTED_KEYS.includes(key)) {
    return "참조 이미지가 전체 디자인 기준으로 설정되어 있어 이 스타일·레이아웃 관련 옵션은 최종 프롬프트에서 생략됩니다.";
  }

  if (key === "photo-subject") {
    const texts = getSelectionValues("photo-composite").map((v) => v.text);
    if (!texts.length) return "먼저 위에서 '실사 합성 적용 요소'를 1개 이상 선택하면 활성화됩니다.";
    if (texts.every((t) => t === "사용 안 함")) return "'실사 합성 적용 요소'가 사용 안 함으로 설정되어 있습니다.";
  }

  if (key === "bg-tone") {
    const bgBase = state.selections.bg;
    const bgStyle = state.selections["bg-style"];
    if (!bgStyle) return "먼저 '배경 콘텐츠 종류'를 선택하면 활성화됩니다.";
    if (bgBase?.text === "단색 배경") return "단색 배경은 컬러/흑백 구분이 의미 없습니다. 아래 단색 컬러 입력으로 직접 지정하세요.";
    if (bgStyle.text === "장식 없음 (기본)") return "장식 없음 모드에서는 배경 톤 옵션이 적용되지 않습니다.";
  }

  // REF — 첨부 이미지 타이틀바를 차용하므로 다른 헤더 옵션 의미 없음
  if (isTitleBarFromReference() && HEADER_DESIGN_KEYS_OVERRIDDEN_BY_PRESERVE.includes(key)) {
    return "첨부 이미지 타이틀바 차용 모드에서는 헤더 디자인을 참조 이미지에서 그대로 가져오므로 다른 헤더 옵션은 적용되지 않습니다.";
  }

  // 최소화/없음 모드 — 헤더를 그리지 않으므로 헤더 디자인 옵션 의미 없음
  if (isTitleBarMinimized() && HEADER_DESIGN_KEYS_OVERRIDDEN_BY_PRESERVE.includes(key)) {
    return "타이틀바 최소화/없음 모드에서는 헤더를 거의 그리지 않으므로 디자인 옵션이 적용되지 않습니다.";
  }

  if (key === "header-align" && state.selections["header-slot-ratio"]) {
    return "슬롯 구조가 선택되면 정렬은 슬롯 정의(좌:좌측, 중:헤더 정렬, 우:우측)에 흡수됩니다.";
  }

  if (key === "header-icon") {
    const leftSlot = state.selections["header-slot-left"];
    if (leftSlot && (leftSlot.text === "브랜드 마크/로고" || leftSlot.text === "카테고리 라벨" || leftSlot.text === "섹션 번호 배지")) {
      return `좌측 슬롯이 '${leftSlot.text}' 역할을 수행하므로 헤더 아이콘 옵션은 중복됩니다.`;
    }
  }

  if (key === "page-number") {
    const rightSlot = getSelectionValues("header-slot-right").map((v) => v.text);
    const footerElem = getSelectionValues("footer-elem").map((v) => v.text);
    if (rightSlot.includes("페이지 번호")) return "타이틀바 우측 슬롯에 이미 페이지 번호가 포함되어 있어 별도 페이지 번호 정책 설정이 중복됩니다.";
    if (footerElem.includes("페이지 넘버")) return "바닥글 콘텐츠에 이미 페이지 넘버가 포함되어 있어 별도 페이지 번호 정책 설정이 중복됩니다.";
  }

  // 바닥글이 '없음'이면 하위 옵션 의미 없음
  if (FOOTER_DEPENDENT_KEYS.includes(key)) {
    const fb = state.selections["footer-bar"];
    if (fb && fb.text === "없음") return "바닥글 형태가 '없음'으로 설정되어 있어 이 옵션은 적용되지 않습니다.";
  }

  return "";
}

function getAutoForbiddenRuleEntries() {
  const entries = [];
  const common = [...(AUTO_FORBIDDEN_RULES.common || [])];
  const typed = AUTO_FORBIDDEN_RULES[state.pageType] || [];

  if (!isFullDesignReference() && hasFixedColorSystem()) {
    common.push({
      ko: "지정된 컬러 시스템 이외의 색상 톤을 임의로 추가하거나 사용하지 말 것",
      en: "do NOT introduce any color tones outside the specified color system — strictly follow the defined palette",
    });
  }

  common.forEach((item, index) => {
    entries.push({
      id: `special:auto-forbidden:common:${index}`,
      sourceLabel: "Common Rule",
      ko: item.ko,
      en: item.en,
    });
  });

  if (!isFullDesignReference()) {
    typed.forEach((item, index) => {
      entries.push({
        id: `special:auto-forbidden:${state.pageType}:${index}`,
        sourceLabel: "Page Rule",
        ko: item.ko,
        en: item.en,
        canonicalId: `page-safety:${state.pageType}:${index}`,
      });
    });
  }

  const titleRule = state.selections["title-bar-rule"];
  entries.push({
    id: "special:auto-forbidden:trademark-safety",
    sourceLabel: "Trademark Safety Rule",
    ko: (titleRule && isTitleBarFromReference()) || isFullDesignReference()
      ? "참조 이미지에 포함된 특정 기관·기업의 로고, 워드마크, 공식 엠블럼, 등록 상표를 그대로 재현하지 말고, 실제 존재하는 기관·기업·정부의 공식 로고나 등록 상표도 임의로 생성하거나 모사하지 말 것. 해당 영역은 깔끔한 빈 자리로 둘 것."
      : "실제 존재하는 기관·기업·정부의 공식 로고나 등록 상표를 임의로 생성하거나 모사하지 말 것",
    en: (titleRule && isTitleBarFromReference()) || isFullDesignReference()
      ? "DO NOT verbatim reproduce logos, wordmarks, official emblems, or registered trademarks from the reference image, and do NOT generate or imitate any real existing organization's, company's, or government agency's official logo or registered trademark. Leave such areas as clean placeholder space."
      : "DO NOT generate or imitate any real existing organization's, company's, or government agency's official logo or registered trademark",
    canonicalId: "trademark-safety",
  });

  return entries;
}

function getAutoForbiddenRules(lang) {
  return getAutoForbiddenRuleEntries().map((item) => (lang === "ko" ? item.ko : item.en));
}

function buildColorSystemText(lang) {
  if (isAiDelegatedColorSystem()) {
    return lang === "ko"
      ? [
          "▸ 컬러 프리셋: AI 위임 — 고정된 컬러값을 사용하지 말고, 슬라이드 주제, 발표 목적, 페이지 유형, 정보량, 배경 방식에 맞춰 컬러 방향을 결정한다.",
          "▸ Primary/Secondary/Accent/Background/Text의 역할은 유지하되 실제 색상값은 본문 가독성, 브랜드감, 전문성, 배경 대비를 기준으로 조화롭게 정한다.",
          "▸ Accent 색상은 버튼, 아이콘, 포인트 라인, 핵심 수치 강조에만 제한적으로 사용하고 전체 화면을 지배하지 않게 한다.",
          "▸ 배경색과 텍스트색은 충분한 대비를 유지하며, 차트·라벨·작은 글자의 판독성을 해치지 않게 한다.",
        ].join("\n")
      : [
          "▸ Color preset: AI-directed — do not use fixed color values; determine the color direction according to the slide topic, presentation purpose, page type, information density, and background approach.",
          "▸ Keep the roles of Primary, Secondary, Accent, Background, and Text, but decide the actual colors based on body readability, brand character, professional tone, and background contrast.",
          "▸ Use Accent color sparingly for buttons, icons, point lines, and key numeric emphasis only; it must not dominate the canvas.",
          "▸ Maintain strong contrast between background and text, and protect readability for charts, labels, and small typography.",
        ].join("\n");
  }

  const { primary, secondary, accent, accentWeight, backgroundBlock, text } = state.colorSystem;
  const solidBgActive = state.selections.bg?.text === "단색 배경";
  const koBackgroundBlockUsage = solidBgActive
    ? "콘텐츠 영역 블록 배경에 사용 (전체 캔버스 배경은 단색 배경 지정 컬러가 우선)"
    : "슬라이드 배경 및 콘텐츠 영역 블록 배경";
  const enBackgroundBlockUsage = solidBgActive
    ? "use for content area fills only; the solid background color controls the full canvas background"
    : "use for slide background and content area fills";

  if (lang === "ko") {
    return [
      `\u25B8 Primary ${primary}  \u2192  \uc8fc\uc694 \uad6c\uc870\uc120, \uc139\uc158 \ubc14, \ud575\uc2ec \uac15\uc870 \ube14\ub85d\uc5d0 \uc0ac\uc6a9`,
      `\u25B8 Secondary ${secondary}  \u2192  \ubcf4\uc870 \uad6c\uc870\uc120, \uc11c\ube0c\ud0c0\uc774\ud2c0, \uad6c\ubd84 \uc694\uc18c\uc5d0 \uc0ac\uc6a9`,
      `\u25B8 Accent ${accent}  |  \uc804\uccb4 \uce94\ubc84\uc2a4 \ub300\ube44 \ucd5c\ub300 ${accentWeight}%  \u2192  \ubc84\ud2bc, \uc544\uc774\ucf58, \ud3ec\uc778\ud2b8 \ub77c\uc778\uc5d0\ub9cc \uc81c\ud55c \uc0ac\uc6a9`,
      `\u25B8 Background Block ${backgroundBlock}  \u2192  ${koBackgroundBlockUsage}`,
      `\u25B8 Text ${text}  \u2192  \ubcf8\ubb38 \ud14d\uc2a4\ud2b8, \ucea1\uc158, \ub77c\ubca8 \uc804\ubc18`,
      `\u25B8 \uc8fc\uc758: \uc704 \uceec\ub7ec \ud314\ub808\ud2b8 \uc774\uc678\uc758 \uc0c9\uc0c1\uc744 \uc784\uc758\ub85c \ucd94\uac00\ud558\uac70\ub098 \uc0ac\uc6a9\ud558\uc9c0 \ub9d0 \uac83`,
    ].join("\n");
  } else {
    return [
      `\u25B8 Primary ${primary}  \u2192  use for main structural lines, section bars, and key emphasis blocks`,
      `\u25B8 Secondary ${secondary}  \u2192  use for structural dividers, sub-titles, and supporting elements`,
      `\u25B8 Accent ${accent}  |  max ${accentWeight}% of total canvas area  \u2192  restrict to buttons, icons, and accent lines only`,
      `\u25B8 Background Block ${backgroundBlock}  \u2192  ${enBackgroundBlockUsage}`,
      `\u25B8 Text ${text}  \u2192  use for all body text, captions, and labels`,
      `\u25B8 NOTE: DO NOT introduce any color outside this defined palette`,
    ].join("\n");
  }
}

function buildHeaderSlotGridText(lang) {
  const ratio  = state.selections["header-slot-ratio"];
  const left   = state.selections["header-slot-left"];
  const center = state.selections["header-slot-center"];
  const right  = getSelectionValues("header-slot-right");

  // 아무것도 선택되지 않았다면 출력 생략
  if (!ratio && !left && !center && !right.length) return "";

  const lines = [];

  if (lang === "ko") {
    lines.push("▸ 타이틀바를 좌(LEFT) · 중(CENTER) · 우(RIGHT) 세 개의 고정 슬롯으로 나눕니다. 모든 페이지에서 슬롯 구조와 비율은 동일하게 유지되어야 하며, 한 슬롯의 콘텐츠가 다른 슬롯 영역으로 침범하지 않도록 합니다.");
    if (ratio)  lines.push(`▸ 슬롯 너비 비율 (좌:중:우) — ${ratio.text}`);
    lines.push(`▸ LEFT 슬롯 — ${left ? left.text : "비움"}`);
    lines.push(`▸ CENTER 슬롯 — ${center ? center.text : "슬라이드 제목 (단일 라인) (기본)"}`);
    if (right.length) {
      lines.push(`▸ RIGHT 슬롯 — ${right.map((r) => r.text).join(" + ")} (우측 정렬, 보조 색상)`);
    } else {
      lines.push("▸ RIGHT 슬롯 — 비움");
    }
    lines.push("▸ 각 슬롯의 정렬 기준: LEFT 슬롯=좌측 정렬, CENTER 슬롯=좌측 또는 중앙 정렬(헤더 정렬 옵션을 따름), RIGHT 슬롯=우측 정렬");
    lines.push("▸ 텍스트 콘텐츠(제목, 페이지 번호 등)는 페이지마다 새 내용으로 교체되지만, 슬롯 구조·비율·정렬·서체 인상은 모든 페이지에서 동일하게 유지");
  } else {
    lines.push("▸ Divide the title bar into three FIXED slots: LEFT, CENTER, RIGHT. The slot structure and width ratio must remain IDENTICAL across every slide of the deck. Content from one slot must NOT spill into another slot.");
    if (ratio)  lines.push(`▸ Slot width ratio (Left:Center:Right) — ${ratio.en.replace(/^header slot ratio[^—]*— /i, "")}`);
    lines.push(`▸ LEFT slot — ${left ? left.en.replace(/^header LEFT slot content: /i, "") : "empty (no content)"}`);
    lines.push(`▸ CENTER slot — ${center ? center.en.replace(/^header CENTER slot content: /i, "") : "single-line slide title in title typography (default)"}`);
    if (right.length) {
      lines.push(`▸ RIGHT slot — ${right.map((r) => r.en.replace(/^header RIGHT slot content: /i, "")).join(" + ")}`);
    } else {
      lines.push("▸ RIGHT slot — empty (no content)");
    }
    lines.push("▸ Alignment per slot: LEFT slot is left-aligned, CENTER slot follows the header alignment option, RIGHT slot is right-aligned. Vertical centering applies in all slots.");
    lines.push("▸ Textual content (title text, page number, etc.) is replaced per slide, but the slot structure, ratio, alignment rules, and typography character must remain identical on every slide.");
  }

  return lines.join("\n");
}

function inferPromptPriority(sourceKey, id) {
  if (sourceKey === "auto-forbidden" || id.includes("no-real-logos")) return 100;
  if (state.promptLineOverrides[id]) return 90;
  if (sourceKey === "title-bar-rule" || id.includes("reference-priority")) return 80;
  if (sourceKey === "pageType" || sourceKey === "format") return 70;
  if (sourceKey === "color-system" || sourceKey === "palette" || sourceKey === "bg-solid-color") return 60;
  if (sourceKey === "layout" || sourceKey === "content") return 50;
  if (sourceKey?.startsWith("header") || sourceKey === "logo-handling" || sourceKey === "page-number") return 45;
  if (sourceKey?.startsWith("footer")) return 40;
  return 30;
}

function makePromptEntry(id, sourceLabel, ko, en, sourceKey = null, priority = null, canonicalId = null) {
  const entryPriority = priority ?? inferPromptPriority(sourceKey, id);
  return {
    id,
    sourceLabel,
    ko,
    en,
    sourceKey,
    priority: entryPriority,
    canonicalId: canonicalId || id,
  };
}

function getPromptLineOverride(id, lang) {
  return state.promptLineOverrides[id]?.[lang] || "";
}

function setPromptLineOverride(id, lang, value, fallbackText) {
  const next = value.trim();
  const fallback = (fallbackText || "").trim();

  if (!next || next === fallback) {
    if (!state.promptLineOverrides[id]) return;
    delete state.promptLineOverrides[id][lang];
    if (!state.promptLineOverrides[id].ko && !state.promptLineOverrides[id].en) {
      delete state.promptLineOverrides[id];
    }
    return;
  }

  if (!state.promptLineOverrides[id]) {
    state.promptLineOverrides[id] = { ko: "", en: "" };
  }

  state.promptLineOverrides[id][lang] = next;
}

function resetPromptLineOverride(id, lang = null) {
  if (!state.promptLineOverrides[id]) return;

  if (!lang) {
    delete state.promptLineOverrides[id];
    return;
  }

  delete state.promptLineOverrides[id][lang];
  if (!state.promptLineOverrides[id].ko && !state.promptLineOverrides[id].en) {
    delete state.promptLineOverrides[id];
  }
}

function getPromptLineDraft(id, lang) {
  const draft = state.promptLineDrafts[id]?.[lang];
  return typeof draft === "string" ? draft : null;
}

function setPromptLineDraft(id, lang, value) {
  if (!state.promptLineDrafts[id]) {
    state.promptLineDrafts[id] = {};
  }
  state.promptLineDrafts[id][lang] = value;
}

function clearPromptLineDraft(id, lang = null) {
  if (!state.promptLineDrafts[id]) return;

  if (!lang) {
    delete state.promptLineDrafts[id];
    return;
  }

  delete state.promptLineDrafts[id][lang];
  if (typeof state.promptLineDrafts[id].ko !== "string" && typeof state.promptLineDrafts[id].en !== "string") {
    delete state.promptLineDrafts[id];
  }
}

function hasPromptLineDraft(id) {
  return Boolean(state.promptLineDrafts[id]);
}

function getPromptEditorValue(entry, lang) {
  const draft = getPromptLineDraft(entry.id, lang);
  return draft !== null ? draft : resolvePromptEntryText(entry, lang);
}

function savePromptLineDraft(entry) {
  ["ko", "en"].forEach((lang) => {
    const fallback = lang === "ko" ? entry.ko : entry.en;
    const draft = getPromptLineDraft(entry.id, lang);
    const value = draft !== null ? draft : resolvePromptEntryText(entry, lang);
    setPromptLineOverride(entry.id, lang, value, fallback);
  });
  clearPromptLineDraft(entry.id);
}

function resetPromptOverridesForKey(key) {
  getEditablePromptEntriesForKey(key, { dedupe: false, includeOmitted: true }).forEach((entry) => {
    resetPromptLineOverride(entry.id);
    clearPromptLineDraft(entry.id);
  });
}

function resolvePromptEntryText(entry, lang) {
  const override = getPromptLineOverride(entry.id, lang).trim();
  if (override) return override;
  return lang === "ko" ? entry.ko : entry.en;
}

const PROMPT_LEADING_BULLET_RE = /^\s*(?:[-*+]\s+|\u2023\s+|\u25B8\s+)/;

function stripPromptBullet(text) {
  return String(text || "").replace(PROMPT_LEADING_BULLET_RE, "").trimStart();
}

function formatPromptListItem(text, marker = "\u2023") {
  const clean = stripPromptBullet(text);
  return clean ? `${marker} ${clean}` : "";
}

function formatMarkdownPromptLine(line) {
  const trimmed = String(line || "").trim();
  if (!trimmed) return "";

  const markdownList = trimmed.match(/^([-*+]\s+|\d+\.\s+)(.*)$/);
  if (markdownList) {
    return `${markdownList[1]}${stripPromptBullet(markdownList[2])}`.trimEnd();
  }

  if (/^(```|#{1,6}\s|>|-{3,}$)/.test(trimmed)) {
    return trimmed;
  }

  return `- ${stripPromptBullet(trimmed)}`;
}

function stripPromptBulletsForProse(text) {
  return String(text || "").replace(/(^|\n)\s*(?:[-*+]\s+|\u2023\s+|\u25B8\s+)/g, "$1");
}

function formatPromptEntries(entries, lang) {
  const resolved = entries
    .map((entry) => ({ entry, text: resolvePromptEntryText(entry, lang) }))
    .filter((item) => item.text);

  if (!resolved.length) return "";

  const isBlock = resolved.length === 1 && resolved[0].text.includes("\n");
  if (isBlock) return resolved[0].text;

  if (resolved.length === 1) return resolved[0].text;
  return resolved.map((item) => formatPromptListItem(item.text)).join("\n");
}

function getSelectionCanonicalId(key, item) {
  const token = String(item?.icon || item?.text || "custom").replace(/\s+/g, "-");

  if (key === "format") return "canvas-format";
  if (key === "reference-scope") return "reference-image-scope";
  if (key === "bg" && item?.text === "단색 배경") return "background-surface";
  if (key === "title-bar-rule" && TITLE_BAR_MODE_REF.includes(item?.text)) return "titlebar-reference-mode";
  if (key === "title-bar-rule") return "titlebar-mode";
  if (key === "page-number") return "page-number-location";
  if (key === "logo-handling") return "logo-handling-policy";
  if (key === "layout") return "layout-structure";
  if (key === "hierarchy") return "visual-hierarchy";
  if (key === "spacing") return "space-management";
  if (key === "density") return "information-density";
  if (key === "typography") return "typography-tone";
  if (key === "pattern") return "graphic-motif";
  if (key === "content") return `content-component:${token}`;

  return `selection:${key}:${token}`;
}

function stripPromptPrefix(text, prefixes) {
  let next = text || "";
  prefixes.forEach((prefix) => {
    next = next.replace(new RegExp(`^${prefix}:\\s*`, "i"), "");
  });
  return next;
}

function getKoreanSelectionDetail(key, item) {
  const text = String(item?.text || "").trim();
  const sub = String(item?.sub || "").trim();
  const base = sub ? `${text} — ${sub}` : text;
  const directives = {
    format: "슬라이드 전체의 화면비, 여백, 콘텐츠 배치 기준을 이 규격에 맞춰 설계한다.",
    mood: "전체 시각 톤, 색감, 타이포그래피 인상, 그래픽 밀도를 이 분위기에 맞춰 통일한다.",
    quality: "이미지 생성 결과의 해상도, 텍스트 선명도, 차트 정확도, 출력 안정성에 이 기술 품질 조건을 반영한다.",
    "screen-elements": "실제 PPT 화면에 포함할 구성 요소를 이 조건에 맞춰 선택하고, 각 요소가 정보 전달에 기여하도록 배치한다.",
    material: "선택한 화면 구성 요소를 이 렌더링 스타일로 표현하되, 품질 조건이나 배경 설계와 역할이 섞이지 않게 한다.",
    lighting: "빛, 그림자, 깊이, 오버레이 같은 시각 연출을 이 조건에 맞춰 적용하되, 본문 가독성을 해치지 않게 조절한다.",
    bg: "슬라이드 배경의 기본 바탕과 정보 영역의 구분감을 이 배경 베이스 조건에 맞춰 설계한다.",
    "bg-style": "배경 위에 실제로 들어갈 콘텐츠 레이어의 종류와 강도를 이 조건에 맞춰 정하고, 전경 정보와 경쟁하지 않게 만든다.",
    "bg-tone": "배경 콘텐츠의 색상 표현 강도와 채도, 명도, 텍스트 대비를 이 톤에 맞춰 조정한다.",
    palette: "전체 컬러 시스템과 강조색 사용, 배경 블록, 텍스트 대비를 이 팔레트 인상에 맞춰 구성한다.",
    pattern: "배경 콘텐츠와 별도로 정보 영역을 보조하는 장식 모티프만 이 조건에 맞춰 적용한다.",
    hierarchy: "시선 흐름, 강조 우선순위, 주요 메시지의 위치와 크기를 이 위계 기준에 맞춰 설계한다.",
    typography: "제목, 소제목, 본문, 라벨의 서체 인상과 굵기 대비를 이 방향에 맞춰 잡는다.",
    spacing: "여백, 카드 간격, 요소 간 거리, 화면의 밀도감을 이 공간 운용 기준에 맞춰 조절한다.",
    density: "정보량과 시각 요소의 복잡도를 이 밀도 기준에 맞춰 조절하고 과밀하거나 허전하지 않게 균형을 잡는다.",
    layout: "본문 정보와 시각 요소의 배치 구조를 이 레이아웃 방향에 맞춰 구성한다.",
    "page-number": "페이지 번호 표시 여부와 위치, 반복 방식을 이 정책에 맞춰 일관되게 적용한다.",
    "logo-handling": "로고 또는 로고 자리의 표현 범위와 안전한 대체 방식을 이 정책에 맞춰 처리한다.",
    content: "슬라이드 본문 정보를 이 컴포넌트 형식으로 시각화하고, 핵심 메시지가 먼저 읽히게 구성한다.",
    "text-policy": "제공된 원문을 슬라이드에 반영하는 범위와 문장 길이를 이 정책에 맞춰 제한한다.",
    "header-shape": "상단 헤더 바의 외곽 형태와 끝 처리 방식을 이 형태에 맞춰 설계한다.",
    "header-align": "헤더 안의 제목과 보조 정보 정렬을 이 기준에 맞춰 배치한다.",
    "header-icon": "헤더 영역의 아이콘 또는 배지 사용 여부와 시각적 무게를 이 조건에 맞춘다.",
    "header-slot-ratio": "헤더의 좌측, 중앙, 우측 슬롯 폭과 정보 배분을 이 비율에 맞춰 구성한다.",
    "header-slot-left": "헤더 왼쪽 슬롯에 들어갈 콘텐츠와 시각적 무게를 이 조건에 맞춰 배치한다.",
    "header-slot-center": "헤더 중앙 슬롯의 제목 구조와 보조 텍스트 사용 방식을 이 조건에 맞춘다.",
    "header-slot-right": "헤더 오른쪽 슬롯의 메타 정보, 번호, 로고 또는 진행 표시를 이 조건에 맞춰 배치한다.",
    "footer-bar": "하단 바 또는 구분선의 존재, 두께, 면 처리 방식을 이 조건에 맞춰 모든 슬라이드에 일관 적용한다.",
    "footer-elem": "바닥글에 반복될 정보 요소와 페이지별로 달라지는 요소를 이 조건에 맞춰 구분한다.",
    "footer-align": "바닥글 요소의 정렬과 분산 방식을 이 기준에 맞춰 배치한다.",
    "footer-shape": "바닥글 선 또는 바의 형태, 모서리, 강조선 구조를 이 조건에 맞춰 설계한다.",
    "photo-composite": "실사 사진을 이 적용 요소에 배치하되, 선택한 요소들이 서로 경쟁하지 않도록 정보 가독성을 우선해 조합한다.",
    "photo-subject": "사용할 실사 이미지의 주제와 장면 선택을 이 대상 범위에 맞춰 고른다.",
    "forbidden-rules": "이미지 생성 시 이 항목을 명시적으로 피하고, 결과물의 안정성과 가독성을 우선한다.",
  };
  const directive = directives[key] || "이 선택을 슬라이드의 시각 스타일, 레이아웃, 이미지 생성 지시에 명확히 반영한다.";
  return base ? `${base}. ${directive}` : directive;
}

function getSelectionPromptText(key, item) {
  const ko = getKoreanSelectionDetail(key, item);
  const en = item.en;

  if (item.text === "AI 위임") {
    if (key === "palette") {
      return {
        ko: buildColorSystemText("ko"),
        en: buildColorSystemText("en"),
      };
    }
    if (key === "bg") {
      return {
        ko: "배경 베이스: AI 위임 — 슬라이드 주제, 페이지 유형, 정보량, 텍스트 밀도, 발표용 가독성을 기준으로 가장 적절한 배경 방식을 스스로 결정한다. 정보 전달형 슬라이드에서는 깨끗하고 대비가 안정적인 배경을 우선하고, 표지·구분 페이지처럼 메시지 중심인 경우에만 더 표현적인 배경을 허용한다. 배경은 장식보다 정보 전달을 보조해야 하며, 전경 텍스트와 도표의 판독성을 해치지 않아야 한다.",
        en: "background base: AI-directed — determine the most suitable background approach based on the slide topic, page type, information volume, text density, and presentation readability. For information-heavy slides, prioritize a clean, stable, high-contrast background; allow more expressive backgrounds only for message-led slides such as covers or section dividers. The background must support information delivery rather than decoration and must not harm the readability of foreground text or diagrams.",
      };
    }
    if (key === "bg-style") {
      return {
        ko: "배경 콘텐츠: AI 위임 — 슬라이드 메시지와 본문 정보량에 맞춰 배경 콘텐츠의 필요 여부와 표현 강도를 결정한다. 본문 텍스트, 표, 차트, 카드가 많은 경우에는 배경 장식을 최소화하고, 표지·섹션 구분·브랜드 메시지형 슬라이드에서는 주제를 보조하는 이미지, 추상 그래픽, 데이터 모티프 등을 절제해 사용할 수 있다. 배경 콘텐츠는 전경 정보보다 낮은 시각 우선순위를 가져야 하며, 텍스트·차트·카드 경계와 경쟁하지 않게 처리한다.",
        en: "background content: AI-directed — decide whether background content is needed and how strong it should be according to the slide message and body information volume. When the slide contains substantial text, tables, charts, or cards, minimize background decoration; for covers, section dividers, or brand-message slides, restrained subject imagery, abstract graphics, or data motifs may be used as support. Background content must remain visually lower-priority than foreground information and must not compete with text, charts, or card boundaries.",
      };
    }
    if (key === "bg-tone") {
      return {
        ko: "배경 톤: AI 위임 — 선택된 배경 방식과 슬라이드 내용에 맞춰 색감, 채도, 명도, 대비를 조정한다. 정보 전달형 슬라이드에서는 낮은 채도와 높은 가독성을 우선하고, 메시지 중심 슬라이드에서는 더 풍부한 색감을 사용할 수 있다. 어떤 톤을 선택하더라도 본문 텍스트, 작은 라벨, 차트 축과 범례가 명확히 읽혀야 한다.",
        en: "background tone: AI-directed — adjust color character, saturation, brightness, and contrast according to the chosen background approach and slide content. For information-delivery slides, prioritize restrained saturation and high readability; for message-led slides, richer color may be used. Whatever tone is chosen, body text, small labels, chart axes, and legends must remain clearly readable.",
      };
    }
  }

  switch (key) {
    case "layout":
      return {
        ko: `구조 레이아웃: ${ko}`,
        en: `layout structure: ${stripPromptPrefix(en, ["layout structure"])}`,
      };
    case "hierarchy":
      return {
        ko: `시선 흐름/강조 기준: ${ko}`,
        en: `visual hierarchy rule: ${stripPromptPrefix(en, ["visual hierarchy"])}`,
      };
    case "content":
      return {
        ko: `본문 표현 컴포넌트: ${ko}`,
        en: `content component type: ${stripPromptPrefix(en, ["content layout"])}`,
      };
    case "spacing":
      return {
        ko: `공간 운용: ${ko}`,
        en: `space management: ${stripPromptPrefix(en, ["spacing"])}`,
      };
    case "density":
      return {
        ko: `정보 밀도: ${ko}`,
        en: `information density: ${stripPromptPrefix(en, ["content density"])}`,
      };
    case "typography":
      return {
        ko: `서체 인상: ${ko}`,
        en: `typography character: ${stripPromptPrefix(en, ["typography style"])}`,
      };
    case "pattern":
      return {
        ko: `보조 그래픽 모티프: ${ko}`,
        en: `supporting graphic motif: ${stripPromptPrefix(en, ["graphic motif"])}`,
      };
    case "page-number":
      return {
        ko: `페이지 번호 정책: ${ko}`,
        en: `page numbering policy: ${stripPromptPrefix(en, ["page numbering"])}`,
      };
    case "logo-handling":
      return {
        ko: `로고 처리 정책: ${ko}`,
        en: `logo handling policy: ${stripPromptPrefix(en, ["logo handling"])}`,
      };
    case "bg-style":
      return {
        ko: `배경 콘텐츠 레이어: ${ko}`,
        en: `background content layer: ${stripPromptPrefix(en, ["background content type"])}`,
      };
    case "palette":
      return {
        ko: `컬러 프리셋: ${ko}`,
        en: `color preset: ${stripPromptPrefix(en, ["color scheme"])}`,
      };
    case "reference-scope":
      if (REFERENCE_SCOPE_FULL.includes(item.text)) {
        return {
          ko: "참조 이미지 적용 범위(최우선): 첨부 참조 이미지를 전체 슬라이드 디자인 기준으로 사용합니다. 전체 레이아웃, 배경, 색감, 여백, 타이포그래피 인상, 헤더/바닥글 처리 방식을 참조 이미지에 맞추고, 아래 본문 콘텐츠만 현재 슬라이드 내용으로 교체합니다. 별도 스타일·컬러·레이아웃·헤더·바닥글 옵션은 적용하지 않습니다.",
          en: "reference image scope (highest priority): use the attached reference image as the full-slide design standard. Match the overall layout, background, color impression, spacing, typography character, and header/footer treatment from the reference. Replace only the body content with this slide's actual content. Do not apply separate style, color, layout, header, or footer options.",
        };
      }
      return {
        ko: "참조 이미지 적용 범위: 첨부 참조 이미지는 상단 타이틀바 고정 기준으로만 사용합니다. 본문 영역의 레이아웃·컬러·콘텐츠 표현은 아래 세부 옵션을 적용합니다.",
        en: "reference image scope: use the attached reference image only to lock the top title bar. Apply the detailed options below to the body layout, color, and content expression.",
      };
    case "title-bar-rule":
      if (TITLE_BAR_MODE_REF.includes(item.text)) {
        return {
          ko: "헤더 고정 규칙(최우선): 첨부 참조 이미지의 상단 타이틀바 디자인을 그대로 유지합니다. 높이·배경 형태·색상·선·여백·정렬·페이지 번호 위치와 스타일은 참조 이미지와 동일하게 유지하고, 타이틀 문구와 페이지 번호 텍스트만 현재 슬라이드 내용으로 교체합니다. 로고·상표 영역은 재현하지 말고 빈 자리 또는 중립 placeholder로 둡니다.",
          en: "HEADER LOCK RULE (highest priority): preserve the top title-bar design from the attached reference image. Keep its height, background shape, colors, lines, spacing, alignment, and page-number position/style the same as the reference. Replace only the title text and page-number text with this slide's actual content. Do not reproduce logo or trademark areas; leave them blank or as neutral placeholders.",
        };
      }
      return {
        ko: `타이틀바 설계 방식: ${ko}`,
        en: `title bar mode: ${stripPromptPrefix(en, ["title bar mode"])}`,
      };
    default:
      return { ko, en };
  }
}

function normalizePromptSections(sections) {
  const bestByCanonicalId = new Map();

  sections.forEach((section, sectionIndex) => {
    section.entries.forEach((entry, entryIndex) => {
      const canonicalId = entry.canonicalId || entry.id;
      const current = {
        entry,
        sectionIndex,
        entryIndex,
        priority: entry.priority ?? 0,
        hasOverride: Boolean(state.promptLineOverrides[entry.id]),
      };
      const previous = bestByCanonicalId.get(canonicalId);

      if (
        !previous ||
        current.priority > previous.priority ||
        (current.priority === previous.priority && current.hasOverride && !previous.hasOverride)
      ) {
        bestByCanonicalId.set(canonicalId, current);
      }
    });
  });

  const keepIds = new Set([...bestByCanonicalId.values()].map((item) => item.entry.id));

  return sections
    .map((section) => ({
      ...section,
      entries: section.entries.filter((entry) => keepIds.has(entry.id)),
    }))
    .filter((section) => section.entries.length);
}

function buildPromptSections(options = {}) {
  const { dedupe = true, includeOmitted = false } = options;
  const sections = [];
  const conflictOmittedSelections = includeOmitted ? new Set() : getConflictOmittedSelectionSet();

  Object.entries(SECTION_MAP).forEach(([sectionId, section]) => {
    const entries = [];

    section.keys.forEach((key) => {
      if (!includeOmitted && isFullDesignReference() && FULL_REFERENCE_OMITTED_KEYS.includes(key)) return;
      if (!includeOmitted && key !== "pageType" && isOptionDisabled(key)) return;

      if (key === "pageType") {
        const type = getCurrentPageType();
        entries.push(makePromptEntry(
          "special:pageType",
          "Page Type",
          type.text,
          type.en,
          "pageType",
          null,
          "page-role"
        ));
        return;
      }

      if (key === "color-system") {
        entries.push(makePromptEntry(
          "special:color-system",
          OPTION_META[key]?.label || "Color System",
          buildColorSystemText("ko"),
          buildColorSystemText("en"),
          key,
          null,
          "color-system"
        ));
        return;
      }

      if (key === "header-bar-settings") {
        if (isTitleBarFromReference()) return;
        const { headerEnabled, headerHeight, headerColor } = state.barSettings;
        entries.push(makePromptEntry(
          "special:header-bar-settings",
          OPTION_META[key]?.label || "Header Bar Settings",
          headerEnabled
            ? `\u25B8 \uc0c1\ub2e8\ubc14 \uc0ac\uc6a9  |  \ub192\uc774: ${headerHeight}px  |  \uceec\ub7ec: ${formatThemeColorValue(headerColor, "ko")}`
            : `\u25B8 \uc0c1\ub2e8\ubc14 \uc5c6\uc74c \u2014 \uc2ac\ub77c\uc774\ub4dc \uc0c1\ub2e8\uc5d0 \ubcc4\ub3c4 \ubc14 \uad6c\uc870\ub97c \uc0ac\uc6a9\ud558\uc9c0 \uc54a\uc74c`,
          headerEnabled
            ? `\u25B8 Header bar: enabled  |  height: ${headerHeight}px  |  color: ${formatThemeColorValue(headerColor, "en")}`
            : `\u25B8 Header bar: none \u2014 do not render any header bar at the top of the slide`,
          key,
          null,
          "header-bar-settings"
        ));
        return;
      }

      if (key === "footer-bar-settings") {
        const { footerEnabled, footerHeight, footerColor } = state.barSettings;
        entries.push(makePromptEntry(
          "special:footer-bar-settings",
          OPTION_META[key]?.label || "Footer Bar Settings",
          footerEnabled
            ? `\u25B8 \ud558\ub2e8\ubc14 \uc0ac\uc6a9  |  \ub192\uc774: ${footerHeight}px  |  \uceec\ub7ec: ${formatThemeColorValue(footerColor, "ko")}`
            : `\u25B8 \ud558\ub2e8\ubc14 \uc5c6\uc74c \u2014 \uc2ac\ub77c\uc774\ub4dc \ud558\ub2e8\uc5d0 \ubcc4\ub3c4 \ubc14 \uad6c\uc870\ub97c \uc0ac\uc6a9\ud558\uc9c0 \uc54a\uc74c`,
          footerEnabled
            ? `\u25B8 Footer bar: enabled  |  height: ${footerHeight}px  |  color: ${formatThemeColorValue(footerColor, "en")}`
            : `\u25B8 Footer bar: none \u2014 do not render any footer bar at the bottom of the slide`,
          key,
          null,
          "footer-bar-settings"
        ));
        return;
      }

      if (key === "header-slot-grid") {
        const ko = buildHeaderSlotGridText("ko");
        const en = buildHeaderSlotGridText("en");
        if (!ko && !en) return;
        entries.push(makePromptEntry(
          "special:header-slot-grid",
          "Header Slot Grid",
          ko,
          en,
          "header-slot-ratio",
          null,
          "header-slot-grid"
        ));
        return;
      }

      if (key === "auto-forbidden") {
        getAutoForbiddenRuleEntries().forEach((item) => {
          entries.push(makePromptEntry(item.id, item.sourceLabel, item.ko, item.en, key, null, item.canonicalId));
        });
        return;
      }

      if (key === "bg-solid-color") {
        const bgBase = state.selections.bg;
        if (bgBase && bgBase.text === "단색 배경") {
          const hex = state.bgSolidColor.toUpperCase();
          entries.push(makePromptEntry(
            "special:bg-solid-color",
            "Solid Background Color",
            `▸ 단색 배경 지정 컬러: ${hex} — 슬라이드 전체 배경을 이 컬러로 평평하게 채울 것 (그라데이션·텍스처·패턴 추가 금지)`,
            `▸ Solid background color: ${hex} — fill the entire slide background flatly with this exact color; do NOT add any gradients, textures, or patterns`,
            key,
            null,
            "background-surface"
          ));
        }
        return;
      }

      if (key === "photo-subject" && getCustomPhotoSubject()) {
        const customSubject = getCustomPhotoSubject();
        entries.push(makePromptEntry(
          "special:photo-subject-custom",
          "실사 이미지 주제 - 직접 입력",
          `직접 입력한 실사 이미지 주제: ${customSubject}. 쉼표로 나열된 단어를 우선 참고해 합성 사진의 피사체와 장면을 선택한다.`,
          `custom photo subject keywords: ${customSubject}. Prioritize these comma-separated keywords when choosing photographic subjects and scenes for the composite.`,
          key,
          null,
          "photo-subject-custom"
        ));
      }

      getSelectionValues(key).forEach((item) => {
        if (item.text === "AI 위임" && !String(item.en || "").trim()) return;
        if (isSelectionOmittedByConflict(key, item, conflictOmittedSelections)) return;
        const id = `sel:${key}:${item.text}`;
        if (key === "format" && item.text === "사용자 정의") {
          entries.push(makePromptEntry(
            id,
            `${OPTION_META[key]?.label || key} - ${item.text}`,
            `사용자 정의 비율 ${state.customRatio.width}:${state.customRatio.height}`,
            `custom aspect ratio ${state.customRatio.width}:${state.customRatio.height}`,
            key,
            null,
            "canvas-format"
          ));
          return;
        }

        const promptText = getSelectionPromptText(key, item);
        entries.push(makePromptEntry(
          id,
          `${OPTION_META[key]?.label || key} - ${item.text}`,
          promptText.ko,
          promptText.en,
          key,
          null,
          getSelectionCanonicalId(key, item)
        ));
      });
    });

    if (!entries.length) return;

    if (sectionId === "footer" && !isFooterNoneSelected()) {
      entries.push(makePromptEntry(
        "special:footer:consistency",
        "Footer Consistency",
        "▸ 바닥글 영역의 형태(선/바)·콘텐츠·정렬·높이·컬러는 슬라이드 전체에서 동일하게 반복되어야 합니다. 페이지 번호와 섹션 진행 인디케이터처럼 페이지마다 달라지는 값을 제외하면, 모든 텍스트·로고·디자인 요소는 페이지마다 같은 자리에 같은 모양으로 표시됩니다.",
        "▸ The footer style (line or bar), contents, alignment, height, and color must remain IDENTICAL on every slide of the deck. Except for page-dependent values (page number, section progress indicator), all footer text, logos, and design elements must appear in the same position with the same appearance on every page.",
        "footer-bar",
        null,
        "footer-consistency"
      ));
    }

    sections.push({
      id: sectionId,
      labelKo: section.labelKo,
      labelEn: section.labelEn,
      cls: section.cls,
      entries,
    });
  });

  const conflictGuardrails = getAutoConflictGuardrailEntries();
  if (conflictGuardrails.length) {
    sections.push({
      id: "conflict-resolution",
      labelKo: "충돌 자동 약화",
      labelEn: "CONFLICT AUTO-SOFTENING",
      cls: "warning",
      entries: conflictGuardrails,
    });
  }

  return dedupe ? normalizePromptSections(sections) : sections;
}

function getEditablePromptEntries(options = {}) {
  return buildPromptSections(options).flatMap((section) =>
    section.entries.map((entry) => ({
      ...entry,
      sectionLabelKo: section.labelKo,
      sectionLabelEn: section.labelEn,
    }))
  );
}

function getEditablePromptEntriesForKey(key, options = {}) {
  return getEditablePromptEntries(options).filter((entry) => entry.sourceKey === key);
}

function updateRenderedPromptLine(entryId, text) {
  if (!window.CSS || typeof window.CSS.escape !== "function") return;

  document.querySelectorAll(`.prompt-line[data-entry-id="${window.CSS.escape(entryId)}"]`).forEach((line) => {
    const prefix = line.dataset.linePrefix || "";
    line.textContent = `${prefix}${prefix ? stripPromptBullet(text) : text}`;
  });
}

function hasPromptOverrideForKey(key) {
  return getEditablePromptEntriesForKey(key).some((entry) => Boolean(state.promptLineOverrides[entry.id]));
}

function getPromptOverrideCount() {
  return Object.keys(state.promptLineOverrides).length;
}

function getKeyApplyStatus(key) {
  if (key !== "color-system" && isOptionDisabled(key)) {
    return { label: "무시됨", cls: "ignored", title: getDisableReason(key) || "상위 규칙 때문에 현재 프롬프트에 적용되지 않습니다." };
  }

  if (hasPromptOverrideForKey(key)) {
    return { label: "직접 수정", cls: "custom", title: "이 조건의 기본 프롬프트가 직접 수정되었습니다." };
  }

  if (hasSelection(key)) {
    return { label: "적용 중", cls: "active", title: "현재 최종 프롬프트에 반영되는 조건입니다." };
  }

  return { label: "", cls: "", title: "" };
}

function getConflictResolutionText(conflict, lang) {
  const aLabel = OPTION_META[conflict.a.key]?.label || conflict.a.key;
  const bLabel = OPTION_META[conflict.b.key]?.label || conflict.b.key;

  if (lang === "ko" && conflict.recommendationKo) {
    return `해결 방향: ${conflict.recommendationKo}`;
  }
  if (lang !== "ko" && conflict.recommendationEn) {
    return `Resolution: ${conflict.recommendationEn}`;
  }

  if (lang === "ko") {
    return `해결 방향: "${aLabel}" 또는 "${bLabel}" 중 결과물에서 더 중요한 쪽만 남기고 다른 쪽을 조정하세요.`;
  }

  return `Resolution: keep the more important direction between "${aLabel}" and "${bLabel}", then adjust the other setting.`;
}

const CONFLICT_POLICY_DEFAULTS = {
  "material:플랫 벡터|lighting:깊이감 있는 레이어": { severity: "block", action: "omit-loser", loser: { key: "lighting", text: "깊이감 있는 레이어" } },
  "material:플랫 벡터|lighting:강한 대비 조명": { severity: "block", action: "omit-loser", loser: { key: "lighting", text: "강한 대비 조명" } },
  "material:실사 기반 합성|screen-elements:아이콘/픽토그램": { severity: "warning", action: "choose-one" },
  "hierarchy:미니멀리즘|density:리치 디테일": { severity: "block", action: "choose-one" },
  "bg-tone:흑백 / 모노크롬|palette:제안서 오렌지": { severity: "warning", action: "choose-one" },
  "bg-tone:흑백 / 모노크롬|palette:ESG 그린": { severity: "warning", action: "choose-one" },
  "header-slot-right:페이지 번호|footer-elem:페이지 넘버": { severity: "block", action: "dedupe" },
  "header-bg:투명 헤더|bg-style:주제 관련 이미지": { severity: "soften", action: "add-guardrail" },
  "bg-style:주제 관련 이미지|layout:카드 그리드형": { severity: "soften", action: "add-guardrail" },
  "bg-style:주제 관련 이미지|density:리치 디테일": { severity: "soften", action: "add-guardrail" },
  "bg-style:반복 패턴|content:데이터 시각화": { severity: "soften", action: "add-guardrail" },
  "layout:오버레이형|bg-style:반복 패턴": { severity: "soften", action: "add-guardrail" },
  "layout:카드 그리드형|content:이미지 갤러리": { severity: "warning", action: "choose-one" },
  "footer-bar:없음|footer-elem:반복 문구": { severity: "block", action: "omit-loser", loser: { key: "footer-elem", text: "반복 문구" } },
  "footer-bar:없음|footer-elem:로고": { severity: "block", action: "omit-loser", loser: { key: "footer-elem", text: "로고" } },
  "logo-handling:로고 자체를 사용하지 않음|header-slot-left:브랜드 마크/로고": { severity: "block", action: "omit-loser", loser: { key: "header-slot-left", text: "브랜드 마크/로고" } },
  "logo-handling:로고 자체를 사용하지 않음|header-slot-right:기관/팀 로고": { severity: "block", action: "omit-loser", loser: { key: "header-slot-right", text: "기관/팀 로고" } },
  "logo-handling:로고 자체를 사용하지 않음|footer-elem:로고": { severity: "block", action: "omit-loser", loser: { key: "footer-elem", text: "로고" } },
  "bg:다층 배경면|hierarchy:미니멀리즘": { severity: "warning", action: "choose-one" },
  "material:고급 레이어 합성|hierarchy:미니멀리즘": { severity: "warning", action: "choose-one" },
  "lighting:깊이감 있는 레이어|density:미니멀리스트": { severity: "warning", action: "choose-one" },
  "spacing:컴팩트/타이트|hierarchy:미니멀리즘": { severity: "warning", action: "choose-one" },
  "spacing:와이드/에어리|density:리치 디테일": { severity: "warning", action: "choose-one" },
  "material:3D 클레이|typography:테크니컬 모노": { severity: "warning", action: "choose-one" },
  "material:플랫 벡터|photo-composite:대형 히어로 영역": { severity: "block", action: "choose-one" },
  "material:플랫 벡터|photo-composite:정보 카드 주변": { severity: "warning", action: "choose-one" },
};

function getConflictPolicyKey(conflict) {
  const pair = [
    `${conflict.a.key}:${conflict.a.text}`,
    `${conflict.b.key}:${conflict.b.text}`,
  ];
  return pair.sort().join("|");
}

function getConflictPolicy(conflict) {
  const direct = CONFLICT_POLICY_DEFAULTS[`${conflict.a.key}:${conflict.a.text}|${conflict.b.key}:${conflict.b.text}`];
  const sorted = CONFLICT_POLICY_DEFAULTS[getConflictPolicyKey(conflict)];
  const policy = { severity: "warning", action: "choose-one", ...(direct || sorted || {}), ...(conflict.policy || {}) };
  return policy;
}

function normalizeConflict(conflict) {
  const policy = getConflictPolicy(conflict);
  return { ...conflict, ...policy };
}

function getResolvedConflicts() {
  return getConflicts().map(normalizeConflict);
}

function getConflictSeverityLabel(severity, lang = state.lang) {
  const labels = {
    block: lang === "ko" ? "차단" : "Block",
    warning: lang === "ko" ? "경고" : "Warning",
    soften: lang === "ko" ? "자동 약화" : "Auto-soften",
  };
  return labels[severity] || labels.warning;
}

function getConflictSeverityClass(severity) {
  if (severity === "block") return "is-block";
  if (severity === "soften") return "is-soften";
  return "is-warning";
}

function getConflictActionText(conflict, lang = state.lang) {
  const policy = normalizeConflict(conflict);
  if (policy.action === "omit-loser" && policy.loser) {
    const loserLabel = OPTION_META[policy.loser.key]?.label || policy.loser.key;
    return lang === "ko"
      ? `최종 프롬프트에서는 '${loserLabel}: ${policy.loser.text}' 지시를 제거하거나 매우 약하게 다루는 편이 안전합니다.`
      : `In the final prompt, remove or strongly de-emphasize '${loserLabel}: ${policy.loser.text}'.`;
  }
  if (policy.action === "add-guardrail") {
    return lang === "ko"
      ? "두 선택을 유지하되, 가독성·대비·복잡도 보호 문구를 자동으로 추가합니다."
      : "Keep both selections, but add readability, contrast, and complexity guardrails automatically.";
  }
  if (policy.action === "dedupe") {
    return lang === "ko"
      ? "중복 위치 중 하나만 남기는 것이 안정적입니다."
      : "Keep only one repeated location.";
  }
  return getConflictResolutionText(policy, lang);
}

function getAutoConflictGuardrailEntries() {
  const conflicts = getResolvedConflicts().filter((conflict) => conflict.severity === "soften");
  if (!conflicts.length) return [];

  return conflicts.map((conflict, index) => {
    const actionKo = getConflictActionText(conflict, "ko");
    const actionEn = getConflictActionText(conflict, "en");
    return makePromptEntry(
      `special:conflict-guardrail:${index}`,
      "충돌 자동 약화 지시",
      `상충 조합 자동 약화: ${conflict.a.text} + ${conflict.b.text}. ${actionKo} 선택한 스타일을 모두 유지하더라도 배경/장식은 전경 텍스트와 도표를 방해하지 않게 낮은 대비, 낮은 복잡도, 명확한 정보 영역 분리 기준으로 처리한다.`,
      `Conflict auto-softening: ${conflict.a.text} + ${conflict.b.text}. ${actionEn} Even if both directions remain, keep backgrounds and decoration low-contrast, low-complexity, and clearly separated from foreground text or diagrams.`,
      "conflict-resolution",
      null,
      `conflict-guardrail:${conflict.a.key}:${conflict.b.key}`
    );
  });
}

function getConflictOmittedSelectionSet() {
  const omitted = new Set();
  getResolvedConflicts().forEach((conflict) => {
    if (conflict.action !== "omit-loser" || !conflict.loser) return;
    omitted.add(`${conflict.loser.key}:${conflict.loser.text}`);
  });
  return omitted;
}

function isSelectionOmittedByConflict(key, item, omitted = getConflictOmittedSelectionSet()) {
  return omitted.has(`${key}:${item?.text || ""}`);
}

function getOptionConflictWarnings(key, optionText) {
  return CONFLICT_RULES
    .map((conflict) => {
      const isA = conflict.a.key === key && conflict.a.text === optionText;
      const isB = conflict.b.key === key && conflict.b.text === optionText;
      if (!isA && !isB) return null;

      const other = isA ? conflict.b : conflict.a;
      const otherSelected = getSelectionValues(other.key).some((item) => item.text === other.text);
      if (!otherSelected) return null;

      return {
        conflict: normalizeConflict(conflict),
        other,
        otherLabel: OPTION_META[other.key]?.label || other.key,
      };
    })
    .filter(Boolean);
}

function getOptionConflictWarningText(warning, lang) {
  const otherText = `${warning.otherLabel}: ${warning.other.text}`;
  const severity = getConflictSeverityLabel(warning.conflict.severity, lang);
  if (lang === "ko") {
    return `${severity}: 현재 선택된 '${otherText}'와 상충됩니다. ${getConflictActionText(warning.conflict, lang).replace(/^해결 방향:\s*/, "")}`;
  }
  return `${severity}: conflicts with current '${otherText}'. ${getConflictActionText(warning.conflict, lang).replace(/^Resolution:\s*/, "")}`;
}

function getConflictCountsByKey() {
  const counts = {};
  getResolvedConflicts().forEach((conflict) => {
    [conflict.a.key, conflict.b.key].forEach((key) => {
      counts[key] = (counts[key] || 0) + 1;
    });
  });
  return counts;
}

function getConflictSeverityRank(severity) {
  if (severity === "block") return 3;
  if (severity === "warning") return 2;
  if (severity === "soften") return 1;
  return 0;
}

function getConflictSeverityByKey() {
  const result = {};
  getResolvedConflicts().forEach((conflict) => {
    [conflict.a.key, conflict.b.key].forEach((key) => {
      if (!result[key] || getConflictSeverityRank(conflict.severity) > getConflictSeverityRank(result[key])) {
        result[key] = conflict.severity;
      }
    });
  });
  return result;
}

function getConflictCountForSection(sectionId, counts = getConflictCountsByKey()) {
  const section = getSectionDef(sectionId);
  if (!section) return 0;
  return section.groups.reduce((sum, key) => sum + (counts[key] || 0), 0);
}

function getFirstConflictKeyForSection(sectionId, counts = getConflictCountsByKey()) {
  const section = getSectionDef(sectionId);
  if (!section) return null;
  return section.groups.find((key) => counts[key] > 0) || null;
}

function getPriorityNotes(lang) {
  const notes = [];
  const overrideCount = getPromptOverrideCount();
  const conflicts = getResolvedConflicts();

  notes.push(lang === "ko"
    ? "금지 규칙은 최종 프롬프트에서 가장 높은 우선순위로 유지됩니다."
    : "Forbidden rules are kept at the highest priority in the final prompt.");

  if (overrideCount) {
    notes.push(lang === "ko"
      ? `사용자 직접 수정 ${overrideCount}건은 해당 기본 조건 문구보다 우선 적용됩니다.`
      : `${overrideCount} manual prompt edit(s) override their default condition text.`);
  }

  if (isFullDesignReference()) {
    notes.push(lang === "ko"
      ? "전체 디자인 참조 모드에서는 별도 스타일·컬러·레이아웃·헤더·바닥글 옵션을 최종 프롬프트에서 생략합니다."
      : "In full-design reference mode, separate style, color, layout, header, and footer options are omitted from the final prompt.");
  }

  if (!isFullDesignReference() && hasSelection("color-system")) {
    if (isAiDelegatedSelection("palette") && !hasCustomColorSystemValues()) {
      notes.push(lang === "ko"
        ? "컬러는 AI 위임 상태로, 슬라이드 내용과 배경 조건에 맞춰 동적으로 선택하도록 지시됩니다."
        : "Colors are AI-directed and should be chosen dynamically according to slide content and background conditions.");
    } else {
      notes.push(lang === "ko"
        ? "컬러는 현재 HEX 직접 입력과 프리셋 결과가 최종 색상 시스템으로 합쳐져 적용됩니다."
        : "Colors use the current merged result of direct HEX inputs and palette presets.");
    }
  }

  if (state.selections["footer-bar"]?.text === "없음") {
    notes.push(lang === "ko"
      ? "바닥글 없음이 선택되어 바닥글 세부 형태·콘텐츠·높이·컬러는 적용되지 않습니다."
      : "Footer is set to none, so footer shape, content, height, and color settings do not apply.");
  }

  if (conflicts.length) {
    notes.push(lang === "ko"
      ? `상충 조합 ${conflicts.length}건이 있어 아래 경고의 해결 방향을 먼저 확인하는 것이 좋습니다.`
      : `${conflicts.length} conflicting combination(s) detected; review the resolution hints below first.`);
  }

  const omittedCount = getConflictOmittedSelectionSet().size;
  if (omittedCount) {
    notes.push(lang === "ko"
      ? `차단 충돌 중 우선순위가 낮은 지시 ${omittedCount}건은 최종 프롬프트에서 자동 제외됩니다.`
      : `${omittedCount} lower-priority instruction(s) from blocking conflicts are automatically omitted from the final prompt.`);
  }

  return notes;
}

function getSectionByKey(key) {
  if (key === "user-content") return "user";
  return KEY_SECTION_MAP[key] || null;
}

function getSectionDef(sectionId) {
  return SECTION_DEFS.find((item) => item.id === sectionId) || null;
}

function getTreeBranchLabel(sectionId) {
  if (sectionId === "user") return "실제 본문 내용 입력";
  return getSectionDef(sectionId)?.title || sectionId;
}

function getCoreFlowStatus() {
  return CORE_FLOW_STEPS.map((step) => ({
    ...step,
    done: hasSelection(step.id),
  }));
}

function getNextCoreStep() {
  return getCoreFlowStatus().find((step) => !step.done) || null;
}

function clearDisabledSelections() {
  const cleared = [];

  getPageRule().disabledKeys.forEach((key) => {
    const current = state.selections[key];
    if (Array.isArray(current) && current.length) {
      state.selections[key] = [];
      if (key === "photo-subject") state.customPhotoSubject = "";
      resetPromptOverridesForKey(key);
      cleared.push(key);
      return;
    }
    if (current) {
      state.selections[key] = null;
      if (key === "photo-subject") state.customPhotoSubject = "";
      resetPromptOverridesForKey(key);
      cleared.push(key);
    }
  });

  return cleared;
}

function clearSelectionByKey(key, silent = false) {
  if (key === "color-system") {
    const previousPrimary = state.colorSystem.primary;
    state.selections.palette = null;
    state.colorSystem = { ...DEFAULT_COLOR_SYSTEM };
    syncFooterBarColorWithTheme(previousPrimary);
    resetPromptOverridesForKey(key);
    if (!silent) {
      renderAll();
      showToast("컬러 시스템 선택을 해제했습니다.");
    }
    return;
  }

  if (isMultiSelect(key)) {
    state.selections[key] = [];
  } else {
    state.selections[key] = null;
  }
  if (key === "photo-subject") {
    state.customPhotoSubject = "";
  }
  resetPromptOverridesForKey(key);

  if (key === "content") {
    ensureContentSelectionFitsPageType();
  }

  if (!silent) {
    renderAll();
    showToast(`${OPTION_META[key]?.label || key} 선택을 해제했습니다.`);
  }
}

function clearSectionSelections(sectionId) {
  const section = getSectionDef(sectionId);
  if (!section) return;

  section.groups.forEach((key) => clearSelectionByKey(key, true));
  renderAll();
  showToast(`${section.title} 선택을 모두 해제했습니다.`);
}

function clearAllSelections() {
  Object.keys(state.selections).forEach((key) => {
    if (isMultiSelect(key)) {
      state.selections[key] = [];
    } else {
      state.selections[key] = null;
    }
  });
  ["palette", "bg", "bg-style", "bg-tone"].forEach((key) => {
    const aiOption = findOptionByText(key, "AI 위임");
    if (aiOption) state.selections[key] = aiOption;
  });
  const previousPrimary = state.colorSystem.primary;
  state.colorSystem = { ...DEFAULT_COLOR_SYSTEM };
  syncFooterBarColorWithTheme(previousPrimary);
  state.customPhotoSubject = "";
  state.promptLineOverrides = {};
  state.promptLineDrafts = {};
  state.focusKey = "format";
  renderAll();
  showToast("옵션 선택을 모두 해제했습니다.");
}

function ensureContentSelectionFitsPageType() {
  const selected = state.selections.content;
  if (!Array.isArray(selected) || !selected.length) return false;
  const allowedTexts = getAllowedOptions("content").map((item) => item.text);
  const filtered = selected.filter((item) => allowedTexts.includes(item.text));
  if (filtered.length === selected.length) return false;
  state.selections.content = filtered;
  return true;
}

function setPageType(pageTypeId) {
  state.pageType = pageTypeId;
  const cleared = clearDisabledSelections();
  const contentCleared = ensureContentSelectionFitsPageType();
  buildSections();
  updateUserInputGuide();
  state.focusKey = "pageType";
  renderAll();

  if (cleared.length || contentCleared) {
    showToast("페이지 유형과 맞지 않는 선택은 자동으로 해제했습니다.");
  }
}

function setLang(lang) {
  state.lang = lang;
  document.getElementById("btnKo").classList.toggle("active", lang === "ko");
  document.getElementById("btnEn").classList.toggle("active", lang === "en");
  renderPrompt();
}

function setColorSystem(nextColors) {
  const previousPrimary = state.colorSystem.primary;
  state.colorSystem = { ...state.colorSystem, ...nextColors };
  syncFooterBarColorWithTheme(previousPrimary);
  syncColorInputs();
  renderAll();
}

function renderPageTypes() {
  const grid = document.getElementById("pageTypeGrid");
  grid.innerHTML = "";

  PAGE_TYPES.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "page-type-card";
    button.classList.toggle("active", state.pageType === item.id);
    button.setAttribute("aria-pressed", String(state.pageType === item.id));

    const name = document.createElement("span");
    name.className = "page-type-name";
    name.textContent = item.text;

    const desc = document.createElement("span");
    desc.className = "page-type-desc";
    desc.textContent = item.desc;

    button.append(name, desc);
    button.addEventListener("click", () => setPageType(item.id));
    grid.appendChild(button);
  });
}

function buildSections() {
  const root = document.getElementById("sectionsRoot");
  root.innerHTML = "";

  SECTION_DEFS.forEach((section) => {
    const card = document.createElement("section");
    card.className = "editor-section";
    card.id = `section-${section.id}`;

    const head = document.createElement("div");
    head.className = "editor-section-head";

    const copy = document.createElement("div");
    const index = document.createElement("div");
    index.className = "editor-section-index";
    index.textContent = section.number;

    const title = document.createElement("h2");
    title.className = "editor-section-title";
    title.textContent = section.title;

    const subtitle = document.createElement("p");
    subtitle.className = "editor-section-subtitle";
    subtitle.textContent = section.subtitle;

    copy.append(index, title, subtitle);

    const actions = document.createElement("div");
    actions.className = "section-head-actions";

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "clear-btn";
    clear.dataset.sectionClear = section.id;
    clear.textContent = "섹션 해제";
    clear.addEventListener("click", () => clearSectionSelections(section.id));

    const status = document.createElement("span");
    status.className = "section-status";
    status.dataset.sectionStatus = section.id;

    actions.append(clear, status);
    head.append(copy, actions);

    const grid = document.createElement("div");
    grid.className = "editor-section-grid";

    section.groups.forEach((key) => {
      grid.appendChild(buildGroup(key));
    });

    card.append(head, grid);
    root.appendChild(card);
  });
}

function buildGroup(key) {
  const meta = OPTION_META[key];
  const group = document.createElement("div");
  group.className = `option-group ${meta.wide ? "wide" : ""}`.trim();
  group.id = `group-${key}`;
  group.dataset.optionKey = key;

  const head = document.createElement("div");
  head.className = "option-group-head";

  const title = document.createElement("h3");
  title.className = "option-group-title";
  title.textContent = meta.label;

  const mode = document.createElement("span");
  mode.className = `option-mode ${meta.mode === "multi" ? "multi" : ""}`.trim();
  mode.textContent = meta.mode === "multi" ? "다중 선택" : meta.mode === "single" ? "단일 선택" : "직접 입력";

  const applyBadge = document.createElement("span");
  applyBadge.className = "option-apply-badge";
  applyBadge.dataset.groupApplyStatus = key;
  applyBadge.hidden = true;

  const actions = document.createElement("div");
  actions.className = "group-head-actions";

  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "clear-btn";
  clear.dataset.groupClear = key;
  clear.textContent = "해제";
  clear.addEventListener("click", () => clearSelectionByKey(key));

  actions.append(applyBadge, clear, mode);
  head.append(title, actions);

  const guide = document.createElement("p");
  guide.className = "option-guide";
  guide.textContent = meta.guide;

  group.append(head, guide);

  if (key === "color-system") {
    group.appendChild(buildColorFields());
  } else if (key === "header-bar-settings") {
    group.appendChild(buildBarSettingsFields("header"));
  } else if (key === "footer-bar-settings") {
    group.appendChild(buildBarSettingsFields("footer"));
  } else {
    const grid = document.createElement("div");
    grid.className = `option-grid ${meta.wide ? "wide" : ""}`.trim();
    grid.dataset.optionGrid = key;
    group.appendChild(grid);
    fillOptionGrid(grid, key);

    if (key === "format") {
      group.appendChild(buildCustomRatioFields());
    }

    if (key === "bg") {
      group.appendChild(buildBgSolidColorField());
    }

    if (key === "photo-subject") {
      group.appendChild(buildCustomPhotoSubjectField());
    }
  }

  const note = document.createElement("p");
  note.className = "option-disabled-note";
  note.hidden = true;
  group.appendChild(note);

  return group;
}

const OPTION_ICON_LABEL_OVERRIDES = {
  ABSTRACT: "ABS",
  USERLOGO: "USR",
  NOLOGO: "NO",
  EMPTY: "MT",
  NONE: "NO",
  BODY: "BDY",
  LINE: "LIN",
  FULL: "FUL",
  FLOW: "FLW",
  DATA: "DAT",
  CARD: "CRD",
  TEAM: "TM",
  LOGO: "LG",
  VBAR: "BAR",
  "L-THN": "LN1",
  "L-DBL": "LN2",
  "L-DSH": "DSH",
  "B-REC": "BRC",
  "B-RND": "BRD",
  "B-INS": "BIN",
  "B-TOP": "BTP",
  "0:8:2": "0-8",
  "2:6:2": "2-6",
  "3:7:0": "3-7",
};

function getOptionIconLabel(icon) {
  const raw = String(icon || "").trim();
  if (!raw) return "";
  return OPTION_ICON_LABEL_OVERRIDES[raw] || raw;
}

function createPalettePreview(optionText) {
  const preset = COLOR_PRESETS[optionText];
  if (!preset) return null;

  const preview = document.createElement("span");
  preview.className = "palette-preview";
  preview.setAttribute("aria-label", `${optionText} 색상 미리보기`);

  [
    ["primary", "P"],
    ["secondary", "S"],
    ["accent", "A"],
    ["backgroundBlock", "B"],
    ["text", "T"],
  ].forEach(([name, label]) => {
    const color = preset[name];
    if (!color) return;
    const swatch = document.createElement("span");
    swatch.className = `palette-swatch palette-swatch-${name}`;
    swatch.style.backgroundColor = color;
    swatch.title = `${label}: ${color.toUpperCase()}`;
    preview.appendChild(swatch);
  });

  const hex = document.createElement("span");
  hex.className = "palette-hex-summary";
  hex.textContent = `P ${preset.primary.toUpperCase()} · A ${preset.accent.toUpperCase()}`;
  preview.appendChild(hex);

  return preview;
}

function createOptionCard(key, option) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "option-card";
  button.dataset.mode = isMultiSelect(key) ? "multi" : "single";
  button.dataset.optionText = option.text;

  const icon = document.createElement("span");
  icon.className = "option-card-icon";
  icon.textContent = getOptionIconLabel(option.icon);
  icon.title = option.icon;

  const copy = document.createElement("span");
  copy.className = "option-card-copy";

  const text = document.createElement("span");
  text.className = "option-card-text";
  text.textContent = option.text;

  const sub = document.createElement("span");
  sub.className = "option-card-sub";
  sub.textContent = option.sub;

  copy.append(text, sub);

  if (key === "palette") {
    const palettePreview = createPalettePreview(option.text);
    if (palettePreview) copy.appendChild(palettePreview);
  }

  const conflictWarnings = getOptionConflictWarnings(key, option.text);
  if (conflictWarnings.length) {
    const topSeverity = conflictWarnings.some((item) => item.conflict.severity === "block")
      ? "block"
      : conflictWarnings.some((item) => item.conflict.severity === "soften")
        ? "soften"
        : "warning";
    const warning = document.createElement("span");
    warning.className = `option-card-warning ${getConflictSeverityClass(topSeverity)}`.trim();
    warning.textContent = conflictWarnings.length === 1
      ? getOptionConflictWarningText(conflictWarnings[0], state.lang)
      : `주의: 현재 선택값 ${conflictWarnings.length}개와 상충됩니다. 미리보기의 상충 조합 경고를 확인하세요.`;
    warning.title = conflictWarnings
      .map((item) => getOptionConflictWarningText(item, state.lang))
      .join("\n");
    copy.appendChild(warning);
    button.classList.add("has-conflict-warning");
    button.classList.add(getConflictSeverityClass(topSeverity));
    button.setAttribute("aria-label", `${option.text}. ${warning.textContent}`);
  }

  const check = document.createElement("span");
  check.className = "option-card-check";
  check.setAttribute("aria-hidden", "true");
  check.textContent = "OK";

  button.append(icon, copy, check);
  button.addEventListener("click", () => selectOption(key, option.text));
  return button;
}

function buildCustomRatioFields() {
  const wrap = document.createElement("div");
  wrap.className = "custom-ratio-fields";
  wrap.id = "customRatioFields";
  wrap.hidden = state.selections.format?.text !== "사용자 정의";

  const label = document.createElement("span");
  label.className = "custom-ratio-label";
  label.textContent = "비율 입력 (W:H)";

  const inputs = document.createElement("div");
  inputs.className = "custom-ratio-inputs";

  const wInput = document.createElement("input");
  wInput.type = "number";
  wInput.className = "ratio-input";
  wInput.value = state.customRatio.width;
  wInput.addEventListener("input", () => {
    state.customRatio.width = parseInt(wInput.value) || 1;
    renderAll();
  });

  const separator = document.createElement("span");
  separator.textContent = ":";

  const hInput = document.createElement("input");
  hInput.type = "number";
  hInput.className = "ratio-input";
  hInput.value = state.customRatio.height;
  hInput.addEventListener("input", () => {
    state.customRatio.height = parseInt(hInput.value) || 1;
    renderAll();
  });

  inputs.append(wInput, separator, hInput);
  wrap.append(label, inputs);
  return wrap;
}

function buildBgSolidColorField() {
  const wrap = document.createElement("div");
  wrap.className = "bg-solid-color-field";
  wrap.id = "bgSolidColorField";
  wrap.hidden = state.selections.bg?.text !== "단색 배경";

  const label = document.createElement("span");
  label.className = "bg-solid-label";
  label.textContent = "단색 배경 컬러 지정";

  const row = document.createElement("div");
  row.className = "bg-solid-row";

  const pickerWrap = document.createElement("div");
  pickerWrap.className = "bar-picker-wrap";

  const swatch = document.createElement("div");
  swatch.className = "bar-swatch-display";
  swatch.style.background = state.bgSolidColor;

  const picker = document.createElement("input");
  picker.type = "color";
  picker.className = "color-picker-hidden";
  picker.value = state.bgSolidColor;
  picker.id = "bgSolidPicker";

  const hex = document.createElement("input");
  hex.type = "text";
  hex.className = "bar-hex-input";
  hex.value = state.bgSolidColor.toUpperCase();
  hex.placeholder = "#RRGGBB";
  hex.maxLength = 7;
  hex.id = "bgSolidHex";

  const apply = (val) => {
    state.bgSolidColor = val;
    swatch.style.background = val;
    picker.value = val;
    hex.value = val.toUpperCase();
    renderAll();
  };

  picker.addEventListener("input", () => apply(picker.value));
  hex.addEventListener("input", () => {
    const v = hex.value.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) apply(v);
  });

  pickerWrap.append(picker, swatch);
  row.append(pickerWrap, hex);
  wrap.append(label, row);
  return wrap;
}

function buildCustomPhotoSubjectField() {
  const wrap = document.createElement("div");
  wrap.className = "custom-photo-subject-field";
  wrap.id = "customPhotoSubjectField";

  const label = document.createElement("label");
  label.className = "custom-photo-subject-label";
  label.htmlFor = "customPhotoSubjectInput";
  label.textContent = "직접 입력";

  const input = document.createElement("input");
  input.type = "text";
  input.id = "customPhotoSubjectInput";
  input.className = "custom-photo-subject-input";
  input.placeholder = "예) 배터리 셀, 생산라인, 연구원, 품질검사 장비";
  input.value = state.customPhotoSubject || "";
  input.addEventListener("input", () => {
    state.customPhotoSubject = input.value;
    state.focusKey = "photo-subject";
    renderAll();
  });

  const hint = document.createElement("span");
  hint.className = "custom-photo-subject-hint";
  hint.textContent = "쉼표로 구분한 단어 나열 방식으로 입력하세요.";

  wrap.append(label, input, hint);
  return wrap;
}

function fillOptionGrid(grid, key) {
  grid.innerHTML = "";
  getAllowedOptions(key).forEach((option) => {
    grid.appendChild(createOptionCard(key, option));
  });
}


function buildColorFields() {
  const container = document.createElement("div");
  container.className = "color-system-container";

  // Color Preview Box
  const previewBox = document.createElement("div");
  previewBox.className = "color-preview-box";
  previewBox.id = "colorPreviewBox";
  
  const updatePreview = () => {
    const { primary, secondary, accent, accentWeight, backgroundBlock, text } = state.colorSystem;
    previewBox.style.backgroundColor = backgroundBlock;
    previewBox.style.color = text;
    previewBox.innerHTML = `
      <div style="padding: 12px; border-radius: 8px; background: ${primary}; color: #fff; margin-bottom: 8px; font-weight: bold; font-size: 12px;">Primary Block</div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <div style="flex: 1; height: 20px; background: ${secondary}; border-radius: 4px;"></div>
        <div style="width: ${accentWeight}%; height: 20px; background: ${accent}; border-radius: 4px; box-shadow: 0 0 10px ${accent}44;"></div>
      </div>
      <div style="margin-top: 8px; font-size: 10px; opacity: 0.8;">Sample text and layout preview</div>
    `;
  };

  const wrap = document.createElement("div");
  wrap.className = "color-fields";

  const fields = [
    ["primary", "Primary", "주요 포인트 컬러"],
    ["secondary", "Secondary", "보조 구조 컬러"],
    ["accent", "Accent", "강조 포인트 컬러"],
    ["text", "Text", "텍스트 컬러"],
    ["backgroundBlock", "Background", "배경 블록 컬러"],
  ];

  fields.forEach(([key, label, desc]) => {
    const field = document.createElement("div");
    field.className = "color-field";

    const labelRow = document.createElement("div");
    labelRow.className = "color-field-label-row";

    const name = document.createElement("span");
    name.className = "color-field-label";
    name.textContent = label;
    
    const description = document.createElement("span");
    description.className = "color-field-desc";
    description.textContent = desc;

    labelRow.append(name, description);

    const inputWrap = document.createElement("div");
    inputWrap.className = "color-input-wrap";

    // Visual Color Swatch (also the picker)
    const pickerWrap = document.createElement("div");
    pickerWrap.className = "color-picker-wrap";
    
    const picker = document.createElement("input");
    picker.type = "color";
    picker.className = "color-picker-hidden";
    picker.value = state.colorSystem[key].startsWith('#') ? state.colorSystem[key] : "#000000";
    
    const swatch = document.createElement("div");
    swatch.className = "color-swatch-display";
    swatch.style.backgroundColor = state.colorSystem[key];
    
    picker.addEventListener("input", () => {
      const color = picker.value.toUpperCase();
      const previousPrimary = state.colorSystem.primary;
      input.value = color;
      swatch.style.backgroundColor = color;
      state.colorSystem[key] = color;
      if (key === "primary") syncFooterBarColorWithTheme(previousPrimary);
      updatePreview();
      renderAll();
    });

    pickerWrap.append(picker, swatch);

    const input = document.createElement("input");
    input.className = "color-input";
    input.type = "text";
    input.id = `color-${key}`;
    input.value = state.colorSystem[key];
    input.spellcheck = false;
    
    input.addEventListener("input", () => {
      const val = input.value.trim();
      if (/^#[0-9A-F]{6}$/i.test(val)) {
        const previousPrimary = state.colorSystem.primary;
        state.colorSystem[key] = val;
        picker.value = val;
        swatch.style.backgroundColor = val;
        if (key === "primary") syncFooterBarColorWithTheme(previousPrimary);
        updatePreview();
        renderAll();
      }
    });

    inputWrap.append(pickerWrap, input);
    field.append(labelRow, inputWrap);
    wrap.appendChild(field);
  });

  // Accent Weight Slider
  const weightField = document.createElement("div");
  weightField.className = "color-field wide";
  
  const weightLabelRow = document.createElement("div");
  weightLabelRow.className = "color-field-label-row";
  
  const weightName = document.createElement("span");
  weightName.className = "color-field-label";
  weightName.textContent = "Accent Weight (%)";
  
  const weightVal = document.createElement("span");
  weightVal.className = "color-weight-value";
  weightVal.id = "accentWeightVal";
  weightVal.textContent = `${state.colorSystem.accentWeight}%`;
  
  weightLabelRow.append(weightName, weightVal);

  const slider = document.createElement("input");
  slider.type = "range";
  slider.className = "accent-weight-slider";
  slider.min = "5";
  slider.max = "50";
  slider.value = state.colorSystem.accentWeight;
  slider.id = "color-accentWeight";
  slider.addEventListener("input", () => {
    state.colorSystem.accentWeight = parseInt(slider.value);
    weightVal.textContent = `${slider.value}%`;
    updatePreview();
    renderAll();
  });

  weightField.append(weightLabelRow, slider);

  // Add Preset Button
  const presetAction = document.createElement("div");
  presetAction.className = "preset-add-action";
  
  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "btn secondary add-preset-btn";
  addBtn.innerHTML = `<span>+ 현재 컬러를 프리셋으로 추가</span>`;
  addBtn.addEventListener("click", () => {
    const name = prompt("프리셋 이름을 입력해주세요:", "커스텀 팔레트");
    if (name && name.trim()) {
      addCustomPreset(name.trim(), { ...state.colorSystem });
    }
  });
  
  presetAction.appendChild(addBtn);

  container.append(previewBox, wrap, weightField, presetAction);
  updatePreview();
  return container;
}

// 상단바 / 하단바 높이 + 컬러 커스텀 UI
function buildBarSettingsFields(type) {
  const isHeader = type === "header";
  const prefix = isHeader ? "header" : "footer";
  const label = isHeader ? "상단바" : "하단바";
  const heightKey = prefix + "Height";
  const colorKey  = prefix + "Color";
  const enabledKey = prefix + "Enabled";

  const container = document.createElement("div");
  container.className = "bar-settings-container";

  // --- 사용 여부 토글 ---
  const toggleRow = document.createElement("div");
  toggleRow.className = "bar-toggle-row";

  const toggleLabel = document.createElement("label");
  toggleLabel.className = "bar-toggle-label";
  toggleLabel.htmlFor = `bar-${prefix}-enabled`;

  const toggleInput = document.createElement("input");
  toggleInput.type = "checkbox";
  toggleInput.id = `bar-${prefix}-enabled`;
  toggleInput.className = "bar-toggle-input";
  toggleInput.checked = state.barSettings[enabledKey];

  const toggleTrack = document.createElement("span");
  toggleTrack.className = "bar-toggle-track";

  const toggleText = document.createElement("span");
  toggleText.className = "bar-toggle-text";
  toggleText.textContent = state.barSettings[enabledKey] ? `${label} 사용` : `${label} 사용 안 함`;

  toggleLabel.append(toggleInput, toggleTrack, toggleText);
  toggleRow.appendChild(toggleLabel);
  container.appendChild(toggleRow);

  // Preview strip
  const preview = document.createElement("div");
  preview.className = "bar-preview-strip";
  preview.id = `bar-preview-${prefix}`;
  const applyPreview = () => {
    const enabled = state.barSettings[enabledKey];
    preview.style.height = enabled ? state.barSettings[heightKey] + "px" : "0px";
    preview.style.background = state.barSettings[colorKey];
    preview.style.opacity = enabled ? "1" : "0";
  };
  applyPreview();
  container.appendChild(preview);

  // Row wrapper
  const row = document.createElement("div");
  row.className = "bar-settings-row";
  row.id = `bar-${prefix}-controls`;
  if (!state.barSettings[enabledKey]) row.classList.add("bar-controls-disabled");

  toggleInput.addEventListener("change", () => {
    state.barSettings[enabledKey] = toggleInput.checked;
    if (!isHeader && toggleInput.checked) {
      syncFooterBarColorWithTheme(state.barSettings.footerColor, true);
    }
    toggleText.textContent = toggleInput.checked ? `${label} 사용` : `${label} 사용 안 함`;
    applyPreview();
    row.classList.toggle("bar-controls-disabled", !toggleInput.checked);
    renderAll();
  });

  // --- Height slider ---
  const heightBlock = document.createElement("div");
  heightBlock.className = "bar-field";

  const heightLabelRow = document.createElement("div");
  heightLabelRow.className = "bar-field-label-row";
  const heightLabel = document.createElement("span");
  heightLabel.className = "bar-field-label";
  heightLabel.textContent = `${label} 높이`;
  const heightVal = document.createElement("span");
  heightVal.className = "bar-field-value";
  heightVal.id = `bar-${prefix}-height-val`;
  heightVal.textContent = state.barSettings[heightKey] + "px";
  heightLabelRow.append(heightLabel, heightVal);

  const heightSlider = document.createElement("input");
  heightSlider.type = "range";
  heightSlider.className = "bar-height-slider";
  heightSlider.min = isHeader ? "20" : "10";
  heightSlider.max = isHeader ? "100" : "60";
  heightSlider.step = "2";
  heightSlider.value = state.barSettings[heightKey];
  heightSlider.id = `bar-${prefix}-height`;
  heightSlider.addEventListener("input", () => {
    state.barSettings[heightKey] = parseInt(heightSlider.value);
    heightVal.textContent = heightSlider.value + "px";
    applyPreview();
    renderAll();
  });

  heightBlock.append(heightLabelRow, heightSlider);

  // --- Color picker ---
  const colorBlock = document.createElement("div");
  colorBlock.className = "bar-field";

  const colorLabelRow = document.createElement("div");
  colorLabelRow.className = "bar-field-label-row";
  const colorLabel = document.createElement("span");
  colorLabel.className = "bar-field-label";
  colorLabel.textContent = `${label} 컬러`;
  const colorHexVal = document.createElement("span");
  colorHexVal.className = "bar-field-value";
  colorHexVal.textContent = state.barSettings[colorKey].toUpperCase();
  colorLabelRow.append(colorLabel, colorHexVal);

  const colorWrap = document.createElement("div");
  colorWrap.className = "bar-color-wrap";

  const pickerWrap = document.createElement("div");
  pickerWrap.className = "bar-picker-wrap";
  const swatch = document.createElement("div");
  swatch.className = "bar-swatch-display";
  swatch.style.background = state.barSettings[colorKey];
  const hiddenPicker = document.createElement("input");
  hiddenPicker.type = "color";
  hiddenPicker.className = "color-picker-hidden";
  hiddenPicker.value = state.barSettings[colorKey];
  hiddenPicker.id = `bar-${prefix}-color`;
  hiddenPicker.addEventListener("input", () => {
    state.barSettings[colorKey] = hiddenPicker.value;
    swatch.style.background = hiddenPicker.value;
    colorHexVal.textContent = hiddenPicker.value.toUpperCase();
    applyPreview();
    renderAll();
  });
  pickerWrap.append(hiddenPicker, swatch);

  const colorInput = document.createElement("input");
  colorInput.type = "text";
  colorInput.className = "bar-hex-input";
  colorInput.value = state.barSettings[colorKey].toUpperCase();
  colorInput.placeholder = "#RRGGBB";
  colorInput.maxLength = 7;
  colorInput.addEventListener("input", () => {
    const v = colorInput.value.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
      state.barSettings[colorKey] = v;
      hiddenPicker.value = v;
      swatch.style.background = v;
      colorHexVal.textContent = v.toUpperCase();
      applyPreview();
      renderAll();
    }
  });

  colorWrap.append(pickerWrap, colorInput);
  colorBlock.append(colorLabelRow, colorWrap);

  row.append(heightBlock, colorBlock);
  container.appendChild(row);
  return container;
}

function addCustomPreset(name, colorSystem) {
  if (COLOR_PRESETS[name]) {
    if (!confirm(`"${name}" 프리셋이 이미 존재합니다. 덮어씌울까요?`)) return;
  }
  
  COLOR_PRESETS[name] = colorSystem;
  
  // Add to palette options if not exists
  if (!OPTIONS.palette.some(p => p.text === name)) {
    OPTIONS.palette.push({
      icon: "CP",
      text: name,
      sub: "사용자 정의 팔레트",
      en: `${name} custom palette`
    });
  }
  
  renderOptionCards("palette");
  showToast(`"${name}" 프리셋을 저장했습니다.`);
}

function renderOptionCards(key) {
  const grid = document.querySelector(`[data-option-grid="${key}"]`);
  if (!grid) return;
  fillOptionGrid(grid, key);
}

function selectOption(key, optionText) {
  if (isOptionDisabled(key)) return;

  const option = findOptionByText(key, optionText);
  if (!option) return;

  if (isMultiSelect(key)) {
    const current = getSelectionValues(key);
    const exists = current.some((item) => item.text === option.text);
    state.selections[key] = exists
      ? current.filter((item) => item.text !== option.text)
      : [...current, option];
  } else {
    state.selections[key] = option;
  }

  if (key === "reference-scope") {
    if (REFERENCE_SCOPE_FULL.includes(option.text)) {
      FULL_REFERENCE_OMITTED_KEYS.forEach((k) => {
        state.selections[k] = isMultiSelect(k) ? [] : null;
        resetPromptOverridesForKey(k);
      });
      state.barSettings.headerEnabled = false;
      state.barSettings.footerEnabled = false;
      const previousPrimary = state.colorSystem.primary;
      state.colorSystem = { ...DEFAULT_COLOR_SYSTEM };
      syncFooterBarColorWithTheme(previousPrimary);
    } else if (REFERENCE_SCOPE_TITLE_BAR.includes(option.text)) {
      const refTitleBar = OPTIONS["title-bar-rule"].find((o) => TITLE_BAR_MODE_REF.includes(o.text));
      if (refTitleBar) state.selections["title-bar-rule"] = refTitleBar;
      HEADER_DESIGN_KEYS_OVERRIDDEN_BY_PRESERVE.forEach((k) => {
        state.selections[k] = isMultiSelect(k) ? [] : null;
        resetPromptOverridesForKey(k);
      });
      state.barSettings.headerEnabled = false;
    }
  }

  if (key === "title-bar-rule" && isTitleBarFromReference() && !state.selections["reference-scope"]) {
    const titleOnly = OPTIONS["reference-scope"].find((o) => REFERENCE_SCOPE_TITLE_BAR.includes(o.text));
    if (titleOnly) state.selections["reference-scope"] = titleOnly;
  }

  if (key === "palette") {
    const previousPrimary = state.colorSystem.primary;
    if (option.text === "AI 위임") {
      state.colorSystem = { ...DEFAULT_COLOR_SYSTEM };
      syncFooterBarColorWithTheme(previousPrimary);
      syncColorInputs();
    } else if (COLOR_PRESETS[option.text]) {
      state.colorSystem = { ...COLOR_PRESETS[option.text] };
      syncFooterBarColorWithTheme(previousPrimary);
      syncColorInputs();
    }
  }

  if (key === "format") {
    const customFields = document.getElementById("customRatioFields");
    if (customFields) {
      customFields.hidden = option.text !== "사용자 정의";
    }
  }

  if (key === "bg") {
    const bgField = document.getElementById("bgSolidColorField");
    if (bgField) bgField.hidden = option.text !== "단색 배경";
    if (option.text === "단색 배경") {
      state.selections["bg-tone"] = null;
    }
  }

  if (key === "bg-style") {
    if (option.text === "AI 위임") {
      const aiTone = findOptionByText("bg-tone", "AI 위임");
      if (aiTone) state.selections["bg-tone"] = aiTone;
    } else if (option.text === "장식 없음 (기본)") {
      state.selections["bg-tone"] = null;
    }
  }

  // 실사 합성 적용 요소: '사용 안 함'은 다른 적용 요소와 상호 배타. 피사체도 자동 해제
  if (key === "photo-composite") {
    const current = state.selections["photo-composite"] || [];
    const off = OPTIONS["photo-composite"].find((o) => o.text === "사용 안 함");
    const offSelected = current.some((v) => v.text === "사용 안 함");
    const otherSelected = current.some((v) => v.text !== "사용 안 함");

    if (option.text === "사용 안 함" && offSelected) {
      // 방금 '사용 안 함'이 추가됐다면 나머지를 모두 해제
      state.selections["photo-composite"] = [off];
      state.selections["photo-subject"] = null;
      state.customPhotoSubject = "";
    } else if (option.text !== "사용 안 함" && offSelected && otherSelected) {
      // 다른 방식을 추가했다면 '사용 안 함'은 자동 해제
      state.selections["photo-composite"] = current.filter((v) => v.text !== "사용 안 함");
    }
  }

  // REF(첨부 이미지 차용) 또는 MIN(최소화/없음) 모드로 전환 시
  // 다른 헤더 디자인 옵션과 logo-handling, page-number를 모두 자동 해제
  // 그리고 barSettings.headerEnabled도 false로 전환해 prompt 출력에서 제외
  if (key === "title-bar-rule" && (isTitleBarFromReference() || isTitleBarMinimized())) {
    HEADER_DESIGN_KEYS_OVERRIDDEN_BY_PRESERVE.forEach((k) => {
      state.selections[k] = isMultiSelect(k) ? [] : null;
    });
    state.barSettings.headerEnabled = false;
  }

  // 슬롯 비율 신규 선택 — 헤더 정렬은 슬롯 구조에 흡수, 자동 해제
  if (key === "header-slot-ratio") {
    state.selections["header-align"] = null;
  }

  // 좌측 슬롯이 로고/라벨/배지 역할이면 header-icon은 중복, 자동 해제
  if (key === "header-slot-left" &&
      (option.text === "브랜드 마크/로고" || option.text === "카테고리 라벨" || option.text === "섹션 번호 배지")) {
    state.selections["header-icon"] = null;
  }

  // 우측 슬롯에 페이지 번호 추가 — page-number, footer-elem 페이지 넘버 자동 해제
  if (key === "header-slot-right" && option.text === "페이지 번호") {
    const right = getSelectionValues("header-slot-right");
    const stillIncludes = right.some((v) => v.text === "페이지 번호");
    if (stillIncludes) {
      state.selections["page-number"] = null;
      state.selections["footer-elem"] = getSelectionValues("footer-elem")
        .filter((v) => v.text !== "페이지 넘버");
    }
  }

  // footer-elem에 페이지 넘버 추가 — page-number 자동 해제 (어디서 표시할지 결정됨)
  if (key === "footer-elem" && option.text === "페이지 넘버") {
    const fe = getSelectionValues("footer-elem");
    if (fe.some((v) => v.text === "페이지 넘버")) {
      state.selections["page-number"] = null;
    }
  }

  // 바닥글 형태가 '없음'으로 전환되면 하위 옵션 모두 자동 해제
  if (key === "footer-bar" && option.text === "없음") {
    FOOTER_DEPENDENT_KEYS.forEach((k) => {
      state.selections[k] = isMultiSelect(k) ? [] : null;
    });
  }

  if (key === "footer-bar" && option.icon === "NONE") {
    FOOTER_DEPENDENT_KEYS.forEach((k) => {
      state.selections[k] = isMultiSelect(k) ? [] : null;
      resetPromptOverridesForKey(k);
    });
    state.barSettings.footerEnabled = false;
  }

  if (key === "footer-bar" && option.icon !== "NONE") {
    state.barSettings.footerEnabled = true;
  }

  state.focusKey = key;
  renderAll();
}

function syncColorInputs() {
  Object.entries(state.colorSystem).forEach(([key, value]) => {
    const input = document.getElementById(`color-${key}`);
    if (input) {
      input.value = value;
      const pickerWrap = input.previousElementSibling;
      if (pickerWrap && pickerWrap.classList.contains("color-picker-wrap")) {
        const picker = pickerWrap.querySelector(".color-picker-hidden");
        const swatch = pickerWrap.querySelector(".color-swatch-display");
        if (picker) picker.value = value.startsWith("#") ? value : "#000000";
        if (swatch) swatch.style.backgroundColor = value;
      }
    }
  });
  
  // Sync weight slider and value
  const slider = document.getElementById("color-accentWeight");
  if (slider) slider.value = state.colorSystem.accentWeight;
  const weightVal = document.getElementById("accentWeightVal");
  if (weightVal) weightVal.textContent = `${state.colorSystem.accentWeight}%`;
  
  // Update preview if field exists
  const preview = document.getElementById("colorPreviewBox");
  if (preview) {
    const { primary, secondary, accent, accentWeight, backgroundBlock, text } = state.colorSystem;
    preview.style.backgroundColor = backgroundBlock;
    preview.style.color = text;
    preview.innerHTML = `
      <div style="padding: 12px; border-radius: 8px; background: ${primary}; color: #fff; margin-bottom: 8px; font-weight: bold; font-size: 12px;">Primary Block</div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <div style="flex: 1; height: 20px; background: ${secondary}; border-radius: 4px;"></div>
        <div style="width: ${accentWeight}%; height: 20px; background: ${accent}; border-radius: 4px; box-shadow: 0 0 10px ${accent}44;"></div>
      </div>
      <div style="margin-top: 8px; font-size: 10px; opacity: 0.8;">Sample text and layout preview</div>
    `;
  }
}

function syncSelectionStates() {
  Object.keys(OPTIONS).forEach((key) => {
    const selected = getSelectionValues(key);
    document.querySelectorAll(`[data-option-grid="${key}"] .option-card`).forEach((button) => {
      const isSelected = selected.some((item) => item.text === button.dataset.optionText);
      button.classList.toggle("selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
      button.disabled = isOptionDisabled(key);
      button.setAttribute("aria-disabled", String(isOptionDisabled(key)));
    });
  });
}

function syncCustomPhotoSubjectField() {
  const field = document.getElementById("customPhotoSubjectField");
  const input = document.getElementById("customPhotoSubjectInput");
  if (!field || !input) return;

  const disabled = isOptionDisabled("photo-subject");
  input.value = state.customPhotoSubject || "";
  input.disabled = disabled;
  field.classList.toggle("disabled", disabled);
}

function syncBarSettingsControls() {
  ["header", "footer"].forEach((prefix) => {
    const enabledKey = `${prefix}Enabled`;
    const heightKey = `${prefix}Height`;
    const colorKey = `${prefix}Color`;
    const optionKey = `${prefix}-bar-settings`;
    const enabled = Boolean(state.barSettings[enabledKey]);
    const disabled = isOptionDisabled(optionKey);

    const toggle = document.getElementById(`bar-${prefix}-enabled`);
    const controls = document.getElementById(`bar-${prefix}-controls`);
    const preview = document.getElementById(`bar-preview-${prefix}`);
    const height = document.getElementById(`bar-${prefix}-height`);
    const heightVal = document.getElementById(`bar-${prefix}-height-val`);
    const color = document.getElementById(`bar-${prefix}-color`);
    const colorInput = color?.closest(".bar-color-wrap")?.querySelector(".bar-hex-input");
    const swatch = color?.closest(".bar-picker-wrap")?.querySelector(".bar-swatch-display");

    if (toggle) {
      toggle.checked = enabled;
      toggle.disabled = disabled;
    }
    if (controls) controls.classList.toggle("bar-controls-disabled", disabled || !enabled);
    if (preview) {
      preview.style.height = enabled && !disabled ? `${state.barSettings[heightKey]}px` : "0px";
      preview.style.background = state.barSettings[colorKey];
      preview.style.opacity = enabled && !disabled ? "1" : "0";
    }
    if (height) {
      height.value = state.barSettings[heightKey];
      height.disabled = disabled || !enabled;
    }
    if (heightVal) heightVal.textContent = `${state.barSettings[heightKey]}px`;
    if (color) {
      color.value = state.barSettings[colorKey];
      color.disabled = disabled || !enabled;
    }
    if (colorInput) {
      colorInput.value = state.barSettings[colorKey].toUpperCase();
      colorInput.disabled = disabled || !enabled;
    }
    if (swatch) swatch.style.background = state.barSettings[colorKey];
  });
}

function updateClearButtonStates() {
  Object.keys(OPTION_META).forEach((key) => {
    const button = document.querySelector(`[data-group-clear="${key}"]`);
    if (!button) return;
    const disabled = isOptionDisabled(key);
    const hasValue = hasSelection(key);
    button.disabled = disabled || !hasValue;
    button.setAttribute("aria-disabled", String(button.disabled));
  });

  SECTION_DEFS.forEach((section) => {
    const button = document.querySelector(`[data-section-clear="${section.id}"]`);
    if (!button) return;
    const hasAny = section.groups.some((key) => hasSelection(key));
    button.disabled = !hasAny;
    button.setAttribute("aria-disabled", String(button.disabled));
  });

  const allClear = document.getElementById("btnClearSelections");
  if (allClear) {
    const hasAnySelections = Object.keys(state.selections).some((key) => hasSelection(key));
    allClear.disabled = !hasAnySelections;
    allClear.setAttribute("aria-disabled", String(allClear.disabled));
  }
}

function applyPageRulesToUI() {
  Object.keys(OPTION_META).forEach((key) => {
    const group = document.getElementById(`group-${key}`);
    if (!group) return;
    const disabled = isOptionDisabled(key);
    const hidden = key === "color-system" && isAiDelegatedSelection("palette");
    const note = group.querySelector(".option-disabled-note");
    const applyBadge = group.querySelector(`[data-group-apply-status="${key}"]`);
    const status = getKeyApplyStatus(key);

    group.hidden = hidden;
    group.classList.toggle("disabled", disabled);

    if (applyBadge) {
      applyBadge.hidden = !status.label;
      applyBadge.textContent = status.label;
      applyBadge.title = status.title;
      applyBadge.className = `option-apply-badge ${status.cls}`.trim();
    }

    if (note) {
      if (disabled) {
        note.textContent = getDisableReason(key);
        note.hidden = false;
      } else {
        note.textContent = "";
        note.hidden = true;
      }
    }
  });
}

function renderOptionTree() {
  const tree = document.getElementById("optionTree");
  tree.innerHTML = "";

  SECTION_DEFS.forEach((section) => {
    const branch = document.createElement("div");
    branch.className = "tree-branch";
    branch.dataset.section = section.id;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "tree-branch-button";
    button.addEventListener("click", () => {
      const conflictKey = getFirstConflictKeyForSection(section.id);
      if (conflictKey) {
        focusGroup(conflictKey);
        return;
      }
      focusSection(section.id, section.groups[0]);
    });

    const index = document.createElement("span");
    index.className = "tree-index";
    index.textContent = section.number;

    const copy = document.createElement("span");
    copy.className = "tree-copy";

    const title = document.createElement("span");
    title.className = "tree-title";
    title.textContent = section.title;

    const status = document.createElement("span");
    status.className = "tree-status";
    status.dataset.treeStatus = section.id;

    copy.append(title, status);

    const arrow = document.createElement("span");
    arrow.className = "tree-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = ">";

    button.append(index, copy, arrow);

    const leaves = document.createElement("div");
    leaves.className = "tree-leaves";

    section.groups.forEach((key) => {
      const leaf = document.createElement("button");
      leaf.type = "button";
      leaf.className = "tree-leaf";
      leaf.dataset.treeKey = key;
      leaf.addEventListener("click", () => focusGroup(key));

      const dot = document.createElement("span");
      dot.className = "tree-leaf-dot";
      dot.setAttribute("aria-hidden", "true");

      const label = document.createElement("span");
      label.className = "tree-leaf-label";
      label.textContent = OPTION_META[key].label;

      const conflictBadge = document.createElement("span");
      conflictBadge.className = "tree-conflict-badge";
      conflictBadge.dataset.treeConflictBadge = key;
      conflictBadge.hidden = true;

      leaf.append(dot, label, conflictBadge);
      leaves.appendChild(leaf);
    });

    branch.append(button, leaves);
    tree.appendChild(branch);
  });

  const userBranch = document.createElement("div");
  userBranch.className = "tree-branch";
  userBranch.dataset.section = "user";

  const userButton = document.createElement("button");
  userButton.type = "button";
  userButton.className = "tree-branch-button";
  userButton.addEventListener("click", () => focusGroup("user-content"));

  const userIndex = document.createElement("span");
  userIndex.className = "tree-index";
  userIndex.textContent = "입력";

  const userCopy = document.createElement("span");
  userCopy.className = "tree-copy";

  const userTitle = document.createElement("span");
  userTitle.className = "tree-title";
  userTitle.textContent = "실제 본문 내용 입력";

  const userStatus = document.createElement("span");
  userStatus.className = "tree-status";
  userStatus.dataset.treeStatus = "user";

  userCopy.append(userTitle, userStatus);

  const userArrow = document.createElement("span");
  userArrow.className = "tree-arrow";
  userArrow.setAttribute("aria-hidden", "true");
  userArrow.textContent = ">";

  userButton.append(userIndex, userCopy, userArrow);

  const userLeaves = document.createElement("div");
  userLeaves.className = "tree-leaves";

  const userLeaf = document.createElement("button");
  userLeaf.type = "button";
  userLeaf.className = "tree-leaf";
  userLeaf.dataset.treeKey = "user-content";
  userLeaf.addEventListener("click", () => focusGroup("user-content"));

  const userDot = document.createElement("span");
  userDot.className = "tree-leaf-dot";
  userDot.setAttribute("aria-hidden", "true");

  const userLabel = document.createElement("span");
  userLabel.className = "tree-leaf-label";
  userLabel.textContent = "실제 본문 내용 입력";

  userLeaf.append(userDot, userLabel);
  userLeaves.appendChild(userLeaf);

  userBranch.append(userButton, userLeaves);
  tree.appendChild(userBranch);
}

function focusSection(sectionId, firstKey) {
  state.focusKey = firstKey || state.focusKey;
  const target =
    sectionId === "user"
      ? document.getElementById("section-user")
      : document.getElementById(`section-${sectionId}`);

  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  pulseTarget(target);
  updateTreeState();
}

function focusGroup(key) {
  state.focusKey = key;
  const target = key === "user-content"
    ? document.getElementById("group-user-content")
    : key === "pageType"
      ? document.getElementById("section-pageType") || document.getElementById("pageTypeGrid")
      : document.getElementById(`group-${key}`);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  pulseTarget(target);
  updateTreeState();
}

function pulseTarget(element) {
  element.classList.add("tree-focus-target");
  window.setTimeout(() => element.classList.remove("tree-focus-target"), 1600);
}

function updateTreeState() {
  const focusSectionId = getSectionByKey(state.focusKey);
  const conflictCounts = getConflictCountsByKey();
  const conflictSeverities = getConflictSeverityByKey();

  document.querySelectorAll(".tree-branch").forEach((branch) => {
    const sectionId = branch.dataset.section;
    const def = getSectionDef(sectionId);
    const keys = sectionId === "user" ? ["user-content"] : def.groups;
    const active = focusSectionId === sectionId;
    const completed = keys.some((key) => (key === "user-content" ? hasStructuredUserInput() : hasSelection(key)));
    const conflictCount = sectionId === "user" ? 0 : getConflictCountForSection(sectionId, conflictCounts);
    const sectionSeverity = keys
      .map((key) => conflictSeverities[key])
      .filter(Boolean)
      .sort((a, b) => getConflictSeverityRank(b) - getConflictSeverityRank(a))[0] || "";
    const status = branch.querySelector(`[data-tree-status="${sectionId}"]`);

    branch.classList.toggle("active", active);
    branch.classList.toggle("completed", completed);
    branch.classList.toggle("has-conflict", conflictCount > 0);
    branch.classList.toggle("is-block", sectionSeverity === "block");
    branch.classList.toggle("is-warning", sectionSeverity === "warning");
    branch.classList.toggle("is-soften", sectionSeverity === "soften");

    if (status) {
      if (conflictCount) {
        status.textContent = `${getConflictSeverityLabel(sectionSeverity)} ${conflictCount}건 - 클릭해 이동`;
      } else {
        status.textContent = active ? "현재 편집 중" : completed ? "선택 있음" : "선택 전";
      }
    }
  });

  document.querySelectorAll(".tree-leaf").forEach((leaf) => {
    const key = leaf.dataset.treeKey;
    const disabled = key !== "user-content" && isOptionDisabled(key);
    const selected = key === "user-content" ? hasStructuredUserInput() : hasSelection(key);
    const customized = key !== "user-content" && hasPromptOverrideForKey(key);
    const conflictCount = key === "user-content" ? 0 : (conflictCounts[key] || 0);
    const conflictSeverity = conflictSeverities[key] || "";
    const conflictBadge = leaf.querySelector(`[data-tree-conflict-badge="${window.CSS.escape(key)}"]`);
    leaf.classList.toggle("selected", selected);
    leaf.classList.toggle("disabled", disabled);
    leaf.classList.toggle("customized", customized);
    leaf.classList.toggle("has-conflict", conflictCount > 0);
    leaf.classList.toggle("is-block", conflictSeverity === "block");
    leaf.classList.toggle("is-warning", conflictSeverity === "warning");
    leaf.classList.toggle("is-soften", conflictSeverity === "soften");
    if (conflictBadge) {
      conflictBadge.hidden = !conflictCount;
      conflictBadge.className = `tree-conflict-badge ${getConflictSeverityClass(conflictSeverity)}`.trim();
      conflictBadge.textContent = conflictCount > 1
        ? `${getConflictSeverityLabel(conflictSeverity)} ${conflictCount}`
        : getConflictSeverityLabel(conflictSeverity);
    }
    leaf.title = conflictCount
      ? `${OPTION_META[key]?.label || key}에 상충 조합 ${conflictCount}건이 있습니다. 클릭하면 해당 설정으로 이동합니다.`
      : customized ? "직접 수정된 프롬프트가 있습니다." : "";
    leaf.disabled = disabled;
  });
}

function updateSectionStatuses() {
  SECTION_DEFS.forEach((section) => {
    const filled = section.groups.filter((key) => hasSelection(key)).length;
    const badge = document.querySelector(`[data-section-status="${section.id}"]`);
    if (!badge) return;
    badge.textContent = filled ? `${filled} / ${section.groups.length} 선택` : "선택 전";
  });
}

function renderProgress() {
  const done = SECTION_DEFS.filter((section) => section.groups.some((key) => hasSelection(key))).length;
  const total = SECTION_DEFS.length;
  const percent = (done / total) * 100;
  document.getElementById("progressBar").style.width = `${percent}%`;
  document.getElementById("progressLabel").textContent = `${done} / ${total} 완료`;
}

function renderOverview() {
  const nextStep = getNextCoreStep();
  const message = nextStep
    ? `지금은 "${nextStep.label}"부터 정하면 흐름이 가장 자연스럽습니다.`
    : "핵심 흐름이 완성되었습니다. 이제 세부 규칙과 문구를 다듬으면 됩니다.";
  document.getElementById("overviewMessage").textContent = message;
}

function renderProcessGuide() {
  const items = getCoreFlowStatus();
  const doneCount = items.filter((item) => item.done).length;
  const total = items.length;
  const nextStep = getNextCoreStep();
  const ready = doneCount === total;

  document.getElementById("processStatusTitle").textContent = ready ? "핵심 프롬프트 구조가 준비되었습니다" : `핵심 단계 ${doneCount}/${total} 진행 중`;
  document.getElementById("processStatusHint").textContent = ready
    ? "이제 컬러, 헤더, 금지 규칙과 실제 문구를 다듬어 완성도를 올리면 됩니다."
    : `${nextStep.label} 선택이 다음 우선순위입니다.`;
  document.getElementById("processStatusBadge").textContent = ready ? "준비 완료" : "진행 중";

  const list = document.getElementById("processChecklist");
  list.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `process-item ${item.done ? "done" : ""}`.trim();
    card.dataset.processShortcut = item.id;
    card.title = `${item.label} 설정으로 이동`;
    card.setAttribute("aria-label", `${item.label} 설정으로 이동`);
    card.addEventListener("click", () => focusGroup(item.id));

    const title = document.createElement("div");
    title.className = "process-item-title";
    title.textContent = item.label;

    const text = document.createElement("div");
    text.className = "process-item-text";
    text.textContent = item.done ? "선택 완료" : item.hint;

    card.append(title, text);
    list.appendChild(card);
  });
}

function renderTemplates() {
  const wrap = document.getElementById("templateChips");
  wrap.innerHTML = "";

  const builtInTitle = document.createElement("div");
  builtInTitle.className = "template-group-title";
  builtInTitle.textContent = "표준 비즈니스 템플릿";
  wrap.appendChild(builtInTitle);

  const builtInGrid = document.createElement("div");
  builtInGrid.className = "template-grid";

  getResolvedBuiltInTemplates().forEach((template, index) => {
    const container = document.createElement("div");
    container.className = "template-chip-container";

    const button = document.createElement("button");
    button.type = "button";
    button.className = `template-chip built-in ${template.builtInOverride ? "overridden" : ""} ${activeBuiltInTemplateIndex === index ? "active" : ""}`.trim();
    button.textContent = template.name;
    button.addEventListener("click", () => {
      activeBuiltInTemplateIndex = index;
      activeUserTemplateIndex = null;
      applyTemplate(template);
      renderTemplates();
    });

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "template-save-btn";
    saveBtn.textContent = "저장";
    saveBtn.title = "현재 설정값으로 이 표준 템플릿 덮어쓰기";
    saveBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      updateBuiltInTemplateFromCurrent(index);
    });

    container.append(button, saveBtn);
    builtInGrid.appendChild(container);
  });
  wrap.appendChild(builtInGrid);

  const userTemplates = getUserTemplates();
  if (userTemplates.length > 0) {
    const userTitle = document.createElement("div");
    userTitle.className = "template-group-title";
    userTitle.style.marginTop = "20px";
    userTitle.textContent = "나의 커스텀 템플릿";
    wrap.appendChild(userTitle);

    const userGrid = document.createElement("div");
    userGrid.className = "template-grid";

    userTemplates.forEach((template, index) => {
      const container = document.createElement("div");
      container.className = "template-chip-container";

      const button = document.createElement("button");
      button.type = "button";
      button.className = `template-chip user ${activeUserTemplateIndex === index ? "active" : ""}`.trim();
      button.textContent = template.name;
      button.addEventListener("click", () => {
        activeUserTemplateIndex = index;
        applyTemplate(template);
        renderTemplates();
      });

      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "template-save-btn";
      saveBtn.textContent = "저장";
      saveBtn.title = "현재 설정값으로 덮어쓰기";
      saveBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        updateUserTemplateFromCurrent(index);
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "template-del-btn";
      delBtn.innerHTML = "×";
      delBtn.title = "삭제";
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteUserTemplate(index);
      });

      container.append(button, saveBtn, delBtn);
      userGrid.appendChild(container);
    });
    wrap.appendChild(userGrid);
  }

  const actionBox = document.createElement("div");
  actionBox.className = "template-actions";
  
  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "btn primary small";
  saveBtn.innerHTML = '<span class="icon">+</span> 현재 설정을 템플릿으로 저장';
  saveBtn.addEventListener("click", saveCurrentAsTemplate);
  
  actionBox.appendChild(saveBtn);
  wrap.appendChild(actionBox);
}

function getUserTemplates() {
  try {
    const data = localStorage.getItem("pd_user_templates");
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveUserTemplates(templates) {
  localStorage.setItem("pd_user_templates", JSON.stringify(templates));
}

function getBuiltInTemplateOverrides() {
  try {
    const data = localStorage.getItem(BUILT_IN_TEMPLATE_OVERRIDES_KEY);
    const parsed = data ? JSON.parse(data) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (e) {
    return {};
  }
}

function saveBuiltInTemplateOverrides(overrides) {
  localStorage.setItem(BUILT_IN_TEMPLATE_OVERRIDES_KEY, JSON.stringify(overrides));
}

function getResolvedBuiltInTemplates() {
  const overrides = getBuiltInTemplateOverrides();
  return TEMPLATES.map((template) => {
    const override = overrides[template.name];
    if (!override) return template;

    return normalizeTemplateSelections({
      ...override,
      name: template.name,
      builtInOverride: true,
      custom: false,
    });
  });
}

function toTemplateArrayValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

function writeTemplateArrayValue(selections, key, values) {
  selections[key] = isMultiSelect(key) ? values : (values[0] || null);
}

function normalizeTemplateSelections(template) {
  const selections = typeof migrateSelectionSnapshotForMece === "function"
    ? migrateSelectionSnapshotForMece(template.selections || {})
    : { ...(template.selections || {}) };
  const getValues = (key) => toTemplateArrayValue(selections[key]);
  const setValues = (key, values) => writeTemplateArrayValue(selections, key, values);
  const clearKey = (key) => {
    selections[key] = isMultiSelect(key) ? [] : null;
  };

  const titleRule = selections["title-bar-rule"];
  const usesReferenceTitleBar = TITLE_BAR_MODE_REF.includes(titleRule);
  const usesMinimalTitleBar = TITLE_BAR_MODE_MINIMAL.includes(titleRule);
  const usesFullReference = REFERENCE_SCOPE_FULL.includes(selections["reference-scope"]);

  if (selections["photo-composite"]) {
    const migrated = toTemplateArrayValue(selections["photo-composite"]).map(migratePhotoCompositeText);
    writeTemplateArrayValue(selections, "photo-composite", migrated);
  }

  if (usesReferenceTitleBar && !selections["reference-scope"]) {
    selections["reference-scope"] = "타이틀바만 참조";
  }

  if (usesFullReference) {
    FULL_REFERENCE_OMITTED_KEYS.forEach(clearKey);
  } else if (usesReferenceTitleBar || usesMinimalTitleBar) {
    HEADER_DESIGN_KEYS_OVERRIDDEN_BY_PRESERVE.forEach(clearKey);
  }

  if (getValues("header-slot-right").includes("페이지 번호")) {
    clearKey("page-number");
    setValues("footer-elem", getValues("footer-elem").filter((value) => value !== "페이지 넘버"));
  }

  if (getValues("footer-elem").includes("페이지 넘버")) {
    clearKey("page-number");
  }

  if (selections["footer-bar"] === "없음") {
    FOOTER_DEPENDENT_KEYS.forEach(clearKey);
  }

  if (selections["bg-style"] === "AI 위임") {
    selections["bg-tone"] = "AI 위임";
  } else if (selections.bg === "단색 배경" || selections["bg-style"] === "장식 없음 (기본)") {
    clearKey("bg-tone");
  }

  return { ...template, selections };
}

function createTemplateSnapshot(name) {
  const selections = {};
  Object.keys(state.selections).forEach((key) => {
    const val = state.selections[key];
    if (Array.isArray(val)) {
      selections[key] = val.map((v) => v.text);
    } else if (val) {
      selections[key] = val.text;
    }
  });

  return normalizeTemplateSelections({
    name: name.trim(),
    pageType: state.pageType,
    selections,
    customRatio: { ...state.customRatio },
    colorSystem: { ...state.colorSystem },
    barSettings: { ...state.barSettings },
    bgSolidColor: state.bgSolidColor,
    customPhotoSubject: state.customPhotoSubject,
    promptLineOverrides: clonePromptLineOverrides(state.promptLineOverrides),
    custom: true,
  });
}

function saveCurrentAsTemplate() {
  const name = prompt("저장할 템플릿의 이름을 입력해 주세요.", `내 템플릿 ${new Date().toLocaleDateString()}`);
  if (!name || !name.trim()) return;

  const newTemplate = createTemplateSnapshot(name);
  const templates = getUserTemplates();
  templates.push(newTemplate);
  activeBuiltInTemplateIndex = null;
  activeUserTemplateIndex = templates.length - 1;
  saveUserTemplates(templates);
  renderTemplates();
  showToast(`"${newTemplate.name}" 템플릿을 저장했습니다.`);
}

function updateBuiltInTemplateFromCurrent(index) {
  const baseTemplate = TEMPLATES[index];
  if (!baseTemplate) return;
  if (!confirm(`"${baseTemplate.name}" 표준 프리셋을 현재 설정값으로 저장할까요?`)) return;

  const overrides = getBuiltInTemplateOverrides();
  const updated = {
    ...createTemplateSnapshot(baseTemplate.name),
    custom: false,
    builtInOverride: true,
  };

  overrides[baseTemplate.name] = updated;
  activeBuiltInTemplateIndex = index;
  activeUserTemplateIndex = null;
  saveBuiltInTemplateOverrides(overrides);
  renderTemplates();
  showToast(`"${baseTemplate.name}" 표준 프리셋 설정값을 저장했습니다.`);
}

function updateUserTemplateFromCurrent(index) {
  const templates = getUserTemplates();
  const current = templates[index];
  if (!current) return;
  if (!confirm(`"${current.name}" 프리셋을 현재 설정값으로 덮어쓸까요?`)) return;

  const updated = createTemplateSnapshot(current.name);
  templates[index] = { ...updated, custom: true };
  activeBuiltInTemplateIndex = null;
  activeUserTemplateIndex = index;
  saveUserTemplates(templates);
  renderTemplates();
  showToast(`"${updated.name}" 프리셋 설정값을 저장했습니다.`);
}

function deleteUserTemplate(index) {
  if (!confirm("이 템플릿을 정말 삭제할까요?")) return;
  const templates = getUserTemplates();
  const removed = templates.splice(index, 1);
  if (activeUserTemplateIndex === index) {
    activeUserTemplateIndex = null;
  } else if (activeUserTemplateIndex > index) {
    activeUserTemplateIndex -= 1;
  }
  saveUserTemplates(templates);
  renderTemplates();
  showToast(`"${removed[0].name}" 템플릿을 삭제했습니다.`);
}

function applyTemplate(template) {
  template = normalizeTemplateSelections(template);
  state.pageType = template.pageType || state.pageType;
  state.selections = createEmptySelections();
  state.colorSystem = { ...DEFAULT_COLOR_SYSTEM };
  state.customRatio = { width: 16, height: 9 };
  state.barSettings = createDefaultBarSettings();
  state.bgSolidColor = "#F5F6F7";
  state.customPhotoSubject = "";
  state.promptLineOverrides = clonePromptLineOverrides(template.promptLineOverrides);
  state.promptLineDrafts = {};

  Object.entries(template.selections).forEach(([key, value]) => {
    if (key === "palette") {
      const option = findOptionByText(key, value);
      if (option) {
        state.selections[key] = option;
        if (COLOR_PRESETS[option.text]) {
          state.colorSystem = { ...COLOR_PRESETS[option.text] };
        }
      }
      return;
    }

    if (Array.isArray(value)) {
      state.selections[key] = value.map((text) => findOptionByText(key, text)).filter(Boolean);
      return;
    }

    const option = findOptionByText(key, value);
    if (option) {
      state.selections[key] = option;
    }
  });

  if (template.customRatio) {
    state.customRatio = {
      width: template.customRatio.width || state.customRatio.width,
      height: template.customRatio.height || state.customRatio.height,
    };
  }

  if (template.colorSystem) {
    state.colorSystem = { ...state.colorSystem, ...template.colorSystem };
  }

  if (template.barSettings) {
    state.barSettings = { ...state.barSettings, ...template.barSettings };
  }
  syncFooterBarColorWithTheme(DEFAULT_COLOR_SYSTEM.primary, !template.barSettings?.footerColor);

  if (template.bgSolidColor) {
    state.bgSolidColor = template.bgSolidColor;
  }

  if (typeof template.customPhotoSubject === "string") {
    state.customPhotoSubject = template.customPhotoSubject;
  }

  clearDisabledSelections();
  ensureContentSelectionFitsPageType();
  buildSections();
  updateUserInputGuide();
  state.focusKey = "format";
  renderAll();
  showToast(`"${template.name}" 프리셋을 적용했습니다.`);
}

function renderSummary() {
  const wrap = document.getElementById("summaryChips");
  const chips = [];

  chips.push({ text: getCurrentPageType().text, cls: "page" });

  Object.keys(state.selections).forEach((key) => {
    getSelectionValues(key).forEach((item) => {
      chips.push({
        text: item.text,
        cls: key === "content" ? "content" : "",
      });
    });
  });

  if (getCustomPhotoSubject()) {
    chips.push({ text: `실사 주제: ${getCustomPhotoSubject()}`, cls: "content" });
  }

  chips.push({ text: `P: ${state.colorSystem.primary}`, cls: "page" });
  chips.push({ text: `A: ${state.colorSystem.accent} (${state.colorSystem.accentWeight}%)`, cls: "page" });

  wrap.innerHTML = "";

  if (!chips.length) {
    wrap.innerHTML = '<span class="summary-empty">아직 선택한 옵션이 없습니다.</span>';
    return;
  }

  chips.forEach((chip) => {
    const span = document.createElement("span");
    span.className = `summary-chip ${chip.cls}`.trim();
    span.textContent = chip.text;
    wrap.appendChild(span);
  });
}

function buildPromptPartsLegacy(lang) {
  const parts = [];

  Object.entries(SECTION_MAP).forEach(([sectionId, section]) => {
    const lines = [];

    // page 섹션의 가장 앞에 REF 모드 강조 삽입 — 명세 블록 안에서도 헤더 지시가 묻히지 않도록
    if (sectionId === "page" && isTitleBarFromReference()) {
      lines.push(lang === "ko"
        ? "★ 헤더 최우선: 첨부 참조 이미지의 타이틀바 디자인을 그대로 유지하고, 텍스트만 이 슬라이드의 실제 내용으로 교체할 것 (이 지시는 본 명세 내 다른 헤더 관련 항목보다 우선)"
        : "★ HEADER PRIORITY: keep the title bar design from the attached reference image; only replace the text content with THIS slide's actual title and page number. This rule overrides any other header-related item in this specification.");
    }

    section.keys.forEach((key) => {
      if (key === "pageType") {
        const type = getCurrentPageType();
        lines.push(lang === "ko" ? type.text : type.en);
        return;
      }

      if (key === "color-system") {
        lines.push(buildColorSystemText(lang));
        return;
      }

      if (key === "photo-subject" && getCustomPhotoSubject()) {
        const customSubject = getCustomPhotoSubject();
        lines.push(lang === "ko"
          ? `직접 입력한 실사 이미지 주제: ${customSubject}. 쉼표로 나열된 단어를 우선 참고해 합성 사진의 피사체와 장면을 선택한다.`
          : `custom photo subject keywords: ${customSubject}. Prioritize these comma-separated keywords when choosing photographic subjects and scenes for the composite.`);
      }

      if (key === "header-bar-settings") {
        // REF \ubaa8\ub4dc(\ucca8\ubd80 \uc774\ubbf8\uc9c0 \ud0c0\uc774\ud2c0\ubc14 \ucc28\uc6a9)\uc5d0\uc11c\ub294 \ud5e4\ub354 \ubc14 \uc124\uc815 \uc790\uccb4\ub97c \ucd9c\ub825\ud558\uc9c0 \uc54a\uc74c
        // \u2192 "Header bar: enabled, height 48px, color #004DB0" \uac19\uc740 \uc9c0\uc2dc\uac00 \ucca8\ubd80 \uc774\ubbf8\uc9c0 \ucc28\uc6a9\uacfc \ucda9\ub3cc\ud558\ub294 \uac83\uc744 \ucc28\ub2e8
        if (isTitleBarFromReference()) return;
        const { headerEnabled, headerHeight, headerColor } = state.barSettings;
        lines.push(lang === "ko"
          ? headerEnabled
            ? `\u25B8 \uc0c1\ub2e8\ubc14 \uc0ac\uc6a9  |  \ub192\uc774: ${headerHeight}px  |  \uceec\ub7ec: ${formatThemeColorValue(headerColor, "ko")}`
            : `\u25B8 \uc0c1\ub2e8\ubc14 \uc5c6\uc74c \u2014 \uc2ac\ub77c\uc774\ub4dc \uc0c1\ub2e8\uc5d0 \ubcc4\ub3c4 \ubc14 \uad6c\uc870\ub97c \uc0ac\uc6a9\ud558\uc9c0 \uc54a\uc74c`
          : headerEnabled
            ? `\u25B8 Header bar: enabled  |  height: ${headerHeight}px  |  color: ${formatThemeColorValue(headerColor, "en")}`
            : `\u25B8 Header bar: none \u2014 do not render any header bar at the top of the slide`);
        return;
      }

      if (key === "footer-bar-settings") {
        const { footerEnabled, footerHeight, footerColor } = state.barSettings;
        lines.push(lang === "ko"
          ? footerEnabled
            ? `\u25B8 \ud558\ub2e8\ubc14 \uc0ac\uc6a9  |  \ub192\uc774: ${footerHeight}px  |  \uceec\ub7ec: ${formatThemeColorValue(footerColor, "ko")}`
            : `\u25B8 \ud558\ub2e8\ubc14 \uc5c6\uc74c \u2014 \uc2ac\ub77c\uc774\ub4dc \ud558\ub2e8\uc5d0 \ubcc4\ub3c4 \ubc14 \uad6c\uc870\ub97c \uc0ac\uc6a9\ud558\uc9c0 \uc54a\uc74c`
          : footerEnabled
            ? `\u25B8 Footer bar: enabled  |  height: ${footerHeight}px  |  color: ${formatThemeColorValue(footerColor, "en")}`
            : `\u25B8 Footer bar: none \u2014 do not render any footer bar at the bottom of the slide`);
        return;
      }

      if (key === "header-slot-grid") {
        const block = buildHeaderSlotGridText(lang);
        if (block) lines.push(block);
        return;
      }

      if (key === "auto-forbidden") {
        lines.push(...getAutoForbiddenRules(lang));
        return;
      }

      if (key === "bg-solid-color") {
        // 배경 베이스가 '단색 배경'일 때만 HEX를 함께 출력
        const bgBase = state.selections.bg;
        if (bgBase && bgBase.text === "단색 배경") {
          const hex = state.bgSolidColor.toUpperCase();
          lines.push(lang === "ko"
            ? `▸ 단색 배경 지정 컬러: ${hex} — 슬라이드 전체 배경을 이 컬러로 평평하게 채울 것 (그라디언트·텍스처·패턴 추가 금지)`
            : `▸ Solid background color: ${hex} — fill the entire slide background flatly with this exact color; do NOT add any gradients, textures, or patterns`);
        }
        return;
      }

      getSelectionValues(key).forEach((item) => {
        if (item.text === "AI 위임" && !String(item.en || "").trim()) return;
        if (key === "format" && item.text === "사용자 정의") {
          lines.push(lang === "ko" 
            ? `사용자 정의 비율 ${state.customRatio.width}:${state.customRatio.height}` 
            : `custom aspect ratio ${state.customRatio.width}:${state.customRatio.height}`);
        } else {
          const promptText = getSelectionPromptText(key, item);
          lines.push(lang === "ko" ? promptText.ko : promptText.en);
        }
      });
    });

    if (!lines.length) return;

    // 바닥글 섹션은 모든 페이지에 동일하게 반복된다는 보장 문구를 자동 추가
    if (sectionId === "footer") {
      lines.push(lang === "ko"
        ? "▸ 바닥글 영역의 형태(선/바)·콘텐츠·정렬·높이·컬러는 슬라이드 전체에서 동일하게 반복되어야 합니다. 페이지 번호와 섹션 진행 인디케이터처럼 페이지마다 달라지는 값을 제외하면, 모든 텍스트·로고·디자인 요소는 페이지마다 같은 자리에 같은 모양으로 표시됩니다."
        : "▸ The footer style (line or bar), contents, alignment, height, and color must remain IDENTICAL on every slide of the deck. Except for page-dependent values (page number, section progress indicator), all footer text, logos, and design elements must appear in the same position with the same appearance on every page.");
    }

    // 복수 항목: 구분선+블릿, 단일 항목: 그대로 표시
    const isBlock = lines.length === 1 && lines[0].includes("\n"); // color-system처럼 이미 포맷된 경우
    const formatted = isBlock
      ? lines[0]
      : lines.length > 1
        ? lines.map((l) => "\u2023 " + l).join("\n")
        : lines[0] || "";

    parts.push({
      label: lang === "ko" ? section.labelKo : section.labelEn,
      cls: section.cls,
      text: formatted,
    });
  });

  return parts;
}

function buildPromptParts(lang) {
  return buildPromptSections().map((section) => ({
    label: lang === "ko" ? section.labelKo : section.labelEn,
    cls: section.cls,
    text: formatPromptEntries(section.entries, lang),
    entries: section.entries,
  }));
}

function renderPromptEntryBody(body, entries, lang) {
  const resolved = entries
    .map((entry) => ({ entry, text: resolvePromptEntryText(entry, lang) }))
    .filter((item) => item.text);

  const isBlock = resolved.length === 1 && resolved[0].text.includes("\n");
  if (isBlock) {
    const line = document.createElement("div");
    line.className = "prompt-line";
    line.dataset.entryId = resolved[0].entry.id;
    line.dataset.linePrefix = "";
    line.textContent = resolved[0].text;
    body.appendChild(line);
    return;
  }

  resolved.forEach((item) => {
    const line = document.createElement("div");
    const prefix = resolved.length > 1 ? "\u2023 " : "";
    line.className = "prompt-line";
    line.dataset.entryId = item.entry.id;
    line.dataset.linePrefix = prefix;
    line.textContent = `${prefix}${prefix ? stripPromptBullet(item.text) : item.text}`;
    body.appendChild(line);
  });
}

function renderPriorityNotes() {
  const notes = getPriorityNotes(state.lang);
  if (!notes.length) return null;

  const block = document.createElement("div");
  block.className = "priority-notes-box";

  const title = document.createElement("div");
  title.className = "priority-notes-title";
  title.textContent = state.lang === "ko" ? "우선순위 요약" : "Priority Notes";

  const list = document.createElement("div");
  list.className = "priority-notes-list";

  notes.forEach((note) => {
    const item = document.createElement("div");
    item.className = "priority-notes-item";
    item.textContent = note;
    list.appendChild(item);
  });

  block.append(title, list);
  return block;
}

function buildPromptOverridePanel() {
  const entries = state.focusKey ? getEditablePromptEntriesForKey(state.focusKey) : [];
  if (!entries.length) return null;

  const panel = document.createElement("div");
  panel.className = "prompt-override-panel";

  const head = document.createElement("div");
  head.className = "prompt-override-head";

  const titleWrap = document.createElement("div");

  const title = document.createElement("div");
  title.className = "prompt-override-title";
  title.textContent = "선택 항목 프롬프트 편집";

  const subtitle = document.createElement("div");
  subtitle.className = "prompt-override-subtitle";
  const focusLabel = state.focusKey === "pageType" ? "페이지 유형" : (OPTION_META[state.focusKey]?.label || state.focusKey);
  subtitle.textContent = `${focusLabel} 항목만 표시합니다. 문구를 수정한 뒤 저장해야 최종 프롬프트에 반영됩니다.`;

  titleWrap.append(title, subtitle);
  head.appendChild(titleWrap);
  panel.appendChild(head);

  const list = document.createElement("div");
  list.className = "prompt-override-list";

  entries.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "prompt-override-item";

    const itemHead = document.createElement("div");
    itemHead.className = "prompt-override-item-head";

    const meta = document.createElement("div");
    meta.className = "prompt-override-meta";

    const section = document.createElement("div");
    section.className = "prompt-override-section";
    section.textContent = state.lang === "ko" ? entry.sectionLabelKo : entry.sectionLabelEn;

    const label = document.createElement("div");
    label.className = "prompt-override-label";
    label.textContent = entry.sourceLabel;

    meta.append(section, label);

    const actions = document.createElement("div");
    actions.className = "prompt-override-actions";

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "clear-btn save-btn";
    saveBtn.textContent = "저장";
    saveBtn.disabled = !hasPromptLineDraft(entry.id);
    saveBtn.addEventListener("click", () => {
      savePromptLineDraft(entry);
      renderAll();
      showToast("프롬프트 수정사항을 저장했습니다.");
    });

    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "clear-btn";
    resetBtn.textContent = "기본값";
    resetBtn.disabled = !state.promptLineOverrides[entry.id] && !hasPromptLineDraft(entry.id);
    resetBtn.addEventListener("click", () => {
      resetPromptLineOverride(entry.id);
      clearPromptLineDraft(entry.id);
      renderAll();
      showToast("프롬프트 문구를 기본값으로 되돌렸습니다.");
    });

    actions.append(saveBtn, resetBtn);
    itemHead.append(meta, actions);

    const fields = document.createElement("div");
    fields.className = "prompt-override-fields";

    [
      { lang: "ko", label: "한글 프롬프트", fallback: entry.ko },
      { lang: "en", label: "영문 프롬프트", fallback: entry.en },
    ].forEach((fieldInfo) => {
      const field = document.createElement("label");
      field.className = "prompt-override-field";

      const fieldLabel = document.createElement("span");
      fieldLabel.className = "prompt-override-field-label";
      fieldLabel.textContent = fieldInfo.label;

      const textarea = document.createElement("textarea");
      textarea.className = "prompt-override-textarea";
      textarea.value = getPromptEditorValue(entry, fieldInfo.lang);
      textarea.placeholder = fieldInfo.fallback;
      textarea.addEventListener("input", () => {
        setPromptLineDraft(entry.id, fieldInfo.lang, textarea.value);
        saveBtn.disabled = !hasPromptLineDraft(entry.id);
        resetBtn.disabled = !state.promptLineOverrides[entry.id] && !hasPromptLineDraft(entry.id);
        item.classList.toggle("is-dirty", hasPromptLineDraft(entry.id));
      });

      field.append(fieldLabel, textarea);
      fields.appendChild(field);
    });

    item.classList.toggle("is-dirty", hasPromptLineDraft(entry.id));
    item.append(itemHead, fields);
    list.appendChild(item);
  });

  panel.appendChild(list);
  return panel;
}

function renderPrompt() {
  const wrap = document.getElementById("promptSections");
  const parts = buildPromptParts(state.lang);
  const userInput = getUserInputParts();
  const hasUserInput = hasStructuredUserInput();
  const doneCount = getCoreFlowStatus().filter((item) => item.done).length;
  const total = CORE_FLOW_STEPS.length;
  const ready = doneCount === total;
  const nextStep = getNextCoreStep();
  const conflicts = getResolvedConflicts();

  wrap.innerHTML = "";

  // 진행 상태 배너
  const banner = document.createElement("div");
  banner.className = `prompt-banner ${ready ? "ready" : ""}`.trim();

  const bannerTitle = document.createElement("div");
  bannerTitle.className = "prompt-banner-title";
  bannerTitle.textContent = ready ? "핵심 프롬프트 구조가 완성되었습니다." : `핵심 단계 ${doneCount}/${total} 완료`;

  const bannerText = document.createElement("div");
  bannerText.className = "prompt-banner-text";
  bannerText.textContent = ready
    ? "이제 컬러, 헤더, 금지 규칙, 실제 문구를 다듬어 이미지 품질을 높이면 됩니다."
    : `${nextStep.label} 선택이 다음 우선순위입니다.`;

  banner.append(bannerTitle, bannerText);
  wrap.appendChild(banner);

  // 충돌 경고
  if (conflicts.length) {
    const conflictBox = document.createElement("div");
    conflictBox.className = "conflict-warning-box";
    const conflictSummary = {
      block: conflicts.filter((item) => item.severity === "block").length,
      warning: conflicts.filter((item) => item.severity === "warning").length,
      soften: conflicts.filter((item) => item.severity === "soften").length,
    };
    const summaryText = state.lang === "ko"
      ? [`차단 ${conflictSummary.block}`, `경고 ${conflictSummary.warning}`, `자동 약화 ${conflictSummary.soften}`].filter((item) => !item.endsWith(" 0")).join(" · ")
      : [`Block ${conflictSummary.block}`, `Warning ${conflictSummary.warning}`, `Auto-soften ${conflictSummary.soften}`].filter((item) => !item.endsWith(" 0")).join(" · ");

    const conflictTitle = document.createElement("div");
    conflictTitle.className = "conflict-warning-title";
    conflictTitle.textContent = `⚠ 상충 조합 ${conflicts.length}건 감지됨${summaryText ? ` (${summaryText})` : ""}`;
    conflictBox.appendChild(conflictTitle);

    conflicts.forEach((c) => {
      const item = document.createElement("div");
      item.className = `conflict-warning-item ${getConflictSeverityClass(c.severity)}`.trim();
      const message = state.lang === "ko" ? c.msg : c.msgEn;
      item.textContent = `[${getConflictSeverityLabel(c.severity, state.lang)}] ${message} ${getConflictActionText(c, state.lang)}`;
      conflictBox.appendChild(item);
    });

    wrap.appendChild(conflictBox);
  }

  // 프롬프트 설정 컨트롤 패널
  const ctrlPanel = document.createElement("div");
  ctrlPanel.className = "prompt-ctrl-panel";

  const ctrlTitle = document.createElement("div");
  ctrlTitle.className = "prompt-ctrl-title";
  ctrlTitle.textContent = "프롬프트 출력 설정";
  ctrlPanel.appendChild(ctrlTitle);

  const ctrlRow = document.createElement("div");
  ctrlRow.className = "prompt-ctrl-row";

  // 토글 헬퍼
  function makeToggle(id, labelText, checked, onChange) {
    const label = document.createElement("label");
    label.className = "prompt-ctrl-toggle";
    label.htmlFor = id;

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = id;
    input.className = "bar-toggle-input";
    input.checked = checked;
    input.addEventListener("change", () => onChange(input.checked));

    const track = document.createElement("span");
    track.className = "bar-toggle-track";

    const text = document.createElement("span");
    text.className = "prompt-ctrl-label bar-toggle-text";
    text.textContent = labelText;

    label.append(input, track, text);
    return label;
  }

  ctrlRow.appendChild(makeToggle(
    "togglePreamble", "역할 지시문 포함",
    state.promptSettings.addPreamble,
    (v) => { state.promptSettings.addPreamble = v; renderPrompt(); }
  ));

  ctrlRow.appendChild(makeToggle(
    "toggleKorean", "슬라이드 텍스트 한국어",
    state.promptSettings.koreanContent,
    (v) => { state.promptSettings.koreanContent = v; renderPrompt(); }
  ));

  // 출력 모드 선택
  const modeWrap = document.createElement("div");
  modeWrap.className = "prompt-mode-wrap";

  const modeLabel = document.createElement("span");
  modeLabel.className = "prompt-ctrl-label";
  modeLabel.textContent = "출력 형식";
  modeWrap.appendChild(modeLabel);

  ["block", "prose"].forEach((mode) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `prompt-mode-btn ${state.promptSettings.outputMode === mode ? "active" : ""}`;
    btn.textContent = mode === "block" ? "블록형" : "자연어형";
    btn.addEventListener("click", () => {
      state.promptSettings.outputMode = mode;
      renderPrompt();
    });
    modeWrap.appendChild(btn);
  });

  ctrlRow.appendChild(modeWrap);
  ctrlPanel.appendChild(ctrlRow);
  wrap.appendChild(ctrlPanel);

  const priorityNotes = renderPriorityNotes();
  if (priorityNotes) {
    wrap.appendChild(priorityNotes);
  }

  const overridePanel = buildPromptOverridePanel();
  if (overridePanel) {
    wrap.appendChild(overridePanel);
  }

  if (!parts.length && !hasUserInput) {
    const empty = document.createElement("div");
    empty.className = "prompt-placeholder";
    empty.textContent = "왼쪽에서 옵션을 선택하면 이 영역에서 프롬프트가 실시간으로 조합됩니다.";
    wrap.appendChild(empty);
    return;
  }

  // 서두 지시문 미리보기 블록
  if (state.promptSettings.addPreamble) {
    const pBlock = document.createElement("div");
    pBlock.className = "prompt-block preamble";

    const pHead = document.createElement("div");
    pHead.className = "prompt-block-head";
    pHead.textContent = state.lang === "ko" ? "역할 지시문" : "INSTRUCTION";

    const pBody = document.createElement("div");
    pBody.className = "prompt-block-body";
    pBody.textContent = buildPreamble(state.lang);

    pBlock.append(pHead, pBody);
    wrap.appendChild(pBlock);
  }

  if (state.promptSettings.outputMode === "prose") {
    const proseBlock = document.createElement("div");
    proseBlock.className = "prompt-block prose";

    const proseHead = document.createElement("div");
    proseHead.className = "prompt-block-head";
    proseHead.textContent = state.lang === "ko" ? "자연어 통합 명세" : "PROSE SPECIFICATION";

    const proseBody = document.createElement("div");
    proseBody.className = "prompt-block-body";
    proseBody.textContent = buildProsePrompt(state.lang);

    proseBlock.append(proseHead, proseBody);
    wrap.appendChild(proseBlock);
    return;
  }

  parts.forEach((part) => {
    const block = document.createElement("div");
    block.className = `prompt-block ${part.cls}`.trim();

    const head = document.createElement("div");
    head.className = "prompt-block-head";
    head.textContent = part.label;

    const body = document.createElement("div");
    body.className = "prompt-block-body";
    renderPromptEntryBody(body, part.entries || [], state.lang);

    block.append(head, body);
    wrap.appendChild(block);
  });

  if (hasUserInput) {
    const block = document.createElement("div");
    block.className = "prompt-block user";

    const head = document.createElement("div");
    head.className = "prompt-block-head";
    head.textContent = state.lang === "ko" ? "사용자 입력 구조" : "USER INPUT STRUCTURE";

    const body = document.createElement("div");
    body.className = "prompt-block-body";
    body.textContent = formatUserInputPreview(userInput, state.lang);

    block.append(head, body);
    wrap.appendChild(block);
  }
}

function buildPreamble(lang) {
  const pageType = state.pageType;
  const prefix = PAGE_INSTRUCTION_PREFIX[pageType] || PAGE_INSTRUCTION_PREFIX.body;
  const lines = [];

  lines.push(lang === "ko" ? prefix.ko : prefix.en);

  // 한국어 콘텐츠 명시
  if (state.promptSettings.koreanContent) {
    lines.push(lang === "ko"
      ? "슬라이드 안에 삽입되는 모든 텍스트·라벨·수치·범례는 반드시 한국어로 작성합니다. 영문 텍스트가 슬라이드 본문에 노출되지 않도록 하세요."
      : "All text, labels, numbers, and legends placed on the slide must be written in Korean. Do not expose English text in the slide body.");
  }

  return lines.join("\n");
}

function buildProsePrompt(lang) {
  const parts = buildPromptParts(lang);
  const userInput = getUserInputParts();
  const sentences = [];

  parts.forEach(({ label, text }) => {
    if (!text) return;
    const flat = stripPromptBulletsForProse(text)
      .replace(/\n/g, ", ")
      .replace(/,\s*,/g, ",")
      .replace(/\s+/g, " ")
      .trim();
    sentences.push(lang === "ko" ? `[${label}] ${flat}` : `${flat}`);
  });

  if (userInput.content) {
    sentences.push(lang === "ko" ? `[슬라이드에 표시할 내용] ${userInput.content}` : `[Slide content to render] ${userInput.content}`);
  }

  if (userInput.designContext) {
    sentences.push(lang === "ko" ? `[디자인 이해용 맥락 - 원문 삽입 금지] ${userInput.designContext}` : `[Design context - do not render verbatim] ${userInput.designContext}`);
  }

  if (userInput.exclusions) {
    sentences.push(lang === "ko" ? `[슬라이드 구성 시 금지 요소] ${userInput.exclusions}` : `[Forbidden composition elements] ${userInput.exclusions}`);
  }

  return sentences.join(lang === "ko" ? "\n" : " ");
}

function buildFullPrompt(lang) {
  const parts = buildPromptParts(lang);
  const userInput = getUserInputParts();
  const { addPreamble, outputMode } = state.promptSettings;
  const pageType = getCurrentPageType();
  const pageLabel = lang === "ko" ? pageType.text : pageType.en;

  const lines = [];

  // --- 문서 제목 ---
  lines.push(lang === "ko"
    ? `# 발표자료 이미지 프롬프트 — ${pageLabel}`
    : `# Presentation Slide Prompt — ${pageLabel}`);
  lines.push("");

  // --- 역할 지시문 ---
  if (addPreamble) {
    lines.push(lang === "ko" ? "## 역할 지시문" : "## Instruction");
    lines.push("");
    buildPreamble(lang).split("\n").forEach((l) => lines.push(l));
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  const priorityNotes = getPriorityNotes(lang);
  if (priorityNotes.length) {
    lines.push(lang === "ko" ? "## 우선순위 요약" : "## Priority Notes");
    lines.push("");
    priorityNotes.forEach((note) => lines.push(`- ${note}`));
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // --- 본문 ---
  if (outputMode === "prose") {
    lines.push(lang === "ko" ? "## 통합 명세" : "## Specification");
    lines.push("");
    lines.push(buildProsePrompt(lang));
  } else {
    parts.forEach((part) => {
      lines.push(`## ${part.label}`);
      lines.push("");
      // Normalize prompt glyph bullets into clean Markdown list items.
      part.text.split("\n").forEach((l) => {
        const markdownLine = formatMarkdownPromptLine(l);
        if (markdownLine) lines.push(markdownLine);
      });
      lines.push("");
    });

    if (userInput.content) {
      lines.push(lang === "ko" ? "## 슬라이드에 표시할 내용" : "## Slide Content To Render");
      lines.push("");
      lines.push("```");
      lines.push(userInput.content);
      lines.push("```");
      lines.push("");
    }

    if (userInput.designContext) {
      lines.push(lang === "ko" ? "## 디자인 이해용 스크립트/맥락" : "## Design Context / Script");
      lines.push("");
      lines.push(lang === "ko"
        ? "아래 내용은 디자인 구성 이해용입니다. 슬라이드 안에 원문 그대로 넣지 마세요."
        : "Use the following only to understand the design composition. Do not place it verbatim on the slide.");
      lines.push("");
      lines.push("```");
      lines.push(userInput.designContext);
      lines.push("```");
      lines.push("");
    }

    if (userInput.exclusions) {
      lines.push(lang === "ko" ? "## 슬라이드 구성 시 금지 요소" : "## Forbidden Composition Elements");
      lines.push("");
      lines.push("```");
      lines.push(userInput.exclusions);
      lines.push("```");
      lines.push("");
    }
  }

  return lines.join("\n").trim();
}

function updateUserInputGuide(forceFill = false) {
  const guide = INPUT_GUIDES[state.pageType] || INPUT_GUIDES.body;
  const input = document.getElementById("userContent");
  document.getElementById("userInputTitle").textContent = guide.title;
  document.getElementById("userInputSubtitle").textContent = guide.subtitle;
  document.getElementById("userInputHint").textContent = guide.hint;
  input.placeholder = guide.defaultText || guide.placeholder;

  const shouldReplace =
    forceFill ||
    input.dataset.autofilled === "true";

  if (shouldReplace) {
    input.value = "";
    input.dataset.autofilled = "false";
  }
}

function copyPrompt(lang) {
  const text = buildFullPrompt(lang);
  if (!text) {
    showToast("먼저 옵션을 선택해주세요.");
    return;
  }

  const commonPromptInput = document.getElementById("genCommonPrompt");
  if (commonPromptInput) {
    commonPromptInput.value = text;
    commonPromptInput.dispatchEvent(new Event("input", { bubbles: true }));
    commonPromptInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  navigator.clipboard
    .writeText(text)
    .then(() => showToast(lang === "ko" ? "한글 프롬프트를 복사했습니다." : "영문 프롬프트를 복사했습니다."))
    .catch(() => showToast("클립보드 복사에 실패했습니다."));
}

function resetAll() {
  state.lang = "ko";
  state.pageType = "body";
  state.focusKey = "format";
  state.colorSystem = { ...DEFAULT_COLOR_SYSTEM };
  state.customRatio = { width: 16, height: 9 };
  state.barSettings = createDefaultBarSettings();
  state.selections = createEmptySelections();
  state.promptSettings = { addPreamble: true, koreanContent: false, outputMode: "block" };
  state.promptLineOverrides = {};
  state.promptLineDrafts = {};
  state.bgSolidColor = "#F5F6F7";
  state.customPhotoSubject = "";
  document.getElementById("userContent").value = "";
  const designContext = document.getElementById("userDesignContext");
  const exclusions = document.getElementById("userExclusions");
  if (designContext) designContext.value = "";
  if (exclusions) exclusions.value = "";
  buildSections();
  updateUserInputGuide();
  renderAll();
  showToast("전체 페이지를 기본 상태로 초기화했습니다.");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function renderAll() {
  renderPageTypes();
  syncColorInputs();
  syncSelectionStates();
  syncCustomPhotoSubjectField();
  syncBarSettingsControls();
  applyPageRulesToUI();
  updateClearButtonStates();
  updateSectionStatuses();
  renderProgress();
  renderOverview();
  renderProcessGuide();
  renderSummary();
  renderPrompt();
  updateTreeState();
}

document.addEventListener("DOMContentLoaded", () => {
  // AI 위임을 기본 선택으로 설정
  ["palette", "bg", "bg-style", "bg-tone"].forEach((key) => {
    if (!state.selections[key]) {
      const aiOption = findOptionByText(key, "AI 위임");
      if (aiOption) state.selections[key] = aiOption;
    }
  });

  renderPageTypes();
  buildSections();
  renderOptionTree();
  renderTemplates();
  updateUserInputGuide();
  renderAll();

  document.getElementById("btnKo").addEventListener("click", () => setLang("ko"));
  document.getElementById("btnEn").addEventListener("click", () => setLang("en"));
  document.getElementById("btnCopy").addEventListener("click", () => copyPrompt("ko"));
  document.getElementById("btnCopyEn").addEventListener("click", () => copyPrompt("en"));
  document.getElementById("btnClearSelections").addEventListener("click", clearAllSelections);
  document.getElementById("btnReset").addEventListener("click", resetAll);
  ["userContent", "userDesignContext", "userExclusions"].forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener("input", () => {
      if (id === "userContent") input.dataset.autofilled = "false";
      state.focusKey = "user-content";
      renderAll();
    });
  });
});

