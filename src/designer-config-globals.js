const PAGE_TYPES = [
  {
    id: "cover",
    text: "표지",
    desc: "타이틀과 첫 인상을 강조하는 페이지",
    en: "cover slide",
  },
  {
    id: "agenda",
    text: "목차/발표 개요",
    desc: "목차와 발표 흐름을 정리하는 페이지",
    en: "agenda or presentation overview slide",
  },
  {
    id: "divider",
    text: "구분페이지",
    desc: "섹션 제목과 짧은 설명을 보여주는 페이지",
    en: "section divider page",
  },
  {
    id: "body",
    text: "본문",
    desc: "데이터와 설명이 함께 들어가는 기본 페이지",
    en: "body content page",
  },
  {
    id: "closing",
    text: "맺음말",
    desc: "감사, CTA, 다음 단계를 정리하는 페이지",
    en: "closing page",
  },
];

const OPTIONS = {
  format: [
    { icon: "169", text: "16:9 와이드", sub: "발표용 기본 비율", en: "canvas aspect ratio: 16:9 widescreen" },
    { icon: "43", text: "4:3 표준", sub: "전통 발표 비율", en: "canvas aspect ratio: 4:3 standard" },
    { icon: "A4V", text: "A4 세로", sub: "210×297 mm 인쇄 세로형", en: "canvas size: A4 portrait (210×297 mm), print-optimized vertical layout" },
    { icon: "A4H", text: "A4 가로", sub: "297×210 mm 인쇄 가로형", en: "canvas size: A4 landscape (297×210 mm), print-optimized horizontal layout" },
    { icon: "SQ", text: "1:1 정사각", sub: "썸네일·소셜 미디어 규격", en: "canvas aspect ratio: 1:1 square, suitable for thumbnails and social media" },
    { icon: "USR", text: "사용자 정의", sub: "직접 비율 입력", en: "canvas aspect ratio: custom (user-defined W:H)" },
  ],
  mood: [
    { icon: "BIZ", text: "전문 비즈니스", sub: "정제된 기업 발표 톤", en: "overall presentation tone: professional corporate business, polished and formal" },
    { icon: "TEC", text: "미래 기술", sub: "첨단 산업·기술 보고서 톤", en: "overall presentation tone: futuristic high-tech, advanced industry and technology briefing" },
    { icon: "PUB", text: "공공/정책", sub: "기관 보고서·심사 자료 톤", en: "overall presentation tone: public-sector policy briefing, institutional report style" },
    { icon: "IR", text: "IR/투자 제안", sub: "투자 설명회·기업 제안서 톤", en: "overall presentation tone: investor relations pitch deck, compelling and data-driven" },
    { icon: "EDU", text: "교육/강의", sub: "학습 흐름과 이해도를 중시하는 톤", en: "overall presentation tone: educational lecture deck, clear learning flow and approachable explanation" },
    { icon: "RND", text: "연구/학술", sub: "근거와 방법론을 차분히 보여주는 톤", en: "overall presentation tone: research and academic presentation, evidence-led and methodical" },
    { icon: "SAL", text: "영업/제안", sub: "고객 설득과 실행 가치를 강조하는 톤", en: "overall presentation tone: sales proposal, persuasive client-facing value and action-oriented structure" },
    { icon: "OPS", text: "내부 보고", sub: "의사결정과 실행 현황을 빠르게 파악하는 톤", en: "overall presentation tone: internal executive report, concise decision support and operational status clarity" },
  ],
  quality: [
    { icon: "HQ", text: "고해상도", sub: "선명하고 깨끗한 출력", en: "image quality: high resolution, sharp edges, clean and crisp output" },
    { icon: "PR", text: "출력용 품질", sub: "인쇄·발표 양용 고품질", en: "image quality: print-ready professional quality, suitable for both print and projection" },
    { icon: "TX", text: "텍스트 선명도 우선", sub: "작은 글자·수치·라벨 가독성 보호", en: "image quality: prioritize crisp typography, readable small labels, clean numbers, and sharp text edges" },
    { icon: "CH", text: "차트/도표 정확도", sub: "축·범례·수치 블록 왜곡 방지", en: "image quality: preserve chart, axis, legend, and numeric block clarity without visual distortion" },
    { icon: "KR", text: "한글 렌더링 안정성", sub: "자모 깨짐·이상한 줄바꿈 방지", en: "image quality: stable Korean typography, no split jamo, malformed glyphs, or awkward line breaks" },
    { icon: "NOZ", text: "노이즈/저해상도 방지", sub: "흐림·픽셀 깨짐·스톡 이미지 느낌 억제", en: "image quality: avoid noise, blur, pixelation, and low-resolution stock-image appearance" },
  ],
  "screen-elements": [
    { icon: "BG", text: "배경", sub: "전체 화면의 바탕과 구획을 설계", en: "screen elements: include a designed background system that supports readability and spatial structure" },
    { icon: "BLK", text: "정보 블록/카드", sub: "본문 정보를 담는 카드·패널·박스", en: "screen elements: information blocks or cards for organizing body content into readable panels" },
    { icon: "ICO", text: "아이콘/픽토그램", sub: "개념을 빠르게 보여주는 단순 기호", en: "screen elements: icons or pictograms used as simple semantic anchors" },
    { icon: "CHT", text: "도표/차트", sub: "수치·관계·흐름을 시각화", en: "screen elements: diagrams, charts, or visual data structures for numbers, relationships, or flows" },
    { icon: "PHO", text: "실사 이미지", sub: "현장·제품·인물 사진 기반 요소", en: "screen elements: photographic imagery such as field scenes, products, people, or facilities" },
    { icon: "3D", text: "3D 오브젝트", sub: "입체 오브젝트·아이소메트릭 요소", en: "screen elements: 3D objects or isometric visual elements as focal or supporting objects" },
    { icon: "DEC", text: "장식 그래픽", sub: "정보를 보조하는 선·도형·패턴", en: "screen elements: decorative graphics such as lines, shapes, or subtle patterns that support information hierarchy" },
    { icon: "TYP", text: "타이포그래피 중심", sub: "큰 제목과 글자 대비가 주인공", en: "screen elements: typography-led composition where large type and typographic contrast carry the design" },
    { icon: "NEG", text: "여백 중심", sub: "비움과 간결한 요소 수를 우선", en: "screen elements: whitespace-led composition with restrained element count and strong negative space" },
  ],
  material: [
    { icon: "FLT", text: "플랫 벡터", sub: "깔끔한 2D 도형·아이콘 중심", en: "rendering style: flat vector — clean 2D shapes, icons, minimal linework, no photographic depth" },
    { icon: "LIN", text: "미니멀 라인아트", sub: "얇은 선과 절제된 도식 표현", en: "rendering style: minimal line art — thin lines, restrained diagrams, and elegant outlines" },
    { icon: "PH", text: "실사 기반 합성", sub: "사진적 원근·질감·그림자 기반", en: "rendering style: photorealistic composite — photographic perspective, texture, and natural shadow integration" },
    { icon: "ISO", text: "3D 아이소메트릭", sub: "공간감 있는 입체 정보 그래픽", en: "rendering style: isometric 3D — dimensional information graphics with controlled perspective" },
    { icon: "CLY", text: "3D 클레이", sub: "친근하고 부드러운 입체 오브젝트", en: "rendering style: 3D clay — soft rounded objects, friendly tactile forms, approachable dimensionality" },
    { icon: "GLS", text: "글래스모피즘", sub: "반투명 유리 패널과 부드러운 흐림", en: "rendering style: glassmorphism — frosted glass panels, translucency, and soft blur" },
    { icon: "PAP", text: "무광/페이퍼", sub: "차분한 무광 표면과 종이 질감", en: "rendering style: matte or paper texture — smooth non-reflective surfaces and clean paper-like restraint" },
    { icon: "MET", text: "메탈릭/금속", sub: "산업적이고 단단한 금속 질감", en: "rendering style: metallic — polished steel surfaces, industrial sheen, and solid structure" },
    { icon: "CMP", text: "고급 레이어 합성", sub: "여러 시각 레이어와 깊이감", en: "rendering style: advanced layered compositing — multiple visual layers, overlaps, and refined depth" },
  ],
  lighting: [
    { icon: "MIN", text: "연출 최소화", sub: "빛·그림자 효과를 낮춰 정보 전달 우선", en: "visual treatment: minimal effects — reduce lighting, shadow, and decorative treatment to prioritize information clarity" },
    { icon: "STD", text: "스튜디오 조명", sub: "피사체를 또렷이 부각하는 빛", en: "visual treatment: studio lighting — controlled soft shadows, sharp subject focus, neutral background" },
    { icon: "NAT", text: "은은한 자연광", sub: "부드럽고 신뢰감 있는 빛", en: "visual treatment: natural daylight — soft diffused light, warm atmosphere, trustworthy and calm feel" },
    { icon: "DRM", text: "강한 대비 조명", sub: "강렬한 명암과 임팩트", en: "visual treatment: dramatic high-contrast lighting — deep shadows, bold highlights, cinematic impact" },
    { icon: "SHD", text: "부드러운 그림자", sub: "카드·오브젝트 분리감만 약하게 부여", en: "visual treatment: soft shadows — gentle separation for cards and objects without heavy decoration" },
    { icon: "DEP", text: "깊이감 있는 레이어", sub: "앞뒤 레이어와 겹침으로 공간감 형성", en: "visual treatment: layered depth — foreground/background separation through overlaps and spatial layering" },
    { icon: "OVL", text: "오버레이/반투명 효과", sub: "정보 패널과 배경을 반투명 레이어로 연결", en: "visual treatment: overlay or translucency — connect information panels and background through controlled transparent layers" },
  ],
  bg: [
    { icon: "AI", text: "AI 위임", sub: "배경 베이스를 AI가 자유롭게 결정", en: "background base: AI-directed — determine the background approach from the slide topic, page type, information volume, text density, and presentation readability; prioritize information clarity over decoration" },
    { icon: "W", text: "화이트 배경", sub: "밝고 구조적인 보고서형", en: "background base: pure white — clean, structured, report-style clarity" },
    { icon: "SOL", text: "단색 배경", sub: "지정 컬러로 평평하고 명확하게", en: "background base: solid color — a flat single-color surface with clear readability" },
    { icon: "G", text: "은은한 그레이 블록", sub: "섹션 구분이 쉬운 배경", en: "background base: soft gray section blocks — clearly delineated content zones, professional structure" },
    { icon: "BLK", text: "구획형 배경 블록", sub: "정보 영역을 면과 블록으로 분리", en: "background base: sectioned block system — use planes and blocks to separate information zones" },
    { icon: "T", text: "미세 텍스처", sub: "인쇄물 같은 고급 질감", en: "background base: subtle paper-like texture — fine grain, tactile feel reminiscent of premium print" },
    { icon: "D", text: "다층 배경면", sub: "겹친 면으로 깊이감만 부여", en: "background base: multi-layer planes — overlapping background planes for controlled depth without competing with content" },
  ],
  "bg-style": [
    { icon: "AI", text: "AI 위임", sub: "배경 콘텐츠 종류를 AI가 자유롭게 결정", en: "background content: AI-directed — decide whether background content is needed and how strong it should be according to the slide message, body information volume, and foreground readability" },
    { icon: "NONE", text: "장식 없음 (기본)", sub: "배경 베이스만 사용", en: "background content: none — rely only on the selected background base and color system" },
    { icon: "GEO", text: "기하학 도형", sub: "삼각형·원·다각형 등 추상 도형", en: "background content: geometric shapes — abstract triangles, circles, polygons, hexagons, or intersecting lines" },
    { icon: "PAT", text: "반복 패턴", sub: "도트·라인·체크·웨이브 반복", en: "background content: repeating pattern — small dots, stripes, checks, waves, or grid units tiled softly" },
    { icon: "REL", text: "주제 관련 이미지", sub: "내용과 직접 관련된 사진·일러스트 배경", en: "background content: subject-related image — relevant photo or illustration used softly behind the foreground content" },
    { icon: "LGT", text: "추상 광원/그라데이션", sub: "빛 번짐·부드러운 색 변화", en: "background content: abstract light or gradient — soft light fields, glow transitions, or restrained gradients" },
    { icon: "DAT", text: "데이터/네트워크 모티프", sub: "노드·선·좌표·데이터 흐름", en: "background content: data or network motif — nodes, connecting lines, coordinates, or data-flow traces" },
  ],
  "bg-tone": [
    { icon: "AI", text: "AI 위임", sub: "배경 톤을 AI가 자유롭게 결정", en: "background tone: AI-directed — adjust color character, saturation, brightness, and contrast according to the chosen background approach and slide content. Maintain clear text, label, and chart readability." },
    { icon: "COL", text: "컬러", sub: "지정된 컬러 시스템(Primary·Secondary·Accent)을 활용한 채색", en: "background tone: full color — render the background content using the defined color system (Primary, Secondary, Accent), maintaining brand consistency" },
    { icon: "MON", text: "흑백 / 모노크롬", sub: "검정·회색·흰색만 사용한 무채색 표현", en: "background tone: monochrome / grayscale only — render the background content strictly in black, white, and shades of gray; no chromatic colors at all in the background layer" },
    { icon: "DIM", text: "저채도·블리치", sub: "원본 색을 크게 낮춰 흐릿하게 (15~25% 채도)", en: "background tone: heavily desaturated / bleached — reduce chroma to about 15–25% so the background reads as a quiet supporting layer rather than a focal element" },
  ],
  palette: [
    { icon: "AI", text: "AI 위임", sub: "컬러 프리셋을 AI가 자유롭게 결정", en: "color preset: AI-directed — determine the color direction according to the slide content, purpose, information density, and background approach" },
    { icon: "PUB", text: "공공 블루", sub: "관공서 보고서·정책자료 표준형", en: "color scheme: public-sector blue — formal government and policy deck tone with clean white background and restrained blue emphasis" },
    { icon: "NAV", text: "행정 네이비", sub: "심사·브리핑용 짙은 청색 구조", en: "color scheme: administrative navy — deep navy structure for formal review, briefing, and institutional documents" },
    { icon: "COR", text: "기업 블루", sub: "대기업·B2B 제안서 기본형", en: "color scheme: enterprise blue — reliable corporate B2B presentation palette with clear blue primary and neutral support colors" },
    { icon: "GRY", text: "차콜 그레이", sub: "임원 보고·내부 전략자료", en: "color scheme: charcoal gray — executive report palette with calm dark neutral structure and restrained accent" },
    { icon: "FIN", text: "금융 그린", sub: "재무·IR·성과 보고에 적합", en: "color scheme: finance green — stable green palette for finance, IR, performance, and growth reporting" },
    { icon: "IND", text: "산업 슬레이트", sub: "제조·인프라·기술 백서형", en: "color scheme: industrial slate — slate blue-gray palette for manufacturing, infrastructure, engineering, and technical whitepapers" },
    { icon: "BIO", text: "바이오 틸", sub: "의료·바이오·헬스케어 자료", en: "color scheme: bio teal — clean teal palette for healthcare, biotech, and medical presentations" },
    { icon: "RND", text: "연구 퍼플", sub: "R&D·교육·학술 발표용", en: "color scheme: research purple — restrained purple palette for R&D, education, academic, and innovation decks" },
    { icon: "ESG", text: "ESG 그린", sub: "환경·지속가능·공공성과", en: "color scheme: ESG green — natural green palette for sustainability, public value, ESG, and environmental reports" },
    { icon: "ORG", text: "제안서 오렌지", sub: "영업·제안·프로젝트 강조", en: "color scheme: proposal orange — energetic but professional orange accent palette for sales proposals and project pitches" },
    { icon: "GLD", text: "프리미엄 골드", sub: "고급 제안·성과 발표용", en: "color scheme: premium gold — dark neutral and gold accent palette for premium corporate proposals and performance presentations" },
    { icon: "DKP", text: "다크 포인트", sub: "검정·회색 바탕 + 선명한 포인트", en: "color scheme: dark point — black or charcoal background with crisp accent color for high-impact executive or keynote slides" },
    { icon: "WHP", text: "화이트 포인트", sub: "흰 바탕 + 절제된 포인트 컬러", en: "color scheme: white point — clean white background with restrained accent color for readable business and public-sector slides" },
  ],
  pattern: [
    { icon: "NO", text: "보조 모티프 없음", sub: "배경 콘텐츠 외 추가 장식 없음", en: "decorative motif: none — no extra decorative motifs beyond the selected background content" },
    { icon: "GEO", text: "기하학 보조선", sub: "정보 영역을 잡아주는 얇은 도형·선", en: "decorative motif: geometric support lines — thin shapes and rules that organize information zones" },
    { icon: "GRD", text: "테크니컬 그리드", sub: "보조선·좌표감으로 정밀도 강조", en: "decorative motif: technical grid accents — blueprint-style lines and coordinate cues" },
    { icon: "ORG", text: "유기적 곡선", sub: "보조 곡선으로 부드러운 흐름 추가", en: "decorative motif: organic flowing curve accents — soft movement without dominating the slide" },
    { icon: "GRN", text: "미세 그레인", sub: "아주 약한 질감으로 인쇄물 감성 보강", en: "decorative motif: subtle grain — low-intensity tactile texture for premium print feel" },
  ],
  hierarchy: [
    { icon: "CTR", text: "중앙 집중", sub: "핵심 메시지를 정중앙에 배치", en: "visual hierarchy: centered focal composition — symmetrical balance, single dominant center element" },
    { icon: "ROT", text: "3분할 구도", sub: "안정적인 황금비율 배치", en: "visual hierarchy: rule-of-thirds composition — balanced placement, natural eye flow across the slide" },
    { icon: "ASY", text: "비대칭 동적", sub: "세련되고 에너지 넘치는 구도", en: "visual hierarchy: asymmetrical dynamic composition — modern tension, purposeful imbalance for visual energy" },
    { icon: "NEG", text: "미니멀리즘", sub: "여백을 극대화한 비움의 미", en: "visual hierarchy: minimalist negative space — maximum breathing room, single focused element" },
  ],
  typography: [
    { icon: "SAN", text: "강직한 고딕", sub: "강한 선언과 신뢰감", en: "typography style: bold sans-serif — strong, assertive headlines with high legibility and authority" },
    { icon: "SER", text: "우아한 명조", sub: "통찰력 있고 고급스러운 느낌", en: "typography style: elegant serif — sophisticated classic letterforms, refined and authoritative" },
    { icon: "MOD", text: "모던 미니멀", sub: "얇고 세련된 현대적 감성", en: "typography style: modern minimal — thin, light-weight contemporary fonts with generous letter-spacing" },
    { icon: "MON", text: "테크니컬 모노", sub: "코딩·데이터 보고서 느낌", en: "typography style: monospaced technical font — fixed-width characters, data-report and engineering aesthetic" },
  ],
  spacing: [
    { icon: "AIR", text: "와이드/에어리", sub: "넓은 여백으로 시원한 느낌", en: "spacing: wide and airy — generous padding and margins, open and uncluttered feel" },
    { icon: "SPC", text: "표준 간격", sub: "안정적인 기본 여백", en: "spacing: standard balanced — moderate padding, comfortable readability without excess" },
    { icon: "CPT", text: "컴팩트/타이트", sub: "밀집된 구조와 좁은 간격", en: "spacing: compact and tight — minimal padding, dense information layout, efficient use of canvas" },
  ],
  density: [
    { icon: "DNS", text: "미니멀리스트", sub: "핵심 요소 1개에 집중", en: "content density: minimalist — single focal element only, maximum restraint" },
    { icon: "BAL", text: "균형 잡힌 구성", sub: "정보와 비주얼의 적절한 배치", en: "content density: balanced — information and visuals evenly distributed, neither sparse nor crowded" },
    { icon: "RCH", text: "리치 디테일", sub: "풍부한 정보와 꽉 찬 구성", en: "content density: rich and detailed — fully packed slide with intricate supporting elements" },
  ],
  layout: [
    { icon: "LR", text: "좌측 리스트 + 우측 다이어그램", sub: "목차·흐름도·전략 구조에 적합", en: "layout structure: left text list with right-side diagram — suitable for outlines, flowcharts, and strategy maps" },
    { icon: "TB", text: "상단 요약 + 하단 상세", sub: "핵심 문장과 근거를 함께 배치", en: "layout structure: top summary header with bottom supporting detail — key message above, evidence below" },
    { icon: "CC", text: "중앙 메시지형", sub: "강한 메시지를 중심으로 배치", en: "layout structure: centered focal message — single dominant headline or visual at the center of the slide" },
    { icon: "2C", text: "2단 정보형", sub: "비교·병렬 설명에 적합", en: "layout structure: two-column parallel layout — side-by-side comparison or dual information tracks" },
    { icon: "CG", text: "카드 그리드형", sub: "포인트를 카드로 구분", en: "layout structure: card grid — modular tiled sections, each card containing a distinct key point" },
    { icon: "OV", text: "오버레이형", sub: "비주얼 위에 정보 패널 배치", en: "layout structure: overlay panels — information blocks placed on top of a full-bleed visual background" },
    { icon: "TL", text: "타임라인형", sub: "시간 순서와 단계 변화를 축으로 구성", en: "layout structure: timeline — chronological axis with milestones, phases, or progress points" },
    { icon: "RD", text: "로드맵형", sub: "중장기 계획과 실행 단계를 경로로 표현", en: "layout structure: roadmap — staged path showing future plan, execution phases, and dependencies" },
    { icon: "KPI", text: "KPI 대시보드형", sub: "핵심 지표와 수치를 한 화면에 요약", en: "layout structure: KPI dashboard — metric cards, key numbers, and compact status indicators arranged for fast scanning" },
    { icon: "MTX", text: "매트릭스/사분면형", sub: "두 축으로 비교·분류·포지셔닝", en: "layout structure: matrix or quadrant — two-axis comparison, segmentation, or positioning map" },
    { icon: "BA", text: "Before/After 비교형", sub: "변화 전후를 나란히 대비", en: "layout structure: before-and-after comparison — clearly contrasted current state versus target or improved state" },
    { icon: "TBL", text: "표/비교표 중심형", sub: "항목별 차이를 표로 정리", en: "layout structure: table or comparison table — structured rows and columns for feature, option, or evidence comparison" },
  ],
  "title-bar-rule": [
    {
      icon: "REF",
      text: "첨부 이미지 타이틀바 디자인 차용",
      sub: "[참조 이미지 필요] 첨부 그림의 상단 타이틀바 디자인을 유지하고, 타이틀·넘버링 등은 본문의 번호를 기재 — 다른 헤더 옵션은 자동 무시됩니다",
      en: "Use the title bar design from the attached reference image. Keep the title and page numbering style as shown in the reference, but write the actual title text and the actual page number that match THIS slide's content. (No verbatim reproduction of any organization-specific logo, wordmark, official emblem, or registered trademark — where such brand-specific assets appear in the reference, leave those areas as clean placeholder space.)",
    },
    {
      icon: "NEW",
      text: "새 타이틀바 디자인 (참조 없이)",
      sub: "참조 이미지 없이 아래 헤더 디자인 옵션(배경·형태·슬롯 등)으로 타이틀바를 새로 설계",
      en: "title bar mode: design new from scratch — no reference image is used for the title bar. Build the title bar entirely from the detailed header design specifications below (header background, header shape, header line, header icon, header alignment, header height/color, slot ratio, slot contents) and from the defined color system and typography. Once designed, keep the title bar visually consistent across every slide of the deck — only the textual content (title, subtitle, page number) varies per page.",
    },
    {
      icon: "MIN",
      text: "타이틀바 최소화 / 없음",
      sub: "타이틀바를 거의 또는 전혀 그리지 않고 본문·메인 비주얼에 집중",
      en: "title bar mode: minimal or none — render the title bar with the absolute minimum visual footprint, or omit it entirely. Show only the bare title text on a clean background if needed; do NOT add decorative bars, logos, badges, accent lines, or icons in the header area. Page numbering, if needed, may appear as a small unobtrusive element. The goal is to maximize focus on the main content area.",
    },
  ],
  "reference-scope": [
    {
      icon: "HDR",
      text: "타이틀바만 참조",
      sub: "첨부 이미지는 상단 타이틀바 고정 기준으로만 사용하고, 본문 디자인은 아래 옵션을 적용",
      en: "reference image scope: title bar only — use the attached reference only to preserve the top title bar; apply the remaining options to the body/content area",
    },
    {
      icon: "FULL",
      text: "전체 디자인 참조",
      sub: "첨부 이미지를 전체 슬라이드 디자인 기준으로 사용하고, 중복되는 스타일·컬러·레이아웃 옵션은 최종 프롬프트에서 생략",
      en: "reference image scope: full-slide design reference — use the attached reference as the overall slide design standard; omit redundant style, color, layout, header, and footer options from the final prompt",
    },
  ],
  "page-number": [
    { icon: "OFF", text: "페이지 번호 없음", sub: "번호 표시 안 함", en: "page numbering: do not display any page numbers" },
    { icon: "BODY", text: "본문 번호만 표기", sub: "본문 슬라이드에만 번호 사용", en: "page numbering: show numbers only on body content slides, omit on cover, divider, and closing" },
    { icon: "ALL", text: "전체 번호 체계", sub: "모든 슬라이드에 일관되게 표기", en: "page numbering: display consistent page numbers across all slides in the deck" },
  ],
  "header-bg": [
    { icon: "TR", text: "투명 헤더", sub: "배경 없이 타이포그래피만 강조", en: "header background: transparent — no background fill; title text stands alone without a bar" },
    { icon: "WB", text: "화이트 바", sub: "밝고 정돈된 헤더 바", en: "header background: solid white bar — clean, bright header strip that separates title from content" },
    { icon: "DB", text: "짙은 색상 바", sub: "상단 구조가 또렷한 헤더 바", en: "header background: dark solid color bar — strong top-of-slide structure with high contrast title" },
  ],
  "header-line": [
    { icon: "VL", text: "세로 강조선", sub: "제목 왼쪽에 컬러 구조선 추가", en: "header accent line: vertical color rule on the left of the title — adds structural emphasis" },
    { icon: "HL", text: "가로 구분선", sub: "헤더 하단에 얇은 구분선", en: "header accent line: thin horizontal divider below the header — cleanly separates title from body" },
    { icon: "NL", text: "강조선 없음", sub: "선 없이 간결하게 구성", en: "header accent line: none — no decorative lines, clean typographic-only header" },
  ],
  "header-icon": [
    { icon: "IC", text: "아이콘 포함", sub: "섹션을 상징하는 아이콘 배치", en: "header element: include a symbolic icon representing the section theme" },
    { icon: "BD", text: "배지 포함", sub: "작은 라벨·배지 표시", en: "header element: include a small badge or label tag in the header area" },
    { icon: "NI", text: "아이콘 없음", sub: "텍스트 중심 헤더 구성", en: "header element: none — text-only header with no icons or badges" },
  ],
  "logo-handling": [
    { icon: "EMPTY", text: "로고 자리 비움", sub: "로고를 그리지 않고 자리만 비워둠 (가장 안전·권장)", en: "logo handling: leave the logo area as clean empty placeholder space — do NOT draw any logo, wordmark, brand mark, or emblem in this area. The space is reserved but visually blank, allowing the user to composite their own logo in post-production if desired" },
    { icon: "ABSTRACT", text: "추상 마크 자리표시자", sub: "단순 도형(원·사각형 등)으로 로고 자리만 표시", en: "logo handling: render a generic abstract placeholder shape (a simple circle, square, or geometric mark in the project's Primary color) where a logo would go — clearly NOT a real brand mark, just a neutral visual anchor. Do NOT generate anything resembling an existing organization's logo, wordmark, or emblem" },
    { icon: "USERLOGO", text: "사용자 후처리용 자리 확보", sub: "사용자가 본인 로고를 후처리에 직접 합성한다고 명시", en: "logo handling: reserve a clearly-bounded placeholder area where the user will composite their own logo separately in post-production. Mark the area with a faint outline or neutral fill, but do NOT generate any logo design — the user owns the brand identity and will add it themselves" },
    { icon: "NOLOGO", text: "로고 자체를 사용하지 않음", sub: "타이틀바·바닥글 어디에도 로고 영역을 만들지 않음", en: "logo handling: do not include any logo area at all in the slide design — neither in the title bar, nor in the footer, nor anywhere on the canvas. The slide relies on title text and brand colors only for identity, with no logo mark of any kind" },
  ],
  "header-slot-ratio": [
    { icon: "1:6:1", text: "제목 중심 (1:6:1)", sub: "좌우는 작게, 가운데 제목을 크게", en: "header slot ratio (Left:Center:Right) = 1:6:1 — narrow left and right slots with the center title slot dominating the header width" },
    { icon: "2:5:3", text: "균형형 (2:5:3)", sub: "좌측 라벨·우측 메타 정보를 균형 있게", en: "header slot ratio (Left:Center:Right) = 2:5:3 — balanced layout with a moderate left label area, a wide center title, and meaningful right metadata" },
    { icon: "0:8:2", text: "제목+페이지번호형 (0:8:2)", sub: "좌측 비움, 우측에 작은 메타 정보만", en: "header slot ratio (Left:Center:Right) = 0:8:2 — empty left slot, large center title spanning most of the header, and a compact right slot for metadata" },
    { icon: "3:7:0", text: "라벨+제목형 (3:7:0)", sub: "좌측에 카테고리 라벨, 우측은 비움", en: "header slot ratio (Left:Center:Right) = 3:7:0 — meaningful left label area paired with a wide center title; right slot is empty" },
  ],
  "header-slot-left": [
    { icon: "SEC", text: "섹션 번호 배지", sub: "예: PART 02 — 섹션 번호를 배지로 표시", en: "header LEFT slot content: section number badge (e.g. 'PART 02') rendered as a small visually distinct tag in Primary color, vertically centered within the left slot" },
    { icon: "VBAR", text: "컬러 인디케이터 바", sub: "Primary 컬러의 수직 강조선 1개", en: "header LEFT slot content: a vertical color accent bar in Primary color positioned at the very left edge of the header, acting as a visual anchor" },
    { icon: "LOGO", text: "브랜드 마크/로고", sub: "기관·팀 로고 또는 브랜드 마크", en: "header LEFT slot content: brand mark or organization/team logo placed inside the left slot, vertically centered, with appropriate clear space" },
    { icon: "CAT", text: "카테고리 라벨", sub: "예: 'STRATEGY' — 작은 영문 라벨", en: "header LEFT slot content: a small uppercase category label (e.g. 'STRATEGY', 'OVERVIEW') in Secondary color and tracking-wide letter-spacing" },
    { icon: "NONE", text: "비움", sub: "좌측 슬롯에 콘텐츠 없음", en: "header LEFT slot content: empty — no content placed in the left slot, the space is left clean" },
  ],
  "header-slot-center": [
    { icon: "TIT", text: "슬라이드 제목 (단일 라인)", sub: "큰 글씨의 슬라이드 제목 한 줄", en: "header CENTER slot content: a single line of slide title text rendered in title typography (bold, large), occupying the center slot in a single line; the title text changes per page" },
    { icon: "T+S", text: "제목 + 한 줄 부제 (2단)", sub: "큰 제목 위/아래에 작은 부제", en: "header CENTER slot content: two-tier composition — slide title (large, bold) with a short subtitle line directly above or below it (smaller, lighter weight); both texts change per page" },
    { icon: "L+T", text: "카테고리 라벨 + 제목 (2단)", sub: "작은 라벨 위, 큰 제목 아래", en: "header CENTER slot content: two-tier composition — small uppercase category label on top (Secondary color, tracking-wide) with the main slide title below it (large, bold); both elements change per page" },
    { icon: "TXT", text: "비움 (제목을 본문으로 내림)", sub: "타이틀바에는 텍스트 없음, 제목은 본문 영역으로", en: "header CENTER slot content: empty — no text in the center slot; the slide title is displayed in the main content area below the header instead" },
  ],
  "header-slot-right": [
    { icon: "PG", text: "페이지 번호", sub: "예: 03 / 12", en: "header RIGHT slot content: page number indicator (e.g. '03 / 12') aligned to the right of the slot, in Secondary color, smaller weight than the title" },
    { icon: "DAT", text: "발표 일자", sub: "예: 2026.05.04", en: "header RIGHT slot content: presentation date (e.g. '2026.05.04') in Secondary color, smaller weight, right-aligned" },
    { icon: "ORG", text: "기관/팀 로고", sub: "우측에 작은 보조 로고", en: "header RIGHT slot content: secondary organization or team logo placed in the right slot, smaller in size, right-aligned" },
    { icon: "PRG", text: "진행 인디케이터", sub: "점·선 형태의 진행 표시", en: "header RIGHT slot content: progress indicator (a row of dots or a thin progress bar) showing the current slide position within the deck" },
    { icon: "NONE", text: "비움", sub: "우측 슬롯에 콘텐츠 없음", en: "header RIGHT slot content: empty — no content placed in the right slot, the space is left clean" },
  ],
  "footer-bar": [
    { icon: "LINE", text: "선 형태", sub: "얇은 라인 하나로 본문과 바닥글을 구분", en: "footer style: line-only — a single thin horizontal line separating the main content area from the footer text. No filled bar, no background block, just a divider line." },
    { icon: "BAR",  text: "바 형태", sub: "솔리드 색상의 띠로 바닥글 영역을 명확히 구획", en: "footer style: filled bar — a solid full-width horizontal bar at the bottom of the slide that clearly demarcates the footer zone. The bar has its own background color and contains the footer content inside it." },
    { icon: "NONE", text: "없음", sub: "바닥글 영역을 만들지 않음 (콘텐츠도 없음)", en: "footer style: none — do not render any footer area at all. No line, no bar, no footer content. The bottom edge of the slide is left as clean margin." },
  ],
  "footer-elem": [
    { icon: "PG",   text: "페이지 넘버",       sub: "예: 03 / 12 — 페이지 번호 표시", en: "footer content: page number indicator (e.g. '03 / 12'), rendered as a small unobtrusive text element in Secondary color, kept consistent across all slides" },
    { icon: "TXT",  text: "반복 문구",         sub: "기관명·발표 제목·저작권 등 모든 페이지에 동일하게 반복되는 짧은 문구", en: "footer content: a recurring text string repeated identically on every slide — typically the organization name, the presentation title, the copyright notice, or a short fixed tagline. The text content does NOT change per page; only the page number does." },
    { icon: "DAT",  text: "발표 일자",         sub: "예: 2026.05.04 — 모든 페이지에 동일 표기", en: "footer content: presentation date (e.g. '2026.05.04'), displayed identically on every slide as a small text element" },
    { icon: "LOGO", text: "로고",               sub: "기관·팀 로고를 작게 반복 표기", en: "footer content: a small organization or team logo repeated identically on every slide; smaller in size than any header logo" },
    { icon: "PRG",  text: "섹션 진행 인디케이터", sub: "점·짧은 선 형태로 현재 섹션 위치 표시", en: "footer content: a section progress indicator (a row of dots or a short progress bar) showing the current slide's position within the deck; updates per page based on the slide index but uses an identical visual treatment on every slide" },
  ],
  content: [
    { icon: "TXT", text: "텍스트 목록", sub: "글머리 기호와 짧은 설명 중심", en: "content layout: structured bullet-point list with short descriptive lines" },
    { icon: "FLOW", text: "스토리 흐름도", sub: "논리 흐름을 화살표로 연결", en: "content layout: narrative flow diagram — sequential steps connected by arrows" },
    { icon: "DATA", text: "데이터 시각화", sub: "차트·수치 블록 중심 구성", en: "content layout: data visualization — charts, graphs, and metric blocks as primary elements" },
    { icon: "CARD", text: "카드 그리드", sub: "핵심 포인트를 카드로 구분", en: "content layout: card grid — each key point enclosed in a distinct card block" },
    { icon: "IMG", text: "이미지 갤러리", sub: "실사·장면 중심 구성", en: "content layout: image gallery — photographic or scene-based visuals as the dominant element" },
    { icon: "MAP", text: "개념도/다이어그램", sub: "구조와 관계를 도식으로 설명", en: "content layout: concept map or relationship diagram — visual representation of structure and connections" },
    { icon: "RVW", text: "심사 포인트 박스", sub: "체크리스트·주목 포인트 강조", en: "content layout: reviewer focus checklist — highlighted evaluation criteria and key attention points" },
    { icon: "COV", text: "표지/인트로", sub: "한 문장과 강한 비주얼 중심", en: "content layout: cover or intro — single bold headline with a dominant full-bleed visual" },
    { icon: "PHC", text: "실사 합성 카드", sub: "정보 카드 옆에 산업 현장 실사 이미지 합성", en: "content layout: photorealistic composite cards — each information card paired with an authentic industry/site photograph that conveys the real-world context, dramatically increasing depth and credibility over generic icons" },
    { icon: "TL", text: "타임라인", sub: "연도·월·단계별 변화 흐름", en: "content layout: timeline — dated or phased milestones arranged along a clear chronological line" },
    { icon: "RD", text: "로드맵", sub: "단계별 목표·실행 과제·마일스톤", en: "content layout: roadmap — future phases, key actions, milestones, and dependencies" },
    { icon: "KPI", text: "KPI 지표 카드", sub: "핵심 수치와 상태를 카드로 요약", en: "content layout: KPI metric cards — key numbers, labels, and status indicators in readable cards" },
    { icon: "CMP", text: "비교표", sub: "대안·조건·기능 차이를 표로 비교", en: "content layout: comparison table — structured comparison of alternatives, criteria, features, or conditions" },
    { icon: "PROC", text: "프로세스 단계도", sub: "업무·정책·서비스 절차를 단계로 표현", en: "content layout: process step diagram — sequential workflow, policy process, or service procedure stages" },
  ],
  "text-policy": [
    { icon: "CTX", text: "스크립트는 맥락 참고용만", sub: "슬라이드 본문에는 원문 삽입 안 함", en: "text policy: use the provided script for context only — do not place raw script text on the slide" },
    { icon: "KEY", text: "제목과 핵심 키워드만 반영", sub: "전체 문장 대신 핵심 메시지 중심", en: "text policy: reflect only the title and core keywords extracted from the script" },
    { icon: "NUM", text: "수치와 고유명사만 반영", sub: "검증된 수치·고유명사 위주", en: "text policy: reflect only specific figures, proper nouns, and verifiable facts from the script" },
    { icon: "SUM", text: "짧은 요약 문장 허용", sub: "필요할 때만 1~2문장 사용", en: "text policy: allow one or two short summary sentences when necessary for clarity" },
  ],
  "header-shape": [
    { icon: "REC", text: "직각형", sub: "모서리 없는 각진 헤더 바", en: "header bar shape: sharp rectangular, no rounded corners" },
    { icon: "RND", text: "둥근 모서리형", sub: "부드럽게 라운딩된 헤더 바", en: "header bar shape: softly rounded corners for a modern look" },
    { icon: "SLT", text: "사선 커팅형", sub: "오른쪽 끝을 사선으로 절단", en: "header bar shape: diagonal cut on the right edge for dynamic styling" },
    { icon: "PNT", text: "포인트 꼬리형", sub: "오른쪽에 화살표형 꼬리 추가", en: "header bar shape: arrow-point tail on the right side for directional emphasis" },
  ],
  "header-align": [
    { icon: "L", text: "좌측 정렬", sub: "타이틀을 왼쪽에 배치", en: "header title alignment: left-aligned" },
    { icon: "C", text: "중앙 정렬", sub: "타이틀을 중앙에 배치", en: "header title alignment: centered" },
    { icon: "R", text: "우측 정렬", sub: "타이틀을 오른쪽에 배치", en: "header title alignment: right-aligned" },
  ],
  "footer-align": [
    { icon: "L", text: "좌측 정렬", sub: "하단 요소를 왼쪽에 배치", en: "footer elements alignment: left-aligned" },
    { icon: "C", text: "중앙 정렬", sub: "하단 요소를 중앙에 배치", en: "footer elements alignment: centered" },
    { icon: "R", text: "우측 정렬", sub: "하단 요소를 오른쪽에 배치", en: "footer elements alignment: right-aligned" },
    { icon: "SP", text: "양끝 분산", sub: "왼쪽·오른쪽에 분산 배치", en: "footer elements alignment: space-between, distributed to both ends" },
  ],
  "footer-shape": [
    { icon: "L-THN",  text: "[선] 얇은 단일 라인",     sub: "1px 정도의 얇은 가로 라인 한 줄", en: "footer line shape: a single thin (1px-equivalent) horizontal divider line spanning the full slide width, rendered in Secondary color" },
    { icon: "L-DBL",  text: "[선] 더블 라인",          sub: "얇은 가로 라인 2줄을 좁은 간격으로", en: "footer line shape: two parallel thin horizontal divider lines with a narrow gap between them, both in Secondary color" },
    { icon: "L-DSH",  text: "[선] 점선/대시",          sub: "점선 또는 대시 형태의 가로 구분선", en: "footer line shape: a dashed or dotted horizontal divider line spanning the slide width, in Secondary color" },
    { icon: "B-REC",  text: "[바] 직각 솔리드",         sub: "직각 모서리의 솔리드 색상 띠", en: "footer bar shape: a solid full-width filled bar with sharp rectangular corners, no rounding" },
    { icon: "B-RND",  text: "[바] 둥근 모서리",         sub: "양끝이 부드럽게 라운딩된 솔리드 띠", en: "footer bar shape: a solid full-width filled bar with softly rounded left and right corners" },
    { icon: "B-INS",  text: "[바] 인셋 박스형",         sub: "양끝 여백을 두고 슬라이드 안쪽으로 들어간 박스형", en: "footer bar shape: an inset filled bar with margin on both left and right sides, set inside the slide rather than spanning edge-to-edge, with rounded corners" },
    { icon: "B-TOP",  text: "[바] 상단 강조선 + 솔리드", sub: "솔리드 바 상단에 얇은 강조 컬러 라인 추가", en: "footer bar shape: a solid filled bar with a thin Accent-colored line on its TOP edge as an additional emphasis stripe" },
  ],
  "photo-composite": [
    { icon: "OFF", text: "사용 안 함", sub: "실사 합성을 사용하지 않고 그래픽·아이콘 중심 구성", en: "photorealistic composite: disabled — rely on graphics, icons, and illustrations only, no real photography" },
    { icon: "CARD", text: "정보 카드 주변", sub: "카드 내부·옆·코너에 관련 실사 컷을 배치", en: "photorealistic application element: around information cards — place relevant authentic photo cuts inside, beside, or near information cards as supporting visual evidence" },
    { icon: "BG", text: "저채도 배경 레이어", sub: "흐릿하고 낮은 채도의 실사 이미지를 배경 맥락으로 사용", en: "photorealistic application element: low-saturation background layer — use a softly blurred, low-opacity authentic photo layer as contextual background without competing with foreground information" },
    { icon: "CUT", text: "포인트 보조 컷", sub: "핵심 수치·키워드 주변에 작은 실사 컷 1~2개 배치", en: "photorealistic application element: supporting accent cuts — add one or two small authentic photo cuts near key figures or keywords as visual anchors" },
    { icon: "HERO", text: "대형 히어로 영역", sub: "한쪽 영역에 큰 실사 장면을 두고 정보 패널과 결합", en: "photorealistic application element: large hero area — reserve one major region for a strong authentic photo scene combined with readable information panels" },
  ],
  "photo-subject": [
    { icon: "FAC", text: "산업 현장·시설", sub: "공장, 플랜트, 생산라인, 설비 전경", en: "photo subject: industrial facility — factory, plant, production line, manufacturing equipment, or large-scale infrastructure shots" },
    { icon: "TEAM", text: "전문 인력·작업 장면", sub: "엔지니어·연구원·작업자의 실제 작업 모습", en: "photo subject: professional teams at work — engineers, researchers, technicians shown actively working in authentic professional environments" },
    { icon: "MAT", text: "원료·소재·제품", sub: "원료 광물, 가공 소재, 완성 제품 클로즈업", en: "photo subject: raw materials and products — close-up shots of raw minerals, processed materials, components, or finished products" },
    { icon: "AER", text: "항공·드론 뷰", sub: "단지·도시·지역 인프라의 항공 촬영 뷰", en: "photo subject: aerial or drone perspective — bird's-eye views of industrial complexes, regional infrastructure, or urban developments" },
    { icon: "LAB", text: "연구실·실험 장면", sub: "R&D 시설, 분석 장비, 실험 진행 장면", en: "photo subject: laboratory and R&D — research facilities, analytical instruments, scientific experiments in progress" },
    { icon: "MIX", text: "혼합 구성", sub: "위 주제들을 슬라이드 내용에 맞게 자연스럽게 조합", en: "photo subject: mixed composition — combine the subjects above naturally to match the slide content and storytelling needs" },
  ],
  "forbidden-rules": [
    { icon: "NO2", text: "과도한 장식 금지", sub: "과한 3D·글로우·유리효과 배제", en: "do NOT use excessive decoration — no heavy glow effects, overly ornate 3D, or thick glassmorphism overlays" },
    { icon: "NO5", text: "과밀 레이아웃 금지", sub: "텍스트 과다·여백 부족 배제", en: "do NOT create an overcrowded layout — avoid dense text blocks and insufficient breathing space" },
    { icon: "NO6", text: "부자연스러운 합성 금지", sub: "어색한 손·얼굴·물체 배제", en: "do NOT produce unnatural compositing — avoid distorted hands, faces, or physically impossible objects" },
    { icon: "NO7", text: "미지정 요소 추가 금지", sub: "명세 외 요소·장식·텍스트 추가 금지", en: "do NOT add any elements, decorations, or text not explicitly described in this specification" },
    { icon: "LOGO", text: "가짜 로고/상표 생성 금지", sub: "실존 로고·상표·기관 엠블럼 임의 생성 방지", en: "do NOT invent or imitate logos, trademarks, wordmarks, official seals, or organization emblems" },
    { icon: "NUM", text: "임의 수치·출처 생성 금지", sub: "사용자가 준 수치와 출처만 사용", en: "do NOT fabricate numbers, sources, citations, dates, or proper nouns not provided by the user" },
    { icon: "OVF", text: "텍스트 박스 넘침 금지", sub: "글자가 박스 밖으로 삐져나오거나 겹치지 않게", en: "do NOT let text overflow boxes, collide with other elements, or become clipped at the edges" },
    { icon: "CTR", text: "낮은 대비 금지", sub: "본문·수치·CTA가 배경과 충분히 대비되게", en: "do NOT use low contrast between text, numbers, CTA elements, and the background" },
    { icon: "CHT", text: "차트 축·범례 왜곡 금지", sub: "축·범례·라벨·숫자 위치 왜곡 방지", en: "do NOT distort chart axes, legends, labels, tick marks, or numeric placement" },
    { icon: "KR", text: "한글 자간/줄바꿈 깨짐 금지", sub: "한글 자모 분리·깨짐·부자연스러운 줄바꿈 방지", en: "do NOT break Korean typography — avoid split jamo, malformed glyphs, awkward spacing, or unnatural line breaks" },
  ],
};

