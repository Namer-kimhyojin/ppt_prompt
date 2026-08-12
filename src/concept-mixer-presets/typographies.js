// 비주얼 믹서 프리셋 - 타이포그래피
(function () {
  const TYPOGRAPHY_CATEGORIES = [
    { id: 'sans',         label: '🔤 산세리프' },
    { id: 'serif',        label: '📖 세리프' },
    { id: 'display',      label: '🖼️ 디스플레이' },
    { id: 'script',       label: '✍️ 캘리그라피' },
    { id: 'experimental', label: '🧪 실험적' }
  ];

  const MIXER_TYPOGRAPHIES = [
    { id: 'none', category: 'all', nameKo: '선택 안 함', emoji: '❌', desc: '별도의 타이포그래피 스타일을 지정하지 않고 기본 화풍의 텍스트 처리를 따릅니다.', prompt: '' },

    // 산세리프 (Sans-serif) - 5종
    { id: 'typo-geometric-sans', category: 'sans', nameKo: '기하학 그로테스크', emoji: '🔷', desc: 'Bauhaus 영향을 받은 완벽한 원형 O와 정교한 비율의 기하학적 산세리프. 타이트한 자간과 현대적 미니멀 감각.', prompt: 'geometric sans-serif headline typography, Bauhaus-influenced letterforms, perfect circular O, tight letter spacing, clean modern minimal type treatment' },
    { id: 'typo-humanist-sans', category: 'sans', nameKo: '인본주의적 산세리프', emoji: '🤝', desc: '따뜻한 시각적 보정이 가해진 인본주의적 산세리프. 약간 변화하는 획 두께로 읽기 편하고 접근감이 높다.', prompt: 'humanist sans-serif type treatment, warm optical corrections, subtly varied stroke widths, highly readable approachable letterforms, editorial warmth' },
    { id: 'typo-neo-grotesque', category: 'sans', nameKo: '네오 그로테스크', emoji: '🏢', desc: '획 굵기가 균일한 중립적 네오 그로테스크. 닫힌 개구부와 기계적 정밀감으로 기업·관공서 인쇄물에 적합.', prompt: 'neutral neo-grotesque sans-serif typography, uniform stroke weight, closed apertures, neutral corporate precision, Helvetica-style systematic letterforms' },
    { id: 'typo-condensed-impact', category: 'sans', nameKo: '초압축 임팩트 산세리프', emoji: '📌', desc: '세로 공간을 꽉 채우는 극단적 압축 헤비 산세리프. 최대 무게감으로 포스터 헤드라인을 지배한다.', prompt: 'ultra-condensed heavy sans-serif headline, extreme vertical compression, massive type weight, letters filling vertical space, powerful poster impact typography' },
    { id: 'typo-rounded-soft', category: 'sans', nameKo: '둥근 산세리프', emoji: '🫧', desc: '끝마감이 부드럽게 처리된 둥근 산세리프. 친근하고 유연한 곡선으로 소비재·라이프스타일 브랜드에 자주 쓰인다.', prompt: 'rounded sans-serif letterforms, soft rounded terminal endings, friendly approachable curves, gentle playful type treatment, warm consumer-brand typography' },

    // 세리프 (Serif) - 4종
    { id: 'typo-modern-serif', category: 'serif', nameKo: '모던 하이콘트라스트 세리프', emoji: '🎩', desc: '극도로 얇은 가로획과 굵은 세로획의 극단적 대비. Bodoni·Didot 스타일의 드라마틱한 럭셔리 세리프.', prompt: 'high-contrast modern serif typography, razor-thin horizontal hairlines and thick vertical stems, dramatic Bodoni or Didot style letterforms, luxury editorial headline' },
    { id: 'typo-old-style', category: 'serif', nameKo: '올드스타일 세리프', emoji: '📜', desc: '사선 축과 낮은 획 대비의 인본주의적 올드스타일 세리프. Garamond·Caslon 계열의 따뜻한 고전적 질감.', prompt: 'old-style humanist serif typography, oblique stress axis, low stroke contrast, bracketed serifs, warm classical Garamond or Caslon-inspired type texture' },
    { id: 'typo-slab-serif', category: 'serif', nameKo: '슬랩 세리프', emoji: '🧱', desc: '두꺼운 직사각형 세리프와 강한 가로 리듬. Rockwell·Clarendon 계열의 산업적·에디토리얼 무게감.', prompt: 'bold slab serif typography, heavy rectangular serifs, strong horizontal rhythm, industrial editorial weight, Clarendon or Rockwell-inspired letterforms' },
    { id: 'typo-transitional', category: 'serif', nameKo: '과도기 세리프', emoji: '⚖️', desc: '수직 축과 중간 획 대비의 균형잡힌 과도기 세리프. Times·Baskerville 계열의 클래식하고 신뢰감 있는 인상.', prompt: 'transitional serif typography, moderate stroke contrast, vertical stress axis, balanced classical proportions, Times or Baskerville-style trustworthy letterforms' },

    // 디스플레이 (Display) - 5종
    { id: 'typo-ultra-black', category: 'display', nameKo: '울트라 블랙 포스터', emoji: '💪', desc: '글자들이 맞닿을 정도로 최대 무게의 디스플레이 타입. 헤드라인 존을 완전히 점령하는 포스터 파워.', prompt: 'ultra-black display poster typography, maximum font weight, nearly touching letterforms, fills the entire headline zone, raw overwhelming poster type power, tight tracking' },
    { id: 'typo-inline-vintage', category: 'display', nameKo: '빈티지 인라인 장식체', emoji: '🎪', desc: '두꺼운 글자 안에 가는 흰 선이 달리는 아르데코 인라인 세리프. 1920~40년대 쇼포스터의 화려함.', prompt: 'Art Deco inline serif display typography, fine white highlight line running through thick letterforms, 1920s-1940s glamour show poster style, decorative vintage inline type' },
    { id: 'typo-wood-type', category: 'display', nameKo: '우드 타입 레터프레스', emoji: '🪵', desc: '인쇄 압력으로 종이에 스며든 잉크 질감의 레터프레스 우드 타입. 장인적 수공예 포스터 감성.', prompt: 'letterpress wood type printed typography, ink impression texture, slight paper deboss, rustic craft poster quality, handmade artisan print aesthetic' },
    { id: 'typo-stencil', category: 'display', nameKo: '스텐실 군용체', emoji: '🪖', desc: '스텐실 브릿지 틈새가 획에 남아있는 군용·산업 스텐실 레터링. 유틸리테리안적 거칠고 단단한 인상.', prompt: 'military-style stencil lettering typography, bridge gaps in strokes where stencil bridges are, industrial utilitarian roughness, cargo crate or military equipment lettering feel' },
    { id: 'typo-outlined-hollow', category: 'display', nameKo: '아웃라인 중공 타입', emoji: '⬡', desc: '획만 남기고 속을 비운 홀로우 아웃라인 레터폼. 배경이 보이는 깨끗한 그래픽 네거티브 스페이스.', prompt: 'hollow outlined letterforms, stroke-only characters with no fill, clean graphic negative space visible through letters, modern editorial outline type treatment' },

    // 캘리그라피/필기 (Script) - 4종
    { id: 'typo-brush-script', category: 'script', nameKo: '브러시 캘리그라피', emoji: '🖌️', desc: '붓털 자국이 살아있는 표현적 브러시 캘리그라피. 잉크 농담 변화와 역동적인 움직임 에너지가 넘친다.', prompt: 'expressive brush calligraphy lettering, visible bristle marks, ink variation and pooling, dynamic movement and gestural energy, hand-painted calligraphic type' },
    { id: 'typo-ink-brush', category: 'script', nameKo: '먹 붓글씨', emoji: '🎋', desc: '필압과 수분량이 느껴지는 동아시아 먹 붓글씨. 굵고 과감한 붓놀림과 여백의 철학적 미니멀리즘.', prompt: 'East Asian ink brush calligraphy, bold gestural brushwork, varying pressure and moisture effects, philosophical minimalism, sumi-e ink wash painting typography style' },
    { id: 'typo-handwritten', category: 'script', nameKo: '캐주얼 손글씨', emoji: '✏️', desc: '베이스라인이 자연스럽게 흔들리는 캐주얼 손글씨. 유기적이고 불완전한 글자 모양이 개인적인 따뜻함을 전한다.', prompt: 'casual handwritten lettering, natural baseline variation, organic imperfect character shapes, personal warmth and informality, hand-lettered greeting card style' },
    { id: 'typo-copperplate', category: 'script', nameKo: '카퍼플레이트 정자체', emoji: '🏅', desc: '올라가는 획은 극세 헤어라인, 내려가는 획은 팽창하는 공식 카퍼플레이트 스크립트. 조각된 인그레이빙의 품격.', prompt: 'formal copperplate script typography, hairline upstrokes and swelling downstrokes, elegant engraved quality, meticulous precision, wedding invitation or luxury certificate script' },

    // 실험적 (Experimental) - 7종
    { id: 'typo-3d-extrude', category: 'experimental', nameKo: '3D 돌출 입체 타이포', emoji: '🧊', desc: '측면 면과 깊이감이 드러나는 3D 돌출 레터폼. 극적인 캐스트 그림자와 입체감이 화면에서 튀어나오는 볼류메트릭 타입.', prompt: 'three-dimensional extruded letterforms with visible depth and side faces, dramatic cast shadows, volumetric type treatment, 3D type design, letters with strong physical presence' },
    { id: 'typo-glitch-text', category: 'experimental', nameKo: '글리치 텍스트', emoji: '📺', desc: 'RGB 채널 오프셋, 픽셀 변위, 스캔라인 아티팩트가 뒤섞인 디지털 글리치 타이포그라피. 손상된 데이터 미학.', prompt: 'digital glitch typography, RGB color channel offset and shift, pixel displacement artifacts, scan line distortion, corrupted data aesthetic, digital error lettering style' },
    { id: 'typo-graffiti', category: 'experimental', nameKo: '그래피티 스트리트', emoji: '🎨', desc: '와일드 스타일 레터링에 멀티 레이어 아웃라인과 스프레이 페인트 질감이 더해진 도시 그래피티 레터링.', prompt: 'urban graffiti lettering with wild style fills, multiple outline layers, spray paint texture and drips, street art energy, bold colorful street lettering' },
    { id: 'typo-neon-sign', category: 'experimental', nameKo: '네온 사인 타입', emoji: '💡', desc: '유리 튜브가 글자 형태로 구부러진 발광 네온 사인 레터폼. 부드러운 후광 글로와 빛 번짐이 살아있다.', prompt: 'glowing neon tube letterforms, neon sign typography, soft halo glow and light bloom, glass tube bending to form letters, warm or cold neon color illumination, retro diner signage aesthetic' },
    { id: 'typo-futuristic-hud', category: 'experimental', nameKo: 'HUD 미래형 인터페이스', emoji: '🎯', desc: 'SF 헤즈업 디스플레이의 얇은 모노스페이스 기술체, 타겟팅 브래킷, 디지털 리드아웃 미학.', prompt: 'futuristic heads-up display typography, thin monospaced technical font, targeting brackets and reticle elements, digital readout numbers, sci-fi HUD interface text treatment' },
    { id: 'typo-kinetic', category: 'experimental', nameKo: '키네틱 모션 타이포', emoji: '💨', desc: '모션 블러 트레일과 속도선을 동반한 키네틱 타이포그라피. 글자들이 화면을 가로질러 이동하는 역동적 에너지.', prompt: 'kinetic typography with motion blur trails, dynamic velocity lines and speed streaks, letters in visible movement, motion design frozen frame, energetic typographic motion' },
    { id: 'typo-layered-overlap', category: 'experimental', nameKo: '레이어드 오버랩', emoji: '🔀', desc: '서로 다른 불투명도의 레이어로 겹쳐진 반투명 타이포그라피. 투명도를 통한 깊이감과 다중 타입 면 구성.', prompt: 'layered overlapping translucent letterforms, multiple type planes at different opacities, depth through transparency, semi-transparent letter stacking, deconstructed typographic composition' },

    // 산세리프 추가 5종
    { id: 'typo-extended-wide', category: 'sans', nameKo: '초확장 와이드 산세리프', emoji: '↔️', desc: '글자 폭이 극도로 넓게 확장된 와이드 산세리프. 수평선이 강조되어 기념비적·공공시설 현판 느낌을 준다.', prompt: 'ultra-extended wide sans-serif typography, extremely wide letter proportions, strong horizontal emphasis, monumental institutional headline feel, expanded grotesque letterforms' },
    { id: 'typo-compressed-narrow', category: 'sans', nameKo: '초압축 협소 그로테스크', emoji: '↕️', desc: '세로가 강조된 초협소 그로테스크. 좁은 너비로 좁은 공간에 많은 정보를 담는 신문·타블로이드 스타일.', prompt: 'ultra-compressed narrow grotesque sans-serif, extremely narrow letter width, vertical emphasis, newspaper tabloid headline style, maximum information density typography' },
    { id: 'typo-variable-display', category: 'sans', nameKo: '가변 디스플레이 폰트', emoji: '🎚️', desc: '굵기·너비·기울기가 단계적으로 변하는 가변 폰트 표현. 서로 다른 웨이트가 한 단어 안에서 공존하는 현대적 타이포.', prompt: 'variable font display typography, multiple font weights blending within a single word or line, weight axis variation from ultra-thin to ultra-bold, contemporary OpenType variable font expression' },
    { id: 'typo-display-grotesque', category: 'sans', nameKo: '디스플레이 그로테스크', emoji: '🎬', desc: '대형 디스플레이 용도로 설계된 강한 눈썹 느낌의 그로테스크. 거친 엣지와 극적 대비로 헤드라인 존재감을 극대화한다.', prompt: 'display grotesque sans-serif, heavy strong headline presence, ink-trap details at tight joins, rugged editorial grotesque with dramatic weight contrast, oversized headline hierarchy' },
    { id: 'typo-mono-technical', category: 'sans', nameKo: '기술 모노스페이스', emoji: '💻', desc: '코드·계기판·터미널에서 볼 수 있는 고정 폭 모노스페이스 타입. 균일한 격자 리듬과 기계적 정밀감.', prompt: 'monospace technical typography, fixed-width letterforms, terminal or code editor aesthetic, uniform grid rhythm, mechanical precision, data readout or technical specification type treatment' },

    // 세리프 추가 3종
    { id: 'typo-wedge-serif', category: 'serif', nameKo: '웨지 세리프 (라피다리)', emoji: '🏛️', desc: '고대 로마 석판 비문에서 유래한 쐐기형 세리프. 돌을 깎아 새긴 듯한 기념비적이고 엄숙한 품격.', prompt: 'wedge serif lapidary inscription typography, chiseled stone-carved letterforms, wedge-shaped triangular serifs, monumental Roman inscription quality, authoritative classical gravitas' },
    { id: 'typo-hairline-thin', category: 'serif', nameKo: '초극세 헤어라인 세리프', emoji: '🪡', desc: '모든 획이 극세 헤어라인으로 통일된 초경량 세리프. 고급 명품 브랜드의 여리고 정제된 우아함.', prompt: 'ultra-thin hairline serif typography, all strokes reduced to hair-width, luxury fashion brand elegance, extreme delicacy and refinement, editorial minimalist serif lettering' },
    { id: 'typo-clarendon-expanded', category: 'serif', nameKo: '클라렌던 확장형 슬랩', emoji: '📰', desc: '너비가 넓고 세리프가 두꺼운 확장형 클라렌던. 빅토리아 시대 신문 광고의 호방하고 자신감 넘치는 임팩트.', prompt: 'expanded Clarendon slab serif typography, wide letterforms with heavy bracketed serifs, Victorian newspaper advertising impact, confident bold announcement poster type' },

    // 디스플레이 추가 5종
    { id: 'typo-art-nouveau', category: 'display', nameKo: '아르누보 유기체 장식체', emoji: '🌿', desc: '넝쿨과 꽃을 모티프로 한 곡선 장식이 획 자체에 통합된 아르누보 장식 레터링.', prompt: 'Art Nouveau organic decorative lettering, floral and vine motifs integrated into letterforms, sinuous curved ornamental strokes, Belle Epoque poster typography, botanical illustration quality type' },
    { id: 'typo-bauhaus-block', category: 'display', nameKo: '바우하우스 구성주의 블록체', emoji: '🟥', desc: '원·삼각·사각으로만 글자를 조합하는 바우하우스 구성주의 기하학 레터링. 순수 기하 형태의 이상을 구현한다.', prompt: 'Bauhaus constructivist geometric letterforms, letters built exclusively from circle, triangle, and square primitives, experimental alphabet design, De Stijl graphic modernism type' },
    { id: 'typo-retro-diner', category: 'display', nameKo: '레트로 다이너 사인 타입', emoji: '🍔', desc: '1950~60년대 미국 다이너 간판에서 영감받은 둥글고 두꺼운 레트로 스크립트 믹스 타입.', prompt: 'retro American diner sign lettering, 1950s-1960s chrome and neon sign typography, bouncy rounded script mixed with bold block letters, nostalgic mid-century roadside americana type' },
    { id: 'typo-psychedelic-warp', category: 'display', nameKo: '사이키델릭 왜곡 타입', emoji: '🎡', desc: '글자 형태가 물결·소용돌이·왜곡으로 녹아드는 1960년대 사이키델릭 록 포스터 스타일 레터링.', prompt: 'psychedelic warped lettering, 1960s rock concert poster style, melting and flowing letter distortions, swirling optical illusion typography, liquid psychedelic art typography' },
    { id: 'typo-swiss-international', category: 'display', nameKo: '스위스 국제주의 타입', emoji: '🗂️', desc: '그리드 시스템에 철저히 기반한 스위스 국제주의 타이포그라피. 엄밀한 여백과 Helvetica계 중립 서체의 조화.', prompt: 'Swiss International Style typography, strict grid-based layout, neutral grotesque typeface in careful spatial hierarchy, Zurich design school precision, negative space as active compositional element' },

    // 캘리그라피/필기 추가 4종
    { id: 'typo-formal-italic', category: 'script', nameKo: '포멀 이탤릭 필기체', emoji: '✒️', desc: '기울어진 타원축과 일관된 펜각으로 작성된 점잖은 포멀 이탤릭 필기체. 공식 문서·증서·초대장의 품격.', prompt: 'formal italic script handwriting, consistent pen angle and oval axis, elegant chancery italic letterforms, official certificate or invitation quality calligraphic script' },
    { id: 'typo-rough-marker', category: 'script', nameKo: '거친 마커 브러시', emoji: '🖊️', desc: '굵은 마커펜으로 빠르게 쓴 거칠고 즉흥적인 레터링. 잉크 퍼짐과 마모 질감이 에너지와 긴박감을 준다.', prompt: 'rough marker brush lettering, thick marker pen strokes with visible ink bleeding and wear texture, spontaneous rapid gestural lettering, energetic urgency hand-drawn quality' },
    { id: 'typo-chalk-casual', category: 'script', nameKo: '캐주얼 분필 손글씨', emoji: '🖍️', desc: '칠판에 적은 듯 분필 가루가 떨어지는 캐주얼하고 친근한 분필 손글씨 스타일.', prompt: 'casual chalkboard handwriting typography, chalk dust texture and granular line quality, natural imperfection of chalk on blackboard, friendly approachable menu board or classroom aesthetic' },
    { id: 'typo-flourish-script', category: 'script', nameKo: '플러리시 장식 스크립트', emoji: '🌸', desc: '글자 앞뒤에 화려한 장식 선이 휘감기는 플러리시 스크립트. 청첩장·기념품의 낭만적 과장된 화려함.', prompt: 'ornate flourish script with elaborate decorative swashes and curling strokes before and after letters, romantic wedding invitation quality, over-the-top decorative calligraphic script' },

    // 실험적 추가 8종
    { id: 'typo-fragmented', category: 'experimental', nameKo: '파편화 분열 타입', emoji: '💥', desc: '글자가 산산조각 나서 파편들이 폭발처럼 흩어지는 분열 타이포그라피. 극적 에너지와 붕괴의 미학.', prompt: 'fragmented shattered letterforms, letters broken into scattered debris pieces, explosive typographic destruction aesthetic, high-energy visual impact with fragmented type chaos' },
    { id: 'typo-gradient-blend', category: 'experimental', nameKo: '그라디언트 블렌드 타입', emoji: '🌈', desc: '글자 획 내부에 복잡한 그라디언트 색상이 흐르는 그라디언트 타이포그라피.', prompt: 'gradient fill typography with complex color transitions flowing through letterforms, vibrant multi-color gradient inside strokes, modern digital gradient type treatment' },
    { id: 'typo-chrome-metallic', category: 'experimental', nameKo: '크롬 메탈릭 반사 타입', emoji: '🔩', desc: '거울처럼 반짝이는 크롬 금속 재질로 렌더링된 레터폼. 하이라이트와 리플렉션이 화려한 메탈릭 3D 타입.', prompt: 'chrome metallic reflective letterforms, mirror-polished metal surface rendering, specular highlights and environmental reflections, luxury chrome type treatment, automotive chrome badge quality' },
    { id: 'typo-ice-crystal', category: 'experimental', nameKo: '빙정 크리스탈 타이포', emoji: '❄️', desc: '얼음 결정 구조로 이루어진 반투명하고 굴절감 있는 크리스탈 레터폼. 차갑고 정교한 빙설의 미학.', prompt: 'ice crystal typography, letterforms composed of frost and ice crystal structures, translucent refraction and cold blue internal glow, frozen crystalline letter surfaces, arctic aesthetic type' },
    { id: 'typo-vintage-distressed', category: 'experimental', nameKo: '빈티지 마모 손상체', emoji: '📦', desc: '오랜 세월 인쇄된 글자처럼 잉크가 떨어지고 마모·균열이 생긴 손상된 빈티지 레터프레스 타입.', prompt: 'vintage distressed typography, worn and aged letterforms with missing ink patches, erosion cracks and printing imperfections, antique weathered type, letterpress breakdown and wear effects' },
    { id: 'typo-typewriter', category: 'experimental', nameKo: '타자기 모노 인쇄체', emoji: '⌨️', desc: '타자기 잉크리본의 불균일한 압력과 키 정렬 오차가 남아있는 타자기 모노 타입. 아날로그 기계 글씨의 감성.', prompt: 'vintage typewriter monospace typography, uneven ink ribbon impression with key alignment variations, mechanical typing artifacts, analog typewriter aesthetic with individual character pressure variation' },
    { id: 'typo-shadow-stack', category: 'experimental', nameKo: '중층 그림자 스택 타입', emoji: '🗃️', desc: '여러 개의 그림자 레이어가 방향과 색깔을 달리하며 쌓인 입체적 그림자 스택 타이포그라피.', prompt: 'multi-layered shadow stack typography, multiple drop shadows at different angles and colors creating depth illusion, graphic shadow composition, retro shadow letterform stacking technique' },
    { id: 'typo-fire-smoke', category: 'experimental', nameKo: '불꽃·연기 타이포', emoji: '🔥', desc: '글자 형태에서 실제 불꽃이 타오르거나 연기가 피어오르는 원소 타이포그라피. 뜨거운 열기와 에너지.', prompt: 'fire and smoke elemental typography, letterforms engulfed in realistic flames or rising smoke wisps, combustion energy visual, hot ember glow at base, cinematic fire type treatment' }
  ];

  const MIXER_TYPOGRAPHY_SAMPLES = {
    'typo-geometric-sans':    'photo-1561070791-2526d30994b5',
    'typo-humanist-sans':     'photo-1455390582262-044cdead277a',
    'typo-neo-grotesque':     'photo-1618556450994-a6a128ef0d9d',
    'typo-condensed-impact':  'photo-1504711434969-e33886168f5c',
    'typo-rounded-soft':      'photo-1516259762381-22954d7d3ad2',
    'typo-modern-serif':      'photo-1543002588-bfa74002ed7e',
    'typo-old-style':         'photo-1553729459-efe14ef6055d',
    'typo-slab-serif':        'photo-1450101499163-c8848c66ca85',
    'typo-transitional':      'photo-1519791883288-dc8bd696e667',
    'typo-ultra-black':       'photo-1504711434969-e33886168f5c',
    'typo-inline-vintage':    'photo-1558618666-fcd25c85cd64',
    'typo-wood-type':         'photo-1457369804613-52c61a468e7d',
    'typo-stencil':           'photo-1580196969807-cc6de06c05be',
    'typo-outlined-hollow':   'photo-1618556450994-a6a128ef0d9d',
    'typo-brush-script':      'photo-1503614472-8c93d56e92ce',
    'typo-ink-brush':         'photo-1471666875520-c75081f42081',
    'typo-handwritten':       'photo-1455390582262-044cdead277a',
    'typo-copperplate':       'photo-1543002588-bfa74002ed7e',
    'typo-3d-extrude':        'photo-1618556450994-a6a128ef0d9d',
    'typo-glitch-text':       'photo-1526374965328-7f61d4dc18c5',
    'typo-graffiti':          'photo-1499781350541-7783f6c6a0c8',
    'typo-neon-sign':         'photo-1493976040374-85c8e12f0c0e',
    'typo-futuristic-hud':    'photo-1535223289827-42f1e9919769',
    'typo-kinetic':           'photo-1557672172-298e090bd0f1',
    'typo-layered-overlap':   'photo-1561070791-2526d30994b5',

    // sans 추가 5종
    'typo-extended-wide':       'photo-1614107151491-6876eecbff89',
    'typo-compressed-narrow':   'photo-1504711434969-e33886168f5c',
    'typo-variable-display':    'photo-1561070791-2526d30994b5',
    'typo-display-grotesque':   'photo-1618556450994-a6a128ef0d9d',
    'typo-mono-technical':      'photo-1526374965328-7f61d4dc18c5',

    // serif 추가 3종
    'typo-wedge-serif':         'photo-1558618666-fcd25c85cd64',
    'typo-hairline-thin':       'photo-1543002588-bfa74002ed7e',
    'typo-clarendon-expanded':  'photo-1450101499163-c8848c66ca85',

    // display 추가 5종
    'typo-art-nouveau':         'photo-1503614472-8c93d56e92ce',
    'typo-bauhaus-block':       'photo-1541701494587-cb58502866ab',
    'typo-retro-diner':         'photo-1499781350541-7783f6c6a0c8',
    'typo-psychedelic-warp':    'photo-1557672172-298e090bd0f1',
    'typo-swiss-international': 'photo-1455390582262-044cdead277a',

    // script 추가 4종
    'typo-formal-italic':       'photo-1543002588-bfa74002ed7e',
    'typo-rough-marker':        'photo-1471666875520-c75081f42081',
    'typo-chalk-casual':        'photo-1457369804613-52c61a468e7d',
    'typo-flourish-script':     'photo-1503614472-8c93d56e92ce',

    // experimental 추가 8종
    'typo-fragmented':          'photo-1526374965328-7f61d4dc18c5',
    'typo-gradient-blend':      'photo-1557672172-298e090bd0f1',
    'typo-chrome-metallic':     'photo-1580196969807-cc6de06c05be',
    'typo-ice-crystal':         'photo-1516912481808-3406841bd33c',
    'typo-vintage-distressed':  'photo-1457369804613-52c61a468e7d',
    'typo-typewriter':          'photo-1519791883288-dc8bd696e667',
    'typo-shadow-stack':        'photo-1504711434969-e33886168f5c',
    'typo-fire-smoke':          'photo-1467810563316-b5476525c0f9'
  };

  Object.assign(window.CONCEPT_MIXER_PRESETS, {
    TYPOGRAPHY_CATEGORIES,
    MIXER_TYPOGRAPHIES,
    MIXER_TYPOGRAPHY_SAMPLES,
  });
})();
