(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const escape = (text) => String(text ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const enabled = (value) => value === true || value === "true";
  const templateKey = "promptdeck_promotion_templates_v1";
  const labels = { headline: "제목", subheadline: "보조 설명", bodyCopy: "핵심 내용", audience: "대상", goal: "홍보 목적", cta: "참여 유도 문구", posterOffer: "핵심 혜택", snsHook: "시선을 끄는 첫 문장", snsHashtags: "해시태그", layoutComposition: "레이아웃" };
  function node(tag, className, html) {
    const element = document.createElement(tag);
    element.className = className;
    if (html) element.innerHTML = html;
    return element;
  }
  function button(id, text, onClick, className = "gen-btn secondary") {
    const element = node("button", className);
    element.type = "button";
    element.id = id;
    element.textContent = text;
    if (onClick) element.addEventListener("click", onClick);
    return element;
  }
  function sizeLabel(state) {
    if (state.sizeMode === "direct") return `${state.directSizeW || "?"} × ${state.directSizeH || "?"} ${state.directSizeUnit}`;
    const ratio = state.ratio === "custom" ? `${state.customRatioW || "?"}:${state.customRatioH || "?"}` : state.ratio;
    return `${ratio} · ${state.orientation === "horizontal" ? "가로" : "세로"}`;
  }
  function create(api) {
    const root = $("panePromotion");
    root.classList.add("promo-workspace");
    root.dataset.mobileView = "input";
    root.dataset.resultView = "summary";
    const builder = root.querySelector(".promo-builder-section");
    const content = builder.querySelector(".gen-content");
    const result = root.querySelector(".promo-preview-section");
    if (!result.closest(".promo-result-stack")) {
      const stack = node("div", "tab-action-column promo-result-stack");
      result.before(stack);
      stack.append(result);
    }
    let last = null, inputScroll = 0, recommendationKey = "", recommendationTimer, sampleManifestPromise;
    let recommendationRequest = 0;
    let templates = [];
    try { const stored = JSON.parse(localStorage.getItem(templateKey) || "[]"); if (Array.isArray(stored)) templates = stored.filter(t => t && typeof t.name === "string" && t.snapshot).slice(0, 20); } catch { /* Keep the editor available. */ }

    const mobileNav = node("nav", "promo-mobile-nav");
    mobileNav.setAttribute("aria-label", "홍보 이미지 작업 화면");
    mobileNav.append(button("promotionInputViewBtn", "입력", () => setMobileView("input")), button("promotionResultViewBtn", "결과 확인", () => setMobileView("result")));
    mobileNav.firstElementChild.setAttribute("aria-pressed", "true");
    mobileNav.lastElementChild.setAttribute("aria-pressed", "false");
    root.querySelector(".promo-main").prepend(mobileNav);
    function setMobileView(view) {
      if (view === "result") inputScroll = window.scrollY;
      root.dataset.mobileView = view;
      $("promotionInputViewBtn").setAttribute("aria-pressed", String(view === "input"));
      $("promotionResultViewBtn").setAttribute("aria-pressed", String(view === "result"));
      window.PromptDeckTabs?.syncMobileActions();
      if (matchMedia("(max-width: 720px)").matches) {
        window.scrollTo({ top: view === "input" ? inputScroll : 0 });
      } else if (view === "result") result.scrollIntoView({ block: "start", behavior: "smooth" });
    }
    const mobilePrimary = button("promotionMobilePrimaryBtn", "결과 확인", () => root.dataset.mobileView === "result" ? api.copy() : setMobileView("result"));
    mobilePrimary.classList.add("promo-proxy-source");
    root.append(mobilePrimary);

    builder.querySelector("h2").textContent = "홍보 내용 만들기";
    $("promotionAssetBadge").hidden = true;
    $("promotionQuickFillBtn").textContent = "원문으로 채우기";
    const start = $("promotionStepStart"), message = $("promotionStepMessage"), visual = $("promotionStepVisual");
    content.prepend(message);
    message.open = true;
    start.open = false;
    visual.open = true;
    const titleGroup = $("promotionHeadline").closest(".gen-config-group");
    const fields = titleGroup.parentElement;
    const bodyGroup = $("promotionBodyCopy").closest(".gen-config-group");
    const subtitleGroup = $("promotionSubheadline").closest(".gen-config-group");
    fields.prepend(titleGroup, bodyGroup, subtitleGroup);
    $("promotionBodyCopy").rows = 4;
    $("promotionSubheadline").rows = 2;
    $("promotionSubheadline").previousElementSibling.textContent = "제목을 보완하는 설명이나 혜택 문구입니다.";
    $("promotionBodyCopy").previousElementSibling.textContent = "일정·대상·혜택을 한 줄씩 입력하세요. 들여쓰기로 하위 항목을 나눌 수 있습니다.";
    const optional = node("details", "promo-optional-copy", '<summary>추가 문구 · QR 공간</summary><div class="promo-optional-body"></div>');
    message.querySelector(".promo-step-body").append(optional);
    ["promotionCtaSection", "promotionPosterOfferSection", "promotionSnsHookSection", "promotionSnsHashtagsSection"].forEach(id => {
      const element = $(id); if (element) optional.lastElementChild.append(element);
    });
    const qrSection = $("promotionQrEnabled")?.closest(".gen-config-group, .promo-qr-section");
    if (qrSection) optional.lastElementChild.append(qrSection);
    const stepLabels = [
      [message, "1", "홍보 내용", "제목과 핵심 내용을 입력하면 오른쪽 결과에 반영됩니다."],
      [start, "2", "이미지 규격", ""],
      [visual, "3", "비주얼과 배치", "추천 스타일을 비교하거나 세부 배치를 조정하세요."],
    ];
    stepLabels.forEach(([el, number, title, hint]) => {
      el.querySelector(".promo-step-num").textContent = number;
      el.querySelector(".promo-step-copy strong").textContent = title;
      el.querySelector(".promo-step-copy small").textContent = hint;
    });
    root.querySelectorAll(".btn-quick").forEach(btn => {
      const parent = btn.parentElement;
      if (parent.closest(".promo-phrase-examples")) return;
      const details = node("details", "promo-phrase-examples", "<summary>입력 예시</summary>");
      parent.before(details);
      details.append(parent);
    });
    const headActions = builder.querySelector(".promo-section-head-actions");
    $("promotionSampleBtn").textContent = "예시 불러오기";
    headActions.append($("promotionSampleBtn"));
    $("promotionRandomPresetBtn").classList.add("promo-proxy-source");
    ["promotionConceptInstRandomBtn", "promotionConceptInstRandomBtnApplied"].forEach(id => $(id)?.classList.add("promo-proxy-source"));
    $("promotionConceptSelectBtn").textContent = "비주얼 조합에서 선택";
    $("promotionConceptChangeBtn").textContent = "비주얼 조합에서 변경";
    const conceptHint = $("promotionConceptSelectBtn").closest(".promo-basic-concept-panel")?.querySelector("p");
    if (conceptHint) conceptHint.textContent = "추천 스타일을 적용하거나 비주얼 조합에서 직접 골라 보세요.";
    $("promotionSaveBtn").textContent = "작업 파일 저장";
    $("promotionLoadBtn").textContent = "작업 파일 열기";
    $("promotionResetPromptBtn").textContent = "새 설정으로 다시 만들기";
    $("promotionResetPromptBtn").title = "현재 수정본을 자동 초안으로 바꿉니다. 실행 취소할 수 있습니다.";
    visual.querySelector(".promo-layout-composition-panel")?.append($("promotionShuffleLayoutBtn"));
    const undo = button("promotionUndoBtn", "실행 취소", api.undo);
    const stateBar = node("div", "promo-workspace-state");
    stateBar.innerHTML = '<span id="promotionSaveState" role="status"></span>';
    stateBar.append(undo);
    builder.querySelector(".gen-section-head").after(stateBar);
    const status = node("div", "promo-status");
    status.id = "promotionStatus";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    root.append(status);

    const resultHead = node("div", "promo-result-head", '<div><h2>홍보 이미지 구성</h2><p>이미지에 들어갈 내용과 배치를 확인하세요.</p></div>');
    const resultModes = node("div", "promo-result-modes");
    resultModes.setAttribute("aria-label", "결과 보기 방식");
    resultModes.append(button("promotionSummaryViewBtn", "구성 확인", () => setResultView("summary")), button("promotionPromptViewBtn", "프롬프트", () => setResultView("prompt")));
    resultHead.append(resultModes);
    result.prepend(resultHead);
    const editedNotice = node("div", "promo-edited-notice");
    editedNotice.id = "promotionEditedNotice";
    editedNotice.hidden = true;
    editedNotice.innerHTML = '<strong>직접 수정본 사용 중</strong><span>수정한 내용이 복사·저장에 그대로 사용됩니다. 입력 설정을 반영하려면 다시 만들기를 선택하세요.</span>';
    resultHead.after(editedNotice);
    const summary = node("div", "promo-output-summary");
    summary.id = "promotionOutputSummary";
    editedNotice.after(summary);
    const promptBody = root.querySelector(".promo-prompt-body");
    promptBody.setAttribute("aria-label", "실제 복사·전송할 프롬프트");
    promptBody.before(node("p", "promo-prompt-explanation", "이미지 안의 한글 문구는 유지하고, 디자인 지시는 영어로 전달합니다."));
    function setResultView(view) {
      root.dataset.resultView = view;
      $("promotionSummaryViewBtn").setAttribute("aria-pressed", String(view === "summary"));
      $("promotionPromptViewBtn").setAttribute("aria-pressed", String(view === "prompt"));
    }
    setResultView("summary");

    const send = button("promotionSendImageBtn", window.PROMPTDECK_STATIC_MODE ? "복사 후 ChatGPT 열기" : "이미지 생성으로 보내기", async () => {
      if (!window.PROMPTDECK_STATIC_MODE && window.PromptDeckSlideImageGeneration) {
        window.PromptDeckTabs.switchTab("slideImage");
        window.PromptDeckSlideImageGeneration.loadCurrentPrompt();
        api.status("현재 프롬프트를 이미지 생성 탭으로 보냈습니다.", "success");
        return;
      }
      try {
        await navigator.clipboard.writeText(api.getPrompt());
        sendHelp.hidden = false;
        api.status("프롬프트를 복사했습니다. 아래 ChatGPT 열기를 눌러 붙여넣어 주세요.", "success");
      } catch {
        api.status("복사하지 못했습니다. 프롬프트에서 직접 선택해 복사해 주세요.", "error");
        setResultView("prompt");
      }
    });
    const sendHelp = node("div", "promo-send-help", '<p>프롬프트가 복사되었습니다. ChatGPT에 붙여넣고 이미지 생성을 요청하세요.</p><a class="gen-btn secondary" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">ChatGPT 열기 ↗</a>');
    sendHelp.hidden = true;
    resultHead.after(sendHelp);
    resultHead.after(send);
    send.classList.add("promo-proxy-source-desktop");
    send.dataset.proxyLabel = send.textContent;

    const recommendations = node("div", "promo-workspace-recommendations");
    visual.querySelector(".promo-step-body").prepend(recommendations);
    const oldRecommendation = $("promotionRecommendStyleBtn");
    if (oldRecommendation) oldRecommendation.hidden = true;
    $("promotionStyleRecommendPanel")?.classList.add("promo-proxy-source");
    async function refreshRecommendations() {
      const request = ++recommendationRequest;
      const items = api.recommendations().slice(0, 3);
      if (!items.length) return;
      sampleManifestPromise ||= fetch("outputs/mixer_samples/manifest.json").then(r => r.ok ? r.json() : {}).catch(() => ({}));
      const manifest = await sampleManifestPromise;
      if (request !== recommendationRequest) return;
      const key = JSON.stringify(items.map(i => [i.medium.id, i.reason]));
      if (key === recommendationKey) return;
      recommendationKey = key;
      recommendations.replaceChildren(node("p", "promo-recommend-hint", "추천 비주얼 · 문구와 규격은 유지됩니다"));
      const grid = node("div", "promo-recommend-options");
      const presetStore = window.CONCEPT_MIXER_PRESETS;
      for (const item of items) {
        const card = button("", "", () => api.applyRecommendation(item), "promo-recommend-option");
        const source = presetStore?.getCustomSamplesForMed?.(item.medium.id)?.[0] || manifest[item.medium.id]?.[0];
        const safeSource = typeof source === "string" && /^\/?outputs\/mixer_samples\/[\w.\/-]+$/.test(source) ? source : "assets/mixer-placeholder.svg";
        card.innerHTML = `<img src="${escape(safeSource)}" alt="${escape(item.medium.nameKo)} 스타일 참고" loading="lazy"><strong>${escape(item.medium.nameKo)}</strong><span>${escape(item.reason)}</span>`;
        card.querySelector("img").addEventListener("error", e => { if (!e.target.src.endsWith("mixer-placeholder.svg")) e.target.src = "assets/mixer-placeholder.svg"; });
        card.setAttribute("aria-label", `${item.medium.nameKo} 적용: ${item.reason}`);
        grid.append(card);
      }
      recommendations.append(grid);
    }
    document.addEventListener("DOMContentLoaded", refreshRecommendations, { once: true });
    $("tabBtnPromotion").addEventListener("click", refreshRecommendations);

    const reuse = node("details", "promo-workspace-templates", '<summary>이 브라우저의 작업 템플릿</summary><p>현재 문구·스타일·규격·수정본을 함께 저장합니다. 최대 20개.</p><div class="promo-template-new"><input id="promotionTemplateName" type="text" maxlength="60" aria-label="템플릿 이름" placeholder="예: 정기 교육 안내"></div><div id="promotionTemplateList"></div>');
    content.append(reuse);
    reuse.querySelector(".promo-template-new").append(button("promotionTemplateSaveBtn", "템플릿 저장", () => {
      const name = $("promotionTemplateName").value.trim();
      if (!name) { $("promotionTemplateName").focus(); api.status("템플릿 이름을 입력해 주세요.", "info"); return; }
      if (templates.length >= 20) { api.status("템플릿은 20개까지 저장할 수 있습니다.", "info"); return; }
      const next = [...templates, { id: crypto.randomUUID(), name, snapshot: api.getSnapshot() }];
      if (saveTemplates(next)) { $("promotionTemplateName").value = ""; api.status("작업 템플릿을 저장했습니다.", "success"); }
    }));
    function saveTemplates(next) {
      try { localStorage.setItem(templateKey, JSON.stringify(next)); templates = next; renderTemplates(); return true; }
      catch { api.status("저장 공간이 부족합니다. 작업 파일로 저장해 주세요.", "error"); return false; }
    }
    function renderTemplates() {
      const list = $("promotionTemplateList");
      list.replaceChildren();
      if (!templates.length) list.textContent = "저장된 템플릿이 없습니다.";
      templates.forEach((template, index) => {
        const row = node("div", "promo-template-row");
        row.append(button("", template.name, () => { api.applySnapshot(template.snapshot); api.status("템플릿을 새 작업으로 불러왔습니다. 원본 템플릿은 유지됩니다.", "success"); }), button("", "삭제", () => { if (saveTemplates(templates.filter((_, i) => i !== index))) api.status("템플릿을 삭제했습니다. 현재 작업은 유지됩니다.", "info"); }, "gen-btn ghost"));
        row.lastChild.setAttribute("aria-label", `${template.name} 템플릿 삭제`);
        list.append(row);
      });
    }
    renderTemplates();

    root.addEventListener("click", (event) => {
      const target = event.target.closest("[data-promotion-edit]");
      if (!target) return;
      const field = target.dataset.promotionEdit;
      let input = root.querySelector(`[data-promo-field="${field}"]`);
      if (!input) return;
      setMobileView("input");
      let parent = input.parentElement;
      while (parent && parent !== root) { if (parent.tagName === "DETAILS") parent.open = true; parent = parent.parentElement; }
      const mode = root.querySelector(`.promo-copy-mode[aria-label="${labels[field]} 작성 방식"]`);
      if (mode && mode.value !== "manual") { mode.value = "manual"; mode.dispatchEvent(new Event("change", { bubbles: true })); input = root.querySelector(`[data-promo-field="${field}"]`); }
      input.scrollIntoView({ block: "center", behavior: "smooth" });
      input.focus({ preventScroll: true });
    });
    root.addEventListener("input", () => { clearTimeout(recommendationTimer); recommendationTimer = setTimeout(refreshRecommendations, 500); });
    function renameControls(state) {
      root.querySelectorAll("label[for]").forEach(label => {
        const input = $(label.htmlFor);
        const text = labels[input?.dataset.promoField];
        if (!text) return;
        const textNode = [...label.childNodes].find(n => n.nodeType === Node.TEXT_NODE);
        if (textNode && textNode.textContent.trim() !== text) textNode.textContent = text + " ";
      });
      root.querySelectorAll(".promo-ai-placeholder").forEach(el => { if (el.textContent.includes("AI가 자동")) el.textContent = "이미지 생성 시 AI가 작성합니다"; });
      root.querySelectorAll(".promo-section-edit-btn, .promo-section-copy-btn, .promo-section-cancel-btn").forEach(el => {
        const map = { Edit: "편집", Save: "적용", Copy: "복사", Cancel: "취소", "Copied!": "복사됨" };
        if (map[el.textContent]) el.textContent = map[el.textContent];
      });
      root.querySelectorAll(".promo-ai-toggle-enabled[data-toggle-field]").forEach(checkbox => {
        const field = checkbox.dataset.toggleField;
        if (!labels[field]) return;
        const row = checkbox.closest(".gen-config-label-row");
        if (!row) return;
        row.classList.add("promo-unified-choice");
        let select = row.querySelector(".promo-copy-mode");
        if (!select) {
          select = node("select", "gen-select promo-copy-mode");
          select.setAttribute("aria-label", `${labels[field]} 작성 방식`);
          select.innerHTML = '<option value="ai">AI에 맡기기</option><option value="manual">직접 입력</option><option value="off">사용 안 함</option>';
          select.addEventListener("change", () => {
            const value = select.value;
            const currentCheckbox = root.querySelector(`[data-toggle-field="${field}"]`);
            currentCheckbox.checked = value !== "off";
            currentCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
            if (value !== "off") root.querySelector(`[data-toggle-mode="${field}"][data-mode="${value}"]`)?.click();
          });
          row.append(select);
        }
        select.value = !enabled(state[`${field}Enabled`]) ? "off" : state[`${field}Mode`] === "manual" ? "manual" : "ai";
      });
    }
    function render(data) {
      const { state, dirty, canUndo } = data;
      const wasDirty = last?.dirty;
      last = data;
      undo.disabled = !canUndo;
      start.querySelector(".promo-step-copy small").textContent = sizeLabel(state) + " · 펼쳐서 변경";
      editedNotice.hidden = !dirty;
      $("promotionSummaryViewBtn").disabled = dirty;
      if (dirty && !wasDirty) setResultView("prompt");
      if (!dirty && wasDirty) setResultView("summary");
      const blank = ![state.headline, state.goal, state.bodyCopy].some(v => String(v || "").trim());
      root.classList.toggle("promo-workspace-empty", blank);
      const logo = enabled(state.logoEnabled) ? '<span>로고 합성 공간</span>' : "";
      const qrLabels = { auto: "QR 공간 · AI 배치", "top-left": "QR 공간 · 왼쪽 상단", "top-right": "QR 공간 · 오른쪽 상단", "bottom-left": "QR 공간 · 왼쪽 하단", "bottom-right": "QR 공간 · 오른쪽 하단", "inline-info": "QR 공간 · 본문 옆" };
      const qr = enabled(state.qrEnabled) ? `<span>${qrLabels[state.qrPosition] || qrLabels.auto}</span>` : "";
      const qrAtTop = state.qrPosition?.startsWith("top-");
      const topItems = (state.logoPosition === "top" ? logo : "") + (qrAtTop ? qr : "");
      summary.innerHTML = `<div class="promo-summary-spec"><strong>${escape(sizeLabel(state))}</strong><span>${escape(state.appliedConceptName || "기본 비주얼 · AI 배치")}</span></div>
        <div class="promo-composition" data-layout="${escape(state.layoutComposition)}" aria-label="이미지 구성 참고도">
          ${topItems ? `<div class="promo-composition-top">${topItems}</div>` : ""}
          <button type="button" class="promo-composition-title" data-promotion-edit="headline">${escape(state.headline || "제목을 입력해 주세요")}</button>
          <div class="promo-composition-visual" aria-hidden="true"><span>비주얼 공간</span></div>
          <button type="button" class="promo-composition-body" data-promotion-edit="bodyCopy">${escape(state.bodyCopy || "일정 · 대상 · 혜택 등 핵심 내용")}</button>
          <div class="promo-composition-footer">${enabled(state.ctaEnabled) ? `<button type="button" data-promotion-edit="cta">${escape(state.ctaMode === "manual" ? state.cta || "참여 문구 입력" : "참여 문구 · AI 작성")}</button>` : ""}${state.logoPosition !== "top" ? logo : ""}${!qrAtTop ? qr : ""}</div>
        </div><p class="promo-composition-caption">구성 참고도입니다. 실제 생성 이미지와 다를 수 있습니다. 문구를 누르면 수정할 수 있습니다.</p>
        <div class="promo-copy-review">${["headline", "subheadline", "bodyCopy", "posterOffer", "snsHook", "cta", "snsHashtags"].filter(key => !["posterOffer", "snsHook", "cta", "snsHashtags"].includes(key) || enabled(state[`${key}Enabled`])).map(key => {
          const isAi = state[`${key}Mode`] === "ai";
          return `<button type="button" class="promo-copy-review-row" data-promotion-edit="${key}"><strong>${labels[key]}</strong><span>${escape(isAi ? "이미지 생성 시 AI가 작성" : state[key] || "입력하지 않음")}</span><span aria-hidden="true">수정 →</span></button>`;
        }).join("")}</div>`;
      renameControls(state);
      window.PromptDeckTabs?.syncHeaderActionStates();
    }
    function saved(ok) {
      const message = ok ? `이 브라우저에 자동 저장 · ${new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}` : "자동 저장 실패 · 작업 파일로 저장해 주세요";
      if ($("promotionSaveState").textContent !== message) $("promotionSaveState").textContent = message;
    }
    return { render, saved, setMobileView };
  }
  window.PromptDeckPromotionWorkspace = Object.freeze({ create });
})();