const OPTION_TEXT_MIGRATIONS = {
  material: {
    "유리/글래스모피즘": "글래스모피즘",
    "부드러운 무광": "무광/페이퍼",
    "페이퍼/미니멀": "무광/페이퍼",
    "플랫 아이콘/벡터": "플랫 벡터",
  },
  lighting: {
    "글로벌 일루미네이션": "깊이감 있는 레이어",
    "대비가 강한 조명": "강한 대비 조명",
  },
  bg: {
    "다층 레이어 배경": "다층 배경면",
  },
  palette: {
    "코퍼레이트 블루": "기업 블루",
    "프로페셔널 차콜": "차콜 그레이",
    "테크 퍼플": "연구 퍼플",
    "포레스트 그린": "ESG 그린",
    "사이버 펑크": "산업 슬레이트",
    "미니멀 그레이": "차콜 그레이",
    "내추럴 세이지": "ESG 그린",
    "테라코타": "제안서 오렌지",
    "럭셔리 골드": "프리미엄 골드",
    "선셋 오렌지": "제안서 오렌지",
    "럭셔리 오렌지": "제안서 오렌지",
    "럭셔리 민트": "바이오 틸",
    "테크니컬 스킴": "행정 네이비",
  },
  "bg-style": {
    "기하학적 무늬": "기하학 도형",
    "관련 이미지 배경": "주제 관련 이미지",
  },
  pattern: {
    "패턴 없음": "보조 모티프 없음",
    "기하학 패턴": "기하학 보조선",
    "노이즈/그레인": "미세 그레인",
  },
};

