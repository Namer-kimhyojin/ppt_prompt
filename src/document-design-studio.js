(function () {
  "use strict";
  const resolver = window.PromptDeckDocumentResolver, renderer = window.PromptDeckDocumentRenderer;
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const scopes = [["heading", "제목"], ["body", "본문"], ["numeral", "숫자"], ["table", "표"], ["caption", "캡션"], ["quote", "인용"]];
  const groups = {
    fonts: { label: "서체", kinds: ["body", "message", "concept", "theory"], options: [["default", "견본 기본", "세트에 맞춰 설계된 서체"], ["sans", "명료한 고딕", "정보와 수치를 또렷하게"], ["serif", "차분한 명조", "긴 글에 차분한 인상"], ["mixed", "고딕 + 명조", "제목·숫자는 고딕, 나머지는 명조"]] },
    tableStyle: { label: "표", kinds: ["table", "data-question", "answers"], options: [["rules", "가로선", "행의 흐름을 얇은 선으로"], ["striped", "교차 음영", "많은 항목을 한 줄씩 읽기"], ["plain", "간결한 무테", "여백과 정렬로 구분"]] },
    chartType: { label: "차트", kinds: ["chart", "data-question"], options: [["bar", "비교", "항목의 차이를 막대로"], ["line", "추세", "연속된 변화를 선으로"], ["donut", "구성비", "전체와 부분의 관계를 면으로"]] },
    backgroundStyle: { label: "배경", kinds: ["cover"], options: [["wash", "단색 면", "배경을 차분하게 통일"], ["band", "색 띠", "가장자리의 색으로 연결"], ["frame", "가는 테두리", "지면의 바깥을 단정하게"], ["grid", "옅은 격자", "작은 패턴으로 정돈된 인상"]] },
    iconStyle: { label: "안내 아이콘", kinds: ["diagram", "roadmap", "example", "activity"], options: [["line", "선형", "가벼운 원형 윤곽"], ["solid", "면형", "주색으로 채운 안내 표식"], ["square", "사각 배지", "각진 틀로 또렷하게"]] },
    imageStyle: { label: "이미지", kinds: ["image", "dialogue", "spread-left"], options: [["original", "원본 색감", "사진·삽화의 색을 유지"], ["muted", "차분한 색감", "바탕색과 부드럽게 연결"]] },
    diagramStyle: { label: "도식", kinds: ["diagram"], options: [["flow", "흐름", "순서대로 연결된 단계"], ["hierarchy", "계층", "상위와 하위 관계"]] },
    density: { label: "분량 점검", kinds: [], options: [["standard", "기본 분량", "같은 견본 내용"], ["short", "짧은 글", "간결한 문단"], ["long", "긴 글", "여러 면으로 이어지는 본문"], ["title", "긴 제목", "긴 한글 제목의 줄바꿈"], ["table", "많은 표 행", "머리행 반복과 다음 면 연결"]] },
  };
  function choiceState(input, group, value, selectedScopes = scopes.map(([id]) => id)) {
    const state = resolver.normalize(input);
    if (group === "fonts" && value === "current") return state;
    if (!groups[group]?.options.some(([id]) => id === value)) return state;
    if (group === "fonts") {
      for (const key of selectedScopes.filter((id) => scopes.some(([s]) => s === id))) {
        if (value === "default") { delete state.overrides.typographyScope[key]; if (["heading", "body"].includes(key)) delete state.overrides.fonts[key]; }
        else state.overrides.typographyScope[key] = value === "serif" || (value === "mixed" && !["heading", "numeral"].includes(key)) ? "Noto Serif KR" : "Noto Sans KR";
      }
    } else if (group !== "density") state.overrides.components[group] = value;
    return resolver.normalize(state);
  }
  function create({ root, getState, renderFrame, fitAll, apply }) {
    root.insertAdjacentHTML("beforeend", `<dialog id="dwStudioDialog" class="dw-dialog dw-studio-dialog" aria-labelledby="dwStudioTitle"><div class="dw-dialog-heading"><div><span class="dw-eyebrow">DESIGN DETAILS</span><h3 id="dwStudioTitle">요소 견본으로 고르기</h3></div><button type="button" class="dw-icon-button" data-studio-close aria-label="요소 견본 닫기">×</button></div><div class="dw-studio-scroll"><div class="dw-studio-tabs" id="dwStudioTabs" role="group" aria-label="비교할 요소"></div><p class="dw-help" id="dwStudioHint"></p><div id="dwStudioScopes"></div><div class="dw-studio-options" id="dwStudioOptions" role="group" aria-label="표현 선택"></div><div class="dw-studio-preview-heading"><label>확인할 페이지 <select id="dwStudioPage" aria-label="요소를 확인할 페이지"></select></label><button type="button" class="dw-button" data-studio-compare aria-pressed="false">현재 디자인과 비교</button></div><div id="dwStudioSpecimen"></div><div id="dwStudioPreview" class="dw-studio-canvas" aria-busy="false"></div><div class="dw-studio-pager"><button type="button" class="dw-button" data-studio-turn="-1" aria-label="이전 면">이전 면</button><span id="dwStudioCount"></span><button type="button" class="dw-button" data-studio-turn="1" aria-label="다음 면">다음 면</button></div></div><div class="dw-dialog-footer"><button type="button" class="dw-button" data-studio-close>닫기</button><span id="dwStudioStatus" role="status"></span><button type="button" class="dw-button dw-primary" data-studio-apply>선택 적용</button></div></dialog>`);
    const q = (s) => root.querySelector(s), dialog = q("#dwStudioDialog");
    q(".dw-studio-preview-heading").insertAdjacentHTML("beforeend", '<button type="button" class="dw-button" data-studio-zoom aria-pressed="false">견본 전체 보기</button>');
    const workspace = document.createElement("div"), settings = document.createElement("div"), previewColumn = document.createElement("div");
    workspace.className = "dw-studio-workspace"; settings.className = "dw-studio-settings";
    ["#dwStudioScopes", "#dwStudioOptions", "#dwStudioSpecimen"].forEach((id) => settings.append(q(id)));
    [".dw-studio-preview-heading", "#dwStudioPreview", ".dw-studio-pager"].forEach((id) => previewColumn.append(q(id)));
    workspace.append(settings, previewColumn); q(".dw-studio-scroll").append(workspace);
    let snapshot, draft, group = "fonts", selected, pageId, available, compare = false, ticket = 0, opener, record, index = 0;
    let selectedScopes = scopes.map(([id]) => id);
    const message = (text) => { q("#dwStudioStatus").textContent = text; };
    function options() {
      const pages = resolver.resolve(snapshot).design.pages;
      if (group === "fonts") return [["current", "현재 서체", "저장된 개별 범위를 그대로"], ...groups.fonts.options];
      return groups[group].options.filter(([id]) => group !== "density" || id !== "table" || pages.some((p) => ["table", "data-question"].includes(p.kind)));
    }
    function targetPage() {
      const pages = resolver.resolve(snapshot).design.pages;
      const kinds = group === "density" ? selected === "table" ? ["table", "data-question"] : selected === "title" ? ["cover"] : ["body", "message", "concept", "theory"] : groups[group].kinds;
      if (group === "backgroundStyle") {
        const scope = resolver.resolve(draft).design.componentStyles.backgroundScope;
        if (scope === "chapter") return pages.find((p) => p.kind === "chapter")?.id || pages[0].id;
      }
      return pages.find((p) => kinds.includes(p.kind))?.id || pages[0].id;
    }
    function controls() {
      q("#dwStudioTabs").innerHTML = available.map((key) => `<button type="button" class="dw-button" data-studio-group="${key}" aria-pressed="${key === group}">${groups[key].label}</button>`).join("");
      q("#dwStudioOptions").innerHTML = options().map(([id, label, hint]) => `<button type="button" data-studio-choice="${id}" aria-pressed="${id === selected}"><strong>${label}</strong><span>${hint}</span></button>`).join("");
      q("#dwStudioHint").textContent = group === "density" ? "분량을 달리한 예시로 줄바꿈과 페이지 나눔을 확인하세요. 이 예시는 저장·지침·참고 이미지에 포함되지 않습니다." : "같은 문서에 표현만 바꿔 비교합니다. 적용 전에는 현재 디자인이 바뀌지 않습니다.";
      q("#dwStudioScopes").innerHTML = group === "fonts" ? `<fieldset class="dw-studio-scope"><legend>서체를 바꿀 범위</legend>${scopes.map(([id, label]) => `<label class="dw-check"><input type="checkbox" data-studio-scope="${id}" ${selectedScopes.includes(id) ? "checked" : ""}>${label}</label>`).join("")}</fieldset>` : group === "backgroundStyle" ? `<label class="dw-studio-scope">배경 적용 범위 <select data-studio-background aria-label="배경 적용 범위">${[["none", "없음"], ["cover", "표지"], ["chapter", "표지·장"], ["all", "전체"]].map(([id, label]) => `<option value="${id}" ${resolver.resolve(draft).design.componentStyles.backgroundScope === id ? "selected" : ""}>${label}</option>`).join("")}</select></label>` : "";
      q("#dwStudioPage").innerHTML = resolver.resolve(snapshot).design.pages.map((p) => `<option value="${esc(p.id)}" ${p.id === pageId ? "selected" : ""}>${esc(p.label)}</option>`).join("");
      q("[data-studio-apply]").hidden = group === "density";
      q("[data-studio-compare]").hidden = group === "density";
      q("#dwStudioTitle").textContent = group === "density" ? "내용량에 따른 지면 점검" : "요소 견본으로 고르기";
    }
    function selectGroup(key) {
      group = key; draft = clone(snapshot); compare = false;
      selected = key === "fonts" ? "current" : key === "density" ? "standard" : resolver.resolve(snapshot).design.componentStyles[key];
      // The initial font view shows the actual saved scopes, including custom mixtures.
      pageId = targetPage(); controls(); draw();
    }
    function pager() {
      if (!record) return;
      record.scale.replaceChildren(record.pages[index]);
      q("#dwStudioCount").textContent = `${index + 1} / ${record.pages.length}면`;
      q('[data-studio-turn="-1"]').disabled = index === 0;
      q('[data-studio-turn="1"]').disabled = index === record.pages.length - 1;
      fitAll();
    }
    async function draw() {
      const run = ++ticket, host = q("#dwStudioPreview"); record = null; index = 0;
      host.replaceChildren(); host.setAttribute("aria-busy", "true"); q("[data-studio-apply]").disabled = true;
      q("[data-studio-compare]").setAttribute("aria-pressed", String(compare));
      q("[data-studio-compare]").textContent = compare ? "선택안으로 돌아가기" : "현재 디자인과 비교";
      message("미리보기 준비 중…");
      const result = resolver.resolve(compare ? snapshot : draft);
      const specimen = q("#dwStudioSpecimen"); specimen.replaceChildren();
      if (group === "fonts") {
        specimen.className = "dw-font-specimen";
        for (const [id, label] of scopes) {
          const cell = document.createElement("div"), caption = document.createElement("small"), example = document.createElement("span");
          caption.textContent = `${label} · ${result.design.typographyScope[id]}`;
          example.textContent = { heading: "변화를 읽는 새로운 시선", body: "정보의 흐름을 편안하게 따라 읽습니다.", numeral: "128,400 · 72.8%", table: "구분　운영 내용　진행 상태", caption: "그림 1. 기록과 공간의 관계", quote: "“작은 차이가 새로운 인상을 만듭니다.”" }[id];
          example.style.fontFamily = `"${result.design.typographyScope[id]}"`;
          cell.append(caption, example); specimen.append(cell);
        }
      } else specimen.className = "";
      try {
        const sampleContent = group === "density" ? window.PromptDeckDocumentSamples.get(result.design.familyId, selected) : undefined;
        const rendered = await renderFrame(host, result.design, result.previewTokens, pageId, { kind: "studio", sampleContent });
        if (run !== ticket || !dialog.open || !rendered) return;
        const pages = renderer.paginate(rendered.node);
        record = { ...rendered, pages }; pager();
        const overflow = pages.some((p) => p.dataset.overflow === "true");
        q("[data-studio-apply]").disabled = overflow || (group === "fonts" && !selectedScopes.length);
        message(overflow ? "일부 내용이 지면을 넘습니다. 여백이나 규격을 조정해 주세요." : group === "density" ? "화면 점검용 · 디자인 설정은 유지됩니다." : group === "backgroundStyle" && result.design.componentStyles.backgroundScope === "none" ? "배경 범위가 ‘없음’입니다. 적용 범위를 선택해 보세요." : compare ? "적용 중인 디자인" : "선택한 표현 미리보기");
      } catch (error) { if (run === ticket) message(error.message || "미리보기를 준비하지 못했습니다."); }
      finally { if (run === ticket) host.setAttribute("aria-busy", "false"); }
    }
    dialog.addEventListener("click", (event) => {
      const button = event.target.closest("button"); if (!button) return;
      if (button.hasAttribute("data-studio-close")) return dialog.close();
      if (button.hasAttribute("data-studio-zoom")) {
        const focused = dialog.classList.toggle("is-focused");
        button.textContent = focused ? "선택 항목 다시 보기" : "견본 전체 보기";
        button.setAttribute("aria-pressed", String(focused));
        q(".dw-studio-scroll").scrollTop = 0; fitAll(); return;
      }
      if (button.dataset.studioGroup) return selectGroup(button.dataset.studioGroup);
      if (button.dataset.studioChoice) {
        selected = button.dataset.studioChoice; compare = false;
        const scope = draft.overrides.components.backgroundScope;
        draft = choiceState(snapshot, group, selected, selectedScopes);
        if (scope !== undefined) draft.overrides.components.backgroundScope = scope;
        if (group === "density") pageId = targetPage();
        controls(); return draw();
      }
      if (button.hasAttribute("data-studio-compare")) { compare = !compare; return draw(); }
      if (button.dataset.studioTurn && record) { index = Math.max(0, Math.min(record.pages.length - 1, index + Number(button.dataset.studioTurn))); return pager(); }
      if (button.hasAttribute("data-studio-apply") && !button.disabled && group !== "density") { apply(clone(draft)); dialog.close(); }
    });
    dialog.addEventListener("change", (event) => {
      const t = event.target;
      if (t.id === "dwStudioPage") { pageId = t.value; draw(); }
      if (t.dataset.studioScope) { selectedScopes = [...dialog.querySelectorAll("[data-studio-scope]:checked")].map((n) => n.dataset.studioScope); draft = choiceState(snapshot, group, selected, selectedScopes); compare = false; draw(); }
      if (t.hasAttribute("data-studio-background")) { draft.overrides.components.backgroundScope = t.value; pageId = targetPage(); controls(); compare = false; draw(); }
    });
    dialog.addEventListener("close", () => { ++ticket; document.documentElement.classList.remove("dw-studio-open"); if (opener?.isConnected) opener.focus({ preventScroll: true }); });
    return { open(key = "fonts") {
      snapshot = clone(getState()); selectedScopes = scopes.map(([id]) => id);
      const pages = resolver.resolve(snapshot).design.pages;
      available = Object.keys(groups).filter((id) => ["fonts", "backgroundStyle", "density"].includes(id) || pages.some((p) => groups[id].kinds.includes(p.kind)));
      opener = document.activeElement; dialog.showModal(); document.documentElement.classList.add("dw-studio-open");
      dialog.classList.remove("is-focused"); q("[data-studio-zoom]").textContent = "견본 전체 보기"; q("[data-studio-zoom]").setAttribute("aria-pressed", "false");
      selectGroup(available.includes(key) ? key : "fonts"); q(".dw-studio-scroll").scrollTop = 0;
    } };
  }
  window.PromptDeckDocumentStudio = Object.freeze({ create, choiceState, groups });
})();
