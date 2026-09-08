(function () {
  "use strict";
  const catalog = window.PromptDeckDocumentPalettes;
  const resolver = window.PromptDeckDocumentResolver;
  if (!catalog || !resolver) return;
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function swatches(colors) { return `<span class="dw-palette-swatches" aria-hidden="true">${["primary", "secondary", "accent", "background", "text"].map((key) => `<i style="background:${colors[key]}"></i>`).join("")}</span>`; }
  function summary(state) {
    const resolved = resolver.resolve(state);
    return `<div class="dw-palette-summary"><span>색상 조합</span><strong>${esc(resolved.design.colorScheme.label)}${Object.keys(state.overrides.colors).length ? " · 맞춤" : ""}</strong>${swatches(resolved.design.palette)}<button type="button" class="dw-button dw-wide" data-action="open-palette">색상 조합 변경</button></div>`;
  }
  function create({ root, getState, apply, renderFrame, fitAll }) {
    const dialog = document.createElement("dialog");
    dialog.id = "dwPaletteDialog";
    dialog.className = "dw-dialog dw-palette-dialog";
    dialog.setAttribute("aria-labelledby", "dwPaletteTitle");
    dialog.innerHTML = `<div class="dw-dialog-heading"><div><span class="dw-eyebrow">DOCUMENT COLORS</span><h3 id="dwPaletteTitle">색상 조합</h3><p>표지부터 본문까지, 한 조합으로 맞추세요.</p></div><button type="button" class="dw-icon-button" data-pal-action="cancel" aria-label="색상 조합 닫기">×</button></div>
      <div class="dw-palette-scroll"><div class="dw-palette-layout"><section class="dw-palette-browser" aria-label="색상 템플릿"><div class="dw-palette-filters" role="group" aria-label="색상 조합 분류">${[["recommended", "추천"], ["all", "전체 24"], ...catalog.groups].map(([id, label]) => `<button type="button" data-pal-filter="${id}" aria-pressed="false">${label}</button>`).join("")}</div><p id="dwPaletteGalleryNote" class="dw-help"></p><div id="dwPaletteGrid" class="dw-palette-grid"></div></section>
      <section class="dw-palette-preview" aria-label="선택한 조합 미리보기"><div class="dw-palette-preview-heading"><div><span class="dw-eyebrow">적용 전 미리보기</span><h4 id="dwPaletteName"></h4></div><button type="button" class="dw-button dw-subtle" data-pal-action="original" aria-pressed="false">현재 색상과 비교</button></div><div class="dw-palette-preview-tools"><p id="dwPalettePreviewNote" class="dw-help">페이지를 누르면 크게 볼 수 있어요.</p><button type="button" class="dw-button dw-subtle" data-pal-action="set-view" hidden>세트 보기</button></div><div id="dwPalettePages" class="dw-palette-pages" aria-busy="false"></div><div id="dwPaletteStatus" class="dw-palette-status" role="status" aria-live="polite"></div><div id="dwPaletteAdjustments"></div></section></div></div>
      <div class="dw-dialog-footer"><button type="button" class="dw-button" data-pal-action="cancel">취소</button><span id="dwPaletteSelection" aria-live="polite"></span><button type="button" class="dw-button dw-primary" data-pal-action="apply">이 조합 적용</button></div>`;
    root.append(dialog);
    const adjustments = dialog.querySelector("#dwPaletteAdjustments");
    const settings = document.createElement("details"); settings.className = "dw-palette-settings";
    settings.innerHTML = '<summary>세부 조정 <span>느낌 · 직접 색상 · 색상 유지</span></summary>';
    adjustments.replaceWith(settings); settings.append(adjustments);
    const mobile = matchMedia("(max-width: 800px)");
    mobile.addEventListener("change", () => { if (dialog.open && !mobile.matches) settings.open = true; });
    let draft, original, filter = "recommended", compare = false, focusPage = "", ticket = 0, gridTicket = 0, observer, returnToControls = false, opener;
    const q = (selector) => dialog.querySelector(selector);
    const bundle = () => window.PromptDeckDocumentBundles.get(draft.bundleId);
    function pages() {
      const available = bundle().pages;
      const candidates = [available[0], available.find((p) => p.id === "body" || p.id === "message") || available[1], available.find((p) => p.kind === "chart") || available.find((p) => ["table", "diagram", "quote", "dialogue"].includes(p.kind)) || available[2]];
      return [...new Map(candidates.filter(Boolean).map((p) => [p.id, p])).values()];
    }
    function updateAdjustments() {
      const resolved = resolver.resolve(draft);
      const field = (key, label, options, value, attr = "data-pal-feel") => `<fieldset class="dw-field"><legend>${label}</legend><div class="dw-segmented">${options.map(([id, title]) => `<label><input type="radio" name="palette-${key}" ${attr}="${key}" value="${id}" ${id === value ? "checked" : ""}><span>${title}</span></label>`).join("")}</div></fieldset>`;
      q("#dwPaletteAdjustments").innerHTML = `<details class="dw-palette-details"><summary>느낌 다듬기 <span>선택 사항</span></summary><div>${catalog.fields.map((f) => field(f.key, f.label, f.options, draft.colorFeel[f.key])).join("")}${field("colorPresence", "색의 존재감", [["low", "차분하게"], ["balanced", "균형 있게"], ["high", "선명하게"]], draft.feel.colorPresence, "data-pal-presence")}<p class="dw-help">색이 차지하는 면적과 강조 정도를 조절합니다. 바깥의 ‘색의 존재감’과 함께 저장됩니다.</p></div></details>
        <details class="dw-palette-details"><summary>직접 색상 지정 <span>8가지 역할</span></summary><div class="dw-palette-colors">${catalog.roles.map(([key, label]) => `<label>${label}<input type="color" data-pal-color="${key}" aria-label="${label}" value="${resolved.design.palette[key]}"></label>`).join("")}</div><p class="dw-help">직접 지정한 색은 느낌을 바꿔도 유지됩니다.</p><button type="button" class="dw-button dw-subtle" data-pal-action="clear-custom">직접 지정 해제</button></details>
        <label class="dw-check dw-palette-keep"><input type="checkbox" data-pal-keep ${draft.keepPaletteOnBundleChange ? "checked" : ""}>견본을 바꿔도 이 색상 유지</label><button type="button" class="dw-button dw-subtle" data-pal-action="reset">견본 기본 색상으로 복구</button>`;
    }
    function refreshInputs() {
      const colors = resolver.resolve(draft).design.palette;
      q("#dwPaletteAdjustments").querySelectorAll("[data-pal-color]").forEach((input) => { if (input !== document.activeElement) input.value = colors[input.dataset.palColor]; });
    }
    async function preview() {
      if (!dialog.open) return;
      const currentTicket = ++ticket, value = resolver.resolve(compare ? original : draft), host = q("#dwPalettePages");
      q("#dwPaletteName").textContent = `${compare ? "현재 적용된 색상" : value.design.colorScheme.label}${!compare && Object.keys(draft.overrides.colors).length ? " · 맞춤" : ""}`;
      q("#dwPaletteSelection").textContent = resolver.resolve(draft).design.colorScheme.label;
      q('[data-pal-action="original"]').setAttribute("aria-pressed", String(compare));
      q('[data-pal-action="original"]').textContent = compare ? "선택한 조합 보기" : "현재 색상과 비교";
      q('[data-pal-action="set-view"]').hidden = !focusPage;
      q("[data-pal-table]")?.remove();
      const table = bundle().pages.find((p) => p.kind === "table");
      if (table && focusPage !== table.id) {
        const button = document.createElement("button"); button.type = "button"; button.className = "dw-button dw-subtle"; button.dataset.palTable = ""; button.dataset.palPage = table.id; button.textContent = "표 확인"; q(".dw-palette-preview-tools").append(button);
      }
      q("#dwPalettePreviewNote").textContent = compare ? "현재 저장된 색상입니다. 적용 버튼은 선택한 새 조합을 저장합니다." : "페이지를 누르면 크게 볼 수 있어요.";
      q("#dwPaletteStatus").textContent = value.issues.map((issue) => issue.message).join(" ") || "이 화면에서 시험 적용 중입니다. 적용을 누르면 저장됩니다.";
      q("#dwPaletteStatus").classList.toggle("has-warning", value.issues.length > 0);
      host.classList.toggle("is-expanded", !!focusPage);
      host.setAttribute("aria-busy", "true"); host.replaceChildren();
      const chosen = focusPage ? bundle().pages.filter((p) => p.id === focusPage) : pages();
      for (const page of chosen) {
        if (currentTicket !== ticket || !dialog.open) return;
        const cell = document.createElement("button"); cell.type = "button"; cell.className = "dw-palette-page"; cell.dataset.palPage = page.id;
        cell.setAttribute("aria-label", `${page.label} ${focusPage ? "세트로 보기" : "크게 보기"}`);
        cell.innerHTML = `<span class="dw-palette-canvas"></span><span>${esc(page.label)}</span>`; host.append(cell);
        await renderFrame(cell.firstElementChild, value.design, value.previewTokens, page.id, { kind: focusPage ? "palette-large" : "palette" });
      }
      if (currentTicket === ticket) { host.setAttribute("aria-busy", "false"); fitAll(); }
    }
    async function drawCard(card, preset, generation) {
      if (generation !== gridTicket || !dialog.open) return;
      const value = resolver.resolve({ ...original, colorPresetId: preset.id, colorFeel: catalog.defaultFeel, overrides: { ...original.overrides, colors: {} } });
      for (const page of pages()) {
        if (generation !== gridTicket || !card.isConnected || !dialog.open) return;
        const cell = document.createElement("span"); card.querySelector(".dw-palette-card-pages").append(cell);
        await renderFrame(cell, value.design, value.previewTokens, page.id, { kind: "palette-card" });
      }
      if (generation === gridTicket) card.dataset.ready = "true";
    }
    function gallery() {
      observer?.disconnect(); const generation = ++gridTicket;
      const shown = filter === "recommended" ? catalog.recommended(draft.familyId) : catalog.presets.filter((p) => filter === "all" || p.group === filter);
      dialog.querySelectorAll("[data-pal-filter]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.palFilter === filter)));
      q("#dwPaletteGalleryNote").textContent = `${filter === "recommended" ? "현재 문서에 어울리는" : ""} ${shown.length}개 조합 · 같은 문서로 비교하세요.`;
      q("#dwPaletteGrid").innerHTML = shown.map((p) => `<button type="button" class="dw-palette-card" data-pal-preset="${p.id}" aria-pressed="${draft.colorPresetId === p.id}"><span class="dw-palette-card-pages" aria-hidden="true"></span><span class="dw-palette-card-info"><strong>${p.label}</strong><span>${p.tags.join(" · ")}</span>${swatches(p.colors)}<b class="dw-palette-selected">선택</b></span></button>`).join("");
      let queue = Promise.resolve();
      observer = new IntersectionObserver((entries) => { for (const entry of entries) if (entry.isIntersecting) { observer.unobserve(entry.target); queue = queue.then(() => drawCard(entry.target, catalog.get(entry.target.dataset.palPreset), generation)).catch(() => { entry.target.dataset.ready = "error"; }); } }, { root: q(".dw-palette-scroll"), rootMargin: "180px" });
      dialog.querySelectorAll("[data-pal-preset]").forEach((card) => observer.observe(card));
    }
    function changed(rebuild = false) {
      compare = false;
      if (rebuild) updateAdjustments(); else refreshInputs();
      dialog.querySelectorAll("[data-pal-preset]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.palPreset === draft.colorPresetId)));
      preview();
    }
    function close() { if (dialog.open) dialog.close(); }
    dialog.addEventListener("click", (event) => {
      event.stopPropagation();
      const b = event.target.closest("button");
      if (!b) return;
      if (b.dataset.palFilter) { filter = b.dataset.palFilter; gallery(); return; }
      if (b.dataset.palPreset) { draft.colorPresetId = b.dataset.palPreset; draft.colorBaseBundleId = ""; draft.colorFeel = { ...catalog.defaultFeel }; draft.overrides.colors = {}; changed(true); if (matchMedia("(max-width: 800px)").matches) q(".dw-palette-scroll").scrollTo({ top: 0, behavior: "instant" }); return; }
      if (b.dataset.palPage) { focusPage = focusPage === b.dataset.palPage ? "" : b.dataset.palPage; preview(); return; }
      const action = b.dataset.palAction;
      if (action === "cancel") close();
      if (action === "apply") { apply(clone(draft)); close(); }
      if (action === "original") { compare = !compare; preview(); }
      if (action === "set-view") { focusPage = ""; preview(); }
      if (action === "clear-custom") { draft.overrides.colors = {}; changed(true); }
      if (action === "reset") { draft.colorPresetId = ""; draft.colorBaseBundleId = ""; draft.colorFeel = { ...catalog.defaultFeel }; draft.overrides.colors = {}; draft.feel.colorPresence = bundle().defaultFeel.colorPresence; changed(true); }
    });
    dialog.addEventListener("input", (event) => {
      event.stopPropagation(); const input = event.target;
      if (input.dataset.palColor) { draft.overrides.colors[input.dataset.palColor] = input.value; changed(); }
    });
    dialog.addEventListener("change", (event) => {
      event.stopPropagation(); const input = event.target;
      if (input.dataset.palFeel) { draft.colorFeel[input.dataset.palFeel] = input.value; changed(); }
      if (input.dataset.palPresence) { draft.feel.colorPresence = input.value; changed(); }
      if (input.hasAttribute("data-pal-keep")) draft.keepPaletteOnBundleChange = input.checked;
    });
    dialog.addEventListener("close", () => {
      ++ticket; ++gridTicket; observer?.disconnect(); q("#dwPaletteGrid").replaceChildren(); q("#dwPalettePages").replaceChildren();
      document.documentElement.classList.remove("dw-palette-open");
      if (returnToControls) { const controls = root.querySelector("#dwControlDialog"); if (!controls.open) controls.showModal(); controls.querySelector('[data-action="open-palette"]')?.focus({ preventScroll: true }); }
      else (root.querySelector('#dwDesktopControls [data-action="open-palette"]') || opener)?.focus({ preventScroll: true });
    });
    return Object.freeze({ open() {
      if (dialog.open) return;
      original = clone(getState()); draft = clone(original); filter = "recommended"; compare = false; focusPage = "";
      settings.open = !matchMedia("(max-width: 800px)").matches;
      opener = document.activeElement; returnToControls = !!root.querySelector("#dwControlDialog").open;
      if (returnToControls) root.querySelector("#dwControlDialog").close();
      updateAdjustments(); dialog.showModal(); document.documentElement.classList.add("dw-palette-open");
      q(".dw-palette-scroll").scrollTop = 0; gallery(); preview();
    } });
  }
  window.PromptDeckDocumentPaletteModal = Object.freeze({ create, summary });
})();
