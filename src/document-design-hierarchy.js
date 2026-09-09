(function () {
  "use strict";
  const markers = [
    ["number-dot", "1. 2. 3."], ["hangul-dot", "가. 나. 다."],
    ["number-paren", "1) 2) 3)"], ["hangul-paren", "가) 나) 다)"],
    ["decimal", "1.1. · 1.2."], ["roman", "Ⅰ. Ⅱ. Ⅲ."], ["circled", "① ② ③"],
    ["square", "□"], ["circle", "○"], ["bullet", "•"], ["dash", "–"], ["dot", "·"], ["diamond", "◇"], ["none", "표식 없음"],
  ].map(([id, label]) => Object.freeze({ id, label }));
  const presets = [
    { id: "none", label: "지정하지 않음", hint: "원문의 번호·기호 체계 유지", levels: ["number-dot", "hangul-dot", "number-paren", "hangul-paren"] },
    { id: "korean", label: "한글 문서형", hint: "보고서 · 기획서", levels: ["number-dot", "hangul-dot", "number-paren", "hangul-paren"] },
    { id: "decimal", label: "숫자 계층형", hint: "기술 문서 · 전문 도서", levels: ["number-dot", "decimal", "decimal", "decimal"] },
    { id: "roman", label: "로마 장 구분형", hint: "제안서 · 연구 보고서", levels: ["roman", "number-dot", "hangul-dot", "number-paren"] },
    { id: "symbols", label: "기호 정리형", hint: "업무 메모 · 요약 자료", levels: ["square", "circle", "dash", "dot"] },
    { id: "mixed", label: "번호 + 기호형", hint: "기획안 · 실행 계획", levels: ["number-dot", "square", "circle", "dash"] },
  ].map((p) => Object.freeze({ ...p, levels: Object.freeze(p.levels) }));
  const options = {
    scope: [["headings", "제목만"], ["lists", "항목 목록만"], ["both", "제목과 항목"]],
    indent: [["subtle", "얕게"], ["balanced", "적당히"], ["deep", "뚜렷하게"]],
    emphasis: [["quiet", "담백하게"], ["clear", "명확하게"], ["strong", "강하게"]],
    color: [["text", "본문 색"], ["theme", "테마 주색"]],
  };
  const defaults = () => ({ presetId: "none", levels: [...presets[0].levels], depth: 4, scope: "headings", indent: "balanced", emphasis: "clear", color: "theme" });
  function normalize(input) {
    const base = defaults(), raw = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    const preset = presets.find((p) => p.id === raw.presetId);
    if (!preset && raw.presetId !== "custom") return base;
    const result = { ...base, presetId: raw.presetId, depth: [1, 2, 3, 4].includes(raw.depth) ? raw.depth : base.depth };
    result.levels = base.levels.map((fallback, i) => markers.some((m) => m.id === raw.levels?.[i]) ? raw.levels[i] : preset?.levels[i] || fallback);
    if (preset && preset.id !== "none" && result.levels.some((m, i) => m !== preset.levels[i])) result.presetId = "custom";
    for (const [key, values] of Object.entries(options)) result[key] = values.some(([id]) => id === raw[key]) ? raw[key] : base[key];
    return result;
  }
  function select(input, id) {
    const current = normalize(input), preset = presets.find((p) => p.id === id);
    return preset ? normalize({ ...current, presetId: id, levels: [...preset.levels] }) : current;
  }
  function marker(id, index = 1, path = [index]) {
    const n = Math.max(1, Math.floor(Number(index) || 1));
    const hangul = ["가", "나", "다", "라", "마", "바", "사", "아", "자", "차", "카", "타", "파", "하"][(n - 1) % 14];
    const roman = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ", "Ⅸ", "Ⅹ"][n - 1] || String(n);
    return ({ "number-dot": `${n}.`, "hangul-dot": `${hangul}.`, "number-paren": `${n})`, "hangul-paren": `${hangul})`, decimal: `${path.join(".")}.`, roman: `${roman}.`, circled: n <= 20 ? String.fromCodePoint(0x2460 + n - 1) : `(${n})`, square: "□", circle: "○", bullet: "•", dash: "–", dot: "·", diamond: "◇", none: "" })[id] || "";
  }
  const enabled = (input) => normalize(input).presetId !== "none";
  function label(input) { const h = normalize(input); return presets.find((p) => p.id === h.presetId)?.label || "직접 조정"; }
  function sequence(input) { const h = normalize(input); return enabled(h) ? h.levels.slice(0, h.depth).map((id, i) => marker(id, 1, Array(i + 1).fill(1)) || "표식 없음").join(" → ") : "원문 체계 유지"; }
  function prompt(input) {
    const h = normalize(input);
    if (!enabled(h)) return [];
    const scope = options.scope.find(([id]) => id === h.scope)[1];
    return [
      `선택한 번호·기호 위계: ${label(h)}. 적용 범위: ${scope}. 원문에 존재하는 상하 관계의 최대 ${h.depth}단계까지 적용한다.`,
      ...h.levels.slice(0, h.depth).map((id, i) => `- ${i + 1}단계 표식: ${markers.find((m) => m.id === id).label} (예: ${marker(id, 1, Array(i + 1).fill(1)) || "표식 없이 표현"}).${id === "decimal" ? " 상위 번호 경로를 이어 1.1., 1.2., 2.1.처럼 표시한다." : ""}`),
      `위계 표현: 들여쓰기는 ${{ subtle: "얕고 절제된 차이", balanced: "자연스럽게 구별되는 차이", deep: "상하 관계가 뚜렷한 차이" }[h.indent]}로 표현한다.${h.scope !== "lists" ? ` 제목 단계의 강조는 ${{ quiet: "차분하고 담백하게", clear: "크기·굵기·간격으로 명확하게", strong: "상위 제목의 존재감을 강하게" }[h.emphasis]} 표현한다.` : ""} 표식은 ${h.color === "theme" ? "테마 주색" : "본문 색"}을 사용한다. 서체 적용 범위는 유지하며 고정된 크기·간격 수치 대신 판형과 분량에 맞춰 해석한다.`,
      "표식과 글자의 시작 위치를 구분하고, 긴 항목의 다음 줄은 표식 뒤 본문 시작점에 맞춘다. 순번은 같은 상위 항목 안에서 이어가고 상위 항목이 바뀌면 하위 순번을 새로 시작한다. 페이지가 바뀌었다는 이유로 순번을 초기화하지 않는다.",
      "원문에 이미 있는 제목·목록의 의미와 순서에만 적용한다. 위계를 채우려고 제목·문장·항목을 새로 만들거나 일반 서술 문단을 목록으로 바꾸지 않는다. 지정 깊이보다 깊은 기존 단계와 선택하지 않은 적용 범위는 원문의 체계를 유지한다. 표지 제목·쪽번호·표와 그림 번호·문제와 정답 번호에는 이 위계를 적용하지 않는다.",
      "본문에서 참조하는 항목 번호, 법령 조항 번호, 수치 등 의미가 있는 식별 번호는 그대로 보존하고 시각 스타일만 조정한다. 그 외 편집용 번호·기호는 기존 표식과 중복되지 않게 바꾼다. 편집 가능한 문서에서는 제목 스타일·다단계 목록 기능을 사용하고 목차·상호 참조의 연결을 유지한다.",
    ];
  }
  // Decorate existing semantic headings/lists only. Narrative paragraphs and identifiers remain intact.
  function decorate(content, input, kind) {
    const h = normalize(input);
    if (!enabled(h) || kind === "cover") return;
    content.dataset.hierarchy = h.presetId;
    content.dataset.hierarchyEmphasis = h.emphasis;
    content.dataset.hierarchyColor = h.color;
    const add = (node, level, n) => {
      if (level >= h.depth) return;
      const value = marker(h.levels[level], n, [...Array(level).fill(1), n]);
      node.classList.add("dd-hierarchy-heading"); node.dataset.hierarchyLevel = String(level + 1);
      if (level) node.style.marginInlineStart = `${level * { subtle: .4, balanced: .9, deep: 1.5 }[h.indent]}em`;
      const mark = document.createElement("span"); mark.className = "dd-hierarchy-marker"; mark.textContent = value;
      const body = document.createElement("span"); body.className = "dd-hierarchy-text";
      body.append(...node.childNodes); node.append(mark, body);
    };
    if (h.scope !== "lists") {
      content.querySelectorAll(".dd-page-title").forEach((node, i) => add(node, 0, i + 1));
      content.querySelectorAll(".dd-small-title").forEach((node, i) => add(node, 1, i + 1));
      // The large chapter numeral is already the chapter heading's marker.
      const chapterNumber = content.querySelector(".dd-chapter-number");
      if (chapterNumber) chapterNumber.hidden = true;
    }
    if (h.scope !== "headings") {
      content.querySelectorAll(".dd-roadmap, .dd-example-steps").forEach((list) => {
        list.querySelectorAll(".dd-symbol").forEach((node, i) => { node.textContent = marker(h.levels[0], i + 1); node.classList.add("dd-hierarchy-list-marker"); });
      });
    }
  }
  window.PromptDeckDocumentHierarchy = Object.freeze({ defaults, normalize, select, marker, enabled, label, sequence, prompt, decorate, presets: Object.freeze(presets), markers: Object.freeze(markers), options });
})();
