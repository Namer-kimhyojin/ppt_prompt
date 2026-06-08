// 컨셉 제안 탭 — 비주얼 스타일 프롬프트 갤러리
(function () {

  const CATEGORIES = [
    { id: 'all',          label: '전체' },
    { id: 'game',         label: '🎮 게임' },
    { id: '3d',           label: '🧊 3D' },
    { id: 'craft',        label: '🎨 수공예' },
    { id: 'illustration', label: '✏️ 일러스트' },
    { id: 'modern',       label: '◼ 모던' },
    { id: 'photo',        label: '📷 사진' },
    { id: 'fashion',      label: '👗 패션' },
    { id: 'arch',         label: '🏛 건축' },
    { id: 'sport',        label: '⚽ 스포츠' },
    { id: 'brand',        label: '🏷 브랜드' },
    { id: 'nature',       label: '🌿 자연' },
    { id: 'food',         label: '🍽 음식' },
    { id: 'culture',      label: '🏯 전통' },
    { id: 'science',      label: '🔬 과학' },
    { id: 'bio',          label: '🧬 바이오' },
    { id: 'energy',       label: '⚡ 에너지' },
    { id: 'software',     label: '💻 소프트웨어' },
    { id: 'heavy',        label: '🏭 산업' },
  ];

  const CAT_KO = {
    game:         '게임',
    '3d':         '3D',
    craft:        '수공예',
    illustration: '일러스트',
    modern:       '모던',
    photo:        '사진',
    fashion:      '패션',
    arch:         '건축',
    sport:        '스포츠',
    brand:        '브랜드',
    nature:       '자연',
    food:         '음식',
    culture:      '전통',
    science:      '과학',
    bio:          '바이오',
    energy:       '에너지',
    software:     '소프트웨어',
    heavy:        '산업',
  };

  const STYLES = [

    // ── 게임/판타지 ──────────────────────────────────────────
    { id: 'pixel-art', category: 'game', nameKo: '픽셀 아트', nameEn: 'Pixel Art', emoji: '👾',
      desc: '16비트 레트로 게임 감성. 선명한 픽셀 경계와 제한된 팔레트로 구성된 아케이드 스타일.',
      palette: ['#0f0f23','#5a3e85','#c84b31','#f5a623','#44ccff'],
      prompt: `pixel art style, 16-bit retro game aesthetic, crisp pixel edges, no anti-aliasing, flat shading, arcade game sprite, color palette: #0f0f23 #5a3e85 #c84b31 #f5a623 #44ccff, dark navy background, purple-violet shapes, red-orange accents, amber highlights, cyan sky elements`,
      tags: ['레트로','게임','디지털'] },
    { id: 'rpg', category: 'game', nameKo: 'RPG 던전', nameEn: 'Dark Fantasy RPG', emoji: '⚔️',
      desc: '어둡고 극적인 판타지. 마법 룬과 던전 분위기. 볼류메트릭 포그.',
      palette: ['#1a1a2e','#16213e','#7c4dff','#e94560','#ffd700'],
      prompt: `dark fantasy RPG illustration, dramatic chiaroscuro lighting, glowing magical runes, stone dungeon atmosphere, volumetric fog, color palette: #1a1a2e #16213e #7c4dff #e94560 #ffd700, deep navy and indigo shadows, electric violet magic glow, crimson accents, gold highlights, epic cinematic composition`,
      tags: ['판타지','다크','마법'] },
    { id: 'fantasy', category: 'game', nameKo: '동화 판타지', nameEn: 'Whimsical Fantasy', emoji: '🧚',
      desc: '몽환적이고 귀여운 동화 일러스트. 파스텔 색감과 마법 반짝임.',
      palette: ['#f9d4ff','#b8d4ff','#ffe8b8','#c8ffb8','#ffd6f9'],
      prompt: `whimsical fairy tale illustration, magical sparkles and glowing stars, enchanted forest background, dreamy storybook style, color palette: #f9d4ff #b8d4ff #ffe8b8 #c8ffb8 #ffd6f9, soft lavender and sky-blue pastels, warm cream highlights, mint green foliage, luminous gentle atmosphere`,
      tags: ['동화','귀여움','파스텔'] },
    { id: 'chibi', category: 'game', nameKo: '치비/카와이', nameEn: 'Chibi Kawaii', emoji: '🌸',
      desc: '일본 애니메이션 치비 스타일. 크고 빛나는 눈, 동그란 귀여운 비율.',
      palette: ['#ff9de2','#ffb3c6','#ffd6ff','#caffbf','#fdffb6'],
      prompt: `chibi anime character illustration, kawaii cute style, oversized sparkly eyes, round chubby proportions, color palette: #ff9de2 #ffb3c6 #ffd6ff #caffbf #fdffb6, hot pink and blush rose tones, soft lavender, mint green and lemon accents, clean cell shading, joyful expression`,
      tags: ['애니메이션','귀여움','일본'] },

    // ── 3D·기술 ──────────────────────────────────────────────
    { id: 'isometric', category: '3d', nameKo: '아이소메트릭', nameEn: 'Isometric UI', emoji: '🏙️',
      desc: '클린한 3D 아이소메트릭. UI·인포그래픽·비즈니스 자료에 최적화된 스타일.',
      palette: ['#6c63ff','#3f3d56','#f2f2f2','#ff6584','#43d9ad'],
      prompt: `isometric 3D vector illustration, clean geometric style, precise 45-degree perspective, soft drop shadows, color palette: #6c63ff #3f3d56 #f2f2f2 #ff6584 #43d9ad, indigo-violet primary shapes, dark charcoal structure, light gray surfaces, coral pink highlights, teal accent details, professional business infographic`,
      tags: ['3D','UI','비즈니스'] },
    { id: 'lowpoly', category: '3d', nameKo: '로우 폴리', nameEn: 'Low-poly', emoji: '💎',
      desc: '삼각형 메시로 쪼개진 기하학적 3D 미학. 결정 구조 같은 앵귤러 페이스.',
      palette: ['#2193b0','#6dd5ed','#ee0979','#ff6a00','#44f7c2'],
      prompt: `low poly 3D art, geometric triangulated mesh surfaces, angular faceted planes, color palette: #2193b0 #6dd5ed #ee0979 #ff6a00 #44f7c2, deep cyan to sky-blue gradient faces, vivid magenta-to-orange accent polygons, turquoise highlights, crystalline structural forms`,
      tags: ['3D','기하학','미니멀'] },
    { id: 'clay', category: '3d', nameKo: '클레이 렌더', nameEn: 'Clay Render', emoji: '🧸',
      desc: '찰흙 특유의 따뜻한 매트 질감. 귀엽고 통통한 3D 형태.',
      palette: ['#ff9a9e','#fad0c4','#a18cd1','#fbc2eb','#ffecd2'],
      prompt: `clay render 3D illustration, plasticine matte texture, chunky rounded proportions, soft warm studio lighting, color palette: #ff9a9e #fad0c4 #a18cd1 #fbc2eb #ffecd2, salmon-pink and peach base tones, soft purple secondary shapes, blush pink highlights, cream white background, smooth ambient occlusion`,
      tags: ['3D','귀여움','따뜻함'] },
    { id: 'voxel', category: '3d', nameKo: '복셀 아트', nameEn: 'Voxel Art', emoji: '🟦',
      desc: '큐브 블록을 쌓은 마인크래프트 감성의 3D.',
      palette: ['#11998e','#38ef7d','#fc4a1a','#f7b733','#0099f7'],
      prompt: `voxel art 3D style, colorful cubic block construction, isometric pixel-block view, color palette: #11998e #38ef7d #fc4a1a #f7b733 #0099f7, teal and lime green foliage blocks, fiery orange-red structures, amber yellow details, electric blue sky blocks`,
      tags: ['3D','게임','블록'] },
    { id: 'cyberpunk', category: '3d', nameKo: '사이버펑크', nameEn: 'Neon Cyberpunk', emoji: '🌆',
      desc: '어두운 미래 도시와 강렬한 네온빛. 홀로그래픽 디스플레이와 디스토피아 감성.',
      palette: ['#0d0d0d','#ff00ff','#00ffff','#ff6600','#ff0055'],
      prompt: `cyberpunk neon city night scene, glowing neon signs, rain-slicked reflections, holographic HUD displays, color palette: #0d0d0d #ff00ff #00ffff #ff6600 #ff0055, near-black background, electric magenta and cyan neon lights, orange warnings, crimson alerts, 4K ultra-detailed`,
      tags: ['SF','네온','미래'] },

    // ── 수공예·아날로그 ─────────────────────────────────────
    { id: 'watercolor', category: 'craft', nameKo: '수채화', nameEn: 'Watercolor', emoji: '🎨',
      desc: '번지는 물감과 종이 질감. 손그림 특유의 따뜻하고 서정적인 감성.',
      palette: ['#a8e6cf','#dcedc1','#ffd3b6','#ffaaa5','#d4a5e5'],
      prompt: `watercolor painting illustration, soft wet-on-wet ink blooming, transparent layered washes, visible brushstrokes, paper grain texture, color palette: #a8e6cf #dcedc1 #ffd3b6 #ffaaa5 #d4a5e5, mint and sage green washes, warm peach and coral accents, soft pink and lilac bloom edges`,
      tags: ['수작업','따뜻함','아날로그'] },
    { id: 'pencil', category: 'craft', nameKo: '색연필', nameEn: 'Colored Pencil', emoji: '✏️',
      desc: '색연필 특유의 터치와 질감. 동화책 일러스트레이션 스타일.',
      palette: ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff922b'],
      prompt: `colored pencil illustration art, visible hand-drawn waxy strokes, cross-hatching texture, layered color blending, color palette: #ff6b6b #ffd93d #6bcb77 #4d96ff #ff922b, coral red, bright yellow, fresh green, sky blue details, warm orange accents, children's picture book aesthetic`,
      tags: ['수작업','동화','스케치'] },
    { id: 'oil', category: 'craft', nameKo: '유화', nameEn: 'Oil Painting', emoji: '🖼️',
      desc: '캔버스 위 두꺼운 임파스토 기법. 고전 회화의 깊이감.',
      palette: ['#2d4a22','#8b4513','#daa520','#1a1a5e','#8b0000'],
      prompt: `oil painting artwork, thick impasto brushstroke texture, rich layered color depth, dramatic chiaroscuro, canvas fabric texture, color palette: #2d4a22 #8b4513 #daa520 #1a1a5e #8b0000, deep forest green shadows, warm sienna-brown midtones, golden amber highlights, dark navy and deep crimson undertones`,
      tags: ['수작업','고전','깊이감'] },
    { id: 'origami', category: 'craft', nameKo: '종이접기', nameEn: 'Origami / Paper Art', emoji: '🦢',
      desc: '선명한 접기선이 있는 종이 조형. 기하학적이고 우아한 페이퍼 크래프트.',
      palette: ['#ff595e','#ffca3a','#6a4c93','#1982c4','#8ac926'],
      prompt: `origami paper folding art, precision geometric creases, dimensional paper sculpture, crisp fold lines, color palette: #ff595e #ffca3a #6a4c93 #1982c4 #8ac926, vivid red and amber sheets, deep purple and royal blue planes, lime green accent folds, minimalist white studio background`,
      tags: ['종이','기하학','미니멀'] },
    { id: 'quilt', category: 'craft', nameKo: '퀼트/뜨개', nameEn: 'Quilt & Knitting', emoji: '🧶',
      desc: '따뜻한 천 질감과 바느질 패턴. 아늑하고 손으로 만든 홈메이드 느낌.',
      palette: ['#e63946','#457b9d','#f1faee','#a8dadc','#ffd6a5'],
      prompt: `quilt patchwork textile art, stitched fabric texture, handmade craft aesthetic, color palette: #e63946 #457b9d #f1faee #a8dadc #ffd6a5, bold red and steel-blue fabric blocks, off-white background cloth, soft powder-blue patches, warm peach accent squares, embroidered stitch borders`,
      tags: ['수공예','따뜻함','패턴'] },
    { id: 'collage', category: 'craft', nameKo: '종이 콜라주', nameEn: 'Paper Collage', emoji: '✂️',
      desc: '오려 붙인 종이 레이어. 믹스 미디어의 생동감과 빈티지 질감.',
      palette: ['#264653','#2a9d8f','#e9c46a','#f4a261','#e76f51'],
      prompt: `paper collage mixed media art, layered cut paper shapes, torn paper edges, color palette: #264653 #2a9d8f #e9c46a #f4a261 #e76f51, deep teal and dark slate base, emerald-teal mid layers, golden yellow highlights, warm sandy orange patches, coral-red top accents`,
      tags: ['수작업','콜라주','레이어'] },

    // ── 일러스트·드로잉 ─────────────────────────────────────
    { id: 'doodle', category: 'illustration', nameKo: '두들', nameEn: 'Doodle', emoji: '🖊️',
      desc: '노트 여백에 쓱 그린 것 같은 자유로운 손그림. 즉흥적이고 발랄한 선.',
      palette: ['#000000','#ffffff','#ffd700','#ff6b6b','#87ceeb'],
      prompt: `doodle illustration style, hand-drawn black pen sketch on white, whimsical cartoon elements, playful spontaneous line work, color palette: #000000 #ffffff #ffd700 #ff6b6b #87ceeb, black ink outlines on white background, bright yellow fill accents, coral-red spot colors, sky blue detail highlights`,
      tags: ['손그림','귀여움','스케치'] },
    { id: 'comic', category: 'illustration', nameKo: '만화/코믹', nameEn: 'Comic Book', emoji: '💥',
      desc: '두꺼운 윤곽선과 망점 패턴. 빈티지 코믹북의 다이나믹한 에너지.',
      palette: ['#ffff00','#ff0000','#0000ff','#000000','#ffffff'],
      prompt: `comic book illustration style, bold thick black ink outlines, Ben-Day halftone dot pattern, dynamic action composition, color palette: #ffff00 #ff0000 #0000ff #000000 #ffffff, pure yellow fills, vivid red action elements, royal blue hero tones, solid black outlines, white highlights, vintage superhero aesthetic`,
      tags: ['만화','팝','다이나믹'] },
    { id: 'lineart', category: 'illustration', nameKo: '라인 아트', nameEn: 'Line Art', emoji: '〰️',
      desc: '균일한 선 굵기로만 표현한 클린한 윤곽 드로잉.',
      palette: ['#1a1a1a','#ffffff','#e8f4f8','#b8d4e8','#8ab8d0'],
      prompt: `clean line art illustration, precise single-weight contour lines, minimal flat color fill, no gradients no texture, color palette: #1a1a1a #ffffff #e8f4f8 #b8d4e8 #8ab8d0, near-black ink lines on white, pale ice-blue background wash, light powder-blue fills, medium slate-blue shadows`,
      tags: ['라인','미니멀','클린'] },
    { id: 'handlettering', category: 'illustration', nameKo: '손글씨/캘리', nameEn: 'Hand Lettering', emoji: '🖋️',
      desc: '붓펜 캘리그래피와 장식적 플로리시. 아티즌 크래프트 타이포그래피.',
      palette: ['#2c1810','#8b4513','#d4a017','#f5f5dc','#e8d5b7'],
      prompt: `hand lettering typography art, brush pen calligraphy script, flowing expressive letterforms, decorative swash flourishes, color palette: #2c1810 #8b4513 #d4a017 #f5f5dc #e8d5b7, deep espresso-brown ink strokes, warm saddle-brown midtones, golden amber highlight details, cream beige background paper`,
      tags: ['타이포','캘리그래피','빈티지'] },
    { id: 'artnouveau', category: 'illustration', nameKo: '아르누보', nameEn: 'Art Nouveau', emoji: '🌿',
      desc: '유려한 유기적 곡선과 자연 모티프. 세기말 포스터의 장식적 우아함.',
      palette: ['#2d6a4f','#74c69d','#d4a373','#ccd5ae','#b5838d'],
      prompt: `Art Nouveau illustration, flowing organic curvilinear lines, natural motifs flowers vines tendrils, ornate decorative borders, color palette: #2d6a4f #74c69d #d4a373 #ccd5ae #b5838d, deep hunter green structural lines, medium jade-green fills, warm sandy-tan skin tones, pale sage green backgrounds, dusty mauve-rose accents, Alphonse Mucha inspired`,
      tags: ['장식미술','우아함','자연'] },
    { id: 'minimalist', category: 'illustration', nameKo: '미니멀 라인', nameEn: 'Minimalist Line', emoji: '—',
      desc: '얇고 단순한 선만으로 모든 것을 표현. 여백이 만드는 공간감.',
      palette: ['#1a1a1a','#ffffff','#e0e0e0','#2196f3','#757575'],
      prompt: `minimalist single line art, ultra-thin elegant continuous stroke, generous negative white space, color palette: #1a1a1a #ffffff #e0e0e0 #2196f3 #757575, near-black primary line, white open background, light silver-gray subtle fills, vivid blue single accent detail, Japanese minimalism, zen-like clarity`,
      tags: ['미니멀','선','여백'] },

    // ── 모던·그래픽 ─────────────────────────────────────────
    { id: 'flat', category: 'modern', nameKo: '플랫 디자인', nameEn: 'Flat Design', emoji: '▲',
      desc: '그림자 없는 단색 벡터. 현대적 UI/UX 감성의 깔끔한 아이코닉 스타일.',
      palette: ['#3498db','#2ecc71','#e74c3c','#f39c12','#9b59b6'],
      prompt: `flat design vector illustration, bold solid fill colors, zero gradients zero shadows, clean geometric shapes, color palette: #3498db #2ecc71 #e74c3c #f39c12 #9b59b6, sky blue primary elements, emerald green secondary shapes, tomato red accents, amber yellow highlights, purple supporting elements`,
      tags: ['미니멀','벡터','UI'] },
    { id: 'bauhaus', category: 'modern', nameKo: '바우하우스', nameEn: 'Bauhaus', emoji: '⭕',
      desc: '원·삼각·사각의 순수 기하학적 형태. 기능미의 고전 모더니즘.',
      palette: ['#e63946','#ffb703','#023e8a','#ffffff','#000000'],
      prompt: `Bauhaus design style, pure geometric shapes circles triangles squares, functionalist modernist aesthetic, bold grid composition, color palette: #e63946 #ffb703 #023e8a #ffffff #000000, vivid crimson red primary shape, bright amber-yellow secondary form, deep navy blue background plane, clean white negative space, solid black structural lines`,
      tags: ['기하학','모더니즘','클래식'] },
    { id: 'constructivism', category: 'modern', nameKo: '구성주의', nameEn: 'Constructivism', emoji: '📐',
      desc: '대각선 구도와 강렬한 레드·블랙. 러시아 구성주의 프로파간다 포스터.',
      palette: ['#cc0000','#000000','#ffffff','#808080','#cc6600'],
      prompt: `Russian Constructivism poster design, bold diagonal dynamic composition, angular geometric shapes, color palette: #cc0000 #000000 #ffffff #808080 #cc6600, powerful red primary shapes, solid black structural geometry, white open backgrounds, medium gray planes, burnt orange accent elements, Rodchenko Lissitzky inspired`,
      tags: ['그래픽','구성주의','모더니즘'] },
    { id: 'popart', category: 'modern', nameKo: '팝 아트', nameEn: 'Pop Art', emoji: '🎭',
      desc: '워홀·리히텐슈타인 감성. 망점과 강렬한 색상, 대중문화의 아이코닉함.',
      palette: ['#ffff00','#ff69b4','#00bfff','#ff4500','#32cd32'],
      prompt: `Pop Art style illustration, bold bright saturated colors, Ben-Day halftone dot pattern, thick bold black outlines, screenprint flat color layers, color palette: #ffff00 #ff69b4 #00bfff #ff4500 #32cd32, electric yellow background, hot pink main subject, vivid sky-blue shadows, orange-red accents, lime green supports, Andy Warhol Roy Lichtenstein 1960s aesthetic`,
      tags: ['팝','1960s','대중문화'] },
    { id: 'duotone', category: 'modern', nameKo: '듀오톤', nameEn: 'Duotone', emoji: '🎨',
      desc: '두 가지 색만으로 만드는 강렬한 그래픽. 리소그래프·스크린프린트 감성.',
      palette: ['#f72585','#7209b7','#3a0ca3','#4361ee','#4cc9f0'],
      prompt: `duotone graphic design effect, two-tone color halftone treatment, high contrast bold silhouette, color palette: #f72585 #7209b7 #3a0ca3 #4361ee #4cc9f0, hot magenta pink highlights, deep violet-purple shadow zones, dark navy deep shadows, electric indigo midtones, bright cyan lightest tones, risograph print aesthetic`,
      tags: ['그래픽','대비','포스터'] },

    // ── 사진·분위기 ──────────────────────────────────────────
    { id: 'cinematic', category: 'photo', nameKo: '시네마틱', nameEn: 'Cinematic Film', emoji: '🎬',
      desc: '영화 스틸컷 같은 극적 연출. 필름 그레인과 영화적 색보정.',
      palette: ['#1a1a2e','#16213e','#e94560','#c9a84c','#8ecae6'],
      prompt: `cinematic film photography, dramatic movie still composition, film grain texture, anamorphic lens flares, color palette: #1a1a2e #16213e #e94560 #c9a84c #8ecae6, deep midnight-blue and dark navy shadows, vivid crimson-red focal point, warm golden-ochre highlights, soft powder-blue sky tones, shallow depth of field, widescreen 2.39:1`,
      tags: ['영화','필름','드라마틱'] },
    { id: 'bokeh', category: 'photo', nameKo: '보케 인물', nameEn: 'Bokeh Portrait', emoji: '✨',
      desc: '아웃포커싱의 부드러운 원형 빛. 골든 아워 인물 포트레이트.',
      palette: ['#f8edeb','#f9c74f','#90be6d','#43aa8b','#577590'],
      prompt: `shallow depth of field bokeh portrait photography, creamy circular light bokeh, golden hour warm lighting, DSLR 85mm prime lens, color palette: #f8edeb #f9c74f #90be6d #43aa8b #577590, warm cream-white skin highlights, golden amber sunlit bokeh, fresh green mid-ground blur, teal-green foliage wash, muted blue-slate deep background`,
      tags: ['인물','아웃포커스','따뜻함'] },
    { id: 'vintage', category: 'photo', nameKo: '빈티지 필름', nameEn: 'Vintage Film', emoji: '📷',
      desc: '색 바랜 아날로그 필름의 향수. 빛샘과 그레인이 만드는 1970년대 감성.',
      palette: ['#c5a880','#8b7355','#d4c5a9','#6b4f3a','#a39080'],
      prompt: `vintage analog film photography, faded retro color treatment, warm light leaks, heavy film grain noise, color palette: #c5a880 #8b7355 #d4c5a9 #6b4f3a #a39080, warm golden-tan highlights, medium khaki-brown midtones, pale warm parchment shadow fills, deep sepia-brown darkest areas, 1970s lomography aesthetic`,
      tags: ['레트로','아날로그','향수'] },
    { id: 'polaroid', category: 'photo', nameKo: '폴라로이드', nameEn: 'Polaroid', emoji: '🖼️',
      desc: '즉석 카메라 특유의 흰 테두리와 과노출. 스냅샷의 친밀하고 즉흥적인 느낌.',
      palette: ['#f5f0e8','#e8d8c0','#d4b896','#c0a070','#a08050'],
      prompt: `Polaroid instant film photograph, characteristic thick white border frame, slightly overexposed warm tones, soft vignette edge blur, color palette: #f5f0e8 #e8d8c0 #d4b896 #c0a070 #a08050, warm cream-ivory highlights, light warm-beige upper midtones, medium sandy-tan main tones, warm medium-brown shadows, imperfect analog chemistry colors`,
      tags: ['필름','향수','스냅샷'] },
    { id: 'product', category: 'photo', nameKo: '스튜디오 제품샷', nameEn: 'Studio Product', emoji: '💡',
      desc: '깨끗한 스튜디오 세팅의 광고 퀄리티 제품 이미지.',
      palette: ['#ffffff','#f5f5f5','#e0e0e0','#bdbdbd','#9e9e9e'],
      prompt: `professional product photography, pristine clean white studio background, soft box studio lighting, commercial advertising quality, ultra-sharp high detail render, color palette: #ffffff #f5f5f5 #e0e0e0 #bdbdbd #9e9e9e, pure white infinity background, near-white subtle shadow gradient, light silver-gray shadow edge, medium cool-gray ground reflection`,
      tags: ['제품','광고','프로'] },

    // ── 패션·뷰티 ────────────────────────────────────────────
    { id: 'fashion-haute-couture', category: 'fashion', nameKo: '하이패션 런웨이', nameEn: 'Haute Couture Runway', emoji: '👑',
      desc: '보그 매거진 스타일의 하이패션 에디토리얼. 전위적인 의상과 극적인 조명이 특징.',
      palette: ['#1a1a1a','#f0e6d3','#c9a84c','#8b0000','#f5f5f5'],
      prompt: `high fashion editorial runway photography, Vogue magazine aesthetic, avant-garde couture garment, dramatic side lighting on model, color palette: #1a1a1a #f0e6d3 #c9a84c #8b0000 #f5f5f5, near-black dramatic background, warm ivory skin tone highlight, antique gold fabric sheen, deep crimson accent details, pure white negative space, Alexander McQueen Balenciaga aesthetic, sharp shadow play`,
      tags: ['런웨이','에디토리얼','럭셔리'] },
    { id: 'fashion-y2k', category: 'fashion', nameKo: 'Y2K 패션', nameEn: 'Y2K Fashion', emoji: '💿',
      desc: '2000년대 초반 트렌드를 재현한 Y2K 패션. 홀로그램 소재, 메탈릭 컬러가 특징.',
      palette: ['#ff69b4','#00cfff','#c0c0c0','#bf00ff','#ffe400'],
      prompt: `Y2K fashion editorial photography, early 2000s millennial aesthetic, holographic and metallic fabrics, low-rise pants butterfly clips, color palette: #ff69b4 #00cfff #c0c0c0 #bf00ff #ffe400, hot pink as dominant millennial pink, electric cyan for tech-inspired accents, chrome silver for metallic sheen, neon purple for pop accents, bright yellow for retro highlights`,
      tags: ['Y2K','밀레니엄','홀로그램'] },
    { id: 'fashion-seoul-street', category: 'fashion', nameKo: '서울 스트리트 패션', nameEn: 'Seoul Street Fashion', emoji: '🛤️',
      desc: '홍대·이태원 감성의 서울 스트리트 패션 스냅. 개성 강한 믹스앤매치.',
      palette: ['#2d2d2d','#e8e8e8','#ff3b3b','#ffd700','#00d4aa'],
      prompt: `Seoul street fashion snap photography, Hongdae Itaewon urban backdrop, bold eclectic outfit mix-and-match, color palette: #2d2d2d #e8e8e8 #ff3b3b #ffd700 #00d4aa, dark charcoal for urban concrete background, light gray for neutral wardrobe basics, vivid red for statement piece accent, bright gold for streetwear logo detail, teal for fresh K-fashion pop color`,
      tags: ['서울','스트리트','K패션'] },
    { id: 'fashion-beauty-ad', category: 'fashion', nameKo: '뷰티 광고 클로즈업', nameEn: 'Beauty Ad Close-up', emoji: '💋',
      desc: '스킨케어 광고의 유리 피부 클로즈업. 촉촉한 텍스처와 완벽한 피부 표현.',
      palette: ['#fde8d8','#f4b8a0','#d4956a','#c47050','#f9f5f0'],
      prompt: `beauty skincare advertisement close-up photography, glass skin dewy texture, macro skin pore detail, water droplet on flawless skin, color palette: #fde8d8 #f4b8a0 #d4956a #c47050 #f9f5f0, pale blush peach as skin highlight tone, warm peachy mid-tone flesh, golden tan as natural shadow, deeper terracotta for contour definition, warm off-white for bright highlight spots`,
      tags: ['뷰티','스킨케어','클로즈업'] },
    { id: 'fashion-kbeauty-glow', category: 'fashion', nameKo: 'K-뷰티 글로우', nameEn: 'K-Beauty Glow', emoji: '✨',
      desc: '한국 뷰티 트렌드의 광채 피부와 홀로그래픽 메이크업. 반짝이는 글로우 이미지.',
      palette: ['#ffe4f0','#ffb6d9','#d4a0e0','#a0d4f0','#fff0a0'],
      prompt: `K-beauty glow makeup photography, holographic shimmer highlight on cheekbones, dewy glass skin effect, iridescent pearl makeup, color palette: #ffe4f0 #ffb6d9 #d4a0e0 #a0d4f0 #fff0a0, soft baby pink base skin tone, blush rose for flush cheeks, soft purple iridescent highlight, pale blue holographic accent, champagne gold for subtle glow shimmer`,
      tags: ['K뷰티','글로우','홀로그램'] },
    { id: 'fashion-gorpcore', category: 'fashion', nameKo: '고프코어 아웃도어', nameEn: 'Gorpcore Outdoor', emoji: '🏔️',
      desc: '기능성 트레일 패션의 실용적 아름다움. 아웃도어 브랜드 감성.',
      palette: ['#3d5a3e','#8b7355','#e8d5b0','#ff6b35','#2c3e50'],
      prompt: `gorpcore outdoor fashion photography, technical trail hiking gear worn as fashion, mountain terrain backdrop, color palette: #3d5a3e #8b7355 #e8d5b0 #ff6b35 #2c3e50, forest green as primary outdoor tone, warm khaki tan for canvas and cargo, light sand for weathered natural fabric, vivid trail orange for safety and pop accent, dark navy for technical layer foundation`,
      tags: ['아웃도어','고프코어','트레일'] },
    { id: 'fashion-monotone', category: 'fashion', nameKo: '모노톤 미니멀', nameEn: 'Monotone Minimal Fashion', emoji: '🖤',
      desc: '토탈 룩의 모노톤 미니멀 패션. 여백과 실루엣이 강조되는 클래식 스타일.',
      palette: ['#1a1a1a','#3d3d3d','#6b6b6b','#c0c0c0','#f5f5f5'],
      prompt: `monotone minimalist fashion photography, total look all-black or all-white outfit, clean architectural silhouette, color palette: #1a1a1a #3d3d3d #6b6b6b #c0c0c0 #f5f5f5, deep black for shadow and garment depth, dark charcoal for textured fabric mid-tones, medium gray for negative space fill, silver for subtle sheen details, near-white for clean studio background, Jil Sander COS aesthetic`,
      tags: ['모노톤','미니멀','실루엣'] },
    { id: 'fashion-maximalist', category: 'fashion', nameKo: '맥시멀리즘 컬러 팝', nameEn: 'Maximalist Color Pop', emoji: '🌈',
      desc: '과감한 패턴 믹싱과 원색 충돌. 즐거운 카오스가 넘치는 맥시멀 스타일.',
      palette: ['#ff1744','#ff9100','#ffea00','#00e676','#2979ff'],
      prompt: `maximalist fashion editorial, bold pattern clashing color blocking, over-the-top accessories layering, color palette: #ff1744 #ff9100 #ffea00 #00e676 #2979ff, electric red as dominant bold statement, vivid orange for warm pop energy, bright yellow for joyful clash contrast, neon green for unexpected fresh accent, electric blue for cool counterpoint, controlled chaos aesthetic, Comme des Garçons Versace energy`,
      tags: ['맥시멀','컬러팝','패턴'] },

    // ── 건축·공간 ────────────────────────────────────────────
    { id: 'arch-modernist', category: 'arch', nameKo: '모더니스트 건축', nameEn: 'Modernist Architecture', emoji: '🏢',
      desc: 'Le Corbusier, 미스 반 데어 로에 감성의 기능주의 모더니즘 건축.',
      palette: ['#f5f5f0','#d4cfc8','#8b8680','#3d3d3d','#c9a84c'],
      prompt: `modernist architecture photography, Le Corbusier Mies van der Rohe aesthetic, clean horizontal lines flat roof pilotis, color palette: #f5f5f0 #d4cfc8 #8b8680 #3d3d3d #c9a84c, warm off-white concrete facade, light warm gray for textured surface, medium warm gray for shadow and recessed planes, dark charcoal for structural steel elements, antique gold for signature brass detail`,
      tags: ['모더니즘','건축','기능주의'] },
    { id: 'arch-wabi-sabi', category: 'arch', nameKo: '와비사비 인테리어', nameEn: 'Wabi-Sabi Interior', emoji: '🍵',
      desc: '불완전함의 아름다움을 추구하는 일본 와비사비 인테리어.',
      palette: ['#e8e0d4','#c4b9a8','#8a7968','#5c4f3d','#d4c8b0'],
      prompt: `wabi-sabi Japanese interior photography, imperfect beauty aesthetic, aged textured surfaces patina, handmade ceramic wabi tea bowl, color palette: #e8e0d4 #c4b9a8 #8a7968 #5c4f3d #d4c8b0, warm pale sand for soft neutral background, warm greige for aged plaster walls, medium warm brown for weathered wood, deep earthy brown for iron and charred cedar, pale warm tan for linen and natural textiles`,
      tags: ['와비사비','일본','불완전미'] },
    { id: 'arch-scandinavian', category: 'arch', nameKo: '스칸디나비안 홈', nameEn: 'Scandinavian Home', emoji: '🏡',
      desc: '북유럽 히게(Hygge) 감성의 따뜻하고 밝은 미니멀 인테리어.',
      palette: ['#f8f5f0','#e0d5c5','#c8b89a','#8b6f4e','#3d5a4d'],
      prompt: `Scandinavian Nordic interior photography, hygge cozy aesthetic, bright minimal white walls with warm wood accents, color palette: #f8f5f0 #e0d5c5 #c8b89a #8b6f4e #3d5a4d, warm bright white for walls and light, warm light beige for linen and cushions, medium warm tan for oak and birch wood, rich warm brown for walnut furniture, deep sage green for plant and accent cushion`,
      tags: ['스칸디나비안','히게','북유럽'] },
    { id: 'arch-industrial', category: 'arch', nameKo: '인더스트리얼', nameEn: 'Industrial Warehouse', emoji: '🏭',
      desc: '노출 콘크리트와 벽돌의 창고 스타일 인테리어. 거친 질감과 메탈릭 감성.',
      palette: ['#2c2c2c','#8b7355','#c0a882','#6b6b6b','#d4683a'],
      prompt: `industrial warehouse interior photography, exposed concrete brick walls steel beams, Edison bulb pendant lighting, color palette: #2c2c2c #8b7355 #c0a882 #6b6b6b #d4683a, dark charcoal for raw concrete walls and shadow, warm tan-brown for aged brick facade, light sandy tan for worn wooden floor planks, medium gray for steel and ductwork, warm burnt orange for Edison bulb glow and rust accents`,
      tags: ['인더스트리얼','창고','콘크리트'] },
    { id: 'arch-baroque-palace', category: 'arch', nameKo: '바로크 궁전 건축', nameEn: 'Baroque Palace Architecture', emoji: '🏰',
      desc: '베르사유 궁전 같은 화려한 장식의 바로크 건축. 황금빛 호화로움.',
      palette: ['#c9a84c','#1a1a2e','#f5f0e0','#8b0000','#4a3000'],
      prompt: `Baroque palace architecture photography, Versailles gilded hall grandeur, ornate ceiling fresco and gold leaf molding, color palette: #c9a84c #1a1a2e #f5f0e0 #8b0000 #4a3000, antique gold as dominant gilded ornament color, deep navy for dramatic shadow and painting depth, warm ivory cream for carved marble and ceiling, deep crimson for velvet drapes and royal accent, very dark brown for aged bronze and patina`,
      tags: ['바로크','궁전','황금'] },
    { id: 'arch-futuristic', category: 'arch', nameKo: '미래형 건축', nameEn: 'Futuristic Architecture', emoji: '🔮',
      desc: '유리와 강철의 파라메트릭 디자인. SF적 미래 건축 구조.',
      palette: ['#0a0e1a','#00d4ff','#ffffff','#7b2fff','#00ff88'],
      prompt: `futuristic parametric architecture photography, glass and steel organic flowing structure, dramatic night illumination, color palette: #0a0e1a #00d4ff #ffffff #7b2fff #00ff88, deep near-black for dramatic night sky background, electric cyan for LED facade lighting and glass reflection, pure white for key highlights and interior glow, deep violet for secondary lighting accent, neon green for subtle bio-inspired pattern light`,
      tags: ['미래','파라메트릭','SF'] },
    { id: 'arch-bohemian', category: 'arch', nameKo: '보헤미안 인테리어', nameEn: 'Bohemian Interior', emoji: '🌺',
      desc: '글로벌 텍스타일과 빈티지 소품이 어우러진 에클레틱 보헤미안 인테리어.',
      palette: ['#8b4513','#d4956a','#e8c080','#6b4a8b','#3d7a5a'],
      prompt: `bohemian eclectic interior photography, global textiles macrame wall hanging rattan furniture, color palette: #8b4513 #d4956a #e8c080 #6b4a8b #3d7a5a, rich saddle brown for wicker and leather, warm copper-tan for terracotta and woven fabrics, golden amber for brass candleholders and warm light, deep purple for Moroccan cushion and throw, forest teal-green for succulent and hanging plant`,
      tags: ['보헤미안','에클레틱','빈티지'] },
    { id: 'arch-hanok', category: 'arch', nameKo: '전통 한옥', nameEn: 'Traditional Hanok', emoji: '🏯',
      desc: '한국 전통 건축 한옥의 우아한 처마선과 자연 소재의 조화.',
      palette: ['#5c3d2e','#c8a46e','#f0e6d0','#2d5a1e','#1a2e1a'],
      prompt: `Korean traditional Hanok architecture photography, elegant upswept eaves tiled roof, wooden beam structure with paper screen doors, inner courtyard garden, color palette: #5c3d2e #c8a46e #f0e6d0 #2d5a1e #1a2e1a, deep warm brown for aged timber pillars and beams, warm golden tan for clay roof tiles and ondol floor, pale warm cream for hanji paper screen and limestone, medium forest green for pine garden tree, very deep dark green for moss-covered stone wall`,
      tags: ['한옥','전통','한국건축'] },
    { id: 'arch-tropical-resort', category: 'arch', nameKo: '열대 리조트', nameEn: 'Tropical Resort', emoji: '🏖️',
      desc: '인피니티 풀과 야자수가 있는 럭셔리 열대 리조트 분위기.',
      palette: ['#0099cc','#00cc88','#f5e6c0','#ff8c42','#1a4d3a'],
      prompt: `luxury tropical resort photography, infinity pool overlooking ocean horizon, palm trees and exotic blooms, open-air bungalow architecture, color palette: #0099cc #00cc88 #f5e6c0 #ff8c42 #1a4d3a, vivid ocean blue for water and sky, tropical teal-green for infinity pool and jungle, warm pale sand for beach and terracotta tile, vivid orange for sunset glow and tropical flowers, deep forest green for dense palm canopy`,
      tags: ['리조트','열대','인피니티풀'] },
    { id: 'arch-brutalist', category: 'arch', nameKo: '브루탈리즘', nameEn: 'Brutalist Architecture', emoji: '🧱',
      desc: '날 것의 콘크리트 매스감이 주는 압도적인 조형미. 거칠고 강인한 건축.',
      palette: ['#5a5a5a','#8b8b8b','#c0c0c0','#3d2b1f','#e8e0d8'],
      prompt: `brutalist architecture photography, raw béton brut concrete monolithic mass, bold geometric repetition of windows, dramatic raking light creating deep shadow grooves, color palette: #5a5a5a #8b8b8b #c0c0c0 #3d2b1f #e8e0d8, deep mid-gray for shadowed concrete recesses, medium warm gray for primary concrete facade, light silver-gray for sunlit concrete surface, dark rich brown for rust stain and iron element, warm pale off-white for sky and reflected light`,
      tags: ['브루탈리즘','콘크리트','조형미'] },

    // ── 스포츠·에너지 ────────────────────────────────────────
    { id: 'sport-dynamic-action', category: 'sport', nameKo: '다이나믹 스포츠 액션', nameEn: 'Dynamic Sports Action', emoji: '⚡',
      desc: '모션 블러와 땀방울이 생동감 넘치는 순간을 포착. 선수의 역동적인 움직임.',
      palette: ['#FF2D00','#FF8C00','#1A1A2E','#F5F5F5','#00D4FF'],
      prompt: `dynamic sports action photography, athlete in motion with intense motion blur, sweat droplets frozen mid-air, explosive peak moment, color palette: #FF2D00 #FF8C00 #1A1A2E #F5F5F5 #00D4FF, fiery red and orange for energy and heat, deep navy background for contrast, white highlights for sweat and light, electric blue for speed lines and dynamic effects, high-speed photography aesthetic, dramatic side lighting`,
      tags: ['모션블러','역동성','액션'] },
    { id: 'sport-retro-poster', category: 'sport', nameKo: '레트로 스포츠 포스터', nameEn: 'Retro Sports Poster', emoji: '🏆',
      desc: '1980~90년대 스포츠 포스터의 향수를 자극하는 빈티지 그래픽 스타일.',
      palette: ['#E63946','#F4A261','#2D6A4F','#264653','#E9C46A'],
      prompt: `retro vintage sports poster design 1980s 1990s aesthetic, bold geometric shapes halftone patterns, athlete silhouette in heroic pose, distressed texture overlay, color palette: #E63946 #F4A261 #2D6A4F #264653 #E9C46A, vivid red for bold headlines, warm orange for athlete highlights, forest green for classic team colors, deep teal for background depth, golden yellow for championship stars`,
      tags: ['레트로','빈티지','80년대'] },
    { id: 'sport-extreme', category: 'sport', nameKo: '익스트림 스포츠', nameEn: 'Extreme Sports', emoji: '🛹',
      desc: '스케이트보드·BMX·서핑의 자유로운 에너지. 그래피티와 스트리트 아트 감성.',
      palette: ['#7B2D8B','#FF6B35','#1C1C1C','#39FF14','#87CEEB'],
      prompt: `extreme sports action shot, skateboarding BMX surfing parkour, urban street with graffiti backdrop, fearless athlete performing trick at golden hour, color palette: #7B2D8B #FF6B35 #1C1C1C #39FF14 #87CEEB, deep purple for rebellious underground energy, vivid orange for sunset and impact, near-black for raw urban grit, neon green for spray paint accents, sky blue for aerial freedom`,
      tags: ['스케이트보드','익스트림','스트리트'] },
    { id: 'sport-infographic', category: 'sport', nameKo: '스포츠 통계 인포그래픽', nameEn: 'Sports Stats Infographic', emoji: '📊',
      desc: '선수 성적과 경기 데이터를 시각적으로 매력있게 표현하는 방송 그래픽 스타일.',
      palette: ['#003087','#D00000','#F5F5F0','#FFD700','#2ECC71'],
      prompt: `sports statistics infographic design, athlete performance metrics data visualization, progress bars and radar charts, color palette: #003087 #D00000 #F5F5F0 #FFD700 #2ECC71, deep royal blue for primary data fields, crimson red for record-breaking highlights, off-white for clean readable background, gold for championship rankings, emerald green for positive growth metrics, broadcast graphics aesthetic, ESPN-style layout`,
      tags: ['인포그래픽','데이터','방송그래픽'] },
    { id: 'sport-olympic', category: 'sport', nameKo: '올림픽·경기장', nameEn: 'Olympic Stadium', emoji: '🏟️',
      desc: '거대한 경기장의 웅장함과 올림픽의 역사적 순간. 군중의 함성과 조명의 장엄함.',
      palette: ['#0057A8','#FFFFFF','#C8A84B','#2C2C2C','#DC143C'],
      prompt: `olympic stadium atmosphere grand ceremony, spectacular lighting massive crowd packed arena, athlete on podium triumphant moment, color palette: #0057A8 #FFFFFF #C8A84B #2C2C2C #DC143C, olympic blue for sky and official branding, pure white for ceremonial light beams, antique gold for medals and glory, charcoal for stadium structure, crimson for national flags, god rays through roof, confetti in air, epic cinematic scope`,
      tags: ['올림픽','경기장','웅장함'] },
    { id: 'sport-esports', category: 'sport', nameKo: 'eSports 토너먼트', nameEn: 'eSports Tournament', emoji: '🎮',
      desc: 'eSports 대회의 첨단 기술 감성. 홀로그램과 네온빛 가득한 미래지향적 경기장.',
      palette: ['#00FFFF','#FF00FF','#0D0D0D','#7B2FBE','#FFFFFF'],
      prompt: `esports gaming tournament visual, professional player gaming setup with neon backlighting, holographic HUD elements floating in air, glitch art effects, color palette: #00FFFF #FF00FF #0D0D0D #7B2FBE #FFFFFF, cyan for neon lighting and tech highlights, magenta for explosive energy effects, near-black for immersive dark arena, deep purple for mystical premium gaming, white for screen glow, RGB lighting effects, cyberpunk aesthetic`,
      tags: ['eSports','게이밍','네온'] },
    { id: 'sport-marathon', category: 'sport', nameKo: '러닝·마라톤 에너지', nameEn: 'Marathon Energy', emoji: '🏃',
      desc: '마라톤 완주의 감동과 러닝의 자유로운 에너지. 새벽 도심을 달리는 러너.',
      palette: ['#FF4500','#FF8C00','#1E3A5F','#E8E8E8','#00CED1'],
      prompt: `marathon running energy poster, lone runner in city at dawn with dramatic long shadow, motion blur on legs showing speed, color palette: #FF4500 #FF8C00 #1E3A5F #1E3A5F #00CED1, intense orange-red for burning determination, warm orange for sunrise glow, midnight navy for early morning city, light gray for misty urban streets, turquoise for refreshing water spray, motivational poster aesthetic`,
      tags: ['마라톤','러닝','새벽'] },
    { id: 'sport-combat', category: 'sport', nameKo: '격투 스포츠 드라마', nameEn: 'Combat Sports Drama', emoji: '🥊',
      desc: '복싱·MMA의 치열한 드라마. 링 위의 스포트라이트와 선수의 결기.',
      palette: ['#1A0A00','#FF3C00','#D4AF37','#F0EEE4','#4A4A4A'],
      prompt: `combat sports dramatic portrait, boxer in ring with dramatic spotlight, intense eye contact, gloves raised, sweat and determination visible, color palette: #1A0A00 #FF3C00 #D4AF37 #F0EEE4 #4A4A4A, near-black for deep shadows and raw intensity, fiery red-orange for championship fire, antique gold for title belt gleam, bone white for face highlights, medium gray for ring canvas texture`,
      tags: ['복싱','MMA','격투기'] },
    { id: 'sport-winter', category: 'sport', nameKo: '윈터 스포츠', nameEn: 'Winter Sports Crystal', emoji: '⛷️',
      desc: '스키·스노보드의 차갑고 순수한 아름다움. 눈 결정과 얼음의 투명함.',
      palette: ['#E8F4FD','#4A90D9','#1B2A3B','#C7E8FF','#FF6B6B'],
      prompt: `winter sports action photography, skier snowboarder launching off powder snow cliff, ice crystals exploding in slow motion, alpine mountain backdrop, color palette: #E8F4FD #4A90D9 #1B2A3B #C7E8FF #FF6B6B, ice white for snow powder and frost, bright alpine blue for clear mountain sky, deep navy for shadow and dramatic contrast, pale sky blue for soft light diffusion, coral red for bright ski suit energy`,
      tags: ['스키','스노보드','알파인'] },
    { id: 'sport-team-uniform', category: 'sport', nameKo: '팀 유니폼·마스코트', nameEn: 'Team Uniform & Mascot', emoji: '🦅',
      desc: '팀의 정체성을 강렬하게 표현하는 유니폼과 마스코트 디자인.',
      palette: ['#8B0000','#FFD700','#1A1A1A','#C0C0C0','#FFFFFF'],
      prompt: `sports team branding design, fierce mascot character in dynamic pose, team uniform with bold number graphics, shield and crest emblem, color palette: #8B0000 #FFD700 #1A1A1A #C0C0C0 #FFFFFF, deep crimson for primary team identity, metallic gold for championship prestige, near-black for strong contrast, silver for metallic elements, white for clean contrast, bold illustrative mascot style`,
      tags: ['유니폼','마스코트','팀브랜딩'] },

    // ── 브랜드·마케팅 ────────────────────────────────────────
    { id: 'brand-luxury-mono', category: 'brand', nameKo: '럭셔리 모노크롬 골드', nameEn: 'Luxury Monochrome Gold', emoji: '👑',
      desc: '절제된 모노크롬 배경에 골드 포인트가 럭셔리한 품격을 발산.',
      palette: ['#0A0A0A','#C9A84C','#F5F0E8','#7D7D7D','#FFFFFF'],
      prompt: `luxury brand photography, premium product on marble surface with gold accents, minimalist extreme negative space, soft side lighting creating elegant shadows, color palette: #0A0A0A #C9A84C #F5F0E8 #7D7D7D #FFFFFF, deep black for sophisticated background, antique gold for premium product details, warm ivory for clean surface and packaging, medium gray for subtle texture transitions, pure white for key highlights`,
      tags: ['럭셔리','골드','모노크롬'] },
    { id: 'brand-startup-minimal', category: 'brand', nameKo: '스타트업 네오 미니멀', nameEn: 'Startup Neo Minimal', emoji: '🚀',
      desc: '현대적이고 깔끔한 스타트업 브랜드 스타일. 기술 혁신의 자신감.',
      palette: ['#6C63FF','#F5F5F5','#2D2D2D','#00D4AA','#FF6584'],
      prompt: `startup brand design, bold neo-minimalist layout with geometric shapes, clean sans-serif typography at large scale, product mockup on neutral background, color palette: #6C63FF #F5F5F5 #2D2D2D #00D4AA #FF6584, vibrant purple for primary brand color and innovation, near-white for clean open space, dark charcoal for strong text contrast, teal-green for success states, coral pink for call-to-action highlights`,
      tags: ['스타트업','미니멀','테크'] },
    { id: 'brand-retro-vintage-ad', category: 'brand', nameKo: '레트로 빈티지 광고', nameEn: 'Retro Vintage Ad', emoji: '📺',
      desc: '1950~60년대 황금기 광고의 따뜻하고 낙관적인 분위기.',
      palette: ['#D4380D','#FAD714','#1B5E20','#F5E6D3','#8B4513'],
      prompt: `1950s 1960s vintage advertisement illustration, hand-drawn retro style with halftone printing effect, smiling family in optimistic scene, bold display lettering with decorative borders, color palette: #D4380D #FAD714 #1B5E20 #F5E6D3 #8B4513, classic red for bold headlines, bright yellow for cheerful sunburst, hunter green for wholesome product values, cream for aged paper background, saddle brown for warm woodsy accents`,
      tags: ['레트로','빈티지','1950년대'] },
    { id: 'brand-social-story', category: 'brand', nameKo: '소셜 미디어 스토리', nameEn: 'Social Media Story', emoji: '📱',
      desc: '인스타그램·틱톡 스토리 최적화 세로형 디자인. 젊고 트렌디한 감성.',
      palette: ['#F77737','#E1306C','#833AB4','#405DE6','#FCAF45'],
      prompt: `social media story template design, vertical 9:16 format with bold gradient background, large expressive typography with sticker-style elements, color palette: #F77737 #E1306C #833AB4 #405DE6 #FCAF45, warm orange for energetic gradient base, hot pink for engagement and passion, deep purple for premium creative energy, vibrant blue for trust and cool aesthetic, golden amber for highlight accents, Instagram aesthetic`,
      tags: ['소셜미디어','인스타그램','스토리'] },
    { id: 'brand-premium-package', category: 'brand', nameKo: '프리미엄 패키지', nameEn: 'Premium Packaging', emoji: '📦',
      desc: '엠보싱·포일 스탬핑의 프리미엄 패키지. 언박싱 경험을 중시하는 스타일.',
      palette: ['#1C1C1C','#B8860B','#F8F4EF','#4A4A4A','#D4C5A9'],
      prompt: `premium product packaging design, luxury box with embossed logo and foil stamping details, artisanal tissue paper and ribbon, unboxing experience photography, color palette: #1C1C1C #B8860B #F8F4EF #4A4A4A #D4C5A9, near-black for elegant matte box exterior, dark goldenrod for metallic foil accents, warm off-white for tissue paper, dark gray for structural elements, warm sand for natural kraft materials`,
      tags: ['패키지','언박싱','프리미엄'] },
    { id: 'brand-eco-sustainable', category: 'brand', nameKo: '에코·지속가능성', nameEn: 'Eco Sustainable Brand', emoji: '🌿',
      desc: '환경을 생각하는 브랜드의 자연스럽고 진정성 있는 시각 언어.',
      palette: ['#2D6A4F','#95D5B2','#F5EBD9','#D4A373','#081C15'],
      prompt: `sustainable eco brand design, organic product on natural materials wood stone linen, botanical elements hand-drawn leaf illustrations, natural daylight, color palette: #2D6A4F #95D5B2 #F5EBD9 #D4A373 #081C15, forest green for primary environmental message, soft sage for gentle nature harmony, warm linen for organic paper and packaging, earthy tan for soil connection, deep moss for grounding`,
      tags: ['에코','지속가능','친환경'] },
    { id: 'brand-streetwear', category: 'brand', nameKo: '스트리트웨어 어반', nameEn: 'Streetwear Urban', emoji: '🧢',
      desc: '힙합 문화와 스트리트웨어 브랜드의 날 것 그대로의 에너지.',
      palette: ['#0D0D0D','#FFFFFF','#FF2E00','#FFD700','#9B59B6'],
      prompt: `streetwear brand visual, urban photography against concrete wall with graffiti, model in oversized hoodie and sneakers, street lighting at night with harsh shadows, color palette: #0D0D0D #FFFFFF #FF2E00 #FFD700 #9B59B6, pure black for raw urban grit, stark white for bold logo contrast, vivid red for limited edition heat, gold for chains and luxury accents, purple for exclusive artistic statement`,
      tags: ['스트리트웨어','힙합','어반'] },
    { id: 'brand-corporate-b2b', category: 'brand', nameKo: '코퍼레이트 B2B', nameEn: 'Corporate B2B', emoji: '💼',
      desc: '기업 간 거래에서 신뢰와 전문성을 전달하는 비즈니스 커뮤니케이션 스타일.',
      palette: ['#003366','#0066CC','#F7F9FC','#2C3E50','#27AE60'],
      prompt: `corporate B2B presentation design, professional business photography in modern office, executive team data visualization on large display, clean grid layout with charts and metrics, color palette: #003366 #0066CC #F7F9FC #2C3E50 #27AE60, deep navy for authority and corporate solidity, bright corporate blue for interactive highlights, near-white for clean slide backgrounds, dark slate for professional text, business green for growth metrics`,
      tags: ['B2B','기업','프레젠테이션'] },
    { id: 'brand-wellness-spa', category: 'brand', nameKo: '웰니스·스파', nameEn: 'Wellness Spa Minimal', emoji: '🧘',
      desc: '심신의 안정을 추구하는 웰니스 브랜드의 고요하고 순수한 감성.',
      palette: ['#F9F3EE','#C8B8A2','#7D9B76','#D4B896','#4A6741'],
      prompt: `wellness spa brand photography, serene minimalist product on natural stone surface, botanical herbs and essential oil bottles, soft diffused natural light through sheer curtains, color palette: #F9F3EE #C8B8A2 #7D9B76 #D4B896 #4A6741, warm cream for pure calm background, greige for subtle warmth, muted sage green for healing botanical connection, warm tan for natural wood and terracotta, deep herb green for grounding`,
      tags: ['웰니스','스파','힐링'] },
    { id: 'brand-tech-saas', category: 'brand', nameKo: '테크 SaaS 플랫폼', nameEn: 'Tech SaaS Platform', emoji: '💻',
      desc: '현대적 SaaS 제품의 시각적 아이덴티티. 대시보드와 UI가 제품 가치를 전달.',
      palette: ['#0F172A','#3B82F6','#F0F9FF','#10B981','#F59E0B'],
      prompt: `SaaS platform brand visual, clean dashboard UI floating on dark gradient background, product screenshot with real data visualization, color palette: #0F172A #3B82F6 #F0F9FF #10B981 #F59E0B, deep midnight navy for premium dark mode foundation, brilliant blue for primary brand and interactive CTA, ice blue for bright mode backgrounds, emerald for success states, amber for premium feature badges, glassmorphism elements`,
      tags: ['SaaS','테크','대시보드'] },

    // ── 계절·자연 ────────────────────────────────────────────
    { id: 'nature-spring-cherry', category: 'nature', nameKo: '봄 벚꽃', nameEn: 'Spring Cherry Blossom', emoji: '🌸',
      desc: '연한 핑크와 하얀 꽃잎이 바람에 흩날리는 봄의 정경.',
      palette: ['#F9D1DC','#FAEEF1','#B5D99C','#E8A4B8','#7EB87A'],
      prompt: `dreamy spring cherry blossom scene, soft pink petals floating through gentle breeze, pale blossoms in full bloom, fresh green young leaves emerging, color palette: #F9D1DC #FAEEF1 #B5D99C #E8A4B8 #7EB87A, soft blush pink as dominant bloom color, near-white background sky, fresh sage green for young foliage, dusty rose for petal shadows, muted green for branches, gentle romantic mood, shallow depth of field`,
      tags: ['봄','벚꽃','파스텔'] },
    { id: 'nature-summer-tropical', category: 'nature', nameKo: '한여름 트로피컬', nameEn: 'Midsummer Tropical', emoji: '🌴',
      desc: '강렬한 햇살 아래 펼쳐지는 열대의 색채. 채도 높은 여름 에너지.',
      palette: ['#0090C1','#F7C843','#FF5733','#2DBD61','#FF8C42'],
      prompt: `vibrant midsummer tropical paradise, lush palm trees exotic hibiscus flowers, intense turquoise ocean water, dramatic sunlight casting sharp shadows, color palette: #0090C1 #F7C843 #FF5733 #2DBD61 #FF8C42, saturated cobalt blue for tropical ocean, bright golden yellow for intense sunlight, vivid coral-red for exotic blooms, bold emerald green for tropical foliage, warm tangerine for sunset accents`,
      tags: ['여름','트로피컬','채도'] },
    { id: 'nature-autumn-foliage', category: 'nature', nameKo: '가을 단풍', nameEn: 'Autumn Foliage', emoji: '🍂',
      desc: '황금빛과 붉은 계열이 어우러진 풍성한 가을 단풍.',
      palette: ['#D4660A','#F2A922','#8B1E1E','#6B4C2A','#E8C87A'],
      prompt: `stunning autumn foliage landscape, maple oak trees in full fall color, dense canopy of red orange golden leaves, warm dappled light filtering through colorful branches, color palette: #D4660A #F2A922 #8B1E1E #6B4C2A #E8C87A, rich burnt orange as dominant leaf color, warm amber gold for sunlit foliage, deep burgundy-red for mature maple, dark earthy brown for trunks, pale golden yellow for backlit leaves`,
      tags: ['가을','단풍','황금빛'] },
    { id: 'nature-winter-snow', category: 'nature', nameKo: '겨울 설경', nameEn: 'Winter Snowscape', emoji: '❄️',
      desc: '순수하고 고요한 겨울 설경. 차갑고 맑은 하얀 눈과 서릿빛 하늘.',
      palette: ['#F4F8FF','#CADAEC','#8BA8C4','#DDEAF5','#3E6080'],
      prompt: `serene winter snowscape, pristine untouched snow covering quiet forest, bare tree branches laden with fresh snow crystals, soft overcast sky casting cold diffused light, color palette: #F4F8FF #CADAEC #8BA8C4 #DDEAF5 #3E6080, pure ice-white as dominant snow color, pale powder blue for shadowed snow, soft steel blue for overcast winter sky, light frost blue for ice reflection, deep teal-grey for distant tree silhouettes`,
      tags: ['겨울','설경','고요함'] },
    { id: 'nature-deep-sea', category: 'nature', nameKo: '딥씨 오션', nameEn: 'Deep Sea Ocean', emoji: '🌊',
      desc: '빛이 닿지 않는 심해의 신비롭고 압도적인 세계. 발광하는 심해 생물들.',
      palette: ['#03101F','#0A2A4A','#0D5A8A','#00C4B4','#6AFFE8'],
      prompt: `awe-inspiring deep sea exploration, bioluminescent jellyfish and sea creatures glowing in abyssal darkness, rays of faint filtered light from distant surface, mysterious underwater formations, color palette: #03101F #0A2A4A #0D5A8A #00C4B4 #6AFFE8, near-black midnight blue for deep ocean void, very dark navy for water mass depth, medium ocean blue for dimly lit water, bright teal for bioluminescent accents, vibrant cyan-green for glowing organism highlights`,
      tags: ['심해','바다','발광'] },
    { id: 'nature-aurora', category: 'nature', nameKo: '오로라 보레알리스', nameEn: 'Aurora Borealis', emoji: '🌌',
      desc: '북극의 밤하늘을 수놓는 오로라의 신비로운 아름다움.',
      palette: ['#0B0E2B','#1B4D3E','#4DFFA0','#9B59B6','#C8A8FF'],
      prompt: `breathtaking aurora borealis over snow-covered arctic landscape, luminous green and violet curtains of light dancing across star-filled night sky, silhouettes of pine trees and frozen tundra below, color palette: #0B0E2B #1B4D3E #4DFFA0 #9B59B6 #C8A8FF, deep space indigo for night sky base, dark forest teal for pine tree silhouettes, vivid electric green for main aurora band, rich violet-purple for secondary aurora, pale lavender for diffused glow`,
      tags: ['오로라','북극','밤하늘'] },
    { id: 'nature-desert-sunset', category: 'nature', nameKo: '사막 선셋', nameEn: 'Desert Sunset', emoji: '🏜️',
      desc: '광활한 사막 위로 펼쳐지는 장엄한 노을. 황토빛과 주황 하늘의 그라데이션.',
      palette: ['#C04B10','#E8841A','#F2C166','#8B3A00','#FFD08A'],
      prompt: `dramatic desert sunset landscape, vast sand dunes stretching to horizon, fiery orange golden sky with layered gradient clouds, silhouettes of saguaro cacti and rock formations, color palette: #C04B10 #E8841A #F2C166 #8B3A00 #FFD08A, deep burnt sienna for shadowed sand and rock, vivid amber orange for glowing sunset horizon, warm golden tan for sunlit sand, very dark brown for silhouetted vegetation, pale gold for lightest sky glow`,
      tags: ['사막','노을','황토'] },
    { id: 'nature-rainforest', category: 'nature', nameKo: '열대우림', nameEn: 'Tropical Rainforest', emoji: '🌿',
      desc: '울창한 밀림 속의 풍성한 생명력. 다양한 채도의 초록이 겹겹이 쌓인 정글.',
      palette: ['#1A4D1A','#2E8B3A','#7EC850','#A8D55A','#3B6E1A'],
      prompt: `lush tropical rainforest interior, towering ancient trees with dense multi-layered canopy, giant tropical leaves glistening with rain droplets, shafts of sunlight piercing through foliage, color palette: #1A4D1A #2E8B3A #7EC850 #A8D55A #3B6E1A, very dark forest green for deep jungle shadows, medium emerald green for mid-canopy foliage, bright lime-green for sunlit leaf surfaces, yellow-green for backlit translucent leaves, deep olive for bark`,
      tags: ['정글','열대','초록'] },
    { id: 'nature-misty-forest', category: 'nature', nameKo: '안개 낀 새벽 숲', nameEn: 'Misty Dawn Forest', emoji: '🌫️',
      desc: '새벽빛이 안개와 어우러지는 몽환적인 숲. 고요하고 시적인 분위기.',
      palette: ['#D8E4E8','#8AAAB4','#4A7080','#C4D8C0','#2E4F5A'],
      prompt: `magical misty dawn forest, soft morning light filtering through layers of ground fog, tall slender trees forming atmospheric perspective depth through mist, delicate dew on spider webs and leaves, color palette: #D8E4E8 #8AAAB4 #4A7080 #C4D8C0 #2E4F5A, pale blue-grey for dense morning mist, soft steel-blue for mid-distance tree silhouettes, muted teal-grey for distant forest layers, pale sage green for fog-softened foliage, dark slate for nearest trunks`,
      tags: ['안개','새벽','숲'] },
    { id: 'nature-volcanic', category: 'nature', nameKo: '화산 용암', nameEn: 'Volcanic Lava', emoji: '🌋',
      desc: '대지를 흘러내리는 용암의 강렬하고 원초적인 에너지.',
      palette: ['#1A0A00','#8B1A00','#E84000','#FF7A1A','#FFCC44'],
      prompt: `dramatic volcanic eruption lava flow, glowing molten lava rivers cutting through dark solidified basalt rock, intense heat haze shimmering above, glowing orange cracks in cooling lava crust, color palette: #1A0A00 #8B1A00 #E84000 #FF7A1A #FFCC44, near-black charcoal for cooled volcanic rock, deep dark crimson for solidifying lava edges, intense bright red-orange for active lava surface, vivid orange for molten flow center, bright amber-yellow for hottest glowing core`,
      tags: ['화산','용암','원초적'] },

    // ── 음식·푸드 ────────────────────────────────────────────
    { id: 'food-flatlay', category: 'food', nameKo: '플랫레이 푸드 포토', nameEn: 'Flatlay Food Photography', emoji: '📸',
      desc: '탑뷰 앵글로 촬영한 세련된 푸드 스타일링.',
      palette: ['#F5ECD7','#C8A86B','#8B4513','#E8D5A3','#4A3520'],
      prompt: `beautifully styled overhead flatlay food photography, top-down 90-degree angle shot on light linen textured surface, artfully arranged gourmet ingredients with carefully placed props, color palette: #F5ECD7 #C8A86B #8B4513 #E8D5A3 #4A3520, warm off-white cream for background surface, golden tan for rustic ceramic and wood props, rich dark brown for coffee and chocolate elements, pale wheat for bread textures, deep espresso brown for shadow`,
      tags: ['탑뷰','플랫레이','푸드스타일링'] },
    { id: 'food-fine-dining', category: 'food', nameKo: '파인다이닝 플레이팅', nameEn: 'Fine Dining Plating', emoji: '🍽️',
      desc: '미슐랭 레스토랑의 예술적인 플레이팅. 흰 접시 위에 담긴 회화 같은 요리.',
      palette: ['#FAFAFA','#2C1A0E','#8B6914','#C4A882','#1A1A1A'],
      prompt: `exquisite fine dining michelin-star plating on large pristine white ceramic plate, minimalist artistic food presentation with precisely placed micro herbs edible flowers and elegant sauce work, dramatic dark background, color palette: #FAFAFA #2C1A0E #8B6914 #C4A882 #1A1A1A, pure white plate as canvas, very dark rich brown for braised meat and truffle, warm antique gold for sauce reductions, light caramel for creamy components, near-black for dramatic background`,
      tags: ['파인다이닝','미슐랭','플레이팅'] },
    { id: 'food-bakery', category: 'food', nameKo: '빵·베이커리', nameEn: 'Bakery & Bread', emoji: '🥐',
      desc: '따뜻한 갈색 계열의 포근한 베이커리 감성. 갓 구운 빵의 황금빛 크러스트.',
      palette: ['#8B4A1A','#C47E3A','#E8C090','#F7EDD8','#5C2E0A'],
      prompt: `warm inviting artisan bakery scene, freshly baked sourdough bread and croissants on rustic wooden board, golden brown crusty loaves with visible scoring and flour dusting, morning light through window, color palette: #8B4A1A #C47E3A #E8C090 #F7EDD8 #5C2E0A, deep chestnut brown for dark baked crust and wooden surface, warm amber for golden medium-baked bread exterior, light caramel tan for soft interior crumb, pale creamy ivory for flour-dusted surfaces, very dark espresso for deep shadows`,
      tags: ['베이커리','빵','러스틱'] },
    { id: 'food-bubble-tea', category: 'food', nameKo: '버블티·디저트 카페', nameEn: 'Bubble Tea Dessert Cafe', emoji: '🧋',
      desc: '파스텔 색조로 가득한 달달하고 사랑스러운 디저트 카페 분위기.',
      palette: ['#F9D8E8','#D4A8E0','#A8D8E0','#F7C8A0','#E8A0C8'],
      prompt: `dreamy pastel dessert cafe scene, colorful bubble teas in tall glasses with tapioca pearls, macarons and layered cakes on marble surface, kawaii aesthetic, color palette: #F9D8E8 #D4A8E0 #A8D8E0 #F7C8A0 #E8A0C8, soft baby pink for dominant background, gentle lilac-purple for drink layers, pale sky blue-green for mint desserts, light peach-orange for caramel flavors, soft candy pink for floral decorations, sweet girly aesthetic`,
      tags: ['버블티','디저트','파스텔'] },
    { id: 'food-street-food', category: 'food', nameKo: '스트리트 푸드 야시장', nameEn: 'Street Food Night Market', emoji: '🏮',
      desc: '활기차고 소란스러운 야시장의 에너지. 포장마차 조명 아래 김이 오르는 먹거리들.',
      palette: ['#1A1000','#B86A00','#F0A800','#E84A20','#FAE070'],
      prompt: `lively street food night market scene, smoking grills and woks, colorful food stalls illuminated by warm hanging lanterns, sizzling skewers and steaming bowls in foreground, color palette: #1A1000 #B86A00 #F0A800 #E84A20 #FAE070, near-black deep brown for night sky, dark amber-orange for charred food and lanterns, vivid golden amber for warm street light glow, bright red-orange for chili sauce and hot coal, bright yellow for highlight flares`,
      tags: ['야시장','포장마차','스트리트푸드'] },
    { id: 'food-wine-cocktail', category: 'food', nameKo: '와인·칵테일 라이프스타일', nameEn: 'Wine & Cocktail Lifestyle', emoji: '🍷',
      desc: '세련되고 성숙한 와인과 칵테일 문화의 고급스러운 라이프스타일.',
      palette: ['#1E0A0A','#7A1E2E','#C83C50','#E8B860','#F0E8D0'],
      prompt: `elegant wine and cocktail lifestyle scene, crystal wine glasses and handcrafted cocktails on dark marble bar top, deep ruby red wine catching ambient light, moody intimate bar setting, color palette: #1E0A0A #7A1E2E #C83C50 #E8B860 #F0E8D0, near-black dark maroon for dramatic shadowed background, deep wine burgundy for dominant drink color, rich crimson-red for light through wine glass, warm gold for backlit spirit and candle, pale parchment for soft highlight reflections`,
      tags: ['와인','칵테일','고급'] },
    { id: 'food-healthy-vegan', category: 'food', nameKo: '건강식·비건', nameEn: 'Healthy & Vegan', emoji: '🥗',
      desc: '신선하고 자연스러운 재료들의 건강하고 클린한 비건 이미지.',
      palette: ['#E8F5E0','#6BAE4A','#2E7D20','#C8E8A0','#1A4D10'],
      prompt: `fresh clean healthy vegan food scene, beautifully arranged plant-based dishes colorful raw vegetables spiralized zucchini avocado toast and grain bowls, fresh herbs on clean white surface, bright natural daylight, color palette: #E8F5E0 #6BAE4A #2E7D20 #C8E8A0 #1A4D10, very pale mint-green for bright clean background, medium bright green for fresh herb leaves, deep forest green for spinach and kale, light yellow-green for cucumber, very dark green for richest shadows`,
      tags: ['비건','건강식','클린이팅'] },
    { id: 'food-korean-cuisine', category: 'food', nameKo: '한식 특선', nameEn: 'Korean Cuisine Special', emoji: '🍱',
      desc: '전통 고급 한식의 정갈함과 깊이 있는 색채. 옻칠 그릇과 한지 느낌.',
      palette: ['#F5EDD8','#8B1A1A','#2A1A0A','#C4940A','#4A6A30'],
      prompt: `elegant traditional Korean cuisine spread, royal court food hansik, lacquerware bowls and stone pot on hanji paper textured table, banchan side dishes arranged with precision, vibrant kimchi and gochujang-glazed dishes, color palette: #F5EDD8 #8B1A1A #2A1A0A #C4940A #4A6A30, warm off-white rice color for background, deep crimson for kimchi and gochujang, near-black dark brown for lacquer bowls, rich golden amber for sesame oil drizzle, muted earthy green for seasoned vegetables`,
      tags: ['한식','전통','한상차림'] },
    { id: 'food-pizza-popart', category: 'food', nameKo: '피자·버거 팝 아트', nameEn: 'Pizza & Burger Pop Art', emoji: '🍕',
      desc: '패스트푸드를 팝 아트로 재해석한 대담하고 유쾌한 스타일.',
      palette: ['#FFDF00','#E82020','#0055C8','#FF6C00','#FFFFFF'],
      prompt: `bold pop art fast food illustration, oversized dripping cheeseburgers and pizza slices, Andy Warhol inspired graphic treatment with thick black outlines and flat bold color fills, halftone dot pattern textures, color palette: #FFDF00 #E82020 #0055C8 #FF6C00 #FFFFFF, pure bright yellow for cheese and mustard, bold red for tomato sauce, strong cobalt blue for graphic background panels, vivid orange for cheddar and hot sauce, white for negative space`,
      tags: ['팝아트','패스트푸드','버거'] },
    { id: 'food-ramen', category: 'food', nameKo: '일본 라멘 & 누들', nameEn: 'Japanese Ramen & Noodle', emoji: '🍜',
      desc: '김이 솟아오르는 깊은 국물의 라멘 한 그릇. 장인 정신의 따뜻한 드라마.',
      palette: ['#1A0E00','#8B4A00','#D48A30','#F0D090','#E84030'],
      prompt: `dramatic steaming bowl of Japanese ramen, rich golden tonkotsu broth, perfectly arranged toppings chashu pork nari eggs nori green onions, billowing steam rising, dark atmospheric background with warm spot lighting, color palette: #1A0E00 #8B4A00 #D48A30 #F0D090 #E84030, near-black for atmospheric dark background, dark amber-brown for rich soy broth base, warm golden brown for main broth, pale golden tan for noodle and egg yolk, bright red-orange for chili oil accent`,
      tags: ['라멘','일본','국물'] },

    // ── 문화·전통 ────────────────────────────────────────────
    { id: 'culture-korean-minhwa', category: 'culture', nameKo: '한국 전통 민화', nameEn: 'Korean Traditional Minhwa', emoji: '🐯',
      desc: '조선시대 민간에서 유행한 채색 그림. 호랑이·봉황 등 길상 문양과 오방색.',
      palette: ['#C8373A','#2B5FA6','#E8B84B','#3A8C4E','#F5E6C8'],
      prompt: `Korean traditional Minhwa folk painting style, flat decorative illustration with bold outline strokes, auspicious motifs tiger magpie peony lotus phoenix, color palette: #C8373A #2B5FA6 #E8B84B #3A8C4E #F5E6C8, vermillion red as dominant accent, deep blue for water and sky, golden yellow for highlights and foliage, forest green for nature elements, warm parchment beige as background, Joseon dynasty obangsaek five cardinal colors`,
      tags: ['민화','조선','오방색'] },
    { id: 'culture-ukiyoe', category: 'culture', nameKo: '일본 우키요에', nameEn: 'Japanese Ukiyo-e', emoji: '🗻',
      desc: '에도 시대 목판화 예술. 호쿠사이 감성의 파도·후지산·벚꽃 모티프.',
      palette: ['#1A5276','#C0392B','#F0C040','#2E8B57','#FAF0E6'],
      prompt: `Japanese Ukiyo-e woodblock print style, Hokusai Hiroshige aesthetic, bold contour lines with flat color fills, color palette: #1A5276 #C0392B #F0C040 #2E8B57 #FAF0E6, Prussian blue for ocean waves and sky gradients, crimson red for accents and garments, golden yellow for sunlight and highlights, deep green for pine trees and foliage, ivory linen as base tone, Mount Fuji cherry blossom wave motifs, woodblock grain texture`,
      tags: ['우키요에','에도','목판화'] },
    { id: 'culture-chinese-ink', category: 'culture', nameKo: '중국 수묵 산수화', nameEn: 'Chinese Ink Wash Landscape', emoji: '🏔️',
      desc: '먹의 농담을 이용해 산·강·안개를 표현하는 중국 전통 수묵화.',
      palette: ['#1A1A1A','#5A5A5A','#A0A0A0','#D8D0C0','#F5F0E8'],
      prompt: `Chinese traditional ink wash painting Shanshui landscape, sumi-e brush technique, misty mountain river pine tree composition, color palette: #1A1A1A #5A5A5A #A0A0A0 #D8D0C0 #F5F0E8, deep black ink for bold brushstrokes and focal elements, medium gray for mid-ground mountains, light gray wash for distant peaks and mist, warm taupe for subtle earth tones, off-white rice paper texture as ground, negative space as central aesthetic`,
      tags: ['수묵화','산수화','붓'] },
    { id: 'culture-african-tribal', category: 'culture', nameKo: '아프리카 트라이벌', nameEn: 'African Tribal Pattern', emoji: '🦁',
      desc: '아프리카 각 부족의 직물에서 비롯된 기하학 패턴. 삼각형·마름모 등 강렬한 반복 문양.',
      palette: ['#8B2500','#D4760A','#F2C14E','#2D4A1E','#1C1C1C'],
      prompt: `African tribal art pattern style, bold geometric shapes repeating motifs, Kente Adinkra Ndebele cloth inspired design, color palette: #8B2500 #D4760A #F2C14E #2D4A1E #1C1C1C, deep terracotta red as primary structural color, burnt orange for secondary geometric fills, golden yellow for highlight accents and sun motifs, dark forest green for nature symbols, charcoal black for outlines and bold divisions, zigzag diamond triangle chevron patterns`,
      tags: ['트라이벌','기하학','아프리카'] },
    { id: 'culture-indian-mandala', category: 'culture', nameKo: '인도 만달라', nameEn: 'Indian Mandala & Hindu Art', emoji: '🕉️',
      desc: '힌두교와 불교의 우주관을 시각화한 만달라. 중심에서 방사형으로 펼쳐지는 대칭 구조.',
      palette: ['#C8A000','#B22222','#6A0DAD','#006994','#F5E6C8'],
      prompt: `Indian mandala Hindu sacred art, radially symmetric intricate geometric pattern, lotus flower peacock elephant deity motifs, color palette: #C8A000 #B22222 #6A0DAD #006994 #F5E6C8, rich gold as primary ornamental color representing divinity, deep crimson for sacred energy, royal purple for spiritual transcendence, ocean blue for cosmic depth, warm ivory as meditative background, jewel-tone palette, mehndi henna inspired linework`,
      tags: ['만달라','힌두','기하학'] },
    { id: 'culture-mexican-oaxaca', category: 'culture', nameKo: '멕시코 오아하카 민속 아트', nameEn: 'Mexican Oaxacan Folk Art', emoji: '🦋',
      desc: '멕시코 오아하카의 알레브리헤에서 영감받은 비비드 컬러 민속 아트.',
      palette: ['#FF2D55','#FF9500','#FFCC00','#34C759','#5E5CE6'],
      prompt: `Mexican Oaxacan folk art style, Alebrijes wood carving aesthetic, Dia de los Muertos inspired illustration, fantastical animal figures covered in intricate patterns, color palette: #FF2D55 #FF9500 #FFCC00 #34C759 #5E5CE6, electric magenta pink as dominant vibrant base, vivid orange for warmth and festivity, bright golden yellow for celebration, lime green for jungle foliage, electric indigo for mystical elements, dense pattern-within-pattern composition`,
      tags: ['오아하카','알레브리헤','멕시코'] },
    { id: 'culture-islamic-arabesque', category: 'culture', nameKo: '이슬람 아라베스크', nameEn: 'Islamic Geometric Arabesque', emoji: '🕌',
      desc: '이슬람 건축의 아라베스크 패턴. 무한히 반복되는 기하학 격자와 식물 덩굴 문양.',
      palette: ['#1B3A6B','#00796B','#C9A227','#8B1A1A','#F5F0E0'],
      prompt: `Islamic geometric arabesque pattern, infinite tessellation tile design, star polygon girih pattern with vegetal arabesque scrollwork, color palette: #1B3A6B #00796B #C9A227 #8B1A1A #F5F0E0, lapis lazuli deep blue as primary sacred color, emerald teal green for botanical interlace, antique gold for geometric star outlines, deep burgundy red for contrast accent fills, warm ivory parchment as background, Alhambra Iznik tile Moroccan zellige inspiration`,
      tags: ['아라베스크','이슬람','기하학'] },
    { id: 'culture-russian-khokhloma', category: 'culture', nameKo: '러시아 흐홀로마', nameEn: 'Russian Khokhloma Folk Art', emoji: '🌺',
      desc: '러시아 흐홀로마 목공예 페인팅. 검은 배경 위에 금빛과 붉은 딸기·꽃 문양.',
      palette: ['#1A0A00','#C8180A','#D4AF37','#2D6A2D','#F5C518'],
      prompt: `Russian Khokhloma folk painting style, golden botanical scrollwork on dark background, strawberry rowan berry floral motifs with curling leaf tendrils, color palette: #1A0A00 #C8180A #D4AF37 #2D6A2D #F5C518, deep black lacquer as dramatic background, crimson red for berries and flower petals, antique gold for primary botanical outlines and filigree, forest green for leaf and stem details, bright yellow gold for highlight and shimmer accents`,
      tags: ['흐홀로마','러시아','금빛'] },
    { id: 'culture-maya-aztec', category: 'culture', nameKo: '마야·아즈텍 고대 문명', nameEn: 'Maya & Aztec Ancient Civilization', emoji: '🌞',
      desc: '메소아메리카 고대 문명의 석조 부조·코덱스에서 영감받은 스타일.',
      palette: ['#7B3F00','#C17F24','#2C5F2E','#8B0000','#F5DEB3'],
      prompt: `Maya Aztec ancient Mesoamerican civilization art style, stone relief carving codex manuscript aesthetic, Sun Stone calendar feathered serpent jaguar warrior motifs, color palette: #7B3F00 #C17F24 #2C5F2E #8B0000 #F5DEB3, rich chocolate brown for stone and earth base tones, burnished copper gold for solar deity and metalwork, deep jungle green for Quetzalcoatl plumage, deep blood red for ritual and power, warm wheat beige for aged stone and parchment`,
      tags: ['마야','아즈텍','고대문명'] },
    { id: 'culture-celtic', category: 'culture', nameKo: '켈트 매듭 & 일루미네이션', nameEn: 'Celtic Knotwork & Illuminated Manuscript', emoji: '☘️',
      desc: '중세 아일랜드 켈트 문화의 끊임없이 이어지는 매듭 문양과 채식 사본.',
      palette: ['#1B4D1B','#8B6914','#8B1A2A','#1A3A5C','#F0E6C8'],
      prompt: `Celtic knotwork illuminated manuscript style, Book of Kells insular art aesthetic, infinite interlace knot pattern with zoomorphic animal forms, triquetra spiral triskelion motifs, color palette: #1B4D1B #8B6914 #8B1A2A #1A3A5C #F0E6C8, deep emerald green as primary Celtic earth tone, antique burnished gold for knotwork outlines and gilding, deep crimson maroon for decorative fills, midnight navy for depth and sky symbolism, aged vellum ivory for parchment background`,
      tags: ['켈트','매듭','중세'] },
    { id: 'culture-byzantine', category: 'culture', nameKo: '비잔틴 모자이크', nameEn: 'Byzantine Mosaic Icon', emoji: '⛪',
      desc: '동로마제국의 황금빛 성화 모자이크 스타일. 초자연적 위엄과 신성한 광채.',
      palette: ['#C9A227','#1B3268','#8B1A1A','#2E6B2E','#F5F0DC'],
      prompt: `Byzantine mosaic icon painting style, Eastern Orthodox sacred art, golden background tesserae mosaic texture, frontal hieratic saint figure with halo nimbus, color palette: #C9A227 #1B3268 #8B1A1A #2E6B2E #F5F0DC, radiant Byzantine gold for divine background and halos, deep royal blue for Virgin Mary robes, rich crimson for Christ garments, deep green for secondary robe accents, aged ivory cream for skin tones, geometric tesserae tile texture overlay`,
      tags: ['비잔틴','모자이크','성화'] },

    // ── 사이언스·데이터 ──────────────────────────────────────
    { id: 'science-data-viz', category: 'science', nameKo: '데이터 시각화 인포그래픽', nameEn: 'Data Visualization Infographic', emoji: '📊',
      desc: '복잡한 데이터를 직관적으로 전달하는 인포그래픽·차트 스타일.',
      palette: ['#0A0E27','#00D4FF','#FF6B35','#7FFF00','#FFD700'],
      prompt: `data visualization infographic design, clean analytical dashboard aesthetic, bar chart pie chart flow diagram network graph, color palette: #0A0E27 #00D4FF #FF6B35 #7FFF00 #FFD700, deep navy midnight as dark analytical background, electric cyan for primary data series, vivid coral orange for secondary data contrast, chartreuse green for positive metrics, bright gold yellow for tertiary data points, glowing neon data lines on dark grid, sleek futuristic analytical mood`,
      tags: ['인포그래픽','차트','데이터'] },
    { id: 'science-dna', category: 'science', nameKo: 'DNA·분자 구조 일러스트', nameEn: 'DNA & Molecular Structure', emoji: '🧬',
      desc: 'DNA 이중나선과 단백질 분자 구조를 아름답게 시각화한 과학 일러스트.',
      palette: ['#0D1B2A','#3A86FF','#FF006E','#8338EC','#06D6A0'],
      prompt: `DNA double helix molecular structure scientific illustration, protein ribbon diagram space-filling model atomic bond visualization, color palette: #0D1B2A #3A86FF #FF006E #8338EC #06D6A0, deep space navy as dark scientific background, bright royal blue for phosphate backbone, hot magenta pink for base pairs adenine thymine, deep violet purple for guanine cytosine pairs, mint emerald green for hydrogen bonds, 3D depth and perspective implied through shading, translucent sphere atoms, glowing bioluminescent quality`,
      tags: ['DNA','분자','생명과학'] },
    { id: 'science-space', category: 'science', nameKo: '우주·은하 (NASA 스타일)', nameEn: 'Galaxy & Cosmos NASA Style', emoji: '🌌',
      desc: '허블·제임스 웹 망원경에서 영감받은 우주 이미지. 성운과 은하의 경이.',
      palette: ['#030014','#4B0082','#FF4500','#00CED1','#FFD700'],
      prompt: `NASA Hubble James Webb telescope deep space photography style, nebula galaxy stellar nursery cosmic landscape, swirling gas clouds star formation, color palette: #030014 #4B0082 #FF4500 #00CED1 #FFD700, absolute black void of deep space as foundation, deep indigo violet for nebula gas cloud, solar orange red for stellar jets, electric teal cyan for ionized emission, golden yellow for bright star cores, billions of background stars, extreme depth cosmic scale, false-color composite image style`,
      tags: ['우주','은하','NASA'] },
    { id: 'science-neural-network', category: 'science', nameKo: '신경망·AI 네트워크 시각화', nameEn: 'Neural Network & AI Visualization', emoji: '🧠',
      desc: '딥러닝 신경망의 뉴런 레이어와 가중치 연결을 시각화한 AI 테크 스타일.',
      palette: ['#050A14','#00FFFF','#FF00FF','#0080FF','#FFFFFF'],
      prompt: `neural network AI deep learning visualization, interconnected node layer diagram with flowing data streams, synaptic connection weight activation pattern, color palette: #050A14 #00FFFF #FF00FF #0080FF #FFFFFF, near-black deep digital space as background, pure cyan for primary neuron nodes and data flow lines, vivid magenta for active synaptic connections, electric blue for layer boundaries and network structure, bright white for high-activation focal nodes, glowing light trail motion blur on connections, cyberpunk tech aesthetic`,
      tags: ['신경망','AI','딥러닝'] },
    { id: 'science-biomedical', category: 'science', nameKo: '바이오·의료 일러스트', nameEn: 'Biomedical Illustration', emoji: '🔬',
      desc: '세포·혈관·장기의 내부 구조를 정교하게 묘사한 과학 의료 일러스트.',
      palette: ['#1A0A1E','#FF4081','#E91E63','#00BCD4','#F5F5DC'],
      prompt: `biomedical scientific illustration, human cell blood vessel organ cross-section microscopy aesthetic, red blood cells white blood cells platelet vascular structure, color palette: #1A0A1E #FF4081 #E91E63 #00BCD4 #F5F5DC, deep dark purple as electron microscope background, bright rose pink for red blood cell forms, deep magenta for cellular membrane, bright teal cyan for plasma fluid interior, warm off-white for bone matrix details, SEM texture quality, hyper-realistic biological detail`,
      tags: ['의료','세포','현미경'] },
    { id: 'science-quantum-circuit', category: 'science', nameKo: '양자컴퓨팅·회로 기판', nameEn: 'Quantum Computing & Circuit Board', emoji: '⚛️',
      desc: '양자컴퓨터의 큐비트 회로와 PCB 기판 복잡한 배선 패턴을 시각화.',
      palette: ['#020B18','#00FF88','#0066FF','#FF3300','#C0C0C0'],
      prompt: `quantum computing circuit board pattern visualization, qubit lattice superconducting processor PCB printed circuit board trace routing, color palette: #020B18 #00FF88 #0066FF #FF3300 #C0C0C0, near-black deep navy as cold cryogenic chamber background, electric neon green for quantum gate traces and active qubit states, bright electric blue for entanglement connection lines, intense red orange for error correction indicators, metallic silver for copper trace pads, geometric precision angular routing, glowing phosphorescent circuit aesthetic`,
      tags: ['양자컴퓨팅','회로기판','반도체'] },
    { id: 'science-weather-satellite', category: 'science', nameKo: '기상·위성 지도 스타일', nameEn: 'Weather & Satellite Map', emoji: '🌀',
      desc: '기상위성 사진과 레이더 이미지를 결합한 사이언스 매핑 스타일.',
      palette: ['#000B1E','#00308F','#00CC44','#FFAA00','#FF1100'],
      prompt: `weather satellite imagery meteorological map style, hurricane spiral typhoon cyclone aerial view, radar precipitation map isobar pressure contour lines, thermal infrared false-color composite, color palette: #000B1E #00308F #00CC44 #FFAA00 #FF1100, deep space black for oceanic depths and clear sky, deep maritime blue for low-pressure systems, bright green for moderate rainfall, amber orange for high intensity storm bands, alarm red for extreme precipitation cores, swirling cloud formation vortex patterns`,
      tags: ['기상','위성','허리케인'] },
    { id: 'science-fractal', category: 'science', nameKo: '수학적 프랙탈 아트', nameEn: 'Mathematical Fractal Art', emoji: '🔄',
      desc: '만델브로트 집합 등 수학적 프랙탈 구조의 무한 자기유사성을 시각화.',
      palette: ['#000000','#1A0050','#8000FF','#00BFFF','#FFD700'],
      prompt: `mathematical fractal art visualization, Mandelbrot set Julia set infinite self-similarity, complex number plane iteration boundary detail, color palette: #000000 #1A0050 #8000FF #00BFFF #FFD700, absolute black for divergence region, deep indigo for near-boundary slow-divergence, electric violet purple for mid-iteration gradient, bright sky blue for fast-divergence outer regions, golden yellow for periodic attractor cycles, ultra-high iteration count extreme zoom detail, smooth coloring algorithm gradient bands, psychedelic mathematical beauty`,
      tags: ['프랙탈','만델브로트','수학'] },
    { id: 'science-periodic-table', category: 'science', nameKo: '화학 원소 주기율표 아트', nameEn: 'Periodic Table Chemical Art', emoji: '⚗️',
      desc: '멘델레예프의 원소 주기율표를 예술적으로 재해석한 사이언스 아트.',
      palette: ['#1A1A2E','#E94560','#0F3460','#16213E','#F5A623'],
      prompt: `periodic table chemical element art design, Mendeleev table reinterpreted as artistic grid layout, electron orbital shell diagram atomic symbol atomic number composition, color palette: #1A1A2E #E94560 #0F3460 #16213E #F5A623, deep dark navy as primary elemental background grid, vivid crimson red for alkali metals and reactive element groups, rich midnight blue for noble gases and stable tiles, deep dark slate for transition metals, bright amber orange for accent highlights and element symbol typography`,
      tags: ['주기율표','원소','화학'] },
    { id: 'science-particle-physics', category: 'science', nameKo: '입자물리학 충돌 이벤트', nameEn: 'Particle Physics Collision Event', emoji: '⚡',
      desc: 'CERN LHC에서 촬영된 입자 충돌 이벤트 디텍터 이미지의 예술적 표현.',
      palette: ['#000005','#FF6600','#00FF44','#FF00AA','#66AAFF'],
      prompt: `particle physics collision event detector visualization, CERN LHC ATLAS CMS detector event display, Higgs boson quark lepton decay track radial trajectory, color palette: #000005 #FF6600 #00FF44 #FF00AA #66AAFF, absolute void black for vacuum collision chamber, electric orange for hadronic jet shower tracks, neon green for muon tracks and stable particle trajectories, hot pink magenta for electromagnetic calorimeter energy deposits, periwinkle blue for silicon tracker hits, radial burst pattern from central interaction point`,
      tags: ['입자물리','CERN','LHC'] },

    // ── 게임/판타지 추가 ──────────────────────────────────────
    { id: 'game-steampunk', category: 'game', nameKo: '스팀펑크', nameEn: 'Steampunk Fantasy', emoji: '⚙️',
      desc: '증기 기관과 태엽 장치의 빅토리아 시대 판타지. 황동과 구리의 기계 미학.',
      palette: ['#3d2b1f','#b8860b','#8b4513','#c0a882','#2c1810'],
      prompt: `steampunk fantasy illustration, Victorian era brass gears and clockwork mechanisms, steam-powered airships dirigibles in cloudy sky, color palette: #3d2b1f #b8860b #8b4513 #c0a882 #2c1810, deep dark brown for iron machinery and shadow, dark goldenrod for polished brass gears, warm saddle brown for leather and copper pipes, light warm tan for aged parchment maps, dark espresso for moody atmospheric depth, ornate Victorian decoration, fog and steam atmosphere`,
      tags: ['스팀펑크','빅토리아','기계'] },
    { id: 'game-mecha-robot', category: 'game', nameKo: '메카·로봇', nameEn: 'Mecha & Robot', emoji: '🤖',
      desc: '거대 로봇 메카의 SF 배틀 감성. 건담·에반게리온 스타일의 역동적 구도.',
      palette: ['#1a2744','#3a7bd5','#e8e8e8','#ff3b30','#ffd700'],
      prompt: `giant mecha robot battle illustration, anime sci-fi giant robot in dramatic pose, metallic mechanical detail cockpit armor plating, color palette: #1a2744 #3a7bd5 #e8e8e8 #ff3b30 #ffd700, deep dark navy for dramatic night sky background, bright electric blue for energy beam and reactor glow, light silver-gray for polished metal armor panels, vivid red for warning lights and weapon systems, bright gold for trim and hero color accent, Gundam Eva anime robot aesthetic`,
      tags: ['메카','로봇','SF'] },
    { id: 'game-horror-gothic', category: 'game', nameKo: '고딕 호러', nameEn: 'Gothic Horror', emoji: '🦇',
      desc: '뱀파이어·유령·저주받은 성의 어두운 고딕 호러 세계관.',
      palette: ['#0d0005','#4a0020','#8b0000','#c0a882','#4a3060'],
      prompt: `gothic horror illustration, haunted castle ravens and bat silhouettes, eerie moonlit graveyard fog, cursed vampire lord in dramatic cloak, color palette: #0d0005 #4a0020 #8b0000 #c0a882 #4a3060, near-black void as oppressive darkness, very dark purple-red for cursed atmosphere and castle stone, deep blood red for horror accent and vampire crimson, pale warm bone for moonlight and skeletal details, deep violet-purple for mystical dark magic aura`,
      tags: ['고딕','호러','뱀파이어'] },
    { id: 'game-space-opera', category: 'game', nameKo: '스페이스 오페라', nameEn: 'Space Opera', emoji: '🚀',
      desc: '성간 전쟁과 우주 제국의 웅장한 스페이스 오페라. 스타워즈 감성.',
      palette: ['#000814','#003566','#ffd60a','#e63946','#ffffff'],
      prompt: `space opera epic illustration, massive starships in deep space battle, alien planet with twin moons backdrop, heroic figures in silhouette against nebula, color palette: #000814 #003566 #ffd60a #e63946 #ffffff, near-black deep space as infinite background, deep dark blue for spacecraft and atmospheric depth, bright golden yellow for engine glow and lightsaber energy, vivid red for laser blasts and enemy forces, pure white for hero highlights and star flares, Star Wars epic cinematic scope`,
      tags: ['스페이스오페라','우주전쟁','SF'] },
    { id: 'game-isekai-anime', category: 'game', nameKo: '이세계 애니', nameEn: 'Isekai Anime', emoji: '🌟',
      desc: '다른 세계에 소환된 주인공의 이세계 판타지. 밝고 화려한 J-RPG 감성.',
      palette: ['#7b2fff','#ff6ed8','#ffe566','#4adcff','#ffffff'],
      prompt: `isekai anime fantasy illustration, hero summoned to magical other world, grand fantasy city with floating islands and magic towers, vibrant colorful environment, color palette: #7b2fff #ff6ed8 #ffe566 #4adcff #ffffff, deep vivid violet for magical portal and mana energy, bright hot pink for romantic sakura and special powers, warm bright yellow for divine light and chosen hero aura, electric sky blue for magical sky and spirit elements, pure white for divine revelation and power-up glow, J-RPG bright fantasy aesthetic`,
      tags: ['이세계','애니','J-RPG'] },
    { id: 'game-survival-wilderness', category: 'game', nameKo: '서바이벌 야생', nameEn: 'Survival Wilderness', emoji: '🌲',
      desc: '자연 속 생존의 긴장감. 황야와 숲의 로우 폴리 게임 느낌.',
      palette: ['#2d4a22','#6b8f3a','#c8a46e','#1a2e1a','#e8d5b0'],
      prompt: `survival wilderness game environment, dense forest campsite with handcrafted shelter and fire, wild animals tracking through undergrowth, moody overcast dawn light, color palette: #2d4a22 #6b8f3a #c8a46e #1a2e1a #e8d5b0, deep forest green for dense foliage and shadow ground, medium olive-green for mid-canopy and fern layers, warm sandy-tan for wooden crafted items and soil patches, very dark deep green for night forest depth, light warm beige for morning fog and campfire smoke, survival game art style`,
      tags: ['서바이벌','야생','게임'] },
    { id: 'game-rhythm-music', category: 'game', nameKo: '리듬 뮤직 게임', nameEn: 'Rhythm Music Game', emoji: '🎵',
      desc: 'DJMAX·비트매니아 감성의 화려한 리듬 게임 비주얼.',
      palette: ['#0a0014','#ff00aa','#00ffcc','#ffcc00','#aa00ff'],
      prompt: `rhythm music game visual, neon holographic music notes and waveform patterns, DJ turntable stage with holographic display, colorful beat tracks flowing in space, color palette: #0a0014 #ff00aa #00ffcc #ffcc00 #aa00ff, near-black deep space for immersive dark stage, hot neon pink for primary beat track and glow, vivid cyan-green for secondary rhythm lane and hit effect, bright yellow for gold note and perfect hit flash, deep violet for background aurora and secondary glow, DJMAX BeatSaber aesthetic, holographic music visualization`,
      tags: ['리듬게임','뮤직','네온'] },
    { id: 'game-open-world-nature', category: 'game', nameKo: '오픈 월드 자연', nameEn: 'Open World Nature', emoji: '🏞️',
      desc: '젤다·호라이즌 같은 아름다운 오픈 월드 자연 환경.',
      palette: ['#87ceeb','#7ec850','#c8a46e','#2d6a4f','#ffd700'],
      prompt: `open world game environment landscape, vast rolling hills meadows with wildflowers, ancient ruins on hilltop at golden hour, hero silhouette on cliff edge overlooking world, color palette: #87ceeb #7ec850 #c8a46e #2d6a4f #ffd700, soft sky blue for bright open game sky, bright lime-medium green for lush grass and meadow, warm sandy tan for dirt paths and ancient stone ruins, deep forest green for tree clusters and shade, bright golden yellow for sunset glow and treasure highlight, Zelda Horizon Zero Dawn art direction`,
      tags: ['오픈월드','자연','RPG'] },

    // ── 3D·기술 추가 ──────────────────────────────────────────
    { id: '3d-holographic-ui', category: '3d', nameKo: '홀로그래픽 UI', nameEn: 'Holographic UI', emoji: '📟',
      desc: '미래형 홀로그램 인터페이스 디자인. 빛나는 반투명 데이터 패널.',
      palette: ['#001a33','#00d4ff','#0066ff','#00ff88','#ffffff'],
      prompt: `holographic UI futuristic interface design, translucent glowing data panels floating in space, sci-fi HUD elements wireframe grids, color palette: #001a33 #00d4ff #0066ff #00ff88 #ffffff, very dark navy for deep digital void background, electric cyan for primary hologram projection light, bright royal blue for secondary panel glow, vivid mint green for data readout and alert status, pure white for highlight and core interface elements, Iron Man JARVIS interface aesthetic, glass morphism transparency`,
      tags: ['홀로그램','UI','미래'] },
    { id: '3d-product-render', category: '3d', nameKo: '3D 제품 렌더링', nameEn: '3D Product Render', emoji: '📱',
      desc: 'Blender·Cinema4D 스타일의 깔끔한 3D 제품 렌더링.',
      palette: ['#f0f0f0','#d4d4d4','#2c2c2c','#6c63ff','#ffffff'],
      prompt: `clean 3D product render Blender Cinema4D aesthetic, smartphone device on minimal surface with soft gradient background, studio three-point lighting setup with reflections, color palette: #f0f0f0 #d4d4d4 #2c2c2c #6c63ff #ffffff, light pearl gray for soft gradient background, medium silver-gray for surface reflection and device casing, dark charcoal for product screen and detail shadow, vibrant indigo-violet for accent color and UI glow, pure white for key specular highlights and clean space, commercial product visualization`,
      tags: ['제품렌더','Blender','3D모델링'] },
    { id: '3d-abstract-sculpture', category: '3d', nameKo: '추상 3D 조각', nameEn: 'Abstract 3D Sculpture', emoji: '🗿',
      desc: '유기적이고 추상적인 3D 조각 렌더링. 크롬과 유리 재질의 현대 조각.',
      palette: ['#c0c0c0','#888888','#1a1a2e','#00d4ff','#ffffff'],
      prompt: `abstract 3D sculpture render, organic flowing metallic form with chrome and glass material, dramatic studio spotlight from above, color palette: #c0c0c0 #888888 #1a1a2e #00d4ff #ffffff, bright silver for primary polished chrome surface, medium gray for shadowed chrome transitions, deep dark navy for dramatic dark background, electric cyan for reflected environment light on surface, pure white for key specular hotspot highlight, Zaha Hadid inspired organic geometric form, museum installation art quality`,
      tags: ['추상조각','크롬','현대미술'] },
    { id: '3d-game-environment', category: '3d', nameKo: '3D 게임 환경', nameEn: '3D Game Environment', emoji: '🏙️',
      desc: 'UE5·Unity 스타일의 포토리얼 3D 게임 환경 렌더링.',
      palette: ['#2c3e50','#3498db','#ecf0f1','#e74c3c','#f39c12'],
      prompt: `photorealistic 3D game environment Unreal Engine 5 aesthetic, detailed urban street scene with volumetric lighting, PBR material surfaces wet concrete glass metal, color palette: #2c3e50 #3498db #ecf0f1 #e74c3c #f39c12, dark blue-gray for concrete buildings and deep shadow, bright cerulean blue for sky and neon reflections, near-white for architectural highlights and glass, vivid red for emergency signage and focal accent, amber orange for warm street lighting and metal, lumen global illumination quality, AAA game art direction`,
      tags: ['3D환경','게임환경','UE5'] },
    { id: '3d-nft-generative', category: '3d', nameKo: '제너러티브 아트', nameEn: 'Generative 3D Art', emoji: '🎲',
      desc: '알고리즘으로 생성된 추상 3D 아트. NFT·디지털 아트 감성.',
      palette: ['#0a0a14','#ff6b35','#7b2fff','#00ff88','#ffcc00'],
      prompt: `generative abstract 3D art, algorithmically created organic blob form with iridescent surface material, dynamic particle systems orbiting central mass, color palette: #0a0a14 #ff6b35 #7b2fff #00ff88 #ffcc00, near-black for deep digital void space, vivid coral-orange for warm energy emission, deep violet for primary form body, neon mint green for particle trail and data flow, bright gold for core energy source, NFT digital art aesthetic, iridescent holographic material shader`,
      tags: ['제너러티브','NFT','디지털아트'] },
    { id: '3d-architecture-viz', category: '3d', nameKo: '건축 시각화', nameEn: 'Architectural Visualization', emoji: '🏗️',
      desc: '현대 건축의 고품질 3D 시각화. 레이트레이싱 품질의 건축 렌더링.',
      palette: ['#f5f0eb','#c8b89a','#4a4a4a','#87ceeb','#2d6a4f'],
      prompt: `architectural visualization render, modern residential building with large glass facade and wooden deck, lush landscape surroundings at dusk, ray-traced lighting with warm interior glow, color palette: #f5f0eb #c8b89a #4a4a4a #87ceeb #2d6a4f, warm off-white for light concrete and plaster facade, warm tan for wooden cladding and deck surface, dark charcoal for window frames and metal details, soft sky blue for dusk sky and glass reflection, forest green for surrounding landscape trees, photorealistic architectural rendering quality`,
      tags: ['건축시각화','렌더링','레이트레이싱'] },
    { id: '3d-fluid-simulation', category: '3d', nameKo: '유체 시뮬레이션', nameEn: 'Fluid Simulation 3D', emoji: '💧',
      desc: '물·용암·액체의 유체 시뮬레이션 3D 렌더링. 찰나의 스플래시.',
      palette: ['#001a33','#0099ff','#00ccff','#ffffff','#c0e8ff'],
      prompt: `3D fluid simulation render, water splash droplets frozen in perfect instant, translucent liquid with subsurface scattering, macro close-up of crown splash impact, color palette: #001a33 #0099ff #00ccff #ffffff #c0e8ff, very deep navy for dark water background depth, vivid medium blue for primary water body volume, bright cyan for translucent water surface and thin edges, pure white for specular foam and splash highlight, pale ice blue for soft scattered light through water, Houdini simulation quality, macro photography aesthetic`,
      tags: ['유체시뮬레이션','물','스플래시'] },

    // ── 수공예·아날로그 추가 ─────────────────────────────────
    { id: 'craft-linocut', category: 'craft', nameKo: '리노컷 판화', nameEn: 'Linocut Print', emoji: '🖨️',
      desc: '리놀륨판을 파서 찍어낸 판화 기법. 선명한 실루엣과 거친 판화 질감.',
      palette: ['#1a1000','#f5e6c8','#8b3a00','#c8a050','#2d1a00'],
      prompt: `linocut relief print artwork, bold carved linoleum plate print aesthetic, high contrast black and white negative positive space, visible gouge marks and plate texture, color palette: #1a1000 #f5e6c8 #8b3a00 #c8a050 #2d1a00, near-black ink for solid print areas and bold shadows, warm cream for relief areas and paper background, dark warm brown for overprinted color layer, golden amber for second color block print, very dark brown for border and registration mark, folk art poster aesthetic, handmade print quality`,
      tags: ['판화','리노컷','수작업'] },
    { id: 'craft-batik', category: 'craft', nameKo: '바틱 염색', nameEn: 'Batik Textile Dyeing', emoji: '🎨',
      desc: '인도네시아 전통 밀랍 방염 직물 기법. 크랙클 패턴과 자바 문양.',
      palette: ['#4a2000','#8b5a00','#c8a050','#2d5a1e','#f5e6c8'],
      prompt: `batik textile dyeing art, Indonesian traditional wax-resist fabric pattern, intricate Javanese floral and geometric motifs, characteristic crackle effect through wax, color palette: #4a2000 #8b5a00 #c8a050 #2d5a1e #f5e6c8, very deep brown for darkest dye layer and background, warm dark amber for mid-tone dye penetration, golden tan for lighter resist areas, forest green for nature-inspired secondary motifs, warm pale cream for wax-resist undyed fabric, handcrafted textile heritage aesthetic`,
      tags: ['바틱','염색','인도네시아'] },
    { id: 'craft-stained-glass', category: 'craft', nameKo: '스테인드글라스', nameEn: 'Stained Glass', emoji: '🪟',
      desc: '성당 장미창 같은 스테인드글라스 아트. 빛을 투과하는 색유리의 아름다움.',
      palette: ['#1a0a5e','#8b0000','#006400','#c8a000','#4a0a8b'],
      prompt: `stained glass window art style, cathedral rose window design, lead came outlines between vibrant colored glass panels, strong backlit glow through translucent glass, color palette: #1a0a5e #8b0000 #006400 #c8a000 #4a0a8b, deep cobalt blue for primary glass panel and sky motif, deep crimson red for sacred accent glass, dark forest green for foliage and nature panel, warm antique gold for divine light and crown detail, deep violet for spiritual depth and shadow, Gothic cathedral window aesthetic, luminous transmitted light quality`,
      tags: ['스테인드글라스','성당','유리공예'] },
    { id: 'craft-ceramic-pottery', category: 'craft', nameKo: '도자기·세라믹', nameEn: 'Ceramic Pottery', emoji: '🏺',
      desc: '흙으로 빚은 도자기의 따뜻한 질감. 물레 자국과 유약의 자연스러운 아름다움.',
      palette: ['#8b5a2b','#c8996a','#e8d4b0','#5a3a1a','#d4a878'],
      prompt: `ceramic pottery close-up photography, hand-thrown wheel pottery with natural clay texture, matte and glossy glaze variations, warm studio lighting on earthy toned vessel, color palette: #8b5a2b #c8996a #e8d4b0 #5a3a1a #d4a878, rich warm brown for unglazed terracotta clay body, warm caramel for ash glaze surface, pale warm tan for natural stoneware highlights, deep dark brown for shadow areas in crevices, soft golden-tan for rim and lip highlights, wabi-sabi imperfect beauty aesthetic, artisan craft photography`,
      tags: ['도자기','세라믹','물레'] },
    { id: 'craft-macrame', category: 'craft', nameKo: '마크라메 매듭 공예', nameEn: 'Macrame Knotwork', emoji: '🪢',
      desc: '실과 로프로 만든 마크라메 매듭 공예. 보헤미안 홈 데코 감성.',
      palette: ['#c8b09a','#e8d4c0','#8b6a50','#f5edd8','#6b4a30'],
      prompt: `macrame knotwork art photography, intricate rope knot pattern wall hanging with fringe detail, natural cotton and jute fiber texture, soft diffused window light, color palette: #c8b09a #e8d4c0 #8b6a50 #f5edd8 #6b4a30, warm medium tan for twisted cotton rope main body, pale warm cream for undyed natural fiber highlights, medium warm brown for jute and darker rope contrast, very pale ivory for background wall tone, dark warm brown for deepest rope shadow and knot density, bohemian home decor lifestyle photography`,
      tags: ['마크라메','매듭','보헤미안'] },
    { id: 'craft-embroidery', category: 'craft', nameKo: '자수·크로스스티치', nameEn: 'Embroidery & Cross-stitch', emoji: '🧵',
      desc: '천 위에 실로 수놓은 자수 공예. 세밀한 스티치 패턴의 아름다움.',
      palette: ['#f5e6d8','#c84b31','#2d6a4f','#c8a000','#6b3a5a'],
      prompt: `embroidery cross-stitch textile art close-up, intricate floral motif stitched on linen fabric, individual thread and stitch texture visible, color palette: #f5e6d8 #c84b31 #2d6a4f #c8a000 #6b3a5a, warm linen cream for base fabric background texture, rich red-orange for primary floral and stem stitch, deep forest green for leaf and vine fill stitch, warm golden yellow for accent blossom center french knots, deep mauve-purple for complementary petal satin stitch, craft and hobby aesthetic, macro photography detail`,
      tags: ['자수','크로스스티치','섬유'] },

    // ── 일러스트·드로잉 추가 ─────────────────────────────────
    { id: 'illust-editorial', category: 'illustration', nameKo: '에디토리얼 일러스트', nameEn: 'Editorial Illustration', emoji: '📰',
      desc: '뉴요커·타임지 스타일의 풍자와 은유가 담긴 에디토리얼 일러스트.',
      palette: ['#f5f0e0','#2c2c2c','#c84b31','#4a7c59','#c8a050'],
      prompt: `editorial illustration style, New Yorker magazine conceptual metaphorical artwork, sophisticated visual commentary, flat simplified figure with expressive gesture, color palette: #f5f0e0 #2c2c2c #c84b31 #4a7c59 #c8a050, warm off-white for editorial magazine page tone, near-black for bold editorial line work and type, muted red for emphasis and visual hierarchy accent, earthy forest green for balance and secondary element, warm ochre gold for editorial warmth and period detail, conceptual thinking visual storytelling`,
      tags: ['에디토리얼','풍자','잡지'] },
    { id: 'illust-charcoal', category: 'illustration', nameKo: '목탄화·차콜', nameEn: 'Charcoal Drawing', emoji: '⬛',
      desc: '목탄으로 스케치한 강렬한 명암 대비의 드로잉. 거친 질감의 예술적 표현.',
      palette: ['#1a1a1a','#4a4a4a','#888888','#c0c0c0','#f0f0f0'],
      prompt: `charcoal drawing artwork, expressive gestural charcoal strokes on textured paper, dramatic tonal contrast from deep black to pale highlight, smudged atmospheric shadows, color palette: #1a1a1a #4a4a4a #888888 #c0c0c0 #f0f0f0, deep black for darkest charcoal marks and shadow core, dark gray for primary shading layer, medium gray for halftone mid-value passage, light silver for lifted highlight and erased light area, near-white for bright highlight and paper tone, fine art drawing aesthetic, atelier study quality`,
      tags: ['목탄화','차콜','드로잉'] },
    { id: 'illust-silkscreen', category: 'illustration', nameKo: '실크스크린 프린트', nameEn: 'Silkscreen Print', emoji: '🎨',
      desc: '거리 포스터와 레코드 커버 감성의 실크스크린 프린팅.',
      palette: ['#0a1a3a','#e63946','#f4a261','#ffffff','#2d6a4f'],
      prompt: `silkscreen print poster artwork, limited color separation screen printing aesthetic, slight registration misalignment between layers, color palette: #0a1a3a #e63946 #f4a261 #ffffff #2d6a4f, deep dark navy for primary ink layer background, vivid red for bold overlapping print layer, warm orange for third color halftone pass, white for paper stock showing through, forest green for final accent layer, gig poster concert flyer aesthetic, ink bleed and overlap visual effect`,
      tags: ['실크스크린','포스터','인쇄'] },
    { id: 'illust-gouache', category: 'illustration', nameKo: '과슈 일러스트', nameEn: 'Gouache Illustration', emoji: '🖌️',
      desc: '불투명 과슈 물감의 선명하고 매트한 일러스트. 북 커버 아트 감성.',
      palette: ['#e8c4a0','#3a7bc8','#e84040','#5a3a8a','#f5f0e8'],
      prompt: `gouache illustration artwork, opaque flat matte paint texture, bold graphic shapes with clean flat color areas, book cover art quality, color palette: #e8c4a0 #3a7bc8 #e84040 #5a3a8a #f5f0e8, warm sandy peach for sun-drenched flat surface and skin tone, vibrant medium blue for sky and water elements, vivid red for bold focal shape and energy accent, rich purple for depth and shadow areas, soft warm ivory for light-filled areas and paper edge, mid-century modern book illustration aesthetic`,
      tags: ['과슈','불투명수채','북아트'] },
    { id: 'illust-vector-portrait', category: 'illustration', nameKo: '벡터 인물 일러스트', nameEn: 'Vector Portrait Illustration', emoji: '👤',
      desc: '단순화된 기하학적 형태로 표현한 인물 벡터 일러스트.',
      palette: ['#f5c5a3','#e8906a','#3d2b1f','#4a7c59','#f5f0e8'],
      prompt: `vector portrait illustration, simplified geometric face with flat color shapes, editorial style character illustration, color palette: #f5c5a3 #e8906a #3d2b1f #4a7c59 #f5f0e8, warm peach for primary skin tone flat fill, deeper warm tan for shadow side of face, near-black dark brown for hair and strongest line work, muted green for clothing or environmental element, warm off-white for background and highlight area, modern editorial character design aesthetic, SVG vector style, Malika Favre inspired simplified form`,
      tags: ['벡터','인물','에디토리얼'] },
    { id: 'illust-botanical', category: 'illustration', nameKo: '보태니컬 일러스트', nameEn: 'Botanical Illustration', emoji: '🌿',
      desc: '19세기 과학 식물화 감성의 정밀한 보태니컬 일러스트.',
      palette: ['#2d5a1e','#6b9a4a','#c8e0a0','#8b4513','#f5f0e0'],
      prompt: `botanical scientific illustration, detailed pencil and watercolor plant study, precise leaf venation and petal structure drawn, color palette: #2d5a1e #6b9a4a #c8e0a0 #8b4513 #f5f0e0, deep forest green for leaf and stem primary fill, medium olive-green for lighter leaf surface, pale sage for translucent young leaf and highlight, warm russet brown for stem bark and dried detail, warm off-white for aged paper plate background, Victorian natural history illustration aesthetic, Royal Botanical Gardens Kew style`,
      tags: ['보태니컬','식물화','과학일러스트'] },

    // ── 모던·그래픽 추가 ─────────────────────────────────────
    { id: 'modern-swiss-international', category: 'modern', nameKo: '스위스 국제 타이포그래피', nameEn: 'Swiss International Typography', emoji: '🇨🇭',
      desc: '헬베티카와 그리드 시스템의 스위스 국제 타이포그래피 스타일.',
      palette: ['#ffffff','#1a1a1a','#e63946','#2196f3','#f5f5f5'],
      prompt: `Swiss International Typographic Style design, Helvetica grid-based layout, precise mathematical proportion and alignment, color palette: #ffffff #1a1a1a #e63946 #2196f3 #f5f5f5, pure white for dominant clean field space, near-black for primary typographic element, vivid red for single accent block and emphasis, bright blue for secondary graphic element and info box, very light gray for subtle background field differentiation, Müller-Brockmann Massimo Vignelli aesthetic, rational grid composition, objective clarity over decoration`,
      tags: ['스위스','타이포그래피','그리드'] },
    { id: 'modern-memphis-design', category: 'modern', nameKo: '멤피스 디자인', nameEn: 'Memphis Design', emoji: '🟦',
      desc: '1980년대 포스트모던 멤피스 디자인 그룹 감성. 유쾌하고 무작위한 패턴.',
      palette: ['#ff3d00','#ffeb3b','#1565c0','#00c853','#e91e63'],
      prompt: `Memphis Design Group 1980s postmodern aesthetic, bold squiggly lines polka dots geometric shapes scattered randomly, bright primary and secondary color contrast, color palette: #ff3d00 #ffeb3b #1565c0 #00c853 #e91e63, vivid red-orange for primary graphic energy and zig-zag lines, bright yellow for cheerful spot color and dot pattern, deep royal blue for bold geometric rectangle, vivid green for organic squiggle and playful accent, hot pink-magenta for pop energy and circle motif, Ettore Sottsass inspired chaotic fun maximalism`,
      tags: ['멤피스','1980년대','포스트모던'] },
    { id: 'modern-brutalist-web', category: 'modern', nameKo: '브루탈리즘 웹 디자인', nameEn: 'Brutalist Web Design', emoji: '🔴',
      desc: '거칠고 날 것의 브루탈리즘 웹 디자인. 규칙을 거부하는 반디자인 미학.',
      palette: ['#ffffff','#000000','#ff0000','#0000ff','#ffff00'],
      prompt: `brutalist web design aesthetic, raw unpolished anti-design layout, bold type at extreme scale with intentional collision, color palette: #ffffff #000000 #ff0000 #0000ff #ffff00, pure white for base page background, solid black for primary text and structural border rule, pure vivid red for alert urgency and clash element, pure saturated blue for link and graphic element, pure yellow for highlighter emphasis and intentional ugliness, misaligned layered elements, broken grid composition, anti-aesthetic rebellion, confrontational digital design`,
      tags: ['브루탈리즘','웹디자인','반디자인'] },
    { id: 'modern-gradient-mesh', category: 'modern', nameKo: '그래디언트 메쉬', nameEn: 'Gradient Mesh Aurora', emoji: '🌈',
      desc: '부드러운 오로라 그래디언트가 흐르는 현대적 배경 디자인.',
      palette: ['#7b2fff','#ff6ed8','#00d4ff','#00ff88','#ffcc00'],
      prompt: `gradient mesh aurora background design, smooth flowing color transitions between vivid hues, soft organic blob shapes overlapping, color palette: #7b2fff #ff6ed8 #00d4ff #00ff88 #ffcc00, deep violet as primary background base gradient, hot pink as secondary warm gradient zone, bright cyan as cool accent gradient region, neon mint green as fresh gradient highlight, bright gold as warm spot accent, Apple iOS Spotify gradient aesthetic, liquid aurora smooth blending, modern brand background design`,
      tags: ['그래디언트','오로라','현대디자인'] },
    { id: 'modern-data-art', category: 'modern', nameKo: '데이터 아트', nameEn: 'Data Art Generative', emoji: '📈',
      desc: '데이터를 예술적으로 시각화한 인포아트. 흐름·패턴·구조의 아름다움.',
      palette: ['#0a0a14','#2196f3','#00bcd4','#4caf50','#ff9800'],
      prompt: `data art generative visualization, elegant flowing data stream visualization, network node graph rendered as fine art, color palette: #0a0a14 #2196f3 #00bcd4 #4caf50 #ff9800, near-black for void data field background, vivid blue for primary data flow stream, bright teal cyan for secondary data current, medium green for stable node and cluster, warm orange for highlighted path and important node, Edward Tufte data visualization philosophy elevated to fine art, generative algorithmic beauty`,
      tags: ['데이터아트','제너러티브','시각화'] },
    { id: 'modern-typographic-poster', category: 'modern', nameKo: '타이포그래픽 포스터', nameEn: 'Typographic Poster', emoji: '📋',
      desc: '문자 그 자체가 비주얼이 되는 타이포그래픽 포스터 아트.',
      palette: ['#1a1a1a','#f5f5f5','#e63946','#c8a050','#2d6a4f'],
      prompt: `typographic poster design, typography as primary visual element with no imagery, bold expressive letterforms at massive scale, color palette: #1a1a1a #f5f5f5 #e63946 #c8a050 #2d6a4f, near-black as primary type and background field, near-white for reverse type and clean contrast, vivid red for single emphasis word and visual break, warm gold for secondary accent type layer, forest green for subtle tertiary text and border detail, Wolfgang Weingart experimental typography aesthetic, kinetic visual energy through letter arrangement`,
      tags: ['타이포그래피','포스터','레터링'] },
    { id: 'modern-halftone-risograph', category: 'modern', nameKo: '리소그래프 프린트', nameEn: 'Risograph Print', emoji: '🖨️',
      desc: '리소 인쇄기의 독특한 망점과 컬러 오버랩 효과. 인디 잡지 감성.',
      palette: ['#ff5a3c','#ffcd3c','#3c7eff','#3cff8f','#ffffff'],
      prompt: `risograph riso print style artwork, two-color limited palette registration overlap effect, grainy halftone dot texture throughout, color palette: #ff5a3c #ffcd3c #3c7eff #3cff8f #ffffff, vivid coral red-orange for first riso ink layer, bright warm yellow for second overlapping ink layer, electric blue for optional third layer variant, neon mint for accent overlap zone, white for paper stock showing through, indie magazine zine aesthetic, slight misregistration between layers, overprint color mixing where inks overlap`,
      tags: ['리소그래프','인디','프린트'] },

    // ── 사진·분위기 추가 ─────────────────────────────────────
    { id: 'photo-double-exposure', category: 'photo', nameKo: '이중 노출', nameEn: 'Double Exposure', emoji: '🔮',
      desc: '두 이미지가 겹쳐진 이중 노출 효과. 인물 실루엣 안에 자연 풍경.',
      palette: ['#1a1a2e','#4a7b9d','#c8e8ff','#8b4513','#f5e6d8'],
      prompt: `double exposure photography, portrait silhouette merged with forest or landscape scene, ethereal blended exposure effect, color palette: #1a1a2e #4a7b9d #c8e8ff #8b4513 #f5e6d8, deep dark navy for strong shadow and base silhouette, muted steel blue for merged midground blending, pale ice blue for sky and highlight overlay, warm russet brown for forest tree detail inside figure, pale skin tone warm for lit facial detail, dreamy surreal fine art photography, silver gelatin print aesthetic`,
      tags: ['이중노출','합성','파인아트'] },
    { id: 'photo-street-bw', category: 'photo', nameKo: '흑백 스트리트 포토', nameEn: 'Black & White Street Photography', emoji: '🎞️',
      desc: 'Cartier-Bresson 감성의 흑백 스트리트 포토그래피. 결정적 순간의 포착.',
      palette: ['#0a0a0a','#3a3a3a','#787878','#c0c0c0','#f5f5f5'],
      prompt: `black and white street photography, Cartier-Bresson decisive moment aesthetic, candid urban scene with dramatic light-shadow contrast, wet pavement reflections gritty texture, color palette: #0a0a0a #3a3a3a #787878 #c0c0c0 #f5f5f5, deep black for shadow areas and dark clothing, dark charcoal for secondary shadow and urban grit, medium gray for mid-tone scene and face, light silver for highlight and chrome detail, near-white for sky and direct light source, Leica rangefinder film grain, humanist documentary tradition, Magnum Photos aesthetic`,
      tags: ['흑백','스트리트포토','다큐멘터리'] },
    { id: 'photo-macro-nature', category: 'photo', nameKo: '매크로 자연 사진', nameEn: 'Macro Nature Photography', emoji: '🔍',
      desc: '꽃잎·곤충·이슬방울을 극초근접 촬영한 매크로 자연 사진.',
      palette: ['#2d6a4f','#95d5b2','#f5e6c8','#ff6b6b','#ffffff'],
      prompt: `extreme close-up macro nature photography, dew droplets on spider web or flower petal, insect compound eye detail at ultra-magnification, color palette: #2d6a4f #95d5b2 #f5e6c8 #ff6b6b #ffffff, deep forest green for background bokeh foliage, soft sage green for out-of-focus leaf element, pale warm cream for petal surface and ambient warmth, vivid soft red for flower stamen or ladybug accent, pure white for perfect spherical dew droplet highlight, 100mm macro lens aesthetic, razor-thin depth of field, crystalline water detail`,
      tags: ['매크로','자연사진','이슬'] },
    { id: 'photo-aerial-drone', category: 'photo', nameKo: '드론 항공 사진', nameEn: 'Aerial Drone Photography', emoji: '🛸',
      desc: '드론으로 촬영한 조감도 항공 사진. 지구의 패턴과 스케일감.',
      palette: ['#87ceeb','#2d6a4f','#c8a46e','#4a7bc8','#f5f0e0'],
      prompt: `aerial drone photography overhead top-down view, geometric patterns in agricultural fields or urban grid, abstract earth texture from high altitude, color palette: #87ceeb #2d6a4f #c8a46e #4a7bc8 #f5f0e0, soft sky blue for shallow water bodies and sky reflection, deep forest green for irrigated crop field and tree canopy, warm sandy tan for arid soil and beach sand, medium blue for river and reservoir surface, pale warm cream for dry land and building rooftop, abstract pattern photography, Planet Labs satellite image aesthetic`,
      tags: ['드론','항공사진','조감도'] },
    { id: 'photo-long-exposure', category: 'photo', nameKo: '장노출 빛 궤적', nameEn: 'Long Exposure Light Trail', emoji: '🌃',
      desc: '장노출 촬영으로 담아낸 자동차 빛 궤적과 별 트레일.',
      palette: ['#030818','#ff6b35','#3a7bd5','#ffffff','#ffd700'],
      prompt: `long exposure photography, light trail streaks from car headlights and taillights at night, star trail circular arc above dark landscape, color palette: #030818 #ff6b35 #3a7bd5 #ffffff #ffd700, near-black deep midnight for ambient night sky, warm coral-orange for red and orange car tail light streaks, bright royal blue for headlight trail and cool light source, pure white for star trail and streetlight bloom, bright gold for sodium vapor lamp and window light, 30-second exposure aesthetic, urban canyon night photography`,
      tags: ['장노출','빛궤적','야경'] },
    { id: 'photo-underwater', category: 'photo', nameKo: '수중 사진', nameEn: 'Underwater Photography', emoji: '🤿',
      desc: '수중 촬영의 아름다운 색상 감쇠와 빛의 굴절. 스쿠버 다이빙 감성.',
      palette: ['#003d5b','#0077b6','#48cae4','#90e0ef','#caf0f8'],
      prompt: `underwater photography, coral reef diver surrounded by tropical fish, sun rays caustic pattern through crystal clear water surface above, color palette: #003d5b #0077b6 #48cae4 #90e0ef #caf0f8, very deep dark teal-blue for deep water volume and shadow, vivid ocean blue for primary water column, bright cerulean for mid-water zone and bubbles, pale azure for sunlit shallow water layer, very pale ice blue for surface light and caustic shimmer, tropical reef photography, SCUBA documentary photography style`,
      tags: ['수중사진','다이빙','산호초'] },
    { id: 'photo-golden-hour', category: 'photo', nameKo: '골든 아워 풍경', nameEn: 'Golden Hour Landscape', emoji: '🌅',
      desc: '일출 직후·일몰 직전의 마법 같은 황금 시간대 풍경.',
      palette: ['#ff6b35','#ffd700','#c04b10','#87ceeb','#1a2744'],
      prompt: `golden hour landscape photography, sun low on horizon casting dramatic long warm shadows, silhouetted trees against glowing amber sky, god rays through clouds, color palette: #ff6b35 #ffd700 #c04b10 #87ceeb #1a2744, vivid coral-orange for warm low-angle direct sunlight, bright golden yellow for sky glow at horizon, deep burnt sienna for shadow side of landscape, soft pale blue for upper sky gradient fading to cool, deep dark navy for land silhouette against bright sky, magic hour photography, landscape photographer dream lighting`,
      tags: ['골든아워','황금빛','풍경'] },

    // --- BIO / MEDICAL (11 concepts) ---
    {
      id: 'bio-nano-microscopic',
      category: 'bio',
      nameKo: '나노 현미경 그래픽',
      nameEn: 'Nano-Microscopic Graphic',
      emoji: '🔬',
      desc: '나노 입자와 세포 조직의 전자 현미경 뷰를 시각화한 미시적이고 첨단적인 스타일.',
      palette: ['#0A192F', '#00B4D8', '#90E0EF', '#0077B6', '#FFFFFF'],
      prompt: 'A highly detailed scientific visualization of nanoscale cellular structures and molecular bonds under an advanced electron microscope. Glowing spherical nanoparticles interacting with biological cells, volumetric lighting, deep depth of field, ultra-detailed textures, color palette: #0A192F #00B4D8 #90E0EF #0077B6 #FFFFFF.',
      tags: ['Microscopic', 'Nanotech', 'Cellular']
    },
    {
      id: 'bio-organic-cyber',
      category: 'bio',
      nameKo: '유기적 사이버네틱스',
      nameEn: 'Organic Cybernetics',
      emoji: '🦾',
      desc: '인체 조직과 인공 기계 부품이 결합된 하이브리드 바이오 사이버 스타일.',
      palette: ['#1A1A1A', '#00FF66', '#333333', '#00CCFF', '#ECEFF1'],
      prompt: 'A futuristic cybernetic limb blending smooth organic human skin with sleek mechanical carbon fiber plating and glowing green fiber-optic wires. Close-up studio photography, sharp focus, clean metallic surfaces, color palette: #1A1A1A #00FF66 #333333 #00CCFF #ECEFF1.',
      tags: ['Cybernetic', 'Prosthetic', 'Hybrid']
    },
    {
      id: 'bio-botanical-watercolor',
      category: 'bio',
      nameKo: '바이오 보태니컬 수채화',
      nameEn: 'Botanical Med-Watercolor',
      emoji: '🌿',
      desc: '전통 약용 식물 연구와 의학 삽화가 결합된 아날로그적이고 부드러운 수채화 스타일.',
      palette: ['#F7F5F0', '#3D6246', '#87A987', '#C2A383', '#4A3B32'],
      prompt: 'Elegant watercolor and ink medical illustration of a medicinal herb showing detailed root systems, leaves, and molecular chemical structures. Vintage textured paper background, soft natural lighting, scientific annotations in thin handwriting, color palette: #F7F5F0 #3D6246 #87A987 #C2A383 #4A3B32.',
      tags: ['Botanical', 'Watercolor', 'MedicalIllustration']
    },
    {
      id: 'bio-dna-neon-glow',
      category: 'bio',
      nameKo: '네온 DNA 나선',
      nameEn: 'Neon DNA Helix',
      emoji: '🧬',
      desc: '어두운 배경 속에서 찬란하게 빛나는 유전자 나선 구조를 형상화한 네온 일러스트.',
      palette: ['#03001E', '#7303C0', '#EC38BC', '#FDEFF9', '#03A9F4'],
      prompt: 'A glowing double helix DNA strand twisting vertically through a dark, abstract digital space. Luminous particles and sparkling dust floating around the genetic structure, vibrant magenta and cyan light reflections, 3D render, color palette: #03001E #7303C0 #EC38BC #FDEFF9 #03A9F4.',
      tags: ['DNA', 'Glow', 'Genetics']
    },
    {
      id: 'bio-futuristic-clinic',
      category: 'bio',
      nameKo: '미래형 스마트 클리닉',
      nameEn: 'Futuristic Smart Clinic',
      emoji: '🏥',
      desc: '깨끗하고 투명한 유리, 부드러운 유선형 라인, 홀로그램 인터페이스로 구성된 미래 병원 인테리어.',
      palette: ['#F0F4F8', '#102A43', '#486581', '#627D98', '#00D2FC'],
      prompt: 'An ultra-modern medical research lab and clinic interior, featuring smooth white curved walls, transparent holographic medical display interfaces floating in mid-air, soft ambient lighting, clean sterile aesthetic, color palette: #F0F4F8 #102A43 #486581 #627D98 #00D2FC.',
      tags: ['Clinic', 'Hologram', 'Futuristic']
    },
    {
      id: 'bio-petri-dish-art',
      category: 'bio',
      nameKo: '페트리 접시 유기적 아트',
      nameEn: 'Petri Dish Organic Art',
      emoji: '🧫',
      desc: '실험실 배양 접시 안의 박테리아나 유기체가 화려하고 대칭적인 패턴을 이룬 시각적 스타일.',
      palette: ['#0B0C10', '#1F2833', '#C5C6C7', '#66FCF1', '#45A29E'],
      prompt: 'A beautiful top-down macro photograph of colorful bioluminescent bacterial cultures and crystalline micro-organisms growing in a circular petri dish. Glowing neon fluid patterns, abstract biological formations, dark scientific background, color palette: #0B0C10 #1F2833 #C5C6C7 #66FCF1 #45A29E.',
      tags: ['Microbiology', 'Bioluminescence', 'Culture']
    },
    {
      id: 'bio-pharmaceutical-glass',
      category: 'bio',
      nameKo: '클린 제약 글래스',
      nameEn: 'Clean Pharmaceutical Glass',
      emoji: '💊',
      desc: '제약 연구의 무균 환경과 유리 앰플, 알약, 투명 용기를 묘사한 깨끗하고 신뢰성 높은 스타일.',
      palette: ['#E0F2F1', '#26A69A', '#00695C', '#80CBC4', '#FFFFFF'],
      prompt: 'A pristine laboratory setup featuring transparent glass ampoules and liquid vials on a polished white surface. Bright clean studio lighting, soft turquoise and teal reflections, sharp depth of field, sterile medical design, color palette: #E0F2F1 #26A69A #00695C #80CBC4 #FFFFFF.',
      tags: ['Pharma', 'Glassware', 'Laboratory']
    },
    {
      id: 'bio-neuro-network',
      category: 'bio',
      nameKo: '신경망 시냅스 광원',
      nameEn: 'Neuro Synapse Network',
      emoji: '🧠',
      desc: '뇌 신경세포와 시냅스 사이에서 발생하는 전기 신호의 흐름을 표현한 추상 그래픽.',
      palette: ['#050515', '#3A0CA3', '#7209B7', '#F72585', '#4CC9F0'],
      prompt: 'An abstract visualization of human neural pathways. Glowing neuron cells sending electric pulses along synapses, intricate web of glowing fiber structures, deep space dark background, vibrant cybernetic violet and pink lights, color palette: #050515 #3A0CA3 #7209B7 #F72585 #4CC9F0.',
      tags: ['Neural', 'Synapse', 'Brain']
    },
    {
      id: 'bio-immunology-shield',
      category: 'bio',
      nameKo: '면역 방어 일러스트',
      nameEn: 'Immunology Shield Illustration',
      emoji: '🛡️',
      desc: '항체와 면역 세포가 바이러스의 침입을 방어하는 다이내믹한 3D 시각 예술.',
      palette: ['#0D1B2A', '#1B263B', '#415A77', '#778DA9', '#E0E1DD'],
      prompt: 'A conceptual 3D render showing Y-shaped antibody structures binding to a textured virus cell, forming a protective glowing barrier. High contrast, cinematic biological lighting, scientific precision, color palette: #0D1B2A #1B263B #415A77 #778DA9 #E0E1DD.',
      tags: ['Immunology', 'Antibody', 'Virus']
    },
    {
      id: 'bio-eco-genetic-fusion',
      category: 'bio',
      nameKo: '친환경 유전공학 융합',
      nameEn: 'Eco-Genetic Biofusion',
      emoji: '🌱',
      desc: '식물의 엽록체 구조와 유전 공학 장비가 융합된 자연 친화적 바이오 테크 스타일.',
      palette: ['#1E352F', '#3F6C51', '#A1C181', '#FCCA46', '#FE7F2D'],
      prompt: 'A plant leaf cell integrated with micro-electronic biochips, displaying glowing biological circuits under natural sunlight. Lush green veins, semi-transparent leaf structure showing cellular organelles, scientific fusion, color palette: #1E352F #3F6C51 #A1C181 #FCCA46 #FE7F2D.',
      tags: ['Biofusion', 'PlantCell', 'GreenTech']
    },
    {
      id: 'bio-dna-origami',
      category: 'bio',
      nameKo: 'DNA 오리가미 나노소자',
      nameEn: 'DNA Origami Nanodevice',
      emoji: '🧬',
      desc: 'DNA 분자를 접어 정밀한 나노 크기의 기하학적 구조물이나 약물 전달체를 설계하는 최첨단 그래픽.',
      palette: ['#0C0F12', '#2F3C4F', '#5D6D7E', '#A9DFBF', '#FADBD8'],
      prompt: 'A 3D simulation of a DNA origami box container designed for targeted drug delivery. Double strands of genetic material folded into a geometric cube, surrounded by fluid cellular medium and active protein molecules, color palette: #0C0F12 #2F3C4F #5D6D7E #A9DFBF #FADBD8.',
      tags: ['DNAOrigami', 'Nanodevice', 'DrugDelivery']
    },
    
    // --- ENERGY / ECO (11 concepts) ---
    {
      id: 'energy-solar-parametric',
      category: 'energy',
      nameKo: '태양광 파라메트릭 그리드',
      nameEn: 'Solar Parametric Grid',
      emoji: '☀️',
      desc: '수많은 태양광 패널이 기하학적 파형을 그리며 태양 빛을 흡수하는 기하학적 건축 스타일.',
      palette: ['#0F2027', '#203A43', '#2C5364', '#FFB703', '#FB8500'],
      prompt: 'A vast parametric landscape of futuristic solar panels arranged in rolling geometric wave patterns. Golden hour sunlight reflecting off the dark blue photovoltaic cells, architectural clean lines, aerial perspective, color palette: #0F2027 #203A43 #2C5364 #FFB703 #FB8500.',
      tags: ['Solar', 'Parametric', 'Photovoltaic']
    },
    {
      id: 'energy-wind-aeolian',
      category: 'energy',
      nameKo: '바람의 궤적과 풍력 발전',
      nameEn: 'Aeolian Wind Streamline',
      emoji: '🌀',
      desc: '풍력 발전기 주위로 공기 역학적 바람의 흐름이 빛의 선으로 표현된 모션 스타일.',
      palette: ['#1D2A44', '#3E5C76', '#748CAB', '#F0E6D2', '#00F2FE'],
      prompt: 'Sleek modern wind turbines standing tall on a grassy coastline, with glowing turquoise aerodynamic wind streamlines wrapping around the rotating blades. Dramatic evening sky, high contrast, clean technical energy flow, color palette: #1D2A44 #3E5C76 #748CAB #F0E6D2 #00F2FE.',
      tags: ['WindTurbine', 'Aerodynamics', 'CleanEnergy']
    },
    {
      id: 'energy-hydrogen-clean',
      category: 'energy',
      nameKo: '무공해 수소 에너지',
      nameEn: 'Clean Hydrogen Energy',
      emoji: '💧',
      desc: '수소 분자와 청정 수력 에너지를 시각화한 투명하고 푸른 물방울과 가스의 시각적 느낌.',
      palette: ['#E0F7FA', '#80DEEA', '#26C6DA', '#00ACC1', '#006064'],
      prompt: 'An abstract depiction of hydrogen energy molecules emerging from pure water. Transparent glowing blue spheres, clean bubbles rising through a liquid medium, bright futuristic clean technology aesthetic, color palette: #E0F7FA #80DEEA #26C6DA #00ACC1 #006064.',
      tags: ['Hydrogen', 'H2', 'EcoClean']
    },
    {
      id: 'energy-smart-grid-neon',
      category: 'energy',
      nameKo: '스마트 에너지 그리드',
      nameEn: 'Smart Energy Grid',
      emoji: '⚡',
      desc: '도시 전체를 연결하는 효율적인 스마트 송전망과 전력 흐름을 네온 빛으로 그린 그래픽.',
      palette: ['#0A0E17', '#1F4068', '#162447', '#E43F5A', '#00FFCC'],
      prompt: 'A stylized 3D digital city model overlayed with a neon-glowing electric smart grid. Bright neon cyan and pink power lines connecting buildings, showing efficient distribution of electricity, isometric view, dark tech background, color palette: #0A0E17 #1F4068 #162447 #E43F5A #00FFCC.',
      tags: ['SmartGrid', 'Electricity', 'Network']
    },
    {
      id: 'energy-geothermal-magma',
      category: 'energy',
      nameKo: '지열 에너지 레이어',
      nameEn: 'Geothermal Strata Layer',
      emoji: '🌋',
      desc: '지하 깊은 곳의 마그마 열원과 암석 지층을 통과하여 상승하는 지열 에너지를 도식화한 스타일.',
      palette: ['#1C0A00', '#361500', '#602000', '#B23B00', '#FF7F00'],
      prompt: 'A cross-section diagram of the earth showing geothermal energy extraction. Earthy rock strata layers leading to a deep glowing orange magma heat source, steam vapor rising through modern extraction pipes, technical diagram look, color palette: #1C0A00 #361500 #602000 #B23B00 #FF7F00.',
      tags: ['Geothermal', 'EarthStrata', 'Thermal']
    },
    {
      id: 'energy-battery-lithium',
      category: 'energy',
      nameKo: '리튬 이온 배터리 셀',
      nameEn: 'Lithium Battery Cell',
      emoji: '🔋',
      desc: '전기차 및 에너지 저장소(ESS)의 배터리 내부 구조와 이온 이동을 표현한 정밀한 그래픽.',
      palette: ['#0D1F10', '#1E4620', '#3B8B46', '#8AE9A8', '#EFFFF3'],
      prompt: 'A detailed 3D rendering of the inner structure of a lithium-ion battery. Multiple cylindrical or prismatic cells aligned, showing glowing green electrical ions moving between cathode and anode layers, technical engineering cutaway, color palette: #0D1F10 #1E4620 #3B8B46 #8AE9A8 #EFFFF3.',
      tags: ['Battery', 'ESS', 'LithiumIon']
    },
    {
      id: 'energy-nuclear-fusion',
      category: 'energy',
      nameKo: '인공태양 핵융합',
      nameEn: 'Nuclear Fusion Tokamak',
      emoji: '⚛️',
      desc: '토카막 내부에서 초고온 플라즈마가 강력한 자기장에 의해 회전하는 에너제틱한 비주얼.',
      palette: ['#080F1D', '#1D2D50', '#133B5C', '#FCDAB7', '#FF5722'],
      prompt: 'Inside a nuclear fusion reactor tokamak, a swirling ring of ultra-hot glowing plasma held by strong magnetic forces. High-energy light emissions, futuristic nuclear research facility interior, intricate machinery surrounding the chamber, color palette: #080F1D #1D2D50 #133B5C #FCDAB7 #FF5722.',
      tags: ['Fusion', 'Tokamak', 'Plasma']
    },
    {
      id: 'energy-biomass-circular',
      category: 'energy',
      nameKo: '바이오매스 자원 순환',
      nameEn: 'Biomass Circular Cycle',
      emoji: '🍂',
      desc: '유기물 쓰레기와 임업 부산물이 친환경 바이오 연료로 재탄생하는 자원 순환의 흐름.',
      palette: ['#2F3E46', '#354F52', '#52796F', '#84A98C', '#CAD2C5'],
      prompt: 'A circular flow chart illustration of biomass energy. Decaying forest organic leaves and wood waste converting into clean bio-gas and ethanol in modern eco-reactors, organic textures, infographic elements, color palette: #2F3E46 #354F52 #52796F #84A98C #CAD2C5.',
      tags: ['Biomass', 'Biofuel', 'CircularEco']
    },
    {
      id: 'energy-tidal-marine',
      category: 'energy',
      nameKo: '조력 해양 에너지',
      nameEn: 'Tidal Marine Energy',
      emoji: '🌊',
      desc: '바다 밑 조류 발전기와 파도의 강인한 에너지를 푸른 물결과 은빛 기계로 연출한 스타일.',
      palette: ['#001D3D', '#003566', '#000814', '#FFC300', '#3D85C6'],
      prompt: 'Submerged underwater tidal turbines rotating beneath powerful deep ocean currents. Rays of sunlight penetrating the dark blue water column, bubbles and dynamic marine flow around the propellers, industrial maritime look, color palette: #001D3D #003566 #000814 #FFC300 #3D85C6.',
      tags: ['Tidal', 'OceanCurrent', 'Hydropower']
    },
    {
      id: 'energy-eco-city-green',
      category: 'energy',
      nameKo: '넷제로 스마트 에코시티',
      nameEn: 'Net-Zero Smart Eco-City',
      emoji: '🏙️',
      desc: '지붕 위 태양광 패널, 옥상 정원, 미래형 교통수단이 조화를 이루는 무탄소 도시 비전.',
      palette: ['#E8F5E9', '#A5D6A7', '#66BB6A', '#2E7D32', '#1B5E20'],
      prompt: 'An architectural rendering of a net-zero emission smart city in the future. High-rise buildings covered in lush vertical forests and solar panel glass, wind turbines integrated on rooftops, green parks and clean electric tramways, color palette: #E8F5E9 #A5D6A7 #66BB6A #2E7D32 #1B5E20.',
      tags: ['NetZero', 'EcoCity', 'SmartUrban']
    },
    {
      id: 'energy-piezoelectric-vibration',
      category: 'energy',
      nameKo: '압전 소자 진동 에너지',
      nameEn: 'Piezoelectric Vibration Harvesting',
      emoji: '👟',
      desc: '진동이나 압력을 받을 때 전류가 흐르는 압전 효과와 마이크로 발전 소자의 활성화.',
      palette: ['#0A0F1D', '#1D2A44', '#855CF8', '#00FF88', '#FFFFFF'],
      prompt: 'A conceptual visualization of piezoelectric crystal generators harvesting energy from pressure and vibration. Glowing micro-crystals compressing and emitting intense green and violet electricity paths, high-tech dark background, color palette: #0A0F1D #1D2A44 #855CF8 #00FF88 #FFFFFF.',
      tags: ['Piezoelectric', 'EnergyHarvesting', 'Vibration']
    },

    // --- SOFTWARE / IT (11 concepts) ---
    {
      id: 'software-glass-ui',
      category: 'software',
      nameKo: '유리 질감 글래스모피즘 UI',
      nameEn: 'Glassmorphism UI Concept',
      emoji: '💻',
      desc: '반투명한 유리를 겹쳐 놓은 듯한 프로스트 유리 효과와 세련된 네온 빛 레이아웃.',
      palette: ['#0F0C1B', '#1B1736', '#2F2663', '#00F0FF', '#FF007F'],
      prompt: 'A high-fidelity dashboard user interface design presenting graphs and charts using frosted semi-transparent glass panes (glassmorphism). Vibrant glowing neon pink and cyan gradients illuminating the background, clean typography, color palette: #0F0C1B #1B1736 #2F2663 #00F0FF #FF007F.',
      tags: ['Glassmorphism', 'Dashboard', 'UIUX']
    },
    {
      id: 'software-cyber-code',
      category: 'software',
      nameKo: '사이버 펑크 소스 코드',
      nameEn: 'Cyberpunk Source Code',
      emoji: '👾',
      desc: '어두운 터미널 화면 속 형광색 코드 텍스트와 3차원 데이터 노드가 얽혀 있는 스타일.',
      palette: ['#0A0A0E', '#0D1B2A', '#00FF66', '#00E8FF', '#9E00FF'],
      prompt: 'A close-up of a programmer\'s monitor displaying futuristic matrix-like source code in neon green and electric purple. Cyberpunk hacker terminal aesthetic, rows of syntax-highlighted commands, abstract digital artifacts, color palette: #0A0A0E #0D1B2A #00FF66 #00E8FF #9E00FF.',
      tags: ['Cyberpunk', 'SourceCode', 'Terminal']
    },
    {
      id: 'software-abstract-data',
      category: 'software',
      nameKo: '추상화 데이터 클라우드',
      nameEn: 'Abstract Data Cloud',
      emoji: '☁️',
      desc: '클라우드 컴퓨팅과 빅데이터를 수많은 데이터 포인트와 투명한 구름 형태로 시각화.',
      palette: ['#F3F4F6', '#E5E7EB', '#3B82F6', '#1E3A8A', '#60A5FA'],
      prompt: 'An abstract visualization of a cloud data storage network. Thousands of glowing light particles forming a volumetric cloud shape, with illuminated digital nodes and information pathways connecting together, clean white and blue tones, color palette: #F3F4F6 #E5E7EB #3B82F6 #1E3A8A #60A5FA.',
      tags: ['CloudComputing', 'BigData', 'Particles']
    },
    {
      id: 'software-devops-infinity',
      category: 'software',
      nameKo: '데브옵스 무한 루프',
      nameEn: 'DevOps Infinity Loop',
      emoji: '♾️',
      desc: '빌드, 테스트, 배포가 끝없이 반복되는 DevOps 파이프라인의 무한 기호를 테크니컬하게 연출.',
      palette: ['#1A1A2E', '#16213E', '#0F3460', '#E94560', '#00B4D8'],
      prompt: 'A glowing 3D infinity symbol representing the continuous DevOps pipeline. The ribbon features glowing icons for code, build, test, deploy, and monitor, electric blue and hot magenta neon light trails flowing along the loop, dark background, color palette: #1A1A2E #16213E #0F3460 #E94560 #00B4D8.',
      tags: ['DevOps', 'InfinityLoop', 'Pipeline']
    },
    {
      id: 'software-ai-brain-neural',
      category: 'software',
      nameKo: '인공지능 가상 두뇌',
      nameEn: 'AI Virtual Brain',
      emoji: '🤖',
      desc: '인간의 뇌 형상에 정밀한 마이크로 회로와 빛나는 시냅스가 결합된 딥러닝 AI 비주얼.',
      palette: ['#0B0E14', '#1F2937', '#6366F1', '#8B5CF6', '#EC4899'],
      prompt: 'A highly complex artificial intelligence brain structure floating in a dark digital space. Created from glowing light nodes, microchips, and neon fiber-optic neural pathways in violet, pink, and blue, color palette: #0B0E14 #1F2937 #6366F1 #8B5CF6 #EC4899.',
      tags: ['AIBrain', 'DeepLearning', 'NeuralNetwork']
    },
    {
      id: 'software-cybersecurity-shield',
      category: 'software',
      nameKo: '사이버 보안 디지털 방패',
      nameEn: 'Cybersecurity Digital Shield',
      emoji: '🔒',
      desc: '해킹 침입을 막아내는 철벽 수비의 디지털 잠금장치와 홀로그램 실드 비주얼.',
      palette: ['#03071E', '#370617', '#6A040F', '#D00000', '#FFBA08'],
      prompt: 'A glowing cybersecurity lock and shield symbol overlayed on a matrix of digital binary code. Crimson red and golden orange lights signaling a secure firewall block against external network threat, high-tech secure vault look, color palette: #03071E #370617 #6A040F #D00000 #FFBA08.',
      tags: ['Security', 'Firewall', 'Lock']
    },
    {
      id: 'software-agile-kanban',
      category: 'software',
      nameKo: '애자일 칸반 플래닝',
      nameEn: 'Agile Kanban Planning',
      emoji: '📋',
      desc: '포스트잇과 업무 티켓이 유기적으로 흐르며 스프린트 목표를 달성하는 애자일 워크플로.',
      palette: ['#FCF8F2', '#3D5A80', '#98C1D9', '#E0FBFC', '#EE6C4D'],
      prompt: 'A stylized creative representation of an Agile Kanban board. Colorful virtual sticky notes representing tasks moving through columns ("To Do", "In Progress", "Done") with glowing connecting lines, minimalist professional design, color palette: #FCF8F2 #3D5A80 #98C1D9 #E0FBFC #EE6C4D.',
      tags: ['Agile', 'Kanban', 'Workflow']
    },
    {
      id: 'software-quantum-computing',
      category: 'software',
      nameKo: '양자 컴퓨팅 큐비트',
      nameEn: 'Quantum Computing Qubit',
      emoji: '⚛️',
      desc: '초전도 큐비트의 중첩과 얽힘 상태를 형이상학적이고 아름다운 파동으로 구현.',
      palette: ['#0D0B1A', '#221A3B', '#48358B', '#00FFE0', '#FF00DE'],
      prompt: 'An abstract visualization of quantum computing qubits in superposition. Multiple overlapping concentric waves of energy vibrating and spinning in cyan and magenta neon hues, high-tech subatomic physics aesthetic, color palette: #0D0B1A #221A3B #48358B #00FFE0 #FF00DE.',
      tags: ['Quantum', 'Qubit', 'Physics']
    },
    {
      id: 'software-api-integration',
      category: 'software',
      nameKo: 'API 마이크로서비스 연동',
      nameEn: 'API Microservice Integration',
      emoji: '🔌',
      desc: '독립된 시스템들이 플러그와 광섬유 케이블처럼 긴밀하게 연결되는 API 연동 인터페이스.',
      palette: ['#1F2022', '#2B2D31', '#313338', '#00FFA3', '#00A3FF'],
      prompt: 'A highly structured diagram showing data exchanging between API endpoints. Illustrated as glowing modular blocks with bright green and blue ethernet cables plugging in, glowing data packets flying between sockets, dark minimal tech background, color palette: #1F2022 #2B2D31 #313338 #00FFA3 #00A3FF.',
      tags: ['API', 'Microservices', 'DataExchange']
    },
    {
      id: 'software-database-cube',
      category: 'software',
      nameKo: '3D 블록체인 데이터베이스',
      nameEn: '3D Blockchain Database',
      emoji: '🗄️',
      desc: '서로 단단하게 체인으로 묶여 데이터를 보관하는 3D 큐브 형태의 분산 원장 데이터베이스.',
      palette: ['#1B1B1E', '#373F51', '#58A4B0', '#A9BCD0', '#D8DBE2'],
      prompt: 'A grid of semi-transparent holographic 3D storage blocks linked together by glowing steel chains in a vast digital server room. Cool gray and soft cyan metallic reflections, technical enterprise storage vibe, color palette: #1B1B1E #373F51 #58A4B0 #A9BCD0 #D8DBE2.',
      tags: ['Blockchain', 'Database', 'Datacenter']
    },
    {
      id: 'software-server-rack-airflow',
      category: 'software',
      nameKo: '서버룸 기류 제어 열역학',
      nameEn: 'Server Room Airflow Cooling',
      emoji: '💨',
      desc: '서버 랙 사이로 차가운 공기와 더운 공기가 순환하며 열을 식히는 흐름 시각화.',
      palette: ['#1A1D20', '#343A40', '#007BFF', '#DC3545', '#E9ECEF'],
      prompt: 'A detailed 3D architectural render of a data center server aisle. Showing cold air flow lines colored in neon blue entering the server racks and warm exhaust air in red exiting the back, high efficiency cooling simulation, color palette: #1A1D20 #343A40 #007BFF #DC3545 #E9ECEF.',
      tags: ['DataCenter', 'CoolingSystem', 'ServerRack']
    },

    // --- HEAVY INDUSTRIES (11 concepts) ---
    {
      id: 'heavy-steel-foundry',
      category: 'heavy',
      nameKo: '제철소 용광로 열기',
      nameEn: 'Steel Foundry Melt',
      emoji: '🏭',
      desc: '붉게 달아오른 쇳물이 뿜어내는 뜨거운 열기와 거대한 제철소 기계 프레임의 조합.',
      palette: ['#100B09', '#2E1E1A', '#7A2214', '#D946EF', '#F97316'],
      prompt: 'Molten steel pouring from a massive industrial furnace in a foundry. Shower of glowing sparks flying, dark cast iron girders and structures in the background, high dynamic range, intense heat haze, color palette: #100B09 #2E1E1A #7A2214 #D946EF #F97316.',
      tags: ['SteelFoundry', 'Furnace', 'Metalworking']
    },
    {
      id: 'heavy-shipbuilding-dock',
      category: 'heavy',
      nameKo: '거대 선박 건조 도크',
      nameEn: 'Shipbuilding Megadock',
      emoji: '🚢',
      desc: '드넓은 조선소 도크에서 골리앗 크레인 아래 웅장하게 서 있는 초대형 상선과 불꽃.',
      palette: ['#2B2E33', '#4E5A65', '#8C9A9E', '#E07A5F', '#3D405B'],
      prompt: 'A massive container ship under construction inside a dry dock. Giant orange gantry crane towering above, workers welding steel plates creating showers of bright sparks, cloudy sky, industrial shipyard, color palette: #2B2E33 #4E5A65 #8C9A9E #E07A5F #3D405B.',
      tags: ['Shipbuilding', 'GantryCrane', 'Dockyard']
    },
    {
      id: 'heavy-auto-robotics',
      category: 'heavy',
      nameKo: '로봇 자동화 생산 라인',
      nameEn: 'Automated Robotics Assembly',
      emoji: '🤖',
      desc: '자동차 차체를 용접하고 조립하는 스마트 공장의 고속 정밀 로봇 팔들의 움직임.',
      palette: ['#1E1E24', '#3E5C76', '#748CAB', '#F0E6D2', '#D90429'],
      prompt: 'A futuristic automobile assembly line with robotic arms welding a car chassis. Sparks flying in slow motion, bright overhead studio lights reflecting off steel panels, automated industrial engineering, color palette: #1E1E24 #3E5C76 #748CAB #F0E6D2 #D90429.',
      tags: ['Automation', 'RoboticArm', 'AssemblyLine']
    },
    {
      id: 'heavy-aerospace-turbine',
      category: 'heavy',
      nameKo: '항공 우주 엔진 터빈',
      nameEn: 'Aerospace Jet Turbine',
      emoji: '✈️',
      desc: '정밀하게 설계된 항공기 제트 엔진의 티타늄 블레이드 단면과 추진 가스 분사.',
      palette: ['#1B263B', '#415A77', '#778DA9', '#E0E1DD', '#E5BA73'],
      prompt: 'A close-up cross section of a massive aircraft jet turbine engine showing titanium fan blades. Intricate engineering design, soft warm lighting from combustion chamber glowing within, clean metal surfaces, color palette: #1B263B #415A77 #778DA9 #E0E1DD #E5BA73.',
      tags: ['Aerospace', 'Turbine', 'JetEngine']
    },
    {
      id: 'heavy-construction-crane',
      category: 'heavy',
      nameKo: '초고층 건설 현장 프레임',
      nameEn: 'Megastructure Crane Framework',
      emoji: '🏗️',
      desc: '붉은 노을을 배경으로 타워 크레인과 빌딩의 철골 구조가 겹치는 선의 미학.',
      palette: ['#1E2022', '#F0A500', '#334443', '#CF7500', '#F4F4F4'],
      prompt: 'Towering construction cranes silhouetted against a dramatic fiery sunset orange sky. Steel skeleton frame of a rising skyscraper, high-contrast industrial silhouette, color palette: #1E2022 #F0A500 #334443 #CF7500 #F4F4F4.',
      tags: ['Construction', 'TowerCrane', 'Skyscraper']
    },
    {
      id: 'heavy-mining-excavator',
      category: 'heavy',
      nameKo: '초대형 노천 광산 굴착기',
      nameEn: 'Megamining Excavator',
      emoji: '🚜',
      desc: '지구를 움직이는 듯한 거대한 버킷 휠 굴착기와 광산 지층의 묵직한 질감.',
      palette: ['#2F1B0C', '#4F3824', '#7D5A44', '#BCA08E', '#FFB703'],
      prompt: 'A gargantuan bucket-wheel excavator operating in a deep terraced open-pit mine. Thick dust rising, weathered yellow heavy machinery contrast with red-brown earth layers under a hazy sky, color palette: #2F1B0C #4F3824 #7D5A44 #BCA08E #FFB703.',
      tags: ['Mining', 'Excavator', 'HeavyMachinery']
    },
    {
      id: 'heavy-petrochemical-pipe',
      category: 'heavy',
      nameKo: '석유화학 단지 금속 파이프',
      nameEn: 'Petrochemical Pipe Complex',
      emoji: '🧪',
      desc: '복잡하게 얽힌 은빛 스틸 파이프라인과 밸브, 웅장한 정유 타워의 야경.',
      palette: ['#0A1128', '#001F54', '#1C3144', '#A0AAB2', '#D00000'],
      prompt: 'A dense network of polished steel chemical pipelines and distillation towers in a petrochemical refinery at night. Colorful industrial safety lights illuminating the steam and metal structures, color palette: #0A1128 #001F54 #1C3144 #A0AAB2 #D00000.',
      tags: ['Petrochemical', 'Refinery', 'IndustrialPipes']
    },
    {
      id: 'heavy-precision-cnc',
      category: 'heavy',
      nameKo: '고정밀 CNC 금속 가공',
      nameEn: 'Precision CNC Metal Machining',
      emoji: '⚙️',
      desc: '금속 블록을 조각하듯 깎아내는 CNC 밀링 헤드와 차가운 절삭유 분사.',
      palette: ['#25282A', '#4E5357', '#8A9196', '#CCCCCC', '#00A8FF'],
      prompt: 'A close-up photo of a CNC milling machine cutter carving a block of solid aluminum. Sparks and glowing blue cutting fluid spraying, sharp metallic details, high-speed movement blur, color palette: #25282A #4E5357 #8A9196 #CCCCCC #00A8FF.',
      tags: ['CNC', 'MetalMachining', 'Precision']
    },
    {
      id: 'heavy-railway-locomotive',
      category: 'heavy',
      nameKo: '차세대 초고속 열차 제조',
      nameEn: 'High-Speed Railway Production',
      emoji: '🚊',
      desc: '매끈한 유선형의 차세대 고속철 차체와 철도 차량 기지의 정돈된 기하학.',
      palette: ['#1C1D21', '#3F4249', '#787E8B', '#CCD3DE', '#0047AB'],
      prompt: 'The aerodynamic nose of a sleek high-speed bullet train being assembled in a modern railway factory depot. Clean floor reflections, cool industrial blue lighting, precision manufacturing setup, color palette: #1C1D21 #3F4249 #787E8B #CCD3DE #0047AB.',
      tags: ['Railway', 'BulletTrain', 'Manufacturing']
    },
    {
      id: 'heavy-wind-blade-molding',
      category: 'heavy',
      nameKo: '초대형 풍력 블레이드 성형',
      nameEn: 'Gigantic Wind Blade Molding',
      emoji: '🍃',
      desc: '길이 80m가 넘는 거대한 풍력 발전 블레이드를 탄소섬유로 압착/성형하는 웅장한 작업.',
      palette: ['#1A1C1E', '#33373B', '#5A6065', '#959DA5', '#EAEFF2'],
      prompt: 'A massive factory bay where a giant 80-meter composite fiberglass wind turbine blade is lying in its manufacturing mold. Workers in white cleanroom suits laminating the surface under bright fluorescent lights, perspective shot, color palette: #1A1C1E #33373B #5A6065 #959DA5 #EAEFF2.',
      tags: ['WindBlade', 'Composite', 'Megastructure']
    },
    {
      id: 'heavy-industrial-welding-laser',
      category: 'heavy',
      nameKo: '초정밀 레이저 용접',
      nameEn: 'Ultra-Precision Laser Welding',
      emoji: '⚡',
      desc: '강철 플레이트를 극한의 정밀함으로 접합하는 레이저 빔과 플라즈마 불꽃 반응.',
      palette: ['#0D0D0F', '#1F1F2E', '#3D3D5C', '#FFD700', '#FF3300'],
      prompt: 'A micro-photography of a high-power industrial laser welding head fusing two sheets of dark steel. Intense focal point of blinding blue-white light, radiating golden sparks and molten metal droplets, color palette: #0D0D0F #1F1F2E #3D3D5C #FFD700 #FF3300.',
      tags: ['LaserWelding', 'MetalFusing', 'IndustrialTech']
    },

    // ── 추가 스타일 (상업·트렌드 중심) ─────────────────────────

    // modern
    { id: 'modern-vaporwave', category: 'modern', nameKo: '베이퍼웨이브', nameEn: 'Vaporwave', emoji: '🌆',
      desc: '90년대 레트로 디지털 미학. 그리드 원근법, 파스텔 네온, 그래디언트 석양.',
      palette: ['#ff71ce','#01cdfe','#05ffa1','#b967ff','#fffb96'],
      prompt: `vaporwave aesthetic, retro 80s 90s digital art, perspective grid floor, glowing neon pastel gradients, aesthetic computer graphics, color palette: #ff71ce #01cdfe #05ffa1 #b967ff #fffb96, hot pink for primary glow, electric cyan for secondary neon, mint green for highlight accent, bright violet for grid lines and silhouette, pale yellow for sun or moon disc, synthwave grid horizon, retrowave city silhouette, lo-fi digital texture`,
      tags: ['레트로','네온','디지털'] },

    { id: 'modern-synthwave', category: 'modern', nameKo: '신스웨이브', nameEn: 'Synthwave', emoji: '🌅',
      desc: '80년대 신스팝 감성. 네온 지평선, 크롬 텍스트, 레트로 자동차와 야자수.',
      palette: ['#0d0221','#ff2975','#f222ff','#8c1eff','#fe75fe'],
      prompt: `synthwave retrowave outrun style illustration, neon sunset over chrome horizon grid, silhouette palm trees and sports car, glowing laser grid road vanishing point perspective, color palette: #0d0221 #ff2975 #f222ff #8c1eff #fe75fe, near-black deep midnight for sky base, hot neon pink-red for sun disc and primary glow, vivid magenta for secondary neon outline, deep violet for distance silhouette, bright pink lavender for horizon gradient, 80s aesthetic, Kavinsky album art mood`,
      tags: ['신스팝','레트로','네온'] },

    { id: 'modern-dark-academia', category: 'modern', nameKo: '다크 아카데미아', nameEn: 'Dark Academia', emoji: '📚',
      desc: '고풍스러운 대학 도서관과 학문적 오브제. 세피아 톤과 캔들 빛.',
      palette: ['#2c1810','#6b4c3b','#c4a882','#e8d5b7','#8b6f47'],
      prompt: `dark academia aesthetic photograph, vintage university library interior, leather-bound books stacked with antique globe and candle, warm sepia amber candlelight, aged paper texture, oil painting quality, color palette: #2c1810 #6b4c3b #c4a882 #e8d5b7 #8b6f47, deep dark espresso for shadow and mahogany wood, warm chestnut for bookshelf and velvet upholstery, muted gold-beige for aged paper pages, pale warm ivory for candlelit highlight, dusty amber for leather binding, Gothic Revival architecture, academic moody atmosphere`,
      tags: ['다크','빈티지','학문'] },

    { id: 'modern-acid-design', category: 'modern', nameKo: '애시드 그래픽', nameEn: 'Acid Graphics', emoji: '🌀',
      desc: '90년대 레이브 문화의 사이키델릭 산성 그래픽. 형광색 물결과 왜곡.',
      palette: ['#00ff00','#ff00ff','#ffff00','#00ffff','#ff6600'],
      prompt: `acid house rave graphic design, psychedelic smiley face, distorted warped typography, neon fluorescent colors on black background, 90s techno flyer aesthetic, color palette: #00ff00 #ff00ff #ffff00 #00ffff #ff6600, pure neon green for primary distorted element, hot magenta pink for secondary organic shape, electric yellow for smiley and highlight burst, cyan for warp trail and ghost, bright orange for accent smear, blob liquify effect, UV blacklight reactive palette, underground club flyer aesthetic`,
      tags: ['사이키델릭','레이브','90s'] },

    // illustration
    { id: 'illust-anime-cel', category: 'illustration', nameKo: '애니메이션 셀 쉐이딩', nameEn: 'Anime Cel Shading', emoji: '🎌',
      desc: '일본 애니메이션 특유의 셀 쉐이딩 스타일. 굵은 윤곽선과 평면적 채색.',
      palette: ['#ffffff','#ffd6e0','#a8d8ea','#f6f6f6','#2d2d2d'],
      prompt: `anime cel shading illustration style, clean bold black outline strokes, flat color fills with hard shadow division line, manga highlight sparkle on eyes, color palette: #ffffff #ffd6e0 #a8d8ea #f6f6f6 #2d2d2d, pure white for primary highlight and background, soft pink blush for skin tone and cheek flush, powder blue for hair highlight and cloth shadow, near-white gray for secondary flat surface, near-black for clean outline and pupil, Japanese animation style, KyoAni A-1 Pictures production quality`,
      tags: ['애니메이션','셀쉐이딩','만화'] },

    { id: 'illust-sticker-design', category: 'illustration', nameKo: '스티커 디자인', nameEn: 'Sticker Design', emoji: '✨',
      desc: '귀엽고 두꺼운 흰 테두리의 스티커 시트. SNS와 앱에서 가장 인기 있는 스타일.',
      palette: ['#ff6b6b','#ffd93d','#6bcf7f','#4ecdc4','#ffffff'],
      prompt: `cute sticker design sheet, thick white outline border on each sticker element, kawaii chibi characters and icons, vibrant flat illustration on transparent background, color palette: #ff6b6b #ffd93d #6bcf7f #4ecdc4 #ffffff, coral red for primary character fill, bright sunny yellow for accent and star element, fresh green for nature and plant icon, teal mint for secondary character variant, pure white for sticker border and cut line, emoji sticker pack aesthetic, LINE sticker quality, clean vector illustration`,
      tags: ['스티커','귀여움','이모티콘'] },

    { id: 'illust-concept-art', category: 'illustration', nameKo: '판타지 컨셉 아트', nameEn: 'Fantasy Concept Art', emoji: '🐉',
      desc: '게임·영화 업계 수준의 판타지 컨셉 아트. 웅장한 구도와 극적인 조명.',
      palette: ['#0a0a1a','#1a2a4a','#4a6fa5','#c4a35a','#e8c87a'],
      prompt: `fantasy game concept art, epic cinematic composition, dramatic rim lighting, detailed environment design, mythical creature or ancient ruins, color palette: #0a0a1a #1a2a4a #4a6fa5 #c4a35a #e8c87a, near-black deep space for shadowed foreground silhouette, dark navy for atmospheric background haze, steel blue for mid-ground environmental detail, warm bronze gold for ancient stone texture, bright gold yellow for magical light source, ArtStation quality, Blizzard Entertainment concept art style`,
      tags: ['판타지','게임아트','컨셉아트'] },

    { id: 'illust-pastel-kawaii', category: 'illustration', nameKo: '파스텔 가와이', nameEn: 'Pastel Kawaii', emoji: '🍬',
      desc: '부드러운 파스텔 팔레트의 가와이 캐릭터. 뷰티·팬시 브랜드에서 가장 많이 쓰이는 스타일.',
      palette: ['#ffd6e7','#c8e6ff','#d4f0c0','#fff0d4','#e8d4f0'],
      prompt: `pastel kawaii illustration, soft dreamy colors, chubby cute chibi character with big sparkly eyes, fluffy cloud and star accessories, gentle gradient shading, color palette: #ffd6e7 #c8e6ff #d4f0c0 #fff0d4 #e8d4f0, soft cotton candy pink for skin and main element, baby powder blue for hair and sky, mint green for accessory and background accent, pale peach for shadow and warm fill, light lavender for secondary character, Japanese stationery brand Sanrio style`,
      tags: ['파스텔','가와이','캐릭터'] },

    // photo
    { id: 'photo-hyperrealistic-portrait', category: 'photo', nameKo: '극사실주의 초상화', nameEn: 'Hyperrealistic Portrait', emoji: '👤',
      desc: '모공까지 보이는 극사실주의 초상화. 뷰티·패션 광고의 표준 스타일.',
      palette: ['#f5e6d8','#d4a574','#8b6347','#c4956a','#ffffff'],
      prompt: `hyperrealistic portrait photography, photorealistic skin texture with visible pores and fine hair, professional beauty retouching, sharp focus catchlight in eyes, soft gradient studio background, color palette: #f5e6d8 #d4a574 #8b6347 #c4956a #ffffff, warm ivory for skin highlight and base tone, golden tan for midtone skin warmth, rich medium brown for shadow and eye definition, amber caramel for hair and warm rim light, pure white for background gradient, Hasselblad medium format aesthetic, Annie Leibovitz lighting style`,
      tags: ['극사실주의','인물','뷰티'] },

    { id: 'photo-dark-moody', category: 'photo', nameKo: '다크 무드 시네마틱', nameEn: 'Dark Moody Cinematic', emoji: '🎬',
      desc: '영화 스틸 같은 무거운 감성. 강한 대비와 깊은 섀도우.',
      palette: ['#0a0a0a','#1a1a2e','#16213e','#533483','#e94560'],
      prompt: `dark moody cinematic photography, heavy contrast low key lighting, deep crushed blacks, single dramatic light source, film noir atmosphere, color palette: #0a0a0a #1a1a2e #16213e #533483 #e94560, true black for maximum shadow crush and background, deep dark navy for ambient fill shadow, midnight blue-black for environmental shadow, dark desaturated purple for subtle mid-shadow, vivid crimson red for single accent highlight, anamorphic lens flare, ARRI ALEXA cinema camera look, movie still aesthetic`,
      tags: ['무드','시네마틱','다크'] },

    { id: 'photo-lo-fi-aesthetic', category: 'photo', nameKo: '로파이 감성', nameEn: 'Lo-Fi Aesthetic', emoji: '☕',
      desc: '흐릿한 필름 그레인, 따뜻한 색온도, 편안한 일상 감성.',
      palette: ['#d4a96a','#c17f4b','#8b5e3c','#f5e6c8','#a0856b'],
      prompt: `lo-fi aesthetic photography, warm film grain texture, soft slightly out of focus, cozy indoor scene with study desk or coffee, warm amber evening light through window, color palette: #d4a96a #c17f4b #8b5e3c #f5e6c8 #a0856b, warm golden honey for ambient light wash, medium burnt orange for shadow and wooden surface, deep warm brown for foreground object detail, pale warm cream for window light and paper, muted caramel for mid-tone fill, 35mm film stock grain, Lofi Girl YouTube channel aesthetic`,
      tags: ['로파이','감성','일상'] },

    // brand
    { id: 'brand-neon-sign', category: 'brand', nameKo: '네온 사인 광고', nameEn: 'Neon Sign', emoji: '💡',
      desc: '어두운 배경에 빛나는 레트로 네온 튜브 사인. 바·레스토랑·이벤트에서 인기.',
      palette: ['#0d0d0d','#ff2d78','#00e5ff','#39ff14','#ff6b00'],
      prompt: `neon sign advertisement, glowing glass tube neon lettering on dark wall, warm bokeh background light bleed, retro diner or bar atmosphere, realistic neon glow emission, color palette: #0d0d0d #ff2d78 #00e5ff #39ff14 #ff6b00, near-black dark charcoal wall background, hot neon pink-red for primary tube lettering, electric cyan for secondary neon element, toxic neon green for accent symbol or arrow, vivid neon orange for warm highlight sign, 80s retro American diner aesthetic, long exposure photography glow`,
      tags: ['네온','광고','레트로'] },

    { id: 'brand-graffiti-street', category: 'brand', nameKo: '스트리트 그래피티', nameEn: 'Street Art Graffiti', emoji: '🎨',
      desc: '도시 벽면의 대형 그래피티 뮤럴. 스트리트웨어·문화 브랜드의 강렬한 표현.',
      palette: ['#e8e0d8','#d42b2b','#1a1a1a','#f5a623','#4ecdc4'],
      prompt: `street art graffiti mural, spray paint texture on concrete wall, bold bubble letters with sharp shadow and highlight, urban city backdrop, color palette: #e8e0d8 #d42b2b #1a1a1a #f5a623 #4ecdc4, weathered off-white concrete wall base, fire engine red for primary letter fill, near-black for outline and shadow depth, vivid amber orange for secondary letter variant, teal turquoise for fill highlight and background element, Banksy Keith Haring Jean-Michel Basquiat influence, aerosol can drip detail`,
      tags: ['그래피티','스트리트아트','도시'] },

    { id: 'brand-tattoo-flash', category: 'brand', nameKo: '타투 플래시 아트', nameEn: 'Tattoo Flash Art', emoji: '🌹',
      desc: '전통 타투 플래시 스타일. 굵은 윤곽선, 제한된 팔레트, 뱀·장미·독수리 모티프.',
      palette: ['#1a1a1a','#dc2626','#16a34a','#ca8a04','#0369a1'],
      prompt: `traditional tattoo flash art sheet, bold black outline technique, limited flat color fill palette, classic American traditional motifs including roses anchors eagles and daggers, clean white background, color palette: #1a1a1a #dc2626 #16a34a #ca8a04 #0369a1, bold near-black for outline and shadow hatching, classic red for rose petal and banner fill, forest green for leaf and foliage, golden amber for scroll and eagle feather, navy blue for water wave and swallow wing, Norman Collins Sailor Jerry vintage style`,
      tags: ['타투','빈티지','일러스트'] },

    // craft
    { id: 'craft-digital-painting', category: 'craft', nameKo: '디지털 페인팅', nameEn: 'Digital Painting', emoji: '🖌',
      desc: '유화와 디지털의 결합. 브러쉬 질감이 살아있는 픽사·게임 스타일 디지털 아트.',
      palette: ['#1e3a5f','#2d7dd2','#97cc04','#f45d01','#f7c59f'],
      prompt: `digital painting art, visible brush stroke texture, painterly quality with traditional media feel, richly detailed environment or character, color palette: #1e3a5f #2d7dd2 #97cc04 #f45d01 #f7c59f, deep prussian blue for shadowed background and dramatic sky, bright cobalt blue for mid-distance atmospheric haze, vivid spring green for foliage and nature accent, vivid burnt orange for warm light source and focal warmth, pale peach skin tone for character highlight, Craig Mullins Sparth concept artist quality, Photoshop custom brush strokes`,
      tags: ['디지털아트','페인팅','브러쉬'] },

    // nature
    { id: 'nature-solarpunk', category: 'nature', nameKo: '솔라펑크', nameEn: 'Solarpunk', emoji: '🌱',
      desc: '태양광과 식물이 공존하는 유토피아 미래 도시. 지속가능성 브랜드에서 폭발적 인기.',
      palette: ['#2d6a4f','#40916c','#74c69d','#b7e4c7','#ffd166'],
      prompt: `solarpunk utopian cityscape, green architecture covered in vertical gardens and solar panels, art nouveau organic curves merged with sustainable technology, golden sunlight, color palette: #2d6a4f #40916c #74c69d #b7e4c7 #ffd166, deep forest green for primary vegetation and architectural base, medium emerald for plant coverage on building facade, sage mint for sky garden and terrace plant, pale mint-white for solar panel reflection and ambient light, warm golden yellow for sunlight source and flower accent, afrofuturism solarpunk community, regenerative future aesthetic`,
      tags: ['솔라펑크','미래','친환경'] },

    { id: 'nature-cottagecore', category: 'nature', nameKo: '코티지코어', nameEn: 'Cottagecore', emoji: '🌸',
      desc: '시골 오두막과 정원의 낭만적 감성. 라이프스타일·음식·패션 브랜드에서 가장 인기.',
      palette: ['#f5e6d3','#c9a96e','#8fbc8f','#e8c4a0','#a0785a'],
      prompt: `cottagecore aesthetic, charming countryside cottage surrounded by wildflower meadow, vintage linen tablecloth with fresh bread and dried herbs, golden afternoon sunlight, color palette: #f5e6d3 #c9a96e #8fbc8f #e8c4a0 #a0785a, warm parchment cream for linen fabric and afternoon haze, golden honey amber for wheat and wooden surface, sage herb green for garden plant and moss, peach blush for wildflower and warm shadow, russet brown for wooden furniture and wicker basket, English countryside cottage garden lifestyle, Tasha Tudor illustration mood`,
      tags: ['코티지코어','전원','감성'] },

    // game
    { id: 'game-retrowave-racing', category: 'game', nameKo: '레트로웨이브 레이싱', nameEn: 'Retrowave Racing', emoji: '🏎',
      desc: '80년대 아웃런 게임 스타일. 네온 그리드 도로와 크롬 슈퍼카.',
      palette: ['#0a0010','#ff006e','#8338ec','#3a86ff','#fb5607'],
      prompt: `retrowave outrun arcade racing game art, chrome supercar on neon pink grid highway, sunset horizon with silhouette mountains, laser grid road receding to vanishing point, color palette: #0a0010 #ff006e #8338ec #3a86ff #fb5607, ultra-dark navy-black for sky and road base, hot neon pink-red for primary grid line and car body highlight, vivid electric violet for atmospheric glow and rim light, bright blue for background sky gradient, vivid burnt orange for speed trail and exhaust flame, Outrun SEGA arcade game aesthetic, 80s vector game graphic`,
      tags: ['레트로','레이싱','아케이드'] },

    // fashion
    { id: 'fashion-editorial-luxury', category: 'fashion', nameKo: '럭셔리 에디토리얼', nameEn: 'Luxury Editorial', emoji: '💎',
      desc: '보그·하퍼스 바자 수준의 하이패션 에디토리얼. 조각 같은 포즈와 완벽한 조명.',
      palette: ['#f8f4ef','#c9b99a','#7a6652','#2c1810','#d4af37'],
      prompt: `high fashion luxury editorial photography, sculptural fashion pose with architectural couture garment, flawless studio lighting with dramatic shadow, color palette: #f8f4ef #c9b99a #7a6652 #2c1810 #d4af37, warm off-white cream for seamless studio backdrop, warm sand for secondary background gradient, muted taupe-brown for shadow and fabric texture, deep dark brown for maximum contrast shadow, rich antique gold for metallic accessory and jewelry, Vogue Italia Harper Bazaar editorial quality, Steven Meisel Richard Avedon inspired`,
      tags: ['럭셔리','패션','에디토리얼'] },

    { id: 'fashion-streetwear-lookbook', category: 'fashion', nameKo: '스트리트웨어 룩북', nameEn: 'Streetwear Lookbook', emoji: '👟',
      desc: 'Supreme·Palace 스타일의 스트리트웨어 룩북. 도시 배경과 젊은 에너지.',
      palette: ['#f0ece4','#1a1a1a','#ff4500','#e8dcc8','#808080'],
      prompt: `streetwear lookbook photography, urban youth fashion portrait on gritty city street, candid confident pose, color palette: #f0ece4 #1a1a1a #ff4500 #e8dcc8 #808080, warm off-white for model skin highlight and clear background area, near-black for garment base and urban shadow, vivid orange-red for logo or graphic element accent, pale warm cream for neutral clothing base, medium gray for concrete wall and urban environment, Supreme Palace Off-White brand aesthetic, Hypebeast editorial style`,
      tags: ['스트리트웨어','룩북','도시'] },

    // food
    { id: 'food-cafe-aesthetic', category: 'food', nameKo: '카페 감성', nameEn: 'Cafe Aesthetic', emoji: '☕',
      desc: '화이트 테이블과 라떼아트. SNS에서 가장 많이 공유되는 카페 감성 푸드포토.',
      palette: ['#f8f4f0','#d4a96a','#8b6347','#c4956a','#e8e0d8'],
      prompt: `cafe aesthetic food photography, artisan latte art in white ceramic cup on marble table, morning light from window, croissant and book styling, color palette: #f8f4f0 #d4a96a #8b6347 #c4956a #e8e0d8, warm off-white for marble table surface and ceramic cup, golden honey amber for espresso crema and latte foam art, rich medium brown for coffee base and dark shadow, warm caramel for croissant and wooden accent, muted warm gray for ambient shadow and atmosphere, Korean cafe Instagram aesthetic, Hario V60 pour-over styling`,
      tags: ['카페','커피','감성'] },

    { id: 'food-dessert-pastel', category: 'food', nameKo: '디저트 파스텔', nameEn: 'Dessert Pastel', emoji: '🍰',
      desc: '파스텔 색상의 케이크와 마카롱. 디저트 브랜드 SNS에서 가장 인기 있는 스타일.',
      palette: ['#fce4ec','#f8bbd0','#f48fb1','#e91e63','#ffffff'],
      prompt: `pastel dessert food photography, elegant macaron tower and layered cake with fresh flowers, soft pink studio background, overhead and angle shot, color palette: #fce4ec #f8bbd0 #f48fb1 #e91e63 #ffffff, pale blush pink for soft background and macaron shell, soft rose for cake frosting and secondary macaron, medium warm pink for flower petal and ganache drip, vivid hot pink for signature macaron and berry accent, pure white for whipped cream and plate, Ladurée Paris pastel aesthetic, Iza Perez food styling`,
      tags: ['디저트','파스텔','베이커리'] },

    // science
    { id: 'science-ai-machine-learning', category: 'science', nameKo: 'AI·머신러닝 시각화', nameEn: 'AI & Machine Learning', emoji: '🤖',
      desc: '딥러닝 신경망과 데이터 흐름의 추상적 시각화. AI 기업 마케팅에서 필수.',
      palette: ['#0a0a1a','#00d2ff','#7b2ff7','#ff6b6b','#ffffff'],
      prompt: `AI machine learning neural network visualization, abstract deep learning architecture diagram, glowing nodes and weighted connections flowing through layers, data particles streaming through network, color palette: #0a0a1a #00d2ff #7b2ff7 #ff6b6b #ffffff, ultra-dark near-black for background void, bright electric cyan for active neuron and data stream, vivid purple for weight connection and layer boundary, warm coral red for error signal and attention highlight, pure white for activated node peak, NVIDIA Anthropic OpenAI brand aesthetic, technology marketing illustration style`,
      tags: ['AI','머신러닝','테크'] },

    // ── 만화·손글씨·스케치 스타일 ────────────────────────────────

    // 만화 스타일
    { id: 'comic-american-superhero', category: 'illustration', nameKo: '미국 슈퍼히어로 코믹', nameEn: 'American Superhero Comic', emoji: '🦸',
      desc: 'Marvel·DC 스타일의 미국 슈퍼히어로 만화. 굵은 선, 역동적인 구도, 강렬한 원색.',
      palette: ['#1a1a2e','#e63946','#457b9d','#f4a261','#ffffff'],
      prompt: `American superhero comic book illustration, dynamic action pose with dramatic foreshortening, bold black ink outline, flat halftone dot shading pattern, speech bubble, color palette: #1a1a2e #e63946 #457b9d #f4a261 #ffffff, deep navy for shadow and background, vivid red for hero costume primary, steel blue for sky and secondary costume, warm orange for energy blast and accent, pure white for highlight and panel background, Jack Kirby Neal Adams John Romita Sr. style, Marvel Comics 1970s aesthetic`,
      tags: ['슈퍼히어로','코믹북','미국만화'] },

    { id: 'comic-franco-belgian', category: 'illustration', nameKo: '프랑코-벨기에 만화', nameEn: 'Franco-Belgian Comics', emoji: '🇧🇪',
      desc: '탱탱·아스테릭스 스타일의 유럽 만화. 명확한 선화, 플랫 컬러, 유머러스한 표현.',
      palette: ['#f5f0e8','#2c5f8a','#e8c84a','#c0392b','#3d5a3e'],
      prompt: `Franco-Belgian bande dessinée comic style, clear ligne claire clean outline with no cross-hatching, flat color fills without gradients, expressive cartoon characters with exaggerated facial features, color palette: #f5f0e8 #2c5f8a #e8c84a #c0392b #3d5a3e, warm off-white parchment for panel background, deep French blue for sky and water, bright golden yellow for hair and sunlight, vivid red for clothing and accent element, deep forest green for foliage, Hergé Tintin style, Uderzo Goscinny Asterix aesthetic`,
      tags: ['유럽만화','탱탱','벨기에'] },

    { id: 'comic-webtoon', category: 'illustration', nameKo: '한국 웹툰', nameEn: 'Korean Webtoon', emoji: '📱',
      desc: '네이버·카카오 웹툰 스타일. 세로 스크롤 구성, 반짝이는 눈, 감성적인 색감.',
      palette: ['#fff9f0','#ffb3c6','#b5deff','#ffd6a5','#a8e6cf'],
      prompt: `Korean webtoon illustration style, vertical scroll panel layout, large expressive sparkling eyes with detailed iris highlight, soft smooth coloring with subtle gradient, color palette: #fff9f0 #ffb3c6 #b5deff #ffd6a5 #a8e6cf, warm cream white for page background, soft rose pink for blush and romantic element, powder blue for sky and calm atmosphere, warm peach for skin tone warmth, mint green for nature and fresh accent, Naver Webtoon platform aesthetic, romance or slice-of-life genre`,
      tags: ['웹툰','한국만화','로맨스'] },

    { id: 'comic-shojo-manga', category: 'illustration', nameKo: '소녀 만화 (쇼조)', nameEn: 'Shojo Manga', emoji: '🌸',
      desc: '꽃잎과 별빛이 가득한 소녀 만화. 繊細한 선, 큰 눈, 감정이 넘치는 표현.',
      palette: ['#fff0f5','#ffb7d5','#d4a5c9','#f7d6e0','#c8a2c8'],
      prompt: `shojo manga illustration, delicate fine line art with decorative flower and sparkle screentone patterns, large detailed emotional eyes with multiple highlight reflections, flowing hair with ribbon and bow accessories, color palette: #fff0f5 #ffb7d5 #d4a5c9 #f7d6e0 #c8a2c8, near-white blush pink for background glow, warm bubble gum pink for primary costume and cheek, dusty mauve lavender for shadow and hair, pale rose for secondary element, soft lilac for screentone and atmosphere, Ribon Margaret magazine aesthetic, CLAMP Naoko Takeuchi style`,
      tags: ['소녀만화','망가','쇼조'] },

    { id: 'comic-graphic-novel-noir', category: 'illustration', nameKo: '그래픽 노블 누아르', nameEn: 'Graphic Novel Noir', emoji: '🕵️',
      desc: 'Sin City·Watchmen 스타일의 흑백 누아르. 극단적 명암과 간결한 실루엣.',
      palette: ['#000000','#1a1a1a','#4a4a4a','#ffffff','#c0392b'],
      prompt: `graphic novel noir illustration, extreme high contrast black and white ink, sharp silhouette against single light source, rain-slicked street reflection, minimal color accent, color palette: #000000 #1a1a1a #4a4a4a #ffffff #c0392b, pure black for dominant shadow and ink fill, very dark charcoal for secondary shadow, dark gray for mid-tone detail, pure white for single light source and highlight, vivid blood red as the only accent color, Frank Miller Sin City aesthetic, Alan Moore Watchmen visual language`,
      tags: ['누아르','그래픽노블','흑백'] },

    { id: 'comic-underground-comix', category: 'illustration', nameKo: '언더그라운드 코믹스', nameEn: 'Underground Comix', emoji: '🤪',
      desc: '60-70년대 반문화 언더그라운드 만화. 거칠고 낙서 같은 선, 사이키델릭 색감.',
      palette: ['#f5e6c8','#d4622a','#2d6e2a','#7b3fa0','#e8c84a'],
      prompt: `underground comix alternative comics illustration, rough scratchy crosshatch ink line, deliberately crude expressive drawing style, psychedelic swirling background pattern, counter-culture underground press aesthetic, color palette: #f5e6c8 #d4622a #2d6e2a #7b3fa0 #e8c84a, aged newsprint cream for paper texture background, rust burnt orange-red for primary bold element, earthy forest green for organic shape, deep purple for psychedelic pattern, mustard yellow for retro accent, Robert Crumb Gilbert Shelton Zap Comix style`,
      tags: ['언더그라운드','빈티지','사이키델릭'] },

    { id: 'comic-vintage-newspaper-strip', category: 'illustration', nameKo: '신문 4컷 만화', nameEn: 'Newspaper Comic Strip', emoji: '📰',
      desc: '피너츠·가필드 스타일의 신문 연재 만화. 단순하고 따뜻한 선화.',
      palette: ['#fdf6e3','#2c2c2c','#d4a843','#5b8a5b','#c94040'],
      prompt: `newspaper comic strip illustration, simple clean black outline cartoon style, minimal background detail, expressive round-headed simple characters, dotted halftone printing texture, color palette: #fdf6e3 #2c2c2c #d4a843 #5b8a5b #c94040, aged newsprint ivory for panel background, near-black for clean cartoon outline, warm golden yellow for hair and sunlight, muted sage green for nature element, muted red for costume and accent, Charles Schulz Peanuts Jim Davis Garfield Bill Watterson Calvin and Hobbes aesthetic`,
      tags: ['신문만화','4컷','클래식'] },

    // 손글씨·레터링 스타일
    { id: 'letter-brush-calligraphy', category: 'illustration', nameKo: '붓글씨 캘리그라피', nameEn: 'Brush Calligraphy', emoji: '🖋',
      desc: '먹물 붓글씨의 힘 있는 획. 전통 서예부터 현대 캘리까지 폭넓게 활용.',
      palette: ['#f8f4ee','#1a1008','#3d2b1f','#8b7355','#c5b48a'],
      prompt: `brush calligraphy ink lettering, expressive flowing brush strokes with visible ink texture and pressure variation, thin to thick stroke contrast, splatter ink accent, color palette: #f8f4ee #1a1008 #3d2b1f #8b7355 #c5b48a, warm aged paper ivory for textured background, pure sumi ink black for primary brushstroke, very dark sepia-brown for shadow stroke, medium warm brown for secondary brushwork, pale gold for aged paper midtone, Japanese East Asian sumi-e brush calligraphy tradition, modern lettering artist style`,
      tags: ['캘리그라피','붓글씨','서예'] },

    { id: 'letter-chalk-blackboard', category: 'illustration', nameKo: '칠판 분필 레터링', nameEn: 'Chalkboard Lettering', emoji: '🖊',
      desc: '칠판 위 분필 손글씨. 카페 메뉴판, 이벤트 보드에서 가장 인기 있는 스타일.',
      palette: ['#2d4a2d','#c8d8b4','#f0ead8','#a8c090','#e8e0c8'],
      prompt: `chalkboard lettering illustration, white and cream chalk writing on dark green blackboard texture, hand-drawn decorative borders and floral flourish, menu board or event sign style, color palette: #2d4a2d #c8d8b4 #f0ead8 #a8c090 #e8e0c8, deep forest green for chalkboard surface, sage chalk green for secondary lettering, warm cream for primary chalk text highlight, muted medium green for decorative border element, pale warm cream for chalk dust smear effect, coffee shop menu board aesthetic, Joanne Sharpe chalk artist style`,
      tags: ['칠판','분필','레터링'] },

    { id: 'letter-blackletter-gothic', category: 'illustration', nameKo: '블랙레터 고딕', nameEn: 'Blackletter Gothic', emoji: '⚜️',
      desc: '중세 유럽의 고딕 필기체. 금속 장식과 함께 럭셔리·스트리트 브랜드에서 즐겨 사용.',
      palette: ['#0d0d0d','#c9a84c','#8b1a1a','#1a1a2e','#f5f0e0'],
      prompt: `blackletter gothic calligraphy, ornate medieval manuscript letterform with thick and thin stroke contrast, decorative serif flourish and swash, color palette: #0d0d0d #c9a84c #8b1a1a #1a1a2e #f5f0e0, near-black ink for primary gothic letterform, antique gold leaf for ornamental border and illuminated initial, deep dark red for secondary letter and wax seal, very dark navy for shadow and background, aged vellum cream for parchment texture, German Fraktur Textura Quadrata style, luxury brand typography aesthetic`,
      tags: ['고딕','블랙레터','중세'] },

    { id: 'letter-watercolor-lettering', category: 'illustration', nameKo: '수채화 레터링', nameEn: 'Watercolor Lettering', emoji: '🌊',
      desc: '물감이 번지는 수채화 효과와 손글씨의 조화. 웨딩·브랜딩에서 폭발적 인기.',
      palette: ['#e8f4f8','#7ec8c8','#f4a7b9','#b8d4a8','#f9c784'],
      prompt: `watercolor brush lettering, flowing script hand lettering with wet-on-wet watercolor wash bleeding effect, soft paint bloom and granulation texture, floral botanical element, color palette: #e8f4f8 #7ec8c8 #f4a7b9 #b8d4a8 #f9c784, near-white sky blue for wet wash background bloom, soft teal for primary lettering wash, blush rose pink for floral accent and secondary wash, sage mint green for botanical leaf element, soft golden yellow for highlight wash and warmth, wedding invitation stationery aesthetic, Molly Jacques modern calligraphy style`,
      tags: ['수채화','레터링','웨딩'] },

    { id: 'letter-vintage-sign-painting', category: 'illustration', nameKo: '빈티지 사인 페인팅', nameEn: 'Vintage Sign Painting', emoji: '🪧',
      desc: '1950년대 미국 상점 간판 스타일. 쉐도우 레터, 아치형 텍스트, 레트로 팔레트.',
      palette: ['#f5e6c0','#2c4a7c','#c4392b','#f0c040','#3a6b3a'],
      prompt: `vintage American sign painting illustration, hand-lettered shop sign with drop shadow and inline highlight, arched or banner typography layout, aged retro color scheme, color palette: #f5e6c0 #2c4a7c #c4392b #f0c040 #3a6b3a, warm cream for sign board background and aged highlight, deep patriot blue for primary letter fill, classic American red for border stripe and accent letter, bright golden yellow for secondary lettering and star, forest green for tertiary element and frame, 1950s diner barber shop general store aesthetic, letterpress typography tradition`,
      tags: ['빈티지','사인','레트로'] },

    // 스케치 스타일
    { id: 'sketch-pencil-rough', category: 'illustration', nameKo: '연필 러프 스케치', nameEn: 'Pencil Rough Sketch', emoji: '✏️',
      desc: '연필의 거친 질감이 살아있는 러프 스케치. 아이디어 발상과 창작 과정의 날것 표현.',
      palette: ['#f8f6f2','#2c2c2c','#8a8a8a','#c8c0b0','#a09080'],
      prompt: `pencil rough sketch drawing, visible graphite texture and stroke direction, loose gestural lines with construction guidelines showing, light and shadow through hatching and cross-hatching technique, color palette: #f8f6f2 #2c2c2c #8a8a8a #c8c0b0 #a09080, slightly warm off-white for sketch paper texture, dark graphite for primary bold pressure stroke, medium gray for secondary lighter stroke, warm gray-beige for paper mid-tone, muted warm taupe for erasure smudge area, concept artist sketchbook style, Frank Frazetta preliminary sketch aesthetic`,
      tags: ['연필','스케치','드로잉'] },

    { id: 'sketch-ink-pen', category: 'illustration', nameKo: '펜 잉크 스케치', nameEn: 'Ink Pen Sketch', emoji: '🖊',
      desc: '파인라이너·만년필의 정밀한 잉크 스케치. 건축·자연물 드로잉에서 많이 사용.',
      palette: ['#f4f0e8','#1a1410','#4a3e32','#8a7a6a','#c8bca8'],
      prompt: `ink pen sketch illustration, fine liner technical pen line work, varied line weight from thin detail to bold outline, stippling and hatching for shadow and texture, color palette: #f4f0e8 #1a1410 #4a3e32 #8a7a6a #c8bca8, warm aged paper for background, deep warm near-black for primary ink line, dark brown sepia for secondary shadow stroke, medium warm brown for mid-tone hatch, pale beige for paper grain highlight, Moleskine sketchbook quality, urban sketching plein air style, Alphonse Mucha technical ink drawing`,
      tags: ['펜드로잉','잉크','세밀화'] },

    { id: 'sketch-fashion-croquis', category: 'illustration', nameKo: '패션 크로키', nameEn: 'Fashion Croquis', emoji: '👗',
      desc: '패션 디자이너의 길고 우아한 인체 크로키. 빠른 선으로 표현한 의상 스케치.',
      palette: ['#faf7f2','#1a1a1a','#d4b896','#8c7b6e','#c8a882'],
      prompt: `fashion croquis illustration, elongated stylized figure with 9-10 head proportion, loose gestural brushstroke garment sketch, confident single-stroke outline, color palette: #faf7f2 #1a1a1a #d4b896 #8c7b6e #c8a882, warm white for fashion sketch pad background, near-black for primary confident croquis outline, warm tan for skin tone wash, muted brown for shadow drape and fold indication, warm medium beige for secondary skin, fashion design school atelier aesthetic, Karl Lagerfeld Christian Dior sketch style`,
      tags: ['패션','크로키','인체'] },

    { id: 'sketch-architectural', category: 'illustration', nameKo: '건축 스케치', nameEn: 'Architectural Sketch', emoji: '🏛',
      desc: '건축가의 손 스케치. 1점 투시도법, 빠른 선, 수채화 워시의 조합.',
      palette: ['#f8f5ef','#1e1a14','#6a9ac4','#c4a878','#8aae8a'],
      prompt: `architectural hand sketch illustration, one-point perspective building drawing with loose confident line work, watercolor wash fill over ink outline, entourage people and trees for scale, color palette: #f8f5ef #1e1a14 #6a9ac4 #c4a878 #8aae8a, warm cream for sketch paper background, near-black for primary perspective construction line, sky blue watercolor for atmospheric wash and glass, warm ochre brown for stone and brick material, sage green for landscape entourage tree, Zaha Hadid Tadao Ando hand drawing style, architectural visualization sketch`,
      tags: ['건축','스케치','투시도'] },

    { id: 'sketch-gesture-drawing', category: 'illustration', nameKo: '제스처 드로잉', nameEn: 'Gesture Drawing', emoji: '🤸',
      desc: '빠른 포즈 캡처의 생동감 있는 제스처 드로잉. 움직임의 에너지와 흐름을 표현.',
      palette: ['#f5f0ea','#2a2018','#c06030','#6080a0','#90a060'],
      prompt: `gesture drawing life drawing sketch, rapid 30-second to 2-minute pose capture, fluid dynamic line of action, minimal construction lines showing movement flow and weight, color palette: #f5f0ea #2a2018 #c06030 #6080a0 #90a060, warm ivory for newsprint paper texture, very dark warm brown for primary gesture line, terracotta orange-red for energy line and center of gravity indicator, muted slate blue for shadow mass indication, muted olive green for secondary line weight, Bridgman Vilppu Loomis figure drawing aesthetic, animation character pose study`,
      tags: ['제스처','인체드로잉','동세'] },

    { id: 'sketch-scientific-illustration', category: 'illustration', nameKo: '과학 세밀화', nameEn: 'Scientific Illustration', emoji: '🔬',
      desc: '정밀하고 아름다운 과학 도감 스타일. 곤충·식물·해부도의 세밀한 묘사.',
      palette: ['#f9f5ed','#1a1a0a','#3d6e3d','#8b4513','#4a6fa5'],
      prompt: `scientific botanical zoological illustration, highly detailed naturalist drawing style with precise anatomical accuracy, stipple and fine crosshatch shading technique, labeled diagram with thin leader lines, color palette: #f9f5ed #1a1a0a #3d6e3d #8b4513 #4a6fa5, aged natural history book paper for background, near-black for precise scientific outline, botanical forest green for plant specimen, warm saddle brown for insect exoskeleton and dried specimen, medium blue for water organism and vein detail, Audubon Haeckel Maria Sibylla Merian natural history illustration style`,
      tags: ['과학일러스트','세밀화','도감'] }
  ];

  // ── 렌더링 엔진 ─────────────────────────────────────────────

  let activeCategory = 'all';

  function getLuminance(hex) {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const toLinear = c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  }

  function getHeaderTheme(palette) {
    const avg = getLuminance(palette[0]) * 0.7 + getLuminance(palette[1]) * 0.3;
    if (avg > 0.35) {
      return { primary: 'rgba(20,20,40,0.92)', secondary: 'rgba(20,20,40,0.65)', badge: 'rgba(0,0,0,0.12)', badgeText: 'rgba(20,20,40,0.80)' };
    }
    return { primary: 'rgba(255,255,255,0.95)', secondary: 'rgba(255,255,255,0.72)', badge: 'rgba(255,255,255,0.20)', badgeText: 'rgba(255,255,255,0.90)' };
  }

  function buildGradient(p) { return `linear-gradient(135deg, ${p[0]} 0%, ${p[1]} 100%)`; }

  const PROMOTION_PROMPT_DEFAULTS = {
    game: {
      textureRendering: 'game-ready illustration finish with crisp readable details',
      lightingMood: 'high-contrast focal lighting that supports fast visual recognition',
      shapeLanguage: 'iconic character-like silhouettes, clear foreground/background separation',
      layoutBehavior: 'hero object centered with room for campaign headline and CTA',
      typographyGuidance: 'bold display type or game UI label treatment, keep text short and legible',
      campaignAdaptation: 'adapt as launch key art, event banner, or reward announcement',
      objectAdaptation: 'turn the promoted product into a collectible game item or quest object',
      avoid: 'avoid cluttered HUD overload, unreadable tiny details, and mismatched fantasy props',
      qualityRules: 'keep silhouettes strong, edges intentional, and palette contrast high'
    },
    '3d': {
      textureRendering: 'polished 3D rendering with controlled material highlights',
      lightingMood: 'soft studio lighting with ambient occlusion and readable depth',
      shapeLanguage: 'clean geometric volumes, rounded or faceted forms based on the style',
      layoutBehavior: 'product or offer object in a clean spatial composition with depth layers',
      typographyGuidance: 'modern sans-serif typography, placed on simple planes with clear contrast',
      campaignAdaptation: 'adapt as tech showcase, service explainer, or feature launch visual',
      objectAdaptation: 'translate the promoted item into a dimensional icon, device, package, or scene prop',
      avoid: 'avoid plastic-looking overgloss, distorted perspective, and fake terrain unless requested',
      qualityRules: 'keep lighting believable, materials consistent, and composition uncluttered'
    },
    craft: {
      textureRendering: 'visible handmade texture, material grain, tactile imperfections',
      lightingMood: 'warm natural or soft studio lighting that preserves material detail',
      shapeLanguage: 'organic handcrafted shapes with slight irregularity and human touch',
      layoutBehavior: 'flat lay, tabletop, or poster-like arrangement with calm negative space',
      typographyGuidance: 'handmade lettering or warm serif/sans pairing, avoid over-polished type',
      campaignAdaptation: 'adapt as artisan brand, workshop, seasonal offer, or cozy product visual',
      objectAdaptation: 'render the promoted item as a handmade object, paper piece, textile, or painted motif',
      avoid: 'avoid sterile digital finish, excessive symmetry, and glossy stock-photo polish',
      qualityRules: 'preserve tactile cues, readable subject boundaries, and natural color variation'
    },
    illustration: {
      textureRendering: 'illustrated finish using the selected line, fill, or drawing technique',
      lightingMood: 'stylized lighting that supports the illustration language without photorealism',
      shapeLanguage: 'clear drawn silhouettes, expressive line weight, controlled decorative detail',
      layoutBehavior: 'poster, editorial, or character-led composition with strong focal hierarchy',
      typographyGuidance: 'match type to the illustration era and keep campaign copy integrated but readable',
      campaignAdaptation: 'adapt as poster, social key visual, story card, or editorial campaign image',
      objectAdaptation: 'convert the promoted item into a drawn hero motif or supporting prop',
      avoid: 'avoid generic clip-art, inconsistent line styles, and overcrowded decoration',
      qualityRules: 'keep line treatment consistent, focal subject clear, and decorative elements intentional'
    },
    modern: {
      textureRendering: 'clean graphic finish with controlled flat, print, or vector treatment',
      lightingMood: 'minimal implied lighting or high-contrast graphic separation',
      shapeLanguage: 'geometric forms, bold planes, and simple repeatable visual systems',
      layoutBehavior: 'grid-based campaign layout with strong headline zone and modular spacing',
      typographyGuidance: 'confident modern typography, high contrast, tight copy hierarchy',
      campaignAdaptation: 'adapt as brand campaign, presentation cover, event poster, or social ad',
      objectAdaptation: 'simplify the promoted item into a bold graphic icon, silhouette, or abstract mark',
      avoid: 'avoid random decoration, weak alignment, and low-contrast palette mixing',
      qualityRules: 'maintain grid discipline, color hierarchy, and sharp vector-like edges'
    },
    photo: {
      textureRendering: 'photographic surface detail with realistic lens and material response',
      lightingMood: 'cinematic or editorial lighting guided by the source style mood',
      shapeLanguage: 'real-world object silhouettes with believable scale and perspective',
      layoutBehavior: 'hero product or lifestyle scene with clean space for campaign copy',
      typographyGuidance: 'restrained editorial typography, placed away from subject detail',
      campaignAdaptation: 'adapt as advertising key visual, product story, or lifestyle campaign',
      objectAdaptation: 'stage the promoted item as a real product, prop, or experience anchor',
      avoid: 'avoid fake-looking composites, warped products, and unreadable busy backgrounds',
      qualityRules: 'keep realism consistent, lens perspective plausible, and subject detail sharp'
    },
    fashion: {
      textureRendering: 'fashion editorial fabric, styling, and surface detail',
      lightingMood: 'editorial studio or runway-inspired lighting with clear garment texture',
      shapeLanguage: 'elegant body lines, garment silhouettes, and refined accessory shapes',
      layoutBehavior: 'magazine-style hero framing with premium negative space',
      typographyGuidance: 'luxury editorial type, minimal copy, precise placement',
      campaignAdaptation: 'adapt as lookbook, premium launch, seasonal campaign, or brand editorial',
      objectAdaptation: 'style the promoted item as an accessory, garment detail, or fashion set piece',
      avoid: 'avoid awkward anatomy, cheap styling, and fabric texture mismatch',
      qualityRules: 'preserve proportions, styling coherence, and premium material cues'
    },
    arch: {
      textureRendering: 'architectural material detail with clean structure and scale cues',
      lightingMood: 'natural daylight, gallery light, or dramatic architectural shadow',
      shapeLanguage: 'spatial geometry, clean planes, structural rhythm, human-scale references',
      layoutBehavior: 'wide composition, perspective depth, and clear copy-safe zones',
      typographyGuidance: 'architectural sans-serif or editorial serif, restrained and aligned',
      campaignAdaptation: 'adapt as venue promotion, real estate visual, exhibition, or spatial brand image',
      objectAdaptation: 'place the promoted item as signage, installation, furnishing, or architectural focal point',
      avoid: 'avoid impossible construction, broken perspective, and scale confusion',
      qualityRules: 'keep perspective stable, materials coherent, and spatial hierarchy readable'
    },
    sport: {
      textureRendering: 'dynamic sport finish with motion, fabric, equipment, or field texture',
      lightingMood: 'energetic arena, outdoor, or action lighting with strong contrast',
      shapeLanguage: 'athletic diagonals, motion arcs, powerful silhouettes',
      layoutBehavior: 'action-first composition with bold score, event, or offer space',
      typographyGuidance: 'condensed bold sport typography, high legibility under motion',
      campaignAdaptation: 'adapt as match poster, tournament promo, class/event ad, or athlete feature',
      objectAdaptation: 'make the promoted item part of equipment, prize, jersey, or action moment',
      avoid: 'avoid weak motion, impossible poses, and confusing team/color hierarchy',
      qualityRules: 'keep action readable, anatomy plausible, and brand/event information clear'
    },
    brand: {
      textureRendering: 'brand-system polish with consistent surfaces and campaign-ready finish',
      lightingMood: 'controlled commercial lighting that supports trust and recognition',
      shapeLanguage: 'repeatable brand motifs, strong logo-safe shapes, tidy iconography',
      layoutBehavior: 'clear ad layout with headline, visual proof, and conversion area',
      typographyGuidance: 'brand-safe typography hierarchy, short claims, strong CTA contrast',
      campaignAdaptation: 'adapt as launch ad, offer card, website hero, or social campaign',
      objectAdaptation: 'turn the promoted item into the central brand proof or product hero',
      avoid: 'avoid fake logos, cluttered claims, and off-brand decorative noise',
      qualityRules: 'prioritize brand consistency, readable claims, and clean commercial composition'
    },
    nature: {
      textureRendering: 'organic natural texture with foliage, terrain, weather, or botanical detail',
      lightingMood: 'natural ambient light, golden hour, mist, or eco-focused softness',
      shapeLanguage: 'organic curves, layered landscapes, botanical silhouettes',
      layoutBehavior: 'scene-led composition with breathable copy space and environmental context',
      typographyGuidance: 'calm natural typography, avoid overly synthetic effects',
      campaignAdaptation: 'adapt as eco campaign, travel visual, wellness offer, or outdoor product story',
      objectAdaptation: 'place the promoted item naturally within landscape, botanical, or outdoor context',
      avoid: 'avoid fake ecology, over-saturated greens, and inaccurate natural textures',
      qualityRules: 'keep nature cues believable, atmosphere gentle, and subject relationship clear'
    },
    food: {
      textureRendering: 'appetizing food texture, surface gloss, garnish, and plating detail',
      lightingMood: 'warm appetizing light or clean menu photography light',
      shapeLanguage: 'rounded edible forms, plate geometry, ingredient rhythm',
      layoutBehavior: 'menu, hero dish, or tabletop layout with room for offer text',
      typographyGuidance: 'clear menu typography, price/offer copy must stay readable',
      campaignAdaptation: 'adapt as menu promo, delivery ad, seasonal item, or restaurant campaign',
      objectAdaptation: 'style the promoted item as dish, packaging, ingredient, or table moment',
      avoid: 'avoid unappetizing colors, warped food anatomy, and messy plating',
      qualityRules: 'make food look fresh, textures specific, and offer hierarchy clear'
    },
    culture: {
      textureRendering: 'culturally grounded material, pattern, craft, or heritage detail',
      lightingMood: 'respectful atmospheric lighting that highlights tradition and texture',
      shapeLanguage: 'heritage motifs, ceremonial symmetry, or locally meaningful ornament',
      layoutBehavior: 'balanced poster or scene composition with context and dignity',
      typographyGuidance: 'use culturally appropriate type cues without reducing readability',
      campaignAdaptation: 'adapt as festival, exhibition, tourism, heritage, or cultural product visual',
      objectAdaptation: 'integrate the promoted item with relevant craft, pattern, place, or ritual context',
      avoid: 'avoid costume clichés, inaccurate symbols, and disrespectful cultural mixing',
      qualityRules: 'keep references respectful, specific, and visually coherent'
    },
    science: {
      textureRendering: 'precise scientific, diagrammatic, glass, metal, or lab texture',
      lightingMood: 'clean lab light, data glow, or controlled explanatory illumination',
      shapeLanguage: 'structured diagrams, modular systems, particles, charts, or instruments',
      layoutBehavior: 'explanatory campaign layout with clear focal evidence and copy-safe zones',
      typographyGuidance: 'technical sans-serif, labels concise, hierarchy clean',
      campaignAdaptation: 'adapt as research launch, education poster, explainer, or technical campaign',
      objectAdaptation: 'translate the promoted item into a specimen, instrument, diagram, or discovery moment',
      avoid: 'avoid fake scientific labels, impossible instruments, and visual misinformation',
      qualityRules: 'keep details precise, labels plausible, and visual evidence clear'
    },
    bio: {
      textureRendering: 'biological micro-texture, translucent membranes, organic structures',
      lightingMood: 'clean clinical light or soft bioluminescent depth',
      shapeLanguage: 'cellular, molecular, anatomical, or organic network forms',
      layoutBehavior: 'science-marketing composition with clear subject and calm copy zone',
      typographyGuidance: 'clinical modern type, avoid sensational medical claims',
      campaignAdaptation: 'adapt as biotech, health, wellness, research, or product education visual',
      objectAdaptation: 'relate the promoted item to cell, molecule, ingredient, anatomy, or life-system motif',
      avoid: 'avoid misleading medical certainty, grotesque anatomy, and inaccurate scale cues',
      qualityRules: 'preserve biological plausibility, clarity, and trustworthy tone'
    },
    energy: {
      textureRendering: 'energy glow, metal, grid, plasma, battery, or infrastructure detail',
      lightingMood: 'bright directional glow or industrial clean light with high impact',
      shapeLanguage: 'arcs, currents, grids, turbines, cells, or power-flow shapes',
      layoutBehavior: 'forward-motion composition with strong headline and proof area',
      typographyGuidance: 'bold technical typography, clear metrics and CTA',
      campaignAdaptation: 'adapt as sustainability, infrastructure, power product, or innovation campaign',
      objectAdaptation: 'connect the promoted item to power flow, charging, solar, wind, or grid motif',
      avoid: 'avoid unsafe equipment depictions, fake meters, and chaotic glow effects',
      qualityRules: 'keep energy direction clear, materials credible, and contrast controlled'
    },
    software: {
      textureRendering: 'digital interface, data, glassmorphism, code, or clean product UI finish',
      lightingMood: 'controlled screen glow or calm SaaS-style visual light',
      shapeLanguage: 'modular UI panels, nodes, flows, dashboards, and product-system geometry',
      layoutBehavior: 'screen-led layout with readable interface zones and campaign copy area',
      typographyGuidance: 'clean SaaS typography, concise feature labels, strong CTA',
      campaignAdaptation: 'adapt as SaaS ad, feature announcement, AI launch, or product explainer',
      objectAdaptation: 'represent the promoted item as an interface, workflow, automation, or data object',
      avoid: 'avoid unreadable fake UI, excessive neon, and meaningless data clutter',
      qualityRules: 'make UI elements plausible, hierarchy scannable, and claims visually supported'
    },
    heavy: {
      textureRendering: 'industrial metal, machinery, concrete, logistics, or manufacturing texture',
      lightingMood: 'realistic factory, workshop, or infrastructure lighting',
      shapeLanguage: 'large-scale equipment, structural lines, modular components, heavy silhouettes',
      layoutBehavior: 'robust commercial composition with clear scale and product proof',
      typographyGuidance: 'strong industrial sans-serif, concise and practical copy',
      campaignAdaptation: 'adapt as B2B industrial ad, facility story, equipment launch, or service promo',
      objectAdaptation: 'place the promoted item within machinery, logistics, process, or facility context',
      avoid: 'avoid unsafe workplace setups, impossible machinery, and dirty visual clutter',
      qualityRules: 'keep scale believable, surfaces specific, and operational context clear'
    }
  };

  const PROMOTION_SIGNAL_PATTERNS = {
    textureRendering: [
      'pixel', 'matte', 'paper grain', 'brushstroke', 'canvas', 'halftone', 'stitch', 'fabric',
      'collage', 'grain', 'gloss', 'metal', 'glass', 'neon', 'watercolor', 'ink', 'pencil',
      'chalk', 'cross-hatching', 'stippling', 'voxel', 'clay', 'origami'
    ],
    lightingMood: [
      'dramatic', 'chiaroscuro', 'volumetric fog', 'soft warm studio lighting', 'cinematic',
      'neon', 'glowing', 'golden', 'studio lighting', 'natural light', 'single light source',
      'ambient occlusion', 'lens flare', 'bioluminescent'
    ],
    shapeLanguage: [
      'geometric', 'rounded', 'angular', 'faceted', 'organic', 'line art', 'bold outline',
      'silhouette', 'isometric', 'diagonal', 'cubic', 'flat', 'ornate', 'flowing'
    ],
    layoutBehavior: [
      'poster', 'grid', 'dynamic composition', 'isometric', 'vertical scroll', 'panel layout',
      'flat lay', 'centered', 'minimalist', 'negative space', 'wide composition', 'diagram'
    ],
    typographyGuidance: [
      'typography', 'lettering', 'calligraphy', 'blackletter', 'chalkboard', 'sign painting',
      'speech bubble', 'label', 'menu board', 'poster'
    ]
  };

  function uniqueList(items) {
    return Array.from(new Set(items.filter(Boolean)));
  }

  function findPromptSignals(style, group) {
    const source = `${style.prompt || ''} ${style.desc || ''} ${(style.tags || []).join(' ')}`.toLowerCase();
    return PROMOTION_SIGNAL_PATTERNS[group].filter(term => source.includes(term.toLowerCase()));
  }

  function addSignals(baseText, signals) {
    if (!signals.length) return baseText;
    return `${baseText}; extracted cues: ${signals.join(', ')}`;
  }

  function buildPromotionPromptParts(style) {
    const defaults = PROMOTION_PROMPT_DEFAULTS[style.category] || PROMOTION_PROMPT_DEFAULTS.modern;
    const tags = style.tags || [];
    const palette = style.palette || [];
    const paletteRoles = palette.map((hex, index) => {
      const role = ['primary', 'secondary', 'accent', 'highlight', 'support'][index] || `color ${index + 1}`;
      return `${role} ${hex}`;
    });
    const styleDNA = uniqueList([style.nameEn, style.nameKo, CAT_KO[style.category], ...tags]).join(' / ');
    const signalGroups = Object.keys(PROMOTION_SIGNAL_PATTERNS).reduce((acc, key) => {
      acc[key] = findPromptSignals(style, key);
      return acc;
    }, {});

    return {
      visualDNA: `${styleDNA}. ${style.desc}`,
      paletteStrategy: `Use the selected concept palette as campaign color roles: ${paletteRoles.join(', ')}.`,
      textureRendering: addSignals(defaults.textureRendering, signalGroups.textureRendering),
      lightingMood: addSignals(defaults.lightingMood, signalGroups.lightingMood),
      shapeLanguage: addSignals(defaults.shapeLanguage, signalGroups.shapeLanguage),
      layoutBehavior: addSignals(defaults.layoutBehavior, signalGroups.layoutBehavior),
      typographyGuidance: addSignals(defaults.typographyGuidance, signalGroups.typographyGuidance),
      campaignAdaptation: defaults.campaignAdaptation,
      objectAdaptation: defaults.objectAdaptation,
      avoid: `${defaults.avoid}; avoid losing the original style identity from the source concept.`,
      qualityRules: `${defaults.qualityRules}; preserve item-level product readability and campaign usability.`
    };
  }

  function buildPromotionConceptStyle(style) {
    const promptParts = buildPromotionPromptParts(style);
    const promotionPrompt = [
      `[Concept Style Core]`,
      `- Concept name: ${style.nameKo} / ${style.nameEn}`,
      `- Category: ${CAT_KO[style.category] || style.category}`,
      `- Visual DNA: ${promptParts.visualDNA}`,
      `- Shape language: ${promptParts.shapeLanguage}`,
      `- Texture / rendering: ${promptParts.textureRendering}`,
      `- Lighting / mood: ${promptParts.lightingMood}`,
      ``,
      `[Color System]`,
      `- Palette roles: ${promptParts.paletteStrategy}`,
      `- Keep the selected palette recognizable, but reserve the strongest contrast for headline, action button, and required information.`,
      ``,
      `[Promotion Image Adaptation]`,
      `- Campaign adaptation: ${promptParts.campaignAdaptation}`,
      `- Object / metaphor adaptation: ${promptParts.objectAdaptation}`,
      `- Layout behavior: ${promptParts.layoutBehavior}`,
      `- Typography guidance: ${promptParts.typographyGuidance}`,
      ``,
      `[Direct Field Mapping]`,
      `- visualStyle: use Visual DNA + Shape language + Texture / rendering.`,
      `- backgroundDetails: use Palette roles + Lighting / mood + Layout behavior.`,
      `- bigIdea: use Campaign adaptation to connect the concept with the promotion goal.`,
      `- visualMetaphor: use Object / metaphor adaptation as the main symbolic scene.`,
      `- qualityNotes: use Quality rules and keep text readability above decoration.`,
      `- forbiddenElements: include Avoid rules when the concept could distract from the campaign message.`,
      ``,
      `[Execution Rules]`,
      `- The selected concept must remain visibly traceable in the final image through at least three traits: palette, shape language, rendering texture, lighting, object proportion, background pattern, or information grouping.`,
      `- The promotion goal, target audience, headline meaning, and action prompt from the Promotion Image tab remain the message source of truth.`,
      `- If the source concept contains an object or sector metaphor that does not fit the current campaign, preserve the style language and replace only the object meaning.`,
      `- Avoid: ${promptParts.avoid}`,
      `- Quality rules: ${promptParts.qualityRules}`,
      ``,
      `[Source Style Prompt]`,
      `${style.prompt}`
    ].join('\n');

    return Object.assign({}, style, {
      promptParts,
      promotionPrompt,
      sourcePrompt: style.prompt
    });
  }


  function createCard(style) {
    const promotionStyle = buildPromotionConceptStyle(style);
    const displayPrompt = promotionStyle.promotionPrompt || style.prompt;
    const card = document.createElement('div');
    card.className = 'concept-card';
    card.dataset.category = style.category;
    const theme = getHeaderTheme(style.palette);
    const header = document.createElement('div');
    header.className = 'concept-card-header';
    header.style.background = buildGradient(style.palette);
    header.innerHTML = `<div class="concept-card-emoji">${style.emoji}</div><div class="concept-card-name-en" style="color:${theme.primary}">${style.nameEn}</div><div class="concept-card-name-ko" style="color:${theme.secondary}">${style.nameKo}</div><span class="concept-card-cat-badge" style="background:${theme.badge};color:${theme.badgeText}">${CAT_KO[style.category] || ''}</span>`;
    const body = document.createElement('div');
    body.className = 'concept-card-body';
    const desc = document.createElement('p');
    desc.className = 'concept-card-desc';
    desc.textContent = style.desc;
    const palette = document.createElement('div');
    palette.className = 'concept-palette';
    style.palette.forEach(hex => {
      const dot = document.createElement('div');
      dot.className = 'concept-palette-dot';
      dot.style.backgroundColor = hex;
      dot.title = hex;
      dot.innerHTML = `<span class="concept-palette-hex">${hex}</span>`;
      palette.appendChild(dot);
    });
    const tags = document.createElement('div');
    tags.className = 'concept-tags';
    style.tags.forEach(t => { const tag = document.createElement('span'); tag.className = 'concept-tag'; tag.textContent = `# ${t}`; tags.appendChild(tag); });
    const promptArea = document.createElement('div');
    promptArea.className = 'concept-prompt-area';
    const promptText = document.createElement('pre');
    promptText.className = 'concept-prompt-text';
    promptText.textContent = displayPrompt;
    const copyRow = document.createElement('div');
    copyRow.className = 'concept-copy-row';
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'concept-copy-btn';
    copyBtn.textContent = '프롬프트 복사';

    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'concept-apply-btn';
    applyBtn.textContent = '프롬프트 적용';

    const feedback = document.createElement('span');
    feedback.className = 'concept-copy-feedback';
    feedback.textContent = '✓ 복사 완료!';

    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(displayPrompt).then(() => {
        copyBtn.textContent = '✓ 복사됨'; copyBtn.classList.add('copied'); feedback.classList.add('visible');
        setTimeout(() => { copyBtn.textContent = '프롬프트 복사'; copyBtn.classList.remove('copied'); feedback.classList.remove('visible'); }, 2000);
      }).catch(() => {
        const ta = document.createElement('textarea'); ta.value = displayPrompt; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        copyBtn.textContent = '✓ 복사됨'; copyBtn.classList.add('copied'); feedback.classList.add('visible');
        setTimeout(() => { copyBtn.textContent = '프롬프트 복사'; copyBtn.classList.remove('copied'); feedback.classList.remove('visible'); }, 2000);
      });
    });

    applyBtn.addEventListener('click', () => {
      if (typeof window.applyPromotionConceptStyle === 'function') {
        window.applyPromotionConceptStyle(promotionStyle);
        const tabBtn = document.getElementById('tabBtnPromotion');
        if (tabBtn) tabBtn.click();
      } else {
        alert('홍보용 이미지 탭이 아직 준비되지 않았습니다.');
      }
    });

    copyRow.appendChild(copyBtn);
    copyRow.appendChild(applyBtn);
    copyRow.appendChild(feedback);
    promptArea.appendChild(promptText); promptArea.appendChild(copyRow);
    body.appendChild(desc); body.appendChild(palette); body.appendChild(tags); body.appendChild(promptArea);
    card.appendChild(header); card.appendChild(body);
    return card;
  }

  function renderCards(categoryId) {
    const grid = document.getElementById('conceptGrid');
    if (!grid) return;
    const filtered = categoryId === 'all' ? STYLES : STYLES.filter(s => s.category === categoryId);
    grid.innerHTML = '';
    if (filtered.length === 0) { grid.innerHTML = '<div class="concept-empty">해당 카테고리의 스타일이 없습니다.</div>'; return; }
    filtered.forEach(style => grid.appendChild(createCard(style)));
  }

  function buildFilterBar() {
    const bar = document.getElementById('conceptFilterBar');
    if (!bar) return;
    CATEGORIES.forEach(cat => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'concept-filter-btn' + (cat.id === 'all' ? ' active' : '');
      btn.textContent = cat.label;
      btn.dataset.catId = cat.id;
      btn.addEventListener('click', () => {
        activeCategory = cat.id;
        bar.querySelectorAll('.concept-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderCards(activeCategory);
      });
      bar.appendChild(btn);
    });
  }

  function init() { buildFilterBar(); renderCards('all'); }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
