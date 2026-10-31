(function (global) {
  "use strict";
  const types = Object.freeze({ character: "인물 시트", background: "배경 시트", prop: "도구 시트" });
  const layouts = Object.freeze({
    character: { turnaround: "정면·측면·후면 전신", expression: "기본 얼굴 + 표정 6종", pose: "기본 전신 + 동작 4종" },
    background: { location: "공간 전경 + 핵심 구역 3곳", angles: "같은 장소의 시점 4종", layers: "전체 전경 + 전경·중경·후경 분리" },
    prop: { turnaround: "정면·측면·후면 + 3/4 시점", states: "기본 형태 + 사용 상태 3종", parts: "완성 형태 + 주요 부품·재질 상세" },
  });
  const ratios = Object.freeze({ "3:2": "3:2 · 가로 시트", "16:9": "16:9 · 와이드 시트", "1:1": "1:1 · 정사각 시트", "2:3": "2:3 · 세로 시트" });
  const backdrops = Object.freeze({ white: "흰색 단색", transparent: "투명 배경" });
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
      sheets: Object.fromEntries(Object.keys(types).map((type) => [type, { name: "", details: "", reference: "", extras: "", layout: Object.keys(layouts[type])[0], ratio: "3:2", backdrop: "white" }])) };
  }
  function normalize(value) {
    const input = value && typeof value === "object" ? value : {};
    const state = defaults();
    for (const key of ["video", "world", "palette", "lighting", "reference", "consistency"]) if (typeof input[key] === "string") state[key] = text(input[key]);
    state.type = choice(input.type, types, state.type);
    state.style = styleSnapshot(input.style);
    for (const type of Object.keys(types)) {
      const sheet = input.sheets?.[type] || {}, target = state.sheets[type];
      for (const key of ["name", "details", "reference", "extras"]) target[key] = text(sheet[key]);
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
      line("화풍", style ? [style.name, style.description, style.technique].filter(Boolean).join(" / ") : "첨부한 화풍 기준 이미지의 표현 기법 유지"),
      line("색상", state.palette), line("조명", state.lighting), line("화풍 기준 이미지", state.reference), line("고정 요소", state.consistency),
      "- 선 굵기·재질·채도·명암·묘사 밀도를 통일; 화풍 참조의 인물·사물·구도는 복제하지 않음",
    ].filter(Boolean).join("\n");
  }
  function prompt(value, requestedType) {
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
    return [`${types[type]} 이미지 제작`, "- 아래 조건의 영상 제작용 참조 시트 이미지 1장 제작", "", commonBlock(state), "", "시트 구성",
      line("대상", sheet.name), line("특징·용도", sheet.details), line("대상 기준 이미지", sheet.reference),
      `- 구성: ${instructions[type][sheet.layout]}`, `- 일관성: ${fixed[type]}`,
      type === "background" ? "- 배경: 장면의 공간 환경을 묘사; 각 칸 경계와 편집 여백 확보" : `- 바탕: ${backdrops[sheet.backdrop]}; 대상 전체가 보이도록 여백 확보`,
      type !== "background" && sheet.backdrop === "transparent" ? "- 실제 알파 투명도로 출력; 체크무늬를 배경에 그리지 않음" : "",
      `- 화면비: ${sheet.ratio}; 칸별 대상이 잘리거나 겹치지 않게 배치`, line("추가 조건", sheet.extras),
      "- 첨부한 대상 원본의 정체성 유지; 자막·장식 문구·워터마크 제외",
    ].filter((item) => item !== "").join("\n");
  }
  const allPrompts = (value) => Object.keys(types).map((type) => prompt(value, type)).join("\n\n──────────\n\n");
  global.PromptDeckVideoAssetEngine = Object.freeze({ types, layouts, ratios, backdrops, defaults, normalize, styleSnapshot, commonBlock, prompt, allPrompts });
})(typeof window === "undefined" ? globalThis : window);