const QUALITY_TO_RENDER_STYLE_MIGRATIONS = {
  "실사 기반 합성": "실사 기반 합성",
  "고급 레이어 합성": "고급 레이어 합성",
};

const QUALITY_TO_VISUAL_EFFECT_MIGRATIONS = {
  "세부 디테일 강조": "깊이감 있는 레이어",
};

function normalizeOptionText(key, text) {
  const raw = String(text || "");
  return OPTION_TEXT_MIGRATIONS[key]?.[raw] || raw;
}

function migrateSelectionSnapshotForMece(selections = {}) {
  const next = { ...selections };
  const asArray = (value) => Array.isArray(value) ? value.filter(Boolean) : (value ? [value] : []);
  const textOf = (item) => typeof item === "object" && item ? item.text : item;
  const hasValue = (key) => {
    const value = next[key];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  };
  const setSingle = (key, value) => {
    if (!value || hasValue(key)) return;
    next[key] = value;
  };
  const appendMulti = (key, value) => {
    if (!value) return;
    const values = asArray(next[key]).map(textOf);
    if (!values.includes(value)) values.push(value);
    next[key] = values;
  };

  const quality = asArray(next.quality).map(textOf);
  const cleanedQuality = [];

  quality.forEach((item) => {
    if (QUALITY_TO_RENDER_STYLE_MIGRATIONS[item]) {
      setSingle("material", QUALITY_TO_RENDER_STYLE_MIGRATIONS[item]);
      if (item === "실사 기반 합성") appendMulti("screen-elements", "실사 이미지");
      if (item === "고급 레이어 합성") setSingle("lighting", "깊이감 있는 레이어");
      return;
    }
    if (QUALITY_TO_VISUAL_EFFECT_MIGRATIONS[item]) {
      setSingle("lighting", QUALITY_TO_VISUAL_EFFECT_MIGRATIONS[item]);
      return;
    }
    cleanedQuality.push(item);
  });
  next.quality = cleanedQuality;

  Object.keys(OPTION_TEXT_MIGRATIONS).forEach((key) => {
    const value = next[key];
    if (Array.isArray(value)) {
      next[key] = value.map((item) => normalizeOptionText(key, textOf(item)));
      return;
    }
    if (value) next[key] = normalizeOptionText(key, textOf(value));
  });

  if (next["bg-style"] === "단색 배경") {
    if (!hasValue("bg")) next.bg = "단색 배경";
    next["bg-style"] = "장식 없음 (기본)";
  }

  if (asArray(next["photo-composite"]).map(textOf).some((item) => item !== "사용 안 함")) {
    appendMulti("screen-elements", "실사 이미지");
  }

  return next;
}

