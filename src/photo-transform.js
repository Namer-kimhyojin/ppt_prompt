(function () {
  "use strict";

  const GPT_IMAGE_PREVIEW_VERSION = 5;

  const presets = [
    {
      id: "clean-profile",
      title: "클린 프로필",
      category: "profile",
      categoryLabel: "프로필",
      description: "신뢰감 있는 표정과 정돈된 조명으로 만드는 범용 전문 프로필",
      tags: ["링크드인", "사내 프로필", "1:1"],
      trend: "ESSENTIAL",
      caption: "CLEAN / TRUST",
      palette: { bg: "linear-gradient(135deg, #dbeafe, #f8fafc 56%, #c7d2fe)", accent: "#2563eb", accent2: "#93c5fd", ink: "#172554", skin: "#e9bda0" },
      overlay: "frame",
      ko: "단정하고 현대적인 전문 프로필 사진. 카메라를 자연스럽게 바라보는 편안한 자신감, 어깨 위 중심의 균형 잡힌 구도, 부드러운 대형 소프트박스 조명, 눈에 또렷한 캐치라이트, 깔끔한 의상, 실제 피부 질감과 절제된 보정. 과장된 기업 스톡 사진 느낌 없이 친근하고 신뢰감 있게 표현한다.",
      en: "A clean contemporary professional profile portrait with relaxed confidence, balanced head-and-shoulders framing, soft large-source studio lighting, crisp catchlights, polished wardrobe, authentic skin texture, and restrained retouching. Keep it approachable and credible, never like an overly staged corporate stock photo."
    },
    {
      id: "founder-editorial",
      title: "파운더 에디토리얼",
      category: "editorial",
      categoryLabel: "에디토리얼",
      description: "창업자·전문가의 개성과 서사를 담는 여백 중심 브랜드 화보",
      tags: ["브랜딩", "전문가", "화보"],
      trend: "2026 PICK",
      caption: "STORY / PRESENCE",
      palette: { bg: "linear-gradient(145deg, #292524, #78716c 55%, #d6d3d1)", accent: "#ea580c", accent2: "#facc15", ink: "#1c1917", skin: "#dca886" },
      overlay: "frame",
      ko: "인물의 직업적 정체성과 개성이 느껴지는 창업자 에디토리얼 포트레이트. 정면의 완벽한 포즈보다 일하는 순간 사이의 자연스러운 몸짓과 진짜 표정을 포착한다. 절제된 공간, 넓은 여백, 한 방향의 부드러운 창빛, 고급 잡지의 차분한 색보정, 미세한 질감과 현실적인 디테일을 사용한다.",
      en: "A personality-led founder editorial portrait that communicates professional identity and a real point of view. Capture an authentic gesture between moments rather than a perfectly staged pose. Use a restrained environment, generous negative space, soft directional window light, calm premium editorial color grading, fine texture, and believable details."
    },
    {
      id: "daylight-real",
      title: "소프트 데이라이트",
      category: "profile",
      categoryLabel: "프로필",
      description: "완벽한 보정보다 표정과 생활감을 살리는 자연광 인물 사진",
      tags: ["자연광", "SNS", "진정성"],
      trend: "HUMAN 2026",
      caption: "REAL / WARM",
      palette: { bg: "linear-gradient(135deg, #fef3c7, #fefce8 48%, #bbf7d0)", accent: "#16a34a", accent2: "#f59e0b", ink: "#365314", skin: "#e5b291" },
      overlay: "noise",
      ko: "따뜻한 자연광이 들어오는 실제 공간에서 촬영한 인간적인 라이프스타일 포트레이트. 자연스러운 미소 또는 생각에 잠긴 표정, 약간의 움직임, 완벽하게 정리되지 않은 현실적인 배경, 부드러운 그림자와 따뜻한 중간톤을 사용한다. 피부의 고유한 질감과 작은 특징을 지우지 않고 인물의 성격이 드러나게 한다.",
      en: "A human, story-driven lifestyle portrait in a real space with warm natural daylight. Use an unforced smile or thoughtful expression, a hint of motion, a believable slightly imperfect environment, soft shadows, and warm midtones. Preserve real skin texture and small individual features so the subject's personality remains visible."
    },
    {
      id: "analog-flash",
      title: "아날로그 플래시",
      category: "film",
      categoryLabel: "필름",
      description: "직접광 플래시와 필름 입자로 만드는 즉흥적이고 생생한 스냅",
      tags: ["필름", "플래시", "Y2K"],
      trend: "ANALOG",
      caption: "FLASH / GRAIN",
      palette: { bg: "linear-gradient(135deg, #7f1d1d, #fb7185 50%, #fde68a)", accent: "#e11d48", accent2: "#facc15", ink: "#450a0a", skin: "#edb493" },
      overlay: "noise",
      ko: "콤팩트 필름 카메라로 가까이서 찍은 듯한 즉흥적인 인물 스냅. 정면 직접광 플래시, 선명한 인물과 빠르게 어두워지는 배경, 약간 비뚤어진 구도, 자연스러운 순간의 표정, 따뜻하게 뜬 하이라이트, 은은한 색 번짐과 실제 필름 입자를 적용한다. 얼굴은 과도하게 매끈하게 만들지 않는다.",
      en: "An impulsive close-range portrait that feels captured on a compact film camera. Use direct on-camera flash, a crisp subject with quickly falling background light, a slightly off-kilter composition, an unguarded expression, warm lifted highlights, subtle color bleed, and convincing film grain. Avoid overly smooth skin."
    },
    {
      id: "cinematic-mono",
      title: "시네마 모노크롬",
      category: "film",
      categoryLabel: "필름",
      description: "빛과 그림자로 얼굴의 입체감을 살리는 흑백 영화 스틸",
      tags: ["흑백", "로우키", "시네마틱"],
      trend: "TIMELESS",
      caption: "LIGHT / SHADOW",
      palette: { bg: "linear-gradient(135deg, #030712, #374151 55%, #9ca3af)", accent: "#475569", accent2: "#d1d5db", ink: "#111827", skin: "#b8b8b8" },
      overlay: "frame",
      ko: "시네마스코프 영화의 한 장면 같은 흑백 인물 사진. 얼굴 한쪽을 스치는 방향성 있는 빛, 깊지만 디테일이 살아 있는 그림자, 조용한 시선, 절제된 포즈, 섬세한 회색조와 미세한 필름 입자를 사용한다. 강한 대비 속에서도 눈과 피부 질감이 자연스럽게 보이도록 한다.",
      en: "A black-and-white portrait that feels like a still from a widescreen film. Use directional light grazing one side of the face, deep shadows with retained detail, a quiet gaze, restrained posing, nuanced grayscale, and fine film grain. Keep the eyes and authentic skin texture legible within the strong contrast."
    },
    {
      id: "magazine-cover",
      title: "인디 매거진 커버",
      category: "editorial",
      categoryLabel: "에디토리얼",
      description: "대담한 크롭과 넉넉한 타이포 여백을 갖춘 독립 잡지 스타일",
      tags: ["매거진", "대담한 크롭", "커버"],
      trend: "EDITORIAL",
      caption: "BOLD / COVER",
      palette: { bg: "linear-gradient(150deg, #f43f5e, #fb7185 42%, #fef08a)", accent: "#be123c", accent2: "#facc15", ink: "#4c0519", skin: "#efb08c" },
      overlay: "grid",
      ko: "독립 문화 잡지의 표지 화보 같은 대담한 인물 사진. 화면을 꽉 채우는 비대칭 크롭, 자신감 있는 시선, 선명한 단색 배경과 강한 컬러 대비, 단단한 스튜디오 조명을 사용한다. 표지 디자인을 위한 넓은 여백을 남기되 실제 글자, 로고, 브랜드명은 생성하지 않는다.",
      en: "A bold portrait in the visual language of an independent culture magazine cover. Use an asymmetric close crop, confident eye contact, a saturated solid backdrop, strong color contrast, and sculpted studio light. Leave intentional negative space for later cover design, but generate no text, logos, mastheads, or brand names."
    },
    {
      id: "cinematic-night",
      title: "시티 나이트 무드",
      category: "editorial",
      categoryLabel: "에디토리얼",
      description: "도시의 반사광과 낮은 채도로 만드는 감각적인 야간 포트레이트",
      tags: ["야간", "도시", "무드"],
      trend: "CITY MOOD",
      caption: "NIGHT / LOCAL",
      palette: { bg: "linear-gradient(135deg, #020617, #1e3a8a 52%, #7e22ce)", accent: "#22d3ee", accent2: "#e879f9", ink: "#0f172a", skin: "#d69b7b" },
      overlay: "grid",
      ko: "비가 갠 뒤의 도시 밤을 배경으로 한 감각적인 로컬 포트레이트. 유리와 노면에 번지는 실제 간판의 추상적인 색 반사, 청록과 자주색의 절제된 혼합광, 얕은 심도, 자연스러운 보행 순간을 사용한다. 장소의 생활감은 살리되 읽을 수 있는 상호나 로고는 만들지 않는다.",
      en: "A cinematic local portrait in a city at night after rain. Use abstract color reflections from real urban light across glass and pavement, a restrained mix of cyan and magenta illumination, shallow depth of field, and a natural walking moment. Preserve lived-in local atmosphere without generating legible signs, logos, or brand names."
    },
    {
      id: "tactile-collage",
      title: "텍스처 콜라주",
      category: "art",
      categoryLabel: "아트",
      description: "종이·테이프·손그림 흔적을 겹쳐 완성하는 불완전한 편집 디자인",
      tags: ["콜라주", "종이 질감", "그래픽"],
      trend: "IMPERFECT",
      caption: "CUT / PASTE",
      palette: { bg: "linear-gradient(135deg, #fafaf9, #fde68a 48%, #fca5a5)", accent: "#dc2626", accent2: "#2563eb", ink: "#292524", skin: "#dfaa87" },
      overlay: "grid",
      ko: "인물 사진을 중심으로 찢은 종이 가장자리, 반투명 테이프, 연필 표시, 잉크 번짐, 비대칭 색면을 겹친 촉각적인 편집 콜라주. 얼굴의 핵심 부분은 선명하고 가리지 않으며, 손으로 만든 듯한 작은 어긋남과 불완전함을 의도적으로 남긴다. 실제 글자나 로고는 넣지 않는다.",
      en: "A tactile editorial collage built around the portrait with torn paper edges, translucent tape, pencil marks, ink bleed, and asymmetric color blocks. Keep the key facial area clear and recognizable while preserving small handmade misalignments and deliberate imperfections. Include no legible text or logos."
    },
    {
      id: "surreal-bloom",
      title: "서리얼 블룸",
      category: "art",
      categoryLabel: "아트",
      description: "꽃잎·빛·공기의 감각을 인물 주변에 확장한 몽환적 초현실 화보",
      tags: ["초현실", "플로럴", "몽환"],
      trend: "SURREAL",
      caption: "DREAM / SENSE",
      palette: { bg: "linear-gradient(145deg, #3b0764, #a21caf 47%, #f0abfc)", accent: "#d946ef", accent2: "#86efac", ink: "#2e1065", skin: "#e8ae91" },
      overlay: "noise",
      ko: "인물 주변으로 반투명 꽃잎과 빛의 층, 공기의 흐름이 유기적으로 확장되는 감각적인 초현실 포트레이트. 얼굴은 현실적이고 선명하게 유지하며, 주변 요소만 꿈처럼 변형한다. 보라색과 부드러운 초록색의 깊은 색조, 촉각적인 미세 질감, 우아한 여백을 사용한다.",
      en: "A sensory surreal portrait where translucent petals, layered light, and visible currents of air expand organically around the subject. Keep the face realistic and sharply recognizable while only the surrounding elements become dreamlike. Use deep violet and soft green tones, tactile micro-texture, and elegant negative space."
    },
    {
      id: "iridescent-future",
      title: "이리데슨트 퓨처",
      category: "art",
      categoryLabel: "아트",
      description: "유리·크롬·홀로그램 반사를 절제해 적용한 미래적 프로필",
      tags: ["홀로그램", "크롬", "테크"],
      trend: "FUTURE",
      caption: "CHROME / GLOW",
      palette: { bg: "linear-gradient(140deg, #082f49, #4338ca 48%, #f0abfc)", accent: "#67e8f9", accent2: "#f0abfc", ink: "#172554", skin: "#db9f83" },
      overlay: "grid",
      ko: "투명 유리와 이리데슨트 크롬 표면의 반사가 인물을 감싸는 미래적 포트레이트. 피부색은 자연스럽게 유지하고 청록, 라일락, 은색의 가장자리 빛만 절제해 더한다. 정교한 스튜디오 조명, 깨끗한 실루엣, 현대적인 테크 브랜드 화보의 분위기를 사용하되 과장된 사이버 갑옷은 피한다.",
      en: "A future-facing portrait surrounded by restrained reflections from clear glass and iridescent chrome surfaces. Keep the subject's skin tone natural while adding subtle cyan, lilac, and silver edge light. Use precise studio lighting, a clean silhouette, and modern technology-brand editorial energy without exaggerated cyber armor."
    },
    {
      id: "collectible-figure",
      title: "컬렉터블 피규어",
      category: "character",
      categoryLabel: "캐릭터",
      description: "본인의 특징과 취향을 작은 수집용 캐릭터로 재해석",
      tags: ["피규어", "미니어처", "선물"],
      trend: "PLAYFUL",
      caption: "MINI / OBJECT",
      palette: { bg: "linear-gradient(145deg, #0f766e, #2dd4bf 45%, #fde68a)", accent: "#0f766e", accent2: "#f59e0b", ink: "#134e4a", skin: "#e6ad8c" },
      overlay: "frame",
      ko: "첨부한 인물의 얼굴 특징, 헤어스타일, 대표적인 의상을 알아볼 수 있게 유지한 프리미엄 수집용 미니 피규어. 매트한 레진 재질, 정교하지만 친근한 비율, 작은 원형 받침, 부드러운 제품 촬영 조명을 사용한다. 인물의 취미를 암시하는 작은 소품 한두 개를 배치하되 상표, 패키지 글자, 로고는 만들지 않는다.",
      en: "A premium collectible miniature figure that keeps the reference subject recognizable through facial features, hairstyle, and signature clothing. Use matte resin material, detailed yet friendly proportions, a small circular base, and soft product-photography lighting. Add one or two tiny accessories suggesting the subject's interests, with no brands, packaging text, or logos."
    },
    {
      id: "webtoon-character",
      title: "모던 웹툰 캐릭터",
      category: "character",
      categoryLabel: "캐릭터",
      description: "얼굴의 특징을 간결한 선과 색으로 살린 세련된 일러스트 프로필",
      tags: ["웹툰", "일러스트", "아바타"],
      trend: "AVATAR",
      caption: "LINE / COLOR",
      palette: { bg: "linear-gradient(135deg, #e0e7ff, #fce7f3 52%, #fef3c7)", accent: "#7c3aed", accent2: "#ec4899", ink: "#312e81", skin: "#edb18f" },
      overlay: "frame",
      ko: "첨부한 인물의 얼굴형, 눈매, 헤어스타일, 표정의 특징을 알아볼 수 있도록 단순화한 현대적인 웹툰 캐릭터. 깨끗하고 자신감 있는 선, 절제된 셀 셰이딩, 조화로운 파스텔 색상, 선명한 눈과 자연스러운 포즈를 사용한다. 특정 작가나 기존 작품을 모방하지 않는 독창적인 상업 일러스트 스타일로 표현한다.",
      en: "A modern webtoon-inspired character that simplifies but preserves the reference subject's recognizable face shape, eyes, hairstyle, and expression. Use clean confident linework, restrained cel shading, a harmonious pastel palette, clear eyes, and a natural pose. Create an original commercial illustration style without imitating any specific artist or existing title."
    },
    {
      id: "soft-clay",
      title: "소프트 클레이 아바타",
      category: "character",
      categoryLabel: "캐릭터",
      description: "둥근 형태와 손맛이 느껴지는 점토 질감의 친근한 3D 아바타",
      tags: ["클레이", "3D", "아바타"],
      trend: "SOFT 3D",
      caption: "CLAY / FRIENDLY",
      palette: { bg: "linear-gradient(135deg, #fef3c7, #fed7aa 50%, #fecdd3)", accent: "#f97316", accent2: "#fb7185", ink: "#7c2d12", skin: "#e9ae8b" },
      overlay: "noise",
      ko: "첨부한 인물의 특징을 둥글고 친근한 3D 클레이 아바타로 변환한다. 손으로 빚은 듯한 미세한 표면 흔적, 부드러운 형태, 따뜻한 파스텔 색, 큰 소프트박스 조명과 약한 접지 그림자를 사용한다. 얼굴의 핵심 인상과 헤어스타일은 유지하고 지나치게 유아적으로 만들지 않는다.",
      en: "Transform the reference subject into a rounded, approachable 3D clay avatar. Use subtle handmade surface marks, soft forms, warm pastel colors, large-source studio lighting, and a gentle contact shadow. Preserve the core facial impression and hairstyle without making the subject excessively childlike."
    }
  ];

  const categoryPalettes = {
    profile: { bg: "linear-gradient(135deg,#dbeafe,#f8fafc 55%,#bfdbfe)", accent: "#2563eb", accent2: "#60a5fa", ink: "#172554", skin: "#e7b394" },
    editorial: { bg: "linear-gradient(135deg,#18181b,#71717a 55%,#e4e4e7)", accent: "#f97316", accent2: "#facc15", ink: "#18181b", skin: "#dda889" },
    relationship: { bg: "linear-gradient(135deg,#ffe4e6,#fff7ed 52%,#fef3c7)", accent: "#e11d48", accent2: "#fb923c", ink: "#881337", skin: "#e5ad8c" },
    content: { bg: "linear-gradient(135deg,#312e81,#7c3aed 48%,#f472b6)", accent: "#a78bfa", accent2: "#f9a8d4", ink: "#1e1b4b", skin: "#dfaa8d" },
    film: { bg: "linear-gradient(135deg,#422006,#a16207 52%,#fde68a)", accent: "#b45309", accent2: "#fbbf24", ink: "#451a03", skin: "#dfaa87" },
    art: { bg: "linear-gradient(135deg,#3b0764,#c026d3 48%,#f0abfc)", accent: "#c026d3", accent2: "#67e8f9", ink: "#2e1065", skin: "#e4aa8c" },
    character: { bg: "linear-gradient(135deg,#ccfbf1,#e0e7ff 50%,#fce7f3)", accent: "#0d9488", accent2: "#8b5cf6", ink: "#134e4a", skin: "#e8ae8e" },
    sticker: { bg: "linear-gradient(135deg,#fff7ed,#fce7f3 48%,#e0e7ff)", accent: "#db2777", accent2: "#8b5cf6", ink: "#831843", skin: "#e8ae8e" },
    fantasy: { bg: "linear-gradient(135deg,#172554,#5b21b6 48%,#c084fc)", accent: "#7c3aed", accent2: "#facc15", ink: "#1e1b4b", skin: "#e6aa8c" },
    timewarp: { bg: "linear-gradient(135deg,#451a03,#b45309 48%,#fef3c7)", accent: "#b45309", accent2: "#0f766e", ink: "#451a03", skin: "#dfaa87" },
    toy: { bg: "linear-gradient(135deg,#cffafe,#fce7f3 48%,#fef3c7)", accent: "#0891b2", accent2: "#f472b6", ink: "#164e63", skin: "#e9af90" },
    meme: { bg: "linear-gradient(135deg,#fef08a,#fb7185 48%,#818cf8)", accent: "#e11d48", accent2: "#4f46e5", ink: "#4c0519", skin: "#e7ad8d" }
  };

  const addedPresetData = [
    ["linkedin-career", "링크드인 커리어", "profile", "채용 담당자에게 신뢰와 친근함을 함께 전달하는 커리어 프로필", ["링크드인", "이력서", "커리어"], "CAREER", "OPEN / CAPABLE", ["career", "social"], ["single"], ["1:1", "4:5"], "밝고 정돈된 현대식 오피스 또는 뉴트럴 스튜디오에서 촬영한 커리어 프로필. 자연스러운 자신감, 단정한 비즈니스 캐주얼, 눈높이 카메라, 부드러운 창빛과 실제 피부 질감을 유지한다.", "A polished career profile in a bright modern office or neutral studio, with natural confidence, refined business-casual wardrobe, eye-level camera, soft window light, and authentic skin texture."],
    ["executive-presence", "임원 프로필", "profile", "절제된 권위와 안정감을 살리는 리더십 포트레이트", ["임원", "리더십", "보도자료"], "LEADERSHIP", "CALM / DECISIVE", ["career", "content"], ["single"], ["4:5", "3:4", "1:1"], "절제된 고급 공간에서 촬영한 리더십 포트레이트. 곧은 자세, 차분한 시선, 깊이 있는 단방향 조명, 절제된 색보정과 넉넉한 여백으로 신뢰와 결정력을 표현한다.", "A restrained leadership portrait in a premium understated setting, using poised posture, calm eye contact, dimensional directional light, refined color grading, and generous negative space."],
    ["speaker-author", "연사·작가 프로필", "editorial", "강연·책·기고 페이지에 어울리는 지적인 에디토리얼", ["연사", "작가", "소개"], "THOUGHT", "IDEA / VOICE", ["career", "content"], ["single"], ["4:5", "3:4", "16:9"], "책, 노트, 강연 무대의 분위기를 은유적으로 담은 지적인 에디토리얼 인물 사진. 생각하는 표정, 손의 자연스러운 제스처, 차분한 웜톤과 텍스트 배치용 여백을 사용하되 실제 글자는 만들지 않는다.", "An intellectual editorial portrait with subtle cues of books, notes, or a speaking stage, a thoughtful expression, natural hand gesture, calm warm tones, and text-safe negative space without generating text."],
    ["creator-studio", "크리에이터 스튜디오", "editorial", "작업 도구와 개성을 함께 보여주는 창작자 브랜드 화보", ["크리에이터", "작업실", "브랜딩"], "MAKER", "PROCESS / PERSON", ["career", "social", "content"], ["single", "pair"], ["4:5", "16:9", "3:4"], "실제 작업실에서 창작 중인 순간을 포착한 크리에이터 브랜드 화보. 대표 도구와 재료는 맥락을 만들 정도로만 배치하고 얼굴과 손, 작업 과정에 자연스럽게 시선이 모이게 한다.", "A creator-brand editorial captured mid-process in a believable studio, with signature tools and materials used sparingly for context while attention stays on the face, hands, and authentic act of making."],
    ["clean-id-style", "증명사진 스타일", "profile", "공식 제출용이 아닌 깔끔한 정면 기록 사진 스타일", ["정면", "단색 배경", "기록용"], "NEUTRAL", "FRONT / CLEAR", ["career", "social"], ["single"], ["3:4", "4:5"], "공식 신분증 제작이 아닌 개인 기록용 증명사진 스타일. 정면 시선, 중립적인 표정, 균일한 조명, 단색 배경, 자연스러운 얼굴 비율과 최소한의 보정을 사용한다.", "A clean front-facing record-portrait style for personal use, not an official identity document: neutral expression, even lighting, plain backdrop, natural facial proportions, and minimal retouching."],
    ["couple-cinema", "커플 시네마", "relationship", "두 사람을 독립적으로 보존해 한 장면처럼 연결하는 영화 포스터 감성", ["커플", "2인", "기념"], "DUO", "TWO / ONE STORY", ["family", "gift", "social"], ["pair"], ["4:5", "16:9", "3:4"], "두 인물의 개별 정체성을 정확히 보존하면서 시선과 동선이 연결되는 시네마틱 커플 포트레이트. 부드러운 역광, 자연스러운 거리감과 진짜 관계의 분위기를 살린다.", "A cinematic couple portrait that preserves both identities independently while connecting their gaze and movement, using soft backlight, believable personal space, and authentic relational warmth."],
    ["family-archive", "패밀리 아카이브", "relationship", "세대와 인원 차이를 자연스럽게 담는 따뜻한 가족 기록", ["가족", "세대", "기록"], "FAMILY", "ROOTS / NOW", ["family", "gift"], ["pair", "smallGroup", "largeGroup"], ["4:5", "3:4", "16:9"], "여러 세대의 가족을 인물별로 정확히 보존한 따뜻한 아카이브 포트레이트. 자연스러운 거리와 손짓, 부드러운 실내 자연광, 시대를 타지 않는 색감으로 구성한다.", "A warm multi-generation family archive portrait that preserves every identity, with natural spacing and gestures, soft indoor daylight, and timeless color."],
    ["friends-magazine", "프렌즈 매거진", "relationship", "친구들의 개성과 관계를 모듈형 화보로 보여주는 그룹 콜라주", ["친구", "그룹", "매거진"], "CREW", "MANY / ENERGY", ["social", "gift", "content"], ["smallGroup", "largeGroup"], ["4:5", "1:1", "16:9"], "친구 각자의 표정과 스타일을 독립 패널로 살린 활기찬 매거진 콜라주. 패널 크기와 크롭에 리듬을 주되 모든 인물을 같은 중요도로 알아볼 수 있게 한다.", "An energetic magazine collage that gives each friend an independent panel and personality, with rhythmic crops and panel sizes while keeping everyone equally recognizable."],
    ["team-profile-board", "팀 프로필 보드", "relationship", "구성원을 빠짐없이 정돈된 한 장으로 묶는 조직 프로필", ["팀", "조직", "프로필 보드"], "TEAM", "ONE SYSTEM", ["team", "career"], ["smallGroup", "largeGroup"], ["16:9", "1:1", "4:5"], "팀 구성원마다 동일한 카메라 높이, 조명, 배경, 크롭을 적용한 정돈된 프로필 보드. 인원 누락이나 중복 없이 각 인물을 독립 셀에 정확히 한 번 배치한다.", "An orderly team profile board with consistent camera height, light, backdrop, and crop for every member, placing each identity exactly once in an independent cell."],
    ["reunion-yearbook", "리유니언 이어북", "relationship", "동창회·모임의 인물을 레트로 연감 그리드로 재구성", ["동창회", "연감", "단체"], "REUNION", "THEN / NOW", ["team", "gift", "family"], ["smallGroup", "largeGroup"], ["4:5", "3:4", "1:1"], "각 인물을 동일한 배경과 부드러운 플래시로 촬영한 듯한 레트로 연감 그리드. 인물 이름이나 글자는 만들지 않고, 따뜻한 인쇄 색감과 미세한 종이 질감을 적용한다.", "A retro yearbook grid with each person photographed against a consistent backdrop and soft flash, warm print color, and subtle paper texture, without names or text."],
    ["pet-family", "펫 패밀리", "relationship", "사람과 반려동물을 각각 또렷하게 살리는 가족 포트레이트", ["반려동물", "가족", "기념"], "TOGETHER", "HUMAN / PET", ["family", "gift", "social"], ["pair", "smallGroup"], ["4:5", "1:1", "3:4"], "사람과 반려동물의 특징을 각각 정확히 보존하고 눈높이와 조명을 자연스럽게 맞춘 가족 포트레이트. 억지 포즈보다 편안한 상호작용과 실제 털 질감을 살린다.", "A family portrait that accurately preserves both people and pets, naturally matching eye levels and lighting while emphasizing relaxed interaction and authentic fur texture."],
    ["album-cover", "앨범 커버", "content", "인물과 상징적 오브젝트로 음악의 분위기를 만드는 정사각 커버", ["앨범", "음악", "커버"], "SOUND", "FACE / SYMBOL", ["content", "social"], ["single", "pair", "smallGroup"], ["1:1"], "인물을 중심으로 음악 장르를 암시하는 상징적 빛과 오브젝트를 배치한 앨범 커버 화보. 강한 시각적 중심과 여백을 만들되 실제 제목이나 로고는 생성하지 않는다.", "An album-cover portrait using symbolic light and objects to imply a musical genre, with a strong focal point and intentional negative space but no generated title or logo."],
    ["sports-trading-card", "스포츠 트레이딩 카드", "content", "동작과 기록의 에너지를 한 장에 압축한 선수 카드 스타일", ["스포츠", "카드", "동작"], "MOTION", "POWER / STAT", ["content", "gift", "social"], ["single", "smallGroup"], ["3:4", "4:5"], "선수의 얼굴과 유니폼 특징을 보존하고 역동적인 경기 동작, 속도감 있는 그래픽 레이어, 경기장 빛을 결합한 프리미엄 트레이딩 카드 스타일. 숫자와 글자는 만들지 않는다.", "A premium sports trading-card image preserving the athlete's face and uniform while combining dynamic action, speed-driven graphic layers, and stadium light, with no numbers or text."],
    ["movie-poster", "무비 포스터", "content", "주인공의 서사와 장르를 한 컷에 담는 시네마틱 키아트", ["영화", "포스터", "키아트"], "KEY ART", "STORY / SCALE", ["content", "gift"], ["single", "pair", "smallGroup"], ["4:5", "16:9", "3:4"], "인물의 정체성을 유지하면서 장르적 공간, 극적인 빛, 깊이 있는 레이어로 서사를 암시하는 영화 키아트. 제목과 크레딧을 넣을 여백만 남기고 실제 글자는 생성하지 않는다.", "Cinematic key art preserving the subject while suggesting story through genre-specific space, dramatic light, and layered depth, leaving room for title and credits without generating text."],
    ["travel-postcard", "트래블 포스트카드", "content", "여행지의 색과 인물을 여러 장면으로 엮는 기념 콜라주", ["여행", "엽서", "콜라주"], "TRAVEL", "PLACE / MEMORY", ["gift", "social", "content"], ["single", "pair", "smallGroup"], ["4:5", "16:9", "1:1"], "인물 포트레이트와 여행지의 건축, 풍경, 작은 디테일을 모듈형 콜라주로 엮은 현대적 포스트카드. 실제 장소의 분위기는 살리되 읽을 수 있는 글자는 만들지 않는다.", "A modern postcard collage combining portraits with architecture, landscape, and small travel details in a modular layout, preserving a believable sense of place without legible text."],
    ["retro-yearbook", "레트로 이어북", "film", "낮은 채도와 소프트 플래시로 재현한 시대감 있는 졸업 사진", ["레트로", "졸업", "연감"], "RETRO", "CLASS / FILM", ["social", "gift"], ["single", "pair", "smallGroup"], ["3:4", "4:5"], "1980~1990년대 학교 연감의 절제된 스튜디오 인물 사진. 소프트 플래시, 청회색 또는 갈색 배경, 낮은 채도, 부드러운 인쇄 질감을 사용하되 특정 학교 문장이나 글자는 만들지 않는다.", "A restrained 1980s–1990s school-yearbook studio portrait with soft flash, blue-gray or brown backdrop, muted color, and gentle print texture, without school marks or text."],
    ["photobooth-strip", "포토부스 스트립", "film", "인물별 표정 변화를 세로 스트립 한 장으로 묶는 즉흥 사진", ["포토부스", "스트립", "표정"], "4 CUTS", "POSE / PLAY", ["social", "gift", "family"], ["single", "pair", "smallGroup"], ["9:16", "3:4"], "같은 인물이 프레임마다 다른 자연스러운 표정과 제스처를 보이는 포토부스 스트립. 플래시, 약간의 필름 입자, 일정한 배경을 유지하고 모든 컷을 한 장에 정렬한다.", "A photobooth strip with natural expression and gesture changes across frames, consistent background, direct flash, and subtle film grain, arranged as one finished image."],
    ["pixel-avatar", "픽셀 아바타", "character", "식별 특징을 선명한 도트 형태로 단순화한 게임형 프로필", ["픽셀", "게임", "아바타"], "PIXEL", "ICON / SELF", ["avatar", "social"], ["single", "pair"], ["1:1"], "얼굴형, 헤어스타일, 대표 의상을 알아볼 수 있게 단순화한 고해상도 픽셀 아바타. 제한된 컬러 팔레트, 또렷한 실루엣, 깨끗한 픽셀 가장자리를 사용한다.", "A high-resolution pixel avatar that simplifies but preserves face shape, hairstyle, and signature clothing, using a limited palette, clear silhouette, and crisp pixel edges."],
    ["paper-doll", "페이퍼 돌", "character", "종이 결·오려낸 가장자리로 표현한 수집형 캐릭터", ["종이인형", "컷아웃", "캐릭터"], "PAPER", "CUT / DRESS", ["avatar", "gift"], ["single", "pair", "smallGroup"], ["3:4", "4:5"], "인물의 특징을 평면적인 종이 인형으로 재해석한다. 인쇄 잉크, 오려낸 가장자리, 작은 종이 섬유, 교체 가능한 의상 조각 같은 수공예 느낌을 살리되 글자는 넣지 않는다.", "Reinterpret the subject as a flat paper doll with printed ink, cut edges, visible paper fibers, and handcrafted interchangeable-outfit cues, without text."],
    ["plush-doll", "플러시 돌", "character", "표정과 헤어를 부드러운 봉제인형 질감으로 재현", ["봉제인형", "플러시", "선물"], "PLUSH", "SOFT / LIKENESS", ["avatar", "gift", "family"], ["single", "pair", "smallGroup"], ["1:1", "4:5"], "인물의 눈매, 헤어스타일, 대표 의상을 알아볼 수 있는 프리미엄 봉제인형. 짧고 부드러운 원단, 정교한 자수 얼굴, 자연스러운 솔기와 제품 사진 조명을 사용한다.", "A premium plush doll recognizable through the subject's eyes, hairstyle, and signature outfit, using short soft fabric, refined embroidered facial details, natural seams, and product lighting."],
    ["ink-portrait", "잉크 드로잉", "art", "굵기 변화가 있는 선과 여백으로 인상을 압축한 인물화", ["잉크", "선화", "드로잉"], "INK", "LINE / SPACE", ["avatar", "gift", "content"], ["single", "pair", "smallGroup"], ["3:4", "4:5", "1:1"], "인물의 얼굴 비율과 표정을 알아볼 수 있게 유지한 현대적 잉크 인물화. 굵기 변화가 있는 자신감 있는 선, 제한된 번짐, 넓은 여백과 작은 포인트 색을 사용한다.", "A contemporary ink portrait preserving recognizable facial proportions and expression, with confident varied line weight, controlled bleed, generous white space, and one restrained accent color."],
    ["vintage-engraving", "빈티지 인그레이빙", "art", "촘촘한 해칭으로 재현한 고전 판화형 초상", ["판화", "해칭", "빈티지"], "ETCHED", "CRAFT / DETAIL", ["gift", "content"], ["single", "pair"], ["3:4", "4:5"], "인물의 구조를 정확히 보존한 고전 동판화풍 초상. 교차 해칭, 세밀한 선 밀도, 오래된 종이 질감, 한두 가지 잉크 색으로 표현하되 지폐나 공식 문서처럼 보이지 않게 한다.", "A classical engraving-style portrait preserving facial structure with cross-hatching, fine line density, aged paper, and one or two ink colors, avoiding resemblance to currency or official documents."],
    ["storybook", "스토리북 일러스트", "character", "따뜻한 붓질과 서사적 배경의 동화책형 인물", ["동화", "일러스트", "가족"], "STORY", "WARM / WONDER", ["family", "gift", "avatar"], ["single", "pair", "smallGroup"], ["4:5", "3:4", "16:9"], "인물의 얼굴과 관계를 알아볼 수 있게 유지한 따뜻한 스토리북 일러스트. 부드러운 구아슈 붓질, 섬세한 배경 이야기, 포근한 빛과 독창적인 캐릭터 디자인을 사용한다.", "A warm storybook illustration preserving recognizable faces and relationships, with soft gouache brushwork, gentle narrative background details, cozy light, and original character design."],
    ["game-character-card", "게임 캐릭터 카드", "character", "인물의 특징과 역할을 판타지 카드 비주얼로 재해석", ["게임", "판타지", "카드"], "HERO", "ROLE / POWER", ["avatar", "gift", "content"], ["single", "pair", "smallGroup"], ["3:4", "4:5"], "인물의 얼굴과 헤어스타일을 유지하면서 취향을 반영한 독창적 판타지 역할과 의상으로 재해석한 캐릭터 카드 비주얼. 테두리와 능력을 암시하는 효과는 넣되 글자와 수치는 만들지 않는다.", "A character-card visual preserving face and hairstyle while reimagining the subject in an original fantasy role and outfit, with a decorative frame and power cues but no text or numbers."],
    ["mini-diorama", "미니어처 디오라마", "character", "인물과 일상을 작은 입체 장면으로 압축한 수집형 오브젝트", ["디오라마", "미니어처", "취미"], "MINI WORLD", "LIFE / OBJECT", ["gift", "avatar", "family"], ["single", "pair", "smallGroup"], ["1:1", "4:5", "16:9"], "인물의 외형과 대표적인 일상 공간을 손바닥 크기의 정교한 미니어처 디오라마로 재현한다. 축척이 일관된 소품, 따뜻한 제품 조명, 재질감 있는 받침을 사용한다.", "Recreate the subject and a signature everyday setting as a palm-sized detailed miniature diorama, with consistently scaled props, warm product lighting, and a tactile display base."]
  ];

  addedPresetData.forEach(([id, title, category, description, tags, trend, caption, purposes, peopleFit, ratios, ko, en]) => {
    presets.push({ id, title, category, categoryLabel: { relationship: "관계·그룹", content: "콘텐츠" }[category] || ({ profile: "프로필", editorial: "에디토리얼", film: "필름", art: "아트", character: "캐릭터" }[category]), description, tags, trend, caption, palette: categoryPalettes[category], overlay: category === "film" || category === "art" ? "noise" : "frame", purposes, peopleFit, ratios, previewVersion: GPT_IMAGE_PREVIEW_VERSION, ko, en });
  });

  const stickerPresetData = [
    {
      id: "face-reaction-stickers", title: "얼굴 리액션 이모티콘", description: "얼굴의 닮은꼴을 살려 9가지 감정을 한 장에 구성", tags: ["얼굴", "표정", "9종"], trend: "EMOJI", caption: "FACE / REACTION", itemCount: 9, grid: "3×3",
      ko: "첨부한 인물의 얼굴형, 눈매, 헤어스타일과 대표 특징을 알아볼 수 있게 단순화한 얼굴 중심 이모티콘 세트. 기쁨, 폭소, 감동, 놀람, 고민, 당황, 화남, 응원, 졸림의 서로 분명히 다른 9가지 표정을 만든다. 목 아래는 최소화하고 표정이 작은 크기에서도 즉시 읽히게 한다.",
      en: "A face-led emoji set that simplifies while preserving the reference subject's recognizable face shape, eyes, hairstyle, and signature features. Create nine clearly distinct expressions: joy, laughter, touched, surprise, thinking, flustered, angry, cheering, and sleepy. Minimize the body below the neck and keep every expression legible at small size."
    },
    {
      id: "photo-cutout-stickers", title: "포토 컷아웃 스티커", description: "실제 얼굴과 의상을 살린 다이컷 포토 스티커 6종", tags: ["포토", "다이컷", "SNS"], trend: "PHOTO", caption: "CUTOUT / POSE", itemCount: 6, grid: "3×2",
      ko: "첨부 사진의 실제 얼굴과 피부 질감을 유지한 포토 컷아웃 스티커 세트. 손인사, 엄지척, 브이, 박수, 하트 포즈, 파이팅 포즈의 상반신 6종을 만들고 각 인물 외곽에 균일하고 두꺼운 흰색 다이컷 테두리와 아주 약한 그림자를 적용한다.",
      en: "A photo cutout sticker set preserving the real face and authentic skin texture from the reference. Create six upper-body poses: wave, thumbs-up, peace sign, applause, heart pose, and fighting cheer. Add a consistent thick white die-cut outline and a very subtle shadow around each subject."
    },
    {
      id: "chibi-daily-stickers", title: "치비 일상 스티커", description: "사진 속 특징을 귀여운 전신 캐릭터와 일상 행동으로 변환", tags: ["치비", "캐릭터", "일상"], trend: "CHIBI", caption: "CUTE / DAILY", itemCount: 8, grid: "4×2",
      ko: "첨부한 인물의 헤어스타일, 얼굴 인상, 대표 의상과 액세서리를 유지한 독창적인 치비 캐릭터 스티커. 큰 머리와 작은 몸의 일관된 비율로 인사, 식사, 출근, 집중, 휴식, 운동, 축하, 취침의 일상 행동 8종을 만든다. 특정 작품이나 작가를 모방하지 않는다.",
      en: "An original chibi character sticker set preserving the subject's hairstyle, facial impression, signature outfit, and accessories. Use one consistent large-head, small-body proportion across eight everyday actions: greeting, eating, commuting, focusing, resting, exercising, celebrating, and sleeping. Do not imitate a specific artist or existing title."
    },
    {
      id: "clay-face-emojis", title: "3D 클레이 얼굴 이모티콘", description: "둥근 점토 질감과 풍부한 표정의 3D 얼굴 아이콘", tags: ["3D", "클레이", "얼굴"], trend: "SOFT 3D", caption: "CLAY / MOOD", itemCount: 9, grid: "3×3",
      ko: "첨부 인물의 핵심 얼굴 특징과 헤어스타일을 둥근 3D 클레이 얼굴 아이콘으로 변환한다. 미소, 폭소, 윙크, 사랑, 놀람, 울먹임, 삐침, 집중, 졸림의 9종을 만들며, 모든 아이콘에 같은 재질, 카메라 각도, 조명과 얼굴 비율을 유지한다.",
      en: "Transform the subject's core facial features and hairstyle into rounded 3D clay face icons. Create nine expressions: smile, laughter, wink, love, surprise, teary, sulking, focus, and sleepy. Keep identical material, camera angle, lighting, and facial proportions across every icon."
    },
    {
      id: "handdrawn-reaction-stickers", title: "손그림 리액션 스티커", description: "낙서 선과 포인트 색으로 만든 친근한 감정 스티커", tags: ["손그림", "낙서", "리액션"], trend: "DOODLE", caption: "LINE / FEELING", itemCount: 9, grid: "3×3",
      ko: "인물의 얼굴과 헤어 특징을 빠르고 자신감 있는 손그림 선으로 단순화한 리액션 스티커 9종. 선 굵기의 작은 흔들림, 제한된 두세 가지 포인트 색, 종이 위에 그린 듯한 따뜻한 질감을 사용하되 각 스티커의 실루엣은 깔끔하고 독립적으로 유지한다.",
      en: "Nine reaction stickers simplifying the subject's face and hair with quick, confident hand-drawn lines. Use slight line-weight wobble, two or three restrained accent colors, and a warm drawn-on-paper feeling while keeping every sticker silhouette clean and isolated."
    },
    {
      id: "personal-mascot-stickers", title: "나만의 마스코트 스티커", description: "인물의 취향과 특징을 하나의 고유 캐릭터로 설계", tags: ["마스코트", "브랜딩", "캐릭터"], trend: "MASCOT", caption: "SELF / BRAND", itemCount: 8, grid: "4×2",
      ko: "첨부 인물의 얼굴 인상, 헤어스타일, 좋아하는 색과 취향을 반영해 하나의 독창적인 개인 마스코트를 설계한다. 기본 포즈, 인사, 아이디어, 작업, 성공, 감사, 안내, 휴식의 8종 스티커로 확장하고 모든 컷에서 형태 언어, 의상, 색상과 소품을 정확히 통일한다.",
      en: "Design one original personal mascot based on the subject's facial impression, hairstyle, favorite colors, and interests. Expand it into eight stickers: neutral pose, greeting, idea, working, success, thanks, guiding, and resting. Keep shape language, outfit, colors, and props exactly consistent across all stickers."
    },
    {
      id: "pet-reaction-stickers", title: "반려동물 리액션 스티커", description: "반려동물의 무늬와 표정을 살린 귀여운 스티커 팩", tags: ["반려동물", "펫", "표정"], trend: "PET", caption: "PET / REACTION", itemCount: 9, grid: "3×3", subjectType: "pet",
      ko: "첨부한 반려동물 사진을 유일한 외형 참조로 사용한다. 품종, 얼굴 무늬, 귀 모양, 털색, 눈동자와 체형을 정확히 유지하면서 기쁨, 배고픔, 산책, 장난, 궁금함, 놀람, 삐침, 졸림, 사랑의 9가지 스티커를 만든다. 사람 얼굴이나 사람 손발을 추가하지 않는다.",
      en: "Use the attached pet photo as the sole appearance reference. Accurately preserve breed, facial markings, ear shape, fur color, eyes, and body proportions while creating nine stickers: happy, hungry, walk, playful, curious, surprised, sulking, sleepy, and love. Do not add a human face, hands, or feet."
    },
    {
      id: "couple-duo-stickers", title: "커플·친구 듀오 스티커", description: "두 사람의 개별 닮은꼴과 관계를 함께 살린 6종", tags: ["커플", "친구", "2인"], trend: "DUO", caption: "TWO / TOGETHER", itemCount: 6, grid: "3×2", peopleFit: ["pair"],
      ko: "첨부 사진 속 두 사람의 얼굴, 헤어스타일과 의상 특징을 서로 섞지 않고 독립적으로 보존한 듀오 캐릭터 스티커. 함께 인사, 하이파이브, 축하, 응원, 장난, 하트의 관계 동작 6종을 만든다. 두 인물의 키 차이와 고유 색상도 모든 컷에서 일관되게 유지한다.",
      en: "A duo character sticker set that preserves both people's faces, hairstyles, and clothing independently without mixing traits. Create six relational actions: greeting together, high-five, celebration, cheering, playful moment, and heart. Keep their height difference and individual color cues consistent in every sticker."
    },
    {
      id: "animated-face-bounce", title: "움직이는 얼굴 · 바운스", description: "표정이 커지며 통통 튀는 8프레임 루프 원본", tags: ["움직이는", "프레임", "루프"], trend: "ANIMATED", caption: "BOUNCE / LOOP", outputType: "animatedSprite", frameCount: 8, grid: "4×2",
      ko: "얼굴 중심 이모티콘이 기대하는 표정에서 환한 웃음으로 변하며 위로 살짝 튀었다가 원래 위치로 돌아오는 바운스 동작. 움직임은 작고 탄력 있게 만들며 얼굴 형태와 헤어스타일은 변형되지 않게 한다.",
      en: "A face-led emoji that changes from anticipation to a bright smile while making a small elastic upward bounce and returning to its starting position. Keep the motion compact and lively without warping the face shape or hairstyle."
    },
    {
      id: "animated-character-wave", title: "움직이는 캐릭터 · 손인사", description: "자연스럽게 손을 흔들고 멈추는 8프레임 루프 원본", tags: ["손인사", "캐릭터", "스프라이트"], trend: "ANIMATED", caption: "WAVE / LOOP", outputType: "animatedSprite", frameCount: 8, grid: "4×2",
      ko: "첨부 인물을 알아볼 수 있는 단순한 상반신 캐릭터가 손을 들어 좌우로 두 번 흔들고 자연스럽게 기본 자세로 돌아오는 인사 동작. 팔꿈치와 손목의 움직임을 부드럽게 연결하고 다른 신체 부위는 안정적으로 유지한다.",
      en: "A simple recognizable upper-body character raises one hand, waves side to side twice, and naturally returns to the neutral pose. Connect elbow and wrist motion smoothly while keeping the rest of the body stable."
    },
    {
      id: "animated-heart-pop", title: "움직이는 캐릭터 · 하트 팝", description: "작은 하트가 나타나 커졌다 사라지는 12프레임 루프", tags: ["하트", "감정", "12프레임"], trend: "ANIMATED", caption: "HEART / POP", outputType: "animatedSprite", frameCount: 12, grid: "4×3",
      ko: "첨부 인물을 알아볼 수 있는 캐릭터가 두 손으로 작은 하트를 만들면 가슴 앞에 하트가 나타나 부드럽게 커지고 반짝인 뒤 사라지는 동작. 표정은 미소로 자연스럽게 변하며 효과가 사라진 마지막 상태는 첫 자세와 매끄럽게 이어지게 한다.",
      en: "A recognizable character forms a small heart with both hands; a heart appears at the chest, grows softly, sparkles, and disappears. Let the expression transition into a smile, then make the final cleared pose connect seamlessly back to the first pose."
    },
    {
      id: "animated-celebration-loop", title: "움직이는 캐릭터 · 축하", description: "점프와 색종이 효과를 연결한 12프레임 축하 루프", tags: ["축하", "점프", "루프"], trend: "ANIMATED", caption: "JOY / LOOP", outputType: "animatedSprite", frameCount: 12, grid: "4×3",
      ko: "첨부 인물을 알아볼 수 있는 전신 캐릭터가 가볍게 점프하며 두 팔을 들고, 작은 색종이 조각이 퍼졌다가 사라진 뒤 착지하는 축하 동작. 과도한 이동 없이 중앙에 고정하고 착지 자세가 첫 프레임과 자연스럽게 연결되게 한다.",
      en: "A recognizable full-body character makes a small jump with both arms raised as compact confetti spreads and clears before landing. Keep the character centered with limited travel, and make the landing transition naturally back to the first frame."
    }
  ];

  stickerPresetData.forEach((data) => {
    presets.push({
      category: "sticker",
      categoryLabel: "스티커·이모티콘",
      palette: categoryPalettes.sticker,
      overlay: "frame",
      purposes: ["sticker", "avatar", "social", "gift"],
      peopleFit: data.peopleFit || ["single"],
      ratios: ["1:1"],
      previewVersion: GPT_IMAGE_PREVIEW_VERSION,
      outputType: data.outputType || "stickerPack",
      ...data
    });
  });

  const funPresetData = [
    ["celestial-oracle", "천체 오라클", "fantasy", "별자리와 빛의 궤도로 인물을 신비로운 예언자로 재해석", ["별자리", "마법", "오라클"], "ARCANE", "STAR / VISION", ["play", "avatar", "gift"], ["single", "pair"], ["4:5", "3:4", "1:1"], "첨부 인물의 얼굴과 헤어스타일을 정확히 유지한 천체 오라클 포트레이트. 깊은 밤하늘 색의 로브, 손 주위를 도는 작은 별자리와 금빛 궤도, 은은한 달빛, 정교한 판타지 에디토리얼 질감을 사용한다. 과도한 광선으로 얼굴을 가리지 않고 글자나 점성술 기호는 만들지 않는다.", "A celestial-oracle portrait preserving the subject's face and hairstyle, with a midnight robe, small constellations and golden orbital light around the hands, subtle moonlight, and refined fantasy-editorial texture. Keep the face unobscured and generate no text or astrology glyphs."],
    ["forest-guardian", "숲의 수호자", "fantasy", "이끼·잎·빛을 두른 따뜻하고 장엄한 자연 수호자", ["숲", "수호자", "자연"], "GUARDIAN", "ROOT / LIGHT", ["play", "avatar", "gift"], ["single", "pair", "smallGroup"], ["4:5", "3:4", "16:9"], "인물의 정체성을 유지하면서 오래된 숲의 수호자로 변환한다. 실제 식물 질감의 망토, 작은 나뭇잎 장식, 이끼 낀 돌과 빛기둥, 차분한 녹색과 호박색을 사용한다. 얼굴과 손은 또렷하게 보이고 뿔이나 괴물형 신체 변형은 추가하지 않는다.", "Transform the recognizable subject into an ancient forest guardian with a cloak of believable botanical texture, restrained leaf ornaments, mossy stone, shafts of light, and calm green-amber color. Keep face and hands clear; add no horns or monstrous anatomy."],
    ["dragon-rider", "드래곤 라이더", "fantasy", "바람과 비늘의 속도감을 살린 모험 영화형 영웅 화보", ["드래곤", "모험", "라이더"], "ADVENTURE", "WIND / SCALE", ["play", "avatar", "content"], ["single", "pair"], ["16:9", "4:5", "3:4"], "첨부 인물을 알아볼 수 있는 드래곤 라이더 영웅 화보. 절벽 위 안장 옆에 선 전신 인물, 바람에 움직이는 실용적인 여행복, 화면 뒤로 이어지는 거대한 용의 목과 비늘 일부, 구름 사이의 극적인 자연광을 사용한다. 얼굴을 가리는 투구와 전투 장면은 피한다.", "A recognizable dragon-rider hero portrait with the full subject beside a saddle on a cliff, practical wind-swept travel clothing, part of a giant dragon's neck and scales extending behind, and dramatic natural light through clouds. Avoid face-covering helmets and active combat."],
    ["royal-masquerade", "왕실 가면무도회", "fantasy", "화려한 궁정의 색과 촛불로 만드는 우아한 판타지 파티", ["궁정", "가면무도회", "드레스"], "ROYAL", "VELVET / GLOW", ["play", "gift", "social"], ["single", "pair", "smallGroup"], ["4:5", "3:4", "16:9"], "인물의 얼굴을 가리지 않는 손에 든 장식 가면과 벨벳 의상, 촛불이 반사되는 궁정 홀, 우아한 보석색 팔레트로 구성한 왕실 가면무도회 포트레이트. 인물별 얼굴과 의상을 독립적으로 유지하고 특정 시대 왕실이나 실존 인물을 재현하지 않는다.", "A royal masquerade portrait with an ornate mask held away from the face, velvet wardrobe, candlelit reflections in a grand hall, and an elegant jewel-tone palette. Preserve every identity and outfit independently without depicting a specific real royal court or historical person."],
    ["joseon-painter-portrait", "조선 화원 초상", "timewarp", "한지와 담채의 절제로 표현하는 시대여행 인물화", ["조선", "한지", "담채"], "HERITAGE", "INK / SILK", ["play", "gift", "avatar"], ["single", "pair", "smallGroup"], ["3:4", "4:5", "1:1"], "첨부 인물의 얼굴 비율과 고유 인상을 유지한 조선시대 화원풍 초상. 절제된 한복 실루엣, 한지 결, 먹선과 옅은 담채, 단정한 좌상 구도를 사용한다. 신분을 단정하는 관복이나 왕실 표식, 실제 글씨와 낙관은 넣지 않는다.", "A Joseon-era court-painter-inspired portrait preserving the subject's facial proportions and signature impression, using a restrained hanbok silhouette, hanji texture, ink line, pale color wash, and composed seated framing. Include no rank-specific uniform, royal insignia, writing, or seals."],
    ["jazz-age-night", "1920 재즈 나이트", "timewarp", "아르데코 조명과 스윙 리듬의 고전 클럽 화보", ["1920s", "재즈", "아르데코"], "JAZZ AGE", "SWING / GOLD", ["play", "social", "content"], ["single", "pair", "smallGroup"], ["4:5", "3:4", "16:9"], "인물의 얼굴을 유지한 1920년대 재즈 클럽 에디토리얼. 아르데코 형태의 조명, 검정과 샴페인 골드 색감, 시대감 있는 정장 또는 드레스, 자연스러운 스윙 제스처와 부드러운 필름 입자를 사용한다. 실존 공연장 로고나 글자는 만들지 않는다.", "A 1920s jazz-club editorial preserving the subject's face, with Art Deco lighting shapes, black and champagne-gold color, period-inspired suit or dress, a natural swing gesture, and gentle film grain. Generate no real venue logos or text."],
    ["y2k-pop-star", "Y2K 팝스타", "timewarp", "메탈릭 컬러와 직접광 플래시로 되살린 2000년대 무대 감성", ["Y2K", "팝스타", "플래시"], "Y2K", "POP / FLASH", ["play", "social", "content"], ["single", "pair", "smallGroup"], ["4:5", "1:1", "9:16"], "첨부 인물의 특징을 유지한 2000년대 초반 팝스타 콘셉트 화보. 메탈릭 소재, 컬러 젤 조명, 직접광 플래시, 작은 헤드셋 마이크와 역동적인 무대 포즈를 사용하되 실제 가수, 그룹, 브랜드 의상은 모방하지 않는다.", "An early-2000s pop-star concept preserving the subject's features, using metallic materials, colored gel light, direct flash, a small headset microphone, and dynamic stage posing without imitating any real singer, group, or branded wardrobe."],
    ["retro-future-2088", "레트로퓨처 2088", "timewarp", "과거가 상상한 미래 도시의 낙관적인 여행자 포트레이트", ["레트로퓨처", "2088", "SF"], "2088", "PAST / FUTURE", ["play", "avatar", "content"], ["single", "pair", "smallGroup"], ["16:9", "4:5", "1:1"], "1960년대가 상상한 2088년의 낙관적인 미래 도시를 배경으로 한 인물 포트레이트. 둥근 투명 돔, 유선형 교통수단, 크림색과 주황색의 레트로 기술 의상, 깨끗한 아날로그 질감을 사용하며 인물의 얼굴과 체형은 자연스럽게 유지한다.", "A portrait in an optimistic 2088 city as imagined in the 1960s, with rounded transparent domes, streamlined transit, cream-and-orange retro-technology clothing, and clean analog texture while keeping the subject's face and body natural."],
    ["capsule-toy", "가챠 캡슐 토이", "toy", "투명 캡슐 속 미니 캐릭터와 소품으로 만드는 수집형 장난감", ["가챠", "캡슐", "미니어처"], "GACHA", "TINY / SURPRISE", ["play", "gift", "avatar"], ["single", "pair", "smallGroup"], ["1:1", "4:5", "3:4"], "첨부 인물의 얼굴, 헤어와 대표 의상을 유지한 작은 수집용 캐릭터를 투명 캡슐 안에 배치한다. 인물의 취향을 암시하는 미니 소품 두세 개, 컬러 받침, 깨끗한 제품 촬영 조명을 사용하되 패키지 글자나 브랜드 로고는 만들지 않는다.", "Place a small collectible character preserving the subject's face, hair, and signature outfit inside a clear capsule, with two or three tiny interest-based props, a colored base, and clean product lighting. Generate no packaging text or brand logos."],
    ["building-block-hero", "블록 브릭 히어로", "toy", "각진 브릭 형태로 재구성한 유쾌한 조립식 캐릭터", ["브릭", "블록", "히어로"], "BRICK", "BUILD / POSE", ["play", "avatar", "gift"], ["single", "pair", "smallGroup"], ["1:1", "4:5", "16:9"], "인물의 헤어 실루엣, 표정, 대표 의상을 알아볼 수 있는 독창적인 조립식 블록 캐릭터. 일반적인 각진 브릭 형태, 작은 원형 관절, 다채로운 조립 배경과 영웅 포즈를 사용한다. 특정 완구 회사의 부품 규격, 로고, 패키지를 모방하지 않는다.", "An original buildable block character recognizable through hair silhouette, expression, and signature outfit, using generic angular bricks, small round joints, a colorful construction backdrop, and a hero pose. Do not imitate any toy company's proprietary parts, logo, or packaging."],
    ["snow-globe-memory", "스노우글로브 메모리", "toy", "좋아하는 계절과 순간을 유리구 안에 담은 기념 오브젝트", ["스노우글로브", "계절", "기념"], "MEMORY", "GLASS / SEASON", ["play", "gift", "family"], ["single", "pair", "smallGroup"], ["1:1", "4:5", "3:4"], "첨부 인물을 알아볼 수 있는 작은 피규어와 좋아하는 계절의 장소를 하나의 스노우글로브 안에 구성한다. 유리 굴절, 섬세한 눈 또는 꽃잎 입자, 손바닥 크기의 받침과 따뜻한 제품 조명을 사용하고 얼굴이 유리 반사에 가려지지 않게 한다.", "Compose a recognizable miniature of the subject and a favorite seasonal setting inside one snow globe, with believable glass refraction, delicate snow or petal particles, a palm-sized base, and warm product light. Keep the face unobscured by reflections."],
    ["cake-topper-party", "케이크 토퍼 파티", "toy", "기념일 포즈를 달콤한 미니 케이크 장식으로 변환", ["케이크", "토퍼", "파티"], "CELEBRATE", "SWEET / MINI", ["play", "gift", "family"], ["single", "pair", "smallGroup"], ["1:1", "4:5", "3:4"], "인물의 얼굴 특징과 관계를 유지한 식용 설탕 공예 스타일의 미니 케이크 토퍼. 축하 포즈, 부드러운 아이싱 질감, 파스텔 장식과 깨끗한 테이블 촬영을 사용한다. 실제 이름, 나이 숫자, 메시지, 브랜드 장식은 넣지 않는다.", "An edible sugar-craft-style miniature cake topper preserving recognizable facial features and relationships, with a celebratory pose, soft icing texture, pastel decoration, and clean tabletop photography. Include no names, age numbers, messages, or branded decorations."],
    ["giant-on-desk", "책상 위의 거인", "meme", "평범한 사무실을 거대한 인물의 놀이터처럼 뒤집는 착시 사진", ["착시", "거인", "사무실"], "BIG MODE", "GIANT / DESK", ["play", "social", "content"], ["single", "pair"], ["16:9", "4:5", "1:1"], "첨부 인물이 사무실 책상 위에 거인처럼 앉아 있고 노트북, 머그, 키보드가 미니어처처럼 보이는 유쾌한 원근 착시 사진. 인물의 얼굴과 신체 비율은 자연스럽게 유지하고 사물과의 접촉, 그림자, 카메라 원근을 사실적으로 맞춘다.", "A playful forced-perspective photo where the recognizable subject sits like a giant on an office desk and the laptop, mug, and keyboard appear miniature. Keep face and body proportions natural and match object contact, shadows, and camera perspective realistically."],
    ["tiny-planet-selfie", "초소형 행성 셀카", "meme", "작은 행성을 한 바퀴 감싸는 360도 여행 셀카", ["타이니 플래닛", "셀카", "360도"], "TINY WORLD", "ROUND / TRIP", ["play", "social", "gift"], ["single", "pair", "smallGroup"], ["1:1", "4:5", "9:16"], "인물이 작은 구형 행성의 가장자리에 서서 셀카를 찍는 360도 타이니 플래닛 사진. 주변 도시와 자연 풍경이 원형으로 이어지고 하늘이 바깥을 감싸며, 얼굴과 손, 셀카봉의 원근은 자연스럽게 유지한다. 글자와 지명 표시는 만들지 않는다.", "A 360-degree tiny-planet selfie with the recognizable subject standing on the edge of a small spherical world, city and nature wrapping around the circle and sky surrounding it. Keep face, hands, and selfie-stick perspective natural; generate no text or place labels."],
    ["dramatic-reaction-grid", "과몰입 리액션 4컷", "meme", "사소한 사건을 대서사처럼 표현하는 표정 중심 4분할", ["리액션", "4컷", "과몰입"], "REACTION", "SMALL / EPIC", ["play", "social", "sticker"], ["single", "pair"], ["1:1", "4:5", "3:4"], "같은 인물이 평온, 의심, 충격, 결연함으로 급격히 변하는 표정을 2×2 네 컷에 배치한다. 영화 예고편처럼 과장된 조명과 카메라 크롭을 사용하되 모든 컷의 얼굴, 헤어, 의상은 동일하게 유지하고 자막이나 말풍선은 넣지 않는다.", "Arrange the same subject in a 2x2 four-panel reaction grid escalating from calm to suspicious, shocked, and determined. Use exaggerated movie-trailer lighting and crops while keeping face, hair, and wardrobe identical in every panel, with no captions or speech bubbles."],
    ["boss-battle-screen", "최종 보스 등장", "meme", "일상 속 인물을 게임의 압도적인 최종 보스처럼 연출", ["게임", "보스", "등장"], "FINAL BOSS", "POWER / POSE", ["play", "avatar", "content"], ["single", "pair", "smallGroup"], ["16:9", "4:5", "1:1"], "첨부 인물을 일상 소품을 능력으로 사용하는 독창적인 게임 최종 보스처럼 연출한다. 낮은 카메라, 극적인 등장 포즈, 빛나는 효과, 대칭적인 경기장 배경과 게임 화면 같은 구도를 사용하되 실제 UI 글자, 체력바, 숫자, 기존 게임 캐릭터는 만들지 않는다.", "Present the recognizable subject as an original final boss whose powers are based on everyday objects, using a low camera, dramatic entrance pose, luminous effects, a symmetrical arena, and game-screen composition. Include no UI text, health bars, numbers, or existing game characters."]
  ];

  const funCategoryLabels = { fantasy: "판타지 세계관", timewarp: "시대여행", toy: "토이·오브젝트", meme: "밈·유머" };
  funPresetData.forEach(([id, title, category, description, tags, trend, caption, purposes, peopleFit, ratios, ko, en]) => {
    presets.push({ id, title, category, categoryLabel: funCategoryLabels[category], description, tags, trend, caption, palette: categoryPalettes[category], overlay: category === "toy" ? "frame" : category === "meme" ? "grid" : "noise", purposes, peopleFit, ratios, previewVersion: GPT_IMAGE_PREVIEW_VERSION, ko, en });
  });

  const socialTrendPresetData = [
    {
      id: "social-brand-daylight", title: "SNS 퍼스널 브랜딩", category: "profile", description: "일하는 사람의 개성과 친근함을 자연광 한 컷에 담는 4:5 프로필", tags: ["인스타그램", "퍼스널 브랜딩", "자연광"], trend: "SOCIAL PRO", caption: "WORK / HUMAN",
      purposes: ["social", "career", "content"], peopleFit: ["single"], ratios: ["4:5", "1:1", "3:4"],
      ko: "밝은 스튜디오 겸 작업 공간에서 새로 촬영한 듯한 퍼스널 브랜딩 포트레이트. 몸은 카메라에서 30도 돌리고 고개만 렌즈 쪽으로 자연스럽게 향하며, 편안한 자신감이 느껴지는 작은 미소와 한 손의 가벼운 작업 제스처를 만든다. 헤어는 원본을 복사하지 말고 단정한 결, 자연스러운 볼륨과 움직임으로 다시 연출하고, 세련된 비즈니스 캐주얼 의상, 큰 창의 부드러운 측면광, 실제 피부 질감, 4:5 세로 구도를 적용한다.",
      en: "Restage the subject as a personal-brand portrait in a bright studio-workspace. Turn the torso about 30 degrees away and bring the face naturally back toward the lens, with a small confident smile and one relaxed work-related hand gesture. Do not copy the source hair arrangement; refine it with clean texture, natural volume, and movement. Add elevated business-casual wardrobe, soft side light from a large window, authentic skin texture, and vertical 4:5 framing."
    },
    {
      id: "beauty-creator-glow", title: "뷰티 크리에이터 글로우", category: "profile", description: "링라이트와 파스텔 컬러로 완성하는 또렷하고 생기 있는 뷰티 프로필", tags: ["뷰티", "링라이트", "릴스"], trend: "BEAUTY REELS", caption: "GLOW / CLOSE",
      purposes: ["social", "avatar", "content"], peopleFit: ["single"], ratios: ["1:1", "4:5", "9:16"],
      ko: "뷰티 크리에이터의 릴스 커버 같은 생기 있는 클로즈업. 카메라는 눈높이보다 약간 위에서 3/4 각도로 두고, 눈썹을 살짝 올린 밝고 장난스러운 표정과 얼굴 가까이의 우아한 손 제스처를 연출한다. 헤어는 한쪽을 귀 뒤로 넘기고 반대쪽에 부드러운 볼륨과 윤기를 더한다. 깨끗한 글로우 메이크업, 라일락과 피치 배경, 큰 링라이트 캐치라이트와 부드러운 컬러 에지 라이트를 사용하되 피부를 플라스틱처럼 만들지 않는다.",
      en: "Create a lively close-up like a beauty creator's Reels cover. Place the camera slightly above eye level at a three-quarter angle, direct a bright playful expression with subtly raised brows, and add an elegant hand gesture near the face. Restyle the hair with one side tucked behind the ear and soft glossy volume on the other. Use clean glow makeup, a lilac-and-peach backdrop, large ring-light catchlights, and soft colored edge light without plastic skin."
    },
    {
      id: "soft-power-leader", title: "소프트 파워 리더", category: "profile", description: "권위적인 정면 사진 대신 편안한 리더십을 보여주는 현대적 프로필", tags: ["리더십", "커리어", "인터뷰"], trend: "NEW LEADER", caption: "CALM / OPEN",
      purposes: ["career", "social", "content"], peopleFit: ["single"], ratios: ["4:5", "3:4", "16:9"],
      ko: "딱딱한 증명사진이 아닌 현대적 리더십 에디토리얼. 낮은 스툴에 살짝 기대어 앉고 어깨는 비대칭으로 편안하게 열며, 카메라 옆의 인터뷰어를 바라보는 사려 깊은 표정을 만든다. 헤어는 직업에 맞게 정돈하되 원본보다 선명한 실루엣과 자연스러운 결을 만들고, 구조적인 재킷과 톤온톤 이너, 회갈색 배경, 한 방향의 넓은 소프트박스와 약한 그림자 반사광을 사용한다.",
      en: "Create a modern leadership editorial rather than a rigid ID-style portrait. Seat the subject leaning lightly on a low stool with relaxed asymmetric shoulders and a thoughtful gaze just beside the camera as if listening to an interviewer. Restyle the hair into a profession-appropriate but more defined silhouette with natural texture. Use a structured jacket, tonal inner layer, warm gray backdrop, one broad directional softbox, and restrained shadow fill."
    },
    {
      id: "reel-cover-creator", title: "릴스 커버 크리에이터", category: "content", description: "작업 행동과 큰 여백을 함께 담아 세로 숏폼 표지로 쓰는 크리에이터 컷", tags: ["릴스", "틱톡", "숏폼"], trend: "VERTICAL", caption: "HOOK / SPACE",
      purposes: ["content", "social"], peopleFit: ["single"], ratios: ["9:16", "4:5"],
      ko: "세로형 숏폼 영상의 첫 화면처럼 즉시 시선을 끄는 크리에이터 포트레이트. 인물은 화면 아래쪽 삼분할 지점에서 작업 도구를 들거나 설명하는 역동적인 반신 포즈를 취하고, 놀라움과 자신감이 섞인 또렷한 표정을 짓는다. 헤어와 의상은 움직임이 느껴지는 선명한 실루엣으로 새로 연출하고, 청록과 주황의 에지 라이트, 깊이 있는 작업실 배경, 후편집 제목을 위한 위쪽의 깨끗한 여백을 만든다. 실제 글자나 플랫폼 로고는 생성하지 않는다.",
      en: "Stage a creator portrait that grabs attention like the opening frame of a vertical short-form video. Place the subject near the lower third in a dynamic half-body pose holding or explaining a work tool, with a clear expression mixing surprise and confidence. Restyle hair and wardrobe into a crisp silhouette with visible movement. Add teal-and-orange edge lighting, a layered studio background, and clean upper negative space for later titling. Generate no text or platform logos."
    },
    {
      id: "paparazzi-street-flash", title: "파파라치 스트리트 플래시", category: "editorial", description: "걷는 순간을 강한 플래시와 기울어진 앵글로 포착한 패션 스냅", tags: ["스트리트", "플래시", "패션"], trend: "STREET VIRAL", caption: "WALK / FLASH",
      purposes: ["social", "content"], peopleFit: ["single", "pair"], ratios: ["4:5", "3:4", "9:16"],
      ko: "밤거리에서 우연히 포착한 듯한 파파라치 패션 스냅. 인물은 카메라를 지나쳐 걷다가 어깨 너머로 돌아보며 살짝 놀란 표정을 짓고, 옷자락과 헤어 끝에는 실제 보행 움직임이 남는다. 카메라는 허리 높이의 약간 기울어진 로우 앵글, 짧고 강한 직접광 플래시, 빠르게 어두워지는 도시 배경과 젖은 노면 반사를 사용한다. 의상은 원본과 다른 대담한 레이어드 스트리트 룩으로 바꾸고 읽을 수 있는 간판은 만들지 않는다.",
      en: "Capture a paparazzi-style fashion snapshot on a night street. Direct the subject to walk past the camera, glance back over one shoulder with a slightly surprised expression, and retain real motion in garment edges and hair tips. Use a mildly tilted waist-height low angle, short hard direct flash, fast falloff into the urban background, and wet pavement reflections. Replace the source wardrobe with a bold layered street look and generate no legible signs."
    },
    {
      id: "cafe-mirror-selfie", title: "카페 미러 셀피", category: "film", description: "거울 반사와 자연스러운 휴대폰 포즈를 살린 감성 일상 셀카", tags: ["거울셀카", "카페", "데일리"], trend: "MIRROR", caption: "REFLECT / DAILY",
      purposes: ["social", "gift"], peopleFit: ["single", "pair"], ratios: ["4:5", "9:16", "1:1"],
      ko: "작은 카페의 오래된 전신 거울 앞에서 촬영한 감성 셀피. 인물은 한쪽 다리에 무게를 싣고 몸을 비스듬히 돌리며, 브랜드 표시가 없는 휴대폰은 얼굴을 가리지 않는 가슴 높이에 둔다. 카메라가 아닌 거울 속 자신의 눈을 보는 편안한 반미소, 자연스럽게 풀리거나 가볍게 묶은 헤어, 질감 있는 캐주얼 의상으로 바꾼다. 오후 창빛, 따뜻한 나무 반사, 약간의 렌즈 왜곡과 필름 입자를 사용한다.",
      en: "Create an atmospheric selfie in front of an aged full-length cafe mirror. Shift weight to one leg, turn the body diagonally, and hold an unbranded phone at chest height without covering the face. Direct a relaxed half-smile looking into the reflected eyes rather than the camera. Restyle the hair into a naturally loose or lightly tied finish and use tactile casual wardrobe. Add afternoon window light, warm wood reflections, mild lens distortion, and film grain."
    },
    {
      id: "fisheye-room-selfie", title: "피시아이 룸 셀피", category: "meme", description: "넓게 휘어진 방과 과감한 원근으로 만드는 장난스러운 초광각 셀카", tags: ["피시아이", "셀카", "Y2K"], trend: "WIDE SELFIE", caption: "BEND / PLAY",
      purposes: ["play", "social", "content"], peopleFit: ["single", "pair", "smallGroup"], ratios: ["1:1", "4:5", "9:16"],
      ko: "작은 방 안을 둥글게 휘어 보이게 하는 피시아이 렌즈 셀카. 카메라는 머리 위 가까운 위치에서 아래를 향하고, 인물은 렌즈를 올려다보며 크게 웃거나 장난스러운 입모양을 짓고 손을 렌즈 가까이 내민다. 헤어는 볼륨과 잔머리가 살아 있는 Y2K식 연출, 의상은 강한 색의 캐주얼 레이어로 바꾸며, 방의 모서리와 가구는 과장된 곡선 원근을 따르되 얼굴과 손의 해부학은 자연스럽게 유지한다.",
      en: "Create a fisheye-lens selfie that bends a small room into a playful curved space. Place the camera close above the head looking down; direct the subject to look up with a broad laugh or playful mouth shape and reach one hand toward the lens. Restyle the hair with lively volume and flyaways in a Y2K-inspired finish, and switch to boldly colored casual layers. Let room corners and furniture follow exaggerated curved perspective while keeping face and hands anatomically natural."
    },
    {
      id: "instant-film-candid", title: "즉석필름 캔디드", category: "film", description: "살짝 빗나간 초점과 어두운 방 플래시로 만드는 친밀한 즉석사진", tags: ["폴라로이드 감성", "캔디드", "레트로"], trend: "VIRAL FILM", caption: "FLASH / MEMORY",
      purposes: ["social", "gift", "family"], peopleFit: ["single", "pair", "smallGroup"], ratios: ["3:4", "4:5", "1:1"],
      ko: "친구가 어두운 방에서 갑자기 찍어 준 듯한 한 장의 즉석필름 사진. 인물은 정돈된 포즈 대신 몸을 서로 기울이거나 웃음이 터지는 중간 순간을 보이며, 머리카락과 의상에는 실제 움직임과 약간의 흐트러짐이 있다. 정면 플래시 한 개, 살짝 빗나간 초점, 약한 흔들림, 과노출된 피부 하이라이트, 눌린 배경색과 불규칙한 필름 입자, 넓은 흰색 즉석사진 테두리를 사용한다. 날짜나 손글씨는 넣지 않는다.",
      en: "Create one instant-film photograph that feels unexpectedly captured by a friend in a dark room. Replace formal posing with bodies leaning together or a mid-laughter moment, and let hair and wardrobe show believable motion and slight disarray. Use one frontal flash, slightly missed focus, mild camera shake, gently overexposed skin highlights, compressed background color, irregular film grain, and a wide white instant-photo border. Add no date or handwriting."
    },
    {
      id: "disposable-night-out", title: "일회용 카메라 나이트아웃", category: "film", description: "완벽하지 않은 구도와 빛샘으로 남기는 생생한 밤 외출 기록", tags: ["일회용카메라", "나이트아웃", "필름"], trend: "MESSY FILM", caption: "NIGHT / REAL",
      purposes: ["social", "gift"], peopleFit: ["single", "pair", "smallGroup"], ratios: ["4:5", "3:4", "1:1"],
      ko: "1990년대 후반 일회용 카메라로 남긴 듯한 밤 외출 사진. 인물은 카메라 옆 친구에게 웃으며 반응하거나 춤추다 멈춘 순간의 비대칭 포즈를 취한다. 헤어는 움직임에 흐트러지고 의상은 반짝이는 포인트가 있는 편안한 파티 룩으로 바뀐다. 불균일한 직접광 플래시, 한쪽 모서리의 주황빛 빛샘, 먼지와 작은 스크래치, 들뜬 검정, 약한 모션 블러를 사용해 지나치게 매끈한 AI 느낌을 없앤다.",
      en: "Make a night-out photograph that feels shot on a late-1990s disposable camera. Direct the subject to react laughing toward a friend beside the camera or freeze mid-dance in an asymmetric pose. Let the hair become movement-tousled and change the wardrobe to a relaxed party look with one reflective accent. Use uneven direct flash, an orange light leak from one corner, dust, tiny scratches, lifted blacks, and slight motion blur to avoid a polished AI look."
    },
    {
      id: "rainy-cinema-duo", title: "레인 시네마 듀오", category: "relationship", description: "비와 역광 속 두 사람의 시선과 동선을 연결하는 로맨틱 영화 스틸", tags: ["커플", "비", "시네마틱"], trend: "RAIN SCENE", caption: "RAIN / GAZE",
      purposes: ["social", "gift", "content"], peopleFit: ["pair"], ratios: ["4:5", "16:9", "3:4"],
      ko: "비가 내리는 저녁 골목의 로맨틱 영화 스틸. 두 인물은 정면 기념사진 포즈를 버리고 한 사람은 반걸음 앞에서 뒤돌아보며 미소 짓고 다른 사람은 우산을 기울여 시선을 맞춘다. 각자의 얼굴 정체성은 분리해 유지하되 젖은 헤어 결, 계절에 맞는 코트 레이어, 자연스러운 손과 거리감을 새로 연출한다. 따뜻한 가로등 역광, 빗방울 가장자리 빛, 젖은 바닥 반사와 차가운 주변광을 조화시킨다.",
      en: "Create a romantic film still in a rainy evening alley. Abandon the front-facing commemorative pose: direct one person half a step ahead turning back with a smile while the other tilts an umbrella and meets their gaze. Preserve both identities separately, while restyling damp hair texture, seasonally layered coats, believable hands, and natural personal space. Balance warm streetlamp backlight, rim-lit raindrops, wet-ground reflections, and cool ambient fill."
    },
    {
      id: "idol-comeback-teaser", title: "아이돌 컴백 티저", category: "editorial", description: "강한 컬러와 새로운 헤어·포즈로 재해석하는 독창적 콘셉트 티저", tags: ["아이돌", "컴백", "티저"], trend: "COMEBACK", caption: "COLOR / ATTITUDE",
      purposes: ["social", "content", "avatar"], peopleFit: ["single", "pair", "smallGroup"], ratios: ["4:5", "1:1", "9:16"],
      ko: "특정 가수나 그룹을 모방하지 않는 독창적인 팝 아이돌 콘셉트 티저. 카메라는 가슴 높이의 미세한 로우 앵글, 인물은 턱을 살짝 들고 렌즈를 강하게 바라보며 한 손으로 의상 실루엣을 강조하는 자신감 있는 포즈를 취한다. 헤어는 원본과 다른 날카로운 가르마, 젖은 질감 또는 조형적인 볼륨 중 인물에 어울리는 하나로 과감히 바꾸고, 미래적 테일러링 의상, 코발트와 마젠타 컬러 젤, 금속 반사 배경과 정교한 에지 라이트를 사용한다. 글자와 로고는 만들지 않는다.",
      en: "Create an original pop-idol concept teaser that imitates no real singer or group. Use a subtle chest-height low angle; direct the subject to lift the chin slightly, hold intense eye contact, and use one hand to emphasize the wardrobe silhouette. Boldly replace the source hair arrangement with one fitting option: a sharp new part, wet texture, or sculptural volume. Add futuristic tailoring, cobalt and magenta gel light, a metallic reflective background, and precise edge lighting. Generate no text or logos."
    },
    {
      id: "pastel-cloud-dream", title: "파스텔 클라우드 드림", category: "art", description: "솜구름·비눗방울·부드러운 색으로 만드는 몽글몽글한 판타지 프로필", tags: ["파스텔", "구름", "몽환"], trend: "DREAMY", caption: "CLOUD / SOFT",
      purposes: ["social", "avatar", "gift"], peopleFit: ["single", "pair"], ratios: ["1:1", "4:5", "3:4"],
      ko: "솜처럼 부드러운 파스텔 구름 사이에 떠 있는 사랑스러운 드림 포트레이트. 인물은 위쪽을 바라보며 조용히 감탄하는 표정, 가슴 앞에 모은 편안한 손, 살짝 떠오르는 듯한 자세를 취한다. 헤어는 공기 중에서 가볍게 부풀고 흩날리는 실루엣으로 바꾸며, 크림색과 라벤더의 부드러운 의상, 진주빛 비눗방울, 피치·민트·라일락의 확산광을 사용한다. 얼굴은 현실적이고 또렷하게 남기고 과도하게 유아화하지 않는다.",
      en: "Create a lovely dream portrait floating among cotton-soft pastel clouds. Direct the subject to look upward with quiet wonder, keep relaxed hands near the chest, and suggest a gently lifted posture. Restyle the hair into an airy floating silhouette, and use soft cream-and-lavender wardrobe, pearlescent bubbles, and diffuse peach, mint, and lilac light. Keep the face realistic and clear without making the subject excessively childlike."
    },
    {
      id: "desk-figurine-workflow", title: "데스크 피규어 제작실", category: "toy", description: "책상 위 완성 피규어와 3D 제작 화면을 함께 보여주는 바이럴 미니미", tags: ["피규어", "미니미", "3D 모델링"], trend: "VIRAL FIGURE", caption: "MODEL / DESK",
      purposes: ["play", "social", "gift", "avatar"], peopleFit: ["single", "pair", "smallGroup"], ratios: ["4:5", "1:1", "16:9"],
      ko: "첨부 인물을 1:7 비율의 정교한 수집용 피규어로 변환해 실제 작업 책상 위 투명 원형 아크릴 받침에 세운다. 원본 포즈를 복사하지 말고 피규어에 어울리는 당당한 전신 포즈, 알아보기 쉬운 새 표정, 조형적으로 정리된 헤어와 의상 주름을 설계한다. 뒤쪽 모니터에는 같은 피규어의 일반적인 3D 와이어프레임 제작 화면을 글자 없이 보여주고, 옆에는 원본 그림과 브랜드명이 없는 무지 패키지 목업을 둔다. 플라스틱과 천 재질, 접지 그림자, 책상 스케일과 제품 조명을 사실적으로 맞춘다.",
      en: "Transform the subject into a detailed 1:7 collectible figurine standing on a clear circular acrylic base on a real work desk. Do not copy the source pose: design a confident full-body figure pose, a clearly readable new expression, sculpted hair, and deliberate garment folds. On a monitor behind it, show a generic text-free 3D wireframe workflow for the same figure, with a blank unbranded package mockup beside it. Match plastic and fabric materials, contact shadows, desk scale, and product lighting realistically."
    },
    {
      id: "blister-mini-me", title: "블리스터팩 미니미", category: "toy", description: "직업과 취향 소품을 담은 투명 패키지형 액션 피규어", tags: ["액션피규어", "패키지", "미니미"], trend: "ACTION BOX", caption: "PACK / SELF",
      purposes: ["play", "social", "gift"], peopleFit: ["single"], ratios: ["3:4", "4:5", "1:1"],
      ko: "인물을 독창적인 미니 액션 피규어로 재해석한 프리미엄 블리스터팩 제품 사진. 피규어는 한쪽 무릎을 살짝 굽힌 활기찬 영웅 포즈와 장난스러운 자신감의 표정을 갖고, 헤어는 작은 피규어에서도 읽히는 선명한 덩어리와 조각 질감으로 새로 설계한다. 옆 칸에는 인물의 직업이나 취미를 암시하는 일반 소품 세 개를 각각 배치한다. 투명 플라스틱 반사와 종이 받침은 사실적으로 표현하되 이름, 글자, 로고, 실제 브랜드 패키지는 만들지 않는다.",
      en: "Reimagine the subject as an original mini action figure in premium blister-pack product photography. Give the figure an energetic hero pose with one knee slightly bent and a playfully confident expression; redesign the hair into clear sculpted masses legible at miniature scale. Arrange three generic accessories suggesting the subject's work or interests in separate side compartments. Render transparent plastic reflections and the paper backing realistically, with no name, text, logo, or real brand packaging."
    },
    {
      id: "shoulder-mini-me", title: "어깨 위 미니미", category: "character", description: "본체와 작은 치비 분신이 상호작용하는 귀여운 투샷", tags: ["미니미", "치비", "분신"], trend: "MINI COMPANION", caption: "ME / MINI ME",
      purposes: ["play", "social", "avatar"], peopleFit: ["single"], ratios: ["1:1", "4:5", "9:16"],
      ko: "실제 인물의 어깨 위에 손바닥보다 작은 치비 분신이 앉아 서로 눈을 맞추는 유쾌한 포트레이트. 실제 인물은 고개를 옆으로 돌려 놀라며 웃고 한 손을 어깨 가까이 올리며, 원본과 다른 편안한 헤어 연출과 밝은 캐주얼 의상을 사용한다. 미니미는 같은 얼굴 인상과 헤어 색을 알아볼 수 있지만 큰 머리와 작은 몸, 더 과장된 환호 표정과 손짓을 갖는다. 두 캐릭터의 시선, 접촉, 그림자, 초점과 크기 차이를 정확히 맞춘다.",
      en: "Create a playful portrait where a palm-sized chibi mini-self sits on the real subject's shoulder and they make eye contact. Direct the real subject to turn sideways with a surprised laugh and raise one hand near the shoulder, using a relaxed new hair arrangement and bright casual wardrobe. Keep the mini-self recognizable through facial impression and hair color, but give it a large head, tiny body, and a more exaggerated cheering expression and gesture. Match gaze, contact, shadow, focus, and scale precisely."
    },
    {
      id: "acrylic-charm-avatar", title: "아크릴 키링 아바타", category: "toy", description: "가방에 달린 투명 아크릴 참으로 만드는 작고 반짝이는 캐릭터", tags: ["키링", "아크릴", "굿즈"], trend: "CHARM", caption: "CLEAR / CUTE",
      purposes: ["avatar", "gift", "social"], peopleFit: ["single", "pair"], ratios: ["1:1", "4:5", "3:4"],
      ko: "인물의 얼굴 인상과 대표 스타일을 단순화한 독창적인 전신 아크릴 키링 캐릭터. 한쪽 눈을 감고 작은 브이 포즈를 하는 귀여운 표정, 원본과 다른 둥근 헤어 실루엣과 컬러 포인트 의상으로 설계한다. 투명 아크릴의 절단면, 양면 인쇄층, 작은 금속 고리와 체인을 사실적으로 표현하고 실제 가방의 천 표면에 걸어 촬영한다. 캐릭터 외곽은 깨끗하고 글자, 이름, 로고는 넣지 않는다.",
      en: "Simplify the subject's facial impression and signature style into an original full-body acrylic charm character. Design a cute wink and small peace-sign pose, a rounder hair silhouette distinct from the source arrangement, and wardrobe with one color accent. Render the clear acrylic cut edge, double-sided print layer, small metal ring, and chain realistically, photographed hanging from a real fabric bag. Keep the silhouette clean and include no text, name, or logo."
    },
    {
      id: "crochet-mini-self", title: "코바늘 미니 인형", category: "toy", description: "굵은 실의 뜨개 결로 얼굴과 의상을 재현한 포근한 아미구루미", tags: ["뜨개인형", "아미구루미", "핸드메이드"], trend: "COZY CRAFT", caption: "YARN / MINI",
      purposes: ["gift", "avatar", "social", "play"], peopleFit: ["single", "pair", "smallGroup"], ratios: ["1:1", "4:5", "3:4"],
      ko: "첨부 인물을 손바닥 크기의 독창적인 코바늘 미니 인형으로 변환한다. 얼굴은 단순한 자수 눈과 작은 미소로 닮은 인상을 살리고, 헤어는 굵은 실 다발과 뜨개 고리로 원본과 다른 귀여운 볼륨을 만든다. 큰 머리와 짧은 팔다리, 포근한 니트 의상, 보이는 코바늘 스티치와 작은 실밥, 나무 테이블 위의 부드러운 아침 제품 조명을 사용한다. 실제 캐릭터나 완구 브랜드를 모방하지 않는다.",
      en: "Transform the subject into an original palm-sized crochet mini doll. Preserve a recognizable impression through simple embroidered eyes and a tiny smile, while rebuilding the hair with thick yarn bundles and loops into a cute volume distinct from the source arrangement. Use a large head, short limbs, cozy knitted wardrobe, visible crochet stitches, a few tiny yarn ends, and soft morning product light on a wooden table. Imitate no existing character or toy brand."
    },
    {
      id: "marshmallow-mascot", title: "말랑 마시멜로 마스코트", category: "character", description: "폭신한 몸과 작은 팔다리로 재해석한 몽글몽글 개인 마스코트", tags: ["마시멜로", "마스코트", "말랑이"], trend: "PUFFY", caption: "SOFT / SQUISH",
      purposes: ["avatar", "social", "play", "gift"], peopleFit: ["single", "pair"], ratios: ["1:1", "4:5"],
      ko: "인물의 핵심 얼굴 인상과 헤어 색을 폭신한 마시멜로형 개인 마스코트로 재해석한다. 둥근 몸통, 아주 짧은 팔다리, 양 볼이 올라간 환한 미소, 두 손을 흔드는 포즈를 사용한다. 헤어는 원본을 그대로 복제하지 않고 부드러운 크림 덩어리 같은 단순한 실루엣으로 바꾸며, 파우더 파스텔 의상 포인트, 벨벳과 무광 고무 사이의 말랑한 표면, 약한 눌림과 복원 자국, 밝은 확산광을 표현한다.",
      en: "Reimagine the subject's core facial impression and hair color as a puffy marshmallow-like personal mascot. Use a rounded body, very short limbs, a bright cheek-lifting smile, and a two-handed waving pose. Do not copy the source hair; reduce it to a soft cream-like silhouette. Add powder-pastel wardrobe accents, a squishy surface between velvet and matte rubber, subtle compression and rebound marks, and bright diffuse light."
    },
    {
      id: "dollhouse-room-mini", title: "미니미 돌하우스 룸", category: "toy", description: "좋아하는 일상 공간을 작은 방 한 칸에 압축한 입체 미니어처", tags: ["돌하우스", "미니어처", "일상"], trend: "TINY ROOM", caption: "ROOM / STORY",
      purposes: ["play", "gift", "social"], peopleFit: ["single", "pair", "smallGroup"], ratios: ["1:1", "4:5", "16:9"],
      ko: "인물의 일상과 취향을 한눈에 보여 주는 오픈형 돌하우스 방 미니어처. 인물은 책상, 주방, 작업대 중 사진 맥락에 맞는 공간에서 몸을 앞으로 기울여 무언가에 집중하는 작은 전신 피규어로 바뀐다. 얼굴은 알아볼 수 있는 새 집중 표정, 헤어는 축척에 맞춘 단순하고 둥근 조형, 의상은 공간 역할에 맞는 편안한 스타일로 재설계한다. 벽이 열린 한 칸 방, 정확한 축척의 소품, 따뜻한 천장등과 창빛, 손으로 만든 재료감을 사용한다.",
      en: "Build an open-front dollhouse room miniature that reveals the subject's daily life and interests at a glance. Turn the subject into a small full-body figure leaning forward in concentration at a context-appropriate desk, kitchen, or workbench. Use a recognizable new focused expression, hair simplified into rounded scale-appropriate forms, and comfortable role-based wardrobe. Include one wall-open room, consistently scaled props, warm ceiling light plus window light, and tactile handmade materials."
    },
    {
      id: "bento-character-box", title: "캐릭터 도시락 미니미", category: "toy", description: "밥·김·채소의 색과 질감으로 표현하는 앙증맞은 도시락 캐릭터", tags: ["도시락", "푸드아트", "미니미"], trend: "BENTO CUTE", caption: "TASTE / TINY",
      purposes: ["play", "social", "gift"], peopleFit: ["single", "pair"], ratios: ["1:1", "4:5"],
      ko: "인물의 얼굴과 대표 스타일을 작은 캐릭터 도시락으로 재해석한다. 밥으로 만든 둥근 얼굴, 김과 깨로 표현한 눈과 헤어, 채소와 달걀로 만든 의상 색, 두 팔을 벌린 환영 포즈를 사용한다. 원본 표정을 복사하지 않고 작은 음식 캐릭터에 어울리는 기쁜 미소로 바꾸며, 실제 먹을 수 있는 재료 질감과 정돈된 칸막이, 부드러운 탑뷰 자연광을 표현한다. 글자, 상표, 비식용 플라스틱 얼굴은 넣지 않는다.",
      en: "Reimagine the subject's face and signature style as a tiny character bento. Build a rounded rice face, eyes and hair from seaweed and sesame, wardrobe colors from vegetables and egg, and a welcoming arms-open pose. Replace the source expression with a joyful smile suited to a small food character. Render believable edible textures, tidy compartments, and soft natural top light. Include no text, brands, or non-edible plastic face."
    },
    {
      id: "claw-machine-plush", title: "인형뽑기 속 플러시", category: "toy", description: "투명 인형뽑기 안에서 손을 흔드는 포근한 나만의 봉제 캐릭터", tags: ["인형뽑기", "플러시", "아케이드"], trend: "CLAW CUTE", caption: "PLUSH / PICK",
      purposes: ["play", "avatar", "social", "gift"], peopleFit: ["single", "pair", "smallGroup"], ratios: ["4:5", "1:1", "9:16"],
      ko: "첨부 인물을 알아볼 수 있는 포근한 플러시 캐릭터로 바꿔 투명 인형뽑기 기계 안에 배치한다. 캐릭터는 큰 자수 눈, 활짝 웃는 표정, 한 손을 유리 쪽으로 흔드는 포즈, 원본보다 둥글게 단순화한 헤어와 의상을 갖는다. 주변에는 같은 색 체계의 일반 동물 인형 몇 개만 배치하고, 유리 반사, 금속 집게, 짧은 털 방향, 눌린 솜과 네온 아케이드 조명을 사실적으로 표현한다. 기계의 글자와 브랜드는 만들지 않는다.",
      en: "Turn the recognizable subject into a cozy plush character inside a clear claw machine. Give it large embroidered eyes, a broad smile, one hand waving toward the glass, and hair and wardrobe simplified into rounder forms than the source. Add only a few generic animal plush toys in the same color system. Render glass reflections, the metal claw, short-fur direction, compressed stuffing, and neon arcade lighting realistically. Generate no machine text or branding."
    },
    {
      id: "scribble-caricature", title: "낙서 캐리커처 프로필", category: "art", description: "직업 소품과 과장된 표정을 거친 손그림 선으로 풀어낸 유쾌한 프로필", tags: ["캐리커처", "낙서", "직업"], trend: "SCRIBBLE", caption: "LINE / PERSONA",
      purposes: ["social", "avatar", "gift", "content"], peopleFit: ["single", "pair"], ratios: ["1:1", "4:5", "3:4"],
      ko: "인물의 식별 가능한 얼굴 특징을 살짝 과장한 독창적인 손그림 캐리커처. 머리는 약간 크게, 표정은 원본보다 더 환하고 익살스럽게, 몸은 역동적인 3/4 포즈로 바꾸며 헤어 실루엣과 직업 또는 취미 소품 한두 개를 굵기 변화가 큰 낙서 선으로 표현한다. 미색 종이, 검정 잉크, 한 가지 강한 포인트 색, 작은 화살표와 동작선을 사용하되 실제 글자, 특정 작가의 화풍, 모욕적인 신체 과장은 피한다.",
      en: "Create an original hand-drawn caricature that gently exaggerates recognizable facial features. Make the head slightly larger, the expression brighter and more mischievous than the source, and the body a dynamic three-quarter pose. Draw the hair silhouette and one or two work-or-hobby props with loose varied-weight scribble lines. Use warm paper, black ink, one strong accent color, small arrows, and motion marks, but no legible text, imitation of a specific artist, or insulting body exaggeration."
    },
    {
      id: "childhood-self-reunion", title: "어린 나와 다시 만나기", category: "relationship", description: "현재의 나와 어린 시절의 나를 한 장면에서 따뜻하게 연결하는 감성 합성", tags: ["어린시절", "추억", "두시점"], trend: "THEN / NOW", caption: "PAST / PRESENT",
      purposes: ["gift", "social", "family"], peopleFit: ["pair"], ratios: ["4:5", "3:4", "1:1"],
      ko: "현재 사진과 어린 시절 사진을 각각 별도의 정체성으로 분석해 같은 사람이 서로 마주 앉아 작은 티타임을 갖는 따뜻한 장면으로 구성한다. 현재의 인물은 몸을 낮춰 다정하게 웃으며 아이의 이야기를 듣고, 어린 인물은 눈을 반짝이며 손으로 설명한다. 두 시기의 얼굴과 나이 차이는 정확히 유지하되 표정, 시선, 포즈, 헤어 정돈, 시대에 맞는 의상과 공통 창빛을 새로 맞춘다. 얼굴을 평균화하거나 한 인물을 두 번 복제한 듯 만들지 않는다.",
      en: "Analyze a current photo and a childhood photo as two age-specific identities of the same person, then place them in one warm scene sharing a small tea party. Direct the present-day subject to lower their posture, smile gently, and listen, while the child speaks with bright eyes and expressive hands. Preserve both faces and the age difference accurately, while newly harmonizing expression, gaze, pose, age-appropriate hair grooming, period-appropriate wardrobe, and shared window light. Do not average the faces or make them look like a duplicated adult."
    },
    {
      id: "pet-career-character", title: "반려동물 직업 체험", category: "character", description: "반려동물의 무늬와 체형을 살려 귀여운 직업 캐릭터로 변환", tags: ["반려동물", "직업", "캐릭터"], trend: "PET ROLE", caption: "PET / JOB",
      purposes: ["play", "social", "gift", "avatar"], peopleFit: ["single", "pair"], ratios: ["1:1", "4:5", "3:4"], subjectType: "pet",
      ko: "첨부 반려동물의 품종, 얼굴 무늬, 귀 모양, 눈 색과 체형을 알아볼 수 있게 유지하면서 사진 맥락에 어울리는 바리스타, 정원사, 우체부 중 하나의 독창적인 직업 캐릭터로 재해석한다. 원본 자세를 복사하지 않고 두 발 또는 네 발에 자연스러운 새 작업 포즈와 호기심 많은 표정을 만들며, 털은 깨끗하고 폭신한 그루밍으로 연출한다. 작은 직업 앞치마와 일반 소품, 따뜻한 미니 작업 공간을 사용하되 동물에게 불편한 장비, 글자와 브랜드는 넣지 않는다.",
      en: "Preserve the pet's breed, facial markings, ear shape, eye color, and build while reimagining it as one original profession character suited to the photo context: barista, gardener, or mail carrier. Do not copy the source posture; create a new anatomically natural working pose on two or four legs with a curious expression and clean fluffy grooming. Add a small comfortable work apron, generic props, and a warm miniature workspace, with no restrictive equipment, text, or brands."
    }
  ];

  const socialTrendCategoryLabels = {
    profile: "프로필", editorial: "에디토리얼", relationship: "관계·그룹", content: "콘텐츠", film: "필름",
    art: "아트", character: "캐릭터", toy: "토이·오브젝트", meme: "밈·유머"
  };
  socialTrendPresetData.forEach((data) => {
    presets.push({
      categoryLabel: socialTrendCategoryLabels[data.category],
      palette: categoryPalettes[data.category],
      overlay: data.category === "film" || data.category === "art" ? "noise" : data.category === "meme" ? "grid" : "frame",
      previewVersion: GPT_IMAGE_PREVIEW_VERSION,
      ...data
    });
  });

  const expansionDirections = [
    { id: "soft-window", ko: "소프트 윈도", en: "Soft Window", descriptionKo: "부드러운 창빛과 차분한 그림자", cueKo: "큰 창에서 들어오는 부드러운 측면광, 자연스러운 명암 전환, 맑은 중간톤을 사용한다", cueEn: "Use soft side light from a large window, gentle tonal transitions, and clear midtones", tags: ["창빛", "소프트"], caption: "WINDOW / SOFT", overlay: "frame" },
    { id: "airy-high-key", ko: "에어리 하이키", en: "Airy High Key", descriptionKo: "밝은 노출과 가벼운 공기감", cueKo: "밝지만 하이라이트가 날아가지 않는 하이키 조명, 옅은 그림자, 깨끗한 밝은 배경을 사용한다", cueEn: "Use bright high-key lighting without clipped highlights, faint shadows, and a clean luminous background", tags: ["하이키", "밝은톤"], caption: "AIR / LIGHT", overlay: "frame" },
    { id: "sculpted-low-key", ko: "스컬프티드 로우키", en: "Sculpted Low Key", descriptionKo: "깊은 그림자와 입체적인 윤곽광", cueKo: "한 방향의 좁은 키라이트, 디테일이 남는 깊은 그림자, 절제된 가장자리 빛으로 형태를 조각한다", cueEn: "Sculpt the form with a narrow directional key light, deep detailed shadows, and restrained rim light", tags: ["로우키", "명암"], caption: "DARK / FORM", overlay: "noise" },
    { id: "window-shadow", ko: "윈도 섀도", en: "Window Shadow", descriptionKo: "블라인드와 창틀이 만드는 그래픽 그림자", cueKo: "블라인드나 창틀을 통과한 정교한 그림자 패턴을 배경과 의상에만 배치하고 얼굴의 핵심 특징은 선명하게 둔다", cueEn: "Place precise blind or window-frame shadows across the background and wardrobe while keeping defining facial features clear", tags: ["그림자", "그래픽"], caption: "LINE / SHADE", overlay: "grid" },
    { id: "golden-hour", ko: "골든아워", en: "Golden Hour", descriptionKo: "해 질 무렵의 따뜻한 역광과 윤곽", cueKo: "낮은 태양의 따뜻한 역광, 금빛 가장자리 빛, 자연스러운 플레어와 길어진 그림자를 절제해 사용한다", cueEn: "Use warm low-sun backlight, golden edge light, restrained natural flare, and elongated shadows", tags: ["골든아워", "역광"], caption: "GOLD / HOUR", overlay: "noise" },
    { id: "blue-hour", ko: "블루아워", en: "Blue Hour", descriptionKo: "해 진 직후의 청색 공기와 잔잔한 조명", cueKo: "해 진 직후의 깊은 청색 주변광과 따뜻한 실내 포인트광을 균형 있게 섞어 고요한 분위기를 만든다", cueEn: "Balance deep blue post-sunset ambient light with small warm practical lights for a quiet atmosphere", tags: ["블루아워", "야간"], caption: "BLUE / CALM", overlay: "noise" },
    { id: "warm-tungsten", ko: "웜 텅스텐", en: "Warm Tungsten", descriptionKo: "전구빛의 친밀한 온도와 깊이", cueKo: "따뜻한 텅스텐 실내광, 호박색 하이라이트, 중성에 가까운 피부색과 포근한 배경 흐림을 사용한다", cueEn: "Use warm tungsten practical light, amber highlights, near-neutral skin tones, and a cozy background falloff", tags: ["텅스텐", "웜톤"], caption: "AMBER / WARM", overlay: "frame" },
    { id: "direct-flash", ko: "다이렉트 플래시", en: "Direct Flash", descriptionKo: "즉흥적인 직접광과 선명한 순간", cueKo: "카메라 가까이의 직접광 플래시, 선명한 전경, 빠르게 어두워지는 배경과 의도적인 스냅 감각을 사용한다", cueEn: "Use near-camera direct flash, a crisp foreground, rapid background falloff, and an intentional candid snapshot feel", tags: ["플래시", "스냅"], caption: "FLASH / NOW", overlay: "noise" },
    { id: "neon-reflection", ko: "네온 리플렉션", en: "Neon Reflection", descriptionKo: "유리와 젖은 바닥에 번지는 컬러 반사", cueKo: "청록과 자주색을 중심으로 한 네온 반사를 유리와 젖은 표면에 제한하고 피부색은 자연스럽게 유지한다", cueEn: "Confine cyan and magenta neon reflections to glass and wet surfaces while keeping skin color natural", tags: ["네온", "반사광"], caption: "NEON / RAIN", overlay: "grid" },
    { id: "nuanced-mono", ko: "뉴앙스 모노", en: "Nuanced Monochrome", descriptionKo: "섬세한 회색조와 질감 중심 흑백", cueKo: "검정부터 밝은 회색까지 단계가 풍부한 흑백 톤, 또렷한 눈, 실제 재질이 느껴지는 미세 대비를 사용한다", cueEn: "Use a rich monochrome scale from black to pale gray, clear eyes, and fine contrast that preserves real material texture", tags: ["흑백", "모노"], caption: "MONO / TONE", overlay: "frame" },
    { id: "powder-pastel", ko: "파우더 파스텔", en: "Powder Pastel", descriptionKo: "가볍고 부드러운 파스텔 색면", cueKo: "분말처럼 부드러운 파스텔 색, 낮은 채도 대비, 매트한 표면과 편안한 확산광을 사용한다", cueEn: "Use powder-soft pastel color, low saturation contrast, matte surfaces, and comfortable diffused light", tags: ["파스텔", "매트"], caption: "PASTEL / AIR", overlay: "frame" },
    { id: "earthy-natural", ko: "어시 내추럴", en: "Earthy Natural", descriptionKo: "흙·나무·리넨의 안정적인 자연색", cueKo: "테라코타, 올리브, 샌드 컬러와 나무·리넨의 실제 질감을 조화시키고 전체 채도는 절제한다", cueEn: "Combine terracotta, olive, and sand tones with believable wood and linen textures while keeping saturation restrained", tags: ["어시톤", "자연색"], caption: "EARTH / CALM", overlay: "noise" },
    { id: "jewel-tone", ko: "주얼 톤", en: "Jewel Tone", descriptionKo: "에메랄드와 루비의 깊고 고급스러운 색", cueKo: "에메랄드, 사파이어, 루비 계열의 깊은 색을 한두 가지 포인트로 사용하고 검정과 금빛은 절제한다", cueEn: "Use deep emerald, sapphire, or ruby as one or two focused accents with restrained black and gold", tags: ["주얼톤", "딥컬러"], caption: "JEWEL / DEEP", overlay: "frame" },
    { id: "cobalt-orange", ko: "코발트 오렌지", en: "Cobalt Orange", descriptionKo: "차가운 파랑과 따뜻한 주황의 선명한 대비", cueKo: "코발트 블루와 번트 오렌지의 보색 대비를 큰 색면으로 정리하고 피부와 핵심 피사체에는 중성 톤을 남긴다", cueEn: "Organize cobalt blue and burnt orange into bold complementary fields while retaining neutral tones on skin and key subjects", tags: ["코발트", "보색"], caption: "BLUE / ORANGE", overlay: "grid" },
    { id: "white-minimal", ko: "화이트 미니멀", en: "White Minimal", descriptionKo: "흰 배경과 넓은 여백의 절제", cueKo: "깨끗한 흰색 또는 아주 옅은 회색 배경, 넓은 여백, 최소한의 소품과 정교한 그림자만 사용한다", cueEn: "Use a clean white or very pale gray background, generous negative space, minimal props, and precise soft shadows", tags: ["미니멀", "화이트"], caption: "WHITE / SPACE", overlay: "frame" },
    { id: "black-studio", ko: "블랙 스튜디오", en: "Black Studio", descriptionKo: "검은 배경 위 선명한 실루엣과 소재", cueKo: "빛을 흡수하는 검은 배경에서 피사체의 외곽과 재질만 정교하게 분리하고 불필요한 장식은 제거한다", cueEn: "Against a light-absorbing black background, separate only the silhouette and material details with precision and remove unnecessary decoration", tags: ["블랙", "스튜디오"], caption: "BLACK / EDGE", overlay: "noise" },
    { id: "architectural-lines", ko: "아키텍처 라인", en: "Architectural Lines", descriptionKo: "건축 구조와 원근선을 활용한 정돈된 구도", cueKo: "기둥, 계단, 벽면의 실제 원근선을 활용해 피사체로 시선을 유도하고 수직과 수평을 정확히 유지한다", cueEn: "Use real perspective lines from columns, stairs, and walls to lead the eye to the subject while keeping verticals and horizontals precise", tags: ["건축", "원근"], caption: "LINE / SPACE", overlay: "grid" },
    { id: "botanical-frame", ko: "보태니컬 프레임", en: "Botanical Frame", descriptionKo: "실제 식물의 잎과 그림자로 만든 자연 프레임", cueKo: "실제 식물 잎과 가는 줄기를 전경과 배경의 자연스러운 프레임으로 사용하고 얼굴이나 핵심 피사체는 가리지 않는다", cueEn: "Use believable leaves and slender stems as a natural foreground and background frame without obscuring faces or the key subject", tags: ["보태니컬", "식물"], caption: "LEAF / FRAME", overlay: "frame" },
    { id: "water-reflection", ko: "워터 리플렉션", en: "Water Reflection", descriptionKo: "잔잔한 수면 반사와 움직이는 빛", cueKo: "잔잔한 수면에서 반사된 빛의 무늬를 배경과 의상에 은은하게 투사하고 실제 물리감과 색 균형을 유지한다", cueEn: "Project subtle reflected-water light patterns onto the background and wardrobe while preserving believable physics and color balance", tags: ["물결", "반사"], caption: "WATER / LIGHT", overlay: "noise" },
    { id: "prism-light", ko: "프리즘 라이트", en: "Prism Light", descriptionKo: "작은 스펙트럼 빛과 투명한 굴절", cueKo: "유리 프리즘을 통과한 작은 스펙트럼과 투명한 굴절을 포인트로만 사용해 핵심 형태와 피부색을 보존한다", cueEn: "Use small spectral accents and transparent refraction from a glass prism while preserving core form and natural skin color", tags: ["프리즘", "스펙트럼"], caption: "PRISM / RAY", overlay: "grid" },
    { id: "glass-chrome", ko: "글라스 크롬", en: "Glass Chrome", descriptionKo: "투명 유리와 절제된 금속 반사", cueKo: "깨끗한 유리, 브러시드 메탈, 은색 가장자리 반사를 현대적으로 조합하되 과도한 미래 장식은 피한다", cueEn: "Combine clear glass, brushed metal, and silver edge reflections in a modern restrained way without excessive futuristic decoration", tags: ["유리", "크롬"], caption: "GLASS / METAL", overlay: "grid" },
    { id: "paper-tactile", ko: "페이퍼 택타일", en: "Paper Tactile", descriptionKo: "종이 결, 오려 붙인 가장자리와 손맛", cueKo: "한지와 무광 종이의 결, 정교하게 오린 가장자리, 작은 테이프 흔적을 사용하되 중요한 얼굴과 형태는 깨끗하게 남긴다", cueEn: "Use hanji and matte-paper grain, precisely cut edges, and small tape traces while keeping important faces and forms clean", tags: ["종이", "콜라주"], caption: "PAPER / TOUCH", overlay: "grid" },
    { id: "analog-grain", ko: "아날로그 그레인", en: "Analog Grain", descriptionKo: "자연스러운 필름 입자와 부드러운 색 번짐", cueKo: "실제 사진처럼 불규칙한 미세 필름 입자, 부드러운 하이라이트 번짐, 약간 눌린 검정과 자연스러운 색 편차를 사용한다", cueEn: "Use irregular fine film grain, soft highlight halation, slightly lifted blacks, and natural color variation like a real photograph", tags: ["필름입자", "아날로그"], caption: "GRAIN / FILM", overlay: "noise" },
    { id: "controlled-motion", ko: "컨트롤드 모션", en: "Controlled Motion", descriptionKo: "피사체는 선명하고 주변만 흐르는 움직임", cueKo: "눈과 얼굴 또는 핵심 오브젝트는 선명하게 고정하고 의상 끝과 배경에만 방향성 있는 움직임 흐림을 적용한다", cueEn: "Keep the eyes, face, or key object sharply anchored and apply directional motion blur only to garment edges and background", tags: ["모션", "움직임"], caption: "MOVE / HOLD", overlay: "noise" },
    { id: "intimate-closeup", ko: "인티밋 클로즈업", en: "Intimate Close-up", descriptionKo: "표정과 재질에 집중하는 가까운 프레이밍", cueKo: "눈과 표정의 미세한 변화가 보이는 가까운 프레이밍, 얕은 심도, 실제 피부와 소재 질감을 사용한다", cueEn: "Use close framing that reveals subtle changes in eyes and expression, shallow depth of field, and authentic skin and material texture", tags: ["클로즈업", "표정"], caption: "CLOSE / TRUE", overlay: "frame" },
    { id: "environmental-wide", ko: "환경 와이드", en: "Environmental Wide", descriptionKo: "장소의 맥락과 인물을 함께 담는 넓은 장면", cueKo: "인물을 알아볼 수 있는 크기로 유지하면서 실제 장소의 구조와 생활 맥락을 넓게 보여 주고 원근과 스케일을 정확히 맞춘다", cueEn: "Keep the subject recognizable while showing the structure and lived context of a real environment, with accurate perspective and scale", tags: ["와이드", "환경"], caption: "WIDE / PLACE", overlay: "grid" },
    { id: "balanced-symmetry", ko: "밸런스 시메트리", en: "Balanced Symmetry", descriptionKo: "중앙축과 반복 형태를 활용한 안정적 구성", cueKo: "정확한 중앙축과 반복되는 배경 형태를 활용하되 사람의 얼굴과 자세는 부자연스럽게 완전 대칭으로 만들지 않는다", cueEn: "Use a precise central axis and repeating background forms without forcing faces or poses into unnatural perfect symmetry", tags: ["대칭", "균형"], caption: "AXIS / BALANCE", overlay: "grid" },
    { id: "negative-space", ko: "네거티브 스페이스", en: "Negative Space", descriptionKo: "한쪽에 집중된 피사체와 넓은 빈 공간", cueKo: "피사체를 화면 한쪽 삼분할 지점에 두고 반대쪽에는 후편집에 활용할 수 있는 깨끗하고 의도적인 여백을 남긴다", cueEn: "Place the subject near a one-third point and leave clean intentional space on the opposite side for later design use", tags: ["여백", "비대칭"], caption: "SPACE / FOCUS", overlay: "frame" },
    { id: "cinematic-haze", ko: "시네마틱 헤이즈", en: "Cinematic Haze", descriptionKo: "얇은 안개층과 깊이감 있는 빛줄기", cueKo: "얇고 현실적인 공기 안개와 부드러운 빛줄기로 전경·중경·배경을 분리하되 얼굴과 핵심 형태의 대비는 유지한다", cueEn: "Use thin believable atmospheric haze and soft light shafts to separate foreground, middle ground, and background while retaining key facial and form contrast", tags: ["헤이즈", "시네마틱"], caption: "HAZE / DEPTH", overlay: "noise" },
    { id: "crisp-commercial", ko: "크리스프 커머셜", en: "Crisp Commercial", descriptionKo: "선명한 제품급 조명과 깨끗한 색 정확도", cueKo: "정교한 대형 광원, 깨끗한 색 분리, 자연스러운 선명도와 광고 촬영 수준의 마감으로 완성한다", cueEn: "Finish with precise large-source lighting, clean color separation, natural sharpness, and polished commercial-photography quality", tags: ["커머셜", "클린"], caption: "CRISP / PRO", overlay: "frame" }
  ];

  const expansionTrendLabels = {
    "soft-window": "SOFT",
    "airy-high-key": "HIGH KEY",
    "sculpted-low-key": "LOW KEY",
    "window-shadow": "SHADOW",
    "golden-hour": "GOLDEN",
    "blue-hour": "BLUE HOUR",
    "warm-tungsten": "TUNGSTEN",
    "direct-flash": "FLASH",
    "neon-reflection": "NEON",
    "nuanced-mono": "MONO",
    "powder-pastel": "PASTEL",
    "earthy-natural": "EARTHY",
    "jewel-tone": "JEWEL",
    "cobalt-orange": "COBALT",
    "white-minimal": "MINIMAL",
    "black-studio": "BLACK",
    "architectural-lines": "ARCH LINES",
    "botanical-frame": "BOTANICAL",
    "water-reflection": "WATER",
    "prism-light": "PRISM",
    "glass-chrome": "CHROME",
    "paper-tactile": "TACTILE",
    "analog-grain": "ANALOG",
    "controlled-motion": "MOTION",
    "intimate-closeup": "CLOSE-UP",
    "environmental-wide": "WIDE",
    "balanced-symmetry": "SYMMETRY",
    "negative-space": "SPACE",
    "cinematic-haze": "HAZE",
    "crisp-commercial": "CRISP"
  };

  const expansionCategories = {
    profile: { label: "프로필", labelEn: "Profile", descriptionKo: "인물의 신뢰감과 개성을 정돈해 보여 주는 프로필", ko: "인물의 얼굴, 헤어스타일, 연령대와 고유한 인상을 유지한 인물 중심 프로필로 변환한다.", en: "Transform the reference into a subject-led profile while preserving the face, hairstyle, age range, and defining impression.", purposes: ["career", "social", "avatar"], peopleFit: ["single", "pair"], ratios: ["1:1", "4:5", "3:4"] },
    editorial: { label: "에디토리얼", labelEn: "Editorial", descriptionKo: "개성과 서사를 담는 잡지형 에디토리얼 화보", ko: "인물의 정체성을 유지하면서 독립 매거진의 서사적인 에디토리얼 화보로 구성한다.", en: "Preserve the subject's identity and compose a narrative editorial portrait for an independent magazine.", purposes: ["content", "career", "social"], peopleFit: ["single", "pair", "smallGroup"], ratios: ["4:5", "3:4", "16:9"] },
    relationship: { label: "그룹 포트레이트", labelEn: "Group Portrait", descriptionKo: "관계와 개별 정체성을 함께 살리는 그룹 사진", ko: "첨부 사진의 인원수와 관계를 그대로 유지하고 모든 사람의 얼굴, 헤어, 의상과 위치가 서로 섞이지 않는 그룹 포트레이트로 구성한다.", en: "Preserve the exact number of people and their relationship, keeping every face, hairstyle, outfit, and position distinct in a coherent group portrait.", purposes: ["family", "gift", "social"], peopleFit: ["pair", "smallGroup", "largeGroup"], ratios: ["4:5", "3:4", "16:9", "1:1"] },
    content: { label: "콘텐츠 화보", labelEn: "Content Visual", descriptionKo: "썸네일과 브랜드 콘텐츠에 바로 쓰기 좋은 화보", ko: "인물을 알아볼 수 있게 유지하면서 썸네일, 카드뉴스, 채널 커버에 활용하기 좋은 명확한 시선 흐름의 콘텐츠 화보로 변환한다.", en: "Keep the subject recognizable and create a content-ready visual with a clear hierarchy for thumbnails, social cards, and channel covers.", purposes: ["content", "social", "career"], peopleFit: ["single", "pair", "smallGroup"], ratios: ["16:9", "4:5", "1:1", "9:16"] },
    film: { label: "필름 스틸", labelEn: "Film Still", descriptionKo: "사진적 질감과 장면의 여운을 살린 영화 스틸", ko: "인물과 장소의 실제 디테일을 유지한 채 한 편의 영화에서 포착한 듯한 사진적 스틸로 변환한다.", en: "Preserve believable details of the subject and location, transforming the image into a photographic still captured from a film.", purposes: ["social", "content", "gift"], peopleFit: ["single", "pair", "smallGroup"], ratios: ["16:9", "4:5", "3:4"] },
    art: { label: "아트 포트레이트", labelEn: "Art Portrait", descriptionKo: "재료와 색의 실험을 더한 독창적인 아트 포트레이트", ko: "얼굴과 핵심 실루엣은 알아볼 수 있게 보존하고 주변의 재료, 색, 공간만 독창적인 현대 아트 포트레이트로 재구성한다.", en: "Keep the face and core silhouette recognizable while reworking the surrounding material, color, and space into an original contemporary art portrait.", purposes: ["content", "gift", "social"], peopleFit: ["single", "pair", "smallGroup"], ratios: ["4:5", "1:1", "3:4", "16:9"] },
    character: { label: "캐릭터 아바타", labelEn: "Character Avatar", descriptionKo: "얼굴 특징을 살린 독창적인 캐릭터 아바타", ko: "첨부 인물의 얼굴형, 눈매, 헤어스타일과 대표 의상을 알아볼 수 있게 단순화한 독창적인 캐릭터 아바타로 변환한다.", en: "Transform the subject into an original character avatar that simplifies but preserves face shape, eyes, hairstyle, and signature clothing.", purposes: ["avatar", "social", "gift"], peopleFit: ["single", "pair", "smallGroup"], ratios: ["1:1", "4:5", "3:4"] },
    sticker: { label: "스티커 팩", labelEn: "Sticker Pack", descriptionKo: "표정과 동작이 분명한 제작용 스티커 세트", ko: "첨부 인물을 알아볼 수 있는 하나의 일관된 캐릭터로 단순화하고 서로 다른 표정과 동작 9개를 3×3 제작용 스티커 시트로 구성한다.", en: "Simplify the subject into one consistent recognizable character and arrange nine distinct expressions and gestures as a production-ready 3x3 sticker sheet.", purposes: ["sticker", "avatar", "social", "gift"], peopleFit: ["single"], ratios: ["1:1"], outputType: "stickerPack", itemCount: 9, grid: "3×3" },
    fantasy: { label: "판타지 포트레이트", labelEn: "Fantasy Portrait", descriptionKo: "현실적인 얼굴과 독창적인 세계관을 결합한 판타지 화보", ko: "인물의 얼굴과 체형을 자연스럽게 유지하면서 기존 작품을 모방하지 않는 독창적인 판타지 세계의 주인공으로 재해석한다.", en: "Keep the subject's face and body natural while reimagining them as the protagonist of an original fantasy world that imitates no existing title.", purposes: ["play", "avatar", "gift", "content"], peopleFit: ["single", "pair", "smallGroup"], ratios: ["4:5", "3:4", "16:9", "1:1"] },
    timewarp: { label: "시대여행 포트레이트", labelEn: "Time Travel Portrait", descriptionKo: "시대의 재료와 조명을 현대적으로 해석한 인물화", ko: "인물의 정체성을 유지하면서 특정 실존 인물이나 작품을 복제하지 않는 시대여행 인물화로 구성하고 의상과 소품의 시대적 일관성을 맞춘다.", en: "Preserve the subject's identity in a time-travel portrait that copies no real person or existing work, with historically coherent wardrobe and props.", purposes: ["play", "gift", "avatar", "social"], peopleFit: ["single", "pair", "smallGroup"], ratios: ["3:4", "4:5", "16:9", "1:1"] },
    toy: { label: "토이 오브젝트", labelEn: "Toy Object", descriptionKo: "인물의 특징을 입체적인 수집 오브젝트로 바꾼 장면", ko: "얼굴, 헤어와 대표 의상을 알아볼 수 있는 독창적인 수집용 토이 또는 미니 오브젝트로 변환하고 실제 재질과 접지 그림자를 표현한다.", en: "Transform the subject into an original collectible toy or miniature object recognizable through face, hair, and signature clothing, with believable material and contact shadows.", purposes: ["play", "gift", "avatar"], peopleFit: ["single", "pair", "smallGroup"], ratios: ["1:1", "4:5", "3:4"] },
    meme: { label: "밈 포토", labelEn: "Meme Photo", descriptionKo: "과장된 상황과 현실적인 합성으로 완성한 유머 사진", ko: "첨부 인물을 알아볼 수 있게 유지하고 일상적인 상황을 한눈에 이해되는 독창적인 시각 유머로 과장하되 신체와 원근은 자연스럽게 표현한다.", en: "Keep the subject recognizable and exaggerate an everyday situation into original instantly readable visual humor while maintaining natural anatomy and perspective.", purposes: ["play", "social", "content"], peopleFit: ["single", "pair", "smallGroup", "largeGroup"], ratios: ["1:1", "4:5", "16:9", "9:16"] }
  };

  Object.entries(expansionCategories).forEach(([category, config]) => {
    expansionDirections.forEach((direction) => {
      presets.push({
        id: `expanded-${category}-${direction.id}`,
        title: `${direction.ko} ${config.label}`,
        enTitle: `${direction.en} ${config.labelEn}`,
        category,
        categoryLabel: category === "sticker" ? "스티커·이모티콘" : (funCategoryLabels[category] || config.label),
        description: `${direction.descriptionKo}을 살린 ${config.descriptionKo}`,
        tags: [config.label, ...direction.tags],
        trend: expansionTrendLabels[direction.id] || direction.en.toUpperCase(),
        caption: direction.caption,
        palette: categoryPalettes[category],
        overlay: direction.overlay,
        purposes: [...config.purposes],
        peopleFit: [...config.peopleFit],
        ratios: [...config.ratios],
        previewVersion: GPT_IMAGE_PREVIEW_VERSION,
        autoPreview: false,
        outputType: config.outputType,
        itemCount: config.itemCount,
        grid: config.grid,
        transformationCue: { ko: direction.cueKo, en: direction.cueEn },
        ko: `${config.ko} ${direction.cueKo}. 인물의 정체성과 인원수를 바꾸지 않고, 의도하지 않은 글자·로고·워터마크는 만들지 않는다.`,
        en: `${config.en} ${direction.cueEn}. Do not change identity or the number of people, and generate no unintended text, logos, or watermarks.`
      });
    });
  });

  const basePresetMeta = {
    "clean-profile": [["career", "social"], ["single", "pair"], ["1:1", "4:5", "3:4"]],
    "founder-editorial": [["career", "content"], ["single"], ["4:5", "3:4", "16:9"]],
    "daylight-real": [["social", "family"], ["single", "pair", "smallGroup"], ["4:5", "3:4", "1:1"]],
    "analog-flash": [["social", "gift"], ["single", "pair", "smallGroup"], ["4:5", "3:4", "1:1"]],
    "cinematic-mono": [["career", "content", "gift"], ["single", "pair"], ["3:4", "4:5", "16:9"]],
    "magazine-cover": [["content", "social"], ["single", "pair"], ["4:5", "3:4"]],
    "cinematic-night": [["social", "content"], ["single", "pair", "smallGroup"], ["4:5", "16:9", "3:4"]],
    "tactile-collage": [["content", "gift"], ["single", "pair", "smallGroup"], ["4:5", "1:1", "16:9"]],
    "surreal-bloom": [["content", "gift", "social"], ["single", "pair"], ["4:5", "3:4", "1:1"]],
    "iridescent-future": [["career", "content", "avatar"], ["single", "pair"], ["1:1", "4:5", "16:9"]],
    "collectible-figure": [["avatar", "gift"], ["single", "pair", "smallGroup"], ["1:1", "4:5"]],
    "webtoon-character": [["avatar", "social"], ["single", "pair", "smallGroup"], ["1:1", "4:5"]],
    "soft-clay": [["avatar", "gift", "social"], ["single", "pair", "smallGroup"], ["1:1", "4:5"]]
  };
  presets.forEach((preset) => {
    const meta = basePresetMeta[preset.id];
    if (meta) [preset.purposes, preset.peopleFit, preset.ratios] = meta;
    preset.purposes ||= ["social"];
    preset.peopleFit ||= ["single", "pair", "smallGroup", "largeGroup"];
    preset.ratios ||= ["1:1", "4:5", "3:4", "16:9", "9:16"];
    preset.previewVersion = Math.max(Number(preset.previewVersion) || 1, GPT_IMAGE_PREVIEW_VERSION);
  });

  const categories = [
    { id: "all", label: "전체" },
    { id: "profile", label: "프로필" },
    { id: "editorial", label: "에디토리얼" },
    { id: "relationship", label: "관계·그룹" },
    { id: "content", label: "콘텐츠" },
    { id: "film", label: "필름" },
    { id: "art", label: "아트" },
    { id: "character", label: "캐릭터" },
    { id: "sticker", label: "스티커·이모티콘" },
    { id: "fantasy", label: "판타지 세계관" },
    { id: "timewarp", label: "시대여행" },
    { id: "toy", label: "토이·오브젝트" },
    { id: "meme", label: "밈·유머" }
  ];

  const elements = {
    pane: document.getElementById("panePhotoTransform"),
    gallery: document.getElementById("photoTransformGallery"),
    galleryMore: document.getElementById("photoTransformGalleryMore"),
    galleryMoreButton: document.getElementById("photoTransformGalleryMoreBtn"),
    galleryMoreStatus: document.getElementById("photoTransformGalleryMoreStatus"),
    filters: document.getElementById("photoTransformFilters"),
    search: document.getElementById("photoTransformSearch"),
    resultCount: document.getElementById("photoTransformResultCount"),
    autoPreviewStatus: document.getElementById("photoTransformAutoPreviewStatus"),
    empty: document.getElementById("photoTransformEmpty"),
    sourceStructure: document.getElementById("photoTransformSourceStructure"),
    people: document.getElementById("photoTransformPeople"),
    outputMode: document.getElementById("photoTransformOutputMode"),
    outputHint: document.getElementById("photoTransformOutputHint"),
    collageOptions: document.getElementById("photoTransformCollageOptions"),
    collageLayout: document.getElementById("photoTransformCollageLayout"),
    collageGap: document.getElementById("photoTransformCollageGap"),
    collageBackground: document.getElementById("photoTransformCollageBackground"),
    identity: document.getElementById("photoTransformIdentity"),
    identitySummary: document.getElementById("photoTransformIdentitySummary"),
    identityLocked: document.getElementById("photoTransformIdentityLocked"),
    identityMutable: document.getElementById("photoTransformIdentityMutable"),
    identityLimit: document.getElementById("photoTransformIdentityLimit"),
    ratio: document.getElementById("photoTransformRatio"),
    background: document.getElementById("photoTransformBackground"),
    language: document.getElementById("photoTransformLanguage"),
    strength: document.getElementById("photoTransformStrength"),
    extra: document.getElementById("photoTransformExtra"),
    purpose: document.getElementById("photoTransformPurpose"),
    sort: document.getElementById("photoTransformSort"),
    compatibleOnly: document.getElementById("photoTransformCompatibleOnly"),
    favoritesOnly: document.getElementById("photoTransformFavoritesOnly"),
    customOpen: document.getElementById("photoTransformCustomPresetBtn"),
    customDialog: document.getElementById("photoTransformCustomDialog"),
    customForm: document.getElementById("photoTransformCustomForm"),
    customTitle: document.getElementById("photoTransformCustomTitle"),
    customName: document.getElementById("photoTransformCustomName"),
    customCategory: document.getElementById("photoTransformCustomCategory"),
    customDescription: document.getElementById("photoTransformCustomDescription"),
    customKo: document.getElementById("photoTransformCustomKo"),
    customEn: document.getElementById("photoTransformCustomEn"),
    customPurposes: document.getElementById("photoTransformCustomPurposes"),
    customPeople: document.getElementById("photoTransformCustomPeople"),
    customSource: document.getElementById("photoTransformCustomSource"),
    customSourceTitle: document.getElementById("photoTransformCustomSourceTitle"),
    adminOpen: document.getElementById("photoTransformPreviewAdminBtn"),
    adminDialog: document.getElementById("photoTransformAdminDialog"),
    adminSummary: document.getElementById("photoTransformAdminSummary"),
    adminList: document.getElementById("photoTransformAdminList"),
    adminGenerateMissing: document.getElementById("photoTransformAdminGenerateMissingBtn"),
    adminRefresh: document.getElementById("photoTransformAdminRefreshBtn"),
  };

  if (!elements.pane || !elements.gallery || !elements.filters) return;

  function refreshAdminControl() {
    var accountAdmin = window.PromptDeckAuth?.loadSession?.()?.role === "admin";
    var modeAdmin = window.PromptDeckAdminAccess?.isAuthenticated?.() === true;
    elements.adminOpen.hidden = !(accountAdmin || modeAdmin);
  }
  refreshAdminControl();
  window.addEventListener("promptdeck:admin-access", refreshAdminControl);

  const galleryMedia = window.matchMedia("(max-width: 620px)");
  const MOBILE_GALLERY_PAGE_SIZE = 18;
  const getGalleryPageSize = () => galleryMedia.matches ? MOBILE_GALLERY_PAGE_SIZE : Number.POSITIVE_INFINITY;

  const state = {
    category: "all",
    query: "",
    purpose: "all",
    sort: "default",
    compatibleOnly: true,
    favoritesOnly: false,
    galleryLimit: getGalleryPageSize(),
    galleryFilterKey: "",
    customSourceId: null,
    favoriteIds: new Set(),
    userPresetIds: new Set(),
    savedPreviews: new Map(),
    previewStates: new Map(),
    bundledPreviews: new Map(),
    bundledPreviewsReady: Promise.resolve(),
    autoPreviewStarted: false,
    autoPreviewRunning: false,
    autoPreviewProgress: { total: 0, processed: 0, saved: 0, failed: 0, batch: 0, batchCount: 0 },
    previewServerAvailable: null,
    previewRefreshTimer: 0,
    previewRefreshPromise: null
  };

  const STORAGE_KEYS = {
    userPresets: "promptdeck.photoTransform.userPresets.v1",
    favorites: "promptdeck.photoTransform.favorites.v1",
    previewVersions: "promptdeck.photoTransform.previewVersions.v1"
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  }

  function categoryLabel(category) {
    return categories.find((item) => item.id === category)?.label || "내 프리셋";
  }

  function normalizeUserPreset(raw) {
    if (!raw || typeof raw !== "object" || !raw.id || !raw.title || !raw.ko) return null;
    const category = categories.some((item) => item.id === raw.category && item.id !== "all") ? raw.category : "profile";
    return {
      id: String(raw.id),
      title: String(raw.title).slice(0, 40),
      category,
      categoryLabel: categoryLabel(category),
      description: String(raw.description || "사용자 정의 사진 변환 프리셋").slice(0, 100),
      tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 4).map(String) : ["내 프리셋"],
      trend: "MY PRESET",
      caption: "CUSTOM / STYLE",
      palette: categoryPalettes[category] || categoryPalettes.profile,
      overlay: "frame",
      purposes: Array.isArray(raw.purposes) ? raw.purposes : ["social"],
      peopleFit: Array.isArray(raw.peopleFit) ? raw.peopleFit : ["single", "pair", "smallGroup", "largeGroup"],
      ratios: Array.isArray(raw.ratios) ? raw.ratios : ["1:1", "4:5", "3:4", "16:9", "9:16"],
      previewVersion: Math.max(Number(raw.previewVersion) || 1, GPT_IMAGE_PREVIEW_VERSION),
      outputType: raw.outputType === "animatedSprite" ? "animatedSprite" : (raw.outputType === "stickerPack" || category === "sticker" ? "stickerPack" : undefined),
      itemCount: Number(raw.itemCount) || (category === "sticker" ? 9 : undefined),
      frameCount: Number(raw.frameCount) || undefined,
      grid: String(raw.grid || (category === "sticker" ? "3×3" : "")),
      ko: String(raw.ko),
      en: String(raw.en || raw.ko),
      isUserPreset: true
    };
  }

  function loadLocalData() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.userPresets) || "[]");
      stored.map(normalizeUserPreset).filter(Boolean).forEach((preset) => {
        if (presets.some((item) => item.id === preset.id)) return;
        presets.push(preset);
        state.userPresetIds.add(preset.id);
      });
    } catch (error) {
      console.warn("사진 변환 사용자 프리셋을 불러오지 못했습니다.", error);
    }
    try {
      const storedFavorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites) || "[]");
      if (Array.isArray(storedFavorites)) storedFavorites.forEach((id) => state.favoriteIds.add(String(id)));
    } catch (error) {
      console.warn("사진 변환 즐겨찾기를 불러오지 못했습니다.", error);
    }
    try {
      const versions = JSON.parse(localStorage.getItem(STORAGE_KEYS.previewVersions) || "{}");
      presets.forEach((preset) => {
        if (Number(versions[preset.id]) > preset.previewVersion) preset.previewVersion = Number(versions[preset.id]);
      });
    } catch (error) {
      console.warn("사진 변환 미리보기 버전을 불러오지 못했습니다.", error);
    }
  }

  function persistUserPresets() {
    const userPresets = presets.filter((preset) => preset.isUserPreset).map(({ id, title, category, description, tags, purposes, peopleFit, ratios, previewVersion, outputType, itemCount, frameCount, grid, ko, en }) => ({ id, title, category, description, tags, purposes, peopleFit, ratios, previewVersion, outputType, itemCount, frameCount, grid, ko, en }));
    localStorage.setItem(STORAGE_KEYS.userPresets, JSON.stringify(userPresets));
  }

  function persistFavorites() {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify([...state.favoriteIds]));
  }

  function persistPreviewVersions() {
    const versions = Object.fromEntries(presets.filter((preset) => preset.previewVersion > 1).map((preset) => [preset.id, preset.previewVersion]));
    localStorage.setItem(STORAGE_KEYS.previewVersions, JSON.stringify(versions));
  }

  const identityGuide = {
    exact: {
      ui: {
        summary: "닮음과 스타일이 충돌하면 얼굴을 우선합니다.",
        locked: "얼굴형·이목구비 비율·피부톤·식별 특징",
        mutable: "표정·각도·포즈·헤어·의상·조명·배경",
        limit: "강한 스타일에서는 표현 폭이 줄 수 있습니다."
      },
      ko: "보존 우선순위: 높음. 닮음과 스타일이 충돌하면 얼굴 동일성을 최우선으로 한다. 얼굴형, 눈·코·입의 상대적 비율, 헤어라인, 피부색, 연령대와 점·흉터 같은 식별 특징을 정체성 고정값으로 유지한다. 원본 표정·시선·고개 각도·포즈·헤어 연출·의상·조명·배경은 고정값이 아니며, 얼굴 동일성을 훼손하지 않는 범위에서 프리셋에 맞게 바꾼다. 뷰티 필터처럼 얼굴을 재설계하거나 다른 사람의 특징을 섞지 않는다.",
      en: "Identity priority: high. When likeness and style conflict, prioritize facial identity. Lock face shape, relative eye-nose-mouth proportions, hairline, skin tone, apparent age, and identifying features such as moles or scars. The source expression, gaze, head angle, pose, hair styling, wardrobe, lighting, and background are not anchors and may follow the preset only while facial identity remains intact. Do not redesign the face with a beauty filter or merge traits from another person."
    },
    balanced: {
      ui: {
        summary: "닮음을 유지하며 스타일을 적용합니다.",
        locked: "얼굴 구조·피부톤·연령대·식별 특징",
        mutable: "표정·각도·포즈·헤어·의상·배경·재질",
        limit: "세부 인상은 달라질 수 있어 정밀 재현용이 아닙니다."
      },
      ko: "보존 우선순위: 균형. 첨부 사진과 동일 인물임을 분명히 알아볼 수 있도록 얼굴 구조, 피부색, 연령대와 핵심 식별 특징을 유지하고 헤어라인의 큰 형태를 보존한다. 표정·시선·고개와 카메라 각도·포즈·헤어의 가르마와 볼륨·의상·조명·배경·색과 재질은 프리셋이 지휘하는 변환 항목으로 취급한다. 닮음과 스타일을 함께 확보하되, 스타일 때문에 식별 특징이 사라지면 닮음을 우선해 보정한다.",
      en: "Identity priority: balanced. Keep the subject clearly recognizable by preserving facial structure, skin tone, apparent age, key identifying features, and the overall hairline shape. Treat expression, gaze, head and camera angle, pose, hair part and volume, wardrobe, lighting, background, color, and material treatment as preset-directed choices. Preserve both likeness and style, but restore likeness when styling erases an identifying feature."
    },
    creative: {
      ui: {
        summary: "핵심 인상만 남기고 프리셋 표현을 우선합니다.",
        locked: "얼굴 인상·피부톤·식별 특징",
        mutable: "비율·표정·포즈·헤어·의상·배경·재질",
        limit: "강한 스타일은 닮음이 낮아질 수 있습니다."
      },
      ko: "보존 우선순위: 창의적. 첨부 인물임을 알아볼 수 있는 전체 얼굴 인상, 피부색과 핵심 식별 특징은 남기되, 닮음과 프리셋 표현이 충돌하면 알아볼 수 있는 최소 범위 안에서 프리셋의 캐릭터·비율·재질 언어를 우선한다. 이목구비 단순화, 얼굴과 신체 비율, 표정·각도·포즈·헤어 실루엣·의상·조명·배경을 원본에 고정하지 않고 적극적으로 재해석한다. 다른 사람의 특징을 섞거나 인물을 식별할 수 없을 정도로 바꾸지는 않는다.",
      en: "Identity priority: creative. Retain the overall facial impression, skin tone, and key identifying cues needed to recognize the subject, but when likeness conflicts with the preset, prioritize its character, proportion, and material language within that recognizable minimum. Freely reinterpret facial-detail simplification, face and body proportions, expression, angle, pose, hair silhouette, wardrobe, lighting, and background. Do not merge another person's traits or change the subject beyond recognition."
    }
  };

  function updateIdentityGuide() {
    const guide = identityGuide[elements.identity.value] || identityGuide.balanced;
    elements.identitySummary.textContent = guide.ui.summary;
    elements.identityLocked.textContent = guide.ui.locked;
    elements.identityMutable.textContent = guide.ui.mutable;
    elements.identityLimit.textContent = guide.ui.limit;
  }

  const categoryTransformationGuide = {
    profile: {
      ko: "원본을 단순 보정하지 말고 프리셋의 목적에 맞는 새로운 포트레이트 촬영으로 연출한다. 프리셋에 어울리는 표정, 머리 방향, 어깨 자세, 헤어 마감, 의상, 조명과 프레이밍을 새로 결정한다.",
      en: "Direct a new portrait session rather than lightly retouching the source. Choose a preset-appropriate expression, head turn, shoulder posture, hair finish, wardrobe, lighting, and framing."
    },
    editorial: {
      ko: "원본 자세를 복제하지 말고 프리셋의 서사가 느껴지는 새로운 몸짓과 시선, 카메라 관점, 헤어·의상 스타일링, 방향성 있는 빛과 여백을 설계한다.",
      en: "Do not copy the source pose. Stage a new narrative gesture and gaze, camera viewpoint, hair and wardrobe styling, directional light, and editorial use of space."
    },
    relationship: {
      ko: "각 인물의 얼굴 정체성은 분리해 유지하되 표정, 시선 교환, 상호작용, 그룹 포즈, 헤어 연출, 의상 조화와 공통 조명은 프리셋에 맞게 새로 지휘한다.",
      en: "Keep every facial identity separate, while newly directing expressions, exchanged gazes, interaction, group pose, hair styling, coordinated wardrobe, and shared lighting for the preset."
    },
    content: {
      ko: "썸네일·커버·키아트 목적에 맞게 표정, 포즈, 크롭, 헤어와 의상, 조명, 배경 계층과 시선 흐름을 원본과 다르게 적극적으로 재구성한다.",
      en: "Actively redesign expression, pose, crop, hair and wardrobe, lighting, background hierarchy, and eye flow for a thumbnail, cover, or key-art result."
    },
    film: {
      ko: "새 영화 장면을 연출하듯 표정과 시선, 몸의 동선, 카메라 높이와 각도, 헤어·의상 상태, 장면 조명과 공간 깊이를 새로 만든다.",
      en: "Direct a new film moment with a changed expression and gaze, body blocking, camera height and angle, hair and wardrobe state, scene lighting, and spatial depth."
    },
    art: {
      ko: "얼굴 정체성 고정값만 남기고 포즈, 헤어 실루엣, 재료, 색, 배경 공간과 구도는 프리셋의 예술 언어에 맞게 과감하게 재구성한다.",
      en: "Keep only the facial identity anchors; boldly rebuild pose, hair silhouette, material, color, background space, and composition in the preset's art language."
    },
    character: {
      ko: "얼굴 랜드마크로 동일 인물을 알아볼 수 있게 하되 표정, 포즈, 헤어 형태, 의상, 신체 비율과 렌더링은 프리셋의 캐릭터 체계로 다시 설계한다.",
      en: "Use facial landmarks for recognizability while redesigning expression, pose, hair shape, costume, body proportion, and rendering into the preset's character system."
    },
    sticker: {
      ko: "원본 표정과 포즈를 고정하지 않는다. 프리셋이 요구하는 각 표정과 동작을 분명히 다르게 만들면서 동일한 얼굴 정체성과 캐릭터 디자인 체계만 일관되게 유지한다.",
      en: "Do not lock the source expression or pose. Make every preset-requested expression and action visibly distinct while keeping only facial identity and the character design system consistent."
    },
    fantasy: {
      ko: "프리셋 세계관의 새로운 역할에 맞춰 표정, 시선, 영웅 포즈, 헤어 연출, 의상·장비, 장면 조명과 환경을 적극적으로 바꾼다.",
      en: "Actively change expression, gaze, heroic pose, hair styling, costume and equipment, scene lighting, and environment for the preset's new fantasy role."
    },
    timewarp: {
      ko: "원본 촬영 상태를 유지하지 말고 선택한 시대에 맞는 표정, 자세, 헤어 연출, 의상, 소품, 시대 조명과 촬영 문법으로 재연출한다.",
      en: "Do not retain the source capture; restage expression, posture, hair treatment, wardrobe, props, period lighting, and photographic grammar for the selected era."
    },
    toy: {
      ko: "얼굴의 닮은꼴 단서만 보존하고 표정, 포즈, 헤어 형태, 의상과 비율을 프리셋의 수집용 토이·오브젝트 디자인으로 변환한다.",
      en: "Preserve only the likeness cues, transforming expression, pose, hair shape, costume, and proportions into the preset's collectible toy or object design."
    },
    meme: {
      ko: "동일 인물임은 유지하되 표정, 시선, 포즈, 카메라 각도와 상황 연출을 원본보다 분명하게 과장해 프리셋의 유머가 즉시 읽히게 한다.",
      en: "Keep the person recognizable while clearly exaggerating expression, gaze, pose, camera angle, and situation beyond the source so the preset's humor reads immediately."
    }
  };

  const categoryVisualSystemGuide = {
    profile: {
      ko: "인물의 피부·헤어·의상과 배경은 같은 촬영 원리 안에서 자연스럽게 연결한다. 피부 위에 효과를 덧씌우지 말고, 선택한 빛의 방향·명암·색온도와 렌즈감이 장면 전체에 일관되게 작동하게 한다.",
      en: "Connect skin, hair, wardrobe, and background through one coherent photographic logic. Do not lay an effect over the skin; carry the selected light direction, tonal contrast, color temperature, and lens character consistently through the entire scene."
    },
    editorial: {
      ko: "인물, 의상, 소품, 배경을 같은 아트디렉션으로 묶어 잡지 화보처럼 완결된 한 장면을 만든다. 질감과 색은 장식 효과가 아니라 시선 흐름·여백·인물의 존재감을 강화하는 역할로만 사용한다.",
      en: "Bind the subject, wardrobe, props, and background into one art direction so the result reads as a finished editorial image. Use texture and color to strengthen eye flow, negative space, and presence, never as detached decoration."
    },
    relationship: {
      ko: "모든 인물에게 같은 재질·조명·색보정 체계를 적용하되, 얼굴과 신체의 경계·거리·접지 그림자는 각자 자연스럽고 분명하게 유지한다. 한 사람에게만 효과가 붙거나 인물 사이 재질이 섞이지 않게 한다.",
      en: "Apply one shared material, lighting, and color-grade system to every person while keeping each face, body boundary, distance, and contact shadow natural and distinct. Do not apply an effect to only one person or merge material cues between people."
    },
    content: {
      ko: "핵심 인물과 오브젝트의 우선순위를 먼저 정하고, 색·재질·그래픽 레이어는 그 위계를 뒷받침하도록 배치한다. 샘플의 완성도는 유지하되 읽을 수 있는 글자, UI 조각, 임의의 로고로 화면을 채우지 않는다.",
      en: "Establish a clear hierarchy for the key subject and objects first, then place color, material, and graphic layers to support that hierarchy. Match the sample's finish without filling the image with legible text, UI fragments, or invented logos."
    },
    film: {
      ko: "필름·인화·광학적 특성은 화면 전체의 노출, 하이라이트, 그림자, 색 편차와 초점 흐름에 연결한다. 입자나 빛샘을 균일한 디지털 노이즈 필터처럼 얹지 않는다.",
      en: "Connect film, print, and optical character to the whole image through exposure, highlights, shadows, color variation, and focus falloff. Do not place grain or light leaks on top as a uniform digital-noise filter."
    },
    art: {
      ko: "선택한 매체의 제작 규칙을 얼굴, 헤어, 의상, 배경까지 일관되게 적용한다. 재질의 두께·결·윤곽·겹침·빛 반응을 구체적으로 보이게 하고, 사진 위에 질감만 얹은 효과로 끝내지 않는다.",
      en: "Apply the selected medium's making rules consistently to face, hair, wardrobe, and background. Make thickness, grain, edge behavior, layering, and light response visibly specific; do not stop at a texture overlay on a photograph."
    },
    character: {
      ko: "평면·입체 여부, 선의 굵기, 색면, 표면 질감과 비율을 하나의 캐릭터 설계 체계로 통일한다. 얼굴만 사진처럼 남기거나 의상·배경의 렌더링 문법이 서로 충돌하지 않게 한다.",
      en: "Unify flat or dimensional construction, line weight, color planes, surface texture, and proportions into one character-design system. Do not leave only the face photographic or let the rendering grammar of wardrobe and background conflict."
    },
    sticker: {
      ko: "모든 셀에서 캐릭터의 선 굵기, 색상, 재질, 외곽선, 빈 여백과 그림자 방향을 동일하게 유지한다. 각 동작은 달라도 한 세트로 보이는 제작용 원본 시트를 만든다.",
      en: "Keep line weight, color, material, outline, empty margin, and shadow direction identical across every cell. Actions may differ, but the result must read as one production-ready source-sheet system."
    },
    fantasy: {
      ko: "세계관의 재료·의상·소품·공간·조명을 같은 물리 규칙으로 연결한다. 장식 요소를 무작위로 나열하지 말고, 인물의 역할과 장면의 깊이를 설명하는 소수의 구체적인 요소를 선택한다.",
      en: "Connect world materials, costume, props, space, and lighting through one physical logic. Do not scatter decorative elements at random; choose a small number of specific elements that explain the subject's role and scene depth."
    },
    timewarp: {
      ko: "시대감은 의상만 바꾸는 방식이 아니라 종이·직물·금속·조명·인화 질감과 공간의 마감까지 같은 시대의 제작 문법으로 맞춘다. 시대를 암시하는 실제 글자나 문장은 만들지 않는다.",
      en: "Build period character through the making grammar of paper, fabric, metal, lighting, print texture, and spatial finishes, not wardrobe alone. Do not generate era-signaling readable text or phrases."
    },
    toy: {
      ko: "수집 오브젝트가 실제로 제작된 것처럼 재질, 이음새·절단면·도색, 두께, 스케일, 접지 그림자와 제품 조명을 일관되게 표현한다. 인물 사진 위에 장난감 질감만 덮는 방식은 피한다.",
      en: "Render material, seams or cut edges, paint, thickness, scale, contact shadows, and product lighting as though the collectible object was physically made. Do not simply cover a portrait with toy texture."
    },
    meme: {
      ko: "유머는 한 번에 읽히는 장면과 표정·행동의 관계에서 만들고, 재질·조명·원근은 실제 한 장면처럼 일관되게 유지한다. 콜라주 조각이나 임의의 글자로 농담을 설명하지 않는다.",
      en: "Make the humor read through one instantly legible scene and the relationship between expression and action, while keeping material, lighting, and perspective coherent like one real moment. Do not explain the joke with collage fragments or invented text."
    },
    fallback: {
      ko: "선택한 프리셋의 재질·형태·색·빛·공간 깊이를 하나의 시각 시스템으로 연결한다. 표면 효과를 임의로 겹치지 말고, 중요한 형태와 인물의 식별성은 선명하게 유지한다.",
      en: "Connect the selected preset's material, form, color, light, and spatial depth into one visual system. Do not stack surface effects at random; keep important forms and subject recognizability clear."
    }
  };

  const directionVisualSystemGuide = {
    "soft-window": {
      ko: "창빛은 하나의 큰 측면 광원에서 들어오게 하고, 얼굴의 밝은 면에서 그림자 면까지 부드럽고 연속적인 명암 전환을 만든다. 반대편은 약한 자연 반사광으로만 열어 두며 배경에도 같은 창의 방향과 색온도를 유지한다.",
      en: "Let the window act as one large side source, creating a soft continuous transition from the lit side of the face into shadow. Open the opposite side only with gentle natural bounce, and keep the same window direction and color temperature in the background."
    },
    "airy-high-key": {
      ko: "흰색을 단순 과노출하지 말고 피부·의상·배경의 밝은 톤을 서로 구분한다. 눈과 얼굴 윤곽에는 충분한 미세 대비를 남기고, 그림자는 옅지만 접지감이 사라지지 않게 한다.",
      en: "Do not create the look by simply overexposing white. Separate the bright values of skin, wardrobe, and background, retain fine contrast around the eyes and facial contour, and keep faint shadows strong enough to preserve grounding."
    },
    "sculpted-low-key": {
      ko: "좁은 키라이트가 얼굴과 신체의 한쪽 면을 따라 형태를 조각하게 하고, 암부는 검게 뭉개지지 않도록 재질 디테일을 남긴다. 림라이트는 배경과 겹치는 윤곽에만 얇게 사용하고 양쪽 얼굴을 동일하게 밝히지 않는다.",
      en: "Use a narrow key to sculpt one side of the face and body while retaining material detail in the dark values instead of crushing them to black. Keep rim light thin and limited to contours that overlap the background; do not light both sides of the face equally."
    },
    "window-shadow": {
      ko: "블라인드나 창틀 그림자는 하나의 실제 창 구조에서 투사된 것처럼 간격·각도·선명도가 일관되어야 한다. 패턴은 배경과 의상에 집중하고 눈·코·입을 가로지르는 난잡한 줄무늬나 서로 충돌하는 이중 그림자를 만들지 않는다.",
      en: "Make blind or window-frame shadows consistent in spacing, angle, and sharpness as if projected by one real window structure. Concentrate the pattern on background and wardrobe; avoid chaotic stripes across the eyes, nose, or mouth and avoid conflicting double shadows."
    },
    "golden-hour": {
      ko: "낮은 태양의 위치를 하나로 정하고 역광의 방향, 금빛 윤곽, 길어진 그림자와 플레어가 그 위치에 맞게 연결되게 한다. 피부는 주황색으로 물들이지 말고 중성에 가까운 반사광으로 얼굴 정보를 살린다.",
      en: "Establish one low-sun position and align backlight direction, golden edge light, elongated shadows, and restrained flare to it. Do not turn skin orange; preserve facial information with near-neutral bounce light."
    },
    "blue-hour": {
      ko: "해 진 직후의 청색 주변광을 장면 전체의 기본광으로 두고, 작은 텅스텐 실내광은 깊이와 시선 유도를 위한 국소 포인트로만 사용한다. 피부에는 두 색이 자연스럽게 섞이되 청록이나 주황 한쪽으로 무너지지 않게 한다.",
      en: "Use post-sunset blue ambient light as the scene's base illumination, with small tungsten practicals only as local accents for depth and eye flow. Let both colors mix naturally on skin without collapsing it into cyan or orange."
    },
    "warm-tungsten": {
      ko: "화면 안의 전구나 실내등 위치와 얼굴·배경의 호박색 하이라이트 방향을 일치시킨다. 따뜻함은 광원과 하이라이트에 집중하고 피부 중간톤은 중성에 가깝게 유지해 누런 필터처럼 보이지 않게 한다.",
      en: "Match the position of visible lamps or practicals to the direction of amber highlights on face and background. Concentrate warmth in sources and highlights while keeping skin midtones near neutral so the result does not read as a yellow filter."
    },
    "direct-flash": {
      ko: "카메라 축 가까이에서 터진 짧고 단단한 플래시로 전경을 또렷하게 만들고, 피사체 뒤에는 거리와 형태에 맞는 작고 선명한 그림자를 둔다. 배경 밝기는 빠르게 감소시키되 얼굴의 하이라이트가 날아가거나 피부가 평평해지지 않게 한다.",
      en: "Use a short hard flash close to the camera axis for a crisp foreground, with a compact defined shadow behind the subject that matches distance and shape. Let background brightness fall rapidly without clipping facial highlights or flattening the skin."
    },
    "paper-tactile": {
      ko: "한지와 무광 색지를 3~5개의 실제 레이어로 나누어 얼굴·헤어·의상·배경에 적용한다. 칼로 정교하게 오린 깨끗한 윤곽, 미세한 종이 섬유, 레이어 사이의 얕고 일관된 접지 그림자를 보이게 하며, 반투명 테이프는 작은 보조 요소로만 사용한다. 찢어진 종이, 플라스틱 광택, 사진 위에 종이 질감만 입힌 효과는 피한다.",
      en: "Build hanji and matte colored paper as three to five physical layers across face, hair, wardrobe, and background. Show clean knife-cut contours, fine paper fibers, and shallow consistent contact shadows between layers, using translucent tape only as a small supporting detail. Avoid torn-paper clichés, plastic shine, or a paper texture simply laid over a photo."
    },
    "glass-chrome": {
      ko: "유리·크롬·브러시드 메탈은 각각 다른 투명도와 반사 흐림을 갖게 하고, 반사는 주변의 실제 색·형태·광원만 비추게 한다. 모든 표면을 거울처럼 만들거나 인물 피부에 금속 효과를 덮지 않는다.",
      en: "Give glass, chrome, and brushed metal distinct transparency and reflection falloff, and let reflections show only plausible nearby color, form, and light. Do not turn every surface into a mirror or coat the subject's skin in metal."
    },
    "analog-grain": {
      ko: "입자, 하이라이트 번짐, 눌린 검정과 색 편차를 노출과 렌즈 특성에서 나온 것처럼 연결한다. 얼굴·눈·핵심 윤곽은 읽히게 두고, 균일한 노이즈나 과도한 스크래치로 디테일을 지우지 않는다.",
      en: "Make grain, highlight halation, lifted blacks, and color variation arise from exposure and lens behavior. Keep face, eyes, and key contours legible; do not erase detail with uniform noise or excessive scratches."
    },
    "controlled-motion": {
      ko: "움직임 흐림의 시작점·방향·길이를 실제 동작과 셔터 속도에 맞추고, 눈·얼굴·핵심 오브젝트는 선명한 기준점으로 남긴다. 배경과 의상 끝에만 선택적으로 흐림을 주며, 이중 얼굴이나 여러 팔다리처럼 보이게 하지 않는다.",
      en: "Match the origin, direction, and length of motion blur to believable movement and shutter behavior, keeping eyes, face, and the key object as sharp anchors. Blur only selected background and garment edges; never create double faces or extra-looking limbs."
    },
    "prism-light": {
      ko: "프리즘의 색 분산과 굴절은 광원이 닿는 작은 영역에만 물리적으로 배치하고, 피부색과 얼굴 구조를 가리지 않는다. 무지개 효과를 화면 전체에 균일하게 뿌리지 않는다.",
      en: "Place prism dispersion and refraction physically only in small light-receiving areas without obscuring skin tone or facial structure. Do not spread a uniform rainbow effect across the whole image."
    },
    "neon-reflection": {
      ko: "네온 반사는 유리, 젖은 바닥, 금속처럼 실제로 반사될 표면에만 제한하고 피부에는 절제된 보조광으로 남긴다. 색 번짐의 방향과 밝기는 주변 광원 위치에 맞춘다.",
      en: "Confine neon reflections to plausible surfaces such as glass, wet ground, and metal, leaving only restrained fill light on skin. Match the direction and intensity of color spill to nearby light sources."
    },
    "nuanced-mono": {
      ko: "흑백 변환은 단순 탈색이 아니라 피부, 헤어, 의상과 배경이 서로 다른 회색 단계로 분리되게 설계한다. 눈과 표정은 국소 대비로 읽히게 하고 검정은 디테일을 삼키지 않으며 밝은 회색은 흰색으로 날아가지 않게 한다.",
      en: "Design monochrome as a hierarchy of distinct gray values across skin, hair, wardrobe, and background rather than simple desaturation. Use local contrast to keep eyes and expression readable, retain detail in blacks, and keep pale grays from clipping to white."
    },
    "powder-pastel": {
      ko: "파스텔은 두세 가지 저채도 색군으로 제한하고, 분말감은 매트한 표면과 부드러운 명암에서 표현한다. 모든 요소를 같은 밝기로 만들지 말고 얼굴·의상·배경 사이에 은은한 색과 명도 위계를 둔다.",
      en: "Limit the pastel system to two or three low-saturation color families and express powder softness through matte surfaces and gentle tonal modeling. Do not make every element equally pale; preserve subtle color and value hierarchy between face, wardrobe, and background."
    },
    "earthy-natural": {
      ko: "테라코타·올리브·샌드 색을 나무·리넨·흙처럼 실제 재료가 있는 위치에 배치하고, 각 재질의 결 크기와 반사율을 구분한다. 갈색 필터를 전체에 씌우지 말고 피부색과 흰색 기준점을 자연스럽게 남긴다.",
      en: "Place terracotta, olive, and sand tones where believable materials such as wood, linen, and earth actually occur, distinguishing their grain scale and reflectivity. Do not wash the whole image with a brown filter; retain natural skin color and a credible white point."
    },
    "jewel-tone": {
      ko: "에메랄드·사파이어·루비 중 한두 색을 주조색과 보조색으로 정하고 벨벳·유리·금속처럼 깊은 색이 설득력 있게 보이는 재질에 적용한다. 금빛과 검정은 작은 경계와 깊이 조절에만 사용해 화면이 과장된 왕실 장식처럼 되지 않게 한다.",
      en: "Choose only one or two among emerald, sapphire, and ruby as primary and secondary colors, applying them to materials such as velvet, glass, or metal that can plausibly hold deep color. Use gold and black only for small boundaries and depth control so the image does not become exaggerated royal decoration."
    },
    "cobalt-orange": {
      ko: "코발트 블루와 번트 오렌지를 서로 경쟁하는 작은 점으로 흩뿌리지 말고 큰 전경·배경 색면으로 분리한다. 피부와 핵심 피사체에는 중성 연결 톤을 두고 보색 경계가 얼굴을 오염시키지 않게 한다.",
      en: "Separate cobalt blue and burnt orange into large foreground and background fields instead of scattering competing accents. Keep a neutral bridge on skin and the key subject, preventing complementary color edges from contaminating the face."
    },
    "white-minimal": {
      ko: "흰색·연회색 배경 안에서도 피사체 윤곽, 의상, 바닥과 그림자가 서로 구분되게 미세한 명도 차를 둔다. 소품은 기능이 분명한 한두 개만 남기고, 여백을 임의의 장식이나 흐릿한 오브젝트로 채우지 않는다.",
      en: "Use subtle value differences so subject contour, wardrobe, floor, and shadow remain distinct within a white or pale-gray setting. Keep only one or two clearly functional props, and do not fill negative space with arbitrary decoration or vague objects."
    },
    "black-studio": {
      ko: "검은 배경은 균일하고 빛을 흡수하게 유지하되, 피사체의 어두운 헤어·의상은 얇은 가장자리 빛과 재질별 반사 차이로 분리한다. 암부를 회색 안개로 띄우거나 윤곽 전체에 네온 테두리를 두르지 않는다.",
      en: "Keep the black background even and light-absorbing while separating dark hair and wardrobe with thin edge light and material-specific reflectivity. Do not lift shadows into gray fog or trace the entire silhouette with a neon outline."
    },
    "architectural-lines": {
      ko: "실제 공간의 기둥·계단·벽선이 하나의 소실점 체계 안에서 인물로 향하게 하고 수직선은 기울지 않게 유지한다. 인물의 신체 비율은 렌즈 왜곡으로 늘어나지 않게 하며 건축 선이 얼굴이나 관절을 어색하게 절단하지 않게 한다.",
      en: "Keep columns, stairs, and wall lines within one coherent vanishing-point system that guides the eye toward the subject, with verticals remaining upright. Prevent lens distortion from stretching the body, and do not let architectural lines awkwardly cut through the face or joints."
    },
    "botanical-frame": {
      ko: "식물은 전경·중경·배경의 서로 다른 크기와 초점으로 배치해 자연스러운 깊이 프레임을 만든다. 잎의 광택·맥·그림자 방향을 실제 조명에 맞추고 얼굴과 손, 핵심 실루엣을 가리지 않는다.",
      en: "Place plants at different scales and focus levels across foreground, middle ground, and background to build a natural depth frame. Match leaf sheen, veins, and shadow direction to the scene light, while keeping face, hands, and the key silhouette unobscured."
    },
    "water-reflection": {
      ko: "물결 반사광은 하나의 수면에서 올라온 듯한 방향과 주기를 갖게 하고 배경·의상에 약하게 이어지게 한다. 실제 물이 보인다면 반사상과 원근을 맞추고, 얼굴 전체에 무작위 청색 무늬를 덮지 않는다.",
      en: "Give reflected-water light one coherent direction and rhythm as if coming from a single water surface, carrying it subtly across background and wardrobe. If water is visible, align reflection and perspective, and do not cover the entire face with random blue patterns."
    },
    "intimate-closeup": {
      ko: "눈과 표정이 주제가 되도록 가까이 크롭하되 이마·턱·귀를 우연히 잘라낸 듯 보이지 않게 경계를 의도적으로 정한다. 얕은 심도에서도 두 눈과 핵심 식별 특징은 읽히게 하고 피부·헤어·의상 재질을 과도한 보정 없이 구분한다.",
      en: "Crop close enough for eyes and expression to lead, but choose boundaries deliberately so forehead, chin, or ears do not look accidentally cut off. Even with shallow depth of field, keep both eyes and defining identity cues readable and distinguish skin, hair, and wardrobe textures without excessive retouching."
    },
    "environmental-wide": {
      ko: "인물과 장소의 비율, 수직선, 원근, 그림자 스케일을 정확히 맞추고, 주변 디테일은 인물을 압도하지 않도록 깊이 단계로 정리한다. 넓은 장면에서도 인물의 얼굴과 행동은 읽히게 유지한다.",
      en: "Match subject-to-place scale, verticals, perspective, and shadow scale accurately, organizing surrounding detail in depth layers so it does not overpower the subject. Keep the face and action readable even in a wide scene."
    },
    "balanced-symmetry": {
      ko: "배경 구조와 소품은 중앙축을 기준으로 균형을 맞추되 얼굴·손·자세에는 작은 자연스러운 비대칭을 남긴다. 좌우 복제 흔적, 중복 신체, 완벽한 거울 얼굴을 만들지 않고 시선의 중심만 안정적으로 고정한다.",
      en: "Balance background structure and props around a central axis while retaining small natural asymmetries in face, hands, and pose. Avoid mirrored duplication, repeated anatomy, or a perfectly mirrored face; stabilize only the visual center."
    },
    "negative-space": {
      ko: "인물을 한쪽 삼분할 지점에 충분한 크기로 두고 반대편 여백은 색·빛·깊이가 안정된 하나의 편집 가능 영역으로 유지한다. 여백에 불필요한 소품, 임의의 글자, 밝은 얼룩을 만들지 않으며 인물의 시선이나 동작이 빈 공간을 향하게 한다.",
      en: "Place the subject at a one-third point at a readable scale and preserve the opposite side as one stable edit-ready field of color, light, and depth. Keep unnecessary props, invented text, and bright distractions out of the space, and direct gaze or movement into it."
    },
    "cinematic-haze": {
      ko: "헤이즈는 전경보다 중·배경에 얇게 축적해 깊이를 만들고, 빛줄기는 실제 광원 방향과 장애물 틈에 맞게 나타나게 한다. 얼굴 대비와 검정 기준점은 유지하며 화면 전체를 우윳빛 안개로 덮지 않는다.",
      en: "Accumulate thin haze mainly in the middle and background to create depth, and let light shafts follow actual source direction and openings between obstacles. Preserve facial contrast and a black point; do not cover the whole frame in milky fog."
    },
    "crisp-commercial": {
      ko: "광원 크기·방향·반사판 효과를 명확히 하고, 재질마다 선명도와 반사 정도를 다르게 표현한다. 과도한 HDR, 플라스틱 피부, 과한 샤프닝 없이 광고 촬영 수준의 깨끗한 마감을 만든다.",
      en: "Make source size, direction, and fill behavior explicit, giving each material distinct sharpness and reflectivity. Deliver a clean commercial finish without excessive HDR, plastic skin, or oversharpening."
    }
  };

  const categoryAcceptanceGuide = {
    profile: {
      ko: "성공 기준: 동일 인물로 즉시 식별되면서도 원본 복사본이 아니라 프리셋에 맞춰 새로 촬영한 프로필로 보여야 하며, 눈·피부·헤어·의상과 배경의 조명 논리가 일치해야 한다.",
      en: "Success criterion: the subject must be immediately recognizable yet read as a newly directed portrait rather than a copy of the source, with coherent light across eyes, skin, hair, wardrobe, and background."
    },
    editorial: {
      ko: "성공 기준: 첫눈에 인물의 서사와 주 시선점이 읽히고, 포즈·크롭·여백·의상·빛이 하나의 화보 아트디렉션으로 연결되어야 한다.",
      en: "Success criterion: the subject's narrative and primary focal point must read at first glance, with pose, crop, negative space, wardrobe, and light joined into one editorial art direction."
    },
    relationship: {
      ko: "성공 기준: 모든 인물이 정확히 한 번씩 독립적으로 식별되고, 관계가 자연스럽게 읽히며, 인물 사이에 얼굴·헤어·의상·신체 특징이 섞이지 않아야 한다.",
      en: "Success criterion: every person must appear exactly once and remain independently recognizable, the relationship must read naturally, and no face, hair, wardrobe, or body trait may transfer between people."
    },
    content: {
      ko: "성공 기준: 작은 썸네일 크기에서도 주인공과 핵심 행동이 즉시 읽히고, 후편집 영역과 배경 정보가 주 시선점을 방해하지 않아야 한다.",
      en: "Success criterion: the subject and key action must read immediately at thumbnail size, while edit-ready space and background information remain subordinate to the main focal point."
    },
    film: {
      ko: "성공 기준: 포즈를 취한 화보가 아니라 장면 전후가 상상되는 한 순간처럼 보여야 하며, 노출·입자·렌즈·움직임·공간광이 같은 촬영 조건에서 나온 것처럼 연결되어야 한다.",
      en: "Success criterion: the image must feel like one moment with an implied before and after rather than a posed editorial, with exposure, grain, lens behavior, motion, and environmental light arising from one capture logic."
    },
    art: {
      ko: "성공 기준: 선택한 재료와 제작 방식이 얼굴 주변의 필터가 아니라 실루엣·표면·윤곽·레이어 깊이 전체를 구성해야 하며, 인물 식별성은 유지되어야 한다.",
      en: "Success criterion: the chosen material and making process must construct silhouette, surface, edges, and layer depth rather than act as a filter around the face, while preserving recognizability."
    },
    character: {
      ko: "성공 기준: 얼굴 랜드마크로 원본 인물을 알아볼 수 있고, 머리부터 의상·신체 비율·표면·그림자까지 하나의 독창적인 캐릭터 설계 규칙을 따라야 한다.",
      en: "Success criterion: facial landmarks must preserve recognition, while hair, wardrobe, body proportion, surface, and shadow all follow one original character-design system."
    },
    sticker: {
      ko: "성공 기준: 지정된 수량과 배열이 정확하고 작은 크기에서도 각 표정·동작이 서로 다르게 읽히며, 모든 셀의 인물·비율·선·색·재질이 동일해야 한다.",
      en: "Success criterion: count and grid must be exact, every expression or action must remain distinct at small size, and identity, proportion, line, color, and material must stay consistent across cells."
    },
    fantasy: {
      ko: "성공 기준: 얼굴을 가리지 않고도 역할과 세계관이 의상·소품·환경·빛에서 즉시 읽혀야 하며, 기존 작품의 캐릭터나 문양을 복제하지 않아야 한다.",
      en: "Success criterion: role and world must read immediately through wardrobe, props, environment, and light without obscuring the face, and no character or insignia from an existing work may be copied."
    },
    timewarp: {
      ko: "성공 기준: 선택 시대가 의상·헤어·소품·재료·조명과 촬영 문법에서 일관되게 드러나고, 현대적 요소나 서로 다른 시대의 단서가 섞이지 않아야 한다.",
      en: "Success criterion: the selected era must remain coherent across wardrobe, hair, props, material, lighting, and image-making grammar, with no modern intrusion or mixed-period cues."
    },
    toy: {
      ko: "성공 기준: 사진 위에 장난감 효과를 입힌 모습이 아니라 두께·이음선·도색·재질·축척·접지 그림자로 실제 제작 가능한 수집 오브젝트처럼 보여야 한다.",
      en: "Success criterion: the result must read as a physically manufacturable collectible through thickness, seams, paint, material, scale, and contact shadow, not as a toy effect placed over a photograph."
    },
    meme: {
      ko: "성공 기준: 글자 설명 없이도 표정·행동·상황의 관계만으로 유머가 즉시 읽히고, 인물의 얼굴·손·신체와 장면 원근은 자연스러워야 한다.",
      en: "Success criterion: the humor must read instantly from expression, action, and situation without explanatory text, while face, hands, anatomy, and scene perspective remain natural."
    },
    fallback: {
      ko: "성공 기준: 프리셋에 명시된 핵심 재질·색·빛·구도 단서가 결과에서 각각 확인되고 하나의 일관된 시각 체계로 연결되어야 한다.",
      en: "Success criterion: every defining material, color, light, and composition cue named by the preset must be visible in the result and connected through one coherent visual system."
    }
  };

  function getExpansionDirectionId(preset) {
    const match = /^expanded-[^-]+-(.+)$/.exec(preset.id || "");
    return match ? match[1] : "";
  }

  function getPresetVisualSpecification(preset, language) {
    const isEnglish = language === "en";
    const categoryGuide = categoryVisualSystemGuide[preset.category] || categoryVisualSystemGuide.fallback;
    const acceptanceGuide = categoryAcceptanceGuide[preset.category] || categoryAcceptanceGuide.fallback;
    const directionId = getExpansionDirectionId(preset);
    const directionGuide = directionVisualSystemGuide[directionId];
    const presetGuide = isEnglish
      ? "Treat the selected preset's written concept as the art-direction source of truth. Convert every stated visual quality into observable choices for crop and subject scale, material construction, edge treatment, color hierarchy, light direction, spatial depth, and final finish. Do not leave a listed quality as a generic label or optional effect."
      : "선택한 프리셋의 서술을 아트디렉션의 단일 기준으로 삼는다. 명시된 모든 시각 특성을 크롭과 인물 크기, 재질 구조, 윤곽 처리, 색 위계, 빛의 방향, 공간 깊이와 최종 마감에서 실제로 보이는 선택으로 변환한다. 적힌 특성을 일반적인 라벨이나 선택적 효과로 남겨 두지 않는다.";
    const cohesionGuide = isEnglish
      ? "Build the selected look as a coherent construction system across the whole result. Do not add a generic texture, glow, or filter after the fact; every visible surface and edge must support the same material and lighting logic."
      : "선택한 느낌을 결과 전체에 걸친 일관된 제작 체계로 구현한다. 일반적인 질감·글로우·필터를 나중에 덧씌우지 말고, 보이는 모든 표면과 윤곽이 같은 재질·조명 원리를 뒷받침하게 한다.";
    const directionFallback = isEnglish
      ? "Distribute the preset's specific material, color, lighting, and composition cue intentionally across subject, wardrobe, and background instead of confining it to one decorative area."
      : "프리셋의 구체적인 재질·색·빛·구도 단서를 한 부분의 장식으로 가두지 말고 인물, 의상과 배경에 의도적으로 분배한다.";
    const shortDirectionGuide = directionId === "paper-tactile"
      ? (isEnglish
        ? "Build hanji and matte colored paper as three to five physical layers with clean cut edges and shallow contact shadows."
        : "한지와 무광 색지를 3~5개의 실제 레이어로 만들고, 깨끗한 칼선과 얕은 접지 그림자를 유지한다.")
      : (isEnglish
        ? "Apply the selected material, color, lighting, and composition cue across subject, wardrobe, and background."
        : "선택한 재질·색·빛·구도 단서를 인물, 의상과 배경 전체에 적용한다.");
    const categoryText = categoryGuide[language];
    const directionText = directionGuide?.[language] || directionFallback;
    const acceptanceText = acceptanceGuide[language];
    return {
      summary: isEnglish
        ? "Use the selected preset as the visual specification: make its named material, edge behavior, lighting, depth, and finish visibly specific. " + shortDirectionGuide + " " + acceptanceText
        : "선택한 프리셋을 시각 설계의 기준으로 삼아 재질, 윤곽 처리, 빛, 공간 깊이와 마감이 실제로 보이게 한다. " + shortDirectionGuide + " " + acceptanceText,
      lines: [presetGuide, categoryText, directionText, cohesionGuide, acceptanceText],
      previewLines: [categoryText, directionText, cohesionGuide, acceptanceText],
      acceptance: acceptanceText
    };
  }

  function getPresetTransformationInstructions(preset, language) {
    const isEnglish = language === "en";
    const isPet = preset.subjectType === "pet";
    const categoryGuide = categoryTransformationGuide[preset.category]?.[language]
      || categoryTransformationGuide.profile[language];
    const variationCue = preset.transformationCue?.[language] || "";
    const ownership = isPet
      ? (isEnglish
        ? "The pet photo controls only breed, facial markings, ear shape, natural fur color, eye color, body proportions, and unique identifying traits."
        : "반려동물 사진은 품종, 얼굴 무늬, 귀 모양, 자연 털색, 눈동자색, 체형과 고유 식별 특징만 결정한다.")
      : (isEnglish
        ? "Personal photos control only facial identity, skin tone, age range, and unique identifying traits."
        : "개인 사진은 얼굴 정체성, 피부색, 연령대와 고유 식별 특징만 결정한다.");
    const mutable = isPet
      ? (isEnglish
        ? "The preset controls expression and gaze, head and camera angle, pose and action, grooming and coat presentation, accessories, lighting, background, composition, and color grade. Do not copy these mutable traits from the source by default."
        : "표정과 시선, 고개와 카메라 각도, 포즈와 동작, 그루밍과 털 연출, 액세서리, 조명, 배경, 구도와 색보정은 프리셋이 결정한다. 이 변환 항목을 원본에서 습관적으로 복제하지 않는다.")
      : (isEnglish
        ? "The preset controls expression and gaze, head and camera angle, pose and gesture, hairstyle arrangement (part, volume, texture, and silhouette), wardrobe, lighting, background, composition, and color grade. Do not copy these mutable traits from the source by default."
        : "표정과 시선, 고개와 카메라 각도, 포즈와 제스처, 헤어 연출(가르마·볼륨·질감·실루엣), 의상, 조명, 배경, 구도와 색보정은 프리셋이 결정한다. 이 변환 항목을 원본에서 습관적으로 복제하지 않는다.");
    const verification = isPet
      ? (isEnglish
        ? "Visible transformation check: unless the preset explicitly requires a source trait, the result must visibly adopt the preset in at least four areas among expression/gaze, angle/framing, pose/action, coat or accessory styling, lighting/background, and color/material treatment."
        : "변환 확인: 프리셋이 원본 특성 유지를 명시한 경우를 제외하고, 표정·시선, 각도·프레이밍, 포즈·동작, 털·액세서리 연출, 조명·배경, 색·재질 중 최소 네 영역에서 프리셋의 변화가 분명히 보여야 한다.")
      : (isEnglish
        ? "Visible transformation check: unless the preset explicitly requires a source trait, the result must visibly adopt the preset in at least four areas among expression/gaze, angle/framing, pose/gesture, hair styling, wardrobe, lighting/background, and color/material treatment."
        : "변환 확인: 프리셋이 원본 특성 유지를 명시한 경우를 제외하고, 표정·시선, 각도·프레이밍, 포즈·제스처, 헤어 연출, 의상, 조명·배경, 색·재질 중 최소 네 영역에서 프리셋의 변화가 분명히 보여야 한다.");
    return {
      summary: [ownership, mutable, categoryGuide, variationCue, verification].filter(Boolean).join(" "),
      lines: [ownership, mutable, categoryGuide, variationCue, verification].filter(Boolean)
    };
  }

  const sourceGuide = {
    ko: {
      auto: "첨부한 모든 참조 이미지를 함께 분석한다. 각 사진에 등장하는 사람을 대조해 동일 인물이 여러 사진에 반복되면 하나의 인물로 통합하고, 서로 다른 인물만 A, B, C 순서의 최종 인물 명부로 정리한다. 개인사진은 해당 인물의 얼굴·헤어라인·자연 머리색·식별 특징을 정밀하게 판단하는 주 참조로, 단체사진은 인물 간 관계·체격 차이·원래 분위기를 판단하는 보조 참조로 사용한다.",
      group: "한 장의 단체 참조사진에 등장하는 서로 다른 인물을 빠짐없이 A, B, C 순서로 식별한다. 이 사진을 각 인물의 외형과 인물 간 관계·거리·체격 차이를 함께 판단하는 참조로 사용하되, 가려지거나 작게 나온 얼굴을 다른 사람의 특징으로 보완하지 않는다.",
      soloSet: "첨부 파일마다 한 명씩 등장한다. 파일 간 얼굴과 식별 특징을 대조해 같은 사람의 여러 사진이면 하나의 인물로 통합하고 여러 각도의 보완 참조로 사용한다. 서로 다른 사람이면 첨부 순서대로 A, B, C의 독립된 인물로 등록한다.",
      mixed: "단체사진과 개인사진을 함께 분석해 사진 전체에 등장하는 서로 다른 사람의 통합 명부를 만든다. 같은 사람이 반복된 사진은 하나의 인물로 연결한다. 개인사진을 얼굴·헤어라인·자연 머리색·피부색과 식별 특징의 주 참조로 사용하고, 단체사진은 관계·체격 차이·배치·공통 분위기의 참조로만 사용한다."
    },
    en: {
      auto: "Analyze all attached reference images together. Compare every visible person across files, merge repeated appearances of the same identity, and create one final roster of unique people labeled A, B, C in attachment order. Use solo photos as the primary references for facial structure, hairline, natural hair color, and identifying detail; use group photos as secondary references for relationships, relative build, and shared mood.",
      group: "Identify every unique person in the single group reference and label them A, B, C in visual order. Use this photo for both identity and relationship cues, but never fill an obscured or low-detail face with traits from another person.",
      soloSet: "Each attached file contains one person. Compare faces and identifying features across files. Merge multiple photos of the same person into one identity with complementary viewing angles; otherwise register each file as a separate person A, B, C in attachment order.",
      mixed: "Analyze the group and solo photos together and build one deduplicated roster of all unique people. Link repeated appearances to the same identity. Use solo photos as the primary references for facial structure, hairline, natural hair color, skin tone, and identifying traits, and use group photos only for relationships, relative build, arrangement, and shared mood."
    }
  };

  const peopleGuide = {
    ko: {
      auto: "모든 첨부사진을 합쳐 서로 다른 인물의 수를 정확히 센다. 동일 인물의 반복 사진은 한 명으로 계산하고, 최종 인물 명부의 각 사람은 결과에 정확히 한 번씩 포함한다.",
      single: "최종 인물은 1명이다. 여러 참조사진이 같은 사람을 보여주면 하나의 정체성으로 결합하고 다른 사람을 추가하지 않는다.",
      pair: "최종 인물은 서로 다른 2명이다. 두 사람을 A와 B로 독립적으로 관리하고 어느 결과에서도 누락·중복·특징 교환이 없게 한다.",
      smallGroup: "최종 인물은 서로 다른 3~5명이다. 각 인물을 독립된 정체성으로 관리하고 모든 사람을 정확히 한 번씩 포함한다.",
      largeGroup: "최종 인물은 서로 다른 6명 이상이다. 먼저 전체 명부와 인원수를 확정하고, 식별 가능한 모든 사람을 누락·중복 없이 정확히 한 번씩 포함한다."
    },
    en: {
      auto: "Count the unique people across all attached photos. Treat repeated photos of the same person as one identity, and include every person in the final deduplicated roster exactly once in the result.",
      single: "The final roster contains one person. Merge multiple references of that same person into one identity and add nobody else.",
      pair: "The final roster contains exactly two distinct people, A and B. Keep both identities independent with no omission, duplication, or trait transfer.",
      smallGroup: "The final roster contains 3–5 distinct people. Keep each identity independent and include every person exactly once.",
      largeGroup: "The final roster contains 6 or more distinct people. Confirm the roster and headcount first, then include every recognizable person exactly once without omission or duplication."
    }
  };

  const backgroundGuide = {
    ko: {
      delegate: "배경은 선택한 콘셉트와 인물의 분위기에 가장 잘 맞는 장면을 스스로 선택하되, 인물보다 시선을 끌지 않게 구성한다.",
      simple: "배경은 군더더기 없는 단색 또는 매우 부드러운 그러데이션으로 정리한다.",
      studio: "배경은 실제 전문 사진 스튜디오의 심리스 페이퍼와 자연스러운 접지 그림자로 구성한다.",
      location: "배경은 깊이와 생활감이 있는 현실적인 공간으로 만들고 조명 방향과 원근을 인물에 정확히 맞춘다.",
      keep: "원본 사진의 장소와 배경 구조를 유지하되 산만한 요소만 정돈하고 인물과 배경의 조명 일관성을 보정한다."
    },
    en: {
      delegate: "Choose a setting that best fits the selected concept and the subject's mood, while keeping the background visually secondary to the person.",
      simple: "Use an uncluttered solid backdrop or a very subtle gradient.",
      studio: "Use a believable professional photo studio with seamless paper and a natural contact shadow.",
      location: "Create a realistic location with depth and lived-in detail, matching perspective and light direction precisely to the subject.",
      keep: "Preserve the original location and background structure, only removing distractions and correcting lighting consistency between subject and environment."
    }
  };

  const collageGuide = {
    ko: {
      layout: { auto: "인원수와 화면비에 맞는 가장 읽기 쉬운 패널 배열을 선택한다", equal: "모든 인물이 같은 크기의 동일 비중 그리드를 사용한다", hero: "첫 번째 인물을 큰 대표 패널에 두고 나머지는 작은 독립 패널에 균형 있게 배치한다", horizontal: "인물 패널을 왼쪽에서 오른쪽으로 이어지는 가로 배열로 구성한다", vertical: "인물 패널을 위에서 아래로 이어지는 세로 배열로 구성한다", modular: "크기가 다른 사각 패널을 정돈된 매거진 모듈처럼 구성한다", photobooth: "인물 패널을 포토부스 스트립처럼 연속 배치한다" },
      gap: { tight: "패널 간격은 좁고 단정하게 유지한다", normal: "패널 사이에 균형 잡힌 여백을 둔다", wide: "패널마다 넉넉한 여백을 두어 독립성을 강조한다" },
      background: { unified: "모든 패널은 하나의 색상·조명·배경 체계를 공유한다", varied: "각 패널의 배경은 인물별로 변주하되 전체 팔레트와 조명 방향은 통일한다" }
    },
    en: {
      layout: { auto: "choose the clearest panel arrangement for the detected headcount and requested aspect ratio", equal: "use an equal-size grid with identical visual weight for every person", hero: "place the first person in a larger hero panel and balance everyone else in smaller independent panels", horizontal: "arrange the portrait panels in a left-to-right horizontal sequence", vertical: "arrange the portrait panels in a top-to-bottom vertical sequence", modular: "use a refined editorial modular layout with varied rectangular panel sizes", photobooth: "arrange the portrait panels as a continuous photobooth strip" },
      gap: { tight: "keep panel gaps narrow and precise", normal: "use balanced breathing room between panels", wide: "use generous panel spacing to emphasize each identity" },
      background: { unified: "share one color, lighting, and background system across every panel", varied: "vary each panel background while keeping the overall palette and light direction coherent" }
    }
  };

  const purposeLabels = { all: "전체 용도", career: "커리어·브랜딩", social: "SNS·프로필", family: "가족·관계", team: "팀·단체", gift: "선물·기념", content: "콘텐츠·홍보", avatar: "캐릭터·아바타", sticker: "스티커·이모티콘", play: "재미·놀이" };
  const peopleLabels = { auto: "자동 인원", single: "1명", pair: "2명", smallGroup: "3~5명", largeGroup: "6명 이상", all: "모든 인원" };
  const outputModeLabels = {
    scene: "한 장면에 함께 배치",
    collage: "인물별 콜라주 한 장",
    individual: "인물마다 별도 이미지",
    fixed: "프리셋 전용 시트"
  };
  const individualOutputCategories = new Set(["profile", "character", "toy", "art"]);
  const collageSignalPattern = /콜라주|그리드|보드|이어북|연감|스트립|시트|collage|grid|board|yearbook|strip|sheet/i;

  function isFixedSheetPreset(preset) {
    return preset?.outputType === "stickerPack" || preset?.outputType === "animatedSprite";
  }

  function getPresetFormatHint(preset) {
    if (!isFixedSheetPreset(preset)) return "";
    const format = preset.outputType === "animatedSprite" ? "스프라이트 시트" : "스티커 시트";
    return `${preset.grid ? `${preset.grid} ` : ""}${format} · ${preset.ratios[0] || "1:1"} 권장`;
  }

  function resolveOutputMode(preset) {
    if (isFixedSheetPreset(preset)) return "fixed";
    if (elements.outputMode.value !== "auto") return elements.outputMode.value;
    if (elements.people.value === "single") return "scene";
    const presetText = [preset?.title, preset?.description, preset?.ko, preset?.en].filter(Boolean).join(" ");
    if (collageSignalPattern.test(presetText)) return "collage";
    if (state.purpose === "family" || state.purpose === "team") return "scene";
    if (state.purpose === "career" || state.purpose === "avatar") return "individual";
    if (individualOutputCategories.has(preset?.category)) return "individual";
    return "scene";
  }

  function getOutputReason(preset, mode) {
    if (mode === "fixed") return "이 프리셋은 스티커·애니메이션 제작용 시트 구성을 사용합니다.";
    if (elements.outputMode.value !== "auto") return "직접 선택: " + outputModeLabels[mode];
    if (elements.people.value === "single") return "자동 결정: 최종 인물 1명이므로 완성 이미지 1장";
    if (mode === "collage") return "자동 결정: 선택한 스타일의 콜라주·그리드 성격을 반영";
    if (mode === "individual") return "자동 결정: 프로필·캐릭터 또는 개인 중심 용도를 반영";
    return "자동 결정: 가족·팀·관계 또는 장면 중심 스타일을 반영";
  }

  function updateOutputModeUi(preset = null) {
    const mode = resolveOutputMode(preset);
    if (elements.outputHint) {
      elements.outputHint.textContent = elements.outputMode.value === "auto" && !preset
        ? "프롬프트 복사 시 해당 카드의 스타일과 용도에 맞춰 결과 구성을 결정합니다."
        : getOutputReason(preset, mode);
    }
    if (elements.collageOptions) {
      elements.collageOptions.classList.toggle("is-collapsed", mode !== "collage");
    }
  }


  function createPortraitSvg() {
    return `
      <svg class="pt-card-portrait" viewBox="0 0 180 220" aria-hidden="true">
        <path class="pt-portrait-highlight" d="M28 211c4-53 25-79 62-79s58 26 62 79H28Z"/>
        <path class="pt-portrait-body" d="M38 220c2-49 18-75 52-75s50 26 52 75H38Z"/>
        <path class="pt-portrait-hair" d="M53 72c0-38 19-57 39-57 30 0 44 22 41 63l-9 10H62l-9-16Z"/>
        <ellipse class="pt-portrait-head" cx="92" cy="82" rx="36" ry="45"/>
        <path class="pt-portrait-hair" d="M58 66c4-32 18-46 38-46 23 0 35 15 37 42-17-4-31-14-40-27-7 16-18 26-35 31Z"/>
        <path d="M77 82c4-3 8-3 12 0M101 82c4-3 8-3 12 0" fill="none" stroke="rgba(43,31,28,.65)" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M84 103c6 4 12 4 18 0" fill="none" stroke="rgba(106,50,46,.58)" stroke-width="2.4" stroke-linecap="round"/>
      </svg>`;
  }

  function createOverlay(type) {
    if (type === "noise") return '<span class="pt-card-noise" aria-hidden="true"></span>';
    if (type === "grid") return '<span class="pt-card-grid-lines" aria-hidden="true"></span>';
    return '<span class="pt-card-frame" aria-hidden="true"></span>';
  }

  function updateCollageVisibility() {
    updateOutputModeUi();
  }

  function isPresetCompatible(preset) {
    const people = elements.people.value;
    return people === "auto" || preset.peopleFit.includes(people) || preset.peopleFit.includes("all");
  }

  function presetScore(preset) {
    let score = 0;
    if (state.purpose !== "all" && preset.purposes.includes(state.purpose)) score += 5;
    if (elements.people.value === "auto" || preset.peopleFit.includes(elements.people.value) || preset.peopleFit.includes("all")) score += 3;
    if (state.favoriteIds.has(preset.id)) score += 1;
    return score;
  }

  function createCard(preset, index) {
    const savedPreview = state.savedPreviews.get(preset.id) || "";
    const previewState = state.previewStates.get(preset.id) || "";
    const card = document.createElement("article");
    card.className = `pt-style-card${previewState === "loading" ? " is-preview-loading" : ""}${savedPreview ? " has-generated-preview" : ""}`;
    card.dataset.presetId = preset.id;
    card.style.setProperty("--pt-card-bg", preset.palette.bg);
    card.style.setProperty("--pt-card-accent", preset.palette.accent);
    card.style.setProperty("--pt-card-accent-2", preset.palette.accent2);
    card.style.setProperty("--pt-card-ink", preset.palette.ink);
    card.style.setProperty("--pt-skin", preset.palette.skin);
    const isFavorite = state.favoriteIds.has(preset.id);
    const compatible = isPresetCompatible(preset);
    const formatHint = getPresetFormatHint(preset);
    card.classList.toggle("is-incompatible", !compatible);
    card.innerHTML = `
      <div class="pt-card-visual">
        <img class="pt-card-generated-preview" alt="${escapeHtml(preset.title)} 자동 생성 미리보기" loading="lazy" hidden>
        ${createPortraitSvg()}
        ${createOverlay(preset.overlay)}
        <span class="pt-card-preview-loading">자동 생성 중</span>
        <span class="pt-card-index">${String(index + 1).padStart(2, "0")}</span>
        <span class="pt-card-trend">${escapeHtml(preset.trend)}</span>
        <span class="pt-card-caption"><strong>${escapeHtml(preset.caption)}</strong><span>PHOTO DECK</span></span>
        <button type="button" class="pt-card-favorite${isFavorite ? " is-active" : ""}" data-favorite-preset="${escapeHtml(preset.id)}" aria-pressed="${isFavorite}" aria-label="${escapeHtml(preset.title)} 즐겨찾기">${isFavorite ? "★" : "☆"}</button>
      </div>
      <div class="pt-card-body">
        <div class="pt-card-meta"><span class="pt-card-category">${escapeHtml(preset.categoryLabel.toUpperCase())}</span>${formatHint ? `<span class="pt-card-format-hint">${escapeHtml(formatHint)}</span>` : ""}</div>
        <h3>${escapeHtml(preset.title)}</h3>
        <p>${escapeHtml(preset.description)}</p>
        <div class="pt-card-tags">${preset.tags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("")}</div>
        <div class="pt-card-fit"><span>${compatible ? "현재 조건 적합" : "조건 조정 필요"}</span><span>${escapeHtml(preset.peopleFit.map((item) => peopleLabels[item] || item).join(" · "))}</span></div>
        <div class="pt-card-actions">
          <button type="button" class="pt-card-copy pt-card-copy-ko" data-copy-preset="${escapeHtml(preset.id)}" data-copy-language="ko" aria-label="${escapeHtml(preset.title)} 한글 프롬프트 복사">한글 복사</button>
          <button type="button" class="pt-card-copy" data-copy-preset="${escapeHtml(preset.id)}" data-copy-language="en" aria-label="${escapeHtml(preset.title)} 영문 프롬프트 복사">영문 복사</button>
          <button type="button" class="pt-card-clone" data-clone-preset="${escapeHtml(preset.id)}" aria-label="${escapeHtml(preset.title)} 스타일 복제">스타일 복제</button>
        </div>
        ${preset.isUserPreset ? `<button type="button" class="pt-card-delete-user" data-delete-user-preset="${escapeHtml(preset.id)}">내 프리셋 삭제</button>` : ""}
      </div>`;
    if (savedPreview) {
      const image = card.querySelector(".pt-card-generated-preview");
      image.addEventListener("load", () => card.classList.add("has-generated-preview"), { once: true });
      image.addEventListener("error", () => card.classList.remove("has-generated-preview"), { once: true });
      image.src = savedPreview;
      image.hidden = false;
      if (image.complete && image.naturalWidth > 0) card.classList.add("has-generated-preview");
    }
    return card;
  }

  function getFilteredPresets() {
    const query = state.query.trim().toLocaleLowerCase("ko-KR");
    const filtered = presets.filter((preset) => {
      if (state.category !== "all" && preset.category !== state.category) return false;
      if (state.purpose !== "all" && !preset.purposes.includes(state.purpose)) return false;
      if (state.compatibleOnly && !isPresetCompatible(preset)) return false;
      if (state.favoritesOnly && !state.favoriteIds.has(preset.id)) return false;
      if (!query) return true;
      const haystack = [preset.title, preset.categoryLabel, preset.description, ...preset.tags].join(" ").toLocaleLowerCase("ko-KR");
      return haystack.includes(query);
    });
    return sortPresets(filtered);
  }

  function sortPresets(list) {
    if (state.sort === "default") return list;
    const sorted = [...list];
    if (state.sort === "recommended") {
      sorted.sort((a, b) => presetScore(b) - presetScore(a) || a.title.localeCompare(b.title, "ko"));
    } else if (state.sort === "favorite") {
      sorted.sort((a, b) => Number(state.favoriteIds.has(b.id)) - Number(state.favoriteIds.has(a.id)) || a.title.localeCompare(b.title, "ko"));
    } else if (state.sort === "name") {
      sorted.sort((a, b) => a.title.localeCompare(b.title, "ko"));
    }
    return sorted;
  }

  function renderFilters() {
    elements.filters.replaceChildren();
    categories.forEach((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `pt-filter-chip${state.category === category.id ? " active" : ""}`;
      button.textContent = category.label;
      button.dataset.category = category.id;
      button.setAttribute("aria-pressed", state.category === category.id ? "true" : "false");
      elements.filters.appendChild(button);
    });
  }

  function renderGallery() {
    const filtered = getFilteredPresets();
    const filterKey = JSON.stringify([
      state.category,
      state.query.trim(),
      state.purpose,
      state.sort,
      state.compatibleOnly,
      state.favoritesOnly,
      elements.people.value,
    ]);
    if (state.galleryFilterKey !== filterKey) {
      state.galleryFilterKey = filterKey;
      state.galleryLimit = getGalleryPageSize();
    }
    const visible = filtered.slice(0, state.galleryLimit);
    elements.gallery.replaceChildren(...visible.map((preset) => createCard(preset, presets.indexOf(preset))));
    elements.resultCount.textContent = filtered.length === presets.length
      ? String(filtered.length)
      : `${filtered.length} / ${presets.length}`;
    const remaining = Math.max(0, filtered.length - visible.length);
    elements.galleryMore.hidden = remaining === 0;
    if (remaining > 0) {
      elements.galleryMoreButton.textContent = `스타일 ${Math.min(MOBILE_GALLERY_PAGE_SIZE, remaining)}개 더 보기`;
      elements.galleryMoreStatus.textContent = `현재 ${visible.length}/${filtered.length}개 표시`;
    }
    elements.empty.hidden = filtered.length !== 0;
  }

  function getEnglishPresetTitle(preset) {
    if (preset.enTitle) return preset.enTitle;
    if (preset.isUserPreset) return "Custom Photo Transformation";
    const abbreviations = { "3d": "3D", ai: "AI", sns: "SNS", y2k: "Y2K" };
    return preset.id
      .split("-")
      .map((word) => abbreviations[word] || `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
      .join(" ");
  }

  function markdownSection(title, items) {
    const lines = items
      .filter(Boolean)
      .flatMap((item) => String(item).split(/\r?\n/))
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `- ${line}`);
    return [`## ${title}`, ...lines];
  }

  function markdownPrompt(title, intro, sections) {
    return [
      `# ${title}`,
      "",
      `> ${intro}`,
      "",
      ...sections.flatMap((section, index) => index === sections.length - 1 ? section : [...section, ""])
    ].join("\n");
  }

  function buildStickerPrompt(preset, language, identity, ratio, extra, strength) {
    const animated = preset.outputType === "animatedSprite";
    const itemCount = animated ? preset.frameCount : preset.itemCount;
    const isEnglish = language === "en";
    const transformation = getPresetTransformationInstructions(preset, language);
    const visualSpecification = getPresetVisualSpecification(preset, language);
    const title = isEnglish ? `Photo transformation prompt — ${getEnglishPresetTitle(preset)}` : `사진 변환 프롬프트 — ${preset.title}`;
    const intro = isEnglish
      ? "Use the attached photo as the sole identity reference and create a production-ready sticker source sheet."
      : "첨부한 사진을 유일한 외형 참조 이미지로 사용해 실제 제작에 활용할 수 있는 스티커 원본 시트를 만들어 주세요.";
    const identityLine = preset.subjectType === "pet"
      ? (isEnglish ? "Appearance consistency: preserve the same animal's breed, facial markings, ear shape, fur colors, eye colors, body proportions, and recognizable expression in every sticker." : "외형 일관성: 모든 스티커에서 동일한 반려동물로 보이도록 품종, 얼굴 무늬, 귀 모양, 털색, 눈동자, 신체 비율과 알아볼 수 있는 인상을 유지한다.")
      : (isEnglish ? `Identity consistency: ${identity}` : `인물 일관성: ${identity}`);
    const sheetGuide = animated
      ? (isEnglish
        ? `Create exactly ${itemCount} sequential animation frames in one ${preset.grid} sprite sheet, ordered left to right and then top to bottom. Every cell must have exactly the same canvas size, character scale, camera angle, baseline, lighting, colors, outline, and empty margin. Show one small motion step per cell with no missing, duplicated, or out-of-order frame. The last frame must transition seamlessly back to the first without repeating the first frame.`
        : `정확히 ${itemCount}개의 연속 애니메이션 프레임을 ${preset.grid} 스프라이트 시트 한 장에 배치하고 왼쪽에서 오른쪽, 위에서 아래 순서로 진행한다. 모든 셀의 캔버스 크기, 캐릭터 크기, 카메라 각도, 기준선, 조명, 색상, 외곽선과 빈 여백을 완전히 동일하게 유지한다. 셀마다 한 단계씩만 움직이며 누락·중복·순서 오류가 없어야 한다. 마지막 프레임은 첫 프레임을 그대로 반복하지 않으면서 첫 동작으로 매끄럽게 이어져야 한다.`)
      : (isEnglish
        ? `Create exactly ${itemCount} distinct stickers in one ${preset.grid} source sheet. Place one complete sticker in each equal cell with consistent scale and generous safe padding. Keep every sticker isolated, centered, fully visible, and non-overlapping, with a clean thick white die-cut outline unless the concept specifies otherwise.`
        : `정확히 ${itemCount}개의 서로 다른 스티커를 ${preset.grid} 원본 시트 한 장에 배치한다. 같은 크기의 각 셀에 완성된 스티커 하나씩을 일관된 크기와 넉넉한 안전 여백으로 넣는다. 모든 스티커는 서로 겹치지 않게 분리하고 중앙에 완전히 보이게 배치하며, 콘셉트에 다른 지시가 없다면 깔끔하고 두꺼운 흰색 다이컷 외곽선을 적용한다.`);
    const background = isEnglish
      ? "Use a true transparent RGBA background if supported. Otherwise use one perfectly uniform removable white background with no texture, environment, horizon, border, grid lines, or cast shadow beyond each sticker's subtle edge shadow."
      : "지원된다면 진짜 투명 RGBA 배경을 사용한다. 투명 배경을 지원하지 않으면 질감·공간·수평선·테두리·격자선이 전혀 없는 완전 균일한 흰색 제거용 배경을 사용하며, 스티커 가장자리의 약한 그림자 외에는 배경 그림자를 만들지 않는다.";
    const output = isEnglish
      ? `Output one ${ratio} source sheet at the highest available resolution. Do not add speech bubbles, captions, letters, numbers, logos, signatures, watermarks, cell labels, mockups, hands holding stickers, cropped parts, duplicate characters, extra limbs, or malformed hands.`
      : `${ratio} 화면비의 원본 시트 한 장을 가능한 최고 해상도로 출력한다. 말풍선, 캡션, 글자, 숫자, 로고, 서명, 워터마크, 셀 번호, 목업, 스티커를 들고 있는 손, 잘린 신체, 중복 캐릭터, 추가 팔다리, 비정상적인 손을 만들지 않는다.`;
    const verification = animated
      ? (isEnglish ? "Before finalizing, compare adjacent cells: only the intended motion may change. Verify identity, costume, proportions, line weight, color, and background remain locked in every frame." : "완성 전에 인접 셀을 비교해 의도한 동작만 달라지는지 확인한다. 모든 프레임에서 얼굴, 의상, 비율, 선 굵기, 색상과 배경이 고정되어 있는지 검수한다.")
      : (isEnglish ? "Before finalizing, count every sticker and verify each expression or action is clearly different while the same identity and design system remain consistent." : "완성 전에 스티커 수를 세고, 동일한 인물과 디자인 체계를 유지하면서 각 표정 또는 행동이 분명히 다른지 검수한다.");
    if (strength === "short") {
      return markdownPrompt(title, intro, [
        markdownSection(isEnglish ? "1. Transformation target" : "1. 변환 목표", [
          isEnglish ? preset.en : preset.ko,
          `${isEnglish ? "Preset-directed transformation" : "프리셋 지시 변환"}: ${transformation.summary}`,
          `${isEnglish ? "Preset visual specification" : "프리셋 시각 설계"}: ${visualSpecification.summary}`
        ]),
        markdownSection(isEnglish ? "2. Identity and sheet" : "2. 인물 및 시트 구성", [identityLine, sheetGuide]),
        markdownSection(isEnglish ? "3. Background and output rules" : "3. 배경 및 출력 규칙", [background, output]),
        markdownSection(isEnglish ? "4. Output verification" : "4. 출력 전 확인", [verification]),
        ...(extra ? [markdownSection(isEnglish ? "5. Additional request" : "5. 추가 요청", [extra])] : [])
      ]);
    }

    const verificationItems = [verification, visualSpecification.acceptance];
    if (strength === "strict") {
      verificationItems.push(
        isEnglish
          ? "Preset-match verification: compare the finished sheet against every explicit cue in the selected preset. Reject and correct any result that reduces the preset to a generic filter, omits its defining material, edge, light, composition, or finish, or applies the design system inconsistently across cells."
          : "프리셋 일치 검수: 완성 시트를 선택한 프리셋의 명시적 단서와 하나씩 대조한다. 프리셋을 일반 필터로 축소했거나 핵심 재질·윤곽·빛·구도·마감을 누락했거나 셀마다 디자인 체계가 달라졌다면 수정한 뒤 다시 출력한다.",
        isEnglish
          ? "Reject and correct any sheet with inconsistent identity, merged cells, uneven frame sizes, clipped outlines, accidental text, or a motion jump that breaks the loop."
          : "인물 불일치, 셀 병합, 서로 다른 프레임 크기, 잘린 외곽선, 의도하지 않은 글자, 루프를 끊는 급격한 동작 변화가 있으면 수정한 뒤 다시 출력한다."
      );
    }

    return markdownPrompt(title, intro, [
      markdownSection(isEnglish ? "1. Preset concept" : "1. 프리셋 콘셉트", [isEnglish ? preset.en : preset.ko]),
      markdownSection(isEnglish ? "2. Preset-directed transformation" : "2. 프리셋 지시 변환", transformation.lines),
      markdownSection(isEnglish ? "3. Preset visual specification" : "3. 프리셋 시각 설계", visualSpecification.lines),
      markdownSection(isEnglish ? "4. Identity consistency" : "4. 인물 일관성", [identityLine]),
      markdownSection(isEnglish ? "5. Sheet layout" : "5. 시트 구성", [sheetGuide]),
      markdownSection(isEnglish ? "6. Background and cutout" : "6. 배경 및 누끼", [background]),
      markdownSection(isEnglish ? "7. Output rules" : "7. 출력 규칙", [output]),
      ...(extra ? [markdownSection(isEnglish ? "8. Additional request" : "8. 추가 요청", [extra])] : []),
      markdownSection(
        isEnglish ? `${extra ? "9" : "8"}. Final verification checklist` : `${extra ? "9" : "8"}. 최종 검수 체크리스트`,
        verificationItems
      )
    ]);
  }

  function getCompositionInstructions(preset, language, ratio, collage) {
    const mode = resolveOutputMode(preset);
    if (language === "en") {
      if (mode === "collage") {
        return {
          mode,
          instruction: "Create one independent portrait panel for every unique person in the final roster and show each person exactly once. Collage direction: " + collage + ". Keep one coherent visual style, color grade, lighting logic, spacing, and background system across all panels. Adapt the grid to the requested aspect ratio without cropping out a person.",
          output: "Deliver one finished " + ratio + " collage image, not separate image files.",
          verification: "Verify that every rostered identity appears in exactly one panel and that the panel layout, spacing, and background rules are followed."
        };
      }
      if (mode === "individual") {
        return {
          mode,
          instruction: "Create one separate completed image for each unique person in the final roster. Apply the same selected style, camera logic, color grade, lighting quality, and background system to the full set. Each image must contain only its assigned person. Do not combine the people into a shared scene, grid, contact sheet, or collage.",
          output: "Deliver one finished " + ratio + " image per unique person. The output count must equal the final roster count. If only one image can be generated at a time, produce the people sequentially in roster order A, B, C without changing the design system.",
          verification: "Compare the separate outputs as a set. Verify that each unique identity receives exactly one image and that no traits from another person appear in it."
        };
      }
      return {
        mode,
        instruction: "Place every unique person from the final roster together in one coherent shared scene. Preserve each identity independently, maintain believable relative build and personal space, and create natural gaze, interaction, lighting, perspective, and contact shadows. Do not split the result into portrait panels or a collage.",
        output: "Deliver one finished " + ratio + " shared-scene image containing every rostered person exactly once.",
        verification: "Verify that the shared scene includes every rostered identity exactly once with believable interaction and no merged faces or bodies."
      };
    }

    if (mode === "collage") {
      return {
        mode,
        instruction: "최종 인물 명부의 각 사람마다 독립된 포트레이트 패널을 하나씩 만들고 모든 인물을 정확히 한 번씩 배치한다. 콜라주 세부 지시: " + collage + ". 모든 패널에 동일한 시각 스타일, 색보정, 조명 원리, 간격과 배경 체계를 적용하고, 요청한 화면비 안에서 어느 인물도 잘리지 않도록 그리드를 조정한다.",
        output: ratio + " 화면비의 완성된 콜라주 이미지 한 장으로 출력하며 여러 개의 개별 파일로 나누지 않는다.",
        verification: "최종 명부의 각 인물이 정확히 하나의 패널에만 등장하고 지정한 레이아웃·간격·배경 규칙이 지켜졌는지 확인한다."
      };
    }
    if (mode === "individual") {
      return {
        mode,
        instruction: "최종 인물 명부의 각 사람마다 완성 이미지 한 장씩을 별도로 만든다. 전체 이미지 세트에 동일한 스타일, 카메라 원리, 색보정, 조명 품질과 배경 체계를 적용한다. 각 이미지에는 배정된 인물 한 명만 등장시킨다. 여러 사람을 한 장면, 그리드, 콘택트시트 또는 콜라주로 합치지 않는다.",
        output: "서로 다른 인물마다 " + ratio + " 화면비의 완성 이미지 한 장씩을 출력하며, 결과 이미지 수는 최종 인물 수와 같아야 한다. 한 번에 한 장만 생성할 수 있다면 A, B, C 명부 순서대로 동일한 디자인 체계를 유지해 연속 생성한다.",
        verification: "개별 결과를 하나의 세트로 비교해 각 인물이 정확히 한 장씩 배정됐고 다른 사람의 특징이 섞이지 않았는지 확인한다."
      };
    }
    return {
      mode,
      instruction: "최종 인물 명부의 모든 사람을 하나의 일관된 장면에 함께 배치한다. 각 정체성을 독립적으로 보존하고 현실적인 체격 차이와 개인 간 거리를 유지하며, 자연스러운 시선·상호작용·조명·원근·접지 그림자를 만든다. 인물을 포트레이트 패널이나 콜라주로 분리하지 않는다.",
      output: "최종 명부의 모든 인물이 정확히 한 번씩 포함된 " + ratio + " 화면비의 완성된 통합 장면 한 장을 출력한다.",
      verification: "통합 장면에 최종 명부의 모든 인물이 정확히 한 번씩 등장하고 얼굴이나 신체가 합쳐지지 않았으며 상호작용이 자연스러운지 확인한다."
    };
  }

  function buildPrompt(preset, languageOverride) {
    const language = languageOverride === "en" || languageOverride === "ko"
      ? languageOverride
      : (elements.language.value === "en" ? "en" : "ko");
    const identity = (identityGuide[elements.identity.value] || identityGuide.balanced)[language];
    const source = sourceGuide[language][elements.sourceStructure.value];
    const people = peopleGuide[language][elements.people.value];
    const background = backgroundGuide[language][elements.background.value];
    const ratio = elements.ratio.value;
    const extra = elements.extra.value.trim();
    const strength = elements.strength.value;
    const collage = [collageGuide[language].layout[elements.collageLayout.value], collageGuide[language].gap[elements.collageGap.value], collageGuide[language].background[elements.collageBackground.value]].join(language === "en" ? "; " : ". ");

    if (isFixedSheetPreset(preset)) {
      return buildStickerPrompt(preset, language, identity, ratio, extra, strength);
    }

    const composition = getCompositionInstructions(preset, language, ratio, collage);
    const isEnglish = language === "en";
    const transformation = getPresetTransformationInstructions(preset, language);
    const visualSpecification = getPresetVisualSpecification(preset, language);
    const intro = isEnglish
      ? "Use all attached personal photos as identity references and transform the deduplicated roster into the following new image set."
      : "첨부한 모든 개인 사진을 인물 참조 자료로 사용해 중복을 제거한 최종 인물 명부를 아래 콘셉트의 새 이미지로 변환해 주세요.";
    const documentTitle = isEnglish ? `Photo transformation prompt — ${getEnglishPresetTitle(preset)}` : `사진 변환 프롬프트 — ${preset.title}`;
    const style = isEnglish ? preset.en : preset.ko;
    const qualityRule = isEnglish
      ? "Keep faces, bodies, clothing, lighting, perspective, and background coherent. Keep hands and visible anatomy natural. Preserve refined detail without plastic skin, excessive sharpening, or uncanny symmetry. Do not add captions, watermarks, signatures, logos, or unintended text."
      : "얼굴, 신체, 의상, 조명, 원근과 배경을 일관되게 표현한다. 보이는 손과 신체 구조는 자연스럽게 만들고 플라스틱 같은 피부, 과도한 선명화, 부자연스러운 좌우대칭을 피한다. 캡션, 워터마크, 서명, 로고, 의도하지 않은 글자를 추가하지 않는다.";

    if (strength === "short") {
      return markdownPrompt(documentTitle, intro, [
        markdownSection(isEnglish ? "1. Transformation target" : "1. 변환 목표", [
          style,
          (isEnglish ? "Preset-directed transformation: " : "프리셋 지시 변환: ") + transformation.summary,
          (isEnglish ? "Preset visual specification: " : "프리셋 시각 설계: ") + visualSpecification.summary
        ]),
        markdownSection(isEnglish ? "2. References and identity" : "2. 참조 사진 및 인물 보존", [
          (isEnglish ? "Reference interpretation: " : "참조 사진 해석: ") + source,
          (isEnglish ? "Final roster: " : "최종 인물 명부: ") + people,
          (isEnglish ? "Identity fidelity: " : "인물 보존: ") + identity
        ]),
        markdownSection(isEnglish ? "3. Composition and output" : "3. 결과 구성 및 출력", [
          (isEnglish ? "Result composition: " : "결과 구성: ") + composition.instruction,
          composition.output,
          (isEnglish ? "Background: " : "배경: ") + background
        ]),
        markdownSection(isEnglish ? "4. Quality rules" : "4. 품질 규칙", [qualityRule]),
        ...(extra ? [markdownSection(isEnglish ? "5. Additional request" : "5. 추가 요청", [extra])] : [])
      ]);
    }

    const sections = [
      markdownSection(isEnglish ? "1. Preset concept" : "1. 프리셋 콘셉트", [style]),
      markdownSection(isEnglish ? "2. Preset-directed transformation" : "2. 프리셋 지시 변환", transformation.lines),
      markdownSection(isEnglish ? "3. Preset visual specification" : "3. 프리셋 시각 설계", visualSpecification.lines),
      markdownSection(isEnglish ? "4. Reference interpretation and identity roster" : "4. 참조 사진 해석 및 인물 명부", [source, people]),
      markdownSection(isEnglish ? "5. Identity fidelity" : "5. 인물 보존", [identity]),
      markdownSection(isEnglish ? "6. Result composition" : "6. 결과 구성", [composition.instruction, composition.output]),
      markdownSection(isEnglish ? "7. Background" : "7. 배경", [background]),
      markdownSection(isEnglish ? "8. Quality and exclusions" : "8. 품질 및 제외 사항", [qualityRule]),
      ...(extra ? [markdownSection(isEnglish ? "9. Additional request" : "9. 추가 요청", [extra])] : []),
      markdownSection(isEnglish ? `${extra ? "10" : "9"}. Output verification` : `${extra ? "10" : "9"}. 출력 전 확인`, [composition.verification])
    ];
    if (strength === "strict") {
      sections.push(
        markdownSection(
          isEnglish ? `${extra ? "11" : "10"}. Final verification checklist` : `${extra ? "11" : "10"}. 최종 검수 체크리스트`,
          [
            isEnglish
              ? "Preset-match verification: compare the result against every explicit cue in the selected preset. Confirm that its defining composition, subject scale, material construction, edge behavior, color hierarchy, light direction, spatial depth, and finish are all visibly present. Reject and correct a result that reduces the preset to a generic filter or omits a defining cue."
              : "프리셋 일치 검수: 결과를 선택한 프리셋의 명시적 단서와 하나씩 대조한다. 핵심 구도·인물 크기·재질 구조·윤곽 처리·색 위계·빛의 방향·공간 깊이·마감이 모두 실제로 보이는지 확인한다. 프리셋을 일반 필터로 축소했거나 핵심 단서를 누락했다면 수정한 뒤 다시 출력한다.",
            visualSpecification.acceptance,
            isEnglish
              ? "Compare all references and outputs. Confirm the unique-person roster and output count, verify every identity appears exactly as instructed, and check that no face, hair, skin tone, age, body, clothing, or accessory was transferred between people. Reject and correct merged faces, duplicate limbs, malformed hands, unreadable faces, accidental text, or cropped-out people."
              : "모든 참조사진과 결과를 대조한다. 서로 다른 인물의 최종 명부와 결과 수를 확인하고 각 정체성이 지정한 방식대로 정확히 등장하는지 점검한다. 얼굴, 헤어스타일, 피부색, 연령대, 신체, 의상, 액세서리가 인물 사이에서 섞이거나 교환되지 않아야 한다. 얼굴 합성, 팔다리 중복, 비정상적인 손, 식별 불가능한 얼굴, 의도하지 않은 글자, 잘린 인물이 있으면 수정한 뒤 출력한다."
          ]
        )
      );
    }
    return markdownPrompt(documentTitle, intro, sections);
  }

  const PREVIEW_ID_PREFIX = "photo-transform-";
  const PREVIEW_TIMEOUT_MS = 240000;
  const AUTO_PREVIEW_BATCH_SIZE = 6;
  const AUTO_PREVIEW_ITEM_DELAY_MS = 5000;
  const AUTO_PREVIEW_BATCH_DELAY_MS = 30000;
  const PREVIEW_REFRESH_INTERVAL_MS = 30000;
  const BUNDLED_PREVIEW_MANIFEST_URL = "assets/photo-transform-previews/manifest.json";
  const EMBEDDED_PREVIEW_MODE = true;

  async function loadBundledPreviews() {
    try {
      const response = await fetch(BUNDLED_PREVIEW_MANIFEST_URL, { cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(result.ids)) {
        throw new Error(`번들 미리보기 목록을 읽지 못했습니다: ${response.status}`);
      }
      const presetIds = new Set(presets.map((preset) => preset.id));
      const bundledFiles = result.files && typeof result.files === "object" ? result.files : {};
      state.bundledPreviews.clear();
      result.ids.forEach((id) => {
        if (!presetIds.has(id)) return;
        const fileName = typeof bundledFiles[id] === "string" && bundledFiles[id]
          ? bundledFiles[id]
          : `${id}.jpg`;
        const url = `assets/photo-transform-previews/${fileName}`;
        state.bundledPreviews.set(id, url);
        if (!state.savedPreviews.has(id)) {
          state.savedPreviews.set(id, url);
          state.previewStates.set(id, "bundled");
        }
      });
    } catch (error) {
      console.warn(`[사진 변환] ${error.message}`);
    }
  }

  function getPresetServerId(preset) {
    return `${PREVIEW_ID_PREFIX}${preset.id}-v${preset.previewVersion || 1}`;
  }

  function buildPresetPreviewPrompt(preset) {
    const visualSpecification = getPresetVisualSpecification(preset, "ko");
    const subjectSeed = [...preset.id].reduce((sum, character) => sum + character.charCodeAt(0), 0);
    const singleSubjectVariants = [
      "가상의 20대 한국인 성인 여성 모델 한 명",
      "가상의 20대 한국인 성인 남성 모델 한 명",
      "가상의 30대 한국인 성인 여성 모델 한 명",
      "가상의 30대 한국인 성인 남성 모델 한 명",
      "가상의 40대 한국인 성인 여성 모델 한 명",
      "가상의 40대 한국인 성인 남성 모델 한 명",
      "가상의 50대 한국인 성인 여성 모델 한 명",
      "가상의 50대 한국인 성인 남성 모델 한 명"
    ];
    const groupSubjectVariants = [
      "서로 다른 외모를 가진 가상의 한국인 성인 친구 두 명",
      "서로 다른 외모를 가진 가상의 한국인 성인 동료 세 명",
      "서로 다른 연령대의 가상의 한국인 성인 가족 세 명",
      "개별 얼굴이 분명한 가상의 한국인 성인 네 명"
    ];
    const subject = preset.category === "relationship"
      ? groupSubjectVariants[subjectSeed % groupSubjectVariants.length]
      : singleSubjectVariants[subjectSeed % singleSubjectVariants.length];
    const intro = preset.outputType === "stickerPack" || preset.outputType === "animatedSprite"
      ? "사진 변환 프리셋 갤러리에서 재사용할 스티커 샘플 이미지를 만든다."
      : "사진 변환 프리셋 갤러리에서 재사용할 샘플 이미지를 만든다.";
    const subjectInstruction = preset.outputType === "stickerPack" || preset.outputType === "animatedSprite"
      ? `실존 인물이나 유명인이 아닌 ${subject}을 바탕으로 만든 하나의 독창적인 캐릭터를 사용한다. 한국인임이 한눈에 분명한 동아시아계 얼굴, 검은색 또는 짙은 갈색 머리와 짙은 갈색 눈, 자연스러운 피부색을 유지한다. 모델 인식 기준: Korean adult, East Asian Korean facial features, black hair, dark brown eyes.`
      : `실존 인물이나 유명인이 아닌 ${subject}을 사용한다. 한국인임이 한눈에 분명한 동아시아계 얼굴, 검은색 또는 짙은 갈색 머리와 짙은 갈색 눈, 자연스러운 피부색을 분명하게 표현한다. 모델 인식 기준: Korean adult, East Asian Korean facial features, black hair, dark brown eyes.`;
    if (preset.outputType === "stickerPack" || preset.outputType === "animatedSprite") {
      const count = preset.outputType === "animatedSprite" ? preset.frameCount : preset.itemCount;
      return markdownPrompt(`프리셋 미리보기 생성 — ${preset.title}`, intro, [
        markdownSection("1. 익명 샘플 피사체", [subjectInstruction]),
        markdownSection("2. 프리셋 콘셉트", [preset.ko]),
        markdownSection("3. 프리셋 시각 설계", visualSpecification.previewLines),
        markdownSection("4. 시트 및 카드 구성", [
          `요청한 ${count}개 항목을 밝고 단순한 배경 위의 깔끔한 ${preset.grid} 스티커 원본 시트 한 장으로 보여 준다.`,
          "4:3 가로형 미리보기 카드에 맞춰 모든 항목이 잘리지 않고 일관되게 보이도록 구성한다."
        ]),
        markdownSection("5. 제외 사항", [
          "읽을 수 있는 글자, 캡션, 로고, 서명, 워터마크, 목업, 스티커를 들고 있는 손은 만들지 않는다."
        ])
      ]);
    }
    return markdownPrompt(`프리셋 미리보기 생성 — ${preset.title}`, intro, [
      markdownSection("1. 익명 샘플 피사체", [subjectInstruction]),
      markdownSection("2. 프리셋 콘셉트", [preset.ko]),
      markdownSection("3. 프리셋 시각 설계", visualSpecification.previewLines),
      markdownSection("4. 카드 구성", [
        "피사체를 방해하지 않으면서 이 프리셋의 특징이 가장 잘 드러나는 배경과 조명을 선택한다.",
        "4:3 가로형 미리보기 카드에 맞춰 구성한다. 실제 개인 사진을 변환하는 것이 아니라 익명의 시각 스타일 샘플이다."
      ]),
      markdownSection("5. 제외 사항", [
        "신체 구조와 손을 자연스럽게 표현한다. 읽을 수 있는 글자, 캡션, 로고, 서명, 워터마크, 분할 화면, 비교 레이아웃, 테두리, 목업은 만들지 않는다."
      ])
    ]);
  }

  function setAutoPreviewStatus(message, type = "") {
    elements.autoPreviewStatus.textContent = message;
    elements.autoPreviewStatus.classList.toggle("is-running", type === "running");
    elements.autoPreviewStatus.classList.toggle("is-complete", type === "complete");
    elements.autoPreviewStatus.classList.toggle("is-error", type === "error");
  }

  function updateCardPreview(preset) {
    const card = elements.gallery.querySelector(`[data-preset-id="${preset.id}"]`);
    if (!card) return;
    const previewState = state.previewStates.get(preset.id);
    card.classList.toggle("is-preview-loading", previewState === "loading");
    const savedUrl = state.savedPreviews.get(preset.id);
    if (!savedUrl) return;
    const image = card.querySelector(".pt-card-generated-preview");
    image.onload = () => card.classList.add("has-generated-preview");
    image.onerror = () => card.classList.remove("has-generated-preview");
    image.src = savedUrl;
    image.hidden = false;
  }

  async function generateAndSavePreset(preset, { manual = false } = {}) {
    if (state.previewStates.get(preset.id) === "loading") return null;
    state.previewStates.set(preset.id, "loading");
    updateCardPreview(preset);

    const prompt = buildPresetPreviewPrompt(preset);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), PREVIEW_TIMEOUT_MS);

    try {
      const response = await fetch("/api/generate-photo-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medId: getPresetServerId(preset), prompt }),
        signal: controller.signal
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok || !result.url) {
        const error = new Error(result.error || `미리보기 저장 실패: ${response.status}`);
        if (response.status === 404) error.serverUnavailable = true;
        throw error;
      }
      const savedUrl = `${result.url}${result.url.includes("?") ? "&" : "?"}v=${Date.now()}`;
      state.savedPreviews.set(preset.id, savedUrl);
      state.previewStates.set(preset.id, "saved");
      updateCardPreview(preset);
      if (manual) notify(`‘${preset.title}’ 미리보기를 생성해 서버에 저장했습니다.`);
      return savedUrl;
    } catch (error) {
      state.previewStates.set(preset.id, "failed");
      updateCardPreview(preset);
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
      window.PromptDeckTabs?.syncHeaderActionStates?.();
    }
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function getPreviewCounts() {
    const generated = presets.filter((preset) => state.savedPreviews.has(preset.id) && state.previewStates.get(preset.id) === "saved").length;
    const bundled = presets.filter((preset) => state.savedPreviews.has(preset.id) && state.previewStates.get(preset.id) === "bundled").length;
    return {
      ready: generated + bundled,
      generated,
      bundled,
      remaining: presets.length - generated - bundled,
      total: presets.length,
    };
  }

  function isBatchPreviewMode() {
    return new URLSearchParams(window.location.search).get("photoPreviewAuto") === "0";
  }

  function setPreviewAvailabilityStatus({ batchMode = isBatchPreviewMode(), type = "complete" } = {}) {
    const { ready, generated, bundled, remaining, total } = getPreviewCounts();
    if (EMBEDDED_PREVIEW_MODE) {
      setAutoPreviewStatus(`내장 GPT 제작 미리보기 ${ready}/${total}개 · 제작 대기 ${remaining}개`, remaining ? "running" : type);
    } else if (batchMode) {
      setAutoPreviewStatus(`배치 실행기 모드 · GPT Image ${generated}/${total} · 생성 대기 ${remaining}`, type);
    } else if (remaining) {
      setAutoPreviewStatus(`GPT Image ${generated}/${total}개 · 기존 미리보기 ${bundled}개 · 생성 대기 ${remaining}`, type);
    } else {
      setAutoPreviewStatus(`GPT Image 미리보기 ${generated}/${total}개 생성 완료`, type);
    }
    return { generated, bundled, remaining, total };
  }

  function clearPreviewRefreshTimer() {
    if (!state.previewRefreshTimer) return;
    window.clearTimeout(state.previewRefreshTimer);
    state.previewRefreshTimer = 0;
  }

  function schedulePreviewRefresh() {
    clearPreviewRefreshTimer();
    const { remaining } = getPreviewCounts();
    if (!remaining || isBatchPreviewMode() || state.previewServerAvailable !== true || state.autoPreviewRunning || !elements.pane.classList.contains("active")) return;
    state.previewRefreshTimer = window.setTimeout(async () => {
      state.previewRefreshTimer = 0;
      try {
        await refreshSavedPreviews();
      } catch {
        // 다음 탭 활성화 또는 수동 새로고침에서 다시 연결한다.
      }
    }, PREVIEW_REFRESH_INTERVAL_MS);
  }

  function applyServerPreviews(images) {
    let changed = false;
    presets.forEach((preset) => {
      const serverUrl = images?.[getPresetServerId(preset)]?.[0]
        || (preset.previewVersion === 1 ? images?.[`${PREVIEW_ID_PREFIX}${preset.id}`]?.[0] : null)
        || "";
      const currentState = state.previewStates.get(preset.id);
      if (!serverUrl && currentState === "loading") return;
      const bundledUrl = state.bundledPreviews.get(preset.id) || "";
      const nextUrl = serverUrl || bundledUrl;
      const nextState = serverUrl ? "saved" : bundledUrl ? "bundled" : "";
      if (state.savedPreviews.get(preset.id) !== nextUrl || currentState !== nextState) changed = true;
      if (nextUrl) state.savedPreviews.set(preset.id, nextUrl);
      else state.savedPreviews.delete(preset.id);
      if (nextState) state.previewStates.set(preset.id, nextState);
      else state.previewStates.delete(preset.id);
    });
    return changed;
  }

  async function refreshSavedPreviews({ announce = false } = {}) {
    if (state.previewRefreshPromise) return state.previewRefreshPromise;
    state.previewRefreshPromise = (async () => {
      if (announce) setAutoPreviewStatus("저장된 미리보기를 확인하고 있습니다.", "running");
      const response = await fetch("/api/mixer-images", { cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        const error = new Error(result.error || `저장 이미지 조회 실패: ${response.status}`);
        if (response.status === 404) error.serverUnavailable = true;
        throw error;
      }
      state.previewServerAvailable = true;
      const changed = applyServerPreviews(result.images || {});
      if (changed) {
        renderGallery();
      }
      const counts = setPreviewAvailabilityStatus();
      schedulePreviewRefresh();
      return counts;
    })();
    try {
      return await state.previewRefreshPromise;
    } finally {
      state.previewRefreshPromise = null;
    }
  }

  async function runMissingPreviewQueue(missingPresets) {
    if (EMBEDDED_PREVIEW_MODE) {
      setPreviewAvailabilityStatus();
      return;
    }
    if (!missingPresets.length || state.autoPreviewRunning) return;
    state.autoPreviewRunning = true;
    let completed = state.savedPreviews.size;
    let failed = 0;
    const batchCount = Math.ceil(missingPresets.length / AUTO_PREVIEW_BATCH_SIZE);
    state.autoPreviewProgress = { total: missingPresets.length, processed: 0, saved: 0, failed: 0, batch: 1, batchCount };

    for (let index = 0; index < missingPresets.length; index += 1) {
      const preset = missingPresets[index];
      if (state.savedPreviews.has(preset.id)) continue;
      const batch = Math.floor(index / AUTO_PREVIEW_BATCH_SIZE) + 1;
      state.autoPreviewProgress.batch = batch;
      setAutoPreviewStatus(`저속 배치 ${batch}/${batchCount} · ${completed}/${presets.length} 저장 · ${preset.title}`, "running");
      try {
        await generateAndSavePreset(preset);
        completed += 1;
        state.autoPreviewProgress.saved += 1;
      } catch (error) {
        failed += 1;
        state.autoPreviewProgress.failed += 1;
        if (error.serverUnavailable) {
          state.previewServerAvailable = false;
          break;
        }
      }
      state.autoPreviewProgress.processed += 1;
      const isLast = index === missingPresets.length - 1;
      const isBatchEnd = (index + 1) % AUTO_PREVIEW_BATCH_SIZE === 0;
      if (!isLast && isBatchEnd) {
        setAutoPreviewStatus(`저속 배치 ${batch}/${batchCount} 완료 · 다음 배치까지 ${AUTO_PREVIEW_BATCH_DELAY_MS / 1000}초 대기`, "running");
        await wait(AUTO_PREVIEW_BATCH_DELAY_MS);
      } else if (!isLast) {
        await wait(AUTO_PREVIEW_ITEM_DELAY_MS);
      }
    }

    state.autoPreviewRunning = false;
    if (state.previewServerAvailable === false) {
      setAutoPreviewStatus("로컬 이미지 저장 서버에 연결해야 자동 미리보기를 저장할 수 있습니다.", "error");
    } else if (failed) {
      const { generated, total } = getPreviewCounts();
      setAutoPreviewStatus(`GPT Image 미리보기 ${generated}/${total}개 생성 · ${failed}개 생성 실패`, "error");
    } else {
      setPreviewAvailabilityStatus();
    }
    schedulePreviewRefresh();
  }

  async function ensureAutoPreviews() {
    if (state.autoPreviewStarted) return;
    state.autoPreviewStarted = true;
    setAutoPreviewStatus("저장된 미리보기를 확인하고 있습니다.", "running");

    try {
      await state.bundledPreviewsReady;
      if (EMBEDDED_PREVIEW_MODE) {
        renderGallery();
        setPreviewAvailabilityStatus();
        window.PromptDeckTabs?.syncHeaderActionStates?.();
        return;
      }
      await refreshSavedPreviews({ announce: false });
      const missing = presets.filter((preset) => !state.savedPreviews.has(preset.id));
      const automaticQueue = missing.filter((preset) => preset.autoPreview !== false);
      if (isBatchPreviewMode() || !automaticQueue.length) return;
      runMissingPreviewQueue(automaticQueue);
    } catch (error) {
      state.previewServerAvailable = false;
      const { ready, total } = getPreviewCounts();
      setAutoPreviewStatus(`기본 제공 미리보기 ${ready}/${total}개 준비 · 저장 서버 연결 필요`, "error");
      window.PromptDeckTabs?.syncHeaderActionStates?.();
    }
  }

  function notify(message, isError = false) {
    if (typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }
    console[isError ? "error" : "info"](`[사진 변환] ${message}`);
  }

  async function copyText(text) {
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      return copied;
    }
  }

  async function copyPreset(id, languageOverride) {
    const preset = presets.find((item) => item.id === id);
    if (!preset) return;
    const copied = await copyText(buildPrompt(preset, languageOverride));
    const languageLabel = languageOverride === "en" ? "English " : "";
    notify(copied ? `‘${preset.title}’ ${languageLabel}프롬프트를 복사했습니다.` : "프롬프트를 복사하지 못했습니다.", !copied);
  }

  function openDialog(dialog) {
    if (typeof dialog?.showModal === "function") dialog.showModal();
    else dialog?.setAttribute("open", "");
  }

  function getCheckedValues(container) {
    return [...container.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.value);
  }

  function setCheckedValues(container, values) {
    const normalized = container === elements.customPeople && values.includes("all")
      ? ["single", "pair", "smallGroup", "largeGroup"]
      : values;
    const selected = new Set(normalized);
    container.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.checked = selected.has(input.value);
    });
  }

  function openCustomPreset(sourcePreset = null) {
    elements.customForm.reset();
    state.customSourceId = sourcePreset?.id || null;
    elements.customTitle.textContent = sourcePreset ? "스타일 복제" : "새 프리셋 만들기";
    elements.customSource.hidden = !sourcePreset;
    elements.customSourceTitle.textContent = sourcePreset?.title || "";
    if (sourcePreset) {
      elements.customName.value = `${sourcePreset.title} 복제`.slice(0, 40);
      elements.customCategory.value = sourcePreset.category;
      elements.customDescription.value = sourcePreset.description;
      elements.customKo.value = sourcePreset.ko;
      elements.customEn.value = sourcePreset.en;
      setCheckedValues(elements.customPurposes, sourcePreset.purposes);
      setCheckedValues(elements.customPeople, sourcePreset.peopleFit);
    }
    openDialog(elements.customDialog);
    window.setTimeout(() => elements.customName.focus(), 0);
  }

  function clonePreset(id) {
    const preset = presets.find((item) => item.id === id);
    if (preset) openCustomPreset(preset);
  }

  function slugifyPreset(value) {
    const base = String(value).normalize("NFKD").replace(/[^a-zA-Z0-9가-힣]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "custom";
    return `user-${base}-${Date.now().toString(36)}`;
  }

  async function saveCustomPreset() {
    const purposes = getCheckedValues(elements.customPurposes);
    const people = getCheckedValues(elements.customPeople);
    if (!purposes.length || !people.length) {
      notify("주요 용도와 적합 인원을 각각 하나 이상 선택해 주세요.", true);
      return;
    }
    const sourcePreset = presets.find((preset) => preset.id === state.customSourceId);
    const category = elements.customCategory.value;
    const preserveSourceSheet = sourcePreset && isFixedSheetPreset(sourcePreset) && category === "sticker";
    const tags = sourcePreset
      ? ["내 프리셋", ...sourcePreset.tags.filter((tag) => tag !== "내 프리셋").slice(0, 3)]
      : ["내 프리셋", purposeLabels[purposes[0]]];
    const preset = normalizeUserPreset({
      id: slugifyPreset(elements.customName.value),
      title: elements.customName.value.trim(),
      category,
      description: elements.customDescription.value.trim(),
      tags,
      purposes,
      peopleFit: people,
      ratios: sourcePreset ? [...sourcePreset.ratios] : ["1:1", "4:5", "3:4", "16:9", "9:16"],
      previewVersion: GPT_IMAGE_PREVIEW_VERSION,
      outputType: preserveSourceSheet ? sourcePreset.outputType : (category === "sticker" ? "stickerPack" : undefined),
      itemCount: preserveSourceSheet ? sourcePreset.itemCount : (category === "sticker" ? 9 : undefined),
      frameCount: preserveSourceSheet ? sourcePreset.frameCount : undefined,
      grid: preserveSourceSheet ? sourcePreset.grid : (category === "sticker" ? "3×3" : undefined),
      ko: elements.customKo.value.trim(),
      en: elements.customEn.value.trim() || elements.customKo.value.trim()
    });
    if (!preset) return;
    presets.push(preset);
    state.userPresetIds.add(preset.id);
    persistUserPresets();
    state.category = "all";
    state.purpose = "all";
    elements.purpose.value = "all";
    state.customSourceId = null;
    elements.customDialog.close?.();
    renderFilters();
    renderGallery();
    updateCollageVisibility();
    notify(`‘${preset.title}’ 프리셋을 저장했습니다.`);
    if (state.previewServerAvailable === true) {
      try { await generateAndSavePreset(preset, { manual: true }); } catch { /* 상태 UI에서 안내 */ }
    }
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  async function refreshAdminStatus() {
    elements.adminSummary.innerHTML = '<span>서버 저장 상태를 확인하고 있습니다.</span>';
    try {
      const response = await fetch("/api/photo-preview-status", { cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || `조회 실패: ${response.status}`);
      const entryMap = new Map(result.entries.map((entry) => [entry.medId, entry]));
      const savedCount = presets.filter((preset) => state.savedPreviews.has(preset.id)).length;
      const missingCount = presets.length - savedCount;
      const failedCount = [...state.previewStates.values()].filter((value) => value === "failed").length;
      elements.adminSummary.innerHTML = `<div><strong>${savedCount}</strong><span>저장됨</span></div><div><strong>${missingCount}</strong><span>누락</span></div><div><strong>${failedCount}</strong><span>실패</span></div><div><strong>${formatBytes(result.totalBytes)}</strong><span>서버 사용량</span></div>`;
      elements.adminList.innerHTML = presets.map((preset) => {
        const entry = entryMap.get(getPresetServerId(preset)) || entryMap.get(`${PREVIEW_ID_PREFIX}${preset.id}`);
        const status = state.previewStates.get(preset.id) || (entry ? "saved" : "missing");
        return `<article data-admin-preset="${escapeHtml(preset.id)}"><div><strong>${escapeHtml(preset.title)}</strong><span>v${preset.previewVersion} · ${entry ? formatBytes(entry.bytes) : status === "bundled" ? "앱 포함" : "저장 없음"}</span></div><span class="pt-admin-status is-${escapeHtml(status)}">${status === "saved" ? "저장됨" : status === "bundled" ? "기본 제공" : status === "loading" ? "생성 중" : status === "failed" ? "실패" : "누락"}</span><div><button type="button" class="btn ghost" data-admin-generate="${escapeHtml(preset.id)}">${entry ? "재생성" : "생성"}</button><button type="button" class="btn ghost" data-admin-version="${escapeHtml(preset.id)}">새 버전</button>${entry ? `<button type="button" class="btn ghost" data-admin-delete="${escapeHtml(preset.id)}" data-admin-med-id="${escapeHtml(entry.medId)}">삭제</button>` : ""}</div></article>`;
      }).join("");
    } catch (error) {
      elements.adminSummary.innerHTML = `<span class="is-error">저장 서버 상태를 불러오지 못했습니다: ${escapeHtml(error.message)}</span>`;
      elements.adminList.innerHTML = "";
    }
  }

  async function deletePreview(id, medId) {
    const response = await fetch("/api/delete-photo-preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ medId }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || "삭제 실패");
    const bundledUrl = state.bundledPreviews.get(id) || "";
    if (bundledUrl) {
      state.savedPreviews.set(id, bundledUrl);
      state.previewStates.set(id, "bundled");
    } else {
      state.savedPreviews.delete(id);
      state.previewStates.delete(id);
    }
    renderGallery();
    await refreshAdminStatus();
  }

  async function bumpPreviewVersion(id) {
    const preset = presets.find((item) => item.id === id);
    if (!preset) return;
    preset.previewVersion += 1;
    state.savedPreviews.delete(id);
    state.previewStates.delete(id);
    persistPreviewVersions();
    persistUserPresets();
    renderGallery();
    try { await generateAndSavePreset(preset, { manual: true }); } catch { /* 상태 UI에서 안내 */ }
    await refreshAdminStatus();
  }

  async function deleteUserPreset(id) {
    const index = presets.findIndex((preset) => preset.id === id && preset.isUserPreset);
    if (index < 0) return;
    const preset = presets[index];
    if (!window.confirm(`‘${preset.title}’ 프리셋을 삭제할까요? 저장된 미리보기도 함께 삭제됩니다.`)) return;
    try {
      await fetch("/api/delete-photo-preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ medId: getPresetServerId(preset) }) });
    } catch { /* 서버가 없더라도 로컬 프리셋 삭제는 계속한다. */ }
    presets.splice(index, 1);
    state.userPresetIds.delete(id);
    state.favoriteIds.delete(id);
    state.savedPreviews.delete(id);
    state.previewStates.delete(id);
    if (state.customSourceId === id) state.customSourceId = null;
    persistUserPresets();
    persistFavorites();
    renderGallery();
    notify(`‘${preset.title}’ 프리셋을 삭제했습니다.`);
  }

  elements.filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.category = button.dataset.category;
    renderFilters();
    renderGallery();
  });

  elements.search.addEventListener("input", () => {
    state.query = elements.search.value;
    renderGallery();
  });

  elements.galleryMoreButton.addEventListener("click", () => {
    state.galleryLimit += MOBILE_GALLERY_PAGE_SIZE;
    renderGallery();
  });

  const handleGalleryMediaChange = () => {
    state.galleryFilterKey = "";
    renderGallery();
  };
  if (galleryMedia.addEventListener) galleryMedia.addEventListener("change", handleGalleryMediaChange);
  else galleryMedia.addListener(handleGalleryMediaChange);

  elements.gallery.addEventListener("click", (event) => {
    const copyButton = event.target.closest("[data-copy-preset]");
    const cloneButton = event.target.closest("[data-clone-preset]");
    const favoriteButton = event.target.closest("[data-favorite-preset]");
    const deleteUserButton = event.target.closest("[data-delete-user-preset]");
    if (copyButton) copyPreset(copyButton.dataset.copyPreset, copyButton.dataset.copyLanguage);
    if (cloneButton) clonePreset(cloneButton.dataset.clonePreset);
    if (favoriteButton) {
      const id = favoriteButton.dataset.favoritePreset;
      if (state.favoriteIds.has(id)) state.favoriteIds.delete(id); else state.favoriteIds.add(id);
      persistFavorites();
      renderGallery();
    }
    if (deleteUserButton) deleteUserPreset(deleteUserButton.dataset.deleteUserPreset);
  });

  [elements.sourceStructure, elements.people, elements.outputMode, elements.identity, elements.language, elements.strength, elements.collageLayout, elements.collageGap, elements.collageBackground].forEach((control) => {
    control.addEventListener("change", () => {
      updateCollageVisibility();
      if (control === elements.identity) updateIdentityGuide();
      if (control === elements.people) renderGallery();
    });
  });
  elements.purpose.addEventListener("change", () => { state.purpose = elements.purpose.value; updateCollageVisibility(); renderGallery(); });
  elements.sort.addEventListener("change", () => { state.sort = elements.sort.value; renderGallery(); });
  elements.compatibleOnly.addEventListener("change", () => { state.compatibleOnly = elements.compatibleOnly.checked; renderGallery(); });
  elements.favoritesOnly.addEventListener("change", () => { state.favoritesOnly = elements.favoritesOnly.checked; renderGallery(); });

  elements.customOpen.addEventListener("click", () => openCustomPreset());
  elements.customDialog.querySelectorAll('button[value="close"]').forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      elements.customDialog.close?.();
    });
  });
  elements.customForm.addEventListener("submit", (event) => {
    if (event.submitter?.value === "close") return;
    event.preventDefault();
    if (elements.customForm.reportValidity()) saveCustomPreset();
  });

  elements.adminOpen.addEventListener("click", () => { openDialog(elements.adminDialog); refreshAdminStatus(); });
  elements.adminRefresh.addEventListener("click", refreshAdminStatus);
  elements.adminGenerateMissing.addEventListener("click", () => runMissingPreviewQueue(presets.filter((preset) => !state.savedPreviews.has(preset.id))));
  elements.adminList.addEventListener("click", async (event) => {
    const generate = event.target.closest("[data-admin-generate]");
    const version = event.target.closest("[data-admin-version]");
    const remove = event.target.closest("[data-admin-delete]");
    if (generate) {
      const preset = presets.find((item) => item.id === generate.dataset.adminGenerate);
      if (preset) { try { await generateAndSavePreset(preset, { manual: true }); } catch { /* 상태 UI에서 안내 */ } await refreshAdminStatus(); }
    }
    if (version) await bumpPreviewVersion(version.dataset.adminVersion);
    if (remove) {
      try { await deletePreview(remove.dataset.adminDelete, remove.dataset.adminMedId); } catch (error) { notify(`미리보기 삭제 실패: ${error.message}`, true); }
    }
  });

  const paneObserver = new MutationObserver(() => {
    if (elements.pane.classList.contains("active")) {
      state.autoPreviewStarted = false;
      ensureAutoPreviews();
    } else {
      clearPreviewRefreshTimer();
    }
  });
  paneObserver.observe(elements.pane, { attributes: true, attributeFilter: ["class"] });

  async function generatePreviewById(id) {
    const preset = presets.find((item) => item.id === id);
    if (!preset) throw new Error(`알 수 없는 사진 변환 프리셋: ${id}`);
    if (state.previewStates.get(id) === "saved" && state.savedPreviews.has(id)) return state.savedPreviews.get(id);
    if (state.previewServerAvailable !== true) {
      ensureAutoPreviews();
      for (let attempt = 0; attempt < 100 && state.previewServerAvailable === null; attempt += 1) await wait(100);
    }
    if (state.previewServerAvailable !== true) throw new Error("사진 변환 미리보기 저장 서버에 연결할 수 없습니다.");
    if (state.previewStates.get(id) === "saved" && state.savedPreviews.has(id)) return state.savedPreviews.get(id);
    return generateAndSavePreset(preset);
  }

  window.PromptDeckPhotoTransform = {
    getPresets: () => presets.map(({ id, title, category, description, purposes, peopleFit, ratios, previewVersion, outputType, subjectType, isUserPreset }) => ({ id, title, category, description, purposes: [...purposes], peopleFit: [...peopleFit], ratios: [...ratios], previewVersion, outputType, subjectType, isUserPreset: !!isUserPreset })),
    buildPrompt: (id, language = "en") => {
      const preset = presets.find((item) => item.id === id);
      return preset ? buildPrompt(preset, language) : "";
    },
    buildPreviewPrompt: (id) => {
      const preset = presets.find((item) => item.id === id);
      return preset ? buildPresetPreviewPrompt(preset) : "";
    },
    refreshPreviews: () => {
      clearPreviewRefreshTimer();
      state.autoPreviewStarted = false;
      return ensureAutoPreviews();
    },
    generatePreviewById,
    getPreviewQueueStatus: () => ({ running: state.autoPreviewRunning, serverAvailable: state.previewServerAvailable, savedCount: state.savedPreviews.size, ...state.autoPreviewProgress })
  };
  window.PhotoTransformPresets = window.PromptDeckPhotoTransform;

  loadLocalData();
  updateIdentityGuide();
  updateCollageVisibility();
  renderFilters();
  renderGallery();
  state.bundledPreviewsReady = loadBundledPreviews().then(() => {
    renderGallery();
  });
  if (elements.pane.classList.contains("active")) ensureAutoPreviews();
})();
