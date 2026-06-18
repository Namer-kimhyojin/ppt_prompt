// 다차원 화풍 믹서 (Visual Style Mixer) — 사용자 중심 UI/UX 고도화 버전
(function () {
  // 1. 비주얼 주제 (Subject) 데이터 (8대 도메인 × 8종 = 64종)
  const MIXER_SUBJECTS = {
    steel: [
      {
        id: 'mix-steel-hot-rolling',
        nameKo: '용광로 쇳물 압연',
        emoji: '🔥',
        desc: '붉게 달아오른 쇳물 판재와 대형 압연 롤러.',
        prompt: 'intense glowing-orange molten steel slab passing through heavy industrial roller cylinders in a hot rolling mill, with showers of sparks and heat haze'
      },
      {
        id: 'mix-steel-continuous-casting',
        nameKo: '연속 주조 슬래브',
        emoji: '🏗️',
        desc: '액강이 서서히 응고되어 슬래브로 주조되는 조업.',
        prompt: 'a continuous casting machine solidifying molten steel into rectangular slabs, showing glowing red-hot core and vapor steam rising'
      },
      {
        id: 'mix-steel-cold-coil',
        nameKo: '고장력 냉연 강판 코일',
        emoji: '🔩',
        desc: '정밀 가공된 실버 강판 코일의 동심원 적재.',
        prompt: 'rows of large, neatly rolled metallic silver cold-rolled steel coils, showing sharp reflections and concentric circular textures'
      },
      {
        id: 'mix-steel-heavy-plate',
        nameKo: '선박 조선 기자재 후판',
        emoji: '🚢',
        desc: '조선소 후판 용접 시의 불꽃 and 대형 선체 프레임.',
        prompt: 'massive heavy plate steel sheets being welded and cut at a shipyard dock, with brilliant orange welding sparks arching near a giant ship hull'
      },
      {
        id: 'mix-steel-blast-furnace',
        nameKo: '고로 제선 조업',
        emoji: '🌋',
        desc: '웅장한 용광로 밑단에서 시뻘건 용암처럼 흘러내리는 쇳물.',
        prompt: 'a massive industrial blast furnace with molten pig iron pouring out like glowing orange lava into a transport ladle, surrounded by towering steel pipes, intense heat glow, and heavy machinery'
      },
      {
        id: 'mix-steel-wire-rod',
        nameKo: '고속 선재 코일 압연',
        emoji: '➰',
        desc: '고속으로 회전하며 감기는 벌갛게 달아오른 철사 선재 코일.',
        prompt: 'a high-speed wire rod mill winding glowing red-hot steel wire into tight coils on a spinning mandrel, bright sparks flying, industrial machinery, mechanical gears'
      },
      {
        id: 'mix-steel-smart-factory',
        nameKo: '제철 스마트 팩토리',
        emoji: '🤖',
        desc: '협동 로봇과 디지털 트윈 화면이 결합된 스마트 제철 공정.',
        prompt: 'a futuristic smart steel factory control room with holographic 3D digital twin displays showing real-time steelmaking processes, and autonomous robotic arms working along the conveyor belt'
      },
      {
        id: 'mix-steel-scrap-recycling',
        nameKo: '친환경 전기로 재활용',
        emoji: '♻️',
        desc: '철스크랩을 전극봉 아크열로 녹여 강재를 재생하는 친환경 전기로.',
        prompt: 'a high-tech electric arc furnace melting steel scrap with bright purple and blue electrical arcs, glowing molten steel swirling inside, green energy concepts, steam rising'
      }
    ],
    energy: [
      {
        id: 'mix-energy-lithium',
        nameKo: '리튬 이온 배터리 셀',
        emoji: '🔋',
        desc: '배터리 팩의 실린더형 셀 정렬과 이온 이동.',
        prompt: 'the inner structure of a lithium-ion battery showing multiple cylindrical cells aligned with electrical ions moving between cathode and anode layers'
      },
      {
        id: 'mix-energy-solidstate',
        nameKo: '차세대 전고체 배터리',
        emoji: '⚡',
        desc: '덴드라이트가 억제된 결정질 고체 전해질 구조.',
        prompt: 'a solid-state battery with glowing lithium ions moving smoothly through a dense, structured crystalline solid electrolyte layer, metallic electrodes'
      },
      {
        id: 'mix-energy-electrolysis',
        nameKo: '그린수소 수전해 생산',
        emoji: '🧪',
        desc: '물(H2O)이 수소와 산소로 전기분해되는 메쉬.',
        prompt: 'water electrolysis splitting water molecules into glowing hydrogen bubbles and oxygen bubbles on a high-tech catalytic mesh anode and cathode'
      },
      {
        id: 'mix-energy-fuelcell',
        nameKo: '수소 연료전지 스택',
        emoji: '⚙️',
        desc: '막전극접합체(MEA)의 수소-산소 촉매 반응.',
        prompt: 'a fuel cell stack showing membrane electrode assembly (MEA) plates reacting hydrogen and oxygen to generate electricity and water droplets'
      },
      {
        id: 'mix-energy-solar-perovskite',
        nameKo: '페로브스카이트 태양전지',
        emoji: '☀️',
        desc: '기존 실리콘을 대체하는 유연하고 투명한 차세대 태양광 패널.',
        prompt: 'flexible and semi-transparent perovskite solar cells with a glowing iridescent rainbow-colored crystalline film texture, capturing sunlight under a clear blue sky'
      },
      {
        id: 'mix-energy-wind-offshore',
        nameKo: '부유식 해상 풍력 발전',
        emoji: '🌬️',
        desc: '끝없는 푸른 바다 위에 우뚝 솟은 친환경 대형 해상 풍력 터빈.',
        prompt: 'massive offshore floating wind turbines spinning slowly over a deep blue ocean with crashing white waves, bright sunny day, dramatic clouds, showcasing clean renewable energy'
      },
      {
        id: 'mix-energy-ess-grid',
        nameKo: '대용량 에너지 저장 장치 (ESS)',
        emoji: '🎛️',
        desc: '스마트 그리드 송전선로와 연결된 컨테이너형 대용량 배터리 단지.',
        prompt: 'a large grid-scale energy storage system (ESS) showing rows of sleek white battery containers with glowing green power indicators, connected to electric power lines under sunset sky'
      },
      {
        id: 'mix-energy-ammonia-combustion',
        nameKo: '청정 암모니아 발전',
        emoji: '💨',
        desc: '석탄이나 가스 대신 암모니아를 섞어 태우는 무탄소 친환경 연소 화염.',
        prompt: 'a clean ammonia-hydrogen combustion flame inside an industrial boiler, showing a distinct bright blue and violet burning flame with zero carbon emission, advanced energy technology'
      }
    ],
    software: [
      {
        id: 'mix-soft-ai-brain',
        nameKo: '인공지능 가상 두뇌',
        emoji: '🧠',
        desc: '뇌 형상 위의 실리콘 칩과 뉴런 시냅스망.',
        prompt: 'a complex artificial intelligence brain structure floating, created from glowing light nodes, microchips, and fiber-optic neural pathways'
      },
      {
        id: 'mix-soft-vision',
        nameKo: '컴퓨터 비전 객체 인식',
        emoji: '👁️',
        desc: '도로 위 오브젝트를 감지하는 형광 바운딩 박스.',
        prompt: 'real-time computer vision object detection overlay, displaying bounding boxes, target vectors, and segmented masks on urban street view objects'
      },
      {
        id: 'mix-soft-sdv',
        nameKo: '소프트웨어 정의 자동차',
        emoji: '🚗',
        desc: '전기차 아키텍처 위로 내려오는 무선 OTA 데이터.',
        prompt: 'a glowing 3D wireframe outline of a luxury electric car showcasing its inner software architecture blocks with light-beam ripples of OTA data updates'
      },
      {
        id: 'mix-soft-datacenter',
        nameKo: '하이퍼스케일 데이터센터',
        emoji: '🏢',
        desc: '끝없는 서버 랙 통로와 정밀 공기 순환 루프.',
        prompt: 'rows of server racks with flashing blue and green LED status lights, optical fiber cable trays suspended from high ceiling'
      },
      {
        id: 'mix-software-quantum',
        nameKo: '양자 컴퓨팅 프로토콜',
        emoji: '🔮',
        desc: '초저온 희석 냉동기 금빛 샹들리에 구조와 양자 비트 격자.',
        prompt: 'a gold-plated quantum computer dilution refrigerator structure, illuminated with glowing cyan and violet laser paths, showing 3D quantum qubits entangled in a grid lattice'
      },
      {
        id: 'mix-software-cyber-defense',
        nameKo: '사이버 보안 방어망',
        emoji: '🛡️',
        desc: '해킹 위협을 실시간 차단하는 입체 보안 장벽과 네트워크 노드.',
        prompt: 'a glowing 3D digital shield defending a complex network grid from incoming red data packets, showing light trails, cybersecurity encryption keys, and cyber defense codes'
      },
      {
        id: 'mix-software-metaverse',
        nameKo: '메타버스 디지털 트윈',
        emoji: '🕶️',
        desc: '현실과 가상이 융합된 무한한 복셀 공간과 사용자 아바타.',
        prompt: 'a dynamic 3D virtual environment with neon voxel grids, floating holographic user interfaces, and glowing abstract silhouettes interacting with virtual objects'
      },
      {
        id: 'mix-software-blockchain',
        nameKo: '블록체인 분산 데이터',
        emoji: '🔗',
        desc: '암호학적 체인으로 연결된 자가 발광 트랜잭션 블록 구조.',
        prompt: 'a chain of translucent glowing crystalline data blocks connected by bright laser beams, representing decentralized blockchain ledger technology, microchip pattern on surface'
      }
    ],
    bio: [
      {
        id: 'mix-bio-cell',
        nameKo: '나노 세포 현미경',
        emoji: '🔬',
        desc: '세포막 구조와 나노 입자의 상호작용.',
        prompt: 'clear scientific visualization of nanoscale cellular structures and molecular bonds under an advanced electron microscope, showing nanoparticles interacting with cells'
      },
      {
        id: 'mix-bio-cybernetic',
        nameKo: '유기적 사이버네틱스 의수',
        emoji: '🦾',
        desc: '인체 조직과 카본 파이버, 기계 구동부의 융합.',
        prompt: 'a cybernetic hand blending organic human skin with sleek mechanical carbon fiber plating and glowing fiber-optic wires'
      },
      {
        id: 'mix-bio-dna',
        nameKo: '유전자 DNA 이중 나선',
        emoji: '🧬',
        desc: '입체적으로 회전하는 유전자 구조와 빛 가루.',
        prompt: 'a double helix DNA strand twisting vertically, surrounded by luminous glowing particles and sparkling genetic dust'
      },
      {
        id: 'mix-bio-petri',
        nameKo: '페트리 접시 생물 배양',
        emoji: '🧫',
        desc: '자가 발광 박테리아 유체의 유기적 문양 패턴.',
        prompt: 'bioluminescent bacterial cultures and crystalline micro-organisms growing in a circular petri dish with neon fluid patterns'
      },
      {
        id: 'mix-bio-brain-link',
        nameKo: '뇌-컴퓨터 인터페이스 (BCI)',
        emoji: '🔌',
        desc: '뇌의 생체 전기 신호와 디지털 컴퓨터를 연결하는 마이크로 임플란트.',
        prompt: 'an ultra-precise brain-computer interface microchip integrated with neural synapses, emitting golden and blue electrical impulses along biological brain tissue'
      },
      {
        id: 'mix-bio-organoid',
        nameKo: '3D 바이오 프린팅 장기',
        emoji: '🫀',
        desc: '콜라겐 지지체 위로 세포를 분사하여 입체 장기를 만드는 정밀 프린터.',
        prompt: 'a 3D bioprinter nozzle deposit glowing red and blue bio-ink cells layer by layer to fabricate an artificial human heart scaffold inside a sterile laboratory glass chamber'
      },
      {
        id: 'mix-bio-mrna-vaccine',
        nameKo: 'mRNA 지질 나노입자 (LNP)',
        emoji: '💧',
        desc: 'mRNA 유전 정보를 감싸고 세포막을 통과하는 지질 이중층 나노구체.',
        prompt: 'a molecular 3D rendering of a lipid nanoparticle (LNP) enclosing glowing mRNA helix strands inside, showing phospholipid bilayer surface floating in cellular fluid'
      },
      {
        id: 'mix-bio-vertical-farm',
        nameKo: '스마트 바이오 버티컬 팜',
        emoji: '🌱',
        desc: '특수 LED 조명과 수경재배 시스템으로 기르는 미래 무균 작물.',
        prompt: 'rows of vertical farming shelves inside a high-tech facility under bright pink and purple growth LED lights, with fresh green lettuce plants growing in nutrient-rich water channels'
      }
    ],
    finance: [
      {
        id: 'mix-finance-stock-trading',
        nameKo: '실시간 글로벌 트레이딩',
        emoji: '📈',
        desc: '다중 화면에 띄워진 실시간 주가 차트와 역동적인 붉은색 상승 캔들.',
        prompt: 'a futuristic financial trading desk with multiple curved holographic screens displaying real-time stock market candlestick charts, indices, and green glowing uptrend arrows'
      },
      {
        id: 'mix-finance-crypto-wallet',
        nameKo: '디지털 자산 지갑',
        emoji: '🪙',
        desc: '스마트폰 화면에서 가상자산 코인이 홀로그램으로 전송되는 모습.',
        prompt: 'a premium smartphone floating in mid-air, with a holographic display of digital gold and platinum coins transferring securely with glowing laser particles'
      },
      {
        id: 'mix-finance-credit-scoring',
        nameKo: 'AI 신용등급 분석 시스템',
        emoji: '📊',
        desc: '인공지능이 복합 데이터를 분석하여 최적의 신용도를 산출하는 과정.',
        prompt: 'an abstract financial analytics dashboard showing user profile silhouette, connected to shining radar charts, percentage nodes, and a secure golden checkmark seal'
      },
      {
        id: 'mix-finance-fintech-pay',
        nameKo: '모바일 간편 터치 결제',
        emoji: '📱',
        desc: '단말기에 스마트폰을 대는 순간 퍼져나가는 푸른색 결제 무선 파동.',
        prompt: 'a close-up of a human hand holding a sleek smartphone near a modern black contactless payment terminal, with glowing blue NFC wave ripples radiating outwards'
      },
      {
        id: 'mix-finance-robotic-advisor',
        nameKo: 'AI 로보어드바이저 자문',
        emoji: '🤖',
        desc: '인공지능 로봇이 제안하는 다각화된 3D 포트폴리오 차트.',
        prompt: 'a friendly transparent holographic robot presenting a 3D pie chart and diverse investment assets like bonds, stocks, and gold in a modern office room'
      },
      {
        id: 'mix-finance-central-bank-digital',
        nameKo: '중앙은행 디지털화폐 (CBDC)',
        emoji: '🏛️',
        desc: '국가 상징 마크와 암호 패턴이 새겨진 자가발광 국책 디지털 화폐.',
        prompt: 'a majestic neoclassical central bank building in the background, with a giant glowing digital coin featuring a government seal and cryptographic circuit lines floating in the foreground'
      },
      {
        id: 'mix-finance-algorithmic-arbitrage',
        nameKo: '알고리즘 초고속 매매',
        emoji: '⚡',
        desc: '1밀리초 단위로 수백만 건의 데이터를 비교 처리하는 금융 알고리즘.',
        prompt: 'a high-speed abstract digital tunnel filled with streams of financial numbers, binary codes, and sharp lightning-fast trade signal flashes connecting global markets'
      },
      {
        id: 'mix-finance-esg-investment',
        nameKo: 'ESG 친환경 투자',
        emoji: '🌱',
        desc: '환경 보호와 기업 지배구조 개선 프로젝트에 자금을 대는 녹색 금융.',
        prompt: 'a glowing green planet earth surrounded by a rotating ring of financial charts and growing green leaves, representing sustainable ESG investment and green finance'
      }
    ],
    public: [
      {
        id: 'mix-public-smart-city',
        nameKo: '스마트시티 초연결망',
        emoji: '🏙️',
        desc: '지능형 센서와 IoT망으로 건물들이 실시간 소통하는 미래형 도시.',
        prompt: 'a futuristic smart city skyline at night with glowing blue and cyan fiber-optic data gridlines connecting glass skyscrapers, autonomous cars leaving light trails'
      },
      {
        id: 'mix-public-digital-twin',
        nameKo: '국토 공간 디지털 트윈',
        emoji: '🗺️',
        desc: '실제 지형과 건물을 3D 가상 공간에 정밀하게 동기화한 입체 격자 맵.',
        prompt: 'a 3D wireframe digital twin topographic map of a metropolitan city on a high-tech glass table, with glowing green and white altitude contours and digital building blocks'
      },
      {
        id: 'mix-public-ev-bus',
        nameKo: '자율주행 친환경 셔틀',
        emoji: '🚌',
        desc: '라이다 센서와 카메라로 도로를 분석하며 운행하는 친환경 셔틀 버스.',
        prompt: 'a futuristic self-driving electric shuttle bus stopping at a smart glass shelter, showing active colorful lidar beam sensors mapping the environment'
      },
      {
        id: 'mix-public-water-treatment',
        nameKo: '지능형 수질 정화 시스템',
        emoji: '💧',
        desc: '수처리 시설에서 복합 필터와 센서를 통해 오수를 정화하는 공정.',
        prompt: 'a modern water treatment plant interior, showing massive clean steel pipes and giant transparent filtration cylinders filled with glowing pure blue water and sensory nodes'
      },
      {
        id: 'mix-public-disaster-control',
        nameKo: '재난 안전 관제 시스템',
        emoji: '🚨',
        desc: '태풍, 지진 등 재난 상황을 실시간 모니터링하여 경보를 울리는 대시보드.',
        prompt: 'a state-of-the-art disaster command center with a large wall monitor displaying weather radar satellite images of a typhoon, red flashing warning lights, and map markers'
      },
      {
        id: 'mix-public-intelligent-traffic',
        nameKo: '지능형 교통 신호 제어',
        emoji: '🚦',
        desc: '교통량 분석 AI가 실시간으로 교차로 신호등을 최적화하는 디지털 시뮬레이션.',
        prompt: 'a busy highway interchange viewed from above, overlaid with glowing green, yellow, and red traffic flow speed indicators, autonomous vehicles, and optimization vectors'
      },
      {
        id: 'mix-public-e-gov',
        nameKo: '비대면 모바일 행정 서비스',
        emoji: '📄',
        desc: '스마트폰 화면에서 모바일 면허증과 정부 증명서가 발급되는 직관적 보안 화면.',
        prompt: 'a secure mobile government application interface floating above a desk, showing a high-tech digital identity card with glowing holographic security seal'
      },
      {
        id: 'mix-public-waste-sorting',
        nameKo: 'AI 자원 순환 선별기',
        emoji: '♻️',
        desc: '컨베이어 벨트 위 폐기물 종류를 카메라로 판별해 분리하는 고속 로봇 팔.',
        prompt: 'a high-speed robotic sorting arm picking plastic bottles and aluminum cans from a fast-moving conveyor belt using computer vision camera guidance in a recycling plant'
      }
    ],
    brand: [
      {
        id: 'mix-brand-visual-identity',
        nameKo: '브랜드 아이덴티티 수립',
        emoji: '🎨',
        desc: '가이드북 위에 배치된 감각적인 디자인 모티프와 컬러 팔레트 칩.',
        prompt: 'a collection of professional brand identity guidelines, showing a sleek custom logo, elegant pastel color swatches, typography books, and premium stationary items'
      },
      {
        id: 'mix-brand-pop-up',
        nameKo: '트렌디 팝업 스토어',
        emoji: '🏬',
        desc: '강렬한 메탈/네온 장식과 예술적 포토존으로 꾸며진 플래그십 체험존.',
        prompt: 'a stylish and trendy pop-up store exterior in an urban art district, featuring bold neon signs, artistic window displays, futuristic design installations, and crowds gathered'
      },
      {
        id: 'mix-brand-influencer',
        nameKo: '라이브 커머스 방송',
        emoji: '🎙️',
        desc: '링라이트 조명 아래 크리에이터가 신제품을 소개하는 스마트폰 화면.',
        prompt: 'a high-end camera setup on a tripod with a glowing circular ring light, capturing a dynamic live-stream video feed showing real-time heart emojis and chat overlays'
      },
      {
        id: 'mix-brand-packaging',
        nameKo: '친환경 에코 패키징',
        emoji: '📦',
        desc: '크라프트 종이 박스 위에 콩기름 잉크로 인쇄된 에코 브랜드 패키지.',
        prompt: 'a beautiful, minimalist eco-friendly product packaging box made of textured brown kraft paper, adorned with a clean green plant logo stamp and soft lighting'
      },
      {
        id: 'mix-brand-cx-journey',
        nameKo: '고객 경험 (CX) 여정 맵',
        emoji: '🗺️',
        desc: '고객의 감정선과 구매 단계를 입체적인 마인드맵 형태로 도식화한 차트.',
        prompt: 'a colorful 3D infographic board showing the stages of a customer journey map, with miniature figures moving along a path with positive emoji checkpoints'
      },
      {
        id: 'mix-brand-ai-copywriter',
        nameKo: 'AI 타겟 카피라이팅',
        emoji: '✍️',
        desc: '트렌디한 단어 조합을 실시간으로 추천해주는 인공지능 카피 에디터 화면.',
        prompt: 'a modern workspace desk with a laptop screen displaying high-converting creative ad headlines and slogans, with glowing sparkles of creative ideas'
      },
      {
        id: 'mix-brand-fandom',
        nameKo: '브랜드 굿즈 디자인',
        emoji: '🧸',
        desc: '브랜드 로고가 새겨진 트렌디한 키링, 스티커 팩, 텀블러 레이아웃.',
        prompt: 'a neat flat lay layout of trendy brand merchandise goods, including custom acrylic keyrings, vinyl stickers with cute designs, a sleek matte finish tumbler'
      },
      {
        id: 'mix-brand-ar-try-on',
        nameKo: 'AR 가상 피팅 솔루션',
        emoji: '🕶️',
        desc: '스마트폰 화면을 통해 명품 안경이나 의상을 가상으로 입어보는 화면.',
        prompt: 'a screen showing a young smiling woman using her smartphone camera for an augmented reality (AR) virtual try-on, wearing a 3D digital model of luxury sunglasses'
      }
    ],
    space: [
      {
        id: 'mix-space-rocket-launch',
        nameKo: '우주 로켓 발사',
        emoji: '🚀',
        desc: '발사대를 박차고 거대한 연기구름을 뿜으며 밤하늘로 솟구치는 우주 로켓.',
        prompt: 'a heavy space rocket launching into the starry dark night sky, with a huge plume of glowing fiery smoke, intense orange exhaust flame, and structural steel launch tower'
      },
      {
        id: 'mix-space-satellite-orbit',
        nameKo: '지구 궤도 위성 통신',
        emoji: '🛰️',
        desc: '푸른 지구를 내려다보며 태양광 패널을 활짝 펼치고 도는 통신 위성.',
        prompt: 'a high-tech communications satellite with large golden solar panels extended, orbiting above the glowing curvature of blue planet Earth in dark deep space'
      },
      {
        id: 'mix-space-mars-colony',
        nameKo: '화성 거주지 개척 기지',
        emoji: '🏠',
        desc: '붉은 먼지 폭풍이 부는 화성 지표면에 건설된 유리 돔 형태의 우주 기지.',
        prompt: 'a futuristic mars colony with multiple interconnected geodesic dome greenhouses on the reddish Martian dusty landscape, a tiny mars rover nearby, starry sky'
      },
      {
        id: 'mix-space-asteroid-mining',
        nameKo: '소행성 자원 탐사 채굴',
        emoji: '⛏️',
        desc: '우주 공간에 떠 있는 소행성에 고정되어 레이저로 광물을 캐는 특수선.',
        prompt: 'a specialized industrial spacecraft anchored to a giant rugged asteroid, firing high-power orange lasers to extract glowing space minerals in deep void'
      },
      {
        id: 'mix-space-space-station',
        nameKo: '우주 정거장 허브 내부',
        emoji: '🛸',
        desc: '무중력 상태의 모듈 내부 기계 장치들과 거대한 관측창 너머의 지구.',
        prompt: 'interior view of a futuristic space station cupola module, with high-tech controls, a floating astronaut in a white suit, looking at the giant blue Earth'
      },
      {
        id: 'mix-space-deep-space-telescope',
        nameKo: '제임스웹 심우주 망원경',
        emoji: '🔭',
        desc: '벌집 모양 금빛 거울 반사판이 우주의 성운과 은하를 포착하는 순간.',
        prompt: 'a massive space telescope with a hexagonal gold-plated primary mirror array, facing a colorful swirling cosmic nebula in the background, deep space stars'
      },
      {
        id: 'mix-space-orbital-hotel',
        nameKo: '궤도 우주 호텔 투어',
        emoji: '🏨',
        desc: '인공 중력을 위해 회전하는 거대한 원형 링 구조의 럭셔리 우주 정거장.',
        prompt: 'a colossal wheel-shaped space hotel rotating in low Earth orbit, with glowing window lights showing cozy suites, luxury travelers, and Earth curvature background'
      },
      {
        id: 'mix-space-fusion-propulsion',
        nameKo: '핵융합 추진 우주 엔진',
        emoji: '💫',
        desc: '심우주 탐사를 위해 항해하는 거대한 탐사선 후미의 파란색 핵융합 화염.',
        prompt: 'a long interstellar explorer spaceship traveling through the void, propelled by a brilliant glowing blue thermonuclear fusion exhaust flame at its tail'
      }
    ]
  };

  // 2. 표현 화풍 (Medium) 데이터 및 카테고리 (6대 카테고리 × 8종 = 48종)
  const MEDIUM_CATEGORIES = [
    { id: 'tech3d', label: '🧊 3D & 테크니컬' },
    { id: 'analog', label: '🎨 아날로그 & 회화' },
    { id: 'graphic', label: '◼️ 그래픽 & 디자인' },
    { id: 'anime', label: '🎬 만화 & 애니메이션' },
    { id: 'photo', label: '📷 사진 & 실사' },
    { id: 'craft', label: '🧶 핸드메이드 & 실물 공예' }
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
      suffix: 'highly detailed 3D render, technical engineering cutaway, realistic textures, volumetric studio lighting, clean geometric shapes, octane render'
    },
    {
      id: 'med-clay',
      category: 'tech3d',
      nameKo: '클레이 매트 렌더',
      emoji: '🧸',
      desc: '점토 질감의 따뜻하고 둥근 3D 디자인',
      prefix: 'clay render 3D illustration of',
      suffix: 'clay render 3D illustration, plasticine matte clay texture, chunky rounded proportions, soft studio lighting, smooth ambient occlusion, cute toy-like aesthetic'
    },
    {
      id: 'med-iso',
      category: 'tech3d',
      nameKo: '아이소메트릭 3D',
      emoji: '📐',
      desc: '45도 등각 투영 뷰의 입체 인포그래픽',
      prefix: 'isometric 3D vector illustration of',
      suffix: 'isometric 3D vector illustration, clean geometric style, precise 45-degree perspective, soft drop shadows, professional business infographic'
    },
    {
      id: 'med-voxel',
      category: 'tech3d',
      nameKo: '레트로 복셀 블록',
      emoji: '🧱',
      desc: '큐브 블록을 쌓은 마인크래프트 감성 3D',
      prefix: 'voxel art 3D style of',
      suffix: 'voxel art 3D style, colorful cubic block construction, isometric pixel-block view, clear grid structures'
    },
    {
      id: 'med-lowpoly',
      category: 'tech3d',
      nameKo: '로우폴리 아키텍처',
      emoji: '🌲',
      desc: '단순화된 각진 면으로 이루어진 3D 스타일',
      prefix: 'low-poly 3D scene of',
      suffix: 'low-poly style, polygonal shapes, faceted geometry, vibrant colors, clean rendering, stylized minimal environment'
    },
    {
      id: 'med-hologram',
      category: 'tech3d',
      nameKo: '3D 미래형 홀로그램',
      emoji: '📡',
      desc: '푸른빛의 입체 홀로그램 격자망 효과',
      prefix: 'glowing holographic 3D projection of',
      suffix: 'holographic projection, bright cyan scanlines, glowing digital grid wireframe, flickering light particles, sci-fi interface visual, dark background'
    },
    {
      id: 'med-fluiddyn',
      category: 'tech3d',
      nameKo: '유기적 3D 유체',
      emoji: '💧',
      desc: '역동적으로 요동치는 액체 메탈과 유리 질감',
      prefix: '3D abstract fluid dynamics rendering of',
      suffix: 'swirling liquid chrome and colored glass fluid simulation, organic morphing shapes, glossy subsurface scattering, studio reflections, dramatic light refractions'
    },
    {
      id: 'med-spline',
      category: 'tech3d',
      nameKo: '미니멀 3D 스플라인',
      emoji: '➰',
      desc: '부드러운 곡선과 파스텔톤 플라스틱 렌더',
      prefix: 'minimalist 3D spline rendering of',
      suffix: 'soft smooth 3D curves, modern pastel plastic materials, abstract flowing loops, studio lighting, clean solid background, matte finish'
    },

    // ==================== 2. 아날로그 & 회화 (analog) ====================
    {
      id: 'med-watercolor',
      category: 'analog',
      nameKo: '감성 수채화',
      emoji: '🎨',
      desc: '은은한 물 번짐과 연필 스케치 선',
      prefix: 'hand-painted watercolor illustration of',
      suffix: 'whimsical hand-painted watercolor illustration, soft watercolor washes, natural diffused light, organic ink outlines, textured paper background, artistic splatters'
    },
    {
      id: 'med-oil',
      category: 'analog',
      nameKo: '클래식 임파스토 유화',
      emoji: '🖼️',
      desc: '두꺼운 붓 터치와 캔버스 입체감',
      prefix: 'classical oil painting of',
      suffix: 'classical oil painting, visible canvas texture and thick paint brushstrokes, rich impasto layers, dramatic classical lighting, fine art masterpiece'
    },
    {
      id: 'med-pencil',
      category: 'analog',
      nameKo: '미니멀 연필 소묘',
      emoji: '✏️',
      desc: '정교한 명암 해칭 기법의 흑백 소묘',
      prefix: 'detailed pencil sketch of',
      suffix: 'minimalist fine pencil sketch, detailed cross-hatching, realistic graphite textures, soft shadows, clean white paper background, fine art drawing'
    },
    {
      id: 'med-ink',
      category: 'analog',
      nameKo: '동양화 수묵 담채',
      emoji: '🎋',
      desc: '먹선의 강약과 여백의 미가 살아있는 화풍',
      prefix: 'traditional Asian ink wash painting of',
      suffix: 'traditional East Asian ink wash and watercolor painting, elegant calligraphic ink brushstrokes, beautiful negative space, misty atmospheric perspective, artistic hand-painted feel'
    },
    {
      id: 'med-crayon',
      category: 'analog',
      nameKo: '오일 파스텔 크레용',
      emoji: '🖍️',
      desc: '크레용 특유의 뭉뚝하고 포근한 거친 질감',
      prefix: 'textured oil pastel drawing of',
      suffix: 'chunky oil pastel stroke textures, rich crayon wax details, warm color scheme, artistic hand-drawn feel, heavy paper grain'
    },
    {
      id: 'med-gouache',
      category: 'analog',
      nameKo: '매트 과슈 페인팅',
      emoji: '🎨',
      desc: '불투명하고 차분한 무광 수성 물감 느낌',
      prefix: 'matte gouache painting of',
      suffix: 'flat opaque paint layers, textured gouache brushstrokes, earthy color palette, stylized shapes, modern hand-painted illustration'
    },
    {
      id: 'med-acrylic',
      category: 'analog',
      nameKo: '추상 아크릴 페인팅',
      emoji: '🖌️',
      desc: '선명하고 역동적인 아크릴 물감 터치와 마블링',
      prefix: 'abstract acrylic painting of',
      suffix: 'vibrant acrylic paint strokes, textured heavy impasto, fluid paint marbling, rich color blending, contemporary expressionist style'
    },
    {
      id: 'med-etching',
      category: 'analog',
      nameKo: '클래식 동판화 에칭',
      emoji: '📜',
      desc: '섬세한 부식선과 빈티지 도서 삽화 기법',
      prefix: 'fine line etching print of',
      suffix: 'classic intaglio copperplate engraving style, intricate hand-etched linework, cross-hatched shadows, sepia ink on aged cotton paper, vintage book illustration'
    },

    // ==================== 3. 그래픽 & 디자인 (graphic) ====================
    {
      id: 'med-glass',
      category: 'graphic',
      nameKo: '반투명 글래스모피즘',
      emoji: '🔮',
      desc: '네온 그라데이션 위 frosted 유리 패널',
      prefix: 'modern glassmorphism UI concept showing',
      suffix: 'dashboard user interface design presenting data using frosted semi-transparent glass panes, glowing neon gradients illuminating the background, clean layouts'
    },
    {
      id: 'med-flat',
      category: 'graphic',
      nameKo: '플랫 팝 아트 벡터',
      emoji: '🏷️',
      desc: '외곽선이 뚜렷하고 채도가 높은 플랫 디자인',
      prefix: 'flat vector pop art illustration of',
      suffix: 'vibrant flat vector illustration, bold graphic shapes, clean screen print aesthetic, minimal color shading, high contrast outlines, commercial art style'
    },
    {
      id: 'med-neon',
      category: 'graphic',
      nameKo: '미니멀 네온 라인',
      emoji: '🌌',
      desc: '블랙 배경에 네온 시안/핑크 라인 도식화',
      prefix: 'minimalist neon vector graphic of',
      suffix: 'minimalist modern vector graphic, neon outline shapes, dark background, clean flat design, glowing neon cyan and pink accent lines, sleek tech vibe'
    },
    {
      id: 'med-halftone',
      category: 'graphic',
      nameKo: '하프톤 빈티지 코믹',
      emoji: '📰',
      desc: '인쇄용 망점 패턴과 종이 질감',
      prefix: 'vintage comic halftone illustration of',
      suffix: 'classic pulp magazine art, halftone screen dots, vintage off-white paper texture, retro color overlays, ink outline borders, nostalgic print style'
    },
    {
      id: 'med-bauhaus',
      category: 'graphic',
      nameKo: '바우하우스 기하학',
      emoji: '📐',
      desc: '삼원색과 기본 도형의 미니멀 모던 디자인',
      prefix: 'minimalist Bauhaus graphic design of',
      suffix: 'Bauhaus design movement style, primary colors red yellow blue, bold geometric shapes, black grid lines, clean Swiss typography layout aesthetic, vintage cream paper backdrop'
    },
    {
      id: 'med-risograph',
      category: 'graphic',
      nameKo: '리소그래프 질감 프린트',
      emoji: '🖨️',
      desc: '특유의 미세한 도트 잉크 번짐과 레이어 어긋남',
      prefix: 'risograph print of',
      suffix: 'risograph print style, coarse halftone dot grain, ink bleed textures, misaligned color overlay layers, retro vibrant ink colors, warm textured paper'
    },
    {
      id: 'med-cyberpunk-vector',
      category: 'graphic',
      nameKo: '사이버펑크 벡터 그래픽',
      emoji: '💾',
      desc: '미래 도시적이고 기하학적인 테크니컬 데칼 스타일',
      prefix: 'cyberpunk vector graphic UI element of',
      suffix: 'high-tech futuristic decal, hud interface vector elements, neon violet and cyan glow, clean geometric cyber tech aesthetic, dark techno backdrop'
    },
    {
      id: 'med-psychedelic',
      category: 'graphic',
      nameKo: '70년대 사이케델릭',
      emoji: '🌀',
      desc: '왜곡된 물결 라인과 몽환적인 원색 그라데이션',
      prefix: 'psychedelic art graphic of',
      suffix: 'groovy 1970s psychedelic style, melting liquid warp shapes, surreal trippy visuals, high-contrast vibrant retro colors, fluid wavy patterns'
    },

    // ==================== 4. 만화 & 애니메이션 (anime) ====================
    {
      id: 'med-cel-anime',
      category: 'anime',
      nameKo: '레트로 90년대 셀애니',
      emoji: '📼',
      desc: '아날로그 필름 노이즈와 역광 셀화',
      prefix: 'retro 90s anime style illustration of',
      suffix: 'retro 90s anime style screenshot, hand-drawn cel animation aesthetic, soft film grain, analog film lighting, vintage colors, hand-painted background'
    },
    {
      id: 'med-webtoon',
      category: 'anime',
      nameKo: '한국 트렌디 웹툰',
      emoji: '📱',
      desc: '화사한 디지털 그라데이션 하이라이트',
      prefix: 'modern webtoon manhwa illustration of',
      suffix: 'modern webtoon manhwa style, clean digital line art, soft gradient shading, bright trendy highlights, clear high-contrast web comic aesthetic'
    },
    {
      id: 'med-american-comic',
      category: 'anime',
      nameKo: '미국 그래픽 노블',
      emoji: '🇺🇸',
      desc: '굵고 극적인 잉크 드로잉과 강한 명암',
      prefix: 'american graphic novel style drawing of',
      suffix: 'classic american comic book style, bold ink contours, halftone dot textures, retro comic book print quality, dramatic high-contrast ink shading'
    },
    {
      id: 'med-manga',
      category: 'anime',
      nameKo: '흑백 만화 스크린톤',
      emoji: '✒️',
      desc: '스크린톤 망점과 스피드 라인 펜화',
      prefix: 'black and white manga drawing of',
      suffix: 'classic Japanese manga style, detailed black ink drawing, cross-hatching, halftone screentone patterns, high contrast monochrome, serialized manga print quality'
    },
    {
      id: 'med-chibi',
      category: 'anime',
      nameKo: '귀여운 치비 캐릭터',
      emoji: '🧸',
      desc: '이등신 비율의 앙증맞고 단순화된 SD 스타일',
      prefix: 'cute chibi anime style illustration of',
      suffix: 'super deformed chibi style, huge expressive eyes, small simplified body, pastel soft colors, clean digital rendering, friendly sticker art aesthetic'
    },
    {
      id: 'med-ghibli',
      category: 'anime',
      nameKo: '감성 지브리 수채 셀화',
      emoji: '🌲',
      desc: '아날로그 터치의 자연 풍경과 따스한 감성',
      prefix: 'Studio Ghibli style anime illustration of',
      suffix: 'classic Ghibli animation aesthetic, hand-painted lush watercolor background, nostalgic warm lighting, rich natural green and blue tones, retro movie cel'
    },
    {
      id: 'med-cyber-cyberpunk',
      category: 'anime',
      nameKo: '사이버펑크 디스토피아 애니',
      emoji: '🦾',
      desc: '어둡고 정교한 SF 메카닉과 네온 도시 배경',
      prefix: 'cyberpunk sci-fi anime screenshot of',
      suffix: '90s high-tech sci-fi anime style, intricate mechanical details, dark gritty atmosphere, glowing neon wireframes, cyberpunk city rain, cinematic cel shade'
    },
    {
      id: 'med-ink-splatter',
      category: 'anime',
      nameKo: '스플래터 수묵 극화',
      emoji: '🖌️',
      desc: '거친 붓터치와 잉크 튐이 강조된 역동적 화풍',
      prefix: 'dynamic ink splatter manga action scene of',
      suffix: 'action manga style, explosive ink splatters, rough heavy brushstrokes, high-speed motion lines, dramatic black ink wash contrast, high energy aesthetic'
    },

    // ==================== 5. 사진 & 실사 (photo) ====================
    {
      id: 'med-film-photo',
      category: 'photo',
      nameKo: '아날로그 필름 사진',
      emoji: '📸',
      desc: '35mm 렌즈 질감과 차분한 아웃포커스',
      prefix: 'authentic film photograph of',
      suffix: 'cinematic analog film photography, 35mm lens, realistic grain, soft lighting, natural colors, authentic depth of field, documentary photograph'
    },
    {
      id: 'med-micro-photo',
      category: 'photo',
      nameKo: '현미경 미시 사진',
      emoji: '🔬',
      desc: '전자현미경 특유의 차가운 톤과 극미세 디테일',
      prefix: 'electron microscope scientific macro photograph of',
      suffix: 'advanced electron microscope imaging, monochromatic cyan/blue tinting, extreme close-up details, high scientific magnification, dark lab background'
    },
    {
      id: 'med-exposure-photo',
      category: 'photo',
      nameKo: '야간 셔터 장노출',
      emoji: '🌃',
      desc: '시간이 흐르는 빛의 궤적과 장노출 궤선',
      prefix: 'long exposure night photograph of',
      suffix: 'long exposure photography, beautiful light trails, kinetic energy flow, glowing kinetic movements, rich reflections on wet surfaces, dramatic cinematic nighttime lighting'
    },
    {
      id: 'med-press-photo',
      category: 'photo',
      nameKo: '현장 보도 사진',
      emoji: '📰',
      desc: '광각 렌즈와 내추럴 라이팅의 다큐멘터리 연출',
      prefix: 'candid press documentary photograph of',
      suffix: 'candid photojournalism style, wide-angle lens, raw natural lighting, realistic environment, unedited documentary aesthetic, high detail story-telling capture'
    },
    {
      id: 'med-polaroid',
      category: 'photo',
      nameKo: '빈티지 폴라로이드',
      emoji: '🎞️',
      desc: '테두리가 있는 빈티지 즉석카메라의 색감과 노이즈',
      prefix: 'vintage polaroid instant photo of',
      suffix: 'instant film camera photograph, polaroid white frame border, faded vintage colors, warm light leaks, soft focus, nostalgic film grain'
    },
    {
      id: 'med-drone',
      category: 'photo',
      nameKo: '항공 드론 사진',
      emoji: '🚁',
      desc: '상공에서 수직으로 내려다보는 대칭과 격자 구도',
      prefix: 'aerial drone photograph of',
      suffix: 'top-down bird-eye view, symmetrical landscape patterns, high-altitude perspective, crisp daylight, professional outdoor photography'
    },
    {
      id: 'med-thermal',
      category: 'photo',
      nameKo: '적외선 열화상 카메라',
      emoji: '🌡️',
      desc: '온도 차이를 보여주는 강렬한 열화상 색상',
      prefix: 'infrared thermographic thermal imaging of',
      suffix: 'thermal vision color scale, neon orange yellow hot areas, blue violet cold areas, scientific heat mapping visual, dark tech environment'
    },
    {
      id: 'med-macro',
      category: 'photo',
      nameKo: '물방울 극세사 접사',
      emoji: '💧',
      desc: '초근접 매크로 렌즈로 담은 이슬과 반사광',
      prefix: 'ultra-macro photography of',
      suffix: 'extreme close-up macro photo, crystal-clear water droplet reflections, shallow depth of field, sharp detail texture focus, soft glowing bokeh background'
    },

    // ==================== 6. 핸드메이드 & 실물 공예 (craft) ====================
    {
      id: 'med-origami',
      category: 'craft',
      nameKo: '입체 종이접기',
      emoji: '📄',
      desc: '종이를 정밀하게 접은 주름과 겹쳐진 그림자',
      prefix: 'origami paper craft of',
      suffix: 'origami paper craft style, clean paper folds, creased geometric shapes, layered matte paper textures, soft drop shadows, minimalist craft aesthetic'
    },
    {
      id: 'med-felt',
      category: 'craft',
      nameKo: '펠트 양모 인형',
      emoji: '🐑',
      desc: '양모를 찔러 만든 뽀송뽀송하고 따뜻한 섬유 질감',
      prefix: 'needle felted wool craft of',
      suffix: 'needle felted wool craft style, fuzzy fibrous texture, soft warm woolen fibers, cute handmade toy aesthetic, soft diffuse studio lighting'
    },
    {
      id: 'med-papercut',
      category: 'craft',
      nameKo: '다층 페이퍼 커팅',
      emoji: '✂️',
      desc: '컷팅된 종이판을 여러 겹 쌓아 만든 입체 터널',
      prefix: 'multi-layered papercut shadowbox art of',
      suffix: 'layered papercraft art, 3D shadowbox effect, sharp cut paper edges, backlit glowing layers, distinct depth and shadows between paper sheets'
    },
    {
      id: 'med-embroidery',
      category: 'craft',
      nameKo: '정교한 손자수',
      emoji: '🧵',
      desc: '천 위에 한 땀 한 땀 놓은 정교한 실과 바느질 패턴',
      prefix: 'detailed needlework embroidery of',
      suffix: 'handmade embroidery art, colorful thread stitches, textured linen canvas backdrop, tight sewing patterns, satin stitches, realistic textile craft'
    },
    {
      id: 'med-diorama',
      category: 'craft',
      nameKo: '미니어처 디오라마',
      emoji: '🛖',
      desc: '축소판 모형 정원이나 정밀 미니어처 세트',
      prefix: 'miniature diorama model of',
      suffix: 'miniature diorama model, tiny handcrafted details, fake synthetic moss, small plastic figurines, tilt-shift camera lens effect, studio showcase lighting'
    },
    {
      id: 'med-stainedglass',
      category: 'craft',
      nameKo: '성당 스테인드글라스',
      emoji: '⛪',
      desc: '검은 납선 테두리와 오색 찬란한 반투명 유리',
      prefix: 'stained glass mosaic window depicting',
      suffix: 'intricate stained glass window pattern, colorful translucent glass pieces, bold dark lead lines, glowing light shining through glass, colorful reflections'
    },
    {
      id: 'med-ceramic',
      category: 'craft',
      nameKo: '유약 도자기 세라믹',
      emoji: '🏺',
      desc: '매끄럽게 반짝이는 유약 광택과 자연스러운 크랙',
      prefix: 'glazed ceramic pottery sculpture of',
      suffix: 'hand-crafted glazed ceramic, glossy pottery finish, subtle crackle glaze texture, organic pottery shapes, studio lighting, smooth tactile surface'
    },
    {
      id: 'med-leather',
      category: 'craft',
      nameKo: '핸드메이드 가죽 카빙',
      emoji: '💼',
      desc: '천연 가죽 위에 새긴 음양 각인과 정교한 바느질선',
      prefix: 'tooled leather craft embossing of',
      suffix: 'hand-tooled tanned leather, intricate embossed patterns, thick saddle stitching, realistic rich brown leather grain, polished burnished edges'
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
    'med-leather': ['photo-1526304640581-d334cdbbf45e', 'photo-1508921912186-1d1a45ebb3c1', 'photo-1492691527719-9d1e07e534b4']
  };

  // Unsplash API — 화풍 스타일 대표 이미지 검색
  // 키는 localStorage에 저장 (소스에 포함하지 않음)
  const UNSPLASH_KEY_STORAGE = 'mixer_unsplash_key';
  const UNSPLASH_CACHE = {};

  function getUnsplashKey() {
    return localStorage.getItem(UNSPLASH_KEY_STORAGE) || '';
  }

  function setUnsplashKey(key) {
    localStorage.setItem(UNSPLASH_KEY_STORAGE, key.trim());
  }

  async function fetchUnsplashImage(medId, suffix, forceRefresh = false) {
    const key = getUnsplashKey();
    if (!key) return null;
    if (!forceRefresh && UNSPLASH_CACHE[medId]) return UNSPLASH_CACHE[medId];
    const query = resolveSearchKeyword(medId, suffix);
    const page = Math.floor(Math.random() * 5) + 1;
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&page=${page}&orientation=landscape&client_id=${key}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    let res;
    try {
      res = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) throw new Error(`Unsplash ${res.status}`);
    const data = await res.json();
    const results = data.results || [];
    if (results.length === 0) throw new Error('no results');
    const picked = results[Math.floor(Math.random() * Math.min(results.length, 10))];
    const imgUrl = picked.urls.small;
    UNSPLASH_CACHE[medId] = imgUrl;
    return imgUrl;
  }

  // 화풍 샘플 커스텀 이미지 localStorage 헬퍼
  const MIXER_CUSTOM_KEY = 'mixer_custom_samples_v1';
  function _getCustomAll() {
    try { return JSON.parse(localStorage.getItem(MIXER_CUSTOM_KEY) || '{}'); } catch { return {}; }
  }
  function getCustomSamplesForMed(medId) {
    return (_getCustomAll()[medId] || [null, null, null]).slice(0, 3);
  }
  function setCustomSample(medId, idx, dataUrl) {
    const all = _getCustomAll();
    if (!all[medId]) all[medId] = [null, null, null];
    all[medId][idx] = dataUrl;
    localStorage.setItem(MIXER_CUSTOM_KEY, JSON.stringify(all));
  }
  function clearCustomSample(medId, idx) {
    const all = _getCustomAll();
    if (all[medId]) {
      all[medId][idx] = null;
      if (all[medId].every(v => !v)) delete all[medId];
      localStorage.setItem(MIXER_CUSTOM_KEY, JSON.stringify(all));
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
  const PALETTE_CATEGORIES = [
    { id: 'tech', label: '🌐 테크 & 미래지향' },
    { id: 'nature', label: '🌿 자연 & 친환경' },
    { id: 'energy', label: '🔥 에너지 & 액티브' },
    { id: 'soft', label: '🌸 감성 & 클래식' }
  ];

  const MIXER_PALETTES = [
    // ==========================================
    // 1. 테크 & 미래지향 (tech) - 8 items
    // ==========================================
    {
      id: 'pal-cyber',
      category: 'tech',
      name: '사이버 시안 & 마젠타',
      mode: 'dark',
      colors: ['#0F0C1B', '#1B1736', '#2F2663', '#00F0FF', '#FF007F'],
      colorMapping: 'near-black dark background, electric cyan glow, neon magenta accent highlights, deep violet shadows'
    },
    {
      id: 'pal-obsidian',
      category: 'tech',
      name: '옵시디언 다크 테크',
      mode: 'dark',
      colors: ['#0A0D14', '#1A2333', '#2D3A52', '#00E5FF', '#E2E8F0'],
      colorMapping: 'dark obsidian metallic surfaces, glowing electric cyan tech lines, stark white highlights, deep slate-blue shadows'
    },
    {
      id: 'pal-quantum',
      category: 'tech',
      name: '퀀텀 바이올렛',
      mode: 'dark',
      colors: ['#120024', '#2E004F', '#5E008F', '#B800FF', '#00FFFF'],
      colorMapping: 'cosmic deep purple background, vibrant electric violet energy flows, glowing cyan highlights'
    },
    {
      id: 'pal-aurora-neon',
      category: 'tech',
      name: '오로라 네온 그린',
      mode: 'dark',
      colors: ['#05161C', '#0B333E', '#166E7A', '#00FF87', '#00FFFF'],
      colorMapping: 'dark teal-black background, deep ocean blue shadows, radiant neon green energy lines, glowing cyan highlights'
    },
    {
      id: 'pal-cybernetic-silver',
      category: 'tech',
      name: '사이버네틱 실버 & 블루',
      mode: 'dark',
      colors: ['#0D1117', '#1F2937', '#4B5563', '#3B82F6', '#60A5FA'],
      colorMapping: 'deep steel black background, dark charcoal shadows, metallic silver midtones, vibrant electric blue highlights, glowing light blue accents'
    },
    {
      id: 'pal-deep-ai',
      category: 'tech',
      name: '딥 러닝 인디고',
      mode: 'dark',
      colors: ['#030712', '#1E1B4B', '#312E81', '#4F46E5', '#818CF8'],
      colorMapping: 'near-black dark background, deep indigo shadows, royal blue midtones, electric blue highlights, soft violet accents'
    },
    {
      id: 'pal-matrix',
      category: 'tech',
      name: '매트릭스 디지털 그린',
      mode: 'dark',
      colors: ['#050F08', '#0D2B17', '#1F5C33', '#00FF41', '#85FF9E'],
      colorMapping: 'deep digital black background, dark forest shadows, matrix green stream lines, ultra-bright neon green highlights, light mint accents'
    },
    {
      id: 'pal-fusion-neon',
      category: 'tech',
      name: '퓨전 오렌지 & 퍼플',
      mode: 'dark',
      colors: ['#180026', '#3E0066', '#8800CC', '#FF4E00', '#FFB300'],
      colorMapping: 'deep cosmic purple background, dark violet shadows, electric magenta midtones, fiery neon orange highlights, bright gold accents'
    },

    // ==========================================
    // 2. 자연 & 친환경 (nature) - 8 items
    // ==========================================
    {
      id: 'pal-forest',
      category: 'nature',
      name: '에코 포레스트 그린',
      mode: 'dark',
      colors: ['#0B221E', '#1A3A34', '#3B7A57', '#8AE9A8', '#EFFFF3'],
      colorMapping: 'deep forest green shadows, organic emerald-green midtones, bright mint green highlights, soft off-white ambient glow'
    },
    {
      id: 'pal-hydro',
      category: 'nature',
      name: '클린 하이드로 블루',
      mode: 'light',
      colors: ['#E0F7FA', '#80DEEA', '#26C6DA', '#00B4D8', '#006064'],
      colorMapping: 'luminous clean cyan and hydro-blue primary shapes, soft light-blue gradients, deep teal accents, bright aquamarine highlights'
    },
    {
      id: 'pal-sand',
      category: 'nature',
      name: '어시 웜 샌드',
      mode: 'light',
      colors: ['#2F2519', '#4E3E2F', '#8D7B68', '#C8B6A4', '#F1DEC9'],
      colorMapping: 'earthy warm brown shadows, sandy beige midtones, soft cream-white highlights, terracotta accents'
    },
    {
      id: 'pal-savannah',
      category: 'nature',
      name: '새벽 사바나 웜',
      mode: 'light',
      colors: ['#1A120B', '#3C2A21', '#D5AEA1', '#E5BA73', '#FFF5E4'],
      colorMapping: 'deep earthy dark brown background, warm soil shadows, soft terracotta midtones, sunset golden-yellow highlights, warm ivory ambient glow'
    },
    {
      id: 'pal-glacier',
      category: 'nature',
      name: '빙하 아틱 쿨',
      mode: 'light',
      colors: ['#0A1931', '#15305B', '#5B85AA', '#A2DBFA', '#E8F1F5'],
      colorMapping: 'deep arctic navy shadows, cold glacier blue midtones, pale frost blue highlights, crystalline ice-white accents'
    },
    {
      id: 'pal-autumn-leaf',
      category: 'nature',
      name: '단풍 클래식 브라운',
      mode: 'light',
      colors: ['#2C1107', '#5C200B', '#A74A1B', '#D07A3E', '#F4C493'],
      colorMapping: 'rich mahogany brown background, deep rust-red shadows, vibrant copper midtones, warm orange-gold highlights, soft peach-cream accents'
    },
    {
      id: 'pal-deep-sea',
      category: 'nature',
      name: '심해 마린 블루',
      mode: 'dark',
      colors: ['#010B14', '#04213D', '#0C4B82', '#1089FF', '#7CD1F9'],
      colorMapping: 'abyssal black-blue background, deep navy shadows, rich sapphire midtones, bright electric blue highlights, luminous sky blue accents'
    },
    {
      id: 'pal-botanic',
      category: 'nature',
      name: '보타닉 가든 올리브',
      mode: 'light',
      colors: ['#1E251C', '#344231', '#5B7056', '#9AB98C', '#DDE6D8'],
      colorMapping: 'deep olive-black shadows, muted forest-green midtones, sage green highlights, soft grey-green background, pale leaf-green accents'
    },

    // ==========================================
    // 3. 에너지 & 액티브 (energy) - 8 items
    // ==========================================
    {
      id: 'pal-volcano',
      category: 'energy',
      name: '용광로 볼케이노',
      mode: 'dark',
      colors: ['#0E0807', '#2E140F', '#7B2A1E', '#F05A28', '#FFD07B'],
      colorMapping: 'intense dark volcanic background, glowing red-hot molten lava accents, brilliant orange and amber-gold highlights'
    },
    {
      id: 'pal-electric',
      category: 'energy',
      name: '일렉트릭 옐로우',
      mode: 'dark',
      colors: ['#0A0A0E', '#1E1B18', '#B08B00', '#FFD000', '#FFFFE0'],
      colorMapping: 'dark charcoal background, electric gold-yellow energy lines, warm amber glows, pale yellow highlights'
    },
    {
      id: 'pal-crimson',
      category: 'energy',
      name: '크림슨 스파크',
      mode: 'dark',
      colors: ['#1C0008', '#3D0016', '#9E0031', '#FF0055', '#FF80A4'],
      colorMapping: 'deep burgundy-black shadows, hot crimson sparks, glowing pink highlights, magenta accents'
    },
    {
      id: 'pal-solar-plasma',
      category: 'energy',
      name: '태양 플라즈마 골드',
      mode: 'dark',
      colors: ['#1C0A00', '#4A1C00', '#B84A00', '#FF8F00', '#FFE082'],
      colorMapping: 'intense dark amber background, deep burnt-orange shadows, molten copper midtones, brilliant golden-yellow highlights, pale sun-gold accents'
    },
    {
      id: 'pal-supernova',
      category: 'energy',
      name: '초신성 코스믹 마젠타',
      mode: 'dark',
      colors: ['#11001C', '#31004C', '#8F00FF', '#FF00AA', '#FF85E3'],
      colorMapping: 'deep space purple background, rich violet shadows, electric purple midtones, explosive neon magenta highlights, soft pink accents'
    },
    {
      id: 'pal-hydrogen-fire',
      category: 'energy',
      name: '수소 블루 플레임',
      mode: 'dark',
      colors: ['#03001E', '#13003E', '#7300FF', '#00B4FF', '#8CE8FF'],
      colorMapping: 'deep ultraviolet-black background, deep indigo shadows, burning blue flame midtones, bright neon cyan highlights, soft sky-blue glow'
    },
    {
      id: 'pal-lithium-charge',
      category: 'energy',
      name: '리튬 이온 액티브',
      mode: 'dark',
      colors: ['#0B132B', '#1C2541', '#3A506B', '#5BC0BE', '#6FFFE9'],
      colorMapping: 'deep steel navy background, dark slate-blue shadows, electric cyan charge highlights, bright aquamarine accent glows'
    },
    {
      id: 'pal-kinetic-fusion',
      category: 'energy',
      name: '키네틱 오렌지 & 시안',
      mode: 'dark',
      colors: ['#0F1016', '#1E2235', '#FF5A09', '#00D2C4', '#FFFFFF'],
      colorMapping: 'dark charcoal-blue background, deep steel shadows, high-contrast kinetic orange streaks, glowing electric teal highlights, bright white sparks'
    },

    // ==========================================
    // 4. 감성 & 클래식 (soft) - 8 items
    // ==========================================
    {
      id: 'pal-candy',
      category: 'soft',
      name: '솜사탕 파스텔',
      mode: 'light',
      colors: ['#FFCCD5', '#FFB3C6', '#E8CBF5', '#FFF5EB', '#4A3B40'],
      colorMapping: 'soft pastel pink base, dreamy lavender-violet gradients, warm cream highlights, dark plum accents'
    },
    {
      id: 'pal-vintage',
      category: 'soft',
      name: '아날로그 웜 빈티지',
      mode: 'light',
      colors: ['#3D352E', '#857467', '#C2B2A2', '#E6DED5', '#FFE5B4'],
      colorMapping: 'warm vintage sepia shadows, nostalgic beige midtones, warm light amber highlights, rustic cream background'
    },
    {
      id: 'pal-neutral',
      category: 'soft',
      name: '뉴트럴 쿨 그레이',
      mode: 'light',
      colors: ['#1E2022', '#3F4448', '#8B949E', '#D5DCE2', '#FFFFFF'],
      colorMapping: 'minimalist dark charcoal and cool gray surfaces, clean white highlights, slate-gray shadows'
    },
    {
      id: 'pal-cherry-blossom',
      category: 'soft',
      name: '벚꽃 핑크 그라데이션',
      mode: 'light',
      colors: ['#4A373A', '#8C5E62', '#D9828A', '#FFB3BA', '#FFF2F2'],
      colorMapping: 'deep burgundy-brown shadows, warm rose-grey midtones, soft cherry blossom pink highlights, delicate blush-white background'
    },
    {
      id: 'pal-morning-mist',
      category: 'soft',
      name: '새벽 안개 라벤더',
      mode: 'light',
      colors: ['#1B1C22', '#3E4153', '#7A80A8', '#B7BCDF', '#EAEBFF'],
      colorMapping: 'cool misty dark background, slate-blue shadows, dusky lavender midtones, pale lavender-blue highlights, soft white fog accents'
    },
    {
      id: 'pal-matcha-latte',
      category: 'soft',
      name: '말차 라떼 그린',
      mode: 'light',
      colors: ['#2D3325', '#576249', '#8C9A78', '#C5D0B2', '#F3F6EB'],
      colorMapping: 'deep olive-brown shadows, warm matcha green midtones, soft sage highlights, creamy milk-white background'
    },
    {
      id: 'pal-warm-cozy',
      category: 'soft',
      name: '난로가 웜 베이지',
      mode: 'light',
      colors: ['#332721', '#5C4A42', '#A38A7F', '#E2D4CD', '#FDFBF7'],
      colorMapping: 'deep cocoa brown shadows, warm taupe midtones, soft linen-beige highlights, pure cream-white background'
    },
    {
      id: 'pal-monochrome-soft',
      category: 'soft',
      name: '소프트 모노크롬 그레이',
      mode: 'light',
      colors: ['#1A1A1A', '#3A3A3A', '#7F7F7F', '#CCCCCC', '#F5F5F5'],
      colorMapping: 'classic charcoal background, medium dark gray shadows, neutral gray midtones, light gray highlights, clean soft off-white borders'
    }
  ];

  // 로컬 상태
  let activeStep = 1; // Wizard 단계: 1, 2, 3
  let activeCategory = 'steel';
  let selectedSubjId = 'mix-steel-hot-rolling';
  let selectedMediumId = 'med-3d';
  let selectedPaletteIdx = 16; // 기본: 용광로 볼케이노 (0-indexed 16th item)
  let activePaletteFilter = 'all';
  let activeMediumCategory = MIXER_MEDIUMS.find(medium => medium.id === selectedMediumId)?.category || 'tech3d';
  let activePaletteCategory = MIXER_PALETTES[selectedPaletteIdx]?.category || 'tech';
  let lastGeneratedImageUrl = null;
  let lastGeneratedPrompt = null;

  // 스타일 주입 (화풍 믹서 위저드 스텝퍼 및 실시간 하이라이팅 포함)
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    .tab-pane.concept-mixer-page.active {
      display: flex;
      min-height: 0;
      overflow-y: auto;
    }
    .concept-mixer-page .concept-mixer-container {
      width: 100%;
      min-width: 0;
    }
    .mixer-workspace {
      display: grid;
      grid-template-columns: minmax(0, 1.45fr) minmax(360px, 0.75fr);
      gap: 18px;
      min-height: 520px;
      align-items: start;
    }
    .mixer-left {
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: var(--surface-1, #fff);
      border: 1px solid var(--line, #e5e7eb);
      border-radius: 14px;
      padding: 18px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
      min-width: 0;
    }
    .mixer-right {
      display: flex;
      flex-direction: column;
      align-self: flex-start;
      position: sticky;
      top: 12px;
      width: 100%;
      min-width: 0;
    }

    /* 위저드 스텝퍼 */
    .mixer-stepper {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      align-items: center;
      position: relative;
      background: var(--surface-2, #f8fafc);
      padding: 8px;
      border-radius: 12px;
      border: 1px solid var(--line, #e2e8f0);
      margin-bottom: 0;
      gap: 8px;
    }
    .mixer-step-tab {
      min-width: 0;
      border: 1px solid transparent;
      background: transparent;
      padding: 10px 12px;
      font-size: 13px;
      font-weight: 700;
      color: var(--text-secondary, #64748b);
      cursor: pointer;
      border-radius: 10px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: grid;
      grid-template-columns: 24px minmax(0, 1fr);
      align-items: center;
      gap: 9px;
      text-align: left;
    }
    .mixer-step-tab .step-num {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--surface-3, #cbd5e1);
      color: var(--text-secondary, #64748b);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 800;
      transition: all 0.2s;
    }
    .mixer-step-tab.active {
      color: var(--accent, #4361ee);
      border-color: var(--accent-faint, #c7d2fe);
      background: var(--surface-1, #fff);
      box-shadow: 0 3px 10px rgba(67, 97, 238, 0.08);
    }
    .mixer-step-tab.active .step-num {
      background: var(--accent, #4361ee);
      color: #ffffff;
      box-shadow: 0 0 0 4px rgba(67, 97, 238, 0.15);
    }
    .mixer-step-tab.completed {
      color: var(--accent-faint-active, #2563eb);
    }
    .mixer-step-tab.completed .step-num {
      background: var(--accent-faint, #e0e7ff);
      color: var(--accent, #4361ee);
      font-size: 10px;
    }
    .mixer-step-copy {
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: 3px;
    }
    .mixer-step-label {
      font-size: 12px;
      line-height: 1.2;
      color: inherit;
    }
    .mixer-step-current {
      overflow: hidden;
      color: var(--ink, #1a1f2b);
      font-size: 12.5px;
      font-weight: 800;
      line-height: 1.35;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .mixer-step-current.empty {
      color: var(--text-secondary, #94a3b8);
      font-weight: 600;
    }

    /* 실시간 선택 요약 바 */
    .mixer-summary-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--surface-2, #f8fafc);
      border: 1px dashed var(--accent-faint, #c7d2fe);
      border-radius: 10px;
      padding: 10px 16px;
      margin-bottom: 0;
      font-size: 13px;
      color: var(--ink, #1a1f2b);
      flex-wrap: wrap;
    }
    .mixer-summary-title {
      font-weight: 700;
      color: var(--accent, #4361ee);
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .mixer-summary-chips {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .mixer-summary-chip {
      background: var(--surface-1, #fff);
      border: 1px solid var(--line, #e2e8f0);
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 12px;
      font-weight: 600;
      color: var(--ink, #1a1f2b);
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 4px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    }
    .mixer-summary-chip span {
      color: var(--text-secondary, #64748b);
      font-weight: normal;
    }
    .mixer-summary-chip:hover {
      border-color: var(--accent, #4361ee);
      background: var(--accent-faint-alpha, #f0f4ff);
      color: var(--accent, #4361ee);
      transform: translateY(-1px);
    }
    .mixer-summary-chip.empty {
      color: var(--text-secondary, #94a3b8);
      border-style: dotted;
      background: transparent;
    }
    .mixer-summary-arrow {
      color: var(--text-secondary, #cbd5e1);
      font-size: 10px;
    }

    /* 단계별 컨테이너 */
    .mixer-step-pane {
      display: none;
      flex-direction: column;
      gap: 16px;
      animation: mixerSlideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .mixer-step-pane.active {
      display: flex;
    }
    @keyframes mixerSlideUp {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .mixer-section-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--ink, #1a1f2b);
      margin: 0 0 6px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .mixer-section-title span {
      background: var(--accent-faint, #e0e7ff);
      color: var(--accent, #4361ee);
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }
    .mixer-sub-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-secondary, #64748b);
      margin: 16px 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .mixer-sub-title::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--line, #e5e7eb);
    }
    
    /* 주제 분류 탭 */
    .mixer-cat-tabs {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid var(--line, #e5e7eb);
      padding-bottom: 6px;
      margin-bottom: 4px;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
    }
    .mixer-cat-tabs::-webkit-scrollbar { display: none; }
    .mixer-cat-btn {
      border: 0;
      background: transparent;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary, #64748b);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .mixer-cat-btn.active {
      color: var(--accent, #4361ee);
      border-bottom-color: var(--accent, #4361ee);
      font-weight: 700;
    }

    /* 그리드 형태 선택기 */
    .mixer-subj-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 9px;
      max-height: 330px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .mixer-med-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 9px;
      margin-bottom: 12px;
      align-items: stretch;
    }
    
    /* 아이템 카드 고도화 */
    .mixer-item-card {
      border: 1.5px solid var(--line, #e5e7eb);
      background: var(--surface-1, #fff);
      border-radius: 10px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
      box-shadow: 0 1px 3px rgba(0,0,0,0.01);
      width: 100%;
      text-align: left;
      font-family: inherit;
    }
    .mixer-item-card:hover {
      border-color: var(--accent-faint, #c7d2fe);
      background: var(--surface-2, #f8fafc);
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(67, 97, 238, 0.04);
    }
    .mixer-item-card.active {
      border-color: var(--accent, #4361ee);
      background: var(--accent-faint-alpha, #f0f4ff);
      box-shadow: 0 8px 16px rgba(67, 97, 238, 0.06);
    }
    
    /* 선택 체크마크 뱃지 */
    .mixer-item-card::after {
      content: '';
      position: absolute;
      top: 10px;
      right: 10px;
      width: 18px;
      height: 18px;
      background: var(--accent, #4361ee);
      color: white;
      border-radius: 50%;
      font-size: 10px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transform: scale(0.6);
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .mixer-item-card.active::after {
      content: '✓';
      opacity: 1;
      transform: scale(1);
    }
    .mixer-item-card:focus-visible,
    .mixer-cat-btn:focus-visible,
    .mixer-step-tab:focus-visible,
    .mixer-action-btn:focus-visible,
    .mixer-nav-btn:focus-visible,
    .mixer-utility-btn:focus-visible,
    .mixer-prompt-details summary:focus-visible,
    .mixer-settings summary:focus-visible {
      outline: 3px solid rgba(67, 97, 238, 0.24);
      outline-offset: 2px;
    }

    .mixer-item-head {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 700;
      color: var(--ink, #1a1f2b);
    }
    .mixer-item-desc {
      font-size: 12.5px;
      color: var(--text-secondary, #64748b);
      line-height: 1.55;
      margin: 2px 0 0 0;
    }

    /* 카드 내 하단 미리보기 영역 (일관되게 렌더링) */
    .mixer-med-preview-area {
      display: none;
      width: 100%;
      margin-top: 10px;
      border-top: 1px dashed var(--line, #e2e8f0);
      padding-top: 10px;
      animation: mixerFadeIn 0.2s ease-in-out;
    }
    .mixer-item-card.active .mixer-med-preview-area {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .mixer-med-preview-img {
      width: 100%;
      height: 90px;
      border-radius: 8px;
      background: #f8fafc;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--line, #e2e8f0);
    }
    .mixer-med-preview-title {
      font-size: 10px;
      font-weight: 700;
      color: var(--ink, #1a1f2b);
      text-align: center;
      line-height: 1.35;
    }
    .mixer-med-preview-meta {
      font-size: 9px;
      color: var(--text-secondary, #64748b);
      text-align: center;
      font-family: monospace;
      background: var(--surface-2, #f1f5f9);
      padding: 2px 4px;
      border-radius: 4px;
      word-break: break-all;
    }

    /* 실시간 이미지 프리뷰 상자 */
    .mixer-preview-image-box {
      width: 100%;
      aspect-ratio: 1 / 1;
      margin: 12px 0;
      border-radius: 12px;
      border: 1.5px dashed var(--line, #cbd5e1);
      background: var(--surface-2, #f8fafc);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
      transition: all 0.3s ease;
      cursor: pointer;
    }
    .mixer-preview-image-box.has-image {
      border-style: solid;
      border-color: var(--accent-faint, #c7d2fe);
      box-shadow: 0 4px 12px rgba(67, 97, 238, 0.04);
    }
    .mixer-preview-image-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .mixer-preview-image-box.has-image:hover img {
      transform: scale(1.03);
    }
    .mixer-preview-image-placeholder {
      font-size: 11px;
      color: var(--text-secondary, #94a3b8);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      text-align: center;
      padding: 20px;
    }
    .mixer-preview-image-placeholder .placeholder-icon {
      font-size: 24px;
      opacity: 0.6;
    }
    
    /* 로딩 스켈레톤 애니메이션 */
    .mixer-preview-image-box.loading {
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: mixerSkeleton 1.5s infinite;
      cursor: wait;
      border-style: solid;
      border-color: var(--line, #cbd5e1);
    }
    @keyframes mixerSkeleton {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    .mixer-preview-image-box.loading::after {
      content: '⚡ 이미지 생성 중...';
      position: absolute;
      font-size: 11px;
      font-weight: 700;
      color: var(--accent, #4361ee);
      background: rgba(255,255,255,0.85);
      padding: 6px 12px;
      border-radius: 20px;
      border: 1px solid var(--accent-faint, #c7d2fe);
      box-shadow: 0 2px 8px rgba(67, 97, 238, 0.1);
    }

    /* 이미지 생성 액션 버튼 */
    .mixer-action-btn.generate {
      background: linear-gradient(135deg, var(--accent, #4361ee), #3f37c9);
      color: white;
      border-color: var(--accent, #4361ee);
      box-shadow: 0 2px 6px rgba(67, 97, 238, 0.2);
    }
    .mixer-action-btn.generate:hover:not(:disabled) {
      background: linear-gradient(135deg, #3a54d6, #322baf);
      box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
    }
    
    /* 모달 라이트박스(Lightbox) */
    .mixer-lightbox {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(10, 10, 16, 0.85);
      backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      cursor: zoom-out;
    }
    .mixer-lightbox.visible {
      opacity: 1;
      visibility: visible;
    }
    .mixer-lightbox-content {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      cursor: default;
    }
    .mixer-lightbox-img {
      max-width: 100%;
      max-height: 80vh;
      border-radius: 12px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      border: 2px solid rgba(255,255,255,0.1);
      object-fit: contain;
    }
    .mixer-lightbox-close {
      position: absolute;
      top: -40px;
      right: 0;
      background: transparent;
      border: 0;
      color: #fff;
      font-size: 28px;
      cursor: pointer;
      opacity: 0.8;
      transition: opacity 0.2s;
    }
    .mixer-lightbox-close:hover {
      opacity: 1;
    }
    .mixer-lightbox-title {
      color: #ffffff;
      font-size: 13px;
      font-weight: 600;
      text-align: center;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
      background: rgba(255,255,255,0.1);
      padding: 6px 14px;
      border-radius: 20px;
    }

    @keyframes mixerFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    }
    @keyframes mixerSkeleton {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    .mixer-preview-image-box.loading::after {
      content: '⚡ 이미지 생성 중...';
      position: absolute;
      font-size: 11px;
      font-weight: 700;
      color: var(--accent, #4361ee);
      background: rgba(255,255,255,0.85);
      padding: 6px 12px;
      border-radius: 20px;
      border: 1px solid var(--accent-faint, #c7d2fe);
      box-shadow: 0 2px 8px rgba(67, 97, 238, 0.1);
    }

    /* 이미지 생성 액션 버튼 */
    .mixer-action-btn.generate {
      background: linear-gradient(135deg, var(--accent, #4361ee), #3f37c9);
      color: white;
      border-color: var(--accent, #4361ee);
      box-shadow: 0 2px 6px rgba(67, 97, 238, 0.2);
    }
    .mixer-action-btn.generate:hover:not(:disabled) {
      background: linear-gradient(135deg, #3a54d6, #322baf);
      box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
    }
    
    /* 모달 라이트박스(Lightbox) */
    .mixer-lightbox {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(10, 10, 16, 0.85);
      backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      cursor: zoom-out;
    }
    .mixer-lightbox.visible {
      opacity: 1;
      visibility: visible;
    }
    .mixer-lightbox-content {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      cursor: default;
    }
    .mixer-lightbox-img {
      max-width: 100%;
      max-height: 80vh;
      border-radius: 12px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      border: 2px solid rgba(255,255,255,0.1);
      object-fit: contain;
    }
    .mixer-lightbox-close {
      position: absolute;
      top: -40px;
      right: 0;
      background: transparent;
      border: 0;
      color: #fff;
      font-size: 28px;
      cursor: pointer;
      opacity: 0.8;
      transition: opacity 0.2s;
    }
    .mixer-lightbox-close:hover {
      opacity: 1;
    }
    .mixer-lightbox-title {
      color: #ffffff;
      font-size: 13px;
      font-weight: 600;
      text-align: center;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
      background: rgba(255,255,255,0.1);
      padding: 6px 14px;
      border-radius: 20px;
    }

    @keyframes mixerFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .mixer-sub-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-secondary, #64748b);
      margin: 16px 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .mixer-sub-title::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--line, #e5e7eb);
    }
    
    /* 주제 분류 탭 */
    .mixer-cat-tabs {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid var(--line, #e5e7eb);
      padding-bottom: 6px;
      margin-bottom: 4px;
    }
    .mixer-cat-btn {
      border: 0;
      background: transparent;
      padding: 6px 12px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary, #64748b);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }
    .mixer-cat-btn.active {
      color: var(--accent, #4361ee);
      border-bottom-color: var(--accent, #4361ee);
      font-weight: 700;
    }

    /* 그리드 형태 선택기 */
    .mixer-subj-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px;
      max-height: 360px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .mixer-med-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 12px;
      margin-bottom: 12px;
    }
    
    /* 아이템 카드 고도화 */
    .mixer-item-card {
      border: 1.5px solid var(--line, #e5e7eb);
      background: var(--surface-1, #fff);
      border-radius: 10px;
      padding: 14px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
      box-shadow: 0 1px 3px rgba(0,0,0,0.01);
    }
    .mixer-item-card:hover {
      border-color: var(--accent-faint, #c7d2fe);
      background: var(--surface-2, #f8fafc);
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(67, 97, 238, 0.04);
    }
    .mixer-item-card.active {
      border-color: var(--accent, #4361ee);
      background: var(--accent-faint-alpha, #f0f4ff);
      box-shadow: 0 8px 16px rgba(67, 97, 238, 0.06);
    }
    
    /* 선택 체크마크 뱃지 */
    .mixer-item-card::after {
      content: '✓';
      position: absolute;
      top: 10px;
      right: 10px;
      width: 18px;
      height: 18px;
      background: var(--accent, #4361ee);
      color: white;
      border-radius: 50%;
      font-size: 10px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transform: scale(0.6);
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .mixer-item-card.active::after {
      opacity: 1;
      transform: scale(1);
    }

    .mixer-item-head {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      font-weight: 700;
      color: var(--ink, #1a1f2b);
    }
    .mixer-item-desc {
      font-size: 11px;
      color: var(--text-secondary, #64748b);
      line-height: 1.45;
      margin: 2px 0 0 0;
    }

    /* 팔레트 그룹 그리드 */
    .mixer-palettes-group-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
      max-height: 360px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .mixer-palette-group-block {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .mixer-palette-dots {
      display: flex;
      gap: 5px;
      margin: 6px 0;
      justify-content: flex-start;
    }
    .mixer-palette-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 1px solid rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    .mixer-item-card:hover .mixer-palette-dot {
      transform: scale(1.15);
    }

    /* 팔레트 필터 탭 바 */
    .mixer-pal-filter-tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 14px;
      background: var(--surface-2, #f1f5f9);
      padding: 4px;
      border-radius: 8px;
      width: fit-content;
      border: 1px solid var(--line, #e2e8f0);
    }
    .mixer-pal-filter-btn {
      border: 0;
      background: transparent;
      padding: 5px 12px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary, #64748b);
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .mixer-pal-filter-btn.active {
      background: var(--surface-1, #ffffff);
      color: var(--accent, #4361ee);
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
      font-weight: 700;
    }

    /* 팔레트 모드 뱃지 */
    .mixer-palette-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 3px;
      z-index: 5;
    }
    .mixer-palette-badge.light {
      background: #fff9db;
      color: #f08c00;
      border: 1px solid #ffe3e3;
    }
    .mixer-palette-badge.dark {
      background: #e7f5ff;
      color: #1c7ed6;
      border: 1px solid #d0ebff;
    }
    .mixer-item-card.active .mixer-palette-badge {
      right: 36px; /* active 상태일 때 체크마크 ✓ 와 겹치지 않게 처리 */
    }

    /* 화풍 미리보기 미니 팝업 (데스크톱) */
    .mixer-med-popup {
      position: absolute;
      bottom: 115%;
      left: 50%;
      transform: translateX(-50%) translateY(8px);
      width: 190px;
      background: var(--surface-1, #ffffff);
      border: 1.5px solid var(--accent, #4361ee);
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(67, 97, 238, 0.15);
      padding: 8px;
      z-index: 150;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .mixer-item-card.active .mixer-med-popup {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0);
    }
    .mixer-med-popup::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: var(--accent, #4361ee);
    }
    .mixer-med-popup-img {
      width: 100%;
      height: 100px;
      border-radius: 8px;
      background: #f8fafc;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--line, #e2e8f0);
    }
    .mixer-med-popup-title {
      font-size: 10px;
      font-weight: 700;
      color: var(--ink, #1a1f2b);
      text-align: center;
      line-height: 1.3;
    }
    .mixer-med-popup-meta {
      font-size: 9px;
      color: var(--text-secondary, #64748b);
      text-align: center;
      font-family: monospace;
      background: var(--surface-2, #f1f5f9);
      padding: 2px 4px;
      border-radius: 4px;
      word-break: break-all;
    }
    
    /* 모바일 아코디언 미리보기 영역 */
    .mixer-med-mobile-preview {
      display: none;
      width: 100%;
      margin-top: 8px;
      border-top: 1px dashed var(--line, #e2e8f0);
      padding-top: 8px;
      animation: mixerFadeIn 0.2s ease-in-out;
    }
    .mixer-item-card.active .mixer-med-mobile-preview {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .mixer-med-mobile-img {
      width: 100%;
      height: 80px;
      border-radius: 6px;
      background: #f8fafc;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--line, #e2e8f0);
    }
    
    @keyframes mixerFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* 위저드 내비게이션 바 */
    .mixer-wizard-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 16px;
      border-top: 1px solid var(--line, #e5e7eb);
    }
    .mixer-nav-btn {
      border: 1px solid var(--line, #cbd5e1);
      background: var(--surface-1, #fff);
      border-radius: 8px;
      padding: 9px 18px;
      font-size: 12px;
      font-weight: 700;
      color: var(--ink, #1a1f2b);
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .mixer-nav-btn:hover:not(:disabled) {
      background: var(--surface-2, #f1f5f9);
      border-color: var(--text-secondary, #94a3b8);
    }
    .mixer-nav-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .mixer-nav-btn.next {
      background: var(--accent, #4361ee);
      color: white;
      border-color: var(--accent, #4361ee);
      box-shadow: 0 2px 4px rgba(67, 97, 238, 0.15);
    }
    .mixer-nav-btn.next:hover:not(:disabled) {
      background: #304fd0;
      box-shadow: 0 4px 8px rgba(67, 97, 238, 0.25);
    }

    /* 미리보기 카드 */
    .mixer-preview-card {
      width: 100%;
      border: 1px solid var(--line, #e2e8f0);
      border-radius: 14px;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      animation: mixerPreviewFadeIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes mixerPreviewFadeIn {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* 미리보기 카드 Glassmorphic & Hover 효과 */
    .mixer-preview-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.08);
      border-color: var(--accent, #4361ee);
    }

    /* 색상 테마 비율 바 (Palette Weight Bar) */
    .mixer-palette-weight-bar {
      display: flex;
      width: 100%;
      height: 14px;
      border-radius: 999px;
      overflow: hidden;
      margin-bottom: 8px;
      border: 1px solid var(--line, #e2e8f0);
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.06);
    }
    .mixer-palette-weight-segment {
      height: 100%;
      transition: width 0.3s ease;
    }
    .mixer-palette-weight-labels {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-secondary, #64748b);
      margin-top: 4px;
      padding: 0 4px;
    }
    
    /* 흐르는 그래디언트 애니메이션 */
    .mixer-preview-header {
      padding: 18px;
      color: white;
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
      background-size: 200% 200%;
      animation: mixerGradientMove 10s ease infinite;
    }
    @keyframes mixerGradientMove {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .mixer-preview-emoji {
      font-size: 32px;
      margin-bottom: 2px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
    }
    .mixer-preview-title {
      font-size: 17px;
      font-weight: 700;
      margin: 0;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    }
    .mixer-preview-sub {
      font-size: 12px;
      opacity: 0.85;
      margin: 0;
      text-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    .mixer-preview-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .mixer-preview-desc {
      font-size: 13px;
      color: var(--text-secondary, #64748b);
      line-height: 1.55;
      margin: 0;
    }
    .mixer-preview-prompt-box {
      background: var(--surface-2, #f8fafc);
      border: 1px solid var(--line, #e2e8f0);
      border-radius: 10px;
      padding: 14px;
      font-size: 12.5px;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      line-height: 1.6;
      color: var(--ink, #1a1f2b);
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 160px;
      overflow-y: auto;
      margin: 0;
    }
    
    /* 프롬프트 조립 하이라이트 */
    .hl-medium {
      background: rgba(67, 97, 238, 0.06);
      color: var(--accent, #4361ee);
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      border: 1px solid rgba(67, 97, 238, 0.12);
    }
    .hl-subj {
      background: rgba(16, 185, 129, 0.06);
      color: #10b981;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      border: 1px solid rgba(16, 185, 129, 0.12);
    }
    .hl-palette {
      background: rgba(245, 158, 11, 0.06);
      color: #d97706;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      border: 1px solid rgba(245, 158, 11, 0.12);
    }

    .mixer-preview-actions {
      display: flex;
      gap: 8px;
    }
    .mixer-action-btn {
      flex: 1;
      border: 0;
      border-radius: 8px;
      padding: 11px 0;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
    }
    .mixer-action-btn.copy {
      background: var(--surface-3, #e2e8f0);
      color: var(--ink, #1a1f2b);
    }
    .mixer-action-btn.copy:hover {
      background: var(--line, #cbd5e1);
      transform: translateY(-1px);
    }
    .mixer-action-btn.apply {
      background: var(--accent, #4361ee);
      color: white;
      box-shadow: 0 2px 4px rgba(67, 97, 238, 0.15);
    }
    .mixer-action-btn.apply:hover {
      background: #304fd0;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(67, 97, 238, 0.25);
    }
    .mixer-feedback {
      text-align: center;
      font-size: 12px;
      color: var(--accent, #4361ee);
      height: 16px;
      margin-top: -6px;
      font-weight: 600;
      visibility: hidden;
    }
    .mixer-feedback.visible {
      visibility: visible;
    }

    .mixer-toolbar {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 10px;
    }
    .mixer-toolbar-copy h3 {
      font-size: 18px;
      font-weight: 800;
      color: var(--ink, #1a1f2b);
      margin: 0 0 4px;
    }
    .mixer-toolbar-copy p {
      font-size: 13px;
      line-height: 1.5;
      color: var(--text-secondary, #64748b);
      margin: 0;
    }
    .mixer-toolbar-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    #btnScrollToPreview {
      display: none;
    }
    .mixer-utility-btn,
    .mixer-settings summary {
      min-height: 34px;
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 8px;
      padding: 7px 10px;
      background: var(--surface-1, #fff);
      color: var(--ink, #1a1f2b);
      font: 700 12px/1.2 inherit;
      cursor: pointer;
      list-style: none;
      white-space: nowrap;
    }
    .mixer-utility-btn:hover,
    .mixer-settings summary:hover {
      border-color: var(--accent, #4361ee);
      color: var(--accent, #4361ee);
    }
    .mixer-utility-btn.primary {
      color: var(--accent, #4361ee);
      background: var(--accent-faint-alpha, #f0f4ff);
      border-color: var(--accent-faint, #c7d2fe);
    }
    .mixer-hidden-proxy {
      position: absolute !important;
      width: 0 !important;
      height: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      border: 0 !important;
      opacity: 0 !important;
      pointer-events: none !important;
      overflow: hidden !important;
    }
    .mixer-settings {
      position: relative;
    }
    .mixer-settings summary::-webkit-details-marker { display: none; }
    .mixer-settings-panel {
      position: absolute;
      z-index: 20;
      top: calc(100% + 7px);
      right: 0;
      width: min(360px, calc(100vw - 36px));
      padding: 12px;
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 10px;
      background: var(--surface-1, #fff);
      box-shadow: 0 14px 34px rgba(15, 23, 42, 0.14);
    }
    .mixer-settings-label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      color: var(--ink, #1a1f2b);
      margin-bottom: 7px;
    }
    .mixer-settings-row,
    .mixer-search-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .mixer-settings-input,
    .mixer-search-input {
      width: 100%;
      min-width: 0;
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 8px;
      background: var(--surface-1, #fff);
      color: var(--ink, #1a1f2b);
      outline: none;
      font: 500 13px/1.3 inherit;
    }
    .mixer-settings-input { padding: 8px 9px; }
    .mixer-search-input { padding: 9px 11px; }
    .mixer-settings-input:focus,
    .mixer-search-input:focus {
      border-color: var(--accent, #4361ee);
      box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
    }
    .mixer-search-empty {
      display: none;
      padding: 24px;
      text-align: center;
      color: var(--text-secondary, #64748b);
      font-size: 13px;
    }
    .mixer-preview-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .mixer-preview-label strong {
      font-size: 15px;
      color: var(--ink, #1a1f2b);
    }
    .mixer-preview-label span {
      font-size: 11px;
      font-weight: 700;
      color: #059669;
      background: #ecfdf5;
      border-radius: 999px;
      padding: 4px 8px;
    }
    .mixer-result-image {
      position: relative;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      background: var(--surface-2, #f8fafc);
    }
    .mixer-result-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .mixer-result-image-overlay {
      position: absolute;
      inset: auto 0 0;
      padding: 26px 16px 14px;
      color: #fff;
      background: linear-gradient(transparent, rgba(2, 6, 23, 0.82));
    }
    .mixer-result-image-overlay strong {
      display: block;
      font-size: 16px;
      margin-bottom: 3px;
    }
    .mixer-result-image-overlay span {
      font-size: 12px;
      opacity: 0.86;
    }
    .mixer-result-image-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      padding: 5px 8px;
      border-radius: 999px;
      background: rgba(2, 6, 23, 0.72);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      backdrop-filter: blur(8px);
    }
    .mixer-selection-list {
      display: grid;
      grid-template-columns: 1fr;
      gap: 6px;
    }
    .mixer-selection-item {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      font-size: 13px;
      color: var(--ink, #1a1f2b);
    }
    .mixer-selection-item span {
      flex: 0 0 42px;
      color: var(--text-secondary, #64748b);
      font-size: 11px;
      font-weight: 700;
    }
    .mixer-selection-item strong {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .mixer-preview-tools {
      display: flex;
      flex-direction: column;
      gap: 9px;
      padding: 12px;
      border: 1px solid var(--line, #e2e8f0);
      border-radius: 10px;
      background: var(--surface-2, #f8fafc);
    }
    .mixer-preview-tools-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 12px;
      font-weight: 800;
      color: var(--ink, #1a1f2b);
    }
    .mixer-preview-tools-title span {
      font-size: 10px;
      font-weight: 600;
      color: var(--text-secondary, #64748b);
    }
    .mixer-preview-tool-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px;
    }
    .mixer-preview-tool-btn {
      min-height: 34px;
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 7px;
      background: var(--surface-1, #fff);
      color: var(--ink, #1a1f2b);
      font: 700 11px/1.2 inherit;
      cursor: pointer;
    }
    .mixer-preview-tool-btn:hover {
      border-color: var(--accent, #4361ee);
      color: var(--accent, #4361ee);
    }
    .mixer-preview-tool-btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .mixer-preview-keyword-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      gap: 5px;
    }
    .mixer-preview-keyword-row input {
      min-width: 0;
      padding: 8px 9px;
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 7px;
      background: var(--surface-1, #fff);
      color: var(--ink, #1a1f2b);
      font: 500 12px/1.2 inherit;
      outline: none;
    }
    .mixer-preview-keyword-row input:focus {
      border-color: var(--accent, #4361ee);
      box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
    }
    .mixer-preview-medium-prefix {
      font: 500 10.5px/1.45 'SFMono-Regular', Consolas, monospace;
      color: var(--text-secondary, #64748b);
      overflow-wrap: anywhere;
    }
    .mixer-preview-tool-status {
      min-height: 15px;
      font-size: 10.5px;
      color: var(--text-secondary, #64748b);
    }
    .mixer-prompt-details {
      border: 1px solid var(--line, #e2e8f0);
      border-radius: 10px;
      overflow: hidden;
    }
    .mixer-prompt-details summary {
      padding: 10px 12px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 700;
      color: var(--ink, #1a1f2b);
      background: var(--surface-2, #f8fafc);
    }
    .mixer-prompt-details .mixer-preview-prompt-box {
      border: 0;
      border-top: 1px solid var(--line, #e2e8f0);
      border-radius: 0;
    }
    /* 중복 레거시 규칙 이후에 적용되는 최종 가독성 기준 */
    .mixer-sub-title { font-size: 12px; }
    .mixer-cat-tabs {
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
    }
    .mixer-cat-tabs::-webkit-scrollbar { display: none; }
    .mixer-cat-btn {
      font-size: 12px;
      white-space: nowrap;
    }
    .mixer-subj-grid {
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 9px;
      max-height: 330px;
      padding-top: 4px;
    }
    .mixer-med-grid {
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 9px;
      align-items: stretch;
      padding-top: 4px;
    }
    .mixer-palettes-group-grid {
      padding-top: 4px;
    }
    .mixer-item-card {
      padding: 12px;
      width: 100%;
      text-align: left;
      font-family: inherit;
    }
    .mixer-item-card::after { content: ''; }
    .mixer-item-card.active::after { content: '✓'; }
    .mixer-item-card.active:hover {
      transform: none;
    }
    .mixer-item-head { font-size: 14px; }
    .mixer-item-desc {
      font-size: 12.5px;
      line-height: 1.55;
    }
    .mixer-nav-btn {
      font-size: 13px;
    }
    .mixer-palette-badge,
    .mixer-med-preview-title,
    .mixer-med-preview-meta {
      font-size: 11px;
      line-height: 1.45;
    }

    /* 다크모드 대응 */
    [data-theme="dark"] .mixer-left {
      background: #1e1e2d;
      border-color: #2b2b3d;
      box-shadow: none;
    }
    [data-theme="dark"] .mixer-stepper {
      background: #151521;
      border-color: #2b2b3d;
    }
    [data-theme="dark"] .mixer-step-tab .step-num {
      background: #2b2b3d;
      color: #8b949e;
    }
    [data-theme="dark"] .mixer-step-tab.active {
      color: var(--accent, #4361ee);
    }
    [data-theme="dark"] .mixer-step-tab.active .step-num {
      background: var(--accent, #4361ee);
      color: #ffffff;
    }
    [data-theme="dark"] .mixer-step-tab.completed .step-num {
      background: rgba(67, 97, 238, 0.15);
      color: #8da2fb;
      border-color: var(--accent, #4361ee);
    }
    [data-theme="dark"] .mixer-step-tab.active {
      background: #1e1e2d;
      border-color: rgba(67, 97, 238, 0.45);
    }
    [data-theme="dark"] .mixer-step-current {
      color: #eaeaea;
    }
    [data-theme="dark"] .mixer-summary-bar {
      background: #151521;
      border-color: rgba(67, 97, 238, 0.3);
    }
    [data-theme="dark"] .mixer-summary-chip {
      background: #1e1e2d;
      border-color: #2b2b3d;
      color: #eaeaea;
    }
    [data-theme="dark"] .mixer-summary-chip:hover {
      border-color: var(--accent, #4361ee);
      background: rgba(67, 97, 238, 0.1);
    }
    [data-theme="dark"] .mixer-item-card {
      background: #1e1e2d;
      border-color: #2b2b3d;
    }
    [data-theme="dark"] .mixer-item-card:hover {
      background: #232335;
      border-color: rgba(67, 97, 238, 0.3);
    }
    [data-theme="dark"] .mixer-item-card.active {
      background: rgba(67, 97, 238, 0.15);
      border-color: var(--accent, #4361ee);
    }
    [data-theme="dark"] .mixer-item-head {
      color: #eaeaea;
    }
    [data-theme="dark"] .mixer-pal-filter-tabs {
      background: #151521;
      border-color: #2b2b3d;
    }
    [data-theme="dark"] .mixer-pal-filter-btn.active {
      background: #1e1e2d;
      color: var(--accent, #4361ee);
    }
    [data-theme="dark"] .mixer-med-popup {
      background: #1e1e2d;
      border-color: var(--accent, #4361ee);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    }
    [data-theme="dark"] .mixer-med-popup-title {
      color: #eaeaea;
    }
    [data-theme="dark"] .mixer-med-popup-meta {
      background: #151521;
      color: #8b949e;
    }
    [data-theme="dark"] .mixer-med-popup-img,
    [data-theme="dark"] .mixer-med-mobile-img {
      background: #151521;
      border-color: #2b2b3d;
    }
    [data-theme="dark"] .mixer-preview-card {
      background: rgba(30, 30, 45, 0.85);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-color: rgba(43, 43, 61, 0.6);
    }
    [data-theme="dark"] .mixer-preview-prompt-box {
      background: #151521;
      border-color: #2b2b3d;
      color: #e0e0e0;
    }
    [data-theme="dark"] .mixer-preview-tools {
      background: #151521;
      border-color: #2b2b3d;
    }
    [data-theme="dark"] .mixer-preview-tool-btn,
    [data-theme="dark"] .mixer-preview-keyword-row input {
      background: #1e1e2d;
      border-color: #2b2b3d;
      color: #eaeaea;
    }
    [data-theme="dark"] .hl-medium {
      background: rgba(92, 124, 250, 0.12);
      color: #8da2fb;
      border-color: rgba(92, 124, 250, 0.25);
    }
    [data-theme="dark"] .hl-subj {
      background: rgba(32, 201, 151, 0.12);
      color: #52e0b5;
      border-color: rgba(32, 201, 151, 0.25);
    }
    [data-theme="dark"] .hl-palette {
      background: rgba(252, 196, 25, 0.12);
      color: #fdd561;
      border-color: rgba(252, 196, 25, 0.25);
    }
    [data-theme="dark"] .mixer-sub-title::after {
      background: #2b2b3d;
    }
    [data-theme="dark"] .mixer-wizard-nav {
      border-color: #2b2b3d;
    }
    [data-theme="dark"] .mixer-nav-btn {
      background: #1e1e2d;
      border-color: #2b2b3d;
      color: #eaeaea;
    }
    [data-theme="dark"] .mixer-nav-btn:hover:not(:disabled) {
      background: #232335;
      border-color: #5a5a5a;
    }
    [data-theme="dark"] .mixer-action-btn.copy {
      background: #2b2b3d;
      color: #eaeaea;
    }
    [data-theme="dark"] .mixer-action-btn.copy:hover {
      background: #3f3f5a;
    }

    /* 모바일 반응형 최적화 */
    @media (max-width: 900px) {
      .mixer-workspace {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-height: auto;
      }
      .mixer-left, .mixer-right {
        flex: none;
        width: 100%;
      }
      .mixer-right {
        position: static;
        margin-top: 10px;
      }
      .mixer-preview-card {
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      }
    }
    @media (max-width: 600px) {
      .mixer-toolbar {
        flex-direction: column;
      }
      .mixer-toolbar-actions {
        width: 100%;
        justify-content: flex-start;
      }
      .mixer-toolbar-actions > * {
        flex: 1 1 calc(50% - 6px);
      }
      #btnScrollToPreview {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .mixer-settings summary {
        text-align: center;
      }
      .mixer-stepper {
        padding: 8px;
        gap: 4px;
        border-radius: 8px;
      }
      .mixer-step-tab {
        grid-template-columns: 18px minmax(0, 1fr);
        padding: 7px 5px;
        gap: 4px;
      }
      .mixer-step-tab .step-num {
        width: 18px;
        height: 18px;
        font-size: 9px;
      }
      .mixer-step-label {
        font-size: 10px;
      }
      .mixer-step-current {
        font-size: 10.5px;
        display: -webkit-box;
        min-height: 28px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: normal;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }
      .mixer-left {
        padding: 13px;
      }
      .mixer-summary-bar {
        padding: 8px 12px;
      }
      .mixer-summary-chip {
        padding: 2px 6px;
        font-size: 11.5px;
      }
      .mixer-summary-title,
      .mixer-summary-arrow {
        display: none;
      }
      .mixer-subj-grid,
      .mixer-med-grid {
        grid-template-columns: 1fr;
      }
      .mixer-preview-actions {
        position: sticky;
        bottom: 8px;
        z-index: 5;
        padding: 6px;
        margin: 0 -6px -6px;
        border-radius: 10px;
        background: color-mix(in srgb, var(--surface-1, #fff) 92%, transparent);
        backdrop-filter: blur(10px);
      }
    }

    /* 화풍 샘플 갤러리 */
    .mixer-gallery-container {
      width: 100%;
      margin: 12px 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .mixer-gallery-main {
      width: 100%;
      aspect-ratio: 1 / 1;
      border-radius: 12px;
      border: 1.5px solid var(--accent-faint, #c7d2fe);
      background: var(--surface-2, #f8fafc);
      overflow: hidden;
      cursor: pointer;
      position: relative;
      box-shadow: 0 4px 12px rgba(67, 97, 238, 0.04);
    }
    .mixer-gallery-main img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
      display: block;
    }
    .mixer-gallery-main:hover img {
      transform: scale(1.03);
    }
    .mixer-gallery-zoom-badge {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(0, 0, 0, 0.65);
      color: white;
      font-size: 10px;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 700;
      pointer-events: none;
      backdrop-filter: blur(2px);
      transition: background 0.2s;
    }
    .mixer-gallery-main:hover .mixer-gallery-zoom-badge {
      background: var(--accent, #4361ee);
    }
    .mixer-gallery-thumbs {
      display: flex;
      gap: 6px;
      justify-content: space-between;
    }
    .mixer-gallery-thumb-item {
      flex: 1;
      aspect-ratio: 1.5 / 1;
      border-radius: 6px;
      border: 1.5px solid var(--line, #cbd5e1);
      overflow: hidden;
      cursor: pointer;
      opacity: 0.7;
      transition: all 0.2s ease;
      background: var(--surface-2, #f8fafc);
    }
    .mixer-gallery-thumb-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .mixer-gallery-thumb-item.active {
      border-color: var(--accent, #4361ee);
      opacity: 1;
      box-shadow: 0 2px 6px rgba(67, 97, 238, 0.15);
    }
    .mixer-gallery-thumb-item:hover {
      opacity: 1;
    }

    [data-theme="dark"] .mixer-gallery-main {
      border-color: rgba(67, 97, 238, 0.25);
    }
    [data-theme="dark"] .mixer-gallery-thumb-item {
      border-color: var(--line, #334155);
    }
    [data-theme="dark"] .mixer-gallery-thumb-item.active {
      border-color: var(--accent, #4361ee);
    }

    /* 카드 내 화풍 샘플 갤러리 */
    .mixer-med-gallery-row {
      display: flex;
      gap: 6px;
      justify-content: center;
      margin: 10px 0;
    }
    .mixer-med-gallery-thumb-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      border-radius: 6px;
      border: 1px solid var(--line, #cbd5e1);
      overflow: hidden;
      cursor: default;
      background: var(--surface-2, #f8fafc);
      transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    }
    .mixer-thumb-action-row {
      display: flex;
      gap: 6px;
      margin: 4px 0 2px;
    }
    .mixer-thumb-action-row button {
      flex: 1;
      font-size: 11px;
      padding: 5px 0;
      border-radius: 5px;
      border: 1px solid var(--line, #e2e8f0);
      background: var(--surface-2, #f8fafc);
      color: var(--text-secondary, #64748b);
      cursor: pointer;
      font-weight: 600;
      transition: border-color 0.15s, color 0.15s;
    }
    .mixer-thumb-action-row button:hover {
      border-color: var(--accent, #4361ee);
      color: var(--accent, #4361ee);
    }
    .mixer-thumb-action-row button:disabled {
      opacity: 0.55;
      cursor: default;
    }
    [data-theme="dark"] .mixer-thumb-action-row button {
      background: var(--surface-2, #1e293b);
      border-color: var(--line, #334155);
      color: var(--text-secondary, #94a3b8);
    }
    .mixer-keyword-edit-row {
      display: flex;
      align-items: center;
      gap: 4px;
      margin: 4px 0 2px;
    }
    .mixer-keyword-input {
      flex: 1;
      font-size: 11px;
      padding: 5px 7px;
      border-radius: 5px;
      border: 1px solid var(--line, #e2e8f0);
      background: var(--surface-2, #f8fafc);
      color: var(--ink, #1a1f2b);
      outline: none;
      min-width: 0;
    }
    .mixer-keyword-input:focus {
      border-color: var(--accent, #4361ee);
    }
    .mixer-keyword-apply-btn {
      font-size: 11px;
      padding: 5px 8px;
      border-radius: 5px;
      border: 1px solid var(--accent, #4361ee);
      background: transparent;
      color: var(--accent, #4361ee);
      cursor: pointer;
      font-weight: 700;
      white-space: nowrap;
    }
    .mixer-keyword-reset-btn {
      font-size: 11px;
      padding: 2px 5px;
      border-radius: 5px;
      border: 1px solid var(--line, #e2e8f0);
      background: transparent;
      color: var(--text-secondary, #64748b);
      cursor: pointer;
    }
    [data-theme="dark"] .mixer-keyword-input {
      background: var(--surface-2, #1e293b);
      border-color: var(--line, #334155);
      color: var(--ink, #f1f5f9);
    }
    [data-theme="dark"] .mixer-keyword-reset-btn {
      border-color: var(--line, #334155);
    }
    .mixer-med-gallery-thumb-wrapper:hover {
      transform: scale(1.05);
      border-color: var(--accent, #4361ee);
      box-shadow: 0 2px 8px rgba(67, 97, 238, 0.15);
    }
    .mixer-med-gallery-thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: opacity 0.25s;
    }
    .mixer-thumb-upload-btn {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.52);
      color: #fff;
      border: none;
      font-size: 11px;
      padding: 4px 0;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s;
      line-height: 1.4;
      text-align: center;
    }
    .mixer-med-gallery-thumb-wrapper:hover .mixer-thumb-upload-btn {
      opacity: 1;
    }
    .mixer-thumb-del-btn {
      position: absolute;
      top: 2px;
      right: 2px;
      background: rgba(239, 68, 68, 0.88);
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 14px;
      height: 14px;
      font-size: 9px;
      line-height: 14px;
      text-align: center;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    [data-theme="dark"] .mixer-med-gallery-thumb-wrapper {
      border-color: var(--line, #334155);
      background: var(--surface-2, #1e293b);
    }
  `;
  document.head.appendChild(styleTag);

  // 현재 조합 상태에 따라 하이라이트 HTML로 구성된 프롬프트 반환
  function buildMixedHighlightPromptHTML() {
    const categoryList = MIXER_SUBJECTS[activeCategory] || [];
    const subject = categoryList.find(s => s.id === selectedSubjId) || categoryList[0];
    const medium = MIXER_MEDIUMS.find(m => m.id === selectedMediumId) || MIXER_MEDIUMS[0];
    const palette = MIXER_PALETTES[selectedPaletteIdx];

    if (!subject || !medium || !palette) return '';

    return `<span class="hl-medium">A ${medium.prefix}</span> <span class="hl-subj">${subject.prompt}</span>. <span class="hl-medium">${medium.suffix}</span>, <span class="hl-palette">color palette: ${palette.colors.join(' ')}, ${palette.colorMapping}</span>`;
  }

  // 결합된 플레인 텍스트 프롬프트 반환 (복사용)
  function buildMixedPrompt() {
    const categoryList = MIXER_SUBJECTS[activeCategory] || [];
    const subject = categoryList.find(s => s.id === selectedSubjId) || categoryList[0];
    const medium = MIXER_MEDIUMS.find(m => m.id === selectedMediumId) || MIXER_MEDIUMS[0];
    const palette = MIXER_PALETTES[selectedPaletteIdx];

    if (!subject || !medium || !palette) return '';

    return `A ${medium.prefix} ${subject.prompt}. ${medium.suffix}, color palette: ${palette.colors.join(' ')}, ${palette.colorMapping}`;
  }

  // 48종 화풍에 맞춘 무의존성 동적 인라인 SVG 생성기
  function getMediumPreviewSVG(medId) {
    let svgContent = '';
    
    // defs 그라데이션 및 공통 필터 정의
    const defs = `
      <defs>
        <linearGradient id="g-tech" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00f0ff" />
          <stop offset="100%" stop-color="#ff007f" />
        </linearGradient>
        <linearGradient id="g-clay" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffccd5" />
          <stop offset="100%" stop-color="#b800ff" />
        </linearGradient>
        <linearGradient id="g-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffe5b4" />
          <stop offset="100%" stop-color="#ff8f00" />
        </linearGradient>
        <linearGradient id="g-nature" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#8ae9a8" />
          <stop offset="100%" stop-color="#0b333e" />
        </linearGradient>
        <linearGradient id="g-sky" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#7cd1f9" />
          <stop offset="100%" stop-color="#0c4b82" />
        </linearGradient>
        <linearGradient id="g-retro" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff0055" />
          <stop offset="100%" stop-color="#ffd000" />
        </linearGradient>
        <filter id="shadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="1" dy="2" stdDeviation="1.5" flood-opacity="0.15"/>
        </filter>
        <filter id="heavy-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.25"/>
        </filter>
      </defs>
    `;

    switch(medId) {
      // 1. 3D & 테크니컬 (tech3d)
      case 'med-3d':
        svgContent = `<circle cx="50" cy="28" r="15" fill="url(#g-tech)" filter="url(#shadow)"/><ellipse cx="50" cy="48" rx="18" ry="3.5" fill="rgba(0,0,0,0.15)"/>`;
        break;
      case 'med-clay':
        svgContent = `<rect x="35" y="14" width="30" height="30" rx="9" fill="url(#g-clay)" filter="url(#shadow)"/><circle cx="43" cy="24" r="2.5" fill="#333"/><circle cx="57" cy="24" r="2.5" fill="#333"/><path d="M 46 32 Q 50 36 54 32" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
        break;
      case 'med-lowpoly':
        svgContent = `<path d="M50 10 L25 28 L50 50 Z" fill="#4361ee"/><path d="M50 10 L75 28 L50 50 Z" fill="#3f37c9"/><path d="M25 28 L50 50 L25 45 Z" fill="#4895ef"/><path d="M75 28 L50 50 L75 45 Z" fill="#7209b7"/>`;
        break;
      case 'med-isometric':
        svgContent = `<path d="M50 14 L78 28 L50 42 L22 28 Z" fill="#e2e8f0" stroke="#cbd5e1"/><path d="M50 22 L68 31 L50 40 L32 31 Z" fill="url(#g-tech)" filter="url(#shadow)"/><path d="M32 31 L32 46 L50 55 L50 40 Z" fill="#00c8ff"/><path d="M68 31 L68 46 L50 55 L50 40 Z" fill="#ff00cc"/>`;
        break;
      case 'med-spline':
        svgContent = `<path d="M20 42 Q 35 12, 50 42 T 80 18" fill="none" stroke="url(#g-tech)" stroke-width="5" stroke-linecap="round" filter="url(#shadow)"/>`;
        break;
      case 'med-hologram':
        svgContent = `<circle cx="50" cy="30" r="16" fill="url(#g-tech)" opacity="0.85" filter="url(#shadow)"/><circle cx="50" cy="30" r="12" fill="none" stroke="#fff" stroke-width="1" opacity="0.5"/><path d="M36 30 L64 30" stroke="#fff" stroke-width="0.5" opacity="0.5"/><path d="M50 16 L50 44" stroke="#fff" stroke-width="0.5" opacity="0.5"/>`;
        break;
      case 'med-glassmorphism':
        svgContent = `<circle cx="38" cy="24" r="13" fill="#ff007f" opacity="0.7"/><circle cx="62" cy="36" r="13" fill="#00f0ff" opacity="0.7"/><rect x="32" y="18" width="36" height="26" rx="7" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" style="backdrop-filter: blur(3px);" filter="url(#heavy-shadow)"/>`;
        break;
      case 'med-fluid-abstract':
        svgContent = `<path d="M32 34 Q 26 14, 50 18 T 72 34 Q 58 48, 44 40 Z" fill="url(#g-clay)" filter="url(#shadow)"/><circle cx="63" cy="20" r="4.5" fill="#ffccd5"/><circle cx="34" cy="40" r="3" fill="#00f0ff"/>`;
        break;

      // 2. 아날로그 & 회화 (analog)
      case 'med-watercolor':
        svgContent = `<circle cx="42" cy="26" r="13" fill="#ffccd5" opacity="0.6"/><circle cx="58" cy="34" r="14" fill="#baffc9" opacity="0.6"/><circle cx="46" cy="38" r="11" fill="#bae1ff" opacity="0.6"/>`;
        break;
      case 'med-oil':
        svgContent = `<path d="M18 18 L82 18" stroke="#7b2a1e" stroke-width="7" stroke-linecap="round"/><path d="M22 30 L78 30" stroke="#a74a1b" stroke-width="9" stroke-linecap="round"/><path d="M26 42 L74 42" stroke="#e5ba73" stroke-width="8" stroke-linecap="round"/>`;
        break;
      case 'med-pencil':
        svgContent = `<rect x="25" y="16" width="50" height="28" rx="4" fill="none" stroke="#555" stroke-width="1.5"/><path d="M30 38 L58 10 M34 40 L62 12 M38 42 L66 14 M42 44 L70 16" stroke="#666" stroke-width="1"/>`;
        break;
      case 'med-pastel':
        svgContent = `<circle cx="39" cy="30" r="13" fill="#ffccd5" filter="url(#shadow)" opacity="0.95"/><circle cx="61" cy="30" r="13" fill="#e8cbf5" filter="url(#shadow)" opacity="0.95"/>`;
        break;
      case 'med-gouache':
        svgContent = `<rect x="22" y="16" width="56" height="28" rx="3" fill="#8c9a78"/><path d="M22 16 L50 44 L78 16 Z" fill="#3c2a21"/><circle cx="50" cy="25" r="7" fill="#e6ded5"/>`;
        break;
      case 'med-ink-wash':
        svgContent = `<path d="M18 42 C 32 8, 42 38, 56 12 C 68 42, 78 18, 82 42 Z" fill="#333" opacity="0.8" filter="url(#shadow)"/>`;
        break;
      case 'med-charcoal':
        svgContent = `<rect x="22" y="16" width="56" height="28" fill="#2c3e50" opacity="0.9"/><circle cx="50" cy="30" r="11" fill="#000" opacity="0.8" filter="url(#shadow)"/>`;
        break;
      case 'med-collage':
        svgContent = `<rect x="22" y="16" width="26" height="28" fill="#f4c493" transform="rotate(-6 30 30)"/><rect x="44" y="14" width="34" height="30" fill="#a2dbfa" transform="rotate(4 60 30)"/><line x1="41" y1="12" x2="47" y2="48" stroke="#fff" stroke-dasharray="3" stroke-width="2"/>`;
        break;

      // 3. 그래픽 & 디자인 (graphic)
      case 'med-flat':
        svgContent = `<circle cx="36" cy="30" r="12" fill="#ff0055"/><rect x="52" y="18" width="18" height="18" fill="#ffd000"/>`;
        break;
      case 'med-lineart':
        svgContent = `<path d="M22 30 C 35 12, 40 48, 55 30 C 64 16, 68 44, 78 30" fill="none" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>`;
        break;
      case 'med-retro':
        svgContent = `<circle cx="36" cy="30" r="13" fill="url(#g-retro)" stroke="#000" stroke-width="2"/><circle cx="58" cy="26" r="3.5" fill="#000"/><circle cx="68" cy="26" r="3.5" fill="#000"/><circle cx="58" cy="36" r="3.5" fill="#000"/><circle cx="68" cy="36" r="3.5" fill="#000"/>`;
        break;
      case 'med-bauhaus':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#f5f5f5" stroke="#333" stroke-width="1.5"/><circle cx="36" cy="30" r="9" fill="#ff0000"/><path d="M52 36 L68 36 L60 20 Z" fill="#0000ff"/>`;
        break;
      case 'med-minimalist':
        svgContent = `<rect x="48" y="28" width="4" height="4" fill="#ff0055"/>`;
        break;
      case 'med-brutalist':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#ffd000" stroke="#000" stroke-width="2.5"/><text x="50" y="36" font-size="15" font-weight="900" fill="#000" text-anchor="middle" font-family="monospace">RAW</text>`;
        break;
      case 'med-duotone':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#0f0c1b"/><circle cx="50" cy="30" r="12" fill="#00f0ff" stroke="#ff007f" stroke-width="3"/>`;
        break;
      case 'med-gradient-art':
        svgContent = `<rect x="18" y="14" width="64" height="32" rx="5" fill="url(#g-tech)" filter="url(#shadow)"/>`;
        break;

      // 4. 만화 & 애니메이션 (anime)
      case 'med-webtoon':
        svgContent = `<circle cx="50" cy="26" r="11" fill="#fff" stroke="#333" stroke-width="2"/><path d="M46 28 C 46 34, 54 34, 54 28" fill="none" stroke="#333" stroke-width="1.5"/><path d="M36 21 C 43 16, 57 16, 64 21" stroke="#333" stroke-width="2" fill="none"/>`;
        break;
      case 'med-ghibli':
        svgContent = `<rect x="18" y="14" width="64" height="32" rx="5" fill="url(#g-sky)"/><circle cx="39" cy="31" r="7" fill="#fff"/><circle cx="49" cy="31" r="9" fill="#fff"/><circle cx="59" cy="31" r="6" fill="#fff"/>`;
        break;
      case 'med-cyberpunk':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#0d1117"/><line x1="22" y1="28" x2="78" y2="28" stroke="#ff007f" stroke-width="2" filter="url(#shadow)"/><line x1="22" y1="20" x2="78" y2="20" stroke="#00f0ff" stroke-width="2" filter="url(#shadow)"/>`;
        break;
      case 'med-chibi':
        svgContent = `<circle cx="50" cy="30" r="13" fill="#fff" stroke="#ccc" stroke-width="1" filter="url(#shadow)"/><circle cx="50" cy="30" r="11" fill="url(#g-clay)"/><circle cx="47" cy="28" r="1.5" fill="#fff"/><circle cx="53" cy="28" r="1.5" fill="#fff"/>`;
        break;
      case 'med-disney':
        svgContent = `<circle cx="50" cy="30" r="13" fill="url(#g-clay)" filter="url(#shadow)"/><circle cx="45" cy="26" r="2.5" fill="#fff"/><circle cx="55" cy="26" r="2.5" fill="#fff"/><circle cx="45" cy="26" r="1.2" fill="#000"/><circle cx="55" cy="26" r="1.2" fill="#000"/>`;
        break;
      case 'med-line-sticker':
        svgContent = `<rect x="25" y="15" width="50" height="30" rx="8" fill="#fff" stroke="#000" stroke-width="2.5" filter="url(#shadow)"/><circle cx="42" cy="25" r="2" fill="#000"/><circle cx="58" cy="25" r="2" fill="#000"/><path d="M 46 31 Q 50 34 54 31" stroke="#000" stroke-width="1.8" fill="none"/>`;
        break;
      case 'med-vector-cartoon':
        svgContent = `<path d="M25 15 L75 15 L60 45 L40 45 Z" fill="none" stroke="#2563eb" stroke-width="2.5"/><circle cx="50" cy="30" r="7" fill="#ff4500"/>`;
        break;
      case 'med-graphic-novel':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#fff" stroke="#000" stroke-width="2"/><path d="M18 14 L50 46 L82 14 Z" fill="#000"/><circle cx="50" cy="25" r="5" fill="#ff0055"/>`;
        break;

      // 5. 사진 & 실사 (photo)
      case 'med-cinematic':
        svgContent = `<rect x="18" y="16" width="64" height="28" rx="2" fill="#0c4b82"/><ellipse cx="50" cy="30" rx="13" ry="9" fill="none" stroke="#ff8f00" stroke-width="1.5"/><line x1="12" y1="30" x2="88" y2="30" stroke="#00f0ff" stroke-width="1" opacity="0.8" filter="url(#shadow)"/>`;
        break;
      case 'med-macro':
        svgContent = `<circle cx="50" cy="30" r="15" fill="url(#g-nature)" filter="url(#shadow)"/><circle cx="45" cy="25" r="3" fill="#fff" opacity="0.85"/><circle cx="55" cy="34" r="1.5" fill="#fff" opacity="0.65"/>`;
        break;
      case 'med-vintage-photo':
        svgContent = `<rect x="22" y="16" width="56" height="28" fill="#ffe5b4" stroke="#857467" stroke-width="1.5"/><circle cx="50" cy="30" r="9" fill="#857467" opacity="0.5"/>`;
        break;
      case 'med-drone':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#8ae9a8"/><line x1="32" y1="14" x2="32" y2="46" stroke="#fff" stroke-width="1.8"/><line x1="56" y1="14" x2="56" y2="46" stroke="#fff" stroke-width="1.8"/><rect x="32" y="24" width="24" height="10" fill="#ffd07b"/>`;
        break;
      case 'med-blackwhite':
        svgContent = `<rect x="18" y="14" width="32" height="32" fill="#000"/><rect x="50" y="14" width="32" height="32" fill="#fff"/><circle cx="50" cy="30" r="11" fill="#7f7f7f" filter="url(#shadow)"/>`;
        break;
      case 'med-cyber-neon-photo':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#05161c"/><circle cx="36" cy="24" r="5" fill="#ff007f" filter="url(#shadow)"/><circle cx="64" cy="32" r="5.5" fill="#00ff87" filter="url(#shadow)"/><circle cx="50" cy="28" r="3.5" fill="#00ffff" filter="url(#shadow)"/>`;
        break;
      case 'med-studio-portrait':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#3a3a3a"/><path d="M50 18 C 45 18, 41 22, 41 27 C 41 32, 45 36, 50 36 C 55 36, 59 32, 59 27 Z" fill="#fff" opacity="0.85" filter="url(#shadow)"/>`;
        break;
      case 'med-infrared':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#3d0016"/><circle cx="50" cy="30" r="13" fill="#fff" filter="url(#shadow)"/>`;
        break;

      // 6. 핸드메이드 & 실물 공예 (craft)
      case 'med-craft-clay':
        svgContent = `<circle cx="50" cy="30" r="14" fill="url(#g-clay)" filter="url(#shadow)"/><path d="M43 30 Q 50 25 57 30" stroke="rgba(0,0,0,0.2)" stroke-width="1.5" fill="none"/>`;
        break;
      case 'med-origami':
        svgContent = `<path d="M50 14 L73 30 L50 46 L27 30 Z" fill="#ff80a4"/><path d="M50 14 L50 46 L27 30 Z" fill="#ffccd5"/><path d="M50 14 L73 30 L50 30 Z" fill="#ff0055"/>`;
        break;
      case 'med-felt':
        svgContent = `<rect x="24" y="16" width="52" height="28" rx="7" fill="#ffd07b" filter="url(#shadow)"/><rect x="28" y="20" width="44" height="20" rx="4" fill="none" stroke="#ff0055" stroke-width="1.2" stroke-dasharray="2.5"/>`;
        break;
      case 'med-paper-cut':
        svgContent = `<rect x="22" y="16" width="56" height="28" rx="4" fill="#1b1736"/><rect x="27" y="20" width="46" height="20" rx="4" fill="#2f2663" filter="url(#shadow)"/><circle cx="50" cy="30" r="7" fill="#00f0ff" filter="url(#shadow)"/>`;
        break;
      case 'med-embroidery':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#8c5e62"/><path d="M28 30 Q 50 16, 72 30" fill="none" stroke="#fff" stroke-dasharray="2" stroke-width="2.5"/>`;
        break;
      case 'med-woodcarving':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#8d7b68"/><circle cx="50" cy="30" r="13" fill="none" stroke="#2f2519" stroke-width="1.8" stroke-dasharray="25 8 8 15"/><path d="M32 22 L42 38" stroke="#2f2519" stroke-width="2.5"/>`;
        break;
      case 'med-glass-stained':
        svgContent = `<rect x="22" y="14" width="56" height="32" fill="none" stroke="#222" stroke-width="2"/><path d="M22 14 L50 46 L78 14 Z" fill="url(#g-tech)" opacity="0.55"/><line x1="50" y1="14" x2="50" y2="46" stroke="#222" stroke-width="2"/><line x1="22" y1="30" x2="78" y2="30" stroke="#222" stroke-width="2"/>`;
        break;
      case 'med-miniature':
        svgContent = `<rect x="18" y="14" width="64" height="32" fill="#a2dbfa"/><circle cx="36" cy="34" r="5" fill="#8ae9a8"/><rect x="54" y="24" width="10" height="18" fill="#ffd000"/>`;
        break;

      default:
        svgContent = `<circle cx="50" cy="30" r="10" fill="url(#g-tech)"/>`;
        break;
    }

    return `<svg viewBox="0 0 100 60" style="width: 100%; height: 100%; display: block;" xmlns="http://www.w3.org/2000/svg">${defs}${svgContent}</svg>`;
  }

  // 단계 내 현재 선택값 업데이트 함수
  function updateMixerSummaryBar() {
    const container = document.getElementById('conceptMixerContainer');
    if (!container) return;

    const categoryList = MIXER_SUBJECTS[activeCategory] || [];
    const subject = categoryList.find(s => s.id === selectedSubjId);
    const medium = MIXER_MEDIUMS.find(m => m.id === selectedMediumId);
    const palette = MIXER_PALETTES[selectedPaletteIdx];

    const subjText = subject ? `${subject.emoji} ${subject.nameKo}` : '선택 대기중';
    const medText = medium ? `${medium.emoji} ${medium.nameKo}` : '선택 대기중';
    const palText = palette ? `🎨 ${palette.name}` : '선택 대기중';
    const values = [
      { step: 1, text: subjText, hasValue: Boolean(subject) },
      { step: 2, text: medText, hasValue: Boolean(medium) },
      { step: 3, text: palText, hasValue: Boolean(palette) }
    ];

    values.forEach(({ step, text, hasValue }) => {
      const valueEl = container.querySelector(`.mixer-step-tab[data-step="${step}"] .mixer-step-current`);
      const tab = container.querySelector(`.mixer-step-tab[data-step="${step}"]`);
      if (!valueEl || !tab) return;
      valueEl.textContent = text;
      valueEl.classList.toggle('empty', !hasValue);
      tab.title = text;
    });
  }

  // 믹서 탭 초기 로드 (Wizard 구조)
  function initConceptMixer() {
    const container = document.getElementById('conceptMixerContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="mixer-toolbar">
        <div class="mixer-toolbar-actions">
          <button type="button" class="mixer-utility-btn primary mixer-hidden-proxy" id="btnMixerRandom">랜덤 조합</button>
          <button type="button" class="mixer-utility-btn mixer-hidden-proxy" id="btnMixerReset">초기화</button>
          <button type="button" class="mixer-utility-btn primary" id="btnScrollToPreview">결과 보기 ↓</button>
          <details class="mixer-settings">
            <summary id="btnMixerSettings" class="mixer-hidden-proxy">샘플 설정</summary>
            <div class="mixer-settings-panel">
              <label class="mixer-settings-label" for="mixerUnsplashKeyInput">Unsplash Access Key</label>
              <div class="mixer-settings-row">
                <input id="mixerUnsplashKeyInput" class="mixer-settings-input" type="password"
                  placeholder="화풍 샘플 자동 검색용" value="${getUnsplashKey()}" />
                <button id="mixerUnsplashKeySaveBtn" class="mixer-utility-btn primary" type="button">저장</button>
              </div>
              <span id="mixerUnsplashKeyStatus" style="display:block; margin-top:7px; font-size:10px; color:var(--text-secondary,#64748b);"></span>
            </div>
          </details>
        </div>
      </div>
      <div class="mixer-workspace">
        <div class="mixer-left">
          
          <!-- 위저드 스텝퍼 -->
          <div class="mixer-stepper">
            <button type="button" class="mixer-step-tab active" data-step="1">
              <span class="step-num">1</span>
              <span class="mixer-step-copy">
                <span class="mixer-step-label">주제 선택</span>
                <strong class="mixer-step-current">선택 대기중</strong>
              </span>
            </button>
            <button type="button" class="mixer-step-tab" data-step="2">
              <span class="step-num">2</span>
              <span class="mixer-step-copy">
                <span class="mixer-step-label">화풍/기법 선택</span>
                <strong class="mixer-step-current">선택 대기중</strong>
              </span>
            </button>
            <button type="button" class="mixer-step-tab" data-step="3">
              <span class="step-num">3</span>
              <span class="mixer-step-copy">
                <span class="mixer-step-label">색상 테마 선택</span>
                <strong class="mixer-step-current">선택 대기중</strong>
              </span>
            </button>
          </div>

          <!-- Step 1. 비주얼 주제 (Subject) Pane -->
          <div class="mixer-step-pane active" id="paneStep1">
            <div class="mixer-section-title">비주얼 주제(Subject) 선택 <span>도메인 필터</span></div>
            <div class="mixer-cat-tabs" role="tablist" aria-label="비주얼 주제 카테고리">
              <button type="button" class="mixer-cat-btn" data-mix-cat="steel" role="tab">🏭 철강 & 중공업</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="energy" role="tab">⚡ 미래 에너지</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="software" role="tab">💻 소프트웨어 & IT</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="bio" role="tab">🧬 바이오 & 라이프</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="finance" role="tab">📈 금융 & 자산</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="public" role="tab">🏛️ 공공 & 인프라</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="brand" role="tab">🏷️ 브랜드 & 홍보</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="space" role="tab">🚀 우주항공 & 미래</button>
            </div>
            <div class="mixer-subj-grid" id="mixerSubjGrid"></div>
            <div class="mixer-search-empty" id="mixerSubjectEmpty">검색 결과가 없습니다.</div>
          </div>

          <!-- Step 2. 표현 화풍 (Medium) Pane -->
          <div class="mixer-step-pane" id="paneStep2">
            <div class="mixer-section-title">표현 화풍 및 리터칭 기법(Art Medium) 선택</div>
            <div class="mixer-cat-tabs" id="mixerMediumCategoryTabs" role="tablist" aria-label="화풍 카테고리">
              ${MEDIUM_CATEGORIES.map(cat => `
                <button type="button" class="mixer-cat-btn${cat.id === activeMediumCategory ? ' active' : ''}"
                  data-med-cat="${cat.id}" role="tab" aria-selected="${cat.id === activeMediumCategory}">${cat.label}</button>
              `).join('')}
            </div>
            <div id="mixerMedCategoriesWrap" style="max-height: 380px; overflow-y: auto; padding-right: 4px;"></div>
            <div class="mixer-search-empty" id="mixerMediumEmpty">검색 결과가 없습니다.</div>
          </div>

          <!-- Step 3. 색상 테마 (Palette) Pane -->
          <div class="mixer-step-pane" id="paneStep3">
            <div class="mixer-section-title">감성 색상 테마(Color Palette) 선택</div>
            <div class="mixer-cat-tabs" id="mixerPaletteCategoryTabs" role="tablist" aria-label="색상 테마 카테고리">
              ${PALETTE_CATEGORIES.map(cat => `
                <button type="button" class="mixer-cat-btn${cat.id === activePaletteCategory ? ' active' : ''}"
                  data-palette-cat="${cat.id}" role="tab" aria-selected="${cat.id === activePaletteCategory}">${cat.label}</button>
              `).join('')}
            </div>

            <!-- 라이트/다크 모드 톤 필터 바 -->
            <div class="mixer-pal-filter-tabs">
              <button type="button" class="mixer-pal-filter-btn active" data-pal-filter="all">🌈 전체</button>
              <button type="button" class="mixer-pal-filter-btn" data-pal-filter="dark">🌙 다크 지향</button>
              <button type="button" class="mixer-pal-filter-btn" data-pal-filter="light">☀️ 라이트 지향</button>
            </div>
            
            <div class="mixer-palettes-group-grid" id="mixerPalettesGroupGrid"></div>
            <div class="mixer-search-empty" id="mixerPaletteEmpty">선택한 조건에 맞는 색상 테마가 없습니다.</div>
          </div>

        </div>

        <!-- 우측 결과 프리뷰 -->
        <div class="mixer-right">
          <div class="mixer-preview-card" id="mixerPreviewCard"></div>
        </div>
      </div>
    `;

    // 카테고리 전환 바인딩
    container.querySelectorAll('[data-mix-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.mixCat;
        activeCategory = cat;
        // 주제 첫 항목 설정
        const firstSubj = MIXER_SUBJECTS[cat][0];
        selectedSubjId = firstSubj ? firstSubj.id : '';
        
        updateCategoryTabs();
        renderSubjects();
        updateMixerSummaryBar();
        renderPreviewCard();
      });
    });

    // 스텝퍼 탭 직접 클릭 이벤트 바인딩
    container.querySelectorAll('.mixer-step-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const step = parseInt(tab.dataset.step, 10);
        switchStep(step);
      });
    });

    container.querySelectorAll('[data-med-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeMediumCategory = btn.dataset.medCat;
        selectedMediumId = MIXER_MEDIUMS.find(medium => medium.category === activeMediumCategory)?.id || selectedMediumId;
        container.querySelectorAll('[data-med-cat]').forEach(tab => {
          const isActive = tab === btn;
          tab.classList.toggle('active', isActive);
          tab.setAttribute('aria-selected', String(isActive));
        });
        renderMediums();
        updateMixerSummaryBar();
        renderPreviewCard();
      });
    });

    container.querySelectorAll('[data-palette-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        activePaletteCategory = btn.dataset.paletteCat;
        const firstPalette = MIXER_PALETTES.find(palette =>
          palette.category === activePaletteCategory &&
          (activePaletteFilter === 'all' || palette.mode === activePaletteFilter)
        );
        if (firstPalette) selectedPaletteIdx = MIXER_PALETTES.indexOf(firstPalette);
        container.querySelectorAll('[data-palette-cat]').forEach(tab => {
          const isActive = tab === btn;
          tab.classList.toggle('active', isActive);
          tab.setAttribute('aria-selected', String(isActive));
        });
        renderPalettes();
        updateMixerSummaryBar();
        renderPreviewCard();
      });
    });

    // 팔레트 톤 필터 버튼 바인딩
    container.querySelectorAll('.mixer-pal-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.mixer-pal-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activePaletteFilter = btn.dataset.palFilter;
        const currentPalette = MIXER_PALETTES[selectedPaletteIdx];
        if (!currentPalette || currentPalette.category !== activePaletteCategory ||
            (activePaletteFilter !== 'all' && currentPalette.mode !== activePaletteFilter)) {
          const firstPalette = MIXER_PALETTES.find(palette =>
            palette.category === activePaletteCategory &&
            (activePaletteFilter === 'all' || palette.mode === activePaletteFilter)
          );
          if (firstPalette) selectedPaletteIdx = MIXER_PALETTES.indexOf(firstPalette);
        }
        renderPalettes();
        updateMixerSummaryBar();
        renderPreviewCard();
      });
    });


    // 모바일 전용 결과 바로가기 앵커 스크롤 바인딩
    const scrollBtn = container.querySelector('#btnScrollToPreview');
    if (scrollBtn) {
      // 화면 폭에 따라 보이기 제어
      if (window.innerWidth <= 900) {
        scrollBtn.style.display = 'inline-flex';
      }
      window.addEventListener('resize', () => {
        if (window.innerWidth <= 900) {
          scrollBtn.style.display = 'inline-flex';
        } else {
          scrollBtn.style.display = 'none';
        }
      });

      scrollBtn.addEventListener('click', () => {
        const previewEl = document.getElementById('mixerPreviewCard');
        if (previewEl) {
          previewEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }

    // Unsplash 키 저장 버튼
    const keyInput = container.querySelector('#mixerUnsplashKeyInput');
    const keySaveBtn = container.querySelector('#mixerUnsplashKeySaveBtn');
    const keyStatus = container.querySelector('#mixerUnsplashKeyStatus');
    if (keySaveBtn && keyInput) {
      keySaveBtn.addEventListener('click', () => {
        setUnsplashKey(keyInput.value);
        Object.keys(UNSPLASH_CACHE).forEach(k => delete UNSPLASH_CACHE[k]); // 캐시 초기화
        if (keyStatus) { keyStatus.textContent = '✓ 저장됨'; setTimeout(() => { keyStatus.textContent = ''; }, 2000); }
      });
    }


    container.querySelector('#btnMixerRandom').addEventListener('click', () => {
      const categoryKeys = Object.keys(MIXER_SUBJECTS);
      activeCategory = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
      const subjects = MIXER_SUBJECTS[activeCategory] || [];
      selectedSubjId = subjects[Math.floor(Math.random() * subjects.length)]?.id || '';
      selectedMediumId = MIXER_MEDIUMS[Math.floor(Math.random() * MIXER_MEDIUMS.length)]?.id || '';
      selectedPaletteIdx = Math.floor(Math.random() * MIXER_PALETTES.length);
      activeMediumCategory = MIXER_MEDIUMS.find(medium => medium.id === selectedMediumId)?.category || 'tech3d';
      activePaletteCategory = MIXER_PALETTES[selectedPaletteIdx]?.category || 'tech';
      activePaletteFilter = 'all';

      container.querySelectorAll('[data-med-cat]').forEach(tab => {
        const isActive = tab.dataset.medCat === activeMediumCategory;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
      });
      container.querySelectorAll('[data-palette-cat]').forEach(tab => {
        const isActive = tab.dataset.paletteCat === activePaletteCategory;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
      });
      container.querySelectorAll('.mixer-pal-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.palFilter === 'all');
      });
      updateCategoryTabs();
      renderSubjects();
      renderMediums();
      renderPalettes();
      updateMixerSummaryBar();
      renderPreviewCard();
    });

    container.querySelector('#btnMixerReset').addEventListener('click', () => {
      activeCategory = 'steel';
      selectedSubjId = 'mix-steel-hot-rolling';
      selectedMediumId = 'med-3d';
      selectedPaletteIdx = 16;
      activeMediumCategory = 'tech3d';
      activePaletteCategory = MIXER_PALETTES[selectedPaletteIdx]?.category || 'tech';
      activePaletteFilter = 'all';
      container.querySelectorAll('.mixer-pal-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.palFilter === 'all');
      });
      container.querySelectorAll('[data-med-cat]').forEach(tab => {
        const isActive = tab.dataset.medCat === activeMediumCategory;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
      });
      container.querySelectorAll('[data-palette-cat]').forEach(tab => {
        const isActive = tab.dataset.paletteCat === activePaletteCategory;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
      });
      updateCategoryTabs();
      renderSubjects();
      renderMediums();
      renderPalettes();
      updateMixerSummaryBar();
      renderPreviewCard();
      switchStep(1);
    });

    updateCategoryTabs();
    renderSubjects();
    renderMediums();
    renderPalettes();
    updateMixerSummaryBar();
    renderPreviewCard();
    switchStep(1); // 1단계부터 시작
  }

  // 단계(Step) 전환 함수
  function switchStep(step) {
    activeStep = step;
    const container = document.getElementById('conceptMixerContainer');
    if (!container) return;

    // 스텝퍼 탭 상태 업데이트
    container.querySelectorAll('.mixer-step-tab').forEach(tab => {
      const tabStep = parseInt(tab.dataset.step, 10);
      tab.classList.toggle('active', tabStep === step);
      tab.classList.toggle('completed', tabStep < step);

      // 완료된 단계는 숫자를 ✓로 변경
      const numSpan = tab.querySelector('.step-num');
      if (numSpan) {
        if (tabStep < step) {
          numSpan.textContent = '✓';
        } else {
          numSpan.textContent = tabStep;
        }
      }
    });

    // 스텝 Pane 표시 제어
    container.querySelectorAll('.mixer-step-pane').forEach(pane => {
      const paneId = pane.id;
      pane.classList.toggle('active', paneId === `paneStep${step}`);
    });


    updateMixerSummaryBar();
  }

  function updateCategoryTabs() {
    const container = document.getElementById('conceptMixerContainer');
    if (!container) return;
    container.querySelectorAll('[data-mix-cat]').forEach(btn => {
      const isActive = btn.dataset.mixCat === activeCategory;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });
  }

  // 주제 렌더링
  function renderSubjects() {
    const grid = document.getElementById('mixerSubjGrid');
    if (!grid) return;

    grid.innerHTML = '';
    const list = MIXER_SUBJECTS[activeCategory] || [];
    list.forEach(subj => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'mixer-item-card' + (selectedSubjId === subj.id ? ' active' : '');
      card.setAttribute('aria-pressed', String(selectedSubjId === subj.id));
      card.innerHTML = `
        <div class="mixer-item-head">${subj.emoji} ${subj.nameKo}</div>
        <div class="mixer-item-desc">${subj.desc}</div>
      `;
      card.addEventListener('click', () => {
        selectedSubjId = subj.id;
        grid.querySelectorAll('.mixer-item-card').forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-pressed', 'false');
        });
        card.classList.add('active');
        card.setAttribute('aria-pressed', 'true');
        updateMixerSummaryBar();
        renderPreviewCard();
      });
      grid.appendChild(card);
    });
  }

  // 분류형 화풍(Medium) 렌더링
  function renderMediums() {
    const wrap = document.getElementById('mixerMedCategoriesWrap');
    if (!wrap) return;

    wrap.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'mixer-med-grid';
    
    const filtered = MIXER_MEDIUMS.filter(m => m.category === activeMediumCategory);
    filtered.forEach(med => {
        const card = document.createElement('div');
        card.setAttribute('role', 'button');
        card.tabIndex = 0;
        card.className = 'mixer-item-card' + (selectedMediumId === med.id ? ' active' : '');
        card.setAttribute('aria-pressed', String(selectedMediumId === med.id));
        
        card.innerHTML = `
          <div class="mixer-item-head">${med.emoji} ${med.nameKo}</div>
          <div class="mixer-item-desc">${med.desc}</div>
        `;

        card.addEventListener('click', () => {
          selectedMediumId = med.id;
          wrap.querySelectorAll('.mixer-item-card').forEach(c => {
            c.classList.remove('active');
            c.setAttribute('aria-pressed', 'false');
          });
          card.classList.add('active');
          card.setAttribute('aria-pressed', 'true');
          updateMixerSummaryBar();
          renderPreviewCard();
        });
        card.addEventListener('keydown', (event) => {
          if ((event.key === 'Enter' || event.key === ' ') && event.target === card) {
            event.preventDefault();
            card.click();
          }
        });

      grid.appendChild(card);
    });
    wrap.appendChild(grid);
  }

  // 분류형 색상 테마(Palette) 렌더링
  function renderPalettes() {
    const groupGrid = document.getElementById('mixerPalettesGroupGrid');
    if (!groupGrid) return;

    groupGrid.innerHTML = '';
    const filtered = MIXER_PALETTES.filter(p => p.category === activePaletteCategory && (activePaletteFilter === 'all' || p.mode === activePaletteFilter));
    const empty = document.getElementById('mixerPaletteEmpty');
    if (empty) empty.style.display = filtered.length ? 'none' : 'block';

    filtered.forEach(pal => {
        const palIdx = MIXER_PALETTES.indexOf(pal);
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'mixer-item-card' + (selectedPaletteIdx === palIdx ? ' active' : '');
        item.setAttribute('aria-pressed', String(selectedPaletteIdx === palIdx));
        
        const weights = pal.colors.length >= 3 ? [55, 30, 15] : (pal.colors.length === 2 ? [65, 35] : [100]);
        const weightBarStr = `
          <div class="mixer-palette-weight-bar">
            ${pal.colors.map((c, idx) => `
              <div class="mixer-palette-weight-segment" style="background:${c}; width:${weights[idx] || 10}%;"></div>
            `).join('')}
          </div>
          <div class="mixer-palette-weight-labels">
            <span>메인 (${weights[0]}%)</span>
            ${weights[1] ? `<span>보조 (${weights[1]}%)</span>` : ''}
            ${weights[2] ? `<span>강조 (${weights[2]}%)</span>` : ''}
          </div>
        `;
        const badgeText = pal.mode === 'dark' ? '🌙 다크' : '☀️ 라이트';
        const badgeClass = pal.mode;

        item.innerHTML = `
          <div class="mixer-palette-badge ${badgeClass}">${badgeText}</div>
          <div class="mixer-item-head">🎨 ${pal.name}</div>
          ${weightBarStr}
          <div class="mixer-item-desc" style="margin-top: 4.5px;">${pal.colorMapping}</div>
        `;

        item.addEventListener('click', () => {
          selectedPaletteIdx = palIdx;
          groupGrid.querySelectorAll('.mixer-item-card').forEach(p => {
            p.classList.remove('active');
            p.setAttribute('aria-pressed', 'false');
          });
          item.classList.add('active');
          item.setAttribute('aria-pressed', 'true');
          updateMixerSummaryBar();
          renderPreviewCard();
        });
      groupGrid.appendChild(item);
    });
  }

  // 우측 프리뷰 카드 렌더링 (동적 하이라이트 반영 및 실시간 이미지 생성 연동)
  // 우측 프리뷰 카드 렌더링 (동적 하이라이트 반영 및 실시간 이미지 생성 연동)
  // 우측 프리뷰 카드 렌더링 (동적 하이라이트 반영 및 실시간 이미지 생성 연동)
  function renderPreviewCard() {
    const cardWrap = document.getElementById('mixerPreviewCard');
    if (!cardWrap) return;

    const categoryList = MIXER_SUBJECTS[activeCategory] || [];
    const subject = categoryList.find(s => s.id === selectedSubjId) || categoryList[0];
    const medium = MIXER_MEDIUMS.find(m => m.id === selectedMediumId) || MIXER_MEDIUMS[0];
    const palette = MIXER_PALETTES[selectedPaletteIdx];

    if (!subject || !medium || !palette) return;

    const highlightHTML = buildMixedHighlightPromptHTML();
    const plainPrompt = buildMixedPrompt();
    const sampleIds = MIXER_MEDIUM_SAMPLES[medium.id] || ['photo-1618005182384-a83a8bd57fbe'];
    const customSamples = getCustomSamplesForMed(medium.id);
    const previewImageUrl = customSamples[0] || UNSPLASH_CACHE[medium.id] || `https://images.unsplash.com/${sampleIds[0]}?w=900&auto=format&fit=crop&q=84`;
    const hasCustomSample = Boolean(customSamples[0]);
    
    // 3가지 이상의 풍성한 색상으로 쉬머 애니메이션용 그라데이션 선언
    const gradient = `linear-gradient(135deg, ${palette.colors[0]}, ${palette.colors[2] || palette.colors[1]}, ${palette.colors[palette.colors.length - 1]})`;

    cardWrap.innerHTML = `
      <div class="mixer-result-image" style="border-bottom:4px solid ${palette.colors[0]}">
        <img src="${previewImageUrl}" alt="${medium.nameKo} 화풍 참고 이미지" />
        <div class="mixer-result-image-badge">화풍 참고 이미지</div>
        <div class="mixer-result-image-overlay">
          <strong>${subject.nameKo}</strong>
          <span>${medium.nameKo} · ${palette.name}</span>
        </div>
      </div>
      <div class="mixer-preview-header" style="background:${gradient}">
        <div class="mixer-preview-title">${subject.nameKo} × ${medium.nameKo}</div>
        <div class="mixer-preview-sub">조합 코드: #MIX-${subject.id.replace('mix-','').toUpperCase()}-${medium.id.replace('med-','').toUpperCase()}</div>
      </div>
      <div class="mixer-preview-body">
        <div class="mixer-selection-list" aria-label="선택된 조합">
          <div class="mixer-selection-item"><span>주제</span><strong>${subject.nameKo}</strong></div>
          <div class="mixer-selection-item"><span>화풍</span><strong>${medium.nameKo}</strong></div>
          <div class="mixer-selection-item"><span>색상</span><strong>${palette.name}</strong></div>
        </div>
        <div class="mixer-preview-tools">
          <div class="mixer-preview-tools-title">
            화풍 샘플 관리
            <span>${medium.nameKo}</span>
          </div>
          <div class="mixer-preview-tool-actions">
            <button type="button" class="mixer-preview-tool-btn" id="btnMixerSampleRefresh">다른 사진</button>
            <button type="button" class="mixer-preview-tool-btn" id="btnMixerSampleReplace">사진 교체</button>
            <button type="button" class="mixer-preview-tool-btn" id="btnMixerSampleSave">현재 사진 저장</button>
            <button type="button" class="mixer-preview-tool-btn" id="btnMixerSampleReset"${hasCustomSample ? '' : ' disabled'}>원본 복원</button>
          </div>
          <div class="mixer-preview-keyword-row">
            <input type="text" id="mixerPreviewKeyword" value="${resolveSearchKeyword(medium.id, medium.suffix)}"
              aria-label="화풍 샘플 검색 키워드" placeholder="검색 키워드 (영문)" />
            <button type="button" class="mixer-preview-tool-btn" id="btnMixerKeywordApply">적용</button>
            <button type="button" class="mixer-preview-tool-btn" id="btnMixerKeywordReset"${getCustomKeyword(medium.id) ? '' : ' disabled'}>초기화</button>
          </div>
          <div class="mixer-preview-medium-prefix">${medium.prefix}</div>
          <div class="mixer-preview-tool-status" id="mixerPreviewToolStatus"></div>
          <input type="file" id="mixerPreviewFileInput" accept="image/*" hidden />
        </div>
        <details class="mixer-prompt-details">
          <summary>완성 프롬프트 보기</summary>
          <pre class="mixer-preview-prompt-box" id="mixerCombinedPromptText">${highlightHTML}</pre>
        </details>
        <div class="mixer-feedback" id="mixerFeedback">✓ 클립보드 복사 완료!</div>
        <div class="mixer-preview-actions">
          <button type="button" class="mixer-action-btn copy" id="btnMixerCopy">프롬프트 복사</button>
          <button type="button" class="mixer-action-btn apply" id="btnMixerApply">홍보 이미지에 적용</button>
        </div>
      </div>
    `;

    const previewImg = cardWrap.querySelector('.mixer-result-image img');
    const toolStatus = cardWrap.querySelector('#mixerPreviewToolStatus');
    const fileInput = cardWrap.querySelector('#mixerPreviewFileInput');
    const setToolStatus = (message, isError = false) => {
      if (!toolStatus) return;
      toolStatus.textContent = message;
      toolStatus.style.color = isError ? '#dc2626' : '';
    };

    cardWrap.querySelector('#btnMixerSampleReplace').addEventListener('click', () => {
      fileInput.click();
    });
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async event => {
        const dataUrl = event.target.result;
        setToolStatus('사진을 서버에 저장하는 중…');
        try {
          const response = await fetch('/api/save-mixer-sample', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              medId: medium.id,
              idx: 0,
              image: dataUrl
            })
          });
          const result = await response.json();
          if (result.ok && result.url) {
            setCustomSample(medium.id, 0, result.url);
            setToolStatus('사진을 이 화풍의 대표 샘플로 서버에 저장했습니다.');
          } else {
            throw new Error(result.error || '업로드 실패');
          }
        } catch (err) {
          console.error(err);
          setCustomSample(medium.id, 0, dataUrl);
          setToolStatus('서버 저장 실패: 로컬 브라우저에 임시 저장했습니다.', true);
        }
        renderPreviewCard();
      };
      reader.readAsDataURL(file);
    });

    cardWrap.querySelector('#btnMixerSampleRefresh').addEventListener('click', async event => {
      const button = event.currentTarget;
      if (!getUnsplashKey()) {
        setToolStatus('샘플 설정에서 Unsplash Access Key를 먼저 저장해 주세요.', true);
        return;
      }
      button.disabled = true;
      button.textContent = '불러오는 중…';
      setToolStatus('새 화풍 샘플을 검색하고 있습니다.');
      delete UNSPLASH_CACHE[medium.id];
      try {
        const url = await fetchUnsplashImage(medium.id, medium.suffix, true);
        if (!url) throw new Error('검색 결과 없음');
        if (previewImg) previewImg.src = url;
        setToolStatus('새 사진을 불러왔습니다. 마음에 들면 저장하세요.');
      } catch (error) {
        setToolStatus(error.message.includes('403') ? 'Unsplash 요청 한도를 확인해 주세요.' : '사진을 불러오지 못했습니다.', true);
      } finally {
        button.disabled = false;
        button.textContent = '다른 사진';
      }
    });

    cardWrap.querySelector('#btnMixerSampleSave').addEventListener('click', async event => {
      if (!previewImg?.src) return;
      const button = event.currentTarget;
      button.disabled = true;
      setToolStatus('현재 사진을 서버에 저장하는 중…');
      try {
        const response = await fetch('/api/save-mixer-sample', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            medId: medium.id,
            idx: 0,
            image: previewImg.src
          })
        });
        const result = await response.json();
        if (result.ok && result.url) {
          setCustomSample(medium.id, 0, result.url);
          setToolStatus('현재 사진을 이 화풍의 대표 샘플로 서버에 저장했습니다.');
          button.textContent = '저장됨';
        } else {
          throw new Error(result.error || '업로드 실패');
        }
      } catch (err) {
        console.error(err);
        setCustomSample(medium.id, 0, previewImg.src);
        setToolStatus('서버 저장 실패: 로컬 브라우저에 임시 저장했습니다.', true);
        button.textContent = '저장됨';
      } finally {
        button.disabled = false;
        setTimeout(() => renderPreviewCard(), 700);
      }
    });

    const sampleResetBtn = cardWrap.querySelector('#btnMixerSampleReset');
    sampleResetBtn.addEventListener('click', () => {
      clearCustomSample(medium.id, 0);
      delete UNSPLASH_CACHE[medium.id];
      renderPreviewCard();
    });

    const keywordInput = cardWrap.querySelector('#mixerPreviewKeyword');
    const keywordApplyBtn = cardWrap.querySelector('#btnMixerKeywordApply');
    keywordApplyBtn.addEventListener('click', async () => {
      const keyword = keywordInput.value.trim();
      if (!keyword) {
        setToolStatus('검색 키워드를 입력해 주세요.', true);
        return;
      }
      setCustomKeyword(medium.id, keyword);
      delete UNSPLASH_CACHE[medium.id];
      setToolStatus('키워드를 저장했습니다.');
      renderPreviewCard();
    });
    keywordInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') keywordApplyBtn.click();
    });

    cardWrap.querySelector('#btnMixerKeywordReset').addEventListener('click', () => {
      clearCustomKeyword(medium.id);
      delete UNSPLASH_CACHE[medium.id];
      renderPreviewCard();
    });

    // 복사 이벤트
    cardWrap.querySelector('#btnMixerCopy').addEventListener('click', () => {
      const text = plainPrompt;
      const feedback = cardWrap.querySelector('#mixerFeedback');
      navigator.clipboard.writeText(text).then(() => {
        feedback.classList.add('visible');
        setTimeout(() => feedback.classList.remove('visible'), 2000);
      }).catch(() => {
        const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        feedback.classList.add('visible');
        setTimeout(() => feedback.classList.remove('visible'), 2000);
      });
    });

    // ID 기반 영문 이름 생성 헬퍼
    function capitalizeId(id, prefixToRemove) {
      if (!id) return '';
      let clean = id;
      if (prefixToRemove && id.startsWith(prefixToRemove)) {
        clean = id.slice(prefixToRemove.length);
      }
      return clean.split('-')
        .map(word => {
          if (word.toLowerCase() === '3d') return '3D';
          if (word.toLowerCase() === 'ui') return 'UI';
          if (word.toLowerCase() === 'ai') return 'AI';
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
    }

    // 적용 이벤트
    cardWrap.querySelector('#btnMixerApply').addEventListener('click', () => {
      if (typeof window.applyPromotionConceptStyle === 'function') {
        let dummyStyle = {
          id: `mix-${subject.id}-${medium.id}`,
          category: activeCategory,
          nameKo: `${subject.nameKo} (${medium.nameKo})`,
          nameEn: `${capitalizeId(subject.id, 'mix-')} (${capitalizeId(medium.id, 'med-')})`,
          emoji: subject.emoji,
          desc: `${subject.nameKo}에 ${medium.nameKo} 기법을 다차원으로 믹싱한 스타일입니다.`,
          descEn: `A style that multi-dimensionally mixes ${capitalizeId(subject.id, 'mix-')} with ${capitalizeId(medium.id, 'med-')} technique.`,
          palette: palette.colors,
          prompt: plainPrompt,
          promotionPrompt: plainPrompt,
          tags: [activeCategory, 'mixer', subject.nameKo, medium.nameKo]
        };

        // 홍보 탭의 고도화된 프롬프트 파서가 로드되어 있으면 연동
        if (typeof window.buildPromotionConceptStyle === 'function') {
          dummyStyle = window.buildPromotionConceptStyle(dummyStyle);
        }

        window.applyPromotionConceptStyle(dummyStyle);
        const tabBtn = document.getElementById('tabBtnPromotion');
        if (tabBtn) tabBtn.click();
      } else {
        alert('홍보용 이미지 탭을 찾을 수 없습니다.');
      }
    });
  }


  // 독립 화풍 믹서 탭 초기화
  document.addEventListener('DOMContentLoaded', () => {
    const mixerContainer = document.getElementById('conceptMixerContainer');
    if (!mixerContainer) return;
    initConceptMixer();
  });

})();
