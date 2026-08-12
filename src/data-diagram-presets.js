// 데이터 다이어그램 탭의 구조·비주얼·예상 이미지 매칭 카탈로그
(function () {
  const diagramTypes = [
    {
      id: "flow",
      label: "프로세스·플로",
      desc: "단계와 업무 흐름을 순서대로 전달",
      prompt: "Build a clear process flow with an unmistakable start, progression, and outcome.",
      layouts: ["left-right", "top-down", "stepped"],
      defaultLayout: "left-right",
      defaultEmphasis: "key-path",
      sample: ["현황 진단", "전략 수립", "사업 실행", "성과 확산"],
    },
    {
      id: "hierarchy",
      label: "계층도·조직도",
      desc: "상위 개념과 하위 조직·항목의 관계 표현",
      prompt: "Build a top-down hierarchy with clear parent-child relationships and balanced branching.",
      layouts: ["top-down", "left-right", "layered"],
      defaultLayout: "top-down",
      defaultEmphasis: "focus-node",
      sample: ["총괄 전략", "사업 기획", "기업 지원", "성과 관리", "운영 체계"],
    },
    {
      id: "timeline",
      label: "타임라인·로드맵",
      desc: "시점과 단계별 변화·계획을 시간축으로 표현",
      prompt: "Build a chronological roadmap with readable milestones, time labels, and a visible destination.",
      layouts: ["left-right", "top-down", "stepped"],
      defaultLayout: "left-right",
      defaultEmphasis: "outcome",
      sample: ["2026 준비", "2027 실증", "2028 확산", "2029 고도화"],
    },
    {
      id: "comparison",
      label: "비교·대조",
      desc: "대안·성과·범주의 차이를 나란히 비교",
      prompt: "Build a side-by-side comparison with consistent visual scales and directly comparable evidence blocks.",
      layouts: ["grid", "left-right", "layered"],
      defaultLayout: "grid",
      defaultEmphasis: "value-contrast",
      sample: ["기존 방식", "개선 방식", "핵심 차이", "기대 효과"],
    },
    {
      id: "matrix",
      label: "매트릭스",
      desc: "두 개의 기준축으로 항목을 분류하고 우선순위화",
      prompt: "Build a two-axis matrix with four clearly named quadrants and correctly positioned items.",
      layouts: ["grid"],
      defaultLayout: "grid",
      defaultEmphasis: "priority-zone",
      sample: ["즉시 추진", "전략 검토", "효율 개선", "장기 과제"],
    },
    {
      id: "cycle",
      label: "순환·라이프사이클",
      desc: "반복되는 단계와 피드백 구조를 원형으로 표현",
      prompt: "Build a continuous cycle with a clear reading direction and a visible feedback loop.",
      layouts: ["radial"],
      defaultLayout: "radial",
      defaultEmphasis: "key-path",
      sample: ["기획", "실행", "측정", "개선"],
    },
    {
      id: "funnel",
      label: "퍼널",
      desc: "단계별 축소·선별·전환 구조와 핵심 수치 표현",
      prompt: "Build a descending funnel whose stage widths and labels communicate progression without inventing proportions.",
      layouts: ["top-down", "left-right"],
      defaultLayout: "top-down",
      defaultEmphasis: "outcome",
      sample: ["지원기업 120", "상담기업 64", "계약협의 28", "수출계약 12"],
    },
    {
      id: "network",
      label: "관계망·생태계",
      desc: "기관·기업·자원 사이의 연결과 중심 주체 표현",
      prompt: "Build a hub-and-spoke ecosystem or relationship network with legible clusters and meaningful connections.",
      layouts: ["radial", "layered", "left-right"],
      defaultLayout: "radial",
      defaultEmphasis: "focus-node",
      sample: ["지원기관", "지역기업", "연구기관", "투자사", "수요기업", "시장"],
    },
  ];

  const layouts = [
    { id: "left-right", label: "좌 → 우", desc: "발표자료에서 가장 익숙한 진행 방향", prompt: "Use a left-to-right reading flow with generous spacing and clear connectors." },
    { id: "top-down", label: "상 → 하", desc: "계층과 단계 구분에 적합", prompt: "Use a top-to-bottom structure with clear levels and aligned branches." },
    { id: "radial", label: "중앙 확산·순환", desc: "생태계와 반복 구조에 적합", prompt: "Use a radial composition with a clear center, balanced orbit, and readable direction." },
    { id: "grid", label: "격자·매트릭스", desc: "비교와 분류를 안정적으로 표현", prompt: "Use a disciplined grid with equal modules, aligned labels, and directly comparable areas." },
    { id: "stepped", label: "계단형", desc: "성장과 로드맵을 상승 흐름으로 표현", prompt: "Use a stepped progression that communicates advancement without decorative exaggeration." },
    { id: "layered", label: "레이어 적층", desc: "구조·관계를 깊이감 있게 구분", prompt: "Use restrained layered planes to separate groups while keeping topology accurate." },
  ];

  const visualStrategies = [
    {
      id: "official",
      label: "공공 보고서형",
      desc: "절제된 선, 높은 가독성, 검증 가능한 정보 표현",
      prompt: "Use a restrained Korean public-sector report style with precise alignment, clean white space, flat vector shapes, and no decorative clutter.",
      defaultPalette: "gov-blue",
      purposes: ["report", "policy", "business-plan"],
    },
    {
      id: "consulting",
      label: "컨설팅 프레임워크형",
      desc: "강한 논리 위계와 핵심 결론 중심",
      prompt: "Use a polished strategy-consulting framework style with strong information hierarchy, modular cards, and an executive-ready focal conclusion.",
      defaultPalette: "mono-accent",
      purposes: ["business-plan", "proposal", "report"],
    },
    {
      id: "corporate",
      label: "기업 제안서형",
      desc: "설득력 있는 대비와 세련된 비즈니스 인상",
      prompt: "Use a premium corporate proposal style with crisp geometry, refined contrast, restrained depth, and persuasive visual pacing.",
      defaultPalette: "impact-orange",
      purposes: ["proposal", "business-plan"],
    },
    {
      id: "technical",
      label: "기술 아키텍처형",
      desc: "시스템·데이터 관계를 정밀하고 구조적으로 표현",
      prompt: "Use a technical architecture style with precise connectors, subtle grids, structured clusters, and calm data-oriented visual language.",
      defaultPalette: "tech-cyan",
      purposes: ["technology", "report"],
    },
    {
      id: "editorial",
      label: "에디토리얼 인포그래픽형",
      desc: "친근한 형태와 리듬으로 설명력을 강화",
      prompt: "Use an editorial infographic style with approachable shapes, controlled visual rhythm, generous breathing room, and clear storytelling.",
      defaultPalette: "growth-green",
      purposes: ["training", "policy", "proposal"],
    },
  ];

  const palettes = [
    { id: "gov-blue", label: "공공 블루", family: "cool", colors: ["#0f315d", "#2f6fb0", "#dbeaf7", "#f7fafc", "#f59e0b"], prompt: "Use deep navy for authority, clear blue for structure, pale blue-gray for groups, white for breathing room, and restrained amber only for the primary emphasis." },
    { id: "mono-accent", label: "모노톤 + 강조", family: "mono", colors: ["#172033", "#667085", "#e4e7ec", "#ffffff", "#e5484d"], prompt: "Use a neutral monochrome system and reserve one strong accent color exclusively for the key conclusion or path." },
    { id: "growth-green", label: "성장 그린", family: "natural", colors: ["#164e3b", "#2f855a", "#d9efe4", "#fbfdfb", "#d97706"], prompt: "Use deep green and sage for the structure, a light neutral background, and warm amber for the single priority point." },
    { id: "tech-cyan", label: "기술 시안·인디고", family: "cool", colors: ["#18264f", "#2563eb", "#22b8cf", "#eef6ff", "#f43f5e"], prompt: "Use indigo and cyan for technical layers, pale blue for containers, and a small coral accent for the most important node." },
    { id: "impact-orange", label: "성과 오렌지", family: "warm", colors: ["#253247", "#e36b2c", "#f6d4bd", "#fffaf7", "#167c80"], prompt: "Use charcoal for structure, warm orange for progress and outcomes, soft peach for secondary groups, and teal only as a supporting contrast." },
    { id: "categorical", label: "카테고리 구분형", family: "categorical", colors: ["#3157a4", "#168a7a", "#d97706", "#8b5cf6", "#e5484d"], prompt: "Use a controlled categorical palette with consistent category-color mapping and sufficient contrast; never color identical roles differently." },
    { id: "custom", label: "사용자 색상", family: "custom", colors: ["#17324d", "#3578b8", "#d8e8f5", "#ffffff", "#ff7a2f"], prompt: "Use the exact user-defined color roles and preserve readable contrast between background, nodes, connectors, labels, and emphasis." },
    { id: "ai", label: "AI 위임", family: "adaptive", colors: ["#20314a", "#4c78a8", "#dbe5ef", "#ffffff", "#f28e2b"], prompt: "Choose the most legible professional palette for the data meaning and output purpose. Use color by semantic role, not decoration, and keep one dominant emphasis color." },
  ];

  const emphasisTechniques = [
    { id: "focus-node", label: "핵심 노드", desc: "중요 항목 하나를 크기·색으로 부각", prompt: "Make the selected focal node visually dominant through controlled scale, accent color, and whitespace." },
    { id: "key-path", label: "핵심 경로", desc: "중요 흐름과 연결선을 연속적으로 강조", prompt: "Highlight the selected path with a consistent accent line and subdued secondary routes." },
    { id: "outcome", label: "최종 성과", desc: "마지막 결과와 수치를 결론으로 집중", prompt: "Make the final outcome the strongest conclusion using contrast, size, and a clear terminal position." },
    { id: "value-contrast", label: "수치 차이", desc: "가장 큰 변화와 비교값을 선명하게 표현", prompt: "Emphasize the most meaningful value difference without changing scale, proportion, or units." },
    { id: "priority-zone", label: "우선 영역", desc: "우선순위 구역을 면·테두리로 강조", prompt: "Highlight the priority zone with a restrained tinted area and a clear but non-alarmist boundary." },
    { id: "risk", label: "병목·위험", desc: "예외·위험 요소를 경고색과 콜아웃으로 표시", prompt: "Mark the selected bottleneck or risk with a compact callout and restrained warning color, without overwhelming the diagram." },
  ];

  const purposes = [
    { id: "business-plan", label: "사업계획서", prompt: "a business plan figure that explains the implementation logic and expected value" },
    { id: "report", label: "결과보고서", prompt: "a result-report figure that communicates verified structure and outcomes" },
    { id: "proposal", label: "제안 발표", prompt: "a persuasive proposal-slide visual understandable within three seconds" },
    { id: "policy", label: "정책 설명자료", prompt: "a public-policy explanatory figure with trustworthy and accessible information hierarchy" },
    { id: "technology", label: "기술·시스템 설명", prompt: "a technical system figure with accurate topology and relationship labels" },
    { id: "training", label: "교육·워크숍", prompt: "an educational infographic that supports step-by-step comprehension" },
  ];

  const strategyLayout = {
    official: 0,
    consulting: 0,
    corporate: 1,
    technical: 2,
    editorial: 0,
  };

  const matchPresets = diagramTypes.flatMap((type) => visualStrategies.map((strategy) => {
    const layoutIndex = type.id === "funnel"
      ? 0
      : Math.min(strategyLayout[strategy.id] || 0, type.layouts.length - 1);
    return {
      id: `${type.id}-${strategy.id}`,
      type: type.id,
      visual: strategy.id,
      layout: type.layouts[layoutIndex],
      palette: strategy.defaultPalette,
      emphasis: type.defaultEmphasis,
      density: strategy.id === "technical" ? "detailed" : strategy.id === "editorial" ? "minimal" : "balanced",
      purposes: strategy.purposes,
      title: `${type.label} · ${strategy.label}`,
      summary: `${strategy.desc}으로 ${type.desc}하는 예상 완성 구성`,
    };
  }));

  window.DATA_DIAGRAM_PRESETS = {
    diagramTypes,
    layouts,
    visualStrategies,
    palettes,
    emphasisTechniques,
    purposes,
    matchPresets,
  };
})();
