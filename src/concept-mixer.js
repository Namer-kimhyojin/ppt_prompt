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
      },
      { id: 'mix-steel-stainless', nameKo: '스테인리스 표면 처리', emoji: '✨', desc: '거울처럼 빛나는 스테인리스 강판의 전기화학적 표면 연마', prompt: 'a pristine stainless steel surface with mirror-like electropolished finish, reflecting industrial surroundings, close-up metallic texture with chromium brilliance' },
      { id: 'mix-steel-galvanized', nameKo: '용융 아연도금 공정', emoji: '🌊', desc: '강재를 용융 아연 욕조에 담가 방청 도금하는 공정', prompt: 'steel sheet being immersed in a shimmering molten zinc bath for hot-dip galvanizing, silver liquid metal surface with thermal ripples, industrial coating process' },
      { id: 'mix-steel-h-beam', nameKo: 'H형강 구조 골격', emoji: '🏗️', desc: '고층 빌딩 뼈대를 이루는 H형 구조용 강재의 현장 조립', prompt: 'massive H-section steel beams forming the skeletal frame of a high-rise building under construction, cranes lifting shiny steel members, blue sky backdrop' },
      { id: 'mix-steel-pipe', nameKo: '초대형 강관 파이프라인', emoji: '🔩', desc: '대규모 에너지 수송을 위한 대구경 강관 제조 및 용접', prompt: 'rows of large diameter steel pipe tubes in a manufacturing yard, precise circular cross-sections, welding sparks, pipeline infrastructure, industrial logistics' },
      { id: 'mix-steel-strip', nameKo: '극박 코팅 강판 제조', emoji: '🎞️', desc: '0.1mm 이하 극박 냉연 강판에 기능성 코팅을 적용하는 정밀 공정', prompt: 'ultra-thin cold-rolled steel strip being precision coated on a high-speed industrial line, reflective metal surface, coating rollers, tight quality tolerances' },
      { id: 'mix-steel-forging', nameKo: '대형 단조 프레스 성형', emoji: '🔨', desc: '수천 톤 유압 프레스로 강재를 가압·성형하는 단조 조업', prompt: 'a massive hydraulic forging press stamping glowing red-hot steel billet into a precise shaped die, tons of compression force, industrial scale heavy machinery' },
      { id: 'mix-steel-tempering', nameKo: '열처리 담금질 & 뜨임', emoji: '🌡️', desc: '열처리로에서 담금질·뜨임으로 강도를 극대화하는 공정', prompt: 'steel workpieces glowing red-orange being quenched in an oil bath for hardening, then tempered in an industrial heat treatment furnace, metallurgical process' },
      { id: 'mix-steel-ai-inspection', nameKo: 'AI 표면 결함 자동 검사', emoji: '🤖', desc: '카메라·딥러닝 기반 AI가 강판 표면 결함을 실시간 감지', prompt: 'AI-powered surface defect inspection system scanning steel sheet with high-resolution cameras and laser sensors, real-time defect highlighting on monitor, quality control automation' }
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
      },
      { id: 'mix-energy-offshore-wind', nameKo: '해상풍력 발전단지', emoji: '🌊', desc: '거대한 해상 풍력 터빈들이 군집을 이루는 대규모 해상 발전 단지', prompt: 'vast offshore wind farm with dozens of giant white wind turbines standing in the ocean, aerial view at golden hour, dramatic clouds, clean renewable energy landscape' },
      { id: 'mix-energy-tidal', nameKo: '조류 수중 터빈 발전', emoji: '🌀', desc: '해저 조류 에너지를 전기로 변환하는 수중 터빈 발전 설비', prompt: 'underwater tidal turbine array harnessing ocean current energy, blue-green water flow, spinning turbine blades, marine renewable energy technology, ocean floor installation' },
      { id: 'mix-energy-geothermal', nameKo: '지열 심층 시추 발전', emoji: '🌋', desc: '지하 수km 심층에서 지열 스팀을 끌어올려 발전하는 시추 설비', prompt: 'geothermal power plant with steam rising from deep borehole drilling rigs, volcanic rocky landscape, natural geothermal heat energy extraction, industrial infrastructure' },
      { id: 'mix-energy-smr', nameKo: '소형 모듈 원자로 (SMR)', emoji: '⚛️', desc: '소형·안전·모듈화로 설계된 차세대 원자력 발전 시스템', prompt: 'futuristic small modular reactor facility with clean compact nuclear reactor vessel, advanced safety cooling system, glowing blue reactor core, next-generation nuclear energy' },
      { id: 'mix-energy-pumped-hydro', nameKo: '양수발전 저수지 시스템', emoji: '🏔️', desc: '잉여 전력으로 물을 퍼올려 저장하고 방류로 발전하는 에너지 저장 댐', prompt: 'mountain pumped hydro energy storage facility with two reservoirs at different elevations connected by tunnels, water flowing through penstocks, energy storage dam landscape' },
      { id: 'mix-energy-waste-energy', nameKo: '폐기물 에너지화 열병합', emoji: '🔥', desc: '생활 폐기물을 연소해 전기와 열을 동시 생산하는 자원 회수 시설', prompt: 'modern waste-to-energy combined heat and power plant with clean combustion chambers, waste processing conveyors, steam turbines, district heating pipes, sustainable waste management' },
      { id: 'mix-energy-bipv', nameKo: 'BIPV 건물 일체형 태양광', emoji: '🏢', desc: '건물 외벽과 유리창 자체가 태양광 발전 패널 역할을 하는 BIPV 건축', prompt: 'modern building facade integrated with thin-film photovoltaic solar panels as windows and wall cladding, BIPV architecture, urban solar energy harvesting, futuristic green building' },
      { id: 'mix-energy-grid-storage', nameKo: '그리드 연계 대용량 ESS', emoji: '🔋', desc: '전력망에 연계된 대규모 배터리 에너지 저장 시스템(ESS) 시설', prompt: 'massive grid-scale battery energy storage system facility with rows of container-sized battery packs, power converters, electric substations, large-scale energy storage infrastructure' }
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
      },
      { id: 'mix-soft-llm', nameKo: '대형 언어 모델 GPU 클러스터', emoji: '🧮', desc: '수천 개 GPU가 병렬 연산하는 LLM 학습 슈퍼컴퓨터 클러스터', prompt: 'massive GPU computing cluster for training large language models, thousands of graphics cards in server racks with glowing cooling systems, AI supercomputer data center' },
      { id: 'mix-soft-edge-ai', nameKo: '엣지 AI 추론 칩', emoji: '💡', desc: '모바일·IoT 디바이스에서 실시간 AI 추론이 가능한 초저전력 엣지 SoC', prompt: 'close-up of an edge AI inference chip on a circuit board, glowing neural network pathways etched in silicon, mobile AI processor, low-power embedded machine learning hardware' },
      { id: 'mix-soft-xr-dev', nameKo: 'XR 크로스 플랫폼 개발', emoji: '🥽', desc: 'AR/VR/MR 혼합현실 콘텐츠를 통합 개발하는 XR 플랫폼 환경', prompt: 'XR development environment showing multiple screens with AR, VR and mixed reality applications, spatial computing tools, holographic interface, developer workspace for cross-reality apps' },
      { id: 'mix-software-robotic', nameKo: '협동 로봇 프로그래밍', emoji: '🦾', desc: '사람과 같은 공간에서 협업하는 코봇의 동작 프로그래밍 인터페이스', prompt: 'collaborative robot cobot arm being programmed with a tablet interface, safety sensors, flexible manufacturing cell, human-robot collaboration workspace, industrial automation' },
      { id: 'mix-software-devops', nameKo: 'DevOps CI/CD 파이프라인', emoji: '⚙️', desc: '코드 커밋부터 배포까지 자동화된 지속 통합·배포 파이프라인 시각화', prompt: 'DevOps CI/CD pipeline visualization dashboard showing automated build, test, and deploy stages, code flow through containers, Kubernetes cluster, continuous integration workflow' },
      { id: 'mix-software-api', nameKo: 'API 마이크로서비스 아키텍처', emoji: '🔗', desc: '독립 마이크로서비스들이 API 게이트웨이로 연결되는 클라우드 아키텍처', prompt: 'microservices architecture diagram with interconnected service nodes and API gateway, container orchestration visualization, cloud-native software architecture, technical system map' },
      { id: 'mix-software-deeplearning', nameKo: '딥러닝 컨볼루션 신경망', emoji: '🧠', desc: '이미지 분류를 수행하는 CNN 신경망의 레이어 구조 시각화', prompt: 'convolutional neural network architecture visualization with glowing neuron layers, feature map activations, deep learning model structure, 3D tensor flow diagram' },
      { id: 'mix-software-digital-twin', nameKo: '산업 디지털 트윈 시스템', emoji: '🔮', desc: '물리 설비와 실시간 동기화되는 산업용 디지털 트윈 플랫폼', prompt: 'industrial digital twin platform showing a physical factory floor mirrored by a 3D virtual model with real-time sensor data overlay, predictive maintenance dashboard, IoT connectivity' }
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
      },
      { id: 'mix-bio-gene-sequencing', nameKo: '차세대 유전체 시퀀싱', emoji: '🧬', desc: '나노포어 기술로 DNA 염기서열을 초고속 판독하는 유전체 분석 장비', prompt: 'next-generation DNA sequencing machine reading genetic code with fluorescent base detection, genomics laboratory, colorful DNA strand visualization, bioinformatics data stream' },
      { id: 'mix-bio-organoid', nameKo: '3D 오가노이드 배양 모델', emoji: '🫧', desc: '인체 장기 구조를 모사한 미니 오가노이드 3D 세포 배양 모델', prompt: '3D organoid cell culture in a petri dish under microscope, miniature brain or intestinal organoid tissue structure, fluorescent cell staining, biomedical research laboratory' },
      { id: 'mix-bio-crispr', nameKo: '크리스퍼 유전자 편집', emoji: '✂️', desc: 'CRISPR-Cas9 분자 가위로 특정 유전자를 정밀 편집하는 장면', prompt: 'CRISPR-Cas9 gene editing concept with molecular scissors cutting DNA double helix at precise location, glowing gene sequence, biotechnology genome editing visualization' },
      { id: 'mix-bio-monoclonal', nameKo: '단클론 항체 바이오 의약품', emoji: '💉', desc: '항체 공학으로 생산된 단클론 항체 의약품의 제조 공정', prompt: 'biopharmaceutical manufacturing of monoclonal antibodies in sterile bioreactor vessels, protein purification chromatography columns, GMP cleanroom, antibody drug production facility' },
      { id: 'mix-bio-wearable-sensor', nameKo: '생체 신호 웨어러블', emoji: '⌚', desc: '심박·혈당·뇌파를 실시간 측정하는 의료용 웨어러블 센서 디바이스', prompt: 'advanced biosensor wearable device on human wrist showing real-time ECG heartbeat, blood glucose, and brainwave monitoring, medical IoT health tracking, digital health technology' },
      { id: 'mix-bio-tissue-engineering', nameKo: '생체 조직 공학 스캐폴드', emoji: '🏗️', desc: '인공 지지체에 세포를 배양해 인체 조직을 재건하는 조직 공학', prompt: 'tissue engineering scaffold with living cells growing on a 3D printed biocompatible matrix, regenerative medicine lab, collagen scaffold structure, cell seeding process, biophotonics' },
      { id: 'mix-bio-microbiome', nameKo: '장내 마이크로바이옴 연구', emoji: '🦠', desc: '인체 건강과 밀접한 장내 미생물 군집의 분석과 활용 연구', prompt: 'gut microbiome scientific visualization with diverse bacterial colony clusters, human digestive system anatomy, microorganism ecosystem, 3D rendering of intestinal flora diversity' },
      { id: 'mix-bio-synthetic-protein', nameKo: '합성 단백질 구조 설계', emoji: '🔬', desc: 'AlphaFold AI로 설계된 신규 단백질의 3D 폴딩 구조 시각화', prompt: 'AI-designed synthetic protein 3D structure visualization with ribbons and helices, molecular folding simulation, colorful amino acid chain, computational protein engineering' }
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
      },
      { id: 'mix-finance-robo-adv2', nameKo: '알고 트레이딩 퀀트 전략', emoji: '📐', desc: '수학 모델과 빅데이터로 시장을 자동 매매하는 퀀트 알고리즘 트레이딩', prompt: 'quantitative algorithmic trading dashboard with mathematical formulas, real-time candlestick charts, trading signals, automated order execution interface, quant finance strategy' },
      { id: 'mix-finance-defi', nameKo: 'DeFi 탈중앙 금융 프로토콜', emoji: '🔗', desc: '블록체인 스마트 계약으로 운영되는 탈중앙화 금융 생태계 시각화', prompt: 'decentralized finance DeFi protocol with blockchain node network, liquidity pool smart contracts, token staking yield farming interface, Web3 finance ecosystem visualization' },
      { id: 'mix-finance-ipo', nameKo: '기업공개 IPO 상장 세레모니', emoji: '🎉', desc: '증권거래소 개장 타종으로 기업 상장을 알리는 IPO 세레모니', prompt: 'stock exchange IPO listing ceremony with executives ringing the opening bell, trading floor screens showing rising stock price, confetti, financial milestone celebration event' },
      { id: 'mix-finance-venture', nameKo: '벤처 투자 IR 피칭', emoji: '🚀', desc: '스타트업이 VC 앞에서 비즈니스 모델과 성장성을 발표하는 IR 피칭', prompt: 'startup founder pitching business to venture capital investors in modern boardroom, growth chart presentation, investor meeting, funding round discussion, entrepreneurial pitch deck' },
      { id: 'mix-finance-trade', nameKo: '글로벌 무역금융 플랫폼', emoji: '🚢', desc: '수출입 결제와 공급망을 지원하는 글로벌 무역금융 시스템', prompt: 'global trade finance platform with shipping containers, letter of credit documents, international payment flow between banks, supply chain finance network visualization' },
      { id: 'mix-finance-actuarial', nameKo: '보험 계리 리스크 분석', emoji: '📊', desc: '생명·손해보험 위험률을 수리·통계 모델로 산출하는 계리 분석 시스템', prompt: 'actuarial insurance risk analysis visualization with mortality tables, probability distribution curves, risk modeling software interface, financial mathematics data science dashboard' },
      { id: 'mix-finance-reit', nameKo: '부동산 리츠 REIT 수익 구조', emoji: '🏙️', desc: '상업용 부동산 포트폴리오에 투자하는 리츠의 임대 수익 배분 구조', prompt: 'real estate investment trust REIT portfolio with commercial property buildings, rental income distribution chart, dividend yield visualization, property fund management dashboard' },
      { id: 'mix-finance-credit-score', nameKo: 'AI 신용 평가 스코어링', emoji: '🎯', desc: 'AI와 빅데이터로 개인·기업 신용도를 실시간 분석하는 핀테크 신용 모델', prompt: 'AI credit scoring system with real-time financial data analysis, credit risk gauge meter, machine learning model decision tree, fintech credit assessment platform interface' }
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
      },
      { id: 'mix-public-smart-safety', nameKo: '스마트 재난 안전 관제센터', emoji: '🚨', desc: 'CCTV·드론·IoT 센서를 통합해 재난 상황을 실시간 모니터링하는 안전 관제', prompt: 'smart city disaster safety control center with multi-screen monitoring wall showing CCTV feeds, drone footage, IoT sensor alerts, emergency response coordination, public safety command' },
      { id: 'mix-public-digital-id', nameKo: '디지털 전자 신분증 시스템', emoji: '🪪', desc: '스마트폰 기반 모바일 신분 인증과 전자 서명을 통합한 디지털 ID', prompt: 'digital identity mobile app on smartphone with biometric verification, QR code secure credential, government-issued digital ID card, secure authentication, e-government services' },
      { id: 'mix-public-gov-cloud', nameKo: '정부 통합 클라우드 행정망', emoji: '☁️', desc: '행정 데이터를 안전하게 처리하는 정부 전용 하이브리드 클라우드 인프라', prompt: 'government cloud computing infrastructure with secure hybrid cloud data centers, encrypted administrative network, public sector IT backbone, e-government digital transformation' },
      { id: 'mix-public-autonomous-transit', nameKo: '자율주행 공공 대중교통', emoji: '🚌', desc: '운전자 없이 AI가 운행하는 자율주행 버스·셔틀의 도심 대중교통 서비스', prompt: 'autonomous self-driving public transit bus operating on dedicated lane in smart city, no driver, AI navigation system, electric vehicle, modern urban mobility infrastructure' },
      { id: 'mix-public-social-housing', nameKo: '공공 임대 주거 복지 단지', emoji: '🏘️', desc: '저소득층을 위한 친환경·스마트 공공임대 주거 단지 개발 사업', prompt: 'modern affordable social housing complex with green rooftop gardens, community spaces, smart home features, sustainable architecture, inclusive public housing development' },
      { id: 'mix-public-e-petition', nameKo: '전자 공론화 청원 플랫폼', emoji: '📣', desc: '시민이 정책 의제를 제안하고 공론화하는 디지털 참여 민주주의 플랫폼', prompt: 'digital civic participation platform showing online petition with public comments, vote counting progress bar, community forum, e-democracy citizen engagement website interface' },
      { id: 'mix-public-border-control', nameKo: '스마트 출입국 자동심사', emoji: '🛂', desc: '생체 인식·AI로 여행자를 빠르게 인증하는 차세대 스마트 출입국 시스템', prompt: 'smart border automated passport control gate with facial recognition scanner, biometric fingerprint, e-passport chip reading, modern airport immigration technology, fast processing' },
      { id: 'mix-public-national-grid', nameKo: '국가 전력망 통합 관제', emoji: '⚡', desc: '전국 발전·송전·배전 현황을 실시간 모니터링하는 국가 전력망 EMS', prompt: 'national electricity grid control room with wall-sized power network map, real-time load monitoring, substation status displays, energy management system EMS, grid operators' }
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
      },
      { id: 'mix-brand-sustainability', nameKo: '친환경 지속가능 브랜딩', emoji: '🌿', desc: '자연 소재·리사이클 패키지를 전면에 내세운 친환경 지속가능성 브랜드 캠페인', prompt: 'eco-friendly sustainable brand campaign with natural materials, recycled paper packaging, green product photography, earthy color palette, environmental commitment brand identity' },
      { id: 'mix-brand-collab', nameKo: '브랜드 콜라보 한정판', emoji: '🤝', desc: '두 브랜드가 협업해 출시하는 화제성 한정판 컬렉션 패키지 디자인', prompt: 'luxury brand collaboration limited edition product packaging, two brand logos side by side, exclusive collector item, special edition design, unboxing reveal aesthetic' },
      { id: 'mix-brand-mascot', nameKo: '브랜드 캐릭터 & 마스코트', emoji: '🐾', desc: '브랜드 정체성을 대표하는 친근하고 개성 있는 마스코트 캐릭터 디자인', prompt: 'charming brand mascot character design with distinct personality, various emotion poses, brand color scheme, logo integration, cute and memorable corporate character illustration' },
      { id: 'mix-brand-experiential', nameKo: '브랜드 체험 팝업 공간', emoji: '🎪', desc: '소비자가 브랜드 스토리를 직접 체험하는 몰입형 팝업 스토어 공간 연출', prompt: 'immersive brand experience pop-up store with interactive installations, brand storytelling environment, experiential retail design, photogenic selfie corner, unique retail activation' },
      { id: 'mix-brand-social-media', nameKo: '소셜미디어 바이럴 캠페인', emoji: '📱', desc: '틱톡·인스타 챌린지를 활용한 바이럴 소셜미디어 마케팅 캠페인', prompt: 'viral social media brand campaign content grid showing TikTok and Instagram posts, user-generated content montage, hashtag challenge participation, brand engagement metrics' },
      { id: 'mix-brand-packaging', nameKo: '프리미엄 언박싱 패키징', emoji: '📦', desc: '개봉 순간부터 감동을 주는 프리미엄 브랜드 패키지 디자인', prompt: 'premium brand unboxing experience with luxury matte black box, magnetic closure, tissue paper, product reveal, artisanal packaging design, high-end retail aesthetic' },
      { id: 'mix-brand-b2b', nameKo: 'B2B 기업 브랜드 아이덴티티', emoji: '🏢', desc: '비즈니스 고객을 대상으로 신뢰와 전문성을 표현하는 B2B 기업 브랜딩', prompt: 'professional B2B corporate brand identity design with logo on office building signage, business cards, PowerPoint templates, corporate stationery, consistent brand guidelines' },
      { id: 'mix-brand-rebranding', nameKo: '레거시 브랜드 리브랜딩', emoji: '🔄', desc: '오래된 브랜드를 현대적으로 재해석하는 리브랜딩 전·후 비교 캠페인', prompt: 'brand rebranding transformation showing before and after comparison, logo redesign evolution, modernized visual identity, fresh contemporary brand refresh, heritage brand reinvention' }
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
      },
      { id: 'mix-space-lunar-base', nameKo: '달 표면 기지 건설', emoji: '🌕', desc: '인류 재정착을 위한 달 표면 돔형 거주 기지와 태양광 패널 설비', prompt: 'lunar base habitat on moon surface with dome-shaped pressurized modules, solar array panels, astronauts in spacesuits, Earth rising in background, grey crater lunar landscape' },
      { id: 'mix-space-elevator', nameKo: '우주 엘리베이터 케이블', emoji: '🛗', desc: '지구 적도에서 정지궤도까지 연결된 카본 나노튜브 우주 엘리베이터', prompt: 'space elevator concept with a tethered cable rising from equatorial ocean platform to geostationary orbit, climber vehicle ascending, carbon nanotube ribbon, orbital ring station' },
      { id: 'mix-space-asteroid-mining', nameKo: '소행성 광물 채굴', emoji: '⛏️', desc: '금속 자원이 풍부한 소행성 표면에서 로봇이 광물을 채굴하는 장면', prompt: 'robotic mining spacecraft drilling and extracting minerals from metallic asteroid surface, processing ore in zero gravity, space resource extraction operation, asteroid belt setting' },
      { id: 'mix-space-mars-colony', nameKo: '화성 테라포밍 정착지', emoji: '🔴', desc: '화성 환경을 개조해 인류 정착지를 구축하는 테라포밍 프로젝트 비주얼', prompt: 'Mars colony with biodome habitats on red Martian surface, terraforming atmospheric processors, human settlement with greenhouses, Phobos in sky, long-term human Mars civilization' },
      { id: 'mix-space-deep-probe', nameKo: '딥스페이스 탐사 우주선', emoji: '🛸', desc: '태양계 바깥 성간 공간을 항해하는 무인 딥스페이스 탐사선', prompt: 'deep space probe spacecraft voyaging through interstellar space, radioisotope thermoelectric generator RTG, distant star field background, scientific instruments deployed, NASA JPL aesthetic' },
      { id: 'mix-space-tourism', nameKo: '민간 우주 관광 스테이션', emoji: '🏨', desc: '지구 저궤도에 설치된 민간 우주 호텔과 관광 스테이션', prompt: 'private space tourism station in low Earth orbit with viewing windows overlooking Earth, rotating habitat ring for gravity, luxury space hotel, commercial space travel destination' },
      { id: 'mix-space-geo-satellite', nameKo: '정지궤도 기상 위성', emoji: '🛰️', desc: '지구 정지궤도에서 기상 현상을 관측하는 대형 기상 위성', prompt: 'large geostationary weather satellite in orbit above Earth, solar panels deployed, Earth observation sensors scanning cloud patterns and storm systems, meteorological satellite technology' },
      { id: 'mix-space-exoplanet', nameKo: '외계 행성 탐사 로버', emoji: '🌌', desc: '지구형 외계 행성 표면을 탐사하는 AI 자율주행 우주 탐사 로버', prompt: 'autonomous space rover exploring surface of Earth-like exoplanet with alien landscape, two suns in sky, scientific instruments scanning terrain, astrobiology exploration mission' }
    ],

    // ==================== 지역산업 & 거점도시 ====================
    regional: [
      {
        id: 'mix-regional-pohang-harbor',
        nameKo: '포항 영일만 산업 항만',
        emoji: '⚓',
        desc: '영일만을 배경으로 한 제철·화학 항만 시설과 대형 크레인.',
        prompt: 'aerial panoramic view of a massive industrial harbor district with large cranes, steel factory smokestacks and pipes reflecting in calm harbor water at dusk, East Sea coastline industrial port'
      },
      {
        id: 'mix-regional-postech-campus',
        nameKo: '포스텍 & 연구개발 캠퍼스',
        emoji: '🎓',
        desc: '첨단 연구소와 유리·콘크리트 건축물이 어우러진 과학기술 캠퍼스.',
        prompt: 'modern science and technology university research campus with sleek glass and concrete buildings, open green plazas, researchers collaborating in labs, bright sunny day'
      },
      {
        id: 'mix-regional-smart-greenindu',
        nameKo: '스마트그린 산업단지',
        emoji: '🏭',
        desc: '태양광 패널과 스마트 센서가 통합된 친환경 첨단 산업단지.',
        prompt: 'aerial view of a modern smart green industrial complex with solar panels installed on factory rooftops, green landscaping buffers, digital sensor network nodes connecting facilities, clean and organized'
      },
      {
        id: 'mix-regional-secondary-battery',
        nameKo: '이차전지 소재 클러스터',
        emoji: '🔋',
        desc: '양극재·음극재 등 이차전지 핵심 소재 생산 시설.',
        prompt: 'high-tech battery material production facility with large industrial chemical reactors, automated conveyor systems processing cathode and anode material powder, clean room environments'
      },
      {
        id: 'mix-regional-hydrogen-hub',
        nameKo: '동해안 수소 경제 허브',
        emoji: '💨',
        desc: '연안 수소 생산·저장 탱크와 파이프라인 인프라.',
        prompt: 'large spherical hydrogen storage tanks along a coastal industrial area, connected by silver pipeline networks, mountains and East Sea in the background, clean blue sky'
      },
      {
        id: 'mix-regional-blue-economy',
        nameKo: '동해 블루이코노미',
        emoji: '🌊',
        desc: '해상 양식장, 해양 에너지, 수산 가공이 공존하는 동해 해양 산업.',
        prompt: 'offshore platform in the East Sea with aquaculture net cage arrays, submarine power cables, distant offshore wind turbines on the horizon, combining marine resources and clean energy'
      },
      {
        id: 'mix-regional-agribio-complex',
        nameKo: '경북 농생명 특화단지',
        emoji: '🌿',
        desc: '스마트팜·바이오 발효 시설과 경북 농업 생태계가 어우러진 단지.',
        prompt: 'modern smart farm greenhouse complex with automated hydroponic cultivation systems and bio-fermentation tanks, surrounded by terraced agricultural landscapes in a mountain valley, North Gyeongsang style scenery'
      },
      {
        id: 'mix-regional-innovation-center',
        nameKo: '지역 혁신거점 센터',
        emoji: '🏢',
        desc: '테크노파크·창업 허브·지원 기관이 집적된 첨단 혁신 센터 빌딩.',
        prompt: 'a modern regional innovation center building with floor-to-ceiling glass windows, collaborative co-working spaces visible inside, startup signage on facade, diverse entrepreneurs and researchers gathered around'
      },
      { id: 'mix-regional-special-zone', nameKo: '기업도시 & 경제특구', emoji: '🏙️', desc: '민간 기업 주도로 개발되는 자족형 기업도시와 경제자유구역 조성', prompt: 'enterprise city development aerial view with mixed-use towers, industrial park, research campus, residential areas, transport hub, special economic zone master plan visualization' },
      { id: 'mix-regional-anchor', nameKo: '앵커 기업 유치 협약식', emoji: '🤝', desc: '지역 경제를 이끌 대형 앵커 기업 투자 유치 서명식 행사', prompt: 'official anchor company investment signing ceremony, executives shaking hands with local government officials, media backdrop, flags, formal business cooperation agreement event' },
      { id: 'mix-regional-startup-campus', nameKo: '지역 스타트업 캠퍼스', emoji: '🚀', desc: '청년 창업가들이 모이는 지역 기반 오픈 이노베이션 스타트업 허브', prompt: 'vibrant regional startup campus with co-working space, innovation labs, pitched startup demos, young entrepreneurs collaborating, accelerator program, local innovation ecosystem' },
      { id: 'mix-regional-local-brand', nameKo: '지역 특산품 브랜드화', emoji: '🏷️', desc: '지역 농수산물과 특산품을 프리미엄 브랜드로 개발하는 6차 산업화', prompt: 'premium local specialty product branding with beautifully designed packaging, regional origin label, artisan food products, geographical indication, local brand development' },
      { id: 'mix-regional-heritage', nameKo: '전통 산업 스마트 고도화', emoji: '⚙️', desc: '섬유·세라믹·식품 등 전통 지역 산업을 스마트 기술로 고도화', prompt: 'smart technology modernization of traditional regional industry such as ceramics or textile factory, AI quality control robots, digital transformation of heritage manufacturing' },
      { id: 'mix-regional-tech-valley', nameKo: '지역 혁신 테크밸리', emoji: '💡', desc: '대학·연구소·기업이 삼각 협력하는 지역 혁신 클러스터 테크밸리', prompt: 'regional technology valley with university research building, corporate R&D lab, startup incubator, triple helix collaboration, innovation district aerial master plan' },
      { id: 'mix-regional-export', nameKo: '지역 수출 산업 클러스터', emoji: '🌐', desc: '수출 주력 산업이 집적된 지역 특화 산업 단지와 물류 인프라', prompt: 'regional export industrial cluster with specialized manufacturing facilities, port logistics, international trade fair, global supply chain, local product export promotion' },
      { id: 'mix-regional-rural-revital', nameKo: '농산어촌 활성화 사업', emoji: '🌾', desc: '청년 귀농·관광·6차 산업 융합으로 활성화되는 농산어촌 지역 재생', prompt: 'rural village revitalization project with young farmers, agro-tourism facilities, farm-to-table restaurant, local market, regenerating countryside community, rural innovation' }
    ],

    // ==================== 정책 & 공공지원 ====================
    policy: [
      {
        id: 'mix-policy-rd-funding',
        nameKo: '국가 R&D 과제 기획',
        emoji: '📋',
        desc: '정부 연구개발 과제 기획·공모·심사 프로세스를 보여주는 다이어그램.',
        prompt: 'government R&D project planning concept illustration, connected flowcharts with scientific research icons, budget allocation nodes, and officials pointing at a structured project roadmap whiteboard'
      },
      {
        id: 'mix-policy-technopark-incubation',
        nameKo: '테크노파크 창업 보육',
        emoji: '🌱',
        desc: '테크노파크 입주기업에 대한 멘토링·공간·자금 지원 생태계.',
        prompt: 'bright startup incubator workspace inside a modern technopark building, entrepreneurs working on laptops at open desks, mentors consulting with startup teams, business pitch presentations on screens'
      },
      {
        id: 'mix-policy-industrial-complex',
        nameKo: '국가 산업단지 지정·조성',
        emoji: '📐',
        desc: '관계부처와 지자체가 합동으로 산업단지를 기획·설계하는 장면.',
        prompt: 'government planning session for a national industrial complex, large detailed blueprint maps spread on a conference table, public officials and urban planners discussing site design, formal meeting room'
      },
      {
        id: 'mix-policy-sme-support',
        nameKo: '중소·벤처기업 지원사업',
        emoji: '🤝',
        desc: '정부 지원금 선정 심사 및 협약 체결 장면.',
        prompt: 'formal government funding award ceremony for small and medium enterprises, officials and business representatives shaking hands, framed award certificates, national and local government flag backdrop'
      },
      {
        id: 'mix-policy-regional-innovation',
        nameKo: '지역혁신 클러스터 (RIS)',
        emoji: '🔗',
        desc: '지역 내 산·학·연·관이 협력하는 혁신 생태계 네트워크.',
        prompt: 'regional innovation cluster ecosystem infographic concept, interconnected nodes representing universities, research institutes, companies, and government agencies connected by glowing collaboration links'
      },
      {
        id: 'mix-policy-esg-reporting',
        nameKo: '공공기관 ESG 경영 공시',
        emoji: '📊',
        desc: 'ESG 경영 성과 보고와 탄소중립 목표 시각화.',
        prompt: 'corporate ESG sustainability report concept, professional clean white layout featuring green leaf, solar energy panel, social equality, and governance icons, corporate responsibility annual disclosure'
      },
      {
        id: 'mix-policy-smart-admin',
        nameKo: '디지털 공공행정 서비스',
        emoji: '📱',
        desc: '전자정부 플랫폼과 모바일 앱을 통한 비대면 행정 민원 처리.',
        prompt: 'modern digital government service platform on multiple screens, citizen digital ID cards, online document applications, approval workflow notifications, clean and accessible UI design'
      },
      {
        id: 'mix-policy-performance-mgmt',
        nameKo: '공공기관 성과 관리',
        emoji: '📈',
        desc: '연간 경영 성과지표 대시보드와 KPI 달성률 보고 회의.',
        prompt: 'digital performance management dashboard on a large display in a government conference room, annual KPI metric cards, target achievement progress bars, trend graphs, formal meeting setting'
      },
      { id: 'mix-policy-reg-sandbox', nameKo: '규제 샌드박스 혁신 특례', emoji: '🧪', desc: '신기술·신사업의 임시 허가와 규제 실증 특례를 운영하는 혁신 제도', prompt: 'regulatory sandbox innovation exemption concept, new technology pilot testing in controlled environment, government approval sandbox framework, fintech or mobility innovation test zone' },
      { id: 'mix-policy-startup-fund', nameKo: '창업 지원 정책 펀드', emoji: '💰', desc: '정부 모태펀드 기반의 창업·벤처 투자 생태계 조성 지원 사업', prompt: 'government startup support fund investment ecosystem, venture fund allocation chart, startup acceleration grant application process, policy funding for entrepreneurs, innovation support' },
      { id: 'mix-policy-carbon-market', nameKo: '탄소 배출권 거래 시장', emoji: '🌱', desc: '온실가스 감축 목표 달성을 위한 배출권 거래제(ETS) 시장 시각화', prompt: 'carbon emissions trading market visualization with ETS allowance trading chart, CO2 reduction certificates, green credit exchange platform, cap and trade mechanism' },
      { id: 'mix-policy-oda', nameKo: '공적 개발 원조 ODA 사업', emoji: '🌍', desc: '개발도상국 경제 성장을 지원하는 한국형 ODA 개발 협력 사업', prompt: 'Korean ODA development assistance project in developing country, infrastructure construction, training program, health facility, international development cooperation, K-ODA branding' },
      { id: 'mix-policy-smartcity-plan', nameKo: '스마트시티 종합 계획', emoji: '🏙️', desc: '국가 주도 스마트시티 시범도시 조성 마스터플랜 시각화', prompt: 'national smart city master plan visualization, pilot smart city development zones, mobility-energy-welfare-governance digital integration, smart city government policy roadmap' },
      { id: 'mix-policy-industry-육성', nameKo: '전략 산업 육성 정책', emoji: '🏭', desc: '반도체·배터리·바이오 등 국가 전략 산업 집중 육성 정책 로드맵', prompt: 'national strategic industry development policy roadmap for semiconductors batteries biotech, government investment in future industries, strategic sector growth policy visualization' },
      { id: 'mix-policy-welfare', nameKo: '복지 정책 수혜 서비스', emoji: '🏥', desc: '취약 계층이 복지 급여와 서비스를 디지털로 신청하는 복지 전달 체계', prompt: 'digital welfare service portal interface, vulnerable population benefit application, social safety net service map, government welfare delivery system, inclusive digital government' },
      { id: 'mix-policy-procurement', nameKo: '공공 조달 혁신 플랫폼', emoji: '📋', desc: '전자조달 시스템으로 투명하게 진행되는 공공 계약·입찰 프로세스', prompt: 'e-procurement public bidding platform interface, transparent government contract process, digital bid submission, public sector purchasing system, open procurement data dashboard' }
    ],

    // ==================== 도시 & 건축 공간 ====================
    urban: [
      { id: 'mix-urban-skyscraper', nameKo: '미래형 초고층 빌딩', emoji: '🏙️', desc: '유리 커튼월과 녹지 테라스가 조화로운 초고층 빌딩 스카이라인', prompt: 'futuristic supertall skyscraper with glass curtain wall facade and hanging sky gardens, dramatic city skyline at dusk, modern urban architecture' },
      { id: 'mix-urban-smarthome', nameKo: '스마트홈 IoT 인테리어', emoji: '🏠', desc: '터치 패널과 AI 허브로 제어되는 스마트홈 거실', prompt: 'modern smart home living room with voice-controlled AI hub, smart lighting panels, automated blinds, and integrated IoT screens showing home status' },
      { id: 'mix-urban-modular', nameKo: '모듈형 조립식 주거', emoji: '📦', desc: '컨테이너·모듈을 적층해 조성한 미래형 공동주거', prompt: 'modular stacked container housing units with colorful exterior panels and balcony gardens, innovative prefabricated urban residential architecture' },
      { id: 'mix-urban-retail', nameKo: '팝업 스마트 리테일', emoji: '🛍️', desc: 'AR 피팅·자동 결제 키오스크가 결합된 스마트 팝업 스토어', prompt: 'high-tech pop-up retail space with interactive AR fitting mirrors, self-checkout kiosks, digital signage, and modern minimalist store design' },
      { id: 'mix-urban-regen', nameKo: '도심 재생 복합 문화 공간', emoji: '🎨', desc: '낡은 공장을 리모델링한 복합 문화 예술 센터', prompt: 'industrial warehouse converted into a vibrant mixed-use cultural arts center with exposed brick, modern glass extensions, art installations, and café' },
      { id: 'mix-urban-waterfront', nameKo: '워터프런트 & 수변 공원', emoji: '🌿', desc: '강·해안가를 따라 조성된 친환경 수변 공원 조경', prompt: 'beautifully landscaped waterfront park with walking promenades, modern pedestrian bridges, native plantings, and people enjoying riverside greenspace' },
      { id: 'mix-urban-transit', nameKo: '복합 환승 개발 (TOD)', emoji: '🚇', desc: '지하철역 위에 들어선 주거·상업·공원 복합 개발 단지', prompt: 'transit-oriented development complex above a metro station, high-rise residential and commercial towers with elevated green plaza, urban integration' },
      { id: 'mix-urban-zeroenergy', nameKo: '제로에너지 그린 빌딩', emoji: '♻️', desc: '태양광 외벽, 지열 냉난방, 빗물 재활용이 통합된 녹색 건축', prompt: 'zero-energy green building with solar panel facade, living green walls, wind turbines on rooftop, and rainwater collection systems, sustainable architecture' },
      { id: 'mix-urban-autonomous-city', nameKo: '자율주행 특화 스마트 도시', emoji: '🚗', desc: '자율주행 전용 도로와 MaaS 통합 모빌리티가 설계된 스마트 도시', prompt: 'smart city designed for autonomous vehicles with dedicated AV lanes, sensor poles, vehicle-to-infrastructure V2X network, mobility-as-a-service hub, futuristic urban transport' },
      { id: 'mix-urban-cultural-district', nameKo: '역사 문화 특화 지구', emoji: '🏛️', desc: '역사 건물 보존과 현대 문화 시설이 조화된 문화 역사 지구', prompt: 'historic cultural district with restored heritage buildings alongside modern cultural facilities, museum, art gallery, pedestrian promenade, tourism zone, history meets contemporary design' },
      { id: 'mix-urban-green-corridor', nameKo: '도시 녹지 연결 코리도', emoji: '🌳', desc: '분절된 도시 공원을 연결하는 대형 녹지 생태 축 코리도', prompt: 'urban green corridor connecting parks and nature, linear park promenade, tree-lined walking and cycling path, urban biodiversity habitat, city ecological connectivity network' },
      { id: 'mix-urban-mixed-tower', nameKo: '주상복합 타워 개발', emoji: '🏢', desc: '주거·상업·호텔·오피스가 하나의 타워에 통합된 복합 개발', prompt: 'mixed-use supertall tower with residential floors above, commercial retail podium, hotel and office sections, rooftop amenity deck, urban landmark architecture' },
      { id: 'mix-urban-underground', nameKo: '지하 도시 인프라 네트워크', emoji: '🚇', desc: '지하 공간을 활용한 물류·전력·통신 통합 도시 인프라 네트워크', prompt: 'underground urban infrastructure network with metro tunnels, utility corridors, underground freight logistics, fiber optic cables, cross-section technical illustration of city below ground' },
      { id: 'mix-urban-24h', nameKo: '24시간 야간 경제 도심', emoji: '🌃', desc: '야간 문화·경제 활동이 활성화된 빛나는 24시간 도심 경관', prompt: '24-hour vibrant night economy city with illuminated entertainment district, restaurants and bars, night market street food, neon signs, lively nightlife cityscape photography' },
      { id: 'mix-urban-bike-network', nameKo: '자전거 친화 도시 네트워크', emoji: '🚴', desc: '전용 자전거 도로와 공유 바이크 시스템이 완비된 자전거 친화 도시', prompt: 'bicycle-friendly city with dedicated protected bike lanes, bike-sharing stations at every corner, cyclists commuting, urban cycling infrastructure, car-free zone, sustainable mobility' },
      { id: 'mix-urban-flood-resilient', nameKo: '홍수 탄력 도시 방재', emoji: '🌊', desc: '스펀지 도시 개념으로 폭우와 홍수에 강한 방재 도시 인프라', prompt: 'flood resilient sponge city design with permeable pavements, bioswale channels, retention ponds, green roofs absorbing rainwater, urban flood management infrastructure' }
    ],

    // ==================== 푸드 & 농식품 ====================
    food: [
      { id: 'mix-food-cultured-meat', nameKo: '푸드테크 배양육', emoji: '🥩', desc: '생물반응기에서 세포 배양으로 생산되는 대체 단백질', prompt: 'high-tech cultivated meat bioreactor growing beef cells in a sterile laboratory, petri dishes, cell culture medium, food technology innovation' },
      { id: 'mix-food-vertical-farm', nameKo: '스마트팜 수직 농업', emoji: '🥬', desc: 'LED 조명과 수경재배 시스템으로 운영되는 도심 수직 농장', prompt: 'multi-tier vertical hydroponic farm inside a modern facility, rows of fresh green lettuce under pink and purple LED grow lights, automated irrigation system' },
      { id: 'mix-food-korean-fine', nameKo: '프리미엄 한식 코스 요리', emoji: '🍱', desc: '모던 한식 파인 다이닝의 아름다운 플레이팅', prompt: 'elegant modern Korean fine dining course meal beautifully plated, traditional ceramic dishware, seasonal ingredients, artistic food presentation, warm restaurant lighting' },
      { id: 'mix-food-plant-protein', nameKo: '식물성 대체 단백질', emoji: '🌱', desc: '콩·완두 등 식물 원료로 만든 미래형 대체 단백질 식품', prompt: 'futuristic plant-based protein products arranged on a clean white table, pea protein ingredients, modern healthy food packaging, green and natural aesthetic' },
      { id: 'mix-food-fermentation', nameKo: '발효 바이오 식품', emoji: '🫙', desc: '전통 발효 기술과 현대 바이오가 결합된 기능성 식품 공정', prompt: 'traditional and modern fermentation facility with large ceramic jars and stainless steel bioreactors, producing probiotic and functional food products' },
      { id: 'mix-food-coldchain', nameKo: '콜드체인 신선 물류', emoji: '🚛', desc: '정온 냉장 물류로 신선 식품을 빠르고 안전하게 배송하는 시스템', prompt: 'modern cold chain logistics warehouse with refrigerated storage racks, temperature monitoring IoT sensors, and fresh produce delivery trucks, food supply chain' },
      { id: 'mix-food-farmersmarket', nameKo: '로컬 푸드 파머스마켓', emoji: '🥦', desc: '지역 생산자가 직접 판매하는 활기찬 로컬 파머스 마켓', prompt: 'vibrant local farmers market outdoor scene, colorful fresh produce stalls, vegetables and fruits, local producers, sunny day, community gathering atmosphere' },
      { id: 'mix-food-molecular', nameKo: 'F&B 분자 요리', emoji: '🫧', desc: '액체 질소·구체화 기법으로 만드는 아방가르드 미식 요리', prompt: 'avant-garde molecular gastronomy dish with spherification, liquid nitrogen smoke, geometric food art, colorful unusual food presentation, high-end restaurant atmosphere' },
      { id: 'mix-food-traditional-craft', nameKo: '전통주 & 장인 발효 식품', emoji: '🍶', desc: '전통 방식으로 빚은 막걸리·전통주와 된장·간장 장인 발효 식품', prompt: 'traditional Korean craft alcohol makgeolli and artisan fermented food, ceramic jars, wooden table setting, traditional brewing process, heritage fermentation craftsmanship' },
      { id: 'mix-food-agri-drone', nameKo: '농업 드론 정밀 농업', emoji: '🚁', desc: 'AI 드론이 작물 상태를 분석하고 농약·비료를 정밀 살포하는 스마트팜', prompt: 'agricultural drone precision farming, multirotor UAV spraying fertilizer over rice paddy fields, crop health monitoring, smart agriculture technology, rural farmland aerial view' },
      { id: 'mix-food-food-safety', nameKo: '식품 안전 검사 시스템', emoji: '🔬', desc: 'AI 비전과 센서로 식품 오염·이물질을 자동 검출하는 안전 검사 라인', prompt: 'food safety inspection system with AI vision camera scanning products on conveyor belt, X-ray contaminant detection, microbiological lab testing, food quality control facility' },
      { id: 'mix-food-fusion', nameKo: '글로벌 퓨전 요리 플레이팅', emoji: '🌏', desc: '동서양 식재료와 조리법을 융합한 크리에이티브 퓨전 요리 플레이팅', prompt: 'creative global fusion cuisine plating, east meets west ingredients on slate plate, artistic food arrangement, chef garnishing, fine dining restaurant, multicultural gastronomy' },
      { id: 'mix-food-aquaculture', nameKo: '스마트 양식 수산업', emoji: '🐟', desc: 'IoT 수질 관제와 자동 급이 시스템을 갖춘 첨단 스마트 양식장', prompt: 'smart aquaculture fish farm with IoT water quality sensors, automated feeding system, fish school in clear tanks, high-tech inland recirculating aquaculture system RAS' },
      { id: 'mix-food-upcycle', nameKo: '식품 업사이클링 신소재', emoji: '♻️', desc: '버려지던 식품 부산물을 새로운 식재료나 포장재로 재탄생시키는 업사이클링', prompt: 'food upcycling innovation lab creating new ingredients from food waste byproducts, spent grain products, fruit peel extracts, sustainable food circular economy, creative food science' },
      { id: 'mix-food-cafe-culture', nameKo: '카페 & 스페셜티 커피 문화', emoji: '☕', desc: '직접 로스팅한 싱글 오리진 원두의 브루잉과 카페 공간 문화', prompt: 'specialty coffee cafe with barista carefully brewing single origin pour-over coffee, roasted beans, espresso extraction, cozy cafe interior, third wave coffee culture aesthetic' },
      { id: 'mix-food-dessert-art', nameKo: '파티스리 & 디저트 아트', emoji: '🍰', desc: '마스터 파티시에의 예술적 케이크 데코레이션과 디저트 플레이팅', prompt: 'master pastry chef artisanal dessert creation, elegantly decorated cake with edible flowers, patisserie display case, dessert art plating, luxurious confectionery craftsmanship' }
    ],

    // ==================== 문화 & 관광 ====================
    culture: [
      { id: 'mix-culture-kpop', nameKo: 'K-팝 & 한류 콘서트', emoji: '🎤', desc: '화려한 무대 LED와 열광하는 관중의 K-팝 공연 현장', prompt: 'spectacular K-pop concert stage with massive LED screen backdrop, laser show, and thousands of glowing audience lightsticks in the arena, energetic performance' },
      { id: 'mix-culture-heritage', nameKo: '전통 문화재 야간 개장', emoji: '🏯', desc: '은은한 조명으로 빛나는 전통 사찰·궁궐의 야간 특별 개장', prompt: 'Korean traditional palace or temple illuminated with warm golden lanterns and modern light art projections at night, serene cultural heritage tourism atmosphere' },
      { id: 'mix-culture-festival', nameKo: '지역 축제 퍼포먼스', emoji: '🎭', desc: '지역 특색을 살린 전통 무예·민속 공연 축제', prompt: 'colorful traditional Korean cultural festival performance with masked dancers, traditional costumes, percussion drumming, outdoor stage, joyful crowd' },
      { id: 'mix-culture-museum', nameKo: '현대 미술관 전시', emoji: '🖼️', desc: '대형 설치 미술과 인터랙티브 미디어아트가 공존하는 현대 미술관', prompt: 'contemporary art museum interior with large-scale installation art, interactive digital media artwork on walls, minimalist white gallery spaces, visitors exploring' },
      { id: 'mix-culture-heritage-tour', nameKo: '역사 도시 역사 투어', emoji: '🗺️', desc: '한국 전통 마을과 역사 도심을 걷는 문화 관광 코스', prompt: 'traditional Korean Hanok village street with historic architecture, stone-paved alleyways, tourists in hanbok, blooming trees, warm cultural heritage atmosphere' },
      { id: 'mix-culture-wellness', nameKo: '웰니스 & 힐링 리조트', emoji: '🧘', desc: '자연 속 명상·스파·요가가 어우러진 프리미엄 웰니스 리조트', prompt: 'premium wellness resort spa pool surrounded by nature, meditation pavilion over tranquil water, guests doing yoga, lush greenery, serene relaxation atmosphere' },
      { id: 'mix-culture-sports', nameKo: '스포츠 & 어드벤처 투어', emoji: '🏄', desc: '서핑·등반·트레일 등 액티브한 스포츠 관광 체험', prompt: 'exciting outdoor adventure sports tourism, surfers on ocean waves, mountain climbers on rock face, cyclists on mountain trail, active lifestyle and nature tourism' },
      { id: 'mix-culture-mice', nameKo: 'MICE 컨벤션 전시회', emoji: '🎪', desc: '대형 전시 부스와 국제 참가자들이 어우러진 MICE 전시회', prompt: 'large international trade show convention hall with elaborate themed exhibition booths, attendees networking, LED signage, professional event atmosphere' },
      { id: 'mix-culture-street-art', nameKo: '거리 예술 & 공공 퍼포먼스', emoji: '🎭', desc: '도심 광장에서 펼쳐지는 거리 예술 공연과 인터랙티브 공공 미술', prompt: 'vibrant street art performance in city square, live acrobatics and music, colorful public art murals, crowd gathering, urban cultural festival, outdoor performance art' },
      { id: 'mix-culture-traditional-craft', nameKo: '무형문화재 전통 공예', emoji: '🏺', desc: '장인이 손으로 빚는 도자기·칠기·한지 등 무형문화재 전통 공예', prompt: 'master craftsman hands shaping traditional ceramic pottery on a wheel, kiln firing, Korean celadon or white porcelain traditional craft, intangible cultural heritage artisan' },
      { id: 'mix-culture-music-festival', nameKo: '글로벌 음악 페스티벌', emoji: '🎵', desc: '야외 대형 무대에서 펼쳐지는 국제 뮤직 페스티벌 현장', prompt: 'massive outdoor music festival stage with epic lighting show, crowd of thousands, colorful stage production, international music festival atmosphere, concert pyrotechnics' },
      { id: 'mix-culture-webtoon', nameKo: '웹툰 & 디지털 만화 산업', emoji: '📱', desc: '모바일 웹툰 플랫폼에서 글로벌로 유통되는 한국 디지털 만화 산업', prompt: 'digital webtoon creation process showing artist drawing on tablet, vertical scrolling webcomic panels, Korean webtoon platform app, global digital manga comics industry' },
      { id: 'mix-culture-esports', nameKo: 'e스포츠 경기 아레나', emoji: '🎮', desc: '수만 명 관중이 응원하는 글로벌 e스포츠 대회 경기장', prompt: 'e-sports arena championship event with huge LED screens showing game action, professional gaming teams at stations, thousands of cheering fans, dramatic lighting effects' },
      { id: 'mix-culture-food-tour', nameKo: '미식 관광 & 로컬 푸드 투어', emoji: '🗺️', desc: '지역 먹거리와 음식 문화를 탐방하는 미식 관광 프로그램', prompt: 'gastronomic food tour experience with tourists sampling local street food, traditional market stalls, guide explaining regional cuisine, cultural food tourism, culinary travel' },
      { id: 'mix-culture-media-facade', nameKo: '디지털 미디어 파사드', emoji: '🌆', desc: '건물 외벽 전체를 캔버스로 활용하는 대형 미디어 아트 파사드', prompt: 'large building facade transformed by massive media art projection mapping, colorful digital artwork covering architecture surface, night time immersive light show, public art' }
    ],

    // ==================== 교육 & 연구 ====================
    education: [
      { id: 'mix-edu-lab', nameKo: '대학 첨단 연구실', emoji: '🔬', desc: '최신 실험 장비가 갖춰진 대학 연구소의 실험 장면', prompt: 'cutting-edge university research laboratory with advanced scientific equipment, researchers in white lab coats conducting experiments, modern lab interior' },
      { id: 'mix-edu-smart-class', nameKo: 'AI 기반 스마트 교실', emoji: '📺', desc: 'AI 튜터와 인터랙티브 디스플레이가 활용되는 미래형 교실', prompt: 'futuristic smart classroom with interactive touchscreen walls, AI teaching assistant avatar on display, students using tablets, personalized learning technology' },
      { id: 'mix-edu-vr-learning', nameKo: 'VR 실감형 교육 콘텐츠', emoji: '🕶️', desc: 'VR 헤드셋으로 역사·과학·우주를 체험하는 몰입형 교육', prompt: 'students wearing VR headsets experiencing immersive educational content, virtual field trip to historical sites or space, next-generation experiential learning' },
      { id: 'mix-edu-stem', nameKo: '과학 실험 STEM 교육', emoji: '⚗️', desc: '화학 실험·코딩·로봇 제작을 통한 창의적 STEM 교육', prompt: 'students engaged in hands-on STEM education, chemistry experiments with colorful reactions, robotics building, coding on computers, creative problem-solving' },
      { id: 'mix-edu-online-lms', nameKo: '온라인 평생교육 LMS', emoji: '💻', desc: '학습자 맞춤형 AI 추천 강의가 제공되는 이러닝 플랫폼 UI', prompt: 'modern e-learning platform interface showing AI-recommended courses, progress tracking dashboard, video lecture, quiz modules, digital learning management system' },
      { id: 'mix-edu-conference', nameKo: '국제 학술 컨퍼런스', emoji: '🎓', desc: '해외 석학들이 모인 국제 학술 심포지엄 발표 현장', prompt: 'international academic conference hall with scholar presenting research on stage, large projection screen, global audience of researchers, formal academic symposium' },
      { id: 'mix-edu-special', nameKo: '특수교육 보조 테크', emoji: '🤝', desc: '장애 학생의 학습을 보조하는 AI·로봇 보조 교육 기기', prompt: 'assistive technology for special education, robot companion helping child with disability, AAC communication device, inclusive classroom with adaptive learning tools' },
      { id: 'mix-edu-research-publish', nameKo: '연구 논문 학술 발표', emoji: '📄', desc: '학술 저널 논문 발표 포스터와 학회 발표 장면', prompt: 'academic poster presentation at a research conference, researcher explaining findings with data charts, peer review, scientific journal publication atmosphere' },
      { id: 'mix-edu-stem-lab', nameKo: 'STEM 융합 과학 실험실', emoji: '🔬', desc: '과학·기술·공학·수학을 융합한 체험형 STEM 교육 실험실', prompt: 'hands-on STEM education laboratory with students conducting science experiments, robotics kits, 3D printers, microscopes, engaging project-based learning, modern STEM classroom' },
      { id: 'mix-edu-distance', nameKo: '원격 비대면 교육 플랫폼', emoji: '💻', desc: '실시간 화상 강의와 인터랙티브 콘텐츠로 진행되는 온라인 학습 플랫폼', prompt: 'online distance learning platform interface with live video lecture, interactive quiz, student virtual classroom, e-learning dashboard, digital education remote school screen' },
      { id: 'mix-edu-vr-classroom', nameKo: 'VR 몰입형 가상 교실', emoji: '🥽', desc: 'VR 헤드셋으로 역사 현장이나 우주를 탐험하는 몰입형 가상 교실', prompt: 'students wearing VR headsets in immersive virtual classroom, exploring ancient historical sites or outer space, virtual reality education experience, EdTech immersive learning' },
      { id: 'mix-edu-library', nameKo: '미래형 도서관 지식 허브', emoji: '📚', desc: 'AI 추천 시스템과 메이커 스페이스가 결합된 미래형 지역 도서관', prompt: 'futuristic public library with digital book kiosks, collaborative maker space, 3D printing corner, AI book recommendation system, modern knowledge hub community space' },
      { id: 'mix-edu-skills-training', nameKo: '직업 기술 훈련 캠프', emoji: '🔧', desc: '실무 현장 중심의 직업 훈련과 기능사 자격 취득 교육 캠프', prompt: 'vocational skills training workshop with trainees learning practical hands-on welding, electrical, or IT skills, professional certification program, career technical education' },
      { id: 'mix-edu-gifted', nameKo: '영재 & 특화 교육 프로그램', emoji: '🌟', desc: '수학·과학·예술 영재를 위한 특화 교육 프로그램과 멘토링', prompt: 'gifted education program with talented students engaged in advanced math or science project, mentoring by expert professors, specialized academy for exceptional students' },
      { id: 'mix-edu-ai-language', nameKo: 'AI 언어 학습 플랫폼', emoji: '🌐', desc: 'AI 튜터와 실시간 회화 연습을 제공하는 개인 맞춤형 언어 학습 앱', prompt: 'AI language learning app interface with conversational AI tutor, real-time pronunciation feedback, personalized lesson plan, gamified language acquisition, EdTech language platform' },
      { id: 'mix-edu-univ-startup', nameKo: '대학 창업 인큐베이터', emoji: '🏫', desc: '대학 내 창업 지원 센터에서 학생 스타트업이 성장하는 이노베이션 허브', prompt: 'university startup incubator space with student entrepreneurs working on prototypes, pitch practice area, faculty mentors, startup lab equipment, campus innovation center' }
    ],

    // ==================== 헬스케어 & 의료 ====================
    health: [
      { id: 'mix-health-precision', nameKo: '정밀 의료 & 유전자 치료', emoji: '🧬', desc: '개인 유전체 분석을 기반으로 한 맞춤형 정밀 의료', prompt: 'precision medicine concept, personalized genomic DNA sequencing data on screen, doctor analyzing genetic markers for targeted cancer treatment, advanced medical technology' },
      { id: 'mix-health-telemedicine', nameKo: '디지털 헬스 원격 진료', emoji: '📱', desc: '스마트폰으로 언제 어디서든 가능한 비대면 원격 의료 서비스', prompt: 'digital health telemedicine consultation, patient speaking with doctor on smartphone or tablet screen, home healthcare monitoring device, connected health ecosystem' },
      { id: 'mix-health-surgical-robot', nameKo: '수술 로봇 시스템', emoji: '🦾', desc: '정밀한 로봇 팔이 최소 침습 수술을 집도하는 수술실', prompt: 'advanced surgical robot system with multiple precise robotic arms performing minimally invasive surgery, surgeon controlling at console, hi-tech sterile operating room' },
      { id: 'mix-health-ai-diagnosis', nameKo: '의료 AI 영상 진단', emoji: '🧠', desc: 'AI가 CT·MRI 영상을 분석하여 병변을 자동 탐지', prompt: 'AI medical imaging diagnosis interface showing CT scan with highlighted tumor detection, machine learning analysis overlay, radiology AI assistant, hospital diagnostic workflow' },
      { id: 'mix-health-wearable', nameKo: '스마트 웨어러블 헬스', emoji: '⌚', desc: '심박·혈당·산소포화도를 실시간 모니터링하는 스마트 워치', prompt: 'smart health wearable device on wrist displaying real-time heart rate, blood oxygen, glucose monitoring data, connected to smartphone health app, personal wellness tracking' },
      { id: 'mix-health-drone', nameKo: '메디컬 드론 응급 구호', emoji: '🚁', desc: '도서·산간 지역에 약품과 제세동기를 배달하는 의료 드론', prompt: 'medical emergency delivery drone flying over rural mountainous terrain, dropping AED defibrillator or medicine supply pod, autonomous healthcare access innovation' },
      { id: 'mix-health-mental', nameKo: '정신건강 & 마인드풀니스', emoji: '🧘', desc: 'AI 심리 상담과 명상 앱이 결합된 정신건강 케어 서비스', prompt: 'mental health and mindfulness app interface on phone, calming visualization of meditation breathing exercise, AI mental health chatbot support, digital wellness platform' },
      { id: 'mix-health-care-robot', nameKo: '고령화 케어 & 돌봄 로봇', emoji: '🤖', desc: '노인 거동을 보조하고 말벗이 되어주는 사회적 돌봄 로봇', prompt: 'friendly eldercare robot companion assisting an elderly person at home, robotic nurse helper with gentle facial display, aging society care technology, warm healthcare scene' },
      { id: 'mix-health-precision', nameKo: '맞춤형 정밀 의료', emoji: '🎯', desc: '유전체·바이오마커 기반으로 환자 개인에 최적화된 정밀 의료 치료법', prompt: 'precision medicine concept showing personalized treatment plan based on genomic data, patient DNA profile, targeted therapy selection, individual biomarker analysis, oncology' },
      { id: 'mix-health-telemedicine', nameKo: '원격 화상 진료 시스템', emoji: '📱', desc: '스마트폰으로 의사와 실시간 화상 진료를 받는 비대면 의료 서비스', prompt: 'telemedicine video consultation on smartphone, doctor on screen discussing health with patient at home, digital stethoscope, remote healthcare app, virtual clinic appointment' },
      { id: 'mix-health-icu', nameKo: '중환자실 디지털 모니터링', emoji: '💓', desc: 'AI가 환자 활력 징후를 실시간 분석하는 스마트 ICU 중환자실', prompt: 'smart ICU monitoring system with AI analyzing patient vital signs in real-time, multiple display screens, bedside sensor array, intelligent intensive care unit technology' },
      { id: 'mix-health-rehab', nameKo: '재활 로봇 물리치료', emoji: '🦾', desc: '외골격 로봇 슈트로 마비 환자의 보행 재활을 지원하는 로봇 치료', prompt: 'rehabilitation robot exoskeleton suit assisting paralyzed patient in gait training, physical therapy robot, stroke recovery assisted walking, medical robotics rehabilitation center' },
      { id: 'mix-health-mental', nameKo: '디지털 멘탈헬스 솔루션', emoji: '🧘', desc: 'AI 챗봇 상담·마음 챙김 앱으로 정신 건강을 관리하는 디지털 헬스케어', prompt: 'digital mental health app with AI chatbot counseling, mindfulness meditation guide, mood tracking journal, stress management tools, mental wellness platform interface' },
      { id: 'mix-health-genomics', nameKo: '유전체 기반 암 조기 진단', emoji: '🔬', desc: '혈액 속 ctDNA로 암을 조기 발견하는 액체 생검 유전체 진단', prompt: 'liquid biopsy cancer early detection from blood sample, circulating tumor DNA analysis, genomic cancer screening, precision oncology lab with DNA sequencing, early diagnosis technology' },
      { id: 'mix-health-public-health', nameKo: '공중보건 역학 데이터 센터', emoji: '🦠', desc: '감염병 확산 패턴을 실시간 분석하는 공중보건 역학 감시 시스템', prompt: 'public health epidemiology data center with infectious disease spread map, outbreak monitoring dashboard, epidemiological surveillance system, health data analytics command center' },
      { id: 'mix-health-dental', nameKo: '디지털 치과 & 임플란트', emoji: '🦷', desc: '3D 스캔·가이드 수술·CAD/CAM 보철로 진행되는 디지털 치과 치료', prompt: 'digital dentistry with 3D intraoral scanner, guided implant surgery planning software, CAD-CAM ceramic crown milling machine, modern dental clinic, precise digital treatment' }
    ],

    // ==================== 모빌리티 & 물류 ====================
    mobility: [
      { id: 'mix-mob-autonomous', nameKo: '자율주행 레벨4 승용차', emoji: '🚗', desc: '라이다·카메라 센서로 완전 자율주행하는 전기차', prompt: 'level 4 autonomous electric vehicle driving on city road, active lidar sensor beams scanning environment, no driver, futuristic self-driving car technology' },
      { id: 'mix-mob-drone-delivery', nameKo: '전기 드론 화물 배송', emoji: '📦', desc: '도심 상공을 날아 현관 앞에 택배를 내려놓는 배송 드론', prompt: 'electric delivery drone hovering above residential street, releasing package to doorstep, urban air delivery system, last-mile logistics innovation, city skyline background' },
      { id: 'mix-mob-hyperloop', nameKo: '초고속 하이퍼루프 철도', emoji: '🚄', desc: '진공 튜브 안을 시속 1000km로 달리는 미래 교통 시스템', prompt: 'futuristic hyperloop tube transport pod station, passengers boarding capsule in vacuum tube tunnel, ultra-high-speed ground transportation concept' },
      { id: 'mix-mob-smartport', nameKo: '스마트 항만 자동화 물류', emoji: '⚓', desc: '자율 크레인과 AGV가 컨테이너를 처리하는 스마트 항만', prompt: 'smart automated port terminal with giant autonomous ship-to-shore cranes, self-driving AGV container transport vehicles, no human operators, digital port management system' },
      { id: 'mix-mob-hydrogen-ship', nameKo: '친환경 수소 화물선', emoji: '🚢', desc: '수소 연료전지로 추진되는 제로카본 화물선', prompt: 'hydrogen fuel cell powered cargo ship sailing on open ocean, zero emission vessel with clean white hull, green maritime shipping future, renewable energy propulsion' },
      { id: 'mix-mob-uam', nameKo: 'UAM 에어택시 & 버티포트', emoji: '✈️', desc: '도심 상공을 날아다니는 전기 에어택시와 버티포트 허브', prompt: 'urban air mobility eVTOL air taxi landing at a vertiport on a city rooftop, multiple aerial vehicles in the sky, future urban transportation infrastructure' },
      { id: 'mix-mob-micromobility', nameKo: '마이크로 모빌리티 & 공유', emoji: '🛴', desc: '공유 킥보드·자전거가 일상화된 친환경 도심 이동 수단', prompt: 'people using shared electric scooters and bikes in a modern city street, docking stations, bike lanes, green urban commuting lifestyle, smart mobility ecosystem' },
      { id: 'mix-mob-ai-logistics', nameKo: 'AI 물류 최적화 시스템', emoji: '🗺️', desc: 'AI가 실시간으로 최적 배송 경로를 계산하는 물류 플랫폼', prompt: 'AI logistics route optimization platform dashboard showing real-time delivery fleet tracking, optimal path algorithms, warehouse robot coordination, supply chain visibility' },
      { id: 'mix-mob-evtol', nameKo: '도심 항공 모빌리티 eVTOL', emoji: '🚁', desc: '도심 빌딩 옥상 UAM 버티포트를 이착륙하는 전기 수직 이착륙 항공기', prompt: 'electric VTOL air taxi taking off from urban building rooftop vertiport, urban air mobility UAM vehicle, futuristic city sky transport, quiet electric propulsion rotors' },
      { id: 'mix-mob-autonomous-truck', nameKo: '자율주행 장거리 화물 트럭', emoji: '🚛', desc: '운전자 없이 고속도로를 달리는 레벨4 자율주행 대형 화물 트럭', prompt: 'autonomous self-driving long-haul freight truck on highway, no driver cab, sensor array lidar radar cameras, convoy platooning, level 4 autonomous freight transportation' },
      { id: 'mix-mob-hyperloop', nameKo: '하이퍼루프 진공 튜브 열차', emoji: '🚄', desc: '진공 튜브 안을 시속 1000km로 이동하는 하이퍼루프 캡슐 열차', prompt: 'hyperloop pod capsule speeding through vacuum tube at 1000 km/h, futuristic high-speed transport system, maglev levitation technology, hyperloop terminal station' },
      { id: 'mix-mob-smart-port', nameKo: '스마트 자동화 항만', emoji: '⚓', desc: '무인 크레인·AGV·항만 관제 AI가 결합된 완전 자동화 스마트 항만', prompt: 'fully automated smart port with autonomous container cranes, AGV transport vehicles, port management AI control center, drone surveillance, unmanned harbor logistics operations' },
      { id: 'mix-mob-bike-share', nameKo: '친환경 공유 모빌리티', emoji: '🛴', desc: '전동 킥보드·공유 자전거가 결합된 퍼스트·라스트 마일 공유 모빌리티', prompt: 'shared micro-mobility station with electric scooters and bicycles, QR code dock-less rental, green urban transport, first and last mile solution, sustainable city commuting' },
      { id: 'mix-mob-supply-chain', nameKo: '공급망 실시간 가시성', emoji: '📡', desc: 'IoT·블록체인으로 원자재부터 배송까지 추적하는 공급망 가시성 플랫폼', prompt: 'supply chain visibility platform showing real-time tracking of goods from factory to customer, blockchain provenance record, IoT sensor telemetry, end-to-end logistics dashboard' },
      { id: 'mix-mob-last-mile', nameKo: '라스트마일 드론 배송', emoji: '📦', desc: '가정까지 직접 배달하는 무인 드론 라스트마일 배송 서비스', prompt: 'delivery drone hovering at residential doorstep, autonomous last-mile package delivery, unmanned aerial vehicle dropping parcel, suburban neighborhood, automated logistics drone' },
      { id: 'mix-mob-mobility-hub', nameKo: '복합 모빌리티 환승 허브', emoji: '🏢', desc: '기차·버스·지하철·공유 모빌리티가 통합된 복합 환승 거점 허브', prompt: 'integrated mobility hub with train metro bus and micro-mobility all converging, multimodal transport interchange, smart transit terminal, seamless passenger connection experience' }
    ],

    // ==================== 해양 & 수산 ====================
    ocean: [
      { id: 'mix-ocean-rov', nameKo: '수중 ROV 해양 탐사', emoji: '🤿', desc: '심해 탐사에 투입된 원격 조종 무인 잠수정', prompt: 'underwater remotely operated vehicle exploring dark deep sea floor, illuminating hydrothermal vent with thrusters, underwater robotics ocean research expedition' },
      { id: 'mix-ocean-aqua', nameKo: '스마트 양식 IoT 관리', emoji: '🐟', desc: 'IoT 센서로 수온·용존산소·먹이를 자동 제어하는 스마트 양식장', prompt: 'smart aquaculture farm with IoT sensor buoys monitoring water temperature and oxygen, automated feeding system, healthy fish in net pens, sustainable fishery technology' },
      { id: 'mix-ocean-biomarine', nameKo: '해양 바이오 원료 추출', emoji: '🧪', desc: '해조류·플랑크톤에서 고부가가치 바이오 소재를 추출하는 공정', prompt: 'marine biotechnology laboratory extracting bioactive compounds from seaweed and marine microalgae, photobioreactor cultures, ocean-derived biomaterial production' },
      { id: 'mix-ocean-deepsea', nameKo: '심해 광물 채취 탐사', emoji: '⛏️', desc: '망간 단괴·해저 열수 광상 등 심해 광물 채굴 탐사선', prompt: 'deep sea mining vessel deploying underwater collector system to gather manganese nodules from seafloor, ocean mineral resource extraction technology' },
      { id: 'mix-ocean-energy', nameKo: '해상 풍력 & 조류 발전', emoji: '🌊', desc: '조류와 파력을 동시에 활용하는 복합 해양 에너지 플랫폼', prompt: 'offshore renewable energy platform combining wind turbines, tidal stream turbines, and wave energy converters, ocean clean energy complex on open sea' },
      { id: 'mix-ocean-cleanup', nameKo: '해양 플라스틱 정화 로봇', emoji: '♻️', desc: '자율 운항으로 해양 쓰레기를 수거하는 청소 드론 선박', prompt: 'autonomous ocean cleaning vessel collecting plastic waste from sea surface, boom system gathering marine debris, environmental ocean robot, zero pollution future' },
      { id: 'mix-ocean-processing', nameKo: '수산 가공 자동화 라인', emoji: '🏭', desc: '로봇 팔이 신선 수산물을 분류·가공·포장하는 자동화 공정', prompt: 'automated fish processing factory line with robotic arms sorting and filleting fresh seafood, quality inspection cameras, hygienic stainless steel processing facility' },
      { id: 'mix-ocean-weather', nameKo: '해양 기상 예측 시스템', emoji: '🌀', desc: '부이 관측소와 위성이 연동된 고정밀 해양 기상 예보 시스템', prompt: 'ocean weather monitoring system with buoy sensor network, satellite data feeds, typhoon prediction model on control center screen, maritime meteorological platform' },
      { id: 'mix-ocean-rov', nameKo: '심해 탐사 수중 로봇 ROV', emoji: '🤿', desc: '수천m 심해를 탐사하는 원격 조종 수중 로봇(ROV)의 해저 조사', prompt: 'deep sea ROV remotely operated vehicle exploring ocean floor at thousands of meters depth, searchlight illuminating hydrothermal vent or shipwreck, underwater robotics research' },
      { id: 'mix-ocean-offshore', nameKo: '해양 플랜트 부유식 설비', emoji: '⛽', desc: '심해 해저 자원을 생산하는 FPSO 부유식 생산·저장·하역 설비', prompt: 'FPSO floating production storage offloading vessel on open ocean, oil and gas platform, subsea wellhead connection, offshore petroleum production facility, marine engineering' },
      { id: 'mix-ocean-tourism', nameKo: '해양 생태 관광 마린 레저', emoji: '🐬', desc: '스쿠버 다이빙·해양 생태 관광·요트 레저가 어우러진 해양 관광', prompt: 'marine ecotourism with scuba divers exploring coral reef, dolphin watching boat tour, sailing yacht in turquoise water, coastal leisure resort, ocean recreation tourism' },
      { id: 'mix-ocean-seaweed', nameKo: '해조류 바이오 에너지', emoji: '🌿', desc: '대규모 해조류 양식으로 바이오연료·식품·소재를 생산하는 해양 바이오', prompt: 'large-scale seaweed mariculture farm with kelp forest cultivation, blue carbon sequestration, algae biofuel production, marine biomass sustainable resource, ocean farming' },
      { id: 'mix-ocean-microplastic', nameKo: '해양 미세 플라스틱 정화', emoji: '🧹', desc: '해양 플라스틱 폐기물을 수거·분해하는 혁신적 해양 정화 기술', prompt: 'ocean plastic cleanup technology with autonomous collection vessel, microplastic filtration system, underwater cleanup robot, ocean decontamination project, marine pollution removal' },
      { id: 'mix-ocean-coral', nameKo: '산호초 복원 생태 프로젝트', emoji: '🪸', desc: '기후 변화로 손상된 산호초를 복원하는 해양 생태 복원 사업', prompt: 'coral reef restoration project with marine biologists planting coral fragments on underwater nursery frame, vibrant coral regeneration, tropical reef ecosystem recovery' },
      { id: 'mix-ocean-tidal-energy', nameKo: '조석 파력 에너지 발전', emoji: '🌊', desc: '파도와 조석 에너지를 전기로 변환하는 해양 재생에너지 발전 시설', prompt: 'wave energy and tidal power generation facility on coastline, oscillating water column wave converter, tidal barrage, ocean renewable energy extraction, marine power plant' },
      { id: 'mix-ocean-data-cable', nameKo: '해저 광케이블 인프라', emoji: '🌐', desc: '대륙 간 인터넷을 연결하는 초고속 해저 광섬유 케이블 네트워크', prompt: 'subsea optical fiber cable laying ship deploying undersea internet cable, trans-ocean data network infrastructure, cable cross-section showing fiber bundles, global connectivity' }
    ],

    // ==================== 신소재 & 화학 ====================
    materials: [
      { id: 'mix-mat-carbon-fiber', nameKo: '탄소섬유 복합 소재', emoji: '✈️', desc: '경량·고강도의 탄소섬유 강화 플라스틱 적층 구조', prompt: 'ultra-lightweight carbon fiber reinforced composite material layered structure, woven carbon fiber weave pattern, aerospace and automotive high-performance material close-up' },
      { id: 'mix-mat-graphene', nameKo: '그래핀 나노소재', emoji: '⚛️', desc: '원자 한 층 두께의 2D 탄소 그물망 그래핀 구조', prompt: 'atomic-scale visualization of graphene single-layer carbon hexagonal lattice, glowing honeycomb nanostructure, 2D material science concept, electron microscopy style' },
      { id: 'mix-mat-superconductor', nameKo: '고온 초전도 세라믹', emoji: '🔮', desc: '마이스너 효과로 자기부상하는 고온 초전도체', prompt: 'high-temperature superconductor ceramic floating above a magnet due to Meissner effect, liquid nitrogen vapor, glowing magnetic field lines, physics experiment' },
      { id: 'mix-mat-bioplastic', nameKo: '바이오 플라스틱 순환소재', emoji: '🌿', desc: '옥수수·사탕수수 원료의 생분해성 바이오 플라스틱 생산 공정', prompt: 'bioplastic manufacturing process, corn starch and sugarcane raw materials being converted to biodegradable plastic pellets, circular economy sustainable material production' },
      { id: 'mix-mat-shape-memory', nameKo: '형상기억합금', emoji: '🔧', desc: '열을 가하면 원래 형태로 돌아오는 니티놀 형상기억 금속', prompt: 'shape memory alloy nitinol wire demonstration, metal coiling and uncoiling as temperature changes, smart material actuation, biomedical and robotics application concept' },
      { id: 'mix-mat-aerogel', nameKo: '에어로젤 초단열 소재', emoji: '💨', desc: '세계에서 가장 가벼운 고성능 단열재 에어로젤 블록', prompt: 'aerogel superinsulator material block held in hand, translucent blue glass-like extremely lightweight structure, near-zero density insulation, advanced material science' },
      { id: 'mix-mat-semiconductor', nameKo: '반도체 웨이퍼 & 포토공정', emoji: '💿', desc: '극자외선(EUV) 노광 장비로 회로를 새기는 반도체 웨이퍼', prompt: 'semiconductor silicon wafer under extreme ultraviolet EUV lithography machine, clean room environment, yellow safe light, precision nanoscale circuit patterning process' },
      { id: 'mix-mat-metamaterial', nameKo: '음향 & 광학 메타물질', emoji: '🌈', desc: '빛이나 음파를 구부리는 인공 구조 메타물질', prompt: 'engineered metamaterial structure bending light and sound waves in unusual ways, periodic nanoscale array pattern, invisible cloaking material concept, photonics research' },
      { id: 'mix-mat-graphene', nameKo: '그래핀 나노 소재 응용', emoji: '⚡', desc: '단원자층 탄소 구조 그래핀의 전자·에너지 분야 응용 나노 소재', prompt: 'graphene nanotechnology material with single atom thick carbon lattice structure, electron microscope visualization, graphene-based electronics application, wonder material research' },
      { id: 'mix-mat-aerogel', nameKo: '초경량 에어로겔 단열재', emoji: '❄️', desc: '공기의 99%인 초경량 나노다공성 에어로겔 고성능 단열 소재', prompt: 'aerogel ultra-lightweight thermal insulation material, nanoporous structure visualization, hand holding translucent silica aerogel block, extreme insulation properties demonstration' },
      { id: 'mix-mat-smart-textile', nameKo: '전도성 스마트 섬유 소재', emoji: '🧵', desc: '전기 전도성·센서·발열 기능이 통합된 미래형 스마트 텍스타일', prompt: 'e-textile smart fabric with conductive thread woven into garment, LED illumination, biometric sensor patches, heated clothing technology, electronic wearable textile' },
      { id: 'mix-mat-ceramic', nameKo: '첨단 세라믹 & 내열 소재', emoji: '🔥', desc: '극한 온도와 압력에 견디는 첨단 구조 세라믹 내열 소재', prompt: 'advanced structural ceramic material for extreme heat resistance, silicon carbide tiles, aerospace thermal protection system, high temperature refractory ceramic microstructure' },
      { id: 'mix-mat-bio-plastic', nameKo: '바이오 플라스틱 대체 소재', emoji: '🌱', desc: '옥수수·해조류 등 생물 자원에서 만든 생분해성 바이오 플라스틱', prompt: 'biodegradable bioplastic packaging made from corn starch or seaweed, decomposing in soil, sustainable alternative to petroleum plastic, eco-friendly material lifecycle' },
      { id: 'mix-mat-self-healing', nameKo: '자가 치유 코팅 소재', emoji: '🛡️', desc: '스크래치가 생기면 스스로 복원되는 자가 치유 나노 코팅 소재', prompt: 'self-healing coating material demonstration showing scratch on surface healing itself, polymer network repair mechanism, autonomous material restoration, smart coating technology' },
      { id: 'mix-mat-nanocomposite', nameKo: '나노 복합 구조 강화재', emoji: '🏗️', desc: '탄소나노튜브·나노입자를 분산시킨 초강도 나노복합 구조 소재', prompt: 'nanocomposite reinforced material with carbon nanotubes dispersed in polymer matrix, transmission electron microscopy visualization, super-strength lightweight structural material' },
      { id: 'mix-mat-superconductor', nameKo: '고온 초전도 소재 응용', emoji: '🧲', desc: '자기부상·에너지 무손실 전송에 활용되는 고온 초전도 소재', prompt: 'high temperature superconductor demonstration with liquid nitrogen cooling, Meissner effect magnetic levitation floating magnet, zero resistance superconducting wire application' }
    ],

    // ==================== 창작 & 미디어 ====================
    creative: [
      { id: 'mix-creative-ott', nameKo: 'OTT 드라마 세트 프로덕션', emoji: '🎬', desc: '대규모 촬영 세트와 크레인 카메라가 동원된 드라마 제작 현장', prompt: 'large-scale film and TV drama production set with crane camera, professional lighting rigs, director and crew at work, elaborate period or sci-fi set design' },
      { id: 'mix-creative-ai-music', nameKo: 'AI 생성 음악 & 사운드', emoji: '🎵', desc: 'AI 작곡 엔진이 만들어내는 파형과 음악 생성 인터페이스', prompt: 'AI music generation interface showing waveform visualization, neural network composing melody on piano roll, generative audio technology, digital music creation studio' },
      { id: 'mix-creative-gamedev', nameKo: '게임 개발 스튜디오', emoji: '🎮', desc: '3D 캐릭터 모델링과 엔진 개발이 진행 중인 게임 개발사', prompt: 'game development studio with artists working on 3D character modeling screens, motion capture suit on mannequin, Unreal Engine viewport, creative game dev workspace' },
      { id: 'mix-creative-webtoon', nameKo: '웹툰 & 디지털 만화 창작', emoji: '✏️', desc: '태블릿과 펜으로 웹툰을 그리는 크리에이터의 작업 환경', prompt: 'webtoon artist workspace with large graphic tablet and digital pen, colorful manga panels on dual monitors, character sketches pinned on board, creative digital illustration studio' },
      { id: 'mix-creative-xr', nameKo: 'VR/AR 실감 콘텐츠 제작', emoji: '🕶️', desc: '몰입형 VR/AR 경험 콘텐츠를 개발하는 XR 스튜디오', prompt: 'XR studio developing immersive VR and AR content, developers testing headsets, mixed reality scene creation tools, volumetric capture stage, immersive media production' },
      { id: 'mix-creative-mediaart', nameKo: '미디어 아트 인터랙티브', emoji: '💡', desc: '관람객의 움직임에 반응하는 대형 인터랙티브 미디어 아트', prompt: 'large interactive media art installation in dark gallery, visitors triggering motion-reactive visual effects on giant display walls, immersive digital art experience' },
      { id: 'mix-creative-youtuber', nameKo: '유튜브 & 숏폼 크리에이터', emoji: '📹', desc: '조명·카메라·배경 세트를 갖춘 유튜브 크리에이터 홈 스튜디오', prompt: 'professional home YouTube studio setup with ring light, multiple cameras, green screen, acoustic panels, creator recording engaging video content, content creation workspace' },
      { id: 'mix-creative-podcast', nameKo: '팟캐스트 & 오디오 콘텐츠', emoji: '🎙️', desc: '방음 스튜디오에서 진행되는 전문 팟캐스트 녹음 세션', prompt: 'professional podcast recording studio with high-end condenser microphones, soundproof acoustic foam walls, mixing board, two hosts engaged in conversation, audio content creation' },
      { id: 'mix-creative-ai-art', nameKo: '생성 AI 아트 크리에이션', emoji: '🤖', desc: 'AI 생성형 아트 툴로 만들어지는 독창적 디지털 아트 크리에이티브', prompt: 'generative AI art creation process with neural network visualizing abstract digital artwork, human artist collaborating with AI tool, creative technology intersection, digital art studio' },
      { id: 'mix-creative-vfx', nameKo: 'VFX & 시각 특수효과 스튜디오', emoji: '🎬', desc: '할리우드급 VFX 파이프라인으로 영화·광고의 특수 효과를 제작하는 스튜디오', prompt: 'VFX visual effects studio with artists working on large monitors, compositing software, 3D rendering farm, special effects work on movie scene, Hollywood production pipeline' },
      { id: 'mix-creative-virtual-prod', nameKo: '버추얼 프로덕션 LED 월', emoji: '📺', desc: '거대한 LED 월 앞에서 실시간 배경 합성으로 촬영하는 버추얼 프로덕션', prompt: 'virtual production studio with giant curved LED wall displaying photorealistic background, actor performing in front of real-time CGI environment, in-camera VFX production technology' },
      { id: 'mix-creative-fashion', nameKo: '패션 디자인 텍스타일', emoji: '👗', desc: '첨단 디지털 패브리케이션으로 구현되는 하이엔드 패션 디자인 과정', prompt: 'fashion design studio with haute couture garment creation, digital pattern making on screen, fabric material swatches, sewing atelier, luxury fashion house design process' },
      { id: 'mix-creative-brand-film', nameKo: '브랜드 필름 광고 제작', emoji: '🎥', desc: '감성적인 브랜드 스토리를 담은 광고 필름 촬영 현장', prompt: 'brand film commercial production set with director behind camera, actors in brand-colored wardrobe, cinematic lighting setup, advertising film shoot, storytelling video campaign' },
      { id: 'mix-creative-3d-print-art', nameKo: '3D 프린팅 조형 예술', emoji: '🖨️', desc: '3D 프린터로 만든 복잡한 기하학적 조형물과 예술 작품', prompt: '3D printed sculptural artwork with complex geometric lattice structure, colorful resin print, additive manufacturing art, intricate impossible shapes, modern digital sculpture' },
      { id: 'mix-creative-sound-design', nameKo: '사운드 디자인 오디오 비주얼', emoji: '🎵', desc: '음악과 시각이 결합된 오디오 반응형 비주얼 아트 퍼포먼스', prompt: 'sound design audio-visual performance with music-reactive particle visualization, spectrum analyzer waveforms, DJ and VJ collaboration, immersive live audio visual show' },
      { id: 'mix-creative-interactive', nameKo: '인터랙티브 미디어 아트 설치', emoji: '🎪', desc: '관람객의 움직임에 반응하는 인터랙티브 디지털 미디어 아트 설치 작품', prompt: 'interactive media art installation responding to audience movement, motion tracking, particle system reacting to touch, immersive art experience, digital interactive exhibition' }
    ],

    // ==================== 환경 & 기후 ====================
    environment: [
      { id: 'mix-env-carbon-neutral', nameKo: '탄소중립 2050 로드맵', emoji: '🌍', desc: '2050 탄소중립 달성을 위한 부문별 전환 전략 시각화', prompt: 'carbon neutrality 2050 roadmap infographic concept, emission reduction pathway by sector, renewable energy transition timeline, green hydrogen and CCUS technologies' },
      { id: 'mix-env-dac', nameKo: '대기 탄소 직접 포집 (DAC)', emoji: '🌬️', desc: '공기 중 CO2를 직접 빨아들여 지하에 저장하는 DAC 설비', prompt: 'direct air capture facility with large CO2 capturing fan modules in open landscape, carbon dioxide removal technology, industrial scale negative emission facility' },
      { id: 'mix-env-heat-island', nameKo: '도시 열섬화 저감 기술', emoji: '🌡️', desc: '쿨루프·그린인프라·도심 숲으로 열섬을 완화하는 스마트 도시 전략', prompt: 'urban heat island mitigation, white reflective cool roof buildings, abundant urban tree canopy, bioswale green corridors, city thermal map showing temperature reduction' },
      { id: 'mix-env-biodiversity', nameKo: '생물다양성 & 산림 복원', emoji: '🌳', desc: '훼손된 생태계를 복원하는 대규모 식생 복원 사업', prompt: 'ecosystem restoration reforestation project, volunteers planting native tree saplings in degraded land, drone aerial seeding, biodiversity recovery, green landscape regeneration' },
      { id: 'mix-env-circular', nameKo: '순환경제 업사이클링', emoji: '♻️', desc: '폐기물을 새로운 자원으로 되살리는 순환경제 제조 공정', prompt: 'circular economy upcycling factory, waste materials being transformed into new products, recycled material flow diagram, zero waste manufacturing process, green economy' },
      { id: 'mix-env-climate-data', nameKo: '기후 리스크 데이터 분석', emoji: '📊', desc: '기후 시나리오별 위험 지수를 시각화하는 분석 플랫폼', prompt: 'climate risk data analytics platform, global temperature anomaly maps, flood risk assessment dashboard, AI climate scenario modeling visualization, environmental data science' },
      { id: 'mix-env-zerowaste', nameKo: '제로웨이스트 라이프스타일', emoji: '🛒', desc: '포장 없는 쇼핑·텀블러·다회용기로 구성된 제로웨이스트 생활', prompt: 'zero waste lifestyle flat lay with reusable tote bag, glass jars, bamboo toothbrush, beeswax wrap, bulk grocery shopping, plastic-free sustainable living aesthetic' },
      { id: 'mix-env-green-city', nameKo: '녹색건축 & 생태 도시', emoji: '🌱', desc: '건물 외벽 녹화·우수 재활용·탄소 저감이 통합된 생태 도시', prompt: 'eco city with green building facades covered in vertical gardens, rooftop solar panels, rainwater collection pools, bicycle paths, sustainable urban planning masterpiece' },
      { id: 'mix-env-solar-farm', nameKo: '대규모 태양광 발전 단지', emoji: '☀️', desc: '사막·평지에 펼쳐진 대형 태양광 패널 발전소 단지', prompt: 'massive utility-scale solar farm with endless rows of photovoltaic panels across flat desert landscape, aerial view, clean renewable energy infrastructure, blue panel array' },
      { id: 'mix-env-hydrogen', nameKo: '수소 경제 연료전지 생태계', emoji: '⚗️', desc: '그린 수소 생산·저장·운반·활용의 수소 경제 가치사슬 시각화', prompt: 'hydrogen economy ecosystem with green hydrogen electrolyzer, hydrogen fuel cell vehicle refueling, hydrogen storage tanks, fuel cell power plant, H2 value chain visualization' },
      { id: 'mix-env-waste-material', nameKo: '폐기물 자원화 소재 재생', emoji: '♻️', desc: '각종 폐기물에서 새로운 산업용 원료와 소재를 추출·재생하는 공정', prompt: 'waste-to-material recycling facility transforming industrial and municipal waste into new raw materials, chemical recycling process, material recovery from waste, circular economy' },
      { id: 'mix-env-air-quality', nameKo: '스마트 대기질 모니터링', emoji: '🌫️', desc: 'IoT 센서망과 AI로 도심 대기 오염을 실시간 분석하는 스마트 환경 관제', prompt: 'smart air quality monitoring network with IoT sensor nodes on city streets, real-time pollution heatmap dashboard, PM2.5 measurement, urban environmental surveillance system' },
      { id: 'mix-env-ocean-cleanup', nameKo: '해양 쓰레기 대청소 시스템', emoji: '🌊', desc: '해양 플라스틱을 대규모로 수거하는 자율 해양 정화 선박 시스템', prompt: 'autonomous ocean plastic cleanup system with barrier collection boom and collection vessel, great pacific garbage patch cleanup, marine waste removal technology, ocean conservation' },
      { id: 'mix-env-nature-based', nameKo: '자연 기반 해법 (NbS)', emoji: '🌳', desc: '기후 위기 적응을 위해 자연 생태계를 복원·활용하는 자연 기반 해법', prompt: 'nature-based solutions NbS for climate adaptation, mangrove restoration, wetland conservation, urban forest planting, natural flood management, ecosystem-based climate resilience' },
      { id: 'mix-env-drought', nameKo: '물 부족 가뭄 대응 기술', emoji: '💧', desc: '해수담수화·재사용수·스마트 관개로 물 부족에 대응하는 수자원 기술', prompt: 'water scarcity solutions including seawater desalination plant, water recycling treatment facility, smart drip irrigation precision agriculture, water resource management technology' },
      { id: 'mix-env-blue-carbon', nameKo: '블루카본 맹그로브 갯벌', emoji: '🐚', desc: '맹그로브 숲และ 해양 갯벌이 탄소를 저장하는 블루카본 생태계', prompt: 'blue carbon ecosystem with dense mangrove forest roots in coastal water, tidal wetland, seagrass meadow, carbon sequestration by coastal marine habitat, climate solution' }
    ],

    // ==================== 기술사업화 ====================
    tech_transfer: [
      {
        id: 'mix-tech-rec-transfer',
        nameKo: '이차전지 재활용 기술사업화',
        emoji: '♻️',
        desc: '폐배터리에서 고순도 리튬·코발트·니켈을 회수하는 기술의 상용화 계약.',
        prompt: 'battery recycling technology commercialization process, recovering high-purity lithium, cobalt, and nickel from spent electric vehicle batteries, high-tech chemical reaction vessels, robotic handling, green energy transition concept'
      },
      {
        id: 'mix-tech-solid-startup',
        nameKo: '전고체 배터리 벤처 투자',
        emoji: '⚡',
        desc: '스타트업과 대기업 간의 전고체 핵심 소재 공동 개발 및 투자 유치 협약.',
        prompt: 'solid-state battery technology commercialization startup signing ceremony, interactive blueprint displays of crystalline solid electrolytes on a digital table, corporate partnership and venture investment concept, sleek modern laboratory backdrop'
      },
      {
        id: 'mix-tech-dry-process',
        nameKo: '건식 전극 공정 기술 라이선싱',
        emoji: '🏭',
        desc: '유기 용매 없이 전극을 코팅하여 비용을 절감하는 건식 공정 장비 양산.',
        prompt: 'dry electrode manufacturing equipment commercialization for secondary batteries, roll-to-roll active materials coating without organic solvents, high-speed industrial machinery, cleanroom automation, massive battery production scale'
      },
      {
        id: 'mix-tech-sodium-mass',
        nameKo: '나트륨 이온 배터리 양산 계약',
        emoji: '🧂',
        desc: '리튬을 대체하여 원가 경쟁력을 확보한 소듐 이온 셀의 대량 생산 사업화.',
        prompt: 'commercialization of sodium-ion battery cells, mass production assembly line with shimmering yellow-golden sodium ions flowing, cost-effective alternative energy technology, modern battery factory layout'
      },
      {
        id: 'mix-tech-lisulfur-uam',
        nameKo: '리튬황 배터리 항공 실증 사업',
        emoji: '🛸',
        desc: '고에너지 밀도 리튬황 전지를 도심항공교통(UAM) 기체에 탑재하여 진행하는 실증 프로젝트.',
        prompt: 'lithium-sulfur battery pack integrated into an advanced electric urban air mobility (UAM) drone, outdoor airfield, commercialization flight test, light-weight sulfur cathode pouch cells visible on side panel, sunset glow'
      }
    ],

    // ==================== 인력양성 ====================
    talent_cultivation: [
      {
        id: 'mix-talent-meister',
        nameKo: '이차전지 생산 전문직 양성',
        emoji: '🎓',
        desc: '스마트 팩토리 실습실에서 배터리 셀 조립 실무를 교육받는 마이스터 과정.',
        prompt: 'secondary battery vocational training class, students in cleanroom suits assembling pouch-type battery cells, high-tech hands-on equipment, technical academy classroom with digital instructional screens'
      },
      {
        id: 'mix-talent-phd-rd',
        nameKo: '배터리 석박사 융합 교육',
        emoji: '🔬',
        desc: '분자 설계 및 양극재 분석 기기 실습을 하는 대학원 전문 연구인력 양성 프로그램.',
        prompt: 'graduate students analyzing advanced cathode crystal structures on high-resolution scanning electron microscopes (SEM), molecular modeling displays on dual monitors, battery research laboratory, collaborative academic research'
      },
      {
        id: 'mix-talent-dismantle-safety',
        nameKo: '폐배터리 안전 해체 교육',
        emoji: '🥽',
        desc: '전기차 폐배터리 팩을 무방전 안전 상태로 해체하는 실무 엔지니어 양성 교육.',
        prompt: 'professional safety training for electric vehicle battery pack dismantling, engineers in insulated protective gear and safety glasses using non-conductive tools on a high-voltage EV battery tray, industrial classroom setup'
      },
      {
        id: 'mix-talent-bms-ai',
        nameKo: '배터리 AI 진단 개발자 교육',
        emoji: '💻',
        desc: '배터리 수명 및 BMS 안전성 진단을 위한 딥러닝 기반 소프트웨어 엔지니어 양성 과정.',
        prompt: 'programming training for Battery Management System (BMS) diagnostics, students writing Python code to analyze battery aging degradation curves on laptop screens, neural network flowcharts on whiteboard'
      },
      {
        id: 'mix-talent-sem-workshop',
        nameKo: '차세대 배터리 산학 워크숍',
        emoji: '🤝',
        desc: '대학의 원천 기술 연구와 기업 실무가 결합된 정기 세미나 및 실무형 인재 매칭.',
        prompt: 'dynamic university-industry battery research workshop, interactive presentation slides showing next-generation anode materials, active discussion between professors, students, and corporate experts in a modern seminar hall'
      }
    ]
  };

  // 2. 표현 화풍 (Medium) 데이터 및 카테고리 (6대 카테고리 × 8종 = 48종)
  const MEDIUM_CATEGORIES = [
    { id: 'tech3d', label: '🧊 3D & 테크니컬' },
    { id: 'analog', label: '🎨 아날로그 & 회화' },
    { id: 'graphic', label: '◼️ 그래픽 & 디자인' },
    { id: 'anime', label: '🎬 만화 & 애니메이션' },
    { id: 'youtube_anim', label: '📹 유튜브 & 설명영상' },
    { id: 'photo', label: '📷 사진 & 실사' },
    { id: 'craft', label: '🧶 핸드메이드 & 실물 공예' },
    { id: 'official', label: '📋 공공 & 보고서' },
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
    { id: 'med-neon-glow', category: 'tech3d', nameKo: '네온 글로우 사이버 3D', emoji: '🌟', desc: '어둠 속에서 빛나는 네온 글로우 사이버 3D 오브젝트', prefix: 'neon glow cyberpunk 3D object rendering of', suffix: 'dark background, vivid neon glow emission, cyberpunk aesthetic, volumetric light bloom, luminescent surface material, futuristic dark atmosphere' },
    { id: 'med-product-3d', category: 'tech3d', nameKo: '제품 스튜디오 3D 렌더', emoji: '📦', desc: '완벽한 리플렉션과 소프트 섀도의 제품 3D 스튜디오 렌더링', prefix: 'professional 3D product studio rendering of', suffix: 'perfect studio 3D product render, infinity curve white or dark background, soft box lighting, reflection on surface, product photography quality CGI' },
    { id: 'med-technical-explode', category: 'tech3d', nameKo: '기계 파트 익스플로디드 뷰', emoji: '🔩', desc: '부품이 분해·비행하는 엔지니어링 익스플로디드 뷰 렌더링', prefix: 'technical exploded view 3D render of', suffix: 'engineering exploded view 3D render, parts floating apart in precise order, technical annotation labels, clean white background, technical illustration quality' },
    { id: 'med-crystal-3d', category: 'tech3d', nameKo: '수정 & 젤리 3D 렌더', emoji: '💎', desc: '투명하고 굴절이 빛나는 크리스탈·젤리 소재 3D 렌더링', prefix: 'crystal and jelly transparent 3D object of', suffix: 'crystal transparent material with rainbow light refraction caustics, jelly soft body 3D, subsurface scattering, glossy surface, clean bright studio' },
    { id: 'med-chrome-3d', category: 'tech3d', nameKo: '크롬 메탈 반사 3D', emoji: '🪞', desc: '환경을 완벽히 반사하는 크롬 구체와 메탈 오브젝트', prefix: 'chrome metallic reflective 3D object of', suffix: 'highly polished chrome ball or surface, perfect mirror environment reflection, ray traced metal material, chrome sphere 3D render, photorealistic metallic' },
    { id: 'med-bubble-3d', category: 'tech3d', nameKo: '3D 버블 구체 클러스터', emoji: '🫧', desc: '다양한 크기의 반투명 구체들이 떠오르는 버블 3D 렌더링', prefix: 'floating bubble cluster 3D render of', suffix: 'translucent soap bubble spheres cluster, iridescent surface sheen, physics simulation bubbles, pastel or vivid refracted light colors, clean white background' },
    { id: 'med-wireframe-3d', category: 'tech3d', nameKo: '3D 와이어프레임 메시', emoji: '🕸️', desc: '폴리곤 메시와 엣지 라인이 드러나는 와이어프레임 3D 시각화', prefix: 'wireframe polygon mesh 3D visualization of', suffix: '3D wireframe mesh structure, glowing edge lines on dark background, polygon topology visible, geometric grid lines, technical 3D modeling visualization' },
    { id: 'med-particle-3d', category: 'tech3d', nameKo: '3D 파티클 시스템', emoji: '✨', desc: '수만 개 파티클이 형상을 이루는 3D 파티클 이펙트', prefix: '3D particle system forming', suffix: 'thousands of glowing particles forming shape, particle simulation, volumetric depth, dynamic motion trails, dark atmospheric background, cinematic 3D effect' },

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
    { id: 'med-charcoal', category: 'analog', nameKo: '목탄화 & 콩테 소묘', emoji: '⬛', desc: '목탄·콩테로 표현한 드라마틱한 명암 소묘화', prefix: 'charcoal and conté crayon drawing of', suffix: 'dramatic charcoal drawing, rich dark shadows and bright highlights, smudged atmospheric tone, rough textured paper, fine art drawing, classical academic study' },
    { id: 'med-soft-pastel', category: 'analog', nameKo: '소프트 파스텔 일러스트', emoji: '🌸', desc: '부드럽고 따뜻한 파스텔 분필로 그린 일러스트', prefix: 'soft pastel chalk illustration of', suffix: 'hand-drawn soft pastel chalk illustration, blended powdery texture, warm gentle color palette, pastel smudge effect, delicate toned paper background' },
    { id: 'med-lino-print', category: 'analog', nameKo: '리노컷 블록 판화', emoji: '🔲', desc: '리놀리움에 조각하고 찍어낸 굵고 간결한 블록 판화', prefix: 'linocut block print artwork of', suffix: 'bold linocut print, rough carved texture, limited two or three color print, strong graphic block shapes, hand-printed quality, vintage printmaking aesthetic' },
    { id: 'med-collage', category: 'analog', nameKo: '아날로그 혼합 매체 콜라주', emoji: '✂️', desc: '잡지·신문 지면을 오려 붙인 아날로그 콜라주 작품', prefix: 'analog mixed media collage artwork of', suffix: 'hand-cut magazine collage, layered paper scraps, glue texture visible, eclectic composition, vintage newspaper and photo elements, tactile handmade feel' },
    { id: 'med-monotype', category: 'analog', nameKo: '모노타입 프린트', emoji: '🖐️', desc: '판면 위 잉크를 직접 처리해 한 장만 찍어내는 모노타입 판화', prefix: 'monotype print artwork of', suffix: 'unique monotype print impression, painterly ink transfer texture, ghost plate second pull, spontaneous mark-making, one-of-a-kind print quality, organic ink variation' },
    { id: 'med-tempera', category: 'analog', nameKo: '에그 템페라 세밀화', emoji: '🥚', desc: '계란 노른자를 결합재로 쓴 중세 채색 세밀화 기법', prefix: 'egg tempera medieval illuminated illustration of', suffix: 'luminous egg tempera painting, crisp fine hatching, glowing jewel-like colors, gilded gold leaf accents, medieval manuscript illumination quality, meticulous detail' },
    { id: 'med-encaustic', category: 'analog', nameKo: '밀납 앙코스틱 페인팅', emoji: '🕯️', desc: '뜨거운 밀납 물감으로 녹이고 굳혀 층을 쌓는 앙코스틱', prefix: 'encaustic wax painting of', suffix: 'molten beeswax encaustic medium, layered translucent wax, scorched and fused surface texture, embedded pigment and collage elements, warm organic tonality' },
    { id: 'med-marbling', category: 'analog', nameKo: '에브루 물 마블링', emoji: '🌀', desc: '물 위에 그린 패턴을 종이에 옮기는 에브루 마블링 기법', prefix: 'water marbling ebru pattern artwork of', suffix: 'flowing water marbling ebru pattern, swirling ink on water surface transfer, intricate feathered curves, traditional Turkish marble paper, organic color blending' },

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
    { id: 'med-duotone', category: 'graphic', nameKo: '듀오톤 포스터 그래픽', emoji: '🎨', desc: '두 가지 강렬한 색상으로 구성된 듀오톤 스크린 인쇄 스타일', prefix: 'bold duotone graphic poster of', suffix: 'high contrast duotone screen print poster, only two vivid ink colors, halftone dot pattern overlay, graphic punch, contemporary music or festival poster aesthetic' },
    { id: 'med-swiss-typography', category: 'graphic', nameKo: '스위스 국제 타이포그래피', emoji: '📐', desc: '헬베티카와 그리드 시스템이 지배하는 스위스 국제 타이포그래픽 스타일', prefix: 'Swiss international typographic style design of', suffix: 'clean Swiss modernist grid layout, Helvetica sans-serif typography, primary color blocks, mathematical white space, International Typographic Style, Müller-Brockmann grid' },
    { id: 'med-retro-poster', category: 'graphic', nameKo: '레트로 빈티지 포스터', emoji: '🗓️', desc: '1940-60년대 인쇄 포스터 질감과 한정 색상 리소 인쇄 스타일', prefix: 'retro vintage graphic poster style of', suffix: 'vintage 1950s poster design, limited color palette Risograph print texture, aged paper patina, hand-lettered display type, mid-century modern illustration' },
    { id: 'med-brutalism-web', category: 'graphic', nameKo: '브루탈리즘 그래픽 디자인', emoji: '⬛', desc: '충돌하는 색상·불규칙 레이아웃의 그래픽 브루탈리즘 디자인', prefix: 'brutalist graphic design layout of', suffix: 'raw brutalist graphic design, clashing colors, intentional asymmetry, thick borders, unconventional bold typography, anti-design aesthetic, contemporary web brutalism' },
    { id: 'med-neon-sign', category: 'graphic', nameKo: '네온사인 글로우 일러스트', emoji: '💡', desc: '어두운 배경 위 빛나는 네온 튜브 사인 스타일 일러스트', prefix: 'neon sign glow illustration of', suffix: 'glowing neon tube sign on dark brick wall, vivid neon color light bleed, retro bar or diner aesthetic, neon lettering and icon graphic, light glow halo effect' },
    { id: 'med-abstract-geo', category: 'graphic', nameKo: '추상 기하 벡터 아트', emoji: '🔺', desc: '다각형과 원이 층위를 이루는 현대 추상 기하 벡터 아트', prefix: 'abstract geometric vector art composition of', suffix: 'modern abstract geometric vector composition, overlapping polygons and circles, gradient mesh fills, contemporary art print style, clean flat geometric abstraction' },
    { id: 'med-art-deco', category: 'graphic', nameKo: '아르데코 장식 일러스트', emoji: '🏛️', desc: '황금·흑색의 기하학적 장식과 대칭 구도의 아르데코 스타일', prefix: 'Art Deco decorative illustration of', suffix: 'elegant Art Deco geometric ornament, gold and black symmetrical motifs, stepped architectural forms, fan sunburst patterns, 1920s jazz age luxury aesthetic' },
    { id: 'med-zine', category: 'graphic', nameKo: '독립 진 DIY 그래픽', emoji: '📄', desc: '포토카피·스테이플러로 만든 독립 진(Zine) DIY 그래픽 감성', prefix: 'DIY zine style graphic layout of', suffix: 'photocopied zine aesthetic, cut-and-paste collage layout, hand-written notes, grainy lo-fi print quality, punk or riot grrl DIY publication design' },

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
    { id: 'med-shonen', category: 'anime', nameKo: '소년 만화 액션 스타일', emoji: '⚡', desc: '역동적인 포즈와 빛 효과로 가득한 소년 만화 액션 신', prefix: 'shonen action manga scene of', suffix: 'shonen battle manga style, dynamic action pose, speed lines radiating, energy aura glow, expressive shouting face, heroic character design, Naruto or Dragon Ball aesthetic' },
    { id: 'med-chibi', category: 'anime', nameKo: '치비 캐릭터 일러스트', emoji: '🧸', desc: '큰 머리와 동글동글 몸체의 귀여운 치비 캐릭터 디자인', prefix: 'cute chibi character illustration of', suffix: 'adorable chibi SD character design, oversized round head, stubby tiny body, sparkly big eyes, pastel color palette, kawaii cute illustration style' },
    { id: 'med-webtoon', category: 'anime', nameKo: '한국 웹툰 스타일', emoji: '📱', desc: '모바일 세로 스크롤에 최적화된 현대 한국 웹툰 컷 스타일', prefix: 'Korean webtoon full-color panel illustration of', suffix: 'modern Korean webtoon style, clean line art with flat cell-shading, vibrant color, vertical scroll panel composition, contemporary manhwa digital illustration' },
    { id: 'med-anime-bg', category: 'anime', nameKo: '스튜디오 지브리 배경 미술', emoji: '🌿', desc: '섬세한 자연 배경과 따뜻한 빛을 담은 스튜디오 지브리풍 배경 아트', prefix: 'Studio Ghibli style background art of', suffix: 'Studio Ghibli background art, lush detailed environment, soft watercolor tones, warm natural light, idyllic countryside or fantasy town setting, hand-painted quality' },
    { id: 'med-vintage-anime', category: 'anime', nameKo: '80~90년대 빈티지 셀애니', emoji: '📼', desc: '8-90년대 감성의 필름 노이즈·색 바램 빈티지 셀 애니메이션', prefix: 'vintage 80s 90s cel animation style of', suffix: 'nostalgic 1980s-1990s anime aesthetic, washed-out slightly faded colors, film grain noise, VHS artifact scan lines, vintage Japanese animation quality' },
    { id: 'med-manhwa-line', category: 'anime', nameKo: '한국 만화 먹선 흑백 스타일', emoji: '✒️', desc: '섬세한 먹선과 스크린톤으로 구성된 클래식 한국 흑백 만화 스타일', prefix: 'Korean black and white manhwa style of', suffix: 'classic Korean manhwa black and white, meticulous ink linework, screentone halftone shading, detailed background, dramatic composition, traditional comic publishing aesthetic' },
    { id: 'med-cel-shade-3d', category: 'anime', nameKo: '셀 쉐이딩 3D 애니풍', emoji: '🎮', desc: '3D 모델에 셀 쉐이딩을 적용해 2D 애니처럼 보이는 토온 렌더링', prefix: 'cel shading 3D toon render of', suffix: 'cel shaded toon rendering, 3D character with flat cartoon shading, hard shadow edges like 2D animation, outline contour lines, anime-style three-dimensional illustration' },
    { id: 'med-art-nouveau-illust', category: 'anime', nameKo: '아르누보 유기적 일러스트', emoji: '🌺', desc: '덩굴·꽃·여성을 주제로 한 아르누보 장식 일러스트레이션', prefix: 'Art Nouveau organic decorative illustration of', suffix: 'flowing Art Nouveau decorative illustration, organic plant tendrils and botanical motifs, sinuous line quality, Mucha or Klimt influenced, ornate frame border' },

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
    { id: 'med-film-grain', category: 'photo', nameKo: '필름 그레인 아날로그 사진', emoji: '🎞️', desc: '코닥·후지 필름 특유의 풍부한 그레인과 색감을 가진 필름 사진', prefix: 'analog film grain photography of', suffix: 'Kodak or Fuji film grain texture, authentic film stock color cast, slight vignetting, natural halation around highlights, vintage analog photography warmth' },
    { id: 'med-tilt-shift', category: 'photo', nameKo: '틸트시프트 미니어처 효과', emoji: '🔭', desc: '틸트시프트 렌즈로 실제 장면을 미니어처처럼 보이게 하는 사진', prefix: 'tilt-shift miniature effect photography of', suffix: 'tilt-shift lens effect making real scene look like a tiny miniature model, selective focus blur bands, bright saturated colors, bird-eye overhead view' },
    { id: 'med-high-key', category: 'photo', nameKo: '하이키 화이트 스튜디오', emoji: '⬜', desc: '전체가 밝고 그림자가 거의 없는 하이키 화이트 스튜디오 사진', prefix: 'high-key bright white studio photography of', suffix: 'high-key studio photography, bright overexposed background, soft shadowless lighting, clean white infinity curve, pure bright commercial photography aesthetic' },
    { id: 'med-hdr-landscape', category: 'photo', nameKo: 'HDR 풍경 사진', emoji: '🌄', desc: '밝은 부분과 어두운 부분 모두 디테일이 살아있는 HDR 풍경 사진', prefix: 'HDR landscape photography of', suffix: 'high dynamic range HDR landscape, brilliant saturated sky, rich shadow detail, tone-mapped radiant quality, scenic nature vista, award-winning landscape photography' },
    { id: 'med-night-portrait', category: 'photo', nameKo: '야간 보케 인물 사진', emoji: '🌙', desc: '야경 빛망울을 배경으로 담은 매혹적인 야간 인물 보케 사진', prefix: 'night portrait bokeh photography of', suffix: 'night portrait with beautiful city bokeh background, large aperture lens bokeh blur, warm street light orbs, cinematic night photography, f1.4 or f1.8 aesthetic' },
    { id: 'med-editorial-color', category: 'photo', nameKo: '시네마틱 컬러 그레이딩', emoji: '🎬', desc: '영화 색보정 LUT을 적용한 시네마틱 컬러 그레이딩 사진', prefix: 'cinematic color graded photography of', suffix: 'professional cinematic color grading, desaturated shadows with warm highlights, split toning, film LUT aesthetic, movie still quality photography, Hollywood grade' },
    { id: 'med-infrared', category: 'photo', nameKo: '적외선 IR 사진', emoji: '🌿', desc: '식물이 흰색으로 빛나는 신비로운 적외선(IR) 사진', prefix: 'infrared photography of', suffix: 'infrared IR photography, glowing white foliage, dramatic dark sky, ethereal dreamlike landscape, converted camera or IR filter, surreal monochrome or false color' },
    { id: 'med-double-exposure', category: 'photo', nameKo: '이중 노출 합성 사진', emoji: '👻', desc: '두 이미지를 겹쳐 몽환적인 이중 노출 합성 효과를 낸 사진', prefix: 'double exposure composite photography of', suffix: 'creative double exposure blend of two subjects, ghost overlay transparency, merged silhouette with nature or cityscape, artistic in-camera multiple exposure' },

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
    },
    { id: 'med-pottery-craft', category: 'craft', nameKo: '도예 & 세라믹 공예', emoji: '🏺', desc: '물레 위에서 빚어지는 도자기와 유약 발색의 도예 공예', prefix: 'handcrafted ceramic pottery of', suffix: 'handmade wheel-thrown ceramic pottery, natural ash glaze drips, kiln marks, organic clay body texture, artisan pottery studio, earthy ceramic craft' },
    { id: 'med-macrame', category: 'craft', nameKo: '마크라메 & 섬유 공예', emoji: '🧵', desc: '매듭과 짜임으로 만드는 보헤미안 마크라메 섬유 공예', prefix: 'macrame fiber art textile of', suffix: 'handmade macrame wall hanging, intricate knotted cotton cord, bohemian natural fiber textile, wooden dowel, geometric knot pattern, warm earthy tones' },
    { id: 'med-wood-carving', category: 'craft', nameKo: '목공예 & 조각', emoji: '🪵', desc: '나무결을 살린 목공예 조각과 손으로 깎은 목기 공예품', prefix: 'handcrafted wood carving artwork of', suffix: 'hand-carved wooden sculpture, visible gouge marks and wood grain, natural timber texture, artisan woodworking craft, warm studio lighting on wood' },
    { id: 'med-embroidery', category: 'craft', nameKo: '자수 & 퀼트 직물 공예', emoji: '🪡', desc: '실로 수놓은 정밀한 자수와 퀼트 패턴 직물 공예 작품', prefix: 'hand embroidery and quilting textile art of', suffix: 'detailed hand embroidery thread work on fabric, colorful cross-stitch or satin stitch, quilted fabric layers, tactile stitched textile craftsmanship' },
    { id: 'med-glass-blowing', category: 'craft', nameKo: '유리 블로잉 공예', emoji: '🔮', desc: '뜨거운 용융 유리를 불어 빚는 유리 공예 블로잉 작품', prefix: 'glass blowing art craft of', suffix: 'hand-blown art glass sculpture, vibrant translucent colors, organic flowing form, glassblower at furnace, Murano or studio glass craft aesthetic' },
    { id: 'med-jewelry-craft', category: 'craft', nameKo: '주얼리 & 금속 공예', emoji: '💍', desc: '섬세한 금속 세공과 원석이 결합된 핸드메이드 주얼리 공예', prefix: 'handcrafted jewelry metalwork of', suffix: 'handmade fine jewelry with precious stone setting, goldsmith metalwork, bezel or prong setting, hammered metal surface texture, studio artisan jewelry craft' },
    { id: 'med-felt', category: 'craft', nameKo: '펠트 & 양모 공예', emoji: '🐑', desc: '바늘 또는 물로 펠트를 만들어 형태를 빚는 양모 공예', prefix: 'wool felt needle felting sculpture of', suffix: 'needle felted wool sculpture, soft fluffy fiber texture, bright natural dye colors, organic rounded forms, artisan wool felting craft, playful tactile quality' },
    { id: 'med-papercraft', category: 'craft', nameKo: '종이 조형 & 오리가미', emoji: '📐', desc: '정교하게 접고 자르고 쌓아 만든 종이 조형 예술', prefix: 'paper sculpture and origami art of', suffix: 'intricate paper sculpture or complex origami, crisp geometric folds, layered paper dimension, white or colored paper, precise paper engineering art' },

    // ==================== 7. 공공 & 보고서 (official) ====================
    {
      id: 'med-whitepaper',
      category: 'official',
      nameKo: '화이트 정책 인포그래픽',
      emoji: '📄',
      desc: '깔끔한 흰 배경의 전문 정책·보고서 스타일',
      prefix: 'clean professional policy infographic illustration of',
      suffix: 'clean white background, professional government report style, flat design icons, structured data visualization, formal typography, official document aesthetic'
    },
    {
      id: 'med-official-photo',
      category: 'official',
      nameKo: '공공기관 공식 홍보사진',
      emoji: '📸',
      desc: '행사·시설·인물 중심의 공식 기관 사진 스타일',
      prefix: 'official institutional documentary photography of',
      suffix: 'official government photography style, professional composition, well-lit indoor or outdoor institutional setting, clean formal atmosphere, press release photo quality'
    },
    {
      id: 'med-report-diagram',
      category: 'official',
      nameKo: '정책 보고서 다이어그램',
      emoji: '🗂️',
      desc: '순서도·관계도·프레임워크 구조를 담은 보고서형 다이어그램',
      prefix: 'professional policy report diagram visualization of',
      suffix: 'policy document diagram style, flowchart, relationship nodes and arrows, muted corporate color palette, clean precise lines, formal report quality layout'
    },
    {
      id: 'med-annual-report',
      category: 'official',
      nameKo: '연차보고서 커버 디자인',
      emoji: '📒',
      desc: '메탈릭·엠보 느낌의 고급 연차보고서 표지 스타일',
      prefix: 'premium annual report cover design featuring',
      suffix: 'annual report cover, elegant corporate layout, dark navy or gold accent color, embossed logo, subtle gradient, high-end print finish, premium institutional design'
    },
    {
      id: 'med-presentation-slide',
      category: 'official',
      nameKo: '정책 프레젠테이션 슬라이드',
      emoji: '📊',
      desc: '공공 보고·국회 보고 수준의 정식 PPT 비주얼',
      prefix: 'professional government presentation slide design showing',
      suffix: 'clean policy presentation slide, structured title and body hierarchy, supporting icons, formal navy and white color theme, readable institutional typography'
    },
    {
      id: 'med-data-journalism',
      category: 'official',
      nameKo: '데이터 저널리즘 인포그래픽',
      emoji: '📰',
      desc: '언론·연구기관 수준의 데이터 기반 시각적 인포그래픽',
      prefix: 'editorial data journalism infographic illustration of',
      suffix: 'editorial infographic style, magazine or research journal quality, clear data visualization charts, bold readable typography, factual illustration, clear legend and source'
    },
    { id: 'med-gov-diagram', category: 'official', nameKo: '정부 업무 흐름도', emoji: '📊', desc: '공공 업무 절차와 기관 간 협력 체계를 도식화한 흐름도', prefix: 'government administrative flowchart diagram of', suffix: 'clean government administrative process flowchart, institutional color scheme, step-by-step workflow boxes and arrows, formal public sector diagram style' },
    { id: 'med-report-cover', category: 'official', nameKo: '공공기관 보고서 표지', emoji: '📁', desc: '정부·공공기관 연간 보고서 표지 디자인 레이아웃', prefix: 'official government institution annual report cover design of', suffix: 'professional public institution report cover, formal layout with institutional logo area, title hierarchy, government blue or grey color palette, annual report print design' },
    { id: 'med-policy-deck', category: 'official', nameKo: '정책 발표 슬라이드', emoji: '📋', desc: '정책 결과와 성과를 발표하는 공공 정책 프레젠테이션 슬라이드', prefix: 'government policy presentation slide deck of', suffix: 'official government policy presentation slide, clear data charts, structured layout, professional public sector visual language, policy outcome infographic' },
    { id: 'med-census-map', category: 'official', nameKo: '인구 & 지역 통계 지도', emoji: '🗺️', desc: '인구·경제 통계 데이터를 지도에 매핑한 코로플레스 통계 지도', prefix: 'statistical choropleth map showing', suffix: 'official statistical choropleth map, color-coded regions by data intensity, clear legend, geographic region labels, census data visualization, government statistical cartography' },
    { id: 'med-budget-chart', category: 'official', nameKo: '예산 & 재정 현황표', emoji: '💰', desc: '공공 예산 규모와 집행 현황을 시각화한 재정 현황 차트', prefix: 'public budget fiscal chart visualization of', suffix: 'official public budget breakdown chart, clear bar or pie chart, fiscal year financial data, government spending allocation, professional financial reporting visual' },
    { id: 'med-eval-matrix', category: 'official', nameKo: '사업 평가 매트릭스', emoji: '📈', desc: '공공 사업 성과를 다차원 지표로 평가하는 평가 매트릭스 시각화', prefix: 'public project evaluation matrix chart of', suffix: 'performance evaluation matrix with multi-axis rating, color-coded achievement levels, radar spider chart or scorecard, systematic evaluation visual framework' },
    { id: 'med-survey-viz', category: 'official', nameKo: '설문 & 여론 조사 결과', emoji: '📊', desc: '시민 만족도 설문 결과를 시각화한 공공 조사 리포트', prefix: 'public survey opinion poll result visualization of', suffix: 'citizen satisfaction survey results visualization, horizontal bar chart with percentage labels, likert scale response distribution, public opinion poll report design' },
    { id: 'med-org-chart', category: 'official', nameKo: '조직 & 거버넌스 구조도', emoji: '🏛️', desc: '공공기관·협의체의 조직 체계와 의사결정 구조를 표현한 구조도', prefix: 'organizational governance structure chart of', suffix: 'official organizational chart with institutional hierarchy boxes, governance structure, committee and department layout, formal public sector org chart design' },

    // ==================== 8. 게임 & 픽셀 (game) ====================
    {
      id: 'med-pixel-retro',
      category: 'game',
      nameKo: '레트로 8비트 픽셀아트',
      emoji: '👾',
      desc: 'NES/패미컴 시대의 8비트 픽셀 게임 그래픽',
      prefix: '8-bit pixel art game graphic of',
      suffix: 'retro 8-bit pixel art, NES Famicom game graphics style, limited 16-color palette, chunky square pixels, vintage game cartridge aesthetic, scanline effect'
    },
    {
      id: 'med-pixel-16bit',
      category: 'game',
      nameKo: '16비트 SNES 스프라이트',
      emoji: '🕹️',
      desc: 'SNES/메가드라이브 시대의 섬세한 16비트 픽셀 아트',
      prefix: '16-bit SNES era pixel art of',
      suffix: '16-bit Super Nintendo pixel art style, detailed sprite work, rich scrolling background, vibrant game palette, retro JRPG or platformer aesthetic'
    },
    {
      id: 'med-concept-fantasy',
      category: 'game',
      nameKo: '판타지 컨셉아트',
      emoji: '⚔️',
      desc: '영화·게임급 웅장한 판타지 세계관 컨셉 일러스트',
      prefix: 'epic cinematic fantasy concept art of',
      suffix: 'cinematic fantasy concept art, dramatic volumetric lighting, rich painterly textures, detailed world-building environment, film or AAA game production quality illustration'
    },
    {
      id: 'med-game-hud',
      category: 'game',
      nameKo: '게임 UI HUD 인터페이스',
      emoji: '🎯',
      desc: 'SF 게임의 투명 패널·레이더·상태바 HUD 스타일',
      prefix: 'futuristic game HUD interface overlay showing',
      suffix: 'science fiction game HUD overlay, transparent glass panels with glowing status bars, radar minimap display, objective markers, ammo counter, immersive AR game interface'
    },
    {
      id: 'med-synthwave',
      category: 'game',
      nameKo: '신스웨이브 레트로퓨처',
      emoji: '🌅',
      desc: '80년대 감성의 네온 그리드·크롬 반사·VHS 효과',
      prefix: 'synthwave retro-futuristic scene of',
      suffix: 'synthwave aesthetic, neon pink and electric cyan perspective grid, retrowave sunset gradient, 80s retro-futurism, chrome reflection, VHS scan lines, purple starry night sky'
    },
    {
      id: 'med-vaporwave',
      category: 'game',
      nameKo: '베이퍼웨이브 미학',
      emoji: '🌸',
      desc: '90년대 향수의 파스텔 글리치·대리석·야자수',
      prefix: 'vaporwave aesthetic scene of',
      suffix: 'vaporwave art style, pastel pink and lavender purple, glitch displacement, retro 90s computer graphics aesthetic, marble busts, palm trees, nostalgic internet visual culture'
    },
    {
      id: 'med-concept-scifi',
      category: 'game',
      nameKo: 'SF 하드서피스 컨셉아트',
      emoji: '🛸',
      desc: '리얼한 하드서피스 디자인의 SF 컨셉 일러스트',
      prefix: 'detailed hard-surface sci-fi concept art of',
      suffix: 'highly detailed science fiction concept art, realistic hard surface industrial design, cinematic dramatic rim lighting, matte painting quality, AAA game or film production art'
    },
    {
      id: 'med-gacha-card',
      category: 'game',
      nameKo: '가챠 카드 캐릭터 일러스트',
      emoji: '✨',
      desc: '화려한 코스튬과 이펙트의 모바일 RPG 카드 일러스트',
      prefix: 'detailed mobile gacha game character card illustration of',
      suffix: 'high quality gacha game character card art, vivid saturated colors, intricate ornate costume details, dynamic pose, sparkle particle effects, mobile RPG fantasy card illustration'
    },
    { id: 'med-mobile-game-ui', category: 'game', nameKo: '모바일 게임 UI 아트', emoji: '📱', desc: '모바일 게임의 화려한 HUD·버튼·팝업 UI 일러스트 스타일', prefix: 'mobile game UI art design of', suffix: 'colorful mobile game user interface art, ornate button frames, gem and coin counter HUD, decorative popup panel, fantasy RPG or idle game UI style' },
    { id: 'med-concept-game', category: 'game', nameKo: '게임 환경 콘셉트 아트', emoji: '🗺️', desc: 'AAA 게임 제작용 상세한 게임 환경 콘셉트 아트', prefix: 'AAA game environment concept art of', suffix: 'detailed game environment concept art, painterly texture, atmospheric perspective, rich world-building detail, environment art for RPG or action game production' },
    { id: 'med-moba-splash', category: 'game', nameKo: 'MOBA 캐릭터 스플래시 아트', emoji: '⚡', desc: '리그 오브 레전드 스타일의 화려한 MOBA 스플래시 스킨 아트', prefix: 'MOBA champion splash art illustration of', suffix: 'MOBA champion splash art, League of Legends or DOTA style, epic character reveal, dramatic pose with signature ability effect, rich cinematic illustration' },
    { id: 'med-tactical-map', category: 'game', nameKo: '전술 게임 맵 아이소메트릭', emoji: '🗺️', desc: '전략 게임의 아이소메트릭 지형과 유닛이 배치된 전술 맵', prefix: 'tactical strategy game isometric map of', suffix: 'isometric tactical game map, detailed terrain tiles, unit token positions, resource nodes, fog of war edge, classic strategy game visual, Civ or XCOM aesthetic' },
    { id: 'med-boss-monster', category: 'game', nameKo: '보스 몬스터 디자인', emoji: '👹', desc: '압도적인 크기와 공포감을 주는 게임 최종 보스 몬스터 일러스트', prefix: 'epic game boss monster character design of', suffix: 'imposing game boss monster, enormous silhouette with glowing weak points, intimidating creature design, dark fantasy or sci-fi aesthetic, dramatic confrontation lighting' },
    { id: 'med-side-scroll-bg', category: 'game', nameKo: '사이드스크롤 게임 배경', emoji: '🌆', desc: '메트로이드바니아 스타일의 사이드스크롤 2D 게임 배경', prefix: 'side-scrolling 2D game background environment of', suffix: '2D side-scroll game background, parallax layer environment, detailed platform game level art, Metroidvania atmospheric setting, pixel or illustrated style' },
    { id: 'med-3d-game-scene', category: 'game', nameKo: '3D 게임 씬 렌더링', emoji: '🎮', desc: '실제 게임 엔진 수준의 고품질 3D 게임 씬 렌더링', prefix: 'photorealistic 3D game scene rendering of', suffix: 'high fidelity game scene Unreal Engine quality render, global illumination, PBR materials, detailed props and environment, AAA game production screenshot' },
    { id: 'med-character-sheet', category: 'game', nameKo: '캐릭터 시트 & 턴어라운드', emoji: '🧑', desc: '전면·측면·후면 포즈가 담긴 게임 캐릭터 디자인 시트', prefix: 'game character design sheet turnaround of', suffix: 'character design sheet with front side back turnaround views, model sheet annotations, color palette chips, expression sheet, game production character bible page' },

    // ==================== 9. 전통 & 판화 (trad) ====================
    {
      id: 'med-minhwa',
      category: 'trad',
      nameKo: '한국 민화',
      emoji: '🐯',
      desc: '십장생·호랑이·모란 등 길상 도상의 조선 민화 스타일',
      prefix: 'Korean traditional folk painting minhwa style of',
      suffix: 'Korean minhwa folk painting, bold flat decorative colors, symbolic auspicious motifs, lotus and tiger patterns, hanji paper texture, Joseon dynasty folk art aesthetic'
    },
    {
      id: 'med-ukiyoe',
      category: 'trad',
      nameKo: '우키요에 목판화',
      emoji: '🗻',
      desc: '호쿠사이·히로시게 풍의 일본 전통 목판 인쇄',
      prefix: 'Japanese ukiyo-e woodblock print of',
      suffix: 'ukiyo-e woodblock print style, flat color planes, bold black outlines, Hokusai or Hiroshige inspired, Japanese wave or mountain motifs, washi paper texture'
    },
    {
      id: 'med-chinese-inkwash',
      category: 'trad',
      nameKo: '중국 수묵화',
      emoji: '🎋',
      desc: '붓 하나로 표현하는 여백의 미, 동양 수묵 산수화',
      prefix: 'Chinese ink wash painting shuimohua of',
      suffix: 'Chinese ink wash painting, monochromatic black ink gradients, expressive spontaneous brushstrokes, negative empty space composition, rice paper texture, mountainscape or bamboo subject'
    },
    {
      id: 'med-linocut',
      category: 'trad',
      nameKo: '리노컷 판화',
      emoji: '🖨️',
      desc: '날카로운 조각도 흔적이 살아있는 고대비 판화 스타일',
      prefix: 'linocut relief print artwork of',
      suffix: 'linocut printmaking style, bold relief print texture, high contrast black and limited color, hand-carved gouge marks, rough handmade texture, expressionist printmaking'
    },
    {
      id: 'med-art-deco',
      category: 'trad',
      nameKo: '아르데코 포스터',
      emoji: '🏆',
      desc: '1920년대 황금·흑색의 기하학적 럭셔리 아르데코',
      prefix: 'Art Deco style poster design of',
      suffix: 'Art Deco poster design, geometric symmetry and radial patterns, gold and black glamour palette, angular stylized figures, 1920s luxury art nouveau border ornaments'
    },
    {
      id: 'med-vintage-poster',
      category: 'trad',
      nameKo: '빈티지 레트로 포스터',
      emoji: '✈️',
      desc: '1950년대 미국 상업 일러스트의 여행 포스터 스타일',
      prefix: 'vintage retro travel poster design of',
      suffix: 'vintage 1950s travel poster illustration, limited flat color lithograph printing, bold sans-serif typography, retro advertising aesthetic, aged paper texture, sun-faded colors'
    },
    {
      id: 'med-constructivism',
      category: 'trad',
      nameKo: '러시아 구성주의',
      emoji: '⭐',
      desc: '대각선 역동성과 적·흑 원색의 소비에트 구성주의 포스터',
      prefix: 'Soviet Russian constructivist poster design of',
      suffix: 'Russian constructivism poster, bold geometric shapes and diagonal compositions, red black and white primary palette, dynamic avant-garde typography, 1920s Soviet propaganda art style'
    },
    {
      id: 'med-korean-calligraphy',
      category: 'trad',
      nameKo: '한국 서예·캘리그라피',
      emoji: '🖌️',
      desc: '먹빛 붓터치의 힘찬 한글·한자 서예 서체',
      prefix: 'Korean calligraphy ink brush art featuring',
      suffix: 'Korean calligraphic brushwork, expressive ink strokes on white hanji paper, traditional East Asian ink art, brush tip variations, meditative empty space composition, elegant sumi ink quality'
    },
    { id: 'med-serigraphy', category: 'trad', nameKo: '실크스크린 판화 인쇄', emoji: '🖼️', desc: '스크린을 통해 잉크를 찍어내는 팝아트 실크스크린 판화', prefix: 'silkscreen serigraphy print art of', suffix: 'silkscreen serigraphy print, layered flat ink colors with slight misregistration, screen printing texture, Andy Warhol Pop Art aesthetic, bold graphic image' },
    { id: 'med-woodblock', category: 'trad', nameKo: '동아시아 목판화', emoji: '🪵', desc: '전통 동아시아 목판화의 힘찬 선각과 흑백 프린트', prefix: 'traditional East Asian woodblock print of', suffix: 'traditional East Asian woodblock print, bold carved lines on white paper, stark black ink impression, ukiyo-e or Korean traditional print aesthetic, tactile textured surface' },
    { id: 'med-risograph', category: 'trad', nameKo: '리소그라프 인쇄 질감', emoji: '📑', desc: '두 색상이 겹쳐 번지는 리소그라프 특유의 질감 인쇄', prefix: 'Risograph print texture style illustration of', suffix: 'Risograph printing texture, limited two ink color overlap with slight misalignment, grain texture, flat color areas with organic variation, indie zine publication quality' },
    { id: 'med-stencil-graffiti', category: 'trad', nameKo: '스텐실 그래피티 아트', emoji: '🎭', desc: 'Banksy식 스텐실 기법의 거리 그래피티 아트', prefix: 'stencil graffiti street art of', suffix: 'Banksy-style stencil spray paint street art, crisp cut stencil edges, industrial brick wall surface, limited color spray aerosol, urban street graffiti art' },
    { id: 'med-mosaic-art', category: 'trad', nameKo: '모자이크 타일 아트', emoji: '🏛️', desc: '작은 타일이나 조각으로 만든 비잔틴·현대 모자이크 아트', prefix: 'mosaic tile art artwork of', suffix: 'colorful mosaic tile artwork, small tesserae pieces forming image, Byzantine or Roman mosaic style, visible grout lines, vibrant ceramic or glass tile fragments' },
    { id: 'med-letterpress', category: 'trad', nameKo: '레터프레스 활판 인쇄', emoji: '🔡', desc: '활자판을 종이에 압인하는 레터프레스 인쇄의 깊은 인상감', prefix: 'letterpress printing style typography of', suffix: 'letterpress printing impression, deep ink deboss on thick cotton paper, antique metal type or woodtype, vintage print shop aesthetic, tactile letterpress quality' },
    { id: 'med-folk-art', category: 'trad', nameKo: '민화 & 민속 공예 아트', emoji: '🌺', desc: '다양한 문화권의 전통 민화와 민속 공예 장식 일러스트', prefix: 'traditional folk art illustration of', suffix: 'vibrant folk art illustration, bold flat colors, traditional cultural motifs, repetitive decorative pattern, naive art quality, global folk art tradition from various cultures' },
    { id: 'med-copperplate-illust', category: 'trad', nameKo: '동판 세밀 식물 박물화', emoji: '🌿', desc: '18세기 박물관 수준의 동판화 동식물 세밀 일러스트', prefix: 'copper engraving botanical or scientific illustration of', suffix: 'antique copperplate engraving botanical illustration, cross-hatched fine line scientific drawing, historical natural history museum print, encyclopedic specimen plate quality' },

    // ==================== 10. 추상 & 실험 (abstract) ====================
    {
      id: 'med-glitch',
      category: 'abstract',
      nameKo: '글리치 디지털 아트',
      emoji: '📺',
      desc: 'RGB 분리·픽셀 오류·VHS 노이즈의 디지털 글리치',
      prefix: 'digital glitch art of',
      suffix: 'glitch art aesthetic, displaced pixel scanlines, RGB color channel separation, VHS tape error artifacts, digital data corruption visual noise, cyberpunk error screen aesthetic'
    },
    {
      id: 'med-generative',
      category: 'abstract',
      nameKo: '제너레이티브 알고리즘 아트',
      emoji: '🔢',
      desc: '수학 알고리즘이 만들어내는 파티클·커브·패턴',
      prefix: 'generative algorithmic art visualization of',
      suffix: 'generative algorithm art, mathematical parametric curves and spirals, flowing particle field systems, code-generated visual complexity, Processing or p5.js aesthetic, infinite pattern'
    },
    {
      id: 'med-abstract-expr',
      category: 'abstract',
      nameKo: '추상 표현주의',
      emoji: '🎆',
      desc: '폴록·로스코 풍의 감정적 드립페인팅·컬러필드',
      prefix: 'abstract expressionist painting of',
      suffix: 'abstract expressionist large canvas painting, gestural expressive brushstrokes, emotional color field layers, drip paint technique, Jackson Pollock or Mark Rothko inspired, raw energy'
    },
    {
      id: 'med-optical-illusion',
      category: 'abstract',
      nameKo: '옵아트 착시',
      emoji: '👁️',
      desc: '바사렐리 풍의 눈이 움직이는 기하학적 착시 패턴',
      prefix: 'Op Art optical illusion geometric pattern of',
      suffix: 'Op Art visual illusion, precise geometric tessellation repetition, vibrating visual motion patterns, high contrast black and white or complementary colors, Vasarely kinetic vision effect'
    },
    {
      id: 'med-fractal',
      category: 'abstract',
      nameKo: '프랙탈 수학 아트',
      emoji: '🌀',
      desc: '만델브로트·줄리아 집합의 무한 재귀 수학적 아름다움',
      prefix: 'fractal mathematical art visualization of',
      suffix: 'fractal art, infinitely recursive geometric self-similar patterns, Mandelbrot or Julia set mathematics, vibrant color gradient depth mapping, digital infinite zoom aesthetic'
    },
    {
      id: 'med-collage',
      category: 'abstract',
      nameKo: '혼합 매체 콜라주',
      emoji: '✂️',
      desc: '잡지·신문·수채화가 뒤섞인 컨템포러리 콜라주',
      prefix: 'mixed media collage artwork of',
      suffix: 'mixed media collage, torn magazine paper fragments, newspaper clippings, watercolor paint washes, hand-drawn ink elements, overlapping layered textures, contemporary zine art aesthetic'
    },
    {
      id: 'med-psychedelic-art',
      category: 'abstract',
      nameKo: '사이키델릭 비전 아트',
      emoji: '🌈',
      desc: '1960년대 히피 문화의 과포화·소용돌이·환각 비주얼',
      prefix: 'psychedelic visionary art of',
      suffix: 'psychedelic art, oversaturated swirling color vortex, 1960s hippie poster aesthetic, hallucination-inspired optical effects, distorted organic patterns, neon rainbow spectrum'
    },
    {
      id: 'med-kinetic-pattern',
      category: 'abstract',
      nameKo: '키네틱 패턴 모션 그래픽',
      emoji: '💠',
      desc: '규칙적 운동감을 주는 기하 패턴의 모션 그래픽 정지 프레임',
      prefix: 'kinetic motion graphic pattern design of',
      suffix: 'kinetic geometric motion graphic still frame, repeating tessellated shapes with implied movement, gradient color transitions, contemporary graphic design poster, clean vector art'
    },
    { id: 'med-color-field', category: 'abstract', nameKo: '컬러 필드 페인팅', emoji: '🎨', desc: '마크 로스코 풍의 대형 색면으로 감성을 전달하는 추상화', prefix: 'color field abstract painting of', suffix: 'large format color field painting, luminous color planes with soft edges, meditative atmospheric color, Mark Rothko or Helen Frankenthaler influenced, emotional color resonance' },
    { id: 'med-suprematism', category: 'abstract', nameKo: '절대주의 기하 추상', emoji: '⬛', desc: '말레비치 절대주의의 순수한 기하 형태와 흰 공간의 추상 구성', prefix: 'Suprematist geometric abstract composition of', suffix: 'Suprematist geometric abstraction, pure flat shapes on white ground, Malevich-inspired composition, square rectangle circle diagonal elements, absolute geometric purity' },
    { id: 'med-op-art', category: 'abstract', nameKo: '옵아트 착시 패턴', emoji: '👁️', desc: '브리짓 라일리 식의 눈이 착각을 일으키는 옵아트 패턴', prefix: 'op art optical illusion pattern of', suffix: 'Op Art optical illusion pattern, Bridget Riley-style undulating lines or grid, vibrating visual effect, black and white or complementary color, perceptual motion illusion' },
    { id: 'med-abstract-expr', category: 'abstract', nameKo: '추상 표현주의 행위 회화', emoji: '🖌️', desc: '캔버스에 물감을 뿌리고 떨어뜨리는 잭슨 폴록식 행위 추상화', prefix: 'abstract expressionist action painting of', suffix: 'abstract expressionist action painting, dripped and thrown paint, gestural mark-making, Jackson Pollock or Franz Kline influenced, raw energy impasto textures' },
    { id: 'med-data-art', category: 'abstract', nameKo: '데이터 아트 시각화', emoji: '📡', desc: '대규모 데이터셋을 아름다운 패턴으로 변환한 데이터 아트', prefix: 'data art visualization artwork of', suffix: 'generative data art visualization, beautiful pattern from large dataset, network graph constellation, circular data diagram aesthetics, data points forming visual poetry' },
    { id: 'med-glitch-art', category: 'abstract', nameKo: '글리치 & 데이터모싱 아트', emoji: '📺', desc: 'JPEG 압축 오류·픽셀 밴딩을 예술로 승화한 글리치 아트', prefix: 'glitch art databending artifact of', suffix: 'digital glitch art with JPEG compression artifacts, pixel sorting bands, RGB color channel shift, datamoshing visual distortion, intentional digital error aesthetic' },
    { id: 'med-light-art', category: 'abstract', nameKo: '라이트 아트 광선 설치', emoji: '💡', desc: '레이저·LED 광선으로 공간을 채운 라이트 아트 설치 작품', prefix: 'light art installation artwork of', suffix: 'light art installation with laser beams or LED strips, volumetric light in fog or dark space, geometric light sculpture, immersive light art environment, James Turrell style' },
    { id: 'med-algorithmic-art', category: 'abstract', nameKo: '알고리즘 생성 아트', emoji: '🔢', desc: '코드와 수학 공식으로 생성된 컴퓨터 알고리즘 제너레이티브 아트', prefix: 'algorithmic generative art pattern of', suffix: 'computer generated algorithmic art, mathematical formula visualization, Perlin noise or fractal iteration pattern, code-based creative visual, generative art system output' },

    // ==================== 11. 건축 & 공간 (arch) ====================
    {
      id: 'med-arch-render',
      category: 'arch',
      nameKo: '건축 3D 렌더링',
      emoji: '🏛️',
      desc: 'V-Ray 급 포토리얼 건축 시각화 렌더링',
      prefix: 'photorealistic architectural 3D rendering of',
      suffix: 'photorealistic architectural visualization, modern building materials glass and concrete, dramatic sky backdrop with clouds, landscape context, V-Ray or Lumion rendering quality, professional CGI'
    },
    {
      id: 'med-blueprint',
      category: 'arch',
      nameKo: '청사진 설계 도면',
      emoji: '📐',
      desc: '파란 배경 위 흰 선의 정밀 건축·기계 설계도',
      prefix: 'technical blueprint schematic drawing of',
      suffix: 'detailed architectural blueprint on deep blue background, precise white technical drawing lines, floor plan or elevation view, measurement dimension annotations, engineering technical drawing style'
    },
    {
      id: 'med-interior-viz',
      category: 'arch',
      nameKo: '인테리어 공간 시각화',
      emoji: '🛋️',
      desc: '따뜻한 조명과 프리미엄 소재의 인테리어 렌더링',
      prefix: 'luxury interior design space visualization of',
      suffix: 'photorealistic interior design visualization, warm ambient and accent lighting, premium natural materials and furniture, contemporary Scandinavian or Japanese style, architectural digest quality'
    },
    {
      id: 'med-urban-planning',
      category: 'arch',
      nameKo: '도시 계획 조감도',
      emoji: '🗺️',
      desc: '조감시점의 마스터플랜 GIS 도시계획 비주얼',
      prefix: 'urban planning master plan aerial visualization of',
      suffix: 'urban planning bird-eye aerial view, master plan visualization with green spaces and building footprints, road network grid, GIS-style colorful city block plan, contemporary urban design'
    },
    {
      id: 'med-section-drawing',
      category: 'arch',
      nameKo: '건축 단면도 일러스트',
      emoji: '🔍',
      desc: '건물을 자른 단면에서 내부 층별 공간을 보여주는 컷어웨이',
      prefix: 'architectural cross-section cutaway illustration of',
      suffix: 'detailed architectural cross-section cutaway illustration, multiple floor layers visible, warm interior ambient lighting, miniature people silhouettes for scale, colorful technical illustration style'
    },
    {
      id: 'med-landscape-arch',
      category: 'arch',
      nameKo: '조경 식재 설계 렌더링',
      emoji: '🌳',
      desc: '수목·수경·보행로가 어우러진 조경 설계 시각화',
      prefix: 'landscape architecture design rendering of',
      suffix: 'landscape architecture rendering, lush green planting design with specimen trees, walking paths and water features, public park or plaza setting, soft natural golden hour lighting'
    },
    {
      id: 'med-heritage-drawing',
      category: 'arch',
      nameKo: '문화유산 복원 일러스트',
      emoji: '🏯',
      desc: '역사적 고증을 바탕으로 복원된 문화재 건축 일러스트',
      prefix: 'heritage architecture historical reconstruction illustration of',
      suffix: 'heritage building reconstruction illustration, traditional architecture period-accurate details, watercolor and technical line art combination, educational historical illustration quality'
    },
    {
      id: 'med-space-planning',
      category: 'arch',
      nameKo: '공간 배치 평면 계획도',
      emoji: '📏',
      desc: '가구·구역이 색상으로 구분된 탑뷰 공간 배치 계획도',
      prefix: 'interior space planning top-view diagram of',
      suffix: 'clean interior floor plan layout, top-view space planning diagram, furniture arrangement, color-coded functional zones, minimalist professional line drawing, space planning illustration'
    },
    { id: 'med-parametric-arch', category: 'arch', nameKo: '파라메트릭 건축 외관', emoji: '🌀', desc: '알고리즘으로 생성된 파라메트릭 건축 외피 디자인 렌더링', prefix: 'parametric architecture facade rendering of', suffix: 'parametric facade design with algorithmic pattern, Zaha Hadid or Bjarke Ingels influenced, flowing curved geometry, computational design architecture, CGI visualization' },
    { id: 'med-biophilic-arch', category: 'arch', nameKo: '바이오필릭 녹색 건축', emoji: '🌿', desc: '식물과 건축이 통합된 바이오필릭 지속가능 건물 렌더링', prefix: 'biophilic green architecture rendering of', suffix: 'biophilic architecture with integrated living plants, green wall and rooftop garden, sustainable building design, nature-integrated architecture, LEED-style eco building visualization' },
    { id: 'med-adaptive-reuse', category: 'arch', nameKo: '적응적 재사용 리노베이션', emoji: '🏭', desc: '공장·창고를 문화공간으로 재탄생시킨 리노베이션 건축 도면', prefix: 'adaptive reuse renovation architectural drawing of', suffix: 'adaptive reuse renovation design, industrial building converted to cultural space, before-after architectural contrast, exposed brick and modern intervention, heritage adaptive transformation' },
    { id: 'med-arch-diagram', category: 'arch', nameKo: '건축 개념 다이어그램', emoji: '📊', desc: '설계 개념을 시각화한 버블 다이어그램과 axonometric 분해도', prefix: 'architectural concept diagram of', suffix: 'architectural concept diagram with bubble zones and circulation arrows, design process visualization, axonometric exploded diagram, conceptual architectural communication drawing' },
    { id: 'med-night-arch', category: 'arch', nameKo: '야경 건축 비주얼', emoji: '🌙', desc: '야간 조명과 반사를 강조한 고급 건축 야경 렌더링', prefix: 'architectural night visualization of', suffix: 'dramatic nighttime architectural visualization, interior light glow and reflections, twilight sky, luxury building exterior night render, ambient atmospheric lighting quality' },
    { id: 'med-urban-masterplan', category: 'arch', nameKo: '도시 마스터플랜 조감도', emoji: '🗺️', desc: '도시 개발 구역 전체를 조감하는 3D 마스터플랜 렌더링', prefix: 'urban masterplan aerial view of', suffix: 'urban masterplan 3D aerial visualization, city block development overview, mixed-use district planning, green spaces and streets layout, planning proposal bird-eye view' },
    { id: 'med-interior-render', category: 'arch', nameKo: '인테리어 포토리얼 렌더', emoji: '🛋️', desc: '건축 인테리어의 자연광과 소재를 사실적으로 표현한 렌더링', prefix: 'photorealistic interior architectural render of', suffix: 'photorealistic interior architectural render, natural daylight through windows, material texture quality wood concrete glass, lifestyle interior photography style, 3ds Max or V-Ray quality' },
    { id: 'med-timber-arch', category: 'arch', nameKo: '목구조 노출 건축 도면', emoji: '🪵', desc: 'CLT·글루램 목구조가 노출된 구조 아름다움을 표현한 건축 도면', prefix: 'exposed timber structure architectural drawing of', suffix: 'exposed timber structure architecture, CLT cross-laminated timber or glulam beams, mass timber construction aesthetic, structural wood beauty, Scandinavian or Japanese timber architecture style' },

    // ── editorial ──────────────────────────────────────────────
    {
      id: 'med-fashion-illust',
      category: 'editorial',
      nameKo: '패션 일러스트레이션',
      emoji: '👗',
      desc: '보그 스타일 하이패션 잡지 일러스트',
      prefix: 'high fashion editorial illustration of',
      suffix: 'elegant fashion illustration, Vogue editorial style, elongated figure, haute couture garment details, chic color palette, contemporary fashion art, ink and watercolor mixed media'
    },
    {
      id: 'med-luxury-mag',
      category: 'editorial',
      nameKo: '럭셔리 매거진 레이아웃',
      emoji: '📰',
      desc: '고급 인쇄물 느낌의 에디토리얼 레이아웃 사진',
      prefix: 'luxury editorial magazine layout photograph of',
      suffix: 'premium editorial photography, luxury magazine double spread, tasteful typography overlay, sophisticated product or lifestyle, moody studio lighting, award-winning ad campaign quality'
    },
    {
      id: 'med-beauty-ad',
      category: 'editorial',
      nameKo: '뷰티 광고 사진',
      emoji: '💄',
      desc: '피부·질감 강조의 하이엔드 뷰티 광고 비주얼',
      prefix: 'high-end beauty advertising campaign photo of',
      suffix: 'professional beauty advertising photography, flawless skin texture macro, clean white or gradient background, dramatic rim lighting, luxury cosmetics editorial aesthetic, retouched campaign quality'
    },
    {
      id: 'med-sports-illust',
      category: 'editorial',
      nameKo: '스포츠 다이나믹 일러스트',
      emoji: '⚡',
      desc: '동세 강조의 스포츠 에너지 일러스트레이션',
      prefix: 'dynamic sports editorial illustration of',
      suffix: 'high energy sports illustration, bold motion lines and dynamic pose, graphic flat color blocking, ESPN magazine or Nike ad aesthetic, strong contrast and impactful composition'
    },
    {
      id: 'med-childrens-book',
      category: 'editorial',
      nameKo: '아동 동화책 일러스트',
      emoji: '📚',
      desc: '따뜻하고 동글동글한 아동 그림책 스타일',
      prefix: 'charming children\'s picture book illustration of',
      suffix: 'whimsical children\'s book illustration, soft pastel color palette, cute rounded character design, warm friendly atmosphere, gouache or digital flat art style, storytelling picture book quality'
    },
    {
      id: 'med-portrait-editorial',
      category: 'editorial',
      nameKo: '에디토리얼 인물 포트레이트',
      emoji: '🎭',
      desc: '캐릭터의 개성을 살린 잡지풍 인물 초상화',
      prefix: 'editorial portrait photography of',
      suffix: 'striking editorial portrait, strong personality and character expression, creative lighting setup, shallow depth of field with blurred background, magazine cover quality photography'
    },
    {
      id: 'med-food-editorial',
      category: 'editorial',
      nameKo: '푸드 에디토리얼 사진',
      emoji: '🍽️',
      desc: '요리책·잡지 수준의 아티스틱 음식 사진',
      prefix: 'artistic food editorial photography of',
      suffix: 'styled food editorial photography, natural side or overhead light, organic linen or dark marble surface, deliberate food styling with garnish, cookbook or fine dining magazine aesthetic'
    },
    {
      id: 'med-lifestyle-photo',
      category: 'editorial',
      nameKo: '라이프스타일 브랜드 사진',
      emoji: '🌿',
      desc: '일상 속 감성을 담은 생활 브랜드 스타일 사진',
      prefix: 'authentic lifestyle brand photography of',
      suffix: 'candid lifestyle brand photography, natural warm ambient light, relatable authentic moment, light airy color grading, subtle brand product integration, Instagram or Kinfolk magazine aesthetic'
    },
    { id: 'med-luxury-product', category: 'editorial', nameKo: '럭셔리 제품 스틸 광고', emoji: '💎', desc: '고급 조명과 소재 질감을 강조한 럭셔리 제품 광고 사진', prefix: 'luxury product advertising photograph of', suffix: 'luxury product still-life advertisement, dramatic studio lighting with gold or silver accent, high-end material texture, perfume or jewelry catalog aesthetic, premium brand campaign visual' },
    { id: 'med-sports-editorial', category: 'editorial', nameKo: '스포츠 액션 에디토리얼', emoji: '⚡', desc: '역동적인 움직임의 순간을 포착한 스포츠 에디토리얼 사진', prefix: 'dynamic sports editorial photography of', suffix: 'high-speed sports editorial photograph, peak action moment frozen, motion blur background, dramatic low angle or top view, sport magazine double-page spread quality' },
    { id: 'med-beauty-campaign', category: 'editorial', nameKo: '뷰티 캠페인 비주얼', emoji: '💄', desc: '색상 테마와 감성이 통일된 뷰티 캠페인 화보 이미지', prefix: 'beauty campaign editorial visual of', suffix: 'beauty brand campaign photograph, cohesive color theme and mood, close-up skin or makeup texture, glossy editorial lighting, Vogue or Elle beauty spread aesthetic' },
    { id: 'med-travel-editorial', category: 'editorial', nameKo: '여행 & 문화 에디토리얼', emoji: '✈️', desc: '장소의 감성을 전달하는 여행 잡지 스타일 사진', prefix: 'travel and culture editorial photography of', suffix: 'travel editorial photography, sense of place and local culture, golden hour or blue hour lighting, cinematic composition, Condé Nast Traveler or Monocle magazine style' },
    { id: 'med-corporate-portrait', category: 'editorial', nameKo: '비즈니스 인물 사진', emoji: '👔', desc: '전문성과 개성을 동시에 표현하는 기업 인물 화보', prefix: 'corporate editorial portrait photography of', suffix: 'corporate editorial portrait, professional yet approachable expression, environmental context background, studio or office natural light, LinkedIn or annual report quality headshot' },
    { id: 'med-architecture-editorial', category: 'editorial', nameKo: '건축 공간 에디토리얼', emoji: '🏛️', desc: '건축 잡지 수준의 공간 에디토리얼 사진', prefix: 'architectural editorial photography of', suffix: 'architectural editorial photograph, Wallpaper or Dezeen magazine quality, wide angle interior or exterior, precise geometric composition, natural light and material texture' },
    { id: 'med-conceptual-fashion', category: 'editorial', nameKo: '컨셉추얼 패션 화보', emoji: '🎭', desc: '예술과 패션이 융합된 컨셉추얼 아트 방향의 패션 화보', prefix: 'conceptual art fashion editorial of', suffix: 'conceptual fashion editorial, art direction with strong visual metaphor, avant-garde styling and setting, narrative-driven fashion story, high art fashion boundary-pushing visual' },
    { id: 'med-social-content', category: 'editorial', nameKo: '소셜 미디어 비주얼 콘텐츠', emoji: '📱', desc: 'Instagram·TikTok 바이럴에 최적화된 소셜 콘텐츠 비주얼', prefix: 'social media visual content of', suffix: 'social media optimized visual content, high engagement aesthetics for Instagram or TikTok, bold graphic or satisfying composition, trendy color palette, shareable visual hook design' },

    // ── digital_paint ──────────────────────────────────────────
    {
      id: 'med-photobash',
      category: 'digital_paint',
      nameKo: '포토배싱 합성 일러스트',
      emoji: '🖼️',
      desc: '실사 사진과 페인팅을 혼합한 SF/판타지 합성 일러스트',
      prefix: 'photobashing concept art illustration of',
      suffix: 'photobashing concept art, seamless blend of real photo textures and digital painting, sci-fi or fantasy environment, dramatic cinematic composition, AAA game concept art quality'
    },
    {
      id: 'med-digital-impasto',
      category: 'digital_paint',
      nameKo: '디지털 임파스토 페인팅',
      emoji: '🎨',
      desc: '두꺼운 물감 질감을 재현한 디지털 유화 기법',
      prefix: 'digital impasto thick oil painting of',
      suffix: 'digital impasto painting style, heavily textured brushstrokes mimicking thick oil paint, visible palette knife marks, rich tactile surface quality, contemporary fine art digital painting'
    },
    {
      id: 'med-matte-painting',
      category: 'digital_paint',
      nameKo: '매트 페인팅 배경 아트',
      emoji: '🌌',
      desc: '영화 VFX에 쓰이는 실사 합성 배경 매트 페인팅',
      prefix: 'cinematic matte painting background of',
      suffix: 'professional matte painting, photorealistic background environment, film VFX quality, seamless integration of painted and photographic elements, epic scale environment, movie production background art'
    },
    {
      id: 'med-concept-sketch',
      category: 'digital_paint',
      nameKo: '콘셉트 스케치 드로잉',
      emoji: '✏️',
      desc: '디자이너의 초기 아이디어를 담은 러프 콘셉트 스케치',
      prefix: 'professional concept design sketch of',
      suffix: 'rough concept design sketch, gestural line work with quick value blocking, loose exploratory drawing, product or character or environment concept, industrial design or game art sketchbook style'
    },
    {
      id: 'med-speed-paint',
      category: 'digital_paint',
      nameKo: '스피드 페인팅 환경 아트',
      emoji: '⚡',
      desc: '빠르고 에너지 넘치는 스피드 페인팅 환경 묘사',
      prefix: 'dynamic speed painting of',
      suffix: 'expressive speed painting, bold confident brushstrokes, dramatic lighting and atmospheric color, ArtStation environment concept style, energetic loose but skilled technique, 60-minute painting quality'
    },
    {
      id: 'med-3d-paint-hybrid',
      category: 'digital_paint',
      nameKo: '3D+페인팅 하이브리드 아트',
      emoji: '🔮',
      desc: '3D 베이스에 디지털 페인팅 오버페인트 혼합 아트',
      prefix: 'stylized 3D and digital painting hybrid artwork of',
      suffix: '3D base rendered then overpainted digitally, hybrid rendering style, painterly textures over 3D geometry, semi-realistic stylized aesthetic, high production quality art'
    },
    {
      id: 'med-noise-texture',
      category: 'digital_paint',
      nameKo: '노이즈 텍스처 추상화',
      emoji: '🌊',
      desc: '그레인·노이즈 텍스처로 표현한 현대 추상 디지털 아트',
      prefix: 'noise grain texture abstract digital art of',
      suffix: 'modern noise grain texture art, heavy film grain overlay, abstract color field with rich texture, muted or deep color palette, contemporary digital art print quality, tactile noise surface'
    },
    {
      id: 'med-digital-ink',
      category: 'digital_paint',
      nameKo: '디지털 잉크 선화 일러스트',
      emoji: '🖊️',
      desc: '선의 굵기 변화와 먹빛을 살린 디지털 잉크 드로잉',
      prefix: 'expressive digital ink line illustration of',
      suffix: 'bold digital ink illustration, varied line weight brushwork, high contrast black ink on white or textured paper, graphic novel or manga-influenced, expressive gestural line quality'
    },
    { id: 'med-environment-concept', category: 'digital_paint', nameKo: '환경 컨셉 아트', emoji: '🌄', desc: '게임·영화용 실외·실내 환경 컨셉 아트 페인팅', prefix: 'environment concept art digital painting of', suffix: 'environment concept art for game or film, atmospheric perspective depth, detailed environment storytelling, professional concept art studio quality, lighting mood and color script' },
    { id: 'med-creature-design', category: 'digital_paint', nameKo: '크리처 & 몬스터 디자인', emoji: '🐉', desc: '해부학적 디테일을 갖춘 판타지 크리처 디자인 시트', prefix: 'creature monster design illustration of', suffix: 'creature design digital painting, anatomically considered fantasy creature, multiple angle turnaround or action pose, detailed surface texture scales fur or carapace, professional creature artist style' },
    { id: 'med-character-concept', category: 'digital_paint', nameKo: '캐릭터 컨셉 디자인 시트', emoji: '🧝', desc: '복식·표정 변형 등 캐릭터 디자인 시트 전체 구성', prefix: 'character concept design sheet of', suffix: 'character concept design sheet with multiple views and expressions, costume detail callouts, color palette chip, professional game or animation character art bible style' },
    { id: 'med-sci-fi-matte', category: 'digital_paint', nameKo: 'SF 매트 페인팅 배경', emoji: '🚀', desc: '우주·미래도시·외계 행성 SF 매트 페인팅 배경', prefix: 'sci-fi matte painting digital art of', suffix: 'science fiction matte painting, futuristic cityscape or alien planet landscape, cinematic widescreen composition, photo-real scale and atmosphere, Hollywood VFX concept quality' },
    { id: 'med-book-cover-art', category: 'digital_paint', nameKo: '소설 표지 디지털 일러스트', emoji: '📚', desc: '판타지·SF·로맨스 소설 표지용 고품질 디지털 일러스트', prefix: 'book cover digital illustration of', suffix: 'professional novel book cover illustration, genre-appropriate atmospheric composition, dramatic lighting and hero focal point, publishable cover art quality, fantasy or sci-fi or romance genre' },
    { id: 'med-storyboard', category: 'digital_paint', nameKo: '영상 스토리보드 드로잉', emoji: '🎬', desc: '영화·CF·애니메이션 스토리보드 판넬 드로잉 세트', prefix: 'film storyboard illustration panel of', suffix: 'film or animation storyboard panels, cinematic composition with camera angle notes, rough sketch with clear action and staging, professional storyboard artist style' },
    { id: 'med-graphic-novel', category: 'digital_paint', nameKo: '그래픽 노블 아트', emoji: '💥', desc: '연속 페이지 형식의 그래픽 노블 스타일 디지털 컬러 아트', prefix: 'graphic novel page art of', suffix: 'graphic novel page layout with panels, dynamic sequential storytelling, bold outline with flat or cel-shade color, high contrast drama, Western or European comic art style' },
    { id: 'med-fan-art', category: 'digital_paint', nameKo: '팬아트 & 트리뷰트 일러스트', emoji: '⭐', desc: '팝컬처 아이콘을 재해석한 팬아트 디지털 페인팅', prefix: 'fan art tribute digital painting of', suffix: 'fan art digital painting, iconic pop culture reinterpretation, polished rendering with original artistic spin, detailed character or scene illustration, trending art community style' },

    // ── ui_ux ───────────────────────────────────────────────────
    {
      id: 'med-app-dashboard',
      category: 'ui_ux',
      nameKo: '앱 대시보드 목업',
      emoji: '📊',
      desc: '데이터 시각화가 포함된 SaaS 앱 대시보드 UI 목업',
      prefix: 'clean app dashboard UI mockup of',
      suffix: 'modern SaaS app dashboard mockup, clean card-based layout, data visualization charts and KPI metrics, professional color-coded interface, light or dark mode, high-fidelity UI design'
    },
    {
      id: 'med-wireframe',
      category: 'ui_ux',
      nameKo: '와이어프레임 UX 설계도',
      emoji: '⬜',
      desc: '그레이스케일 박스 와이어프레임 UX 레이아웃',
      prefix: 'UX wireframe layout design of',
      suffix: 'low-fidelity wireframe design, grayscale placeholder boxes and lines, clear information hierarchy layout, annotation labels, clean UX process diagram, Figma or Sketch wireframe style'
    },
    {
      id: 'med-gamification-ui',
      category: 'ui_ux',
      nameKo: '게이미피케이션 UI 디자인',
      emoji: '🏆',
      desc: '뱃지·레벨·포인트를 품은 게이미피케이션 앱 UI',
      prefix: 'gamification app UI design of',
      suffix: 'engaging gamification UI design, achievement badges and level progress bars, reward system visual hierarchy, colorful motivational design language, mobile app interface quality'
    },
    {
      id: 'med-glassmorphism',
      category: 'ui_ux',
      nameKo: '글래스모피즘 UI',
      emoji: '🪟',
      desc: '반투명 블러 카드의 글래스모피즘 트렌드 UI',
      prefix: 'glassmorphism UI design of',
      suffix: 'modern glassmorphism UI, frosted glass card panels with blur effect, soft gradient background, subtle white border highlight, floating elements with depth, contemporary design trend'
    },
    {
      id: 'med-neumorphism',
      category: 'ui_ux',
      nameKo: '뉴모피즘 UI',
      emoji: '⚪',
      desc: '소프트 그림자로 볼록한 느낌을 주는 뉴모피즘 UI',
      prefix: 'neumorphism soft UI design of',
      suffix: 'neumorphism UI design, soft extruded button and card elements, dual shadow technique light and shadow, monochromatic muted color palette, tactile skeuomorphic-digital hybrid style'
    },
    {
      id: 'med-dark-mode-app',
      category: 'ui_ux',
      nameKo: '다크모드 앱 인터페이스',
      emoji: '🌙',
      desc: '세련된 다크 테마의 모바일/웹 앱 인터페이스',
      prefix: 'elegant dark mode app interface design of',
      suffix: 'sophisticated dark mode app interface, near-black background with subtle surface layers, vibrant accent color highlights, clean typography hierarchy, professional dark theme UI design'
    },
    {
      id: 'med-data-viz-infographic',
      category: 'ui_ux',
      nameKo: '데이터 시각화 인포그래픽',
      emoji: '📈',
      desc: '데이터를 스토리로 전달하는 에디토리얼 인포그래픽',
      prefix: 'editorial data visualization infographic of',
      suffix: 'professional data visualization infographic, clear chart and diagram hierarchy, brand color-coded data categories, readable typography with annotations, NYT or Bloomberg data journalism style'
    },
    {
      id: 'med-system-arch-diagram',
      category: 'ui_ux',
      nameKo: '시스템 아키텍처 다이어그램',
      emoji: '🔧',
      desc: '클라우드·마이크로서비스 구조를 도식화한 기술 다이어그램',
      prefix: 'clean system architecture diagram of',
      suffix: 'professional system architecture diagram, microservice or cloud infrastructure, color-coded service blocks with connection arrows, AWS or GCP icon style, clean technical diagram on white background'
    },
    { id: 'med-onboarding-flow', category: 'ui_ux', nameKo: '온보딩 플로우 UI', emoji: '🎯', desc: '신규 사용자 온보딩 스텝 화면 구성 UI 목업', prefix: 'user onboarding flow UI screen design of', suffix: 'mobile or web onboarding flow screens, step progress indicator, friendly illustration and clear CTA button, clean minimal design, Figma prototype style presentation' },
    { id: 'med-e-commerce-ui', category: 'ui_ux', nameKo: '이커머스 쇼핑 UI', emoji: '🛒', desc: '상품 목록·상세·결제 흐름을 포함한 이커머스 UI 디자인', prefix: 'e-commerce shopping app UI design of', suffix: 'e-commerce product listing and detail page UI, clean card grid layout, trust badges and CTA button design, mobile-first responsive, Shopify or Apple store aesthetic' },
    { id: 'med-design-system', category: 'ui_ux', nameKo: '디자인 시스템 컴포넌트', emoji: '🧱', desc: '버튼·폼·타이포그래피 등 디자인 시스템 컴포넌트 라이브러리 시트', prefix: 'design system component library sheet of', suffix: 'UI design system component sheet, button states and variants, form element collection, typography scale, color palette swatches, professional Figma design system documentation style' },
    { id: 'med-landing-page-ui', category: 'ui_ux', nameKo: '랜딩페이지 히어로 UI', emoji: '🚀', desc: '전환율 최적화를 고려한 SaaS 랜딩페이지 히어로 섹션 UI', prefix: 'SaaS landing page hero section UI design of', suffix: 'SaaS product landing page hero section, headline and subhead with clear value proposition, hero product screenshot or illustration, CTA button and social proof, conversion-optimized design' },
    { id: 'med-mobile-notification', category: 'ui_ux', nameKo: '모바일 알림 & 마이크로 인터렉션', emoji: '🔔', desc: '푸시 알림·토스트·로딩 등 모바일 마이크로인터렉션 UI 시트', prefix: 'mobile micro-interaction UI design of', suffix: 'mobile micro-interaction design sheet, push notification card, toast message, loading spinner and skeleton, subtle animation state UI, polished mobile app UX detail design' },
    { id: 'med-auth-ui', category: 'ui_ux', nameKo: '로그인·인증 UI', emoji: '🔐', desc: '소셜 로그인·OTP·비밀번호 포함한 인증 화면 UI 디자인', prefix: 'authentication login UI screen design of', suffix: 'login and authentication UI screen, social login buttons, input field states, OTP or 2FA design, clean minimal auth form, security-focused UI design with trust indicator' },
    { id: 'med-data-table-ui', category: 'ui_ux', nameKo: '데이터 테이블 & 관리자 UI', emoji: '📋', desc: '정렬·필터·페이지네이션이 포함된 어드민 데이터 테이블 UI', prefix: 'admin data table management UI design of', suffix: 'admin panel data table UI, sortable column headers, row selection checkboxes, filter and search bar, pagination controls, clean enterprise dashboard table design' },
    { id: 'med-empty-state', category: 'ui_ux', nameKo: '빈 화면 & 에러 UI 일러스트', emoji: '🎨', desc: '404·빈 목록·오류 상태 화면의 일러스트가 있는 UI 디자인', prefix: 'empty state error screen UI illustration of', suffix: 'empty state or error page UI design with friendly illustration, clear message and action button, 404 or no-data state, approachable character or scene illustration, Dribbble UI art direction' },

    // ── pixel_adv ───────────────────────────────────────────────
    {
      id: 'med-iso-pixel-city',
      category: 'pixel_adv',
      nameKo: '아이소메트릭 픽셀 도시',
      emoji: '🏙️',
      desc: '45도 시점의 정교한 아이소메트릭 픽셀 도시 씬',
      prefix: 'isometric pixel art city scene of',
      suffix: 'detailed isometric pixel art, 45-degree view city scene, charming miniature building sprites, lush pixel vegetation and vehicles, vibrant color palette, RPG Maker or Stardew Valley aesthetic'
    },
    {
      id: 'med-dot-art-sprite',
      category: 'pixel_adv',
      nameKo: '도트 아트 스프라이트',
      emoji: '🎯',
      desc: '게임 캐릭터나 아이템을 묘사한 클래식 도트 아트',
      prefix: 'retro dot art sprite of',
      suffix: 'classic dot art pixel sprite, limited color palette with careful dithering, distinct readable silhouette, 16x16 or 32x32 grid scale, retro game pixel character or item sprite sheet style'
    },
    {
      id: 'med-rpg-bg-pixel',
      category: 'pixel_adv',
      nameKo: 'RPG 픽셀 배경 일러스트',
      emoji: '🗡️',
      desc: 'JRPG 스타일의 정교한 픽셀 필드·던전 배경',
      prefix: 'RPG pixel art background scene of',
      suffix: 'detailed RPG pixel art background, JRPG side-scrolling field or dungeon, lush pixel landscape with parallax layers, warm or eerie atmospheric lighting, Final Fantasy or Chrono Trigger style'
    },
    {
      id: 'med-dither-grayscale',
      category: 'pixel_adv',
      nameKo: '디더링 흑백 픽셀 아트',
      emoji: '⬛',
      desc: '디더링 기법으로 명암을 표현한 흑백 픽셀 아트',
      prefix: 'dithering grayscale pixel art of',
      suffix: 'monochrome pixel art with dithering patterns, grayscale value rendering through dot patterns, Game Boy or early Macintosh aesthetic, minimalist retro monochrome pixel style'
    },
    {
      id: 'med-hi-res-pixel',
      category: 'pixel_adv',
      nameKo: '고해상도 픽셀 씬',
      emoji: '🖼️',
      desc: '현대 하이레즈 픽셀 아트의 정교한 대형 씬',
      prefix: 'high resolution detailed pixel art scene of',
      suffix: 'high resolution pixel art, large canvas with intricate pixel detail, painterly color gradients within pixel constraints, modern pixel art movement style, Noitu Love or Hyper Light Drifter aesthetic'
    },
    {
      id: 'med-pixel-particles',
      category: 'pixel_adv',
      nameKo: '픽셀 파티클 이펙트 아트',
      emoji: '✨',
      desc: '빛·마법·폭발 이펙트를 픽셀로 묘사한 이펙트 아트',
      prefix: 'pixel art particle effect visual of',
      suffix: 'stylized pixel particle effects, glowing magic or explosion or energy burst, vibrant color clusters on dark background, game VFX pixel art style, dynamic and energetic composition'
    },
    {
      id: 'med-retro-crt',
      category: 'pixel_adv',
      nameKo: '레트로 CRT 스캔라인 아트',
      emoji: '📺',
      desc: 'CRT 모니터 스캔라인·글로우 필터를 씌운 레트로 픽셀',
      prefix: 'retro CRT monitor scanline pixel art of',
      suffix: 'retro CRT monitor effect on pixel art, visible scanlines and screen curvature, RGB phosphor glow bleeding, classic arcade or early computer game aesthetic, nostalgic retro tech visual'
    },
    {
      id: 'med-pixel-anim-still',
      category: 'pixel_adv',
      nameKo: '픽셀 애니메이션 정지 프레임',
      emoji: '🎞️',
      desc: '애니메이션 루프 중 한 장면을 포착한 생동감 있는 픽셀 프레임',
      prefix: 'pixel animation key frame still of',
      suffix: 'pixel animation keyframe capture, action mid-point with motion blur trails in pixel form, expressive character animation pose, vibrant colors with strong silhouette, GIF animation still frame quality'
    },
    { id: 'med-pixel-portrait', category: 'pixel_adv', nameKo: '픽셀 인물 초상화', emoji: '🧑', desc: '세밀한 음영 처리로 완성된 고해상도 픽셀 인물 초상화', prefix: 'detailed pixel art portrait of', suffix: 'high-resolution pixel art portrait, careful dithering for skin tones and shadow, expressive character face, professional pixel portrait commission style, 64x64 or higher resolution pixel grid' },
    { id: 'med-pixel-landscape', category: 'pixel_adv', nameKo: '픽셀 풍경 파노라마', emoji: '🏞️', desc: '스크롤 게임 배경처럼 레이어드된 픽셀 풍경 파노라마', prefix: 'pixel art landscape panorama of', suffix: 'layered pixel art landscape, parallax scrolling game background aesthetic, foreground midground background depth layers, natural or fantasy scenery in pixel art style, SNES or GBA era quality' },
    { id: 'med-pixel-icon-set', category: 'pixel_adv', nameKo: '픽셀 아이콘 세트 시트', emoji: '🎮', desc: '게임 UI 또는 레트로 앱용 16×16·32×32 픽셀 아이콘 세트', prefix: 'pixel art icon set sheet of', suffix: '16x16 or 32x32 pixel icon set, game UI item icons or retro app icons, consistent pixel grid, limited color palette, clean readable silhouette, RPG inventory or retro OS icon style' },
    { id: 'med-pixel-horror', category: 'pixel_adv', nameKo: '픽셀 호러 & 다크 판타지', emoji: '👻', desc: '한정 팔레트로 공포 분위기를 표현한 픽셀 호러 씬', prefix: 'pixel art horror dark fantasy scene of', suffix: 'pixel art horror or dark fantasy scene, limited dark color palette with accent reds and greens, atmospheric dread and mystery, Undertale or Yume Nikki aesthetic, pixel horror game visual' },
    { id: 'med-pixel-map', category: 'pixel_adv', nameKo: '픽셀 월드맵 & 탑뷰 던전', emoji: '🗺️', desc: 'JRPG 월드맵 또는 탑뷰 던전 픽셀 지도', prefix: 'pixel art world map or dungeon top-view of', suffix: 'pixel art top-view world map or dungeon map, tile-based terrain types, animated sprite marker points, Final Fantasy or Dragon Quest world map style, nostalgic JRPG cartography' },
    { id: 'med-voxel-art', category: 'pixel_adv', nameKo: '복셀 3D 아트', emoji: '🧊', desc: '미니크래프트 스타일 복셀로 구성된 3D 아이소메트릭 씬', prefix: 'voxel 3D art scene of', suffix: 'voxel 3D art isometric composition, Minecraft-style cubic voxel blocks, colorful scene with environmental storytelling, MagicaVoxel software aesthetic, clean 3D voxel render' },
    { id: 'med-demoscene', category: 'pixel_adv', nameKo: '데모씬 & 사이버펑크 픽셀', emoji: '💾', desc: '1980s 데모씬 감성의 사이버펑크 픽셀 아트 스크린', prefix: 'demoscene cyberpunk pixel art screen of', suffix: 'demoscene inspired pixel art, 80s computer art aesthetic, raster bar effects and plasma sine wave patterns, PETSCII or ANSI art character graphics, cyberpunk neon pixel composition' },
    { id: 'med-pixel-cutscene', category: 'pixel_adv', nameKo: '픽셀 컷씬 & 이벤트 스크린', emoji: '🎭', desc: '드라마틱한 게임 컷씬 연출을 픽셀로 표현한 이벤트 화면', prefix: 'pixel art game cutscene event screen of', suffix: 'pixel art game cutscene panel, dramatic story moment with character expression close-up, dialogue box layout, cinematic widescreen letterbox pixel composition, SNES RPG cutscene quality' },

    // ── nature_photo ────────────────────────────────────────────
    {
      id: 'med-golden-hour',
      category: 'nature_photo',
      nameKo: '골든 아워 풍경 사진',
      emoji: '🌅',
      desc: '일출·일몰 황금빛 빛과 그림자의 풍경 사진',
      prefix: 'golden hour landscape photography of',
      suffix: 'golden hour landscape photography, warm orange and amber sunlight, long dramatic shadows, silhouetted elements against glowing sky, rich tonal range, award-winning nature photography quality'
    },
    {
      id: 'med-aurora-long-exp',
      category: 'nature_photo',
      nameKo: '오로라 장노출 사진',
      emoji: '🌌',
      desc: '북극광 아래 별과 오로라를 담은 장노출 천체 사진',
      prefix: 'aurora borealis long exposure astrophotography of',
      suffix: 'aurora borealis long exposure photography, vivid green and violet aurora curtains, star-filled sky with milky way, frozen lake or mountain reflection, stunning astrophotography quality'
    },
    {
      id: 'med-misty-forest',
      category: 'nature_photo',
      nameKo: '안개 숲 분위기 사진',
      emoji: '🌫️',
      desc: '새벽 안개가 자욱한 신비로운 숲 사진',
      prefix: 'misty forest atmospheric photography of',
      suffix: 'misty forest atmospheric photography, morning fog filtering through tall trees, ethereal diffused light, moody green and grey tones, layers of depth into forest darkness, fine art nature photography'
    },
    {
      id: 'med-reflection-symmetry',
      category: 'nature_photo',
      nameKo: '수면 반영 대칭 사진',
      emoji: '🪞',
      desc: '수면에 비친 완벽한 반영으로 만든 대칭 구도 사진',
      prefix: 'perfect reflection symmetry landscape photography of',
      suffix: 'perfect mirror reflection landscape photography, still water symmetrical composition, sky and mountains perfectly reflected, minimalist graphic quality, serene tranquil atmosphere'
    },
    {
      id: 'med-underwater',
      category: 'nature_photo',
      nameKo: '수중 해양 생태 사진',
      emoji: '🐠',
      desc: '산호초·해양생물의 투명한 수중 사진',
      prefix: 'underwater ocean life photography of',
      suffix: 'professional underwater photography, crystal clear tropical ocean, vivid coral reef ecosystem, natural sunbeam caustic light patterns, marine life in natural habitat, National Geographic quality'
    },
    {
      id: 'med-aerial-drone',
      category: 'nature_photo',
      nameKo: '항공 드론 조감 사진',
      emoji: '🚁',
      desc: '드론으로 촬영한 대지의 패턴과 스케일을 담은 항공 사진',
      prefix: 'aerial drone landscape photography of',
      suffix: 'aerial drone photography, bird-eye view top-down or low oblique angle, geometric landscape patterns visible from above, vast scale minimalism, vibrant terrain colors, professional drone photography'
    },
    {
      id: 'med-bw-street-doc',
      category: 'nature_photo',
      nameKo: '흑백 거리 다큐멘터리 사진',
      emoji: '📷',
      desc: '거리의 순간을 담은 흑백 다큐멘터리 스트리트 사진',
      prefix: 'black and white street documentary photography of',
      suffix: 'black and white street photography, decisive moment capture, strong graphic composition, grain film texture, Cartier-Bresson or Vivian Maier inspired, documentary human element'
    },
    {
      id: 'med-studio-still-life',
      category: 'nature_photo',
      nameKo: '스튜디오 정물 제품 사진',
      emoji: '💡',
      desc: '라이팅이 정교하게 세팅된 스튜디오 정물·제품 사진',
      prefix: 'professional studio still life photography of',
      suffix: 'studio still life photography, controlled three-point lighting setup, seamless background paper, crisp product or object detail, commercial photography quality, clean minimal composition'
    },
    { id: 'med-wildlife-photo', category: 'nature_photo', nameKo: '야생동물 자연 다큐 사진', emoji: '🦁', desc: '야생에서 포착한 동물 행동을 담은 내셔널 지오그래픽 스타일 사진', prefix: 'wildlife nature documentary photography of', suffix: 'wildlife nature documentary photograph, decisive moment animal behavior capture, telephoto compressed perspective, National Geographic or BBC Earth quality, natural habitat authentic scene' },
    { id: 'med-storm-sky', category: 'nature_photo', nameKo: '폭풍 & 드라마틱 하늘 사진', emoji: '⛈️', desc: '번개·먹구름·무지개 등 극적인 기상 현상을 포착한 사진', prefix: 'dramatic storm sky weather photography of', suffix: 'dramatic storm or sky weather photograph, cumulonimbus cloud formations or lightning strike, extreme weather documentary style, vivid atmospheric colors, storm chaser photography quality' },
    { id: 'med-season-color', category: 'nature_photo', nameKo: '계절 색채 풍경 사진', emoji: '🍁', desc: '단풍·벚꽃·설경 등 계절 절정의 색채를 담은 풍경 사진', prefix: 'seasonal color landscape photography of', suffix: 'seasonal peak color landscape photograph, autumn foliage or cherry blossom or winter snow, saturated natural color palette, wide angle scenic view, landscape photography competition quality' },
    { id: 'med-ocean-wave', category: 'nature_photo', nameKo: '해양 파도 & 해안 사진', emoji: '🌊', desc: '파도의 역동성과 해안선의 아름다움을 담은 해양 사진', prefix: 'ocean wave coastal photography of', suffix: 'ocean wave or coastal landscape photograph, long exposure silky water or frozen wave splash, dramatic seascape with rocky coastline or sandy beach, Clark Little or Ben Thouard style' },
    { id: 'med-desert-sand', category: 'nature_photo', nameKo: '사막 & 지형 사진', emoji: '🏜️', desc: '광활한 사막과 독특한 지형을 담은 풍경 사진', prefix: 'desert landscape geological formation photography of', suffix: 'desert landscape or geological formation photograph, dramatic shadow lines on sand dunes, vast scale minimalism, abstract aerial perspective, Sahara or Utah desert photography style' },
    { id: 'med-mountain-fog', category: 'nature_photo', nameKo: '산악 & 구름 안개 사진', emoji: '⛰️', desc: '고산 구름·안개·일출이 어우러진 신비로운 산악 사진', prefix: 'mountain fog mist landscape photography of', suffix: 'mountain landscape with fog or mist, layered ridgelines emerging from clouds, ethereal atmospheric perspective, Huangshan or Dolomites style, landscape fine art photography quality' },
    { id: 'med-macro-nature', category: 'nature_photo', nameKo: '접사 마크로 자연 사진', emoji: '🦋', desc: '곤충·꽃·물방울 등 마크로 렌즈로 포착한 미시 자연 세계', prefix: 'macro close-up nature photography of', suffix: 'extreme macro close-up nature photograph, tiny detail revealed at large scale, shallow depth of field bokeh background, insect or dew drop or flower stamen, technical macro photography excellence' },
    { id: 'med-night-sky-photo', category: 'nature_photo', nameKo: '밤하늘 천체 사진', emoji: '🌌', desc: '은하수·별자리·유성우를 담은 천체 풍경 사진', prefix: 'night sky astrophotography of', suffix: 'night sky astrophotography, Milky Way arc over landscape, star trails or meteor shower, dark sky location with foreground interest, long exposure technical excellence, Royce Bair or Daniel Kordan style' },

    // ==================== 17. 유튜브 & 설명영상 (youtube_anim) ====================
    {
      id: 'med-yt-whiteboard',
      category: 'youtube_anim',
      nameKo: '화이트보드 애니메이션',
      emoji: '📝',
      desc: '손그림 스케치, 검은 마커 선, 흰 배경',
      prefix: 'whiteboard animation style of',
      suffix: 'whiteboard animation style, hand-drawn sketch, black marker lines, simple icons, clean white background, educational explainer video, step-by-step visual explanation, minimal color accents'
    },
    {
      id: 'med-yt-flat-vector',
      category: 'youtube_anim',
      nameKo: '플랫 벡터 모션그래픽',
      emoji: '◼️',
      desc: '평면적 인물·도형, 선명한 색면, 깔끔한 레이아웃',
      prefix: 'flat vector illustration motion graphics of',
      suffix: 'flat vector illustration, motion graphics style, clean geometric shapes, simple character design, infographic layout, bold color blocks, modern explainer video, minimal shadows'
    },
    {
      id: 'med-yt-doodle',
      category: 'youtube_anim',
      nameKo: '두들 손그림 일러스트',
      emoji: '✏️',
      desc: '친근한 펜선, 손그림, 포인트 컬러',
      prefix: 'doodle illustration style of',
      suffix: 'doodle illustration style, hand-drawn black ink outlines, playful spontaneous line work, white background, bright yellow accents, coral red highlights, simple cartoon icons, friendly explainer visual'
    },
    {
      id: 'med-yt-historical-doc',
      category: 'youtube_anim',
      nameKo: '사극 다큐 애니메이션',
      emoji: '🏯',
      desc: '역사 다큐 삽화풍, 낮은 채도, 짙은 먹선, 안개 효과',
      prefix: 'cinematic 2D historical documentary animation of',
      suffix: 'cinematic 2D historical documentary animation, Joseon dynasty royal court, muted sepia tones, dark ink outlines, cel-shaded animation, palace mist, solemn political atmosphere, layered character composition, documentary-style historical cutscene mood'
    },
    {
      id: 'med-yt-webtoon-comic',
      category: 'youtube_anim',
      nameKo: '웹툰 만화 컷',
      emoji: '💬',
      desc: '굵은 외곽선, 셀 음영, 컷 분할 레이아웃',
      prefix: 'Korean webtoon style comic panel of',
      suffix: 'Korean webtoon style, comic panel composition, bold outlines, expressive characters, speech bubble space, dramatic facial expressions, clean cel shading, serialized story illustration'
    },
    {
      id: 'med-yt-news-info',
      category: 'youtube_anim',
      nameKo: '뉴스 인포그래픽',
      emoji: '📊',
      desc: '네이비/화이트 톤, 신뢰감 주는 데이터 카드',
      prefix: 'news infographic style editorial design of',
      suffix: 'news infographic style, editorial data visualization, clean charts, map graphics, bold headline area, professional broadcast design, navy and white palette, structured information layout'
    },
    {
      id: 'med-yt-isometric',
      category: 'youtube_anim',
      nameKo: '아이소메트릭 일러스트',
      emoji: '📐',
      desc: '45도 입체 시점, 시스템 및 구조 도식화',
      prefix: 'isometric vector illustration of',
      suffix: 'isometric vector illustration, miniature city system, clean geometric buildings, people icons, connected network lines, public service infrastructure, structured explainer diagram'
    },
    {
      id: 'med-yt-collage',
      category: 'youtube_anim',
      nameKo: '콜라주 에디토리얼 컷아웃',
      emoji: '✂️',
      desc: '종이 질감, 신문 조각, 레이어드 오려내기',
      prefix: 'editorial collage paper cutout style of',
      suffix: 'editorial collage style, paper cutout texture, mixed media illustration, layered newspaper shapes, bold headline space, modern magazine layout, muted colors, conceptual visual metaphor'
    },
    {
      id: 'med-yt-line-pictogram',
      category: 'youtube_anim',
      nameKo: '픽토그램 라인아이콘',
      emoji: '📋',
      desc: '얇고 깔끔한 외곽선, 단계별 가이드, 넓은 여백',
      prefix: 'minimal line icon pictogram style of',
      suffix: 'minimal line icon style, pictogram illustration, thin but clear outlines, clean instructional layout, step-by-step guide, simple color accents, public information design'
    },
    {
      id: 'med-yt-clay-soft',
      category: 'youtube_anim',
      nameKo: '3D 클레이 소프트 오브젝트',
      emoji: '🧸',
      desc: '친근한 무광 클레이, 파스텔 톤, 둥근 입체 형태',
      prefix: 'soft 3D clay illustration of',
      suffix: 'soft 3D clay illustration, matte material, rounded objects, friendly educational visual, clean pastel background, simple icons, no glossy plastic, no toy-like appearance'
    },
    {
      id: 'med-yt-vintage-textbook',
      category: 'youtube_anim',
      nameKo: '레트로 교과서 삽화',
      emoji: '📖',
      desc: '오래된 교과서 삽화, 종이 질감, 낮은 채도',
      prefix: 'vintage textbook illustration of',
      suffix: 'vintage textbook illustration, muted print colors, hand-drawn educational diagram, old paper texture, restrained line art, archival documentary mood'
    },
    {
      id: 'med-yt-diagram',
      category: 'youtube_anim',
      nameKo: '미니멀 다이어그램',
      emoji: '🌀',
      desc: '노드와 선, 흐름 화살표, 시스템 맵 구조',
      prefix: 'minimal diagrammatic illustration of',
      suffix: 'minimal diagrammatic illustration, clean nodes and lines, abstract but clear system map, modern editorial layout, white space, precise typography area, restrained color palette'
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
    'med-yt-diagram': ['photo-1551288049-bebda4e38f71', 'photo-1460925895917-afdab827c52f', 'photo-1581291518633-83b4ebd1d83e']
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
    environment: 'photo-1509391366360-2e959784a276'
  };

  function getSubjectDefaultKeyword(subject) {
    if (!subject) return '';
    return subject.id.replace('mix-', '').replace(/-/g, ' ');
  }

  // Unsplash API — 화풍 스타일 대표 이미지 검색
  // 키는 localStorage에 저장 (소스에 포함하지 않음)
  const UNSPLASH_KEY_STORAGE = 'mixer_unsplash_key';
  const UNSPLASH_CACHE = {};

  // 서버 manifest 캐시 (GET /api/mixer-images 로 로드)
  // localStorage 보다 우선 적용 → 브라우저·기기 무관 공유
  let MIXER_SERVER_MANIFEST = {};

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

  // 커스텀 이미지 — 서버 manifest 우선, localStorage 폴백
  const MIXER_CUSTOM_KEY = 'mixer_custom_samples_v1';
  function _getCustomAll() {
    try { return JSON.parse(localStorage.getItem(MIXER_CUSTOM_KEY) || '{}'); } catch { return {}; }
  }

  async function loadMixerManifest() {
    try {
      const res = await fetch('/api/mixer-images');
      if (!res.ok) return;
      const data = await res.json();
      if (data.ok && data.images && typeof data.images === 'object') {
        MIXER_SERVER_MANIFEST = data.images;
      }
    } catch (_) { /* 정적 서빙 환경 또는 오프라인 — localStorage 폴백 사용 */ }
  }

  function getCustomSamplesForMed(medId) {
    // 서버 manifest 우선
    const srv = MIXER_SERVER_MANIFEST[medId];
    if (Array.isArray(srv) && srv.some(Boolean)) return srv.slice(0, 3);
    // localStorage 폴백
    return (_getCustomAll()[medId] || [null, null, null]).slice(0, 3);
  }

  function setCustomSample(medId, idx, url) {
    // localStorage 빠른 캐시
    const all = _getCustomAll();
    if (!all[medId]) all[medId] = [null, null, null];
    all[medId][idx] = url;
    localStorage.setItem(MIXER_CUSTOM_KEY, JSON.stringify(all));
    // 인메모리 manifest 동기 반영
    if (!Array.isArray(MIXER_SERVER_MANIFEST[medId])) MIXER_SERVER_MANIFEST[medId] = [null, null, null];
    while (MIXER_SERVER_MANIFEST[medId].length <= idx) MIXER_SERVER_MANIFEST[medId].push(null);
    MIXER_SERVER_MANIFEST[medId][idx] = url;
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
  const PALETTE_CATEGORIES = [
    { id: 'tech', label: '🌐 테크 & 미래지향' },
    { id: 'nature', label: '🌿 자연 & 친환경' },
    { id: 'energy', label: '🔥 에너지 & 액티브' },
    { id: 'soft', label: '🌸 감성 & 클래식' },
    { id: 'official', label: '🏛️ 공공 & 기관' },
    { id: 'light_pastel', label: '🌸 파스텔 라이트' },
    { id: 'morning', label: '☀️ 모닝 & 에어리' },
    { id: 'nordic', label: '🏔️ 노르딕 & 스칸디' },
    { id: 'candy', label: '🍬 캔디 & 팝 비비드' },
    { id: 'warm_earth', label: '🌿 웜 어스 & 내추럴' },
    { id: 'multicolor', label: '🎨 멀티컬러 & 비비드' }
  ];

  const MIXER_PALETTES = [
    {
      id: 'none',
      category: 'all',
      name: '선택안함',
      mode: 'light',
      colors: [],
      colorMapping: '본연의 색'
    },
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
    { id: 'pal-holographic', category: 'tech', name: '홀로그래픽 레인보우', mode: 'dark', colors: ['#0A0A1A', '#1A0A3A', '#3D1A8F', '#FF00CC', '#00FFFF'], colorMapping: 'deep space black background, dark violet base, holographic rainbow spectrum shift, iridescent magenta and cyan highlights' },
    { id: 'pal-stealth-tech', category: 'tech', name: '스텔스 테크 블랙', mode: 'dark', colors: ['#030303', '#0D0D0D', '#1A1A1A', '#2D2D2D', '#00B4D8'], colorMapping: 'absolute black background, charcoal shadows, dark steel midtones, graphite surfaces, single electric blue accent' },
    { id: 'pal-plasma-blue', category: 'tech', name: '플라즈마 블루 리액터', mode: 'dark', colors: ['#000B1E', '#001A4A', '#002FA8', '#0062FF', '#80B3FF'], colorMapping: 'deep navy-black background, dark marine blue shadows, intense plasma blue core, electric sky blue highlights' },
    { id: 'pal-biotech-teal', category: 'tech', name: '바이오테크 틸 & 그린', mode: 'dark', colors: ['#041A15', '#083328', '#0F6650', '#00CC88', '#A0FFDC'], colorMapping: 'deep bio-black background, dark teal shadows, bioluminescent emerald midtones, neon mint green highlights' },
    { id: 'pal-sunset-circuit', category: 'tech', name: '선셋 서킷 골드', mode: 'dark', colors: ['#150A00', '#3D1F00', '#7A3D00', '#FF8C00', '#FFD700'], colorMapping: 'deep burnt-black background, dark burnt orange shadows, amber circuit lines, bright orange highlight, gold accent nodes' },
    { id: 'pal-radioactive', category: 'tech', name: '라디오액티브 옐로우 그린', mode: 'dark', colors: ['#060F00', '#0F2200', '#244400', '#64FF00', '#CCFF66'], colorMapping: 'dark toxic black base, deep military green shadows, radioactive bright green core, neon lime yellow highlights' },
    { id: 'pal-dark-rose-tech', category: 'tech', name: '다크 로즈 테크', mode: 'dark', colors: ['#1A0010', '#3D0025', '#8B005A', '#FF0090', '#FF80C8'], colorMapping: 'dark crimson-black base, deep wine shadows, electric rose-pink highlights, bright hot pink accent' },
    { id: 'pal-ice-core', category: 'tech', name: '아이스 코어 화이트', mode: 'dark', colors: ['#F0F4FF', '#C8D8FF', '#90B4FF', '#4A90E2', '#1A3A8F'], colorMapping: 'crisp ice-white surface, pale blue midtones, cool sky blue highlights, deep navy shadows, precise tech aesthetic' },

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
    { id: 'pal-ocean-deep', category: 'nature', name: '오션 딥 블루', mode: 'dark', colors: ['#010D1A', '#022A4A', '#0A5C8A', '#1A8FBF', '#7DD4EC'], colorMapping: 'deep ocean black-blue shadows, dark indigo depths, rich cerulean midtones, bright sky-blue highlights, pale aqua shimmer' },
    { id: 'pal-morning-dew', category: 'nature', name: '모닝 듀 그린', mode: 'light', colors: ['#E8F5E9', '#C8E6C9', '#81C784', '#388E3C', '#1B5E20'], colorMapping: 'pale mint-white background, soft celadon midtones, fresh grass-green highlights, deep forest green shadows' },
    { id: 'pal-coral-reef', category: 'nature', name: '산호초 코랄 & 청록', mode: 'light', colors: ['#FF7043', '#FF8A65', '#FFB74D', '#4DD0E1', '#00838F'], colorMapping: 'warm coral orange primary, soft peach midtones, golden sand accents, clear turquoise blue highlights, deep teal depth' },
    { id: 'pal-cherry-forest', category: 'nature', name: '체리 포레스트 레드', mode: 'dark', colors: ['#1A0507', '#3D0A10', '#7A1521', '#CC1F30', '#FFADBA'], colorMapping: 'deep mahogany-black shadows, dark burgundy midtones, vivid cherry-red highlights, soft rose-pink accents' },
    { id: 'pal-arctic-snow', category: 'nature', name: '북극 스노우 화이트', mode: 'light', colors: ['#FFFFFF', '#EFF4FF', '#C5D9FF', '#7EB3F8', '#2B6CB0'], colorMapping: 'pure white snow surface, pale ice-blue shadow, cool blue-grey midtones, clear sky blue highlights, deep navy anchors' },
    { id: 'pal-amber-wood', category: 'nature', name: '앰버 우드 & 오크', mode: 'light', colors: ['#FFF8E1', '#FFECB3', '#FFD54F', '#FF8F00', '#4E342E'], colorMapping: 'warm cream white background, soft amber highlights, golden honey midtones, rich burnt orange accents, deep espresso-brown shadows' },
    { id: 'pal-midnight-jungle', category: 'nature', name: '미드나잇 정글 그린', mode: 'dark', colors: ['#071215', '#0E2B25', '#1D5C4A', '#2E9970', '#8AFFC1'], colorMapping: 'dark midnight jungle backdrop, deep mangrove shadows, vibrant rainforest green midtones, luminous mint-teal highlights' },
    { id: 'pal-lava-rock', category: 'nature', name: '라바 록 & 애쉬', mode: 'dark', colors: ['#0F0800', '#2B1500', '#6B3500', '#CC5200', '#FF9A3C'], colorMapping: 'volcanic black-charcoal base, deep lava-rock shadows, molten orange midtones, bright ember highlights, warm ash-orange accents' },

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
    { id: 'pal-thunder-yellow', category: 'energy', name: '천둥 옐로우 & 블랙', mode: 'dark', colors: ['#0A0A00', '#1F1F00', '#5C5C00', '#FFD600', '#FFFF66'], colorMapping: 'electric black background, dark khaki shadows, bold chrome-yellow strike, vivid gold highlights, neon yellow sparks' },
    { id: 'pal-magma-red', category: 'energy', name: '마그마 레드 & 오렌지', mode: 'dark', colors: ['#100000', '#380000', '#8B0000', '#E53935', '#FF8A65'], colorMapping: 'deep magma-black background, dark crimson shadows, intense red core, bright scarlet highlights, warm orange surface glow' },
    { id: 'pal-sprint-lime', category: 'energy', name: '스프린트 라임 & 블랙', mode: 'dark', colors: ['#020800', '#0A1A00', '#1F3D00', '#7FBF00', '#C8FF33'], colorMapping: 'athletic black base, dark military green shadows, bold lime green midtones, vivid electric lime highlights' },
    { id: 'pal-cobalt-charge', category: 'energy', name: '코발트 차지 블루', mode: 'dark', colors: ['#000816', '#001533', '#003080', '#0050E6', '#66A3FF'], colorMapping: 'deep navy black background, dark indigo base, vibrant cobalt blue energy field, bright electric blue highlights' },
    { id: 'pal-ice-sprint', category: 'energy', name: '아이스 스프린트 쿨', mode: 'light', colors: ['#F0FAFF', '#C3EDFF', '#7DD3F8', '#0EA5E9', '#0369A1'], colorMapping: 'crisp ice white surface, cool mist blue base, vivid sky blue highlights, deep ocean blue anchors' },
    { id: 'pal-acid-green', category: 'energy', name: '애시드 그린 & 퍼플', mode: 'dark', colors: ['#0A0014', '#1C0030', '#580070', '#B000E0', '#A8FF00'], colorMapping: 'deep void-black background, dark purple base, vibrant violet midtones, sharp acid-green contrast highlight' },
    { id: 'pal-sunset-fire', category: 'energy', name: '선셋 파이어 그라디언트', mode: 'dark', colors: ['#1A0010', '#5C0028', '#B5003C', '#FF4500', '#FF9900'], colorMapping: 'deep dusk-crimson background, dark maroon shadows, vivid fire-red midtones, bright orange flame highlights, warm amber glow' },
    { id: 'pal-titanium', category: 'energy', name: '티타늄 실버 & 크롬', mode: 'dark', colors: ['#0C0C0C', '#1C1C1C', '#404040', '#7A7A7A', '#E8E8E8'], colorMapping: 'dark charcoal black base, gunmetal shadows, titanium grey midtones, brushed silver highlights, chrome-white specular' },

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
    },
    { id: 'pal-dusty-rose', category: 'soft', name: '더스티 로즈 & 그레이', mode: 'light', colors: ['#FDF0F0', '#F5CACA', '#D4888A', '#9E4E52', '#4A1F22'], colorMapping: 'pale blush white background, soft rose highlights, dusty mauve midtones, deep muted burgundy shadows' },
    { id: 'pal-indigo-dream', category: 'soft', name: '인디고 드림 퍼플', mode: 'dark', colors: ['#0F0A2A', '#221555', '#4B3B9A', '#8B7DD8', '#D4CDFF'], colorMapping: 'deep indigo-black backdrop, muted violet shadows, classic indigo midtones, soft lavender highlights, dreamy pale violet accents' },
    { id: 'pal-sage-mist', category: 'soft', name: '세이지 미스트 그린', mode: 'light', colors: ['#F4F7F0', '#D8E8D0', '#9DC4A0', '#5A8A60', '#2E5734'], colorMapping: 'fog-white background, pale celadon base, soft sage green highlights, muted forest midtones, deep botanical shadow' },
    { id: 'pal-caramel-latte', category: 'soft', name: '카라멜 라떼 브라운', mode: 'light', colors: ['#FFF8F0', '#FFE4C4', '#D4A06A', '#8B6242', '#3E2B1A'], colorMapping: 'creamy milk white background, warm caramel highlights, espresso brown midtones, dark chocolate shadow' },
    { id: 'pal-vintage-navy', category: 'soft', name: '빈티지 네이비 & 크림', mode: 'dark', colors: ['#0A1628', '#1A2E4A', '#2E4A72', '#8A9BC4', '#F5E8D0'], colorMapping: 'dark navy background, deep ocean blue shadows, muted slate-blue midtones, soft periwinkle highlights, warm vintage cream accents' },
    { id: 'pal-terracotta-soft', category: 'soft', name: '소프트 테라코타 & 베이지', mode: 'light', colors: ['#FFF4EC', '#FFD9B7', '#D4845A', '#A05030', '#5C2E18'], colorMapping: 'warm ivory background, soft peach highlights, terracotta clay midtones, burnt sienna shadows, dark mahogany anchor' },
    { id: 'pal-tiffany', category: 'soft', name: '티파니 블루 & 크림', mode: 'light', colors: ['#FAFAFA', '#E0F5F5', '#8FD5D5', '#3DADA8', '#1A6363'], colorMapping: 'clean white background, pale aqua base, signature tiffany blue midtones, deep teal accents, luxury fresh tone' },
    { id: 'pal-plum-velvet', category: 'soft', name: '플럼 벨벳 바이올렛', mode: 'dark', colors: ['#1A0A24', '#3D1555', '#6E2FAA', '#B070E0', '#E8C0FF'], colorMapping: 'deep plum-black background, dark mulberry shadows, rich violet midtones, soft lavender highlights, delicate pale lilac accents' },

    // ==========================================
    // 5. 공공 & 기관 (official) - 8 items
    // ==========================================
    {
      id: 'pal-gov-blue',
      category: 'official',
      name: '대한민국 정부 공식 블루',
      mode: 'light',
      colors: ['#003087', '#0047AB', '#1565C0', '#4FC3F7', '#E3F2FD'],
      colorMapping: 'deep Korean government navy blue, official cobalt blue midtones, clear sky blue highlights, soft blue-white light accents'
    },
    {
      id: 'pal-gyeongbuk',
      category: 'official',
      name: '경상북도 대표 컬러',
      mode: 'light',
      colors: ['#1A3C6E', '#2E6DA4', '#5BA4D1', '#FFB800', '#FFF8E1'],
      colorMapping: 'deep Gyeongbuk navy blue, medium sky blue, bright traditional gold accent, warm cream background'
    },
    {
      id: 'pal-pohang-city',
      category: 'official',
      name: '포항 스틸 오렌지',
      mode: 'dark',
      colors: ['#0D1B2A', '#1B3A5C', '#FF4D00', '#FF8C42', '#FFD6B3'],
      colorMapping: 'deep steel-dark navy background, industrial blue shadows, signature Pohang molten steel orange, warm amber highlights'
    },
    {
      id: 'pal-technopark-green',
      category: 'official',
      name: '테크노파크 혁신 그린',
      mode: 'light',
      colors: ['#004D40', '#00796B', '#26A69A', '#B2DFDB', '#E0F2F1'],
      colorMapping: 'deep innovation teal, vibrant teal midtones, light mint highlights, soft aqua-white ambient, representing growth and technology'
    },
    {
      id: 'pal-steel-industrial',
      category: 'official',
      name: '산업부 스틸 그레이',
      mode: 'dark',
      colors: ['#1A1A2E', '#16213E', '#0F3460', '#A8A8B3', '#E0E0E0'],
      colorMapping: 'deep charcoal industrial background, dark steel blue shadows, neutral silver metallic midtones, bright steel white highlights'
    },
    {
      id: 'pal-esg-public',
      category: 'official',
      name: 'ESG 공공 그린',
      mode: 'light',
      colors: ['#1B5E20', '#388E3C', '#81C784', '#A5D6A7', '#F1F8E9'],
      colorMapping: 'deep forest policy green, vibrant eco green, light leaf green highlights, pastel mint accents, clean white-green background'
    },
    {
      id: 'pal-white-premium',
      category: 'official',
      name: '공공기관 화이트 프리미엄',
      mode: 'light',
      colors: ['#1A237E', '#283593', '#3949AB', '#7986CB', '#F5F5F5'],
      colorMapping: 'deep formal navy blue, regal indigo midtones, medium periwinkle, light lavender accents, clean white premium background'
    },
    {
      id: 'pal-safety-orange',
      category: 'official',
      name: '공공 안전 오렌지',
      mode: 'dark',
      colors: ['#1A0A00', '#BF360C', '#E64A19', '#FF7043', '#FFCCBC'],
      colorMapping: 'dark industrial background, deep warning red shadows, bold safety orange accent, warm coral highlights, light peach ambient'
    },
    { id: 'pal-public-teal', category: 'official', name: '공공 테크 틸', mode: 'light', colors: ['#002B33', '#004D5C', '#00838F', '#4DD0E1', '#E0F7FA'], colorMapping: 'deep teal government background, dark ocean shadows, smart city teal midtones, bright aqua highlights, clean pale sky accents' },
    { id: 'pal-ministry-forest', category: 'official', name: '산림청 포레스트', mode: 'light', colors: ['#F1F8E9', '#DCEDC8', '#8BC34A', '#33691E', '#1B3A0D'], colorMapping: 'pale nature-white background, soft lime accents, fresh leaf-green midtones, deep forest green shadows' },
    { id: 'pal-welfare-purple', category: 'official', name: '사회복지 보라 & 베이지', mode: 'light', colors: ['#FBF8FF', '#EDE7F6', '#B39DDB', '#6A1B9A', '#2E003E'], colorMapping: 'soft white background, pale lilac base, warm violet midtones, rich purple accents, deep plum anchor' },
    { id: 'pal-tax-gold', category: 'official', name: '세무 골드 & 다크 블루', mode: 'dark', colors: ['#0A1628', '#1A2E4A', '#2E4A72', '#C8A84A', '#FFD980'], colorMapping: 'formal navy background, dark steel-blue shadows, dignified gold midtones, bright warm gold highlights' },
    { id: 'pal-emergency-red', category: 'official', name: '재난 대응 레드 & 화이트', mode: 'dark', colors: ['#1A0000', '#5C0000', '#B71C1C', '#F44336', '#FFFFFF'], colorMapping: 'dark alert-black background, deep crisis-red shadows, bold emergency red highlights, stark white contrast signal' },
    { id: 'pal-court-navy', category: 'official', name: '사법부 네이비 & 골드', mode: 'dark', colors: ['#080C14', '#14243A', '#2A4880', '#4A72C0', '#C8A84A'], colorMapping: 'deep formal navy backdrop, dark charcoal-blue shadows, dignified steel-blue midtones, authoritative gold accents' },
    { id: 'pal-education-sky', category: 'official', name: '교육부 스카이 블루', mode: 'light', colors: ['#F0F8FF', '#BBDEFB', '#64B5F6', '#1565C0', '#0D3B8A'], colorMapping: 'clear sky-white background, pale azure highlights, bright educational blue midtones, deep navy shadows' },
    { id: 'pal-defense-grey', category: 'official', name: '국방 밀리터리 그레이', mode: 'dark', colors: ['#0A0C0A', '#1C2118', '#3A4232', '#6B7A5C', '#B0B8A2'], colorMapping: 'dark military black-green base, olive-grey shadows, field grey midtones, dusty sage highlights, pale khaki accents' },

    // ==========================================
    // 6. 파스텔 라이트 (light_pastel) - 8 items
    // ==========================================
    {
      id: 'pal-cherry-blossom',
      category: 'light_pastel',
      name: '체리 블라썸',
      mode: 'light',
      colors: ['#FFF0F5', '#FFD6E0', '#FFB3C6', '#FF8FAB', '#C9184A'],
      colorMapping: 'pure white petal background, blush pink ambient, soft pink mid-tone, vivid cherry accent, deep rose emphasis'
    },
    {
      id: 'pal-lavender-mist',
      category: 'light_pastel',
      name: '라벤더 미스트',
      mode: 'light',
      colors: ['#F8F5FF', '#E9D8FD', '#D6BCFA', '#B794F4', '#6B46C1'],
      colorMapping: 'airy white-lavender background, pale violet ambient, soft lavender mid-tone, medium purple accent, deep violet emphasis'
    },
    {
      id: 'pal-sky-cotton',
      category: 'light_pastel',
      name: '스카이 코튼',
      mode: 'light',
      colors: ['#F0F9FF', '#BAE6FD', '#7DD3FC', '#38BDF8', '#0369A1'],
      colorMapping: 'cloud white background, baby sky blue ambient, light cornflower mid-tone, bright sky accent, ocean blue emphasis'
    },
    {
      id: 'pal-mint-cream',
      category: 'light_pastel',
      name: '민트 크림',
      mode: 'light',
      colors: ['#F0FFFA', '#C6F6D5', '#9AE6B4', '#68D391', '#276749'],
      colorMapping: 'cream white background, whisper mint ambient, soft sage mid-tone, fresh mint accent, forest green emphasis'
    },
    {
      id: 'pal-peach-sorbet',
      category: 'light_pastel',
      name: '피치 소르베',
      mode: 'light',
      colors: ['#FFF7ED', '#FED7AA', '#FDBA74', '#FB923C', '#C2410C'],
      colorMapping: 'warm cream background, apricot ambient, soft peach mid-tone, bright orange accent, terracotta emphasis'
    },
    {
      id: 'pal-sunshine-yellow',
      category: 'light_pastel',
      name: '선샤인 옐로우',
      mode: 'light',
      colors: ['#FFFBEB', '#FEF3C7', '#FDE68A', '#FCD34D', '#D97706'],
      colorMapping: 'soft butter background, pale lemon ambient, golden yellow mid-tone, bright sun accent, amber honey emphasis'
    },
    {
      id: 'pal-rose-quartz',
      category: 'light_pastel',
      name: '로즈 쿼츠',
      mode: 'light',
      colors: ['#FFF5F7', '#FED7E2', '#FBB6CE', '#F687B3', '#B83280'],
      colorMapping: 'white rose background, blush ambient, dusty rose mid-tone, vibrant pink accent, deep magenta emphasis'
    },
    {
      id: 'pal-lilac-spring',
      category: 'light_pastel',
      name: '라일락 스프링',
      mode: 'light',
      colors: ['#FAF5FF', '#EDE9FE', '#DDD6FE', '#A78BFA', '#5B21B6'],
      colorMapping: 'white lilac background, soft purple ambient, medium violet mid-tone, vivid amethyst accent, deep purple emphasis'
    },
    { id: 'pal-pistachio', category: 'light_pastel', name: '피스타치오 그린 파스텔', mode: 'light', colors: ['#F4FBF2', '#D9F0D3', '#A8DDA0', '#5CB85C', '#2E7D32'], colorMapping: 'mint-white background, pale lettuce-green base, soft pistachio midtones, fresh green accent, deep forest shadow' },
    { id: 'pal-baby-blue', category: 'light_pastel', name: '베이비 블루 & 클라우드', mode: 'light', colors: ['#F0F8FF', '#DBEEFF', '#AACCF5', '#5A96D8', '#1A5FAA'], colorMapping: 'cloud white background, pale sky blue base, soft cornflower midtones, bright baby blue highlight, deep azure anchor' },
    { id: 'pal-apricot', category: 'light_pastel', name: '아프리코트 오렌지 파스텔', mode: 'light', colors: ['#FFF8F0', '#FFE4CC', '#FFBA85', '#E8823A', '#7A3A10'], colorMapping: 'cream white background, soft apricot base, warm tangerine midtones, vivid peach-orange highlight, dark rust shadow' },
    { id: 'pal-powder-green', category: 'light_pastel', name: '파우더 그린 & 화이트', mode: 'light', colors: ['#FAFFFE', '#DCFBF5', '#A7EEE2', '#4BC9B8', '#19706A'], colorMapping: 'pure white background, lightest aqua base, soft powder-green midtones, vivid teal highlight, dark jade shadow' },
    { id: 'pal-butter-yellow', category: 'light_pastel', name: '버터 옐로우 파스텔', mode: 'light', colors: ['#FFFEF0', '#FFFBC0', '#FFE870', '#EDB800', '#7A5800'], colorMapping: 'cream white background, light butter yellow base, warm sunflower midtones, vivid golden yellow highlight, deep amber shadow' },
    { id: 'pal-nude-blush', category: 'light_pastel', name: '누드 블러시 & 베이지', mode: 'light', colors: ['#FFF7F4', '#FFEBDB', '#F5CDBC', '#D49A84', '#6B3C28'], colorMapping: 'warm white background, soft nude base, blush rose midtones, muted terracotta highlight, deep cocoa anchor' },
    { id: 'pal-sky-iris', category: 'light_pastel', name: '스카이 아이리스 블루바이올렛', mode: 'light', colors: ['#F5F5FF', '#DCDCFF', '#B0B0FF', '#7070E8', '#2A2A99'], colorMapping: 'pale white background, lavender mist base, periwinkle midtones, vivid blue-violet highlight, deep iris shadow' },
    { id: 'pal-cotton-white', category: 'light_pastel', name: '코튼 화이트 & 밀크', mode: 'light', colors: ['#FFFFFF', '#FAF9F7', '#F5F0EA', '#E8DDD0', '#B0A090'], colorMapping: 'pure white surface, warm cotton base, soft milk midtones, creamy linen highlight, gentle taupe shadow' },

    // ==========================================
    // 7. 모닝 & 에어리 (morning) - 8 items
    // ==========================================
    {
      id: 'pal-golden-hour-light',
      category: 'morning',
      name: '골든 아워 라이트',
      mode: 'light',
      colors: ['#FFFAF0', '#FEF9C3', '#FEF08A', '#FACC15', '#CA8A04'],
      colorMapping: 'warm white background, soft lemon ambient, golden yellow mid-tone, bright gold accent, amber emphasis'
    },
    {
      id: 'pal-cloud-nine',
      category: 'morning',
      name: '클라우드 나인',
      mode: 'light',
      colors: ['#FFFFFF', '#F1F5F9', '#E2E8F0', '#94A3B8', '#334155'],
      colorMapping: 'pure white background, cloud grey ambient, light silver mid-tone, cool slate accent, charcoal emphasis'
    },
    {
      id: 'pal-cerulean-sky',
      category: 'morning',
      name: '세룰리안 스카이',
      mode: 'light',
      colors: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#60A5FA', '#1D4ED8'],
      colorMapping: 'sky white background, pale blue ambient, cornflower mid-tone, cerulean accent, strong blue emphasis'
    },
    {
      id: 'pal-spring-meadow',
      category: 'morning',
      name: '스프링 메도우',
      mode: 'light',
      colors: ['#F0FDF4', '#DCFCE7', '#BBF7D0', '#4ADE80', '#15803D'],
      colorMapping: 'pure white-green background, spring grass ambient, fresh sage mid-tone, vivid meadow accent, forest emphasis'
    },
    {
      id: 'pal-aurora-light',
      category: 'morning',
      name: '오로라 라이트',
      mode: 'light',
      colors: ['#F0FFF4', '#C6F6D5', '#B2F5EA', '#76E4F7', '#0694A2'],
      colorMapping: 'airy mint background, soft aurora green ambient, teal transition mid-tone, bright cyan accent, deep teal emphasis'
    },
    {
      id: 'pal-morning-rose',
      category: 'morning',
      name: '모닝 로즈',
      mode: 'light',
      colors: ['#FFF1F2', '#FFE4E6', '#FECDD3', '#FB7185', '#BE123C'],
      colorMapping: 'white blush background, petal pink ambient, warm rose mid-tone, vivid coral-rose accent, deep crimson emphasis'
    },
    {
      id: 'pal-marigold',
      category: 'morning',
      name: '메리골드',
      mode: 'light',
      colors: ['#FFFBEB', '#FEF3C7', '#FDE68A', '#F59E0B', '#92400E'],
      colorMapping: 'warm vanilla background, honey amber ambient, golden marigold mid-tone, deep amber accent, warm brown emphasis'
    },
    {
      id: 'pal-tropical-mist',
      category: 'morning',
      name: '트로피컬 미스트',
      mode: 'light',
      colors: ['#ECFDF5', '#D1FAE5', '#A7F3D0', '#34D399', '#065F46'],
      colorMapping: 'tropical white background, light seafoam ambient, fresh emerald mid-tone, vibrant teal-green accent, deep jungle emphasis'
    },
    { id: 'pal-dawn-pink', category: 'morning', name: '새벽 핑크 & 코랄', mode: 'light', colors: ['#FFF0F5', '#FFD6E8', '#FFB0CC', '#FF6F9E', '#9C2855'], colorMapping: 'dawn blush-white background, pale flamingo base, warm rose midtones, vivid dawn-coral highlight, deep raspberry shadow' },
    { id: 'pal-morning-lavender', category: 'morning', name: '모닝 라벤더 & 퍼플', mode: 'light', colors: ['#F9F5FF', '#EEE3FF', '#D4B8FF', '#9C6BFF', '#4A0099'], colorMapping: 'pale white background, soft lavender base, morning violet midtones, vivid purple highlight, deep aubergine shadow' },
    { id: 'pal-first-light', category: 'morning', name: '퍼스트 라이트 오렌지', mode: 'light', colors: ['#FFFAF0', '#FFE8C8', '#FFD08A', '#FFA040', '#7A4010'], colorMapping: 'ivory dawn background, soft golden cream base, warm amber midtones, vivid first-light orange highlight, deep tawny shadow' },
    { id: 'pal-mist-grey', category: 'morning', name: '미스트 그레이 & 블루', mode: 'light', colors: ['#F8FAFB', '#E8EAEE', '#C0C8D8', '#7890B8', '#2A3F68'], colorMapping: 'morning mist white background, pale grey-blue base, cool haze midtones, dusty slate-blue highlight, deep navy shadow' },
    { id: 'pal-morning-mint', category: 'morning', name: '모닝 민트 & 화이트', mode: 'light', colors: ['#F5FFFC', '#C8F5EA', '#80E8D0', '#30C0A8', '#0A6060'], colorMapping: 'fresh mint-white background, pale aqua base, soft spearmint midtones, vivid mint-teal highlight, deep jade shadow' },
    { id: 'pal-sun-haze', category: 'morning', name: '선 헤이즈 크림 & 옐로우', mode: 'light', colors: ['#FFFEF8', '#FFFCE0', '#FFF5A0', '#FFE040', '#AA8800'], colorMapping: 'warm cream background, pale butter base, soft sun-haze yellow midtones, vivid morning gold highlight, deep amber shadow' },
    { id: 'pal-morning-ocean', category: 'morning', name: '모닝 오션 블루', mode: 'light', colors: ['#F0FAFF', '#C8EDFF', '#80CFFF', '#28A8F0', '#0050A0'], colorMapping: 'sky-white background, light cloud-blue base, soft morning sea midtones, vivid cornflower highlight, deep ocean shadow' },
    { id: 'pal-spring-breeze', category: 'morning', name: '봄 산들바람 & 그린', mode: 'light', colors: ['#F5FFF8', '#D0F5DC', '#90E0AC', '#30B060', '#0A5028'], colorMapping: 'fresh white background, pale mint-green base, soft spring leaf midtones, vivid grass-green highlight, deep forest shadow' },

    // ==========================================
    // 8. 노르딕 & 스칸디 (nordic) - 8 items
    // ==========================================
    {
      id: 'pal-nordic-birch',
      category: 'nordic',
      name: '노르딕 버치',
      mode: 'light',
      colors: ['#FAFAF9', '#F5F0EB', '#E5D5C0', '#C4A882', '#6B4C2A'],
      colorMapping: 'white birch background, warm linen ambient, sand beige mid-tone, warm tan accent, birch bark emphasis'
    },
    {
      id: 'pal-fjord-blue',
      category: 'nordic',
      name: '피오르드 블루',
      mode: 'light',
      colors: ['#F0F4F8', '#D9E2EC', '#BCCCDC', '#627D98', '#1F3A5F'],
      colorMapping: 'pale sky background, misty grey-blue ambient, fjord mid-tone, steely blue accent, deep ocean emphasis'
    },
    {
      id: 'pal-tundra-moss',
      category: 'nordic',
      name: '툰드라 모스',
      mode: 'light',
      colors: ['#F4F6EE', '#E8EDDF', '#CFD8AC', '#8D9E6B', '#4A5E33'],
      colorMapping: 'pale grey-green background, soft sage ambient, dusty moss mid-tone, muted olive accent, dark forest emphasis'
    },
    {
      id: 'pal-nordic-sand',
      category: 'nordic',
      name: '노르딕 샌드',
      mode: 'light',
      colors: ['#FDFCFB', '#F7F2EC', '#EDE0CD', '#D4B896', '#7C5C3A'],
      colorMapping: 'pure white-warm background, soft dune ambient, sandy beige mid-tone, warm camel accent, rich coffee emphasis'
    },
    {
      id: 'pal-midnight-sun',
      category: 'nordic',
      name: '미드나잇 선 라이트',
      mode: 'light',
      colors: ['#FFFBF0', '#FFF3CD', '#FFE4A0', '#FFD166', '#B8860B'],
      colorMapping: 'champagne white background, pale amber ambient, golden light mid-tone, midnight sun gold accent, dark gold emphasis'
    },
    {
      id: 'pal-lapland-rose',
      category: 'nordic',
      name: '라플란드 로즈',
      mode: 'light',
      colors: ['#FDF8F8', '#F9EBEA', '#F2D2CE', '#E8A89B', '#B55A4A'],
      colorMapping: 'white rose background, blush tundra ambient, dusty salmon mid-tone, warm clay-rose accent, terracotta emphasis'
    },
    {
      id: 'pal-scandi-teal',
      category: 'nordic',
      name: '스칸디 틸',
      mode: 'light',
      colors: ['#F0FAFA', '#CCEBEB', '#99D6D6', '#5BBCBC', '#206060'],
      colorMapping: 'ice white background, pale aqua ambient, Nordic teal mid-tone, bright teal accent, dark sea emphasis'
    },
    {
      id: 'pal-hygge-grey',
      category: 'nordic',
      name: '히게 그레이',
      mode: 'light',
      colors: ['#FAFAFA', '#F0EFED', '#DCD9D4', '#ABA9A3', '#3D3B38'],
      colorMapping: 'off-white background, warm grey ambient, cozy greige mid-tone, medium grey accent, charcoal emphasis'
    },
    { id: 'pal-aurora-nordic', category: 'nordic', name: '오로라 노르딕 나이트', mode: 'dark', colors: ['#060C14', '#0E1E30', '#1A3C5C', '#00C8A8', '#B8F5E8'], colorMapping: 'arctic night black-navy background, deep polar sea shadows, dark teal midtones, vivid aurora green highlights, pale mint glow accents' },
    { id: 'pal-nordic-clay', category: 'nordic', name: '노르딕 클레이 테라', mode: 'light', colors: ['#FAF6F2', '#EDE0D4', '#C8A88C', '#8C6040', '#3C2A18'], colorMapping: 'warm white background, soft clay base, Nordic terracotta midtones, muted sienna highlight, dark espresso anchor' },
    { id: 'pal-scandi-sage', category: 'nordic', name: '스칸디 세이지 & 화이트', mode: 'light', colors: ['#F8FBF7', '#E0EDD8', '#A8C89A', '#5A8A48', '#254018'], colorMapping: 'pure white background, pale sage base, fresh Scandinavian green midtones, muted olive highlight, deep forest anchor' },
    { id: 'pal-nordic-navy', category: 'nordic', name: '노르딕 네이비 & 크림', mode: 'dark', colors: ['#0E1624', '#1C2E44', '#2E4A6E', '#8CAAC8', '#F0ECD8'], colorMapping: 'dark Nordic navy background, deep sea shadows, cool slate-blue midtones, soft periwinkle highlights, warm cream accents' },
    { id: 'pal-lapland-snow', category: 'nordic', name: '라플란드 스노우 화이트', mode: 'light', colors: ['#FFFFFF', '#F5F5F8', '#E4E4EA', '#C0C0D4', '#7070A0'], colorMapping: 'pure snowfield white surface, faint icy blue-grey shadow, cool lavender midtones, muted slate accent, deep twilight anchor' },
    { id: 'pal-swedish-red', category: 'nordic', name: '스웨덴 레드 & 화이트', mode: 'light', colors: ['#FFF5F5', '#FFD0D0', '#FF8080', '#CC0000', '#660000'], colorMapping: 'crisp white background, soft rose base, classic Swedish red midtones, vivid crimson highlight, deep burgundy shadow' },
    { id: 'pal-nordic-mustard', category: 'nordic', name: '노르딕 머스타드 & 그레이', mode: 'light', colors: ['#FAF8F0', '#EDE8D0', '#D4C060', '#A08010', '#4A3800'], colorMapping: 'warm cream background, pale wheat base, classic Nordic mustard midtones, deep golden highlight, dark brown shadow' },
    { id: 'pal-winter-coast', category: 'nordic', name: '겨울 해안 블루 & 베이지', mode: 'light', colors: ['#F8FAFB', '#DDE8F0', '#9CC4D8', '#4A8EB4', '#1A3E5C'], colorMapping: 'hazy white background, pale mist-blue base, Nordic sea midtones, clear coastal blue highlight, deep ocean navy shadow' },

    // ==========================================
    // 9. 캔디 & 팝 비비드 (candy) - 8 items
    // ==========================================
    {
      id: 'pal-candy-pop',
      category: 'candy',
      name: '캔디 팝',
      mode: 'light',
      colors: ['#FFF0F6', '#FFB3D9', '#FF66AA', '#FF0080', '#990049'],
      colorMapping: 'light bubblegum background, hot pink ambient, vibrant magenta mid-tone, electric pink accent, deep cherry emphasis'
    },
    {
      id: 'pal-bubblegum-blue',
      category: 'candy',
      name: '버블검 블루',
      mode: 'light',
      colors: ['#F0F8FF', '#B3D9FF', '#66B3FF', '#0080FF', '#004D99'],
      colorMapping: 'cloud blue background, sky blue ambient, vibrant cornflower mid-tone, electric blue accent, deep navy emphasis'
    },
    {
      id: 'pal-citrus-pop',
      category: 'candy',
      name: '시트러스 팝',
      mode: 'light',
      colors: ['#FFFBF0', '#FFE066', '#FFB800', '#FF7A00', '#CC4400'],
      colorMapping: 'cream white background, lemon yellow ambient, bright citrus mid-tone, vivid orange accent, deep ember emphasis'
    },
    {
      id: 'pal-kiwi-lime',
      category: 'candy',
      name: '키위 라임',
      mode: 'light',
      colors: ['#F4FFF0', '#B3FFB3', '#66FF66', '#00CC00', '#006600'],
      colorMapping: 'white mint background, pale green ambient, bright lime mid-tone, vivid green accent, forest emphasis'
    },
    {
      id: 'pal-coral-punch',
      category: 'candy',
      name: '코랄 펀치',
      mode: 'light',
      colors: ['#FFF5F3', '#FFCCBB', '#FF8866', '#FF4422', '#CC1100'],
      colorMapping: 'soft peach background, light coral ambient, warm coral mid-tone, vivid tomato accent, deep red emphasis'
    },
    {
      id: 'pal-neon-dream',
      category: 'candy',
      name: '네온 드림',
      mode: 'light',
      colors: ['#F8FFFA', '#B3FFE0', '#66FFB3', '#00FF80', '#00994D'],
      colorMapping: 'white mint background, neon mint ambient, electric emerald mid-tone, vivid neon green accent, deep jade emphasis'
    },
    {
      id: 'pal-watermelon',
      category: 'candy',
      name: '워터멜론',
      mode: 'light',
      colors: ['#FFF8F8', '#FFB3B3', '#FF6666', '#FF1111', '#1A4422'],
      colorMapping: 'pale rose background, watermelon pink ambient, vivid red mid-tone, bright cherry accent, deep watermelon rind emphasis'
    },
    {
      id: 'pal-cotton-candy',
      category: 'candy',
      name: '코튼 캔디',
      mode: 'light',
      colors: ['#FFF0FF', '#F9B3FF', '#EE66FF', '#CC00FF', '#660099'],
      colorMapping: 'white lavender background, soft violet ambient, vivid orchid mid-tone, electric purple accent, deep grape emphasis'
    },
    { id: 'pal-neon-sunset', category: 'candy', name: '네온 선셋 그라디언트', mode: 'dark', colors: ['#18000A', '#500020', '#FF0066', '#FF6600', '#FFE600'], colorMapping: 'deep dusk-black background, dark crimson shadows, vivid magenta-pink to neon orange gradient, bright yellow highlights' },
    { id: 'pal-electric-blue-pop', category: 'candy', name: '일렉트릭 블루 팝', mode: 'dark', colors: ['#000A2A', '#001A6A', '#0040FF', '#00AAFF', '#88DDFF'], colorMapping: 'deep electric navy background, dark cobalt shadows, vivid royal blue midtones, brilliant azure highlights, pale sky-blue glow' },
    { id: 'pal-sherbet', category: 'candy', name: '셔벗 믹스 파스텔', mode: 'light', colors: ['#FFF8F5', '#FFD0B8', '#FFAA80', '#FF7040', '#8A2800'], colorMapping: 'warm cream white background, pale sherbet base, vivid tangerine midtones, bright citrus-orange highlight, deep burnt shadow' },
    { id: 'pal-galaxy-pop', category: 'candy', name: '갤럭시 팝 스페이스', mode: 'dark', colors: ['#0A0010', '#250038', '#6600CC', '#BB00FF', '#FF66FF'], colorMapping: 'cosmic black background, deep space-purple shadows, vivid violet midtones, electric magenta highlights, bright pink-purple glow' },
    { id: 'pal-lemon-lime', category: 'candy', name: '레몬 라임 팝', mode: 'light', colors: ['#FFFFF0', '#FFFF99', '#CCFF00', '#88CC00', '#3A6600'], colorMapping: 'bright white background, pale lemon base, vivid lime-yellow midtones, electric green highlight, deep forest anchor' },
    { id: 'pal-miami-vice', category: 'candy', name: '마이애미 바이스 핑크 틸', mode: 'dark', colors: ['#0A1018', '#00303D', '#00BBAA', '#FF2280', '#FFBB44'], colorMapping: 'dark night background, deep teal shadows, vivid turquoise midtones, hot neon pink accent, warm golden highlight' },
    { id: 'pal-disco-foil', category: 'candy', name: '디스코 포일 골드 & 핑크', mode: 'dark', colors: ['#1A0A00', '#4A2000', '#CC8800', '#FF44AA', '#FFEE44'], colorMapping: 'dark disco-black background, deep amber shadows, gold foil midtones, hot pink highlight, bright yellow accent spark' },
    { id: 'pal-vivid-rainbow', category: 'candy', name: '비비드 레인보우 스펙트럼', mode: 'dark', colors: ['#0A0A0A', '#FF0000', '#FF8800', '#00CC00', '#0088FF'], colorMapping: 'deep black background, vivid primary rainbow spectrum across full hue range, bold saturated color story, graphic vivid pop art palette' },

    // ==========================================
    // 10. 웜 어스 & 내추럴 (warm_earth) - 8 items
    // ==========================================
    {
      id: 'pal-terracotta',
      category: 'warm_earth',
      name: '테라코타',
      mode: 'light',
      colors: ['#FDF5F0', '#F5CDB4', '#E8956D', '#C15A2A', '#6B2E0E'],
      colorMapping: 'warm linen background, peach sand ambient, terracotta mid-tone, rich clay accent, dark adobe emphasis'
    },
    {
      id: 'pal-matcha-cream',
      category: 'warm_earth',
      name: '말차 크림',
      mode: 'light',
      colors: ['#F6F8F0', '#E4EDCF', '#C5D89A', '#8BAA4A', '#4A5E1F'],
      colorMapping: 'cream white background, pale matcha ambient, soft green mid-tone, earthy green accent, dark matcha emphasis'
    },
    {
      id: 'pal-sand-dune',
      category: 'warm_earth',
      name: '샌드 듄',
      mode: 'light',
      colors: ['#FDFAF5', '#F5EDD0', '#E5D09A', '#C4A454', '#7A5A18'],
      colorMapping: 'ivory white background, light sand ambient, golden dune mid-tone, warm ochre accent, dark soil emphasis'
    },
    {
      id: 'pal-clay-earth',
      category: 'warm_earth',
      name: '클레이 어스',
      mode: 'light',
      colors: ['#FCF5EE', '#F0D9C3', '#D9B491', '#B07843', '#5C3418'],
      colorMapping: 'soft cream background, warm clay ambient, mid terracotta mid-tone, earthy brown accent, deep umber emphasis'
    },
    {
      id: 'pal-linen-natural',
      category: 'warm_earth',
      name: '리넨 내추럴',
      mode: 'light',
      colors: ['#FEFCF8', '#F5EFE6', '#E8DDD0', '#C4AA8A', '#7A5D3C'],
      colorMapping: 'natural white background, warm linen ambient, soft ecru mid-tone, camel tan accent, leather brown emphasis'
    },
    {
      id: 'pal-sage-garden',
      category: 'warm_earth',
      name: '세이지 가든',
      mode: 'light',
      colors: ['#F4F7F2', '#D9E5D4', '#AABFA2', '#6B8C60', '#2E4A26'],
      colorMapping: 'soft white-green background, pale sage ambient, dusty sage mid-tone, garden green accent, deep forest emphasis'
    },
    {
      id: 'pal-autumn-harvest',
      category: 'warm_earth',
      name: '오텀 하베스트',
      mode: 'light',
      colors: ['#FDF8F0', '#F5DDB4', '#E8A84A', '#C46A00', '#6B3200'],
      colorMapping: 'warm white background, harvest wheat ambient, golden amber mid-tone, pumpkin orange accent, chestnut emphasis'
    },
    {
      id: 'pal-driftwood',
      category: 'warm_earth',
      name: '드리프트우드',
      mode: 'light',
      colors: ['#F8F6F3', '#EDE8E0', '#D4CAB8', '#9E907A', '#4A4030'],
      colorMapping: 'white driftwood background, pale grey-beige ambient, warm taupe mid-tone, aged wood accent, dark bark emphasis'
    },
    { id: 'pal-desert-bloom', category: 'warm_earth', name: '데저트 블룸 핑크 & 샌드', mode: 'light', colors: ['#FFF8F0', '#FFDDC8', '#E8A880', '#C05838', '#602818'], colorMapping: 'warm sand white background, peach rose base, terracotta midtones, vivid desert clay highlight, deep burnt umber shadow' },
    { id: 'pal-coffee-earth', category: 'warm_earth', name: '커피 어스 & 에스프레소', mode: 'dark', colors: ['#100800', '#2E1800', '#5C3010', '#A06030', '#E8C890'], colorMapping: 'dark espresso-black background, deep roast brown shadows, medium coffee earth midtones, warm caramel highlights, soft golden cream accents' },
    { id: 'pal-organic-green', category: 'warm_earth', name: '오가닉 어스 그린', mode: 'light', colors: ['#F5F8EE', '#D8E8C0', '#A0C060', '#608030', '#2A3A10'], colorMapping: 'natural white background, pale lettuce-green base, organic leaf midtones, vivid herb-green highlight, deep root-green shadow' },
    { id: 'pal-rust-denim', category: 'warm_earth', name: '러스트 레드 & 데님 블루', mode: 'dark', colors: ['#1A0800', '#4A1A08', '#9C4020', '#B8784A', '#4A6080'], colorMapping: 'dark russet-black background, deep rust-red shadows, warm brick midtones, dusty copper highlights, cool denim blue accent' },
    { id: 'pal-clay-rose', category: 'warm_earth', name: '클레이 로즈 & 베이지', mode: 'light', colors: ['#FBF5F0', '#F0D8C8', '#D8A888', '#B07050', '#603828'], colorMapping: 'warm ivory background, pale adobe base, soft clay-rose midtones, muted terracotta highlight, deep earth shadow' },
    { id: 'pal-moss-stone', category: 'warm_earth', name: '모스 & 스톤 그레이', mode: 'light', colors: ['#F2F4EE', '#D8DCC8', '#A0A880', '#6C7850', '#303820'], colorMapping: 'light stone-white background, pale pebble base, muted moss-grey midtones, olive-green highlight, deep dark-lichen shadow' },
    { id: 'pal-raw-linen', category: 'warm_earth', name: '로 리넨 & 차콜', mode: 'light', colors: ['#FAF6EE', '#F0E8D4', '#D8C8A4', '#A09060', '#3A3028'], colorMapping: 'natural linen-cream background, warm undyed base, soft raw-cloth midtones, aged hemp highlight, deep charcoal anchor' },
    { id: 'pal-volcanic-earth', category: 'warm_earth', name: '화산 어스 레드 & 블랙', mode: 'dark', colors: ['#100808', '#2E1010', '#602020', '#C04030', '#D89070'], colorMapping: 'dark volcanic-black background, deep lava-earth shadows, burnt sienna midtones, vivid burnt-orange highlights, warm sand-terracotta accents' },

    // ==========================================
    // 11. 멀티컬러 & 비비드 (multicolor) - 24 items
    // ==========================================
    { id: 'pal-sunset-spectrum', category: 'multicolor', name: '선셋 스펙트럼 그라디언트', mood: 'festival', mode: 'dark', colors: ['#1A0030', '#8B00FF', '#FF0080', '#FF6600', '#FFD700'], colorMapping: 'deep violet dusk to neon purple, fiery magenta, blazing orange, golden horizon — full sunset spectrum gradient' },
    { id: 'pal-tropical-paradise', category: 'multicolor', name: '트로피컬 파라다이스', mood: 'festival', mode: 'light', colors: ['#00D4AA', '#FF6B6B', '#FFE66D', '#4ECDC4', '#FF8E53'], colorMapping: 'vibrant teal waves, warm coral accents, sunny lemon pop, turquoise shimmer, bright tangerine highlights' },
    { id: 'pal-neon-carnival', category: 'multicolor', name: '네온 카니발', mood: 'festival', mode: 'dark', colors: ['#0A0A1A', '#FF00FF', '#00FFFF', '#FFFF00', '#FF4500'], colorMapping: 'deep dark background, electric magenta, glowing cyan, neon yellow, blazing orange-red carnival lights' },
    { id: 'pal-aurora-dreams', category: 'multicolor', name: '오로라 드림', mood: 'festival', mode: 'dark', colors: ['#050514', '#003366', '#00AA88', '#FF44CC', '#FFD700'], colorMapping: 'deep midnight navy, arctic blue base, aurora green shimmer, dancing magenta highlight, golden glimmer' },
    { id: 'pal-spring-festival', category: 'multicolor', name: '봄 페스티벌', mood: 'festival', mode: 'light', colors: ['#FF6B9D', '#FFB347', '#6BCB77', '#4D96FF', '#FFFFFF'], colorMapping: 'cherry blossom pink, warm apricot orange, fresh spring green, clear sky blue, bright white space' },
    { id: 'pal-candy-rainbow', category: 'multicolor', name: '캔디 레인보우', mood: 'festival', mode: 'light', colors: ['#FF4D4D', '#FF9900', '#FFEE00', '#33CC33', '#0066FF'], colorMapping: 'vivid candy red, bright orange, lemon yellow, fresh lime green, electric blue — full spectrum candy rainbow' },
    { id: 'pal-tropical-ocean', category: 'multicolor', name: '트로피컬 오션', mood: 'festival', mode: 'light', colors: ['#00B4D8', '#90E0EF', '#FF6B6B', '#FFD166', '#06D6A0'], colorMapping: 'bright ocean blue, aqua shimmer, coral pop, sun yellow, emerald waves — tropical beach vibe' },
    { id: 'pal-cosmos-multi', category: 'multicolor', name: '코스모스 멀티 그라디언트', mood: 'festival', mode: 'dark', colors: ['#04001C', '#1A0050', '#6200CC', '#00AAFF', '#FF44AA'], colorMapping: 'deep cosmic void, galaxy purple, electric violet nebula, bright star blue, hot pink stardust' },
    { id: 'pal-midsummer-multi', category: 'multicolor', name: '한여름 멀티컬러', mood: 'festival', mode: 'light', colors: ['#FF6B6B', '#FF8E53', '#FFA07A', '#98D8C8', '#45B7D1'], colorMapping: 'sunset coral, warm peach-orange, soft salmon, aqua shimmer, clear sky blue — summer sunset to ocean' },
    { id: 'pal-christmas-duo', category: 'multicolor', name: '크리스마스 레드 & 그린', mood: 'festival', mode: 'dark', colors: ['#0A1A0A', '#1A4A1A', '#CC0000', '#FFD700', '#FFFFFF'], colorMapping: 'deep dark green base, forest Christmas green, vivid red, bright gold star, crisp white snow' },
    { id: 'pal-cyberpunk-glow', category: 'multicolor', name: '사이버펑크 글로우', mood: 'vivid', mode: 'dark', colors: ['#0D0221', '#FF0090', '#00FFFF', '#FFFF00', '#7B00FF'], colorMapping: 'black void base, hot neon pink, electric cyan, acid yellow, ultra-violet glow — cyberpunk neon city' },
    { id: 'pal-acid-festival', category: 'multicolor', name: '애시드 페스티벌', mood: 'vivid', mode: 'dark', colors: ['#111111', '#FF2D55', '#00FF88', '#FFD700', '#AA00FF'], colorMapping: 'dark base, acid red, neon mint green, bright gold, electric purple — high voltage vivid palette' },
    { id: 'pal-holographic-foil', category: 'multicolor', name: '홀로그래픽 포일', mood: 'vivid', mode: 'dark', colors: ['#0A0A14', '#FF00CC', '#00CCFF', '#CCFF00', '#FF6600'], colorMapping: 'dark base, iridescent magenta, cyan foil, electric lime, vivid orange — holographic metallic shift' },
    { id: 'pal-pop-art-cmyk', category: 'multicolor', name: '팝아트 CMYK', mood: 'vivid', mode: 'light', colors: ['#FF0066', '#FFDD00', '#00AAFF', '#000000', '#FFFFFF'], colorMapping: 'pop art hot pink, vivid yellow, bold cyan, graphic black, stark white — CMYK halftone pop art palette' },
    { id: 'pal-neon-tokyo', category: 'multicolor', name: '네온 도쿄 나이트', mood: 'vivid', mode: 'dark', colors: ['#0D0D1A', '#FF2B6B', '#00E5FF', '#FF9500', '#BD00FF'], colorMapping: 'dark Tokyo night, hot neon red-pink, electric cyan, vivid amber, glowing purple neon sign palette' },
    { id: 'pal-retro-70s', category: 'multicolor', name: '레트로 70년대', mood: 'retro', mode: 'light', colors: ['#8B4513', '#DAA520', '#CD853F', '#808000', '#D2691E'], colorMapping: 'warm sienna brown, golden mustard, sandy tan, olive drab, burnt orange — authentic 70s earthy retro palette' },
    { id: 'pal-retro-80s-neon', category: 'multicolor', name: '빈티지 80년대 네온', mood: 'retro', mode: 'dark', colors: ['#1A001A', '#FF00FF', '#00FFFF', '#FF69B4', '#7FFF00'], colorMapping: 'dark retro backdrop, hot magenta neon, electric cyan, pink synthwave, chartreuse — classic 80s neon palette' },
    { id: 'pal-retro-pastel', category: 'multicolor', name: '레트로 파스텔 빈티지', mood: 'retro', mode: 'light', colors: ['#F5E6D3', '#D4A5A5', '#9B9B9B', '#8FBC8F', '#C8A882'], colorMapping: 'warm cream background, dusty rose, vintage grey, sage green, antique camel — faded vintage poster palette' },
    { id: 'pal-vaporwave', category: 'multicolor', name: '베이퍼웨이브', mood: 'retro', mode: 'dark', colors: ['#1B0232', '#FF71CE', '#01CDFE', '#05FFA1', '#B967FF'], colorMapping: 'deep purple night, hot pink, digital cyan, neon mint, electric violet — vaporwave aesthetic palette' },
    { id: 'pal-luxury-jewel', category: 'multicolor', name: '럭셔리 주얼톤', mood: 'luxury', mode: 'dark', colors: ['#0A0A0A', '#1B4332', '#1A237E', '#7B0D1E', '#C9A84A'], colorMapping: 'black luxury base, deep emerald jewel, sapphire royal blue, ruby red, 24k gold — premium jewel palette' },
    { id: 'pal-art-deco', category: 'multicolor', name: '아트 데코 골드 & 블랙', mood: 'luxury', mode: 'dark', colors: ['#0C0C0C', '#1A1A1A', '#C8A84A', '#4A90C8', '#FFFFFF'], colorMapping: 'black art deco base, charcoal surface, warm gold geometric accent, sapphire blue highlight, crisp white outline' },
    { id: 'pal-midnight-velvet', category: 'multicolor', name: '미드나잇 벨벳 럭셔리', mood: 'luxury', mode: 'dark', colors: ['#0D0520', '#1A0A3D', '#4A1E8A', '#C0A060', '#EDE8D0'], colorMapping: 'near-black velvet base, deep royal purple, regal amethyst, antique gold shimmer, champagne highlight' },
    { id: 'pal-earthy-rainbow', category: 'multicolor', name: '어스 레인보우 내추럴', mood: 'natural', mode: 'light', colors: ['#C0392B', '#E67E22', '#F1C40F', '#27AE60', '#2980B9'], colorMapping: 'earthy red clay, warm amber orange, sun gold, forest green, sky blue — natural earth-toned rainbow spectrum' },
    { id: 'pal-botanical-duo', category: 'multicolor', name: '보타닉 코랄 & 그린', mood: 'natural', mode: 'light', colors: ['#2D6A4F', '#40916C', '#FF7F51', '#FFB347', '#FEFAE0'], colorMapping: 'deep forest green, vibrant tropical green, coral orange bloom, warm amber, natural cream white' }
  ];

  // 브랜드/플랫폼 기반 프리셋 추가 (레고, 마리오, 로블록스, 마비노기 등) 및 미리캔버스/캔바/웹툰/애니/영화 등
  const EXTRA_BRAND_PALETTES = [
    { id: 'pal-lego', category: 'candy', name: '레고 브릭 컬러', mode: 'light', colors: ['#FF0000', '#FFDE00', '#0057A6', '#009A17', '#FFFFFF'], colorMapping: 'primary red bricks, bright yellow accents, deep blue, vivid green, clean white studs' },
    { id: 'pal-mario', category: 'candy', name: '마리오 클래식', mode: 'light', colors: ['#E60012', '#2A52BE', '#FFD400', '#6BCB77', '#FFFFFF'], colorMapping: 'Mario red primary, blue overalls, gold coin yellow, green accents, white highlights' },
    { id: 'pal-roblox', category: 'candy', name: '로블록스 플레이풀', mode: 'light', colors: ['#FF4F00', '#00ADEF', '#F2C94C', '#FFFFFF', '#2D2D2D'], colorMapping: 'bright playful orange, electric cyan, warm gold, neutral white and dark anchor' },
    { id: 'pal-mabinogi', category: 'soft', name: '마비노기 판타지', mode: 'light', colors: ['#6AA84F', '#8DB5E0', '#F3E5AB', '#D9A1C6', '#FFFFFF'], colorMapping: 'soft fantasy greens, pastel sky blue, warm parchment background, rosy pink accents' },
    { id: 'pal-canva', category: 'modern', name: '캔바 스타일 템플릿', mode: 'light', colors: ['#1A73E8', '#F7F9FC', '#34A853', '#FBBC05', '#EA4335'], colorMapping: 'clean template-friendly blues, muted white backgrounds, fresh green and warm highlight tones similar to popular template sets' },
    { id: 'pal-miricanvas', category: 'modern', name: '미리캔버스 트렌디', mode: 'light', colors: ['#FF7A7A', '#FFD57A', '#A18CD1', '#77D6C6', '#FFFFFF'], colorMapping: '트렌디한 소프트 파스텔과 비비드 포인트의 혼합 팔레트' },
    { id: 'pal-webtoon', category: 'soft', name: '웹툰 컬러 팝', mode: 'light', colors: ['#FF9DE2', '#FFB3C6', '#FFE8B8', '#A8D8FF', '#FFFFFF'], colorMapping: '웹툰 특유의 화사한 하이라이트와 파스텔 보조색' },
    { id: 'pal-anime-cinematic', category: 'photo', name: '애니/시네마틱 톤', mode: 'dark', colors: ['#16213e', '#1a1a2e', '#e94560', '#c9a84c', '#8ecae6'], colorMapping: '영화 같은 다크 네이비 기반의 크림·골드 하이라이트, 선명한 레드 포인트' },
    { id: 'pal-film-grain', category: 'photo', name: '필름 & 시네마', mode: 'dark', colors: ['#0F172A', '#2B2F3A', '#8B6B46', '#C9A84C', '#EDE6DD'], colorMapping: '필름 그레인과 필름 톤의 따뜻한 하이라이트와 차가운 그림자 결합' }
  ];

  // MIXER_PALETTES에 병합 (중복 id는 덮어쓰지 않음)
  EXTRA_BRAND_PALETTES.forEach(p => { if (!MIXER_PALETTES.find(x => x.id === p.id)) MIXER_PALETTES.push(p); });

  // 개별 팔레트 mood 오버라이드 맵 (카테고리 기본값과 다른 것만)
  const PALETTE_MOOD_MAP = {
    'pal-vintage': 'retro', 'pal-vintage-navy': 'retro', 'pal-film-grain': 'retro', 'pal-anime-cinematic': 'retro',
    'pal-white-premium': 'luxury', 'pal-tax-gold': 'luxury', 'pal-court-navy': 'luxury', 'pal-plum-velvet': 'luxury', 'pal-tiffany': 'luxury',
    'pal-holographic': 'vivid', 'pal-vivid-rainbow': 'festival', 'pal-miami-vice': 'festival', 'pal-disco-foil': 'festival',
    'pal-neon-sunset': 'festival', 'pal-lego': 'festival', 'pal-mario': 'festival', 'pal-roblox': 'festival',
  };

  // 컨셉 제안 탭의 프리셋(window.CONCEPT_STYLES)을 팔레트로 동적으로 병합
  try {
    if (window && Array.isArray(window.CONCEPT_STYLES)) {
      window.CONCEPT_STYLES.forEach((style) => {
        try {
          if (!style || !style.id || !Array.isArray(style.palette)) return;
          const pid = `pal-style-${style.id}`;
          if (MIXER_PALETTES.find(p => p.id === pid)) return;
          MIXER_PALETTES.push({
            id: pid,
            category: 'concept',
            name: style.nameKo || style.nameEn || (`Style ${style.id}`),
            mode: 'light',
            colors: style.palette.slice(0,5),
            colorMapping: ''
          });
        } catch (e) { /* fail silently per style */ }
      });
    }
  } catch (e) {
    // noop
  }

  // 구도 및 리터칭 카테고리/프리셋 상수 정의
  const COMPOSITION_CATEGORIES = [
    { id: 'shot', label: '📸 숏 & 크기' },
    { id: 'angle', label: '📐 카메라 앵글' },
    { id: 'layout', label: '⚖️ 배치 & 기하학' }
  ];

  const TYPOGRAPHY_CATEGORIES = [
    { id: 'sans',         label: '🔤 산세리프' },
    { id: 'serif',        label: '📖 세리프' },
    { id: 'display',      label: '🖼️ 디스플레이' },
    { id: 'script',       label: '✍️ 캘리그라피' },
    { id: 'experimental', label: '🧪 실험적' }
  ];

  const MIXER_COMPOSITIONS = [
    { id: 'none', category: 'all', nameKo: '선택 안 함', emoji: '❌', desc: '특정한 구도를 지정하지 않고 자연스러운 배치를 사용합니다.', prefix: '', suffix: '' },
    { id: 'comp-extreme-close-up', category: 'shot', nameKo: '익스트림 클로즈업', emoji: '🔍', desc: '핵심적인 부분이나 텍스처를 화면 전체에 꽉 차게 강조하는 극접사 구도.', prefix: 'extreme close-up macro shot of', suffix: 'focusing on micro details and textures' },
    { id: 'comp-medium-shot', category: 'shot', nameKo: '미디엄 숏', emoji: '🧍', desc: '주체와 주변 배경을 조화롭게 분할하여 안정감을 주는 표준적인 구도.', prefix: 'medium shot of', suffix: 'balanced composition showing subject and environment' },
    { id: 'comp-wide-angle', category: 'shot', nameKo: '와이드 앵글 뷰', emoji: '🏞️', desc: '광활하고 웅장한 공간감을 연출하여 전체적인 스케일을 강조하는 구도.', prefix: 'wide-angle scenic shot of', suffix: 'showcasing expansive surrounding environment and grand scale' },
    { id: 'comp-knolling', category: 'shot', nameKo: '놀링 (Knolling) 배치', emoji: '🍱', desc: '모든 구성 요소를 90도 직각으로 정밀하게 정돈하여 배치하는 탑다운 뷰.', prefix: 'flat lay knolling layout of', suffix: 'neatly organized items arranged at 90-degree angles on clean background' },
    { id: 'comp-extreme-wide', category: 'shot', nameKo: '익스트림 와이드 앵글', emoji: '🌌', desc: '아주 넓은 시야각으로 거대한 주변 경관과 극적 스케일을 한눈에 보여주는 구도.', prefix: 'extreme wide-angle landscape view of', suffix: 'presenting vast scenery and tiny scale contrast' },
    { id: 'comp-macro-bokeh', category: 'shot', nameKo: '매크로 아웃포커스', emoji: '💧', desc: '미세한 질감을 접사하고 뒷배경을 환상적인 보케로 극단적으로 뭉개는 아웃포커싱 구도.', prefix: 'macro photography of', suffix: 'extreme close-up, creamy soft bokeh background, shallow depth of field' },
    { id: 'comp-panoramic', category: 'shot', nameKo: '파노라믹 가로 와이드', emoji: '🎞️', desc: '시네마스코프처럼 좌우로 길게 확장된 화면 비율을 보여주는 웅장한 가로형 시야.', prefix: 'panoramic wide aspect ratio view of', suffix: 'cinematic horizontal stretch and grand scale' },
    { id: 'comp-telescopic', category: 'shot', nameKo: '망원 압축 뷰', emoji: '🔭', desc: '망원 렌즈로 멀리 있는 피사체들을 한데 압축하여 밀도 있게 표현하는 구도.', prefix: 'telephoto lens compression view of', suffix: 'compressed background layers, distant subject detail' },
    { id: 'comp-three-quarter', category: 'shot', nameKo: '3/4 쿼터 숏', emoji: '📐', desc: '정면과 측면의 입체감이 가장 잘 드러나는 비스듬한 45도 초상/제품 촬영 구도.', prefix: 'three-quarter profile shot of', suffix: 'angled perspective, volumetric depth' },
    { id: 'comp-full-shot', category: 'shot', nameKo: '풀 뷰 숏', emoji: '🕴️', desc: '머리끝부터 발끝(혹은 사물의 전경)까지 전체를 안정적으로 다 드러내는 전신/전체 샷.', prefix: 'full shot view of', suffix: 'showing entire subject body and footprint, grounded composition' },
    { id: 'comp-head-on', category: 'shot', nameKo: '헤드 온 정면', emoji: '👁️', desc: '비스듬한 기교 없이 피사체의 정면을 똑바로 직시하여 강한 전달력을 주는 구도.', prefix: 'straightforward head-on portrait view of', suffix: 'front-facing composition, symmetrical focus' },
    { id: 'comp-pov', category: 'shot', nameKo: '1인칭 POV 시점', emoji: '👓', desc: '카메라가 시청자의 실제 눈높이가 되어 현실감을 극대화하는 1인칭 구도.', prefix: 'first-person point-of-view shot of', suffix: 'subjective camera perspective, immersive view' },
    { id: 'comp-candid', category: 'shot', nameKo: '캔디드 다큐멘터리', emoji: '📸', desc: '의식하지 않은 인위성 없는 순간을 자연스럽게 포착한 다큐멘터리 풍 숏.', prefix: 'candid capture of', suffix: 'raw documentary photojournalism style, unposed natural movement' },
    { id: 'comp-super-telephoto', category: 'shot', nameKo: '초망원 세부 크로즈업', emoji: '🧿', desc: '아주 멀리 있는 오브젝트의 핵심 영역만 도려내듯 정밀 묘사한 클로즈업.', prefix: 'super telephoto close-up of', suffix: 'sharp crisp detail from afar, flattened background' },
    { id: 'comp-low-angle', category: 'angle', nameKo: '웅장한 로우 앵글', emoji: '↗️', desc: '아래에서 올려다보는 각도로 주체를 거대하고 역동적으로 표현하는 구도.', prefix: 'low-angle heroic shot of', suffix: 'looking up to emphasize power and monumental scale' },
    { id: 'comp-high-angle', category: 'angle', nameKo: '하이 앵글', emoji: '↘️', desc: '위에서 아래로 내려다보며 전체적인 분포와 상황을 객관적으로 보여주는 구도.', prefix: 'high-angle shot of', suffix: 'looking down to reveal spatial layout and clean organization' },
    { id: 'comp-aerial', category: 'angle', nameKo: '드론 항공 뷰', emoji: '🚁', desc: '하늘 높이 솟구친 공중 시점으로 압도적인 지형지물과 스펙터클을 담는 구도.', prefix: 'aerial drone photography of', suffix: 'birdseye view presenting massive infrastructure and geographic details' },
    { id: 'comp-isometric', category: 'angle', nameKo: '아이소메트릭 뷰', emoji: '📐', desc: '30도 기울어진 각도의 등각 투영법으로 설계 도면 같은 세련미를 주는 구도.', prefix: 'isometric 3D visualization of', suffix: 'technical orthographic clean rendering style' },
    { id: 'comp-worms-eye', category: 'angle', nameKo: '웜즈 아이 로우 앵글', emoji: '🐛', desc: '바닥에 완전히 밀착하여 하늘을 우러러보듯 극적으로 왜곡된 강력한 로우 앵글.', prefix: 'worms-eye view looking straight up at', suffix: 'dramatic ground angle, monumental scale distortion' },
    { id: 'comp-birds-eye', category: 'angle', nameKo: '버즈 아이 직부감', emoji: '🦅', desc: '수직 90도 아래를 똑바로 내려다보는 완전한 탑다운 평면적 부감 구도.', prefix: "bird's-eye view looking directly down at", suffix: '90-degree vertical top-down perspective, blueprint flat layout' },
    { id: 'comp-dutch-angle', category: 'angle', nameKo: '더치 앵글 사선 투시', emoji: '🔀', desc: '지평선을 사선으로 비틀어 긴장감과 속도감, 불안정성을 연출하는 연출용 앵글.', prefix: 'dutch angle shot of', suffix: 'canted horizon tilt, dynamic unstable diagonal perspective' },
    { id: 'comp-eye-level', category: 'angle', nameKo: '아이 레벨 수평 구도', emoji: '↔️', desc: '기교 없이 수평 눈높이에서 보여주어 편안함과 정서적 교감을 유도하는 구도.', prefix: 'eye-level horizontal shot of', suffix: 'straight camera setup, natural human viewpoint' },
    { id: 'comp-ground-level', category: 'angle', nameKo: '그라운드 레벨 로우', emoji: '🛹', desc: '카메라를 지면에 스치듯이 수평으로 눕혀 속도감과 특별한 시각적 재미를 주는 앵글.', prefix: 'ground-level camera placement of', suffix: 'flat surface view, low horizon line' },
    { id: 'comp-side-profile', category: 'angle', nameKo: '측면 프로필', emoji: '👤', desc: '피사체의 정면을 배제하고 한쪽 옆모습이나 단면을 세밀하게 묘사하는 정형 구도.', prefix: 'clean side profile view of', suffix: 'lateral flat perspective, sharp silhouette lines' },
    { id: 'comp-over-shoulder', category: 'angle', nameKo: '어깨너머 오버더숄더', emoji: '👥', desc: '인물이나 오브젝트의 바로 뒷라인 어깨 너머로 대상을 관찰하듯 바라보는 시네마틱 앵글.', prefix: 'over-the-shoulder shot of', suffix: 'foreground framing element, contextual depth layer' },
    { id: 'comp-three-quarter-top', category: 'angle', nameKo: '3쿼터 탑다운', emoji: '📈', desc: '사선 위쪽에서 내려다보며 사물의 두 옆면과 윗면을 입체적으로 모두 포착하는 구도.', prefix: 'three-quarter high-angle shot of', suffix: 'technical product preview angle' },
    { id: 'comp-fisheye', category: 'angle', nameKo: '어안 렌즈 볼록 굴절', emoji: '🌀', desc: '180도 광각 돔 렌즈 효과로 중심은 볼록하고 주변은 둥글게 휘는 왜곡 앵글.', prefix: 'fisheye lens distortion of', suffix: 'ultra-wide circular 180-degree wrap around view' },
    { id: 'comp-low-angle-silhouette', category: 'angle', nameKo: '로우 앵글 실루엣', emoji: '👥', desc: '역광 상태에서 로우 앵글로 촬영하여 주체의 드라마틱한 윤곽 실루엣을 부각하는 구도.', prefix: 'backlit low-angle silhouette of', suffix: 'stark shadow outline, dramatic sky background' },
    { id: 'comp-rule-of-thirds', category: 'layout', nameKo: '3분할 구도', emoji: '🕸️', desc: '화면을 가로/세로 3등분한 교차점에 주요 요소를 매끄럽게 결합하는 구도.', prefix: 'rule of thirds composition of', suffix: 'asymmetric focal points creating dynamic visual balance' },
    { id: 'comp-symmetry', category: 'layout', nameKo: '데칼코마니 대칭', emoji: '⚖️', desc: '좌우 혹은 상하가 완벽하게 일치하여 시각적 절대 안정과 몰입을 주는 구도.', prefix: 'perfectly symmetrical reflection of', suffix: 'centered composition, high graphical stability and reflection mapping' },
    { id: 'comp-spiral', category: 'layout', nameKo: '피보나치 나선', emoji: '🌀', desc: '황금 비율 나선 궤적을 따라 시선이 안쪽으로 빨려 들어가는 몰입형 구도.', prefix: 'golden ratio fibonacci spiral composition of', suffix: 'curved leading lines pulling the eye to the central focus' },
    { id: 'comp-framing', category: 'layout', nameKo: '프레임 인 프레임', emoji: '🖼️', desc: '창문, 틈새, 문틀 등 내부 프레임을 통해 피사체를 한 번 더 감싸는 구조.', prefix: 'framed view of', suffix: 'looking through a clean architectural frame, depth of field layers' },
    { id: 'comp-copy-left', category: 'layout', nameKo: '좌측 텍스트 여백', emoji: '⬅️', desc: '슬라이드 타이틀을 얹기 좋게 좌측 절반의 배경을 완전한 빈 여백으로 유도하는 배치.', prefix: 'asymmetric composition with', suffix: 'optimized with large clean copy-space on the left third of the image' },
    { id: 'comp-copy-right', category: 'layout', nameKo: '우측 텍스트 여백', emoji: '➡️', desc: '텍스트 본문이나 로고를 얹기 좋게 우측 영역을 심플하게 비워두는 배치.', prefix: 'asymmetric composition with', suffix: 'optimized with large clean copy-space on the right third of the image' },
    { id: 'comp-centered-focus', category: 'layout', nameKo: '중앙 집중형 프레임', emoji: '🎯', desc: '불필요한 분산 요소 없이 가장 중요한 대상을 정중앙에 배치해 시선을 고정하는 레이아웃.', prefix: 'dead-center composition of', suffix: 'focused singular focal point, high impact symmetry, clean background' },
    { id: 'comp-diagonals', category: 'layout', nameKo: '대각선 소실점', emoji: '↗️', desc: '대각선 방향으로 뻗어 나가는 강한 가이드라인을 배치해 역동적 속도감을 주는 구도.', prefix: 'strong diagonal composition of', suffix: 'dynamic leading lines stretching across the canvas, forced perspective' },
    { id: 'comp-triangular', category: 'layout', nameKo: '삼각형 피라미드', emoji: '🔺', desc: '하단을 넓게 하고 위로 모아주는 피라미드식 기하학 배치로 압도적인 안정감을 주는 구도.', prefix: 'triangular composition layout of', suffix: 'stable pyramid structures, broad base visual anchor' },
    { id: 'comp-thirds-offset', category: 'layout', nameKo: '황금 삼분할 교차', emoji: '🏁', desc: '황금 분할 교차점 중 하나로 대상을 강하게 오프셋하여 시각적 세련미를 높이는 비대칭 구도.', prefix: 'strongly offset rule of thirds composition of', suffix: 'asymmetric balanced spacing, artistic off-center focus' },
    { id: 'comp-layered-framing', category: 'layout', nameKo: '다중 액자식 구성', emoji: '🔳', desc: '전경의 아웃포커스된 틈새를 거쳐 중경, 배경까지 다층 프레임으로 엮은 구조적 구도.', prefix: 'layered multi-frame perspective of', suffix: 'peek-through foreground, volumetric framing, deep depth of field' },
    { id: 'comp-radial', category: 'layout', nameKo: '방사형 확산', emoji: '🔆', desc: '중앙의 핵심 소실점으로부터 사방으로 선이나 오브젝트가 방사형으로 뿜어 나오는 구도.', prefix: 'radial layout of', suffix: 'explosion lines radiating outward from the visual core, centered focal burst' },
    { id: 'comp-floating-suspension', category: 'layout', nameKo: '플로팅 공중 부양', emoji: '🎈', desc: '오브젝트가 중력을 무시하고 가볍게 둥둥 떠 있는 트렌디한 제품 레이아웃.', prefix: 'gravity-defying floating mockup layout of', suffix: 'suspended objects in mid-air with soft cast shadows, minimalist backdrop' },
    { id: 'comp-split', category: 'layout', nameKo: '수직 이분할 (50:50)', emoji: '🌓', desc: '화면을 수직 또는 수평으로 칼같이 50:50으로 나누는 극단적인 그래픽 구도.', prefix: '50-50 split screen composition of', suffix: 'perfect visual dichotomy, color block division, high symmetry' },

    // 숏 (shot) 추가 8종
    { id: 'comp-tilt-shift', category: 'shot', nameKo: '틸트 시프트 미니어처', emoji: '🏙️', desc: '카메라 틸트-시프트 렌즈로 실제 장면을 미니어처 모형처럼 보이게 만드는 착시 구도.', prefix: 'tilt-shift miniature effect photograph of', suffix: 'selective focus band creating miniature diorama illusion, defocused top and bottom' },
    { id: 'comp-double-exposure', category: 'shot', nameKo: '이중 노출 고스트', emoji: '👻', desc: '두 개의 이미지를 겹쳐 신비로운 고스트 이중 노출 효과를 만드는 예술적 촬영 기법.', prefix: 'double exposure composite of', suffix: 'two images blended in ghostly overlay, dreamlike merged silhouette' },
    { id: 'comp-underwater', category: 'shot', nameKo: '수중 투시', emoji: '🤿', desc: '수면 아래에서 바라본 수중 투시 구도. 굴절된 빛 줄기와 물결 텍스처가 독특한 공간감을 만든다.', prefix: 'underwater perspective shot of', suffix: 'light refracting through water surface, caustic light patterns, aquatic visual depth' },
    { id: 'comp-reflection-mirror', category: 'shot', nameKo: '거울·수면 반사', emoji: '🪞', desc: '완벽한 수면 반사나 거울 반영을 활용해 상하 대칭의 몽환적 공간을 만드는 구도.', prefix: 'perfect mirror reflection composition of', suffix: 'subject and its reflection creating surreal symmetrical world, glassy water or mirror surface' },
    { id: 'comp-zoom-burst', category: 'shot', nameKo: '줌 버스트 방사', emoji: '💫', desc: '노출 중 줌 인/아웃으로 광선이 중심에서 방사형으로 폭발하는 역동적 줌 버스트 효과.', prefix: 'zoom burst exposure effect of', suffix: 'radial light streaks exploding outward from center, energetic speed of light effect' },
    { id: 'comp-split-diopter', category: 'shot', nameKo: '스플릿 딥터 듀얼 포커스', emoji: '🎭', desc: '화면을 두 영역으로 나눠 근거리와 원거리를 동시에 선명하게 잡는 스플릿 딥터 렌즈 구도.', prefix: 'split diopter dual focus shot of', suffix: 'both near and far subjects in sharp focus simultaneously, split screen depth illusion' },
    { id: 'comp-motion-freeze', category: 'shot', nameKo: '순간 포착 모션 프리즈', emoji: '⚡', desc: '고속 셔터로 물방울·먼지·불꽃이 공중에 정지된 순간을 포착한 극적인 하이스피드 프리즈.', prefix: 'high-speed frozen motion capture of', suffix: 'suspended particles or droplets frozen in mid-air, split-second temporal freeze' },
    { id: 'comp-detail-cutaway', category: 'shot', nameKo: '단면 절개 클로즈업', emoji: '🔬', desc: '오브젝트의 내부 단면이나 해부된 구조를 클로즈업으로 드러내는 기술·과학적 절개 구도.', prefix: 'technical cutaway cross-section closeup of', suffix: 'revealing internal structure and layers, scientific dissection visual clarity' },

    // 앵글 (angle) 추가 8종
    { id: 'comp-rear-view', category: 'angle', nameKo: '피사체 후면 백뷰', emoji: '🔙', desc: '피사체 뒤에서 같은 방향으로 바라보는 리어뷰 앵글. 피사체와 관객이 같은 시선을 공유하는 공감형 구도.', prefix: 'rear view following perspective of', suffix: 'shooting from behind subject looking in the same direction, shared point of view' },
    { id: 'comp-orbit-wrap', category: 'angle', nameKo: '오비트 랩어라운드', emoji: '🔄', desc: '카메라가 피사체 주변을 360° 공전하듯 감싸는 오비트 앵글. 입체적 공간 관계와 전체 형태를 드러낸다.', prefix: 'orbiting wrap-around angle of', suffix: '360 degree orbit perspective revealing full spatial relationship and form' },
    { id: 'comp-three-quarter-low', category: 'angle', nameKo: '3쿼터 로우 앵글', emoji: '📐', desc: '아래쪽에서 45° 비스듬히 올려다보는 3쿼터 로우 앵글. 피사체에 압도적 존재감과 권위를 부여한다.', prefix: 'three-quarter low angle upward shot of', suffix: 'camera below eye level tilted up at 45 degrees, dominant imposing presence' },
    { id: 'comp-environmental-portrait', category: 'angle', nameKo: '환경 초상 구도', emoji: '🌍', desc: '피사체를 그 삶의 맥락과 환경 속에 배치해 인물과 공간의 관계를 동시에 담아내는 환경 초상 구도.', prefix: 'environmental portrait angle of', suffix: 'subject placed within their natural environment and context, relationship between person and space' },
    { id: 'comp-steep-oblique', category: 'angle', nameKo: '급각 사선 오블리크', emoji: '🛩️', desc: '거의 수직에 가깝게 내려다보며 동시에 방향 사선이 있는 급각 오블리크 앵글. 지도식 조감과 원근감을 동시에 준다.', prefix: 'steep oblique aerial angle of', suffix: 'nearly vertical downward gaze with directional diagonal, cartographic bird\'s-eye with forced perspective' },
    { id: 'comp-under-surface', category: 'angle', nameKo: '밑면 언더 앵글', emoji: '⬇️', desc: '유리 바닥 아래나 수면 아래에서 완전히 수직으로 올려다보는 극단적 언더 앵글.', prefix: 'under-surface looking straight up angle of', suffix: 'camera directly below the subject looking upward through glass or water, extreme underbelly perspective' },
    { id: 'comp-telephoto-flat', category: 'angle', nameKo: '망원 원근 압축', emoji: '🔭', desc: '초망원 렌즈로 원근감을 극도로 압축해 앞·뒤 요소가 동일 평면에 붙어 보이는 스택 앵글.', prefix: 'super telephoto compressed perspective of', suffix: 'extreme focal length flattening depth, background and foreground elements stacked on same plane' },
    { id: 'comp-corner-peek', category: 'angle', nameKo: '코너 피크 엿보기', emoji: '👁️', desc: '건물 모서리, 벽, 문틀 가장자리 뒤에서 살짝 엿보는 서스펜스 앵글.', prefix: 'peek-around corner candid angle of', suffix: 'partially hidden by edge or corner, voyeuristic suspense angle, natural surveillance framing' },

    // 레이아웃 (layout) 추가 8종
    { id: 'comp-z-pattern', category: 'layout', nameKo: 'Z형 시선 흐름', emoji: '↩️', desc: '시선이 좌상→우상→좌하→우하로 Z자를 그리며 이동하도록 유도하는 레이아웃.', prefix: 'Z-pattern reading flow layout of', suffix: 'visual elements arranged to guide the eye in a Z-path across the frame, editorial flow composition' },
    { id: 'comp-negative-space', category: 'layout', nameKo: '네거티브 스페이스 여백', emoji: '◻️', desc: '피사체보다 빈 공간을 훨씬 크게 남겨 여백 자체가 구도를 지배하는 고급 미니멀 레이아웃.', prefix: 'dominant negative space minimal layout of', suffix: 'subject occupies small portion of frame, vast intentional empty space creating breathing room and tension' },
    { id: 'comp-s-curve-flow', category: 'layout', nameKo: 'S 커브 시선 흐름', emoji: '〰️', desc: '뱀처럼 구불구불 S자를 그리는 곡선 요소가 화면 전체를 흐르며 유기적인 생동감을 부여하는 구도.', prefix: 'S-curve leading line composition of', suffix: 'sinuous S-shaped visual flow path guiding the eye through the entire frame, organic dynamic rhythm' },
    { id: 'comp-cross-grid', category: 'layout', nameKo: '십자형 교차 구성', emoji: '✚', desc: '수직선과 수평선이 교차하는 십자 구조로 화면을 구획하는 강한 건축적 레이아웃.', prefix: 'cross-grid structural composition of', suffix: 'strong vertical and horizontal lines intersecting, architectural division creating four quadrants' },
    { id: 'comp-triptych', category: 'layout', nameKo: '세 폭 분할 트립틱', emoji: '🔛', desc: '화면을 세 패널로 균등 분할해 같은 주제의 다른 관점이나 시퀀스를 병렬 배치하는 3폭 구성.', prefix: 'triptych three-panel composition of', suffix: 'frame divided into three equal panels showing different views or sequences side by side' },
    { id: 'comp-horizontal-band', category: 'layout', nameKo: '수평 밴드 레이어', emoji: '🌅', desc: '하늘·중경·전경을 수평 띠로 명확하게 구분하는 지평선 강조 밴드 레이아웃. 파노라마적 안정감.', prefix: 'horizontal banding layered composition of', suffix: 'distinct horizontal color bands from foreground to sky, layered strata composition, panoramic stability' },
    { id: 'comp-staggered-grid', category: 'layout', nameKo: '어긋난 오프셋 그리드', emoji: '🔲', desc: '격자 배치에서 행마다 절반씩 어긋나게 오프셋하는 벽돌쌓기식 역동적 그리드 레이아웃.', prefix: 'staggered offset grid layout of', suffix: 'brick-pattern offset rows creating dynamic interlocking rhythm, alternating shifted grid modules' },
    { id: 'comp-cluster-scatter', category: 'layout', nameKo: '클러스터 분산 군집', emoji: '🌌', desc: '오브젝트들이 화면 이곳저곳에 밀도 차이를 두며 유기적으로 산포되는 군집 레이아웃.', prefix: 'clustered scatter arrangement of', suffix: 'organic groupings of elements at varying densities scattered across frame, constellation-like distribution' }
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

  const MIXER_COMPOSITION_SAMPLES = {
    'comp-extreme-close-up': 'photo-1502082553048-f009c37129b9',
    'comp-medium-shot': 'photo-1534528741775-53994a69daeb',
    'comp-wide-angle': 'photo-1470071459604-3b5ec3a7fe05',
    'comp-knolling': 'photo-1506784983877-45594efa4cbe',
    'comp-low-angle': 'photo-1486406146926-c627a92ad1ab',
    'comp-high-angle': 'photo-1522071820081-009f0129c71c',
    'comp-aerial': 'photo-1473442240418-452f03b7ae40',
    'comp-isometric': 'photo-1541701494587-cb58502866ab',
    'comp-rule-of-thirds': 'photo-1500485035595-cbe6f645feb1',
    'comp-symmetry': 'photo-1439853949127-fa647821eba0',
    'comp-spiral': 'photo-1513002749550-c59d786b8e6c',
    'comp-framing': 'photo-1469854523086-cc02fe5d8800',
    'comp-extreme-wide': 'photo-1472214222541-d510753a49df',
    'comp-macro-bokeh': 'photo-1555597673-b21d5c935865',
    'comp-panoramic': 'photo-1464822759023-fed622ff2c3b',
    'comp-telescopic': 'photo-1516426122078-c23e76319801',
    'comp-three-quarter': 'photo-1506794778202-cad84cf45f1d',
    'comp-full-shot': 'photo-1509631179647-0177331693ae',
    'comp-head-on': 'photo-1544005313-94ddf0286df2',
    'comp-pov': 'photo-1517245386807-bb43f82c33c4',
    'comp-candid': 'photo-1511671782779-c97d3d27a1d4',
    'comp-super-telephoto': 'photo-1447752875215-b2761acb3c5d',
    'comp-worms-eye': 'photo-1509198397868-475647b2a1e5',
    'comp-birds-eye': 'photo-1504608524841-42fe6f032b4b',
    'comp-dutch-angle': 'photo-1536440136628-849c177e76a1',
    'comp-eye-level': 'photo-1500648767791-00dcc994a43e',
    'comp-ground-level': 'photo-1551698618-1ffd5f97d728',
    'comp-side-profile': 'photo-1500648767791-00dcc994a43e',
    'comp-over-shoulder': 'photo-1522075469751-3a6694fb2f61',
    'comp-three-quarter-top': 'photo-1505740420928-5e560c06d30e',
    'comp-fisheye': 'photo-1516035069371-29a1b244cc32',
    'comp-low-angle-silhouette': 'photo-1502082553048-f009c37129b9',
    'comp-copy-left': 'photo-1486312338219-ce68d2c6f44d',
    'comp-copy-right': 'photo-1513542789411-b6a5d4f31634',
    'comp-centered-focus': 'photo-1518709268805-4e9042af9f23',
    'comp-diagonals': 'photo-1519074069444-1ba4ae167512',
    'comp-triangular': 'photo-1513694203232-719a280e022f',
    'comp-thirds-offset': 'photo-1518005020951-eccb494ad742',
    'comp-layered-framing': 'photo-1449034446853-66c86144b0ad',
    'comp-radial': 'photo-1507525428034-b723cf961d3e',
    'comp-floating-suspension': 'photo-1618005182384-a83a8bd57fbe',
    'comp-split': 'photo-1513829092301-a72c4eb04300',

    // shot 추가 8종
    'comp-tilt-shift':             'photo-1477959858617-67f85cf4f1df',
    'comp-double-exposure':        'photo-1508739773434-c26b3d09e071',
    'comp-underwater':             'photo-1503803548695-c2a7b4a5b875',
    'comp-reflection-mirror':      'photo-1501630834273-4b5604d2ee31',
    'comp-zoom-burst':             'photo-1533073526757-2c8ca1df9f1d',
    'comp-split-diopter':          'photo-1559827260-dc66d52bef19',
    'comp-motion-freeze':          'photo-1504701954957-2010ec3bcec1',
    'comp-detail-cutaway':         'photo-1533749047139-189de3cf06d3',

    // angle 추가 8종
    'comp-rear-view':              'photo-1507003211169-0a1dd7228f2d',
    'comp-orbit-wrap':             'photo-1534430480872-3498386e7856',
    'comp-three-quarter-low':      'photo-1486406146926-c627a92ad1ab',
    'comp-environmental-portrait': 'photo-1556157382-97eda2d62296',
    'comp-steep-oblique':          'photo-1473442240418-452f03b7ae40',
    'comp-under-surface':          'photo-1527482937786-6608f6e14c15',
    'comp-telephoto-flat':         'photo-1551135049-8a33b5883817',
    'comp-corner-peek':            'photo-1499678329028-101435549a4e',

    // layout 추가 8종
    'comp-z-pattern':              'photo-1486312338219-ce68d2c6f44d',
    'comp-negative-space':         'photo-1559494007-9f5847c49d94',
    'comp-s-curve-flow':           'photo-1441974231531-c6227db76b6e',
    'comp-cross-grid':             'photo-1448630360428-65456885c650',
    'comp-triptych':               'photo-1509198397868-475647b2a1e5',
    'comp-horizontal-band':        'photo-1464822759023-fed622ff2c3b',
    'comp-staggered-grid':         'photo-1518005020951-eccb494ad742',
    'comp-cluster-scatter':        'photo-1535380210974-fba9d0462c27'
  };

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

  // 로컬 상태
  let activeStep = 1; // Wizard 단계: 1, 2, 3, 4, 5
  let activeCategory = 'steel';
  let selectedCompositionId = 'none';
  let selectedTypographyId = 'none';
  let activeCompositionCategory = 'all';
  let activeTypographyCategory = 'all';
  let selectedSubjId = 'mix-steel-hot-rolling';
  let selectedMediumId = 'med-3d';
  let selectedPaletteIdx = 0; // 기본: 선택 안 함 (None)
  let activePaletteFilter = 'all';
  let activePaletteColorFilter = 'all';
  let activePaletteTagFilter = 'all';
  let customSubjectKo = '';
  let customSubjectEn = '';
  let customSubjectMode = 'ko'; // 'ko' = 한글번역, 'en' = 영어직접입력
  let activeMediumCategory = MIXER_MEDIUMS.find(medium => medium.id === selectedMediumId)?.category || 'tech3d';
  let activePaletteCategory = 'all';
  let isPaletteOverriddenByUser = false;
  let lastGeneratedImageUrl = null;
  let lastGeneratedPrompt = null;
  let isSubjectOverlayOpen = false;
  let isMediumOverlayOpen = false;

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
      max-height: calc(100vh - 160px);
      overflow-y: auto;
      scrollbar-width: thin;
    }
    .mixer-right {
      display: flex;
      flex-direction: column;
      align-self: flex-start;
      position: sticky;
      top: 135px;
      width: 100%;
      min-width: 0;
    }

    /* 위저드 스텝퍼 */
    .mixer-stepper {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
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
    .hl-composition {
      color: #e65100;
      font-weight: 700;
    }
    .hl-lighting {
      color: #7b2cbf;
      font-weight: 700;
    }

    /* 미니 썸네일 카드 디자인 */
    .mixer-item-thumb {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      border-top-left-radius: 12px;
      border-top-right-radius: 12px;
      background: var(--surface-2, #f1f5f9);
    }
    .mixer-item-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .mixer-item-thumb-settings-btn {
      position: absolute;
      top: 6px;
      right: 6px;
      z-index: 5;
      background: rgba(15, 23, 42, 0.72);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 50%;
      color: white;
      width: 24px;
      height: 24px;
      font-size: 11px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
      transition: all 0.2s;
    }
    .mixer-item-thumb-settings-btn:hover {
      background: var(--accent, #4361ee);
      transform: scale(1.1);
    }
    .mixer-item-thumb-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.98);
      z-index: 10;
      display: flex;
      flex-direction: column;
      padding: 6px;
      box-sizing: border-box;
      border-top-left-radius: 12px;
      border-top-right-radius: 12px;
    }
    .mixer-item-thumb-overlay[hidden] {
      display: none !important;
    }
    [data-theme="dark"] .mixer-item-thumb-overlay {
      background: rgba(15, 23, 42, 0.98);
      color: #f1f5f9;
    }
    .overlay-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--line, #e2e8f0);
      padding-bottom: 3px;
      margin-bottom: 4px;
    }
    .overlay-header span {
      font-size: 10px;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
    }
    .overlay-close-btn {
      background: none;
      border: none;
      color: var(--text-secondary, #64748b);
      font-size: 14px;
      cursor: pointer;
      line-height: 1;
      padding: 0;
    }
    .overlay-close-btn:hover {
      color: var(--text-primary, #0f172a);
    }
    .overlay-btn {
      border: 1px solid var(--line, #cbd5e1);
      background: var(--surface-1, #fff);
      color: var(--text-primary, #334155);
      border-radius: 4px;
      transition: all 0.2s;
    }
    .overlay-btn:hover:not([disabled]) {
      background: var(--line, #f1f5f9);
      border-color: #94a3b8;
    }
    .overlay-btn[disabled] {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .overlay-btn.btn-apply {
      background: #10b981;
      color: white;
      border-color: #10b981;
    }
    .overlay-btn.btn-apply:hover {
      background: #059669;
    }
    [data-theme="dark"] .overlay-btn {
      border-color: #475569;
      background: #1e293b;
      color: #cbd5e1;
    }
    [data-theme="dark"] .overlay-btn:hover:not([disabled]) {
      background: #334155;
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
      flex-wrap: wrap;
      gap: 5px;
      padding-bottom: 10px;
      margin-bottom: 4px;
      border-bottom: 1px solid var(--line, #e5e7eb);
    }
    .mixer-cat-btn {
      border: 1px solid var(--line, #e2e8f0);
      background: var(--surface-alt, #f8fafc);
      padding: 4px 11px;
      font-size: 12px;
      font-weight: 600;
      color: var(--ink-soft, #64748b);
      cursor: pointer;
      border-radius: 20px;
      transition: all 0.18s;
      white-space: nowrap;
      line-height: 1.5;
    }
    .mixer-cat-btn:hover {
      border-color: var(--accent, #4361ee);
      color: var(--accent, #4361ee);
      background: var(--accent-soft, rgba(67,97,238,0.07));
    }
    .mixer-cat-btn.active {
      background: var(--accent, #4361ee);
      color: #fff;
      border-color: var(--accent, #4361ee);
      font-weight: 700;
    }

    /* 그리드 형태 선택기 */
    .mixer-subj-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 9px;
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
      flex-wrap: wrap;
      gap: 5px;
      padding-bottom: 10px;
      margin-bottom: 4px;
      border-bottom: 1px solid var(--line, #e5e7eb);
    }
    .mixer-cat-btn {
      border: 1px solid var(--line, #e2e8f0);
      background: var(--surface-alt, #f8fafc);
      padding: 4px 11px;
      font-size: 11px;
      font-weight: 600;
      color: var(--ink-soft, #64748b);
      cursor: pointer;
      border-radius: 20px;
      transition: all 0.18s;
      white-space: nowrap;
      line-height: 1.5;
    }
    .mixer-cat-btn:hover {
      border-color: var(--accent, #4361ee);
      color: var(--accent, #4361ee);
      background: var(--accent-soft, rgba(67,97,238,0.07));
    }
    .mixer-cat-btn.active {
      background: var(--accent, #4361ee);
      color: #fff;
      border-color: var(--accent, #4361ee);
      font-weight: 700;
    }

    /* 그리드 형태 선택기 */
    .mixer-subj-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px;
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

    /* 필터 바 묶음 — 2열 그리드 (레이블 | 컨테이너) */
    .mixer-pal-filters-row {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 6px 10px;
      align-items: center;
      margin-bottom: 14px;
    }

    /* 그룹 래퍼는 레이아웃에서 투명하게 — 자식이 직접 그리드 셀이 됨 */
    .mixer-pal-filter-group {
      display: contents;
    }

    /* 필터 레이블 */
    .mixer-pal-filter-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--ink-soft, #64748b);
      text-align: right;
      white-space: nowrap;
      letter-spacing: 0.01em;
    }

    /* 팔레트 필터 탭 컨테이너 (3개 행 공통) */
    .mixer-pal-filter-tabs {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
      background: var(--surface-2, #f1f5f9);
      padding: 4px;
      border-radius: 8px;
      border: 1px solid var(--line, #e2e8f0);
    }
    .mixer-pal-filter-btn {
      border: 0;
      background: transparent;
      padding: 5px 11px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary, #64748b);
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    }
    .mixer-pal-filter-btn.active {
      background: var(--surface-1, #ffffff);
      color: var(--accent, #4361ee);
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
      font-weight: 700;
    }

    /* 색상 스와치 컨테이너 — mixer-pal-filter-tabs 공통 스타일 상속 */
    .mixer-pal-color-filter {
      gap: 5px;
    }
    .mixer-pal-color-btn {
      border: 2px solid transparent;
      border-radius: 50%;
      width: 26px;
      height: 26px;
      cursor: pointer;
      padding: 0;
      background: var(--swatch, #ccc);
      transition: transform 0.15s, border-color 0.15s;
      position: relative;
    }
    .mixer-pal-color-btn[data-pal-color="all"] {
      width: auto;
      height: 26px;
      border-radius: 13px;
      padding: 0 10px;
      background: var(--surface-alt, #f1f5f9);
      border-color: var(--line, #e2e8f0);
      font-size: 11px;
      font-weight: 600;
      color: var(--ink-soft, #64748b);
    }
    .mixer-pal-color-btn[data-pal-color="all"].active {
      background: var(--accent, #4361ee);
      color: #fff;
      border-color: var(--accent, #4361ee);
    }
    .mixer-pal-color-btn:not([data-pal-color="all"]):hover {
      transform: scale(1.18);
    }
    .mixer-pal-color-btn:not([data-pal-color="all"]).active {
      border-color: var(--ink, #132238);
      transform: scale(1.2);
      box-shadow: 0 0 0 2px var(--surface, #fff), 0 0 0 4px var(--ink, #132238);
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


    /* 구도 & 리터칭 전용 가변 높이 및 설명글 전체 노출 스타일 */
    #mixerCompositionGrid,
    #mixerTypographyGrid {
      grid-auto-rows: minmax(146px, auto);
    }
    #mixerCompositionGrid .mixer-item,
    #mixerTypographyGrid .mixer-item {
      display: flex;
      flex-direction: column;
      background: var(--surface-1, #ffffff);
      border: 1px solid var(--line, #e2e8f0);
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 5px rgba(0,0,0,0.03);
    }
    #mixerCompositionGrid .mixer-item.active,
    #mixerTypographyGrid .mixer-item.active {
      border-color: var(--accent, #4361ee);
      box-shadow: 0 4px 12px rgba(67, 97, 238, 0.12);
    }
    #mixerCompositionGrid .mixer-item .mixer-item-desc,
    #mixerTypographyGrid .mixer-item .mixer-item-desc {
      display: block;
      overflow: visible;
      -webkit-line-clamp: unset;
      font-size: 11.5px;
      line-height: 1.45;
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
      transition: box-shadow 0.25s ease;
      animation: mixerPreviewFadeIn 0.3s ease-out;
    }

    @keyframes mixerPreviewFadeIn {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* 미리보기 카드 hover: 위치 이동/색 변동 없이 그림자만 강화 */
    .mixer-preview-card:hover {
      box-shadow: 0 14px 34px rgba(0, 0, 0, 0.08);
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
      padding: 14px 16px;
      color: white;
      display: flex;
      flex-direction: column;
      gap: 8px;
      position: relative;
    }
    /* 팔레트 색에 관계없이 흰 글씨 가독성 보장하는 스크림 */
    .mixer-preview-header::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(0,0,0,0.32), rgba(0,0,0,0.14));
      pointer-events: none;
    }
    .mixer-preview-header > * {
      position: relative;
      z-index: 1;
    }
    .mixer-preview-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 16px;
    }
    .mixer-preview-meta-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .mixer-preview-meta-label {
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      opacity: 0.75;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    }
    .mixer-preview-meta-value {
      font-size: 14px;
      font-weight: 700;
      text-shadow: 0 1px 3px rgba(0,0,0,0.25);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .mixer-preview-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-top: 6px;
      border-top: 1px solid rgba(255,255,255,0.2);
    }
    .mixer-preview-code {
      font-size: 9.5px;
      font-family: monospace;
      opacity: 0.8;
      letter-spacing: 0.03em;
    }
    .mixer-preview-palette {
      font-size: 11px;
      font-weight: 600;
      opacity: 0.9;
      text-shadow: 0 1px 2px rgba(0,0,0,0.15);
    }
    .mixer-preview-body {
      padding: 12px 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
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

    .mixer-custom-subject-row {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--surface-2, #f8fafc);
      border: 1px solid var(--line, #e2e8f0);
      border-radius: 8px;
      padding: 7px 10px;
    }
    .mixer-custom-subject-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--ink-soft, #64748b);
      white-space: nowrap;
      letter-spacing: 0.01em;
    }
    .mixer-custom-mode-toggle {
      display: flex;
      border: 1px solid var(--line, #e2e8f0);
      border-radius: 6px;
      overflow: hidden;
      flex-shrink: 0;
    }
    .mixer-custom-mode-btn {
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 600;
      border: none;
      border-radius: 0;
      background: transparent;
      color: var(--ink-soft, #64748b);
      cursor: pointer;
      white-space: nowrap;
    }
    .mixer-custom-mode-btn + .mixer-custom-mode-btn {
      border-left: 1px solid var(--line, #e2e8f0);
    }
    .mixer-custom-mode-btn.active {
      background: var(--accent, #4361ee);
      color: #fff;
    }
    .mixer-custom-mode-btn:not(.active):hover {
      background: var(--surface-3, #e2e8f0);
    }
    .mixer-custom-subject-input {
      flex: 1;
      border: 1px solid var(--line, #e2e8f0);
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 13px;
      background: var(--surface, #fff);
      color: var(--ink, #1a1f2b);
      outline: none;
      min-width: 0;
    }
    .mixer-custom-subject-input:focus {
      border-color: var(--accent, #4361ee);
      box-shadow: 0 0 0 2px rgba(67,97,238,0.12);
    }
    .mixer-custom-subject-apply,
    .mixer-custom-subject-clear {
      border: 1px solid var(--line, #e2e8f0);
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }
    .mixer-custom-subject-apply {
      background: var(--accent, #4361ee);
      color: #fff;
      border-color: var(--accent, #4361ee);
    }
    .mixer-custom-subject-apply:hover { opacity: 0.88; }
    .mixer-custom-subject-clear {
      background: transparent;
      color: var(--ink-soft, #64748b);
    }
    .mixer-custom-subject-clear:hover:not(:disabled) { background: var(--surface-3, #e2e8f0); }
    .mixer-custom-subject-clear:disabled { opacity: 0.38; cursor: default; }
    .mixer-custom-subject-preview {
      font-size: 12px;
      color: #10b981;
      padding: 0 4px;
    }
    .mixer-custom-subject-preview em {
      font-style: normal;
      font-weight: 600;
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
    .mixer-action-btn.slidedoc {
      background: #0f766e;
      color: white;
      box-shadow: 0 2px 4px rgba(15, 118, 110, 0.15);
    }
    .mixer-action-btn.slidedoc:hover {
      background: #0d6660;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(15, 118, 110, 0.25);
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
      margin-left: auto;
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
      left: -9999px !important;
      top: -9999px !important;
      width: 1px !important;
      height: 1px !important;
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
      display: flex;
    }
    .mixer-result-image-half {
      flex: 1;
      position: relative;
      overflow: hidden;
      height: 100%;
    }
    .mixer-result-image-half img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .mixer-half-settings-trigger {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 10;
      background: rgba(2, 6, 23, 0.72);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      cursor: pointer;
      font-size: 13px;
      backdrop-filter: blur(8px);
      transition: all 0.2s;
    }
    .mixer-half-settings-trigger:hover {
      background: var(--accent, #4361ee);
      transform: scale(1.08);
    }
    .mixer-image-overlay-panel {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      max-height: 72%;
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: #1a1f2b;
      z-index: 15;
      display: none;
      flex-direction: column;
      padding: 6px 8px;
      box-sizing: border-box;
      font-size: 11px;
      border-top: 1px solid rgba(0,0,0,0.06);
      box-shadow: 0 -4px 16px rgba(0,0,0,0.06);
      gap: 4px;
      overflow-y: auto;
    }
    [data-theme="dark"] .mixer-image-overlay-panel {
      background: rgba(15, 23, 42, 0.90);
      color: #eaeaea;
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    .mixer-image-overlay-panel.active {
      display: flex;
    }
    .mixer-image-overlay-panel .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 700;
      font-size: 11px;
      border-bottom: 1px solid var(--line, #e2e8f0);
      padding-bottom: 3px;
      margin-bottom: 2px;
    }
    .mixer-image-overlay-panel .panel-close-btn {
      background: transparent;
      border: 0;
      font-size: 16px;
      cursor: pointer;
      color: var(--text-secondary, #64748b);
      line-height: 1;
      padding: 0 4px;
    }
    .mixer-image-overlay-panel .panel-close-btn:hover {
      color: var(--ink, #1a1f2b);
    }
    [data-theme="dark"] .mixer-image-overlay-panel .panel-close-btn:hover {
      color: #fff;
    }
    .mixer-image-overlay-panel .panel-body {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    /* 키워드 행: input + ✓ + ↺ 한 줄 */
    .mixer-image-overlay-panel .panel-keyword-row {
      display: flex;
      flex-direction: row;
      gap: 3px;
      align-items: center;
    }
    .mixer-image-overlay-panel .panel-keyword-row input {
      flex: 1;
      min-width: 0;
      padding: 4px 6px;
      border: 1px solid var(--line, #dbe2ea);
      border-radius: 4px;
      background: var(--surface-1, #fff);
      color: var(--ink, #1a1f2b);
      font-size: 10px;
      outline: none;
      box-sizing: border-box;
    }
    [data-theme="dark"] .mixer-image-overlay-panel .panel-keyword-row input {
      background: #0f172a;
      color: #eaeaea;
      border-color: #334155;
    }
    /* 아이콘 버튼 (✓ / ↺) */
    .mixer-image-overlay-panel .panel-icon-btn {
      flex: 0 0 24px;
      height: 24px;
      padding: 0;
      font-size: 11px;
      font-weight: 700;
      border-radius: 4px;
      border: 1px solid var(--line, #dbe2ea);
      background: var(--surface-2, #f8fafc);
      color: var(--ink, #1a1f2b);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    [data-theme="dark"] .mixer-image-overlay-panel .panel-icon-btn {
      background: #1e293b;
      color: #eaeaea;
      border-color: #334155;
    }
    .mixer-image-overlay-panel .panel-icon-btn:hover:not(:disabled) {
      border-color: var(--accent, #4361ee);
      color: var(--accent, #4361ee);
    }
    .mixer-image-overlay-panel .panel-icon-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    /* 사진 제어: 4버튼 1행 */
    .mixer-image-overlay-panel .panel-actions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 3px;
    }
    .mixer-image-overlay-panel .panel-action-btn {
      padding: 3px 1px;
      font-size: 9.5px;
      font-weight: 600;
      border-radius: 4px;
      border: 1px solid var(--line, #dbe2ea);
      background: var(--surface-2, #f8fafc);
      color: var(--ink, #1a1f2b);
      cursor: pointer;
      text-align: center;
      white-space: nowrap;
    }
    [data-theme="dark"] .mixer-image-overlay-panel .panel-action-btn {
      background: #1e293b;
      color: #eaeaea;
      border-color: #334155;
    }
    .mixer-image-overlay-panel .panel-action-btn-wide {
      width: 100%;
      font-size: 10px;
      padding: 4px 3px;
    }
    .mixer-image-overlay-panel .panel-action-btn:hover:not(:disabled) {
      border-color: var(--accent, #4361ee);
      color: var(--accent, #4361ee);
    }
    .mixer-image-overlay-panel .panel-action-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .mixer-image-overlay-panel .panel-status-msg {
      font-size: 9px;
      color: var(--text-secondary, #64748b);
      min-height: 11px;
      line-height: 1.2;
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
      z-index: 9;
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
      flex-wrap: wrap;
      overflow: visible;
    }
    .mixer-cat-btn {
      font-size: 12px;
    }
    .mixer-subj-grid {
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      grid-auto-rows: 92px;
      gap: 9px;
      padding-top: 4px;
    }
    .mixer-med-grid {
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      grid-auto-rows: 92px;
      gap: 9px;
      align-items: stretch;
      padding-top: 4px;
    }
    .mixer-palettes-group-grid {
      grid-auto-rows: 146px;
      padding-top: 4px;
    }
    .mixer-item-card {
      height: 100%;
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
      display: -webkit-box;
      overflow: hidden;
      font-size: 12.5px;
      line-height: 1.55;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
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
    [data-theme="dark"] .mixer-prompt-details {
      border-color: #2b2b3d;
    }
    [data-theme="dark"] .mixer-prompt-details summary {
      background: #1e1e2d;
      color: #eaeaea;
    }
    [data-theme="dark"] .mixer-prompt-details .mixer-preview-prompt-box {
      border-top-color: #2b2b3d;
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
      .mixer-left {
        max-height: none;
        overflow-y: visible;
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
        grid-auto-rows: auto;
      }
      .mixer-palettes-group-grid {
        grid-auto-rows: auto;
      }
      .mixer-item-card {
        min-height: 92px;
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

  // 헥스 색상을 자연어 이름으로 매핑하는 헬퍼
  function getPaletteColorNames(colors) {
    const tempMap = {
      "#ffffff": "pure white", "#000000": "true black", "#ffd700": "gold",
      "#ff0000": "red", "#0000ff": "blue", "#00ff00": "green",
      "#ff6600": "orange", "#ff0555": "crimson", "#ff00ff": "magenta",
      "#00ffff": "cyan", "#7d7d7d": "gray", "#1a1a2e": "dark navy",
      "#16213e": "navy", "#ffe8b8": "warm cream", "#ff9de2": "pink",
      "#ee0979": "magenta", "#ff6a00": "orange", "#0099f7": "blue",
      "#fc4a1a": "orange-red", "#4d96ff": "sky blue", "#6bcb77": "fresh green",
      "#ffd93d": "bright yellow", "#ff6b6b": "coral red", "#d4a5e5": "soft lilac",
      "#ffaaa5": "coral orange", "#ffd3b6": "warm peach", "#dcedc1": "sage green",
      "#a8e6cf": "pale mint", "#c9a84c": "metallic gold", "#e76f51": "burnt terracotta",
      "#f4a261": "sandy orange", "#e9c46a": "golden yellow", "#2a9d8f": "emerald teal",
      "#264653": "dark slate blue", "#ffd6a5": "warm peach", "#a8dadc": "powder blue",
      "#f1faee": "off-white", "#457b9d": "steel blue", "#e63946": "vibrant tomato red",
      "#8ac926": "lime green", "#1982c4": "royal blue", "#6a4c93": "deep purple",
      "#ffca3a": "amber yellow", "#ff595e": "vivid red", "#8b0000": "deep crimson",
      "#1a1a5e": "dark navy", "#daa520": "golden amber", "#8b4513": "saddle brown",
      "#2d4a22": "deep forest green", "#ff922b": "warm orange", "#caffbf": "pale mint green",
      "#ffd6ff": "soft lavender", "#ffb3c6": "rose pink", "#fdffb6": "lemon yellow",
      "#ffecd2": "cream white", "#fbc2eb": "blush pink", "#a18cd1": "soft purple",
      "#fad0c4": "peach pink", "#ff9a9e": "salmon pink", "#44f7c2": "turquoise",
      "#0099f7": "electric blue", "#f7b733": "amber yellow", "#38ef7d": "lime green",
      "#11998e": "deep teal", "#ffe5b4": "warm peach", "#ff8f00": "amber orange",
      "#8ae9a8": "pale green", "#0b333e": "deep slate blue", "#7cd1f9": "sky blue",
      "#0c4b82": "ocean blue", "#ffd57a": "pastel yellow", "#ff7a7a": "pastel red"
    };
    return colors.map(c => {
      let clean = String(c || "").toLowerCase().trim();
      if (clean.startsWith("#")) {
        if (clean.length === 4) {
          clean = "#" + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3];
        }
        return tempMap[clean] || clean;
      }
      return clean;
    }).filter(Boolean).join(", ");
  }

  function escapeMixerHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function resolveMixerSubject() {
    const categoryList = activeCategory === 'all'
      ? Object.values(MIXER_SUBJECTS).flat()
      : (MIXER_SUBJECTS[activeCategory] || []);
    return categoryList.find(s => s.id === selectedSubjId) || categoryList[0] || null;
  }

  function resolveMixerMedium() {
    return MIXER_MEDIUMS.find(m => m.id === selectedMediumId) || MIXER_MEDIUMS[0] || null;
  }

  function resolveMixerComposition() {
    if (!selectedCompositionId || selectedCompositionId === 'none') return null;
    return MIXER_COMPOSITIONS.find(c => c.id === selectedCompositionId) || null;
  }

  function resolveMixerTypography() {
    if (!selectedTypographyId || selectedTypographyId === 'none') return null;
    return MIXER_TYPOGRAPHIES.find(r => r.id === selectedTypographyId) || null;
  }

  // 한글 주제어 → 영어 변환 사전
  const KO_EN_SUBJECT_MAP = {
    // 사람/직업
    '의사': 'doctor', '간호사': 'nurse', '교사': 'teacher', '선생님': 'teacher',
    '학생': 'student', '어린이': 'children', '아이': 'child', '아기': 'baby',
    '노인': 'elderly person', '여성': 'woman', '남성': 'man', '부부': 'couple',
    '가족': 'family', '친구': 'friends', '직장인': 'office worker', '요리사': 'chef',
    '운동선수': 'athlete', '음악가': 'musician', '예술가': 'artist', '과학자': 'scientist',
    '엔지니어': 'engineer', '건축가': 'architect', '디자이너': 'designer',
    // 동물
    '고양이': 'cat', '강아지': 'dog', '개': 'dog', '말': 'horse', '새': 'bird',
    '독수리': 'eagle', '나비': 'butterfly', '물고기': 'fish', '고래': 'whale',
    '호랑이': 'tiger', '사자': 'lion', '여우': 'fox', '늑대': 'wolf', '곰': 'bear',
    '토끼': 'rabbit', '판다': 'panda', '코끼리': 'elephant', '기린': 'giraffe',
    '용': 'dragon', '봉황': 'phoenix',
    // 음식/음료
    '커피': 'coffee', '차': 'tea', '케이크': 'cake', '빵': 'bread', '라면': 'ramen',
    '스시': 'sushi', '피자': 'pizza', '버거': 'burger', '과일': 'fruit', '채소': 'vegetables',
    '와인': 'wine', '맥주': 'beer', '칵테일': 'cocktail',
    // 자연/풍경
    '산': 'mountain', '바다': 'ocean', '강': 'river', '숲': 'forest', '꽃': 'flowers',
    '나무': 'tree', '하늘': 'sky', '구름': 'clouds', '별': 'stars', '달': 'moon',
    '태양': 'sun', '일출': 'sunrise', '일몰': 'sunset', '폭포': 'waterfall',
    '사막': 'desert', '눈': 'snow', '비': 'rain', '벚꽃': 'cherry blossoms',
    '단풍': 'autumn leaves',
    // 도시/건물
    '도시': 'city', '빌딩': 'building', '집': 'house', '성': 'castle', '탑': 'tower',
    '다리': 'bridge', '거리': 'street', '시장': 'market', '카페': 'cafe',
    '도서관': 'library', '병원': 'hospital', '학교': 'school', '공장': 'factory',
    '항구': 'harbor', '공항': 'airport',
    // 기술/제품
    '로봇': 'robot', '자동차': 'car', '자전거': 'bicycle', '오토바이': 'motorcycle',
    '비행기': 'airplane', '배': 'ship', '기차': 'train', '스마트폰': 'smartphone',
    '컴퓨터': 'computer', '카메라': 'camera', '드론': 'drone',
    // 스포츠/활동
    '축구': 'soccer', '농구': 'basketball', '야구': 'baseball', '수영': 'swimming',
    '등산': 'hiking', '달리기': 'running', '댄스': 'dance', '요가': 'yoga',
    '게임': 'gaming',
    // 비즈니스/추상
    '협업': 'teamwork', '성장': 'growth', '혁신': 'innovation', '데이터': 'data',
    '네트워크': 'network', '글로벌': 'global', '비즈니스': 'business',
    '창의성': 'creativity', '미래': 'future', '에너지': 'energy',
    '환경': 'environment', '지속가능성': 'sustainability', '교육': 'education',
    '건강': 'health', '의료': 'healthcare', '금융': 'finance', '부동산': 'real estate',
    // 오브젝트
    '책': 'book', '꽃다발': 'bouquet', '보석': 'jewel', '시계': 'clock', '열쇠': 'key',
    '편지': 'letter', '지도': 'map', '달력': 'calendar', '안경': 'glasses',
    '가방': 'bag', '의자': 'chair', '테이블': 'table', '램프': 'lamp',
  };

  async function translateWithMyMemory(text) {
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ko|en`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    } catch (e) {}
    return null;
  }

  function resolveCustomSubjectEn(koText) {
    if (!koText) return '';
    const trimmed = koText.trim();
    if (!trimmed) return '';
    // 사전 직접 매핑
    if (KO_EN_SUBJECT_MAP[trimmed]) return KO_EN_SUBJECT_MAP[trimmed];
    // 단어 분리 후 부분 매핑 시도
    const parts = trimmed.split(/[\s,]+/);
    const mapped = parts.map(p => KO_EN_SUBJECT_MAP[p] || p);
    return mapped.join(' ');
  }

  // 현재 조합 상태에 따라 하이라이트 HTML로 구성된 프롬프트 반환
  function buildMixedHighlightPromptHTML() {
    const subject = resolveMixerSubject();
    const medium = resolveMixerMedium();
    const palette = MIXER_PALETTES[selectedPaletteIdx];
    const composition = resolveMixerComposition();
    const typography = resolveMixerTypography();

    if (!subject || !medium || !palette) return '';

    const colorText = getPaletteColorNames(palette.colors);
    const colorPart = [colorText, palette.colorMapping].filter(Boolean).join(', ');

    const subjectPromptText = customSubjectEn || subject.prompt;
    const part1 = `<span class="hl-medium">${escapeMixerHTML(`A ${medium.prefix}`)}</span>` +
                  (composition ? ` <span class="hl-composition">${escapeMixerHTML(composition.prefix)}</span>` : '') +
                  ` <span class="hl-subj">${escapeMixerHTML(subjectPromptText)}</span>`;

    let part2 = `<span class="hl-medium">${escapeMixerHTML(medium.suffix)}</span>` +
                  (composition ? `, <span class="hl-composition">${escapeMixerHTML(composition.suffix)}</span>` : '');

    if (palette.id !== 'none' && colorPart) {
      part2 += `, <span class="hl-palette">color palette: ${escapeMixerHTML(colorPart)}</span>`;
    }

    if (typography) {
      part2 += `, <span class="hl-lighting">${escapeMixerHTML(typography.prompt)}</span>`;
    }

    return `${part1}. ${part2}`;
  }

  // 결합된 플레인 텍스트 프롬프트 반환 (복사용)
  function buildMixedPrompt() {
    const subject = resolveMixerSubject();
    const medium = resolveMixerMedium();
    const palette = MIXER_PALETTES[selectedPaletteIdx];
    const composition = resolveMixerComposition();
    const typography = resolveMixerTypography();

    if (!subject || !medium || !palette) return '';

    const colorText = getPaletteColorNames(palette.colors);
    const colorPart = [colorText, palette.colorMapping].filter(Boolean).join(', ');
    const compPrefix = composition ? `${composition.prefix} ` : '';
    const compSuffix = composition ? `, ${composition.suffix}` : '';
    const typoStr = typography ? `, ${typography.prompt}` : '';

    let colorPartStr = '';
    if (palette.id !== 'none' && colorPart) {
      colorPartStr = `, color palette: ${colorPart}`;
    }

    const subjectPromptText = customSubjectEn || subject.prompt;
    return `A ${medium.prefix} ${compPrefix}${subjectPromptText}. ${medium.suffix}${compSuffix}${colorPartStr}${typoStr}`;
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

    const categoryList = activeCategory === 'all'
      ? Object.values(MIXER_SUBJECTS).flat()
      : (MIXER_SUBJECTS[activeCategory] || []);
    const subject = categoryList.find(s => s.id === selectedSubjId);
    const medium = MIXER_MEDIUMS.find(m => m.id === selectedMediumId);
    const palette = MIXER_PALETTES[selectedPaletteIdx];
    const composition = resolveMixerComposition();
    const typography = resolveMixerTypography();

    const subjText = subject ? `${subject.emoji} ${subject.nameKo}` : '선택 대기중';
    const medText = medium ? `${medium.emoji} ${medium.nameKo}` : '선택 대기중';
    const palText = palette ? `🎨 ${palette.name}` : '선택 대기중';
    const compText = composition ? `${composition.emoji} ${composition.nameKo}` : '선택 안 함';
    const typoText = typography ? `${typography.emoji} ${typography.nameKo}` : '선택 안 함';

    const values = [
      { step: 1, text: subjText, hasValue: Boolean(subject) },
      { step: 2, text: medText, hasValue: Boolean(medium) },
      { step: 3, text: palText, hasValue: Boolean(palette), palette: palette },
      { step: 4, text: compText, hasValue: selectedCompositionId !== 'none' },
      { step: 5, text: typoText, hasValue: selectedTypographyId !== 'none' }
    ];

    values.forEach(({ step, text, hasValue, palette }) => {
      const valueEl = container.querySelector(`.mixer-step-tab[data-step="${step}"] .mixer-step-current`);
      const tab = container.querySelector(`.mixer-step-tab[data-step="${step}"]`);
      if (!valueEl || !tab) return;

      if (step === 3 && hasValue && palette && palette.colors) {
        const chipsHtml = palette.colors.map(c => `
          <span class="mixer-summary-color-chip" style="background:${c}; display:inline-block; width:10px; height:10px; border-radius:50%; border:1px solid rgba(0,0,0,0.15); margin-left:3px; vertical-align:middle;"></span>
        `).join('');
        valueEl.innerHTML = `${text} <span style="margin-left:4px; display:inline-flex; align-items:center;">${chipsHtml}</span>`;
      } else {
        valueEl.textContent = text;
      }

      valueEl.classList.toggle('empty', !hasValue && step <= 3);
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
          <button type="button" id="btnMixerSettings" class="mixer-hidden-proxy">unsplash API</button>
          <details class="mixer-settings">
            <summary class="mixer-hidden-proxy">unsplash API</summary>
            <div class="mixer-settings-panel">
              <label class="mixer-settings-label" for="mixerUnsplashKeyInput">Unsplash Access Key</label>
              <div class="mixer-settings-row">
                <input id="mixerUnsplashKeyInput" class="mixer-settings-input" type="password"
                  placeholder="${getUnsplashKey() ? '이미 등록됨 (변경하려면 새로 입력)' : 'Access Key 입력'}" value="" />
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
            <button type="button" class="mixer-step-tab" data-step="4">
              <span class="step-num">4</span>
              <span class="mixer-step-copy">
                <span class="mixer-step-label">구도 선택</span>
                <strong class="mixer-step-current">선택 안 함</strong>
              </span>
            </button>
            <button type="button" class="mixer-step-tab" data-step="5">
              <span class="step-num">5</span>
              <span class="mixer-step-copy">
                <span class="mixer-step-label">타이포그래피</span>
                <strong class="mixer-step-current">선택 안 함</strong>
              </span>
            </button>
          </div>

          <!-- Step 1. 비주얼 주제 (Subject) Pane -->
          <div class="mixer-step-pane active" id="paneStep1">
            <div class="mixer-cat-tabs" role="tablist" aria-label="비주얼 주제 카테고리">
              <button type="button" class="mixer-cat-btn" data-mix-cat="all" role="tab">🌐 전체</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="steel" role="tab">🏭 철강 & 중공업</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="energy" role="tab">⚡ 미래 에너지</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="software" role="tab">💻 소프트웨어 & IT</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="bio" role="tab">🧬 바이오 & 라이프</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="finance" role="tab">📈 금융 & 자산</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="public" role="tab">🏛️ 공공 & 인프라</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="brand" role="tab">🏷️ 브랜드 & 홍보</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="space" role="tab">🚀 우주항공 & 미래</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="regional" role="tab">📍 지역산업 & 거점</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="policy" role="tab">📋 정책 & 공공지원</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="urban" role="tab">🏙️ 도시 & 건축</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="food" role="tab">🍱 푸드 & 농식품</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="culture" role="tab">🎭 문화 & 관광</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="education" role="tab">📚 교육 & 연구</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="health" role="tab">🏥 헬스케어 & 의료</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="mobility" role="tab">🚗 모빌리티 & 물류</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="ocean" role="tab">🌊 해양 & 수산</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="materials" role="tab">⚗️ 신소재 & 화학</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="creative" role="tab">🎬 창작 & 미디어</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="environment" role="tab">🌍 환경 & 기후</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="tech_transfer" role="tab">🤝 기술사업화</button>
              <button type="button" class="mixer-cat-btn" data-mix-cat="talent_cultivation" role="tab">🎓 인력양성</button>
            </div>
            <div class="mixer-subj-grid" id="mixerSubjGrid"></div>
            <div class="mixer-search-empty" id="mixerSubjectEmpty">검색 결과가 없습니다.</div>
          </div>

          <!-- Step 2. 표현 화풍 (Medium) Pane -->
          <div class="mixer-step-pane" id="paneStep2">
              <div class="mixer-cat-tabs" id="mixerMediumCategoryTabs" role="tablist" aria-label="화풍 카테고리">
                <button type="button" class="mixer-cat-btn${activeMediumCategory === 'all' ? ' active' : ''}" data-med-cat="all" role="tab" aria-selected="${activeMediumCategory === 'all'}">🌐 전체</button>
                ${MEDIUM_CATEGORIES.map(cat => `
                  <button type="button" class="mixer-cat-btn${cat.id === activeMediumCategory ? ' active' : ''}"
                    data-med-cat="${cat.id}" role="tab" aria-selected="${cat.id === activeMediumCategory}">${cat.label}</button>
                `).join('')}
              </div>
            <div id="mixerMedCategoriesWrap"></div>
            <div class="mixer-search-empty" id="mixerMediumEmpty">검색 결과가 없습니다.</div>
          </div>

          <!-- Step 3. 색상 테마 (Palette) Pane -->
          <div class="mixer-step-pane" id="paneStep3">
            <div class="mixer-cat-tabs" id="mixerPaletteCategoryTabs" role="tablist" aria-label="색상 테마 카테고리">
              <button type="button" class="mixer-cat-btn${activePaletteCategory === 'all' ? ' active' : ''}" data-palette-cat="all" role="tab" aria-selected="${activePaletteCategory === 'all'}">🌐 전체</button>
              ${PALETTE_CATEGORIES.map(cat => `
                <button type="button" class="mixer-cat-btn${cat.id === activePaletteCategory ? ' active' : ''}"
                  data-palette-cat="${cat.id}" role="tab" aria-selected="${cat.id === activePaletteCategory}">${cat.label}</button>
              `).join('')}
            </div>

            <!-- 필터 바 묶음 -->
            <div class="mixer-pal-filters-row">
              <!-- 톤 필터 -->
              <div class="mixer-pal-filter-group">
                <span class="mixer-pal-filter-label">톤</span>
                <div class="mixer-pal-filter-tabs">
                  <button type="button" class="mixer-pal-filter-btn active" data-pal-filter="all">🌈 전체</button>
                  <button type="button" class="mixer-pal-filter-btn" data-pal-filter="dark">🌙 다크</button>
                  <button type="button" class="mixer-pal-filter-btn" data-pal-filter="light">☀️ 라이트</button>
                </div>
              </div>

              <!-- 색상 필터 -->
              <div class="mixer-pal-filter-group">
                <span class="mixer-pal-filter-label">색상</span>
                <div class="mixer-pal-filter-tabs mixer-pal-color-filter" id="mixerPalColorFilter">
                  <button type="button" class="mixer-pal-color-btn active" data-pal-color="all" title="전체">전체</button>
                  <button type="button" class="mixer-pal-color-btn" data-pal-color="red" title="레드" style="--swatch:#e53935;"></button>
                  <button type="button" class="mixer-pal-color-btn" data-pal-color="orange" title="오렌지" style="--swatch:#fb8c00;"></button>
                  <button type="button" class="mixer-pal-color-btn" data-pal-color="yellow" title="옐로우" style="--swatch:#fdd835;"></button>
                  <button type="button" class="mixer-pal-color-btn" data-pal-color="green" title="그린" style="--swatch:#43a047;"></button>
                  <button type="button" class="mixer-pal-color-btn" data-pal-color="blue" title="블루" style="--swatch:#1e88e5;"></button>
                  <button type="button" class="mixer-pal-color-btn" data-pal-color="purple" title="퍼플" style="--swatch:#8e24aa;"></button>
                  <button type="button" class="mixer-pal-color-btn" data-pal-color="pink" title="핑크" style="--swatch:#e91e8c;"></button>
                  <button type="button" class="mixer-pal-color-btn" data-pal-color="neutral" title="뉴트럴" style="--swatch:#90a4ae;"></button>
                </div>
              </div>

              <!-- 분위기 필터 -->
              <div class="mixer-pal-filter-group">
                <span class="mixer-pal-filter-label">분위기</span>
                <div class="mixer-pal-filter-tabs mixer-pal-mood-filter" id="mixerPalMoodFilter">
                  <button type="button" class="mixer-pal-filter-btn active" data-pal-mood="all">🌐 전체</button>
                  <button type="button" class="mixer-pal-filter-btn" data-pal-mood="vivid">✨ 비비드</button>
                  <button type="button" class="mixer-pal-filter-btn" data-pal-mood="festival">🎪 페스티벌</button>
                  <button type="button" class="mixer-pal-filter-btn" data-pal-mood="retro">🕹 레트로</button>
                  <button type="button" class="mixer-pal-filter-btn" data-pal-mood="luxury">💎 럭셔리</button>
                  <button type="button" class="mixer-pal-filter-btn" data-pal-mood="natural">🌿 내추럴</button>
                  <button type="button" class="mixer-pal-filter-btn" data-pal-mood="minimal">📐 미니멀</button>
                </div>
              </div>
            </div><!-- /.mixer-pal-filters-row -->

            <div class="mixer-palettes-group-grid" id="mixerPalettesGroupGrid"></div>
            <div class="mixer-search-empty" id="mixerPaletteEmpty">선택한 조건에 맞는 색상 테마가 없습니다.</div>
          </div>

          <!-- Step 4. 구도 (Composition) Pane -->
          <div class="mixer-step-pane" id="paneStep4">
            <div class="mixer-cat-tabs" id="mixerCompositionCategoryTabs" role="tablist" aria-label="구도 카테고리">
              <button type="button" class="mixer-cat-btn active" data-composition-cat="all" role="tab" aria-selected="true">🌐 전체</button>
              ${COMPOSITION_CATEGORIES.map(cat => `
                <button type="button" class="mixer-cat-btn"
                  data-composition-cat="${cat.id}" role="tab" aria-selected="false">${cat.label}</button>
              `).join('')}
            </div>
            <div class="mixer-palettes-group-grid" id="mixerCompositionGrid"></div>
            <div class="mixer-search-empty" id="mixerCompositionEmpty">선택한 조건에 맞는 구도가 없습니다.</div>
          </div>

          <!-- Step 5. 타이포그래피 (Typography) Pane -->
          <div class="mixer-step-pane" id="paneStep5">
            <div class="mixer-cat-tabs" id="mixerTypographyCategoryTabs" role="tablist" aria-label="타이포그래피 카테고리">
              <button type="button" class="mixer-cat-btn active" data-typography-cat="all" role="tab" aria-selected="true">🌐 전체</button>
              ${TYPOGRAPHY_CATEGORIES.map(cat => `
                <button type="button" class="mixer-cat-btn"
                  data-typography-cat="${cat.id}" role="tab" aria-selected="false">${cat.label}</button>
              `).join('')}
            </div>
            <div class="mixer-palettes-group-grid" id="mixerTypographyGrid"></div>
            <div class="mixer-search-empty" id="mixerTypographyEmpty">선택한 조건에 맞는 타이포그래피가 없습니다.</div>
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
        const firstSubj = cat === 'all'
          ? Object.values(MIXER_SUBJECTS).flat()[0]
          : MIXER_SUBJECTS[cat]?.[0];
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
        if (step === 2) {
          renderMediums();
        } else if (step === 3) {
          renderPalettes();
        } else if (step === 4) {
          renderCompositions();
        } else if (step === 5) {
          renderTypographies();
        }
      });
    });

    // 구도 카테고리 필터 클릭 바인딩
    container.querySelectorAll('[data-composition-cat]').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const cat = e.currentTarget.dataset.compositionCat;
        activeCompositionCategory = cat;
        container.querySelectorAll('[data-composition-cat]').forEach(btn => {
          const isActive = btn.dataset.compositionCat === cat;
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-selected', String(isActive));
        });
        renderCompositions();
      });
    });

    // 조명 카테고리 필터 클릭 바인딩
    container.querySelectorAll('[data-typography-cat]').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const catValue = e.currentTarget.dataset.typographyCat;
        activeTypographyCategory = catValue;
        container.querySelectorAll('[data-typography-cat]').forEach(btn => {
          const isActive = btn.dataset.typographyCat === catValue;
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-selected', String(isActive));
        });
        renderTypographies();
      });
    });

    container.querySelectorAll('[data-med-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeMediumCategory = btn.dataset.medCat;
        if (activeMediumCategory === 'all') {
          selectedMediumId = MIXER_MEDIUMS[0]?.id || selectedMediumId;
        } else {
          selectedMediumId = MIXER_MEDIUMS.find(medium => medium.category === activeMediumCategory)?.id || selectedMediumId;
        }
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
        // 색상 계열 필터 초기화
        activePaletteColorFilter = 'all';
        activePaletteTagFilter = 'all';
        container.querySelectorAll('.mixer-pal-color-btn').forEach(b => b.classList.toggle('active', b.dataset.palColor === 'all'));
        container.querySelectorAll('[data-pal-mood]').forEach(b => b.classList.toggle('active', b.dataset.palMood === 'all'));
        const firstPalette = MIXER_PALETTES.find(palette =>
          (activePaletteCategory === 'all' || palette.category === activePaletteCategory) &&
          (activePaletteFilter === 'all' || palette.mode === activePaletteFilter) &&
          paletteMatchesColorFilter(palette, activePaletteColorFilter) &&
          paletteMatchesTagFilter(palette, activePaletteTagFilter)
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

    // 팔레트 톤 필터 버튼 바인딩 (data-pal-filter 속성 한정 — 무드 버튼과 충돌 방지)
    container.querySelectorAll('.mixer-pal-filter-btn[data-pal-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.mixer-pal-filter-btn[data-pal-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activePaletteFilter = btn.dataset.palFilter;
        const currentPalette = MIXER_PALETTES[selectedPaletteIdx];
        if (!currentPalette || currentPalette.category !== activePaletteCategory ||
            (activePaletteFilter !== 'all' && currentPalette.mode !== activePaletteFilter)) {
          const firstPalette = MIXER_PALETTES.find(palette =>
            palette.category === activePaletteCategory &&
            (activePaletteFilter === 'all' || palette.mode === activePaletteFilter) &&
            paletteMatchesColorFilter(palette, activePaletteColorFilter) &&
            paletteMatchesTagFilter(palette, activePaletteTagFilter)
          );
          if (firstPalette) selectedPaletteIdx = MIXER_PALETTES.indexOf(firstPalette);
        }
        renderPalettes();
        updateMixerSummaryBar();
        renderPreviewCard();
      });
    });

    // 팔레트 색상 계열 필터 바인딩
    container.querySelectorAll('.mixer-pal-color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.mixer-pal-color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activePaletteColorFilter = btn.dataset.palColor;
        const firstPalette = MIXER_PALETTES.find(palette =>
          (activePaletteCategory === 'all' || palette.category === activePaletteCategory) &&
          (activePaletteFilter === 'all' || palette.mode === activePaletteFilter) &&
          paletteMatchesColorFilter(palette, activePaletteColorFilter) &&
          paletteMatchesTagFilter(palette, activePaletteTagFilter)
        );
        if (firstPalette) selectedPaletteIdx = MIXER_PALETTES.indexOf(firstPalette);
        renderPalettes();
        updateMixerSummaryBar();
        renderPreviewCard();
      });
    });

    // 팔레트 무드/분위기 필터 바인딩
    container.querySelectorAll('[data-pal-mood]').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('[data-pal-mood]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activePaletteTagFilter = btn.dataset.palMood;
        const firstPalette = MIXER_PALETTES.find(palette =>
          (activePaletteCategory === 'all' || palette.category === activePaletteCategory) &&
          (activePaletteFilter === 'all' || palette.mode === activePaletteFilter) &&
          paletteMatchesColorFilter(palette, activePaletteColorFilter) &&
          paletteMatchesTagFilter(palette, activePaletteTagFilter)
        );
        if (firstPalette) selectedPaletteIdx = MIXER_PALETTES.indexOf(firstPalette);
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
        const val = keyInput.value.trim();
        if (!val) {
          if (keyStatus) {
            keyStatus.textContent = '❌ 변경할 키를 입력해 주세요.';
            keyStatus.style.color = '#ef4444';
            setTimeout(() => { keyStatus.textContent = ''; }, 2000);
          }
          return;
        }
        setUnsplashKey(val);
        Object.keys(UNSPLASH_CACHE).forEach(k => delete UNSPLASH_CACHE[k]); // 캐시 초기화
        keyInput.value = '';
        keyInput.placeholder = '이미 등록됨 (변경하려면 새로 입력)';
        if (keyStatus) {
          keyStatus.textContent = '✓ 변경 저장 완료';
          keyStatus.style.color = '#10b981';
          setTimeout(() => { keyStatus.textContent = ''; }, 2000);
        }
      });
    }

    // Unsplash API 설정 토글
    const settingsBtn = container.querySelector('#btnMixerSettings');
    const settingsDetails = container.querySelector('.mixer-settings');
    if (settingsBtn && settingsDetails) {
      settingsBtn.addEventListener('click', () => {
        settingsDetails.open = !settingsDetails.open;
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

      // 구도 무작위 선택 (50% 확률로 none 또는 랜덤 프리셋 선택)
      if (Math.random() > 0.5) {
        const comps = MIXER_COMPOSITIONS.filter(c => c.id !== 'none');
        selectedCompositionId = comps[Math.floor(Math.random() * comps.length)].id;
      } else {
        selectedCompositionId = 'none';
      }

      // 타이포그래피 무작위 선택 (50% 확률로 none 또는 랜덤 프리셋 선택)
      if (Math.random() > 0.5) {
        const typographies = MIXER_TYPOGRAPHIES.filter(r => r.id !== 'none');
        selectedTypographyId = typographies[Math.floor(Math.random() * typographies.length)].id;
      } else {
        selectedTypographyId = 'none';
      }

      activeCompositionCategory = 'all';
      activeTypographyCategory = 'all';

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
      renderCompositions();
      renderTypographies();
      updateMixerSummaryBar();
      renderPreviewCard();
    });

    container.querySelector('#btnMixerReset').addEventListener('click', () => {
      activeCategory = 'steel';
      selectedSubjId = 'mix-steel-hot-rolling';
      selectedMediumId = 'med-3d';
      selectedPaletteIdx = 0;
      selectedCompositionId = 'none';
      selectedTypographyId = 'none';
      activeMediumCategory = 'tech3d';
      activePaletteCategory = 'all';
      activeCompositionCategory = 'all';
      activeTypographyCategory = 'all';
      activePaletteFilter = 'all';
      isPaletteOverriddenByUser = false;
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
      renderCompositions();
      renderTypographies();
      updateMixerSummaryBar();
      renderPreviewCard();
      switchStep(1);
    });

    updateCategoryTabs();
    renderSubjects();
    renderMediums();
    renderPalettes();
    renderCompositions();
    renderTypographies();
    updateMixerSummaryBar();
    renderPreviewCard();
    switchStep(1); // 1단계부터 시작
  }

  // 단계(Step) 전환 함수
  function switchStep(step) {
    activeStep = step;
    const container = document.getElementById('conceptMixerContainer');
    if (!container) return;

    if (step === 3) {
      const selectedPalette = MIXER_PALETTES[selectedPaletteIdx];
      if (selectedPalette) {
        activePaletteCategory = selectedPalette.category || 'all';
        activePaletteFilter = 'all';
        activePaletteColorFilter = 'all';
      }
    } else if (step === 4) {
      const selectedComp = resolveMixerComposition();
      if (selectedComp) {
        activeCompositionCategory = selectedComp.category || 'all';
      }
    } else if (step === 5) {
      const selectedTypo = resolveMixerTypography();
      if (selectedTypo) {
        activeTypographyCategory = selectedTypo.category || 'all';
      }
    }

    container.querySelectorAll('.mixer-step-tab').forEach(tab => {
      const tabStep = parseInt(tab.dataset.step, 10);
      tab.classList.toggle('active', tabStep === step);
      tab.classList.toggle('completed', tabStep < step);

      const numSpan = tab.querySelector('.step-num');
      if (numSpan) {
        if (tabStep < step) {
          numSpan.textContent = '✓';
        } else {
          numSpan.textContent = tabStep;
        }
      }
    });

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
    const list = activeCategory === 'all'
      ? Object.values(MIXER_SUBJECTS).flat()
      : (MIXER_SUBJECTS[activeCategory] || []);
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
        customSubjectKo = '';
        customSubjectEn = '';
        customSubjectMode = 'ko';
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

    const filtered = (activeMediumCategory === 'all')
      ? MIXER_MEDIUMS.slice()
      : MIXER_MEDIUMS.filter(m => m.category === activeMediumCategory);
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

  // hex 색상 → hue 패밀리 분류
  function hexToHueFamily(hex) {
    const r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
    if (d < 0.08) return 'neutral';
    let h = 0;
    if (max === r) h = ((g-b)/d + (g<b?6:0)) * 60;
    else if (max === g) h = ((b-r)/d + 2) * 60;
    else h = ((r-g)/d + 4) * 60;
    if (h < 20 || h >= 340) return 'red';
    if (h < 50) return 'orange';
    if (h < 75) return 'yellow';
    if (h < 165) return 'green';
    if (h < 255) return 'blue';
    if (h < 290) return 'purple';
    return 'pink';
  }

  function paletteMatchesColorFilter(pal, filter) {
    if (filter === 'all') return true;
    return pal.colors.some(c => c.length === 7 && hexToHueFamily(c) === filter);
  }

  function getPaletteMood(pal) {
    if (pal.mood) return pal.mood;
    var override = PALETTE_MOOD_MAP[pal.id];
    if (override) return override;
    var cat = pal.category;
    if (cat === 'candy' || cat === 'energy') return 'vivid';
    if (cat === 'warm_earth' || cat === 'nature') return 'natural';
    if (cat === 'nordic') return 'minimal';
    if (cat === 'soft' && pal.mode === 'light') return 'minimal';
    if (cat === 'light_pastel' || cat === 'morning') return 'minimal';
    if (cat === 'multicolor') return 'festival';
    if (cat === 'official') return 'luxury';
    return null;
  }

  function paletteMatchesTagFilter(pal, filter) {
    if (filter === 'all') return true;
    return getPaletteMood(pal) === filter;
  }

  // 스타일/미디엄에 맞는 팔레트를 자동 매핑하는 기본 전략
  // 1) 명시적 매핑 테이블(스타일/미디엄 id -> palette id)을 우선 사용
  // 2) 없으면 색상 겹침(HEX 포함) 우선 검색
  // 3) 색상 겹침이 없으면 태그/카테고 기반 완화 매칭
  const STYLE_TO_PALETTE_MAP = window.STYLE_TO_PALETTE_MAP || {
  '3d-abstract-sculpture': 'pal-style-3d-abstract-sculpture',
  '3d-architecture-viz': 'pal-style-3d-architecture-viz',
  '3d-fluid-simulation': 'pal-style-3d-fluid-simulation',
  '3d-game-environment': 'pal-style-3d-game-environment',
  '3d-holographic-ui': 'pal-style-3d-holographic-ui',
  '3d-nft-generative': 'pal-style-3d-nft-generative',
  '3d-product-render': 'pal-style-3d-product-render',
  'Content-Type': 'application/json',
  'Unsplash 요청 한도를 확인해 주세요.': '사진을 불러오지 못했습니다.',
  'anime-chibi-pixel-game': 'pal-style-anime-chibi-pixel-game',
  'anime-cyberpunk': 'pal-style-anime-cyberpunk',
  'anime-disney-3d': 'pal-style-anime-disney-3d',
  'anime-disney-classic-2d': 'pal-style-anime-disney-classic-2d',
  'anime-graphic-novel': 'pal-style-anime-graphic-novel',
  'anime-manga-screentone': 'pal-style-anime-manga-screentone',
  'anime-retro-80s-mech': 'pal-style-anime-retro-80s-mech',
  'anime-retro-90s': 'pal-style-anime-retro-90s',
  'anime-shonen-battle': 'pal-style-anime-shonen-battle',
  'anime-shoujo-romance': 'pal-style-anime-shoujo-romance',
  'anime-stick-figure': 'pal-style-anime-stick-figure',
  'anime-studio-ghibli': 'pal-style-anime-studio-ghibli',
  'anime-watercolor-ghibli': 'pal-style-anime-watercolor-ghibli',
  'anime-webtoon': 'pal-style-anime-webtoon',
  'arch-baroque-palace': 'pal-style-arch-baroque-palace',
  'arch-bohemian': 'pal-style-arch-bohemian',
  'arch-brutalist': 'pal-style-arch-brutalist',
  'arch-futuristic': 'pal-style-arch-futuristic',
  'arch-hanok': 'pal-style-arch-hanok',
  'arch-industrial': 'pal-style-arch-industrial',
  'arch-modernist': 'pal-style-arch-modernist',
  'arch-scandinavian': 'pal-style-arch-scandinavian',
  'arch-tropical-resort': 'pal-style-arch-tropical-resort',
  'arch-wabi-sabi': 'pal-style-arch-wabi-sabi',
  'artnouveau': 'pal-style-artnouveau',
  'bauhaus': 'pal-style-bauhaus',
  'bio-botanical-watercolor': 'pal-style-bio-botanical-watercolor',
  'bio-dna-neon-glow': 'pal-style-bio-dna-neon-glow',
  'bio-dna-origami': 'pal-style-bio-dna-origami',
  'bio-eco-genetic-fusion': 'pal-style-bio-eco-genetic-fusion',
  'bio-futuristic-clinic': 'pal-style-bio-futuristic-clinic',
  'bio-immunology-shield': 'pal-style-bio-immunology-shield',
  'bio-nano-microscopic': 'pal-style-bio-nano-microscopic',
  'bio-neuro-network': 'pal-style-bio-neuro-network',
  'bio-organic-cyber': 'pal-style-bio-organic-cyber',
  'bio-petri-dish-art': 'pal-style-bio-petri-dish-art',
  'bio-pharmaceutical-glass': 'pal-style-bio-pharmaceutical-glass',
  'bokeh': 'pal-style-bokeh',
  'brand-corporate-b2b': 'pal-style-brand-corporate-b2b',
  'brand-eco-sustainable': 'pal-style-brand-eco-sustainable',
  'brand-graffiti-street': 'pal-style-brand-graffiti-street',
  'brand-luxury-mono': 'pal-style-brand-luxury-mono',
  'brand-neon-sign': 'pal-style-brand-neon-sign',
  'brand-premium-package': 'pal-style-brand-premium-package',
  'brand-retro-vintage-ad': 'pal-style-brand-retro-vintage-ad',
  'brand-social-story': 'pal-style-brand-social-story',
  'brand-startup-minimal': 'pal-style-brand-startup-minimal',
  'brand-streetwear': 'pal-style-brand-streetwear',
  'brand-tattoo-flash': 'pal-style-brand-tattoo-flash',
  'brand-tech-saas': 'pal-style-brand-tech-saas',
  'brand-wellness-spa': 'pal-style-brand-wellness-spa',
  'chibi': 'pal-webtoon',
  'cinematic': 'pal-anime-cinematic',
  'clay': 'pal-miricanvas',
  'collage': 'pal-style-collage',
  'comic': 'pal-style-comic',
  'comic-american-superhero': 'pal-style-comic-american-superhero',
  'comic-franco-belgian': 'pal-style-comic-franco-belgian',
  'comic-graphic-novel-noir': 'pal-style-comic-graphic-novel-noir',
  'comic-shojo-manga': 'pal-style-comic-shojo-manga',
  'comic-underground-comix': 'pal-style-comic-underground-comix',
  'comic-vintage-newspaper-strip': 'pal-style-comic-vintage-newspaper-strip',
  'comic-webtoon': 'pal-style-comic-webtoon',
  'constructivism': 'pal-style-constructivism',
  'craft-batik': 'pal-style-craft-batik',
  'craft-ceramic-pottery': 'pal-style-craft-ceramic-pottery',
  'craft-claymation': 'pal-style-craft-claymation',
  'craft-digital-painting': 'pal-style-craft-digital-painting',
  'craft-embroidery': 'pal-style-craft-embroidery',
  'craft-glassblowing': 'pal-style-craft-glassblowing',
  'craft-leather': 'pal-style-craft-leather',
  'craft-linocut': 'pal-style-craft-linocut',
  'craft-macrame': 'pal-style-craft-macrame',
  'craft-metal-repousse': 'pal-style-craft-metal-repousse',
  'craft-needle-felt': 'pal-style-craft-needle-felt',
  'craft-stained-glass': 'pal-style-craft-stained-glass',
  'craft-woodcarving': 'pal-style-craft-woodcarving',
  'culture-african-tribal': 'pal-style-culture-african-tribal',
  'culture-byzantine': 'pal-style-culture-byzantine',
  'culture-celtic': 'pal-style-culture-celtic',
  'culture-chinese-ink': 'pal-style-culture-chinese-ink',
  'culture-indian-mandala': 'pal-style-culture-indian-mandala',
  'culture-islamic-arabesque': 'pal-style-culture-islamic-arabesque',
  'culture-korean-minhwa': 'pal-style-culture-korean-minhwa',
  'culture-maya-aztec': 'pal-style-culture-maya-aztec',
  'culture-mexican-oaxaca': 'pal-style-culture-mexican-oaxaca',
  'culture-russian-khokhloma': 'pal-style-culture-russian-khokhloma',
  'culture-ukiyoe': 'pal-style-culture-ukiyoe',
  'cyberpunk': 'pal-style-cyberpunk',
  'doodle': 'pal-style-doodle',
  'duotone': 'pal-style-duotone',
  'energy-battery-flexible': 'pal-style-energy-battery-flexible',
  'energy-battery-lithium': 'pal-style-energy-battery-lithium',
  'energy-battery-lithiumsulfur': 'pal-style-energy-battery-lithiumsulfur',
  'energy-battery-recycle': 'pal-style-energy-battery-recycle',
  'energy-battery-silicon': 'pal-style-energy-battery-silicon',
  'energy-battery-sodium': 'pal-style-energy-battery-sodium',
  'energy-battery-solidstate': 'pal-style-energy-battery-solidstate',
  'energy-biomass-circular': 'pal-style-energy-biomass-circular',
  'energy-eco-city-green': 'pal-style-energy-eco-city-green',
  'energy-fuelcell-stack': 'pal-style-energy-fuelcell-stack',
  'energy-geothermal-magma': 'pal-style-energy-geothermal-magma',
  'energy-hydrogen-clean': 'pal-style-energy-hydrogen-clean',
  'energy-hydrogen-electrolysis': 'pal-style-energy-hydrogen-electrolysis',
  'energy-hydrogen-mobility': 'pal-style-energy-hydrogen-mobility',
  'energy-hydrogen-storage': 'pal-style-energy-hydrogen-storage',
  'energy-nuclear-fusion': 'pal-style-energy-nuclear-fusion',
  'energy-piezoelectric-vibration': 'pal-style-energy-piezoelectric-vibration',
  'energy-smart-grid-neon': 'pal-style-energy-smart-grid-neon',
  'energy-solar-parametric': 'pal-style-energy-solar-parametric',
  'energy-tidal-marine': 'pal-style-energy-tidal-marine',
  'energy-wind-aeolian': 'pal-style-energy-wind-aeolian',
  'fantasy': 'pal-style-fantasy',
  'fashion-beauty-ad': 'pal-style-fashion-beauty-ad',
  'fashion-editorial-luxury': 'pal-style-fashion-editorial-luxury',
  'fashion-gorpcore': 'pal-style-fashion-gorpcore',
  'fashion-haute-couture': 'pal-style-fashion-haute-couture',
  'fashion-kbeauty-glow': 'pal-style-fashion-kbeauty-glow',
  'fashion-maximalist': 'pal-style-fashion-maximalist',
  'fashion-monotone': 'pal-style-fashion-monotone',
  'fashion-seoul-street': 'pal-style-fashion-seoul-street',
  'fashion-streetwear-lookbook': 'pal-style-fashion-streetwear-lookbook',
  'fashion-y2k': 'pal-style-fashion-y2k',
  'finance-crypto-web3': 'pal-style-finance-crypto-web3',
  'finance-fintech-neon': 'pal-style-finance-fintech-neon',
  'finance-insurance-trust': 'pal-style-finance-insurance-trust',
  'finance-payment-speed': 'pal-style-finance-payment-speed',
  'finance-pension-wealth': 'pal-style-finance-pension-wealth',
  'finance-premium-banking': 'pal-style-finance-premium-banking',
  'finance-real-estate': 'pal-style-finance-real-estate',
  'finance-stock-market': 'pal-style-finance-stock-market',
  'flat': 'pal-canva',
  'food-bakery': 'pal-style-food-bakery',
  'food-bubble-tea': 'pal-style-food-bubble-tea',
  'food-cafe-aesthetic': 'pal-style-food-cafe-aesthetic',
  'food-dessert-pastel': 'pal-style-food-dessert-pastel',
  'food-fine-dining': 'pal-style-food-fine-dining',
  'food-flatlay': 'pal-style-food-flatlay',
  'food-healthy-vegan': 'pal-style-food-healthy-vegan',
  'food-korean-cuisine': 'pal-style-food-korean-cuisine',
  'food-pizza-popart': 'pal-style-food-pizza-popart',
  'food-ramen': 'pal-style-food-ramen',
  'food-street-food': 'pal-style-food-street-food',
  'food-wine-cocktail': 'pal-style-food-wine-cocktail',
  'game-horror-gothic': 'pal-style-game-horror-gothic',
  'game-isekai-anime': 'pal-style-game-isekai-anime',
  'game-mecha-robot': 'pal-style-game-mecha-robot',
  'game-open-world-nature': 'pal-style-game-open-world-nature',
  'game-retrowave-racing': 'pal-style-game-retrowave-racing',
  'game-rhythm-music': 'pal-style-game-rhythm-music',
  'game-space-opera': 'pal-style-game-space-opera',
  'game-steampunk': 'pal-style-game-steampunk',
  'game-survival-wilderness': 'pal-style-game-survival-wilderness',
  'handlettering': 'pal-style-handlettering',
  'heavy-aerospace-turbine': 'pal-style-heavy-aerospace-turbine',
  'heavy-auto-robotics': 'pal-style-heavy-auto-robotics',
  'heavy-construction-crane': 'pal-style-heavy-construction-crane',
  'heavy-industrial-welding-laser': 'pal-style-heavy-industrial-welding-laser',
  'heavy-mining-excavator': 'pal-style-heavy-mining-excavator',
  'heavy-petrochemical-pipe': 'pal-style-heavy-petrochemical-pipe',
  'heavy-precision-cnc': 'pal-style-heavy-precision-cnc',
  'heavy-railway-locomotive': 'pal-style-heavy-railway-locomotive',
  'heavy-shipbuilding-dock': 'pal-style-heavy-shipbuilding-dock',
  'heavy-steel-foundry': 'pal-style-heavy-steel-foundry',
  'heavy-wind-blade-molding': 'pal-style-heavy-wind-blade-molding',
  'illust-anime-cel': 'pal-style-illust-anime-cel',
  'illust-botanical': 'pal-style-illust-botanical',
  'illust-charcoal': 'pal-style-illust-charcoal',
  'illust-concept-art': 'pal-style-illust-concept-art',
  'illust-editorial': 'pal-style-illust-editorial',
  'illust-gouache': 'pal-style-illust-gouache',
  'illust-pastel-kawaii': 'pal-style-illust-pastel-kawaii',
  'illust-silkscreen': 'pal-style-illust-silkscreen',
  'illust-sticker-design': 'pal-style-illust-sticker-design',
  'illust-vector-portrait': 'pal-style-illust-vector-portrait',
  'isometric': 'pal-style-isometric',
  'letter-blackletter-gothic': 'pal-style-letter-blackletter-gothic',
  'letter-brush-calligraphy': 'pal-style-letter-brush-calligraphy',
  'letter-chalk-blackboard': 'pal-style-letter-chalk-blackboard',
  'letter-vintage-sign-painting': 'pal-style-letter-vintage-sign-painting',
  'letter-watercolor-lettering': 'pal-style-letter-watercolor-lettering',
  'lineart': 'pal-style-lineart',
  'lowpoly': 'pal-style-lowpoly',
  'med-3d': 'pal-cyber',
  'med-3d-game-scene': 'pal-candy-pop',
  'med-3d-paint-hybrid': 'pal-miricanvas',
  'med-abstract-expr': 'pal-candy-pop',
  'med-abstract-geo': 'pal-canva',
  'med-acrylic': 'pal-miricanvas',
  'med-adaptive-reuse': 'pal-anime-cinematic',
  'med-aerial-drone': 'pal-forest',
  'med-algorithmic-art': 'pal-candy-pop',
  'med-american-comic': 'pal-lego',
  'med-anime-bg': 'pal-anime-cinematic',
  'med-annual-report': 'pal-gov-blue',
  'med-app-dashboard': 'pal-canva',
  'med-arch-diagram': 'pal-anime-cinematic',
  'med-arch-render': 'pal-film-grain',
  'med-architecture-editorial': 'pal-canva',
  'med-art-deco': 'pal-terracotta',
  'med-art-nouveau-illust': 'pal-anime-cinematic',
  'med-aurora-long-exp': 'pal-forest',
  'med-auth-ui': 'pal-canva',
  'med-bauhaus': 'pal-canva',
  'med-beauty-ad': 'pal-canva',
  'med-beauty-campaign': 'pal-canva',
  'med-biophilic-arch': 'pal-anime-cinematic',
  'med-blueprint': 'pal-anime-cinematic',
  'med-book-cover-art': 'pal-candy',
  'med-boss-monster': 'pal-candy-pop',
  'med-brutalism-web': 'pal-candy-pop',
  'med-bubble-3d': 'pal-cyber',
  'med-budget-chart': 'pal-gov-blue',
  'med-bw-street-doc': 'pal-forest',
  'med-cel-anime': 'pal-lego',
  'med-cel-shade-3d': 'pal-anime-cinematic',
  'med-census-map': 'pal-gov-blue',
  'med-ceramic': 'pal-candy',
  'med-character-concept': 'pal-candy',
  'med-character-sheet': 'pal-candy-pop',
  'med-charcoal': 'pal-candy',
  'med-chibi': 'pal-webtoon',
  'med-childrens-book': 'pal-canva',
  'med-chinese-inkwash': 'pal-terracotta',
  'med-chrome-3d': 'pal-film-grain',
  'med-clay': 'pal-cyber',
  'med-collage': 'pal-candy-pop',
  'med-color-field': 'pal-candy-pop',
  'med-concept-fantasy': 'pal-candy-pop',
  'med-concept-game': 'pal-candy-pop',
  'med-concept-scifi': 'pal-candy-pop',
  'med-concept-sketch': 'pal-candy',
  'med-conceptual-fashion': 'pal-canva',
  'med-constructivism': 'pal-terracotta',
  'med-copperplate-illust': 'pal-terracotta',
  'med-corporate-portrait': 'pal-canva',
  'med-crayon': 'pal-miricanvas',
  'med-creature-design': 'pal-candy',
  'med-crystal-3d': 'pal-cyber',
  'med-cyber-cyberpunk': 'pal-anime-cinematic',
  'med-cyberpunk-vector': 'pal-canva',
  'med-dark-mode-app': 'pal-canva',
  'med-data-art': 'pal-candy-pop',
  'med-data-journalism': 'pal-gov-blue',
  'med-data-table-ui': 'pal-canva',
  'med-data-viz-infographic': 'pal-canva',
  'med-demoscene': 'pal-lego',
  'med-desert-sand': 'pal-forest',
  'med-design-system': 'pal-canva',
  'med-digital-impasto': 'pal-miricanvas',
  'med-digital-ink': 'pal-canva',
  'med-diorama': 'pal-candy',
  'med-dither-grayscale': 'pal-lego',
  'med-dot-art-sprite': 'pal-lego',
  'med-double-exposure': 'pal-anime-cinematic',
  'med-drone': 'pal-anime-cinematic',
  'med-duotone': 'pal-canva',
  'med-e-commerce-ui': 'pal-canva',
  'med-editorial-color': 'pal-film-grain',
  'med-embroidery': 'pal-candy',
  'med-empty-state': 'pal-canva',
  'med-encaustic': 'pal-candy',
  'med-environment-concept': 'pal-canva',
  'med-etching': 'pal-candy',
  'med-eval-matrix': 'pal-gov-blue',
  'med-exposure-photo': 'pal-film-grain',
  'med-fan-art': 'pal-candy',
  'med-fashion-illust': 'pal-miricanvas',
  'med-felt': 'pal-webtoon',
  'med-film-grain': 'pal-film-grain',
  'med-film-photo': 'pal-film-grain',
  'med-flat': 'pal-canva',
  'med-fluiddyn': 'pal-cyber',
  'med-folk-art': 'pal-terracotta',
  'med-food-editorial': 'pal-canva',
  'med-fractal': 'pal-candy-pop',
  'med-gacha-card': 'pal-candy-pop',
  'med-game-hud': 'pal-candy-pop',
  'med-gamification-ui': 'pal-canva',
  'med-generative': 'pal-candy-pop',
  'med-ghibli': 'pal-lego',
  'med-glass': 'pal-candy-pop',
  'med-glass-blowing': 'pal-candy',
  'med-glassmorphism': 'pal-canva',
  'med-glitch': 'pal-lego',
  'med-glitch-art': 'pal-lego',
  'med-golden-hour': 'pal-forest',
  'med-gouache': 'pal-canva',
  'med-gov-diagram': 'pal-gov-blue',
  'med-graphic-novel': 'pal-canva',
  'med-halftone': 'pal-lego',
  'med-hdr-landscape': 'pal-anime-cinematic',
  'med-heritage-drawing': 'pal-anime-cinematic',
  'med-hi-res-pixel': 'pal-lego',
  'med-high-key': 'pal-anime-cinematic',
  'med-hologram': 'pal-cyber',
  'med-infrared': 'pal-anime-cinematic',
  'med-ink': 'pal-miricanvas',
  'med-ink-splatter': 'pal-anime-cinematic',
  'med-interior-render': 'pal-film-grain',
  'med-interior-viz': 'pal-film-grain',
  'med-iso': 'pal-cyber',
  'med-iso-pixel-city': 'pal-lego',
  'med-jewelry-craft': 'pal-candy',
  'med-kinetic-pattern': 'pal-canva',
  'med-korean-calligraphy': 'pal-terracotta',
  'med-landing-page-ui': 'pal-canva',
  'med-landscape-arch': 'pal-anime-cinematic',
  'med-leather': 'pal-candy',
  'med-letterpress': 'pal-terracotta',
  'med-lifestyle-photo': 'pal-canva',
  'med-light-art': 'pal-candy-pop',
  'med-lino-print': 'pal-candy',
  'med-linocut': 'pal-terracotta',
  'med-lowpoly': 'pal-cyber',
  'med-luxury-mag': 'pal-canva',
  'med-luxury-product': 'pal-canva',
  'med-macrame': 'pal-candy',
  'med-macro': 'pal-anime-cinematic',
  'med-macro-nature': 'pal-forest',
  'med-manga': 'pal-anime-cinematic',
  'med-manhwa-line': 'pal-webtoon',
  'med-marbling': 'pal-candy',
  'med-matte-painting': 'pal-canva',
  'med-micro-photo': 'pal-anime-cinematic',
  'med-minhwa': 'pal-terracotta',
  'med-misty-forest': 'pal-forest',
  'med-moba-splash': 'pal-candy-pop',
  'med-mobile-game-ui': 'pal-candy-pop',
  'med-mobile-notification': 'pal-canva',
  'med-monotype': 'pal-miricanvas',
  'med-mosaic-art': 'pal-terracotta',
  'med-mountain-fog': 'pal-forest',
  'med-neon': 'pal-canva',
  'med-neon-glow': 'pal-cyber',
  'med-neon-sign': 'pal-lego',
  'med-neumorphism': 'pal-canva',
  'med-night-arch': 'pal-anime-cinematic',
  'med-night-portrait': 'pal-film-grain',
  'med-night-sky-photo': 'pal-forest',
  'med-noise-texture': 'pal-canva',
  'med-ocean-wave': 'pal-forest',
  'med-official-photo': 'pal-gov-blue',
  'med-oil': 'pal-miricanvas',
  'med-onboarding-flow': 'pal-canva',
  'med-op-art': 'pal-candy-pop',
  'med-optical-illusion': 'pal-candy-pop',
  'med-org-chart': 'pal-gov-blue',
  'med-origami': 'pal-terracotta',
  'med-papercraft': 'pal-candy',
  'med-papercut': 'pal-terracotta',
  'med-parametric-arch': 'pal-anime-cinematic',
  'med-particle-3d': 'pal-film-grain',
  'med-pencil': 'pal-canva',
  'med-photobash': 'pal-canva',
  'med-pixel-16bit': 'pal-lego',
  'med-pixel-anim-still': 'pal-lego',
  'med-pixel-cutscene': 'pal-lego',
  'med-pixel-horror': 'pal-lego',
  'med-pixel-icon-set': 'pal-lego',
  'med-pixel-landscape': 'pal-lego',
  'med-pixel-map': 'pal-lego',
  'med-pixel-particles': 'pal-lego',
  'med-pixel-portrait': 'pal-lego',
  'med-pixel-retro': 'pal-lego',
  'med-polaroid': 'pal-film-grain',
  'med-policy-deck': 'pal-gov-blue',
  'med-portrait-editorial': 'pal-canva',
  'med-pottery-craft': 'pal-candy',
  'med-presentation-slide': 'pal-gov-blue',
  'med-press-photo': 'pal-anime-cinematic',
  'med-product-3d': 'pal-cyber',
  'med-psychedelic': 'pal-lego',
  'med-psychedelic-art': 'pal-cyber',
  'med-reflection-symmetry': 'pal-forest',
  'med-report-cover': 'pal-gov-blue',
  'med-report-diagram': 'pal-gov-blue',
  'med-retro-crt': 'pal-lego',
  'med-retro-poster': 'pal-lego',
  'med-risograph': 'pal-terracotta',
  'med-rpg-bg-pixel': 'pal-lego',
  'med-sci-fi-matte': 'pal-canva',
  'med-season-color': 'pal-forest',
  'med-section-drawing': 'pal-anime-cinematic',
  'med-serigraphy': 'pal-terracotta',
  'med-shonen': 'pal-anime-cinematic',
  'med-side-scroll-bg': 'pal-lego',
  'med-social-content': 'pal-canva',
  'med-soft-pastel': 'pal-candy',
  'med-space-planning': 'pal-anime-cinematic',
  'med-speed-paint': 'pal-candy',
  'med-spline': 'pal-cyber',
  'med-sports-editorial': 'pal-canva',
  'med-sports-illust': 'pal-canva',
  'med-stainedglass': 'pal-terracotta',
  'med-stencil-graffiti': 'pal-terracotta',
  'med-storm-sky': 'pal-forest',
  'med-storyboard': 'pal-canva',
  'med-studio-still-life': 'pal-forest',
  'med-suprematism': 'pal-canva',
  'med-survey-viz': 'pal-gov-blue',
  'med-swiss-typography': 'pal-candy-pop',
  'med-synthwave': 'pal-lego',
  'med-system-arch-diagram': 'pal-canva',
  'med-tactical-map': 'pal-candy-pop',
  'med-technical-explode': 'pal-cyber',
  'med-tempera': 'pal-candy',
  'med-thermal': 'pal-anime-cinematic',
  'med-tilt-shift': 'pal-anime-cinematic',
  'med-timber-arch': 'pal-anime-cinematic',
  'med-travel-editorial': 'pal-canva',
  'med-ukiyoe': 'pal-terracotta',
  'med-underwater': 'pal-forest',
  'med-urban-masterplan': 'pal-anime-cinematic',
  'med-urban-planning': 'pal-anime-cinematic',
  'med-vaporwave': 'pal-lego',
  'med-vintage-anime': 'pal-anime-cinematic',
  'med-vintage-poster': 'pal-terracotta',
  'med-voxel': 'pal-cyber',
  'med-voxel-art': 'pal-lego',
  'med-watercolor': 'pal-miricanvas',
  'med-webtoon': 'pal-webtoon',
  'med-whitepaper': 'pal-gov-blue',
  'med-wildlife-photo': 'pal-forest',
  'med-wireframe': 'pal-canva',
  'med-wireframe-3d': 'pal-cyber',
  'med-wood-carving': 'pal-candy',
  'med-woodblock': 'pal-terracotta',
  'med-zine': 'pal-candy-pop',
  'minimalist': 'pal-style-minimalist',
  'modern-acid-design': 'pal-style-modern-acid-design',
  'modern-brutalist-web': 'pal-style-modern-brutalist-web',
  'modern-dark-academia': 'pal-style-modern-dark-academia',
  'modern-data-art': 'pal-style-modern-data-art',
  'modern-gradient-mesh': 'pal-style-modern-gradient-mesh',
  'modern-halftone-risograph': 'pal-style-modern-halftone-risograph',
  'modern-memphis-design': 'pal-style-modern-memphis-design',
  'modern-swiss-international': 'pal-style-modern-swiss-international',
  'modern-synthwave': 'pal-style-modern-synthwave',
  'modern-typographic-poster': 'pal-style-modern-typographic-poster',
  'modern-vaporwave': 'pal-style-modern-vaporwave',
  'music-classical-elegant': 'pal-style-music-classical-elegant',
  'music-concert-energy': 'pal-style-music-concert-energy',
  'music-edm-festival': 'pal-style-music-edm-festival',
  'music-hiphop-street': 'pal-style-music-hiphop-street',
  'music-indie-band': 'pal-style-music-indie-band',
  'music-jazz-bar': 'pal-style-music-jazz-bar',
  'music-kpop-idol': 'pal-style-music-kpop-idol',
  'music-mv-cinematic': 'pal-style-music-mv-cinematic',
  'nature-aurora': 'pal-style-nature-aurora',
  'nature-autumn-foliage': 'pal-style-nature-autumn-foliage',
  'nature-cottagecore': 'pal-style-nature-cottagecore',
  'nature-deep-sea': 'pal-style-nature-deep-sea',
  'nature-desert-sunset': 'pal-style-nature-desert-sunset',
  'nature-misty-forest': 'pal-style-nature-misty-forest',
  'nature-rainforest': 'pal-style-nature-rainforest',
  'nature-solarpunk': 'pal-style-nature-solarpunk',
  'nature-spring-cherry': 'pal-style-nature-spring-cherry',
  'nature-summer-tropical': 'pal-style-nature-summer-tropical',
  'nature-volcanic': 'pal-style-nature-volcanic',
  'nature-winter-snow': 'pal-style-nature-winter-snow',
  'none': 'block',
  'oil': 'pal-style-oil',
  'origami': 'pal-style-origami',
  'pencil': 'pal-style-pencil',
  'photo-aerial-drone': 'pal-style-photo-aerial-drone',
  'photo-dark-moody': 'pal-style-photo-dark-moody',
  'photo-double-exposure': 'pal-style-photo-double-exposure',
  'photo-golden-hour': 'pal-style-photo-golden-hour',
  'photo-hyperrealistic-portrait': 'pal-style-photo-hyperrealistic-portrait',
  'photo-lo-fi-aesthetic': 'pal-style-photo-lo-fi-aesthetic',
  'photo-long-exposure': 'pal-style-photo-long-exposure',
  'photo-macro-nature': 'pal-style-photo-macro-nature',
  'photo-street-bw': 'pal-style-photo-street-bw',
  'photo-underwater': 'pal-style-photo-underwater',
  'pixel-art': 'pal-style-pixel-art',
  'polaroid': 'pal-style-polaroid',
  'popart': 'pal-style-popart',
  'product': 'pal-style-product',
  'public-application-flow': 'pal-style-public-application-flow',
  'public-campaign': 'pal-style-public-campaign',
  'public-civic-participation': 'pal-style-public-civic-participation',
  'public-clean-energy-white': 'pal-style-public-clean-energy-white',
  'public-culture': 'pal-style-public-culture',
  'public-data-report': 'pal-style-public-data-report',
  'public-digital-service': 'pal-style-public-digital-service',
  'public-eco': 'pal-style-public-eco',
  'public-edu': 'pal-style-public-edu',
  'public-facility-reservation': 'pal-style-public-facility-reservation',
  'public-grant-program': 'pal-style-public-grant-program',
  'public-health': 'pal-style-public-health',
  'public-health-white-card': 'pal-style-public-health-white-card',
  'public-policy': 'pal-style-public-policy',
  'public-resident-service': 'pal-style-public-resident-service',
  'public-safety': 'pal-style-public-safety',
  'public-senior-care': 'pal-style-public-senior-care',
  'public-smart-city': 'pal-style-public-smart-city',
  'public-welfare': 'pal-style-public-welfare',
  'public-white-notice-board': 'pal-style-public-white-notice-board',
  'public-youth-program': 'pal-style-public-youth-program',
  'quilt': 'pal-style-quilt',
  'rpg': 'pal-style-rpg',
  'science-ai-machine-learning': 'pal-style-science-ai-machine-learning',
  'science-biomedical': 'pal-style-science-biomedical',
  'science-data-viz': 'pal-style-science-data-viz',
  'science-dna': 'pal-style-science-dna',
  'science-fractal': 'pal-style-science-fractal',
  'science-neural-network': 'pal-style-science-neural-network',
  'science-particle-physics': 'pal-style-science-particle-physics',
  'science-periodic-table': 'pal-style-science-periodic-table',
  'science-quantum-circuit': 'pal-style-science-quantum-circuit',
  'science-space': 'pal-style-science-space',
  'science-weather-satellite': 'pal-style-science-weather-satellite',
  'sketch-architectural': 'pal-style-sketch-architectural',
  'sketch-fashion-croquis': 'pal-style-sketch-fashion-croquis',
  'sketch-gesture-drawing': 'pal-style-sketch-gesture-drawing',
  'sketch-ink-pen': 'pal-style-sketch-ink-pen',
  'sketch-pencil-rough': 'pal-style-sketch-pencil-rough',
  'sketch-scientific-illustration': 'pal-style-sketch-scientific-illustration',
  'software-abstract-data': 'pal-style-software-abstract-data',
  'software-agile-kanban': 'pal-style-software-agile-kanban',
  'software-ai-agent-orchestrator': 'pal-style-software-ai-agent-orchestrator',
  'software-ai-brain-neural': 'pal-style-software-ai-brain-neural',
  'software-ai-computervision': 'pal-style-software-ai-computervision',
  'software-ai-llm-transformer': 'pal-style-software-ai-llm-transformer',
  'software-api-integration': 'pal-style-software-api-integration',
  'software-cyber-code': 'pal-style-software-cyber-code',
  'software-cybersecurity-shield': 'pal-style-software-cybersecurity-shield',
  'software-database-cube': 'pal-style-software-database-cube',
  'software-datacenter-edge': 'pal-style-software-datacenter-edge',
  'software-datacenter-hyperscale': 'pal-style-software-datacenter-hyperscale',
  'software-datacenter-liquidcooling': 'pal-style-software-datacenter-liquidcooling',
  'software-devops-infinity': 'pal-style-software-devops-infinity',
  'software-glass-ui': 'pal-style-software-glass-ui',
  'software-mobility-autonomous': 'pal-style-software-mobility-autonomous',
  'software-mobility-sdv': 'pal-style-software-mobility-sdv',
  'software-mobility-uam': 'pal-style-software-mobility-uam',
  'software-quantum-computing': 'pal-style-software-quantum-computing',
  'software-server-rack-airflow': 'pal-style-software-server-rack-airflow',
  'sport-combat': 'pal-style-sport-combat',
  'sport-dynamic-action': 'pal-style-sport-dynamic-action',
  'sport-esports': 'pal-style-sport-esports',
  'sport-extreme': 'pal-style-sport-extreme',
  'sport-infographic': 'pal-style-sport-infographic',
  'sport-marathon': 'pal-style-sport-marathon',
  'sport-olympic': 'pal-style-sport-olympic',
  'sport-retro-poster': 'pal-style-sport-retro-poster',
  'sport-team-uniform': 'pal-style-sport-team-uniform',
  'sport-winter': 'pal-style-sport-winter',
  'steel-cold-rolled-coil': 'pal-style-steel-cold-rolled-coil',
  'steel-continuous-casting': 'pal-style-steel-continuous-casting',
  'steel-gigasteel-automotive': 'pal-style-steel-gigasteel-automotive',
  'steel-heavy-plate': 'pal-style-steel-heavy-plate',
  'steel-hot-rolling': 'pal-style-steel-hot-rolling',
  'steel-hydrogen-reduction': 'pal-style-steel-hydrogen-reduction',
  'steel-smart-factory': 'pal-style-steel-smart-factory',
  'steel-stainless-corrosion': 'pal-style-steel-stainless-corrosion',
  'travel-airport-aviation': 'pal-style-travel-airport-aviation',
  'travel-backpacker-adventure': 'pal-style-travel-backpacker-adventure',
  'travel-cruise-oceanic': 'pal-style-travel-cruise-oceanic',
  'travel-eco-nature': 'pal-style-travel-eco-nature',
  'travel-korea-heritage': 'pal-style-travel-korea-heritage',
  'travel-luxury-resort': 'pal-style-travel-luxury-resort',
  'travel-urban-explorer': 'pal-style-travel-urban-explorer',
  'travel-wilderness-expedition': 'pal-style-travel-wilderness-expedition',
  'vintage': 'pal-style-vintage',
  'voxel': 'pal-style-voxel',
  'watercolor': 'pal-style-watercolor',
  'wellness-active-fitness': 'pal-style-wellness-active-fitness',
  'wellness-clean-nutrition': 'pal-style-wellness-clean-nutrition',
  'wellness-forest-therapy': 'pal-style-wellness-forest-therapy',
  'wellness-herbal-remedy': 'pal-style-wellness-herbal-remedy',
  'wellness-kbeauty-glow': 'pal-style-wellness-kbeauty-glow',
  'wellness-luxury-spa': 'pal-style-wellness-luxury-spa',
  'wellness-mindfulness-zen': 'pal-style-wellness-mindfulness-zen',
  'wellness-yoga-sunrise': 'pal-style-wellness-yoga-sunrise',
  '클립보드 이미지를 이 주제의 대표 샘플로 서버에 저장했습니다.': '서버 저장 실패: 로컬 브라우저에 임시 저장했습니다.',
  '클립보드 이미지를 이 화풍의 대표 샘플로 서버에 저장했습니다.': '서버 저장 실패: 로컬 브라우저에 임시 저장했습니다.',
  '🌙 다크': '☀️ 라이트',
};

  function autoMapPaletteForMedium(med) {
    if (!med || !med.id) return;
    if (isPaletteOverriddenByUser) return;

    // 1) 명시적 매핑
    const explicit = STYLE_TO_PALETTE_MAP[med.id] || STYLE_TO_PALETTE_MAP[med.nameEn] || STYLE_TO_PALETTE_MAP[med.nameKo] || (window && window.STYLE_TO_PALETTE_MAP && (window.STYLE_TO_PALETTE_MAP[med.id] || window.STYLE_TO_PALETTE_MAP[med.nameEn] || window.STYLE_TO_PALETTE_MAP[med.nameKo]));
    if (explicit) {
      const idx = MIXER_PALETTES.findIndex(p => p.id === explicit);
      if (idx >= 0) { selectedPaletteIdx = idx; syncPaletteSelection(); return; }
    }

    // 2) CONCEPT_STYLES와 이름/태그 매칭
    try {
      if (window && Array.isArray(window.CONCEPT_STYLES)) {
        const found = window.CONCEPT_STYLES.find(s => s.id === med.id || s.nameEn === med.nameEn || s.nameKo === med.nameKo || (s.tags && s.tags.includes(med.id)));
        if (found && Array.isArray(found.palette) && found.palette.length) {
          const pid = `pal-style-${found.id}`;
          let idx = MIXER_PALETTES.findIndex(p => p.id === pid);
          if (idx === -1) {
            MIXER_PALETTES.push({ id: pid, category: 'concept', name: found.nameKo || found.nameEn || (`Style ${found.id}`), mode: 'light', colors: found.palette.slice(0,5), colorMapping: `컨셉 프리셋: ${found.nameEn || found.nameKo}` });
            idx = MIXER_PALETTES.findIndex(p => p.id === pid);
          }
          if (idx >= 0) { selectedPaletteIdx = idx; syncPaletteSelection(); return; }
        }
      }
    } catch (e) { /* noop */ }

    // 3) 키워드 기반 휴리스틱 매핑
    const text = [med.id, med.nameEn, med.nameKo, med.desc, med.prefix, med.suffix].filter(Boolean).join(' ').toLowerCase();
    const keywordMap = [
      { keys: ['pixel','voxel','sprite','retro','8bit','16bit','pixel-art','voxel'], palette: 'pal-lego' },
      { keys: ['lego','brick'], palette: 'pal-lego' },
      { keys: ['mario','nintendo'], palette: 'pal-mario' },
      { keys: ['roblox','roblo'], palette: 'pal-roblox' },
      { keys: ['mabinogi'], palette: 'pal-mabinogi' },
      { keys: ['webtoon','manhwa','korean webtoon'], palette: 'pal-webtoon' },
      { keys: ['chibi','kawaii','cute'], palette: 'pal-webtoon' },
      { keys: ['anime','manga','cel','cel shading','ghibli','studio ghibli'], palette: 'pal-anime-cinematic' },
      { keys: ['cinematic','film','movie','luts','color grading','cinematic'], palette: 'pal-film-grain' },
      { keys: ['flat','vector','bauhaus','duotone','pop art','popart','risograph','minimal'], palette: 'pal-canva' },
      { keys: ['watercolor','gouache','oil painting','oil','acrylic','painterly'], palette: 'pal-miricanvas' },
      { keys: ['neon','cyberpunk','holographic','glow'], palette: 'pal-cyber' },
      { keys: ['isometric','iso','lowpoly','low-poly','low poly'], palette: 'pal-canva' },
      { keys: ['bokeh','portrait','polaroid','vintage film','film grain','photorealistic'], palette: 'pal-film-grain' }
    ];

    for (const km of keywordMap) {
      for (const k of km.keys) {
        if (text.includes(k)) {
          const idx = MIXER_PALETTES.findIndex(p => p.id === km.palette);
          if (idx >= 0) { selectedPaletteIdx = idx; syncPaletteSelection(); return; }
        }
      }
    }

    // 4) 색상 HEX 겹침 기반 매핑
    if (med.colorHints && Array.isArray(med.colorHints) && med.colorHints.length) {
      let best = -1, bestScore = -1;
      MIXER_PALETTES.forEach((p, i) => {
        const common = p.colors.filter(c => med.colorHints.includes(c)).length;
        if (common > bestScore) { bestScore = common; best = i; }
      });
      if (best >= 0 && bestScore > 0) { selectedPaletteIdx = best; syncPaletteSelection(); return; }
    }

    // 5) 카테고리 기반 완화 매핑 (카테고리 이름이 정확히 일치하지 않을 수 있으므로 매핑 테이블 사용)
    const cat = String(med.category || '').toLowerCase();
    const CAT_TO_PALETTE_CATS = {
      tech3d: ['tech'],
      '3d': ['tech'],
      tech: ['tech'],
      game: ['energy','tech','soft'],
      pixel_adv: ['candy','soft'],
      analog: ['soft','nature'],
      graphic: ['soft','modern','graphic'],
      anime: ['photo','soft'],
      photo: ['photo'],
      craft: ['soft'],
      digital_paint: ['soft','modern'],
      arch: ['nature','soft','tech'],
      editorial: ['soft','photo'],
      official: ['soft','neutral'],
      modern: ['soft','modern'],
      nature: ['nature'],
      energy: ['energy']
    };

    const candidateCats = CAT_TO_PALETTE_CATS[cat] || [cat];
    for (const tryCat of candidateCats) {
      const idx = MIXER_PALETTES.findIndex(p => p.category === tryCat);
      if (idx >= 0) { selectedPaletteIdx = idx; syncPaletteSelection(); return; }
    }

    // 6) 최종 폴백: 가시성이 좋은 기본 팔레트 선택
    const fallback = MIXER_PALETTES.findIndex(p => p.category === 'soft' || p.category === 'nature' || p.category === 'tech');
    if (fallback >= 0) { selectedPaletteIdx = fallback; syncPaletteSelection(); return; }
  }

  // UI 동기화: selectedPaletteIdx에 맞춰 그리드 활성화 및 관련 입력 동기화
  function syncPaletteSelection() {
    try {
      const groupGrid = document.getElementById('mixerPalettesGroupGrid');
      if (groupGrid) {
        groupGrid.querySelectorAll('.mixer-item-card').forEach((el) => {
          const idx = parseInt(el.dataset.index, 10);
          el.classList.toggle('active', idx === selectedPaletteIdx);
          el.setAttribute('aria-pressed', String(idx === selectedPaletteIdx));
        });
      }
    } catch (e) {}
    // 추가: 팔레트 색상 입력/픽커 동기화(만약 존재하면)
    try { syncColorInputs && typeof syncColorInputs === 'function' && syncColorInputs(); } catch (e) {}
  }

    // 외부에서 스타일 id로 믹서 팔레트 적용하는 공개 함수
    window.applyMixerPaletteForStyle = function(styleOrId) {
      try {
        const styleId = typeof styleOrId === 'string' ? styleOrId : (styleOrId && styleOrId.id);
        if (!styleId) return false;
        const pid = `pal-style-${styleId}`;
        let idx = MIXER_PALETTES.findIndex(p => p.id === pid);

        // 명시적 매핑 확인
        if (idx === -1) {
          const explicit = STYLE_TO_PALETTE_MAP[styleId] || (window && window.STYLE_TO_PALETTE_MAP && window.STYLE_TO_PALETTE_MAP[styleId]);
          if (explicit) idx = MIXER_PALETTES.findIndex(p => p.id === explicit);
        }

        // 컨셉 프리셋으로부터 팔레트 생성 및 인덱스 찾기
        if (idx === -1 && window && Array.isArray(window.CONCEPT_STYLES)) {
          const s = window.CONCEPT_STYLES.find(st => st.id === styleId);
          if (s && Array.isArray(s.palette) && s.palette.length) {
            const newPid = `pal-style-${s.id}`;
            if (!MIXER_PALETTES.find(p => p.id === newPid)) {
              MIXER_PALETTES.push({
                id: newPid,
                category: 'concept',
                name: s.nameKo || s.nameEn || (`Style ${s.id}`),
                mode: 'light',
                colors: s.palette.slice(0,5),
                colorMapping: `컨셉 프리셋: ${s.nameEn || s.nameKo}`
              });
            }
            idx = MIXER_PALETTES.findIndex(p => p.id === newPid);
          }
        }

        if (idx >= 0) {
          selectedPaletteIdx = idx;
          // 카테고리 필터 초기화하여 추가된 팔레트 노출 보장
          activePaletteCategory = 'all';
          activePaletteFilter = 'all';
          activePaletteColorFilter = 'all';

          try {
            // 카테고리 탭 UI 동기화
            const catTabs = document.querySelectorAll('#mixerPaletteCategoryTabs .mixer-cat-btn');
            catTabs.forEach(btn => {
              btn.classList.toggle('active', btn.dataset.paletteCat === 'all');
            });
            const filterBtns = document.querySelectorAll('.mixer-pal-filter-btn');
            filterBtns.forEach(btn => {
              btn.classList.toggle('active', btn.dataset.palFilter === 'all');
            });
            const colorBtns = document.querySelectorAll('.mixer-pal-color-btn');
            colorBtns.forEach(btn => {
              btn.classList.toggle('active', btn.dataset.palColor === 'all');
            });
          } catch(e) {}

          try { switchStep(3); } catch(e) {}
          try { syncPaletteSelection(); } catch(e) {}
          try { renderPalettes(); } catch(e) {}
          try { renderPreviewCard(); } catch(e) {}
          const tabBtn = document.getElementById('tabBtnConceptMixer');
          if (tabBtn) tabBtn.click();
          return true;
        }
      } catch (err) { console.error(err); }
      return false;
    };

    // 샘플 채우기 등 외부 소스의 임의 팔레트를 믹서에 동기화
    window.applyMixerSamplePalette = function(colors, nameKo) {
      try {
        if (!Array.isArray(colors) || !colors.length) return false;
        const SAMPLE_PAL_ID = 'pal-sample-custom';
        const existing = MIXER_PALETTES.findIndex(p => p.id === SAMPLE_PAL_ID);
        const entry = {
          id: SAMPLE_PAL_ID,
          category: 'concept',
          name: nameKo || '샘플 팔레트',
          mode: 'light',
          colors: colors.slice(0, 5),
          colorMapping: '',
        };
        if (existing >= 0) {
          MIXER_PALETTES[existing] = entry;
          selectedPaletteIdx = existing;
        } else {
          MIXER_PALETTES.push(entry);
          selectedPaletteIdx = MIXER_PALETTES.length - 1;
        }
        activePaletteCategory = 'all';
        activePaletteFilter = 'all';
        activePaletteColorFilter = 'all';
        try { syncPaletteSelection(); } catch(e) {}
        try { renderPalettes(); } catch(e) {}
        try { renderPreviewCard(); } catch(e) {}
        return true;
      } catch(err) { console.error(err); }
      return false;
    };

      // 공개 API: 외부에서 쓰기 편하도록 몇 가지 헬퍼 노출
      try {
        if (typeof window !== 'undefined') {
          window.autoMapPaletteForMedium = autoMapPaletteForMedium;
          window.getStyleToPaletteMap = function() { return STYLE_TO_PALETTE_MAP; };
          window.setStyleToPaletteMap = function(map) { if (map && typeof map === 'object') Object.assign(STYLE_TO_PALETTE_MAP, map); return STYLE_TO_PALETTE_MAP; };
        }
      } catch (e) {}

    // 분류형 색상 테마(Palette) 렌더링
  function renderCompositions() {
    const grid = document.getElementById('conceptCompositionGrid');
    const container = document.getElementById('conceptMixerContainer');
    const targetGrid = grid || (container && container.querySelector('#mixerCompositionGrid'));
    if (!targetGrid) return;
    targetGrid.innerHTML = '';

    const list = MIXER_COMPOSITIONS.filter(c => {
      if (c.id === 'none') return false;
      if (activeCompositionCategory === 'all') return true;
      return c.category === activeCompositionCategory;
    });

    const displayList = [MIXER_COMPOSITIONS.find(c => c.id === 'none'), ...list].filter(Boolean);

    displayList.forEach(item => {
      const card = document.createElement('div');
      card.className = 'mixer-item';
      if (item.id === selectedCompositionId) card.classList.add('active');
      card.setAttribute('aria-pressed', String(item.id === selectedCompositionId));

      let thumbHtml = '';
      let hasCustom = false;
      let imageUrl = '';
      let keyword = '';

      if (item.id !== 'none') {
        const customSamples = getCustomSamplesForMed(item.id);
        hasCustom = Boolean(customSamples[0]);
        const sampleId = MIXER_COMPOSITION_SAMPLES[item.id] || 'photo-1618005182384-a83a8bd57fbe';
        imageUrl = customSamples[0] || UNSPLASH_CACHE[item.id] || ('https://images.unsplash.com/' + sampleId + '?w=320&auto=format&fit=crop&q=75');
        keyword = resolveSearchKeyword(item.id, item.suffix);

        thumbHtml = [
          '<div class="mixer-item-thumb">',
          '  <img src="' + imageUrl + '" alt="' + item.nameKo + ' 예시" />',
          '  <button type="button" class="mixer-item-thumb-settings-btn" title="이미지 설정">⚙️</button>',
          '  <div class="mixer-item-thumb-overlay" hidden>',
          '    <div class="overlay-header">',
          '      <span>이미지 설정</span>',
          '      <button type="button" class="overlay-close-btn">&times;</button>',
          '    </div>',
          '    <div class="overlay-body">',
          '      <input type="text" class="overlay-kw-input" value="' + keyword + '" placeholder="검색어 (영문)" style="width:100%; height:26px; border:1px solid #ccc; border-radius:4px; padding:0 4px; box-sizing:border-box; font-size:11px;" />',
          '      <div class="overlay-buttons" style="display:grid; grid-template-columns:1fr 1.5fr 1fr 1fr; gap:4px; margin-top:5px;">',
          '        <button type="button" class="overlay-btn btn-apply" style="height:24px; font-size:10px; cursor:pointer;" title="적용">✓</button>',
          '        <button type="button" class="overlay-btn btn-refresh" style="height:24px; font-size:10px; cursor:pointer;">🔄다음</button>',
          '        <button type="button" class="overlay-btn btn-replace" style="height:24px; font-size:10px; cursor:pointer;">📁파일</button>',
          '        <button type="button" class="overlay-btn btn-save" style="height:24px; font-size:10px; cursor:pointer;">💾저장</button>',
          '      </div>',
          '      <button type="button" class="overlay-btn btn-reset" ' + (hasCustom ? '' : 'disabled') + ' style="width:100%; height:24px; margin-top:4px; font-size:10px; cursor:pointer;">↩ 원본 복원</button>',
          '      <div class="overlay-status-msg" style="font-size:9px; color:#555; margin-top:3px; height:12px; overflow:hidden;"></div>',
          '    </div>',
          '  </div>',
          '  <input type="file" class="overlay-file-input" accept="image/*" hidden />',
          '</div>'
        ].join('\n');
      } else {
        thumbHtml = [
          '<div class="mixer-item-thumb" style="display:flex; align-items:center; justify-content:center; background:#f1f5f9; color:var(--text-secondary,#64748b);">',
          '  <span style="font-size: 24px;">❌</span>',
          '</div>'
        ].join('\n');
      }

      card.innerHTML = [
        thumbHtml,
        '<div class="mixer-item-text-wrap" style="padding: 10px;">',
        '  <div class="mixer-item-head">' + item.emoji + ' ' + item.nameKo + '</div>',
        '  <div class="mixer-item-desc" style="margin-top: 4.5px;">' + item.desc + '</div>',
        '</div>'
      ].join('\n');

      // 인라인 오버레이 바인딩 로직
      if (item.id !== 'none') {
        const settingsBtn = card.querySelector('.mixer-item-thumb-settings-btn');
        const overlay = card.querySelector('.mixer-item-thumb-overlay');
        const closeBtn = card.querySelector('.overlay-close-btn');
        const kwInput = card.querySelector('.overlay-kw-input');
        const applyBtn = card.querySelector('.btn-apply');
        const refreshBtn = card.querySelector('.btn-refresh');
        const replaceBtn = card.querySelector('.btn-replace');
        const fileInput = card.querySelector('.overlay-file-input');
        const saveBtn = card.querySelector('.btn-save');
        const resetBtn = card.querySelector('.btn-reset');
        const statusMsg = card.querySelector('.overlay-status-msg');
        const imgEl = card.querySelector('.mixer-item-thumb img');

        const setMsg = (txt, isErr = false) => {
          if (statusMsg) {
            statusMsg.textContent = txt;
            statusMsg.style.color = isErr ? '#dc2626' : '';
          }
        };

        settingsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          overlay.hidden = false;
        });

        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          overlay.hidden = true;
        });

        card.addEventListener('click', (e) => {
          if (overlay && !overlay.hidden) return; // 오버레이 켜져있을 땐 카드 선택 방지
          selectedCompositionId = item.id;
          container.querySelectorAll('#mixerCompositionGrid .mixer-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === item.id);
          });
          updateMixerSummaryBar();
          renderPreviewCard();
        });

        // 1) 검색어 적용
        applyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const val = kwInput.value.trim();
          if (!val) return;
          setCustomKeyword(item.id, val);
          setMsg('검색 키워드가 적용되었습니다.');
        });

        // 2) Unsplash 다음 사진
        refreshBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!getUnsplashKey()) {
            setMsg('unsplash API Key가 필요합니다.', true);
            return;
          }
          refreshBtn.disabled = true;
          refreshBtn.textContent = '...';
          setMsg('새 사진 불러오는 중...');
          delete UNSPLASH_CACHE[item.id];
          try {
            const query = kwInput.value.trim() || item.suffix.split(',')[0].trim();
            const url = await fetchUnsplashImage(item.id, query, true);
            if (url && imgEl) imgEl.src = url;
            setMsg('완료! 저장 버튼을 눌러 확정하세요.');
          } catch (err) {
            setMsg('사진 변경 실패', true);
          } finally {
            refreshBtn.disabled = false;
            refreshBtn.textContent = '🔄다음';
          }
        });

        // 3) 파일 교체 업로드
        replaceBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
          const file = fileInput.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = async ev => {
            const dataUrl = ev.target.result;
            setMsg('서버 저장 중...');
            try {
              const res = await fetch('/api/save-mixer-sample', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ medId: item.id, idx: 0, image: dataUrl })
              });
              const ret = await res.json();
              if (ret.ok && ret.url) {
                setCustomSample(item.id, 0, ret.url);
                if (imgEl) imgEl.src = ret.url;
                setMsg('서버 저장 완료!');
                resetBtn.disabled = false;
              } else {
                throw new Error();
              }
            } catch (err) {
              setCustomSample(item.id, 0, dataUrl);
              if (imgEl) imgEl.src = dataUrl;
              setMsg('로컬 저장 완료 (임시)');
              resetBtn.disabled = false;
            }
          };
          reader.readAsDataURL(file);
        });

        // 4) 저장
        saveBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!imgEl || !imgEl.src) return;
          saveBtn.disabled = true;
          setMsg('서버 저장 중...');
          try {
            const res = await fetch('/api/save-mixer-sample', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ medId: item.id, idx: 0, image: imgEl.src })
            });
            const ret = await res.json();
            if (ret.ok && ret.url) {
              setCustomSample(item.id, 0, ret.url);
              setMsg('저장 성공!');
              resetBtn.disabled = false;
            } else {
              throw new Error();
            }
          } catch (err) {
            setCustomSample(item.id, 0, imgEl.src);
            setMsg('로컬 캐시 완료');
            resetBtn.disabled = false;
          } finally {
            saveBtn.disabled = false;
          }
        });

        // 5) 복원
        resetBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          clearCustomSample(item.id, 0);
          clearCustomKeyword(item.id);
          delete UNSPLASH_CACHE[item.id];
          const sampleId = MIXER_COMPOSITION_SAMPLES[item.id] || 'photo-1618005182384-a83a8bd57fbe';
          if (imgEl) imgEl.src = 'https://images.unsplash.com/' + sampleId + '?w=320&auto=format&fit=crop&q=75';
          kwInput.value = item.suffix.split(',')[0].trim();
          setMsg('기본 사진으로 복원되었습니다.');
          resetBtn.disabled = true;
        });
      } else {
        card.addEventListener('click', () => {
          selectedCompositionId = 'none';
          container.querySelectorAll('#mixerCompositionGrid .mixer-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === 'none');
          });
          updateMixerSummaryBar();
          renderPreviewCard();
        });
      }

      card.setAttribute('data-id', item.id);
      targetGrid.appendChild(card);
    });
  }

  function renderTypographies() {
    const grid = document.getElementById('conceptTypographyGrid');
    const container = document.getElementById('conceptMixerContainer');
    const targetGrid = grid || (container && container.querySelector('#mixerTypographyGrid'));
    if (!targetGrid) return;
    targetGrid.innerHTML = '';

    const list = MIXER_TYPOGRAPHIES.filter(r => {
      if (r.id === 'none') return false;
      if (activeTypographyCategory === 'all') return true;
      return r.category === activeTypographyCategory;
    });

    const displayList = [MIXER_TYPOGRAPHIES.find(r => r.id === 'none'), ...list].filter(Boolean);

    displayList.forEach(item => {
      const card = document.createElement('div');
      card.className = 'mixer-item';
      if (item.id === selectedTypographyId) card.classList.add('active');
      card.setAttribute('aria-pressed', String(item.id === selectedTypographyId));

      let thumbHtml = '';
      let hasCustom = false;
      let imageUrl = '';
      let keyword = '';

      if (item.id !== 'none') {
        const customSamples = getCustomSamplesForMed(item.id);
        hasCustom = Boolean(customSamples[0]);
        const sampleId = MIXER_TYPOGRAPHY_SAMPLES[item.id] || 'photo-1618005182384-a83a8bd57fbe';
        imageUrl = customSamples[0] || UNSPLASH_CACHE[item.id] || ('https://images.unsplash.com/' + sampleId + '?w=320&auto=format&fit=crop&q=75');
        keyword = resolveSearchKeyword(item.id, item.prompt);

        thumbHtml = [
          '<div class="mixer-item-thumb">',
          '  <img src="' + imageUrl + '" alt="' + item.nameKo + ' 예시" />',
          '  <button type="button" class="mixer-item-thumb-settings-btn" title="이미지 설정">⚙️</button>',
          '  <div class="mixer-item-thumb-overlay" hidden>',
          '    <div class="overlay-header">',
          '      <span>이미지 설정</span>',
          '      <button type="button" class="overlay-close-btn">&times;</button>',
          '    </div>',
          '    <div class="overlay-body">',
          '      <input type="text" class="overlay-kw-input" value="' + keyword + '" placeholder="검색어 (영문)" style="width:100%; height:26px; border:1px solid #ccc; border-radius:4px; padding:0 4px; box-sizing:border-box; font-size:11px;" />',
          '      <div class="overlay-buttons" style="display:grid; grid-template-columns:1fr 1.5fr 1fr 1fr; gap:4px; margin-top:5px;">',
          '        <button type="button" class="overlay-btn btn-apply" style="height:24px; font-size:10px; cursor:pointer;" title="적용">✓</button>',
          '        <button type="button" class="overlay-btn btn-refresh" style="height:24px; font-size:10px; cursor:pointer;">🔄다음</button>',
          '        <button type="button" class="overlay-btn btn-replace" style="height:24px; font-size:10px; cursor:pointer;">📁파일</button>',
          '        <button type="button" class="overlay-btn btn-save" style="height:24px; font-size:10px; cursor:pointer;">💾저장</button>',
          '      </div>',
          '      <button type="button" class="overlay-btn btn-reset" ' + (hasCustom ? '' : 'disabled') + ' style="width:100%; height:24px; margin-top:4px; font-size:10px; cursor:pointer;">↩ 원본 복원</button>',
          '      <div class="overlay-status-msg" style="font-size:9px; color:#555; margin-top:3px; height:12px; overflow:hidden;"></div>',
          '    </div>',
          '  </div>',
          '  <input type="file" class="overlay-file-input" accept="image/*" hidden />',
          '</div>'
        ].join('\n');
      } else {
        thumbHtml = [
          '<div class="mixer-item-thumb" style="display:flex; align-items:center; justify-content:center; background:#f1f5f9; color:var(--text-secondary,#64748b);">',
          '  <span style="font-size: 24px;">❌</span>',
          '</div>'
        ].join('\n');
      }

      card.innerHTML = [
        thumbHtml,
        '<div class="mixer-item-text-wrap" style="padding: 10px;">',
        '  <div class="mixer-item-head">' + item.emoji + ' ' + item.nameKo + '</div>',
        '  <div class="mixer-item-desc" style="margin-top: 4.5px;">' + item.desc + '</div>',
        '</div>'
      ].join('\n');

      // 인라인 오버레이 바인딩 로직
      if (item.id !== 'none') {
        const settingsBtn = card.querySelector('.mixer-item-thumb-settings-btn');
        const overlay = card.querySelector('.mixer-item-thumb-overlay');
        const closeBtn = card.querySelector('.overlay-close-btn');
        const kwInput = card.querySelector('.overlay-kw-input');
        const applyBtn = card.querySelector('.btn-apply');
        const refreshBtn = card.querySelector('.btn-refresh');
        const replaceBtn = card.querySelector('.btn-replace');
        const fileInput = card.querySelector('.overlay-file-input');
        const saveBtn = card.querySelector('.btn-save');
        const resetBtn = card.querySelector('.btn-reset');
        const statusMsg = card.querySelector('.overlay-status-msg');
        const imgEl = card.querySelector('.mixer-item-thumb img');

        const setMsg = (txt, isErr = false) => {
          if (statusMsg) {
            statusMsg.textContent = txt;
            statusMsg.style.color = isErr ? '#dc2626' : '';
          }
        };

        settingsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          overlay.hidden = false;
        });

        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          overlay.hidden = true;
        });

        card.addEventListener('click', (e) => {
          if (overlay && !overlay.hidden) return;
          selectedTypographyId = item.id;
          container.querySelectorAll('#mixerTypographyGrid .mixer-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === item.id);
          });
          updateMixerSummaryBar();
          renderPreviewCard();
        });

        // 1) 검색어 적용
        applyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const val = kwInput.value.trim();
          if (!val) return;
          setCustomKeyword(item.id, val);
          setMsg('검색 키워드가 적용되었습니다.');
        });

        // 2) Unsplash 다음 사진
        refreshBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!getUnsplashKey()) {
            setMsg('unsplash API Key가 필요합니다.', true);
            return;
          }
          refreshBtn.disabled = true;
          refreshBtn.textContent = '...';
          setMsg('새 사진 불러오는 중...');
          delete UNSPLASH_CACHE[item.id];
          try {
            const query = kwInput.value.trim() || item.prompt.split(',')[0].trim();
            const url = await fetchUnsplashImage(item.id, query, true);
            if (url && imgEl) imgEl.src = url;
            setMsg('완료! 저장 버튼을 눌러 확정하세요.');
          } catch (err) {
            setMsg('사진 변경 실패', true);
          } finally {
            refreshBtn.disabled = false;
            refreshBtn.textContent = '🔄다음';
          }
        });

        // 3) 파일 교체 업로드
        replaceBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
          const file = fileInput.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = async ev => {
            const dataUrl = ev.target.result;
            setMsg('서버 저장 중...');
            try {
              const res = await fetch('/api/save-mixer-sample', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ medId: item.id, idx: 0, image: dataUrl })
              });
              const ret = await res.json();
              if (ret.ok && ret.url) {
                setCustomSample(item.id, 0, ret.url);
                if (imgEl) imgEl.src = ret.url;
                setMsg('서버 저장 완료!');
                resetBtn.disabled = false;
              } else {
                throw new Error();
              }
            } catch (err) {
              setCustomSample(item.id, 0, dataUrl);
              if (imgEl) imgEl.src = dataUrl;
              setMsg('로컬 저장 완료 (임시)');
              resetBtn.disabled = false;
            }
          };
          reader.readAsDataURL(file);
        });

        // 4) 저장
        saveBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!imgEl || !imgEl.src) return;
          saveBtn.disabled = true;
          setMsg('서버 저장 중...');
          try {
            const res = await fetch('/api/save-mixer-sample', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ medId: item.id, idx: 0, image: imgEl.src })
            });
            const ret = await res.json();
            if (ret.ok && ret.url) {
              setCustomSample(item.id, 0, ret.url);
              setMsg('저장 성공!');
              resetBtn.disabled = false;
            } else {
              throw new Error();
            }
          } catch (err) {
            setCustomSample(item.id, 0, imgEl.src);
            setMsg('로컬 캐시 완료');
            resetBtn.disabled = false;
          } finally {
            saveBtn.disabled = false;
          }
        });

        // 5) 복원
        resetBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          clearCustomSample(item.id, 0);
          clearCustomKeyword(item.id);
          delete UNSPLASH_CACHE[item.id];
          const sampleId = MIXER_TYPOGRAPHY_SAMPLES[item.id] || 'photo-1618005182384-a83a8bd57fbe';
          if (imgEl) imgEl.src = 'https://images.unsplash.com/' + sampleId + '?w=320&auto=format&fit=crop&q=75';
          kwInput.value = item.prompt.split(',')[0].trim();
          setMsg('기본 사진으로 복원되었습니다.');
          resetBtn.disabled = true;
        });
      } else {
        card.addEventListener('click', () => {
          selectedTypographyId = 'none';
          container.querySelectorAll('#mixerTypographyGrid .mixer-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === 'none');
          });
          updateMixerSummaryBar();
          renderPreviewCard();
        });
      }

      card.setAttribute('data-id', item.id);
      targetGrid.appendChild(card);
    });
  }

  function renderPalettes() {
    const groupGrid = document.getElementById('mixerPalettesGroupGrid');
    if (!groupGrid) return;

    groupGrid.innerHTML = '';
    const list = MIXER_PALETTES.filter(p => {
      if (p.id === 'none') return false;
      return (activePaletteCategory === 'all' || p.category === activePaletteCategory) &&
             (activePaletteFilter === 'all' || p.mode === activePaletteFilter) &&
             paletteMatchesColorFilter(p, activePaletteColorFilter) &&
             paletteMatchesTagFilter(p, activePaletteTagFilter);
    });

    const displayList = [MIXER_PALETTES.find(p => p.id === 'none'), ...list].filter(Boolean);
    const empty = document.getElementById('mixerPaletteEmpty');
    if (empty) empty.style.display = displayList.length ? 'none' : 'block';

    displayList.forEach(pal => {
        const palIdx = MIXER_PALETTES.indexOf(pal);
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'mixer-item-card' + (selectedPaletteIdx === palIdx ? ' active' : '');
        item.setAttribute('aria-pressed', String(selectedPaletteIdx === palIdx));
        item.setAttribute('data-index', palIdx);

        const weights = pal.colors.length >= 3 ? [55, 30, 15] : (pal.colors.length === 2 ? [65, 35] : [100]);
        const weightBarStr = pal.id === 'none' ? `
          <div class="mixer-palette-weight-bar" style="background: linear-gradient(135deg, #e2e8f0 25%, #f1f5f9 25%, #f1f5f9 50%, #e2e8f0 50%, #e2e8f0 75%, #f1f5f9 75%, #f1f5f9 100%); background-size: 20px 20px;"></div>
          <div class="mixer-palette-weight-labels">
            <span>자연 색상</span>
          </div>
        ` : `
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
        const badgeText = pal.id === 'none' ? '🎨 자연' : (pal.mode === 'dark' ? '🌙 다크' : '☀️ 라이트');
        const badgeClass = pal.id === 'none' ? 'light' : pal.mode;

        item.innerHTML = `
          <div class="mixer-palette-badge ${badgeClass}">${badgeText}</div>
          <div class="mixer-item-head">🎨 ${pal.name}</div>
          ${weightBarStr}
          <div class="mixer-item-desc" style="margin-top: 4.5px;">${pal.colorMapping}</div>
        `;

        item.addEventListener('click', () => {
          selectedPaletteIdx = palIdx;
          isPaletteOverriddenByUser = true;
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

    const categoryList = activeCategory === 'all'
      ? Object.values(MIXER_SUBJECTS).flat()
      : (MIXER_SUBJECTS[activeCategory] || []);
    const subject = categoryList.find(s => s.id === selectedSubjId) || categoryList[0];
    const medium = MIXER_MEDIUMS.find(m => m.id === selectedMediumId) || MIXER_MEDIUMS[0];
    const palette = MIXER_PALETTES[selectedPaletteIdx];

    if (!subject || !medium || !palette) return;

    const highlightHTML = buildMixedHighlightPromptHTML();
    const plainPrompt = buildMixedPrompt();

    // 1. 주제(Subject) 참고 이미지 관련 처리
    const customSubjectSamples = getCustomSamplesForMed(subject.id);
    const hasCustomSubjectSample = Boolean(customSubjectSamples[0]);
    const fallbackImg = MIXER_SUBJECT_CATEGORY_FALLBACKS[activeCategory] || MIXER_SUBJECT_CATEGORY_FALLBACKS['steel'] || 'photo-1618005182384-a83a8bd57fbe';
    const subjectImageUrl = customSubjectSamples[0] || UNSPLASH_CACHE[subject.id] || `https://images.unsplash.com/${fallbackImg}?w=900&auto=format&fit=crop&q=84`;

    // 2. 화풍(Medium) 참고 이미지 관련 처리
    const sampleIds = MIXER_MEDIUM_SAMPLES[medium.id] || ['photo-1618005182384-a83a8bd57fbe'];
    const customMediumSamples = getCustomSamplesForMed(medium.id);
    const hasCustomMediumSample = Boolean(customMediumSamples[0]);
    const mediumImageUrl = customMediumSamples[0] || UNSPLASH_CACHE[medium.id] || `https://images.unsplash.com/${sampleIds[0]}?w=900&auto=format&fit=crop&q=84`;

    // 3가지 이상의 풍성한 색상으로 쉬머 애니메이션용 그라데이션 선언
    const gradient = `linear-gradient(135deg, ${palette.colors[0]}, ${palette.colors[2] || palette.colors[1]}, ${palette.colors[palette.colors.length - 1]})`;

    cardWrap.innerHTML = `
      <div class="mixer-result-image">
        <!-- 좌측: 주제 참고 이미지 영역 -->
        <div class="mixer-result-image-half" id="subjectSampleHalf">
          <img src="${subjectImageUrl}" alt="${subject.nameKo} 주제 참고 이미지" />
          <div class="mixer-result-image-badge">주제 참고 이미지</div>
          <button type="button" class="mixer-half-settings-trigger" id="btnSubjectSampleSettings" title="주제 참고 이미지 설정">⚙️</button>

          <!-- 주제 설정 오버레이 패널 -->
          <div class="mixer-image-overlay-panel ${isSubjectOverlayOpen ? 'active' : ''}" id="panelSubjectSettings">
            <div class="panel-header">
              <span>주제 이미지 설정</span>
              <button type="button" class="panel-close-btn" id="btnSubjectSettingsClose">&times;</button>
            </div>
            <div class="panel-body">
              <div class="panel-keyword-row">
                <input type="text" id="subjectKeywordInput" value="${resolveSearchKeyword(subject.id, getSubjectDefaultKeyword(subject))}" placeholder="🔍 검색 키워드 (영문)" />
                <button type="button" class="panel-icon-btn" id="btnSubjectKeywordApply" title="적용">✓</button>
                <button type="button" class="panel-icon-btn" id="btnSubjectKeywordReset" title="초기화" ${getCustomKeyword(subject.id) ? '' : 'disabled'}>↺</button>
              </div>
              <div class="panel-actions-grid">
                <button type="button" class="panel-action-btn" id="btnSubjectSampleRefresh">🔄 다음</button>
                <button type="button" class="panel-action-btn" id="btnSubjectSampleReplace">📁 교체</button>
                <button type="button" class="panel-action-btn" id="btnSubjectSampleSave">💾 저장</button>
                <button type="button" class="panel-action-btn" id="btnSubjectSampleReset" ${hasCustomSubjectSample ? '' : 'disabled'}>↩ 복원</button>
              </div>
              <button type="button" class="panel-action-btn panel-action-btn-wide" id="btnSubjectSamplePaste">📋 클립보드 붙여넣기</button>
              <div class="panel-status-msg" id="subjectToolStatus"></div>
            </div>
          </div>
          <input type="file" id="subjectFileInput" accept="image/*" hidden />
        </div>

        <!-- 우측: 화풍 참고 이미지 영역 -->
        <div class="mixer-result-image-half" id="mediumSampleHalf" style="border-left: 1px solid var(--line, #e2e8f0);">
          <img src="${mediumImageUrl}" alt="${medium.nameKo} 화풍 참고 이미지" />
          <div class="mixer-result-image-badge">화풍 참고 이미지</div>
          <button type="button" class="mixer-half-settings-trigger" id="btnMediumSampleSettings" title="화풍 참고 이미지 설정">⚙️</button>

          <!-- 화풍 설정 오버레이 패널 -->
          <div class="mixer-image-overlay-panel ${isMediumOverlayOpen ? 'active' : ''}" id="panelMediumSettings">
            <div class="panel-header">
              <span>화풍 이미지 설정</span>
              <button type="button" class="panel-close-btn" id="btnMediumSettingsClose">&times;</button>
            </div>
            <div class="panel-body">
              <div class="panel-keyword-row">
                <input type="text" id="mediumKeywordInput" value="${resolveSearchKeyword(medium.id, medium.suffix)}" placeholder="🔍 검색 키워드 (영문)" />
                <button type="button" class="panel-icon-btn" id="btnMediumKeywordApply" title="적용">✓</button>
                <button type="button" class="panel-icon-btn" id="btnMediumKeywordReset" title="초기화" ${getCustomKeyword(medium.id) ? '' : 'disabled'}>↺</button>
              </div>
              <div class="panel-actions-grid">
                <button type="button" class="panel-action-btn" id="btnMediumSampleRefresh">🔄 다음</button>
                <button type="button" class="panel-action-btn" id="btnMediumSampleReplace">📁 교체</button>
                <button type="button" class="panel-action-btn" id="btnMediumSampleSave">💾 저장</button>
                <button type="button" class="panel-action-btn" id="btnMediumSampleReset" ${hasCustomMediumSample ? '' : 'disabled'}>↩ 복원</button>
              </div>
              <button type="button" class="panel-action-btn panel-action-btn-wide" id="btnMediumSamplePaste">📋 클립보드 붙여넣기</button>
              <div class="panel-status-msg" id="mediumToolStatus"></div>
            </div>
          </div>
          <input type="file" id="mediumFileInput" accept="image/*" hidden />
        </div>
      </div>
      <div class="mixer-preview-header" style="background:${gradient}">
        <div class="mixer-preview-meta">
          <div class="mixer-preview-meta-item">
            <span class="mixer-preview-meta-label">주제</span>
            <strong class="mixer-preview-meta-value">${subject.nameKo}</strong>
          </div>
          <div class="mixer-preview-meta-item">
            <span class="mixer-preview-meta-label">화풍</span>
            <strong class="mixer-preview-meta-value">${medium.nameKo}</strong>
          </div>
        </div>
        <div class="mixer-preview-footer">
          <span class="mixer-preview-code">#MIX-${subject.id.replace('mix-','').toUpperCase()}-${medium.id.replace('med-','').toUpperCase()}</span>
          <span class="mixer-preview-palette">${palette.name}</span>
        </div>
      </div>
      <div class="mixer-preview-body">
        <div class="mixer-custom-subject-row">
          <label class="mixer-custom-subject-label">주제 커스텀</label>
          <div class="mixer-custom-mode-toggle">
            <button type="button" class="mixer-custom-mode-btn${customSubjectMode === 'ko' ? ' active' : ''}" id="btnMixerModeKo">🇰🇷 한글번역</button>
            <button type="button" class="mixer-custom-mode-btn${customSubjectMode === 'en' ? ' active' : ''}" id="btnMixerModeEn">🔤 영어직접</button>
          </div>
          <input type="text" id="mixerCustomSubjectInput" class="mixer-custom-subject-input"
            placeholder="${customSubjectMode === 'ko' ? '한글 주제어 (예: 이차전지)' : 'English keyword (e.g. battery)'}"
            value="${escapeMixerHTML(customSubjectMode === 'ko' ? customSubjectKo : customSubjectEn)}" />
          <button type="button" class="mixer-custom-subject-apply" id="btnMixerCustomSubjectApply">적용</button>
          <button type="button" class="mixer-custom-subject-clear" id="btnMixerCustomSubjectClear" ${(customSubjectKo || customSubjectEn) ? '' : 'disabled'}>초기화</button>
        </div>
        ${customSubjectMode === 'ko' && customSubjectEn ? `<div class="mixer-custom-subject-preview">→ <em>${escapeMixerHTML(customSubjectEn)}</em></div>` : ''}
        <details class="mixer-prompt-details" open>
          <summary>완성 프롬프트</summary>
          <pre class="mixer-preview-prompt-box" id="mixerCombinedPromptText">${highlightHTML}</pre>
        </details>
        <div class="mixer-feedback" id="mixerFeedback">✓ 클립보드 복사 완료!</div>
        <div class="mixer-preview-actions">
          <button type="button" class="mixer-action-btn copy" id="btnMixerCopy">프롬프트 복사</button>
          <button type="button" class="mixer-action-btn apply" id="btnMixerApply">홍보 이미지에 적용</button>
          <button type="button" class="mixer-action-btn slidedoc" id="btnMixerSlideDoc">부속 양식에 적용</button>
        </div>
      </div>
    `;

    // -------------------------------------------------------------
    // 커스텀 주제어 이벤트 바인딩
    // -------------------------------------------------------------
    const customInput = cardWrap.querySelector('#mixerCustomSubjectInput');
    const customApplyBtn = cardWrap.querySelector('#btnMixerCustomSubjectApply');
    const customClearBtn = cardWrap.querySelector('#btnMixerCustomSubjectClear');
    const btnModeKo = cardWrap.querySelector('#btnMixerModeKo');
    const btnModeEn = cardWrap.querySelector('#btnMixerModeEn');

    async function applyCustomSubject() {
      const val = (customInput.value || '').trim();
      if (!val) {
        customSubjectKo = '';
        customSubjectEn = '';
        renderPreviewCard();
        return;
      }

      if (customSubjectMode === 'en') {
        customSubjectKo = '';
        customSubjectEn = val;
        renderPreviewCard();
        return;
      }

      // 한글번역 모드 — 사전 우선, 없으면 MyMemory API
      const exactMatch = KO_EN_SUBJECT_MAP[val];
      if (exactMatch) {
        customSubjectKo = val;
        customSubjectEn = exactMatch;
        renderPreviewCard();
        return;
      }

      // 사전 미등록 → MyMemory 호출
      customApplyBtn.textContent = '번역 중...';
      customApplyBtn.disabled = true;
      const translated = await translateWithMyMemory(val);
      customSubjectKo = val;
      customSubjectEn = translated || resolveCustomSubjectEn(val);
      renderPreviewCard();
    }

    customApplyBtn.addEventListener('click', applyCustomSubject);
    customInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') applyCustomSubject();
    });
    customClearBtn.addEventListener('click', () => {
      customSubjectKo = '';
      customSubjectEn = '';
      renderPreviewCard();
    });
    btnModeKo.addEventListener('click', () => {
      if (customSubjectMode === 'ko') return;
      customSubjectMode = 'ko';
      customSubjectKo = '';
      customSubjectEn = '';
      renderPreviewCard();
    });
    btnModeEn.addEventListener('click', () => {
      if (customSubjectMode === 'en') return;
      customSubjectMode = 'en';
      customSubjectKo = '';
      customSubjectEn = '';
      renderPreviewCard();
    });

    // -------------------------------------------------------------
    // 패널 열기/닫기 이벤트 바인딩
    // -------------------------------------------------------------
    const subjectPanel = cardWrap.querySelector('#panelSubjectSettings');
    const subjectSettingsBtn = cardWrap.querySelector('#btnSubjectSampleSettings');
    const subjectCloseBtn = cardWrap.querySelector('#btnSubjectSettingsClose');

    subjectSettingsBtn.addEventListener('click', () => {
      isSubjectOverlayOpen = true;
      subjectPanel.classList.add('active');
    });
    subjectCloseBtn.addEventListener('click', () => {
      isSubjectOverlayOpen = false;
      subjectPanel.classList.remove('active');
    });

    const mediumPanel = cardWrap.querySelector('#panelMediumSettings');
    const mediumSettingsBtn = cardWrap.querySelector('#btnMediumSampleSettings');
    const mediumCloseBtn = cardWrap.querySelector('#btnMediumSettingsClose');

    mediumSettingsBtn.addEventListener('click', () => {
      isMediumOverlayOpen = true;
      mediumPanel.classList.add('active');
    });
    mediumCloseBtn.addEventListener('click', () => {
      isMediumOverlayOpen = false;
      mediumPanel.classList.remove('active');
    });

    // -------------------------------------------------------------
    // 1. 주제(Subject) 설정 관련 이벤트 연동
    // -------------------------------------------------------------
    const subjectImg = cardWrap.querySelector('#subjectSampleHalf img');
    const subjectStatus = cardWrap.querySelector('#subjectToolStatus');
    const subjectFileInput = cardWrap.querySelector('#subjectFileInput');
    const setSubjectStatus = (message, isError = false) => {
      if (!subjectStatus) return;
      subjectStatus.textContent = message;
      subjectStatus.style.color = isError ? '#dc2626' : '';
    };

    cardWrap.querySelector('#btnSubjectSampleReplace').addEventListener('click', () => {
      subjectFileInput.click();
    });
    subjectFileInput.addEventListener('change', () => {
      const file = subjectFileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async event => {
        const dataUrl = event.target.result;
        setSubjectStatus('사진을 서버에 저장하는 중…');
        try {
          const response = await fetch('/api/save-mixer-sample', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              medId: subject.id,
              idx: 0,
              image: dataUrl
            })
          });
          const result = await response.json();
          if (result.ok && result.url) {
            setCustomSample(subject.id, 0, result.url);
            setSubjectStatus('사진을 이 주제의 대표 샘플로 서버에 저장했습니다.');
          } else {
            throw new Error(result.error || '업로드 실패');
          }
        } catch (err) {
          console.error(err);
          setCustomSample(subject.id, 0, dataUrl);
          setSubjectStatus('서버 저장 실패: 로컬 브라우저에 임시 저장했습니다.', true);
        }
        isSubjectOverlayOpen = false; // 완료 시 오버레이 닫기
        renderPreviewCard();
      };
      reader.readAsDataURL(file);
    });

    cardWrap.querySelector('#btnSubjectSampleRefresh').addEventListener('click', async event => {
      const button = event.currentTarget;
      if (!getUnsplashKey()) {
        setSubjectStatus('unsplash API 설정에서 Access Key를 먼저 저장해 주세요.', true);
        return;
      }
      button.disabled = true;
      button.textContent = '불러오는 중…';
      setSubjectStatus('새 주제 샘플을 검색하고 있습니다.');
      delete UNSPLASH_CACHE[subject.id];
      try {
        const url = await fetchUnsplashImage(subject.id, getSubjectDefaultKeyword(subject), true);
        if (!url) throw new Error('검색 결과 없음');
        if (subjectImg) subjectImg.src = url;
        setSubjectStatus('새 사진을 불러왔습니다. 마음에 들면 저장하세요.');
        renderPreviewCard(); // 즉시 미리보기 갱신 (오버레이는 열려있음)
      } catch (error) {
        setSubjectStatus(error.message.includes('403') ? 'Unsplash 요청 한도를 확인해 주세요.' : '사진을 불러오지 못했습니다.', true);
      } finally {
        button.disabled = false;
        button.textContent = '다른 사진';
      }
    });

    cardWrap.querySelector('#btnSubjectSampleSave').addEventListener('click', async event => {
      if (!subjectImg?.src) return;
      const button = event.currentTarget;
      button.disabled = true;
      setSubjectStatus('현재 사진을 서버에 저장하는 중…');
      try {
        const response = await fetch('/api/save-mixer-sample', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            medId: subject.id,
            idx: 0,
            image: subjectImg.src
          })
        });
        const result = await response.json();
        if (result.ok && result.url) {
          setCustomSample(subject.id, 0, result.url);
          setSubjectStatus('현재 사진을 이 주제의 대표 샘플로 서버에 저장했습니다.');
          button.textContent = '저장됨';
          isSubjectOverlayOpen = false; // 완료 시 오버레이 닫기
        } else {
          throw new Error(result.error || '업로드 실패');
        }
      } catch (err) {
        console.error(err);
        setCustomSample(subject.id, 0, subjectImg.src);
        setSubjectStatus('서버 저장 실패: 로컬 브라우저에 임시 저장했습니다.', true);
        button.textContent = '저장됨';
        isSubjectOverlayOpen = false; // 완료 시 오버레이 닫기
      } finally {
        button.disabled = false;
        setTimeout(() => renderPreviewCard(), 700);
      }
    });

    cardWrap.querySelector('#btnSubjectSamplePaste').addEventListener('click', async event => {
      const button = event.currentTarget;
      button.disabled = true;
      setSubjectStatus('클립보드 이미지를 읽는 중…');
      try {
        const dataUrl = await readClipboardImageDataUrl();
        if (subjectImg) subjectImg.src = dataUrl;
        setSubjectStatus('클립보드 이미지를 저장하는 중…');
        const where = await uploadMixerSample(subject.id, dataUrl);
        setSubjectStatus(where === 'server'
          ? '클립보드 이미지를 이 주제의 대표 샘플로 서버에 저장했습니다.'
          : '서버 저장 실패: 로컬 브라우저에 임시 저장했습니다.', where !== 'server');
        isSubjectOverlayOpen = false; // 완료 시 오버레이 닫기
        renderPreviewCard();
      } catch (err) {
        setSubjectStatus(err.message, true);
        button.disabled = false;
      }
    });

    cardWrap.querySelector('#btnSubjectSampleReset').addEventListener('click', () => {
      clearCustomSample(subject.id, 0);
      delete UNSPLASH_CACHE[subject.id];
      renderPreviewCard();
    });

    const subjectKeywordInput = cardWrap.querySelector('#subjectKeywordInput');
    const subjectKeywordApplyBtn = cardWrap.querySelector('#btnSubjectKeywordApply');
    subjectKeywordApplyBtn.addEventListener('click', () => {
      const keyword = subjectKeywordInput.value.trim();
      if (!keyword) {
        setSubjectStatus('검색 키워드를 입력해 주세요.', true);
        return;
      }
      setCustomKeyword(subject.id, keyword);
      delete UNSPLASH_CACHE[subject.id];
      setSubjectStatus('키워드를 저장했습니다.');
      renderPreviewCard();
    });
    subjectKeywordInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') subjectKeywordApplyBtn.click();
    });

    cardWrap.querySelector('#btnSubjectKeywordReset').addEventListener('click', () => {
      clearCustomKeyword(subject.id);
      delete UNSPLASH_CACHE[subject.id];
      renderPreviewCard();
    });

    // -------------------------------------------------------------
    // 2. 화풍(Medium) 설정 관련 이벤트 연동
    // -------------------------------------------------------------
    const mediumImg = cardWrap.querySelector('#mediumSampleHalf img');
    const mediumStatus = cardWrap.querySelector('#mediumToolStatus');
    const mediumFileInput = cardWrap.querySelector('#mediumFileInput');
    const setMediumStatus = (message, isError = false) => {
      if (!mediumStatus) return;
      mediumStatus.textContent = message;
      mediumStatus.style.color = isError ? '#dc2626' : '';
    };

    cardWrap.querySelector('#btnMediumSampleReplace').addEventListener('click', () => {
      mediumFileInput.click();
    });
    mediumFileInput.addEventListener('change', () => {
      const file = mediumFileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async event => {
        const dataUrl = event.target.result;
        setMediumStatus('사진을 서버에 저장하는 중…');
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
            setMediumStatus('사진을 이 화풍의 대표 샘플로 서버에 저장했습니다.');
          } else {
            throw new Error(result.error || '업로드 실패');
          }
        } catch (err) {
          console.error(err);
          setCustomSample(medium.id, 0, dataUrl);
          setMediumStatus('서버 저장 실패: 로컬 브라우저에 임시 저장했습니다.', true);
        }
        isMediumOverlayOpen = false; // 완료 시 오버레이 닫기
        renderPreviewCard();
      };
      reader.readAsDataURL(file);
    });

    cardWrap.querySelector('#btnMediumSampleRefresh').addEventListener('click', async event => {
      const button = event.currentTarget;
      if (!getUnsplashKey()) {
        setMediumStatus('unsplash API 설정에서 Access Key를 먼저 저장해 주세요.', true);
        return;
      }
      button.disabled = true;
      button.textContent = '불러오는 중…';
      setMediumStatus('새 화풍 샘플을 검색하고 있습니다.');
      delete UNSPLASH_CACHE[medium.id];
      try {
        const url = await fetchUnsplashImage(medium.id, medium.suffix, true);
        if (!url) throw new Error('검색 결과 없음');
        if (mediumImg) mediumImg.src = url;
        setMediumStatus('새 사진을 불러왔습니다. 마음에 들면 저장하세요.');
        renderPreviewCard(); // 즉시 미리보기 갱신 (오버레이는 열려있음)
      } catch (error) {
        setMediumStatus(error.message.includes('403') ? 'Unsplash 요청 한도를 확인해 주세요.' : '사진을 불러오지 못했습니다.', true);
      } finally {
        button.disabled = false;
        button.textContent = '다른 사진';
      }
    });

    cardWrap.querySelector('#btnMediumSampleSave').addEventListener('click', async event => {
      if (!mediumImg?.src) return;
      const button = event.currentTarget;
      button.disabled = true;
      setMediumStatus('현재 사진을 서버에 저장하는 중…');
      try {
        const response = await fetch('/api/save-mixer-sample', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            medId: medium.id,
            idx: 0,
            image: mediumImg.src
          })
        });
        const result = await response.json();
        if (result.ok && result.url) {
          setCustomSample(medium.id, 0, result.url);
          setMediumStatus('현재 사진을 이 화풍의 대표 샘플로 서버에 저장했습니다.');
          button.textContent = '저장됨';
          isMediumOverlayOpen = false; // 완료 시 오버레이 닫기
        } else {
          throw new Error(result.error || '업로드 실패');
        }
      } catch (err) {
        console.error(err);
        setCustomSample(medium.id, 0, mediumImg.src);
        setMediumStatus('서버 저장 실패: 로컬 브라우저에 임시 저장했습니다.', true);
        button.textContent = '저장됨';
        isMediumOverlayOpen = false; // 완료 시 오버레이 닫기
      } finally {
        button.disabled = false;
        setTimeout(() => renderPreviewCard(), 700);
      }
    });

    cardWrap.querySelector('#btnMediumSamplePaste').addEventListener('click', async event => {
      const button = event.currentTarget;
      button.disabled = true;
      setMediumStatus('클립보드 이미지를 읽는 중…');
      try {
        const dataUrl = await readClipboardImageDataUrl();
        if (mediumImg) mediumImg.src = dataUrl;
        setMediumStatus('클립보드 이미지를 저장하는 중…');
        const where = await uploadMixerSample(medium.id, dataUrl);
        setMediumStatus(where === 'server'
          ? '클립보드 이미지를 이 화풍의 대표 샘플로 서버에 저장했습니다.'
          : '서버 저장 실패: 로컬 브라우저에 임시 저장했습니다.', where !== 'server');
        isMediumOverlayOpen = false; // 완료 시 오버레이 닫기
        renderPreviewCard();
      } catch (err) {
        setMediumStatus(err.message, true);
        button.disabled = false;
      }
    });

    cardWrap.querySelector('#btnMediumSampleReset').addEventListener('click', () => {
      clearCustomSample(medium.id, 0);
      delete UNSPLASH_CACHE[medium.id];
      renderPreviewCard();
    });

    const mediumKeywordInput = cardWrap.querySelector('#mediumKeywordInput');
    const mediumKeywordApplyBtn = cardWrap.querySelector('#btnMediumKeywordApply');
    mediumKeywordApplyBtn.addEventListener('click', () => {
      const keyword = mediumKeywordInput.value.trim();
      if (!keyword) {
        setMediumStatus('검색 키워드를 입력해 주세요.', true);
        return;
      }
      setCustomKeyword(medium.id, keyword);
      delete UNSPLASH_CACHE[medium.id];
      setMediumStatus('키워드를 저장했습니다.');
      renderPreviewCard();
    });
    mediumKeywordInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') mediumKeywordApplyBtn.click();
    });

    cardWrap.querySelector('#btnMediumKeywordReset').addEventListener('click', () => {
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

    // mixer medium.category → PROMOTION_PROMPT_DEFAULTS 키 매핑
    const MIXER_TO_PROMO_CATEGORY = {
      tech3d: '3d', analog: 'illustration', graphic: 'modern',
      anime: 'anime', photo: 'photo', craft: 'craft',
      game: 'game', nature_photo: 'nature', editorial: 'photo',
      abstract: 'modern', arch: 'arch', trad: 'culture',
      digital_paint: 'illustration', ui_ux: 'software',
      pixel_adv: 'game', official: 'modern', youtube_anim: 'illustration',
    };

    // mixer 선택 데이터 → 11개 구조화 promptParts 생성
    function buildMixerPromptParts(subj, med, pal, comp, typo) {
      const paletteColors = (pal && pal.colors) ? pal.colors : [];
      const paletteMapping = (pal && pal.colorMapping) ? pal.colorMapping : '';
      const paletteRoles = paletteColors.map((hex, i) => {
        const role = ['primary', 'secondary', 'accent', 'highlight', 'support'][i] || `color ${i + 1}`;
        return `${role} ${hex}`;
      });
      const paletteStr = paletteRoles.length > 0
        ? `Use the mixer palette as campaign color roles: ${paletteRoles.join(', ')}.${paletteMapping ? ' ' + paletteMapping : ''}`
        : (paletteMapping || 'Derive palette from the selected visual style');

      const medName = capitalizeId(med.id, 'med-');
      const subjName = capitalizeId(subj.id, 'mix-');
      const visualDNA = [medName, subjName].filter(Boolean).join(' — ');
      const shapeLanguage = subj.prompt
        ? subj.prompt.split('.')[0].trim()
        : `${subjName} subject in ${medName} style`;
      const textureRendering = med.suffix
        ? med.suffix.split(',').slice(0, 3).join(',').trim()
        : `${med.prefix} style rendering`;
      const lightingMood = typo && typo.prompt
        ? typo.prompt
        : `Typography style matched to the ${medName} visual language`;
      const layoutBehavior = comp
        ? `${comp.prefix}${comp.suffix ? ', ' + comp.suffix : ''}`
        : 'Hero subject centered with clear zones for headline, subtext, and CTA';

      const typoMap = {
        tech3d: 'Clean modern sans-serif placed on minimal planes; do not let typography compete with 3D depth',
        analog: 'Warm readable typography; handmade feel belongs in decoration, not legibility-critical copy',
        graphic: 'Confident graphic typography integrated into the design system',
        anime: 'Dynamic graphic lettering or clean placement complementing the illustration style',
        photo: 'Restrained editorial typography placed on flat or blurred zones away from subject detail',
        craft: 'Warm readable sans-serif; handcrafted feel in decoration only, not headline text',
        game: 'Bold display type or game UI label treatment; keep copy short and legible',
        nature_photo: 'Clean nature-complementary typography with strong legibility over organic backgrounds',
        editorial: 'Restrained editorial typography on uncluttered background zones',
        abstract: 'Bold geometric typography that complements abstract forms without visual competition',
        arch: 'Restrained modern sans-serif with strong alignment and generous white space',
        trad: 'Traditional or cultural typography matched to the aesthetic; maintain legibility',
        digital_paint: 'Match type mood to the painting style; headline stays sharp and legible',
        ui_ux: 'System UI or modern screen typography with strong readability hierarchy',
        pixel_adv: 'Bold pixel-friendly or chunky sans-serif matching the pixel art energy',
        official: 'Professional sans-serif with clear hierarchy for institutional communication',
        youtube_anim: 'Energetic animation-friendly typography with bold scale contrast',
      };
      const typographyGuidance = typoMap[med.category] ||
        'Bold, clean sans-serif typography with strong contrast against the background';

      return {
        visualDNA,
        paletteStrategy: paletteStr,
        textureRendering,
        lightingMood,
        shapeLanguage,
        layoutBehavior,
        typographyGuidance,
        campaignAdaptation: `Present the promotional message through the ${medName} visual language — keep the style recognizable while centering the campaign goal`,
        objectAdaptation: `Render the promoted item or service as the primary subject within a ${medName} composition featuring ${subjName}`,
        avoid: `avoid style inconsistency, unrelated decorative elements outside the ${medName} aesthetic, and mismatched rendering qualities`,
        qualityRules: `maintain ${medName} fidelity, clear subject readability, and campaign message legibility at all text overlay zones`,
      };
    }

    // 적용 이벤트
    cardWrap.querySelector('#btnMixerApply').addEventListener('click', () => {
      if (typeof window.applyPromotionConceptStyle === 'function') {
        const composition = resolveMixerComposition();
        const typography = resolveMixerTypography();

        let styleId = `mix-${subject.id}-${medium.id}`;
        let styleNameKo = `${subject.nameKo} (${medium.nameKo})`;
        let styleNameEn = `${capitalizeId(subject.id, 'mix-')} (${capitalizeId(medium.id, 'med-')})`;
        let styleDesc = `${subject.nameKo}에 ${medium.nameKo} 기법을 다차원으로 믹싱한 스타일입니다.`;
        let styleDescEn = `A style that multi-dimensionally mixes ${capitalizeId(subject.id, 'mix-')} with ${capitalizeId(medium.id, 'med-')} technique.`;
        const styleTags = [activeCategory, 'mixer', subject.nameKo, medium.nameKo];

        if (composition) {
          styleId += `-${composition.id}`;
          styleNameKo += ` [${composition.nameKo}]`;
          styleNameEn += ` [${capitalizeId(composition.id, 'comp-')}]`;
          styleDesc += ` 구도는 ${composition.nameKo}을(를) 취합니다.`;
          styleDescEn += ` The composition takes ${capitalizeId(composition.id, 'comp-')}.`;
          styleTags.push(composition.nameKo);
        }
        if (typography) {
          styleId += `-${typography.id}`;
          styleNameKo += ` + ${typography.nameKo}`;
          styleNameEn += ` + ${capitalizeId(typography.id, 'typo-')}`;
          styleDesc += ` 타이포그래피 스타일로 ${typography.nameKo}을(를) 적용합니다.`;
          styleDescEn += ` The typography style applies ${capitalizeId(typography.id, 'typo-')}.`;
          styleTags.push(typography.nameKo);
        }

        const mixerPromptParts = buildMixerPromptParts(subject, medium, palette, composition, typography);
        const mappedCategory = MIXER_TO_PROMO_CATEGORY[medium.category] || 'modern';

        let dummyStyle = {
          id: styleId,
          category: mappedCategory,
          mixerCategory: activeCategory,
          nameKo: styleNameKo,
          nameEn: styleNameEn,
          emoji: subject.emoji,
          desc: styleDesc,
          descEn: styleDescEn,
          palette: palette.colors,
          prompt: plainPrompt,
          promotionPrompt: plainPrompt,
          promptParts: mixerPromptParts,
          tags: styleTags
        };

        // 홍보 탭의 고도화된 프롬프트 파서가 로드되어 있으면 연동 (기존 promptParts 유지)
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

    cardWrap.querySelector('#btnMixerSlideDoc').addEventListener('click', () => {
      if (typeof window.applyMixerToSlideDocument === 'function') {
        const composition = resolveMixerComposition();
        const typography = resolveMixerTypography();
        const plainPrompt = buildMixedPrompt();
        const promptParts = buildMixerPromptParts(subject, medium, palette, composition, typography);
        let nameKo = `${subject.nameKo} (${medium.nameKo})`;
        let nameEn = `${capitalizeId(subject.id, 'mix-')} (${capitalizeId(medium.id, 'med-')})`;
        if (composition) { nameKo += ` [${composition.nameKo}]`; nameEn += ` [${capitalizeId(composition.id, 'comp-')}]`; }
        if (typography) { nameKo += ` + ${typography.nameKo}`; nameEn += ` + ${capitalizeId(typography.id, 'typo-')}`; }
        window.applyMixerToSlideDocument({
          nameKo, nameEn,
          prompt: plainPrompt,
          promptParts,
          palette,
          mediumKo: medium.nameKo,
          mediumEn: capitalizeId(medium.id, 'med-'),
          mediumRendering: medium.suffix || '',
          colorRoles: promptParts.paletteStrategy || '',
          textureInfo: promptParts.textureRendering || '',
          layoutFeel: promptParts.layoutBehavior || '',
          typographyGuidance: promptParts.typographyGuidance || '',
        });
      } else {
        alert('부속 양식 탭을 찾을 수 없습니다.');
      }
    });
  }


  // 독립 화풍 믹서 탭 초기화
  document.addEventListener('DOMContentLoaded', () => {
    const mixerContainer = document.getElementById('conceptMixerContainer');
    if (!mixerContainer) return;
    // 서버 manifest 로드 후 초기화 — 커스텀 이미지가 즉시 반영됨
    loadMixerManifest().finally(() => initConceptMixer());
  });

})();
