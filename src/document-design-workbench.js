(function () {
  "use strict";

  const root = document.getElementById("documentDesignApp");
  const pane = document.getElementById("paneDocumentDesign");
  const isActive = () => pane?.classList.contains("active");
  const BUNDLES = window.PromptDeckDocumentBundles || window.PromptDeckDocumentDesignBundles;
  const RESOLVER = window.PromptDeckDocumentResolver || window.PromptDeckDocumentDesignResolver;
  const MIGRATION = window.PromptDeckDocumentMigration || window.PromptDeckDocumentDesignMigration;
  const RENDERER = window.PromptDeckDocumentRenderer || window.PromptDeckDocumentDesignRenderer;
  const CONTRACT = window.PromptDeckDocumentDesignContract;
  if (!root || !BUNDLES || !RESOLVER || !RENDERER || !CONTRACT) return;

  const FEEL = [
    { key: "colorPresence", label: "색의 존재감", hint: "색이 차지하는 면적과 강조 대비", options: [["low", "차분하게"], ["balanced", "균형 있게"], ["high", "선명하게"]] },
    { key: "breathing", label: "여백과 호흡", hint: "문단과 행 사이의 읽기 간격", options: [["compact", "촘촘하게"], ["balanced", "편안하게"], ["airy", "여유롭게"]] },
    { key: "imagePresence", label: "그림의 비중", hint: "글과 그림이 함께 놓이는 비율", options: [["text", "글 중심"], ["balanced", "균형 있게"], ["image", "그림 중심"]] },
    { key: "titlePresence", label: "제목의 강조", hint: "제목 크기와 본문 사이의 위계", options: [["quiet", "담백하게"], ["clear", "또렷하게"], ["strong", "강하게"]] },
    { key: "decorationPresence", label: "장식의 정도", hint: "배경과 안내 요소의 존재감", options: [["minimal", "최소한"], ["balanced", "적당히"], ["rich", "풍부하게"]] },
  ];
  const SIZES = { A4: [210, 297], A3: [297, 420], A5: [148, 210], B5: [182, 257], Letter: [215.9, 279.4] };
  const BINDINGS = [["none", "제본 없음"], ["left", "좌철"], ["top", "상철"], ["saddle", "중철"], ["perfect", "무선 제본"], ["hardcover", "양장"], ["spiral", "스프링"]];
  const DUPLEX = [["single", "단면"], ["duplex", "양면"], ["duplex-long", "양면 · 긴 쪽"], ["duplex-short", "양면 · 짧은 쪽"]];
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const icon = (name) => {
    const names = { arrow: "chevron-right", back: "chevron-left", check: "check2", expand: "arrows-fullscreen", close: "x-lg", adjust: "sliders", download: "download", copy: "copy", undo: "arrow-counterclockwise", book: "book" };
    return `<img class="dw-library-icon" src="assets/document-design-icons/${names[name] || "book"}.svg" width="18" height="18" alt="" aria-hidden="true">`;
  };
  const list = (value) => Array.isArray(value) ? value : Object.values(value || {});
  const bundles = () => list(BUNDLES.bundles);
  const families = () => list(BUNDLES.families);
  const getBundle = (id) => BUNDLES.get?.(id) || bundles().find((item) => item.id === id) || bundles()[0];
  const nameOf = (item) => item?.label || item?.nameKo || item?.name || item?.title || item?.id || "문서";
  const pagesOf = (design) => design?.pages || design?.bundle?.pages || getBundle(state.bundleId)?.pages || [];
  const pageName = (page) => page?.label || page?.title || page?.name || page?.id || "페이지";
  const loaded = MIGRATION?.load?.() || { state: RESOLVER.defaults(), notice: "" };
  let state = RESOLVER.resolve(loaded.state || RESOLVER.defaults()).state;
  let resolved = RESOLVER.resolve(state);
  let step = 1;
  let browseFamily = state.familyId || getBundle(state.bundleId)?.familyId || families()[0]?.id;
  let candidateId = null;
  let undoState = null;
  let renderTicket = 0;
  let galleryTicket = 0;
  let thumbTicket = 0;
  let referenceTicket = 0;
  let continuation = 0;
  let currentPageNodes = [];
  let referencePageIds = new Set();
  let exportController = null;
  let dialogReturnFocus = null;
  let statusTimer;
  let previewFrame = 0;
  let fontPair = "default";
  let paletteModal;
  let layoutWorkbench;
  let studio;
  let designLibrary;
  const fontScopes = new Set();

  function syncFontSelection() {
    const overrides = { ...(state.overrides?.fonts || {}), ...(state.overrides?.typographyScope || {}) };
    const entries = Object.entries(overrides);
    fontScopes.clear();
    (entries.length ? entries.map(([key]) => key) : ["heading", "body", "numeral", "table", "caption", "quote"]).forEach((key) => fontScopes.add(key));
    if (!entries.length) fontPair = "default";
    else if (entries.every(([, value]) => value === "Noto Sans KR")) fontPair = "sans";
    else if (entries.every(([, value]) => value === "Noto Serif KR")) fontPair = "serif";
    else fontPair = "mixed";
  }
  syncFontSelection();

  function representativePages(bundle) {
    const pages = bundle?.pages || [];
    const explicit = bundle?.referencePageIds || bundle?.representativePageIds || bundle?.previewPageIds;
    if (Array.isArray(explicit)) return explicit.filter((id) => pages.some((page) => page.id === id)).slice(0, 3);
    const body = pages.find((page) => /body|concept|theory|text/.test(page.id)) || pages[1];
    return [...new Set([pages[0]?.id, body?.id, pages.find((page) => page.id !== pages[0]?.id && page.id !== body?.id && /table|chart|image|quote|activity|scene|diagram/.test(page.id))?.id || pages.at(-1)?.id].filter(Boolean))];
  }

  function status(message, error = false) {
    const target = root.querySelector("#documentDesignStatus");
    if (!target) return;
    target.textContent = message;
    target.classList.toggle("is-error", error);
    clearTimeout(statusTimer);
  }

  function save() {
    try {
      const saved = MIGRATION?.save?.(state);
      if (saved && !saved.ok) status("브라우저에 자동 저장하지 못했습니다. 현재 작업은 계속하고 디자인을 내려받을 수 있습니다.", true);
    } catch (_) { status("자동 저장을 사용할 수 없습니다. 작업을 마치면 디자인을 내려받아 주세요.", true); }
  }

  function settle(message, options = {}) {
    resolved = RESOLVER.resolve(state);
    state = resolved.state;
    save();
    updateMeta();
    updateResult();
    if (options.controls !== false) renderControls();
    if (options.preview !== false) {
      continuation = 0;
      cancelAnimationFrame(previewFrame);
      previewFrame = requestAnimationFrame(() => { renderMain(); renderPageList(); });
    }
    if (message) status(message);
  }

  function mount() {
    root.className = "dw-workbench";
    root.dataset.workbench = "ready";
    root.innerHTML = `
      <header class="dw-header"><div><span class="dw-eyebrow">DOCUMENT DESIGN</span><h2>눈으로 고르고, 느낌을 다듬으세요.</h2><p>완성된 문서 견본에서 시작해 나에게 맞는 디자인 지침과 참고 이미지를 만듭니다.</p></div><span class="dw-save-note">이 브라우저에 자동 저장</span></header>
      <nav class="dw-steps" aria-label="문서 디자인 단계">${["견본 선택", "보면서 조정", "디자인 받기"].map((label, index) => `<button type="button" data-step="${index + 1}" aria-current="${index === 0 ? "step" : "false"}"><span>${index + 1}</span>${label}</button>`).join("")}</nav>
      <div id="documentDesignStatus" class="dw-status" role="status" aria-live="polite"></div>
      <section class="dw-gallery" data-stage="1" aria-labelledby="dwGalleryTitle"><div class="dw-section-heading"><div><h3 id="dwGalleryTitle">어떤 문서를 만들고 싶으세요?</h3><p>같은 분야의 다양한 디자인을 동일한 예시 내용으로 비교해 보세요.</p></div><button type="button" class="dw-button dw-subtle" data-action="resume">선택한 디자인 열기 ${icon("arrow")}</button></div><div class="dw-family-filters" role="group" aria-label="문서 분야">${families().map((family) => `<button type="button" data-family="${esc(family.id)}" aria-pressed="false">${esc(nameOf(family))}</button>`).join("")}</div><div class="dw-bundle-grid" id="dwBundleGrid"></div><p class="dw-gallery-note">디자인 견본 · 내용은 예시입니다. 세트를 선택해도 A4 등 지정한 문서 규격은 유지됩니다.</p></section>
      <section class="dw-editor" data-stage="2" hidden aria-label="문서 디자인 실시간 조정"><div class="dw-editor-heading"><div><span class="dw-eyebrow" id="dwSelectedFamily"></span><h3 id="dwSelectedName"></h3><p id="dwPhysicalSummary"></p></div><div class="dw-toolbar"><button type="button" class="dw-button" data-action="undo" hidden>${icon("undo")} 선택 되돌리기</button><button type="button" class="dw-button dw-subtle" data-action="reset-design">기본값 복구</button><button type="button" class="dw-button" data-step="1">다른 견본</button></div></div><div class="dw-editor-layout"><nav class="dw-page-list" id="dwPageList" aria-label="견본 페이지"></nav><div class="dw-preview-column"><div class="dw-preview-toolbar"><span id="dwPageCaption"></span><button type="button" class="dw-icon-button" data-action="zoom" aria-label="문서 확대 보기">${icon("expand")}</button></div><div class="dw-main-canvas" id="documentDesignLivePreview" aria-label="선택한 문서 미리보기" aria-busy="false"></div><div class="dw-page-navigation"><button type="button" class="dw-icon-button" data-action="previous-page" aria-label="이전 페이지">${icon("back")}</button><span id="dwPageCount"></span><button type="button" class="dw-icon-button" data-action="next-page" aria-label="다음 페이지">${icon("arrow")}</button></div><p class="dw-preview-note">디자인 견본 · 내용은 예시 · 설정을 바꾸면 페이지에 바로 반영됩니다.</p></div><aside class="dw-desktop-controls doc-design-result-stack"><div class="dw-controls-heading"><h4>느낌 조정</h4><span>페이지에 바로 반영</span></div><div id="dwDesktopControls"></div><button type="button" class="dw-button dw-primary dw-wide" data-step="3">디자인 받기 ${icon("arrow")}</button></aside></div></section>
      <section class="dw-results" data-stage="3" hidden aria-labelledby="dwResultTitle"><div class="dw-section-heading"><div><span class="dw-eyebrow">YOUR DESIGN</span><h3 id="dwResultTitle">이 디자인으로 제작을 요청하세요.</h3><p>디자인 지침과 참고 이미지를 함께 AI에 전달하면 원하는 형태를 구체적으로 설명할 수 있습니다.</p></div><button type="button" class="dw-button" data-step="2">계속 다듬기</button></div><div class="dw-result-grid"><div class="dw-result-summary"><h4 id="dwResultBundle"></h4><p id="dwResultMeta"></p><div class="dw-result-references" id="dwResultReferences"></div><p class="dw-help">참고 이미지에 포함할 페이지를 선택하세요.</p><div class="dw-reference-options" id="dwReferenceOptions"></div><div class="dw-download-actions"><button type="button" class="dw-button" data-action="export-sheet">${icon("download")} 참고 시트 PNG</button><button type="button" class="dw-button" data-action="export-page">현재 페이지 PNG</button><button type="button" class="dw-button dw-primary" data-action="export-zip">${icon("download")} 한 번에 받기</button></div><p class="dw-help">참고용 PNG·디자인 지침·설정 파일을 받습니다. 완성 문서의 내용은 제작 AI에 별도로 전달하세요.</p><div id="dwExportProgress" class="dw-export-progress" hidden><span></span><button type="button" class="dw-button" data-action="cancel-export">취소</button></div><div class="dw-issues" id="dwIssues"></div></div><div class="dw-prompt-panel"><div class="dw-prompt-heading"><h4>디자인 지침</h4><button type="button" class="dw-button dw-primary" data-action="copy-design">${icon("copy")} 지침 복사</button></div><textarea id="documentDesignOutput" class="dw-prompt-output" readonly aria-label="현재 디자인 지침"></textarea><details class="dw-source-details"><summary>작성 요청과 합치기 <span>선택 사항</span></summary><p class="dw-help">기존 작성 요청을 그대로 두고 디자인 지침을 뒤에 붙입니다.</p><textarea id="documentDesignSource" placeholder="다른 데이터와 함께 사용할 기존 작성 요청을 입력하세요." aria-label="기존 작성 요청"></textarea><button type="button" class="dw-button" data-action="copy-full">작성 요청 + 디자인 지침 복사</button><label class="dw-check"><input type="checkbox" id="dwIncludeSource"> ZIP에 작성 요청 포함</label></details><details class="dw-more"><summary>더보기</summary><div class="dw-inline-actions"><button type="button" class="dw-button" data-action="send-common">공통 프롬프트로 전달</button><button type="button" class="dw-button" data-action="download-json">설정 JSON 저장</button><button type="button" class="dw-button" data-action="download-text">지침 TXT 저장</button></div></details></div></div></section>
      <div class="dw-mobile-bar"><button type="button" class="dw-button" data-action="mobile-back">이전</button><div><span id="dwMobileCount">1 / 3</span><strong id="dwMobileLabel">견본 선택</strong></div><button type="button" class="dw-button dw-primary" data-action="mobile-next">선택한 디자인</button></div>
      <dialog class="dw-dialog dw-control-dialog" id="dwControlDialog" aria-labelledby="dwControlTitle"><div class="dw-dialog-heading"><h3 id="dwControlTitle">느낌 조정</h3><button type="button" class="dw-icon-button" data-close-dialog aria-label="느낌 조정 닫기">${icon("close")}</button></div><div class="dw-dialog-content" id="dwMobileControls"></div><div class="dw-dialog-footer"><button type="button" class="dw-button dw-primary dw-wide" data-close-dialog>문서 전체 보기</button></div></dialog>
      <dialog class="dw-dialog dw-candidate-dialog" id="dwCandidateDialog" aria-labelledby="dwCandidateTitle"><div class="dw-dialog-heading"><div><span class="dw-eyebrow">DESIGN PREVIEW</span><h3 id="dwCandidateTitle"></h3></div><button type="button" class="dw-icon-button" data-close-dialog aria-label="견본 미리보기 닫기">${icon("close")}</button></div><div class="dw-dialog-content"><p id="dwCandidateDescription"></p><div class="dw-candidate-pages" id="dwCandidatePages"></div></div><div class="dw-dialog-footer"><span id="dwCandidateMeta"></span><button type="button" class="dw-button dw-primary" data-action="use-candidate">이 디자인 사용 ${icon("check")}</button></div></dialog>
      <dialog class="dw-dialog dw-zoom-dialog" id="dwZoomDialog" aria-labelledby="dwZoomTitle"><div class="dw-dialog-heading"><h3 id="dwZoomTitle">문서 확대 보기</h3><button type="button" class="dw-icon-button" data-close-dialog aria-label="확대 보기 닫기">${icon("close")}</button></div><div class="dw-zoom-canvas" id="dwZoomCanvas"></div><p class="dw-help">확대한 문서는 가로·세로로 이동해서 볼 수 있습니다.</p></dialog>
      <div hidden><button type="button" id="documentDesignGenerateBtn"></button><button type="button" id="documentDesignCopyBtn"></button><button type="button" id="documentDesignSendCommonBtn"></button><button type="button" id="documentDesignDownloadBtn"></button><button type="button" id="documentDesignSampleBtn"></button><button type="button" id="documentDesignResetBtn"></button></div>`;
    root.querySelector(".dw-preview-toolbar").insertAdjacentHTML("afterend", '<div class="dw-layout-actions"><span class="dw-current-layout" id="dwCurrentLayout"></span><button type="button" class="dw-button" data-action="open-layout" hidden>다른 배치 · 3안</button><button type="button" class="dw-button" data-action="open-overview">문서 세트 전체 보기</button></div>');
    root.querySelector(".dw-save-note").insertAdjacentHTML("beforebegin", '<button type="button" class="dw-button" data-action="open-library">내 디자인 저장함</button>');
    root.querySelector(".dw-layout-actions").insertAdjacentHTML("beforeend", '<button type="button" class="dw-button" data-action="open-density">분량 점검</button>');
    referencePageIds = new Set(representativePages(getBundle(state.bundleId)));
    root.querySelector("#documentDesignSource").value = state.sourcePrompt || "";
    renderControls();
    renderGallery();
    renderPageList();
    updateMeta();
    updateResult();
    bind();
    paletteModal = window.PromptDeckDocumentPaletteModal?.create({ root, getState: () => state, renderFrame, fitAll, apply(next) {
      undoState = clone(state);
      state.colorPresetId = next.colorPresetId;
      state.colorBaseBundleId = next.colorBaseBundleId || (!next.colorPresetId && next.keepPaletteOnBundleChange ? next.bundleId : "");
      state.colorFeel = clone(next.colorFeel);
      state.keepPaletteOnBundleChange = next.keepPaletteOnBundleChange;
      state.overrides.colors = clone(next.overrides.colors);
      state.feel.colorPresence = next.feel.colorPresence;
      settle("색상 조합을 문서 전체와 디자인 지침에 적용했습니다.");
    } });
    layoutWorkbench = window.PromptDeckDocumentLayoutWorkbench?.create({ root, getState: () => state, renderFrame, fitAll, selectPage, apply(pageId, layoutId) {
      undoState = clone(state);
      state.pageLayouts = { ...state.pageLayouts, [pageId]: layoutId };
      referencePageIds.add(pageId);
      settle("선택한 배치를 미리보기·참고 이미지·디자인 지침에 적용했습니다.");
    } });
    studio = window.PromptDeckDocumentStudio?.create({ root, getState: () => state, renderFrame, fitAll, apply(next) {
      undoState = clone(state);
      state.overrides = clone(next.overrides);
      syncFontSelection();
      settle("선택한 요소 표현을 문서 전체·참고 이미지·디자인 지침에 적용했습니다.");
    } });
    designLibrary = window.PromptDeckDocumentLibrary?.create({ root, getState: () => state, renderFrame, fitAll, downloadText, apply(next) {
      undoState = clone(state);
      const sourcePrompt = state.sourcePrompt;
      state = RESOLVER.normalize({ ...next, sourcePrompt });
      browseFamily = state.familyId;
      syncFontSelection();
      referencePageIds = new Set(representativePages(getBundle(state.bundleId)));
      settle("저장한 디자인을 불러왔습니다. 기존 작성 요청은 그대로 유지됩니다.");
      setStep(2);
    } });
    status(loaded.notice || "마음에 드는 디자인을 펼쳐 보고 한 세트를 선택하세요.");
  }

  function bundleState(bundleId) {
    const result = RESOLVER.changeBundle(clone(state), bundleId);
    return result?.state || result;
  }

  async function renderFrame(parent, design, tokens, pageId, options = {}) {
    const node = RENDERER.renderPage(design, tokens, pageId, options.sampleContent);
    if (!node) return;
    if (options.kind !== "main") node.setAttribute("aria-hidden", "true");
    const frame = document.createElement("div");
    frame.className = "dw-paper-frame";
    frame.dataset.fit = options.kind || "thumb";
    const scale = document.createElement("div");
    scale.className = "dw-paper-scale";
    scale.append(node);
    frame.append(scale);
    parent.append(frame);
    try { await RENDERER.ready(node); }
    catch (error) {
      if (options.kind === "main") throw error;
      frame.remove();
      const notice = document.createElement("span"); notice.className = "dw-preview-error"; notice.textContent = "견본을 불러오지 못했습니다."; parent.append(notice);
      status(error.message, true);
      return null;
    }
    if (!frame.isConnected) return;
    frame.dataset.naturalWidth = String(node.offsetWidth || parseFloat(node.style.width) || 794);
    frame.dataset.naturalHeight = String(node.offsetHeight || parseFloat(node.style.height) || 1123);
    fitFrame(frame);
    return { frame, node, scale };
  }

  function fitFrame(frame) {
    if (!frame.isConnected || !frame.parentElement.clientWidth) return;
    const width = Number(frame.dataset.naturalWidth || 794);
    const height = Number(frame.dataset.naturalHeight || 1123);
    const kind = frame.dataset.fit;
    const parentStyle = kind === "studio" ? getComputedStyle(frame.parentElement) : null;
    const horizontalPadding = parentStyle ? parseFloat(parentStyle.paddingLeft) + parseFloat(parentStyle.paddingRight) : 0;
    const availableWidth = Math.max(1, frame.parentElement.clientWidth - (kind === "main" ? 36 : horizontalPadding));
    const maxHeight = kind === "main" ? Math.max(360, Math.min(850, window.innerHeight - 185)) : kind === "studio" ? Math.max(200, Math.min(580, window.innerHeight - 300)) : kind === "thumb" ? 105 : kind === "layout-large" ? 800 : kind === "layout" ? 510 : kind === "overview" ? 330 : kind === "palette-card" ? 220 : kind === "palette" ? 230 : kind === "palette-large" ? 520 : kind === "card" ? 310 : 520;
    const factor = Math.min(availableWidth / width, maxHeight / height, 1);
    frame.style.width = `${width * factor}px`;
    frame.style.height = `${height * factor}px`;
    frame.firstElementChild.style.transform = `scale(${factor})`;
    frame.firstElementChild.style.width = `${width}px`;
    frame.firstElementChild.style.height = `${height}px`;
  }

  function fitAll() { root.querySelectorAll(".dw-paper-frame").forEach(fitFrame); }

  async function renderGallery() {
    if (!isActive() || step !== 1) return;
    const ticket = ++galleryTicket;
    root.querySelectorAll("[data-family]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.family === browseFamily)));
    const grid = root.querySelector("#dwBundleGrid");
    const shown = bundles().filter((bundle) => bundle.familyId === browseFamily);
    grid.innerHTML = shown.map((bundle, index) => `<article class="dw-bundle-card${bundle.id === state.bundleId ? " is-selected" : ""}" data-bundle-card="${esc(bundle.id)}"><button type="button" class="dw-bundle-open" data-bundle="${esc(bundle.id)}" aria-label="${esc(nameOf(bundle))} 펼쳐 보기"><div class="dw-card-pages" data-card-pages="${esc(bundle.id)}"></div><div class="dw-card-body"><div class="dw-card-label"><span>DESIGN ${String(index + 1).padStart(2, "0")}</span>${bundle.id === state.bundleId ? '<b>사용 중</b>' : ''}</div><h4>${esc(nameOf(bundle))}</h4><p>${esc(bundle.description || bundle.tagline || bundle.summary || "표지부터 본문까지 조화롭게 연결되는 문서 디자인")}</p><div class="dw-card-foot"><span>${bundle.pages?.length || 0}개 페이지 견본</span><strong>펼쳐 보기 ${icon("arrow")}</strong></div></div></button><button type="button" class="dw-button dw-use-bundle" data-use-bundle="${esc(bundle.id)}">이 디자인 사용 ${icon("check")}</button></article>`).join("");
    for (const bundle of shown) {
      if (ticket !== galleryTicket) return;
      const preview = RESOLVER.resolve(bundleState(bundle.id));
      const host = grid.querySelector(`[data-card-pages="${CSS.escape(bundle.id)}"]`);
      for (const id of representativePages(bundle)) {
        if (ticket !== galleryTicket || !host?.isConnected) return;
        const cell = document.createElement("div");
        cell.className = "dw-card-page";
        host.append(cell);
        await renderFrame(cell, preview.design, preview.previewTokens, id, { kind: "card" });
      }
    }
  }

  async function renderPageList() {
    if (!isActive() || step !== 2) return;
    const ticket = ++thumbTicket;
    const host = root.querySelector("#dwPageList");
    const snapshot = resolved;
    host.innerHTML = pagesOf(snapshot.design).map((page, index) => `<button type="button" class="dw-page-thumb" data-page="${esc(page.id)}" aria-pressed="${page.id === state.activePageId}"><span class="dw-thumb-canvas"></span><span><b>${String(index + 1).padStart(2, "0")}</b> ${esc(pageName(page))}</span></button>`).join("");
    for (const page of pagesOf(snapshot.design)) {
      if (ticket !== thumbTicket) return;
      const button = host.querySelector(`[data-page="${CSS.escape(page.id)}"]`);
      if (!button?.isConnected) return;
      await renderFrame(button.querySelector(".dw-thumb-canvas"), snapshot.design, snapshot.previewTokens, page.id);
    }
  }

  async function renderMain() {
    if (!isActive() || step !== 2) return;
    const ticket = ++renderTicket;
    const host = root.querySelector("#documentDesignLivePreview");
    host.setAttribute("aria-busy", "true");
    const snapshot = resolved;
    const page = pagesOf(snapshot.design).find((item) => item.id === state.activePageId) || pagesOf(snapshot.design)[0];
    if (!page) return;
    const stage = document.createElement("div");
    stage.className = "dw-live-stage";
    stage.style.visibility = "hidden";
    host.replaceChildren(stage);
    try {
      const rendered = await renderFrame(stage, snapshot.design, snapshot.previewTokens, page.id, { kind: "main" });
      if (ticket !== renderTicket || !rendered) return;
      const paginated = await Promise.resolve(RENDERER.paginate?.(rendered.node));
      if (ticket !== renderTicket) return;
      currentPageNodes = Array.isArray(paginated) && paginated.length ? paginated : [rendered.node];
      continuation = Math.min(continuation, currentPageNodes.length - 1);
      rendered.scale.replaceChildren(currentPageNodes[continuation]);
      const displayed = rendered.scale.firstElementChild;
      await RENDERER.ready(displayed);
      if (ticket !== renderTicket) return;
      rendered.frame.dataset.naturalWidth = String(displayed.offsetWidth || rendered.frame.dataset.naturalWidth);
      rendered.frame.dataset.naturalHeight = String(displayed.offsetHeight || rendered.frame.dataset.naturalHeight);
      fitFrame(rendered.frame);
      stage.style.visibility = "";
      root.querySelector("#dwPageCaption").textContent = pageName(page);
      const index = pagesOf(snapshot.design).findIndex((item) => item.id === page.id);
      root.querySelector("#dwPageCount").textContent = `${index + 1} / ${pagesOf(snapshot.design).length}${currentPageNodes.length > 1 ? ` · 이어지는 면 ${continuation + 1}/${currentPageNodes.length}` : ""}`;
      root.querySelectorAll("[data-page]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.page === page.id)));
      host.setAttribute("aria-busy", "false");
    } catch (error) {
      if (ticket !== renderTicket) return;
      stage.innerHTML = '<p class="dw-render-error">미리보기를 불러오지 못했습니다. 다른 페이지를 선택하거나 다시 시도해 주세요.</p>';
      stage.style.visibility = "";
      host.setAttribute("aria-busy", "false");
      status(`미리보기 오류: ${error.message}`, true);
    }
  }

  function selectPage(id) {
    if (!pagesOf(resolved.design).some((page) => page.id === id)) return;
    state.activePageId = id;
    continuation = 0;
    resolved = RESOLVER.resolve(state);
    save();
    renderMain();
    renderControls();
    layoutWorkbench?.refresh();
  }

  function movePage(direction) {
    if (direction > 0 && continuation + 1 < currentPageNodes.length) { continuation += 1; renderMain(); return; }
    if (direction < 0 && continuation > 0) { continuation -= 1; renderMain(); return; }
    const pages = pagesOf(resolved.design);
    const index = pages.findIndex((page) => page.id === state.activePageId);
    selectPage(pages[(index + direction + pages.length) % pages.length].id);
  }

  function selectBundle(id) {
    if (!getBundle(id) || !bundles().some((bundle) => bundle.id === id)) return;
    if (id !== state.bundleId) {
      undoState = clone(state);
      state = bundleState(id);
    }
    state.activePageId = getBundle(id).pages.find((page) => page.kind === "body" || page.kind === "message")?.id || state.activePageId;
    syncFontSelection();
    candidateId = null;
    closeDialogs();
    referencePageIds = new Set(representativePages(getBundle(state.bundleId)));
    settle("디자인 세트를 적용했습니다. 느낌을 바꿔 페이지가 어떻게 달라지는지 살펴보세요.");
    renderPageList();
    setStep(2);
  }

  function setStep(next) {
    step = Math.max(1, Math.min(3, Number(next)));
    root.dataset.step = String(step);
    root.querySelectorAll("[data-stage]").forEach((section) => { section.hidden = Number(section.dataset.stage) !== step; });
    root.querySelectorAll(".dw-steps [data-step]").forEach((button) => button.setAttribute("aria-current", Number(button.dataset.step) === step ? "step" : "false"));
    root.querySelector("#dwMobileCount").textContent = `${step} / 3`;
    root.querySelector("#dwMobileLabel").textContent = ["견본 선택", "보면서 조정", "디자인 받기"][step - 1];
    root.querySelector('[data-action="mobile-next"]').innerHTML = step === 2 ? `${icon("adjust")} 느낌 조정` : step === 3 ? `${icon("copy")} 지침 복사` : "선택한 디자인";
    root.querySelector('[data-action="mobile-back"]').textContent = step === 2 ? "디자인 받기" : step === 1 ? "다듬기" : "이전";
    if (step === 1) renderGallery();
    if (step === 2) { renderPageList(); renderMain(); requestAnimationFrame(fitAll); }
    if (step === 3) { updateResult(); renderReferences(); }
    window.PromptDeckTabs?.syncHeaderActionStates?.();
    root.querySelector(".dw-steps")?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function updateMeta() {
    const bundle = getBundle(state.bundleId);
    const family = families().find((item) => item.id === bundle.familyId);
    const physical = state.physicalSpec;
    root.querySelector("#dwSelectedName").textContent = nameOf(bundle);
    root.querySelector("#dwSelectedFamily").textContent = nameOf(family);
    root.querySelector("#dwPhysicalSummary").textContent = `${physical.sizeId} · ${physical.orientation === "landscape" ? "가로" : "세로"} · ${physical.widthMm} × ${physical.heightMm} mm`;
    root.querySelector('[data-action="undo"]').hidden = !undoState;
    root.querySelector("#dwResultBundle").textContent = nameOf(bundle);
    root.querySelector("#dwResultMeta").textContent = `${root.querySelector("#dwPhysicalSummary").textContent} · ${(state.formats || []).join(" · ")}`;
    const source = root.querySelector("#documentDesignSource");
    if (source.value !== state.sourcePrompt) source.value = state.sourcePrompt;
    layoutWorkbench?.refresh();
  }

  function choices(prefix, label, key, items, value, group = "component") {
    if (key === "iconStyle") items = [...items, ["square", "사각 배지"]];
    return `<fieldset class="dw-field"><legend>${esc(label)}</legend><div class="dw-segmented">${items.map(([id, text]) => `<label><input type="radio" name="${prefix}-${group}-${esc(key)}" data-${group}="${esc(key)}" value="${esc(id)}" ${value === id ? "checked" : ""}><span>${esc(text)}</span></label>`).join("")}</div></fieldset>`;
  }

  function feelPageCue(field, pages) {
    const current = pages.find((page) => page.id === state.activePageId);
    const bundle = getBundle(state.bundleId);
    let target;
    let message;
    if (field.key === "imagePresence" && !["image", "dialogue", "spread-left", "spread-right", "diagram", "data-question"].includes(current?.kind) && !(current?.kind === "body" && (bundle.familyId === "story" || ["visual-learning", "photo"].includes(bundle.variant)))) {
      target = pages.find((page) => page.kind === "image") || pages.find((page) => page.kind === "diagram" || page.kind === "data-question");
      message = "그림이 있는 페이지에서 비교";
    }
    if (field.key === "breathing" && ["cover", "chapter"].includes(current?.kind)) {
      target = pages.find((page) => page.kind === "body") || pages.find((page) => page.kind === "message");
      message = "본문에서 읽기 간격 비교";
    }
    return target ? `<button type="button" class="dw-feel-cue" data-page="${esc(target.id)}">${message} ${icon("arrow")}</button>` : "";
  }

  function controlsMarkup(prefix) {
    const overrides = state.overrides || {};
    const components = { ...(resolved.design.componentStyles || {}), ...(overrides.components || {}) };
    const physical = state.physicalSpec;
    const pages = pagesOf(resolved.design);
    const tablePage = pages.find((page) => ["table", "answers", "data-question"].includes(page.kind));
    const chartPage = pages.find((page) => ["chart", "data-question"].includes(page.kind));
    const imagePage = pages.find((page) => /image|photo|scene|illustration|spread|evidence/.test(`${page.id} ${page.role} ${page.kind}`));
    const diagramPage = pages.find((page) => /diagram/.test(`${page.id} ${page.kind}`));
    const iconPage = pages.find((page) => ["diagram", "roadmap", "example", "activity"].includes(page.kind));
    const relevant = (page, label) => page && page.id !== state.activePageId ? `<button type="button" class="dw-related-page" data-page="${esc(page.id)}">${esc(label)}에서 확인 ${icon("arrow")}</button>` : "";
    const custom = Object.values(overrides).some((value) => value && Object.keys(value).length);
    return `${window.PromptDeckDocumentPaletteModal?.summary(state) || ""}<div class="dw-feel-fields">${FEEL.map((field) => `<fieldset class="dw-field"><legend>${field.label}</legend><p>${field.hint}</p><div class="dw-segmented">${field.options.map(([value, label]) => `<label><input type="radio" name="${prefix}-feel-${field.key}" data-feel="${field.key}" value="${value}" ${state.feel[field.key] === value ? "checked" : ""}><span>${label}</span></label>`).join("")}</div>${feelPageCue(field, pages)}</fieldset>`).join("")}</div>${custom ? '<div class="dw-custom-note">개별 조정 적용 중 <button type="button" data-action="clear-overrides">개별 조정 해제</button></div>' : ''}
      <details class="dw-control-details"><summary>서체</summary><div class="dw-detail-content"><label class="dw-select-label">서체 조합<select data-font-pair><option value="default">디자인 기본 서체</option><option value="sans">명료한 고딕</option><option value="serif">차분한 명조</option><option value="mixed">고딕 제목 · 명조 본문</option></select></label><p class="dw-help">서체를 바꿀 범위를 선택하세요.</p><div class="dw-scope-checks">${[["heading", "제목"], ["body", "본문"], ["numeral", "숫자"], ["table", "표"], ["caption", "캡션"], ["quote", "인용"]].map(([key, label]) => `<label class="dw-check"><input type="checkbox" data-font-scope="${key}" ${fontScopes.has(key) ? "checked" : ""}>${label}</label>`).join("")}</div></div></details>
      ${tablePage || chartPage || imagePage || diagramPage ? `<details class="dw-control-details"><summary>표 · 차트 · 이미지</summary><div class="dw-detail-content">${tablePage ? choices(prefix, "표 표현", "tableStyle", [["rules", "가로선"], ["striped", "줄무늬"], ["plain", "무테"]], components.tableStyle || "rules") + relevant(tablePage, pageName(tablePage)) : ""}${chartPage ? choices(prefix, "차트 표현", "chartType", [["bar", "비교"], ["line", "추세"], ["donut", "구성비"]], components.chartType || "bar") + relevant(chartPage, pageName(chartPage)) : ""}${imagePage ? choices(prefix, "이미지 색감", "imageStyle", [["original", "원본 색감"], ["muted", "차분한 색감"]], components.imageStyle || "original") + relevant(imagePage, pageName(imagePage)) : ""}${diagramPage ? choices(prefix, "도식 표현", "diagramStyle", [["flow", "흐름"], ["hierarchy", "계층"]], components.diagramStyle || "flow") + relevant(diagramPage, pageName(diagramPage)) : ""}</div></details>` : ""}
      <details class="dw-control-details"><summary>${iconPage ? "배경 · 안내 아이콘" : "배경"}</summary><div class="dw-detail-content">${choices(prefix, "배경 적용 범위", "backgroundScope", [["none", "없음"], ["cover", "표지"], ["chapter", "표지·장"], ["all", "전체"]], components.backgroundScope || "cover")}${iconPage ? choices(prefix, "안내 아이콘", "iconStyle", [["line", "가는 선"], ["solid", "채운 형태"]], components.iconStyle || "line") + relevant(iconPage, pageName(iconPage)) : ""}<p class="dw-help">장식의 정도가 최소이면 장식 표현을 절제합니다. 배경과 본문은 읽기 쉬운 대비를 유지하세요.</p></div></details>
      <details class="dw-control-details"><summary>문서 규격 <span>${esc(physical.sizeId)} · ${physical.orientation === "landscape" ? "가로" : "세로"}</span></summary><div class="dw-detail-content"><label class="dw-select-label">완성 용지 크기<select data-physical="sizeId">${Object.entries(SIZES).map(([id, dims]) => `<option value="${id}" ${physical.sizeId === id ? "selected" : ""}>${id} · ${dims[0]} × ${dims[1]} mm</option>`).join("")}</select></label>${choices(prefix, "용지 방향", "orientation", [["portrait", "세로형"], ["landscape", "가로형"]], physical.orientation, "physical")}<div class="dw-two-fields"><label class="dw-select-label">제본<select data-physical="bindingId">${BINDINGS.map(([id, label]) => `<option value="${id}" ${physical.bindingId === id ? "selected" : ""}>${label}</option>`).join("")}</select></label><label class="dw-select-label">면 구성<select data-physical="duplex">${DUPLEX.map(([id, label]) => `<option value="${id}" ${physical.duplex === id ? "selected" : ""}>${label}</option>`).join("")}</select></label><label class="dw-select-label">페이지 구성<select data-physical="spreadMode">${[["single-pages", "낱쪽"], ["facing", "맞쪽"], ["facing-pages", "맞쪽 · 기존 설정"]].filter(([id]) => id !== "facing-pages" || physical.spreadMode === id).map(([id, label]) => `<option value="${id}" ${physical.spreadMode === id ? "selected" : ""}>${label}</option>`).join("")}</select></label><label class="dw-select-label">도련<select data-physical="bleedMm"><option value="0" ${!physical.bleedMm ? "selected" : ""}>없음</option><option value="3" ${physical.bleedMm === 3 ? "selected" : ""}>3 mm</option></select></label></div><p class="dw-help">용지 크기는 정확한 규격으로 전달됩니다. 디자인이나 출력 형식을 바꿔도 유지됩니다.</p></div></details>
      <details class="dw-control-details"><summary>제작할 파일 형식</summary><div class="dw-detail-content dw-format-options">${["DOCX", "HWPX", "PDF", "PPTX", "HTML"].map((format) => `<label class="dw-check"><input type="checkbox" data-format="${format}" ${(state.formats || []).includes(format) ? "checked" : ""}>${format}</label>`).join("")}</div></details>`;
  }

  function renderControls() {
    for (const [id, prefix] of [["dwDesktopControls", "desktop"], ["dwMobileControls", "mobile"]]) {
      const host = root.querySelector(`#${id}`);
      const active = host.contains(document.activeElement) ? document.activeElement : null;
      const focusKey = active ? [...active.attributes].find((attr) => attr.name.startsWith("data-")) : null;
      const focusValue = active?.value;
      const opened = [...host.querySelectorAll("details")].map((detail) => detail.open);
      host.innerHTML = '<div class="dw-studio-entry"><button type="button" class="dw-button" data-action="open-studio">요소 견본으로 고르기</button><button type="button" class="dw-button" data-action="open-library">디자인 저장·불러오기</button></div>' + controlsMarkup(prefix) + `<fieldset class="dw-field dw-interpretation"><legend>AI가 해석할 범위</legend><p>규격·원문·지정 색상과 서체는 항상 유지됩니다.</p>${[["faithful", "견본에 가깝게", "선택한 배치와 표현을 충실히"], ["balanced", "분위기를 유지하며 조정", "내용량에 맞춰 비율·여백을 자연스럽게"], ["creative", "폭넓게 재해석", "배치 의도를 살려 장식·리듬을 창의적으로"]].map(([id, label, hint]) => `<label><input type="radio" name="${prefix}-interpretation" data-interpretation value="${id}" ${state.interpretation === id ? "checked" : ""}> ${label}<span>${hint}</span></label>`).join("")}</fieldset>`;
      host.querySelectorAll("details").forEach((detail, index) => { detail.open = !!opened[index]; });
      const pair = host.querySelector("[data-font-pair]");
      if (pair) pair.value = fontPair;
      if (focusKey) {
        const matches = [...host.querySelectorAll(`[${focusKey.name}="${CSS.escape(focusKey.value)}"]`)];
        (matches.find((node) => node.value === focusValue) || matches[0])?.focus({ preventScroll: true });
      }
    }
  }

  function applyFontPair() {
    for (const key of fontScopes) {
      if (fontPair === "default") { delete state.overrides.typographyScope[key]; if (["heading", "body"].includes(key)) delete state.overrides.fonts[key]; }
      else state.overrides.typographyScope[key] = fontPair === "serif" || (fontPair === "mixed" && !["heading", "numeral"].includes(key)) ? "Noto Serif KR" : "Noto Sans KR";
    }
  }

  function generate(showStatus = true) {
    const result = CONTRACT.build(state);
    root.querySelector("#documentDesignOutput").value = result.designPrompt || "";
    if (showStatus) status("현재 설정으로 디자인 지침을 만들었습니다.");
    return result;
  }

  function updateResult() {
    const result = generate(false);
    const issues = result.issues || resolved.issues || [];
    root.querySelector("#dwIssues").innerHTML = issues.length ? `<p class="dw-help">${issues.map((issue) => esc(typeof issue === "string" ? issue : issue.message || issue.label || "선택 설정을 확인해 주세요.")).join("<br>")}</p>` : "";
    const pages = pagesOf(resolved.design);
    referencePageIds = new Set([...referencePageIds].filter((id) => pages.some((page) => page.id === id)));
    if (!referencePageIds.size) referencePageIds = new Set(representativePages(getBundle(state.bundleId)));
    root.querySelector("#dwReferenceOptions").innerHTML = pages.map((page) => `<label class="dw-check"><input type="checkbox" data-reference="${esc(page.id)}" ${referencePageIds.has(page.id) ? "checked" : ""}>${esc(pageName(page))}</label>`).join("");
  }

  async function renderReferences() {
    if (!isActive() || step !== 3) return;
    const ticket = ++referenceTicket;
    const host = root.querySelector("#dwResultReferences");
    host.replaceChildren();
    const snapshot = resolved;
    for (const id of [...referencePageIds].slice(0, 3)) {
      if (ticket !== referenceTicket) return;
      const cell = document.createElement("div"); cell.className = "dw-reference-page"; host.append(cell);
      await renderFrame(cell, snapshot.design, snapshot.previewTokens, id, { kind: "card" });
      if (!cell.isConnected) return;
    }
  }

  async function copyText(value, message) {
    try { await navigator.clipboard.writeText(value); status(message); }
    catch (_) {
      const output = root.querySelector("#documentDesignOutput"); setStep(3); output.value = value; output.focus(); output.select();
      status("자동 복사를 사용할 수 없어 문구를 선택했습니다. 복사 메뉴 또는 Ctrl+C를 이용하세요.");
    }
  }

  function downloadText(text, name, type = "text/plain;charset=utf-8") {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function sendCommon() {
    const result = generate(false);
    const transfer = { text: state.sourcePrompt ? result.fullPrompt : result.designPrompt, spec: result.spec, createdAt: new Date().toISOString() };
    try { localStorage.setItem("promptdeck.documentDesign.transfer.v1", JSON.stringify(transfer)); } catch (_) {}
    window.PromptDeckCommonPrompt?.receiveDocumentDesign?.(transfer);
    window.PromptDeckTabs?.switchTab?.("commonPrompt");
    status("공통 프롬프트로 현재 디자인 지침을 전달했습니다.");
  }

  async function exportDesign(kind) {
    if (exportController) return;
    const exporter = window.PromptDeckDocumentExport;
    if (!exporter?.download) { status("이미지 저장 기능을 불러오지 못했습니다. 지침 TXT는 더보기에서 저장할 수 있습니다.", true); return; }
    exportController = new AbortController();
    const progress = root.querySelector("#dwExportProgress");
    progress.hidden = false;
    const buttons = [...root.querySelectorAll('[data-action^="export-"]')];
    buttons.forEach((button) => { button.disabled = true; });
    try {
      await exporter.download(clone(state), { kind, pageIds: kind === "page" ? [state.activePageId] : [...referencePageIds], includeSource: root.querySelector("#dwIncludeSource").checked, signal: exportController.signal, onProgress(value) { progress.firstElementChild.textContent = typeof value === "string" ? value : value.message || `${value.current || value.completed || 0} / ${value.total || referencePageIds.size} 페이지 준비 중`; } });
      status("저장 시작 시점의 설정으로 디자인을 내려받았습니다.");
    } catch (error) { status(error.name === "AbortError" ? "디자인 저장을 취소했습니다." : `저장하지 못했습니다. 다시 시도하거나 지침 TXT를 받아 주세요. ${error.message}`, error.name !== "AbortError"); }
    finally { exportController = null; progress.hidden = true; buttons.forEach((button) => { button.disabled = false; }); }
  }

  function openDialog(dialog) {
    dialogReturnFocus = document.activeElement;
    if (!dialog.open) dialog.showModal();
    requestAnimationFrame(fitAll);
  }

  function closeDialogs() {
    root.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
  }

  async function openCandidate(id) {
    candidateId = id;
    const bundle = getBundle(id);
    const preview = RESOLVER.resolve(bundleState(id));
    root.querySelector("#dwCandidateTitle").textContent = nameOf(bundle);
    root.querySelector("#dwCandidateDescription").textContent = bundle.description || bundle.tagline || "";
    root.querySelector("#dwCandidateMeta").textContent = `${bundle.pages.length}개 대표 페이지 · 디자인 견본`;
    const host = root.querySelector("#dwCandidatePages"); host.replaceChildren();
    openDialog(root.querySelector("#dwCandidateDialog"));
    for (const page of bundle.pages) {
      if (candidateId !== id || !root.querySelector("#dwCandidateDialog").open) return;
      const cell = document.createElement("figure"); cell.innerHTML = `<div class="dw-candidate-page"></div><figcaption>${esc(pageName(page))}</figcaption>`; host.append(cell);
      await renderFrame(cell.firstElementChild, preview.design, preview.previewTokens, page.id, { kind: "candidate" });
    }
  }

  function resetDesign() {
    const oldPhysical = clone(state.physicalSpec);
    const oldSource = state.sourcePrompt;
    const oldFormats = clone(state.formats);
    const oldPage = state.activePageId;
    const defaults = RESOLVER.defaults();
    const changed = RESOLVER.changeBundle(defaults, state.bundleId);
    state = changed?.state || changed;
    state.physicalSpec = oldPhysical; state.sourcePrompt = oldSource; state.formats = oldFormats; state.activePageId = oldPage;
    syncFontSelection();
    settle("디자인 기본값을 복구했습니다. 문서 규격과 작성 요청은 유지됩니다.");
    renderPageList();
  }

  function bind() {
    root.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button || !root.contains(button)) return;
      if (button.dataset.step) return setStep(button.dataset.step);
      if (button.dataset.family) { browseFamily = button.dataset.family; renderGallery(); return; }
      if (button.dataset.bundle) return openCandidate(button.dataset.bundle);
      if (button.dataset.useBundle) return selectBundle(button.dataset.useBundle);
      if (button.dataset.page) return selectPage(button.dataset.page);
      if (button.hasAttribute("data-close-dialog")) return closeDialogs();
      const action = button.dataset.action || { documentDesignGenerateBtn: "generate", documentDesignCopyBtn: "copy-design", documentDesignSendCommonBtn: "send-common", documentDesignDownloadBtn: "download-json", documentDesignSampleBtn: "sample", documentDesignResetBtn: "reset-design" }[button.id];
      if (action === "resume") return setStep(2);
      if (action === "open-studio") return studio?.open();
      if (action === "open-density") return studio?.open("density");
      if (action === "open-library") return designLibrary?.open();
      if (action === "open-palette") return paletteModal?.open();
      if (action === "open-layout") return layoutWorkbench?.open();
      if (action === "open-overview") return layoutWorkbench?.openOverview();
      if (action === "use-candidate" && candidateId) return selectBundle(candidateId);
      if (action === "previous-page") return movePage(-1);
      if (action === "next-page") return movePage(1);
      if (action === "reset-design") return resetDesign();
      if (action === "clear-overrides") { state.overrides = { colors: {}, fonts: {}, typographyScope: {}, components: {} }; syncFontSelection(); settle("개별 조정을 해제하고 현재 느낌 설정을 적용했습니다."); return; }
      if (action === "undo" && undoState) { state = undoState; undoState = null; syncFontSelection(); referencePageIds = new Set(representativePages(getBundle(state.bundleId))); settle("직전 디자인과 조정값을 복원했습니다."); renderPageList(); return; }
      if (action === "zoom") { const host = root.querySelector("#dwZoomCanvas"); host.replaceChildren(currentPageNodes[continuation]?.cloneNode(true) || document.createElement("div")); openDialog(root.querySelector("#dwZoomDialog")); return; }
      if (action === "mobile-back") return setStep(step === 2 ? 3 : step === 1 ? 2 : 2);
      if (action === "mobile-next") { if (step === 1) return setStep(2); if (step === 2) { root.querySelector("#documentDesignLivePreview").scrollIntoView({ block: "start", behavior: "instant" }); return openDialog(root.querySelector("#dwControlDialog")); } return copyText(generate(false).designPrompt, "디자인 지침을 복사했습니다."); }
      if (action === "generate") { setStep(3); return generate(); }
      if (action === "copy-design") return copyText(generate(false).designPrompt, "디자인 지침을 복사했습니다.");
      if (action === "copy-full") return copyText(generate(false).fullPrompt, "작성 요청과 디자인 지침을 함께 복사했습니다.");
      if (action === "send-common") return sendCommon();
      if (action === "download-json") return downloadText(JSON.stringify(window.PromptDeckDocumentLibrary.pack(state, resolved.design.label), null, 2), "design-settings.json", "application/json;charset=utf-8");
      if (action === "download-text") return downloadText(generate(false).designPrompt, "design-prompt.txt");
      if (action?.startsWith("export-")) return exportDesign(action.slice(7));
      if (action === "cancel-export") return exportController?.abort();
      if (action === "sample") { state.sourcePrompt = "첨부한 자료의 내용을 보존하면서 선택한 디자인으로 문서를 제작해줘."; root.querySelector("#documentDesignSource").value = state.sourcePrompt; settle("작성 요청 예시를 입력했습니다.", { preview: false, controls: false }); setStep(3); root.querySelector(".dw-source-details").open = true; }
    });
    root.addEventListener("input", (event) => {
      const target = event.target;
      if (target.id === "documentDesignSource") { state.sourcePrompt = target.value; settle(null, { preview: false, controls: false }); }
      if (target.dataset.color) { state.overrides.colors[target.dataset.color] = target.value; settle("선택한 색상을 반영했습니다.", { controls: false }); }
    });
    root.addEventListener("change", (event) => {
      const target = event.target;
      if (target.dataset.color) { renderControls(); return; }
      if (target.hasAttribute("data-interpretation")) { state.interpretation = target.value; settle("AI가 디자인을 해석할 범위를 지침에 반영했습니다.", { preview: false }); return; }
      if (target.dataset.feel) { state.feel[target.dataset.feel] = target.value; settle("느낌을 페이지와 디자인 지침에 반영했습니다."); return; }
      if (target.dataset.component) { state.overrides.components[target.dataset.component] = target.value; settle("요소별 표현을 반영했습니다."); return; }
      if (target.hasAttribute("data-font-pair")) { fontPair = target.value; applyFontPair(); settle("선택한 범위에 서체 조합을 적용했습니다."); return; }
      if (target.dataset.fontScope) { if (target.checked) fontScopes.add(target.dataset.fontScope); else { fontScopes.delete(target.dataset.fontScope); delete state.overrides.typographyScope[target.dataset.fontScope]; } applyFontPair(); settle("서체 적용 범위를 반영했습니다."); return; }
      if (target.dataset.physical) {
        const key = target.dataset.physical;
        state.physicalSpec[key] = key === "bleedMm" ? Number(target.value) : target.value;
        if (key === "sizeId" || key === "orientation") { const dims = SIZES[state.physicalSpec.sizeId] || SIZES.A4; [state.physicalSpec.widthMm, state.physicalSpec.heightMm] = state.physicalSpec.orientation === "landscape" ? [...dims].reverse() : dims; }
        settle("문서의 정확한 규격을 반영했습니다."); renderPageList(); return;
      }
      if (target.dataset.format) { const formats = new Set(state.formats); if (target.checked) formats.add(target.dataset.format); else formats.delete(target.dataset.format); state.formats = [...formats]; settle("제작 형식을 반영했습니다.", { preview: false }); return; }
      if (target.dataset.reference) { if (target.checked) referencePageIds.add(target.dataset.reference); else referencePageIds.delete(target.dataset.reference); if (!referencePageIds.size) { referencePageIds.add(target.dataset.reference); target.checked = true; status("참고 페이지를 하나 이상 선택해 주세요."); } renderReferences(); }
    });
    root.querySelectorAll("dialog").forEach((dialog) => {
      dialog.addEventListener("click", (event) => { if (event.target !== dialog) return; const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); });
      dialog.addEventListener("close", () => { if (dialogReturnFocus?.isConnected) dialogReturnFocus.focus({ preventScroll: true }); });
    });
    const observer = new ResizeObserver(() => requestAnimationFrame(fitAll));
    observer.observe(root);
    window.addEventListener("resize", fitAll, { passive: true });
    let active = isActive();
    const activation = new MutationObserver(() => {
      const next = isActive();
      if (next && !active) {
        if (step === 1) renderGallery();
        if (step === 2) { renderPageList(); renderMain(); }
        if (step === 3) renderReferences();
      }
      active = next;
    });
    if (pane) activation.observe(pane, { attributes: true, attributeFilter: ["class"] });
  }

  mount();
  window.PromptDeckDocumentDesign = Object.freeze({ getState: () => clone(state), build: () => CONTRACT.build(state), generate, applyTheme: selectBundle, applyBundle: selectBundle });
})();