const DEFAULT_COLOR_SYSTEM = {
  primary: "#004DB0",
  secondary: "#7C8BA0",
  accent: "#1F5EFF",
  accentWeight: 15,
  backgroundBlock: "#F5F6F7",
  text: "#111111",
};

const COLOR_PRESETS = {
  "공공 블루": { primary: "#005BAC", secondary: "#6B7A8F", accent: "#D63B32", accentWeight: 10, text: "#111827", backgroundBlock: "#F3F6FA" },
  "행정 네이비": { primary: "#12355B", secondary: "#6C7A89", accent: "#2F80ED", accentWeight: 12, text: "#111827", backgroundBlock: "#F4F7FB" },
  "기업 블루": { primary: "#004DB0", secondary: "#7C8BA0", accent: "#1F5EFF", accentWeight: 15, text: "#111111", backgroundBlock: "#F5F6F7" },
  "차콜 그레이": { primary: "#2F343B", secondary: "#808A96", accent: "#2563EB", accentWeight: 10, text: "#151A20", backgroundBlock: "#F4F5F7" },
  "금융 그린": { primary: "#0F5132", secondary: "#6E7F75", accent: "#C9A227", accentWeight: 10, text: "#102019", backgroundBlock: "#F3F7F4" },
  "산업 슬레이트": { primary: "#334155", secondary: "#64748B", accent: "#D97706", accentWeight: 12, text: "#111827", backgroundBlock: "#F1F5F9" },
  "바이오 틸": { primary: "#007C89", secondary: "#7A8F95", accent: "#31A354", accentWeight: 12, text: "#102A31", backgroundBlock: "#F0F7F8" },
  "연구 퍼플": { primary: "#4C3F91", secondary: "#7B6FA8", accent: "#2F80ED", accentWeight: 12, text: "#1F1B2D", backgroundBlock: "#F5F3FA" },
  "ESG 그린": { primary: "#2D5A27", secondary: "#738A6E", accent: "#E0A100", accentWeight: 12, text: "#1A1F1A", backgroundBlock: "#F0F4EF" },
  "제안서 오렌지": { primary: "#C2410C", secondary: "#8B8F98", accent: "#2563EB", accentWeight: 14, text: "#1F2937", backgroundBlock: "#FFF7ED" },
  "프리미엄 골드": { primary: "#1F2937", secondary: "#6B7280", accent: "#B88A00", accentWeight: 8, text: "#111827", backgroundBlock: "#F8F6F0" },
  "다크 포인트": { primary: "#111827", secondary: "#4B5563", accent: "#38BDF8", accentWeight: 10, text: "#F9FAFB", backgroundBlock: "#1F2937" },
  "화이트 포인트": { primary: "#111827", secondary: "#6B7280", accent: "#2563EB", accentWeight: 10, text: "#111827", backgroundBlock: "#FFFFFF" },
};

const CONTENT_FILTERS = {
  cover: ["표지/인트로", "이미지 갤러리", "카드 그리드"],
  agenda: ["스토리 흐름도", "텍스트 목록", "카드 그리드", "개념도/다이어그램", "심사 포인트 박스", "타임라인", "로드맵", "프로세스 단계도"],
  divider: ["표지/인트로", "텍스트 목록", "카드 그리드", "타임라인"],
  body: null,
  closing: ["표지/인트로", "카드 그리드", "텍스트 목록", "로드맵"],
};

const PAGE_INSTRUCTION_PREFIX = {
  cover: {
    ko: "아래 명세에 따라 발표자료의 표지 슬라이드 이미지 1장을 생성합니다. 발표 제목·핵심 메시지·기관/팀 정보를 첫 화면에서 명확하게 전달하세요.",
    en: "Generate one cover slide image for a presentation based on the specifications below. Clearly deliver the presentation title, key message, and organization/team information.",
  },
  agenda: {
    ko: "아래 명세에 따라 발표자료의 목차·발표 개요 슬라이드 이미지 1장을 생성합니다. 발표 전체의 흐름, 파트 순서, 핵심 논증 구조를 한눈에 이해되도록 구성하세요.",
    en: "Generate one agenda or presentation overview slide image based on the specifications below. Make the overall flow, part order, and core argument structure easy to understand at a glance.",
  },
  divider: {
    ko: "아래 명세에 따라 발표자료의 섹션 구분 슬라이드 이미지 1장을 생성합니다. 섹션 제목과 전환 메시지가 명확하게 보이도록 구성하세요.",
    en: "Generate one section divider slide image based on the specifications below. Make the section title and transition message clear.",
  },
  body: {
    ko: "아래 명세에 따라 발표자료의 본문 슬라이드 이미지 1장을 생성합니다. 핵심 데이터·논리·시각 구조를 명확하고 읽기 쉽게 전달하세요.",
    en: "Generate one body content slide image based on the specifications below. Clearly deliver the key data, logic, and visual structure with strong readability.",
  },
  closing: {
    ko: "아래 명세에 따라 발표자료의 맺음말 슬라이드 이미지 1장을 생성합니다. 마무리 메시지, 행동 유도, 다음 단계 또는 문의 정보를 명확하게 전달하세요.",
    en: "Generate one closing slide image based on the specifications below. Clearly deliver the closing message, call to action, next steps, or contact information.",
  },
};

const INPUT_GUIDES = {
  cover: {
    title: "표지 문구 입력",
    subtitle: "발표 제목, 기관명, 부제처럼 실제로 노출할 문구만 입력합니다.",
    hint: "아래 예시는 입력 형식 안내일 뿐이며, 사용자가 직접 입력한 내용만 프롬프트에 전달됩니다.",
    placeholder: "예) 포항 이차전지 특화단지 지정 전략",
    defaultText: `[필수 입력]
- 발표 제목:
- 부제 또는 핵심 메시지:
- 기관/팀명:
- 발표 일자 또는 행사명:`,
  },
  agenda: {
    title: "목차/발표 개요 입력",
    subtitle: "PART 구성, 흐름, 주목 포인트처럼 목차 페이지에 실제로 보여줄 내용만 입력합니다.",
    hint: "아래 예시는 입력 형식 안내일 뿐이며, 사용자가 직접 입력한 내용만 프롬프트에 전달됩니다.",
    placeholder: "예) PART 1 왜 지금인가, PART 2 왜 포항인가, PART 3 무엇을 할 것인가",
    defaultText: `[필수 입력]
- 슬라이드 제목:
- PART 구성:
- 발표 흐름 요약 1문장:
- 심사위원 주목 포인트:`,
  },
  divider: {
    title: "구분페이지 문구 입력",
    subtitle: "섹션 제목과 짧은 설명 1~2문장만 입력합니다.",
    hint: "아래 예시는 입력 형식 안내일 뿐이며, 사용자가 직접 입력한 내용만 프롬프트에 전달됩니다.",
    placeholder: "예) PART 2. 왜 포항인가? 국내 유일의 LFP+ 거점 구조를 설명합니다.",
    defaultText: `[필수 입력]
- 섹션 제목:
- 짧은 설명 1문장:
- 필요 시 보조 설명 1문장:`,
  },
  body: {
    title: "실제 본문 내용 입력",
    subtitle: "슬라이드 안에 반영할 제목, 수치, 구조, 키 메시지만 입력합니다.",
    hint: "아래 예시는 입력 형식 안내일 뿐이며, 사용자가 직접 입력한 내용만 프롬프트에 전달됩니다.",
    placeholder: "예) 공급망 90% 중국 의존, 75개 소부장사 집적, 14조 투자효과",
    defaultText: `[필수 입력]
- 슬라이드 제목:
- 핵심 메시지 1문장:
- 반드시 들어갈 수치/지표:
- 반드시 들어갈 키워드/고유명사:
- 원하는 도식 또는 이미지 요소:`,
  },
  closing: {
    title: "맺음말 문구 입력",
    subtitle: "감사 문구, CTA, 다음 단계, 문의처처럼 직접 노출할 문장만 입력합니다.",
    hint: "아래 예시는 입력 형식 안내일 뿐이며, 사용자가 직접 입력한 내용만 프롬프트에 전달됩니다.",
    placeholder: "예) 감사합니다. 다음 단계는 특화단지 지정과 기업 투자 연계입니다.",
    defaultText: `[필수 입력]
- 감사 또는 마무리 메시지:
- CTA 또는 지정 요청 문장:
- 다음 단계:
- 문의처 또는 담당 조직:`,
  },
};

