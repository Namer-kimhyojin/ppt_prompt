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
    {
      id: "raised-3d-site",
      label: "3D 대상지 리프트업",
      desc: "대상 구역만 낮은 입체 레이어로 들어 올림",
      prompt: "lift only the target district slightly as a low 3D raised layer, keeping all surrounding geography flat and accurate",
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
    "business-3d": "Use a restrained low-relief 3D business-plan map style: subtle extrusion, soft shadows, precise labels, and no cinematic exaggeration.",
    "isometric-3d": "Use a controlled isometric 3D map style to clarify the target site's relationship with surrounding roads, zones, and regional anchors.",
    "no-3d": "Avoid 3D, perspective distortion, extruded land, or cinematic map effects; prioritize geographic accuracy.",
  };

  const THREE_D_STYLE_PROMPTS = {
    none: "Do not use 3D effects; keep the map flat and report-like.",
    "raised-site": "Use a low raised-platform effect only on the target site, with a thin side face and soft shadow so the location is emphasized without altering boundaries.",
    "layered-terrain": "Represent terrain, influence zones, or administrative layers as shallow stacked translucent plates, while keeping roads and labels readable.",
    "extruded-district": "Render the target district as a low extruded block or beveled plate; the extrusion must follow the true target boundary and remain subtle.",
    "isometric-board": "Create an isometric board-map composition with a shallow viewing angle, clean edges, and presentation-ready depth.",
    ai: "Choose an appropriate 3D treatment only if it improves comprehension; otherwise keep the map flat. Never sacrifice geographic accuracy for visual drama.",
  };

  const CAMERA_PROMPTS = {
    "top-down": "Use a near top-down orthographic view; allow only very slight depth cues.",
    "low-isometric": "Use a low isometric angle that reveals shallow height while preserving readable geography.",
    "report-perspective": "Use a weak report-friendly perspective with minimal distortion and stable label alignment.",
    "no-perspective": "Minimize perspective distortion; keep proportions as close to the source map as possible.",
  };

  const TEXT_PRESETS = {
    mapReferencePreset: {
      targetId: "mapReferenceNote",
      presets: {
        "admin-road": "시·군 행정경계, 주요 도로, 하천, 주요 거점명이 표시된 기본 행정구역 지도입니다. 첨부 이미지에서 실제 지리 구조와 라벨 위치를 기준으로 대상 구역을 해석해주세요.",
        "marked-site": "사용자가 지도 위에 붉은 윤곽선 또는 표시로 강조한 영역이 대상 부지입니다. 표시된 경계와 주변 지형, 도로, 행정구역명을 우선 참고해주세요.",
        "satellite-site": "위성사진 또는 항공사진 기반의 위치도입니다. 실제 지형, 도로망, 하천, 건물 밀집도는 유지하되 사업계획서에 맞게 정돈된 지도 이미지로 재구성해주세요.",
        "transport-network": "고속도로, IC, 국도, 철도, 주요 간선도로 등 광역 교통망이 중심으로 표시된 지도입니다. 대상지와 교통축의 상대적 위치 관계를 정확히 유지해주세요.",
        "industrial-context": "주변 산업단지, 물류거점, 도시 중심지, 배후 생활권이 함께 표시된 권역도입니다. 대상지가 주변 거점과 어떤 관계에 있는지 읽을 수 있게 해석해주세요.",
        "urban-plan": "용도지역, 도시계획시설, 개발 예정지 또는 토지이용 구분이 표시된 계획도입니다. 실제 계획 경계와 색상 구분을 왜곡하지 말고 보고서용으로 정돈해주세요.",
        "business-plan-purpose": "사업계획서에 삽입할 입지 타당성 검토용 지도입니다. 첨부 이미지의 실제 지리 구조를 유지하면서 대상지, 접근축, 배후권역, 주변 거점을 사업 추진 근거로 읽을 수 있게 정리해주세요.",
        "result-report-purpose": "결과보고서에 삽입할 추진 결과 설명용 지도입니다. 사업 수행 범위, 완료 구역, 연계 거점, 주요 성과가 발생한 공간 범위를 명확히 보여주는 보고용 이미지로 정돈해주세요.",
        "proposal-purpose": "제안서 본문 또는 발표자료에 사용할 설득형 지도입니다. 제안 대상 구역과 주변 대안·경쟁 입지·핵심 거점의 관계가 한눈에 비교되도록 첨부 지도를 해석해주세요.",
      },
    },
    mapTargetPreset: {
      targetId: "mapTargetArea",
      presets: {
        "center-district": "지도 중앙부에 위치한 대상 부지를 강조합니다. 주변 행정구역과 주요 도로는 맥락 정보로 남기고, 대상지 경계가 가장 먼저 보이도록 처리해주세요.",
        "marked-boundary": "첨부 지도에서 사용자가 직접 표시한 경계선 내부를 강조합니다. 표시된 윤곽선을 실제 대상 구역으로 보고, 경계 밖의 지형이나 도로는 보조 정보로 유지해주세요.",
        "ic-corridor": "고속도로 IC 또는 주요 간선도로와 가까운 대상 구역을 강조합니다. 대상지와 IC, 국도, 산업도로 사이의 접근축이 한눈에 보이도록 표현해주세요.",
        "station-area": "철도역, 환승센터, 버스터미널 등 대중교통 결절부 주변 대상 구역을 강조합니다. 역세권 접근성과 보행·교통 연결성을 함께 드러내주세요.",
        "waterfront-zone": "하천, 호수, 해안, 항만 등 수변 자원과 인접한 대상 구역을 강조합니다. 수변축과 대상지의 위치 관계를 명확히 보여주세요.",
        "industrial-expansion": "기존 산업단지 또는 물류·제조 거점과 인접한 확장 후보지를 강조합니다. 기존 거점과 신규 대상지가 연계되는 구조가 보이도록 처리해주세요.",
        "business-core-site": "사업계획서에서 핵심 검토 대상이 되는 부지 또는 권역을 강조합니다. 대상지 경계, 진입 동선, 배후 수요권, 주요 인프라와의 관계가 사업 추진 논리로 이어지도록 보여주세요.",
        "result-completed-area": "결과보고서에서 실제 사업이 수행되었거나 성과가 발생한 완료 구역을 강조합니다. 추진 전후의 변화, 완료 범위, 주요 성과 지점이 과장 없이 확인되도록 표현해주세요.",
        "proposal-priority-area": "제안서에서 우선 추진 또는 전략적으로 제안하는 구역을 강조합니다. 여러 후보지 중 이 구역을 선택해야 하는 이유가 위치, 접근성, 연계성 측면에서 드러나게 처리해주세요.",
      },
    },
    mapContextPreset: {
      targetId: "mapContextInfo",
      presets: {
        accessibility: "대상지는 광역 교통망 접근성이 높고 주요 도로·IC·거점 도시와 연결되는 입지입니다. 사업계획서에서는 접근성, 이동 편의, 권역 연결성을 핵심 메시지로 강조해야 합니다.",
        "industrial-linkage": "대상지는 주변 산업단지, 물류거점, 기업 집적지와 연계 가능한 위치입니다. 기존 산업 기반과 신규 사업 부지가 연결되어 시너지와 확장성을 만든다는 메시지를 강조해야 합니다.",
        "balanced-development": "대상지는 지역 균형발전과 생활권 확장 측면에서 의미가 있는 위치입니다. 중심지와 주변 지역을 연결하고 낙후 지역의 성장 기반을 마련한다는 공공성을 강조해야 합니다.",
        "tourism-commerce": "대상지는 관광자원, 상권, 방문객 동선과 연결될 수 있는 위치입니다. 유입 동선, 주변 소비권, 체류·방문 활성화 가능성을 사업 메시지로 보여줘야 합니다.",
        "public-infra": "대상지는 공공시설, 생활 SOC, 교육·의료·문화 인프라와 연결되는 생활권 개선형 입지입니다. 주민 편의와 공공서비스 접근성 향상을 설득력 있게 강조해야 합니다.",
        "future-growth": "대상지는 향후 개발축, 신규 교통망, 배후 수요 확장과 연결될 성장 잠재지가 있는 위치입니다. 현재 입지뿐 아니라 미래 확장성과 단계적 개발 가능성을 함께 강조해야 합니다.",
        "business-feasibility": "사업계획 단계에서는 대상지의 입지 타당성, 추진 필요성, 접근성, 배후 수요, 주변 거점과의 연계가 핵심입니다. 지도 이미지는 왜 이 위치에서 사업을 추진해야 하는지 설득하는 근거로 기능해야 합니다.",
        "result-performance": "결과보고 단계에서는 사업의 수행 범위와 성과가 어디에서 발생했는지 명확히 전달하는 것이 중요합니다. 완료 구역, 개선된 연결축, 수혜 범위, 주요 성과 지점을 차분하고 검증 가능한 방식으로 보여줘야 합니다.",
        "proposal-differentiation": "제안서 단계에서는 제안 구역의 차별성, 실행 가능성, 경쟁 입지 대비 강점이 빠르게 이해되어야 합니다. 지도 이미지는 선택 이유와 기대효과를 한 장에서 설득하는 제안용 시각 자료가 되어야 합니다.",
      },
    },
  };

  const SAMPLE_SVGS = {
    none: `
      <svg viewBox="0 0 560 340" role="img" aria-label="평면 지도 샘플">
        <defs>
          <linearGradient id="flatWater" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#eaf6fb"/>
            <stop offset="1" stop-color="#d9ecf5"/>
          </linearGradient>
        </defs>
        <rect width="560" height="340" rx="22" fill="#f8fafc"/>
        <rect x="38" y="34" width="484" height="272" rx="18" fill="url(#flatWater)" stroke="#cbd5e1"/>
        <path d="M77 108 C126 78 174 92 210 124 S304 155 352 118 447 88 493 125" fill="none" stroke="#94a3b8" stroke-width="6" stroke-linecap="round"/>
        <path d="M82 232 C152 194 226 213 284 185 S397 152 486 180" fill="none" stroke="#cbd5e1" stroke-width="14" stroke-linecap="round"/>
        <path d="M96 229 C166 191 228 209 286 181 S398 149 488 176" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
        <polygon points="258,122 331,138 347,190 300,223 237,202 221,151" fill="#2563eb" fill-opacity="0.18" stroke="#1d4ed8" stroke-width="4"/>
        <circle cx="304" cy="172" r="9" fill="#1d4ed8"/>
        <rect x="359" y="146" width="103" height="36" rx="18" fill="#ffffff" stroke="#bfdbfe"/>
        <text x="381" y="169" fill="#0f172a" font-size="14" font-weight="700">대상지</text>
      </svg>
    `,
    "raised-site": `
      <svg viewBox="0 0 560 340" role="img" aria-label="대상지 리프트업 샘플">
        <defs>
          <filter id="liftShadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="16" stdDeviation="10" flood-color="#0f172a" flood-opacity="0.22"/>
          </filter>
          <linearGradient id="liftSide" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#60a5fa"/>
            <stop offset="1" stop-color="#1d4ed8"/>
          </linearGradient>
        </defs>
        <rect width="560" height="340" rx="22" fill="#f8fafc"/>
        <path d="M70 92 H486 M70 152 H486 M70 212 H486 M126 60 V278 M222 60 V278 M318 60 V278 M414 60 V278" stroke="#dbe3ee" stroke-width="3"/>
        <path d="M82 241 C152 198 229 221 288 184 S398 151 488 176" fill="none" stroke="#cbd5e1" stroke-width="16" stroke-linecap="round"/>
        <path d="M96 237 C166 194 231 216 290 180 S399 147 490 172" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
        <g filter="url(#liftShadow)">
          <polygon points="228,174 299,195 360,164 360,202 299,235 228,212" fill="url(#liftSide)" opacity="0.9"/>
          <polygon points="228,118 299,139 360,108 360,164 299,195 228,174" fill="#dbeafe" stroke="#1d4ed8" stroke-width="4"/>
          <polygon points="248,134 300,149 338,129 338,154 300,174 248,158" fill="#2563eb" fill-opacity="0.24" stroke="#1d4ed8" stroke-width="3"/>
        </g>
        <path d="M365 138 H458" stroke="#1d4ed8" stroke-width="3"/>
        <rect x="443" y="120" width="68" height="36" rx="18" fill="#ffffff" stroke="#bfdbfe"/>
        <text x="459" y="143" fill="#0f172a" font-size="13" font-weight="700">부각</text>
      </svg>
    `,
    "layered-terrain": `
      <svg viewBox="0 0 560 340" role="img" aria-label="레이어 적층 샘플">
        <defs>
          <filter id="layerShadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="12" stdDeviation="9" flood-color="#0f172a" flood-opacity="0.16"/>
          </filter>
        </defs>
        <rect width="560" height="340" rx="22" fill="#f8fafc"/>
        <g filter="url(#layerShadow)">
          <path d="M104 214 C166 164 236 185 290 146 C350 102 421 107 479 154 L479 220 C422 173 352 166 290 212 C235 252 165 230 104 278 Z" fill="#dbeafe" stroke="#93c5fd" stroke-width="3"/>
          <path d="M88 174 C159 120 231 140 298 105 C364 70 433 83 496 124 L496 172 C433 132 365 119 298 154 C232 189 160 169 88 222 Z" fill="#dcfce7" fill-opacity="0.9" stroke="#86efac" stroke-width="3"/>
          <path d="M132 136 C187 102 248 112 302 84 C356 57 413 60 468 95 L468 133 C414 100 356 96 302 124 C249 151 188 142 132 174 Z" fill="#fef3c7" fill-opacity="0.88" stroke="#fbbf24" stroke-width="3"/>
        </g>
        <polygon points="255,132 324,145 345,184 302,209 239,191 222,151" fill="#2563eb" fill-opacity="0.22" stroke="#1d4ed8" stroke-width="4"/>
        <text x="64" y="58" fill="#0f172a" font-size="15" font-weight="800">권역 레이어</text>
      </svg>
    `,
    "extruded-district": `
      <svg viewBox="0 0 560 340" role="img" aria-label="대상 구역 블록 샘플">
        <defs>
          <linearGradient id="blockSide" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#38bdf8"/>
            <stop offset="1" stop-color="#0f766e"/>
          </linearGradient>
          <filter id="blockShadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="18" stdDeviation="11" flood-color="#0f172a" flood-opacity="0.24"/>
          </filter>
        </defs>
        <rect width="560" height="340" rx="22" fill="#f8fafc"/>
        <path d="M74 110 H490 M74 164 H490 M74 218 H490 M128 70 V266 M218 70 V266 M308 70 V266 M398 70 V266" stroke="#e2e8f0" stroke-width="3"/>
        <g filter="url(#blockShadow)">
          <polygon points="220,154 284,122 360,143 378,191 314,231 237,206" fill="url(#blockSide)" opacity="0.95"/>
          <polygon points="220,113 284,82 360,103 378,151 314,190 237,166" fill="#ccfbf1" stroke="#0f766e" stroke-width="4"/>
          <path d="M220 113 L220 154 M237 166 L237 206 M314 190 L314 231 M378 151 L378 191" stroke="#0f766e" stroke-width="3" opacity="0.7"/>
        </g>
        <path d="M386 121 C426 109 462 113 493 138" fill="none" stroke="#f97316" stroke-width="6" stroke-linecap="round"/>
      </svg>
    `,
    "isometric-board": `
      <svg viewBox="0 0 560 340" role="img" aria-label="아이소메트릭 보드형 샘플">
        <defs>
          <filter id="isoShadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="18" stdDeviation="13" flood-color="#0f172a" flood-opacity="0.22"/>
          </filter>
        </defs>
        <rect width="560" height="340" rx="22" fill="#f8fafc"/>
        <g filter="url(#isoShadow)">
          <polygon points="116,116 282,36 455,116 289,214" fill="#eef6ff" stroke="#cbd5e1" stroke-width="4"/>
          <polygon points="116,116 289,214 289,255 116,157" fill="#cbd5e1"/>
          <polygon points="455,116 289,214 289,255 455,157" fill="#94a3b8"/>
        </g>
        <path d="M185 123 L282 77 L384 122" fill="none" stroke="#94a3b8" stroke-width="5" stroke-linecap="round"/>
        <path d="M169 155 L278 103 L403 161" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>
        <path d="M169 155 L278 103 L403 161" fill="none" stroke="#f97316" stroke-width="3" stroke-linecap="round"/>
        <polygon points="248,128 300,104 352,128 301,160" fill="#2563eb" fill-opacity="0.24" stroke="#1d4ed8" stroke-width="4"/>
        <circle cx="302" cy="132" r="8" fill="#1d4ed8"/>
        <text x="214" y="286" fill="#0f172a" font-size="15" font-weight="800">입지 구조를 보드처럼 정리</text>
      </svg>
    `,
    ai: `
      <svg viewBox="0 0 560 340" role="img" aria-label="AI 위임 샘플">
        <rect width="560" height="340" rx="22" fill="#f8fafc"/>
        <rect x="64" y="52" width="432" height="236" rx="18" fill="#eef2ff" stroke="#c7d2fe"/>
        <path d="M110 220 C173 160 244 195 299 144 C355 93 429 117 471 158" fill="none" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
        <path d="M115 218 C178 158 246 190 301 140 C356 90 430 112 472 154" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
        <polygon points="245,135 313,122 356,165 320,214 252,201 225,163" fill="#2563eb" fill-opacity="0.2" stroke="#1d4ed8" stroke-width="4"/>
        <path d="M166 78 H394" stroke="#6366f1" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 14"/>
        <text x="188" y="260" fill="#0f172a" font-size="15" font-weight="800">내용에 맞춰 평면/입체 중 선택</text>
      </svg>
    `,
    "top-down": `
      <svg viewBox="0 0 560 340" role="img" aria-label="탑뷰 샘플">
        <rect width="560" height="340" rx="22" fill="#f8fafc"/>
        <rect x="84" y="52" width="392" height="236" rx="16" fill="#eef6ff" stroke="#bfdbfe" stroke-width="4"/>
        <path d="M120 112 H438 M120 174 H438 M120 236 H438 M178 82 V260 M278 82 V260 M378 82 V260" stroke="#dbe3ee" stroke-width="4"/>
        <polygon points="246,121 322,133 348,190 303,225 233,204 216,151" fill="#2563eb" fill-opacity="0.2" stroke="#1d4ed8" stroke-width="4"/>
        <text x="218" y="315" fill="#0f172a" font-size="15" font-weight="800">왜곡이 적은 정면형</text>
      </svg>
    `,
    "low-isometric": `
      <svg viewBox="0 0 560 340" role="img" aria-label="낮은 아이소메트릭 샘플">
        <rect width="560" height="340" rx="22" fill="#f8fafc"/>
        <polygon points="106,128 284,48 460,128 284,226" fill="#eef6ff" stroke="#bfdbfe" stroke-width="4"/>
        <polygon points="106,128 284,226 284,258 106,160" fill="#cbd5e1"/>
        <polygon points="460,128 284,226 284,258 460,160" fill="#94a3b8"/>
        <path d="M178 127 L282 80 L390 128" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
        <path d="M178 127 L282 80 L390 128" fill="none" stroke="#f97316" stroke-width="4" stroke-linecap="round"/>
        <polygon points="246,125 302,100 359,127 303,159" fill="#2563eb" fill-opacity="0.22" stroke="#1d4ed8" stroke-width="4"/>
        <text x="195" y="300" fill="#0f172a" font-size="15" font-weight="800">낮은 각도로 깊이만 살림</text>
      </svg>
    `,
    "report-perspective": `
      <svg viewBox="0 0 560 340" role="img" aria-label="보고서형 약한 원근 샘플">
        <rect width="560" height="340" rx="22" fill="#f8fafc"/>
        <polygon points="108,80 452,80 500,260 60,260" fill="#eef6ff" stroke="#bfdbfe" stroke-width="4"/>
        <path d="M132 124 H466 M107 178 H481 M82 232 H494 M186 86 L154 256 M280 84 V260 M374 86 L410 256" stroke="#dbe3ee" stroke-width="4"/>
        <polygon points="237,127 324,130 356,190 305,224 226,203 205,151" fill="#2563eb" fill-opacity="0.2" stroke="#1d4ed8" stroke-width="4"/>
        <text x="182" y="304" fill="#0f172a" font-size="15" font-weight="800">보고서용 약한 원근</text>
      </svg>
    `,
    "no-perspective": `
      <svg viewBox="0 0 560 340" role="img" aria-label="원근 왜곡 최소화 샘플">
        <rect width="560" height="340" rx="22" fill="#f8fafc"/>
        <rect x="90" y="64" width="380" height="216" rx="12" fill="#eef6ff" stroke="#bfdbfe" stroke-width="4"/>
        <g stroke="#dbe3ee" stroke-width="4">
          <path d="M126 64 V280 M198 64 V280 M270 64 V280 M342 64 V280 M414 64 V280"/>
          <path d="M90 100 H470 M90 148 H470 M90 196 H470 M90 244 H470"/>
        </g>
        <polygon points="242,124 320,124 350,178 320,226 242,226 212,178" fill="#2563eb" fill-opacity="0.2" stroke="#1d4ed8" stroke-width="4"/>
        <path d="M116 299 H444" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>
        <text x="194" y="318" fill="#0f172a" font-size="15" font-weight="800">비율 보존 우선</text>
      </svg>
    `,
  };

  const PREVIEW_DATA = {
    threeDStyle: {
      none: {
        name: "사용 안 함 · 평면 지도 중심",
        desc: "대상 구역을 선과 면으로 강조하는 기본 지도입니다. 위치 정확성과 라벨 가독성이 가장 안정적입니다.",
        svg: SAMPLE_SVGS.none,
      },
      "raised-site": {
        name: "대상지만 살짝 들어 올리기",
        desc: "대상지만 낮은 입체 레이어로 들어 올려 보여줍니다. 사업계획서에서 위치를 빠르게 인지시키기 좋습니다.",
        svg: SAMPLE_SVGS["raised-site"],
      },
      "layered-terrain": {
        name: "지형/권역 레이어를 낮게 적층",
        desc: "권역, 영향권, 행정구역 같은 면 정보를 얕은 레이어로 쌓아 입지 관계를 설명합니다.",
        svg: SAMPLE_SVGS["layered-terrain"],
      },
      "extruded-district": {
        name: "대상 구역을 낮은 블록 형태로 강조",
        desc: "대상 경계를 따라 낮은 블록감을 줍니다. 과한 도시 모형 느낌을 피하고 경계 정확성을 유지해야 합니다.",
        svg: SAMPLE_SVGS["extruded-district"],
      },
      "isometric-board": {
        name: "아이소메트릭 보드형 지도",
        desc: "지도 전체를 낮은 보드처럼 정리해 도로, 거점, 대상지의 관계를 입체적으로 보여줍니다.",
        svg: SAMPLE_SVGS["isometric-board"],
      },
      ai: {
        name: "AI 위임 · 지도 정확도를 해치지 않는 범위에서 결정",
        desc: "슬라이드 메시지와 첨부 지도에 맞춰 평면, 약한 입체감, 대상지 리프트업 중 가장 안전한 방식을 고르게 합니다.",
        svg: SAMPLE_SVGS.ai,
      },
    },
    cameraAngle: {
      "top-down": {
        name: "정투영에 가까운 탑뷰",
        desc: "지도 비율과 위치 관계를 가장 안정적으로 보여줍니다. 관공서·기업 보고서에 기본값으로 적합합니다.",
        svg: SAMPLE_SVGS["top-down"],
      },
      "low-isometric": {
        name: "낮은 아이소메트릭 시점",
        desc: "낮은 각도로 깊이감을 살립니다. 입지 구조를 시각적으로 돋보이게 하되 글자 왜곡을 조심해야 합니다.",
        svg: SAMPLE_SVGS["low-isometric"],
      },
      "report-perspective": {
        name: "보고서용 약한 원근 시점",
        desc: "정면 지도보다 조금 더 역동적이지만, 사업계획서에 들어갈 수 있을 정도로 원근을 절제합니다.",
        svg: SAMPLE_SVGS["report-perspective"],
      },
      "no-perspective": {
        name: "원근 왜곡 최소화",
        desc: "3D 효과를 쓰더라도 지도 비율과 경계가 틀어져 보이지 않게 제어하는 방식입니다.",
        svg: SAMPLE_SVGS["no-perspective"],
      },
    },
  };

  const OUTPUT_LABELS = {
    "business-plan": "business plan body figure",
    "result-report": "result report performance and location figure",
    "proposal-document": "proposal document persuasion map figure",
    "proposal-slide": "proposal presentation slide map visual",
    "executive-summary": "executive summary location map",
    "site-analysis": "site analysis and regional context figure",
  };

  const OUTPUT_PURPOSE_PROMPTS = {
    "business-plan": "Make the image support business planning decisions: location feasibility, project necessity, access, surrounding demand, and strategic fit.",
    "result-report": "Make the image support a result report: completed scope, achieved outcomes, affected area, and factual before/after or performance context.",
    "proposal-document": "Make the image support a proposal document: clear differentiation, persuasive site rationale, decision-maker readability, and expected value.",
    "proposal-slide": "Make the image work on a presentation slide: quick comprehension, strong focal hierarchy, minimal clutter, and immediate executive readability.",
    "executive-summary": "Make the image suitable for an executive summary: one-message clarity, concise labels, and a memorable location takeaway.",
    "site-analysis": "Make the image support site analysis: spatial relationships, access routes, surrounding anchors, constraints, and evidence-oriented interpretation.",
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
    threeDStyle: "none",
    cameraAngle: "top-down",
    canvas: "16:9 landscape business presentation image",
    labels: "",
    exclusions: "",
    techniques: ["boundary-glow", "callout", "access-axis"],
  };

  const state = { ...DEFAULT_STATE, techniques: [...DEFAULT_STATE.techniques] };
  let previewReturnFocus = null;

  function setMessage(text, isError = false) {
    const node = $("mapMessage");
    if (!node) return;
    node.textContent = text || "";
    node.classList.toggle("ok", !isError && Boolean(text));
  }

  function openSamplePreview(kind) {
    syncStateFromFields();
    const modal = $("mapThreeDPreviewModal");
    const art = $("mapThreeDPreviewArt");
    const title = $("mapThreeDPreviewTitle");
    const subtitle = $("mapThreeDPreviewSubtitle");
    const name = $("mapThreeDPreviewName");
    const desc = $("mapThreeDPreviewDesc");
    if (!modal || !art || !title || !subtitle || !name || !desc) return;

    const value = kind === "cameraAngle" ? state.cameraAngle : state.threeDStyle;
    const data = PREVIEW_DATA[kind]?.[value];
    if (!data) return;

    title.textContent = kind === "cameraAngle" ? "3D 카메라/시점 샘플" : "3D 연출 방식 샘플";
    subtitle.textContent = kind === "cameraAngle"
      ? "선택한 시점이 지도 비율과 입체감에 주는 차이를 확인합니다."
      : "선택한 3D 표현 방식의 예상 시각 효과를 확인합니다.";
    name.textContent = data.name;
    desc.textContent = data.desc;
    art.innerHTML = data.svg;
    previewReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modal.querySelector("[data-close-map-preview]")?.focus();
  }

  function closeSamplePreview() {
    const modal = $("mapThreeDPreviewModal");
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (previewReturnFocus) {
      previewReturnFocus.focus();
    }
    previewReturnFocus = null;
  }

  function applyTextPreset(selectId) {
    const config = TEXT_PRESETS[selectId];
    const select = $(selectId);
    const textarea = config ? $(config.targetId) : null;
    if (!config || !select || !textarea) return;

    const presetText = config.presets[select.value];
    if (!presetText) return;

    textarea.value = presetText;
    textarea.focus();
    updatePrompt();
    setMessage("프리셋 문구를 채웠습니다. 필요한 표현은 바로 수정할 수 있습니다.");
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
      const check = document.createElement("span");
      check.className = "map-technique-check";
      check.setAttribute("aria-hidden", "true");
      const title = document.createElement("strong");
      title.textContent = technique.label;
      const desc = document.createElement("small");
      desc.textContent = technique.desc;
      button.append(check, title, desc);
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
    state.threeDStyle = $("mapThreeDStyle")?.value || DEFAULT_STATE.threeDStyle;
    state.cameraAngle = $("mapCameraAngle")?.value || DEFAULT_STATE.cameraAngle;
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
    $("mapThreeDStyle").value = state.threeDStyle;
    $("mapCameraAngle").value = state.cameraAngle;
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
      `Purpose guidance: ${OUTPUT_PURPOSE_PROMPTS[state.outputType] || OUTPUT_PURPOSE_PROMPTS["business-plan"]}`,
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
      `- 3D treatment: ${THREE_D_STYLE_PROMPTS[state.threeDStyle] || THREE_D_STYLE_PROMPTS.none}`,
      `- Camera and perspective: ${CAMERA_PROMPTS[state.cameraAngle] || CAMERA_PROMPTS["top-down"]}`,
      "- Maintain enough contrast between the highlighted district, base map, labels, and surrounding context.",
      "- Color choices must support business-plan readability; avoid decorative gradients or trendy colors that weaken map accuracy.",
      "- If 3D is used, keep it as a low-relief business visualization, not a cinematic terrain render, game map, toy model, or exaggerated city mockup.",
      "- 3D height, extrusion, shadows, and bevels must support the target-area emphasis only; they must not imply false elevation, false building volume, or inaccurate landform data.",
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
      "- Avoid decorative neon, fantasy glow, excessive 3D, inaccurate extrusion, satellite-photo hallucination, tourist-poster mood, and cluttered infographic effects.",
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
    state.threeDStyle = "raised-site";
    state.cameraAngle = "top-down";
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
      "mapReferencePreset",
      "mapTargetPreset",
      "mapContextPreset",
      "mapVisualTone",
      "mapColorPalette",
      "mapHighlightColor",
      "mapBaseStyle",
      "mapBackgroundTreatment",
      "mapLabelDensity",
      "mapDepthStyle",
      "mapThreeDStyle",
      "mapCameraAngle",
      "mapCanvas",
      "mapLabels",
      "mapExclusions",
    ].forEach((id) => {
      const input = $(id);
      if (!input) return;
      input.addEventListener("input", updatePrompt);
      input.addEventListener("change", updatePrompt);
    });

    Object.keys(TEXT_PRESETS).forEach((selectId) => {
      $(selectId)?.addEventListener("change", () => applyTextPreset(selectId));
    });

    $("mapGeneratePromptBtn")?.addEventListener("click", () => {
      updatePrompt();
      setMessage("프롬프트를 생성했습니다.");
    });
    $("mapCopyPromptBtn")?.addEventListener("click", copyPrompt);
    $("mapSampleBtn")?.addEventListener("click", fillSample);
    $("mapResetBtn")?.addEventListener("click", reset);
    $("mapThreeDPreviewBtn")?.addEventListener("click", () => openSamplePreview("threeDStyle"));
    $("mapCameraPreviewBtn")?.addEventListener("click", () => openSamplePreview("cameraAngle"));
    document.querySelectorAll("[data-close-map-preview]").forEach((el) => {
      el.addEventListener("click", closeSamplePreview);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeSamplePreview();
    });
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
