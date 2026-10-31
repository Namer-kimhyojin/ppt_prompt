(function () {
  "use strict";
  const root = document.getElementById("motionPromptApp");
  const pane = document.getElementById("paneMotionPrompt");
  if (!root || !pane) return;
  const engine = window.PromptDeckMotionEngine, catalog = window.PromptDeckMotionCatalog, styleCatalog = window.PromptDeckMotionStyles;
  if (!engine || !catalog || !styleCatalog || typeof catalog.createSamplePicker !== "function") { root.textContent = "모션 스타일을 불러오지 못했습니다. 새로고침해 주세요."; return; }
  const KEY = "promptdeck.motionPrompt.v1";
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const options = (values) => Object.entries(values).map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join("");
  let state = engine.defaults(), storageNotice = "", undoState = null;
  const nextSample = catalog.createSamplePicker();
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) { const value = JSON.parse(saved); if (![1, 2, 3].includes(value?.version)) throw new Error("version"); state = engine.normalize(value); if (value.version < 3) storageNotice = "기존 입력은 보관했습니다. 구성 방향과 스타일을 담은 기획 요청문으로 통합했습니다."; }
  } catch (_) { storageNotice = "저장된 설정을 읽지 못해 기본값을 표시합니다."; }
  let category = "all", query = "", playing = false, saveTimer, toastTimer;
  const sources = [
    ["Lemo-Opuscar · 스타일 참고", "https://lemomo-ai.github.io/lemo-opuscar/", "66개 스타일의 재질·구도·움직임을 참고. 원본 스틸: LemoLab · CC BY 4.0, 이미지 파일 변경 없음. 한국어 구성 방향은 PromptDeck에서 작성"],
    ["Claude 프롬프트 가이드", "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices", "목표·문맥·입력 자료·예시·출력 형식을 구분"],
    ["OpenAI 프롬프트 가이드", "https://developers.openai.com/api/docs/guides/prompt-engineering", "요청 목표·기획 원칙·입력 자료를 제목과 문단으로 구분"],
    ["OpenAI 영상 프롬프트 참고", "https://developers.openai.com/cookbook/examples/sora/sora2_prompting_guide", "샷의 구도·동작·빛·타이밍 참고. 보관 문서이므로 모델·API 규격은 적용하지 않음"],
    ["Runway 영상 프롬프트 가이드", "https://help.runwayml.com/hc/en-us/articles/39789879462419-Gen-4-Video-Prompting-Guide", "영상 AI용 문장은 한 샷의 구체적인 움직임을 긍정형으로 기술"],
    ["Jitter 템플릿", "https://jitter.video/templates/", "이미지로 유형 탐색 후 텍스트·색상·움직임을 조정하는 흐름 참고"],
    ["Animaker 템플릿", "https://www.animaker.com/templates", "홍보·설명·교육·캐릭터 등 용도별 분류 참고"],
    ["Canva 애니메이션", "https://www.canva.com/features/animation-maker/", "요소별 텍스트·이미지 애니메이션과 영상 구성 참고"],
    ["GitHub · Remotion 생성 프롬프트", "https://github.com/remotion-dev/template-prompt-to-motion-graphics-saas/blob/7aeb2d6be92e3152886aec4dea8be0007ca4c41d/src/app/api/generate/route.ts", "영상 유형에 맞는 연출 지침과 제작 자료를 구분하는 원칙 참고"],
    ["GitHub · Remotion 공식 타이밍·전환", "https://github.com/remotion-dev/skills/tree/30d4553ecd46fbc5212fd0ff006ae43af522158b/skills/remotion-markup", "프레임 기반 계산, 전환의 중첩 시간을 고려한 전체 길이 검수 반영"],
    ["GitHub · 영상 프롬프트 모음", "https://github.com/Mikefluff/skills/blob/50d1ae8ae2528cc3a79e946ccebdb7a61e7b2e3a/common/video-prompt-library/system-prompt.md", "텍스트 기반/참조 이미지 기반 영상 구분, 한 장면의 동작을 명료하게 쓰는 원칙 참고"],
    ["GitHub · 브라우저 모션 제작", "https://github.com/RFTaurus/motion-skill/blob/c1aa65e921c970d858705fcb4a53a8294d1a4131/SKILL.md", "대상·장면 연속성, 주제에 맞는 표현 재질, 같은 시점의 재현 가능성 참고"],
  ];
  root.className = "motion-workspace";
  root.dataset.mobileView = "brief";
  root.innerHTML = `
    <header class="motion-header"><div><span class="motion-eyebrow">DIRECTION TO AI STORYBOARD</span><h2>방향은 내가, 기획은 AI가.</h2><p>영상의 용도·내용·스타일만 정하세요. AI가 구성안을 제안하고 타임스토리·콘티·대본까지 구체화하도록 요청합니다.</p></div><span class="motion-header-badge">66가지 스타일<span>18가지 용도 · 상세 기획은 AI에게</span></span></header>
    <div class="motion-mobile-nav motion-step-nav" role="group" aria-label="영상 기획 진행 단계"><button type="button" data-motion-view="brief" aria-pressed="true" aria-current="step">1 구성 방향</button><button type="button" data-motion-view="gallery" aria-pressed="false">2 스타일 선택</button><button type="button" data-motion-view="result" aria-pressed="false">3 요청문 복사</button></div>
    <div class="motion-layout">
      <div class="motion-input-stack">
        <section class="motion-library" aria-labelledby="motionLibraryTitle">
          <div class="motion-section-heading"><div><span class="motion-step">02 / VISUAL STYLE</span><h3 id="motionLibraryTitle">어떤 느낌으로 보여줄까요?</h3></div><span id="motionTemplateCount" class="motion-count" role="status"></span></div>
          <label class="motion-field motion-search">스타일 검색<input id="motionSearch" type="search" placeholder="예: 수채화, 설계도, 픽셀, 뉴스, 유리" autocomplete="off"></label>
          <button type="button" class="motion-button motion-auto-style" id="motionAutoStyleBtn" aria-pressed="true">✦ AI에게 어울리는 스타일 3안 추천받기</button>
          <div class="motion-filters" role="group" aria-label="시각 스타일 필터">${Object.entries(styleCatalog.categories).map(([id, label]) => `<button type="button" data-motion-category="${id}" aria-pressed="${id === "all"}">${label}</button>`).join("")}</div>
          <div id="motionGallery" class="motion-gallery"></div>
          <p class="motion-help motion-library-note">참고 이미지: <a href="https://github.com/lemomo-ai/lemo-opuscar" target="_blank" rel="noopener noreferrer">LemoLab · Lemo-Opuscar</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. 원본 스틸을 축소해 표시하며, 사용자가 입력한 영상의 생성 결과가 아닙니다.</p>
        </section>
        <section class="motion-editor" aria-labelledby="motionBriefTitle">
          <div class="motion-section-heading"><div><span class="motion-step">01 / YOUR BRIEF</span><h3 id="motionBriefTitle">먼저 구성 방향을 정해주세요</h3></div><button type="button" class="motion-text-btn" id="motionSampleBtn" data-proxy-label="샘플 데이터 채우기">샘플 데이터 채우기</button></div>
          <div class="motion-fields"><p id="motionSampleInfo" class="motion-help" role="status"></p><label class="motion-field">영상 용도<select id="motionPurpose" data-motion-field="template">${options({ auto: "AI가 목적에 맞는 영상 용도 제안", ...Object.fromEntries(catalog.templates.map((t) => [t.id, t.name])) })}</select></label><label class="motion-field">영상 주제·제목<input id="motionTitle" data-motion-field="title" maxlength="4000" placeholder="예: 지역기업 지원사업 참여 안내"></label><div class="motion-two"><label class="motion-field">시청 대상<input data-motion-field="audience" maxlength="4000" placeholder="예: 기업 담당자·참가자"></label><label class="motion-field">전달 목표·행동<input data-motion-field="goal" maxlength="4000" placeholder="예: 사업을 이해하고 신청하기"></label></div>
          <label class="motion-field">원문·핵심 내용<textarea id="motionSource" data-motion-field="source" rows="5" maxlength="20000" placeholder="넣을 문구, 실제 일정, 특징, 수치와 출처를 입력하세요. 비워 두면 기본 연출 요청문이 만들어집니다."></textarea></label>
          <label class="motion-field">사용할 자료·보존할 요소<textarea id="motionAssets" data-motion-field="assets" rows="2" maxlength="4000" placeholder="예: 첨부 로고의 형태·색상 보존, 제품 사진 3장, 실제 UI 화면, 원본 인터뷰 음성"></textarea></label><p class="motion-help">원본 파일은 기획 요청문과 함께 Claude·GPT에 첨부하세요. 이 화면에서는 파일을 업로드하지 않습니다.</p>
          <div class="motion-two"><label class="motion-field">화면비<select id="motionRatio" data-motion-field="ratio">${options({ "16:9": "16:9 · 가로 영상", "9:16": "9:16 · 쇼츠·릴스", "1:1": "1:1 · 정사각", "4:5": "4:5 · 세로 피드" })}</select></label><label class="motion-field">희망 길이<select id="motionDurationChoice">${options({ auto: "AI가 적정 길이 제안", 15: "약 15초", 30: "약 30초", 60: "약 1분", 90: "약 1분 30초", 120: "약 2분", custom: "직접 지정" })}</select><input id="motionDuration" type="number" min="3" max="600" step="1" aria-label="희망 영상 길이 (초)" hidden></label></div>
          <details class="motion-details"><summary>오디오·출력 세부 조건</summary><div class="motion-fields">
            <p class="motion-help">재질·속도·카메라·전환·색상은 다음 단계에서 고른 스타일을 바탕으로 AI가 제안합니다.</p>
            <div class="motion-two"><label class="motion-field">오디오<select id="motionAudio" data-motion-field="audio">${options({ auto: "AI가 적합한 음향·내레이션 제안", silent: "무음", music: "음악·효과음", narration: "내레이션 + 음악", source: "원본 음성 유지" })}</select></label><label class="motion-field">프레임레이트<select data-motion-field="fps">${options({ auto: "AI가 표현 방식에 맞춰 제안", 24: "24 fps", 25: "25 fps", 30: "30 fps", 60: "60 fps" })}</select></label></div>
            <label class="motion-field">장면 사이에 유지할 요소<input id="motionContinuity" data-motion-field="continuity" maxlength="4000" placeholder="예: 같은 캐릭터·의상, 왼쪽에서 오른쪽으로 이동, 파란 원이 다음 장면의 버튼으로 연결"></label>
            <label class="motion-check"><input id="motionLoop" type="checkbox" data-motion-field="loop">처음과 끝이 이어지는 반복 영상</label><label class="motion-field">추가 요구사항<textarea id="motionRequirements" data-motion-field="requirements" maxlength="4000" rows="2" placeholder="예: 중앙에 로고 여백, 마지막 안내 3초 유지, 과장된 회전 금지"></textarea></label>
          </div></details>
          </div>
        </section>
        <div class="motion-ai-handoff"><strong>다음은 스타일 선택입니다.</strong><p class="motion-help">구성 방향을 정한 뒤 스타일을 고르고, 마지막 단계에서 요청문을 복사하세요. 상세 타임스토리·콘티·대본은 AI가 제안합니다.</p></div>
        <details class="motion-details motion-references"><summary>공식 문서·서비스 조사와 구성 원칙</summary><p class="motion-help">확인일 2026-10-31. 공식 문서의 원칙을 요청문에 적용했습니다. 스타일 참고 스틸은 LemoLab의 CC BY 4.0 자료이며, 한국어 스타일 방향과 기획 요청문은 PromptDeck에서 작성했습니다. 기존 SVG 용도 예시는 자체 제작 자료입니다.</p><ul>${sources.map(([label, url, note]) => `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${label} ↗</a><p>${note}</p></li>`).join("")}</ul><p class="motion-help">영상 길이·해상도·음성·참조 이미지 지원 범위는 사용하는 서비스에서 확인하고 설정하세요. 이 도구는 특정 모델의 API에 연결하지 않습니다.</p></details>
        <div class="motion-step-footer"><button type="button" id="motionBackBtn" class="motion-button" data-motion-view="brief" hidden>← 구성 방향</button><button type="button" id="motionPrimaryBtn" class="motion-button motion-primary" data-proxy-label="다음: 스타일 선택">다음: 스타일 선택 →</button></div>
      </div>
      <aside class="motion-result-stack" aria-label="스타일 미리보기와 기획 요청문">
        <div class="motion-result-body"><div class="motion-preview-block"><div class="motion-section-heading"><div><span class="motion-step">SELECTED DIRECTION</span><h3 id="motionSelectedName"></h3></div><span class="motion-example-badge">연출 예시</span></div>
          <div id="motionStage" class="motion-stage is-paused"></div><div class="motion-player-controls"><button type="button" id="motionPlayBtn" class="motion-button" aria-pressed="false">▶ 용도 예시 보기</button><span id="motionPreviewNote" class="motion-help"></span></div><div id="motionReferenceLinks" class="motion-reference-links"></div><p id="motionDescription" class="motion-help"></p><div id="motionSpecs" class="motion-specs"></div>
          <p class="motion-help">구체적인 장면과 시간 배분은 AI가 기획합니다.</p>
          </div><div class="motion-request-block"><div class="motion-section-heading"><div><span class="motion-step">03 / COPY REQUEST</span><h3 id="motionRequestTitle">기획 요청문을 복사하세요</h3></div><button type="button" class="motion-text-btn" data-motion-view="gallery">← 스타일 선택</button></div><p id="motionRequestSummary" class="motion-request-summary"></p>
          <div id="motionOutputPanel" aria-labelledby="motionRequestTitle"><p id="motionOutputHelp" class="motion-help">구성 방향과 선택한 스타일을 담은 기획 요청문입니다. Claude·GPT에 전달하면 상세 타임스토리·콘티·대본을 제안받을 수 있습니다.</p><ul id="motionWarnings" class="motion-warnings"></ul><textarea id="motionOutput" class="motion-output" readonly rows="15" aria-label="영상 기획 요청문" spellcheck="false"></textarea><div class="motion-inline-actions"><button type="button" id="motionCopyBtn" class="motion-button motion-primary">기획 요청문 복사</button><button type="button" id="motionDownloadBtn" class="motion-button">TXT 저장</button></div><p id="motionUsage" class="motion-help">요청문을 Claude·GPT에 원본 자료와 함께 전달하고 AI가 제안한 기획안을 검토하세요.</p></div>
          <div class="motion-save-row"><span id="motionSaveStatus" class="motion-help"></span><button type="button" id="motionUndoBtn" class="motion-text-btn" hidden>초기화 되돌리기</button><button type="button" id="motionResetBtn" class="motion-text-btn">초기화</button></div>
          </div>
        </div>
      </aside>
    </div><div id="motionStatus" class="motion-toast" role="status" aria-live="polite"></div>`;
  const q = (selector) => root.querySelector(selector);
  const all = (selector) => Array.from(root.querySelectorAll(selector));
  // Keep reading and keyboard order aligned with the visible three-step process.
  q(".motion-input-stack").prepend(q(".motion-editor"));
  q(".motion-layout").after(q(".motion-save-row"));
  function setStep(view, focusHeading = false) {
    const step = ["brief", "gallery", "result"].includes(view) ? view : "brief";
    root.dataset.mobileView = step;
    all(".motion-step-nav [data-motion-view]").forEach((button) => {
      const active = button.dataset.motionView === step;
      button.setAttribute("aria-pressed", String(active));
      if (active) button.setAttribute("aria-current", "step"); else button.removeAttribute("aria-current");
    });
    const label = step === "brief" ? "다음: 스타일 선택" : step === "gallery" ? "다음: 요청문 복사" : "기획 요청문 복사";
    q("#motionPrimaryBtn").textContent = `${label}${step === "result" ? "" : " →"}`;
    q("#motionPrimaryBtn").dataset.proxyLabel = label;
    q("#motionBackBtn").hidden = step !== "gallery";
    q("#motionCopyBtn").hidden = step !== "result";
    q("#motionDownloadBtn").hidden = step !== "result";
    q("#motionSampleBtn").hidden = step !== "brief";
    if (step !== "gallery") setPlaying(false);
    if (step === "gallery") {
      const gallery = q("#motionGallery"), selected = q(".motion-template.is-selected");
      gallery.scrollTop = selected ? gallery.scrollTop + selected.getBoundingClientRect().top - gallery.getBoundingClientRect().top - 3 : 0;
    }
    window.PromptDeckTabs?.syncHeaderActionStates();
    q(".motion-step-nav").scrollIntoView({ block: "start" });
    if (focusHeading) {
      const heading = step === "brief" ? q("#motionBriefTitle") : step === "gallery" ? q("#motionLibraryTitle") : q(".motion-request-block h3");
      heading.tabIndex = -1; heading.focus({ preventScroll: true });
    }
  }
  function status(message) { clearTimeout(toastTimer); q("#motionStatus").textContent = message; q("#motionStatus").classList.add("is-visible"); toastTimer = setTimeout(() => q("#motionStatus").classList.remove("is-visible"), 5000); }
  function save() {
    clearTimeout(saveTimer);
    try { localStorage.setItem(KEY, JSON.stringify(state)); q("#motionSaveStatus").textContent = "이 브라우저에 자동 저장"; }
    catch (_) { q("#motionSaveStatus").textContent = "자동 저장 불가 · TXT로 저장하세요"; }
  }
  function scheduleSave() { q("#motionSaveStatus").textContent = "저장 중…"; clearTimeout(saveTimer); saveTimer = setTimeout(save, 250); }
  function syncFields() {
    all("[data-motion-field]").forEach((field) => { const value = state[field.dataset.motionField]; if (field.type === "checkbox") field.checked = value; else field.value = value; });
    const duration = String(state.duration);
    q("#motionDurationChoice").value = ["auto", "15", "30", "60", "90", "120"].includes(duration) ? duration : "custom";
    q("#motionDuration").value = state.duration === "auto" ? "" : state.duration;
    q("#motionDuration").hidden = q("#motionDurationChoice").value !== "custom";
  }
  function renderGallery() {
    const search = query.trim().toLocaleLowerCase();
    const styles = styleCatalog.styles.filter((t) => (category === "all" || t.category === category) && `${t.name} ${t.id} ${t.visual} ${t.motion} ${styleCatalog.categories[t.category]}`.toLocaleLowerCase().includes(search));
    const recommended = ["watercolor", "swiss-motion", "blueprint", "pixel-rpg", "paper-popup", "glass-product", "caption-news", "cel-anime-80s", "ink-wash", "dataviz", "art-deco", "memphis-diorama"];
    if (category === "all") styles.sort((a, b) => (recommended.includes(a.id) ? recommended.indexOf(a.id) : 100) - (recommended.includes(b.id) ? recommended.indexOf(b.id) : 100));
    q("#motionTemplateCount").textContent = `${styles.length} / ${styleCatalog.styles.length}개`;
    q("#motionGallery").innerHTML = styles.length ? styles.map((t) => `<button type="button" class="motion-template${state.style === t.id ? " is-selected" : ""}" data-motion-style="${t.id}" aria-pressed="${state.style === t.id}"><span class="motion-thumb"><img src="${t.preview}" alt="${esc(t.name)} 참고 작품 스틸 · LemoLab" loading="lazy" width="400" height="250"><span class="motion-card-tag">${esc(styleCatalog.categories[t.category])}</span><span class="motion-card-check" aria-hidden="true">✓</span></span><span class="motion-card-content"><strong>${esc(t.name)}</strong><span>${esc(t.visual)}</span><small>${esc(t.motion)}</small></span></button>`).join("") : '<p class="motion-empty">검색 결과가 없습니다. 다른 검색어나 유형을 선택해 주세요.</p>';
    q("#motionAutoStyleBtn").setAttribute("aria-pressed", String(state.style === "auto"));
    all("[data-motion-category]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.motionCategory === category)));
  }
  function setPlaying(value) {
    playing = value;
    if (playing && !q("#motionStage svg")) q("#motionStage").innerHTML = catalog.artwork(engine.getTemplate(state.template), true);
    if (playing) q("#motionStage").classList.remove("is-fresh");
    q("#motionStage").classList.toggle("is-paused", !playing);
    q("#motionPlayBtn").textContent = playing ? "Ⅱ 일시정지" : "▶ 움직임 보기";
    q("#motionPlayBtn").setAttribute("aria-pressed", String(playing));
  }
  function renderPreview() {
    const template = engine.getTemplate(state.template);
    const style = styleCatalog.get(state.style);
    q("#motionSelectedName").textContent = style?.name || "AI가 스타일을 추천합니다";
    q("#motionDescription").textContent = style ? `${style.visual}. ${style.motion}.` : `${template.name}의 목적과 입력 내용에 맞춰 서로 다른 스타일 3안을 추천받습니다.`;
    q("#motionStage").innerHTML = style ? `<img src="${style.preview}" alt="${esc(style.name)} 참고 작품 · LemoLab">` : `<div class="motion-auto-art">${["watercolor", "blueprint", "pixel-rpg", "glass-product"].map((id) => { const example = styleCatalog.get(id); return `<figure><img src="${example.preview}" alt="${example.name} 참고 스틸 · LemoLab"><figcaption>${example.name}</figcaption></figure>`; }).join("")}</div>`;
    q("#motionPlayBtn").hidden = Boolean(style);
    q("#motionPreviewNote").textContent = style ? "LemoLab의 참고 작품 스틸 · CC BY 4.0 · 완성 영상 예시" : "스타일 비교 예시: LemoLab · CC BY 4.0. 실제 스타일은 AI가 제안";
    q("#motionReferenceLinks").innerHTML = style ? `<a href="${style.video}" target="_blank" rel="noopener noreferrer">원본 참고영상 ↗</a><a href="${style.reference}" target="_blank" rel="noopener noreferrer">스타일 설명 원문 ↗</a>` : "";
    q("#motionStage").classList.add("is-fresh");
    setPlaying(false);
  }
  function updateOutput() {
    const sample = catalog.samples.find((entry) => entry.brief.title === state.title);
    const sampleInfo = sample ? `가상 샘플: ${sample.name} · ${styleCatalog.get(state.style)?.name || "AI 스타일 추천"}. 실제 사용 전 문구·수치를 교체하세요.` : "10종의 가상 샘플을 무작위로 채우고 영상 용도·스타일도 함께 지정합니다.";
    if (q("#motionSampleInfo").textContent !== sampleInfo) q("#motionSampleInfo").textContent = sampleInfo;
    q("#motionSpecs").textContent = `${state.ratio} · ${state.duration === "auto" ? "길이·장면 수는 AI가 제안" : `희망 ${state.duration}초 · 장면 수는 AI가 제안`}${state.fps === "auto" ? "" : ` · ${state.fps}fps`}`;
    q("#motionRequestSummary").textContent = `${state.title.trim() || "주제는 제공 자료에서 결정"} · ${engine.getTemplate(state.template).name} · ${styleCatalog.get(state.style)?.name || "스타일은 AI 추천"} · ${state.ratio} · ${state.duration === "auto" ? "길이는 AI 제안" : `희망 ${state.duration}초`}`;
    q("#motionOutput").value = engine.planningPrompt(state);
    q("#motionWarnings").innerHTML = engine.warnings(state).map((message) => `<li>${esc(message)}</li>`).join("");
    q("#motionWarnings").hidden = !engine.warnings(state).length;
  }
  function refresh() { syncFields(); renderGallery(); renderPreview(); updateOutput(); save(); }
  function selectTemplate(id) {
    if (state.style === id) return;
    state.style = id;
    renderGallery(); renderPreview(); updateOutput(); save();
    q(`[data-motion-style="${id}"]`)?.focus({ preventScroll: true });
    status(id === "auto" ? "AI가 적합한 스타일을 추천하도록 요청합니다." : `${styleCatalog.get(id).name} 방향을 적용했습니다. 상세 기획은 AI가 제안합니다.`);
  }
  root.addEventListener("input", (event) => {
    const field = event.target;
    if (field.id === "motionSearch") { query = field.value; renderGallery(); return; }
    if (field.matches("[data-motion-field]")) {
      const key = field.dataset.motionField;
      state[key] = field.type === "checkbox" ? field.checked : key === "fps" ? Number(field.value) : field.value;
      if (key === "fps" && field.value === "auto") state.fps = "auto";
      if (key === "template") renderPreview();
      updateOutput(); scheduleSave();
    }
  });
  root.addEventListener("change", (event) => {
    if (event.target.id === "motionDurationChoice") {
      const value = event.target.value;
      q("#motionDuration").hidden = value !== "custom";
      state.duration = value === "auto" ? "auto" : value === "custom" ? 30 : Number(value);
      q("#motionDuration").value = state.duration === "auto" ? "" : state.duration;
      updateOutput(); save();
    }
    if (event.target.id === "motionDuration") {
      state.duration = engine.normalize({ duration: event.target.value }).duration;
      event.target.value = state.duration; updateOutput(); save();
    }
  });
  root.addEventListener("click", (event) => {
    const view = event.target.closest("[data-motion-view]");
    if (view) {
      setStep(view.dataset.motionView);
    }
    const filter = event.target.closest("[data-motion-category]");
    if (filter) { category = filter.dataset.motionCategory; renderGallery(); }
    const template = event.target.closest("[data-motion-style]");
    if (template) selectTemplate(template.dataset.motionStyle);
    if (event.target.closest("#motionAutoStyleBtn")) selectTemplate("auto");
  });
  q("#motionPlayBtn").addEventListener("click", () => setPlaying(!playing));
  q("#motionPrimaryBtn").addEventListener("click", () => {
    if (root.dataset.mobileView === "brief") setStep("gallery", true);
    else if (root.dataset.mobileView === "gallery") setStep("result", true);
    else q("#motionCopyBtn").click();
  });
  q("#motionSampleBtn").addEventListener("click", () => {
    const selection = nextSample(state);
    undoState = JSON.parse(JSON.stringify(state));
    const archived = Object.fromEntries(["scenes", "revision", "target", "format", "videoMode", "renderStyle", "pace", "camera", "transition", "palette"].map((key) => [key, state[key]]));
    state = engine.normalize({ ...engine.defaults(), ...archived, ...selection.values });
    category = "all"; query = ""; q("#motionSearch").value = "";
    q("#motionUndoBtn").textContent = "샘플 적용 되돌리기"; q("#motionUndoBtn").hidden = false;
    refresh(); status(`${selection.sample.name} 가상 샘플과 ${engine.getTemplate(state.template).name} · ${styleCatalog.get(state.style).name}를 채웠습니다.`);
  });
  q("#motionResetBtn").addEventListener("click", () => { undoState = JSON.parse(JSON.stringify(state)); state = engine.defaults(); q("#motionUndoBtn").textContent = "초기화 되돌리기"; q("#motionUndoBtn").hidden = false; refresh(); status("입력을 초기화했습니다. ‘초기화 되돌리기’로 복구할 수 있습니다."); });
  q("#motionUndoBtn").addEventListener("click", () => { if (!undoState) return; state = undoState; undoState = null; q("#motionUndoBtn").hidden = true; refresh(); status("변경 전 입력과 스타일을 복구했습니다."); });
  q("#motionCopyBtn").addEventListener("click", async () => {
    const text = q("#motionOutput").value;
    try { await navigator.clipboard.writeText(text); status("현재 프롬프트를 복사했습니다."); }
    catch (_) {
      const field = q("#motionOutput"); field.focus(); field.select();
      try { if (!document.execCommand("copy")) throw new Error("copy"); status("현재 프롬프트를 복사했습니다."); }
      catch (_) { status("자동 복사를 사용할 수 없습니다. 선택된 프롬프트를 직접 복사하거나 TXT로 저장하세요."); }
    }
  });
  q("#motionDownloadBtn").addEventListener("click", () => {
    const url = URL.createObjectURL(new Blob([q("#motionOutput").value], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `PromptDeck-motion-${state.template}-planning.txt`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    status("현재 프롬프트를 TXT로 저장했습니다.");
  });
  // Pausing when leaving the tool avoids animation work in hidden panes.
  new MutationObserver(() => { if (!pane.classList.contains("active")) setPlaying(false); }).observe(pane, { attributes: true, attributeFilter: ["class"] });
  window.addEventListener("pagehide", save);
  document.addEventListener("visibilitychange", () => { if (document.hidden) { setPlaying(false); save(); } });
  refresh();
  setStep("brief");
  window.PromptDeckTabs?.syncHeaderActionStates();
  if (storageNotice) status(storageNotice);
})();
