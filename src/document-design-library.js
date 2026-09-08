(function () {
  "use strict";
  const resolver = window.PromptDeckDocumentResolver, bundles = window.PromptDeckDocumentBundles;
  const schema = "promptdeck-design-settings/1", key = "promptdeck.document-design.library.v1", limit = 20;
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function pack(input, name = "나의 문서 디자인") {
    return { schema, name: String(name).trim().slice(0, 60) || "나의 문서 디자인", state: { ...resolver.normalize(input), sourcePrompt: "" } };
  }
  function unpack(value) {
    if (!value || value.schema !== schema || value.state?.stateVersion !== 3 || !bundles.get(value.state.bundleId) || typeof value.name !== "string") throw new Error("지원하는 디자인 설정 파일이 아닙니다. ‘디자인 설정 내보내기’로 받은 JSON을 선택해 주세요.");
    return pack(value.state, value.name);
  }
  function read() {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    let parsed; try { parsed = JSON.parse(raw); } catch (_) { throw new Error("저장함을 읽지 못했습니다. 기존 저장 데이터는 유지됩니다. 현재 디자인은 파일로 내보낼 수 있습니다."); }
    if (!Array.isArray(parsed) || parsed.length > limit || parsed.some((item) => typeof item?.id !== "string" || typeof item?.savedAt !== "string")) throw new Error("저장함 형식을 확인하지 못했습니다. 현재 디자인을 파일로 내보내 주세요.");
    return parsed.map((item) => ({ ...unpack(item), id: item.id, savedAt: item.savedAt }));
  }
  function write(items) { localStorage.setItem(key, JSON.stringify(items)); }
  function add(input, name) {
    const items = read();
    if (items.length >= limit) throw new Error(`최대 ${limit}개까지 저장할 수 있습니다. 필요 없는 디자인을 지운 뒤 저장해 주세요.`);
    if (!String(name).trim()) throw new Error("디자인 이름을 입력해 주세요.");
    const item = { ...pack(input, name), id: crypto.randomUUID(), savedAt: new Date().toISOString() };
    write([item, ...items]); return item;
  }
  function remove(id) { const items = read(), item = items.find((entry) => entry.id === id); write(items.filter((entry) => entry.id !== id)); return item; }
  function restore(item) { const items = read(); if (items.some((entry) => entry.id === item.id)) return; if (items.length >= limit) throw new Error("저장함이 가득 차 복구할 수 없습니다."); write([item, ...items]); }
  function parse(text) { if (text.length > 250000) throw new Error("디자인 설정은 250 KB 이하의 JSON 파일로 가져와 주세요."); let value; try { value = JSON.parse(text); } catch (_) { throw new Error("JSON 파일을 읽지 못했습니다. 파일 내용을 확인해 주세요."); } return unpack(value); }
  function create({ root, getState, renderFrame, fitAll, apply, downloadText }) {
    root.insertAdjacentHTML("beforeend", `<dialog id="dwLibraryDialog" class="dw-dialog dw-library-dialog" aria-labelledby="dwLibraryTitle"><div class="dw-dialog-heading"><div><span class="dw-eyebrow">MY DESIGNS</span><h3 id="dwLibraryTitle">내 디자인 저장함</h3></div><button type="button" class="dw-icon-button" data-library-close aria-label="디자인 저장함 닫기">×</button></div><div class="dw-library-scroll"><p class="dw-help">색상·서체·배치·느낌·규격을 한 세트로 보관합니다. 작성 요청은 포함하지 않습니다. 저장함은 이 브라우저에서만 유지됩니다.</p><form id="dwLibrarySave" class="dw-library-save"><label>현재 디자인 이름<input id="dwLibraryName" maxlength="60" required placeholder="예: 분기 실적 보고 · 차분한 청록"></label><button type="submit" class="dw-button dw-primary">현재 디자인 저장</button></form><div class="dw-library-file-actions"><button type="button" class="dw-button" data-library-export>현재 설정 내보내기</button><button type="button" class="dw-button" data-library-import>설정 파일 가져오기</button><input type="file" id="dwLibraryFile" accept=".json,application/json" hidden><button type="button" class="dw-button" data-library-undo hidden>삭제 되돌리기</button></div><div class="dw-library-grid"><div id="dwLibraryList" class="dw-library-list" role="group" aria-label="저장한 디자인"></div><div><p id="dwLibrarySelected"></p><div id="dwLibraryPreview" class="dw-studio-canvas"></div><p class="dw-help">저장한 디자인의 대표 지면입니다. 적용 후 전체 세트를 확인할 수 있습니다.</p></div></div></div><div class="dw-dialog-footer"><button type="button" class="dw-button" data-library-close>닫기</button><span id="dwLibraryStatus" role="status"></span><button type="button" class="dw-button dw-primary" data-library-apply disabled>이 디자인 불러오기</button></div></dialog>`);
    const q = (s) => root.querySelector(s), dialog = q("#dwLibraryDialog");
    let selected, opener, ticket = 0, removed;
    const message = (text) => { q("#dwLibraryStatus").textContent = text; };
    function failure(error) { message(error?.name === "QuotaExceededError" ? "브라우저 저장 공간이 부족합니다. 설정 파일로 내보내 주세요." : error?.name === "SecurityError" ? "브라우저 저장을 사용할 수 없습니다. 설정 파일로 내보내 주세요." : error.message || "저장 작업을 완료하지 못했습니다."); }
    function list() {
      const items = read();
      q("#dwLibraryList").innerHTML = items.length ? items.map((item) => {
        const result = resolver.resolve(item.state), p = result.design.physicalSpec;
        return `<article class="dw-library-item"><button type="button" data-library-select="${esc(item.id)}" aria-pressed="${selected?.id === item.id}"><span class="dw-library-swatches">${["primary", "secondary", "accent", "background"].map((role) => `<i style="background:${result.design.palette[role]}"></i>`).join("")}</span><strong>${esc(item.name)}</strong><span>${esc(result.design.label)} · ${esc(p.sizeId)} ${p.orientation === "portrait" ? "세로" : "가로"}</span></button><button type="button" class="dw-button dw-subtle" data-library-delete="${esc(item.id)}" aria-label="${esc(item.name)} 삭제">삭제</button></article>`;
      }).join("") : '<p class="dw-help">아직 저장한 디자인이 없습니다. 현재 디자인에 이름을 붙여 저장해 보세요.</p>';
    }
    async function preview(item, imported = false) {
      selected = item;
      const run = ++ticket, host = q("#dwLibraryPreview"); host.replaceChildren(); q("[data-library-apply]").disabled = true;
      q("#dwLibrarySelected").textContent = `${imported ? "가져온 파일 · " : ""}${item.name}`;
      try {
        const result = resolver.resolve(item.state), page = result.design.pages.find((p) => ["body", "message"].includes(p.kind)) || result.design.pages[0];
        const rendered = await renderFrame(host, result.design, result.previewTokens, page.id, { kind: "studio" });
        if (run !== ticket || !dialog.open) return;
        if (!rendered) throw new Error("미리보기를 준비하지 못했습니다.");
        const pages = window.PromptDeckDocumentRenderer.paginate(rendered.node);
        rendered.scale.replaceChildren(pages[0]); fitAll(); q("[data-library-apply]").disabled = false;
        message(imported ? "파일 확인 완료 · 불러오기를 누르면 적용됩니다." : "색상·배치·규격을 확인하고 불러오세요.");
      } catch (error) { if (run === ticket) failure(error); }
    }
    q("#dwLibrarySave").addEventListener("submit", (event) => {
      event.preventDefault();
      try { const item = add(getState(), q("#dwLibraryName").value); selected = item; list(); preview(item); message("현재 디자인을 저장했습니다."); } catch (error) { failure(error); }
    });
    dialog.addEventListener("click", (event) => {
      const button = event.target.closest("button"); if (!button) return;
      try {
        if (button.hasAttribute("data-library-close")) return dialog.close();
        if (button.hasAttribute("data-library-export")) { const item = pack(getState(), q("#dwLibraryName").value); downloadText(JSON.stringify(item, null, 2), "design-settings.json", "application/json;charset=utf-8"); message("작성 요청을 제외한 디자인 설정을 내보냈습니다."); }
        if (button.hasAttribute("data-library-import")) q("#dwLibraryFile").click();
        if (button.dataset.librarySelect) { const item = read().find((entry) => entry.id === button.dataset.librarySelect); if (item) { selected = item; list(); preview(item); } }
        if (button.dataset.libraryDelete) {
          removed = remove(button.dataset.libraryDelete);
          if (selected?.id === button.dataset.libraryDelete) { ++ticket; selected = null; q("#dwLibraryPreview").replaceChildren(); q("#dwLibrarySelected").textContent = ""; q("[data-library-apply]").disabled = true; }
          q("[data-library-undo]").hidden = !removed; list(); message("저장한 디자인을 삭제했습니다. 되돌릴 수 있습니다.");
        }
        if (button.hasAttribute("data-library-undo") && removed) { restore(removed); removed = null; button.hidden = true; list(); message("삭제한 디자인을 복구했습니다."); }
        if (button.hasAttribute("data-library-apply") && selected && !button.disabled) { apply(resolver.normalize(selected.state)); dialog.close(); }
      } catch (error) { failure(error); }
    });
    q("#dwLibraryFile").addEventListener("change", async (event) => {
      const file = event.target.files[0]; event.target.value = ""; if (!file) return;
      const run = ++ticket;
      try {
        if (file.size > 250000) throw new Error("디자인 설정은 250 KB 이하의 JSON 파일로 가져와 주세요.");
        const item = parse(await file.text()); if (run !== ticket || !dialog.open) return;
        selected = item; try { list(); } catch (_) { /* File import also works when local storage is unavailable. */ }
        await preview(item, true);
      } catch (error) { if (run === ticket) failure(error); }
    });
    dialog.addEventListener("close", () => { ++ticket; document.documentElement.classList.remove("dw-library-open"); if (opener?.isConnected) opener.focus({ preventScroll: true }); });
    return { open() {
      opener = document.activeElement; selected = null; q("[data-library-apply]").disabled = true;
      q("#dwLibraryPreview").replaceChildren(); q("#dwLibrarySelected").textContent = "저장한 디자인을 선택하세요.";
      q("#dwLibraryName").value = resolver.resolve(getState()).design.label;
      dialog.showModal(); document.documentElement.classList.add("dw-library-open"); q(".dw-library-scroll").scrollTop = 0;
      message(""); try { list(); } catch (error) { q("#dwLibraryList").replaceChildren(); failure(error); }
    } };
  }
  window.PromptDeckDocumentLibrary = Object.freeze({ schema, key, limit, pack, unpack, parse, read, add, remove, restore, create });
})();
