// 데이터 기반 다이어그램 예상도·매칭·프롬프트 생성 탭
(function () {
  const root = document.getElementById("paneDataDiagram");
  const catalog = window.DATA_DIAGRAM_PRESETS;
  if (!root || !catalog) return;

  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = "promptdeck.dataDiagram.v1";
  const STATE_SCHEMA_VERSION = 1;
  const DIAGRAM_SCHEMA = "promptdeck-data-diagram/2.0";
  const INTENSITY_LABELS = ["절제됨", "보고서형", "균형", "설득형", "강한 집중"];
  const TYPE_CAPACITY = Object.freeze({
    flow: 5,
    hierarchy: 6,
    timeline: 5,
    comparison: 4,
    matrix: 4,
    cycle: 6,
    funnel: 5,
    network: 7,
  });
  const MATRIX_QUADRANTS = Object.freeze([
    { id: "high-impact-low-effort", label: "고효과·저난이도", impact: "high", effort: "low", column: 0, row: 0 },
    { id: "high-impact-high-effort", label: "고효과·고난이도", impact: "high", effort: "high", column: 1, row: 0 },
    { id: "low-impact-low-effort", label: "저효과·저난이도", impact: "low", effort: "low", column: 0, row: 1 },
    { id: "low-impact-high-effort", label: "저효과·고난이도", impact: "low", effort: "high", column: 1, row: 1 },
  ]);
  const CANVAS_EXPORT_SIZES = Object.freeze({
    "16:9 landscape presentation figure": [1920, 1080],
    "A4 landscape report figure": [1600, 1131],
    "A4 portrait report figure": [1240, 1754],
    "square 1:1 infographic": [1400, 1400],
    "vertical 4:5 infographic": [1600, 2000],
  });
  const SLIDE_STYLE_BATCH_SIZE = 24;
  let svgSequence = 0;
  let activeResult = "expected";
  let lastProducedHash = "";
  let slideStyleSearchTimer = 0;
  const slideStyleBrowser = {
    category: "all",
    query: "",
    visible: SLIDE_STYLE_BATCH_SIZE,
    returnFocus: null,
  };

  const DEFAULT_STATE = {
    schemaVersion: STATE_SCHEMA_VERSION,
    title: "",
    purpose: "business-plan",
    canvas: "16:9 landscape presentation figure",
    rawData: "",
    type: "flow",
    typeAuto: true,
    layout: "left-right",
    density: "balanced",
    textMode: "hybrid",
    visual: "official",
    palette: "gov-blue",
    paletteManual: false,
    slideStyleId: "",
    slideStyleScope: "visual",
    customBackground: "#ffffff",
    customPrimary: "#17324d",
    customAccent: "#ff7a2f",
    matrixXAxis: "실행 난이도",
    matrixYAxis: "사업 효과",
    emphasis: "key-path",
    emphasisTarget: "auto",
    emphasisIntensity: 2,
    exclusions: "",
  };

  const state = { ...DEFAULT_STATE };
  let parsedData = emptyParsedData();

  const aliases = {
    label: ["항목", "이름", "명칭", "단계", "주체", "label", "name", "item", "stage", "node"],
    value: ["값", "수치", "성과", "value", "amount", "metric", "score"],
    unit: ["단위", "unit"],
    group: ["그룹", "분류", "범주", "group", "category", "cluster"],
    order: ["순서", "단계번호", "order", "sequence", "step"],
    parent: ["상위항목", "부모", "상위", "parent", "parentid"],
    from: ["시작", "출발", "보내는곳", "from", "source", "start"],
    to: ["도착", "대상", "받는곳", "to", "target", "end"],
    date: ["날짜", "시점", "기간", "연도", "date", "time", "year", "period"],
    description: ["설명", "내용", "메모", "description", "detail", "note"],
    highlight: ["강조", "핵심", "중요", "highlight", "focus", "priority"],
  };

  function emptyParsedData() {
    return {
      headers: [],
      nodes: [],
      edges: [],
      warnings: [],
      diagnostics: [],
      units: [],
      recommendation: "flow",
      delimiter: "",
      hasHeader: false,
    };
  }

  function findById(items, id, fallback = null) {
    return items.find((item) => item.id === id) || fallback || items[0];
  }

  function normalizeHeader(value) {
    return String(value || "").trim().toLowerCase().replace(/[\s_\-./()]+/g, "");
  }

  function headerRole(value) {
    const normalized = normalizeHeader(value);
    return Object.keys(aliases).find((role) => aliases[role].some((alias) => normalizeHeader(alias) === normalized)) || "";
  }

  function detectDelimiter(lines) {
    const sample = lines.slice(0, 4).join("\n");
    const counts = [
      ["\t", (sample.match(/\t/g) || []).length],
      [",", (sample.match(/,/g) || []).length],
      ["|", (sample.match(/\|/g) || []).length],
    ].sort((a, b) => b[1] - a[1]);
    return counts[0][1] > 0 ? counts[0][0] : "";
  }

  function parseDelimitedLine(line, delimiter) {
    if (!delimiter) return [line.trim()];
    const cells = [];
    let current = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"') {
        if (quoted && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (character === delimiter && !quoted) {
        cells.push(current.trim());
        current = "";
      } else {
        current += character;
      }
    }
    cells.push(current.trim());
    return cells;
  }

  function slug(value, index) {
    const safe = String(value || "")
      .normalize("NFKC")
      .replace(/[^a-zA-Z0-9가-힣]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
    return safe || `item-${index + 1}`;
  }

  function uniqueSlug(value, index, usedIds) {
    const base = slug(value, index);
    let candidate = base;
    let suffix = 2;
    while (usedIds.has(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(candidate);
    return candidate;
  }

  function sha256(value) {
    const constants = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];
    const rotateRight = (number, amount) => (number >>> amount) | (number << (32 - amount));
    const bytes = [...new TextEncoder().encode(String(value || ""))];
    const bitLength = bytes.length * 8;
    bytes.push(0x80);
    while ((bytes.length % 64) !== 56) bytes.push(0);
    const high = Math.floor(bitLength / 0x100000000);
    const low = bitLength >>> 0;
    [high, low].forEach((part) => {
      bytes.push((part >>> 24) & 255, (part >>> 16) & 255, (part >>> 8) & 255, part & 255);
    });
    const hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    for (let offset = 0; offset < bytes.length; offset += 64) {
      const words = new Array(64).fill(0);
      for (let index = 0; index < 16; index += 1) {
        const cursor = offset + index * 4;
        words[index] = ((bytes[cursor] << 24) | (bytes[cursor + 1] << 16) | (bytes[cursor + 2] << 8) | bytes[cursor + 3]) >>> 0;
      }
      for (let index = 16; index < 64; index += 1) {
        const s0 = rotateRight(words[index - 15], 7) ^ rotateRight(words[index - 15], 18) ^ (words[index - 15] >>> 3);
        const s1 = rotateRight(words[index - 2], 17) ^ rotateRight(words[index - 2], 19) ^ (words[index - 2] >>> 10);
        words[index] = (words[index - 16] + s0 + words[index - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = hash;
      for (let index = 0; index < 64; index += 1) {
        const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
        const choice = (e & f) ^ (~e & g);
        const temp1 = (h + sum1 + choice + constants[index] + words[index]) >>> 0;
        const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
        const majority = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (sum0 + majority) >>> 0;
        h = g;
        g = f;
        f = e;
        e = (d + temp1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) >>> 0;
      }
      [a, b, c, d, e, f, g, h].forEach((valuePart, index) => {
        hash[index] = (hash[index] + valuePart) >>> 0;
      });
    }
    return hash.map((part) => part.toString(16).padStart(8, "0")).join("");
  }

  function truthyMarker(value) {
    return /^(1|true|yes|y|예|강조|핵심|중요)$/i.test(String(value || "").trim());
  }

  function matrixQuadrantFromGroup(value) {
    const compact = normalizeHeader(value);
    if (!compact) return null;
    const namedQuadrants = [
      [/(즉시추진|quickwin|quickwins|우선추진)/i, "high-impact-low-effort"],
      [/(전략검토|strategicbet|majorproject)/i, "high-impact-high-effort"],
      [/(효율개선|fillin|maintenance)/i, "low-impact-low-effort"],
      [/(장기과제|longterm|deprioritize)/i, "low-impact-high-effort"],
    ];
    const named = namedQuadrants.find(([pattern]) => pattern.test(compact));
    if (named) return named[1];

    const highImpact = /(고효과|효과높|효과상|고가치|가치높|highimpact|highvalue)/i.test(compact);
    const lowImpact = /(저효과|효과낮|효과하|저가치|가치낮|lowimpact|lowvalue)/i.test(compact);
    const lowEffort = /(저난이도|난이도낮|낮은난이도|저비용|쉬움|loweffort|lowdifficulty|easy)/i.test(compact);
    const highEffort = /(고난이도|난이도높|높은난이도|고비용|어려움|higheffort|highdifficulty|hard)/i.test(compact);
    if (highImpact && lowEffort) return "high-impact-low-effort";
    if (highImpact && highEffort) return "high-impact-high-effort";
    if (lowImpact && lowEffort) return "low-impact-low-effort";
    if (lowImpact && highEffort) return "low-impact-high-effort";
    return null;
  }

  function hasMatrixGrouping(nodes) {
    const groups = [...new Set(nodes.map((node) => node.group).filter(Boolean))];
    if (groups.length < 3) return false;
    return groups.filter((group) => matrixQuadrantFromGroup(group)).length >= 3;
  }

  function inferRecommendation({ roles, nodes, edges }) {
    if (roles.from !== undefined && roles.to !== undefined) return "network";
    if (roles.parent !== undefined) return "hierarchy";
    if (roles.date !== undefined) return "timeline";
    if (roles.order !== undefined) return "flow";
    if (edges.length) return "network";
    if (roles.group !== undefined && hasMatrixGrouping(nodes)) return "matrix";
    if (roles.value !== undefined && nodes.length >= 3) return "comparison";
    return "flow";
  }

  function parseData(raw) {
    const source = String(raw || "").replace(/^\uFEFF/, "").trim();
    if (!source) return emptyParsedData();
    const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const arrowLines = lines.filter((line) => /\s(?:->|→)\s/.test(line));
    if (arrowLines.length === lines.length) {
      const nodeMap = new Map();
      const usedIds = new Set();
      const edges = [];
      arrowLines.forEach((line, index) => {
        const parts = line.split(/\s(?:->|→)\s/).map((part) => part.trim()).filter(Boolean);
        for (let cursor = 0; cursor < parts.length - 1; cursor += 1) {
          const from = parts[cursor];
          const to = parts[cursor + 1];
          if (!nodeMap.has(from)) nodeMap.set(from, { id: uniqueSlug(from, nodeMap.size, usedIds), label: from, value: "", unit: "", group: "", date: "", description: "", highlighted: false });
          if (!nodeMap.has(to)) nodeMap.set(to, { id: uniqueSlug(to, nodeMap.size, usedIds), label: to, value: "", unit: "", group: "", date: "", description: "", highlighted: false });
          edges.push({ from, to, label: "", index });
        }
      });
      return {
        headers: [],
        nodes: [...nodeMap.values()],
        edges,
        warnings: [],
        diagnostics: [],
        units: [],
        recommendation: "network",
        delimiter: "arrow",
        hasHeader: false,
      };
    }

    const delimiter = detectDelimiter(lines);
    const rows = lines.map((line) => parseDelimitedLine(line, delimiter));
    const firstRoles = rows[0].map(headerRole);
    const hasHeader = firstRoles.filter(Boolean).length > 0;
    const headers = hasHeader ? rows[0] : rows[0].map((_, index) => index === 0 ? "항목" : `열${index + 1}`);
    const roleIndexes = {};
    headers.forEach((header, index) => {
      const role = headerRole(header);
      if (role && roleIndexes[role] === undefined) roleIndexes[role] = index;
    });
    if (roleIndexes.label === undefined && roleIndexes.from === undefined) roleIndexes.label = 0;
    const dataRows = hasHeader ? rows.slice(1) : rows;
    const nodeMap = new Map();
    const usedIds = new Set();
    const duplicateLabels = new Set();
    const edges = [];

    const ensureNode = (label, row, index, trackDuplicate = true) => {
      const cleanLabel = String(label || "").trim();
      if (!cleanLabel) return null;
      if (nodeMap.has(cleanLabel)) {
        if (trackDuplicate) duplicateLabels.add(cleanLabel);
        return nodeMap.get(cleanLabel);
      }
      const node = {
        id: uniqueSlug(cleanLabel, nodeMap.size, usedIds),
        label: cleanLabel,
        value: roleIndexes.value === undefined ? "" : String(row[roleIndexes.value] || "").trim(),
        unit: roleIndexes.unit === undefined ? "" : String(row[roleIndexes.unit] || "").trim(),
        group: roleIndexes.group === undefined ? "" : String(row[roleIndexes.group] || "").trim(),
        order: roleIndexes.order === undefined ? index + 1 : String(row[roleIndexes.order] || "").trim(),
        parent: roleIndexes.parent === undefined ? "" : String(row[roleIndexes.parent] || "").trim(),
        date: roleIndexes.date === undefined ? "" : String(row[roleIndexes.date] || "").trim(),
        description: roleIndexes.description === undefined ? "" : String(row[roleIndexes.description] || "").trim(),
        highlighted: roleIndexes.highlight === undefined ? false : truthyMarker(row[roleIndexes.highlight]),
      };
      nodeMap.set(cleanLabel, node);
      return node;
    };

    dataRows.forEach((row, index) => {
      if (roleIndexes.from !== undefined && roleIndexes.to !== undefined) {
        const from = String(row[roleIndexes.from] || "").trim();
        const to = String(row[roleIndexes.to] || "").trim();
        if (!from || !to) return;
        ensureNode(from, row, index, false);
        ensureNode(to, row, index, false);
        edges.push({ from, to, label: roleIndexes.description === undefined ? "" : String(row[roleIndexes.description] || "").trim(), index });
        return;
      }
      const label = roleIndexes.label === undefined ? row[0] : row[roleIndexes.label];
      const node = ensureNode(label, row, index);
      if (node?.parent) edges.push({ from: node.parent, to: node.label, label: "", index });
    });

    const nodes = [...nodeMap.values()];
    const diagnostics = [];
    if (duplicateLabels.size) diagnostics.push({
      code: "duplicate-labels",
      severity: "error",
      message: `중복 항목: ${[...duplicateLabels].slice(0, 3).join(", ")}`,
    });
    const nodeLabels = new Set(nodes.map((node) => node.label));
    const missingTargets = [...new Set(edges.flatMap((edge) => [edge.from, edge.to]).filter((label) => !nodeLabels.has(label)))];
    if (missingTargets.length) diagnostics.push({
      code: "missing-targets",
      severity: "error",
      message: `정의되지 않은 연결 항목: ${missingTargets.slice(0, 3).join(", ")}`,
    });
    const units = [...new Set(nodes.map((node) => node.unit).filter(Boolean))];
    if (units.length > 2) diagnostics.push({
      code: "mixed-units",
      severity: "warning",
      message: `단위 ${units.length}종 혼용 · 비교 기준을 확인하세요.`,
    });
    if (nodes.some((node) => node.label.length > 30)) diagnostics.push({
      code: "long-labels",
      severity: "warning",
      message: "30자를 넘는 라벨이 있어 이미지에서 축약될 수 있습니다.",
    });
    if (nodes.length > 20) diagnostics.push({
      code: "many-items",
      severity: "warning",
      message: "항목이 20개를 넘어 여러 다이어그램으로 분리하는 것이 좋습니다.",
    });
    const warnings = diagnostics.map((item) => item.message);
    const recommendation = inferRecommendation({ roles: roleIndexes, nodes, edges });
    return { headers, nodes, edges, warnings, diagnostics, units, recommendation, delimiter: delimiter || "line", hasHeader };
  }

  function syncStateFromFields() {
    state.title = $("diagramTitle")?.value.trim() || "";
    state.purpose = $("diagramPurpose")?.value || DEFAULT_STATE.purpose;
    state.canvas = $("diagramCanvas")?.value || DEFAULT_STATE.canvas;
    state.rawData = $("diagramDataInput")?.value || "";
    state.density = $("diagramDensity")?.value || DEFAULT_STATE.density;
    state.textMode = $("diagramTextMode")?.value || DEFAULT_STATE.textMode;
    state.slideStyleScope = $("diagramSlideStyleScope")?.value || DEFAULT_STATE.slideStyleScope;
    state.matrixXAxis = $("diagramMatrixXAxis")?.value.trim() || DEFAULT_STATE.matrixXAxis;
    state.matrixYAxis = $("diagramMatrixYAxis")?.value.trim() || DEFAULT_STATE.matrixYAxis;
    state.emphasisTarget = $("diagramEmphasisTarget")?.value || "auto";
    state.emphasisIntensity = Number($("diagramEmphasisIntensity")?.value ?? state.emphasisIntensity);
    state.exclusions = $("diagramExclusions")?.value.trim() || "";
    state.customBackground = $("diagramCustomBackground")?.value || DEFAULT_STATE.customBackground;
    state.customPrimary = $("diagramCustomPrimary")?.value || DEFAULT_STATE.customPrimary;
    state.customAccent = $("diagramCustomAccent")?.value || DEFAULT_STATE.customAccent;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, schemaVersion: STATE_SCHEMA_VERSION }));
    } catch (_) {
      // 저장소가 제한되어도 현재 세션 기능은 유지한다.
    }
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || saved.schemaVersion !== STATE_SCHEMA_VERSION) return false;
      Object.keys(DEFAULT_STATE).forEach((key) => {
        if (saved[key] !== undefined) state[key] = saved[key];
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  function applyStateToFields() {
    $("diagramTitle").value = state.title;
    $("diagramPurpose").value = state.purpose;
    $("diagramCanvas").value = state.canvas;
    $("diagramDataInput").value = state.rawData;
    $("diagramDensity").value = state.density;
    $("diagramTextMode").value = state.textMode;
    $("diagramSlideStyleScope").value = state.slideStyleScope;
    $("diagramMatrixXAxis").value = state.matrixXAxis;
    $("diagramMatrixYAxis").value = state.matrixYAxis;
    $("diagramEmphasisIntensity").value = String(state.emphasisIntensity);
    $("diagramExclusions").value = state.exclusions;
    $("diagramCustomBackground").value = state.customBackground;
    $("diagramCustomPrimary").value = state.customPrimary;
    $("diagramCustomAccent").value = state.customAccent;
  }

  function makeChoiceCard(item, className, selected, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", String(selected));
    button.dataset.optionId = item.id;
    const title = document.createElement("strong");
    title.textContent = item.label;
    const desc = document.createElement("small");
    desc.textContent = item.desc;
    button.append(title, desc);
    button.addEventListener("click", onClick);
    return button;
  }

  function renderTypeGrid() {
    const grid = $("diagramTypeGrid");
    if (!grid) return;
    grid.replaceChildren(...catalog.diagramTypes.map((type) => makeChoiceCard(
      type,
      "diagram-choice-card",
      type.id === state.type,
      () => {
        state.type = type.id;
        state.typeAuto = false;
        if (!type.layouts.includes(state.layout)) state.layout = type.defaultLayout;
        state.emphasis = type.defaultEmphasis;
        updateAll();
        setMessage(`${type.label} 구조를 적용했습니다.`);
      },
    )));
  }

  function renderLayoutGrid() {
    const type = findById(catalog.diagramTypes, state.type);
    const allowed = catalog.layouts.filter((layout) => type.layouts.includes(layout.id));
    if (!allowed.some((layout) => layout.id === state.layout)) state.layout = type.defaultLayout;
    const grid = $("diagramLayoutGrid");
    if (!grid) return;
    grid.replaceChildren(...allowed.map((layout) => makeChoiceCard(
      layout,
      "diagram-layout-card",
      layout.id === state.layout,
      () => {
        state.layout = layout.id;
        updateAll();
      },
    )));
  }

  function renderVisualGrid() {
    const grid = $("diagramVisualGrid");
    if (!grid) return;
    grid.replaceChildren(...catalog.visualStrategies.map((visual) => makeChoiceCard(
      visual,
      "diagram-choice-card",
      visual.id === state.visual,
      () => {
        state.visual = visual.id;
        if (!state.paletteManual) state.palette = visual.defaultPalette;
        updateAll();
      },
    )));
  }

  function renderPaletteGrid() {
    const grid = $("diagramPaletteGrid");
    if (!grid) return;
    grid.replaceChildren(...catalog.palettes.map((palette) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "diagram-palette-card";
      button.setAttribute("role", "radio");
      button.setAttribute("aria-checked", String(palette.id === state.palette));
      button.dataset.optionId = palette.id;
      const label = document.createElement("strong");
      label.textContent = palette.label;
      const swatches = document.createElement("span");
      swatches.className = "diagram-palette-swatches";
      palette.colors.slice(0, 5).forEach((color) => {
        const swatch = document.createElement("i");
        swatch.style.background = color;
        swatches.appendChild(swatch);
      });
      button.append(label, swatches);
      button.addEventListener("click", () => {
        state.palette = palette.id;
        state.paletteManual = true;
        updateAll();
      });
      return button;
    }));
    $("diagramCustomColors").hidden = state.palette !== "custom";
  }

  function renderMatrixSettings() {
    const settings = $("diagramMatrixSettings");
    if (settings) settings.hidden = state.type !== "matrix";
  }

  function makeSlideStyleCard(contract, { compact = false } = {}) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = compact ? "diagram-slide-style-card" : "diagram-style-browser-card";
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", String(contract.id === state.slideStyleId));
    button.dataset.slideStyleId = contract.id;
    button.title = `${contract.nameKo} · ${contract.description}`;

    const preview = document.createElement("span");
    preview.className = compact ? "diagram-slide-style-preview" : "diagram-style-browser-preview";
    const image = document.createElement("img");
    image.src = contract.previewImage;
    image.alt = "";
    image.loading = "lazy";
    image.addEventListener("error", () => {
      image.remove();
      preview.classList.add("is-fallback");
    }, { once: true });
    preview.appendChild(image);

    if (compact) {
      const label = document.createElement("strong");
      label.textContent = contract.nameKo;
      button.append(preview, label);
    } else {
      if (contract.recommended) {
        const badge = document.createElement("em");
        badge.textContent = "추천";
        preview.appendChild(badge);
      }
      const copy = document.createElement("span");
      copy.className = "diagram-style-browser-copy";
      const label = document.createElement("strong");
      label.textContent = contract.nameKo;
      const category = document.createElement("small");
      category.textContent = contract.categoryLabel;
      const description = document.createElement("span");
      description.textContent = contract.description;
      copy.append(label, category, description);
      button.append(preview, copy);
    }

    button.addEventListener("click", () => {
      state.slideStyleId = contract.id;
      updateAll();
      setMessage(`${contract.nameKo} 슬라이드 디자인 DNA를 연결했습니다.`);
    });
    return button;
  }

  function getSlideStyleMatches(bridge) {
    const category = slideStyleBrowser.category;
    return bridge.listDiagramStyles({
      mode: category === "compatible" ? "compatible" : "all",
      category: category === "compatible" ? "all" : category,
      query: slideStyleBrowser.query,
      scope: state.slideStyleScope,
    });
  }

  function renderSlideStyleDialog() {
    const dialog = $("diagramSlideStyleDialog");
    const bridge = window.PromptDeckVisualStyleContract;
    if (!dialog || dialog.hidden || !bridge) return;

    const categories = [
      { id: "all", label: "전체", count: bridge.counts.total },
      { id: "recommended", label: "추천", count: bridge.counts.recommended },
      { id: "compatible", label: "다이어그램 적합", count: bridge.counts.compatible },
      ...bridge.categories.map((category) => ({ ...category, count: bridge.listDiagramStyles({ mode: "all", category: category.id }).length })),
    ];
    const categoryHost = $("diagramSlideStyleCategories");
    categoryHost?.replaceChildren(...categories.map((category) => {
      const button = document.createElement("button");
      const selected = category.id === slideStyleBrowser.category;
      button.type = "button";
      button.className = "diagram-style-category";
      button.dataset.slideStyleCategory = category.id;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      button.textContent = `${category.label} ${category.count}`;
      return button;
    }));

    const matches = getSlideStyleMatches(bridge);
    const visible = matches.slice(0, slideStyleBrowser.visible);
    $("diagramSlideStyleAllGrid")?.replaceChildren(...visible.map((contract) => makeSlideStyleCard(contract)));

    const resultCount = $("diagramSlideStyleResultCount");
    if (resultCount) {
      const prefix = slideStyleBrowser.query ? `“${slideStyleBrowser.query}” 검색 결과` : "선택한 분류";
      resultCount.textContent = `${prefix} ${matches.length}개 · ${visible.length}개 표시`;
    }
    const selected = bridge.get(state.slideStyleId, state.slideStyleScope);
    if ($("diagramSlideStyleSelection")) {
      $("diagramSlideStyleSelection").textContent = `현재 선택: ${selected?.nameKo || "다이어그램 기본"}`;
    }
    if ($("diagramSlideStyleEmpty")) $("diagramSlideStyleEmpty").hidden = matches.length > 0;
    const loadMore = $("diagramSlideStyleLoadMoreBtn");
    if (loadMore) {
      const remaining = Math.max(0, matches.length - visible.length);
      loadMore.hidden = remaining === 0;
      loadMore.textContent = `더 보기 (${remaining}개 남음)`;
    }
    const search = $("diagramSlideStyleSearch");
    if (search && search.value !== slideStyleBrowser.query) search.value = slideStyleBrowser.query;
    if ($("diagramSlideStyleSearchClear")) $("diagramSlideStyleSearchClear").hidden = !slideStyleBrowser.query;
  }

  function openSlideStyleDialog() {
    const dialog = $("diagramSlideStyleDialog");
    if (!dialog || !window.PromptDeckVisualStyleContract) return;
    slideStyleBrowser.returnFocus = document.activeElement;
    slideStyleBrowser.visible = SLIDE_STYLE_BATCH_SIZE;
    // Keep the fixed modal outside tab/workspace stacking and clipping contexts.
    // This also prevents a scrolled tab pane from pushing the dialog header
    // above the viewport when browser zoom or responsive layout changes.
    if (dialog.parentElement !== document.body) document.body.append(dialog);
    dialog.hidden = false;
    document.body.classList.add("diagram-style-dialog-open");
    $("diagramOpenSlideStyleGalleryBtn")?.setAttribute("aria-expanded", "true");
    renderSlideStyleDialog();
    window.setTimeout(() => $("diagramSlideStyleSearch")?.focus(), 0);
  }

  function closeSlideStyleDialog() {
    const dialog = $("diagramSlideStyleDialog");
    if (!dialog || dialog.hidden) return;
    dialog.hidden = true;
    document.body.classList.remove("diagram-style-dialog-open");
    $("diagramOpenSlideStyleGalleryBtn")?.setAttribute("aria-expanded", "false");
    const returnFocus = slideStyleBrowser.returnFocus;
    slideStyleBrowser.returnFocus = null;
    if (returnFocus instanceof HTMLElement && returnFocus.isConnected) returnFocus.focus();
  }

  function renderSlideStyleGallery() {
    const gallery = $("diagramSlideStyleGallery");
    const wrapper = $("diagramStyleContract");
    const bridge = window.PromptDeckVisualStyleContract;
    if (!gallery || !wrapper) return;
    if (!bridge) {
      wrapper.hidden = true;
      return;
    }
    wrapper.hidden = false;
    const defaultButton = document.createElement("button");
    defaultButton.type = "button";
    defaultButton.className = "diagram-slide-style-card";
    defaultButton.setAttribute("role", "radio");
    defaultButton.setAttribute("aria-checked", String(!state.slideStyleId));
    defaultButton.dataset.slideStyleId = "";
    const defaultPreview = document.createElement("span");
    defaultPreview.className = "diagram-slide-style-default-preview";
    defaultPreview.setAttribute("aria-hidden", "true");
    const defaultLabel = document.createElement("strong");
    defaultLabel.textContent = "다이어그램 기본";
    defaultButton.append(defaultPreview, defaultLabel);
    defaultButton.addEventListener("click", () => {
      state.slideStyleId = "";
      updateAll();
    });

    const featured = bridge.listDiagramStyles({ limit: 10, scope: state.slideStyleScope });
    const selected = bridge.get(state.slideStyleId, state.slideStyleScope);
    const visibleStyles = selected && !featured.some((contract) => contract.id === selected.id)
      ? [selected, ...featured.slice(0, 9)]
      : featured;
    const cards = visibleStyles.map((contract) => makeSlideStyleCard(contract, { compact: true }));
    gallery.replaceChildren(defaultButton, ...cards);

    if ($("diagramSlideStyleCount")) {
      $("diagramSlideStyleCount").textContent = `다이어그램 추천 ${featured.length}개 미리보기 · 전체 갤러리 ${bridge.counts.total}개`;
    }
    if ($("diagramSlideStyleTotal")) $("diagramSlideStyleTotal").textContent = bridge.counts.total;

    const summary = $("diagramSlideStyleSummary");
    const contract = getSlideStyleContract();
    if (summary) {
      summary.textContent = contract
        ? `${contract.nameKo}의 팔레트·${contract.composition.lineLanguage} 선·${contract.composition.surfaceLanguage} 표면${contract.scope === "composition" ? `·${contract.composition.spatialRhythm} 구성 리듬` : ""}을 공유합니다. 데이터 구조가 항상 우선합니다.`
        : "기본 다이어그램 스타일을 사용합니다. 슬라이드 DNA를 선택하면 갤러리 팔레트가 기본 팔레트보다 우선 적용됩니다.";
    }
  }

  function renderEmphasisGrid() {
    const grid = $("diagramEmphasisGrid");
    if (!grid) return;
    grid.replaceChildren(...catalog.emphasisTechniques.map((item) => makeChoiceCard(
      item,
      "diagram-emphasis-card",
      item.id === state.emphasis,
      () => {
        state.emphasis = item.id;
        updateAll();
      },
    )));
  }

  function renderEmphasisTargets() {
    const select = $("diagramEmphasisTarget");
    if (!select) return;
    const prior = state.emphasisTarget;
    const auto = document.createElement("option");
    auto.value = "auto";
    auto.textContent = "자동 · 데이터와 목적에 맞춰 선택";
    const options = parsedData.nodes.slice(0, 50).map((node) => {
      const option = document.createElement("option");
      option.value = node.id;
      option.textContent = node.value ? `${node.label} · ${node.value}${node.unit || ""}` : node.label;
      return option;
    });
    select.replaceChildren(auto, ...options);
    state.emphasisTarget = options.some((option) => option.value === prior) ? prior : "auto";
    select.value = state.emphasisTarget;
  }

  function getResolvedTarget(nodes = parsedData.nodes) {
    if (!nodes.length) return null;
    if (state.emphasisTarget !== "auto") {
      const selected = nodes.find((node) => node.id === state.emphasisTarget);
      if (selected) return selected;
    }
    return nodes.find((node) => node.highlighted)
      || (state.emphasis === "outcome" ? nodes[nodes.length - 1] : nodes[0]);
  }

  function getPalette(paletteId = state.palette) {
    const palette = findById(catalog.palettes, paletteId);
    if (palette.id !== "custom") return palette;
    return {
      ...palette,
      colors: [state.customPrimary, state.customPrimary, "#dbe5ef", state.customBackground, state.customAccent],
      prompt: `Use exact color roles: background ${state.customBackground}, primary structure ${state.customPrimary}, and focal accent ${state.customAccent}. Derive only accessible lighter tints from these colors.`,
    };
  }

  function getVisualStyle(visualId = state.visual) {
    return findById(catalog.visualStrategies, visualId);
  }

  function getType(typeId = state.type) {
    return findById(catalog.diagramTypes, typeId);
  }

  function getLayout(layoutId = state.layout) {
    return findById(catalog.layouts, layoutId);
  }

  function getEmphasis(emphasisId = state.emphasis) {
    return findById(catalog.emphasisTechniques, emphasisId);
  }

  function getPurpose(purposeId = state.purpose) {
    return findById(catalog.purposes, purposeId);
  }

  function getTypeCapacity(typeId = state.type) {
    return TYPE_CAPACITY[typeId] || 8;
  }

  function getSlideStyleContract(styleId = state.slideStyleId, scope = state.slideStyleScope) {
    if (!styleId) return null;
    return window.PromptDeckVisualStyleContract?.get?.(styleId, scope) || null;
  }

  function getEffectivePalette(paletteId = state.palette, styleId = state.slideStyleId) {
    const base = getPalette(paletteId);
    const contract = getSlideStyleContract(styleId);
    if (!contract) return base;
    return {
      ...base,
      id: `slide-style:${contract.id}`,
      label: `${contract.nameKo} 연동`,
      family: `slide-style-${contract.palette.mode}`,
      colors: [
        contract.palette.primary,
        contract.palette.secondary,
        contract.palette.surface,
        contract.palette.background,
        contract.palette.accent,
      ],
      prompt: `Use the exact ${contract.nameKo} slide-gallery palette: primary ${contract.palette.primary}, secondary ${contract.palette.secondary}, surface ${contract.palette.surface}, background ${contract.palette.background}, and accent ${contract.palette.accent}.`,
    };
  }

  function getRenderTokens(contract = getSlideStyleContract()) {
    return window.PromptDeckVisualStyleContract?.deriveRenderTokens?.(contract) || null;
  }

  function getActiveDiagnostics(typeId = state.type) {
    const source = parsedData.diagnostics || parsedData.warnings.map((message) => ({ code: "legacy-warning", severity: "warning", message }));
    return source.map((item) => ({
      ...item,
      severity: item.code === "mixed-units" && ["comparison", "matrix"].includes(typeId) ? "error" : item.severity,
    }));
  }

  function getMatrixSpec(nodes = parsedData.nodes, options = {}) {
    const visibleNodes = nodes.slice(0, getTypeCapacity("matrix"));
    const placements = visibleNodes.map((node, index) => {
      const inferred = matrixQuadrantFromGroup(node.group);
      const fallback = MATRIX_QUADRANTS[index % MATRIX_QUADRANTS.length].id;
      return {
        nodeId: node.id,
        nodeLabel: node.label,
        group: node.group || "",
        quadrantId: inferred || fallback,
        source: inferred ? "group" : "input-order-fallback",
      };
    });
    return {
      axes: {
        x: {
          id: "x",
          label: options.xAxis || state.matrixXAxis || DEFAULT_STATE.matrixXAxis,
          lowLabel: "낮음",
          highLabel: "높음",
          direction: "left-to-right",
        },
        y: {
          id: "y",
          label: options.yAxis || state.matrixYAxis || DEFAULT_STATE.matrixYAxis,
          lowLabel: "낮음",
          highLabel: "높음",
          direction: "bottom-to-top",
        },
      },
      quadrants: MATRIX_QUADRANTS.map((quadrant) => ({ ...quadrant })),
      placements,
      placementMode: placements.every((placement) => placement.source === "group") ? "group-semantic" : "group-with-order-fallback",
    };
  }

  function canonicalSourceData() {
    return JSON.stringify({
      headers: parsedData.headers.map((header) => String(header || "").trim()),
      nodes: parsedData.nodes.map((node) => ({
        id: node.id,
        label: node.label,
        value: node.value || "",
        unit: node.unit || "",
        group: node.group || "",
        order: node.order || "",
        parent: node.parent || "",
        date: node.date || "",
        description: node.description || "",
        highlighted: Boolean(node.highlighted),
      })),
      edges: parsedData.edges.map((edge) => ({
        from: edge.from,
        to: edge.to,
        label: edge.label || "",
        order: Number(edge.index || 0),
      })),
    });
  }

  function getSourceHash() {
    return `sha256:${sha256(canonicalSourceData())}`;
  }

  function normalizedEdges(nodes = parsedData.nodes, edges = parsedData.edges) {
    const idByLabel = new Map(nodes.map((node) => [node.label, node.id]));
    return edges.map((edge, index) => ({
      id: `edge-${String(index + 1).padStart(2, "0")}`,
      fromId: idByLabel.get(edge.from) || null,
      toId: idByLabel.get(edge.to) || null,
      fromLabel: edge.from,
      toLabel: edge.to,
      label: edge.label || "",
      directed: true,
      order: index + 1,
    }));
  }

  function createDiagramSpec() {
    const type = getType();
    const palette = getEffectivePalette();
    const styleContract = getSlideStyleContract();
    const diagnostics = getActiveDiagnostics(type.id);
    const target = getResolvedTarget();
    return {
      schema: DIAGRAM_SCHEMA,
      schemaVersion: 2,
      title: state.title || "데이터 다이어그램",
      purpose: { id: state.purpose, label: getPurpose().label },
      canvas: state.canvas,
      source: {
        itemCount: parsedData.nodes.length,
        edgeCount: parsedData.edges.length,
        units: parsedData.units,
        hashAlgorithm: "SHA-256",
        hash: getSourceHash(),
        dataMustRemainExact: true,
      },
      diagram: {
        type: type.id,
        typeLabel: type.label,
        layout: state.layout,
        layoutLabel: getLayout().label,
        density: state.density,
        textMode: state.textMode,
        previewCapacity: getTypeCapacity(type.id),
        ...(type.id === "matrix" ? { matrix: getMatrixSpec() } : {}),
      },
      visual: {
        strategy: state.visual,
        strategyLabel: getVisualStyle().label,
        palette: state.palette,
        paletteLabel: palette.label,
        styleContract,
        colorRoles: {
          primary: palette.colors[0],
          secondary: palette.colors[1],
          support: palette.colors[2],
          background: palette.colors[3],
          emphasis: palette.colors[4],
        },
      },
      emphasis: {
        technique: state.emphasis,
        techniqueLabel: getEmphasis().label,
        targetId: target?.id || "auto",
        targetLabel: target?.label || "AI가 데이터와 목적에 맞춰 선택",
        intensity: state.emphasisIntensity,
        intensityLabel: INTENSITY_LABELS[state.emphasisIntensity],
      },
      data: {
        nodes: parsedData.nodes.map((node) => ({ ...node })),
        edges: normalizedEdges(),
      },
      diagnostics: {
        withinPreviewCapacity: parsedData.nodes.length <= getTypeCapacity(type.id),
        items: diagnostics,
        errors: diagnostics.filter((item) => item.severity === "error").map((item) => item.message),
        warnings: diagnostics.filter((item) => item.severity === "warning").map((item) => item.message),
      },
      generation: {
        path: "precision_full_slide",
        targetModel: "common",
        contractVersion: "diagram-2.0",
        outputMode: "standard",
      },
      constraints: {
        noInventedValues: true,
        noChangedUnits: true,
        noChangedTopology: true,
        additional: state.exclusions || "없음",
      },
    };
  }

  function buildPrompt() {
    const spec = createDiagramSpec();
    const type = getType();
    const layout = getLayout();
    const visual = getVisualStyle();
    const palette = getEffectivePalette();
    const styleContract = getSlideStyleContract();
    const emphasis = getEmphasis();
    const purpose = getPurpose();
    const target = getResolvedTarget();
    const nodeLines = parsedData.nodes.length
      ? parsedData.nodes.map((node, index) => {
        const facts = [node.value, node.unit, node.date, node.group].filter(Boolean).join(" · ");
        const detail = node.description ? ` | description: ${node.description}` : "";
        return `- ${index + 1}. label: "${node.label}"${facts ? ` | exact data: "${facts}"` : ""}${detail}`;
      })
      : ["- No structured rows were supplied. Use the user's description without inventing facts."];
    const edgeLines = parsedData.edges.length
      ? parsedData.edges.map((edge) => `- "${edge.from}" -> "${edge.to}"${edge.label ? ` | relationship: "${edge.label}"` : ""}`)
      : ["- Preserve the listed item order as the intended reading sequence unless the selected diagram type requires grouping."];
    const textModePrompts = {
      hybrid: "Render only short essential labels and key values inside the image. Keep detailed explanations out of the graphic and reserve clean annotation space if needed.",
      exact: "Render every supplied label and value exactly as written. If accurate text rendering is not possible, leave a clean text area rather than substituting or hallucinating characters.",
      short: "Shorten only descriptive phrases while preserving official names, numbers, units, dates, and meaning. Never abbreviate a value or proper noun ambiguously.",
      placeholder: "Create clean label zones and value placeholders without fabricating text. Preserve the topology so exact text can be overlaid later.",
    };
    const densityPrompts = {
      minimal: "Keep only the core nodes, one clear relationship path, and the main conclusion visible within three seconds.",
      balanced: "Use balanced information density suitable for a Korean business document: clear primary nodes, concise evidence, and restrained secondary context.",
      detailed: "Include the supplied detailed relationships and labels in organized clusters, while maintaining legibility and avoiding tiny text.",
    };
    const intensityPrompts = [
      "Use very restrained emphasis with only a subtle contrast shift.",
      "Use report-level emphasis: a controlled accent and mild hierarchy difference.",
      "Use balanced emphasis that is immediately visible but does not overwhelm supporting data.",
      "Use persuasive emphasis with stronger contrast, scale, and whitespace around the focus.",
      "Make the selected focus unmistakable at first glance while preserving factual balance and readability.",
    ];
    const matrixSpec = type.id === "matrix" ? getMatrixSpec() : null;
    const matrixLines = matrixSpec ? [
      `- X-axis: ${matrixSpec.axes.x.label}; ${matrixSpec.axes.x.lowLabel} on the left and ${matrixSpec.axes.x.highLabel} on the right.`,
      `- Y-axis: ${matrixSpec.axes.y.label}; ${matrixSpec.axes.y.lowLabel} at the bottom and ${matrixSpec.axes.y.highLabel} at the top.`,
      `- Quadrants: ${matrixSpec.quadrants.map((quadrant) => quadrant.label).join(", ")}.`,
      ...matrixSpec.placements.map((placement) => `- Place "${placement.nodeLabel}" in ${MATRIX_QUADRANTS.find((quadrant) => quadrant.id === placement.quadrantId)?.label || placement.quadrantId}${placement.source === "group" ? " exactly as specified by its group value" : " as the input-order fallback; keep this placement neutral if no group meaning is supplied"}.`),
    ] : [];
    const styleContractLines = window.PromptDeckVisualStyleContract?.promptLines?.(styleContract) || [];

    return [
      "# DATA DIAGRAM IMAGE GENERATION TASK",
      "",
      "## Objective and output",
      `Create one complete, presentation-ready data diagram for ${purpose.prompt}.`,
      `- Title: ${spec.title}`,
      `- Canvas: ${state.canvas}`,
      `- Diagram family: ${type.label}`,
      "- The image must communicate the main structure within three seconds and remain suitable for a formal Korean work document.",
      "",
      "## Immutable source data",
      `- Workflow source fingerprint: ${spec.source.hash} (traceability metadata only; do not render this string in the image).`,
      ...nodeLines,
      "",
      "## Immutable relationships and order",
      ...edgeLines,
      "",
      "## Diagram structure",
      `- ${type.prompt}`,
      `- Layout: ${layout.prompt}`,
      `- Information density: ${densityPrompts[state.density]}`,
      ...matrixLines,
      "- Preserve all supplied parent-child, sequence, category, and source-target relationships. Do not change topology for visual convenience.",
      "- Do not add decorative nodes, arrows, icons, categories, or stages that could be mistaken for data.",
      "",
      "## Visual strategy",
      `- Art direction: ${visual.prompt}`,
      `- Color system: ${palette.prompt}`,
      `- Use color consistently by semantic role: primary structure ${palette.colors[0]}, secondary structure ${palette.colors[1]}, support areas ${palette.colors[2]}, background ${palette.colors[3]}, focal emphasis ${palette.colors[4]}.`,
      ...styleContractLines,
      "- Use flat or very shallow vector depth. Avoid photorealistic objects, cinematic scenery, glossy toy-like 3D, and ornamental backgrounds.",
      "",
      "## Emphasis hierarchy",
      `- Primary focus: ${target ? `"${target.label}"` : "choose the most decision-relevant item from the supplied data"}.`,
      `- Technique: ${emphasis.prompt}`,
      `- Intensity (${INTENSITY_LABELS[state.emphasisIntensity]}): ${intensityPrompts[state.emphasisIntensity]}`,
      "- Secondary items must remain readable but must not compete with the primary focus.",
      "",
      "## Labels and typography",
      `- ${textModePrompts[state.textMode]}`,
      "- Preserve Korean spelling, official names, numbers, dates, signs, decimal points, and units exactly.",
      "- Use short horizontal labels, clear type hierarchy, high contrast, and no text smaller than a practical presentation caption.",
      "",
      "## Data fidelity and safety",
      "- Never calculate, infer, round, reorder, merge, split, or replace any supplied value unless explicitly requested.",
      "- Never invent totals, percentages, causal relationships, chronology, labels, sources, or performance claims.",
      "- If a relationship or value is unclear, keep it neutral or omit the unsupported visual claim instead of guessing.",
      `- Additional project constraints: ${state.exclusions || "Keep the result factual, uncluttered, and free of unsupported decoration."}`,
      "",
      "## Final output contract",
      "- Produce one finished diagram image only: no device mockup, no surrounding presentation slide, no watermark, no editor UI, and no explanatory notes outside the diagram.",
      "- The final image must visibly match the chosen diagram family, layout direction, color roles, and emphasis hierarchy.",
    ].join("\n");
  }

  function escapeXml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    })[character]);
  }

  function shortLabel(value, max = 15) {
    const text = String(value || "").trim();
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
  }

  function previewNodes(typeId, sourceNodes) {
    if (sourceNodes.length) return sourceNodes.slice(0, getTypeCapacity(typeId));
    return getType(typeId).sample.map((label, index) => ({
      id: `sample-${index}`,
      label,
      value: "",
      unit: "",
      group: "",
      highlighted: index === 0,
    }));
  }

  function renderDiagramSvg(options = {}) {
    const typeId = options.type || state.type;
    const layoutId = options.layout || state.layout;
    const visualId = options.visual || state.visual;
    const styleId = options.slideStyleId === undefined ? state.slideStyleId : options.slideStyleId;
    const styleContract = getSlideStyleContract(styleId);
    const palette = getEffectivePalette(options.palette || state.palette, styleId);
    const renderTokens = getRenderTokens(styleContract);
    const emphasisId = options.emphasis || state.emphasis;
    const sourceNodes = options.nodes || parsedData.nodes;
    const sourceEdges = options.edges || parsedData.edges;
    const nodes = previewNodes(typeId, sourceNodes);
    const targetId = options.targetId || getResolvedTarget(sourceNodes)?.id || nodes[0]?.id;
    const title = options.title || state.title || getType(typeId).label;
    const colors = palette.colors;
    const uid = `diagram-${svgSequence += 1}`;
    const background = colors[3] || "#ffffff";
    const primary = colors[0] || "#172033";
    const ink = styleContract?.palette.textPrimary || colors[0] || "#172033";
    const secondary = colors[1] || "#4c78a8";
    const support = colors[2] || "#dbe5ef";
    const accent = colors[4] || "#f28e2b";
    const surface = styleContract?.palette.surface || "#ffffff";
    const radius = renderTokens?.radius ?? (visualId === "editorial" ? 22 : visualId === "technical" ? 7 : 14);
    const strokeWidth = renderTokens?.strokeWidth || 1.5;
    const shadowOpacity = renderTokens?.shadowOpacity ?? (visualId === "official" || visualId === "technical" ? 0.08 : 0.15);
    const focusIndex = Math.max(0, nodes.findIndex((node) => node.id === targetId || node.label === targetId));
    const isFocused = (index) => index === focusIndex;
    const nodeFill = (index) => isFocused(index) ? accent : index % 2 ? support : surface;
    const nodeStroke = (index) => isFocused(index) ? accent : secondary;
    const nodeText = (index) => isFocused(index) ? (renderTokens?.focusText || "#ffffff") : ink;
    const safeTitle = escapeXml(shortLabel(title, 34));
    const markerColor = emphasisId === "risk" ? "#c2413b" : accent;

    const defs = `
      <defs>
        <filter id="${uid}-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="7" stdDeviation="7" flood-color="#0f172a" flood-opacity="${shadowOpacity}"/></filter>
        <linearGradient id="${uid}-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${background}"/><stop offset="1" stop-color="${support}" stop-opacity="${renderTokens?.backgroundTintOpacity ?? 0.42}"/></linearGradient>
        <marker id="${uid}-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="${secondary}"/></marker>
        <pattern id="${uid}-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="${secondary}" stroke-opacity="0.08"/></pattern>
      </defs>`;
    const backgroundExtras = visualId === "technical"
      ? `<rect x="20" y="20" width="720" height="390" rx="24" fill="url(#${uid}-grid)"/>`
      : visualId === "editorial"
        ? `<circle cx="695" cy="74" r="70" fill="${accent}" opacity="0.08"/><circle cx="70" cy="356" r="58" fill="${secondary}" opacity="0.08"/>`
        : "";
    const headerStyleLabel = styleContract ? `${getVisualStyle(visualId).label} · ${styleContract.nameKo}` : getVisualStyle(visualId).label;
    const header = `<text x="44" y="50" fill="${primary}" font-family="Pretendard, Arial, sans-serif" font-size="22" font-weight="800">${safeTitle}</text><text x="44" y="73" fill="${secondary}" font-family="Pretendard, Arial, sans-serif" font-size="12" font-weight="700">${escapeXml(getType(typeId).label)} · ${escapeXml(headerStyleLabel)}</text>`;

    function nodeCard(x, y, width, height, node, index, extra = "") {
      const value = [node.value, node.unit].filter(Boolean).join("");
      return `<g filter="url(#${uid}-shadow)" data-preview-node="${escapeXml(node.id)}">
        <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${nodeFill(index)}" stroke="${nodeStroke(index)}" stroke-width="${isFocused(index) ? Math.max(3, strokeWidth + 1) : strokeWidth}"/>
        ${extra}
        <text x="${x + width / 2}" y="${y + (value ? height / 2 - 3 : height / 2 + 5)}" text-anchor="middle" fill="${nodeText(index)}" font-family="Pretendard, Arial, sans-serif" font-size="${width < 125 ? 12 : 14}" font-weight="800">${escapeXml(shortLabel(node.label, width < 125 ? 10 : 15))}</text>
        ${value ? `<text x="${x + width / 2}" y="${y + height / 2 + 20}" text-anchor="middle" fill="${nodeText(index)}" font-family="Pretendard, Arial, sans-serif" font-size="13" font-weight="900">${escapeXml(shortLabel(value, 15))}</text>` : ""}
      </g>`;
    }

    let art = "";
    if (typeId === "flow") {
      if (layoutId === "top-down") {
        const count = Math.min(nodes.length, 5);
        const gap = 250 / Math.max(1, count - 1);
        art += nodes.slice(0, count).map((node, index) => {
          const x = 250;
          const y = 108 + gap * index;
          const connector = index < count - 1 ? `<path d="M380 ${y + 48} V${y + gap}" stroke="${secondary}" stroke-width="3" fill="none" marker-end="url(#${uid}-arrow)"/>` : "";
          return `${connector}${nodeCard(x, y, 260, 48, node, index)}`;
        }).join("");
      } else {
        const count = Math.min(nodes.length, 5);
        const width = count > 4 ? 118 : 138;
        const gap = (672 - width * count) / Math.max(1, count - 1);
        art += nodes.slice(0, count).map((node, index) => {
          const x = 44 + index * (width + gap);
          const y = layoutId === "stepped" ? 286 - index * 38 : 185;
          const nextX = x + width + Math.max(0, gap - 10);
          const connector = index < count - 1 ? `<path d="M${x + width} ${y + 36} L${nextX} ${layoutId === "stepped" ? y - 2 : y + 36}" stroke="${secondary}" stroke-width="3" fill="none" marker-end="url(#${uid}-arrow)"/>` : "";
          return `${connector}${nodeCard(x, y, width, 72, node, index)}`;
        }).join("");
      }
    } else if (typeId === "hierarchy") {
      const indexByLabel = new Map(nodes.map((node, index) => [node.label, index]));
      const visibleEdges = sourceEdges.filter((edge) => indexByLabel.has(edge.from || edge.fromLabel) && indexByLabel.has(edge.to || edge.toLabel));
      const incoming = new Set(visibleEdges.map((edge) => edge.to || edge.toLabel));
      const levels = new Map(nodes.filter((node) => !incoming.has(node.label)).map((node) => [node.label, 0]));
      if (!levels.size && nodes[0]) levels.set(nodes[0].label, 0);
      for (let pass = 0; pass < nodes.length; pass += 1) {
        visibleEdges.forEach((edge) => {
          const from = edge.from || edge.fromLabel;
          const to = edge.to || edge.toLabel;
          if (!levels.has(from)) return;
          levels.set(to, Math.max(levels.get(to) || 0, levels.get(from) + 1));
        });
      }
      nodes.forEach((node) => { if (!levels.has(node.label)) levels.set(node.label, 0); });
      const maxLevel = Math.max(0, ...levels.values());
      const groups = Array.from({ length: maxLevel + 1 }, (_, level) => nodes.filter((node) => levels.get(node.label) === level));
      const positions = new Map();
      groups.forEach((group, level) => {
        group.forEach((node, groupIndex) => {
          if (layoutId === "left-right") {
            const width = 128;
            const height = 50;
            const x = 48 + level * (584 / Math.max(1, maxLevel));
            const y = 100 + groupIndex * (270 / Math.max(1, group.length - 1));
            positions.set(node.label, { x, y, width, height, index: indexByLabel.get(node.label) });
          } else {
            const width = Math.min(148, 620 / Math.max(1, group.length) - 12);
            const height = 52;
            const x = 70 + groupIndex * (620 / Math.max(1, group.length)) + (620 / Math.max(1, group.length) - width) / 2;
            const y = 100 + level * (250 / Math.max(1, maxLevel));
            positions.set(node.label, { x, y, width, height, index: indexByLabel.get(node.label) });
          }
        });
      });
      visibleEdges.forEach((edge) => {
        const from = positions.get(edge.from || edge.fromLabel);
        const to = positions.get(edge.to || edge.toLabel);
        if (!from || !to) return;
        const path = layoutId === "left-right"
          ? `M${from.x + from.width} ${from.y + from.height / 2} H${(from.x + from.width + to.x) / 2} V${to.y + to.height / 2} H${to.x - 5}`
          : `M${from.x + from.width / 2} ${from.y + from.height} V${(from.y + from.height + to.y) / 2} H${to.x + to.width / 2} V${to.y - 5}`;
        art += `<path d="${path}" stroke="${secondary}" stroke-width="2.5" fill="none" marker-end="url(#${uid}-arrow)"/>`;
      });
      nodes.forEach((node, index) => {
        const position = positions.get(node.label);
        if (position) art += nodeCard(position.x, position.y, position.width, position.height, node, index);
      });
    } else if (typeId === "timeline") {
      const count = Math.min(nodes.length, 5);
      art += `<path d="M70 228 H690" stroke="${support}" stroke-width="10" stroke-linecap="round"/><path d="M70 228 H690" stroke="${secondary}" stroke-width="3" stroke-linecap="round" marker-end="url(#${uid}-arrow)"/>`;
      nodes.slice(0, count).forEach((node, index) => {
        const x = 86 + index * (588 / Math.max(1, count - 1));
        const top = index % 2 === 0;
        art += `<line x1="${x}" y1="228" x2="${x}" y2="${top ? 178 : 276}" stroke="${nodeStroke(index)}" stroke-width="2"/><circle cx="${x}" cy="228" r="${isFocused(index) ? 11 : 8}" fill="${nodeFill(index)}" stroke="${nodeStroke(index)}" stroke-width="3"/>`;
        art += `<text x="${x}" y="${top ? 153 : 304}" text-anchor="middle" fill="${ink}" font-family="Pretendard, Arial, sans-serif" font-size="12" font-weight="800">${escapeXml(shortLabel(node.label, 11))}</text>`;
        if (node.date || node.value) art += `<text x="${x}" y="${top ? 171 : 321}" text-anchor="middle" fill="${secondary}" font-family="Pretendard, Arial, sans-serif" font-size="11" font-weight="700">${escapeXml(shortLabel(node.date || `${node.value}${node.unit || ""}`, 12))}</text>`;
      });
    } else if (typeId === "comparison") {
      const cards = nodes.slice(0, 4);
      cards.forEach((node, index) => {
        const x = 44 + (index % 2) * 340;
        const y = 105 + Math.floor(index / 2) * 130;
        art += nodeCard(x, y, 312, 104, node, index, `<rect x="${x}" y="${y}" width="8" height="104" rx="4" fill="${isFocused(index) ? accent : secondary}"/>`);
      });
    } else if (typeId === "matrix") {
      const labels = nodes.slice(0, 4);
      const matrix = getMatrixSpec(labels, {
        xAxis: options.matrixXAxis,
        yAxis: options.matrixYAxis,
      });
      const targetPlacement = matrix.placements.find((placement) => placement.nodeId === targetId || placement.nodeLabel === targetId);
      const frames = new Map(matrix.quadrants.map((quadrant) => [quadrant.id, {
        ...quadrant,
        x: quadrant.column === 0 ? 165 : 400,
        y: quadrant.row === 0 ? 105 : 227.5,
        width: 235,
        height: 122.5,
        cx: quadrant.column === 0 ? 282.5 : 517.5,
        cy: quadrant.row === 0 ? 176 : 298,
      }]));
      art += `<rect x="165" y="105" width="470" height="245" rx="${radius}" fill="${surface}" stroke="${secondary}" stroke-width="${strokeWidth}"/>`;
      matrix.quadrants.forEach((quadrant) => {
        const frame = frames.get(quadrant.id);
        const focused = targetPlacement?.quadrantId === quadrant.id;
        if (focused) art += `<rect x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" fill="${accent}" opacity="0.10" stroke="${accent}" stroke-width="2.5"/>`;
        art += `<text x="${frame.x + 10}" y="${frame.y + 18}" fill="${focused ? accent : secondary}" font-family="Pretendard, Arial, sans-serif" font-size="10" font-weight="850">${escapeXml(quadrant.label)}</text>`;
      });
      art += `<line x1="400" y1="105" x2="400" y2="350" stroke="${secondary}" stroke-width="${strokeWidth}"/><line x1="165" y1="227.5" x2="635" y2="227.5" stroke="${secondary}" stroke-width="${strokeWidth}"/>`;
      art += `<path d="M165 366 H652" stroke="${secondary}" stroke-width="2" fill="none" marker-end="url(#${uid}-arrow)"/><path d="M149 350 V92" stroke="${secondary}" stroke-width="2" fill="none" marker-end="url(#${uid}-arrow)"/>`;
      art += `<text x="400" y="402" text-anchor="middle" fill="${ink}" font-family="Pretendard, Arial, sans-serif" font-size="12" font-weight="850">${escapeXml(matrix.axes.x.label)}</text><text x="165" y="385" fill="${secondary}" font-family="Pretendard, Arial, sans-serif" font-size="10" font-weight="700">${escapeXml(matrix.axes.x.lowLabel)}</text><text x="635" y="385" text-anchor="end" fill="${secondary}" font-family="Pretendard, Arial, sans-serif" font-size="10" font-weight="700">${escapeXml(matrix.axes.x.highLabel)}</text>`;
      art += `<text x="78" y="228" text-anchor="middle" transform="rotate(-90 78 228)" fill="${ink}" font-family="Pretendard, Arial, sans-serif" font-size="12" font-weight="850">${escapeXml(matrix.axes.y.label)}</text><text x="132" y="350" text-anchor="end" fill="${secondary}" font-family="Pretendard, Arial, sans-serif" font-size="10" font-weight="700">${escapeXml(matrix.axes.y.lowLabel)}</text><text x="132" y="108" text-anchor="end" fill="${secondary}" font-family="Pretendard, Arial, sans-serif" font-size="10" font-weight="700">${escapeXml(matrix.axes.y.highLabel)}</text>`;
      const placementsByQuadrant = new Map(matrix.quadrants.map((quadrant) => [quadrant.id, []]));
      matrix.placements.forEach((placement) => placementsByQuadrant.get(placement.quadrantId)?.push(placement));
      matrix.quadrants.forEach((quadrant) => {
        const frame = frames.get(quadrant.id);
        const placements = placementsByQuadrant.get(quadrant.id) || [];
        const cardHeight = Math.max(28, Math.min(48, 94 / Math.max(1, placements.length)));
        placements.forEach((placement, placementIndex) => {
          const nodeIndex = labels.findIndex((node) => node.id === placement.nodeId);
          const node = labels[nodeIndex];
          if (!node) return;
          const y = frame.cy + 8 + (placementIndex - (placements.length - 1) / 2) * (cardHeight + 4);
          const focused = isFocused(nodeIndex);
          art += `<rect x="${frame.cx - 91}" y="${y - cardHeight / 2}" width="182" height="${cardHeight}" rx="${Math.min(radius, 11)}" fill="${nodeFill(nodeIndex)}" stroke="${nodeStroke(nodeIndex)}" stroke-width="${focused ? Math.max(3, strokeWidth + 1) : strokeWidth}" filter="url(#${uid}-shadow)"/><text x="${frame.cx}" y="${y + 4}" text-anchor="middle" fill="${nodeText(nodeIndex)}" font-family="Pretendard, Arial, sans-serif" font-size="12" font-weight="800">${escapeXml(shortLabel(node.label, 16))}</text>`;
        });
      });
    } else if (typeId === "cycle") {
      const count = Math.min(nodes.length, 6);
      const cx = 380;
      const cy = 238;
      const radiusOrbit = 128;
      nodes.slice(0, count).forEach((node, index) => {
        const angle = -Math.PI / 2 + index * (Math.PI * 2 / count);
        const nextAngle = -Math.PI / 2 + ((index + 1) % count) * (Math.PI * 2 / count);
        const x = cx + Math.cos(angle) * radiusOrbit;
        const y = cy + Math.sin(angle) * radiusOrbit;
        const nx = cx + Math.cos(nextAngle) * radiusOrbit;
        const ny = cy + Math.sin(nextAngle) * radiusOrbit;
        art += `<path d="M${x} ${y} Q${cx} ${cy} ${nx} ${ny}" stroke="${secondary}" stroke-width="3" fill="none" marker-end="url(#${uid}-arrow)" opacity="0.75"/>`;
        art += `<rect x="${x - 62}" y="${y - 26}" width="124" height="52" rx="${radius}" fill="${nodeFill(index)}" stroke="${nodeStroke(index)}" stroke-width="${isFocused(index) ? 3 : 1.5}" filter="url(#${uid}-shadow)"/><text x="${x}" y="${y + 5}" text-anchor="middle" fill="${nodeText(index)}" font-family="Pretendard, Arial, sans-serif" font-size="12" font-weight="800">${escapeXml(shortLabel(node.label, 11))}</text>`;
      });
      art += `<circle cx="${cx}" cy="${cy}" r="48" fill="${background}" stroke="${secondary}" stroke-width="2" stroke-dasharray="5 6"/>`;
    } else if (typeId === "funnel") {
      const count = Math.min(nodes.length, 5);
      nodes.slice(0, count).forEach((node, index) => {
        const topWidth = 560 - index * 74;
        const bottomWidth = 560 - (index + 1) * 74;
        const y = 102 + index * 55;
        const xTop = 380 - topWidth / 2;
        const xBottom = 380 - bottomWidth / 2;
        const fill = isFocused(index) ? accent : index % 2 ? secondary : support;
        const textColor = isFocused(index) || index % 2 ? "#ffffff" : ink;
        art += `<path d="M${xTop} ${y} H${xTop + topWidth} L${xBottom + bottomWidth} ${y + 48} H${xBottom} Z" fill="${fill}" stroke="${background}" stroke-width="3" filter="url(#${uid}-shadow)"/><text x="380" y="${y + 29}" text-anchor="middle" fill="${textColor}" font-family="Pretendard, Arial, sans-serif" font-size="13" font-weight="850">${escapeXml(shortLabel(node.label, 18))}${node.value ? ` · ${escapeXml(shortLabel(`${node.value}${node.unit || ""}`, 12))}` : ""}</text>`;
      });
    } else {
      const count = Math.min(nodes.length, 7);
      const indexByLabel = new Map(nodes.map((node, index) => [node.label, index]));
      const visibleEdges = sourceEdges.filter((edge) => indexByLabel.has(edge.from || edge.fromLabel) && indexByLabel.has(edge.to || edge.toLabel));
      const degrees = new Map(nodes.map((node) => [node.label, 0]));
      visibleEdges.forEach((edge) => {
        const from = edge.from || edge.fromLabel;
        const to = edge.to || edge.toLabel;
        degrees.set(from, (degrees.get(from) || 0) + 1);
        degrees.set(to, (degrees.get(to) || 0) + 1);
      });
      const centerNode = [...nodes].sort((a, b) => (degrees.get(b.label) || 0) - (degrees.get(a.label) || 0))[0] || nodes[0];
      const orbitNodes = nodes.filter((node) => node !== centerNode);
      const positions = new Map([[centerNode?.label, { x: 380, y: 228 }]]);
      orbitNodes.forEach((node, orbitIndex) => {
        const angle = -Math.PI / 2 + orbitIndex * (Math.PI * 2 / Math.max(1, orbitNodes.length));
        positions.set(node.label, { x: 380 + Math.cos(angle) * 245, y: 228 + Math.sin(angle) * 122 });
      });
      visibleEdges.forEach((edge) => {
        const fromLabel = edge.from || edge.fromLabel;
        const toLabel = edge.to || edge.toLabel;
        const from = positions.get(fromLabel);
        const to = positions.get(toLabel);
        if (!from || !to) return;
        const relatedFocus = [fromLabel, toLabel].some((label) => nodes[indexByLabel.get(label)]?.id === targetId);
        art += `<path d="M${from.x} ${from.y} L${to.x} ${to.y}" stroke="${relatedFocus ? markerColor : secondary}" stroke-width="${relatedFocus ? 4 : 2}" fill="none" marker-end="url(#${uid}-arrow)" opacity="0.85"/>`;
      });
      nodes.forEach((node, index) => {
        const position = positions.get(node.label);
        if (!position) return;
        if (node === centerNode) {
          art += nodeCard(position.x - 80, position.y - 38, 160, 76, node, index);
        } else {
          art += `<rect x="${position.x - 57}" y="${position.y - 25}" width="114" height="50" rx="${radius}" fill="${nodeFill(index)}" stroke="${nodeStroke(index)}" stroke-width="${isFocused(index) ? 3 : 1.5}" filter="url(#${uid}-shadow)"/><text x="${position.x}" y="${position.y + 5}" text-anchor="middle" fill="${nodeText(index)}" font-family="Pretendard, Arial, sans-serif" font-size="12" font-weight="800">${escapeXml(shortLabel(node.label, 9))}</text>`;
        }
      });
    }

    return `<svg viewBox="0 0 760 430" role="img" aria-label="${escapeXml(getType(typeId).label)} 예상 구성" xmlns="http://www.w3.org/2000/svg">${defs}<rect width="760" height="430" fill="url(#${uid}-bg)"/>${backgroundExtras}${header}${art}</svg>`;
  }

  function scoreMatches() {
    const selectedPalette = getPalette();
    return catalog.matchPresets
      .filter((preset) => preset.type === state.type)
      .map((preset) => {
        const presetPalette = getPalette(preset.palette);
        let score = 0;
        if (preset.visual === state.visual) score += 30;
        if (preset.layout === state.layout) score += 25;
        if (preset.density === state.density) score += 15;
        if (preset.emphasis === state.emphasis) score += 15;
        if (preset.palette === state.palette) score += 10;
        else if (presetPalette.family === selectedPalette.family) score += 6;
        if (preset.purposes.includes(state.purpose)) score += 5;
        return { ...preset, score };
      })
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "ko"));
  }

  function matchLabels(match) {
    return [
      getType(match.type).label,
      getLayout(match.layout).label,
      getVisualStyle(match.visual).label,
      getPalette(match.palette).label,
      getEmphasis(match.emphasis).label,
    ];
  }

  function renderMatches() {
    const matches = scoreMatches();
    const best = matches[0];
    if (!best) return;
    const matchNodes = parsedData.nodes.length
      ? parsedData.nodes
      : getType(best.type).sample.map((label, index) => ({ id: `match-${index}`, label, value: "", unit: "", highlighted: index === 0 }));
    const matchTarget = getResolvedTarget(matchNodes)?.id || matchNodes[0]?.id;
    $("diagramMatchScore").textContent = `설정 일치도 ${best.score}%`;
    $("diagramBestMatch").replaceChildren();
    const art = document.createElement("div");
    art.className = "diagram-match-art";
    art.innerHTML = renderDiagramSvg({ type: best.type, layout: best.layout, visual: best.visual, palette: best.palette, emphasis: best.emphasis, nodes: matchNodes, edges: parsedData.edges, targetId: matchTarget, title: state.title || best.title });
    const copy = document.createElement("div");
    copy.className = "diagram-match-copy";
    const title = document.createElement("strong");
    title.textContent = best.title;
    const summary = document.createElement("p");
    summary.textContent = best.summary;
    copy.append(title, summary);
    $("diagramBestMatch").append(art, copy);

    $("diagramMatchTags").replaceChildren(...matchLabels(best).map((label) => {
      const tag = document.createElement("span");
      tag.textContent = label;
      return tag;
    }));

    const alternatives = matches.slice(1, 3).map((match) => {
      const card = document.createElement("article");
      card.className = "diagram-alt-card";
      const altArt = document.createElement("div");
      altArt.className = "diagram-match-art";
      const altNodes = parsedData.nodes.length
        ? parsedData.nodes
        : getType(match.type).sample.map((label, index) => ({ id: `alt-${match.id}-${index}`, label, value: "", unit: "", highlighted: index === 0 }));
      altArt.innerHTML = renderDiagramSvg({ type: match.type, layout: match.layout, visual: match.visual, palette: match.palette, emphasis: match.emphasis, nodes: altNodes, edges: parsedData.edges, targetId: getResolvedTarget(altNodes)?.id || altNodes[0]?.id, title: state.title || match.title });
      const name = document.createElement("strong");
      name.textContent = match.title;
      const score = document.createElement("small");
      score.textContent = `설정 일치도 ${match.score}% · ${getLayout(match.layout).label}`;
      const apply = document.createElement("button");
      apply.type = "button";
      apply.textContent = "이 스타일로 적용";
      apply.dataset.diagramMatchId = match.id;
      apply.addEventListener("click", () => applyMatch(match));
      card.append(altArt, name, score, apply);
      return card;
    });
    $("diagramAlternativeMatches").replaceChildren(...alternatives);
  }

  function applyMatch(match) {
    state.visual = match.visual;
    state.layout = match.layout;
    state.palette = match.palette;
    state.paletteManual = true;
    state.density = match.density;
    state.emphasis = match.emphasis;
    applyStateToFields();
    updateAll();
    setMessage(`${match.title} 예상 구성을 적용했습니다.`);
  }

  function renderPreview() {
    const preview = $("diagramLivePreview");
    if (preview) preview.innerHTML = renderDiagramSvg();
    const type = getType();
    const target = getResolvedTarget();
    const hasUserData = parsedData.nodes.length > 0;
    const visibleCount = Math.min(parsedData.nodes.length, getTypeCapacity());
    const scope = hasUserData
      ? `${parsedData.nodes.length}개 항목 중 ${visibleCount}개와 ${parsedData.edges.length}개 관계`
      : "예시 항목";
    const styleContract = getSlideStyleContract();
    const styleLabel = styleContract ? `${getVisualStyle().label} + ${styleContract.nameKo} DNA` : getVisualStyle().label;
    $("diagramPreviewSummary").innerHTML = `<strong>${escapeXml(type.label)} · ${escapeXml(getLayout().label)}</strong><br>${scope}를 ${escapeXml(styleLabel)}으로 구성하고, ${escapeXml(target?.label || "핵심 항목")}을 ${escapeXml(getEmphasis().label)} 방식으로 강조합니다.`;
    renderMatches();
  }

  function renderDataSummary() {
    const summary = $("diagramDataSummary");
    if (!summary) return;
    if (!parsedData.nodes.length) {
      summary.textContent = "데이터를 입력하면 항목·관계·단위를 분석합니다.";
      return;
    }
    const parts = [`항목 ${parsedData.nodes.length}개`, `관계 ${parsedData.edges.length}개`];
    if (parsedData.units.length) parts.push(`단위 ${parsedData.units.join(", ")}`);
    const diagnostics = getActiveDiagnostics();
    const errorCount = diagnostics.filter((item) => item.severity === "error").length;
    const warningCount = diagnostics.filter((item) => item.severity === "warning").length;
    if (errorCount) parts.push(`오류 ${errorCount}건`);
    if (warningCount) parts.push(`주의 ${warningCount}건`);
    summary.textContent = parts.join(" · ");
  }

  function renderRecommendation() {
    const recommendation = getType(parsedData.recommendation);
    const current = getType();
    const prefix = state.typeAuto ? "자동 추천 적용" : "자동 추천";
    $("diagramStructureRecommendation").innerHTML = `<strong>${prefix}: ${escapeXml(recommendation.label)}</strong> · ${escapeXml(recommendation.desc)}${state.typeAuto || recommendation.id === current.id ? "" : ` · 현재 선택: ${escapeXml(current.label)}`}`;
  }

  function readinessChecks() {
    const relationRequired = ["hierarchy", "network"].includes(state.type);
    const capacity = getTypeCapacity();
    const errors = getActiveDiagnostics().filter((item) => item.severity === "error");
    return [
      { pass: parsedData.nodes.length >= 2, label: "데이터 항목", help: "서로 비교하거나 연결할 항목을 2개 이상 입력하세요." },
      { pass: parsedData.nodes.length <= capacity, label: "미리보기 표시 범위", help: `${getType().label}는 한 이미지에 최대 ${capacity}개 항목을 표시합니다. 데이터를 나누거나 다른 유형을 선택하세요.` },
      { pass: !relationRequired || parsedData.edges.length > 0, label: "관계 데이터", help: `${getType().label}에는 상위항목 또는 시작·도착 관계가 필요합니다.` },
      { pass: errors.length === 0, label: "데이터 일관성", help: errors.map((item) => item.message).join(" · ") || "중복·연결·비교 단위 상태를 확인하세요." },
      { pass: Boolean(state.title.trim()), label: "다이어그램 제목", help: "최종 이미지에 사용할 제목을 입력하세요." },
    ];
  }

  function renderReadiness() {
    const checks = readinessChecks();
    const missing = checks.filter((check) => !check.pass).length;
    const warnings = getActiveDiagnostics().filter((item) => item.severity === "warning");
    const visibleChecks = missing ? checks : [{
      pass: true,
      label: "검증 기준",
      success: "데이터·표시 범위·관계·일관성·제목 5개 기준을 모두 통과했습니다.",
    }, ...warnings.map((warning) => ({ pass: true, warning: true, label: "검토 권장", success: warning.message }))];
    $("diagramReadinessList").replaceChildren(...visibleChecks.map((check) => {
      const item = document.createElement("li");
      item.className = check.warning ? "is-warning" : check.pass ? "is-ready" : "needs-input";
      const badge = document.createElement("span");
      badge.textContent = check.warning ? "주의" : check.pass ? "완료" : "보완";
      const text = document.createElement("div");
      text.textContent = check.pass ? check.success || `${check.label}이(가) 현재 설정에 반영되었습니다.` : check.help;
      item.append(badge, text);
      return item;
    }));
    const badge = $("diagramReadinessBadge");
    badge.textContent = missing ? `입력 보완 ${missing}건` : warnings.length ? `준비 완료 · 주의 ${warnings.length}건` : "프롬프트 준비 완료";
    badge.classList.toggle("is-ready", missing === 0);
  }

  function renderProductionStatus() {
    const hasData = parsedData.nodes.length >= 2;
    const capacity = getTypeCapacity();
    const withinCapacity = parsedData.nodes.length <= capacity;
    const hash = getSourceHash();
    const sourceBadge = $("diagramSourceBadge");
    const sourceChanged = Boolean(hasData && lastProducedHash && lastProducedHash !== hash);
    if (sourceBadge) {
      sourceBadge.textContent = hasData ? `${sourceChanged ? "원본 변경" : "원본"} ${hash.slice(7, 19)}` : "원본 지문 대기";
      sourceBadge.classList.toggle("is-changed", sourceChanged);
    }
    const capacityBadge = $("diagramCapacityBadge");
    if (capacityBadge) {
      capacityBadge.textContent = `표시 ${Math.min(parsedData.nodes.length, capacity)}/${capacity}`;
      capacityBadge.classList.toggle("is-over", !withinCapacity);
    }
    ["diagramDownloadSvgBtn", "diagramDownloadPngBtn", "diagramDownloadSpecBtn"].forEach((id) => {
      if ($(id)) $(id).disabled = !hasData;
    });
    const sendButton = $("diagramSendSlideImageBtn");
    const isStatic = Boolean(window.PROMPTDECK_STATIC_MODE);
    const hasGenerationBridge = typeof window.PromptDeckSlideImageGeneration?.loadPayload === "function";
    const ready = readinessChecks().every((check) => check.pass);
    if (sendButton) {
      sendButton.disabled = !ready || isStatic || !hasGenerationBridge;
      sendButton.title = isStatic
        ? "정적 배포판에서는 이미지 생성 서버를 사용할 수 없습니다."
        : !hasGenerationBridge ? "이미지 생성 모듈을 사용할 수 없습니다." : !ready ? "입력 준비 상태를 먼저 완료하세요." : "";
    }
    const hint = $("diagramProductionHint");
    if (!hint) return;
    if (isStatic) hint.textContent = "SVG·PNG·JSON 저장은 사용할 수 있습니다. 이미지 생성 연결은 로컬 서버판에서 지원합니다.";
    else if (!hasGenerationBridge) hint.textContent = "내보내기는 사용할 수 있지만 이미지 생성 모듈이 연결되지 않았습니다.";
    else if (!ready) hint.textContent = "입력 준비 상태를 완료하면 동일한 원본 지문과 프롬프트를 이미지 생성 탭으로 보낼 수 있습니다.";
    else hint.textContent = "현재 원본 지문을 보존한 채 파일로 저장하거나 이미지 생성 탭으로 보낼 수 있습니다.";
  }

  function setResultView(view) {
    activeResult = ["expected", "spec", "prompt"].includes(view) ? view : "expected";
    const panelByView = {
      expected: $("diagramExpectedPanel"),
      spec: $("diagramSpecPanel"),
      prompt: $("diagramPromptPanel"),
    };
    Object.entries(panelByView).forEach(([key, panel]) => {
      panel.hidden = key !== activeResult;
    });
    document.querySelectorAll("[data-diagram-result]").forEach((button) => {
      const selected = button.dataset.diagramResult === activeResult;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-selected", String(selected));
    });
  }

  function updateAll({ reparse = false } = {}) {
    syncStateFromFields();
    if (reparse) {
      parsedData = parseData(state.rawData);
      if (state.typeAuto && parsedData.nodes.length) {
        state.type = parsedData.recommendation;
        const recommended = getType();
        state.layout = recommended.defaultLayout;
        state.emphasis = recommended.defaultEmphasis;
      }
    }
    renderDataSummary();
    renderRecommendation();
    renderTypeGrid();
    renderLayoutGrid();
    renderMatrixSettings();
    renderVisualGrid();
    renderPaletteGrid();
    renderSlideStyleGallery();
    renderSlideStyleDialog();
    renderEmphasisGrid();
    renderEmphasisTargets();
    $("diagramEmphasisIntensityValue").textContent = INTENSITY_LABELS[state.emphasisIntensity];
    renderReadiness();
    renderProductionStatus();
    renderPreview();
    const spec = createDiagramSpec();
    $("diagramSpecPreview").textContent = JSON.stringify(spec, null, 2);
    const prompt = buildPrompt();
    $("diagramPromptPreview").value = prompt;
    $("diagramPromptBadge").textContent = parsedData.nodes.length ? `${parsedData.nodes.length}개 항목 · ${prompt.length.toLocaleString("ko-KR")}자` : "입력 대기";
    saveState();
    window.PromptDeckTabs?.syncHeaderActionStates?.();
  }

  function setMessage(message, isError = false) {
    const element = $("diagramMessage");
    if (!element) return;
    element.textContent = message;
    element.style.color = isError ? "#c2413b" : "";
  }

  async function copyText(value, successMessage) {
    const text = String(value || "").trim();
    if (!text) {
      setMessage("복사할 내용이 없습니다.", true);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setMessage(successMessage);
  }

  function safeFilename(extension) {
    const base = (state.title || "data-diagram")
      .normalize("NFKC")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "data-diagram";
    return `${base}.${extension}`;
  }

  function renderExportSvg() {
    const [width, height] = CANVAS_EXPORT_SIZES[state.canvas] || CANVAS_EXPORT_SIZES[DEFAULT_STATE.canvas];
    const source = renderDiagramSvg();
    const inner = source.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
    const scale = Math.min(width / 760, height / 430);
    const contentWidth = 760 * scale;
    const contentHeight = 430 * scale;
    const x = (width - contentWidth) / 2;
    const y = (height - contentHeight) / 2;
    const background = getEffectivePalette().colors[3] || "#ffffff";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(state.title || "데이터 다이어그램")}"><rect width="${width}" height="${height}" fill="${escapeXml(background)}"/><g transform="translate(${x} ${y}) scale(${scale})">${inner}</g></svg>`;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function markProduced(message) {
    lastProducedHash = getSourceHash();
    renderProductionStatus();
    setMessage(message);
  }

  function downloadSvg() {
    downloadBlob(new Blob([renderExportSvg()], { type: "image/svg+xml;charset=utf-8" }), safeFilename("svg"));
    markProduced("현재 출력 규격의 SVG 파일을 저장했습니다.");
  }

  function downloadSpec() {
    const json = `${JSON.stringify(createDiagramSpec(), null, 2)}\n`;
    downloadBlob(new Blob([json], { type: "application/json;charset=utf-8" }), safeFilename("json"));
    markProduced("DiagramSpec v2 JSON 파일을 저장했습니다.");
  }

  function downloadPng() {
    const svg = renderExportSvg();
    const [width, height] = CANVAS_EXPORT_SIZES[state.canvas] || CANVAS_EXPORT_SIZES[DEFAULT_STATE.canvas];
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) {
            setMessage("PNG 파일을 만들지 못했습니다.", true);
            return;
          }
          downloadBlob(blob, safeFilename("png"));
          markProduced(`${width.toLocaleString("ko-KR")}×${height.toLocaleString("ko-KR")} PNG 파일을 저장했습니다.`);
        }, "image/png");
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setMessage("SVG를 PNG로 변환하지 못했습니다.", true);
    };
    image.src = url;
  }

  function getGenerationPayload() {
    const spec = createDiagramSpec();
    return {
      slideId: slug(state.title || "data-diagram", 0),
      title: state.title || "데이터 다이어그램",
      prompt: buildPrompt(),
      generationPath: spec.generation.path,
      targetModel: spec.generation.targetModel,
      contractVersion: spec.generation.contractVersion,
      outputMode: spec.generation.outputMode,
      sourceHash: spec.source.hash,
      diagramSpec: spec,
      sourceKey: "dataDiagram",
    };
  }

  function sendToSlideImage() {
    if (window.PROMPTDECK_STATIC_MODE) {
      setMessage("정적 배포판에서는 이미지 생성 서버를 사용할 수 없습니다. SVG·PNG·JSON 저장을 이용하세요.", true);
      return;
    }
    const bridge = window.PromptDeckSlideImageGeneration;
    if (typeof bridge?.loadPayload !== "function") {
      setMessage("이미지 생성 모듈이 연결되지 않았습니다.", true);
      return;
    }
    const payload = getGenerationPayload();
    const loaded = bridge.loadPayload(payload, { message: `${payload.title} 다이어그램 프롬프트와 원본 지문을 가져왔습니다.` });
    if (!loaded) return;
    lastProducedHash = payload.sourceHash;
    window.PromptDeckTabs?.switchTab?.("slideImage");
  }

  function openMobileStep(stepKey, { scroll = false, toggle = false } = {}) {
    if (!window.matchMedia("(max-width: 720px)").matches) return;
    const target = document.querySelector(`#paneDataDiagram [data-diagram-step="${stepKey}"]`);
    const collapseTarget = Boolean(toggle && target?.classList.contains("is-open"));
    document.querySelectorAll("#paneDataDiagram [data-diagram-step]").forEach((step) => {
      const open = !collapseTarget && step.dataset.diagramStep === stepKey;
      step.classList.toggle("is-open", open);
      const toggle = step.querySelector(".diagram-step-toggle");
      toggle?.setAttribute("aria-expanded", String(open));
      if (toggle) {
        const title = step.querySelector("h3")?.textContent || "단계";
        toggle.setAttribute("aria-label", `${title} 단계 ${open ? "접기" : "펼치기"}`);
      }
      if (open && scroll) step.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function fillSample() {
    state.title = "지역기업 해외진출 지원 퍼널";
    state.purpose = "proposal";
    state.canvas = DEFAULT_STATE.canvas;
    state.rawData = [
      "단계\t수치\t단위\t설명\t강조",
      "참여기업 모집\t120\t개사\t해외진출 희망기업 모집\t",
      "수출상담 지원\t64\t개사\t시장·바이어 맞춤 상담\t",
      "계약 협의\t28\t개사\t견적 및 조건 협의 진행\t",
      "수출계약 체결\t12\t개사\t최종 계약 성과\t강조",
    ].join("\n");
    state.type = "funnel";
    state.typeAuto = false;
    state.layout = "top-down";
    state.visual = "corporate";
    state.palette = "impact-orange";
    state.paletteManual = true;
    state.density = "balanced";
    state.textMode = "hybrid";
    state.emphasis = "outcome";
    state.emphasisTarget = "auto";
    state.emphasisIntensity = 3;
    state.exclusions = "모든 기업 수와 단위를 원본 그대로 유지하고, 확인되지 않은 전환율을 추가하지 않는다.";
    applyStateToFields();
    parsedData = parseData(state.rawData);
    updateAll();
    setMessage("샘플 데이터를 채우고 예상 이미지를 매칭했습니다.");
  }

  function reset() {
    Object.assign(state, DEFAULT_STATE);
    lastProducedHash = "";
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    parsedData = emptyParsedData();
    applyStateToFields();
    updateAll();
    setResultView("expected");
    setMessage("데이터 다이어그램 설정을 초기화했습니다.");
  }

  function bindSlideStyleDialog() {
    $("diagramOpenSlideStyleGalleryBtn")?.addEventListener("click", openSlideStyleDialog);
    document.querySelectorAll("[data-diagram-style-dialog-close]").forEach((button) => {
      button.addEventListener("click", closeSlideStyleDialog);
    });
    $("diagramSlideStyleDialog")?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) closeSlideStyleDialog();
    });
    $("diagramSlideStyleCategories")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-slide-style-category]");
      if (!button) return;
      slideStyleBrowser.category = button.dataset.slideStyleCategory || "all";
      slideStyleBrowser.visible = SLIDE_STYLE_BATCH_SIZE;
      renderSlideStyleDialog();
    });
    $("diagramSlideStyleSearch")?.addEventListener("input", (event) => {
      const input = event.currentTarget;
      window.clearTimeout(slideStyleSearchTimer);
      slideStyleSearchTimer = window.setTimeout(() => {
        slideStyleBrowser.query = input.value.trim();
        slideStyleBrowser.visible = SLIDE_STYLE_BATCH_SIZE;
        renderSlideStyleDialog();
      }, 120);
    });
    $("diagramSlideStyleSearchClear")?.addEventListener("click", () => {
      slideStyleBrowser.query = "";
      slideStyleBrowser.visible = SLIDE_STYLE_BATCH_SIZE;
      if ($("diagramSlideStyleSearch")) $("diagramSlideStyleSearch").value = "";
      renderSlideStyleDialog();
      $("diagramSlideStyleSearch")?.focus();
    });
    $("diagramSlideStyleLoadMoreBtn")?.addEventListener("click", () => {
      slideStyleBrowser.visible += SLIDE_STYLE_BATCH_SIZE;
      renderSlideStyleDialog();
    });
    $("diagramSlideStyleUseDefaultBtn")?.addEventListener("click", () => {
      state.slideStyleId = "";
      updateAll();
      setMessage("슬라이드 DNA 연결을 해제하고 다이어그램 기본 스타일을 적용했습니다.");
    });
    document.addEventListener("keydown", (event) => {
      const backdrop = $("diagramSlideStyleDialog");
      if (!backdrop || backdrop.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeSlideStyleDialog();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...backdrop.querySelectorAll("button:not([disabled]):not([hidden]), input:not([disabled])")]
        .filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  function bind() {
    bindSlideStyleDialog();
    [
      "diagramTitle",
      "diagramPurpose",
      "diagramCanvas",
      "diagramDensity",
      "diagramTextMode",
      "diagramSlideStyleScope",
      "diagramMatrixXAxis",
      "diagramMatrixYAxis",
      "diagramEmphasisTarget",
      "diagramEmphasisIntensity",
      "diagramExclusions",
      "diagramCustomBackground",
      "diagramCustomPrimary",
      "diagramCustomAccent",
    ].forEach((id) => {
      const input = $(id);
      input?.addEventListener("input", () => updateAll());
      input?.addEventListener("change", () => updateAll());
    });

    let dataInputTimer = 0;
    $("diagramDataInput")?.addEventListener("input", () => {
      window.clearTimeout(dataInputTimer);
      dataInputTimer = window.setTimeout(() => updateAll({ reparse: true }), 120);
    });
    $("diagramDataInput")?.addEventListener("change", () => updateAll({ reparse: true }));

    $("diagramDataFile")?.addEventListener("change", async (event) => {
      const file = event.currentTarget.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        $("diagramDataInput").value = text.replace(/^\uFEFF/, "");
        state.rawData = $("diagramDataInput").value;
        updateAll({ reparse: true });
        setMessage(`${file.name} 데이터를 불러왔습니다.`);
      } catch (_) {
        setMessage("CSV 파일을 읽지 못했습니다. UTF-8 파일인지 확인하세요.", true);
      } finally {
        event.currentTarget.value = "";
      }
    });

    document.querySelectorAll("[data-diagram-result]").forEach((button) => {
      button.addEventListener("click", () => setResultView(button.dataset.diagramResult));
    });
    $("diagramGeneratePromptBtn")?.addEventListener("click", () => {
      updateAll({ reparse: true });
      setResultView("prompt");
      setMessage("현재 데이터와 선택값으로 프롬프트를 확정했습니다.");
      if (window.matchMedia("(max-width: 720px)").matches) {
        $("diagramResultsTitle")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    $("diagramCopyPromptBtn")?.addEventListener("click", () => copyText($("diagramPromptPreview")?.value || buildPrompt(), "데이터 다이어그램 프롬프트를 복사했습니다."));
    $("diagramCopySpecBtn")?.addEventListener("click", () => copyText($("diagramSpecPreview")?.textContent, "구조 설계를 복사했습니다."));
    $("diagramDownloadSvgBtn")?.addEventListener("click", downloadSvg);
    $("diagramDownloadPngBtn")?.addEventListener("click", downloadPng);
    $("diagramDownloadSpecBtn")?.addEventListener("click", downloadSpec);
    $("diagramSendSlideImageBtn")?.addEventListener("click", sendToSlideImage);
    $("diagramSampleBtn")?.addEventListener("click", fillSample);
    $("diagramResetBtn")?.addEventListener("click", reset);

    document.querySelectorAll("#paneDataDiagram .diagram-step-toggle").forEach((button) => {
      button.addEventListener("click", () => openMobileStep(button.closest("[data-diagram-step]")?.dataset.diagramStep, { scroll: false, toggle: true }));
    });
    document.querySelectorAll("#paneDataDiagram [data-diagram-step-target]").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (!window.matchMedia("(max-width: 720px)").matches) return;
        event.preventDefault();
        openMobileStep(link.dataset.diagramStepTarget, { scroll: true });
      });
    });
    $("paneDataDiagram")?.querySelector("[data-diagram-result-jump]")?.addEventListener("click", (event) => {
      event.preventDefault();
      $("diagramResultsTitle")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  catalog.purposes.forEach((purpose) => {
    const option = document.createElement("option");
    option.value = purpose.id;
    option.textContent = purpose.label;
    $("diagramPurpose")?.appendChild(option);
  });
  loadState();
  applyStateToFields();
  parsedData = parseData(state.rawData);
  bind();
  updateAll();
  setResultView(activeResult);

  window.PromptDeckDataDiagram = {
    parseData,
    getState: () => ({ ...state }),
    getSpec: createDiagramSpec,
    buildPrompt,
    getGenerationPayload,
    getSourceHash,
    hashText: sha256,
    getTypeCapacity,
    getMatrixSpec,
    getDiagnostics: getActiveDiagnostics,
    scoreMatches,
    renderDiagramSvg,
    renderExportSvg,
  };
  window.PromptDeckPromptSources?.register?.("dataDiagram", {
    tabIds: ["tabBtnDataDiagram"],
    paneIds: ["paneDataDiagram"],
    getTitle: () => state.title || "데이터 다이어그램",
    getPrompt: buildPrompt,
    getSpec: createDiagramSpec,
    getGenerationPayload,
  });
})();
