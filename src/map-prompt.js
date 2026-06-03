// 지도 강조 이미지 프롬프트 생성 탭
(function () {
  const root = document.getElementById("paneMapPrompt");
  if (!root) return;

  const $ = (id) => document.getElementById(id);

  const TECHNIQUES = [
    {
      id: "boundary-glow",
      label: "경계선 강조",
      desc: "대상 구역 외곽선을 선명하게 표시",
      prompt: "draw a clean highlighted boundary around the target area with a restrained accent stroke and subtle outer glow",
    },
    {
      id: "spotlight",
      label: "스포트라이트",
      desc: "주변은 낮추고 대상지를 밝게 부각",
      prompt: "apply a soft spotlight effect on the target area while slightly desaturating surrounding regions",
    },
    {
      id: "callout",
      label: "콜아웃 라벨",
      desc: "화살표와 정보 박스로 위치 설명",
      prompt: "add professional callout labels with thin leader lines pointing to the target area and key access points",
    },
    {
      id: "access-axis",
      label: "접근축 표시",
      desc: "도로·철도·광역 연결축 강조",
      prompt: "emphasize major access routes, transport corridors, and connection axes with clear but non-decorative line overlays",
    },
    {
      id: "inset-map",
      label: "확대 인셋",
      desc: "대상지 주변을 별도 확대창으로 표시",
      prompt: "include a small inset zoom map that enlarges the target district while preserving the original map context",
    },
    {
      id: "heat-zone",
      label: "권역/영향권",
      desc: "배후권역·영향권을 반투명 면으로 표현",
      prompt: "show strategic influence zones or catchment areas using transparent layered polygons that do not obscure map labels",
    },
    {
      id: "data-layer",
      label: "데이터 레이어",
      desc: "거점·산단·인프라를 분석도처럼 배치",
      prompt: "add a restrained data-map layer for nearby industrial bases, infrastructure nodes, and administrative anchors",
    },
    {
      id: "before-after",
      label: "계획 전후",
      desc: "현재 지도 위에 계획 효과를 겹쳐 표현",
      prompt: "overlay a planning-vision layer that shows the intended development focus without changing real geography",
    },
  ];

  const TONE_PROMPTS = {
    official: "Use a restrained public-sector report style: clean white background, navy and muted blue accents, precise labels, no decorative clutter.",
    premium: "Use a premium business proposal style: polished hierarchy, refined shadows, crisp accent color, and strong but professional emphasis.",
    technical: "Use a technical site-analysis style: map-like linework, measured annotations, subtle grids, and evidence-oriented visual language.",
    minimal: "Use a minimal location-map style: keep only essential boundaries, labels, and emphasis elements for fast comprehension.",
  };

  const COLOR_PALETTE_PROMPTS = {
    "gov-blue": "Use a public-sector blue palette: deep navy, steel blue, cool gray, white background, and one controlled accent color.",
    "green-growth": "Use a regional-development green palette: deep green, sage, light gray, white, and a small lime or teal accent.",
    "infra-orange": "Use an infrastructure emphasis palette: charcoal, warm orange, muted blue-gray, and clean off-white.",
    "mono-accent": "Use a monochrome base map with one strong accent color for the target district and key routes.",
    ai: "Choose the optimal palette based on the attached map, target district visibility, business message, and label readability; do not use arbitrary decorative colors.",
  };

  const HIGHLIGHT_COLOR_PROMPTS = {
    blue: "Use blue as the main highlight color for trust, planning stability, and public-sector credibility.",
    red: "Use restrained red only for the target district focal outline; keep it professional and not alarm-like.",
    green: "Use green as the main highlight color for development potential, land-use planning, and environmental/regional linkage.",
    orange: "Use orange as the main highlight color for transport access, infrastructure corridors, and development momentum.",
    cyan: "Use cyan or blue-green as the main highlight color for data, innovation, and network connectivity.",
    ai: "Select the highlight color that has the best contrast against the attached map while remaining suitable for a formal business plan.",
  };

  const BASE_STYLE_PROMPTS = {
    "clean-vector": "Convert the reference into a clean vector-map style with simplified roads, boundaries, rivers, and labels while preserving geography.",
    "desaturated-original": "Keep the original map feel but desaturate and clean it so overlays and labels remain readable.",
    "paper-report": "Use a refined report-figure map style with subtle paper texture, clean linework, and soft neutral surfaces.",
    "technical-blueprint": "Use a technical planning-map style with precise linework, pale blueprint tones, grid hints, and measured annotations.",
    "satellite-muted": "Use a restrained satellite or aerial-map treatment only if it supports the reference image; keep colors muted and labels readable.",
  };

  const BACKGROUND_PROMPTS = {
    "white-report": "Place the map on a clean white report background with enough whitespace for a caption or legend.",
    "soft-panel": "Use a subtle panel/card background around the map with light shadow and restrained report styling.",
    "full-bleed-map": "Use the map as the full image canvas while keeping margins clean and avoiding any external frame.",
    "muted-context": "Keep the target area crisp and make surrounding context slightly muted, low-contrast, and non-competing.",
    "transparent-overlay": "Use transparent analytical overlays above the base map; never hide important geography or labels.",
  };

  const LABEL_DENSITY_PROMPTS = {
    minimal: "Use minimal labels: target site, one or two key access points, and only the most important regional anchor.",
    balanced: "Use balanced labels suitable for a business plan: target site, administrative area, major roads, nearby hubs, and compact legend.",
    detailed: "Use detailed but organized labels for site analysis: key roads, hubs, nearby industrial bases, administrative names, and influence zones.",
  };

  const DEPTH_STYLE_PROMPTS = {
    flat: "Use a flat, clean, highly legible report style with no unnecessary 3D effects.",
    "subtle-depth": "Use subtle depth only through soft shadows, transparent layers, and inset panels; keep the map accurate.",
    "premium-layered": "Use a premium layered composition with refined inset zoom, soft panels, and restrained shadows.",
    "no-3d": "Avoid 3D, perspective distortion, extruded land, or cinematic map effects; prioritize geographic accuracy.",
  };

  const OUTPUT_LABELS = {
    "business-plan": "business plan body figure",
    "proposal-slide": "proposal presentation slide map visual",
    "executive-summary": "executive summary location map",
    "site-analysis": "site analysis and regional context figure",
  };

  const DEFAULT_STATE = {
    projectName: "",
    outputType: "business-plan",
    referenceNote: "",
    targetArea: "",
    contextInfo: "",
    visualTone: "official",
    colorPalette: "gov-blue",
    highlightColor: "blue",
    baseStyle: "clean-vector",
    backgroundTreatment: "white-report",
    labelDensity: "balanced",
    depthStyle: "flat",
    canvas: "16:9 landscape business presentation image",
    labels: "",
    exclusions: "",
    techniques: ["boundary-glow", "callout", "access-axis"],
  };

  const state = { ...DEFAULT_STATE, techniques: [...DEFAULT_STATE.techniques] };

  function setMessage(text, isError = false) {
    const node = $("mapMessage");
    if (!node) return;
    node.textContent = text || "";
    node.classList.toggle("ok", !isError && Boolean(text));
  }

  function renderTechniqueGrid() {
    const grid = $("mapTechniqueGrid");
    if (!grid) return;
    grid.replaceChildren(...TECHNIQUES.map((technique) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "map-technique-card";
      button.dataset.techniqueId = technique.id;
      button.setAttribute("aria-pressed", state.techniques.includes(technique.id) ? "true" : "false");
      button.innerHTML = `
        <span class="map-technique-check" aria-hidden="true"></span>
        <strong>${technique.label}</strong>
        <small>${technique.desc}</small>
      `;
      button.addEventListener("click", () => {
        if (state.techniques.includes(technique.id)) {
          state.techniques = state.techniques.filter((id) => id !== technique.id);
        } else {
          state.techniques = [...state.techniques, technique.id];
        }
        renderTechniqueGrid();
        updatePrompt();
      });
      return button;
    }));
  }

  function syncStateFromFields() {
    state.projectName = $("mapProjectName")?.value.trim() || "";
    state.outputType = $("mapOutputType")?.value || DEFAULT_STATE.outputType;
    state.referenceNote = $("mapReferenceNote")?.value.trim() || "";
    state.targetArea = $("mapTargetArea")?.value.trim() || "";
    state.contextInfo = $("mapContextInfo")?.value.trim() || "";
    state.visualTone = $("mapVisualTone")?.value || DEFAULT_STATE.visualTone;
    state.colorPalette = $("mapColorPalette")?.value || DEFAULT_STATE.colorPalette;
    state.highlightColor = $("mapHighlightColor")?.value || DEFAULT_STATE.highlightColor;
    state.baseStyle = $("mapBaseStyle")?.value || DEFAULT_STATE.baseStyle;
    state.backgroundTreatment = $("mapBackgroundTreatment")?.value || DEFAULT_STATE.backgroundTreatment;
    state.labelDensity = $("mapLabelDensity")?.value || DEFAULT_STATE.labelDensity;
    state.depthStyle = $("mapDepthStyle")?.value || DEFAULT_STATE.depthStyle;
    state.canvas = $("mapCanvas")?.value || DEFAULT_STATE.canvas;
    state.labels = $("mapLabels")?.value.trim() || "";
    state.exclusions = $("mapExclusions")?.value.trim() || "";
  }

  function applyStateToFields() {
    $("mapProjectName").value = state.projectName;
    $("mapOutputType").value = state.outputType;
    $("mapReferenceNote").value = state.referenceNote;
    $("mapTargetArea").value = state.targetArea;
    $("mapContextInfo").value = state.contextInfo;
    $("mapVisualTone").value = state.visualTone;
    $("mapColorPalette").value = state.colorPalette;
    $("mapHighlightColor").value = state.highlightColor;
    $("mapBaseStyle").value = state.baseStyle;
    $("mapBackgroundTreatment").value = state.backgroundTreatment;
    $("mapLabelDensity").value = state.labelDensity;
    $("mapDepthStyle").value = state.depthStyle;
    $("mapCanvas").value = state.canvas;
    $("mapLabels").value = state.labels;
    $("mapExclusions").value = state.exclusions;
    renderTechniqueGrid();
  }

  function line(label, value, fallback) {
    return `- ${label}: ${value || fallback}`;
  }

  function buildPrompt() {
    syncStateFromFields();
    const selectedTechniques = TECHNIQUES.filter((technique) => state.techniques.includes(technique.id));
    const techniqueLines = selectedTechniques.length
      ? selectedTechniques.map((technique) => `- ${technique.label}: ${technique.prompt}`)
      : ["- AI decide: choose the most appropriate emphasis methods based on the attached map, the target area, and the business message."];

    const lines = [
      "[TASK]",
      `Create a high-quality map-based visual for a ${OUTPUT_LABELS[state.outputType] || OUTPUT_LABELS["business-plan"]}.`,
      "Use the attached reference map image as the geographic source. Preserve the real map structure, relative positions, coastline/river/road geometry, administrative boundaries, and existing labels as much as possible.",
      "",
      "[REFERENCE MAP INTERPRETATION]",
      line("Attached map description", state.referenceNote, "Interpret the attached image as the primary reference map. The user-marked or described district is the area to emphasize."),
      line("Target area to emphasize", state.targetArea, "Identify the target district from the user's mark or description in the attached image and make it the clear focal area."),
      line("Business context", state.contextInfo, "Emphasize why this location matters for the business plan: accessibility, regional linkage, site potential, or strategic position."),
      "",
      "[VISUAL DIRECTION]",
      line("Project or document name", state.projectName, "Business plan location map"),
      line("Canvas", state.canvas, "16:9 landscape business presentation image"),
      `- Tone: ${TONE_PROMPTS[state.visualTone] || TONE_PROMPTS.official}`,
      "",
      "[VISUAL SYSTEM]",
      `- Color palette: ${COLOR_PALETTE_PROMPTS[state.colorPalette] || COLOR_PALETTE_PROMPTS["gov-blue"]}`,
      `- Target highlight color: ${HIGHLIGHT_COLOR_PROMPTS[state.highlightColor] || HIGHLIGHT_COLOR_PROMPTS.blue}`,
      `- Base map treatment: ${BASE_STYLE_PROMPTS[state.baseStyle] || BASE_STYLE_PROMPTS["clean-vector"]}`,
      `- Background treatment: ${BACKGROUND_PROMPTS[state.backgroundTreatment] || BACKGROUND_PROMPTS["white-report"]}`,
      `- Label density: ${LABEL_DENSITY_PROMPTS[state.labelDensity] || LABEL_DENSITY_PROMPTS.balanced}`,
      `- Depth and texture: ${DEPTH_STYLE_PROMPTS[state.depthStyle] || DEPTH_STYLE_PROMPTS.flat}`,
      "- Maintain enough contrast between the highlighted district, base map, labels, and surrounding context.",
      "- Color choices must support business-plan readability; avoid decorative gradients or trendy colors that weaken map accuracy.",
      "",
      "[COMPOSITION RULES]",
      "- The image must look like a professional figure inserted into a Korean business plan or government proposal, not a generic travel map.",
      "- Prioritize readability, geographic clarity, and persuasive emphasis over decoration.",
      "",
      "[REGION EMPHASIS METHODS]",
      ...techniqueLines,
      "",
      "[LABELS AND LEGEND]",
      line("Labels to include", state.labels, "Use only essential labels such as target site, city/county name, major roads, nearby hubs, and a compact legend."),
      "- Render Korean labels cleanly if Korean text is provided. Do not invent new place names or administrative labels.",
      "- Keep labels short, aligned, and unobtrusive. Use leader lines only where they improve clarity.",
      "",
      "[ACCURACY AND CONSTRAINTS]",
      "- Do not distort the actual geography of the attached map.",
      "- Do not move the target area, roads, rivers, coastlines, or administrative boundaries.",
      "- Do not add fake place names, fake infrastructure, fake coordinates, or unsupported landmarks.",
      "- If exact map text is unreadable, keep it as clean small map text or omit it rather than hallucinating.",
      "- Use transparent overlays so the base map remains understandable.",
      "- Avoid decorative neon, fantasy glow, excessive 3D, satellite-photo hallucination, tourist-poster mood, and cluttered infographic effects.",
      line("Additional exclusions", state.exclusions, "Avoid over-stylization, unreadable labels, inaccurate boundaries, and excessive visual noise."),
      "",
      "[OUTPUT QUALITY]",
      "- Produce one complete ready-to-insert image with no outer frame, no watermark, no mockup device, and no UI chrome.",
      "- The emphasized area should be immediately recognizable within 3 seconds.",
      "- The final result should support a formal business-plan narrative: where the site is, why it matters, and how it connects to the surrounding region.",
    ];

    return lines.join("\n");
  }

  function updatePrompt() {
    const prompt = buildPrompt();
    const preview = $("mapPromptPreview");
    if (preview) preview.value = prompt;
    const badge = $("mapPromptBadge");
    if (badge) {
      badge.textContent = state.techniques.length ? `${state.techniques.length}개 기법` : "AI 위임";
    }
    if (window.PromptDeckTabs?.syncHeaderActionStates) {
      window.PromptDeckTabs.syncHeaderActionStates();
    }
    if (window.PromptDeckTabs?.syncMobileActions) {
      window.PromptDeckTabs.syncMobileActions();
    }
  }

  async function copyPrompt() {
    const prompt = $("mapPromptPreview")?.value.trim() || buildPrompt();
    if (!prompt) {
      setMessage("복사할 프롬프트가 없습니다.", true);
      return;
    }
    try {
      await navigator.clipboard.writeText(prompt);
      setMessage("지도 이미지 프롬프트를 복사했습니다.");
    } catch (err) {
      setMessage("클립보드 복사에 실패했습니다.", true);
    }
  }

  function fillSample() {
    state.projectName = "○○권역 전략산업 거점 조성사업 사업계획서";
    state.outputType = "business-plan";
    state.referenceNote = "시·군 행정경계, 주요 도로, 하천, 주변 산업단지가 표시된 기본 위치도. 사용자가 붉은 윤곽선으로 표시한 구역이 대상 부지임.";
    state.targetArea = "지도 중앙 동측의 ○○읍 일대 대상 부지. 인근 고속도로 IC와 국도 교차부, 배후 산업단지와의 연결성이 중요함.";
    state.contextInfo = "대상지는 광역 교통망 접근성이 높고, 기존 산업거점과 연계 가능한 전략적 입지임을 사업계획서 본문에서 설득해야 함.";
    state.visualTone = "official";
    state.colorPalette = "gov-blue";
    state.highlightColor = "blue";
    state.baseStyle = "clean-vector";
    state.backgroundTreatment = "white-report";
    state.labelDensity = "balanced";
    state.depthStyle = "subtle-depth";
    state.canvas = "16:9 landscape business presentation image";
    state.labels = "대상지, ○○IC, 주요 간선도로, 인근 산업단지, 배후권역, 행정구역명";
    state.exclusions = "새로운 지명 창작, 실제 도로 위치 왜곡, 과도한 네온 효과, 복잡한 3D 건물, 관광 안내지도 같은 분위기";
    state.techniques = ["boundary-glow", "callout", "access-axis", "inset-map"];
    applyStateToFields();
    updatePrompt();
    setMessage("샘플을 채웠습니다.");
  }

  function reset() {
    Object.assign(state, DEFAULT_STATE, { techniques: [...DEFAULT_STATE.techniques] });
    applyStateToFields();
    updatePrompt();
    setMessage("초기화했습니다.");
  }

  function bind() {
    [
      "mapProjectName",
      "mapOutputType",
      "mapReferenceNote",
      "mapTargetArea",
      "mapContextInfo",
      "mapVisualTone",
      "mapColorPalette",
      "mapHighlightColor",
      "mapBaseStyle",
      "mapBackgroundTreatment",
      "mapLabelDensity",
      "mapDepthStyle",
      "mapCanvas",
      "mapLabels",
      "mapExclusions",
    ].forEach((id) => {
      const input = $(id);
      if (!input) return;
      input.addEventListener("input", updatePrompt);
      input.addEventListener("change", updatePrompt);
    });

    $("mapGeneratePromptBtn")?.addEventListener("click", () => {
      updatePrompt();
      setMessage("프롬프트를 생성했습니다.");
    });
    $("mapCopyPromptBtn")?.addEventListener("click", copyPrompt);
    $("mapSampleBtn")?.addEventListener("click", fillSample);
    $("mapResetBtn")?.addEventListener("click", reset);
    $("mapTechniqueClearBtn")?.addEventListener("click", () => {
      state.techniques = [];
      renderTechniqueGrid();
      updatePrompt();
      setMessage("강조 기법 선택을 해제했습니다. 프롬프트에는 AI가 적합한 기법을 고르도록 반영됩니다.");
    });
  }

  applyStateToFields();
  bind();
  updatePrompt();
})();
