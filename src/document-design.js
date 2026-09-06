(function () {
  "use strict";

  const root = document.getElementById("documentDesignApp");
  const CATALOG = window.PromptDeckDocumentDesignCatalog;
  const CONTRACT = window.PromptDeckDocumentDesignContract;
  if (!root || !CATALOG || !CONTRACT) return;

  const STORAGE_KEY = "promptdeck.documentDesign.v1";
  const TRANSFER_KEY = "promptdeck.documentDesign.transfer.v1";
  const colorLabels = { primary: "주색", secondary: "보조", accent: "강조", background: "배경", surface: "표면", text: "본문", muted: "보조 글자", border: "구분선" };
  const densityLabels = { airy: "여유", balanced: "균형", compact: "촘촘" };
  const TYPOGRAPHY_SCOPE = Object.freeze({
    cover: ["표지", "표지 제목과 부제"], chapter: ["장 시작", "장 제목과 장 번호"], body: ["본문", "본문·소제목·목록"], quote: ["인용문", "인용문과 출처"], questionAnswer: ["문제·해설", "문제·선지·정답·해설"],
    tableChart: ["표·차트", "표·차트 제목·축·범례·값"], caption: ["캡션", "그림·표 캡션"], footer: ["머리말·꼬리말", "머리말·꼬리말·쪽번호"], numeral: ["수치", "KPI·공식·페이지 번호"], dialogue: ["대화문", "대화·말풍선"],
  });
  const DEGREE_OPTIONS = Object.freeze({
    colorIntensity: [["차분하게", "차분하게"], ["균형 있게", "균형 있게"], ["선명하게", "선명하게"], ["대담하게", "대담하게"]],
    contrast: [["부드럽게", "부드럽게"], ["균형 있게", "균형 있게"], ["명확하게", "명확하게"], ["강렬하게", "강렬하게"]],
    titlePresence: [["절제되게", "절제되게"], ["균형 있게", "균형 있게"], ["강하게", "강하게"], ["매우 강하게", "매우 강하게"]],
    bodyScale: [["작고 치밀하게", "작고 치밀하게"], ["균형 있게", "균형 있게"], ["편안하게", "편안하게"], ["넉넉하게", "넉넉하게"]],
    notePresence: [["은은하게", "은은하게"], ["절제되게", "절제되게"], ["균형 있게", "균형 있게"], ["또렷하게", "또렷하게"]],
    lineSpacing: [["촘촘하게", "촘촘하게"], ["균형 있게", "균형 있게"], ["여유롭게", "여유롭게"], ["매우 여유롭게", "매우 여유롭게"]],
    headingEmphasis: [["부드럽게", "부드럽게"], ["균형 있게", "균형 있게"], ["강하게", "강하게"], ["매우 강하게", "매우 강하게"]],
    hierarchyDepth: [["단순하게", "단순하게"], ["균형 있게", "균형 있게"], ["깊게", "깊게"]],
    pageWhitespace: [["조밀하게", "조밀하게"], ["균형 있게", "균형 있게"], ["여유롭게", "여유롭게"], ["매우 여유롭게", "매우 여유롭게"]],
    marginBalance: [["사방 균형 있게", "사방 균형 있게"], ["제본 쪽을 넉넉하게", "제본 쪽을 넉넉하게"], ["상단 호흡을 강조", "상단 호흡을 강조"], ["내용에 맞춰 유연하게", "내용에 맞춰 유연하게"]],
    paragraphRhythm: [["촘촘하게", "촘촘하게"], ["균형 있게", "균형 있게"], ["여유롭게", "여유롭게"]],
    sectionSeparation: [["부드럽게", "부드럽게"], ["분명하게", "분명하게"], ["매우 분명하게", "매우 분명하게"]],
    headerFooterBreathing: [["가깝게", "본문과 가깝게"], ["균형 있게", "균형 있게"], ["여유롭게", "본문과 여유롭게"]],
    tableInformationAmount: [["핵심만 간결하게", "핵심만 간결하게"], ["균형 있게", "균형 있게"], ["풍부하게", "풍부하게"], ["매우 풍부하게", "매우 풍부하게"]],
    cellBreathing: [["조밀하게", "조밀하게"], ["균형 있게", "균형 있게"], ["여유롭게", "여유롭게"], ["매우 여유롭게", "매우 여유롭게"]],
    colorPresence: [["거의 드러내지 않게", "최소"], ["절제되게", "절제"], ["균형 있게", "균형"], ["풍부하게", "풍부"]],
    accentFrequency: [["절제되게", "절제"], ["페이지마다 한두 번", "간헐"], ["주요 요소마다", "자주"], ["리듬감 있게 반복", "반복"]],
    backgroundPresence: [["순백에 가깝게", "순백"], ["은은하게", "은은"], ["영역별로 분명하게", "영역 구분"], ["페이지 분위기를 주도하게", "주도"]],
    darkPageFrequency: [["거의 사용하지 않게", "거의 없음"], ["표지에만", "표지만"], ["장 시작에도", "표지·장"], ["핵심 페이지마다", "핵심마다"]],
    imagePresence: [["필요한 만큼", "필요한 만큼"], ["균형 있게", "균형"], ["주도적으로", "주도"], ["몰입감 있게", "몰입"]],
    pageRhythm: [["차분하게", "차분"], ["완급을 균형 있게", "균형"], ["장마다 변화를 주게", "변화"], ["극적으로 전환되게", "극적"]],
    decorationPresence: [["거의 없이", "최소"], ["절제되게", "절제"], ["분명하게", "분명"], ["풍부하게", "풍부"]],
  });
  const DEGREE_PREVIEW = Object.freeze({
    titlePresence: { "절제되게": .86, "균형 있게": 1, "강하게": 1.14, "매우 강하게": 1.28 },
    bodyScale: { "작고 치밀하게": .9, "균형 있게": 1, "편안하게": 1.08, "넉넉하게": 1.16 },
    lineSpacing: { "촘촘하게": 1.3, "균형 있게": 1.5, "여유롭게": 1.7, "매우 여유롭게": 1.9 },
    headingEmphasis: { "부드럽게": 600, "균형 있게": 680, "강하게": 760, "매우 강하게": 850 },
    pageWhitespace: { "조밀하게": 12, "균형 있게": 18, "여유롭게": 24, "매우 여유롭게": 30 },
    cellBreathing: { "조밀하게": .78, "균형 있게": 1, "여유롭게": 1.2, "매우 여유롭게": 1.38 },
  });
  let activeCategory = "recommended";
  let mobileStep = 1;
  let generated = { designPrompt: "", fullPrompt: "", spec: null, generatedAt: "" };
  let dirty = true;
  const mobileStepMeta = {
    1: { label: "유형·규격", next: "테마 고르기" },
    2: { label: "테마 선택", next: "세부 조정" },
    3: { label: "비주얼 조정", next: "결과 확인" },
    4: { label: "결과·검수", next: "지침 생성" },
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"); }
  function getTheme(id) { return CATALOG.get(id) || CATALOG.themes[0]; }
  function publicationTypes() { return CATALOG.publicationTypes || CATALOG.documentKinds.map((item) => ({ ...item, grammarId: "report-analysis", bestFor: item.flow || "문서 시각 체계" })); }
  function visualGrammars() { return CATALOG.visualGrammars || [{ id: "report-analysis", label: "보고·분석형", description: "근거와 위계를 선명하게 보여주는 문서" }]; }
  function pageArchetypes() { return CATALOG.pageArchetypes || [
    { id: "cover", label: "표지" }, { id: "chapter", label: "장 시작" }, { id: "body", label: "본문" },
    { id: "image", label: "이미지" }, { id: "data", label: "표·차트" }, { id: "special", label: "특수 페이지" },
  ]; }
  function productionOptions() {
    return CATALOG.productionOptions || {
      mediums: [{ id: "print", label: "인쇄" }, { id: "screen", label: "화면" }, { id: "hybrid", label: "인쇄·화면 겸용" }],
      bindings: [{ id: "none", label: "낱장·제본 없음" }, { id: "left", label: "좌철" }, { id: "top", label: "상철" }],
      duplexModes: [{ id: "single", label: "단면" }, { id: "duplex", label: "양면" }],
      spreadModes: [{ id: "single-pages", label: "낱쪽 기준" }, { id: "facing", label: "맞쪽 펼침" }],
      bleeds: [{ id: "0", label: "도련 없음", mm: 0 }, { id: "3", label: "3mm 도련", mm: 3 }],
    };
  }
  function optionId(item) { return String(item?.id ?? item?.value ?? ""); }
  function publicationTypeId() { return state.publicationTypeId || state.publicationType || state.documentKind || publicationTypes()[0]?.id; }
  function visualGrammarId() { return state.visualGrammarId || publicationTypes().find((item) => item.id === publicationTypeId())?.grammarId || visualGrammars()[0]?.id; }
  function getPublicationType() { return CATALOG.getPublicationType?.(publicationTypeId()) || publicationTypes().find((item) => item.id === publicationTypeId()) || publicationTypes()[0]; }
  function getVisualGrammar() { return CATALOG.getVisualGrammar?.(visualGrammarId()) || visualGrammars().find((item) => item.id === visualGrammarId()) || visualGrammars()[0]; }
  function pagePreviews(theme) {
    const previews = theme.pagePreviews || theme.previews || {};
    return {
      cover: previews.cover,
      chapter: previews.chapter || previews.content || previews.cover,
      body: previews.body || previews.content || previews.cover,
      image: previews.image || previews.content || previews.cover,
      data: previews.data || previews.content || previews.cover,
      special: previews.special || previews.data || previews.content || previews.cover,
    };
  }
  function ensureUiState(inputState = state) {
    const type = publicationTypes().find((item) => item.id === (inputState.publicationTypeId || inputState.publicationType || inputState.documentKind)) || publicationTypes()[0];
    inputState.publicationTypeId = type?.id || inputState.documentKind;
    inputState.publicationType = inputState.publicationTypeId;
    inputState.visualGrammarId = inputState.visualGrammarId || type?.grammarId || visualGrammars()[0]?.id;
    inputState.productionSpec = {
      mediumId: "print", bindingId: "left", duplex: "duplex", duplexMode: "duplex", spreadMode: "facing", bleedMm: 3,
      ...(inputState.productionSpec || {}),
    };
    inputState.productionSpec.duplex = inputState.productionSpec.duplex || inputState.productionSpec.duplexMode || "duplex";
    inputState.productionSpec.duplexMode = inputState.productionSpec.duplex;
    if (inputState.previewView === "content") inputState.previewView = "body";
    if (!pageArchetypes().some((item) => item.id === inputState.previewView)) inputState.previewView = "cover";
    inputState.adjustments.creativeDegrees = inputState.adjustments.creativeDegrees || {};
    inputState.adjustments.typographyScope = { ...Object.fromEntries(Object.entries(TYPOGRAPHY_SCOPE).map(([key, [, description]]) => [key, description])), ...(inputState.adjustments.typographyScope || {}) };
    inputState.adjustments.visualAssets = {
      diagramUsage: "관계·절차·구조를 설명할 때 사용",
      diagramStyle: "테마 색상과 같은 선 굵기·모서리·라벨 체계",
      ...(inputState.adjustments.visualAssets || {}),
    };
    const defaults = { colorPresence: "균형 있게", accentFrequency: "페이지마다 한두 번", backgroundPresence: "은은하게", darkPageFrequency: "표지에만", imagePresence: "균형 있게", pageRhythm: "완급을 균형 있게", decorationPresence: "절제되게" };
    Object.entries(defaults).forEach(([key, value]) => { if (!inputState.adjustments.creativeDegrees[key]) inputState.adjustments.creativeDegrees[key] = value; });
    return inputState;
  }
  function defaultState() {
    const theme = CATALOG.themes[0];
    const type = publicationTypes()[0];
    return ensureUiState(CONTRACT.normalize({ sourcePrompt: "", documentKind: type?.id || "business-report", publicationTypeId: type?.id, publicationType: type?.id, visualGrammarId: type?.grammarId, formats: ["DOCX", "PDF"], themeId: theme.id, previewView: "cover", pageRole: "cover" }));
  }
  function loadState() {
    try { return ensureUiState(CONTRACT.normalize(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || defaultState())); }
    catch (_) { return defaultState(); }
  }
  let state = loadState();

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }
  function setStatus(message, error = false) {
    const status = document.getElementById("documentDesignStatus");
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("error", error);
  }
  function markDirty(message = "설정이 바뀌었습니다. 다시 생성하면 결과에 반영됩니다.") {
    dirty = true;
    saveState();
    setStatus(message);
    syncResultMeta();
    syncMobileFlow();
    renderThemeProfile();
  }

  function syncMobileFlow() {
    root.dataset.mobileStep = String(mobileStep);
    root.querySelectorAll("[data-mobile-step]").forEach((button) => {
      const active = Number(button.dataset.mobileStep) === mobileStep;
      button.classList.toggle("active", active);
      button.setAttribute("aria-current", active ? "step" : "false");
    });
    const meta = mobileStepMeta[mobileStep];
    const count = document.getElementById("documentDesignMobileStepCount");
    const label = document.getElementById("documentDesignMobileStepLabel");
    const back = root.querySelector('[data-mobile-action="back"]');
    const next = root.querySelector('[data-mobile-action="next"]');
    if (count) count.textContent = `${mobileStep} / 4`;
    if (label) label.textContent = meta.label;
    if (back) back.disabled = mobileStep === 1;
    if (next) next.textContent = mobileStep === 4 && generated.fullPrompt && !dirty ? "전체 복사" : meta.next;
  }

  function setMobileStep(step, moveFocus = true) {
    mobileStep = Math.max(1, Math.min(4, Number(step) || 1));
    syncMobileFlow();
    if (!moveFocus || !window.matchMedia("(max-width: 720px)").matches) return;
    if (mobileStep === 3) {
      const groups = [...root.querySelectorAll(".doc-design-adjust-group")];
      groups.forEach((details, index) => { details.open = index === 0; });
    }
    window.requestAnimationFrame(() => {
      const target = document.getElementById(`docDesignStep${mobileStep}`);
      if (!target) return;
      target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      target.focus({ preventScroll: true });
      if (mobileStep === 2) centerSelectedTheme("auto");
    });
  }

  async function handleMobilePrimary() {
    if (mobileStep < 4) {
      setMobileStep(mobileStep + 1);
      return;
    }
    if (!generated.fullPrompt || dirty) {
      if (generate()) syncMobileFlow();
      return;
    }
    await copyFull();
  }

  function themeCards() {
    return visibleThemes().map((theme) => {
      const previews = pagePreviews(theme);
      return `
      <button type="button" class="doc-design-theme-card${theme.id === state.themeId ? " active" : ""}" data-theme-id="${theme.id}" aria-pressed="${theme.id === state.themeId}" aria-label="${escapeHtml(theme.nameKo)} 테마 세트 선택. 표지부터 특수 페이지까지 여섯 화면 포함. ${escapeHtml(theme.bestFor)}">
        <span class="doc-design-selected-mark">선택</span>
        <span class="doc-design-theme-set" aria-hidden="true">
          ${pageArchetypes().map((page) => `<span class="doc-design-theme-set-preview"><img src="${escapeHtml(previews[page.id])}" alt="" width="960" height="540" loading="${theme.id === state.themeId ? "eager" : "lazy"}"><span>${escapeHtml(page.id === "special" ? (getVisualGrammar()?.specialPageLabel || page.label) : page.label)}</span></span>`).join("")}
        </span>
        <span class="doc-design-theme-card-copy"><strong>${escapeHtml(theme.nameKo)}</strong><small>${escapeHtml(theme.bestFor)}</small><span class="doc-design-theme-card-scope">표지 · 장 시작 · 본문 · 이미지 · 데이터 · 특수면</span></span>
      </button>`;
    }).join("");
  }

  function recommendedThemes() {
    const grammarId = visualGrammarId();
    const grammar = getVisualGrammar();
    const direct = CATALOG.listByGrammar?.(grammarId);
    const ids = new Set(grammar?.recommendedThemeIds || []);
    const matches = Array.isArray(direct) && direct.length
      ? direct
      : CATALOG.themes.filter((theme) => (theme.recommendedGrammarIds || []).includes(grammarId) || ids.has(theme.id));
    return matches.length ? matches : CATALOG.themes.slice();
  }
  function visibleThemes() {
    if (activeCategory === "recommended") {
      const recommended = recommendedThemes();
      const selected = getTheme(state.themeId);
      return selected && !recommended.some((theme) => theme.id === selected.id)
        ? [selected, ...recommended]
        : recommended;
    }
    return CATALOG.list(activeCategory);
  }

  function publicationTypeCards() {
    const grammarId = visualGrammarId();
    return publicationTypes().filter((item) => !grammarId || item.grammarId === grammarId).map((item) => {
      const grammar = visualGrammars().find((candidate) => candidate.id === item.grammarId);
      const selected = item.id === publicationTypeId();
      return `<button type="button" class="doc-design-type-card${selected ? " active" : ""}" data-publication-type="${escapeHtml(item.id)}" aria-pressed="${selected}"><span>${escapeHtml(grammar?.label || "문서")}</span><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.bestFor || grammar?.description || "시각 편집 규칙")}</small></button>`;
    }).join("");
  }

  function visualGrammarChips() {
    const selected = visualGrammarId();
    return visualGrammars().map((grammar) => `<button type="button" class="doc-design-grammar-chip${grammar.id === selected ? " active" : ""}" data-visual-grammar="${escapeHtml(grammar.id)}" aria-pressed="${grammar.id === selected}">${escapeHtml(grammar.label)}</button>`).join("");
  }

  function productionSelect(id, label, entries, selected) {
    return `<div class="doc-design-field"><label for="${id}">${label}</label><select id="${id}">${entries.map((item) => `<option value="${escapeHtml(optionId(item))}"${optionId(item) === String(selected) ? " selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></div>`;
  }

  function bleedSelection() {
    const item = (productionOptions().bleeds || []).find((candidate) => Number(candidate.mm ?? candidate.value ?? optionId(candidate).replace(/[^\d.]/g, "")) === Number(state.productionSpec.bleedMm));
    return optionId(item) || String(state.productionSpec.bleedMm);
  }

  function categoryButtons() {
    const categories = [{ id: "recommended", label: "내 유형 추천" }, ...CATALOG.categories];
    return categories.map((item) => `<button type="button" class="doc-design-filter${item.id === activeCategory ? " active" : ""}" data-theme-category="${item.id}" aria-pressed="${item.id === activeCategory}">${escapeHtml(item.label)}</button>`).join("");
  }

  function pageViewTabs() {
    return pageArchetypes().map((page) => `<button type="button" class="doc-design-view-tab${page.id === state.previewView ? " active" : ""}" data-live-view="${page.id}" aria-pressed="${page.id === state.previewView}">${escapeHtml(page.id === "special" ? (getVisualGrammar()?.specialPageLabel || page.label) : page.label)}</button>`).join("");
  }

  function syncThemeNavigator() {
    const themes = visibleThemes();
    const index = themes.findIndex((theme) => theme.id === state.themeId);
    const selected = getTheme(state.themeId);
    const name = document.getElementById("documentDesignMobileTheme");
    const position = document.getElementById("documentDesignThemePosition");
    const previous = root.querySelector('[data-theme-nav="previous"]');
    const next = root.querySelector('[data-theme-nav="next"]');
    if (name) name.textContent = selected.nameKo;
    if (position) position.textContent = index >= 0 ? `${index + 1} / ${themes.length}` : `전체 ${themes.length}개`;
    if (previous) previous.disabled = index <= 0;
    if (next) next.disabled = index < 0 || index >= themes.length - 1;
  }

  function centerSelectedTheme(behavior = "auto") {
    if (!window.matchMedia("(max-width: 1120px)").matches) return;
    const grid = document.getElementById("documentDesignThemeGrid");
    const card = grid?.querySelector(`[data-theme-id="${state.themeId}"]`);
    if (!grid || !card) return;
    const gridRect = grid.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const target = grid.scrollLeft + cardRect.left - gridRect.left - (gridRect.width - cardRect.width) / 2;
    grid.scrollTo({ left: Math.max(0, target), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : behavior });
  }

  function moveThemeSelection(direction) {
    const themes = visibleThemes();
    const index = themes.findIndex((theme) => theme.id === state.themeId);
    const target = themes[index + direction];
    if (target) applyTheme(target.id);
  }

  function renderThemeProfile() {
    const title = document.getElementById("documentDesignThemeProfileTitle");
    const grid = document.getElementById("documentDesignThemeProfileGrid");
    if (!title || !grid) return;
    const theme = getTheme(state.themeId);
    const visual = state.adjustments.visualAssets;
    const grammar = getVisualGrammar();
    const items = [
      ["시각 문법", `${grammar?.label || "문서"} · ${grammar?.visualTone || grammar?.description || "일관된 편집 체계"}`],
      ["6면 페이지", pageArchetypes().map((page) => page.id === "special" ? (grammar?.specialPageLabel || page.label) : page.label).join(" · ")],
      ["배경 이미지", `${visual.backgroundUsage} · ${visual.backgroundStyle}`],
      ["아이콘", `${visual.iconUsage} · ${visual.iconStyle}`],
      ["픽토그램", `${visual.pictogramUsage} · ${visual.pictogramStyle}`],
      ["다이어그램", `${visual.diagramUsage} · ${visual.diagramStyle}`],
      ["타이포그래피", Object.entries(state.adjustments.typographyScope || {}).filter(([, value]) => value !== "적용하지 않음" && value !== false).map(([key]) => TYPOGRAPHY_SCOPE[key]?.[0]).filter(Boolean).join(" · ")],
      ["레이아웃", `${state.adjustments.layout.grid} · ${densityLabels[state.adjustments.layout.density] || state.adjustments.layout.density}`],
      ["표·그래프", `${state.adjustments.tableRules.style} · ${state.adjustments.chartRules.preferredType}`],
      ["조정 감각", `색상 ${state.adjustments.creativeDegrees.colorPresence} · 제목 ${state.adjustments.creativeDegrees.titlePresence} · 리듬 ${state.adjustments.creativeDegrees.pageRhythm}`],
    ];
    title.textContent = `${theme.nameKo} 전체 구성`;
    grid.innerHTML = items.map(([label, value]) => `<div><span>${label}</span><p>${escapeHtml(value)}</p></div>`).join("");
  }

  function kindOptions() {
    return publicationTypes().map((kind) => `<option value="${kind.id}"${kind.id === publicationTypeId() ? " selected" : ""}>${escapeHtml(kind.label)}</option>`).join("");
  }
  function formatOptions() {
    return CATALOG.outputFormats.map((format) => `<label class="doc-design-format-option"><input type="checkbox" name="documentDesignFormat" value="${format.id}"${state.formats.includes(format.id) ? " checked" : ""}>${escapeHtml(format.label)}</label>`).join("");
  }
  function pageSizeOptions() {
    return CATALOG.pageSizes.map((page) => `<option value="${page.id}"${page.id === state.pageSpec.sizeId ? " selected" : ""}>${escapeHtml(page.label)} · ${page.widthMm}×${page.heightMm}mm</option>`).join("");
  }
  function pageOrientationOptions() {
    return CATALOG.pageOrientations.map((orientation) => `<label class="doc-design-format-option"><input type="radio" name="documentDesignOrientation" value="${orientation.id}"${orientation.id === state.pageSpec.orientation ? " checked" : ""}>${escapeHtml(orientation.label)}</label>`).join("");
  }
  function fontOptions() {
    return Object.entries(CATALOG.fontPresets).map(([id, preset]) => `<option value="${id}"${id === state.adjustments.typography.fontPreset ? " selected" : ""}>${escapeHtml(preset.label)}</option>`).join("");
  }
  function colorInputs() {
    return Object.entries(colorLabels).map(([key, label]) => `<label class="doc-design-color">${label}<input type="color" value="${escapeHtml(state.adjustments.colors[key])}" data-adjust-group="colors" data-adjust-key="${key}" aria-label="${label} 색상"></label>`).join("");
  }
  function boolCheck(group, key, label) {
    return `<label class="doc-design-check"><input type="checkbox" data-adjust-group="${group}" data-adjust-key="${key}"${state.adjustments[group][key] ? " checked" : ""}>${label}</label>`;
  }
  function typographyScopeChecks() {
    return Object.entries(TYPOGRAPHY_SCOPE).map(([key, [label]]) => `<label class="doc-design-check"><input type="checkbox" data-typography-scope="${key}"${state.adjustments.typographyScope[key] !== "적용하지 않음" && state.adjustments.typographyScope[key] !== false ? " checked" : ""}>${label}</label>`).join("");
  }
  function optionList(current, entries) {
    const choices = entries.some(([value]) => value === current) || current === undefined || current === null ? entries : [[current, current], ...entries];
    return choices.map(([value, label]) => `<option value="${escapeHtml(value)}"${value === current ? " selected" : ""}>${escapeHtml(label)}</option>`).join("");
  }
  function degreeSelect(id, key, label, help = "") {
    const current = state.adjustments.creativeDegrees[key];
    const baseEntries = DEGREE_OPTIONS[key] || [];
    const entries = baseEntries.some(([value]) => value === current) ? baseEntries : [[current, current], ...baseEntries];
    return `<fieldset class="doc-design-field doc-design-degree-field"><legend>${label}</legend><select class="doc-design-degree-native" id="${id}" data-degree-key="${key}" tabindex="-1" aria-hidden="true">${optionList(current, entries)}</select><div class="doc-design-degree-options" role="radiogroup" aria-label="${escapeHtml(label)}">${entries.map(([value, shortLabel], index) => `<label><input type="radio" name="${id}Degree" value="${escapeHtml(value)}" data-degree-key="${key}"${value === current ? " checked" : ""}><span>${escapeHtml(shortLabel)}</span></label>`).join("")}</div>${help ? `<small>${escapeHtml(help)}</small>` : ""}</fieldset>`;
  }

  function renderShell() {
    root.innerHTML = `
      <div class="document-design-shell">
        <header class="document-design-hero">
          <div><span class="document-design-kicker">Publication Visual System</span><h2>내용은 그대로, 문서의 보이는 방식을 설계하세요</h2><p>보고서부터 교과서·자격증 도서·수필집·동화책까지, 유형에 맞는 한 세트의 시각 규칙을 원문 뒤에 더합니다.</p></div>
          <div class="doc-design-hero-flow" aria-label="작업 흐름"><b>유형·규격</b><span>→</span><b>테마 선택</b><span>→</span><b>비주얼 조정</b><span>→</span><b>결과·검수</b></div>
        </header>
        <nav class="doc-design-mobile-steps" aria-label="문서 디자인 작업 단계">
          ${Object.entries(mobileStepMeta).map(([step, meta]) => `<button type="button" data-mobile-step="${step}" aria-controls="docDesignStep${step}"><span>${step}</span>${meta.label.replace(" 작성", "").replace(" 선택", "").replace(" 조정", "").replace("미리보기·", "")}</button>`).join("")}
        </nav>
        <div class="doc-design-grid">
          <div class="doc-design-input-stack">
            <section class="doc-design-card" id="docDesignStep1" data-doc-step="1" aria-labelledby="docDesignInputTitle" tabindex="-1">
              <div class="doc-design-card-head"><div><span class="doc-design-step-label">1 · 유형·규격</span><h3 id="docDesignInputTitle">문서의 성격과 완성 규격을 고르세요</h3><p>유형은 시각 문법만 정합니다. 입력 내용과 목차, 문장, 사실, 수치는 바꾸지 않습니다.</p></div></div>
              <div class="doc-design-card-body">
                <section class="doc-design-type-picker" aria-labelledby="documentDesignTypeTitle"><div class="doc-design-section-title"><div><strong id="documentDesignTypeTitle">출판 시각 유형</strong><span id="documentDesignGrammarSummary">${escapeHtml(getVisualGrammar()?.label || "")}</span></div><small>가까운 문서 유형을 고르면 어울리는 테마와 특수 페이지를 추천합니다.</small></div><div class="doc-design-grammar-chips" id="documentDesignGrammarChips" role="group" aria-label="시각 문법">${visualGrammarChips()}</div><div class="doc-design-type-grid" id="documentDesignTypeGrid">${publicationTypeCards()}</div></section>
                <div class="doc-design-field"><label for="documentDesignSource">디자인 지침을 덧붙일 원문</label><textarea id="documentDesignSource" placeholder="다른 곳에서 작성한 문서 요청 또는 원문을 붙여넣으세요. 내용은 손대지 않고 시각 편집 지침만 뒤에 추가합니다.">${escapeHtml(state.sourcePrompt)}</textarea><small id="documentDesignSourceCount">${state.sourcePrompt.length.toLocaleString("ko-KR")}자 · 입력 내용은 임의로 고치지 않습니다.</small></div>
                <div class="doc-design-row">
                  <div class="doc-design-field"><label for="documentDesignKind">선택한 세부 유형</label><select id="documentDesignKind">${kindOptions()}</select></div>
                  <fieldset class="doc-design-field"><legend>출력 형식</legend><div class="doc-design-format-options">${formatOptions()}</div></fieldset>
                </div>
                <div class="doc-design-paper-spec" aria-labelledby="documentDesignPaperTitle">
                  <div class="doc-design-paper-head"><div><strong id="documentDesignPaperTitle">문서 규격</strong><span id="documentDesignPaperSummary"></span></div><small>이 규격은 완성 문서의 실제 크기로 고정됩니다.</small></div>
                  <div class="doc-design-row">
                    <div class="doc-design-field"><label for="documentDesignPageSize">용지 크기</label><select id="documentDesignPageSize">${pageSizeOptions()}</select></div>
                    <fieldset class="doc-design-field"><legend>용지 방향</legend><div class="doc-design-format-options doc-design-orientation-options">${pageOrientationOptions()}</div></fieldset>
                  </div>
                  <div class="doc-design-production-grid">
                    ${productionSelect("documentDesignMedium", "사용 매체", productionOptions().mediums || [], state.productionSpec.mediumId)}
                    ${productionSelect("documentDesignBinding", "제본 방식", productionOptions().bindings || [], state.productionSpec.bindingId)}
                    ${productionSelect("documentDesignDuplex", "면 구성", productionOptions().duplexModes || [], state.productionSpec.duplex)}
                    ${productionSelect("documentDesignSpread", "페이지 보기", productionOptions().spreadModes || [], state.productionSpec.spreadMode)}
                    ${productionSelect("documentDesignBleed", "재단 도련", productionOptions().bleeds || [], bleedSelection())}
                  </div>
                </div>
                <div class="doc-design-mobile-only doc-design-inline-actions"><button type="button" class="doc-design-btn" data-inline-action="sample">작성 예시 채우기</button></div>
              </div>
            </section>
            <section class="doc-design-card" id="docDesignStep2" data-doc-step="2" aria-labelledby="docDesignThemeTitle" tabindex="-1">
              <div class="doc-design-card-head"><div><span class="doc-design-step-label">2 · 테마 선택</span><h3 id="docDesignThemeTitle">여섯 페이지가 한 세트인 테마를 고르세요</h3><p>표지·장 시작·본문·이미지·표/차트·특수 페이지에 같은 색상과 타이포그래피 규칙이 이어집니다.</p></div></div>
              <div class="doc-design-card-body"><div class="doc-design-recommendation" id="documentDesignRecommendation"><span>${escapeHtml(getVisualGrammar()?.label || "선택 유형")}</span><strong>${escapeHtml(getPublicationType()?.label || "문서")}에 맞는 테마를 먼저 보여드립니다.</strong></div><div class="doc-design-category-bar" role="group" aria-label="문서 테마 분류">${categoryButtons()}</div><div class="doc-design-theme-grid" id="documentDesignThemeGrid">${themeCards()}</div><div class="doc-design-theme-navigator" aria-label="테마 이동"><button type="button" data-theme-nav="previous">이전 테마</button><div aria-live="polite"><span>선택한 테마</span><strong id="documentDesignMobileTheme"></strong><small><b id="documentDesignThemePosition"></b> · 좌우로 넘겨 비교</small></div><button type="button" data-theme-nav="next">다음 테마</button></div><section class="doc-design-theme-profile" aria-labelledby="documentDesignThemeProfileTitle"><div class="doc-design-theme-profile-head"><div><span>테마에 포함된 설정</span><strong id="documentDesignThemeProfileTitle"></strong></div><p>한 번에 적용한 뒤 다음 단계에서 필요한 느낌만 조정할 수 있습니다.</p></div><div class="doc-design-theme-profile-grid" id="documentDesignThemeProfileGrid"></div></section></div>
            </section>
            <section class="doc-design-card" id="docDesignStep3" data-doc-step="3" aria-labelledby="docDesignAdjustTitle" tabindex="-1">
              <div class="doc-design-card-head"><div><span class="doc-design-step-label">3 · 비주얼 조정</span><h3 id="docDesignAdjustTitle">필요한 느낌의 차이만 조정하세요</h3><p>정확한 수치 대신 강도와 호흡을 고르면 AI가 문서 맥락에 맞춰 창의적으로 해석합니다.</p></div><button type="button" class="doc-design-btn" id="documentDesignRestoreThemeBtn">테마 기본값</button></div>
              <div class="doc-design-card-body"><div class="doc-design-ai-guidance"><strong>수치 대신 느낌으로 조정</strong><p>각 선택은 고정된 pt·mm·% 값이 아닙니다. 문서 목적과 분량을 바탕으로 AI가 가장 자연스러운 크기와 간격을 정합니다.</p></div><div class="doc-design-adjust-groups">
                <details class="doc-design-adjust-group" open><summary>색상 배치와 분위기</summary><div class="doc-design-adjust-body"><div class="doc-design-row">${degreeSelect("documentDesignColorIntensity", "colorIntensity", "색상 강도")}${degreeSelect("documentDesignContrast", "contrast", "대비 느낌")}</div><div class="doc-design-row">${degreeSelect("documentDesignColorPresence", "colorPresence", "색상 존재감")}${degreeSelect("documentDesignAccentFrequency", "accentFrequency", "강조색 빈도")}</div><div class="doc-design-row">${degreeSelect("documentDesignBackgroundPresence", "backgroundPresence", "배경색 존재감")}${degreeSelect("documentDesignDarkPageFrequency", "darkPageFrequency", "어두운 페이지 빈도")}</div><div class="doc-design-field"><label>테마 기준 팔레트</label><div class="doc-design-color-grid" id="documentDesignColorGrid">${colorInputs()}</div><small>주색·보조색·강조색과 배경·본문·선의 역할을 유지하며 선택한 정도에 맞춰 배치합니다.</small></div></div></details>
                <details class="doc-design-adjust-group"><summary>배경·이미지·아이콘·픽토그램·다이어그램</summary><div class="doc-design-adjust-body">
                  <div class="doc-design-row">${degreeSelect("documentDesignImagePresence", "imagePresence", "이미지 존재감")}${degreeSelect("documentDesignDecorationPresence", "decorationPresence", "장식 요소 존재감")}</div>
                  <div class="doc-design-row"><div class="doc-design-field"><label for="documentDesignBackgroundUsage">배경 이미지 적용 범위</label><select id="documentDesignBackgroundUsage" data-adjust-group="visualAssets" data-adjust-key="backgroundUsage">${optionList(state.adjustments.visualAssets.backgroundUsage, [["배경 이미지를 사용하지 않음", "사용하지 않음"], ["표지에만 사용", "표지에만"], ["표지·간지에만 제한적으로 사용", "표지·간지"], ["표지·간지·핵심 페이지에 사용", "핵심 페이지까지"]])}</select></div><div class="doc-design-field"><label for="documentDesignBackgroundStyle">배경 이미지 표현 방식</label><input id="documentDesignBackgroundStyle" type="text" data-adjust-group="visualAssets" data-adjust-key="backgroundStyle" value="${escapeHtml(state.adjustments.visualAssets.backgroundStyle)}"></div></div>
                  <div class="doc-design-row"><div class="doc-design-field"><label for="documentDesignIconUsage">아이콘 적용 범위</label><select id="documentDesignIconUsage" data-adjust-group="visualAssets" data-adjust-key="iconUsage">${optionList(state.adjustments.visualAssets.iconUsage, [["아이콘을 사용하지 않음", "사용하지 않음"], ["핵심 정보의 빠른 탐색에만 사용", "핵심 정보 탐색"], ["제목·단계·상태 표식에 사용", "제목·단계·상태"], ["모든 기능 항목에 일관되게 사용", "기능 항목 전체"]])}</select></div><div class="doc-design-field"><label for="documentDesignIconStyle">아이콘 스타일</label><input id="documentDesignIconStyle" type="text" data-adjust-group="visualAssets" data-adjust-key="iconStyle" value="${escapeHtml(state.adjustments.visualAssets.iconStyle)}"></div></div>
                  <div class="doc-design-row"><div class="doc-design-field"><label for="documentDesignPictogramUsage">픽토그램 적용 범위</label><select id="documentDesignPictogramUsage" data-adjust-group="visualAssets" data-adjust-key="pictogramUsage">${optionList(state.adjustments.visualAssets.pictogramUsage, [["픽토그램을 사용하지 않음", "사용하지 않음"], ["절차·대상·분류를 설명할 때 사용", "절차·대상·분류"], ["프로세스와 관계 구조에 사용", "프로세스·관계"], ["핵심 개념 페이지마다 사용", "핵심 개념 전체"]])}</select></div><div class="doc-design-field"><label for="documentDesignPictogramStyle">픽토그램 스타일</label><input id="documentDesignPictogramStyle" type="text" data-adjust-group="visualAssets" data-adjust-key="pictogramStyle" value="${escapeHtml(state.adjustments.visualAssets.pictogramStyle)}"></div></div>
                  <div class="doc-design-row"><div class="doc-design-field"><label for="documentDesignDiagramUsage">다이어그램 적용 범위</label><select id="documentDesignDiagramUsage" data-adjust-group="visualAssets" data-adjust-key="diagramUsage">${optionList(state.adjustments.visualAssets.diagramUsage, [["다이어그램을 사용하지 않음", "사용하지 않음"], ["관계·절차·구조를 설명할 때 사용", "관계·절차·구조"], ["장마다 핵심 개념을 시각화", "장별 핵심 개념"], ["복잡한 설명은 우선 다이어그램화", "설명 우선 시각화"]])}</select></div><div class="doc-design-field"><label for="documentDesignDiagramStyle">다이어그램 스타일</label><input id="documentDesignDiagramStyle" type="text" data-adjust-group="visualAssets" data-adjust-key="diagramStyle" value="${escapeHtml(state.adjustments.visualAssets.diagramStyle)}"></div></div>
                </div></details>
                <details class="doc-design-adjust-group"><summary>서체와 정보 위계</summary><div class="doc-design-adjust-body">
                  <div class="doc-design-row"><div class="doc-design-field"><label for="documentDesignFontPreset">글꼴 조합</label><select id="documentDesignFontPreset">${fontOptions()}</select></div><div class="doc-design-field"><label for="documentDesignDensity">정보 밀도</label><select id="documentDesignDensity"><option value="airy">여유롭게</option><option value="balanced">균형 있게</option><option value="compact">촘촘하게</option></select></div></div>
                  <div class="doc-design-row"><div class="doc-design-field"><label for="documentDesignHeadingFont">제목 글꼴</label><input id="documentDesignHeadingFont" type="text" value="${escapeHtml(state.adjustments.typography.headingFamily)}"></div><div class="doc-design-field"><label for="documentDesignBodyFont">본문 글꼴</label><input id="documentDesignBodyFont" type="text" value="${escapeHtml(state.adjustments.typography.bodyFamily)}"></div></div>
                  <div class="doc-design-row">${degreeSelect("documentDesignTitlePresence", "titlePresence", "제목 존재감")}${degreeSelect("documentDesignBodyScale", "bodyScale", "본문 크기감")}</div>
                  <div class="doc-design-row">${degreeSelect("documentDesignNotePresence", "notePresence", "주석 존재감")}${degreeSelect("documentDesignLineSpacing", "lineSpacing", "본문 행간")}</div>
                  <div class="doc-design-row">${degreeSelect("documentDesignHeadingEmphasis", "headingEmphasis", "제목 무게감")}${degreeSelect("documentDesignHierarchyDepth", "hierarchyDepth", "정보 위계 깊이")}</div>
                  <div class="doc-design-field"><label>타이포그래피 적용 범위</label><div class="doc-design-check-grid doc-design-scope-grid" id="documentDesignTypographyScope">${typographyScopeChecks()}</div><small>체크한 영역에 같은 서체 체계와 위계를 이어서 적용합니다.</small></div>
                  <div class="doc-design-field"><label for="documentDesignHierarchyMethod">위계 구분 방식</label><select id="documentDesignHierarchyMethod">${optionList(state.adjustments.hierarchy.method, [["크기·굵기·여백을 함께 사용", "크기·굵기·여백"], ["크기와 번호 체계를 중심으로 구분", "크기·번호 체계"], ["색상 블록과 위치를 중심으로 구분", "색상 블록·위치"], ["최소한의 굵기와 여백만 사용", "굵기·여백 최소형"]])}</select></div>
                  <div class="doc-design-row"><div class="doc-design-field"><label for="documentDesignHeadlineStyle">페이지 제목 방식</label><select id="documentDesignHeadlineStyle">${optionList(state.adjustments.hierarchy.headlineStyle, [["결론형 문장", "결론형 문장"], ["명사형 주제", "명사형 주제"], ["질문형 제목과 답변형 부제", "질문형 제목 + 답변형 부제"], ["단계 번호와 행동형 제목", "단계 번호 + 행동형 제목"]])}</select></div><div class="doc-design-field"><label for="documentDesignEmphasis">강조 방식</label><select id="documentDesignEmphasis">${optionList(state.adjustments.hierarchy.emphasis, [["강조색과 굵기", "강조색 + 굵기"], ["굵기와 크기만 사용", "굵기 + 크기"], ["옅은 색상 면과 왼쪽 선", "색상 면 + 왼쪽 선"], ["밑줄과 번호 표식", "밑줄 + 번호"]])}</select></div></div>
                </div></details>
                <details class="doc-design-adjust-group"><summary>레이아웃·여백·페이지 리듬</summary><div class="doc-design-adjust-body">
                  <div class="doc-design-field"><label for="documentDesignGrid">페이지 구조</label><input id="documentDesignGrid" type="text" value="${escapeHtml(state.adjustments.layout.grid)}"></div>
                  ${degreeSelect("documentDesignPageRhythm", "pageRhythm", "페이지 사이 리듬")}
                  <div class="doc-design-row">${degreeSelect("documentDesignPageWhitespace", "pageWhitespace", "페이지 여백감")}${degreeSelect("documentDesignMarginBalance", "marginBalance", "여백 배분")}</div>
                  <div class="doc-design-row">${degreeSelect("documentDesignParagraphRhythm", "paragraphRhythm", "문단 호흡")}${degreeSelect("documentDesignSectionSeparation", "sectionSeparation", "절 구분")}</div>
                  ${degreeSelect("documentDesignHeaderFooterBreathing", "headerFooterBreathing", "머리말·꼬리말 거리감")}
                  <div class="doc-design-field"><label>포함 요소</label><div class="doc-design-check-grid">${boolCheck("components", "cover", "표지")}${boolCheck("components", "toc", "목차")}${boolCheck("components", "sectionDividers", "간지")}${boolCheck("components", "pageNumber", "쪽번호")}${boolCheck("components", "table", "표")}${boolCheck("components", "chart", "차트")}</div></div>
                  <div class="doc-design-field"><label for="documentDesignImagePolicy">이미지 사용 규칙</label><select id="documentDesignImagePolicy"><option value="필요할 때만 근거 이미지 사용">필요할 때만 근거 이미지</option><option value="실제 화면 캡처와 근거 이미지를 우선 사용">실제 화면·근거 이미지 우선</option><option value="대표 이미지 한 장을 크게 사용">대표 이미지 한 장 중심</option><option value="이미지를 사용하지 않고 표와 도식으로 설명">이미지 없이 표·도식 중심</option></select></div>
                </div></details>
                <details class="doc-design-adjust-group"><summary>표 구성 규칙</summary><div class="doc-design-adjust-body">
                  <div class="doc-design-row"><div class="doc-design-field"><label for="documentDesignTableStyle">표 스타일</label><select id="documentDesignTableStyle">${optionList(state.adjustments.tableRules.style, [["얇은 가로선 중심", "얇은 가로선 중심"], ["머리행 색상 띠와 최소 선", "머리행 색상 띠"], ["행 줄무늬와 옅은 외곽선", "행 줄무늬"], ["재무표형 숫자 중심", "재무표형 숫자 중심"], ["비교 매트릭스형", "비교 매트릭스"]])}</select></div><div class="doc-design-field"><label for="documentDesignTableHeader">머리행 표현</label><select id="documentDesignTableHeader">${optionList(state.adjustments.tableRules.headerStyle, [["주색 배경과 반전 글자", "주색 배경 + 반전 글자"], ["옅은 주색 면과 진한 글자", "옅은 주색 면"], ["배경 없이 굵은 글자와 아래선", "굵은 글자 + 아래선"], ["강조색 위쪽 선과 흰 배경", "강조색 위쪽 선"]])}</select></div></div>
                  <div class="doc-design-row"><div class="doc-design-field"><label for="documentDesignTableBorder">선 규칙</label><select id="documentDesignTableBorder">${optionList(state.adjustments.tableRules.borderStyle, [["바깥선 없음·내부 가로선", "바깥선 없음·가로선"], ["얇은 전체 격자", "얇은 전체 격자"], ["머리행·합계행만 선 사용", "머리행·합계행만"], ["세로선 없이 행 그룹 구분", "행 그룹 구분"]])}</select></div><div class="doc-design-field"><label for="documentDesignTableNumeric">숫자 정렬</label><select id="documentDesignTableNumeric">${optionList(state.adjustments.tableRules.numericAlignment, [["오른쪽 정렬", "오른쪽 정렬"], ["소수점 기준 정렬", "소수점 기준 정렬"], ["가운데 정렬", "가운데 정렬"]])}</select></div></div>
                  <div class="doc-design-row">${degreeSelect("documentDesignTableInformationAmount", "tableInformationAmount", "표 정보량")}${degreeSelect("documentDesignCellBreathing", "cellBreathing", "셀 여백감")}</div>
                  <div class="doc-design-check-grid">${boolCheck("tableRules", "stripeRows", "행 줄무늬")}${boolCheck("tableRules", "repeatHeader", "페이지마다 머리행 반복")}${boolCheck("tableRules", "showUnits", "단위 표시")}${boolCheck("tableRules", "showSource", "출처 표시")}</div>
                </div></details>
                <details class="doc-design-adjust-group"><summary>그래프 구성 규칙</summary><div class="doc-design-adjust-body">
                  <div class="doc-design-row"><div class="doc-design-field"><label for="documentDesignChartType">우선 그래프</label><select id="documentDesignChartType">${optionList(state.adjustments.chartRules.preferredType, [["막대 차트", "막대 차트"], ["선 차트", "선 차트"], ["막대·선 복합 차트", "막대·선 복합"], ["누적 막대 차트", "누적 막대"], ["도넛 차트", "도넛 차트"], ["분산형 차트", "분산형"]])}</select></div><div class="doc-design-field"><label for="documentDesignChartColor">색상 배정</label><select id="documentDesignChartColor">${optionList(state.adjustments.chartRules.colorMode, [["주색 계열 + 강조색 1개", "주색 계열 + 강조 1개"], ["범주마다 구분되는 색상", "범주 구분 색상"], ["증감이 드러나는 발산 색상", "증감 발산 색상"], ["단색 명도 단계", "단색 명도 단계"]])}</select></div></div>
                  <div class="doc-design-row"><div class="doc-design-field"><label for="documentDesignChartLabels">값 레이블</label><select id="documentDesignChartLabels">${optionList(state.adjustments.chartRules.dataLabels, [["핵심 값만 직접 표시", "핵심 값만 표시"], ["모든 값 직접 표시", "모든 값 표시"], ["최댓값·최솟값만 표시", "최대·최소만 표시"], ["레이블 없이 축으로 읽기", "축으로 읽기"]])}</select></div><div class="doc-design-field"><label for="documentDesignChartLegend">범례 위치</label><select id="documentDesignChartLegend">${optionList(state.adjustments.chartRules.legend, [["상단", "상단"], ["오른쪽", "오른쪽"], ["그래프 안 직접 표기", "그래프 안 직접 표기"], ["범례 사용 안 함", "사용 안 함"]])}</select></div></div>
                  <div class="doc-design-row"><div class="doc-design-field"><label for="documentDesignChartGridlines">눈금선</label><select id="documentDesignChartGridlines">${optionList(state.adjustments.chartRules.gridlines, [["주요 가로선만", "주요 가로선만"], ["옅은 전체 가로선", "옅은 전체 가로선"], ["기준선 하나만", "기준선 하나만"], ["눈금선 사용 안 함", "사용 안 함"]])}</select></div><div class="doc-design-field"><label for="documentDesignChartSort">정렬 규칙</label><select id="documentDesignChartSort">${optionList(state.adjustments.chartRules.sortOrder, [["의미 있는 순서 또는 내림차순", "의미 순서·내림차순"], ["시간 순서", "시간 순서"], ["원문 순서 유지", "원문 순서 유지"], ["목표 대비 차이순", "목표 대비 차이순"]])}</select></div></div>
                  <div class="doc-design-check-grid">${boolCheck("chartRules", "zeroBaseline", "0 기준선 유지")}${boolCheck("chartRules", "showUnits", "단위 표시")}${boolCheck("chartRules", "showSource", "출처 표시")}<label class="doc-design-check"><input type="checkbox" disabled>3D 그래프 금지</label></div>
                </div></details>
                <details class="doc-design-adjust-group"><summary>출력 검수</summary><div class="doc-design-adjust-body"><div class="doc-design-check-grid">${Object.entries({ preserveFacts: "원문 사실·수치 보존", preserveContentStructure: "목차·문장 구조 보존", verifyPhysicalSpec: "판형·방향·도련 확인", preventOverflow: "넘침·잘림 방지", verifyPrint: "인쇄 결과 확인", accessibleContrast: "접근성 대비 확인", verifyPageSetConsistency: "6개 페이지 역할 일관성", verifyTableChartMetadata: "표·차트 단위·출처 확인", verifyFontAvailability: "글꼴 사용 가능 여부", verifyImageRights: "이미지 권리·출처 확인" }).map(([key, label]) => `<label class="doc-design-check"><input type="checkbox" data-quality-key="${key}"${state.quality[key] ? " checked" : ""}>${label}</label>`).join("")}</div></div></details>
              </div></div>
            </section>
          </div>
          <aside class="doc-design-result-stack" id="docDesignStep4" data-doc-step="4" tabindex="-1">
            <button id="documentDesignGenerateBtn" class="doc-design-hidden" type="button"></button><button id="documentDesignCopyBtn" class="doc-design-hidden" type="button"></button><button id="documentDesignSendCommonBtn" class="doc-design-hidden" type="button"></button><button id="documentDesignDownloadBtn" class="doc-design-hidden" type="button"></button><button id="documentDesignSampleBtn" class="doc-design-hidden" type="button"></button><button id="documentDesignResetBtn" class="doc-design-hidden" type="button"></button>
            <div class="doc-design-summary"><div><span>현재 선택</span><strong id="documentDesignSummaryTitle"></strong><span id="documentDesignSummaryMeta"></span></div><div class="doc-design-swatches" id="documentDesignSwatches" aria-label="선택 색상"></div></div>
            <section class="doc-design-card" aria-labelledby="docDesignPreviewTitle"><div class="doc-design-preview-panel"><div class="doc-design-preview-top"><div><strong id="docDesignPreviewTitle">테마 6면 미리보기</strong><small>실제 테마 이미지를 잘리지 않게 확인하세요.</small></div><div class="doc-design-view-tabs" id="documentDesignViewTabs" role="group" aria-label="실시간 미리보기 종류">${pageViewTabs()}</div></div><div class="doc-design-live-stage"><div class="doc-design-page" id="documentDesignLivePreview"></div></div></div></section>
            <section class="doc-design-card doc-design-output-card" aria-labelledby="docDesignOutputTitle"><div class="doc-design-card-head"><div><span class="doc-design-step-label">4 · 결과·검수</span><h3 id="docDesignOutputTitle">시각 편집 실행 프롬프트</h3><p>원문 뒤에 디자인·제작·검수 지침만 추가됩니다.</p></div></div><div class="doc-design-card-body"><div class="doc-design-visual-only"><strong>내용 보존</strong><span>목차·문장·사실·수치·고유명사는 변경하지 않음</span></div><div class="doc-design-status" id="documentDesignStatus" aria-live="polite">설정을 확인한 뒤 디자인 지침을 생성하세요.</div><textarea class="doc-design-output" id="documentDesignOutput" readonly placeholder="생성된 전체 프롬프트가 여기에 표시됩니다."></textarea><div class="doc-design-result-meta"><span id="documentDesignResultCount">0자</span><span id="documentDesignResultState">생성 전</span></div><div class="doc-design-inline-actions"><button type="button" class="doc-design-btn primary" data-inline-action="generate">디자인 지침 생성</button><button type="button" class="doc-design-btn" data-inline-action="copy">전체 프롬프트 복사</button><button type="button" class="doc-design-btn" data-inline-action="copy-design">디자인 지침만 복사</button></div></div></section>
          </aside>
        </div>
        <div class="doc-design-mobile-bar" aria-label="문서 디자인 단계 이동">
          <button type="button" class="doc-design-mobile-back" data-mobile-action="back">이전</button>
          <div><span id="documentDesignMobileStepCount">1 / 4</span><strong id="documentDesignMobileStepLabel">유형·규격</strong></div>
          <button type="button" class="doc-design-mobile-next" data-mobile-action="next">테마 고르기</button>
        </div>
      </div>`;
    syncControls();
    renderThemeGrid();
    renderPreview();
    syncSummary();
    syncMobileFlow();
  }

  function applyTheme(themeId) {
    const preserved = {
      sourcePrompt: state.sourcePrompt,
      documentKind: state.documentKind,
      publicationTypeId: publicationTypeId(),
      publicationType: publicationTypeId(),
      visualGrammarId: visualGrammarId(),
      formats: state.formats.slice(),
      pageSpec: clone(state.pageSpec),
      productionSpec: clone(state.productionSpec),
      previewView: state.previewView,
      pageRole: state.previewView,
      quality: clone(state.quality),
    };
    state = ensureUiState(CONTRACT.normalize({ ...preserved, themeId }));
    markDirty(`${getTheme(themeId).nameKo} 테마를 적용했습니다.`);
    syncControls();
    renderThemeGrid();
    renderPreview();
    syncSummary();
    window.requestAnimationFrame(() => centerSelectedTheme("smooth"));
  }

  function syncControls() {
    const setValue = (id, value) => { const el = document.getElementById(id); if (el) el.value = value; };
    setValue("documentDesignSource", state.sourcePrompt);
    setValue("documentDesignKind", publicationTypeId());
    setValue("documentDesignPageSize", state.pageSpec.sizeId);
    setValue("documentDesignMedium", state.productionSpec.mediumId);
    setValue("documentDesignBinding", state.productionSpec.bindingId);
    setValue("documentDesignDuplex", state.productionSpec.duplex);
    setValue("documentDesignSpread", state.productionSpec.spreadMode);
    setValue("documentDesignBleed", bleedSelection());
    setValue("documentDesignDensity", state.adjustments.layout.density);
    setValue("documentDesignFontPreset", state.adjustments.typography.fontPreset);
    setValue("documentDesignHeadingFont", state.adjustments.typography.headingFamily);
    setValue("documentDesignBodyFont", state.adjustments.typography.bodyFamily);
    setValue("documentDesignHierarchyMethod", state.adjustments.hierarchy.method);
    setValue("documentDesignHeadlineStyle", state.adjustments.hierarchy.headlineStyle);
    setValue("documentDesignEmphasis", state.adjustments.hierarchy.emphasis);
    setValue("documentDesignGrid", state.adjustments.layout.grid);
    setValue("documentDesignTableStyle", state.adjustments.tableRules.style);
    setValue("documentDesignTableHeader", state.adjustments.tableRules.headerStyle);
    setValue("documentDesignTableBorder", state.adjustments.tableRules.borderStyle);
    setValue("documentDesignTableNumeric", state.adjustments.tableRules.numericAlignment);
    setValue("documentDesignChartType", state.adjustments.chartRules.preferredType);
    setValue("documentDesignChartColor", state.adjustments.chartRules.colorMode);
    setValue("documentDesignChartLabels", state.adjustments.chartRules.dataLabels);
    setValue("documentDesignChartLegend", state.adjustments.chartRules.legend);
    setValue("documentDesignChartGridlines", state.adjustments.chartRules.gridlines);
    setValue("documentDesignChartSort", state.adjustments.chartRules.sortOrder);
    setValue("documentDesignImagePolicy", state.adjustments.components.images);
    setValue("documentDesignBackgroundUsage", state.adjustments.visualAssets.backgroundUsage);
    setValue("documentDesignBackgroundStyle", state.adjustments.visualAssets.backgroundStyle);
    setValue("documentDesignIconUsage", state.adjustments.visualAssets.iconUsage);
    setValue("documentDesignIconStyle", state.adjustments.visualAssets.iconStyle);
    setValue("documentDesignPictogramUsage", state.adjustments.visualAssets.pictogramUsage);
    setValue("documentDesignPictogramStyle", state.adjustments.visualAssets.pictogramStyle);
    setValue("documentDesignDiagramUsage", state.adjustments.visualAssets.diagramUsage);
    setValue("documentDesignDiagramStyle", state.adjustments.visualAssets.diagramStyle);
    root.querySelectorAll("[data-degree-key]").forEach((input) => {
      const value = state.adjustments.creativeDegrees[input.dataset.degreeKey];
      if (input.type === "radio") input.checked = input.value === value;
      else input.value = value;
    });
    const sourceCount = document.getElementById("documentDesignSourceCount");
    if (sourceCount) { sourceCount.textContent = `${state.sourcePrompt.length.toLocaleString("ko-KR")}자 · 입력 내용은 임의로 고치지 않습니다.`; sourceCount.classList.remove("error"); }
    document.querySelectorAll('[name="documentDesignFormat"]').forEach((input) => { input.checked = state.formats.includes(input.value); });
    document.querySelectorAll('[name="documentDesignOrientation"]').forEach((input) => { input.checked = input.value === state.pageSpec.orientation; });
    document.querySelectorAll("[data-adjust-group][data-adjust-key]").forEach((input) => {
      const value = state.adjustments[input.dataset.adjustGroup]?.[input.dataset.adjustKey];
      if (input.type === "checkbox") input.checked = Boolean(value); else input.value = value;
    });
    document.querySelectorAll("[data-quality-key]").forEach((input) => { input.checked = Boolean(state.quality[input.dataset.qualityKey]); });
    document.querySelectorAll("[data-typography-scope]").forEach((input) => { const value = state.adjustments.typographyScope[input.dataset.typographyScope]; input.checked = value !== "적용하지 않음" && value !== false; });
    renderTypePicker();
  }

  function renderTypePicker() {
    const chips = document.getElementById("documentDesignGrammarChips");
    const grid = document.getElementById("documentDesignTypeGrid");
    const summary = document.getElementById("documentDesignGrammarSummary");
    const recommendation = document.getElementById("documentDesignRecommendation");
    const viewTabs = document.getElementById("documentDesignViewTabs");
    const grammar = getVisualGrammar();
    const type = getPublicationType();
    if (chips) chips.innerHTML = visualGrammarChips();
    if (grid) grid.innerHTML = publicationTypeCards();
    if (summary) summary.textContent = grammar?.label || "";
    if (recommendation) recommendation.innerHTML = `<span>${escapeHtml(grammar?.label || "선택 유형")}</span><strong>${escapeHtml(type?.label || "문서")}에 맞는 테마를 먼저 보여드립니다.</strong>`;
    if (viewTabs) viewTabs.innerHTML = pageViewTabs();
  }

  function renderThemeGrid() {
    const grid = document.getElementById("documentDesignThemeGrid");
    if (grid) grid.innerHTML = themeCards();
    document.querySelectorAll("[data-theme-category]").forEach((button) => { const active = button.dataset.themeCategory === activeCategory; button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active)); });
    syncThemeNavigator();
    renderThemeProfile();
  }

  function previewMarkup(view) {
    const theme = getTheme(state.themeId);
    const page = pageArchetypes().find((item) => item.id === view) || pageArchetypes()[0];
    const grammar = getVisualGrammar();
    const label = page.id === "special" ? (grammar?.specialPageLabel || page.label) : page.label;
    const rule = state.adjustments.pageRules?.[page.id]?.rule || grammar?.[`${page.id}Rule`] || `${label}에도 선택한 색상·서체·여백 체계를 일관되게 적용합니다.`;
    return `<figure class="doc-design-rendered-preview"><img src="${escapeHtml(pagePreviews(theme)[page.id])}" alt="${escapeHtml(theme.nameKo)} ${escapeHtml(label)} 테마 미리보기" width="960" height="540"><figcaption><span>${escapeHtml(label)}</span><p>${escapeHtml(rule)}</p></figcaption></figure>`;
  }

  function previewDegree(key, fallback) {
    return DEGREE_PREVIEW[key]?.[state.adjustments.creativeDegrees[key]] ?? fallback;
  }

  function renderPreview() {
    const theme = getTheme(state.themeId);
    const preview = document.getElementById("documentDesignLivePreview");
    if (!preview) return;
    const c = state.adjustments.colors;
    const t = state.adjustments.typography;
    const pageSize = CATALOG.pageSizes.find((item) => item.id === state.pageSpec.sizeId) || CATALOG.pageSizes[0];
    const landscape = state.pageSpec.orientation === "landscape";
    const pageWidth = landscape ? pageSize.heightMm : pageSize.widthMm;
    const pageHeight = landscape ? pageSize.widthMm : pageSize.heightMm;
    preview.style.cssText = `--doc-primary:${c.primary};--doc-secondary:${c.secondary};--doc-accent:${c.accent};--doc-background:${c.background};--doc-surface:${c.surface};--doc-text:${c.text};--doc-muted:${c.muted};--doc-border:${c.border};--doc-heading-font:${JSON.stringify(t.headingFamily)};--doc-body-font:${JSON.stringify(t.bodyFamily)};--doc-heading-weight:${previewDegree("headingEmphasis", 760)};--doc-line-height:${previewDegree("lineSpacing", 1.7)};--doc-margin:${previewDegree("pageWhitespace", 18)};--doc-title-scale:${previewDegree("titlePresence", 1.14)};--doc-body-scale:${previewDegree("bodyScale", 1.08)};--doc-cell-space:${previewDegree("cellBreathing", 1)};--doc-page-width:${pageWidth};--doc-page-height:${pageHeight}`;
    preview.classList.toggle("portrait", !landscape);
    preview.classList.toggle("dark", isDark(c.background));
    preview.innerHTML = previewMarkup(state.previewView);
    document.querySelectorAll("[data-live-view]").forEach((button) => { const active = button.dataset.liveView === state.previewView; button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active)); });
    const stage = preview.parentElement;
    if (stage) stage.style.background = isDark(c.background) ? "#020817" : "#dce3ea";
    syncSummary(theme);
  }

  function isDark(hex) {
    const raw = String(hex || "#ffffff").replace("#", "");
    const value = raw.length === 3 ? raw.split("").map((x) => x + x).join("") : raw;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) || 0);
    return (r * 299 + g * 587 + b * 114) / 1000 < 130;
  }

  function syncSummary(theme = getTheme(state.themeId)) {
    const kind = getPublicationType();
    const grammar = getVisualGrammar();
    const title = document.getElementById("documentDesignSummaryTitle");
    const meta = document.getElementById("documentDesignSummaryMeta");
    const swatches = document.getElementById("documentDesignSwatches");
    const mobileTheme = document.getElementById("documentDesignMobileTheme");
    const pageSize = CATALOG.pageSizes.find((item) => item.id === state.pageSpec.sizeId) || CATALOG.pageSizes[0];
    const orientation = CATALOG.pageOrientations.find((item) => item.id === state.pageSpec.orientation) || CATALOG.pageOrientations[0];
    const paperSummary = document.getElementById("documentDesignPaperSummary");
    const pageWidth = orientation.id === "landscape" ? pageSize.heightMm : pageSize.widthMm;
    const pageHeight = orientation.id === "landscape" ? pageSize.widthMm : pageSize.heightMm;
    if (title) title.textContent = `${theme.nameKo} · ${kind?.label || "문서"}`;
    if (meta) meta.textContent = `${grammar?.label || "시각 문법"} · ${pageSize.label} ${orientation.label} · ${state.formats.join(" + ")} · 여백 ${state.adjustments.creativeDegrees.pageWhitespace} · 리듬 ${state.adjustments.creativeDegrees.pageRhythm}`;
    if (paperSummary) paperSummary.textContent = `${pageSize.label} · ${orientation.label} · ${pageWidth}×${pageHeight}mm · 도련 ${state.productionSpec.bleedMm}mm`;
    if (swatches) swatches.innerHTML = ["primary", "secondary", "accent", "background"].map((key) => `<i style="background:${escapeHtml(state.adjustments.colors[key])}" title="${colorLabels[key]}"></i>`).join("");
    if (mobileTheme) mobileTheme.textContent = `${theme.nameKo} · ${kind?.label || "문서"}`;
  }

  function syncResultMeta() {
    const output = document.getElementById("documentDesignOutput");
    const count = document.getElementById("documentDesignResultCount");
    const status = document.getElementById("documentDesignResultState");
    if (count) count.textContent = `${(output?.value.length || 0).toLocaleString("ko-KR")}자`;
    if (status) status.textContent = generated.generatedAt ? (dirty ? "설정 변경됨" : "최신 상태") : "생성 전";
  }

  function generate(showStatus = true) {
    const result = CONTRACT.build(state);
    const error = result.issues.find((item) => item.level === "error");
    if (error) {
      setStatus(error.message, true);
      if (window.matchMedia("(max-width: 720px)").matches && error.field === "sourcePrompt") setMobileStep(1);
      const errorTarget = document.getElementById(error.field === "sourcePrompt" ? "documentDesignSource" : "documentDesignOutput");
      const sourceCount = document.getElementById("documentDesignSourceCount");
      if (error.field === "sourcePrompt" && sourceCount) {
        sourceCount.textContent = error.message;
        sourceCount.classList.add("error");
      }
      window.requestAnimationFrame(() => errorTarget?.focus());
      return null;
    }
    generated = { designPrompt: result.designPrompt, fullPrompt: result.fullPrompt, spec: result.spec, generatedAt: new Date().toISOString() };
    dirty = false;
    const output = document.getElementById("documentDesignOutput");
    if (output) output.value = generated.fullPrompt;
    if (showStatus) setStatus("원문 뒤에 문서 디자인·출력 지침을 추가했습니다.");
    syncResultMeta();
    syncMobileFlow();
    return generated;
  }

  async function copyText(text, success) {
    if (!text) return;
    try { await navigator.clipboard.writeText(text); setStatus(success); }
    catch (_) { const output = document.getElementById("documentDesignOutput"); output?.focus(); output?.select(); setStatus("문구를 선택했습니다. Ctrl+C로 복사해주세요."); }
  }
  async function copyFull() {
    const value = dirty || !generated.fullPrompt ? generate(false) : generated;
    if (value) await copyText(value.fullPrompt, "전체 실행 프롬프트를 복사했습니다.");
  }
  async function copyDesign() {
    const value = dirty || !generated.designPrompt ? generate(false) : generated;
    if (value) await copyText(value.designPrompt, "문서 디자인 지침만 복사했습니다.");
  }
  async function sendToCommon() {
    const value = dirty || !generated.fullPrompt ? generate(false) : generated;
    if (!value) return;
    try { localStorage.setItem(TRANSFER_KEY, JSON.stringify({ text: value.fullPrompt, spec: value.spec, createdAt: new Date().toISOString() })); } catch (_) {}
    await copyText(value.fullPrompt, "공통 프롬프트 화면으로 전달하고 클립보드에도 복사했습니다.");
    window.PromptDeckCommonPrompt?.receiveDocumentDesign?.({ text: value.fullPrompt, spec: value.spec });
    window.PromptDeckTabs?.switchTab?.("commonPrompt");
  }
  function downloadJson() {
    const value = dirty || !generated.spec ? generate(false) : generated;
    if (!value) return;
    const blob = new Blob([JSON.stringify({ sourcePrompt: state.sourcePrompt, designSpec: value.spec, designPrompt: value.designPrompt }, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `promptdeck-document-design-${state.themeId}.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("DocumentDesignSpec JSON을 저장했습니다.");
  }

  function sample() {
    state.sourcePrompt = "2026년 지역기업 지원사업 결과보고서를 A4 10쪽 이내로 작성해줘. 사업 개요, 핵심 성과, 참여기업 사례, 예산 집행 현황, 개선사항과 후속 계획을 포함하고 모든 수치에는 기준일과 출처를 표시해줘.";
    const sampleType = publicationTypes().find((item) => item.id === "business-report") || publicationTypes()[0];
    state.documentKind = "business-report";
    state.publicationTypeId = sampleType.id;
    state.publicationType = sampleType.id;
    state.visualGrammarId = sampleType.grammarId;
    state.formats = ["DOCX", "HWPX", "PDF"];
    activeCategory = "recommended";
    applyTheme("public-brief");
    syncControls();
    renderThemeGrid();
    renderPreview();
    syncSummary();
    markDirty("작성 예시와 공공 정책 브리프 테마를 적용했습니다.");
    document.getElementById("documentDesignSource")?.focus();
  }
  function reset() {
    state = defaultState(); generated = { designPrompt: "", fullPrompt: "", spec: null, generatedAt: "" }; dirty = true; activeCategory = "recommended";
    mobileStep = 1;
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    syncControls();
    renderThemeGrid();
    renderPreview();
    syncSummary();
    const output = document.getElementById("documentDesignOutput");
    if (output) output.value = "";
    syncResultMeta();
    syncMobileFlow();
    setStatus("문서 디자인 설정을 초기화했습니다.");
    window.PromptDeckTabs?.syncHeaderActionStates?.();
  }

  function updateTypography(key, value) { state.adjustments.typography[key] = value; markDirty(); renderPreview(); }
  function applyPublicationType(typeId) {
    const type = publicationTypes().find((item) => item.id === typeId);
    if (!type) return;
    state.publicationTypeId = type.id;
    state.publicationType = type.id;
    state.documentKind = type.id;
    state.visualGrammarId = type.grammarId || state.visualGrammarId;
    activeCategory = "recommended";
    const themes = recommendedThemes();
    renderTypePicker();
    const theme = themes.find((item) => item.id === state.themeId) || themes[0] || getTheme(state.themeId);
    applyTheme(theme.id);
    setStatus(`${type.label} 유형과 ${theme.nameKo} 테마를 적용했습니다.`);
    setValueIfPresent("documentDesignKind", type.id);
  }

  function applyVisualGrammar(grammarId) {
    const type = publicationTypes().find((item) => item.grammarId === grammarId);
    if (type) return applyPublicationType(type.id);
    state.visualGrammarId = grammarId;
    activeCategory = "recommended";
    markDirty("시각 문법을 변경했습니다.");
    renderTypePicker();
    renderThemeGrid();
    renderPreview();
    syncSummary();
  }

  function setValueIfPresent(id, value) {
    const control = document.getElementById(id);
    if (control) control.value = value;
  }

  function bindEvents() {
    root.addEventListener("input", (event) => {
      const target = event.target;
      if (target.id === "documentDesignSource") {
        state.sourcePrompt = target.value;
        const count = document.getElementById("documentDesignSourceCount"); if (count) { count.textContent = `${target.value.length.toLocaleString("ko-KR")}자 · 입력 내용은 임의로 고치지 않습니다.`; count.classList.remove("error"); }
        markDirty(); return;
      }
      if (target.matches("[data-degree-key]")) {
        state.adjustments.creativeDegrees[target.dataset.degreeKey] = target.value;
        root.querySelectorAll(`[data-degree-key="${target.dataset.degreeKey}"]`).forEach((control) => {
          if (control.type === "radio") control.checked = control.value === target.value;
          else control.value = target.value;
        });
        markDirty("느낌의 정도를 반영했습니다.");
        syncSummary();
        renderPreview();
        return;
      }
      if (target.matches("[data-adjust-group][data-adjust-key]")) {
        const group = target.dataset.adjustGroup; const key = target.dataset.adjustKey;
        state.adjustments[group][key] = target.type === "checkbox" ? target.checked : target.value;
        markDirty(); renderPreview(); return;
      }
      if (target.matches("[data-quality-key]")) { state.quality[target.dataset.qualityKey] = target.checked; markDirty(); return; }
      if (target.matches("[data-typography-scope]")) { const key = target.dataset.typographyScope; state.adjustments.typographyScope[key] = target.checked ? TYPOGRAPHY_SCOPE[key][1] : "적용하지 않음"; markDirty("타이포그래피 적용 범위를 반영했습니다."); return; }
      if (target.id === "documentDesignHeadingFont") return updateTypography("headingFamily", target.value);
      if (target.id === "documentDesignBodyFont") return updateTypography("bodyFamily", target.value);
      if (target.id === "documentDesignGrid") { state.adjustments.layout.grid = target.value; markDirty(); return renderPreview(); }
    });

    root.addEventListener("change", (event) => {
      const target = event.target;
      if (target.matches("[data-degree-key]")) {
        state.adjustments.creativeDegrees[target.dataset.degreeKey] = target.value;
        root.querySelectorAll(`[data-degree-key="${target.dataset.degreeKey}"]`).forEach((control) => { if (control.type === "radio") control.checked = control.value === target.value; else control.value = target.value; });
        markDirty("느낌의 정도를 반영했습니다."); syncSummary(); renderPreview(); return;
      }
      if (target.id === "documentDesignKind") return applyPublicationType(target.value);
      if (target.name === "documentDesignFormat") { state.formats = [...root.querySelectorAll('[name="documentDesignFormat"]:checked')].map((item) => item.value); markDirty(); syncSummary(); }
      if (target.id === "documentDesignPageSize") { state.pageSpec.sizeId = target.value; markDirty("문서 크기를 반영했습니다."); syncSummary(); renderPreview(); }
      if (target.name === "documentDesignOrientation") { state.pageSpec.orientation = target.value; markDirty("문서 방향을 반영했습니다."); syncSummary(); renderPreview(); }
      if (target.id === "documentDesignMedium") { state.productionSpec.mediumId = target.value; markDirty("사용 매체를 반영했습니다."); syncSummary(); }
      if (target.id === "documentDesignBinding") { state.productionSpec.bindingId = target.value; markDirty("제본 방향을 반영했습니다."); syncSummary(); }
      if (target.id === "documentDesignDuplex") { state.productionSpec.duplex = target.value; state.productionSpec.duplexMode = target.value; markDirty("면 구성을 반영했습니다."); syncSummary(); }
      if (target.id === "documentDesignSpread") { state.productionSpec.spreadMode = target.value; markDirty("페이지 보기 방식을 반영했습니다."); syncSummary(); }
      if (target.id === "documentDesignBleed") {
        const item = (productionOptions().bleeds || []).find((candidate) => optionId(candidate) === target.value);
        const raw = item?.mm ?? item?.value ?? target.value;
        state.productionSpec.bleedMm = Number(String(raw).replace(/[^\d.]/g, "")) || 0;
        markDirty("재단 도련을 반영했습니다."); syncSummary();
      }
      if (target.id === "documentDesignDensity") { state.adjustments.layout.density = target.value; markDirty(); syncSummary(); }
      if (target.id === "documentDesignFontPreset") {
        const preset = CATALOG.fontPresets[target.value]; state.adjustments.typography.fontPreset = target.value; state.adjustments.typography.headingFamily = preset.heading; state.adjustments.typography.bodyFamily = preset.body; state.adjustments.typography.fallback = preset.fallback; markDirty(); syncControls(); renderPreview();
      }
      if (target.id === "documentDesignImagePolicy") { state.adjustments.components.images = target.value; markDirty(); }
      const selectAdjustments = {
        documentDesignHierarchyMethod: ["hierarchy", "method"], documentDesignHeadlineStyle: ["hierarchy", "headlineStyle"], documentDesignEmphasis: ["hierarchy", "emphasis"],
        documentDesignTableStyle: ["tableRules", "style"], documentDesignTableHeader: ["tableRules", "headerStyle"], documentDesignTableBorder: ["tableRules", "borderStyle"], documentDesignTableNumeric: ["tableRules", "numericAlignment"],
        documentDesignChartType: ["chartRules", "preferredType"], documentDesignChartColor: ["chartRules", "colorMode"], documentDesignChartLabels: ["chartRules", "dataLabels"], documentDesignChartLegend: ["chartRules", "legend"], documentDesignChartGridlines: ["chartRules", "gridlines"], documentDesignChartSort: ["chartRules", "sortOrder"],
      };
      if (selectAdjustments[target.id]) { const [group, key] = selectAdjustments[target.id]; state.adjustments[group][key] = target.value; markDirty(); renderPreview(); }
    });

    root.addEventListener("click", (event) => {
      const mobileStepButton = event.target.closest("button[data-mobile-step]"); if (mobileStepButton) return setMobileStep(mobileStepButton.dataset.mobileStep);
      const mobileAction = event.target.closest("[data-mobile-action]")?.dataset.mobileAction;
      if (mobileAction === "back") return setMobileStep(mobileStep - 1);
      if (mobileAction === "next") return handleMobilePrimary();
      const themeNav = event.target.closest("[data-theme-nav]")?.dataset.themeNav;
      if (themeNav === "previous") return moveThemeSelection(-1);
      if (themeNav === "next") return moveThemeSelection(1);
      const grammarButton = event.target.closest("[data-visual-grammar]"); if (grammarButton) return applyVisualGrammar(grammarButton.dataset.visualGrammar);
      const typeButton = event.target.closest("[data-publication-type]"); if (typeButton) return applyPublicationType(typeButton.dataset.publicationType);
      const themeButton = event.target.closest("[data-theme-id]"); if (themeButton) return applyTheme(themeButton.dataset.themeId);
      const categoryButton = event.target.closest("[data-theme-category]"); if (categoryButton) {
        activeCategory = categoryButton.dataset.themeCategory;
        const themes = visibleThemes();
        if (!themes.some((theme) => theme.id === state.themeId) && themes[0]) return applyTheme(themes[0].id);
        renderThemeGrid();
        window.requestAnimationFrame(() => centerSelectedTheme("smooth"));
        return;
      }
      const liveView = event.target.closest("[data-live-view]"); if (liveView) { state.previewView = liveView.dataset.liveView; state.pageRole = state.previewView; saveState(); renderPreview(); return; }
      const action = event.target.closest("[data-inline-action]")?.dataset.inlineAction;
      if (action === "generate") generate();
      if (action === "copy") copyFull();
      if (action === "copy-design") copyDesign();
      if (action === "sample") sample();
      if (event.target.closest("#documentDesignRestoreThemeBtn")) applyTheme(state.themeId);
    });
    root.querySelectorAll(".doc-design-adjust-group").forEach((details) => details.addEventListener("toggle", () => {
      if (!details.open || !window.matchMedia("(max-width: 720px)").matches) return;
      root.querySelectorAll(".doc-design-adjust-group[open]").forEach((item) => { if (item !== details) item.open = false; });
    }));
    document.getElementById("documentDesignGenerateBtn")?.addEventListener("click", () => generate());
    document.getElementById("documentDesignCopyBtn")?.addEventListener("click", copyFull);
    document.getElementById("documentDesignSendCommonBtn")?.addEventListener("click", sendToCommon);
    document.getElementById("documentDesignDownloadBtn")?.addEventListener("click", downloadJson);
    document.getElementById("documentDesignSampleBtn")?.addEventListener("click", sample);
    document.getElementById("documentDesignResetBtn")?.addEventListener("click", reset);
  }

  renderShell();
  bindEvents();
  window.PromptDeckDocumentDesign = Object.freeze({ getState: () => clone(state), build: () => CONTRACT.build(state), generate, applyTheme });
})();
