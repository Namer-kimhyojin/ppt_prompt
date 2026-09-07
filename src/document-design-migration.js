(function () {
  "use strict";
  const resolver = window.PromptDeckDocumentResolver;
  if (!resolver) return;
  const KEY = "promptdeck.documentDesign.v3";
  const LEGACY_KEY = "promptdeck.documentDesign.v1";
  const themeMap = { "public-brief": "report-public-calm", "executive-summary": "report-data-clear", "consulting-strategy": "proposal-strategy", "proposal-win": "proposal-visual", "education-guide": "learning-step", "warm-human": "learning-visual", "research-policy": "report-public-calm", "technology-industry": "report-data-clear", "data-evidence": "report-data-clear", "minimal-office": "prose-quiet", "editorial-premium": "prose-photo", "dark-innovation": "report-data-clear" };
  const typeMap = {
    "business-report":"report", "business-plan":"proposal", proposal:"proposal", "policy-research":"report", "annual-report":"report", "market-report":"report", presentation:"proposal", "meeting-results":"report",
    whitepaper:"report", "technical-report":"report", "professional-guide":"learning", manual:"learning", handbook:"learning", "reference-book":"learning",
    textbook:"learning", "study-guide":"learning", "learning-workbook":"learning", "lecture-notes":"learning", "teacher-guide":"learning",
    "certification-book":"exam", "exam-prep":"exam", "question-bank":"exam", "solution-book":"exam",
    "essay-collection":"prose", "prose-collection":"prose", memoir:"prose", "poetry-collection":"prose",
    "fairy-tale":"story", "picture-book":"story", storybook:"story", "children-learning":"story",
    magazine:"prose", "brand-book":"proposal", catalogue:"proposal", brochure:"proposal",
  };
  const familyDefaults = { report:"report-public-calm", proposal:"proposal-strategy", learning:"learning-step", exam:"exam-theory", prose:"prose-quiet", story:"story-watercolor" };
  function migrateLegacyState(raw) {
    const old = raw && typeof raw === "object" ? raw : {};
    const type = old.publicationTypeId || old.publicationType || old.documentKind || "";
    let bundleId = themeMap[old.themeId] || "report-public-calm";
    const family = typeMap[type];
    if (family && window.PromptDeckDocumentBundles.get(bundleId)?.familyId !== family) bundleId = familyDefaults[family];
    const base = resolver.changeBundle(resolver.defaults(), bundleId);
    const degrees = old.adjustments?.creativeDegrees || {};
    const feel = { ...base.feel };
    if (/여유|넉넉/.test(degrees.pageWhitespace || "")) feel.breathing = "airy";
    if (/촘촘|밀도|치밀/.test(degrees.pageWhitespace || "")) feel.breathing = "compact";
    if (/풍부|대담|강렬/.test(degrees.colorPresence || "")) feel.colorPresence = "high";
    if (/절제|은은/.test(degrees.colorPresence || "")) feel.colorPresence = "low";
    if (/강하|강조/.test(degrees.titlePresence || "")) feel.titlePresence = "strong";
    if (/이미지 중심|풍부|크게/.test(degrees.imagePresence || "")) feel.imagePresence = "image";
    if (/최소|글 중심/.test(degrees.imagePresence || "")) feel.imagePresence = "text";
    const colors = old.adjustments?.colors || old.adjustments?.palette || {};
    const state = resolver.normalize({ ...base, feel, sourcePrompt: old.sourcePrompt, formats: old.formats, physicalSpec: { ...base.physicalSpec, ...old.pageSpec, ...old.productionSpec }, overrides: { ...base.overrides, colors }, activePageId: old.previewView });
    return { state, notice: "기존 설정을 새 견본에 연결했습니다. 원문·용지·색상은 가능한 범위에서 유지했고, 새 지면 구성에 맞춰 세부 설정을 정리했습니다. 이전 저장본은 보존되어 있습니다." };
  }
  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(resolver.normalize(state))); return { ok: true }; }
    catch (_) { return { ok: false, error: "이 기기에 자동 저장하지 못했습니다. 디자인 지침을 파일로 받아 보관해 주세요." }; }
  }
  function load() {
    try {
      const current = localStorage.getItem(KEY);
      if (current) {
        try { return { state: resolver.normalize(JSON.parse(current)), notice: "" }; }
        catch (_) { return { state: resolver.defaults(), notice: "저장된 설정을 읽지 못해 기본 견본을 열었습니다. 손상된 저장본은 보존했습니다." }; }
      }
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        try { const migrated = migrateLegacyState(JSON.parse(legacy)); const result = save(migrated.state); if (!result.ok) migrated.notice += " " + result.error; return migrated; }
        catch (_) { return { state: resolver.defaults(), notice: "이전 설정을 읽지 못해 기본 견본을 열었습니다. 이전 저장본은 보존했습니다." }; }
      }
      return { state: resolver.defaults(), notice: "" };
    } catch (_) { return { state: resolver.defaults(), notice: "이 브라우저에서 자동 저장을 사용할 수 없습니다. 디자인 지침을 파일로 받아 보관할 수 있습니다." }; }
  }
  window.PromptDeckDocumentMigration = Object.freeze({ KEY, LEGACY_KEY, load, save, migrateLegacyState, themeMap, typeMap });
})();
