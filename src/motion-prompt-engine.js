(function (global) {
  "use strict";
  const catalog = global.PromptDeckMotionCatalog;
  const ratios = { "16:9": [1920, 1080], "9:16": [1080, 1920], "1:1": [1080, 1080], "4:5": [1080, 1350] };
  const targets = { claude: "Claude", gpt: "GPT / ChatGPT" };
  const formats = { html: "HTML / CSS / JavaScript", remotion: "Remotion / React", brief: "제작 기획서·콘티" };
  const videoModes = { t2v: "텍스트 → 영상", i2v: "참조 이미지 → 영상" };
  const styles = { template: "선택한 템플릿에 맞게", flat: "플랫 벡터·2D", paper: "페이퍼·컷아웃", collage: "사진·타이포 콜라주", clay: "클레이·부드러운 3D", glass: "유리·메탈 3D", line: "선화·스케치", live: "실사·시네마틱" };
  const cameras = { auto: "내용과 템플릿에 맞춰 샷마다 가장 명료한 한 가지 카메라 동작을 선택", locked: "고정 카메라. 프레임을 안정적으로 유지", push: "피사체를 향해 느리고 일정하게 전진하는 카메라", pan: "피사체를 따라 수평으로 천천히 이동하는 카메라", orbit: "피사체 주위를 낮은 강도로 천천히 선회하는 카메라", overhead: "위에서 내려다보는 안정적인 탑뷰" };
  const paces = { calm: "차분하게. 느린 ease-in-out과 충분한 정지 시간을 사용", balanced: "명료하게. 진입·강조·읽기·퇴장을 분리", fast: "경쾌하게. 짧은 스태거를 사용하되 문구를 읽을 시간을 확보" };
  const audios = { auto: "목적·스타일·상영 환경에 맞는 음향과 내레이션 구성을 AI가 제안", silent: "무음. 정보는 화면만으로 이해할 수 있게 구성", music: "배경음악과 필요한 효과음. 내레이션 없음", narration: "한국어 내레이션과 낮은 음량의 배경음악. 대사·자막·화면을 동기화", source: "제공한 원본 음성을 사용. 실제 발언과 음원 타이밍을 보존" };
  const voices = { auto: "AI 추천", none: "음성 없음", narration: "내레이션", dialogue: "등장인물 대사", source: "원본 음성 활용" };
  const musicModes = { auto: "AI 추천", none: "배경음악 없음", suggest: "분위기에 맞는 음악 제안", source: "제공 음원 활용" };
  const effectModes = { auto: "AI 추천", none: "효과음 없음", essential: "필요한 장면에만 사용", source: "제공 효과음 활용" };
  const assetModes = { auto: "AI 추천", provided: "제공 에셋만 사용", generate: "AI 생성 에셋 중심", mixed: "제공 에셋 + AI 생성" };
  const outputModes = { production: "제작 요청문 · 코드로 영상 완성", planning: "기획 요청문 · 기획안·콘티만" };
  const environments = { agent: "코딩 에이전트 (Claude Code 등)", chat: "채팅형 AI (Claude·ChatGPT 웹)" };
  const transitions = { auto:"선택한 스타일과 이야기의 연결에 맞는 전환을 AI가 제안", cut: "명료한 컷 전환", dissolve: "짧은 디졸브", match: "같은 도형·구도를 잇는 매치 컷", wipe: "일관된 방향의 마스크 와이프" };
  const clean = (v, max = 4000) => typeof v === "string" ? v.slice(0, max).replace(/\u0000/g, "") : "";
  const choice = (v, options, fallback) => Object.hasOwn(options, v) ? v : fallback;
  const number = (v, min, max, fallback) => Number.isFinite(Number(v)) && String(v).trim() !== "" ? Math.min(max, Math.max(min, Math.round(Number(v)))) : fallback;
  function getTemplate(id) {
    if (id === "auto") return { ...catalog.templates[0], id: "auto", name: "AI가 알맞은 영상 용도와 구성을 제안", description: "목적·시청 대상·원문을 분석해 가장 효과적인 영상의 구성 방향을 선택", sample: "우리의 이야기를 더 명확하게", direction: "메시지를 가장 잘 전달할 구성과 시각적 접근을 제안", beats: ["전달할 메시지", "보여 줄 근거와 변화", "시청 후 기대하는 행동"] };
    return catalog.templates.find((t) => t.id === id) || getTemplate("auto");
  }
  function scenesFor(id) {
    const template = getTemplate(id);
    return template.beats.map((beat, index) => ({ seconds: 5, visual: beat, motion: index === 1 ? template.direction : index === 0 ? "주요 요소가 순차 등장하고 잠시 멈춘다." : "마지막 메시지를 읽을 수 있도록 안정적으로 유지한다.", caption: "", voice: "", reference: "" }));
  }
  function defaults() {
    return { version: 4, outputMode: "production", environment: "agent", template: "auto", style: "auto", useManualScenes: false, duration: "auto", target: "claude", format: "brief", videoMode: "t2v", renderStyle: "template", continuity: "", revision: "", ratio: "16:9", fps: "auto", title: "", audience: "", goal: "", source: "", assets: "", requirements: "", palette: "", camera: "auto", pace: "balanced", audio: "auto", transition: "auto", loop: false, scenes: scenesFor("auto"), channel: "", background: "", voice: "auto", voiceDirection: "", bgm: "auto", sfx: "auto", assetMode: "auto" };
  }
  function normalize(input) {
    const raw = input && typeof input === "object" ? input : {};
    const state = defaults();
    state.template = getTemplate(raw.template).id;
    state.style = global.PromptDeckMotionStyles?.get(raw.style)?.id || "auto";
    // Legacy scene data stays saved, but detailed planning is always delegated to AI.
    state.useManualScenes = false;
    state.duration = raw.duration === "auto" || raw.duration == null ? "auto" : number(raw.duration, 3, 600, 30);
    ["title", "audience", "goal", "source", "assets", "requirements", "palette", "continuity", "revision", "channel", "background", "voiceDirection"].forEach((key) => { state[key] = clean(raw[key], key === "source" ? 20000 : 4000); });
    Object.entries({ outputMode: outputModes, environment: environments, target: targets, format: formats, videoMode: videoModes, renderStyle: styles, ratio: ratios, camera: cameras, pace: paces, audio: audios, transition: transitions }).forEach(([key, values]) => { state[key] = choice(raw[key], values, state[key]); });
    const oldAudio = { auto: ["auto", "auto", "auto"], silent: ["none", "none", "none"], music: ["none", "suggest", "essential"], narration: ["narration", "suggest", "auto"], source: ["source", "auto", "auto"] }[state.audio];
    state.voice = choice(raw.voice, voices, oldAudio[0]);
    state.bgm = choice(raw.bgm, musicModes, oldAudio[1]);
    state.sfx = choice(raw.sfx, effectModes, oldAudio[2]);
    state.assetMode = choice(raw.assetMode, assetModes, "auto");
    // Remove only the notice and wording generated by older built-in samples.
    const oldSampleNotice = "연습용 가상 데이터입니다. 기관·제품·행사·수치는 예시이며 실제 홍보 전에 확정 자료로 교체하세요.";
    if (state.source.startsWith(oldSampleNotice)) {
      state.source = state.source.slice(oldSampleNotice.length).trimStart().replace(/가상 공간인 /g, "").replace(/가상 /g, "").replace(/^주의: 실제 지리 자료가 아닌 연습용 동선입니다\.\n?/m, "");
      state.assets = state.assets.replace(/가상 /g, "").replace(/^미첨부 예시 자료: /, "");
      state.requirements = state.requirements.replace("가상 동선을 실제 지리처럼 단정하지 말고 자료가 제공되면 ", "제공 자료의 ");
    }
    state.fps = [24, 25, 30, 60].includes(Number(raw.fps)) ? Number(raw.fps) : "auto";
    state.loop = raw.loop === true;
    state.scenes = Array.isArray(raw.scenes) && raw.scenes.length ? raw.scenes.slice(0, 12).map((scene) => ({ seconds: number(scene?.seconds, 1, 120, 5), visual: clean(scene?.visual), motion: clean(scene?.motion), caption: clean(scene?.caption), voice: clean(scene?.voice), reference: clean(scene?.reference) })) : scenesFor(state.template);
    return state;
  }
  function warnings(state) {
    const notices = [];
    if (!state.title.trim() && !state.source.trim()) notices.push("주제 또는 원문을 넣으면 실제 내용에 맞춘 요청문이 됩니다. 현재는 선택한 연출의 기본 요청문입니다.");
    if (["logo", "ui", "photo", "map", "interview", "product"].includes(state.template) && !state.assets.trim()) notices.push("이 유형은 원본 자료가 중요합니다. 로고·화면·사진·지도·영상 등 사용할 자료를 적고 제작 AI에 함께 첨부하세요.");
    if (state.template === "music" && state.voice === "none" && state.bgm === "none" && state.sfx === "none") notices.push("무음 설정입니다. 음악에 맞추려면 배경음악을 지정하세요.");
    if ([state.voice, state.bgm, state.sfx].includes("source") && !state.assets.trim()) notices.push("활용할 원본 음성·음악·효과음 파일을 에셋 목록에 적고 AI에 함께 첨부하세요.");
    if (state.style === "auto") notices.push("스타일을 직접 고르면 해당 스타일의 상세 제작 사양을 요청문에 포함합니다.");
    else if (!styleSpec(state.style)) notices.push("선택한 스타일의 상세 사양을 아직 불러오지 못했습니다. 사양이 들어간 뒤 복사하세요.");
    if (state.outputMode === "production" && state.environment === "chat") notices.push("MP4 완성에는 렌더 명령을 실행할 환경이 필요합니다. 채팅형 AI가 제공한 코드를 로컬에서 실행하거나 코딩 에이전트에서 이어서 제작하세요.");
    return notices;
  }
  function styleSpec(id) {
    const spec = global.PromptDeckMotionStylePrompts?.[id];
    const style = global.PromptDeckMotionStyles?.get(id);
    return spec && style && spec.id === id && spec.revision === global.PromptDeckMotionStyles.revision
      && spec.source === style.reference && /^[a-f0-9]{64}$/.test(spec.sourceSha256)
      && typeof spec.title === "string" && spec.title.trim()
      && typeof spec.text === "string" && spec.text.length > 1000 ? spec : null;
  }
  const specFile = (id) => `assets/motion-style-prompts/${encodeURIComponent(id)}.js`;
  function context(state, opts = {}) {
    const template = getTemplate(state.template), style = global.PromptDeckMotionStyles?.get(state.style);
    const muted = state.voice === "none" && state.bgm === "none" && state.sfx === "none";
    const rows = [
      ["주제", state.title], ["대상", state.audience], ["목표·기대 행동", state.goal],
      ["용도", state.template === "auto" ? "" : template.name],
      ["용도별 연출 지침", state.template === "auto" ? "" : template.direction],
      ["다룰 흐름 (참고용, 장면 수 고정 아님)", state.template === "auto" ? "" : template.beats.join(" → ")],
      ["게시·상영", state.channel],
      ["규격", opts.size || state.ratio + " / " + (state.duration === "auto" ? "길이 AI 추천" : state.duration + "초")],
      ["스타일", opts.style || (style ? style.name + " / " + style.visual + " / " + style.motion : "3안 비교 후 1안 추천")],
      ["장소·배경", state.background],
      ["소리", muted ? "무음" : ""],
      ["음성", muted || state.voice === "auto" ? "" : voices[state.voice]],
      ["음성 톤·언어", ["none", "source"].includes(state.voice) ? "" : state.voiceDirection],
      ["배경음악", muted || state.bgm === "auto" ? "" : musicModes[state.bgm]],
      ["효과음", muted || state.sfx === "auto" ? "" : effectModes[state.sfx]],
      ["에셋 활용", state.assetMode === "auto" ? "" : assetModes[state.assetMode]],
      ["보유 에셋·보존 요소", state.assets],
      ["장면 간 유지 요소", state.continuity],
      ["반복", state.loop ? "처음과 끝이 이어지는 루프" : ""],
      ["추가 조건", state.requirements],
      ["내용", state.source],
    ];
    return rows.filter(([, value]) => String(value).trim()).map(([label, value]) => "- " + label + ": " + String(value).replace(/\r\n?/g, "\n").trim().replace(/\n/g, "\n  - ")).join("\n");
  }
  function planningPrompt(raw) {
    const state = normalize(raw);
    const spec = state.style === "auto" ? null : styleSpec(state.style), muted = isMuted(state);
    const sound = [];
    if (state.voice !== "none") sound.push(state.voice === "auto" ? "음성 필요 여부·사용 시 원고/목소리" : state.voice === "source" ? "원본 음성 활용 구간·발언 보존" : state.voice === "dialogue" ? "등장인물별 대사·목소리" : "내레이션 원고·목소리");
    if (state.bgm !== "none") sound.push(state.bgm === "auto" ? "배경음악 필요 여부·분위기" : state.bgm === "source" ? "제공 음원 사용 구간" : "배경음악 분위기·진입/종료");
    if (state.sfx !== "none") sound.push(state.sfx === "auto" ? "효과음 필요 여부·타이밍" : state.sfx === "source" ? "제공 효과음 배치" : "효과음 종류·타이밍");
    const assetPlan = { auto: "에셋 확보·장면별 배치·필요 자료", provided: "제공 에셋의 편집·배치·부족한 원본 목록", generate: "AI 생성 에셋 목록·제작 방향·배치", mixed: "에셋별 원본/AI 생성 구분·배치" }[state.assetMode];
    return [
      "영상 기획 제안",
      "- 아래 조건으로 기획안 1개를 짧은 개조식으로 작성",
      "- 제공 사실·문구·원본 형태 유지, 미정 조건은 AI 추천·미확인 자료는 표시",
      "",
      "기획 조건",
      context(state),
      "",
      "제안할 내용",
      "- 대상·목표·콘셉트·핵심 메시지·전체 길이",
      "- 타임스토리·콘티: 장면별 시작–종료 시간·화면/배경·동작·자막",
      "- " + (sound.length ? sound.join(" / ") + (state.voice !== "none" && state.bgm !== "none" ? " (음성 우선 음량)" : "") : "무음 구성: 화면·자막으로 전달"),
      "- " + assetPlan,
      ...(spec ? [
        "- 스타일 사양에 맞춘 샷 리스트: 샷별 프레이밍·카메라 이동·길이·그렇게 찍는 이유",
        "- 사양의 Native moves 중 감정의 정점에 둘 연출 1개, 전환 규칙, 자막·타이틀 디자인",
        ...(muted ? [] : ["- 큐 맵: 선택한 음성·배경음악·효과음만 장면별 진입/종료와 연결. 원본 활용은 제공 파일의 사용 구간을 지정"]),
        "",
        ...styleBlock(state, spec),
      ] : []),
    ].join("\n");
  }
  function isMuted(state) { return state.voice === "none" && state.bgm === "none" && state.sfx === "none"; }
  function styleBlock(state, spec) {
    const style = global.PromptDeckMotionStyles?.get(state.style);
    return [
      `스타일 사양: ${spec.title}${style ? " (" + style.name + ")" : ""}`,
      `- 출처: LemoLab Lemo-Opuscar STYLE.md (MIT, 커밋 ${String(spec.revision).slice(0, 7)}). 영어 원문을 그대로 두고 데모 엔진 파일 안내만 뺐다.`,
      ...(style ? [`- 참고 스틸: ${style.id}.jpg를 별도 첨부하거나 ${style.referenceImage} 참조. 실제 확인하지 않은 파일을 첨부·분석했다고 말하지 않는다.`, `- 프리셋 영상: ${style.video}`] : []),
      "- 적용 우선순위: 사용자가 확정한 사실·문구·원본·규격·음향 조건 > 용도별 사실 보존 > 스타일 사양 > 일반 제작 지침.",
      "- 원문의 고정 화면비·프레임레이트·길이·언어·가상 제품 예시는 사용자 조건에 맞춰 조정한다. 제공한 실제 제품·기관·로고를 임의로 바꾸지 않는다. 예시 줄거리와 장면 순서는 가져오지 않는다.",
      "- 예시 색·서체·악기·구조는 선택지다. 주제에 맞게 고른다. 사양이 가리키는 demo/ 폴더·엔진·DEMO.md는 제공되지 않으므로 설명된 기법을 직접 구현한다.",
      ...audioOverrides(state),
      "",
      "<<<STYLE",
      styleText(state, spec),
      "STYLE>>>",
      "- 위 사양을 사용자 조건에 맞게 적용한다. 지정한 전체 길이 안에서 장면을 구성하고 장면 수·카메라 이동 수를 고정하지 않는다.",
    ];
  }
  function audioOverrides(state) {
    const rules = [];
    if (isMuted(state)) return ["- 무음 영상이므로 사양의 Sound palette 절은 뺐다. 사양의 다른 곳에 나오는 소리 지시도 적용하지 않는다."];
    for (const [key, label] of [["voice", "음성"], ["bgm", "배경음악"], ["sfx", "효과음"]]) {
      if (state[key] === "none") rules.push(`- ${label} 없음: 스타일 원문에 관련 권장이 있어도 추가하지 않는다.`);
      if (state[key] === "source") rules.push(`- ${label} 원본 활용: 제공 파일만 사용하며 새로 합성·작곡·대체하지 않는다. 파일이 없으면 필요한 자료로 표시한다.`);
    }
    if (rules.length) rules.push("- 개별 음향 선택과 충돌하는 Sound palette 절은 제외했다. 나머지 절의 소리 지시도 위 선택에 맞는 부분만 적용한다.");
    return rules;
  }
  const styleText = (state, spec) => [state.voice, state.bgm, state.sfx].some((value) => ["none", "source"].includes(value))
    ? spec.text.replace(/\n## \d+\. Sound palette\r?\n[\s\S]*?(?=\n## |$)/, "\n") : spec.text;
  function styleIndex() {
    const catalog = global.PromptDeckMotionStyles;
    if (!catalog) return [];
    return catalog.styles.map((style) => `- ${style.id} | ${style.name} | ${style.visual}`);
  }
  function productionPrompt(raw) {
    const state = normalize(raw);
    const style = global.PromptDeckMotionStyles?.get(state.style);
    const spec = style ? styleSpec(style.id) : null;
    const muted = isMuted(state), chat = state.environment === "chat";
    const [width, height] = ratios[state.ratio];
    const fps = state.fps === "auto" ? "24fps (스타일 사양이 다른 프레임레이트를 정하면 그 값)" : state.fps + "fps";
    const length = state.duration === "auto" ? "30~60초 안에서 내용에 맞게" : state.duration + "초";
    const voiceOn = !["none"].includes(state.voice), musicOn = state.bgm !== "none", sfxOn = state.sfx !== "none";
    const tracks = [voiceOn && "음성", musicOn && "음악", sfxOn && "효과음"].filter(Boolean).join("·");
    const language = ["none", "source"].includes(state.voice) ? "" : state.voiceDirection.trim() || "한국어";
    const sound = muted ? "무음. 화면과 필요한 자막만으로 전달" : [
      voiceOn ? { auto: "내레이션 필요 여부를 판단 (정보 전달 영상이면 내레이션 권장)", narration: "내레이션", dialogue: "등장인물 대사", source: "제공한 원본 음성 (발언·타이밍 보존)" }[state.voice] : "음성 없음",
      musicOn ? { auto: "스타일 사운드 팔레트로 오리지널 음악", suggest: "스타일 사운드 팔레트로 오리지널 음악", source: "제공 음원" }[state.bgm] : "배경음악 없음",
      sfxOn ? { auto: "동작마다 재질에 맞는 효과음", essential: "필요한 장면에만 효과음", source: "제공 효과음" }[state.sfx] : "효과음 없음",
    ].join(" / ");
    const conditions = context(state, { size: `${width}×${height} (${state.ratio}), ${fps}, 길이 ${length}`, style: style ? `${style.name}${spec ? " · 아래 스타일 사양을 따른다" : ""}` : "아래 목록에서 추천 (1단계 질문에서 확정)" })
      .split("\n").filter((line) => !/^- (소리|음성|음성 톤·언어|배경음악|효과음): /.test(line)).join("\n");
    const lines = [
      "코드 영상 제작 요청",
      "너는 이 영상의 감독이자 제작자다. 시간에 따라 프레임을 그리는 코드로 화면·자막과 선택한 음향을 구성하고 MP4로 완성한다. 제공 자료만 사용을 선택했다면 그 자료만 편집하며 부족한 자료는 요청한다.",
      spec ? "목표는 아래 「스타일 사양」을 따른 프리셋 영상과 같은 재질·색·서체·움직임·카메라·소리 수준이다. 이야기·장면·구도는 프리셋을 복사하지 않고 내 내용으로 새로 설계한다." : "스타일은 1단계에서 확정한 뒤, 그 스타일의 사양을 끝까지 일관되게 지킨다.",
      muted ? "영상은 메시지 전달·시각적 리듬·연출을 기준으로 평가한다." : "영상은 메시지 전달·선택한 음향·리듬·연출을 기준으로 평가한다.",
      "",
      "1. 영상 조건",
      conditions,
      `- 소리: ${sound}`,
      ...(muted || !language ? [] : [`- 음성·자막 언어: ${language}`]),
      "",
      "2. 우선순위",
      "1) 내가 준 사실·문구·수치·원본 자료와 명시한 조건 (화면비·길이·소리 설정 등)",
      "2) 영상 용도의 사실 보존: 데이터의 단위·비교 기간, 지도의 위치 관계, 제품·앱의 실제 기능",
      "3) 스타일 사양",
      "4) 아래 연출·기술 기준",
      "자료에 없는 수치·인용·로고는 만들지 않는다. 비어 있는 사실은 TREATMENT.md에 확인 필요로 표시한다.",
      "",
      "3. 작업 순서",
      `1) 질문은 처음에 한 번만: 내용상 정할 수 없는 것, 내가 가진 음성·음악·로고·사진 자료, 스토리보드를 먼저 볼지${style ? "" : ", 스타일 3안 중 무엇으로 할지"}${chat ? "" : ", 없는 시스템 도구(Node 20+, ffmpeg 7+, Python 3.11+)"}를 한 메시지로 묻고 그 뒤로는 묻지 않고 끝까지 진행한다.`,
      "2) 벤치마크: 이 스타일과 주제의 기준이 될 작품 1~2개를 직접 고르고, 배울 것(구도·속도·카메라 문법·색 논리·음악 구조)과 가져오지 않을 것(캐릭터·디자인·멜로디·특정 샷·로고·서체)을 적는다.",
      "3) TREATMENT.md를 그리기 전에 쓴다: 구조 후보 3개와 선택 이유 / 로그라인과 전개(설정→전환→결말) / 벤치마크 / 샷 리스트(프레이밍·앵글·카메라 이동·길이·이유) / 초 단위 비트 시트" + (muted ? "" : ` / 큐 맵(선택한 ${tracks}의 사용 구간·핵심 동작과의 타이밍, 원본 파일의 사용 구간 표시)` ) + " / 자막·타이틀 디자인.",
      "4) 룩 확인: 실제 그리기 코드로 스타일 프레임 3장(그중 하나는 시그니처 샷, 캐릭터가 있으면 턴어라운드·표정·포즈 모델 시트 추가)을 렌더하고 스타일 사양과 하나씩 대조한다. 스토리보드를 원하면 핵심 샷 6~9개를 한 장에 모아 보여 주고 승인을 받은 뒤 진행한다.",
      "5) 제작: 화면" + (muted ? "과 자막을" : `·${tracks}·자막을`) + " 하나의 타임라인으로 만든다.",
      "6) 검수 후 한 번의 수정 라운드로 발견된 문제를 모두 고치고, 한 번 더 확인한 뒤 납품한다.",
      "",
      "4. 연출 기준",
      "- 하나의 주체(인물·제품·아이디어), 하나의 목표, 하나의 전환. 첫 3초 안에 시선을 잡고(느린 로고 등장으로 시작하지 않는다), 결말은 오프닝과 호응한다.",
      `- ${spec ? "사양의 Native moves" : "스타일 고유의 연출"} 중 이야기에 맞는 하나, 또는 새로 만든 매체 고유의 연출을 감정의 정점에 둔다. 설명이 필요한 장치는 뺀다.`,
      "- 카메라: 선택한 스타일과 장면의 목적에 맞는 프레이밍을 사용한다. 고정 화면도 허용하며 이동의 수를 채우려고 불필요한 동작을 넣지 않는다.",
      "- 전환은 선택한 스타일의 규칙과 이야기의 연결에 맞춰 설계한다. 컷·페이드의 허용 여부도 해당 스타일을 따른다.",
      "- 리듬: 빠름과 느림을 교차하고, 뚜렷한 가속이나 감속 한 번, 숨 고르는 롱테이크나 정지 한 번을 둔다. 모든 박에 컷을 붙이지 않는다.",
      "- 핵심 순간에는 주체가 화면 높이의 1/3 이상을 차지하고 실루엣이 읽혀야 한다. 의미 있는 동작은 예비 동작→동작→후속 동작으로 연기한다.",
      "- 읽기 시간: 실제 발화와 문구 길이를 확인해 자막·타이틀의 정지 시간을 정한다. 지정한 전체 길이를 넘으면 화면당 문구나 장면 수를 줄이고, 확인하지 않은 발화 길이는 추정으로 표시한다.",
      "- 자주 생기는 실패를 피한다: 주체가 너무 작거나 가장자리에 붙음, 어두워서 안 읽힘, 같은 색 위의 같은 색, 자막이 주체를 가림, 너무 빨라 이해되지 않는 동작, 전환 중 빈 프레임, 카메라가 움직인 뒤 효과가 주체를 놓침.",
      ...(muted ? [
        "- 무음 영상이다. 스타일 사양의 음향 규칙은 적용하지 않고 움직임의 박자·정지·속도 변화로 리듬을 만든다.",
      ] : [
        "- 선택한 음향만 사용한다. 음성·배경음악·효과음의 없음 또는 원본 활용 조건을 각각 지키고, 필요한 정지·전환을 영상 길이에 맞춰 배치한다.",
        ...(musicOn && state.bgm !== "source" ? ["- 음악은 스타일과 내용에 맞는 악기·분위기로 작곡한다. 음악의 박과 핵심 동작의 타이밍을 맞춘다."] : []),
      ]),
      "",
      "5. 기술 기준",
      "- 화면은 시간의 함수다. index.html에 window.DUR(초), window.render(t), window.READY(폰트·이미지 로드 후 true)를 둔다. render(t)는 결정적이어야 한다: Date.now, 시드 없는 Math.random, 이전 프레임 상태를 쓰지 않으며 어떤 프레임도 단독으로 같은 결과가 나온다.",
      "- 2D는 Canvas 2D, 3D는 three.js, 필름 손상·CRT·잉크 같은 후처리는 WebGL2. 스톱모션·픽셀·셀 룩은 2프레임씩(12fps) 움직이되 카메라와 빛은 매 프레임 부드럽게.",
      "- 주체를 따라가는 효과(아이리스·줌·스포트라이트)는 하나의 world→screen 함수로 계산한다. 레이아웃은 innerWidth×innerHeight 기준으로 잡는다.",
      "- 렌더: 헤드리스 Chrome(Playwright)에서 프레임마다 render(t)를 호출해 JPEG로 캡처하고 ffmpeg로 인코딩한다. 필름 그레인은 페이지가 아니라 ffmpeg에서 넣는다(밝은 배경은 약하게, 픽셀·벡터 룩은 없음).",
      "- 하나의 타임라인 파일(구간·히트 포인트)을 화면" + (muted ? "과 자막이" : `·${tracks}·자막·검사 스크립트가`) + " 함께 읽는다." + (muted ? "" : " 시각적 동작과 선택한 음향 큐의 타이밍을 검사한다."),
      ...(voiceOn && !muted ? [state.voice === "source"
        ? "- 음성: 제공한 녹음을 그대로 쓰고 음성 인식(faster-whisper 등)으로 단어 타이밍을 뽑아 자막과 화면을 맞춘다."
        : "- 음성: 지정한 화자·확정된 프로젝트 화자·제공 녹음을 우선한다. 한국어 내레이션에서 화자를 지정하지 않은 경우에만 로컬 Supertonic 3 남성 M1을 기본으로 사용한다. 속도는 실제 문장과 자막 구간에 맞춘다. TTS의 숫자는 읽는 말로 풀고 자막에는 원래 표기를 유지하며, 합성 결과와 원고·타이밍을 대조한다.",
        ...(state.voice === "source" ? [] : ["- 공개 영상에 합성 내레이션을 사용하면 설명 또는 게시물 캡션에 실제 모델·화자를 표시한다(기본 화자를 쓴 경우: AI 합성 내레이션(Supertonic 3 M1))."])] : []),
      ...(musicOn && !muted ? [state.bgm === "source" ? "- 음악: 제공 음원을 큐 맵 기준으로 편집해 쓴다." : "- 음악: 큐 맵에 맞춘 오리지널 곡. 무료 샘플 라이브러리(VSCO 2 CE, VCSL, Salamander Grand Piano 등)나 numpy 합성을 쓰고, 20~120Hz 저역이 과하지 않게 밴드별 에너지를 확인한다."] : []),
      ...(sfxOn && !muted ? [state.sfx === "source" ? "- 효과음: 제공 효과음만 이벤트 목록(window.EV)의 타이밍에 맞춰 배치한다. 파일이 없으면 요청하고 합성으로 대체하지 않는다." : "- 효과음: 이벤트 목록(window.EV)에서 프레임 단위로 배치한다. 필요한 재질의 소리를 합성할 수 있다."] : []),
      ...(!muted ? ["- 믹스: 선택한 트랙만 마스터링한다. 음성과 음악을 함께 사용할 때 음성의 명료도를 우선하고, −14 LUFS·true peak 제한을 검수한다."] : []),
      "- 자막: 스타일 사양의 서체·배치로 화면 안에 그려 넣고 같은 타이밍의 .srt도 내보낸다.",
      "- 폰트: OFL 폰트를 프로젝트 fonts/에 두고 @font-face로 쓰며, 모든 굵기를 로드한 뒤 그린다. 한글은 Noto Sans KR·Noto Serif KR 등에서 쓰는 글자만 서브셋한다. 렌더 중 외부 폰트 링크는 쓰지 않는다.",
      "- 에셋은 CC0·CC BY·OFL이거나 내가 준 자료만 쓴다. 사실을 다루는 영상은 FACTS.md에 주장별 출처를 남긴다.",
      "",
      "6. 검수와 납품",
      "- 1~2초 간격 콘택트 시트를 두 번 훑고, 핵심 동작은 0.2초 간격 프레임 스트립으로 확인한다." + (muted ? "" : " 최종 파일은 ebur128(라우드니스)·blackdetect(빈 프레임)로 검사하고, 음성이 있으면 최종 믹스를 다시 음성 인식한다.") + " 마지막으로 실제 속도로 한 번 본다.",
      "- 프리셋 데모와 달라야 한다: 구조·오프닝·시그니처 샷·카메라 경로·음악 구성·엔딩 중 4개 이상을 다르게 하고, 같은 것은 다시 생각한다.",
      chat
        ? "- 납품물: TREATMENT.md / 생략 없는 단일 index.html(브라우저에서 재생·일시정지·스크러빙 가능, 선택한 음향은 Web Audio와 제공 파일 슬롯으로 구성, 원본 활용 트랙은 합성하지 않음) / Playwright로 프레임을 캡처해 ffmpeg로 MP4를 만드는 render.mjs와 실행 명령 / CREDITS. 코드는 줄임표 없이 전체를 준다."
        : "- 납품물(프로젝트 폴더): <이름>.mp4와 poster.jpg" + (muted ? "" : ", 자막·음성이 있으면 <이름>.srt") + ", TREATMENT.md, CREDITS(모든 서드파티 에셋의 출처·라이선스), 소스와 한 번에 다시 빌드하는 build.sh. 끝나면 폴더 위치와 수정하지 못한 점을 한 줄로 알려 준다.",
      "- 저작권: 참고 작품은 문법만 배운다. 캐릭터·디자인·멜로디·샷·로고·서체를 복사하지 않고, 권리가 확인되지 않은 실제 브랜드·작품은 가상의 대체물로 그린다.",
      "",
    ];
    if (spec) lines.push("7. " + styleBlock(state, spec)[0], ...styleBlock(state, spec).slice(1));
    else if (style) lines.push(`7. 스타일: ${style.name}`, `- 상세 사양 원문: ${style.reference}`, `- 화면: ${style.visual}`, `- 움직임: ${style.motion}`, "- 원문을 읽을 수 있으면 읽고 그 사양을 따른다.");
    else lines.push("7. 스타일 후보 (slug | 이름 | 화면)", "- 내용에 맞는 3개를 비교해 추천하고 1안의 이유를 쓴다. 내가 확정하면 그 스타일의 STYLE.md 원문을 읽고 그 사양으로 제작한다.", `- 원문 주소: https://github.com/lemomo-ai/lemo-opuscar/blob/${global.PromptDeckMotionStyles?.revision || "main"}/styles/{slug}/STYLE.md`, ...styleIndex());
    return lines.join("\n");
  }
  function prompt(raw) {
    const state = normalize(raw);
    return state.outputMode === "planning" ? planningPrompt(state) : productionPrompt(state);
  }
  global.PromptDeckMotionEngine = Object.freeze({ defaults, normalize, getTemplate, warnings, prompt, planningPrompt, productionPrompt, styleSpec, specFile, ratios, styles, transitions, voices, musicModes, effectModes, assetModes, outputModes, environments });
})(globalThis);
