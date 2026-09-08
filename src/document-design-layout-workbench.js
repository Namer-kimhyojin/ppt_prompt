(function () {
  "use strict";
  const catalog = window.PromptDeckDocumentLayouts;
  const resolver = window.PromptDeckDocumentResolver;
  const renderer = window.PromptDeckDocumentRenderer;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  function create({ root, getState, renderFrame, fitAll, apply, selectPage }) {
    root.insertAdjacentHTML("beforeend", `
      <dialog class="dw-dialog dw-layout-dialog" id="dwLayoutDialog" aria-labelledby="dwLayoutTitle">
        <div class="dw-dialog-heading"><div><span class="dw-eyebrow">PAGE LAYOUT</span><h3 id="dwLayoutTitle">페이지 배치</h3></div><button type="button" class="dw-icon-button" data-layout-close aria-label="배치 선택 닫기">×</button></div>
        <div class="dw-layout-scroll"><p class="dw-layout-intro">같은 내용·색상·규격으로 배치만 비교하세요.</p><div class="dw-layout-tabs" id="dwLayoutTabs" role="group" aria-label="배치 후보"></div>
          <div class="dw-layout-compare"><span id="dwLayoutContext"></span><button type="button" class="dw-button dw-subtle" data-layout-action="compare" aria-pressed="false">현재 배치와 비교</button></div>
          <div class="dw-layout-grid" id="dwLayoutGrid" aria-busy="true"></div>
          <p class="dw-help">견본의 내용은 예시입니다. 적용하면 이 페이지의 배치만 저장됩니다.</p>
        </div>
        <div class="dw-dialog-footer"><button type="button" class="dw-button" data-layout-close>취소</button><span id="dwLayoutStatus" role="status" aria-live="polite"></span><button type="button" class="dw-button dw-primary" data-layout-action="apply" disabled>이 배치 적용</button></div>
      </dialog>
      <dialog class="dw-dialog dw-overview-dialog" id="dwOverviewDialog" aria-labelledby="dwOverviewTitle">
        <div class="dw-dialog-heading"><div><span class="dw-eyebrow">DOCUMENT SET</span><h3 id="dwOverviewTitle">문서 세트 전체 보기</h3></div><button type="button" class="dw-icon-button" data-layout-close aria-label="문서 세트 닫기">×</button></div>
        <div class="dw-layout-scroll"><p class="dw-layout-intro" id="dwOverviewMeta"></p><div class="dw-overview-grid" id="dwOverviewGrid" aria-busy="true"></div></div>
        <div class="dw-dialog-footer"><span id="dwOverviewStatus" role="status" aria-live="polite">페이지를 준비하고 있습니다.</span><button type="button" class="dw-button" data-layout-close>닫기</button></div>
      </dialog>`);
    const q = (selector) => root.querySelector(selector);
    const dialog = q("#dwLayoutDialog"), overview = q("#dwOverviewDialog");
    let snapshot, pageId, choices = [], selected = "default", current = "default", compare = false, expanded = false;
    let ticket = 0, overviewTicket = 0;
    const previews = new Map(), overviewPreviews = new Map();
    const openers = new WeakMap();
    function show(target) {
      openers.set(target, document.activeElement);
      target.showModal();
      document.documentElement.classList.add("dw-layout-open");
      target.querySelector(".dw-layout-scroll").scrollTop = 0;
    }
    function refresh() {
      const state = getState();
      const button = q('[data-action="open-layout"]');
      const available = catalog.options(state.bundleId, state.activePageId);
      button.hidden = !available.length;
      button.textContent = "다른 배치 · 3안";
      const note = q("#dwCurrentLayout");
      note.textContent = available.length ? (catalog.get(state.bundleId, state.activePageId, state.pageLayouts?.[state.activePageId] || "default")?.label || "견본 기본 배치") : "";
      note.hidden = !available.length;
    }
    async function draw(host, resolved, id, kind) {
      const rendered = await renderFrame(host, resolved.design, resolved.previewTokens, id, { kind });
      if (!rendered) throw new Error("미리보기를 준비하지 못했습니다.");
      const pages = renderer.paginate(rendered.node);
      if (pages.some((node) => node.dataset.overflow === "true")) throw new Error("이 규격에 배치를 맞추지 못했습니다. 여백이나 규격을 조정해 주세요.");
      rendered.scale.replaceChildren(pages[0]);
      fitAll();
      return { ...rendered, pages, index: 0 };
    }
    function pager(record, id, scope) {
      if (record.pages.length <= 1) return "";
      return `<div class="dw-layout-pager"><button type="button" class="dw-icon-button" data-layout-turn="-1" data-preview-id="${esc(id)}" data-preview-scope="${scope}" aria-label="이전 면">‹</button><span data-page-counter>${record.index + 1} / ${record.pages.length}면</span><button type="button" class="dw-icon-button" data-layout-turn="1" data-preview-id="${esc(id)}" data-preview-scope="${scope}" aria-label="다음 면">›</button></div>`;
    }
    function updateSelection() {
      const active = compare ? current : selected;
      dialog.classList.toggle("is-comparing", compare);
      dialog.classList.toggle("is-expanded", expanded);
      q('[data-layout-action="compare"]').setAttribute("aria-pressed", String(compare));
      q('[data-layout-action="compare"]').textContent = compare ? "후보로 돌아가기" : "현재 배치와 비교";
      q("#dwLayoutContext").textContent = compare ? "적용 중인 배치" : "적용 전 미리보기";
      q("#dwLayoutStatus").textContent = choices.find((item) => item.id === selected)?.label || "";
      dialog.querySelectorAll("[data-layout-choice]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.layoutChoice === selected)));
      dialog.querySelectorAll(".dw-layout-card").forEach((card) => {
        card.dataset.visible = String(card.dataset.layoutId === active);
        card.classList.toggle("is-selected", card.dataset.layoutId === selected);
        const record = previews.get(card.dataset.layoutId);
        if (record) record.frame.dataset.fit = expanded || compare ? "layout-large" : "layout";
        card.querySelector('[data-layout-action="expand"]').textContent = expanded ? "3안 비교" : "크게 보기";
      });
      requestAnimationFrame(fitAll);
    }
    async function open() {
      if (root.querySelector("dialog[open]")) return;
      snapshot = resolver.normalize(clone(getState())); pageId = snapshot.activePageId;
      choices = catalog.options(snapshot.bundleId, pageId);
      if (!choices.length) return;
      current = snapshot.pageLayouts[pageId] || "default"; selected = current; compare = false; expanded = false;
      const run = ++ticket;
      const page = resolver.resolve(snapshot).design.pages.find((item) => item.id === pageId);
      q("#dwLayoutTitle").textContent = `${page.label} 배치`;
      q("#dwLayoutTabs").innerHTML = choices.map((item, index) => `<button type="button" data-layout-choice="${item.id}" aria-pressed="${item.id === selected}"><span>${index + 1}</span>${esc(item.label)}</button>`).join("");
      const grid = q("#dwLayoutGrid");
      grid.setAttribute("aria-busy", "true"); grid.classList.remove("is-ready"); previews.clear();
      grid.innerHTML = choices.map((item) => `<article class="dw-layout-card" data-layout-id="${item.id}"><button type="button" class="dw-layout-preview" data-layout-choice="${item.id}" aria-label="${esc(item.label)} 선택"><span class="dw-layout-sheet"></span></button><div class="dw-layout-card-copy"><button type="button" class="dw-layout-name" data-layout-choice="${item.id}">${esc(item.label)}</button><p>${esc(item.description)}</p><span class="dw-layout-badge">${item.id === current ? "현재 적용 중" : "같은 테마의 다른 배치"}</span></div><div class="dw-layout-card-actions"><button type="button" class="dw-button dw-subtle" data-layout-action="expand" data-layout-id="${item.id}">크게 보기</button></div></article>`).join("");
      q('[data-layout-action="apply"]').disabled = true;
      q("#dwLayoutStatus").textContent = "3개 배치를 준비하고 있습니다.";
      show(dialog);
      try {
        for (const item of choices) {
          if (run !== ticket) return;
          const candidate = resolver.resolve({ ...snapshot, pageLayouts: { ...snapshot.pageLayouts, [pageId]: item.id } });
          const card = grid.querySelector(`[data-layout-id="${item.id}"]`);
          const record = await draw(card.querySelector(".dw-layout-sheet"), candidate, pageId, "layout");
          if (run !== ticket) return;
          previews.set(item.id, record);
          card.querySelector(".dw-layout-card-actions").insertAdjacentHTML("afterbegin", pager(record, item.id, "layout"));
        }
        grid.classList.add("is-ready"); grid.setAttribute("aria-busy", "false");
        q('[data-layout-action="apply"]').disabled = false;
        updateSelection();
      } catch (error) {
        if (run !== ticket) return;
        grid.setAttribute("aria-busy", "false"); grid.classList.add("is-ready");
        q("#dwLayoutStatus").textContent = error.message;
      }
    }
    async function openOverview() {
      if (root.querySelector("dialog[open]")) return;
      const resolved = resolver.resolve(clone(getState()));
      const run = ++overviewTicket;
      const p = resolved.design.physicalSpec;
      q("#dwOverviewMeta").textContent = `${resolved.design.label} · ${p.sizeId} ${p.widthMm} × ${p.heightMm} mm · 현재 색상과 배치가 적용된 예시 문서입니다.`;
      const grid = q("#dwOverviewGrid"); grid.setAttribute("aria-busy", "true"); overviewPreviews.clear();
      grid.innerHTML = resolved.design.pages.map((page, index) => `<article class="dw-overview-card" data-overview-card="${esc(page.id)}"><button type="button" class="dw-layout-preview" data-overview-page="${esc(page.id)}" aria-label="${esc(page.label)} 다듬기"><span class="dw-layout-sheet"></span></button><div class="dw-overview-copy"><strong>${String(index + 1).padStart(2, "0")} · ${esc(page.label)}</strong><span>${esc(page.layout?.label || "견본 기본 배치")}</span><div class="dw-overview-pager"></div><button type="button" class="dw-button dw-wide" data-overview-page="${esc(page.id)}">이 페이지 다듬기</button></div></article>`).join("");
      q("#dwOverviewStatus").textContent = "페이지를 준비하고 있습니다."; show(overview);
      try {
        let total = 0;
        for (const page of resolved.design.pages) {
          if (run !== overviewTicket) return;
          const card = grid.querySelector(`[data-overview-card="${CSS.escape(page.id)}"]`);
          const record = await draw(card.querySelector(".dw-layout-sheet"), resolved, page.id, "overview");
          if (run !== overviewTicket) return;
          total += record.pages.length; overviewPreviews.set(page.id, record);
          card.querySelector(".dw-overview-pager").innerHTML = pager(record, page.id, "overview");
        }
        grid.setAttribute("aria-busy", "false");
        q("#dwOverviewStatus").textContent = `${resolved.design.pages.length}개 페이지 유형 · 총 ${total}면의 예시`;
      } catch (error) { if (run === overviewTicket) { grid.setAttribute("aria-busy", "false"); q("#dwOverviewStatus").textContent = error.message; } }
    }
    for (const target of [dialog, overview]) {
      target.addEventListener("click", (event) => {
        event.stopPropagation();
        const button = event.target.closest("button");
        if (!button) return;
        if (button.hasAttribute("data-layout-close")) { target.close(); return; }
        if (button.dataset.layoutChoice) { selected = button.dataset.layoutChoice; compare = false; updateSelection(); return; }
        if (button.dataset.overviewPage) { target.close(); selectPage(button.dataset.overviewPage); return; }
        if (button.dataset.layoutTurn) {
          const record = (button.dataset.previewScope === "layout" ? previews : overviewPreviews).get(button.dataset.previewId);
          if (!record) return;
          record.index = (record.index + Number(button.dataset.layoutTurn) + record.pages.length) % record.pages.length;
          record.scale.replaceChildren(record.pages[record.index]); fitAll();
          button.closest(".dw-layout-pager").querySelector("[data-page-counter]").textContent = `${record.index + 1} / ${record.pages.length}면`;
          return;
        }
        const action = button.dataset.layoutAction;
        if (action === "compare") { compare = !compare; updateSelection(); }
        if (action === "expand") { if (compare) compare = false; selected = button.dataset.layoutId; expanded = !expanded; updateSelection(); }
        if (action === "apply" && !button.disabled) { const id = selected; target.close(); apply(pageId, id); }
      });
      target.addEventListener("close", () => {
        if (target === dialog) { ++ticket; previews.clear(); q("#dwLayoutGrid").replaceChildren(); }
        else { ++overviewTicket; overviewPreviews.clear(); q("#dwOverviewGrid").replaceChildren(); }
        document.documentElement.classList.remove("dw-layout-open");
        const opener = openers.get(target);
        if (opener?.isConnected) opener.focus({ preventScroll: true });
      });
    }
    refresh();
    return Object.freeze({ open, openOverview, refresh });
  }
  window.PromptDeckDocumentLayoutWorkbench = Object.freeze({ create });
})();
