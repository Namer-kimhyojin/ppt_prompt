(function (global) {
  "use strict";
  const catalog = global.PromptDeckSlideStyleCatalog;
  if (!catalog) return;
  const ratios = { "16:9": "16:9 와이드, 33.867 × 19.05cm", "4:3": "4:3 표준, 25.4 × 19.05cm", A4: "A4 가로, 29.7 × 21cm" };
  const purposes = { auto: "자료에 맞춰 구성", report: "업무·성과 보고", proposal: "기획·제안 발표", education: "교육·강의", pitch: "투자·사업 피칭" };
  const languages = { ko: "한국어", en: "영어" };
  const flows = {
    auto: "자료의 목적과 정보 관계를 파악해 도입·본문·마무리를 구성한다.",
    report: "핵심 결과 → 현황과 근거 → 주요 이슈 → 후속 조치의 흐름을 자료에 맞게 구성한다.",
    proposal: "문제와 필요성 → 해결안 → 차별성과 근거 → 실행계획 → 기대효과의 흐름을 자료에 맞게 구성한다.",
    education: "학습 목표 → 개념 설명 → 제공된 예시·활동 → 핵심 정리의 흐름을 학습자 수준에 맞춘다.",
    pitch: "문제 → 제품·해결안 → 시장과 사업모델 → 검증된 성과 → 실행계획과 요청의 흐름을 자료에 맞게 구성한다.",
  };
  const colorRoles = { primary: "주색", secondary: "보조색", accent: "강조색", background: "바탕", surface: "내용 면", textPrimary: "본문 글자", textSecondary: "보조 글자", border: "구분선" };
  const fallbackColors = { primary: "#17324d", secondary: "#4c78a8", accent: "#2563eb", background: "#ffffff", surface: "#f5f7fa", textPrimary: "#172033", textSecondary: "#667085", border: "#d5dbe6" };
  const valueOf = (value) => typeof value === "string" ? value : "";
  const pick = (value, options, fallback) => Object.hasOwn(options, value) ? value : fallback;
  function defaults() {
    return { version: 1, styleId: "consulting-strategy", ratio: "16:9", purpose: "auto", language: "ko", slideCount: "", title: "", audience: "", sourceText: "", requirements: "", notes: true, colorOverrides: {} };
  }
  function normalize(input) {
    const raw = input && typeof input === "object" ? input : {};
    const base = defaults(), colorOverrides = {};
    for (const key of Object.keys(colorRoles)) {
      const value = raw.colorOverrides?.[key];
      if (typeof value === "string" && /^#[a-f0-9]{6}$/i.test(value)) colorOverrides[key] = value.toLowerCase();
    }
    return {
      ...base, styleId: catalog.get(raw.styleId)?.id || base.styleId,
      ratio: pick(raw.ratio, ratios, base.ratio), purpose: pick(raw.purpose, purposes, base.purpose),
      language: pick(raw.language, languages, base.language),
      slideCount: typeof raw.slideCount === "number" ? String(raw.slideCount) : valueOf(raw.slideCount),
      title: valueOf(raw.title), audience: valueOf(raw.audience), sourceText: valueOf(raw.sourceText), requirements: valueOf(raw.requirements),
      notes: typeof raw.notes === "boolean" ? raw.notes : true, colorOverrides,
    };
  }
  function palette(input) {
    const state = normalize(input), colors = catalog.get(state.styleId)?.settings?.colors || {};
    return Object.fromEntries(Object.keys(colorRoles).map((key) => [key, state.colorOverrides[key] || (/^#[a-f0-9]{6}$/i.test(colors[key] || "") ? colors[key].toLowerCase() : fallbackColors[key])]));
  }
  function build(input) {
    const state = normalize(input), style = catalog.get(state.styleId), issues = [];
    if (!style) return { state, issues: ["스타일 갤러리를 불러오지 못했습니다."], prompt: "" };
    const count = state.slideCount.trim();
    if (count && (!/^\d+$/.test(count) || Number(count) < 1 || Number(count) > 80)) issues.push("슬라이드 수는 1~80 사이의 정수로 입력하거나 자동으로 두세요.");
    if (issues.length) return { state, issues, prompt: "" };
    const colors = palette(state), settings = style.settings || {}, composition = settings.composition || {};
    const typography = settings.typography || {};
    const traits = [...new Set([settings.visualDirection?.signatureMotif, ...(style.distinctiveRules || [])].filter(Boolean))];
    const resources = { photo: "사진", layeredComposite: "합성 이미지", icons: "아이콘", gradients: "그라데이션", threeD: "3D 표현", illustration: "삽화", dataVisualization: "데이터 시각화", diagramInfographic: "도식·인포그래픽", typographicFocal: "타이포그래피 강조" };
    const preferred = Object.entries(resources).filter(([key]) => settings.resources?.[key] === "allow").map(([, label]) => label);
    const excluded = Object.entries(resources).filter(([key]) => settings.resources?.[key] === "exclude").map(([, label]) => label);
    const typeVoice = { reading: "읽기 편한 본문과 절제된 강조", balanced: "가독성과 제목 강조의 균형", strong: "핵심 제목과 수치의 분명한 대비" };
    const rhythm = { compact: "치밀하고 정돈된", balanced: "균형 잡힌", airy: "여백이 넉넉한" };
    const prompt = [
      "# 발표자료 PPTX 제작 요청",
      "제공하거나 별도로 첨부하는 자료를 바탕으로, 아래 스타일과 조건을 적용한 편집 가능한 PowerPoint 발표자료(.pptx)를 제작해 주세요.",
      "최종 결과는 실제로 열 수 있는 .pptx 파일과 다운로드 링크로 제공해 주세요. 제작 도구가 파일 생성을 지원하지 않으면 그 한계를 명확히 알리고, 생성하지 않은 파일이나 링크를 제공하지 마세요.",
      "",
      "## 1. 제작 조건",
      `- 화면 규격: ${ratios[state.ratio]}. 모든 슬라이드에 같은 크기를 적용한다.`,
      `- 발표자료 언어: ${languages[state.language]}. 고유명사·제품명·출처는 원래 표기를 보존한다.`,
      `- 목적: ${purposes[state.purpose]}.`,
      `- 분량: ${count ? `표지·마무리를 포함해 총 ${Number(count)}장` : "자료의 양과 발표 흐름에 맞춰 적정 분량을 결정"}. 분량이 제한되면 핵심을 슬라이드에 배치한다. ${state.notes ? "세부 근거는 발표자 노트에 보존한다." : "요약하면서 생략한 항목은 별도 제작 메모에 밝힌다."}`,
      ...(state.title.trim() ? [`- 주제·제목: ${state.title}`] : []),
      ...(state.audience.trim() ? [`- 청중: ${state.audience}`] : []),
      "",
      "## 2. 선택한 스타일",
      `- ${style.nameKo} (${style.nameEn}).`,
      `- 디자인 방향: ${style.prompt?.ko || style.description}`,
      ...traits.map((rule) => `- 유지할 특징: ${rule}`),
      ...(traits.length ? ["- 색상뿐 아니라 정렬, 타이포그래피, 형태, 선, 이미지 처리에서 위 특징을 일관되게 드러낸다."] : []),
      `- 색상 역할: ${Object.entries(colors).map(([key, value]) => `${colorRoles[key]} ${value}`).join(" / ")}.`,
      "- 위 색상이 최종 팔레트다. 다른 스타일 설명에 색상 이름이 있더라도 위 값을 우선한다. 글자와 바탕의 대비가 낮으면 팔레트의 어두운 색·밝은 색을 읽기 좋은 역할에 배치한다.",
      `- 타이포그래피: ${typeVoice[typography.emphasis] || typeVoice.balanced}. ${rhythm[typography.rhythm] || "균형 잡힌"} 리듬을 유지한다.${typography.fallback ? ` 서체 성격: ${typography.fallback}.` : ""}`,
      "- 한글·영문을 지원하는 사용 가능한 서체를 고르고 제목·본문·수치·캡션의 크기와 굵기를 체계화한다. 읽기 어려운 작은 글자로 내용을 억지로 밀어 넣지 않는다.",
      `- 구성 문법: 형태 ${composition.formLanguage || "preciseGeometric"}, 선 ${composition.lineLanguage || "fineStructural"}, 표면 ${composition.surfaceLanguage || "flat"}, 공간 리듬 ${composition.spatialRhythm || "ordered"}. 이를 선택한 스타일의 시각적 특성으로 해석한다.`,
      ...(preferred.length ? [`- 내용에 적합하면 우선 활용: ${preferred.join(", ")}.`] : []),
      ...(excluded.length ? [`- 사용하지 않을 표현: ${excluded.join(", ")}.`] : []),
      ...(style.avoidRules || []).map((rule) => `- 피할 표현: ${rule}`),
      "- 갤러리 미리보기는 분위기와 표현 방식의 참고다. 견본 속 제목·숫자·회사명·사진을 실제 발표 내용으로 옮기지 않는다.",
      "",
      "## 3. 발표 흐름과 슬라이드 구성",
      `- ${flows[state.purpose]}`,
      "- 각 슬라이드의 핵심 메시지와 근거를 분명하게 연결한다. 실제 내용에 따라 비교·과정·시간 흐름·관계·데이터 등 적합한 구도를 선택하고 동일한 카드 배치를 기계적으로 반복하지 않는다.",
      "- 표지는 제목과 대표 시각 요소로 스타일을 소개한다. 장 구분은 분량상 필요할 때만 사용하고, 본문은 메시지·근거의 위계를 유지하며, 마무리는 실제 결론과 다음 행동을 정리한다. 적은 장수에서는 역할을 합친다.",
      "- 내용·사실·수치·단위·기준일·출처와 사용자의 필수 요구사항을 스타일보다 우선한다. 제공되지 않은 성과·예산·시장규모·인물·인용문을 사실처럼 만들지 않는다. 근거가 필요한 항목은 ‘확인 필요’로 구분한다.",
      "",
      "## 4. 편집 가능한 PPTX 구현",
      "- 제목·본문·수치·페이지 번호는 편집 가능한 텍스트로, 선·상자·화살표는 PowerPoint 도형으로 만든다. 슬라이드 전체를 하나의 이미지로 붙이지 않는다.",
      "- 표는 편집 가능한 표로, 차트는 원본 데이터가 있을 때 데이터가 연결된 편집 가능한 차트로 만든다. 원자료가 없으면 수치를 추정해 채우지 않는다.",
      "- 선택한 스타일에서 허용한 삽화·사진·질감은 개별 이미지로 사용할 수 있지만 텍스트·표·차트와 분리한다. 이미지를 늘려 비율을 왜곡하지 않으며 제공 자료 또는 사용 권한이 확인된 시각 자료를 사용한다.",
      "- 테마 색상·서체·반복 요소를 통일하고 관련 요소는 그룹화한다. 다른 컴퓨터에서도 열리는지 서체 대체와 이미지 포함 상태를 점검한다.",
      `- 발표자 노트: ${state.notes ? "각 슬라이드에 발표자가 설명할 요점, 세부 근거와 제공된 출처를 기록한다. 미확인 정보를 노트에서 사실로 보강하지 않는다." : "작성하지 않는다."}`,
      "",
      "## 5. 최종 확인과 전달",
      "- 슬라이드를 렌더링해 글자 넘침·겹침·잘림, 한글 깨짐, 이미지 왜곡, 정렬, 대비, 표·차트의 수치와 출처를 확인하고 수정한다.",
      "- 규격·장수·스타일 일관성을 확인하고 파일을 실제로 열어 검수한다. 렌더링이나 열기 검증이 불가능하면 수행하지 못한 검증을 밝힌다.",
      "- 완성된 .pptx와 함께 슬라이드 구성 요약 및 확인이 필요한 자료만 간단히 전달한다. 이 요청문의 항목명·색상 코드·제작 메타데이터를 발표 본문에 출력하지 않는다.",
      ...(state.requirements.trim() ? ["", "## 추가 요구사항", state.requirements] : []),
      "",
      "## 제공 자료",
      state.sourceText.trim() ? state.sourceText : "발표 내용은 별도로 제공하거나 첨부하는 자료를 사용한다. 자료와 주제가 모두 부족하면 내용을 임의로 만들지 말고 제작에 필요한 정보를 먼저 요청한다.",
    ].join("\n");
    return { state, prompt, issues, spec: { schema: "promptdeck.pptx-prompt/1", style: { id: style.id, name: style.nameKo, catalogVersion: catalog.version }, palette: colors, settings: JSON.parse(JSON.stringify(state)) } };
  }
  global.PromptDeckPptxPromptContract = Object.freeze({ defaults, normalize, palette, build, ratios, purposes, languages, colorRoles });
})(window);
