(function () {
  "use strict";
  const catalog = window.PromptDeckDocumentHierarchy, resolver = window.PromptDeckDocumentResolver;
  if (!catalog || !resolver) return;
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function summary(state) {
    const h = catalog.normalize(state.hierarchy);
    return `<div class="dw-hierarchy-summary"><div><strong>번호·기호 위계 <span>선택 사항</span></strong><p>${esc(catalog.sequence(h))}</p></div><button type="button" class="dw-button" data-action="open-hierarchy" aria-haspopup="dialog">${catalog.enabled(h) ? "위계 조정" : "위계 선택"}</button></div>`;
  }
  function create({ root, getState, apply }) {
    root.insertAdjacentHTML("beforeend", `<dialog id="dwHierarchyDialog" class="dw-dialog dw-hierarchy-dialog" aria-labelledby="dwHierarchyTitle"><div class="dw-dialog-heading"><div><span class="dw-eyebrow">OPTIONAL STYLE</span><h3 id="dwHierarchyTitle">번호·기호로 위계 정하기</h3></div><button type="button" class="dw-icon-button" data-hierarchy-close aria-label="번호·기호 설정 닫기">×</button></div><div class="dw-hierarchy-scroll"><p class="dw-help">필요할 때만 선택하세요. 원문에 있는 제목과 항목의 표식을 정합니다.</p><div class="dw-hierarchy-workspace"><div class="dw-hierarchy-settings"><div id="dwHierarchyPresets" class="dw-hierarchy-presets" role="group" aria-label="번호·기호 체계"></div><div id="dwHierarchyAdjustments"><fieldset class="dw-field"><legend>적용 범위</legend><div id="dwHierarchyScope" class="dw-segmented"></div></fieldset><details class="dw-control-details"><summary>단계별 표식 바꾸기</summary><div class="dw-detail-content"><label class="dw-select-label">적용할 깊이<select data-hierarchy-field="depth" aria-label="적용할 깊이">${[1, 2, 3, 4].map((n) => `<option value="${n}">${n}단계까지</option>`).join("")}</select></label><div id="dwHierarchyLevels" class="dw-hierarchy-levels"></div><p class="dw-help">원문에 있는 단계만 사용합니다. 더 깊은 기존 단계는 그대로 둡니다.</p></div></details><details class="dw-control-details"><summary>위계의 느낌 조정</summary><div id="dwHierarchyFeel" class="dw-detail-content"></div></details></div></div><div class="dw-hierarchy-preview-column"><div class="dw-hierarchy-preview-heading"><strong>단계별 표식 견본</strong><span id="dwHierarchySelection" role="status" aria-live="polite"></span></div><div id="dwHierarchyPreview" class="dw-hierarchy-preview"></div><p class="dw-help">선택한 테마의 색상과 서체로 표현한 예시입니다. 문서 견본에는 실제로 있는 제목·목록에만 반영됩니다.</p><p class="dw-help">일반 본문과 표지·쪽번호·문제 번호는 유지합니다. 내용은 제작 AI에 별도로 전달하세요.</p></div></div></div><div class="dw-dialog-footer"><button type="button" class="dw-button" data-hierarchy-close>취소</button><button type="button" class="dw-button dw-primary" data-hierarchy-apply>선택 적용</button></div></dialog>`);
    const dialog = root.querySelector("#dwHierarchyDialog"), q = (s) => dialog.querySelector(s);
    q("[data-hierarchy-apply]").insertAdjacentHTML("beforebegin", '<button type="button" class="dw-button dw-hierarchy-preview-jump" data-hierarchy-preview aria-pressed="false">견본 보기</button>');
    let draft, snapshot, returnToControls = false, opener;
    const choices = (key, label) => `<fieldset class="dw-field"><legend>${label}</legend><div class="dw-segmented">${catalog.options[key].map(([id, text]) => `<label><input type="radio" name="hierarchy-${key}" data-hierarchy-field="${key}" value="${id}"><span>${text}</span></label>`).join("")}</div></fieldset>`;
    q("#dwHierarchyScope").innerHTML = catalog.options.scope.map(([id, text]) => `<label><input type="radio" name="hierarchy-scope" data-hierarchy-field="scope" value="${id}"><span>${text}</span></label>`).join("");
    q("#dwHierarchyFeel").innerHTML = choices("indent", "하위 단계 들여쓰기") + choices("emphasis", "제목 위계 강조") + choices("color", "표식 색상");
    q("#dwHierarchyPresets").innerHTML = catalog.presets.map((p) => `<button type="button" data-hierarchy-preset="${p.id}" aria-pressed="false"><span class="dw-hierarchy-card-example" aria-hidden="true">${p.id === "none" ? '<span>제목</span><span>본문의 흐름을 그대로</span>' : p.levels.map((id, i) => `<span style="--level:${i}"><b>${esc(catalog.marker(id, 1, Array(i + 1).fill(1)))}</b>${["큰 제목", "작은 제목", "세부 항목", "하위 항목"][i]}</span>`).join("")}</span><strong>${p.label}</strong><small>${p.hint}</small><span class="dw-hierarchy-card-check" aria-hidden="true">✓</span></button>`).join("");
    q("#dwHierarchyLevels").innerHTML = [0, 1, 2, 3].map((i) => `<label class="dw-select-label" data-hierarchy-level-row="${i}">${i + 1}단계<select data-hierarchy-level="${i}" aria-label="${i + 1}단계 표식">${catalog.markers.map((m) => `<option value="${m.id}">${esc(m.label)}</option>`).join("")}</select></label>`).join("");
    function preview() {
      const host = q("#dwHierarchyPreview"), on = catalog.enabled(draft), { design } = resolver.resolve(snapshot);
      const { palette, typographyScope } = design;
      host.style.setProperty("--outline-paper", palette.background);
      host.style.setProperty("--outline-ink", palette.text);
      host.style.setProperty("--outline-primary", palette.primary);
      host.style.setProperty("--outline-marker", draft.color === "theme" ? palette.primary : palette.text);
      host.style.setProperty("--outline-heading-font", `"${typographyScope.heading}", sans-serif`);
      host.style.setProperty("--outline-body-font", `"${typographyScope.body}", sans-serif`);
      host.style.setProperty("--outline-indent", `${{ subtle: 8, balanced: 16, deep: 24 }[draft.indent]}px`);
      host.dataset.emphasis = draft.emphasis; host.dataset.scope = draft.scope;
      const titles = ["문서의 큰 흐름", "하나의 주제", "살펴볼 세부 항목", "더 자세한 내용"];
      const item = (i, n = 1) => `<div class="dw-outline-item" style="--level:${i}"><div class="dw-outline-line"><span class="dw-outline-marker">${esc(catalog.marker(draft.levels[i], n, [...Array(i).fill(1), n]))}</span><div><span>${n === 2 ? "같은 단계의 다음 항목" : titles[i]}</span><p>원문의 내용을 유지하며 읽는 순서를 자연스럽게 드러냅니다.</p></div></div></div>`;
      host.innerHTML = on ? `<span class="dw-outline-caption">${catalog.options.scope.find(([id]) => id === draft.scope)[1]} · ${draft.depth}단계</span>${Array.from({ length: draft.depth }, (_, i) => item(i)).join("")}${item(draft.depth - 1, 2)}` : '<span class="dw-outline-caption">추가 지정 없음</span><h4>원문의 체계를 유지합니다</h4><p>번호와 기호를 새로 지정하지 않습니다. 기존 제목·문단은 선택한 테마의 색상과 서체로 표현합니다.</p>';
    }
    function refresh() {
      const on = catalog.enabled(draft);
      q("#dwHierarchyAdjustments").hidden = !on;
      q("#dwHierarchySelection").textContent = catalog.label(draft);
      dialog.querySelectorAll("[data-hierarchy-preset]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.hierarchyPreset === draft.presetId)));
      dialog.querySelectorAll("[data-hierarchy-field]").forEach((node) => {
        if (node.type === "radio") node.checked = draft[node.dataset.hierarchyField] === node.value;
        else node.value = String(draft[node.dataset.hierarchyField]);
      });
      dialog.querySelectorAll("[data-hierarchy-level]").forEach((node) => { const i = Number(node.dataset.hierarchyLevel); node.value = draft.levels[i]; node.disabled = i >= draft.depth; q(`[data-hierarchy-level-row="${i}"]`).hidden = i >= draft.depth; });
      q('[data-hierarchy-field="indent"]').closest("fieldset").hidden = !on || draft.depth === 1;
      dialog.querySelectorAll('[data-hierarchy-field="emphasis"]').forEach((node) => { node.closest("fieldset").hidden = draft.scope === "lists"; });
      preview();
    }
    dialog.addEventListener("click", (event) => {
      event.stopPropagation(); const b = event.target.closest("button"); if (!b) return;
      if (b.hasAttribute("data-hierarchy-close")) dialog.close();
      if (b.hasAttribute("data-hierarchy-preview")) {
        const viewing = b.getAttribute("aria-pressed") !== "true";
        b.setAttribute("aria-pressed", String(viewing)); b.textContent = viewing ? "선택으로" : "견본 보기";
        q(viewing ? ".dw-hierarchy-preview-column" : ".dw-hierarchy-settings").scrollIntoView({ block: "start", behavior: "smooth" });
      }
      if (b.dataset.hierarchyPreset) { draft = catalog.select(draft, b.dataset.hierarchyPreset); refresh(); }
      if (b.hasAttribute("data-hierarchy-apply")) { apply(catalog.normalize(draft)); dialog.close(); }
    });
    dialog.addEventListener("change", (event) => {
      event.stopPropagation(); const node = event.target;
      if (node.dataset.hierarchyField) draft[node.dataset.hierarchyField] = node.dataset.hierarchyField === "depth" ? Number(node.value) : node.value;
      if (node.hasAttribute("data-hierarchy-level")) { draft.presetId = "custom"; draft.levels[Number(node.dataset.hierarchyLevel)] = node.value; }
      draft = catalog.normalize(draft); refresh();
    });
    dialog.addEventListener("close", () => {
      document.documentElement.classList.remove("dw-hierarchy-open");
      const controls = root.querySelector("#dwControlDialog");
      if (returnToControls) { if (!controls.open) controls.showModal(); controls.querySelector('[data-action="open-hierarchy"]')?.focus({ preventScroll: true }); }
      else (root.querySelector('#dwDesktopControls [data-action="open-hierarchy"]') || opener)?.focus({ preventScroll: true });
    });
    return Object.freeze({ open() {
      if (dialog.open) return;
      snapshot = getState(); draft = catalog.normalize(snapshot.hierarchy); opener = document.activeElement;
      const controls = root.querySelector("#dwControlDialog"); returnToControls = !!controls.open;
      if (returnToControls) controls.close();
      q("[data-hierarchy-preview]").setAttribute("aria-pressed", "false"); q("[data-hierarchy-preview]").textContent = "견본 보기";
      refresh(); dialog.showModal(); document.documentElement.classList.add("dw-hierarchy-open"); q(".dw-hierarchy-scroll").scrollTop = 0;
    } });
  }
  window.PromptDeckDocumentHierarchyModal = Object.freeze({ create, summary });
})();