const AUTO_FORBIDDEN_RULES = {
  common: [
    {
      ko: "깨진 한글, 오탈자, 비정상적으로 렌더링된 글자를 생성하지 말 것",
      en: "do NOT generate broken Korean characters, visible typos, or any malformed typography",
    },
  ],
  cover: [
    {
      ko: "표지 슬라이드에는 출처, 페이지 번호, 복잡한 푸터, 표 중심 구성을 넣지 말 것 — 임팩트 있는 메시지와 비주얼에 집중할 것",
      en: "do NOT add source citations, page numbers, dense footer information, or table-heavy layouts on the cover slide — focus on impactful title and visual",
    },
  ],
  agenda: [
    {
      ko: "목차·발표 개요 슬라이드에는 긴 문단, 과도한 실사 배경, 불필요한 장식 이미지를 넣지 말 것 — 구조 전달이 핵심임",
      en: "do NOT use long paragraphs, dramatic photographic backgrounds, or decorative imagery on the agenda slide — structural clarity is the priority",
    },
  ],
  divider: [
    {
      ko: "구분 슬라이드에는 복잡한 차트, 세부 KPI 블록, 출처, 페이지 번호를 넣지 말 것 — 섹션 제목과 전환 메시지에만 집중할 것",
      en: "do NOT add complex charts, KPI blocks, source citations, or page numbers on a section divider slide — keep the focus on the section title and transition message",
    },
  ],
  body: [
    {
      ko: "본문 슬라이드에서는 내용과 무관한 배경 이미지나 장식 요소만 많은 비주얼을 사용하지 말 것 — 모든 시각 요소는 정보 전달에 기여해야 함",
      en: "do NOT use decorative-only visuals or background imagery unrelated to the content on a body slide — every visual element must support the information being conveyed",
    },
  ],
  closing: [
    {
      ko: "맺음말 슬라이드에서는 출처, KPI 블록, 페이지 번호 등이 CTA와 마무리 메시지의 전달을 방해하지 않도록 할 것",
      en: "do NOT let source citations, KPI blocks, or page numbering compete with the closing message and call-to-action on the closing slide",
    },
  ],
};

const PAGE_RULES = {
  cover: {
    disabledKeys: ["page-number", "header-bg", "header-shape", "header-line", "header-icon", "header-align", "header-bar-settings", "header-slot-ratio", "header-slot-left", "header-slot-center", "header-slot-right", "footer-bar", "footer-shape", "footer-elem", "footer-align", "footer-bar-settings"],
    reasons: {
      "page-number": "표지는 번호보다 메시지와 비주얼 집중이 우선입니다.",
      "header-bg": "표지는 별도 헤더 장식보다 메인 비주얼 중심 구성이 더 자연스럽습니다.",
      "header-shape": "표지는 별도 헤더 장식보다 메인 비주얼 중심 구성이 더 자연스럽습니다.",
      "header-line": "표지는 별도 헤더 장식보다 메인 비주얼 중심 구성이 더 자연스럽습니다.",
      "header-icon": "표지는 별도 헤더 장식보다 메인 비주얼 중심 구성이 더 자연스럽습니다.",
      "header-align": "표지는 헤더 정렬보다 메인 비주얼 집중이 우선입니다.",
      "header-bar-settings": "표지는 상단바 높이·컬러보다 메인 비주얼과 제목 구성이 우선입니다.",
      "header-slot-ratio": "표지는 타이틀바 슬롯 구조 대신 메인 비주얼·제목 중심 구성을 사용합니다.",
      "header-slot-left": "표지는 타이틀바 슬롯 구조 대신 메인 비주얼·제목 중심 구성을 사용합니다.",
      "header-slot-center": "표지는 타이틀바 슬롯 구조 대신 메인 비주얼·제목 중심 구성을 사용합니다.",
      "header-slot-right": "표지는 타이틀바 슬롯 구조 대신 메인 비주얼·제목 중심 구성을 사용합니다.",
      "footer-bar": "표지는 하단 바 없이 여백을 주는 편이 더 안정적입니다.",
      "footer-shape": "표지는 하단 바 형태 설정보다 비주얼 여백이 중요합니다.",
      "footer-elem": "표지는 KPI, 출처, 페이지 번호 같은 하단 요소를 보통 사용하지 않습니다.",
      "footer-align": "표지는 하단 정렬보다 비주얼 집중이 우선입니다.",
      "footer-bar-settings": "표지는 하단바 높이·컬러보다 메인 비주얼 여백이 중요합니다.",
    },
  },
  agenda: {
    disabledKeys: ["footer-bar", "footer-shape", "footer-elem", "footer-align", "footer-bar-settings"],
    reasons: {
      "footer-bar": "목차/발표 개요는 구조 전달이 핵심이라 무거운 하단 바가 오히려 시선을 분산시킵니다.",
      "footer-shape": "목차/발표 개요에서는 하단 장식보다 발표 흐름 구조가 우선입니다.",
      "footer-elem": "목차/발표 개요에서는 반복 하단 요소보다 파트 구성과 흐름이 우선입니다.",
      "footer-align": "목차/발표 개요에서는 하단 정렬보다 목차 구조의 가독성이 우선입니다.",
      "footer-bar-settings": "목차/발표 개요에서는 하단바 높이·컬러보다 전체 흐름 구조가 우선입니다.",
    },
  },
  divider: {
    disabledKeys: ["page-number", "header-bg", "header-shape", "header-line", "header-icon", "header-align", "header-bar-settings", "header-slot-ratio", "header-slot-left", "header-slot-center", "header-slot-right", "footer-bar", "footer-shape", "footer-elem", "footer-align", "footer-bar-settings"],
    reasons: {
      "page-number": "구분 슬라이드는 전환 역할이 중심이라 번호 표시의 우선순위가 낮습니다.",
      "header-bg": "구분 슬라이드는 섹션 제목과 한 줄 설명에 집중하도록 헤더 장식을 줄입니다.",
      "header-shape": "구분 슬라이드는 헤더 형태보다 전환 메시지에 집중합니다.",
      "header-line": "구분 슬라이드는 섹션 제목과 한 줄 설명에 집중하도록 헤더 장식을 줄입니다.",
      "header-icon": "구분 슬라이드는 섹션 제목과 한 줄 설명에 집중하도록 헤더 장식을 줄입니다.",
      "header-align": "구분 슬라이드는 헤더 정렬보다 전환 메시지 집중이 우선입니다.",
      "header-bar-settings": "구분 슬라이드는 상단바 높이·컬러보다 섹션 전환 메시지가 우선입니다.",
      "header-slot-ratio": "구분 슬라이드는 타이틀바 슬롯 구조보다 섹션 제목·전환 메시지 중심 구성을 사용합니다.",
      "header-slot-left": "구분 슬라이드는 타이틀바 슬롯 구조보다 섹션 제목·전환 메시지 중심 구성을 사용합니다.",
      "header-slot-center": "구분 슬라이드는 타이틀바 슬롯 구조보다 섹션 제목·전환 메시지 중심 구성을 사용합니다.",
      "header-slot-right": "구분 슬라이드는 타이틀바 슬롯 구조보다 섹션 제목·전환 메시지 중심 구성을 사용합니다.",
      "footer-bar": "구분 슬라이드는 장면 전환용이므로 하단 강조를 비웁니다.",
      "footer-shape": "구분 슬라이드는 하단 바 형태보다 전환 메시지가 중요합니다.",
      "footer-elem": "구분 슬라이드는 KPI, 출처보다 섹션 전환이 더 중요합니다.",
      "footer-align": "구분 슬라이드는 하단 정렬보다 전환 메시지 집중이 우선입니다.",
      "footer-bar-settings": "구분 슬라이드는 하단바 높이·컬러보다 전환 메시지 집중이 우선입니다.",
    },
  },
  body: {
    disabledKeys: [],
    reasons: {},
  },
  closing: {
    disabledKeys: ["page-number", "header-bg", "header-shape", "header-line", "header-icon", "header-align", "header-bar-settings", "header-slot-ratio", "header-slot-left", "header-slot-center", "header-slot-right", "footer-bar", "footer-shape", "footer-elem", "footer-align", "footer-bar-settings"],
    reasons: {
      "page-number": "맺음말은 번호보다 마무리 메시지와 CTA 전달이 중요합니다.",
      "header-bg": "맺음말은 헤더 장식보다 감사 문구와 다음 단계에 집중하도록 단순화합니다.",
      "header-shape": "맺음말은 헤더 형태보다 마무리 메시지 집중이 우선입니다.",
      "header-line": "맺음말은 헤더 장식보다 감사 문구와 다음 단계에 집중하도록 단순화합니다.",
      "header-icon": "맺음말은 헤더 장식보다 감사 문구와 다음 단계에 집중하도록 단순화합니다.",
      "header-align": "맺음말은 헤더 정렬보다 마무리 메시지 집중이 우선입니다.",
      "header-bar-settings": "맺음말은 상단바 높이·컬러보다 CTA와 마무리 메시지가 우선입니다.",
      "header-slot-ratio": "맺음말은 타이틀바 슬롯 구조보다 마무리 메시지·CTA 중심 구성을 사용합니다.",
      "header-slot-left": "맺음말은 타이틀바 슬롯 구조보다 마무리 메시지·CTA 중심 구성을 사용합니다.",
      "header-slot-center": "맺음말은 타이틀바 슬롯 구조보다 마무리 메시지·CTA 중심 구성을 사용합니다.",
      "header-slot-right": "맺음말은 타이틀바 슬롯 구조보다 마무리 메시지·CTA 중심 구성을 사용합니다.",
      "footer-bar": "맺음말은 하단 바보다 직접 입력한 CTA 메시지가 중심입니다.",
      "footer-shape": "맺음말은 하단 바 형태보다 CTA 전달이 더 중요합니다.",
      "footer-elem": "맺음말은 출처나 KPI보다 CTA와 문의처가 더 중요합니다.",
      "footer-align": "맺음말은 하단 정렬보다 CTA 집중이 우선입니다.",
      "footer-bar-settings": "맺음말은 하단바 높이·컬러보다 CTA 전달이 더 중요합니다.",
    },
  },
};

