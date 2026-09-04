// 비주얼 믹서 프리셋 - 화풍/기법
(function () {
  const MEDIUM_CATEGORIES = [
    { id: 'tech3d', label: '🧊 3D & 테크니컬' },
    { id: 'analog', label: '🎨 아날로그 & 회화' },
    { id: 'graphic', label: '◼️ 그래픽 & 디자인' },
    { id: 'anime', label: '🎬 만화 & 애니메이션' },
    { id: 'youtube_anim', label: '📹 유튜브 & 설명영상' },
    { id: 'photo', label: '📷 사진 & 실사' },
    { id: 'craft', label: '🧶 핸드메이드 & 실물 공예' },
    { id: 'official', label: '📋 공공 & 보고서' },
    { id: 'cardnews', label: '📱 카드뉴스' },
    { id: 'game', label: '🎮 게임 & 픽셀' },
    { id: 'trad', label: '🪁 전통 & 판화' },
    { id: 'abstract', label: '🌀 추상 & 실험' },
    { id: 'arch', label: '🏗️ 건축 & 공간' },
    { id: 'editorial', label: '✨ 에디토리얼 & 패션' },
    { id: 'digital_paint', label: '🖥️ 디지털 페인팅' },
    { id: 'ui_ux', label: '📱 UI/UX & 앱 디자인' },
    { id: 'pixel_adv', label: '🕹️ 고급 픽셀 & 도트' },
    { id: 'nature_photo', label: '🌅 자연 & 풍경 사진' }
  ];

  const MIXER_MEDIUMS = [
    // ==================== 1. 3D & 테크니컬 (tech3d) ====================
    {
      id: 'med-3d',
      category: 'tech3d',
      nameKo: '3D 테크니컬 렌더',
      emoji: '🧊',
      desc: '메탈/유리 재질감, 스튜디오 조명',
      prefix: 'highly detailed 3D technical rendering of',
      suffix: 'highly detailed 3D render, technical engineering cutaway, realistic textures, volumetric studio lighting, clean geometric shapes, octane render',
      group: 'render3d',
      texture: 'glossy',
      usage: 'proposal'
    },
    {
      id: 'med-clay',
      category: 'tech3d',
      nameKo: '클레이 매트 렌더',
      emoji: '🧸',
      desc: '점토 질감의 따뜻하고 둥근 3D 디자인',
      prefix: 'clay render 3D illustration of',
      suffix: 'clay render 3D illustration, plasticine matte clay texture, chunky rounded proportions, soft studio lighting, smooth ambient occlusion, cute toy-like aesthetic',
      group: 'render3d',
      texture: 'glossy',
      usage: 'proposal'
    },
    {
      id: 'med-iso',
      category: 'tech3d',
      nameKo: '아이소메트릭 3D',
      emoji: '📐',
      desc: '45도 등각 투영 뷰의 입체 인포그래픽',
      prefix: 'isometric 3D vector illustration of',
      suffix: 'isometric 3D vector illustration, clean geometric style, precise 45-degree perspective, soft drop shadows, professional business infographic',
      group: 'render3d',
      texture: 'glossy',
      usage: 'proposal'
    },
    {
      id: 'med-voxel',
      category: 'tech3d',
      nameKo: '레트로 복셀 블록',
      emoji: '🧱',
      desc: '큐브 블록을 쌓은 마인크래프트 감성 3D',
      prefix: 'voxel art 3D style of',
      suffix: 'voxel art 3D style, colorful cubic block construction, isometric pixel-block view, clear grid structures',
      group: 'render3d',
      texture: 'glossy',
      usage: 'proposal'
    },
    {
      id: 'med-lowpoly',
      category: 'tech3d',
      nameKo: '로우폴리 아키텍처',
      emoji: '🌲',
      desc: '단순화된 각진 면으로 이루어진 3D 스타일',
      prefix: 'low-poly 3D scene of',
      suffix: 'low-poly style, polygonal shapes, faceted geometry, vibrant colors, clean rendering, stylized minimal environment',
      group: 'render3d',
      texture: 'glossy',
      usage: 'proposal'
    },
    {
      id: 'med-hologram',
      category: 'tech3d',
      nameKo: '3D 미래형 홀로그램',
      emoji: '📡',
      desc: '푸른빛의 입체 홀로그램 격자망 효과',
      prefix: 'glowing holographic 3D projection of',
      suffix: 'holographic projection, bright cyan scanlines, glowing digital grid wireframe, flickering light particles, sci-fi interface visual, dark background',
      group: 'render3d',
      texture: 'glossy',
      usage: 'proposal'
    },
    {
      id: 'med-fluiddyn',
      category: 'tech3d',
      nameKo: '유기적 3D 유체',
      emoji: '💧',
      desc: '역동적으로 요동치는 액체 메탈과 유리 질감',
      prefix: '3D abstract fluid dynamics rendering of',
      suffix: 'swirling liquid chrome and colored glass fluid simulation, organic morphing shapes, glossy subsurface scattering, studio reflections, dramatic light refractions',
      group: 'render3d',
      texture: 'glossy',
      usage: 'proposal'
    },
    {
      id: 'med-spline',
      category: 'tech3d',
      nameKo: '미니멀 3D 스플라인',
      emoji: '➰',
      desc: '부드러운 곡선과 파스텔톤 플라스틱 렌더',
      prefix: 'minimalist 3D spline rendering of',
      suffix: 'soft smooth 3D curves, modern pastel plastic materials, abstract flowing loops, studio lighting, clean solid background, matte finish',
      group: 'render3d',
      texture: 'glossy',
      usage: 'proposal'
    },
    { id: 'med-neon-glow', category: 'tech3d', nameKo: '네온 글로우 사이버 3D', emoji: '🌟', desc: '어둠 속에서 빛나는 네온 글로우 사이버 3D 오브젝트', prefix: 'neon glow cyberpunk 3D object rendering of', suffix: 'dark background, vivid neon glow emission, cyberpunk aesthetic, volumetric light bloom, luminescent surface material, futuristic dark atmosphere', group: 'render3d', texture: 'glossy', usage: 'proposal' },
    { id: 'med-product-3d', category: 'tech3d', nameKo: '제품 스튜디오 3D 렌더', emoji: '📦', desc: '완벽한 리플렉션과 소프트 섀도의 제품 3D 스튜디오 렌더링', prefix: 'professional 3D product studio rendering of', suffix: 'perfect studio 3D product render, infinity curve white or dark background, soft box lighting, reflection on surface, product photography quality CGI', group: 'render3d', texture: 'glossy', usage: 'proposal' },
    { id: 'med-technical-explode', category: 'tech3d', nameKo: '기계 파트 익스플로디드 뷰', emoji: '🔩', desc: '부품이 분해·비행하는 엔지니어링 익스플로디드 뷰 렌더링', prefix: 'technical exploded view 3D render of', suffix: 'engineering exploded view 3D render, parts floating apart in precise order, technical annotation labels, clean white background, technical illustration quality', group: 'render3d', texture: 'glossy', usage: 'proposal' },
    { id: 'med-crystal-3d', category: 'tech3d', nameKo: '수정 & 젤리 3D 렌더', emoji: '💎', desc: '투명하고 굴절이 빛나는 크리스탈·젤리 소재 3D 렌더링', prefix: 'crystal and jelly transparent 3D object of', suffix: 'crystal transparent material with rainbow light refraction caustics, jelly soft body 3D, subsurface scattering, glossy surface, clean bright studio', group: 'render3d', texture: 'glossy', usage: 'proposal' },
    { id: 'med-chrome-3d', category: 'tech3d', nameKo: '크롬 메탈 반사 3D', emoji: '🪞', desc: '환경을 완벽히 반사하는 크롬 구체와 메탈 오브젝트', prefix: 'chrome metallic reflective 3D object of', suffix: 'highly polished chrome ball or surface, perfect mirror environment reflection, ray traced metal material, chrome sphere 3D render, photorealistic metallic', group: 'render3d', texture: 'glossy', usage: 'proposal' },
    { id: 'med-bubble-3d', category: 'tech3d', nameKo: '3D 버블 구체 클러스터', emoji: '🫧', desc: '다양한 크기의 반투명 구체들이 떠오르는 버블 3D 렌더링', prefix: 'floating bubble cluster 3D render of', suffix: 'translucent soap bubble spheres cluster, iridescent surface sheen, physics simulation bubbles, pastel or vivid refracted light colors, clean white background', group: 'render3d', texture: 'glossy', usage: 'proposal' },
    { id: 'med-wireframe-3d', category: 'tech3d', nameKo: '3D 와이어프레임 메시', emoji: '🕸️', desc: '폴리곤 메시와 엣지 라인이 드러나는 와이어프레임 3D 시각화', prefix: 'wireframe polygon mesh 3D visualization of', suffix: '3D wireframe mesh structure, glowing edge lines on dark background, polygon topology visible, geometric grid lines, technical 3D modeling visualization', group: 'render3d', texture: 'glossy', usage: 'proposal' },
    { id: 'med-particle-3d', category: 'tech3d', nameKo: '3D 파티클 시스템', emoji: '✨', desc: '수만 개 파티클이 형상을 이루는 3D 파티클 이펙트', prefix: '3D particle system forming', suffix: 'thousands of glowing particles forming shape, particle simulation, volumetric depth, dynamic motion trails, dark atmospheric background, cinematic 3D effect', group: 'render3d', texture: 'glossy', usage: 'proposal' },
    { id: 'med-real-cgi-keyvisual', category: 'tech3d', nameKo: '실사+CGI 키비주얼', emoji: '🎬', desc: '실제 촬영 사진 위에 고품질 CGI 오브젝트를 자연스럽게 합성한 광고 키비주얼', prefix: 'photorealistic live-action and CGI composite key visual of', suffix: 'real photography base blended with premium CGI 3D elements, seamless compositing, physically accurate shadows and reflections, cinematic advertising lighting, high-end commercial campaign quality, believable real-world scale', group: 'photo3d', texture: 'real', usage: 'campaign' },
    { id: 'med-photo-3d-icons', category: 'tech3d', nameKo: '사진+3D 아이콘 오버레이', emoji: '🔷', desc: '실사 배경에 둥근 3D 아이콘과 정보 오브젝트를 얹은 기업 홍보 스타일', prefix: 'real photo background with floating 3D icon overlay of', suffix: 'photographic scene combined with clean floating 3D icons and infographic objects, soft shadows anchored to the real environment, bright corporate lighting, polished SaaS and public-service campaign aesthetic, readable commercial composition', group: 'photo3d', texture: 'real', usage: 'corporate' },
    { id: 'med-product-photo-cgi', category: 'tech3d', nameKo: '제품사진+CGI 오브젝트', emoji: '📦', desc: '제품 사진 촬영과 3D 그래픽 요소가 결합된 이커머스·브랜드 캠페인 스타일', prefix: 'premium product photography and CGI hybrid visual of', suffix: 'realistic product photo styling mixed with abstract 3D shapes, glossy material accents, accurate contact shadows, studio backdrop, commercial e-commerce hero image quality, clean copy space and premium brand finish', group: 'photo3d', texture: 'real', usage: 'campaign' },
    { id: 'med-arch-photo-3d-overlay', category: 'tech3d', nameKo: '건축사진+3D 데이터 오버레이', emoji: '🏙️', desc: '실제 공간·건물 사진 위에 3D 데이터, 경로, 구조를 시각화하는 스마트시티 스타일', prefix: 'architectural photography with 3D data visualization overlay of', suffix: 'real building or facility photography blended with precise 3D data overlays, glowing route lines, translucent volumetric diagrams, smart city and infrastructure proposal aesthetic, clean professional spatial communication, believable perspective tracking', group: 'photo3d', texture: 'real', usage: 'proposal' },
    { id: 'med-human-3d-data', category: 'tech3d', nameKo: '인물실사+3D 데이터 비주얼', emoji: '🧑‍💼', desc: '실제 인물·업무 장면에 3D 데이터 그래픽을 결합한 B2B 캠페인 스타일', prefix: 'realistic business photography with 3D data graphics of', suffix: 'real people and workplace scene enhanced with floating 3D charts, translucent dashboards, volumetric data ribbons, natural lighting and realistic depth of field, corporate innovation campaign quality, human-centered technology storytelling', group: 'photo3d', texture: 'real', usage: 'corporate' },
    { id: 'med-real-clay-hybrid', category: 'tech3d', nameKo: '실사+소프트 클레이 3D', emoji: '🧸', desc: '실제 배경에 부드러운 클레이 3D 캐릭터·오브젝트를 섞은 친근한 홍보 스타일', prefix: 'real photo scene with soft clay 3D character objects of', suffix: 'live-action photographic environment combined with soft matte clay 3D characters or props, gentle ambient occlusion, pastel institutional colors, friendly approachable commercial visual, natural scale and shadow integration', group: 'photo3d', texture: 'real', usage: 'corporate' },
    { id: 'med-real-hologram-hybrid', category: 'tech3d', nameKo: '실사+홀로그램 인터페이스', emoji: '📡', desc: '실제 공간에 반투명 홀로그램 UI와 3D 네트워크가 떠 있는 혁신 기술 스타일', prefix: 'realistic live-action scene with holographic 3D interface of', suffix: 'photorealistic environment with translucent holographic UI panels, glowing network lines, volumetric light, subtle cyan and blue highlights, believable reflections on real surfaces, premium technology presentation visual', group: 'photo3d', texture: 'real', usage: 'proposal' },
    { id: 'med-3d-motion-still', category: 'tech3d', nameKo: '3D 모션그래픽 스틸', emoji: '🎞️', desc: '브랜드 영상의 한 프레임처럼 입체 도형과 타이포가 움직이는 듯한 모션그래픽 정지컷', prefix: 'high-end 3D motion graphics still frame of', suffix: 'dynamic 3D motion design frame, kinetic floating shapes, clean typography-safe zones, smooth gradients, depth layers, studio lighting, premium brand video keyframe aesthetic, commercial launch visual quality', group: 'render3d', texture: 'glossy', usage: 'campaign' },
    { id: 'med-real-miniature-diorama', category: 'tech3d', nameKo: '리얼 미니어처 디오라마', emoji: '🏗️', desc: '실사처럼 정교한 미니어처 모형과 3D 디오라마가 결합된 설명형 비주얼', prefix: 'photorealistic miniature diorama 3D model of', suffix: 'realistic miniature scale model, tilt-shift depth of field, tiny people and props, handcrafted diorama detail mixed with CGI precision, soft studio lighting, proposal and explainer visual quality, clear spatial storytelling', group: 'render3d', texture: 'real', usage: 'proposal' },
    { id: 'med-ar-interface-composite', category: 'tech3d', nameKo: 'AR 인터페이스 합성', emoji: '📱', desc: '휴대폰·현장 사진 위에 증강현실 UI와 3D 안내 그래픽을 합성한 서비스 홍보 스타일', prefix: 'augmented reality interface composite visual of', suffix: 'real phone or real-world scene with AR interface overlays, anchored 3D labels and callouts, clean app-like UI panels, realistic screen reflections, product service launch advertising quality, modern digital transformation aesthetic', group: 'photo3d', texture: 'real', usage: 'corporate' },

    // ==================== 2. 아날로그 & 회화 (analog) ====================
    {
      id: 'med-watercolor',
      category: 'analog',
      nameKo: '감성 수채화',
      emoji: '🎨',
      desc: '은은한 물 번짐과 연필 스케치 선',
      prefix: 'hand-painted watercolor illustration of',
      suffix: 'whimsical hand-painted watercolor illustration, soft watercolor washes, natural diffused light, organic ink outlines, textured paper background, artistic splatters',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    {
      id: 'med-oil',
      category: 'analog',
      nameKo: '클래식 임파스토 유화',
      emoji: '🖼️',
      desc: '두꺼운 붓 터치와 캔버스 입체감',
      prefix: 'classical oil painting of',
      suffix: 'classical oil painting, visible canvas texture and thick paint brushstrokes, rich impasto layers, dramatic classical lighting, fine art masterpiece',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    {
      id: 'med-pencil',
      category: 'analog',
      nameKo: '미니멀 연필 소묘',
      emoji: '✏️',
      desc: '정교한 명암 해칭 기법의 흑백 소묘',
      prefix: 'detailed pencil sketch of',
      suffix: 'minimalist fine pencil sketch, detailed cross-hatching, realistic graphite textures, soft shadows, clean white paper background, fine art drawing',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    {
      id: 'med-ink',
      category: 'analog',
      nameKo: '동양화 수묵 담채',
      emoji: '🎋',
      desc: '먹선의 강약과 여백의 미가 살아있는 화풍',
      prefix: 'traditional Asian ink wash painting of',
      suffix: 'traditional East Asian ink wash and watercolor painting, elegant calligraphic ink brushstrokes, beautiful negative space, misty atmospheric perspective, artistic hand-painted feel',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    {
      id: 'med-crayon',
      category: 'analog',
      nameKo: '오일 파스텔 크레용',
      emoji: '🖍️',
      desc: '크레용 특유의 뭉뚝하고 포근한 거친 질감',
      prefix: 'textured oil pastel drawing of',
      suffix: 'chunky oil pastel stroke textures, rich crayon wax details, warm color scheme, artistic hand-drawn feel, heavy paper grain',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    {
      id: 'med-gouache',
      category: 'analog',
      nameKo: '매트 과슈 페인팅',
      emoji: '🎨',
      desc: '불투명하고 차분한 무광 수성 물감 느낌',
      prefix: 'matte gouache painting of',
      suffix: 'flat opaque paint layers, textured gouache brushstrokes, earthy color palette, stylized shapes, modern hand-painted illustration',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    {
      id: 'med-acrylic',
      category: 'analog',
      nameKo: '추상 아크릴 페인팅',
      emoji: '🖌️',
      desc: '선명하고 역동적인 아크릴 물감 터치와 마블링',
      prefix: 'abstract acrylic painting of',
      suffix: 'vibrant acrylic paint strokes, textured heavy impasto, fluid paint marbling, rich color blending, contemporary expressionist style',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    {
      id: 'med-etching',
      category: 'analog',
      nameKo: '클래식 동판화 에칭',
      emoji: '📜',
      desc: '섬세한 부식선과 빈티지 도서 삽화 기법',
      prefix: 'fine line etching print of',
      suffix: 'classic intaglio copperplate engraving style, intricate hand-etched linework, cross-hatched shadows, sepia ink on aged cotton paper, vintage book illustration',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    { id: 'med-charcoal', category: 'analog', nameKo: '목탄화 & 콩테 소묘', emoji: '⬛', desc: '목탄·콩테로 표현한 드라마틱한 명암 소묘화', prefix: 'charcoal and conté crayon drawing of', suffix: 'dramatic charcoal drawing, rich dark shadows and bright highlights, smudged atmospheric tone, rough textured paper, fine art drawing, classical academic study', group: 'graphic', texture: 'textured', usage: 'brand' },
    { id: 'med-soft-pastel', category: 'analog', nameKo: '소프트 파스텔 일러스트', emoji: '🌸', desc: '부드럽고 따뜻한 파스텔 분필로 그린 일러스트', prefix: 'soft pastel chalk illustration of', suffix: 'hand-drawn soft pastel chalk illustration, blended powdery texture, warm gentle color palette, pastel smudge effect, delicate toned paper background', group: 'graphic', texture: 'textured', usage: 'brand' },
    { id: 'med-lino-print', category: 'analog', nameKo: '리노컷 블록 판화', emoji: '🔲', desc: '리놀리움에 조각하고 찍어낸 굵고 간결한 블록 판화', prefix: 'linocut block print artwork of', suffix: 'bold linocut print, rough carved texture, limited two or three color print, strong graphic block shapes, hand-printed quality, vintage printmaking aesthetic', group: 'graphic', texture: 'textured', usage: 'brand' },
    { id: 'med-collage', category: 'analog', nameKo: '아날로그 혼합 매체 콜라주', emoji: '✂️', desc: '잡지·신문 지면을 오려 붙인 아날로그 콜라주 작품', prefix: 'analog mixed media collage artwork of', suffix: 'hand-cut magazine collage, layered paper scraps, glue texture visible, eclectic composition, vintage newspaper and photo elements, tactile handmade feel', group: 'graphic', texture: 'textured', usage: 'brand' },
    { id: 'med-monotype', category: 'analog', nameKo: '모노타입 프린트', emoji: '🖐️', desc: '판면 위 잉크를 직접 처리해 한 장만 찍어내는 모노타입 판화', prefix: 'monotype print artwork of', suffix: 'unique monotype print impression, painterly ink transfer texture, ghost plate second pull, spontaneous mark-making, one-of-a-kind print quality, organic ink variation', group: 'graphic', texture: 'textured', usage: 'brand' },
    { id: 'med-tempera', category: 'analog', nameKo: '에그 템페라 세밀화', emoji: '🥚', desc: '계란 노른자를 결합재로 쓴 중세 채색 세밀화 기법', prefix: 'egg tempera medieval illuminated illustration of', suffix: 'luminous egg tempera painting, crisp fine hatching, glowing jewel-like colors, gilded gold leaf accents, medieval manuscript illumination quality, meticulous detail', group: 'graphic', texture: 'textured', usage: 'brand' },
    { id: 'med-encaustic', category: 'analog', nameKo: '밀납 앙코스틱 페인팅', emoji: '🕯️', desc: '뜨거운 밀납 물감으로 녹이고 굳혀 층을 쌓는 앙코스틱', prefix: 'encaustic wax painting of', suffix: 'molten beeswax encaustic medium, layered translucent wax, scorched and fused surface texture, embedded pigment and collage elements, warm organic tonality', group: 'graphic', texture: 'textured', usage: 'brand' },
    { id: 'med-marbling', category: 'analog', nameKo: '에브루 물 마블링', emoji: '🌀', desc: '물 위에 그린 패턴을 종이에 옮기는 에브루 마블링 기법', prefix: 'water marbling ebru pattern artwork of', suffix: 'flowing water marbling ebru pattern, swirling ink on water surface transfer, intricate feathered curves, traditional Turkish marble paper, organic color blending', group: 'graphic', texture: 'textured', usage: 'brand' },

    // ==================== 3. 그래픽 & 디자인 (graphic) ====================
    {
      id: 'med-glass',
      category: 'graphic',
      nameKo: '반투명 글래스모피즘',
      emoji: '🔮',
      desc: '네온 그라데이션 위 frosted 유리 패널',
      prefix: 'modern glassmorphism UI concept showing',
      suffix: 'dashboard user interface design presenting data using frosted semi-transparent glass panes, glowing neon gradients illuminating the background, clean layouts',
      group: 'graphic',
      texture: 'clean',
      usage: 'brand'
    },
    {
      id: 'med-flat',
      category: 'graphic',
      nameKo: '플랫 팝 아트 벡터',
      emoji: '🏷️',
      desc: '외곽선이 뚜렷하고 채도가 높은 플랫 디자인',
      prefix: 'flat vector pop art illustration of',
      suffix: 'vibrant flat vector illustration, bold graphic shapes, clean screen print aesthetic, minimal color shading, high contrast outlines, commercial art style',
      group: 'graphic',
      texture: 'clean',
      usage: 'brand'
    },
    {
      id: 'med-neon',
      category: 'graphic',
      nameKo: '미니멀 네온 라인',
      emoji: '🌌',
      desc: '블랙 배경에 네온 시안/핑크 라인 도식화',
      prefix: 'minimalist neon vector graphic of',
      suffix: 'minimalist modern vector graphic, neon outline shapes, dark background, clean flat design, glowing neon cyan and pink accent lines, sleek tech vibe',
      group: 'graphic',
      texture: 'clean',
      usage: 'brand'
    },
    {
      id: 'med-halftone',
      category: 'graphic',
      nameKo: '하프톤 빈티지 코믹',
      emoji: '📰',
      desc: '인쇄용 망점 패턴과 종이 질감',
      prefix: 'vintage comic halftone illustration of',
      suffix: 'classic pulp magazine art, halftone screen dots, vintage off-white paper texture, retro color overlays, ink outline borders, nostalgic print style',
      group: 'graphic',
      texture: 'clean',
      usage: 'brand'
    },
    {
      id: 'med-bauhaus',
      category: 'graphic',
      nameKo: '바우하우스 기하학',
      emoji: '📐',
      desc: '삼원색과 기본 도형의 미니멀 모던 디자인',
      prefix: 'minimalist Bauhaus graphic design of',
      suffix: 'Bauhaus design movement style, primary colors red yellow blue, bold geometric shapes, black grid lines, clean Swiss typography layout aesthetic, vintage cream paper backdrop',
      group: 'graphic',
      texture: 'clean',
      usage: 'brand'
    },
    {
      id: 'med-risograph',
      category: 'graphic',
      nameKo: '리소그래프 질감 프린트',
      emoji: '🖨️',
      desc: '특유의 미세한 도트 잉크 번짐과 레이어 어긋남',
      prefix: 'risograph print of',
      suffix: 'risograph print style, coarse halftone dot grain, ink bleed textures, misaligned color overlay layers, retro vibrant ink colors, warm textured paper',
      group: 'graphic',
      texture: 'clean',
      usage: 'brand'
    },
    {
      id: 'med-cyberpunk-vector',
      category: 'graphic',
      nameKo: '사이버펑크 벡터 그래픽',
      emoji: '💾',
      desc: '미래 도시적이고 기하학적인 테크니컬 데칼 스타일',
      prefix: 'cyberpunk vector graphic UI element of',
      suffix: 'high-tech futuristic decal, hud interface vector elements, neon violet and cyan glow, clean geometric cyber tech aesthetic, dark techno backdrop',
      group: 'graphic',
      texture: 'clean',
      usage: 'brand'
    },
    {
      id: 'med-psychedelic',
      category: 'graphic',
      nameKo: '70년대 사이케델릭',
      emoji: '🌀',
      desc: '왜곡된 물결 라인과 몽환적인 원색 그라데이션',
      prefix: 'psychedelic art graphic of',
      suffix: 'groovy 1970s psychedelic style, melting liquid warp shapes, surreal trippy visuals, high-contrast vibrant retro colors, fluid wavy patterns',
      group: 'graphic',
      texture: 'clean',
      usage: 'brand'
    },
    { id: 'med-duotone', category: 'graphic', nameKo: '듀오톤 포스터 그래픽', emoji: '🎨', desc: '두 가지 강렬한 색상으로 구성된 듀오톤 스크린 인쇄 스타일', prefix: 'bold duotone graphic poster of', suffix: 'high contrast duotone screen print poster, only two vivid ink colors, halftone dot pattern overlay, graphic punch, contemporary music or festival poster aesthetic', group: 'graphic', texture: 'clean', usage: 'brand' },
    { id: 'med-swiss-typography', category: 'graphic', nameKo: '스위스 국제 타이포그래피', emoji: '📐', desc: '헬베티카와 그리드 시스템이 지배하는 스위스 국제 타이포그래픽 스타일', prefix: 'Swiss international typographic style design of', suffix: 'clean Swiss modernist grid layout, Helvetica sans-serif typography, primary color blocks, mathematical white space, International Typographic Style, Müller-Brockmann grid', group: 'graphic', texture: 'clean', usage: 'brand' },
    { id: 'med-retro-poster', category: 'graphic', nameKo: '레트로 빈티지 포스터', emoji: '🗓️', desc: '1940-60년대 인쇄 포스터 질감과 한정 색상 리소 인쇄 스타일', prefix: 'retro vintage graphic poster style of', suffix: 'vintage 1950s poster design, limited color palette Risograph print texture, aged paper patina, hand-lettered display type, mid-century modern illustration', group: 'graphic', texture: 'clean', usage: 'brand' },
    { id: 'med-brutalism-web', category: 'graphic', nameKo: '브루탈리즘 그래픽 디자인', emoji: '⬛', desc: '충돌하는 색상·불규칙 레이아웃의 그래픽 브루탈리즘 디자인', prefix: 'brutalist graphic design layout of', suffix: 'raw brutalist graphic design, clashing colors, intentional asymmetry, thick borders, unconventional bold typography, anti-design aesthetic, contemporary web brutalism', group: 'graphic', texture: 'clean', usage: 'brand' },
    { id: 'med-neon-sign', category: 'graphic', nameKo: '네온사인 글로우 일러스트', emoji: '💡', desc: '어두운 배경 위 빛나는 네온 튜브 사인 스타일 일러스트', prefix: 'neon sign glow illustration of', suffix: 'glowing neon tube sign on dark brick wall, vivid neon color light bleed, retro bar or diner aesthetic, neon lettering and icon graphic, light glow halo effect', group: 'graphic', texture: 'clean', usage: 'brand' },
    { id: 'med-abstract-geo', category: 'graphic', nameKo: '추상 기하 벡터 아트', emoji: '🔺', desc: '다각형과 원이 층위를 이루는 현대 추상 기하 벡터 아트', prefix: 'abstract geometric vector art composition of', suffix: 'modern abstract geometric vector composition, overlapping polygons and circles, gradient mesh fills, contemporary art print style, clean flat geometric abstraction', group: 'graphic', texture: 'clean', usage: 'brand' },
    { id: 'med-art-deco', category: 'graphic', nameKo: '아르데코 장식 일러스트', emoji: '🏛️', desc: '황금·흑색의 기하학적 장식과 대칭 구도의 아르데코 스타일', prefix: 'Art Deco decorative illustration of', suffix: 'elegant Art Deco geometric ornament, gold and black symmetrical motifs, stepped architectural forms, fan sunburst patterns, 1920s jazz age luxury aesthetic', group: 'graphic', texture: 'clean', usage: 'brand' },
    { id: 'med-zine', category: 'graphic', nameKo: '독립 진 DIY 그래픽', emoji: '📄', desc: '포토카피·스테이플러로 만든 독립 진(Zine) DIY 그래픽 감성', prefix: 'DIY zine style graphic layout of', suffix: 'photocopied zine aesthetic, cut-and-paste collage layout, hand-written notes, grainy lo-fi print quality, punk or riot grrl DIY publication design', group: 'graphic', texture: 'clean', usage: 'brand' },

    // ==================== 4. 만화 & 애니메이션 (anime) ====================
    {
      id: 'med-cel-anime',
      category: 'anime',
      nameKo: '레트로 90년대 셀애니',
      emoji: '📼',
      desc: '아날로그 필름 노이즈와 역광 셀화',
      prefix: 'retro 90s anime style illustration of',
      suffix: 'retro 90s anime style screenshot, hand-drawn cel animation aesthetic, soft film grain, analog film lighting, vintage colors, hand-painted background',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    {
      id: 'med-webtoon',
      category: 'anime',
      nameKo: '한국 트렌디 웹툰',
      emoji: '📱',
      desc: '화사한 디지털 그라데이션 하이라이트',
      prefix: 'modern webtoon manhwa illustration of',
      suffix: 'modern webtoon manhwa style, clean digital line art, soft gradient shading, bright trendy highlights, clear high-contrast web comic aesthetic',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    {
      id: 'med-american-comic',
      category: 'anime',
      nameKo: '미국 그래픽 노블',
      emoji: '🇺🇸',
      desc: '굵고 극적인 잉크 드로잉과 강한 명암',
      prefix: 'american graphic novel style drawing of',
      suffix: 'classic american comic book style, bold ink contours, halftone dot textures, retro comic book print quality, dramatic high-contrast ink shading',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    {
      id: 'med-manga',
      category: 'anime',
      nameKo: '흑백 만화 스크린톤',
      emoji: '✒️',
      desc: '스크린톤 망점과 스피드 라인 펜화',
      prefix: 'black and white manga drawing of',
      suffix: 'classic Japanese manga style, detailed black ink drawing, cross-hatching, halftone screentone patterns, high contrast monochrome, serialized manga print quality',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    {
      id: 'med-chibi',
      category: 'anime',
      nameKo: '귀여운 치비 캐릭터',
      emoji: '🧸',
      desc: '이등신 비율의 앙증맞고 단순화된 SD 스타일',
      prefix: 'cute chibi anime style illustration of',
      suffix: 'super deformed chibi style, huge expressive eyes, small simplified body, pastel soft colors, clean digital rendering, friendly sticker art aesthetic',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    {
      id: 'med-ghibli',
      category: 'anime',
      nameKo: '감성 지브리 수채 셀화',
      emoji: '🌲',
      desc: '아날로그 터치의 자연 풍경과 따스한 감성',
      prefix: 'Studio Ghibli style anime illustration of',
      suffix: 'classic Ghibli animation aesthetic, hand-painted lush watercolor background, nostalgic warm lighting, rich natural green and blue tones, retro movie cel',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    {
      id: 'med-cyber-cyberpunk',
      category: 'anime',
      nameKo: '사이버펑크 디스토피아 애니',
      emoji: '🦾',
      desc: '어둡고 정교한 SF 메카닉과 네온 도시 배경',
      prefix: 'cyberpunk sci-fi anime screenshot of',
      suffix: '90s high-tech sci-fi anime style, intricate mechanical details, dark gritty atmosphere, glowing neon wireframes, cyberpunk city rain, cinematic cel shade',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    {
      id: 'med-ink-splatter',
      category: 'anime',
      nameKo: '스플래터 수묵 극화',
      emoji: '🖌️',
      desc: '거친 붓터치와 잉크 튐이 강조된 역동적 화풍',
      prefix: 'dynamic ink splatter manga action scene of',
      suffix: 'action manga style, explosive ink splatters, rough heavy brushstrokes, high-speed motion lines, dramatic black ink wash contrast, high energy aesthetic',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    { id: 'med-shonen', category: 'anime', nameKo: '소년 만화 액션 스타일', emoji: '⚡', desc: '역동적인 포즈와 빛 효과로 가득한 소년 만화 액션 신', prefix: 'shonen action manga scene of', suffix: 'shonen battle manga style, dynamic action pose, speed lines radiating, energy aura glow, expressive shouting face, heroic character design, Naruto or Dragon Ball aesthetic', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-chibi', category: 'anime', nameKo: '치비 캐릭터 일러스트', emoji: '🧸', desc: '큰 머리와 동글동글 몸체의 귀여운 치비 캐릭터 디자인', prefix: 'cute chibi character illustration of', suffix: 'adorable chibi SD character design, oversized round head, stubby tiny body, sparkly big eyes, pastel color palette, kawaii cute illustration style', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-webtoon', category: 'anime', nameKo: '한국 웹툰 스타일', emoji: '📱', desc: '모바일 세로 스크롤에 최적화된 현대 한국 웹툰 컷 스타일', prefix: 'Korean webtoon full-color panel illustration of', suffix: 'modern Korean webtoon style, clean line art with flat cell-shading, vibrant color, vertical scroll panel composition, contemporary manhwa digital illustration', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-anime-bg', category: 'anime', nameKo: '스튜디오 지브리 배경 미술', emoji: '🌿', desc: '섬세한 자연 배경과 따뜻한 빛을 담은 스튜디오 지브리풍 배경 아트', prefix: 'Studio Ghibli style background art of', suffix: 'Studio Ghibli background art, lush detailed environment, soft watercolor tones, warm natural light, idyllic countryside or fantasy town setting, hand-painted quality', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-vintage-anime', category: 'anime', nameKo: '80~90년대 빈티지 셀애니', emoji: '📼', desc: '8-90년대 감성의 필름 노이즈·색 바램 빈티지 셀 애니메이션', prefix: 'vintage 80s 90s cel animation style of', suffix: 'nostalgic 1980s-1990s anime aesthetic, washed-out slightly faded colors, film grain noise, VHS artifact scan lines, vintage Japanese animation quality', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-manhwa-line', category: 'anime', nameKo: '한국 만화 먹선 흑백 스타일', emoji: '✒️', desc: '섬세한 먹선과 스크린톤으로 구성된 클래식 한국 흑백 만화 스타일', prefix: 'Korean black and white manhwa style of', suffix: 'classic Korean manhwa black and white, meticulous ink linework, screentone halftone shading, detailed background, dramatic composition, traditional comic publishing aesthetic', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-cel-shade-3d', category: 'anime', nameKo: '셀 쉐이딩 3D 애니풍', emoji: '🎮', desc: '3D 모델에 셀 쉐이딩을 적용해 2D 애니처럼 보이는 토온 렌더링', prefix: 'cel shading 3D toon render of', suffix: 'cel shaded toon rendering, 3D character with flat cartoon shading, hard shadow edges like 2D animation, outline contour lines, anime-style three-dimensional illustration', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-art-nouveau-illust', category: 'anime', nameKo: '아르누보 유기적 일러스트', emoji: '🌺', desc: '덩굴·꽃·여성을 주제로 한 아르누보 장식 일러스트레이션', prefix: 'Art Nouveau organic decorative illustration of', suffix: 'flowing Art Nouveau decorative illustration, organic plant tendrils and botanical motifs, sinuous line quality, Mucha or Klimt influenced, ornate frame border', group: 'experimental', texture: 'vivid', usage: 'campaign' },

    // ── 추가 만화·애니메이션 프리셋 ──
    { id: 'med-shoujo-sparkle', category: 'anime', nameKo: '소녀 만화 반짝이', emoji: '✨', desc: '빛나는 눈동자·꽃·별이 가득한 순정 만화 소녀 감성', prefix: 'shojo manga sparkle illustration of', suffix: 'classic shojo manga style, large sparkling eyes with star reflections, flower and ribbon motifs, soft pastel watercolor background, delicate screen tone, dreamy romantic mood', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-seinen-dark', category: 'anime', nameKo: '세이넨 리얼 다크', emoji: '⚔️', desc: '묵직한 잉크와 세밀한 근육·명암의 세이넨 다크 판타지', prefix: 'dark seinen manga illustration of', suffix: 'gritty seinen manga style, highly detailed ink rendering, realistic muscle anatomy, heavy shadow crosshatching, dramatic high-contrast black ink, Berserk or Vinland Saga aesthetic', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-mahou-shoujo', category: 'anime', nameKo: '레트로 마법소녀 변신', emoji: '🌙', desc: '반짝이는 변신 시퀀스와 파스텔 마법 이펙트', prefix: 'retro magical girl anime illustration of', suffix: 'classic magical girl transformation sequence, sparkle burst effects, pastel pink and lavender palette, star wand props, shiny ribbon swirls, dreamy 90s Sailor Moon or CCS aesthetic', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-kyoani', category: 'anime', nameKo: '교토 애니메이션 모에', emoji: '🌸', desc: '섬세한 눈동자와 부드러운 그라디언트 음영의 고품질 모에 셀화', prefix: 'KyoAni style high-quality moe anime illustration of', suffix: 'KyoAni production quality, detailed gradient shading on hair, luminous large eyes with complex iris, soft ambient lighting, clean precise digital line art, high-end TV anime finish', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-trigger-bold', category: 'anime', nameKo: '트리거 과장 역동 작화', emoji: '🔥', desc: 'TTGL·킬라킬 느낌의 과장된 포즈와 굵은 윤곽선', prefix: 'Trigger anime studio dynamic style illustration of', suffix: 'bold exaggerated character poses, thick chunky outlines, super-deformed action smear, high-saturation neon colors, off-model expressive distortion, Kill la Kill or Gurren Lagann energy', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-ufotable-glow', category: 'anime', nameKo: '유포터블 이펙트 룩', emoji: '💥', desc: 'Demon Slayer·FGO 스타일 빛나는 마법 이펙트', prefix: 'ufotable anime cinematic illustration of', suffix: 'ufotable production style, volumetric light bloom effects, CG and traditional hybrid rendering, vivid flame and water particle effects, cinematic depth of field, Demon Slayer aesthetic', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-isekailight-novel', category: 'anime', nameKo: '이세계 라노벨 표지 일러스트', emoji: '📚', desc: '라노벨 표지 특유의 선명한 채색과 판타지 주인공 포즈', prefix: 'light novel isekai fantasy cover illustration of', suffix: 'Japanese light novel cover art style, vivid flat digital coloring, protagonist overpowered pose, magical fantasy props, detailed costume design, dynamic title-ready composition', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-vtuber-l2d', category: 'anime', nameKo: '버추얼 유튜버 캐릭터 시트', emoji: '🎙️', desc: 'Live2D용 Vtuber 캐릭터 정면·표정 설정화', prefix: 'VTuber character design illustration of', suffix: 'Vtuber character sheet style, front-facing portrait, expressive large eyes, clean digital anime coloring, distinct virtual streamer costume design, transparent background ready, gacha card quality', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-gacha-card', category: 'anime', nameKo: '가챠 게임 캐릭터 카드', emoji: '🃏', desc: 'Genshin·블루 아카이브풍 SSR 카드 일러스트', prefix: 'gacha mobile game SSR character illustration of', suffix: 'premium gacha game card illustration, highly detailed character portrait, elaborate fantasy or sci-fi costume, dramatic background bloom, Genshin Impact or Blue Archive visual quality', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-jrpg-illust', category: 'anime', nameKo: 'JRPG 게임 일러스트', emoji: '🗡️', desc: 'FF·테일즈 시리즈풍 JRPG 캐릭터 및 장면 일러스트', prefix: 'JRPG game character illustration of', suffix: 'classic JRPG visual style, Yoshitaka Amano or CLAMP inspired, detailed fantasy armor design, dramatic color gradient background, Tales of or Final Fantasy illustration quality', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-pixel-rpg', category: 'anime', nameKo: '16비트 픽셀 RPG 도트', emoji: '👾', desc: '슈퍼패미컴 시대 도트 그래픽 RPG 캐릭터와 배경', prefix: 'retro 16-bit pixel art RPG game scene of', suffix: '16-bit SNES era pixel art style, distinct chunky pixel grid, limited color palette, side-scrolling RPG game tile aesthetic, Super Famicom or Mega Drive game feel', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-horror-manga', category: 'anime', nameKo: '공포 만화 이토 준지풍', emoji: '👁️', desc: '촘촘한 교차선과 왜곡된 얼굴 표정의 공포 만화', prefix: 'Japanese horror manga style illustration of', suffix: 'Junji Ito inspired horror manga, extreme detail crosshatch shading, grotesque body distortion, unsettling expressions, heavy black ink shadows, spiral and skin-crawling motif', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-mecha-design', category: 'anime', nameKo: '메카 로봇 설계도풍', emoji: '🤖', desc: 'Gundam·에반게리온풍 정밀 메카닉 선화', prefix: 'mecha robot anime design illustration of', suffix: 'detailed mechanical mecha design, Gundam or Evangelion aesthetic, precise panel line engineering drawing, metallic surface shading, technical blueprint overlay, super robot proportions', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-kemono-anthro', category: 'anime', nameKo: '케모노 수인 캐릭터', emoji: '🦊', desc: '일본 수인(케모노) 특유의 동물 귀·꼬리 캐릭터 일러스트', prefix: 'kemono anthropomorphic animal character illustration of', suffix: 'Japanese kemono style anthro character, fluffy animal ears and expressive tail, clean digital anime coloring, furry fandom illustration quality, warm character personality design', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-sports-manga', category: 'anime', nameKo: '스포츠 만화 역동 컷', emoji: '⚽', desc: '하이큐·슬램덩크풍 땀방울과 역동적 스포츠 장면', prefix: 'sports shonen manga action panel of', suffix: 'sports manga peak moment capture, extreme dynamic motion blur lines, sweat droplets, intense facial expressions, Haikyuu or Slam Dunk visual energy, crowd roar atmosphere', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-webtoon-romance', category: 'anime', nameKo: '웹툰 로맨스 판타지', emoji: '💕', desc: '화사한 배경 효과와 두근거리는 감정선의 로판 웹툰 스타일', prefix: 'romance fantasy manhwa webtoon illustration of', suffix: 'Korean romance fantasy webtoon panel, delicate pastel bloom background, close-up emotional expression, sparkling ambiance, soft cinematic lighting, popular romfan manhwa digital quality', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-webtoon-dark-action', category: 'anime', nameKo: '웹툰 다크 액션', emoji: '🩸', desc: '어둡고 강렬한 전투 컷과 강한 효과선의 다크 액션 웹툰', prefix: 'dark action manhwa webtoon scene of', suffix: 'dark action manhwa style, dramatic impact effects, intense battle composition, red and black high-contrast palette, Solo Leveling or Tower of God energy, bold digital inking', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-disney-classic', category: 'anime', nameKo: '디즈니 클래식 셀애니', emoji: '🏰', desc: '1940~80년대 손 그림 디즈니 셀 애니메이션 감성', prefix: 'Disney classic cel animation style illustration of', suffix: 'vintage Disney animation quality, hand-drawn cel shading, soft watercolor background, classic fairytale character proportions, 1950s to 1980s Disney aesthetic, warm nostalgic colors', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-disney-modern', category: 'anime', nameKo: '디즈니·픽사 현대 3D', emoji: '🎬', desc: 'Moana·겨울왕국풍 고품질 3D 렌더링 캐릭터', prefix: 'modern Disney Pixar 3D CGI animation style render of', suffix: 'high-end CGI animation quality, subsurface scattering skin, physically accurate hair simulation, expressive large eyes, Moana or Frozen or Encanto visual level, cinema-quality lighting', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-cartoon-network', category: 'anime', nameKo: '카툰 네트워크 어드벤처', emoji: '🍦', desc: 'Adventure Time·스티븐 유니버스풍 단순화된 이모티브 스타일', prefix: 'Cartoon Network indie animation style illustration of', suffix: 'Craig McCracken or Rebecca Sugar inspired cartoon style, simple bold outlines, limited palette with pastel accents, expressive rubbery character design, Adventure Time or Steven Universe aesthetic', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-nickelodeon', category: 'anime', nameKo: '니켈로디언 90s 카툰', emoji: '🟠', desc: '스폰지밥·아바타풍 미국 키즈 카툰 스타일', prefix: 'Nickelodeon cartoon animation style of', suffix: 'classic Nickelodeon TV animation style, bright saturated colors, squash-and-stretch exaggeration, rubberhose character design, playful bold outlines, SpongeBob or Rugrats visual energy', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-french-bd', category: 'anime', nameKo: '프랑스 BD 만화', emoji: '🥐', desc: '탱탱·아스테릭스풍 유럽 BD 특유의 클린 라인과 채색', prefix: 'French European bande dessinée comic illustration of', suffix: 'Franco-Belgian BD comic style, clean ligne claire line art, flat vivid color fills, no crosshatching, Tintin or Asterix inspired character design, European album comic composition', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-moebius', category: 'anime', nameKo: '뫼비우스 SF 그래픽 노블', emoji: '🪐', desc: 'Moebius(뫼비우스) 특유의 세밀한 SF 판타지 펜화', prefix: 'Moebius European sci-fi graphic novel illustration of', suffix: 'Jean Giraud Moebius style, ultra-fine detailed linework, vast sci-fi desert or cosmic landscape, clean crosshatch shading, surreal alien world, Heavy Metal magazine aesthetic', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-adult-animation', category: 'anime', nameKo: '미국 성인 애니메이션', emoji: '🍺', desc: 'Archer·BoJack 스타일 플랫 디자인 성인 카툰', prefix: 'American adult animation flat design illustration of', suffix: 'modern American adult animated series style, clean vector flat color design, simplified geometry character proportions, sharp wit aesthetic, Archer or Futurama or BoJack visual language', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-indie-animation', category: 'anime', nameKo: '인디 독립 애니메이션', emoji: '🎞️', desc: '핸드메이드 느낌의 개성적인 인디 단편 애니메이션 스타일', prefix: 'indie short animation experimental style of', suffix: 'handcrafted indie animation aesthetic, unique personal art style, limited color palette, paper-cut or stop-motion texture, festival animation charm, Don Hertzfeldt or Bill Plympton spirit', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-2000s-flash', category: 'anime', nameKo: '2000년대 플래시 카툰', emoji: '💾', desc: 'Newgrounds·Flash 플레이어 시절 특유의 플래시 애니 감성', prefix: 'early 2000s Flash animation cartoon style of', suffix: 'Newgrounds Flash animation era aesthetic, vector-based flat design, simple mouth and eye animation style, harsh outlines, limited frame count feel, internet nostalgia early web cartoon', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-ukiyoe-manga', category: 'anime', nameKo: '우키요에 현대 만화 퓨전', emoji: '🗻', desc: '호쿠사이 목판화 스타일과 현대 만화를 결합한 퓨전 화풍', prefix: 'ukiyo-e woodblock print manga fusion illustration of', suffix: 'ukiyo-e woodblock print technique merged with manga character design, wave patterning, bold outlines, flat color blocks, Hokusai Great Wave aesthetic, Japanese cultural motif framing', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-manhwa-classical', category: 'anime', nameKo: '한국 고전 순정 만화', emoji: '💐', desc: '1980~90년대 이명진·신일숙풍 고전 한국 순정 만화', prefix: 'classic 1980s-90s Korean sunjung manhwa illustration of', suffix: 'classic Korean sunjung manhwa style, delicate pen linework, long elegant character proportions, intricate floral background, traditional Korean romance drama aesthetic, vintage manhwa print quality', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-tokusatsu-poster', category: 'anime', nameKo: '특촬 히어로 포스터 일러스트', emoji: '🦸', desc: '슈퍼전대·가면라이더풍 특촬 히어로 포스터 스타일', prefix: 'tokusatsu super sentai hero poster illustration of', suffix: 'tokusatsu hero poster art style, bold dynamic hero pose, vivid primary color costume design, Kamen Rider or Super Sentai inspiration, dramatic action background explosion, retro 70s 80s Japanese hero aesthetic', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-doujin-circle', category: 'anime', nameKo: '동인지 감성 소프트 일러스트', emoji: '🌼', desc: '코미케 동인지 커버 특유의 부드럽고 따뜻한 일러스트', prefix: 'doujinshi cover soft anime illustration of', suffix: 'doujin circle indie anime illustration quality, warm soft airbrush shading, gentle pastel gradient background, fan art level character rendering, Comiket cultural aesthetic, heartfelt personal art style', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-anime-eyecatch', category: 'anime', nameKo: 'TV 애니 아이캐치 컷', emoji: '📺', desc: 'TV 애니 중간 아이캐치 특유의 캐릭터 컷 인 스타일', prefix: 'TV anime eyecatch title card illustration of', suffix: 'anime series eyecatch card style, character posing with show title treatment, clean saturated digital coloring, solid color background with logo, classic broadcast anime freeze-frame quality', group: 'experimental', texture: 'vivid', usage: 'campaign' },

    // ==================== 5. 사진 & 실사 (photo) ====================
    {
      id: 'med-film-photo',
      category: 'photo',
      nameKo: '아날로그 필름 사진',
      emoji: '📸',
      desc: '35mm 렌즈 질감과 차분한 아웃포커스',
      prefix: 'authentic film photograph of',
      suffix: 'cinematic analog film photography, 35mm lens, realistic grain, soft lighting, natural colors, authentic depth of field, documentary photograph',
      group: 'photo',
      texture: 'real',
      usage: 'campaign'
    },
    {
      id: 'med-micro-photo',
      category: 'photo',
      nameKo: '현미경 미시 사진',
      emoji: '🔬',
      desc: '전자현미경 특유의 차가운 톤과 극미세 디테일',
      prefix: 'electron microscope scientific macro photograph of',
      suffix: 'advanced electron microscope imaging, monochromatic cyan/blue tinting, extreme close-up details, high scientific magnification, dark lab background',
      group: 'photo',
      texture: 'real',
      usage: 'campaign'
    },
    {
      id: 'med-exposure-photo',
      category: 'photo',
      nameKo: '야간 셔터 장노출',
      emoji: '🌃',
      desc: '시간이 흐르는 빛의 궤적과 장노출 궤선',
      prefix: 'long exposure night photograph of',
      suffix: 'long exposure photography, beautiful light trails, kinetic energy flow, glowing kinetic movements, rich reflections on wet surfaces, dramatic cinematic nighttime lighting',
      group: 'photo',
      texture: 'real',
      usage: 'campaign'
    },
    {
      id: 'med-press-photo',
      category: 'photo',
      nameKo: '현장 보도 사진',
      emoji: '📰',
      desc: '광각 렌즈와 내추럴 라이팅의 다큐멘터리 연출',
      prefix: 'candid press documentary photograph of',
      suffix: 'candid photojournalism style, wide-angle lens, raw natural lighting, realistic environment, unedited documentary aesthetic, high detail story-telling capture',
      group: 'photo',
      texture: 'real',
      usage: 'campaign'
    },
    {
      id: 'med-polaroid',
      category: 'photo',
      nameKo: '빈티지 폴라로이드',
      emoji: '🎞️',
      desc: '테두리가 있는 빈티지 즉석카메라의 색감과 노이즈',
      prefix: 'vintage polaroid instant photo of',
      suffix: 'instant film camera photograph, polaroid white frame border, faded vintage colors, warm light leaks, soft focus, nostalgic film grain',
      group: 'photo',
      texture: 'real',
      usage: 'campaign'
    },
    {
      id: 'med-drone',
      category: 'photo',
      nameKo: '항공 드론 사진',
      emoji: '🚁',
      desc: '상공에서 수직으로 내려다보는 대칭과 격자 구도',
      prefix: 'aerial drone photograph of',
      suffix: 'top-down bird-eye view, symmetrical landscape patterns, high-altitude perspective, crisp daylight, professional outdoor photography',
      group: 'photo',
      texture: 'real',
      usage: 'campaign'
    },
    {
      id: 'med-thermal',
      category: 'photo',
      nameKo: '적외선 열화상 카메라',
      emoji: '🌡️',
      desc: '온도 차이를 보여주는 강렬한 열화상 색상',
      prefix: 'infrared thermographic thermal imaging of',
      suffix: 'thermal vision color scale, neon orange yellow hot areas, blue violet cold areas, scientific heat mapping visual, dark tech environment',
      group: 'photo',
      texture: 'real',
      usage: 'campaign'
    },
    {
      id: 'med-macro',
      category: 'photo',
      nameKo: '물방울 극세사 접사',
      emoji: '💧',
      desc: '초근접 매크로 렌즈로 담은 이슬과 반사광',
      prefix: 'ultra-macro photography of',
      suffix: 'extreme close-up macro photo, crystal-clear water droplet reflections, shallow depth of field, sharp detail texture focus, soft glowing bokeh background',
      group: 'photo',
      texture: 'real',
      usage: 'campaign'
    },
    { id: 'med-film-grain', category: 'photo', nameKo: '필름 그레인 아날로그 사진', emoji: '🎞️', desc: '코닥·후지 필름 특유의 풍부한 그레인과 색감을 가진 필름 사진', prefix: 'analog film grain photography of', suffix: 'Kodak or Fuji film grain texture, authentic film stock color cast, slight vignetting, natural halation around highlights, vintage analog photography warmth', group: 'photo', texture: 'real', usage: 'campaign' },
    { id: 'med-tilt-shift', category: 'photo', nameKo: '틸트시프트 미니어처 효과', emoji: '🔭', desc: '틸트시프트 렌즈로 실제 장면을 미니어처처럼 보이게 하는 사진', prefix: 'tilt-shift miniature effect photography of', suffix: 'tilt-shift lens effect making real scene look like a tiny miniature model, selective focus blur bands, bright saturated colors, bird-eye overhead view', group: 'photo', texture: 'real', usage: 'campaign' },
    { id: 'med-high-key', category: 'photo', nameKo: '하이키 화이트 스튜디오', emoji: '⬜', desc: '전체가 밝고 그림자가 거의 없는 하이키 화이트 스튜디오 사진', prefix: 'high-key bright white studio photography of', suffix: 'high-key studio photography, bright overexposed background, soft shadowless lighting, clean white infinity curve, pure bright commercial photography aesthetic', group: 'photo', texture: 'real', usage: 'campaign' },
    { id: 'med-hdr-landscape', category: 'photo', nameKo: 'HDR 풍경 사진', emoji: '🌄', desc: '밝은 부분과 어두운 부분 모두 디테일이 살아있는 HDR 풍경 사진', prefix: 'HDR landscape photography of', suffix: 'high dynamic range HDR landscape, brilliant saturated sky, rich shadow detail, tone-mapped radiant quality, scenic nature vista, award-winning landscape photography', group: 'photo', texture: 'real', usage: 'campaign' },
    { id: 'med-night-portrait', category: 'photo', nameKo: '야간 보케 인물 사진', emoji: '🌙', desc: '야경 빛망울을 배경으로 담은 매혹적인 야간 인물 보케 사진', prefix: 'night portrait bokeh photography of', suffix: 'night portrait with beautiful city bokeh background, large aperture lens bokeh blur, warm street light orbs, cinematic night photography, f1.4 or f1.8 aesthetic', group: 'photo', texture: 'real', usage: 'campaign' },
    { id: 'med-editorial-color', category: 'photo', nameKo: '시네마틱 컬러 그레이딩', emoji: '🎬', desc: '영화 색보정 LUT을 적용한 시네마틱 컬러 그레이딩 사진', prefix: 'cinematic color graded photography of', suffix: 'professional cinematic color grading, desaturated shadows with warm highlights, split toning, film LUT aesthetic, movie still quality photography, Hollywood grade', group: 'photo', texture: 'real', usage: 'campaign' },
    { id: 'med-infrared', category: 'photo', nameKo: '적외선 IR 사진', emoji: '🌿', desc: '식물이 흰색으로 빛나는 신비로운 적외선(IR) 사진', prefix: 'infrared photography of', suffix: 'infrared IR photography, glowing white foliage, dramatic dark sky, ethereal dreamlike landscape, converted camera or IR filter, surreal monochrome or false color', group: 'photo', texture: 'real', usage: 'campaign' },
    { id: 'med-double-exposure', category: 'photo', nameKo: '이중 노출 합성 사진', emoji: '👻', desc: '두 이미지를 겹쳐 몽환적인 이중 노출 합성 효과를 낸 사진', prefix: 'double exposure composite photography of', suffix: 'creative double exposure blend of two subjects, ghost overlay transparency, merged silhouette with nature or cityscape, artistic in-camera multiple exposure', group: 'photo', texture: 'real', usage: 'campaign' },

    // ==================== 6. 핸드메이드 & 실물 공예 (craft) ====================
    {
      id: 'med-origami',
      category: 'craft',
      nameKo: '입체 종이접기',
      emoji: '📄',
      desc: '종이를 정밀하게 접은 주름과 겹쳐진 그림자',
      prefix: 'origami paper craft of',
      suffix: 'origami paper craft style, clean paper folds, creased geometric shapes, layered matte paper textures, soft drop shadows, minimalist craft aesthetic',
      group: 'craft',
      texture: 'tactile',
      usage: 'campaign'
    },
    {
      id: 'med-felt',
      category: 'craft',
      nameKo: '펠트 양모 인형',
      emoji: '🐑',
      desc: '양모를 찔러 만든 뽀송뽀송하고 따뜻한 섬유 질감',
      prefix: 'needle felted wool craft of',
      suffix: 'needle felted wool craft style, fuzzy fibrous texture, soft warm woolen fibers, cute handmade toy aesthetic, soft diffuse studio lighting',
      group: 'craft',
      texture: 'tactile',
      usage: 'campaign'
    },
    {
      id: 'med-papercut',
      category: 'craft',
      nameKo: '다층 페이퍼 커팅',
      emoji: '✂️',
      desc: '컷팅된 종이판을 여러 겹 쌓아 만든 입체 터널',
      prefix: 'multi-layered papercut shadowbox art of',
      suffix: 'layered papercraft art, 3D shadowbox effect, sharp cut paper edges, backlit glowing layers, distinct depth and shadows between paper sheets',
      group: 'craft',
      texture: 'tactile',
      usage: 'campaign'
    },
    {
      id: 'med-embroidery',
      category: 'craft',
      nameKo: '정교한 손자수',
      emoji: '🧵',
      desc: '천 위에 한 땀 한 땀 놓은 정교한 실과 바느질 패턴',
      prefix: 'detailed needlework embroidery of',
      suffix: 'handmade embroidery art, colorful thread stitches, textured linen canvas backdrop, tight sewing patterns, satin stitches, realistic textile craft',
      group: 'craft',
      texture: 'tactile',
      usage: 'campaign'
    },
    {
      id: 'med-diorama',
      category: 'craft',
      nameKo: '미니어처 디오라마',
      emoji: '🛖',
      desc: '축소판 모형 정원이나 정밀 미니어처 세트',
      prefix: 'miniature diorama model of',
      suffix: 'miniature diorama model, tiny handcrafted details, fake synthetic moss, small plastic figurines, tilt-shift camera lens effect, studio showcase lighting',
      group: 'craft',
      texture: 'tactile',
      usage: 'campaign'
    },
    {
      id: 'med-stainedglass',
      category: 'craft',
      nameKo: '성당 스테인드글라스',
      emoji: '⛪',
      desc: '검은 납선 테두리와 오색 찬란한 반투명 유리',
      prefix: 'stained glass mosaic window depicting',
      suffix: 'intricate stained glass window pattern, colorful translucent glass pieces, bold dark lead lines, glowing light shining through glass, colorful reflections',
      group: 'craft',
      texture: 'tactile',
      usage: 'campaign'
    },
    {
      id: 'med-ceramic',
      category: 'craft',
      nameKo: '유약 도자기 세라믹',
      emoji: '🏺',
      desc: '매끄럽게 반짝이는 유약 광택과 자연스러운 크랙',
      prefix: 'glazed ceramic pottery sculpture of',
      suffix: 'hand-crafted glazed ceramic, glossy pottery finish, subtle crackle glaze texture, organic pottery shapes, studio lighting, smooth tactile surface',
      group: 'craft',
      texture: 'tactile',
      usage: 'campaign'
    },
    {
      id: 'med-leather',
      category: 'craft',
      nameKo: '핸드메이드 가죽 카빙',
      emoji: '💼',
      desc: '천연 가죽 위에 새긴 음양 각인과 정교한 바느질선',
      prefix: 'tooled leather craft embossing of',
      suffix: 'hand-tooled tanned leather, intricate embossed patterns, thick saddle stitching, realistic rich brown leather grain, polished burnished edges',
      group: 'craft',
      texture: 'tactile',
      usage: 'campaign'
    },
    { id: 'med-pottery-craft', category: 'craft', nameKo: '도예 & 세라믹 공예', emoji: '🏺', desc: '물레 위에서 빚어지는 도자기와 유약 발색의 도예 공예', prefix: 'handcrafted ceramic pottery of', suffix: 'handmade wheel-thrown ceramic pottery, natural ash glaze drips, kiln marks, organic clay body texture, artisan pottery studio, earthy ceramic craft', group: 'craft', texture: 'tactile', usage: 'campaign' },
    { id: 'med-macrame', category: 'craft', nameKo: '마크라메 & 섬유 공예', emoji: '🧵', desc: '매듭과 짜임으로 만드는 보헤미안 마크라메 섬유 공예', prefix: 'macrame fiber art textile of', suffix: 'handmade macrame wall hanging, intricate knotted cotton cord, bohemian natural fiber textile, wooden dowel, geometric knot pattern, warm earthy tones', group: 'craft', texture: 'tactile', usage: 'campaign' },
    { id: 'med-wood-carving', category: 'craft', nameKo: '목공예 & 조각', emoji: '🪵', desc: '나무결을 살린 목공예 조각과 손으로 깎은 목기 공예품', prefix: 'handcrafted wood carving artwork of', suffix: 'hand-carved wooden sculpture, visible gouge marks and wood grain, natural timber texture, artisan woodworking craft, warm studio lighting on wood', group: 'craft', texture: 'tactile', usage: 'campaign' },
    { id: 'med-embroidery', category: 'craft', nameKo: '자수 & 퀼트 직물 공예', emoji: '🪡', desc: '실로 수놓은 정밀한 자수와 퀼트 패턴 직물 공예 작품', prefix: 'hand embroidery and quilting textile art of', suffix: 'detailed hand embroidery thread work on fabric, colorful cross-stitch or satin stitch, quilted fabric layers, tactile stitched textile craftsmanship', group: 'craft', texture: 'tactile', usage: 'campaign' },
    { id: 'med-glass-blowing', category: 'craft', nameKo: '유리 블로잉 공예', emoji: '🔮', desc: '뜨거운 용융 유리를 불어 빚는 유리 공예 블로잉 작품', prefix: 'glass blowing art craft of', suffix: 'hand-blown art glass sculpture, vibrant translucent colors, organic flowing form, glassblower at furnace, Murano or studio glass craft aesthetic', group: 'craft', texture: 'tactile', usage: 'campaign' },
    { id: 'med-jewelry-craft', category: 'craft', nameKo: '주얼리 & 금속 공예', emoji: '💍', desc: '섬세한 금속 세공과 원석이 결합된 핸드메이드 주얼리 공예', prefix: 'handcrafted jewelry metalwork of', suffix: 'handmade fine jewelry with precious stone setting, goldsmith metalwork, bezel or prong setting, hammered metal surface texture, studio artisan jewelry craft', group: 'craft', texture: 'tactile', usage: 'campaign' },
    { id: 'med-felt', category: 'craft', nameKo: '펠트 & 양모 공예', emoji: '🐑', desc: '바늘 또는 물로 펠트를 만들어 형태를 빚는 양모 공예', prefix: 'wool felt needle felting sculpture of', suffix: 'needle felted wool sculpture, soft fluffy fiber texture, bright natural dye colors, organic rounded forms, artisan wool felting craft, playful tactile quality', group: 'craft', texture: 'tactile', usage: 'campaign' },
    { id: 'med-papercraft', category: 'craft', nameKo: '종이 조형 & 오리가미', emoji: '📐', desc: '정교하게 접고 자르고 쌓아 만든 종이 조형 예술', prefix: 'paper sculpture and origami art of', suffix: 'intricate paper sculpture or complex origami, crisp geometric folds, layered paper dimension, white or colored paper, precise paper engineering art', group: 'craft', texture: 'tactile', usage: 'campaign' },

    // ==================== 7. 공공 & 보고서 (official) ====================
    {
      id: 'med-whitepaper',
      category: 'official',
      nameKo: '화이트 정책 인포그래픽',
      emoji: '📄',
      desc: '깔끔한 흰 배경의 전문 정책·보고서 스타일',
      prefix: 'clean professional policy infographic illustration of',
      suffix: 'clean white background, professional government report style, flat design icons, structured data visualization, formal typography, official document aesthetic',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'proposal'
    },
    {
      id: 'med-official-photo',
      category: 'official',
      nameKo: '공공기관 공식 홍보사진',
      emoji: '📸',
      desc: '행사·시설·인물 중심의 공식 기관 사진 스타일',
      prefix: 'official institutional documentary photography of',
      suffix: 'official government photography style, professional composition, well-lit indoor or outdoor institutional setting, clean formal atmosphere, press release photo quality',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'proposal'
    },
    {
      id: 'med-report-diagram',
      category: 'official',
      nameKo: '정책 보고서 다이어그램',
      emoji: '🗂️',
      desc: '순서도·관계도·프레임워크 구조를 담은 보고서형 다이어그램',
      prefix: 'professional policy report diagram visualization of',
      suffix: 'policy document diagram style, flowchart, relationship nodes and arrows, muted corporate color palette, clean precise lines, formal report quality layout',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'proposal'
    },
    {
      id: 'med-annual-report',
      category: 'official',
      nameKo: '연차보고서 커버 디자인',
      emoji: '📒',
      desc: '메탈릭·엠보 느낌의 고급 연차보고서 표지 스타일',
      prefix: 'premium annual report cover design featuring',
      suffix: 'annual report cover, elegant corporate layout, dark navy or gold accent color, embossed logo, subtle gradient, high-end print finish, premium institutional design',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'proposal'
    },
    {
      id: 'med-presentation-slide',
      category: 'official',
      nameKo: '정책 프레젠테이션 슬라이드',
      emoji: '📊',
      desc: '공공 보고·국회 보고 수준의 정식 PPT 비주얼',
      prefix: 'professional government presentation slide design showing',
      suffix: 'clean policy presentation slide, structured title and body hierarchy, supporting icons, formal navy and white color theme, readable institutional typography',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'proposal'
    },
    {
      id: 'med-data-journalism',
      category: 'official',
      nameKo: '데이터 저널리즘 인포그래픽',
      emoji: '📰',
      desc: '언론·연구기관 수준의 데이터 기반 시각적 인포그래픽',
      prefix: 'editorial data journalism infographic illustration of',
      suffix: 'editorial infographic style, magazine or research journal quality, clear data visualization charts, bold readable typography, factual illustration, clear legend and source',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'proposal'
    },

    // ==================== 8. 게임 & 픽셀 (game) ====================
    {
      id: 'med-pixel-retro',
      category: 'game',
      nameKo: '레트로 8비트 픽셀아트',
      emoji: '👾',
      desc: 'NES/패미컴 시대의 8비트 픽셀 게임 그래픽',
      prefix: '8-bit pixel art game graphic of',
      suffix: 'retro 8-bit pixel art, NES Famicom game graphics style, limited 16-color palette, chunky square pixels, vintage game cartridge aesthetic, scanline effect',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    {
      id: 'med-pixel-16bit',
      category: 'game',
      nameKo: '16비트 SNES 스프라이트',
      emoji: '🕹️',
      desc: 'SNES/메가드라이브 시대의 섬세한 16비트 픽셀 아트',
      prefix: '16-bit SNES era pixel art of',
      suffix: '16-bit Super Nintendo pixel art style, detailed sprite work, rich scrolling background, vibrant game palette, retro JRPG or platformer aesthetic',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    {
      id: 'med-concept-fantasy',
      category: 'game',
      nameKo: '판타지 컨셉아트',
      emoji: '⚔️',
      desc: '영화·게임급 웅장한 판타지 세계관 컨셉 일러스트',
      prefix: 'epic cinematic fantasy concept art of',
      suffix: 'cinematic fantasy concept art, dramatic volumetric lighting, rich painterly textures, detailed world-building environment, film or AAA game production quality illustration',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    {
      id: 'med-game-hud',
      category: 'game',
      nameKo: '게임 UI HUD 인터페이스',
      emoji: '🎯',
      desc: 'SF 게임의 투명 패널·레이더·상태바 HUD 스타일',
      prefix: 'futuristic game HUD interface overlay showing',
      suffix: 'science fiction game HUD overlay, transparent glass panels with glowing status bars, radar minimap display, objective markers, ammo counter, immersive AR game interface',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    {
      id: 'med-synthwave',
      category: 'game',
      nameKo: '신스웨이브 레트로퓨처',
      emoji: '🌅',
      desc: '80년대 감성의 네온 그리드·크롬 반사·VHS 효과',
      prefix: 'synthwave retro-futuristic scene of',
      suffix: 'synthwave aesthetic, neon pink and electric cyan perspective grid, retrowave sunset gradient, 80s retro-futurism, chrome reflection, VHS scan lines, purple starry night sky',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    {
      id: 'med-vaporwave',
      category: 'game',
      nameKo: '베이퍼웨이브 미학',
      emoji: '🌸',
      desc: '90년대 향수의 파스텔 글리치·대리석·야자수',
      prefix: 'vaporwave aesthetic scene of',
      suffix: 'vaporwave art style, pastel pink and lavender purple, glitch displacement, retro 90s computer graphics aesthetic, marble busts, palm trees, nostalgic internet visual culture',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    {
      id: 'med-concept-scifi',
      category: 'game',
      nameKo: 'SF 하드서피스 컨셉아트',
      emoji: '🛸',
      desc: '리얼한 하드서피스 디자인의 SF 컨셉 일러스트',
      prefix: 'detailed hard-surface sci-fi concept art of',
      suffix: 'highly detailed science fiction concept art, realistic hard surface industrial design, cinematic dramatic rim lighting, matte painting quality, AAA game or film production art',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    {
      id: 'med-gacha-card',
      category: 'game',
      nameKo: '가챠 카드 캐릭터 일러스트',
      emoji: '✨',
      desc: '화려한 코스튬과 이펙트의 모바일 RPG 카드 일러스트',
      prefix: 'detailed mobile gacha game character card illustration of',
      suffix: 'high quality gacha game character card art, vivid saturated colors, intricate ornate costume details, dynamic pose, sparkle particle effects, mobile RPG fantasy card illustration',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    { id: 'med-mobile-game-ui', category: 'game', nameKo: '모바일 게임 UI 아트', emoji: '📱', desc: '모바일 게임의 화려한 HUD·버튼·팝업 UI 일러스트 스타일', prefix: 'mobile game UI art design of', suffix: 'colorful mobile game user interface art, ornate button frames, gem and coin counter HUD, decorative popup panel, fantasy RPG or idle game UI style', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-concept-game', category: 'game', nameKo: '게임 환경 콘셉트 아트', emoji: '🗺️', desc: 'AAA 게임 제작용 상세한 게임 환경 콘셉트 아트', prefix: 'AAA game environment concept art of', suffix: 'detailed game environment concept art, painterly texture, atmospheric perspective, rich world-building detail, environment art for RPG or action game production', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-moba-splash', category: 'game', nameKo: 'MOBA 캐릭터 스플래시 아트', emoji: '⚡', desc: '리그 오브 레전드 스타일의 화려한 MOBA 스플래시 스킨 아트', prefix: 'MOBA champion splash art illustration of', suffix: 'MOBA champion splash art, League of Legends or DOTA style, epic character reveal, dramatic pose with signature ability effect, rich cinematic illustration', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-tactical-map', category: 'game', nameKo: '전술 게임 맵 아이소메트릭', emoji: '🗺️', desc: '전략 게임의 아이소메트릭 지형과 유닛이 배치된 전술 맵', prefix: 'tactical strategy game isometric map of', suffix: 'isometric tactical game map, detailed terrain tiles, unit token positions, resource nodes, fog of war edge, classic strategy game visual, Civ or XCOM aesthetic', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-boss-monster', category: 'game', nameKo: '보스 몬스터 디자인', emoji: '👹', desc: '압도적인 크기와 공포감을 주는 게임 최종 보스 몬스터 일러스트', prefix: 'epic game boss monster character design of', suffix: 'imposing game boss monster, enormous silhouette with glowing weak points, intimidating creature design, dark fantasy or sci-fi aesthetic, dramatic confrontation lighting', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-side-scroll-bg', category: 'game', nameKo: '사이드스크롤 게임 배경', emoji: '🌆', desc: '메트로이드바니아 스타일의 사이드스크롤 2D 게임 배경', prefix: 'side-scrolling 2D game background environment of', suffix: '2D side-scroll game background, parallax layer environment, detailed platform game level art, Metroidvania atmospheric setting, pixel or illustrated style', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-3d-game-scene', category: 'game', nameKo: '3D 게임 씬 렌더링', emoji: '🎮', desc: '실제 게임 엔진 수준의 고품질 3D 게임 씬 렌더링', prefix: 'photorealistic 3D game scene rendering of', suffix: 'high fidelity game scene Unreal Engine quality render, global illumination, PBR materials, detailed props and environment, AAA game production screenshot', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-character-sheet', category: 'game', nameKo: '캐릭터 시트 & 턴어라운드', emoji: '🧑', desc: '전면·측면·후면 포즈가 담긴 게임 캐릭터 디자인 시트', prefix: 'game character design sheet turnaround of', suffix: 'character design sheet with front side back turnaround views, model sheet annotations, color palette chips, expression sheet, game production character bible page', group: 'experimental', texture: 'vivid', usage: 'campaign' },

    // ==================== 9. 전통 & 판화 (trad) ====================
    {
      id: 'med-minhwa',
      category: 'trad',
      nameKo: '한국 민화',
      emoji: '🐯',
      desc: '십장생·호랑이·모란 등 길상 도상의 조선 민화 스타일',
      prefix: 'Korean traditional folk painting minhwa style of',
      suffix: 'Korean minhwa folk painting, bold flat decorative colors, symbolic auspicious motifs, lotus and tiger patterns, hanji paper texture, Joseon dynasty folk art aesthetic',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    {
      id: 'med-ukiyoe',
      category: 'trad',
      nameKo: '우키요에 목판화',
      emoji: '🗻',
      desc: '호쿠사이·히로시게 풍의 일본 전통 목판 인쇄',
      prefix: 'Japanese ukiyo-e woodblock print of',
      suffix: 'ukiyo-e woodblock print style, flat color planes, bold black outlines, Hokusai or Hiroshige inspired, Japanese wave or mountain motifs, washi paper texture',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    {
      id: 'med-chinese-inkwash',
      category: 'trad',
      nameKo: '중국 수묵화',
      emoji: '🎋',
      desc: '붓 하나로 표현하는 여백의 미, 동양 수묵 산수화',
      prefix: 'Chinese ink wash painting shuimohua of',
      suffix: 'Chinese ink wash painting, monochromatic black ink gradients, expressive spontaneous brushstrokes, negative empty space composition, rice paper texture, mountainscape or bamboo subject',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    {
      id: 'med-linocut',
      category: 'trad',
      nameKo: '리노컷 판화',
      emoji: '🖨️',
      desc: '날카로운 조각도 흔적이 살아있는 고대비 판화 스타일',
      prefix: 'linocut relief print artwork of',
      suffix: 'linocut printmaking style, bold relief print texture, high contrast black and limited color, hand-carved gouge marks, rough handmade texture, expressionist printmaking',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    {
      id: 'med-art-deco',
      category: 'trad',
      nameKo: '아르데코 포스터',
      emoji: '🏆',
      desc: '1920년대 황금·흑색의 기하학적 럭셔리 아르데코',
      prefix: 'Art Deco style poster design of',
      suffix: 'Art Deco poster design, geometric symmetry and radial patterns, gold and black glamour palette, angular stylized figures, 1920s luxury art nouveau border ornaments',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    {
      id: 'med-vintage-poster',
      category: 'trad',
      nameKo: '빈티지 레트로 포스터',
      emoji: '✈️',
      desc: '1950년대 미국 상업 일러스트의 여행 포스터 스타일',
      prefix: 'vintage retro travel poster design of',
      suffix: 'vintage 1950s travel poster illustration, limited flat color lithograph printing, bold sans-serif typography, retro advertising aesthetic, aged paper texture, sun-faded colors',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    {
      id: 'med-constructivism',
      category: 'trad',
      nameKo: '러시아 구성주의',
      emoji: '⭐',
      desc: '대각선 역동성과 적·흑 원색의 소비에트 구성주의 포스터',
      prefix: 'Soviet Russian constructivist poster design of',
      suffix: 'Russian constructivism poster, bold geometric shapes and diagonal compositions, red black and white primary palette, dynamic avant-garde typography, 1920s Soviet propaganda art style',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    {
      id: 'med-korean-calligraphy',
      category: 'trad',
      nameKo: '한국 서예·캘리그라피',
      emoji: '🖌️',
      desc: '먹빛 붓터치의 힘찬 한글·한자 서예 서체',
      prefix: 'Korean calligraphy ink brush art featuring',
      suffix: 'Korean calligraphic brushwork, expressive ink strokes on white hanji paper, traditional East Asian ink art, brush tip variations, meditative empty space composition, elegant sumi ink quality',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    { id: 'med-serigraphy', category: 'trad', nameKo: '실크스크린 판화 인쇄', emoji: '🖼️', desc: '스크린을 통해 잉크를 찍어내는 팝아트 실크스크린 판화', prefix: 'silkscreen serigraphy print art of', suffix: 'silkscreen serigraphy print, layered flat ink colors with slight misregistration, screen printing texture, Andy Warhol Pop Art aesthetic, bold graphic image', group: 'graphic', texture: 'textured', usage: 'brand' },
    { id: 'med-woodblock', category: 'trad', nameKo: '동아시아 목판화', emoji: '🪵', desc: '전통 동아시아 목판화의 힘찬 선각과 흑백 프린트', prefix: 'traditional East Asian woodblock print of', suffix: 'traditional East Asian woodblock print, bold carved lines on white paper, stark black ink impression, ukiyo-e or Korean traditional print aesthetic, tactile textured surface', group: 'graphic', texture: 'textured', usage: 'brand' },
    { id: 'med-risograph', category: 'trad', nameKo: '리소그라프 인쇄 질감', emoji: '📑', desc: '두 색상이 겹쳐 번지는 리소그라프 특유의 질감 인쇄', prefix: 'Risograph print texture style illustration of', suffix: 'Risograph printing texture, limited two ink color overlap with slight misalignment, grain texture, flat color areas with organic variation, indie zine publication quality', group: 'graphic', texture: 'textured', usage: 'brand' },
    { id: 'med-stencil-graffiti', category: 'trad', nameKo: '스텐실 그래피티 아트', emoji: '🎭', desc: 'Banksy식 스텐실 기법의 거리 그래피티 아트', prefix: 'stencil graffiti street art of', suffix: 'Banksy-style stencil spray paint street art, crisp cut stencil edges, industrial brick wall surface, limited color spray aerosol, urban street graffiti art', group: 'graphic', texture: 'textured', usage: 'brand' },
    { id: 'med-mosaic-art', category: 'trad', nameKo: '모자이크 타일 아트', emoji: '🏛️', desc: '작은 타일이나 조각으로 만든 비잔틴·현대 모자이크 아트', prefix: 'mosaic tile art artwork of', suffix: 'colorful mosaic tile artwork, small tesserae pieces forming image, Byzantine or Roman mosaic style, visible grout lines, vibrant ceramic or glass tile fragments', group: 'graphic', texture: 'textured', usage: 'brand' },
    { id: 'med-letterpress', category: 'trad', nameKo: '레터프레스 활판 인쇄', emoji: '🔡', desc: '활자판을 종이에 압인하는 레터프레스 인쇄의 깊은 인상감', prefix: 'letterpress printing style typography of', suffix: 'letterpress printing impression, deep ink deboss on thick cotton paper, antique metal type or woodtype, vintage print shop aesthetic, tactile letterpress quality', group: 'graphic', texture: 'textured', usage: 'brand' },
    { id: 'med-folk-art', category: 'trad', nameKo: '민화 & 민속 공예 아트', emoji: '🌺', desc: '다양한 문화권의 전통 민화와 민속 공예 장식 일러스트', prefix: 'traditional folk art illustration of', suffix: 'vibrant folk art illustration, bold flat colors, traditional cultural motifs, repetitive decorative pattern, naive art quality, global folk art tradition from various cultures', group: 'graphic', texture: 'textured', usage: 'brand' },
    { id: 'med-copperplate-illust', category: 'trad', nameKo: '동판 세밀 식물 박물화', emoji: '🌿', desc: '18세기 박물관 수준의 동판화 동식물 세밀 일러스트', prefix: 'copper engraving botanical or scientific illustration of', suffix: 'antique copperplate engraving botanical illustration, cross-hatched fine line scientific drawing, historical natural history museum print, encyclopedic specimen plate quality', group: 'graphic', texture: 'textured', usage: 'brand' },

    // ==================== 10. 추상 & 실험 (abstract) ====================
    {
      id: 'med-glitch',
      category: 'abstract',
      nameKo: '글리치 디지털 아트',
      emoji: '📺',
      desc: 'RGB 분리·픽셀 오류·VHS 노이즈의 디지털 글리치',
      prefix: 'digital glitch art of',
      suffix: 'glitch art aesthetic, displaced pixel scanlines, RGB color channel separation, VHS tape error artifacts, digital data corruption visual noise, cyberpunk error screen aesthetic',
      group: 'experimental',
      texture: 'vivid',
      usage: 'brand'
    },
    {
      id: 'med-generative',
      category: 'abstract',
      nameKo: '제너레이티브 알고리즘 아트',
      emoji: '🔢',
      desc: '수학 알고리즘이 만들어내는 파티클·커브·패턴',
      prefix: 'generative algorithmic art visualization of',
      suffix: 'generative algorithm art, mathematical parametric curves and spirals, flowing particle field systems, code-generated visual complexity, Processing or p5.js aesthetic, infinite pattern',
      group: 'experimental',
      texture: 'vivid',
      usage: 'brand'
    },
    {
      id: 'med-abstract-expr',
      category: 'abstract',
      nameKo: '추상 표현주의',
      emoji: '🎆',
      desc: '폴록·로스코 풍의 감정적 드립페인팅·컬러필드',
      prefix: 'abstract expressionist painting of',
      suffix: 'abstract expressionist large canvas painting, gestural expressive brushstrokes, emotional color field layers, drip paint technique, Jackson Pollock or Mark Rothko inspired, raw energy',
      group: 'experimental',
      texture: 'vivid',
      usage: 'brand'
    },
    {
      id: 'med-optical-illusion',
      category: 'abstract',
      nameKo: '옵아트 착시',
      emoji: '👁️',
      desc: '바사렐리 풍의 눈이 움직이는 기하학적 착시 패턴',
      prefix: 'Op Art optical illusion geometric pattern of',
      suffix: 'Op Art visual illusion, precise geometric tessellation repetition, vibrating visual motion patterns, high contrast black and white or complementary colors, Vasarely kinetic vision effect',
      group: 'experimental',
      texture: 'vivid',
      usage: 'brand'
    },
    {
      id: 'med-fractal',
      category: 'abstract',
      nameKo: '프랙탈 수학 아트',
      emoji: '🌀',
      desc: '만델브로트·줄리아 집합의 무한 재귀 수학적 아름다움',
      prefix: 'fractal mathematical art visualization of',
      suffix: 'fractal art, infinitely recursive geometric self-similar patterns, Mandelbrot or Julia set mathematics, vibrant color gradient depth mapping, digital infinite zoom aesthetic',
      group: 'experimental',
      texture: 'vivid',
      usage: 'brand'
    },
    {
      id: 'med-collage',
      category: 'abstract',
      nameKo: '혼합 매체 콜라주',
      emoji: '✂️',
      desc: '잡지·신문·수채화가 뒤섞인 컨템포러리 콜라주',
      prefix: 'mixed media collage artwork of',
      suffix: 'mixed media collage, torn magazine paper fragments, newspaper clippings, watercolor paint washes, hand-drawn ink elements, overlapping layered textures, contemporary zine art aesthetic',
      group: 'experimental',
      texture: 'vivid',
      usage: 'brand'
    },
    {
      id: 'med-psychedelic-art',
      category: 'abstract',
      nameKo: '사이키델릭 비전 아트',
      emoji: '🌈',
      desc: '1960년대 히피 문화의 과포화·소용돌이·환각 비주얼',
      prefix: 'psychedelic visionary art of',
      suffix: 'psychedelic art, oversaturated swirling color vortex, 1960s hippie poster aesthetic, hallucination-inspired optical effects, distorted organic patterns, neon rainbow spectrum',
      group: 'experimental',
      texture: 'vivid',
      usage: 'brand'
    },
    {
      id: 'med-kinetic-pattern',
      category: 'abstract',
      nameKo: '키네틱 패턴 모션 그래픽',
      emoji: '💠',
      desc: '규칙적 운동감을 주는 기하 패턴의 모션 그래픽 정지 프레임',
      prefix: 'kinetic motion graphic pattern design of',
      suffix: 'kinetic geometric motion graphic still frame, repeating tessellated shapes with implied movement, gradient color transitions, contemporary graphic design poster, clean vector art',
      group: 'experimental',
      texture: 'vivid',
      usage: 'brand'
    },
    { id: 'med-color-field', category: 'abstract', nameKo: '컬러 필드 페인팅', emoji: '🎨', desc: '마크 로스코 풍의 대형 색면으로 감성을 전달하는 추상화', prefix: 'color field abstract painting of', suffix: 'large format color field painting, luminous color planes with soft edges, meditative atmospheric color, Mark Rothko or Helen Frankenthaler influenced, emotional color resonance', group: 'experimental', texture: 'vivid', usage: 'brand' },
    { id: 'med-suprematism', category: 'abstract', nameKo: '절대주의 기하 추상', emoji: '⬛', desc: '말레비치 절대주의의 순수한 기하 형태와 흰 공간의 추상 구성', prefix: 'Suprematist geometric abstract composition of', suffix: 'Suprematist geometric abstraction, pure flat shapes on white ground, Malevich-inspired composition, square rectangle circle diagonal elements, absolute geometric purity', group: 'experimental', texture: 'vivid', usage: 'brand' },
    { id: 'med-op-art', category: 'abstract', nameKo: '옵아트 착시 패턴', emoji: '👁️', desc: '브리짓 라일리 식의 눈이 착각을 일으키는 옵아트 패턴', prefix: 'op art optical illusion pattern of', suffix: 'Op Art optical illusion pattern, Bridget Riley-style undulating lines or grid, vibrating visual effect, black and white or complementary color, perceptual motion illusion', group: 'experimental', texture: 'vivid', usage: 'brand' },
    { id: 'med-abstract-expr', category: 'abstract', nameKo: '추상 표현주의 행위 회화', emoji: '🖌️', desc: '캔버스에 물감을 뿌리고 떨어뜨리는 잭슨 폴록식 행위 추상화', prefix: 'abstract expressionist action painting of', suffix: 'abstract expressionist action painting, dripped and thrown paint, gestural mark-making, Jackson Pollock or Franz Kline influenced, raw energy impasto textures', group: 'experimental', texture: 'vivid', usage: 'brand' },
    { id: 'med-data-art', category: 'abstract', nameKo: '데이터 아트 시각화', emoji: '📡', desc: '대규모 데이터셋을 아름다운 패턴으로 변환한 데이터 아트', prefix: 'data art visualization artwork of', suffix: 'generative data art visualization, beautiful pattern from large dataset, network graph constellation, circular data diagram aesthetics, data points forming visual poetry', group: 'experimental', texture: 'vivid', usage: 'brand' },
    { id: 'med-glitch-art', category: 'abstract', nameKo: '글리치 & 데이터모싱 아트', emoji: '📺', desc: 'JPEG 압축 오류·픽셀 밴딩을 예술로 승화한 글리치 아트', prefix: 'glitch art databending artifact of', suffix: 'digital glitch art with JPEG compression artifacts, pixel sorting bands, RGB color channel shift, datamoshing visual distortion, intentional digital error aesthetic', group: 'experimental', texture: 'vivid', usage: 'brand' },
    { id: 'med-light-art', category: 'abstract', nameKo: '라이트 아트 광선 설치', emoji: '💡', desc: '레이저·LED 광선으로 공간을 채운 라이트 아트 설치 작품', prefix: 'light art installation artwork of', suffix: 'light art installation with laser beams or LED strips, volumetric light in fog or dark space, geometric light sculpture, immersive light art environment, James Turrell style', group: 'experimental', texture: 'vivid', usage: 'brand' },
    { id: 'med-algorithmic-art', category: 'abstract', nameKo: '알고리즘 생성 아트', emoji: '🔢', desc: '코드와 수학 공식으로 생성된 컴퓨터 알고리즘 제너레이티브 아트', prefix: 'algorithmic generative art pattern of', suffix: 'computer generated algorithmic art, mathematical formula visualization, Perlin noise or fractal iteration pattern, code-based creative visual, generative art system output', group: 'experimental', texture: 'vivid', usage: 'brand' },

    // ==================== 11. 건축 & 공간 (arch) ====================
    {
      id: 'med-arch-render',
      category: 'arch',
      nameKo: '건축 3D 렌더링',
      emoji: '🏛️',
      desc: 'V-Ray 급 포토리얼 건축 시각화 렌더링',
      prefix: 'photorealistic architectural 3D rendering of',
      suffix: 'photorealistic architectural visualization, modern building materials glass and concrete, dramatic sky backdrop with clouds, landscape context, V-Ray or Lumion rendering quality, professional CGI',
      group: 'render3d',
      texture: 'clean',
      usage: 'proposal'
    },
    {
      id: 'med-blueprint',
      category: 'arch',
      nameKo: '청사진 설계 도면',
      emoji: '📐',
      desc: '파란 배경 위 흰 선의 정밀 건축·기계 설계도',
      prefix: 'technical blueprint schematic drawing of',
      suffix: 'detailed architectural blueprint on deep blue background, precise white technical drawing lines, floor plan or elevation view, measurement dimension annotations, engineering technical drawing style',
      group: 'render3d',
      texture: 'clean',
      usage: 'proposal'
    },
    {
      id: 'med-interior-viz',
      category: 'arch',
      nameKo: '인테리어 공간 시각화',
      emoji: '🛋️',
      desc: '따뜻한 조명과 프리미엄 소재의 인테리어 렌더링',
      prefix: 'luxury interior design space visualization of',
      suffix: 'photorealistic interior design visualization, warm ambient and accent lighting, premium natural materials and furniture, contemporary Scandinavian or Japanese style, architectural digest quality',
      group: 'render3d',
      texture: 'clean',
      usage: 'proposal'
    },
    {
      id: 'med-urban-planning',
      category: 'arch',
      nameKo: '도시 계획 조감도',
      emoji: '🗺️',
      desc: '조감시점의 마스터플랜 GIS 도시계획 비주얼',
      prefix: 'urban planning master plan aerial visualization of',
      suffix: 'urban planning bird-eye aerial view, master plan visualization with green spaces and building footprints, road network grid, GIS-style colorful city block plan, contemporary urban design',
      group: 'render3d',
      texture: 'clean',
      usage: 'proposal'
    },
    {
      id: 'med-section-drawing',
      category: 'arch',
      nameKo: '건축 단면도 일러스트',
      emoji: '🔍',
      desc: '건물을 자른 단면에서 내부 층별 공간을 보여주는 컷어웨이',
      prefix: 'architectural cross-section cutaway illustration of',
      suffix: 'detailed architectural cross-section cutaway illustration, multiple floor layers visible, warm interior ambient lighting, miniature people silhouettes for scale, colorful technical illustration style',
      group: 'render3d',
      texture: 'clean',
      usage: 'proposal'
    },
    {
      id: 'med-landscape-arch',
      category: 'arch',
      nameKo: '조경 식재 설계 렌더링',
      emoji: '🌳',
      desc: '수목·수경·보행로가 어우러진 조경 설계 시각화',
      prefix: 'landscape architecture design rendering of',
      suffix: 'landscape architecture rendering, lush green planting design with specimen trees, walking paths and water features, public park or plaza setting, soft natural golden hour lighting',
      group: 'render3d',
      texture: 'clean',
      usage: 'proposal'
    },
    {
      id: 'med-heritage-drawing',
      category: 'arch',
      nameKo: '문화유산 복원 일러스트',
      emoji: '🏯',
      desc: '역사적 고증을 바탕으로 복원된 문화재 건축 일러스트',
      prefix: 'heritage architecture historical reconstruction illustration of',
      suffix: 'heritage building reconstruction illustration, traditional architecture period-accurate details, watercolor and technical line art combination, educational historical illustration quality',
      group: 'render3d',
      texture: 'clean',
      usage: 'proposal'
    },
    {
      id: 'med-space-planning',
      category: 'arch',
      nameKo: '공간 배치 평면 계획도',
      emoji: '📏',
      desc: '가구·구역이 색상으로 구분된 탑뷰 공간 배치 계획도',
      prefix: 'interior space planning top-view diagram of',
      suffix: 'clean interior floor plan layout, top-view space planning diagram, furniture arrangement, color-coded functional zones, minimalist professional line drawing, space planning illustration',
      group: 'render3d',
      texture: 'clean',
      usage: 'proposal'
    },
    { id: 'med-parametric-arch', category: 'arch', nameKo: '파라메트릭 건축 외관', emoji: '🌀', desc: '알고리즘으로 생성된 파라메트릭 건축 외피 디자인 렌더링', prefix: 'parametric architecture facade rendering of', suffix: 'parametric facade design with algorithmic pattern, Zaha Hadid or Bjarke Ingels influenced, flowing curved geometry, computational design architecture, CGI visualization', group: 'render3d', texture: 'clean', usage: 'proposal' },
    { id: 'med-biophilic-arch', category: 'arch', nameKo: '바이오필릭 녹색 건축', emoji: '🌿', desc: '식물과 건축이 통합된 바이오필릭 지속가능 건물 렌더링', prefix: 'biophilic green architecture rendering of', suffix: 'biophilic architecture with integrated living plants, green wall and rooftop garden, sustainable building design, nature-integrated architecture, LEED-style eco building visualization', group: 'render3d', texture: 'clean', usage: 'proposal' },
    { id: 'med-adaptive-reuse', category: 'arch', nameKo: '적응적 재사용 리노베이션', emoji: '🏭', desc: '공장·창고를 문화공간으로 재탄생시킨 리노베이션 건축 도면', prefix: 'adaptive reuse renovation architectural drawing of', suffix: 'adaptive reuse renovation design, industrial building converted to cultural space, before-after architectural contrast, exposed brick and modern intervention, heritage adaptive transformation', group: 'render3d', texture: 'clean', usage: 'proposal' },
    { id: 'med-arch-diagram', category: 'arch', nameKo: '건축 개념 다이어그램', emoji: '📊', desc: '설계 개념을 시각화한 버블 다이어그램과 axonometric 분해도', prefix: 'architectural concept diagram of', suffix: 'architectural concept diagram with bubble zones and circulation arrows, design process visualization, axonometric exploded diagram, conceptual architectural communication drawing', group: 'render3d', texture: 'clean', usage: 'proposal' },
    { id: 'med-night-arch', category: 'arch', nameKo: '야경 건축 비주얼', emoji: '🌙', desc: '야간 조명과 반사를 강조한 고급 건축 야경 렌더링', prefix: 'architectural night visualization of', suffix: 'dramatic nighttime architectural visualization, interior light glow and reflections, twilight sky, luxury building exterior night render, ambient atmospheric lighting quality', group: 'render3d', texture: 'clean', usage: 'proposal' },
    { id: 'med-urban-masterplan', category: 'arch', nameKo: '도시 마스터플랜 조감도', emoji: '🗺️', desc: '도시 개발 구역 전체를 조감하는 3D 마스터플랜 렌더링', prefix: 'urban masterplan aerial view of', suffix: 'urban masterplan 3D aerial visualization, city block development overview, mixed-use district planning, green spaces and streets layout, planning proposal bird-eye view', group: 'render3d', texture: 'clean', usage: 'proposal' },
    { id: 'med-interior-render', category: 'arch', nameKo: '인테리어 포토리얼 렌더', emoji: '🛋️', desc: '건축 인테리어의 자연광과 소재를 사실적으로 표현한 렌더링', prefix: 'photorealistic interior architectural render of', suffix: 'photorealistic interior architectural render, natural daylight through windows, material texture quality wood concrete glass, lifestyle interior photography style, 3ds Max or V-Ray quality', group: 'render3d', texture: 'clean', usage: 'proposal' },
    { id: 'med-timber-arch', category: 'arch', nameKo: '목구조 노출 건축 도면', emoji: '🪵', desc: 'CLT·글루램 목구조가 노출된 구조 아름다움을 표현한 건축 도면', prefix: 'exposed timber structure architectural drawing of', suffix: 'exposed timber structure architecture, CLT cross-laminated timber or glulam beams, mass timber construction aesthetic, structural wood beauty, Scandinavian or Japanese timber architecture style', group: 'render3d', texture: 'clean', usage: 'proposal' },

    // ── editorial ──────────────────────────────────────────────
    {
      id: 'med-fashion-illust',
      category: 'editorial',
      nameKo: '패션 일러스트레이션',
      emoji: '👗',
      desc: '보그 스타일 하이패션 잡지 일러스트',
      prefix: 'high fashion editorial illustration of',
      suffix: 'elegant fashion illustration, Vogue editorial style, elongated figure, haute couture garment details, chic color palette, contemporary fashion art, ink and watercolor mixed media',
      group: 'graphic',
      texture: 'glossy',
      usage: 'brand'
    },
    {
      id: 'med-luxury-mag',
      category: 'editorial',
      nameKo: '럭셔리 매거진 레이아웃',
      emoji: '📰',
      desc: '고급 인쇄물 느낌의 에디토리얼 레이아웃 사진',
      prefix: 'luxury editorial magazine layout photograph of',
      suffix: 'premium editorial photography, luxury magazine double spread, tasteful typography overlay, sophisticated product or lifestyle, moody studio lighting, award-winning ad campaign quality',
      group: 'graphic',
      texture: 'glossy',
      usage: 'brand'
    },
    {
      id: 'med-beauty-ad',
      category: 'editorial',
      nameKo: '뷰티 광고 사진',
      emoji: '💄',
      desc: '피부·질감 강조의 하이엔드 뷰티 광고 비주얼',
      prefix: 'high-end beauty advertising campaign photo of',
      suffix: 'professional beauty advertising photography, flawless skin texture macro, clean white or gradient background, dramatic rim lighting, luxury cosmetics editorial aesthetic, retouched campaign quality',
      group: 'graphic',
      texture: 'glossy',
      usage: 'brand'
    },
    {
      id: 'med-sports-illust',
      category: 'editorial',
      nameKo: '스포츠 다이나믹 일러스트',
      emoji: '⚡',
      desc: '동세 강조의 스포츠 에너지 일러스트레이션',
      prefix: 'dynamic sports editorial illustration of',
      suffix: 'high energy sports illustration, bold motion lines and dynamic pose, graphic flat color blocking, ESPN magazine or Nike ad aesthetic, strong contrast and impactful composition',
      group: 'graphic',
      texture: 'glossy',
      usage: 'brand'
    },
    {
      id: 'med-childrens-book',
      category: 'editorial',
      nameKo: '아동 동화책 일러스트',
      emoji: '📚',
      desc: '따뜻하고 동글동글한 아동 그림책 스타일',
      prefix: 'charming children\'s picture book illustration of',
      suffix: 'whimsical children\'s book illustration, soft pastel color palette, cute rounded character design, warm friendly atmosphere, gouache or digital flat art style, storytelling picture book quality',
      group: 'graphic',
      texture: 'glossy',
      usage: 'brand'
    },
    {
      id: 'med-portrait-editorial',
      category: 'editorial',
      nameKo: '에디토리얼 인물 포트레이트',
      emoji: '🎭',
      desc: '캐릭터의 개성을 살린 잡지풍 인물 초상화',
      prefix: 'editorial portrait photography of',
      suffix: 'striking editorial portrait, strong personality and character expression, creative lighting setup, shallow depth of field with blurred background, magazine cover quality photography',
      group: 'graphic',
      texture: 'glossy',
      usage: 'brand'
    },
    {
      id: 'med-food-editorial',
      category: 'editorial',
      nameKo: '푸드 에디토리얼 사진',
      emoji: '🍽️',
      desc: '요리책·잡지 수준의 아티스틱 음식 사진',
      prefix: 'artistic food editorial photography of',
      suffix: 'styled food editorial photography, natural side or overhead light, organic linen or dark marble surface, deliberate food styling with garnish, cookbook or fine dining magazine aesthetic',
      group: 'graphic',
      texture: 'glossy',
      usage: 'brand'
    },
    {
      id: 'med-lifestyle-photo',
      category: 'editorial',
      nameKo: '라이프스타일 브랜드 사진',
      emoji: '🌿',
      desc: '일상 속 감성을 담은 생활 브랜드 스타일 사진',
      prefix: 'authentic lifestyle brand photography of',
      suffix: 'candid lifestyle brand photography, natural warm ambient light, relatable authentic moment, light airy color grading, subtle brand product integration, Instagram or Kinfolk magazine aesthetic',
      group: 'graphic',
      texture: 'glossy',
      usage: 'brand'
    },
    { id: 'med-luxury-product', category: 'editorial', nameKo: '럭셔리 제품 스틸 광고', emoji: '💎', desc: '고급 조명과 소재 질감을 강조한 럭셔리 제품 광고 사진', prefix: 'luxury product advertising photograph of', suffix: 'luxury product still-life advertisement, dramatic studio lighting with gold or silver accent, high-end material texture, perfume or jewelry catalog aesthetic, premium brand campaign visual', group: 'graphic', texture: 'glossy', usage: 'brand' },
    { id: 'med-sports-editorial', category: 'editorial', nameKo: '스포츠 액션 에디토리얼', emoji: '⚡', desc: '역동적인 움직임의 순간을 포착한 스포츠 에디토리얼 사진', prefix: 'dynamic sports editorial photography of', suffix: 'high-speed sports editorial photograph, peak action moment frozen, motion blur background, dramatic low angle or top view, sport magazine double-page spread quality', group: 'graphic', texture: 'glossy', usage: 'brand' },
    { id: 'med-beauty-campaign', category: 'editorial', nameKo: '뷰티 캠페인 비주얼', emoji: '💄', desc: '색상 테마와 감성이 통일된 뷰티 캠페인 화보 이미지', prefix: 'beauty campaign editorial visual of', suffix: 'beauty brand campaign photograph, cohesive color theme and mood, close-up skin or makeup texture, glossy editorial lighting, Vogue or Elle beauty spread aesthetic', group: 'graphic', texture: 'glossy', usage: 'brand' },
    { id: 'med-travel-editorial', category: 'editorial', nameKo: '여행 & 문화 에디토리얼', emoji: '✈️', desc: '장소의 감성을 전달하는 여행 잡지 스타일 사진', prefix: 'travel and culture editorial photography of', suffix: 'travel editorial photography, sense of place and local culture, golden hour or blue hour lighting, cinematic composition, Condé Nast Traveler or Monocle magazine style', group: 'graphic', texture: 'glossy', usage: 'brand' },
    { id: 'med-corporate-portrait', category: 'editorial', nameKo: '비즈니스 인물 사진', emoji: '👔', desc: '전문성과 개성을 동시에 표현하는 기업 인물 화보', prefix: 'corporate editorial portrait photography of', suffix: 'corporate editorial portrait, professional yet approachable expression, environmental context background, studio or office natural light, LinkedIn or annual report quality headshot', group: 'graphic', texture: 'glossy', usage: 'brand' },
    { id: 'med-architecture-editorial', category: 'editorial', nameKo: '건축 공간 에디토리얼', emoji: '🏛️', desc: '건축 잡지 수준의 공간 에디토리얼 사진', prefix: 'architectural editorial photography of', suffix: 'architectural editorial photograph, Wallpaper or Dezeen magazine quality, wide angle interior or exterior, precise geometric composition, natural light and material texture', group: 'graphic', texture: 'glossy', usage: 'brand' },
    { id: 'med-conceptual-fashion', category: 'editorial', nameKo: '컨셉추얼 패션 화보', emoji: '🎭', desc: '예술과 패션이 융합된 컨셉추얼 아트 방향의 패션 화보', prefix: 'conceptual art fashion editorial of', suffix: 'conceptual fashion editorial, art direction with strong visual metaphor, avant-garde styling and setting, narrative-driven fashion story, high art fashion boundary-pushing visual', group: 'graphic', texture: 'glossy', usage: 'brand' },
    { id: 'med-social-content', category: 'editorial', nameKo: '소셜 미디어 비주얼 콘텐츠', emoji: '📱', desc: 'Instagram·TikTok 바이럴에 최적화된 소셜 콘텐츠 비주얼', prefix: 'social media visual content of', suffix: 'social media optimized visual content, high engagement aesthetics for Instagram or TikTok, bold graphic or satisfying composition, trendy color palette, shareable visual hook design', group: 'graphic', texture: 'glossy', usage: 'brand' },

    // ── digital_paint ──────────────────────────────────────────
    {
      id: 'med-photobash',
      category: 'digital_paint',
      nameKo: '포토배싱 합성 일러스트',
      emoji: '🖼️',
      desc: '실사 사진과 페인팅을 혼합한 SF/판타지 합성 일러스트',
      prefix: 'photobashing concept art illustration of',
      suffix: 'photobashing concept art, seamless blend of real photo textures and digital painting, sci-fi or fantasy environment, dramatic cinematic composition, AAA game concept art quality',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    {
      id: 'med-digital-impasto',
      category: 'digital_paint',
      nameKo: '디지털 임파스토 페인팅',
      emoji: '🎨',
      desc: '두꺼운 물감 질감을 재현한 디지털 유화 기법',
      prefix: 'digital impasto thick oil painting of',
      suffix: 'digital impasto painting style, heavily textured brushstrokes mimicking thick oil paint, visible palette knife marks, rich tactile surface quality, contemporary fine art digital painting',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    {
      id: 'med-matte-painting',
      category: 'digital_paint',
      nameKo: '매트 페인팅 배경 아트',
      emoji: '🌌',
      desc: '영화 VFX에 쓰이는 실사 합성 배경 매트 페인팅',
      prefix: 'cinematic matte painting background of',
      suffix: 'professional matte painting, photorealistic background environment, film VFX quality, seamless integration of painted and photographic elements, epic scale environment, movie production background art',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    {
      id: 'med-concept-sketch',
      category: 'digital_paint',
      nameKo: '콘셉트 스케치 드로잉',
      emoji: '✏️',
      desc: '디자이너의 초기 아이디어를 담은 러프 콘셉트 스케치',
      prefix: 'professional concept design sketch of',
      suffix: 'rough concept design sketch, gestural line work with quick value blocking, loose exploratory drawing, product or character or environment concept, industrial design or game art sketchbook style',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    {
      id: 'med-speed-paint',
      category: 'digital_paint',
      nameKo: '스피드 페인팅 환경 아트',
      emoji: '⚡',
      desc: '빠르고 에너지 넘치는 스피드 페인팅 환경 묘사',
      prefix: 'dynamic speed painting of',
      suffix: 'expressive speed painting, bold confident brushstrokes, dramatic lighting and atmospheric color, ArtStation environment concept style, energetic loose but skilled technique, 60-minute painting quality',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    {
      id: 'med-3d-paint-hybrid',
      category: 'digital_paint',
      nameKo: '3D+페인팅 하이브리드 아트',
      emoji: '🔮',
      desc: '3D 베이스에 디지털 페인팅 오버페인트 혼합 아트',
      prefix: 'stylized 3D and digital painting hybrid artwork of',
      suffix: '3D base rendered then overpainted digitally, hybrid rendering style, painterly textures over 3D geometry, semi-realistic stylized aesthetic, high production quality art',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    {
      id: 'med-noise-texture',
      category: 'digital_paint',
      nameKo: '노이즈 텍스처 추상화',
      emoji: '🌊',
      desc: '그레인·노이즈 텍스처로 표현한 현대 추상 디지털 아트',
      prefix: 'noise grain texture abstract digital art of',
      suffix: 'modern noise grain texture art, heavy film grain overlay, abstract color field with rich texture, muted or deep color palette, contemporary digital art print quality, tactile noise surface',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    {
      id: 'med-digital-ink',
      category: 'digital_paint',
      nameKo: '디지털 잉크 선화 일러스트',
      emoji: '🖊️',
      desc: '선의 굵기 변화와 먹빛을 살린 디지털 잉크 드로잉',
      prefix: 'expressive digital ink line illustration of',
      suffix: 'bold digital ink illustration, varied line weight brushwork, high contrast black ink on white or textured paper, graphic novel or manga-influenced, expressive gestural line quality',
      group: 'graphic',
      texture: 'textured',
      usage: 'brand'
    },
    { id: 'med-environment-concept', category: 'digital_paint', nameKo: '환경 컨셉 아트', emoji: '🌄', desc: '게임·영화용 실외·실내 환경 컨셉 아트 페인팅', prefix: 'environment concept art digital painting of', suffix: 'environment concept art for game or film, atmospheric perspective depth, detailed environment storytelling, professional concept art studio quality, lighting mood and color script', group: 'graphic', texture: 'textured', usage: 'brand' },
    { id: 'med-creature-design', category: 'digital_paint', nameKo: '크리처 & 몬스터 디자인', emoji: '🐉', desc: '해부학적 디테일을 갖춘 판타지 크리처 디자인 시트', prefix: 'creature monster design illustration of', suffix: 'creature design digital painting, anatomically considered fantasy creature, multiple angle turnaround or action pose, detailed surface texture scales fur or carapace, professional creature artist style', group: 'graphic', texture: 'textured', usage: 'brand' },
    { id: 'med-character-concept', category: 'digital_paint', nameKo: '캐릭터 컨셉 디자인 시트', emoji: '🧝', desc: '복식·표정 변형 등 캐릭터 디자인 시트 전체 구성', prefix: 'character concept design sheet of', suffix: 'character concept design sheet with multiple views and expressions, costume detail callouts, color palette chip, professional game or animation character art bible style', group: 'graphic', texture: 'textured', usage: 'brand' },
    { id: 'med-sci-fi-matte', category: 'digital_paint', nameKo: 'SF 매트 페인팅 배경', emoji: '🚀', desc: '우주·미래도시·외계 행성 SF 매트 페인팅 배경', prefix: 'sci-fi matte painting digital art of', suffix: 'science fiction matte painting, futuristic cityscape or alien planet landscape, cinematic widescreen composition, photo-real scale and atmosphere, Hollywood VFX concept quality', group: 'graphic', texture: 'textured', usage: 'brand' },
    { id: 'med-book-cover-art', category: 'digital_paint', nameKo: '소설 표지 디지털 일러스트', emoji: '📚', desc: '판타지·SF·로맨스 소설 표지용 고품질 디지털 일러스트', prefix: 'book cover digital illustration of', suffix: 'professional novel book cover illustration, genre-appropriate atmospheric composition, dramatic lighting and hero focal point, publishable cover art quality, fantasy or sci-fi or romance genre', group: 'graphic', texture: 'textured', usage: 'brand' },
    { id: 'med-storyboard', category: 'digital_paint', nameKo: '영상 스토리보드 드로잉', emoji: '🎬', desc: '영화·CF·애니메이션 스토리보드 판넬 드로잉 세트', prefix: 'film storyboard illustration panel of', suffix: 'film or animation storyboard panels, cinematic composition with camera angle notes, rough sketch with clear action and staging, professional storyboard artist style', group: 'graphic', texture: 'textured', usage: 'brand' },
    { id: 'med-graphic-novel', category: 'digital_paint', nameKo: '그래픽 노블 아트', emoji: '💥', desc: '연속 페이지 형식의 그래픽 노블 스타일 디지털 컬러 아트', prefix: 'graphic novel page art of', suffix: 'graphic novel page layout with panels, dynamic sequential storytelling, bold outline with flat or cel-shade color, high contrast drama, Western or European comic art style', group: 'graphic', texture: 'textured', usage: 'brand' },
    { id: 'med-fan-art', category: 'digital_paint', nameKo: '팬아트 & 트리뷰트 일러스트', emoji: '⭐', desc: '팝컬처 아이콘을 재해석한 팬아트 디지털 페인팅', prefix: 'fan art tribute digital painting of', suffix: 'fan art digital painting, iconic pop culture reinterpretation, polished rendering with original artistic spin, detailed character or scene illustration, trending art community style', group: 'graphic', texture: 'textured', usage: 'brand' },

    // ── ui_ux ───────────────────────────────────────────────────
    {
      id: 'med-app-dashboard',
      category: 'ui_ux',
      nameKo: '앱 대시보드 목업',
      emoji: '📊',
      desc: '데이터 시각화가 포함된 SaaS 앱 대시보드 UI 목업',
      prefix: 'clean app dashboard UI mockup of',
      suffix: 'modern SaaS app dashboard mockup, clean card-based layout, data visualization charts and KPI metrics, professional color-coded interface, light or dark mode, high-fidelity UI design',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'explainer'
    },
    {
      id: 'med-wireframe',
      category: 'ui_ux',
      nameKo: '와이어프레임 UX 설계도',
      emoji: '⬜',
      desc: '그레이스케일 박스 와이어프레임 UX 레이아웃',
      prefix: 'UX wireframe layout design of',
      suffix: 'low-fidelity wireframe design, grayscale placeholder boxes and lines, clear information hierarchy layout, annotation labels, clean UX process diagram, Figma or Sketch wireframe style',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'explainer'
    },
    {
      id: 'med-gamification-ui',
      category: 'ui_ux',
      nameKo: '게이미피케이션 UI 디자인',
      emoji: '🏆',
      desc: '뱃지·레벨·포인트를 품은 게이미피케이션 앱 UI',
      prefix: 'gamification app UI design of',
      suffix: 'engaging gamification UI design, achievement badges and level progress bars, reward system visual hierarchy, colorful motivational design language, mobile app interface quality',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'explainer'
    },
    {
      id: 'med-glassmorphism',
      category: 'ui_ux',
      nameKo: '글래스모피즘 UI',
      emoji: '🪟',
      desc: '반투명 블러 카드의 글래스모피즘 트렌드 UI',
      prefix: 'glassmorphism UI design of',
      suffix: 'modern glassmorphism UI, frosted glass card panels with blur effect, soft gradient background, subtle white border highlight, floating elements with depth, contemporary design trend',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'explainer'
    },
    {
      id: 'med-neumorphism',
      category: 'ui_ux',
      nameKo: '뉴모피즘 UI',
      emoji: '⚪',
      desc: '소프트 그림자로 볼록한 느낌을 주는 뉴모피즘 UI',
      prefix: 'neumorphism soft UI design of',
      suffix: 'neumorphism UI design, soft extruded button and card elements, dual shadow technique light and shadow, monochromatic muted color palette, tactile skeuomorphic-digital hybrid style',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'explainer'
    },
    {
      id: 'med-dark-mode-app',
      category: 'ui_ux',
      nameKo: '다크모드 앱 인터페이스',
      emoji: '🌙',
      desc: '세련된 다크 테마의 모바일/웹 앱 인터페이스',
      prefix: 'elegant dark mode app interface design of',
      suffix: 'sophisticated dark mode app interface, near-black background with subtle surface layers, vibrant accent color highlights, clean typography hierarchy, professional dark theme UI design',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'explainer'
    },
    {
      id: 'med-data-viz-infographic',
      category: 'ui_ux',
      nameKo: '데이터 시각화 인포그래픽',
      emoji: '📈',
      desc: '데이터를 스토리로 전달하는 에디토리얼 인포그래픽',
      prefix: 'editorial data visualization infographic of',
      suffix: 'professional data visualization infographic, clear chart and diagram hierarchy, brand color-coded data categories, readable typography with annotations, NYT or Bloomberg data journalism style',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'explainer'
    },
    {
      id: 'med-system-arch-diagram',
      category: 'ui_ux',
      nameKo: '시스템 아키텍처 다이어그램',
      emoji: '🔧',
      desc: '클라우드·마이크로서비스 구조를 도식화한 기술 다이어그램',
      prefix: 'clean system architecture diagram of',
      suffix: 'professional system architecture diagram, microservice or cloud infrastructure, color-coded service blocks with connection arrows, AWS or GCP icon style, clean technical diagram on white background',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'explainer'
    },
    { id: 'med-onboarding-flow', category: 'ui_ux', nameKo: '온보딩 플로우 UI', emoji: '🎯', desc: '신규 사용자 온보딩 스텝 화면 구성 UI 목업', prefix: 'user onboarding flow UI screen design of', suffix: 'mobile or web onboarding flow screens, step progress indicator, friendly illustration and clear CTA button, clean minimal design, Figma prototype style presentation', group: 'uiinfo', texture: 'clean', usage: 'explainer' },
    { id: 'med-e-commerce-ui', category: 'ui_ux', nameKo: '이커머스 쇼핑 UI', emoji: '🛒', desc: '상품 목록·상세·결제 흐름을 포함한 이커머스 UI 디자인', prefix: 'e-commerce shopping app UI design of', suffix: 'e-commerce product listing and detail page UI, clean card grid layout, trust badges and CTA button design, mobile-first responsive, Shopify or Apple store aesthetic', group: 'uiinfo', texture: 'clean', usage: 'explainer' },
    { id: 'med-design-system', category: 'ui_ux', nameKo: '디자인 시스템 컴포넌트', emoji: '🧱', desc: '버튼·폼·타이포그래피 등 디자인 시스템 컴포넌트 라이브러리 시트', prefix: 'design system component library sheet of', suffix: 'UI design system component sheet, button states and variants, form element collection, typography scale, color palette swatches, professional Figma design system documentation style', group: 'uiinfo', texture: 'clean', usage: 'explainer' },
    { id: 'med-landing-page-ui', category: 'ui_ux', nameKo: '랜딩페이지 히어로 UI', emoji: '🚀', desc: '전환율 최적화를 고려한 SaaS 랜딩페이지 히어로 섹션 UI', prefix: 'SaaS landing page hero section UI design of', suffix: 'SaaS product landing page hero section, headline and subhead with clear value proposition, hero product screenshot or illustration, CTA button and social proof, conversion-optimized design', group: 'uiinfo', texture: 'clean', usage: 'explainer' },
    { id: 'med-mobile-notification', category: 'ui_ux', nameKo: '모바일 알림 & 마이크로 인터렉션', emoji: '🔔', desc: '푸시 알림·토스트·로딩 등 모바일 마이크로인터렉션 UI 시트', prefix: 'mobile micro-interaction UI design of', suffix: 'mobile micro-interaction design sheet, push notification card, toast message, loading spinner and skeleton, subtle animation state UI, polished mobile app UX detail design', group: 'uiinfo', texture: 'clean', usage: 'explainer' },
    { id: 'med-auth-ui', category: 'ui_ux', nameKo: '로그인·인증 UI', emoji: '🔐', desc: '소셜 로그인·OTP·비밀번호 포함한 인증 화면 UI 디자인', prefix: 'authentication login UI screen design of', suffix: 'login and authentication UI screen, social login buttons, input field states, OTP or 2FA design, clean minimal auth form, security-focused UI design with trust indicator', group: 'uiinfo', texture: 'clean', usage: 'explainer' },
    { id: 'med-data-table-ui', category: 'ui_ux', nameKo: '데이터 테이블 & 관리자 UI', emoji: '📋', desc: '정렬·필터·페이지네이션이 포함된 어드민 데이터 테이블 UI', prefix: 'admin data table management UI design of', suffix: 'admin panel data table UI, sortable column headers, row selection checkboxes, filter and search bar, pagination controls, clean enterprise dashboard table design', group: 'uiinfo', texture: 'clean', usage: 'explainer' },
    { id: 'med-empty-state', category: 'ui_ux', nameKo: '빈 화면 & 에러 UI 일러스트', emoji: '🎨', desc: '404·빈 목록·오류 상태 화면의 일러스트가 있는 UI 디자인', prefix: 'empty state error screen UI illustration of', suffix: 'empty state or error page UI design with friendly illustration, clear message and action button, 404 or no-data state, approachable character or scene illustration, Dribbble UI art direction', group: 'uiinfo', texture: 'clean', usage: 'explainer' },

    // ── pixel_adv ───────────────────────────────────────────────
    {
      id: 'med-iso-pixel-city',
      category: 'pixel_adv',
      nameKo: '아이소메트릭 픽셀 도시',
      emoji: '🏙️',
      desc: '45도 시점의 정교한 아이소메트릭 픽셀 도시 씬',
      prefix: 'isometric pixel art city scene of',
      suffix: 'detailed isometric pixel art, 45-degree view city scene, charming miniature building sprites, lush pixel vegetation and vehicles, vibrant color palette, RPG Maker or Stardew Valley aesthetic',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    {
      id: 'med-dot-art-sprite',
      category: 'pixel_adv',
      nameKo: '도트 아트 스프라이트',
      emoji: '🎯',
      desc: '게임 캐릭터나 아이템을 묘사한 클래식 도트 아트',
      prefix: 'retro dot art sprite of',
      suffix: 'classic dot art pixel sprite, limited color palette with careful dithering, distinct readable silhouette, 16x16 or 32x32 grid scale, retro game pixel character or item sprite sheet style',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    {
      id: 'med-rpg-bg-pixel',
      category: 'pixel_adv',
      nameKo: 'RPG 픽셀 배경 일러스트',
      emoji: '🗡️',
      desc: 'JRPG 스타일의 정교한 픽셀 필드·던전 배경',
      prefix: 'RPG pixel art background scene of',
      suffix: 'detailed RPG pixel art background, JRPG side-scrolling field or dungeon, lush pixel landscape with parallax layers, warm or eerie atmospheric lighting, Final Fantasy or Chrono Trigger style',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    {
      id: 'med-dither-grayscale',
      category: 'pixel_adv',
      nameKo: '디더링 흑백 픽셀 아트',
      emoji: '⬛',
      desc: '디더링 기법으로 명암을 표현한 흑백 픽셀 아트',
      prefix: 'dithering grayscale pixel art of',
      suffix: 'monochrome pixel art with dithering patterns, grayscale value rendering through dot patterns, Game Boy or early Macintosh aesthetic, minimalist retro monochrome pixel style',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    {
      id: 'med-hi-res-pixel',
      category: 'pixel_adv',
      nameKo: '고해상도 픽셀 씬',
      emoji: '🖼️',
      desc: '현대 하이레즈 픽셀 아트의 정교한 대형 씬',
      prefix: 'high resolution detailed pixel art scene of',
      suffix: 'high resolution pixel art, large canvas with intricate pixel detail, painterly color gradients within pixel constraints, modern pixel art movement style, Noitu Love or Hyper Light Drifter aesthetic',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    {
      id: 'med-pixel-particles',
      category: 'pixel_adv',
      nameKo: '픽셀 파티클 이펙트 아트',
      emoji: '✨',
      desc: '빛·마법·폭발 이펙트를 픽셀로 묘사한 이펙트 아트',
      prefix: 'pixel art particle effect visual of',
      suffix: 'stylized pixel particle effects, glowing magic or explosion or energy burst, vibrant color clusters on dark background, game VFX pixel art style, dynamic and energetic composition',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    {
      id: 'med-retro-crt',
      category: 'pixel_adv',
      nameKo: '레트로 CRT 스캔라인 아트',
      emoji: '📺',
      desc: 'CRT 모니터 스캔라인·글로우 필터를 씌운 레트로 픽셀',
      prefix: 'retro CRT monitor scanline pixel art of',
      suffix: 'retro CRT monitor effect on pixel art, visible scanlines and screen curvature, RGB phosphor glow bleeding, classic arcade or early computer game aesthetic, nostalgic retro tech visual',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    {
      id: 'med-pixel-anim-still',
      category: 'pixel_adv',
      nameKo: '픽셀 애니메이션 정지 프레임',
      emoji: '🎞️',
      desc: '애니메이션 루프 중 한 장면을 포착한 생동감 있는 픽셀 프레임',
      prefix: 'pixel animation key frame still of',
      suffix: 'pixel animation keyframe capture, action mid-point with motion blur trails in pixel form, expressive character animation pose, vibrant colors with strong silhouette, GIF animation still frame quality',
      group: 'experimental',
      texture: 'vivid',
      usage: 'campaign'
    },
    { id: 'med-pixel-portrait', category: 'pixel_adv', nameKo: '픽셀 인물 초상화', emoji: '🧑', desc: '세밀한 음영 처리로 완성된 고해상도 픽셀 인물 초상화', prefix: 'detailed pixel art portrait of', suffix: 'high-resolution pixel art portrait, careful dithering for skin tones and shadow, expressive character face, professional pixel portrait commission style, 64x64 or higher resolution pixel grid', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-pixel-landscape', category: 'pixel_adv', nameKo: '픽셀 풍경 파노라마', emoji: '🏞️', desc: '스크롤 게임 배경처럼 레이어드된 픽셀 풍경 파노라마', prefix: 'pixel art landscape panorama of', suffix: 'layered pixel art landscape, parallax scrolling game background aesthetic, foreground midground background depth layers, natural or fantasy scenery in pixel art style, SNES or GBA era quality', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-pixel-icon-set', category: 'pixel_adv', nameKo: '픽셀 아이콘 세트 시트', emoji: '🎮', desc: '게임 UI 또는 레트로 앱용 16×16·32×32 픽셀 아이콘 세트', prefix: 'pixel art icon set sheet of', suffix: '16x16 or 32x32 pixel icon set, game UI item icons or retro app icons, consistent pixel grid, limited color palette, clean readable silhouette, RPG inventory or retro OS icon style', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-pixel-horror', category: 'pixel_adv', nameKo: '픽셀 호러 & 다크 판타지', emoji: '👻', desc: '한정 팔레트로 공포 분위기를 표현한 픽셀 호러 씬', prefix: 'pixel art horror dark fantasy scene of', suffix: 'pixel art horror or dark fantasy scene, limited dark color palette with accent reds and greens, atmospheric dread and mystery, Undertale or Yume Nikki aesthetic, pixel horror game visual', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-pixel-map', category: 'pixel_adv', nameKo: '픽셀 월드맵 & 탑뷰 던전', emoji: '🗺️', desc: 'JRPG 월드맵 또는 탑뷰 던전 픽셀 지도', prefix: 'pixel art world map or dungeon top-view of', suffix: 'pixel art top-view world map or dungeon map, tile-based terrain types, animated sprite marker points, Final Fantasy or Dragon Quest world map style, nostalgic JRPG cartography', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-voxel-art', category: 'pixel_adv', nameKo: '복셀 3D 아트', emoji: '🧊', desc: '미니크래프트 스타일 복셀로 구성된 3D 아이소메트릭 씬', prefix: 'voxel 3D art scene of', suffix: 'voxel 3D art isometric composition, Minecraft-style cubic voxel blocks, colorful scene with environmental storytelling, MagicaVoxel software aesthetic, clean 3D voxel render', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-demoscene', category: 'pixel_adv', nameKo: '데모씬 & 사이버펑크 픽셀', emoji: '💾', desc: '1980s 데모씬 감성의 사이버펑크 픽셀 아트 스크린', prefix: 'demoscene cyberpunk pixel art screen of', suffix: 'demoscene inspired pixel art, 80s computer art aesthetic, raster bar effects and plasma sine wave patterns, PETSCII or ANSI art character graphics, cyberpunk neon pixel composition', group: 'experimental', texture: 'vivid', usage: 'campaign' },
    { id: 'med-pixel-cutscene', category: 'pixel_adv', nameKo: '픽셀 컷씬 & 이벤트 스크린', emoji: '🎭', desc: '드라마틱한 게임 컷씬 연출을 픽셀로 표현한 이벤트 화면', prefix: 'pixel art game cutscene event screen of', suffix: 'pixel art game cutscene panel, dramatic story moment with character expression close-up, dialogue box layout, cinematic widescreen letterbox pixel composition, SNES RPG cutscene quality', group: 'experimental', texture: 'vivid', usage: 'campaign' },

    // ── nature_photo ────────────────────────────────────────────
    {
      id: 'med-golden-hour',
      category: 'nature_photo',
      nameKo: '골든 아워 풍경 사진',
      emoji: '🌅',
      desc: '일출·일몰 황금빛 빛과 그림자의 풍경 사진',
      prefix: 'golden hour landscape photography of',
      suffix: 'golden hour landscape photography, warm orange and amber sunlight, long dramatic shadows, silhouetted elements against glowing sky, rich tonal range, award-winning nature photography quality',
      group: 'photo',
      texture: 'real',
      usage: 'campaign'
    },
    {
      id: 'med-aurora-long-exp',
      category: 'nature_photo',
      nameKo: '오로라 장노출 사진',
      emoji: '🌌',
      desc: '북극광 아래 별과 오로라를 담은 장노출 천체 사진',
      prefix: 'aurora borealis long exposure astrophotography of',
      suffix: 'aurora borealis long exposure photography, vivid green and violet aurora curtains, star-filled sky with milky way, frozen lake or mountain reflection, stunning astrophotography quality',
      group: 'photo',
      texture: 'real',
      usage: 'campaign'
    },
    {
      id: 'med-misty-forest',
      category: 'nature_photo',
      nameKo: '안개 숲 분위기 사진',
      emoji: '🌫️',
      desc: '새벽 안개가 자욱한 신비로운 숲 사진',
      prefix: 'misty forest atmospheric photography of',
      suffix: 'misty forest atmospheric photography, morning fog filtering through tall trees, ethereal diffused light, moody green and grey tones, layers of depth into forest darkness, fine art nature photography',
      group: 'photo',
      texture: 'real',
      usage: 'campaign'
    },
    {
      id: 'med-reflection-symmetry',
      category: 'nature_photo',
      nameKo: '수면 반영 대칭 사진',
      emoji: '🪞',
      desc: '수면에 비친 완벽한 반영으로 만든 대칭 구도 사진',
      prefix: 'perfect reflection symmetry landscape photography of',
      suffix: 'perfect mirror reflection landscape photography, still water symmetrical composition, sky and mountains perfectly reflected, minimalist graphic quality, serene tranquil atmosphere',
      group: 'photo',
      texture: 'real',
      usage: 'campaign'
    },
    {
      id: 'med-underwater',
      category: 'nature_photo',
      nameKo: '수중 해양 생태 사진',
      emoji: '🐠',
      desc: '산호초·해양생물의 투명한 수중 사진',
      prefix: 'underwater ocean life photography of',
      suffix: 'professional underwater photography, crystal clear tropical ocean, vivid coral reef ecosystem, natural sunbeam caustic light patterns, marine life in natural habitat, National Geographic quality',
      group: 'photo',
      texture: 'real',
      usage: 'campaign'
    },
    {
      id: 'med-aerial-drone',
      category: 'nature_photo',
      nameKo: '항공 드론 조감 사진',
      emoji: '🚁',
      desc: '드론으로 촬영한 대지의 패턴과 스케일을 담은 항공 사진',
      prefix: 'aerial drone landscape photography of',
      suffix: 'aerial drone photography, bird-eye view top-down or low oblique angle, geometric landscape patterns visible from above, vast scale minimalism, vibrant terrain colors, professional drone photography',
      group: 'photo',
      texture: 'real',
      usage: 'campaign'
    },
    {
      id: 'med-bw-street-doc',
      category: 'nature_photo',
      nameKo: '흑백 거리 다큐멘터리 사진',
      emoji: '📷',
      desc: '거리의 순간을 담은 흑백 다큐멘터리 스트리트 사진',
      prefix: 'black and white street documentary photography of',
      suffix: 'black and white street photography, decisive moment capture, strong graphic composition, grain film texture, Cartier-Bresson or Vivian Maier inspired, documentary human element',
      group: 'photo',
      texture: 'real',
      usage: 'campaign'
    },
    {
      id: 'med-studio-still-life',
      category: 'nature_photo',
      nameKo: '스튜디오 정물 제품 사진',
      emoji: '💡',
      desc: '라이팅이 정교하게 세팅된 스튜디오 정물·제품 사진',
      prefix: 'professional studio still life photography of',
      suffix: 'studio still life photography, controlled three-point lighting setup, seamless background paper, crisp product or object detail, commercial photography quality, clean minimal composition',
      group: 'photo',
      texture: 'real',
      usage: 'campaign'
    },
    { id: 'med-wildlife-photo', category: 'nature_photo', nameKo: '야생동물 자연 다큐 사진', emoji: '🦁', desc: '야생에서 포착한 동물 행동을 담은 내셔널 지오그래픽 스타일 사진', prefix: 'wildlife nature documentary photography of', suffix: 'wildlife nature documentary photograph, decisive moment animal behavior capture, telephoto compressed perspective, National Geographic or BBC Earth quality, natural habitat authentic scene', group: 'photo', texture: 'real', usage: 'campaign' },
    { id: 'med-storm-sky', category: 'nature_photo', nameKo: '폭풍 & 드라마틱 하늘 사진', emoji: '⛈️', desc: '번개·먹구름·무지개 등 극적인 기상 현상을 포착한 사진', prefix: 'dramatic storm sky weather photography of', suffix: 'dramatic storm or sky weather photograph, cumulonimbus cloud formations or lightning strike, extreme weather documentary style, vivid atmospheric colors, storm chaser photography quality', group: 'photo', texture: 'real', usage: 'campaign' },
    { id: 'med-season-color', category: 'nature_photo', nameKo: '계절 색채 풍경 사진', emoji: '🍁', desc: '단풍·벚꽃·설경 등 계절 절정의 색채를 담은 풍경 사진', prefix: 'seasonal color landscape photography of', suffix: 'seasonal peak color landscape photograph, autumn foliage or cherry blossom or winter snow, saturated natural color palette, wide angle scenic view, landscape photography competition quality', group: 'photo', texture: 'real', usage: 'campaign' },
    { id: 'med-ocean-wave', category: 'nature_photo', nameKo: '해양 파도 & 해안 사진', emoji: '🌊', desc: '파도의 역동성과 해안선의 아름다움을 담은 해양 사진', prefix: 'ocean wave coastal photography of', suffix: 'ocean wave or coastal landscape photograph, long exposure silky water or frozen wave splash, dramatic seascape with rocky coastline or sandy beach, Clark Little or Ben Thouard style', group: 'photo', texture: 'real', usage: 'campaign' },
    { id: 'med-desert-sand', category: 'nature_photo', nameKo: '사막 & 지형 사진', emoji: '🏜️', desc: '광활한 사막과 독특한 지형을 담은 풍경 사진', prefix: 'desert landscape geological formation photography of', suffix: 'desert landscape or geological formation photograph, dramatic shadow lines on sand dunes, vast scale minimalism, abstract aerial perspective, Sahara or Utah desert photography style', group: 'photo', texture: 'real', usage: 'campaign' },
    { id: 'med-mountain-fog', category: 'nature_photo', nameKo: '산악 & 구름 안개 사진', emoji: '⛰️', desc: '고산 구름·안개·일출이 어우러진 신비로운 산악 사진', prefix: 'mountain fog mist landscape photography of', suffix: 'mountain landscape with fog or mist, layered ridgelines emerging from clouds, ethereal atmospheric perspective, Huangshan or Dolomites style, landscape fine art photography quality', group: 'photo', texture: 'real', usage: 'campaign' },
    { id: 'med-macro-nature', category: 'nature_photo', nameKo: '접사 마크로 자연 사진', emoji: '🦋', desc: '곤충·꽃·물방울 등 마크로 렌즈로 포착한 미시 자연 세계', prefix: 'macro close-up nature photography of', suffix: 'extreme macro close-up nature photograph, tiny detail revealed at large scale, shallow depth of field bokeh background, insect or dew drop or flower stamen, technical macro photography excellence', group: 'photo', texture: 'real', usage: 'campaign' },
    { id: 'med-night-sky-photo', category: 'nature_photo', nameKo: '밤하늘 천체 사진', emoji: '🌌', desc: '은하수·별자리·유성우를 담은 천체 풍경 사진', prefix: 'night sky astrophotography of', suffix: 'night sky astrophotography, Milky Way arc over landscape, star trails or meteor shower, dark sky location with foreground interest, long exposure technical excellence, Royce Bair or Daniel Kordan style', group: 'photo', texture: 'real', usage: 'campaign' },

    // ==================== 17. 유튜브 & 설명영상 (youtube_anim) ====================
    {
      id: 'med-yt-whiteboard',
      category: 'youtube_anim',
      nameKo: '화이트보드 애니메이션',
      emoji: '📝',
      desc: '손그림 스케치, 검은 마커 선, 흰 배경',
      prefix: 'whiteboard animation style of',
      suffix: 'whiteboard animation style, hand-drawn sketch, black marker lines, simple icons, clean white background, educational explainer video, step-by-step visual explanation, minimal color accents',
      group: 'graphic',
      texture: 'clean',
      usage: 'explainer'
    },
    {
      id: 'med-yt-flat-vector',
      category: 'youtube_anim',
      nameKo: '플랫 벡터 모션그래픽',
      emoji: '◼️',
      desc: '평면적 인물·도형, 선명한 색면, 깔끔한 레이아웃',
      prefix: 'flat vector illustration motion graphics of',
      suffix: 'flat vector illustration, motion graphics style, clean geometric shapes, simple character design, infographic layout, bold color blocks, modern explainer video, minimal shadows',
      group: 'graphic',
      texture: 'clean',
      usage: 'explainer'
    },
    {
      id: 'med-yt-doodle',
      category: 'youtube_anim',
      nameKo: '두들 손그림 일러스트',
      emoji: '✏️',
      desc: '친근한 펜선, 손그림, 포인트 컬러',
      prefix: 'doodle illustration style of',
      suffix: 'doodle illustration style, hand-drawn black ink outlines, playful spontaneous line work, white background, bright yellow accents, coral red highlights, simple cartoon icons, friendly explainer visual',
      group: 'graphic',
      texture: 'clean',
      usage: 'explainer'
    },
    {
      id: 'med-yt-historical-doc',
      category: 'youtube_anim',
      nameKo: '사극 다큐 애니메이션',
      emoji: '🏯',
      desc: '역사 다큐 삽화풍, 낮은 채도, 짙은 먹선, 안개 효과',
      prefix: 'cinematic 2D historical documentary animation of',
      suffix: 'cinematic 2D historical documentary animation, Joseon dynasty royal court, muted sepia tones, dark ink outlines, cel-shaded animation, palace mist, solemn political atmosphere, layered character composition, documentary-style historical cutscene mood',
      group: 'graphic',
      texture: 'clean',
      usage: 'explainer'
    },
    {
      id: 'med-yt-webtoon-comic',
      category: 'youtube_anim',
      nameKo: '웹툰 만화 컷',
      emoji: '💬',
      desc: '굵은 외곽선, 셀 음영, 컷 분할 레이아웃',
      prefix: 'Korean webtoon style comic panel of',
      suffix: 'Korean webtoon style, comic panel composition, bold outlines, expressive characters, speech bubble space, dramatic facial expressions, clean cel shading, serialized story illustration',
      group: 'graphic',
      texture: 'clean',
      usage: 'explainer'
    },
    {
      id: 'med-yt-news-info',
      category: 'youtube_anim',
      nameKo: '뉴스 인포그래픽',
      emoji: '📊',
      desc: '네이비/화이트 톤, 신뢰감 주는 데이터 카드',
      prefix: 'news infographic style editorial design of',
      suffix: 'news infographic style, editorial data visualization, clean charts, map graphics, bold headline area, professional broadcast design, navy and white palette, structured information layout',
      group: 'graphic',
      texture: 'clean',
      usage: 'explainer'
    },
    {
      id: 'med-yt-isometric',
      category: 'youtube_anim',
      nameKo: '아이소메트릭 일러스트',
      emoji: '📐',
      desc: '45도 입체 시점, 시스템 및 구조 도식화',
      prefix: 'isometric vector illustration of',
      suffix: 'isometric vector illustration, miniature city system, clean geometric buildings, people icons, connected network lines, public service infrastructure, structured explainer diagram',
      group: 'graphic',
      texture: 'clean',
      usage: 'explainer'
    },
    {
      id: 'med-yt-collage',
      category: 'youtube_anim',
      nameKo: '콜라주 에디토리얼 컷아웃',
      emoji: '✂️',
      desc: '종이 질감, 신문 조각, 레이어드 오려내기',
      prefix: 'editorial collage paper cutout style of',
      suffix: 'editorial collage style, paper cutout texture, mixed media illustration, layered newspaper shapes, bold headline space, modern magazine layout, muted colors, conceptual visual metaphor',
      group: 'graphic',
      texture: 'clean',
      usage: 'explainer'
    },
    {
      id: 'med-yt-line-pictogram',
      category: 'youtube_anim',
      nameKo: '픽토그램 라인아이콘',
      emoji: '📋',
      desc: '얇고 깔끔한 외곽선, 단계별 가이드, 넓은 여백',
      prefix: 'minimal line icon pictogram style of',
      suffix: 'minimal line icon style, pictogram illustration, thin but clear outlines, clean instructional layout, step-by-step guide, simple color accents, public information design',
      group: 'graphic',
      texture: 'clean',
      usage: 'explainer'
    },
    {
      id: 'med-yt-clay-soft',
      category: 'youtube_anim',
      nameKo: '3D 클레이 소프트 오브젝트',
      emoji: '🧸',
      desc: '친근한 무광 클레이, 파스텔 톤, 둥근 입체 형태',
      prefix: 'soft 3D clay illustration of',
      suffix: 'soft 3D clay illustration, matte material, rounded objects, friendly educational visual, clean pastel background, simple icons, no glossy plastic, no toy-like appearance',
      group: 'graphic',
      texture: 'clean',
      usage: 'explainer'
    },
    {
      id: 'med-yt-vintage-textbook',
      category: 'youtube_anim',
      nameKo: '레트로 교과서 삽화',
      emoji: '📖',
      desc: '오래된 교과서 삽화, 종이 질감, 낮은 채도',
      prefix: 'vintage textbook illustration of',
      suffix: 'vintage textbook illustration, muted print colors, hand-drawn educational diagram, old paper texture, restrained line art, archival documentary mood',
      group: 'graphic',
      texture: 'clean',
      usage: 'explainer'
    },
    {
      id: 'med-yt-diagram',
      category: 'youtube_anim',
      nameKo: '미니멀 다이어그램',
      emoji: '🌀',
      desc: '노드와 선, 흐름 화살표, 시스템 맵 구조',
      prefix: 'minimal diagrammatic illustration of',
      suffix: 'minimal diagrammatic illustration, clean nodes and lines, abstract but clear system map, modern editorial layout, white space, precise typography area, restrained color palette',
      group: 'graphic',
      texture: 'clean',
      usage: 'explainer'
    },
    // ==================== 공공기관 홍보용 프리셋 (30종) ====================
    // 모던 공식 일러스트 (8종)
    {
      id: 'med-public-modern-line',
      category: 'official',
      nameKo: '모던 선 일러스트',
      emoji: '✏️',
      desc: '깔끔하고 절제된 모던 라인 일러스트',
      prefix: 'modern line illustration of',
      suffix: 'clean line art illustration, minimalist line drawing style, flat design, official corporate style, professional government presentation, soft pastel colors, high quality vector art, transparent background',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'corporate'
    },
    {
      id: 'med-public-soft-color',
      category: 'official',
      nameKo: '부드러운 색감 일러스트',
      emoji: '🎨',
      desc: '따뜻한 톤의 부드러운 색감 일러스트',
      prefix: 'soft colored illustration of',
      suffix: 'soft color palette illustration, warm pastel tones, gentle rounded shapes, institutional aesthetic, professional public service style, clean composition, simple elegance',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'corporate'
    },
    {
      id: 'med-public-icon-system',
      category: 'official',
      nameKo: '아이콘 시스템',
      emoji: '◼️',
      desc: '통일된 스타일의 아이콘 시스템',
      prefix: 'icon style illustration of',
      suffix: 'icon design system, unified style icons, consistent line weight, simple geometric shapes, professional icon set, suitable for government services, clean and clear visual communication',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'corporate'
    },
    {
      id: 'med-public-flat-design',
      category: 'official',
      nameKo: '플랫 디자인',
      emoji: '⬛',
      desc: '밝고 선명한 색상의 플랫 디자인',
      prefix: 'flat design illustration of',
      suffix: 'flat design style, bright solid colors, no gradient, no shadow, simple forms, modern digital design, clean vector aesthetic, institutional branding color palette',
      group: 'uiinfo',
      texture: 'glossy',
      usage: 'corporate'
    },
    {
      id: 'med-public-geometric-modern',
      category: 'official',
      nameKo: '기하학적 모던',
      emoji: '🔷',
      desc: '구조적 구성의 기하학적 모던 디자인',
      prefix: 'geometric modern illustration of',
      suffix: 'geometric modern design, structured shapes, precise angles, balanced composition, professional institutional style, minimalist approach, contemporary look',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'corporate'
    },
    {
      id: 'med-public-pastel-simple',
      category: 'official',
      nameKo: '파스텔 심플',
      emoji: '💫',
      desc: '파스텔 톤의 심플한 일러스트',
      prefix: 'pastel simple illustration of',
      suffix: 'pastel color illustration, soft colors, simple forms, friendly tone, approachable design, public-facing friendly aesthetic, contemporary simple lines',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'corporate'
    },
    {
      id: 'med-public-lineart-official',
      category: 'official',
      nameKo: '라인아트 공식',
      emoji: '📐',
      desc: '공공기관용 공식 라인아트 스타일',
      prefix: 'official line art of',
      suffix: 'official line art style, thin precise lines, institutional design, authoritative yet approachable, government communication standard, elegant minimalism',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'corporate'
    },
    {
      id: 'med-public-minimal-brand',
      category: 'official',
      nameKo: '미니멀 브랜드',
      emoji: '🏛️',
      desc: '브랜드 중심의 미니멀 기관 일러스트',
      prefix: 'minimal institutional branding illustration of',
      suffix: 'minimal brand illustration, institutional colors, restrained design, prestigious aesthetic, government agency style, elegant simplicity, professional presentation',
      group: 'uiinfo',
      texture: 'glossy',
      usage: 'corporate'
    },
    // 미니멀 & 기하학 (8종)
    {
      id: 'med-minimal-grid-system',
      category: 'graphic',
      nameKo: '그리드 시스템',
      emoji: '📊',
      desc: '그리드 기반의 기하학적 구성',
      prefix: 'grid system geometric composition of',
      suffix: 'grid system design, geometric grid layout, structured composition, clean lines, organized information architecture, modern corporate design',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'corporate'
    },
    {
      id: 'med-minimal-circle-geometry',
      category: 'graphic',
      nameKo: '원 기하학',
      emoji: '⭕',
      desc: '원형 기하학 패턴 디자인',
      prefix: 'circular geometric design of',
      suffix: 'circular geometry, concentric patterns, geometric circles, modern abstract, balanced composition, minimal color palette, professional layout',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'corporate'
    },
    {
      id: 'med-minimal-bauhaus',
      category: 'graphic',
      nameKo: '바우하우스',
      emoji: '🎭',
      desc: '바우하우스풍 미니멀 디자인',
      prefix: 'bauhaus style design of',
      suffix: 'bauhaus style, geometric minimalism, form follows function, primary colors restrained use, classic modernist design, institutional aesthetic',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'corporate'
    },
    {
      id: 'med-minimal-swiss-design',
      category: 'graphic',
      nameKo: '스위스 디자인',
      emoji: '🇨🇭',
      desc: '스위스 스타일 그리드·타이포그래피 디자인',
      prefix: 'swiss design style of',
      suffix: 'swiss style design, grid-based layout, clean typography, minimal color, functional elegance, corporate design standard, precise alignment',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'corporate'
    },
    {
      id: 'med-minimal-dot-pattern',
      category: 'graphic',
      nameKo: '닷 패턴',
      emoji: '⬤',
      desc: '점 패턴 기반의 추상 구성',
      prefix: 'dot pattern abstract design of',
      suffix: 'dot pattern design, stippled texture, pointillist technique, abstract minimal, modern art direction, refined composition',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'corporate'
    },
    {
      id: 'med-minimal-line-composition',
      category: 'graphic',
      nameKo: '라인 컴포지션',
      emoji: '〰️',
      desc: '선 위주의 구성 디자인',
      prefix: 'line composition design of',
      suffix: 'line composition, flowing lines, minimalist structure, modern linear design, clean layout, balanced spacing, professional execution',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'corporate'
    },
    {
      id: 'med-minimal-shape-abstract',
      category: 'graphic',
      nameKo: '셰이프 추상',
      emoji: '▲',
      desc: '추상적인 미니멀 도형 구성',
      prefix: 'abstract minimal shape design of',
      suffix: 'abstract shape composition, geometric forms, minimalist interpretation, clean modern design, institutional colors, structured abstraction',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'corporate'
    },
    {
      id: 'med-minimal-typography-focus',
      category: 'graphic',
      nameKo: '타이포그래피 중심',
      emoji: '🔤',
      desc: '타이포그래피 중심의 미니멀 디자인',
      prefix: 'typography centered design of',
      suffix: 'typography-focused design, minimal supporting graphics, emphasis on text hierarchy, modern font usage, clean layout, professional information design',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'corporate'
    },
    // 인포그래픽 스타일 (2종 — 구도/내용 아닌 선·면 처리 스타일 중심으로 재정의)
    {
      id: 'med-infographic-icon-text',
      category: 'graphic',
      nameKo: '아이콘 플랫 일러스트',
      emoji: '🔷',
      desc: '단순 아이콘과 텍스트 블록을 조합한 플랫 일러스트 스타일',
      prefix: 'flat icon illustration style of',
      suffix: 'flat design icon illustration, simple geometric icon shapes with uniform stroke weight, clean crisp outlines, muted institutional color palette, minimal decorative elements, generous white space, professional information design aesthetic',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'corporate'
    },
    {
      id: 'med-infographic-data-visual',
      category: 'graphic',
      nameKo: '데이터 차트 플랫 스타일',
      emoji: '📊',
      desc: '차트와 수치를 플랫 디자인으로 깔끔하게 정리하는 시각화 스타일',
      prefix: 'flat data chart graphic design style of',
      suffix: 'flat chart graphic style, clean geometric bar and pie shapes, structured grid layout, muted professional color palette, thin precise rule lines, minimal annotation typography, modern information design aesthetic',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'corporate'
    },
    // 프로페셔널 포토 (6종)
    {
      id: 'med-corporate-portrait-studio',
      category: 'photo',
      nameKo: '스튜디오 포트레이트',
      emoji: '👤',
      desc: '전문 스튜디오 인물사진',
      prefix: 'professional studio portrait of',
      suffix: 'professional studio portrait, clean background, proper lighting, institutional photography, dignified presentation, official style',
      group: 'photo',
      texture: 'real',
      usage: 'corporate'
    },
    {
      id: 'med-corporate-boardroom-shot',
      category: 'photo',
      nameKo: '보드룸 샷',
      emoji: '🪑',
      desc: '기업 회의실·미팅 공간 사진',
      prefix: 'boardroom corporate environment of',
      suffix: 'boardroom photography, corporate meeting space, professional interior, institutional setting, business environment',
      group: 'photo',
      texture: 'real',
      usage: 'corporate'
    },
    {
      id: 'med-corporate-workspace-office',
      category: 'photo',
      nameKo: '오피스 공간',
      emoji: '🏢',
      desc: '현대적인 오피스 업무공간',
      prefix: 'modern office workspace showing',
      suffix: 'office environment photography, contemporary workspace, professional setting, institutional office design, clean workspace',
      group: 'photo',
      texture: 'real',
      usage: 'corporate'
    },
    {
      id: 'med-corporate-outdoor-business',
      category: 'photo',
      nameKo: '아웃도어 비즈니스',
      emoji: '🌳',
      desc: '야외 비즈니스·자연 환경',
      prefix: 'outdoor business environment of',
      suffix: 'outdoor corporate photography, nature business setting, institutional outdoor, professional environment, clean natural setting',
      group: 'photo',
      texture: 'real',
      usage: 'corporate'
    },
    {
      id: 'med-corporate-detail-macro',
      category: 'photo',
      nameKo: '디테일 매크로',
      emoji: '🔍',
      desc: '소재의 마크로 디테일 사진',
      prefix: 'macro detail shot of',
      suffix: 'macro photography, detail focus, close-up shot, professional macro, institutional quality, clean detail presentation',
      group: 'photo',
      texture: 'real',
      usage: 'corporate'
    },
    {
      id: 'med-corporate-product-showcase',
      category: 'photo',
      nameKo: '제품 쇼케이스',
      emoji: '📦',
      desc: '전문 제품 쇼케이스 사진',
      prefix: 'professional product showcase of',
      suffix: 'product photography, professional showcase, institutional presentation, clean background, professional lighting, high quality product image',
      group: 'photo',
      texture: 'real',
      usage: 'corporate'
    },
    // 추가 특수 스타일 (3종)
    {
      id: 'med-government-official-seal',
      category: 'official',
      nameKo: '공식 씰 & 배지',
      emoji: '🔐',
      desc: '공식 씰·배지 디자인',
      prefix: 'official government seal and badge of',
      suffix: 'official seal design, authority symbol, institutional badge, formal emblem, government official style, professional certification mark',
      group: 'uiinfo',
      texture: 'glossy',
      usage: 'corporate'
    },
    {
      id: 'med-public-service-campaign',
      category: 'official',
      nameKo: '공공캠페인',
      emoji: '📢',
      desc: '공공서비스 캠페인 비주얼 스타일',
      prefix: 'public service campaign illustration of',
      suffix: 'public service campaign style, social awareness design, institutional messaging, engaging visual communication, public-facing design aesthetic',
      group: 'uiinfo',
      texture: 'glossy',
      usage: 'corporate'
    },
    {
      id: 'med-institutional-report-style',
      category: 'official',
      nameKo: '기관 리포트',
      emoji: '📰',
      desc: '기관 연간보고서 스타일',
      prefix: 'institutional report style visualization of',
      suffix: 'institutional report design, formal publication style, annual report aesthetic, professional corporate communication, official document style',
      group: 'uiinfo',
      texture: 'clean',
      usage: 'corporate'
    },
    // ==================== 공공기관 화풍 확장 프리셋 (30종) ====================
    // 선화 & 일러스트 스타일 (10종)
    { id: 'med-pub-bold-outline', category: 'official', nameKo: '볼드 아웃라인 플랫', emoji: '◼️', desc: '균일한 두꺼운 아웃라인과 단색 채움으로 구성된 강한 플랫 일러스트 스타일', prefix: 'bold outline flat illustration of', suffix: 'thick uniform black outline, flat solid color fills inside, no gradient no shadow, clean white background, strong graphic contrast, bold icon-like clarity, mobile-readable at any size', group: 'graphic', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-rounded-char', category: 'official', nameKo: '라운드 캐릭터 일러스트', emoji: '😊', desc: '부드럽게 둥근 비율과 파스텔 색감의 친근한 공공 안내용 캐릭터 스타일', prefix: 'friendly rounded character illustration style of', suffix: 'soft rounded character proportions, consistent even stroke weight, pastel and muted color palette, subtle inner gradient on rounded forms, approachable and inclusive tone, Korean public campaign illustration aesthetic', group: 'graphic', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-isometric-flat', category: 'official', nameKo: '아이소메트릭 플랫', emoji: '📐', desc: '30도 등각 투영의 2.5D 플랫 스타일 — 정밀한 각도와 색면으로만 표현', prefix: 'isometric 2.5D flat illustration of', suffix: 'precise isometric 2.5D perspective, clean 30-degree axonometric projection, bright consistent flat colors per face, crisp geometric edges, no lens distortion, modern infographic aesthetic, institutional quality', group: 'graphic', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-cutout-paper', category: 'official', nameKo: '컷아웃 페이퍼 콜라주', emoji: '✂️', desc: '종이를 오려 겹친 듯한 얇은 그림자와 색면 레이어로 구성된 콜라주 스타일', prefix: 'paper cutout collage style illustration of', suffix: 'layered paper cutout shapes, flat geometric forms with subtle edge drop-shadows, bright primary colors, collage-style stacking depth, editorial poster aesthetic, clean white outer margins, no texture on color areas', group: 'graphic', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-dual-tone-line', category: 'official', nameKo: '이색 라인 일러스트', emoji: '✏️', desc: '두 가지 색상의 선으로만 구성된 절제된 이색 라인아트 스타일', prefix: 'two-color line art illustration of', suffix: 'two-color line illustration, primary strokes in deep navy or dark blue, accent detail lines in warm orange or institutional yellow, white or off-white fill, simple icon-like flat forms, bold and legible institutional design', group: 'graphic', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-tech-node', category: 'official', nameKo: '테크 노드 라인아트', emoji: '🔗', desc: '노드와 연결선 모티프의 얇은 기술감각 라인아트 스타일', prefix: 'technology node line art illustration of', suffix: 'thin precise vector line art, connected circular nodes motif, 0.5–1px uniform stroke, monochrome or two-color palette, crisp geometric strokes, innovation and digital-government aesthetic, clean light background with ample white space', group: 'graphic', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-silhouette-color', category: 'official', nameKo: '컬러 실루엣 레이어', emoji: '🎭', desc: '채도가 다른 색면을 겹쳐 깊이감을 만드는 실루엣 레이어 스타일', prefix: 'layered silhouette graphic style of', suffix: 'overlapping solid color silhouette shapes at varying opacity, depth through transparent color layering, no outline strokes, strong graphic composition, muted institutional color palette, modern civic poster visual', group: 'graphic', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-sketch-color', category: 'official', nameKo: '스케치 + 수채 채색', emoji: '🖌️', desc: '연필 스케치 선에 느슨한 수채 채색을 더한 따뜻하고 친근한 스타일', prefix: 'pencil sketch with watercolor wash illustration style of', suffix: 'light pencil sketch outline with loose watercolor color fill, slightly imperfect hand-crafted lines, warm transparent color washes, soft bleed edges at borders, friendly community visual, educational program material aesthetic', group: 'graphic', texture: 'textured', usage: 'corporate' },
    { id: 'med-pub-3d-soft-render', category: 'official', nameKo: '소프트 3D 매트 렌더', emoji: '🧸', desc: '부드러운 매트 재질감과 파스텔 색감의 클레이 감각 3D 렌더 스타일', prefix: 'soft matte 3D render illustration of', suffix: 'soft matte 3D rendered objects, smooth clay-like material finish, pastel and muted color palette, gentle ambient occlusion shadow, no specular highlights, clean neutral or gradient background, modern institutional communication aesthetic', group: 'graphic', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-vector-geo-char', category: 'official', nameKo: '기하 벡터 캐릭터', emoji: '🔷', desc: '각진 기하 도형으로만 구성된 모더니즘 벡터 캐릭터 스타일', prefix: 'geometric vector character illustration of', suffix: 'angular simplified human figure constructed from geometric shapes, limited flat color palette, precise sharp edges, no gradients, modernist graphic poster style, institutional communication quality, constructivist visual influence', group: 'graphic', texture: 'clean', usage: 'corporate' },
    // 포스터 & 홍보 레이아웃 스타일 (10종)
    { id: 'med-pub-event-bold', category: 'official', nameKo: '이벤트 볼드 포스터', emoji: '🎪', desc: '큰 타이틀 영역과 강한 색 대비 중심의 행사 포스터 스타일', prefix: 'bold event poster graphic design style of', suffix: 'bold poster design with dominant title text area, high color contrast, minimal supporting graphic element, strong geometric accent shape, modern civic event visual, high legibility at distance and on mobile screen', group: 'graphic', texture: 'glossy', usage: 'corporate' },
    { id: 'med-pub-brochure-cover', category: 'official', nameKo: '브로셔 커버 레이아웃', emoji: '📖', desc: '비대칭 컬러밴드와 정갈한 여백의 기관 브로셔 표지 레이아웃 스타일', prefix: 'institutional brochure cover design style of', suffix: 'asymmetric color band layout, full-bleed accent color strip, generous white space, title and subtitle hierarchy placement area, clean professional print publication aesthetic, formal institutional branding system', group: 'uiinfo', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-grant-announce', category: 'official', nameKo: '지원사업 공고 스타일', emoji: '📢', desc: '신뢰감 있는 공식 블루 계열과 구조적 정보 블록의 지원사업 공고 스타일', prefix: 'government grant program announcement visual style of', suffix: 'structured information block layout, official deep blue or teal accent color band, trust-building formal typography zone, clean institutional grid, subtle supporting geometric element, suitable for digital posting and print flyer', group: 'uiinfo', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-edu-bright', category: 'official', nameKo: '교육 프로그램 밝은 스타일', emoji: '📚', desc: '밝고 활기찬 색감과 아이콘 영역이 돋보이는 교육 프로그램 홍보 스타일', prefix: 'educational program promotional visual style of', suffix: 'vibrant but professional color palette, bright and engaging without being childish, supporting icon or small illustration area, structured text block zone, approachable yet institutional tone, workshop and training program promotion quality', group: 'uiinfo', texture: 'glossy', usage: 'corporate' },
    { id: 'med-pub-conference-dark', category: 'official', nameKo: '컨퍼런스 다크 스타일', emoji: '🎤', desc: '네이비·차콜 배경에 골드·화이트 강조의 격조 있는 컨퍼런스 디자인 스타일', prefix: 'conference visual design style of', suffix: 'dark navy or charcoal background, gold or white accent typography zone, subtle geometric pattern or grid overlay, premium networking event aesthetic, prestigious institutional visual, scalable across print and digital display formats', group: 'uiinfo', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-sns-square', category: 'official', nameKo: 'SNS 정방형 공공 카드', emoji: '📱', desc: '1:1 정방형 포맷에 최적화된 공공기관 SNS 게시물 카드 스타일', prefix: 'institutional square SNS card design style of', suffix: 'square 1:1 ratio social media card layout, strong centered or left-aligned composition, bold color background with white text area, clean supporting icon or small illustration, institutional brand color palette, shareable and readable on mobile at thumbnail size', group: 'graphic', texture: 'glossy', usage: 'corporate' },
    { id: 'med-pub-banner-wide', category: 'official', nameKo: '와이드 배너 스타일', emoji: '📸', desc: '디지털 현수막·옥외 배너에 적합한 좌우 분할 와이드 레이아웃 스타일', prefix: 'wide horizontal banner layout style of', suffix: 'wide horizontal banner composition, strong left or center anchor for title element, supporting graphic on right third, institutional color palette, clean and impactful readability at distance, digital display and outdoor banner quality', group: 'uiinfo', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-newsletter', category: 'official', nameKo: '뉴스레터 헤더 스타일', emoji: '📧', desc: '전자우편 뉴스레터 헤더에 적합한 가로형 에디토리얼 배너 스타일', prefix: 'newsletter header banner editorial style of', suffix: 'horizontal newsletter header format, masthead typography placement area, subtle icon or small pattern accent, professional editorial publication aesthetic, clean and readable digital email header, institutional communication quality', group: 'uiinfo', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-certificate', category: 'official', nameKo: '수료·인증서 스타일', emoji: '🏅', desc: '장식 보더와 골드 배색의 격식 있는 수료증·인증서 디자인 스타일', prefix: 'formal certificate award design style of', suffix: 'formal certificate aesthetic, decorative border frame with institutional geometric motif, centered symmetrical composition, gold and deep navy or ivory color palette, embossed or foil-stamp visual quality, prestigious official award document style', group: 'uiinfo', texture: 'glossy', usage: 'corporate' },
    { id: 'med-pub-safety-notice', category: 'official', nameKo: '안전·공지 안내 스타일', emoji: '⚠️', desc: '높은 가시성 색상과 아이콘 중심의 안전 공지 및 중요 안내 스타일', prefix: 'official safety notice announcement visual style of', suffix: 'high-visibility institutional design, strong accent color (safety orange, alert red, or warning yellow) on clean background, bold clear iconographic symbol area, maximum readability and contrast ratio, authoritative public safety communication aesthetic', group: 'uiinfo', texture: 'clean', usage: 'corporate' },
    // 배경 & 텍스처 스타일 (5종)
    { id: 'med-pub-gradient-wave', category: 'official', nameKo: '그라디언트 웨이브 배경', emoji: '🌊', desc: '딥 블루→틸 계열의 부드러운 그라디언트에 웨이브 곡선이 더해진 배경 스타일', prefix: 'institutional gradient wave background style of', suffix: 'smooth gradient background from deep navy to teal or sky blue, gentle curved wave shape element, subtle directional flow, modern digital clean background, professional institutional design, clear text overlay zone', group: 'graphic', texture: 'glossy', usage: 'corporate' },
    { id: 'med-pub-hex-pattern', category: 'official', nameKo: '육각 허니콤 패턴', emoji: '🔷', desc: '혁신·연결을 상징하는 육각 격자 패턴 배경 스타일', prefix: 'hexagonal honeycomb pattern background style of', suffix: 'regular hexagonal grid pattern, uniform honeycomb motif, muted professional blue-grey tone, subtle geometric background texture, innovation and connectivity visual metaphor, modern institutional technology aesthetic', group: 'graphic', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-diagonal-split', category: 'official', nameKo: '대각선 분할 배경', emoji: '🔲', desc: '두 가지 기관 색상을 예각으로 분할하는 역동적인 대각선 레이아웃 스타일', prefix: 'diagonal color block split layout style of', suffix: 'bold diagonal two-color block split, contrasting institutional colors divided at acute angle, strong dynamic visual movement, contemporary government or civic design, high contrast graphic impact, clear focal zone on each color field', group: 'graphic', texture: 'glossy', usage: 'corporate' },
    { id: 'med-pub-dot-grid-bg', category: 'official', nameKo: '도트 그리드 배경', emoji: '⬛', desc: '균일한 도트 격자가 만드는 체계적이고 현대적인 배경 텍스처 스타일', prefix: 'dot grid pattern background style of', suffix: 'regular dot grid pattern, uniform small circles at precise intervals, subtle muted institutional color, systematic and orderly visual rhythm, clean professional data or report aesthetic background texture, restrained modern design', group: 'graphic', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-blob-pastel', category: 'official', nameKo: '파스텔 블롭 배경', emoji: '💫', desc: '유기적인 둥근 도형이 부드럽게 배치된 파스텔 친근 배경 스타일', prefix: 'organic blob pastel background style of', suffix: 'smooth organic blob shapes with rounded irregular edges, soft pastel color palette, blurred soft edges on shapes, layered at different sizes, modern friendly approachable background, public-facing institutional communication aesthetic', group: 'graphic', texture: 'clean', usage: 'corporate' },
    // 사진 편집 스타일 (5종)
    { id: 'med-pub-duotone', category: 'official', nameKo: '듀오톤 포토 편집', emoji: '🎞️', desc: '흑백 사진 위에 두 가지 기관 색상을 매핑한 듀오톤 편집 스타일', prefix: 'duotone color photo treatment style of', suffix: 'duotone photo color treatment, two institutional colors mapped onto shadow and highlight zones of grayscale base, strong graphic poster quality from photographic base, modern editorial visual impact, distinctive color-blocked photography style', group: 'photo', texture: 'real', usage: 'corporate' },
    { id: 'med-pub-photo-clean', category: 'official', nameKo: '클린 스튜디오 사진', emoji: '📸', desc: '밝고 깔끔한 스튜디오 또는 야외 고키 조명의 공식 기관 사진 스타일', prefix: 'clean studio photography style of', suffix: 'clean neutral or white background, high-key professional lighting, crisp sharp focus, neutral balanced color grade, institutional communication quality, suitable for people, product, or facility documentation photography', group: 'photo', texture: 'real', usage: 'corporate' },
    { id: 'med-pub-photo-warm', category: 'official', nameKo: '웜톤 컬러 그레이딩', emoji: '🌅', desc: '따뜻하고 밝은 골든 색조 그레이딩의 친근한 라이프스타일 사진 스타일', prefix: 'warm color-graded photography style of', suffix: 'warm golden color grade, lifted shadows, slightly desaturated blues, approachable lifestyle feel, professional photo retouching, human-focused community and education program photography aesthetic', group: 'photo', texture: 'real', usage: 'corporate' },
    { id: 'med-pub-photo-cool', category: 'official', nameKo: '쿨톤 컬러 그레이딩', emoji: '💙', desc: '차갑고 선명한 블루-화이트 그레이딩의 혁신·기술 사진 스타일', prefix: 'cool color-graded photography style of', suffix: 'cool blue-white color grade, lifted clean highlights, slightly desaturated warm tones, professional modern corporate photography feel, technology or innovation program aesthetic, crisp and clean precision visual', group: 'photo', texture: 'real', usage: 'corporate' },
    { id: 'med-pub-photo-bw-accent', category: 'official', nameKo: '흑백 + 포인트 컬러 사진', emoji: '⚫', desc: '흑백 사진에 단 하나의 포인트 컬러만 남긴 선택적 컬러 사진 스타일', prefix: 'black and white with accent color photo style of', suffix: 'black and white photography base with single vivid accent color preserved on key subject or detail, selective color technique, high-contrast monochrome treatment, dramatic modern editorial style, strong institutional poster quality', group: 'photo', texture: 'real', usage: 'corporate' },
    // 공공기관 실무 홍보물 특화 (카드뉴스·정책안내·지원사업)
    { id: 'med-pub-policy-cardnews', category: 'official', nameKo: '정책 안내 카드뉴스', emoji: '📌', desc: '정책 핵심 내용을 3~5개 정보 블록으로 정리하는 공공기관 카드뉴스 스타일', prefix: 'public policy card news design style of', suffix: 'Korean public institution card news layout, clean square or vertical mobile card, 3 to 5 structured information blocks, headline-first hierarchy, restrained blue-green civic palette, high readability, official but approachable tone, no decorative clutter', group: 'uiinfo', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-grant-recruit-card', category: 'official', nameKo: '지원사업 모집 카드', emoji: '💼', desc: '참가기업·수혜자 모집에 적합한 혜택·대상·기간 중심 홍보 카드 스타일', prefix: 'government support program recruitment card design style of', suffix: 'support program recruitment visual, clear benefit-target-period structure, official announcement badge, application deadline area, trustworthy institutional blue accent, strong CTA zone, clean digital flyer and SNS card quality', group: 'uiinfo', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-application-step-guide', category: 'official', nameKo: '신청 절차 안내 플로우', emoji: '📝', desc: '신청 방법과 제출 절차를 단계별로 안내하는 플로우 카드 스타일', prefix: 'public application process step guide design style of', suffix: 'step-by-step application guide layout, numbered process flow, simple arrow connectors, document checklist blocks, clear start-to-finish sequence, accessible public service UI aesthetic, high contrast text zones', group: 'uiinfo', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-benefit-comparison', category: 'official', nameKo: '혜택 비교표 카드', emoji: '📊', desc: '지원금·바우처·교육 혜택을 표와 배지로 비교하는 정보 카드 스타일', prefix: 'public benefit comparison card design style of', suffix: 'benefit comparison table layout, subsidy voucher support amount blocks, eligibility and benefit badges, clean grid columns, official yet friendly infographic style, mobile-readable numbers and labels', group: 'uiinfo', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-faq-notice-card', category: 'official', nameKo: 'FAQ 안내 카드', emoji: '❓', desc: '자주 묻는 질문과 답변을 Q&A 카드로 정리하는 민원 안내 스타일', prefix: 'public service FAQ notice card design style of', suffix: 'FAQ Q and A card layout, question mark icon system, alternating question-answer panels, calm institutional colors, citizen-friendly help desk tone, simple labels and high readability, suitable for policy notice carousel', group: 'uiinfo', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-deadline-alert', category: 'official', nameKo: '마감 임박 알림 카드', emoji: '⏰', desc: '신청 마감·접수 기간을 강조하는 공공 안내 알림 스타일', prefix: 'public deadline alert announcement card style of', suffix: 'deadline alert visual for public application period, prominent date and D-day area, official notice banner, strong but not sensational accent color, clock or calendar icon, clean CTA area, urgent yet trustworthy institutional communication', group: 'uiinfo', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-youth-business-support', category: 'official', nameKo: '청년·소상공인 지원 홍보', emoji: '🤝', desc: '청년·창업·소상공인 지원사업에 맞는 친근한 인물 일러스트 홍보 스타일', prefix: 'youth and small business public support campaign illustration style of', suffix: 'friendly public support program illustration, young entrepreneurs and small business owners, rounded vector people, soft civic palette, benefit cards and CTA area, encouraging trustworthy tone for government support promotion', group: 'graphic', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-local-program-poster', category: 'official', nameKo: '지역 프로그램 포스터', emoji: '🏘️', desc: '지자체 행사·교육·참여 프로그램에 적합한 밝은 지역 홍보 포스터 스타일', prefix: 'local government community program poster style of', suffix: 'local community program poster, friendly civic illustration, event schedule and venue blocks, approachable bright palette, municipal notice board quality, readable title area and participation CTA, suitable for offline flyer and SNS', group: 'graphic', texture: 'glossy', usage: 'corporate' },
    { id: 'med-pub-performance-report-card', category: 'official', nameKo: '성과 홍보 리포트 카드', emoji: '🏆', desc: '사업 성과·수치·사례를 신뢰감 있게 보여주는 성과 홍보 카드 스타일', prefix: 'public project performance report card design style of', suffix: 'public project achievement promotion card, KPI numbers and outcome highlights, before-after result blocks, clean charts and evidence badges, restrained institutional palette, credible report-like but SNS-readable layout', group: 'uiinfo', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-citizen-participation-card', category: 'official', nameKo: '시민 참여 캠페인 카드', emoji: '🙋', desc: '설문·공청회·참여 이벤트를 유도하는 시민 참여형 캠페인 스타일', prefix: 'citizen participation campaign card design style of', suffix: 'civic participation campaign visual, people icons and speech bubble motifs, survey or public hearing participation CTA, inclusive friendly design, clean information hierarchy, public institution social media card aesthetic', group: 'graphic', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-service-launch-guide', category: 'official', nameKo: '공공서비스 오픈 안내', emoji: '🖥️', desc: '신규 서비스·플랫폼 오픈을 안내하는 디지털 행정 서비스 홍보 스타일', prefix: 'public digital service launch guide design style of', suffix: 'new public service launch announcement, clean app or website UI mockup area, service feature cards, launch date and access method blocks, modern e-government visual tone, blue-white digital civic design', group: 'uiinfo', texture: 'clean', usage: 'corporate' },
    { id: 'med-pub-checklist-carousel', category: 'official', nameKo: '체크리스트 캐러셀', emoji: '✅', desc: '준비물·신청요건·유의사항을 체크리스트로 정리하는 카드뉴스 스타일', prefix: 'public checklist carousel card design style of', suffix: 'checklist carousel layout, eligibility requirements and preparation items, tick icons in clean rounded boxes, compact mobile-readable spacing, official notice clarity, calm civic color palette, useful public information design', group: 'uiinfo', texture: 'clean', usage: 'corporate' },
    // ==================== 카드뉴스 SNS용 프리셋 (32종) ====================
    // 타이포그래피 강조 (8종)
    {
      id: 'med-cardnews-bold-type',
      category: 'cardnews',
      nameKo: '볼드 타이포',
      emoji: '🔤',
      desc: '굵은 타이포그래피가 중심인 카드',
      prefix: 'bold typography card design of',
      suffix: 'bold typography card layout, vertical mobile format, large clear text, minimal illustration, SNS card news style, high contrast, easy to read on mobile',
      group: 'graphic',
      texture: 'glossy',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-vibrant-bg',
      category: 'cardnews',
      nameKo: '컬러풀 배경',
      emoji: '🎨',
      desc: '생동감 있는 컬러 배경 카드',
      prefix: 'vibrant color background card of',
      suffix: 'vibrant colored background card, bright solid colors, clear text overlay, card news format, SNS social media card, contemporary design, mobile-optimized',
      group: 'graphic',
      texture: 'glossy',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-gradient',
      category: 'cardnews',
      nameKo: '그래디언트',
      emoji: '🌈',
      desc: '그러데이션 배경 카드',
      prefix: 'gradient background card design of',
      suffix: 'gradient background card, smooth color transition, modern gradient, text overlay, card news social media style, vertical format mobile',
      group: 'graphic',
      texture: 'glossy',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-text-overlay',
      category: 'cardnews',
      nameKo: '텍스트 오버레이',
      emoji: '📝',
      desc: '이미지 위에 텍스트를 겹친 카드',
      prefix: 'text overlay card design of',
      suffix: 'text overlay on image, semi-transparent text layer, readable typography, card news format, social media card, mobile vertical layout',
      group: 'graphic',
      texture: 'glossy',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-geometric-type',
      category: 'cardnews',
      nameKo: '기하 + 타입',
      emoji: '🔷',
      desc: '기하학적 요소와 타이포그래피 조합',
      prefix: 'geometric and typography card of',
      suffix: 'geometric shapes with bold text, modern design, structured layout, card news style, SNS optimized, high visual impact',
      group: 'graphic',
      texture: 'clean',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-type-illust',
      category: 'cardnews',
      nameKo: '타입 + 일러스트',
      emoji: '🎯',
      desc: '타이포그래피와 일러스트 조합',
      prefix: 'typography and illustration card of',
      suffix: 'text and illustration combined, balanced layout, card news format, simple illustration, modern SNS style, mobile-friendly design',
      group: 'graphic',
      texture: 'clean',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-minimal-text',
      category: 'cardnews',
      nameKo: '미니멀 텍스트',
      emoji: '✏️',
      desc: '여백을 살린 미니멀 텍스트',
      prefix: 'minimal text card design of',
      suffix: 'minimal text card, large negative space, clean layout, contemporary design, card news format, emphasizes message clarity',
      group: 'graphic',
      texture: 'clean',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-handdrawn-type',
      category: 'cardnews',
      nameKo: '핸드드로운 타입',
      emoji: '✍️',
      desc: '손그림 느낌의 타이포그래피 카드',
      prefix: 'hand-drawn typography card of',
      suffix: 'hand-drawn style text, friendly approachable design, sketch-like typography, card news format, warm casual aesthetic',
      group: 'graphic',
      texture: 'clean',
      usage: 'campaign'
    },
    // 일러스트 강조 (8종)
    {
      id: 'med-cardnews-pop-art',
      category: 'cardnews',
      nameKo: '팝아트',
      emoji: '🎭',
      desc: '팝아트 스타일 일러스트 카드',
      prefix: 'pop art illustration card of',
      suffix: 'pop art style, bold colors, striking illustration, high contrast, card news visual, social media optimized, eye-catching design',
      group: 'graphic',
      texture: 'glossy',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-flat-char',
      category: 'cardnews',
      nameKo: '플랫 캐릭터',
      emoji: '😊',
      desc: '플랫 스타일 캐릭터 일러스트 카드',
      prefix: 'flat character illustration card of',
      suffix: 'flat design character, cute simple character, friendly illustration, card news style, easy to understand visual',
      group: 'graphic',
      texture: 'clean',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-muted-tone',
      category: 'cardnews',
      nameKo: '톤톤한 색감',
      emoji: '🎨',
      desc: '차분한 톤의 일러스트 디자인',
      prefix: 'muted tone illustration card of',
      suffix: 'muted color palette illustration, soft muted tones, sophisticated card design, gentle visual style, modern card news',
      group: 'graphic',
      texture: 'clean',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-line-draw',
      category: 'cardnews',
      nameKo: '라인 드로잉',
      emoji: '📐',
      desc: '선으로만 그린 라인 드로잉 카드',
      prefix: 'line drawing illustration card of',
      suffix: 'line drawing style, minimalist line art, clean simple lines, contemporary illustration, card news format',
      group: 'graphic',
      texture: 'clean',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-watercolor',
      category: 'cardnews',
      nameKo: '수채화',
      emoji: '🎨',
      desc: '수채화 스타일 일러스트 카드',
      prefix: 'watercolor illustration card of',
      suffix: 'watercolor painting style, soft colors, artistic illustration, elegant card design, modern artistic flair',
      group: 'graphic',
      texture: 'clean',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-draw-type',
      category: 'cardnews',
      nameKo: '드로잉 + 타입',
      emoji: '🖍️',
      desc: '일러스트와 텍스트가 함께 있는 카드',
      prefix: 'illustration with text card design of',
      suffix: 'drawing and text combined, sketch illustration with typography, balanced layout, card news format, mixed media style',
      group: 'graphic',
      texture: 'clean',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-simple-icon',
      category: 'cardnews',
      nameKo: '심플 아이콘',
      emoji: '⭐',
      desc: '심플한 아이콘 일러스트 카드',
      prefix: 'simple icon design card of',
      suffix: 'simple icon illustration, clean icon design, minimalist symbols, card news format, easy visual communication',
      group: 'graphic',
      texture: 'clean',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-soft-style',
      category: 'cardnews',
      nameKo: '소프트 스타일',
      emoji: '💫',
      desc: '부드럽고 은은한 일러스트 스타일',
      prefix: 'soft style illustration card of',
      suffix: 'soft illustration style, gentle aesthetic, rounded shapes, warm colors, friendly approachable design, card news format',
      group: 'graphic',
      texture: 'clean',
      usage: 'campaign'
    },
    // SNS 최적화 (8종)
    {
      id: 'med-cardnews-insta-vibe',
      category: 'cardnews',
      nameKo: '인스타 감성',
      emoji: '📱',
      desc: '인스타그램 감성 카드 디자인',
      prefix: 'instagram aesthetic card design of',
      suffix: 'instagram style card, social media aesthetics, feed-optimized design, mobile vertical format, trendy visual design',
      group: 'graphic',
      texture: 'glossy',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-trendy',
      category: 'cardnews',
      nameKo: '트렌디',
      emoji: '✨',
      desc: '트렌디한 모던 카드 디자인',
      prefix: 'trendy modern card design of',
      suffix: 'trendy modern design, contemporary visual style, latest design trends, SNS optimized, eye-catching visual',
      group: 'graphic',
      texture: 'glossy',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-bright-bg',
      category: 'cardnews',
      nameKo: '밝은 배경',
      emoji: '☀️',
      desc: '밝은 배경 카드 디자인',
      prefix: 'bright background card design of',
      suffix: 'bright light background, cheerful colors, positive mood design, card news format, mobile social media optimized',
      group: 'graphic',
      texture: 'glossy',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-dark-bg',
      category: 'cardnews',
      nameKo: '다크 배경',
      emoji: '🌙',
      desc: '어두운 배경 카드 디자인',
      prefix: 'dark background card design of',
      suffix: 'dark background card, high contrast text, modern dark mode, dramatic visual, SNS nighttime friendly',
      group: 'graphic',
      texture: 'glossy',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-texture-bg',
      category: 'cardnews',
      nameKo: '텍스처 배경',
      emoji: '🎨',
      desc: '질감이 느껴지는 배경 카드',
      prefix: 'textured background card design of',
      suffix: 'texture background card, patterned background, subtle texture, modern card design, SNS visual interest',
      group: 'graphic',
      texture: 'textured',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-bokeh',
      category: 'cardnews',
      nameKo: '보케',
      emoji: '💧',
      desc: '보케 효과 배경 카드',
      prefix: 'bokeh effect card design of',
      suffix: 'bokeh background effect, blurred light circles, dreamy aesthetic, depth effect, modern card design',
      group: 'photo',
      texture: 'glossy',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-color-block',
      category: 'cardnews',
      nameKo: '컬러 블로킹',
      emoji: '⬛',
      desc: '컬러 블로킹 구성 카드',
      prefix: 'color blocking card design of',
      suffix: 'color blocking design, bold color sections, geometric color blocks, modern composition, SNS eye-catching',
      group: 'graphic',
      texture: 'clean',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-composite',
      category: 'cardnews',
      nameKo: '복합 레이어',
      emoji: '📚',
      desc: '여러 레이어를 겹친 복합 카드 디자인',
      prefix: 'composite layered card design of',
      suffix: 'multi-layer composition, complex visual elements, layered design, sophisticated card news, balanced visual hierarchy',
      group: 'graphic',
      texture: 'glossy',
      usage: 'campaign'
    },
    // 공공캠페인 (8종)
    {
      id: 'med-cardnews-attention',
      category: 'cardnews',
      nameKo: '주의환기',
      emoji: '⚠️',
      desc: '시선을 끄는 주의환기 캠페인 카드',
      prefix: 'attention-grabbing campaign card of',
      suffix: 'eye-catching design, urgent message visual, bold colors, clear call-to-action, awareness campaign style',
      group: 'graphic',
      texture: 'glossy',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-info-focus',
      category: 'cardnews',
      nameKo: '정보전달',
      emoji: '📊',
      desc: '정보 전달에 집중한 카드 디자인',
      prefix: 'information-focused card design showing',
      suffix: 'data-focused card, clear information hierarchy, readable layout, factual presentation, public service announcement style',
      group: 'graphic',
      texture: 'clean',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-emotional',
      category: 'cardnews',
      nameKo: '감정호소',
      emoji: '❤️',
      desc: '감정에 호소하는 캠페인 카드',
      prefix: 'emotional appeal campaign card of',
      suffix: 'emotional storytelling visual, touching design, human-centered narrative, empathy-driven card, moving visual message',
      group: 'graphic',
      texture: 'glossy',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-cta',
      category: 'cardnews',
      nameKo: '액션 유도',
      emoji: '👉',
      desc: '행동 유도(CTA)에 집중한 카드',
      prefix: 'call-to-action campaign card of',
      suffix: 'action-oriented design, clear CTA button, persuasive message, engagement-focused card, conversion-optimized visual',
      group: 'graphic',
      texture: 'glossy',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-story',
      category: 'cardnews',
      nameKo: '스토리텔링',
      emoji: '📖',
      desc: '이야기 흐름을 담은 스토리텔링 카드',
      prefix: 'storytelling narrative card of',
      suffix: 'narrative-driven card, sequential storytelling visual, compelling story card, character-based message, story card format',
      group: 'graphic',
      texture: 'clean',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-statistics',
      category: 'cardnews',
      nameKo: '통계 강조',
      emoji: '📈',
      desc: '통계 수치를 강조하는 카드 디자인',
      prefix: 'statistics highlight card showing',
      suffix: 'statistical data card, number emphasis, data visualization card, infographic card format, clear stat presentation',
      group: 'graphic',
      texture: 'clean',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-gamified',
      category: 'cardnews',
      nameKo: '게임화',
      emoji: '🎮',
      desc: '게임 요소를 더한 카드 디자인',
      prefix: 'gamified card design of',
      suffix: 'gamification elements, game-like visual, challenge card, progress bar visual, reward-focused design',
      group: 'graphic',
      texture: 'glossy',
      usage: 'campaign'
    },
    {
      id: 'med-cardnews-interactive',
      category: 'cardnews',
      nameKo: '인터랙티브',
      emoji: '🔄',
      desc: '참여를 유도하는 인터랙티브 카드',
      prefix: 'interactive engagement card of',
      suffix: 'interactive visual design, engagement elements, interactive card format, user-focused design, participatory visual',
      group: 'graphic',
      texture: 'glossy',
      usage: 'campaign'
    }
  ];

  const MIXER_MEDIUM_SAMPLES = {
    'med-3d': ['photo-1618005182384-a83a8bd57fbe', 'photo-1634017839464-5c339ebe3cb4', 'photo-1600585154340-be6161a56a0c'],
    'med-clay': ['photo-1596461404969-9ae70f2830c1', 'photo-1605496036006-fa36378ca4ab', 'photo-1558591710-4b4a1ae0f04d'],
    'med-iso': ['photo-1581291518633-83b4ebd1d83e', 'photo-1581291518857-4e27b48ff24e', 'photo-1508921912186-1d1a45ebb3c1'],
    'med-voxel': ['photo-1620121692029-d088224ddc74', 'photo-1607604276583-eef5d076aa5f', 'photo-1618005182384-a83a8bd57fbe'],
    'med-lowpoly': ['photo-1550751827-4bd374c3f58b', 'photo-1544383835-bda2bc66a55d', 'photo-1618005198143-e528346d9a9f'],
    'med-hologram': ['photo-1635070041078-e363dbe005cb', 'photo-1526374965328-7f61d4dc18c5', 'photo-1506318137071-a8e063b4bec0'],
    'med-fluiddyn': ['photo-1541701494587-cb58502866ab', 'photo-1618005182384-a83a8bd57fbe', 'photo-1618005198143-e528346d9a9f'],
    'med-spline': ['photo-1634017839464-5c339ebe3cb4', 'photo-1550684848-fac1c5b4e853', 'photo-1618005198143-e528346d9a9f'],
    'med-watercolor': ['photo-1579783900882-c0d3dad7b119', 'photo-1579783928621-7a13d66a62d1', 'photo-1513364776144-60967b0f800f'],
    'med-oil': ['photo-1579783902614-a3fb3927b6a5', 'photo-1579783900882-c0d3dad7b119', 'photo-1605721911519-3dfeb3be25e7'],
    'med-pencil': ['photo-1576016770956-debb63d90029', 'photo-1580136579312-94651dfd596d', 'photo-1513364776144-60967b0f800f'],
    'med-ink': ['photo-1579783900882-c0d3dad7b119', 'photo-1605721911519-3dfeb3be25e7', 'photo-1579783902614-a3fb3927b6a5'],
    'med-crayon': ['photo-1513364776144-60967b0f800f', 'photo-1502086223501-7ea6ecd79368', 'photo-1560420015-90530c727183'],
    'med-gouache': ['photo-1579783902614-a3fb3927b6a5', 'photo-1579783928621-7a13d66a62d1', 'photo-1513364776144-60967b0f800f'],
    'med-acrylic': ['photo-1541701494587-cb58502866ab', 'photo-1605721911519-3dfeb3be25e7', 'photo-1579783928621-7a13d66a62d1'],
    'med-etching': ['photo-1605721911519-3dfeb3be25e7', 'photo-1579783902614-a3fb3927b6a5', 'photo-1580136579312-94651dfd596d'],
    'med-glass': ['photo-1618005182384-a83a8bd57fbe', 'photo-1634017839464-5c339ebe3cb4', 'photo-1550684848-fac1c5b4e853'],
    'med-flat': ['photo-1579783928621-7a13d66a62d1', 'photo-1581291518633-83b4ebd1d83e', 'photo-1558591710-4b4a1ae0f04d'],
    'med-neon': ['photo-1506318137071-a8e063b4bec0', 'photo-1526374965328-7f61d4dc18c5', 'photo-1635070041078-e363dbe005cb'],
    'med-halftone': ['photo-1607604276583-eef5d076aa5f', 'photo-1560420015-90530c727183', 'photo-1579783902614-a3fb3927b6a5'],
    'med-bauhaus': ['photo-1618005182384-a83a8bd57fbe', 'photo-1550684848-fac1c5b4e853', 'photo-1579783928621-7a13d66a62d1'],
    'med-risograph': ['photo-1579783900882-c0d3dad7b119', 'photo-1560420015-90530c727183', 'photo-1579783928621-7a13d66a62d1'],
    'med-cyberpunk-vector': ['photo-1526374965328-7f61d4dc18c5', 'photo-1506318137071-a8e063b4bec0', 'photo-1635070041078-e363dbe005cb'],
    'med-psychedelic': ['photo-1541701494587-cb58502866ab', 'photo-1618005198143-e528346d9a9f', 'photo-1550684848-fac1c5b4e853'],
    'med-cel-anime': ['photo-1607604276583-eef5d076aa5f', 'photo-1578632767115-351597cf2477', 'photo-1560169897-fc0cdbdfa4d5'],
    'med-webtoon': ['photo-1607604276583-eef5d076aa5f', 'photo-1578632767115-351597cf2477', 'photo-1560169897-fc0cdbdfa4d5'],
    'med-american-comic': ['photo-1607604276583-eef5d076aa5f', 'photo-1560420015-90530c727183', 'photo-1578632767115-351597cf2477'],
    'med-manga': ['photo-1607604276583-eef5d076aa5f', 'photo-1578632767115-351597cf2477', 'photo-1560169897-fc0cdbdfa4d5'],
    'med-chibi': ['photo-1607604276583-eef5d076aa5f', 'photo-1578632767115-351597cf2477', 'photo-1560169897-fc0cdbdfa4d5'],
    'med-ghibli': ['photo-1447752875215-b2761acb3c5d', 'photo-1507525428034-b723cf961d3e', 'photo-1441974231531-c6227db76b6e'],
    'med-cyber-cyberpunk': ['photo-1506318137071-a8e063b4bec0', 'photo-1526374965328-7f61d4dc18c5', 'photo-1635070041078-e363dbe005cb'],
    'med-ink-splatter': ['photo-1579783900882-c0d3dad7b119', 'photo-1605721911519-3dfeb3be25e7', 'photo-1579783902614-a3fb3927b6a5'],
    'med-film-photo': ['photo-1492691527719-9d1e07e534b4', 'photo-1508921912186-1d1a45ebb3c1', 'photo-1516035069371-29a1b244cc32'],
    'med-micro-photo': ['photo-1576086213369-97a306d36557', 'photo-1532187643603-ba119ca4109e', 'photo-1518152006812-edab29b069ac'],
    'med-exposure-photo': ['photo-1506318137071-a8e063b4bec0', 'photo-1518152006812-edab29b069ac', 'photo-1526374965328-7f61d4dc18c5'],
    'med-press-photo': ['photo-1492691527719-9d1e07e534b4', 'photo-1504711434969-e33886168f5c', 'photo-1508921912186-1d1a45ebb3c1'],
    'med-polaroid': ['photo-1526304640581-d334cdbbf45e', 'photo-1508921912186-1d1a45ebb3c1', 'photo-1516035069371-29a1b244cc32'],
    'med-drone': ['photo-1507525428034-b723cf961d3e', 'photo-1447752875215-b2761acb3c5d', 'photo-1470071459604-3b5ec3a7fe05'],
    'med-thermal': ['photo-1635070041078-e363dbe005cb', 'photo-1506318137071-a8e063b4bec0', 'photo-1526374965328-7f61d4dc18c5'],
    'med-macro': ['photo-1518152006812-edab29b069ac', 'photo-1532187643603-ba119ca4109e', 'photo-1576086213369-97a306d36557'],
    'med-origami': ['photo-1607604276583-eef5d076aa5f', 'photo-1560420015-90530c727183', 'photo-1578632767115-351597cf2477'],
    'med-felt': ['photo-1596461404969-9ae70f2830c1', 'photo-1605496036006-fa36378ca4ab', 'photo-1558591710-4b4a1ae0f04d'],
    'med-papercut': ['photo-1560420015-90530c727183', 'photo-1578632767115-351597cf2477', 'photo-1607604276583-eef5d076aa5f'],
    'med-embroidery': ['photo-1605721911519-3dfeb3be25e7', 'photo-1579783902614-a3fb3927b6a5', 'photo-1579783928621-7a13d66a62d1'],
    'med-diorama': ['photo-1605496036006-fa36378ca4ab', 'photo-1596461404969-9ae70f2830c1', 'photo-1558591710-4b4a1ae0f04d'],
    'med-stainedglass': ['photo-1579783928621-7a13d66a62d1', 'photo-1541701494587-cb58502866ab', 'photo-1618005198143-e528346d9a9f'],
    'med-ceramic': ['photo-1618005182384-a83a8bd57fbe', 'photo-1634017839464-5c339ebe3cb4', 'photo-1596461404969-9ae70f2830c1'],
    'med-leather': ['photo-1526304640581-d334cdbbf45e', 'photo-1508921912186-1d1a45ebb3c1', 'photo-1492691527719-9d1e07e534b4'],
    'med-whitepaper': ['photo-1581291518633-83b4ebd1d83e', 'photo-1460925895917-afdab827c52f', 'photo-1558591710-4b4a1ae0f04d'],
    'med-official-photo': ['photo-1492691527719-9d1e07e534b4', 'photo-1486406146926-c627a92ad1ab', 'photo-1504711434969-e33886168f5c'],
    'med-report-diagram': ['photo-1581291518633-83b4ebd1d83e', 'photo-1460925895917-afdab827c52f', 'photo-1590283603385-17ffb3a7f29f'],
    'med-annual-report': ['photo-1492691527719-9d1e07e534b4', 'photo-1460925895917-afdab827c52f', 'photo-1486406146926-c627a92ad1ab'],
    'med-presentation-slide': ['photo-1504711434969-e33886168f5c', 'photo-1581291518633-83b4ebd1d83e', 'photo-1486406146926-c627a92ad1ab'],
    'med-data-journalism': ['photo-1590283603385-17ffb3a7f29f', 'photo-1460925895917-afdab827c52f', 'photo-1581291518633-83b4ebd1d83e'],
    'med-pixel-retro': ['photo-1607604276583-eef5d076aa5f', 'photo-1620121692029-d088224ddc74', 'photo-1578632767115-351597cf2477'],
    'med-pixel-16bit': ['photo-1607604276583-eef5d076aa5f', 'photo-1560169897-fc0cdbdfa4d5', 'photo-1578632767115-351597cf2477'],
    'med-concept-fantasy': ['photo-1447752875215-b2761acb3c5d', 'photo-1470071459604-3b5ec3a7fe05', 'photo-1441974231531-c6227db76b6e'],
    'med-game-hud': ['photo-1635070041078-e363dbe005cb', 'photo-1526374965328-7f61d4dc18c5', 'photo-1506318137071-a8e063b4bec0'],
    'med-synthwave': ['photo-1526374965328-7f61d4dc18c5', 'photo-1506318137071-a8e063b4bec0', 'photo-1635070041078-e363dbe005cb'],
    'med-vaporwave': ['photo-1541701494587-cb58502866ab', 'photo-1618005198143-e528346d9a9f', 'photo-1550684848-fac1c5b4e853'],
    'med-concept-scifi': ['photo-1618005182384-a83a8bd57fbe', 'photo-1635070041078-e363dbe005cb', 'photo-1526374965328-7f61d4dc18c5'],
    'med-gacha-card': ['photo-1578632767115-351597cf2477', 'photo-1607604276583-eef5d076aa5f', 'photo-1560169897-fc0cdbdfa4d5'],
    'med-minhwa': ['photo-1579783902614-a3fb3927b6a5', 'photo-1513364776144-60967b0f800f', 'photo-1605721911519-3dfeb3be25e7'],
    'med-ukiyoe': ['photo-1579783900882-c0d3dad7b119', 'photo-1513364776144-60967b0f800f', 'photo-1579783902614-a3fb3927b6a5'],
    'med-chinese-inkwash': ['photo-1579783900882-c0d3dad7b119', 'photo-1605721911519-3dfeb3be25e7', 'photo-1513364776144-60967b0f800f'],
    'med-linocut': ['photo-1605721911519-3dfeb3be25e7', 'photo-1580136579312-94651dfd596d', 'photo-1579783902614-a3fb3927b6a5'],
    'med-art-deco': ['photo-1460925895917-afdab827c52f', 'photo-1581291518633-83b4ebd1d83e', 'photo-1492691527719-9d1e07e534b4'],
    'med-vintage-poster': ['photo-1460925895917-afdab827c52f', 'photo-1526304640581-d334cdbbf45e', 'photo-1508921912186-1d1a45ebb3c1'],
    'med-constructivism': ['photo-1560420015-90530c727183', 'photo-1579783900882-c0d3dad7b119', 'photo-1605721911519-3dfeb3be25e7'],
    'med-korean-calligraphy': ['photo-1579783900882-c0d3dad7b119', 'photo-1605721911519-3dfeb3be25e7', 'photo-1513364776144-60967b0f800f'],
    'med-glitch': ['photo-1526374965328-7f61d4dc18c5', 'photo-1506318137071-a8e063b4bec0', 'photo-1635070041078-e363dbe005cb'],
    'med-generative': ['photo-1541701494587-cb58502866ab', 'photo-1618005198143-e528346d9a9f', 'photo-1618005182384-a83a8bd57fbe'],
    'med-abstract-expr': ['photo-1541701494587-cb58502866ab', 'photo-1618005198143-e528346d9a9f', 'photo-1550684848-fac1c5b4e853'],
    'med-optical-illusion': ['photo-1607604276583-eef5d076aa5f', 'photo-1560420015-90530c727183', 'photo-1579783928621-7a13d66a62d1'],
    'med-fractal': ['photo-1618005198143-e528346d9a9f', 'photo-1541701494587-cb58502866ab', 'photo-1550684848-fac1c5b4e853'],
    'med-collage': ['photo-1560420015-90530c727183', 'photo-1579783900882-c0d3dad7b119', 'photo-1513364776144-60967b0f800f'],
    'med-psychedelic-art': ['photo-1541701494587-cb58502866ab', 'photo-1618005198143-e528346d9a9f', 'photo-1550684848-fac1c5b4e853'],
    'med-kinetic-pattern': ['photo-1579783928621-7a13d66a62d1', 'photo-1560420015-90530c727183', 'photo-1607604276583-eef5d076aa5f'],
    'med-arch-render': ['photo-1486406146926-c627a92ad1ab', 'photo-1460925895917-afdab827c52f', 'photo-1581291518633-83b4ebd1d83e'],
    'med-blueprint': ['photo-1581291518633-83b4ebd1d83e', 'photo-1460925895917-afdab827c52f', 'photo-1486406146926-c627a92ad1ab'],
    'med-interior-viz': ['photo-1460925895917-afdab827c52f', 'photo-1486406146926-c627a92ad1ab', 'photo-1492691527719-9d1e07e534b4'],
    'med-urban-planning': ['photo-1486406146926-c627a92ad1ab', 'photo-1507525428034-b723cf961d3e', 'photo-1470071459604-3b5ec3a7fe05'],
    'med-section-drawing': ['photo-1581291518633-83b4ebd1d83e', 'photo-1486406146926-c627a92ad1ab', 'photo-1460925895917-afdab827c52f'],
    'med-landscape-arch': ['photo-1447752875215-b2761acb3c5d', 'photo-1507525428034-b723cf961d3e', 'photo-1441974231531-c6227db76b6e'],
    'med-heritage-drawing': ['photo-1579783902614-a3fb3927b6a5', 'photo-1486406146926-c627a92ad1ab', 'photo-1513364776144-60967b0f800f'],
    'med-space-planning': ['photo-1581291518633-83b4ebd1d83e', 'photo-1558591710-4b4a1ae0f04d', 'photo-1460925895917-afdab827c52f'],
    // editorial
    'med-fashion-illust': ['photo-1558618666-fcd25c85cd64', 'photo-1509631179647-0177331693ae', 'photo-1469334031218-e382a71b716b'],
    'med-luxury-mag': ['photo-1523275335684-37898b6baf30', 'photo-1483985988355-763728e1935b', 'photo-1490481651871-ab68de25d43d'],
    'med-beauty-ad': ['photo-1487412947147-5cebf100ffc2', 'photo-1516975080664-ed2fc6a32937', 'photo-1522337360788-8b13dee7a37e'],
    'med-sports-illust': ['photo-1461896836934-ffe607ba8211', 'photo-1571902943202-507ec2618e8f', 'photo-1485872299829-c673f5194813'],
    'med-childrens-book': ['photo-1544716278-ca5e3f4abd8c', 'photo-1481627834876-b7833e8f5570', 'photo-1512436991641-6745cdb1723f'],
    'med-portrait-editorial': ['photo-1531746020798-e6953c6e8e04', 'photo-1500648767791-00dcc994a43e', 'photo-1544005313-94ddf0286df2'],
    'med-food-editorial': ['photo-1547592180-85f173990554', 'photo-1565299624946-b28f40a0ae38', 'photo-1504674900247-0877df9cc836'],
    'med-lifestyle-photo': ['photo-1484723091739-30a097e8f929', 'photo-1519682337058-a94d519337bc', 'photo-1506905925346-21bda4d32df4'],
    // digital_paint
    'med-photobash': ['photo-1534796636912-3b95b3ab5986', 'photo-1500534314209-a25ddb2bd429', 'photo-1451187580459-43490279c0fa'],
    'med-digital-impasto': ['photo-1579783902614-a3fb3927b6a5', 'photo-1605721911519-3dfeb3be25e7', 'photo-1579783928621-7a13d66a62d1'],
    'med-matte-painting': ['photo-1462275646964-a0e3386b89fa', 'photo-1464822759023-fed622ff2c3b', 'photo-1500534314209-a25ddb2bd429'],
    'med-concept-sketch': ['photo-1580136579312-94651dfd596d', 'photo-1576016770956-debb63d90029', 'photo-1513364776144-60967b0f800f'],
    'med-speed-paint': ['photo-1541701494587-cb58502866ab', 'photo-1534796636912-3b95b3ab5986', 'photo-1464822759023-fed622ff2c3b'],
    'med-3d-paint-hybrid': ['photo-1618005182384-a83a8bd57fbe', 'photo-1634017839464-5c339ebe3cb4', 'photo-1600585154340-be6161a56a0c'],
    'med-noise-texture': ['photo-1557672172-298e090bd0f1', 'photo-1558591710-4b4a1ae0f04d', 'photo-1579783928621-7a13d66a62d1'],
    'med-digital-ink': ['photo-1579783902614-a3fb3927b6a5', 'photo-1605721911519-3dfeb3be25e7', 'photo-1513364776144-60967b0f800f'],
    // ui_ux
    'med-app-dashboard': ['photo-1551288049-bebda4e38f71', 'photo-1460925895917-afdab827c52f', 'photo-1555066931-4365d14bab8c'],
    'med-wireframe': ['photo-1581291518633-83b4ebd1d83e', 'photo-1460925895917-afdab827c52f', 'photo-1544383835-bda2bc66a55d'],
    'med-gamification-ui': ['photo-1614680376408-81e91ffe3db7', 'photo-1551103782-8ab4ad07d4e6', 'photo-1593642632559-0c6d3fc62b89'],
    'med-glassmorphism': ['photo-1557672172-298e090bd0f1', 'photo-1635070041078-e363dbe005cb', 'photo-1526374965328-7f61d4dc18c5'],
    'med-neumorphism': ['photo-1581291518633-83b4ebd1d83e', 'photo-1544383835-bda2bc66a55d', 'photo-1551288049-bebda4e38f71'],
    'med-dark-mode-app': ['photo-1555066931-4365d14bab8c', 'photo-1526374965328-7f61d4dc18c5', 'photo-1635070041078-e363dbe005cb'],
    'med-data-viz-infographic': ['photo-1551288049-bebda4e38f71', 'photo-1460925895917-afdab827c52f', 'photo-1590283603385-17ffb3a7f29f'],
    'med-system-arch-diagram': ['photo-1544383835-bda2bc66a55d', 'photo-1460925895917-afdab827c52f', 'photo-1555066931-4365d14bab8c'],
    // pixel_adv
    'med-iso-pixel-city': ['photo-1581291518633-83b4ebd1d83e', 'photo-1607604276583-eef5d076aa5f', 'photo-1550751827-4bd374c3f58b'],
    'med-dot-art-sprite': ['photo-1620121692029-d088224ddc74', 'photo-1550751827-4bd374c3f58b', 'photo-1607604276583-eef5d076aa5f'],
    'med-rpg-bg-pixel': ['photo-1550751827-4bd374c3f58b', 'photo-1581291518633-83b4ebd1d83e', 'photo-1544383835-bda2bc66a55d'],
    'med-dither-grayscale': ['photo-1607604276583-eef5d076aa5f', 'photo-1620121692029-d088224ddc74', 'photo-1550751827-4bd374c3f58b'],
    'med-hi-res-pixel': ['photo-1550751827-4bd374c3f58b', 'photo-1620121692029-d088224ddc74', 'photo-1614680376408-81e91ffe3db7'],
    'med-pixel-particles': ['photo-1618005182384-a83a8bd57fbe', 'photo-1635070041078-e363dbe005cb', 'photo-1526374965328-7f61d4dc18c5'],
    'med-retro-crt': ['photo-1550751827-4bd374c3f58b', 'photo-1607604276583-eef5d076aa5f', 'photo-1620121692029-d088224ddc74'],
    'med-pixel-anim-still': ['photo-1620121692029-d088224ddc74', 'photo-1550751827-4bd374c3f58b', 'photo-1607604276583-eef5d076aa5f'],
    // nature_photo
    'med-golden-hour': ['photo-1500534314209-a25ddb2bd429', 'photo-1464822759023-fed622ff2c3b', 'photo-1507525428034-b723cf961d3e'],
    'med-aurora-long-exp': ['photo-1531366936337-7c912a4589a7', 'photo-1502224562085-639556652f33', 'photo-1531766272849-0bfe35a6bf35'],
    'med-misty-forest': ['photo-1448375240586-882707db888b', 'photo-1441974231531-c6227db76b6e', 'photo-1500534314209-a25ddb2bd429'],
    'med-reflection-symmetry': ['photo-1501854140801-50d01698950b', 'photo-1507525428034-b723cf961d3e', 'photo-1464822759023-fed622ff2c3b'],
    'med-underwater': ['photo-1518020382113-a7e8fc38eac9', 'photo-1504208434309-cb69f4fe52b0', 'photo-1562126425-cb2a1b18b42c'],
    'med-aerial-drone': ['photo-1473448912268-2022ce9509d8', 'photo-1501854140801-50d01698950b', 'photo-1444723121867-7a241cacace9'],
    'med-bw-street-doc': ['photo-1496442226666-8d4d0e62e6e9', 'photo-1477959858617-67f85cf4f1df', 'photo-1449824913935-59a10b8d2000'],
    'med-studio-still-life': ['photo-1523275335684-37898b6baf30', 'photo-1547592180-85f173990554', 'photo-1565299624946-b28f40a0ae38'],
    // abstract (new)
    'med-color-field': ['photo-1557672172-298e090bd0f1', 'photo-1541701494587-cb58502866ab', 'photo-1579783902614-a3fb3927b6a5'],
    'med-suprematism': ['photo-1558591710-4b4a1ae0f04d', 'photo-1557804506-669a67965ba0', 'photo-1618005182384-a83a8bd57fbe'],
    'med-op-art': ['photo-1635070041078-e363dbe005cb', 'photo-1526374965328-7f61d4dc18c5', 'photo-1557672172-298e090bd0f1'],
    'med-abstract-expr': ['photo-1541701494587-cb58502866ab', 'photo-1579783902614-a3fb3927b6a5', 'photo-1605721911519-3dfeb3be25e7'],
    'med-data-art': ['photo-1551288049-bebda4e38f71', 'photo-1460925895917-afdab827c52f', 'photo-1590283603385-17ffb3a7f29f'],
    'med-glitch-art': ['photo-1526374965328-7f61d4dc18c5', 'photo-1635070041078-e363dbe005cb', 'photo-1557672172-298e090bd0f1'],
    'med-light-art': ['photo-1518770660439-4636190af475', 'photo-1534796636912-3b95b3ab5986', 'photo-1541701494587-cb58502866ab'],
    'med-algorithmic-art': ['photo-1618005182384-a83a8bd57fbe', 'photo-1557672172-298e090bd0f1', 'photo-1526374965328-7f61d4dc18c5'],
    // arch (new)
    'med-parametric-arch': ['photo-1486406146926-c627a92ad1ab', 'photo-1460925895917-afdab827c52f', 'photo-1518770660439-4636190af475'],
    'med-biophilic-arch': ['photo-1441974231531-c6227db76b6e', 'photo-1447752875215-b2761acb3c5d', 'photo-1486406146926-c627a92ad1ab'],
    'med-adaptive-reuse': ['photo-1513364776144-60967b0f800f', 'photo-1486406146926-c627a92ad1ab', 'photo-1460925895917-afdab827c52f'],
    'med-arch-diagram': ['photo-1581291518633-83b4ebd1d83e', 'photo-1460925895917-afdab827c52f', 'photo-1544383835-bda2bc66a55d'],
    'med-night-arch': ['photo-1486406146926-c627a92ad1ab', 'photo-1513364776144-60967b0f800f', 'photo-1518770660439-4636190af475'],
    'med-urban-masterplan': ['photo-1444723121867-7a241cacace9', 'photo-1486406146926-c627a92ad1ab', 'photo-1473448912268-2022ce9509d8'],
    'med-interior-render': ['photo-1600585154340-be6161a56a0c', 'photo-1558591710-4b4a1ae0f04d', 'photo-1486406146926-c627a92ad1ab'],
    'med-timber-arch': ['photo-1441974231531-c6227db76b6e', 'photo-1486406146926-c627a92ad1ab', 'photo-1513364776144-60967b0f800f'],
    // editorial (new)
    'med-luxury-product': ['photo-1523275335684-37898b6baf30', 'photo-1485872299829-c673f5194813', 'photo-1558591710-4b4a1ae0f04d'],
    'med-sports-editorial': ['photo-1461896836934-ffe607ba8211', 'photo-1571902943202-507ec2618e8f', 'photo-1485872299829-c673f5194813'],
    'med-beauty-campaign': ['photo-1509631179647-0177331693ae', 'photo-1558618666-fcd25c85cd64', 'photo-1490481651871-ab68de25d43d'],
    'med-travel-editorial': ['photo-1506905925346-21bda4d32df4', 'photo-1507525428034-b723cf961d3e', 'photo-1484723091739-30a097e8f929'],
    'med-corporate-portrait': ['photo-1500648767791-00dcc994a43e', 'photo-1531746020798-e6953c6e8e04', 'photo-1544005313-94ddf0286df2'],
    'med-architecture-editorial': ['photo-1486406146926-c627a92ad1ab', 'photo-1460925895917-afdab827c52f', 'photo-1513364776144-60967b0f800f'],
    'med-conceptual-fashion': ['photo-1490481651871-ab68de25d43d', 'photo-1558618666-fcd25c85cd64', 'photo-1483985988355-763728e1935b'],
    'med-social-content': ['photo-1519682337058-a94d519337bc', 'photo-1484723091739-30a097e8f929', 'photo-1460925895917-afdab827c52f'],
    // digital_paint (new)
    'med-environment-concept': ['photo-1464822759023-fed622ff2c3b', 'photo-1462275646964-a0e3386b89fa', 'photo-1534796636912-3b95b3ab5986'],
    'med-creature-design': ['photo-1618005182384-a83a8bd57fbe', 'photo-1605721911519-3dfeb3be25e7', 'photo-1579783902614-a3fb3927b6a5'],
    'med-character-concept': ['photo-1541701494587-cb58502866ab', 'photo-1605721911519-3dfeb3be25e7', 'photo-1618005182384-a83a8bd57fbe'],
    'med-sci-fi-matte': ['photo-1534796636912-3b95b3ab5986', 'photo-1462275646964-a0e3386b89fa', 'photo-1451187580459-43490279c0fa'],
    'med-book-cover-art': ['photo-1481627834876-b7833e8f5570', 'photo-1512436991641-6745cdb1723f', 'photo-1544716278-ca5e3f4abd8c'],
    'med-storyboard': ['photo-1580136579312-94651dfd596d', 'photo-1576016770956-debb63d90029', 'photo-1513364776144-60967b0f800f'],
    'med-graphic-novel': ['photo-1614680376408-81e91ffe3db7', 'photo-1541701494587-cb58502866ab', 'photo-1605721911519-3dfeb3be25e7'],
    'med-fan-art': ['photo-1618005182384-a83a8bd57fbe', 'photo-1579783902614-a3fb3927b6a5', 'photo-1605721911519-3dfeb3be25e7'],
    // ui_ux (new)
    'med-onboarding-flow': ['photo-1581291518633-83b4ebd1d83e', 'photo-1555066931-4365d14bab8c', 'photo-1544383835-bda2bc66a55d'],
    'med-e-commerce-ui': ['photo-1460925895917-afdab827c52f', 'photo-1551288049-bebda4e38f71', 'photo-1555066931-4365d14bab8c'],
    'med-design-system': ['photo-1544383835-bda2bc66a55d', 'photo-1581291518633-83b4ebd1d83e', 'photo-1460925895917-afdab827c52f'],
    'med-landing-page-ui': ['photo-1555066931-4365d14bab8c', 'photo-1460925895917-afdab827c52f', 'photo-1551288049-bebda4e38f71'],
    'med-mobile-notification': ['photo-1551103782-8ab4ad07d4e6', 'photo-1593642632559-0c6d3fc62b89', 'photo-1555066931-4365d14bab8c'],
    'med-auth-ui': ['photo-1526374965328-7f61d4dc18c5', 'photo-1555066931-4365d14bab8c', 'photo-1544383835-bda2bc66a55d'],
    'med-data-table-ui': ['photo-1551288049-bebda4e38f71', 'photo-1590283603385-17ffb3a7f29f', 'photo-1460925895917-afdab827c52f'],
    'med-empty-state': ['photo-1535713875002-d1d0cf377fde', 'photo-1555066931-4365d14bab8c', 'photo-1544383835-bda2bc66a55d'],
    // pixel_adv (new)
    'med-pixel-portrait': ['photo-1620121692029-d088224ddc74', 'photo-1607604276583-eef5d076aa5f', 'photo-1550751827-4bd374c3f58b'],
    'med-pixel-landscape': ['photo-1550751827-4bd374c3f58b', 'photo-1607604276583-eef5d076aa5f', 'photo-1620121692029-d088224ddc74'],
    'med-pixel-icon-set': ['photo-1607604276583-eef5d076aa5f', 'photo-1620121692029-d088224ddc74', 'photo-1614680376408-81e91ffe3db7'],
    'med-pixel-horror': ['photo-1526374965328-7f61d4dc18c5', 'photo-1557672172-298e090bd0f1', 'photo-1620121692029-d088224ddc74'],
    'med-pixel-map': ['photo-1581291518633-83b4ebd1d83e', 'photo-1550751827-4bd374c3f58b', 'photo-1607604276583-eef5d076aa5f'],
    'med-voxel-art': ['photo-1618005182384-a83a8bd57fbe', 'photo-1620121692029-d088224ddc74', 'photo-1634017839464-5c339ebe3cb4'],
    'med-demoscene': ['photo-1526374965328-7f61d4dc18c5', 'photo-1618005182384-a83a8bd57fbe', 'photo-1550751827-4bd374c3f58b'],
    'med-pixel-cutscene': ['photo-1620121692029-d088224ddc74', 'photo-1614680376408-81e91ffe3db7', 'photo-1607604276583-eef5d076aa5f'],
    // nature_photo (new)
    'med-wildlife-photo': ['photo-1441974231531-c6227db76b6e', 'photo-1448375240586-882707db888b', 'photo-1507525428034-b723cf961d3e'],
    'med-storm-sky': ['photo-1531366936337-7c912a4589a7', 'photo-1464822759023-fed622ff2c3b', 'photo-1500534314209-a25ddb2bd429'],
    'med-season-color': ['photo-1507525428034-b723cf961d3e', 'photo-1441974231531-c6227db76b6e', 'photo-1464822759023-fed622ff2c3b'],
    'med-ocean-wave': ['photo-1518020382113-a7e8fc38eac9', 'photo-1562126425-cb2a1b18b42c', 'photo-1504208434309-cb69f4fe52b0'],
    'med-desert-sand': ['photo-1501854140801-50d01698950b', 'photo-1473448912268-2022ce9509d8', 'photo-1464822759023-fed622ff2c3b'],
    'med-mountain-fog': ['photo-1506905925346-21bda4d32df4', 'photo-1448375240586-882707db888b', 'photo-1531366936337-7c912a4589a7'],
    'med-macro-nature': ['photo-1441974231531-c6227db76b6e', 'photo-1507525428034-b723cf961d3e', 'photo-1448375240586-882707db888b'],
    'med-night-sky-photo': ['photo-1531366936337-7c912a4589a7', 'photo-1502224562085-639556652f33', 'photo-1451187580459-43490279c0fa'],
    // tech3d (new from prev session)
    'med-neon-glow': ['photo-1618005182384-a83a8bd57fbe', 'photo-1526374965328-7f61d4dc18c5', 'photo-1557672172-298e090bd0f1'],
    'med-product-3d': ['photo-1600585154340-be6161a56a0c', 'photo-1523275335684-37898b6baf30', 'photo-1558591710-4b4a1ae0f04d'],
    'med-technical-explode': ['photo-1581291518633-83b4ebd1d83e', 'photo-1460925895917-afdab827c52f', 'photo-1618005182384-a83a8bd57fbe'],
    'med-crystal-3d': ['photo-1618005182384-a83a8bd57fbe', 'photo-1557672172-298e090bd0f1', 'photo-1635070041078-e363dbe005cb'],
    'med-chrome-3d': ['photo-1600585154340-be6161a56a0c', 'photo-1618005182384-a83a8bd57fbe', 'photo-1557672172-298e090bd0f1'],
    'med-bubble-3d': ['photo-1618005182384-a83a8bd57fbe', 'photo-1634017839464-5c339ebe3cb4', 'photo-1557672172-298e090bd0f1'],
    'med-wireframe-3d': ['photo-1581291518633-83b4ebd1d83e', 'photo-1618005182384-a83a8bd57fbe', 'photo-1544383835-bda2bc66a55d'],
    'med-particle-3d': ['photo-1618005182384-a83a8bd57fbe', 'photo-1526374965328-7f61d4dc18c5', 'photo-1535713875002-d1d0cf377fde'],
    'med-real-cgi-keyvisual': ['photo-1497366754035-f200968a6e72', 'photo-1518770660439-4636190af475', 'photo-1618005182384-a83a8bd57fbe'],
    'med-photo-3d-icons': ['photo-1460925895917-afdab827c52f', 'photo-1551434678-e076c223a692', 'photo-1581291518633-83b4ebd1d83e'],
    'med-product-photo-cgi': ['photo-1523275335684-37898b6baf30', 'photo-1600585154340-be6161a56a0c', 'photo-1558591710-4b4a1ae0f04d'],
    'med-arch-photo-3d-overlay': ['photo-1486406146926-c627a92ad1ab', 'photo-1497366754035-f200968a6e72', 'photo-1581291518633-83b4ebd1d83e'],
    'med-human-3d-data': ['photo-1551434678-e076c223a692', 'photo-1552664730-d307ca884978', 'photo-1460925895917-afdab827c52f'],
    'med-real-clay-hybrid': ['photo-1558591710-4b4a1ae0f04d', 'photo-1634017839464-5c339ebe3cb4', 'photo-1541701494587-cb58502866ab'],
    'med-real-hologram-hybrid': ['photo-1518770660439-4636190af475', 'photo-1526374965328-7f61d4dc18c5', 'photo-1497366754035-f200968a6e72'],
    'med-3d-motion-still': ['photo-1618005182384-a83a8bd57fbe', 'photo-1557672172-298e090bd0f1', 'photo-1526374965328-7f61d4dc18c5'],
    'med-real-miniature-diorama': ['photo-1600585154340-be6161a56a0c', 'photo-1500530855697-b586d89ba3ee', 'photo-1497366754035-f200968a6e72'],
    'med-ar-interface-composite': ['photo-1516321318423-f06f85e504b3', 'photo-1551434678-e076c223a692', 'photo-1581291518633-83b4ebd1d83e'],
    // analog (new from prev session)
    'med-charcoal': ['photo-1579783902614-a3fb3927b6a5', 'photo-1605721911519-3dfeb3be25e7', 'photo-1541701494587-cb58502866ab'],
    'med-soft-pastel': ['photo-1557672172-298e090bd0f1', 'photo-1541701494587-cb58502866ab', 'photo-1579783902614-a3fb3927b6a5'],
    'med-lino-print': ['photo-1513364776144-60967b0f800f', 'photo-1605721911519-3dfeb3be25e7', 'photo-1579783902614-a3fb3927b6a5'],
    'med-collage': ['photo-1558591710-4b4a1ae0f04d', 'photo-1541701494587-cb58502866ab', 'photo-1513364776144-60967b0f800f'],
    'med-monotype': ['photo-1579783902614-a3fb3927b6a5', 'photo-1605721911519-3dfeb3be25e7', 'photo-1557672172-298e090bd0f1'],
    'med-tempera': ['photo-1541701494587-cb58502866ab', 'photo-1579783902614-a3fb3927b6a5', 'photo-1605721911519-3dfeb3be25e7'],
    'med-encaustic': ['photo-1557672172-298e090bd0f1', 'photo-1579783902614-a3fb3927b6a5', 'photo-1541701494587-cb58502866ab'],
    'med-marbling': ['photo-1557672172-298e090bd0f1', 'photo-1558591710-4b4a1ae0f04d', 'photo-1541701494587-cb58502866ab'],
    // graphic (new from prev session)
    'med-duotone': ['photo-1557672172-298e090bd0f1', 'photo-1541701494587-cb58502866ab', 'photo-1526374965328-7f61d4dc18c5'],
    'med-swiss-typography': ['photo-1558591710-4b4a1ae0f04d', 'photo-1581291518633-83b4ebd1d83e', 'photo-1557672172-298e090bd0f1'],
    'med-retro-poster': ['photo-1513364776144-60967b0f800f', 'photo-1558591710-4b4a1ae0f04d', 'photo-1579783902614-a3fb3927b6a5'],
    'med-brutalism-web': ['photo-1558591710-4b4a1ae0f04d', 'photo-1526374965328-7f61d4dc18c5', 'photo-1618005182384-a83a8bd57fbe'],
    'med-neon-sign': ['photo-1518770660439-4636190af475', 'photo-1526374965328-7f61d4dc18c5', 'photo-1557672172-298e090bd0f1'],
    'med-abstract-geo': ['photo-1557672172-298e090bd0f1', 'photo-1618005182384-a83a8bd57fbe', 'photo-1541701494587-cb58502866ab'],
    'med-art-deco': ['photo-1513364776144-60967b0f800f', 'photo-1557672172-298e090bd0f1', 'photo-1558591710-4b4a1ae0f04d'],
    'med-zine': ['photo-1558591710-4b4a1ae0f04d', 'photo-1513364776144-60967b0f800f', 'photo-1541701494587-cb58502866ab'],
    // anime (new from prev session)
    'med-shonen': ['photo-1605721911519-3dfeb3be25e7', 'photo-1614680376408-81e91ffe3db7', 'photo-1618005182384-a83a8bd57fbe'],
    'med-chibi': ['photo-1535713875002-d1d0cf377fde', 'photo-1605721911519-3dfeb3be25e7', 'photo-1614680376408-81e91ffe3db7'],
    'med-webtoon': ['photo-1541701494587-cb58502866ab', 'photo-1605721911519-3dfeb3be25e7', 'photo-1614680376408-81e91ffe3db7'],
    'med-anime-bg': ['photo-1464822759023-fed622ff2c3b', 'photo-1462275646964-a0e3386b89fa', 'photo-1441974231531-c6227db76b6e'],
    'med-vintage-anime': ['photo-1513364776144-60967b0f800f', 'photo-1605721911519-3dfeb3be25e7', 'photo-1541701494587-cb58502866ab'],
    'med-manhwa-line': ['photo-1605721911519-3dfeb3be25e7', 'photo-1541701494587-cb58502866ab', 'photo-1614680376408-81e91ffe3db7'],
    'med-cel-shade-3d': ['photo-1618005182384-a83a8bd57fbe', 'photo-1634017839464-5c339ebe3cb4', 'photo-1605721911519-3dfeb3be25e7'],
    'med-art-nouveau-illust': ['photo-1557672172-298e090bd0f1', 'photo-1579783902614-a3fb3927b6a5', 'photo-1513364776144-60967b0f800f'],
    // photo (new from prev session)
    'med-film-grain': ['photo-1496442226666-8d4d0e62e6e9', 'photo-1477959858617-67f85cf4f1df', 'photo-1513364776144-60967b0f800f'],
    'med-tilt-shift': ['photo-1581291518633-83b4ebd1d83e', 'photo-1444723121867-7a241cacace9', 'photo-1473448912268-2022ce9509d8'],
    'med-high-key': ['photo-1500648767791-00dcc994a43e', 'photo-1531746020798-e6953c6e8e04', 'photo-1509631179647-0177331693ae'],
    'med-hdr-landscape': ['photo-1464822759023-fed622ff2c3b', 'photo-1507525428034-b723cf961d3e', 'photo-1501854140801-50d01698950b'],
    'med-night-portrait': ['photo-1531746020798-e6953c6e8e04', 'photo-1518770660439-4636190af475', 'photo-1496442226666-8d4d0e62e6e9'],
    'med-editorial-color': ['photo-1509631179647-0177331693ae', 'photo-1558618666-fcd25c85cd64', 'photo-1531746020798-e6953c6e8e04'],
    'med-infrared': ['photo-1448375240586-882707db888b', 'photo-1441974231531-c6227db76b6e', 'photo-1464822759023-fed622ff2c3b'],
    'med-double-exposure': ['photo-1557672172-298e090bd0f1', 'photo-1541701494587-cb58502866ab', 'photo-1500648767791-00dcc994a43e'],
    // craft (new from prev session)
    'med-pottery-craft': ['photo-1596461404969-9ae70f2830c1', 'photo-1605496036006-fa36378ca4ab', 'photo-1558591710-4b4a1ae0f04d'],
    'med-macrame': ['photo-1441974231531-c6227db76b6e', 'photo-1558591710-4b4a1ae0f04d', 'photo-1447752875215-b2761acb3c5d'],
    'med-wood-carving': ['photo-1605721911519-3dfeb3be25e7', 'photo-1579783902614-a3fb3927b6a5', 'photo-1558591710-4b4a1ae0f04d'],
    'med-embroidery': ['photo-1558591710-4b4a1ae0f04d', 'photo-1596461404969-9ae70f2830c1', 'photo-1447752875215-b2761acb3c5d'],
    'med-glass-blowing': ['photo-1518770660439-4636190af475', 'photo-1557672172-298e090bd0f1', 'photo-1558591710-4b4a1ae0f04d'],
    'med-jewelry-craft': ['photo-1523275335684-37898b6baf30', 'photo-1558591710-4b4a1ae0f04d', 'photo-1600585154340-be6161a56a0c'],
    'med-felt': ['photo-1558591710-4b4a1ae0f04d', 'photo-1447752875215-b2761acb3c5d', 'photo-1596461404969-9ae70f2830c1'],
    'med-papercraft': ['photo-1513364776144-60967b0f800f', 'photo-1558591710-4b4a1ae0f04d', 'photo-1579783902614-a3fb3927b6a5'],
    // official (new from prev session)
    'med-gov-diagram': ['photo-1581291518633-83b4ebd1d83e', 'photo-1460925895917-afdab827c52f', 'photo-1544383835-bda2bc66a55d'],
    'med-report-cover': ['photo-1460925895917-afdab827c52f', 'photo-1581291518633-83b4ebd1d83e', 'photo-1544383835-bda2bc66a55d'],
    'med-policy-deck': ['photo-1486406146926-c627a92ad1ab', 'photo-1460925895917-afdab827c52f', 'photo-1581291518633-83b4ebd1d83e'],
    'med-census-map': ['photo-1473448912268-2022ce9509d8', 'photo-1444723121867-7a241cacace9', 'photo-1501854140801-50d01698950b'],
    'med-budget-chart': ['photo-1590283603385-17ffb3a7f29f', 'photo-1551288049-bebda4e38f71', 'photo-1460925895917-afdab827c52f'],
    'med-eval-matrix': ['photo-1551288049-bebda4e38f71', 'photo-1460925895917-afdab827c52f', 'photo-1590283603385-17ffb3a7f29f'],
    'med-survey-viz': ['photo-1590283603385-17ffb3a7f29f', 'photo-1551288049-bebda4e38f71', 'photo-1460925895917-afdab827c52f'],
    'med-org-chart': ['photo-1581291518633-83b4ebd1d83e', 'photo-1544383835-bda2bc66a55d', 'photo-1460925895917-afdab827c52f'],
    // game (new from prev session)
    'med-mobile-game-ui': ['photo-1614680376408-81e91ffe3db7', 'photo-1551103782-8ab4ad07d4e6', 'photo-1593642632559-0c6d3fc62b89'],
    'med-concept-game': ['photo-1618005182384-a83a8bd57fbe', 'photo-1541701494587-cb58502866ab', 'photo-1605721911519-3dfeb3be25e7'],
    'med-moba-splash': ['photo-1605721911519-3dfeb3be25e7', 'photo-1618005182384-a83a8bd57fbe', 'photo-1614680376408-81e91ffe3db7'],
    'med-tactical-map': ['photo-1581291518633-83b4ebd1d83e', 'photo-1473448912268-2022ce9509d8', 'photo-1444723121867-7a241cacace9'],
    'med-boss-monster': ['photo-1618005182384-a83a8bd57fbe', 'photo-1605721911519-3dfeb3be25e7', 'photo-1534796636912-3b95b3ab5986'],
    'med-side-scroll-bg': ['photo-1464822759023-fed622ff2c3b', 'photo-1462275646964-a0e3386b89fa', 'photo-1441974231531-c6227db76b6e'],
    'med-3d-game-scene': ['photo-1618005182384-a83a8bd57fbe', 'photo-1634017839464-5c339ebe3cb4', 'photo-1600585154340-be6161a56a0c'],
    'med-character-sheet': ['photo-1605721911519-3dfeb3be25e7', 'photo-1541701494587-cb58502866ab', 'photo-1614680376408-81e91ffe3db7'],
    // trad (new from prev session)
    'med-serigraphy': ['photo-1557672172-298e090bd0f1', 'photo-1513364776144-60967b0f800f', 'photo-1558591710-4b4a1ae0f04d'],
    'med-woodblock': ['photo-1579783902614-a3fb3927b6a5', 'photo-1605721911519-3dfeb3be25e7', 'photo-1513364776144-60967b0f800f'],
    'med-risograph': ['photo-1557672172-298e090bd0f1', 'photo-1541701494587-cb58502866ab', 'photo-1513364776144-60967b0f800f'],
    'med-stencil-graffiti': ['photo-1496442226666-8d4d0e62e6e9', 'photo-1477959858617-67f85cf4f1df', 'photo-1557672172-298e090bd0f1'],
    'med-mosaic-art': ['photo-1513364776144-60967b0f800f', 'photo-1558591710-4b4a1ae0f04d', 'photo-1557672172-298e090bd0f1'],
    'med-letterpress': ['photo-1558591710-4b4a1ae0f04d', 'photo-1513364776144-60967b0f800f', 'photo-1579783902614-a3fb3927b6a5'],
    'med-folk-art': ['photo-1447752875215-b2761acb3c5d', 'photo-1557672172-298e090bd0f1', 'photo-1513364776144-60967b0f800f'],
    'med-copperplate-illust': ['photo-1579783902614-a3fb3927b6a5', 'photo-1605721911519-3dfeb3be25e7', 'photo-1513364776144-60967b0f800f'],
    // youtube_anim samples
    'med-yt-whiteboard': ['photo-1580136579312-94651dfd596d', 'photo-1576016770956-debb63d90029', 'photo-1513364776144-60967b0f800f'],
    'med-yt-flat-vector': ['photo-1581291518633-83b4ebd1d83e', 'photo-1558591710-4b4a1ae0f04d', 'photo-1579783928621-7a13d66a62d1'],
    'med-yt-doodle': ['photo-1513364776144-60967b0f800f', 'photo-1560420015-90530c727183', 'photo-1580136579312-94651dfd596d'],
    'med-yt-historical-doc': ['photo-1579783900882-c0d3dad7b119', 'photo-1605721911519-3dfeb3be25e7', 'photo-1513364776144-60967b0f800f'],
    'med-yt-webtoon-comic': ['photo-1607604276583-eef5d076aa5f', 'photo-1578632767115-351597cf2477', 'photo-1560169897-fc0cdbdfa4d5'],
    'med-yt-news-info': ['photo-1551288049-bebda4e38f71', 'photo-1460925895917-afdab827c52f', 'photo-1590283603385-17ffb3a7f29f'],
    'med-yt-isometric': ['photo-1581291518633-83b4ebd1d83e', 'photo-1581291518857-4e27b48ff24e', 'photo-1508921912186-1d1a45ebb3c1'],
    'med-yt-collage': ['photo-1560420015-90530c727183', 'photo-1579783900882-c0d3dad7b119', 'photo-1513364776144-60967b0f800f'],
    'med-yt-line-pictogram': ['photo-1581291518633-83b4ebd1d83e', 'photo-1460925895917-afdab827c52f', 'photo-1558591710-4b4a1ae0f04d'],
    'med-yt-clay-soft': ['photo-1596461404969-9ae70f2830c1', 'photo-1605496036006-fa36378ca4ab', 'photo-1558591710-4b4a1ae0f04d'],
    'med-yt-vintage-textbook': ['photo-1579783902614-a3fb3927b6a5', 'photo-1605721911519-3dfeb3be25e7', 'photo-1580136579312-94651dfd596d'],
    'med-yt-diagram': ['photo-1551288049-bebda4e38f71', 'photo-1460925895917-afdab827c52f', 'photo-1581291518633-83b4ebd1d83e'],
    // cardnews
    'med-cardnews-bold-type': ['photo-1558591710-4b4a1ae0f04d', 'photo-1557672172-298e090bd0f1', 'photo-1541701494587-cb58502866ab'],
    'med-cardnews-vibrant-bg': ['photo-1541701494587-cb58502866ab', 'photo-1618005198143-e528346d9a9f', 'photo-1557672172-298e090bd0f1'],
    'med-cardnews-gradient': ['photo-1557672172-298e090bd0f1', 'photo-1541701494587-cb58502866ab', 'photo-1618005198143-e528346d9a9f'],
    'med-cardnews-text-overlay': ['photo-1460925895917-afdab827c52f', 'photo-1558591710-4b4a1ae0f04d', 'photo-1581291518633-83b4ebd1d83e'],
    'med-cardnews-geometric-type': ['photo-1558591710-4b4a1ae0f04d', 'photo-1581291518633-83b4ebd1d83e', 'photo-1557672172-298e090bd0f1'],
    'med-cardnews-type-illust': ['photo-1579783928621-7a13d66a62d1', 'photo-1558591710-4b4a1ae0f04d', 'photo-1557672172-298e090bd0f1'],
    'med-cardnews-minimal-text': ['photo-1581291518633-83b4ebd1d83e', 'photo-1558591710-4b4a1ae0f04d', 'photo-1460925895917-afdab827c52f'],
    'med-cardnews-handdrawn-type': ['photo-1576016770956-debb63d90029', 'photo-1513364776144-60967b0f800f', 'photo-1580136579312-94651dfd596d'],
    'med-cardnews-pop-art': ['photo-1560420015-90530c727183', 'photo-1541701494587-cb58502866ab', 'photo-1557672172-298e090bd0f1'],
    'med-cardnews-flat-char': ['photo-1579783928621-7a13d66a62d1', 'photo-1581291518633-83b4ebd1d83e', 'photo-1558591710-4b4a1ae0f04d'],
    'med-cardnews-muted-tone': ['photo-1557672172-298e090bd0f1', 'photo-1558591710-4b4a1ae0f04d', 'photo-1579783928621-7a13d66a62d1'],
    'med-cardnews-line-draw': ['photo-1580136579312-94651dfd596d', 'photo-1576016770956-debb63d90029', 'photo-1558591710-4b4a1ae0f04d'],
    'med-cardnews-watercolor': ['photo-1579783900882-c0d3dad7b119', 'photo-1579783928621-7a13d66a62d1', 'photo-1513364776144-60967b0f800f'],
    'med-cardnews-draw-type': ['photo-1576016770956-debb63d90029', 'photo-1580136579312-94651dfd596d', 'photo-1558591710-4b4a1ae0f04d'],
    'med-cardnews-simple-icon': ['photo-1581291518633-83b4ebd1d83e', 'photo-1558591710-4b4a1ae0f04d', 'photo-1460925895917-afdab827c52f'],
    'med-cardnews-soft-style': ['photo-1557672172-298e090bd0f1', 'photo-1579783928621-7a13d66a62d1', 'photo-1558591710-4b4a1ae0f04d'],
    'med-cardnews-insta-vibe': ['photo-1541701494587-cb58502866ab', 'photo-1618005198143-e528346d9a9f', 'photo-1557672172-298e090bd0f1'],
    'med-cardnews-trendy': ['photo-1618005198143-e528346d9a9f', 'photo-1541701494587-cb58502866ab', 'photo-1560420015-90530c727183'],
    'med-cardnews-bright-bg': ['photo-1541701494587-cb58502866ab', 'photo-1560420015-90530c727183', 'photo-1618005198143-e528346d9a9f'],
    'med-cardnews-dark-bg': ['photo-1526374965328-7f61d4dc18c5', 'photo-1506318137071-a8e063b4bec0', 'photo-1635070041078-e363dbe005cb'],
    'med-cardnews-texture-bg': ['photo-1557672172-298e090bd0f1', 'photo-1558591710-4b4a1ae0f04d', 'photo-1596461404969-9ae70f2830c1'],
    'med-cardnews-bokeh': ['photo-1518152006812-edab29b069ac', 'photo-1557672172-298e090bd0f1', 'photo-1508921912186-1d1a45ebb3c1'],
    'med-cardnews-color-block': ['photo-1558591710-4b4a1ae0f04d', 'photo-1541701494587-cb58502866ab', 'photo-1557672172-298e090bd0f1'],
    'med-cardnews-composite': ['photo-1534796636912-3b95b3ab5986', 'photo-1557672172-298e090bd0f1', 'photo-1541701494587-cb58502866ab'],
    'med-cardnews-attention': ['photo-1618005198143-e528346d9a9f', 'photo-1560420015-90530c727183', 'photo-1541701494587-cb58502866ab'],
    'med-cardnews-info-focus': ['photo-1551288049-bebda4e38f71', 'photo-1590283603385-17ffb3a7f29f', 'photo-1460925895917-afdab827c52f'],
    'med-cardnews-emotional': ['photo-1557672172-298e090bd0f1', 'photo-1541701494587-cb58502866ab', 'photo-1579783928621-7a13d66a62d1'],
    'med-cardnews-cta': ['photo-1558591710-4b4a1ae0f04d', 'photo-1618005198143-e528346d9a9f', 'photo-1541701494587-cb58502866ab'],
    'med-cardnews-story': ['photo-1557672172-298e090bd0f1', 'photo-1541701494587-cb58502866ab', 'photo-1618005198143-e528346d9a9f'],
    'med-cardnews-statistics': ['photo-1590283603385-17ffb3a7f29f', 'photo-1551288049-bebda4e38f71', 'photo-1460925895917-afdab827c52f'],
    'med-cardnews-gamified': ['photo-1614680376408-81e91ffe3db7', 'photo-1593642632559-0c6d3fc62b89', 'photo-1551103782-8ab4ad07d4e6'],
    'med-cardnews-interactive': ['photo-1555066931-4365d14bab8c', 'photo-1460925895917-afdab827c52f', 'photo-1551288049-bebda4e38f71'],
    // public institution
    'med-public-modern-line': ['photo-1581291518633-83b4ebd1d83e', 'photo-1558591710-4b4a1ae0f04d', 'photo-1460925895917-afdab827c52f'],
    'med-public-soft-color': ['photo-1557672172-298e090bd0f1', 'photo-1579783928621-7a13d66a62d1', 'photo-1558591710-4b4a1ae0f04d'],
    'med-public-icon-system': ['photo-1581291518633-83b4ebd1d83e', 'photo-1460925895917-afdab827c52f', 'photo-1544383835-bda2bc66a55d'],
    'med-public-flat-design': ['photo-1579783928621-7a13d66a62d1', 'photo-1581291518633-83b4ebd1d83e', 'photo-1558591710-4b4a1ae0f04d'],
    'med-public-geometric-modern': ['photo-1558591710-4b4a1ae0f04d', 'photo-1557672172-298e090bd0f1', 'photo-1581291518633-83b4ebd1d83e'],
    'med-public-pastel-simple': ['photo-1557672172-298e090bd0f1', 'photo-1558591710-4b4a1ae0f04d', 'photo-1579783928621-7a13d66a62d1'],
    'med-public-lineart-official': ['photo-1580136579312-94651dfd596d', 'photo-1581291518633-83b4ebd1d83e', 'photo-1576016770956-debb63d90029'],
    'med-public-minimal-brand': ['photo-1581291518633-83b4ebd1d83e', 'photo-1460925895917-afdab827c52f', 'photo-1558591710-4b4a1ae0f04d'],
    'med-public-service-campaign': ['photo-1486406146926-c627a92ad1ab', 'photo-1460925895917-afdab827c52f', 'photo-1492691527719-9d1e07e534b4'],
    // government official
    'med-government-official-seal': ['photo-1486406146926-c627a92ad1ab', 'photo-1492691527719-9d1e07e534b4', 'photo-1460925895917-afdab827c52f'],
    'med-institutional-report-style': ['photo-1460925895917-afdab827c52f', 'photo-1581291518633-83b4ebd1d83e', 'photo-1486406146926-c627a92ad1ab'],
    // infographic
    'med-infographic-timeline': ['photo-1581291518633-83b4ebd1d83e', 'photo-1551288049-bebda4e38f71', 'photo-1460925895917-afdab827c52f'],
    'med-infographic-flowchart': ['photo-1544383835-bda2bc66a55d', 'photo-1581291518633-83b4ebd1d83e', 'photo-1460925895917-afdab827c52f'],
    'med-infographic-circular-process': ['photo-1558591710-4b4a1ae0f04d', 'photo-1581291518633-83b4ebd1d83e', 'photo-1551288049-bebda4e38f71'],
    'med-infographic-data-visual': ['photo-1590283603385-17ffb3a7f29f', 'photo-1551288049-bebda4e38f71', 'photo-1460925895917-afdab827c52f'],
    'med-infographic-statistic-bar': ['photo-1551288049-bebda4e38f71', 'photo-1590283603385-17ffb3a7f29f', 'photo-1460925895917-afdab827c52f'],
    'med-infographic-icon-text': ['photo-1581291518633-83b4ebd1d83e', 'photo-1558591710-4b4a1ae0f04d', 'photo-1460925895917-afdab827c52f'],
    'med-infographic-map-location': ['photo-1473448912268-2022ce9509d8', 'photo-1444723121867-7a241cacace9', 'photo-1501854140801-50d01698950b'],
    'med-infographic-step-progress': ['photo-1581291518633-83b4ebd1d83e', 'photo-1544383835-bda2bc66a55d', 'photo-1551288049-bebda4e38f71'],
    // minimal design
    'med-minimal-bauhaus': ['photo-1558591710-4b4a1ae0f04d', 'photo-1581291518633-83b4ebd1d83e', 'photo-1557672172-298e090bd0f1'],
    'med-minimal-grid-system': ['photo-1581291518633-83b4ebd1d83e', 'photo-1558591710-4b4a1ae0f04d', 'photo-1460925895917-afdab827c52f'],
    'med-minimal-line-composition': ['photo-1580136579312-94651dfd596d', 'photo-1581291518633-83b4ebd1d83e', 'photo-1558591710-4b4a1ae0f04d'],
    'med-minimal-shape-abstract': ['photo-1557672172-298e090bd0f1', 'photo-1558591710-4b4a1ae0f04d', 'photo-1581291518633-83b4ebd1d83e'],
    'med-minimal-typography-focus': ['photo-1558591710-4b4a1ae0f04d', 'photo-1581291518633-83b4ebd1d83e', 'photo-1460925895917-afdab827c52f'],
    'med-minimal-circle-geometry': ['photo-1557672172-298e090bd0f1', 'photo-1581291518633-83b4ebd1d83e', 'photo-1558591710-4b4a1ae0f04d'],
    'med-minimal-dot-pattern': ['photo-1558591710-4b4a1ae0f04d', 'photo-1557672172-298e090bd0f1', 'photo-1579783928621-7a13d66a62d1'],
    'med-minimal-swiss-design': ['photo-1581291518633-83b4ebd1d83e', 'photo-1558591710-4b4a1ae0f04d', 'photo-1460925895917-afdab827c52f'],
    // corporate photography
    'med-corporate-portrait-studio': ['photo-1500648767791-00dcc994a43e', 'photo-1531746020798-e6953c6e8e04', 'photo-1544005313-94ddf0286df2'],
    'med-corporate-workspace-office': ['photo-1492691527719-9d1e07e534b4', 'photo-1486406146926-c627a92ad1ab', 'photo-1504711434969-e33886168f5c'],
    'med-corporate-boardroom-shot': ['photo-1492691527719-9d1e07e534b4', 'photo-1486406146926-c627a92ad1ab', 'photo-1504711434969-e33886168f5c'],
    'med-corporate-outdoor-business': ['photo-1507525428034-b723cf961d3e', 'photo-1492691527719-9d1e07e534b4', 'photo-1473448912268-2022ce9509d8'],
    'med-corporate-product-showcase': ['photo-1523275335684-37898b6baf30', 'photo-1600585154340-be6161a56a0c', 'photo-1558591710-4b4a1ae0f04d'],
    'med-corporate-detail-macro': ['photo-1518152006812-edab29b069ac', 'photo-1532187643603-ba119ca4109e', 'photo-1576086213369-97a306d36557'],
    // anime & animation (catch-all defaults)
    'med-anime-eyecatch': ['photo-1607604276583-eef5d076aa5f', 'photo-1578632767115-351597cf2477', 'photo-1560169897-fc0cdbdfa4d5'],
    'med-disney-classic': ['photo-1447752875215-b2761acb3c5d', 'photo-1507525428034-b723cf961d3e', 'photo-1441974231531-c6227db76b6e'],
    'med-disney-modern': ['photo-1618005182384-a83a8bd57fbe', 'photo-1634017839464-5c339ebe3cb4', 'photo-1607604276583-eef5d076aa5f'],
    'med-cartoon-network': ['photo-1607604276583-eef5d076aa5f', 'photo-1560420015-90530c727183', 'photo-1578632767115-351597cf2477'],
    'med-nickelodeon': ['photo-1560420015-90530c727183', 'photo-1607604276583-eef5d076aa5f', 'photo-1578632767115-351597cf2477'],
    'med-indie-animation': ['photo-1541701494587-cb58502866ab', 'photo-1607604276583-eef5d076aa5f', 'photo-1618005198143-e528346d9a9f'],
    'med-adult-animation': ['photo-1618005182384-a83a8bd57fbe', 'photo-1541701494587-cb58502866ab', 'photo-1607604276583-eef5d076aa5f'],
    'med-2000s-flash': ['photo-1607604276583-eef5d076aa5f', 'photo-1578632767115-351597cf2477', 'photo-1560420015-90530c727183'],
    'med-shoujo-sparkle': ['photo-1557672172-298e090bd0f1', 'photo-1607604276583-eef5d076aa5f', 'photo-1578632767115-351597cf2477'],
    'med-shonen': ['photo-1605721911519-3dfeb3be25e7', 'photo-1618005182384-a83a8bd57fbe', 'photo-1607604276583-eef5d076aa5f'],
    'med-seinen-dark': ['photo-1526374965328-7f61d4dc18c5', 'photo-1506318137071-a8e063b4bec0', 'photo-1635070041078-e363dbe005cb'],
    'med-mahou-shoujo': ['photo-1557672172-298e090bd0f1', 'photo-1541701494587-cb58502866ab', 'photo-1618005198143-e528346d9a9f'],
    'med-mecha-design': ['photo-1618005182384-a83a8bd57fbe', 'photo-1526374965328-7f61d4dc18c5', 'photo-1635070041078-e363dbe005cb'],
    'med-isekai-light-novel': ['photo-1447752875215-b2761acb3c5d', 'photo-1441974231531-c6227db76b6e', 'photo-1618005182384-a83a8bd57fbe'],
    'med-isekailight-novel': ['photo-1447752875215-b2761acb3c5d', 'photo-1441974231531-c6227db76b6e', 'photo-1618005182384-a83a8bd57fbe'],
    'med-jrpg-illust': ['photo-1618005182384-a83a8bd57fbe', 'photo-1447752875215-b2761acb3c5d', 'photo-1605721911519-3dfeb3be25e7'],
    'med-kyoani': ['photo-1447752875215-b2761acb3c5d', 'photo-1507525428034-b723cf961d3e', 'photo-1557672172-298e090bd0f1'],
    'med-ufotable-glow': ['photo-1618005182384-a83a8bd57fbe', 'photo-1635070041078-e363dbe005cb', 'photo-1526374965328-7f61d4dc18c5'],
    'med-trigger-bold': ['photo-1605721911519-3dfeb3be25e7', 'photo-1618005182384-a83a8bd57fbe', 'photo-1635070041078-e363dbe005cb'],
    'med-ukiyoe-manga': ['photo-1579783900882-c0d3dad7b119', 'photo-1513364776144-60967b0f800f', 'photo-1605721911519-3dfeb3be25e7'],
    'med-manhwa-classical': ['photo-1605721911519-3dfeb3be25e7', 'photo-1541701494587-cb58502866ab', 'photo-1579783902614-a3fb3927b6a5'],
    'med-horror-manga': ['photo-1526374965328-7f61d4dc18c5', 'photo-1635070041078-e363dbe005cb', 'photo-1506318137071-a8e063b4bec0'],
    'med-sports-manga': ['photo-1605721911519-3dfeb3be25e7', 'photo-1461896836934-ffe607ba8211', 'photo-1571902943202-507ec2618e8f'],
    'med-webtoon-romance': ['photo-1557672172-298e090bd0f1', 'photo-1607604276583-eef5d076aa5f', 'photo-1578632767115-351597cf2477'],
    'med-webtoon-dark-action': ['photo-1526374965328-7f61d4dc18c5', 'photo-1635070041078-e363dbe005cb', 'photo-1618005182384-a83a8bd57fbe'],
    'med-vtuber-l2d': ['photo-1618005182384-a83a8bd57fbe', 'photo-1557672172-298e090bd0f1', 'photo-1635070041078-e363dbe005cb'],
    'med-kemono-anthro': ['photo-1447752875215-b2761acb3c5d', 'photo-1607604276583-eef5d076aa5f', 'photo-1441974231531-c6227db76b6e'],
    'med-doujin-circle': ['photo-1605721911519-3dfeb3be25e7', 'photo-1607604276583-eef5d076aa5f', 'photo-1541701494587-cb58502866ab'],
    'med-tokusatsu-poster': ['photo-1618005182384-a83a8bd57fbe', 'photo-1605721911519-3dfeb3be25e7', 'photo-1635070041078-e363dbe005cb'],
    'med-art-nouveau-illust': ['photo-1557672172-298e090bd0f1', 'photo-1579783902614-a3fb3927b6a5', 'photo-1513364776144-60967b0f800f'],
    'med-moebius': ['photo-1618005182384-a83a8bd57fbe', 'photo-1605721911519-3dfeb3be25e7', 'photo-1526374965328-7f61d4dc18c5'],
    'med-french-bd': ['photo-1560420015-90530c727183', 'photo-1607604276583-eef5d076aa5f', 'photo-1578632767115-351597cf2477'],
    'med-pixel-rpg': ['photo-1550751827-4bd374c3f58b', 'photo-1607604276583-eef5d076aa5f', 'photo-1620121692029-d088224ddc74'],
    // 공공기관 화풍 확장 30종 샘플
    'med-pub-bold-outline': ['photo-1558591710-4b4a1ae0f04d', 'photo-1541701494587-cb58502866ab', 'photo-1557672172-298e090bd0f1'],
    'med-pub-rounded-char': ['photo-1532187643603-ba119ca4109e', 'photo-1557672172-298e090bd0f1', 'photo-1508921912186-1d1a45ebb3c1'],
    'med-pub-isometric-flat': ['photo-1581291518633-83b4ebd1d83e', 'photo-1581291518857-4e27b48ff24e', 'photo-1508921912186-1d1a45ebb3c1'],
    'med-pub-cutout-paper': ['photo-1541701494587-cb58502866ab', 'photo-1618005198143-e528346d9a9f', 'photo-1558591710-4b4a1ae0f04d'],
    'med-pub-dual-tone-line': ['photo-1460925895917-afdab827c52f', 'photo-1581291518633-83b4ebd1d83e', 'photo-1557672172-298e090bd0f1'],
    'med-pub-tech-node': ['photo-1518770660439-4636190af475', 'photo-1460925895917-afdab827c52f', 'photo-1551288049-bebda4e38f71'],
    'med-pub-silhouette-color': ['photo-1557672172-298e090bd0f1', 'photo-1618005198143-e528346d9a9f', 'photo-1541701494587-cb58502866ab'],
    'med-pub-sketch-color': ['photo-1513364776144-60967b0f800f', 'photo-1579783900882-c0d3dad7b119', 'photo-1508921912186-1d1a45ebb3c1'],
    'med-pub-3d-soft-render': ['photo-1596461404969-9ae70f2830c1', 'photo-1558591710-4b4a1ae0f04d', 'photo-1618005198143-e528346d9a9f'],
    'med-pub-vector-geo-char': ['photo-1508921912186-1d1a45ebb3c1', 'photo-1558591710-4b4a1ae0f04d', 'photo-1557672172-298e090bd0f1'],
    'med-pub-event-bold': ['photo-1558591710-4b4a1ae0f04d', 'photo-1541701494587-cb58502866ab', 'photo-1618005198143-e528346d9a9f'],
    'med-pub-brochure-cover': ['photo-1460925895917-afdab827c52f', 'photo-1486406146926-c627a92ad1ab', 'photo-1581291518633-83b4ebd1d83e'],
    'med-pub-grant-announce': ['photo-1460925895917-afdab827c52f', 'photo-1581291518633-83b4ebd1d83e', 'photo-1486406146926-c627a92ad1ab'],
    'med-pub-edu-bright': ['photo-1532187643603-ba119ca4109e', 'photo-1508921912186-1d1a45ebb3c1', 'photo-1557672172-298e090bd0f1'],
    'med-pub-conference-dark': ['photo-1486406146926-c627a92ad1ab', 'photo-1460925895917-afdab827c52f', 'photo-1581291518633-83b4ebd1d83e'],
    'med-pub-sns-square': ['photo-1558591710-4b4a1ae0f04d', 'photo-1541701494587-cb58502866ab', 'photo-1557672172-298e090bd0f1'],
    'med-pub-banner-wide': ['photo-1460925895917-afdab827c52f', 'photo-1486406146926-c627a92ad1ab', 'photo-1581291518633-83b4ebd1d83e'],
    'med-pub-newsletter': ['photo-1581291518633-83b4ebd1d83e', 'photo-1460925895917-afdab827c52f', 'photo-1486406146926-c627a92ad1ab'],
    'med-pub-certificate': ['photo-1486406146926-c627a92ad1ab', 'photo-1460925895917-afdab827c52f', 'photo-1581291518633-83b4ebd1d83e'],
    'med-pub-safety-notice': ['photo-1558591710-4b4a1ae0f04d', 'photo-1541701494587-cb58502866ab', 'photo-1460925895917-afdab827c52f'],
    'med-pub-gradient-wave': ['photo-1618005198143-e528346d9a9f', 'photo-1541701494587-cb58502866ab', 'photo-1557672172-298e090bd0f1'],
    'med-pub-hex-pattern': ['photo-1518770660439-4636190af475', 'photo-1551288049-bebda4e38f71', 'photo-1581291518633-83b4ebd1d83e'],
    'med-pub-diagonal-split': ['photo-1557672172-298e090bd0f1', 'photo-1558591710-4b4a1ae0f04d', 'photo-1618005198143-e528346d9a9f'],
    'med-pub-dot-grid-bg': ['photo-1581291518633-83b4ebd1d83e', 'photo-1460925895917-afdab827c52f', 'photo-1551288049-bebda4e38f71'],
    'med-pub-blob-pastel': ['photo-1557672172-298e090bd0f1', 'photo-1541701494587-cb58502866ab', 'photo-1618005198143-e528346d9a9f'],
    'med-pub-duotone': ['photo-1500648767791-00dcc994a43e', 'photo-1531746020798-e6953c6e8e04', 'photo-1544005313-94ddf0286df2'],
    'med-pub-photo-clean': ['photo-1500648767791-00dcc994a43e', 'photo-1531746020798-e6953c6e8e04', 'photo-1486406146926-c627a92ad1ab'],
    'med-pub-photo-warm': ['photo-1532187643603-ba119ca4109e', 'photo-1500648767791-00dcc994a43e', 'photo-1531746020798-e6953c6e8e04'],
    'med-pub-photo-cool': ['photo-1486406146926-c627a92ad1ab', 'photo-1518770660439-4636190af475', 'photo-1460925895917-afdab827c52f'],
    'med-pub-photo-bw-accent': ['photo-1500648767791-00dcc994a43e', 'photo-1544005313-94ddf0286df2', 'photo-1531746020798-e6953c6e8e04'],
    'med-pub-policy-cardnews': ['photo-1581291518633-83b4ebd1d83e', 'photo-1460925895917-afdab827c52f', 'photo-1551288049-bebda4e38f71'],
    'med-pub-grant-recruit-card': ['photo-1460925895917-afdab827c52f', 'photo-1486406146926-c627a92ad1ab', 'photo-1551288049-bebda4e38f71'],
    'med-pub-application-step-guide': ['photo-1581291518633-83b4ebd1d83e', 'photo-1544383835-bda2bc66a55d', 'photo-1460925895917-afdab827c52f'],
    'med-pub-benefit-comparison': ['photo-1590283603385-17ffb3a7f29f', 'photo-1551288049-bebda4e38f71', 'photo-1460925895917-afdab827c52f'],
    'med-pub-faq-notice-card': ['photo-1581291518633-83b4ebd1d83e', 'photo-1558591710-4b4a1ae0f04d', 'photo-1460925895917-afdab827c52f'],
    'med-pub-deadline-alert': ['photo-1558591710-4b4a1ae0f04d', 'photo-1541701494587-cb58502866ab', 'photo-1460925895917-afdab827c52f'],
    'med-pub-youth-business-support': ['photo-1532187643603-ba119ca4109e', 'photo-1497366754035-f200968a6e72', 'photo-1556761175-b413da4baf72'],
    'med-pub-local-program-poster': ['photo-1506784365847-bbad939e9335', 'photo-1532187643603-ba119ca4109e', 'photo-1558591710-4b4a1ae0f04d'],
    'med-pub-performance-report-card': ['photo-1590283603385-17ffb3a7f29f', 'photo-1551288049-bebda4e38f71', 'photo-1460925895917-afdab827c52f'],
    'med-pub-citizen-participation-card': ['photo-1521737604893-d14cc237f11d', 'photo-1556761175-b413da4baf72', 'photo-1581291518633-83b4ebd1d83e'],
    'med-pub-service-launch-guide': ['photo-1555066931-4365d14bab8c', 'photo-1581291518633-83b4ebd1d83e', 'photo-1460925895917-afdab827c52f'],
    'med-pub-checklist-carousel': ['photo-1581291518633-83b4ebd1d83e', 'photo-1460925895917-afdab827c52f', 'photo-1551288049-bebda4e38f71']
  };

  // 주제 카테고리별 Unsplash 기본 이미지 매핑
  const MIXER_SUBJECT_CATEGORY_FALLBACKS = {
    steel: 'photo-1518770660439-4636190af475',
    energy: 'photo-1509391366360-2e959784a276',
    software: 'photo-1555066931-4365d14bab8c',
    bio: 'photo-1530026405186-ed1ea400c3a4',
    finance: 'photo-1590283603385-17ffb3a7f29f',
    public: 'photo-1486406146926-c627a92ad1ab',
    brand: 'photo-1460925895917-afdab827c52f',
    space: 'photo-1451187580459-43490279c0fa',
    regional: 'photo-1518770660439-4636190af475',
    policy: 'photo-1486406146926-c627a92ad1ab',
    urban: 'photo-1486406146926-c627a92ad1ab',
    food: 'photo-1447752875215-b2761acb3c5d',
    culture: 'photo-1507525428034-b723cf961d3e',
    education: 'photo-1532187643603-ba119ca4109e',
    health: 'photo-1576086213369-97a306d36557',
    mobility: 'photo-1555066931-4365d14bab8c',
    ocean: 'photo-1507525428034-b723cf961d3e',
    materials: 'photo-1530026405186-ed1ea400c3a4',
    creative: 'photo-1460925895917-afdab827c52f',
    environment: 'photo-1509391366360-2e959784a276',
    tech_transfer: 'photo-1518770660439-4636190af475',
    talent_cultivation: 'photo-1532187643603-ba119ca4109e',
    networking: 'photo-1460925895917-afdab827c52f'
  };

  // 공공기관 필터 대상 ID 목록
  const PUBINST_MEDIUM_IDS = new Set([
    // 공공기관 공식 일러스트
    'med-public-modern-line', 'med-public-soft-color', 'med-public-icon-system',
    'med-public-flat-design', 'med-public-geometric-modern', 'med-public-pastel-simple',
    'med-public-lineart-official', 'med-public-minimal-brand',
    // 공공기관 공식 스타일
    'med-government-official-seal', 'med-public-service-campaign', 'med-institutional-report-style',
    'med-official-photo',
    // 인포그래픽 스타일 (재정의된 2종)
    'med-infographic-icon-text', 'med-infographic-data-visual',
    // 공공기관 화풍 확장 30종
    'med-pub-bold-outline', 'med-pub-rounded-char', 'med-pub-isometric-flat',
    'med-pub-cutout-paper', 'med-pub-dual-tone-line', 'med-pub-tech-node',
    'med-pub-silhouette-color', 'med-pub-sketch-color', 'med-pub-3d-soft-render',
    'med-pub-vector-geo-char', 'med-pub-event-bold', 'med-pub-brochure-cover',
    'med-pub-grant-announce', 'med-pub-edu-bright', 'med-pub-conference-dark',
    'med-pub-sns-square', 'med-pub-banner-wide', 'med-pub-newsletter',
    'med-pub-certificate', 'med-pub-safety-notice', 'med-pub-gradient-wave',
    'med-pub-hex-pattern', 'med-pub-diagonal-split', 'med-pub-dot-grid-bg',
    'med-pub-blob-pastel', 'med-pub-duotone', 'med-pub-photo-clean',
    'med-pub-photo-warm', 'med-pub-photo-cool', 'med-pub-photo-bw-accent',
    // 공공기관 실무 홍보물 특화
    'med-pub-policy-cardnews', 'med-pub-grant-recruit-card', 'med-pub-application-step-guide',
    'med-pub-benefit-comparison', 'med-pub-faq-notice-card', 'med-pub-deadline-alert',
    'med-pub-youth-business-support', 'med-pub-local-program-poster', 'med-pub-performance-report-card',
    'med-pub-citizen-participation-card', 'med-pub-service-launch-guide', 'med-pub-checklist-carousel',
    // 미니멀 & 클린
    'med-minimal-grid-system', 'med-minimal-swiss-design', 'med-minimal-line-composition',
    'med-minimal-typography-focus', 'med-minimal-dot-pattern', 'med-minimal-circle-geometry',
    // 카드뉴스 (안내형)
    'med-cardnews-minimal-text', 'med-cardnews-simple-icon', 'med-cardnews-info-focus',
    'med-cardnews-statistics', 'med-cardnews-geometric-type', 'med-cardnews-flat-char',
    'med-cardnews-muted-tone', 'med-cardnews-line-draw', 'med-cardnews-text-overlay',
    'med-cardnews-soft-style',
    // 아이소메트릭
    'med-iso',
    // 상업용 리얼+3D 하이브리드
    'med-real-cgi-keyvisual', 'med-photo-3d-icons', 'med-arch-photo-3d-overlay',
    'med-human-3d-data', 'med-real-hologram-hybrid', 'med-ar-interface-composite',
    // 기업·공간 사진
    'med-corporate-portrait-studio', 'med-corporate-workspace-office',
  ]);

  function getSubjectDefaultKeyword(subject) {
    if (!subject) return '';
    return subject.prompt || subject.id.replace('mix-', '').replace(/-/g, ' ');
  }

  // Unsplash API 키는 서버에서만 보관한다. 브라우저에는 연동 여부만 전달한다.
  const UNSPLASH_CACHE = {};

  // 서버 manifest 캐시 (GET /api/mixer-images 로 로드)
  // localStorage 보다 우선 적용 → 브라우저·기기 무관 공유
  let MIXER_SERVER_MANIFEST = {};

  function getUnsplashKey() {
    return window.PROMPTDECK_HAS_UNSPLASH_KEY ? 'server-managed' : '';
  }

  function setUnsplashKey() {
    throw new Error('Unsplash 키는 관리자 설정에서만 변경할 수 있습니다.');
  }

  function showUnsplashAttribution(photo) {
    let credit = document.getElementById('unsplashAttribution');
    if (!credit) {
      credit = document.createElement('div');
      credit.id = 'unsplashAttribution';
      credit.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:9999;padding:7px 10px;border-radius:7px;background:rgba(17,24,39,.9);color:#fff;font:12px/1.4 system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.22)';
      document.body.appendChild(credit);
    }
    credit.replaceChildren(document.createTextNode('Photo by '));
    const author = document.createElement('a');
    author.href = photo.photographerUrl;
    author.target = '_blank';
    author.rel = 'noopener noreferrer';
    author.style.color = '#fff';
    author.textContent = photo.photographer;
    credit.append(author, document.createTextNode(' on '));
    const provider = document.createElement('a');
    provider.href = photo.unsplashUrl;
    provider.target = '_blank';
    provider.rel = 'noopener noreferrer';
    provider.style.color = '#fff';
    provider.textContent = 'Unsplash';
    credit.appendChild(provider);
  }

  function normalizeMixerSampleUrl(value) {
    if (typeof value !== 'string' || !value) return null;
    if (/^data:image\/(?:png|jpeg|webp);base64,/i.test(value)) return value;
    if (/^assets\//.test(value) || /^\/assets\//.test(value)) return value;
    if (/^\/?outputs\/mixer_samples\//.test(value)) {
      return value.startsWith('/') ? value : `/${value}`;
    }
    try {
      const parsed = new URL(value, window.location.origin);
      if (parsed.origin !== window.location.origin) return null;
      if (!parsed.pathname.startsWith('/outputs/mixer_samples/')) return null;
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch (_) {
      return null;
    }
  }

  async function fetchUnsplashImage(medId, suffix, forceRefresh = false) {
    if (!getUnsplashKey()) return null;
    if (!forceRefresh && UNSPLASH_CACHE[medId]) return UNSPLASH_CACHE[medId];
    const query = resolveSearchKeyword(medId, suffix);
    const params = new URLSearchParams({ query, medId, idx: '0' });
    const url = `/api/unsplash/search?${params.toString()}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    let res;
    try {
      res = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) throw new Error(`Unsplash ${res.status}`);
    const data = await res.json();
    if (!data.ok || !data.url) throw new Error(data.error || 'no results');
    const imgUrl = normalizeMixerSampleUrl(data.url);
    if (!imgUrl || data.storage !== 'local') throw new Error('Unsplash 이미지가 로컬에 저장되지 않았습니다.');
    showUnsplashAttribution(data);
    UNSPLASH_CACHE[medId] = imgUrl;
    setCustomSample(medId, 0, imgUrl);
    return imgUrl;
  }

  // 커스텀 이미지 — 서버 manifest 우선, localStorage 폴백
  const MIXER_CUSTOM_KEY = 'mixer_custom_samples_v1';
  function _getCustomAll() {
    try {
      const all = JSON.parse(localStorage.getItem(MIXER_CUSTOM_KEY) || '{}');
      let changed = false;
      for (const [medId, samples] of Object.entries(all)) {
        if (!Array.isArray(samples)) {
          delete all[medId];
          changed = true;
          continue;
        }
        all[medId] = samples.map((sample) => {
          const normalized = normalizeMixerSampleUrl(sample);
          if (normalized !== sample) changed = true;
          return normalized;
        });
        if (all[medId].every((sample) => !sample)) {
          delete all[medId];
          changed = true;
        }
      }
      if (changed) localStorage.setItem(MIXER_CUSTOM_KEY, JSON.stringify(all));
      return all;
    } catch {
      return {};
    }
  }

  async function loadMixerManifest() {
    try {
      const isStaticMode = !!window.PROMPTDECK_STATIC_MODE;
      const res = await fetch(isStaticMode ? '/outputs/mixer_samples/manifest.json' : '/api/mixer-images');
      if (!res.ok) return;
      const data = await res.json();
      const images = isStaticMode ? data : (data.ok ? data.images : null);
      if (images && typeof images === 'object') {
        MIXER_SERVER_MANIFEST = Object.fromEntries(
          Object.entries(images)
            .map(([medId, samples]) => [
              medId,
              Array.isArray(samples) ? samples.map(normalizeMixerSampleUrl) : []
            ])
            .filter(([, samples]) => samples.some(Boolean))
        );
      }
    } catch (_) { /* 정적 서빙 환경 또는 오프라인 — localStorage 폴백 사용 */ }
  }

  function getCustomSamplesForMed(medId) {
    // 정적 배포에서는 사용자가 만든 참조 이미지가 배포 기본 샘플보다 우선한다.
    if (window.PROMPTDECK_STATIC_MODE) {
      const local = _getCustomAll()[medId];
      if (Array.isArray(local) && local.some(Boolean)) return local.slice(0, 3);
    }
    // 서버 manifest 우선
    const srv = MIXER_SERVER_MANIFEST[medId];
    if (Array.isArray(srv) && srv.some(Boolean)) return srv.slice(0, 3);
    // localStorage 폴백
    return (_getCustomAll()[medId] || [null, null, null]).slice(0, 3);
  }

  function setCustomSample(medId, idx, url) {
    const normalizedUrl = normalizeMixerSampleUrl(url);
    if (!normalizedUrl) return false;
    // localStorage 빠른 캐시
    const all = _getCustomAll();
    if (!all[medId]) all[medId] = [null, null, null];
    all[medId][idx] = normalizedUrl;
    localStorage.setItem(MIXER_CUSTOM_KEY, JSON.stringify(all));
    // 인메모리 manifest 동기 반영
    if (!Array.isArray(MIXER_SERVER_MANIFEST[medId])) MIXER_SERVER_MANIFEST[medId] = [null, null, null];
    while (MIXER_SERVER_MANIFEST[medId].length <= idx) MIXER_SERVER_MANIFEST[medId].push(null);
    MIXER_SERVER_MANIFEST[medId][idx] = normalizedUrl;
    return true;
  }

  function clearCustomSample(medId, idx) {
    // localStorage
    const all = _getCustomAll();
    if (all[medId]) {
      all[medId][idx] = null;
      if (all[medId].every(v => !v)) delete all[medId];
      localStorage.setItem(MIXER_CUSTOM_KEY, JSON.stringify(all));
    }
    // 인메모리 manifest
    if (Array.isArray(MIXER_SERVER_MANIFEST[medId])) {
      MIXER_SERVER_MANIFEST[medId][idx] = null;
      if (MIXER_SERVER_MANIFEST[medId].every(v => !v)) delete MIXER_SERVER_MANIFEST[medId];
    }
    // 서버 manifest 비동기 삭제
    fetch('/api/reset-mixer-sample', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medId, idx })
    }).catch(() => {});
  }

  // 클립보드에서 이미지를 읽어 dataURL로 반환한다. 이미지가 없으면 예외를 던진다.
  async function readClipboardImageDataUrl() {
    if (!navigator.clipboard || !navigator.clipboard.read) {
      throw new Error('이 브라우저에서는 클립보드 이미지 붙여넣기를 지원하지 않습니다.');
    }
    let items;
    try {
      items = await navigator.clipboard.read();
    } catch (err) {
      throw new Error('클립보드 접근이 거부되었습니다. 권한을 허용해 주세요.');
    }
    for (const item of items) {
      const type = item.types.find(t => t.startsWith('image/'));
      if (type) {
        const blob = await item.getType(type);
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'));
          reader.readAsDataURL(blob);
        });
      }
    }
    throw new Error('클립보드에 이미지가 없습니다. 이미지를 먼저 복사해 주세요.');
  }

  // dataURL 샘플을 서버에 저장하고, 실패 시 로컬에 보관한다. 최종 저장 위치 유형을 반환한다.
  async function uploadMixerSample(medId, dataUrl) {
    try {
      const response = await fetch('/api/save-mixer-sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medId, idx: 0, image: dataUrl })
      });
      const result = await response.json();
      if (result.ok && result.url) {
        setCustomSample(medId, 0, result.url);
        return 'server';
      }
      throw new Error(result.error || '업로드 실패');
    } catch (err) {
      console.error(err);
      setCustomSample(medId, 0, dataUrl);
      return 'local';
    }
  }

  // 화풍 샘플 검색 키워드 커스텀 localStorage 헬퍼
  const MIXER_KW_KEY = 'mixer_search_keywords_v1';
  function getCustomKeyword(medId) {
    try { return JSON.parse(localStorage.getItem(MIXER_KW_KEY) || '{}')[medId] || null; } catch { return null; }
  }
  function setCustomKeyword(medId, kw) {
    try {
      const all = JSON.parse(localStorage.getItem(MIXER_KW_KEY) || '{}');
      all[medId] = kw.trim();
      localStorage.setItem(MIXER_KW_KEY, JSON.stringify(all));
    } catch {}
  }
  function clearCustomKeyword(medId) {
    try {
      const all = JSON.parse(localStorage.getItem(MIXER_KW_KEY) || '{}');
      delete all[medId];
      localStorage.setItem(MIXER_KW_KEY, JSON.stringify(all));
    } catch {}
  }
  function resolveSearchKeyword(medId, suffix) {
    return getCustomKeyword(medId) || suffix.split(',')[0].trim();
  }

  // 3. 색상 테마 (Palette) 데이터 및 카테고리 (4대 카테고리 × 8종 = 32종)

  Object.assign(window.CONCEPT_MIXER_PRESETS, {
    MEDIUM_CATEGORIES,
    MIXER_MEDIUMS,
    MIXER_MEDIUM_SAMPLES,
    PUBINST_MEDIUM_IDS,
    MIXER_SUBJECT_CATEGORY_FALLBACKS,
    UNSPLASH_CACHE,
    getSubjectDefaultKeyword,
    getUnsplashKey,
    setUnsplashKey,
    fetchUnsplashImage,
    loadMixerManifest,
    getCustomSamplesForMed,
    setCustomSample,
    clearCustomSample,
    readClipboardImageDataUrl,
    uploadMixerSample,
    getCustomKeyword,
    setCustomKeyword,
    clearCustomKeyword,
    resolveSearchKeyword,
  });
})();
