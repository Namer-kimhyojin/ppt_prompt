(function () {
  "use strict";
  const root = document.getElementById("pptxPromptApp"), pane = document.getElementById("panePptxPrompt");
  const catalog = window.PromptDeckSlideStyleCatalog, contract = window.PromptDeckPptxPromptContract;
  if (!root || !pane) return;
  if (!catalog || !contract) { root.textContent = "스타일 갤러리를 불러오지 못했습니다. 페이지를 새로고침해 주세요."; return; }
  const KEY = "promptdeck.pptxPrompt.v1";
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const clone = (value) => JSON.parse(JSON.stringify(value));
  let state = contract.defaults(), storageNotice = "", undoState = null;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed || parsed.version !== 1) throw new Error("unsupported-state");
      state = contract.normalize(parsed);
    }
  } catch (_) { storageNotice = "저장한 설정을 불러오지 못해 기본 스타일을 표시합니다."; }
  let category = "recommended", query = "", visible = 12, activated = false;
  const options = (items) => Object.entries(items).map(([id, label]) => `<option value="${esc(id)}">${esc(label)}</option>`).join("");
  root.className = "pp-workspace";
  root.dataset.view = "gallery";
  root.innerHTML = `
    <header class="pp-header"><div><span class="pp-eyebrow">STYLE TO POWERPOINT</span><h2>스타일을 골라, 발표자료로.</h2><p>마음에 드는 디자인을 고르면 편집 가능한 PPTX 제작 요청문이 완성됩니다.</p></div><span class="pp-file-badge">.PPTX<span>제작 요청용</span></span></header>
    <div class="pp-mobile-switch" role="group" aria-label="PPTX 제작 요청문 작업 화면"><button type="button" data-pp-view="gallery" aria-pressed="true">1 · 스타일 선택</button><button type="button" data-pp-view="result" aria-pressed="false">2 · 제작·복사</button></div>
    <div class="pp-workspace-grid">
      <section class="pp-gallery" aria-labelledby="ppGalleryHeading">
        <div class="pp-section-title"><div><span class="pp-step">01 / STYLE LIBRARY</span><h3 id="ppGalleryHeading">어떤 느낌으로 만들까요?</h3></div><span class="pp-total">${catalog.styles.length}개 스타일</span></div>
        <div class="pp-search-row"><label class="pp-field pp-search">스타일 검색<input id="ppSearch" type="search" placeholder="예: 제안서, 미니멀, 기술" autocomplete="off"></label><label class="pp-field">분야<select id="ppCategory"><option value="recommended">추천 스타일</option><option value="all">전체 스타일</option>${options(Object.fromEntries(catalog.categories.map((item) => [item.id, item.label])))}</select></label></div>
        <div class="pp-gallery-meta"><span id="ppMatchCount" role="status"></span><button type="button" class="pp-text-button" id="ppImportStyle">슬라이드 디자인 설정의 스타일·색상 가져오기</button></div>
        <div id="ppStyleGrid" class="pp-style-grid" role="group" aria-label="발표자료 스타일"></div>
        <button type="button" id="ppLoadMore" class="pp-button pp-load-more">스타일 더 보기</button>
        <p class="pp-help pp-gallery-note">견본 속 내용은 예시입니다. 선택한 스타일은 실제 발표 내용에 맞춰 적용됩니다.</p>
      </section>
      <section class="pp-result-stack" aria-label="PPTX 제작 조건과 요청문">
        <div class="pp-result-content">
          <div class="pp-section-title"><div><span class="pp-step">02 / YOUR PRESENTATION</span><h3>이 스타일로 제작하기</h3></div><button type="button" class="pp-text-button" id="ppChooseStyle">스타일 다시 고르기</button></div>
          <figure class="pp-selected-figure"><div id="ppSelectedImage" class="pp-selected-image"></div><figcaption><div><strong id="ppSelectedName"></strong><span id="ppSelectedEnglish"></span></div><span class="pp-preview-label">스타일 견본</span></figcaption></figure>
          <p id="ppSelectedDescription" class="pp-help"></p>
          <details class="pp-style-details"><summary>스타일 특징과 색상 조정</summary><ul id="ppStyleTraits"></ul><div id="ppPalette" class="pp-palette"></div><div class="pp-palette-footer"><span id="ppPaletteNote" class="pp-help">견본 원본 색상</span><button type="button" id="ppResetColors" class="pp-text-button">원래 색상</button></div></details>
          <div class="pp-settings" id="ppSettings">
            <div class="pp-section-title pp-compact"><h3>제작 조건</h3><span class="pp-help">내용은 나중에 첨부해도 돼요</span></div>
            <div class="pp-field-grid"><label class="pp-field">화면 규격<select id="ppRatio" data-pp-field="ratio"><option value="16:9">16:9 와이드</option><option value="4:3">4:3 표준</option><option value="A4">A4 가로</option></select></label><label class="pp-field">슬라이드 수<input id="ppSlideCount" data-pp-field="slideCount" type="number" min="1" max="80" step="1" placeholder="자동" aria-describedby="ppCountHelp"></label><label class="pp-field">발표 목적<select id="ppPurpose" data-pp-field="purpose">${options(contract.purposes)}</select></label><label class="pp-field">발표자료 언어<select id="ppLanguage" data-pp-field="language">${options(contract.languages)}</select></label></div>
            <p class="pp-help" id="ppCountHelp">장수는 표지·마무리를 포함해 1~80장. 비워 두면 자료에 맞춰 정합니다.</p>
            <label class="pp-check"><input type="checkbox" id="ppNotes" data-pp-field="notes">발표자 노트 포함</label>
            <details class="pp-content-details"><summary>발표 내용 추가 <span>선택 사항</span></summary><div class="pp-content-fields"><label class="pp-field">주제·제목<input id="ppTitle" data-pp-field="title" placeholder="예: 지역기업 지원사업 성과 보고"></label><label class="pp-field">발표 대상<input id="ppAudience" data-pp-field="audience" placeholder="예: 기관장·사업 담당자"></label><label class="pp-field">원문·목차·핵심 내용<textarea id="ppSource" data-pp-field="sourceText" rows="7" placeholder="발표에 사용할 내용을 붙여넣으세요. 자료를 제작 AI에 직접 첨부할 예정이라면 비워 두세요."></textarea></label><label class="pp-field">추가 요구사항<textarea id="ppRequirements" data-pp-field="requirements" rows="3" placeholder="예: 마지막 장에 후속 일정 정리, 기관 로고 사용"></textarea></label></div></details>
          </div>
          <div class="pp-output-section" id="ppOutputSection"><div class="pp-section-title pp-compact"><h3>PPTX 제작 요청문</h3><span id="ppPromptCount" class="pp-help"></span></div><p class="pp-help">복사한 요청문과 원본 자료를 PPTX 파일을 만들 수 있는 AI에 전달하세요.</p><p class="pp-error" id="ppError" role="alert" hidden></p><textarea id="ppOutput" class="pp-output" rows="12" readonly aria-label="PPTX 제작 요청문" spellcheck="false"></textarea><div class="pp-inline-actions"><button type="button" id="pptxPromptGenerateBtn" class="pp-button">요청문 보기</button><button type="button" id="pptxPromptCopyBtn" class="pp-button pp-primary">요청문 복사</button><button type="button" id="pptxPromptDownloadBtn" class="pp-button">TXT 저장</button></div></div>
          <div class="pp-bottom-row"><span id="ppSaveStatus" class="pp-help">이 브라우저에 자동 저장</span><button type="button" id="ppUndoReset" class="pp-text-button" hidden>초기화 되돌리기</button><button type="button" id="pptxPromptResetBtn" class="pp-text-button">초기화</button></div>
        </div>
      </section>
    </div>
    <div id="ppStatus" class="pp-status" role="status" aria-live="polite"></div>`;
  const q = (selector) => root.querySelector(selector);
  let statusTimer;
  function status(message) {
    clearTimeout(statusTimer);
    q("#ppStatus").textContent = message;
    q("#ppStatus").classList.add("is-visible");
    statusTimer = setTimeout(() => q("#ppStatus").classList.remove("is-visible"), 6000);
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); q("#ppSaveStatus").textContent = "이 브라우저에 자동 저장"; }
    catch (_) { q("#ppSaveStatus").textContent = "자동 저장 불가 · 프롬프트를 복사하거나 저장해 주세요"; }
  }
  function updateOutput(persist = true) {
    const result = contract.build(state);
    q("#ppOutput").value = result.prompt;
    q("#ppPromptCount").textContent = `${result.prompt.length.toLocaleString()}자`;
    q("#ppError").textContent = result.issues.join(" ");
    q("#ppError").hidden = !result.issues.length;
    q("#ppSlideCount").setAttribute("aria-invalid", String(!!result.issues.length));
    for (const id of ["pptxPromptCopyBtn", "pptxPromptDownloadBtn"]) q(`#${id}`).disabled = !result.prompt;
    if (persist) save();
    window.PromptDeckTabs?.syncHeaderActionStates?.();
    return result;
  }
  function renderFields() {
    root.querySelectorAll("[data-pp-field]").forEach((element) => {
      const key = element.dataset.ppField;
      if (element.type === "checkbox") element.checked = state[key];
      else element.value = state[key];
    });
  }
  function renderSelected() {
    const style = catalog.get(state.styleId), colors = contract.palette(state);
    q("#ppSelectedName").textContent = style.nameKo;
    q("#ppSelectedEnglish").textContent = style.nameEn;
    q("#ppSelectedDescription").textContent = style.description;
    q("#ppSelectedImage").innerHTML = `<img src="${esc(style.previewImage)}" alt="${esc(style.nameKo)} 스타일 견본" width="960" height="540" decoding="async">`;
    const traits = [...new Set([style.settings?.visualDirection?.signatureMotif, ...(style.distinctiveRules || [])].filter(Boolean))];
    q("#ppStyleTraits").innerHTML = (traits.length ? traits : [style.description]).map((trait) => `<li>${esc(trait)}</li>`).join("");
    q("#ppPalette").innerHTML = ["primary", "accent", "background"].map((key) => `<label class="pp-color-field"><input type="color" data-pp-color="${key}" value="${colors[key]}" aria-label="${contract.colorRoles[key]} 색상"><span>${contract.colorRoles[key]}<small data-pp-color-value="${key}">${colors[key]}</small></span></label>`).join("");
    updatePaletteNote();
  }
  function updatePaletteNote() {
    q("#ppPaletteNote").textContent = Object.keys(state.colorOverrides).length ? "색상 변경은 프롬프트에 반영됩니다. 견본 이미지는 원본입니다." : "견본 원본 색상";
  }
  function renderGallery() {
    const matches = catalog.list({ category, query });
    q("#ppMatchCount").textContent = `${matches.length}개 중 ${Math.min(visible, matches.length)}개 표시`;
    q("#ppStyleGrid").innerHTML = matches.length ? matches.slice(0, visible).map((style) => `<button type="button" class="pp-style-card" data-pp-style="${esc(style.id)}" aria-pressed="${style.id === state.styleId}" aria-label="${esc(style.nameKo)} 스타일 선택"><span class="pp-card-image"><img src="${esc(style.previewImage)}" alt="" loading="lazy" decoding="async" width="960" height="540"><span class="pp-card-selected">선택됨</span></span><span class="pp-card-body"><strong>${esc(style.nameKo)}</strong><span class="pp-card-english">${esc(style.nameEn)}</span><span class="pp-card-description">${esc(style.description)}</span><span class="pp-card-use">${esc(style.bestFor)}</span></span></button>`).join("") : '<div class="pp-empty"><strong>검색 결과가 없습니다.</strong><p>검색어를 바꾸거나 전체 스타일을 확인해 보세요.</p><button type="button" class="pp-button" id="ppClearSearch">전체 스타일 보기</button></div>';
    q("#ppLoadMore").hidden = matches.length <= visible;
    q("#ppLoadMore").textContent = `스타일 더 보기 · ${Math.max(0, matches.length - visible)}개 남음`;
  }
  function setView(view, focus = false) {
    root.dataset.view = view;
    root.querySelectorAll("[data-pp-view]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.ppView === view)));
    if (focus) {
      const target = view === "gallery" ? q("#ppSearch") : q("#ppRatio");
      target.focus({ preventScroll: true });
      (view === "gallery" ? q(".pp-gallery") : q(".pp-result-stack")).scrollIntoView({ block: "start", behavior: "instant" });
    }
  }
  function selectStyle(id) {
    if (!catalog.get(id)) return;
    state.styleId = id;
    state.colorOverrides = {};
    renderSelected();
    root.querySelectorAll("[data-pp-style]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.ppStyle === id)));
    updateOutput();
    status(`${catalog.get(id).nameKo} 스타일을 적용했습니다.`);
    if (matchMedia("(max-width: 800px)").matches) setView("result", true);
  }
  function showPrompt() {
    setView("result");
    const result = updateOutput();
    if (result.issues.length) { q("#ppSlideCount").focus(); return result; }
    q("#ppOutputSection").scrollIntoView({ block: "start", behavior: "instant" });
    q("#ppOutput").focus({ preventScroll: true });
    return result;
  }
  async function copyPrompt() {
    const result = updateOutput();
    if (!result.prompt) { showPrompt(); return; }
    try { await navigator.clipboard.writeText(result.prompt); status("PPTX 제작 요청문을 복사했습니다. 원본 자료와 함께 AI에 전달하세요."); }
    catch (_) { showPrompt(); q("#ppOutput").select(); status("요청문을 선택했습니다. 복사 메뉴 또는 Ctrl+C로 복사해 주세요."); }
  }
  function downloadPrompt() {
    const result = updateOutput();
    if (!result.prompt) { showPrompt(); return; }
    const url = URL.createObjectURL(new Blob([result.prompt], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `pptx-prompt-${state.styleId}.txt`;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    status("PPTX 제작 요청문을 TXT로 저장했습니다.");
  }
  function reset() {
    undoState = clone(state); state = contract.defaults();
    renderFields(); renderSelected(); renderGallery(); updateOutput();
    q("#ppUndoReset").hidden = false;
    status("초기화했습니다. ‘초기화 되돌리기’로 이전 설정을 복구할 수 있습니다.");
  }
  root.addEventListener("input", (event) => {
    const field = event.target.dataset.ppField, color = event.target.dataset.ppColor;
    if (field) { state[field] = event.target.type === "checkbox" ? event.target.checked : event.target.value; updateOutput(); }
    if (color) { state.colorOverrides[color] = event.target.value; q(`[data-pp-color-value="${color}"]`).textContent = event.target.value; updatePaletteNote(); updateOutput(); }
    if (event.target.id === "ppSearch") {
      query = event.target.value; visible = 12;
      if (query.trim() && category === "recommended") { category = "all"; q("#ppCategory").value = category; }
      renderGallery();
    }
  });
  q("#ppCategory").addEventListener("change", (event) => { category = event.target.value; visible = 12; renderGallery(); });
  root.addEventListener("click", (event) => {
    const card = event.target.closest("[data-pp-style]");
    if (card) selectStyle(card.dataset.ppStyle);
    const viewButton = event.target.closest("[data-pp-view]");
    if (viewButton) setView(viewButton.dataset.ppView, true);
    if (event.target.closest("#ppClearSearch")) { category = "all"; query = ""; visible = 12; q("#ppSearch").value = ""; q("#ppCategory").value = category; renderGallery(); q("#ppSearch").focus(); }
  });
  q("#ppLoadMore").addEventListener("click", () => {
    const previous = visible; visible += 12; renderGallery();
    q("#ppStyleGrid").querySelectorAll("[data-pp-style]")[previous]?.focus({ preventScroll: true });
  });
  q("#ppChooseStyle").addEventListener("click", () => setView("gallery", true));
  q("#pptxPromptGenerateBtn").addEventListener("click", showPrompt);
  q("#pptxPromptCopyBtn").addEventListener("click", copyPrompt);
  q("#pptxPromptDownloadBtn").addEventListener("click", downloadPrompt);
  q("#pptxPromptResetBtn").addEventListener("click", reset);
  q("#ppResetColors").addEventListener("click", () => { state.colorOverrides = {}; renderSelected(); updateOutput(); status("선택한 스타일의 원래 색상을 적용했습니다."); });
  q("#ppUndoReset").addEventListener("click", () => {
    if (!undoState) return;
    state = undoState; undoState = null;
    renderFields(); renderSelected(); renderGallery(); updateOutput();
    q("#ppUndoReset").hidden = true; status("초기화 전 설정을 복구했습니다.");
  });
  q("#ppImportStyle").addEventListener("click", () => {
    const shared = window.PromptDeckCommonPrompt?.getState?.();
    const style = catalog.get(shared?.visualStyle?.presetId);
    if (!style) { status("공통 프롬프트 탭에서 갤러리 스타일을 먼저 선택해 주세요."); return; }
    state = contract.normalize({ ...state, styleId: style.id, colorOverrides: shared.colors });
    renderSelected(); renderGallery(); updateOutput();
    status(`${style.nameKo} 스타일과 현재 색상을 가져왔습니다.`);
    if (matchMedia("(max-width: 800px)").matches) setView("result", true);
  });
  // Keep the shared catalog previews unloaded while another tool is in use.
  function activate() {
    if (activated || !pane.classList.contains("active")) return;
    activated = true; renderFields(); renderGallery(); renderSelected(); updateOutput(false);
    if (storageNotice) status(storageNotice);
  }
  const observer = new MutationObserver(() => { activate(); if (activated) observer.disconnect(); });
  observer.observe(pane, { attributes: true, attributeFilter: ["class"] });
  activate();
  window.PromptDeckPptxPrompt = Object.freeze({ getState: () => clone(state), build: () => contract.build(state) });
})();
