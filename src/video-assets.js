(function () {
  "use strict";
  const root = document.getElementById("videoAssetsApp"), pane = document.getElementById("paneVideoAssets");
  if (!root || !pane) return;
  const engine = window.PromptDeckVideoAssetEngine, catalog = window.PromptDeckMediumCatalog, presets = window.CONCEPT_MIXER_PRESETS;
  if (!engine || !catalog || !presets) { root.textContent = "에셋 화풍 목록을 불러오지 못했습니다. 새로고침해 주세요."; return; }
  const KEY = "promptdeck.videoAssets.v1";
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const options = (items) => Object.entries(items).map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join("");
  let state = engine.defaults(), undo = null, storageNotice = "", visible = 12, search = "", group = "all";
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved?.version === 1) state = engine.normalize(saved);
    else if (saved) storageNotice = "저장된 양식을 읽지 못했습니다. 현재 화면의 기본 설정을 확인하세요.";
  } catch (_) { storageNotice = "브라우저 저장 설정을 읽지 못했습니다. 프롬프트를 TXT로 보관하세요."; }
  if (!state.style) state.style = engine.styleSnapshot(presets.MIXER_MEDIUMS.find((item) => item.id === "med-public-soft-color") || presets.MIXER_MEDIUMS[0]);
  const placeholders = {
    character: ["예: 안내자 유나", "나이대·외모·헤어·체형·의상·대표 색상·성격·역할", "예: yuna-front.png · 얼굴과 의상 기준"],
    background: ["예: 연구소 중앙 로비", "공간 구조·시대·시간대·날씨·랜드마크·카메라 높이", "예: lobby-plan.png · 출입구와 동선 기준"],
    prop: ["예: 휴대용 측정기", "크기·형태·재질·색상·기능·사용 상태·인물 대비 크기", "예: device.png · 실루엣과 버튼 위치 기준"],
  };
  root.innerHTML = `<div class="va-workspace">
    <header class="va-header"><h2>영상 에셋</h2><p class="va-help">같은 영상에 사용할 인물·배경·도구 시트의 이미지 제작 프롬프트를 만듭니다.</p></header>
    <div class="va-layout"><div class="va-inputs">
      <section class="va-section"><h3>1. 영상 공통 설정</h3><div class="va-fields">
        <label class="va-field">영상·프로젝트명<input id="vaVideo" data-va-common="video" maxlength="4000" placeholder="예: 푸른도시 탐험"></label>
        <label class="va-field">세계관·영상 맥락<textarea id="vaWorld" data-va-common="world" rows="2" maxlength="4000" placeholder="예: 가까운 미래의 해안 도시, 청소년 대상의 따뜻한 과학 이야기"></textarea></label>
        <div class="va-style-current"><strong id="vaStyleName"></strong><p id="vaStyleDescription" class="va-help"></p><span class="va-help">이 화풍은 세 시트에 공통 적용되며, 시트 종류를 바꿔도 유지됩니다.</span></div>
        <div class="va-actions"><button type="button" id="vaImportStyleBtn" class="va-button">현재 화풍 가져오기</button><button type="button" id="vaOpenMixerBtn" class="va-button">비주얼 조합 열기 ↗</button></div>
        <details class="va-style-browser"><summary>기존 화풍에서 선택</summary><div class="va-two"><label class="va-field">화풍 검색<input id="vaStyleSearch" type="search" placeholder="수채화, 클레이, 선화…"></label><label class="va-field">표현 방식<select id="vaStyleGroup">${options({ all: "전체", ...catalog.groupLabels })}</select></label></div><p class="va-help">비주얼 조합과 같은 화풍 목록입니다. 이미지는 등록된 화풍 참고 자료입니다.</p><div id="vaStyleGrid" class="va-style-grid"></div><button type="button" id="vaMoreStylesBtn" class="va-button">12개 더 보기</button></details>
        <div class="va-two"><label class="va-field">공통 색상<input id="vaPalette" data-va-common="palette" maxlength="4000" placeholder="주조색·보조색·채도"></label><label class="va-field">공통 조명<input id="vaLighting" data-va-common="lighting" maxlength="4000" placeholder="빛의 방향·부드러움·명암"></label></div>
        <label class="va-field">화풍 기준 이미지 (선택)<input id="vaReference" data-va-common="reference" maxlength="4000" placeholder="예: approved-style.png · 선·재질·색상 기준"></label>
        <p class="va-help">첫 이미지를 확정한 뒤 그 파일을 화풍 기준으로 입력하고, 다음 요청마다 AI에 함께 첨부하세요. 실제 파일은 이미지 AI에 첨부합니다.</p>
        <details class="va-details"><summary>영상 전체 고정 요소 (선택)</summary><label class="va-field"><span class="sr-only">공통 고정 요소</span><textarea id="vaConsistency" data-va-common="consistency" maxlength="4000" rows="2" placeholder="예: 모든 에셋의 둥근 외곽선, 무광 재질, 금속 광택 최소화"></textarea></label></details>
      </div></section>
      <section class="va-section"><h3>2. 시트 구성</h3><div class="va-type-nav" role="group" aria-label="에셋 시트 종류">${Object.entries(engine.types).map(([key, label]) => `<button type="button" class="va-button" data-va-type="${key}" aria-pressed="false">${label}</button>`).join("")}</div>
        <div class="va-fields"><label class="va-field"><span id="vaNameLabel">대상 이름</span><input id="vaName" data-va-sheet="name" maxlength="4000"></label><label class="va-field"><span id="vaDetailsLabel">특징·용도</span><textarea id="vaDetails" data-va-sheet="details" rows="3" maxlength="4000"></textarea></label>
        <label class="va-field">시트 배치<select id="vaLayout" data-va-sheet="layout"></select></label>
        <div class="va-two"><label class="va-field">시트 화면비<select id="vaRatio" data-va-sheet="ratio">${options(engine.ratios)}</select></label><label class="va-field" id="vaBackdropField">시트 바탕<select id="vaBackdrop" data-va-sheet="backdrop">${options(engine.backdrops)}</select></label></div>
        <label class="va-field">대상 기준 이미지 (선택)<input id="vaSubjectReference" data-va-sheet="reference" maxlength="4000"></label>
        <p class="va-help">화풍 기준은 표현 기법, 대상 기준은 얼굴·형태·구조를 유지하는 데 사용합니다. 각 시트의 입력은 따로 보관됩니다.</p>
        <details class="va-details"><summary>추가 조건 (선택)</summary><label class="va-field"><span class="sr-only">시트 추가 조건</span><textarea id="vaExtras" data-va-sheet="extras" maxlength="4000" rows="2" placeholder="예: 인물 키 170cm, 도구 길이 20cm, 표정은 입을 다문 상태"></textarea></label></details>
        </div><div class="va-actions"><button type="button" id="vaSampleBtn" class="va-button">샘플 채우기</button><button type="button" id="vaResetBtn" class="va-button">초기화</button><button type="button" id="vaUndoBtn" class="va-button" hidden>변경 되돌리기</button></div>
      </section>
    </div><aside class="va-result-stack" aria-label="에셋 이미지 프롬프트"><div class="va-result-body"><h3 id="vaResultTitle">3. 프롬프트 복사</h3><div id="vaSheetPreview" class="va-sheet-preview" aria-label="시트 배치 예시"></div><p class="va-help">배치 이해를 위한 예시입니다. 선택한 화풍은 아래 프롬프트에 반영됩니다.</p><label class="va-field">이미지 제작 요청문<textarea id="vaOutput" class="va-output" readonly spellcheck="false"></textarea></label><div class="va-actions"><button type="button" id="vaCopyBtn" class="va-button va-primary">현재 시트 복사</button><button type="button" id="vaCopyAllBtn" class="va-button">3종 모두 복사</button><button type="button" id="vaDownloadBtn" class="va-button">TXT 저장</button></div><p class="va-help">현재 시트는 이미지 AI에 한 번씩 요청하세요. 3종 모두 복사는 시트별로 이미지 1장씩 제작하도록 전달합니다. 화풍·대상 기준 파일도 함께 첨부하세요.</p><p id="vaStatus" class="va-status" role="status" aria-live="polite"></p></div></aside></div></div>`;
  const q = (selector) => root.querySelector(selector);
  const status = (message) => { q("#vaStatus").textContent = message; };
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (_) { status("브라우저에 저장하지 못했습니다. TXT 저장으로 현재 프롬프트를 보관하세요."); }
  }
  function preview() {
    const sheet = state.sheets[state.type], count = state.type === "character" ? { expression: 7, turnaround: 3, pose: 5 }[sheet.layout] : 4;
    const shapes = Array.from({ length: count }, (_, i) => {
      const x = 12 + i % 3 * 156, y = 32 + Math.floor(i / 3) * 110;
      const art = state.type === "character" ? '<circle cx="70" cy="29" r="13"/><path d="M49 82V60Q49 43 70 43Q91 43 91 60V82M70 62V90M53 90L62 70M87 90L78 70"/>' : state.type === "background" ? '<path d="M12 83V45L40 25L68 45V83M75 83V15H124V83M5 83H137M23 55H35V69H23Z M91 28H107V46H91Z"/>' : '<rect x="47" y="18" width="52" height="68" rx="8"/><rect x="56" y="28" width="34" height="22" rx="3"/><circle cx="73" cy="68" r="7"/>';
      return `<g transform="translate(${x} ${y})"><rect width="144" height="100" rx="6" fill="none" stroke="#c2ccd8"/><g fill="none" stroke="#526f87" stroke-width="2.5" stroke-linejoin="round">${art}</g></g>`;
    }).join("");
    q("#vaSheetPreview").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 ${45 + Math.ceil(count / 3) * 110}" role="img" aria-label="${engine.types[state.type]} 배치 예시"><rect width="480" height="100%" fill="#f1f5f9"/><text x="14" y="20" fill="#526174" font-size="11">${engine.types[state.type]} · ${esc(engine.layouts[state.type][sheet.layout])}</text>${shapes}</svg>`;
  }
  function update() {
    q("#vaStyleName").textContent = state.style?.name || "기준 이미지 화풍";
    q("#vaStyleDescription").textContent = state.style?.description || "첨부 이미지의 화풍을 유지합니다.";
    q("#vaOutput").value = engine.prompt(state);
    q("#vaResultTitle").textContent = `3. ${engine.types[state.type]} 프롬프트`;
    preview(); save();
  }
  function renderSheet() {
    const type = state.type, sheet = state.sheets[type];
    q("#vaLayout").innerHTML = options(engine.layouts[type]);
    root.querySelectorAll("[data-va-type]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.vaType === type)));
    root.querySelectorAll("[data-va-sheet]").forEach((field) => { field.value = sheet[field.dataset.vaSheet]; });
    q("#vaNameLabel").textContent = { character: "인물 이름", background: "장소 이름", prop: "도구·소품 이름" }[type];
    ["#vaName", "#vaDetails", "#vaSubjectReference"].forEach((selector, i) => { q(selector).placeholder = placeholders[type][i]; });
    q("#vaBackdropField").hidden = type === "background";
    update();
  }
  function refresh() {
    root.querySelectorAll("[data-va-common]").forEach((field) => { field.value = state[field.dataset.vaCommon]; });
    renderSheet(); renderStyles();
  }
  function safeImage(url) {
    if (typeof url !== "string") return "";
    if (/^data:image\/(png|jpeg|webp|gif);base64,[a-z\d+/=]+$/i.test(url)) return url;
    try { const parsed = new URL(url, location.origin); return parsed.origin === location.origin && !url.startsWith("//") ? parsed.href : ""; } catch (_) { return ""; }
  }
  function renderStyles() {
    const list = catalog.list({ query: search, group });
    q("#vaStyleGrid").innerHTML = list.slice(0, visible).map((item) => {
      const image = safeImage(presets.getCustomSamplesForMed?.(item.id)?.find(Boolean));
      return `<button type="button" class="va-style-card" data-va-style="${esc(item.id)}" aria-pressed="${item.id === state.style?.id}"><span class="va-style-art">${image ? `<img src="${esc(image)}" alt="${esc(item.nameKo)} 화풍 참고" loading="lazy">` : `<span>${esc(item.groupLabel)} · ${esc(item.textureLabel)}</span>`}</span><strong>${esc(item.nameKo)}</strong><small>${esc(item.description)}</small></button>`;
    }).join("") || '<p class="va-help">조건에 맞는 화풍이 없습니다.</p>';
    q("#vaStyleGrid").querySelectorAll("img").forEach((img) => img.addEventListener("error", () => { img.replaceWith(document.createTextNode("참고 이미지 없음")); }, { once: true }));
    q("#vaMoreStylesBtn").hidden = list.length <= visible;
  }
  function checkpoint() { undo = JSON.parse(JSON.stringify(state)); q("#vaUndoBtn").hidden = false; }
  root.addEventListener("input", (event) => {
    const field = event.target;
    if (field.dataset.vaCommon) { state[field.dataset.vaCommon] = field.value; update(); }
    if (field.dataset.vaSheet) { state.sheets[state.type][field.dataset.vaSheet] = field.value; update(); }
    if (field.id === "vaStyleSearch") { search = field.value; visible = 12; renderStyles(); }
  });
  root.addEventListener("change", (event) => {
    if (event.target.id === "vaStyleGroup") { group = event.target.value; visible = 12; renderStyles(); }
  });
  root.addEventListener("click", (event) => {
    const type = event.target.closest("[data-va-type]"), style = event.target.closest("[data-va-style]");
    if (type) { state.type = type.dataset.vaType; renderSheet(); }
    if (style) { checkpoint(); state.style = engine.styleSnapshot(presets.MIXER_MEDIUMS.find((item) => item.id === style.dataset.vaStyle)); update(); renderStyles(); status("화풍을 인물·배경·도구 시트 모두에 적용했습니다."); }
  });
  q("#vaMoreStylesBtn").addEventListener("click", () => { visible += 12; renderStyles(); });
  q("#vaImportStyleBtn").addEventListener("click", () => {
    const selected = engine.styleSnapshot(window.PromptDeckConceptMixer?.getSelectedMedium?.());
    if (!selected) { status("비주얼 조합에서 화풍을 선택한 뒤 다시 가져오세요."); return; }
    checkpoint(); state.style = selected; update(); renderStyles(); status(`${selected.name} 화풍을 모든 시트에 적용했습니다. 색상·조명·시트 내용은 유지됩니다.`);
  });
  q("#vaOpenMixerBtn").addEventListener("click", () => { window.PromptDeckTabs?.switchTab("conceptMixer"); status("비주얼 조합에서 화풍을 고른 뒤 영상 에셋으로 돌아와 ‘현재 화풍 가져오기’를 누르세요."); });
  const samples = [
    { video: "푸른도시 탐험", world: "가까운 미래의 해안 도시, 청소년을 위한 과학 탐험 이야기", character: ["안내자 유나", "20대 연구원, 짧은 검정 머리, 둥근 얼굴, 청록 재킷과 아이보리 바지, 작은 남색 배낭"], background: ["해안 연구소 로비", "큰 창으로 바다가 보이는 1층 로비, 중앙 안내대, 오른쪽 출입구, 맑은 오전"], prop: ["휴대용 환경 측정기", "손바닥 크기, 청록색 둥근 사각 몸체, 상단 화면, 전면 둥근 버튼 1개, 무광 재질"] },
    { video: "동네 빵집의 아침", world: "따뜻한 주거 지역의 작은 빵집, 일상의 정성과 즐거움을 전하는 이야기", character: ["제빵사 민", "30대, 곱슬 갈색 단발, 아이보리 셔츠, 남색 앞치마, 청록 손수건, 다정한 인상"], background: ["골목 빵집", "왼쪽 나무 진열대, 중앙 유리 쇼케이스, 오른쪽 계산대, 아침 햇살이 드는 작은 매장"], prop: ["휴대용 빵 바구니", "폭 30cm의 둥근 손잡이 바구니, 촘촘한 짜임, 아이보리 천 덮개와 청록 리본"] },
    { video: "숲속 우편 배달", world: "작은 동물들이 함께 사는 숲 마을, 약속과 배려를 전하는 동화", character: ["우편 배달부 토토", "토끼 캐릭터, 긴 귀, 둥근 체형, 아이보리 털, 청록 조끼, 남색 가방, 한쪽 귀 끝의 작은 반점"], background: ["숲 마을 우체국", "큰 나무 아래 둥근 입구, 왼쪽 우편함, 중앙 접수 창구, 오른쪽 돌길, 맑은 낮"], prop: ["우편 배달 가방", "몸통 절반 크기의 남색 가죽 가방, 둥근 덮개, 청록 버클, 넓은 어깨끈"] },
  ];
  let previousSample = -1;
  q("#vaSampleBtn").addEventListener("click", () => {
    checkpoint(); const candidates = samples.map((_, index) => index).filter((index) => index !== previousSample); const index = candidates[Math.floor(Math.random() * candidates.length)]; previousSample = index;
    const sample = samples[index]; state.video = sample.video; state.world = sample.world; state.reference = ""; state.consistency = "";
    for (const type of Object.keys(engine.types)) state.sheets[type] = { ...engine.defaults().sheets[type], name: sample[type][0], details: sample[type][1] };
    refresh(); status("같은 영상의 인물·배경·도구 샘플을 채웠습니다. 선택한 화풍·색상·조명은 유지됩니다.");
  });
  q("#vaResetBtn").addEventListener("click", () => { checkpoint(); state = engine.defaults(); state.style = engine.styleSnapshot(presets.MIXER_MEDIUMS.find((item) => item.id === "med-public-soft-color")); refresh(); status("입력을 초기화했습니다. ‘변경 되돌리기’로 복구할 수 있습니다."); });
  q("#vaUndoBtn").addEventListener("click", () => { if (!undo) return; state = undo; undo = null; q("#vaUndoBtn").hidden = true; refresh(); status("변경 전 설정을 복구했습니다."); });
  async function copy(all) {
    const value = all ? engine.allPrompts(state) : engine.prompt(state);
    try { await navigator.clipboard.writeText(value); status(all ? "인물·배경·도구의 프롬프트를 모두 복사했습니다." : "현재 시트 프롬프트를 복사했습니다."); }
    catch (_) {
      const field = q("#vaOutput"), original = field.value; field.value = value; field.focus(); field.select();
      try { if (!document.execCommand("copy")) throw new Error("copy"); field.value = original; status("프롬프트를 복사했습니다."); }
      catch (_) { status("자동 복사를 사용할 수 없습니다. 선택된 내용을 직접 복사하거나 TXT로 저장하세요."); }
    }
  }
  q("#vaCopyBtn").addEventListener("click", () => copy(false)); q("#vaCopyAllBtn").addEventListener("click", () => copy(true));
  q("#vaDownloadBtn").addEventListener("click", () => {
    const url = URL.createObjectURL(new Blob([engine.allPrompts(state)], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "PromptDeck-video-asset-sheets.txt"; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); status("공통 화풍이 적용된 3종 프롬프트를 TXT로 저장했습니다.");
  });
  new MutationObserver(() => { if (pane.classList.contains("active")) renderStyles(); }).observe(pane, { attributes: true, attributeFilter: ["class"] });
  refresh(); if (storageNotice) status(storageNotice);
  // The mixer loads the shared manifest once; refresh when its public API is ready.
  Promise.resolve(window.PromptDeckAdminSettingsReady).finally(() => { setTimeout(renderStyles, 1000); });
})();