const TEMPLATES = [
  {
    name: "공공 심사형",
    pageType: "body",
    selections: {
      format: "16:9 와이드",
      mood: "공공/정책",
      quality: ["출력용 품질", "텍스트 선명도 우선"],
      "screen-elements": ["배경", "정보 블록/카드", "도표/차트"],
      material: "무광/페이퍼",
      lighting: "은은한 자연광",
      bg: "화이트 배경",
      "bg-style": "장식 없음 (기본)",
      palette: "공공 블루",
      pattern: "보조 모티프 없음",
      hierarchy: "3분할 구도",
      typography: "강직한 고딕",
      spacing: "표준 간격",
      density: "균형 잡힌 구성",
      layout: "좌측 리스트 + 우측 다이어그램",
      content: ["텍스트 목록", "심사 포인트 박스"],
      "title-bar-rule": "새 타이틀바 디자인 (참조 없이)",
      "page-number": "본문 번호만 표기",
      "header-bg": "짙은 색상 바",
      "header-shape": "직각형",
      "header-line": "강조선 없음",
      "header-icon": "아이콘 없음",
      "header-align": "좌측 정렬",
      "header-slot-ratio": "제목 중심 (1:6:1)",
      "header-slot-left": "섹션 번호 배지",
      "header-slot-center": "슬라이드 제목 (단일 라인)",
      "header-slot-right": ["페이지 번호"],
      "logo-handling": "로고 자리 비움",
      "footer-bar": "선 형태",
      "footer-shape": "[선] 얇은 단일 라인",
      "footer-elem": ["반복 문구"],
      "footer-align": "양끝 분산",
      "text-policy": "제목과 핵심 키워드만 반영",
      "forbidden-rules": ["과밀 레이아웃 금지", "임의 수치·출처 생성 금지", "한글 자간/줄바꿈 깨짐 금지"],
    },
  },
  {
    name: "IR 투자 제안형",
    pageType: "body",
    selections: {
      format: "16:9 와이드",
      mood: "IR/투자 제안",
      quality: ["고해상도", "텍스트 선명도 우선", "차트/도표 정확도"],
      "screen-elements": ["배경", "정보 블록/카드", "도표/차트", "장식 그래픽"],
      material: "글래스모피즘",
      lighting: "깊이감 있는 레이어",
      bg: "다층 배경면",
      "bg-style": "기하학 도형",
      "bg-tone": "저채도·블리치",
      palette: "차콜 그레이",
      pattern: "기하학 보조선",
      hierarchy: "비대칭 동적",
      typography: "모던 미니멀",
      spacing: "표준 간격",
      density: "리치 디테일",
      layout: "상단 요약 + 하단 상세",
      content: ["데이터 시각화", "카드 그리드"],
      "title-bar-rule": "새 타이틀바 디자인 (참조 없이)",
      "page-number": "전체 번호 체계",
      "header-bg": "짙은 색상 바",
      "header-shape": "사선 커팅형",
      "header-line": "강조선 없음",
      "header-icon": "아이콘 없음",
      "header-align": "좌측 정렬",
      "header-slot-ratio": "균형형 (2:5:3)",
      "header-slot-left": "카테고리 라벨",
      "header-slot-center": "카테고리 라벨 + 제목 (2단)",
      "header-slot-right": ["페이지 번호", "발표 일자"],
      "logo-handling": "로고 자리 비움",
      "footer-bar": "바 형태",
      "footer-shape": "[바] 직각 솔리드",
      "footer-elem": ["반복 문구"],
      "footer-align": "양끝 분산",
      "text-policy": "수치와 고유명사만 반영",
      "forbidden-rules": ["과도한 장식 금지", "임의 수치·출처 생성 금지", "낮은 대비 금지"],
    },
  },
  {
    name: "미래 전략 테크형",
    pageType: "body",
    selections: {
      format: "16:9 와이드",
      mood: "미래 기술",
      quality: ["고해상도", "텍스트 선명도 우선", "차트/도표 정확도"],
      "screen-elements": ["배경", "정보 블록/카드", "도표/차트", "아이콘/픽토그램"],
      material: "메탈릭/금속",
      lighting: "스튜디오 조명",
      bg: "은은한 그레이 블록",
      "bg-style": "반복 패턴",
      "bg-tone": "저채도·블리치",
      palette: "산업 슬레이트",
      pattern: "테크니컬 그리드",
      hierarchy: "비대칭 동적",
      typography: "테크니컬 모노",
      spacing: "컴팩트/타이트",
      density: "리치 디테일",
      layout: "좌측 리스트 + 우측 다이어그램",
      content: ["스토리 흐름도", "데이터 시각화", "개념도/다이어그램"],
      "title-bar-rule": "새 타이틀바 디자인 (참조 없이)",
      "page-number": "전체 번호 체계",
      "header-bg": "짙은 색상 바",
      "header-shape": "사선 커팅형",
      "header-line": "세로 강조선",
      "header-icon": "배지 포함",
      "header-align": "좌측 정렬",
      "header-slot-ratio": "균형형 (2:5:3)",
      "header-slot-left": "컬러 인디케이터 바",
      "header-slot-center": "카테고리 라벨 + 제목 (2단)",
      "header-slot-right": ["페이지 번호", "진행 인디케이터"],
      "logo-handling": "로고 자리 비움",
      "footer-bar": "바 형태",
      "footer-shape": "[바] 상단 강조선 + 솔리드",
      "footer-elem": ["반복 문구"],
      "footer-align": "양끝 분산",
      "text-policy": "제목과 핵심 키워드만 반영",
      "forbidden-rules": ["미지정 요소 추가 금지", "차트 축·범례 왜곡 금지"],
    },
  },
  {
    name: "ESG 성과 보고형",
    pageType: "body",
    selections: {
      format: "A4 가로",
      mood: "공공/정책",
      quality: ["출력용 품질", "텍스트 선명도 우선", "차트/도표 정확도"],
      "screen-elements": ["배경", "정보 블록/카드", "도표/차트", "실사 이미지"],
      material: "실사 기반 합성",
      lighting: "은은한 자연광",
      bg: "화이트 배경",
      "bg-style": "장식 없음 (기본)",
      palette: "ESG 그린",
      pattern: "유기적 곡선",
      hierarchy: "3분할 구도",
      typography: "우아한 명조",
      spacing: "와이드/에어리",
      density: "균형 잡힌 구성",
      layout: "2단 정보형",
      content: ["텍스트 목록", "데이터 시각화"],
      "photo-composite": "포인트 보조 컷",
      "photo-subject": "산업 현장·시설",
      "title-bar-rule": "새 타이틀바 디자인 (참조 없이)",
      "page-number": "전체 번호 체계",
      "header-bg": "화이트 바",
      "header-shape": "직각형",
      "header-line": "가로 구분선",
      "header-icon": "아이콘 없음",
      "header-align": "좌측 정렬",
      "header-slot-ratio": "제목 중심 (1:6:1)",
      "header-slot-left": "컬러 인디케이터 바",
      "header-slot-center": "슬라이드 제목 (단일 라인)",
      "header-slot-right": ["페이지 번호"],
      "logo-handling": "로고 자리 비움",
      "footer-bar": "선 형태",
      "footer-shape": "[선] 얇은 단일 라인",
      "footer-elem": ["반복 문구"],
      "footer-align": "양끝 분산",
      "text-policy": "제목과 핵심 키워드만 반영",
      "forbidden-rules": ["임의 수치·출처 생성 금지", "낮은 대비 금지"],
    },
  },
  {
    name: "비비드 마케팅형",
    pageType: "cover",
    selections: {
      format: "1:1 정사각",
      mood: "전문 비즈니스",
      quality: ["고해상도", "텍스트 선명도 우선"],
      "screen-elements": ["배경", "3D 오브젝트", "타이포그래피 중심", "장식 그래픽"],
      material: "3D 클레이",
      lighting: "강한 대비 조명",
      bg: "다층 배경면",
      "bg-style": "기하학 도형",
      "bg-tone": "컬러",
      palette: "제안서 오렌지",
      pattern: "기하학 보조선",
      hierarchy: "비대칭 동적",
      typography: "강직한 고딕",
      spacing: "표준 간격",
      density: "균형 잡힌 구성",
      layout: "오버레이형",
      content: ["표지/인트로"],
      "title-bar-rule": "타이틀바 최소화 / 없음",
      "logo-handling": "로고 자리 비움",
      "text-policy": "제목과 핵심 키워드만 반영",
      "forbidden-rules": ["텍스트 박스 넘침 금지", "한글 자간/줄바꿈 깨짐 금지"],
    },
  },
  {
    name: "럭셔리 브랜드형",
    pageType: "cover",
    selections: {
      format: "16:9 와이드",
      mood: "IR/투자 제안",
      quality: ["고해상도", "텍스트 선명도 우선"],
      "screen-elements": ["배경", "실사 이미지", "타이포그래피 중심"],
      material: "글래스모피즘",
      lighting: "강한 대비 조명",
      bg: "다층 배경면",
      "bg-style": "주제 관련 이미지",
      "bg-tone": "저채도·블리치",
      palette: "프리미엄 골드",
      pattern: "미세 그레인",
      hierarchy: "미니멀리즘",
      typography: "우아한 명조",
      spacing: "와이드/에어리",
      density: "미니멀리스트",
      layout: "중앙 메시지형",
      content: ["표지/인트로"],
      "title-bar-rule": "타이틀바 최소화 / 없음",
      "logo-handling": "로고 자리 비움",
      "text-policy": "제목과 핵심 키워드만 반영",
      "forbidden-rules": ["과도한 장식 금지", "가짜 로고/상표 생성 금지", "낮은 대비 금지"],
    },
  },
  {
    name: "기술 백서형",
    pageType: "body",
    selections: {
      format: "A4 세로",
      mood: "공공/정책",
      quality: ["출력용 품질", "텍스트 선명도 우선", "차트/도표 정확도"],
      "screen-elements": ["배경", "정보 블록/카드", "도표/차트", "실사 이미지"],
      material: "무광/페이퍼",
      lighting: "은은한 자연광",
      bg: "화이트 배경",
      "bg-style": "장식 없음 (기본)",
      palette: "행정 네이비",
      pattern: "보조 모티프 없음",
      hierarchy: "3분할 구도",
      typography: "강직한 고딕",
      spacing: "와이드/에어리",
      density: "균형 잡힌 구성",
      layout: "좌측 리스트 + 우측 다이어그램",
      content: ["텍스트 목록", "데이터 시각화"],
      "photo-composite": "정보 카드 주변",
      "photo-subject": "산업 현장·시설",
      "title-bar-rule": "첨부 이미지 타이틀바 디자인 차용",
      "reference-scope": "타이틀바만 참조",
      "page-number": "본문 번호만 표기",
      "header-bg": "화이트 바",
      "header-shape": "직각형",
      "header-line": "가로 구분선",
      "header-icon": "아이콘 없음",
      "header-align": "좌측 정렬",
      "header-slot-ratio": "균형형 (2:5:3)",
      "header-slot-left": "섹션 번호 배지",
      "header-slot-center": "슬라이드 제목 (단일 라인)",
      "header-slot-right": ["페이지 번호"],
      "logo-handling": "로고 자리 비움",
      "footer-bar": "선 형태",
      "footer-shape": "[선] 얇은 단일 라인",
      "footer-elem": ["반복 문구"],
      "footer-align": "양끝 분산",
      "text-policy": "스크립트는 맥락 참고용만",
      "forbidden-rules": ["과밀 레이아웃 금지", "미지정 요소 추가 금지", "임의 수치·출처 생성 금지", "차트 축·범례 왜곡 금지"],
    },
  },
];

const SECTION_DEFS = [
  {
    id: "setup",
    number: "01",
    title: "규격과 품질 기준",
    subtitle: "출력 규격, 발표 톤, 이미지 품질처럼 결과물의 기본 기준을 정합니다.",
    groups: ["format", "mood", "quality"],
  },
  {
    id: "elements",
    number: "02",
    title: "화면 구성 요소",
    subtitle: "실제 PPT 화면에 들어갈 배경, 카드, 아이콘, 사진, 도표 같은 요소를 고릅니다.",
    groups: ["screen-elements"],
  },
  {
    id: "background",
    number: "03",
    title: "배경 설계",
    subtitle: "배경 베이스, 배경 콘텐츠, 배경 톤과 보조 장식 모티프를 분리해서 정합니다.",
    groups: ["bg", "bg-style", "bg-tone", "pattern"],
  },
  {
    id: "rendering",
    number: "04",
    title: "렌더링 스타일과 시각 연출",
    subtitle: "구성 요소를 어떤 표현 방식과 빛·깊이·효과로 보여줄지 정합니다.",
    groups: ["material", "lighting"],
  },
  {
    id: "color",
    number: "05",
    title: "컬러 시스템",
    subtitle: "프리셋과 HEX 입력으로 메인 색 체계를 만듭니다.",
    groups: ["palette", "color-system"],
  },
  {
    id: "reference",
    number: "05-1",
    title: "참조 이미지 적용 범위",
    subtitle: "첨부 참조 이미지를 타이틀바 기준으로만 볼지, 전체 슬라이드 디자인 기준으로 볼지 정합니다.",
    groups: ["reference-scope"],
  },
  {
    id: "detail",
    number: "06",
    title: "디자인 디테일",
    subtitle: "구도 위계, 서체, 여백과 밀도처럼 정보가 읽히는 방식을 정합니다.",
    groups: ["hierarchy", "typography", "spacing", "density"],
  },
  {
    id: "layout",
    number: "07",
    title: "레이아웃 및 본문 구성",
    subtitle: "정보가 어떤 구조로 보일지 설계합니다.",
    groups: ["layout"],
  },
  {
    id: "header",
    number: "08",
    title: "헤더 디자인 규칙",
    subtitle: "상단 타이틀바의 스타일, 형태, 높이·컬러, 번호 체계를 정합니다.",
    groups: ["title-bar-rule", "logo-handling", "page-number", "header-bg", "header-shape", "header-line", "header-icon", "header-align", "header-bar-settings", "header-slot-ratio", "header-slot-left", "header-slot-center", "header-slot-right"],
  },
  {
    id: "footer",
    number: "09",
    title: "바닥글 (Footer)",
    subtitle: "모든 페이지에 동일하게 반복 표기되는 바닥글의 형태·콘텐츠를 정합니다. 본문 강조 박스가 아닙니다.",
    groups: ["footer-bar", "footer-shape", "footer-elem", "footer-align", "footer-bar-settings"],
  },
  {
    id: "content",
    number: "10",
    title: "본문과 도식 유형",
    subtitle: "텍스트, 흐름도, 카드, 데이터 시각화, 실사 적용 위치 같은 본문 방식을 고릅니다.",
    groups: ["content", "photo-composite", "photo-subject"],
  },
  {
    id: "policy",
    number: "11",
    title: "텍스트 삽입 정책",
    subtitle: "스크립트를 어느 수준까지 반영할지 결정합니다.",
    groups: ["text-policy"],
  },
  {
    id: "forbidden",
    number: "12",
    title: "금지 규칙 설정",
    subtitle: "품질을 떨어뜨리는 요소를 명시적으로 막습니다.",
    groups: ["forbidden-rules"],
  },
];

