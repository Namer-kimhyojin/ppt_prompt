(function (global) {
  "use strict";
  const types = Object.freeze({ character: "인물 시트", background: "배경 시트", prop: "도구 시트" });
  const layouts = Object.freeze({
    character: { turnaround: "정면·측면·후면 전신", expression: "기본 얼굴 + 표정 6종", pose: "기본 전신 + 동작 4종" },
    background: { location: "공간 전경 + 핵심 구역 3곳", angles: "같은 장소의 시점 4종", layers: "전체 전경 + 전경·중경·후경 분리" },
    prop: { turnaround: "정면·측면·후면 + 3/4 시점", states: "기본 형태 + 사용 상태 3종", parts: "완성 형태 + 주요 부품·재질 상세" },
  });
  const ratios = Object.freeze({ "3:2": "3:2 · 가로", "16:9": "16:9 · 가로 영상", "9:16": "9:16 · 쇼츠·릴스", "1:1": "1:1 · 정사각", "4:5": "4:5 · 세로 피드", "2:3": "2:3 · 세로" });
  const backdrops = Object.freeze({ white: "흰색 단색", transparent: "투명 배경" });
  const modes = Object.freeze({ sheet: "참조 시트 1장", single: "편집용 단일 에셋 1장", separate: "구성별 개별 이미지" });
  const placements = Object.freeze({ center: "중앙", left: "왼쪽 · 오른쪽 여백", right: "오른쪽 · 왼쪽 여백" });
  const safeAreas = Object.freeze({ none: "별도 여백 없음", bottom: "하단 20% · 자막", top: "상단 15% · 제목", center: "중앙 40% · 타이틀" });
  const movements = Object.freeze({ none: "고정 화면", pan: "좌우 이동용 · 가장자리 15% 여유", zoom: "확대용 · 대상 주변 20% 여유" });
  const sizes = Object.freeze({ hd: "기본 · 긴 변 1920px", uhd: "고해상도 · 긴 변 3840px" });
  const variants = {
    character: {
      turnaround: ["정면 전신", "측면 전신", "후면 전신"],
      expression: ["기본 얼굴", "기쁜 표정", "슬픈 표정", "놀란 표정", "화난 표정", "걱정하는 표정", "자신 있는 표정"],
      pose: ["기본 서 있는 전신", "걷는 동작", "손으로 안내하는 동작", "인사하는 동작", "설명하는 동작"],
    },
    background: { location: ["공간 전체 전경", "핵심 구역 1", "핵심 구역 2", "핵심 구역 3"], angles: ["정면 시점", "왼쪽 3/4 시점", "오른쪽 3/4 시점", "반대편 시점"], layers: ["전체 전경 · 합성 기준", "전경 레이어", "중경 레이어", "후경 레이어"] },
    prop: { turnaround: ["정면", "측면", "후면", "3/4 시점"], states: ["기본 형태", "사용 준비 상태", "사용 중 상태", "사용 완료 상태"], parts: ["완성 형태", "주요 부품 1", "주요 부품 2", "재질 확대"] },
  };
  const presets = Object.freeze({
    cutout: { label: "인물 합성 PNG", type: "character", mode: "single", backdrop: "transparent", ratio: "9:16", layout: "turnaround", safeArea: "bottom" },
    portrait: { label: "쇼츠 배경", type: "background", mode: "single", ratio: "9:16", layout: "location", safeArea: "center" },
    parallax: { label: "패럴랙스 배경", type: "background", mode: "separate", ratio: "16:9", layout: "layers", movement: "pan" },
    product: { label: "제품·소품 PNG", type: "prop", mode: "single", backdrop: "transparent", ratio: "1:1", layout: "turnaround" },
  });
  const text = (value, max = 4000) => typeof value === "string" ? value.replace(/\r\n?/g, "\n").trim().slice(0, max) : "";
  const choice = (value, options, fallback) => Object.hasOwn(options, value) ? value : fallback;
  function styleSnapshot(value) {
    if (!value || typeof value !== "object") return null;
    const name = text(value.nameKo || value.name, 150);
    if (!name) return null;
    return { id: text(value.id, 150), name, description: text(value.desc || value.description, 600), technique: text(value.suffix || value.technique || value.promptSummaryEn, 1000) };
  }
  function defaults() {
    return { version: 1, type: "character", video: "", world: "", style: null,
      palette: "아이보리·청록·짙은 남색, 절제된 채도", lighting: "부드러운 확산광, 약한 그림자", reference: "", consistency: "",
      sheets: Object.fromEntries(Object.keys(types).map((type) => [type, { name: "", details: "", reference: "", extras: "", shot: "", negative: "", mode: "sheet", placement: "center", safeArea: "none", movement: "none", size: "hd", layout: Object.keys(layouts[type])[0], ratio: "3:2", backdrop: "white" }])) };
  }
  function normalize(value) {
    const input = value && typeof value === "object" ? value : {};
    const state = defaults();
    for (const key of ["video", "world", "palette", "lighting", "reference", "consistency"]) if (typeof input[key] === "string") state[key] = text(input[key]);
    state.type = choice(input.type, types, state.type);
    state.style = styleSnapshot(input.style);
    for (const type of Object.keys(types)) {
      const sheet = input.sheets?.[type] || {}, target = state.sheets[type];
      for (const key of ["name", "details", "reference", "extras", "shot", "negative"]) target[key] = text(sheet[key]);
      for (const [key, values] of Object.entries({ mode: modes, placement: placements, safeArea: safeAreas, movement: movements, size: sizes })) target[key] = choice(sheet[key], values, target[key]);
      target.layout = choice(sheet.layout, layouts[type], target.layout);
      target.ratio = choice(sheet.ratio, ratios, target.ratio);
      target.backdrop = choice(sheet.backdrop, backdrops, target.backdrop);
    }
    return state;
  }
  const line = (label, value) => value ? `- ${label}: ${value.replace(/\n/g, "\n  - ")}` : "";
  function commonBlock(value) {
    const state = normalize(value), style = state.style;
    return ["공통 화풍 · 모든 시트에 동일 적용", line("영상", state.video), line("세계관", state.world),
      // Only mention an attached style image when the user actually listed one.
      line("화풍", style ? [style.name, style.description, style.technique].filter(Boolean).join(" / ") : state.reference ? "첨부한 화풍 기준 이미지의 표현 기법 유지" : "기준 이미지 없음; 영상·세계관과 아래 색상·조명에 맞는 화풍 하나를 정해 모든 이미지에 동일 적용"),
      line("색상", state.palette), line("조명", state.lighting), line("화풍 기준 이미지", state.reference), line("고정 요소", state.consistency),
      `- 선 굵기·재질·채도·명암·묘사 밀도를 통일${state.reference ? "; 화풍 참조의 인물·사물·구도는 복제하지 않음" : ""}`,
    ].filter(Boolean).join("\n");
  }
  function dimensions(sheet) {
    const [w, h] = sheet.ratio.split(":").map(Number), edge = sheet.size === "uhd" ? 3840 : 1920;
    return `${Math.round(edge * w / Math.max(w, h))} × ${Math.round(edge * h / Math.max(w, h))} px`;
  }
  function assets(value, requestedType) {
    const state = normalize(value), type = choice(requestedType || state.type, types, "character"), sheet = state.sheets[type];
    const labels = sheet.mode === "separate" ? variants[type][sheet.layout] : [sheet.mode === "sheet" ? layouts[type][sheet.layout] : sheet.shot || { character: "정면 전신", background: "공간 전체 전경", prop: "3/4 시점" }[type]];
    return labels.map((label, index) => ({ label, index, filename: `${type}-${sheet.mode === "single" ? "single" : sheet.layout}-${String(index + 1).padStart(2, "0")}.png` }));
  }
  function applyPreset(value, key) {
    const state = normalize(value), preset = Object.hasOwn(presets, key) ? presets[key] : null;
    if (!preset) return state;
    const { label, type, ...settings } = preset;
    state.type = type;
    Object.assign(state.sheets[type], { placement: "center", safeArea: "none", movement: "none", shot: "", ...settings });
    return state;
  }
  function request(value, requestedType, asset) {
    const state = normalize(value), type = choice(requestedType || state.type, types, "character"), sheet = state.sheets[type];
    const instructions = {
      character: { turnaround: "동일 인물의 정면·측면·후면 전신을 같은 키와 기준선으로 나란히 배치", expression: "동일 인물의 기본 얼굴과 표정 6종을 같은 각도·크기로 배치", pose: "동일 인물의 기본 전신과 용도에 맞는 동작 4종을 겹치지 않게 배치" },
      background: { location: "한 장소의 전체 전경과 핵심 구역 3곳을 별도 칸에 배치", angles: "같은 장소를 4개 시점에서 묘사; 건물·출입구·길의 위치 관계 유지", layers: "전체 전경과 전경·중경·후경을 분리된 칸에 배치; 같은 시점·소실점·수평선 유지" },
      prop: { turnaround: "동일 도구의 정면·측면·후면·3/4 시점을 같은 축척으로 배치", states: "동일 도구의 기본 형태와 사용 상태 3종을 별도 칸에 배치", parts: "완성 형태와 주요 부품·재질 확대를 별도 칸에 배치; 결합 관계 유지" },
    };
    const fixed = {
      character: "얼굴·헤어·체형·의상·대표 색상·소지품을 모든 칸에서 동일하게 유지",
      background: "장소의 구조·고유 랜드마크·시간대·날씨를 유지; 요청하지 않은 인물·도구는 제외",
      prop: "외곽 형태·비율·재질·색상·버튼/문양 위치를 유지; 손·인물은 요청한 경우만 포함",
    };
    const isSheet = sheet.mode === "sheet", layer = !isSheet && type === "background" && sheet.mode === "separate" && sheet.layout === "layers";
    const transparent = type !== "background" ? sheet.backdrop === "transparent" : layer && [1, 2].includes(asset.index), derivedLayer = layer && asset.index > 0;
    const frame = isSheet ? [] : [
      derivedLayer ? "- 대상 배치: 기준 전체 전경에서 해당 레이어의 원래 위치와 크기를 그대로 유지" : sheet.safeArea === "center" ? "- 대상 배치: 중앙 타이틀 영역을 비우고 대상·주요 구조물은 좌우 가장자리에 배치" : `- 대상 배치: ${placements[sheet.placement]}; ${sheet.placement === "center" ? "프레임 중심축 기준" : "빈 쪽에는 대상이나 장식물을 추가하지 않음"}`,
      !derivedLayer && sheet.safeArea !== "none" ? `- 편집 여백: ${safeAreas[sheet.safeArea]}; 해당 영역에 얼굴·제품·핵심 정보가 겹치지 않게 구도 조정; 문구는 그리지 않음` : "",
      !derivedLayer && sheet.movement !== "none" ? `- 카메라 편집 대비: ${movements[sheet.movement]}; 한 장의 정지 이미지로 제작, 연속 프레임이나 모션 블러 제외` : "",
      type === "character" ? "- 전신 요청은 머리·손·발을 프레임 안에 포함; 얼굴 표정 요청은 같은 얼굴 크기와 목 기준점 유지" : "",
      type === "prop" ? "- 제품 외곽·손잡이·부속품을 자르지 않음; 바닥과 접촉 그림자는 분리 가능한 최소 표현" : "",
      layer ? `- 레이어 정합: ${derivedLayer ? "승인된 전체 전경을 공통 기준으로 첨부" : "다음 레이어 제작의 기준이 될 전체 전경을 먼저 확정"}; 동일 캔버스·카메라·소실점·수평선·원점 유지, 레이어별 자동 확대·재중앙 정렬 금지` : "",
      layer && asset.index > 0 ? ["", "- 전경만 출력; 중경·후경은 제외, 가려진 가장자리까지 복원", "- 중경만 출력; 전경·후경은 제외, 가려진 가장자리까지 복원", "- 후경만 출력; 전경·중경을 제거한 빈 영역도 자연스럽게 채운 불투명 배경"][asset.index] : "",
    ];
    return [`${types[type]} 이미지 제작${isSheet ? "" : ` · ${asset.label}`}`, `- 아래 조건의 영상 제작용 ${isSheet ? "참조 시트" : "단일 에셋"} 이미지 1장 제작`, "", commonBlock(state), "", isSheet ? "시트 구성" : "편집용 에셋 구성",
      line("대상", sheet.name), line("특징·용도", sheet.details), line("대상 기준 이미지", sheet.reference),
      `- 구성: ${isSheet ? instructions[type][sheet.layout] : `${asset.label}; 이 대상/상태만 전체 캔버스에 표현; 분할 시트·콜라주·다른 시점 추가 금지`}`, `- 일관성: ${isSheet ? fixed[type] : fixed[type].replace("모든 칸", "모든 개별 이미지")}`,
      type === "background" ? isSheet ? "- 배경: 장면의 공간 환경을 묘사; 각 칸 경계와 편집 여백 확보" : transparent ? "- 바탕: 투명 배경; 선택한 공간 레이어의 요소만 표시" : "- 배경: 장면의 공간 환경을 캔버스 끝까지 묘사" : `- 바탕: ${backdrops[sheet.backdrop]}; 대상 전체가 보이도록 여백 확보`,
      transparent ? "- 실제 알파 투명도로 PNG 출력; 체크무늬·흰색 바탕·색 번짐 테두리를 그리지 않음; 배경에 그림자를 굽지 않음" : "",
      `- 화면비: ${sheet.ratio}${isSheet ? "; 칸별 대상이 잘리거나 겹치지 않게 배치" : ""}; 목표 해상도: ${dimensions(sheet)}`,
      ...frame, line("제외 요소", sheet.negative), line("추가 조건", sheet.extras),
      sheet.reference ? "- 첨부한 대상 원본의 정체성 유지; 자막·장식 문구·워터마크 제외" : "- 자막·장식 문구·워터마크 제외",
    ].filter((item) => item !== "").join("\n");
  }
  function requests(value, requestedType) {
    return assets(value, requestedType).map((asset) => ({ ...asset, prompt: request(value, requestedType, asset) }));
  }
  const prompt = (value, type) => requests(value, type).map((item) => `파일명 제안: ${item.filename}\n${item.prompt}`).join("\n\n────────── 다음 이미지는 별도 요청 ──────────\n\n");
  const allPrompts = (value) => Object.keys(types).map((type) => prompt(value, type)).join("\n\n──────────\n\n");
  global.PromptDeckVideoAssetEngine = Object.freeze({ types, layouts, ratios, backdrops, modes, placements, safeAreas, movements, sizes, presets, defaults, normalize, styleSnapshot, commonBlock, dimensions, assets, applyPreset, requests, prompt, allPrompts });
})(typeof window === "undefined" ? globalThis : window);
