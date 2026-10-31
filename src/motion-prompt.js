(function () {
  "use strict";
  const root = document.getElementById("motionPromptApp");
  const pane = document.getElementById("paneMotionPrompt");
  if (!root || !pane) return;
  const engine = window.PromptDeckMotionEngine, catalog = window.PromptDeckMotionCatalog, styleCatalog = window.PromptDeckMotionStyles;
  if (!engine || !catalog || !styleCatalog) { root.textContent = "모션 스타일을 불러오지 못했습니다. 새로고침해 주세요."; return; }
  const KEY = "promptdeck.motionPrompt.v1";
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const options = (values) => Object.entries(values).map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join("");
  let state = engine.defaults(), storageNotice = "", undoState = null;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) { const value = JSON.parse(saved); if (![1, 2].includes(value?.version)) throw new Error("version"); state = engine.normalize(value); if (value.version === 1) storageNotice = "기존 내용과 장면은 보관했습니다. 이제 기본 요청문은 AI에게 상세 기획을 맡깁니다."; }
  } catch (_) { storageNotice = "저장된 설정을 읽지 못해 기본값을 표시합니다."; }
  let category = "all", query = "", outputMode = "planning", playing = false, saveTimer, toastTimer;
  const sources = [
    ["Lemo-Opuscar · 스타일 참고", "https://lemomo-ai.github.io/lemo-opuscar/", "66개 스타일의 재질·구도·움직임을 참고. 원본 스틸: LemoLab · CC BY 4.0, 이미지 파일 변경 없음. 한국어 구성 방향은 PromptDeck에서 작성"],
    ["Claude 프롬프트 가이드", "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices", "목표·문맥·입력 자료·예시·출력 형식을 구분"],
    ["OpenAI 프롬프트 가이드", "https://developers.openai.com/api/docs/guides/prompt-engineering", "역할·지침·자료의 경계를 Markdown/XML로 명시"],
    ["OpenAI 영상 프롬프트 참고", "https://developers.openai.com/cookbook/examples/sora/sora2_prompting_guide", "샷의 구도·동작·빛·타이밍 참고. 보관 문서이므로 모델·API 규격은 적용하지 않음"],
    ["Runway 영상 프롬프트 가이드", "https://help.runwayml.com/hc/en-us/articles/39789879462419-Gen-4-Video-Prompting-Guide", "영상 AI용 문장은 한 샷의 구체적인 움직임을 긍정형으로 기술"],
    ["Jitter 템플릿", "https://jitter.video/templates/", "이미지로 유형 탐색 후 텍스트·색상·움직임을 조정하는 흐름 참고"],
    ["Animaker 템플릿", "https://www.animaker.com/templates", "홍보·설명·교육·캐릭터 등 용도별 분류 참고"],
    ["Canva 애니메이션", "https://www.canva.com/features/animation-maker/", "요소별 텍스트·이미지 애니메이션과 영상 구성 참고"],
    ["GitHub · Remotion 생성 프롬프트", "https://github.com/remotion-dev/template-prompt-to-motion-graphics-saas/blob/7aeb2d6be92e3152886aec4dea8be0007ca4c41d/src/app/api/generate/route.ts", "유형별 지침, 편집 가능한 설정, 기존 코드의 부분 수정 원칙 반영"],
    ["GitHub · Remotion 공식 타이밍·전환", "https://github.com/remotion-dev/skills/tree/30d4553ecd46fbc5212fd0ff006ae43af522158b/skills/remotion-markup", "프레임 기반 계산, 전환의 중첩 시간을 고려한 전체 길이 검수 반영"],
    ["GitHub · 영상 프롬프트 모음", "https://github.com/Mikefluff/skills/blob/50d1ae8ae2528cc3a79e946ccebdb7a61e7b2e3a/common/video-prompt-library/system-prompt.md", "텍스트 기반/참조 이미지 기반 영상 구분, 한 장면의 동작을 명료하게 쓰는 원칙 참고"],
    ["GitHub · 브라우저 모션 제작", "https://github.com/RFTaurus/motion-skill/blob/c1aa65e921c970d858705fcb4a53a8294d1a4131/SKILL.md", "대상·장면 연속성, 주제에 맞는 표현 재질, 같은 시점의 재현 가능성 참고"],
  ];
  root.className = "motion-workspace";
  root.dataset.mobileView = "gallery";
  root.innerHTML = `
    <header class="motion-header"><div><span class="motion-eyebrow">DIRECTION TO AI STORYBOARD</span><h2>방향은 내가, 기획은 AI가.</h2><p>영상의 용도·내용·스타일만 정하세요. AI가 구성안을 제안하고 타임스토리·콘티·대본까지 구체화하도록 요청합니다.</p></div><span class="motion-header-badge">66가지 스타일<span>18가지 용도 · 상세 기획은 AI에게</span></span></header>
    <div class="motion-mobile-nav" role="group" aria-label="모션 제작 작업 화면"><button type="button" data-motion-view="gallery" aria-pressed="true">스타일 선택</button><button type="button" data-motion-view="brief" aria-pressed="false">구성 방향</button><button type="button" data-motion-view="result" aria-pressed="false">요청문 복사</button></div>
    <div class="motion-layout">
      <div class="motion-input-stack">
        <section class="motion-library" aria-labelledby="motionLibraryTitle">
          <div class="motion-section-heading"><div><span class="motion-step">01 / VISUAL DIRECTION</span><h3 id="motionLibraryTitle">어떤 느낌으로 보여줄까요?</h3></div><span id="motionTemplateCount" class="motion-count" role="status"></span></div>
          <label class="motion-field motion-search">스타일 검색<input id="motionSearch" type="search" placeholder="예: 수채화, 설계도, 픽셀, 뉴스, 유리" autocomplete="off"></label>
          <button type="button" class="motion-button motion-auto-style" id="motionAutoStyleBtn" aria-pressed="true">✦ AI에게 어울리는 스타일 3안 추천받기</button>
          <div class="motion-filters" role="group" aria-label="시각 스타일 필터">${Object.entries(styleCatalog.categories).map(([id, label]) => `<button type="button" data-motion-category="${id}" aria-pressed="${id === "all"}">${label}</button>`).join("")}</div>
          <div id="motionGallery" class="motion-gallery"></div>
          <p class="motion-help motion-library-note">참고 이미지: <a href="https://github.com/lemomo-ai/lemo-opuscar" target="_blank" rel="noopener noreferrer">LemoLab · Lemo-Opuscar</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. 원본 스틸을 축소해 표시하며, 사용자가 입력한 영상의 생성 결과가 아닙니다.</p><button type="button" class="motion-button motion-mobile-next" data-motion-view="result">선택한 방향과 요청문 보기 →</button>
        </section>
        <section class="motion-editor" aria-labelledby="motionBriefTitle">
          <div class="motion-section-heading"><div><span class="motion-step">02 / YOUR BRIEF</span><h3 id="motionBriefTitle">전할 내용을 넣어주세요</h3></div><button type="button" class="motion-text-btn" id="motionSampleBtn">샘플 채우기</button></div>
          <div class="motion-fields"><label class="motion-field">영상 용도<select id="motionPurpose" data-motion-field="template">${options({ auto: "AI가 목적에 맞는 영상 용도 제안", ...Object.fromEntries(catalog.templates.map((t) => [t.id, t.name])) })}</select></label><label class="motion-field">영상 주제·제목<input id="motionTitle" data-motion-field="title" maxlength="4000" placeholder="예: 지역기업 지원사업 참여 안내"></label><div class="motion-two"><label class="motion-field">시청 대상<input data-motion-field="audience" maxlength="4000" placeholder="예: 기업 담당자·참가자"></label><label class="motion-field">전달 목표·행동<input data-motion-field="goal" maxlength="4000" placeholder="예: 사업을 이해하고 신청하기"></label></div>
          <label class="motion-field">원문·핵심 내용<textarea id="motionSource" data-motion-field="source" rows="5" maxlength="20000" placeholder="넣을 문구, 실제 일정, 특징, 수치와 출처를 입력하세요. 비워 두면 기본 연출 요청문이 만들어집니다."></textarea></label>
          <label class="motion-field">사용할 자료·보존할 요소<textarea id="motionAssets" data-motion-field="assets" rows="2" maxlength="4000" placeholder="예: 첨부 로고의 형태·색상 보존, 제품 사진 3장, 실제 UI 화면, 원본 인터뷰 음성"></textarea></label><p class="motion-help">원본 파일은 프롬프트와 함께 제작 AI에 첨부하세요. 이 화면에서는 파일을 업로드하지 않습니다.</p>
          <div class="motion-two"><label class="motion-field">화면비<select id="motionRatio" data-motion-field="ratio">${options({ "16:9": "16:9 · 가로 영상", "9:16": "9:16 · 쇼츠·릴스", "1:1": "1:1 · 정사각", "4:5": "4:5 · 세로 피드" })}</select></label><label class="motion-field">희망 길이<select id="motionDurationChoice">${options({ auto: "AI가 적정 길이 제안", 15: "약 15초", 30: "약 30초", 60: "약 1분", 90: "약 1분 30초", 120: "약 2분", custom: "직접 지정" })}</select><input id="motionDuration" type="number" min="3" max="600" step="1" aria-label="희망 영상 길이 (초)" hidden></label></div>
          <div class="motion-two"><label class="motion-field">영상 AI 입력 방식<select id="motionVideoMode" data-motion-field="videoMode">${options(engine.videoModes)}</select></label><label class="motion-field">표현 재질·스타일<select id="motionRenderStyle" data-motion-field="renderStyle">${options(engine.styles)}</select></label></div>
          <details class="motion-details"><summary>연출·오디오 세부 설정</summary><div class="motion-fields">
            <div class="motion-two"><label class="motion-field">움직임 속도<select data-motion-field="pace">${options({ calm: "차분하게", balanced: "명료하게", fast: "경쾌하게" })}</select></label><label class="motion-field">프레임레이트<select data-motion-field="fps">${options({ auto: "AI가 표현 방식에 맞춰 제안", 24: "24 fps", 25: "25 fps", 30: "30 fps", 60: "60 fps" })}</select></label><label class="motion-field">카메라<select data-motion-field="camera">${options({ auto: "AI 위임 · 장면에 맞게", locked: "고정", push: "느린 전진", pan: "수평 이동", orbit: "낮은 강도의 선회", overhead: "탑뷰" })}</select></label><label class="motion-field">장면 전환<select data-motion-field="transition">${options(engine.transitions)}</select></label></div>
            <label class="motion-field">오디오<select id="motionAudio" data-motion-field="audio">${options({ auto: "AI가 적합한 음향·내레이션 제안", silent: "무음", music: "음악·효과음", narration: "내레이션 + 음악", source: "원본 음성 유지" })}</select></label><label class="motion-field">색상·조명<input data-motion-field="palette" maxlength="4000" placeholder="비우면 스타일과 주제에 맞춰 AI가 제안"></label>
            <label class="motion-field">장면 사이에 유지할 요소<input id="motionContinuity" data-motion-field="continuity" maxlength="4000" placeholder="예: 같은 캐릭터·의상, 왼쪽에서 오른쪽으로 이동, 파란 원이 다음 장면의 버튼으로 연결"></label>
            <label class="motion-check"><input id="motionLoop" type="checkbox" data-motion-field="loop">처음과 끝이 이어지는 반복 영상</label><label class="motion-field">추가 요구사항<textarea id="motionRequirements" data-motion-field="requirements" maxlength="4000" rows="2" placeholder="예: 중앙에 로고 여백, 마지막 안내 3초 유지, 과장된 회전 금지"></textarea></label>
          </div></details>
          </div>
        </section>
        <div class="motion-ai-handoff"><strong>장면 순서와 초 단위 기획은 AI가 작성합니다.</strong><p class="motion-help">스타일과 원문을 담은 요청문을 복사해 AI에 전달하면 구성안·타임스토리·콘티·대본을 받을 수 있습니다.</p><button type="button" class="motion-button motion-primary motion-mobile-next" data-motion-view="result">기획 요청문 확인 →</button></div>
        <details class="motion-details motion-legacy-scenes"><summary>기존 장면 자료 직접 편집 (선택)</summary><p class="motion-help">이전에 작성한 자료는 보관됩니다. 아래 항목을 켰을 때만 장면 수와 시간을 고정 조건으로 전달합니다.</p><label class="motion-check"><input type="checkbox" id="motionUseManualScenes" data-motion-field="useManualScenes">내가 지정한 장면표를 요청문에 반영</label><section class="motion-scenes-section" aria-labelledby="motionScenesTitle"><div class="motion-section-heading"><h3 id="motionScenesTitle">직접 지정한 장면표</h3><button type="button" class="motion-text-btn" id="motionApplyScenesBtn">용도 예시 적용</button></div><div id="motionScenes" class="motion-scenes"></div><button type="button" id="motionAddSceneBtn" class="motion-button motion-add">+ 장면 추가</button></section></details>
        <details class="motion-details motion-references"><summary>공식 문서·서비스 조사와 구성 원칙</summary><p class="motion-help">확인일 2026-10-31. 공식 문서의 원칙을 요청문에 적용했습니다. 스타일 참고 스틸은 LemoLab의 CC BY 4.0 자료이며, 한국어 스타일 방향과 기획 요청문은 PromptDeck에서 작성했습니다. 기존 SVG 용도 예시는 자체 제작 자료입니다.</p><ul>${sources.map(([label, url, note]) => `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${label} ↗</a><p>${note}</p></li>`).join("")}</ul><p class="motion-help">영상 길이·해상도·음성·참조 이미지 지원 범위는 사용하는 서비스에서 확인하고 설정하세요. 이 도구는 특정 모델의 API에 연결하지 않습니다.</p></details>
      </div>
      <aside class="motion-result-stack" aria-label="연출 미리보기와 제작 프롬프트">
        <div class="motion-result-body"><div class="motion-section-heading"><div><span class="motion-step">SELECTED DIRECTION</span><h3 id="motionSelectedName"></h3></div><span class="motion-example-badge">연출 예시</span></div>
          <div id="motionStage" class="motion-stage is-paused"></div><div class="motion-player-controls"><button type="button" id="motionPlayBtn" class="motion-button" aria-pressed="false">▶ 용도 예시 보기</button><span id="motionPreviewNote" class="motion-help"></span></div><div id="motionReferenceLinks" class="motion-reference-links"></div><p id="motionDescription" class="motion-help"></p><div id="motionSpecs" class="motion-specs"></div>
          <div id="motionTimeline" class="motion-timeline" aria-label="장면 시간 구성"></div>
          <div class="motion-output-settings"><div class="motion-two"><label class="motion-field">제작을 요청할 AI<select id="motionTarget" data-motion-field="target">${options(engine.targets)}</select></label><label class="motion-field">받을 결과물<select id="motionFormat" data-motion-field="format">${options(engine.formats)}</select></label></div></div>
          <div class="motion-output-tabs" role="tablist" aria-label="프롬프트 종류"><button type="button" id="motionOutputProduction" role="tab" aria-controls="motionOutputPanel" data-motion-output="planning" aria-selected="true">AI 기획 요청</button><button type="button" id="motionOutputVideo" role="tab" aria-controls="motionOutputPanel" data-motion-output="video" aria-selected="false" tabindex="-1">영상 AI 기획</button><button type="button" id="motionOutputBoard" role="tab" aria-controls="motionOutputPanel" data-motion-output="production" aria-selected="false" tabindex="-1">제작까지 요청</button><button type="button" id="motionOutputRevision" role="tab" aria-controls="motionOutputPanel" data-motion-output="revision" aria-selected="false" tabindex="-1">수정 요청</button></div>
          <label id="motionRevisionField" class="motion-field" hidden>기존 영상에서 수정할 점<textarea id="motionRevision" data-motion-field="revision" rows="3" maxlength="4000" placeholder="예: 2번 장면의 자막을 1초 더 유지하고, 로고·색상·나머지 장면은 그대로 유지"></textarea></label>
          <div id="motionOutputPanel" role="tabpanel" aria-labelledby="motionOutputProduction"><p id="motionOutputHelp" class="motion-help"></p><label id="motionShotField" class="motion-field" hidden>복사할 장면<select id="motionShotSelect"></select></label><ul id="motionWarnings" class="motion-warnings"></ul><textarea id="motionOutput" class="motion-output" readonly rows="15" aria-label="모션 영상 제작 프롬프트" spellcheck="false"></textarea><div class="motion-inline-actions"><button type="button" id="motionCopyBtn" class="motion-button motion-primary">프롬프트 복사</button><button type="button" id="motionDownloadBtn" class="motion-button">TXT 저장</button></div><p id="motionUsage" class="motion-help"></p></div>
          <div class="motion-save-row"><span id="motionSaveStatus" class="motion-help"></span><button type="button" id="motionUndoBtn" class="motion-text-btn" hidden>초기화 되돌리기</button><button type="button" id="motionResetBtn" class="motion-text-btn">초기화</button></div>
        </div>
      </aside>
    </div><div id="motionStatus" class="motion-toast" role="status" aria-live="polite"></div>`;
  const q = (selector) => root.querySelector(selector);
  const all = (selector) => Array.from(root.querySelectorAll(selector));
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
  function renderScenes() {
    const voiceEnabled = ["narration", "source"].includes(state.audio);
    q("#motionScenes").innerHTML = engine.timeline(state).map((scene, index) => `<details class="motion-scene" data-motion-scene="${index}" ${index === 0 ? "open" : ""}>
      <summary><span class="motion-scene-number">${scene.index}</span><strong>${esc(scene.visual || "새 장면")}</strong><span class="motion-scene-time">${scene.start}–${scene.end}초</span></summary>
      <div class="motion-scene-fields"><div class="motion-scene-tools"><label class="motion-field">길이 (초)<input type="number" min="1" max="120" step="1" data-scene-field="seconds" value="${scene.seconds}"></label><div><button type="button" class="motion-button" data-scene-action="up" aria-label="${scene.index}번 장면 위로" ${index === 0 ? "disabled" : ""}>↑</button><button type="button" class="motion-button" data-scene-action="down" aria-label="${scene.index}번 장면 아래로" ${index === state.scenes.length - 1 ? "disabled" : ""}>↓</button><button type="button" class="motion-button" data-scene-action="delete" ${state.scenes.length === 1 ? "disabled" : ""}>삭제</button></div></div>
      ${state.videoMode === "i2v" ? `<label class="motion-field">첨부할 원본 이미지 파일명<input data-scene-field="reference" maxlength="4000" value="${esc(scene.reference)}" placeholder="예: shot-01.png · 이 장면 생성 시 함께 첨부"></label>` : ""}
      <label class="motion-field">화면·피사체<textarea data-scene-field="visual" rows="2" maxlength="4000">${esc(scene.visual)}</textarea></label><label class="motion-field">구체적인 동작·타이밍<textarea data-scene-field="motion" rows="2" maxlength="4000">${esc(scene.motion)}</textarea></label>
      <label class="motion-field">화면 자막<input data-scene-field="caption" maxlength="4000" value="${esc(scene.caption)}" placeholder="실제로 넣을 문구를 정확히 입력"></label><label class="motion-field motion-voice" ${voiceEnabled ? "" : "hidden"}>${state.audio === "source" ? "원본 음성 구간·실제 발언" : "내레이션·대사"}<textarea data-scene-field="voice" rows="2" maxlength="4000">${esc(scene.voice)}</textarea></label></div></details>`).join("");
    q("#motionAddSceneBtn").disabled = state.scenes.length >= 12;
    const previous = q("#motionShotSelect").value;
    q("#motionShotSelect").innerHTML = '<option value="all">전체 장면</option>' + state.scenes.map((_, i) => `<option value="${i}">장면 ${i + 1}만</option>`).join("");
    q("#motionShotSelect").value = previous === "all" || Number(previous) < state.scenes.length ? previous || "all" : "all";
  }
  function updateOutput() {
    const total = engine.totalSeconds(state);
    const [width, height] = engine.ratios[state.ratio];
    q("#motionSpecs").textContent = `${state.ratio} · ${state.useManualScenes ? `${total}초 · 직접 지정한 ${state.scenes.length}장면` : state.duration === "auto" ? "길이·장면 수는 AI가 제안" : `희망 ${state.duration}초 · 장면 수는 AI가 제안`}${state.fps === "auto" ? "" : ` · ${state.fps}fps`}`;
    q("#motionTimeline").innerHTML = state.useManualScenes ? engine.timeline(state).map((s) => `<span style="flex:${s.seconds}" title="${esc(s.visual)}"><strong>${s.index}</strong><small>${s.seconds}초</small></span>`).join("") : '<p class="motion-help">AI가 구성안 비교 → 상세 타임스토리 → 콘티·대본을 작성하도록 요청합니다.</p>';
    all("[data-motion-scene]").forEach((element, i) => {
      const entry = engine.timeline(state)[i]; if (!entry) return;
      element.querySelector("summary strong").textContent = entry.visual || "새 장면";
      element.querySelector(".motion-scene-time").textContent = `${entry.start}–${entry.end}초`;
    });
    const shot = q("#motionShotSelect").value;
    q("#motionOutput").value = outputMode === "planning" ? engine.planningPrompt(state) : outputMode === "production" ? engine.productionPrompt(state) : outputMode === "video" ? engine.videoPrompt(state, shot === "all" ? null : Number(shot)) : engine.revisionPrompt(state);
    q("#motionOutputHelp").textContent = outputMode === "planning" ? `${engine.targets[state.target]}에게 구성 방향을 전달하고 상세 기획을 받는 요청문입니다.` : outputMode === "production" ? `AI가 상세 기획 후 ${engine.formats[state.format]}까지 작성하도록 요청합니다.` : "AI에게 타임스토리와 장면별 영상 생성 프롬프트를 함께 받는 요청문입니다.";
    q("#motionUsage").textContent = "① 요청문 복사 → ② Claude·GPT에 원본 자료와 함께 전달 → ③ AI가 제안한 구성안·타임스토리·콘티·대본을 검토하세요. 이 화면은 AI를 직접 호출하지 않습니다.";
    q("#motionShotField").hidden = outputMode !== "video" || !state.useManualScenes;
    q("#motionFormat").closest("label").hidden = outputMode !== "production";
    q("#motionRevisionField").hidden = outputMode !== "revision";
    if (outputMode === "revision") { q("#motionOutputHelp").textContent = "기존 코드와 캡처를 첨부하고 이 요청문을 전달하세요. 수정 범위와 보존할 요소를 함께 지정합니다."; q("#motionUsage").textContent = "수정할 점을 위에 입력하면 반영됩니다. 기존 코드·결과 캡처를 같은 AI 대화에 첨부하세요."; }
    q("#motionWarnings").innerHTML = engine.warnings(state).map((message) => `<li>${esc(message)}</li>`).join("");
    q("#motionWarnings").hidden = !engine.warnings(state).length;
    all("[data-motion-output]").forEach((b) => { const selected = b.dataset.motionOutput === outputMode; b.setAttribute("aria-selected", String(selected)); b.tabIndex = selected ? 0 : -1; });
    q("#motionOutputPanel").setAttribute("aria-labelledby", all("[data-motion-output]").find((b) => b.dataset.motionOutput === outputMode).id);
  }
  function refresh() { syncFields(); renderGallery(); renderPreview(); renderScenes(); updateOutput(); save(); }
  function selectTemplate(id) {
    if (state.style === id) return;
    state.style = id;
    renderGallery(); renderPreview(); renderScenes(); updateOutput(); save();
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
      if (["audio", "videoMode"].includes(key)) renderScenes();
      updateOutput(); scheduleSave();
    }
    if (field.matches("[data-scene-field]")) {
      const index = Number(field.closest("[data-motion-scene]").dataset.motionScene), key = field.dataset.sceneField;
      if (key === "seconds") {
        if (field.value === "" || !field.validity.valid) return;
        state.scenes[index][key] = Number(field.value);
      } else state.scenes[index][key] = field.value;
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
    if (event.target.matches('[data-scene-field="seconds"]')) {
      const index = Number(event.target.closest("[data-motion-scene]").dataset.motionScene);
      state.scenes[index].seconds = engine.normalize({ scenes: [{ seconds: event.target.value }] }).scenes[0].seconds;
      event.target.value = state.scenes[index].seconds; updateOutput(); save();
    }
    if (event.target.id === "motionShotSelect") updateOutput();
  });
  root.addEventListener("click", (event) => {
    const view = event.target.closest("[data-motion-view]");
    if (view) {
      root.dataset.mobileView = view.dataset.motionView;
      all(".motion-mobile-nav [data-motion-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.motionView === root.dataset.mobileView)));
      if (root.dataset.mobileView !== "result") setPlaying(false);
      q(".motion-mobile-nav").scrollIntoView({ block: "start" });
    }
    const filter = event.target.closest("[data-motion-category]");
    if (filter) { category = filter.dataset.motionCategory; renderGallery(); }
    const template = event.target.closest("[data-motion-style]");
    if (template) selectTemplate(template.dataset.motionStyle);
    if (event.target.closest("#motionAutoStyleBtn")) selectTemplate("auto");
    const output = event.target.closest("[data-motion-output]");
    if (output) { outputMode = output.dataset.motionOutput; updateOutput(); }
    const action = event.target.closest("[data-scene-action]");
    if (action && !action.disabled) {
      const index = Number(action.closest("[data-motion-scene]").dataset.motionScene), type = action.dataset.sceneAction;
      if (type === "delete" && state.scenes.length > 1) state.scenes.splice(index, 1);
      else { const next = index + (type === "up" ? -1 : 1); if (next >= 0 && next < state.scenes.length) [state.scenes[index], state.scenes[next]] = [state.scenes[next], state.scenes[index]]; }
      renderScenes(); updateOutput(); save();
      q(`#motionScenes [data-motion-scene="${Math.min(index, state.scenes.length - 1)}"] summary`)?.focus({ preventScroll: true });
    }
  });
  q(".motion-output-tabs").addEventListener("keydown", (event) => {
    const buttons = all("[data-motion-output]"), i = buttons.indexOf(event.target);
    if (i < 0 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault(); const index = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (i + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
    buttons[index].click(); buttons[index].focus();
  });
  q("#motionPlayBtn").addEventListener("click", () => setPlaying(!playing));
  q("#motionAddSceneBtn").addEventListener("click", () => {
    if (state.scenes.length >= 12) return;
    state.scenes.push({ seconds: 5, visual: "", motion: "", caption: "", voice: "", reference: "" }); renderScenes(); updateOutput(); save();
    const details = q("#motionScenes").lastElementChild; details.open = true; details.querySelector('[data-scene-field="visual"]').focus();
  });
  q("#motionApplyScenesBtn").addEventListener("click", () => {
    state.scenes = engine.scenesFor(state.template); const template = engine.getTemplate(state.template);
    if (template.ratio) state.ratio = template.ratio;
    state.loop = template.id === "loop";
    syncFields(); renderScenes(); updateOutput(); save(); status("선택한 템플릿의 기본 장면과 추천 화면비·반복 설정을 적용했습니다.");
  });
  q("#motionSampleBtn").addEventListener("click", () => {
    const template = engine.getTemplate(state.template);
    state.title = template.sample; state.audience = "이 주제에 관심 있는 일반 시청자"; state.goal = "핵심 내용을 이해하고 다음 행동으로 연결하기";
    state.source = `영상 주제: ${template.sample}\n포함할 소재: ${template.beats.join(", ")}\n핵심 메시지: 제공한 정보를 쉽고 명확하게 전달합니다.\n실제 일정·수치·기관명·제품명은 확정 자료로 교체하세요.`;
    state.assets = "사용할 원본 이미지·로고·영상·음원은 제작 AI에 별도로 첨부 예정";
    state.ratio = template.ratio || "16:9"; state.loop = template.id === "loop"; if (template.id === "music") state.audio = "music";
    refresh(); status("선택한 연출의 연습용 샘플을 채웠습니다. 실제 문구와 자료로 바꿔주세요.");
  });
  q("#motionResetBtn").addEventListener("click", () => { undoState = JSON.parse(JSON.stringify(state)); state = engine.defaults(); outputMode = "planning"; q("#motionUndoBtn").hidden = false; refresh(); status("입력을 초기화했습니다. ‘초기화 되돌리기’로 복구할 수 있습니다."); });
  q("#motionUndoBtn").addEventListener("click", () => { if (!undoState) return; state = undoState; undoState = null; q("#motionUndoBtn").hidden = true; refresh(); status("초기화 전 입력을 복구했습니다."); });
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
    const link = document.createElement("a"); link.href = url; link.download = `PromptDeck-motion-${state.template}-${outputMode}.txt`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    status("현재 프롬프트를 TXT로 저장했습니다.");
  });
  // Pausing when leaving the tool avoids animation work in hidden panes.
  new MutationObserver(() => { if (!pane.classList.contains("active")) setPlaying(false); }).observe(pane, { attributes: true, attributeFilter: ["class"] });
  window.addEventListener("pagehide", save);
  document.addEventListener("visibilitychange", () => { if (document.hidden) { setPlaying(false); save(); } });
  refresh();
  window.PromptDeckTabs?.syncHeaderActionStates();
  if (storageNotice) status(storageNotice);
})();