// 각 규칙: a 선택 + b 선택 시 경고 표시
const CONFLICT_RULES = [
  {
    a: { key: "hierarchy", text: "미니멀리즘" },
    b: { key: "density", text: "리치 디테일" },
    recommendationKo: "여백 중심 결과가 중요하면 밀도를 '미니멀리스트/균형 잡힌 구성'으로 낮추고, 정보량이 중요하면 위계를 '3분할 구도/중앙 집중'으로 바꾸세요.",
    recommendationEn: "If whitespace is the priority, reduce density to minimalist or balanced. If information volume is the priority, switch hierarchy to rule-of-thirds or centered.",
    msg: "미니멀리즘은 핵심 요소 1개와 넓은 여백을 전제로 하지만, 리치 디테일은 화면을 촘촘히 채우라는 지시입니다. 둘을 함께 두면 모델이 빈 화면과 과밀 화면 사이에서 흔들립니다.",
    msgEn: "Minimalism asks for one focal element and generous whitespace, while Rich Detail asks for a packed canvas. Together they make the model oscillate between sparse and crowded output.",
  },
  {
    a: { key: "material", text: "플랫 벡터" },
    b: { key: "lighting", text: "깊이감 있는 레이어" },
    recommendationKo: "플랫 벡터를 유지하려면 연출을 '연출 최소화' 또는 '부드러운 그림자'로 낮추고, 깊이감이 중요하면 렌더링 스타일을 3D/실사/레이어 합성 계열로 바꾸세요.",
    recommendationEn: "Keep flat vector with minimal effects or soft shadows. If layered depth matters, switch material to a 3D, photorealistic, or layered-composite direction.",
    msg: "플랫 벡터는 그림자와 깊이를 최소화하는 2D 지시인데, 깊이감 있는 레이어는 앞뒤 겹침과 공간감을 요구합니다.",
    msgEn: "Flat vector minimizes shadows and depth, while layered depth asks for overlaps and spatial separation.",
  },
  {
    a: { key: "material", text: "플랫 벡터" },
    b: { key: "lighting", text: "강한 대비 조명" },
    recommendationKo: "강한 명암을 쓰려면 플랫 벡터 대신 실사 기반 합성/메탈릭/3D 클레이 계열을 선택하세요. 플랫을 유지한다면 명암 효과는 제거하는 편이 안전합니다.",
    recommendationEn: "Use photorealistic, metallic, or 3D clay material for dramatic contrast. If flat vector remains selected, remove the dramatic lighting cue.",
    msg: "플랫 벡터는 균일한 면과 단순한 선을 요구하지만, 강한 대비 조명은 깊은 그림자와 하이라이트를 만들어 벡터성이 깨질 수 있습니다.",
    msgEn: "Flat vector needs even planes and simple linework, while dramatic lighting introduces deep shadows and highlights that break the vector look.",
  },
  {
    a: { key: "spacing", text: "컴팩트/타이트" },
    b: { key: "hierarchy", text: "미니멀리즘" },
    recommendationKo: "미니멀리즘을 유지하려면 간격을 '와이드/에어리'로 바꾸고, 촘촘한 정보 배치가 필요하면 위계를 '중앙 집중' 또는 '3분할 구도'로 바꾸세요.",
    recommendationEn: "Use wide/airy spacing for minimalism. If dense placement is needed, switch hierarchy to centered or rule-of-thirds.",
    msg: "컴팩트/타이트는 좁은 간격과 밀집 배치를 요구하지만, 미니멀리즘은 큰 여백과 강한 비움을 요구합니다.",
    msgEn: "Compact/tight spacing asks for narrow gaps and density, while minimalism asks for large negative space.",
  },
  {
    a: { key: "spacing", text: "와이드/에어리" },
    b: { key: "density", text: "리치 디테일" },
    recommendationKo: "넓은 여백을 살리려면 밀도를 낮추고, 많은 정보를 넣어야 한다면 간격을 '표준 간격'으로 바꾸세요.",
    recommendationEn: "Reduce density to preserve airy spacing, or switch spacing to standard if rich information is required.",
    msg: "와이드/에어리는 여백을 품질 요소로 쓰는 지시이고, 리치 디테일은 화면 점유율을 높이라는 지시라 결과 방향이 충돌합니다.",
    msgEn: "Wide/airy treats whitespace as a quality cue, while rich detail pushes for high canvas occupancy.",
  },
  {
    a: { key: "material", text: "3D 클레이" },
    b: { key: "typography", text: "테크니컬 모노" },
    recommendationKo: "친근한 3D 감성을 원하면 고딕/모던 미니멀 서체가 안정적이고, 기술 보고서 톤이 중요하면 소재를 무광/메탈릭으로 바꾸세요.",
    recommendationEn: "For friendly 3D, use sans-serif or modern minimal type. For technical reporting, switch material to matte or metallic.",
    msg: "3D 클레이는 둥글고 친근한 제품 렌더 감성이고, 테크니컬 모노는 차갑고 데이터 중심인 인상을 만듭니다.",
    msgEn: "3D clay creates a rounded, friendly render feel, while technical mono creates a colder data-report impression.",
  },
  {
    a: { key: "material", text: "플랫 벡터" },
    b: { key: "photo-composite", text: "대형 히어로 영역" },
    recommendationKo: "대형 실사 히어로를 유지하려면 소재를 실사 기반 합성으로 바꾸고, 플랫 벡터를 유지하려면 실사는 작은 보조 컷으로 낮추세요.",
    recommendationEn: "Keep a large hero photo by switching material to photorealistic composite, or keep flat vector by reducing photos to small support cuts.",
    msg: "플랫 벡터는 2D 일러스트 중심이고, 대형 히어로 영역은 실사 피사체가 화면의 주인공이 되는 지시입니다.",
    msgEn: "Flat vector is 2D illustration-first, while a large hero area makes a photorealistic subject the main visual.",
  },
  {
    a: { key: "material", text: "플랫 벡터" },
    b: { key: "photo-composite", text: "정보 카드 주변" },
    recommendationKo: "카드 주변 실사 컷이 필요하면 소재를 무광/실사 합성 쪽으로 바꾸고, 플랫 벡터를 유지하려면 실사 컷 대신 아이콘/라인 도형을 쓰세요.",
    recommendationEn: "For photo cuts near cards, switch to matte or photorealistic composite. For flat vector, use icons or line shapes instead of photo cuts.",
    msg: "플랫 벡터 카드 옆에 실사 컷을 붙이면 깊이감과 질감 기준이 달라져 정보 카드가 합성처럼 보일 수 있습니다.",
    msgEn: "Photo cuts beside flat vector cards introduce inconsistent depth and texture, making the card area look pasted together.",
  },
  {
    a: { key: "material", text: "실사 기반 합성" },
    b: { key: "screen-elements", text: "아이콘/픽토그램" },
    recommendationKo: "실사 합성이 핵심이면 아이콘은 보조 요소로만 작게 쓰고, 아이콘 중심 화면이면 렌더링 스타일을 플랫 벡터/미니멀 라인아트로 바꾸세요.",
    recommendationEn: "If photoreal compositing is core, keep icons small and secondary. If icons are the main visual, switch rendering to flat vector or minimal line art.",
    msg: "실사 기반 합성은 사진적 원근·그림자·질감을 요구하지만, 아이콘/픽토그램 중심 화면은 단순 기호 중심의 낮은 질감 체계가 더 안정적입니다.",
    msgEn: "Photorealistic compositing requires photographic perspective, shadows, and texture, while an icon-led screen is more stable with simple symbolic forms.",
  },
  {
    a: { key: "material", text: "고급 레이어 합성" },
    b: { key: "hierarchy", text: "미니멀리즘" },
    recommendationKo: "레이어 합성을 살리려면 위계를 '비대칭 동적' 또는 '3분할 구도'로 바꾸고, 미니멀리즘을 유지하려면 렌더링 스타일을 플랫 벡터/무광 계열로 낮추세요.",
    recommendationEn: "For layered compositing, use asymmetrical or rule-of-thirds hierarchy. For minimalism, keep only high-resolution or print-ready quality.",
    msg: "고급 레이어 합성은 여러 시각 레이어와 깊이감을 요구하지만, 미니멀리즘은 레이어 수와 장식을 줄이라는 지시입니다.",
    msgEn: "Advanced layer compositing asks for multiple visual layers and depth, while minimalism asks to reduce layers and decoration.",
  },
  {
    a: { key: "lighting", text: "깊이감 있는 레이어" },
    b: { key: "density", text: "미니멀리스트" },
    recommendationKo: "미니멀리스트 구성을 유지하려면 깊이감 연출을 낮추고, 레이어 깊이가 중요하면 밀도를 '균형 잡힌 구성' 이상으로 올리세요.",
    recommendationEn: "Reduce layered depth for minimalist density, or raise density to balanced or richer if layered depth is important.",
    msg: "깊이감 있는 레이어는 앞뒤 요소와 겹침을 늘리는 방향이고, 미니멀리스트 밀도는 요소 수를 강하게 줄이는 방향입니다.",
    msgEn: "Rich detail increases surface, structure, and supporting elements, while minimalist density strongly reduces element count.",
  },
  {
    a: { key: "bg", text: "다층 배경면" },
    b: { key: "hierarchy", text: "미니멀리즘" },
    recommendationKo: "배경 깊이를 유지하려면 미니멀리즘 대신 중앙 집중/3분할 구도를 쓰고, 미니멀을 유지하려면 배경을 화이트/은은한 그레이/장식 없음으로 낮추세요.",
    recommendationEn: "Keep layered depth with centered or rule-of-thirds hierarchy. Keep minimalism by using white, soft gray, or no decorative background.",
    msg: "다층 배경면은 배경 자체에 깊이와 면 분할을 부여하지만, 미니멀리즘은 배경 존재감을 낮춰야 안정적입니다.",
    msgEn: "A multi-layer background gives the background depth and decoration, while minimalism needs a quieter background presence.",
  },
  {
    a: { key: "bg-style", text: "주제 관련 이미지" },
    b: { key: "layout", text: "카드 그리드형" },
    recommendationKo: "이미지 배경을 쓰려면 레이아웃을 오버레이형/중앙 메시지형으로 단순화하고, 카드 그리드를 유지하려면 배경을 단색/장식 없음/은은한 패턴으로 낮추세요.",
    recommendationEn: "Use overlay or centered layout for image backgrounds. Keep card grids with solid, none, or subtle patterned backgrounds.",
    msg: "주제 관련 이미지 위에 카드 그리드를 올리면 카드 경계, 본문 텍스트, 배경 피사체가 서로 경쟁해 가독성이 흔들릴 수 있습니다.",
    msgEn: "A subject image background under a card grid can make card edges, body text, and background subjects compete for attention.",
  },
  {
    a: { key: "bg-style", text: "반복 패턴" },
    b: { key: "content", text: "데이터 시각화" },
    recommendationKo: "데이터 시각화를 우선하면 배경을 단색/장식 없음으로 낮추고, 패턴을 유지하려면 투명도 낮은 아주 약한 패턴으로 제한하세요.",
    recommendationEn: "For data visualization, use solid or no decoration. If pattern remains, keep it extremely subtle and low opacity.",
    msg: "반복 패턴은 작은 선과 점을 많이 만들기 때문에 차트 축, 라벨, 수치 블록과 시각적으로 섞일 수 있습니다.",
    msgEn: "Repeating patterns introduce many small lines and dots that can visually mix with chart axes, labels, and numeric blocks.",
  },
  {
    a: { key: "bg-tone", text: "흑백 / 모노크롬" },
    b: { key: "palette", text: "제안서 오렌지" },
    recommendationKo: "제안서 오렌지의 강조력을 살리려면 배경 톤을 컬러/AI 위임으로 바꾸고, 흑백 배경을 유지하려면 팔레트를 차콜 그레이/행정 네이비처럼 저채도 계열로 바꾸세요.",
    recommendationEn: "Use color or AI-directed background tone to preserve the emphasis of proposal orange. If monochrome background remains, switch to a restrained palette such as charcoal gray or administrative navy.",
    msg: "제안서 오렌지는 강조색의 에너지와 주목도가 핵심인데, 흑백/모노크롬 배경은 색상 강조를 제거합니다.",
    msgEn: "Proposal orange depends on energetic accent emphasis, while a monochrome background removes that color emphasis.",
  },
  {
    a: { key: "bg-tone", text: "흑백 / 모노크롬" },
    b: { key: "palette", text: "ESG 그린" },
    recommendationKo: "ESG 그린의 자연스러운 색감을 살리려면 배경 톤을 컬러/저채도 계열로 두고, 완전 모노크롬을 유지하려면 차콜 그레이나 행정 네이비를 쓰세요.",
    recommendationEn: "Use color or restrained desaturated background tone to preserve the natural character of ESG green, or switch to charcoal gray or administrative navy if full monochrome remains.",
    msg: "ESG 그린은 자연·환경·지속가능성의 색상 인상이 중요한데, 흑백/모노크롬 배경은 그 의미 신호를 약화합니다.",
    msgEn: "ESG green relies on the color signal of nature, environment, and sustainability, while monochrome weakens that semantic cue.",
  },
  {
    a: { key: "header-bg", text: "투명 헤더" },
    b: { key: "bg-style", text: "주제 관련 이미지" },
    recommendationKo: "투명 헤더를 유지하려면 배경을 단색/장식 없음으로 낮추고, 이미지 배경을 유지하려면 헤더를 화이트 바/짙은 색상 바로 분리하세요.",
    recommendationEn: "Keep transparent header with solid or no-decoration background. Keep image background by separating the header with white or dark bar.",
    msg: "투명 헤더는 배경 위에 제목을 직접 얹는 구조라, 주제 관련 이미지와 만나면 제목 가독성이 쉽게 무너집니다.",
    msgEn: "A transparent header places title text directly over the background, so subject imagery can quickly damage title readability.",
  },
  {
    a: { key: "layout", text: "오버레이형" },
    b: { key: "bg-style", text: "반복 패턴" },
    recommendationKo: "오버레이형을 유지하려면 배경 콘텐츠를 주제 관련 이미지/장식 없음으로 바꾸고, 반복 패턴을 유지하려면 레이아웃을 카드 그리드/2단 정보형처럼 분리된 구조로 바꾸세요.",
    recommendationEn: "Keep overlay layout with subject imagery or solid background. Keep repeating patterns with card grid or two-column separated structures.",
    msg: "오버레이형은 비주얼 위 정보 패널을 얹는 구조인데, 반복 패턴은 패널 아래 잔선을 많이 만들어 정보 영역이 지저분해질 수 있습니다.",
    msgEn: "Overlay panels sit on top of a visual layer, while repeating patterns create many small marks under panels and can make information areas noisy.",
  },
  {
    a: { key: "bg-style", text: "주제 관련 이미지" },
    b: { key: "density", text: "리치 디테일" },
    recommendationKo: "주제 관련 이미지를 유지하려면 밀도를 '균형 잡힌 구성' 이하로 낮추고, 리치 디테일을 유지하려면 배경을 단색/장식 없음으로 낮추세요.",
    recommendationEn: "Keep subject imagery with balanced or lower density, or keep rich detail by switching the background to solid or no-decoration.",
    msg: "주제 관련 이미지와 리치 디테일을 함께 쓰면 배경 피사체와 많은 정보 요소가 동시에 경쟁해 가독성이 떨어질 수 있습니다.",
    msgEn: "Subject imagery combined with rich detail makes background subjects and dense information compete, reducing readability.",
  },
  {
    a: { key: "layout", text: "카드 그리드형" },
    b: { key: "content", text: "이미지 갤러리" },
    recommendationKo: "카드 그리드를 유지하려면 이미지는 카드별 보조 컷으로 낮추고, 이미지 갤러리가 핵심이면 레이아웃을 오버레이형/중앙 메시지형으로 단순화하세요.",
    recommendationEn: "Keep card grid by using images as small supporting cuts, or keep image gallery by simplifying the layout to overlay or centered.",
    msg: "카드 그리드형은 정보 카드의 균일한 분할이 핵심이고, 이미지 갤러리는 사진 자체가 주인공이 되는 구조라 화면 우선순위가 충돌합니다.",
    msgEn: "Card grid prioritizes evenly divided information cards, while image gallery makes photography the main subject, creating competing priorities.",
  },
  {
    a: { key: "footer-bar", text: "없음" },
    b: { key: "footer-elem", text: "반복 문구" },
    recommendationKo: "바닥글을 없애려면 반복 문구도 제거하고, 반복 문구가 필요하면 바닥글 형태를 선/바 형태로 바꾸세요.",
    recommendationEn: "Remove recurring footer text if footer is none, or switch footer style to line/bar if recurring text is needed.",
    msg: "바닥글 없음과 반복 문구가 함께 선택되어 있습니다. 하단 영역을 만들지 않으면서 반복 문구를 넣으라는 상충 지시입니다.",
    msgEn: "Footer none conflicts with recurring footer text; it asks for no footer area while also asking for repeated footer content.",
  },
  {
    a: { key: "footer-bar", text: "없음" },
    b: { key: "footer-elem", text: "로고" },
    recommendationKo: "바닥글을 없애려면 푸터 로고도 제거하고, 로고가 필요하면 헤더 슬롯이나 별도 후처리 자리로 이동하세요.",
    recommendationEn: "Remove footer logo if footer is none, or move logo handling to a header slot or post-production placeholder.",
    msg: "바닥글 없음과 푸터 로고가 함께 선택되어 있어 하단 영역의 존재 여부가 충돌합니다.",
    msgEn: "Footer none conflicts with footer logo because the footer area is both removed and requested.",
  },
  {
    a: { key: "logo-handling", text: "로고 자체를 사용하지 않음" },
    b: { key: "header-slot-left", text: "브랜드 마크/로고" },
    recommendationKo: "로고를 사용하지 않으려면 좌측 슬롯을 비움/컬러 인디케이터/카테고리 라벨로 바꾸세요.",
    recommendationEn: "If logos are disabled, change the left slot to empty, color indicator, or category label.",
    msg: "로고 자체를 사용하지 않는 정책과 헤더 좌측 로고 슬롯이 동시에 선택되어 있습니다.",
    msgEn: "Logo disabled conflicts with a header-left logo slot.",
  },
  {
    a: { key: "logo-handling", text: "로고 자체를 사용하지 않음" },
    b: { key: "header-slot-right", text: "기관/팀 로고" },
    recommendationKo: "로고를 사용하지 않으려면 우측 슬롯의 기관/팀 로고를 비움 또는 페이지 정보로 바꾸세요.",
    recommendationEn: "If logos are disabled, change the right logo slot to empty or non-logo metadata.",
    msg: "로고 자체를 사용하지 않는 정책과 헤더 우측 기관/팀 로고가 동시에 선택되어 있습니다.",
    msgEn: "Logo disabled conflicts with a header-right organization/team logo.",
  },
  {
    a: { key: "logo-handling", text: "로고 자체를 사용하지 않음" },
    b: { key: "footer-elem", text: "로고" },
    recommendationKo: "로고를 사용하지 않으려면 푸터 로고를 제거하세요.",
    recommendationEn: "If logos are disabled, remove the footer logo.",
    msg: "로고 자체를 사용하지 않는 정책과 푸터 로고 반복 표기가 동시에 선택되어 있습니다.",
    msgEn: "Logo disabled conflicts with repeated footer logo usage.",
  },
  // 페이지 번호 표시 위치 중복 방지 (자동 해제로 대부분 처리되나 안전망)
  {
    a: { key: "header-slot-right", text: "페이지 번호" },
    b: { key: "footer-elem", text: "페이지 넘버" },
    recommendationKo: "페이지 번호는 헤더 우측 또는 푸터 중 한 곳만 유지하세요. 덱 전체에서 같은 위치를 반복하는 편이 안정적입니다.",
    recommendationEn: "Keep page numbering in either the header right slot or the footer, not both. Use one repeated location across the deck.",
    msg: "타이틀바 우측 슬롯과 하단 푸터 양쪽에 페이지 번호가 중복 지정되어 있습니다. 반복 정보가 두 곳에 있으면 시선 흐름과 덱 일관성이 흐려집니다.",
    msgEn: "Page number is specified in both the header right slot and the footer. Repeating it in two places weakens eye flow and deck consistency.",
  },
];

