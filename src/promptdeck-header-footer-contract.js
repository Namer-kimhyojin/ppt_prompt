(function () {
  const VERSION = "1.1";

  const RESERVED = Object.freeze({
    header: Object.freeze([
      Object.freeze({ key: "__slide_id", label: "슬라이드 식별 번호", source: "auto" }),
      Object.freeze({ key: "__slide_type", label: "슬라이드 유형", source: "auto" }),
    ]),
    footer: Object.freeze([
      Object.freeze({ key: "__page_number", label: "페이지 번호", source: "auto" }),
    ]),
  });
  const COMPATIBLE = Object.freeze({
    header: Object.freeze(["발표자료명", "축약 자료명", "기관명", "부서명", "발표 일자", "발표자", "보안등급", "1단계 파트", "2단계 제목", "3단계 부제", "파트", "제목", "부제", "섹션명"]),
    footer: Object.freeze(["출처", "주석", "저작권 문구"]),
    control: Object.freeze(["페이지 번호 정책"]),
  });

  const LEGACY_HEADER = /^(제목|슬라이드제목|헤더제목|2단계제목|헤더2단계제목|헤더파트|1단계파트|헤더1단계파트|헤더섹션명|섹션명|헤더부제|3단계부제|헤더3단계부제|발표자료명|축약자료명|기관명|부서명|발표일자|발표자|보안등급|슬라이드식별번호|슬라이드유형|slidetitle|headertitle|headersection|sectionname|headersubtitle|presentationtitle|shorttitle|organization|department|presentationdate|presenter|securitylevel|slideidentifier|slidetype)$/;
  const LEGACY_FOOTER = /^(푸터출처|출처|푸터주석|주석|저작권문구|페이지번호정책|페이지번호표기값|페이지번호|footersource|source|footernote|note|copyright|pagenumberpolicy|pagenumberdisplay|pagenumber)$/;

  function normalizeKey(value) {
    return String(value || "").replace(/\s+/g, "").toLowerCase();
  }

  function compactKey(value) {
    return normalizeKey(value).replace(/[()〔〕\[\]·._-]/g, "");
  }

  function cleanLabel(value) {
    return String(value || "")
      .replace(/\*\*/g, "")
      .replace(/〔[^〕]*〕/g, "")
      .replace(/[：:]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function parseFieldLabel(label, fallbackType = "") {
    const raw = cleanLabel(label);
    const patterns = [
      { type: "header", regex: /^(?:헤더|상단|header)\s*(?:정보\s*)?(?:[\[(<{]\s*)?(.+?)(?:\s*[\])>}]\s*)?$/i },
      { type: "footer", regex: /^(?:푸터|하단|footer)\s*(?:정보\s*)?(?:[\[(<{]\s*)?(.+?)(?:\s*[\])>}]\s*)?$/i },
      { type: "header", regex: /^(.+?)\s*(?:[\[(<{]\s*)?(?:헤더|상단|header)(?:\s*[\])>}]\s*)$/i },
      { type: "footer", regex: /^(.+?)\s*(?:[\[(<{]\s*)?(?:푸터|하단|footer)(?:\s*[\])>}]\s*)$/i },
    ];
    for (const pattern of patterns) {
      const match = raw.match(pattern.regex);
      const category = match?.[1]?.replace(/^[\s/·>_.-]+|[\s/·>_.-]+$/g, "").trim();
      if (category) return { type: pattern.type, category, explicit: true };
    }
    return fallbackType
      ? { type: fallbackType, category: raw, explicit: false }
      : { type: "", category: raw, explicit: false };
  }

  function classifyField(label, fallbackType = "") {
    const key = compactKey(label);
    if (LEGACY_HEADER.test(key)) return "header";
    if (LEGACY_FOOTER.test(key)) return "footer";
    return parseFieldLabel(label, fallbackType).type;
  }

  function canonicalFieldKey(label, type = classifyField(label)) {
    const key = normalizeKey(label);
    if (type === "header" && /^(제목|슬라이드제목|헤더제목|2단계제목|헤더2단계제목|slidetitle|headertitle)$/.test(key)) return "__slide_title";
    if (type === "header" && /^(슬라이드식별번호|slideidentifier)$/.test(key)) return "__slide_id";
    if (type === "header" && /^(슬라이드유형|slidetype)$/.test(key)) return "__slide_type";
    if (type === "footer" && /^(페이지번호표기값|페이지번호|pagenumberdisplay|pagenumber)$/.test(key)) return "__page_number";
    const descriptor = parseFieldLabel(label, type);
    const categoryKey = compactKey(descriptor.category);
    if (descriptor.type === "header" && /^(제목|슬라이드제목|2단계제목|slidetitle|title)$/.test(categoryKey)) return "__slide_title";
    if (descriptor.type === "header" && /^(슬라이드식별번호|슬라이드번호|slideidentifier|slideid)$/.test(categoryKey)) return "__slide_id";
    if (descriptor.type === "header" && /^(슬라이드유형|slidetype)$/.test(categoryKey)) return "__slide_type";
    if (descriptor.type === "footer" && /^(페이지번호표기값|페이지번호|pagenumberdisplay|pagenumber)$/.test(categoryKey)) return "__page_number";
    return descriptor.type && categoryKey ? `custom:${descriptor.type}:${categoryKey}` : key;
  }

  function classifyRegionHeading(title) {
    const normalized = cleanLabel(title).toLowerCase();
    if (/^(헤더|상단)(\s*(블록|정보|영역))?$/.test(normalized) || /^header(\s*(block|information|info|area))?$/.test(normalized)) return "header";
    if (/^(푸터|하단)(\s*(블록|정보|영역))?$/.test(normalized) || /^footer(\s*(block|information|info|area))?$/.test(normalized)) return "footer";
    return "";
  }

  function isDefinitionHeading(title) {
    const normalized = cleanLabel(title).toLowerCase();
    return /^(헤더[·ㆍ&/ ]*푸터|헤더푸터)\s*(슬롯|카테고리|항목)?\s*(정의|규약|계약)$/.test(normalized)
      || /^header[ &/]*footer\s*(slot|category|field)?\s*(definition|contract)$/.test(normalized);
  }

  function classifyDefinitionLabel(label) {
    const key = compactKey(label);
    if (/^(헤더|상단)(카테고리|슬롯|항목|필드)?$/.test(key) || /^header(categories|category|slots|slot|fields|field)?$/.test(key)) return "header";
    if (/^(푸터|하단)(카테고리|슬롯|항목|필드)?$/.test(key) || /^footer(categories|category|slots|slot|fields|field)?$/.test(key)) return "footer";
    return "";
  }

  function splitCategoryNames(value) {
    return String(value || "")
      .split(/[,，|/]/)
      .map((item) => item.replace(/^[-*+]\s*/, "").trim())
      .filter(Boolean);
  }

  window.PromptDeckHeaderFooterContract = Object.freeze({
    version: VERSION,
    definitionHeading: "헤더·푸터 슬롯 정의",
    valueSyntax: Object.freeze({ header: "헤더 {카테고리명}: {표시값}", footer: "푸터 {카테고리명}: {표시값}" }),
    precedence: Object.freeze(["slide", "global", "auto"]),
    reserved: RESERVED,
    compatible: COMPATIBLE,
    rules: Object.freeze({
      dynamicCategoriesRequireDeclaration: true,
      undeclaredCategoriesAcceptedForBackwardCompatibility: true,
      categoryLabelsAreMetadata: true,
      exactValuesAreDisplayContent: true,
      slideValuesOverrideGlobalValues: true,
      duplicateCategoryRenderingForbidden: true,
    }),
    normalizeKey,
    compactKey,
    parseFieldLabel,
    classifyField,
    canonicalFieldKey,
    classifyRegionHeading,
    isDefinitionHeading,
    classifyDefinitionLabel,
    splitCategoryNames,
  });
})();
