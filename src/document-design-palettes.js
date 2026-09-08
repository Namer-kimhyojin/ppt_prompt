(function () {
  "use strict";
  const roles = [["primary", "주색"], ["secondary", "보조색"], ["accent", "강조색"], ["background", "배경색"], ["surface", "내용 면"], ["text", "본문색"], ["muted", "보조 글자"], ["border", "구분선"]];
  const groups = [["report", "보고서"], ["proposal", "기획·제안"], ["publication", "교육·출판"], ["universal", "범용·인쇄"]];
  const fields = [
    { key: "temperature", label: "색 온도", options: [["cool", "시원하게"], ["neutral", "중립적으로"], ["warm", "따뜻하게"]] },
    { key: "vividness", label: "색의 선명도", options: [["restrained", "절제해서"], ["balanced", "균형 있게"], ["vivid", "생생하게"]] },
    { key: "brightness", label: "전체 밝기", options: [["deep", "묵직하게"], ["balanced", "균형 있게"], ["light", "밝게"]] },
    { key: "contrast", label: "명암 대비", options: [["soft", "부드럽게"], ["clear", "명확하게"], ["strong", "강하게"]] },
  ];
  const defaultFeel = { temperature: "neutral", vividness: "balanced", brightness: "balanced", contrast: "clear" };
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const hex = (values) => "#" + values.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");
  function mix(a, b, amount) { const end = rgb(b); return hex(rgb(a).map((v, i) => v + (end[i] - v) * amount)); }
  function luminance(value) {
    const v = rgb(value).map((n) => n / 255).map((n) => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4);
    return v[0] * .2126 + v[1] * .7152 + v[2] * .0722;
  }
  function contrast(a, b) { const values = [luminance(a), luminance(b)]; return (Math.max(...values) + .05) / (Math.min(...values) + .05); }
  function inkOn(value) { return contrast(value, "#ffffff") >= contrast(value, "#000000") ? "#ffffff" : "#000000"; }
  function make(id, group, label, tags, primary, secondary, accent, background = "#ffffff", text = "#24313d") {
    return Object.freeze({ id, group, label, tags: tags.split(" · "), colors: Object.freeze({ primary, secondary, accent, background, surface: mix(background, primary, .035), text, muted: mix(text, background, .22), border: mix(background, primary, .2) }) });
  }
  const presets = [
    make("report-public-trust", "report", "공공 신뢰 블루", "신뢰감 · 절제", "#193d58", "#587080", "#b48737"),
    make("report-audit-gray", "report", "감사 중립 그레이", "중립적 · 명료함", "#3d4a54", "#77838c", "#b84a45", "#fbfaf7"),
    make("report-data-teal", "report", "데이터 틸", "분석적 · 또렷함", "#175e68", "#327a8a", "#e69a3e", "#f8fbfc"),
    make("report-navy-gold", "report", "경영 네이비 골드", "차분함 · 무게감", "#1f3857", "#61758b", "#d79b38", "#f7f8fa"),
    make("report-research-ink", "report", "연구 잉크블루", "전문적 · 정돈됨", "#314b62", "#71869a", "#a46a4a", "#fbfaf6"),
    make("report-forest", "report", "환경 포레스트", "자연스러움 · 안정감", "#275544", "#638171", "#c39242", "#fbfcf7"),
    make("report-field-khaki", "report", "현장 카키", "담백함 · 실무적", "#3f5548", "#7d8b79", "#d3943f", "#f7f4ea"),
    make("report-brick", "report", "위기 대응 브릭", "집중 · 명확함", "#633c39", "#92736d", "#ba4939", "#fdf9f5"),
    make("proposal-strategy", "proposal", "전략 네이비", "논리적 · 신뢰감", "#273c67", "#667697", "#bc8739"),
    make("proposal-tender", "proposal", "입찰 블루 골드", "정돈됨 · 설득력", "#24466d", "#5f7d9e", "#d08a32", "#f7f9fb"),
    make("proposal-investment", "proposal", "미드나이트 오렌지", "대담함 · 추진력", "#162c4c", "#41648a", "#ef7c45", "#f6f8fc"),
    make("proposal-cobalt", "proposal", "기술 코발트", "선명함 · 혁신적", "#2446b3", "#477da3", "#d35e3e", "#f8faff"),
    make("proposal-service", "proposal", "서비스 틸", "연결감 · 편안함", "#215a68", "#6d929b", "#e6a13f", "#f5fbfa"),
    make("proposal-plum", "proposal", "플럼 코랄", "감각적 · 따뜻함", "#5c3e52", "#957388", "#e1714f", "#fff8f2"),
    make("proposal-charcoal", "proposal", "차콜 골드", "고급스러움 · 절제", "#303238", "#74716a", "#b68b43", "#fcfaf5"),
    make("proposal-emerald", "proposal", "공익 에메랄드", "생동감 · 믿음", "#1d5d4e", "#528f7d", "#dc9950", "#f7fcf8"),
    make("publication-sage", "publication", "학습 세이지", "편안함 · 부드러움", "#4c6753", "#859777", "#c18e43", "#fffdf4"),
    make("publication-cobalt", "publication", "교재 코발트", "명료함 · 집중", "#334ab0", "#7883b5", "#c05247", "#fdfdfd"),
    make("publication-ivory", "publication", "산문 아이보리", "온기 · 여운", "#5b5944", "#8a8975", "#b08b65", "#fcfaf5", "#353a35"),
    make("publication-story", "publication", "동화 소프트 컬러", "포근함 · 즐거움", "#426a63", "#8b99b6", "#cf7851", "#fffaf0", "#354d3e"),
    make("universal-neutral", "universal", "밝은 중립", "단정함 · 범용", "#364659", "#768393", "#527f9b", "#ffffff"),
    make("universal-warm", "universal", "따뜻한 중립", "온화함 · 담백함", "#5e5146", "#8c8072", "#b67a51", "#fcf8f0", "#38322c"),
    make("universal-mono", "universal", "인쇄 안정 모노", "흑백 · 절제", "#2c2c2c", "#646464", "#898989", "#ffffff", "#202020"),
    make("universal-contrast", "universal", "또렷한 고대비", "명확함 · 가독성", "#152d49", "#37506d", "#a84016", "#ffffff", "#101b28"),
  ];
  function normalizeFeel(raw) { return Object.fromEntries(fields.map((f) => [f.key, f.options.some(([v]) => v === raw?.[f.key]) ? raw[f.key] : defaultFeel[f.key]])); }
  function applyFeel(colors, raw) {
    const feel = normalizeFeel(raw), result = { ...colors };
    for (const key of ["primary", "secondary", "accent", "background", "surface", "border"]) {
      let value = result[key];
      if (feel.temperature !== "neutral") value = mix(value, feel.temperature === "warm" ? "#bd793e" : "#426cb7", ["background", "surface"].includes(key) ? .035 : .14);
      const channels = rgb(value), gray = channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
      const saturation = { restrained: .55, balanced: 1, vivid: 1.3 }[feel.vividness];
      value = hex(channels.map((v) => gray + (v - gray) * saturation));
      if (Math.max(...channels) - Math.min(...channels) < 2 && !["background", "surface"].includes(key) && feel.vividness !== "balanced") value = mix(value, feel.vividness === "vivid" ? "#000000" : "#ffffff", .08);
      if (feel.brightness !== "balanced") value = mix(value, feel.brightness === "light" ? "#ffffff" : "#101e30", ["background", "surface"].includes(key) ? .035 : .1);
      result[key] = value;
    }
    if (feel.contrast !== "clear") {
      const target = feel.contrast === "strong" ? "#101820" : result.background;
      for (const key of ["primary", "text", "muted"]) result[key] = mix(result[key], target, feel.contrast === "strong" ? .25 : .1);
    }
    return result;
  }
  function describe(feel) { return fields.map((f) => `${f.label}: ${f.options.find(([v]) => v === feel[f.key])?.[1] || "기본"}`).join("; "); }
  function recommended(familyId) { const group = ["report", "proposal"].includes(familyId) ? familyId : "publication"; return presets.filter((p) => p.group === group).slice(0, 6); }
  window.PromptDeckDocumentPalettes = Object.freeze({ presets, groups, roles, fields, defaultFeel: Object.freeze(defaultFeel), get: (id) => presets.find((p) => p.id === id), normalizeFeel, applyFeel, describe, recommended, mix, contrast, inkOn });
})();