function getConflicts() {
  return CONFLICT_RULES.filter(({ a, b }) => {
    const aVals = getSelectionValues(a.key).map((i) => i.text);
    const bVals = getSelectionValues(b.key).map((i) => i.text);
    return aVals.includes(a.text) && bVals.includes(b.text);
  });
}

const SECTION_MAP = {
  page: {
    keys: ["pageType", "format"],
    labelKo: "페이지 규격",
    labelEn: "PAGE SETUP",
    cls: "main",
  },
  reference: {
    keys: ["reference-scope"],
    labelKo: "참조 이미지 적용 범위",
    labelEn: "REFERENCE IMAGE SCOPE",
    cls: "header",
  },
  main: {
    keys: ["mood", "quality"],
    labelKo: "품질 기준",
    labelEn: "QUALITY BASELINE",
    cls: "main",
  },
  elements: {
    keys: ["screen-elements"],
    labelKo: "화면 구성 요소",
    labelEn: "SCREEN ELEMENTS",
    cls: "content",
  },
  background: {
    keys: ["bg", "bg-style", "bg-tone", "bg-solid-color", "pattern"],
    labelKo: "배경 설계",
    labelEn: "BACKGROUND SYSTEM",
    cls: "main",
  },
  rendering: {
    keys: ["material", "lighting"],
    labelKo: "렌더링 스타일과 시각 연출",
    labelEn: "RENDERING STYLE & VISUAL TREATMENT",
    cls: "detail",
  },
  color: {
    keys: ["palette", "color-system"],
    labelKo: "컬러 시스템",
    labelEn: "COLOR SYSTEM",
    cls: "main",
  },
  layout: {
    keys: ["layout"],
    labelKo: "레이아웃",
    labelEn: "LAYOUT",
    cls: "layout",
  },
  header: {
    keys: ["title-bar-rule", "logo-handling", "page-number", "header-bg", "header-shape", "header-line", "header-icon", "header-align", "header-bar-settings"],
    labelKo: "헤더 디자인 규칙",
    labelEn: "HEADER DESIGN",
    cls: "header",
  },
  headerSlot: {
    keys: ["header-slot-grid"],
    labelKo: "타이틀바 콘텐츠 슬롯 규격",
    labelEn: "HEADER LAYOUT GRID",
    cls: "header",
  },
  footer: {
    keys: ["footer-bar", "footer-shape", "footer-elem", "footer-align", "footer-bar-settings"],
    labelKo: "바닥글",
    labelEn: "FOOTER",
    cls: "footer",
  },
  detail: {
    keys: ["hierarchy", "typography", "spacing", "density"],
    labelKo: "디자인 디테일",
    labelEn: "DESIGN DETAIL",
    cls: "detail",
  },
  content: {
    keys: ["content", "photo-composite", "photo-subject"],
    labelKo: "본문 유형",
    labelEn: "CONTENT TYPE",
    cls: "content",
  },
  policy: {
    keys: ["text-policy"],
    labelKo: "텍스트 정책",
    labelEn: "TEXT POLICY",
    cls: "user",
  },
  forbidden: {
    keys: ["auto-forbidden", "forbidden-rules"],
    labelKo: "금지 규칙",
    labelEn: "DO NOT",
    cls: "user",
  },
};

const OPTION_META = {
  format:           { label: "출력 규격 및 비율",    mode: "single", guide: "슬라이드가 최종적으로 출력될 캔버스 규격과 구도 비율을 정합니다.", wide: true },
  mood:             { label: "메인 스타일",           mode: "single", guide: "발표자료의 전체 분위기와 전문성을 정합니다.", wide: false },
  quality:          { label: "이미지 품질",           mode: "multi",  guide: "해상도, 텍스트 선명도, 차트 정확도처럼 결과물의 기술 품질 조건만 정합니다.", wide: true },
  "screen-elements":{ label: "화면 구성 요소",         mode: "multi",  guide: "실제 PPT 화면에 들어갈 배경, 카드, 아이콘, 사진, 도표, 3D 오브젝트, 장식 그래픽 등을 고릅니다.", wide: true },
  material:         { label: "렌더링 스타일",          mode: "single", guide: "선택한 구성 요소를 어떤 시각 언어로 표현할지 정합니다. 실사 합성, 플랫 벡터, 3D, 글래스모피즘 등은 이곳에서 선택합니다.", wide: true },
  lighting:         { label: "시각 연출",              mode: "single", guide: "빛, 그림자, 깊이, 오버레이처럼 화면의 연출 효과를 정합니다.", wide: true },
  bg:               { label: "배경 베이스",            mode: "single", guide: "화이트, 단색, 블록, 텍스처, 다층 배경면처럼 배경의 기본 바탕을 정합니다.", wide: true },
  "bg-style":       { label: "배경 콘텐츠",            mode: "single", guide: "배경 위에 실제로 들어갈 이미지, 도형, 패턴, 광원, 데이터 모티프 또는 장식 없음 여부를 정합니다.", wide: true },
  "bg-tone":        { label: "배경 톤 (컬러/흑백)",     mode: "single", guide: "배경 콘텐츠를 컬러로 표현할지 흑백·저채도로 표현할지 정합니다.", wide: false },
  palette:          { label: "컬러 프리셋",           mode: "single", guide: "관공서·기업 PPT에서 자주 쓰는 색상표를 고릅니다. 각 카드에서 Primary·Secondary·Accent·Background·Text 색상을 미리 확인할 수 있습니다.", wide: true },
  "color-system":   { label: "HEX 컬러 직접 입력",   mode: "custom", guide: "Primary, Secondary, Background Block, Text 컬러를 직접 조정합니다.", wide: true },
  pattern:          { label: "보조 장식 모티프",       mode: "single", guide: "배경 콘텐츠와 별도로 정보 영역을 보조하는 얇은 선, 그리드, 곡선, 그레인 같은 장식만 정합니다.", wide: true },
  hierarchy:        { label: "시각적 위계",           mode: "single", guide: "정보가 배치될 구도와 무게 중심을 정합니다.", wide: false },
  typography:       { label: "서체 스타일",           mode: "single", guide: "이미지 내 텍스트 요소의 인상을 정합니다.", wide: false },
  spacing:          { label: "여백과 간격",           mode: "single", guide: "슬라이드의 공간감과 숨통을 조절합니다.", wide: false },
  density:          { label: "콘텐츠 밀도",           mode: "single", guide: "슬라이드 내 정보의 양과 조밀도를 정합니다.", wide: false },
  layout:           { label: "레이아웃 구조",         mode: "single", guide: "정보를 어떤 구조로 보여줄지 선택합니다.", wide: true },
  "reference-scope": { label: "참조 이미지 적용 범위", mode: "single", guide: "첨부 참조 이미지를 타이틀바만 고정하는 기준으로 볼지, 전체 슬라이드 디자인 기준으로 볼지 정합니다.", wide: true },
  "title-bar-rule": { label: "타이틀바 규칙",         mode: "single", guide: "참조 상단 바를 얼마나 유지할지 정합니다.", wide: false },
  "page-number":    { label: "페이지 번호 규칙",      mode: "single", guide: "번호 표기 범위를 정합니다.", wide: false },
  "header-bg":      { label: "헤더 배경",             mode: "single", guide: "헤더 바의 배경 존재감을 조정합니다.", wide: false },
  "header-line":    { label: "헤더 강조선",           mode: "single", guide: "상단에 보조 구조선을 둘지 선택합니다.", wide: false },
  "header-icon":    { label: "헤더 아이콘",           mode: "single", guide: "아이콘이나 배지를 활용할지 정합니다.", wide: false },
  "logo-handling":  { label: "로고 처리 정책",         mode: "single", guide: "저작권·상표권 보호를 위해 로고 영역을 어떻게 처리할지 정합니다. 권장: '로고 자리 비움' 또는 '사용자 후처리용 자리 확보'.", wide: true },
  "header-slot-ratio":  { label: "타이틀바 슬롯 비율",   mode: "single", guide: "타이틀바를 좌·중·우 슬롯으로 나누고 각 슬롯의 너비 비율을 정합니다. 모든 페이지에서 동일하게 유지되어야 합니다.", wide: true },
  "header-slot-left":   { label: "타이틀바 좌측 슬롯",   mode: "single", guide: "타이틀바 좌측에 어떤 콘텐츠를 둘지 정합니다 (섹션 번호·로고·라벨 등).", wide: true },
  "header-slot-center": { label: "타이틀바 중앙 슬롯",   mode: "single", guide: "타이틀바 중앙에 어떤 콘텐츠 구성으로 슬라이드 제목을 둘지 정합니다.", wide: true },
  "header-slot-right":  { label: "타이틀바 우측 슬롯",   mode: "multi",  guide: "타이틀바 우측에 어떤 메타 정보를 둘지 정합니다 (페이지 번호·일자·로고 등). 복수 선택 가능.", wide: true },
  "footer-bar":     { label: "바닥글 형태",           mode: "single", guide: "바닥글을 선 형태·바 형태로 그릴지, 또는 만들지 않을지 정합니다.", wide: true },
  "footer-elem":    { label: "바닥글 콘텐츠",         mode: "multi",  guide: "모든 페이지에 동일하게 반복 표기되는 콘텐츠를 정합니다 (페이지 번호·반복 문구·로고·일자·진행 인디케이터). 본문 강조 박스가 아닙니다.", wide: true },
  content:          { label: "본문/도식 유형",         mode: "multi",  guide: "슬라이드 안에서 정보를 어떤 방식으로 배치할지 선택합니다. 복수 선택 가능.", wide: true },
  "photo-composite":{ label: "실사 합성 적용 요소",     mode: "multi",  guide: "실사 사진을 슬라이드의 어느 요소에 적용할지 정합니다. 여러 요소를 함께 선택해 배경, 카드, 포인트 컷처럼 조합할 수 있습니다.", wide: true },
  "photo-subject":  { label: "실사 이미지 주제",       mode: "single", guide: "합성에 사용할 실사 사진의 피사체 유형을 정합니다. 필요하면 아래 직접 입력에 쉼표로 구분한 단어를 나열하세요.", wide: true },
  "text-policy":    { label: "텍스트 반영 방식",      mode: "single", guide: "스크립트와 사용자 입력을 어느 수준까지 반영할지 정합니다.", wide: true },
  "forbidden-rules":{ label: "금지 규칙 선택",        mode: "multi",  guide: "AUTO 적용 외 추가로 막을 요소를 선택합니다.", wide: true },
  "header-bar-settings": { label: "상단바 높이 · 컬러", mode: "custom", guide: "상단 바의 높이(px)와 컬러를 직접 설정합니다.", wide: true },
  "header-shape":    { label: "헤더 바 형태",         mode: "single", guide: "헤더 바의 모서리·형태를 선택합니다.", wide: false },
  "header-align":    { label: "헤더 텍스트 정렬",     mode: "single", guide: "헤더 타이틀의 텍스트 정렬 방향을 정합니다.", wide: false },
  "footer-bar-settings": { label: "바닥글 높이 · 컬러", mode: "custom", guide: "바닥글 영역의 높이(px)와 컬러를 직접 설정합니다. '바 형태'일 때 띠 색상으로, '선 형태'일 때 라인 색상으로 적용됩니다.", wide: true },
  "footer-align":    { label: "바닥글 콘텐츠 정렬",   mode: "single", guide: "바닥글 영역 안에서 콘텐츠를 어느 방향으로 정렬할지 정합니다.", wide: false },
  "footer-shape":    { label: "바닥글 세부 형태",     mode: "single", guide: "선 형태(굵기·종류) 또는 바 형태(모서리·인셋)의 세부 모양을 정합니다. 바닥글 형태 선택에 따라 적합한 옵션을 고르세요.", wide: true },
};

// SECTION_DEFS로부터 역방향 키→섹션ID 맵을 파생 (OPTION_META.section 중복 제거)
const KEY_SECTION_MAP = {};
SECTION_DEFS.forEach((s) => s.groups.forEach((k) => { KEY_SECTION_MAP[k] = s.id; }));

const CORE_FLOW_STEPS = [
  { id: "pageType", label: "페이지 유형", hint: "슬라이드의 역할을 먼저 정합니다." },
  { id: "format", label: "출력 규격", hint: "A4 세로, 16:9 같은 캔버스 규격을 정합니다." },
  { id: "mood", label: "메인 스타일", hint: "자료의 분위기와 전문성을 정합니다." },
  { id: "screen-elements", label: "화면 구성 요소", hint: "배경, 블록, 아이콘, 사진, 도표처럼 실제 화면에 들어갈 요소를 정합니다." },
  { id: "layout", label: "레이아웃 구조", hint: "정보가 어떻게 배치될지 설계합니다." },
  { id: "content", label: "본문/도식 유형", hint: "실제로 어떤 화면 구성이 나올지 정합니다." },
  { id: "text-policy", label: "텍스트 삽입 정책", hint: "스크립트를 어느 수준까지 반영할지 정합니다." },
];

